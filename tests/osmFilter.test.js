import { describe, expect, it } from 'vitest'
import {
  categoryOf,
  exclusionReason,
  isInsidePolygon,
  joinLines,
  kindOf,
  markHighlights,
  mergeLocations,
  parishOf,
  rarityOf,
  removeChains,
  similarNames,
  removeDuplicates,
  toSpot,
} from '../src/lib/osmFilter.js'

// A small square "parish" for the tests (not a real border).
const square = [
  [38.7, -9.2],
  [38.7, -9.1],
  [38.8, -9.1],
  [38.8, -9.2],
  [38.7, -9.2],
]
const parishes = [{ name: 'Testparish', polygons: [square] }]

describe('categoryOf', () => {
  it('finds viewpoints, churches, parks and squares', () => {
    expect(categoryOf({ tourism: 'viewpoint' })).toBe('viewpoint')
    expect(categoryOf({ amenity: 'place_of_worship', building: 'church' })).toBe('church')
    expect(categoryOf({ leisure: 'garden' })).toBe('park')
    expect(categoryOf({ place: 'square' })).toBe('square')
  })

  it('puts museums and attractions under monuments', () => {
    expect(categoryOf({ tourism: 'museum' })).toBe('monument')
    expect(categoryOf({ historic: 'castle' })).toBe('monument')
  })

  it('prefers food over attraction (Pastéis de Belém)', () => {
    expect(categoryOf({ shop: 'pastry', tourism: 'attraction' })).toBe('food')
  })

  it('puts kiosks tagged as cafe under food, bars under nightlife', () => {
    expect(categoryOf({ amenity: 'cafe', name: 'Quiosque do Príncipe Real' })).toBe('food')
    expect(categoryOf({ amenity: 'bar' })).toBe('nightlife')
  })

  it('rejects places that fit no category', () => {
    expect(categoryOf({ amenity: 'fast_food' })).toBeNull()
    expect(categoryOf({ amenity: 'bench' })).toBeNull()
    expect(categoryOf({})).toBeNull()
  })
})

describe('exclusionReason', () => {
  it('accepts a normal named viewpoint', () => {
    expect(exclusionReason({ name: 'Miradouro', tourism: 'viewpoint' }, 'viewpoint')).toBeNull()
  })

  it('rejects places without a name', () => {
    expect(exclusionReason({ tourism: 'viewpoint' }, 'viewpoint')).toBe('no name')
    expect(exclusionReason({ name: '  ' }, 'viewpoint')).toBe('no name')
  })

  it('rejects private and closed places', () => {
    expect(exclusionReason({ name: 'X', access: 'private' }, 'park')).toBe('private')
    expect(exclusionReason({ name: 'X', 'disused:amenity': 'bar' }, 'park')).toBe('closed')
  })

  it('rejects wall plaques but keeps statues', () => {
    expect(exclusionReason({ name: 'X', historic: 'memorial', memorial: 'plaque' }, 'monument')).toBe('plaque')
    expect(exclusionReason({ name: 'X', historic: 'memorial', memorial: 'statue' }, 'monument')).toBeNull()
  })

  it('food needs a website and must not be a chain', () => {
    expect(exclusionReason({ name: 'X', amenity: 'restaurant' }, 'food')).toBe('no website')
    expect(exclusionReason({ name: 'X', website: 'https://x.pt' }, 'food')).toBeNull()
    expect(exclusionReason({ name: 'X', 'contact:website': 'https://x.pt' }, 'food')).toBeNull()
    expect(exclusionReason({ name: 'Starbucks', brand: 'Starbucks', website: 'https://s.com' }, 'food')).toBe('chain')
  })

  it('skips trees, zoo animals and attractions without any details', () => {
    const tree = { name: 'Tipuana', tourism: 'attraction', natural: 'tree' }
    expect(exclusionReason(tree, 'monument')).toBe('nature')
    expect(exclusionReason({ name: 'Leões', tourism: 'attraction', attraction: 'animal' }, 'monument')).toBe('zoo animal')
    expect(exclusionReason({ name: 'Girafas', tourism: 'attraction' }, 'monument')).toBe('no details')
  })

  it('keeps attractions that have details', () => {
    const lift = { name: 'Elevador de Santa Justa', tourism: 'attraction', historic: 'yes', wikidata: 'Q1' }
    expect(exclusionReason(lift, 'monument')).toBeNull()
  })

  it('keeps markets without a website', () => {
    expect(exclusionReason({ name: 'Mercado', amenity: 'marketplace' }, 'food')).toBeNull()
  })

  it('nightlife needs a website', () => {
    expect(exclusionReason({ name: 'Bar', amenity: 'bar' }, 'nightlife')).toBe('no website')
    expect(exclusionReason({ name: 'Bar', amenity: 'bar', website: 'https://b.pt' }, 'nightlife')).toBeNull()
  })
})

