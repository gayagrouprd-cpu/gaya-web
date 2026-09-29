#!/usr/bin/env node
// Revisión de una página del sitio (dist/) servida como GitHub Pages: guardia de red/consola, desborde a varios anchos,
// axe (escritorio, móvil, movimiento reducido) y Lighthouse móvil y escritorio (mediana de 3).
// Uso: node scripts/page-check.mjs [--path /] [--dir dist] [--fast] [--desktop-only]
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, isExternal, scrollThrough } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const path = arg('path', '/');
const dir = join(ROOT, arg('dir', 'dist'));
const fast = process.argv.includes('--fast');

const server = createPagesServer({ dir });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const origin = new URL(base).origin;
const errors = [];
const warnings = [];
const notes = [];

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const open = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', ...opts });
  const page = await ctx.newPage();
  const external = new Set();
  const problems = [];
  await page.route('**/*', (r) => (isExternal(r.request().url(), origin) ? r.abort() : r.continue()));
  page.on('request', (r) => isExternal(r.url(), origin) && external.add(r.url()));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`consola ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`excepción: ${e.message}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3200);
  return { ctx, page, external, problems };
};

// Red + consola
{
  const { ctx, page, external, problems } = await open();
  await scrollThrough(page);
  for (const u of external) errors.push(`PETICIÓN EXTERNA: ${u}`);
  for (const p of problems) errors.push(p);
  await ctx.close();
}

// Desborde horizontal
for (const width of [320, 375, 414, 768, 1024, 1440, 1920]) {
  const { ctx, page } = await open({ viewport: { width, height: 900 } });
  const r = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, b: document.body.scrollWidth, i: innerWidth }));
  if (r.s > r.i + 1 || r.b > r.i + 1) errors.push(`Scroll horizontal a ${width}px (${Math.max(r.s, r.b)} > ${r.i})`);
  await ctx.close();
}

// axe
for (const run of [
  { name: 'escritorio', o: { viewport: { width: 1280, height: 800 } } },
  { name: 'móvil', o: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: 'movimiento reducido', o: { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' } },
]) {
  const { ctx, page } = await open(run.o);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  for (const v of res.violations) {
    const line = `axe [${v.impact}] ${v.id} (${run.name}): ${v.help} — ${v.nodes.length} nodo(s), p. ej. ${v.nodes[0]?.target?.join(' ')}`;
    (['critical', 'serious'].includes(v.impact) ? errors : warnings).push(line);
  }
  // Objetivos táctiles en móvil
  if (run.name === 'móvil') {
    const small = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!b.width || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]') || el.classList.contains('skip')) continue;
        if (b.width < 44 || b.height < 44) out.push(`${el.tagName.toLowerCase()} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}» ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
      return out;
    });
    for (const s of small) errors.push(`Objetivo táctil < 44 px: ${s}`);
  }
  await ctx.close();
}
await browser.close();

// Lighthouse
if (!fast) {
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
  const profiles = process.argv.includes('--desktop-only') ? ['desktop'] : ['mobile', 'desktop'];
  for (const profile of profiles) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });
      try {
        const cfg = profile === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } } : undefined;
        const r = await lighthouse(base + path, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, cfg);
        const cats = Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
        const a = r.lhr.audits;
        runs.push({ ...cats, lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue, fcp: a['first-contentful-paint'].numericValue, kb: Math.round(a['total-byte-weight'].numericValue / 1024) });
      } finally {
        try {
          await chrome.kill();
        } catch {
          /* EPERM al borrar el perfil temporal en Windows */
        }
      }
    }
    const med = (k) => runs.map((r) => r[k]).sort((x, y) => x - y)[1];
    const s = { perf: med('performance'), a11y: med('accessibility'), bp: med('best-practices'), seo: med('seo') };
    notes.push(`Lighthouse ${profile} (mediana de 3): rendimiento ${s.perf} · accesibilidad ${s.a11y} · buenas prácticas ${s.bp} · SEO ${s.seo} · LCP ${(med('lcp') / 1000).toFixed(2)} s · FCP ${(med('fcp') / 1000).toFixed(2)} s · TBT ${Math.round(med('tbt'))} ms · CLS ${med('cls').toFixed(3)} · ${med('kb')} KB`);
    if (s.perf < 90) errors.push(`Rendimiento ${profile}: ${s.perf} < 90`);
    if (s.a11y < 95) errors.push(`Accesibilidad ${profile}: ${s.a11y} < 95`);
    if (s.bp < 95) errors.push(`Buenas prácticas ${profile}: ${s.bp} < 95`);
    if (s.seo < 95) errors.push(`SEO ${profile}: ${s.seo} < 95`);
    if (med('lcp') > 2500 && profile === 'mobile') errors.push(`LCP móvil ${(med('lcp') / 1000).toFixed(2)} s > 2,5 s`);
    if (med('cls') > 0.02) errors.push(`CLS ${profile}: ${med('cls').toFixed(3)} > 0,02`);
  }
}
server.close();

console.log(`\nRevisión de ${path}`);
for (const n of notes) console.log(`  · ${n}`);
for (const w of warnings) console.log(`  aviso  ${w}`);
for (const e of errors) console.log(`  FALLA  ${e}`);
console.log(errors.length ? `\n✗ ${errors.length} fallos, ${warnings.length} avisos` : `\n✓ Pasa (${warnings.length} avisos)`);
process.exit(errors.length ? 1 : 0);
