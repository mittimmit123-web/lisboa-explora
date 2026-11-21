// A small 3D picture of the player's buddy, slowly turning.
import { useEffect, useRef } from 'react'
import { buildCharacter, createStage } from '../lib/characters3d.js'

export default function BuddyAvatar({ id }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = createStage(canvas, { floorSize: 2.6 })
    const { renderer, scene, camera } = stage
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const buddy = buildCharacter(id)
    scene.add(buddy.root)
    stage.resize()
    camera.position.set(0, 3.2, 8.5)
    camera.lookAt(0, 1.8, 0)

    let frameId
    function frame(ms) {
      const t = ms / 1000
      buddy.root.rotation.y = 0.5 + Math.sin(t * 0.8) * 0.6
      buddy.update(t)
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(frame)
    }
    if (calm) {
      buddy.root.rotation.y = 0.5
      renderer.render(scene, camera)
    } else {
      frameId = requestAnimationFrame(frame)
    }
    return () => {
      cancelAnimationFrame(frameId)
      stage.dispose()
    }
  }, [id])

  return <canvas ref={canvasRef} className="buddy-avatar" aria-hidden="true" />
}
