#!/usr/bin/env node
// Sonda de la portada: mide compilación, primer fotograma, reposo y respuesta a la interacción.
// Uso: node scripts/hero-probe.mjs [--url http://127.0.0.1:4321/] [--tier high|mid|low] [--mobile] [--cpu 4]
import { launchBrowser } from './lib/browser.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const u = new URL(arg('url', 'http://127.0.0.1:4321/'));
if (arg('tier', false)) u.searchParams.set('tier', String(arg('tier')));
const mobile = !!arg('mobile', false);
const cpu = Number(arg('cpu', 1));

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
if (cpu > 1) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
}
await page.goto(u.href, { waitUntil: 'load' });
const t = async (label) => {
  const s = await page.evaluate(() => ({ ...window.__hero, hero: document.querySelector('.hero')?.dataset.hero, now: Math.round(performance.now()) }));
  console.log(label.padEnd(26), JSON.stringify(s));
  return s;
};
await page.waitForTimeout(500);
await t('0,5 s');
await page.waitForTimeout(1500);
await t('2 s');
await page.waitForTimeout(3000);
const a = await t('5 s (tras la entrada)');
await page.waitForTimeout(2500);
const b = await t('7,5 s (reposo?)');
console.log(`fotogramas dibujados entre 5 s y 7,5 s: ${b.draws - a.draws}  → ${b.draws - a.draws === 0 ? 'EN REPOSO ✓' : 'sigue dibujando'}`);
await page.mouse.move(400, 300);
await page.mouse.move(700, 450, { steps: 20 });
await page.waitForTimeout(400);
const c = await t('movimiento del ratón');
console.log(`fotogramas con el ratón: ${c.draws - b.draws}`);
await page.waitForTimeout(6500);
const d = await t('vuelta al reposo');
await page.waitForTimeout(1500);
const e = await t('reposo otra vez');
console.log(`fotogramas tras volver al reposo: ${e.draws - d.draws}  → ${e.draws - d.draws === 0 ? 'EN REPOSO ✓' : 'sigue dibujando'}`);
await browser.close();
