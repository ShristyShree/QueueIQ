/**
 * CITY FALLBACK LIST
 * Used as reference coordinates when GPS is unavailable or denied.
 * Hospitals are always sorted by distance from either GPS fix or city centre.
 */

const CITIES = [
  { id: "chennai",    name: "Chennai",    coords: { lat: 13.0827, lng: 80.2707 } },
  { id: "bangalore",  name: "Bangalore",  coords: { lat: 12.9716, lng: 77.5946 } },
  { id: "mumbai",     name: "Mumbai",     coords: { lat: 19.0760, lng: 72.8777 } },
  { id: "delhi",      name: "Delhi",      coords: { lat: 28.6139, lng: 77.2090 } },
  { id: "hyderabad",  name: "Hyderabad",  coords: { lat: 17.3850, lng: 78.4867 } },
  { id: "coimbatore", name: "Coimbatore", coords: { lat: 11.0168, lng: 76.9558 } },
];

export const DEFAULT_CITY = CITIES[0]; // Chennai

export default CITIES;
