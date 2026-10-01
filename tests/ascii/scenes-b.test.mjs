// Variante B · «El agua hecha del nombre»: pruebas de la rampa medida, las reglas de escena de §6.3, el presupuesto de tono de §5.4, la identidad de la
// variante (letras en las caras, puntuación en la bruma), el tope bajo los pozos de texto (§5.8), la marea con letras, la pureza del código y el coste.
//   node --test tests/ascii/scenes-b.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './fixtures/scene-env.mjs';
import { checkSceneRules, toneBudget } from './fixtures/scene-rules.mjs';
import {
  ALLOWED_ART_CHARS, GLYPHS, STILL_T, countExplicitBg, glyphIndex, hashCells, makeCells, makeFrame,
} from '../../src/ascii/scenes/common.ts';
import { renderPosterLayers, renderStill } from '../../src/ascii/ssr.ts';
import { applyCap, buildCap, makeCap } from '../../src/ascii/wells.ts';
import { tideParams } from '../../src/ascii/tide.ts';
import { INK, K, NAME_RAMP, RAMP_GL, coverB, createCoverB, holaB, composeB } from '../../src/ascii/scenes/variants/b/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../src/ascii/scenes/variants/b');
const INK_JSON = resolve(HERE, '../../reports/ascii/art-b/ink.json');

await ensureWords('es');
await ensureWords('en');

const SCENES = { cover: coverB, hola: holaB };
const ALL_VPS = ['d1440', 'd1600', 'd1920', 't1024', 'm360', 'm390', 'm320'];
const LANGS = ['es', 'en'];

function paint(scene, vp, lang, frame) {
  const spec = specOf(VIEWPORTS[vp]);
  const st = scene.build(spec, lang, wordsFor(scene.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, frame);
  return { g, st, spec };
}
const still = (scene, vp, lang) => paint(scene, vp, lang, makeFrame(1, STILL_T, 0, true));

// ---------- la rampa del nombre, medida ----------

test('rampa del nombre: ` ·:=*yaAG▒▓█`, tinta estrictamente creciente, y y < a < A < G; los bloques son 50 · 75 · 100 %', () => {
  assert.equal(NAME_RAMP, ' ·:=*yaAG▒▓█');
  assert.equal(K, 12);
  assert.equal(INK.length, K);
  for (let i = 1; i < K; i++) assert.ok(INK[i] > INK[i - 1], `paso ${i} (${NAME_RAMP[i]}) no sube la tinta`);
  assert.deepEqual(INK.slice(9), [0.5, 0.75, 1]);
  for (let i = 1; i < K; i++) assert.equal(RAMP_GL[i], glyphIndex(NAME_RAMP[i]), `glifo del paso ${i}`);
  assert.equal(RAMP_GL[0], 0);
  const idx = (c) => NAME_RAMP.indexOf(c);
  assert.ok(idx('y') < idx('a') && idx('a') < idx('A') && idx('A') < idx('G'));
});

test('tinta: la tabla de ramp.ts coincide con la medida de Geist Mono 500 (ink.json, node tests/ascii/tools/ink-b.mjs) y el orden de las letras no cambia en los cinco tamaños de celda', { skip: !existsSync(INK_JSON) }, () => {
  const ink = JSON.parse(readFileSync(INK_JSON, 'utf8'));
  const main = ink['d 9x18@2'];
  for (let i = 1; i <= 8; i++) {
    const c = NAME_RAMP[i];
    assert.ok(Math.abs(100 * main[c].ink - 100 * INK[i]) < 0.35, `${c}: medido ${(100 * main[c].ink).toFixed(2)} % frente a ${(100 * INK[i]).toFixed(1)} % en ramp.ts`);
  }
  for (const [size, tbl] of Object.entries(ink)) {
    const order = [...'·:=*yaAG'].map((c) => tbl[c].ink);
    for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `${size}: «${'·:=*yaAG'[i]}» ya no pesa más que «${'·:=*yaAG'[i - 1]}»`);
  }
});

