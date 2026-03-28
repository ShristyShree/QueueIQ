"""
Hospital routes — now includes doctors in the response.
  GET /api/hospitals/                    list + distance sort
  GET /api/hospitals/<id>                full detail + queues + doctors
  GET /api/hospitals/<id>/profile        24-hour crowd profile
  GET /api/hospitals/<id>/doctors        doctors list
"""

import math, datetime
from flask import Blueprint, request, jsonify
from app.models.hospital import Hospital
from app.ml.model import build_profile_for_queue

hospitals_bp = Blueprint("hospitals", __name__)


def _hav(lat1, lng1, lat2, lng2):
    R = 6371
    d = math.radians
    a = math.sin(d(lat2-lat1)/2)**2 + math.cos(d(lat1))*math.cos(d(lat2))*math.sin(d(lng2-lng1)/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


@hospitals_bp.get("/")
def list_hospitals():
    lat    = request.args.get("lat",    type=float)
    lng    = request.args.get("lng",    type=float)
    search = request.args.get("search", "").strip().lower()

    query = Hospital.query
    if search:
        query = query.filter(
            Hospital.name.ilike(f"%{search}%") |
            Hospital.area.ilike(f"%{search}%") |
            Hospital.hospital_type.ilike(f"%{search}%")
        )

    hospitals = query.all()
    result = []
    for h in hospitals:
        d = h.to_dict(include_doctors=True)
        if lat is not None and lng is not None:
            d["distKm"] = round(_hav(lat, lng, h.lat, h.lng), 2)
        result.append(d)

    if lat is not None and lng is not None:
        result.sort(key=lambda x: x.get("distKm", 9999))

    return jsonify({"hospitals": result, "total": len(result)}), 200


@hospitals_bp.get("/<string:hospital_id>")
def get_hospital(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    return jsonify(hospital.to_dict(include_queues=True, include_doctors=True)), 200


@hospitals_bp.get("/<string:hospital_id>/profile")
def get_profile(hospital_id):
    queue_key   = request.args.get("queue_key")
    day_of_week = request.args.get("day_of_week", type=int,
                                   default=datetime.datetime.now().weekday())
    doctor_id   = request.args.get("doctor_id")

    if not queue_key:
        return jsonify({"error": "queue_key is required"}), 422

    hospital = Hospital.query.get_or_404(hospital_id)
    qp       = hospital.queue_profiles.filter_by(queue_key=queue_key).first()
    if not qp:
        return jsonify({"error": f"No queue profile for '{queue_key}'"}), 404

    # Doctor wait multiplier adjustment
    doc_mult = 1.0
    if doctor_id:
        doc = hospital.doctors.filter_by(id=doctor_id).first()
        if doc:
            doc_mult = doc.wait_multiplier

    profile = build_profile_for_queue(
        base_profile=qp.base_profile,
        weekend_mult=qp.weekend_mult,
        day_of_week=day_of_week,
        queue_key=queue_key,
        doctor_mult=doc_mult,
    )
    return jsonify({"hospitalId": hospital_id, "queueKey": queue_key,
                    "dayOfWeek": day_of_week, "profile": profile}), 200


@hospitals_bp.get("/<string:hospital_id>/doctors")
def get_doctors(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    return jsonify({
        "hospitalId": hospital_id,
        "doctors": [d.to_dict() for d in hospital.doctors],
    }), 200
