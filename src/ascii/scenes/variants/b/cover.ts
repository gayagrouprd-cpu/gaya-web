// Variante B · `cover` · GAYA — «el agua hecha del nombre». Un rótulo cuya agua está escrita con las letras de la marca.
//
// Mismo guion y mismas reglas que `scenes/cover.ts` (ignición de 2,6 s, `still` ≡ paint(p = 1, STILL_T), solo enteros y polinomios en la ruta del
// fotograma fijo, sin asignaciones por cuadro), pero la materia cambia: la cara no es un bloque `█` de tono sino una TELA de glifos ordenados por
// tinta medida (ramp.ts, rampa ` ·:=*yaAG▒▓█`). La luz de cada celda (inflado del trazo + cáusticas de gran escala + destello diagonal + profundidad)
// se traduce a la rampa con el ruido azul de la celda: `y a` en las zonas medias, `A G` solo en las crestas y en el borde iluminado; la puntuación
// es la bruma. El aro es la piel de cuadrantes (el contorno del rótulo); su pared es una fila de letras.
//
// DIFERENCIA CON LA BASE (decisión de B, a revisar por el dueño): usa `bg` en tonos bajos (losa de agua T3–T5 bajo las letras y aura T1–T2 bajo la
// bruma). Sin él las letras (tinta máxima ≈ 30 %) no sostienen la silueta de GAYA a primera vista. Con `bg` el póster SSR de 4 capas (que ignora el
// fondo) pierde la losa: se ve la tela de letras sobre negro, no el cartel entero. Todo el `bg` está por debajo de T6 (nunca cuenta para el presupuesto).
//
// Capas, de atrás adelante: 1 bruma de puntuación + aura · 2 sombra (+2, +1) · 3 aro de luz · 4 vidrio y agua escritos con la rampa · 5 chispas · 6 calor y anillos.
import type { Cells, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "../../common.ts";
import type { FaceInfo } from "../../common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, bevel, bn, clear, easeOutCubic, faceFn, faceLevelRow, glowField, hu, layoutLines, makeCells, makeState,
  markAura, paintRing, put, setTone, shadow, sinp, smooth, stampCls, waterTile,
} from "../../common.ts";
import { mistB } from "./fabric.ts";
import { B_RING, G_FULL, G_SHADE_L, RAMP_GL, lightToU, rampStep, toneOfLight } from "./ramp.ts";

/** Afinado de la tela. Los valores por omisión son los de la entrega; las herramientas de revisión de arte los cambian para comparar. */
export interface CoverBOpts {
  /** Nivel de reposo del agua 0..1 sobre la altura de la CARA (0,78 como la base). */
  level?: number;
  /** Anchura de la costura entre letras 0..1 (1 = mezcla total de dos letras vecinas; 0,7 = mesetas de una letra y costura estrecha). */
  seam?: number;
  /** Luz mínima del agua (0..1): el suelo de la tela (` : =` por debajo, `y a` por encima). */
  floor?: number;
  /** Tono de la losa de agua bajo las letras (bg; 0 = sin bg). La pared es 1 menos, el vidrio vacío 2 menos. */
  bg?: number;
  /** Tono máximo del aura de bg bajo la bruma (0 = sin aura; 2 por omisión). */
  bgGlow?: number;
  /** Escala de las cáusticas de la tela: 1 = la del agua de la base (filamentos de 2–5 celdas); 0,3 = cintas de luz de 6–12. */
  cs?: number;
  /** Grano de la tela (0..1): rompe las rachas de una misma letra en las barras. */
  grain?: number;
  /** Tono de las letras del agua en luz 0; sube hasta `toneHi` en luz 1. */
  toneLo?: number;
  toneHi?: number;
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
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  ringRt: Uint8Array;
  shPos: Int32Array;
  shRt: Uint8Array;
  /** Celdas de la tela (cara y pared de todas las líneas): posición, distancia al borde (chebyshev), línea, luz de borde de la pared y umbral de ruido azul. */
  fx: Int16Array;
  fy: Int16Array;
  fd: Uint8Array;
  fl: Uint8Array;
  /** Pared del aro: 0 = no es pared · 10 = lado de la luz (arriba-izquierda) · 8 = neutra · 7 = lado de la sombra. */
  fb: Uint8Array;
  fth: Uint8Array;
  glow: Uint8Array;
  sparks: Int32Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
}
const INNER = new WeakMap<SceneState, Inner>();

