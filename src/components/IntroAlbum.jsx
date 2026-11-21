// Intro step 4 (issue #33): the Explora explains the postcard album before
// the tour, so the player knows the goal: in every neighbourhood, the photo
// becomes a postcard. 24 neighbourhoods, 24 postcards (Lisbon has 24 parishes).
import { lazy, Suspense } from 'react'
import { characterById } from '../lib/characters.js'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

export default function IntroAlbum({ actorId, onDone }) {
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
          In every neighbourhood we visit, your photo becomes a postcard for my album.
        </p>
      </div>

      <div className="intro-tiles-map" aria-label="An empty album with 24 postcards">
        <span className="intro-tiles-title">{explora.name}&apos;s postcard album</span>
        <ol className="intro-tiles-grid">
          {Array.from({ length: 24 }, (_, i) => (
            <li key={i} className={i === 0 ? 'first' : undefined} style={{ animationDelay: `${0.3 + i * 0.06}s` }} />
          ))}
        </ol>
        <span className="intro-tiles-count">0 / 24</span>
      </div>

      <p className="intro-tiles-bubble second">24 neighbourhoods, 24 postcards. Let&apos;s fill it together!</p>

      <button className="intro-choose" type="button" onClick={onDone}>
        Show me the app!
      </button>
    </div>
  )
}
