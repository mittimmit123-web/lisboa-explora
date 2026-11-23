import { describe, expect, it } from 'vitest'
import {
  HELLO_END,
  PROLOGUE_END,
  PROLOGUE_HOLD,
  PROLOGUE_JOY,
  advancePrologue,
  hasSeenIntro,
  markIntroSeen,
  markWelcomed,
  nextStep,
  prologuePhase,
  welcomeDue,
  welcomePhase,
} from '../src/lib/intro.js'

function fakeStorage() {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
}

describe('nextStep', () => {
  it('goes welcome -> purpose -> pick -> prologue -> name -> album -> done', () => {
    expect(nextStep('welcome')).toBe('purpose')
    expect(nextStep('purpose')).toBe('pick')
    expect(nextStep('pick')).toBe('prologue')
    expect(nextStep('prologue')).toBe('name')
    expect(nextStep('name')).toBe('album')
    expect(nextStep('album')).toBe('done')
  })

  it('skips choosing an Explora and the name when watched again', () => {
    expect(nextStep('welcome', true)).toBe('purpose')
    expect(nextStep('purpose', true)).toBe('prologue')
    expect(nextStep('prologue', true)).toBe('album')
    expect(nextStep('album', true)).toBe('done')
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
    expect(prologuePhase(5)).toBe('hello') // the first words stay about 5 s, long enough to read
    expect(prologuePhase(HELLO_END + 0.1)).toBe('ask')
  })

  it('stays at the question until the player answers', () => {
    expect(prologuePhase(PROLOGUE_JOY + 1)).toBe('ask')
    expect(prologuePhase(PROLOGUE_JOY + 1, true)).toBe('joy')
  })
})

describe('advancePrologue', () => {
  it('waits at the question before the answer', () => {
    expect(advancePrologue(PROLOGUE_HOLD - 0.1, 0.5, false)).toBe(PROLOGUE_HOLD)
    expect(advancePrologue(PROLOGUE_HOLD, 5, false)).toBe(PROLOGUE_HOLD)
  })

  it('jumps to the happy part after "Yes" and plays on to the end', () => {
    expect(advancePrologue(PROLOGUE_HOLD, 0.1, true)).toBeCloseTo(PROLOGUE_JOY + 0.1)
    expect(advancePrologue(PROLOGUE_END - 0.5, 1, true)).toBeGreaterThanOrEqual(PROLOGUE_END)
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

describe('welcome card once per day', () => {
  const fakeStorage = () => {
    const data = {}
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
  }
  const morning = new Date(2026, 10, 23, 9, 0)
  const evening = new Date(2026, 10, 23, 21, 0)
  const nextDay = new Date(2026, 10, 24, 8, 0)

  it('shows the card on the first opening of the day only', () => {
    const storage = fakeStorage()
    expect(welcomeDue(storage, morning)).toBe(true)
    markWelcomed(storage, morning)
    expect(welcomeDue(storage, evening)).toBe(false)
  })

  it('shows it again the next day', () => {
    const storage = fakeStorage()
    markWelcomed(storage, evening)
    expect(welcomeDue(storage, nextDay)).toBe(true)
  })

  it('skips the card when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(welcomeDue(blocked, morning)).toBe(false)
    expect(() => markWelcomed(blocked, morning)).not.toThrow()
  })
})
