// Imports spots from OpenStreetMap and writes src/data/spots.js.
// Run: npm run import-osm   (then: npm run seed)
//
// The app itself never talks to OpenStreetMap. We download the places ONCE
// with this script and keep the result in the repo, so the app keeps working
// even if the OpenStreetMap servers are down.
//
// Data © OpenStreetMap contributors (ODbL), credited on the map.
import { writeFileSync } from 'node:fs'
import {
  joinLines,
  markHighlights,
  mergeLocations,
  parishOf,
  removeChains,
  removeDuplicates,
  toSpot,
} from '../src/lib/osmFilter.js'
import { EXTRA_SPOTS, POSITION_FIXES, REMOVE_IDS } from '../src/data/manualSpots.js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const LISBON = 'area["name"="Lisboa"]["boundary"="administrative"]["admin_level"="7"]->.city;'

// The 24 parishes (freguesias) of Lisbon, with their borders.
const PARISH_QUERY = `[out:json][timeout:120];
${LISBON}
rel(area.city)["boundary"="administrative"]["admin_level"="8"];
out geom;`

// Every place that could fit one of our categories. The exact rules are
// applied afterwards in src/lib/osmFilter.js.
const PLACES_QUERY = `[out:json][timeout:180];
${LISBON}
(
  nwr(area.city)["tourism"~"^(viewpoint|museum|gallery|attraction|aquarium)$"]["name"];
  nwr(area.city)["historic"~"^(monument|memorial|castle|fort|tower|palace)$"]["name"];
  nwr(area.city)["amenity"~"^(place_of_worship|bar|pub|nightclub|restaurant|cafe|food_court|marketplace)$"]["name"];
  nwr(area.city)["shop"~"^(bakery|pastry)$"]["name"];
  nwr(area.city)["leisure"~"^(park|garden)$"]["name"];
  nwr(area.city)["place"="square"]["name"];
);
out center tags meta;`

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Asks the Overpass API. The server is often busy, so we try again a few
// times and wait longer each time (30 s, 60 s, 90 s, ...).
async function overpass(query, label) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'User-Agent': 'lisboa-explora-import (student project)' },
        body: new URLSearchParams({ data: query }),
      })
      if (response.ok) return (await response.json()).elements
      console.log(`${label}: server busy (${response.status}), attempt ${attempt}/6`)
    } catch (error) {
      console.log(`${label}: network error (${error.message}), attempt ${attempt}/6`)
    }
    await wait(attempt * 30_000)
  }
  throw new Error(`${label}: OpenStreetMap is not reachable, try again later`)
}

function toParish(relation) {
  const outerLines = relation.members
    .filter((m) => m.type === 'way' && (m.role === 'outer' || m.role === '') && m.geometry)
    .map((m) => m.geometry.map((p) => [p.lat, p.lon]))
  return { name: relation.tags.name, polygons: joinLines(outerLines) }
}

console.log('Downloading parish borders ...')
const parishes = (await overpass(PARISH_QUERY, 'parishes')).map(toParish)
console.log(`${parishes.length} parishes`)

console.log('Downloading places (this can take a minute) ...')
const elements = await overpass(PLACES_QUERY, 'places')
console.log(`${elements.length} places downloaded`)

// Apply the rules and count why places were skipped.
const skipped = {}
const allItems = [] // [{ spot, edits }]
for (const element of elements) {
  const result = toSpot(element, parishes)
  if (result.skipped) {
    skipped[result.skipped] = (skipped[result.skipped] ?? 0) + 1
    continue
  }
  allItems.push(result)
}

// Duplicates: same name within 300 m, e.g. a museum mapped once as a
// building and once as an attraction.
const unique = removeDuplicates(allItems)
skipped.duplicate = allItems.length - unique.length

// Local chains: food/nightlife names that appear more than once.
const noChains = removeChains(unique)
skipped['local chain'] = unique.length - noChains.length

// Entries removed by hand (src/data/manualSpots.js).
const notRemoved = noChains.filter((item) => !REMOVE_IDS.includes(item.spot.id))
skipped['removed by hand'] = noChains.length - notRemoved.length

// One spot per location (square + statue + fountain -> one spot).
// The hand-checked large places always survive.
const items = mergeLocations(notRemoved, POSITION_FIXES.map((fix) => fix.name))
skipped['merged (same location)'] = notRemoved.length - items.length
for (const id of REMOVE_IDS) {
  if (!noChains.some((item) => item.spot.id === id)) console.warn(`WARNING: REMOVE_IDS entry ${id} not found`)
}

// Visible when zoomed out: per category 5 famous places + 5 hidden gems.
markHighlights(items)
const spots = items.map((item) => item.spot)

// Hand-checked positions for large places.
for (const fix of POSITION_FIXES) {
  const matches = spots.filter((s) => s.name === fix.name)
  if (matches.length === 0) console.warn(`WARNING: no OSM spot named "${fix.name}" for a position fix`)
  for (const spot of matches) Object.assign(spot, { lat: fix.lat, lng: fix.lng })
}

// Hand-made extra spots (campus, Monsanto, ...).
for (const extra of EXTRA_SPOTS) {
  const neighbourhood = extra.neighbourhood ?? parishOf(extra, parishes)
  spots.push({ ...extra, neighbourhood })
}

spots.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

const lines = spots.map((s) => `  ${JSON.stringify(s)},`).join('\n')
const file = `// GENERATED by scripts/import-osm.mjs on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.
// To change spots: edit the rules in src/lib/osmFilter.js or the hand-set
// spots in src/data/manualSpots.js, then run: npm run import-osm && npm run seed
//
// Data © OpenStreetMap contributors (ODbL).
// Fields: id, name, category, neighbourhood (Lisbon parish), lat, lng, rarity,
//   kind (food only: cafe | restaurant | market), highlight (visible when zoomed out)
export const SPOTS = [
${lines}
]

export function spotById(id) {
  return SPOTS.find((s) => s.id === id)
}
`
writeFileSync(new URL('../src/data/spots.js', import.meta.url), file)

const perCategory = {}
for (const s of spots) perCategory[s.category] = (perCategory[s.category] ?? 0) + 1
console.log(`\nWrote src/data/spots.js with ${spots.length} spots`)
console.log('Per category:', perCategory)
console.log('Skipped:', skipped)
