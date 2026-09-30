// Pozos de lectura (§5.8): el tope de tono nunca llega a 0, respeta el fundido de 2 celdas, se infla con la velocidad y baja
// con la energía; y el motor lo aplica después de pintar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCap, buildCap, applyCap, inflateRows, globalCapFor, pxToCellRect, WELL_CAPS, WELL_CAPS_MORE, CAP_FLOOR, FEATHER, MAX_INFLATE_ROWS, ENERGY_CAP_MIN } from '../../src/ascii/wells.ts';
import { Grid, put, fill } from '../../src/ascii/grid.ts';
import { glyphIndex } from '../../src/ascii/glyphs.ts';
import { h2 } from '../../src/ascii/noise.ts';

const COLS = 80;
const ROWS = 40;
const at = (cap, x, y) => cap[y * COLS + x];
const rect = (x, y, w, h, kind = 'ink') => ({ x, y, w, h, kind });

test('constantes de §5.8: ink T6, muted T4, piso T1, fundido de 2 celdas, inflado máx. 8 filas, energía hasta T8', () => {
  assert.deepEqual({ ...WELL_CAPS }, { ink: 6, muted: 4 });
  assert.deepEqual({ ...WELL_CAPS_MORE }, { ink: 4, muted: 2 });
  assert.equal(CAP_FLOOR, 1);
  assert.equal(FEATHER, 2);
  assert.equal(MAX_INFLATE_ROWS, 8);
  assert.equal(ENERGY_CAP_MIN, 8);
});

test('sin rectángulos: todo el tope global; con tamaño equivocado lanza', () => {
  const cap = makeCap(COLS, ROWS);
  assert.equal(buildCap(cap, COLS, ROWS, []), cap, 'devuelve el mismo arreglo (sin asignar)');
  assert.ok(cap.every((v) => v === 15));
  assert.throws(() => buildCap(new Uint8Array(10), COLS, ROWS, []), RangeError);
});

test('dentro del rectángulo el tope es el de su clase; a ≥ 2 celdas de fuera es el global', () => {
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(20, 10, 20, 10, 'ink'), rect(50, 25, 10, 5, 'muted')]);
  for (let y = 10; y < 20; y++) for (let x = 20; x < 40; x++) assert.equal(at(cap, x, y), 6);
  for (let y = 25; y < 30; y++) for (let x = 50; x < 60; x++) assert.equal(at(cap, x, y), 4);
  for (const [x, y] of [[17, 15], [42, 15], [30, 7], [30, 22], [0, 0], [79, 39]]) assert.equal(at(cap, x, y), 15, `(${x},${y}) fuera del fundido`);
});

test('fundido de 2 celdas: el tope sube de forma monótona del valor del pozo al global, nunca por debajo del pozo', () => {
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(20, 10, 20, 10, 'ink')]);
  const left = [19, 18, 17].map((x) => at(cap, x, 15));
  assert.ok(left[0] > 6 && left[0] < 15, `celda a 1 de distancia: ${left[0]}`);
  assert.equal(left[1], 15, 'a 2 celdas: tope global');
  assert.equal(left[2], 15);
  const up = [9, 8, 7].map((y) => at(cap, 30, y));
  assert.ok(up[0] > 6 && up[0] < 15);
  assert.equal(up[1], 15);
  // monotonía radial en los cuatro sentidos y en la esquina
  for (const dir of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    let prev = 6;
    for (let k = 0; k < 5; k++) {
      const x = dir[0] < 0 ? 20 - k : dir[0] > 0 ? 39 + k : 30;
      const y = dir[1] < 0 ? 10 - k : dir[1] > 0 ? 19 + k : 15;
      const v = at(cap, x, y);
      assert.ok(v >= prev, `no monótono en dirección ${dir} paso ${k}: ${prev} → ${v}`);
      prev = v;
    }
  }
  const corner = at(cap, 19, 9);
  assert.ok(corner > 6 && corner <= 15);
});

test('NUNCA a cero: ningún tope baja de T1 con pozos aleatorios, contraste alto, energía plena o tope global 0', () => {
  for (let trial = 0; trial < 60; trial++) {
    const rects = [];
    for (let k = 0; k < 6; k++) rects.push(rect(h2(trial, k, 1) * 100 - 10, h2(trial, k, 2) * 60 - 10, h2(trial, k, 3) * 40 - 2, h2(trial, k, 4) * 20 - 1, h2(trial, k, 5) < 0.5 ? 'ink' : 'muted'));
    const cap = makeCap(COLS, ROWS);
    for (const o of [{}, { more: true }, { energy: 1 }, { globalCap: 0 }, { v: 4000, dt: 1 / 20, ch: 18, energy: 0.9, more: true }, { v: -4000 }]) {
      buildCap(cap, COLS, ROWS, rects, o);
      for (const v of cap) assert.ok(v >= CAP_FLOOR && v <= 15, `tope ${v} fuera de 1..15 con ${JSON.stringify(o)}`);
    }
  }
});

test('solapes: manda el tope más bajo', () => {
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(10, 10, 20, 10, 'ink'), rect(20, 12, 20, 6, 'muted')]);
  assert.equal(at(cap, 15, 15), 6);
  assert.equal(at(cap, 25, 15), 4);
  assert.equal(at(cap, 35, 15), 4);
});

