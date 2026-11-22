// A postcard made from the player's own photo (issue #33).
// Front: the photo, the neighbourhood's name and a stamp (golden if the spot
// was verified on site). Back: the story chapter, written by the Explora.
// Without a photo, the front is a colourful illustration with the name.
import { useEffect, useState } from 'react'
import { FACTS } from '../data/facts.js'
import { ENDINGS } from '../data/story.js'
import { categoryById } from '../data/categories.js'
import { getPhotoUrl } from '../lib/api.js'
import { postmarkDate } from '../lib/postcards.js'
import { fillStory } from '../lib/story.js'

// The photo link: in demo mode it is saved with the check-off, in real mode
// the server gives a temporary link.
function usePhoto(checkOff) {
  const [url, setUrl] = useState(checkOff?.photo_thumb ?? null)
  useEffect(() => {
    let alive = true
    getPhotoUrl(checkOff).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [checkOff])
  return url
}

export function PostcardFront({ entry, mini = false }) {
  const photo = usePhoto(entry.checkOff)
  const color = categoryById(entry.spot?.category)?.color ?? '#6b5b95'
  return (
    <div className={mini ? 'postcard-front mini' : 'postcard-front'}>
      {photo ? (
        <img src={photo} alt={mini ? '' : `Your photo of ${entry.spot?.name ?? entry.place}`} />
      ) : (
        <div className="postcard-art" style={{ '--pc': color }} aria-hidden="true" />
      )}
      <span className="postcard-place">{entry.place}</span>
      <span className={entry.verified ? 'postcard-stamp gold' : 'postcard-stamp'} aria-hidden="true">
        {entry.verified ? '★' : entry.number}
      </span>
    </div>
  )
}

export function PostcardBack({ entry, explora }) {
  const values = { buddy: explora?.name, pronouns: explora?.pronouns, place: entry.place }
  return (
    <div className="postcard-back">
      <div className="postcard-write">
        <strong>
          {entry.number}. {entry.chapter.title}
        </strong>
        <p>{fillStory(entry.chapter.text, values)}</p>
        {FACTS[entry.place] && <p className="story-fact">💡 {FACTS[entry.place]}</p>}
        <p className={entry.verified ? 'story-ending verified' : 'story-ending'}>
          {entry.verified ? ENDINGS.verified : ENDINGS.later}
        </p>
        <span className="postcard-sign">— {explora?.name ?? 'your Explora'}</span>
      </div>
      <div className="postcard-address" aria-hidden="true">
        <span className="postcard-postmark">
          LISBOA
          <br />
          {postmarkDate(entry.date)}
        </span>
        <span className="postcard-line">{entry.spot?.name ?? entry.place}</span>
        <span className="postcard-line">{entry.place}</span>
        <span className="postcard-line">Lisboa, Portugal</span>
      </div>
    </div>
  )
}

// The big postcard you can turn over (front <-> back).
export default function Postcard({ entry, explora, startFlipped = false }) {
  const [flipped, setFlipped] = useState(startFlipped)
  return (
    <div className="postcard-wrap">
      <div className={flipped ? 'postcard flipped' : 'postcard'}>
        <div className="postcard-side front" aria-hidden={flipped}>
          <PostcardFront entry={entry} />
        </div>
        <div className="postcard-side back" aria-hidden={!flipped}>
          <PostcardBack entry={entry} explora={explora} />
        </div>
      </div>
      <button className="secondary postcard-turn" type="button" onClick={() => setFlipped(!flipped)}>
        {flipped ? '↺ See the photo' : '↻ Turn over to read'}
      </button>
    </div>
  )
}
