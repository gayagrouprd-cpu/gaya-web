#!/usr/bin/env node
// T1 de DIRECTION §13: Lighthouse (13.x) sobre las DOS portadas (`/` y `/en/`) en las TRES rutas del arte, en móvil (perfil por defecto de
// Lighthouse: Moto G con 4G lenta y CPU ×4) y en escritorio, con la MEDIANA de 3 corridas por combinación:
//   · WebGL2   la página tal cual, con GPU (se comprueba con Playwright que el motor monta `live/gl`);
//   · ?nogl    el mismo documento con `?nogl`: el motor pinta el fotograma fijo en Canvas 2D (comprueba `still/2d`);
//   · sin JS   el mismo HTML sin <script> ni modulepreload: es lo que ve un navegador con JavaScript apagado. (Un Chrome con
//              `scriptEnabled=false` no sirve: Lighthouse necesita el depurador de la página y falla con «Script execution is
//              prohibited»; por eso un proxy local quita las etiquetas de script del HTML y deja pasar todo lo demás.)
// Umbrales: Rendimiento ≥ 90 · Accesibilidad ≥ 95 · Buenas prácticas ≥ 95 · SEO ≥ 95 · LCP < 2,5 s · CLS 0 (≤ 0,001) · TBT < 200 ms.
// Se sirve dist/ como GitHub Pages (gzip, caché de 600 s). Con `--base https://gaya.com.do` se repite sobre el sitio publicado cuando el
// HTTPS esté emitido (la ruta «sin JS» solo existe en local: no se puede reescribir el HTML ajeno).
// Uso: node scripts/lighthouse-routes.mjs [--dir dist] [--base URL] [--routes webgl2,nogl,nojs] [--langs es,en] [--profiles mobile,desktop]
//        [--runs 3] [--out reports/ascii/wp11/lighthouse.json]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
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
const list = (n, d) => String(arg(n, d)).split(',').filter(Boolean);
const ROUTES = list('routes', 'webgl2,nogl,nojs');
const LANGS = list('langs', 'es,en');
const PROFILES = list('profiles', 'mobile,desktop');
const RUNS = Number(arg('runs', 3));
const out = arg('out', null);

const GATE = { perf: 90, a11y: 95, bp: 95, seo: 95, lcp: 2500, cls: 0.001, tbt: 200 };
const PATHS = { es: '/', en: '/en/' };

// ── Servidores ───────────────────────────────────────────────────────────────────────────────────────────────────────────
let pages = null;
let base = arg('base', null);
const remote = !!base;
if (!base) {
  pages = createPagesServer({ dir: join(ROOT, String(arg('dir', 'dist'))) });
  base = `http://127.0.0.1:${await listen(pages, 0)}`;
}
base = String(base).replace(/\/$/, '');

/** Proxy que sirve lo mismo que `base` pero quita los <script> y los modulepreload del HTML (la página con JavaScript apagado). */
function startNoJsProxy(target) {
  const t = new URL(target);
  const srv = http.createServer((req, res) => {
    const gzipOk = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    const up = http.request({ host: t.hostname, port: t.port, path: req.url, method: req.method, headers: { ...req.headers, 'accept-encoding': 'identity' } }, (r) => {
      const type = String(r.headers['content-type'] ?? '');
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        let body = Buffer.concat(chunks);
        const headers = { ...r.headers };
        delete headers['content-length'];
        if (/text\/html/.test(type)) {
          let html = body.toString('utf8');
          html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (m) => (/application\/ld\+json/.test(m) ? m : ''));
          html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '');
          body = Buffer.from(html);
        }
        if (gzipOk && /text|javascript|json|xml|svg/.test(type)) {
          body = gzipSync(body);
          headers['content-encoding'] = 'gzip';
        }
        headers['content-length'] = String(body.length);
        res.writeHead(r.statusCode ?? 200, headers);
        res.end(body);
      });
    });
    up.on('error', () => {
      res.statusCode = 502;
      res.end();
    });
    req.pipe(up);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ base: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() })));
}
const nojs = !remote && ROUTES.includes('nojs') ? await startNoJsProxy(base) : null;

const GL_FLAGS = ['--ignore-gpu-blocklist', '--use-angle=d3d11'];
const ROUTE = {
  webgl2: { label: 'WebGL2', url: (l) => base + PATHS[l], flags: GL_FLAGS, expect: { field: 'live', renderer: 'gl' } },
  nogl: { label: '?nogl (2D fijo)', url: (l) => `${base}${PATHS[l]}?nogl`, flags: GL_FLAGS, expect: { field: 'still', renderer: '2d' } },
  nojs: { label: 'sin JS', url: (l) => (nojs ? nojs.base : base) + PATHS[l], flags: [], expect: null },
};

// ── Comprobación de que cada ruta es la que dice ser ────────────────────────────────────────────────────────────────────────
const probe = {};
{
  const browser = await launchBrowser({ args: GL_FLAGS });
  for (const r of ROUTES) {
    if (r === 'nojs' && !nojs) continue;
    for (const lang of LANGS) {
      if (r === 'nojs') {
        // sin JavaScript no hay `evaluate` (Chrome tumba la pestaña): se lee el HTML que recibe el navegador
        const html = await (await fetch(ROUTE[r].url(lang))).text();
        probe[`${r}/${lang}`] = { scripts: (html.match(/<script\b(?![^>]*ld\+json)/g) ?? []).length, poster: html.includes('poster-ssr') };
        continue;
      }
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(ROUTE[r].url(lang), { waitUntil: 'load' });
      await page.waitForTimeout(3500);
      probe[`${r}/${lang}`] = await page.evaluate(() => ({ field: document.documentElement.dataset.field ?? null, renderer: window.__field?.renderer ?? null }));
      await ctx.close();
    }
  }
  await browser.close();
}

