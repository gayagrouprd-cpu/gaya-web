// Atlas de máscaras de glifos (DIRECTION §6.3 y §6.10; R05 §3.2): blanco sobre transparente, una baldosa de `cw × ch` píxeles de
// dispositivo ENTEROS por glifo, horneado una vez por tamaño de celda.
//   · ASCII y `· ¯` salen de la fuente (Geist Mono 500, `size = cw / 0,6`): cada glifo vive en su baldosa y no deriva.
//   · Bloques, cuadrantes, octavos y cajas se dibujan POR CÓDIGO con rectángulos de píxeles enteros: sin costuras entre celdas
//     (R03 §2.9) y sin depender de `symbols2` ni de las métricas de la fuente de reserva.
//   · `░ ▒ ▓` NO van en el atlas: su trama se calcula con la coordenada absoluta del píxel (shader y `createPattern`), así que
//     continúa sin costura de una celda a la siguiente aunque el ancho de la celda sea impar (A07: 9 px a DPR 1,5).
//   · `╱ ╲ ╭ ╮ ╰ ╯` son trazos con antialiasing: máscara.
// `kind` y `rects` describen cómo dibujar cada glifo SIN el atlas: el renderizador 2D usa los mismos rectángulos que el atlas,
// por eso GL y 2D dan el mismo fotograma.
import { GLYPHS, GLYPH_COUNT, QUAD_GLYPH, glyphIndex } from './glyphs.ts';

export const ATLAS_COLS = 16;
/** Tipo de dibujo de cada glifo. */
export const K_NONE = 0;
export const K_RECTS = 1;
export const K_SHADE = 2;
export const K_MASK = 3;

export interface Atlas {
  canvas: HTMLCanvasElement;
  cw: number;
  ch: number;
  /** Grosor de trazo y punto de las sombras, en px de dispositivo (`round(dpr)`, mínimo 1). */
  t: number;
  rows: number;
  kind: Uint8Array;
  /** Por glifo de tipo K_RECTS: x, y, w, h, x, y, w, h… en px dentro de la baldosa. */
  rects: (Int16Array | null)[];
}

const QMASK = new Map<number, number>();
for (let m = 1; m < 16; m++) QMASK.set(QUAD_GLYPH[m], m);

// brazos de cada caja: l r u d (izquierda, derecha, arriba, abajo); las gruesas llevan el doble de trazo
const ARMS: Record<string, string> = { '─': 'lr', '│': 'ud', '┌': 'rd', '┐': 'ld', '└': 'ru', '┘': 'lu', '├': 'udr', '┤': 'udl', '┬': 'lrd', '┴': 'lru', '┼': 'lrud', '━': 'lr', '┃': 'ud', '╋': 'lrud' };
const HEAVY = '━┃╋';

/** Rectángulos de un glifo de bloque o de caja (null si el glifo no se dibuja con rectángulos). Geometría compartida GL ↔ 2D. */
function rectsOf(gl: number, cw: number, ch: number, t: number): number[] | null {
  const c = GLYPHS[gl];
  const hw = (cw + 1) >> 1;
  const hh = (ch + 1) >> 1;
  const q = QMASK.get(gl);
  if (q) {
    const top = q & 3;
    const bot = q >> 2;
    const band = (m: number, y: number, h: number): number[] => (m === 3 ? [0, y, cw, h] : m === 1 ? [0, y, hw, h] : m === 2 ? [hw, y, cw - hw, h] : []);
    return top === bot ? band(top, 0, ch) : [...band(top, 0, hh), ...band(bot, hh, ch - hh)];
  }
  const code = c.charCodeAt(0);
  if (code >= 0x2581 && code <= 0x2587) {
    const y = Math.round((ch * (0x2588 - code)) / 8);
    return [0, y, cw, ch - y];
  }
  if (code >= 0x2589 && code <= 0x258f) return [0, 0, Math.max(1, Math.round((cw * (0x2590 - code)) / 8)), ch];
  const arms = ARMS[c];
  if (!arms) return null;
  const k = HEAVY.includes(c) ? 2 * t : t;
  const mx = (cw - k) >> 1;
  const my = (ch - k) >> 1;
  const o: number[] = [];
  if (arms.includes('l')) o.push(0, my, mx + k, k);
  if (arms.includes('r')) o.push(mx, my, cw - mx, k);
  if (arms.includes('u')) o.push(mx, 0, k, my + k);
  if (arms.includes('d')) o.push(mx, my, k, ch - my);
  return o;
}

