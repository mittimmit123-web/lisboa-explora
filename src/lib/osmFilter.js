// Rules that turn OpenStreetMap (OSM) places into game spots.
//
// Used by scripts/import-osm.mjs. Every rule is a small, plain function,
// so it can be tested in tests/osmFilter.test.js.
//
// In OSM, every place has "tags": labels written by volunteers, for example
// { name: 'Miradouro de Santa Luzia', tourism: 'viewpoint' }.

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
// Returns { spot } or { skipped: reason }.
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

  return {
    spot: {
      // e.g. "osm-n123" for node 123, "osm-w45" for way 45
      id: `osm-${element.type[0]}${element.id}`,
      name: tags.name.trim(),
      category,
      neighbourhood,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      rarity: rarityOf(category, element.version ?? 1),
    },
  }
}
