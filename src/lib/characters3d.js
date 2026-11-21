// 3D models of the buddy characters, built from simple shapes with three.js
// (like LEGO: spheres, boxes, cones, cylinders). All three share the same
// eyes, cheeks and light, so they look like one family.
//
// Only loaded when a 3D character is on screen (see React.lazy in BuddyCard),
// so the map still opens fast.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const mat = (color, rough = 0.45, metal = 0.05) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })
const C = { navy: mat('#14213d', 0.3), white: mat('#ffffff', 0.2), pink: mat('#fb7185', 0.6) }

function add(geo, material, x, y, z, parent) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}

// The same cartoon eye for every character
function eye(parent, x, y, z, size, turn) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = turn
  parent.add(g)
  add(new THREE.SphereGeometry(size, 32, 16), C.white, 0, 0, 0, g)
  add(new THREE.SphereGeometry(size * 0.58, 32, 16), C.navy, 0, -0.02, size * 0.6, g)
  add(new THREE.SphereGeometry(size * 0.2, 16, 8), C.white, -size * 0.15, size * 0.15, size * 1.1, g)
  return g
}
const blinkAt = (t) => ((t % 3.2) < 0.12 ? 0.1 : 1)

function makeTram() {
  const root = new THREE.Group()
  const yellow = mat('#f5b82e', 0.35), cream = mat('#fff7e6'), glass = mat('#bfdbfe', 0.15), grey = mat('#6b7280')
  add(new RoundedBoxGeometry(2.4, 2.2, 3.2, 6, 0.45), yellow, 0, 1.55, 0, root)
  add(new RoundedBoxGeometry(2.46, 0.36, 3.26, 4, 0.16), cream, 0, 1.0, 0, root)
  add(new RoundedBoxGeometry(2.0, 0.3, 2.8, 4, 0.14), cream, 0, 2.75, 0, root)
  add(new RoundedBoxGeometry(2.5, 0.22, 3.3, 4, 0.1), C.navy, 0, 0.42, 0, root)
  for (const s of [-1, 1]) for (const z of [-0.9, 0, 0.9]) add(new RoundedBoxGeometry(0.06, 0.7, 0.62, 2, 0.03), glass, s * 1.2, 1.8, z, root)
  const front = new THREE.Group()
  front.position.set(0, 1.85, 1.6)
  root.add(front)
  add(new RoundedBoxGeometry(1.8, 0.95, 0.08, 4, 0.04), glass, 0, 0, 0, front)
  const eyes = [eye(front, -0.42, 0.05, 0.06, 0.23, 0), eye(front, 0.42, 0.05, 0.06, 0.23, 0)]
  add(new THREE.TorusGeometry(0.18, 0.04, 12, 32, Math.PI), C.navy, 0, -0.22, 0.06, front).rotation.z = Math.PI
  for (const x of [-0.72, 0.72]) add(new THREE.SphereGeometry(0.1, 16, 8), C.pink, x, -0.18, 0.04, front).scale.z = 0.3
  for (const x of [-0.75, 0.75]) add(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24), C.white, x, 0.75, 1.62, root).rotation.x = Math.PI / 2
  add(new RoundedBoxGeometry(0.6, 0.32, 0.08, 2, 0.04), C.navy, 0, 2.62, 1.45, root)
  for (const x of [-1.05, 1.05]) for (const z of [-0.95, 0.95]) {
    add(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 32), C.navy, x, 0.36, z, root).rotation.z = Math.PI / 2
    add(new THREE.CylinderGeometry(0.13, 0.13, 0.27, 16), grey, x, 0.36, z, root).rotation.z = Math.PI / 2
  }
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 12), C.navy, 0, 3.4, -0.4, root).rotation.x = -0.5
  add(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 12), C.navy, 0, 3.95, 0, root).rotation.z = Math.PI / 2
  add(new THREE.SphereGeometry(0.15, 24, 12), yellow, 0, 4.05, 0, root)
  return { root, update: (t) => eyes.forEach((e) => (e.scale.y = blinkAt(t))) }
}

