// Person 4: Collection & sets
import { useEffect, useState } from 'react'
import ProgressBar from '../components/ProgressBar.jsx'
import { SETS } from '../data/sets.js'
import { categoryById } from '../data/categories.js'
import { getFriendsLeaderboard } from '../lib/api.js'
import { monthlyRecap, neighbourhoodProgress, recentlyCollected, setProgress } from '../lib/progress.js'

// "17 Nov"
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CollectionScreen({ spots, checkOffs, collectedIds, newThisMonth }) {
  const hoods = neighbourhoodProgress(spots, collectedIds).filter((h) => h.total > 1)
  const recent = recentlyCollected(checkOffs, spots)
  const [players, setPlayers] = useState(null) // null = still loading

  useEffect(() => {
    getFriendsLeaderboard(newThisMonth)
      .then(setPlayers)
      .catch(() => setPlayers([])) // recap still works without friends
  }, [newThisMonth])

  const recap = players ? monthlyRecap(players) : null

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Your collection</h1>
      </header>

      <div className="content">
        <div className="stats">
          <div className="stat dark">
            <strong>{collectedIds.size}</strong>
            <span>spots total</span>
          </div>
          <div className="stat">
            <strong>{newThisMonth}</strong>
            <span>new this month</span>
          </div>
          <div className="stat">
            <strong>{spots.length - collectedIds.size}</strong>
            <span>left to find</span>
          </div>
        </div>

        <div className="card recap">
          <span className="section-label">This month</span>
          <p>
            You discovered <strong>{newThisMonth}</strong> new {newThisMonth === 1 ? 'place' : 'places'}.
            {recap?.rank && recap.playerCount > 1 && (
              <>
                {' '}You are <strong>#{recap.rank}</strong> of {recap.playerCount} friends.
              </>
            )}
          </p>
        </div>

        <h2 className="section-label">Recently collected</h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing collected yet. Open the map and find your first spot!</p>
        ) : (
          <ul className="recent">
            {recent.map(({ spot, date }) => (
              <li key={spot.id}>
                <span className="dot" style={{ background: categoryById(spot.category)?.color }} />
                <span className="name">{spot.name}</span>
                <span className="muted">{formatDate(date)}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-label">Sets</h2>
        {SETS.map((set) => {
          const p = setProgress(set, spots, collectedIds)
          const color = categoryById(set.match?.category)?.color
          return (
            <div key={set.id} className="card">
              <div className="row between">
                <strong>{set.name}</strong>
                <span className="muted">
                  {p.done} / {p.total} · {p.percent}%
                </span>
              </div>
              <ProgressBar percent={p.percent} color={color} label={set.name} />
            </div>
          )
        })}

        <h2 className="section-label">Neighbourhoods</h2>
        <div className="grid-3">
          {hoods.map((h) => (
            <div key={h.name} className="stat">
              <strong>{h.percent}%</strong>
              <span>{h.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
