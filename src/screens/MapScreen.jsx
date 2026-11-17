// Person 1: Map & Spots
import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import CategoryFilter from '../components/CategoryFilter.jsx'
import { categoryById } from '../data/categories.js'
import { distanceMeters, formatDistance } from '../lib/geo.js'

const LISBON = [38.714, -9.145]

export default function MapScreen({ spots, collectedIds, position, onCheckOff, newThisMonth }) {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const visible = filter === 'all' ? spots : spots.filter((s) => s.category === filter)
  const selected = spots.find((s) => s.id === selectedId)

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
        <MapContainer center={LISBON} zoom={13} className="map" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visible.map((spot) => {
            const color = categoryById(spot.category)?.color ?? '#666'
            const collected = collectedIds.has(spot.id)
            return (
              <CircleMarker
                key={spot.id}
                center={[spot.lat, spot.lng]}
                radius={spot.id === selectedId ? 12 : 9}
                pathOptions={{
                  color,
                  weight: 3,
                  fillColor: collected ? color : '#FFFFFF',
                  fillOpacity: 1,
                  dashArray: collected ? null : '4 3',
                }}
                eventHandlers={{ click: () => setSelectedId(spot.id) }}
              >
                <Tooltip>{spot.name}</Tooltip>
              </CircleMarker>
            )
          })}
          {position && (
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={7}
              pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }}
            />
          )}
        </MapContainer>

        {selected && (
          <div className="spot-card">
            <div className="spot-card-top">
              <div>
                <p className="eyebrow" style={{ color: categoryById(selected.category)?.color }}>
                  {categoryById(selected.category)?.label} · {selected.rarity}
                </p>
                <h2>{selected.name}</h2>
                <p className="muted">
                  {position ? `${formatDistance(distanceMeters(position, selected))} away` : 'Location unknown'}
                  {' · '}
                  {collectedIds.has(selected.id) ? 'collected' : 'not collected yet'}
                </p>
              </div>
              <button className="icon-btn" aria-label="Close" onClick={() => setSelectedId(null)}>
                ×
              </button>
            </div>
            {!collectedIds.has(selected.id) && (
              <button className="primary" onClick={() => onCheckOff(selected)}>
                Check off
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
