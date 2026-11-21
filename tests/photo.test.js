import { describe, expect, it } from 'vitest'
import { fitWithin, isPhotoTooBig } from '../src/lib/photo.js'

describe('fitWithin', () => {
  it('shrinks a big landscape photo to 1600 px wide', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
  })

  it('shrinks a big portrait photo to 1600 px high', () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })

  it('keeps a small photo as it is', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('keeps a photo that is exactly the max size', () => {
    expect(fitWithin(1600, 900)).toEqual({ width: 1600, height: 900 })
  })
})


describe('isPhotoTooBig', () => {
  const MB = 1024 * 1024

  it('accepts a photo under 5 MB', () => {
    expect(isPhotoTooBig({ size: 4.9 * MB })).toBe(false)
  })

  it('accepts a photo of exactly 5 MB', () => {
    expect(isPhotoTooBig({ size: 5 * MB })).toBe(false)
  })

  it('rejects a photo over 5 MB', () => {
    expect(isPhotoTooBig({ size: 5.1 * MB })).toBe(true)
  })
})
