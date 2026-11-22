// Shown on every later opening of the app (after the first-time intro):
// 1. splash: the player's Explora in the middle, the logo at the bottom
// 2. sheet:  a "welcome back" card slides up over the dimmed app
// Loaded lazily (React.lazy in App.jsx), because the Explora is 3D.
import { lazy, Suspense, useEffect, useState } from 'react'
import { characterById } from '../lib/characters.js'

const WeatherBuddy = lazy(() => import('./WeatherBuddy.jsx'))
const SPLASH_MS = 2000 // how long the splash stays (a tap skips it)

export default function WelcomeBack({ exploraId, onDone }) {
  const [step, setStep] = useState('splash')
  const explora = characterById(exploraId)

  useEffect(() => {
    if (step !== 'splash') return
    const timer = setTimeout(() => setStep('sheet'), SPLASH_MS)
    return () => clearTimeout(timer)
  }, [step])

  if (step === 'splash') {
    return (
      <button type="button" className="welcome-splash" aria-label="Lisboa Explora, tap to continue" onClick={() => setStep('sheet')}>
        <span className="welcome-explora">
          <Suspense fallback={null}>
            <WeatherBuddy id={exploraId} />
          </Suspense>
        </span>
        <span className="welcome-logo">
          Lisboa
          <br />
          Explora
        </span>
      </button>
    )
  }

  return (
    <div className="welcome-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-sheet">
        <h2 id="welcome-title">Welcome back!</h2>
        <p>{explora?.name ?? 'Your Explora'} missed you. Where shall we go today?</p>
        <button className="intro-choose" type="button" onClick={onDone}>
          Let’s explore
        </button>
      </div>
    </div>
  )
}
