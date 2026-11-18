// Person 1: Map & Spots
import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import CategoryFilter from '../components/CategoryFilter.jsx'
import { categoryById } from '../data/categories.js'
import { distanceMeters, formatDistance } from '../lib/geo.js'
import { SHOW_ALL_ZOOM, directionsUrl, emojiFor, isInBounds, isVisibleAtZoom } from '../lib/markers.js'

const LISBON = [38.725, -9.15]
const START_ZOOM = 12 // overview of the whole city
const ME_ZOOM = 16 // zoom when jumping to the player's position

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

// Tells the screen whenever the map is moved or zoomed.
function MapWatcher({ onChange }) {
  const map = useMapEvents({
    moveend: () => onChange(map),
    zoomend: () => onChange(map),
  })
  useEffect(() => onChange(map), [map, onChange])
  return null
}

function readView(map) {
  // pad(0.2): also draw spots just outside the screen, so panning looks smooth
  const b = map.getBounds().pad(0.2)
  return { zoom: map.getZoom(), bounds: { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } }
}

export default function MapScreen({ spots, collectedIds, position, onCheckOff, newThisMonth }) {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [map, setMap] = useState(null)
  const [view, setView] = useState(null)
  const flewToMe = useRef(false)
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

  const selected = spots.find((s) => s.id === selectedId)
  const visible = !view
    ? []
    : spots.filter(
        (s) =>
          (filter === 'all' || s.category === filter) &&
          isVisibleAtZoom(s, view.zoom) &&
          isInBounds(s, view.bounds),
      )
  // The selected spot always stays on the map, even after zooming out.
  if (selected && !visible.includes(selected)) visible.push(selected)

  const category = selected && categoryById(selected.category)
  const collected = selected && collectedIds.has(selected.id)

  return (
    <div className="screen map-screen">
      <header className="screen-header">
        <h1>Lisbon</h1>
        <p className="muted">
          {collectedIds.size} collected · {newThisMonth} new this month
        </p>
      </header>

      <CategoryFilter value={filter} onChange={setFilter} />

      <div className="map-wrap">
        <MapContainer center={LISBON} zoom={START_ZOOM} className="map" scrollWheelZoom ref={setMap}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapWatcher onChange={handleViewChange} />
          {visible.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={markerIcon(spot, collectedIds.has(spot.id), spot.id === selectedId)}
              title={spot.name}
              zIndexOffset={spot.id === selectedId ? 1000 : 0}
              eventHandlers={{ click: () => setSelectedId(spot.id) }}
            />
          ))}
          {position && (
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={7}
              pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }}
            />
          )}
        </MapContainer>

        {view && view.zoom < SHOW_ALL_ZOOM && (
          <div style={styles.hint}>Showing highlights · zoom in to see all spots</div>
        )}

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
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
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
    bottom: 12,
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
