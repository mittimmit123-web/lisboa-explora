// The 3D scene of the intro (issue #33): one Explora with a face that shows
// feelings. Used by src/components/IntroScreen.jsx; timelines in src/lib/intro.js.
//
// How the face works: every Explora gets the same face parts (eyes, pupils,
// eyebrows, mouth, cheeks), placed to fit its body. Each feeling is a list of
// numbers (FACES), e.g. "eyes closed: 1, mouth open: 1, blush: 1" for joy.
// Between two feelings the numbers are blended, so the face changes smoothly.
//
// Two clocks: `t` is the story clock (it waits at the question), `live` keeps
// running, so the Explora blinks, sways and talks even while it waits.
import { HELLO_END, PROLOGUE_JOY } from './intro.js'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const FACES = {
  happy: { closed: 0, smile: 1, open: 0, pupil: 1, browY: 0, browTilt: 0, blush: 0.6, lookY: 0 },
  joy: { closed: 1, smile: 0, open: 1, pupil: 1, browY: 0.08, browTilt: 0, blush: 1, lookY: 0 },
  shy: { closed: 0, smile: 0.3, open: 0, pupil: 0.75, browY: -0.02, browTilt: 0.35, blush: 1, lookY: -0.05 },
  hope: { closed: 0, smile: 0.6, open: 0.25, pupil: 1.25, browY: 0.1, browTilt: 0.2, blush: 0.8, lookY: 0.03 },
}
const lerp = (a, b, k) => a + (b - a) * k
const mixFaces = (A, B, k) => Object.fromEntries(Object.keys(A).map((key) => [key, lerp(A[key], B[key], k)]))
const clamp = (v) => Math.max(0, Math.min(1, v))
const ease = (k) => k * k * (3 - 2 * k)

const mat = (c, r = 0.4, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })
const add = (geo, material, x, y, z, parent) => {
  const o = new THREE.Mesh(geo, material)
  o.position.set(x, y, z)
  o.castShadow = true
  parent.add(o)
  return o
}

// ---------- the face, shared by all Exploras ----------
// opts: eyes [{x,y,z,turn}], eyeR, brows [{x,y,z}], mouth {x,y,z,r}, cheeks [{x,y,z}]
function makeFace(parent, opts) {
  const navy = mat('#2b2340', 0.35), white = mat('#ffffff', 0.15)
  const blush = new THREE.MeshStandardMaterial({ color: '#ff8fa3', roughness: 0.6, transparent: true, opacity: 0.6 })
  const r = opts.eyeR
  const eyes = opts.eyes.map(({ x, y, z, turn = 0 }) => {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    g.rotation.y = turn
    parent.add(g)
    const ball = add(new THREE.SphereGeometry(r, 32, 16), white, 0, 0, 0, g)
    const pupil = add(new THREE.SphereGeometry(r * 0.56, 32, 16), navy, 0, 0, r * 0.48, g)
    const shine = add(new THREE.SphereGeometry(r * 0.18, 12, 8), white, -r * 0.2, r * 0.24, r * 0.96, g)
    const arc = add(new THREE.TorusGeometry(r * 0.6, r * 0.16, 10, 24, Math.PI), navy, 0, -r * 0.16, r * 0.4, g) // closed happy eye (^)
    return { ball, pupil, shine, arc }
  })
  const brows = opts.brows.map(({ x, y, z }) => {
    const b = add(new THREE.CapsuleGeometry(r * 0.14, r * 0.9, 4, 8), navy, x, y, z, parent)
    b.rotation.z = Math.PI / 2
    b.userData.y = y
    return b
  })
  const m = opts.mouth
  const smile = add(new THREE.TorusGeometry(m.r, m.r * 0.24, 10, 24, Math.PI), navy, m.x, m.y + m.r * 0.3, m.z, parent)
  smile.rotation.z = Math.PI
  const mouth = add(new THREE.SphereGeometry(m.r, 24, 16), navy, m.x, m.y, m.z - m.r * 0.1, parent)
  const tongue = add(new THREE.SphereGeometry(m.r * 0.53, 16, 8), mat('#ff7a8a', 0.5), m.x, m.y - m.r * 0.35, m.z + m.r * 0.3, parent)
  const cheeks = opts.cheeks.map(({ x, y, z }) => {
    const c = add(new THREE.SphereGeometry(r * 0.48, 16, 8), blush, x, y, z, parent)
    c.scale.z = 0.3
    return c
  })

  return function show(f, live, talking) {
    const blink = live % 2.7 < 0.12 && f.closed < 0.5 ? 1 : 0
    const open = clamp(f.open + (talking ? Math.abs(Math.sin(live * 14)) * 0.7 : 0))
    for (const e of eyes) {
      const openEye = (1 - f.closed) * (1 - blink)
      e.ball.scale.set(1, Math.max(0.06, openEye), 0.55)
      e.pupil.visible = e.shine.visible = openEye > 0.3
      e.pupil.scale.setScalar(f.pupil)
      e.pupil.position.y = f.lookY * (r / 0.25)
      e.arc.visible = f.closed > 0.5
    }
    brows.forEach((b, i) => {
      b.position.y = b.userData.y + f.browY * (r / 0.25)
      b.rotation.z = Math.PI / 2 + (i ? -1 : 1) * f.browTilt
    })
    smile.visible = open < 0.2
    smile.scale.setScalar(0.6 + f.smile * 0.6)
    mouth.visible = tongue.visible = open >= 0.2
    mouth.scale.set(1, Math.max(0.2, open) * 0.9, 0.4)
    cheeks.forEach((c) => (c.material.opacity = 0.25 + f.blush * 0.55))
  }
}

