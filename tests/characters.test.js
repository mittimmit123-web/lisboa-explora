import { describe, expect, it } from 'vitest'
import { CHARACTERS, characterById, cleanCharacterId } from '../src/lib/characters.js'

describe('characters', () => {
  it('has the three buddies with unique ids and all texts filled in', () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(['tram', 'sardine', 'cat'])
    for (const c of CHARACTERS) {
      expect(c.name && c.say && c.about && c.hello).toBeTruthy()
      expect(c.pronouns.he && c.pronouns.him && c.pronouns.his).toBeTruthy()
    }
  })

  it('finds a character by id', () => {
    expect(characterById('cat').name).toBe('Miss Purrfect')
  })

  it('returns null for an unknown id', () => {
    expect(characterById('dragon')).toBeNull()
  })
})

describe('cleanCharacterId', () => {
  it('keeps a known id', () => {
    expect(cleanCharacterId('sardine')).toBe('sardine')
  })

  it('throws away anything else that was saved in the browser', () => {
    expect(cleanCharacterId('dragon')).toBeNull()
    expect(cleanCharacterId('')).toBeNull()
    expect(cleanCharacterId(null)).toBeNull()
    expect(cleanCharacterId('<script>')).toBeNull()
  })
})
