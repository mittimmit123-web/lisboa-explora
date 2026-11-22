// The note and the rating a player may add to a check-off. Both optional:
// an entry needs nothing but the spot (DECISIONS.md).
// These rules mirror the ones in public.check_off (supabase/schema.sql).
import { describe, expect, it } from 'vitest'
import { MAX_NOTE_LENGTH, charactersLeft, cleanJournalNote, cleanRating } from '../src/lib/journal.js'

describe('cleanJournalNote', () => {
  it('keeps what the player wrote, without the stray spaces', () => {
    expect(cleanJournalNote('  Best sunset in Lisbon  ')).toBe('Best sunset in Lisbon')
  })

  it('treats nothing, spaces and non-text as "no note"', () => {
    expect(cleanJournalNote('')).toBeNull()
    expect(cleanJournalNote('   \n ')).toBeNull()
    expect(cleanJournalNote(undefined)).toBeNull()
    expect(cleanJournalNote(null)).toBeNull()
    expect(cleanJournalNote(42)).toBeNull()
  })

  it('cuts a note that is too long instead of refusing it', () => {
    const long = 'a'.repeat(MAX_NOTE_LENGTH + 50)
    expect(cleanJournalNote(long)).toHaveLength(MAX_NOTE_LENGTH)
  })

  it('keeps a note that is exactly at the limit', () => {
    const exact = 'b'.repeat(MAX_NOTE_LENGTH)
    expect(cleanJournalNote(exact)).toHaveLength(MAX_NOTE_LENGTH)
  })
})

describe('cleanRating', () => {
  it('accepts 1 to 5', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(cleanRating(n)).toBe(n)
  })

  it('treats everything else as "no rating" rather than an error', () => {
    expect(cleanRating(0)).toBeNull()
    expect(cleanRating(6)).toBeNull()
    expect(cleanRating(-1)).toBeNull()
    expect(cleanRating(3.5)).toBeNull()
    expect(cleanRating('4')).toBeNull()
    expect(cleanRating(null)).toBeNull()
    expect(cleanRating(undefined)).toBeNull()
  })
})

describe('charactersLeft', () => {
  it('counts down from the limit', () => {
    expect(charactersLeft('')).toBe(MAX_NOTE_LENGTH)
    expect(charactersLeft('hello')).toBe(MAX_NOTE_LENGTH - 5)
  })

  it('ignores stray spaces, like the saved note does', () => {
    expect(charactersLeft('  hi  ')).toBe(MAX_NOTE_LENGTH - 2)
  })
})