// ---------- the three Exploras ----------
// Each returns { root, body, size, showFace, arms?, wheels?, bell?, pole?, update(live, energy) }
function buildTram() {
  const yellow = mat('#ffc93c', 0.35), cream = mat('#fff7e6'), glass = mat('#e4f0ff', 0.2), navy = mat('#2b2340', 0.35), grey = mat('#7b8494')
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  add(new RoundedBoxGeometry(2.4, 2.2, 2.6, 6, 0.5), yellow, 0, 1.55, 0, body)
  add(new RoundedBoxGeometry(2.46, 0.34, 2.66, 4, 0.16), cream, 0, 1.0, 0, body)
  add(new RoundedBoxGeometry(2.0, 0.28, 2.2, 4, 0.13), cream, 0, 2.74, 0, body)
  for (const s of [-1, 1]) for (const z of [-0.6, 0.4]) add(new RoundedBoxGeometry(0.06, 0.7, 0.6, 2, 0.03), glass, s * 1.2, 1.8, z, body)
  const pole = new THREE.Group()
  pole.position.set(0, 2.85, -0.3)
  body.add(pole)
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 12), navy, 0, 0.5, 0, pole).rotation.x = -0.45
  const bell = add(new THREE.SphereGeometry(0.17, 24, 12), yellow, 0, 1.0, 0.25, pole)
  const wheels = []
  for (const x of [-1.0, 1.0]) for (const z of [-0.8, 0.8]) {
    const w = add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 32), navy, x, 0.38, z, root)
    w.rotation.z = Math.PI / 2
    add(new THREE.BoxGeometry(0.5, 0.27, 0.1), grey, 0, 0, 0, w) // a spoke, so you see the wheel turn
    wheels.push(w)
  }
  const face = new THREE.Group()
  face.position.set(0, 1.85, 1.32)
  body.add(face)
  add(new RoundedBoxGeometry(1.86, 1.02, 0.1, 4, 0.05), glass, 0, 0, 0, face)
  const showFace = makeFace(face, {
    eyeR: 0.25,
    eyes: [{ x: -0.43, y: 0.06, z: 0.08 }, { x: 0.43, y: 0.06, z: 0.08 }],
    brows: [{ x: -0.43, y: 0.4, z: 0.1 }, { x: 0.43, y: 0.4, z: 0.1 }],
    mouth: { x: 0, y: -0.25, z: 0.08, r: 0.17 },
    cheeks: [{ x: -0.74, y: -0.17, z: 0.06 }, { x: 0.74, y: -0.17, z: 0.06 }],
  })
  const arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group()
    shoulder.position.set(s * 1.22, 1.55, 0.3)
    body.add(shoulder)
    add(new THREE.CapsuleGeometry(0.08, 0.55, 4, 8), navy, 0, -0.35, 0, shoulder)
    add(new THREE.SphereGeometry(0.16, 16, 12), yellow, 0, -0.72, 0, shoulder)
    return { shoulder, s }
  })
  return { root, body, size: 1.15, showFace, arms, wheels, bell, pole, update() {} }
}

