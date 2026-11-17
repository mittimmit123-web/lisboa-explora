// Person 4: Friends & leaderboard
import { useEffect, useState } from 'react'
import { addFriend, getFriendsLeaderboard } from '../lib/api.js'
import { rankPlayers } from '../lib/progress.js'

export default function FriendsScreen({ newThisMonth }) {
  const [players, setPlayers] = useState([])
  const [email, setEmail] = useState('')
  const [note, setNote] = useState(null)

  useEffect(() => {
    getFriendsLeaderboard(newThisMonth).then((rows) => setPlayers(rankPlayers(rows)))
  }, [newThisMonth])

  async function submit(e) {
    e.preventDefault()
    const result = await addFriend(email)
    setNote(result?.ok ? 'Friend added.' : 'No player with that email.')
    setEmail('')
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Friends</h1>
      </header>
      <div className="content">
        <h2 className="section-label">New spots this month · live</h2>
        <ol className="leaderboard">
          {players.map((p) => (
            <li key={p.name} className={p.isMe ? 'me' : undefined}>
              <span className="rank">{p.rank}</span>
              <span className="avatar">{p.name[0]}</span>
              <span className="name">{p.isMe ? `${p.name} (you)` : p.name}</span>
              <strong>{p.count}</strong>
            </li>
          ))}
        </ol>

        <form className="card" onSubmit={submit}>
          <label htmlFor="friend-email">
            <strong>Add a friend</strong>
          </label>
          <div className="row">
            <input
              id="friend-email"
              type="email"
              required
              placeholder="friend@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="primary small" type="submit">
              Add
            </button>
          </div>
          {note && <p className="muted">{note}</p>}
        </form>
      </div>
    </div>
  )
}
