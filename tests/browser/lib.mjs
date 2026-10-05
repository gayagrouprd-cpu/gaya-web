// Ayudantes de las pruebas de navegador del motor (Playwright + Chrome real). Se ejecutan contra el laboratorio de desarrollo
// (`npx astro dev --host 127.0.0.1 --port 4333` → /lab/field/), salvo las que dicen lo contrario.
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../scripts/lib/browser.mjs';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '../..');
export const BASE = process.env.FIELD_URL ?? 'http://127.0.0.1:4333';
export const OUT = resolve(ROOT, 'reports/ascii/wp6c/engine');
mkdirSync(OUT, { recursive: true });
/** Capturas intermedias (paridad, costuras): no se guardan en el repositorio. */
export const TMP = resolve(tmpdir(), 'gaya-wp5');
mkdirSync(TMP, { recursive: true });

// ---------- resultados ----------
let failed = 0;
const rows = [];
export function check(name, ok, detail = '') {
  rows.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ·  ' + detail : ''}`);
  return ok;
}
export const info = (s) => console.log(`      ${s}`);
export function finish(title) {
  console.log(`\n${title}: ${rows.length - failed}/${rows.length} comprobaciones en verde`);
  if (failed) process.exitCode = 1;
  return failed === 0;
}

// ---------- apertura de páginas ----------
/** Script de página (antes de cualquier otro): cuenta rAF vivos y listeners netos, y mide tareas largas. */
const INSTRUMENT = `
(() => {
  const w = window;
  const live = new Set();
  const raf = w.requestAnimationFrame.bind(w);
  const caf = w.cancelAnimationFrame.bind(w);
  w.__raf = { live, total: 0 };
  w.requestAnimationFrame = (cb) => { const id = raf((t) => { live.delete(id); cb(t); }); live.add(id); w.__raf.total++; return id; };
  w.cancelAnimationFrame = (id) => { live.delete(id); caf(id); };
  const lis = new Map();
  const add = EventTarget.prototype.addEventListener;
  const rem = EventTarget.prototype.removeEventListener;
  const key = (t, type, o) => (t === w ? 'window' : t === document ? 'document' : t instanceof HTMLCanvasElement ? 'canvas' : t instanceof MediaQueryList ? 'mql' : t && t.constructor ? t.constructor.name : '?') + ':' + type + ':' + (typeof o === 'boolean' ? o : !!(o && o.capture));
  const store = new WeakMap();
  EventTarget.prototype.addEventListener = function (type, fn, o) { const k = key(this, type, o); let m = store.get(this); if (!m) store.set(this, (m = new Map())); const set = m.get(k) || new Set(); if (!set.has(fn)) { set.add(fn); m.set(k, set); lis.set(k, (lis.get(k) || 0) + 1); } return add.call(this, type, fn, o); };
  EventTarget.prototype.removeEventListener = function (type, fn, o) { const k = key(this, type, o); const m = store.get(this); const set = m && m.get(k); if (set && set.delete(fn)) lis.set(k, lis.get(k) - 1); return rem.call(this, type, fn, o); };
  w.__listeners = () => Object.fromEntries([...lis].filter(([, n]) => n > 0));
  w.__long = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__long.push({ start: e.startTime, dur: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
})();
`;

/**
 * Abre una página del laboratorio.
 * opts: path, w, h, dpr, mobile, reduced, saveData, cpu (factor), contrast, forced, init (script extra), browser (reutilizar),
 * realDsf (sin emulación de viewport ni de dpr: el `browser` debe haberse lanzado con `--force-device-scale-factor=<dpr>`, ver `launchRealDsf`; el dpr emulado
 * por CDP ajusta las cajas a px CSS enteros y falsea el dpr fraccionario, el real no),
 * clock (reloj falso de Playwright desde el arranque: fluye a ritmo real hasta `page.clock.pauseAt`, y `runFor` lo avanza de forma determinista)
 */
