// T2 (parte del motor) · tamaño del JS del arte sobre el ARNÉS de esbuild (informativo). La puerta de T2 es `size-real.mjs`, que mide el
// build real de Astro (Vite 8 / Rolldown): el arnés de esbuild no reproduce su división de trozos (deja el kit, los glifos y el atlas en
// archivos aparte y paga un gzip por archivo), así que sus KB no son los de producción. Sirve para el techo de 40 KB del JS total y
// para comparar versiones del motor entre sí.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, finish, info, launchBrowser, open, ready, sleep } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const h = await serveHarness();
const browser = await launchBrowser();
const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900 });
await ready(s.page);
await sleep(500);
const ff = await s.page.evaluate(() => window.__field.firstFrameAt);
const first = [];
const later = [];
const names = await s.page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\.js$/.test(e.name)).map((e) => ({ n: e.name.split('/').pop(), t: e.responseEnd })));
for (const e of names) (e.t <= ff ? first : later).push(e.n);
let gz = 0;
let gz6 = 0;
for (const f of first) {
  const z = h.sizes.files[f];
  gz += z.gz9;
  gz6 += z.gz6;
  info(`${f.padEnd(40)} ${String(z.bytes).padStart(6)} B  ${String(z.gz9).padStart(5)} B gz-9`);
}
info(`arnés de esbuild · JS de primera carga: ${(gz / 1024).toFixed(2)} KB gz-9 (${(gz6 / 1024).toFixed(2)} KB gz-6) en ${first.length} archivos (la puerta es size-real.mjs)`);
const joined = gzipSync(Buffer.concat(first.map((f) => readFileSync(join(tmpdir(), 'gaya-field-harness', 'assets', f)))), { level: 9 }).length;
info(`los mismos ${first.length} archivos concatenados en uno solo: ${(joined / 1024).toFixed(2)} KB gz-9 (el gzip por archivo pierde el diccionario compartido)`);
info(`pedidos después del primer fotograma: ${later.length ? later.join(', ') : 'ninguno'}`);
check('el arnés pide el motor UNA vez antes del primer fotograma (un solo import dinámico del motor)', first.filter((f) => /^engine-/.test(f)).length === 1, first.join(', '));
// una página solo trae las palabras de SU idioma: el total por página excluye las del otro
const perLang = (lang) => Object.entries(h.sizes.files).filter(([f]) => !new RegExp(`^words\\.gen\\.${lang === 'es' ? 'en' : 'es'}\\.`).test(f)).reduce((a, [, z]) => a + z.gz9, 0);
for (const lang of ['es', 'en']) check(`JS total del arte (página ${lang}, con todas las escenas registradas) ≤ 40 KB gz`, perLang(lang) <= 40 * 1024, `${(perLang(lang) / 1024).toFixed(2)} KB gz-9`);
await s.close();
await browser.close();
await h.close();
finish('T2 · tamaño del JS del arte (arnés de esbuild)');
