// Person 3: Login (only shown when Supabase is configured)
import { useState } from 'react'
import { sendLoginLink } from '../lib/api.js'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      await sendLoginLink(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="screen login">
      <div className="content">
        <h1 className="hero">Collect Lisbon, one spot at a time.</h1>
        {sent ? (
          <p>Check your inbox: we sent a login link to {email}.</p>
        ) : (
          <form className="card" onSubmit={submit}>
            <label htmlFor="login-email">
              <strong>Your email</strong>
            </label>
            <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="primary" type="submit">
              Send login link
            </button>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