// ── Lighthouse ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');
const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const DESKTOP = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
  },
};

async function once(url, profile, flags) {
  const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', ...flags] });
  try {
    const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, profile === 'desktop' ? DESKTOP : undefined);
    const a = r.lhr.audits;
    const c = r.lhr.categories;
    return {
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c['best-practices'].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: a['largest-contentful-paint'].numericValue,
      cls: a['cumulative-layout-shift'].numericValue,
      tbt: a['total-blocking-time'].numericValue,
      fcp: a['first-contentful-paint'].numericValue,
      kb: Math.round(a['total-byte-weight'].numericValue / 1024),
      consoleErrors: a['errors-in-console'].details?.items?.length ?? 0,
      warnings: r.lhr.runWarnings,
    };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* EPERM al borrar el perfil temporal en Windows */
    }
  }
}

const rows = [];
const failures = [];
const f1 = (v) => v.toFixed(1);
console.log(`Lighthouse sobre ${remote ? base : 'dist/ servido como GitHub Pages'} · rutas ${ROUTES.join(', ')} · idiomas ${LANGS.join(', ')} · ${RUNS} corridas (mediana)\n`);
for (const r of ROUTES) {
  if (r === 'nojs' && !nojs) {
    console.log('(ruta «sin JS» omitida: solo existe en local)');
    continue;
  }
  for (const lang of LANGS) {
    const p = probe[`${r}/${lang}`];
    const exp = ROUTE[r].expect;
    if (exp) {
      const ok = p?.field === exp.field && p?.renderer === exp.renderer;
      console.log(`${ok ? 'ok   ' : 'FALLA'} ${ROUTE[r].label} ${PATHS[lang]}: el motor monta ${p?.field}/${p?.renderer} (se esperaba ${exp.field}/${exp.renderer})`);
      if (!ok) failures.push(`${ROUTE[r].label} ${PATHS[lang]}: la ruta no es la que dice ser (monta ${p?.field}/${p?.renderer}, se esperaba ${exp.field}/${exp.renderer})`);
    } else {
      const ok = p?.scripts === 0 && p?.poster;
      console.log(`${ok ? 'ok   ' : 'FALLA'} ${ROUTE[r].label} ${PATHS[lang]}: ${p?.scripts} etiquetas de script y póster SSR ${p?.poster ? 'presente' : 'AUSENTE'}`);
      if (!ok) failures.push(`sin JS ${PATHS[lang]}: quedan ${p?.scripts} scripts o falta el póster SSR`);
    }
    for (const profile of PROFILES) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) runs.push(await once(ROUTE[r].url(lang), profile, ROUTE[r].flags));
      const m = Object.fromEntries(['perf', 'a11y', 'bp', 'seo', 'lcp', 'cls', 'tbt', 'fcp', 'kb', 'consoleErrors'].map((k) => [k, med(runs.map((x) => x[k]))]));
      const bad = [];
      if (m.perf < GATE.perf) bad.push(`Rendimiento ${m.perf} < ${GATE.perf}`);
      if (m.a11y < GATE.a11y) bad.push(`Accesibilidad ${m.a11y} < ${GATE.a11y}`);
      if (m.bp < GATE.bp) bad.push(`Buenas prácticas ${m.bp} < ${GATE.bp}`);
      if (m.seo < GATE.seo) bad.push(`SEO ${m.seo} < ${GATE.seo}`);
      if (m.lcp >= GATE.lcp) bad.push(`LCP ${(m.lcp / 1000).toFixed(2)} s ≥ 2,5 s`);
      if (m.cls > GATE.cls) bad.push(`CLS ${m.cls.toFixed(4)} > 0`);
      if (m.tbt >= GATE.tbt) bad.push(`TBT ${Math.round(m.tbt)} ms ≥ 200 ms`);
      const line = `${ROUTE[r].label.padEnd(15)} ${lang} ${profile.padEnd(8)} rend ${m.perf} · a11y ${m.a11y} · BP ${m.bp} · SEO ${m.seo} · LCP ${(m.lcp / 1000).toFixed(2)} s · FCP ${(m.fcp / 1000).toFixed(2)} s · TBT ${Math.round(m.tbt)} ms · CLS ${m.cls.toFixed(3)} · ${m.kb} KB · [${runs.map((x) => x.perf).join(' ')}]`;
      console.log(`${bad.length ? 'FALLA' : 'ok   '} ${line}${bad.length ? '\n        ' + bad.join('; ') : ''}`);
      for (const b of bad) failures.push(`${ROUTE[r].label} ${PATHS[lang]} ${profile}: ${b}`);
      rows.push({ route: r, lang, profile, ...m, runs: runs.map((x) => x.perf), ok: bad.length === 0 });
    }
  }
}
nojs?.close();
pages?.close();
console.log('\nT1 (los umbrales son los de §13; sobre `astro preview`/dist en localhost: el HTTPS de gaya.com.do sigue sin emitir; repetir con --base cuando exista).');
if (out) {
  const file = resolve(ROOT, String(out));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ fecha: new Date().toISOString(), base: remote ? base : 'local', runs: RUNS, rows }, null, 2));
}
console.log(failures.length ? `\n✗ ${failures.length} fallos` : `\n✓ ${rows.length} combinaciones en verde`);
for (const x of failures) console.log(`  FALLA ${x}`);
process.exit(failures.length ? 1 : 0);
