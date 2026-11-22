// Person 4: another way to add a spot without searching the map.
// Shows the closest spots you haven't collected yet; tap one to check it off.
import { useState } from 'react'
import { formatDistance } from '../lib/geo.js'
import { emojiFor } from '../lib/markers.js'
import { nearbySpots } from '../lib/nearby.js'

export default function AddSpotScreen({ spots, collectedIds, position, onPick }) {
  const [query, setQuery] = useState('')
  const list = nearbySpots(spots, collectedIds, position, { query })

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Add a spot</h1>
        <p className="muted">Which spot are you at? The closest ones you haven’t collected yet:</p>
      </header>
      <div className="content">
        <input
          type="text"
          aria-label="Search a spot by name"
          placeholder="Search a spot by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!position && <p className="status">Turn on your location to see the spots closest to you. You can still search by name.</p>}
        {list.length === 0 ? (
          <p className="muted">No spot found. Try another name.</p>
        ) : (
          <ul className="nearby-list">
            {list.map(({ spot, distance }) => (
              <li key={spot.id}>
                <button type="button" onClick={() => onPick(spot)}>
                  <span className="nearby-emoji" aria-hidden="true">
                    {emojiFor(spot)}
                  </span>
                  <span className="nearby-name">
                    <strong>{spot.name}</strong>
                    <small>{spot.neighbourhood}</small>
                  </span>
                  {distance !== null && <span className="nearby-distance">{formatDistance(distance)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