// ---------- §6.3: reglas de escena ----------

test('§6.3 · reglas de escena en los 7 visores y los 2 idiomas: determinista, toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos, dawn y arrival', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const spec = specOf(VIEWPORTS[vp]);
        const bad = checkSceneRules(SCENES[id], spec, wordsFor(id, lang, spec), { noBg: false, lang });
        assert.deepEqual(bad, [], `${id} ${lang} ${vp}: ${bad.join(' | ')}`);
      }
    }
  }
  assert.equal(coverB.id, 'cover');
  assert.equal(holaB.id, 'hola');
  assert.equal(coverB.dawn, 0);
  assert.equal(holaB.dawn, 0.15);
  assert.equal(coverB.arrival.ms, 2600);
  assert.equal(holaB.arrival.ms, 900);
});

test('el alfabeto: todo glifo del fotograma está en ALLOWED_ART_CHARS (nada de ← → ■ ● ≈ ni Braille)', () => {
  for (const id of ['cover', 'hola']) for (const lang of LANGS) for (const vp of ['d1440', 'm360']) {
    const { g } = paint(SCENES[id], vp, lang, makeFrame(0.6, 5.5, 0.4, false));
    for (let i = 0; i < g.b.length; i += 4) assert.ok(ALLOWED_ART_CHARS.has(GLYPHS[g.b[i]]), `${id} ${lang} ${vp}: «${GLYPHS[g.b[i]]}»`);
  }
});

// ---------- §5.4: presupuesto de tono ----------

const CAP_NONEMPTY = { cover: 60, hola: 55 };
test('§5.4 · presupuesto de tono del still: T≥9 ≤ 12 % · T≥11 ≤ 4 % · T≥13 ≤ 1,5 % · T≥14 ≤ 0,5 % · no vacías ≤ 60 / 55 % (7 visores × 2 idiomas)', () => {
  for (const id of ['cover', 'hola']) for (const lang of LANGS) for (const vp of ALL_VPS) {
    const { g, spec } = still(SCENES[id], vp, lang);
    const b = toneBudget(g);
    const tag = `${id} ${lang} ${vp} ${spec.cols}×${spec.rows}`;
    assert.ok(b.t9 <= 12, `${tag}: T≥9 ${b.t9}`);
    assert.ok(b.t11 <= 4, `${tag}: T≥11 ${b.t11}`);
    assert.ok(b.t13 <= 1.5, `${tag}: T≥13 ${b.t13}`);
    assert.ok(b.t14 <= 0.5, `${tag}: T≥14 ${b.t14}`);
    assert.ok(b.nonEmpty <= CAP_NONEMPTY[id], `${tag}: no vacías ${b.nonEmpty}`);
  }
});

test('el bg de B nunca pasa de T6: la losa y el aura no cuentan para el presupuesto (§5.4 mide el primer plano) y T6 es el tope bajo los pozos de texto', () => {
  for (const id of ['cover', 'hola']) for (const vp of ['d1440', 'm360', 'd1920']) {
    for (const p of [0.3, 0.7, 1]) {
      const { g } = paint(SCENES[id], vp, 'es', makeFrame(p, STILL_T, 0, false));
      let mx = 0;
      for (let i = 2; i < g.b.length; i += 4) mx = Math.max(mx, g.b[i]);
      assert.ok(mx <= 6, `${id} ${vp} p=${p}: bg máx. T${mx}`);
      assert.ok(countExplicitBg(g) > 0 || p < 0.1, `${id} ${vp}: sin bg`);
    }
  }
});

// ---------- identidad de B ----------

