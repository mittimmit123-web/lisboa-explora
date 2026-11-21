// Postcards (issue #33): in every new neighbourhood, the player's photo
// becomes a postcard for their Explora's album. The back of each postcard is
// that neighbourhood's story chapter.
import { fitWithin } from './photo.js'

export const ALBUM_SIZE = 24 // one postcard per Lisbon parish
export const POSTCARD_PX = 480 // a postcard photo is at most this wide or high

// The album as 24 slots: slot i holds the i-th unlocked chapter, or null.
// unlocked: the list from unlockedChapters() in src/lib/story.js
export function albumSlots(unlocked, size = ALBUM_SIZE) {
  return Array.from({ length: size }, (_, i) => unlocked[i] ?? null)
}

// "21 Nov 2026" for the postmark
export function postmarkDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Makes a small JPEG (as text, a "data URL") from the photo, for the
// postcard in demo mode, where photos are kept in this browser only.
// Returns null if the browser can't do it.
export async function makePostcardPhoto(file) {
  try {
    const image = await createImageBitmap(file)
    const { width, height } = fitWithin(image.width, image.height, POSTCARD_PX)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(image, 0, 0, width, height)
    image.close()
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}
