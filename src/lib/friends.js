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
    return { ok: false, text: 'Friend requests can’t be sent in demo mode. The players above are examples.' }
  }
  return null
}

// Step 2, AFTER asking the server: what to tell the player.
// result = what addFriend() returned ({ ok: true, status } or { ok: false })
// error  = set if the request itself failed (no internet, server down)
// The server says 'sent' even if nobody has that email (so nobody can look
// up who plays), so the message must not promise that the person exists.
export function addFriendMessage({ email, result, error }) {
  const who = (email ?? '').trim()
  if (error || !result?.ok) return { ok: false, text: 'Couldn’t send your request. Check your internet and try again.' }
  if (result.status === 'already_friends') return { ok: true, text: `You and ${who} are already friends.` }
  if (result.status === 'friends') {
    return { ok: true, text: `${who} had already asked you, so you’re friends now! 🎉` }
  }
  return {
    ok: true,
    text: `Request sent ✉️ If ${who} plays Lisboa Explora, they’ll see it in their Friends tab. Once they accept, you’re both on the leaderboard.`,
  }
}

// After tapping Accept or Deny on a request.
// result = what answerFriendRequest() returned, error = the request failed.
export function answerMessage({ name, accept, result, error }) {
  if (error || !result?.ok) return { ok: false, text: 'Couldn’t answer the request. Check your internet and try again.' }
  return accept ? { ok: true, text: `You and ${name} are friends now! 🎉` } : { ok: true, text: `Request from ${name} removed.` }
}

// Under the friend request card: how many more are waiting after this one.
export function moreWaiting(count) {
  if (count <= 0) return ''
  return count === 1 ? '1 more request waiting' : `${count} more requests waiting`
}

// ---------- Your name ----------
// Must match the check in set_display_name (supabase/schema.sql).
export const NAME_MIN = 2
export const NAME_MAX = 20

// Returns a message { ok: false, text } if the name can't be used, else null.
export function nameProblem(name) {
  const length = (name ?? '').trim().length
  if (length < NAME_MIN || length > NAME_MAX) {
    return { ok: false, text: `Please use ${NAME_MIN}–${NAME_MAX} characters.` }
  }
  return null
}

// The answer of setDisplayName as a message { ok, text }. Without a result
// (the request failed) it asks the player to check the internet.
export function nameResultMessage({ result }) {
  if (result?.ok) return { ok: true, text: 'Saved! Your friends now see this name.' }
  if (result?.reason === 'name_taken') return { ok: false, text: 'This name is already taken. Try another one!' }
  if (result?.reason === 'bad_name') return nameProblem('')
  return { ok: false, text: 'Couldn’t save your name. Check your internet and try again.' }
}

// ---------- Leaderboard: neighbourhoods and titles ----------
// Adds to every player: neighbourhoods (how many they explored) and titles
// (the neighbourhoods where they have the MOST spots of everyone; a tie means
// nobody holds that title yet, until someone collects one more).
export function withTitles(players) {
  const best = {} // neighbourhood -> { name, spots, tie }
  for (const p of players) {
    for (const [hood, spots] of Object.entries(p.hoodCounts ?? {})) {
      const b = best[hood]
      if (!b || spots > b.spots) best[hood] = { name: p.name, spots, tie: false }
      else if (spots === b.spots) b.tie = true
    }
  }
  return players.map((p) => ({
    ...p,
    neighbourhoods: Object.keys(p.hoodCounts ?? {}).length,
    // strongest title first (most spots there)
    titles: Object.keys(best)
      .filter((hood) => best[hood].name === p.name && !best[hood].tie)
      .sort((a, b) => best[b].spots - best[a].spots || a.localeCompare(b)),
  }))
}

// One short line for the leaderboard: only the strongest title, so everyone
// shows at most one crown: "👑 Ruler of Belém", or '' if none.
export function titleLine(titles) {
  return titles.length ? `👑 Ruler of ${titles[0]}` : ''
}

// ---------- remember the last weather ----------
// The leaderboard takes a moment to load. Remembering the last mood lets the
// Friends screen open with the right sky at once instead of a wrong one.
const MOOD_KEY = 'lisboa-explora-weather'
const KNOWN_MOODS = ['golden', 'clouds', 'wind', 'drizzle', 'rain']

export function rememberedMood(storage = globalThis.localStorage) {
  try {
    const mood = storage?.getItem(MOOD_KEY)
    return KNOWN_MOODS.includes(mood) ? mood : null
  } catch {
    return null // storage blocked: wait for the leaderboard instead
  }
}

export function rememberMood(mood, storage = globalThis.localStorage) {
  if (!KNOWN_MOODS.includes(mood)) return
  try {
    storage?.setItem(MOOD_KEY, mood)
  } catch {
    // storage blocked: the sky simply waits for the leaderboard next time
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