// ---- guion de la ignición (§7.1), todo en función de p (el mismo que la base) ----
const MIST_OPEN = [0, 0.15] as const;
const RING_AT = 0.05;
const RING_SPAN = 0.2;
const LEVEL_AT = 0.1;
const LEVEL_SPAN = 0.8;
const LEVEL_REST = 0.78;
const CAUSTIC = [0.3, 0.8] as const;
const FINISH = 0.75;

/** Inflado: la luz sube hacia el borde del trazo (pared · 2.ª celda · 3.ª · centro hondo), como un rótulo con volumen. */
const INFL = [0.14, 0.08, 0.02, -0.04] as const;
/** Luz extra de la pared según el bisel (lado de la luz · neutra · sombra). */
const BEV_LIT = 0.04;
const BEV_MID = -0.04;
const BEV_DARK = -0.16;

export function createCoverB(o: CoverBOpts = {}): Scene {
  const levelMax = o.level ?? LEVEL_REST;
  const seam = o.seam ?? 0.7;
  const floorV = o.floor ?? 0.46;
  const faceBg = o.bg ?? 5;
  const bgGlow = o.bgGlow ?? 2;
  const cs = o.cs ?? 0.3;
  const grain = o.grain ?? 0.14;
  const toneLo = o.toneLo ?? 5;
  const toneHi = o.toneHi ?? 10.5;
  return {
    id: "cover",
    dawn: 0,
    arrival: { ms: 2600 },
    build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
      const st = makeState(spec);
      const mobile = spec.cols < 90;
      const yTop = mobile || spec.rows < 44 ? 3 : 4;
      const lines: Line[] = layoutLines(spec, words[0], yTop, mobile ? 2 : 1).map((p): Line => ({ x0: p.x0, y0: p.y0, word: p.word, face: faceFn(p.word, p.x0, p.y0) }));
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
      // aro: SOLO la piel de cuadrantes (celdas parciales); la pared (celda llena contigua al borde) pasa a la tela de letras
      const ringPos: number[] = [];
      const ringGl: number[] = [];
      const ringTn: number[] = [];
      const ringRt: number[] = [];
      const ringLayer = makeCells(spec.cols, spec.rows);
      for (const l of lines) {
        paintRing(ringLayer, l.word, l.x0, l.y0, l.face, B_RING, 0.3, 2);
        stampCls(st.cls, spec.cols, spec.rows, l.face);
      }
      const wall = new Set<number>();
      for (let y = 0; y < spec.rows; y++) {
        for (let x = 0; x < spec.cols; x++) {
          const k = (y * spec.cols + x) << 2;
          if (ringLayer.b[k] === 0) continue;
          if (ringLayer.b[k] === G_FULL) {
            wall.add(y * spec.cols + x);
            continue;
          }
          ringPos.push(x | (y << 16));
          ringGl.push(ringLayer.b[k]);
          ringTn.push(ringLayer.b[k + 1]);
          // barrido: de abajo-izquierda (0) a arriba-derecha (255)
          const s = 0.65 * ((x - minX) / bw) + 0.35 * ((maxY - y) / bh);
          ringRt.push(Math.max(0, Math.min(255, Math.round(s * 255))));
        }
      }
      // sombra proyectada (+2, +1)
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
      // celdas de la tela
      const fx: number[] = [];
      const fy: number[] = [];
      const fd: number[] = [];
      const fl: number[] = [];
      const fb: number[] = [];
      const fth: number[] = [];
      lines.forEach((l, n) => {
        for (let y = 0; y < l.word.rows; y++) {
          for (let x = 0; x < l.word.cols; x++) {
            const i = y * l.word.cols + x;
            const isWall = wall.has((l.y0 + y) * spec.cols + (l.x0 + x));
            if (l.face.cls[i] !== C_FACE && !isWall) continue;
            fx.push(l.x0 + x);
            fy.push(l.y0 + y);
            fd.push(Math.min(255, l.face.dist[i]));
            fl.push(n);
            fb.push(isWall ? bevel(l.word, x, y) : 0);
            fth.push(Math.min(255, Math.floor(bn(l.x0 + x, l.y0 + y) * 256)));
          }
        }
      });
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
      // pantallas con pocas celdas: la bruma se encoge con la raíz del área (la portada no pasa del 60 % de celdas no vacías)
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
        fx: Int16Array.from(fx),
        fy: Int16Array.from(fy),
        fd: Uint8Array.from(fd),
        fl: Uint8Array.from(fl),
        fb: Uint8Array.from(fb),
        fth: Uint8Array.from(fth),
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
      // 1 · bruma de puntuación y aura: se abre desde el centro
      const open = smooth(MIST_OPEN[0], MIST_OPEN[1], p);
      if (open > 0) {
        const k = 0.15 + 0.85 * open;
        mistB(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * k, ry: I.ry * k, gain: 2.4 * open, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.3 * open * I.k2, heat: f.heat, bgGlow }, t, tl);
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
      // 4 · vidrio y agua escritos con la rampa del nombre
      if (p >= LEVEL_AT) {
        const level = levelMax * easeOutCubic((p - LEVEL_AT) / LEVEL_SPAN);
        const caustic = smooth(CAUSTIC[0], CAUSTIC[1], p);
        paintFabric(g, I, tl, t, caustic, level, f.heat, seam, floorV, faceBg, cs, grain, toneLo, toneHi);
      }
      // 5 · chispas
      if (p >= FINISH) {
        const a = smooth(FINISH, 1, p);
        for (let n = 0; n < I.sparks.length; n++) if (a > (n + 1) / (I.sparks.length + 1) - 0.1) setTone(g, I.sparks[n] & 0xffff, I.sparks[n] >> 16, 15);
      }
      // 6 · calor sobre el aro (la tela y la bruma ya lo llevan dentro) y anillos
      if (f.heat !== null) {
        const cols = I.spec.cols;
        for (let n = 0; n < I.ringPos.length; n++) {
          const x = I.ringPos[n] & 0xffff;
          const y = I.ringPos[n] >> 16;
          const h = f.heat[y * cols + x];
          if (h < 0.04) continue;
          const k = ((y * cols + x) << 2) + 1;
          if (g.b[k] === 0) continue;
          const tn = g.b[k] + Math.round(2.6 * h);
          g.b[k] = tn > 13 ? 13 : tn;
        }
      }
      applyRings(g, f.rings, 2);
    },
  };
}

