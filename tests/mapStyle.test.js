import { describe, expect, it } from 'vitest'
import { MAP_COLORS, mapStyle } from '../src/lib/mapStyle.js'

describe('mapStyle', () => {
  const style = mapStyle()
  const layer = (id) => style.layers.find((l) => l.id === id)

  it('uses the free OpenFreeMap data', () => {
    expect(style.sources.openfreemap.url).toBe('https://tiles.openfreemap.org/planet')
  })

  it('paints background, parks, water and roads in our colours', () => {
    expect(layer('background').paint['background-color']).toBe(MAP_COLORS.background)
    expect(layer('parks').paint['fill-color']).toBe(MAP_COLORS.park)
    expect(layer('water').paint['fill-color']).toBe(MAP_COLORS.water)
    expect(layer('main-roads').paint['line-color']).toBe(MAP_COLORS.road)
  })

  it('draws the background first and the names last (on top)', () => {
    expect(style.layers[0].id).toBe('background')
    expect(style.layers.at(-1).type).toBe('symbol')
  })
})
