"""User model — stores registered users with hashed passwords."""

from datetime import datetime, timezone
from app import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active  = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationship: one user → many feedback entries
    feedback_entries = db.relationship("FeedbackEntry", back_populates="user", lazy="dynamic")

    # ── Password helpers ──────────────────────────────────
    def set_password(self, plain_text: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(plain_text).decode("utf-8")

    def check_password(self, plain_text: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, plain_text)

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<User {self.email}>"
