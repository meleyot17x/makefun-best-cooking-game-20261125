// CURRY VOYAGE — every pixel of the spice-route kitchen, drawn in code.
// Saffron and maroon harbour stall: order board on the left, three hot
// stations in the middle, the pass on the right, and a long counter of
// ingredient bins along the bottom. No image assets — canvas only.

import { SPICES, PROTEINS, SIDES, GARNISHES, TIMINGS } from './recipes.js';
import { patienceFrac } from './orders.js';
import { stationBar } from './stations.js';

export const W = 1280, H = 800;

// Clickable zones, shared by input.js. Coordinates match the drawing below.
export function zones() {
  const z = [];
  z.push({ id: 'pan', x: 330, y: 120, w: 170, h: 150 });
  z.push({ id: 'pot', x: 530, y: 105, w: 220, h: 180 });
  z.push({ id: 'griddle', x: 780, y: 120, w: 170, h: 150 });
  z.push({ id: 'plate', x: 520, y: 330, w: 240, h: 190 });
  z.push({ id: 'serve', x: 990, y: 330, w: 250, h: 64 });
  z.push({ id: 'trash', x: 990, y: 410, w: 250, h: 52 });
  const bins = binLayout();
  for (const b of bins) z.push({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h });
  z.push({ id: 'restart', x: 490, y: 470, w: 300, h: 64 });
  return z;
}

// The ingredient counter: two tidy rows of labelled bins.
export function binLayout() {
  const defs = [
    { id: 'spice:masala', label: 'Garam Masala', sub: 'raw spice', color: '#8a5a2b' },
    { id: 'spice:turmeric', label: 'Turmeric Gold', sub: 'raw spice', color: '#e0a41c' },
    { id: 'spice:rendang', label: 'Rendang Dark', sub: 'raw spice', color: '#5d3a1e' },
    { id: 'protein:chicken', label: 'Chicken', sub: 'protein', color: '#e8b04b' },
    { id: 'protein:lamb', label: 'Lamb', sub: 'protein', color: '#a8542f' },
    { id: 'protein:fish', label: 'Fish', sub: 'protein', color: '#d9d3c3' },
    { id: 'protein:chickpea', label: 'Chickpea', sub: 'protein', color: '#d9a75a' },
    { id: 'milk', label: 'Coconut Milk', sub: 'pot', color: '#f7f3e8' },
    { id: 'side:rice', label: 'Steamed Rice', sub: 'side', color: '#f4efe2' },
    { id: 'side:roti', label: 'Roti Dough', sub: 'griddle', color: '#e3b96a' },
    { id: 'garnish:coriander', label: 'Coriander', sub: 'garnish', color: '#3f9e4d' },
    { id: 'garnish:shallot', label: 'Fried Shallot', sub: 'garnish', color: '#c98d3d' },
    { id: 'chilli', label: 'Chilli Flakes', sub: 'heat +1', color: '#c22e1f' },
  ];
  const out = [];
  const bw = 92, bh = 74, gap = 6, x0 = 14, y0 = 612;
  defs.forEach((d, i) => {
    out.push({ ...d, x: x0 + i * (bw + gap), y: y0, w: bw, h: bh });
  });
  return out;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, s, x, y, size, color, align = 'left', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg = '#2a1408') {
  ctx.fillStyle = bg; rr(ctx, x, y, w, h, h / 2); ctx.fill();
  if (frac > 0) { ctx.fillStyle = color; rr(ctx, x, y, Math.max(h, w * frac), h, h / 2); ctx.fill(); }
}

const PHASE_COLOR = { idle: '#6b543a', loading: '#d9a441', cooking: '#e07b26', ready: '#57b24a', burnt: '#c22e1f' };