function buildSardine() {
  const silver = mat('#8fb3dc', 0.25, 0.35), belly = mat('#eef4fb', 0.3, 0.2), stripe = mat('#1e4d8c', 0.3, 0.2),
    fin = mat('#5b87c4', 0.35, 0.2), red = mat('#e11d48', 0.4), gold = mat('#f2b33d', 0.3), green = mat('#16a34a', 0.4)
  const root = new THREE.Group()
  const body = new THREE.Group()
  body.position.y = 1.9
  root.add(body)
  add(new THREE.SphereGeometry(1, 48, 32), silver, 0, 0, 0, body).scale.set(0.85, 0.95, 1.6)
  add(new THREE.SphereGeometry(1, 48, 32), belly, 0, -0.22, 0.08, body).scale.set(0.78, 0.72, 1.45)
  add(new THREE.SphereGeometry(1, 48, 32), stripe, 0, 0.32, -0.05, body).scale.set(0.6, 0.66, 1.45)
  const tail = new THREE.Group()
  tail.position.set(0, 0, -1.45)
  body.add(tail)
  for (const s of [1, -1]) {
    const t = add(new THREE.ConeGeometry(0.42, 0.95, 24), fin, 0, s * 0.32, -0.42, tail)
    t.rotation.x = -Math.PI / 2 + s * 0.6
    t.scale.set(1, 1, 0.25)
  }
  const top = add(new THREE.ConeGeometry(0.35, 0.7, 24), fin, 0, 0.98, -0.2, body)
  top.rotation.x = -0.5
  top.scale.set(0.25, 1, 1)
  const fins = [1, -1].map((s) => {
    const f = add(new THREE.ConeGeometry(0.22, 0.6, 20), fin, s * 0.8, -0.35, 0.35, body)
    f.rotation.set(0.9, 0, s * 1.1)
    f.scale.set(1, 1, 0.3)
    return f
  })
  const hat = new THREE.Group()
  hat.position.set(0, 0.95, 0.5)
  hat.rotation.x = 0.25
  body.add(hat)
  add(new THREE.ConeGeometry(0.32, 0.75, 32), red, 0, 0.35, 0, hat)
  add(new THREE.TorusGeometry(0.31, 0.05, 12, 32), gold, 0, 0, 0, hat).rotation.x = Math.PI / 2
  add(new THREE.SphereGeometry(0.11, 16, 8), gold, 0, 0.76, 0, hat)
  add(new THREE.SphereGeometry(0.06, 12, 8), green, 0.14, 0.4, 0.22, hat)
  const showFace = makeFace(body, {
    eyeR: 0.27,
    eyes: [{ x: -0.4, y: 0.2, z: 1.2, turn: -0.35 }, { x: 0.4, y: 0.2, z: 1.2, turn: 0.35 }],
    brows: [{ x: -0.42, y: 0.52, z: 1.18 }, { x: 0.42, y: 0.52, z: 1.18 }],
    mouth: { x: 0, y: -0.2, z: 1.52, r: 0.14 },
    cheeks: [{ x: -0.62, y: -0.18, z: 1.0 }, { x: 0.62, y: -0.18, z: 1.0 }],
  })
  return {
    root, body, size: 1.15, showFace,
    update(live, energy) { // the more excited, the faster the tail and fins
      body.position.y = 1.9 + Math.sin(live * 2.5) * 0.12
      tail.rotation.y = Math.sin(live * (8 + energy * 10)) * (0.45 + energy * 0.2)
      fins.forEach((f, i) => (f.rotation.y = Math.sin(live * (6 + energy * 8) + i * Math.PI) * 0.4))
    },
  }
}

