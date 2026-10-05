// Kit del estilo oficial «Duotono» (docs/ascii/KIT.md). Cada celda de una superficie es un glifo de la rampa medida (ramp.ts) en un tono de primer
// plano CLARO sobre un fondo MÁS OSCURO de la misma familia: la masa sigue siendo luminosa y sólida (el fondo la rellena) y los caracteres se ven.
// Este archivo reúne lo que hacen falta para pintar un cartel así: `putDuo` (la celda), `putWall` (la pared del aro), `distField` (distancia a la
// letra), `bakeShadow` y `bakeAura` (sombra y aura pegadas al trazo), `mistDuo` (bruma de caracteres con racimos y huecos) y `accentDensity`.
//
// Mismas reglas de pureza que kit.ts (§6.3): sin Math.random, reloj ni DOM; en la ruta del fotograma `still` solo enteros, + − × ÷ y tablas
// (nada de Math.sin/cos/pow/exp); sin arreglos ni buffers nuevos en lo que se llama por cuadro (`mistDuo`, `putDuo`, `putWall`). Lo que asigna
// (`distField`, `bakeShadow`, `bakeAura`, `clusterField`) se llama UNA vez por tamaño, desde `build()`.
import type { Cells, GridSpec, Word } from "./common.ts";
import { GAUSS, GAUSS_SCALE, agua, bn, edt, fogAt, fogTile, glyphIndex, hu, put, smooth, vnoise } from "./common.ts";
import { DUO_RAMP } from "./ramp.ts";

/** Una palabra colocada en la rejilla (lo que devuelve `layoutLines`). */
export interface DuoLine {
  word: Word;
  x0: number;
  y0: number;
}

/** Escribe una celda duotono: glifo del peldaño `level` (hash `h`), primer plano `fg` sobre fondo `bg`. Sin asignaciones. */
export function putDuo(g: Cells, x: number, y: number, level: number, h: number, fg: number, bg: number): void {
  put(g, x, y, DUO_RAMP[((level < 0 ? 0 : level > 9 ? 9 : level) << 2) | (h & 3)], fg > 15 ? 15 : fg < 0 ? 0 : fg, bg > 15 ? 15 : bg < 0 ? 0 : bg);
}

// ---------- campos que se hornean en `build` ----------

/** Distancia (en anchos de celda, anisótropa 1:2) de cada celda de la rejilla a la tinta más cercana de cualquiera de las líneas. Asigna: solo `build`. */
export function distField(cols: number, rows: number, lines: readonly DuoLine[]): Float32Array {
  const out = new Float32Array(cols * rows).fill(1e9);
  for (let n = 0; n < lines.length; n++) {
    const d = edt(lines[n].word, cols, rows, lines[n].x0, lines[n].y0);
    for (let i = 0; i < out.length; i++) if (d[i] < out[i]) out[i] = d[i];
  }
  return out;
}

/** Luz que emana de la palabra, 0..255: la caída `1 / (1 + (d/s)²)` de `distField` (igual que `glowField` del kit, pero sobre una distancia ya calculada). */
export function glowFromDist(dist: Float32Array, s: number): Uint8Array {
  const out = new Uint8Array(dist.length);
  const s2 = 1 / (s * s);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(255 / (1 + dist[i] * dist[i] * s2));
  return out;
}

/**
 * Racimos de la bruma, 0..255 por celda: dos octavas de ruido de valor (manchas de ≈ 11 × 6 celdas con borde fino) cortadas por una rampa: bajo
 * `lo` no hay bruma (el hueco T0 entre racimos), sobre `hi` está a plena densidad. Con `clearBelow` (fila) la densidad se apaga hacia abajo
 * (la mitad inferior de la pantalla queda limpia para el texto). Asigna: solo `build`.
 */
export function clusterField(cols: number, rows: number, seed: number, lo: number, hi: number, clearBelow: number = rows): Uint8Array {
  const out = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    const fade = 1 - smooth(clearBelow - 4, clearBelow + 3, y);
    if (fade <= 0) continue;
    for (let x = 0; x < cols; x++) {
      const v = 0.62 * vnoise(x * 0.085, y * 0.17, seed) + 0.38 * vnoise(x * 0.27 + 31, y * 0.5 + 7, seed + 3);
      out[y * cols + x] = Math.round(255 * smooth(lo, hi, v) * fade);
    }
  }
  return out;
}

/** Máscara (1 = hay tinta de alguna línea) de la rejilla. Asigna: solo `build`. */
function inkMask(cols: number, rows: number, lines: readonly DuoLine[]): Uint8Array {
  const ink = new Uint8Array(cols * rows);
  for (const l of lines) {
    for (let y = 0; y < l.word.rows; y++) {
      for (let x = 0; x < l.word.cols; x++) {
        const sx = l.x0 + x;
        const sy = l.y0 + y;
        if (l.word.cells[y * l.word.cols + x] !== 0 && sx >= 0 && sy >= 0 && sx < cols && sy < rows) ink[sy * cols + sx] = 1;
      }
    }
  }
  return ink;
}

