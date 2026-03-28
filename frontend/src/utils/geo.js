/**
 * GEO UTILITIES
 * Pure functions for distance and time calculations.
 */

/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * @returns {number} distance in kilometres
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Human-readable distance string.
 * @param {number} km
 * @returns {string}  e.g. "350 m" or "4.2 km"
 */
export function fmtDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/**
 * Rough city-traffic drive time estimate (assumes avg 25 km/h).
 * @param {number} km
 * @returns {string}  e.g. "~12 min drive"
 */
export function fmtDrive(km) {
  const mins = Math.round((km / 25) * 60);
  if (mins < 2) return "< 2 min drive";
  if (mins < 60) return `~${mins} min drive`;
  return `~${Math.floor(mins / 60)}h ${mins % 60}m drive`;
}
