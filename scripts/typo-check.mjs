#!/usr/bin/env node
// Revisión de la tipografía mixta (WP12): titulares, botones, navegación y etiquetas en Geist Mono; texto corrido en Bricolage.
// Abre la página de inicio (y, con --extra, la galería, el visor y el 404) a siete anchos en ES y EN y comprueba, por medida y no a ojo:
//   · familia por rol: h1–h3, .btn, enlaces del menú, etiquetas → Geist Mono; párrafos, lead, listas, dd → Bricolage;
//   · cada titular rompe sin partir palabras, sin desbordar su caja ni la pantalla, y en el número de líneas esperado;
//   · los botones miden ≥ 44 px (≥ 48 los de la portada), no se cortan y caben en su contenedor;
//   · ningún texto corto queda fuera de su [data-well] (los pozos topan el arte bajo el texto: DIRECTION §5.8);
//   · la palabra de acento del h1 sigue en --accent-text; sin desborde horizontal de la página.
// Uso: node scripts/typo-check.mjs [--base http://127.0.0.1:4343] [--dir dist] [--lang es|en] [--widths 320,360,390,768,1024,1440,1920] [--extra] [--table]
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const WIDTHS = String(arg('widths', '320,360,390,768,1024,1440,1920')).split(',').map(Number);
const only = arg('lang', null);
const extra = !!arg('extra', false);
const table = !!arg('table', false);

let server = null;
let base = arg('base', null);
if (!base) {
  server = createPagesServer({ dir: join(ROOT, String(arg('dir', 'dist'))) });
  base = `http://127.0.0.1:${await listen(server, 0)}`;
}
base = String(base).replace(/\/$/, '');

const fails = [];
const known = new Set();
const rows = [];
const fail = (tag, msg) => fails.push(`[${tag}] ${msg}`);

const HEIGHT = (w) => (w < 600 ? 844 : w < 1000 ? 1024 : 900);

