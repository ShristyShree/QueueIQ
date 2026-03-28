"""
Authentication routes
  POST /api/auth/register  — create account
  POST /api/auth/login     — get access + refresh tokens
  POST /api/auth/refresh   — rotate access token
  GET  /api/auth/me        — return current user profile
  POST /api/auth/logout    — (client-side: discard tokens)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


# ── Helpers ──────────────────────────────────────────────────
def _validate_register_payload(data: dict) -> list[str]:
    errors = []
    if not data.get("name",  "").strip():    errors.append("name is required")
    if not data.get("email", "").strip():    errors.append("email is required")
    if len(data.get("password", "")) < 8:    errors.append("password must be at least 8 characters")
    return errors


# ── Register ─────────────────────────────────────────────────
@auth_bp.post("/register")
def register():
    data   = request.get_json(silent=True) or {}
    errors = _validate_register_payload(data)
    if errors:
        return jsonify({"errors": errors}), 422

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=data["name"].strip(), email=email)
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 201


# ── Login ────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated"}), 403

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 200


# ── Refresh token ────────────────────────────────────────────
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


# ── Get current user ─────────────────────────────────────────
@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ── Logout (informational — tokens are stateless JWT) ────────
@auth_bp.post("/logout")
@jwt_required()
def logout():
    # JWT is stateless; actual invalidation requires a blocklist (Phase 2).
    # For now, instruct the client to discard both tokens.
    return jsonify({"message": "Logged out. Discard your tokens on the client."}), 200
