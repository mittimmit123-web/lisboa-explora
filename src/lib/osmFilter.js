// Rules that turn OpenStreetMap (OSM) places into game spots.
//
// Used by scripts/import-osm.mjs. Every rule is a small, plain function,
// so it can be tested in tests/osmFilter.test.js.
//
// In OSM, every place has "tags": labels written by volunteers, for example
// { name: 'Miradouro de Santa Luzia', tourism: 'viewpoint' }.
import { distanceMeters } from './geo.js'

// A place edited at most this many times in OSM counts as "rare"
// (lesser known). Places edited more often are well known, so "common".
export const RARE_MAX_EDITS = 4

// ---------- Category ----------

// Returns one of our category ids, or null if the place fits none.
// The order matters: if a place fits two categories, the first match wins.
// Example: Pastéis de Belém is a pastry shop AND a tourist attraction,
// and we want it under Food spots, so food is checked before monuments.
export function categoryOf(tags) {
  if (tags.tourism === 'viewpoint') return 'viewpoint'

  const churchBuildings = ['church', 'cathedral', 'chapel', 'monastery']
  if (tags.amenity === 'place_of_worship' && churchBuildings.includes(tags.building)) return 'church'

  if (['restaurant', 'cafe', 'food_court', 'marketplace'].includes(tags.amenity)) return 'food'
  if (['bakery', 'pastry'].includes(tags.shop)) return 'food'

  if (['bar', 'pub', 'nightclub'].includes(tags.amenity)) return 'nightlife'

  const historic = ['monument', 'memorial', 'castle', 'fort', 'tower', 'palace']
  if (historic.includes(tags.historic)) return 'monument'
  // Museums and attractions also go under Monuments (team decision).
  if (['museum', 'gallery', 'attraction', 'aquarium'].includes(tags.tourism)) return 'monument'

  if (['park', 'garden'].includes(tags.leisure)) return 'park'
  if (tags.place === 'square') return 'square'

  return null
}

// Food spots come in different kinds, so the map can show a matching icon
// (☕ / 🍴 / 🧺). The category stays "food" for all of them.
export function kindOf(tags) {
  if (tags.amenity === 'marketplace') return 'market'
  if (tags.amenity === 'cafe' || ['bakery', 'pastry'].includes(tags.shop)) return 'cafe'
  return 'restaurant' // restaurant, food_court
}

// ---------- Exclusion ----------

export function hasWebsite(tags) {
  return Boolean(tags.website || tags['contact:website'])
}

// Returns why a place is NOT used as a spot, or null if it is fine.
export function exclusionReason(tags, category) {
  if (!tags.name || !tags.name.trim()) return 'no name'
  if (!category) return 'no category'
  if (tags.access === 'private' || tags.access === 'no') return 'private'
  // OSM marks closed places with prefixes like "disused:amenity=bar".
  const isClosed = Object.keys(tags).some((key) => /^(disused|abandoned|was):/.test(key))
  if (isClosed || tags.disused === 'yes') return 'closed'

  // Monuments: small wall plaques are not worth a visit.
  if (tags.historic === 'memorial' && (tags.memorial ?? '').includes('plaque')) return 'plaque'

  // Single trees, rocks or ponds tagged as "attraction" are not spots.
  if (tags.tourism === 'attraction' && (tags.natural || tags.denotation === 'natural_monument')) return 'nature'
  // Zoo enclosures ("Girafas", "Leões") are tagged as attractions with no
  // other information. Attractions without any details are skipped.
  if (tags.tourism === 'attraction' && tags.attraction === 'animal') return 'zoo animal'
  const detailKeys = Object.keys(tags).filter((k) => !/^(name|tourism|building|height)(:|$)/.test(k))
  if (tags.tourism === 'attraction' && category === 'monument' && detailKeys.length === 0) return 'no details'

  if (category === 'food') {
    if (tags.brand || tags['brand:wikidata']) return 'chain' // Starbucks & co.
    // Markets rarely have a website, so they are kept without one.
    if (tags.amenity !== 'marketplace' && !hasWebsite(tags)) return 'no website'
  }
  if (category === 'nightlife' && !hasWebsite(tags)) return 'no website'

  return null
}

// ---------- Rarity ----------

