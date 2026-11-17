import { describe, expect, it } from 'vitest'
import { distanceMeters, formatDistance, isWithinRadius } from '../src/lib/geo.js'

const santaLuzia = { lat: 38.7118, lng: -9.1301 }

describe('distanceMeters', () => {
  it('is 0 for the same point', () => {
    expect(distanceMeters(santaLuzia, santaLuzia)).toBe(0)
  })

  it('measures about 111 m for 0.001 degrees of latitude', () => {
    const north = { lat: santaLuzia.lat + 0.001, lng: santaLuzia.lng }
    expect(distanceMeters(santaLuzia, north)).toBeCloseTo(111, 0)
  })

  it('is the same in both directions', () => {
    const b = { lat: 38.7139, lng: -9.1334 }
    expect(distanceMeters(santaLuzia, b)).toBeCloseTo(distanceMeters(b, santaLuzia), 6)
  })
})

describe('isWithinRadius', () => {
  it('accepts a player 30 m away', () => {
    const near = { lat: santaLuzia.lat + 0.00027, lng: santaLuzia.lng } // ~30 m
    expect(isWithinRadius(near, santaLuzia)).toBe(true)
  })

  it('rejects a player 120 m away', () => {
    const far = { lat: santaLuzia.lat + 0.00108, lng: santaLuzia.lng } // ~120 m
    expect(isWithinRadius(far, santaLuzia)).toBe(false)
  })
})

describe('formatDistance', () => {
  it('shows metres below 1 km', () => {
    expect(formatDistance(320.4)).toBe('320 m')
  })
  it('shows km from 1 km', () => {
    expect(formatDistance(1234)).toBe('1.2 km')
  })
})
