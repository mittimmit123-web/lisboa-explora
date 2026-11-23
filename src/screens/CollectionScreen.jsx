// Person 4: Collection — the player's own journal. No ranking here on purpose:
// competition lives on the Friends screen.
import { useState } from 'react'
import BuddyCard from '../components/BuddyCard.jsx'
import CategoryDetail from '../components/CategoryDetail.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import StorySection from '../components/StorySection.jsx'
import { CATEGORIES, categoryById } from '../data/categories.js'
import { NEIGHBOURHOODS } from '../data/neighbourhoods.js'
import { categoryCounts, categoryDetail, monthSummary, neighbourhoodCoverage, recentlyCollected } from '../lib/progress.js'

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

// Tapping a number scrolls down to the part of the page that explains it.
const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function CollectionScreen({ spots, checkOffs, collectedIds }) {
  const month = monthSummary(checkOffs)
  const [openCategory, setOpenCategory] = useState(null) // which tile is open, null = none
  const recent = recentlyCollected(checkOffs, spots)
  const categories = categoryCounts(spots, collectedIds, CATEGORIES)
  const hoods = neighbourhoodCoverage(spots, collectedIds, NEIGHBOURHOODS)

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
          <button type="button" className="stat stat-link" onClick={() => jumpTo('recently-collected')}>
            <strong>{month.count}</strong>
            <span>new this month ↓</span>
          </button>
          <button type="button" className="stat stat-link" onClick={() => jumpTo('neighbourhoods')}>
            <strong>
              {hoods.visited}
              <small>/{hoods.total}</small>
            </strong>
            <span>neighbourhoods ↓</span>
          </button>
        </div>

        <div className="card recap">
          <span className="section-label">This month</span>
          <p>
            <MonthText {...month} />
          </p>
        </div>

        <h2 className="section-label" id="recently-collected">
          Recently collected
        </h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing collected yet. Open the map and find your first spot!</p>
        ) : (
          <ul className="recent">
            {recent.map(({ spot, date, verified, note, rating }) => (
              <li key={spot.id} className={verified ? 'verified' : undefined}>
                <span className="dot" style={{ background: categoryById(spot.category)?.color }} />
                <span className="name">
                  {spot.name}
                  {verified && <span className="verified-note">⭐ You were really there</span>}
                  {rating != null && (
                    <span className="entry-rating" aria-label={`You rated it ${rating} out of 5`}>
                      {'★'.repeat(rating)}
                      <span className="muted">{'★'.repeat(5 - rating)}</span>
                    </span>
                  )}
                  {note && <span className="entry-note">{note}</span>}
                </span>
                <span className="muted">{formatDate(date)}</span>
              </li>
            ))}
          </ul>
        )}

        <StorySection spots={spots} checkOffs={checkOffs} />

        <h2 className="section-label">By category</h2>
        {/* Tapping a tile opens the detail below the whole grid rather than
            inside it: on a phone the grid is two columns, and growing one
            cell would push its neighbour around. */}
        <ul className="category-counts">
          {categories.map((c) => (
            <li key={c.id} className={c.count === 0 ? 'empty' : undefined}>
              <button
                type="button"
                aria-expanded={openCategory === c.id}
                onClick={() => setOpenCategory(openCategory === c.id ? null : c.id)}
              >
                <span className="dot" style={{ background: c.color }} />
                <span className="name">{c.label}</span>
                <strong>{c.count}</strong>
              </button>
            </li>
          ))}
        </ul>
        {openCategory && (
          <CategoryDetail
            category={CATEGORIES.find((c) => c.id === openCategory)}
            detail={categoryDetail(spots, checkOffs, collectedIds, openCategory, NEIGHBOURHOODS)}
            onClose={() => setOpenCategory(null)}
          />
        )}

        <h2 className="section-label" id="neighbourhoods">
          Neighbourhoods
        </h2>
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
