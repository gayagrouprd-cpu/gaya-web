// Variante B · «El agua hecha del nombre». La rampa de densidad incluye las letras de la marca: ' ·:=*yaAG▒▓█'.
//
// Orden y pasos medidos, no supuestos: la TINTA de cada glifo es la cobertura de píxeles de Geist Mono 500 (el mismo texto que dibuja
// atlas.ts: size = cw / 0,6, baseline centrada) a la celda 9×18@2 (`node tests/ascii/tools/ink-b.mjs`; a los otros cinco tamaños de celda
// el orden no cambia, la prueba lo vigila). Los bloques `▒ ▓ █` se dibujan por código: 50 · 75 · 100 %.
//
// Regla de uso (identidad de B): puntuación en la bruma (`· : = *`), letras en las caras por zona de luz (`y a` zonas medias, `A G` solo
// en las crestas), bloques solo en los puntos más calientes y en el aro. Las letras NO se reparten al azar: la selección es por luz y
// se mezcla con ruido azul de poca amplitud (meseta + costura estrecha, R05 §2.4), así que cada letra ocupa una banda coherente.
import { glyphIndex } from "../../common.ts";

export const NAME_RAMP = " ·:=*yaAG▒▓█";
/** Número de pasos de la rampa. */
export const K = 12;
/** Tinta medida (fracción de la celda) de cada paso, a 9×18@2. */
export const INK: readonly number[] = [0, 0.029, 0.057, 0.123, 0.15, 0.207, 0.232, 0.261, 0.298, 0.5, 0.75, 1];
export const RAMP_GL: Uint8Array = Uint8Array.from([...NAME_RAMP].map((c) => (c === " " ? 0 : glyphIndex(c))));

// índices de la rampa con significado
export const S_DOT = 1;
export const S_COLON = 2;
export const S_EQ = 3;
export const S_STAR = 4;
export const S_Y = 5;
export const S_A = 6;
export const S_AA = 7; // A mayúscula
export const S_G = 8;
export const S_BLOCK_M = 9; // ▒
export const S_BLOCK_D = 10; // ▓
export const S_BLOCK_F = 11; // █

/** Glifos sueltos de apoyo (todos ASCII o de la lista única). */
export const G_Y_UP = glyphIndex("Y");
export const G_A_UP = glyphIndex("A");
export const G_G_UP = glyphIndex("G");
export const G_a = glyphIndex("a");
export const G_y = glyphIndex("y");
export const G_TILDE = glyphIndex("~");
export const G_o = glyphIndex("o");
export const G_O = glyphIndex("O");
export const G_ZERO = glyphIndex("0");
export const G_DOT = glyphIndex("·");
export const G_PERIOD = glyphIndex(".");
export const G_APOS = glyphIndex("'");
export const G_COLON = glyphIndex(":");
export const G_SEMI = glyphIndex(";");
export const G_DASH = glyphIndex("-");
export const G_EQ = glyphIndex("=");
export const G_PLUS = glyphIndex("+");
export const G_STAR = glyphIndex("*");
export const G_SHADE_L = glyphIndex("░");
export const G_SHADE_M = glyphIndex("▒");
export const G_SHADE_D = glyphIndex("▓");
export const G_FULL = glyphIndex("█");

/**
 * Posición fraccionaria de luz → paso de la rampa. `u` ∈ [0, K−1] (parte entera = paso, parte fraccionaria = cuánto sube al siguiente);
 * `th` ∈ [0, 1) es el umbral del ruido azul de la celda. `seam` < 1 estrecha la costura: la mitad de las celdas de un peldaño
 * quedan puras (mesetas de una sola letra) y solo el borde entre dos peldaños mezcla las dos letras.
 */
export const rampStep = (u: number, th: number, seam: number): number => {
  if (u <= 0) return 0;
  if (u >= K - 1) return K - 1;
  const lo = u | 0;
  const f = u - lo;
  return f > 0.5 + (th - 0.5) * seam ? lo + 1 : lo;
};

/**
 * Luz de la cara v → posición en la rampa. v ≤ 1 recorre de ` ` a `G` en pasos iguales (8 pasos); lo que pasa de 1 es calor: sube a los
 * bloques `▒ ▓ █` (v = 1,25 → `█`). Con ello los bloques solo salen donde la luz rebasa a la letra más densa.
 */
export const lightToU = (v: number): number => (v <= 1 ? v * S_G : S_G + (v - 1) * 12);

/** Tono de una celda de letra con luz v: crece con la luz. `lo`/`hi` son los tonos en v = 0 y v = 1. */
export const toneOfLight = (v: number, lo: number, hi: number): number => {
  const t = Math.round(lo + (hi - lo) * (v < 0 ? 0 : v > 1.2 ? 1.2 : v));
  return t < 1 ? 1 : t > 15 ? 15 : t;
};

/**
 * Tonos del aro de B (el aro es la piel de cuadrantes; la pared del aro es tela de letras). Más oscuros que `RING_TONES` de la base: la tela de
 * letras y las crestas ya gastan T≥9 y T≥11 del presupuesto (§5.4), y el aro de la base se llevaba por sí solo la mitad.
 */
export const B_RING = { edge: 8, skin: 8, light: 10, lit: 10, dark: 7 } as const;
