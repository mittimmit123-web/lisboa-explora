// Intro step 2: Trammy, the app's host, explains WHY the app exists and then
// HOW it works, before the player chooses their own Explora.
import { lazy, Suspense } from 'react'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

const HOW = [
  { emoji: '📍', strong: 'Walk to a real place', rest: ' on the map.' },
  { emoji: '📸', strong: 'Snap a photo', rest: ' to collect it.' },
  { emoji: '📖', strong: 'Every new neighbourhood', rest: ' unlocks a chapter of our story and a postcard for your album.' },
]

export default function IntroPurpose({ hostId, onDone }) {
  return (
    <div className="intro-tiles">
      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      <div className="intro-tiles-who">
        <Suspense fallback={<span className="buddy-avatar buddy-placeholder" aria-hidden="true" />}>
          <BuddyAvatar id={hostId} />
        </Suspense>
        <p className="intro-tiles-bubble">
          Ding ding! Most people only ever see their own neighbourhood and never discover the rest of Lisbon. But the city has 24
          neighbourhoods, each full of surprises! Let’s explore them together. 🗺️
        </p>
      </div>

      <div className="intro-tiles-map intro-how">
        <span className="intro-tiles-title">How it works</span>
        <ol>
          {HOW.map((s, i) => (
            <li key={s.emoji} style={{ animationDelay: `${0.4 + i * 0.25}s` }}>
              <span className="intro-how-emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <span>
                <b>{s.strong}</b>
                {s.rest}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <button className="intro-choose" type="button" onClick={onDone}>
        Let’s explore!
      </button>
    </div>
  )
}