function buildCat() {
  const orange = mat('#f59e42', 0.5), dark = mat('#c96a12', 0.5), cream = mat('#fff4e6', 0.5), inner = mat('#fbb6c4', 0.5),
    nose = mat('#f472b6', 0.4), scarf = mat('#2563eb', 0.45), navy = mat('#2b2340', 0.35)
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  add(new THREE.SphereGeometry(1, 48, 32), orange, 0, 1.05, 0, body).scale.set(1, 1, 0.95)
  add(new THREE.SphereGeometry(1, 48, 32), cream, 0, 1.0, 0.32, body).scale.set(0.68, 0.78, 0.7)
  for (const x of [-0.4, 0.4]) add(new THREE.SphereGeometry(0.26, 24, 16), cream, x, 0.2, 0.75, body).scale.set(1, 0.7, 1.3)
  for (const x of [-0.75, 0.75]) add(new THREE.SphereGeometry(0.34, 24, 16), orange, x, 0.28, 0.1, body).scale.set(0.9, 0.7, 1.4)
  let tail = null
  const tipPos = new THREE.Vector3()
  const tip = add(new THREE.SphereGeometry(0.15, 16, 8), dark, 0, 0, 0, body)
  function makeTail(sw) {
    const pts = [[0, 0.45, -0.85], [0.25 * sw, 0.55, -1.35], [0.6 * sw, 1.2, -1.45], [0.75 * sw, 1.85, -1.15], [0.55 * sw, 2.15, -0.85]]
      .map((p) => new THREE.Vector3(...p))
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.14, 16, false)
    if (tail) {
      tail.geometry.dispose()
      tail.geometry = geo
    } else tail = add(geo, orange, 0, 0, 0, body)
    tipPos.copy(pts[4])
  }
  makeTail(1)
  add(new THREE.TorusGeometry(0.7, 0.17, 16, 48), scarf, 0, 1.85, 0.05, body).rotation.x = Math.PI / 2 - 0.15
  add(new THREE.BoxGeometry(0.3, 0.6, 0.12), scarf, 0.45, 1.5, 0.65, body).rotation.set(0.25, 0, -0.25)
  const head = new THREE.Group()
  head.position.set(0, 2.65, 0.1)
  body.add(head)
  add(new THREE.SphereGeometry(1, 48, 32), orange, 0, 0, 0, head).scale.set(1, 0.88, 0.9)
  for (const [x, rz] of [[-0.2, 0.25], [0, 0], [0.2, -0.25]]) add(new THREE.CapsuleGeometry(0.05, 0.28, 4, 8), dark, x, 0.62, 0.55, head).rotation.set(0.6, 0, rz)
  add(new THREE.SphereGeometry(0.42, 32, 16), cream, 0, -0.3, 0.7, head).scale.set(1.1, 0.75, 0.6)
  add(new THREE.SphereGeometry(0.09, 16, 8), nose, 0, -0.14, 0.98, head).scale.set(1.3, 0.8, 0.8)
  for (const s of [-1, 1]) for (const y of [-0.2, -0.3]) {
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), navy, s * 0.62, y, 0.75, head).rotation.z = Math.PI / 2 + s * (y + 0.25) * 1.5
  }
  const ears = [-1, 1].map((s) => {
    const ear = new THREE.Group()
    ear.position.set(s * 0.52, 0.65, 0.05)
    ear.rotation.z = -s * 0.35
    head.add(ear)
    add(new THREE.ConeGeometry(0.34, 0.6, 24), orange, 0, 0.25, 0, ear).scale.z = 0.55
    add(new THREE.ConeGeometry(0.2, 0.4, 24), inner, 0, 0.2, 0.1, ear).scale.z = 0.3
    return ear
  })
  const showFace = makeFace(head, {
    eyeR: 0.22,
    eyes: [{ x: -0.36, y: 0.12, z: 0.72, turn: -0.25 }, { x: 0.36, y: 0.12, z: 0.72, turn: 0.25 }],
    brows: [{ x: -0.36, y: 0.4, z: 0.74 }, { x: 0.36, y: 0.4, z: 0.74 }],
    mouth: { x: 0, y: -0.34, z: 0.93, r: 0.1 },
    cheeks: [{ x: -0.62, y: -0.18, z: 0.62 }, { x: 0.62, y: -0.18, z: 0.62 }],
  })
  return {
    root, body, size: 1.0, showFace,
    update(live, energy) { // excited cats swish their tail faster and perk up their ears
      makeTail(Math.sin(live * (3 + energy * 5)))
      tip.position.copy(tipPos)
      head.rotation.z = Math.sin(live * 1.5) * 0.12
      ears.forEach((e, i) => (e.rotation.x = energy > 0.5 ? -0.25 : live % 2.6 < 0.15 && i ? -0.35 : 0))
    },
  }
}

