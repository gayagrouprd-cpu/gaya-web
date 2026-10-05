// `cover` · GAYA — Variante A · «Duotono ANSI» (copia autosuficiente de scenes/cover.ts con CARACTERES VISIBLES). Mismo guion, misma composición y
// mismo contrato `Scene`; cambia la materia de las superficies:
//   · el AGUA de la cara es movimiento de la rampa medida (ramp.ts): cada celda lleva un glifo en un tono claro SOBRE un fondo azul más oscuro de la
//     misma familia; más densidad de carácter = más luz, así que las cáusticas son filamentos de `x * # % @` sobre masa azul y el resto, `: ~ = +`;
//   · el MENISCO es una fila de `~` y `=` (T13 sobre T8); el vidrio vacío, fondo T5 con puntos y un reflejo diagonal de `/`;
//   · el ARO sigue siendo la silueta limpia: la piel de cuadrantes es idéntica a la base y la pared (bloque `█`) conserva su tono como FONDO, con
//     caracteres sueltos encima (`putWall`: 6 de cada 10 celdas con luz de borde, 5 con tono neutro, 4 en la sombra);
//   · la SOMBRA PROYECTADA es una banda de caracteres oscuros sobre T0 y la BRUMA es de caracteres (`mistA`): `. : - ~ ; = + *` con degradado de tono, fondo
//     T0–T3 y viñeta, más calma (solo puntos y tildes) bajo los pozos de texto;
//   · con poco aire (la palabra cubre más del 14 % de la pantalla: 1600×900, móvil estrecho) la densidad de acento baja (`accentDensity`) para respetar
//     el presupuesto de tono de §5.4, que mide el primer plano de cada celda con glifo.
// A diferencia de la portada original ESTA escena usa `bg` (fondo del duotono): ver «póster SSR» en docs/ascii/reports/art-a.md y `poster-a.ts`.
//
// `build` es puro y corre en Node; `paint` solo usa enteros y polinomios (`smooth`, `easeOutCubic`, `sinp`): el `still` es idéntico en cualquier motor.
import type { Cells, FaceInfo, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "../../common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, bevel, clear, easeOutCubic, faceFn, faceLevelRow, glowField, glyphIndex, hu, layoutLines, makeCells, makeState,
  markAura, paintRing, put, setTone, shadow, sinp, smooth, stampCls, waterTile,
} from "../../common.ts";
import { RAMP } from "./ramp.ts";
import { accentDensity, mistA, putDuo, putWall } from "./kit-a.ts";

export interface CoverAOpts {
  /** Nivel de reposo del agua 0..1 sobre la altura de la CARA (0,78 como la base). */
  level?: number;
}

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
  /** Rango de esta línea en las listas planas de celdas de cara. */
  from: number;
  to: number;
}
interface Inner {
  spec: GridSpec;
  lines: Line[];
  fPos: Int32Array; // x | y << 16 de cada celda de cara
  fDist: Uint8Array;
  fBias: Int8Array; // +1 con luz de borde (arriba/izquierda), −1 con el borde expuesto abajo/derecha
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  ringRt: Uint8Array;
  shPos: Int32Array;
  shRt: Uint8Array;
  glow: Uint8Array;
  sparks: Int32Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
  /** Densidad de acento 0,45..1 (accentDensity): menos caracteres claros cuando la palabra cubre mucha pantalla. */
  dens: number;
}
const INNER = new WeakMap<SceneState, Inner>();

// ---- guion de la ignición (§7.1), todo en función de p (igual que la base) ----
const MIST_OPEN = [0, 0.15] as const;
const RING_AT = 0.05;
const RING_SPAN = 0.2;
const LEVEL_AT = 0.1;
const LEVEL_SPAN = 0.8;
const LEVEL_REST = 0.78;
const CAUSTIC = [0.3, 0.8] as const;
const FINISH = 0.75;

const G_TILDE = glyphIndex("~");
const G_EQ = glyphIndex("=");
const G_SLASH = glyphIndex("/");
const G_FULL = glyphIndex("█");

// ---- duotonos de la superficie (tono del glifo / tono del fondo) ----
const GLASS_BG = 5;
const GLASS_FG = 7;
const MENISCUS_BG = 8;
const MENISCUS_FG = 13;

