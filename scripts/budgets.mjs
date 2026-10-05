#!/usr/bin/env node
// Presupuestos de peso (gzip). Falla si algo se pasa. Todo se MIDE sobre lo construido (dist/ y public/ref), no se estima.
//  - Cada referencia (public/ref/<slug>): HTML+CSS+JS <= 60 KB gzip; primera vista <= 350 KB; imagen principal <= 120 KB
//  - Las dos portadas (dist/index.html y dist/en/index.html), DIRECTION §11.1 y T2 de §13:
//      htmlGz          HTML <= 34 KB gz
//      cssGz           CSS <= 10 KB gz (hojas enlazadas + <style> en línea, una a una, como las sirve GitHub Pages)
//      fontsBytes      fuentes que pide el CSS de la página <= 72 KB
//      asciiFirstJsGz  JS de primera carga = lo que el navegador pide antes del primer fotograma del arte <= 22,5 KB gz
//      asciiJsGz       JS total del arte (todas las escenas y las palabras del idioma de la página) <= 40 KB gz
//      homeJsGz        JS total que puede pedir la página (arte + menú + el resto) <= 60 KB gz (techo del sitio)
//      firstLoadBytes  transferencia de la primera carga (HTML + hojas + JS de primera carga + fuentes) <= 140 KB
// Cómo se mide el JS (no hay mapa de dependencias aparte: se lee el código construido):
//   · parte de los <script type="module" src> y <link rel="modulepreload"> del HTML;
//   · sigue los `import … from "./x.js"` estáticos (siempre cargan) y los `import("./x.js")` dinámicos (solo cuentan en el total);
//   · primera carga = cierre estático de las entradas + los dinámicos que el arranque pide ANTES del primer fotograma: el motor
//     (`engine`) y la palabra de la portada (`words.gen.<idioma>.GAYA`). Lo demás (escenas, marea, render 2D, el resto de palabras)
//     se pide después. `scripts/ascii-perf.mjs` contrasta esta cifra con la transferencia real del navegador (CDP) y avisa si difieren;
//   · la palabra de otro idioma nunca cuenta: una página solo trae las suyas.
// El valor 22,5 KB de asciiFirstJsGz sustituye al 18,5 KB de DIRECTION §11.1: WP5 midió 21,4 KB con el motor, el kit, los glifos y
// GAYA en el build real, y 22,5 KB deja la holgura mínima para la variante de caracteres visibles (decisión de dirección, 2026-10-01).
// Uso: node scripts/budgets.mjs [--ref slug] [--site] [--dir dist] [--verbose]
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
export const BUDGET = {
  refCodeGz: 60 * KB,
  refFirstViewBytes: 350 * KB,
  refHeroImageBytes: 120 * KB,
  homeJsGz: 60 * KB,
  htmlGz: 34 * KB,
  cssGz: 10 * KB,
  fontsBytes: 72 * KB,
  firstLoadBytes: 140 * KB,
  asciiFirstJsGz: 22.5 * KB,
  asciiJsGz: 40 * KB,
};
/** Páginas con arte (las dos portadas). */
export const HOME_PAGES = ['index.html', 'en/index.html'];

const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n, d = 1) => (n / KB).toFixed(d) + ' KB';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** Peso de una referencia. Devuelve { code, codeGz, heroImage, problems[] }. */
export function measureRef(slug) {
  const dir = join(ROOT, 'public', 'ref', slug);
  const files = walk(dir);
  const problems = [];
  let codeGz = 0;
  let code = 0;
  let imagesTotal = 0;
  let heroImage = 0;
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    const buf = readFileSync(f);
    if (['.html', '.css', '.js'].includes(ext)) {
      code += buf.length;
      codeGz += gz(buf);
    } else if (['.avif', '.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
      imagesTotal += buf.length;
      // El presupuesto de la imagen principal se mide sobre el AVIF más ancho (el WebP es solo respaldo)
      if (/hero/i.test(f) && ext === '.avif') heroImage = Math.max(heroImage, buf.length);
    }
  }
  if (codeGz > BUDGET.refCodeGz) problems.push(`HTML+CSS+JS ${kb(codeGz)} gzip > ${kb(BUDGET.refCodeGz)}`);
  if (heroImage > BUDGET.refHeroImageBytes) problems.push(`imagen hero ${kb(heroImage)} > ${kb(BUDGET.refHeroImageBytes)}`);
  return { slug, code, codeGz, imagesTotal, heroImage, problems };
}

