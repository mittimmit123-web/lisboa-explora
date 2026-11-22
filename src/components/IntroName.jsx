// Intro step 4: the Explora asks what to call you. This is the name your
// friends see on the leaderboard (it can be changed later on the Friends tab).
// The server checks it: 2-20 characters and not taken by another player.
import { lazy, Suspense, useState } from 'react'
import { setDisplayName } from '../lib/api.js'
import { characterById } from '../lib/characters.js'
import { NAME_MAX, nameProblem, nameResultMessage } from '../lib/friends.js'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

export default function IntroName({ actorId, onDone }) {
  const explora = characterById(actorId)
  const [name, setName] = useState('')
  const [note, setNote] = useState(null) // { ok, text }
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    const problem = nameProblem(name)
    if (problem) return setNote(problem)
    setBusy(true)
    const message = await setDisplayName(name)
      .then((result) => nameResultMessage({ result }))
      .catch((error) => nameResultMessage({ error }))
    setBusy(false)
    if (message.ok) onDone()
    else setNote(message)
  }

  return (
    <form className="intro-tiles" onSubmit={save} noValidate>
      <button className="intro-skip" type="button" onClick={onDone}>
        Skip
      </button>
      <div className="intro-tiles-who">
        <Suspense fallback={<span className="buddy-avatar buddy-placeholder" aria-hidden="true" />}>
          <BuddyAvatar id={explora.id} />
        </Suspense>
        <p className="intro-tiles-bubble">Yay! 🎉 By the way… what should I call you?</p>
      </div>
      <input
        className="intro-name-input"
        type="text"
        aria-label="Your name or nickname"
        placeholder="Your name or nickname"
        autoComplete="nickname"
        maxLength={NAME_MAX}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setNote(null)
        }}
      />
      {note && (
        <p className="note error" role="status">
          {note.text}
        </p>
      )}
      <p className="intro-name-hint">Your friends will see this name on the leaderboard.</p>
      <button className="intro-choose" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'That’s me!'}
      </button>
    </form>
  )
}
