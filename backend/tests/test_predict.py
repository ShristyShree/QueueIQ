"""
Unit tests for the ML prediction engine.
Run with: pytest tests/
"""

import pytest
from app.ml.model import predict, build_profile_for_queue, QUEUE_HOURS

# Sample hospital data (mirrors apollo_greams)
SAMPLE_PROFILE = [2,1,1,1,1,3,8,20,35,42,40,34,38,44,40,36,52,62,50,32,20,12,7,3]
SAMPLE_KWARGS = dict(
    hospital_id     = "test_hospital",
    queue_key       = "doctor",
    base_profile    = SAMPLE_PROFILE,
    avg_service_min = 12.0,
    weekend_mult    = 0.72,
    model_accuracy  = 89.0,
    peak_hours      = [9, 10, 11, 17, 18],
    notes           = ["Test note"],
    short_name      = "TestHosp",
    feedback_rows   = [],
)


class TestOutsideHoursGuard:
    def test_doctor_at_2am_returns_closed(self):
        result = predict(hour=2, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result["closed"] is True
        assert result["reason"] == "outside_hours"

    def test_doctor_at_2am_provides_suggestion(self):
        result = predict(hour=2, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert "suggestion" in result
        assert "nextBestHour" in result
        assert QUEUE_HOURS["doctor"]["open"] <= result["nextBestHour"] <= QUEUE_HOURS["doctor"]["close"]

    def test_doctor_at_9am_not_closed(self):
        result = predict(hour=9, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result.get("closed") is not True

    def test_pharmacy_at_6am_closed(self):
        result = predict(hour=6, day_of_week=1, people_ahead=0,
                         **{**SAMPLE_KWARGS, "queue_key": "pharmacy"})
        assert result["closed"] is True

    def test_pharmacy_at_7am_open(self):
        result = predict(hour=7, day_of_week=1, people_ahead=0,
                         **{**SAMPLE_KWARGS, "queue_key": "pharmacy"})
        assert result.get("closed") is not True


class TestPredictionRange:
    def test_low_less_than_high(self):
        result = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result["low"] <= result["high"]

    def test_combined_within_range(self):
        result = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result["low"] <= result["combined"] <= result["high"]

    def test_confidence_in_bounds(self):
        result = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert 1 <= result["confidence"] <= 100

    def test_crowd_valid_values(self):
        result = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result["crowd"] in ("Low", "Medium", "High")

    def test_low_is_positive(self):
        result = predict(hour=9, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        assert result["low"] >= 1


class TestLiveQueueEffect:
    def test_more_people_increases_prediction(self):
        r_empty  = predict(hour=10, day_of_week=1, people_ahead=0,  **SAMPLE_KWARGS)
        r_packed = predict(hour=10, day_of_week=1, people_ahead=25, **SAMPLE_KWARGS)
        assert r_packed["combined"] > r_empty["combined"]

    def test_live_weight_increases_with_people(self):
        r_few  = predict(hour=10, day_of_week=1, people_ahead=2,  **SAMPLE_KWARGS)
        r_many = predict(hour=10, day_of_week=1, people_ahead=20, **SAMPLE_KWARGS)
        assert r_many["liveWeight"] > r_few["liveWeight"]


class TestBestWorstHours:
    def test_best_hour_within_operating_window(self):
        result  = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        hrs     = QUEUE_HOURS["doctor"]
        assert hrs["open"] <= result["bestHour"] <= hrs["close"]

    def test_worst_hour_within_operating_window(self):
        result  = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        hrs     = QUEUE_HOURS["doctor"]
        assert hrs["open"] <= result["worstHour"] <= hrs["close"]


class TestWeekendReduction:
    def test_weekend_prediction_lower_than_weekday(self):
        r_wkday = predict(hour=10, day_of_week=2, people_ahead=0, **SAMPLE_KWARGS)   # Tuesday
        r_wkend = predict(hour=10, day_of_week=6, people_ahead=0, **SAMPLE_KWARGS)   # Saturday
        assert r_wkend["combined"] < r_wkday["combined"]


class TestFeedbackSelfLearning:
    def test_feedback_increases_confidence(self):
        r_no_fb = predict(hour=10, day_of_week=1, people_ahead=0, **SAMPLE_KWARGS)
        feedback_rows = [(10, 1, 35.0)] * 8  # 8 feedback entries
        r_with_fb = predict(
            hour=10, day_of_week=1, people_ahead=0,
            **{**SAMPLE_KWARGS, "feedback_rows": feedback_rows}
        )
        assert r_with_fb["confidence"] >= r_no_fb["confidence"]

    def test_feedback_count_in_result(self):
        feedback_rows = [(10, 1, 30.0)] * 5
        result = predict(
            hour=10, day_of_week=1, people_ahead=0,
            **{**SAMPLE_KWARGS, "feedback_rows": feedback_rows}
        )
        assert result["feedbackCount"] == 5


class TestProfileBuilder:
    def test_returns_24_entries(self):
        profile = build_profile_for_queue(SAMPLE_PROFILE, 0.72, 1, "doctor")
        assert len(profile) == 24

    def test_inactive_outside_hours(self):
        profile = build_profile_for_queue(SAMPLE_PROFILE, 0.72, 1, "doctor")
        hrs = QUEUE_HOURS["doctor"]
        for p in profile:
            if p["hour"] < hrs["open"] or p["hour"] > hrs["close"]:
                assert p["inactive"] is True
            else:
                assert p["inactive"] is False

    def test_weekend_reduces_values(self):
        weekday = build_profile_for_queue(SAMPLE_PROFILE, 0.72, 1, "doctor")
        weekend = build_profile_for_queue(SAMPLE_PROFILE, 0.72, 0, "doctor")
        # Peak hour comparison
        assert weekend[10]["value"] <= weekday[10]["value"]
