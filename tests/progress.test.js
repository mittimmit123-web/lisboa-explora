import { describe, expect, it } from 'vitest'
import { neighbourhoodProgress, newThisMonth, rankPlayers, setProgress, spotsInSet } from '../src/lib/progress.js'

const spots = [
  { id: 'a', category: 'nightlife', neighbourhood: 'Bairro Alto' },
  { id: 'b', category: 'nightlife', neighbourhood: 'Bairro Alto' },
  { id: 'c', category: 'nightlife', neighbourhood: 'Bairro Alto' },
  { id: 'd', category: 'nightlife', neighbourhood: 'Bairro Alto' },
  { id: 'e', category: 'nightlife', neighbourhood: 'Bairro Alto' },
  { id: 'f', category: 'viewpoint', neighbourhood: 'Alfama' },
]

describe('sets', () => {
  const bars = { id: 'bars', match: { category: 'nightlife', neighbourhood: 'Bairro Alto' } }

  it('picks spots by category and neighbourhood', () => {
    expect(spotsInSet(bars, spots).map((s) => s.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('shows 20% when 1 of 5 bars in Bairro Alto is collected', () => {
    expect(setProgress(bars, spots, new Set(['a']))).toEqual({ done: 1, total: 5, percent: 20 })
  })

  it('ignores collected spots outside the set', () => {
    expect(setProgress(bars, spots, new Set(['f'])).percent).toBe(0)
  })

  it('is 0% (not an error) for an empty set', () => {
    expect(setProgress({ id: 'x', match: { category: 'food' } }, spots, new Set()).percent).toBe(0)
  })
})

describe('neighbourhoodProgress', () => {
  it('sorts neighbourhoods by percent', () => {
    const result = neighbourhoodProgress(spots, new Set(['f']))
    expect(result[0]).toMatchObject({ name: 'Alfama', percent: 100 })
    expect(result[1]).toMatchObject({ name: 'Bairro Alto', percent: 0 })
  })
})

describe('newThisMonth', () => {
  it('counts only check-offs from the current month', () => {
    const now = new Date('2026-11-17T12:00:00Z')
    const rows = [
      { created_at: '2026-11-02T10:00:00Z' },
      { created_at: '2026-11-16T10:00:00Z' },
      { created_at: '2026-10-30T10:00:00Z' },
    ]
    expect(newThisMonth(rows, now)).toBe(2)
  })
})

describe('rankPlayers', () => {
  it('ranks by count, highest first', () => {
    const ranked = rankPlayers([
      { name: 'Ana', count: 3 },
      { name: 'Marta', count: 7 },
    ])
    expect(ranked.map((p) => [p.rank, p.name])).toEqual([
      [1, 'Marta'],
      [2, 'Ana'],
    ])
  })
})
