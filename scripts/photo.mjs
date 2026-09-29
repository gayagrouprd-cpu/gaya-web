#!/usr/bin/env node
// Ayudante de fotos: descarga una foto libre (Pexels por id, o cualquier URL), la recorta, le da un
// tratamiento de color y la exporta a AVIF + WebP en varios anchos, y anota el crédito.
//
// Uso:
//   node scripts/photo.mjs --slug fogon --name hero --id 8218487 [--w 1600,800] [--ar 16:9] [--pos attention]
//        [--grade none|bw|duotone] [--duotone "#101010,#c9a24d"] [--contrast 1.1] [--brightness 1]
//        [--q 52] [--wq 74]   calidad AVIF y WebP (baja --q si el AVIF más ancho pasa de 120 KB en imágenes hero)
//        [--credit "Autor"] [--alt "Texto alternativo"] [--src https://...]
//   node scripts/photo.mjs --credits        (regenera CREDITS.md desde docs/credits.json)
//
// Salida: public/ref/<slug>/img/<name>-<ancho>.avif|webp  y una línea JSON con tamaños y dimensiones.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Un archivo de créditos por referencia (docs/credits/<slug>.json): varios agentes pueden trabajar a la vez sin pisarse.
const CREDITS_DIR = join(ROOT, 'docs', 'credits');
const CREDITS_MD = join(ROOT, 'CREDITS.md');
const readAllCredits = () =>
  existsSync(CREDITS_DIR)
    ? readdirSync(CREDITS_DIR)
        .filter((f) => f.endsWith('.json'))
        .flatMap((f) => JSON.parse(readFileSync(join(CREDITS_DIR, f), 'utf8')))
    : [];

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : null))
    .filter(Boolean),
);

function writeCreditsMd(list) {
  const rows = list
    .sort((a, b) => (a.slug + a.file).localeCompare(b.slug + b.file))
    .map((c) => `| ${c.slug} | ${c.file} | ${c.credit ?? '—'} | ${c.source} | ${c.license} |`);
  const md = [
    '# Créditos de fotos',
    '',
    'Fotos con licencia libre (Pexels / Unsplash): se pueden usar sin atribución; se acreditan por cortesía.',
    'Se usan solo en las webs de ejemplo (`public/ref/*/img/`). Las personas que aparecen no son clientes ni se relacionan con Gaya Group.',
    '',
    '| Referencia | Archivo | Autor/a | Fuente | Licencia |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
  writeFileSync(CREDITS_MD, md);
}

if (args.credits) {
  const list = readAllCredits();
  writeCreditsMd(list);
  console.log(`CREDITS.md regenerado (${list.length} fotos).`);
  process.exit(0);
}

const { slug, name } = args;
if (!slug || !name || (!args.id && !args.src)) {
  console.error('Faltan datos. Ejemplo: node scripts/photo.mjs --slug fogon --name hero --id 8218487 --ar 16:9 --w 1600,800');
  process.exit(1);
}

const source = args.src ?? `https://images.pexels.com/photos/${args.id}/pexels-photo-${args.id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
const widths = String(args.w ?? '1600,800').split(',').map(Number);
const res = await fetch(source, { headers: { 'User-Agent': 'gaya-web-photo/1.0' } });
if (!res.ok) {
  console.error(`No se pudo descargar (${res.status}): ${source}`);
  process.exit(1);
}
const input = Buffer.from(await res.arrayBuffer());
const meta = await sharp(input).metadata();

const maxW = Math.max(...widths);
let pipeline = sharp(input).rotate();
if (args.ar) {
  const [aw, ah] = String(args.ar).split(':').map(Number);
  const w = Math.min(maxW, meta.width);
  const h = Math.round((w * ah) / aw);
  pipeline = pipeline.resize(w, h, { fit: 'cover', position: args.pos === 'attention' ? sharp.strategy.attention : (args.pos ?? 'centre') });
} else {
  pipeline = pipeline.resize({ width: Math.min(maxW, meta.width), withoutEnlargement: true });
}

const bright = args.brightness ? Number(args.brightness) : 1;
const cont = args.contrast ? Number(args.contrast) : 1;
if (bright !== 1 || cont !== 1) pipeline = pipeline.linear(cont, 128 * (1 - cont)).modulate({ brightness: bright });

let base = await pipeline.toBuffer();

// Tratamientos de color
const grade = args.grade ?? 'none';
if (grade === 'bw') {
  base = await sharp(base).greyscale().normalise({ lower: 2, upper: 98 }).toBuffer();
} else if (grade === 'duotone') {
  const [c1, c2] = String(args.duotone ?? '#101010,#e5c07b').split(',').map((h) => {
    const n = parseInt(h.trim().replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  const { data, info } = await sharp(base).greyscale().normalise({ lower: 2, upper: 98 }).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const t = data[i * info.channels] / 255;
    out[i * 3] = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    out[i * 3 + 1] = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    out[i * 3 + 2] = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  }
  base = await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
}

const outDir = join(ROOT, 'public', 'ref', slug, 'img');
mkdirSync(outDir, { recursive: true });
const written = [];
for (const w of widths) {
  const img = sharp(base).resize({ width: w, withoutEnlargement: true });
  const info = await img.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  const avif = await img.clone().avif({ quality: Number(args.q ?? 52), effort: 6 }).toBuffer();
  const webp = await img.clone().webp({ quality: Number(args.wq ?? 74), effort: 6 }).toBuffer();
  writeFileSync(join(outDir, `${name}-${w}.avif`), avif);
  writeFileSync(join(outDir, `${name}-${w}.webp`), webp);
  written.push({ w: info.width, h: info.height, avifKB: +(avif.length / 1024).toFixed(1), webpKB: +(webp.length / 1024).toFixed(1) });
}

// Crédito
const creditsFile = join(CREDITS_DIR, `${slug}.json`);
const list = existsSync(creditsFile) ? JSON.parse(readFileSync(creditsFile, 'utf8')) : [];
const file = `ref/${slug}/img/${name}`;
const entry = {
  slug,
  file,
  credit: args.credit && args.credit !== true ? args.credit : null,
  alt: args.alt && args.alt !== true ? args.alt : null,
  source: args.src ?? `https://www.pexels.com/photo/${args.id}/`,
  license: args.src && /unsplash/.test(args.src) ? 'Unsplash' : 'Pexels',
};
const idx = list.findIndex((c) => c.file === file);
if (idx > -1) list[idx] = entry;
else list.push(entry);
mkdirSync(CREDITS_DIR, { recursive: true });
writeFileSync(creditsFile, JSON.stringify(list, null, 2) + '\n');
writeCreditsMd(readAllCredits());

console.log(JSON.stringify({ slug, name, original: `${meta.width}x${meta.height}`, grade, files: written, credit: entry.credit }));
