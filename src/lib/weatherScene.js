// The animated Lisbon weather scene on the Friends screen.
// Plain canvas drawing, no library. Used by src/components/WeatherScene.jsx.
//
// How it works:
// - The scene is drawn in layers like a stage set: sky, sun, rainbow,
//   clouds, birds, castle hill, houses, street, tram, leaves, light dust,
//   rain and a colour filter on top.
// - Each mood is a list of "dials" (how much sun, clouds, rain, wind, ...).
//   When the mood changes, every dial turns a little each frame towards its
//   new value, so the weather melts into the next mood instead of jumping.
// - We draw in a fixed "virtual" size of 360 x 280 and scale it to the canvas.

const W = 360
const H = 280
const HORIZON = H * 0.5
const STREET = H * 0.82
const NIGHT = [30, 36, 54]

export const MOODS = {
  golden: { top: '#3a8ee6', bottom: '#ffd9a0', sun: 1, cloud: 0.12, grey: 0, dark: 0, rain: 0, rainbow: 0, wind: 0.25, birds: 1, motes: 1, leaves: 0, happy: 1 },
  clouds: { top: '#4f97dd', bottom: '#ffe6c2', sun: 0.85, cloud: 0.4, grey: 0.05, dark: 0.03, rain: 0, rainbow: 0, wind: 0.55, birds: 0.6, motes: 0.5, leaves: 0.2, happy: 0.8 },
  wind: { top: '#7d9dc2', bottom: '#f1dcc4', sun: 0.45, cloud: 0.7, grey: 0.25, dark: 0.12, rain: 0, rainbow: 0, wind: 1.3, birds: 0.15, motes: 0.15, leaves: 1, happy: 0.5 },
  drizzle: { top: '#56677e', bottom: '#aab6c3', sun: 0.12, cloud: 0.9, grey: 0.6, dark: 0.38, rain: 0.45, rainbow: 0.85, wind: 0.6, birds: 0, motes: 0, leaves: 0.2, happy: 0.3 },
  rain: { top: '#323f52', bottom: '#717f93', sun: 0, cloud: 1, grey: 0.85, dark: 0.62, rain: 1, rainbow: 0.35, wind: 0.45, birds: 0, motes: 0, leaves: 0, happy: 0.15 },
}
const DIALS = ['sun', 'cloud', 'grey', 'dark', 'rain', 'rainbow', 'wind', 'birds', 'motes', 'leaves', 'happy']

// ---------- small helpers ----------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toRgb = (c) => (typeof c === 'string' ? hex(c) : c)
const mix = (a, b, t) => { const A = toRgb(a), B = toRgb(b); return A.map((v, i) => v + (B[i] - v) * t) }
const rgb = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))

// A random generator with a fixed start, so the houses look the same every time.
function seeded(start) {
  let s = start
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

function buildScenery() {
  const rnd = seeded(7)
  const palette = ['#f6c85f', '#f4a3a8', '#9fc5e8', '#f7e3b5', '#b5d8a7', '#e8a87c', '#c9b6e4', '#fbe7a1']
  const houses = []
  for (let x = -10; x < W + 10;) {
    const w = 42 + rnd() * 24
    const h = 55 + rnd() * 45
    const cols = w > 56 ? 3 : 2
    const rows = Math.floor((h - 16) / 22)
    const wins = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) wins.push({ r, c, lit: rnd(), flick: rnd() * 10 })
    houses.push({ x, w, h, color: palette[Math.floor(rnd() * palette.length)], cols, wins, tiles: rnd() < 0.35, chimney: rnd() < 0.5 })
    x += w + 2
  }
  return {
    houses,
    clouds: Array.from({ length: 9 }, (_, i) => ({
      x: rnd() * W * 1.4 - 60, y: 26 + rnd() * 80, s: 0.6 + rnd() * 0.7, v: 6 + rnd() * 8, order: i,
      puffs: Array.from({ length: 6 }, () => [rnd() * 70 - 35, rnd() * 18 - 9, 16 + rnd() * 14]),
    })),
    drops: Array.from({ length: 220 }, () => ({ x: rnd() * W, y: rnd() * H, l: 8 + rnd() * 10, v: 380 + rnd() * 200 })),
    splashes: [],
    motes: Array.from({ length: 30 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.8 + rnd() * 1.6, v: 6 + rnd() * 10, p: rnd() * 6 })),
    leaves: Array.from({ length: 9 }, () => ({ x: rnd() * W, y: 100 + rnd() * 140, v: 60 + rnd() * 60, spin: rnd() * 6, c: rnd() < 0.5 ? '#d97706' : '#a16207' })),
    birds: Array.from({ length: 5 }, () => ({ x: rnd() * W, y: 40 + rnd() * 60, v: 18 + rnd() * 14, p: rnd() * 6 })),
    tramX: 40,
  }
}

