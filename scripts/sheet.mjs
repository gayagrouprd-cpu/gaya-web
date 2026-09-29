#!/usr/bin/env node
// Hoja de contactos: junta imágenes en una cuadrícula (para revisar varias vistas de un vistazo).
// Uso: node scripts/sheet.mjs --out reports/sheet.png --cols 3 --w 640 --h 400 [--fit cover|contain] [--gap 14] [--bg "#0b0b0d"] a.png b.png c.png ...
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const argv = process.argv.slice(2);
const opts = {};
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    opts[argv[i].slice(2)] = argv[i + 1];
    i++;
  } else files.push(argv[i]);
}
const cols = Number(opts.cols ?? 3);
const w = Number(opts.w ?? 640);
const h = Number(opts.h ?? 400);
const gap = Number(opts.gap ?? 14);
const pad = Number(opts.pad ?? 20);
const fit = opts.fit ?? 'cover';
const bg = opts.bg ?? '#0b0b0d';
const out = resolve(opts.out ?? 'reports/sheet.png');

const rows = Math.ceil(files.length / cols);
const W = pad * 2 + cols * w + (cols - 1) * gap;
const H = pad * 2 + rows * h + (rows - 1) * gap;
const layers = [];
for (let i = 0; i < files.length; i++) {
  const input = await sharp(files[i]).resize(w, h, { fit, position: 'top', background: bg }).png().toBuffer();
  layers.push({ input, left: pad + (i % cols) * (w + gap), top: pad + Math.floor(i / cols) * (h + gap) });
}
mkdirSync(dirname(out), { recursive: true });
await sharp({ create: { width: W, height: H, channels: 3, background: bg } }).composite(layers).png().toFile(out);
console.log(`${out}  ${W}×${H}  (${files.length} imágenes)`);
