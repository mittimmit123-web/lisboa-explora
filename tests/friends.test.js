import { describe, expect, it } from 'vitest'
import { addFriendMessage, answerMessage, friendEmailProblem, moreWaiting, nameProblem, nameResultMessage, playerLabel, rememberMood, rememberedMood, titleLine, weatherMood, withTitles } from '../src/lib/friends.js'

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
  it('says the request was sent, without promising the person plays', () => {
    const m = addFriendMessage({ email: ' ana@example.com ', result: { ok: true, status: 'sent' } })
    expect(m.ok).toBe(true)
    expect(m.text).toMatch(/Request sent/)
    expect(m.text).toContain('If ana@example.com plays')
  })

  it('tells you when you are friends already', () => {
    expect(addFriendMessage({ email: 'ana@example.com', result: { ok: true, status: 'already_friends' } }).text).toMatch(/already friends/)
  })

  it('celebrates when the other player had already asked you', () => {
    const m = addFriendMessage({ email: 'ana@example.com', result: { ok: true, status: 'friends' } })
    expect(m.ok).toBe(true)
    expect(m.text).toMatch(/friends now/)
  })

  it('asks to try again when the request failed', () => {
    expect(addFriendMessage({ email: 'ana@example.com', error: new Error('offline') }).text).toMatch(/Check your internet/)
    expect(addFriendMessage({ email: 'ana@example.com', result: { ok: false, reason: 'not_logged_in' } }).ok).toBe(false)
  })
})

describe('answerMessage (after Accept or Deny)', () => {
  it('celebrates an accepted request', () => {
    expect(answerMessage({ name: 'Sofia', accept: true, result: { ok: true } }).text).toBe('You and Sofia are friends now! 🎉')
  })

  it('quietly confirms a denied request', () => {
    const m = answerMessage({ name: 'Sofia', accept: false, result: { ok: true } })
    expect(m.ok).toBe(true)
    expect(m.text).toBe('Request from Sofia removed.')
  })

  it('asks to try again when it failed', () => {
    expect(answerMessage({ name: 'Sofia', accept: true, error: new Error('offline') }).ok).toBe(false)
    expect(answerMessage({ name: 'Sofia', accept: true, result: { ok: false, reason: 'no_request' } }).ok).toBe(false)
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

describe('withTitles', () => {
  const players = [
    { name: 'Marta', hoodCounts: { Belém: 4, Ajuda: 1 } },
    { name: 'João', hoodCounts: { Belém: 2, Arroios: 3, Ajuda: 1 } },
    { name: 'Ana', hoodCounts: {} },
  ]
  const byName = (list) => Object.fromEntries(list.map((p) => [p.name, p]))

  it('gives a title to whoever has the most spots in a neighbourhood', () => {
    const p = byName(withTitles(players))
    expect(p.Marta.titles).toEqual(['Belém'])
    expect(p.João.titles).toEqual(['Arroios'])
  })

  it('puts the strongest title first', () => {
    const p = byName(withTitles([{ name: 'A', hoodCounts: { Ajuda: 1, Belém: 5 } }]))
    expect(p.A.titles).toEqual(['Belém', 'Ajuda'])
  })

  it('gives nobody the title when two players are tied', () => {
    const p = byName(withTitles(players))
    expect(p.Marta.titles).not.toContain('Ajuda')
    expect(p.João.titles).not.toContain('Ajuda')
  })

  it('counts how many neighbourhoods each player explored', () => {
    const p = byName(withTitles(players))
    expect(p.Marta.neighbourhoods).toBe(2)
    expect(p.João.neighbourhoods).toBe(3)
    expect(p.Ana.neighbourhoods).toBe(0)
    expect(p.Ana.titles).toEqual([])
  })

  it('works when a player has no neighbourhood data', () => {
    expect(withTitles([{ name: 'X' }])[0]).toMatchObject({ neighbourhoods: 0, titles: [] })
  })
})

describe('titleLine', () => {
  it('shows only the strongest title, so at most one crown', () => {
    expect(titleLine([])).toBe('')
    expect(titleLine(['Belém'])).toBe('👑 Ruler of Belém')
    expect(titleLine(['Belém', 'Ajuda', 'Estrela'])).toBe('👑 Ruler of Belém')
  })
})

describe('moreWaiting (under the friend request card)', () => {
  it('says nothing when this is the only request', () => {
    expect(moreWaiting(0)).toBe('')
  })

  it('uses singular and plural', () => {
    expect(moreWaiting(1)).toBe('1 more request waiting')
    expect(moreWaiting(3)).toBe('3 more requests waiting')
  })
})
