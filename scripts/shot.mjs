#!/usr/bin/env node
// Captura de páginas para la revisión visual (Chrome real, con GPU si la hay).
// Uso: node scripts/shot.mjs --url http://127.0.0.1:4321/ --out reports/shots/home.png
//        [--w 1440] [--h 900] [--dpr 1] [--wait 3500] [--mobile] [--full]
//        [--paleta plata] [--tier low] [--still] [--reduced] [--lang en]
//        [--move 0.3,0.5]      mueve el puntero (fracciones del viewport) antes de capturar
//        [--click 0.5,0.5]     hace clic
//        [--scroll 400]        desplaza antes de capturar
//        [--frames 3 --gap 900] varias capturas seguidas (out-1.png, out-2.png…)
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { launchBrowser } from './lib/browser.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const url0 = arg('url', 'http://127.0.0.1:4321/');
const out = resolve(arg('out', 'reports/shots/shot.png'));
const w = Number(arg('w', 1440));
const h = Number(arg('h', 900));
const dpr = Number(arg('dpr', 1));
const wait = Number(arg('wait', 3500));
const mobile = !!arg('mobile', false);
const frames = Number(arg('frames', 1));
const gap = Number(arg('gap', 900));

const u = new URL(url0);
for (const k of ['paleta', 'tier', 'lang']) if (arg(k, false)) u.searchParams.set(k, String(arg(k)));
if (arg('still', false)) u.searchParams.set('still', '');

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11'] });
const ctx = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: dpr,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: arg('reduced', false) ? 'reduce' : 'no-preference',
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
if (arg('nogl', false)) {
  // Simula un navegador sin WebGL
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/i.test(String(type)) ? null : orig.call(this, type, ...rest);
    };
  });
}
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`excepción: ${e.message}`));
await page.goto(u.href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (arg('still', false)) await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 15000 }).catch(() => logs.push('el shader no avisó de que estaba listo'));
await page.waitForTimeout(wait);
if (arg('scroll', false)) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(arg('scroll')));
  await page.waitForTimeout(600);
}
const pt = (s) => s.split(',').map(Number);
if (arg('move', false)) {
  const [fx, fy] = pt(arg('move'));
  await page.mouse.move(w * fx - 60, h * fy + 20);
  await page.mouse.move(w * fx, h * fy, { steps: 12 });
  await page.waitForTimeout(700);
}
if (arg('click', false)) {
  const [fx, fy] = pt(arg('click'));
  await page.mouse.click(w * fx, h * fy);
  await page.waitForTimeout(500);
}
mkdirSync(dirname(out), { recursive: true });
for (let i = 1; i <= frames; i++) {
  const file = frames > 1 ? out.replace(/\.png$/, `-${i}.png`) : out;
  await page.screenshot({ path: file, fullPage: !!arg('full', false) });
  console.log(file);
  if (i < frames) await page.waitForTimeout(gap);
}
const info = await page.evaluate(() => {
  const c = document.querySelector('.hero__gl');
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return { hero: document.querySelector('.hero')?.dataset.hero, canvas: c ? [c.width, c.height] : null, gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null };
});
console.log(JSON.stringify(info));
if (logs.length) console.log('registro:\n  ' + logs.join('\n  '));
await browser.close();