// Food spots and nightlife are always common (there are so many).
// Other places are rare if volunteers edited them only a few times.
// Future idea: once the app has real players, rarity could instead be based
// on how few players have collected a spot.
export function rarityOf(category, editCount) {
  if (category === 'food' || category === 'nightlife') return 'common'
  return editCount <= RARE_MAX_EDITS ? 'rare' : 'common'
}

// ---------- Duplicates ----------

// Volunteers sometimes map one place twice, e.g. once as a building and
// once as an attraction, a few hundred metres apart. Two spots count as the
// same place if their names are equal (ignoring case and accents) and they
// are at most this far apart. This applies to ALL categories.
export const DUPLICATE_DISTANCE_M = 300

// "Oceanário de  Lisboa" -> "oceanario de lisboa"
export function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// items: [{ spot, edits }]. Returns the list without duplicates. Of two
// duplicates we keep the one edited more often (usually the better data).
export function removeDuplicates(items, maxDistance = DUPLICATE_DISTANCE_M) {
  const sorted = [...items].sort((a, b) => b.edits - a.edits)
  const kept = []
  for (const item of sorted) {
    const name = normalizeName(item.spot.name)
    const isDuplicate = kept.some(
      (k) => normalizeName(k.spot.name) === name && distanceMeters(k.spot, item.spot) <= maxDistance,
    )
    if (!isDuplicate) kept.push(item)
  }
  return kept
}

// ---------- One spot per location ----------

// Often several things with the same name stand at the same place: a square
// and its statue ("Praça Marquês de Pombal" / "Marquês de Pombal"), or a
// monument and its viewpoint. A player should not collect 2-3 spots in one
// visit, so they are merged into ONE spot.
// Rule: similar names AND at most 15 m apart. Both must be true, so that
// really different places next to each other (a church and the square in
// front of it, two bars) stay separate.
export const SAME_SPOT_M = 15

// Words that say WHAT a place is, not WHICH place ("Miradouro da Graça").
const GENERIC_WORDS = new Set(['da', 'do', 'de', 'dos', 'das', 'e', 'nossa', 'senhora', 'miradouro', 'igreja', 'jardim', 'parque', 'capela', 'largo', 'praca', 'museu', 'lisboa'])

function nameWords(name) {
  return normalizeName(name)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(' ')
    .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w))
}

// "Torre de Belém" and "Miradouro da Torre de Belém" are similar: every
// important word of the shorter name is also in the longer one.
export function similarNames(a, b) {
  const wordsA = nameWords(a)
  const wordsB = nameWords(b)
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA]
  return shorter.every((w) => longer.includes(w))
}

export function sameLocation(a, b) {
  return similarNames(a.name, b.name) && distanceMeters(a, b) <= SAME_SPOT_M
}

// items: [{ spot, edits }]. Returns one item per location.
// Which spot survives? To even out the categories, the spot from the
// category with the FEWEST spots wins (e.g. a viewpoint beats a monument).
// Spots in `keepNames` (hand-checked places) always win.
export function mergeLocations(items, keepNames = []) {
  const perCategory = {}
  for (const { spot } of items) perCategory[spot.category] = (perCategory[spot.category] ?? 0) + 1

  const priority = (item) => [
    keepNames.includes(item.spot.name) ? 0 : 1, // hand-checked first
    perCategory[item.spot.category], // then the smallest category
    -item.edits, // then the better known one
  ]
  const sorted = [...items].sort((a, b) => {
    const pa = priority(a)
    const pb = priority(b)
    return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2]
  })

  const kept = []
  for (const item of sorted) {
    if (!kept.some((k) => sameLocation(k.spot, item.spot))) kept.push(item)
  }
  return kept
}

// ---------- Local chains ----------

// Big chains are tagged with "brand" in OSM (see exclusionReason). Small
// local chains are not, e.g. a bakery with 6 shops. A food or nightlife
// name that appears more than once in the city counts as a chain, and all
// its branches are removed: the app is about unique, local places.
// Run this AFTER removeDuplicates, so one place mapped twice is not a chain.
export function removeChains(items) {
  const count = {}
  for (const { spot } of items) {
    if (spot.category !== 'food' && spot.category !== 'nightlife') continue
    const name = normalizeName(spot.name)
    count[name] = (count[name] ?? 0) + 1
  }
  return items.filter(({ spot }) => !(count[normalizeName(spot.name)] > 1 && (spot.category === 'food' || spot.category === 'nightlife')))
}

// ---------- Highlights ----------