/**
 * Celdas de AIRE encerradas por la tinta (los contrapunzones de A, O, G…): lo que no alcanza una inundación de aire desde el borde de la rejilla. Con aura y bruma dentro, los
 * contrapunzones pequeños (en móvil, 2–3 celdas) se rellenan y la letra pierde su figura: se dejan T0. Asigna: solo `build`.
 */
export function enclosedCells(cols: number, rows: number, lines: readonly DuoLine[]): Uint8Array {
  const ink = inkMask(cols, rows, lines);
  const out = new Uint8Array(cols * rows).fill(1); // 1 = encerrada hasta que la inundación llegue
  const stack: number[] = [];
  const push = (i: number): void => {
    if (ink[i] === 0 && out[i] === 1) {
      out[i] = 0;
      stack.push(i);
    }
  };
  for (let x = 0; x < cols; x++) {
    push(x);
    push((rows - 1) * cols + x);
  }
  for (let y = 0; y < rows; y++) {
    push(y * cols);
    push(y * cols + cols - 1);
  }
  while (stack.length > 0) {
    const i = stack.pop() as number;
    const x = i % cols;
    if (x > 0) push(i - 1);
    if (x < cols - 1) push(i + 1);
    if (i >= cols) push(i - cols);
    if (i < cols * (rows - 1)) push(i + cols);
  }
  for (let i = 0; i < out.length; i++) if (ink[i] === 1) out[i] = 0;
  return out;
}

export interface ShadowCells {
  /** `x | y << 16` de cada celda de sombra. */
  pos: Int32Array;
  /** Umbral de aparición 0..255 (por hash): la sombra se forma celda a celda al final de la llegada. */
  rt: Uint8Array;
}

/**
 * Sombra proyectada de las líneas: las celdas VACÍAS cuyo (x − 1, y − 1) tiene tinta (desplazamiento de UNA celda en diagonal). Nunca sobre la
 * tinta de ninguna palabra. Asigna: solo `build`.
 */
export function bakeShadow(cols: number, rows: number, lines: readonly DuoLine[], dx: number = 1, dy: number = 1): ShadowCells {
  const ink = inkMask(cols, rows, lines);
  const pos: number[] = [];
  const rt: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const sx = x - dx;
      const sy = y - dy;
      if (ink[y * cols + x] === 1 || sx < 0 || sy < 0 || ink[sy * cols + sx] !== 1) continue;
      pos.push(x | (y << 16));
      rt.push(hu(x, y, 30) >>> 24);
    }
  }
  return { pos: Int32Array.from(pos), rt: Uint8Array.from(rt) };
}

export interface AuraCells {
  pos: Int32Array;
  /** 0 = pegada al trazo (a ≤ 1 ancho de celda), 1 = la siguiente capa (a ≤ 2). */
  tier: Uint8Array;
  /** Hash de la celda 0..255: decide si lleva un glifo. */
  rt: Uint8Array;
}

/**
 * Aura de luz pegada al trazo: las celdas vacías a ≤ `r1` anchos del trazo (capa 0) y a ≤ `r2` (capa 1), menos las que ya son sombra. Es el fondo `bg`
 * T6–T8 que da el brillo de borde de un rótulo de luz (el glifo de encima, suelto, lo decide `rt`). `skip` (opcional, p. ej. `enclosedCells`) = celdas sin aura. Asigna: solo `build`.
 */
export function bakeAura(dist: Float32Array, cols: number, rows: number, shadow: ShadowCells, r1: number = 1.01, r2: number = 2.01, skip: Uint8Array | null = null): AuraCells {
  const sh = new Uint8Array(cols * rows);
  for (let n = 0; n < shadow.pos.length; n++) sh[(shadow.pos[n] >> 16) * cols + (shadow.pos[n] & 0xffff)] = 1;
  const pos: number[] = [];
  const tier: number[] = [];
  const rt: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const d = dist[i];
      if (d <= 0 || d > r2 || sh[i] === 1 || (skip !== null && skip[i] === 1)) continue;
      pos.push(x | (y << 16));
      tier.push(d <= r1 ? 0 : 1);
      rt.push(hu(x, y, 33) >>> 24);
    }
  }
  return { pos: Int32Array.from(pos), tier: Uint8Array.from(tier), rt: Uint8Array.from(rt) };
}

// ---------- bruma de caracteres ----------

