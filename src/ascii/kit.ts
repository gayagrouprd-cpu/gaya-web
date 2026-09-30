// Kit de escena del motor ASCII (DIRECTION §5.5, §6.3, §6.8 y §12.4). Las piezas comunes que las cuatro manos de escenas
// (WP6–WP9) usan para no pisarse: agua, bruma, cara + aro + bisel, sombra, halo, distancia, anillos, ruido azul.
//
// PUREZA (§6.3). Todo lo de este archivo es determinista y corre en Node sin DOM:
//   · sin Math.random, sin reloj, sin DOM;
//   · en la ruta del fotograma `still` solo enteros y aritmética + − × ÷ (IEEE-754 la define bit a bit), más Math.sqrt
//     (también exacta por IEEE) y tablas enteras. PROHIBIDO Math.sin/cos/pow/exp/log aquí: la gaussiana de la bruma es la
//     tabla entera GAUSS[256] y los senos son `sinp`/`cosp` (polinomios, noise.ts);
//   · sin arreglos ni buffers nuevos en las funciones por cuadro (mist, agua, bn, ringAmount, applyRings, paintFace, paintRing;
//     lo comprueba tests/ascii/alloc.test.mjs); halo, shadow, faceFn y edt sí asignan: se llaman UNA vez por tamaño, desde `build()`.
import type { Cells, GridSpec, Ring, Word } from "./types.ts";
import { G_DOT, G_FULL, glyphIndex } from "./glyphs.ts";
import { BLUENOISE_B64, BLUENOISE_N } from "./bluenoise.gen.ts";
import { QUAD, put } from "./grid.ts";
import { h2, hu, pgfbm } from "./noise.ts";

// ---------- utilidades numéricas POLINÓMICAS ----------

export const clamp = (v: number, a: number = 0, b: number = 1): number => (v < a ? a : v > b ? b : v);
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** smoothstep: 0 bajo `a`, 1 sobre `b`, curva cúbica entre ambos. */
export const smooth = (a: number, b: number, x: number): number => {
  const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
  return t * t * (3 - 2 * t);
};
/** Cúbica de entrada y salida (la marea avanza con esta curva). */
export const easeInOut = (t: number): number => {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  if (u < 0.5) return 4 * u * u * u;
  const k = 2 - 2 * u;
  return 1 - (k * k * k) / 2;
};
export const easeOutCubic = (t: number): number => {
  const k = 1 - clamp01(t);
  return 1 - k * k * k;
};
/**
 * Sustituto POLINÓMICO de easeOutExpo (la ignición de GAYA): 1 − (1−t)⁵. Sin Math.pow, así que vale en la ruta `still`.
 * Arranque rápido y cola larga como la exponencial (t = 0,5 → 0,969 en ambas; t = 0,2 → 0,67 frente a 0,75).
 */
export const easeOutExpo = (t: number): number => {
  const k = 1 - clamp01(t);
  return 1 - k * k * k * k * k;
};

// ---------- ruido azul (bn) ----------

const BN: Uint8Array = (() => {
  const s = atob(BLUENOISE_B64);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
})();
const BN_MASK = BLUENOISE_N - 1;
const BN_SHIFT = 5; // log2(32)

/**
 * Ruido azul 32×32 anclado a la CELDA (no al tiempo ni al píxel) + jitter de hash, 0..1 (nunca 1).
 * Cada bloque 32×32 se desplaza por un hash propio para que el periodo no se vea en una pantalla de 160 columnas; el jitter
 * (1/256) refina los 8 bits de la tabla. Dos llamadas con la misma (x, y) devuelven lo mismo en cualquier motor.
 */
export const bn = (x: number, y: number): number => {
  const hh = hu(x >> BN_SHIFT, y >> BN_SHIFT, 5);
  const xi = (x + hh) & BN_MASK;
  const yi = (y + (hh >>> 8)) & BN_MASK;
  return (BN[(yi << BN_SHIFT) | xi] + h2(x, y, 3)) / 256;
};

// ---------- gaussiana entera ----------

