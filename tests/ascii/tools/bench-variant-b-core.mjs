// Micro-benchmark de la VARIANTE B frente a la base sólida (DIRECTION §6.12): coste por cuadro de cover y hola a 6 500 y 9 000 celdas, en reposo
// (paint + pozos), con calor y anillos, en plena ignición y en un cuadro de marea (2 paint + compose + pozos; B usa `composeB`). Modelo: bench-scenes-core.mjs.
// Sin dependencias de Node para poder empaquetarlo con esbuild y ejecutarlo en Chrome con CPU ×4 / ×6 (bench-variant-b.mjs).
import { getWords, loadWords } from '../../../src/ascii/words.ts';
import { STILL_T, bakeWaterTile, gridSpec, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover as coverBase } from '../../../src/ascii/scenes/cover.ts';
import { hola as holaBase } from '../../../src/ascii/scenes/hola.ts';
import { coverB } from '../../../src/ascii/scenes/variants/b/cover.ts';
import { holaB } from '../../../src/ascii/scenes/variants/b/hola.ts';
import { composeB } from '../../../src/ascii/scenes/variants/b/tide.ts';
import { compose, tideParams, tideYb } from '../../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';

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
  const SC = { baseCover: coverBase, baseHola: holaBase, bCover: coverB, bHola: holaB };

  let t0 = now();
  bakeWaterTile(9);
  res.bakeTileMs = now() - t0;
  const st = {};
  for (const [k, sc] of Object.entries(SC)) {
    t0 = now();
    st[k] = sc.build(spec, 'es', words(k.endsWith('Cover') ? 'GAYA' : 'HOLA'));
    res[`build_${k}`] = now() - t0;
  }
  const g = {};
  for (const k of Object.keys(SC)) g[k] = makeCells(cols, rows);
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

  const S = {};
  const push = (k, v) => (S[k] ??= []).push(v);
  let sink = 0;
  for (let f = 0; f < warm + frames; f++) {
    const t = STILL_T + f * 0.033;
    const u = (f % 42) / 41;
    const fr = makeFrame(1, t, 0, false);
    const fh = makeFrame(1, t, 0.4, false);
    fh.heat = heat;
    fh.rings = rings;
    const row = {};
    for (const [who, cv, ho, sc, sh, cmp] of [
      ['base', 'baseCover', 'baseHola', 0, 0, compose],
      ['b', 'bCover', 'bHola', 0, 0, composeB],
    ]) {
      void sc;
      void sh;
      let a = now();
      SC[cv].paint(g[cv], st[cv], fr);
      buildCap(cap, cols, rows, rects, wo);
      applyCap(g[cv], cap);
      row[`idleCover_${who}`] = now() - a;
      a = now();
      SC[ho].paint(g[ho], st[ho], fr);
      buildCap(cap, cols, rows, rects, wo);
      applyCap(g[ho], cap);
      row[`idleHola_${who}`] = now() - a;
      a = now();
      SC[cv].paint(g[cv], st[cv], fh);
      row[`heatCover_${who}`] = now() - a;
      a = now();
      SC[ho].paint(g[ho], st[ho], fh);
      row[`heatHola_${who}`] = now() - a;
      a = now();
      SC[cv].paint(g[cv], st[cv], makeFrame(u, t, 0.5, false));
      row[`igniteCover_${who}`] = now() - a;
      // cuadro de marea: saliente (cacheado en producción; aquí se repinta: cota conservadora) + entrante + composición + pozos
      a = now();
      SC[cv].paint(g[cv], st[cv], fr);
      SC[ho].paint(g[ho], st[ho], makeFrame(0.3 + 0.7 * u, t, 0.5, false));
      cmp(out, g[cv], g[ho], st[cv].cls, st[ho].cls, tideYb(u, rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t, mem, k: 0.33 });
      buildCap(cap, cols, rows, rects, wo);
      applyCap(out, cap);
      row[`tide_${who}`] = now() - a;
      sink += out.b[(f * 7) % out.b.length];
    }
    if (f >= warm) for (const [k, v] of Object.entries(row)) push(k, v);
  }
  for (const k of Object.keys(S)) res[k] = stats(S[k]);
  res.sink = sink;
  return res;
}
