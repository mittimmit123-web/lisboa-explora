// Person 1: Map & Spots
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre paints the map with a helper script (a "worker") running in the
// background. Vite has to be told where that file is, otherwise it is not found.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { getCharacter } from '../lib/api.js'
import CategoryFilter from '../components/CategoryFilter.jsx'
import StatusFilter from '../components/StatusFilter.jsx'
import HelpMenu from '../components/HelpMenu.jsx'
import { categoryById } from '../data/categories.js'
import { LOCKED_OPACITY, NEIGHBOURHOOD_COLORS, UNLOCKED_OPACITY } from '../data/neighbourhoodColors.js'
import { LOCATION_STEPS, locationOffMessage } from '../lib/location.js'
import { distanceMeters, formatDistance } from '../lib/geo.js'
import { enableSmoothWheelZoom } from '../lib/smoothWheelZoom.js'
import { MAP_ATTRIBUTION, mapStyle } from '../lib/mapStyle.js'
import {
  SHOW_ALL_ZOOM,
  activeFilterCount,
  directionsUrl,
  emojiFor,
  emptyMapMessage,
  isInBounds,
  isVisibleAtZoomForStatus,
  matchesFilter,
  matchesStatus,
  unlockedNeighbourhoods,
} from '../lib/markers.js'

const LISBON = [38.725, -9.15]
const START_ZOOM = 12 // overview of the whole city
const ME_ZOOM = 16 // zoom when jumping to the player's position
const MAX_ZOOM = 19

setWorkerUrl(maplibreWorkerUrl)

// true  = our own map design (src/lib/mapStyle.js, painted by MapLibre)
// false = the classic OpenStreetMap map. Safe way back if the new map ever
//         causes problems, e.g. on a very old phone: change this one line.
const USE_OWN_MAP_DESIGN = true

// true  = each neighbourhood has its own soft colour, stronger once you have
//         collected a spot there (#12)
// false = no coloured neighbourhoods. Same idea: one line to switch it off.
const SHOW_NEIGHBOURHOOD_COLOURS = true

const FOOD_KIND_LABEL = { cafe: 'café', restaurant: 'restaurant', market: 'market' }
const RARITY_STYLE = {
  common: { background: '#EEF0F3', color: '#475569' },
  rare: { background: '#DBEAFE', color: '#1E3A8A' },
  legendary: { background: '#FEF3C7', color: '#92400E' },
}

