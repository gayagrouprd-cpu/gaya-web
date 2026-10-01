// Variante B · mide la TINTA real de cada glifo ASCII (Geist Mono 500, el mismo texto que dibuja atlas.ts: size = cw / 0,6, baseline centrada)
// a los tamaños de celda de producción y ordena la rampa del nombre. Salida: tabla por glifo y por tamaño + JSON en reports/ascii/art-b/ink.json.
//   node tests/ascii/tools/ink-b.mjs [--chars " ·:=*yaAG"] [--out reports/ascii/art-b]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FONT = resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');
const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const OUT = resolve(ROOT, arg('out', 'reports/ascii/art-b'));
mkdirSync(OUT, { recursive: true });

// todo el ASCII imprimible más · y ¯
const CHARS = arg('chars', [...Array(95)].map((_, i) => String.fromCharCode(32 + i)).join('') + '·¯');
// celdas de dispositivo (cw × ch): 6×12 css a dpr 2 · 9×18 a dpr 2 · 9×18 a dpr 1 · 12×25 a dpr 1 · 6×12 a dpr 1
const CELLS = [
  { name: 'm 6x12@2', cw: 12, ch: 24 },
  { name: 'd 9x18@2', cw: 18, ch: 36 },
  { name: 'd 9x18@1', cw: 9, ch: 18 },
  { name: 'w 12x25@1', cw: 12, ch: 25 },
  { name: 'm 6x12@1', cw: 6, ch: 12 },
];

const browser = await launchBrowser();
const page = await browser.newPage();
const b64 = readFileSync(FONT).toString('base64');
await page.setContent(`<style>@font-face{font-family:GM;src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:100 900}</style><canvas id=c></canvas>`);
const ok = await page.evaluate(async () => (await document.fonts.load('500 20px GM', 'yaAG·¯')).length);
if (!ok) throw new Error('no se cargó Geist Mono');
const res = await page.evaluate(
  ({ chars, cells }) => {
    const out = {};
    const cv = document.getElementById('c');
    for (const cell of cells) {
      const { cw, ch } = cell;
      cv.width = cw;
      cv.height = ch;
      const x = cv.getContext('2d', { willReadFrequently: true });
      const size = cw / 0.6;
      x.font = `500 ${size}px GM`;
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      const m = x.measureText('M');
      const base = (ch - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      out[cell.name] = {};
      for (const c of chars) {
        x.clearRect(0, 0, cw, ch);
        x.fillStyle = '#fff';
        x.fillText(c, 0, base);
        const d = x.getImageData(0, 0, cw, ch).data;
        let s = 0;
        let y0 = ch;
        let y1 = -1;
        let x0 = cw;
        let x1 = -1;
        for (let j = 0; j < ch; j++) {
          for (let i = 0; i < cw; i++) {
            const a = d[(j * cw + i) * 4 + 3];
            s += a;
            if (a > 40) {
              if (j < y0) y0 = j;
              if (j > y1) y1 = j;
              if (i < x0) x0 = i;
              if (i > x1) x1 = i;
            }
          }
        }
        out[cell.name][c] = { ink: s / 255 / (cw * ch), bbox: [x0, y0, x1, y1] };
      }
    }
    return out;
  },
  { chars: CHARS, cells: CELLS },
);
await browser.close();
writeFileSync(resolve(OUT, 'ink.json'), JSON.stringify(res, null, 1));

const main = res['d 9x18@2'];
const order = [...CHARS].filter((c) => c !== ' ').sort((a, b) => main[a].ink - main[b].ink);
console.log('Tinta (% de la celda) a 9×18@2 — orden ascendente; columnas: 6×12@2 · 9×18@1 · 12×25@1');
console.log(order.map((c) => `${c}:${(100 * main[c].ink).toFixed(1)}`).join('  '));
console.log('\nGlifos de la rampa del nombre:');
for (const c of ' ·:-=+*~yaAGoO0#%@') {
  const row = CELLS.map((k) => (100 * (res[k.name][c]?.ink ?? 0)).toFixed(1).padStart(5)).join(' ');
  console.log(`  ${JSON.stringify(c)}  ${row}   bbox@18x36 ${res['d 9x18@2'][c] ? res['d 9x18@2'][c].bbox.join(',') : ''}`);
}
