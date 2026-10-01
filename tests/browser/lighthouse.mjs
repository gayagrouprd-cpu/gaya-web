// T1 (parte del motor) · Lighthouse móvil (mediana de 3) del ARNÉS empaquetado en las tres rutas: WebGL2, ?nogl (2D fijo) y sin JS.
// El arnés es un documento mínimo con el arte real: sirve para aislar el coste del MOTOR (LCP, TBT, CLS). No sustituye a la medida
// de la página completa (WP10/WP11), que añade su propio HTML, CSS y fuentes.
import { existsSync } from 'node:fs';
import { check, finish, info } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');
const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
const h = await serveHarness();

const ROUTES = [
  ['WebGL2', '/', []],
  ['?nogl (2D fijo)', '/?nogl', []],
  ['sin JS', '/nojs', []],
];
for (const [name, path, flags] of ROUTES) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', ...flags] });
    try {
      const r = await lighthouse(h.base + path, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
      const a = r.lhr.audits;
      runs.push({ perf: Math.round(r.lhr.categories.performance.score * 100), bp: Math.round(r.lhr.categories['best-practices'].score * 100), a11y: Math.round(r.lhr.categories.accessibility.score * 100), lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue, errors: a['errors-in-console'].details?.items?.length ?? 0 });
    } finally {
      try {
        await chrome.kill();
      } catch {
        /* EPERM al borrar el perfil temporal en Windows */
      }
    }
  }
  const med = (k) => runs.map((r) => r[k]).sort((x, y) => x - y)[1];
  info(`${name}: rendimiento ${med('perf')} · buenas prácticas ${med('bp')} · LCP ${(med('lcp') / 1000).toFixed(2)} s · TBT ${Math.round(med('tbt'))} ms · CLS ${med('cls').toFixed(3)} · errores de consola ${Math.max(...runs.map((r) => r.errors))}`);
  check(`Lighthouse móvil (${name}): rendimiento ≥ 90, LCP < 2,5 s, CLS 0, TBT < 200 ms`, med('perf') >= 90 && med('lcp') < 2500 && med('cls') <= 0.001 && med('tbt') < 200, `${med('perf')} / ${(med('lcp') / 1000).toFixed(2)} s / ${med('cls').toFixed(3)} / ${Math.round(med('tbt'))} ms`);
}
await h.close();
finish('Lighthouse del motor (arnés)');
