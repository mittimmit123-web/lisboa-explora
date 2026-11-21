import { describe, expect, it } from 'vitest'
import { ASK_HOLD, INTRO_END, JOY_START, advance, hasSeenIntro, markIntroSeen, phaseAt } from '../src/lib/intro.js'

// A fake browser storage for the tests
function fakeStorage() {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
}

describe('phaseAt', () => {
  it('plays the parts of the intro in order', () => {
    expect(phaseAt(0)).toBe('arrive')
    expect(phaseAt(2)).toBe('welcome')
    expect(phaseAt(5)).toBe('turn')
    expect(phaseAt(6)).toBe('hello')
    expect(phaseAt(8)).toBe('ask')
  })

  it('stays at the question until the player answers', () => {
    expect(phaseAt(10)).toBe('ask')
    expect(phaseAt(10, true)).toBe('joy')
  })
})

describe('advance', () => {
  it('waits at the question before the answer', () => {
    expect(advance(8.7, 0.5, false)).toBe(ASK_HOLD)
    expect(advance(ASK_HOLD, 5, false)).toBe(ASK_HOLD)
  })

  it('jumps to the happy ending after "Yes" and plays on to the end', () => {
    expect(advance(ASK_HOLD, 0.1, true)).toBeCloseTo(JOY_START + 0.1)
    expect(advance(10.5, 1, true)).toBeGreaterThanOrEqual(INTRO_END)
  })
})

describe('hasSeenIntro / markIntroSeen', () => {
  it('shows the intro the first time only', () => {
    const storage = fakeStorage()
    expect(hasSeenIntro(storage)).toBe(false)
    markIntroSeen(storage)
    expect(hasSeenIntro(storage)).toBe(true)
  })

  it('still works when the browser blocks storage', () => {
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(hasSeenIntro(blocked)).toBe(false)
    expect(() => markIntroSeen(blocked)).not.toThrow()
  })
})