// ── Grafo de JS de una página construida ─────────────────────────────────────────────────────────────────────────────
// (el empaquetador de producción escribe los dinámicos con plantillas `…`, así que se aceptan las tres comillas)
const STATIC_IMPORT = /(?:\bimport|\bexport)\s*(?:[^"'`()]*?\bfrom\s*)?["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]\s*\)/g;
/** Dinámicos que el arranque pide antes del primer fotograma (ver la cabecera): el motor y la palabra de la portada. */
const FIRST_LOAD_DYNAMIC = [/^engine\./, /^words\.gen\.(?:es|en)\.GAYA\./];
const isOtherLang = (file, lang) => {
  const m = /words\.gen\.(es|en)\./.exec(basename(file));
  return m !== null && m[1] !== lang;
};

/** Lee un .js construido y devuelve sus importaciones estáticas y dinámicas (rutas absolutas de archivo). */
function importsOf(file, cache) {
  if (cache.has(file)) return cache.get(file);
  const src = readFileSync(file, 'utf8');
  const at = (spec) => resolve(dirname(file), spec);
  const stat = new Set();
  const dyn = new Set();
  for (const m of src.matchAll(STATIC_IMPORT)) stat.add(at(m[1]));
  for (const m of src.matchAll(DYNAMIC_IMPORT)) dyn.add(at(m[1]));
  const r = { stat: [...stat].filter(existsSync), dyn: [...dyn].filter(existsSync), bytes: gz(Buffer.from(src)) };
  cache.set(file, r);
  return r;
}

/** Cierre de importaciones desde `entries`. `dynamic`: sigue los dinámicos (todos, o los que acepte la función). */
function closure(entries, cache, { dynamic = false, skip = () => false } = {}) {
  const seen = new Set();
  const todo = [...entries];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || skip(f)) continue;
    seen.add(f);
    const g = importsOf(f, cache);
    todo.push(...g.stat);
    if (dynamic) for (const d of g.dyn) if (dynamic === true || dynamic(d)) todo.push(d);
  }
  return seen;
}

/** Mide una página construida de dist/. `page`: ruta relativa del HTML (index.html, en/index.html). */
export function measurePage(distDir = join(ROOT, 'dist'), page = 'index.html') {
  const lang = page.startsWith('en/') ? 'en' : 'es';
  const html = readFileSync(join(distDir, page), 'utf8');
  const local = (u) => join(distDir, u.split(/[?#]/)[0].replace(/^\//, ''));
  const htmlGz = gz(Buffer.from(html));

  // hojas de estilo: enlazadas (cada una con su gzip) y en línea
  const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => /href="([^"]+)"/.exec(m[0])?.[1]).filter(Boolean);
  let cssLinkedGz = 0;
  const cssParts = [];
  let cssText = '';
  for (const href of sheets) {
    const p = local(href);
    if (!existsSync(p)) continue;
    const buf = readFileSync(p);
    cssLinkedGz += gz(buf);
    cssParts.push(`${basename(p)} ${kb(gz(buf), 2)}`);
    cssText += buf.toString('utf8');
  }
  let cssInlineGz = 0;
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    cssInlineGz += gz(Buffer.from(m[1]));
    cssText += m[1];
  }
  const cssGz = cssLinkedGz + cssInlineGz;

  // fuentes: las .woff2 que nombra el CSS de la página (sin repetir), en bytes (ya vienen comprimidas)
  const fonts = new Map();
  for (const m of cssText.matchAll(/url\(\s*["']?([^"')\s]+\.woff2)["']?\s*\)/g)) {
    const p = local(m[1]);
    if (existsSync(p)) fonts.set(basename(p), statSync(p).size);
  }
  const fontsBytes = [...fonts.values()].reduce((a, n) => a + n, 0);

  // JS
  const cache = new Map();
  const entries = new Set();
  for (const m of html.matchAll(/<script[^>]+\bsrc="([^"]+\.js)"[^>]*>/g)) entries.add(local(m[1]));
  for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]*>/g)) {
    const h = /href="([^"]+)"/.exec(m[0])?.[1];
    if (h) entries.add(local(h));
  }
  const entryList = [...entries].filter(existsSync);
  const skip = (f) => isOtherLang(f, lang);
  const sum = (set) => [...set].reduce((a, f) => a + importsOf(f, cache).bytes, 0);
  const firstDyn = (f) => FIRST_LOAD_DYNAMIC.some((re) => re.test(basename(f)));
  const firstSet = closure(entryList, cache, { dynamic: firstDyn, skip });
  const totalSet = closure(entryList, cache, { dynamic: true, skip });
  const artEntries = entryList.filter((f) => /^Field\./.test(basename(f)));
  const artSet = closure(artEntries, cache, { dynamic: true, skip });
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].reduce((a, m) => a + gz(Buffer.from(m[1])), 0);
  const asciiFirstJsGz = sum(new Set([...firstSet].filter((f) => artSet.has(f) || artEntries.length === 0)));
  const firstJsGz = sum(firstSet) + inline;
  const asciiJsGz = sum(artSet);
  const homeJsGz = sum(totalSet) + inline;
  const firstLoadBytes = htmlGz + cssLinkedGz + firstJsGz + fontsBytes;

  const m = { page, lang, htmlGz, cssGz, cssLinkedGz, cssInlineGz, fontsBytes, fonts: [...fonts.entries()], asciiFirstJsGz, firstJsGz, asciiJsGz, homeJsGz, firstLoadBytes, inline };
  m.files = {
    first: [...firstSet].map((f) => `${basename(f)} ${kb(importsOf(f, cache).bytes, 2)}`).sort(),
    art: [...artSet].map((f) => `${basename(f)} ${kb(importsOf(f, cache).bytes, 2)}`).sort(),
    css: cssParts,
  };
  const rows = [
    ['htmlGz', htmlGz],
    ['cssGz', cssGz],
    ['fontsBytes', fontsBytes],
    ['asciiFirstJsGz', asciiFirstJsGz],
    ['asciiJsGz', asciiJsGz],
    ['homeJsGz', homeJsGz],
    ['firstLoadBytes', firstLoadBytes],
  ];
  m.rows = rows.map(([key, value]) => ({ key, value, limit: BUDGET[key], ok: value <= BUDGET[key] }));
  m.problems = m.rows.filter((r) => !r.ok).map((r) => `${r.key} ${kb(r.value, 2)} > ${kb(r.limit, 1)}`);
  if (!firstSet.size) m.problems.push('no encuentro ningún <script type="module"> en el HTML (¿dist/ vacío?)');
  return m;
}

