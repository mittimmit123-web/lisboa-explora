// The categories a spot can belong to.
// `color` is used for pins on the map and for progress bars.
export const CATEGORIES = [
  { id: 'viewpoint', label: 'Viewpoints', color: '#1E4D8C' },
  { id: 'monument', label: 'Monuments', color: '#0F766E' },
  { id: 'church', label: 'Churches', color: '#92400E' },
  { id: 'park', label: 'Parks', color: '#15803D' },
  { id: 'square', label: 'Squares', color: '#64748B' },
  { id: 'nightlife', label: 'Nightlife', color: '#7C3AED' },
  { id: 'food', label: 'Food spots', color: '#C2410C' },
  { id: 'campus', label: 'Campus', color: '#14213D' },
]

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id)
}
