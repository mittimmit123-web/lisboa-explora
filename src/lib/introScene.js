// The 3D tram of the intro (issue #33), with a face that shows feelings.
// Used by src/components/IntroScreen.jsx. The timeline is in src/lib/intro.js.
//
// How the face works: it is built from a few 3D parts (eyes, pupils,
// eyebrows, mouth, cheeks). Each feeling is a list of numbers (FACES below),
// e.g. "eyes closed: 1, mouth open: 1, blush: 1" for joy. Between two
// feelings the numbers are blended, so the face changes smoothly.
//
// Two clocks: `t` is the story clock (it stops at the question), `live` keeps
// running, so the tram blinks, sways and talks even while it waits.
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

export function createIntroScene(canvas) {
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
  // an invisible floor that only shows the tram's shadow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const mat = (c, r = 0.4) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.05 })
  const yellow = mat('#ffc93c', 0.35), cream = mat('#fff7e6'), glass = mat('#e4f0ff', 0.2), navy = mat('#2b2340', 0.35), white = mat('#ffffff', 0.15), grey = mat('#7b8494')
  const blush = new THREE.MeshStandardMaterial({ color: '#ff8fa3', roughness: 0.6, transparent: true, opacity: 0.6 })
  const add = (geo, m, x, y, z, parent) => {
    const o = new THREE.Mesh(geo, m)
    o.position.set(x, y, z)
    o.castShadow = true
    parent.add(o)
    return o
  }

  // ----- the tram -----
  const tram = new THREE.Group()
  scene.add(tram)
  const body = new THREE.Group() // squash & stretch happens here
  tram.add(body)
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
    const w = add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 32), navy, x, 0.38, z, tram)
    w.rotation.z = Math.PI / 2
    add(new THREE.BoxGeometry(0.5, 0.27, 0.1), grey, 0, 0, 0, w) // a spoke, so you see the wheel turn
    wheels.push(w)
  }

  // ----- the face -----
  const face = new THREE.Group()
  face.position.set(0, 1.85, 1.32)
  body.add(face)
  add(new RoundedBoxGeometry(1.86, 1.02, 0.1, 4, 0.05), glass, 0, 0, 0, face)
  const eyes = [-0.43, 0.43].map((x) => {
    const g = new THREE.Group()
    g.position.set(x, 0.06, 0.08)
    face.add(g)
    const ball = add(new THREE.SphereGeometry(0.25, 32, 16), white, 0, 0, 0, g)
    const pupil = add(new THREE.SphereGeometry(0.14, 32, 16), navy, 0, 0, 0.12, g)
    const shine = add(new THREE.SphereGeometry(0.045, 12, 8), white, -0.05, 0.06, 0.24, g)
    const arc = add(new THREE.TorusGeometry(0.15, 0.04, 10, 24, Math.PI), navy, 0, -0.04, 0.1, g) // closed happy eye (^)
    return { ball, pupil, shine, arc }
  })
  const brows = [-0.43, 0.43].map((x) => {
    const b = add(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), navy, x, 0.4, 0.1, face)
    b.rotation.z = Math.PI / 2
    return b
  })
  const smile = add(new THREE.TorusGeometry(0.17, 0.04, 10, 24, Math.PI), navy, 0, -0.2, 0.1, face)
  smile.rotation.z = Math.PI
  const mouth = add(new THREE.SphereGeometry(0.17, 24, 16), navy, 0, -0.25, 0.08, face)
  const tongue = add(new THREE.SphereGeometry(0.09, 16, 8), mat('#ff7a8a', 0.5), 0, -0.31, 0.13, face)
  const cheeks = [-0.74, 0.74].map((x) => {
    const c = add(new THREE.SphereGeometry(0.12, 16, 8), blush, x, -0.17, 0.06, face)
    c.scale.z = 0.3
    return c
  })

  // ----- little arms -----
  const arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group()
    shoulder.position.set(s * 1.22, 1.55, 0.3)
    body.add(shoulder)
    add(new THREE.CapsuleGeometry(0.08, 0.55, 4, 8), navy, 0, -0.35, 0, shoulder)
    add(new THREE.SphereGeometry(0.16, 16, 12), yellow, 0, -0.72, 0, shoulder)
    return { shoulder, s }
  })

  // ----- confetti for happy moments -----
  const confetti = Array.from({ length: 14 }, (_, i) => {
    const m = add(new THREE.OctahedronGeometry(0.12), mat(['#ffc93c', '#ff7a59', '#3ccf6e', '#2f7de1', '#ffffff'][i % 5], 0.3), 0, 0, 0, scene)
    m.userData = { a: (i / 14) * Math.PI * 2, r: 1.8 + (i % 3) * 0.5, h: 1.5 + (i % 4) * 0.6 }
    m.visible = false
    return m
  })

  function showFace(f, live, talking) {
    const blink = live % 2.7 < 0.12 && f.closed < 0.5 ? 1 : 0
    const open = clamp(f.open + (talking ? Math.abs(Math.sin(live * 14)) * 0.7 : 0))
    for (const e of eyes) {
      const openEye = (1 - f.closed) * (1 - blink)
      e.ball.scale.set(1, Math.max(0.06, openEye), 0.55)
      e.pupil.visible = e.shine.visible = openEye > 0.3
      e.pupil.scale.setScalar(f.pupil)
      e.pupil.position.set(0, f.lookY, 0.12)
      e.arc.visible = f.closed > 0.5
    }
    brows.forEach((b, i) => {
      b.position.y = 0.4 + f.browY
      b.rotation.z = Math.PI / 2 + (i ? -1 : 1) * f.browTilt
    })
    smile.visible = open < 0.2
    smile.scale.setScalar(0.6 + f.smile * 0.6)
    mouth.visible = tongue.visible = open >= 0.2
    mouth.scale.set(1, Math.max(0.2, open) * 0.9, 0.4)
    tongue.position.y = -0.25 - open * 0.08
    cheeks.forEach((c) => (c.material.opacity = 0.25 + f.blush * 0.55))
  }

  function resize() {
    const w = canvas.clientWidth || 360
    const h = canvas.clientHeight || 720
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // on wide screens step back so the tram isn't huge
    const dist = Math.max(22, 11 / camera.aspect)
    camera.position.set(1.4, 3.6, dist)
    camera.lookAt(0, 3.6, 0)
    camera.updateProjectionMatrix()
  }

  // Draw one moment. t = story clock, live = always-running clock.
  function draw(t, live) {
    let x = 0, scale = 1, hop = 0, squash = 0, turn = -0.25, lean = 0, armUp = 0, wave = 0, ring = 0
    let f = FACES.happy, talking = false
    if (t < 1.3) { // roll in from far away, small -> big
      const k = ease(clamp(t / 1.3))
      x = lerp(-9, 0, k)
      scale = lerp(0.25, 1, k)
      hop = Math.abs(Math.sin(live * 9)) * 0.12
    } else if (t < 1.7) { // land with a little squash
      squash = Math.sin(((t - 1.3) / 0.4) * Math.PI) * 0.18
    }
    if (t >= 1.7 && t < 4.6) { // cheer!
      f = FACES.joy
      armUp = 1
      wave = Math.sin(live * 10) * 0.35
      hop = Math.abs(Math.sin(live * 6)) * 0.35
      ring = t > 2.1 && t < 3.0 ? Math.sin(live * 40) * 0.4 : 0
    }
    if (t >= 4.6 && t < 5.4) { // calm down, come a bit closer
      const k = ease(clamp((t - 4.6) / 0.8))
      scale = lerp(1, 1.15, k)
      f = mixFaces(FACES.joy, FACES.shy, k)
      armUp = 1 - k
    }
    if (t >= 5.4) scale = 1.15
    if (t >= 5.4 && t < 7.6) { // shy: look around while talking
      f = FACES.shy
      talking = t > 5.7 && t < 7.4
      turn = -0.25 + Math.sin(live * 1.6) * 0.35
    }
    if (t >= 7.6 && t < 9.2) { // hopeful: lean in and ask
      const k = ease(clamp((t - 7.6) / 0.4))
      f = mixFaces(FACES.shy, FACES.hope, k)
      talking = t > 7.8 && t < 8.6
      lean = k * 0.18 + Math.sin(live * 2) * 0.02
      turn = lerp(-0.25, -0.1, k)
      armUp = k * 0.35
    }
    if (t >= 9.2) { // "Yes!" -> jump for joy
      const k = clamp((t - 9.2) / 0.3)
      f = mixFaces(FACES.hope, FACES.joy, k)
      armUp = 1
      wave = Math.sin(live * 12) * 0.4
      hop = Math.abs(Math.sin((t - 9.2) * 7)) * 0.6
      talking = t > 9.6 && t < 10.6
      turn = -0.1
    }

    tram.position.set(x, hop, 0)
    tram.scale.setScalar(scale)
    tram.rotation.set(lean, turn, 0)
    body.scale.set(1 + squash, 1 - squash, 1 + squash)
    wheels.forEach((w) => (w.rotation.x = -Math.min(t, 1.3) * 12))
    arms.forEach(({ shoulder, s }) => (shoulder.rotation.z = s * (0.25 + armUp * 2.3 + (armUp > 0.5 ? s * wave : 0))))
    pole.rotation.z = ring * 0.3
    bell.position.x = ring * 0.1
    showFace(f, live, talking)
    const party = (t > 1.7 && t < 4.4) || t > 9.3
    confetti.forEach((m, i) => {
      m.visible = party
      const a = m.userData.a + live * 1.2
      m.position.set(x + Math.cos(a) * m.userData.r * scale, m.userData.h * scale + Math.sin(live * 3 + i) * 0.2, Math.sin(a) * m.userData.r * 0.6)
      m.rotation.set(live * 3 + i, live * 2, 0)
    })
    renderer.render(scene, camera)
  }

  function dispose() {
    scene.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    renderer.dispose()
  }

  return { draw, resize, dispose }
}
