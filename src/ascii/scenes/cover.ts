// `cover` · GAYA — «el agua hecha del nombre», en el estilo oficial Duotono (DIRECTION §5.5, §7.1; docs/ascii/KIT.md). Un rótulo de vidrio con agua dentro
// sobre una bruma de caracteres que sale de la propia palabra. Lo que se lee es TEXTO: cada celda de una superficie es un glifo de la rampa medida
// (ramp.ts) en un tono claro sobre un fondo más oscuro de la misma familia.
//   · el AGUA de la cara es movimiento de la rampa: más densidad de carácter = más luz, así que las cáusticas son filamentos de `x * # %` sobre una masa de
//     `: ; = +`; ninguna celda de la cara está vacía y el glifo nunca pasa de T8 salvo en los peldaños ≥ 7 de las cáusticas;
//   · el MENISCO es una fila de `~` y `=` (T12–T13 sobre T8) y el vidrio vacío, puntos y dos puntos sobre T3 con un reflejo diagonal de `/`;
//   · el ARO conserva la silueta limpia (piel de cuadrantes, luz de borde T11) y la pared de bloque lleva caracteres grabados (`putWall`);
//   · pegados al trazo, un AURA de fondo T8 y T6 (la luz del rótulo; solo la primera capa en móvil, y nada dentro de los contrapunzones) y una SOMBRA de una celda
//     en T1–T2; más allá, la BRUMA (`mistDuo`): `. : ; + *` en racimos con huecos T0 entre ellos, que se aclara hacia la palabra y deja limpia la mitad inferior.
// Con poco aire (la palabra cubre más del 14 % de la pantalla: 1600×900, móvil estrecho) la densidad de acento baja (`accentDensity`) para respetar el
// presupuesto de tono de §5.4.
//
// `build` es puro y corre en Node; `paint` solo usa enteros y polinomios (`smooth`, `easeOutCubic`, `sinp`): el `still` es idéntico en cualquier motor.
// Usa `bg`: el póster SSR sin JS pasa por `posterCollapse` (ssr.ts), que lo convierte en las 4 capas de siempre.
import type { Cells, FaceInfo, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "./common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, bevel, bn, clear, easeOutCubic, faceFn, faceLevelRow, glyphIndex, hu, layoutLines, makeCells, makeState, paintRing, put,
  setTone, sinp, smooth, stampCls, waterTile,
} from "./common.ts";
import type { RingTones } from "./common.ts";
import { DUO_RAMP } from "./ramp.ts";
import { accentDensity, bakeAura, bakeShadow, clusterField, distField, enclosedCells, glowFromDist, inkTone, mistDuo, putDuo, putWall } from "./duo.ts";
import type { AuraCells, ShadowCells } from "./duo.ts";

export interface CoverOpts {
  /** Nivel de reposo del agua 0..1 sobre la altura de la CARA (0,78 por omisión). */
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
  fBias: Int8Array; // +1 con luz de borde (arriba/izquierda), −1 con el borde expuesto abajo/derecha
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  ringRt: Uint8Array;
  shadow: ShadowCells;
  aura: AuraCells;
  glow: Uint8Array;
  dens: Uint8Array;
  sparks: Int32Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
  /** Densidad de acento 0,45..1 (accentDensity): menos caracteres de pared cuando la palabra cubre mucha pantalla. */
  acc: number;
  /** Con aire de sobra (la palabra cubre ≤ 14 % de una rejilla de ≥ 6 000 celdas) la luz de borde, el menisco y la cresta suben un peldaño; si no, §5.4 los baja. */
  hi: boolean;
  /** Fila de la base de la palabra: desde ahí la bruma se apaga hacia abajo (mistDuo `yFade`). */
  yFade: number;
}
const INNER = new WeakMap<SceneState, Inner>();

// ---- guion de la ignición (§7.1), todo en función de p ----
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

