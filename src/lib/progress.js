// Pure functions for progress numbers. No database, no React:
// easy to test (see tests/progress.test.js).
//
// The Collection screen is the player's own journal, so it shows counts
// ("12 food spots") and neighbourhood coverage ("7 of 24"), never a ranking.
// Percentages of all spots would stay near 0% because we have ~1900 spots.

import { cleanJournalNote, cleanRating } from './journal.js'

// True if the date is in the same calendar month as `now`.
function isThisMonth(date, now) {
  const d = new Date(date)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// Number of check-offs in the same calendar month as `now`.
// Each spot counts once per player, so every check-off is a "new" spot.
export function newThisMonth(checkOffs, now = new Date()) {
  return checkOffs.filter((c) => isThisMonth(c.created_at, now)).length
}

// Numbers for the "This month" card: { count, verified }.
// verified = how many of this month's spots got the "verified on site" mark.
export function monthSummary(checkOffs, now = new Date()) {
  const thisMonth = checkOffs.filter((c) => isThisMonth(c.created_at, now))
  return {
    count: thisMonth.length,
    verified: thisMonth.filter((c) => c.verified === true).length,
  }
}

// Sort players by new spots this month, highest first, and add a rank.
// key: which number to rank by, e.g. 'count' (spots) or 'neighbourhoods'.
export function rankPlayers(players, key = 'count') {
  return [...players]
    .sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name))
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

// The newest check-offs joined with their spot, newest first.
// Returns [{ spot, date, verified }]. Check-offs for unknown spots are skipped.
export function recentlyCollected(checkOffs, spots, limit = 5) {
  return [...checkOffs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((c) => ({
      spot: spots.find((s) => s.id === c.spot_id),
      date: new Date(c.created_at),
      verified: c.verified === true,
      // Both optional, and missing on entries made before they existed.
      note: cleanJournalNote(c.note),
      rating: cleanRating(c.rating),
    }))
    .filter((item) => item.spot)
    .slice(0, limit)
}

// How many collected spots per category, in the order of `categories`.
// Returns [{ id, label, color, count }], including categories with 0.
export function categoryCounts(spots, collectedIds, categories) {
  return categories.map((cat) => ({
    ...cat,
    count: spots.filter((s) => s.category === cat.id && collectedIds.has(s.id)).length,
  }))
}

// Which of the city's neighbourhoods the player has been to.
// Returns { visited, total, list } where list = [{ name, count }] in the order
// of `neighbourhoods` and count = collected spots there. Spots outside the
// list (e.g. the campus in Carcavelos) are ignored here.
// How many spots the player has in each neighbourhood: { Belém: 3, Ajuda: 1 }
export function neighbourhoodCounts(checkOffs, spots) {
  const hoodOf = new Map(spots.map((s) => [s.id, s.neighbourhood]))
  const counts = {}
  for (const c of checkOffs) {
    const hood = hoodOf.get(c.spot_id)
    if (hood) counts[hood] = (counts[hood] ?? 0) + 1
  }
  return counts
}

export function neighbourhoodCoverage(spots, collectedIds, neighbourhoods) {
  const list = neighbourhoods.map((name) => ({
    name,
    count: spots.filter((s) => s.neighbourhood === name && collectedIds.has(s.id)).length,
  }))
  return {
    visited: list.filter((n) => n.count > 0).length,
    total: neighbourhoods.length,
    list,
  }
}
