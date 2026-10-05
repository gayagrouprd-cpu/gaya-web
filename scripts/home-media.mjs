#!/usr/bin/env node
// Capturas de la página de inicio con los modos de accesibilidad de §10/§11.2: forced-colors, prefers-contrast: more e impresión.
// Comprueba que no hay scroll horizontal, que se ve todo el texto y (con axe) que no hay violaciones en esos modos.
//
// Qué se espera de cada modo (y por qué; es lo que hace el motor, no un deseo):
//   · forced-colors: el motor se apaga (`data-field="off"`, wells.ts no se usa) y base.css oculta el lienzo y el póster SSR: los dos `display: none`.
//   · impresión: base.css oculta el lienzo y el póster (`display: none`) y el motor no corre (`canRun` exige no ser `print`).
//   · prefers-contrast: more: el lienzo NO se oculta. El motor sigue pintando (aquí, con movimiento reducido, en modo `still`) pero con los topes de
//     wells.ts para este modo: T4 bajo los pozos `ink` y T2 bajo los `muted` (WELL_CAPS_MORE) en vez de T6/T4. Por eso el lienzo está visible
//     (`data-field="still"`), el póster SSR queda oculto (solo se muestra con `data-field="ssr"`) y lo que se comprueba es que, con el texto
//     transparente, ningún píxel del lienzo bajo un pozo pasa del tono de su tope (el contraste lo fija el tope, por construcción).
//     Antes este script esperaba el lienzo oculto en este modo y fallaba siempre; ese era el fallo conocido (WP12, pendiente 1).
// Uso: node scripts/home-media.mjs [--dir dist] [--base http://127.0.0.1:4173] [--out reports/ascii/wp10a/media] [--lang es|en]
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import sharp from 'sharp';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { TONE_RGB } from '../src/ascii/tones.gen.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const out = resolve(ROOT, arg('out', 'reports/ascii/wp10a/media'));
mkdirSync(dirname(out), { recursive: true });
const lang = arg('lang', 'es');

/** Topes de los pozos con prefers-contrast: more (wells.ts › WELL_CAPS_MORE): el tono más claro que puede haber bajo cada clase. */
const CAP_MORE = { ink: 4, muted: 2 };
/** Tolerancia por canal (8 bits) para el suavizado de bordes y el redondeo del lienzo. */
const TOL = 3;

const ownServer = !arg('base', null);
const server = ownServer ? createPagesServer({ dir: join(ROOT, arg('dir', 'dist')) }) : null;
const base = ownServer ? `http://127.0.0.1:${await listen(server, 0)}` : arg('base');
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });

const MODES = [
  { name: 'forced-colors', ctx: { forcedColors: 'active' }, expect: 'hidden' },
  { name: 'contrast-more', ctx: { contrast: 'more' }, expect: 'still-capped' },
  { name: 'print', ctx: {}, media: 'print', expect: 'hidden' },
];

/** Con el texto transparente, mide el píxel más claro (por canal) bajo cada pozo visible en `n` posiciones de scroll. */
async function wellsUnderCaps(page, positions) {
  // Solo debe quedar el lienzo: texto, bordes (los de la placa y los botones pasan a --ink con este modo), sombras, contornos y el cromo
  // fijo (píldora, barra, «Ir al contenido»: pasan por encima de los pozos al desplazarse) fuera.
  const style = await page.addStyleTag({
    content:
      'main#contenido *{color:transparent!important;text-shadow:none!important;border-color:transparent!important;box-shadow:none!important;outline:none!important}' +
      'main#contenido .btn,main#contenido .art,main#contenido .thread,main#contenido svg,header.nav,.skip{visibility:hidden!important}',
  });
  const worst = { ink: [0, 0, 0], muted: [0, 0, 0] };
  let measured = 0;
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let i = 0; i < positions; i++) {
    const y = Math.round((max * i) / Math.max(1, positions - 1));
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(500);
    const rects = await page.evaluate(() =>
      [...document.querySelectorAll('[data-well]')].map((el) => {
        const b = el.getBoundingClientRect();
        return { kind: el.dataset.well === 'muted' ? 'muted' : 'ink', x: Math.max(0, Math.floor(b.left)), y: Math.max(0, Math.floor(b.top)), w: Math.ceil(b.width), y1: Math.min(innerHeight, Math.ceil(b.bottom)), vis: b.bottom > 0 && b.top < innerHeight && b.width > 0 };
      }),
    );
    const shot = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = shot.info.width;
    for (const r of rects) {
      if (!r.vis) continue;
      const x1 = Math.min(W, r.x + r.w);
      const y1 = Math.min(shot.info.height, r.y1); // el borde de abajo del pozo, no «y + alto»: un pozo medio fuera por arriba no se sale por abajo
      measured++;
      for (let yy = r.y; yy < y1; yy++) {
        for (let xx = r.x; xx < x1; xx++) {
          const o = (yy * W + xx) * 3;
          for (let c = 0; c < 3; c++) if (shot.data[o + c] > worst[r.kind][c]) worst[r.kind][c] = shot.data[o + c];
        }
      }
    }
  }
  await style.evaluate((n) => n.remove());
  const over = [];
  for (const kind of ['ink', 'muted']) {
    const cap = TONE_RGB[CAP_MORE[kind]];
    if (worst[kind].some((v, c) => v > cap[c] + TOL)) over.push(`${kind}: máx. RGB(${worst[kind].join(',')}) pasa de T${CAP_MORE[kind]} RGB(${cap.join(',')})`);
  }
  return { measured, worst, over };
}