const LETTERS = /[A-Za-z0]/;
test('identidad: las letras de las caras son las del nombre (y a A G), y la bruma y la sombra solo llevan puntuación (nada de letras fuera del cartel)', () => {
  for (const lang of LANGS) for (const vp of ALL_VPS) {
    const { g, st } = still(coverB, vp, lang);
    const seen = new Set();
    for (let i = 0, j = 0; i < g.b.length; i += 4, j++) {
      const c = GLYPHS[g.b[i]];
      if (!c || !LETTERS.test(c)) continue;
      seen.add(c);
      assert.ok(st.cls[j] === 1 || st.cls[j] === 2, `cover ${lang} ${vp}: la letra «${c}» sale fuera del cartel (cls ${st.cls[j]})`);
    }
    assert.deepEqual([...seen].sort(), ['A', 'G', 'a', 'y'], `cover ${lang} ${vp}: letras ${[...seen].join('')}`);
  }
  for (const lang of LANGS) for (const vp of ['d1440', 'm360', 'd1920']) {
    const { g, st } = still(holaB, vp, lang);
    for (let i = 0, j = 0; i < g.b.length; i += 4, j++) {
      const c = GLYPHS[g.b[i]];
      if (c && LETTERS.test(c)) assert.ok(st.cls[j] === 1 || st.cls[j] === 2, `hola ${lang} ${vp}: la letra «${c}» sale fuera del cartel`);
    }
  }
});

test('jerarquía de letras: las mayúsculas A G no son la mayoría del agua (solo crestas y borde iluminado) y la mayoría de las celdas del cartel lleva y a * = :', () => {
  const { g, st } = still(coverB, 'd1440', 'es');
  const n = {};
  for (let i = 0, j = 0; i < g.b.length; i += 4, j++) {
    const c = GLYPHS[g.b[i]];
    if (!c || (st.cls[j] !== 1 && st.cls[j] !== 2) || !/[yaAG*=:·]/.test(c)) continue;
    n[c] = (n[c] ?? 0) + 1;
  }
  const caps = (n.A ?? 0) + (n.G ?? 0);
  const mid = (n.y ?? 0) + (n.a ?? 0);
  assert.ok(mid > 0 && caps > 0, JSON.stringify(n));
  assert.ok(caps / (caps + mid) < 0.5, `A+G ${caps} frente a y+a ${mid}: las mayúsculas no pueden ser la mayoría`);
  assert.ok(caps / (caps + mid) > 0.1, `A+G ${caps} frente a y+a ${mid}: sin crestas`);
});

test('HOLA: la H es sólida (bloques) y «OLA» lleva crestas `~` y espuma `o O 0`; en inglés, «ELLO»', () => {
  for (const lang of LANGS) {
    const { g } = still(holaB, 'd1440', lang);
    const n = {};
    for (let i = 0; i < g.b.length; i += 4) n[GLYPHS[g.b[i]]] = (n[GLYPHS[g.b[i]]] ?? 0) + 1;
    assert.ok((n['█'] ?? 0) > 150, `${lang}: H sólida ${n['█']}`);
    assert.ok((n['~'] ?? 0) > 20, `${lang}: crestas ~ ${n['~']}`);
    assert.ok((n.o ?? 0) + (n.O ?? 0) + (n['0'] ?? 0) > 10, `${lang}: espuma o O 0`);
  }
});

// ---------- guion de la llegada ----------

test('llegada de cover: la bruma se abre, el aro se traza, el agua sube con el menisco y la tela pasa de puntuación a letras', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = coverB.build(spec, 'es', wordsFor('cover', 'es', spec));
  const at = (p) => {
    const g = makeCells(spec.cols, spec.rows);
    coverB.paint(g, st, makeFrame(p, STILL_T, 0, false));
    return g;
  };
  const letters = (g) => {
    let n = 0;
    for (let i = 0; i < g.b.length; i += 4) if (LETTERS.test(GLYPHS[g.b[i]] ?? '')) n++;
    return n;
  };
  const ink = (g) => {
    let n = 0;
    for (let i = 0; i < g.b.length; i += 4) if (g.b[i]) n++;
    return n;
  };
  assert.ok(ink(at(0.02)) < 40, 'p ≈ 0: pantalla casi vacía');
  assert.ok(ink(at(0.12)) > ink(at(0.02)), 'la bruma se abre');
  assert.ok(letters(at(0.9)) > letters(at(0.45)) && letters(at(0.45)) >= letters(at(0.12)), 'el agua sube: más letras con p');
  assert.equal(hashCells(at(1)), hashCells(renderStill(coverB, spec, 'es', wordsFor('cover', 'es', spec))), 'p = 1 es el still');
});

