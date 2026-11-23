// The maths behind our smooth trackpad / mouse-wheel zoom
// (src/lib/smoothWheelZoom.js). Plain functions without Leaflet, so the
// tests can check them on their own (tests/zoomMath.test.js).

// How many zoom levels one pixel of scrolling is worth.
// Bigger = faster. 0.04 means 25 px of scrolling = one zoom level.
export const ZOOM_PER_PIXEL = 0.04
export const GLIDE = 0.3 // share of the remaining way the map moves per frame
export const END_AFTER_MS = 200 // the zoom is over after this long without scrolling
const CLOSE_ENOUGH = 0.01 // closer than this to the goal = arrived

// A scroll event moves the goal zoom level. Scrolling up (positive pixels)
// zooms in. The goal never goes past the map's smallest or largest zoom.
export function addScroll(goal, pixels, minZoom, maxZoom) {
  return Math.min(maxZoom, Math.max(minZoom, goal + pixels * ZOOM_PER_PIXEL))
}

// One screen frame: move 30 % of the remaining way to the goal, so the map
// glides instead of jumping. When it is very close, jump onto the goal, so
// the glide really ends.
export function glideStep(current, goal) {
  const next = current + (goal - current) * GLIDE
  return Math.abs(goal - next) < CLOSE_ENOUGH ? goal : next
}

// The zoom is finished once the map has reached the goal AND nobody has
// scrolled for END_AFTER_MS. Otherwise we wait: a trackpad sends scroll
// events in bursts, and more may follow.
export function zoomIsOver(current, goal, msSinceLastScroll) {
  return current === goal && msSinceLastScroll > END_AFTER_MS
}
