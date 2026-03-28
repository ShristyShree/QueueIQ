/**
 * useGeolocation
 *
 * Robust GPS hook — never blocks the app on denial.
 * States: idle | requesting | granted | denied | unavailable
 *
 * On denial the app falls back to the selected city centre automatically.
 * The hook only requests when the user explicitly opts in.
 */

import { useState, useCallback } from "react";

const INITIAL = {
  status: "idle", // idle | requesting | granted | denied | unavailable
  coords: null,   // { lat, lng } or null
  error:  null,   // human-readable string or null
};

export default function useGeolocation() {
  const [state, setState] = useState(INITIAL);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "unavailable", coords: null, error: null });
      return;
    }

    setState((s) => ({ ...s, status: "requesting", error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        }),
      (err) => {
        const msg =
          err.code === 1 ? "Location access denied." :
          err.code === 2 ? "Location signal unavailable." :
          "Location request timed out.";
        // Denied → soft fallback, NOT a hard error
        setState({ status: "denied", coords: null, error: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, request };
}