test('rectángulos fraccionarios, medio fuera de la pantalla, vacíos y negativos', () => {
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(10.3, 5.6, 5, 2)]);
  assert.equal(at(cap, 10, 5), 6, 'la celda tocada cuenta');
  assert.equal(at(cap, 15, 7), 6, 'ceil(15,3) − 1 = 15');
  assert.ok(at(cap, 16, 7) > 6, 'la 16 ya es fundido');
  const c2 = makeCap(COLS, ROWS);
  buildCap(c2, COLS, ROWS, [rect(-10, -10, 15, 14), rect(75, 35, 20, 20), rect(30, 30, 0, 5), rect(30, 30, -4, 5), rect(1e4, 1e4, 3, 3)]);
  assert.equal(at(c2, 0, 0), 6);
  assert.equal(at(c2, 79, 39), 6);
  assert.equal(at(c2, 30, 30), 15, 'rectángulos vacíos no cuentan');
});

test('inflado por velocidad: min(8, ceil(|v|·dt / ch)) filas en el sentido del movimiento del texto', () => {
  assert.equal(inflateRows(0, 1 / 30, 18), 0);
  assert.equal(inflateRows(2400, 1 / 30, 18), Math.ceil(80 / 18));
  assert.equal(inflateRows(2400, 1 / 30, 18), 5);
  assert.equal(inflateRows(-2400, 1 / 30, 18), 5);
  assert.equal(inflateRows(1e6, 1, 18), 8, 'tope de 8 filas');
  const r = rect(20, 15, 20, 6);
  // scrollY crece (v > 0): el texto sube; el lienzo va atrasado ⇒ el pozo se alarga HACIA ARRIBA
  const up = makeCap(COLS, ROWS);
  buildCap(up, COLS, ROWS, [r], { v: 2400, dt: 1 / 30, ch: 18 });
  for (let y = 10; y < 15; y++) assert.equal(at(up, 30, y), 6, `fila ${y} dentro del pozo inflado`);
  assert.equal(at(up, 30, 23), 15, 'por abajo no se alarga (más allá del fundido)');
  assert.ok(at(up, 30, 21) > 6, 'la fila 21 ya es fundido, no pozo');
  assert.equal(at(up, 30, 4), 15);
  const down = makeCap(COLS, ROWS);
  buildCap(down, COLS, ROWS, [r], { v: -2400, dt: 1 / 30, ch: 18 });
  for (let y = 21; y < 26; y++) assert.equal(at(down, 30, y), 6);
  assert.equal(at(down, 30, 11), 15);
  const still = makeCap(COLS, ROWS);
  buildCap(still, COLS, ROWS, [r], {});
  assert.ok(at(still, 30, 14) > 6 && at(still, 30, 14) < 15, 'sin velocidad solo hay el fundido normal');
  assert.equal(at(still, 30, 12), 15, 'sin velocidad no se ensancha');
  // un fling enorme no pasa de 8 filas
  const big = makeCap(COLS, ROWS);
  buildCap(big, COLS, ROWS, [r], { v: 1e5, dt: 0.5, ch: 18 });
  assert.equal(at(big, 30, 15 - 8), 6);
  assert.equal(at(big, 30, 15 - 11), 15);
});

test('energía: el tope global baja suavemente de 15 a T8 entre e = 0,5 y 1; los pozos no suben', () => {
  assert.equal(globalCapFor(0), 15);
  assert.equal(globalCapFor(0.5), 15);
  assert.equal(globalCapFor(1), 8);
  assert.equal(globalCapFor(2), 8);
  let prev = 15;
  for (let i = 50; i <= 100; i++) {
    const v = globalCapFor(i / 100);
    assert.ok(v <= prev && prev - v <= 1, `escalón brusco en e=${i / 100}: ${prev} → ${v}`);
    prev = v;
  }
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(20, 10, 20, 10, 'ink')], { energy: 1 });
  assert.equal(at(cap, 0, 0), 8);
  assert.equal(at(cap, 25, 15), 6);
  assert.equal(at(cap, 19, 15) >= 6 && at(cap, 19, 15) <= 8, true, 'el fundido llega al tope global reducido');
});

test('prefers-contrast: more → topes T4 y T2', () => {
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(20, 10, 10, 5, 'ink'), rect(40, 10, 10, 5, 'muted')], { more: true });
  assert.equal(at(cap, 25, 12), 4);
  assert.equal(at(cap, 45, 12), 2);
});

test('applyCap: recorta fg y bg por encima del tope, deja intacto lo demás y no cambia glifos', () => {
  const g = new Grid(COLS, ROWS);
  fill(g, 0, 0, COLS, ROWS, glyphIndex('█'), 14, 9);
  put(g, 25, 12, glyphIndex('▒'), 3, 2);
  const cap = makeCap(COLS, ROWS);
  buildCap(cap, COLS, ROWS, [rect(20, 10, 10, 5, 'ink')]);
  const glyphs = [...g.b].filter((_, i) => i % 4 === 0).join();
  applyCap(g, cap);
  assert.equal([...g.b].filter((_, i) => i % 4 === 0).join(), glyphs);
  assert.equal(g.b[((12 * COLS + 25) << 2) + 1], 3, 'por debajo del tope: intacto');
  assert.equal(g.b[((12 * COLS + 25) << 2) + 2], 2);
  assert.equal(g.b[((12 * COLS + 22) << 2) + 1], 6, 'fg 14 → 6');
  assert.equal(g.b[((12 * COLS + 22) << 2) + 2], 6, 'bg 9 → 6');
  assert.equal(g.b[((0 * COLS + 0) << 2) + 1], 14, 'fuera del pozo no se toca');
  for (let i = 0; i < cap.length; i++) {
    const orig = i === 12 * COLS + 25 ? 3 : 14;
    assert.equal(g.b[(i << 2) + 1], Math.min(orig, cap[i]), `celda ${i}`);
  }
});

test('pxToCellRect: px de documento → celdas de visor', () => {
  assert.deepEqual(pxToCellRect({ x: 90, y: 1800, w: 360, h: 180, kind: 'muted' }, 1600, 9, 18), { x: 10, y: 11.11111111111111, w: 40, h: 10, kind: 'muted' });
});
