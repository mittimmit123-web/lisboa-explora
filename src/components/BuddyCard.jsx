// "Your buddy" card at the top of the Collection screen (issue #20).
// Shows the chosen character and opens the picker. The 3D parts are loaded
// only when needed (React.lazy), so the app itself stays small and fast.
import { lazy, Suspense, useState } from 'react'
import { getCharacter, setCharacter } from '../lib/api.js'
import { characterById } from '../lib/characters.js'

const CharacterPicker = lazy(() => import('./CharacterPicker.jsx'))
const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

export default function BuddyCard() {
  const [character, setChosen] = useState(() => getCharacter())
  const [picking, setPicking] = useState(false)
  const buddy = characterById(character)

  function choose(id) {
    setChosen(setCharacter(id))
    setPicking(false)
  }

  return (
    <>
      <div className="card buddy">
        {buddy ? (
          <>
            <Suspense fallback={<span className="buddy-avatar buddy-placeholder" aria-hidden="true" />}>
              <BuddyAvatar id={buddy.id} />
            </Suspense>
            <div className="buddy-text">
              <span className="section-label">Your Explora</span>
              <strong>{buddy.name}</strong>
              <span className="muted">“{buddy.say}”</span>
            </div>
            <button className="secondary" type="button" onClick={() => setPicking(true)}>
              Change
            </button>
          </>
        ) : (
          <>
            <span className="buddy-avatar buddy-placeholder empty" aria-hidden="true" />
            <div className="buddy-text">
              <strong>Pick your Explora</strong>
              <span className="muted">Trammy, Captain Bubbles or Miss Purrfect will explore Lisbon with you.</span>
            </div>
            <button className="primary small" type="button" onClick={() => setPicking(true)}>
              Choose
            </button>
          </>
        )}
      </div>

      {picking && (
        <Suspense fallback={<div className="picker picker-loading">Loading characters…</div>}>
          <CharacterPicker current={character} onChoose={choose} onClose={() => setPicking(false)} />
        </Suspense>
      )}
    </>
  )
}
