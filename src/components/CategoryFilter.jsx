import { CATEGORIES } from '../data/categories.js'

// Row of chips: "All" plus one per category. `value` is a category id or 'all'.
export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="chips" role="group" aria-label="Filter by category">
      <button className={value === 'all' ? 'chip selected' : 'chip'} onClick={() => onChange('all')}>
        All
      </button>
      {CATEGORIES.filter((c) => c.id !== 'campus').map((c) => (
        <button key={c.id} className={value === c.id ? 'chip selected' : 'chip'} onClick={() => onChange(c.id)}>
          <span className="dot" style={{ background: c.color }} />
          {c.label}
        </button>
      ))}
    </div>
  )
}
