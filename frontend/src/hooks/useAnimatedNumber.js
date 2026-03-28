/**
 * useAnimatedNumber
 * Smoothly interpolates to a new numeric target using easing.
 * Used for live prediction range numbers so they animate on change.
 */

import { useState, useEffect, useRef } from "react";

export default function useAnimatedNumber(target, duration = 380) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const to   = target;
    if (from === to) return;

    const steps = Math.ceil(duration / 16);
    let i = 0;

    const id = setInterval(() => {
      i++;
      const t      = i / steps;
      // ease-in-out quad
      const eased  = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Math.round(from + (to - from) * eased));

      if (i >= steps) {
        clearInterval(id);
        prev.current = to;
      }
    }, 16);

    return () => clearInterval(id);
  }, [target, duration]);

  return display;
}
