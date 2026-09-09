"""DocShield AI — WSGI Production Entrypoint.

Exposes the application callable for production WSGI servers (Gunicorn / Waitress).
"""

import os
from app import create_app

# Instantiate application using environment config
env = os.getenv("FLASK_ENV", "development")
app = create_app(env)

if __name__ == "__main__":
    # Local direct execution fallback (prefer 'flask run' or gunicorn)
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
