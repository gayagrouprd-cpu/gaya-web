#!/usr/bin/env node
// Revisión visual de la página de inicio SIN motor: pone detrás de cada sección una «sombra» de su palabra (las palabras reales de
// WP3 en su variante y posición de §5.3/§5.7, un solo tono) para juzgar la composición del texto y las placas sobre el cartel.
// No es el arte del motor (la bruma, el agua y las escenas no están): solo dónde cae la palabra respecto del texto.
// Uso: node scripts/home-ghost.mjs --url http://127.0.0.1:4333/ --out reports/ascii/wp10a/g [--w 1440 --h 900] [--mobile] [--lang es|en]
// Escribe <out>-<n>-<escena>-<a|b>.png: «a» con la sección arriba (el cartel), «b» con la placa a la vista.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { launchBrowser } from './lib/browser.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const base = String(arg('url', 'http://127.0.0.1:4333/'));
const out = resolve(String(arg('out', 'reports/ascii/wp10a/ghost')));
const w = Number(arg('w', 1440));
const h = Number(arg('h', 900));
const mobile = !!arg('mobile', false);
const lang = String(arg('lang', base.includes('/en/') ? 'en' : 'es'));
const only = arg('only', null);
mkdirSync(dirname(out), { recursive: true });

const { getWords, loadWords, wordToText, sceneWord, blockCols, stackRows, STACK_GAP_ROWS } = await import('../src/ascii/words.ts');
await loadWords(lang);

// Celda por ancho (§5.2) y columnas/filas del lienzo.
const cw = w < 900 ? 6 : w < 1600 ? 9 : 12;
const ch = w < 900 ? 12 : w < 1600 ? 18 : 25;
const cols = Math.floor(w / cw);
const rowsTotal = Math.floor(h / ch);

/** Texto de cuadrantes de una palabra (pila incluida) y su ancho y alto en celdas. */
function ghostOf(scene) {
  const id = sceneWord(scene, lang);
  if (!id) return null;
  const set = getWords(id, lang, cols);
  const width = blockCols(set);
  const rows = [];
  set.lines.forEach((line, i) => {
    const off = set.offsets[i] ?? 0;
    const text = wordToText(line).split('\n');
    if (i > 0) for (let g = 0; g < STACK_GAP_ROWS; g++) rows.push('');
    for (const r of text) rows.push(' '.repeat(off) + r);
  });
  return { art: rows.join('\n'), width, rows: stackRows(set) };
}
const ghosts = {};
for (const s of ['cover', 'hola', 'web', 'listo', 'eco', 'on', 'ver', 'tu']) ghosts[s] = ghostOf(s);
// Fila superior de cada palabra: escritorio 4 (§5.7), móvil 3; ON va a la izquierda (palabra al 50 %), el resto centrado.
const top = mobile ? 3 : 4;

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const scenes = await page.evaluate(() =>
  [...document.querySelectorAll('main [data-poster]')].map((el, i) => ({ i, scene: el.dataset.poster, id: el.id, top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight })),
);
let n = 0;
for (const s of scenes) {
  n++;
  if (only && !String(only).split(',').includes(s.scene)) continue;
  const gh = ghosts[s.scene];
  const place = async () =>
    page.evaluate(
      ({ gh, cols, cw, ch, top, scene, mobile }) => {
        // El servidor de desarrollo recarga la página si otro paquete edita un archivo: se vuelve a crear la capa si falta.
        if (!document.getElementById('ghost')) {
          const g = document.createElement('div');
          g.id = 'ghost';
          Object.assign(g.style, { position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none' });
          const span = document.createElement('span');
          span.className = 'art';
          Object.assign(span.style, { position: 'absolute', color: 'var(--t8)', textShadow: `${cw * 2}px ${ch}px 0 var(--t3)` });
          g.append(span);
          document.body.prepend(g);
        }
        const a = document.querySelector('#ghost .art');
        if (!gh) {
          a.removeAttribute('data-art');
          return;
        }
        a.setAttribute('data-art', gh.art);
        const x = scene === 'on' && !mobile ? 4 : Math.max(0, Math.floor((cols - gh.width) / 2));
        a.style.left = `${x * cw}px`;
        a.style.top = `${(scene === 'tu' ? 2 : top) * ch}px`;
      },
      { gh, cols, cw, ch, top, scene: s.scene, mobile },
    );
  await place();
  // a: la sección arriba de la pantalla (el cartel con su texto)
  await page.evaluate((y) => scrollTo(0, y), s.top);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}-${String(n).padStart(2, '0')}-${s.scene}-a.png` });
  // b: desplazada hasta que la placa (o el resto) quede a la vista
  if (s.h > h * 1.15) {
    await page.evaluate((y) => scrollTo(0, y), s.top + Math.min(s.h - h, h * 0.78));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}-${String(n).padStart(2, '0')}-${s.scene}-b.png` });
  }
}
await browser.close();
console.log(`${n} secciones · ${w}×${h} · celda ${cw}×${ch} · ${cols}×${rowsTotal} celdas → ${out}-*.png`);
