/**
 * useHospitals
 * ------------
 * Fetches hospitals from the backend.
 * Falls back to local HOSPITALS data if the API is unreachable.
 * Re-fetches when user coordinates change (for distance sorting).
 */

import { useState, useEffect } from "react";
import { getHospitals }        from "../services/api.js";
import HOSPITALS                from "../data/hospitals.js";
import { haversineKm }          from "../utils/geo.js";

export default function useHospitals({ coords, cityCoords }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Reference point: GPS coords > city coords > null
  const ref = coords ?? cityCoords ?? null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = ref ? { lat: ref.lat, lng: ref.lng } : {};
        const { hospitals: data } = await getHospitals(params);
        setHospitals(data);
        setIsOffline(false);
      } catch {
        // API down — use local data, add distKm if we have coords
        setIsOffline(true);
        const enriched = HOSPITALS.map((h) => ({
          ...h,
          distKm: ref
            ? haversineKm(ref.lat, ref.lng, h.coords.lat, h.coords.lng)
            : null,
        }));
        const sorted = ref
          ? [...enriched].sort((a, b) => a.distKm - b.distKm)
          : enriched;
        setHospitals(sorted);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ref?.lat, ref?.lng]);

  const nearestId = hospitals.length > 0 ? hospitals[0].id : null;

  return { hospitals, loading, isOffline, nearestId };
}