/** Por peldaño de la bruma (1..5): tono del glifo y tono del fondo (el fondo solo bajo un glifo; el hueco entre racimos es T0). */
const M_FG = Uint8Array.from([0, 3, 4, 5, 5, 6]);
const M_BG = Uint8Array.from([0, 0, 0, 1, 1, 2]);
const MIST_JITTER = 0.5;
const MIST_VIGNETTE = 0.9;
const MIST_PMAX = 0.72;
const G_STAR = glyphIndex("*");

export interface MistDuoOpts {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gain: number;
  /** Tono máximo del glifo de la bruma (6; `dawn` lo sube). */
  cap: number;
  wells?: Uint8Array | null;
  /** Luz que emana de la palabra (`glowFromDist`) y su peso. */
  field?: Uint8Array | null;
  fieldGain?: number;
  /** Racimos 0..255 (`clusterField`): 0 = hueco, 255 = densidad plena. `null` = sin racimos. */
  dens?: Uint8Array | null;
  heat?: Float32Array | null;
  wisp?: number;
  /** Luz (m) desde la que aparece el `*` de las estrellas junto a la palabra (1,7 por omisión; los velos de `mist` lo suben para que casi no haya). */
  starAt?: number;
  /** Fila desde la que la bruma se apaga hacia abajo (8 filas de caída): el sitio del texto queda limpio y el borde inferior es tenue, no brillante. */
  yFade?: number;
  /** Con `wash` > 0 las celdas del núcleo de la bruma que no llevan glifo reciben igualmente un fondo T1–T2 (la luz de los velos de `mist`: sin él se leen como manchas sueltas). */
  wash?: number;
}

/**
 * Bruma de caracteres: la luz de la elipse gaussiana y del campo que emana de la palabra, con niebla, viñeta y racimos, convertida en TEXTO. Cada celda
 * tiene un glifo con probabilidad creciente con la luz (ruido azul anclado a la celda: los racimos tienen huecos T0 entre ellos y la densidad cae hacia
 * fuera) y su peldaño `. : ; + *` (nunca `~ ^`: son de las olas) sube con la luz. Bajo un pozo (`wells` < 15) el peldaño se topa: debajo del texto solo
 * hay puntos y dos puntos. Sin asignaciones; no limpia la rejilla.
 */
export function mistDuo(g: Cells, spec: GridSpec, o: MistDuoOpts, t: number, tl: Uint8Array): void {
  const cols = spec.cols;
  const rows = spec.rows;
  const irx = 1 / o.rx;
  const iry = 1 / o.ry;
  const gain = o.gain;
  const cap = o.cap;
  const wells = o.wells ?? null;
  const field = o.field ?? null;
  const fgain = (o.fieldGain ?? 1) / 255;
  const wisp = o.wisp ?? 0;
  const heat = o.heat ?? null;
  const dens = o.dens ?? null;
  const wash = o.wash ?? 0;
  const starAt = o.starAt ?? 1.7;
  const yFade = o.yFade ?? rows;
  const fog = fogTile();
  const hx = cols * 0.5;
  const hy = rows * 0.5;
  const ihx = 1 / hx;
  const ihy = 1 / hy;
  for (let y = 0; y < rows; y++) {
    const dy = (y - o.cy) * iry;
    const dy2 = dy * dy;
    const vy = (y - hy) * ihy;
    const top = (y < 3 ? 0.4 + 0.2 * y : 1) * (0.25 + 0.75 * (1 - smooth(yFade, yFade + 9, y)));
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dn = dens === null ? 1 : dens[i] * (1 / 255);
      const dx = (x - o.cx) * irx;
      const xg = (dx * dx + dy2) * 1.6;
      const base = xg >= 8 ? 0 : GAUSS[(xg * GAUSS_SCALE) | 0] * (1 / 255);
      let glow = field === null ? 0 : field[i] * fgain;
      const hot = heat !== null && heat[i] > 0.03 ? heat[i] : 0;
      if (hot > 0) glow += hot * 0.7;
      if (base + glow < 0.02 || (dn <= 0 && hot === 0)) continue;
      const vx = (x - hx) * ihx;
      const vig = 1 - MIST_VIGNETTE * smooth(0.2, 1.7, vx * vx + vy * vy);
      let f = fogAt(fog, x, y, t);
      if (wisp > 0) f += wisp * (0.22 + 0.78 * smooth(0.35, 0.8, f) - f);
      const m = (base * (0.12 + 0.88 * f) + glow * (0.55 + 0.45 * f)) * vig * gain * top;
      if (m < 0.012) continue;
      // presencia: sube con la luz (curva de salida rápida) y con el racimo; el ruido azul reparte los glifos sin formar renglones
      let s = (m - 0.03) * 1.15;
      s = s < 0 ? 0 : s > 1 ? 1 : s;
      const pres = MIST_PMAX * s * (2 - s) * (hot > 0 ? 1 : dn);
      const wb = wash > 0 ? (m * wash > 0.95 ? 3 : m * wash > 0.5 ? 2 : m * wash > 0.26 ? 1 : 0) : 0;
      if (bn(x, y) >= pres) {
        if (wb > 0 && (wells === null || wells[i] >= wb)) put(g, x, y, 0, 0, wb);
        continue;
      }
      const hh = hu(x, y, 13);
      const mj = m + ((hh & 255) * (1 / 256) - 0.5) * MIST_JITTER * 0.5;
      let L = mj < 0.14 ? 1 : mj < 0.34 ? 2 : mj < 0.62 ? 3 : mj < starAt ? 4 : (hh >>> 18) & 3 ? 4 : 5;
      if (L > 1 && ((hh >>> 20) & 3) === 0) L--; // un peldaño menos en 1 de cada 4 celdas: la mezcla de glifos evita los renglones `=====`
      let fg = M_FG[L];
      const bg = M_BG[L] > wb ? M_BG[L] : wb;
      if (L >= 3 && (hh & 3) === 1 && agua(tl, x, y, t) > 0.88) fg += 1; // chispa donde pasa una cáustica
      if (wells !== null && wells[i] < 15) {
        const wc = wells[i];
        const lmax = wc >= 6 ? 3 : wc >= 4 ? 2 : 1;
        if (L > lmax) L = lmax;
      }
      if (fg > cap) fg = cap;
      let b = bg;
      if (wells !== null) {
        const wc = wells[i];
        if (fg > wc) fg = wc;
        if (b > wc) b = wc;
      }
      if (fg < 1) continue;
      put(g, x, y, L === 5 ? G_STAR : DUO_RAMP[(L << 2) | ((hh >>> 8) & 3)], fg, b > 0 ? b : -1);
    }
  }
}

