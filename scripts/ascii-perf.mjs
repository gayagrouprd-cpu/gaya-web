#!/usr/bin/env node
// T12 (proxy) de DIRECTION §13 sobre la página VIVA construida (dist/ servido como GitHub Pages, la de verdad, no el laboratorio):
// Chrome con CPU ×4 y ×6 (Emulation.setCPUThrottlingRate por CDP), con el perfil de escritorio (1440×900 @1) y el del móvil de referencia
// (360×800 @2, táctil: el motor elige el tier «low»), y por cada combinación:
//   · primer fotograma < 600 ms tras `load`;
//   · portada en reposo 10 s (con la ignición dentro) → costP50 ≤ 6 ms y costP95 ≤ 12 ms;
//   · `sleeping === true` a los 2 s de acabar la ignición (2,6 s) y 0 rAF vivos;
//   · scroll continuo 10 s a 420 px/s (una marea por cartel) y un fling de 2 400 px/s → mismos topes de coste y el `tier` no baja;
//   · ninguna tarea larga (> 50 ms) después del primer fotograma (el horneado de antes cuenta aparte);
//   · el JS que se pidió antes del primer fotograma (encodedBodySize de la Resource Timing API: gzip tal como lo sirve Pages) cabe en
//     asciiFirstJsGz de scripts/budgets.mjs y coincide (±8 %) con la medida estática de ese mismo script sobre dist/.
// ⚠ NO sustituye la puerta del Samsung A07 FÍSICO (T12 es bloqueante de M1): sigue ABIERTA. Esto es un proxy de CPU de un PC con GPU
// de sobremesa; el A07 (Helio G99, GPU Mali) tiene otra GPU, otra memoria y otro hilo de composición.
// Uso: node scripts/ascii-perf.mjs [--dir dist] [--base http://127.0.0.1:4173] [--rates 4,6] [--profiles desktop,mobile] [--path /] [--out reports/ascii/wp11/perf.json]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal } from './lib/browser.mjs';
import { BUDGET, measurePage } from './budgets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const RATES = String(arg('rates', '4,6')).split(',').map(Number);
const PROFILES = String(arg('profiles', 'desktop,mobile')).split(',');
const PATH = String(arg('path', '/'));
const out = arg('out', null);
const dist = join(ROOT, String(arg('dir', 'dist')));

