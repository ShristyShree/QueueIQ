/**
 * useSmartSearch v5
 * =================
 * Google Maps-style: always returns results, real geocoded distance for unknowns.
 *
 * CASE 1: Query matches a real hospital  → show matches ranked by score
 * CASE 2: Query matches nothing          → synthetic entry at top with REAL
 *         distance (from Nominatim geocode) + all hospitals sorted by distance
 *
 * KEY RULES:
 * - textScore > 0 required to count as a text match
 * - distance/rating only affect RANKING among real matches
 * - Synthetic entry uses actual geocoded coordinates when available
 */

import { useState, useMemo, useCallback } from "react";

// ── Haversine ─────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Highlight ranges ──────────────────────────────────────────────
export function highlightRanges(text, query) {
  if (!query || !text) return [];
  const lower = text.toLowerCase();
  const q     = query.toLowerCase();
  const ranges = [];
  let i = lower.indexOf(q);
  while (i !== -1) { ranges.push([i, i + q.length]); i = lower.indexOf(q, i + 1); }
  return ranges;
}

// ── Text match score (0 = no match) ──────────────────────────────
function textMatchScore(hospital, q) {
  const lq   = q.toLowerCase().trim();
  const name = (hospital.name        ?? "").toLowerCase();
  const sn   = (hospital.shortName   ?? "").toLowerCase();
  const area = (hospital.area        ?? "").toLowerCase();
  const type = (hospital.type ?? hospital.hospital_type ?? "").toLowerCase();

  if (name === lq || sn === lq)                  return 1.0;
  if (name.startsWith(lq) || sn.startsWith(lq)) return 0.9;
  if (name.includes(lq) || sn.includes(lq))      return 0.75;
  if (area.includes(lq))                          return 0.5;
  if (type.includes(lq))                          return 0.35;

  const doctorMatch = (hospital.doctors ?? []).some(d =>
    (d.specialty ?? "").toLowerCase().includes(lq) ||
    (d.name      ?? "").toLowerCase().includes(lq)
  );
  return doctorMatch ? 0.6 : 0;
}

// ── Build synthetic hospital entry ────────────────────────────────
function makeSyntheticEntry(query, hospitals, refCoords, geocodedCoords, geocodedArea) {
  const cityGuess = hospitals[0]?.area?.split(",").slice(-1)[0]?.trim() ?? "Chennai";

  // Distance: use real geocoded coords if available, else null
  let distKm = null;
  let resolvedCoords = geocodedCoords;

  if (refCoords && geocodedCoords) {
    distKm = parseFloat(haversineKm(
      refCoords.lat, refCoords.lng,
      geocodedCoords.lat, geocodedCoords.lng
    ).toFixed(1));
  } else if (refCoords && !geocodedCoords) {
    // Geocode not ready yet — show null so we don't display wrong distance
    distKm = null;
    resolvedCoords = null;
  }

  const genericProfile = Array.from({ length: 24 }, (_, h) =>
    h >= 9 && h <= 17 ? 20 : 0
  );

  return {
    id:           `__search__${query.trim().toLowerCase().replace(/\s+/g, "_")}`,
    name:          query.trim(),
    shortName:     query.trim(),
    area:          geocodedArea ?? cityGuess,
    type:         "Hospital",
    hospital_type:"Hospital",
    rating:        4.0,
    dailyVisits:   null,
    distKm,
    badge:        "Search result",
    badgeColor:   "#6366F1",
    doctors:       [],
    coords:        resolvedCoords ?? hospitals[0]?.coords ?? { lat: 13.08, lng: 80.27 },
    queues: {
      doctor: {
        label: "Doctor Consultation", avgServiceMin: 12,
        peakHours: [9, 10, 11, 17, 18],
        baseProfile: genericProfile,
        weekendMult: 0.7, modelAccuracy: 70,
        notes: ["Estimated data — this hospital is not in our dataset yet"],
      },
      billing: {
        label: "Billing Counter", avgServiceMin: 7,
        peakHours: [10, 11, 15, 16],
        baseProfile: Array.from({ length: 24 }, (_, h) => h >= 8 && h <= 20 ? 15 : 0),
        weekendMult: 0.65, modelAccuracy: 70,
        notes: ["Estimated data — this hospital is not in our dataset yet"],
      },
      pharmacy: {
        label: "Pharmacy", avgServiceMin: 5,
        peakHours: [10, 17, 18],
        baseProfile: Array.from({ length: 24 }, (_, h) => h >= 7 && h <= 22 ? 10 : 0),
        weekendMult: 0.8, modelAccuracy: 70,
        notes: ["Estimated data — this hospital is not in our dataset yet"],
      },
    },
    isSynthetic:  true,
    score:        999,
    nameRanges:   [[0, query.trim().length]],
    areaRanges:   [],
    tags:        ["Search result"],
  };
}

// ── Main hook ─────────────────────────────────────────────────────
export default function useSmartSearch(hospitals, refCoords, geocodedCoords, geocodedArea) {
  const [query,   setQuery]   = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const maxDist = Math.max(...hospitals.map(h => h.distKm ?? 50), 1);

    // Score all hospitals — only textScore > 0 counts as a match
    const scored = hospitals.map(h => {
      const textScore = textMatchScore(h, q);
      const distScore = textScore > 0
        ? 1 - Math.min((h.distKm ?? 50) / maxDist, 1) : 0;
      const rateScore = textScore > 0
        ? Math.max(0, ((h.rating ?? 4) - 3.0) / 2.0) : 0;
      const finalScore = textScore > 0
        ? textScore * 0.6 + distScore * 0.3 + rateScore * 0.1
        : 0;

      const tags = [];
      if (textScore >= 0.85)       tags.push("Best match");
      if ((h.distKm ?? 999) < 5)  tags.push("Nearby");
      if ((h.rating ?? 0) >= 4.4) tags.push("Top rated");

      return {
        ...h, textScore, score: finalScore,
        nameRanges: highlightRanges(h.name ?? "", q),
        areaRanges: highlightRanges(h.area ?? "", q),
        tags,
      };
    });

    const realMatches = scored
      .filter(h => h.textScore > 0)
      .sort((a, b) => b.score - a.score);

    if (realMatches.length > 0) return realMatches.slice(0, 7);

    // No real match → synthetic + all hospitals by distance
    const nearbyAll = hospitals
      .slice()
      .sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999))
      .map(h => ({
        ...h, textScore: 0, score: 0, nameRanges: [], areaRanges: [],
        tags: (h.distKm ?? 999) < 5 ? ["Nearby"] : [],
      }));

    const synthetic = makeSyntheticEntry(q, hospitals, refCoords, geocodedCoords, geocodedArea);
    return [synthetic, ...nearbyAll];
  }, [query, hospitals, refCoords, geocodedCoords, geocodedArea]);

  const clear  = useCallback(() => setQuery(""), []);
  const isOpen = focused && query.trim().length > 0;

  return { query, setQuery, suggestions, isOpen, setFocused, clear };
}
