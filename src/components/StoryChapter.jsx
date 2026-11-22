// One chapter of the story, used in the Collection list and in the pop-up.
// entry: { number, chapter, place, verified } from unlockedChapters()
import { FACTS } from '../data/facts.js'
import { ENDINGS, PARTS } from '../data/story.js'
import { fillStory, partFor } from '../lib/story.js'

export default function StoryChapter({ entry, buddy, pronouns, showTitle = true }) {
  const values = { buddy, pronouns, place: entry.place }
  return (
    <div className="story-chapter">
      {showTitle && (
        <p className="story-meta">
          Chapter {entry.number} · {partFor(entry.number, PARTS).title} · {entry.place}
        </p>
      )}
      <p>{fillStory(entry.chapter.text, values)}</p>
      {FACTS[entry.place] && <p className="story-fact">💡 Did you know? {FACTS[entry.place]}</p>}
      <p className={entry.verified ? 'story-ending verified' : 'story-ending'}>
        {entry.verified ? ENDINGS.verified : ENDINGS.later}
      </p>
    </div>
  )
}
