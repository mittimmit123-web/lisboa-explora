import { describe, expect, it } from 'vitest'
import { checkOffErrorMessage } from '../src/lib/messages.js'

describe('checkOffErrorMessage', () => {
  it('says how far away the player is', () => {
    expect(checkOffErrorMessage({ reason: 'too_far', distance: 120 })).toBe(
      'You are 120 m away. Get within 50 m.',
    )
  })

  it('explains each known reason', () => {
    expect(checkOffErrorMessage({ reason: 'already_collected' })).toBe('You already have this spot.')
    expect(checkOffErrorMessage({ reason: 'not_logged_in' })).toBe("You've been logged out. Please log in again.")
    expect(checkOffErrorMessage({ reason: 'bad_photo' })).toBe("We couldn't use this photo. Please take a new one.")
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
