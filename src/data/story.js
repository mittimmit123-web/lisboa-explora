// The story "Showing your buddy around" (issue #32).
//
// Your buddy is new in Lisbon and you show it the city. Every NEW
// neighbourhood you visit unlocks the next chapter, in order, and gives your
// player's photo becomes a postcard for the Explora's album. 24 chapters, because
// Lisbon has 24 parishes.
//
// Placeholders filled in by the app (see fillStory in src/lib/story.js):
//   {buddy}  your buddy's name, e.g. "Tram" (or "your buddy")
//   {place}  the neighbourhood that unlocked the chapter, e.g. "Belém"
//   {he} {He} {him} {his} {His}  the Explora's pronouns (he / she / it)
//
// Feel free to rewrite any text here. Keep it short: 2-3 sentences.
export const PARTS = [
  { from: 1, title: 'New in town' },
  { from: 7, title: 'Getting brave' },
  { from: 13, title: 'Saudade' },
  { from: 19, title: 'Home' },
]

export const CHAPTERS = [
  // Part 1: New in town
  { title: 'Hello, Lisbon', text: '{buddy} has just arrived and everything feels big and loud. You bring {him} to {place} and snap a photo together. "My first postcard!" {buddy} cheers, and tucks it carefully into a brand-new album.' },
  { title: 'So many hills', text: '"Why is everything uphill?" {buddy} grumbles all the way up. Then you reach the top in {place} and the whole city opens below you. {buddy} goes very quiet. "Okay. Worth it."' },
  { title: 'The river', text: 'In {place}, {buddy} sees the Tejo for the first time and gasps: "The sea!" You explain that it is a river, a very wide one. {buddy} decides {he} likes it anyway.' },
  { title: 'Yellow friends', text: 'A real tram rattles past in {place}, ringing its bell. {buddy} waves at it like an old friend. For a second, {he} is sure the tram waved back.' },
  { title: 'Lost and found', text: 'The streets of {place} twist and turn, and for a moment {buddy} cannot see you. Then you are there again. That is when {buddy} realises {he} trusts you to find {him}.' },
  { title: 'Six postcards', text: 'That night {buddy} lays out {his} six postcards on the table and looks at them for a long time. "I am making an album," {he} whispers. "An album of everywhere you showed me."' },

  // Part 2: Getting brave
  { title: 'The cheeky seagull', text: 'In {place} a seagull swoops down and tries to steal the new postcard. {buddy} holds on tight and refuses to let go. The seagull gives up, laughs its seagull laugh, and stays. {buddy} names it Gaivota.' },
  { title: 'Look down', text: 'In {place}, {buddy} notices the black-and-white waves of the calçada under {his} feet. "Someone made the ground beautiful, stone by stone," {he} says. From now on {he} looks down as often as up.' },
  { title: 'A sweet stop', text: 'A baker in {place} gives {buddy} {his} very first pastel de nata, still warm. Cinnamon on top, crispy outside. {buddy} has never been this happy about a pastry.' },
  { title: 'Fado at night', text: 'In {place} a song drifts out of an open window, slow and a little sad. {buddy} does not understand the words, but {he} understands the feeling. {He} listens until the last note.' },
  { title: 'My turn', text: 'In {place}, {buddy} suddenly tugs at you. "Can we go somewhere new tomorrow? Somewhere I have never been?" For the first time, {he} is asking you.' },
  { title: 'Half a city', text: 'Twelve postcards. Half the album. {buddy} falls asleep in {place} with the album tucked under {his} pillow, dreaming of the empty spaces still to fill.' },

  // Part 3: Saudade
  { title: 'Fog', text: 'A grey fog rolls in from the river and covers {place}. {buddy} is quiet all day. {He} misses the place {he} came from, and {he} does not quite know how to say so.' },
  { title: 'Saudade', text: 'Dona Rosa, an old lady at a window in {place}, sees {buddy}\'s face. "Ah. Saudade," she says. "Missing something you love. It only means your heart is big." {buddy} feels a little lighter.' },
  { title: 'Gaivota returns', text: 'Just as {buddy} feels lonely in {place}, Gaivota lands next to {him} and drops a shiny bottle cap at {his} feet. A seagull\'s idea of a gift. {buddy} keeps it forever.' },
  { title: 'After the rain', text: 'The rain stops over {place} and a rainbow stretches across the rooftops. {buddy} gets {his} postcard, and {his} smile back.' },
  { title: 'Shining postcards', text: 'Leafing through the album, {buddy} notices something: the postcards from places you visited together, really together, shine a little brighter than the rest.' },
  { title: 'A new word', text: 'Walking through {place}, {buddy} says "my city" by accident. {He} stops, thinks about it, and does not take it back.' },

  // Part 4: Home
  { title: 'Tour guide', text: 'This time, {buddy} leads the way through {place}. "Come, I want to show you my favourite corner." {He} is right. It is a very good corner.' },
  { title: 'Friends everywhere', text: 'In {place} the baker waves, Gaivota circles overhead and Dona Rosa smiles from her window. {buddy} belongs here now, and everyone knows it.' },
  { title: 'The missing pieces', text: 'Only three empty pages left in the album. {buddy} is so excited in {place} that {he} cannot sit still for a second.' },
  { title: 'Golden hour', text: 'The sun goes down over {place} and everything turns gold. {buddy} says "thank you", very quietly, without looking at you. You both know what it means.' },
  { title: 'One left', text: 'The second-to-last postcard slips into the album in {place}. Suddenly {buddy} looks a little worried. "What happens when the album is full?"' },
  { title: 'Our Lisbon', text: 'In {place} the 24th postcard completes the album, and {buddy} gives it to you. "You showed me your city. Now it is ours." Then {he} smiles. "Lisbon is not a place you finish. It is a place you keep finding."' },
]

// Added at the end of a chapter, depending on how its spot was collected.
export const ENDINGS = {
  verified: '⭐ You were really there with me.',
  later: 'You told me all about it. One day we will go together.',
}
