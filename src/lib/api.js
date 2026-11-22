// Data layer: the ONLY place that talks to Supabase.
// Screens call these functions and never use `supabase` directly.
//
// Every function works in two modes:
//   - demo mode (no .env keys): data lives in localStorage, fake friends
//   - real mode: Supabase database, storage and auth

import { supabase, isDemoMode } from './supabase.js'
import { distanceMeters, isWithinRadius } from './geo.js'
import { cleanCharacterId } from './characters.js'
import { makePostcardPhoto } from './postcards.js'
import { cleanJournalNote, cleanRating as cleanRating_ } from './journal.js'

const DEMO_KEY = 'lisboa-explora-demo-checkoffs'

function readDemo() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) ?? []
  } catch {
    return []
  }
}

// Returns false if the browser could not save (blocked or full).
function writeDemo(rows) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(rows))
    return true
  } catch {
    // storage not available: demo data is lost on reload, that's fine
    return false
  }
}

// ---------- Auth ----------

export async function getUser() {
  if (isDemoMode) return { id: 'demo', email: 'demo@lisboa-explora' }
  const { data } = await supabase.auth.getUser()
  return data.user
}

export function onAuthChange(callback) {
  if (isDemoMode) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}

// Sends a login link by email (no password needed).
export async function sendLoginLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  if (!isDemoMode) await supabase.auth.signOut()
}

// ---------- Check-offs ----------

// All check-offs of the current player:
// [{ spot_id, created_at, photo_path, verified }]
export async function getMyCheckOffs() {
  if (isDemoMode) return readDemo()
  const { data, error } = await supabase
    .from('check_offs')
    .select('spot_id, created_at, photo_path, verified, note, rating')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Checks off a spot. This never fails because of distance: the spot always
// goes into the player's journal. Being within 50 m only earns the
// "verified on site" mark, which the SERVER decides.
// position: { lat, lng } from the phone's GPS, or null if there is none
// photo: a File from the camera input
// Returns { ok: true, verified, distance } or { ok: false, reason }
export async function checkOff({ spot, position, photo, note, rating }) {
  const cleanNote = cleanJournalNote(note)
  const cleanRating = cleanRating_(rating)

  if (isDemoMode) {
    const distance = position ? distanceMeters(position, spot) : null
    const verified = position ? isWithinRadius(position, spot) : false
    const rows = readDemo()
    if (rows.some((r) => r.spot_id === spot.id)) return { ok: false, reason: 'already_collected' }
    // Keep a small copy of the photo for the postcard (#33). If the browser's
    // storage is full, save the spot without the photo rather than losing it.
    const photo_thumb = photo ? await makePostcardPhoto(photo) : null
    const row = {
      spot_id: spot.id,
      created_at: new Date().toISOString(),
      photo_path: null,
      verified,
      note: cleanNote,
      rating: cleanRating,
    }
    if (!writeDemo([{ ...row, photo_thumb }, ...rows])) writeDemo([row, ...rows])
    return { ok: true, verified, distance }
  }

  // 1. Upload the photo, if there is one, to photos/<user id>/<spot id>-<time>.jpg
  let path = null
  if (photo) {
    const user = await getUser()
    path = `${user.id}/${spot.id}-${Date.now()}.jpg`
    const upload = await supabase.storage.from('photos').upload(path, photo, { contentType: photo.type })
    if (upload.error) return { ok: false, reason: 'upload_failed' }
  }

  // 2. Save the check-off. The server measures the distance, sets the
  //    "verified on site" mark and checks the note and the rating itself.
  //    The browser cannot set any of them.
  const { data, error } = await supabase.rpc('check_off', {
    p_spot_id: spot.id,
    p_lat: position?.lat ?? null,
    p_lng: position?.lng ?? null,
    p_photo_path: path,
    p_note: cleanNote,
    p_rating: cleanRating,
  })
  if (error) return { ok: false, reason: 'server_error' }
  return data // { ok, verified, distance } or { ok: false, reason }
}

// A link to show the player's own photo of a check-off on a postcard (#33),
// or null if there is none. Real mode: photos are private, so we ask the
// server for a temporary link (valid for one hour).
export async function getPhotoUrl(checkOffRow) {
  if (isDemoMode) return checkOffRow?.photo_thumb ?? null
  if (!checkOffRow?.photo_path) return null
  const { data, error } = await supabase.storage.from('photos').createSignedUrl(checkOffRow.photo_path, 3600)
  return error ? null : data.signedUrl
}

// ---------- Friends ----------

// [{ name, count, isMe }] with count = new spots this month
export async function getFriendsLeaderboard(myCount) {
  if (isDemoMode) {
    return [
      { name: readDemoName() ?? 'You', count: myCount, isMe: true },
      { name: 'Marta', count: 6 },
      { name: 'João', count: 4 },
      { name: 'Lukas', count: 2 },
    ]
  }
  const { data, error } = await supabase.rpc('friends_leaderboard')
  if (error) throw error
  return data.map((row) => ({ name: row.display_name, count: row.new_this_month, isMe: row.is_me }))
}

// Changes the name friends see. Returns { ok: true } or { ok: false, reason }.
// The server checks the name (2-20 characters), see set_display_name.
const DEMO_NAME_KEY = 'lisboa-explora-demo-name'
function readDemoName() {
  try {
    return localStorage.getItem(DEMO_NAME_KEY)
  } catch {
    return null
  }
}
export async function setDisplayName(name) {
  if (isDemoMode) {
    localStorage.setItem(DEMO_NAME_KEY, name.trim())
    return { ok: true }
  }
  const { data, error } = await supabase.rpc('set_display_name', { p_name: name })
  if (error) throw error
  return data
}

// Sends a friend request by email address.
export async function addFriend(email) {
  if (isDemoMode) return { ok: true }
  const { data, error } = await supabase.rpc('add_friend', { p_email: email })
  if (error) throw error
  return data
}

// ---------- Buddy character (issue #20) ----------
// For now the choice is saved in this browser only, in both modes.
// TODO (Person 3): add a `character` column to profiles and save it there,
// so friends can see each other's buddy. Only these two functions change.
const CHARACTER_KEY = 'lisboa-explora-character'

// Returns 'tram' | 'sardine' | 'cat' or null if none was chosen yet.
export function getCharacter() {
  try {
    return cleanCharacterId(localStorage.getItem(CHARACTER_KEY))
  } catch {
    return null // storage blocked (private mode): just no buddy yet
  }
}

export function setCharacter(id) {
  const clean = cleanCharacterId(id)
  if (!clean) return null
  try {
    localStorage.setItem(CHARACTER_KEY, clean)
  } catch {
    // storage blocked: the choice lasts until the page is reloaded
  }
  return clean
}