const BUILDERS = { tram: buildTram, sardine: buildSardine, cat: buildCat }

// ---------- the scene ----------
export function createIntroScene(canvas, { actorId = 'tram' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 0.5, 0.1, 100)
  scene.add(new THREE.HemisphereLight('#ffffff', '#ffd2b0', 1.7))
  const sun = new THREE.DirectionalLight('#fff3e0', 2.4)
  sun.position.set(-4, 8, 7)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.normalBias = 0.03
  scene.add(sun)
  // an invisible floor that only shows the Explora's shadow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const actor = (BUILDERS[actorId] ?? buildTram)()
  scene.add(actor.root)

  // confetti for happy moments
  const confetti = Array.from({ length: 14 }, (_, i) => {
    const m = add(new THREE.OctahedronGeometry(0.12), mat(['#ffc93c', '#ff7a59', '#3ccf6e', '#2f7de1', '#ffffff'][i % 5], 0.3), 0, 0, 0, scene)
    m.userData = { a: (i / 14) * Math.PI * 2, r: 1.8 + (i % 3) * 0.5, h: 1.5 + (i % 4) * 0.6 }
    m.visible = false
    return m
  })

  function resize() {
    const w = canvas.clientWidth || 360
    const h = canvas.clientHeight || 720
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const dist = Math.max(22, 11 / camera.aspect) // on wide screens step back
    camera.position.set(1.4, 3.6, dist)
    camera.lookAt(0, 3.6, 0)
    camera.updateProjectionMatrix()
  }

  // Put the pose on the Explora and draw one picture.
  function pose(p, live) {
    const a = actor
    a.root.position.set(p.x, p.hop, 0)
    a.root.scale.setScalar(p.scale * a.size)
    a.root.rotation.set(p.lean, p.turn, 0)
    a.body.scale.set(1 + p.squash, 1 - p.squash, 1 + p.squash)
    a.wheels?.forEach((w) => (w.rotation.x = p.wheel))
    a.arms?.forEach(({ shoulder, s }) => (shoulder.rotation.z = s * (0.25 + p.armUp * 2.3 + (p.armUp > 0.5 ? s * p.wave : 0))))
    if (a.pole) a.pole.rotation.z = p.ring * 0.3
    if (a.bell) a.bell.position.x = p.ring * 0.1
    a.update(live, p.energy)
    a.showFace(p.face, live, p.talking)
    confetti.forEach((m, i) => {
      m.visible = p.party
      const ang = m.userData.a + live * 1.2
      const sc = p.scale * a.size
      m.position.set(p.x + Math.cos(ang) * m.userData.r * sc, m.userData.h * sc + Math.sin(live * 3 + i) * 0.2, Math.sin(ang) * m.userData.r * 0.6)
      m.rotation.set(live * 3 + i, live * 2, 0)
    })
    renderer.render(scene, camera)
  }
  const base = () => ({ x: 0, scale: 1, hop: 0, squash: 0, turn: -0.25, lean: 0, armUp: 0, wave: 0, ring: 0, wheel: 0,
    face: FACES.happy, talking: false, party: false, energy: 0 })

  // Welcome film (Trammy): roll in, land, cheer.
  function drawWelcome(t, live) {
    const p = base()
    p.wheel = -Math.min(t, 1.3) * 12
    if (t < 1.3) { // roll in from far away, small -> big
      const k = ease(clamp(t / 1.3))
      p.x = lerp(-9, 0, k)
      p.scale = lerp(0.25, 1, k)
      p.hop = Math.abs(Math.sin(live * 9)) * 0.12
    } else if (t < 1.7) { // land with a little squash
      p.squash = Math.sin(((t - 1.3) / 0.4) * Math.PI) * 0.18
    } else { // cheer!
      p.face = FACES.joy
      p.armUp = 1
      p.wave = Math.sin(live * 10) * 0.35
      p.hop = Math.abs(Math.sin(live * 6)) * 0.35
      p.ring = t > 2.1 && t < 3.0 ? Math.sin(live * 40) * 0.4 : 0
      p.party = t < 4.4
      p.energy = 1
    }
    pose(p, live)
  }

  // Prologue (the chosen Explora): pop in, shy hello, hopeful question, joy.
  function drawPrologue(t, live) {
    const p = base()
    p.scale = 1.15
    if (t < 0.8) { // pop in: grow from small with a little overshoot
      const k = clamp(t / 0.8)
      p.scale = 1.15 * (k < 0.7 ? ease(k / 0.7) * 1.12 : lerp(1.12, 1, (k - 0.7) / 0.3))
    } else if (t < HELLO_END) { // shy: looks around while talking
      const k = ease(clamp((t - 0.8) / 0.4))
      p.face = mixFaces(FACES.happy, FACES.shy, k)
      p.talking = t > 1.0 && t < HELLO_END - 1
      p.turn = -0.25 + Math.sin(live * 1.6) * 0.35
    } else if (t < PROLOGUE_JOY) { // hopeful: leans in and asks
      const k = ease(clamp((t - HELLO_END) / 0.4))
      p.face = mixFaces(FACES.shy, FACES.hope, k)
      p.talking = t > HELLO_END + 0.2 && t < HELLO_END + 1
      p.lean = k * 0.18 + Math.sin(live * 2) * 0.02
      p.turn = lerp(-0.25, -0.1, k)
      p.armUp = k * 0.35
    } else { // "Yes!" -> jump for joy
      const k = clamp((t - PROLOGUE_JOY) / 0.3)
      p.face = mixFaces(FACES.hope, FACES.joy, k)
      p.armUp = 1
      p.wave = Math.sin(live * 12) * 0.4
      p.hop = Math.abs(Math.sin((t - PROLOGUE_JOY) * 7)) * 0.6
      p.talking = t > PROLOGUE_JOY + 0.4 && t < PROLOGUE_JOY + 1.4
      p.turn = -0.1
      p.party = true
      p.energy = 1
    }
    pose(p, live)
  }

  function dispose() {
    scene.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    renderer.dispose()
  }

  return { drawWelcome, drawPrologue, resize, dispose }
}