/**
 * GAUSS[i] = round(255 · e^(−8·i/255)) para i = 0..255 (argumento 0..8; e^−8 = 0,0003 ya es cero en 8 bits). Se construye con
 * aritmética entera de punto fijo (Q16) para no depender de Math.exp: 63512 = round(65536 · e^(−8/255)), calculado fuera del motor.
 */
export const GAUSS: Uint8Array = (() => {
  const t = new Uint8Array(256);
  let v = 65536;
  for (let i = 0; i < 256; i++) {
    t[i] = (v * 255 + 32768) >>> 16;
    v = (v * 63512) >>> 16;
  }
  return t;
})();
/** Factor para pasar el argumento x de e^(−x) a índice de GAUSS: 255 / 8. */
export const GAUSS_SCALE = 31.875;

// ---------- el agua: tesela periódica 64×64 (§6.8) ----------

export const TILE = 64;

/**
 * Hornea UNA vez (≈ 3–4 ms en escritorio) la tesela periódica de agua: cresta `(1 − |h|·K)³` de un fbm de gradiente periódico de 3
 * octavas con deformación de dominio. Todo con + − × y enteros: determinista entre motores; envuelve sin costura a 64.
 * El tiempo no recalcula ruido: solo desplaza la lectura (`agua`).
 */
export function bakeWaterTile(seed: number = 9): Uint8Array {
  const t = new Uint8Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const u = x / TILE;
      const v = y / TILE;
      // deformación de dominio (dos campos de gradiente de baja frecuencia) y cresta del ruido deformado = filamentos
      const q1 = pgfbm(u, v, 2, 2, seed + 3);
      const q2 = pgfbm(u + 0.5, v + 0.25, 2, 2, seed + 4);
      const h = pgfbm(u + 0.28 * q1, v + 0.28 * q2, 4, 3, seed + 9);
      let k = 1 - Math.abs(h) * RIDGE_K;
      k = k < 0 ? 0 : k;
      t[y * TILE + x] = Math.round(255 * k * k * k);
    }
  }
  return t;
}

/** Nitidez de la cresta: |h|·K = 1 anula el filamento; K mayor = filamentos más finos. */
const RIDGE_K = 2.0;

let WATER: Uint8Array | null = null;
/** La tesela por defecto (semilla 9), horneada en el primer uso y compartida por escenas, bruma y marea. */
export function waterTile(): Uint8Array {
  return WATER ?? (WATER = bakeWaterTile(9));
}
export const tile = waterTile;

