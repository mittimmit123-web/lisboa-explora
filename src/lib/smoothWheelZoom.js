// Smooth zooming with a trackpad or mouse wheel, like Google Maps (#40).
//
// Leaflet's own wheel zoom works in steps: every step plays a 0.25 s
// animation, and any scrolling during that animation is ignored. That made
// the map feel slow and laggy. Here the map follows the scrolling directly:
//   1. Every scroll event moves a "goal" zoom level a little.
//   2. On every screen frame the map moves 30 % of the way to that goal,
//      so it glides smoothly instead of jumping.
//   3. The point under the mouse stays where it is (zoom "into" the mouse).
//   4. When the goal is reached and nobody has scrolled for 200 ms, the zoom
//      is finished, and Leaflet tells the rest of the app (zoomend/moveend),
//      which updates the markers.
//
// Same idea as the Leaflet.SmoothWheelZoom plugin, written for this project
// so we do not need an extra library. It uses three of Leaflet's internal
// functions (_moveStart, _move, _moveEnd), the same ones Leaflet uses itself
// while you pinch-zoom on a phone.
// The numbers and the maths are in src/lib/zoomMath.js (tested there).
import L from 'leaflet'
import { addScroll, glideStep, zoomIsOver } from './zoomMath.js'

export function enableSmoothWheelZoom(map) {
  const container = map.getContainer()
  let goalZoom = null // null = not zooming right now
  let mousePoint = null // mouse position in the map, in pixels
  let mouseLatLng = null // the place on the map under the mouse
  let frame = null
  let lastWheel = 0 // time of the last scroll event

  function onWheel(event) {
    event.preventDefault() // do not scroll the page
    if (goalZoom === null) {
      map.stop() // stop a running flyTo or pan
      goalZoom = map.getZoom()
      map._moveStart(true, false)
      frame = requestAnimationFrame(step)
    }
    mousePoint = map.mouseEventToContainerPoint(event)
    mouseLatLng = map.containerPointToLatLng(mousePoint)
    const pixels = L.DomEvent.getWheelDelta(event) // up = positive
    goalZoom = addScroll(goalZoom, pixels, map.getMinZoom(), map.getMaxZoom())
    lastWheel = performance.now()
  }

  function step() {
    const current = map.getZoom()
    const zoom = glideStep(current, goalZoom)
    if (zoom === current) {
      // Goal reached: finish, or wait in case more scrolling follows.
      if (zoomIsOver(current, goalZoom, performance.now() - lastWheel)) finish()
      else frame = requestAnimationFrame(step)
      return
    }
    // Choose the new centre so that the place under the mouse stays put.
    const offset = mousePoint.subtract(map.getSize().divideBy(2))
    const center = map.unproject(map.project(mouseLatLng, zoom).subtract(offset), zoom)
    map._move(center, zoom)
    frame = requestAnimationFrame(step)
  }

  function finish() {
    goalZoom = null
    map._moveEnd(true)
  }

  container.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    container.removeEventListener('wheel', onWheel)
    cancelAnimationFrame(frame)
  }
}