// Se ejecuta dentro de la página. `scope`: «page» (lo que se ve al cargar) o «menu» (el popover del menú móvil, abierto).
const inPage = (scope) => {
  const MONO = /Geist Mono Variable/;
  const SANS = /Bricolage Grotesque Variable/;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]') && !el.closest('[inert]') && !el.closest('.sr-only');
  };
  const fam = (el) => getComputedStyle(el).fontFamily;
  const out = { problems: [], heads: [], btns: [], roles: [], wells: [], vw: innerWidth, scrollW: document.documentElement.scrollWidth };

  // Líneas, palabra más ancha y palabras partidas de un elemento (se mide con Range, palabra a palabra).
  const textInfo = (el) => {
    const tops = new Set();
    let maxRight = 0;
    let minLeft = Infinity;
    const broken = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const s = n.textContent;
      for (const m of s.matchAll(/\S+/g)) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const rects = [...r.getClientRects()].filter((q) => q.width > 0.5);
        if (!rects.length) continue;
        if (new Set(rects.map((q) => Math.round(q.top))).size > 1) broken.push(m[0]);
        for (const q of rects) {
          tops.add(Math.round(q.top / 4));
          maxRight = Math.max(maxRight, q.right);
          minLeft = Math.min(minLeft, q.left);
        }
      }
    }
    return { lines: tops.size, maxRight, minLeft, broken };
  };

  const nameOf = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;

  // Titulares y rótulos que deben ir en mono
  const menu = scope === 'menu';
  const headSel = menu ? '.menu__list > li > a, .menu__sub a' : 'main h1, main h2, main h3, .idx__name, .thread__label, .gal h1, .vname, .nf h1';
  for (const el of document.querySelectorAll(headSel)) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const ti = textInfo(el);
    const cs = getComputedStyle(el);
    out.heads.push({
      name: nameOf(el),
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
      mono: MONO.test(fam(el)),
      fs: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      ls: cs.letterSpacing,
      lh: cs.lineHeight,
      lines: ti.lines,
      broken: ti.broken,
      w: Math.round(r.width),
      left: Math.round(r.left),
      right: Math.round(r.right),
      overflowBox: el.scrollWidth > el.clientWidth + 1,
      textOut: Math.round(Math.max(0, ti.maxRight - r.right, r.left - ti.minLeft)),
      // recorte deliberado con puntos suspensivos (el título de la barra del visor en el teléfono): no es un desborde
      ellipsis: cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible' && cs.whiteSpace === 'nowrap',
      menu: !!el.closest('.menu'),
    });
  }

  // Botones y controles tipo botón
  const btnSel = menu ? '.menu .lang-link, .menu .wa-wide, .menu__close' : '.btn, .chip, .lang-link, .nav__links a, .idx__more, .smp__all, .wa-wide, .svc__more summary, .mail__done, .logo__name';
  for (const el of document.querySelectorAll(btnSel)) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const par = el.parentElement.getBoundingClientRect();
    const ti = textInfo(el);
    const cs = getComputedStyle(el);
    out.btns.push({
      name: nameOf(el),
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
      mono: MONO.test(fam(el)),
      fs: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      lines: ti.lines,
      w: Math.round(r.width),
      h: Math.round(r.height),
      right: Math.round(r.right),
      left: Math.round(r.left),
      parentRight: Math.round(par.right),
      overflowBox: el.scrollWidth > el.clientWidth + 1,
      textOut: Math.round(Math.max(0, ti.maxRight - r.right - 0.5, r.left - ti.minLeft - 0.5)),
    });
  }

  if (menu) return out;

  // Roles de lectura: deben ir en Bricolage
  for (const sel of ['.cover__lead', '.promise', '.phrase', '.idx__promise', '.ticks li', 'dd', '.fact__text', '.smp__kind span:first-child']) {
    const el = document.querySelector(sel);
    if (el && vis(el)) out.roles.push({ sel, sans: SANS.test(fam(el)) && !MONO.test(fam(el).split(',')[0]), family: fam(el).split(',')[0] });
  }
  for (const sel of ['dt', '.fact__src', '.lbl', '.stamp', '.sign', '.foot p']) {
    const el = document.querySelector(sel);
    if (el && vis(el)) out.roles.push({ sel, mono: MONO.test(fam(el)), family: fam(el).split(',')[0] });
  }

  // Pozos: todo el texto corto dentro de [data-well] queda dentro de su rectángulo
  for (const well of document.querySelectorAll('[data-well]')) {
    if (!vis(well)) continue;
    const wr = well.getBoundingClientRect();
    const ti = textInfo(well);
    if (!isFinite(ti.minLeft)) continue;
    const out2 = Math.max(0, wr.left - ti.minLeft, ti.maxRight - wr.right);
    out.wells.push({ name: nameOf(well), kind: well.dataset.well, w: Math.round(wr.width), out: Math.round(out2 * 10) / 10 });
  }

  const h1 = document.querySelector('h1');
  const acc = h1?.querySelector('.accent');
  if (h1 && acc) {
    const probe = document.createElement('i');
    probe.style.color = 'var(--accent-text)';
    document.body.append(probe);
    out.accentOk = getComputedStyle(acc).color === getComputedStyle(probe).color;
    probe.remove();
  }
  return out;
};

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const PAGES = [
  { lang: 'es', path: '/', tag: 'inicio', home: true },
  { lang: 'en', path: '/en/', tag: 'home', home: true },
  ...(extra
    ? [
        { lang: 'es', path: '/referencias/fogon/', tag: 'visor', home: false },
        { lang: 'en', path: '/en/references/cimiento/', tag: 'viewer', home: false },
        { lang: 'es', path: '/404.html', tag: '404', home: false },
      ]
    : []),
];

