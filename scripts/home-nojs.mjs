#!/usr/bin/env node
// Captura de la portada SIN JavaScript (DIRECTION §6.9, §11.2): debe verse el póster SSR (arte de la escena `cover` cuantizado a 4 tonos)
// con el h1, el lead y los botones encima; el resto de la página (placas, Índice, fichas) también está. Uso:
//   node scripts/home-nojs.mjs [--dir dist] [--out reports/ascii/wp10a/nojs] [--lang es|en] [--matrix]
// Escribe <out>-<ancho>x<alto>-<lang>.png (primera pantalla) y comprueba que el póster no está oculto. Por omisión, 1440×900 y 360×800;
// con --matrix, los tamaños comunes de portátil y móvil (donde el texto anclado al fondo chocaba con la palabra anclada arriba).
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const out = resolve(ROOT, arg('out', 'reports/ascii/wp10a/nojs'));
mkdirSync(dirname(out), { recursive: true });
const langs = arg('lang', null) ? [arg('lang')] : ['es', 'en'];
const SIZES = process.argv.includes('--matrix')
  ? [[320, 568], [360, 640], [375, 667], [412, 740], [360, 800], [768, 1024], [1024, 768], [1280, 720], [1366, 657], [1366, 768], [1536, 730], [1600, 800], [1920, 950]]
  : [[1440, 900], [360, 800]];

const server = createPagesServer({ dir: join(ROOT, arg('dir', 'dist')) });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
let bad = 0;
for (const lang of langs) {
  for (const [w, h] of SIZES) {
    const mobile = w < 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    await page.goto(base + (lang === 'es' ? '/' : '/en/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const p = document.querySelector('.poster-ssr');
      const v = [...document.querySelectorAll('.poster-ssr__v')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.className.match(/--(\w+)/)?.[1]);
      const cs = p && getComputedStyle(p);
      const ch = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch'));
      const h1 = document.querySelector('h1')?.getBoundingClientRect();
      const cta = document.querySelector('[data-cta]')?.getBoundingClientRect();
      const det = [...document.querySelectorAll('details[data-more]')].map((d) => d.open);
      return { display: cs?.display, variants: v, h1: h1 && [Math.round(h1.top), Math.round(h1.bottom)], row: h1 && +(h1.top / ch).toFixed(1), cta: cta && Math.round(cta.bottom), detailsOpen: det.every(Boolean), clock: document.querySelector('[data-clock]')?.textContent };
    });
    const ok = r.display === 'grid' && r.variants.length === 1 && r.detailsOpen;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FALLA'} ${lang} ${w}×${h} sin JS: póster ${r.display} (${r.variants.join(',')}) · h1 ${r.h1?.join('–')} (fila ${r.row}) · botón hasta ${r.cta} · «Más detalles» abiertos ${r.detailsOpen} · reloj «${r.clock}»`);
    await page.screenshot({ path: `${out}-${w}x${h}-${lang}.png` });
    await ctx.close();
  }
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
