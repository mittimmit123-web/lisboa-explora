import { describe, expect, it } from 'vitest'
import { PIN_ANCHOR, PIN_SIZE, fitScale } from '../src/lib/exploraPin.js'

describe('fitScale', () => {
  it('makes the widest side the target size', () => {
    expect(fitScale(2, 4, 3.3)).toBeCloseTo(3.3 / 4)
    expect(fitScale(5, 1, 3.3)).toBeCloseTo(3.3 / 5)
  })

  it('gives every Explora the same size, small or big', () => {
    const small = 1.5 * fitScale(1.5, 1.2)
    const big = 4 * fitScale(4, 3)
    expect(small).toBeCloseTo(big)
  })

  it('does not break on an empty model', () => {
    expect(fitScale(0, 0)).toBe(1)
  })
})

describe('pin size', () => {
  it('puts the anchor (the player position) inside the picture, near the bottom middle', () => {
    const [w, h] = PIN_SIZE
    const [x, y] = PIN_ANCHOR
    expect(x).toBe(w / 2)
    expect(y).toBeGreaterThan(h * 0.8)
    expect(y).toBeLessThanOrEqual(h)
  })
})