// A marker is a small HTML circle with an emoji.
// Collected: filled with the category colour. Not collected: white with a
// coloured ring. Icons are cached, because creating them is slow.
const iconCache = new Map()
function markerIcon(spot, collected, selected) {
  const color = categoryById(spot.category)?.color ?? '#666'
  const emoji = emojiFor(spot)
  const key = `${color}|${emoji}|${collected}|${selected}`
  if (!iconCache.has(key)) {
    const size = selected ? 42 : 32
    const style = [
      `width:${size}px`,
      `height:${size}px`,
      'border-radius:50%',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-sizing:border-box',
      `font-size:${selected ? 22 : 16}px`,
      `background:${collected ? color : '#FFFFFF'}`,
      `border:3px solid ${collected ? '#FFFFFF' : color}`,
      'box-shadow:0 1px 4px rgba(0,0,0,0.35)',
    ].join(';')
    iconCache.set(
      key,
      L.divIcon({
        className: 'spot-marker',
        html: `<div style="${style}">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }),
    )
  }
  return iconCache.get(key)
}

// Tells the screen whenever the map is moved or zoomed. Leaflet fires
// moveend after every zoom too, so one event is enough (listening to
// zoomend as well would draw the screen twice per zoom).
function MapWatcher({ onChange }) {
  const map = useMapEvents({
    moveend: () => onChange(map),
  })
  useEffect(() => onChange(map), [map, onChange])
  return null
}

// Turns on our smooth trackpad / mouse-wheel zoom for this map.
function SmoothWheelZoom() {
  const map = useMap()
  useEffect(() => enableSmoothWheelZoom(map), [map])
  return null
}

// One spot on the map. memo: React only redraws this marker when its own
// props change (e.g. it gets selected or collected), not every time the
// screen updates, for example on each new GPS position.
const SpotMarker = memo(function SpotMarker({ spot, collected, selected, onSelect }) {
  const handlers = useMemo(() => ({ click: () => onSelect(spot.id) }), [spot.id, onSelect])
  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={markerIcon(spot, collected, selected)}
      title={spot.name}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={handlers}
    />
  )
})

// Our own map design as the background layer (see src/lib/mapStyle.js).
function OwnMapDesign() {
  const map = useMap()
  useEffect(() => {
    const layer = maplibreGL({ style: mapStyle(), attributionControl: { customAttribution: MAP_ATTRIBUTION } })
    layer.addTo(map)
    return () => layer.remove()
  }, [map])
  return null
}

// The player's location marker: their Explora on a red 3D pin (see
// src/lib/exploraPin.js). The 3D code is loaded only after the map is on
// screen, and the icon is made once, so GPS updates only move it. Returns
// null until it is ready (or without an Explora / 3D): then the blue dot shows.
function useExploraPinIcon() {
  const [icon, setIcon] = useState(null)
  useEffect(() => {
    const id = getCharacter()
    if (!id) return
    let cancelled = false
    import('../lib/exploraPin.js')
      .then(({ exploraPinPicture, PIN_SIZE, PIN_ANCHOR }) => {
        const iconUrl = exploraPinPicture(id)
        if (!cancelled) setIcon(L.icon({ iconUrl, iconSize: PIN_SIZE, iconAnchor: PIN_ANCHOR, className: 'me-pin' }))
      })
      .catch(() => {}) // no 3D on this phone: keep the blue dot
    return () => {
      cancelled = true
    }
  }, [])
  return icon
}

// Lisbon's 24 neighbourhoods as coloured areas under the markers (#12).
// The borders (src/data/parishes.js) are loaded only after the map is on
// screen, so the first start is not slower. memo + `unlocked` as one text
// ("Belém|Estrela"): the areas are only redrawn when a new neighbourhood is
// unlocked, not on every GPS update.
//
// Leaflet normally draws these areas only for the part of the map on screen,
// and redraws them only when a zoom has finished. While zooming out, the edges
// were therefore empty for a moment, and the colours came in late. padding: 1
// draws them one extra screen-width around the visible part (3 x 3 screens),
// so zooming out shows colours straight away. Only 24 areas, so this is cheap.
const NeighbourhoodColours = memo(function NeighbourhoodColours({ unlocked }) {
  const [parishes, setParishes] = useState(null)
  const renderer = useMemo(() => L.svg({ padding: 1 }), [])
  useEffect(() => {
    let cancelled = false
    import('../data/parishes.js')
      .then((m) => !cancelled && setParishes(m.PARISHES))
      .catch(() => {}) // not loaded (e.g. offline): the map simply has no colours
    return () => {
      cancelled = true
    }
  }, [])
  if (!parishes) return null
  const isUnlocked = new Set(unlocked.split('|'))
  return parishes.flatMap((parish) =>
    parish.polygons.map((ring, i) => (
      <Polygon
        key={`${parish.name}-${i}`}
        positions={ring}
        interactive={false} // taps go through to the map and the markers
        pathOptions={{
          renderer, // see the padding note above
          fillColor: NEIGHBOURHOOD_COLORS[parish.name] ?? '#CCCCCC',
          fillOpacity: isUnlocked.has(parish.name) ? UNLOCKED_OPACITY : LOCKED_OPACITY,
          color: '#FFFFFF', // thin white line between neighbourhoods
          weight: 1.5,
          opacity: 0.9,
        }}
      />
    )),
  )
})

function readView(map) {
  // pad(0.05): also draw spots just outside the screen, so panning looks
  // smooth. Kept small, because every extra marker makes zooming slower (#40).
  const b = map.getBounds().pad(0.05)
  return { zoom: map.getZoom(), bounds: { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } }
}

export default function MapScreen({ spots, collectedIds, position, locationBlocked, onCheckOff, onReplayIntro, onReplayTour }) {
  const [filter, setFilter] = useState([]) // selected category ids, [] = all
  const [status, setStatus] = useState('all') // 'all' | 'collected' | 'missing'
  const [filtersOpen, setFiltersOpen] = useState(false) // the filter card under the top bar
  const [selectedId, setSelectedId] = useState(null)
  const [map, setMap] = useState(null)
  const [view, setView] = useState(null)
  const flewToMe = useRef(false)
  const meIcon = useExploraPinIcon()
  // useCallback keeps the same function between renders, otherwise
  // MapWatcher would report the view again after every render (endless loop).
  const handleViewChange = useCallback((m) => setView(readView(m)), [])

  // Start with the city overview, then fly to the player once GPS knows
  // where they are (only the first time).
  useEffect(() => {
    if (map && position && !flewToMe.current) {
      flewToMe.current = true
      map.flyTo([position.lat, position.lng], ME_ZOOM)
    }
  }, [map, position])

  const selected = useMemo(() => spots.find((s) => s.id === selectedId), [spots, selectedId])
  const unlockedKey = unlockedNeighbourhoods(spots, collectedIds).join('|')
  // useMemo: only recalculated when the map moves, the filter changes or
  // another spot is selected, not on every GPS update.
  const visible = useMemo(() => {
    if (!view) return []
    const list = spots.filter(
      (s) =>
        matchesFilter(s, filter) &&
        matchesStatus(s, status, collectedIds) &&
        isVisibleAtZoomForStatus(s, view.zoom, status) &&
        isInBounds(s, view.bounds),
    )
    // The selected spot always stays on the map, even after zooming out.
    if (selected && !list.includes(selected)) list.push(selected)
    return list
  }, [spots, filter, status, collectedIds, view, selected])

  const emptyMessage =
    view && emptyMapMessage({ shown: visible.length, categories: filter, status, collectedCount: collectedIds.size })
  const category = selected && categoryById(selected.category)
  const collected = selected && collectedIds.has(selected.id)
  const activeFilters = activeFilterCount(filter, status)

  return (
    <div className="screen map-screen">
      {/* Full-screen map: the bar, the filters and the notes float on top of it. */}
      <header className="screen-header map-bar">
        <h1>Lisbon</h1>
        <p className="muted">{collectedIds.size} collected</p>
        <button
          className="filter-btn"
          type="button"
          aria-label="Filters"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
          {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
        </button>
        <HelpMenu onIntro={onReplayIntro} onTour={onReplayTour} />
      </header>

      {filtersOpen && (
        <div className="filter-panel">
          <CategoryFilter value={filter} onChange={setFilter} />
          <StatusFilter value={status} onChange={setStatus} />
        </div>
      )}

      <div className="map-notes">
        {/* Shown when location is blocked, so players know why their pin is missing. */}
        {locationBlocked && (
          <div className="location-banner" role="status">
            <details>
              <summary>
                Location is off 📍 <u>How to turn it on?</u>
              </summary>
              <p>{locationOffMessage(window.location.host)}</p>
              <ul>
                {LOCATION_STEPS.map((s) => (
                  <li key={s.device}>
                    <b>{s.device}:</b> {s.steps}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* An empty map explains itself (e.g. "Collected" before anything
            is collected); otherwise the zoom hint as before. */}
        {emptyMessage && <div style={styles.hint}>{emptyMessage}</div>}
        {!emptyMessage && view && view.zoom < SHOW_ALL_ZOOM && status !== 'collected' && (
          <div style={styles.hint}>Showing highlights · zoom in to see all spots</div>
        )}
        {!emptyMessage && view && view.zoom < SHOW_ALL_ZOOM && status === 'collected' && (
          <div style={styles.hint}>Everything you have collected so far</div>
        )}
      </div>

      <div className="map-wrap" data-tour="map">
        {/* scrollWheelZoom is off: our own smooth wheel zoom replaces it
            (src/lib/smoothWheelZoom.js, #40). zoomSnap 0 = any zoom level is
            allowed, so the map does not jump to a whole level afterwards. */}
        <MapContainer
          center={LISBON}
          zoom={START_ZOOM}
          className="map"
          scrollWheelZoom={false}
          zoomSnap={0}
          zoomDelta={1}
          maxZoom={MAX_ZOOM}
          ref={setMap}
        >
          {/* Classic map: one tile server address instead of a/b/c.tile...,
              as OpenStreetMap recommends (one fast connection for all tiles). */}
          {USE_OWN_MAP_DESIGN ? (
            <OwnMapDesign />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          {SHOW_NEIGHBOURHOOD_COLOURS && <NeighbourhoodColours unlocked={unlockedKey} />}
          <MapWatcher onChange={handleViewChange} />
          <SmoothWheelZoom />
          {visible.map((spot) => (
            <SpotMarker
              key={spot.id}
              spot={spot}
              collected={collectedIds.has(spot.id)}
              selected={spot.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
          {position &&
            (meIcon ? (
              <Marker position={[position.lat, position.lng]} icon={meIcon} zIndexOffset={1000} keyboard={false} />
            ) : (
              <CircleMarker
                center={[position.lat, position.lng]}
                radius={7}
                pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }}
              />
            ))}
        </MapContainer>

        <div style={styles.bottom}>
          <button
            className="icon-btn"
            style={styles.locate}
            aria-label="Centre the map on my position"
            title={position ? 'Centre on me' : 'Your position is not known yet'}
            disabled={!position}
            onClick={() => map.flyTo([position.lat, position.lng], ME_ZOOM)}
          >
            ◎
          </button>

          {selected && (
            <div className="spot-card" style={styles.card}>
              <div className="spot-card-top">
                <div>
                  <p className="eyebrow" style={{ color: category?.color }}>
                    {emojiFor(selected)} {category?.label}
                    {selected.kind && ` · ${FOOD_KIND_LABEL[selected.kind]}`}
                    <span style={{ ...styles.badge, ...RARITY_STYLE[selected.rarity] }}>{selected.rarity}</span>
                  </p>
                  <h2>{selected.name}</h2>
                  <p className="muted">
                    {selected.neighbourhood}
                    {' · '}
                    {position ? `${formatDistance(distanceMeters(position, selected))} away` : 'location unknown'}
                  </p>
                  <p className="muted" style={{ fontWeight: 700, color: collected ? category?.color : undefined }}>
                    {collected ? '✓ In your collection' : 'Not collected yet'}
                  </p>
                </div>
                <button className="icon-btn" aria-label="Close" onClick={() => setSelectedId(null)}>
                  ×
                </button>
              </div>
              <div style={styles.actions}>
                {!collected && (
                  <button className="primary" style={{ flex: 1 }} onClick={() => onCheckOff(selected)}>
                    Check off
                  </button>
                )}
                <a
                  className="icon-btn"
                  style={styles.directions}
                  href={directionsUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Directions ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Styles only used on this screen. Shared styles live in src/index.css.
const styles = {
  hint: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  },
  // Column at the bottom of the map: the locate button, and the card below it.
  bottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', // above the floating nav bar
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    pointerEvents: 'none',
  },
  locate: { pointerEvents: 'auto', fontSize: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' },
  card: { position: 'static', width: '100%', boxSizing: 'border-box', pointerEvents: 'auto' },
  badge: { marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
  actions: { display: 'flex', gap: 8 },
  directions: {
    width: 'auto',
    height: 46,
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: 'inherit',
    textDecoration: 'none',
    flex: 1,
    justifyContent: 'center',
  },
}
