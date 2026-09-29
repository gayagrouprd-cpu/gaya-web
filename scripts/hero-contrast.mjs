#!/usr/bin/env node
// Contraste REAL del texto sobre el shader (axe no lee canvas): se oculta el texto, se captura el fondo,
// y se muestrean los píxeles detrás de cada texto. Se compara el color del texto contra el píxel más claro (p98).
//   Estados: reposo (?still) y con el puntero colocado justo encima del titular (peor caso).
// Uso: node scripts/hero-contrast.mjs [--dir dist] [--path /]
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { luminance } from '../src/lib/color.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const dir = join(ROOT, arg('dir', 'dist'));
const path = arg('path', '/');

const server = createPagesServer({ dir });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });

const lin = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const TARGETS = [
  { name: 'titular', sel: '.hero h1 .w:not(.is-accent)', fg: '--ink', min: 3 },
  { name: 'palabra en acento', sel: '.hero h1 .w.is-accent', fg: '--accent-text', min: 3 },
  { name: 'párrafo', sel: '.hero__lead', fg: '--lead', min: 4.5 },
  { name: 'menú: logo', sel: '.logo__text', fg: '--ink', min: 4.5 },
  { name: 'menú: idioma', sel: '.nav__lang', fg: '--muted', min: 4.5 },
];
const viewports = [
  { name: '320×640', w: 320, h: 640, mobile: true },
  { name: '390×844', w: 390, h: 844, mobile: true },
  { name: '768×1024', w: 768, h: 1024, mobile: false },
  { name: '1440×900', w: 1440, h: 900, mobile: false },
];
let fails = 0;
let checks = 0;
const worst = {};

for (const vp of viewports) {
  for (const state of ['reposo', 'puntero sobre el titular']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const still = state === 'reposo';
    await page.goto(`${base}${path}${still ? '?still' : ''}`, { waitUntil: 'load' });
    if (still) await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 20000 });
    else await page.waitForTimeout(3200);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400); // entrada del texto

    if (!still) {
      const box = await page.locator('.hero h1').boundingBox();
      if (vp.mobile) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
      else {
        await page.mouse.move(box.x + box.width * 0.4, box.y - 80);
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 10 });
      }
      await page.waitForTimeout(1500);
    }

    const rects = await page.evaluate((targets) => {
      const css = getComputedStyle(document.documentElement);
      return targets.map((t) => ({
        name: t.name,
        min: t.min,
        fg: css.getPropertyValue(t.fg).trim(),
        rects: [...document.querySelectorAll(t.sel)].map((e) => {
          const b = e.getBoundingClientRect();
          return { x: b.left, y: b.top, w: b.width, h: b.height };
        }),
      }));
    }, TARGETS);

    await page.addStyleTag({ content: '*,*::before,*::after{color:transparent!important;text-shadow:none!important}' });
    await page.waitForTimeout(150);
    const png = await page.screenshot({ type: 'png' });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });

    for (const t of rects) {
      const lums = [];
      for (const r of t.rects) {
        const x0 = Math.max(0, Math.floor(r.x));
        const x1 = Math.min(info.width, Math.ceil(r.x + r.w));
        const y0 = Math.max(0, Math.floor(r.y));
        const y1 = Math.min(info.height, Math.ceil(r.y + r.h));
        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const i = (y * info.width + x) * info.channels;
            lums.push(0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]));
          }
        }
      }
      if (!lums.length) continue;
      lums.sort((a, b) => a - b);
      const p98 = lums[Math.floor(lums.length * 0.98)];
      const lfg = luminance(t.fg);
      const ratio = (Math.max(lfg, p98) + 0.05) / (Math.min(lfg, p98) + 0.05);
      checks++;
      if (!worst[t.name] || ratio < worst[t.name].ratio) worst[t.name] = { ratio, at: `${vp.name} · ${state}` };
      if (ratio < t.min) {
        fails++;
        console.log(`FALLA  ${vp.name.padEnd(9)} ${state.padEnd(26)} ${t.name.padEnd(18)} ${ratio.toFixed(2)} < ${t.min}`);
      }
    }
    await ctx.close();
  }
}
console.log('\nPeor caso por elemento (en todos los tamaños y estados):');
for (const [k, w] of Object.entries(worst)) console.log(`  ${k.padEnd(20)} ${w.ratio.toFixed(2)}:1   (${w.at})`);
console.log(`\n${checks} comprobaciones, ${fails} con fallo.`);
await browser.close();
server.close();
process.exit(fails ? 1 : 0);
