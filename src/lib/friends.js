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

// ---------- Weather mood ----------
// The sky on the Friends screen shows how the month's race is going.
// Rain is never a punishment: it always comes with a rainbow or kind words.
//
// players: [{ name, count, isMe }] (the friends leaderboard)
// Returns { mood, sub, text } where mood is one of:
//   'golden'  you lead by 2 or more        'clouds'  you lead by 0-1 (or a tie)
//   'wind'    1-2 spots behind first        'drizzle' 3 or more behind
//   'rain'    you have no spots this month
export function weatherMood(players) {
  const me = players.find((p) => p.isMe)
  const others = players.filter((p) => !p.isMe)
  const mine = me?.count ?? 0
  const spots = (n) => `${n} ${n === 1 ? 'spot' : 'spots'}`

  if (mine === 0) {
    return {
      mood: 'rain',
      sub: '0 spots this month',
      text: 'A rainy evening in Lisbon. The cafés are warm. Your first spot is waiting.',
    }
  }
  if (others.length === 0) {
    return { mood: 'golden', sub: `${spots(mine)} this month`, text: 'Sunshine over Lisbon! Add a friend to start the race.' }
  }

  const best = others.reduce((a, b) => (b.count > a.count ? b : a))
  if (mine > best.count) {
    const lead = mine - best.count
    if (lead >= 2) return { mood: 'golden', sub: `#1 · ${spots(lead)} ahead`, text: 'Golden hour over Lisbon. The city is yours.' }
    return { mood: 'clouds', sub: `#1 · ${spots(lead)} ahead`, text: `Still in the sun… but ${best.name} is right behind you.` }
  }
  if (mine === best.count) {
    return { mood: 'clouds', sub: `Tied with ${best.name}`, text: `Clouds are gathering. One more spot and you pull ahead of ${best.name}.` }
  }
  const behind = best.count - mine
  if (behind <= 2) {
    return { mood: 'wind', sub: `${spots(behind)} behind ${best.name}`, text: 'The wind is turning. One more spot and the sun breaks through.' }
  }
  return { mood: 'drizzle', sub: `${spots(behind)} behind ${best.name}`, text: 'Soft rain on the rooftops. Look, a rainbow over Alfama…' }
}
