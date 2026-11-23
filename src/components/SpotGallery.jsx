// "Your spots" in Collection: your latest spot as a big card (photo, place and
// what you wrote), then "See all spots", which opens the big view where you
// swipe (or use the arrows) through all of them, like a phone's photo gallery.
import { useEffect, useState } from 'react'
import { categoryById } from '../data/categories.js'
import { getPhotoUrls } from '../lib/api.js'
import { emojiFor } from '../lib/markers.js'
import { formatShortDate } from '../lib/progress.js'
import PhotoViewer from './PhotoViewer.jsx'

// A photo, or (no photo) a tile in the category's colour with its emoji.
export function SpotPicture({ entry, url }) {
  if (url) return <img src={url} alt={`Your photo of ${entry.spot.name}`} loading="lazy" />
  return (
    <span className="spot-art" style={{ background: categoryById(entry.spot.category)?.color }} aria-hidden="true">
      {emojiFor(entry.spot)}
    </span>
  )
}

// entries: from recentlyCollected(checkOffs, spots, Infinity), newest first
export default function SpotGallery({ entries }) {
  const [urls, setUrls] = useState([])
  const [open, setOpen] = useState(null) // index of the spot shown big, null = closed

  useEffect(() => {
    let alive = true
    getPhotoUrls(entries.map((e) => e.checkOff))
      .then((list) => alive && setUrls(list))
      .catch(() => {}) // no links: the tiles show the category colour instead
    return () => {
      alive = false
    }
  }, [entries])

  const latest = entries[0]
  return (
    <>
      <button type="button" className="latest-spot" onClick={() => setOpen(0)} aria-label={`${latest.spot.name}, open big`}>
        <span className="latest-picture">
          <SpotPicture entry={latest} url={urls[0]} />
        </span>
        <span className="latest-text">
          <strong>{latest.spot.name}</strong>
          <span className="muted">
            {latest.spot.neighbourhood} · {formatShortDate(latest.date)}
          </span>
          {latest.verified && <span className="verified-note">⭐ You were really there</span>}
          {latest.rating != null && (
            <span className="entry-rating" aria-label={`You rated it ${latest.rating} out of 5`}>
              {'★'.repeat(latest.rating)}
              <span className="muted">{'★'.repeat(5 - latest.rating)}</span>
            </span>
          )}
          {latest.note && <span className="entry-note">{latest.note}</span>}
        </span>
      </button>
      {entries.length > 1 && (
        <button type="button" className="secondary" onClick={() => setOpen(1)}>
          See all {entries.length} spots →
        </button>
      )}
      {open !== null && <PhotoViewer entries={entries} urls={urls} start={open} onClose={() => setOpen(null)} />}
    </>
  )
}
