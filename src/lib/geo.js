// Distance helpers.
//
// The REAL check happens on the server (see supabase/schema.sql, function
// check_off). This copy is used for showing "320 m away" in the app and for
// demo mode. Both use the same formula (haversine).

export const CHECK_RADIUS_M = 50

const EARTH_RADIUS_M = 6371000

function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Distance in metres between two points { lat, lng }.
export function distanceMeters(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function isWithinRadius(position, spot, radius = CHECK_RADIUS_M) {
  return distanceMeters(position, spot) <= radius
}

// "45 m" or "1.2 km"
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
