// The player's own 3D Explora, standing big in front of the weather scene
// on the Friends screen. The background stays see-through, so the weather
// shows behind it. Loaded lazily, like the other 3D pictures.
import { useEffect, useRef } from 'react'
import { buildCharacter, createStage } from '../lib/characters3d.js'

export default function WeatherBuddy({ id, onFail }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    let stage
    try {
      // 'shadow' floor: invisible, only the shadow on the street shows.
      stage = createStage(canvasRef.current, { floorSize: 3, floor: 'shadow' })
    } catch {
      onFail?.() // no 3D on this phone: the scene shows the drawn tram again
      return
    }
    const { renderer, scene, camera } = stage
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const buddy = buildCharacter(id)
    scene.add(buddy.root)
    stage.resize()
    camera.position.set(0, 2.6, 9)
    camera.lookAt(0, 1.6, 0)
    const resizer = new ResizeObserver(() => {
      stage.resize()
      if (calm) renderer.render(scene, camera)
    })
    resizer.observe(canvasRef.current)

    let frameId
    function frame(ms) {
      const t = ms / 1000
      buddy.root.rotation.y = 0.45 + Math.sin(t * 0.8) * 0.35 // looks around
      buddy.root.position.y = Math.abs(Math.sin(t * 2.2)) * 0.12 // small happy hop
      buddy.update(t)
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(frame)
    }
    // Save battery: no drawing while the app is in the background.
    const onVisibility = () => {
      cancelAnimationFrame(frameId)
      if (!document.hidden && !calm) frameId = requestAnimationFrame(frame)
    }
    if (calm) {
      buddy.root.rotation.y = 0.45
      renderer.render(scene, camera)
    } else {
      frameId = requestAnimationFrame(frame)
      document.addEventListener('visibilitychange', onVisibility)
    }
    return () => {
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', onVisibility)
      resizer.disconnect()
      stage.dispose()
    }
  }, [id, onFail])

  return <canvas ref={canvasRef} className="weather-buddy" aria-hidden="true" />
}
