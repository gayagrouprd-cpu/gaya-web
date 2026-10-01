// Micro-benchmark de la Variante A frente a la base (mismos fotogramas que bench-scenes-core.mjs): coste por cuadro de cover y hola a 6 500 y 9 000 celdas
// en reposo (paint + pozos), con calor y anillos, en plena ignición y un cuadro de marea (2 paint + composeA + pozos). Se empaqueta con esbuild y corre
// en Chrome con CPU ×1/×4/×6 (bench-variant-a.mjs). Sin dependencias de Node.
import { getWords, loadWords } from '../../../src/ascii/words.ts';
import { STILL_T, bakeWaterTile, gridSpec, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover } from '../../../src/ascii/scenes/cover.ts';
import { hola } from '../../../src/ascii/scenes/hola.ts';
import { coverA } from '../../../src/ascii/scenes/variants/a/cover.ts';
import { holaA } from '../../../src/ascii/scenes/variants/a/hola.ts';
import { composeA } from '../../../src/ascii/scenes/variants/a/tide-a.ts';
import { compose, tideParams, tideYb } from '../../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';
import { posterCollapse } from '../../../src/ascii/scenes/variants/a/poster-a.ts';
import { renderPosterLayers, renderStill } from '../../../src/ascii/ssr.ts';
import { toLayers } from '../../../src/ascii/grid.ts';

const now = () => performance.now();
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
const stats = (xs) => {
  const s = Float64Array.from(xs).sort();
  return { p50: pct(s, 0.5), p95: pct(s, 0.95), max: s[s.length - 1] };
};
export const SIZES = { 6500: [130, 50], 9000: [180, 50] };

export async function runBench(cells, { frames = 300, warm = 100 } = {}) {
  await loadWords('es');
  const [cols, rows] = SIZES[cells];
  const spec = gridSpec(cols, rows, 9, 18, 2);
  const res = { cells, cols, rows };
  const words = (id) => [getWords(id, 'es', cols)];
  bakeWaterTile(9);
  let t0 = now();
  const stCB = cover.build(spec, 'es', words('GAYA'));
  res.buildBase = now() - t0;
  t0 = now();
  const stCA = coverA.build(spec, 'es', words('GAYA'));
  res.buildCoverA = now() - t0;
  t0 = now();
  const stHB = hola.build(spec, 'es', words('HOLA'));
  const stHA = holaA.build(spec, 'es', words('HOLA'));
  res.buildHolaAB = now() - t0;
  t0 = now();
  renderPosterLayers(cover, spec, 'es', words('GAYA'));
  res.posterBase = now() - t0;
  t0 = now();
  const gp = renderStill(coverA, spec, 'es', words('GAYA'));
  posterCollapse(gp);
  toLayers(gp);
  res.posterA = now() - t0;

  const g = { cB: makeCells(cols, rows), cA: makeCells(cols, rows), hB: makeCells(cols, rows), hA: makeCells(cols, rows) };
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

  const S = { idleCoverBase: [], idleCoverA: [], idleHolaBase: [], idleHolaA: [], heatCoverBase: [], heatCoverA: [], heatHolaA: [], igniteBase: [], igniteA: [], tideBase: [], tideA: [] };
  let sink = 0;
  for (let f = 0; f < warm + frames; f++) {
    const t = STILL_T + f * 0.033;
    const u = (f % 42) / 41;
    const fr = makeFrame(1, t, 0, false);
    const fh = makeFrame(1, t, 0.4, false);
    fh.heat = heat;
    fh.rings = rings;
    const idle = (sc, st, gg) => {
      const a = now();
      sc.paint(gg, st, fr);
      buildCap(cap, cols, rows, rects, wo);
      applyCap(gg, cap);
      return now() - a;
    };
    const b1 = idle(cover, stCB, g.cB);
    const b2 = idle(coverA, stCA, g.cA);
    const b3 = idle(hola, stHB, g.hB);
    const b4 = idle(holaA, stHA, g.hA);
    let a = now();
    cover.paint(g.cB, stCB, fh);
    const b5 = now() - a;
    a = now();
    coverA.paint(g.cA, stCA, fh);
    const b6 = now() - a;
    a = now();
    holaA.paint(g.hA, stHA, fh);
    const b7 = now() - a;
    a = now();
    cover.paint(g.cB, stCB, makeFrame(u, t, 0.5, false));
    const b8 = now() - a;
    a = now();
    coverA.paint(g.cA, stCA, makeFrame(u, t, 0.5, false));
    const b9 = now() - a;
    // cuadro de marea cover → hola (el saliente se repinta aquí; en producción va cacheado)
    a = now();
    cover.paint(g.cB, stCB, fr);
    hola.paint(g.hB, stHB, makeFrame(0.3 + 0.7 * u, t, 0.5, false));
    compose(out, g.cB, g.hB, stCB.cls, stHB.cls, tideYb(u, rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t, mem, k: 0.33 });
    buildCap(cap, cols, rows, rects, wo);
    applyCap(out, cap);
    const b10 = now() - a;
    a = now();
    coverA.paint(g.cA, stCA, fr);
    holaA.paint(g.hA, stHA, makeFrame(0.3 + 0.7 * u, t, 0.5, false));
    composeA(out, g.cA, g.hA, stCA.cls, stHA.cls, tideYb(u, rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t, mem, k: 0.33 });
    buildCap(cap, cols, rows, rects, wo);
    applyCap(out, cap);
    const b11 = now() - a;
    if (f >= warm) {
      S.idleCoverBase.push(b1);
      S.idleCoverA.push(b2);
      S.idleHolaBase.push(b3);
      S.idleHolaA.push(b4);
      S.heatCoverBase.push(b5);
      S.heatCoverA.push(b6);
      S.heatHolaA.push(b7);
      S.igniteBase.push(b8);
      S.igniteA.push(b9);
      S.tideBase.push(b10);
      S.tideA.push(b11);
    }
    sink += out.b[(f * 7) % out.b.length];
  }
  for (const k of Object.keys(S)) res[k] = stats(S[k]);
  res.sink = sink;
  return res;
}
