// CURRY VOYAGE — menu data for the spice-route kitchen.
// Every dish on the route is built the same honest way: a spice blend is
// toasted in the dry pan, a protein simmers with that blend and coconut
// milk in the pot, then the plate is finished with a side, garnishes and
// an exact heat level. Tickets name each part, so the cook plans the
// route: pan first (toast while the pot waits), pot second, sides last.

// Raw spice blends that must be toasted before they can flavour a pot.
export const SPICES = {
  masala:   { id: 'masala',   name: 'Garam Masala',  rawColor: '#8a5a2b', toastColor: '#6e3b12' },
  turmeric: { id: 'turmeric', name: 'Turmeric Gold', rawColor: '#e0a41c', toastColor: '#c07f0a' },
  rendang:  { id: 'rendang',  name: 'Rendang Dark',  rawColor: '#5d3a1e', toastColor: '#3c2410' },
};

// Proteins that go into the simmer pot.
export const PROTEINS = {
  chicken:  { id: 'chicken',  name: 'Chicken',  color: '#e8b04b' },
  lamb:     { id: 'lamb',     name: 'Lamb',     color: '#a8542f' },
  fish:     { id: 'fish',     name: 'Fish',     color: '#d9d3c3' },
  chickpea: { id: 'chickpea', name: 'Chickpea', color: '#d9a75a' },
};

// Sides: rice is steamed and ready; roti dough must kiss the griddle.
export const SIDES = {
  rice: { id: 'rice', name: 'Steamed Rice', color: '#f4efe2' },
  roti: { id: 'roti', name: 'Flaky Roti',   color: '#e3b96a' },
};

// Garnishes sprinkled on at the pass, plus chilli flakes for heat.
export const GARNISHES = {
  coriander: { id: 'coriander', name: 'Coriander',     color: '#3f9e4d' },
  shallot:   { id: 'shallot',   name: 'Fried Shallot', color: '#c98d3d' },
};

// The route menu. heat is the exact number of chilli-flake pinches (0-3).
// patience is seconds before the traveller walks away from the stall.
export const RECIPES = [
  { id: 'golden-chicken', name: 'Golden Chicken Curry', protein: 'chicken',  spice: 'turmeric', side: 'rice', garnishes: ['coriander'],          heat: 1, price: 14, patience: 75 },
  { id: 'masala-lamb',    name: 'Masala Lamb Curry',    protein: 'lamb',     spice: 'masala',   side: 'roti', garnishes: ['shallot'],            heat: 2, price: 18, patience: 85 },
  { id: 'rendang-fish',   name: 'Rendang Fish Curry',   protein: 'fish',     spice: 'rendang',  side: 'rice', garnishes: ['coriander', 'shallot'], heat: 3, price: 21, patience: 95 },
  { id: 'garden-chick',   name: 'Garden Chickpea Curry', protein: 'chickpea', spice: 'turmeric', side: 'roti', garnishes: [],                     heat: 0, price: 12, patience: 70 },
  { id: 'route-chicken',  name: 'Route Chicken Masala', protein: 'chicken',  spice: 'masala',   side: 'roti', garnishes: ['coriander', 'shallot'], heat: 2, price: 19, patience: 90 },
  { id: 'dark-lamb',      name: 'Dark Lamb Rendang',    protein: 'lamb',     spice: 'rendang',  side: 'rice', garnishes: ['shallot'],            heat: 3, price: 22, patience: 100 },
  { id: 'golden-fish',    name: 'Golden Fish Curry',    protein: 'fish',     spice: 'turmeric', side: 'roti', garnishes: ['coriander'],          heat: 1, price: 16, patience: 80 },
  { id: 'masala-chick',   name: 'Masala Chickpea Pot',  protein: 'chickpea', spice: 'masala',   side: 'rice', garnishes: ['coriander'],          heat: 1, price: 13, patience: 72 },
];

// Process timings (seconds) shared by stations and the HUD.
export const TIMINGS = {
  toastTime: 5, toastBurn: 9.5,     // dry-pan toasting window
  simmerTime: 8, simmerBurn: 14,    // pot: rich at 8s, scorched after 14s
  griddleTime: 4, griddleBurn: 8,   // roti on the flat griddle
  shiftLength: 180,                 // one harbour shift
};
