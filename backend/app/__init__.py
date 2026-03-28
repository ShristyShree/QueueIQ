"""
QueueIQ Flask Application Factory
Wires together all extensions, blueprints, and configuration.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

# ── Extension instances (created here, initialised in create_app) ──
db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()
bcrypt  = Bcrypt()


def create_app(config_override: dict = None) -> Flask:
    app = Flask(__name__)

    # ── Config ──────────────────────────────────────────────
    app.config["SQLALCHEMY_DATABASE_URI"]        = os.getenv("DATABASE_URL", "sqlite:///queueiq_dev.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"]                 = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-prod")
    app.config["SECRET_KEY"]                     = os.getenv("SECRET_KEY", "dev-flask-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"]       = 60 * 60 * 24      # 24 hours
    app.config["JWT_REFRESH_TOKEN_EXPIRES"]      = 60 * 60 * 24 * 30 # 30 days

    if config_override:
        app.config.update(config_override)

    # ── CORS ────────────────────────────────────────────────
    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    # ── Extensions init ─────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # ── Register blueprints ──────────────────────────────────
    from app.routes.auth       import auth_bp
    from app.routes.hospitals  import hospitals_bp
    from app.routes.predict    import predict_bp
    from app.routes.feedback   import feedback_bp

    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(hospitals_bp, url_prefix="/api/hospitals")
    app.register_blueprint(predict_bp,   url_prefix="/api/predict")
    app.register_blueprint(feedback_bp,  url_prefix="/api/feedback")

    # ── Health check ─────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "QueueIQ API"}

    return app
