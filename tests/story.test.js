import { describe, expect, it } from 'vitest'
import { CHAPTERS, ENDINGS, PARTS } from '../src/data/story.js'
import { NEIGHBOURHOODS } from '../src/data/neighbourhoods.js'
import { fillStory, newlyUnlocked, partFor, unlockedChapters } from '../src/lib/story.js'

const spots = [
  { id: 'a', neighbourhood: 'Belém' },
  { id: 'b', neighbourhood: 'Belém' },
  { id: 'c', neighbourhood: 'Misericórdia' },
  { id: 'd', neighbourhood: 'Arroios' },
  { id: 'campus', neighbourhood: 'Carcavelos' },
]
const hoods = ['Belém', 'Misericórdia', 'Arroios']
const chapters = [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }]

describe('story data', () => {
  it('has one chapter for each of the 24 neighbourhoods', () => {
    expect(CHAPTERS).toHaveLength(NEIGHBOURHOODS.length)
    expect(CHAPTERS).toHaveLength(24)
  })

  it('gives every chapter a title and a text with the place in it', () => {
    for (const c of CHAPTERS) {
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.text.length).toBeGreaterThan(20)
    }
  })

  it('has parts that start at chapter 1 and endings for both cases', () => {
    expect(PARTS[0].from).toBe(1)
    expect(ENDINGS.verified && ENDINGS.later).toBeTruthy()
  })
})

describe('unlockedChapters', () => {
  it('unlocks chapters in the order neighbourhoods were first visited', () => {
    const rows = [
      { spot_id: 'c', created_at: '2026-11-10T10:00:00Z', verified: true },
      { spot_id: 'a', created_at: '2026-11-02T10:00:00Z', verified: false },
      { spot_id: 'd', created_at: '2026-11-15T10:00:00Z' },
    ]
    const result = unlockedChapters(rows, spots, hoods, chapters)
    expect(result.map((r) => [r.number, r.place, r.chapter.title])).toEqual([
      [1, 'Belém', 'One'],
      [2, 'Misericórdia', 'Two'],
      [3, 'Arroios', 'Three'],
    ])
    expect(result.map((r) => r.verified)).toEqual([false, true, false])
  })

  it('does not unlock a second chapter for the same neighbourhood', () => {
    const rows = [
      { spot_id: 'a', created_at: '2026-11-02T10:00:00Z' },
      { spot_id: 'b', created_at: '2026-11-03T10:00:00Z' },
    ]
    expect(unlockedChapters(rows, spots, hoods, chapters)).toHaveLength(1)
  })

  it('ignores spots outside the city and unknown spots', () => {
    const rows = [
      { spot_id: 'campus', created_at: '2026-11-02T10:00:00Z' },
      { spot_id: 'gone', created_at: '2026-11-03T10:00:00Z' },
    ]
    expect(unlockedChapters(rows, spots, hoods, chapters)).toEqual([])
  })

  it('never unlocks more chapters than exist', () => {
    const rows = [
      { spot_id: 'a', created_at: '2026-11-02T10:00:00Z' },
      { spot_id: 'c', created_at: '2026-11-03T10:00:00Z' },
      { spot_id: 'd', created_at: '2026-11-04T10:00:00Z' },
    ]
    expect(unlockedChapters(rows, spots, hoods, chapters.slice(0, 2))).toHaveLength(2)
  })

  it('is empty for a new player', () => {
    expect(unlockedChapters([], spots, hoods, chapters)).toEqual([])
  })
})

describe('fillStory', () => {
  it('fills in the buddy and the place', () => {
    expect(fillStory('{buddy} loves {place}.', { buddy: 'Cat', place: 'Belém' })).toBe('Cat loves Belém.')
  })

  it('says "your Explora" when none was chosen, with a capital at the start of a sentence', () => {
    expect(fillStory('{buddy} waves. Then {place} waves at {buddy}.', { place: 'Alfama' })).toBe(
      'Your Explora waves. Then Alfama waves at your Explora.',
    )
  })

  it('capitalises after a quote that ends a sentence', () => {
    expect(fillStory('"Why?" {buddy} asks.', {})).toBe('"Why?" Your Explora asks.')
  })

  it('works on every real chapter without leaving placeholders behind', () => {
    for (const c of CHAPTERS) {
      expect(fillStory(c.text, { buddy: 'Tram', place: 'Belém' })).not.toMatch(/[{}]/)
      expect(fillStory(c.text, { place: 'Belém' })).not.toMatch(/[{}]/)
    }
  })
})

describe('partFor', () => {
  it('finds the part a chapter belongs to', () => {
    expect(partFor(1, PARTS).title).toBe('New in town')
    expect(partFor(13, PARTS).title).toBe('Saudade')
    expect(partFor(24, PARTS).title).toBe('Home')
  })
})

describe('newlyUnlocked', () => {
  it('returns the new chapter when a check-off opened one', () => {
    const before = [{ number: 1, place: 'Belém' }]
    const after = [...before, { number: 2, place: 'Arroios' }]
    expect(newlyUnlocked(before, after)).toEqual({ number: 2, place: 'Arroios' })
  })

  it('finds the new neighbourhood even if it is not the last one in the list', () => {
    // e.g. when a clock is wrong and an older entry has a later date
    const before = [{ number: 1, place: 'Belém' }, { number: 2, place: 'Arroios' }]
    const after = [{ number: 1, place: 'Belém' }, { number: 2, place: 'Misericórdia' }, { number: 3, place: 'Arroios' }]
    expect(newlyUnlocked(before, after).place).toBe('Misericórdia')
  })

  it('returns null when nothing new was unlocked', () => {
    const list = [{ number: 1, place: 'Belém' }]
    expect(newlyUnlocked(list, list)).toBeNull()
  })
})
