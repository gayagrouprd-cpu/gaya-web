// Tinta MEDIDA de cada glifo de fuente (ink.gen.ts) y lo que se deriva de ella: para las pruebas, el barrido de visores, la medida EFECTIVA de
// luminancia y el colapso del póster SSR. No entra en el JS de primera carga del navegador (nadie del motor lo importa).
import { GLYPHS } from "../glyphs.ts";
import { INK_PERMILLE } from "./ink.gen.ts";
import { RAMP_CHARS } from "./ramp.ts";

const INK = new Map<string, number>(INK_PERMILLE as readonly [string, number][]);

/** Tinta medida de un carácter (milésimas del área de la celda); 0 si no está en la tabla (el espacio). */
export const inkOf = (ch: string): number => INK.get(ch) ?? 0;

/** Tinta media (milésimas) de cada peldaño de la rampa: lo que ve el ojo. */
export const LEVEL_INK: readonly number[] = RAMP_CHARS.map((pool) => {
  let s = 0;
  for (const c of pool) s += inkOf(c);
  return s / pool.length;
});

/**
 * Cobertura de tinta 0..1 de cada glifo de la lista única, por índice: los ASCII y `· ¯` salen de la medida; bloques, cuadrantes, sombras y octavos
 * son geométricos (cuadrante = 1/4 por bit, `░ ▒ ▓` = 25 · 50 · 75 %, octavos = n/8); las cajas y diagonales, un trazo fino (0,15).
 */
export const GLYPH_INK: Float32Array = (() => {
  const a = new Float32Array(GLYPHS.length);
  const QUARTERS: Record<string, number> = { "▘": 1, "▝": 1, "▖": 1, "▗": 1, "▀": 2, "▄": 2, "▌": 2, "▐": 2, "▚": 2, "▞": 2, "▙": 3, "▛": 3, "▜": 3, "▟": 3, "█": 4 };
  for (let i = 1; i < GLYPHS.length; i++) {
    const c = GLYPHS[i];
    const code = c.charCodeAt(0);
    if (i <= 96) a[i] = (INK.get(c) ?? 0) / 1000;
    else if (QUARTERS[c] !== undefined) a[i] = QUARTERS[c] / 4;
    else if (c === "░") a[i] = 0.25;
    else if (c === "▒") a[i] = 0.5;
    else if (c === "▓") a[i] = 0.75;
    else if (code >= 0x2581 && code <= 0x2587) a[i] = (code - 0x2580) / 8;
    else if (code >= 0x2589 && code <= 0x258f) a[i] = (0x2590 - code) / 8;
    else a[i] = 0.15;
  }
  return a;
})();
