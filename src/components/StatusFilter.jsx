// Second row of chips under the categories: all spots, only the ones already
// in the journal, or only the ones still missing. Independent of the category
// filter, so "Viewpoints" + "Not yet" answers "where do I still have to go?".
const OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'collected', label: 'Collected' },
  { id: 'missing', label: 'Not yet' },
]

export default function StatusFilter({ value, onChange }) {
  return (
    <div className="chips chips-status" role="group" aria-label="Filter by what you have collected">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? 'chip selected' : 'chip'}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
