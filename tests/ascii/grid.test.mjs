// Rejilla de celdas: memoria de 4 bytes, primitivas, ida y vuelta de blit/overlay, salidas de texto y las 4 capas del póster.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Grid, makeCells, put, putc, fill, fillBg, text, blit, overlay, copyCells, clear, toText, toTones, toLayers, hashCells, getGlyph, getTone, getBg,
  setTone, box, strokeCells, poly, rectFill, gi, toneLayer, LAYER_OF_TONE, POSTER_TONES, countExplicitBg, F_TOUCHED, F_BG,
} from '../../src/ascii/grid.ts';
import { GLYPHS, glyphIndex } from '../../src/ascii/glyphs.ts';

test('4 bytes por celda [glifo, fg, bg, banderas] y vista Uint32 sobre la misma memoria', () => {
  const g = new Grid(4, 3);
  g.put(2, 1, '█', 9, 4);
  const i = (1 * 4 + 2) * 4;
  assert.deepEqual([...g.b.slice(i, i + 4)], [glyphIndex('█'), 9, 4, F_TOUCHED | F_BG]);
  // little-endian: glifo en el byte bajo, banderas en el alto
  assert.equal(g.u[1 * 4 + 2] & 0xff, glyphIndex('█'));
  assert.equal((g.u[1 * 4 + 2] >>> 8) & 0xff, 9);
  assert.equal((g.u[1 * 4 + 2] >>> 16) & 0xff, 4);
  assert.equal(g.u[1 * 4 + 2] >>> 24, F_TOUCHED | F_BG);
});

test('put: bg = -1 no toca el fondo; fuera de la rejilla no escribe; clear reinicia banderas', () => {
  const g = new Grid(5, 2);
  g.put(1, 0, 'a', 7, 3);
  g.put(1, 0, 'b', 8); // sin bg: el fondo 3 se conserva
  assert.equal(getBg(g, 1, 0), 3);
  assert.equal(getTone(g, 1, 0), 8);
  assert.equal(getGlyph(g, 1, 0), gi('b'));
  const before = hashCells(g);
  g.put(-1, 0, 'x', 9);
  g.put(5, 0, 'x', 9);
  g.put(0, 2, 'x', 9);
  g.put(0, -3, 'x', 9);
  assert.equal(hashCells(g), before);
  g.clear(2);
  assert.equal(getGlyph(g, 1, 0), 0);
  assert.equal(g.b[3], 0, 'banderas a cero');
  assert.equal(getBg(g, 4, 1), 2);
  assert.equal(countExplicitBg(g), 0, 'clear(bg) no marca fondo explícito');
});

test('glifos: los prohibidos y desconocidos salen como «?» y todo GLYPHS round-trip por carácter', () => {
  const g = new Grid(3, 1);
  putc(g, 0, 0, '→', 9);
  assert.equal(getGlyph(g, 0, 0), gi('?'));
  for (let k = 0; k < GLYPHS.length; k++) assert.equal(gi(GLYPHS[k]), k, `glifo ${k} ${GLYPHS[k]}`);
});

test('fill y text: recortan, y los espacios del texto son transparentes', () => {
  const g = new Grid(6, 3);
  fill(g, -2, -1, 4, 2, glyphIndex('█'), 5); // recorta a (0..1, 0)
  assert.equal(g.toText(), '██\n\n', 'toText conserva las filas (vacías) y recorta solo espacios finales por fila');
  const h = new Grid(8, 1);
  text(h, 1, 0, 'a b', 9);
  assert.equal(h.toText(), ' a b');
  assert.equal(getGlyph(h, 2, 0), 0, 'el espacio no escribe');
  fillBg(h, 0, 0, 3, 1, 6);
  assert.equal(getBg(h, 2, 0), 6);
  assert.equal(h.b[(2 << 2) + 3] & F_BG, F_BG);
});

function patterned(cols, rows) {
  const g = new Grid(cols, rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) put(g, x, y, 1 + ((x * 7 + y * 13) % 90), 1 + ((x + y) % 15), (x * y) % 16);
  return g;
}
const window_ = (g, x0, y0, w, h) => {
  const out = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push(g.u[(y0 + y) * g.cols + x0 + x]);
  return out;
};

