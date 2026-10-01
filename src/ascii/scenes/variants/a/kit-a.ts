// Kit de la Variante A · Duotono ANSI. Cada celda de una superficie es un glifo de la rampa medida (ramp.ts) en un tono de primer plano CLARO
// sobre un tono de fondo MÁS OSCURO de la misma familia: la masa sigue siendo luminosa y sólida (el fondo la rellena) y los caracteres se ven.
//
// Mismas reglas de pureza que kit.ts (§6.3): sin Math.random, reloj ni DOM; en la ruta del fotograma `still` solo enteros, + − × ÷ y tablas
// (nada de Math.sin/cos/pow/exp); sin arreglos ni buffers nuevos en lo que se llama por cuadro (mistA, putDuo).
import type { Cells, GridSpec } from "../../common.ts";
import { GAUSS, GAUSS_SCALE, agua, bn, fogAt, fogTile, glyphIndex, hu, put, smooth } from "../../common.ts";
import { RAMP } from "./ramp.ts";

/** Escribe una celda duotono: glifo del peldaño `level` (hash `h`), primer plano `fg` sobre fondo `bg`. Sin asignaciones. */
export function putDuo(g: Cells, x: number, y: number, level: number, h: number, fg: number, bg: number): void {
  put(g, x, y, RAMP[((level < 0 ? 0 : level > 9 ? 9 : level) << 2) | (h & 3)], fg > 15 ? 15 : fg < 0 ? 0 : fg, bg > 15 ? 15 : bg < 0 ? 0 : bg);
}

// ---------- bruma de caracteres ----------

/**
 * Escalera de la bruma (peldaño 1..9): peldaño de la rampa, tono del glifo y tono del fondo. La luz sube junto con la densidad del carácter
 * (`.` en el borde, `*` junto a la palabra) y el fondo sube un tono cada dos peldaños: halo luminoso hecho de texto. Tope T6 (pozo `ink`).
 */
const M_GL = Uint8Array.from([0, 1, 2, 2, 3, 3, 3, 4, 4, 4]);
const M_FG = Uint8Array.from([0, 3, 4, 4, 4, 5, 5, 6, 6, 6]);
const M_BG = Uint8Array.from([0, 0, 0, 1, 1, 2, 2, 3, 3, 3]);
const MIST_STEPS = 9;
const MIST_JITTER = 0.5;
const BG_JITTER = 1.1;
const MIST_VIGNETTE = 0.9;
/** Polvo de luz fuera de la bruma: celdas sueltas con un punto, alternando por hash. */
const DUST: Uint8Array = Uint8Array.from([".", "'", "·", "."], (c) => glyphIndex(c));

export interface MistAOpts {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gain: number;
  /** Tono máximo del glifo de la bruma (6; `dawn` lo sube). */
  cap: number;
  wells?: Uint8Array | null;
  field?: Uint8Array | null;
  fieldGain?: number;
  heat?: Float32Array | null;
  wisp?: number;
  /** Con `false` no se pinta el fondo de la bruma (solo caracteres). */
  bg?: boolean;
}

/**
 * Bruma de caracteres: la misma luz que `mist` de kit.ts (elipse gaussiana + campo que emana de la palabra, jirones de niebla y viñeta), pero
 * cuantizada a la rampa de densidad en duotono en vez de a `░▒▓`. Bajo un pozo (`wells` < 15) el peldaño se topa: debajo del texto solo hay
 * puntos y dos puntos (calma), nunca cruces ni almohadillas. Sin asignaciones; no limpia la rejilla.
 */
