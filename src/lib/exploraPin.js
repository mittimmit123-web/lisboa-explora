// The player's location on the map: a red 3D pin with their Explora on top.
//
// Why a picture and not live 3D? The map moves markers on every pan and
// zoom, and a live 3D scene there would make the map slow. So we draw the
// pin + Explora in 3D only ONCE, turn it into a normal PNG picture, and the
// map uses that picture like any other icon. Pictures are kept in memory,
// so switching tabs does not draw them again.
//
// This file loads three.js, so MapScreen imports it lazily (after the map
// is already on screen). Until then the map shows the old blue dot.
import { buildCharacter, createStage } from './characters3d.js'

// Size of the picture on the map, in CSS pixels. The tip of the pin
// (ANCHOR) is the player's exact position.
export const PIN_SIZE = [92, 124]
export const PIN_ANCHOR = [46, 117]

// How much to scale a character so its widest side (seen from the front)
// becomes `target` units. All Exploras end up the same size on the map.
export function fitScale(width, height, target = 3.3) {
  const biggest = Math.max(width, height)
  return biggest > 0 ? target / biggest : 1
}

const cache = new Map() // character id -> picture (data URL)

export function exploraPinPicture(id) {
  if (!cache.has(id)) cache.set(id, drawPin(id))
  return cache.get(id)
}

function drawPin(id) {
  const [w, h] = PIN_SIZE
  const canvas = document.createElement('canvas')
  const stage = createStage(canvas, { floor: 'none' })
  const { THREE, renderer, scene, camera } = stage
  try {
    renderer.setPixelRatio(2) // sharp on phone screens
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = 30
    camera.position.set(0, 3.6, 14.5)
    camera.lookAt(0, 2.75, 0)
    camera.updateProjectionMatrix()

    // The pin: a ball on an upside-down cone, glossy like the Exploras.
    const red = new THREE.MeshStandardMaterial({ color: '#e11d2e', roughness: 0.35, metalness: 0.05 })
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 48, 32), red)
    head.position.y = 1.55
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.35, 48), red)
    tip.rotation.x = Math.PI
    tip.position.y = 0.72
    scene.add(head, tip)

    // The Explora, scaled to the same size for everyone, standing on the pin.
    const buddy = buildCharacter(id)
    buddy.update(0)
    buddy.root.rotation.y = 0.45
    const size = new THREE.Box3().setFromObject(buddy.root).getSize(new THREE.Vector3())
    buddy.root.scale.setScalar(fitScale(size.x, size.y))
    const bottom = new THREE.Box3().setFromObject(buddy.root).min.y
    buddy.root.position.y = 2.1 - bottom
    scene.add(buddy.root)

    renderer.render(scene, camera)
    return withOutline(canvas)
  } finally {
    stage.dispose()
    renderer.forceContextLoss() // give the 3D slot back to the browser right away
  }
}

// Bake a thin white outline and a soft shadow into the picture once, so the
// pin stands out on the map without costly CSS filters on every frame.
function withOutline(source) {
  const out = document.createElement('canvas')
  out.width = source.width
  out.height = source.height
  const ctx = out.getContext('2d')
  // White silhouette of the picture
  const white = document.createElement('canvas')
  white.width = source.width
  white.height = source.height
  const wctx = white.getContext('2d')
  wctx.drawImage(source, 0, 0)
  wctx.globalCompositeOperation = 'source-in'
  wctx.fillStyle = '#fff'
  wctx.fillRect(0, 0, white.width, white.height)
  // Soft shadow under everything, then the outline, then the picture
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 3
  const r = 3 // outline width in picture pixels (1.5 CSS px)
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) ctx.drawImage(white, Math.cos(a) * r, Math.sin(a) * r)
  ctx.shadowColor = 'transparent'
  ctx.drawImage(source, 0, 0)
  return out.toDataURL('image/png')
}
