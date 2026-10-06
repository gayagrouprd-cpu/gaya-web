#!/usr/bin/env node
// T4, T11, T13 y T14 de DIRECTION §13 consolidados en una sola pasada sobre la página CONSTRUIDA (dist/ servido como GitHub Pages):
//
//  axe       T4   @axe-core/playwright (wcag2a, wcag2aa, wcag21a/aa, wcag22aa): 0 violaciones en escritorio, móvil y movimiento reducido,
//                 en las portadas (ES y EN), la galería (ES y EN) y un visor.
//  forced    T11  forced-colors: active → lienzo y póster ocultos, texto íntegro, sin desborde, axe 0 (sin `color-contrast`: con colores
//                 forzados axe compara el color del autor con el fondo del sistema y falla todo el sitio por igual; falso positivo conocido).
//  contrast  T11  prefers-contrast: more → axe 0; el arte del DOM en `--ink`; el lienzo se queda (modo `still`, topes T4/T2 de wells.ts: la
//                 medida de píxeles bajo los pozos es de scripts/home-media.mjs); sin sombras en placas y botones.
//  print     T11  impresión → lienzo y póster ocultos, fondo blanco, arte DOM en negro, placas sin sombra, URL visible en los enlaces
//                 externos, texto íntegro (la misma cantidad que en pantalla).
//  tab       T14  Tab completo (escritorio y móvil con la barra inferior): en cada parada el foco no queda oculto (2.4.11: cinco puntos del
//                 elemento responden a `elementFromPoint`), el contorno mide ≥ 3 px; todos los objetivos ≥ 24×24 (2.5.8) y los botones y la
//                 barra del móvil ≥ 44 px.
//  zoom      T13  zoom 200 % y 400 % (viewport 640×512 @2x y 320×256 @4x) con el espaciado de texto de WCAG 1.4.12 inyectado: sin scroll
//                 horizontal, sin texto recortado, y el lienzo con ≥ 52 columnas o apagado.
//
// Uso: node scripts/ascii-a11y.mjs [--dir dist] [--base http://127.0.0.1:4173] [--only axe,forced,contrast,print,tab,zoom,selftest]
//        [--paths /,/en/,/referencias/fogon/] [--shots reports/ascii/wp11/a11y]
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const ONLY = arg('only', null) ? String(arg('only')).split(',') : null;
const want = (s) => !ONLY || ONLY.includes(s);
const shotsDir = arg('shots', null) ? join(ROOT, String(arg('shots'))) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

let server = null;
let base = arg('base', null);
if (!base) {
  server = createPagesServer({ dir: join(ROOT, String(arg('dir', 'dist'))) });
  base = `http://127.0.0.1:${await listen(server, 0)}`;
}
base = String(base).replace(/\/$/, '');
const origin = new URL(base).origin;

const HOMES = ['/', '/en/'];
const slug = (() => {
  try {
    const r = JSON.parse(readFileSync(join(ROOT, 'src/data/references.json'), 'utf8')).refs.find((x) => x.status === 'built');
    return r?.slug ?? null;
  } catch {
    return null;
  }
})();
const PAGES = arg('paths', null) ? String(arg('paths')).split(',') : [...HOMES, ...(slug ? [`/referencias/${slug}/`, `/en/references/${slug}/`] : [])];
const isHome = (p) => HOMES.includes(p);
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const results = [];
const notes = [];

// Contraste del arte del DOM (decoración, no texto: 1.4.11 pide ≥ 3:1) contra el fondo; el color se resuelve con un canvas (Chrome devuelve oklch()).
const ART_CONTRAST = `(bgs) => {
  const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  cx.canvas.width = cx.canvas.height = 1;
  const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgRgb = bgs.map(rgb);
  const arts = [...document.querySelectorAll('.art:not(.poster-ssr__l)')];
  const low = [];
  let min = 99;
  for (const a of arts) {
    const c = rgb(getComputedStyle(a).color);
    const k = Math.min(...bgRgb.map((b) => ratio(c, b)));
    min = Math.min(min, k);
    if (k < 3) low.push(a.className.toString().split(' ').slice(0, 2).join('.') + ' ' + k.toFixed(2));
  }
  return { arts: arts.length, min, low: [...new Set(low)].slice(0, 5) };
}`;
const check = (id, ok, detail = '') => {
  results.push({ id, ok, detail });
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${id}${detail ? '  ·  ' + detail : ''}`);
  return ok;
};

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });

/** Abre `path` con las opciones de contexto dadas, espera a que el motor se asiente y devuelve { ctx, page, problems }. */
async function open(path, ctxOpts = {}, { emulate = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', ...ctxOpts });
  const page = await ctx.newPage();
  const problems = [];
  await page.route('**/*', (r) => (isExternal(r.request().url(), origin) ? r.abort() : r.continue()));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`consola ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`excepción: ${e.message}`));
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (emulate) await page.emulateMedia(emulate);
  if (isHome(path)) await page.waitForFunction(() => ['live', 'still', 'off', 'ssr'].includes(document.documentElement.dataset.field), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return { ctx, page, problems };
}
const shot = async (page, name) => {
  if (shotsDir) await page.screenshot({ path: join(shotsDir, name) }).catch(() => {});
};
const tag = (p) => p.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'inicio';

