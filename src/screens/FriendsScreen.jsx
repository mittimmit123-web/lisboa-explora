// Person 4: Friends & leaderboard — the competitive part of the game.
import { useCallback, useEffect, useState } from 'react'
import { addFriend, answerFriendRequest, getCharacter, getFriendRequests, getFriendsLeaderboard, getUser, setDisplayName } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import WeatherScene from '../components/WeatherScene.jsx'
import { addFriendMessage, answerMessage, friendEmailProblem, moreWaiting, NAME_MAX, nameProblem, nameResultMessage, playerLabel, titleLine, weatherMood, withTitles } from '../lib/friends.js'
import { rankPlayers } from '../lib/progress.js'

const MEDALS = ['🥇', '🥈', '🥉']
const NOTE_SECONDS = 4
const MONTH = new Date().toLocaleString('en', { month: 'long' })

export default function FriendsScreen({ newThisMonth, myHoodCounts }) {
  const [players, setPlayers] = useState(null) // null = still loading
  const [rankBy, setRankBy] = useState('count') // 'count' (spots this month) | 'neighbourhoods'
  const [loadError, setLoadError] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null) // { ok, text }
  const [newName, setNewName] = useState(null) // null = not editing
  const [nameNote, setNameNote] = useState(null) // { ok, text }
  const [requests, setRequests] = useState([]) // friend requests sent to me: [{ fromId, name }]
  const [requestNote, setRequestNote] = useState(null) // { ok, text }

  const load = useCallback(() => {
    getFriendsLeaderboard(newThisMonth, myHoodCounts)
      .then((rows) => setPlayers(withTitles(rows)))
      .catch(() => setLoadError(true))
  }, [newThisMonth, myHoodCounts])

  useEffect(load, [load])

  // Requests are extra: if they can't load, the rest of the screen still works.
  const loadRequests = useCallback(() => {
    getFriendRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
  }, [])

  useEffect(loadRequests, [loadRequests])

  // A green "friends now" message goes away by itself after 4 seconds (it fades
  // out in the last moment, see .note.fade-out). Errors stay so they can be read.
  useEffect(() => {
    if (!requestNote?.ok) return
    const timer = setTimeout(() => setRequestNote(null), NOTE_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [requestNote])

  async function answer(request, accept) {
    setBusy(true)
    const message = await answerFriendRequest(request.fromId, accept)
      .then((result) => answerMessage({ name: request.name, accept, result }))
      .catch((error) => answerMessage({ name: request.name, accept, error }))
    setBusy(false)
    setRequestNote(message)
    loadRequests()
    if (accept && message.ok) load()
  }

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
    const message = await setDisplayName(newName)
      .then((result) => nameResultMessage({ result }))
      .catch((error) => nameResultMessage({ error }))
    setBusy(false)
    setNameNote(message)
    if (!message.ok) return
    setNewName(null)
    load()
  }

  const nextRequest = requests[0] // oldest first
  const ranked = players && rankPlayers(players, rankBy)
  const onlyMe = players && players.length <= 1
  // The sky shows how this month's race is going (null while loading).
  const weather = players ? weatherMood(players) : null

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Friends</h1>
      </header>
      <div className="content">
        {(requests.length > 0 || requestNote) && (
          <section className="card requests" aria-label="Friend requests">
            {/* One request at a time (the oldest); the counter shows how many are waiting */}
            {nextRequest && (
              <>
                <h2 className="section-label request-head">
                  ✉️ Friend requests
                  {requests.length > 1 && <span className="request-count">{requests.length}</span>}
                </h2>
                <div className="request">
                  <span className="avatar" aria-hidden="true">
                    {(nextRequest.name || '?')[0].toUpperCase()}
                  </span>
                  <span className="name">
                    {nextRequest.name}
                    <small className="muted">wants to be your friend</small>
                  </span>
                  <div className="request-buttons">
                    <button className="primary small" type="button" disabled={busy} onClick={() => answer(nextRequest, true)}>
                      Accept
                    </button>
                    <button className="secondary" type="button" disabled={busy} onClick={() => answer(nextRequest, false)}>
                      Deny
                    </button>
                  </div>
                </div>
                {requests.length > 1 && <p className="muted request-more">{moreWaiting(requests.length - 1)}</p>}
              </>
            )}
            {requestNote && (
              <p className={requestNote.ok ? 'note ok fade-out' : 'note error'} role="status">
                {requestNote.text}
              </p>
            )}
          </section>
        )}

        <WeatherScene mood={weather?.mood} sub={weather?.sub} text={weather?.text} buddy={getCharacter()} />

        <h2 className="section-label">🏆 Leaderboard</h2>
        <div className="row" role="group" aria-label="Rank by">
          <button type="button" className={rankBy === 'count' ? 'chip selected' : 'chip'} aria-pressed={rankBy === 'count'} onClick={() => setRankBy('count')}>
            📍 Spots in {MONTH}
          </button>
          <button type="button" className={rankBy === 'neighbourhoods' ? 'chip selected' : 'chip'} aria-pressed={rankBy === 'neighbourhoods'} onClick={() => setRankBy('neighbourhoods')}>
            🗺️ Neighbourhoods
          </button>
        </div>
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
            {ranked.map((p) => (
              <li key={`${p.rank}-${p.name}`} className={p.isMe ? 'me' : undefined}>
                <span className="rank">{MEDALS[p.rank - 1] ?? p.rank}</span>
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
                    <span className="name">
                      {playerLabel(p)}
                      {p.titles.length > 0 && (
                        <small className="player-title">
                          {titleLine(p.titles)}
                        </small>
                      )}
                    </span>
                    {p.isMe && (
                      <button className="icon-btn edit-name" type="button" aria-label="Change your name" onClick={() => editName(p.name === 'You' ? '' : p.name)}>
                        ✏️
                      </button>
                    )}
                    <strong>{rankBy === 'count' ? p.count : `${p.neighbourhoods}/24`}</strong>
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
        {onlyMe ? (
          <p className="muted">Add a friend below to start the race for this month.</p>
        ) : (
          players && <p className="muted">👑 Whoever has the most spots in a neighbourhood rules it, until a friend collects more there.</p>
        )}

        <form className="card" onSubmit={submit} noValidate>
          <label htmlFor="friend-email">
            <strong>Add a friend</strong>
          </label>
          <p className="muted">They get a request and decide if they want to be friends.</p>
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
              {busy ? 'Sending…' : 'Send'}
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
