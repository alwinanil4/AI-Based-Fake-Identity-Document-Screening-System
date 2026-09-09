"""DocShield AI — Configuration Classes.

Manages application configurations across Development, Testing, and Production
environments with strict validation against insecure defaults.
"""

from datetime import timedelta
import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the backend (where wsgi.py / app directory lives)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load local environment variables from .env
load_dotenv(BASE_DIR / ".env")


class BaseConfig:
    """Base configuration shared by all environments."""

    # Core Security Keys
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-insecure-jwt-key-change-me")

    # JWT Settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    )
    JWT_ALGORITHM = "HS256"

    # Database Settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads & Storage Security
    # 10MB default hard body limit enforced at Flask request level
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", "10")) * 1024 * 1024
    UPLOAD_FOLDER = os.path.abspath(
        os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))
    )
    MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "8000"))
    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}

    # CORS Allow-list (Never wildcard in production)
    _raw_cors = os.getenv(
        "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
    )
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in _raw_cors.split(",") if origin.strip()
    ]

    # Rate Limiting Settings
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100/hour")
    RATELIMIT_ANALYZE = os.getenv("RATELIMIT_ANALYZE", "20/minute")
    RATELIMIT_LOGIN = os.getenv("RATELIMIT_LOGIN", "5/15minute")
    RATELIMIT_HEADERS_ENABLED = True

    # ML & Forensic Paths
    MODEL_WEIGHTS_PATH = os.path.abspath(
        os.getenv(
            "MODEL_WEIGHTS_PATH",
            str(BASE_DIR / "app" / "ml" / "weights" / "efficientnet_b0_docshield.pth"),
        )
    )
    TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

    DEBUG = False
    TESTING = False


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'docshield_dev.db'}"
    )


class TestingConfig(BaseConfig):
    """Testing environment configuration."""

    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    # Use ephemeral in-memory rate limiting and lower limits for tests if needed
    RATELIMIT_STORAGE_URI = "memory://"
    # Strict secret keys for test assertions
    SECRET_KEY = "test-secret-key-do-not-use-in-production"
    JWT_SECRET_KEY = "test-jwt-key-do-not-use-in-production"


class ProductionConfig(BaseConfig):
    """Production configuration with strict fail-safe security checks."""

    DEBUG = False
    TESTING = False

    # Force database URL configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    # Strict Cookie Flags
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"

    @classmethod
    def init_app(cls, app):
        """Validate critical production environment variables."""
        if not cls.SQLALCHEMY_DATABASE_URI:
            raise ValueError(
                "DATABASE_URL environment variable must be set in production"
            )
        if not os.getenv("SECRET_KEY") or os.getenv("SECRET_KEY") == "dev-insecure-secret-key-change-me":
            raise ValueError(
                "A strong SECRET_KEY must be set in production environment variables"
            )
        if not os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET_KEY") == "dev-insecure-jwt-key-change-me":
            raise ValueError(
                "A strong JWT_SECRET_KEY must be set in production environment variables"
            )


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
