// Póster SSR de la Variante A (sin JS): cómo se degrada una escena con `bg`. `toLayers` (grid.ts) solo mira el glifo y el primer plano, y la escena
// pinta su masa con el FONDO del duotono: sin más, las paredes del aro (espacio sobre T8) desaparecen y GAYA queda como un contorno de cuadrantes con
// cuatro caracteres sueltos (probado: no se lee). `posterCollapse` convierte la rejilla de 16 tonos con `bg` en otra SIN `bg` y con el mismo reparto
// de masa, para que `toLayers` la cuantice a las 4 capas de siempre (dim · mid · hot · spark; ni una capa de HTML más):
//   · celda con fondo claro (≥ T4) y poco carácter (tinta < 14 %, o espacio): pasa a bloque `█` del tono del fondo (la masa luminosa);
//   · celda con fondo claro y carácter denso (`x * X # % @`): conserva el carácter en su tono (el brillo de las cáusticas);
//   · celda con fondo oscuro (< T4: la bruma): conserva el carácter y pierde el fondo (queda sobre T0, como el resto de la portada).
import type { Cells, GridSpec, Lang, Scene, WordSet } from "../../common.ts";
import type { PosterLayers } from "../../../grid.ts";
import { G_FULL, glyphIndex } from "../../common.ts";
import { toLayers } from "../../../grid.ts";
import { renderStill } from "../../../ssr.ts";
import { INK_PERMILLE } from "./ramp.gen.ts";
import { GLYPHS } from "../../../glyphs.ts";

const INK = new Uint8Array(GLYPHS.length);
{
  const byChar = new Map<string, number>(INK_PERMILLE as readonly [string, number][]);
  for (let i = 1; i < GLYPHS.length; i++) INK[i] = Math.min(255, Math.round((byChar.get(GLYPHS[i]) ?? 0) / 4)); // milésimas / 4: 14 % = 35
}
const DENSE = 35; // 14 %
const G_SPACE = glyphIndex(" ");
const MIN_BG = 4;

/** Colapsa `bg` en el glifo (ver arriba). Escribe en `g` (copia que se descarta): no toca la escena ni su fotograma vivo. */
export function posterCollapse(g: Cells): void {
  const b = g.b;
  for (let i = 0; i < b.length; i += 4) {
    const bg = b[i + 2];
    b[i + 3] &= 1; // sin bandera de fondo explícito (también las celdas con bg = T0 pintado a propósito)
    if (bg === 0) continue;
    const gl = b[i];
    if (bg >= MIN_BG && (gl === G_SPACE || INK[gl] < DENSE)) {
      // masa: bloque lleno del tono del fondo (si el glifo era una sombra o un bloque propio de la escena, también vale)
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
 * `renderPosterLayers` de ssr.ts para una escena con `bg`: el `still`, colapsado (`posterCollapse`) y cuantizado a las 4 capas de siempre (`dim`, `mid`,
 * `hot`, `spark`), con la misma firma. PosterSsr.astro (WP10) la usa en lugar de `renderPosterLayers` cuando la portada es la de la variante.
 */
export function renderPosterLayersA(scene: Scene, spec: GridSpec, lang: Lang, words: WordSet[]): PosterLayers {
  const g = renderStill(scene, spec, lang, words);
  posterCollapse(g);
  return toLayers(g);
}
