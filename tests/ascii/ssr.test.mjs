// Póster SSR (§6.9): 4 capas de tono sin bg, cuantización a 4 tonos y paridad capa + glifo con el fotograma del motor (T6).
import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createTestScene } from './fixtures/scene.ts';
import { GAYA_L_SET, GAYA_M_SET, GAYA_STACK } from './fixtures/words.mjs';
import { renderPosterLayers, renderPosterLayersDuo, posterCollapse, renderStill, stillFrame } from '../../src/ascii/ssr.ts';
import { makeCells, clear, put, fill, toLayers, countExplicitBg, POSTER_TONES, LAYER_OF_TONE, hashCells, gridSpec, makeFrame, specDesktop, STILL_T, GLYPHS } from '../../src/ascii/scenes/common.ts';
import { glyphIndex } from '../../src/ascii/glyphs.ts';

const cover = createTestScene({ id: 'cover' });
const VARIANTS = [
  ['wide 160×50', specDesktop(), GAYA_L_SET],
  ['mid 113×44', gridSpec(113, 44, 9, 18, 2), GAYA_M_SET],
  ['stack 65×70', gridSpec(65, 70, 6, 12, 2), GAYA_STACK],
];

/** Cuantización independiente de la implementación: tono → capa 0..3, o −1 si no se ve. */
const quant = (tone) => (tone === 0 ? -1 : tone <= 5 ? 0 : tone <= 9 ? 1 : tone <= 12 ? 2 : 3);

test('forma: cuatro cadenas dim · mid · hot · spark', () => {
  const L = renderPosterLayers(cover, specDesktop(), 'es', [GAYA_L_SET]);
  assert.deepEqual(Object.keys(L), ['dim', 'mid', 'hot', 'spark']);
  for (const v of Object.values(L)) assert.equal(typeof v, 'string');
  assert.ok(L.dim.length > L.mid.length && L.mid.length > 0 && L.hot.length > 0 && L.spark.length > 0);
});

test('T6 · paridad: cada celda cae en la capa del tono cuantizado del motor y lleva su MISMO glifo (100 %)', () => {
  for (const [name, spec, set] of VARIANTS) {
    const g = renderStill(cover, spec, 'es', [set]);
    const L = renderPosterLayers(cover, spec, 'es', [set]);
    const rows = Object.values(L).map((s) => s.split('\n').map((l) => [...l]));
    let visible = 0;
    let same = 0;
    for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
      const i = (y * spec.cols + x) * 4;
      const gl = g.b[i];
      const layer = gl === 0 ? -1 : quant(g.b[i + 1]);
      const chars = rows.map((r) => r[y]?.[x] ?? ' ');
      const who = chars.map((c, k) => (c !== ' ' ? k : -1)).filter((k) => k >= 0);
      if (layer === -1) {
        assert.deepEqual(who, [], `${name}: celda invisible (${x},${y}) presente en capas ${who}`);
      } else {
        visible++;
        assert.deepEqual(who, [layer], `${name}: (${x},${y}) capa ${who} ≠ ${layer}`);
        if (chars[layer] === GLYPHS[gl]) same++;
      }
    }
    assert.equal(same, visible, `${name}: paridad de glifo ${same}/${visible}`);
    assert.ok(visible > 1500, `${name}: póster casi vacío (${visible})`);
  }
});

test('capas SIN bg: el póster ignora el fondo aunque la escena lo use, y `cover` no lo usa nunca', () => {
  // la escena de prueba no toca bg en ningún fotograma (ni con calor ni con anillos)
  for (const p of [0, 0.1, 0.3, 0.55, 0.8, 1]) {
    const spec = specDesktop();
    const st = cover.build(spec, 'es', [GAYA_L_SET]);
    const g = makeCells(spec.cols, spec.rows);
    const f = makeFrame(p, 4.4, 0.3);
    f.heat = new Float32Array(spec.cols * spec.rows).fill(0.5);
    f.rings = [{ x: 60, y: 10, age: 0.4 }];
    cover.paint(g, st, f);
    assert.equal(countExplicitBg(g), 0, `p=${p}: la portada usó bg`);
  }
  // una escena «mala» que pinta fondo: las capas no cambian por el fondo
  const bad = {
    id: 'cover', dawn: 0, arrival: { ms: 1 },
    build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
    paint(g) { clear(g, 0); fill(g, 0, 0, g.cols, g.rows, glyphIndex('█'), 7, 9); put(g, 2, 1, glyphIndex('▒'), 12, 14); },
  };
  const spec = gridSpec(8, 3, 9, 18, 1);
  const g = renderStill(bad, spec, 'es', []);
  assert.ok(countExplicitBg(g) > 0, 'la escena mala sí usa bg');
  const L = renderPosterLayers(bad, spec, 'es', []);
  assert.equal(L.mid.split('\n')[0], '██████████'.slice(0, 8));
  assert.equal(L.hot, '\n  ▒');
  for (const v of Object.values(L)) assert.ok(!/[^\n █▒]/.test(v));
});

