// Póster SSR de la portada (DIRECTION §6.9): el fotograma `still` cuantizado a 4 capas de tono, SIN `bg`.
//
// Corre en Node durante el build de Astro y en las pruebas: la escena `cover` pinta con la misma `paint()` que el motor en vivo,
// así que el póster es estructuralmente el mismo dibujo. NO es idéntico celda por celda al de 16 tonos (cuantiza a 4) y no se
// promete que lo sea; lo que se comprueba (T6) es que capa y glifo coinciden con la cuantización del fotograma del motor.
//
// La portada oficial (estilo Duotono) pinta su masa con el FONDO de cada celda: `posterCollapse` lo convierte en una rejilla sin `bg` con el mismo reparto
// de masa y `renderPosterLayersDuo` la cuantiza a las 4 capas de siempre. `renderPosterLayers` (sin colapso) queda para las escenas que no usan `bg`.
//
// Las cuatro cadenas salen SIN escapar: `<`, `&` y `"` son glifos ASCII válidos. Quien las ponga en `data-art` debe escaparlas.
import type { Cells, Frame, GridSpec, Lang, Scene, WordSet } from "./types.ts";
import { STILL_T } from "./types.ts";
import type { PosterLayers } from "./grid.ts";
import { makeCells, clear, toLayers } from "./grid.ts";
import { G_FULL } from "./glyphs.ts";
import { GLYPH_INK } from "./scenes/ink.ts";

export type { PosterLayers };
export { POSTER_TONES, LAYER_NAMES, LAYER_OF_TONE, toneLayer, toLayers, countExplicitBg } from "./grid.ts";

/** Fotograma de referencia del `still`: p = 1, t = STILL_T, sin energía, sin calor, sin anillos, sin pozos. */
export function stillFrame(): Frame {
  return { p: 1, t: STILL_T, e: 0, heat: null, rings: [], cap: null, still: true };
}

/** Pinta el fotograma `still` de la escena en una rejilla nueva (limpia a T0 antes: `paint` escribe toda la pantalla). */
export function renderStill(scene: Scene, spec: GridSpec, lang: Lang, words: WordSet[]): Cells {
  const st = scene.build(spec, lang, words);
  const g = makeCells(spec.cols, spec.rows);
  clear(g, 0);
  scene.paint(g, st, stillFrame());
  return g;
}

/**
 * Las 4 capas de tono del póster de la escena a (spec, lang, words): `dim` (T1–T5), `mid` (T6–T9), `hot` (T10–T12) y `spark`
 * (T13–T15), cada una con la MISMA rejilla de `spec.cols × spec.rows` celdas y un espacio donde la celda no pertenece a esa
 * capa. Nunca mira `bg`. El color que lleva cada capa en el CSS es `POSTER_TONES` (= T4 · T8 · T11 · T14).
 */
export function renderPosterLayers(scene: Scene, spec: GridSpec, lang: Lang, words: WordSet[]): { dim: string; mid: string; hot: string; spark: string } {
  return toLayers(renderStill(scene, spec, lang, words));
}

// ---------- póster de una escena con `bg` (el estilo Duotono) ----------

/** Cobertura de tinta desde la que un carácter conserva su glifo en el póster (14 %: `x * X # % @`); por debajo, la celda pasa a masa. */
const DENSE = 0.14;
/** Tono de fondo mínimo para que una celda cuente como masa luminosa (T4: la bruma, de fondo T0–T3, solo conserva sus caracteres). */
const MIN_BG = 4;

/**
 * Colapsa `bg` en el glifo, en una rejilla que se descarta (no toca la escena ni su fotograma vivo). `toLayers` solo mira glifo y primer plano y el estilo Duotono
 * pinta la masa con el fondo: sin más, las paredes (un espacio sobre un fondo) desaparecen y GAYA queda como un contorno de cuadrantes con cuatro caracteres.
 *   · celda con fondo claro (≥ T4) y poco carácter (tinta < 14 %, o espacio): pasa a bloque `█` del tono del fondo (la masa luminosa);
 *   · celda con fondo claro y carácter denso (`x * X # % @`): conserva el carácter en su tono (el brillo de las cáusticas);
 *   · celda con fondo oscuro (< T4: la bruma, la sombra): conserva el carácter y pierde el fondo (queda sobre T0, como el resto de la portada).
 * Las dos reglas de masa dependen solo del glifo y del fondo de la celda: la paridad con el motor es estructural (el mismo `still` y la misma cuantización a 4 tonos).
 */
export function posterCollapse(g: Cells): void {
  const b = g.b;
  for (let i = 0; i < b.length; i += 4) {
    const bg = b[i + 2];
    b[i + 3] &= 1; // sin bandera de fondo explícito (también las celdas con bg = T0 pintado a propósito)
    if (bg === 0) continue;
    const gl = b[i];
    if (bg >= MIN_BG && (gl === 0 || GLYPH_INK[gl] < DENSE)) {
      // masa: bloque lleno del tono del fondo (si el glifo era un bloque o un cuadrante de la escena, también vale)
      const isBlock = gl >= 97;
      if (!isBlock) {
        b[i] = G_FULL;
        b[i + 1] = bg;
      }
    }
    b[i + 2] = 0;
    if (b[i] !== 0) b[i + 3] = 1;
  }
}

/**
 * `renderPosterLayers` para una escena con `bg` (la portada oficial): el `still`, colapsado (`posterCollapse`) y cuantizado a las 4 capas de siempre (`dim`, `mid`,
 * `hot`, `spark`), con la misma firma. PosterSsr.astro lo usa; no añade una capa de HTML.
 */
export function renderPosterLayersDuo(scene: Scene, spec: GridSpec, lang: Lang, words: WordSet[]): PosterLayers {
  const g = renderStill(scene, spec, lang, words);
  posterCollapse(g);
  return toLayers(g);
}
