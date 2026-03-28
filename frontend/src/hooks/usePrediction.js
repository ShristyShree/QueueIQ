/**
 * usePrediction
 * -------------
 * Fetches a prediction from the backend whenever any input changes.
 * Falls back to the local engine (src/engine/predict.js) if the API
 * is unreachable, so the app always works offline.
 *
 * Returns: { result, loading, error, isOffline }
 */

import { useState, useEffect, useRef } from "react";
import { predict as apiPredict }       from "../services/api.js";
import { runPredict }                   from "../engine/predict.js";

export default function usePrediction({
  hospitalId,
  queueKey,
  hour,
  dayOfWeek,
  peopleAhead,
  // Local fallback data (from hospitals.js — used when API is down)
  localHospitals,
  feedbackData,
  learnedServiceMap,
}) {
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Debounce so rapid slider moves don't flood the API
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!hospitalId || !queueKey || hour == null || dayOfWeek == null) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiPredict({ hospitalId, queueKey, hour, dayOfWeek, peopleAhead });
        setResult(res);
        setIsOffline(false);
      } catch (err) {
        // Network error or server down → fall back to local engine
        if (!err.status || err.status === 0) {
          setIsOffline(true);
          const fallback = runPredict({
            hospitalId, queueKey, hour, dayOfWeek,
            peopleAhead, feedbackData, learnedServiceMap,
          });
          setResult(fallback);
        } else {
          setError(err?.error ?? "Prediction failed");
        }
      } finally {
        setLoading(false);
      }
    }, 180);   // 180ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [hospitalId, queueKey, hour, dayOfWeek, peopleAhead]);

  return { result, loading, error, isOffline };
}
