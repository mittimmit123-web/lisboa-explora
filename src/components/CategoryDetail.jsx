// What opens under a category tile in the Collection: the spots of that
// category in the journal, how far they are spread over the city, and which
// neighbourhoods still have none.
//
// Counts, never percentages - see categoryDetail() in src/lib/progress.js
// for why.

// "17 Nov"
function formatDate(date) {
  return date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
}

export default function CategoryDetail({ category, detail, onClose }) {
  const { collected, visited, missing, totalNeighbourhoods } = detail

  return (
    <div className="category-detail card" role="region" aria-label={`${category.label} in detail`}>
      <div className="category-detail-head">
        <h3>
          <span className="dot" style={{ background: category.color }} />
          {category.label}
        </h3>
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>

      {collected.length === 0 ? (
        <p className="muted">
          Nothing here yet. {missing.length > 0 && `Try ${missing.slice(0, 3).join(', ')}.`}
        </p>
      ) : (
        <>
          <ul className="recent">
            {collected.map(({ spot, date, verified, note, rating }) => (
              <li key={spot.id} className={verified ? 'verified' : undefined}>
                <span className="dot" style={{ background: category.color }} />
                <span className="name">
                  {spot.name}
                  <span className="muted"> · {spot.neighbourhood}</span>
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

          <p className="category-spread">
            {category.label} in <strong>{visited.length}</strong> of {totalNeighbourhoods} neighbourhoods
          </p>
          <ul className="chips chips-inline">
            {visited.map((n) => (
              <li key={n.name} className="chip selected">
                {n.name} <strong>{n.count}</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {missing.length > 0 && (
        <>
          <p className="muted category-missing-label">
            Still none in {missing.length} {missing.length === 1 ? 'neighbourhood' : 'neighbourhoods'}:
          </p>
          <p className="muted category-missing">{missing.join(' · ')}</p>
        </>
      )}
    </div>
  )
}