describe('rarityOf', () => {
  it('food and nightlife are always common', () => {
    expect(rarityOf('food', 1)).toBe('common')
    expect(rarityOf('nightlife', 1)).toBe('common')
  })

  it('rarely edited places are rare, often edited ones common', () => {
    expect(rarityOf('park', 4)).toBe('rare') // edge case: exactly the limit
    expect(rarityOf('park', 5)).toBe('common')
  })
})

describe('kindOf', () => {
  it('tells cafés, markets and restaurants apart', () => {
    expect(kindOf({ amenity: 'cafe' })).toBe('cafe')
    expect(kindOf({ shop: 'pastry' })).toBe('cafe')
    expect(kindOf({ amenity: 'marketplace' })).toBe('market')
    expect(kindOf({ amenity: 'restaurant' })).toBe('restaurant')
    expect(kindOf({ amenity: 'food_court' })).toBe('restaurant')
  })
})

describe('removeDuplicates', () => {
  const item = (id, name, lat, edits) => ({ spot: { id, name, lat, lng: -9.15 }, edits })
  // 0.001° latitude ≈ 111 m

  it('removes a place mapped twice close together, keeping the better mapped one', () => {
    const items = [item('a', 'Oceanário de Lisboa', 38.76, 3), item('b', 'Oceanário de Lisboa', 38.762, 20)]
    expect(removeDuplicates(items).map((i) => i.spot.id)).toEqual(['b'])
  })

  it('ignores case, accents and extra spaces in names', () => {
    const items = [item('a', 'Oceanário de Lisboa', 38.76, 5), item('b', 'oceanario de  lisboa', 38.76, 1)]
    expect(removeDuplicates(items)).toHaveLength(1)
  })

  it('keeps places with the same name that are far apart (e.g. two branches)', () => {
    const items = [item('a', 'Café Central', 38.7, 1), item('b', 'Café Central', 38.72, 1)] // ~2 km
    expect(removeDuplicates(items)).toHaveLength(2)
  })

  it('keeps different places that are close together', () => {
    const items = [item('a', 'Bar A', 38.7, 1), item('b', 'Bar B', 38.7, 1)]
    expect(removeDuplicates(items)).toHaveLength(2)
  })
})

describe('similarNames', () => {
  it('matches names that refer to the same thing', () => {
    expect(similarNames('Torre de Belém', 'Miradouro da Torre de Belém')).toBe(true)
    expect(similarNames('Marquês de Pombal', 'Praça Marquês de Pombal')).toBe(true)
  })

  it('does not match different places', () => {
    expect(similarNames('Igreja da Graça', 'Igreja de São Roque')).toBe(false)
    expect(similarNames('Jardim', 'Jardim')).toBe(false) // only generic words
  })
})

describe('mergeLocations', () => {
  // 0.0001° latitude ≈ 11 m
  const item = (id, name, category, lat, edits = 1) => ({ spot: { id, name, category, lat, lng: -9.15 }, edits })
  const ids = (items) => items.map((i) => i.spot.id).sort()

  it('keeps the spot from the smallest category (viewpoint beats monument)', () => {
    const items = [
      item('tower', 'Torre de Belém', 'monument', 38.6916, 50),
      item('view', 'Miradouro da Torre de Belém', 'viewpoint', 38.6917),
      item('m2', 'Other monument far away', 'monument', 38.75),
    ]
    expect(ids(mergeLocations(items))).toEqual(['m2', 'view'])
  })

  it('merges a statue into the square with the same name', () => {
    const items = [
      item('statue', 'Marquês de Pombal', 'monument', 38.7253),
      item('square', 'Praça Marquês de Pombal', 'square', 38.72532),
      item('m2', 'Other monument far away', 'monument', 38.75), // makes "square" the smaller category
    ]
    expect(ids(mergeLocations(items))).toEqual(['m2', 'square'])
  })

  it('keeps different places next to each other (different names)', () => {
    const items = [item('a', 'Tasca A', 'food', 38.71), item('b', 'Bar B', 'nightlife', 38.71), item('c', 'Panteão Nacional', 'church', 38.71)]
    expect(mergeLocations(items)).toHaveLength(3)
  })

  it('keeps places with similar names that are more than 15 m apart', () => {
    const items = [item('church', 'Igreja de São Paulo', 'church', 38.707), item('square', 'Largo de São Paulo', 'square', 38.7075)] // ~55 m
    expect(mergeLocations(items)).toHaveLength(2)
  })

  it('merges at exactly 15 m or less (edge case)', () => {
    const items = [item('a', 'Chafariz de São Paulo', 'monument', 38.707), item('b', 'Largo de São Paulo', 'square', 38.70713)] // ~14 m
    expect(mergeLocations(items)).toHaveLength(1)
  })

  it('always keeps hand-checked places', () => {
    const items = [
      item('castle', 'Castelo de São Jorge', 'monument', 38.7136),
      item('view', 'Miradouro do Castelo de São Jorge', 'viewpoint', 38.71362),
    ]
    expect(ids(mergeLocations(items, ['Castelo de São Jorge']))).toEqual(['castle'])
  })
})

