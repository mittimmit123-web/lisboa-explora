// Spots set BY HAND (1. extra spots, 2. position fixes, 3. removals).
// The import script (scripts/import-osm.mjs) never
// overwrites this file; it adds these on top of the OpenStreetMap spots.
// All coordinates were checked by hand (Google Maps or on site).

// 1. Extra spots that the OSM import does not find.
//    `neighbourhood` is filled in automatically from the parish borders,
//    except for the campus, which is outside Lisbon.
export const EXTRA_SPOTS = [
  // Demo spot for the live presentation: room D-1.10, measured on site.
  // `highlight: true` = also visible when the map is zoomed out.
  { id: 'nova-sbe', name: 'Nova SBE Campus', category: 'campus', neighbourhood: 'Carcavelos', lat: 38.67831, lng: -9.32633, rarity: 'legendary', highlight: true },
  // In OSM these are tagged as forest / not as a park, so the filter misses them.
  { id: 'monsanto', name: 'Parque Florestal de Monsanto', category: 'park', lat: 38.7239, lng: -9.18923, rarity: 'common', highlight: true },
  { id: 'bela-vista', name: 'Parque da Bela Vista', category: 'park', lat: 38.751, lng: -9.12676, rarity: 'common', highlight: true },
]

// 3. OSM entries we remove by hand: the same place mapped twice under
//    different names, which the automatic duplicate rule cannot detect.
//    By OSM id, so only exactly this entry is removed. The comment says
//    which entry we keep instead.
export const REMOVE_IDS = [
  'osm-w526129020', // Miradouro Nossa Senhora do Monte -> keep Miradouro da Senhora do Monte
  'osm-w259346570', // Miradouro do Padrão dos Descobrimentos -> keep Padrão dos Descobrimentos
  'osm-n12926040967', // Museu de Lisboa - Casa dos Bicos -> keep Casa dos Bicos
  'osm-n13096661171', // Casa Ásia – Coleção Francisco Capelo (other dash) -> keep the "-" one
  'osm-w207662487', // Palácio Pimenta -> keep Museu de Lisboa - Palácio Pimenta
  'osm-n9749140958', // Museu da Água at the reservoir -> keep Reservatório da Mãe d'Água das Amoreiras
  'osm-n4340743360', // Museu do Campo Pequeno -> keep Praça de Touros do Campo Pequeno
  'osm-w54820068', // Quinta das Conchas -> keep Parque da Quinta das Conchas e dos Lilases
  'osm-n5448423388', // Alameda Roentgen -> keep Jardim da Alameda Roentgen
  'osm-n12314198864', // Mercado D´Santos (other apostrophe) -> keep Mercado D'Santos
  'osm-n12632661001', // Hello, Kristof (São Bento) -> keep Hello, Kristof
]

// 2. Better positions for large places. OSM puts the dot in the middle of
//    the area; for these we chose a spot people really visit.
//    Matched by the exact OSM name.
export const POSITION_FIXES = [
  { name: 'Parque Eduardo VII', lat: 38.72845, lng: -9.15268 },
  { name: 'Parque Tejo', lat: 38.78585, lng: -9.09293 },
  { name: 'Jardim Botânico de Lisboa', lat: 38.71863, lng: -9.14875 },
  { name: 'Tapada da Ajuda', lat: 38.71258, lng: -9.18688 },
  { name: 'Jardim da Estrela', lat: 38.71495, lng: -9.15926 },
  { name: 'Jardim Gulbenkian', lat: 38.73759, lng: -9.15421 },
  { name: 'Parque da Quinta das Conchas e dos Lilases', lat: 38.76979, lng: -9.15508 },
  // Jardim do Campo Grande, officially renamed Jardim Mário Soares (OSM uses the new name).
  { name: 'Jardim Mário Soares', lat: 38.75674, lng: -9.15333 },
  { name: 'Castelo de São Jorge', lat: 38.71365, lng: -9.13352 },
  { name: 'Mosteiro dos Jerónimos', lat: 38.69762, lng: -9.20539 },
]
