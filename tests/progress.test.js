import { describe, expect, it } from 'vitest'
import {
  categoryCounts,
  categoryDetail,
  monthSummary,
  neighbourhoodCounts,
  neighbourhoodCoverage,
  newThisMonth,
  rankPlayers,
  formatShortDate,
  recentlyCollected,
} from '../src/lib/progress.js'

const spots = [
  { id: 'a', category: 'nightlife', neighbourhood: 'Misericórdia' },
  { id: 'b', category: 'nightlife', neighbourhood: 'Misericórdia' },
  { id: 'c', category: 'food', neighbourhood: 'Santa Maria Maior' },
  { id: 'f', category: 'viewpoint', neighbourhood: 'Santa Maria Maior' },
  { id: 'campus', category: 'campus', neighbourhood: 'Carcavelos' },
]

const now = new Date('2026-11-17T12:00:00Z')

describe('newThisMonth', () => {
  it('counts only check-offs from the current month', () => {
    const rows = [
      { created_at: '2026-11-02T10:00:00Z' },
      { created_at: '2026-11-16T10:00:00Z' },
      { created_at: '2026-10-30T10:00:00Z' },
    ]
    expect(newThisMonth(rows, now)).toBe(2)
  })

  it('does not count the same month of another year', () => {
    expect(newThisMonth([{ created_at: '2025-11-10T10:00:00Z' }], now)).toBe(0)
  })
})

