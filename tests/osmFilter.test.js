import { describe, expect, it } from 'vitest'
import {
  categoryOf,
  exclusionReason,
  isInsidePolygon,
  joinLines,
  parishOf,
  rarityOf,
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

  it('skips excluded places with the reason', () => {
    expect(toSpot({ ...viewpoint, tags: { tourism: 'viewpoint' } }, parishes)).toEqual({ skipped: 'no name' })
  })
})
