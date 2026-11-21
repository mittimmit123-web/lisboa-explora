// "Choose your character": the three buddies stand side by side in 3D.
// Tap one (or its button): it slides to the front, grows and spins, the
// other two step back. "Choose" saves it. Loaded only when opened, because
// it brings the 3D library with it.
import { useEffect, useRef, useState } from 'react'
import { CHARACTERS, characterById } from '../lib/characters.js'
import { buildCharacter, createStage } from '../lib/characters3d.js'

const START_X = { tram: -2.8, sardine: 0, cat: 2.8 }

export default function CharacterPicker({ current, onChoose, onClose }) {
  const canvasRef = useRef(null)
  const selectedRef = useRef(current)
  const [selected, setSelected] = useState(current)

  function select(id) {
    selectedRef.current = id
    setSelected(id)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = createStage(canvas)
    const { THREE, renderer, scene, camera } = stage
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

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
      camera.lookAt(0, 1.7, 0)
    }
    resize()
    const resizer = new ResizeObserver(resize)
    resizer.observe(canvas)

    // Which character was tapped? Shoot an invisible line from the finger
    // into the scene and take the first character it hits ("raycasting").
    const raycaster = new THREE.Raycaster()
    function onTap(e) {
      const r = canvas.getBoundingClientRect()
      const point = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(point, camera)
      const hit = raycaster.intersectObjects(chars.map((c) => c.root), true)[0]
      let o = hit?.object
      while (o && !o.userData.id) o = o.parent
      if (o) select(o.userData.id)
    }
    canvas.addEventListener('pointerdown', onTap)

    let frameId
    let last = performance.now() / 1000
    function frame(ms) {
      const t = ms / 1000
      const dt = Math.min(0.05, Math.max(0, t - last))
      last = t
      const sel = selectedRef.current
      const waiting = chars.filter((c) => c.id !== sel)
      // Each frame every character moves a small step towards where it
      // should be: front and big if selected, back and small if not.
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

    return () => {
      cancelAnimationFrame(frameId)
      resizer.disconnect()
      canvas.removeEventListener('pointerdown', onTap)
      stage.dispose()
    }
  }, [])

  const info = characterById(selected)

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <header className="screen-header row">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Back">
          ‹
        </button>
        <div>
          <h1 id="picker-title">Choose your character</h1>
          <p className="muted">Your buddy for exploring Lisbon. You can change it later.</p>
        </div>
      </header>

      <canvas ref={canvasRef} className="picker-stage" aria-label="Three characters: tram, sardine and cat. Tap one to see it up close." />

      <div className="picker-tabs" role="group" aria-label="Characters">
        {CHARACTERS.map((c) => (
          <button key={c.id} className="tab" type="button" aria-pressed={selected === c.id} onClick={() => select(c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      <div className="card picker-info" aria-live="polite">
        {info ? (
          <>
            <h2>{info.name}</h2>
            <p className="muted">
              <strong className="say">“{info.say}”</strong>
              <br />
              {info.about}
            </p>
            <button
              className={current === info.id ? 'primary done' : 'primary'}
              type="button"
              onClick={() => onChoose(info.id)}
            >
              {current === info.id ? `✓ ${info.name} is your buddy` : `Choose the ${info.name}`}
            </button>
          </>
        ) : (
          <>
            <h2>Tap a character</h2>
            <p className="muted">Tap one of the three to see it up close.</p>
            <button className="primary" type="button" disabled>
              Choose
            </button>
          </>
        )}
      </div>
    </div>
  )
}
