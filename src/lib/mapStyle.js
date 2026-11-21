// The look of the map background ("design B, Lisboa warm").
//
// The map is a vector map: it downloads only the data (here is a street,
// there a park) and MapLibre paints it in OUR colours, like Google Maps.
// Data: OpenFreeMap, free and without an account, built from OpenStreetMap.
// To change a colour, change it in MAP_COLORS below.

export const MAP_COLORS = {
  background: '#F3EEE4', // cream, like the rest of the app
  road: '#FFFFFF',
  park: '#CFE3B4',
  water: '#A9CFE8',
  building: '#EAE2D3',
  label: '#7A6F5E',
}

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
  '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org">OpenMapTiles</a>'

// Road width grows with the zoom level: thin in the city overview,
// wide when you look at a single street.
const width = (atZoom12, atZoom18) => ['interpolate', ['exponential', 1.6], ['zoom'], 12, atZoom12, 18, atZoom18]
const isOneOf = (field, values) => ['in', ['get', field], ['literal', values]]

// Builds the MapLibre style: a list of layers, painted from bottom to top.
export function mapStyle(c = MAP_COLORS) {
  const data = { source: 'openfreemap' }
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { openfreemap: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': c.background } },
      { id: 'parks', type: 'fill', ...data, 'source-layer': 'park', paint: { 'fill-color': c.park } },
      {
        id: 'green',
        type: 'fill',
        ...data,
        'source-layer': 'landcover',
        filter: isOneOf('class', ['grass', 'wood', 'farmland']),
        paint: { 'fill-color': c.park },
      },
      {
        id: 'green-other',
        type: 'fill',
        ...data,
        'source-layer': 'landuse',
        filter: isOneOf('class', ['cemetery', 'pitch', 'stadium']),
        paint: { 'fill-color': c.park, 'fill-opacity': 0.6 },
      },
      { id: 'water', type: 'fill', ...data, 'source-layer': 'water', paint: { 'fill-color': c.water } },
      { id: 'rivers', type: 'line', ...data, 'source-layer': 'waterway', paint: { 'line-color': c.water, 'line-width': 2 } },
      { id: 'buildings', type: 'fill', ...data, 'source-layer': 'building', minzoom: 15, paint: { 'fill-color': c.building } },
      {
        id: 'paths',
        type: 'line',
        ...data,
        'source-layer': 'transportation',
        minzoom: 15,
        filter: isOneOf('class', ['path', 'track']),
        paint: { 'line-color': c.road, 'line-width': 1, 'line-opacity': 0.8 },
      },
      {
        id: 'small-roads',
        type: 'line',
        ...data,
        'source-layer': 'transportation',
        filter: isOneOf('class', ['minor', 'service']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.road, 'line-width': width(0.5, 14) },
      },
      {
        id: 'main-roads',
        type: 'line',
        ...data,
        'source-layer': 'transportation',
        filter: isOneOf('class', ['primary', 'secondary', 'tertiary', 'trunk', 'motorway']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.road, 'line-width': width(1.5, 26) },
      },
      {
        id: 'street-names',
        type: 'symbol',
        ...data,
        'source-layer': 'transportation_name',
        minzoom: 15,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: { 'text-color': c.label, 'text-halo-color': c.road, 'text-halo-width': 1.2 },
      },
      {
        id: 'neighbourhood-names',
        type: 'symbol',
        ...data,
        'source-layer': 'place',
        filter: isOneOf('class', ['suburb', 'neighbourhood', 'quarter']),
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
        },
        paint: { 'text-color': c.label, 'text-halo-color': c.background, 'text-halo-width': 1.5 },
      },
    ],
  }
}