/** Lectura bilineal con envoltura; (u, v) en texeles. */
function sample(tl: Uint8Array, u: number, v: number): number {
  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const fx = u - x0;
  const fy = v - y0;
  const xa = x0 & 63;
  const xb = (xa + 1) & 63;
  const ya = (y0 & 63) << 6;
  const yb = ((y0 + 1) & 63) << 6;
  const a = tl[ya | xa];
  const b = tl[ya | xb];
  const c = tl[yb | xa];
  const d = tl[yb | xb];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

// Texeles de tesela por columna (escala gruesa y fina) y deriva por segundo. La celda es 1:2: las filas se multiplican por
// `asp` para que las vetas sean isótropas en pantalla. Dos lecturas a escalas y velocidades distintas se suman (§6.8).
const A_SCALE = 0.9;
const B_SCALE = 1.5;
const A_DRIFT = 1.3;
const B_DRIFT = 0.9;

/** Agua 0..1 en la celda (c, r) al tiempo t: dos muestras bilineales de la tesela. Sin asignaciones. */
export function agua(tl: Uint8Array, c: number, r: number, t: number, asp: number = 2): number {
  const ra = r * asp;
  const w = (sample(tl, c * A_SCALE + t * A_DRIFT, ra * A_SCALE) * 0.62 + sample(tl, c * B_SCALE - t * B_DRIFT, ra * B_SCALE + 7.3) * 0.62) / 255;
  return w > 1 ? 1 : w;
}

// ---------- distancia euclídea anisótropa 1:2 ----------

const INF = 1e20;

/** Transformada de distancia 1D de Felzenszwalb y Huttenlocher sobre f con separación `h` entre muestras. */
function dt1d(f: Float64Array, n: number, h: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    const pq = q * h;
    let pv = v[k] * h;
    let s = (f[q] + pq * pq - (f[v[k]] + pv * pv)) / (2 * pq - 2 * pv);
    while (s <= z[k]) {
      k--;
      pv = v[k] * h;
      s = (f[q] + pq * pq - (f[v[k]] + pv * pv)) / (2 * pq - 2 * pv);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    const pq = q * h;
    while (z[k + 1] < pq) k++;
    const dx = pq - v[k] * h;
    d[q] = dx * dx + f[v[k]];
  }
}

/**
 * Distancia euclídea EXACTA (en anchos de celda) de cada celda de un lienzo `cols × rows` a la celda con tinta (máscara ≠ 0)
 * más cercana de la palabra, que se estampa con su esquina superior izquierda en (ox, oy). La celda es 1:2: un paso vertical
 * cuenta 2. Las celdas con tinta valen 0. Asigna memoria (se usa en `build`, no por cuadro).
 */
export function edt(w: Word, cols: number, rows: number, ox: number = 0, oy: number = 0): Float32Array {
  const n = Math.max(cols, rows);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const g = new Float64Array(cols * rows);
  for (let x = 0; x < cols; x++) {
    const wx = x - ox;
    for (let y = 0; y < rows; y++) {
      const wy = y - oy;
      f[y] = wx >= 0 && wy >= 0 && wx < w.cols && wy < w.rows && w.cells[wy * w.cols + wx] !== 0 ? 0 : INF;
    }
    dt1d(f, rows, 2, d, v, z);
    for (let y = 0; y < rows; y++) g[y * cols + x] = d[y];
  }
  const out = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) f[x] = g[y * cols + x];
    dt1d(f, cols, 1, d, v, z);
    for (let x = 0; x < cols; x++) out[y * cols + x] = Math.sqrt(d[x]);
  }
  return out;
}

// ---------- cara, aro y bisel ----------

/** Clases por celda (las de `SceneState.cls`): aire · cara · borde (aro) · sombra/halo. */
export const C_AIR = 0;
export const C_FACE = 1;
export const C_EDGE = 2;
export const C_AURA = 3;

export interface FaceInfo {
  /** Por celda de la palabra: 0 aire · 1 cara · 2 borde (parcial o llena a 1 celda del borde). */
  cls: Uint8Array;
  /** Por celda: distancia de vecindad (8 vecinas) a la celda no llena más cercana: 0 en parciales y aire, 1 en el aro… */
  dist: Int16Array;
  x0: number;
  y0: number;
  cols: number;
  rows: number;
}

/**
 * Clasifica la palabra en cara y aro y mide la distancia al borde. El aro se decide SIEMPRE por vecindad de celdas (nunca por
 * una distancia muestreada en el centro: así salen los dos lados, A.2 de cartel.md). Celdas parciales (máscara 1..14) y llenas
 * con una vecina no llena = borde; llenas a ≥ 2 celdas del borde = cara. (x0, y0) es la posición en la rejilla; la clasificación
 * es local a la palabra y se devuelve junto a ella para que la escena no la pierda.
 */
export function faceFn(w: Word, x0: number, y0: number): FaceInfo {
  const cols = w.cols;
  const rows = w.rows;
  const cls = new Uint8Array(cols * rows);
  const dist = new Int16Array(cols * rows);
  // distancia de ajedrez (8 vecinas) a la celda no llena; fuera de la palabra cuenta como no llena (0). Dos pasadas exactas.
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= cols || y >= rows ? 0 : dist[y * cols + x]);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (w.cells[i] !== 15) continue;
      dist[i] = 1 + Math.min(at(x - 1, y - 1), at(x, y - 1), at(x + 1, y - 1), at(x - 1, y));
    }
  }
  for (let y = rows - 1; y >= 0; y--) {
    for (let x = cols - 1; x >= 0; x--) {
      const i = y * cols + x;
      if (w.cells[i] !== 15) continue;
      const m = 1 + Math.min(at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x + 1, y));
      if (m < dist[i]) dist[i] = m;
    }
  }
  for (let i = 0; i < cols * rows; i++) {
    const m = w.cells[i];
    cls[i] = m === 0 ? C_AIR : m !== 15 ? C_EDGE : dist[i] <= 1 ? C_EDGE : C_FACE;
  }
  return { cls, dist, x0, y0, cols, rows };
}