test('hola: las olas ganan amplitud con p y la H cristaliza; p = 1 es el still', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = holaB.build(spec, 'es', wordsFor('hola', 'es', spec));
  const at = (p) => {
    const g = makeCells(spec.cols, spec.rows);
    holaB.paint(g, st, makeFrame(p, STILL_T, 0, false));
    return g;
  };
  assert.notEqual(hashCells(at(0.2)), hashCells(at(1)));
  assert.equal(hashCells(at(1)), hashCells(renderStill(holaB, spec, 'es', wordsFor('hola', 'es', spec))));
});

// ---------- calor y anillos ----------

test('calor y anillos: encienden la tela (suben tono y letra) y no introducen bloques ▒▓ en la tela', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = coverB.build(spec, 'es', wordsFor('cover', 'es', spec));
  const calm = makeCells(spec.cols, spec.rows);
  coverB.paint(calm, st, makeFrame(1, STILL_T, 0, true));
  const f = makeFrame(1, STILL_T, 0.3, false);
  f.heat = new Float32Array(spec.cols * spec.rows);
  for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
    const w = 1 - ((x - 60) / 13) ** 2 - ((y - 11) / 6.5) ** 2;
    f.heat[y * spec.cols + x] = w > 0 ? w * w : 0;
  }
  f.rings = [{ x: 100, y: 12, age: 0.4 }];
  const hot = makeCells(spec.cols, spec.rows);
  coverB.paint(hot, st, f);
  let up = 0;
  let down = 0;
  const shades = ['▒', '▓'].map(glyphIndex);
  let shadeCalm = 0;
  let shadeHot = 0;
  for (let i = 0; i < calm.b.length; i += 4) {
    if (hot.b[i + 1] > calm.b[i + 1]) up++;
    if (hot.b[i + 1] < calm.b[i + 1] && hot.b[i] && calm.b[i]) down++;
    if (shades.includes(calm.b[i])) shadeCalm++;
    if (shades.includes(hot.b[i])) shadeHot++;
  }
  assert.ok(up > 80, `el calor sube el tono de ${up} celdas`);
  assert.ok(down < 40, `el calor no apaga: ${down}`);
  assert.ok(shadeHot <= shadeCalm + 4, `bloques ▒▓ con calor: ${shadeHot} frente a ${shadeCalm}`);
});

// ---------- pozos (§5.8) ----------

test('pozos: con el tope de la portada puesto, cover y hola de B quedan por debajo de T6 (ink) y T4 (muted) bajo el texto, y el motor no tiene que recortar nada en 160×50 ni en 60×66', () => {
  for (const id of ['cover', 'hola']) for (const vp of ['d1440', 'd1920', 't1024', 'm360', 'm390']) {
    const spec = specOf(VIEWPORTS[vp]);
    const mobile = spec.cols < 90;
    const rects = mobile
      ? [{ x: 3, y: 37, w: spec.cols - 6, h: 10, kind: 'ink' }, { x: 3, y: 47, w: spec.cols - 12, h: 6, kind: 'muted' }]
      : [{ x: 8, y: 26, w: Math.min(92, spec.cols - 12), h: 11, kind: 'ink' }, { x: 8, y: 37, w: Math.min(70, spec.cols - 12), h: 4, kind: 'muted' }, { x: 8, y: 42, w: Math.min(50, spec.cols - 12), h: 4, kind: 'ink' }];
    const cap = makeCap(spec.cols, spec.rows);
    buildCap(cap, spec.cols, spec.rows, rects, { v: 0, dt: 1 / 30, ch: spec.cssCh, energy: 0 });
    const f = makeFrame(1, STILL_T, 0, true);
    f.cap = cap;
    const st = SCENES[id].build(spec, 'es', wordsFor(id, 'es', spec));
    const g = makeCells(spec.cols, spec.rows);
    SCENES[id].paint(g, st, f);
    let over = 0;
    for (let i = 0, j = 0; i < g.b.length; i += 4, j++) if (g.b[i + 1] > cap[j] || g.b[i + 2] > cap[j]) over++;
    assert.equal(over, 0, `${id} ${vp}: ${over} celdas por encima del tope antes de applyCap`);
    applyCap(g, cap);
    for (let i = 0, j = 0; i < g.b.length; i += 4, j++) {
      assert.ok(g.b[i + 1] <= cap[j] && g.b[i + 2] <= cap[j], `${id} ${vp}: celda ${j} por encima del tope`);
      if (cap[j] <= 6) assert.ok(g.b[i + 1] <= 6 && g.b[i + 2] <= 6);
    }
  }
});

