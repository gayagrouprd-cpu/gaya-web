// Variante B · comprobación con el RENDERIZADOR DE PRODUCCIÓN: el fotograma `still` de cover y hola (calculado en Node con las escenas de B) se pinta en Chrome con
// el atlas real (atlas.ts: Geist Mono 500, bloques por código) y el renderizador Canvas 2D de producción (render-2d.ts), y se compara con el PNG del pintor de pruebas
// (paint.mjs). Mide cuánto difieren (píxeles con diferencia de canal > 24/255) y guarda el PNG de producción. Uso:
//   node tests/ascii/tools/prod-check-b.mjs [--vp d1440,m360] [--lang es] [--out reports/ascii/art-b/prod]
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';
import { createPainter } from './paint.mjs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { coverB } from '../../../src/ascii/scenes/variants/b/cover.ts';
import { holaB } from '../../../src/ascii/scenes/variants/b/hola.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const OUT = resolve(ROOT, arg('out', 'reports/ascii/art-b/prod'));
const VPS = arg('vp', 'd1440,m360').split(',');
const LANGS = arg('lang', 'es').split(',');
mkdirSync(OUT, { recursive: true });

const entry = `
import { buildAtlas } from ${JSON.stringify(resolve(ROOT, 'src/ascii/atlas.ts'))};
import { createR2D } from ${JSON.stringify(resolve(ROOT, 'src/ascii/render-2d.ts'))};
import { TONE_RGB } from ${JSON.stringify(resolve(ROOT, 'src/ascii/tones.gen.ts'))};
export async function draw(b64, cols, rows, cssCw, cssCh, dpr) {
  const cw = Math.round(cssCw * dpr), ch = Math.round(cssCh * dpr);
  await document.fonts.load('500 20px GM', 'aeYG·¯~*:');
  const atlas = buildAtlas(cw, ch, dpr, 'GM', 500);
  const cv = document.createElement('canvas');
  cv.width = cols * cw; cv.height = rows * ch;
  const ctx = cv.getContext('2d');
  const r = createR2D(ctx, atlas, cols, rows, TONE_RGB);
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const p = r.draw({ cols, rows, b: bytes, u: new Uint32Array(bytes.buffer) });
  if (p) await p;
  return cv.toDataURL('image/png');
}`;
const bundle = await build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' }, bundle: true, write: false, format: 'iife', globalName: 'P', platform: 'browser', logLevel: 'silent' });
const font = readFileSync(resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')).toString('base64');
const browser = await launchBrowser();
const page = await browser.newPage();
await page.setContent(`<style>@font-face{font-family:GM;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}</style>`);
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const painter = await createPainter();

const rows = [];
for (const lang of LANGS) {
  await ensureWords(lang);
  for (const vpName of VPS) {
    const vp = VIEWPORTS[vpName];
    const spec = specOf(vp);
    const dpr = vp.cssCw < 9 ? 2 : 1;
    for (const sc of [coverB, holaB]) {
      const st = sc.build(spec, lang, wordsFor(sc.id, lang, spec));
      const g = makeCells(spec.cols, spec.rows);
      sc.paint(g, st, makeFrame(1, STILL_T, 0, true));
      const url = await page.evaluate(
        ({ b64, cols, rows, cssCw, cssCh, dpr }) => P.draw(b64, cols, rows, cssCw, cssCh, dpr),
        { b64: Buffer.from(g.b.buffer, g.b.byteOffset, g.b.byteLength).toString('base64'), cols: spec.cols, rows: spec.rows, cssCw: vp.cssCw, cssCh: vp.cssCh, dpr },
      );
      const prod = Buffer.from(url.split(',')[1], 'base64');
      const ref = await painter.paint([g], { cssCw: vp.cssCw, cssCh: vp.cssCh, dpr, gap: 0 });
      const a = await sharp(prod).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const b = await sharp(ref).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let diff = 0;
      let big = 0;
      const n = a.info.width * a.info.height;
      if (a.info.width !== b.info.width || a.info.height !== b.info.height) throw new Error(`tamaño distinto ${a.info.width}×${a.info.height} frente a ${b.info.width}×${b.info.height}`);
      for (let i = 0; i < a.data.length; i += 4) {
        const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
        if (d > 24) diff++;
        if (d > 90) big++;
      }
      const file = resolve(OUT, `prod-${sc.id}-${lang}-${vpName}.png`);
      writeFileSync(file, prod);
      rows.push({ scene: sc.id, lang, vp: vpName, w: a.info.width, h: a.info.height, diffPct: (100 * diff) / n, bigPct: (100 * big) / n, file });
      console.log(`${sc.id} ${lang} ${vpName} ${a.info.width}×${a.info.height}: píxeles con Δ>24: ${((100 * diff) / n).toFixed(2)} %  Δ>90: ${((100 * big) / n).toFixed(2)} %`);
    }
  }
}
await painter.close();
await browser.close();
