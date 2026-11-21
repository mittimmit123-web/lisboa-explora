import { describe, expect, it } from 'vitest'
import {
  PROLOGUE_END,
  PROLOGUE_HOLD,
  PROLOGUE_JOY,
  advancePrologue,
  hasSeenIntro,
  markIntroSeen,
  nextStep,
  prologuePhase,
  welcomePhase,
} from '../src/lib/intro.js'

function fakeStorage() {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
}

describe('nextStep', () => {
  it('goes welcome -> pick -> prologue -> album -> done', () => {
    expect(nextStep('welcome')).toBe('pick')
    expect(nextStep('pick')).toBe('prologue')
    expect(nextStep('prologue')).toBe('album')
    expect(nextStep('album')).toBe('done')
  })
})

describe('welcomePhase', () => {
  it('rolls in first, then cheers', () => {
    expect(welcomePhase(0.5)).toBe('arrive')
    expect(welcomePhase(2)).toBe('cheer')
  })
})

describe('prologuePhase', () => {
  it('plays enter, hello and ask in order', () => {
    expect(prologuePhase(0.2)).toBe('enter')
    expect(prologuePhase(2)).toBe('hello')
    expect(prologuePhase(4)).toBe('ask')
  })

  it('stays at the question until the player answers', () => {
    expect(prologuePhase(6)).toBe('ask')
    expect(prologuePhase(6, true)).toBe('joy')
  })
})

describe('advancePrologue', () => {
  it('waits at the question before the answer', () => {
    expect(advancePrologue(4.3, 0.5, false)).toBe(PROLOGUE_HOLD)
    expect(advancePrologue(PROLOGUE_HOLD, 5, false)).toBe(PROLOGUE_HOLD)
  })

  it('jumps to the happy part after "Yes" and plays on to the end', () => {
    expect(advancePrologue(PROLOGUE_HOLD, 0.1, true)).toBeCloseTo(PROLOGUE_JOY + 0.1)
    expect(advancePrologue(6.5, 1, true)).toBeGreaterThanOrEqual(PROLOGUE_END)
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
