// Kit de escena: tesela de agua, agua, GAUSS, ruido azul, edt, faceFn, aro con bisel, cara, sombra, halo, bruma y anillos.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bakeWaterTile, waterTile, agua, GAUSS, GAUSS_SCALE, bn, edt, faceFn, bevel, paintRing, paintFace, waterLevel, shadow, halo, mist, ringAmount,
  applyRings, isSolidGlyph, RING_TONES, C_AIR, C_FACE, C_EDGE, TILE, smooth, easeInOut, easeOutExpo, clamp,
} from '../../src/ascii/kit.ts';
import { Grid, put, fill, getGlyph, getTone, hashCells, countExplicitBg } from '../../src/ascii/grid.ts';
import { glyphIndex, glyphChar, QUAD_GLYPH } from '../../src/ascii/glyphs.ts';
import { h2 } from '../../src/ascii/noise.ts';
import { wordFromLines, GAYA_M, GAYA_L } from './fixtures/words.mjs';

const spec = (cols, rows) => ({ cols, rows, cw: 18, ch: 36, cssCw: 9, cssCh: 18, dpr: 2 });
const solid = (cols, rows, m = 15) => ({ cols, rows, accentRows: 0, cells: new Uint8Array(cols * rows).fill(m) });

// ---------- agua ----------

test('bakeWaterTile: 64×64, determinista, memoizada y de carácter filamentoso', () => {
  const a = bakeWaterTile(9);
  const b = bakeWaterTile(9);
  assert.equal(a.length, TILE * TILE);
  assert.equal(TILE, 64);
  assert.deepEqual([...a], [...b]);
  assert.notDeepEqual([...a], [...bakeWaterTile(10)], 'la semilla cambia el dibujo');
  assert.equal(waterTile(), waterTile(), 'la tesela por defecto se hornea una sola vez');
  assert.deepEqual([...waterTile()], [...a]);
  let sum = 0;
  let zeros = 0;
  let top = 0;
  for (const v of a) {
    sum += v;
    if (v === 0) zeros++;
    if (v > 200) top++;
  }
  const mean = sum / a.length / 255;
  assert.ok(mean > 0.2 && mean < 0.5, `media ${mean}: ni pantalla llena ni vacía`);
  assert.ok(zeros / a.length > 0.02, 'hay valles (valor 0)');
  assert.ok(top / a.length > 0.02 && top / a.length < 0.3, 'crestas finas: pocas celdas cerca del máximo');
});

test('bakeWaterTile: la tesela envuelve a 64 sin costura (la diferencia a través del borde ≈ la interior)', () => {
  const t = waterTile();
  const at = (x, y) => t[(y & 63) * 64 + (x & 63)];
  let inside = 0;
  let seamX = 0;
  let seamY = 0;
  let nI = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 63; x++) {
      inside += Math.abs(at(x + 1, y) - at(x, y));
      nI++;
    }
    seamX += Math.abs(at(0, y) - at(63, y));
  }
  for (let x = 0; x < 64; x++) seamY += Math.abs(at(x, 0) - at(x, 63));
  const mi = inside / nI;
  assert.ok(seamX / 64 < mi * 1.5, `costura en x ${seamX / 64} frente a ${mi}`);
  assert.ok(seamY / 64 < mi * 1.5, `costura en y ${seamY / 64} frente a ${mi}`);
});

test('agua: 0..1, determinista, continua, sin NaN con coordenadas negativas y t grande', () => {
  const tl = waterTile();
  let maxJump = 0;
  for (let i = 0; i < 4000; i++) {
    const c = (i * 7) % 173 - 10;
    const r = (i * 3) % 61 - 5;
    const v = agua(tl, c, r, 21.7);
    assert.ok(v >= 0 && v <= 1 && Number.isFinite(v), `agua ${v}`);
    assert.equal(v, agua(tl, c, r, 21.7));
    maxJump = Math.max(maxJump, Math.abs(v - agua(tl, c + 0.01, r, 21.7)));
  }
  assert.ok(maxJump < 0.03, `agua no es continua: salto ${maxJump} en 0,01 celdas`);
  assert.ok(Number.isFinite(agua(tl, -1e4, -1e4, 1e5)));
  assert.notEqual(agua(tl, 10, 10, 1), agua(tl, 10, 10, 9), 'el tiempo desplaza la lectura');
  assert.notEqual(agua(tl, 10, 10, 1, 2), agua(tl, 10, 10, 1, 1), 'asp escala las filas');
});