// un <canvas> suelto, no OffscreenCanvas: sirve igual de texImage2D y de drawImage en todos los navegadores (Safari < 17 no sube OffscreenCanvas a WebGL)
const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const SHADES = [glyphIndex('░'), glyphIndex('▒'), glyphIndex('▓')];
export const isShade = (gl: number): boolean => gl === SHADES[0] || gl === SHADES[1] || gl === SHADES[2];
/** 1 = ░ · 2 = ▒ · 3 = ▓ (0 si no es una sombra). */
export const shadeLevel = (gl: number): number => SHADES.indexOf(gl) + 1;

/** Hornea el atlas de una celda de `cw × ch` px de dispositivo (`dpr` fija el grosor de trazo). `family` = pila CSS de la fuente mono. */
export function buildAtlas(cw: number, ch: number, dpr: number, family: string, weight: number = 500): Atlas {
  const t = Math.max(1, Math.round(dpr));
  const rows = Math.ceil(GLYPH_COUNT / ATLAS_COLS);
  const canvas = makeCanvas(cw * ATLAS_COLS, ch * rows);
  const x = canvas.getContext('2d') as CanvasRenderingContext2D;
  const size = cw / 0.6; // Geist Mono avanza 0,600 em: la celda encaja exacta
  x.font = `${weight} ${size}px ${family}`;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#fff';
  x.strokeStyle = '#fff';
  x.lineWidth = t;
  const m = x.measureText('M');
  const asc = m.fontBoundingBoxAscent ?? size * 0.95;
  const desc = m.fontBoundingBoxDescent ?? size * 0.3;
  const base = Math.round((ch - (asc + desc)) / 2 + asc);
  const kind = new Uint8Array(GLYPH_COUNT);
  const rects: (Int16Array | null)[] = new Array(GLYPH_COUNT).fill(null);
  for (let i = 1; i < GLYPH_COUNT; i++) {
    const c = GLYPHS[i];
    const gx = (i % ATLAS_COLS) * cw;
    const gy = Math.floor(i / ATLAS_COLS) * ch;
    if (isShade(i)) {
      kind[i] = K_SHADE;
      continue;
    }
    const r = i <= 96 ? null : rectsOf(i, cw, ch, t);
    if (r) {
      kind[i] = K_RECTS;
      rects[i] = Int16Array.from(r);
      for (let k = 0; k < r.length; k += 4) x.fillRect(gx + r[k], gy + r[k + 1], r[k + 2], r[k + 3]);
      continue;
    }
    kind[i] = K_MASK;
    x.save();
    x.beginPath();
    x.rect(gx, gy, cw, ch);
    x.clip();
    if (i <= 96) x.fillText(c, gx + cw / 2, gy + base);
    else {
      x.beginPath();
      const cx = gx + ((cw - t) >> 1) + t / 2; // el mismo centro entero que las cajas rectas: empalman sin salto
      const cy = gy + ((ch - t) >> 1) + t / 2;
      const rr = Math.min(cw, ch) / 2 - t / 2;
      if (c === '╱') (x.moveTo(gx + cw + 1, gy - 1), x.lineTo(gx - 1, gy + ch + 1));
      else if (c === '╲') (x.moveTo(gx - 1, gy - 1), x.lineTo(gx + cw + 1, gy + ch + 1));
      else if (c === '╭') (x.moveTo(gx + cw, cy), x.lineTo(cx + rr, cy), x.arc(cx + rr, cy + rr, rr, -Math.PI / 2, Math.PI, true), x.lineTo(cx, gy + ch));
      else if (c === '╮') (x.moveTo(gx, cy), x.lineTo(cx - rr, cy), x.arc(cx - rr, cy + rr, rr, -Math.PI / 2, 0, false), x.lineTo(cx, gy + ch));
      else if (c === '╰') (x.moveTo(gx + cw, cy), x.lineTo(cx + rr, cy), x.arc(cx + rr, cy - rr, rr, Math.PI / 2, Math.PI, false), x.lineTo(cx, gy));
      else (x.moveTo(gx, cy), x.lineTo(cx - rr, cy), x.arc(cx - rr, cy - rr, rr, Math.PI / 2, 0, true), x.lineTo(cx, gy)); // ╯
      x.stroke();
    }
    x.restore();
  }
  return { canvas, cw, ch, t, rows, kind, rects };
}
