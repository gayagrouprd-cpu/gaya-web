#!/usr/bin/env node
// Compara dos capturas (PNG) píxel a píxel: sirve para comprobar que una página «se ve igual» antes y después de un cambio de CSS.
// Uso: node scripts/shot-diff.mjs antes.png despues.png [--out diff.png] [--tol 8]
//   --tol  diferencia máxima por canal que aún cuenta como igual (antialiasing, 0–255; por defecto 8)
// Imprime el % de píxeles distintos, la mayor diferencia por canal y el rectángulo que los contiene. Sale con 1 si hay diferencias.
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const [a, b] = process.argv.slice(2).filter((x) => x.endsWith('.png') && !x.startsWith('--'));
if (!a || !b) {
  console.error('Uso: node scripts/shot-diff.mjs antes.png despues.png [--out diff.png] [--tol 8]');
  process.exit(2);
}
const tol = Number(arg('tol', 8));
const read = async (f) => {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};
const A = await read(a);
const B = await read(b);
if (A.w !== B.w || A.h !== B.h) {
  console.log(`FALLA  tamaños distintos: ${A.w}×${A.h} frente a ${B.w}×${B.h}`);
  process.exit(1);
}
let differing = 0;
let worst = 0;
let x0 = A.w;
let y0 = A.h;
let x1 = -1;
let y1 = -1;
const mask = Buffer.alloc(A.w * A.h * 3);
for (let i = 0, p = 0; i < A.data.length; i += 3, p++) {
  const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
  worst = Math.max(worst, d);
  if (d > tol) {
    differing++;
    const x = p % A.w;
    const y = (p / A.w) | 0;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
    mask[i] = 255;
  } else {
    mask[i] = mask[i + 1] = mask[i + 2] = Math.round(A.data[i] * 0.25);
  }
}
const pct = (differing / (A.w * A.h)) * 100;
console.log(`${differing ? 'DIFIERE' : 'igual  '}  ${a.split(/[\\/]/).pop()} ↔ ${b.split(/[\\/]/).pop()}: ${pct.toFixed(3)} % de píxeles (${differing} de ${A.w * A.h}), mayor diferencia ${worst}/255${differing ? `, en x ${x0}–${x1} · y ${y0}–${y1}` : ''}`);
if (arg('out', null) && differing) await sharp(mask, { raw: { width: A.w, height: A.h, channels: 3 } }).png().toFile(arg('out'));
process.exit(differing ? 1 : 0);
