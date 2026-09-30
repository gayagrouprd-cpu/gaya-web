// Rejilla de celdas del motor ASCII (DIRECTION §6.3, R05 §3.1 y Anexo B.4). Corre en Node sin DOM.
//
// Una celda = 4 bytes: [glifo, tono fg, tono bg, banderas]. `b` (bytes) y `u` (Uint32) comparten el MISMO ArrayBuffer:
// copiar, comparar y rellenar celdas enteras es UNA operación. Banderas: bit0 = «tocada» (la capa escribió la celda),
// bit1 = «fondo explícito» (la capa fijó `bg`; si no, hereda el de abajo al superponer).
//
// API en funciones libres sobre `Cells` (el contrato de types.ts, que no tiene métodos) y la clase `Grid` como azúcar
// para código que sabe que posee la rejilla (pruebas, motor). Nada aquí asigna memoria en la ruta caliente.
import type { Cells } from "./types.ts";
import { GLYPHS, GLYPH_COUNT, QUAD_GLYPH, glyphIndex } from "./glyphs.ts";

export const F_TOUCHED = 1;
export const F_BG = 2;

// ---------- glifos ----------

const LUT = new Int16Array(0x2600).fill(-1);
const CODES = new Uint16Array(GLYPH_COUNT);
for (let i = 0; i < GLYPH_COUNT; i++) {
  CODES[i] = GLYPHS[i].charCodeAt(0);
  LUT[CODES[i]] = i;
}
const QMARK = glyphIndex("?");

/** Índice de glifo de un código de carácter; un carácter no permitido sale como «?» (el error se ve, no se traga). */
export function glyphOfCode(code: number): number {
  const i = code < LUT.length ? LUT[code] : -1;
  return i < 0 ? QMARK : i;
}

/** Glifo de un carácter (primer código); «?» si no está en la lista única. */
export const gi = (ch: string): number => glyphOfCode(ch.charCodeAt(0));

export const RAMP: readonly number[] = " .:=*xX#%@".split("").map(gi);
/** Alto en octavos desde abajo (0..8): ' ▁▂▃▄▅▆▇█'. */
export const EIGHTHS_V: readonly number[] = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"].map(gi);
export const SHADES: readonly number[] = [0, glyphIndex("░"), glyphIndex("▒"), glyphIndex("▓"), glyphIndex("█")];

/** Celdas 2×2 (bit0=▘ TL, bit1=▝ TR, bit2=▖ BL, bit3=▗ BR) → glifo. */
export const QUAD: readonly number[] = QUAD_GLYPH;

// ---------- creación y memoria ----------

export function makeCells(cols: number, rows: number): Cells {
  const buf = new ArrayBuffer(cols * rows * 4);
  return { cols, rows, b: new Uint8Array(buf), u: new Uint32Array(buf) };
}

/** Vacía la pantalla: glifo ' ', fg 0, `bg` como tono de fondo (sin bandera de fondo explícito). */
export function clear(g: Cells, bg: number = 0): void {
  g.u.fill(bg << 16);
}

export function copyCells(dst: Cells, src: Cells): void {
  if (dst.u.length !== src.u.length) throw new RangeError("copyCells: tamaños distintos");
  dst.u.set(src.u);
}

/**
 * Copia `src` dentro de `dst` desde (dx, dy), recortando; copia filas por memoria (sirve para «bandas» de un campo único).
 * Ida y vuelta: blit(a, s, dx, dy) y luego leer la ventana de `a` en (dx, dy) devuelve `s` (dentro de los límites).
 */
export function blit(dst: Cells, src: Cells, dx: number = 0, dy: number = 0): void {
  const x0 = Math.max(0, dx);
  const x1 = Math.min(dst.cols, dx + src.cols);
  if (x1 <= x0) return;
  for (let y = 0; y < src.rows; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= dst.rows) continue;
    dst.u.set(src.u.subarray(y * src.cols + (x0 - dx), y * src.cols + (x1 - dx)), ty * dst.cols + x0);
  }
}

/**
 * Capa con transparencia: copia SOLO las celdas que `src` tocó (bit0); si su fondo no era explícito (bit1), hereda el de
 * abajo. `dx, dy` desplazan la capa (se recorta). Con mismas dimensiones y sin desplazamiento recorre la memoria lineal.
 */