export function mistA(g: Cells, spec: GridSpec, o: MistAOpts, t: number, tl: Uint8Array): void {
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
  const useBg = o.bg !== false;
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
      const m = (base * (0.12 + 0.88 * f) + glow * (0.55 + 0.45 * f)) * vig * gain * (y < 3 ? 0.4 + 0.2 * y : 1);
      if (m < 0.01) continue;
      let L = (m * MIST_STEPS + 0.5 + (bn(x, y) - 0.5) * MIST_JITTER * 2) | 0;
      if (L > MIST_STEPS) L = MIST_STEPS;
      if (L === 1) L = 0; // el peldaño 1 (`.` T3) es casi invisible: pasa a polvo, el borde de la bruma se funde sin una celda más
      const hh = hu(x, y, 13);
      let fg: number;
      let bg: number;
      let gl: number;
      // el fondo cambia de tono con poco ruido azul propio (no con el del glifo): los bordes del halo salen suaves, sin escalones rectos ni un
      // mosaico de celdas T0/T1 (con más ruido el halo se leía como píxeles)
      let LB = (m * MIST_STEPS + 0.5 + (bn(x + 11, y + 7) - 0.5) * BG_JITTER) | 0;
      LB = LB < 0 ? 0 : LB > MIST_STEPS ? MIST_STEPS : LB;
      if (L < 1) {
        // polvo: más allá del borde de la bruma, un punto suelto con probabilidad creciente hacia ella
        bg = useBg ? M_BG[LB] : 0;
        if (wells !== null && bg > wells[i]) bg = wells[i];
        if ((hh & 1023) >= m * 1600) continue;
        gl = DUST[(hh >>> 10) & 3];
        fg = 4;
      } else {
        let lv = M_GL[L];
        fg = M_FG[L];
        bg = useBg ? M_BG[LB] : 0;
        if (L >= 4 && (hh & 3) === 1 && agua(tl, x, y, t) > 0.88) fg += 1; // chispa donde pasa una cáustica
        if (wells !== null && wells[i] < 15) {
          const wc = wells[i];
          const lmax = wc >= 6 ? 4 : wc >= 4 ? 2 : 1;
          if (lv > lmax) lv = lmax;
        }
        gl = RAMP[(lv << 2) | ((hh >>> 4) & 3)];
      }
      if (fg > cap) fg = cap;
      if (wells !== null) {
        const wc = wells[i];
        if (fg > wc) fg = wc;
        if (bg > wc) bg = wc;
      }
      if (fg < 1 && bg < 1) continue;
      put(g, x, y, gl, fg, bg > 0 ? bg : -1);
    }
  }
}

/**
 * Densidad de acento 0,45..1 según el aire que deja la palabra: §5.4 limita el tono del primer plano al 12 % de la pantalla y una palabra que cubre mucha
 * pantalla (1600×900 a 12×25: 23 %; móvil estrecho: 27 %) con un carácter claro en cada celda se pasaría. Con 14 % de cobertura o menos vale 1.
 */
export function accentDensity(inkCells: number, cols: number, rows: number): number {
  const cov = inkCells / (cols * rows);
  const d = 0.14 / (cov > 0.01 ? cov : 0.01);
  return d > 1 ? 1 : d < 0.45 ? 0.45 : d;
}

/**
 * Pared del aro (celda llena a una del borde): en la base es un bloque `█` del tono `tone` (7 al borde con sombra · 8 neutro · 10 con luz). Aquí
 * el fondo ES ese tono (la masa y la luz de borde no cambian) y encima salen caracteres SUELTOS dos tonos más claros: más densos y más
 * frecuentes donde da la luz (`x *`, 6 de cada 10 celdas), más ligeros donde no (`= +`, `~ ;`). Un carácter cada dos celdas se ve como texto sobre
 * una masa sólida; con un carácter en todas, la pared se convertía en ruido. La piel del aro (cuadrantes) sigue siendo limpia: ella dibuja la silueta.
 */
export function putWall(g: Cells, x: number, y: number, tone: number, h: number, dens: number = 1): void {
  const lit = tone >= 10;
  const thr = (lit ? 154 : tone >= 8 ? 128 : 102) * dens; // celdas con carácter de cada 256
  if (((h >>> 8) & 255) >= thr) {
    put(g, x, y, 0, tone, tone > 15 ? 15 : tone);
    return;
  }
  putDuo(g, x, y, lit ? 6 : tone >= 8 ? 4 : 3, h, lit ? tone : tone + 2, tone);
}
