// Variante B · `hola` · HOLA / HELLO — «hola contiene ola», con las olas escritas. La H es un rótulo sólido (bloques de tono, agua quieta) y «OLA»
// (en inglés «ELLO») son olas hechas de `~ o O 0` y de la rampa del nombre (` ·:=*yaAG`): cada raya de ola es una cresta de `~`, espuma de `o O 0` bajo
// ella y un cuerpo que cae del tono de `G A` al de `y *` y se hunde en `: ·`.
//
// Mismo guion que la base (`arrival.ms` = 900; las olas ganan amplitud entre p = 0,3 y 1; sombra al final) y mismas reglas de escena. Sin `bg`
// (la base lo usa para degradar las rayas con `░▒▓`; aquí el degradado ya es de glifos, así que la escena puede ir sin fondo).
import type { Cells, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "../../common.ts";
import type { FaceInfo } from "../../common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, bevel, bn, clear, faceFn, glowField, hu, layoutLines, makeCells, makeState, markAura, overlay, paintRing, put, shadow,
  sinp, smooth, stampCls, waterTile, waterTone,
} from "../../common.ts";
import { mistB } from "./fabric.ts";
import { B_RING, G_FULL, G_O, G_SHADE_L, G_TILDE, G_ZERO, G_o, RAMP_GL, lightToU, rampStep, toneOfLight } from "./ramp.ts";

export interface HolaBOpts {
  /** Anchura de la costura entre letras (ver ramp.ts). */
  seam?: number;
  /** Fracción de celdas de espuma que son `0` (el resto `o`/`O`). */
  foam?: number;
  /** Fondo (bg) de la losa de agua bajo las letras de «OLA» (0 = sin bg). */
  bg?: number;
  /** Aura de bg (0–2) bajo la bruma. */
  bgGlow?: number;
  /** Luz mínima de la tela de las olas (0..1). */
  floor?: number;
  /** Ruido de grano de la tela (0..1) que rompe las rachas de una misma letra. */
  grain?: number;
}

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
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
  /** Pared de «OLA» (celda llena contigua al borde): su luz de borde 10 / 8 / 7; 0 = no es pared. */
  fb: Uint8Array;
  fth: Uint8Array;
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

// ---- las olas (mismas ondas que la base) ----
const WAVE_PERIOD = 3.6;
const WAVE_AMP = 2.0;
const WAVE_K = 0.125;
const RIPPLE_K = 0.47;

export function createHolaB(o: HolaBOpts = {}): Scene {
  const seam = o.seam ?? 0.7;
  const foamZero = o.foam ?? 0.25;
  const bgTone = o.bg ?? 4;
  const bgGlow = o.bgGlow ?? 2;
  const floorV = o.floor ?? 0.5;
  const grain = o.grain ?? 0.14;
  return {
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
      const fb: number[] = [];
      const fth: number[] = [];
      for (const l of lines) {
        paintRing(ring, l.word, l.x0, l.y0, l.face, B_RING, 0.2, 2);
        shadow(aura, l.word, l.x0, l.y0);
        stampCls(st.cls, spec.cols, spec.rows, l.face);
        minY = Math.min(minY, l.y0);
        maxY = Math.max(maxY, l.y0 + l.word.rows);
        for (let y = 0; y < l.word.rows; y++) {
          for (let x = 0; x < l.word.cols; x++) {
            const i = y * l.word.cols + x;
            // en las letras de «OLA» las olas llenan también la pared del aro; solo queda la piel (celdas parciales) como borde
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
            fb.push(wall ? bevel(l.word, x, y) : 0);
            fth.push(Math.min(255, Math.floor(bn(l.x0 + x, l.y0 + y) * 256)));
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
        fb: Uint8Array.from(fb),
        fth: Uint8Array.from(fth),
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
      mistB(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx, ry: I.ry, gain: 1.1, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.7 * I.k2, heat: f.heat, bgGlow }, t, tl);
      if (p > 0.6) {
        const a = smooth(0.6, 0.95, p) * 255;
        for (let y = 0; y < I.spec.rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (I.aura.b[(y * cols + x) << 2] !== 0 && hu(x, y, 30) >>> 24 < a) put(g, x, y, G_SHADE_L, 2);
          }
        }
      }
      overlay(g, I.ring);
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
          // H sólida: bloques de tono con cáusticas (+2 tonos con el calor), como la base
          const c = caustic * agua(tl, x, y, t);
          let tn = waterTone(4, (y - I.top) / I.rows, I.fd[n], c);
          if (h > 0.05) tn += Math.round(2 * h);
          put(g, x, y, G_FULL, tn > 15 ? 15 : tn);
          continue;
        }
        // «OLA»: rayas de ola; cresta `~`, espuma `o O 0`, cuerpo en la rampa del nombre sobre una losa de agua (bg)
        const wb = I.fb[n];
        const psi = y + A * (1 + h) * (sinp(WAVE_K * x + phase + h * 2.5) + 0.22 * sinp(RIPPLE_K * x - phase * 1.7 + h * 2.5));
        let u = psi / WAVE_PERIOD;
        u -= Math.floor(u);
        const th = (I.fth[n] + 0.5) / 256;
        const k = (y * cols + x) << 2;
        if (bgTone > 0) {
          // la losa de agua sigue la ola: cresta clara, seno hondo (las rayas de ola se leen también por el fondo)
          const wv = 1 - (u < 0.1 ? 0 : (u - 0.1) / 0.9);
          g.b[k + 2] = wb !== 0 ? bgTone : bgTone + (wv > 0.7 ? 2 : wv > 0.4 ? 1 : 0);
          g.b[k + 3] |= 2;
        }
        if (amp > 0.5 && u < 0.14) {
          put(g, x, y, G_TILDE, 12 - (u > 0.07 ? 1 : 0));
          continue;
        }
        if (amp > 0.5 && u < 0.34 && (hu(x, y, 41) & 3) === 0) {
          const r = (hu(x, y, 43) >>> 8) & 255;
          put(g, x, y, r < foamZero * 256 ? G_ZERO : r < 140 ? G_O : G_o, u < 0.22 ? 11 : 10);
          continue;
        }
        const d = u < 0.1 ? 0 : (u - 0.1) / 0.9;
        const w = 1 - d;
        let v = floorV + (1.05 - floorV) * w * w + (hu(x, y, 77) / 4294967296 - 0.5) * grain;
        if (wb !== 0) v += wb >= 10 ? 0.12 : wb === 8 ? 0.04 : -0.08;
        v += 0.4 * h;
        if (v > 1) v = 1 - 0.14 * (hu(x, y, 79) / 4294967296); // por encima de G se mezclan A y G, no una racha de G
        const step = rampStep(lightToU(v), th, seam);
        g.b[k] = RAMP_GL[step];
        g.b[k + 1] = toneOfLight(v, 5, 10);
        g.b[k + 3] |= 1;
      }
      applyRings(g, f.rings, 2);
    },
  };
}

export const holaB: Scene = createHolaB();
export default holaB;