test('GAUSS[256]: tabla entera de e^(−8·i/255), monótona y acotada', () => {
  assert.ok(GAUSS instanceof Uint8Array);
  assert.equal(GAUSS.length, 256);
  assert.equal(GAUSS[0], 255);
  assert.equal(GAUSS[255], 0);
  for (let i = 1; i < 256; i++) assert.ok(GAUSS[i] <= GAUSS[i - 1], `no monótona en ${i}`);
  for (let i = 0; i < 256; i++) assert.ok(Math.abs(GAUSS[i] - 255 * Math.exp((-8 * i) / 255)) < 1.6, `i=${i}: ${GAUSS[i]}`);
  assert.equal(GAUSS_SCALE * 8, 255);
  assert.equal(GAUSS[(1.6 * GAUSS_SCALE) | 0], GAUSS[51]);
});

// ---------- ruido azul ----------

test('bn: [0, 1), determinista, uniforme y AZUL (sin racimos de baja frecuencia)', () => {
  const N = 128;
  const field = new Float64Array(N * N);
  let sum = 0;
  const bins = new Array(10).fill(0);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = bn(x, y);
    assert.ok(v >= 0 && v < 1, `bn ${v}`);
    assert.equal(v, bn(x, y));
    field[y * N + x] = v;
    sum += v;
    bins[(v * 10) | 0]++;
  }
  assert.ok(Math.abs(sum / (N * N) - 0.5) < 0.01, `media ${sum / (N * N)}`);
  for (const b of bins) assert.ok(Math.abs(b / ((N * N) / 10) - 1) < 0.1, `histograma ${bins}`);
  // umbral al 50 %: la varianza de los conteos por bloque 4×4 es mucho menor que la del ruido blanco (16·¼·¾ = 3)
  const blockVar = (f) => {
    const counts = [];
    for (let by = 0; by < N; by += 4) for (let bx = 0; bx < N; bx += 4) {
      let c = 0;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (f(bx + x, by + y) < 0.5) c++;
      counts.push(c);
    }
    const m = counts.reduce((a, b) => a + b, 0) / counts.length;
    return counts.reduce((a, b) => a + (b - m) ** 2, 0) / counts.length;
  };
  const vb = blockVar((x, y) => field[y * N + x]);
  const vw = blockVar((x, y) => h2(x, y, 99));
  assert.ok(vb < vw * 0.45, `varianza por bloques: azul ${vb.toFixed(2)} vs blanco ${vw.toFixed(2)}`);
});

// ---------- edt ----------

function bruteEdt(w, cols, rows, ox, oy) {
  const ink = [];
  for (let y = 0; y < w.rows; y++) for (let x = 0; x < w.cols; x++) if (w.cells[y * w.cols + x]) ink.push([x + ox, y + oy]);
  const out = new Float64Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let d = Infinity;
    for (const [ix, iy] of ink) d = Math.min(d, Math.sqrt((x - ix) ** 2 + (2 * (y - iy)) ** 2));
    out[y * cols + x] = d;
  }
  return out;
}

test('edt: distancia euclídea exacta anisótropa 1:2 (contra fuerza bruta), con desplazamiento y lienzo mayor', () => {
  for (const seed of [1, 2, 3]) {
    const w = { cols: 9, rows: 7, accentRows: 0, cells: Uint8Array.from({ length: 63 }, (_, i) => (h2(i, seed, 5) < 0.12 ? 1 + ((i * 5) % 15) : 0)) };
    w.cells[20] = 7; // al menos una
    const [cols, rows, ox, oy] = [24, 19, 6, 4];
    const d = edt(w, cols, rows, ox, oy);
    const b = bruteEdt(w, cols, rows, ox, oy);
    assert.ok(d instanceof Float32Array);
    for (let i = 0; i < d.length; i++) assert.ok(Math.abs(d[i] - b[i]) < 1e-3, `seed ${seed} celda ${i}: ${d[i]} vs ${b[i]}`);
  }
  const w = solid(3, 2);
  const d = edt(w, 3, 2);
  assert.deepEqual([...d], [0, 0, 0, 0, 0, 0], 'las celdas con tinta valen 0');
  const one = { cols: 1, rows: 1, accentRows: 0, cells: Uint8Array.of(15) };
  const d1 = edt(one, 9, 5, 4, 2);
  assert.equal(d1[2 * 9 + 4], 0);
  assert.ok(Math.abs(d1[2 * 9 + 7] - 3) < 1e-6, 'tres columnas = 3');
  assert.ok(Math.abs(d1[4 * 9 + 4] - 4) < 1e-6, 'dos filas = 4 (paso vertical cuenta 2)');
  assert.ok(Math.abs(d1[3 * 9 + 6] - Math.sqrt(4 + 4)) < 1e-6);
});