let server = null;
let base = arg('base', null);
if (!base) {
  server = createPagesServer({ dir: dist });
  base = `http://127.0.0.1:${await listen(server, 0)}`;
}
base = String(base).replace(/\/$/, '');
const origin = new URL(base).origin;

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${name}${detail ? '  ·  ' + detail : ''}`);
  return ok;
};
const info = (s) => console.log(`      ${s}`);

/** Antes de cualquier script de la página: cuenta los rAF vivos y las tareas largas. */
const INSTRUMENT = `
(() => {
  const live = new Set();
  const raf = window.requestAnimationFrame.bind(window);
  const caf = window.cancelAnimationFrame.bind(window);
  window.__raf = { live };
  window.requestAnimationFrame = (cb) => { const id = raf((t) => { live.delete(id); cb(t); }); live.add(id); return id; };
  window.cancelAnimationFrame = (id) => { live.delete(id); caf(id); };
  window.__long = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push({ start: e.startTime, dur: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
  window.__run = (opts) => new Promise((resolve) => {
    const { v, ms } = opts; const t0 = performance.now(); const y0 = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const step = (now) => {
      const y = Math.min(max, y0 + v * ((now - t0) / 1000));
      scrollTo({ top: y, behavior: 'instant' });
      if (now - t0 > ms || y >= max) return resolve(true);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();`;

const PROFILE = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = (page) =>
  page.evaluate(() => {
    const f = window.__field;
    return f ? { mode: f.mode, tier: f.tier, frames: f.frames, sleeping: f.sleeping, p50: f.costP50, p95: f.costP95, renderer: f.renderer, firstFrameAt: f.firstFrameAt, cols: f.cols, rows: f.rows, poster: f.poster } : null;
  });

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const rows = [];
for (const profile of PROFILES) {
  for (const rate of RATES) {
    const tag = `${profile} ×${rate}`;
    console.log(`\n──── ${PATH} · ${tag} ────`);
    const ctx = await browser.newContext({ ...PROFILE[profile], serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const external = [];
    const logs = [];
    await page.route('**/*', (r) => (isExternal(r.request().url(), origin) ? (external.push(r.request().url()), r.abort()) : r.continue()));
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`excepción: ${e.message}`));
    await page.addInitScript(INSTRUMENT);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.goto(base + PATH, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__field && window.__field.firstFrameAt > 0, null, { timeout: 60000 }).catch(() => {});
    let st = await state(page);
    if (!st) {
      check(`${tag}: el motor se montó`, false, `no hay __field (data-field=${await page.evaluate(() => document.documentElement.dataset.field)})`);
      await ctx.close();
      continue;
    }
    const nav = await page.evaluate(() => performance.getEntriesByType('navigation')[0].loadEventEnd);
    const dFirst = st.firstFrameAt - nav;
    check(`${tag}: primer fotograma < 600 ms tras load`, dFirst < 600, `${dFirst.toFixed(0)} ms (load ${nav.toFixed(0)}, primer fotograma ${st.firstFrameAt.toFixed(0)})`);
    info(`motor: ${st.mode}/${st.renderer} · tier ${st.tier} · rejilla ${st.cols}×${st.rows} · cartel ${st.poster}`);
    if (st.renderer !== 'gl') info('⚠ el motor no usa WebGL2 en este Chrome: los números son del camino 2D');

    // JS pedido antes del primer fotograma (transferencia real, gzip del servidor)
    const res = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => ({ n: new URL(e.name).pathname, t: e.responseEnd, b: e.encodedBodySize, type: e.initiatorType })));
    const ff = st.firstFrameAt;
    const jsBefore = res.filter((e) => /\.js$/.test(e.n) && e.t <= ff);
    const jsGz = jsBefore.reduce((a, e) => a + e.b, 0);
    const art = jsBefore.filter((e) => !/(Nav|About|Contact|ServiceArticle)\.astro_astro_type_script|clock\./.test(e.n));
    const artGz = art.reduce((a, e) => a + e.b, 0);
    const fontsBefore = res.filter((e) => /\.woff2$/.test(e.n) && e.t <= ff).reduce((a, e) => a + e.b, 0);
    info(`antes del primer fotograma: ${jsBefore.length} archivos JS (${(jsGz / 1024).toFixed(2)} KB gz en la red; del arte ${(artGz / 1024).toFixed(2)} KB), fuentes ${(fontsBefore / 1024).toFixed(1)} KB`);
    if (profile === 'desktop' && rate === RATES[0]) {
      const stat = measurePage(dist, PATH === '/en/' ? 'en/index.html' : 'index.html');
      check(`${tag}: JS de primera carga del arte ≤ ${(BUDGET.asciiFirstJsGz / 1024).toFixed(1)} KB gz (medido en el navegador)`, artGz <= BUDGET.asciiFirstJsGz, `${(artGz / 1024).toFixed(2)} KB en la red · estático ${(stat.asciiFirstJsGz / 1024).toFixed(2)} KB (gzip -9)`);
      const diff = Math.abs(artGz - stat.asciiFirstJsGz) / stat.asciiFirstJsGz;
      check(`${tag}: la medida estática de budgets.mjs coincide con la del navegador (±8 %)`, diff <= 0.08, `diferencia ${(diff * 100).toFixed(1)} %`);
    }

    // ignición + reposo 10 s
    await sleep(10000);
    st = await state(page);
    check(`${tag}: ignición y reposo 10 s: costP50 ≤ 6 ms y costP95 ≤ 12 ms`, st.p50 <= 6 && st.p95 <= 12, `p50 ${st.p50.toFixed(2)} · p95 ${st.p95.toFixed(2)} ms en ${st.frames} cuadros`);
    // a los 2 s de acabar la ignición: dormido (la ignición dura 2,6 s de reloj de pared; ya han pasado más de 10 s)
    const raf = await page.evaluate(() => window.__raf.live.size);
    check(`${tag}: reposo: sleeping === true y 0 rAF vivos`, st.sleeping === true && raf === 0, `sleeping=${st.sleeping} · rAF vivos ${raf}`);
    const rest = st;

    // scroll continuo 10 s a 420 px/s
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(2500);
    const before = await state(page);
    await page.evaluate(() => window.__run({ v: 420, ms: 10000 }));
    st = await state(page);
    check(`${tag}: scroll continuo 10 s: costP50 ≤ 6 ms y costP95 ≤ 12 ms`, st.p50 <= 6 && st.p95 <= 12, `p50 ${st.p50.toFixed(2)} · p95 ${st.p95.toFixed(2)} ms (${st.frames - before.frames} cuadros)`);
    check(`${tag}: scroll continuo: el tier no baja (${before.tier})`, st.tier === before.tier, `${before.tier} → ${st.tier}`);
    await sleep(2600);
    check(`${tag}: tras el scroll: sleeping === true a los 2 s`, (await state(page)).sleeping === true);

    // fling
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(3000);
    await page.evaluate(() => window.__run({ v: 2400, ms: 4000 }));
    await sleep(1800);
    st = await state(page);
    check(`${tag}: fling de 2 400 px/s: costes dentro de presupuesto y tier sin bajar`, st.p50 <= 6 && st.p95 <= 12 && st.tier === before.tier, `p50 ${st.p50.toFixed(2)} · p95 ${st.p95.toFixed(2)} · tier ${st.tier}`);

    // tareas largas, consola y red
    const long = await page.evaluate(() => ({ ff: window.__field.firstFrameAt, long: window.__long }));
    const after = long.long.filter((e) => e.start >= long.ff);
    const pre = long.long.filter((e) => e.start < long.ff);
    check(`${tag}: ninguna tarea > 50 ms tras el primer fotograma`, after.length === 0, after.length ? after.map((e) => `${e.dur.toFixed(0)} ms @${e.start.toFixed(0)}`).join(', ') : `0 (antes: ${pre.map((e) => e.dur.toFixed(0) + ' ms').join(', ') || 'ninguna'})`);
    check(`${tag}: consola limpia y sin peticiones externas`, logs.length === 0 && external.length === 0, [...logs, ...external].join(' | '));
    rows.push({ profile, rate, firstFrameMs: dFirst, restP50: rest.p50, restP95: rest.p95, scrollP50: st.p50, scrollP95: st.p95, tier: st.tier, renderer: st.renderer, jsGzBeforeFirstFrame: jsGz, artJsGz: artGz, longAfter: after.length, longBefore: pre.map((e) => Math.round(e.dur)) });
    await ctx.close();
  }
}
await browser.close();
server?.close();
console.log('\nPuerta T12 sobre el Samsung A07 FÍSICO: ABIERTA (solo proxy de CPU ×4/×6 en un PC con GPU de sobremesa; hay que medir en el A07).');
if (out) {
  const file = resolve(ROOT, String(out));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ fecha: new Date().toISOString(), a07Fisico: 'ABIERTA', rows }, null, 2));
}
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} comprobaciones en verde (T12 proxy).`);
for (const f of failed) console.log(`  FALLA ${f.name}: ${f.detail}`);
process.exit(failed.length ? 1 : 0);
