// Mide la TINTA real (fracción del área de la celda con cobertura de glifo) de cada glifo ASCII y de `· ¯` en Geist Mono 500, con el
// mismo método que atlas.ts (fillText con size = cw / 0,6, línea base centrada con fontBoundingBox) y a los tamaños de celda de §5.2
// (9×18 a dpr 2, 6×12 a dpr 2, 12×25 a dpr 1). Escribe src/ascii/scenes/ink.gen.ts (tinta en milésimas a 9×18 dpr 2) y
// comprueba que el orden de la rampa de la Variante A es estable entre tamaños.   node tests/ascii/tools/measure-ramp.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FONT = resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');
const OUT = resolve(ROOT, 'src/ascii/scenes/ink.gen.ts');
const SIZES = [
  { name: '9×18@2', cw: 18, ch: 36 },
  { name: '6×12@2', cw: 12, ch: 24 },
  { name: '12×25@1', cw: 12, ch: 25 },
  { name: '9×18@1', cw: 9, ch: 18 },
];
const CHARS = [];
for (let c = 33; c <= 126; c++) CHARS.push(String.fromCharCode(c));
CHARS.push('·', '¯');

const browser = await launchBrowser();
const page = await browser.newPage();
const b64 = readFileSync(FONT).toString('base64');
await page.setContent(`<style>@font-face{font-family:GM;src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:100 900}</style><canvas id=c></canvas>`);
await page.evaluate(async () => (await document.fonts.load('500 20px GM', 'aeYG·¯~*:')).length);
const res = await page.evaluate(
  ({ sizes, chars }) => {
    const out = {};
    for (const s of sizes) {
      const cv = document.getElementById('c');
      cv.width = s.cw * 2;
      cv.height = s.ch * 2;
      const x = cv.getContext('2d', { willReadFrequently: true });
      const size = s.cw / 0.6;
      x.font = `500 ${size}px GM`;
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      const m = x.measureText('M');
      const base = Math.round((s.ch - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent);
      out[s.name] = {};
      for (const c of chars) {
        x.clearRect(0, 0, cv.width, cv.height);
        x.fillStyle = '#fff';
        x.save();
        x.beginPath();
        x.rect(0, 0, s.cw, s.ch);
        x.clip();
        x.fillText(c, s.cw / 2, base);
        x.restore();
        const d = x.getImageData(0, 0, s.cw, s.ch).data;
        let a = 0;
        for (let i = 3; i < d.length; i += 4) a += d[i];
        out[s.name][c] = a / 255 / (s.cw * s.ch);
      }
    }
    return out;
  },
  { sizes: SIZES, chars: CHARS },
);
await browser.close();

const main = res['9×18@2'];
const sorted = Object.entries(main).sort((a, b) => a[1] - b[1]);
console.log('ASCII por tinta (9×18 dpr 2, % del área):');
console.log(sorted.map(([c, v]) => `${c}${(v * 100).toFixed(1)}`).join('  '));
const RAMP = ['.', ':', '-', '=', '+', '*', '#', '%', '@'];
console.log('\nrampa A, tinta por tamaño (%):');
for (const s of SIZES) console.log(s.name.padEnd(8), RAMP.map((c) => `${c}${(res[s.name][c] * 100).toFixed(1).padStart(5)}`).join(' '));
if (process.argv.includes('--write')) {
  const rows = CHARS.map((c) => `  [${JSON.stringify(c)}, ${Math.round(main[c] * 1000)}]`).join(',\n');
  const body = `// GENERADO por tests/ascii/tools/measure-ramp.mjs (--write). No editar a mano.
// Tinta medida (milésimas del área de la celda) de cada glifo ASCII imprimible y de \`· ¯\` en Geist Mono 500, a 9×18 CSS con dpr 2
// (mismo método que atlas.ts). El orden es estable entre tamaños (Spearman ≥ 0,98 según docs/ascii/research/02 §2.2).
export const INK_PERMILLE: readonly (readonly [string, number])[] = [\n${rows},\n];\n`;
  writeFileSync(OUT, body);
  console.log('\nescrito', OUT);
}
