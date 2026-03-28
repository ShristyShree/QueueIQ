"""
FeedbackEntry model.
Stores user-submitted actual wait times after a hospital visit.
Used by the ML engine to recalibrate predictions over time.
"""

from datetime import datetime, timezone
from app import db


class FeedbackEntry(db.Model):
    __tablename__ = "feedback_entries"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    hospital_id     = db.Column(db.String(60), db.ForeignKey("hospitals.id"), nullable=False, index=True)
    queue_key       = db.Column(db.String(20), nullable=False)   # "doctor" | "billing" | "pharmacy"
    visit_hour      = db.Column(db.Integer,    nullable=False)   # 0–23
    visit_day       = db.Column(db.Integer,    nullable=False)   # 0=Sun … 6=Sat
    predicted_wait  = db.Column(db.Float,      nullable=False)   # what the model predicted
    actual_wait     = db.Column(db.Float,      nullable=False)   # what the user actually waited
    people_ahead    = db.Column(db.Integer,    default=0)        # live queue count at time
    created_at      = db.Column(db.DateTime,
                                default=lambda: datetime.now(timezone.utc),
                                index=True)

    # Relationships
    user     = db.relationship("User",     back_populates="feedback_entries")
    hospital = db.relationship("Hospital", back_populates="feedback_entries")

    @property
    def error(self) -> float:
        """Signed prediction error (positive = under-predicted)."""
        return self.actual_wait - self.predicted_wait

    @property
    def abs_error(self) -> float:
        return abs(self.error)

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "hospitalId":    self.hospital_id,
            "queueKey":      self.queue_key,
            "visitHour":     self.visit_hour,
            "visitDay":      self.visit_day,
            "predictedWait": self.predicted_wait,
            "actualWait":    self.actual_wait,
            "peopleAhead":   self.people_ahead,
            "error":         round(self.error, 2),
            "createdAt":     self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return (
            f"<FeedbackEntry hosp={self.hospital_id} q={self.queue_key} "
            f"pred={self.predicted_wait} actual={self.actual_wait}>"
        )