export function overlay(dst: Cells, src: Cells, dx: number = 0, dy: number = 0): void {
  const s = src.b;
  const d = dst.b;
  if (dx === 0 && dy === 0 && src.cols === dst.cols && src.rows === dst.rows) {
    for (let i = 0; i < s.length; i += 4) {
      const f = s[i + 3];
      if ((f & 1) === 0) continue;
      d[i] = s[i];
      d[i + 1] = s[i + 1];
      if (f & 2) d[i + 2] = s[i + 2];
      d[i + 3] |= f;
    }
    return;
  }
  for (let y = 0; y < src.rows; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= dst.rows) continue;
    for (let x = 0; x < src.cols; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= dst.cols) continue;
      const i = (y * src.cols + x) << 2;
      const f = s[i + 3];
      if ((f & 1) === 0) continue;
      const j = (ty * dst.cols + tx) << 2;
      d[j] = s[i];
      d[j + 1] = s[i + 1];
      if (f & 2) d[j + 2] = s[i + 2];
      d[j + 3] |= f;
    }
  }
}

// ---------- celdas ----------

/** Escribe una celda. `bg = -1` no toca el fondo («transparente»). Fuera de la rejilla no hace nada. */
export function put(g: Cells, x: number, y: number, glyph: number, fg: number, bg: number = -1): void {
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  const i = (y * g.cols + x) << 2;
  const b = g.b;
  b[i] = glyph;
  b[i + 1] = fg;
  if (bg >= 0) {
    b[i + 2] = bg;
    b[i + 3] |= 3;
  } else b[i + 3] |= 1;
}

/** Igual que `put` con un carácter (no sirve en la ruta caliente: hay que resolver el glifo una vez y usar `put`). */
export function putc(g: Cells, x: number, y: number, ch: string, fg: number, bg: number = -1): void {
  put(g, x, y, gi(ch), fg, bg);
}

export function getGlyph(g: Cells, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return 0;
  return g.b[(y * g.cols + x) << 2];
}

export function getTone(g: Cells, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return 0;
  return g.b[((y * g.cols + x) << 2) + 1];
}

export function getBg(g: Cells, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return 0;
  return g.b[((y * g.cols + x) << 2) + 2];
}

/** Cambia SOLO el tono del primer plano (los pulsos encienden celdas ya dibujadas sin tocar el glifo). */
export function setTone(g: Cells, x: number, y: number, fg: number): void {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  g.b[((y * g.cols + x) << 2) + 1] = fg;
}

export function setBg(g: Cells, x: number, y: number, bg: number): void {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  const i = (y * g.cols + x) << 2;
  g.b[i + 2] = bg;
  g.b[i + 3] |= 3;
}

/** Rellena un rectángulo de celdas (recortado). */
export function fill(g: Cells, x: number, y: number, w: number, h: number, glyph: number, fg: number, bg: number = -1): void {
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(g.cols, (x | 0) + w);
  const y1 = Math.min(g.rows, (y | 0) + h);
  const b = g.b;
  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      const k = (j * g.cols + i) << 2;
      b[k] = glyph;
      b[k + 1] = fg;
      if (bg >= 0) {
        b[k + 2] = bg;
        b[k + 3] |= 3;
      } else b[k + 3] |= 1;
    }
  }
}

export function fillBg(g: Cells, x: number, y: number, w: number, h: number, bg: number): void {
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(g.cols, (x | 0) + w);
  const y1 = Math.min(g.rows, (y | 0) + h);
  const b = g.b;
  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      const k = (j * g.cols + i) << 2;
      b[k + 2] = bg;
      b[k + 3] |= 3;
    }
  }
}

/** Cadena de texto en la rejilla (los espacios son transparentes). Solo para arte; el texto real vive en el DOM. */
export function text(g: Cells, x: number, y: number, s: string, fg: number, bg: number = -1): void {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c !== 32) put(g, x + i, y, glyphOfCode(c), fg, bg);
  }
}

export function textCentered(g: Cells, cx: number, y: number, s: string, fg: number, bg: number = -1): void {
  text(g, Math.round(cx - s.length / 2), y, s, fg, bg);
}

// ---------- cajas y trazos ----------

