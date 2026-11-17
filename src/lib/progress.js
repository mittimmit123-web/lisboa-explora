// Pure functions for progress numbers. No database, no React:
// easy to test (see tests/progress.test.js).

// Spots that belong to a set.
export function spotsInSet(set, spots) {
  if (set.spotIds) return spots.filter((s) => set.spotIds.includes(s.id))
  const { category, neighbourhood } = set.match ?? {}
  return spots.filter(
    (s) =>
      (!category || s.category === category) &&
      (!neighbourhood || s.neighbourhood === neighbourhood),
  )
}

// { done, total, percent } for a list of spots and the set of collected ids.
export function progressOf(spots, collectedIds) {
  const total = spots.length
  const done = spots.filter((s) => collectedIds.has(s.id)).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { done, total, percent }
}

export function setProgress(set, spots, collectedIds) {
  return progressOf(spotsInSet(set, spots), collectedIds)
}

// Progress per neighbourhood, sorted by percent (highest first).
export function neighbourhoodProgress(spots, collectedIds) {
  const names = [...new Set(spots.map((s) => s.neighbourhood))]
  return names
    .map((name) => ({
      name,
      ...progressOf(spots.filter((s) => s.neighbourhood === name), collectedIds),
    }))
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name))
}

// Number of check-offs in the same calendar month as `now`.
// Each spot counts once per player, so every check-off is a "new" spot.
export function newThisMonth(checkOffs, now = new Date()) {
  return checkOffs.filter((c) => {
    const d = new Date(c.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}

// Sort players by new spots this month, highest first, and add a rank.
export function rankPlayers(players) {
  return [...players]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

// The newest check-offs joined with their spot, newest first.
// Returns [{ spot, date }]. Check-offs for unknown spots are skipped.
export function recentlyCollected(checkOffs, spots, limit = 5) {
  return [...checkOffs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((c) => ({ spot: spots.find((s) => s.id === c.spot_id), date: new Date(c.created_at) }))
    .filter((item) => item.spot)
    .slice(0, limit)
}

// Numbers for the "monthly recap" card.
// players: [{ name, count, isMe }] from the friends leaderboard.
// Returns { count, rank, playerCount }. rank is null if "me" is not in the list.
export function monthlyRecap(players) {
  const ranked = rankPlayers(players)
  const me = ranked.find((p) => p.isMe)
  return {
    count: me?.count ?? 0,
    rank: me?.rank ?? null,
    playerCount: ranked.length,
  }
}
