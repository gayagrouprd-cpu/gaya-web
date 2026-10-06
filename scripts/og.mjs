#!/usr/bin/env node
// Imágenes para compartir la portada (WhatsApp, redes): og.jpg (es) y og-en.jpg (en), 1200x630, <= 300 KB.
// Cartel de la marca: fondo azul marino #14213D, logo horizontal del kit (src/assets/marca/), el titular de la portada con su tipografía
// (Archivo ancho en mayúsculas y la palabra en cursiva Bodoni, en naranja #FCA311) y un semitono de caracteres en naranja como el de la
// portada, que rodea el titular sin tocarlo. Fuentes del sitio (node_modules) y nada de red; no hace falta `npm run build`.
// Por omisión SOBREESCRIBE public/og.jpg y public/og-en.jpg (son el aspecto con el que se comparte el sitio: cambiarlo es una decisión del
// dueño); con --out DIR se escriben en otra carpeta para revisarlas.
// Uso: node scripts/og.mjs [--out public]
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const brand = JSON.parse(readFileSync(join(ROOT, 'brand.json'), 'utf8'));
const outDir = resolve(ROOT, arg('out', 'public'));
mkdirSync(outDir, { recursive: true });

// El titular de la portada (src/i18n/v3.ts › hero.title): primera línea, palabra en cursiva, última línea con el punto.
const COPY = {
  es: { file: 'og.jpg', lang: 'es', lines: ['Tu negocio,', 'de ignorar'], em: 'imposible' },
  en: { file: 'og-en.jpg', lang: 'en', lines: ['Your business,', 'to ignore'], em: 'impossible' },
};
const NAVY = '#14213d';
const ORANGE = '#fca311';
const PAPER = '#efe9dd';

const font = (pkg, file) => pathToFileURL(join(ROOT, 'node_modules/@fontsource-variable', pkg, 'files', file)).href;
const FONTS = {
  sans: font('archivo', 'archivo-latin-wdth-normal.woff2'),
  serif: font('bodoni-moda', 'bodoni-moda-latin-opsz-italic.woff2'),
  mono: font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2'),
};

// Logo horizontal sobre oscuro, tal cual el kit; el viewBox se recorta al dibujo para alinearlo con el titular.
const logo = readFileSync(join(ROOT, 'src/assets/marca/gaya-digital-horizontal-sobre-oscuro.svg'), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/viewBox="[^"]*"/, 'viewBox="10 34.5 363.5 108" class="logo" aria-hidden="true"');

const pageHtml = ({ lang, lines: [first, last], em }) => `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(${FONTS.sans});font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:B;src:url(${FONTS.serif});font-style:italic;font-weight:400 900}
@font-face{font-family:J;src:url(${FONTS.mono});font-weight:100 800}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:${NAVY}}
canvas{position:absolute;inset:0}
.wrap{position:absolute;inset:0;padding:60px 64px 54px;display:flex;flex-direction:column;justify-content:space-between;color:${PAPER}}
.logo{display:block;align-self:flex-start;height:66px;width:auto}
h1{font:900 86px/.88 A;font-stretch:112%;text-transform:uppercase;letter-spacing:-.015em;word-spacing:.06em}
h1 span{display:block}
h1 em{display:block;font:italic 500 .92em/1 B;font-stretch:100%;text-transform:none;letter-spacing:-.01em;padding:.04em 0 .08em;color:${ORANGE}}
h1 i{display:inline-block;width:.2em;height:.2em;margin-left:.04em;border-radius:50%;background:${ORANGE}}
.url{margin-top:30px;font:500 22px/1 J;letter-spacing:.07em;text-transform:uppercase}
</style>
<canvas width="1200" height="630"></canvas>
<div class="wrap">${logo}<div><h1><span>${first}</span><em>${em}</em><span>${last}<i></i></span></h1><div class="url">${brand.domain}</div></div></div>
<script>
(async () => {
  await document.fonts.load('700 17px J');
  await document.fonts.ready;
  const cv = document.querySelector('canvas');
  const g = cv.getContext('2d');
  g.font = '700 17px J';
  g.textBaseline = 'top';
  g.fillStyle = '${ORANGE}';
  const cw = g.measureText('M').width, ch = 21;
  const cols = Math.ceil(1200 / cw), rows = Math.ceil(630 / ch);
  // Celdas ocupadas por el texto y el logo (con una celda de margen): el semitono las rodea
  const busy = new Uint8Array(cols * rows);
  const range = document.createRange();
  const rects = [...document.querySelectorAll('.logo, h1 i')].map((e) => e.getBoundingClientRect());
  const walker = document.createTreeWalker(document.querySelector('.wrap'), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    range.selectNodeContents(n);
    rects.push(...range.getClientRects());
  }
  for (const r of rects) {
    for (let y = Math.max(0, Math.floor(r.top / ch) - 1); y < Math.min(rows, Math.ceil(r.bottom / ch) + 1); y++)
      for (let x = Math.max(0, Math.floor(r.left / cw) - 2); x < Math.min(cols, Math.ceil(r.right / cw) + 2); x++) busy[y * cols + x] = 1;
  }
  // Mancha de luz desde la esquina inferior derecha, como el semitono de la portada: una columna sí y otra no, de puntos a arrobas
  const RAMP = ['.', '.', ':', ':', 'o', 'o', '0', '@'];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x += 2) {
      if (busy[y * cols + x]) continue;
      const px = x * cw + cw / 2, py = y * ch + ch / 2;
      const d = Math.hypot((px - 1300) / 640, (py - 720) / 560);
      const v = 1 - d + ((x * 7 + y * 13) % 5) * 0.015;
      if (v <= 0.04) continue;
      if (v < 0.2 && (x / 2 + y) % 2) continue;
      g.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))], x * cw, y * ch);
    }
  }
  document.documentElement.dataset.ready = '1';
})();
</script>`;

const browser = await launchBrowser({ args: ['--allow-file-access-from-files'] });
const tmp = mkdtempSync(join(tmpdir(), 'gaya-og-'));
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
for (const copy of Object.values(COPY)) {
  const file = join(tmp, `og-${copy.lang}.html`);
  writeFileSync(file, pageHtml(copy));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 15000 });
  const out = join(outDir, copy.file);
  for (const quality of [90, 84, 78, 70]) {
    await page.screenshot({ path: out, type: 'jpeg', quality });
    const kb = statSync(out).size / 1024;
    if (kb <= 300) {
      console.log(`${out}  1200x630  ${kb.toFixed(1)} KB (calidad ${quality})`);
      break;
    }
  }
}
await browser.close();
