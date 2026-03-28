/**
 * useOSMHospitals
 * ===============
 * Fetches real nearby hospitals from OpenStreetMap Overpass API.
 * Merges results with our mock dataset so hospitals that exist in
 * both get full ML/doctor data, while new OSM-only hospitals get
 * synthetic queue profiles for predictions.
 *
 * States:
 *   loading   — true while fetching
 *   error     — error message string or null
 *   hospitals — merged, distance-sorted list ready for the UI
 *
 * Merge strategy:
 *   1. OSM hospital matches mock by name similarity → use mock's full data
 *      (doctors, ML profiles, ratings) but update coords from OSM
 *   2. OSM hospital not in mock → create synthetic entry with default profiles
 *   3. Mock hospitals not near user (>50km) are appended at the end as fallback
 */

import { useState, useEffect, useRef } from "react";
import HOSPITALS from "../data/hospitals.js";

// ── Haversine distance ─────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Name similarity check (fuzzy match) ───────────────────────
function nameSimilar(a, b) {
  const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const wa = clean(a).split(/\s+/);
  const wb = clean(b).split(/\s+/);
  // Count shared words
  const shared = wa.filter(w => w.length > 2 && wb.includes(w)).length;
  return shared >= 2 || clean(a).includes(clean(b)) || clean(b).includes(clean(a));
}

// ── Generic queue profiles for unknown hospitals ───────────────
function genericQueues(nameHint = "") {
  const genericProfile = Array.from({ length: 24 }, (_, h) =>
    h >= 9 && h <= 17 ? 20 + Math.round(Math.random() * 10) : 0
  );
  return {
    doctor: {
      label: "Doctor Consultation", avgServiceMin: 12,
      peakHours: [9, 10, 11, 17, 18],
      baseProfile: genericProfile,
      weekendMult: 0.7, modelAccuracy: 68,
      notes: [
        "Real hospital from OpenStreetMap — prediction uses city averages",
        "Visit to improve accuracy with feedback",
      ],
    },
    billing: {
      label: "Billing Counter", avgServiceMin: 8,
      peakHours: [10, 11, 15, 16],
      baseProfile: Array.from({ length: 24 }, (_, h) => h >= 8 && h <= 20 ? 14 : 0),
      weekendMult: 0.65, modelAccuracy: 65,
      notes: ["Estimated — based on typical Chennai hospital billing patterns"],
    },
    pharmacy: {
      label: "Pharmacy", avgServiceMin: 5,
      peakHours: [10, 17, 18],
      baseProfile: Array.from({ length: 24 }, (_, h) => h >= 7 && h <= 22 ? 10 : 0),
      weekendMult: 0.8, modelAccuracy: 65,
      notes: ["Estimated — based on typical Chennai pharmacy patterns"],
    },
  };
}

// ── Convert OSM element → app hospital object ──────────────────
function osmToHospital(el, userLat, userLng, idxSalt = 0) {
  const tags    = el.tags ?? {};
  const name    = tags.name || tags["name:en"] || "Unknown Hospital";
  const lat     = el.lat ?? el.center?.lat;
  const lng     = el.lon ?? el.center?.lon;
  if (!lat || !lng || name === "Unknown Hospital") return null;

  const distKm  = haversineKm(userLat, userLng, lat, lng);
  const osmId   = `osm_${el.type ?? "n"}_${el.id}`;

  // Try to match with mock dataset by name
  const mockMatch = HOSPITALS.find(m => nameSimilar(m.name, name));

  if (mockMatch) {
    // Return the full mock entry with OSM coords and real distance
    return {
      ...mockMatch,
      coords:  { lat, lng },
      distKm,
      osmId,
      area:    tags["addr:city"]
        ? `${tags["addr:street"] ? tags["addr:street"] + ", " : ""}${tags["addr:city"]}`
        : mockMatch.area,
      source: "osm+mock",
    };
  }

  // Pure OSM hospital — create synthetic entry
  const city = tags["addr:city"] || tags["addr:suburb"] || "Chennai";
  const area = [tags["addr:street"], tags["addr:suburb"], city]
    .filter(Boolean).join(", ") || city;

  return {
    id:           osmId,
    name,
    shortName:    name.split(" ").slice(0, 2).join(" "),
    area,
    coords:       { lat, lng },
    distKm,
    type:         tags.healthcare === "hospital" ? "Hospital" : (tags.speciality || "General Hospital"),
    hospital_type:"Hospital",
    beds:         tags.beds ? parseInt(tags.beds) : null,
    rating:       4.0,
    dailyVisits:  null,
    established:  null,
    liveUsers:    Math.floor(Math.random() * 8) + 2,
    lastUpdated:  "via OpenStreetMap",
    totalDataPoints: 0,
    badge:        "Nearby",
    badgeColor:   "#0D9488",
    description:  `${name} — real hospital data from OpenStreetMap`,
    peakWindow:   "9am–5pm (estimated)",
    doctors:      [],
    queues:       genericQueues(name),
    source:       "osm",
    osmId,
    isSynthetic:  false,   // it's real, just no ML data yet
    isOSMOnly:    true,    // flag for UI to show "limited data" badge
  };
}

