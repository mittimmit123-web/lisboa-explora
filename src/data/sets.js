// Sets = themed groups of spots. Each set shows a completion percentage.
// A set picks its spots with a `match` rule (category and/or neighbourhood)
// or with an explicit list of `spotIds`.
export const SETS = [
  { id: 'all-miradouros', name: 'All miradouros', match: { category: 'viewpoint' } },
  { id: 'bairro-alto-bars', name: 'Bars in Bairro Alto', match: { category: 'nightlife', neighbourhood: 'Bairro Alto' } },
  { id: 'food-lisbon', name: 'Food spots', match: { category: 'food' } },
  { id: 'belem', name: 'Belém complete', match: { neighbourhood: 'Belém' } },
  { id: 'alfama', name: 'Alfama complete', match: { neighbourhood: 'Alfama' } },
]
