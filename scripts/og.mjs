#!/usr/bin/env node
// Imágenes para compartir la portada (WhatsApp, redes): og.jpg (es) y og-en.jpg (en), 1200x630, <= 300 KB.
// El fondo es el fotograma fijo de la escena `cover` pintado por el motor REAL (DIRECTION §12.6: «og desde el motor real»): se abre la
// portada construida con `?still&poster=cover` (el cartel solo, sin pozos), se oculta todo menos el lienzo y se captura. Encima, la marca
// y el titular con las fuentes del sitio. Antes el fondo era public/hero/cobalto-land.webp (la portada WebGL retirada).
// Hace falta `npm run build` antes: lee dist/. Por omisión SOBREESCRIBE public/og.jpg y public/og-en.jpg (son el aspecto con el que se
// comparte el sitio: cambiarlo es una decisión del dueño); con --out DIR se escriben en otra carpeta para revisarlas.
// Uso: node scripts/og.mjs [--dir dist] [--out public]
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const brand = JSON.parse(readFileSync(join(ROOT, 'brand.json'), 'utf8'));
const outDir = resolve(ROOT, arg('out', 'public'));
mkdirSync(outDir, { recursive: true });
const COPY = {
  es: { file: 'og.jpg', path: '/', h1: ['Tu negocio,', 'imposible de ignorar'] },
  en: { file: 'og-en.jpg', path: '/en/', h1: ['Your business,', 'impossible to ignore'] },
};
const fontMono = pathToFileURL(join(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')).href;

const server = createPagesServer({ dir: join(ROOT, arg('dir', 'dist')) });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser({ args: ['--allow-file-access-from-files', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const tmp = mkdtempSync(join(tmpdir(), 'gaya-og-'));

/** El fotograma fijo de `cover` a 1200×630, tal como lo pinta el motor de la portada construida (solo el lienzo). */
async function coverStill(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${base}${COPY[lang].path}?still&poster=cover`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.field === 'still', null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'body>*:not(canvas.field){visibility:hidden!important}' });
  await page.waitForTimeout(600);
  const png = await page.screenshot({ type: 'png' });
  await ctx.close();
  return png;
}

const pageHtml = ([first, second], bg) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(${fontMono});font-weight:100 900}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#02051b}
.bg{position:absolute;inset:0;background:url(data:image/png;base64,${bg.toString('base64')}) center/cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,5,27,0) 38%,rgba(2,5,27,.86) 72%,rgba(2,5,27,.96) 100%)}
.wrap{position:absolute;inset:0;padding:48px 64px;display:flex;flex-direction:column;justify-content:flex-end;font-family:M;color:#edf2f8}
.logo{display:flex;align-items:center;gap:14px;font-size:32px;line-height:1;font-weight:700;letter-spacing:-.03em}
.mark{width:32px;height:32px;background:linear-gradient(#88d0ff,#88d0ff) top right/50% 50% no-repeat,linear-gradient(#4390ff,#4390ff) bottom left/50% 50% no-repeat}
h1{font-size:64px;font-weight:800;letter-spacing:-.03em;word-spacing:-.1em;line-height:1.06}
h1 em{font-style:normal;color:#abe2ff}
.foot{display:flex;align-items:center;justify-content:space-between;margin-top:26px}
.url{font-size:24px;font-weight:500;letter-spacing:-.01em;color:#a4b6ce}
</style><div class="bg"></div><div class="shade"></div>
<div class="wrap"><h1>${first}<br><em>${second}</em></h1>
<div class="foot"><div class="url">${brand.domain}</div><div class="logo"><i class="mark"></i><span>${brand.name}</span></div></div></div>`;

const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
for (const [lang, { file: name, h1 }] of Object.entries(COPY)) {
  const bg = await coverStill(lang);
  const file = join(tmp, `og-${lang}.html`);
  writeFileSync(file, pageHtml(h1, bg));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const out = join(outDir, name);
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
server.close();