describe('removeChains', () => {
  const item = (id, name, category) => ({ spot: { id, name, category }, edits: 1 })

  it('removes all branches of a food or nightlife name that appears more than once', () => {
    const items = [item('a', 'Gleba', 'food'), item('b', 'gleba', 'food'), item('c', 'Tasca do Zé', 'food')]
    expect(removeChains(items).map((i) => i.spot.id)).toEqual(['c'])
  })

  it('keeps churches or monuments that share a name (they are different places)', () => {
    const items = [item('a', 'Igreja de São José', 'church'), item('b', 'Igreja de São José', 'church')]
    expect(removeChains(items)).toHaveLength(2)
  })
})

describe('markHighlights', () => {
  const item = (id, edits, neighbourhood, category = 'park') => ({ spot: { id, category, neighbourhood }, edits })
  const highlighted = (items) => items.filter((i) => i.spot.highlight).map((i) => i.spot.id).sort()

  it('picks the most edited places as famous ones', () => {
    const items = [item('a', 30, 'X'), item('b', 20, 'X'), item('c', 10, 'X')]
    markHighlights(items, 2, 0)
    expect(highlighted(items)).toEqual(['a', 'b'])
  })

  it('adds hidden gems: lesser known, at most one per neighbourhood', () => {
    const items = [item('famous', 30, 'X'), item('g1', 3, 'A'), item('g2', 2, 'A'), item('g3', 1, 'B'), item('known', 9, 'C')]
    markHighlights(items, 1, 5)
    // g2 is skipped (A already has a gem), "known" is too well known to be a gem
    expect(highlighted(items)).toEqual(['famous', 'g1', 'g3'])
  })

  it('works per category', () => {
    const items = [item('p', 5, 'X', 'park'), item('f', 5, 'X', 'food')]
    markHighlights(items, 1, 0)
    expect(highlighted(items)).toEqual(['f', 'p'])
  })
})

describe('parishes', () => {
  it('knows if a point is inside or outside', () => {
    expect(isInsidePolygon({ lat: 38.75, lng: -9.15 }, square)).toBe(true)
    expect(isInsidePolygon({ lat: 38.9, lng: -9.15 }, square)).toBe(false)
  })

  it('returns the parish name, or null outside every parish', () => {
    expect(parishOf({ lat: 38.75, lng: -9.15 }, parishes)).toBe('Testparish')
    expect(parishOf({ lat: 38.678, lng: -9.326 }, parishes)).toBeNull() // Nova campus: outside Lisbon
  })

  it('joins border pieces into one closed polygon, even if one piece is reversed', () => {
    const pieces = [
      [[0, 0], [0, 1]],
      [[1, 1], [0, 1]], // reversed piece
      [[1, 1], [1, 0], [0, 0]],
    ]
    const [polygon] = joinLines(pieces)
    expect(polygon[0]).toEqual(polygon[polygon.length - 1])
    expect(polygon).toHaveLength(5)
  })
})

describe('toSpot', () => {
  const viewpoint = {
    type: 'node',
    id: 42,
    lat: 38.711812345,
    lon: -9.130112345,
    version: 12,
    tags: { name: 'Miradouro de Santa Luzia', tourism: 'viewpoint' },
  }

  it('turns an OSM place into a spot', () => {
    expect(toSpot(viewpoint, parishes)).toEqual({
      edits: 12,
      spot: {
        id: 'osm-n42',
        name: 'Miradouro de Santa Luzia',
        category: 'viewpoint',
        neighbourhood: 'Testparish',
        lat: 38.71181,
        lng: -9.13011,
        rarity: 'common',
      },
    })
  })

  it('uses the center of areas such as parks', () => {
    const park = { type: 'way', id: 7, version: 2, center: { lat: 38.75, lon: -9.15 }, tags: { name: 'Jardim', leisure: 'park' } }
    expect(toSpot(park, parishes).spot).toMatchObject({ id: 'osm-w7', lat: 38.75, rarity: 'rare' })
  })

  it('skips places outside Lisbon and places without coordinates', () => {
    expect(toSpot({ ...viewpoint, lat: 39.5 }, parishes)).toEqual({ skipped: 'outside Lisbon' })
    expect(toSpot({ ...viewpoint, lat: undefined, lon: undefined }, parishes)).toEqual({ skipped: 'no coordinates' })
  })

  it('gives food spots a kind, other spots none', () => {
    const cafe = { ...viewpoint, tags: { name: 'Café', amenity: 'cafe', website: 'https://c.pt' } }
    expect(toSpot(cafe, parishes).spot.kind).toBe('cafe')
    expect(toSpot(viewpoint, parishes).spot.kind).toBeUndefined()
  })

  it('skips excluded places with the reason', () => {
    expect(toSpot({ ...viewpoint, tags: { tourism: 'viewpoint' } }, parishes)).toEqual({ skipped: 'no name' })
  })
})
