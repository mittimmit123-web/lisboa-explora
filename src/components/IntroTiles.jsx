// Intro step 4 (issue #33): the Explora explains the tile map before the tour,
// so the player knows the goal: one azulejo tile for every neighbourhood
// they show it, 24 in total (Lisbon has 24 parishes).
import { lazy, Suspense } from 'react'
import { characterById } from '../lib/characters.js'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

export default function IntroTiles({ actorId, onDone }) {
  const explora = characterById(actorId)
  return (
    <div className="intro-tiles">
      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      <div className="intro-tiles-who">
        <Suspense fallback={<span className="buddy-avatar buddy-placeholder" aria-hidden="true" />}>
          <BuddyAvatar id={explora.id} />
        </Suspense>
        <p className="intro-tiles-bubble">
          In every neighbourhood we visit, I&apos;ll collect a tile for my map of Lisbon.
        </p>
      </div>

      <div className="intro-tiles-map" aria-label="An empty map with 24 tiles">
        <span className="intro-tiles-title">{explora.name}&apos;s map of Lisbon</span>
        <ol className="intro-tiles-grid">
          {Array.from({ length: 24 }, (_, i) => (
            <li key={i} className={i === 0 ? 'first' : undefined} style={{ animationDelay: `${0.3 + i * 0.06}s` }} />
          ))}
        </ol>
        <span className="intro-tiles-count">0 / 24</span>
      </div>

      <p className="intro-tiles-bubble second">24 neighbourhoods, 24 tiles. Let&apos;s fill it together!</p>

      <button className="intro-choose" type="button" onClick={onDone}>
        Show me the app!
      </button>
    </div>
  )
}
