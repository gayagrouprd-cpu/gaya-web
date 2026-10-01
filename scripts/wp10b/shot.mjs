#!/usr/bin/env node
// Captura de una página para revisar el cromo y el arte DOM (WP10b). Chrome real, con Playwright.
// Uso: node scripts/wp10b/shot.mjs --url http://127.0.0.1:4332/ --out reports/ascii/wp10b/x.png
//   [--w 1440] [--h 900] [--dpr 1] [--mobile] [--scroll <px|#id|.sel>] [--click <sel>] [--key <Tab|Escape…>] [--hover <sel>]
//   [--reduced] [--forced] [--contrast] [--print] [--nojs] [--wait 800] [--full] [--clip x,y,w,h] [--eval "js"] [--query ?ssr]
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { launchBrowser } from '../lib/browser.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const out = resolve(arg('out', 'reports/ascii/wp10b/shot.png'));
const w = Number(arg('w', 1440));
const h = Number(arg('h', 900));
const mobile = !!arg('mobile', false) || w < 768;
const browser = await launchBrowser();
const ctx = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: Number(arg('dpr', 1)),
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: arg('reduced', false) ? 'reduce' : 'no-preference',
  forcedColors: arg('forced', false) ? 'active' : 'none',
  contrast: arg('contrast', false) ? 'more' : 'no-preference',
  javaScriptEnabled: !arg('nojs', false),
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`excepción: ${e.message}`));
await page.goto(String(arg('url')) + (arg('query', '') === true ? '' : arg('query', '')), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(Number(arg('wait', 800)));
if (arg('print', false)) await page.emulateMedia({ media: 'print' });
const sc = arg('scroll', false);
if (sc) {
  if (/^\d+$/.test(String(sc))) await page.evaluate((y) => window.scrollTo(0, y), Number(sc));
  else await page.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (Number(document.documentElement.dataset.off) || 0)); }, String(sc));
  await page.waitForTimeout(700);
}
if (arg('click', false)) { await page.locator(String(arg('click'))).first().click(); await page.waitForTimeout(500); }
if (arg('hover', false)) { await page.locator(String(arg('hover'))).first().hover(); await page.waitForTimeout(400); }
if (arg('key', false)) { for (const k of String(arg('key')).split(',')) { await page.keyboard.press(k); await page.waitForTimeout(150); } await page.waitForTimeout(400); }
if (arg('eval', false)) console.log(JSON.stringify(await page.evaluate(String(arg('eval')))));
mkdirSync(dirname(out), { recursive: true });
const clip = arg('clip', false);
const opts = { path: out, fullPage: !!arg('full', false) };
if (clip) { const [x, y, cw, ch] = String(clip).split(',').map(Number); opts.clip = { x, y, width: cw, height: ch }; }
await page.screenshot(opts);
console.log(out);
if (logs.length) console.log('registro:\n  ' + logs.join('\n  '));
await browser.close();
