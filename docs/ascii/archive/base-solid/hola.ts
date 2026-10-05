// `hola` · HOLA / HELLO — «hola contiene ola» (DIRECTION §7.2, momento firma). La H es un rótulo sólido (cara de agua quieta, aro, sombra) y
// «OLA» (en inglés «ELLO») está hecha de olas: dentro de las letras, rayas de agua que ondulan con cresta luminosa y espuma `~`.
//
// Llega por la marea (tide.ts): aquí solo vive el guion de la PALABRA (`arrival.ms` = 900): el aro ya está; las olas ganan amplitud de 0 a 1
// entre p = 0,3 y 1, la H cristaliza y la sombra y la espuma aparecen al final. Esta escena SÍ usa `bg` (no tiene póster SSR): las olas se
// degradan entre tonos con `░▒▓` (primer plano = tono de arriba, fondo = tono de abajo), que es el dither de costura de R05 §2.4.
//
// `paint` solo usa enteros y polinomios (`sinp`, `smooth`): el `still` es idéntico en cualquier motor.
import type { Cells, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "./common.ts";
import type { FaceInfo } from "./common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, clear, faceFn, glowField, glyphIndex, hu, layoutLines, makeCells, makeState, markAura, mist, overlay, paintRing, put, shadow,
  sinp, smooth, stampCls, waterTile, waterTone,
} from "./common.ts";

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
  /** Columnas de la PRIMERA letra (la H), solo en la línea 0; 0 en las demás. */
  hCols: number;
}
interface Inner {
  spec: GridSpec;
  lines: Line[];
  ring: Cells;
  aura: Cells;
  glow: Uint8Array;
  /** Celdas de cara: posición (x, y), distancia al borde y si son de la H. */
  fx: Int16Array;
  fy: Int16Array;
  fd: Uint8Array;
  fh: Uint8Array;
  top: number;
  rows: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
  mobile: boolean;
}
const INNER = new WeakMap<SceneState, Inner>();

const G_SHADE_L = glyphIndex("░");
const G_SHADE_M = glyphIndex("▒");
const G_SHADE_D = glyphIndex("▓");
const G_FULL = glyphIndex("█");
const G_TILDE = glyphIndex("~");

/** Columnas (exclusivas) de la primera letra: hasta la primera columna vacía tras la tinta. */
function firstLetterCols(w: WordSet["lines"][number]): number {
  let seen = false;
  for (let x = 0; x < w.cols; x++) {
    let ink = false;
    for (let y = 0; y < w.rows && !ink; y++) ink = w.cells[y * w.cols + x] !== 0;
    if (ink) seen = true;
    else if (seen) return x;
  }
  return w.cols;
}

/**
 * Pone un tono fraccionario `v` (0..15) en la celda como degradado entre dos tonos vecinos: bloque del tono bajo, o `░▒▓` con primer plano
 * el tono alto sobre fondo el bajo. Es la costura dither de R05 §2.4 (mesetas planas y pasos de un cuarto de tono).
 */
function putTone(g: Cells, x: number, y: number, v: number): void {
  const lo = v | 0;
  const f = v - lo;
  if (f < 0.125 || lo >= 15) put(g, x, y, G_FULL, lo, lo);
  else if (f < 0.375) put(g, x, y, G_SHADE_L, lo + 1, lo);
  else if (f < 0.625) put(g, x, y, G_SHADE_M, lo + 1, lo);
  else if (f < 0.875) put(g, x, y, G_SHADE_D, lo + 1, lo);
  else put(g, x, y, G_FULL, lo + 1, lo + 1);
}

// ---- las olas ----
const WAVE_PERIOD = 3.6; // filas entre crestas
const WAVE_AMP = 2.0; // filas de ondulación con amplitud plena
// Dos ondas: una marejada larga (≈ 50 columnas: las crestas cruzan O, L y A como un mar visto por ventanas) y un rizado corto que la rompe.
const WAVE_K = 0.125;
const RIPPLE_K = 0.47;

/** Tono 5..10 de una raya de ola: cresta fina y luminosa, cuerpo que cae hacia el seno (perfil de sierra, como una ola que rompe). */
function waveTone(psi: number): number {
  let u = psi / WAVE_PERIOD;
  u -= Math.floor(u);
  if (u < 0.1) return 12 - u * 20; // cresta: 12 → 10
  const d = (u - 0.1) / 0.9; // 0 en la cresta … 1 en el seno
  const v = 1 - d;
  return 4.5 + 5 * v * v;
}

