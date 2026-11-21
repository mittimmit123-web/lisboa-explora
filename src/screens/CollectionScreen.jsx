// Person 4: Collection — the player's own journal. No ranking here on purpose:
// competition lives on the Friends screen.
import ProgressBar from '../components/ProgressBar.jsx'
import { CATEGORIES, categoryById } from '../data/categories.js'
import { NEIGHBOURHOODS } from '../data/neighbourhoods.js'
import { categoryCounts, monthSummary, neighbourhoodCoverage, recentlyCollected } from '../lib/progress.js'

// "17 Nov"
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// The sentence in the "This month" card.
function MonthText({ count, verified }) {
  if (count === 0) return <>No new places yet this month. Your first spot is waiting on the map.</>
  const places = count === 1 ? 'place' : 'places'
  if (verified === 0) return <>You discovered <strong>{count}</strong> new {places} this month.</>
  if (verified === count) {
    return <>You discovered <strong>{count}</strong> new {places} this month, {count === 1 ? 'on site' : 'all of them on site'} ⭐</>
  }
  return <>You discovered <strong>{count}</strong> new {places} this month, <strong>{verified}</strong> of them on site ⭐</>
}

export default function CollectionScreen({ spots, checkOffs, collectedIds }) {
  const month = monthSummary(checkOffs)
  const recent = recentlyCollected(checkOffs, spots)
  const categories = categoryCounts(spots, collectedIds, CATEGORIES)
  const hoods = neighbourhoodCoverage(spots, collectedIds, NEIGHBOURHOODS)

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
            <strong>{month.count}</strong>
            <span>new this month</span>
          </div>
          <div className="stat">
            <strong>
              {hoods.visited}
              <small>/{hoods.total}</small>
            </strong>
            <span>neighbourhoods</span>
          </div>
        </div>

        <div className="card recap">
          <span className="section-label">This month</span>
          <p>
            <MonthText {...month} />
          </p>
        </div>

        <h2 className="section-label">Recently collected</h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing collected yet. Open the map and find your first spot!</p>
        ) : (
          <ul className="recent">
            {recent.map(({ spot, date, verified }) => (
              <li key={spot.id} className={verified ? 'verified' : undefined}>
                <span className="dot" style={{ background: categoryById(spot.category)?.color }} />
                <span className="name">
                  {spot.name}
                  {verified && <span className="verified-note">⭐ You were really there</span>}
                </span>
                <span className="muted">{formatDate(date)}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-label">By category</h2>
        <ul className="category-counts">
          {categories.map((c) => (
            <li key={c.id} className={c.count === 0 ? 'empty' : undefined}>
              <span className="dot" style={{ background: c.color }} />
              <span className="name">{c.label}</span>
              <strong>{c.count}</strong>
            </li>
          ))}
        </ul>

        <h2 className="section-label">Neighbourhoods</h2>
        <div className="card">
          <p className="coverage">
            You&apos;ve been to <strong>{hoods.visited}</strong> of {hoods.total} neighbourhoods
          </p>
          <ProgressBar
            percent={Math.round((hoods.visited / hoods.total) * 100)}
            label={`${hoods.visited} of ${hoods.total} neighbourhoods visited`}
          />
          <ul className="hood-chips">
            {hoods.list.map((h) => (
              <li key={h.name} className={h.count > 0 ? 'visited' : undefined}>
                {h.name}
                {h.count > 0 && <span className="hood-count">{h.count}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