test('blit: ida y vuelta (copiar una ventana y leerla de nuevo da la misma)', () => {
  const src = patterned(9, 6);
  const dst = new Grid(20, 12);
  blit(dst, src, 5, 3);
  assert.deepEqual(window_(dst, 5, 3, 9, 6), window_(src, 0, 0, 9, 6));
  // resto intacto
  assert.equal(dst.u[0], 0);
  assert.equal(dst.u[(2 * 20) + 5], 0);
  // vuelta: copiar la ventana de dst a otra rejilla del tamaño de src reproduce src
  const back = new Grid(9, 6);
  for (let y = 0; y < 6; y++) back.u.set(dst.u.subarray((3 + y) * 20 + 5, (3 + y) * 20 + 14), y * 9);
  assert.equal(hashCells(back), hashCells(src));
});

test('blit: recorta por los cuatro lados con desplazamientos negativos y mayores que la rejilla', () => {
  const src = patterned(6, 4);
  const dst = new Grid(10, 8);
  blit(dst, src, -2, -1);
  assert.deepEqual(window_(dst, 0, 0, 4, 3), [0, 1, 2].flatMap((y) => [2, 3, 4, 5].map((x) => src.u[(y + 1) * 6 + x])));
  const d2 = new Grid(10, 8);
  blit(d2, src, 8, 6);
  assert.deepEqual(window_(d2, 8, 6, 2, 2), [0, 1].flatMap((y) => [0, 1].map((x) => src.u[y * 6 + x])));
  const d3 = new Grid(10, 8);
  const h0 = hashCells(d3);
  blit(d3, src, 10, 0);
  blit(d3, src, 0, 8);
  blit(d3, src, -6, 0);
  assert.equal(hashCells(d3), h0, 'totalmente fuera: no cambia nada');
});

test('overlay: solo copia las celdas tocadas y hereda el fondo de abajo', () => {
  const base = new Grid(6, 3);
  base.clear(0);
  fill(base, 0, 0, 6, 3, glyphIndex('·'), 3, 2); // base con fondo explícito T2
  const layer = new Grid(6, 3);
  put(layer, 1, 1, glyphIndex('█'), 12); // sin fondo: hereda el 2
  put(layer, 4, 2, glyphIndex('▒'), 8, 5); // con fondo explícito
  overlay(base, layer);
  assert.equal(getGlyph(base, 1, 1), glyphIndex('█'));
  assert.equal(getTone(base, 1, 1), 12);
  assert.equal(getBg(base, 1, 1), 2, 'hereda el fondo de la base');
  assert.equal(getBg(base, 4, 2), 5, 'la capa fijó su fondo');
  assert.equal(getGlyph(base, 0, 0), glyphIndex('·'), 'celda no tocada por la capa: intacta');
});

test('overlay: ida y vuelta — sobre una base vacía reproduce la capa; es idempotente; con desplazamiento recorta', () => {
  const layer = patterned(8, 5);
  const blank = new Grid(8, 5);
  overlay(blank, layer);
  assert.equal(hashCells(blank), hashCells(layer));
  const h = hashCells(blank);
  overlay(blank, layer);
  assert.equal(hashCells(blank), h, 'idempotente');
  const big = new Grid(12, 9);
  overlay(big, layer, 3, 2);
  assert.deepEqual(window_(big, 3, 2, 8, 5), window_(layer, 0, 0, 8, 5));
  const clipped = new Grid(12, 9);
  overlay(clipped, layer, -3, -2);
  assert.deepEqual(window_(clipped, 0, 0, 5, 3), [0, 1, 2].flatMap((y) => [3, 4, 5, 6, 7].map((x) => layer.u[(y + 2) * 8 + x])));
});

test('copyFrom: copia exacta y rechaza tamaños distintos', () => {
  const a = patterned(7, 4);
  const b = new Grid(7, 4);
  b.copyFrom(a);
  assert.equal(hashCells(b), hashCells(a));
  assert.throws(() => copyCells(new Grid(3, 3), a), RangeError);
});

test('toText, toTones y hash', () => {
  const g = new Grid(6, 2);
  g.text(1, 0, 'Hi', 9).put(0, 1, '█', 15);
  assert.equal(g.toText(), ' Hi\n█');
  assert.equal(g.toTones(), '099000\nf00000');
  const h1 = g.hash();
  assert.match(h1, /^[0-9a-f]{16}$/);
  g.tone(1, 0, 10);
  assert.notEqual(g.hash(), h1, 'el tono cuenta');
  const g2 = new Grid(6, 2);
  g2.text(1, 0, 'Hi', 9).put(0, 1, '█', 15);
  g2.b[3] = 0; // las banderas no cuentan
  g2.tone(1, 0, 10);
  assert.equal(g2.hash(), g.hash());
});