/** ¿Hay tinta en el subpíxel (sx, sy) de la palabra? Hay 2×2 por celda (bit0=▘ bit1=▝ bit2=▖ bit3=▗); fuera = 0. */
function sub(w: Word, sx: number, sy: number): number {
  if (sx < 0 || sy < 0 || sx >= w.cols * 2 || sy >= w.rows * 2) return 0;
  return (w.cells[(sy >> 1) * w.cols + (sx >> 1)] >> (((sy & 1) << 1) | (sx & 1))) & 1;
}

/** Tonos del aro (§5.5 paso 2). Son parámetros porque el presupuesto de tono de §5.4 se ajusta por escena. */
export interface RingTones {
  /** Celda parcial y celda llena sin luz ni sombra directas. */
  edge: number;
  /** Celda parcial con vacío arriba o a la izquierda. */
  light: number;
  /** Celda llena con luz por arriba o la izquierda (bisel). */
  lit: number;
  /** Celda llena con el borde expuesto abajo o a la derecha (bisel). */
  dark: number;
}
export const RING_TONES: RingTones = { edge: 12, light: 14, lit: 13, dark: 9 };

/**
 * Tono del ARO en la celda (cx, cy) de la palabra (§5.5 paso 2). Parcial (máscara ≠ 15): T12, y T14 si algún subpíxel con tinta
 * tiene vacío arriba o a la izquierda (luz). Llena a 1 celda del borde: T12 con bisel — T13 si la luz le llega por arriba o la
 * izquierda, T9 si el borde expuesto es el de abajo o la derecha, T12 si ambos.
 */
export function bevel(w: Word, cx: number, cy: number, tones: RingTones = RING_TONES): number {
  const m = w.cells[cy * w.cols + cx];
  let lit = 0;
  let dark = 0;
  for (let k = 0; k < 4; k++) {
    if (((m >> k) & 1) === 0) continue;
    const sx = cx * 2 + (k & 1);
    const sy = cy * 2 + (k >> 1);
    if (sub(w, sx, sy - 1) === 0 || sub(w, sx - 1, sy) === 0) lit = 1;
    if (sub(w, sx, sy + 1) === 0 || sub(w, sx + 1, sy) === 0) dark = 1;
  }
  if (m !== 15) return lit ? tones.light : tones.edge;
  return lit && !dark ? tones.lit : dark && !lit ? tones.dark : tones.edge;
}

/** Estampa el aro de la palabra en la rejilla: cuadrante de la celda parcial o `█` de la llena a 1 del borde, con `bevel`. */
export function paintRing(g: Cells, w: Word, x0: number, y0: number, face: FaceInfo, tones: RingTones = RING_TONES): void {
  for (let y = 0; y < w.rows; y++) {
    for (let x = 0; x < w.cols; x++) {
      const i = y * w.cols + x;
      if (face.cls[i] !== C_EDGE) continue;
      const m = w.cells[i];
      put(g, x0 + x, y0 + y, m === 15 ? G_FULL : QUAD[m], bevel(w, x, y, tones));
    }
  }
}

export interface FaceOpts {
  /** Tono base de la cara (8 = cartel de agua, 9 = ECO y VER). */
  base: number;
  tile: Uint8Array;
  t: number;
  /** Contraste de las cáusticas 0..1 (1 = pleno; 0 = cara plana). */
  caustic?: number;
  /** Fracción llena del vidrio 0..1; omitido = sin vidrio (toda la cara es agua). Ver `waterLevel`. */
  level?: number;
  /** Tono del vidrio vacío sobre el nivel (T2, o T1 si se quiere más oscuro). */
  glass?: number;
  /** Celdas por encima de este tope se recortan (p. ej. para pozos locales); 15 = sin tope. */
  cap?: number;
}

