// Distance helpers.
//
// A check-off is NEVER refused because of distance. Being within
// CHECK_RADIUS_M only earns the "verified on site" mark, and the SERVER
// decides that (see supabase/schema.sql, function check_off). This copy is
// used for showing "320 m away" in the app and for demo mode.
// Both use the same formula (haversine).

// 150 m, not 50. In the narrow streets of central Lisbon the signal
// bounces off the buildings and the phone can be tens of metres off, so a
// smaller radius measured the signal instead of the visit. See DECISIONS.md.
// This number must match check_off() in supabase/schema.sql.
export const CHECK_RADIUS_M = 150

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

// GPS accuracy: the phone says "I'm here, give or take `accuracy` metres".
// Worse than WEAK_GPS_M and the reading is vague enough to change whether the
// player gets the mark, so the screen says so.
//
// This used to default to CHECK_RADIUS_M, which was the same number by
// accident. They mean different things - one is how close you have to be, the
// other is how much the phone is guessing - so widening the radius to 150 m
// must not quietly stop the warning. They are separate now.
// Example: isGpsWeak(25) -> false, isGpsWeak(120) -> true
export const WEAK_GPS_M = 50

export function isGpsWeak(accuracy, limit = WEAK_GPS_M) {
  return accuracy > limit
}

// Warn about weak GPS only when the player would NOT get the mark: then a bad
// reading may be why they look too far away. When they are already within the
// radius, the server gives the mark anyway (it only uses the reported
// position), so a warning would contradict the green "You're here" message.
export function showGpsWarning(accuracy, willVerify) {
  return !willVerify && accuracy !== null && isGpsWeak(accuracy)
}