// ---------- el póster SSR y el bg ----------

test('póster SSR: B usa bg (diferencia declarada con la base): renderPosterLayers funciona y devuelve las 4 capas, pero el fondo no viaja en el póster', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const words = wordsFor('cover', 'es', spec);
  const g = renderStill(coverB, spec, 'es', words);
  assert.ok(countExplicitBg(g) > 1000, 'B declara su bg');
  const L = renderPosterLayers(coverB, spec, 'es', words);
  for (const k of ['dim', 'mid', 'hot', 'spark']) assert.equal(typeof L[k], 'string');
  assert.ok(L.dim.length + L.mid.length > 1000, 'las capas no están vacías');
});

// ---------- la marea con letras ----------

test('composeB: pura, no muta las rejillas de origen, y la banda de agua es de letras y puntuación (sin tramas ░▒▓ propias) con espuma ~ o O 0', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const a = still(coverB, 'd1440', 'es');
  const b = still(holaB, 'd1440', 'es');
  const tp = tideParams(false);
  const hashA = hashCells(a.g);
  const hashB = hashCells(b.g);
  const run = () => {
    const out = makeCells(spec.cols, spec.rows);
    composeB(out, a.g, b.g, a.st.cls, b.st.cls, spec.rows * 0.52, { band: tp.band, reach: tp.reach, t: STILL_T });
    return out;
  };
  const o1 = run();
  const o2 = run();
  assert.equal(hashCells(o1), hashCells(o2), 'determinista');
  assert.equal(hashCells(a.g), hashA, 'no muta el saliente');
  assert.equal(hashCells(b.g), hashB, 'no muta el entrante');
  // con dos carteles vacíos lo único que queda es la marea: banda de agua + (nada más)
  const empty = makeCells(spec.cols, spec.rows);
  const out = makeCells(spec.cols, spec.rows);
  const zeros = new Uint8Array(spec.cols * spec.rows);
  composeB(out, empty, empty, zeros, zeros, spec.rows * 0.5, { band: tp.band, reach: tp.reach, t: STILL_T });
  const n = {};
  for (let i = 0; i < out.b.length; i += 4) if (out.b[i]) n[GLYPHS[out.b[i]]] = (n[GLYPHS[out.b[i]]] ?? 0) + 1;
  assert.ok(!n['░'] && !n['▒'] && !n['▓'], `tramas en la banda: ${JSON.stringify(n)}`);
  assert.ok((n['~'] ?? 0) > 5, 'cresta ~');
  assert.ok((n.o ?? 0) + (n.O ?? 0) + (n['0'] ?? 0) > 3, 'espuma o O 0');
  assert.ok(((n.y ?? 0) + (n.a ?? 0) + (n.A ?? 0)) > 20, 'la banda dice el nombre: y a A');
});

// ---------- pureza, asignaciones y coste ----------

