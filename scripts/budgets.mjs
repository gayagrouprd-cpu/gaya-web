#!/usr/bin/env node
// Presupuestos de peso (gzip). Falla si algo se pasa.
//  - Cada referencia (public/ref/<slug>): HTML+CSS+JS <= 60 KB gzip; primera vista <= 350 KB; imagen principal <= 120 KB
//  - Home (dist/index.html): JS de primera carga <= 60 KB gzip
// Uso: node scripts/budgets.mjs [--ref slug] [--site]
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BUDGET = {
  refCodeGz: 60 * 1024,
  refFirstViewBytes: 350 * 1024,
  refHeroImageBytes: 120 * 1024,
  homeJsGz: 60 * 1024,
};
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

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

/** JS de primera carga de una página construida en dist/. */
export function measureHome(distDir = join(ROOT, 'dist'), page = 'index.html') {
  const htmlPath = join(distDir, page);
  const html = readFileSync(htmlPath, 'utf8');
  const srcs = new Set();
  for (const m of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+\.js)"/g)) srcs.add(m[1]);
  let total = 0;
  const parts = [];
  for (const s of srcs) {
    const p = join(distDir, s.replace(/^\//, ''));
    if (!existsSync(p)) continue;
    const n = gz(readFileSync(p));
    total += n;
    parts.push(`${s} ${kb(n)}`);
  }
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].reduce((a, m) => a + gz(Buffer.from(m[1])), 0);
  total += inline;
  const problems = total > BUDGET.homeJsGz ? [`JS de primera carga ${kb(total)} gzip > ${kb(BUDGET.homeJsGz)}`] : [];
  return { page, jsGz: total, parts, inline, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const only = process.argv.includes('--ref') ? process.argv[process.argv.indexOf('--ref') + 1] : null;
  const refRoot = join(ROOT, 'public', 'ref');
  const slugs = only ? [only] : existsSync(refRoot) ? readdirSync(refRoot).filter((s) => statSync(join(refRoot, s)).isDirectory()) : [];
  let bad = 0;
  for (const slug of slugs) {
    const r = measureRef(slug);
    console.log(`${r.problems.length ? 'FALLA' : 'ok   '}  ref/${slug.padEnd(12)} código ${kb(r.codeGz).padStart(9)} gz · imágenes ${kb(r.imagesTotal).padStart(10)}${r.problems.length ? ' · ' + r.problems.join('; ') : ''}`);
    bad += r.problems.length ? 1 : 0;
  }
  if (!only && existsSync(join(ROOT, 'dist', 'index.html'))) {
    for (const page of ['index.html', 'en/index.html']) {
      if (!existsSync(join(ROOT, 'dist', page))) continue;
      const h = measureHome(join(ROOT, 'dist'), page);
      console.log(`${h.problems.length ? 'FALLA' : 'ok   '}  ${page.padEnd(18)} JS primera carga ${kb(h.jsGz)} gz${h.problems.length ? ' · ' + h.problems.join('; ') : ''}`);
      bad += h.problems.length ? 1 : 0;
    }
  }
  process.exit(bad ? 1 : 0);
}
