// The Exploras: the characters a player can choose (issue #20).
// Only plain data and helpers here (tested in tests/characters.test.js).
// The 3D models are in src/lib/characters3d.js.
export const CHARACTERS = [
  {
    id: 'tram',
    name: 'Trammy',
    say: 'Ding ding! Next stop: adventure!',
    about: "Lisbon's famous yellow tram. Always on the move, never late.",
  },
  {
    id: 'sardine',
    name: 'Captain Bubbles',
    say: "Blub blub! Let's party!",
    about: 'Straight from the June festival. Loves crowds, music and new places.',
  },
  {
    id: 'cat',
    name: 'Miss Purrfect',
    say: 'Miau! I know every corner.',
    about: 'A street cat from the old town who knows every hidden spot, and is purrfectly sure she is always right.',
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