// ---------- food on a plate, drawn from plate data ----------
export function drawPlateFood(ctx, cx, cy, R, plate) {
  // plate rim
  ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e2d5b8'; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.82, R * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  if (!plate || (!plate.curry && !plate.side)) {
    text(ctx, 'empty plate', cx, cy, 13, '#9a8a68', 'center');
    return;
  }
  // side first (rice mound left, roti right-folded)
  if (plate.side === 'rice') {
    ctx.fillStyle = SIDES.rice.color;
    ctx.beginPath(); ctx.ellipse(cx - R * 0.38, cy + R * 0.08, R * 0.34, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.ellipse(cx - R * 0.42, cy, R * 0.2, R * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (plate.side === 'roti') {
    ctx.fillStyle = SIDES.roti.color;
    ctx.beginPath(); ctx.ellipse(cx + R * 0.42, cy + R * 0.16, R * 0.3, R * 0.22, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b97f2e';
    for (const [dx, dy] of [[-0.08, 0.05], [0.06, 0.14], [0.0, 0.22]]) {
      ctx.beginPath(); ctx.ellipse(cx + R * (0.42 + dx), cy + R * (0.16 + dy), 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // curry mound with protein chunks
  if (plate.curry) {
    const spice = SPICES[plate.curry.spice];
    const sauce = plate.curry.spice === 'turmeric' ? '#d98a16' : plate.curry.spice === 'masala' ? '#a34d14' : '#5f2d10';
    ctx.fillStyle = sauce;
    ctx.beginPath(); ctx.ellipse(cx + R * 0.08, cy - R * 0.05, R * 0.44, R * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.35)';
    ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.16, R * 0.2, R * 0.1, -0.4, 0, Math.PI * 2); ctx.fill();
    const pc = PROTEINS[plate.curry.protein].color;
    ctx.fillStyle = pc;
    const chunks = [[-0.12, -0.02], [0.14, 0.06], [0.02, -0.18], [0.2, -0.12], [-0.04, 0.12]];
    for (const [dx, dy] of chunks) {
      ctx.beginPath(); ctx.ellipse(cx + R * (0.08 + dx), cy + R * (-0.05 + dy), R * 0.09, R * 0.07, dx * 4, 0, Math.PI * 2); ctx.fill();
    }
    void spice;
  }
  // garnishes + chilli heat
  if (plate.garnishes) {
    for (const g of plate.garnishes) {
      ctx.fillStyle = GARNISHES[g].color;
      const seed = g === 'coriander' ? 3 : 11;
      for (let i = 0; i < 9; i++) {
        const a = (i * 2.39 + seed), rad = R * (0.12 + ((i * 37 + seed) % 30) / 100);
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rad, cy - R * 0.05 + Math.sin(a) * rad * 0.7, 4.5, 2.6, a, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (plate.heat > 0) {
    ctx.fillStyle = '#c22e1f';
    for (let i = 0; i < plate.heat * 4; i++) {
      const a = i * 1.7 + 0.6, rad = R * (0.15 + ((i * 29) % 26) / 100);
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rad, cy - R * 0.05 + Math.sin(a) * rad * 0.7, 3.4, 2, a, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ---------- one order ticket ----------
function drawTicket(ctx, t, x, y, w) {
  const r = t.recipe;
  ctx.fillStyle = '#fdf6e3'; rr(ctx, x, y, w, 118, 8); ctx.fill();
  ctx.fillStyle = '#b03a1e'; rr(ctx, x, y, w, 24, 8); ctx.fill();
  ctx.fillStyle = '#b03a1e'; ctx.fillRect(x, y + 14, w, 10);
  text(ctx, `TICKET #${t.no}`, x + 10, y + 12, 13, '#ffe9c9', 'left', true);
  text(ctx, `${r.price}c`, x + w - 10, y + 12, 13, '#ffe9c9', 'right', true);
  text(ctx, r.name, x + 10, y + 38, 14.5, '#3a2410', 'left', true);
  const line = `${PROTEINS[r.protein].name} · ${SPICES[r.spice].name} toasted`;
  text(ctx, line, x + 10, y + 58, 12, '#5d4020');
  const gtxt = r.garnishes.length ? r.garnishes.map(g => GARNISHES[g].name).join(' + ') : 'no garnish';
  text(ctx, `${SIDES[r.side].name} · ${gtxt}`, x + 10, y + 76, 12, '#5d4020');
  text(ctx, 'heat', x + 10, y + 95, 11, '#8a6a3a');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < r.heat ? '#c22e1f' : '#ddd2ba';
    ctx.beginPath(); ctx.ellipse(x + 48 + i * 15, y + 95, 5.5, 3.6, -0.5, 0, Math.PI * 2); ctx.fill();
  }
  const frac = patienceFrac(t);
  bar(ctx, x + w - 92, y + 88, 82, 11, frac, frac > 0.45 ? '#57b24a' : frac > 0.22 ? '#e07b26' : '#c22e1f', '#e4d9bd');
}

// ---------- stations ----------
function timerBar(ctx, x, y, w, st, kind) {
  const b = stationBar(st, kind);
  bar(ctx, x, y, w, 12, b.frac, PHASE_COLOR[b.phase]);
  const label = { idle: 'idle', loading: 'loading…', cooking: kind === 'pot' ? 'simmering…' : 'working…', ready: 'READY ✓', burnt: 'BURNT ✗' }[b.phase];
  text(ctx, label, x + w / 2, y + 24, 12, PHASE_COLOR[b.phase], 'center', true);
}

function drawPan(ctx, pan) {
  const x = 330, y = 120;
  text(ctx, 'TOAST PAN — sangrai', x + 85, y - 14, 14, '#ffd98a', 'center', true);
  ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.ellipse(x + 85, y + 78, 78, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#242428'; ctx.beginPath(); ctx.ellipse(x + 85, y + 72, 66, 42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3a40'; ctx.fillRect(x + 152, y + 62, 34, 12);
  if (pan.spice) {
    const sp = SPICES[pan.spice];
    ctx.fillStyle = pan.state === 'burnt' ? '#17110a' : pan.state === 'ready' ? sp.toastColor : sp.rawColor;
    ctx.beginPath(); ctx.ellipse(x + 85, y + 72, 52, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(x + 70, y + 62, 20, 9, -0.3, 0, Math.PI * 2); ctx.fill();
    text(ctx, sp.name, x + 85, y + 74, 12.5, '#ffe9c9', 'center', true);
  } else {
    text(ctx, 'click a raw spice', x + 85, y + 74, 12, '#8d8578', 'center');
  }
  timerBar(ctx, x + 8, y + 140, 154, pan, 'pan');
}

function drawPot(ctx, pot) {
  const x = 530, y = 105;
  text(ctx, 'SIMMER POT', x + 110, y - 12, 15, '#ffd98a', 'center', true);
  ctx.fillStyle = '#7a2d12'; rr(ctx, x + 8, y + 52, 204, 118, 16); ctx.fill();
  ctx.fillStyle = '#93380f'; rr(ctx, x + 8, y + 44, 204, 26, 13); ctx.fill();
  if (pot.protein) {
    const sauce = !pot.spice ? '#c9a15a' : pot.spice === 'turmeric' ? '#d98a16' : pot.spice === 'masala' ? '#a34d14' : '#5f2d10';
    ctx.fillStyle = pot.state === 'burnt' ? '#17110a' : sauce;
    ctx.beginPath(); ctx.ellipse(x + 110, y + 58, 92, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PROTEINS[pot.protein].color;
    for (const [dx, dy] of [[-40, -2], [0, 3], [38, -2], [-18, 5], [22, 5]]) {
      ctx.beginPath(); ctx.ellipse(x + 110 + dx, y + 58 + dy, 11, 6, dx / 20, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    text(ctx, 'click a protein', x + 110, y + 58, 12.5, '#e8c9a0', 'center');
  }
  const needs = [];
  if (pot.state === 'loading') {
    if (!pot.spice) needs.push('needs toasted spice');
    if (!pot.milk) needs.push('needs coconut milk');
  }
  text(ctx, needs.join(' + ') || (pot.protein ? `${PROTEINS[pot.protein].name}${pot.spice ? ' · ' + SPICES[pot.spice].name : ''}${pot.milk ? ' · milk' : ''}` : ''), x + 110, y + 100, 12.5, '#ffe9c9', 'center');
  text(ctx, pot.state === 'empty' ? 'pot empty' : pot.state, x + 110, y + 122, 12, '#d9b98a', 'center');
  timerBar(ctx, x + 20, y + 150, 180, pot, 'pot');
}

function drawGriddle(ctx, g) {
  const x = 780, y = 120;
  text(ctx, 'ROTI GRIDDLE', x + 85, y - 14, 14, '#ffd98a', 'center', true);
  ctx.fillStyle = '#2e2e33'; rr(ctx, x + 8, y + 30, 154, 96, 10); ctx.fill();
  ctx.fillStyle = '#1c1c20'; rr(ctx, x + 16, y + 38, 138, 80, 8); ctx.fill();
  if (g.state !== 'empty') {
    ctx.fillStyle = g.state === 'burnt' ? '#241708' : g.state === 'ready' ? '#e3b96a' : '#efdcb0';
    ctx.beginPath(); ctx.ellipse(x + 85, y + 78, 52, 32, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b97f2e';
    for (const [dx, dy] of [[-18, -6], [10, 8], [22, -12]]) {
      ctx.beginPath(); ctx.ellipse(x + 85 + dx, y + 78 + dy, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    text(ctx, 'click roti dough', x + 85, y + 78, 12, '#8d8578', 'center');
  }
  timerBar(ctx, x + 8, y + 140, 154, g, 'griddle');
}

// ---------- the whole scene ----------
export function drawScene(ctx, s, opts = {}) {
  // harbour-stall backdrop: deep maroon wall, saffron awning, route lights
  ctx.fillStyle = '#40160d'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#571f10'; ctx.fillRect(0, 56, W, 540);
  ctx.fillStyle = '#e0a41c';
  for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(i * 85, 56); ctx.lineTo(i * 85 + 42, 84); ctx.lineTo(i * 85 + 85, 56); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,190,80,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 108); ctx.quadraticCurveTo(W / 2, 150, W, 104); ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  for (let i = 0; i <= 12; i++) { const x = i * (W / 12); const y = 108 + Math.sin(i / 12 * Math.PI) * 20 - 4; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  // spice sacks silhouette on the wall
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (const [x, y, r] of [[356, 560, 26], [412, 566, 20], [905, 562, 24]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }

  // top bar
  ctx.fillStyle = '#2a0d05'; ctx.fillRect(0, 0, W, 56);
  text(ctx, 'CURRY VOYAGE', 18, 28, 24, '#ffb340', 'left', true);
  text(ctx, 'spice route kitchen', 218, 30, 13, '#d9b98a');
  const mm = Math.max(0, Math.ceil(s.timeLeft));
  text(ctx, `SHIFT ${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`, W / 2, 28, 26, mm <= 30 ? '#ff7a5c' : '#ffe9c9', 'center', true);
  text(ctx, `coins ${s.coins}`, W - 190, 28, 19, '#ffd94d', 'right', true);
  text(ctx, `served ${s.served}`, W - 105, 28, 15, '#e8dcc0', 'right');
  text(ctx, '✗'.repeat(s.strikes) || '—', W - 16, 28, 16, '#ff7a5c', 'right', true);

  // order board (left)
  ctx.fillStyle = '#33150a'; rr(ctx, 12, 128, 292, 452, 10); ctx.fill();
  text(ctx, 'ORDER BOARD — travellers', 158, 146, 15, '#ffd98a', 'center', true);
  s.tickets.slice(0, 3).forEach((t, i) => drawTicket(ctx, t, 22, 162 + i * 128, 272));
  if (!s.tickets.length) text(ctx, 'no travellers yet…', 158, 220, 14, '#a98d5f', 'center');

  // stations
  drawPan(ctx, s.pan);
  drawPot(ctx, s.pot);
  drawGriddle(ctx, s.griddle);

  // assembly plate (centre)
  text(ctx, 'ASSEMBLY PLATE — click pot / bins to build', 640, 316, 14, '#ffd98a', 'center', true);
  drawPlateFood(ctx, 640, 428, 118, s.plate);
  const parts = [];
  if (s.plate.curry) parts.push(`${PROTEINS[s.plate.curry.protein].name} ${SPICES[s.plate.curry.spice].name}`);
  if (s.plate.side) parts.push(SIDES[s.plate.side].name);
  if (s.plate.garnishes.length) parts.push(s.plate.garnishes.map(g => GARNISHES[g].name).join('+'));
  if (s.plate.heat) parts.push(`heat ${s.plate.heat}`);
  text(ctx, parts.join(' · ') || 'plate is empty', 640, 540, 13.5, '#ffe9c9', 'center');
  if (s.heldSpice) {
    ctx.fillStyle = SPICES[s.heldSpice].toastColor; rr(ctx, 528, 552, 224, 26, 13); ctx.fill();
    text(ctx, `holding toasted ${SPICES[s.heldSpice].name} → click POT`, 640, 565, 12.5, '#ffe9c9', 'center', true);
  }

  // pass (right): finished plate + serve / trash
  ctx.fillStyle = '#33150a'; rr(ctx, 978, 128, 290, 168, 10); ctx.fill();
  text(ctx, 'THE PASS — ready to serve', 1123, 146, 15, '#ffd98a', 'center', true);
  if (s.passPlate) {
    drawPlateFood(ctx, 1123, 224, 62, s.passPlate);
    text(ctx, s.passPlate.name || 'finished plate', 1123, 284, 12.5, '#ffe9c9', 'center');
  } else {
    text(ctx, 'nothing on the pass yet', 1123, 224, 13, '#a98d5f', 'center');
  }
  ctx.fillStyle = '#57b24a'; rr(ctx, 990, 330, 250, 64, 10); ctx.fill();
  text(ctx, 'SERVE PLATE  (Enter)', 1115, 362, 19, '#0d2a08', 'center', true);
  ctx.fillStyle = '#6e3b12'; rr(ctx, 990, 410, 250, 52, 10); ctx.fill();
  text(ctx, 'bin the plate  (Backspace)', 1115, 436, 15, '#ffe9c9', 'center', true);
  text(ctx, 'route: toast spice → pot + milk → simmer →', 1115, 492, 12.5, '#d9b98a', 'center');
  text(ctx, 'plate with side, garnish & exact heat', 1115, 512, 12.5, '#d9b98a', 'center');
  text(ctx, `shift pace ${Math.round((s.elapsed / TIMINGS.shiftLength) * 100)}% — rush grows`, 1115, 540, 12, '#a98d5f', 'center');

  // ingredient counter (bottom)
  ctx.fillStyle = '#2a0d05'; ctx.fillRect(0, 596, W, 204);
  for (const b of binLayout()) {
    ctx.fillStyle = '#47200f'; rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + 24, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2 - 7, b.y + 20, 9, 4.5, -0.3, 0, Math.PI * 2); ctx.fill();
    text(ctx, b.label, b.x + b.w / 2, b.y + 48, 11, '#ffe9c9', 'center', true);
    text(ctx, b.sub, b.x + b.w / 2, b.y + 63, 10, '#c9a06a', 'center');
  }
  text(ctx, 'CURRY VOYAGE — toast, simmer, plate, serve. Burnt food goes in the bin; late travellers walk away (3 strikes ends the shift).', 640, 706 + 78, 13, '#a98d5f', 'center');

  // toast message
  if (s.toast && s.toast.t > 0) {
    ctx.fillStyle = 'rgba(20,8,2,0.88)'; rr(ctx, 390, 60, 500, 40, 20); ctx.fill();
    text(ctx, s.toast.text, 640, 80, 16, '#ffd98a', 'center', true);
  }

  // cover banner: a hanging wooden sign with the game's name, kept on the
  // empty counter strip so it never covers the station labels
  if (opts.title) {
    ctx.fillStyle = '#5d3410'; rr(ctx, 330, 700, 620, 46, 8); ctx.fill();
    ctx.strokeStyle = '#ffb340'; ctx.lineWidth = 2; rr(ctx, 330, 700, 620, 46, 8); ctx.stroke();
    text(ctx, 'CURRY VOYAGE — SPICE ROUTE KITCHEN', 640, 723, 21, '#ffd98a', 'center', true);
  }

  // game over veil
  if (s.over) {
    ctx.fillStyle = 'rgba(20,6,2,0.82)'; ctx.fillRect(0, 0, W, H);
    text(ctx, s.strikes >= 3 ? 'THE STALL GOES DARK' : 'SHIFT COMPLETE', 640, 330, 40, '#ffb340', 'center', true);
    text(ctx, `coins earned ${s.coins} · travellers served ${s.served}`, 640, 386, 20, '#ffe9c9', 'center');
    ctx.fillStyle = '#57b24a'; rr(ctx, 490, 470, 300, 64, 10); ctx.fill();
    text(ctx, 'NEW SHIFT  (R)', 640, 502, 20, '#0d2a08', 'center', true);
  }
}
