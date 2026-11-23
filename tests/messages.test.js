import { describe, expect, it } from 'vitest'
import { checkOffErrorMessage } from '../src/lib/messages.js'

describe('checkOffErrorMessage', () => {
  it('explains each known reason', () => {
    expect(checkOffErrorMessage({ reason: 'already_collected' })).toBe('You already have this spot.')
    expect(checkOffErrorMessage({ reason: 'not_logged_in' })).toBe("You've been logged out. Please log in again.")
    expect(checkOffErrorMessage({ reason: 'bad_photo' })).toBe("We couldn't use this photo. Please take a new one.")
    expect(checkOffErrorMessage({ reason: 'photo_too_big' })).toBe('This photo is too big. Please take a new one.')
    expect(checkOffErrorMessage({ reason: 'note_too_long' })).toBe(
      'Your note is too long. Please keep it under 500 characters.',
    )
    expect(checkOffErrorMessage({ reason: 'bad_rating' })).toBe('Please choose between 1 and 5 stars.')
    expect(checkOffErrorMessage({ reason: 'unknown_spot' })).toBe(
      "This spot isn't available right now. Please try again later.",
    )
    expect(checkOffErrorMessage({ reason: 'upload_failed' })).toBe(
      "The photo couldn't be uploaded. Check your internet and try again.",
    )
    expect(checkOffErrorMessage({ reason: 'server_error' })).toBe(
      'Something went wrong on our side. Please try again in a moment.',
    )
  })

  it('uses the general message for a reason it does not know', () => {
    expect(checkOffErrorMessage({ reason: 'something_new' })).toBe(
      'Something went wrong on our side. Please try again in a moment.',
    )
  })
})
