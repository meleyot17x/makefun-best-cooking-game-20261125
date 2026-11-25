// CURRY VOYAGE — Spice Route Kitchen.
// A harbour stall on the old spice route. Travellers pin tickets to the
// board; the cook toasts a spice blend in the dry pan, simmers a protein
// with that blend and coconut milk, then plates the curry with a side,
// garnishes and the exact heat asked for. Burnt pans, scorched pots and
// walked-away travellers are the price of a badly planned route.
//
// Live loop: shift clock, ticket patience, three station timers, rising
// rush. Screenshot mode (?shot=cover|rush|serve&seed=N) freezes one
// composed scene with every judging element on screen at once.

import { RECIPES, TIMINGS } from './recipes.js';
import { makeRng, makeTicket, drawRecipe, plateMatches, priceFor } from './orders.js';
import {
  makePan, panStart, panUpdate, panTake, panClear,
  makePot, potAddProtein, potAddSpice, potAddMilk, potUpdate, potTake, potReset,
  makeGriddle, griddleStart, griddleUpdate, griddleTake, griddleClear,
} from './stations.js';
import { drawScene } from './render.js';
import { bindInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

function emptyPlate() { return { curry: null, side: null, garnishes: [], heat: 0 }; }

function freshState(rngSeed) {
  return {
    rng: makeRng(rngSeed),
    tickets: [],
    pan: makePan(), pot: makePot(), griddle: makeGriddle(),
    plate: emptyPlate(),
    passPlate: null,
    heldSpice: null,
    coins: 0, served: 0, strikes: 0,
    elapsed: 0, timeLeft: TIMINGS.shiftLength,
    spawnIn: 0, toast: { text: '', t: 0 },
    over: false,
  };
}

let S = freshState(seed);

function say(text) { S.toast = { text, t: 2.6 }; }

// ---------- one cook action ----------
function act(id) {
  if (S.over) { if (id === 'restart') S = freshState(seed + S.served + 11); return; }
  if (id.startsWith('spice:')) {
    const sp = id.slice(6);
    if (panStart(S.pan, sp)) say(`toasting ${sp} — watch the pan`);
    else say('pan is busy');
    return;
  }
  if (id === 'pan') {
    if (S.pan.state === 'ready') {
      const sp = panTake(S.pan);
      if (S.pot.state === 'loading' && !S.pot.spice) { potAddSpice(S.pot, sp); say('spice into the pot'); }
      else if (!S.heldSpice) { S.heldSpice = sp; say('toasted spice in hand — click the pot'); }
      else say('hands full of spice already');
    } else if (S.pan.state === 'burnt') { panClear(S.pan); say('burnt spice binned'); }
    else if (S.pan.state === 'toasting') say('still toasting…');
    return;
  }
  if (id.startsWith('protein:')) {
    if (potAddProtein(S.pot, id.slice(8))) say('protein in the pot — add toasted spice + milk');
    else say('pot is busy');
    return;
  }
  if (id === 'milk') {
    if (potAddMilk(S.pot)) say('coconut milk in');
    else say('milk needs a loaded pot');
    return;
  }
  if (id === 'pot') {
    if (S.heldSpice && S.pot.state === 'loading' && !S.pot.spice) {
      potAddSpice(S.pot, S.heldSpice); S.heldSpice = null; say('spice into the pot');
    } else if (S.pot.state === 'ready') {
      const curry = potTake(S.pot);
      if (!S.plate.curry) { S.plate.curry = curry; say('curry on the plate'); }
      else { S.passPlate = { ...emptyPlate(), curry, name: 'spare curry plate' }; say('plate busy — curry waits on the pass'); }
    } else if (S.pot.state === 'burnt') { potReset(S.pot); say('scorched pot scrubbed'); }
    else if (S.pot.state === 'simmering') say('still simmering…');
    else say('pot is empty — click a protein');
    return;
  }
  if (id === 'side:roti') {
    if (griddleStart(S.griddle)) say('roti on the griddle');
    else say('griddle is busy');
    return;
  }
  if (id === 'griddle') {
    if (S.griddle.state === 'ready') {
      if (!S.plate.side) { griddleTake(S.griddle); S.plate.side = 'roti'; say('roti on the plate'); }
      else say('plate already has a side');
    } else if (S.griddle.state === 'burnt') { griddleClear(S.griddle); say('burnt roti binned'); }
    else if (S.griddle.state === 'cooking') say('roti still cooking…');
    return;
  }
  if (id === 'side:rice') {
    if (!S.plate.side) { S.plate.side = 'rice'; say('rice scooped'); }
    else say('plate already has a side');
    return;
  }
  if (id.startsWith('garnish:')) {
    const g = id.slice(8);
    if (!S.plate.garnishes.includes(g)) { S.plate.garnishes.push(g); say(`${g} sprinkled`); }
    else say(`${g} already on`);
    return;
  }
  if (id === 'chilli') {
    if (S.plate.heat < 3) { S.plate.heat += 1; say(`heat now ${S.plate.heat}`); }
    else say('heat is maxed at 3');
    return;
  }
  if (id === 'trash') { S.plate = emptyPlate(); say('plate binned'); return; }
  if (id === 'serve') { serve(); return; }
  if (id === 'plate') { say('build here: curry, side, garnish, heat'); return; }
}

function serve() {
  if (!S.plate.curry) { say('nothing to serve — plate needs a curry'); return; }
  const idx = S.tickets.findIndex(t => plateMatches(S.plate, t.recipe));
  if (idx === -1) { say('no ticket matches this plate — check the board'); return; }
  const [ticket] = S.tickets.splice(idx, 1);
  const { total, tip } = priceFor(ticket);
  S.coins += total; S.served += 1;
  S.passPlate = { ...S.plate, garnishes: [...S.plate.garnishes], name: ticket.recipe.name };
  S.plate = emptyPlate();
  say(`served ${ticket.recipe.name} — ${total} coins${tip ? ` (tip ${tip})` : ''}`);
}

// ---------- live update ----------
function update(dt) {
  if (S.over) return;
  S.elapsed += dt; S.timeLeft = TIMINGS.shiftLength - S.elapsed;
  if (S.toast.t > 0) S.toast.t -= dt;
  panUpdate(S.pan, dt); potUpdate(S.pot, dt); griddleUpdate(S.griddle, dt);
  for (const t of S.tickets) t.left -= dt;
  const gone = S.tickets.filter(t => t.left <= 0);
  if (gone.length) {
    S.tickets = S.tickets.filter(t => t.left > 0);
    S.strikes += gone.length;
    say('a traveller walked away hungry…');
  }
  S.spawnIn -= dt;
  const rushGap = Math.max(4.5, 11 - S.elapsed / TIMINGS.shiftLength * 6);
  if (S.spawnIn <= 0 && S.tickets.length < 3) {
    S.tickets.push(makeTicket(drawRecipe(S.rng, S.elapsed, TIMINGS.shiftLength), S.elapsed));
    S.spawnIn = rushGap;
  }
  if (S.strikes >= 3 || S.timeLeft <= 0) S.over = true;
}

// ---------- deterministic screenshot scenes ----------
// Every scene carries the full judging set: order board with tickets,
// ingredient counter, one dish mid-assembly on the plate, visible timers
// (shift clock, patience bars, station bars) and a finished plate on the
// pass. The cover scene adds the hanging title sign.
function shotScene(kind) {
  const st = freshState(seed);
  const byId = Object.fromEntries(RECIPES.map(r => [r.id, r]));
  st.elapsed = kind === 'cover' ? 42 : kind === 'rush' ? 118 : 86;
  st.timeLeft = TIMINGS.shiftLength - st.elapsed;
  st.coins = kind === 'serve' ? 96 : kind === 'rush' ? 74 : 38;
  st.served = kind === 'serve' ? 6 : kind === 'rush' ? 5 : 2;
  const t1 = makeTicket(byId['masala-lamb'], 0);
  const t2 = makeTicket(byId['golden-chicken'], 0);
  const t3 = makeTicket(byId['rendang-fish'], 0);
  t1.left = t1.patience * (kind === 'rush' ? 0.34 : 0.72);
  t2.left = t2.patience * (kind === 'rush' ? 0.55 : 0.86);
  t3.left = t3.patience * 0.48;
  st.tickets = kind === 'cover' ? [t1, t2] : [t1, t2, t3];
  // pan mid-toast, pot mid-simmer, roti on the griddle
  st.pan.spice = 'masala'; st.pan.state = 'toasting'; st.pan.t = 3.1;
  st.pot.protein = 'lamb'; st.pot.spice = 'rendang'; st.pot.milk = true;
  st.pot.state = 'simmering'; st.pot.t = kind === 'rush' ? 6.4 : 4.6;
  st.griddle.state = 'cooking'; st.griddle.t = 2.4;
  // one dish mid-assembly: golden chicken curry + rice, heat set, awaiting coriander
  st.plate = { curry: { protein: 'chicken', spice: 'turmeric' }, side: 'rice', garnishes: [], heat: 1 };
  // one finished plate waiting on the pass
  st.passPlate = {
    curry: { protein: 'lamb', spice: 'masala' }, side: 'roti',
    garnishes: ['shallot'], heat: 2, name: 'Masala Lamb Curry',
  };
  st.toast = { text: kind === 'serve' ? 'served Masala Lamb Curry — 27 coins (tip 9)' : kind === 'rush' ? 'rush hour on the route — three travellers waiting' : 'toast the spice first — the route rewards a plan', t: 99 };
  return st;
}

if (shot) {
  const st = shotScene(shot);
  drawScene(ctx, st, { title: shot === 'cover' });
} else {
  bindInput(canvas, act);
  S.tickets.push(makeTicket(drawRecipe(S.rng, 0, TIMINGS.shiftLength), 0));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt);
    drawScene(ctx, S, {});
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