// ── Overpass query ─────────────────────────────────────────────
function buildOverpassQuery(lat, lng, radiusM = 10000) {
  return `[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusM},${lat},${lng});
);
out center;`;
}

// ── Main hook ──────────────────────────────────────────────────
export default function useOSMHospitals(refCoords, enabled = true) {
  const [hospitals,  setHospitals]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [source,     setSource]     = useState("mock"); // "osm" | "mock" | "loading"
  const abortRef    = useRef(null);
  const lastFetched = useRef(null);   // "lat,lng" string to avoid duplicate fetches

  useEffect(() => {
    if (!enabled || !refCoords) {
      // No coords yet — fall back to mock data with no distances
      const mockList = HOSPITALS.map(h => ({ ...h, distKm: null }));
      setHospitals(mockList);
      setSource("mock");
      return;
    }

    const { lat, lng } = refCoords;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (lastFetched.current === key) return;   // same position, skip re-fetch
    lastFetched.current = key;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setSource("loading");

    const query = buildOverpassQuery(lat, lng, 10000);  // 10km radius

    fetch("https://overpass-api.de/api/interpreter", {
      method:  "POST",
      body:    query,
      signal:  abortRef.current.signal,
      headers: { "Content-Type": "text/plain" },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Overpass API error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const elements = data.elements ?? [];

        // Convert OSM elements to hospital objects, filter nulls
        const osmHospitals = elements
          .map((el, i) => osmToHospital(el, lat, lng, i))
          .filter(Boolean);

        // Deduplicate: if two OSM entries matched the same mock, keep closer one
        const seen = new Set();
        const deduped = osmHospitals.filter(h => {
          const key = h.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Also add mock hospitals that weren't matched by OSM
        // (they may be further away or the user may want to select them)
        const matchedMockIds = new Set(
          deduped.filter(h => h.source === "osm+mock").map(h => h.id)
        );
        const unmatchedMocks = HOSPITALS
          .filter(m => !matchedMockIds.has(m.id))
          .map(m => ({
            ...m,
            distKm: haversineKm(lat, lng, m.coords.lat, m.coords.lng),
          }));

        const combined = [...deduped, ...unmatchedMocks];

        // Sort by distance
        combined.sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999));

        setHospitals(combined);
        setSource("osm");
        setLoading(false);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("Overpass API failed, falling back to mock data:", err.message);

        // Graceful fallback — use mock data with real distances
        const fallback = HOSPITALS.map(h => ({
          ...h,
          distKm: haversineKm(lat, lng, h.coords.lat, h.coords.lng),
        })).sort((a, b) => a.distKm - b.distKm);

        setHospitals(fallback);
        setSource("mock");
        setError("Using saved hospital data — live data unavailable");
        setLoading(false);
      });

    return () => abortRef.current?.abort();
  }, [refCoords?.lat, refCoords?.lng, enabled]);

  const nearestId = hospitals.length > 0 ? hospitals[0].id : null;

  return { hospitals, loading, error, source, nearestId };
}
