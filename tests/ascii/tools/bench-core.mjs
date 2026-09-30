// Micro-benchmark del núcleo (DIRECTION §6.12): coste por cuadro de paint + composición de marea + pozos a N celdas.
// Sin dependencias de Node para poder empaquetarlo con esbuild y ejecutarlo en Chrome con CPU ×4 / ×6 (bench-chrome.mjs).
import { createTestScene } from '../fixtures/scene.ts';
import { GAYA_L_SET, ON_L_SET } from '../fixtures/words.mjs';
import { STILL_T, bakeWaterTile, gridSpec, makeCells, makeFrame, applyRings } from '../../../src/ascii/scenes/common.ts';
import { compose, tideParams, tideYb } from '../../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';
import { renderPosterLayers } from '../../../src/ascii/ssr.ts';

const now = () => performance.now();
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
const stats = (xs) => {
  const s = Float64Array.from(xs).sort();
  return { p50: pct(s, 0.5), p95: pct(s, 0.95), max: s[s.length - 1], mean: s.reduce((a, b) => a + b, 0) / s.length };
};

/** Rejillas de referencia con exactamente `cells` celdas (130×50 = 6 500 · 180×50 = 9 000). */
export const SIZES = { 6500: [130, 50], 9000: [180, 50] };

export function runBench(cells, { frames = 400, warm = 120 } = {}) {
  const [cols, rows] = SIZES[cells];
  const spec = gridSpec(cols, rows, 9, 18, 2);
  const cover = createTestScene({ id: 'cover', base: 8, glass: true });
  const on = createTestScene({ id: 'on', base: 9, glass: false, yTop: 12, ms: 1900 });
  const res = { cells, cols, rows };

  // horneado (una vez por tamaño): tesela + build de dos escenas + póster SSR
  let t0 = now();
  bakeWaterTile(9);
  res.bakeTileMs = now() - t0;
  t0 = now();
  const stA = cover.build(spec, 'es', [GAYA_L_SET]);
  const stB = on.build(spec, 'es', [ON_L_SET]);
  res.buildMs = now() - t0;
  t0 = now();
  renderPosterLayers(cover, spec, 'es', [GAYA_L_SET]);
  res.posterMs = now() - t0;

  const gA = makeCells(cols, rows);
  const gB = makeCells(cols, rows);
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
  const fr = makeFrame(1, STILL_T, 0, false);
  const rings = [{ x: 40, y: 12, age: 0.3 }];

  const sPaint = [];
  const sPaintArr = [];
  const sCompose = [];
  const sWells = [];
  const sTotal = [];
  const sStillOnly = [];
  let sink = 0;
  for (let f = 0; f < warm + frames; f++) {
    const t = STILL_T + f * 0.033;
    const u = (f % 42) / 41; // la marea recorre la pantalla cada 42 cuadros (1,4 s a 30 fps)
    fr.p = 1;
    fr.t = t;
    fr.e = 0.3;
    fr.heat = f % 3 === 0 ? heat : null;
    fr.rings = f % 5 === 0 ? rings : [];
    const a0 = now();
    cover.paint(gA, stA, fr);
    const a1 = now();
    // llegada del entrante con p variable
    fr.p = 0.3 + 0.7 * u;
    on.paint(gB, stB, fr);
    const a2 = now();
    compose(out, gA, gB, stA.cls, stB.cls, tideYb(u, rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t, mem, k: 0.33 });
    const a3 = now();
    buildCap(cap, cols, rows, rects, { v: 1800, dt: 1 / 30, ch: 18, energy: 0.3 });
    applyCap(out, cap);
    const a4 = now();
    if (f >= warm) {
      sStillOnly.push(a1 - a0);
      sPaintArr.push(a2 - a1);
      sPaint.push(a1 - a0 + (a2 - a1));
      sCompose.push(a3 - a2);
      sWells.push(a4 - a3);
      sTotal.push(a4 - a0);
    }
    sink += out.b[(f * 7) % out.b.length];
  }
  res.paintCover = stats(sStillOnly);
  res.paintArrival = stats(sPaintArr);
  res.paintBoth = stats(sPaint);
  res.compose = stats(sCompose);
  res.wells = stats(sWells);
  res.total = stats(sTotal);
  res.sink = sink;
  // un cuadro en reposo de una sola escena (lo más frecuente: sin marea): paint + pozos
  const sIdle = [];
  for (let f = 0; f < frames; f++) {
    fr.p = 1;
    fr.t = STILL_T + f * 0.033;
    fr.e = 0;
    fr.heat = null;
    fr.rings = [];
    const a0 = now();
    cover.paint(gA, stA, fr);
    buildCap(cap, cols, rows, rects, { v: 0, dt: 1 / 30, ch: 18, energy: 0 });
    applyCap(gA, cap);
    sIdle.push(now() - a0);
  }
  res.idle = stats(sIdle);
  void applyRings;
  return res;
}
