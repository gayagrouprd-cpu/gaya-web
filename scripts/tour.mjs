#!/usr/bin/env node
// Recorre la página de inicio sección por sección y captura cada pantalla cuando el motor ya se asentó
// (sin marea en vuelo y dormido): es lo que ve una persona al llegar a cada cartel.
// Uso: node scripts/tour.mjs [--url http://127.0.0.1:4321/] [--out reports/ascii/tour] [--w 1440] [--h 900] [--mobile]
//        [--lang es|en] [--ids nosotros,servicios,web,...]   (por omisión: todas las secciones con id, y un paso de media pantalla entre ellas)
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchBrowser } from './lib/browser.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const base = arg('url', 'http://127.0.0.1:4321/');
const out = resolve(arg('out', 'reports/ascii/tour'));
const w = Number(arg('w', 1440));
const h = Number(arg('h', 900));
const mobile = !!arg('mobile', false);
const lang = arg('lang', 'es');
const ids = arg('ids', '') ? String(arg('ids', '')).split(',') : null;
const url = lang === 'en' && !base.includes('/en/') ? new URL('en/', base).href : base;

mkdirSync(out, { recursive: true });
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && !/\[vite\]/.test(m.text()) && errors.push(m.text().slice(0, 160)));
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(3500);

const settle = async () => {
  for (let i = 0; i < 50; i++) {
    const ok = await page.evaluate(() => {
      const f = window.__field;
      return !f || (f.sleeping && !(f.tide && f.tide.active));
    });
    if (ok) break;
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(350);
};

const sections = await page.evaluate(() => [...document.querySelectorAll('main > section[id], main [data-poster][id]')].map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + scrollY, h: s.getBoundingClientRect().height })));
const targets = [];
for (const s of sections) {
  if (ids && !ids.includes(s.id)) continue;
  const steps = Math.max(1, Math.ceil(s.h / h));
  for (let k = 0; k < steps; k++) targets.push({ name: `${s.id}${steps > 1 ? '-' + (k + 1) : ''}`, y: Math.round(s.top + k * h * 0.92) });
}
let n = 0;
for (const t of targets) {
  // bajada con rueda real (así corre la marea como en una visita)
  const cur = await page.evaluate(() => scrollY);
  const dy = t.y - cur;
  const steps = Math.max(1, Math.ceil(Math.abs(dy) / 300));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await page.waitForTimeout(60);
  }
  await settle();
  const file = `${out}/${String(++n).padStart(2, '0')}-${t.name}.png`;
  await page.screenshot({ path: file });
  const st = await page.evaluate(() => (window.__field ? { cur: window.__field.cur, poster: window.__field.poster, variant: window.__field.variant } : null));
  console.log(file, JSON.stringify(st));
}
console.log(errors.length ? 'CONSOLA:\n' + errors.join('\n') : 'consola limpia');
await browser.close();
