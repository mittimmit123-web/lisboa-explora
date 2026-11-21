// "Story" section in the Collection screen (issue #32): the buddy's tile map
// of Lisbon (one tile per neighbourhood you showed it) and the chapters so far.
import { CHAPTERS } from '../data/story.js'
import { NEIGHBOURHOODS } from '../data/neighbourhoods.js'
import { getCharacter } from '../lib/api.js'
import { characterById } from '../lib/characters.js'
import { fillStory, unlockedChapters } from '../lib/story.js'
import StoryChapter from './StoryChapter.jsx'

export default function StorySection({ spots, checkOffs }) {
  const buddy = characterById(getCharacter())?.name
  const unlocked = unlockedChapters(checkOffs, spots, NEIGHBOURHOODS, CHAPTERS)
  const next = CHAPTERS[unlocked.length]
  const title = fillStory('Showing {buddy} around', { buddy })

  return (
    <section className="story" aria-labelledby="story-title">
      <h2 className="section-label" id="story-title">
        Story
      </h2>
      <div className="card story-card">
        <div className="row between">
          <strong>{title}</strong>
          <span className="muted">
            {unlocked.length} / {CHAPTERS.length}
          </span>
        </div>

        {/* The tile map: one azulejo per neighbourhood you showed your buddy */}
        <ol className="tile-map" aria-label={`Tile map: ${unlocked.length} of ${CHAPTERS.length} tiles`}>
          {CHAPTERS.map((c, i) => {
            const entry = unlocked[i]
            return (
              <li
                key={c.title}
                className={entry ? (entry.verified ? 'tile found glow' : 'tile found') : 'tile'}
                title={entry ? `Chapter ${i + 1}: ${entry.place}` : `Chapter ${i + 1}: still hidden`}
              />
            )
          })}
        </ol>

        {unlocked.length === 0 ? (
          <p className="muted">
            {fillStory('{buddy} is new in Lisbon. Collect a spot in any neighbourhood to start the story.', { buddy })}
          </p>
        ) : (
          <div className="chapters">
            {[...unlocked].reverse().map((entry) => (
              <details key={entry.number} open={entry.number === unlocked.length}>
                <summary>
                  <span className="chapter-number">{entry.number}</span>
                  <span className="chapter-title">{entry.chapter.title}</span>
                  <span className="muted">{entry.place}</span>
                </summary>
                <StoryChapter entry={entry} buddy={buddy} />
              </details>
            ))}
          </div>
        )}

        {next ? (
          <p className="story-next">
            🔒 Chapter {unlocked.length + 1}: show {buddy ?? 'your buddy'} a neighbourhood you haven&apos;t been to yet.
          </p>
        ) : (
          <p className="story-next done">🗺️ The map is complete. Thank you for showing {buddy ?? 'your buddy'} Lisbon.</p>
        )}
      </div>
    </section>
  )
}
