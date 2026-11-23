// "Your spots" in Collection: your latest spot as a big card (photo, place and
// what you wrote). "See all spots" opens a full-screen list of the same cards,
// newest first, that you scroll through like a feed.
import { useEffect, useState } from 'react'
import { categoryById } from '../data/categories.js'
import { getPhotoUrls } from '../lib/api.js'
import { emojiFor } from '../lib/markers.js'
import { formatShortDate } from '../lib/progress.js'

// A photo, or (no photo) a tile in the category's colour with its emoji.
function SpotPicture({ entry, url }) {
  if (url) return <img src={url} alt={`Your photo of ${entry.spot.name}`} loading="lazy" />
  return (
    <span className="spot-art" style={{ background: categoryById(entry.spot.category)?.color }} aria-hidden="true">
      {emojiFor(entry.spot)}
    </span>
  )
}

// One spot: photo, place, date, ⭐, stars and the note.
function SpotCard({ entry, url }) {
  return (
    <>
      <span className="latest-picture">
        <SpotPicture entry={entry} url={url} />
      </span>
      <span className="latest-text">
        <strong>{entry.spot.name}</strong>
        <span className="muted">
          {entry.spot.neighbourhood} · {formatShortDate(entry.date)}
        </span>
        {entry.verified && <span className="verified-note">⭐ You were really there</span>}
        {entry.rating != null && (
          <span className="entry-rating" aria-label={`You rated it ${entry.rating} out of 5`}>
            {'★'.repeat(entry.rating)}
            <span className="muted">{'★'.repeat(5 - entry.rating)}</span>
          </span>
        )}
        {entry.note && <span className="entry-note">{entry.note}</span>}
      </span>
    </>
  )
}

// The full-screen list behind "See all spots".
function AllSpots({ entries, urls, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="all-spots" role="dialog" aria-modal="true" aria-labelledby="all-spots-title">
      <header className="all-spots-head">
        <button type="button" className="icon-btn" aria-label="Back" onClick={onClose}>
          ‹
        </button>
        <h2 id="all-spots-title">Your spots · {entries.length}</h2>
      </header>
      <ul className="all-spots-list">
        {entries.map((entry, i) => (
          <li key={entry.spot.id} className="latest-spot">
            <SpotCard entry={entry} url={urls[i]} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// entries: from recentlyCollected(checkOffs, spots, Infinity), newest first
export default function SpotGallery({ entries }) {
  const [urls, setUrls] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    getPhotoUrls(entries.map((e) => e.checkOff))
      .then((list) => alive && setUrls(list))
      .catch(() => {}) // no links: the cards show the category colour instead
    return () => {
      alive = false
    }
  }, [entries])

  return (
    <>
      <div className="latest-spot compact">
        <SpotCard entry={entries[0]} url={urls[0]} />
      </div>
      {entries.length > 1 && (
        <button type="button" className="secondary" onClick={() => setOpen(true)}>
          See all {entries.length} spots →
        </button>
      )}
      {open && <AllSpots entries={entries} urls={urls} onClose={() => setOpen(false)} />}
    </>
  )
}
