// CURRY VOYAGE — input: mouse clicks on stations/bins plus a keyboard
// route for fast cooks. Keys mirror the counter left-to-right:
// 1-3 raw spices, 4-7 proteins, 8 coconut milk, 9 rice, 0 roti dough,
// Q coriander, W shallot, E chilli flakes. Enter/Space serves the plate,
// Backspace bins it, T toasts-to-pot shortcut is just clicking the pan.

import { zones, binLayout } from './render.js';

// Map a canvas click to an action id using the shared zone layout.
export function actionAt(x, y) {
  for (const z of zones()) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z.id;
  }
  return null;
}

const KEYMAP = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5,
  Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9, KeyQ: 10, KeyW: 11, KeyE: 12,
};

// Translate a keyboard event into the same action ids clicks produce.
export function actionForKey(code) {
  if (code === 'Enter' || code === 'Space') return 'serve';
  if (code === 'Backspace') return 'trash';
  if (code === 'KeyR') return 'restart';
  if (code === 'KeyP') return 'pan';
  if (code === 'KeyO') return 'pot';
  if (code === 'KeyG') return 'griddle';
  const idx = KEYMAP[code];
  if (idx === undefined) return null;
  const bins = binLayout();
  return bins[idx] ? bins[idx].id : null;
}

// Attach listeners to the canvas; handler receives action ids.
export function bindInput(canvas, handler) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    const id = actionAt(x, y);
    if (id) handler(id);
  });
  window.addEventListener('keydown', (ev) => {
    const id = actionForKey(ev.code);
    if (id) { ev.preventDefault(); handler(id); }
  });
}
