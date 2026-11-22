import { describe, expect, it } from 'vitest'
import { addFriendMessage, friendEmailProblem, nameProblem, nameResultMessage, playerLabel, rememberMood, rememberedMood, weatherMood } from '../src/lib/friends.js'

describe('playerLabel', () => {
  it('shows other players by name', () => {
    expect(playerLabel({ name: 'Marta' })).toBe('Marta')
  })

  it('adds "(you)" to my own name', () => {
    expect(playerLabel({ name: 'Marleen', isMe: true })).toBe('Marleen (you)')
  })

  it('does not say "You (you)" in demo mode', () => {
    expect(playerLabel({ name: 'You', isMe: true })).toBe('You')
  })

  it('falls back to "You" when I have no name yet', () => {
    expect(playerLabel({ name: '', isMe: true })).toBe('You')
  })
})

describe('friendEmailProblem (before asking the server)', () => {
  const base = { email: 'ana@example.com', myEmail: 'me@example.com' }

  it('lets a normal email through', () => {
    expect(friendEmailProblem(base)).toBeNull()
  })

  it('rejects my own email', () => {
    expect(friendEmailProblem({ ...base, email: ' ME@example.com ' }).text).toMatch(/your own email/)
  })

  it('asks for an email when the field is empty', () => {
    expect(friendEmailProblem({ ...base, email: '   ' }).text).toMatch(/Type your friend/)
  })

  it('is honest in demo mode instead of pretending to add someone', () => {
    expect(friendEmailProblem({ ...base, demo: true }).text).toMatch(/demo mode/)
  })
})

describe('addFriendMessage (after the server answered)', () => {
  it('confirms when the friend was added', () => {
    const m = addFriendMessage({ email: 'ana@example.com', result: { ok: true } })
    expect(m.ok).toBe(true)
    expect(m.text).toContain('ana@example.com')
  })

  it('explains clearly when no player has that email', () => {
    const m = addFriendMessage({ email: 'ana@example.com', result: { ok: false } })
    expect(m.ok).toBe(false)
    expect(m.text).toMatch(/No player has that email/)
  })

  it('tells the player to check the internet when the request failed', () => {
    expect(addFriendMessage({ email: 'ana@example.com', error: new Error('offline') }).text).toMatch(/Check your internet/)
  })
})

describe('weatherMood', () => {
  const me = (count) => ({ name: 'You', count, isMe: true })

  it('is golden when I lead by 2 or more', () => {
    expect(weatherMood([me(6), { name: 'Marta', count: 4 }]).mood).toBe('golden')
  })

  it('gets clouds when I lead by just 1', () => {
    const w = weatherMood([me(5), { name: 'Marta', count: 4 }])
    expect(w.mood).toBe('clouds')
    expect(w.text).toContain('Marta')
  })

  it('gets clouds on a tie, naming the friend', () => {
    const w = weatherMood([me(4), { name: 'Marta', count: 4 }])
    expect(w.mood).toBe('clouds')
    expect(w.sub).toBe('Tied with Marta')
  })

  it('is windy when 1-2 spots behind first place', () => {
    expect(weatherMood([me(4), { name: 'Marta', count: 6 }, { name: 'João', count: 5 }]).mood).toBe('wind')
  })

  it('drizzles (with a rainbow) when 3 or more behind', () => {
    const w = weatherMood([me(3), { name: 'Marta', count: 6 }])
    expect(w.mood).toBe('drizzle')
    expect(w.sub).toBe('3 spots behind Marta')
  })

  it('rains cosily when I have no spots this month, whatever the friends do', () => {
    expect(weatherMood([me(0), { name: 'Marta', count: 0 }]).mood).toBe('rain')
    expect(weatherMood([me(0)]).mood).toBe('rain')
  })

  it('is sunny and invites friends when I play alone', () => {
    const w = weatherMood([me(2)])
    expect(w.mood).toBe('golden')
    expect(w.text).toMatch(/Add a friend/)
  })

  it('uses "1 spot" not "1 spots"', () => {
    expect(weatherMood([me(5), { name: 'Marta', count: 4 }]).sub).toBe('#1 · 1 spot ahead')
  })

  it('works when I am missing from the list', () => {
    expect(weatherMood([{ name: 'Marta', count: 3 }]).mood).toBe('rain')
  })
})

describe('remembered weather', () => {
  const fakeStorage = () => {
    const data = {}
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)) }
  }

  it('gives back the last mood', () => {
    const storage = fakeStorage()
    rememberMood('drizzle', storage)
    expect(rememberedMood(storage)).toBe('drizzle')
  })

  it('is null the first time', () => {
    expect(rememberedMood(fakeStorage())).toBeNull()
  })

  it('ignores unknown moods', () => {
    const storage = fakeStorage()
    rememberMood('snow', storage)
    expect(rememberedMood(storage)).toBeNull()
    storage.setItem('lisboa-explora-weather', 'tornado')
    expect(rememberedMood(storage)).toBeNull()
  })

  it('does not crash when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(rememberedMood(blocked)).toBeNull()
    expect(() => rememberMood('rain', blocked)).not.toThrow()
  })
})

describe('nameProblem', () => {
  it('accepts a normal name or nickname', () => {
    expect(nameProblem('Marleen')).toBeNull()
    expect(nameProblem('Jo')).toBeNull()
    expect(nameProblem('Captain Lisbon 2026')).toBeNull()
  })

  it('rejects names that are too short or too long', () => {
    expect(nameProblem('M').ok).toBe(false)
    expect(nameProblem('x'.repeat(21)).ok).toBe(false)
  })

  it('rejects blank names and ignores spaces around the name', () => {
    expect(nameProblem('').ok).toBe(false)
    expect(nameProblem('     ').ok).toBe(false)
    expect(nameProblem(null).ok).toBe(false)
    expect(nameProblem('  Jo  ')).toBeNull()
  })
})

describe('nameResultMessage', () => {
  it('confirms a saved name', () => {
    expect(nameResultMessage({ result: { ok: true } }).ok).toBe(true)
  })

  it('says when the name is already taken', () => {
    const message = nameResultMessage({ result: { ok: false, reason: 'name_taken' } })
    expect(message.ok).toBe(false)
    expect(message.text).toMatch(/already taken/)
  })

  it('explains the length rule when the server refuses the name', () => {
    expect(nameResultMessage({ result: { ok: false, reason: 'bad_name' } }).text).toMatch(/2–20/)
  })

  it('asks to check the internet when the request fails', () => {
    expect(nameResultMessage({ error: new Error('offline') }).text).toMatch(/internet/)
  })
})