export function createCoverA(o: CoverAOpts = {}): Scene {
  const levelMax = o.level ?? LEVEL_REST;
  return {
    id: "cover",
    dawn: 0,
    arrival: { ms: 2600 },
    build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
      const st = makeState(spec);
      const mobile = spec.cols < 90;
      const yTop = mobile || spec.rows < 44 ? 3 : 4;
      const placed = layoutLines(spec, words[0], yTop, mobile ? 2 : 1);
      const lines: Line[] = [];
      const fPos: number[] = [];
      const fDist: number[] = [];
      const fBias: number[] = [];
      let minX = 1e9;
      let maxX = -1;
      let minY = 1e9;
      let maxY = -1;
      for (const p of placed) {
        const face = faceFn(p.word, p.x0, p.y0);
        const w = p.word;
        const from = fPos.length;
        for (let y = 0; y < w.rows; y++) {
          for (let x = 0; x < w.cols; x++) {
            const i = y * w.cols + x;
            if (face.cls[i] !== C_FACE) continue;
            const edge = (xx: number, yy: number): boolean => xx >= 0 && yy >= 0 && xx < w.cols && yy < w.rows && face.cls[yy * w.cols + xx] === C_EDGE;
            const lit = edge(x - 1, y) || edge(x, y - 1) || edge(x - 1, y - 1);
            const dark = edge(x + 1, y) || edge(x, y + 1) || edge(x + 1, y + 1);
            fPos.push(p.x0 + x + ((p.y0 + y) << 16));
            fDist.push(Math.min(255, face.dist[i]));
            fBias.push((lit ? 1 : 0) - (dark ? 1 : 0));
          }
        }
        lines.push({ x0: p.x0, y0: p.y0, word: w, face, from, to: fPos.length });
        minX = Math.min(minX, p.x0);
        maxX = Math.max(maxX, p.x0 + w.cols);
        minY = Math.min(minY, p.y0);
        maxY = Math.max(maxY, p.y0 + w.rows);
      }
      let inkCells = 0;
      for (const l of lines) for (let i = 0; i < l.word.cells.length; i++) if (l.word.cells[i] !== 0) inkCells++;
      const bw = Math.max(1, maxX - minX);
      const bh = Math.max(1, maxY - minY);
      // aro (bloques y cuadrantes limpios), como lista: se revela por barrido
      const ringPos: number[] = [];
      const ringGl: number[] = [];
      const ringTn: number[] = [];
      const ringRt: number[] = [];
      const ringLayer = makeCells(spec.cols, spec.rows);
      for (const l of lines) {
        paintRing(ringLayer, l.word, l.x0, l.y0, l.face, RING_TONES, 0.55, 2);
        stampCls(st.cls, spec.cols, spec.rows, l.face);
      }
      for (let y = 0; y < spec.rows; y++) {
        for (let x = 0; x < spec.cols; x++) {
          const k = (y * spec.cols + x) << 2;
          if (ringLayer.b[k] === 0) continue;
          ringPos.push(x | (y << 16));
          ringGl.push(ringLayer.b[k]);
          ringTn.push(ringLayer.b[k + 1]);
          const s = 0.65 * ((x - minX) / bw) + 0.35 * ((maxY - y) / bh);
          ringRt.push(Math.max(0, Math.min(255, Math.round(s * 255))));
        }
      }
      // sombra proyectada (+2, +1): celdas vacías con su umbral de aparición por hash
      const aura = makeCells(spec.cols, spec.rows);
      for (const l of lines) shadow(aura, l.word, l.x0, l.y0);
      const shPos: number[] = [];
      const shRt: number[] = [];
      for (let y = 0; y < spec.rows; y++) {
        for (let x = 0; x < spec.cols; x++) {
          if (aura.b[(y * spec.cols + x) << 2] === 0) continue;
          shPos.push(x | (y << 16));
          shRt.push(hu(x, y, 30) >>> 24);
        }
      }
      markAura(st.cls, aura);
      // chispas: celdas parciales con luz de borde, elegidas por hash
      const cand: number[] = [];
      for (const l of lines) {
        for (let y = 0; y < l.word.rows; y++) {
          for (let x = 0; x < l.word.cols; x++) {
            const i = y * l.word.cols + x;
            if (l.face.cls[i] === C_EDGE && l.word.cells[i] !== 15 && bevel(l.word, x, y) === RING_TONES.light) cand.push(l.x0 + x + ((l.y0 + y) << 16));
          }
        }
      }
      const nSp = mobile ? 3 : 5;
      const sparks: number[] = [];
      for (let k = 0; k < nSp && cand.length > 0; k++) sparks.push(cand[hu(k, 7, 99) % cand.length]);
      const glow = glowField(spec.cols, spec.rows, lines, 3.6);
      const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
      INNER.set(st, {
        spec,
        lines,
        fPos: Int32Array.from(fPos),
        fDist: Uint8Array.from(fDist),
        fBias: Int8Array.from(fBias),
        ringPos: Int32Array.from(ringPos),
        ringGl: Uint8Array.from(ringGl),
        ringTn: Uint8Array.from(ringTn),
        ringRt: Uint8Array.from(ringRt),
        shPos: Int32Array.from(shPos),
        shRt: Uint8Array.from(shRt),
        glow,
        sparks: Int32Array.from(sparks),
        cx: spec.cols / 2,
        cy: (minY + maxY) / 2 + 1,
        rx: Math.min(spec.cols * 0.5, 74) * k,
        ry: Math.min(spec.rows * (mobile ? 0.32 : 0.4), mobile ? 18 : 15.5) * k,
        k2: k * k,
        dens: accentDensity(inkCells, spec.cols, spec.rows),
      });
      return st;
    },
    paint(g: Cells, s: SceneState, f: Frame): void {
      const I = INNER.get(s) as Inner;
      const { p, t } = f;
      const tl = waterTile();
      const cols = I.spec.cols;
      clear(g, 0);
      // 1 · bruma de caracteres: se abre desde el centro
      const open = smooth(MIST_OPEN[0], MIST_OPEN[1], p);
      if (open > 0) {
        const k = 0.15 + 0.85 * open;
        mistA(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * k * 0.9, ry: I.ry * k * 0.9, gain: 2.0 * open, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.85 * open * I.k2, heat: f.heat }, t, tl);
      }
      // 2 · sombra proyectada: caracteres densos y oscuros sobre fondo T0 (aparece con el final de la ignición, celda a celda)
      if (p >= 0.7) {
        const a = smooth(0.7, 0.95, p) * 255;
        for (let n = 0; n < I.shPos.length; n++) {
          if (I.shRt[n] < a) {
            const x = I.shPos[n] & 0xffff;
            const y = I.shPos[n] >> 16;
            putDuo(g, x, y, 2, hu(x, y, 31), 3, 0);
          }
        }
      }
      // 3 · aro de luz: bloques y cuadrantes; se traza barriendo y la cabeza del barrido brilla
      if (p >= RING_AT) {
        const pr = (p - RING_AT) / RING_SPAN;
        for (let n = 0; n < I.ringPos.length; n++) {
          const r = I.ringRt[n] / 255;
          if (pr < r) continue;
          let tn = I.ringTn[n];
          if (!f.still && pr - r < 0.22) tn += 3;
          const rx = I.ringPos[n] & 0xffff;
          const ry = I.ringPos[n] >> 16;
          if (I.ringGl[n] === G_FULL) putWall(g, rx, ry, tn > 15 ? 15 : tn, hu(rx, ry, 23), I.dens);
          else put(g, rx, ry, I.ringGl[n], tn > 15 ? 15 : tn);
        }
      }
      // 4 · vidrio con agua: nivel, menisco de `~` y `=`, cáusticas como movimiento de la rampa
      const level = levelMax * easeOutCubic((p - LEVEL_AT) / LEVEL_SPAN);
      const caustic = smooth(CAUSTIC[0], CAUSTIC[1], p);
      if (p >= LEVEL_AT) {
        const heat = f.heat;
        for (let n = 0; n < I.lines.length; n++) {
          const l = I.lines[n];
          const yWater = faceLevelRow(l.face, level);
          const meniscus = level > 0 && level < 1;
          const span = Math.max(1, l.y0 + l.face.fy1 + 1 - yWater);
          for (let q = l.from; q < l.to; q++) {
            const sx = I.fPos[q] & 0xffff;
            const sy = I.fPos[q] >> 16;
            const hh = hu(sx, sy, 17);
            const hot = heat === null ? 0 : heat[sy * cols + sx];
            if (sy < yWater) {
              // vidrio vacío: fondo oscuro, puntos sueltos y, de vez en cuando, el reflejo de una luz de estudio (`/`)
              let bg = GLASS_BG;
              let fg = GLASS_FG;
              let lv = (hh & 3) === 0 ? 2 : (hh & 3) === 1 ? 1 : 0;
              let gl = RAMP[(lv << 2) | ((hh >>> 3) & 3)];
              if (((3 * sx + 5 * sy) % 43) < 3 && caustic > 0.2) {
                gl = G_SLASH;
                fg = 10;
                bg = 6;
              }
              if (hot > 0.04) {
                bg += Math.round(hot * 3);
                fg += Math.round(hot * 5);
                lv = 1 + Math.round(hot * 4);
                if (gl !== G_SLASH) gl = RAMP[(lv << 2) | ((hh >>> 3) & 3)];
              }
              put(g, sx, sy, gl, fg > 15 ? 15 : fg, bg > 15 ? 15 : bg);
              continue;
            }
            if (meniscus && sy === yWater) {
              // menisco: una fila de `~` y `=` (la cresta ondula con el agua)
              const crest = sinp(sx * 0.55 + t * 1.3) > 0.3;
              put(g, sx, sy, (hh & 3) === 0 ? G_EQ : G_TILDE, crest ? MENISCUS_FG + 1 : MENISCUS_FG, MENISCUS_BG);
              continue;
            }
            const depth = (sy - yWater) / span;
            const c = caustic * agua(tl, sx, sy, t);
            let v = 0.4 + 0.66 * c - 0.3 * depth + 0.1 * I.fBias[q] + 0.05 * (I.fDist[q] > 3 ? -1 : 0);
            if (hot > 0.04) v += 0.5 * hot;
            let lv = (v * 10) | 0;
            lv = lv < 2 ? 2 : lv > 9 ? 9 : lv;
            let bg = 5 + (c > 0.55 ? 1 : 0) - (depth > 0.6 ? 1 : 0);
            if (depth < 0.2) bg += 1; // la capa de agua junto a la superficie es más clara
            let fg = bg + 3 + (lv >> 1);
            const fgMax = I.dens > 0.85 ? 10 : I.dens > 0.65 ? 9 : 8; // con poco aire solo los caracteres de las cáusticas pasan de T8
            if (fg > (lv >= 7 ? 10 : fgMax)) fg = lv >= 7 ? 10 : fgMax;
            if (hot > 0.04) fg += Math.round(1.6 * hot);
            putDuo(g, sx, sy, lv, hh, fg, bg);
          }
        }
      }
      // 5 · chispas
      if (p >= FINISH) {
        const a = smooth(FINISH, 1, p);
        for (let n = 0; n < I.sparks.length; n++) if (a > (n + 1) / (I.sparks.length + 1) - 0.1) setTone(g, I.sparks[n] & 0xffff, I.sparks[n] >> 16, 15);
      }
      // 6 · calor: la linterna enciende también el aro (+2,6 tonos como máximo, tope T13)
      if (f.heat !== null) {
        const heat = f.heat;
        for (let n = 0; n < I.ringPos.length; n++) {
          const x = I.ringPos[n] & 0xffff;
          const y = I.ringPos[n] >> 16;
          const h = heat[y * cols + x];
          if (h < 0.04) continue;
          const k = ((y * cols + x) << 2) + 1;
          if (g.b[k] === 0) continue;
          const tn = g.b[k] + Math.round(2.6 * h);
          g.b[k] = tn > 13 ? 13 : tn;
          if (g.b[k + 1] !== 0) {
            const bb = g.b[k + 1] + Math.round(1.6 * h);
            g.b[k + 1] = bb > 11 ? 11 : bb;
          }
        }
      }
      applyRings(g, f.rings, 2);
    },
  };
}

export const coverA: Scene = createCoverA();
export default coverA;
