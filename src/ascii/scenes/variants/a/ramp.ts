// Rampa de densidad de la Variante A · Duotono ANSI: glifos ASCII ordenados por la TINTA REAL de Geist Mono 500 (ramp.gen.ts, medida con
// tests/ascii/tools/measure-ramp-a.mjs con el mismo método que atlas.ts), no por la clásica de memoria (` .:-=+*#%@` está desordenada:
// `:` 5,7 y `-` 5,6 valen lo mismo y entre `*` 15,0 y `#` 27,6 hay un salto de 12,6 puntos).
//
// Diez peldaños (0 = solo fondo). Cada peldaño es un POZO de cuatro glifos de tinta casi igual (se elige por hash de la celda): así una
// zona del mismo valor no sale como un renglón `=====` (lo que WP6 descartó por «tabla»), sino como una textura de texto. La tinta de cada
// pozo (milésimas del área de la celda, 9×18 a dpr 2) sale de la tabla medida; `ramp.test` comprueba que crece peldaño a peldaño.
import { INK_PERMILLE } from "./ramp.gen.ts";
import { glyphIndex } from "../../common.ts";

export const LEVELS = 10;

/** Los cuatro glifos de cada peldaño (0..9). Los símbolos `. : - = + * # % @` más `~ ; ^ '` y las cruces `x X` que rellenan el salto 15 → 27. */
export const RAMP_CHARS: readonly (readonly string[])[] = [
  [" ", " ", " ", " "],
  [".", "·", ".", "."], //  2,9
  [":", "-", ":", "'"], //  5,6
  ["~", ";", "~", "^"], //  8,2 (7,7 · 10,1)
  ["+", "=", "+", "~"], // 13,0 · 12,3 (· 8,2)
  ["*", "x", "*", "+"], // 15,0 · 18,1 · 13,0
  ["x", "*", "x", "X"], // 18,1 (· 15,0 · 24,8)
  ["X", "x", "#", "X"], // 24,8
  ["#", "#", "%", "X"], // 27,6 · 29,7
  ["%", "@", "%", "@"], // 29,7 · 35,7
];

/** Tabla plana `peldaño·4 + (hash & 3)` → índice de glifo. */
export const RAMP: Uint8Array = (() => {
  const t = new Uint8Array(LEVELS * 4);
  for (let l = 0; l < LEVELS; l++) for (let k = 0; k < 4; k++) t[l * 4 + k] = glyphIndex(RAMP_CHARS[l][k]);
  return t;
})();

/** Glifo del peldaño `level` (0..9) con el hash `h` de la celda. Sin asignaciones. */
export const rampGlyph = (level: number, h: number): number => RAMP[((level < 0 ? 0 : level > 9 ? 9 : level) << 2) | (h & 3)];

/** Tinta medida de un carácter (milésimas del área de la celda); 0 si no está en la tabla (el espacio). */
const INK = new Map<string, number>(INK_PERMILLE as readonly [string, number][]);
export const inkOf = (ch: string): number => INK.get(ch) ?? 0;

/** Tinta media (milésimas) de cada peldaño: lo que ve el ojo. */
export const LEVEL_INK: readonly number[] = RAMP_CHARS.map((pool) => {
  let s = 0;
  for (const c of pool) s += inkOf(c);
  return s / pool.length;
});