const BOX = {
  single: ["┌", "┐", "└", "┘", "─", "│"],
  round: ["╭", "╮", "╰", "╯", "─", "│"],
  thick: ["┌", "┐", "└", "┘", "━", "┃"],
  ascii: ["+", "+", "+", "+", "-", "|"],
} as const;

export function box(g: Cells, x: number, y: number, w: number, h: number, style: keyof typeof BOX, fg: number, bg: number = -1): void {
  if (w < 2 || h < 2) return;
  const S = BOX[style];
  const tl = gi(S[0]);
  const tr = gi(S[1]);
  const bl = gi(S[2]);
  const br = gi(S[3]);
  const hh = gi(S[4]);
  const vv = gi(S[5]);
  for (let i = 1; i < w - 1; i++) {
    put(g, x + i, y, hh, fg, bg);
    put(g, x + i, y + h - 1, hh, fg, bg);
  }
  for (let j = 1; j < h - 1; j++) {
    put(g, x, y + j, vv, fg, bg);
    put(g, x + w - 1, y + j, vv, fg, bg);
  }
  put(g, x, y, tl, fg, bg);
  put(g, x + w - 1, y, tr, fg, bg);
  put(g, x, y + h - 1, bl, fg, bg);
  put(g, x + w - 1, y + h - 1, br, fg, bg);
}

const G_LINE_H = gi("─");
const G_LINE_V = gi("│");

export function hline(g: Cells, x: number, y: number, w: number, fg: number, glyph: number = G_LINE_H): void {
  fill(g, x, y, w, 1, glyph, fg);
}

export function vline(g: Cells, x: number, y: number, h: number, fg: number, glyph: number = G_LINE_V): void {
  fill(g, x, y, 1, h, glyph, fg);
}

export interface StrokeOpts {
  dotted?: boolean;
  shallow?: number;
  steep?: number;
}

/**
 * Rasteriza una polilínea en coordenadas de celda (flotantes) y devuelve las celdas en orden de recorrido [x, y, carácter].
 * El glifo sale de la dirección VISUAL (la celda es 1:2) y de la altura media del trazo dentro de la celda:
 * `¯ - _` en trazos suaves, `/ \` en diagonales, `|` en verticales (con `dotted`: `' . :`). Asigna memoria: solo en `build`.
 */
export function strokeCells(pts: readonly (readonly [number, number])[], o: StrokeOpts = {}): [number, number, string][] {
  const dotted = o.dotted ?? false;
  const shallow = o.shallow ?? 0.35;
  const steep = o.steep ?? 1.7;
  const seen = new Map<number, { cx: number; cy: number; sy: number; n: number; slope: number; sign: number }>();
  for (let s = 0; s < pts.length - 1; s++) {
    const ax = pts[s][0];
    const ay = pts[s][1];
    const bx = pts[s + 1][0];
    const by = pts[s + 1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const n = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy) * 6));
    const slope = Math.abs(dx) < 1e-6 ? 1e9 : Math.abs(dy / dx);
    const sign = dx >= 0 === dy >= 0 ? 1 : -1; // + ⇒ baja hacia la derecha ⇒ barra invertida
    for (let k = 0; k <= n; k++) {
      const x = ax + (dx * k) / n;
      const y = ay + (dy * k) / n;
      const cx = Math.floor(x);
      const cy = Math.floor(y);
      const key = cy * 4096 + cx;
      const e = seen.get(key);
      if (e) {
        e.sy += y - cy;
        e.n++;
      } else seen.set(key, { cx, cy, sy: y - cy, n: 1, slope, sign });
    }
  }
  const out: [number, number, string][] = [];
  for (const e of seen.values()) {
    const fy = e.sy / e.n;
    let c: string;
    if (e.slope <= shallow) c = dotted ? (fy < 0.5 ? "'" : ".") : fy < 0.34 ? "¯" : fy < 0.68 ? "-" : "_";
    else if (e.slope >= steep) c = dotted ? ":" : "|";
    else c = e.sign > 0 ? "\\" : "/";
    out.push([e.cx, e.cy, c]);
  }
  return out;
}

export function stroke(g: Cells, pts: readonly (readonly [number, number])[], fg: number, o: StrokeOpts = {}): void {
  for (const c of strokeCells(pts, o)) putc(g, c[0], c[1], c[2], fg);
}

