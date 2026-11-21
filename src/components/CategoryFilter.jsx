import { CATEGORIES } from '../data/categories.js'
import { toggleCategory } from '../lib/markers.js'

// Row of chips: "All" plus one per category. Several categories can be
// selected at once. `value` is a list of category ids; an empty list = "All".
export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="chips" role="group" aria-label="Filter by category">
      <button
        className={value.length === 0 ? 'chip selected' : 'chip'}
        aria-pressed={value.length === 0}
        onClick={() => onChange([])}
      >
        All
      </button>
      {CATEGORIES.filter((c) => c.id !== 'campus').map((c) => (
        <button
          key={c.id}
          className={value.includes(c.id) ? 'chip selected' : 'chip'}
          aria-pressed={value.includes(c.id)}
          onClick={() => onChange(toggleCategory(value, c.id))}
        >
          <span className="dot" style={{ background: c.color }} />
          {c.label}
        </button>
      ))}
    </div>
  )
}