// ---------- the scene ----------
export function createWeatherScene(canvas, { animate = true } = {}) {
  const ctx = canvas.getContext('2d')
  const scene = buildScenery()
  const now = { top: hex(MOODS.golden.top), bottom: hex(MOODS.golden.bottom) }
  DIALS.forEach((d) => (now[d] = MOODS.golden[d]))
  let target = MOODS.golden
  let frameId = null
  let last = null
  let time = 0

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth || W
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssW * (H / W) * dpr)
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)
    if (!frameId) draw(0)
  }

  // ----- layers -----
  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, STREET)
    g.addColorStop(0, rgb(now.top)); g.addColorStop(1, rgb(now.bottom))
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  }
  function sun() {
    if (now.sun < 0.02) return
    const x = W * 0.74, y = 62 + (1 - now.sun) * 30
    const glow = ctx.createRadialGradient(x, y, 8, x, y, 180)
    glow.addColorStop(0, `rgba(255,236,170,${0.75 * now.sun})`); glow.addColorStop(1, 'rgba(255,236,170,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
    ctx.save(); ctx.translate(x, y); ctx.rotate(time * 0.05)
    for (let i = 0; i < 14; i++) {
      ctx.rotate((Math.PI * 2) / 14)
      const rg = ctx.createLinearGradient(0, 0, 0, 200)
      rg.addColorStop(0, `rgba(255,240,190,${0.22 * now.sun})`); rg.addColorStop(1, 'rgba(255,240,190,0)')
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(-5, 16); ctx.lineTo(5, 16); ctx.lineTo(22, 200); ctx.lineTo(-22, 200); ctx.fill()
    }
    ctx.restore()
    ctx.fillStyle = `rgba(255,214,110,${now.sun})`; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill()
    ctx.fillStyle = `rgba(255,246,214,${now.sun})`; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill()
  }
  function rainbow() {
    if (now.rainbow < 0.02) return
    ctx.save(); ctx.globalAlpha = now.rainbow * 0.55; ctx.lineWidth = 6
    ;['#ef4444', '#f59e0b', '#fde047', '#22c55e', '#3b82f6', '#8b5cf6'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(W * 0.72, HORIZON + 30, 120 - i * 6, Math.PI, 0); ctx.stroke()
    })
    ctx.restore()
  }
  function clouds(dt) {
    const visible = now.cloud * scene.clouds.length
    const base = mix([255, 255, 255], [148, 158, 172], now.grey)
    for (const c of scene.clouds) {
      c.x += c.v * (0.4 + now.wind) * dt
      if (c.x > W + 80) c.x = -90
      const a = clamp(visible - c.order)
      if (a <= 0) continue
      for (const [dx, dy, r] of c.puffs) {
        const px = c.x + dx * c.s, py = c.y + dy * c.s, pr = r * c.s
        const g = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.2, px, py, pr)
        g.addColorStop(0, rgb(mix(base, [255, 255, 255], 0.35), a * 0.95))
        g.addColorStop(1, rgb(mix(base, NIGHT, 0.25), a * 0.85))
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill()
      }
    }
  }
  function birds(dt) {
    if (now.birds < 0.02) return
    ctx.strokeStyle = `rgba(40,48,66,${now.birds * 0.8})`; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
    for (const b of scene.birds) {
      b.x += b.v * dt; if (b.x > W + 20) b.x = -20
      const f = Math.sin(time * 5 + b.p) * 4, y = b.y + Math.sin(time * 0.8 + b.p) * 5
      ctx.beginPath(); ctx.moveTo(b.x - 8, y - f); ctx.quadraticCurveTo(b.x - 4, y - 3, b.x, y); ctx.quadraticCurveTo(b.x + 4, y - 3, b.x + 8, y - f); ctx.stroke()
    }
  }
  function hills() {
    const haze = mix(mix('#9db4cc', now.bottom, 0.45), NIGHT, now.dark * 0.8)
    ctx.fillStyle = rgb(haze)
    ctx.beginPath(); ctx.moveTo(0, HORIZON + 24)
    ctx.bezierCurveTo(W * 0.2, HORIZON - 16, W * 0.35, HORIZON - 24, W * 0.5, HORIZON - 20)
    ctx.bezierCurveTo(W * 0.7, HORIZON - 14, W * 0.85, HORIZON + 8, W, HORIZON + 4)
    ctx.lineTo(W, STREET); ctx.lineTo(0, STREET); ctx.fill()
    // Castelo de São Jorge on the hill
    const cx = W * 0.42, cy = HORIZON - 21
    ctx.fillStyle = rgb(mix(haze, NIGHT, 0.25))
    ctx.fillRect(cx - 40, cy - 15, 80, 17)
    for (const [dx, h] of [[-40, 26], [-10, 33], [19, 28], [35, 22]]) {
      ctx.fillRect(cx + dx, cy - h, 12, h)
      for (let k = 0; k < 3; k++) ctx.fillRect(cx + dx + k * 4.4, cy - h - 3.5, 2.6, 3.5)
    }
    for (let k = 0; k < 16; k++) ctx.fillRect(cx - 40 + k * 5, cy - 19, 2.6, 3.5)
    ctx.strokeStyle = rgb(mix(haze, NIGHT, 0.3)); ctx.lineWidth = 1.3
    ctx.beginPath(); ctx.moveTo(cx - 4, cy - 33); ctx.lineTo(cx - 4, cy - 47); ctx.stroke()
    ctx.fillStyle = `rgba(200,40,50,${1 - now.dark * 0.6})`
    const wave = Math.sin(time * (2 + now.wind * 4)) * 2
    ctx.beginPath(); ctx.moveTo(cx - 4, cy - 47); ctx.quadraticCurveTo(cx + 3, cy - 45 + wave, cx + 10, cy - 44); ctx.lineTo(cx - 4, cy - 40); ctx.fill()
  }
  function houses() {
    const shade = now.dark * 0.75
    for (const h of scene.houses) {
      const top = STREET - h.h
      ctx.fillStyle = rgb(mix(h.color, NIGHT, shade)); ctx.fillRect(h.x, top, h.w, h.h)
      if (h.tiles) {
        ctx.fillStyle = rgb(mix('#3b6fb6', NIGHT, shade), 0.35)
        for (let yy = top + 6; yy < STREET - 4; yy += 7) for (let xx = h.x + 3; xx < h.x + h.w - 3; xx += 7) ctx.fillRect(xx, yy, 2.6, 2.6)
      }
      ctx.fillStyle = rgb(mix('#b4532a', NIGHT, shade))
      ctx.beginPath(); ctx.moveTo(h.x - 3, top); ctx.lineTo(h.x + h.w / 2, top - 14); ctx.lineTo(h.x + h.w + 3, top); ctx.fill()
      if (h.chimney) ctx.fillRect(h.x + h.w * 0.7, top - 12, 5, 9)
      const ww = (h.w - 10) / h.cols - 5
      for (const w of h.wins) {
        const wx = h.x + 7 + w.c * (ww + 5), wy = top + 9 + w.r * 22
        if (wy + 12 > STREET - 5) continue
        const lit = clamp((now.dark * 1.8 - w.lit) * 4)
        const flick = 0.9 + Math.sin(time * 3 + w.flick) * 0.1
        ctx.fillStyle = rgb(mix(mix('#cfe3f5', NIGHT, shade), [255, 206, 120], lit * flick)); ctx.fillRect(wx, wy, ww, 11)
        if (lit > 0.1) { ctx.fillStyle = `rgba(255,190,100,${0.18 * lit})`; ctx.fillRect(wx - 3, wy - 3, ww + 6, 17) }
        ctx.fillStyle = rgb(mix('#ffffff', NIGHT, shade), 0.6); ctx.fillRect(wx, wy + 11, ww, 1.6)
      }
    }
  }
  function street() {
    ctx.fillStyle = rgb(mix('#e6dfd0', NIGHT, now.dark * 0.7)); ctx.fillRect(0, STREET, W, H - STREET)
    // calçada portuguesa: the black-and-white wave pattern
    ctx.strokeStyle = rgb(mix('#4b4f5c', NIGHT, now.dark * 0.5), 0.3); ctx.lineWidth = 2
    for (let row = 0; row < 3; row++) {
      ctx.beginPath()
      for (let x = 0; x <= W; x += 6) { const y = STREET + 12 + row * 15 + Math.sin(x / 24 + row) * 4; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
      ctx.stroke()
    }
    if (now.rain > 0.05) { // wet street reflects the lit windows
      for (const h of scene.houses) {
        ctx.fillStyle = `rgba(255,200,120,${0.12 * now.rain * now.dark * 2})`
        ctx.fillRect(h.x + h.w * 0.25, STREET + 2, h.w * 0.5, H - STREET)
      }
    }
  }
  function tram(dt) {
    scene.tramX += (28 + now.happy * 22) * dt
    if (scene.tramX > W + 90) scene.tramX = -90
    const hop = Math.abs(Math.sin(time * 6)) * 4 * now.happy
    ctx.save(); ctx.translate(scene.tramX, STREET + 6 - hop); ctx.scale(0.78, 0.78)
    if (now.dark > 0.1) { // headlight beam in the dark
      const beam = ctx.createRadialGradient(50, -22, 2, 70, -18, 70)
      beam.addColorStop(0, `rgba(255,236,170,${now.dark * 0.8})`); beam.addColorStop(1, 'rgba(255,236,170,0)')
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(46, -26); ctx.lineTo(140, -50); ctx.lineTo(140, 10); ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 6 + hop / 0.78, 46, 5, 0, 0, 7); ctx.fill()
    ctx.strokeStyle = '#14213d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(-20, -92); ctx.stroke()
    ctx.fillStyle = rgb(mix('#f5b82e', NIGHT, now.dark * 0.35)); ctx.beginPath(); ctx.roundRect(-46, -64, 92, 58, 14); ctx.fill()
    ctx.lineWidth = 3; ctx.stroke()
    ctx.fillStyle = rgb(mix('#fff7e6', NIGHT, now.dark * 0.3)); ctx.fillRect(-46, -22, 92, 7)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = rgb(mix('#cfe3f5', [255, 206, 120], now.dark)); ctx.beginPath(); ctx.roundRect(-40 + i * 20, -54, 15, 20, 3); ctx.fill() }
    ctx.fillStyle = rgb(mix('#dbeafe', [255, 226, 160], now.dark * 0.6)); ctx.beginPath(); ctx.roundRect(18, -56, 24, 30, 5); ctx.fill()
    ctx.fillStyle = '#14213d'; ctx.strokeStyle = '#14213d'
    if (now.happy > 0.7) { // happy closed eyes
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(25, -44, 3, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(36, -44, 3, Math.PI, 0); ctx.stroke()
    } else { // looking up hopefully
      const up = (1 - now.happy) * 3
      ctx.beginPath(); ctx.arc(25, -44 - up, 2.8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(36, -44 - up, 2.8, 0, 7); ctx.fill()
    }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(30.5, -37, 4 + now.happy * 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    ctx.fillStyle = now.dark > 0.1 ? '#fff4c2' : '#ffffff'; ctx.beginPath(); ctx.arc(41, -14, 4, 0, 7); ctx.fill()
    for (const wx of [-26, 26]) {
      ctx.fillStyle = '#14213d'; ctx.beginPath(); ctx.arc(wx, -4, 9, 0, 7); ctx.fill()
      ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2; const a = scene.tramX / 7
      ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 6, -4 + Math.sin(a) * 6); ctx.lineTo(wx - Math.cos(a) * 6, -4 - Math.sin(a) * 6); ctx.stroke()
    }
    ctx.restore()
  }
  function leaves(dt) {
    if (now.leaves < 0.02) return
    for (const l of scene.leaves) {
      l.x += l.v * now.wind * dt; l.y += Math.sin(time * 2 + l.spin) * 18 * dt
      if (l.x > W + 10) { l.x = -10; l.y = 100 + Math.random() * 140 }
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(time * 3 + l.spin); ctx.globalAlpha = now.leaves
      ctx.fillStyle = l.c; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, 7); ctx.fill(); ctx.restore()
    }
  }
  function motes(dt) {
    if (now.motes < 0.02) return
    for (const m of scene.motes) {
      m.y -= m.v * dt; m.x += Math.sin(time + m.p) * 6 * dt
      if (m.y < 0) { m.y = H; m.x = Math.random() * W }
      ctx.fillStyle = `rgba(255,230,160,${now.motes * (0.4 + 0.4 * Math.sin(time * 2 + m.p))})`
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill()
    }
  }
  function rain(dt) {
    if (now.rain < 0.02) { scene.splashes.length = 0; return }
    const n = Math.floor(scene.drops.length * now.rain), slant = 0.18 + now.wind * 0.15
    ctx.strokeStyle = `rgba(200,220,245,${0.35 + now.rain * 0.3})`; ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const d = scene.drops[i]
      d.y += d.v * dt; d.x += d.v * slant * dt
      if (d.y > STREET + 8 + (i % 5) * 8) {
        if (i % 3 === 0 && dt > 0) scene.splashes.push({ x: d.x, y: d.y, age: 0 })
        d.y = -20 - Math.random() * 60; d.x = Math.random() * (W + 80) - 80
      }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * slant, d.y - d.l)
    }
    ctx.stroke()
    ctx.strokeStyle = `rgba(220,232,250,${0.5 * now.rain})`
    for (let i = scene.splashes.length - 1; i >= 0; i--) {
      const s = scene.splashes[i]; s.age += dt
      if (s.age > 0.35) { scene.splashes.splice(i, 1); continue }
      ctx.globalAlpha = 1 - s.age / 0.35; ctx.beginPath(); ctx.ellipse(s.x, s.y, 2 + s.age * 16, 1 + s.age * 3.5, 0, 0, 7); ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  function filter() {
    if (now.dark > 0) { ctx.fillStyle = `rgba(40,52,72,${now.dark * 0.22})`; ctx.fillRect(0, 0, W, H) }
    if (now.sun > 0) { ctx.fillStyle = `rgba(255,190,90,${now.sun * 0.08})`; ctx.fillRect(0, 0, W, H) }
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85)
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(10,15,30,${0.12 + now.dark * 0.25})`)
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  }

  function draw(dt) {
    sky(); sun(); rainbow(); clouds(dt); birds(dt); hills(); houses()
    street(); tram(dt); leaves(dt); motes(dt); rain(dt); filter()
  }

  // Turn every dial a bit towards the target (about 2.5 s for a full change).
  function turnDials(k) {
    DIALS.forEach((d) => (now[d] += (target[d] - now[d]) * k))
    now.top = mix(now.top, target.top, k)
    now.bottom = mix(now.bottom, target.bottom, k)
  }

  function frame(ms) {
    const t = ms / 1000
    const dt = last === null ? 0 : clamp(t - last, 0, 0.1)
    last = t; time = t
    turnDials(1 - Math.pow(0.18, dt))
    draw(dt)
    frameId = requestAnimationFrame(frame)
  }

  return {
    setMood(name, { instant = false } = {}) {
      target = MOODS[name] ?? MOODS.golden
      if (instant || !animate) { turnDials(1); draw(0) }
    },
    start() {
      if (!animate || frameId) return
      last = null
      frameId = requestAnimationFrame(frame)
    },
    stop() {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = null
    },
    resize,
  }
}