export const hola: Scene = {
  id: "hola",
  dawn: 0.15,
  arrival: { ms: 900 },
  build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
    const st = makeState(spec);
    const mobile = spec.cols < 90;
    const yTop = mobile || spec.rows < 44 ? 3 : 4;
    const lines: Line[] = layoutLines(spec, words[0], yTop, mobile ? 2 : 1).map((p, i): Line => ({
      x0: p.x0, y0: p.y0, word: p.word, face: faceFn(p.word, p.x0, p.y0), hCols: i === 0 ? firstLetterCols(p.word) : 0,
    }));
    let minY = 1e9;
    let maxY = -1;
    const ring = makeCells(spec.cols, spec.rows);
    const aura = makeCells(spec.cols, spec.rows);
    const fx: number[] = [];
    const fy: number[] = [];
    const fd: number[] = [];
    const fh: number[] = [];
    for (const l of lines) {
      paintRing(ring, l.word, l.x0, l.y0, l.face, RING_TONES, 0.4, 2);
      shadow(aura, l.word, l.x0, l.y0);
      stampCls(st.cls, spec.cols, spec.rows, l.face);
      minY = Math.min(minY, l.y0);
      maxY = Math.max(maxY, l.y0 + l.word.rows);
      for (let y = 0; y < l.word.rows; y++) {
        for (let x = 0; x < l.word.cols; x++) {
          const i = y * l.word.cols + x;
          // en las letras de «OLA» las olas llenan también la pared del aro (celdas llenas contiguas al borde): solo queda la piel (celdas
          // parciales) como borde; con trazos de 5–7 celdas, si no, la cara son 1–3 celdas y las rayas de ola no se leen
          const wall = l.face.cls[i] === C_EDGE && l.word.cells[i] === 15 && x >= l.hCols;
          if (wall) {
            const k = ((l.y0 + y) * spec.cols + (l.x0 + x)) << 2;
            ring.b[k] = 0;
            ring.b[k + 1] = 0;
            ring.b[k + 3] = 0;
          } else if (l.face.cls[i] !== C_FACE) continue;
          fx.push(l.x0 + x);
          fy.push(l.y0 + y);
          fd.push(Math.min(255, l.face.dist[i]));
          fh.push(x < l.hCols ? 1 : 0);
        }
      }
    }
    markAura(st.cls, aura);
    const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
    INNER.set(st, {
      spec,
      lines,
      ring,
      aura,
      glow: glowField(spec.cols, spec.rows, lines, 3.6),
      fx: Int16Array.from(fx),
      fy: Int16Array.from(fy),
      fd: Uint8Array.from(fd),
      fh: Uint8Array.from(fh),
      top: minY,
      rows: maxY - minY,
      cx: spec.cols / 2,
      cy: (minY + maxY) / 2 + 1,
      rx: Math.min(spec.cols * 0.5, 74) * k * 1.06,
      ry: Math.min(spec.rows * (mobile ? 0.34 : 0.42), mobile ? 19 : 15.5) * k * 1.06,
      k2: k * k,
      mobile,
    });
    return st;
  },
  paint(g: Cells, s: SceneState, f: Frame): void {
    const I = INNER.get(s) as Inner;
    const { p, t } = f;
    const tl = waterTile();
    const cols = I.spec.cols;
    clear(g, 0);
    // 1 · bruma de luz (con el `dawn` de la escena: un poco más ancha y luminosa que la de la portada)
    mist(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx, ry: I.ry, gain: 1.1, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.9 * I.k2 }, t, tl);
    // 2 · sombra proyectada (al final de la llegada)
    if (p > 0.6) {
      const a = smooth(0.6, 0.95, p) * 255;
      for (let y = 0; y < I.spec.rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (I.aura.b[(y * cols + x) << 2] !== 0 && hu(x, y, 30) >>> 24 < a) put(g, x, y, G_SHADE_L, 2);
        }
      }
    }
    // 3 · aro de luz
    overlay(g, I.ring);
    // 4 · caras: la H es agua quieta con cáusticas; «OLA» son olas que ganan amplitud con p
    const amp = smooth(0.3, 1, p);
    const caustic = smooth(0.3, 0.8, p);
    const mob = I.mobile;
    const A = (mob ? 1.2 : WAVE_AMP) * amp;
    const phase = t * 0.9;
    const heat = f.heat;
    for (let n = 0; n < I.fx.length; n++) {
      const x = I.fx[n];
      const y = I.fy[n];
      const h = heat === null ? 0 : heat[y * cols + x];
      if (I.fh[n] === 1) {
        // H sólida: agua cobalto con cáusticas (+2 tonos con el calor)
        const c = caustic * agua(tl, x, y, t);
        let tn = waterTone(6, (y - I.top) / I.rows, I.fd[n], c);
        if (h > 0.05) tn += Math.round(2 * h);
        put(g, x, y, G_FULL, tn > 15 ? 15 : tn);
      } else {
        // «OLA»: rayas de ola que ondulan; el calor agranda la amplitud y mueve la fase localmente
        const psi = y + A * (1 + h) * (sinp(WAVE_K * x + phase + h * 2.5) + 0.22 * sinp(RIPPLE_K * x - phase * 1.7 + h * 2.5));
        const tn = waveTone(psi);
        putTone(g, x, y, tn);
        // espuma en la cresta: `~` brillante en algunas celdas
        if (tn > 10.2 && (hu(x, y, 41) & 3) === 0 && amp > 0.5) put(g, x, y, G_TILDE, 14, 12);
      }
    }
    applyRings(g, f.rings, 2);
  },
};

export default hola;
