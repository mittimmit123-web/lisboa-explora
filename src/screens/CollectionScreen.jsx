// Person 4: Collection & sets
import BuddyCard from '../components/BuddyCard.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { SETS } from '../data/sets.js'
import { categoryById } from '../data/categories.js'
import { setProgress, neighbourhoodProgress } from '../lib/progress.js'

export default function CollectionScreen({ spots, collectedIds, newThisMonth }) {
  const hoods = neighbourhoodProgress(spots, collectedIds).filter((h) => h.total > 1)

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Your collection</h1>
      </header>

      <div className="content">
        <BuddyCard />

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
