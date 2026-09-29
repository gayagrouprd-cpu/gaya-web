#!/usr/bin/env node
// Genera la imagen fija de la portada (respaldo para movimiento reducido / sin WebGL / ahorro de datos)
// renderizando el propio shader en modo ?still, y el grano de película (public/noise.png).
// Salida: public/hero/cobalto-land.webp (1600×900) y cobalto-port.webp (720×1280)
// Uso: node scripts/hero-poster.mjs [--dir dist]
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const dir = join(ROOT, arg('dir', 'dist'));
const NAME = 'cobalto';
const OUT = join(ROOT, 'public', 'hero');
mkdirSync(OUT, { recursive: true });

// Grano de película: tesela de ruido gris (se superpone con mix-blend-mode)
const noiseFile = join(ROOT, 'public', 'noise.png');
if (!existsSync(noiseFile)) {
  const size = 160;
  const raw = Buffer.alloc(size * size);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  await sharp(raw, { raw: { width: size, height: size, channels: 1 } }).png({ compressionLevel: 9 }).toFile(noiseFile);
  console.log('grano generado: public/noise.png');
}

const server = createPagesServer({ dir });
const port = await listen(server, 0);
const base = `http://127.0.0.1:${port}`;
const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });

const shapes = [
  { name: 'land', w: 1600, h: 900, mobile: false },
  { name: 'port', w: 720, h: 1280, mobile: true },
];
for (const s of shapes) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: s.mobile, hasTouch: s.mobile, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${base}/?still`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 20000 });
  await page.addStyleTag({ content: '.hero__content,.nav,.skip{visibility:hidden!important}.hero__stage::after{display:none!important}' });
  await page.waitForTimeout(300);
  const png = await page.locator('.hero__stage').screenshot({ type: 'png' });
  const webp = await sharp(png).webp({ quality: 80, effort: 6 }).toBuffer();
  writeFileSync(join(OUT, `${NAME}-${s.name}.webp`), webp);
  console.log(`${NAME}-${s.name}.webp  ${(webp.length / 1024).toFixed(1)} KB`);
  await ctx.close();
}
await browser.close();
server.close();
