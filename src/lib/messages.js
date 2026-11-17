// Messages the player sees when a check-off does not work.
//
// The server (or api.js) answers with a short code called `reason`,
// e.g. 'upload_failed'. This function turns that code into a sentence
// that tells the player what happened and what to do next.

import { CHECK_RADIUS_M, formatDistance } from './geo.js'

const MESSAGES = {
  already_collected: 'You already have this spot.',
  not_logged_in: "You've been logged out. Please log in again.",
  bad_photo: "We couldn't use this photo. Please take a new one.",
  unknown_spot: "This spot isn't available right now. Please try again later.",
  upload_failed: "The photo couldn't be uploaded. Check your internet and try again.",
  server_error: 'Something went wrong on our side. Please try again in a moment.',
}

// result: what checkOff() returned, e.g. { ok: false, reason: 'too_far', distance: 120 }
export function checkOffErrorMessage(result) {
  // This one needs the distance in the sentence, so it is built here.
  if (result.reason === 'too_far') {
    return `You are ${formatDistance(result.distance)} away. Get within ${CHECK_RADIUS_M} m.`
  }
  // Any code we don't know gets the general "server_error" message.
  return MESSAGES[result.reason] ?? MESSAGES.server_error
}