test('toLayers: 4 capas, cada celda visible en exactamente una, sin bg, mismo glifo', () => {
  const g = new Grid(16, 2);
  for (let t = 0; t < 16; t++) put(g, t, 0, glyphIndex('█'), t, 7); // fondo explícito: no debe aparecer
  put(g, 0, 1, glyphIndex('░'), 0); // T0 sobre T0: invisible
  put(g, 3, 1, 0, 9); // glifo espacio: nada
  put(g, 5, 1, glyphIndex('~'), 14);
  const L = toLayers(g);
  assert.deepEqual(Object.keys(L), ['dim', 'mid', 'hot', 'spark']);
  const rows = Object.values(L).map((s) => s.split('\n'));
  // cuantización por tono
  const expect = (t) => (t === 0 ? -1 : t <= 5 ? 0 : t <= 9 ? 1 : t <= 12 ? 2 : 3);
  for (let t = 0; t < 16; t++) {
    const seen = rows.map((r) => r[0][t] ?? ' ');
    const who = seen.map((c, k) => (c !== ' ' ? k : -1)).filter((k) => k >= 0);
    if (t === 0) assert.deepEqual(who, [], 'T0 es invisible');
    else assert.deepEqual(who, [expect(t)], `tono ${t}`);
    if (t > 0) assert.equal(seen[expect(t)], '█');
  }
  assert.equal(rows[3][1][5], '~');
  assert.ok(!Object.values(L).join('').includes('\u0007'));
  assert.equal(countExplicitBg(g), 16);
  // ningún carácter fuera de glifos permitidos, espacios y saltos de línea
  for (const s of Object.values(L)) for (const ch of s) assert.ok(ch === '\n' || ch === ' ' || GLYPHS.includes(ch), JSON.stringify(ch));
});

test('toLayers: sin espacios finales ni filas vacías al final; una rejilla vacía da cadenas vacías', () => {
  const g = new Grid(10, 6);
  put(g, 2, 1, glyphIndex('█'), 8);
  const L = toLayers(g);
  assert.equal(L.mid, '\n  █');
  assert.equal(L.dim + L.hot + L.spark, '');
  const e = toLayers(new Grid(4, 4));
  assert.deepEqual(e, { dim: '', mid: '', hot: '', spark: '' });
});

test('tabla de capas y tonos representativos', () => {
  assert.equal(LAYER_OF_TONE.length, 16);
  assert.equal(toneLayer(0), 255);
  assert.deepEqual([...LAYER_OF_TONE].slice(1, 6), [0, 0, 0, 0, 0]);
  assert.deepEqual(POSTER_TONES, [4, 8, 11, 14]);
  for (let L = 0; L < 4; L++) assert.equal(toneLayer(POSTER_TONES[L]), L, 'el tono representativo cae en su capa');
});

test('box, strokeCells y poly', () => {
  const g = new Grid(6, 4);
  box(g, 0, 0, 6, 4, 'single', 9);
  assert.equal(g.toText(), '┌────┐\n│    │\n│    │\n└────┘');
  assert.deepEqual(strokeCells([[0.2, 0.5], [5.8, 0.5]]).map((c) => c[2]), ['-', '-', '-', '-', '-', '-']);
  const diag = strokeCells([[0, 0], [4, 4]]);
  assert.ok(diag.every((c) => c[2] === '\\' || c[2] === '|' || c[2] === '/' || c[2] === '-'));
  const r = new Grid(6, 4);
  rectFill(r, 1, 1, 3, 2, 8);
  assert.equal(r.toText(), '\n ███\n ███\n');
  const r2 = new Grid(6, 4);
  rectFill(r2, 1, 0.5, 2, 1.5, 8); // mitad de celda arriba
  assert.equal(r2.toText(), ' ▄▄\n ██\n\n');
  const tri = new Grid(8, 6);
  poly(tri, [[1, 1], [7, 1], [1, 5]], 9);
  assert.match(tri.toText(), /█/);
  assert.ok(countExplicitBg(tri) === 0, 'poly nunca toca el fondo');
  setTone(tri, 1, 1, 14);
  assert.equal(getTone(tri, 1, 1), 14);
});
