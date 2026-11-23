// Last intro step (issue #33): HOW the app works, and the postcard album as
// the goal: walk to a real place, snap a photo, and in every new
// neighbourhood the photo becomes a postcard. 24 neighbourhoods, 24 postcards
// (Lisbon has 24 parishes). The WHY comes before, in the "purpose" step.
import { lazy, Suspense } from 'react'
import { characterById } from '../lib/characters.js'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

const HOW = [
  { emoji: '📍', text: 'Walk to a real place on the map' },
  { emoji: '📸', text: 'Snap a photo to collect it' },
  { emoji: '💌', text: 'In every new neighbourhood, it becomes a postcard' },
]

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
        <p className="intro-tiles-bubble">Here’s how it works:</p>
      </div>

      <ol className="intro-how">
        {HOW.map((s, i) => (
          <li key={s.emoji} style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
            <span className="intro-how-emoji" aria-hidden="true">
              {s.emoji}
            </span>
            {s.text}
          </li>
        ))}
      </ol>

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
