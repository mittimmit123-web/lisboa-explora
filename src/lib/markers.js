// Small rules for how spots look on the map. Plain functions, so they can
// be tested in tests/markers.test.js.

// One emoji per category. Food spots have a different emoji per kind,
// but keep the same colour and the same filter button.
const CATEGORY_EMOJI = {
  viewpoint: '🌅',
  monument: '🏛️',
  church: '⛪',
  park: '🌳',
  square: '⛲',
  nightlife: '🍸',
  campus: '🎓',
}
const FOOD_EMOJI = { cafe: '☕', restaurant: '🍴', market: '🧺' }

export function emojiFor(spot) {
  if (spot.category === 'food') return FOOD_EMOJI[spot.kind] ?? FOOD_EMOJI.restaurant
  return CATEGORY_EMOJI[spot.category] ?? '📍'
}

// From this zoom level on, ALL spots are shown. Below it (city overview),
// only the highlights, so the map does not get crowded.
// Zoom 12 = all of Lisbon, 15 = a neighbourhood, 18 = a street.
// 16, not 15: at 15 the city centre drew ~680 markers at once and zooming
// stuttered; at 16 it is about half (#40).
export const SHOW_ALL_ZOOM = 16

export function isVisibleAtZoom(spot, zoom) {
  return zoom >= SHOW_ALL_ZOOM || spot.highlight === true
}

// Only spots inside the visible part of the map are drawn. That keeps the
// map fast on phones. bounds: { south, west, north, east }
export function isInBounds(spot, bounds) {
  return spot.lat >= bounds.south && spot.lat <= bounds.north && spot.lng >= bounds.west && spot.lng <= bounds.east
}

// Category filter: `selected` is a list of category ids. An empty list means
// "All", so deselecting the last category shows everything again.
export function toggleCategory(selected, id) {
  return selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]
}

export function matchesFilter(spot, selected) {
  return selected.length === 0 || selected.includes(spot.category)
}

// Collected filter, a second question next to the categories: show every
// spot, only the ones already in the journal, or only the ones still
// missing. The two filters work independently, so "Viewpoints" + "missing"
// answers "where do I still have to go?".
export const STATUSES = ['all', 'collected', 'missing']

export function matchesStatus(spot, status, collectedIds) {
  if (status === 'collected') return collectedIds.has(spot.id)
  if (status === 'missing') return !collectedIds.has(spot.id)
  return true
}

// Below SHOW_ALL_ZOOM only highlights are drawn, otherwise the city view is
// a wall of pins. Collected spots are the exception: there are only ever a
// few dozen, and someone asking "where have I been?" wants to see them from
// above. Without this, filtering to "collected" while zoomed out shows an
// empty map, because a collected spot is rarely a highlight.
export function isVisibleAtZoomForStatus(spot, zoom, status) {
  return status === 'collected' || isVisibleAtZoom(spot, zoom)
}

// Link that opens walking directions in Google Maps (new tab / Maps app).
export function directionsUrl(spot) {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`
}
