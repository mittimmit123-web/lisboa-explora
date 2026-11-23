import { describe, expect, it } from 'vitest'
import { LOCATION_STEPS, isLocationBlocked, locationOffMessage } from '../src/lib/location.js'

describe('isLocationBlocked', () => {
  it('is true when the browser says permission was denied (code 1)', () => {
    expect(isLocationBlocked(1)).toBe(true)
  })

  it('is false for no signal (2) or a timeout (3)', () => {
    expect(isLocationBlocked(2)).toBe(false)
    expect(isLocationBlocked(3)).toBe(false)
  })

  it('is false when there is no error', () => {
    expect(isLocationBlocked(null)).toBe(false)
  })
})

describe('locationOffMessage', () => {
  it('names the website the player is on', () => {
    expect(locationOffMessage('lisboa-explora.vercel.app')).toBe(
      'Allow location for lisboa-explora.vercel.app in your settings, then reload the page.',
    )
  })
})

describe('LOCATION_STEPS', () => {
  it('has steps for iPhone, Android and computers', () => {
    expect(LOCATION_STEPS.map((s) => s.device)).toEqual(['iPhone', 'Android', 'Computer'])
  })
})
