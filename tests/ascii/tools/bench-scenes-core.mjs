// Micro-benchmark de las escenas REALES de WP6 (DIRECTION §6.12, §12.7 punto 6): coste por cuadro de cover, hola y mist a 6 500 y 9 000
// celdas: en reposo (paint + pozos), con calor y anillos, en plena ignición, y un cuadro de marea cover → hola (2 paint + compose + pozos).
// Sin dependencias de Node para poder empaquetarlo con esbuild y ejecutarlo en Chrome con CPU ×4 / ×6 (bench-scenes.mjs).
import { getWords, loadWords } from '../../../src/ascii/words.ts';
import { STILL_T, bakeWaterTile, gridSpec, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover } from '../../../src/ascii/scenes/cover.ts';
import { hola } from '../../../src/ascii/scenes/hola.ts';
import { mistScene } from '../../../src/ascii/scenes/mist.ts';
import { compose, tideParams, tideYb } from '../../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';
import { renderPosterLayers } from '../../../src/ascii/ssr.ts';

const now = () => performance.now();
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
const stats = (xs) => {
  const s = Float64Array.from(xs).sort();
  return { p50: pct(s, 0.5), p95: pct(s, 0.95), max: s[s.length - 1] };
};
/** Rejillas con exactamente `cells` celdas (130×50 = 6 500 · 180×50 = 9 000). */
export const SIZES = { 6500: [130, 50], 9000: [180, 50] };

export async function runBench(cells, { frames = 300, warm = 100 } = {}) {
  await loadWords('es');
  const [cols, rows] = SIZES[cells];
  const spec = gridSpec(cols, rows, 9, 18, 2);
  const res = { cells, cols, rows };
  const words = (id) => [getWords(id, 'es', cols)];

  let t0 = now();
  bakeWaterTile(9);
  res.bakeTileMs = now() - t0;
  t0 = now();
  const stC = cover.build(spec, 'es', words('GAYA'));
  res.buildCoverMs = now() - t0;
  t0 = now();
  const stH = hola.build(spec, 'es', words('HOLA'));
  res.buildHolaMs = now() - t0;
  t0 = now();
  const stM = mistScene.build(spec, 'es', []);
  res.buildMistMs = now() - t0;
  t0 = now();
  renderPosterLayers(cover, spec, 'es', words('GAYA'));
  res.posterMs = now() - t0;

  const gC = makeCells(cols, rows);
  const gH = makeCells(cols, rows);
  const gM = makeCells(cols, rows);
  const out = makeCells(cols, rows);
  const mem = new Uint8Array(cols * rows);
  const cap = makeCap(cols, rows);
  const tp = tideParams(false);
  const rects = [
    { x: 8, y: 26, w: 92, h: 11, kind: 'ink' },
    { x: 8, y: 37, w: 70, h: 4, kind: 'muted' },
    { x: 8, y: 42, w: 50, h: 4, kind: 'ink' },
  ];
  const heat = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const dx = (x - 50) / 14;
    const dy = (y - 10) / 7;
    const w = 1 - (dx * dx + dy * dy);
    heat[y * cols + x] = w > 0 ? w * w : 0;
  }
  const rings = [{ x: 40, y: 12, age: 0.3 }];
  const wo = { v: 0, dt: 1 / 30, ch: 18, energy: 0 };

  const S = { idleCover: [], idleHola: [], idleMist: [], heatCover: [], heatHola: [], igniteCover: [], tideFrame: [] };
  let sink = 0;
  for (let f = 0; f < warm + frames; f++) {
    const t = STILL_T + f * 0.033;
    const u = (f % 42) / 41;
    const fr = makeFrame(1, t, 0, false);
    // reposo: paint + pozos
    let a = now();
    cover.paint(gC, stC, fr);
    buildCap(cap, cols, rows, rects, wo);
    applyCap(gC, cap);
    const b1 = now() - a;
    a = now();
    hola.paint(gH, stH, fr);
    buildCap(cap, cols, rows, rects, wo);
    applyCap(gH, cap);
    const b2 = now() - a;
    a = now();
    mistScene.paint(gM, stM, fr);
    const b3 = now() - a;
    // calor y anillos
    const fh = makeFrame(1, t, 0.4, false);
    fh.heat = heat;
    fh.rings = rings;
    a = now();
    cover.paint(gC, stC, fh);
    const b4 = now() - a;
    a = now();
    hola.paint(gH, stH, fh);
    const b5 = now() - a;
    // ignición
    a = now();
    cover.paint(gC, stC, makeFrame(u, t, 0.5, false));
    const b6 = now() - a;
    // un cuadro de marea cover → hola: saliente (cacheado en producción; aquí se repinta: cota conservadora) + entrante + composición + pozos
    a = now();
    cover.paint(gC, stC, fr);
    hola.paint(gH, stH, makeFrame(0.3 + 0.7 * u, t, 0.5, false));
    compose(out, gC, gH, stC.cls, stH.cls, tideYb(u, rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t, mem, k: 0.33 });
    buildCap(cap, cols, rows, rects, wo);
    applyCap(out, cap);
    const b7 = now() - a;
    if (f >= warm) {
      S.idleCover.push(b1);
      S.idleHola.push(b2);
      S.idleMist.push(b3);
      S.heatCover.push(b4);
      S.heatHola.push(b5);
      S.igniteCover.push(b6);
      S.tideFrame.push(b7);
    }
    sink += out.b[(f * 7) % out.b.length];
  }
  for (const k of Object.keys(S)) res[k] = stats(S[k]);
  res.sink = sink;
  return res;
}
