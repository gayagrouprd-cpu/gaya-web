// `cover` · GAYA — «el agua hecha del nombre» (DIRECTION §5.5, §7.1). Un rótulo de vidrio con agua dentro, sobre una bruma de luz que
// sale de la propia palabra: aro de luz, nivel de agua con menisco, cáusticas, sombra proyectada y destellos.
//
// Sin `bg` (tiene póster SSR, §6.9): todo en primer plano; donde hace falta «vidrio», `▒` translúcido. `build` es puro y corre en Node;
// `paint` solo usa enteros y polinomios (`smooth`, `easeOutCubic`, `sinp`), así que el `still` es idéntico en cualquier motor.
//
// Capas, de atrás adelante: 1 bruma (elipse gaussiana + luz que emana de la palabra, con viñeta) · 2 sombra proyectada (+2, +1) · 3 aro de
// luz (piel de T9–T10 sobre pared de T8, con destellos) · 4 vidrio con agua (vidrio `▒` sobre el nivel, menisco de bloque lleno, agua más
// oscura hacia el fondo con cáusticas y un reflejo diagonal) · 5 chispas T15 · 6 calor (linterna) y anillos.
import type { Cells, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "./common.ts";
import type { FaceInfo } from "./common.ts";
import {
  C_EDGE, C_FACE, G_FULL, G_GLASS, RING_TONES, agua, applyRings, bevel, clear, easeOutCubic, faceFn, faceLevelRow, glowField, glyphIndex, hu, layoutLines, makeCells,
  makeState, markAura, mist, paintFace, paintRing, put, setTone, shadow, smooth, stampCls, waterTile, waterTone,
} from "./common.ts";

export interface CoverOpts {
  /** `solid` (por defecto): caras de tono sólido `█`. `glyph`: el agua está hecha de glifos `· : ~ = + *` (exploración de WP6, ?face=glyph). */
  face?: "solid" | "glyph";
  /** Nivel de reposo del agua 0..1 sobre la altura de la CARA (0,78 por omisión; ver `faceLevelRow`). */
  level?: number;
}

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
}
interface Inner {
  spec: GridSpec;
  lines: Line[];
  /** Aro horneado como lista de celdas: posición empaquetada (x | y << 16), glifo, tono y umbral de aparición 0..255. */
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  ringRt: Uint8Array;
  /** Sombra proyectada: posición y umbral de aparición (0..255, por hash). */
  shPos: Int32Array;
  shRt: Uint8Array;
  glow: Uint8Array;
  sparks: Int32Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Factor de la luz de la palabra en pantallas pequeñas (k²). */
  k2: number;
}
const INNER = new WeakMap<SceneState, Inner>();

// ---- guion de la ignición (§7.1), todo en función de p ----
const MIST_OPEN = [0, 0.15] as const; // la bruma se abre desde el centro
const RING_AT = 0.05; // el aro se traza de p = 0,05 a 0,25, barriendo de abajo-izquierda a arriba-derecha
const RING_SPAN = 0.2;
const LEVEL_AT = 0.1; // el nivel sube hasta su reposo entre p = 0,10 y 0,90 con una salida cúbica (la quíntica de kit.easeOutExpo se comía el 80 % del recorrido en el primer cuarto)
const LEVEL_SPAN = 0.8;
const LEVEL_REST = 0.78; // sobre la altura de la CARA (ver faceLevelRow): 0,85 sobre la palabra caía dentro del aro
const CAUSTIC = [0.3, 0.8] as const;
const FINISH = 0.75; // chispas (la sombra aparece de 0,70 a 0,95)

const G_SHADE_L = glyphIndex("░");
const G_SHADE_M = glyphIndex("▒");
const G_TILDE = glyphIndex("~");
// rampa de glifos de la variante `glyph`: de menos a más tinta
const WATER_RAMP: readonly number[] = ["·", ":", "~", "=", "+", "*"].map((c) => glyphIndex(c));

