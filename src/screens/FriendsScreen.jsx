// Person 4: Friends & leaderboard — the competitive part of the game.
import { useCallback, useEffect, useState } from 'react'
import { addFriend, getFriendsLeaderboard, getUser } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import WeatherScene from '../components/WeatherScene.jsx'
import { addFriendMessage, friendEmailProblem, playerLabel, weatherMood } from '../lib/friends.js'
import { rankPlayers } from '../lib/progress.js'

export default function FriendsScreen({ newThisMonth }) {
  const [players, setPlayers] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null) // { ok, text }

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

  const onlyMe = players && players.length <= 1
  // The sky shows how this month's race is going (null while loading).
  const weather = players ? weatherMood(players) : null

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Friends</h1>
      </header>
      <div className="content">
        <WeatherScene mood={weather?.mood} sub={weather?.sub} text={weather?.text} />

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
                <span className="name">{playerLabel(p)}</span>
                <strong>{p.count}</strong>
              </li>
            ))}
          </ol>
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
