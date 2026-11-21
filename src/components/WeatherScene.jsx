// Shows the animated Lisbon weather. The mood comes from the leaderboard
// (see weatherMood in src/lib/friends.js). The drawing itself lives in
// src/lib/weatherScene.js.
import { useEffect, useRef } from 'react'
import { createWeatherScene } from '../lib/weatherScene.js'

export default function WeatherScene({ mood, sub, text }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const firstMood = useRef(true)

  // Create the scene once, and stop it when the Friends screen closes.
  useEffect(() => {
    const canvas = canvasRef.current
    // People who turned on "reduce motion" on their phone get a still picture.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const scene = createWeatherScene(canvas, { animate: !calm })
    sceneRef.current = scene
    scene.resize()
    scene.start()

    // Save battery: pause while the app is in the background.
    const onVisibility = () => (document.hidden ? scene.stop() : scene.start())
    document.addEventListener('visibilitychange', onVisibility)
    const resizer = new ResizeObserver(() => scene.resize())
    resizer.observe(canvas)

    return () => {
      scene.stop()
      resizer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Change the weather when the mood changes. The very first mood is shown
  // right away; later changes melt slowly so the player sees them happen.
  useEffect(() => {
    if (!sceneRef.current || !mood) return
    sceneRef.current.setMood(mood, { instant: firstMood.current })
    firstMood.current = false
  }, [mood])

  return (
    <figure className="weather">
      <canvas ref={canvasRef} className="weather-canvas" role="img" aria-label={text ?? 'Lisbon weather'} />
      {text && (
        <figcaption className="weather-caption">
          {sub && <small>{sub}</small>}
          <span>{text}</span>
        </figcaption>
      )}
    </figure>
  )
}
