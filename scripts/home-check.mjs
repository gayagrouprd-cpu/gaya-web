#!/usr/bin/env node
// Revisión de la página de inicio (/ y /en/) — paquete WP10a. Comprueba lo que DIRECTION §4, §10 y §13 piden de la estructura:
//   · estructura: un solo h1, ids localizados, orden de `main [data-poster]`, secciones nombradas, placas, pozos, sin formularios,
//     sin regiones vivas salvo «Copiado», sin scripts en línea, todo el arte con aria-hidden y translate="no";
//   · 2.5.3 (nombre accesible contiene el texto visible), 2.5.8 (objetivos ≥ 24 px; primarios móviles ≥ 44 px),
//     2.4.7/2.4.11 (recorrido completo con Tab: el foco se ve, mide ≥ 3 px y no queda bajo el cromo fijo);
//   · móvil de referencia 360×800 (h1 + lead + botón sin scroll, sin desborde), paridad ES/EN, red y consola, axe (T4).
//   · portada en quince tamaños de pantalla (320×568 … 1920×950): el texto no pisa la palabra (con el póster SSR y con la elección del motor);
//   · presupuestos de la home construida (HTML ≤ 34 KB gz, CSS ≤ 10 KB gz), si se prueba sobre dist/.
// Uso: node scripts/home-check.mjs [--base http://127.0.0.1:4333] [--dir dist] [--lang es|en] [--no-axe] [--no-matrix] [--shots reports/ascii/wp10a]
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal, scrollThrough } from './lib/browser.mjs';
import { loadWords, getWords, stackRows } from '../src/ascii/words.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const only = arg('lang', null);
const noAxe = !!arg('no-axe', false);
const noMatrix = !!arg('no-matrix', false);
const shots = arg('shots', null) ? join(ROOT, String(arg('shots'))) : null;
if (shots) mkdirSync(shots, { recursive: true });

let server = null;
let base = arg('base', null);
if (!base) {
  server = createPagesServer({ dir: join(ROOT, String(arg('dir', 'dist'))) });
  base = `http://127.0.0.1:${await listen(server, 0)}`;
}
base = String(base).replace(/\/$/, '');
const origin = new URL(base).origin;

const SCENES = ['cover', 'hola', 'mist', 'web', 'listo', 'eco', 'on', 'ver', 'mist', 'tu'];
const IDS = {
  es: ['inicio', 'nosotros', 'servicios', 'web', 'automatizacion', 'marketing', 'soporte', 'ejemplos', 'proceso', 'contacto'],
  en: ['home', 'about', 'services', 'web', 'automation', 'marketing', 'it', 'samples', 'process', 'contact'],
};
const PATHS = { es: '/', en: '/en/' };

