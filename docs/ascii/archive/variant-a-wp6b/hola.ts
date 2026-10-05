// `hola` · HOLA / HELLO — Variante A · «Duotono ANSI» (copia autosuficiente de scenes/hola.ts con CARACTERES VISIBLES). La H sigue siendo un rótulo
// SÓLIDO de bloques (cara de agua quieta, aro, sombra) y «OLA» (en inglés «ELLO») está hecha de olas dibujadas con caracteres: dentro de las
// letras, rayas de ola cuya cresta es una línea de `~` brillante y cuyo cuerpo baja hacia el seno por `= + - :` y `.` en duotono (glifo claro sobre
// fondo más oscuro del mismo tono). Misma geometría, mismo guion (`arrival.ms` = 900) y mismo contrato `Scene` que la base; usa `bg`.
//
// `paint` solo usa enteros y polinomios (`sinp`, `cosp`, `smooth`): el `still` es idéntico en cualquier motor.
import type { Cells, FaceInfo, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "../../common.ts";
import {
  C_EDGE, C_FACE, G_FULL, RING_TONES, agua, applyRings, clear, cosp, faceFn, glowField, glyphIndex, hu, layoutLines, makeCells, makeState, markAura, overlay, paintRing,
  put, shadow, sinp, smooth, stampCls, waterTile, waterTone,
} from "../../common.ts";
import { accentDensity, mistA, putDuo } from "./kit-a.ts";

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
  /** Contraste de los caracteres de la ola sobre su fondo (tonos): 3, o 2 cuando la palabra cubre mucha pantalla (§5.4; ver accentDensity). */
  waveInk: number;
}
const INNER = new WeakMap<SceneState, Inner>();

const G_TILDE = glyphIndex("~");
const G_DASH = glyphIndex("-");
const G_SLASH = glyphIndex("/");
const G_BACK = glyphIndex("\\");

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

// ---- las olas ----
const WAVE_PERIOD = 3.6;
const WAVE_AMP = 2.0;
const WAVE_K = 0.125;
const RIPPLE_K = 0.47;

/** Mitad del grosor de la cresta en periodos: 0,5 fila ⇒ la cresta ocupa UNA celda por columna (línea continua, no puntos sueltos). */
const CREST = 0.5 / WAVE_PERIOD;

/**
 * Luz de una raya de ola: 0 en la cresta (una celda por columna), y 4,5..9,5 en el cuerpo (curva de sierra de la base: cae hacia el seno,
 * justo antes de la siguiente cresta). Devuelve −1 si la celda es cresta.
 */
function waveLight(psi: number): number {
  let u = psi / WAVE_PERIOD;
  u -= Math.floor(u);
  if (u < CREST || u > 1 - CREST) return -1;
  const v = 1 - (u - CREST) / (1 - 2 * CREST);
  return 4.5 + 5 * v * v;
}

export const holaA: Scene = {
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
          // en «OLA» las olas llenan también la pared del aro (celdas llenas contiguas al borde): solo queda la piel (celdas parciales)
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
    let inkCells = 0;
    for (const l of lines) for (let i = 0; i < l.word.cells.length; i++) if (l.word.cells[i] !== 0) inkCells++;
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
      waveInk: accentDensity(inkCells, spec.cols, spec.rows) > 0.85 ? 3 : 2,
    });
    return st;
  },
  paint(g: Cells, s: SceneState, f: Frame): void {
    const I = INNER.get(s) as Inner;
    const { p, t } = f;
    const tl = waterTile();
    const cols = I.spec.cols;
    clear(g, 0);
    // 1 · bruma de caracteres (con el `dawn` de la escena: un poco más ancha y luminosa que la de la portada)
    mistA(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx, ry: I.ry, gain: 1.5, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.9 * I.k2 }, t, tl);
    // 2 · sombra proyectada (al final de la llegada): caracteres densos y oscuros sobre T0
    if (p > 0.6) {
      const a = smooth(0.6, 0.95, p) * 255;
      for (let y = 0; y < I.spec.rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (I.aura.b[(y * cols + x) << 2] !== 0 && hu(x, y, 30) >>> 24 < a) putDuo(g, x, y, 2, hu(x, y, 31), 3, 0);
        }
      }
    }
    // 3 · aro de luz (cuadrantes y bloques limpios)
    overlay(g, I.ring);
    // 4 · caras: la H es agua quieta de bloques con cáusticas; «OLA» son olas de caracteres que ganan amplitud con p
    const amp = smooth(0.3, 1, p);
    const caustic = smooth(0.3, 0.8, p);
    const A = (I.mobile ? 1.2 : WAVE_AMP) * amp;
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
        put(g, x, y, G_FULL, tn > 15 ? 15 : tn < 1 ? 1 : tn);
        continue;
      }
      // «OLA»: rayas de ola que ondulan; el calor agranda la amplitud y mueve la fase localmente
      const a1 = WAVE_K * x + phase + h * 2.5;
      const a2 = RIPPLE_K * x - phase * 1.7 + h * 2.5;
      const psi = y + A * (1 + h) * (sinp(a1) + 0.22 * sinp(a2));
      const w = waveLight(psi);
      const hh = hu(x, y, 41);
      if (w < 0) {
        // cresta: línea de `~` brillante; donde la ola sube o baja deprisa, el trazo se inclina (`/` `\`)
        const sl = A * (1 + h) * (WAVE_K * cosp(a1) + 0.22 * RIPPLE_K * cosp(a2)) * 2;
        let gl = (hh & 3) === 0 ? G_DASH : G_TILDE;
        if (sl > 0.88) gl = G_SLASH;
        else if (sl < -0.88) gl = G_BACK;
        const sp = (hh >>> 8) % 12; // espuma T13 en 1 de cada 12 · cresta T12 en 4 de cada 12 · el resto T10 (§5.4: T≥11 ≤ 4 %)
        put(g, x, y, gl, sp === 0 ? 13 : sp < 5 ? 12 : 10, 8);
        continue;
      }
      // cuerpo de la ola: la densidad del carácter baja con la luz hacia el seno (`* + =` junto a la cresta, `:` y `.` al fondo)
      let lv = Math.round((w - 5.2) * 1.25);
      lv = lv < 1 ? 1 : lv > 6 ? 6 : lv;
      let bg = Math.round(w - 0.8);
      bg = bg < 4 ? 4 : bg > 9 ? 9 : bg;
      if (bg >= 8 && (hh & 7) >= 5) put(g, x, y, 0, bg, bg); // junto a la cresta la ola es masa: solo 5 de cada 8 celdas llevan carácter
      else putDuo(g, x, y, lv, hh >>> 2, bg + I.waveInk > 10 ? 10 : bg + I.waveInk, bg);
    }
    applyRings(g, f.rings, 2);
  },
};

export default holaA;