/** Compatibilidad: JS de una página (cierre completo) con la forma que devolvía la versión anterior. */
export function measureHome(distDir = join(ROOT, 'dist'), page = 'index.html') {
  const m = measurePage(distDir, page);
  const problems = m.homeJsGz > BUDGET.homeJsGz ? [`JS ${kb(m.homeJsGz)} gzip > ${kb(BUDGET.homeJsGz)}`] : [];
  return { page, jsGz: m.homeJsGz, parts: m.files.first, inline: m.inline, problems };
}

/** Mide las dos portadas. Devuelve { pages, problems }. */
export function measureSite(distDir = join(ROOT, 'dist')) {
  const pages = HOME_PAGES.filter((p) => existsSync(join(distDir, p))).map((p) => measurePage(distDir, p));
  return { pages, problems: pages.flatMap((p) => p.problems.map((x) => `${p.page}: ${x}`)) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const arg = (n) => {
    const i = process.argv.indexOf(`--${n}`);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  const only = arg('ref') ?? null;
  const siteOnly = process.argv.includes('--site');
  const verbose = process.argv.includes('--verbose');
  const dist = resolve(ROOT, arg('dir') ?? 'dist');
  const refRoot = join(ROOT, 'public', 'ref');
  let bad = 0;
  if (!siteOnly) {
    const slugs = only ? [only] : existsSync(refRoot) ? readdirSync(refRoot).filter((s) => statSync(join(refRoot, s)).isDirectory()) : [];
    for (const slug of slugs) {
      const r = measureRef(slug);
      console.log(`${r.problems.length ? 'FALLA' : 'ok   '}  ref/${slug.padEnd(12)} código ${kb(r.codeGz).padStart(9)} gz · imágenes ${kb(r.imagesTotal).padStart(10)}${r.problems.length ? ' · ' + r.problems.join('; ') : ''}`);
      bad += r.problems.length ? 1 : 0;
    }
  }
  if (!only) {
    if (!existsSync(join(dist, 'index.html'))) {
      console.log(`FALLA  no hay ${dist}${sep}index.html: ejecuta «npm run build» antes de medir las portadas`);
      bad++;
    } else {
      const { pages } = measureSite(dist);
      for (const p of pages) {
        console.log(`\n${p.page}  (${p.lang})`);
        for (const r of p.rows) console.log(`  ${r.ok ? 'ok   ' : 'FALLA'}  ${r.key.padEnd(15)} ${kb(r.value, 2).padStart(10)}  (≤ ${kb(r.limit, 1)})`);
        if (verbose) {
          console.log(`  hojas: ${p.files.css.join(' · ')}`);
          console.log(`  fuentes: ${p.fonts.map(([n, b]) => `${n} ${kb(b, 1)}`).join(' · ')}`);
          console.log(`  JS de primera carga (${p.files.first.length}): ${p.files.first.join(' · ')}`);
          console.log(`  JS del arte (${p.files.art.length}): ${p.files.art.join(' · ')}`);
        }
        if (p.problems.length) bad++;
      }
    }
  }
  process.exit(bad ? 1 : 0);
}
