// `mist` · bruma (DIRECTION §7.10): el fondo de las secciones sin palabra (Índice y Proceso). Es la bruma de la portada sin la palabra y con
// `dawn` propio: dos velos de luz en diagonal sobre una niebla que deriva con la energía del scroll. Densidad ≤ 35 % de celdas no vacías. Se dibuja en vivo: no tiene estático propio
// ni póster SSR, así que no hay regla de `bg` (no la usa: solo necesita el primer plano).
//
// `paint` solo usa enteros y polinomios; `t` mueve la niebla (el motor lo hace avanzar con la energía de scroll y lo detiene al dormir).
import type { Cells, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "./common.ts";
import { GAUSS, GAUSS_SCALE, clear, makeState, mist, smooth, waterTile } from "./common.ts";

interface Inner {
  spec: GridSpec;
  field: Uint8Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
const INNER = new WeakMap<SceneState, Inner>();

/**
 * Dos velos de luz en diagonal (de arriba a la izquierda a abajo a la derecha, el segundo más estrecho y tenue) que se afinan en los
 * extremos: campo 0..255 por celda con la tabla entera GAUSS sobre la distancia a cada recta, medida en píxeles (la celda es 1:2). Una
 * diagonal es más dinámica que dos manchas (que se leían como ojos) y deja sitio a los bloques de texto a ambos lados.
 */
function veils(cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(cols * rows);
  // [x0, y0, x1, y1 en fracciones de pantalla; ancho en fracciones de √(área en píxeles relativos); peso]
  const bands = [
    [-0.05, 0.05, 1.0, 0.92, 0.078, 1],
    [0.2, -0.05, 1.05, 0.62, 0.046, 0.55],
  ];
  for (const b of bands) {
    const x0 = b[0] * cols;
    const y0 = b[1] * rows * 2;
    const dx = b[2] * cols - x0;
    const dy = b[3] * rows * 2 - y0;
    const len2 = dx * dx + dy * dy;
    const len = Math.sqrt(len2);
    const w = b[4] * Math.sqrt(cols * rows * 2); // ancho proporcional a la raíz del área: los velos no se ensanchan en pantallas bajas
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x - x0;
        const py = y * 2 - y0;
        const u = (px * dx + py * dy) / len2; // posición a lo largo de la recta 0..1
        const d = Math.abs(px * dy - py * dx) / len; // distancia a la recta
        const xg = (d / w) * (d / w) * 1.6;
        if (xg >= 8) continue;
        // se afina en los extremos
        const taper = smooth(0, 0.22, u) * (1 - smooth(0.78, 1.05, u));
        const v = Math.round(GAUSS[(xg * GAUSS_SCALE) | 0] * b[5] * taper);
        if (v > out[y * cols + x]) out[y * cols + x] = v;
      }
    }
  }
  return out;
}

export const mistScene: Scene = {
  id: "mist",
  dawn: 0.3,
  arrival: { ms: 900 },
  build(spec: GridSpec, _lang: Lang, _words: WordSet[]): SceneState {
    const st = makeState(spec);
    // la elipse base de `mist` se deja en un punto (no aporta): toda la luz sale de las dos manchas del campo
    INNER.set(st, { spec, field: veils(spec.cols, spec.rows), cx: spec.cols / 2, cy: spec.rows / 2, rx: 1, ry: 1 });
    return st;
  },
  paint(g: Cells, s: SceneState, f: Frame): void {
    const I = INNER.get(s) as Inner;
    clear(g, 0);
    const open = smooth(0, 0.35, f.p);
    if (open <= 0) return;
    // el scroll «respira» la bruma: hasta +15 % de luz con energía plena
    const gain = 1.15 * open * (1 + 0.15 * f.e);
    mist(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx, ry: I.ry, gain, cap: 6, wells: f.cap, field: I.field, fieldGain: 1.5 * open, wisp: 1 }, f.t, waterTile());
  },
};

export default mistScene;
