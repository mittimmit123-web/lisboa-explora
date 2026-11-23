import { describe, expect, it } from 'vitest'
import {
  SHOW_ALL_ZOOM,
  directionsUrl,
  emojiFor,
  emptyMapMessage,
  isInBounds,
  isVisibleAtZoom,
  isVisibleAtZoomForStatus,
  matchesFilter,
  matchesStatus,
  toggleCategory,
} from '../src/lib/markers.js'

describe('emojiFor', () => {
  it('gives each category its emoji', () => {
    expect(emojiFor({ category: 'park' })).toBe('🌳')
    expect(emojiFor({ category: 'campus' })).toBe('🎓')
  })

  it('gives food spots an emoji per kind', () => {
    expect(emojiFor({ category: 'food', kind: 'cafe' })).toBe('☕')
    expect(emojiFor({ category: 'food', kind: 'market' })).toBe('🧺')
    expect(emojiFor({ category: 'food', kind: 'restaurant' })).toBe('🍴')
  })

  it('falls back safely for unknown values', () => {
    expect(emojiFor({ category: 'food' })).toBe('🍴') // food without kind
    expect(emojiFor({ category: 'something-new' })).toBe('📍')
  })
})

describe('isVisibleAtZoom', () => {
  const normal = { category: 'food' }
  const famous = { category: 'monument', highlight: true }

  it('shows only highlights when zoomed out', () => {
    expect(isVisibleAtZoom(famous, 12)).toBe(true)
    expect(isVisibleAtZoom(normal, 12)).toBe(false)
  })

  it('shows every spot when zoomed in, starting exactly at SHOW_ALL_ZOOM', () => {
    expect(isVisibleAtZoom(normal, SHOW_ALL_ZOOM - 1)).toBe(false)
    expect(isVisibleAtZoom(normal, SHOW_ALL_ZOOM)).toBe(true)
  })
})

describe('category filter', () => {
  const bar = { category: 'nightlife' }
  const cafe = { category: 'food' }

  it('shows every spot when nothing is selected ("All")', () => {
    expect(matchesFilter(bar, [])).toBe(true)
    expect(matchesFilter(cafe, [])).toBe(true)
  })

  it('shows spots of every selected category, and only those', () => {
    expect(matchesFilter(bar, ['nightlife', 'food'])).toBe(true)
    expect(matchesFilter(cafe, ['nightlife', 'food'])).toBe(true)
    expect(matchesFilter(cafe, ['nightlife'])).toBe(false)
  })

  it('turns a category on and off', () => {
    expect(toggleCategory(['food'], 'nightlife')).toEqual(['food', 'nightlife'])
    expect(toggleCategory(['food', 'nightlife'], 'food')).toEqual(['nightlife'])
  })

  it('goes back to "All" when the last category is turned off', () => {
    expect(toggleCategory(['food'], 'food')).toEqual([])
  })
})

describe('isInBounds', () => {
  const bounds = { south: 38.7, west: -9.2, north: 38.8, east: -9.1 }

  it('accepts spots inside and on the edge', () => {
    expect(isInBounds({ lat: 38.75, lng: -9.15 }, bounds)).toBe(true)
    expect(isInBounds({ lat: 38.7, lng: -9.2 }, bounds)).toBe(true)
  })

  it('rejects spots outside', () => {
    expect(isInBounds({ lat: 38.678, lng: -9.326 }, bounds)).toBe(false)
  })
})

describe('directionsUrl', () => {
  it('builds a Google Maps walking link to the spot', () => {
    expect(directionsUrl({ lat: 38.7118, lng: -9.1301 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=38.7118,-9.1301&travelmode=walking',
    )
  })
})

describe('matchesStatus', () => {
  const collectedIds = new Set(['a'])
  const seen = { id: 'a' }
  const missing = { id: 'b' }

  it('"all" lets every spot through', () => {
    expect(matchesStatus(seen, 'all', collectedIds)).toBe(true)
    expect(matchesStatus(missing, 'all', collectedIds)).toBe(true)
  })

  it('"collected" keeps only spots in the journal', () => {
    expect(matchesStatus(seen, 'collected', collectedIds)).toBe(true)
    expect(matchesStatus(missing, 'collected', collectedIds)).toBe(false)
  })

  it('"missing" keeps only the ones still to visit', () => {
    expect(matchesStatus(seen, 'missing', collectedIds)).toBe(false)
    expect(matchesStatus(missing, 'missing', collectedIds)).toBe(true)
  })

  it('treats an unknown status as "all", so a stale value cannot empty the map', () => {
    expect(matchesStatus(missing, 'something-else', collectedIds)).toBe(true)
  })
})

describe('isVisibleAtZoomForStatus', () => {
  const normal = { category: 'food' }
  const famous = { category: 'monument', highlight: true }
  const zoomedOut = SHOW_ALL_ZOOM - 1

  it('keeps the zoom rule for "all" and "missing"', () => {
    expect(isVisibleAtZoomForStatus(normal, zoomedOut, 'all')).toBe(false)
    expect(isVisibleAtZoomForStatus(normal, zoomedOut, 'missing')).toBe(false)
    expect(isVisibleAtZoomForStatus(famous, zoomedOut, 'all')).toBe(true)
  })

  it('shows collected spots at every zoom, highlight or not', () => {
    expect(isVisibleAtZoomForStatus(normal, zoomedOut, 'collected')).toBe(true)
  })

  it('still shows everything when zoomed in', () => {
    expect(isVisibleAtZoomForStatus(normal, SHOW_ALL_ZOOM, 'missing')).toBe(true)
  })
})

describe('emptyMapMessage', () => {
  const base = { shown: 0, categories: [], status: 'all', collectedCount: 3 }

  it('says nothing while spots are on the map', () => {
    expect(emptyMapMessage({ ...base, shown: 1, status: 'collected', collectedCount: 0 })).toBeNull()
  })

  it('explains "Collected" before anything is collected', () => {
    expect(emptyMapMessage({ ...base, status: 'collected', collectedCount: 0 })).toBe(
      "You haven't collected any spots yet",
    )
  })

  it('blames the filters when a filter is on', () => {
    expect(emptyMapMessage({ ...base, categories: ['park'] })).toBe('No spots match these filters here')
    expect(emptyMapMessage({ ...base, status: 'missing' })).toBe('No spots match these filters here')
    // collected spots exist, just none in this part of the map
    expect(emptyMapMessage({ ...base, status: 'collected' })).toBe('No spots match these filters here')
  })

  it('blames the map area when no filter is on', () => {
    expect(emptyMapMessage(base)).toBe('No spots in this part of the map')
  })
})
