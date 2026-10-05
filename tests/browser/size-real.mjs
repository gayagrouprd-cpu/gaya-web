// T2 (parte del motor) sobre el BUILD REAL de Astro (Vite 8 / Rolldown) en una copia aislada: los .js que el navegador pide antes del
// primer fotograma (arranque + motor + kit + palabras + escena cover + datos de GAYA), medidos con gzip -9 por archivo (como budgets.mjs).
// Además comprueba que la página real (con la CSP de producción) arranca sin avisos y mide el primer fotograma con CPU ×4.
//   node tests/browser/size-real.mjs               → el proyecto tal cual (la puerta de T2: ASCII_FIRST_JS_GZ_KB, por defecto 22,5 desde el estilo Duotono (WP6c))
//   node tests/browser/size-real.mjs --art-chunk   → además, la propuesta de trozo único para astro.config.mjs (ver real-build.mjs)
// La segunda medida sale siempre como INFORMACIÓN (no es un cambio hecho en el proyecto: astro.config.mjs es de WP1).
import { check, finish, info, launchBrowser, open, ready, sleep } from './lib.mjs';
import { buildReal, serveDir } from './real-build.mjs';

const GATE = Number(process.env.ASCII_FIRST_JS_GZ_KB ?? 22.5);
const browser = await launchBrowser();

/** Construye, sirve y mide. Devuelve los KB de primera carga por idioma. */
async function measure(artChunk, gated) {
  const b = buildReal({ artChunk });
  const srv = await serveDir(b.dist);
  const out = {};
  for (const [lang, path] of [['es', '/'], ['en', '/en/']]) {
    const s = await open({ browser, base: srv.base, path, w: 1440, h: 900, cpu: 4 });
    await ready(s.page, { timeout: 40000 });
    await sleep(600);
    const ff = await s.page.evaluate(() => window.__field?.firstFrameAt ?? 0);
    const res = await s.page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\.js$/.test(e.name)).map((e) => ({ n: new URL(e.name).pathname.slice(1), t: e.responseEnd })));
    const nav = await s.page.evaluate(() => performance.getEntriesByType('navigation')[0].loadEventEnd);
    const first = res.filter((e) => e.t <= ff);
    const later = res.filter((e) => e.t > ff);
    let gz = 0;
    for (const e of first) {
      const z = b.files[e.n];
      gz += z?.gz9 ?? 0;
      if (lang === 'es') info(`${artChunk ? '[trozo único] ' : ''}${e.n.padEnd(52)} ${String(z?.bytes).padStart(6)} B  ${String(z?.gz9).padStart(5)} B gz-9`);
    }
    out[lang] = gz;
    const what = `[${lang}${artChunk ? ', con trozo único' : ''}]`;
    const st = await s.page.evaluate(() => ({ field: document.documentElement.dataset.field, renderer: window.__field?.renderer }));
    const detail = `${(gz / 1024).toFixed(2)} KB gz-9 en ${first.length} archivos · pedidos después del primer fotograma: ${later.map((e) => e.n.split('/').pop()).join(', ') || 'ninguno'}`;
    if (gated) check(`${what} JS de primera carga del arte ≤ ${GATE} KB gz (build real)`, gz <= GATE * 1024, detail);
    else info(`${what} JS de primera carga del arte: ${detail}`);
    check(`${what} la página real monta el motor (${st.field}/${st.renderer}), sin avisos ni peticiones externas`, st.field === 'live' && st.renderer === 'gl' && s.logs.length === 0 && s.external.length === 0, s.logs.join(' | ') + s.external.join(' '));
    check(`${what} primer fotograma < 600 ms tras load con CPU ×4`, ff - nav < 600, `${(ff - nav).toFixed(0)} ms`);
    await s.close();
  }
  const perLang = (l) => Object.entries(b.files).filter(([f]) => !new RegExp(`words\\.gen\\.${l === 'es' ? 'en' : 'es'}\\.`).test(f)).reduce((a, [, z]) => a + z.gz9, 0);
  for (const l of ['es', 'en']) check(`[${l}${artChunk ? ', con trozo único' : ''}] JS total del arte (todas las escenas registradas) ≤ 40 KB gz`, perLang(l) <= 40 * 1024, `${(perLang(l) / 1024).toFixed(2)} KB gz-9`);
  await srv.close();
  return out;
}

const plain = await measure(false, true);
const merged = await measure(true, false);
info(`resumen (es): proyecto tal cual ${(plain.es / 1024).toFixed(2)} KB · con el trozo único propuesto para astro.config.mjs ${(merged.es / 1024).toFixed(2)} KB · puerta ${GATE} KB`);
await browser.close();
finish('T2 · tamaño del JS del arte (build real)');
