// The intro on the first opening of the app (issue #33), in four steps:
//   welcome   Trammy, the app's host, rolls in and cheers
//   pick      the player chooses their Explora
//   prologue  the chosen Explora says hello and asks to be shown around
//   album     it explains the postcard album (your photos become postcards)
// Loaded only when needed (React.lazy in App.jsx), because of the 3D library.
import { useCallback, useEffect, useRef, useState } from 'react'
import { characterById } from '../lib/characters.js'
import {
  PROLOGUE_END,
  WELCOME_END,
  advancePrologue,
  nextStep,
  prologuePhase,
  welcomePhase,
} from '../lib/intro.js'
import { createIntroScene } from '../lib/introScene.js'
import IntroPicker from './IntroPicker.jsx'
import IntroAlbum from './IntroAlbum.jsx'

const HOST = 'tram' // Trammy welcomes everyone, and stands in if no Explora is chosen
const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export default function IntroScreen({ onDone }) {
  const [step, setStep] = useState('welcome')
  const [exploraId, setExploraId] = useState(null)
  const next = useCallback(() => setStep((s) => nextStep(s)), [])

  useEffect(() => {
    if (step === 'done') onDone()
  }, [step, onDone])

  const actorId = exploraId ?? HOST

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Welcome to Lisboa Explora">
      <div className="intro-sun" aria-hidden="true">
        <div className="intro-rays" />
        <div className="intro-glow" />
        <div className="intro-disc" />
      </div>
      {step === 'welcome' && <WelcomeFilm onDone={next} />}
      {step === 'pick' && (
        <IntroPicker
          onChosen={(id) => {
            setExploraId(id)
            next()
          }}
        />
      )}
      {step === 'prologue' && <PrologueFilm actorId={actorId} onDone={next} />}
      {step === 'album' && <IntroAlbum actorId={actorId} onDone={next} />}
    </div>
  )
}

// Runs a 3D film: calls draw(t, live) every frame and stops when done.
// tick(t, dt) returns the new story time; finished(t) says when to stop.
function useFilm(canvasRef, actorId, { draw, tick, finished, onDone, onPhase, phaseOf }) {
  useEffect(() => {
    const canvas = canvasRef.current
    const scene = createIntroScene(canvas, { actorId })
    scene.resize()
    const resizer = new ResizeObserver(() => scene.resize())
    resizer.observe(canvas)
    let t = 0 // story clock
    let live = 0 // always-running clock (blinking, swaying)
    let last = performance.now()
    let shown = null
    let frameId
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      live += dt
      t = tick(t, dt)
      const p = phaseOf(t)
      if (p !== shown) {
        shown = p
        onPhase(p) // React only updates when the part changes
      }
      draw(scene, t, live)
      if (finished(t)) return onDone()
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(frameId)
      resizer.disconnect()
      scene.dispose()
    }
    // the film is set up once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId])
}

function WelcomeFilm({ onDone }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('arrive')
  const [calm] = useState(prefersCalm)
  useFilm(canvasRef, HOST, {
    // reduce motion: show the cheering pose without movement for a moment
    tick: (t, dt) => (calm ? Math.max(t, 2) + dt * 0.5 : t + dt),
    draw: (scene, t, live) => scene.drawWelcome(calm ? 2 : t, calm ? 0 : live),
    finished: (t) => t >= WELCOME_END,
    phaseOf: welcomePhase,
    onPhase: setPhase,
    onDone,
  })
  return (
    <>
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      <h1 className={phase === 'cheer' ? 'intro-title show' : 'intro-title'}>
        Lisboa
        <br />
        Explora
      </h1>
      {phase === 'cheer' && (
        <p className="intro-bubble intro-bubble-welcome" aria-live="polite">
          Ding ding! 🔔
        </p>
      )}
    </>
  )
}

function PrologueFilm({ actorId, onDone }) {
  const canvasRef = useRef(null)
  const answeredRef = useRef(false)
  const [phase, setPhase] = useState('enter')
  const [calm] = useState(prefersCalm)
  const explora = characterById(actorId)
  useFilm(canvasRef, actorId, {
    tick: (t, dt) => {
      if (calm) return answeredRef.current ? PROLOGUE_END : 4.0
      return advancePrologue(t, dt, answeredRef.current)
    },
    draw: (scene, t, live) => scene.drawPrologue(t, calm ? 0 : live),
    finished: (t) => t >= PROLOGUE_END,
    phaseOf: (t) => prologuePhase(t, answeredRef.current),
    onPhase: setPhase,
    onDone,
  })
  const bubble = {
    hello: explora.hello,
    ask: 'Will you show me around?',
    joy: "Yay! Let's go! 🎉",
  }[phase]
  return (
    <>
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      <span className="intro-who">{explora.name}</span>
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
    </>
  )
}
