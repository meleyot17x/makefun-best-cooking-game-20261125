// CURRY VOYAGE — the order board: traveller tickets pinned above the pass.
// Tickets are generated from a seeded RNG so screenshot scenes and test
// runs are perfectly reproducible, while live play keeps drawing fresh
// travellers off the spice route.

import { RECIPES } from './recipes.js';

// Small deterministic RNG (mulberry32) — same seed, same harbour rush.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let ticketSeq = 0;

// A ticket wraps a recipe with a live patience countdown.
export function makeTicket(recipe, now) {
  ticketSeq += 1;
  return {
    no: ticketSeq,
    recipe,
    bornAt: now,
    patience: recipe.patience,
    left: recipe.patience,
  };
}

// Pick the next recipe for a new traveller. Later in the shift the board
// leans toward the pricier, slower dishes — pressure without chores.
export function drawRecipe(rng, elapsed, shiftLength) {
  const late = elapsed / shiftLength > 0.55;
  const pool = late ? RECIPES : RECIPES.slice(0, 6);
  return pool[Math.floor(rng() * pool.length)];
}

// Fraction of patience remaining, clamped for the bar on each ticket.
export function patienceFrac(ticket) {
  return Math.max(0, Math.min(1, ticket.left / ticket.patience));
}

// Does a finished plate exactly satisfy this ticket? Every part counts:
// curry protein + toasted spice, side, the garnish set, and exact heat.
export function plateMatches(plate, recipe) {
  if (!plate.curry) return false;
  if (plate.curry.protein !== recipe.protein) return false;
  if (plate.curry.spice !== recipe.spice) return false;
  if (plate.side !== recipe.side) return false;
  if (plate.heat !== recipe.heat) return false;
  const want = [...recipe.garnishes].sort().join(',');
  const got = [...plate.garnishes].sort().join(',');
  return want === got;
}

// Coins earned: full price plus a patience tip when served swiftly.
export function priceFor(ticket) {
  const frac = patienceFrac(ticket);
  const tip = frac > 0.5 ? Math.round(ticket.recipe.price * 0.5) : frac > 0.25 ? Math.round(ticket.recipe.price * 0.25) : 0;
  return { base: ticket.recipe.price, tip, total: ticket.recipe.price + tip };
}
