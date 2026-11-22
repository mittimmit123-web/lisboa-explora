import { describe, expect, it } from 'vitest'
import { NEIGHBOURHOODS } from '../src/data/neighbourhoods.js'
import { LOCKED_OPACITY, NEIGHBOURHOOD_COLORS, UNLOCKED_OPACITY } from '../src/data/neighbourhoodColors.js'
import { PARISHES } from '../src/data/parishes.js'
import { unlockedNeighbourhoods } from '../src/lib/markers.js'

const sorted = (list) => [...list].sort()

describe('unlockedNeighbourhoods', () => {
  const spots = [
    { id: 'a', neighbourhood: 'Belém' },
    { id: 'b', neighbourhood: 'Belém' },
    { id: 'c', neighbourhood: 'Estrela' },
    { id: 'd', neighbourhood: 'Ajuda' },
    { id: 'campus', neighbourhood: 'Carcavelos' },
  ]

  it('lists each neighbourhood with a collected spot once, sorted', () => {
    expect(unlockedNeighbourhoods(spots, new Set(['c', 'a', 'b']))).toEqual(['Belém', 'Estrela'])
  })

  it('is empty when nothing is collected', () => {
    expect(unlockedNeighbourhoods(spots, new Set())).toEqual([])
  })
})

describe('neighbourhood colours', () => {
  it('has a colour for exactly our 24 neighbourhoods', () => {
    expect(sorted(Object.keys(NEIGHBOURHOOD_COLORS))).toEqual(sorted(NEIGHBOURHOODS))
  })

  it('uses 24 different, valid colours', () => {
    const colours = Object.values(NEIGHBOURHOOD_COLORS)
    for (const c of colours) expect(c).toMatch(/^#[0-9A-F]{6}$/)
    expect(new Set(colours).size).toBe(24)
  })

  it('is never solid, and unlocked is stronger than locked', () => {
    expect(UNLOCKED_OPACITY).toBeLessThan(1)
    expect(LOCKED_OPACITY).toBeLessThan(UNLOCKED_OPACITY)
  })
})

describe('parish borders', () => {
  it('has a border for exactly our 24 neighbourhoods (same spelling)', () => {
    expect(sorted(PARISHES.map((p) => p.name))).toEqual(sorted(NEIGHBOURHOODS))
  })

  it('every border is a closed shape', () => {
    for (const parish of PARISHES) {
      expect(parish.polygons.length).toBeGreaterThan(0)
      for (const ring of parish.polygons) {
        expect(ring.length).toBeGreaterThan(3)
        expect(ring[0]).toEqual(ring[ring.length - 1])
      }
    }
  })

  it('neighbourhoods that touch never get similar colours', () => {
    // Two neighbourhoods touch when their borders share a point.
    const points = PARISHES.map((p) => new Set(p.polygons.flat().map((pt) => pt.join(','))))
    const touch = (a, b) => [...points[a]].some((pt) => points[b].has(pt))
    const hue = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      const max = Math.max(r, g, b)
      const d = max - Math.min(r, g, b)
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
      return (h * 60 + 360) % 360
    }
    let pairs = 0
    for (let a = 0; a < PARISHES.length; a++) {
      for (let b = a + 1; b < PARISHES.length; b++) {
        if (!touch(a, b)) continue
        pairs++
        const diff = Math.abs(hue(NEIGHBOURHOOD_COLORS[PARISHES[a].name]) - hue(NEIGHBOURHOOD_COLORS[PARISHES[b].name]))
        expect(Math.min(diff, 360 - diff), `${PARISHES[a].name} / ${PARISHES[b].name}`).toBeGreaterThanOrEqual(70)
      }
    }
    expect(pairs).toBeGreaterThan(40) // the borders really do touch
  })
})
