// The 3D "choose your buddy" stage, shared by the picker in Collection
// (CharacterPicker.jsx) and the intro (IntroPicker.jsx), so it is written once.
//
// The three buddies stand side by side. The selected one slides to the front,
// grows, spins and hops; the other two step back and look at it.
// - Which one was tapped? An invisible line is "shot" from the finger into the
//   scene and the first character it hits is selected (raycasting).
// - Smooth movement: every frame each character moves a small step towards
//   where it should be.
import { CHARACTERS } from './characters.js'
import { buildCharacter, createStage } from './characters3d.js'

const START_X = { tram: -2.8, sardine: 0, cat: 2.8 }

// getSelected(): the id that is selected right now (or null)
// onSelect(id): called when a character is tapped
// lookAtY: where the camera looks; a higher value makes the characters stand lower on screen.
export function createPickerStage(canvas, { getSelected, onSelect, floor = 'ground', calm = false, lookAtY = 1.7 }) {
  const stage = createStage(canvas, { floor })
  const { THREE, renderer, scene, camera } = stage

  const chars = CHARACTERS.map(({ id }) => {
    const c = buildCharacter(id)
    c.id = id
    c.root.position.x = START_X[id]
    c.root.scale.setScalar(0.62)
    c.spin = 0
    scene.add(c.root)
    return c
  })

  function resize() {
    stage.resize()
    // On narrow phones move the camera back so all three fit
    const dist = Math.max(10, 12.5 / camera.aspect)
    camera.position.set(0, dist * 0.3, dist)
    camera.lookAt(0, lookAtY, 0)
  }
  resize()
  const resizer = new ResizeObserver(resize)
  resizer.observe(canvas)

  const raycaster = new THREE.Raycaster()
  function onTap(e) {
    const r = canvas.getBoundingClientRect()
    const point = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(point, camera)
    const hit = raycaster.intersectObjects(chars.map((c) => c.root), true)[0]
    let o = hit?.object
    while (o && !o.userData.id) o = o.parent
    if (o) onSelect(o.userData.id)
  }
  canvas.addEventListener('pointerdown', onTap)

  let frameId
  let last = performance.now() / 1000
  function frame(ms) {
    const t = ms / 1000
    const dt = Math.min(0.05, Math.max(0, t - last))
    last = t
    const sel = getSelected()
    const waiting = chars.filter((c) => c.id !== sel)
    const k = calm ? 1 : 1 - Math.pow(0.002, dt)
    for (const c of chars) {
      const isSel = c.id === sel
      const target = {
        x: isSel ? 0 : sel ? (waiting.indexOf(c) === 0 ? -3.5 : 3.5) : START_X[c.id],
        z: isSel ? 1.6 : sel ? -2.4 : 0,
        s: isSel ? 0.95 : sel ? 0.5 : 0.62,
      }
      c.root.position.x += (target.x - c.root.position.x) * k
      c.root.position.z += (target.z - c.root.position.z) * k
      c.root.scale.setScalar(c.root.scale.x + (target.s - c.root.scale.x) * k)
      if (isSel && !calm) {
        c.spin += dt * 1.6
        c.root.rotation.y = c.spin
        c.root.position.y = Math.abs(Math.sin(t * 4)) * 0.15
      } else {
        c.spin = 0
        const look = sel ? Math.sign(-c.root.position.x) * 0.5 : 0
        c.root.rotation.y += (look + (calm ? 0 : Math.sin(t + START_X[c.id]) * 0.15) - c.root.rotation.y) * k
        c.root.position.y *= 1 - k
      }
      if (!calm) c.update(t)
    }
    renderer.render(scene, camera)
    frameId = requestAnimationFrame(frame)
  }
  frameId = requestAnimationFrame(frame)

  return function dispose() {
    cancelAnimationFrame(frameId)
    resizer.disconnect()
    canvas.removeEventListener('pointerdown', onTap)
    stage.dispose()
  }
}