export function line(g: Cells, x0: number, y0: number, x1: number, y1: number, fg: number, o: StrokeOpts = {}): void {
  stroke(g, [[x0, y0], [x1, y1]], fg, o);
}

// ---------- relleno de polígonos por cobertura ----------

let COV = new Uint8Array(0);
let MSK = new Uint8Array(0);

export interface PolyOpts {
  mode?: "blocks" | "ink";
  ramp?: readonly number[];
  /** Interior textura: devuelve [glifo, tono?] para celdas totalmente cubiertas. */
  inner?: ((x: number, y: number) => readonly [number, number?]) | null;
}

/**
 * Relleno de un polígono (regla par-impar) con cobertura por celda. `blocks`: 2×2 muestras por celda → cuadrante
 * `▘▝▖▗▀▄▌▐█…` (resolución ×2); `ink`: 3×3 muestras → glifo de la rampa. `bg` nunca se toca (hereda lo de abajo).
 */
export function poly(g: Cells, pts: readonly (readonly [number, number])[], fg: number, o: PolyOpts = {}): void {
  const mode = o.mode ?? "blocks";
  const ramp = o.ramp ?? RAMP;
  const inner = o.inner ?? null;
  const SW = mode === "blocks" ? 2 : 3;
  const SH = SW;
  let minX = 1e9;
  let maxX = -1e9;
  let minY = 1e9;
  let maxY = -1e9;
  for (const p of pts) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const x0 = Math.max(0, Math.floor(minX));
  const x1 = Math.min(g.cols - 1, Math.ceil(maxX));
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(g.rows - 1, Math.ceil(maxY));
  const cols = g.cols;
  if (COV.length < g.cols * g.rows) {
    COV = new Uint8Array(g.cols * g.rows);
    MSK = new Uint8Array(g.cols * g.rows);
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    COV[y * cols + x] = 0;
    MSK[y * cols + x] = 0;
  }
  const m = pts.length;
  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let sy = 0; sy < SH; sy++) {
      const yy = y + (sy + 0.5) / SH;
      xs.length = 0;
      for (let i = 0; i < m; i++) {
        const ax = pts[i][0];
        const ay = pts[i][1];
        const bx = pts[(i + 1) % m][0];
        const by = pts[(i + 1) % m][1];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.max(xs[k], x0);
        const b = Math.min(xs[k + 1], x1 + 1);
        const s0 = Math.ceil(a * SW - 0.5);
        const s1 = Math.ceil(b * SW - 0.5);
        for (let sx = s0; sx < s1; sx++) {
          const cx = Math.floor(sx / SW);
          const i = y * cols + cx;
          COV[i]++;
          if (mode === "blocks") MSK[i] |= 1 << ((sy ? 2 : 0) + (sx - cx * SW ? 1 : 0));
        }
      }
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * cols + x;
    const c = COV[i];
    if (!c) continue;
    if (mode === "blocks") {
      const mk = MSK[i];
      if (mk === 15 && inner) {
        const r = inner(x, y);
        put(g, x, y, r[0], r[1] ?? fg);
      } else put(g, x, y, QUAD[mk], fg);
    } else {
      const f = c / (SW * SH);
      if (f >= 0.999 && inner) {
        const r = inner(x, y);
        put(g, x, y, r[0], r[1] ?? fg);
      } else put(g, x, y, ramp[Math.min(ramp.length - 1, Math.round(f * (ramp.length - 1)))], fg);
    }
  }
}

export function rectFill(g: Cells, x: number, y: number, w: number, h: number, fg: number, o: PolyOpts = {}): void {
  poly(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fg, o);
}

// ---------- sombreado con dither ordenado ----------

/** Bayer 8×8 por recursión M(2n) = [[4M, 4M+2], [4M+3, 4M+1]]; umbrales (0..1) estables en el tiempo, indexados por celda. */
export const BAYER8: Float32Array = (() => {
  let m: number[][] = [[0]];
  for (let n = 1; n < 8; n *= 2) {
    const s = m.length;
    const out: number[][] = Array.from({ length: s * 2 }, () => new Array<number>(s * 2).fill(0));
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = 4 * m[y][x];
      out[y][x] = v;
      out[y][x + s] = v + 2;
      out[y + s][x] = v + 3;
      out[y + s][x + s] = v + 1;
    }
    m = out;
  }
  const f = new Float32Array(64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) f[y * 8 + x] = (m[y][x] + 0.5) / 64;
  return f;
})();
export const bayer = (x: number, y: number): number => BAYER8[((y & 7) << 3) | (x & 7)];

