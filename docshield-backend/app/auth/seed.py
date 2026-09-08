"""DocShield AI — Admin User Database Seeder.

Creates default administrator account from environment variables if not already initialized.
"""

import os
from app.extensions import db
from app.auth.models import AdminUser


def seed_admin_user(app) -> None:
    """Seeds default admin user safely into database."""
    with app.app_context():
        email = os.getenv("ADMIN_INITIAL_EMAIL", "admin@docshield.local").lower().strip()
        password = os.getenv("ADMIN_INITIAL_PASSWORD", "DocShieldAdmin@2026!")

        existing = AdminUser.query.filter_by(email=email).first()
        if not existing:
            admin = AdminUser(email=email, role="admin")
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            app.logger.info("Initialized default administrator account: %s", email)
