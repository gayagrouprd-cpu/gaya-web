// Variante B · materia de las escenas: bruma de PUNTUACIÓN real (· . ' : - = + *), aro de luz con pared de letras y sombra proyectada.
// Copia adaptada de kit.mist / kit.paintRing: mismo reparto de luz (elipse gaussiana + luz que emana de la palabra + niebla + viñeta,
// ruido azul anclado a la celda), pero la escalera de la bruma ya no son tramas dibujadas por código (`░▒▓`) sino glifos de la fuente.
//
// Pureza (§6.3): paint solo con enteros, `+ − ×` y las tablas enteras del kit (GAUSS, bn, fogAt); nada de Math.sin/pow/exp/random.
import type { Cells, GridSpec } from "../../common.ts";
import { GAUSS, GAUSS_SCALE, fogAt, fogTile, h2, hu, put, smooth, agua } from "../../common.ts";
import {
  G_APOS, G_COLON, G_DASH, G_DOT, G_EQ, G_PERIOD, G_PLUS, G_SEMI, G_STAR,
} from "./ramp.ts";

export interface MistBOpts {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gain: number;
  cap: number;
  wells?: Uint8Array | null;
  field?: Uint8Array | null;
  fieldGain?: number;
  heat?: Float32Array | null;
  wisp?: number;

  /** Fondo mínimo bajo la bruma: tono máximo del resplandor de bg (0 = ninguno; 1–2 = el aura azul que rodea la palabra). */
  bgGlow?: number;
}

/**
 * Escalera de la bruma: 10 peldaños (glifo base, tono) ordenados por la luz que aporta cada uno (tinta medida × luminancia del tono).
 * Cada peldaño tiene un glifo de refuerzo de tinta parecida que sale en el 30 % de las celdas (por hash de la celda): `: / ;`, `= / + / -`,
 * `* / +`, `· / . / '`. Con eso el degradado no forma renglones idénticos (el defecto de la exploración `?face=glyph` de WP6).
 */
const MIST_GL: readonly number[] = [0, G_DOT, G_DOT, G_COLON, G_COLON, G_COLON, G_EQ, G_EQ, G_PLUS, G_PLUS];
const MIST_TN: readonly number[] = [0, 3, 4, 3, 4, 4, 3, 4, 4, 5];
/** Refuerzo por peldaño (se elige con 2 bits del hash; 0 = el glifo base). */
const MIST_ALT: readonly (readonly number[])[] = [
  [0],
  [G_DOT, G_PERIOD, G_APOS, G_DOT],
  [G_DOT, G_PERIOD, G_COLON, G_APOS],
  [G_COLON, G_PERIOD, G_SEMI, G_DOT],
  [G_COLON, G_DASH, G_SEMI, G_PERIOD],
  [G_COLON, G_SEMI, G_PLUS, G_PERIOD],
  [G_EQ, G_COLON, G_PLUS, G_DASH],
  [G_EQ, G_PLUS, G_COLON, G_DASH],
  [G_PLUS, G_EQ, G_COLON, G_STAR],
  [G_PLUS, G_EQ, G_PLUS, G_STAR],
];
const DUST: readonly number[] = [G_DOT, G_PERIOD, G_APOS, G_DOT];
const MIST_STEPS = 9;
const MIST_JITTER = 0.5;
const MIST_VIGNETTE = 0.9;

/**
 * Bruma de puntuación (§5.5 punto 5, versión B). Solo primer plano (sin `bg`). Sin asignaciones. No limpia la rejilla.
 */
export function mistB(g: Cells, spec: GridSpec, o: MistBOpts, t: number, tl: Uint8Array): void {
  const cols = spec.cols;
  const rows = spec.rows;
  const irx = 1 / o.rx;
  const iry = 1 / o.ry;
  const gain = o.gain;
  const cap = o.cap;
  const wells = o.wells ?? null;
  const field = o.field ?? null;
  const fgain = (o.fieldGain ?? 1) / 255;
  const wisp = o.wisp ?? 0;
  const heat = o.heat ?? null;
  const bgGlow = o.bgGlow ?? 0;
  const fog = fogTile();
  const hx = cols * 0.5;
  const hy = rows * 0.5;
  const ihx = 1 / hx;
  const ihy = 1 / hy;
  for (let y = 0; y < rows; y++) {
    const dy = (y - o.cy) * iry;
    const dy2 = dy * dy;
    const vy = (y - hy) * ihy;
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dx = (x - o.cx) * irx;
      const xg = (dx * dx + dy2) * 1.6;
      const base = xg >= 8 ? 0 : GAUSS[(xg * GAUSS_SCALE) | 0] * (1 / 255);
      let glow = field === null ? 0 : field[i] * fgain;
      if (heat !== null && heat[i] > 0.03) glow += heat[i] * 0.7;
      if (base + glow < 0.02) continue;
      const vx = (x - hx) * ihx;
      const vig = 1 - MIST_VIGNETTE * smooth(0.2, 1.7, vx * vx + vy * vy);
      let f = fogAt(fog, x, y, t);
      if (wisp > 0) f += wisp * (0.22 + 0.78 * smooth(0.35, 0.8, f) - f);
      const m = (base * (0.12 + 0.88 * f) + glow * (0.55 + 0.45 * f)) * vig * gain;
      if (m < 0.01) continue;
      if (bgGlow > 0) {
        const bt = m > 0.85 ? bgGlow : m > 0.3 ? bgGlow - 1 : 0;
        if (bt > 0) {
          const kk = i << 2;
          g.b[kk + 2] = bt;
          g.b[kk + 3] |= 2;
        }
      }
      let L = (m * MIST_STEPS + 0.5 + (h2(x, y, 17) - 0.5) * MIST_JITTER * 2) | 0;
      if (L > MIST_STEPS) L = MIST_STEPS;
      if (L === 1) L = 0; // el peldaño 1 es casi invisible: el borde de la bruma se funde en el polvo
      const hh = hu(x, y, 13);
      let tone: number;
      let gl: number;
      if (L < 1) {
        if ((hh & 1023) >= m * 1600) continue;
        gl = DUST[(hh >>> 10) & 3];
        tone = 4;
      } else {
        tone = MIST_TN[L];
        gl = (hh >>> 12) % 10 < 5 ? MIST_ALT[L][(hh >>> 16) & 3] : MIST_GL[L];
        if (L >= 2 && (hh & 3) === 1 && agua(tl, x, y, t) > 0.88) tone += 2;
      }
      if (tone > cap) tone = cap;
      if (wells !== null && tone > wells[i]) tone = wells[i];
      if (tone < 1) continue;
      put(g, x, y, gl, tone);
    }
  }
}