// ---- tonos de la superficie (glifo / fondo) ----
/** El aro: la luz de borde sube un peldaño sobre la base de bloques (T10 → T11) y la piel en sombra queda en T9. */
const RING_DUO: RingTones = { edge: 9, skin: 10, light: 11, lit: 11, dark: 8 };
/** Con poco aire (la palabra cubre más del 14 % de la pantalla) la luz de borde baja un peldaño: §5.4 mide el primer plano de la piel. */
const RING_DUO_LOW: RingTones = { edge: 9, skin: 9, light: 10, lit: 11, dark: 8 };
/** Pantallas casi llenas de palabra (1600×720: acc < 0,6): la pared vuelve a los tonos de la base de bloques sólidos. */
const RING_DUO_TIGHT: RingTones = { edge: 8, skin: 9, light: 10, lit: 10, dark: 7 };
const GLASS_BG = 3;
const GLASS_FG = 6;
const MENISCUS_BG = 8;
const MENISCUS_FG = 12;
const AURA_BG = [8, 6] as const;
const SHADOW_FG = 2;
const SHADOW_BG = 1;

export function createCover(o: CoverOpts = {}): Scene {
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
      const acc = accentDensity(inkCells, spec.cols, spec.rows);
      const hi = acc >= 0.95 && spec.cols * spec.rows >= 6000;
      const ringT = hi ? RING_DUO : acc < 0.6 ? RING_DUO_TIGHT : RING_DUO_LOW;
      const bw = Math.max(1, maxX - minX);
      const bh = Math.max(1, maxY - minY);
      // aro (bloques y cuadrantes limpios), como lista: se revela por barrido
      const ringPos: number[] = [];
      const ringGl: number[] = [];
      const ringTn: number[] = [];
      const ringRt: number[] = [];
      const ringLayer = makeCells(spec.cols, spec.rows);
      for (const l of lines) {
        paintRing(ringLayer, l.word, l.x0, l.y0, l.face, ringT, (hi ? 0.4 : 0.25) * acc, hi ? 2 : 1);
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
          ringRt.push(Math.round(s * 255));
        }
      }
      // sombra de una celda y aura pegada al trazo; ambas marcadas como atmósfera (cls 3) para la marea
      const dist = distField(spec.cols, spec.rows, lines);
      const shadow = bakeShadow(spec.cols, spec.rows, lines);
      const enclosed = enclosedCells(spec.cols, spec.rows, lines);
      const aura = bakeAura(dist, spec.cols, spec.rows, shadow, 1.01, mobile ? 1.01 : 2.01, enclosed);
      for (let n = 0; n < shadow.pos.length; n++) {
        const i = (shadow.pos[n] >> 16) * spec.cols + (shadow.pos[n] & 0xffff);
        if (st.cls[i] === 0) st.cls[i] = 3;
      }
      for (let n = 0; n < aura.pos.length; n++) {
        const i = (aura.pos[n] >> 16) * spec.cols + (aura.pos[n] & 0xffff);
        if (st.cls[i] === 0) st.cls[i] = 3;
      }
      // chispas: celdas parciales con luz de borde, elegidas por hash
      const cand: number[] = [];
      for (const l of lines) {
        for (let y = 0; y < l.word.rows; y++) {
          for (let x = 0; x < l.word.cols; x++) {
            const i = y * l.word.cols + x;
            if (l.face.cls[i] === C_EDGE && l.word.cells[i] !== 15 && bevel(l.word, x, y, ringT) === ringT.light) cand.push(l.x0 + x + ((l.y0 + y) << 16));
          }
        }
      }
      const nSp = mobile ? 3 : 5;
      const sparks: number[] = [];
      for (let k = 0; k < nSp && cand.length > 0; k++) sparks.push(cand[hu(k, 7, 99) % cand.length]);
      const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
      const clearBelow = Math.min(maxY + 5, (spec.rows >> 1) - 2);
      const dens = clusterField(spec.cols, spec.rows, 41, 0.12, 0.42, clearBelow);
      for (let i = 0; i < dens.length; i++) if (enclosed[i] === 1) dens[i] = 0; // los contrapunzones quedan oscuros (figura y fondo)
      INNER.set(st, {
        spec,
        lines,
        fPos: Int32Array.from(fPos),
        fBias: Int8Array.from(fBias),
        ringPos: Int32Array.from(ringPos),
        ringGl: Uint8Array.from(ringGl),
        ringTn: Uint8Array.from(ringTn),
        ringRt: Uint8Array.from(ringRt),
        shadow,
        aura,
        glow: glowFromDist(dist, 3.6),
        dens,
        sparks: Int32Array.from(sparks),
        cx: spec.cols / 2,
        cy: (minY + maxY) / 2 + 1,
        rx: Math.min(spec.cols * 0.5, 74) * k,
        ry: Math.min(spec.rows * (mobile ? 0.32 : 0.4), mobile ? 18 : 15.5) * k,
        k2: k * k,
        acc,
        hi,
        yFade: maxY,
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
        mistDuo(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * k, ry: I.ry * k, gain: 2.0 * open, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.85 * open * I.k2, dens: I.dens, heat: f.heat, yFade: I.yFade }, t, tl);
      }
      // 2 · aura (fondo de luz pegado al trazo) y sombra de una celda: aparecen con el aro, celda a celda
      if (p >= RING_AT) {
        const a = smooth(RING_AT, 0.45, p) * 256;
        for (let n = 0; n < I.aura.pos.length; n++) {
          if (I.aura.rt[n] >= a) continue;
          const x = I.aura.pos[n] & 0xffff;
          const y = I.aura.pos[n] >> 16;
          const hh = hu(x, y, 34);
          const bg = AURA_BG[I.aura.tier[n]];
          if ((hh & 255) < 70) putDuo(g, x, y, 1 + ((hh >>> 8) & 1), hh >>> 12, 8, bg);
          else put(g, x, y, 0, bg, bg);
        }
      }
      if (p >= 0.7) {
        const a = smooth(0.7, 0.95, p) * 256;
        for (let n = 0; n < I.shadow.pos.length; n++) {
          if (I.shadow.rt[n] < a) {
            const x = I.shadow.pos[n] & 0xffff;
            const y = I.shadow.pos[n] >> 16;
            const sh = hu(x, y, 31);
            if ((sh & 255) < 90) putDuo(g, x, y, 2, sh >>> 8, SHADOW_FG, SHADOW_BG);
            else put(g, x, y, 0, SHADOW_BG, SHADOW_BG);
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
          if (I.ringGl[n] === G_FULL) putWall(g, rx, ry, tn > 15 ? 15 : tn, hu(rx, ry, 23), I.acc);
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
              // vidrio vacío: fondo oscuro con puntos y dos puntos en TODAS las celdas y, de vez en cuando, el reflejo de una luz de estudio (`/`)
              let bg = GLASS_BG;
              let fg = GLASS_FG;
              let lv = 1 + (hh & 1);
              let gl = DUO_RAMP[(lv << 2) | ((hh >>> 3) & 3)];
              if (((3 * sx + 5 * sy) % 43) < 3 && caustic > 0.2) {
                gl = G_SLASH;
                fg = 9;
                bg = 6;
              }
              if (hot > 0.04) {
                bg += Math.round(hot * 3);
                fg += Math.round(hot * 5);
                lv = 1 + Math.round(hot * 4);
                if (gl !== G_SLASH) gl = DUO_RAMP[(lv << 2) | ((hh >>> 3) & 3)];
              }
              put(g, sx, sy, gl, fg > 15 ? 15 : fg, bg > 15 ? 15 : bg);
              continue;
            }
            if (meniscus && sy === yWater) {
              // menisco: una fila de `~` y `=` (la cresta ondula con el agua)
              const crest = sinp(sx * 0.55 + t * 1.3) > 0.3;
              const mf = I.hi ? MENISCUS_FG : MENISCUS_FG - 1; // con poco aire el menisco baja un peldaño (§5.4)
              put(g, sx, sy, (hh & 3) === 0 ? G_EQ : G_TILDE, crest ? mf + 1 : mf, MENISCUS_BG);
              continue;
            }
            const depth = (sy - yWater) / span;
            const c = caustic * agua(tl, sx, sy, t);
            let v = 0.4 + 0.66 * c - 0.3 * depth + 0.1 * I.fBias[q];
            if (hot > 0.04) v += 0.5 * hot;
            let lv = (v * 10) | 0;
            lv = lv < 2 ? 2 : lv > 9 ? 9 : lv;
            // fondo: el tono de la base de bloques, repartido entre dos tonos con ruido azul (sin facetas planas)
            const bgf = 4.2 + 2 * c - 0.9 * depth + 0.4 * I.fBias[q] + (depth < 0.2 ? 0.6 : 0);
            let bg = (bgf + bn(sx, sy) - 0.5 + 0.5) | 0;
            bg = bg < 2 ? 2 : bg > 7 ? 7 : bg;
            let fg = inkTone(bg, lv);
            if (lv >= 7 && bg <= 6) fg = bg + 4 > 10 ? 10 : bg + 4; // los peldaños ≥ 7 de las cáusticas son el brillo del agua: llegan a T10
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

export const cover: Scene = createCover();
export default cover;