/**
 * La tela de glifos de la cara y la pared: por cada celda se calcula la LUZ v y se traduce a la rampa del nombre con el ruido azul de la celda.
 *   · en la fila del nivel: el menisco, una fila de las letras más densas (`A G`);
 *   · sobre el nivel: vidrio vacío, `: = *` apenas más claros hacia el borde;
 *   · bajo el nivel: agua. v = suelo + inflado del trazo + cáusticas de gran escala + cinta diagonal de luz − profundidad. `y a` en las zonas medias,
 *     `A G` solo donde la cresta de la cáustica o el borde iluminado suben v. Nunca bloques en reposo (con calor, tampoco: sube el tono, no el glifo).
 */
function paintFabric(
  g: Cells, I: Inner, tl: Uint8Array, t: number, caustic: number, level: number, heat: Float32Array | null,
  seam: number, floorV: number, faceBg: number, cs: number, grain: number, toneLo: number, toneHi: number,
): void {
  const cols = I.spec.cols;
  const lines = I.lines;
  const n = I.fx.length;
  for (let i = 0; i < n; i++) {
    const l = lines[I.fl[i]];
    const x = I.fx[i];
    const y = I.fy[i];
    const yWater = faceLevelRow(l.face, level);
    const span = Math.max(1, l.y0 + l.face.fy1 + 1 - yWater);
    const h = heat === null ? 0 : heat[y * cols + x];
    const th = (I.fth[i] + 0.5) / 256;
    const k = (y * cols + x) << 2;
    const wb = I.fb[i];
    const d = I.fd[i];
    const infl = d <= 1 ? INFL[0] : d === 2 ? INFL[1] : d === 3 ? INFL[2] : INFL[3];
    let v: number;
    let lo = toneLo;
    let hi = toneHi;
    let bg = faceBg;
    if (y === yWater && level > 0 && level < 1) {
      // el menisco: letras densas `G A` a lo largo de todo el trazo, con la cresta de la onda un tono más
      v = 0.94 + 0.06 * (sinp(x * 0.55 + t * 1.3) > 0.3 ? 1 : 0) + 0.3 * h;
      g.b[k] = RAMP_GL[rampStep(lightToU(v > 1 ? 1 : v), th, 1)];
      g.b[k + 1] = 12 + (h > 0.3 ? 2 : 0);
      if (faceBg > 0) {
        g.b[k + 2] = faceBg;
        g.b[k + 3] |= 3;
      } else g.b[k + 3] |= 1;
      continue;
    }
    if (y < yWater) {
      // vidrio vacío: puntuación y letras tenues (más claras hacia el borde), destello diagonal y calor («linterna»)
      const band = (3 * x + 5 * y) % 43 < 6 * caustic ? 1 : 0;
      v = 0.4 + 0.5 * infl + (wb !== 0 ? 0.12 : 0) + 0.08 * band + 0.6 * h;
      lo = 3;
      hi = 9;
      bg = faceBg - 2;
    } else if (wb !== 0) {
      // la pared: una fila de las letras más densas, `A G` donde le llega la luz y `y a` donde no
      v = floorV + infl + (wb >= 10 ? BEV_LIT : wb === 8 ? BEV_MID : BEV_DARK) + 0.2 * caustic * agua(tl, x * cs, y * cs, t * cs) + 0.45 * h;
      lo = 2;
      hi = wb >= 10 ? 10 : wb === 8 ? 9 : 8;
      bg = wb >= 10 ? faceBg : faceBg - 1;
    } else {
      const depth = (y - yWater) / span;
      const sh = 0.5 + 0.5 * sinp(x * 0.13 + y * 0.24 + t * 0.12);
      const c = caustic * agua(tl, x * cs, y * cs, t * cs);
      const c2 = h > 0.04 ? caustic * agua(tl, x * cs, y * cs, (t * 3 + 11) * cs) : c;
      const cc = c * (1 - h) + c2 * h;
      v = floorV + infl + 0.6 * cc + 0.3 * sh * sh * sh * caustic - 0.26 * depth + 0.5 * h;
      if (depth > 0.8) bg = faceBg - 1;
      else if (v > 0.88) bg = faceBg + 1; // el núcleo de la cresta también brilla de fondo (el bg no cuenta para el presupuesto y T6 es el tope bajo texto)
    }
    v += (hu(x, y, 77) / 4294967296 - 0.5) * grain; // grano: rompe las rachas de una misma letra en las barras
    if (v > 1) v = 1 - 0.14 * (hu(x, y, 79) / 4294967296); // la tela es de letras (los bloques `▒ ▓ █` quedan para el aro); por encima de G se mezclan A y G, no una racha de G
    g.b[k] = RAMP_GL[rampStep(lightToU(v), th, seam)];
    const tn = toneOfLight(v, lo, hi) + (h > 0.3 ? Math.round(3 * h) : 0);
    g.b[k + 1] = tn > 14 ? 14 : tn;
    if (faceBg > 0) {
      g.b[k + 2] = bg;
      g.b[k + 3] |= 3;
    } else g.b[k + 3] |= 1;
  }
}

export const coverB: Scene = createCoverB();
export default coverB;