// ---------- faceFn, bevel, aro y cara ----------

test('faceFn: cara, borde y distancia por vecindad (8 vecinas)', () => {
  const w = solid(10, 8);
  const f = faceFn(w, 3, 2);
  assert.equal(f.x0, 3);
  assert.equal(f.y0, 2);
  assert.ok(f.cls instanceof Uint8Array && f.dist instanceof Int16Array);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
    const i = y * 10 + x;
    const edgeDist = Math.min(x, y, 9 - x, 7 - y) + 1; // a un borde exterior la celda llena vale 1
    assert.equal(f.dist[i], edgeDist, `dist (${x},${y})`);
    assert.equal(f.cls[i], edgeDist === 1 ? C_EDGE : C_FACE, `cls (${x},${y})`);
  }
  // un agujero en la diagonal: vecindad de 8 ⇒ las cuatro esquinas del agujero cuentan
  const h = solid(7, 7);
  h.cells[3 * 7 + 3] = 0;
  const fh = faceFn(h, 0, 0);
  assert.equal(fh.dist[2 * 7 + 2], 1, 'diagonal del agujero');
  assert.equal(fh.dist[3 * 7 + 3], 0);
  assert.equal(fh.cls[3 * 7 + 3], C_AIR);
  assert.equal(fh.cls[3 * 7 + 1], C_FACE, 'a dos celdas del agujero y del borde ya es cara');
  // parciales = borde, distancia 0
  const p = solid(5, 5);
  p.cells[2 * 5 + 2] = 5;
  const fp = faceFn(p, 0, 0);
  assert.equal(fp.cls[2 * 5 + 2], C_EDGE);
  assert.equal(fp.dist[2 * 5 + 2], 0);
});

test('faceFn sobre GAYA (M y L): aire, borde y cara suman la palabra; la cara no toca el aire', () => {
  for (const W of [GAYA_M, GAYA_L]) checkGaya(W);
});

function checkGaya(GAYA_M) {
  const f = faceFn(GAYA_M, 0, 0);
  let air = 0;
  let edge = 0;
  let face = 0;
  for (let i = 0; i < f.cls.length; i++) {
    const m = GAYA_M.cells[i];
    if (f.cls[i] === C_AIR) { air++; assert.equal(m, 0); }
    else if (f.cls[i] === C_EDGE) { edge++; assert.ok(m !== 0); }
    else { face++; assert.equal(m, 15); assert.ok(f.dist[i] >= 2); }
  }
  assert.equal(air + edge + face, GAYA_M.cols * GAYA_M.rows);
  assert.ok(face > 50 && edge > 100, `cara ${face}, borde ${edge}`);
}

test('bevel: luz T13 arriba-izquierda, T9 abajo-derecha, T12 mixto; parciales T12 o T14 con luz', () => {
  const w = solid(6, 6);
  assert.equal(bevel(w, 0, 0), 13, 'esquina superior izquierda: solo luz');
  assert.equal(bevel(w, 5, 5), 9, 'esquina inferior derecha: solo sombra');
  assert.equal(bevel(w, 5, 0), 12, 'esquina superior derecha: luz y sombra');
  assert.equal(bevel(w, 0, 5), 12);
  assert.equal(bevel(w, 2, 0), 13, 'borde superior');
  assert.equal(bevel(w, 0, 3), 13, 'borde izquierdo');
  assert.equal(bevel(w, 5, 3), 9, 'borde derecho');
  assert.equal(bevel(w, 3, 5), 9, 'borde inferior');
  const p = solid(3, 3);
  p.cells[1 * 3 + 1] = 12; // ▄: tiene vacío arriba (dentro de la celda) ⇒ luz
  assert.equal(bevel(p, 1, 1), 14);
  const q = solid(3, 3, 0);
  q.cells[1 * 3 + 1] = 15;
  q.cells[0 * 3 + 1] = 15; // encima hay tinta
  q.cells[1 * 3 + 0] = 15;
  q.cells[2 * 3 + 1] = 15;
  q.cells[1 * 3 + 2] = 15;
  assert.equal(bevel(q, 1, 1), 12, 'rodeada por cuatro: sin luz ni sombra directas ⇒ T12');
});

