// Pintor de celdas de PRUEBA (Canvas 2D en Chrome real) para REVISAR el arte a la vista — no es el atlas de producción (WP5).
// Mismas reglas de oficio que el motor real: los bloques, cuadrantes, sombras y cajas se dibujan POR CÓDIGO con rectángulos de
// píxeles enteros (sin costuras); solo ASCII y `· ¯` salen de la fuente (Geist Mono, tamaño = cw / 0,6).
// La paleta son los 16 hex de DIRECTION §5.4 (puestos aquí para no depender de WP1).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';
import { GLYPHS } from '../../../src/ascii/glyphs.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
import { TONE_HEX } from '../fixtures/tones.mjs';
export { TONE_HEX };
const FONT = resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');

/** Lanza Chrome y prepara la página con la fuente; devuelve un pintor reutilizable. */
export async function createPainter() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const b64 = readFileSync(FONT).toString('base64');
  await page.setContent(`<style>@font-face{font-family:GM;src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:100 900}body{margin:0;background:#02051b}</style><canvas id=c></canvas>`);
  const loaded = await page.evaluate(async () => (await document.fonts.load('500 20px GM', 'aeYG·¯~*:')).length);
  if (!loaded) throw new Error('no se cargó Geist Mono en el pintor de pruebas');

  /**
   * Pinta una o varias rejillas apiladas en vertical. `grids` = [{ cols, rows, b: Uint8Array }]. Devuelve un Buffer PNG.
   * `o`: cssCw (9), dpr (1), gap (px entre rejillas), grid (dibuja las líneas de celda, para depurar).
   */
  async function paint(grids, o = {}) {
    const cssCw = o.cssCw ?? 9;
    const dpr = o.dpr ?? 1;
    const gap = o.gap ?? 12;
    const payload = grids.map((g) => ({ cols: g.cols, rows: g.rows, data: Buffer.from(g.b.buffer, g.b.byteOffset, g.b.byteLength).toString('base64') }));
    const dataUrl = await page.evaluate(
      ({ payload, cssCw, dpr, gap, palette, glyphs }) => {
        const cw = Math.round(cssCw * dpr);
        const ch = cw * 2;
        const dot = Math.max(1, Math.round(dpr));
        const W = Math.max(...payload.map((g) => g.cols)) * cw;
        const H = payload.reduce((s, g) => s + g.rows * ch, 0) + gap * (payload.length - 1);
        const cv = document.getElementById('c');
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = palette[0];
        ctx.fillRect(0, 0, W, H);
        ctx.font = `500 ${cw / 0.6}px GM`;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        const m = ctx.measureText('M');
        const asc = m.fontBoundingBoxAscent;
        const desc = m.fontBoundingBoxDescent;
        const baseY = (ch - (asc + desc)) / 2 + asc;
        const R = (x, y, w, h) => ctx.fillRect(x, y, w, h);
        const Q = { '▘': [1], '▝': [2], '▖': [4], '▗': [8], '▚': [1, 8], '▞': [2, 4], '▙': [1, 4, 8], '▛': [1, 2, 4], '▜': [1, 2, 8], '▟': [2, 4, 8] };
        const drawBlock = (c, x, y) => {
          const hw = cw >> 1;
          const hh = ch >> 1;
          if (c === '█') return R(x, y, cw, ch);
          if (c === '▀') return R(x, y, cw, hh);
          if (c === '▄') return R(x, y + hh, cw, ch - hh);
          if (c === '▌') return R(x, y, hw, ch);
          if (c === '▐') return R(x + hw, y, cw - hw, ch);
          if (Q[c]) {
            for (const q of Q[c]) {
              const right = q === 2 || q === 8;
              const bottom = q === 4 || q === 8;
              R(x + (right ? hw : 0), y + (bottom ? hh : 0), right ? cw - hw : hw, bottom ? ch - hh : hh);
            }
            return;
          }
          const v = '▁▂▃▄▅▆▇'.indexOf(c);
          if (v >= 0) {
            const hgt = Math.round(((v + 1) * ch) / 8);
            return R(x, y + ch - hgt, cw, hgt);
          }
          const hz = '▏▎▍▌▋▊▉'.indexOf(c);
          if (hz >= 0) return R(x, y, Math.round(((hz + 1) * cw) / 8), ch);
        };
        const drawShade = (c, x, y) => {
          for (let j = 0; j * dot < ch; j++) {
            for (let i = 0; i * dot < cw; i++) {
              const on = c === '░' ? (i & 1) === 0 && (j & 1) === 0 : c === '▒' ? ((i + j) & 1) === 0 : !((i & 1) === 0 && (j & 1) === 0);
              if (on) R(x + i * dot, y + j * dot, Math.min(dot, cw - i * dot), Math.min(dot, ch - j * dot));
            }
          }
        };
        const drawBox = (c, x, y) => {
          const t = '━┃╋'.includes(c) ? dot * 2 : dot;
          const mx = x + ((cw - t) >> 1);
          const my = y + ((ch - t) >> 1);
          const cxm = mx + t;
          const cym = my + t;
          const H = (x0, x1) => R(x0, my, x1 - x0, t);
          const V = (y0, y1) => R(mx, y0, t, y1 - y0);
          const all = { '─': 'lr', '━': 'lr', '│': 'ud', '┃': 'ud', '┼': 'lrud', '╋': 'lrud', '┌': 'rd', '╭': 'rd', '┐': 'ld', '╮': 'ld', '└': 'ru', '╰': 'ru', '┘': 'lu', '╯': 'lu', '├': 'rud', '┤': 'lud', '┬': 'lrd', '┴': 'lru' }[c];
          if (all) {
            if (all.includes('l')) H(x, cxm);
            if (all.includes('r')) H(mx, x + cw);
            if (all.includes('u')) V(y, cym);
            if (all.includes('d')) V(my, y + ch);
            return;
          }
          ctx.lineWidth = Math.max(1, dot);
          ctx.beginPath();
          if (c === '╱') { ctx.moveTo(x, y + ch); ctx.lineTo(x + cw, y); } else { ctx.moveTo(x, y); ctx.lineTo(x + cw, y + ch); }
          ctx.stroke();
        };
        let oy = 0;
        for (const g of payload) {
          const bytes = Uint8Array.from(atob(g.data), (s) => s.charCodeAt(0));
          for (let r = 0; r < g.rows; r++) {
            for (let c = 0; c < g.cols; c++) {
              const i = (r * g.cols + c) * 4;
              const gl = bytes[i];
              const fg = bytes[i + 1];
              const bg = bytes[i + 2];
              const x = c * cw;
              const y = oy + r * ch;
              if (bg !== 0) { ctx.fillStyle = palette[bg]; R(x, y, cw, ch); }
              if (gl === 0) continue;
              ctx.fillStyle = palette[fg];
              const cc = glyphs[gl];
              if (gl <= 96) ctx.fillText(cc, x, y + baseY);
              else if (gl >= 112 && gl <= 114) drawShade(cc, x, y);
              else if (gl >= 127) drawBox(cc, x, y);
              else drawBlock(cc, x, y);
            }
          }
          oy += g.rows * ch + gap;
        }
        return cv.toDataURL('image/png');
      },
      { payload, cssCw, dpr, gap, palette: TONE_HEX, glyphs: [...GLYPHS] },
    );
    return Buffer.from(dataUrl.split(',')[1], 'base64');
  }

  return {
    paint,
    async save(file, grids, o) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, await paint(Array.isArray(grids) ? grids : [grids], o));
      return file;
    },
    close: () => browser.close(),
  };
}
