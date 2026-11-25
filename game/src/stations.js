// CURRY VOYAGE — the three hot stations of the spice-route kitchen.
// Each station is a tiny state machine with a visible timer: food moves
// raw -> ready -> burnt, and only the ready window can leave the station.
// The cook's whole plan lives here: toast spices while the pot simmers,
// flip the roti while the curry rests.

import { TIMINGS } from './recipes.js';

// --- Dry toast pan: raw spice blend in, fragrant toasted spice out. ---
export function makePan() {
  return { spice: null, t: 0, state: 'empty' }; // empty|toasting|ready|burnt
}

export function panStart(pan, spiceId) {
  if (pan.state !== 'empty') return false;
  pan.spice = spiceId; pan.t = 0; pan.state = 'toasting';
  return true;
}

export function panUpdate(pan, dt) {
  if (pan.state === 'toasting') {
    pan.t += dt;
    if (pan.t >= TIMINGS.toastBurn) pan.state = 'burnt';
    else if (pan.t >= TIMINGS.toastTime) pan.state = 'ready';
  }
}

// Take the toasted spice out (only in the ready window). Returns spice id.
export function panTake(pan) {
  if (pan.state !== 'ready') return null;
  const s = pan.spice;
  pan.spice = null; pan.t = 0; pan.state = 'empty';
  return s;
}

export function panClear(pan) { pan.spice = null; pan.t = 0; pan.state = 'empty'; }

// --- Simmer pot: protein + toasted spice + coconut milk, then time. ---
export function makePot() {
  return { protein: null, spice: null, milk: false, t: 0, state: 'empty' };
  // empty|loading (has protein, wants spice+milk)|simmering|ready|burnt
}

export function potAddProtein(pot, proteinId) {
  if (pot.state !== 'empty') return false;
  pot.protein = proteinId; pot.state = 'loading';
  return true;
}

export function potAddSpice(pot, spiceId) {
  if (pot.state !== 'loading' || pot.spice) return false;
  pot.spice = spiceId;
  if (pot.milk) beginSimmer(pot);
  return true;
}

export function potAddMilk(pot) {
  if (pot.state !== 'loading' || pot.milk) return false;
  pot.milk = true;
  if (pot.spice) beginSimmer(pot);
  return true;
}

function beginSimmer(pot) { pot.state = 'simmering'; pot.t = 0; }

export function potUpdate(pot, dt) {
  if (pot.state === 'simmering') {
    pot.t += dt;
    if (pot.t >= TIMINGS.simmerBurn) pot.state = 'burnt';
    else if (pot.t >= TIMINGS.simmerTime) pot.state = 'ready';
  }
}

// Ladle the finished curry out of the pot onto a plate.
export function potTake(pot) {
  if (pot.state !== 'ready') return null;
  const curry = { protein: pot.protein, spice: pot.spice };
  potReset(pot);
  return curry;
}

export function potReset(pot) {
  pot.protein = null; pot.spice = null; pot.milk = false; pot.t = 0; pot.state = 'empty';
}

// --- Flat griddle: roti dough in, flaky roti out. ---
export function makeGriddle() {
  return { t: 0, state: 'empty' }; // empty|cooking|ready|burnt
}

export function griddleStart(g) {
  if (g.state !== 'empty') return false;
  g.t = 0; g.state = 'cooking';
  return true;
}

export function griddleUpdate(g, dt) {
  if (g.state === 'cooking') {
    g.t += dt;
    if (g.t >= TIMINGS.griddleBurn) g.state = 'burnt';
    else if (g.t >= TIMINGS.griddleTime) g.state = 'ready';
  }
}

export function griddleTake(g) {
  if (g.state !== 'ready') return false;
  g.t = 0; g.state = 'empty';
  return true;
}

export function griddleClear(g) { g.t = 0; g.state = 'empty'; }

// Progress fraction + phase colour key for any station's timer bar.
export function stationBar(station, kind) {
  const T = TIMINGS;
  if (kind === 'pan') {
    if (station.state === 'empty') return { frac: 0, phase: 'idle' };
    if (station.state === 'ready') return { frac: 1, phase: 'ready' };
    if (station.state === 'burnt') return { frac: 1, phase: 'burnt' };
    return { frac: Math.min(1, station.t / T.toastTime), phase: station.t > T.toastTime ? 'ready' : 'cooking' };
  }
  if (kind === 'pot') {
    if (station.state === 'simmering') return { frac: Math.min(1, station.t / T.simmerTime), phase: 'cooking' };
    if (station.state === 'ready') return { frac: 1, phase: 'ready' };
    if (station.state === 'burnt') return { frac: 1, phase: 'burnt' };
    return { frac: 0, phase: station.state === 'loading' ? 'loading' : 'idle' };
  }
  if (station.state === 'empty') return { frac: 0, phase: 'idle' };
  if (station.state === 'ready') return { frac: 1, phase: 'ready' };
  if (station.state === 'burnt') return { frac: 1, phase: 'burnt' };
  return { frac: Math.min(1, station.t / T.griddleTime), phase: 'cooking' };
}
