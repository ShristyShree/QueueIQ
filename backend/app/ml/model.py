"""
QueueIQ ML Prediction Engine v3
================================
Doctor-aware: adjusts predictions based on doctor popularity,
availability window, consultation time, and specialty demand.

Formula:
  doc_factor    = doctor.wait_multiplier  (1.0 = baseline)
  ml_base       = GBR prediction × doc_factor
  live_estimate = people_ahead × avg_consult_min
  liveWeight    = 0.15 + (people/25) × 0.65, capped 0.80
  blended       = (1-lw) × ml_base + lw × live_estimate
  final_wait    = 0.7 × blended + 0.3 × live_estimate  (when doctor selected)
"""

import math
import numpy as np
from typing import Optional
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

_model_cache: dict = {}

QUEUE_HOURS = {
    "doctor":   {"open": 9,  "close": 17, "label": "9am – 5pm"},
    "billing":  {"open": 8,  "close": 20, "label": "8am – 8pm"},
    "pharmacy": {"open": 7,  "close": 22, "label": "7am – 10pm"},
}
MIN_FB = 5


def _fmt12(h):
    if h == 0:  return "12am"
    if h == 12: return "12pm"
    return f"{h}am" if h < 12 else f"{h-12}pm"

def _is_weekend(day): return day in (0, 6)

def _features(hour, day):
    hs = math.sin(2*math.pi*hour/24); hc = math.cos(2*math.pi*hour/24)
    ds = math.sin(2*math.pi*day/7);   dc = math.cos(2*math.pi*day/7)
    return [hour, day, hs, hc, ds, dc, int(_is_weekend(day))]

def _synthetic(base_profile, weekend_mult, doc_mult=1.0):
    X, y = [], []
    for day in [1,2,3,4]:
        for h in range(24):
            X.append(_features(h, day))
            y.append(base_profile[h] * doc_mult)
    for day in [0, 6]:
        for h in range(24):
            X.append(_features(h, day))
            y.append(base_profile[h] * weekend_mult * doc_mult)
    return np.array(X), np.array(y)

def _train(cache_key, base_profile, weekend_mult, feedback_rows, doc_mult=1.0):
    X_syn, y_syn = _synthetic(base_profile, weekend_mult, doc_mult)
    if feedback_rows:
        X_fb = np.array([_features(h, d) for h,d,_ in feedback_rows])
        y_fb = np.array([w for _,_,w in feedback_rows])
        X = np.vstack([X_syn, np.repeat(X_fb, 3, axis=0)])
        y = np.concatenate([y_syn, np.tile(y_fb, 3)])
    else:
        X, y = X_syn, y_syn
    model = Pipeline([
        ("sc", StandardScaler()),
        ("gr", GradientBoostingRegressor(n_estimators=120, learning_rate=0.08,
                                          max_depth=4, min_samples_leaf=3, random_state=42)),
    ])
    model.fit(X, y)
    _model_cache[cache_key] = model
    return model


