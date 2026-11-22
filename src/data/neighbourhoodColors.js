// The colour of each of Lisbon's 24 neighbourhoods on the map (#12).
//
// Soft pastels that fit the cream map design: the same lightness and
// saturation for all, only the hue changes (24 hues, 15 degrees apart on the
// colour wheel). They are shared out so that two neighbourhoods that touch
// always differ by at least 75 degrees, e.g. pink next to green, never pink
// next to pink. To change a colour, change it here.
export const NEIGHBOURHOOD_COLORS = {
  Ajuda: '#D08B8B',
  Alcântara: '#BFD08B',
  Alvalade: '#8BADD0',
  Areeiro: '#9CD08B',
  Arroios: '#8BBFD0',
  'Avenidas Novas': '#D08BBF',
  Beato: '#8B9CD0',
  Belém: '#8BD0BF',
  Benfica: '#AD8BD0',
  'Campo de Ourique': '#D08BAD',
  Campolide: '#8BD0D0',
  Carnide: '#8BD09C',
  Estrela: '#8B8BD0',
  Lumiar: '#D08BD0',
  Marvila: '#D09C8B',
  Misericórdia: '#8BD0AD',
  Olivais: '#8BD08B',
  'Parque das Nações': '#9C8BD0',
  'Penha de França': '#D08B9C',
  'Santa Clara': '#D0AD8B',
  'Santa Maria Maior': '#BF8BD0',
  'Santo António': '#D0D08B',
  'São Domingos de Benfica': '#D0BF8B',
  'São Vicente': '#ADD08B',
}

// How see-through the colours are (0 = invisible, 1 = solid). Never solid,
// so streets and names always show through.
export const UNLOCKED_OPACITY = 0.45 // at least one spot collected there
export const LOCKED_OPACITY = 0.15 // still to discover
