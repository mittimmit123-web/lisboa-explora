import { describe, expect, it } from 'vitest'
import { FACTS } from '../src/data/facts.js'
import { NEIGHBOURHOODS } from '../src/data/neighbourhoods.js'

describe('neighbourhood facts', () => {
  it('has one fact for every neighbourhood, and no extra ones', () => {
    expect(Object.keys(FACTS).sort()).toEqual([...NEIGHBOURHOODS].sort())
  })

  it('keeps every fact short enough for a postcard', () => {
    for (const fact of Object.values(FACTS)) {
      expect(fact.length).toBeGreaterThan(20)
      expect(fact.length).toBeLessThanOrEqual(160)
    }
  })
})