/**
 * Fila del menisco de un vidrio con nivel `level` (0..1): por encima, vidrio vacío; en esta fila, menisco; por debajo,
 * agua luminosa. `level ≥ 1` devuelve y0 − 1 (todo lleno, sin menisco) y `level ≤ 0` devuelve y0 + filas (todo vidrio).
 */
export function waterLevel(w: Word, y0: number, level: number): number {
  if (level >= 1) return y0 - 1;
  if (level <= 0) return y0 + w.rows;
  return y0 + w.rows - Math.round(level * w.rows);
}

// DESVIACIÓN de §5.5 paso 6 (que dice `~`/`=` en T14): el menisco es una línea de luz T14 que separa el vidrio vacío del agua. Con
// `~` sobre el fondo T0 (la portada no usa `bg`, por el póster SSR) cada celda se veía en la revisión a la vista como un agujero
// negro con un garabato dentro del vidrio; el medio bloque inferior `▄`/`▅` (alternando por columna para que ondule) deja la línea
// de luz pegada al agua de abajo y el vidrio oscuro arriba.
const G_SURF_A = glyphIndex("▄");
const G_SURF_B = glyphIndex("▅");

/**
 * Estampa la CARA (celdas llenas a ≥ 2 del borde): tono = base + round(1,5·agua·cáustica + 1,2·profundidad) (§5.5 paso 1).
 * Con `level`: vidrio vacío `█` T2 sobre el nivel y fila de menisco `▄`/`▅` en T14 (paso 6, ver la nota de arriba).
 */
export function paintFace(g: Cells, w: Word, x0: number, y0: number, face: FaceInfo, o: FaceOpts): void {
  const caustic = o.caustic === undefined ? 1 : o.caustic;
  const glass = o.glass === undefined ? 2 : o.glass;
  const cap = o.cap === undefined ? 15 : o.cap;
  const hasLevel = o.level !== undefined;
  const yWater = hasLevel ? waterLevel(w, y0, o.level as number) : y0 - 1;
  const meniscus = hasLevel && (o.level as number) > 0 && (o.level as number) < 1;
  for (let y = 0; y < w.rows; y++) {
    const sy = y0 + y;
    for (let x = 0; x < w.cols; x++) {
      const i = y * w.cols + x;
      if (face.cls[i] !== C_FACE) continue;
      const sx = x0 + x;
      if (hasLevel && sy < yWater) {
        put(g, sx, sy, G_FULL, glass);
        continue;
      }
      if (meniscus && sy === yWater) {
        put(g, sx, sy, ((sx + (sy << 1)) & 1) === 0 ? G_SURF_A : G_SURF_B, 14);
        continue;
      }
      let prof = (face.dist[i] - 2) * 0.5;
      prof = prof < 0 ? 0 : prof > 1 ? 1 : prof;
      let tone = o.base + Math.round(1.5 * caustic * agua(o.tile, sx, sy, o.t) + 1.2 * prof);
      tone = tone > cap ? cap : tone > 15 ? 15 : tone;
      put(g, sx, sy, G_FULL, tone);
    }
  }
}

// ---------- sombra proyectada y halo ----------

const G_SHADE_L = glyphIndex("░");
const G_SHADE_M = glyphIndex("▒");
const G_COLON = glyphIndex(":");

/** ¿Glifo de masa (cuadrante, bloque, octavo)? Las capas de atmósfera nunca lo pisan: «nunca sobre otra palabra». */
export function isSolidGlyph(gl: number): boolean {
  return (gl >= 97 && gl <= 111) || (gl >= 115 && gl <= 126);
}

/**
 * Sombra proyectada (§5.5 paso 3): las celdas VACÍAS cuyo (x − 2, y − 1) tiene tinta reciben `░` en T4 (desplazamiento
 * +2 columnas, +1 fila). No pisa glifos de masa (otra palabra) ni las celdas con tinta de la propia palabra.
 */
