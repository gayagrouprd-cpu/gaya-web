#!/usr/bin/env node
// Parte una captura de página completa en N tiras de 1100 px de ancho para revisarla a la vista.
// Uso: node scripts/strips.mjs <captura.png> <prefijo> [n=4]
import sharp from 'sharp';

const [, , src, prefix, n = '4'] = process.argv;
if (!src || !prefix) {
  console.error('Uso: node scripts/strips.mjs <captura.png> <prefijo> [n]');
  process.exit(1);
}
const m = await sharp(src).metadata();
const parts = Number(n);
const h = Math.ceil(m.height / parts);
for (let i = 0; i < parts; i++) {
  const top = i * h;
  await sharp(src)
    .extract({ left: 0, top, width: m.width, height: Math.min(h, m.height - top) })
    .resize({ width: 1100 })
    .toFile(`${prefix}-${i + 1}.png`);
}
console.log(`${m.width}x${m.height} → ${parts} tiras`);