export async function open(opts = {}) {
  // FIELD_PATH apunta estas pruebas a otra página con el mismo contrato (`main#contenido`, `[data-poster]`, `[data-well]`): p. ej. la portada
  // construida (`FIELD_URL=<dist servido> FIELD_PATH=/ node tests/browser/wells.mjs`, T7 sobre la página real; lo hace scripts/check-ascii.mjs).
  const { path = process.env.FIELD_PATH ?? '/lab/field/', w = 1440, h = 900, dpr = 1, mobile = false, reduced = false, saveData = false, cpu = 1, forced = false, contrast = false, init = '', wait = 'load', instrument = true, clock = false, realDsf = false } = opts;
  const own = !opts.browser;
  const browser = opts.browser ?? (await launchBrowser());
  const ctx = await browser.newContext({
    ...(realDsf ? { viewport: null } : { viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile }),
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    forcedColors: forced ? 'active' : 'none',
    contrast: contrast ? 'more' : 'no-preference',
  });
  const page = await ctx.newPage();
  // el servidor de desarrollo recarga la página cuando otro paquete toca un archivo: sin HMR las mediciones no se interrumpen
  await page.routeWebSocket(/.*/, () => {});
  const logs = [];
  const external = [];
  const requests = [];
  const origin = new URL(opts.base ?? BASE).origin;
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') logs.push(`${t}: ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const u = r.url();
    requests.push({ url: u, t: Date.now() });
    if (/^https?:/.test(u) && new URL(u).origin !== origin) external.push(u);
  });
  if (clock) await page.clock.install(); // ANTES de la instrumentación: así esta envuelve el rAF falso y cuenta sus rAF vivos
  if (instrument) await page.addInitScript(INSTRUMENT);
  if (saveData) await page.addInitScript(`Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true });`);
  if (init) await page.addInitScript(init);
  const cdp = await ctx.newCDPSession(page);
  if (cpu !== 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto((opts.base ?? BASE) + path, { waitUntil: wait });
  return {
    page,
    ctx,
    cdp,
    logs,
    external,
    requests,
    browser,
    setCpu: (rate) => cdp.send('Emulation.setCPUThrottlingRate', { rate }),
    async close() {
      await ctx.close();
      if (own) await browser.close();
    },
  };
}

/** Chrome con un dpr REAL (zoom-for-dsf, como una pantalla de Windows al 125 %/150 %): la ventana mide `w × h` de contenido aproximadamente. */
export const launchRealDsf = (dpr, w = 1440, h = 900) => launchBrowser({ args: [`--force-device-scale-factor=${dpr}`, `--window-size=${w},${h + 105}`, '--hide-scrollbars'] });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera a que el motor esté montado (data-field = live/still/off) y devuelve el estado. */
export async function ready(page, { timeout = 20000 } = {}) {
  await page.waitForFunction(() => ['live', 'still', 'off', 'ssr'].includes(document.documentElement.dataset.field), null, { timeout });
  return state(page);
}

/** Foto del objeto de depuración (sin funciones). */
export const state = (page) =>
  page.evaluate(() => {
    const f = window.__field;
    const base = { field: document.documentElement.dataset.field ?? null, canvases: document.querySelectorAll('canvas.field').length };
    if (!f) return { ...base, exists: false };
    const { hash, ...rest } = Object.fromEntries(Object.keys(Object.getOwnPropertyDescriptors(f)).map((k) => [k, f[k]]));
    void hash;
    return { ...base, exists: true, ...rest };
  });

/** Espera hasta que el motor duerma (sin bucle): `sleeping` y 0 rAF propios. */
export async function untilSleeping(page, timeout = 15000) {
  await page.waitForFunction(() => window.__field && window.__field.sleeping === true, null, { timeout });
}

export const rafLive = (page) => page.evaluate(() => window.__raf.live.size);

/** Captura solo el lienzo (el texto se oculta un momento). */
export async function shotCanvas(page, file, clip) {
  await page.addStyleTag({ content: 'main#contenido{visibility:hidden!important}' });
  await page.screenshot({ path: file, clip });
  await page.evaluate(() => { for (const s of [...document.querySelectorAll('style')]) if (s.textContent.includes('visibility:hidden!important')) s.remove(); });
}

export { launchBrowser };