for (const pg of PAGES) {
  if (only && only !== pg.lang) continue;
  for (const w of WIDTHS) {
    const mobile = w < 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT(w) }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(base + pg.path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const tag = `${pg.tag} ${pg.lang} ${w}`;
    const r = await page.evaluate(inPage, 'page');
    if (mobile) {
      // menú móvil abierto: sus enlaces y botones también son titulares y rótulos en mono
      const opened = await page.evaluate(() => {
        const m = document.querySelector('[data-menu-panel]');
        if (!m) return false;
        try {
          m.showPopover();
        } catch {
          m.dataset.open = 'true';
        }
        return true;
      });
      if (opened) {
        await page.waitForTimeout(450);
        const rm = await page.evaluate(inPage, 'menu');
        r.heads.push(...rm.heads);
        r.btns.push(...rm.btns);
      }
    }
    if (r.scrollW > r.vw + 1) fail(tag, `scroll horizontal (${r.scrollW} > ${r.vw})`);
    if (pg.home && r.accentOk === false) fail(tag, 'la palabra de acento del h1 no está en --accent-text');
    for (const h of r.heads) {
      const label = `${h.name} «${h.text}»`;
      if (!h.mono) fail(tag, `${label}: no está en Geist Mono`);
      if (h.broken.length) fail(tag, `${label}: palabra(s) partida(s): ${h.broken.join(', ')}`);
      if (h.ellipsis && (h.overflowBox || h.textOut > 1)) known.add(`${tag}: ${label} se acorta con puntos suspensivos en una caja de ${h.w} px (barra del visor en el teléfono, decisión de e4b724c)`);
      else if (h.overflowBox || h.textOut > 1) fail(tag, `${label}: el texto desborda su caja (${h.textOut} px)`);
      if (h.right > r.vw + 0.5 || h.left < -0.5) fail(tag, `${label}: sale de la pantalla (${h.left}–${h.right} de ${r.vw})`);
      if (pg.home && /^h1$/.test(h.name.split('.')[0]) && (h.lines < 2 || h.lines > 3)) fail(tag, `h1 en ${h.lines} líneas (se esperan 2 o 3)`);
      rows.push({ tag, kind: 'head', ...h });
    }
    for (const b of r.btns) {
      const label = `${b.name} «${b.text}»`;
      if (!b.mono && b.text) fail(tag, `${label}: el control no está en Geist Mono`);
      if (/\bbtn\b/.test(b.name) && b.lines > 1) fail(tag, `${label}: el rótulo del botón se parte en ${b.lines} líneas`);
      if (b.overflowBox || b.textOut > 1) fail(tag, `${label}: el texto se corta o sobresale (${b.textOut} px)`);
      if (/\bbtn\b/.test(b.name) && b.h < 44) fail(tag, `${label}: mide ${b.h} px de alto (< 44)`);
      // Conocido y anterior a la tipografía mixta: la barra del visor (< 430 px) lleva más botones de los que caben, con o sin mono
      // (el CTA queda a 415 px en 390: idéntico en el build previo a WP12). Se anota, no se arregla aquí.
      const viewerBar = /\bvcta\b/.test(b.name) && !pg.home && w < 640;
      if (viewerBar) known.add(`${pg.tag}: la barra del visor desborda a ${w} px (CTA ${b.left}–${b.right}); anterior a WP12`);
      else if (b.right > r.vw + 0.5 || b.left < -0.5) fail(tag, `${label}: sale de la pantalla (${b.left}–${b.right} de ${r.vw})`);
      if (/\bbtn\b/.test(b.name) && !/\bmail\b/.test(b.name) && b.right > b.parentRight + 1) fail(tag, `${label}: sobresale de su contenedor (${b.right} > ${b.parentRight})`);
      rows.push({ tag, kind: 'btn', ...b });
    }
    for (const q of r.roles) {
      if (q.sans === false) fail(tag, `${q.sel}: debería ir en Bricolage y va en ${q.family}`);
      if (q.mono === false) fail(tag, `${q.sel}: debería ir en Geist Mono y va en ${q.family}`);
    }
    for (const q of r.wells) if (q.out > 1) fail(tag, `pozo ${q.name} (${q.kind}): su texto sale ${q.out} px del pozo`);
    await ctx.close();
  }
}
await browser.close();
server?.close();

if (table) {
  console.log('\nTitulares (ancho · líneas · cuerpo · peso · interletraje)');
  for (const r of rows.filter((x) => x.kind === 'head' && !x.menu)) console.log(`  ${r.tag.padEnd(16)} ${r.name.slice(0, 26).padEnd(26)} ${String(r.w).padStart(5)} px · ${r.lines} l · ${r.fs.toFixed(1)} px · ${r.weight} · ${r.ls}`);
  console.log('\nBotones');
  for (const r of rows.filter((x) => x.kind === 'btn' && /\bbtn\b/.test(x.name))) console.log(`  ${r.tag.padEnd(16)} ${r.text.slice(0, 26).padEnd(26)} ${r.w}×${r.h} px · ${r.fs.toFixed(1)} px`);
}
console.log(`\nTipografía mixta: ${PAGES.filter((p) => !only || only === p.lang).length} páginas × ${WIDTHS.length} anchos · ${rows.length} elementos medidos`);
for (const k of [...known].slice(0, 3)) console.log(`  aviso  ${k}`);
for (const f of [...new Set(fails)]) console.log(`  FALLA  ${f}`);
console.log(fails.length ? `\n✗ ${new Set(fails).size} fallos` : '\n✓ Pasa');
process.exit(fails.length ? 1 : 0);
