// CONTRATOS del motor ASCII (docs/ascii/DIRECTION.md §6.3 y §12.4).
// Cambiarlos exige acuerdo de todos los paquetes de trabajo que los usan.

export type Lang = 'es' | 'en';
export type SceneId = 'cover' | 'hola' | 'mist' | 'web' | 'listo' | 'eco' | 'on' | 'ver' | 'tu';
export type Variant = 'L' | 'M' | 'S' | 'XS' | 'mini' | 'proc';

/** Identificadores de palabra: ES `GAYA·HOLA·WEB·LISTO·ECO·ON·VER·TU`, EN `GAYA·HELLO·WEB·READY·ECHO·ON·SEE·YOU`. */
export type WordId = 'GAYA' | 'HOLA' | 'WEB' | 'LISTO' | 'ECO' | 'ON' | 'VER' | 'TU' | 'HELLO' | 'READY' | 'ECHO' | 'SEE' | 'YOU';

export interface GridSpec {
  cols: number;
  rows: number; // celdas del motor, tras el tier
  cw: number;
  ch: number; // px de dispositivo, enteros; ch = round(--ch · dpr) del CSS (≈ 2·cw; a ≥ 1600 px es 12×25 CSS, no 12×24)
  cssCw: number;
  cssCh: number; // px CSS de la celda (6×12 · 9×18 · 12×25, o agrandada por el tier)
  dpr: number; // dpr efectivo (≤ 2; ≤ 1,5 en tier low)
}

/** Palabra de cuadrantes: cada celda 0..15 (bit0=▘ bit1=▝ bit2=▖ bit3=▗). */
export interface Word {
  cols: number;
  rows: number;
  accentRows: number; // filas extra de acento (TÚ) contadas dentro de `rows`
  cells: Uint8Array; // cols·rows
}
/** Una palabra puede ser una pila de varias líneas (móvil); `offsets` = desplazamiento en columnas de cada línea. */
export interface WordSet {
  variant: Variant;
  lines: Word[];
  offsets: number[];
}

/** Rejilla de celdas: 4 bytes por celda [glifo, tono fg, tono bg, banderas]; `u` es la misma memoria como Uint32. */
export interface Cells {
  cols: number;
  rows: number;
  b: Uint8Array;
  u: Uint32Array;
}

export interface Ring {
  x: number;
  y: number;
  age: number; // celdas, segundos
}

export interface Frame {
  p: number; // llegada 0..1 POR TIEMPO; 1 = estado final (= still)
  t: number; // fase del agua (s); avanza con la energía y se duerme
  e: number; // energía de scroll 0..1
  heat: Float32Array | null; // calor del puntero por celda (cols·rows) o null
  rings: Ring[]; // anillos de toque/foco vivos (≤ 3)
  cap: Uint8Array | null; // tope de tono por celda (pozos); el MOTOR lo aplica después de pintar
  still: boolean;
}

/** Por celda: 0 aire · 1 cara · 2 borde · 3 sombra/halo (lo usa la marea para deshacer y formar). */
export interface SceneState {
  cls: Uint8Array;
}

export interface Scene {
  id: SceneId;
  dawn: number; // 0..1 (§5.4)
  arrival: { ms: number }; // duración del guion de llegada
  /** 1 vez por tamaño e idioma; puro; corre en Node. */
  build(spec: GridSpec, lang: Lang, words: WordSet[]): SceneState;
  /** PURA en (p, t, e, heat, rings): sin DOM, sin Math.random; escribe TODA la pantalla. */
  paint(g: Cells, s: SceneState, f: Frame): void;
}

/** Fotograma «final» de referencia: mismo valor que STILL_TIME de la portada anterior. */
export const STILL_T = 21.7;

/** Tonos de la paleta Cobalto: T0 (fondo) … T15 (chispa). */
export const TONES = 16;
