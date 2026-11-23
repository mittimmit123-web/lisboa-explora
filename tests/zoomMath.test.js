import { describe, expect, it } from 'vitest'
import { END_AFTER_MS, GLIDE, ZOOM_PER_PIXEL, addScroll, glideStep, zoomIsOver } from '../src/lib/zoomMath.js'

const MIN = 0
const MAX = 19

describe('addScroll', () => {
  it('zooms in when scrolling up and out when scrolling down', () => {
    expect(addScroll(12, 25, MIN, MAX)).toBeCloseTo(13) // 25 px = one zoom level
    expect(addScroll(12, -25, MIN, MAX)).toBeCloseTo(11)
  })

  it('adds up many small trackpad events', () => {
    let goal = 12
    for (let i = 0; i < 10; i++) goal = addScroll(goal, 5, MIN, MAX)
    expect(goal).toBeCloseTo(12 + 50 * ZOOM_PER_PIXEL)
  })

  it('never goes past the largest zoom', () => {
    expect(addScroll(18.9, 1000, MIN, MAX)).toBe(MAX)
  })

  it('never goes below the smallest zoom', () => {
    expect(addScroll(0.5, -1000, MIN, MAX)).toBe(MIN)
  })

  it('does nothing for a scroll of 0 pixels', () => {
    expect(addScroll(12, 0, MIN, MAX)).toBe(12)
  })
})

describe('glideStep', () => {
  it('moves 30 % of the remaining way per frame', () => {
    expect(glideStep(12, 13)).toBeCloseTo(12 + GLIDE)
    expect(glideStep(13, 12)).toBeCloseTo(13 - GLIDE) // zooming out too
  })

  it('jumps onto the goal when it is very close', () => {
    expect(glideStep(12.995, 13)).toBe(13)
  })

  it('stays put once the goal is reached', () => {
    expect(glideStep(13, 13)).toBe(13)
  })

  it('reaches the goal in a few frames and never overshoots', () => {
    let zoom = 12
    let frames = 0
    while (zoom !== 15 && frames < 100) {
      zoom = glideStep(zoom, 15)
      expect(zoom).toBeLessThanOrEqual(15)
      frames++
    }
    expect(zoom).toBe(15)
    expect(frames).toBeLessThan(20) // well under half a second at 60 frames per second
  })
})

describe('zoomIsOver', () => {
  it('is over at the goal after a pause in scrolling', () => {
    expect(zoomIsOver(13, 13, END_AFTER_MS + 1)).toBe(true)
  })

  it('waits at the goal while more scrolling may follow', () => {
    expect(zoomIsOver(13, 13, END_AFTER_MS - 1)).toBe(false)
  })

  it('is never over before the goal is reached', () => {
    expect(zoomIsOver(12.5, 13, 10_000)).toBe(false)
  })
})
