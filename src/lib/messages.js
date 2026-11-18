// Messages the player sees when a check-off does not work.
//
// The server (or api.js) answers with a short code called `reason`,
// e.g. 'upload_failed'. This function turns that code into a sentence
// that tells the player what happened and what to do next.

const MESSAGES = {
  already_collected: 'You already have this spot.',
  not_logged_in: "You've been logged out. Please log in again.",
  bad_photo: "We couldn't use this photo. Please take a new one.",
  photo_too_big: 'This photo is too big. Please take a new one.',
  unknown_spot: "This spot isn't available right now. Please try again later.",
  upload_failed: "The photo couldn't be uploaded. Check your internet and try again.",
  server_error: 'Something went wrong on our side. Please try again in a moment.',
}

// Being far away is NOT an error: since #16 a spot can always be added,
// it just doesn't get the "verified on site" mark.
//
// result: what checkOff() returned, e.g. { ok: false, reason: 'upload_failed' }
export function checkOffErrorMessage(result) {
  // Any code we don't know gets the general "server_error" message.
  return MESSAGES[result.reason] ?? MESSAGES.server_error
}
