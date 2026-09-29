#!/usr/bin/env node
// Puerta de calidad de una referencia (public/ref/<slug>). Ver CONTRACT.md.
//   1 contrato estático   2 red + consola   3 desborde/hero/CTA   4 objetivos táctiles
//   5 axe (accesibilidad) 6 capturas        7 presupuestos        8 Lighthouse móvil (mediana de 3)
//   9 detector de patrones de impeccable
// Uso: node scripts/ref-check.mjs <slug> [--fast] [--only lint,guard,layout,touch,axe,shots,budget,lh,detect]
//   --fast   omite Lighthouse.   Informe y capturas en reports/ref/<slug>/
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { AxeBuilder } from '@axe-core/playwright';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal, scrollThrough } from './lib/browser.mjs';
import { measureRef } from './budgets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || slug.startsWith('--')) {
  console.error('Uso: node scripts/ref-check.mjs <slug> [--fast] [--only lint,guard,...]');
  process.exit(1);
}
const dir = join(ROOT, 'public', 'ref', slug);
if (!existsSync(join(dir, 'index.html'))) {
  console.error(`No existe public/ref/${slug}/index.html`);
  process.exit(1);
}
const flag = (n) => process.argv.includes(`--${n}`);
const onlyArg = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const want = (g) => (onlyArg ? onlyArg.includes(g) : g === 'lh' ? !flag('fast') : true);

const refMeta = JSON.parse(readFileSync(join(ROOT, 'src/data/references.json'), 'utf8')).refs.find((r) => r.slug === slug);
const langs = refMeta?.langs ?? ['es'];
const reportDir = join(ROOT, 'reports', 'ref', slug);
mkdirSync(reportDir, { recursive: true });

const errors = [];
const warnings = [];
const notes = [];
const err = (gate, msg) => errors.push({ gate, msg });
const warn = (gate, msg) => warnings.push({ gate, msg });

