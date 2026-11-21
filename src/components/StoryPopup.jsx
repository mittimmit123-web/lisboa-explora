// Shown right after a check-off that unlocked a new chapter of the story.
import { useEffect, useRef } from 'react'
import { getCharacter } from '../lib/api.js'
import { characterById } from '../lib/characters.js'
import StoryChapter from './StoryChapter.jsx'

export default function StoryPopup({ entry, onClose, onRead }) {
  const explora = characterById(getCharacter())
  const buddy = explora?.name
  const pronouns = explora?.pronouns
  const closeRef = useRef(null)

  // Put the keyboard focus on the button, and let Escape close the pop-up.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="story-popup-backdrop" onClick={onClose}>
      <div
        className="story-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={entry.verified ? 'tile found glow big' : 'tile found big'} aria-hidden="true" />
        <p className="story-meta">📜 New chapter unlocked · {entry.number} / 24</p>
        <h2 id="story-popup-title">{entry.chapter.title}</h2>
        <StoryChapter entry={entry} buddy={buddy} pronouns={pronouns} showTitle={false} />
        <div className="row">
          <button className="secondary" type="button" onClick={onRead}>
            Open my story
          </button>
          <button ref={closeRef} className="primary" type="button" style={{ flex: 1 }} onClick={onClose}>
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  )
}