test('cuantización a 4 tonos: umbrales dim 1–5 · mid 6–9 · hot 10–12 · spark 13–15 y tonos representativos para el CSS', () => {
  for (let t = 0; t < 16; t++) assert.equal(LAYER_OF_TONE[t] === 255 ? -1 : LAYER_OF_TONE[t], quant(t), `tono ${t}`);
  assert.deepEqual([...POSTER_TONES], [4, 8, 11, 14]);
  for (let L = 0; L < 4; L++) assert.equal(quant(POSTER_TONES[L]), L);
  // toLayers y renderPosterLayers coinciden
  const g = renderStill(cover, specDesktop(), 'es', [GAYA_L_SET]);
  assert.deepEqual(toLayers(g), renderPosterLayers(cover, specDesktop(), 'es', [GAYA_L_SET]));
});

test('rejilla y alfabeto: ninguna capa pasa del tamaño de la rejilla y solo hay glifos permitidos', () => {
  for (const [name, spec, set] of VARIANTS) {
    const L = renderPosterLayers(cover, spec, 'es', [set]);
    for (const [layer, s] of Object.entries(L)) {
      const lines = s.split('\n');
      assert.ok(lines.length <= spec.rows, `${name}/${layer}: ${lines.length} filas > ${spec.rows}`);
      for (const l of lines) {
        assert.ok([...l].length <= spec.cols, `${name}/${layer}: fila de ${[...l].length} columnas`);
        assert.ok(!/\s$/.test(l), 'sin espacios finales');
        for (const ch of l) assert.ok(ch === ' ' || GLYPHS.includes(ch), `${name}/${layer}: carácter ${JSON.stringify(ch)}`);
      }
    }
  }
});

test('determinismo y `still` ≡ paint(p = 1, t = STILL_T)', () => {
  const spec = specDesktop();
  const a = renderPosterLayers(cover, spec, 'es', [GAYA_L_SET]);
  const b = renderPosterLayers(cover, spec, 'en', [GAYA_L_SET]);
  assert.deepEqual(a, b, 'la escena de prueba no depende del idioma');
  assert.deepEqual(renderPosterLayers(cover, spec, 'es', [GAYA_L_SET]), a);
  const f = stillFrame();
  assert.deepEqual({ ...f, rings: f.rings.length }, { p: 1, t: STILL_T, e: 0, heat: null, rings: 0, cap: null, still: true });
  const st = cover.build(spec, 'es', [GAYA_L_SET]);
  const g = makeCells(spec.cols, spec.rows);
  cover.paint(g, st, makeFrame(1, STILL_T, 0, true));
  assert.equal(hashCells(g), hashCells(renderStill(cover, spec, 'es', [GAYA_L_SET])));
  // el fotograma fijo no comparte estado entre llamadas
  stillFrame().rings.length;
  assert.notEqual(stillFrame(), stillFrame());
});

test('peso: el póster de la escena de prueba cabe en el orden de magnitud del de §2.2 (≈ 2 KB gz a 160×50)', () => {
  const sizes = {};
  for (const [name, spec, set] of VARIANTS) {
    const L = renderPosterLayers(cover, spec, 'es', [set]);
    sizes[name] = gzipSync(Buffer.from(Object.values(L).join('\n')), { level: 9 }).length;
  }
  assert.ok(sizes['wide 160×50'] < 4200, `wide ${sizes['wide 160×50']} B gz`);
  assert.ok(sizes['stack 65×70'] < 3000, `stack ${sizes['stack 65×70']} B gz`);
});

test('escenas con bg (estilo Duotono): posterCollapse pasa la masa de fondo a bloques, conserva el carácter denso y el de fondo oscuro, y deja las mismas 4 capas', () => {
  const g = gridSpec(6, 1, 9, 18, 1);
  const scene = {
    id: 'cover', dawn: 0, arrival: { ms: 1 },
    build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
    paint(gr) {
      clear(gr, 0);
      put(gr, 0, 0, glyphIndex(':'), 8, 6); // poco carácter sobre fondo claro → bloque T6
      put(gr, 1, 0, 0, 7, 7); // solo fondo claro → bloque T7
      put(gr, 2, 0, glyphIndex('#'), 10, 6); // carácter denso → se conserva (T10)
      put(gr, 3, 0, glyphIndex('.'), 4, 2); // fondo oscuro (bruma) → se conserva el glifo, sin fondo
      put(gr, 4, 0, glyphIndex('▀'), 11); // cuadrante: igual
      put(gr, 5, 0, 0, 1, 1); // sombra T1: no se ve
    },
  };
  const L = renderPosterLayersDuo(scene, g, 'es', []);
  assert.deepEqual(Object.keys(L), ['dim', 'mid', 'hot', 'spark']);
  assert.equal(L.mid.slice(0, 2), '██', 'los dos bloques de masa T6 y T7 están en la capa mid');
  assert.equal(L.hot[2], '#');
  assert.equal(L.dim[3], '.');
  assert.equal(L.hot[4], '▀');
  assert.equal(renderPosterLayersDuo.length, 4);
  const st = renderStill(scene, g, 'es', []);
  const c = makeCells(6, 1);
  c.b.set(st.b);
  posterCollapse(c);
  assert.equal(countExplicitBg(c), 0, 'el colapso no deja bg');
  assert.deepEqual(toLayers(c), L);
  assert.notDeepEqual(renderPosterLayers(scene, g, 'es', []), L, 'sin colapso las paredes desaparecen');
});
