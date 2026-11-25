// Curry Voyage — Spice Route Kitchen: hand-in program for the make.fun
// best-cooking-game bounty. The playable game lives in game/ as plain
// static files (open game/index.html in a desktop browser, no network
// needed). This program copies game/ and screenshots/ into the output
// directory and stamps dossier.json there with the vendored make.fun
// library, using the scorer's own caps so an entry the scorer would
// refuse is refused here first.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(target, { recursive: true });
cpSync(join(root, 'game'), join(target, 'game'), { recursive: true });
mkdirSync(join(target, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(target, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(target, 'dossier.json'),
  buildDossier(target, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
