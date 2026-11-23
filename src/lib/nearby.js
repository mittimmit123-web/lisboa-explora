// The "Add spot" tab: spots the player has not collected yet, closest first.
// Plain functions, tested in tests/nearby.test.js.
import { CHECK_RADIUS_M, distanceMeters } from './geo.js'

// Lower case without accents, so "sao jorge" finds "São Jorge".
export const simplify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// [{ spot, distance }]: spots not collected yet whose name contains `query`.
// With a position: closest first (distance in metres). Without one (no GPS):
// sorted by name, distance null.
export function nearbySpots(spots, collectedIds, position, { query = '', limit = 10 } = {}) {
  const words = simplify(query.trim())
  return spots
    .filter((spot) => !collectedIds.has(spot.id) && simplify(spot.name).includes(words))
    .map((spot) => ({ spot, distance: position ? distanceMeters(position, spot) : null }))
    .sort((a, b) => (position ? a.distance - b.distance : a.spot.name.localeCompare(b.spot.name)))
    .slice(0, limit)
}

// ⭐ next to a spot: close enough (CHECK_RADIUS_M) for the "verified on
// site" mark, so the hint follows the radius instead of repeating a number.
// The server decides the real mark; this is only a hint. No GPS = no star.
export function inStarRange(distance) {
  return distance !== null && distance <= CHECK_RADIUS_M
}