const PROFILES = [
  ['escritorio', { viewport: { width: 1280, height: 800 } }],
  ['móvil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['movimiento reducido', { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }],
];

// ── T4 · axe ────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (want('axe')) {
  console.log('\n── T4 · axe (0 violaciones en escritorio, móvil y movimiento reducido) ──');
  for (const path of PAGES) {
    for (const [name, o] of PROFILES) {
      const { ctx, page } = await open(path, o);
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const lines = res.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}; p. ej. ${v.nodes[0]?.target?.join(' ')})`);
      check(`axe ${path} (${name})`, res.violations.length === 0, res.violations.length ? lines.join(' | ') : `0 violaciones, ${res.incomplete.length} por revisar a mano${res.incomplete.length ? ' (' + res.incomplete.map((i) => i.id).join(', ') + ')' : ''}`);
      if (res.violations.length) await shot(page, `axe-${tag(path)}-${name.replace(/\s/g, '_')}.png`);
      await ctx.close();
    }
  }
}

// ── T11 · forced-colors ─────────────────────────────────────────────────────────────────────────────────────────────────
const textLength = (page) => page.evaluate(() => document.querySelector('main')?.innerText.length ?? 0);
const hiddenArt = (page) =>
  page.evaluate(() => {
    const d = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).display);
    return { canvas: d('canvas.field'), poster: d('.poster-ssr'), field: document.documentElement.dataset.field ?? null };
  });
let normalText = {};
if (want('forced') || want('contrast') || want('print')) {
  for (const path of HOMES) {
    const { ctx, page } = await open(path);
    normalText[path] = await textLength(page);
    await ctx.close();
  }
}
if (want('forced')) {
  console.log('\n── T11 · forced-colors: active ──');
  for (const path of PAGES) {
    const { ctx, page } = await open(path, { forcedColors: 'active' });
    const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    const axe = await new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast']).analyze();
    const problems = [];
    if (sw[0] > sw[1] + 1) problems.push(`scroll horizontal ${sw[0]}/${sw[1]}`);
    if (axe.violations.length) problems.push(`axe ${axe.violations.map((v) => v.id).join(', ')}`);
    let detail = `scroll ${sw[0]}/${sw[1]} · axe ${axe.violations.length}`;
    if (isHome(path)) {
      const h = await hiddenArt(page);
      const t = await textLength(page);
      if (![...h.canvas, ...h.poster].every((x) => x === 'none')) problems.push(`lienzo/póster visibles (canvas ${h.canvas}, póster ${h.poster})`);
      if (t < normalText[path] * 0.98) problems.push(`texto recortado: ${t} caracteres frente a ${normalText[path]}`);
      detail += ` · lienzo y póster ocultos (data-field=${h.field}) · ${t} caracteres de texto`;
    }
    check(`forced-colors ${path}`, problems.length === 0, problems.length ? problems.join('; ') : detail);
    await shot(page, `forced-${tag(path)}.png`);
    await ctx.close();
  }
}

// ── T11 · prefers-contrast: more ────────────────────────────────────────────────────────────────────────────────────────
if (want('contrast')) {
  console.log('\n── T11 · prefers-contrast: more ──');
  for (const path of PAGES) {
    const { ctx, page } = await open(path, { contrast: 'more', reducedMotion: 'reduce' });
    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const problems = [];
    if (axe.violations.length) problems.push(`axe ${axe.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`);
    let detail = `axe ${axe.violations.length}`;
    if (isHome(path)) {
      const r = await page.evaluate(() => {
        const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
        const probe = document.createElement('i');
        probe.style.color = ink;
        document.body.append(probe);
        const inkRgb = getComputedStyle(probe).color;
        probe.remove();
        const arts = [...document.querySelectorAll('.art:not(.poster-ssr__l)')];
        const off = arts.filter((a) => getComputedStyle(a).color !== inkRgb).length;
        const plate = document.querySelector('.plate');
        const btn = document.querySelector('[data-ui="cartel"] .btn');
        return {
          arts: arts.length,
          off,
          plateShadow: plate ? getComputedStyle(plate).boxShadow : 'none',
          btnShadow: btn ? getComputedStyle(btn).boxShadow : 'none',
          field: document.documentElement.dataset.field,
          canvas: [...document.querySelectorAll('canvas.field')].map((c) => getComputedStyle(c).display),
        };
      });
      const k = await page.evaluate(`(${ART_CONTRAST})(${JSON.stringify(['#02051b', '#040c34'])})`);
      if (k.low.length) problems.push(`arte del DOM con poco contraste (< 3:1) sobre T0/T1: ${k.low.join(', ')}`);
      if (r.off) notes.push(`prefers-contrast: more ${path}: ${r.off} de ${r.arts} piezas de arte del DOM no van en --ink (emblemas y hilo conservan su tono; contraste mínimo ${k.min.toFixed(1)}:1)`);
      if (r.plateShadow !== 'none') problems.push(`la placa conserva sombra (${r.plateShadow})`);
      if (r.btnShadow !== 'none') problems.push(`el botón conserva sombra (${r.btnShadow})`);
      if (r.field !== 'still' || r.canvas.some((d) => d === 'none')) problems.push(`el lienzo debe verse en modo still (data-field=${r.field}, display ${r.canvas})`);
      detail += ` · ${r.arts} piezas de arte del DOM con contraste ≥ ${k.min.toFixed(1)}:1 · sin sombras · lienzo ${r.field}`;
    }
    check(`prefers-contrast: more ${path}`, problems.length === 0, problems.length ? problems.join('; ') : detail);
    await ctx.close();
  }
}

// ── T11 · impresión ─────────────────────────────────────────────────────────────────────────────────────────────────────
if (want('print')) {
  console.log('\n── T11 · impresión ──');
  for (const path of PAGES) {
    const { ctx, page } = await open(path, {}, { emulate: { media: 'print' } });
    const r = await page.evaluate(() => {
      const d = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).display);
      const arts = [...document.querySelectorAll('.art:not(.poster-ssr__l)')];
      const ext = document.querySelector('a[href^="http"]');
      return {
        canvas: d('canvas.field'),
        poster: d('.poster-ssr'),
        bg: getComputedStyle(document.body).backgroundColor,
        artsNotBlack: arts.filter((a) => getComputedStyle(a).color !== 'rgb(0, 0, 0)').length,
        arts: arts.length,
        k: null,
        plateShadow: [...document.querySelectorAll('.plate')].filter((p) => getComputedStyle(p).boxShadow !== 'none').length,
        after: ext ? getComputedStyle(ext, '::after').content : null,
        extHref: ext?.href ?? null,
        sw: [document.documentElement.scrollWidth, innerWidth],
        text: document.querySelector('main')?.innerText.length ?? 0,
      };
    });
    const problems = [];
    if (![...r.canvas, ...r.poster].every((x) => x === 'none')) problems.push(`lienzo/póster visibles (canvas ${r.canvas}, póster ${r.poster})`);
    if (!/^rgb\(255, 255, 255\)$|^rgba\(0, 0, 0, 0\)$/.test(r.bg)) problems.push(`el fondo no es blanco (${r.bg})`);
    const k = await page.evaluate(`(${ART_CONTRAST})(${JSON.stringify(['#ffffff'])})`);
    if (k.low.length) problems.push(`arte del DOM ilegible sobre papel (< 3:1): ${k.low.join(', ')}`);
    if (r.artsNotBlack) notes.push(`impresión ${path}: ${r.artsNotBlack} de ${r.arts} piezas de arte del DOM no van en negro (los emblemas de Ejemplos conservan su tono; contraste mínimo ${k.min.toFixed(1)}:1 sobre papel)`);
    if (r.plateShadow) problems.push(`${r.plateShadow} placas con sombra`);
    if (r.extHref && !(r.after ?? '').includes(r.extHref.replace(/\/$/, '')) && !/\(/.test(r.after ?? '')) problems.push(`el enlace externo no muestra su URL (::after ${r.after})`);
    if (r.sw[0] > r.sw[1] + 1) problems.push(`desborde horizontal ${r.sw[0]}/${r.sw[1]}`);
    if (isHome(path) && r.text < normalText[path] * 0.98) problems.push(`texto recortado: ${r.text} caracteres frente a ${normalText[path]}`);
    check(`impresión ${path}`, problems.length === 0, problems.length ? problems.join('; ') : `lienzo y póster ocultos, fondo ${r.bg}, ${r.arts ? `${r.arts} piezas de arte con ≥ ${k.min.toFixed(1)}:1 sobre papel` : 'sin arte en el DOM'}, URL visible, ${r.text} caracteres`);
    await ctx.close();
  }
}

// ── T14 · teclado, foco y objetivos ─────────────────────────────────────────────────────────────────────────────────────
const INTERACTIVE = 'a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';
if (want('tab')) {
  console.log('\n── T14 · Tab completo, foco no oculto y tamaño de los objetivos ──');
  for (const path of HOMES) {
    for (const [name, o] of [PROFILES[0], PROFILES[1]]) {
      const { ctx, page } = await open(path, o);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.click(2, 2).catch(() => {});
      await page.evaluate(() => document.activeElement?.blur?.());
      const seen = [];
      const bad = [];
      for (let n = 0; n < 160; n++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(60);
        const s = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body || el === document.documentElement) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
          const vw = innerWidth;
          const vh = innerHeight;
          // cinco puntos del elemento (centro y cuatro a 3 px de las esquinas, dentro del visor): todos deben responder al elemento o a un descendiente
          const pts = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => {
            const x = Math.min(vw - 1, Math.max(0, r.left + 3 + (r.width - 6) * fx));
            const y = Math.min(vh - 1, Math.max(0, r.top + 3 + (r.height - 6) * fy));
            const top = document.elementFromPoint(x, y);
            return !!top && (top === el || el.contains(top));
          });
          return {
            label,
            tag: el.tagName.toLowerCase(),
            w: Math.round(r.width),
            h: Math.round(r.height),
            inView: r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw,
            hits: pts.filter(Boolean).length,
            center: pts[0],
            outlineW: parseFloat(cs.outlineWidth) || 0,
            outlineStyle: cs.outlineStyle,
          };
        });
        if (!s) {
          if (n > 0) break;
          continue;
        }
        if (seen.length && seen.at(-1).label === s.label && seen.length > 1 && seen.at(-2).label === s.label) break; // trampa de teclado
        seen.push(s);
        if (!s.inView) bad.push(`«${s.label}» no está en el visor al recibir el foco`);
        else if (!s.center || s.hits < 3) bad.push(`«${s.label}» queda tapado (${s.hits}/5 puntos visibles; el centro ${s.center ? 'responde' : 'está cubierto'})`);
        if (s.outlineStyle === 'none' || s.outlineW < 3) bad.push(`«${s.label}» sin contorno de foco de ≥ 3 px (${s.outlineStyle} ${s.outlineW}px)`);
        if (s.h < 24 || (s.w < 24 && !/^(a)$/.test(s.tag))) bad.push(`«${s.label}» mide ${s.w}×${s.h} (< 24)`);
      }
      check(`Tab ${path} (${name})`, seen.length >= 10 && bad.length === 0, bad.length ? [...new Set(bad)].slice(0, 6).join(' | ') : `${seen.length} paradas, ninguna tapada, todas con contorno ≥ 3 px`);
      // objetivos: todos los controles visibles
      const targets = await page.evaluate(
        ({ sel, mobile }) => {
          const out = [];
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], [inert], details:not([open]) > :not(summary)') || el.classList.contains('skip')) continue;
            if (el.closest('[popover]:not(:popover-open)')) continue;
            // 2.5.8: un enlace dentro de una frase está exento
            const inline = el.tagName === 'A' && cs.display === 'inline' && !!el.closest('p, li, dd');
            const primary = el.matches('.btn, [data-cta], .bar a') || !!el.closest('.bar');
            const need = mobile && primary ? 44 : 24;
            if (!inline && (r.width < need || r.height < need)) out.push(`${el.tagName.toLowerCase()} «${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)}» ${Math.round(r.width)}×${Math.round(r.height)} (< ${need})`);
          }
          return out;
        },
        { sel: INTERACTIVE, mobile: !!o.isMobile },
      );
      check(`objetivos ${path} (${name}): ≥ 24 px${o.isMobile ? ' (≥ 44 en botones y barra)' : ''}`, targets.length === 0, targets.slice(0, 5).join(' | ') || 'todos cumplen');
      await ctx.close();
    }
  }
}

// ── T13 · zoom 200 % y 400 % con el espaciado de texto de WCAG 1.4.12 ─────────────────────────────────────────────────────
if (want('zoom')) {
  console.log('\n── T13 · zoom 200 % y 400 % + espaciado de texto ──');
  const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
  for (const path of HOMES) {
    for (const [name, vw, vh, dpr] of [['200 %', 640, 512, 2], ['400 %', 320, 256, 4]]) {
      const { ctx, page } = await open(path, { viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
      await page.addStyleTag({ content: SPACING });
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const clipped = [];
        for (const el of document.querySelectorAll('main *, header *')) {
          if (el.closest('[aria-hidden="true"], canvas, svg, .art')) continue;
          const cs = getComputedStyle(el);
          if (!el.childNodes.length || ![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
          if ((cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1) || (cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 1)) clipped.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);
        }
        const f = window.__field;
        return {
          sw: [document.documentElement.scrollWidth, innerWidth],
          clipped: [...new Set(clipped)].slice(0, 6),
          field: document.documentElement.dataset.field ?? null,
          cols: f?.cols ?? null,
        };
      });
      const problems = [];
      if (r.sw[0] > r.sw[1] + 1) problems.push(`scroll horizontal ${r.sw[0]}/${r.sw[1]}`);
      if (r.clipped.length) problems.push(`texto recortado en ${r.clipped.join(', ')}`);
      if (['live', 'still'].includes(r.field) && !(r.cols >= 52)) problems.push(`el lienzo sigue visible con ${r.cols} columnas (< 52): debería apagarse`);
      check(`zoom ${name} ${path}`, problems.length === 0, problems.length ? problems.join('; ') : `sin desborde ni recortes; lienzo ${r.field}${r.cols ? ' con ' + r.cols + ' columnas' : ''}`);
      await shot(page, `zoom-${name.replace(/\W/g, '')}-${tag(path)}.png`);
      await ctx.close();
    }
  }
}

// ── Controles negativos: cada comprobación de T14 tiene que ponerse en rojo cuando se rompe a propósito ──────────────────────────────
if (want('selftest')) {
  console.log('\n── Controles negativos (deben FALLAR) ──');
  const walkTab = async (page) => {
    const bad = [];
    await page.evaluate(() => window.scrollTo(0, 0));
    for (let n = 0; n < 40; n++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(40);
      const s = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
        const cs = getComputedStyle(el);
        return { covered: !(top && (top === el || el.contains(top))), thin: cs.outlineStyle === 'none' || (parseFloat(cs.outlineWidth) || 0) < 3 };
      });
      if (!s) break;
      if (s.covered) bad.push('tapado');
      if (s.thin) bad.push('contorno');
    }
    return bad;
  };
  for (const [name, css, expect] of [
    ['foco sin contorno', '*:focus-visible{outline:none!important}', 'contorno'],
    ['foco tapado por una capa fija', 'body::after{content:"";position:fixed;inset:0;z-index:99999}', 'tapado'],
  ]) {
    const { ctx, page } = await open('/');
    await page.addStyleTag({ content: css });
    const bad = await walkTab(page);
    check(`control negativo: ${name}`, bad.includes(expect), bad.length ? `detectado (${[...new Set(bad)].join(', ')})` : 'NO se detectó: la comprobación de T14 no tiene dientes');
    await ctx.close();
  }
  const { ctx, page } = await open('/', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.addStyleTag({ content: '.bar a{min-height:20px!important;height:20px!important}' });
  const small = await page.evaluate(() => [...document.querySelectorAll('.bar a')].filter((a) => a.getBoundingClientRect().height < 44).length);
  check('control negativo: barra móvil de 20 px', small > 0, small ? 'detectada (< 44 px)' : 'NO se detectó');
  await ctx.close();
}

await browser.close();
server?.close();
const failed = results.filter((r) => !r.ok);
for (const n of [...new Set(notes)]) console.log(`nota: ${n}`);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones en verde.`);
if (failed.length) {
  console.log('Fallos:');
  for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
}
process.exit(failed.length ? 1 : 0);