/** Glifo de la rampa para un valor 0..1, con umbral `thr` (p. ej. `bn(x, y)`) entre pasos vecinos. */
export function shade(v: number, thr: number, ramp: readonly number[] = RAMP): number {
  const vv = v < 0 ? 0 : v > 1 ? 1 : v;
  const p = vv * (ramp.length - 1);
  const k = Math.floor(p);
  const f = p - k;
  return ramp[Math.min(ramp.length - 1, k + (f > thr ? 1 : 0))];
}

// ---------- salidas de texto (pruebas, regresión, póster) ----------

/** Glifos como texto (sin espacios finales por fila). Es la mitad de la huella de regresión visual (T19). */
export function toText(g: Cells): string {
  const rows: string[] = [];
  const codes = new Array<number>(g.cols);
  for (let y = 0; y < g.rows; y++) {
    let last = -1;
    for (let x = 0; x < g.cols; x++) {
      const gl = g.b[(y * g.cols + x) << 2];
      codes[x] = CODES[gl];
      if (gl !== 0) last = x;
    }
    rows.push(String.fromCharCode(...codes.slice(0, last + 1)));
  }
  return rows.join("\n");
}

/** Mapa de tonos en hexadecimal, un dígito por celda (`which` 1 = fg, 2 = bg). Segunda mitad de la huella (T19). */
export function toTones(g: Cells, which: 1 | 2 = 1): string {
  const rows: string[] = [];
  for (let y = 0; y < g.rows; y++) {
    let s = "";
    for (let x = 0; x < g.cols; x++) s += g.b[((y * g.cols + x) << 2) + which].toString(16);
    rows.push(s);
  }
  return rows.join("\n");
}

/** Huella de 64 bits (dos FNV-1a de 32) sobre glifo, fg y bg de todas las celdas; las banderas no cuentan. */
export function hashCells(g: Cells): string {
  let h1 = 0x811c9dc5;
  let h2_ = 0x01000193 ^ 0x5bd1e995;
  const b = g.b;
  for (let i = 0; i < b.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = b[i + k];
      h1 = Math.imul(h1 ^ v, 0x01000193);
      h2_ = Math.imul(h2_ ^ (v + k * 37), 0x85ebca6b);
    }
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2_ >>> 0).toString(16).padStart(8, "0");
}

// ---------- las 4 capas de tono del póster SSR (§6.9) ----------

export interface PosterLayers {
  dim: string;
  mid: string;
  hot: string;
  spark: string;
}

export const LAYER_NAMES = ["dim", "mid", "hot", "spark"] as const;

/** Tono (0..15) → capa 0 dim · 1 mid · 2 hot · 3 spark; 255 = invisible (T0 sobre el fondo T0). */
export const LAYER_OF_TONE: Uint8Array = Uint8Array.from([255, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3]);

/** Tono representativo de cada capa: el que el CSS del póster pone como `color: var(--tN)` (WP10). */
export const POSTER_TONES: readonly [number, number, number, number] = [4, 8, 11, 14];

export const toneLayer = (tone: number): number => LAYER_OF_TONE[tone & 15];

/**
 * Fotograma → 4 cadenas (una por capa), la MISMA rejilla en las cuatro: cada celda visible cae en exactamente una capa y
 * las demás llevan un espacio. NO mira `bg`. Sin espacios finales por fila ni filas vacías al final.
 */