export function createCover(o: CoverOpts = {}): Scene {
  const glyphFace = o.face === "glyph";
  const levelMax = o.level ?? LEVEL_REST;
  return {
    id: "cover",
    dawn: 0,
    arrival: { ms: 2600 },
    build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
      const st = makeState(spec);
      const mobile = spec.cols < 90;
      const yTop = mobile || spec.rows < 44 ? 3 : 4;
      const lines: Line[] = layoutLines(spec, words[0], yTop, mobile ? 2 : 1).map((p): Line => ({ x0: p.x0, y0: p.y0, word: p.word, face: faceFn(p.word, p.x0, p.y0) }));
      // caja de la palabra (para el barrido del aro y el centro de la bruma)
      let minX = 1e9;
      let maxX = -1;
      let minY = 1e9;
      let maxY = -1;
      for (const l of lines) {
        minX = Math.min(minX, l.x0);
        maxX = Math.max(maxX, l.x0 + l.word.cols);
        minY = Math.min(minY, l.y0);
        maxY = Math.max(maxY, l.y0 + l.word.rows);
      }
      const bw = Math.max(1, maxX - minX);
      const bh = Math.max(1, maxY - minY);
      // aro, como lista (se revela por barrido)
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
          // barrido: de abajo-izquierda (0) a arriba-derecha (255)
          const s = 0.65 * ((x - minX) / bw) + 0.35 * ((maxY - y) / bh);
          ringRt.push(Math.max(0, Math.min(255, Math.round(s * 255))));
        }
      }
      // sombra proyectada (+2, +1): celdas vacías; cada una con su umbral de aparición por hash
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
            if (l.face.cls[i] === C_EDGE && l.word.cells[i] !== 15 && bevel(l.word, x, y) === RING_TONES.light) cand.push((l.x0 + x) | ((l.y0 + y) << 16));
          }
        }
      }
      const nSp = mobile ? 3 : 5;
      const sparks: number[] = [];
      for (let k = 0; k < nSp && cand.length > 0; k++) sparks.push(cand[hu(k, 7, 99) % cand.length]);
      const glow = glowField(spec.cols, spec.rows, lines, 3.6);
      // pantallas con pocas celdas (1600×900 a 12×25, móvil estrecho): la palabra ya ocupa media pantalla; la bruma se encoge con la raíz del área
      // para que la portada no pase del 60 % de celdas no vacías (§5.4)
      const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
      INNER.set(st, {
        spec,
        lines,
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
      });
      return st;
    },
    paint(g: Cells, s: SceneState, f: Frame): void {
      const I = INNER.get(s) as Inner;
      const { p, t } = f;
      const tl = waterTile();
      clear(g, 0);
      // 1 · bruma de luz: se abre desde el centro
      const open = smooth(MIST_OPEN[0], MIST_OPEN[1], p);
      if (open > 0) {
        const k = 0.15 + 0.85 * open;
        mist(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * k, ry: I.ry * k, gain: 2.6 * open, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.85 * open * I.k2, heat: f.heat }, t, tl);
      }
      // 2 · sombra proyectada (aparece con el final de la ignición, celda a celda)
      if (p >= 0.7) {
        const a = smooth(0.7, 0.95, p) * 255;
        for (let n = 0; n < I.shPos.length; n++) if (I.shRt[n] < a) put(g, I.shPos[n] & 0xffff, I.shPos[n] >> 16, G_SHADE_L, 2);
      }
      // 3 · aro de luz: se traza barriendo; la cabeza del barrido brilla
      if (p >= RING_AT) {
        const pr = (p - RING_AT) / RING_SPAN;
        for (let n = 0; n < I.ringPos.length; n++) {
          const r = I.ringRt[n] / 255;
          if (pr < r) continue;
          let tn = I.ringTn[n];
          if (!f.still && pr - r < 0.22) tn += 3;
          put(g, I.ringPos[n] & 0xffff, I.ringPos[n] >> 16, I.ringGl[n], tn > 15 ? 15 : tn);
        }
      }
      // 4 · vidrio con agua: nivel, menisco, cáusticas
      const level = levelMax * easeOutCubic((p - LEVEL_AT) / LEVEL_SPAN);
      const caustic = smooth(CAUSTIC[0], CAUSTIC[1], p);
      if (p >= LEVEL_AT) {
        for (let n = 0; n < I.lines.length; n++) {
          const l = I.lines[n];
          if (glyphFace) paintGlyphFace(g, l, tl, t, caustic, level);
          else paintFace(g, l.word, l.x0, l.y0, l.face, { base: 5, tile: tl, t, caustic, level, sheen: caustic });
        }
      }
      // 5 · chispas
      if (p >= FINISH) {
        const a = smooth(FINISH, 1, p);
        for (let n = 0; n < I.sparks.length; n++) if (a > (n + 1) / (I.sparks.length + 1) - 0.1) setTone(g, I.sparks[n] & 0xffff, I.sparks[n] >> 16, 15);
      }
      // 6 · calor: linterna sobre el vidrio vacío
      if (f.heat !== null) heatLight(g, I, f.heat, tl, t, level, caustic);
      applyRings(g, f.rings, 2);
    },
  };
}

