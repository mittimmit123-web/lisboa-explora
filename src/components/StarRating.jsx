// One to five stars, or none at all. A rating is optional, so tapping the
// star that is already set clears it again.
//
// Buttons rather than a slider or a canvas: they are reachable with a screen
// reader and with the keyboard, and each one is its own 44 px target.
import { MAX_RATING } from '../lib/journal.js'

const STARS = Array.from({ length: MAX_RATING }, (_, i) => i + 1)

export default function StarRating({ value, onChange }) {
  return (
    <div className="stars" role="group" aria-label="How was it? (optional)">
      {STARS.map((n) => {
        const on = value != null && n <= value
        return (
          <button
            key={n}
            type="button"
            className={on ? 'star on' : 'star'}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
          >
            {on ? '★' : '☆'}
          </button>
        )
      })}
      {value != null && (
        <button type="button" className="link-button star-clear" onClick={() => onChange(null)}>
          Clear
        </button>
      )}
    </div>
  )
}
