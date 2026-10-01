// Lo que las escenas (WP6–WP9) importan para no pisarse: el kit entero, el ruido, las primitivas de rejilla y unas pocas
// utilidades de escena. Una escena SOLO necesita `import { … } from "./common.ts"`.
//
// Patrón de una escena rápida (R05 §3.5): `build()` hornea por tamaño las capas caras y estáticas (caras, aro, sombra, halo) en
// una rejilla aparte y deriva `cls`; `paint()` limpia, copia/superpone la capa horneada y pinta solo lo que depende de (p, t, e,
// heat, rings). `paint` no puede leer el reloj ni Math.random; en la ruta `still` (p = 1, t = STILL_T) solo enteros y polinomios.
import type { Cells, Frame, GridSpec, SceneState, Word, WordSet } from "../types.ts";
import type { FaceInfo } from "../kit.ts";
import { C_AURA, C_AIR } from "../kit.ts";

export * from "../kit.ts";
export * from "../noise.ts";
export * from "../grid.ts";
export * from "../glyphs.ts";
export { STILL_T, TONES } from "../types.ts";
export type { Cells, Frame, GridSpec, Lang, Ring, Scene, SceneId, SceneState, Variant, Word, WordId, WordSet } from "../types.ts";
export { stillFrame, renderStill } from "../ssr.ts";

/** GridSpec de una celda CSS `cssCw × cssCh` a `dpr` (celda de dispositivo entera; a ≥ 1600 px la celda es 12×25, no 12×24). */
export function gridSpec(cols: number, rows: number, cssCw: number = 9, cssCh: number = cssCw * 2, dpr: number = 2): GridSpec {
  return { cols, rows, cw: Math.round(cssCw * dpr), ch: Math.round(cssCh * dpr), cssCw, cssCh, dpr };
}

/** Rejilla de un visor `w × h` px CSS con celda `cssCw × cssCh` (las de §5.2: 6×12 · 9×18 · 12×25). */
export function specForViewport(w: number, h: number, cssCw: number, cssCh: number, dpr: number = 2): GridSpec {
  return gridSpec(Math.floor(w / cssCw), Math.floor(h / cssCh), cssCw, cssCh, dpr);
}

/** Las dos rejillas de referencia: escritorio 1440×900 (160×50, celda 9×18) y móvil A07 360×800 (60×66, celda 6×12). */
export const specDesktop = (): GridSpec => gridSpec(160, 50, 9, 18, 2);
export const specMobile = (): GridSpec => gridSpec(60, 66, 6, 12, 2);

/** Un fotograma cualquiera (sin calor, sin anillos, sin pozos). */
export function makeFrame(p: number, t: number, e: number = 0, still: boolean = false): Frame {
  return { p, t, e, heat: null, rings: [], cap: null, still };
}

export function makeState(spec: GridSpec): SceneState {
  return { cls: new Uint8Array(spec.cols * spec.rows) };
}

/** Copia la clasificación de una palabra (cara/borde) al mapa `cls` de la pantalla en (x0, y0); solo escribe las celdas ≠ aire. */
export function stampCls(cls: Uint8Array, cols: number, rows: number, face: FaceInfo, x0: number = face.x0, y0: number = face.y0): void {
  for (let y = 0; y < face.rows; y++) {
    const sy = y0 + y;
    if (sy < 0 || sy >= rows) continue;
    for (let x = 0; x < face.cols; x++) {
      const sx = x0 + x;
      if (sx < 0 || sx >= cols) continue;
      const c = face.cls[y * face.cols + x];
      if (c !== C_AIR) cls[sy * cols + sx] = c;
    }
  }
}

/** Marca como sombra/halo (clase 3) las celdas con glifo de la capa horneada que todavía son aire: lo usa la marea. */
export function markAura(cls: Uint8Array, baked: Cells): void {
  for (let i = 0, j = 0; i < cls.length; i++, j += 4) if (cls[i] === C_AIR && baked.b[j] !== 0) cls[i] = C_AURA;
}

/** Columna izquierda que centra un ancho `w` en la rejilla. */
export const centerX = (cols: number, w: number): number => Math.floor((cols - w) / 2);

export interface PlacedLine {
  word: Word;
  x0: number;
  y0: number;
}

/**
 * Coloca las líneas de un WordSet (palabra o pila): centradas en la rejilla, una bajo otra con `gap` filas de aire y el
 * desplazamiento en columnas (`offsets`) de cada línea respecto del centro del conjunto.
 */
export function layoutLines(spec: GridSpec, set: WordSet, yTop: number, gap: number = 1): PlacedLine[] {
  let widest = 0;
  for (let i = 0; i < set.lines.length; i++) widest = Math.max(widest, set.lines[i].cols + (set.offsets[i] ?? 0));
  const out: PlacedLine[] = [];
  let y = yTop;
  for (let i = 0; i < set.lines.length; i++) {
    const w = set.lines[i];
    out.push({ word: w, x0: centerX(spec.cols, widest) + (set.offsets[i] ?? 0), y0: y });
    y += w.rows + gap;
  }
  return out;
}
