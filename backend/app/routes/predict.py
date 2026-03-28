"""
Prediction route — now doctor-aware.
  POST /api/predict/
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.hospital import Hospital
from app.models.feedback  import FeedbackEntry
from app.ml.model import predict

predict_bp = Blueprint("predict", __name__)


@predict_bp.post("/")
def make_prediction():
    data = request.get_json(silent=True) or {}

    hospital_id  = data.get("hospitalId")
    queue_key    = data.get("queueKey")
    hour         = data.get("hour")
    day_of_week  = data.get("dayOfWeek")
    people_ahead = data.get("peopleAhead", 0)
    doctor_id    = data.get("doctorId")       # NEW — optional

    errors = []
    if not hospital_id:  errors.append("hospitalId is required")
    if not queue_key:    errors.append("queueKey is required")
    if hour is None:     errors.append("hour is required (0-23)")
    if day_of_week is None: errors.append("dayOfWeek is required (0-6)")
    if not isinstance(hour, int) or not (0 <= hour <= 23):
        errors.append("hour must be integer 0-23")
    if not isinstance(day_of_week, int) or not (0 <= day_of_week <= 6):
        errors.append("dayOfWeek must be integer 0-6")
    if errors:
        return jsonify({"errors": errors}), 422

    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({"error": f"Hospital '{hospital_id}' not found"}), 404

    qp = hospital.queue_profiles.filter_by(queue_key=queue_key).first()
    if not qp:
        return jsonify({"error": f"Queue '{queue_key}' not found"}), 404

    # Optional: load doctor
    doctor = None
    if doctor_id:
        doctor = hospital.doctors.filter_by(id=doctor_id).first()

    # Optional: load user feedback
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    fb_q = (FeedbackEntry.query
            .filter_by(hospital_id=hospital_id, queue_key=queue_key)
            .order_by(FeedbackEntry.created_at.desc()).limit(20))
    if user_id:
        user_fb  = fb_q.filter_by(user_id=int(user_id)).all()
        other_fb = fb_q.filter(FeedbackEntry.user_id != int(user_id)).limit(10).all()
        all_fb   = user_fb + other_fb
    else:
        all_fb = fb_q.all()

    fb_rows = [(f.visit_hour, f.visit_day, f.actual_wait) for f in all_fb]

    result = predict(
        hospital_id=hospital_id, queue_key=queue_key, hour=hour,
        day_of_week=day_of_week, people_ahead=people_ahead,
        base_profile=qp.base_profile, avg_service_min=qp.avg_service_min,
        weekend_mult=qp.weekend_mult, model_accuracy=qp.model_accuracy,
        peak_hours=qp.peak_hours, notes=qp.notes, short_name=hospital.short_name,
        feedback_rows=fb_rows,
        doctor_id       = doctor.id            if doctor else None,
        doctor_name     = doctor.name          if doctor else None,
        doctor_specialty= doctor.specialty     if doctor else None,
        doctor_avail_start = doctor.avail_start if doctor else None,
        doctor_avail_end   = doctor.avail_end   if doctor else None,
        doctor_avg_consult = doctor.avg_consult_min if doctor else None,
        doctor_popularity  = doctor.popularity_index if doctor else None,
        doctor_wait_mult   = doctor.wait_multiplier  if doctor else 1.0,
    )

    result["hospitalMeta"] = {
        "name": hospital.name, "shortName": hospital.short_name,
        "lastUpdated": qp.last_updated, "liveUsers": qp.live_users,
        "totalDataPoints": hospital.total_data_points,
        "modelAccuracy": qp.model_accuracy, "peakWindow": hospital.peak_window,
    }
    return jsonify(result), 200