export function shadow(g: Cells, w: Word, x0: number, y0: number): void {
  for (let y = 0; y < w.rows + 1; y++) {
    for (let x = 0; x < w.cols + 2; x++) {
      const sx = x - 2;
      const sy = y - 1;
      const src = sx >= 0 && sy >= 0 && sx < w.cols && sy < w.rows && w.cells[sy * w.cols + sx] !== 0;
      if (!src) continue;
      const own = x < w.cols && y < w.rows ? w.cells[y * w.cols + x] : 0;
      if (own !== 0) continue;
      const gx = x0 + x;
      const gy = y0 + y;
      if (gx < 0 || gy < 0 || gx >= g.cols || gy >= g.rows) continue;
      if (isSolidGlyph(g.b[(gy * g.cols + gx) << 2])) continue;
      put(g, gx, gy, G_SHADE_L, 4);
    }
  }
}

/**
 * Halo (§5.5 paso 4): las celdas vacías a ≤ `radius` anchos de celda de la palabra (distancia euclídea 1:2) reciben bruma de
 * glifos `▒ ░ : ·` EN PRIMER PLANO (sin `bg`, para que el póster SSR sea fiel): T3 hasta radius/4, T2 hasta radius/2, T1 más allá.
 * Es aditivo: no oscurece lo que ya hay (mantiene el tono mayor) y no pisa masa. Asigna memoria: llamar desde `build`.
 */
export function halo(g: Cells, w: Word, x0: number, y0: number, radius: number = 4): void {
  const R = radius;
  const mx = Math.ceil(R) + 1;
  const my = (Math.ceil(R) >> 1) + 1;
  const fc = w.cols + 2 * mx;
  const fr = w.rows + 2 * my;
  const dd = edt(w, fc, fr, mx, my);
  for (let j = 0; j < fr; j++) {
    for (let i = 0; i < fc; i++) {
      const d = dd[j * fc + i];
      if (d <= 0 || d > R) continue;
      const gx = x0 - mx + i;
      const gy = y0 - my + j;
      if (gx < 0 || gy < 0 || gx >= g.cols || gy >= g.rows) continue;
      const k = (gy * g.cols + gx) << 2;
      const old = g.b[k];
      if (isSolidGlyph(old)) continue;
      const tone = d <= R * 0.25 ? 3 : d <= R * 0.5 ? 2 : 1;
      if (old !== 0 && g.b[k + 1] >= tone) continue;
      const v = 1 - d / (R + 1) + (bn(gx, gy) - 0.5) * 0.45;
      const gl = v > 0.72 ? G_SHADE_M : v > 0.5 ? G_SHADE_L : v > 0.3 ? G_COLON : v > 0.12 ? G_DOT : 0;
      if (gl === 0) continue;
      put(g, gx, gy, gl, tone);
    }
  }
}

// ---------- bruma ----------

export interface MistOpts {
  /** Centro y radios (en celdas) de la elipse de bruma; a un radio la intensidad cae a e^−1,6 = 20 %. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Ganancia 0..n de la densidad (la llegada abre la bruma de 0 a 1; `dawn` la sube). */
  gain: number;
  /** Tono máximo de la bruma (6 normalmente; `dawn` lo sube un tono). */
  cap: number;
  /** Tope de tono por celda de los pozos: la bruma se recorta ahí para no ensuciar el texto. */
  wells?: Uint8Array | null;
}

const MIST_GLYPHS: readonly number[] = [G_DOT, G_COLON, G_SHADE_L, G_SHADE_M, glyphIndex("▓")];

/**
 * Bruma de luz (§5.5 paso 5): d = (0,15 + 0,85·cresta) · e^(−(dx² + dy²)·1,6) con la cresta de `agua`; glifo `· : ░ ▒ ▓` según
 * d (< 0,16 · 0,24 · 0,34 · 0,5), tono T3–T6, el 15 % de los puntos omitidos por hash, viñeta hacia las esquinas. La gaussiana
 * es la tabla entera GAUSS. Escribe solo en primer plano (sin `bg`). Sin asignaciones. No limpia la rejilla: pinta encima.
 */
