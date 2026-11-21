// The intro on the first opening of the app (issue #33): the tram rolls in,
// cheers, and asks the player to show it around Lisbon.
// Loaded only when needed (React.lazy in App.jsx), because of the 3D library.
import { useEffect, useRef, useState } from 'react'
import { INTRO_END, advance, phaseAt } from '../lib/intro.js'
import { createIntroScene } from '../lib/introScene.js'

const BUBBLES = {
  welcome: 'Ding ding! 🔔',
  hello: 'Olá! I just arrived… everything is so big! 😳',
  ask: 'Will you show me around?',
  joy: "Yay! Let's go! 🎉",
}

export default function IntroScreen({ onDone }) {
  const canvasRef = useRef(null)
  const raysRef = useRef(null)
  const answeredRef = useRef(false)
  const [phase, setPhase] = useState('arrive')
  // People who turned on "reduce motion" see the question right away.
  const [calm] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  useEffect(() => {
    const canvas = canvasRef.current
    const scene = createIntroScene(canvas)
    scene.resize()
    const resizer = new ResizeObserver(() => scene.resize())
    resizer.observe(canvas)

    let t = calm ? 8.8 : 0 // story clock
    let live = 0 // always-running clock (blinking, swaying)
    let last = performance.now()
    let shown = null
    let frameId
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      live += dt
      t = advance(t, calm ? 0 : dt, answeredRef.current)
      if (calm && answeredRef.current) t = INTRO_END
      const p = phaseAt(t, answeredRef.current)
      if (p !== shown) {
        shown = p
        setPhase(p) // React only updates when the part changes
      }
      if (raysRef.current) raysRef.current.style.transform = `rotate(${calm ? 0 : live * 4}deg)`
      scene.draw(t, calm ? 0 : live)
      if (t >= INTRO_END) {
        onDone()
        return
      }
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(frameId)
      resizer.disconnect()
      scene.dispose()
    }
  }, [calm, onDone])

  const bubble = BUBBLES[phase]

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Welcome to Lisboa Explora">
      <div className="intro-sun" aria-hidden="true">
        <div className="intro-rays" ref={raysRef} />
        <div className="intro-glow" />
        <div className="intro-disc" />
      </div>
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />

      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      {(phase === 'welcome' || phase === 'arrive') && (
        <h1 className={phase === 'welcome' ? 'intro-title show' : 'intro-title'}>
          Lisboa
          <br />
          Explora
        </h1>
      )}
      {bubble && (
        <p key={phase} className={`intro-bubble intro-bubble-${phase}`} aria-live="polite">
          {bubble}
        </p>
      )}
      {phase === 'ask' && (
        <button className="intro-yes" type="button" onClick={() => (answeredRef.current = true)}>
          Yes, let&apos;s go!
        </button>
      )}
    </div>
  )
}
