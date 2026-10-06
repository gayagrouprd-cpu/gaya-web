#!/usr/bin/env node
// Guardia de red y consola: visita las páginas y FALLA si hay
//  - cualquier petición a otro origen (cero terceros),
//  - errores de consola o excepciones de la página,
//  - subrecursos con estado >= 400 o peticiones fallidas.
// Uso: node scripts/guard.mjs [--dir dist] [--base http://127.0.0.1:4173] [--urls /,/en/] [--self-test] [--matrix]
//   sin --urls recorre todas las páginas HTML del directorio servido.
//   --matrix: las portadas (por omisión «/» y «/en/») en TODOS los modos del arte (T3 de DIRECTION §13): normal (WebGL2 si hay),
//   «?still», «?nogl», movimiento reducido, ahorro de datos y sin JavaScript; en cada uno, 0 peticiones a otro origen y 0 errores o
//   avisos de consola. Informa del modo que el motor tomó (data-field y renderer), para que un «normal» que cayó a 2D no pase por WebGL2.
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal, scrollThrough } from './lib/browser.mjs';

export function listPages(dir) {
  const root = resolve(dir);
  const out = [];
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === 'index.html') out.push('/' + relative(root, d).split(sep).join('/') + '/');
      else if (name === '404.html' && d === root) out.push('/404.html');
    }
  })(root);
  return out.map((u) => u.replace('//', '/')).sort();
}

/** Visita una URL y devuelve los hallazgos. */
export async function guardPage(context, base, path, { viewport, selfTest = false, init = null, probe = null, noScript = false } = {}) {
  const baseOrigin = new URL(base).origin;
  const page = await context.newPage();
  if (viewport) await page.setViewportSize(viewport);
  const findings = [];
  const external = new Set();
  const isNotFoundPage = path === '/404.html';

  await page.route('**/*', (route) => {
    if (isExternal(route.request().url(), baseOrigin)) return route.abort(); // nada sale de la máquina
    return route.continue();
  });
  page.on('request', (req) => {
    if (isExternal(req.url(), baseOrigin)) external.add(req.url());
  });
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) findings.push(`consola ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => findings.push(`excepción: ${err.message}`));
  page.on('response', (res) => {
    const req = res.request();
    const status = res.status();
    if (status >= 400 && !(isNotFoundPage && req.isNavigationRequest())) {
      findings.push(`HTTP ${status}: ${res.url()}`);
    }
  });
  page.on('requestfailed', (req) => {
    if (isExternal(req.url(), baseOrigin)) return; // ya se cuenta como externa
    findings.push(`petición fallida: ${req.url()} (${req.failure()?.errorText ?? '?'})`);
  });

  if (init) await page.addInitScript(init);
  if (selfTest) {
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        fetch('https://example.com/autoprueba').catch(() => {});
        const img = new Image();
        img.src = 'https://example.org/autoprueba.png';
      });
    });
  }

  const res = await page.goto(base + path, { waitUntil: 'load' });
  // Una página que solo redirige (meta refresh: la galería retirada) navega sola: se espera a que llegue y se revisa el destino
  if (/http-equiv="refresh"/i.test((await res?.text().catch(() => '')) ?? '')) {
    const from = page.url();
    const moved = await page.waitForURL((u) => u.href !== from, { timeout: 5000 }).then(
      () => true,
      () => false,
    );
    if (!moved) findings.push('la redirección (meta refresh) no lleva a ninguna parte');
    await page.waitForLoadState('load').catch(() => {});
  }
  // sin JavaScript no hay `evaluate` (Chrome tumba la pestaña): solo se espera a la red
  if (!noScript) await scrollThrough(page);
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(250);
  if (probe && !noScript) findings.probe = await page.evaluate(probe).catch(() => null);
  await page.close();

  for (const u of external) findings.push(`PETICIÓN EXTERNA: ${u}`);
  return findings;
}

/** Modos del arte que T3 pide recorrer (nombre, opciones del contexto, parámetro de URL, script de inicio). */
export const MATRIX_MODES = [
  { name: 'normal', ctx: {}, query: '' },
  { name: 'still', ctx: {}, query: '?still' },
  { name: 'nogl', ctx: {}, query: '?nogl' },
  { name: 'reducido', ctx: { reducedMotion: 'reduce' }, query: '' },
  {
    name: 'saveData',
    ctx: {},
    query: '',
    init: "Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '3g' }, configurable: true });",
  },
  { name: 'sin JS', ctx: { javaScriptEnabled: false }, query: '', noScript: true },
];
const fieldProbe = () => ({ field: document.documentElement.dataset.field ?? null, renderer: window.__field?.renderer ?? null, mode: window.__field?.mode ?? null });

/** T3: cada portada en cada modo. Devuelve [{ path, mode, findings, probe }]. */
export async function runMatrix({ base, paths, log = true }) {
  const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
  const results = [];
  for (const p of paths) {
    for (const mode of MATRIX_MODES) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', ...mode.ctx });
      const findings = await guardPage(context, base, p + mode.query, { init: mode.init, probe: fieldProbe, noScript: mode.noScript });
      const probe = findings.probe ?? null;
      results.push({ path: p, mode: mode.name, findings: [...findings], probe });
      if (log) {
        const what = probe ? `data-field=${probe.field}${probe.renderer ? '/' + probe.renderer : ''}` : 'sin sondeo';
        console.log(`${findings.length ? 'FALLA' : 'ok   '}  ${(p + mode.query).padEnd(14)} ${mode.name.padEnd(9)} ${what}${findings.length ? '\n   - ' + findings.join('\n   - ') : ''}`);
      }
      await context.close();
    }
  }
  await browser.close();
  return results;
}

export async function runGuard({ base, paths, selfTest = false, log = true }) {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const results = [];
  for (const p of paths) {
    const findings = await guardPage(context, base, p, { selfTest });
    results.push({ path: p, findings });
    if (log) console.log(`${findings.length ? 'FALLA' : 'ok   '}  ${p}${findings.length ? '\n   - ' + findings.join('\n   - ') : ''}`);
  }
  await browser.close();
  return results;
}

// Ejecución directa
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : fallback;
  };
  const dir = arg('dir', 'dist');
  const selfTest = process.argv.includes('--self-test');
  let base = arg('base');
  let server;
  if (!base) {
    server = createPagesServer({ dir });
    const port = await listen(server, 0);
    base = `http://127.0.0.1:${port}`;
  }
  if (process.argv.includes('--matrix')) {
    const homes = arg('urls') ? arg('urls').split(',') : ['/', '/en/'];
    const rows = await runMatrix({ base, paths: homes });
    server?.close();
    const failed = rows.filter((r) => r.findings.length).length;
    console.log(`
${rows.length} combinaciones (página × modo), ${failed} con hallazgos.`);
    process.exit(failed ? 1 : 0);
  }
  const paths = arg('urls') ? arg('urls').split(',') : listPages(dir);
  const results = await runGuard({ base, paths, selfTest });
  server?.close();
  const bad = results.filter((r) => r.findings.length).length;
  if (selfTest) {
    const caught = results.some((r) => r.findings.some((f) => f.startsWith('PETICIÓN EXTERNA')));
    console.log(caught ? '\nAutoprueba superada: la guardia detectó la petición externa inyectada.' : '\nAUTOPRUEBA FALLIDA: la guardia no vio la petición externa.');
    process.exit(caught ? 0 : 1);
  }
  console.log(`\n${paths.length} páginas, ${bad} con hallazgos.`);
  process.exit(bad ? 1 : 0);
}
