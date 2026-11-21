// Data layer: the ONLY place that talks to Supabase.
// Screens call these functions and never use `supabase` directly.
//
// Every function works in two modes:
//   - demo mode (no .env keys): data lives in localStorage, fake friends
//   - real mode: Supabase database, storage and auth

import { supabase, isDemoMode } from './supabase.js'
import { distanceMeters, isWithinRadius } from './geo.js'

const DEMO_KEY = 'lisboa-explora-demo-checkoffs'

function readDemo() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) ?? []
  } catch {
    return []
  }
}

function writeDemo(rows) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(rows))
  } catch {
    // storage not available: demo data is lost on reload, that's fine
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
    .select('spot_id, created_at, photo_path, verified')
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
export async function checkOff({ spot, position, photo }) {
  if (isDemoMode) {
    const distance = position ? distanceMeters(position, spot) : null
    const verified = position ? isWithinRadius(position, spot) : false
    const rows = readDemo()
    if (rows.some((r) => r.spot_id === spot.id)) return { ok: false, reason: 'already_collected' }
    writeDemo([
      { spot_id: spot.id, created_at: new Date().toISOString(), photo_path: null, verified },
      ...rows,
    ])
    return { ok: true, verified, distance }
  }

  // 1. Upload the photo to storage: photos/<user id>/<spot id>-<time>.jpg
  const user = await getUser()
  const path = `${user.id}/${spot.id}-${Date.now()}.jpg`
  const upload = await supabase.storage.from('photos').upload(path, photo, { contentType: photo.type })
  if (upload.error) return { ok: false, reason: 'upload_failed' }

  // 2. Save the check-off. The server measures the distance and sets the
  //    "verified on site" mark. The browser cannot set it itself.
  const { data, error } = await supabase.rpc('check_off', {
    p_spot_id: spot.id,
    p_lat: position?.lat ?? null,
    p_lng: position?.lng ?? null,
    p_photo_path: path,
  })
  if (error) return { ok: false, reason: 'server_error' }
  return data // { ok, verified, distance } or { ok: false, reason }
}

// ---------- Friends ----------

// [{ name, count, isMe }] with count = new spots this month
export async function getFriendsLeaderboard(myCount) {
  if (isDemoMode) {
    return [
      { name: 'You', count: myCount, isMe: true },
      { name: 'Marta', count: 6 },
      { name: 'João', count: 4 },
      { name: 'Lukas', count: 2 },
    ]
  }
  const { data, error } = await supabase.rpc('friends_leaderboard')
  if (error) throw error
  return data.map((row) => ({ name: row.display_name, count: row.new_this_month, isMe: row.is_me }))
}

// Sends a friend request by email address.
export async function addFriend(email) {
  if (isDemoMode) return { ok: true }
  const { data, error } = await supabase.rpc('add_friend', { p_email: email })
  if (error) throw error
  return data
}