export function mist(g: Cells, spec: GridSpec, o: MistOpts, t: number, tl: Uint8Array): void {
  const cols = spec.cols;
  const rows = spec.rows;
  const irx = 1 / o.rx;
  const iry = 1 / o.ry;
  const gain = o.gain;
  const cap = o.cap;
  const wells = o.wells ?? null;
  const hx = cols * 0.5;
  const hy = rows * 0.5;
  const ihx = 1 / hx;
  const ihy = 1 / hy;
  for (let y = 0; y < rows; y++) {
    const dy = (y - o.cy) * iry;
    const dy2 = dy * dy;
    const vy = (y - hy) * ihy;
    for (let x = 0; x < cols; x++) {
      const dx = (x - o.cx) * irx;
      const xg = (dx * dx + dy2) * 1.6;
      if (xg >= 8) continue;
      if (hu(x, y, 11) < 644245094) continue; // el 15 % de los puntos se omite (0,15 · 2³²)
      const vx = (x - hx) * ihx;
      const vig = 1 - 0.3 * (vx * vx + vy * vy);
      const m = (0.15 + 0.85 * agua(tl, x, y, t)) * (GAUSS[(xg * GAUSS_SCALE) | 0] / 255) * gain * vig;
      if (m < 0.03) continue; // con ganancia 0 (la bruma aún cerrada) no sale ni un punto suelto
      // el ruido azul difumina los umbrales de glifo: la bruma sale como gradiente punteado, no como manchas de bloques
      const d = m + (bn(x, y) - 0.5) * 0.16;
      if (d < 0.05) continue;
      const gl = d < 0.16 ? 0 : d < 0.24 ? 1 : d < 0.34 ? 2 : d < 0.5 ? 3 : 4;
      let tone = 3 + ((d * 6) | 0);
      if (tone > cap) tone = cap;
      if (wells !== null && tone > wells[y * cols + x]) tone = wells[y * cols + x];
      if (tone < 1) continue;
      put(g, x, y, MIST_GLYPHS[gl], tone);
    }
  }
}

// ---------- anillos (toque, foco, eco) ----------

/**
 * Intensidad 0..1 de un anillo `r` en la celda (x, y): una banda de `width` anchos de celda alrededor de la circunferencia de
 * radio age·speed (la celda es 1:2: dy se dobla para que el anillo se vea circular) que se desvanece a los `life` segundos.
 * Valores por defecto = los del toque (§6.6: 28 celdas/s durante 1,2 s).
 */
export function ringAmount(r: Ring, x: number, y: number, speed: number = 28, width: number = 2.5, life: number = 1.2): number {
  const fade = 1 - r.age / life;
  if (fade <= 0) return 0;
  const dx = x - r.x;
  const dy = (y - r.y) * 2;
  const e = Math.abs(Math.sqrt(dx * dx + dy * dy) - r.age * speed) / width;
  if (e >= 1) return 0;
  const k = 1 - e;
  return k * k * (3 - 2 * k) * fade;
}

/**
 * Sube el tono de las celdas con glifo dentro de cada anillo vivo: +`gain`·intensidad tonos (tope `max`). Solo recorre el
 * rectángulo de la corona. Sin asignaciones. Es la reacción de «toque» y «foco» común a todas las escenas.
 */
export function applyRings(g: Cells, rings: readonly Ring[], gain: number = 2, max: number = 15, speed: number = 28, width: number = 2.5, life: number = 1.2): void {
  for (let n = 0; n < rings.length; n++) {
    const r = rings[n];
    if (r.age >= life) continue;
    const R = r.age * speed + width;
    const x0 = Math.max(0, Math.floor(r.x - R));
    const x1 = Math.min(g.cols - 1, Math.ceil(r.x + R));
    const y0 = Math.max(0, Math.floor(r.y - R / 2));
    const y1 = Math.min(g.rows - 1, Math.ceil(r.y + R / 2));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const k = (y * g.cols + x) << 2;
        if (g.b[k] === 0) continue;
        const a = ringAmount(r, x, y, speed, width, life);
        if (a <= 0) continue;
        const tn = g.b[k + 1] + Math.round(gain * a);
        g.b[k + 1] = tn > max ? max : tn;
      }
    }
  }
}