/**
 * Densidad de acento 0,45..1 según el aire que deja la palabra: §5.4 limita el tono del primer plano al 12 % de la pantalla y una palabra que cubre mucha
 * pantalla (1600×900 a 12×25: 23 %; móvil estrecho: 27 %) con un carácter claro en cada celda se pasaría. Con 14 % de cobertura o menos vale 1.
 */
export function accentDensity(inkCells: number, cols: number, rows: number): number {
  const cov = inkCells / (cols * rows);
  const d = 0.14 / (cov > 0.01 ? cov : 0.01);
  return d > 1 ? 1 : d < 0.45 ? 0.45 : d;
}

// ---------- tono del glifo ----------

/**
 * Tono del primer plano de un glifo del peldaño `lv` sobre un fondo `bg` (la regla de polaridad del estilo): sobre un fondo oscuro (≤ T6) el glifo es CLARO (`bg + 3 + lv/2`,
 * nunca más de T8: §5.4 limita el primer plano de las caras y las paredes); sobre un fondo claro (≥ T7) el glifo es OSCURO (tres tonos menos: grabado en la masa), así que
 * nunca hay una zona donde el carácter y el fondo se confundan (T7 sobre T8) y la luz de la masa no baja. Los peldaños ≥ 7 de las cáusticas se tratan aparte (T10).
 */
export function inkTone(bg: number, lv: number): number {
  if (bg >= 7) return bg - 3 - (lv >= 6 ? 1 : 0);
  const f = bg + 3 + (lv >> 1);
  return f > 8 ? 8 : f;
}

// ---------- pared del aro ----------

const G_SPACE = glyphIndex(" ");

/**
 * Pared del aro (celda llena a una del borde): el fondo ES el tono `tone` de la base (7 al borde con sombra · 8 neutro · 10 con luz: la masa y el bisel no
 * cambian) y encima salen caracteres `: ; + =` TRES tonos más oscuros que el fondo (grabados en la pared: el primer plano de una pared nunca pasa de T8, §5.4,
 * y así la luz de la masa no baja). Una de cada tres celdas de cada fila lleva SIEMPRE un carácter (retícula `x + 2y ≡ 0 mod 3`: así no hay tres celdas seguidas
 * sin glifo), el resto con la probabilidad `dens` (0..1). La piel del aro (cuadrantes) sigue siendo limpia: ella dibuja la silueta.
 */
export function putWall(g: Cells, x: number, y: number, tone: number, h: number, dens: number = 1): void {
  const bg = tone > 15 ? 15 : tone;
  const forced = (x + 2 * y) % 3 === 0;
  if (!forced && ((h >>> 8) & 255) >= 200 * dens) {
    put(g, x, y, G_SPACE, bg, bg);
    return;
  }
  putDuo(g, x, y, forced ? 4 : 2 + ((h >>> 20) & 1), h, bg > 3 ? bg - 3 : 1, bg);
}