test('paintRing: parciales con su cuadrante, llenas a 1 del borde con █ y bisel; nada en la cara', () => {
  const w = wordFromLines(['▗▄▄▖', '████', '████', '████', '▝▀▀▘']);
  const f = faceFn(w, 2, 1);
  const g = new Grid(12, 9);
  paintRing(g, w, 2, 1, f);
  assert.equal(getGlyph(g, 2, 1), glyphIndex('▗'));
  assert.equal(getTone(g, 2, 1), 14, 'parcial con vacío arriba = luz T14');
  assert.equal(getGlyph(g, 3, 1), glyphIndex('▄'));
  assert.equal(getGlyph(g, 2, 2), glyphIndex('█'), 'llena a 1 del borde');
  assert.equal(getTone(g, 2, 2), 13);
  assert.equal(getTone(g, 5, 3), 9, 'borde derecho llena = sombra');
  // la cara (centro) no se toca; las celdas sin tinta tampoco
  assert.equal(getGlyph(g, 3, 3), 0, 'la cara no es del aro');
  assert.equal(getGlyph(g, 0, 0), 0);
  for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) {
    const gl = getGlyph(g, x, y);
    if (gl) assert.ok([9, 12, 13, 14].includes(getTone(g, x, y)), `tono de aro ${getTone(g, x, y)}`);
  }
});

test('RingTones: el aro acepta otros tonos (el presupuesto de §5.4 se ajusta por escena)', () => {
  const w = wordFromLines(['▗▄▄▖', '████', '████', '████', '▝▀▀▘']);
  const f = faceFn(w, 0, 0);
  const g = new Grid(6, 6);
  paintRing(g, w, 0, 0, f, { edge: 10, light: 11, lit: 11, dark: 7 });
  assert.equal(getTone(g, 0, 0), 11);
  assert.equal(getTone(g, 0, 1), 11);
  assert.equal(getTone(g, 3, 2), 7);
  assert.equal(bevel(w, 0, 0, { edge: 1, light: 2, lit: 3, dark: 4 }), 2);
  assert.equal(RING_TONES.edge, 12);
  assert.deepEqual({ ...RING_TONES }, { edge: 12, light: 14, lit: 13, dark: 9 });
});

test('waterLevel: fila del menisco, todo vidrio en 0 y todo lleno en 1', () => {
  const w = solid(6, 10);
  assert.equal(waterLevel(w, 5, 0), 15, 'y0 + filas');
  assert.equal(waterLevel(w, 5, 1), 4, 'y0 − 1: sin menisco');
  assert.equal(waterLevel(w, 5, 0.5), 10);
  assert.equal(waterLevel(w, 5, 0.85), 5 + 10 - 9);
});

