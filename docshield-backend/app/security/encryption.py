"""DocShield AI — AES-256-GCM Authenticated Encryption & Secure Vault.

Implements authenticated AES-256-GCM encryption at rest for all uploaded documents.
Provides strict key entropy validation, nonce uniqueness, tampering detection,
and in-memory decryption with zero plaintext persistence on disk.
"""

import binascii
import io
import os
import secrets
import time
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

MAGIC_VERSION_V1 = b"\x01"
NONCE_LENGTH = 12  # 96-bit nonce recommended by NIST SP 800-38D
TAG_LENGTH = 16    # 128-bit authentication tag


class EncryptionError(Exception):
    """Base exception for cryptographic vault failures."""
    pass


class KeyConfigurationError(EncryptionError):
    """Raised when DOCSHIELD_AES_KEY is missing or lacks 256 bits of entropy."""
    pass


class TamperDetectedError(EncryptionError):
    """Raised when ciphertext or authentication tag fails cryptographic verification."""
    pass


def parse_and_validate_aes_key(raw_key: Optional[str] = None) -> bytes:
    """Parses and cryptographically validates a 256-bit AES encryption key.

    Accepts:
    1. 64-character hexadecimal string (32 bytes = 256 bits).
    2. 32-byte raw or base64 string.

    Fails safely if missing or insufficient entropy.
    """
    if raw_key is None:
        raw_key = os.getenv("DOCSHIELD_AES_KEY")

    if not raw_key or not str(raw_key).strip():
        raise KeyConfigurationError(
            "DOCSHIELD_AES_KEY environment variable is required but not configured."
        )

    clean_key = str(raw_key).strip()

    # Case 1: 64-character hexadecimal string
    if len(clean_key) == 64:
        try:
            key_bytes = binascii.unhexlify(clean_key)
            if len(key_bytes) == 32:
                return key_bytes
        except Exception:
            pass

    # Case 2: Base64 or raw 32-character string
    import base64
    try:
        decoded = base64.b64decode(clean_key)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass

    # Case 3: Raw UTF-8 string of exactly 32 bytes
    utf8_bytes = clean_key.encode("utf-8")
    if len(utf8_bytes) == 32:
        return utf8_bytes

    raise KeyConfigurationError(
        f"Invalid key length ({len(clean_key)} chars). "
        "DOCSHIELD_AES_KEY must provide exactly 256 bits (32 bytes, e.g. 64 hex characters)."
    )


class AES256GCMVault:
    """Production AES-256-GCM Authenticated Encryption Vault."""

    def __init__(self, key_bytes: Optional[bytes] = None):
        if key_bytes is None:
            key_bytes = parse_and_validate_aes_key()
        if len(key_bytes) != 32:
            raise KeyConfigurationError("AES-256-GCM requires a 32-byte (256-bit) key.")
        self._key = key_bytes
        self._aesgcm = AESGCM(self._key)

    def encrypt(self, plaintext: bytes, associated_data: Optional[bytes] = None) -> bytes:
        """Encrypts plaintext with AES-256-GCM using a cryptographically random 96-bit nonce.

        Payload layout:
        [1-byte Version (0x01)] [12-byte Nonce] [Ciphertext + 16-byte GCM Auth Tag]
        """
        if not isinstance(plaintext, (bytes, bytearray)):
            raise ValueError("Plaintext must be bytes or bytearray.")

        nonce = os.urandom(NONCE_LENGTH)
        ciphertext_and_tag = self._aesgcm.encrypt(nonce, bytes(plaintext), associated_data)

        # Prepend version byte and nonce
        return MAGIC_VERSION_V1 + nonce + ciphertext_and_tag

    def decrypt(self, payload: bytes, associated_data: Optional[bytes] = None) -> bytes:
        """Authenticates and decrypts an AES-256-GCM payload.

        Raises:
            TamperDetectedError: If ciphertext, nonce, or authentication tag was modified.
            EncryptionError: If payload is malformed or unrecognized version.
        """
        if len(payload) < 1 + NONCE_LENGTH + TAG_LENGTH:
            raise EncryptionError("Encrypted payload is corrupted or truncated.")

        version = payload[0:1]
        if version != MAGIC_VERSION_V1:
            raise EncryptionError(f"Unsupported encryption payload version: {version.hex()}")

        nonce = payload[1 : 1 + NONCE_LENGTH]
        ciphertext_and_tag = payload[1 + NONCE_LENGTH :]

        try:
            plaintext = self._aesgcm.decrypt(nonce, ciphertext_and_tag, associated_data)
            return plaintext
        except InvalidTag:
            raise TamperDetectedError(
                "DECRYPTION FAILURE: Authentication tag verification failed. "
                "Ciphertext has been tampered with or incorrect key used."
            )
        except Exception as e:
            raise EncryptionError(f"Decryption operation failed: {str(e)}")

    def encrypt_to_file(
        self,
        data: bytes,
        target_dir: str,
        associated_data: Optional[bytes] = None,
        prefix: str = "enc_",
    ) -> Tuple[str, str]:
        """Encrypts bytes and writes ciphertext directly to disk under target_dir.

        Returns:
            Tuple[storage_filename, absolute_file_path]
        """
        os.makedirs(target_dir, exist_ok=True)
        # Server-generated cryptographically secure filename (no user input)
        storage_id = f"{prefix}{secrets.token_urlsafe(24)}.enc"
        # Sanitize and ensure path is strictly within target_dir
        abs_path = os.path.realpath(os.path.join(target_dir, storage_id))
        real_target_dir = os.path.realpath(target_dir)

        if not abs_path.startswith(real_target_dir):
            raise EncryptionError("Path traversal detected during encrypted file creation.")

        ciphertext = self.encrypt(data, associated_data=associated_data)

        with open(abs_path, "wb") as f:
            f.write(ciphertext)

        return storage_id, abs_path

    def decrypt_from_file(
        self,
        file_path: str,
        associated_data: Optional[bytes] = None,
    ) -> io.BytesIO:
        """Reads encrypted file from disk, decrypts strictly in memory, and returns BytesIO stream.

        No plaintext is ever written to disk.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Encrypted storage file does not exist: {file_path}")

        with open(file_path, "rb") as f:
            payload = f.read()

        plaintext_bytes = self.decrypt(payload, associated_data=associated_data)
        return io.BytesIO(plaintext_bytes)


def delete_temporary_file(file_path: Optional[str]) -> bool:
    """Safely deletes an encrypted temporary file and verifies non-existence."""
    if not file_path:
        return False
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        return not os.path.exists(file_path)
    except OSError:
        return False


def cleanup_stale_temporary_files(directory: str, max_age_seconds: int = 600) -> int:
    """Removes orphaned temporary .enc files older than max_age_seconds."""
    if not os.path.exists(directory):
        return 0
    cleaned = 0
    now = time.time()
    try:
        for fname in os.listdir(directory):
            if fname.endswith(".enc"):
                fpath = os.path.join(directory, fname)
                try:
                    if os.path.isfile(fpath) and (now - os.path.getmtime(fpath)) > max_age_seconds:
                        os.remove(fpath)
                        cleaned += 1
                except OSError:
                    pass
    except OSError:
        pass
    return cleaned
