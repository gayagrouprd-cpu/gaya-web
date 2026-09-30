// «Sin asignaciones por cuadro en la ruta caliente» (§6.3): ninguna función por cuadro construye arreglos tipados, buffers, Map ni
// Set. Se cuentan las construcciones interceptando los constructores globales (los módulos los resuelven en cada llamada).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mist, agua, waterTile, paintFace, paintRing, faceFn, bn, applyRings, ringAmount, makeCells, put, clear, blit, overlay, copyCells, getTone, setTone, fill } from '../../src/ascii/scenes/common.ts';
import { compose, tideYb, Tide } from '../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../src/ascii/wells.ts';
import { createTestScene } from './fixtures/scene.ts';
import { GAYA_L_SET, ON_L_SET, GAYA_L } from './fixtures/words.mjs';
import { STILL_T, makeFrame, gridSpec } from '../../src/ascii/scenes/common.ts';

const NAMES = ['Uint8Array', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'Map', 'Set'];
const counts = Object.fromEntries(NAMES.map((n) => [n, 0]));
const originals = {};
function install() {
  for (const n of NAMES) {
    originals[n] = globalThis[n];
    globalThis[n] = new Proxy(originals[n], { construct(t, args, nt) { counts[n]++; return Reflect.construct(t, args, nt); } });
  }
}
function uninstall() {
  for (const n of NAMES) globalThis[n] = originals[n];
}
const total = () => NAMES.reduce((s, n) => s + counts[n], 0);

test('ninguna función por cuadro asigna arreglos tipados ni buffers (paint, bruma, cara, aro, marea, pozos, anillos, reloj)', () => {
  const COLS = 180;
  const ROWS = 50;
  const spec = gridSpec(COLS, ROWS);
  const tl = waterTile();
  const g = makeCells(COLS, ROWS);
  const a = makeCells(COLS, ROWS);
  const b = makeCells(COLS, ROWS);
  const out = makeCells(COLS, ROWS);
  const cls = new Uint8Array(COLS * ROWS).fill(1);
  const cls2 = new Uint8Array(COLS * ROWS).fill(2);
  const face = faceFn(GAYA_L, 10, 6);
  const cover = createTestScene({});
  const on = createTestScene({ id: 'on', base: 9, glass: false, yTop: 12 });
  const stA = cover.build(spec, 'es', [GAYA_L_SET]);
  const stB = on.build(spec, 'es', [ON_L_SET]);
  const mo = { cx: 80, cy: 14, rx: 88, ry: 20, gain: 1, cap: 6 };
  const fo = { base: 8, tile: tl, t: STILL_T, caustic: 1, level: 0.6, glass: 2 };
  const to = { band: 4, reach: 12, t: STILL_T, mem: new Uint8Array(COLS * ROWS), k: 0.3 };
  const cap = makeCap(COLS, ROWS);
  const rects = [{ x: 8, y: 26, w: 92, h: 11, kind: 'ink' }];
  const wo = { v: 1800, dt: 1 / 30, ch: 18, energy: 0.3 };
  const rings = [{ x: 40, y: 12, age: 0.3 }];
  const tide = new Tide(0);
  const fr = makeFrame(1, STILL_T, 0.3);
  fr.heat = new Float32Array(COLS * ROWS).fill(0.3);
  fr.rings = rings;
  let f = 0;
  const frame = () => {
    f++;
    const t = STILL_T + f * 0.033;
    fo.t = t;
    to.t = t;
    fr.t = t;
    fr.p = 1;
    cover.paint(g, stA, fr);
    fr.p = 0.3 + 0.7 * ((f % 42) / 41);
    on.paint(b, stB, fr);
    mist(g, spec, mo, t, tl);
    paintFace(g, GAYA_L, 10, 6, face, fo);
    paintRing(g, GAYA_L, 10, 6, face);
    compose(out, a, b, cls, cls2, tideYb((f % 42) / 41, ROWS, 4, 12, 1), to);
    buildCap(cap, COLS, ROWS, rects, wo);
    applyCap(out, cap);
    applyRings(g, rings, 2);
    ringAmount(rings[0], 50, 10);
    agua(tl, f % 100, 10, t);
    bn(f % 300, 7);
    put(g, 3, 3, 5, 5);
    setTone(g, 3, 3, getTone(g, 3, 3));
    fill(g, 0, 0, 4, 2, 5, 5);
    clear(a, 0);
    blit(a, b, 0, 0);
    overlay(a, b);
    copyCells(out, a);
    tide.request(f % 4, f * 33, 1400);
    tide.update(f * 33, ROWS, 4, 12);
  };
  for (let i = 0; i < 5; i++) frame(); // calienta cachés por tamaño (umbral τ, frente por columna)
  install();
  try {
    counts.Uint8Array = 0;
    for (const n of NAMES) counts[n] = 0;
    for (let i = 0; i < 60; i++) frame();
    assert.equal(total(), 0, `asignaciones por cuadro: ${JSON.stringify(counts)}`);
  } finally {
    uninstall();
  }
});

test('el detector funciona: una función que sí asigna se cuenta', () => {
  install();
  try {
    for (const n of NAMES) counts[n] = 0;
    new Uint8Array(4);
    assert.equal(counts.Uint8Array, 1);
    faceFn(GAYA_L, 0, 0); // build-time: asigna a propósito
    assert.ok(counts.Uint8Array >= 2);
  } finally {
    uninstall();
  }
});
