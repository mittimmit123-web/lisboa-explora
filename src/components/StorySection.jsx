// "Story" section in the Collection screen (issues #32, #33): the Explora's
// postcard album. Every new neighbourhood adds a postcard made from the
// player's photo; its back is that neighbourhood's story chapter.
import { useState } from 'react'
import { CHAPTERS } from '../data/story.js'
import { NEIGHBOURHOODS } from '../data/neighbourhoods.js'
import { getCharacter } from '../lib/api.js'
import { characterById } from '../lib/characters.js'
import { ALBUM_SIZE, albumSlots } from '../lib/postcards.js'
import { fillStory, unlockedChapters } from '../lib/story.js'
import Postcard, { PostcardFront } from './Postcard.jsx'

export default function StorySection({ spots, checkOffs }) {
  const explora = characterById(getCharacter())
  const buddy = explora?.name
  const unlocked = unlockedChapters(checkOffs, spots, NEIGHBOURHOODS, CHAPTERS)
  const slots = albumSlots(unlocked)
  const [open, setOpen] = useState(null) // the postcard shown big, or null
  const title = fillStory("{buddy}'s postcard album", { buddy })

  return (
    <section className="story" aria-labelledby="story-title">
      <h2 className="section-label" id="story-title">
        Story
      </h2>
      <div className="card story-card">
        <div className="row between">
          <strong>{title}</strong>
          <span className="muted">
            {unlocked.length} / {ALBUM_SIZE}
          </span>
        </div>

        <ol className="album" aria-label={`Postcard album: ${unlocked.length} of ${ALBUM_SIZE} postcards`}>
          {slots.map((entry, i) =>
            entry ? (
              <li key={i}>
                <button
                  type="button"
                  className="album-card"
                  onClick={() => setOpen(entry)}
                  aria-label={`Postcard ${i + 1}: ${entry.place}, ${entry.chapter.title}`}
                >
                  <PostcardFront entry={entry} mini />
                </button>
              </li>
            ) : (
              <li key={i} className="album-empty" aria-hidden="true">
                {i + 1}
              </li>
            ),
          )}
        </ol>

        {unlocked.length === 0 ? (
          <p className="muted">
            {fillStory('{buddy} is new in Lisbon. Collect a spot in any neighbourhood and your photo becomes the first postcard.', { buddy })}
          </p>
        ) : unlocked.length < ALBUM_SIZE ? (
          <p className="story-next">
            📮 Postcard {unlocked.length + 1}: show {buddy ?? 'your Explora'} a neighbourhood you haven&apos;t been to yet. Tap a postcard to read its story.
          </p>
        ) : (
          <p className="story-next done">📮 The album is full. Thank you for showing {buddy ?? 'your Explora'} Lisbon.</p>
        )}
      </div>

      {open && (
        <div className="story-popup-backdrop" onClick={() => setOpen(null)}>
          <div className="story-popup" role="dialog" aria-modal="true" aria-label={`Postcard from ${open.place}`} onClick={(e) => e.stopPropagation()}>
            <Postcard entry={open} explora={explora} />
            <button className="primary" type="button" onClick={() => setOpen(null)}>
              Back to the album
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
