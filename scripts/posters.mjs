#!/usr/bin/env node
// Capturas de las referencias (Chrome real, fuentes cargadas, movimiento reducido, modo ?still).
// Por referencia genera en public/posters/:
//   <slug>-<hash>-desktop.avif|webp   1440x900  (primera vista de escritorio)
//   <slug>-<hash>-thumb.avif|webp     640x400   (miniatura ligera)
//   <slug>-<hash>-mobile.avif|webp    390x844 @2x
//   <slug>-<hash>-strip.avif|webp     tira de página completa a 900 px de ancho (efecto de recorrido en las tarjetas)
//   <slug>-<hash>-og.jpg              1200x630 <= 300 KB (vista previa al compartir por WhatsApp)
//   <slug>-<hash>-social.jpg          1080x1350 (recorte listo para redes)
// y anota todo en src/data/posters.json con el hash del código fuente (srcHash).
//
// Uso: node scripts/posters.mjs [--slug fogon] [--all] [--check]
//   --check  no captura: falla si alguna referencia construida no tiene captura o quedó vieja.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, scrollThrough } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const OUT = join(PUBLIC, 'posters');
const DATA = join(ROOT, 'src', 'data', 'posters.json');
const REFS = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'references.json'), 'utf8')).refs;

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1] ?? true) : undefined;
};
const only = arg('slug');
const check = process.argv.includes('--check');
const includeAll = process.argv.includes('--all');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

/** Hash del contenido completo de la referencia (código + imágenes). */
export function hashRef(slug) {
  const base = join(PUBLIC, 'ref', slug);
  const h = createHash('sha256');
  for (const f of walk(base).sort()) {
    h.update(relative(base, f).split(sep).join('/'));
    h.update(readFileSync(f));
  }
  return h.digest('hex');
}

const readData = () => (existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : {});
const kb = (n) => +(n / 1024).toFixed(1);

const FREEZE_CSS = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await scrollThrough(page);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {});
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450);
}

async function toAvifWebp(buffer, base, { avifQ = 50, webpQ = 78 } = {}) {
  const avif = await sharp(buffer).avif({ quality: avifQ, effort: 6 }).toBuffer();
  const webp = await sharp(buffer).webp({ quality: webpQ, effort: 6 }).toBuffer();
  writeFileSync(`${base}.avif`, avif);
  writeFileSync(`${base}.webp`, webp);
  return { avifKB: kb(avif.length), webpKB: kb(webp.length) };
}

async function jpegUnder(buffer, file, maxBytes, { w, h }) {
  for (let q = 84; q >= 50; q -= 6) {
    const out = await sharp(buffer).resize(w, h, { fit: 'cover', position: 'top' }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (out.length <= maxBytes || q <= 50) {
      writeFileSync(file, out);
      return { KB: kb(out.length), q };
    }
  }
}

async function capture(browser, base, ref) {
  const slug = ref.slug;
  const lang = ref.langs?.[0] ?? 'es';
  const hash = hashRef(slug);
  const h8 = hash.slice(0, 10);
  const url = `${base}/ref/${slug}/?still&lang=${lang}`;
  const stem = join(OUT, `${slug}-${h8}`);
  mkdirSync(OUT, { recursive: true });
  const sizes = {};

  const shot = async ({ width, height, dpr = 1, mobile = false, fullPage = false }) => {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
      bypassCSP: true,
      serviceWorkers: 'block',
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);
    const buf = await page.screenshot({ fullPage, type: 'png' });
    await ctx.close();
    return buf;
  };

  const desktop = await shot({ width: 1440, height: 900 });
  sizes.desktop = await toAvifWebp(desktop, `${stem}-desktop`);
  // Miniatura ligera (tarjetas de la portada y de la galería)
  const thumbBuf = await sharp(desktop).resize(640, 400, { fit: 'cover', position: 'top' }).toBuffer();
  sizes.thumb = await toAvifWebp(thumbBuf, `${stem}-thumb`, { avifQ: 40, webpQ: 68 });
  const mobile = await shot({ width: 390, height: 844, dpr: 2, mobile: true });
  sizes.mobile = await toAvifWebp(mobile, `${stem}-mobile`);

  let strip = await shot({ width: 900, height: 900, fullPage: true });
  const meta = await sharp(strip).metadata();
  if (meta.height > 6000) strip = await sharp(strip).extract({ left: 0, top: 0, width: meta.width, height: 6000 }).toBuffer();
  sizes.strip = { ...(await toAvifWebp(strip, `${stem}-strip`, { avifQ: 42, webpQ: 70 })), h: Math.min(meta.height, 6000) };

  sizes.og = await jpegUnder(desktop, `${stem}-og.jpg`, 300 * 1024, { w: 1200, h: 630 });
  const social = await shot({ width: 540, height: 675, dpr: 2, mobile: true });
  const socialJpg = await sharp(social).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  writeFileSync(`${stem}-social.jpg`, socialJpg);
  sizes.social = { KB: kb(socialJpg.length) };

  // Borra capturas anteriores de esta referencia con otro hash
  for (const f of readdirSync(OUT)) if (f.startsWith(`${slug}-`) && !f.startsWith(`${slug}-${h8}-`)) rmSync(join(OUT, f));
  return { srcHash: hash, hash: h8, lang, sizes, capturedAt: new Date().toISOString() };
}

const targets = REFS.filter((r) => (only ? r.slug === only : includeAll || r.status === 'built'));
if (only && !targets.length && existsSync(join(PUBLIC, 'ref', only))) targets.push({ slug: only, langs: ['es'] });

const data = readData();

if (check) {
  let bad = 0;
  for (const r of targets) {
    const now = hashRef(r.slug);
    const saved = data[r.slug];
    const state = !saved ? 'SIN CAPTURA' : saved.srcHash !== now ? 'CAPTURA VIEJA' : 'ok';
    if (state !== 'ok') bad++;
    console.log(`${state === 'ok' ? 'ok   ' : 'FALLA'}  ${r.slug.padEnd(12)} ${state}`);
  }
  console.log(`\n${targets.length} referencias, ${bad} con capturas ausentes o viejas.`);
  process.exit(bad ? 1 : 0);
}

if (!targets.length) {
  console.log('No hay referencias para capturar (usa --slug <slug> o marca status "built" en references.json).');
  process.exit(0);
}

const server = createPagesServer({ dir: PUBLIC });
const port = await listen(server, 0);
const base = `http://127.0.0.1:${port}`;
const browser = await launchBrowser();
for (const ref of targets) {
  process.stdout.write(`capturando ${ref.slug} … `);
  data[ref.slug] = await capture(browser, base, ref);
  const s = data[ref.slug].sizes;
  console.log(`ok  escritorio ${s.desktop.avifKB} KB · móvil ${s.mobile.avifKB} KB · tira ${s.strip.avifKB} KB (h ${s.strip.h}) · og ${s.og.KB} KB`);
}
await browser.close();
server.close();
mkdirSync(dirname(DATA), { recursive: true });
writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`\nActualizado ${relative(ROOT, DATA)}`);
