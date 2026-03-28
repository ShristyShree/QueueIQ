/**
 * TIME UTILITIES
 */

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Convert 24h integer to 12h string.
 * @param {number} h  0–23
 * @returns {string}  e.g. "9am", "12pm", "5pm"
 */
export function fmt12(h) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/**
 * Returns true if day integer is a weekend (0=Sun, 6=Sat).
 */
export function isWeekend(day) {
  return day === 0 || day === 6;
}
