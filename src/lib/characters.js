// The Exploras: the characters a player can choose (issue #20).
// Only plain data and helpers here (tested in tests/characters.test.js).
// The 3D models are in src/lib/characters3d.js.
// All three are NEW in Lisbon: in the story the player shows them the city.
// say:   catchphrase (picker bubble)
// hello: first words in the prologue of the intro
// pronouns fill {he} {him} {his} in the story chapters.
export const CHARACTERS = [
  {
    id: 'tram',
    name: 'Trammy',
    say: 'Ding ding! My first day on the tracks!',
    about: 'A brand-new tram, fresh from the workshop. Today is his very first day on the tracks.',
    hello: 'Olá! It’s my very first day on the tracks… everything is so big! 😳',
    pronouns: { he: 'he', him: 'him', his: 'his' },
  },
  {
    id: 'sardine',
    name: 'Captain Bubbles',
    say: 'Blub blub! So this is land?!',
    about: 'Swam in from the ocean for the June festival and has never been on land before.',
    hello: 'Blub! I just swam in from the ocean… so this is land?! 😳',
    pronouns: { he: 'he', him: 'him', his: 'his' },
  },
  {
    id: 'cat',
    name: 'Miss Purrfect',
    say: 'Miau! I’ll be purrfect at exploring. Probably.',
    about: 'A fancy cat who arrived on a cruise ship and has only ever seen Lisbon on postcards.',
    hello: 'Miau! I just got off the cruise ship… Lisbon is even bigger than on my postcards! 😳',
    pronouns: { he: 'she', him: 'her', his: 'her' },
  },
]

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? null
}

// Saved values come from the browser and could be anything (an old version,
// a typo, someone editing storage). Only accept ids we know.
export function cleanCharacterId(value) {
  return characterById(value) ? value : null
}