function makeSardine() {
  const root = new THREE.Group()
  const silver = mat('#8fb3dc', 0.25, 0.35), belly = mat('#eef4fb', 0.3, 0.2), stripe = mat('#1e4d8c', 0.3, 0.2),
    fin = mat('#5b87c4', 0.35, 0.2), red = mat('#e11d48', 0.4), gold = mat('#f2b33d', 0.3), green = mat('#16a34a', 0.4)
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
  const eyes = [eye(body, 0.42, 0.18, 1.18, 0.27, 0.35), eye(body, -0.42, 0.18, 1.18, 0.27, -0.35)]
  for (const s of [1, -1]) add(new THREE.SphereGeometry(0.11, 16, 8), C.pink, s * 0.6, -0.2, 1.0, body).scale.z = 0.4
  add(new THREE.TorusGeometry(0.16, 0.04, 12, 32, Math.PI), C.navy, 0, -0.18, 1.5, body).rotation.z = Math.PI
  // festival party hat (Santo António)
  const hat = new THREE.Group()
  hat.position.set(0, 0.95, 0.5)
  hat.rotation.x = 0.25
  body.add(hat)
  add(new THREE.ConeGeometry(0.32, 0.75, 32), red, 0, 0.35, 0, hat)
  add(new THREE.TorusGeometry(0.31, 0.05, 12, 32), gold, 0, 0, 0, hat).rotation.x = Math.PI / 2
  add(new THREE.SphereGeometry(0.11, 16, 8), gold, 0, 0.76, 0, hat)
  add(new THREE.SphereGeometry(0.06, 12, 8), green, 0.14, 0.4, 0.22, hat)
  return {
    root,
    update(t) {
      body.position.y = 1.9 + Math.sin(t * 2.5) * 0.15
      tail.rotation.y = Math.sin(t * 8) * 0.45
      fins.forEach((f, i) => (f.rotation.y = Math.sin(t * 6 + i * Math.PI) * 0.4))
      eyes.forEach((e) => (e.scale.y = blinkAt(t + 1)))
    },
  }
}

