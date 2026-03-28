/**
 * useGeocode
 * ----------
 * Geocodes a hospital name using OpenStreetMap Nominatim (free, no API key).
 * Returns { coords, area, loading, error }.
 *
 * Adds "hospital" and city to the query for better results.
 * Results are cached in memory so we don't re-fetch the same query.
 */

import { useState, useEffect, useRef } from "react";

const CACHE = new Map();

export default function useGeocode(query, cityHint = "Chennai") {
  const [coords,  setCoords]  = useState(null);
  const [area,    setArea]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const q = (query ?? "").trim();
    if (!q) {
      setCoords(null); setArea(null); setError(null);
      return;
    }

    const cacheKey = `${q}__${cityHint}`.toLowerCase();
    if (CACHE.has(cacheKey)) {
      const cached = CACHE.get(cacheKey);
      setCoords(cached.coords);
      setArea(cached.area);
      setLoading(false);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    // Build a good Nominatim query: "<name> hospital <city>"
    const searchTerm = encodeURIComponent(`${q} hospital ${cityHint}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${searchTerm}&format=json&limit=3&countrycodes=in`;

    fetch(url, {
      signal: abortRef.current.signal,
      headers: { "Accept-Language": "en" },
    })
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0) {
          setError("not_found");
          setLoading(false);
          return;
        }

        // Pick the best result — prefer results with "hospital" in the display name
        const best = data.find(d =>
          d.display_name?.toLowerCase().includes("hospital") ||
          d.type === "hospital" || d.class === "amenity"
        ) ?? data[0];

        const result = {
          coords: { lat: parseFloat(best.lat), lng: parseFloat(best.lon) },
          area:    best.display_name?.split(",").slice(0, 3).join(", ") ?? cityHint,
        };

        CACHE.set(cacheKey, result);
        setCoords(result.coords);
        setArea(result.area);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        setError("fetch_failed");
        setLoading(false);
      });

    return () => abortRef.current?.abort();
  }, [query, cityHint]);

  return { coords, area, loading, error };
}
