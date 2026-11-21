// The intro on the first opening of the app (issue #33).
// Plain logic only, tested in tests/intro.test.js. The 3D scene is in
// src/lib/introScene.js and the screens in src/components/Intro*.jsx.
//
// The intro has four steps:
//   welcome   Trammy, the app's host, rolls in and cheers ("Lisboa Explora")
//   pick      the player chooses their Explora
//   prologue  the chosen Explora says hello and asks "Will you show me around?"
//   tiles     it explains the tile map: one tile per neighbourhood, 24 in total
// Then the guided tour starts (src/lib/tour.js).
export const STEPS = ['welcome', 'pick', 'prologue', 'tiles']

export function nextStep(step) {
  const i = STEPS.indexOf(step)
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : 'done'
}

// ---------- welcome film (seconds) ----------
//   arrive 0 - 1.4   Trammy rolls in from far away and grows
//   cheer  1.4 - …   "Lisboa Explora", "Ding ding!"; goes on to the next step at WELCOME_END
export const WELCOME_END = 4.6

export function welcomePhase(t) {
  return t < 1.4 ? 'arrive' : 'cheer'
}

// ---------- prologue film (seconds) ----------
//   enter 0 - 0.8    the Explora pops in
//   hello 0.8 - 3.2  its first words (shy)
//   ask   3.2 - …    "Will you show me around?" + Yes button; waits for the answer
//   joy   after Yes  jumps for joy, then the tile map step starts at PROLOGUE_END
export const PROLOGUE_HOLD = 4.4
export const PROLOGUE_JOY = 4.8
export const PROLOGUE_END = 6.6

export function prologuePhase(t, answered = false) {
  if (answered && t >= PROLOGUE_JOY) return 'joy'
  if (t < 0.8) return 'enter'
  if (t < 3.2) return 'hello'
  return 'ask'
}

// Move the prologue forward by dt seconds. Before the answer it waits at
// PROLOGUE_HOLD (the Explora keeps blinking, so it still looks alive);
// after the answer it continues from PROLOGUE_JOY.
export function advancePrologue(t, dt, answered) {
  if (answered) return Math.max(t, PROLOGUE_JOY) + dt
  return Math.min(t + dt, PROLOGUE_HOLD)
}

// ---------- show the intro only the first time ----------
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
