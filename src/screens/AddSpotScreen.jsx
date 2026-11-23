// Person 4: another way to add a spot without searching the map.
// Shows the closest spots you haven't collected yet; tap one to check it off.
// The closest one is shown big, with a Check off button: "I'm standing here".
import { useState } from 'react'
import { categoryById } from '../data/categories.js'
import { formatDistance } from '../lib/geo.js'
import { emojiFor } from '../lib/markers.js'
import { inStarRange, nearbySpots } from '../lib/nearby.js'

// The emoji in a white circle with its category's colour, like the map pins.
function SpotIcon({ spot, big = false }) {
  return (
    <span
      className={big ? 'spot-icon big' : 'spot-icon'}
      style={{ borderColor: categoryById(spot.category)?.color }}
      aria-hidden="true"
    >
      {emojiFor(spot)}
    </span>
  )
}

function Distance({ distance }) {
  if (distance === null) return null
  return (
    <span className={inStarRange(distance) ? 'distance-pill star' : 'distance-pill'}>
      {inStarRange(distance) && '⭐ '}
      {formatDistance(distance)}
    </span>
  )
}

export default function AddSpotScreen({ spots, collectedIds, position, onPick }) {
  const [query, setQuery] = useState('')
  const list = nearbySpots(spots, collectedIds, position, { query })
  // Big card for the closest spot, only while not searching
  const closest = position && !query.trim() ? list[0] : null
  const rest = closest ? list.slice(1) : list

  return (
    <div className="screen add-spot">
      <header className="screen-header">
        <h1>Near you</h1>
        <p className="muted">Which spot are you at?</p>
      </header>
      <div className="content">
        <label className="search-pill">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="text"
            aria-label="Search a spot by name"
            placeholder="Search a spot by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {!position && <p className="status">Turn on your location to see the spots closest to you. You can still search by name.</p>}

        {closest && (
          <div className="closest-card">
            <SpotIcon spot={closest.spot} big />
            <div className="closest-text">
              <span className="section-label">Closest to you</span>
              <strong>{closest.spot.name}</strong>
              <span className="muted">{closest.spot.neighbourhood}</span>
              <span className="closest-distance">
                <Distance distance={closest.distance} />
                {inStarRange(closest.distance) && <small className="star-note">Close enough for the golden star!</small>}
              </span>
            </div>
            <button className="primary" type="button" onClick={() => onPick(closest.spot)}>
              Check off
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <p className="muted">No spot found. Try another name.</p>
        ) : (
          rest.length > 0 && (
            <>
              {closest && <p className="section-label">More spots nearby</p>}
              <ul className="nearby-list">
                {rest.map(({ spot, distance }) => (
                  <li key={spot.id}>
                    <button type="button" onClick={() => onPick(spot)}>
                      <SpotIcon spot={spot} />
                      <span className="nearby-name">
                        <strong>{spot.name}</strong>
                        <small>{spot.neighbourhood}</small>
                      </span>
                      <Distance distance={distance} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )
        )}
      </div>
    </div>
  )
}
