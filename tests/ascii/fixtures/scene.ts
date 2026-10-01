// Escena de PRUEBA de WP4 (no es la escena real `cover`, que construye WP6): usa faceFn, halo, shadow, mist, agua y el aro con
// bisel del kit sobre una palabra de cuadrantes de ejemplo, con el guion de ignición de §7.1 en versión mínima.
// Sirve para (1) probar determinismo, pureza, sin `bg` y el póster SSR, (2) medir el coste del kit y (3) revisar a la vista que
// la anatomía del cartel de §5.5 (cara luminosa, aro de luz, sombra proyectada, halo, bruma) sale como se vio en color en §2.1.
import type { Cells, Frame, GridSpec, Lang, Scene, SceneId, SceneState, WordSet } from "../../../src/ascii/types.ts";
import type { FaceInfo } from "../../../src/ascii/kit.ts";
import {
  C_EDGE, C_FACE, RING_TONES, applyRings, bevel, clear, easeOutExpo, faceFn, halo, hu, layoutLines, makeCells, makeState, markAura, mist, overlay, paintFace, paintRing,
  getTone, setTone, shadow, smooth, stampCls, waterTile,
} from "../../../src/ascii/scenes/common.ts";

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
}
interface Inner {
  spec: GridSpec;
  lines: Line[];
  ring: Cells;
  aura: Cells;
  sparks: [number, number][];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  waterTop: number;
  waterBot: number;
}

const INNER = new WeakMap<SceneState, Inner>();

export interface TestSceneOpts {
  id?: SceneId;
  /** Tono base de la cara (8 = cartel de agua; 9 = ECO y VER). */
  base?: number;
  /** Vidrio con agua (GAYA, TÚ) o cara sólida. */
  glass?: boolean;
  /** Fila superior de la palabra. */
  yTop?: number;
  dawn?: number;
  /** Duración del guion de llegada (ms). */
  ms?: number;
}

export function createTestScene(o: TestSceneOpts = {}): Scene {
  const base = o.base ?? 8;
  const glass = o.glass ?? true;
  const dawn = o.dawn ?? 0;
  return {
    id: o.id ?? "cover",
    dawn,
    arrival: { ms: o.ms ?? 2600 },
    build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
      const st = makeState(spec);
      const set = words[0];
      const mobile = spec.cols < 90;
      const lines = layoutLines(spec, set, o.yTop ?? (mobile ? 5 : 6), mobile ? 2 : 1).map((p): Line => ({ x0: p.x0, y0: p.y0, word: p.word, face: faceFn(p.word, p.x0, p.y0) }));
      const ring = makeCells(spec.cols, spec.rows);
      const aura = makeCells(spec.cols, spec.rows);
      let top = 1e9;
      let bot = -1;
      for (const l of lines) {
        paintRing(ring, l.word, l.x0, l.y0, l.face);
        shadow(aura, l.word, l.x0, l.y0);
        halo(aura, l.word, l.x0, l.y0, 4);
        stampCls(st.cls, spec.cols, spec.rows, l.face);
        top = Math.min(top, l.y0);
        bot = Math.max(bot, l.y0 + l.word.rows);
      }
      markAura(st.cls, aura);
      // chispas: 5 celdas llenas del aro (un `█` T13 que pasa a T15: sin glifo nuevo, sin agujeros) elegidas por hash
      const faceCells: [number, number][] = [];
      for (const l of lines) for (let y = 0; y < l.word.rows; y++) for (let x = 0; x < l.word.cols; x++) {
        const i = y * l.word.cols + x;
        if (l.face.cls[i] === C_EDGE && l.word.cells[i] === 15 && bevel(l.word, x, y) === RING_TONES.lit) faceCells.push([l.x0 + x, l.y0 + y]);
      }
      const sparks: [number, number][] = [];
      for (let k = 0; k < 5 && faceCells.length > 0; k++) sparks.push(faceCells[hu(k, 7, 99) % faceCells.length]);
      INNER.set(st, {
        spec, lines, ring, aura, sparks,
        cx: spec.cols / 2,
        cy: (top + bot) / 2,
        rx: spec.cols * 0.56,
        ry: spec.rows * (mobile ? 0.33 : 0.4),
        waterTop: top,
        waterBot: bot,
      });
      return st;
    },
    paint(g: Cells, s: SceneState, f: Frame): void {
      const I = INNER.get(s) as Inner;
      const p = f.p;
      const tl = waterTile();
      clear(g, 0);
      // bruma: se abre desde el centro (radio 0 → 100 %) en p 0..0,15
      const open = smooth(0, 0.15, p);
      if (open > 0) {
        mist(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * (0.15 + 0.85 * open), ry: I.ry * (0.15 + 0.85 * open), gain: 0.6 + 0.4 * open, cap: 6 + (dawn >= 0.5 ? 1 : 0), wells: f.cap }, f.t, tl);
      }
      // capas horneadas: aro desde p = 0,05; sombra y halo desde p = 0,75
      if (p >= 0.05) overlay(g, I.ring);
      if (p >= 0.75) overlay(g, I.aura);
      const level = glass ? 0.85 * easeOutExpo((p - 0.1) / 0.75) : undefined;
      const caustic = smooth(0.3, 0.8, p);
      for (let n = 0; n < I.lines.length; n++) {
        const l = I.lines[n];
        if (p >= 0.05) paintFace(g, l.word, l.x0, l.y0, l.face, { base, tile: tl, t: f.t, caustic, level, glass: 2 });
      }
      if (p >= 0.75) for (let n = 0; n < I.sparks.length; n++) setTone(g, I.sparks[n][0], I.sparks[n][1], 15);
      // calor: el vidrio vacío por encima del nivel se enciende como una linterna
      if (f.heat !== null) {
        for (let n = 0; n < I.lines.length; n++) {
          const l = I.lines[n];
          for (let y = 0; y < l.word.rows; y++) for (let x = 0; x < l.word.cols; x++) {
            if (l.face.cls[y * l.word.cols + x] !== C_FACE) continue;
            const h = f.heat[(l.y0 + y) * I.spec.cols + (l.x0 + x)];
            if (h > 0.05) setTone(g, l.x0 + x, l.y0 + y, Math.max(getTone(g, l.x0 + x, l.y0 + y), 2 + Math.round(h * 7)));
          }
        }
      }
      applyRings(g, f.rings, 2);
    },
  };
}
