// Rampa de densidad del estilo oficial «Duotono» (docs/ascii/KIT.md): glifos ASCII ordenados por la TINTA REAL de Geist Mono 500
// (ink.gen.ts, medida con tests/ascii/tools/measure-ramp.mjs con el mismo método que atlas.ts), no por la clásica de memoria
// (` .:-=+*#%@` está desordenada: `:` 5,7 y `-` 5,6 valen lo mismo y entre `*` 15,0 y `#` 27,6 hay un salto de 12,6 puntos).
//
// Diez peldaños (0 = solo fondo). Cada peldaño es un POZO de cuatro glifos de tinta casi igual (se elige por hash de la celda): así una
// zona del mismo valor no sale como un renglón `=====` (lo que WP6 descartó por «tabla»), sino como una textura de texto.
//
// `~` y `^` NO están en la rampa: son del menisco, las crestas de las olas y la espuma de la marea (el papel pintado de `~^~^` que dejaba
// la bruma y la pared en la primera versión se leía como estática). El orden por tinta de la rampa lo comprueba tests/ascii/scenes.test.mjs.
import { glyphIndex } from "../glyphs.ts";

export const LEVELS = 10;

/** Los cuatro glifos de cada peldaño (0..9), con su tinta medida (% del área de la celda). */
export const RAMP_CHARS: readonly (readonly string[])[] = [
  [" ", " ", " ", " "],
  [".", "·", ".", "."], //  2,9
  [":", "-", ":", "'"], //  5,7 · 5,6 · 6,0
  [";", ";", "\"", ";"], //  7,7 · 11,6
  ["+", "=", "+", "="], // 13,0 · 12,3
  ["*", "x", "*", "+"], // 15,0 · 18,1 · 13,0
  ["x", "*", "x", "X"], // 18,1 · 15,0 · 24,8
  ["X", "x", "#", "X"], // 24,8 · 27,6
  ["#", "#", "%", "X"], // 27,6 · 29,7
  ["%", "@", "%", "@"], // 29,7 · 35,7
];

/** Tabla plana `peldaño·4 + (hash & 3)` → índice de glifo. */
export const DUO_RAMP: Uint8Array = (() => {
  const t = new Uint8Array(LEVELS * 4);
  for (let l = 0; l < LEVELS; l++) for (let k = 0; k < 4; k++) t[l * 4 + k] = glyphIndex(RAMP_CHARS[l][k]);
  return t;
})();

/** Glifo del peldaño `level` (0..9) con el hash `h` de la celda. Sin asignaciones. */
export const rampGlyph = (level: number, h: number): number => DUO_RAMP[((level < 0 ? 0 : level > 9 ? 9 : level) << 2) | (h & 3)];
