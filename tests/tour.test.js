import { describe, expect, it } from 'vitest'
import { TOUR_STEPS, hasSeenTour, isLastStep, markTourSeen, tourText } from '../src/lib/tour.js'

function fakeStorage() {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
}

describe('tour steps', () => {
  it('starts on the map and ends with a call to go exploring', () => {
    expect(TOUR_STEPS[0].tab).toBe('map')
    expect(TOUR_STEPS.at(-1).target).toBeNull()
  })

  it('opens a real tab in every step', () => {
    for (const step of TOUR_STEPS) expect(['map', 'collection', 'friends']).toContain(step.tab)
  })
})

describe('tourText', () => {
  const journal = TOUR_STEPS.find((s) => s.text.includes('{name}'))

  it("puts in the Explora's name", () => {
    expect(tourText(journal, 'Miss Purrfect')).toContain('Miss Purrfect')
  })

  it('says "your Explora" when none was chosen', () => {
    expect(tourText(journal, null)).toContain('your Explora')
  })

  it('leaves no placeholders in any step', () => {
    for (const step of TOUR_STEPS) expect(tourText(step, 'Trammy')).not.toMatch(/[{}]/)
  })
})

describe('isLastStep', () => {
  it('knows the last step', () => {
    expect(isLastStep(0)).toBe(false)
    expect(isLastStep(TOUR_STEPS.length - 1)).toBe(true)
  })
})

describe('hasSeenTour / markTourSeen', () => {
  it('shows the tour the first time only', () => {
    const storage = fakeStorage()
    expect(hasSeenTour(storage)).toBe(false)
    markTourSeen(storage)
    expect(hasSeenTour(storage)).toBe(true)
  })

  it('still works when the browser blocks storage', () => {
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(hasSeenTour(blocked)).toBe(false)
    expect(() => markTourSeen(blocked)).not.toThrow()
  })
})