describe('monthSummary', () => {
  it('counts this month and how many were verified on site', () => {
    const rows = [
      { created_at: '2026-11-02T10:00:00Z', verified: true },
      { created_at: '2026-11-16T10:00:00Z', verified: false },
      { created_at: '2026-11-10T10:00:00Z', verified: true },
      { created_at: '2026-10-30T10:00:00Z', verified: true }, // last month
    ]
    expect(monthSummary(rows, now)).toEqual({ count: 3, verified: 2 })
  })

  it('treats a missing verified flag (old entries) as not verified', () => {
    expect(monthSummary([{ created_at: '2026-11-02T10:00:00Z' }], now)).toEqual({ count: 1, verified: 0 })
  })

  it('is zero for a new player', () => {
    expect(monthSummary([], now)).toEqual({ count: 0, verified: 0 })
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

  it('breaks a tie alphabetically', () => {
    const ranked = rankPlayers([
      { name: 'Zé', count: 2 },
      { name: 'Ana', count: 2 },
    ])
    expect(ranked.map((p) => p.name)).toEqual(['Ana', 'Zé'])
  })
})

describe('recentlyCollected', () => {
  const rows = [
    { spot_id: 'a', created_at: '2026-11-02T10:00:00Z', verified: true },
    { spot_id: 'f', created_at: '2026-11-16T10:00:00Z', verified: false },
    { spot_id: 'gone', created_at: '2026-11-17T10:00:00Z', verified: true },
    { spot_id: 'b', created_at: '2026-10-30T10:00:00Z' },
  ]

  it('returns spots newest first and skips unknown spots', () => {
    const result = recentlyCollected(rows, spots)
    expect(result.map((r) => r.spot.id)).toEqual(['f', 'a', 'b'])
    expect(result[0].date.toISOString()).toBe('2026-11-16T10:00:00.000Z')
  })

  it('passes on the verified mark', () => {
    expect(recentlyCollected(rows, spots).map((r) => r.verified)).toEqual([false, true, false])
  })

  it('respects the limit', () => {
    expect(recentlyCollected(rows, spots, 1).map((r) => r.spot.id)).toEqual(['f'])
  })

  it('is empty when nothing is collected', () => {
    expect(recentlyCollected([], spots)).toEqual([])
  })
})

describe('categoryCounts', () => {
  const categories = [
    { id: 'nightlife', label: 'Nightlife', color: '#7C3AED' },
    { id: 'food', label: 'Food spots', color: '#C2410C' },
    { id: 'park', label: 'Parks', color: '#15803D' },
  ]

  it('counts collected spots per category and keeps empty categories', () => {
    const result = categoryCounts(spots, new Set(['a', 'b', 'c']), categories)
    expect(result.map((c) => [c.id, c.count])).toEqual([
      ['nightlife', 2],
      ['food', 1],
      ['park', 0],
    ])
    expect(result[0].label).toBe('Nightlife')
  })

  it('ignores ids that are not spots', () => {
    expect(categoryCounts(spots, new Set(['nope']), categories).every((c) => c.count === 0)).toBe(true)
  })
})

describe('neighbourhoodCoverage', () => {
  const hoods = ['Misericórdia', 'Santa Maria Maior', 'Belém']

  it('counts visited neighbourhoods out of the fixed list', () => {
    const result = neighbourhoodCoverage(spots, new Set(['a', 'b', 'f']), hoods)
    expect(result.visited).toBe(2)
    expect(result.total).toBe(3)
    expect(result.list).toEqual([
      { name: 'Misericórdia', count: 2 },
      { name: 'Santa Maria Maior', count: 1 },
      { name: 'Belém', count: 0 },
    ])
  })

  it('does not count spots outside the city as a neighbourhood', () => {
    expect(neighbourhoodCoverage(spots, new Set(['campus']), hoods).visited).toBe(0)
  })

  it('is 0 of N for a new player', () => {
    const result = neighbourhoodCoverage(spots, new Set(), hoods)
    expect([result.visited, result.total]).toEqual([0, 3])
  })
})

describe('rankPlayers by another number', () => {
  it('ranks by neighbourhoods when asked', () => {
    const ranked = rankPlayers(
      [
        { name: 'A', count: 5, neighbourhoods: 1 },
        { name: 'B', count: 1, neighbourhoods: 4 },
      ],
      'neighbourhoods',
    )
    expect(ranked.map((p) => p.name)).toEqual(['B', 'A'])
    expect(ranked[0].rank).toBe(1)
  })
})

describe('neighbourhoodCounts', () => {
  it('counts the player\'s spots per neighbourhood and skips unknown spots', () => {
    const spots = [
      { id: 'a', neighbourhood: 'Belém' },
      { id: 'b', neighbourhood: 'Belém' },
      { id: 'c', neighbourhood: 'Ajuda' },
    ]
    const checkOffs = [{ spot_id: 'a' }, { spot_id: 'b' }, { spot_id: 'c' }, { spot_id: 'gone' }]
    expect(neighbourhoodCounts(checkOffs, spots)).toEqual({ Belém: 2, Ajuda: 1 })
  })
})

describe('categoryDetail', () => {
  const spots = [
    { id: 'f1', category: 'food', neighbourhood: 'Belém', name: 'Pastéis' },
    { id: 'f2', category: 'food', neighbourhood: 'Belém', name: 'Tasca' },
    { id: 'f3', category: 'food', neighbourhood: 'Alfama', name: 'Petisqueira' },
    { id: 'v1', category: 'viewpoint', neighbourhood: 'Graça', name: 'Miradouro' },
  ]
  const hoods = ['Belém', 'Alfama', 'Graça', 'Benfica']
  const checkOffs = [
    { spot_id: 'f1', created_at: '2026-11-20T10:00:00Z', verified: true, note: '  Best ones  ', rating: 5 },
    { spot_id: 'f2', created_at: '2026-11-22T10:00:00Z', verified: false, note: '', rating: 9 },
  ]
  const collectedIds = new Set(['f1', 'f2'])
  const detail = () => categoryDetail(spots, checkOffs, collectedIds, 'food', hoods)

  it('lists only the collected spots of that category, newest first', () => {
    expect(detail().collected.map((e) => e.spot.id)).toEqual(['f2', 'f1'])
  })

  it('cleans the note and the rating like the rest of the app', () => {
    const [newest, older] = detail().collected
    expect(older.note).toBe('Best ones')
    expect(older.rating).toBe(5)
    expect(newest.note).toBeNull() // blank
    expect(newest.rating).toBeNull() // 9 is out of range
  })

  it('counts the neighbourhoods where something was collected', () => {
    expect(detail().visited).toEqual([{ name: 'Belém', count: 2, available: 2 }])
    expect(detail().totalNeighbourhoods).toBe(4)
  })

  it('names only neighbourhoods that have this category but none collected', () => {
    // Alfama has a food spot and none collected; Graça has only a viewpoint;
    // Benfica has nothing at all.
    expect(detail().missing).toEqual(['Alfama'])
  })

  it('copes with a category nobody has collected', () => {
    const empty = categoryDetail(spots, checkOffs, collectedIds, 'viewpoint', hoods)
    expect(empty.collected).toEqual([])
    expect(empty.visited).toEqual([])
    expect(empty.missing).toEqual(['Graça'])
  })
})

describe('recentlyCollected for the photo grid', () => {
  const spots = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ]
  const rows = [
    { spot_id: 'a', created_at: '2026-11-01T10:00:00Z', photo_path: 'u/a.jpg' },
    { spot_id: 'b', created_at: '2026-11-05T10:00:00Z' },
  ]

  it('can list every spot (no limit), newest first', () => {
    expect(recentlyCollected(rows, spots, Infinity).map((e) => e.spot.id)).toEqual(['b', 'a'])
  })

  it('keeps the saved row, so the photo can be found', () => {
    expect(recentlyCollected(rows, spots, Infinity)[1].checkOff.photo_path).toBe('u/a.jpg')
  })
})

describe('formatShortDate', () => {
  it('writes day and short month', () => {
    expect(formatShortDate(new Date(2026, 10, 17))).toBe('17 Nov')
  })
})
