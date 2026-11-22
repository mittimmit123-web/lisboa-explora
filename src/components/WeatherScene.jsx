// Shows the animated Lisbon weather. The mood comes from the leaderboard
// (see weatherMood in src/lib/friends.js). The drawing itself lives in
// src/lib/weatherScene.js. The player's 3D Explora (buddy) stands in front;
// without a buddy the scene shows its own drawn tram.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { rememberMood, rememberedMood } from '../lib/friends.js'
import { createWeatherScene } from '../lib/weatherScene.js'

const WeatherBuddy = lazy(() => import('./WeatherBuddy.jsx'))

export default function WeatherScene({ mood, sub, text, buddy }) {
  const canvasRef = useRef(null)
  const [buddyFailed, setBuddyFailed] = useState(false)
  const show3d = Boolean(buddy) && !buddyFailed
  const sceneRef = useRef(null)
  // Start with the last known weather; without one the scene stays empty
  // until the leaderboard has loaded (never a wrong sunny sky first).
  const startMood = useRef(rememberedMood())
  const firstMood = useRef(!startMood.current)

  // Create the scene once, and stop it when the Friends screen closes.
  useEffect(() => {
    const canvas = canvasRef.current
    // People who turned on "reduce motion" on their phone get a still picture.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const scene = createWeatherScene(canvas, { animate: !calm, tram: !show3d, mood: startMood.current })
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
    // Only created once on purpose; showTram below follows later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the 3D Explora can't be shown, bring back the drawn tram.
  useEffect(() => {
    sceneRef.current?.showTram(!show3d)
  }, [show3d])
  const onBuddyFail = useCallback(() => setBuddyFailed(true), [])

  // Change the weather when the mood changes. The very first mood is shown
  // right away; later changes melt slowly so the player sees them happen.
  useEffect(() => {
    if (!sceneRef.current || !mood) return
    sceneRef.current.setMood(mood, { instant: firstMood.current })
    firstMood.current = false
    rememberMood(mood)
  }, [mood])

  return (
    <figure className="weather">
      <div className="weather-picture">
        <canvas ref={canvasRef} className="weather-canvas" role="img" aria-label={text ?? 'Lisbon weather'} />
        {show3d && (
          <Suspense fallback={null}>
            <WeatherBuddy id={buddy} onFail={onBuddyFail} />
          </Suspense>
        )}
      </div>
      {text && (
        <figcaption className="weather-caption">
          {sub && <small>{sub}</small>}
          <span>{text}</span>
        </figcaption>
      )}
    </figure>
  )
}
