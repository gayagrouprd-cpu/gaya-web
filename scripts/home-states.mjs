#!/usr/bin/env node
// Capturas de estados de la página de inicio para la revisión visual: reposo, hover y foco de teclado del Índice, una ficha, los ejemplos y el contacto.
// Uso: node scripts/home-states.mjs [--dir dist] [--out reports/ascii/wp10a/states] [--lang es|en]
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const out = resolve(ROOT, arg('out', 'reports/ascii/wp10a/states'));
mkdirSync(dirname(out), { recursive: true });
const lang = arg('lang', 'es');

const server = createPagesServer({ dir: join(ROOT, arg('dir', 'dist')) });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto(base + (lang === 'es' ? '/' : '/en/'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const clip = async (sel, name, pad = 24) => {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const b = await el.boundingBox();
  await page.screenshot({ path: `${out}-${name}.png`, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(1440, b.width + pad * 2 + 20), height: Math.min(900, b.height + pad * 2 + 20) } });
};

// Índice: reposo, hover en la segunda fila, foco de teclado en «Ver detalle»
await clip('.idx__list', 'idx-rest', 10);
await page.locator('.idx__row').nth(1).hover();
await page.waitForTimeout(300);
await clip('.idx__list', 'idx-hover', 10);
await page.mouse.move(2, 2);
await page.locator('.idx__more').nth(2).focus();
await page.keyboard.press('Shift+Tab');
await page.keyboard.press('Tab');
await page.waitForTimeout(200);
await clip('.idx__list', 'idx-focus', 10);

// Ejemplos: hover en una fila y foco en «Quiero una así»
await page.locator('.smp__row').nth(1).hover();
await page.waitForTimeout(300);
await clip('.smp__plate', 'smp-hover', 10);
await page.mouse.move(2, 2);
await page.locator('.smp__row').nth(0).locator('a.btn--primary').focus();
await page.keyboard.press('Shift+Tab');
await page.keyboard.press('Tab');
await page.waitForTimeout(200);
await clip('.smp__plate', 'smp-focus', 10);

// Las cuatro placas de servicio (viñeta, reparto y dato de cada una)
for (const id of ['web', 'automation', 'marketing', 'it']) await clip(`.svc--${id} .plate`, `plate-${id}`, 12);

// Contacto: «Copiar» tras pulsar (Copiado)
await page.locator('button[data-copy]').scrollIntoViewIfNeeded();
await page.locator('button[data-copy]').click();
await page.waitForTimeout(300);
await clip('.contact__plate', 'contact-copied', 10);

await browser.close();
server.close();
console.log(`estados → ${out}-*.png`);