export function toLayers(g: Cells): PosterLayers {
  const out: string[] = ["", "", "", ""];
  const rows: string[][] = [[], [], [], []];
  const lines: number[][] = [new Array<number>(g.cols), new Array<number>(g.cols), new Array<number>(g.cols), new Array<number>(g.cols)];
  for (let y = 0; y < g.rows; y++) {
    const last = [-1, -1, -1, -1];
    for (let L = 0; L < 4; L++) lines[L].fill(32);
    for (let x = 0; x < g.cols; x++) {
      const i = (y * g.cols + x) << 2;
      const gl = g.b[i];
      if (gl === 0) continue;
      const L = LAYER_OF_TONE[g.b[i + 1] & 15];
      if (L === 255) continue;
      lines[L][x] = CODES[gl];
      last[L] = x;
    }
    for (let L = 0; L < 4; L++) rows[L].push(String.fromCharCode(...lines[L].slice(0, last[L] + 1)));
  }
  for (let L = 0; L < 4; L++) {
    let e = rows[L].length;
    while (e > 0 && rows[L][e - 1] === "") e--;
    out[L] = rows[L].slice(0, e).join("\n");
  }
  return { dim: out[0], mid: out[1], hot: out[2], spark: out[3] };
}

/** Hay alguna celda con fondo explícito (bit1)? El póster SSR de `cover` no puede usar `bg`. */
export function countExplicitBg(g: Cells): number {
  let n = 0;
  for (let i = 3; i < g.b.length; i += 4) if (g.b[i] & 2) n++;
  return n;
}

// ---------- la clase ----------

/** La rejilla con dueño: implementa `Cells` (b/u compartidos) y delega en las funciones libres de arriba. */
export class Grid implements Cells {
  cols: number;
  rows: number;
  b: Uint8Array;
  u: Uint32Array;

  constructor(cols: number, rows: number) {
    const c = makeCells(cols, rows);
    this.cols = cols;
    this.rows = rows;
    this.b = c.b;
    this.u = c.u;
  }

  resize(cols: number, rows: number): this {
    const c = makeCells(cols, rows);
    this.cols = cols;
    this.rows = rows;
    this.b = c.b;
    this.u = c.u;
    return this;
  }

  clear(bg: number = 0): this {
    clear(this, bg);
    return this;
  }
  copyFrom(src: Cells): this {
    copyCells(this, src);
    return this;
  }
  blit(src: Cells, dx: number = 0, dy: number = 0): this {
    blit(this, src, dx, dy);
    return this;
  }
  overlay(src: Cells, dx: number = 0, dy: number = 0): this {
    overlay(this, src, dx, dy);
    return this;
  }
  put(x: number, y: number, glyph: number | string, fg: number, bg: number = -1): this {
    put(this, x, y, typeof glyph === "number" ? glyph : gi(glyph), fg, bg);
    return this;
  }
  get(x: number, y: number): { glyph: number; fg: number; bg: number; flags: number } {
    const i = (y * this.cols + x) << 2;
    return { glyph: this.b[i], fg: this.b[i + 1], bg: this.b[i + 2], flags: this.b[i + 3] };
  }
  tone(x: number, y: number, fg: number): this {
    setTone(this, x, y, fg);
    return this;
  }
  bgTone(x: number, y: number, bg: number): this {
    setBg(this, x, y, bg);
    return this;
  }
  fill(x: number, y: number, w: number, h: number, glyph: number | string, fg: number, bg: number = -1): this {
    fill(this, x, y, w, h, typeof glyph === "number" ? glyph : gi(glyph), fg, bg);
    return this;
  }
  fillBg(x: number, y: number, w: number, h: number, bg: number): this {
    fillBg(this, x, y, w, h, bg);
    return this;
  }
  text(x: number, y: number, s: string, fg: number, bg: number = -1): this {
    text(this, x, y, s, fg, bg);
    return this;
  }
  textC(cx: number, y: number, s: string, fg: number, bg: number = -1): this {
    textCentered(this, cx, y, s, fg, bg);
    return this;
  }
  box(x: number, y: number, w: number, h: number, style: keyof typeof BOX, fg: number, bg: number = -1): this {
    box(this, x, y, w, h, style, fg, bg);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, fg: number, o: StrokeOpts = {}): this {
    line(this, x0, y0, x1, y1, fg, o);
    return this;
  }
  poly(pts: readonly (readonly [number, number])[], fg: number, o: PolyOpts = {}): this {
    poly(this, pts, fg, o);
    return this;
  }
  toText(): string {
    return toText(this);
  }
  toTones(which: 1 | 2 = 1): string {
    return toTones(this, which);
  }
  toLayers(): PosterLayers {
    return toLayers(this);
  }
  hash(): string {
    return hashCells(this);
  }
}
