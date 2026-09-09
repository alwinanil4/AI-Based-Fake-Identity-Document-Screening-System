"""DocShield AI — Admin User Database Model.

Manages admin credentials with bcrypt hashing and brute-force lockout safeguards.
"""

from datetime import datetime, timezone, timedelta
import bcrypt
from app.extensions import db


class AdminUser(db.Model):
    """Database model for privileged administrative users."""

    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(128), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(32), default="admin", nullable=False)
    failed_logins = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password: str) -> None:
        """Hashes password with bcrypt and work factor salt."""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        self.password_hash = hashed.decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Verifies candidate plaintext password against stored bcrypt hash."""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.password_hash.encode("utf-8"),
        )

    def is_locked(self) -> bool:
        """Checks if account is temporarily locked due to repeated failed logins."""
        if self.locked_until:
            now = datetime.now(timezone.utc)
            # Make sure locked_until is timezone aware
            lock_time = self.locked_until
            if lock_time.tzinfo is None:
                lock_time = lock_time.replace(tzinfo=timezone.utc)
            if lock_time > now:
                return True
        return False

    def register_failed_attempt(self) -> None:
        """Increments failed login counter and triggers 15-min lockout at threshold."""
        self.failed_logins += 1
        if self.failed_logins >= 5:
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)

    def reset_failed_attempts(self) -> None:
        """Clears lockout and counter upon successful authentication."""
        self.failed_logins = 0
        self.locked_until = None
