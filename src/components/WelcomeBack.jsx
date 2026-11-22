// Shown on every later opening of the app (after the first-time intro):
// 1. splash: the player's Explora in the middle, the logo at the bottom
// 2. sheet:  a "welcome back" card slides up over the dimmed app; only when
//    withCard is true (the first opening of the day, see welcomeDue)
// Loaded lazily (React.lazy in App.jsx), because the Explora is 3D.
import { lazy, Suspense, useEffect, useState } from 'react'
import { getMyName } from '../lib/api.js'
import { characterById } from '../lib/characters.js'

const WeatherBuddy = lazy(() => import('./WeatherBuddy.jsx'))
const SPLASH_MS = 2000 // how long the splash stays (a tap skips it)

export default function WelcomeBack({ exploraId, withCard, onDone }) {
  const [step, setStep] = useState('splash')
  const [name, setName] = useState(null)
  const explora = characterById(exploraId)

  // Load the name while the splash is showing, so the card has it in time.
  useEffect(() => {
    if (withCard) getMyName().then(setName).catch(() => {})
  }, [withCard])

  const endSplash = () => (withCard ? setStep('sheet') : onDone())
  useEffect(() => {
    if (step !== 'splash') return
    const timer = setTimeout(endSplash, SPLASH_MS)
    return () => clearTimeout(timer)
  })

  if (step === 'splash') {
    return (
      <button type="button" className="welcome-splash" aria-label="Lisboa Explora, tap to continue" onClick={endSplash}>
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
        <h2 id="welcome-title">{name && name !== 'You' ? `Welcome back, ${name}!` : 'Welcome back!'}</h2>
        <p>{explora?.name ?? 'Your Explora'} is so excited to explore Lisbon with you today! ✨</p>
        <button className="intro-choose" type="button" onClick={onDone}>
          Let’s explore
        </button>
      </div>
    </div>
  )
}
