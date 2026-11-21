import { describe, expect, it } from 'vitest'
import { ALBUM_SIZE, albumSlots, postmarkDate } from '../src/lib/postcards.js'

describe('albumSlots', () => {
  it('always has 24 slots, filled in order', () => {
    const slots = albumSlots([{ number: 1 }, { number: 2 }])
    expect(slots).toHaveLength(ALBUM_SIZE)
    expect(slots.slice(0, 3)).toEqual([{ number: 1 }, { number: 2 }, null])
  })

  it('is all empty for a new player', () => {
    expect(albumSlots([]).every((s) => s === null)).toBe(true)
  })
})

describe('postmarkDate', () => {
  it('writes the date like a postmark', () => {
    expect(postmarkDate('2026-11-21T12:00:00Z')).toBe('21 Nov 2026')
  })
})