// When the map is zoomed out, only highlights are shown. Per category:
// a few famous places (to find your way around) plus a few hidden gems
// (the app's idea: discover less touristy places).
export const FAMOUS_PER_CATEGORY = 5
export const GEMS_PER_CATEGORY = 5

// items: [{ spot, edits }]. Sets `highlight: true` on the chosen spots.
// - famous: the most edited places (well known)
// - gems: lesser known places (edited at most RARE_MAX_EDITS times), at most
//   one per neighbourhood, so they are spread over the city
export function markHighlights(items, famous = FAMOUS_PER_CATEGORY, gems = GEMS_PER_CATEGORY) {
  const byCategory = {}
  for (const item of items) {
    byCategory[item.spot.category] ??= []
    byCategory[item.spot.category].push(item)
  }
  for (const list of Object.values(byCategory)) {
    list.sort((a, b) => b.edits - a.edits)
    list.slice(0, famous).forEach((item) => {
      item.spot.highlight = true
    })

    const usedNeighbourhoods = new Set()
    let found = 0
    for (const item of list) {
      if (found >= gems) break
      if (item.spot.highlight || item.edits > RARE_MAX_EDITS) continue
      if (usedNeighbourhoods.has(item.spot.neighbourhood)) continue
      usedNeighbourhoods.add(item.spot.neighbourhood)
      item.spot.highlight = true
      found++
    }
  }
}

// ---------- Parish (neighbourhood) ----------

// Is the point { lat, lng } inside the polygon? A polygon is a list of
// corners [[lat, lng], ...]. "Ray casting": draw a line from the point to
// the right and count how often it crosses the border. Odd = inside.
export function isInsidePolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latA, lngA] = polygon[i]
    const [latB, lngB] = polygon[j]
    const crosses =
      latA > point.lat !== latB > point.lat &&
      point.lng < ((lngB - lngA) * (point.lat - latA)) / (latB - latA) + lngA
    if (crosses) inside = !inside
  }
  return inside
}

// parishes: [{ name, polygons: [[[lat, lng], ...], ...] }]
// Returns the parish name, or null if the point is in none of them.
export function parishOf(point, parishes) {
  const parish = parishes.find((p) => p.polygons.some((polygon) => isInsidePolygon(point, polygon)))
  return parish ? parish.name : null
}

// OSM stores a border as several pieces (lines). This joins pieces that
// share an end point into closed polygons.
// lines: [[[lat, lng], ...], ...]
export function joinLines(lines) {
  const rest = lines.map((line) => [...line])
  const polygons = []
  const same = (a, b) => a[0] === b[0] && a[1] === b[1]
  while (rest.length > 0) {
    let ring = rest.shift()
    let found = true
    while (found && !same(ring[0], ring[ring.length - 1])) {
      found = false
      for (let i = 0; i < rest.length; i++) {
        const line = rest[i]
        const end = ring[ring.length - 1]
        if (same(line[0], end)) ring = ring.concat(line.slice(1))
        else if (same(line[line.length - 1], end)) ring = ring.concat([...line].reverse().slice(1))
        else continue
        rest.splice(i, 1)
        found = true
        break
      }
    }
    polygons.push(ring)
  }
  return polygons
}

// ---------- One OSM place -> one spot ----------

// element: a place from the Overpass API (with tags, version and a position).
// Returns { spot, edits } or { skipped: reason }.
// `edits` (how often the place was edited in OSM) is used for highlights.
export function toSpot(element, parishes) {
  const tags = element.tags ?? {}
  const category = categoryOf(tags)
  const reason = exclusionReason(tags, category)
  if (reason) return { skipped: reason }

  // Points have lat/lon; areas (parks, buildings) have a "center".
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (typeof lat !== 'number' || typeof lng !== 'number') return { skipped: 'no coordinates' }

  const neighbourhood = parishOf({ lat, lng }, parishes)
  if (!neighbourhood) return { skipped: 'outside Lisbon' }

  const edits = element.version ?? 1
  const spot = {
    // e.g. "osm-n123" for node 123, "osm-w45" for way 45
    id: `osm-${element.type[0]}${element.id}`,
    name: tags.name.trim(),
    category,
    neighbourhood,
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    rarity: rarityOf(category, edits),
  }
  if (category === 'food') spot.kind = kindOf(tags)
  return { spot, edits }
}
