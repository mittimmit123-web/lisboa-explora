// What the player may add to a check-off besides the photo: a short note and
// a rating. Both are optional - a check-off needs nothing but the spot.
//
// These are the SAME rules the server applies in public.check_off
// (supabase/schema.sql). This copy exists so the screen can show the limit
// while typing and never send something the server would refuse. The server
// stays the one that decides, exactly like the "verified on site" mark.

export const MAX_NOTE_LENGTH = 500
export const MIN_RATING = 1
export const MAX_RATING = 5

// "  " -> null, "  Great view  " -> "Great view", anything longer is cut.
// Returns null when there is nothing worth saving.
export function cleanJournalNote(note) {
  if (typeof note !== 'string') return null
  const trimmed = note.trim()
  if (trimmed === '') return null
  return trimmed.slice(0, MAX_NOTE_LENGTH)
}

// Returns 1 to 5, or null for "no rating". Anything else - a half star, a
// string, a number out of range - becomes null rather than an error, because
// a rating is optional and should never block a check-off.
export function cleanRating(rating) {
  if (!Number.isInteger(rating)) return null
  if (rating < MIN_RATING || rating > MAX_RATING) return null
  return rating
}

// How many characters are left, for the hint under the text field.
export function charactersLeft(note) {
  return MAX_NOTE_LENGTH - (typeof note === 'string' ? note.trim().length : 0)
}