const fails = [];
const notes = [];
const warns = [];
const fail = (lang, msg) => fails.push(`[${lang}] ${msg}`);

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const open = async (lang, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', ...opts });
  const page = await ctx.newPage();
  const external = new Set();
  const problems = [];
  await page.route('**/*', (r) => (isExternal(r.request().url(), origin) ? r.abort() : r.continue()));
  page.on('request', (r) => isExternal(r.url(), origin) && external.add(r.url()));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`consola ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`excepción: ${e.message}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
  await page.goto(base + PATHS[lang], { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return { ctx, page, external, problems };
};

// Se ejecuta dentro de la página: lo estructural y lo medible con el DOM.
const inPage = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]') && !el.closest('[inert]');
  };
  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const out = { problems: [] };
  const p = (m) => out.problems.push(m);
  const main = document.querySelector('main');
  out.lang = document.documentElement.lang;
  out.h1 = document.querySelectorAll('h1').length;
  out.posters = [...document.querySelectorAll('main [data-poster]')].map((s) => s.dataset.poster);
  out.ids = [...document.querySelectorAll('main [data-poster]')].map((s) => s.id);
  out.headings = [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => `${h.tagName.toLowerCase()}:${norm(h.textContent)}`);
  out.plates = document.querySelectorAll('main .plate').length;
  out.wells = [...document.querySelectorAll('main [data-well]')].map((w) => w.dataset.well);
  out.cta = document.querySelectorAll('[data-cta]').length;
  out.status = document.querySelectorAll('[role="status"]').length;
  for (const el of document.querySelectorAll('main [data-poster]')) {
    const id = el.getAttribute('aria-labelledby');
    const h = id && document.getElementById(id);
    if (!h || !/^H[1-3]$/.test(h.tagName)) p(`la sección #${el.id} no está nombrada por un encabezado`);
  }
  if (document.querySelector('form, input, select, textarea')) p('hay formularios o campos');
  if (document.querySelector('[aria-live], output')) p('hay regiones vivas o <output>');
  const inline = [...document.querySelectorAll('script:not([src])')].filter((s) => !/ld\+json|application\/json/.test(s.type));
  if (inline.length) p(`${inline.length} script(s) en línea`);
  for (const a of document.querySelectorAll('.art')) {
    if (a.getAttribute('aria-hidden') !== 'true' || a.getAttribute('translate') !== 'no') p(`arte sin aria-hidden/translate="no": ${a.className}`);
    if (a.textContent.trim()) p(`arte con texto real en el DOM: ${a.className}`);
  }
  // 2.5.3: el nombre accesible contiene el texto visible
  for (const el of document.querySelectorAll('main a[href], main button, header a[href], header button, nav a[href], nav button')) {
    if (!vis(el)) continue;
    const text = norm(el.innerText || '');
    // nombre accesible: aria-labelledby (texto de los elementos referidos, el propio botón incluido) o aria-label
    const by = el.getAttribute('aria-labelledby');
    const label = by ? by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ') : el.getAttribute('aria-label');
    if (text && label && !norm(label).includes(text)) p(`2.5.3: «${label}» no contiene el texto visible «${text}»`);
    if (!text && !label && !el.querySelector('[aria-label], img[alt]')) p(`enlace o botón sin nombre: ${el.outerHTML.slice(0, 80)}`);
  }
  // Enlaces a anclas: el destino existe
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (id && !document.getElementById(id)) p(`ancla rota: #${id}`);
  }
  // Objetivos
  out.targets = [...document.querySelectorAll('a[href], button, summary, [role="button"]')]
    .filter((el) => vis(el) && !el.classList.contains('skip'))
    .map((el) => {
      const r = el.getBoundingClientRect();
      // Solo se exime el enlace dentro de una frase (2.5.8, excepción «en línea»): inline y con otro texto a su alrededor.
      const inline = getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length - el.textContent.trim().length > 3;
      return { w: Math.round(r.width), h: Math.round(r.height), primary: el.classList.contains('btn--primary'), inline, name: norm(el.getAttribute('aria-label') || el.innerText || el.className).slice(0, 40) };
    });
  // Firma estructural para la paridad ES/EN: etiquetas y clases, sin texto
  // (la palabra partida en dos líneas solo existe donde la palabra no cabe en móvil: READY; es arte decorativo, no estructura)
  out.signature = [...main.querySelectorAll('*:not(.word-mini--split)')].map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}${e.dataset.poster ? `[${e.dataset.poster}]` : ''}`);
  out.scrollW = document.documentElement.scrollWidth;
  return out;
};

async function focusWalk(page, lang, label) {
  const total = await page.evaluate(() => document.querySelectorAll('a[href], button, summary, [tabindex="0"]').length);
  await page.evaluate(() => {
    scrollTo(0, 0);
    document.activeElement?.blur?.();
  });
  await page.waitForTimeout(700); // la barra inferior se oculta (inert) al volver al botón de la portada: que termine antes de recorrer
  const seen = new Set();
  const bad = [];
  for (let i = 0; i < total + 6; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300); // la barra inferior y el menú tardan 240 ms en entrar o salir
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const b = el.getBoundingClientRect();
      const cx = Math.min(innerWidth - 1, Math.max(0, b.left + b.width / 2));
      const cy = Math.min(innerHeight - 1, Math.max(0, b.top + b.height / 2));
      const top = document.elementFromPoint(cx, cy);
      const cs = getComputedStyle(el);
      const fixedCover = top && !(el === top || el.contains(top) || top.contains(el)) ? (top.closest('.nav, .bar, .menu, header') ? 'el cromo' : `${top.tagName.toLowerCase()}.${top.className} (barra ${document.querySelector('.bar')?.dataset.hidden ?? '?'}, scrollY ${Math.round(scrollY)}, y ${Math.round(cy)})`) : null;
      return {
        key: `${el.tagName}|${el.getAttribute('href') || ''}|${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`,
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
        inView: b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth,
        covered: fixedCover,
        outline: parseFloat(cs.outlineWidth) || 0,
        outlineStyle: cs.outlineStyle,
        skip: el.classList.contains('skip'),
      };
    });
    if (!r) continue;
    seen.add(r.key);
    if (r.skip) continue;
    if (!r.inView) bad.push(`${label}: el foco en «${r.name}» queda fuera de la pantalla`);
    else if (r.covered) bad.push(`${label}: «${r.name}» queda tapado por ${r.covered} (2.4.11)`);
    if (r.outlineStyle === 'none' || r.outline < 3) bad.push(`${label}: «${r.name}» sin contorno de foco de 3 px (${r.outlineStyle} ${r.outline})`);
  }
  for (const b of new Set(bad)) fail(lang, b);
  return seen.size;
}

// ── Portada en los tamaños de pantalla comunes: el texto no pisa la palabra ─────────────────────────────────────
// El texto va anclado al fondo y la palabra a las filas 3–4 de arriba: en pantallas bajas se cruzaban (revisión de WP10a). Dos medidas:
//  · sin JS, con el póster SSR visible: el `h1` empieza al menos 2 filas bajo la última fila «encendida» (capas hot y spark) del póster;
//  · con JS, con la elección del motor (engine.ts `prepare` + scenes/cover.ts `build`, copiadas aquí): el `h1` empieza 2 filas bajo la palabra.
// Además, con JS, hay un control de WhatsApp a la vista y sin tapar en cada tamaño (R5: la barra inferior o el icono de la píldora).
const MATRIX = [
  [320, 568], [360, 640], [375, 667], [360, 800], [390, 844], [412, 740], [768, 1024], [1024, 768],
  [1280, 720], [1366, 657], [1366, 768], [1440, 900], [1536, 730], [1600, 800], [1920, 950],
];
const GAP_ROWS = 2;
const engineBase = (cols, rows, set) => {
  const yTop = cols < 90 || rows < 44 ? 3 : 4; // scenes/cover.ts
  return yTop + stackRows(set);
};
async function coverMatrix(lang) {
  await loadWords(lang, ['GAYA']);
  const lines = [];
  for (const [w, h] of MATRIX) {
    const mobile = w < 900;
    const ctxOpts = { viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' };
    // sin JS
    const a = await browser.newContext({ ...ctxOpts, javaScriptEnabled: false });
    const pa = await a.newPage();
    await pa.goto(base + PATHS[lang], { waitUntil: 'load' });
    await pa.evaluate(() => document.fonts.ready).catch(() => {});
    const ssr = await pa.evaluate(() => {
      const v = [...document.querySelectorAll('.poster-ssr__v')].find((e) => getComputedStyle(e).display !== 'none');
      const last = (n) => {
        const art = v?.querySelector(`.poster-ssr__l--${n}`)?.getAttribute('data-art') ?? '';
        let k = -1;
        art.split('\n').forEach((l, i) => /\S/.test(l) && (k = i));
        return k;
      };
      const top = document.querySelector('.poster-ssr').getBoundingClientRect().top + scrollY;
      return {
        ch: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch')),
        shown: getComputedStyle(document.querySelector('.poster-ssr')).display !== 'none',
        variant: v?.className.match(/--(\w+)/)?.[1],
        hot: Math.max(last('hot'), last('spark')),
        h1: document.querySelector('h1').getBoundingClientRect().top + scrollY - top,
        lead: document.querySelector('.cover__lead').getBoundingClientRect().top + scrollY - top,
      };
    });
    await a.close();
    if (!ssr.shown || !ssr.variant) fail(lang, `${w}×${h} sin JS: no se ve el póster SSR`);
    else if (ssr.h1 < (ssr.hot + 1 + GAP_ROWS) * ssr.ch - 1) fail(lang, `${w}×${h} sin JS: el h1 (fila ${(ssr.h1 / ssr.ch).toFixed(1)}) pisa la palabra del póster ${ssr.variant} (termina en la fila ${ssr.hot + 1}; se exigen ${ssr.hot + 1 + GAP_ROWS})`);
    // con JS
    const b = await browser.newContext(ctxOpts);
    const pb = await b.newPage();
    await pb.goto(base + PATHS[lang], { waitUntil: 'load' });
    await pb.evaluate(() => document.fonts.ready).catch(() => {});
    await pb.waitForTimeout(700);
    const js = await pb.evaluate(() => {
      const css = (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
      const r = document.querySelector('h1').getBoundingClientRect();
      const cta = document.querySelector('[data-cta]').getBoundingClientRect();
      const wa = [...document.querySelectorAll('a[href^="https://wa.me/"]')].filter((a) => {
        const b = a.getBoundingClientRect();
        if (b.width < 1 || b.height < 1 || b.bottom <= 0 || b.top >= innerHeight || getComputedStyle(a).visibility === 'hidden' || a.closest('[inert]')) return false;
        const el = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, b.left + b.width / 2)), Math.min(innerHeight - 1, Math.max(0, b.top + b.height / 2)));
        return el && (el === a || a.contains(el));
      }).length;
      return { cw: css('--cw'), ch: css('--ch'), W: document.documentElement.clientWidth, h1: r.top + scrollY, ctaBottom: cta.bottom + scrollY, wa };
    });
    await b.close();
    const set = getWords('GAYA', lang, Math.floor(js.W / js.cw), Math.max(12, Math.floor((Math.floor(h / js.ch)) * 0.6)));
    const cols = Math.floor(js.W / js.cw);
    const rows = Math.floor(h / js.ch);
    const base0 = engineBase(cols, rows, set);
    if (js.h1 < (base0 + GAP_ROWS) * js.ch - 1) fail(lang, `${w}×${h} con motor: el h1 (fila ${(js.h1 / js.ch).toFixed(1)}) pisa la palabra ${set.variant} (termina en la fila ${base0}; se exigen ${base0 + GAP_ROWS})`);
    if (js.wa < 1) fail(lang, `${w}×${h}: ningún control de WhatsApp a la vista y sin tapar (R5)`);
    lines.push(`${w}×${h} h1 fila ${(js.h1 / js.ch).toFixed(1)} · palabra ${set.variant} hasta ${base0} · póster ${ssr.variant} hasta ${ssr.hot + 1} · botón ${js.ctaBottom <= h ? 'a la vista' : 'bajo el pliegue'} · WhatsApp a la vista ×${js.wa}`);
  }
  notes.push(`[${lang}] portada por tamaño de pantalla:\n      ${lines.join('\n      ')}`);
}

const signatures = {};
for (const lang of ['es', 'en']) {
  if (only && only !== lang) continue;

  // ── Escritorio: estructura, red, consola, objetivos, foco ──
  {
    const { ctx, page, external, problems } = await open(lang);
    await scrollThrough(page);
    const info = await page.evaluate(inPage);
    signatures[lang] = info.signature;
    for (const u of external) fail(lang, `PETICIÓN EXTERNA: ${u}`);
    for (const pr of problems) fail(lang, pr);
    if (info.lang !== lang) fail(lang, `html lang="${info.lang}"`);
    if (info.h1 !== 1) fail(lang, `h1: ${info.h1} (debe ser 1)`);
    if (JSON.stringify(info.posters) !== JSON.stringify(SCENES)) fail(lang, `orden de data-poster: ${info.posters.join(' ')}`);
    if (JSON.stringify(info.ids) !== JSON.stringify(IDS[lang])) fail(lang, `ids de sección: ${info.ids.join(' ')}`);
    if (info.cta !== 1) fail(lang, `[data-cta]: ${info.cta} (debe ser 1, el de la portada)`);
    if (info.status !== 1) fail(lang, `role="status": ${info.status} (solo «Copiado»)`);
    if (info.plates < 7) fail(lang, `placas: ${info.plates} (se esperan ≥ 7)`);
    for (const pr of info.problems) fail(lang, pr);
    for (const t of info.targets) if ((t.w < 24 || t.h < 24) && !t.inline) fail(lang, `2.5.8: objetivo ${t.w}×${t.h} < 24 px: «${t.name}»`);
    const tabs = await focusWalk(page, lang, 'escritorio');
    notes.push(`[${lang}] escritorio: ${info.headings.filter((h) => h.startsWith('h2')).length} h2 · ${info.headings.filter((h) => h.startsWith('h3')).length} h3 · ${info.plates} placas · ${info.wells.length} pozos · ${info.targets.length} controles · ${tabs} paradas de Tab`);
    await ctx.close();
  }

  // ── Móvil de referencia 360×800 ──
  {
    const { ctx, page, problems } = await open(lang, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const first = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)?.getBoundingClientRect();
      return { h1: q('h1'), lead: q('.cover__lead'), cta: q('[data-cta]'), bar: q('.bar'), barHidden: document.querySelector('.bar')?.dataset.hidden };
    });
    if (!first.h1 || !first.lead || !first.cta) fail(lang, 'móvil: faltan h1, lead o botón de la portada');
    else {
      for (const [k, r] of Object.entries({ h1: first.h1, lead: first.lead, cta: first.cta })) if (r.top < 0 || r.bottom > 800) fail(lang, `T22: ${k} no cabe en 360×800 sin scroll (${Math.round(r.top)}–${Math.round(r.bottom)})`);
      if (first.cta.height < 44) fail(lang, `móvil: el botón primario mide ${Math.round(first.cta.height)} px (< 44)`);
      notes.push(`[${lang}] 360×800: h1 ${Math.round(first.h1.top)}–${Math.round(first.h1.bottom)} · lead ${Math.round(first.lead.top)}–${Math.round(first.lead.bottom)} · botón ${Math.round(first.cta.top)}–${Math.round(first.cta.bottom)} px`);
    }
    if (shots) await page.screenshot({ path: join(shots, `first-360-${lang}.png`) });
    await scrollThrough(page);
    const info = await page.evaluate(inPage);
    for (const pr of problems) fail(lang, `móvil ${pr}`);
    for (const pr of info.problems) fail(lang, `móvil: ${pr}`);
    if (info.scrollW > 360) fail(lang, `móvil: scroll horizontal (${info.scrollW} > 360)`);
    for (const t of info.targets) {
      if ((t.w < 24 || t.h < 24) && !t.inline) fail(lang, `móvil 2.5.8: objetivo ${t.w}×${t.h} < 24 px: «${t.name}»`);
      if (t.primary && t.h < 44) fail(lang, `móvil: primario de ${t.h} px (< 44): «${t.name}»`);
    }
    await focusWalk(page, lang, 'móvil').then((n) => notes.push(`[${lang}] móvil: ${n} paradas de Tab`));
    await ctx.close();
  }

  // ── Interacciones: Copiar (con y sin contexto seguro), «Más detalles», reloj, WhatsApp, JSON-LD ──
  {
    for (const secure of [true, false]) {
      const { ctx, page } = await open(lang, { permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 900 } });
      // Sin HTTPS (el dominio aún no lo tiene) `isSecureContext` es false y debe entrar el respaldo de execCommand.
      if (!secure) {
        await page.addInitScript(() => Object.defineProperty(window, 'isSecureContext', { value: false }));
        await page.reload({ waitUntil: 'load' });
        await page.waitForTimeout(800);
      }
      const btn = page.locator('button[data-copy]');
      await btn.scrollIntoViewIfNeeded();
      await page.evaluate(() => navigator.clipboard.writeText('antes'));
      await btn.click();
      await page.waitForTimeout(300);
      const done = await page.locator('[role="status"]').textContent();
      const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '?');
      if (!done?.trim()) fail(lang, `Copiar (${secure ? 'seguro' : 'sin HTTPS'}): no aparece «Copiado»`);
      if (clip !== 'hola@gaya.com.do') fail(lang, `Copiar (${secure ? 'seguro' : 'sin HTTPS'}): el portapapeles tiene «${clip}»`);
      await page.waitForTimeout(2500);
      const after = await page.locator('[role="status"]').textContent();
      if (after?.trim()) fail(lang, 'Copiar: «Copiado» no se retira solo');
      notes.push(`[${lang}] Copiar ${secure ? 'con' : 'sin'} contexto seguro: «${done?.trim()}» · portapapeles «${clip}»`);
      await ctx.close();
    }
    {
      const { ctx, page } = await open(lang, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
      const d = page.locator('details[data-more]').first();
      await d.scrollIntoViewIfNeeded();
      const closed = await d.evaluate((e) => !e.open);
      await d.locator('summary').click();
      const opened = await d.evaluate((e) => e.open);
      if (!closed || !opened) fail(lang, `«Más detalles» en móvil: cerrado al cargar ${closed}, abierto al pulsar ${opened}`);
      const [sum] = await d.locator('summary').evaluateAll((e) => e.map((x) => Math.round(x.getBoundingClientRect().height)));
      if (sum < 44) fail(lang, `«Más detalles»: el resumen mide ${sum} px`);
      await ctx.close();
    }
    {
      const { ctx, page } = await open(lang);
      const r = await page.evaluate(() => {
        const dec = (u) => decodeURIComponent(new URL(u).searchParams.get('text') ?? '');
        const wa = [...document.querySelectorAll('main a[href^="https://wa.me/"]')].map((a) => ({ url: a.href, text: dec(a.href), cls: a.className }));
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
        const det = [...document.querySelectorAll('details[data-more]')].map((d) => [d.open, getComputedStyle(d.querySelector('summary')).display]);
        const clock = [...document.querySelectorAll('[data-clock]')].map((c) => c.textContent);
        const samples = [...document.querySelectorAll('.smp__row, .px-sample')].map((r) => ({ name: r.querySelector('h3')?.textContent, view: r.querySelector('a.btn--ghost, .px-sample-actions a:not(.solid)')?.getAttribute('href'), want: [...r.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => dec(a.href)) }));
        const all = document.querySelector('.smp__all, a[href$="/referencias/"], a[href$="/en/references/"]');
        return { wa, ld, det, clock, samples, all: all && { text: all.textContent.trim(), href: all.getAttribute('href') }, secondary: document.querySelector('.cover__actions .btn--ghost, .px-hero .px-btn:not(.px-btn--solid)')?.getAttribute('href') };
      });
      const graph = r.ld[0]?.['@graph'] ?? [];
      if (r.ld.length !== 1 || !graph.some((g) => g['@type'] === 'Organization') || graph.filter((g) => g['@type'] === 'Service').length !== 4) fail(lang, 'JSON-LD: se espera Organization + 4 Service en un solo bloque');
      if (graph.some((g) => g['@type'] === 'LocalBusiness' || g.aggregateRating || g.review)) fail(lang, 'JSON-LD: LocalBusiness, ratings o reseñas');
      const generic = r.wa.filter((w) => /^(Hola Gaya Digital, quiero|Hi Gaya Digital, I would like)/.test(w.text));
      if (generic.length < 2) fail(lang, `WhatsApp genérico: ${generic.length} enlaces (portada y contacto)`);
      const svc = r.wa.filter((w) => /«.+»/.test(w.text) && /propuesta|proposal/i.test(w.text));
      if (svc.length !== 8) fail(lang, `WhatsApp por servicio: ${svc.length} enlaces (índice y fichas: 8)`);
      if (r.samples.length < 1) fail(lang, 'no hay filas de ejemplos');
      for (const sm of r.samples) {
        if (!sm.want.some((t) => t.includes(`«${sm.name}»`) && t.includes('gaya.com.do/'))) fail(lang, `«Quiero una así» de ${sm.name} no lleva el mensaje del ejemplo`);
        if (!sm.view?.includes(lang === 'es' ? '/referencias/' : '/en/references/')) fail(lang, `«Ver ejemplo» de ${sm.name} apunta a ${sm.view}`);
      }
      // la galería vieja ya no existe: sin enlace final bajo los ejemplos, y el botón secundario baja a la sección de la portada
      if (r.all) fail(lang, `enlace a la galería retirada bajo los ejemplos: ${r.all.href}`);
      if (r.secondary !== (lang === 'es' ? '#ejemplos' : '#samples')) fail(lang, `botón secundario de la portada: ${r.secondary}`);
      if (!r.det.every(([open, disp]) => open === true && disp === 'none')) fail(lang, 'escritorio: «Más detalles» debe estar abierto y su resumen oculto');
      if (!r.clock.every((c) => /\d{2}:\d{2}/.test(c))) fail(lang, `reloj sin hora: ${r.clock.join(' | ')}`);
      notes.push(`[${lang}] WhatsApp: ${r.wa.length} enlaces (${generic.length} generales · ${svc.length} por servicio · ${r.samples.length} por ejemplo) · JSON-LD ${graph.length} nodos · reloj «${r.clock[0]}»`);
      await ctx.close();
    }
  }

  // ── Portada en alturas comunes ──
  if (!noMatrix) await coverMatrix(lang);

  // ── Desborde a varios anchos ──
  for (const width of [320, 375, 414, 768, 1024, 1920]) {
    const { ctx, page } = await open(lang, { viewport: { width, height: 900 } });
    const r = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: innerWidth }));
    if (r.s > r.i + 1) fail(lang, `scroll horizontal a ${width}px (${r.s} > ${r.i})`);
    await ctx.close();
  }

  // ── axe (T4): escritorio, móvil y movimiento reducido ──
  if (!noAxe) {
    for (const run of [
      { name: 'escritorio', o: { viewport: { width: 1280, height: 800 } } },
      { name: 'móvil', o: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
      { name: 'movimiento reducido', o: { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' } },
    ]) {
      const { ctx, page } = await open(lang, run.o);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      for (const v of res.violations) fail(lang, `axe [${v.impact}] ${v.id} (${run.name}): ${v.help} — ${v.nodes.length} nodo(s), p. ej. ${v.nodes[0]?.target?.join(' ')}`);
      notes.push(`[${lang}] axe ${run.name}: ${res.violations.length} violaciones · ${res.passes.length} reglas pasan · ${res.incomplete.length} por revisar`);
      for (const inc of res.incomplete) warns.push(`[${lang}] axe por revisar (${run.name}): ${inc.id} — ${inc.nodes.length} nodo(s)`);
      await ctx.close();
    }
  }
}

// ── Presupuestos de la home construida (§11.1): HTML ≤ 34 KB gz, CSS ≤ 10 KB gz (hojas enlazadas + <style> en línea) ──
if (!arg('base', null)) {
  const dir = join(ROOT, String(arg('dir', 'dist')));
  const gzLen = (b) => gzipSync(b, { level: 9 }).length;
  for (const lang of ['es', 'en']) {
    if (only && only !== lang) continue;
    const file = join(dir, lang === 'es' ? 'index.html' : 'en/index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    let css = 0;
    const sheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
    for (const href of sheets) css += gzLen(readFileSync(join(dir, href.replace(/^\//, ''))));
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += gzLen(Buffer.from(m[1]));
    const htmlGz = gzLen(Buffer.from(html));
    if (htmlGz > 34 * 1024) fail(lang, `presupuesto: HTML ${(htmlGz / 1024).toFixed(1)} KB gz > 34`);
    if (css > 10 * 1024) fail(lang, `presupuesto: CSS ${(css / 1024).toFixed(2)} KB gz > 10`);
    notes.push(`[${lang}] presupuesto: HTML ${(htmlGz / 1024).toFixed(1)} KB gz (≤ 34) · CSS ${(css / 1024).toFixed(2)} KB gz en ${sheets.length} hojas + en línea (≤ 10)`);
  }
}

// ── Paridad ES/EN: mismo árbol de etiquetas y clases ──
if (signatures.es && signatures.en) {
  const a = signatures.es;
  const b = signatures.en;
  if (a.length !== b.length) {
    const i = a.findIndex((x, k) => x !== b[k]);
    fail('es/en', `paridad: ${a.length} elementos en ES y ${b.length} en EN; primera diferencia en ${i}: «${a[i]}» ≠ «${b[i]}» (alrededor: ${a.slice(Math.max(0, i - 2), i + 2).join(' | ')})`);
  }
  else {
    const diff = a.map((x, i) => (x === b[i] ? null : `${i}: ${x} ≠ ${b[i]}`)).filter(Boolean);
    if (diff.length) fail('es/en', `paridad: ${diff.length} diferencias, p. ej. ${diff[0]}`);
    else notes.push(`paridad ES/EN: ${a.length} elementos idénticos en etiqueta y clase`);
  }
}

await browser.close();
server?.close();
console.log('\nRevisión del inicio');
for (const n of notes) console.log(`  · ${n}`);
for (const w of [...new Set(warns)]) console.log(`  aviso  ${w}`);
for (const f of [...new Set(fails)]) console.log(`  FALLA  ${f}`);
console.log(fails.length ? `\n✗ ${new Set(fails).size} fallos` : '\n✓ Pasa');
process.exit(fails.length ? 1 : 0);