const FILES = ['ramp.ts', 'fabric.ts', 'cover.ts', 'hola.ts', 'tide.ts', 'index.ts'];
const code = (file) =>
  readFileSync(resolve(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('código: sin Math.random, reloj ni DOM; sin Math.sin/cos/pow/exp; sintaxis borrable; imports con .ts; sin texto visible en cadenas', () => {
  for (const f of FILES) {
    const c = code(f);
    assert.doesNotMatch(c, /Math\.random/, `${f}: Math.random`);
    assert.doesNotMatch(c, /performance\.now|Date\.now|new Date\b/, `${f}: reloj`);
    assert.doesNotMatch(c, /\b(document|window|navigator|requestAnimationFrame)\b/, `${f}: DOM`);
    assert.doesNotMatch(c, /Math\.(sin|cos|tan|pow|exp|log|log2|log10|atan|atan2|asin|acos|sinh|cosh|tanh|hypot|cbrt)\b/, `${f}: transcendente`);
    assert.doesNotMatch(c, /\*\*/, `${f}: operador **`);
    assert.doesNotMatch(c, /\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(private|public|protected|readonly)\s+\w/, `${f}: sintaxis no borrable`);
    const raw = readFileSync(resolve(SRC, f), 'utf8');
    for (const m of raw.matchAll(/from\s+["'](\.{1,3}\/[^"']+)["']/g)) assert.match(m[1], /\.ts$/, `${f}: «${m[1]}» sin .ts`);
    for (const m of raw.matchAll(/import\(\s*["'](\.{1,3}\/[^"']+)["']\s*\)/g)) assert.match(m[1], /\.ts$/, `${f}: import() «${m[1]}» sin .ts`);
    for (const m of c.matchAll(/"([^"\n]+)"/g)) assert.doesNotMatch(m[1], /[A-Za-zÁ-ú]{2,} [A-Za-zÁ-ú]{2,}/, `${f}: «${m[1]}» parece texto visible`);
  }
});

test('sin asignaciones por cuadro: paint de cover y hola (con calor, anillos y tope) no construye arreglos tipados, buffers, Map ni Set', () => {
  const NAMES = ['Uint8Array', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'Map', 'Set'];
  const counts = Object.fromEntries(NAMES.map((n) => [n, 0]));
  const originals = {};
  const spec = specOf(VIEWPORTS.d1440);
  const prep = [coverB, holaB].map((sc) => {
    const st = sc.build(spec, 'es', wordsFor(sc.id, 'es', spec));
    const g = makeCells(spec.cols, spec.rows);
    const f = makeFrame(1, STILL_T, 0.3);
    f.heat = new Float32Array(spec.cols * spec.rows).fill(0.3);
    f.rings = [{ x: 40, y: 12, age: 0.3 }];
    f.cap = new Uint8Array(spec.cols * spec.rows).fill(15);
    return { sc, st, g, f };
  });
  const frame = (n) => {
    for (const { sc, st, g, f } of prep) {
      f.t = STILL_T + n * 0.033;
      f.p = 0.2 + 0.8 * ((n % 42) / 41);
      sc.paint(g, st, f);
    }
  };
  for (let i = 0; i < 4; i++) frame(i);
  for (const n of NAMES) {
    originals[n] = globalThis[n];
    globalThis[n] = new Proxy(originals[n], { construct(t, args, nt) { counts[n]++; return Reflect.construct(t, args, nt); } });
  }
  try {
    for (let i = 0; i < 50; i++) frame(i);
  } finally {
    for (const n of NAMES) globalThis[n] = originals[n];
  }
  assert.equal(NAMES.reduce((s, n) => s + counts[n], 0), 0, `asignaciones por cuadro: ${JSON.stringify(counts)}`);
});

test('coste: paint a 9 000 celdas en Node (la medición con CPU ×4 en Chrome está en tools/bench-variant-b.mjs)', () => {
  const spec = specOf({ ...VIEWPORTS.d1440, w: 1620, h: 900 }); // 180×50
  assert.equal(spec.cols * spec.rows, 9000);
  for (const sc of [coverB, holaB]) {
    const st = sc.build(spec, 'es', wordsFor(sc.id, 'es', spec));
    const g = makeCells(spec.cols, spec.rows);
    const f = makeFrame(1, STILL_T, 0.3);
    f.heat = new Float32Array(spec.cols * spec.rows).fill(0.2);
    const ts = [];
    for (let i = 0; i < 160; i++) {
      f.t = STILL_T + i * 0.033;
      const t0 = process.hrtime.bigint();
      sc.paint(g, st, f);
      ts.push(Number(process.hrtime.bigint() - t0) / 1e6);
    }
    ts.sort((a, b) => a - b);
    assert.ok(ts[80] < 3, `${sc.id}: mediana ${ts[80].toFixed(2)} ms por cuadro en Node (presupuesto: 6 ms con CPU ×4)`);
  }
});

test('mismas huellas en dos construcciones; HOLA y HELLO difieren y GAYA no: el arte de B no depende del orden de llamada', () => {
  const spec = specOf(VIEWPORTS.d1440);
  for (const id of ['cover', 'hola']) {
    const h = (lang) => hashCells(renderStill(SCENES[id], spec, lang, wordsFor(id, lang, spec)));
    assert.equal(h('es'), h('es'));
    assert.equal(h('en'), h('en'));
    if (id === 'hola') assert.notEqual(h('es'), h('en'), 'HOLA y HELLO son carteles distintos');
    else assert.equal(h('es'), h('en'), 'GAYA es la misma palabra en los dos idiomas');
  }
});

// ---------- modo sin bg (póster seguro) ----------

test('modo sin bg: createCoverB({ bg: 0, bgGlow: 0 }) no usa bg en ningún fotograma (cumple la regla de `cover` con póster SSR) y sigue dentro del presupuesto de tono', async () => {
  const { createHolaB } = await import('../../src/ascii/scenes/variants/b/index.ts');
  const plain = createCoverB({ bg: 0, bgGlow: 0 });
  const plainHola = createHolaB({ bg: 0, bgGlow: 0 });
  for (const lang of LANGS) for (const vp of ['d1440', 'd1600', 'd1920', 'm360', 'm320']) {
    const spec = specOf(VIEWPORTS[vp]);
    for (const [sc, id] of [[plain, 'cover'], [plainHola, 'hola']]) {
      const bad = checkSceneRules(sc, spec, wordsFor(id, lang, spec), { noBg: true, lang });
      assert.deepEqual(bad, [], `${id} ${lang} ${vp}: ${bad.join(' | ')}`);
      const st = sc.build(spec, lang, wordsFor(id, lang, spec));
      const g = makeCells(spec.cols, spec.rows);
      const f = makeFrame(1, STILL_T, 0.3, false);
      f.heat = new Float32Array(spec.cols * spec.rows).fill(0.5);
      f.rings = [{ x: 30, y: 10, age: 0.4 }];
      sc.paint(g, st, f);
      assert.equal(countExplicitBg(g), 0, `${id} ${lang} ${vp}: usó bg con calor`);
      const b = toneBudget(renderStill(sc, spec, lang, wordsFor(id, lang, spec)));
      assert.ok(b.t9 <= 12 && b.t11 <= 4 && b.t13 <= 1.5 && b.t14 <= 0.5, `${id} ${lang} ${vp}: presupuesto ${JSON.stringify(b)}`);
    }
  }
  // y el póster sí es fiel a la capa y al glifo (cuantizado a 4 tonos), como el de la base
  const spec = specOf(VIEWPORTS.d1440);
  const g = renderStill(plain, spec, 'es', wordsFor('cover', 'es', spec));
  const L = renderPosterLayers(plain, spec, 'es', wordsFor('cover', 'es', spec));
  let visible = 0;
  for (let i = 0; i < g.b.length; i += 4) if (g.b[i] && g.b[i + 1] > 0) visible++;
  const chars = Object.values(L).reduce((n, s) => n + [...s].filter((c) => c !== ' ' && c !== '\n').length, 0);
  assert.equal(chars, visible, 'cada celda visible cae en una capa del póster');
});
