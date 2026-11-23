// "Your spots" in Collection: every spot you collected, newest first, as a
// photo grid. Tap one to see it big; in the big view you swipe (or use the
// arrows) through all of them, like a phone's photo gallery.
import { useEffect, useState } from 'react'
import { categoryById } from '../data/categories.js'
import { getPhotoUrls } from '../lib/api.js'
import { emojiFor } from '../lib/markers.js'
import PhotoViewer from './PhotoViewer.jsx'

const FIRST = 6 // two rows, then "Show all"

// A photo, or (no photo) a tile in the category's colour with its emoji.
export function SpotPicture({ entry, url }) {
  if (url) return <img src={url} alt={`Your photo of ${entry.spot.name}`} loading="lazy" />
  return (
    <span className="spot-art" style={{ background: categoryById(entry.spot.category)?.color }} aria-hidden="true">
      {emojiFor(entry.spot)}
    </span>
  )
}

// entries: from recentlyCollected(checkOffs, spots, Infinity)
export default function SpotGallery({ entries }) {
  const [urls, setUrls] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState(null) // index of the spot shown big, null = grid only

  useEffect(() => {
    let alive = true
    getPhotoUrls(entries.map((e) => e.checkOff))
      .then((list) => alive && setUrls(list))
      .catch(() => {}) // no links: the tiles show the category colour instead
    return () => {
      alive = false
    }
  }, [entries])

  const shown = showAll ? entries : entries.slice(0, FIRST)
  return (
    <>
      <ul className="spot-grid">
        {shown.map((entry, i) => (
          <li key={entry.spot.id}>
            <button type="button" className="spot-tile" onClick={() => setOpen(i)} aria-label={`${entry.spot.name}, open big`}>
              <SpotPicture entry={entry} url={urls[i]} />
              {entry.verified && (
                <span className="spot-tile-star" aria-hidden="true">
                  ⭐
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {entries.length > FIRST && (
        <button type="button" className="secondary" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer' : `Show all ${entries.length}`}
        </button>
      )}
      {open !== null && <PhotoViewer entries={entries} urls={urls} start={open} onClose={() => setOpen(null)} />}
    </>
  )
}
