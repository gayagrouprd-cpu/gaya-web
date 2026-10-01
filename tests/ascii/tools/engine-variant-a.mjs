// Monta el MOTOR REAL (src/ascii/engine.ts: atlas de producción, WebGL2 o Canvas 2D, pozos, tiers) con el registro de la Variante A inyectado
// (`mountField({ loadScene: loadSceneA })`, sin tocar ningún archivo compartido) en una página mínima, y captura el lienzo. Sirve para comprobar que
// el dibujo de producción (atlas de máscaras, `░▒▓` por paridad de píxel, celdas con `bg`) coincide con el pintor de pruebas y que la variante se enchufa.
//   node tests/ascii/tools/engine-variant-a.mjs [--vp 1440x900@2] [--poster cover|hola] [--nogl] [--lang es] [--p 1] [--out reports/ascii/art-a] [--tag -motor] [--base]
// `--base` monta el registro compartido (la base sólida) para comparar.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 || args[i + 1]?.startsWith('--') ? d : args[i + 1];
};
const [VW, VH, DPR] = arg('vp', '1440x900@2').split(/[x@]/).map(Number);
const POSTER = arg('poster', 'cover');
const LANG = arg('lang', 'es');
const OUT = resolve(arg('out', 'reports/ascii/art-a'));
const TAG = arg('tag', '');
mkdirSync(OUT, { recursive: true });

const entry = `
import { mountField } from './src/ascii/engine.ts';
import { loadSceneA } from './src/ascii/scenes/variants/a/index.ts';
window.__mount = (params, lang, useA) => mountField({
  canvas: document.querySelector('canvas.field'),
  lang,
  posters: [...document.querySelectorAll('main [data-poster]')].map((el) => ({ id: el.dataset.poster, el })),
  wells: () => [],
  params: new URLSearchParams(params),
  ...(useA ? { loadScene: loadSceneA } : {}),
});
`;
const bundle = await build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' }, bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent' });
const font = readFileSync(resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')).toString('base64');
const html = `<!doctype html><html lang="${LANG}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>motor</title><style>
@font-face{font-family:"Geist Mono Variable";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900}
:root{--font-mono:"Geist Mono Variable",monospace;--cw:6px;--ch:12px;--surface:#02051b}
@media (min-width:900px){:root{--cw:9px;--ch:18px}}
@media (min-width:1600px){:root{--cw:12px;--ch:25px}}
body{margin:0;background:#02051b}
canvas.field{position:fixed;inset:0;height:100lvh;pointer-events:none;display:block}
main section{height:100vh}
</style></head><body><canvas class="field" aria-hidden="true"></canvas><main><section data-poster="${POSTER}"></section></main></body></html>`;

const browser = await launchBrowser({ args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.setContent(html);
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const params = `still&poster=${POSTER}&p=${arg('p', 1)}&tier=${arg('tier', 'high')}${has('nogl') ? '&nogl' : ''}`;
const field = await page.evaluate(async ({ params, lang, useA }) => {
  const f = await window.__mount(params, lang, useA);
  await new Promise((r) => setTimeout(r, 1200));
  const d = window.__field ?? {};
  return { mode: f && f.mode, cols: d.cols, rows: d.rows, variant: d.variant, tier: d.tier, cell: d.cell };
}, { params, lang: LANG, useA: !has('base') });
const file = resolve(OUT, `motor-${POSTER}-${LANG}-${VW}x${VH}${has('nogl') ? '-2d' : ''}${has('base') ? '-base' : ''}${TAG}.png`);
await page.screenshot({ path: file });
await browser.close();
console.log(file, JSON.stringify(field), errors.length ? `ERRORES: ${errors.join(' | ')}` : 'sin errores de consola');
