// Póster SSR de la portada (DIRECTION §6.9): el fotograma `still` cuantizado a 4 capas de tono, SIN `bg`.
//
// Corre en Node durante el build de Astro y en las pruebas: la escena `cover` pinta con la misma `paint()` que el motor en vivo,
// así que el póster es estructuralmente el mismo dibujo. NO es idéntico celda por celda al de 16 tonos (cuantiza a 4) y no se
// promete que lo sea; lo que se comprueba (T6) es que capa y glifo coinciden con la cuantización del fotograma del motor.
//
// Las cuatro cadenas salen SIN escapar: `<`, `&` y `"` son glifos ASCII válidos. Quien las ponga en `data-art` debe escaparlas.
import type { Cells, Frame, GridSpec, Lang, Scene, WordSet } from "./types.ts";
import { STILL_T } from "./types.ts";
import type { PosterLayers } from "./grid.ts";
import { makeCells, clear, toLayers } from "./grid.ts";

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
