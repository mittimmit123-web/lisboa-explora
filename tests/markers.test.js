import { describe, expect, it } from 'vitest'
import { SHOW_ALL_ZOOM, directionsUrl, emojiFor, isInBounds, isVisibleAtZoom } from '../src/lib/markers.js'

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