test('paintFace: tono = base + round(1,5·agua + 1,2·profundidad); vidrio T2 sobre el nivel, menisco T14, agua abajo', () => {
  const w = solid(20, 12);
  const f = faceFn(w, 4, 3);
  const tile = waterTile();
  const g = new Grid(30, 18);
  paintFace(g, w, 4, 3, f, { base: 8, tile, t: 21.7 });
  let min = 99;
  let max = -1;
  for (let y = 0; y < w.rows; y++) for (let x = 0; x < w.cols; x++) {
    const gl = getGlyph(g, 4 + x, 3 + y);
    if (f.cls[y * 20 + x] === C_FACE) {
      assert.equal(gl, glyphIndex('█'));
      const t = getTone(g, 4 + x, 3 + y);
      min = Math.min(min, t);
      max = Math.max(max, t);
      const expect = 8 + Math.round(1.5 * agua(tile, 4 + x, 3 + y, 21.7) + 1.2 * Math.min(1, Math.max(0, (f.dist[y * 20 + x] - 2) * 0.5)));
      assert.equal(t, Math.min(15, expect));
    } else assert.equal(gl, 0, 'el aro y el aire no son de la cara');
  }
  assert.ok(min >= 8 && max <= 11, `rango de la cara T${min}–T${max}`);
  // sin cáusticas la cara solo depende de la profundidad
  const g0 = new Grid(30, 18);
  paintFace(g0, w, 4, 3, f, { base: 8, tile, t: 21.7, caustic: 0 });
  assert.equal(getTone(g0, 4 + 1, 3 + 1), 8, 'dist 2: profundidad 0');
  assert.equal(getTone(g0, 4 + 2, 3 + 2), 9, 'dist 3: profundidad 0,5 ⇒ +round(0,6)');
  // tope
  const gc = new Grid(30, 18);
  paintFace(gc, w, 4, 3, f, { base: 14, tile, t: 21.7, cap: 10 });
  for (let i = 1; i < gc.b.length; i += 4) assert.ok(gc.b[i] <= 10);
  // vidrio con agua al 50 %: nivel en la fila 3 + 12 − 6 = 9
  const gv = new Grid(30, 18);
  paintFace(gv, w, 4, 3, f, { base: 8, tile, t: 21.7, level: 0.5 });
  assert.equal(waterLevel(w, 3, 0.5), 9);
  for (let x = 2; x < 18; x++) {
    assert.equal(getGlyph(gv, 4 + x, 5), glyphIndex('█'));
    assert.equal(getTone(gv, 4 + x, 5), 2, 'vidrio vacío T2 sobre el nivel');
    assert.equal(getTone(gv, 4 + x, 9), 14, 'menisco T14');
    assert.ok([glyphIndex('▄'), glyphIndex('▅')].includes(getGlyph(gv, 4 + x, 9)));
    assert.ok(getTone(gv, 4 + x, 11) >= 8, 'agua luminosa bajo el nivel');
  }
  // nivel 0 todo vidrio; nivel 1 todo agua y sin menisco
  const g1 = new Grid(30, 18);
  paintFace(g1, w, 4, 3, f, { base: 8, tile, t: 21.7, level: 1 });
  for (let y = 2; y < 10; y++) assert.ok(getTone(g1, 10, 3 + y) >= 8);
  const g0l = new Grid(30, 18);
  paintFace(g0l, w, 4, 3, f, { base: 8, tile, t: 21.7, level: 0 });
  for (let y = 2; y < 10; y++) assert.equal(getTone(g0l, 10, 3 + y), 2);
});

// ---------- sombra y halo ----------

test('shadow: ░ T4 en las celdas vacías cuyo (x−2, y−1) tiene tinta; nunca sobre masa ni sobre la palabra', () => {
  const w = wordFromLines(['████', '████', '██▄▄']);
  const g = new Grid(20, 12);
  put(g, 6 + 2, 4 + 3, glyphIndex('█'), 12); // otra palabra justo donde caería la sombra (x=4+... ver abajo)
  shadow(g, w, 4, 4);
  const inkAt = (x, y) => x >= 0 && y >= 0 && x < 4 && y < 3 && w.cells[y * 4 + x] !== 0;
  let n = 0;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) {
    const lx = x - 4;
    const ly = y - 4;
    const cast = inkAt(lx - 2, ly - 1) && !inkAt(lx, ly);
    const gl = getGlyph(g, x, y);
    if (x === 8 && y === 7) assert.equal(gl, glyphIndex('█'), 'no pisa la masa de otra palabra');
    else if (cast) {
      assert.equal(gl, glyphIndex('░'), `(${x},${y}) debería tener sombra`);
      assert.equal(getTone(g, x, y), 4);
      n++;
    } else assert.equal(gl, 0, `(${x},${y}) no debería tener nada`);
  }
  assert.equal(n, 7, '12 celdas desplazadas − 4 que caen sobre la propia palabra − 1 bloqueada por masa ajena');
  assert.equal(countExplicitBg(g), 0);
});

