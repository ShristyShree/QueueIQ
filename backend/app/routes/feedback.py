"""
Feedback routes
  POST /api/feedback            — submit actual wait time (JWT required)
  GET  /api/feedback/mine       — get current user's feedback history
  GET  /api/feedback/stats      — aggregated stats per hospital+queue
  GET  /api/feedback/accuracy   — model accuracy over time (for chart)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models.feedback import FeedbackEntry
from app.models.hospital import Hospital
from app.ml.model import invalidate_cache

feedback_bp = Blueprint("feedback", __name__)


# ── Submit feedback ──────────────────────────────────────────
@feedback_bp.post("/")
@jwt_required()
def submit_feedback():
    """
    Request body:
    {
      "hospitalId":    "apollo_greams",
      "queueKey":      "doctor",
      "predictedWait": 32,
      "actualWait":    28,
      "visitHour":     10,
      "visitDay":      1,
      "peopleAhead":   5       (optional)
    }
    """
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}

    hospital_id   = data.get("hospitalId")
    queue_key     = data.get("queueKey")
    predicted_wait = data.get("predictedWait")
    actual_wait    = data.get("actualWait")
    visit_hour     = data.get("visitHour")
    visit_day      = data.get("visitDay")
    people_ahead   = data.get("peopleAhead", 0)

    # Validation
    errors = []
    if not hospital_id:                         errors.append("hospitalId is required")
    if not queue_key:                            errors.append("queueKey is required")
    if predicted_wait is None:                   errors.append("predictedWait is required")
    if actual_wait is None:                      errors.append("actualWait is required")
    if visit_hour is None:                       errors.append("visitHour is required")
    if visit_day is None:                        errors.append("visitDay is required")
    if actual_wait is not None and actual_wait < 0:
        errors.append("actualWait must be non-negative")
    if errors:
        return jsonify({"errors": errors}), 422

    # Verify hospital exists
    if not Hospital.query.get(hospital_id):
        return jsonify({"error": f"Hospital '{hospital_id}' not found"}), 404

    entry = FeedbackEntry(
        user_id        = user_id,
        hospital_id    = hospital_id,
        queue_key      = queue_key,
        predicted_wait = float(predicted_wait),
        actual_wait    = float(actual_wait),
        visit_hour     = int(visit_hour),
        visit_day      = int(visit_day),
        people_ahead   = int(people_ahead),
    )
    db.session.add(entry)
    db.session.commit()

    # Invalidate cached ML model so it retrains on next prediction request
    invalidate_cache(hospital_id, queue_key)

    return jsonify({
        "message": "Feedback recorded. Model will recalibrate on next prediction.",
        "entry":   entry.to_dict(),
    }), 201


# ── My feedback history ──────────────────────────────────────
@feedback_bp.get("/mine")
@jwt_required()
def my_feedback():
    user_id = int(get_jwt_identity())
    page    = request.args.get("page",     1,   type=int)
    per_page = request.args.get("per_page", 20, type=int)

    pagination = (
        FeedbackEntry.query
        .filter_by(user_id=user_id)
        .order_by(FeedbackEntry.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "entries":  [e.to_dict() for e in pagination.items],
        "total":    pagination.total,
        "page":     page,
        "pages":    pagination.pages,
        "per_page": per_page,
    }), 200


# ── Aggregated stats ─────────────────────────────────────────
@feedback_bp.get("/stats")
@jwt_required()
def feedback_stats():
    """
    Query params:
      hospital_id  (optional) — filter to one hospital
      queue_key    (optional)
    """
    user_id     = int(get_jwt_identity())
    hospital_id = request.args.get("hospital_id")
    queue_key   = request.args.get("queue_key")

    q = FeedbackEntry.query.filter_by(user_id=user_id)
    if hospital_id:
        q = q.filter_by(hospital_id=hospital_id)
    if queue_key:
        q = q.filter_by(queue_key=queue_key)

    entries = q.order_by(FeedbackEntry.created_at.asc()).all()

    if not entries:
        return jsonify({"count": 0, "avgError": 0, "entries": []}), 200

    errors  = [e.abs_error for e in entries]
    avg_err = sum(errors) / len(errors)

    # Calibration progress: 10 entries = 100%
    calibration_pct = min(100, len(entries) * 10)

    return jsonify({
        "count":           len(entries),
        "avgError":        round(avg_err, 2),
        "calibrationPct":  calibration_pct,
        "entries":         [e.to_dict() for e in entries],
    }), 200


# ── Accuracy over time (for Sparkline chart) ─────────────────
@feedback_bp.get("/accuracy")
@jwt_required()
def accuracy_over_time():
    user_id = int(get_jwt_identity())
    entries = (
        FeedbackEntry.query
        .filter_by(user_id=user_id)
        .order_by(FeedbackEntry.created_at.asc())
        .all()
    )
    return jsonify({
        "points": [
            {"index": i, "value": round(e.abs_error, 2)}
            for i, e in enumerate(entries)
        ]
    }), 200
