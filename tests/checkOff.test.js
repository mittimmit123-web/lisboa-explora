// The rule this file protects: a check-off is NEVER refused because of
// distance. Being close only earns the "verified on site" mark.
// See DECISIONS.md, decisions 1 and 2.
//
// These tests run the demo-mode path of checkOff. The real path asks the
// server, which decides the mark itself (supabase/schema.sql), and that part
// cannot be tested from here.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// No keys -> demo mode, exactly as when there is no .env file.
vi.mock('../src/lib/supabase.js', () => ({ supabase: null, isDemoMode: true }))

// The tests run in Node, which has no localStorage. Demo mode keeps the
// check-offs there, so we hand it a small stand-in.
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
}

const { checkOff } = await import('../src/lib/api.js')

const santaLuzia = { id: 'santa-luzia', name: 'Miradouro de Santa Luzia', lat: 38.7118, lng: -9.1301 }
const photo = { name: 'photo.jpg', type: 'image/jpeg' }

beforeEach(() => store.clear())

describe('checkOff in demo mode', () => {
  it('accepts a player standing far away, without the mark', async () => {
    const faraway = { lat: 38.7118, lng: -9.1531 } // about 2 km west
    const result = await checkOff({ spot: santaLuzia, position: faraway, photo })

    expect(result.ok).toBe(true)
    expect(result.verified).toBe(false)
    expect(result.distance).toBeGreaterThan(1000)
  })

  it('gives the mark to a player standing at the spot', async () => {
    const near = { lat: 38.71183, lng: -9.1301 } // about 3 m away
    const result = await checkOff({ spot: santaLuzia, position: near, photo })

    expect(result.ok).toBe(true)
    expect(result.verified).toBe(true)
  })

  it('accepts a check-off with no GPS position at all', async () => {
    const result = await checkOff({ spot: santaLuzia, position: null, photo })

    expect(result.ok).toBe(true)
    expect(result.verified).toBe(false)
    expect(result.distance).toBeNull()
  })

  it('refuses the same spot twice', async () => {
    const first = await checkOff({ spot: santaLuzia, position: null, photo })
    const second = await checkOff({ spot: santaLuzia, position: null, photo })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)
    expect(second.reason).toBe('already_collected')
  })

  it('remembers the mark that was earned', async () => {
    const near = { lat: 38.71183, lng: -9.1301 }
    await checkOff({ spot: santaLuzia, position: near, photo })

    const saved = JSON.parse(localStorage.getItem('lisboa-explora-demo-checkoffs'))
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ spot_id: 'santa-luzia', verified: true })
  })
})
