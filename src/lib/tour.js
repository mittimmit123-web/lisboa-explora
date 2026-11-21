// The guided tour after the intro (issue #33): the chosen Explora shows the
// player around the real app. Each step lights up one part of the screen.
// Plain logic only, tested in tests/tour.test.js. The screen part is
// src/components/TourOverlay.jsx.
//
// target: which element to light up (it carries data-tour="..."), or null
// tab:    which tab to open for this step
// {name}  is replaced with the Explora's name
export const TOUR_STEPS = [
  { target: 'map', tab: 'map', text: 'This is Lisbon! Every pin is a real place we can collect together.' },
  { target: 'map', tab: 'map', text: 'Walk to a pin, tap it and take a photo. If you are really there, you get a golden ⭐!' },
  { target: 'nav-collection', tab: 'collection', text: 'This is our journal: every spot, our story chapters, and our tile map of Lisbon.' },
  { target: 'nav-friends', tab: 'friends', text: 'Race your friends every month. The weather shows how you are doing!' },
  { target: null, tab: 'map', text: 'Every new neighbourhood unlocks a chapter of our story. Ready? Let’s find our first spot!' },
]

// The tour is given by the chosen Explora, or by Trammy if none was chosen.
export const TOUR_HOST = 'tram'

export function tourText(step, name) {
  return step.text.replaceAll('{name}', name || 'your Explora')
}

export function isLastStep(index) {
  return index >= TOUR_STEPS.length - 1
}

// Show the tour only once. Saved in this browser.
const KEY = 'lisboa-explora-tour-seen'

export function hasSeenTour(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(KEY) === 'yes'
  } catch {
    return false
  }
}

export function markTourSeen(storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, 'yes')
  } catch {
    // storage blocked: the tour may show again next time, that's fine
  }
}