test('halo: bruma ▒░:· en primer plano a ≤ radio de la palabra, T3/T2/T1 por distancia, aditiva y sin bg', () => {
  const w = wordFromLines(['████', '████', '████']);
  const [x0, y0] = [12, 8];
  const g = new Grid(32, 22);
  put(g, x0 + 5, y0 + 1, glyphIndex('▌'), 9); // masa ajena: no se pisa
  put(g, x0 + 4, y0 + 1, glyphIndex('▓'), 13); // atmósfera más brillante que el halo: no se oscurece
  halo(g, w, x0, y0, 4);
  const d = bruteEdt(w, 32, 22, x0, y0);
  const ALLOWED = new Set(['▒', '░', ':', '·'].map(glyphIndex));
  let painted = 0;
  for (let y = 0; y < 22; y++) for (let x = 0; x < 32; x++) {
    const gl = getGlyph(g, x, y);
    const dist = d[y * 32 + x];
    if (x === x0 + 5 && y === y0 + 1) { assert.equal(gl, glyphIndex('▌')); continue; }
    if (x === x0 + 4 && y === y0 + 1) { assert.equal(gl, glyphIndex('▓')); assert.equal(getTone(g, x, y), 13); continue; }
    if (gl === 0) continue;
    painted++;
    assert.ok(ALLOWED.has(gl), `glifo de halo ${glyphChar(gl)}`);
    assert.ok(dist > 0 && dist <= 4 + 1e-6, `halo fuera de radio o sobre la palabra: d=${dist}`);
    assert.equal(getTone(g, x, y), dist <= 1 ? 3 : dist <= 2 ? 2 : 1, `tono a d=${dist}`);
  }
  assert.ok(painted > 40, `halo demasiado vacío: ${painted}`);
  assert.equal(countExplicitBg(g), 0, 'el póster SSR no puede depender de bg');
  // un radio mayor cubre más
  const g2 = new Grid(32, 22);
  halo(g2, w, x0, y0, 6);
  assert.ok([...g2.b].filter((_, i) => i % 4 === 0 && g2.b[i]).length > painted);
});

// ---------- bruma ----------

test('mist: solo primer plano, tono 3..cap, glifos de bruma, 15 % de puntos omitidos y determinista', () => {
  const sp = spec(160, 50);
  const tl = waterTile();
  const o = { cx: 80, cy: 14, rx: 88, ry: 20, gain: 1, cap: 6 };
  const g = new Grid(160, 50);
  mist(g, sp, o, 21.7, tl);
  const ALLOWED = new Set(['·', ':', '░', '▒', '▓'].map(glyphIndex));
  let n = 0;
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    n++;
    assert.ok(ALLOWED.has(g.b[i]), `glifo ${glyphChar(g.b[i])}`);
    assert.ok(g.b[i + 1] >= 3 && g.b[i + 1] <= 6, `tono ${g.b[i + 1]}`);
    assert.equal(g.b[i + 2], 0, 'sin bg');
    assert.equal(g.b[i + 3], 1);
  }
  assert.ok(n > 1500, `bruma demasiado escasa: ${n}`);
  const h = hashCells(g);
  const g2 = new Grid(160, 50);
  mist(g2, sp, o, 21.7, tl);
  assert.equal(hashCells(g2), h);
  const g3 = new Grid(160, 50);
  mist(g3, sp, o, 22.7, tl);
  assert.notEqual(hashCells(g3), h, 'el tiempo mueve la bruma');
  // con mucha ganancia cada celda del elipse se dibuja salvo el 15 % omitido por hash
  const gg = new Grid(160, 50);
  mist(gg, sp, { cx: 80, cy: 25, rx: 400, ry: 400, gain: 50, cap: 6 }, 3, tl);
  let drawn = 0;
  for (let i = 0; i < gg.b.length; i += 4) if (gg.b[i]) drawn++;
  assert.ok(Math.abs(drawn / 8000 - 0.85) < 0.02, `fracción dibujada ${drawn / 8000}`);
});

test('mist: cap, pozos y ganancia 0', () => {
  const sp = spec(160, 50);
  const tl = waterTile();
  const base = { cx: 80, cy: 14, rx: 88, ry: 20, gain: 3, cap: 4 };
  const g = new Grid(160, 50);
  mist(g, sp, base, 5, tl);
  for (let i = 1; i < g.b.length; i += 4) assert.ok(g.b[i] <= 4);
  // pozo: tope 2 en un rectángulo; 0 en otro (nada)
  const wells = new Uint8Array(160 * 50).fill(15);
  for (let y = 10; y < 20; y++) for (let x = 60; x < 100; x++) wells[y * 160 + x] = 2;
  for (let y = 25; y < 30; y++) for (let x = 60; x < 100; x++) wells[y * 160 + x] = 0;
  const gw = new Grid(160, 50);
  mist(gw, sp, { ...base, wells }, 5, tl);
  let inside = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 160; x++) {
    const i = (y * 160 + x) * 4;
    if (y >= 10 && y < 20 && x >= 60 && x < 100 && gw.b[i]) { inside++; assert.ok(gw.b[i + 1] <= 2); }
    if (y >= 25 && y < 30 && x >= 60 && x < 100) assert.equal(gw.b[i], 0, 'tope 0 = nada');
  }
  assert.ok(inside > 50);
  const g0 = new Grid(160, 50);
  mist(g0, sp, { ...base, gain: 0 }, 5, tl);
  assert.equal(g0.toText(), '\n'.repeat(49), 'ganancia 0: la bruma está cerrada');
});

