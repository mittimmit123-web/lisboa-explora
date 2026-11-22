// Person 4: Friends & leaderboard — the competitive part of the game.
import { useCallback, useEffect, useState } from 'react'
import { addFriend, getCharacter, getFriendsLeaderboard, getUser, setDisplayName } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import WeatherScene from '../components/WeatherScene.jsx'
import { addFriendMessage, friendEmailProblem, NAME_MAX, nameProblem, playerLabel, weatherMood } from '../lib/friends.js'
import { rankPlayers } from '../lib/progress.js'

export default function FriendsScreen({ newThisMonth }) {
  const [players, setPlayers] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null) // { ok, text }
  const [newName, setNewName] = useState(null) // null = not editing
  const [nameNote, setNameNote] = useState(null) // { ok, text }

  const load = useCallback(() => {
    getFriendsLeaderboard(newThisMonth)
      .then((rows) => setPlayers(rankPlayers(rows)))
      .catch(() => setLoadError(true))
  }, [newThisMonth])

  useEffect(load, [load])

  async function submit(e) {
    e.preventDefault()
    const me = await getUser().catch(() => null)
    // Step 1: problems we can see without asking the server
    const problem = friendEmailProblem({ email, myEmail: me?.email, demo: isDemoMode })
    if (problem) {
      setNote(problem)
      return
    }
    // Step 2: ask the server and explain its answer
    setBusy(true)
    let outcome
    try {
      outcome = addFriendMessage({ email, result: await addFriend(email.trim()) })
    } catch (error) {
      outcome = addFriendMessage({ email, error })
    }
    setBusy(false)
    setNote(outcome)
    if (outcome.ok) {
      setEmail('')
      load()
    }
  }

  function editName(value) {
    setNewName(value)
    setNameNote(null)
  }

  async function saveName(e) {
    e.preventDefault()
    const problem = nameProblem(newName)
    if (problem) return setNameNote(problem)
    setBusy(true)
    const result = await setDisplayName(newName).catch(() => null)
    setBusy(false)
    if (!result?.ok) {
      return setNameNote(result?.reason === 'bad_name' ? nameProblem('') : { ok: false, text: 'Couldn’t save your name. Check your internet and try again.' })
    }
    setNewName(null)
    setNameNote({ ok: true, text: 'Saved! Your friends now see this name.' })
    load()
  }

  const onlyMe = players && players.length <= 1
  // The sky shows how this month's race is going (null while loading).
  const weather = players ? weatherMood(players) : null

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Friends</h1>
      </header>
      <div className="content">
        <WeatherScene mood={weather?.mood} sub={weather?.sub} text={weather?.text} buddy={getCharacter()} />

        <h2 className="section-label">New spots this month</h2>
        {loadError ? (
          <div className="status">
            Couldn’t load the leaderboard. Check your internet.{' '}
            <button
              className="link-button"
              type="button"
              onClick={() => {
                setLoadError(false)
                load()
              }}
            >
              Try again
            </button>
          </div>
        ) : players === null ? (
          <p className="muted">Loading…</p>
        ) : (
          <ol className="leaderboard">
            {players.map((p) => (
              <li key={`${p.rank}-${p.name}`} className={p.isMe ? 'me' : undefined}>
                <span className="rank">{p.rank}</span>
                <span className="avatar" aria-hidden="true">
                  {(p.name || 'Y')[0].toUpperCase()}
                </span>
                {p.isMe && newName !== null ? (
                  <form className="row name-edit" onSubmit={saveName} noValidate>
                    <input
                      type="text"
                      aria-label="Your name (what friends see)"
                      autoComplete="nickname"
                      autoFocus
                      maxLength={NAME_MAX}
                      value={newName}
                      onChange={(e) => editName(e.target.value)}
                    />
                    <button className="primary small" type="submit" disabled={busy}>
                      Save
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="name">{playerLabel(p)}</span>
                    {p.isMe && (
                      <button className="icon-btn edit-name" type="button" aria-label="Change your name" onClick={() => editName(p.name === 'You' ? '' : p.name)}>
                        ✏️
                      </button>
                    )}
                    <strong>{p.count}</strong>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
        {nameNote && (
          <p className={nameNote.ok ? 'note ok' : 'note error'} role="status">
            {nameNote.text}
          </p>
        )}
        {onlyMe && <p className="muted">Add a friend below to start the race for this month.</p>}

        <form className="card" onSubmit={submit} noValidate>
          <label htmlFor="friend-email">
            <strong>Add a friend</strong>
          </label>
          <div className="row add-friend">
            <input
              id="friend-email"
              type="email"
              autoComplete="email"
              placeholder="friend@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setNote(null)
              }}
            />
            <button className="primary small" type="submit" disabled={busy}>
              {busy ? 'Adding…' : 'Add'}
            </button>
          </div>
          {note && (
            <p className={note.ok ? 'note ok' : 'note error'} role="status">
              {note.text}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