/** Variante `glyph`: el agua es una textura de glifos `· : ~ = + *` (más tinta = más luz) en vez de bloques de tono sólido. */
function paintGlyphFace(g: Cells, l: Line, tl: Uint8Array, t: number, caustic: number, level: number): void {
  const w = l.word;
  const yWater = faceLevelRow(l.face, level);
  for (let y = 0; y < w.rows; y++) {
    const sy = l.y0 + y;
    for (let x = 0; x < w.cols; x++) {
      const i = y * w.cols + x;
      if (l.face.cls[i] !== C_FACE) continue;
      const sx = l.x0 + x;
      if (sy < yWater) {
        put(g, sx, sy, G_GLASS, 4);
        continue;
      }
      if (sy === yWater && level > 0 && level < 1) {
        put(g, sx, sy, G_TILDE, 12);
        continue;
      }
      const depth = (sy - yWater) / Math.max(1, l.y0 + l.face.fy1 + 1 - yWater);
      const c = caustic * agua(tl, sx, sy, t);
      const v = 0.55 - 0.3 * depth + 0.6 * c;
      const k = v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.6 ? 2 : v < 0.8 ? 3 : v < 1 ? 4 : 5;
      put(g, sx, sy, WATER_RAMP[k], 6 + k);
    }
  }
}

/**
 * Calor (§7.1): el puntero es una linterna. Ilumina el vidrio vacío (las celdas sobre el nivel dentro del radio suben a T4–T9), enciende el
 * aro (+2,6 tonos como máximo, tope T13), hace correr las cáusticas del agua ×3 en su radio (mezcla continua de dos fases del agua) y
 * enciende la bruma (en `mist`, por `heat`). Solo sube tonos.
 */
function heatLight(g: Cells, I: Inner, heat: Float32Array, tl: Uint8Array, t: number, level: number, caustic: number): void {
  const cols = I.spec.cols;
  // el aro también se enciende bajo la linterna (hasta +2 tonos)
  for (let n = 0; n < I.ringPos.length; n++) {
    const x = I.ringPos[n] & 0xffff;
    const y = I.ringPos[n] >> 16;
    const h = heat[y * cols + x];
    if (h < 0.04) continue;
    const k = ((y * cols + x) << 2) + 1;
    if (g.b[k] === 0) continue;
    const tn = g.b[k] + Math.round(2.6 * h);
    g.b[k] = tn > 13 ? 13 : tn;
  }
  for (let n = 0; n < I.lines.length; n++) {
    const l = I.lines[n];
    const w = l.word;
    const yWater = faceLevelRow(l.face, level);
    const span = Math.max(1, l.y0 + l.face.fy1 + 1 - yWater);
    for (let y = 0; y < w.rows; y++) {
      const sy = l.y0 + y;
      for (let x = 0; x < w.cols; x++) {
        const i = y * w.cols + x;
        if (l.face.cls[i] !== C_FACE) continue;
        const sx = l.x0 + x;
        const h = heat[sy * cols + sx];
        if (h < 0.04) continue;
        const k = (sy * cols + sx) << 2;
        if (sy < yWater) {
          const tn = 4 + Math.round(h * 5);
          if (g.b[k + 1] < tn) {
            g.b[k] = h > 0.55 ? G_FULL : G_SHADE_M;
            g.b[k + 1] = tn;
          }
        } else if (sy > yWater) {
          const c = caustic * ((1 - h) * agua(tl, sx, sy, t) + h * agua(tl, sx, sy, t * 3 + 11));
          const tn = waterTone(5, (sy - yWater) / span, l.face.dist[i], c) + Math.round(1.6 * h);
          if (g.b[k + 1] < tn) g.b[k + 1] = tn > 15 ? 15 : tn;
        }
      }
    }
  }
}

export const cover: Scene = createCover();
export default cover;
