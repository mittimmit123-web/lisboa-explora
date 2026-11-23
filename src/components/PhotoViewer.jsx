// The big view of "Your spots": one spot per screen, swipe left or right to
// the next one. The swiping is the browser's own scroll snapping (no library);
// arrow buttons and the arrow keys do the same on a laptop.
import { useEffect, useRef, useState } from 'react'
import { formatShortDate } from '../lib/progress.js'
import { SpotPicture } from './SpotGallery.jsx'

export default function PhotoViewer({ entries, urls, start, onClose }) {
  const stripRef = useRef(null)
  const [index, setIndex] = useState(start)

  const goTo = (i, behavior = 'smooth') => {
    const strip = stripRef.current
    strip?.scrollTo({ left: i * strip.clientWidth, behavior })
  }

  // Open at the spot that was tapped.
  useEffect(() => goTo(start, 'instant'), [start])

  // Escape closes, arrow keys go back and forth.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goTo(Math.min(index + 1, entries.length - 1))
      if (e.key === 'ArrowLeft') goTo(Math.max(index - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, entries.length, onClose])

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Your spots">
      <button type="button" className="viewer-close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
      <div
        className="viewer-strip"
        ref={stripRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {entries.map((entry, i) => (
          <figure key={entry.spot.id} className="viewer-slide" aria-hidden={i !== index}>
            <div className="viewer-picture">
              <SpotPicture entry={entry} url={urls[i]} />
            </div>
            <figcaption>
              <strong>{entry.spot.name}</strong>
              <span className="viewer-meta">
                {entry.spot.neighbourhood} · {formatShortDate(entry.date)}
              </span>
              {entry.verified && <span className="viewer-verified">⭐ You were really there</span>}
              {entry.rating != null && (
                <span aria-label={`You rated it ${entry.rating} out of 5`}>
                  {'★'.repeat(entry.rating)}
                  <span className="viewer-dim">{'★'.repeat(5 - entry.rating)}</span>
                </span>
              )}
              {entry.note && <span className="viewer-note">“{entry.note}”</span>}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="viewer-nav">
        <button type="button" aria-label="Previous spot" disabled={index === 0} onClick={() => goTo(index - 1)}>
          ‹
        </button>
        <span>
          {index + 1} / {entries.length}
        </span>
        <button type="button" aria-label="Next spot" disabled={index === entries.length - 1} onClick={() => goTo(index + 1)}>
          ›
        </button>
      </div>
    </div>
  )
}
