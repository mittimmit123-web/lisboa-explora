import { describe, expect, it } from 'vitest'
import { inStarRange, nearbySpots, simplify } from '../src/lib/nearby.js'

// Three spots in a row going north from the player (about 111 m per 0.001°)
const me = { lat: 38.71, lng: -9.13 }
const spots = [
  { id: 'far', name: 'Miradouro Far', lat: 38.713, lng: -9.13 },
  { id: 'near', name: 'Castelo de São Jorge', lat: 38.711, lng: -9.13 },
  { id: 'mid', name: 'Café Central', lat: 38.712, lng: -9.13 },
]
const names = (list) => list.map((x) => x.spot.id)

describe('nearbySpots', () => {
  it('lists the closest spots first, with their distance', () => {
    const list = nearbySpots(spots, new Set(), me)
    expect(names(list)).toEqual(['near', 'mid', 'far'])
    expect(list[0].distance).toBeGreaterThan(100)
    expect(list[0].distance).toBeLessThan(120)
  })

  it('leaves out spots that are already collected', () => {
    expect(names(nearbySpots(spots, new Set(['near']), me))).toEqual(['mid', 'far'])
  })

  it('shows only as many spots as the limit', () => {
    expect(nearbySpots(spots, new Set(), me, { limit: 2 })).toHaveLength(2)
  })

  it('finds spots by name, ignoring accents and capitals', () => {
    expect(names(nearbySpots(spots, new Set(), me, { query: 'sao JORGE' }))).toEqual(['near'])
    expect(names(nearbySpots(spots, new Set(), me, { query: 'cafe' }))).toEqual(['mid'])
    expect(nearbySpots(spots, new Set(), me, { query: 'pizza' })).toEqual([])
  })

  it('without GPS, sorts by name and has no distance', () => {
    const list = nearbySpots(spots, new Set(), null)
    expect(names(list)).toEqual(['mid', 'near', 'far'])
    expect(list[0].distance).toBeNull()
  })
})

describe('simplify', () => {
  it('removes accents and capitals', () => {
    expect(simplify('São Jorge')).toBe('sao jorge')
    expect(simplify('Açúcar')).toBe('acucar')
  })
})

describe('inStarRange (⭐ hint on Add spot)', () => {
  it('is true within 50 m, false further away or without GPS', () => {
    expect(inStarRange(15)).toBe(true)
    expect(inStarRange(50)).toBe(true)
    expect(inStarRange(51)).toBe(false)
    expect(inStarRange(null)).toBe(false)
  })
})
