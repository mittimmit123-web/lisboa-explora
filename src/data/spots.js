// Starter list of spots.
//
// IMPORTANT: the coordinates are APPROXIMATE and must be checked
// (Google Maps: right-click the exact place -> copy the coordinates).
// Set `verified: true` once a spot has been checked.
// The check-off radius is only 50 m, so wrong coordinates break the game.
//
// Fields:
//   id            unique, lowercase, no spaces
//   name          shown in the app
//   category      one of the ids in categories.js
//   neighbourhood used for "Alfama: 64% discovered"
//   lat, lng      coordinates
//   rarity        'common' | 'rare' | 'legendary'
//   verified      true once the coordinates were checked on site / in Maps
export const SPOTS = [
  // Viewpoints
  { id: 'senhora-do-monte', name: 'Miradouro da Senhora do Monte', category: 'viewpoint', neighbourhood: 'Graça', lat: 38.719, lng: -9.1325, rarity: 'rare', verified: false },
  { id: 'graca', name: 'Miradouro da Graça', category: 'viewpoint', neighbourhood: 'Graça', lat: 38.7163, lng: -9.1314, rarity: 'common', verified: false },
  { id: 'santa-luzia', name: 'Miradouro de Santa Luzia', category: 'viewpoint', neighbourhood: 'Alfama', lat: 38.7118, lng: -9.1301, rarity: 'common', verified: false },
  { id: 'portas-do-sol', name: 'Miradouro das Portas do Sol', category: 'viewpoint', neighbourhood: 'Alfama', lat: 38.7124, lng: -9.1295, rarity: 'common', verified: false },
  { id: 'sao-pedro-alcantara', name: 'Miradouro de São Pedro de Alcântara', category: 'viewpoint', neighbourhood: 'Bairro Alto', lat: 38.7155, lng: -9.1442, rarity: 'common', verified: false },
  { id: 'santa-catarina', name: 'Miradouro de Santa Catarina', category: 'viewpoint', neighbourhood: 'Bica', lat: 38.7094, lng: -9.1474, rarity: 'common', verified: false },

  // Monuments, churches, squares
  { id: 'castelo', name: 'Castelo de São Jorge', category: 'monument', neighbourhood: 'Alfama', lat: 38.7139, lng: -9.1334, rarity: 'common', verified: false },
  { id: 'santa-justa', name: 'Elevador de Santa Justa', category: 'monument', neighbourhood: 'Baixa', lat: 38.7121, lng: -9.1394, rarity: 'common', verified: false },
  { id: 'torre-belem', name: 'Torre de Belém', category: 'monument', neighbourhood: 'Belém', lat: 38.6916, lng: -9.216, rarity: 'common', verified: false },
  { id: 'padrao', name: 'Padrão dos Descobrimentos', category: 'monument', neighbourhood: 'Belém', lat: 38.6936, lng: -9.2057, rarity: 'common', verified: false },
  { id: 'jeronimos', name: 'Mosteiro dos Jerónimos', category: 'church', neighbourhood: 'Belém', lat: 38.6979, lng: -9.2068, rarity: 'common', verified: false },
  { id: 'se', name: 'Sé de Lisboa', category: 'church', neighbourhood: 'Alfama', lat: 38.7099, lng: -9.1335, rarity: 'common', verified: false },
  { id: 'praca-comercio', name: 'Praça do Comércio', category: 'square', neighbourhood: 'Baixa', lat: 38.7075, lng: -9.1364, rarity: 'common', verified: false },

  // Parks
  { id: 'estrela', name: 'Jardim da Estrela', category: 'park', neighbourhood: 'Estrela', lat: 38.714, lng: -9.16, rarity: 'common', verified: false },
  { id: 'eduardo-vii', name: 'Parque Eduardo VII (top)', category: 'park', neighbourhood: 'Avenidas', lat: 38.731, lng: -9.154, rarity: 'common', verified: false },

  // Nightlife
  { id: 'pink-street', name: 'Pink Street (Rua Nova do Carvalho)', category: 'nightlife', neighbourhood: 'Cais do Sodré', lat: 38.7072, lng: -9.144, rarity: 'common', verified: false },
  { id: 'park-bar', name: 'Park Bar (rooftop)', category: 'nightlife', neighbourhood: 'Bairro Alto', lat: 38.7106, lng: -9.1471, rarity: 'rare', verified: false },

  // Food
  { id: 'time-out-market', name: 'Time Out Market', category: 'food', neighbourhood: 'Cais do Sodré', lat: 38.7069, lng: -9.1459, rarity: 'common', verified: false },
  { id: 'pasteis-de-belem', name: 'Pastéis de Belém', category: 'food', neighbourhood: 'Belém', lat: 38.6975, lng: -9.2032, rarity: 'common', verified: false },
  { id: 'manteigaria-chiado', name: 'Manteigaria (Chiado)', category: 'food', neighbourhood: 'Chiado', lat: 38.7105, lng: -9.143, rarity: 'common', verified: false },

  // Demo spot for the live presentation. Move it to the exact room.
  { id: 'nova-sbe', name: 'Nova SBE Campus', category: 'campus', neighbourhood: 'Carcavelos', lat: 38.6782, lng: -9.3256, rarity: 'legendary', verified: false },
]

export function spotById(id) {
  return SPOTS.find((s) => s.id === id)
}
