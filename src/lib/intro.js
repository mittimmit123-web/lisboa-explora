// The intro on the first opening of the app (issue #33).
// Plain logic only, tested in tests/intro.test.js. The 3D scene is in
// src/lib/introScene.js and the screen in src/components/IntroScreen.jsx.

// The intro is a short "film" with a timeline in seconds:
//   arrive   0   - 1.4  the tram rolls in from far away and grows
//   welcome  1.4 - 4.6  it cheers: "Lisboa Explora", "Ding ding!"
//   turn     4.6 - 5.6  it calms down and looks around
//   hello    5.6 - 7.6  "Olá! I just arrived… everything is so big!"
//   ask      7.6 - …    "Will you show me around?" + the Yes button.
//                       The film waits here until the player answers.
//   joy      after "Yes": it jumps for joy, then the app opens
export const TIMELINE = [
  { phase: 'arrive', from: 0 },
  { phase: 'welcome', from: 1.4 },
  { phase: 'turn', from: 4.6 },
  { phase: 'hello', from: 5.6 },
  { phase: 'ask', from: 7.6 },
]

// While waiting for the answer, the film stops moving forward at this time
// (the tram keeps blinking and swaying, so it still looks alive).
export const ASK_HOLD = 8.8
// After "Yes" the film jumps here and plays the happy ending...
export const JOY_START = 9.2
// ...and the app opens at this time.
export const INTRO_END = 11

// Which part of the intro is playing at film time t.
export function phaseAt(t, answered = false) {
  if (answered && t >= JOY_START) return 'joy'
  let current = TIMELINE[0].phase
  for (const step of TIMELINE) if (t >= step.from) current = step.phase
  return current
}

// Move the film forward by dt seconds. Before the answer it waits at
// ASK_HOLD; after the answer it continues from JOY_START.
export function advance(t, dt, answered) {
  if (answered) return Math.max(t, JOY_START) + dt
  return Math.min(t + dt, ASK_HOLD)
}

// Show the intro only the first time. Saved in this browser.
const KEY = 'lisboa-explora-intro-seen'

export function hasSeenIntro(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(KEY) === 'yes'
  } catch {
    return false // storage blocked: show the intro (it can be skipped)
  }
}

export function markIntroSeen(storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, 'yes')
  } catch {
    // storage blocked: the intro may show again next time, that's fine
  }
}