def predict(hospital_id, queue_key, hour, day_of_week, people_ahead,
            base_profile, avg_service_min, weekend_mult, model_accuracy,
            peak_hours, notes, short_name, feedback_rows=None,
            doctor_id=None, doctor_name=None, doctor_specialty=None,
            doctor_avail_start=None, doctor_avail_end=None,
            doctor_avg_consult=None, doctor_popularity=None,
            doctor_wait_mult=1.0):

    hrs     = QUEUE_HOURS.get(queue_key)
    is_wknd = _is_weekend(day_of_week)
    mult    = weekend_mult if is_wknd else 1.0

    # ── Operating hours guard ──────────────────────────────
    if hrs and not (hrs["open"] <= hour <= hrs["close"]):
        bh, bv = hrs["open"], 9999
        for h in range(hrs["open"], hrs["close"]+1):
            v = base_profile[h] * mult * doctor_wait_mult
            if v < bv: bv, bh = v, h
        return {"closed": True, "reason": "outside_hours",
                "queueLabel": queue_key.title(), "hoursLabel": hrs["label"],
                "suggestion": f"Try {_fmt12(bh)} — typically lowest crowd during {hrs['label']}",
                "nextBestHour": bh, "nextBestVal": round(bv)}

    # ── Doctor availability guard ──────────────────────────
    if doctor_id and queue_key == "doctor":
        if doctor_avail_start is not None and not (doctor_avail_start <= hour < doctor_avail_end):
            return {"closed": True, "reason": "doctor_unavailable",
                    "doctorName": doctor_name, "specialty": doctor_specialty,
                    "availStart": doctor_avail_start, "availEnd": doctor_avail_end,
                    "suggestion": f"{doctor_name} is available {_fmt12(doctor_avail_start)}–{_fmt12(doctor_avail_end)}",
                    "nextBestHour": doctor_avail_start}

    # ── ML model ───────────────────────────────────────────
    cache_key = f"{hospital_id}_{queue_key}_{doctor_id or 'any'}"
    fb = feedback_rows or []
    model = _train(cache_key, base_profile, weekend_mult, fb, doctor_wait_mult)

    X_pred  = np.array([_features(hour, day_of_week)])
    ml_pred = max(0.0, float(model.predict(X_pred)[0]))

    # ── Live adjustment ────────────────────────────────────
    svc_min  = doctor_avg_consult or avg_service_min
    live_pred = people_ahead * svc_min
    live_w    = min(0.80, 0.15 + (people_ahead/25)*0.65)
    model_w   = 1 - live_w

    blended  = model_w*ml_pred + live_w*live_pred
    combined = (0.7*blended + 0.3*live_pred) if doctor_id else blended

    # ── Uncertainty ────────────────────────────────────────
    sigma = max(3.0, ml_pred*0.24) * (1 - min(0.55, len(fb)*0.07))
    low   = max(1, round(combined - sigma))
    high  = round(combined + sigma*1.55)

    # ── Confidence ─────────────────────────────────────────
    conf = min(96, max(35, round(
        50 + (model_accuracy-75)*0.9 + len(fb)*1.8
        + (6 if people_ahead>0 else 0) + (5 if doctor_id else 0)
    )))

    crowd = "Low" if combined<12 else "Medium" if combined<30 else "High"

    # ── Best/worst within hours ────────────────────────────
    op_o = hrs["open"] if hrs else 6; op_c = hrs["close"] if hrs else 21
    bh, bv, wh, wv = op_o, 9999, op_o, 0
    for h in range(op_o, op_c+1):
        v = base_profile[h]*mult*doctor_wait_mult
        if v<bv: bv,bh=v,h
        if v>wv: wv,wh=v,h

    # ── Explanations ───────────────────────────────────────
    expl = []
    if is_wknd: expl.append(f"Weekend — ~{round((1-weekend_mult)*100)}% lighter footfall")
    else:       expl.append(f"Weekday — standard crowd pattern for {short_name}")
    if doctor_id:
        expl.append(f"{doctor_name} ({doctor_specialty}) — popularity index {doctor_popularity}/100")
        if doctor_popularity and doctor_popularity > 85:
            expl.append(f"High-demand specialist — adds ~{round((doctor_wait_mult-1)*100)}% to wait")
    if hour in peak_hours: expl.append(f"{_fmt12(hour)} is a confirmed peak slot at {short_name}")
    elif combined < 12:    expl.append(f"{_fmt12(hour)} is a low-traffic window")
    if people_ahead > 8:   expl.append(f"{people_ahead} people in queue — live signal weighted at {round(live_w*100)}%")
    elif people_ahead > 0: expl.append(f"{people_ahead} people ahead — light live adjustment")
    else:                  expl.append("No live count — prediction from ML model")
    if len(fb) >= 3:       expl.append(f"Self-calibrated from {len(fb)} past visits at {short_name}")
    if notes:              expl.append(notes[0])

    return {
        "closed": False, "low": low, "high": high, "combined": round(combined),
        "confidence": conf, "crowd": crowd,
        "bestHour": bh, "bestVal": round(bv),
        "worstHour": wh, "worstVal": round(wv),
        "bestHourLabel": f"{_fmt12(bh)} (lowest crowd during {hrs['label'] if hrs else 'operating hours'})",
        "explanations": expl,
        "modelPrediction": round(ml_pred), "livePrediction": round(live_pred),
        "liveWeight": round(live_w*100), "modelWeight": round(model_w*100),
        "sigma": round(sigma), "feedbackCount": len(fb),
        "hoursLabel": hrs["label"] if hrs else None, "notes": notes,
        "doctorInfo": {
            "id": doctor_id, "name": doctor_name, "specialty": doctor_specialty,
            "popularityIndex": doctor_popularity, "avgConsultMin": doctor_avg_consult,
            "availStart": doctor_avail_start, "availEnd": doctor_avail_end,
            "waitMultiplier": doctor_wait_mult,
        } if doctor_id else None,
    }


def invalidate_cache(hospital_id, queue_key, doctor_id=None):
    key = f"{hospital_id}_{queue_key}_{doctor_id or 'any'}"
    _model_cache.pop(key, None)


def build_profile_for_queue(base_profile, weekend_mult, day_of_week, queue_key, doctor_mult=1.0):
    from app.ml.model import _is_weekend, QUEUE_HOURS
    hrs  = QUEUE_HOURS.get(queue_key)
    mult = weekend_mult if _is_weekend(day_of_week) else 1.0
    return [
        {
            "hour":     h,
            "value":    round(v * mult * doctor_mult),
            "inactive": bool(hrs and (h < hrs["open"] or h > hrs["close"])),
        }
        for h, v in enumerate(base_profile)
    ]