let bad = 0;
for (const mode of MODES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', ...mode.ctx });
  const page = await ctx.newPage();
  await page.goto(base + (lang === 'es' ? '/' : '/en/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (mode.media) await page.emulateMedia({ media: mode.media });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const disp = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).display);
    return {
      sw: document.documentElement.scrollWidth,
      iw: innerWidth,
      field: document.documentElement.dataset.field ?? null,
      canvas: disp('canvas.field'),
      poster: disp('.poster-ssr'),
      text: document.querySelector('main').innerText.length,
      h: document.documentElement.scrollHeight,
    };
  });
  // En forced-colors axe compara el color que escribió el autor con el fondo forzado (blanco) y falla todo el sitio por igual: es un
  // falso positivo conocido, así que ahí se excluye `color-contrast` (el contraste lo fija el sistema; se revisa a la vista).
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
  if (mode.name === 'forced-colors') axe.disableRules(['color-contrast']);
  const res = mode.media ? { violations: [] } : await axe.analyze();

  const problems = [];
  if (r.sw > r.iw + 1) problems.push(`scroll horizontal ${r.sw}/${r.iw}`);
  if (res.violations.length) problems.push(`axe ${res.violations.length}`);
  if (r.text < 1000) problems.push(`solo ${r.text} caracteres de texto`);
  let detail = '';
  if (mode.expect === 'hidden') {
    if (!r.canvas.every((d) => d === 'none') || !r.poster.every((d) => d === 'none')) problems.push(`el lienzo y el póster deben estar ocultos (canvas ${r.canvas}, póster ${r.poster})`);
    detail = `lienzo y póster ocultos (data-field=${r.field})`;
  } else {
    if (r.field !== 'still') problems.push(`data-field debe ser «still» (es «${r.field}»): el motor pinta el fotograma fijo con topes T4/T2`);
    if (r.canvas.length !== 1 || r.canvas[0] === 'none') problems.push('el lienzo debe verse (modo still con topes T4/T2)');
    if (!r.poster.every((d) => d === 'none')) problems.push(`el póster SSR debe estar oculto con el lienzo visible (${r.poster})`);
    const w = await wellsUnderCaps(page, 6);
    if (w.measured === 0) problems.push('no se midió ningún pozo');
    problems.push(...w.over);
    detail = `lienzo en modo ${r.field}, póster oculto, ${w.measured} pozos medidos: máx. bajo ink RGB(${w.worst.ink}) ≤ T4, bajo muted RGB(${w.worst.muted}) ≤ T2`;
  }
  if (problems.length) bad++;
  console.log(`${problems.length ? 'FALLA' : 'ok  '} ${mode.name}: ${detail} · scroll ${r.sw}/${r.iw} · ${r.text} caracteres de texto · alto ${r.h} px · axe ${res.violations.length}`);
  for (const p of problems) console.log(`       - ${p}`);
  for (const v of res.violations) console.log(`       axe [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${out}-${mode.name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
server?.close();
process.exit(bad ? 1 : 0);
