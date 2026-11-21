// Small helpers for the Friends screen. Plain functions, tested in
// tests/friends.test.js.

// The name shown in the leaderboard. In demo mode "me" is literally called
// "You", so we must not turn it into "You (you)".
export function playerLabel(player) {
  if (!player.isMe) return player.name
  if (!player.name || player.name.trim().toLowerCase() === 'you') return 'You'
  return `${player.name} (you)`
}

// Step 1, BEFORE asking the server: is there a problem we can see right away?
// Returns a message { ok: false, text } or null if the email can be sent.
export function friendEmailProblem({ email, myEmail, demo }) {
  const clean = (email ?? '').trim().toLowerCase()
  if (!clean) return { ok: false, text: 'Type your friend’s email address first.' }
  if (myEmail && clean === myEmail.trim().toLowerCase()) {
    return { ok: false, text: 'That’s your own email. Add a friend’s email instead.' }
  }
  if (demo) {
    return { ok: false, text: 'Friends can’t be added in demo mode. The players above are examples.' }
  }
  return null
}

// Step 2, AFTER asking the server: what to tell the player.
// result = what addFriend() returned ({ ok: true } or { ok: false })
// error  = set if the request itself failed (no internet, server down)
export function addFriendMessage({ email, result, error }) {
  if (error) return { ok: false, text: 'Couldn’t add your friend. Check your internet and try again.' }
  if (result?.ok) return { ok: true, text: `Added! You and ${email.trim()} can now see each other’s spots this month.` }
  return {
    ok: false,
    text: 'No player has that email yet. Ask your friend to sign up for Lisboa Explora first, then try again.',
  }
}
