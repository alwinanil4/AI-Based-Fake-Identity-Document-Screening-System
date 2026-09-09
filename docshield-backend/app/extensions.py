"""DocShield AI — Application Extensions.

Centralized instances of database ORM, rate limiter, and CORS.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS

db = SQLAlchemy()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=["100 per hour"],
    headers_enabled=True,
)

cors = CORS()
