// The intro on the first opening of the app (issue #33).
// Plain logic only, tested in tests/intro.test.js. The 3D scene is in
// src/lib/introScene.js and the screens in src/components/Intro*.jsx.
//
// The intro has six steps:
//   welcome   Trammy, the app's host, rolls in and cheers ("Lisboa Explora")
//   purpose   Trammy explains why the app exists (most people only know their
//             own neighbourhood; Lisbon has 24) and how it works
//   pick      the player chooses their Explora
//   prologue  the chosen Explora says hello and asks "Will you show me around?"
//   name      it asks what to call you: the name your friends will see
//   album     it explains the postcard album: your photo becomes a postcard
//             in every new neighbourhood, 24 in total
// Then the guided tour starts (src/lib/tour.js).
export const STEPS = ['welcome', 'purpose', 'pick', 'prologue', 'name', 'album']

// Watching the intro again (the "?" button on the map) shows only the story:
// the player already has an Explora and a name, so those steps are skipped.
export const REPLAY_STEPS = ['welcome', 'purpose', 'prologue', 'album']

export function nextStep(step, replay = false) {
  const steps = replay ? REPLAY_STEPS : STEPS
  const i = steps.indexOf(step)
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : 'done'
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
//   hello 0.8 - 6    its first words (shy); 5 seconds, enough time to read them
//   ask   6 - …      "Will you show me around?" + Yes button; waits for the answer
//   joy   after Yes  jumps for joy, then the next step starts at PROLOGUE_END
export const HELLO_END = 6
export const PROLOGUE_HOLD = HELLO_END + 1.2
export const PROLOGUE_JOY = HELLO_END + 1.6
export const PROLOGUE_END = HELLO_END + 3.4

export function prologuePhase(t, answered = false) {
  if (answered && t >= PROLOGUE_JOY) return 'joy'
  if (t < 0.8) return 'enter'
  if (t < HELLO_END) return 'hello'
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

// ---------- the "welcome back" card: once per day ----------
// The splash with the Explora shows on every opening; the welcome card only
// on the first opening of each day, so it never gets in the way.
const WELCOME_KEY = 'lisboa-explora-welcome-day'
const today = (now) => `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`

export function welcomeDue(storage = globalThis.localStorage, now = new Date()) {
  try {
    return storage?.getItem(WELCOME_KEY) !== today(now)
  } catch {
    return false // storage blocked: skip the card rather than show it every time
  }
}

export function markWelcomed(storage = globalThis.localStorage, now = new Date()) {
  try {
    storage?.setItem(WELCOME_KEY, today(now))
  } catch {
    // storage blocked: nothing to remember
  }
}