function walk(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
}
const files = walk(dir);
const read = (f) => readFileSync(f, 'utf8');
const html = read(join(dir, 'index.html'));
const cssFiles = files.filter((f) => extname(f) === '.css');
const jsFiles = files.filter((f) => extname(f) === '.js');
const css = cssFiles.map(read).join('\n') + [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const js = jsFiles.map(read).join('\n') + [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
const all = html + '\n' + css + '\n' + js;

// ───────────────────────── 1. Contrato estático ─────────────────────────
if (want('lint')) {
  const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '';
  const firstTags = [...head.matchAll(/<(meta|link|script|style|title)\b[^>]*>/gi)].map((m) => m[0]);
  const cspIdx = firstTags.findIndex((t) => /http-equiv=["']Content-Security-Policy["']/i.test(t));
  const firstResource = firstTags.findIndex((t) => /^<(link|script|style)/i.test(t));
  if (cspIdx < 0) err('lint', 'Falta <meta http-equiv="Content-Security-Policy"> con default-src \'self\'');
  else {
    if (firstResource > -1 && firstResource < cspIdx) err('lint', 'La meta CSP debe ir antes de cualquier <link>, <script> o <style>');
    if (!/default-src\s+'self'/.test(firstTags[cspIdx])) err('lint', "La CSP debe incluir default-src 'self'");
  }
  if (!/<html[^>]*\blang=["'](es|en)["']/i.test(html)) err('lint', '<html lang="es|en"> ausente');
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) err('lint', 'Falta meta viewport');
  if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) err('lint', 'Falta <meta name="robots" content="noindex, nofollow">');
  if (!/<title>[^<]+<\/title>/i.test(html)) err('lint', 'Falta <title>');
  const h1 = (html.match(/<h1\b/gi) ?? []).length;
  if (h1 !== 1 && !/<h1\b/.test(js)) err('lint', `Debe haber un único <h1> (hay ${h1})`);
  const allowedUrls = /^(https?:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink|XML\/1998\/namespace))/;
  for (const m of all.matchAll(/https?:\/\/[^\s"'`)<>]+/g)) if (!allowedUrls.test(m[0])) err('lint', `URL externa en el código: ${m[0]}`);
  for (const m of all.matchAll(/(wa\.me|api\.whatsapp\.com|href=["'](?:tel|mailto):|window\.open)/gi)) err('lint', `Acción real a datos ficticios: ${m[0]}`);
  if (!/prefers-reduced-motion/.test(css + js)) err('lint', 'Sin alternativa para prefers-reduced-motion');
  if (!/ref-shared\/frame\.js/.test(html)) err('lint', 'Falta <script src="../../ref-shared/frame.js"></script> (idioma, ?still, sello «ejemplo», marco seguro)');
  const declaredLangs = /<html[^>]*\bdata-langs=["']([^"']+)["']/i.exec(html)?.[1]?.split(',').map((s) => s.trim());
  if (!declaredLangs) err('lint', 'Falta <html data-langs="es"> (o "es,en") con los idiomas que soporta');
  else if (declaredLangs.slice().sort().join() !== langs.slice().sort().join()) err('lint', `data-langs="${declaredLangs.join(',')}" no coincide con references.json (${langs.join(',')})`);
  if (!/<link[^>]+rel=["']icon["']/i.test(html)) warn('lint', 'Añade <link rel="icon" href="data:,"> para evitar la petición de /favicon.ico');
  if (!/\bstill\b|GAYA/.test(js + css)) err('lint', 'No respeta el modo ?still: consulta window.GAYA.still / html[data-still] en tus animaciones por JS');
  if (!/data-cta/.test(html + js)) warn('lint', 'Marca el CTA principal con data-cta="primary" para verificar que cabe en 1280×800');
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0];
    if (!/\balt=/.test(t)) err('lint', `<img> sin alt: ${t.slice(0, 80)}`);
    if (!/\bwidth=/.test(t) || !/\bheight=/.test(t)) warn('lint', `<img> sin width/height (riesgo de CLS): ${t.slice(0, 80)}`);
  }
  const faceFamilies = new Set([...css.matchAll(/@font-face\s*{[^}]*font-family:\s*['"]?([^;'"}]+)/g)].map((m) => m[1].trim()));
  const linkedFonts = [...html.matchAll(/ref-shared\/fonts\/([\w-]+)\.css/g)].map((m) => m[1]);
  if (faceFamilies.size + linkedFonts.length > 3) err('lint', `Más de 3 familias tipográficas (${[...faceFamilies, ...linkedFonts].join(', ')})`);
  for (const m of html.matchAll(/(?:href|src)=["'](\.\.\/\.\.\/ref-shared\/[^"']+)["']/g)) {
    if (!existsSync(join(dir, m[1]).replace(/\\/g, '/'))) err('lint', `Recurso compartido inexistente: ${m[1]}`);
  }
  if (/background-clip:\s*text/.test(css) && /gradient/.test(css)) err('lint', 'Texto con degradado (background-clip:text + gradient)');
  if (/#000(?:000)?\b|#fff(?:fff)?\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|:\s*(?:black|white)\b/i.test(css)) err('lint', 'Negro o blanco puros: usa neutros con matiz (OKLCH)');
  if (/letter-spacing:\s*-0?\.(0[5-9]|[1-9])\d*em/.test(css)) err('lint', 'letter-spacing por debajo de -0.04em');
  if (/(h1|h2|h3)[^{]*{[^}]*font-style:\s*italic/i.test(css)) err('lint', 'Cursivas en titulares');
  for (const m of css.matchAll(/clamp\([^;]*?,\s*([\d.]+)rem\s*\)/g)) if (parseFloat(m[1]) > 6) warn('lint', `Tamaño de titular de ${m[1]}rem (tope 6rem; justifícalo en la ficha DNA)`);
  if (/font-size:\s*(\d+(?:\.\d+)?)rem/.test(css)) for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)rem/g)) if (parseFloat(m[1]) > 6) warn('lint', `font-size de ${m[1]}rem`);
  if (!/overflow-x:\s*clip/.test(css)) warn('lint', 'Falta overflow-x: clip en html y body');
  if (!/\.skip|skip-link|#contenido|#main/.test(html)) warn('lint', 'No se ve un enlace «saltar al contenido»');
  notes.push(`lint: ${files.length} archivos, ${cssFiles.length} css, ${jsFiles.length} js`);
}

// ───────────────────────── Navegador ─────────────────────────
const needBrowser = ['guard', 'layout', 'touch', 'axe', 'shots'].some(want);
let server;
let base;
let browser;
if (needBrowser || want('lh')) {
  server = createPagesServer({ dir: join(ROOT, 'public') });
  base = `http://127.0.0.1:${await listen(server, 0)}`;
}
const url = (q = '?still') => `${base}/ref/${slug}/${q}`;

if (needBrowser) {
  browser = await launchBrowser();
  const baseOrigin = new URL(base).origin;

  const newPage = async (ctxOptions = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', ...ctxOptions });
    const page = await ctx.newPage();
    const external = new Set();
    const problems = [];
    await page.route('**/*', (r) => (isExternal(r.request().url(), baseOrigin) ? r.abort() : r.continue()));
    page.on('request', (r) => isExternal(r.url(), baseOrigin) && external.add(r.url()));
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`consola ${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => problems.push(`excepción: ${e.message}`));
    page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
    page.on('requestfailed', (r) => !isExternal(r.url(), baseOrigin) && problems.push(`petición fallida: ${r.url()}`));
    return { ctx, page, external, problems };
  };
  const load = async (page, q) => {
    await page.goto(url(q), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await scrollThrough(page);
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(250);
  };

  // ── 2. Red + consola (con y sin ?still, y en cada idioma)
  if (want('guard')) {
    const variants = ['?still', '', ...langs.map((l) => `?lang=${l}&still`)];
    for (const q of [...new Set(variants)]) {
      const { ctx, page, external, problems } = await newPage();
      await load(page, q);
      for (const u of external) err('guard', `PETICIÓN EXTERNA (${q || 'sin parámetros'}): ${u}`);
      for (const p of problems) err('guard', `${p} (${q || 'sin parámetros'})`);
      if (q.includes('lang=en') && langs.includes('en')) {
        const l = await page.evaluate(() => document.documentElement.lang);
        if (l !== 'en') err('guard', `?lang=en no cambia <html lang> (es "${l}")`);
      }
      await ctx.close();
    }
    // Las referencias con inglés deben cambiar de verdad el texto visible
    if (langs.includes('en') && langs.includes('es')) {
      const texts = {};
      for (const l of ['es', 'en']) {
        const { ctx, page } = await newPage();
        await load(page, `?lang=${l}&still`);
        texts[l] = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
        await ctx.close();
      }
      if (texts.es === texts.en) err('guard', 'El texto visible es idéntico en ?lang=es y ?lang=en: falta la traducción');
      else {
        const wordsEs = new Set(texts.es.toLowerCase().split(' '));
        const shared = texts.en.toLowerCase().split(' ').filter((w) => w.length > 3 && wordsEs.has(w)).length;
        const total = texts.en.split(' ').filter((w) => w.length > 3).length || 1;
        if (shared / total > 0.55) warn('guard', `La versión en inglés comparte ${(100 * shared / total).toFixed(0)}% de sus palabras con el español: ¿traducción completa?`);
      }
    }
  }

  // ── 3. Desborde, hero y CTA
  if (want('layout')) {
    for (const width of [320, 375, 414, 768, 1024, 1440]) {
      const { ctx, page } = await newPage({ viewport: { width, height: 900 } });
      await load(page, '?still');
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const offenders = [];
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && (b.right > innerWidth + 1 || b.left < -1)) {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
            offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} (${Math.round(b.left)}→${Math.round(b.right)})`);
          }
          if (offenders.length > 4) break;
        }
        return { scrollW: de.scrollWidth, bodyW: document.body.scrollWidth, inner: innerWidth, offenders };
      });
      if (r.scrollW > r.inner + 1 || r.bodyW > r.inner + 1) err('layout', `Scroll horizontal a ${width}px (scrollWidth ${r.scrollW} > ${r.inner}). Elementos: ${r.offenders.join(', ') || '—'}`);
      await ctx.close();
    }
    const { ctx, page } = await newPage({ viewport: { width: 1280, height: 800 } });
    await load(page, '?still');
    await page.evaluate(() => window.scrollTo(0, 0));
    const hero = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const cta = document.querySelector('[data-cta="primary"]');
      const inView = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth && b.width > 0;
      };
      return { h1: inView(h1), cta: inView(cta), hasCta: !!cta };
    });
    if (hero.h1 === false) err('layout', 'El <h1> no cabe completo en la primera vista de 1280×800');
    if (hero.hasCta && hero.cta === false) err('layout', 'El CTA principal no cabe en la primera vista de 1280×800');
    await ctx.close();
  }

  // ── 4. Objetivos táctiles (puntero grueso, 390 px)
  if (want('touch')) {
    const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await load(page, '?still');
    const small = await page.evaluate(() => {
      const out = [];
      const sel = 'button, input:not([type=hidden]), select, textarea, summary, [role="button"], [role="tab"], [role="radio"], [role="checkbox"], a[href]';
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('[aria-hidden="true"]') || el.classList.contains('skip')) continue;
        const inline = el.tagName === 'A' && (el.closest('p, li, dd, figcaption') && cs.display === 'inline');
        if (inline) continue; // WCAG 2.5.8 exceptúa enlaces en línea dentro de texto
        if (b.width < 44 || b.height < 44) out.push(`${el.tagName.toLowerCase()} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}» ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
      return out;
    });
    for (const s of small.slice(0, 8)) err('touch', `Objetivo táctil < 44 px: ${s}`);
    if (small.length > 8) err('touch', `… y ${small.length - 8} objetivos táctiles pequeños más`);
    await ctx.close();
  }

  // ── 5. axe (claro, movimiento reducido, móvil)
  if (want('axe')) {
    const runs = [
      { name: 'escritorio', opts: { viewport: { width: 1280, height: 800 } } },
      { name: 'móvil', opts: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
      { name: 'movimiento reducido', opts: { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' } },
    ];
    for (const run of runs) {
      const { ctx, page } = await newPage(run.opts);
      await load(page, '?still');
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      for (const v of res.violations) {
        const line = `axe [${v.impact}] ${v.id} (${run.name}): ${v.help} — ${v.nodes.length} nodo(s), p. ej. ${v.nodes[0]?.target?.join(' ')}`;
        if (['critical', 'serious'].includes(v.impact)) err('axe', line);
        else warn('axe', line);
      }
      await ctx.close();
    }
  }

  // ── 6. Capturas para la revisión visual
  if (want('shots')) {
    for (const width of [320, 375, 414, 768, 1024, 1440]) {
      const { ctx, page } = await newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      await load(page, '?still');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: join(reportDir, `w${width}.png`) });
      if ([375, 1440].includes(width)) await page.screenshot({ path: join(reportDir, `full-w${width}.png`), fullPage: true });
      await ctx.close();
    }
    const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await load(page, '');
    await page.screenshot({ path: join(reportDir, 'reduced-motion-1440.png') });
    await ctx.close();
    notes.push(`capturas en reports/ref/${slug}/`);
  }
  await browser.close();
}

// ───────────────────────── 7. Presupuestos ─────────────────────────
if (want('budget')) {
  const m = measureRef(slug);
  for (const p of m.problems) err('budget', p);
  notes.push(`peso: código ${(m.codeGz / 1024).toFixed(1)} KB gzip · imágenes ${(m.imagesTotal / 1024).toFixed(0)} KB`);
}

// ───────────────────────── 8. Lighthouse móvil ─────────────────────────
if (want('lh')) {
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
    try {
      const r = await lighthouse(url(''), { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
      runs.push(Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)])));
      if (i === 0) writeFileSync(join(reportDir, 'lighthouse.json'), JSON.stringify(r.lhr, null, 1));
    } finally {
      // En Windows chrome-launcher no siempre puede borrar el perfil temporal (EPERM); la medición ya terminó.
      try {
        await chrome.kill();
      } catch {
        /* perfil temporal en uso: se ignora */
      }
    }
  }
  const median = (k) => runs.map((r) => r[k]).sort((a, b) => a - b)[1];
  const scores = { performance: median('performance'), accessibility: median('accessibility'), 'best-practices': median('best-practices'), seo: median('seo') };
  notes.push(`Lighthouse móvil (mediana de 3): rendimiento ${scores.performance} · accesibilidad ${scores.accessibility} · buenas prácticas ${scores['best-practices']} · SEO ${scores.seo} (noindex: no aplica)`);
  if (scores.performance < 90) err('lh', `Rendimiento ${scores.performance} < 90`);
  if (scores.accessibility < 95) err('lh', `Accesibilidad ${scores.accessibility} < 95`);
  if (scores['best-practices'] < 95) err('lh', `Buenas prácticas ${scores['best-practices']} < 95`);
}
server?.close();

// ───────────────────────── 9. Detector de impeccable ─────────────────────────
if (want('detect')) {
  const detect = process.env.IMPECCABLE_DETECT ?? join(homedir(), '.claude', 'skills', 'impeccable', 'scripts', 'detect.mjs');
  if (!existsSync(detect)) warn('detect', 'No se encontró detect.mjs de impeccable (define IMPECCABLE_DETECT)');
  else {
    const r = spawnSync(process.execPath, [detect, '--json', '--no-config', dir], { encoding: 'utf8', timeout: 120000 });
    try {
      const findings = JSON.parse(r.stdout || '[]');
      for (const f of findings) err('detect', `[${f.antipattern}] ${f.description ?? ''} ${f.file ? '(' + String(f.file).split(/[\\/]/).pop() + (f.line ? ':' + f.line : '') + ')' : ''} ${String(f.snippet ?? '').slice(0, 80)}`);
      notes.push(`detector de patrones: ${findings.length} hallazgos`);
    } catch {
      warn('detect', `No se pudo leer la salida del detector: ${(r.stdout || r.stderr || '').slice(0, 160)}`);
    }
  }
}

// ───────────────────────── Informe ─────────────────────────
const gates = ['lint', 'guard', 'layout', 'touch', 'axe', 'shots', 'budget', 'lh', 'detect'].filter(want);
console.log(`\nRevisión de «${slug}»  (${gates.join(' · ')})`);
for (const n of notes) console.log(`  · ${n}`);
for (const w of warnings) console.log(`  aviso  [${w.gate}] ${w.msg}`);
for (const e of errors) console.log(`  FALLA  [${e.gate}] ${e.msg}`);
writeFileSync(join(reportDir, 'report.json'), JSON.stringify({ slug, at: new Date().toISOString(), gates, errors, warnings, notes }, null, 2));
console.log(errors.length ? `\n✗ ${errors.length} fallos, ${warnings.length} avisos` : `\n✓ Pasa la puerta (${warnings.length} avisos)`);
process.exit(errors.length ? 1 : 0);
