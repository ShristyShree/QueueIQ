"""
Hospital, QueueProfile, and Doctor models.
"""
from app import db


class Hospital(db.Model):
    __tablename__ = "hospitals"

    id                = db.Column(db.String(60),  primary_key=True)
    name              = db.Column(db.String(120),  nullable=False)
    short_name        = db.Column(db.String(30),   nullable=False)
    area              = db.Column(db.String(120),  nullable=False)
    lat               = db.Column(db.Float,         nullable=False)
    lng               = db.Column(db.Float,         nullable=False)
    hospital_type     = db.Column(db.String(80),   nullable=False)
    beds              = db.Column(db.Integer)
    rating            = db.Column(db.Float,         default=4.0)
    daily_visits      = db.Column(db.Integer,       default=1000)
    established       = db.Column(db.Integer)
    badge             = db.Column(db.String(40))
    badge_color       = db.Column(db.String(10))
    description       = db.Column(db.Text)
    peak_window       = db.Column(db.String(60))
    live_users        = db.Column(db.Integer,       default=0)
    total_data_points = db.Column(db.Integer,       default=0)

    queue_profiles    = db.relationship("QueueProfile", back_populates="hospital",
                                        cascade="all, delete-orphan", lazy="dynamic")
    doctors           = db.relationship("Doctor",       back_populates="hospital",
                                        cascade="all, delete-orphan", lazy="dynamic")
    feedback_entries  = db.relationship("FeedbackEntry", back_populates="hospital", lazy="dynamic")

    def to_dict(self, include_queues=False, include_doctors=False):
        data = {
            "id": self.id, "name": self.name, "shortName": self.short_name,
            "area": self.area, "coords": {"lat": self.lat, "lng": self.lng},
            "type": self.hospital_type, "beds": self.beds, "rating": self.rating,
            "dailyVisits": self.daily_visits, "established": self.established,
            "badge": self.badge, "badgeColor": self.badge_color,
            "description": self.description, "peakWindow": self.peak_window,
            "liveUsers": self.live_users, "totalDataPoints": self.total_data_points,
        }
        if include_queues:
            data["queues"] = {qp.queue_key: qp.to_dict() for qp in self.queue_profiles}
        if include_doctors:
            data["doctors"] = [d.to_dict() for d in self.doctors]
        return data

    def __repr__(self):
        return f"<Hospital {self.id}>"


class QueueProfile(db.Model):
    __tablename__ = "queue_profiles"
    __table_args__ = (
        db.UniqueConstraint("hospital_id", "queue_key", name="uq_hospital_queue"),
    )

    id               = db.Column(db.Integer, primary_key=True)
    hospital_id      = db.Column(db.String(60), db.ForeignKey("hospitals.id"), nullable=False, index=True)
    queue_key        = db.Column(db.String(20),  nullable=False)
    label            = db.Column(db.String(60),  nullable=False)
    avg_service_min  = db.Column(db.Float,        nullable=False, default=10.0)
    weekend_mult     = db.Column(db.Float,        nullable=False, default=0.7)
    model_accuracy   = db.Column(db.Float,        nullable=False, default=85.0)
    last_updated     = db.Column(db.String(30),   default="just now")
    live_users       = db.Column(db.Integer,      default=0)
    base_profile_csv = db.Column(db.Text,         nullable=False)
    peak_hours_csv   = db.Column(db.String(60),   nullable=False, default="")
    notes_pipe       = db.Column(db.Text,         default="")

    hospital = db.relationship("Hospital", back_populates="queue_profiles")

    @property
    def base_profile(self):
        return [float(v) for v in self.base_profile_csv.split(",")]

    @base_profile.setter
    def base_profile(self, values):
        self.base_profile_csv = ",".join(str(v) for v in values)

    @property
    def peak_hours(self):
        return [int(h) for h in self.peak_hours_csv.split(",") if h]

    @peak_hours.setter
    def peak_hours(self, values):
        self.peak_hours_csv = ",".join(str(h) for h in values)

    @property
    def notes(self):
        return self.notes_pipe.split("|") if self.notes_pipe else []

    @notes.setter
    def notes(self, values):
        self.notes_pipe = "|".join(values)

    def to_dict(self):
        return {
            "label": self.label, "avgServiceMin": self.avg_service_min,
            "weekendMult": self.weekend_mult, "modelAccuracy": self.model_accuracy,
            "lastUpdated": self.last_updated, "liveUsers": self.live_users,
            "peakHours": self.peak_hours, "baseProfile": self.base_profile,
            "notes": self.notes,
        }

    def __repr__(self):
        return f"<QueueProfile {self.hospital_id}/{self.queue_key}>"


class Doctor(db.Model):
    __tablename__ = "doctors"

    id               = db.Column(db.String(60),  primary_key=True)
    hospital_id      = db.Column(db.String(60),  db.ForeignKey("hospitals.id"), nullable=False, index=True)
    name             = db.Column(db.String(120),  nullable=False)
    specialty        = db.Column(db.String(80),   nullable=False)
    avail_start      = db.Column(db.Integer,       nullable=False)   # hour 0-23
    avail_end        = db.Column(db.Integer,       nullable=False)   # hour 0-23
    avg_consult_min  = db.Column(db.Float,         nullable=False, default=12.0)
    popularity_index = db.Column(db.Integer,       nullable=False, default=75)
    wait_multiplier  = db.Column(db.Float,         nullable=False, default=1.0)

    hospital = db.relationship("Hospital", back_populates="doctors")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "specialty": self.specialty,
            "availStart": self.avail_start, "availEnd": self.avail_end,
            "avgConsultMin": self.avg_consult_min,
            "popularityIndex": self.popularity_index,
            "waitMultiplier": self.wait_multiplier,
        }

    def __repr__(self):
        return f"<Doctor {self.id}>"