// ---------- anillos y utilidades ----------

test('ringAmount: banda en el radio age·speed con la celda 1:2, se apaga a los life segundos', () => {
  const r = { x: 50, y: 20, age: 10 / 28 }; // R = 10 anchos de celda
  const a = (x, y) => ringAmount(r, x, y);
  const fade = 1 - r.age / 1.2;
  assert.ok(Math.abs(a(60, 20) - fade) < 1e-9, 'sobre el radio en horizontal: máximo = desvanecimiento');
  assert.ok(Math.abs(a(50, 25) - fade) < 1e-9, 'sobre el radio en vertical (5 filas = 10 anchos)');
  assert.ok(a(50, 30) === 0, '10 filas = 20 anchos: fuera');
  assert.ok(a(50, 20) === 0, 'el centro queda vacío');
  assert.ok(Math.abs(a(60, 20) - a(40, 20)) < 1e-12, 'simétrico');
  assert.equal(ringAmount({ x: 0, y: 0, age: 1.2 }, 33, 0), 0, 'muerto a los 1,2 s');
  for (let i = 0; i < 500; i++) {
    const v = ringAmount({ x: 30, y: 10, age: (i % 12) * 0.1 }, (i * 7) % 90, (i * 3) % 40);
    assert.ok(v >= 0 && v <= 1);
  }
});

test('applyRings: solo sube el tono de celdas con glifo, respeta el tope y no toca glifos', () => {
  const g = new Grid(80, 40);
  fill(g, 0, 0, 80, 40, glyphIndex('█'), 8);
  put(g, 55, 20, 0, 0); // celda vacía dentro del anillo: sigue vacía
  g.b[((20 * 80 + 55) << 2) + 1] = 0;
  const glyphs0 = g.b.filter((_, i) => i % 4 === 0).join();
  applyRings(g, [{ x: 40, y: 20, age: 0.3 }], 4, 12);
  assert.equal(g.b.filter((_, i) => i % 4 === 0).join(), glyphs0);
  let raised = 0;
  for (let i = 1; i < g.b.length; i += 4) {
    assert.ok(g.b[i] <= 12);
    if (g.b[i] > 8) raised++;
  }
  assert.ok(raised > 20);
  assert.equal(getTone(g, 55, 20), 0, 'la celda sin glifo no se enciende');
  const h = hashCells(g);
  applyRings(g, [], 4, 12);
  applyRings(g, [{ x: 40, y: 20, age: 5 }], 4, 12);
  assert.equal(hashCells(g), h, 'sin anillos vivos no hace nada');
});

test('utilidades polinómicas: smooth, easeInOut, easeOutExpo, clamp, isSolidGlyph', () => {
  assert.equal(smooth(0, 1, -1), 0);
  assert.equal(smooth(0, 1, 2), 1);
  assert.equal(smooth(0, 1, 0.5), 0.5);
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(0.5), 0.5);
  assert.equal(easeOutExpo(0), 0);
  assert.equal(easeOutExpo(1), 1);
  assert.ok(easeOutExpo(0.2) > 0.6 && easeOutExpo(0.5) > 0.96);
  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const v = easeInOut(i / 100);
    assert.ok(v >= prev);
    prev = v;
  }
  assert.equal(clamp(5, 0, 3), 3);
  for (const q of QUAD_GLYPH.slice(1)) assert.ok(isSolidGlyph(q));
  assert.ok(isSolidGlyph(glyphIndex('█')) && !isSolidGlyph(glyphIndex('░')) && !isSolidGlyph(glyphIndex('·')) && !isSolidGlyph(glyphIndex('~')));
});
