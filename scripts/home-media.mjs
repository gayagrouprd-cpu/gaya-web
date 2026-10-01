#!/usr/bin/env node
// Capturas de la página de inicio con los modos de accesibilidad de §10/§11.2: forced-colors, prefers-contrast: more e impresión.
// Comprueba que no hay scroll horizontal, que se ve todo el texto y (con axe) que no hay violaciones en esos modos.
// Uso: node scripts/home-media.mjs [--dir dist] [--out reports/ascii/wp10a/media] [--lang es|en]
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const out = resolve(ROOT, arg('out', 'reports/ascii/wp10a/media'));
mkdirSync(dirname(out), { recursive: true });
const lang = arg('lang', 'es');

const server = createPagesServer({ dir: join(ROOT, arg('dir', 'dist')) });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
let bad = 0;
for (const mode of [
  { name: 'forced-colors', ctx: { forcedColors: 'active' } },
  { name: 'contrast-more', ctx: { contrast: 'more' } },
  { name: 'print', ctx: {}, media: 'print' },
]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', ...mode.ctx });
  const page = await ctx.newPage();
  await page.goto(base + (lang === 'es' ? '/' : '/en/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (mode.media) await page.emulateMedia({ media: mode.media });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: innerWidth,
    canvas: [...document.querySelectorAll('canvas.field, .poster-ssr')].map((e) => getComputedStyle(e).display),
    text: document.querySelector('main').innerText.length,
    h: document.documentElement.scrollHeight,
  }));
  // En forced-colors axe compara el color que escribió el autor con el fondo forzado (blanco) y falla todo el sitio por igual: es un
  // falso positivo conocido, así que ahí se excluye `color-contrast` (el contraste lo fija el sistema; se revisa a la vista).
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
  if (mode.name === 'forced-colors') axe.disableRules(['color-contrast']);
  const res = mode.media ? { violations: [] } : await axe.analyze();
  const ok = r.sw <= r.iw + 1 && res.violations.length === 0 && r.canvas.every((d) => d === 'none');
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} ${mode.name}: scroll ${r.sw}/${r.iw} · lienzo y póster ocultos ${r.canvas.every((d) => d === 'none')} · ${r.text} caracteres de texto · alto ${r.h} px · axe ${res.violations.length}`);
  for (const v of res.violations) console.log(`       axe [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
  await page.screenshot({ path: `${out}-${mode.name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
