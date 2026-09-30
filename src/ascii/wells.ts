// Pozos de lectura (DIRECTION §5.8, R06 §4.4): contraste por CONSTRUCCIÓN, no por inspección.
//
// Cada bloque de texto corto sobre arte declara un rectángulo con su clase (`ink` o `muted`). El motor topa el tono del
// arte dentro de ese rectángulo — `ink` a T6 (contraste ≥ 7,47 con --ink) y `muted` a T4 (≥ 6,22 con --muted) — y después de
// pintar aplica el mapa con `applyCap`. Reglas:
//   · fundido de 2 celdas FUERA del borde y NUNCA a cero: el tope mínimo es T1, el arte se integra con la página (R01 §5.6);
//   · margen proporcional a la velocidad: el pozo se ensancha min(8, ceil(|v|·dt / ch)) filas EN EL SENTIDO DEL MOVIMIENTO
//     del texto, porque el lienzo va 1–2 cuadros por detrás de un fling (CI-3);
//   · mientras energy > 0,5 el tope global del arte baja suavemente hasta T8;
//   · con prefers-contrast: more los topes son T4/T2.
// Todo son enteros sobre un Uint8Array por celda; no asigna memoria en `buildCap` ni en `applyCap`.
import type { Cells } from "./types.ts";

export interface CellRect {
  /** Esquina y tamaño en CELDAS, coordenadas de visor (pueden ser fraccionarias: se cubren todas las celdas tocadas). */
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "ink" | "muted";
}

/** El tope más bajo que existe: el arte queda en T1, nunca a cero. */
export const CAP_FLOOR = 1;
export const WELL_CAPS = { ink: 6, muted: 4 } as const;
export const WELL_CAPS_MORE = { ink: 4, muted: 2 } as const;
/** Celdas de fundido fuera del borde. */
export const FEATHER = 2;
export const MAX_INFLATE_ROWS = 8;
/** Tope global del arte cuando la energía de scroll es plena. */
export const ENERGY_CAP_MIN = 8;

export interface WellOpts {
  /** Tope global fuera de los pozos (15 = sin tope). */
  globalCap?: number;
  /** Velocidad de scroll en px/s CON signo: positiva = scrollY crece = el texto sube por la pantalla. */
  v?: number;
  /** Segundos de retraso del lienzo respecto del DOM (≈ el intervalo de cuadro). */
  dt?: number;
  /** Alto de la celda en px CSS. */
  ch?: number;
  /** Energía de scroll 0..1 (baja el tope global sobre 0,5). */
  energy?: number;
  /** prefers-contrast: more. */
  more?: boolean;
}

export function makeCap(cols: number, rows: number): Uint8Array {
  return new Uint8Array(cols * rows);
}

/** Filas que hay que ensanchar el pozo por la velocidad: min(8, ceil(|v|·dt / ch)). */
export function inflateRows(v: number, dt: number, ch: number): number {
  const k = Math.ceil((Math.abs(v) * dt) / ch);
  return k > MAX_INFLATE_ROWS ? MAX_INFLATE_ROWS : k;
}

/** Tope global según la energía: 15 hasta e = 0,5 y baja con suavidad (cúbica de Hermite) hasta T8 en e = 1. */
export function globalCapFor(energy: number, base: number = 15): number {
  const t = energy <= 0.5 ? 0 : energy >= 1 ? 1 : (energy - 0.5) * 2;
  const s = t * t * (3 - 2 * t);
  const c = base - Math.round((base - ENERGY_CAP_MIN) * s);
  return c < CAP_FLOOR ? CAP_FLOOR : c;
}

/** Pasa un rectángulo de documento en px CSS (el WellRect del motor) a celdas de visor. */
export function pxToCellRect(r: { x: number; y: number; w: number; h: number; kind: "ink" | "muted" }, scrollY: number, cssCw: number, cssCh: number): CellRect {
  return { x: r.x / cssCw, y: (r.y - scrollY) / cssCh, w: r.w / cssCw, h: r.h / cssCh, kind: r.kind };
}

/**
 * Construye el mapa de topes (`cols × rows`, un byte por celda) desde los rectángulos de texto de UN cuadro.
 * `cap` se rellena y se devuelve (asigna el llamador con `makeCap`). Varios pozos solapados: manda el más bajo.
 * Dentro del rectángulo (ensanchado por velocidad) el tope es el de su clase; en las 2 celdas de fuera sube con una
 * curva cúbica hasta el tope global. Ningún valor baja de T1.
 */
export function buildCap(cap: Uint8Array, cols: number, rows: number, rects: readonly CellRect[], o: WellOpts = {}): Uint8Array {
  if (cap.length !== cols * rows) throw new RangeError("buildCap: el mapa no tiene cols·rows celdas");
  const gcap = globalCapFor(o.energy ?? 0, o.globalCap ?? 15);
  cap.fill(gcap);
  const dt = o.dt ?? 1 / 30;
  const ch = o.ch ?? 18;
  const v = o.v ?? 0;
  const k = v === 0 ? 0 : inflateRows(v, dt, ch);
  const caps = o.more ? WELL_CAPS_MORE : WELL_CAPS;
  for (let n = 0; n < rects.length; n++) {
    const r = rects[n];
    const wc = Math.max(CAP_FLOOR, Math.min(gcap, caps[r.kind]));
    let x0 = Math.floor(r.x);
    let x1 = Math.ceil(r.x + r.w); // exclusivo
    let y0 = Math.floor(r.y);
    let y1 = Math.ceil(r.y + r.h);
    if (v > 0) y0 -= k; // el texto sube: el pozo se extiende hacia arriba
    else if (v < 0) y1 += k; // el texto baja: hacia abajo
    if (x1 <= x0 || y1 <= y0) continue;
    const ax0 = Math.max(0, x0 - FEATHER);
    const ax1 = Math.min(cols - 1, x1 - 1 + FEATHER);
    const ay0 = Math.max(0, y0 - FEATHER);
    const ay1 = Math.min(rows - 1, y1 - 1 + FEATHER);
    for (let y = ay0; y <= ay1; y++) {
      const dy = y < y0 ? y0 - y : y >= y1 ? y - (y1 - 1) : 0;
      for (let x = ax0; x <= ax1; x++) {
        const dx = x < x0 ? x0 - x : x >= x1 ? x - (x1 - 1) : 0;
        let val = wc;
        if (dx !== 0 || dy !== 0) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= FEATHER) continue;
          const s = d / FEATHER;
          val = wc + Math.round((gcap - wc) * (s * s * (3 - 2 * s)));
        }
        const i = y * cols + x;
        if (val < cap[i]) cap[i] = val < CAP_FLOOR ? CAP_FLOOR : val;
      }
    }
  }
  return cap;
}

/**
 * Aplica el mapa DESPUÉS de pintar (lo hace el motor, no la escena): cualquier tono de primer plano o de fondo por encima del
 * tope de su celda baja al tope. El glifo no cambia.
 */
export function applyCap(g: Cells, cap: Uint8Array): void {
  const b = g.b;
  for (let i = 0, j = 0; i < b.length; i += 4, j++) {
    const c = cap[j];
    if (b[i + 1] > c) b[i + 1] = c;
    if (b[i + 2] > c) b[i + 2] = c;
  }
}
