// Logic for the story "Showing your buddy around" (issue #32).
// Plain functions, tested in tests/story.test.js.

// Which chapters are unlocked, in order.
// Chapter 1 belongs to the first neighbourhood you ever visited, chapter 2 to
// the second NEW one, and so on. Spots outside the city (not in the
// neighbourhood list) don't unlock a chapter.
//
// Returns [{ number, chapter, place, date, verified }] (oldest first).
// verified = the spot that opened this neighbourhood was verified on site.
export function unlockedChapters(checkOffs, spots, neighbourhoods, chapters) {
  const spotById = new Map(spots.map((s) => [s.id, s]))
  const firstVisits = []
  const seen = new Set()
  const oldestFirst = [...checkOffs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  for (const c of oldestFirst) {
    const place = spotById.get(c.spot_id)?.neighbourhood
    if (!place || !neighbourhoods.includes(place) || seen.has(place)) continue
    seen.add(place)
    firstVisits.push({ place, date: new Date(c.created_at), verified: c.verified === true })
  }
  return firstVisits.slice(0, chapters.length).map((visit, i) => ({
    number: i + 1,
    chapter: chapters[i],
    ...visit,
  }))
}

// Fill in {buddy} and {place}. Without a chosen Explora the story says
// "your Explora" (and "Your Explora" at the start of a sentence).
export function fillStory(text, { buddy, place }) {
  const name = buddy || 'your Explora'
  return text
    .replace(/(^|[.!?]["”]?\s+)\{buddy\}/g, (_, before) => before + (buddy || 'Your Explora'))
    .replaceAll('{buddy}', name)
    .replaceAll('{place}', place ?? 'Lisbon')
}

// The part (e.g. "Saudade") a chapter number belongs to.
export function partFor(number, parts) {
  return [...parts].reverse().find((p) => number >= p.from) ?? parts[0]
}

// Did the latest check-off unlock a new chapter? Looks for the neighbourhood
// that wasn't unlocked before. Returns that chapter or null.
export function newlyUnlocked(before, after) {
  const known = new Set(before.map((e) => e.place))
  return after.find((e) => !known.has(e.place)) ?? null
}