function makeCat() {
  const root = new THREE.Group()
  const orange = mat('#f59e42', 0.5), dark = mat('#c96a12', 0.5), cream = mat('#fff4e6', 0.5), inner = mat('#fbb6c4', 0.5),
    nose = mat('#f472b6', 0.4), scarf = mat('#2563eb', 0.45)
  add(new THREE.SphereGeometry(1, 48, 32), orange, 0, 1.05, 0, root).scale.set(1, 1, 0.95)
  add(new THREE.SphereGeometry(1, 48, 32), cream, 0, 1.0, 0.32, root).scale.set(0.68, 0.78, 0.7)
  for (const x of [-0.4, 0.4]) add(new THREE.SphereGeometry(0.26, 24, 16), cream, x, 0.2, 0.75, root).scale.set(1, 0.7, 1.3)
  for (const x of [-0.75, 0.75]) add(new THREE.SphereGeometry(0.34, 24, 16), orange, x, 0.28, 0.1, root).scale.set(0.9, 0.7, 1.4)
  // tail: a curved tube through 5 points; moving the points makes it swish
  let tail = null
  const tipPos = new THREE.Vector3()
  const tip = add(new THREE.SphereGeometry(0.15, 16, 8), dark, 0, 0, 0, root)
  function makeTail(sw) {
    const pts = [[0, 0.45, -0.85], [0.25 * sw, 0.55, -1.35], [0.6 * sw, 1.2, -1.45], [0.75 * sw, 1.85, -1.15], [0.55 * sw, 2.15, -0.85]]
      .map((p) => new THREE.Vector3(...p))
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.14, 16, false)
    if (tail) {
      tail.geometry.dispose()
      tail.geometry = geo
    } else tail = add(geo, orange, 0, 0, 0, root)
    tipPos.copy(pts[4])
  }
  makeTail(1)
  add(new THREE.TorusGeometry(0.7, 0.17, 16, 48), scarf, 0, 1.85, 0.05, root).rotation.x = Math.PI / 2 - 0.15
  add(new THREE.BoxGeometry(0.3, 0.6, 0.12), scarf, 0.45, 1.5, 0.65, root).rotation.set(0.25, 0, -0.25)
  const head = new THREE.Group()
  head.position.set(0, 2.65, 0.1)
  root.add(head)
  add(new THREE.SphereGeometry(1, 48, 32), orange, 0, 0, 0, head).scale.set(1, 0.88, 0.9)
  for (const [x, r] of [[-0.2, 0.25], [0, 0], [0.2, -0.25]]) add(new THREE.CapsuleGeometry(0.05, 0.28, 4, 8), dark, x, 0.62, 0.55, head).rotation.set(0.6, 0, r)
  add(new THREE.SphereGeometry(0.42, 32, 16), cream, 0, -0.3, 0.7, head).scale.set(1.1, 0.75, 0.6)
  add(new THREE.SphereGeometry(0.09, 16, 8), nose, 0, -0.16, 0.98, head).scale.set(1.3, 0.8, 0.8)
  for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.08, 0.025, 8, 24, Math.PI), C.navy, s * 0.08, -0.3, 0.95, head).rotation.z = Math.PI
  for (const s of [-1, 1]) for (const y of [-0.22, -0.32]) {
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), C.navy, s * 0.62, y, 0.75, head).rotation.z = Math.PI / 2 + s * (y + 0.27) * 1.5
  }
  const eyes = [eye(head, -0.36, 0.1, 0.72, 0.22, -0.25), eye(head, 0.36, 0.1, 0.72, 0.22, 0.25)]
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.11, 16, 8), C.pink, s * 0.62, -0.18, 0.62, head).scale.z = 0.4
  const ears = [-1, 1].map((s) => {
    const ear = new THREE.Group()
    ear.position.set(s * 0.52, 0.65, 0.05)
    ear.rotation.z = -s * 0.35
    head.add(ear)
    add(new THREE.ConeGeometry(0.34, 0.6, 24), orange, 0, 0.25, 0, ear).scale.z = 0.55
    add(new THREE.ConeGeometry(0.2, 0.4, 24), inner, 0, 0.2, 0.1, ear).scale.z = 0.3
    return ear
  })
  return {
    root,
    update(t) {
      makeTail(Math.sin(t * 3))
      tip.position.copy(tipPos)
      head.rotation.z = Math.sin(t * 1.5) * 0.12
      ears[1].rotation.x = (t % 2.6) < 0.15 ? -0.35 : 0
      eyes.forEach((e) => (e.scale.y = blinkAt(t + 2)))
    },
  }
}

const BUILDERS = { tram: makeTram, sardine: makeSardine, cat: makeCat }

// A new 3D character: { root, update(t) }. root is placed in the scene,
// update(t) animates it (blink, tail, ...) for the time t in seconds.
export function buildCharacter(id) {
  const c = (BUILDERS[id] ?? makeTram)()
  c.root.userData.id = id
  return c
}

// Light, floor and camera shared by the picker and the small buddy picture.
// floor: 'ground' = a beige round floor, 'shadow' = invisible floor that
// only shows shadows (for coloured backgrounds like the intro).
export function createStage(canvas, { floorSize = 7, floor = 'ground' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9cbb0', 1.5))
  const sun = new THREE.DirectionalLight('#ffffff', 2.3)
  sun.position.set(-4, 9, 7)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.bias = -0.002
  sun.shadow.normalBias = 0.03
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })
  scene.add(sun)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(floorSize, 64),
    floor === 'shadow' ? new THREE.ShadowMaterial({ opacity: 0.22 }) : new THREE.MeshStandardMaterial({ color: '#ece4d4', roughness: 0.9 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  function resize() {
    const w = canvas.clientWidth || 300
    const h = canvas.clientHeight || 300
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  // Free the graphics memory when the component goes away. (Materials are
  // shared between characters, so we leave them; renderer.dispose() frees
  // this stage's copy on the graphics card.)
  function dispose() {
    scene.traverse((o) => o.geometry?.dispose())
    renderer.dispose()
  }

  return { THREE, renderer, scene, camera, resize, dispose }
}
