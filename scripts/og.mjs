#!/usr/bin/env node
// Imágenes para compartir la portada (WhatsApp, redes): public/og.jpg (es) y public/og-en.jpg (en), 1200x630, <= 300 KB.
// Se componen con el fondo de la portada y las fuentes del sitio, en Chrome real, para que coincidan con la marca.
// Uso: node scripts/og.mjs
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = JSON.parse(readFileSync(join(ROOT, 'brand.json'), 'utf8'));
const COPY = {
  es: { file: 'og.jpg', words: ['Tu', 'negocio,', 'imposible', 'de ignorar'] },
  en: { file: 'og-en.jpg', words: ['Your', 'business,', 'impossible', 'to ignore'] },
};
const bg = pathToFileURL(join(ROOT, 'public', 'hero', 'cobalto-land.webp')).href;
const fontDisplay = pathToFileURL(join(ROOT, 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2')).href;
const fontMono = pathToFileURL(join(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')).href;
const [brandFirst, ...brandRest] = brand.name.split(' ');

const pageHtml = ([first, second, third, fourth]) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fontDisplay});font-weight:200 800}
@font-face{font-family:M;src:url(${fontMono});font-weight:100 900}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:oklch(0.13 0.05 268)}
.bg{position:absolute;inset:0;background:url(${bg}) center/cover}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,oklch(0.13 0.05 268/.92) 0%,oklch(0.13 0.05 268/.78) 38%,oklch(0.13 0.05 268/0) 72%)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;font-family:D;color:oklch(0.96 0.01 250)}
.logo{display:flex;align-items:center;gap:14px;font-size:34px;line-height:1;letter-spacing:-0.01em}
.orb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 34% 30%,oklch(0.94 0.05 225),oklch(0.62 0.24 265) 46%,oklch(0.38 0.2 266) 100%);box-shadow:inset 0 0 0 1px oklch(0.96 0.01 250/.3)}
.logo b{font-weight:700}.logo span{font-weight:400;color:oklch(0.77 0.04 255)}
h1{font-size:104px;font-weight:700;letter-spacing:-0.035em;line-height:.98}
h1 em{font-style:normal;color:oklch(0.82 0.13 250)}
.url{font-family:M;font-size:26px;letter-spacing:.01em;color:oklch(0.86 0.03 250)}
</style><div class="bg"></div><div class="shade"></div>
<div class="wrap"><div class="logo"><i class="orb"></i><div><b>${brandFirst}</b> <span>${brandRest.join(' ')}</span></div></div>
<div><h1>${first} ${second}<br><em>${third}</em><br>${fourth}</h1></div>
<div class="url">${brand.domain}</div></div>`;

const dir = mkdtempSync(join(tmpdir(), 'gaya-og-'));
const browser = await launchBrowser({ args: ['--allow-file-access-from-files'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
for (const [lang, { file: name, words }] of Object.entries(COPY)) {
  const file = join(dir, `og-${lang}.html`);
  writeFileSync(file, pageHtml(words));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const out = join(ROOT, 'public', name);
  for (const quality of [90, 84, 78, 70]) {
    await page.screenshot({ path: out, type: 'jpeg', quality });
    const kb = statSync(out).size / 1024;
    if (kb <= 300) {
      console.log(`public/${name}  1200x630  ${kb.toFixed(1)} KB (calidad ${quality})`);
      break;
    }
  }
}
await browser.close();
