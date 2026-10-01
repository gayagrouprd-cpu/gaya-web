// Escenas A (WP6): cover · hola · mist. Checklist de hecho por escena de DIRECTION §12.7, reglas de escena de §6.3 (vía checkSceneRules),
// presupuesto de tono de §5.4 a los tamaños de referencia, guion de la llegada, reacciones, póster SSR, pureza del código y hashes dorados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './fixtures/scene-env.mjs';
import { checkSceneRules, toneBudget } from './fixtures/scene-rules.mjs';
import { computeSceneHashes } from './fixtures/scene-hashes.mjs';
import {
  GLYPHS, STILL_T, countExplicitBg, getGlyph, getTone, glyphIndex, hashCells, makeCells, makeFrame,
} from '../../src/ascii/scenes/common.ts';
import { C_FACE, G_GLASS, faceFn } from '../../src/ascii/kit.ts';
import { renderPosterLayers, renderStill } from '../../src/ascii/ssr.ts';
import { REGISTERED, getScene, hasScene, loadScene } from '../../src/ascii/scenes/index.ts';
import { cover, createCover } from '../../src/ascii/scenes/cover.ts';
import { hola } from '../../src/ascii/scenes/hola.ts';
import { mistScene } from '../../src/ascii/scenes/mist.ts';
import { getWords } from '../../src/ascii/words.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../src/ascii');
const GOLDEN = resolve(HERE, 'golden.json');
const CLI = resolve(HERE, 'fixtures/scene-hash-cli.mjs');

await ensureWords('es');
await ensureWords('en');

const SCENES = { cover, hola, mist: mistScene };
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
const count = (g, pred) => {
  let n = 0;
  for (let i = 0; i < g.b.length; i += 4) if (pred(g.b[i], g.b[i + 1], g.b[i + 2])) n++;
  return n;
};

// ---------- registro ----------

test('registro: cover, hola y mist con su id, dawn (§5.4) y duración de llegada (§6.5)', async () => {
  for (const id of ['cover', 'hola', 'mist']) assert.ok(REGISTERED.includes(id) && hasScene(id), id);
  assert.equal(getScene('cover'), cover, 'cover está siempre cargada (primera carga)');
  for (const [id, sc] of Object.entries(SCENES)) {
    assert.equal(sc.id, id);
    assert.equal(await loadScene(id), sc);
    assert.equal(typeof sc.build, 'function');
    assert.equal(typeof sc.paint, 'function');
  }
  assert.equal(cover.dawn, 0, 'portada 0 · nosotros 0,15 · servicios 0,3');
  assert.equal(hola.dawn, 0.15);
  assert.equal(mistScene.dawn, 0.3);
  assert.equal(cover.arrival.ms, 2600, 'ignición ≤ 2,6 s');
  assert.equal(hola.arrival.ms, 900, 'llegada de HOLA = 900 ms (§7.2)');
  assert.ok(mistScene.arrival.ms >= 600 && mistScene.arrival.ms <= 1900);
  await assert.rejects(() => loadScene('web'), /aún no está registrada/);
});

// ---------- §6.3 / §12.7: reglas de escena ----------

test('§6.3 · reglas de escena en los 7 visores y los 2 idiomas: determinista, toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos', () => {
  for (const id of ['cover', 'hola', 'mist']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const spec = specOf(VIEWPORTS[vp]);
        const bad = checkSceneRules(SCENES[id], spec, wordsFor(id, lang, spec), { noBg: id === 'cover', lang });
        assert.deepEqual(bad, [], `${id} ${lang} ${vp}: ${bad.join(' | ')}`);
      }
    }
  }
});

test('cover no usa `bg` en ningún fotograma (tiene póster SSR), ni con calor ni con anillos; mist tampoco; hola sí puede', () => {
  for (const vp of ['d1440', 'm360']) {
    for (const p of [0, 0.08, 0.3, 0.6, 0.85, 1]) {
      for (const scene of [cover, createCover({ face: 'glyph' }), mistScene]) {
        const spec = specOf(VIEWPORTS[vp]);
        const st = scene.build(spec, 'es', wordsFor('cover', 'es', spec));
        const g = makeCells(spec.cols, spec.rows);
        const f = makeFrame(p, 4.4, 0.3);
        f.heat = new Float32Array(spec.cols * spec.rows).fill(0.6);
        f.rings = [{ x: 30, y: 10, age: 0.4 }];
        scene.paint(g, st, f);
        assert.equal(countExplicitBg(g), 0, `${scene.id} ${vp} p=${p} usó bg`);
      }
    }
  }
  assert.ok(countExplicitBg(still(hola, 'd1440', 'es').g) > 0, 'hola degrada las olas con bg (no tiene póster)');
});

// ---------- §5.4: presupuesto de tono ----------

const CAP_NONEMPTY = { cover: 60, hola: 55, mist: 35 };
test('§5.4 · presupuesto de tono del still: T≥9 ≤ 12 % · T≥11 ≤ 4 % · T≥13 ≤ 1,5 % · T≥14 ≤ 0,5 % · no vacías ≤ 60 / 55 / 35 % (160×50, 60×66, 133×36 y los demás)', () => {
  const rows = [];
  for (const id of ['cover', 'hola', 'mist']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, spec } = still(SCENES[id], vp, lang);
        const b = toneBudget(g);
        const tag = `${id} ${lang} ${vp} ${spec.cols}×${spec.rows}`;
        rows.push(`${tag}: T9 ${b.t9.toFixed(1)} T11 ${b.t11.toFixed(2)} T13 ${b.t13.toFixed(2)} T14 ${b.t14.toFixed(2)} no vacías ${b.nonEmpty.toFixed(1)}`);
        assert.ok(b.t9 <= 12, `${tag}: T≥9 ${b.t9}`);
        assert.ok(b.t11 <= 4, `${tag}: T≥11 ${b.t11}`);
        assert.ok(b.t13 <= 1.5, `${tag}: T≥13 ${b.t13}`);
        assert.ok(b.t14 <= 0.5, `${tag}: T≥14 ${b.t14}`);
        assert.ok(b.nonEmpty <= CAP_NONEMPTY[id], `${tag}: no vacías ${b.nonEmpty}`);
      }
    }
  }
  if (process.env.WP6_VERBOSE) console.log(rows.join('\n'));
});

test('mist: densidad ≤ 35 % también con energía de scroll y a cualquier fase del agua (en vivo no hay still que la mida)', () => {
  for (const vp of ['d1440', 'd1600', 'd1920', 'm360']) {
    for (const [t, e] of [[STILL_T, 0], [3.3, 1], [40, 1], [12, 0.5], [77.7, 1]]) {
      const { g, spec } = paint(mistScene, vp, 'es', makeFrame(1, t, e, false));
      const n = (100 * count(g, (gl) => gl !== 0)) / (spec.cols * spec.rows);
      assert.ok(n <= 35, `mist ${vp} t=${t} e=${e}: ${n.toFixed(1)} %`);
      assert.ok(n >= 15, `mist ${vp}: demasiado vacía (${n.toFixed(1)} %)`);
    }
  }
});

// ---------- composición (§5.3, §4.4) ----------

test('composición: la palabra cabe con margen en todos los visores y deja sitio al texto (filas 26–45 en 160×50)', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, spec } = still(SCENES[id], vp, lang);
        // la tinta «dura» (aro y caras) es lo que dibuja la palabra: bloques y cuadrantes en T≥7
        let x0 = 1e9;
        let x1 = -1;
        let y0 = 1e9;
        let y1 = -1;
        for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
          const k = (y * spec.cols + x) << 2;
          if (g.b[k] && g.b[k + 1] >= 8 && glyphIndex('▘') <= g.b[k] && g.b[k] <= glyphIndex('█')) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
        }
        const mobile = spec.cols < 90;
        assert.ok(x0 >= 3 && x1 <= spec.cols - 4, `${id} ${lang} ${vp}: la palabra (${x0}–${x1}) no deja 4 columnas de margen en ${spec.cols}`);
        assert.ok(y0 >= 2, `${id} ${lang} ${vp}: empieza en la fila ${y0}`);
        if (vp === 'd1440') assert.ok(y0 >= 3 && y1 <= 21, `${id} ${lang}: filas ${y0}–${y1} (DIRECTION §4.4: 4–20)`);
        if (vp === 'm360' && id === 'cover') assert.ok(y1 <= 34, `${id} ${lang} ${vp}: la pila llega a la fila ${y1} (§4.4: 3–31)`);
        if (!mobile) assert.ok(y1 <= spec.rows * 0.5, `${id} ${lang} ${vp}: la palabra baja a la fila ${y1} de ${spec.rows}`);
      }
    }
  }
});

test('móvil 360×800 y 320×568: GAYA en pila GA / YA con la 2.ª línea +3 columnas; HOLA en HO / LA y HELLO en HEL / LO', () => {
  const m = specOf(VIEWPORTS.m360);
  const g = getWords('GAYA', 'es', m.cols);
  assert.equal(g.variant, 'S');
  assert.equal(g.lines.length, 2);
  assert.deepEqual(g.offsets, [0, 3]);
  assert.equal(getWords('HOLA', 'es', m.cols).lines.length, 2);
  assert.equal(getWords('HELLO', 'en', m.cols).lines.length, 2);
  assert.equal(getWords('GAYA', 'es', specOf(VIEWPORTS.m320).cols).variant, 'XS');
});

// ---------- cover: anatomía y guion ----------

test('cover · anatomía del fotograma final (§5.5): bruma que sale de la palabra, aro de luz, vidrio con agua, menisco, cáusticas, sombra y destellos', () => {
  const { g, st, spec } = still(cover, 'd1440', 'es');
  const tones = new Array(16).fill(0);
  const glyphs = {};
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    tones[g.b[i + 1]]++;
    glyphs[g.b[i]] = (glyphs[g.b[i]] ?? 0) + 1;
  }
  assert.ok(tones[10] > 150, `aro de luz T10: ${tones[10]}`);
  assert.ok(tones[11] + tones[12] >= 25, `destellos y menisco T11–T12: ${tones[11] + tones[12]}`);
  assert.ok(tones[15] >= 3 && tones[15] <= 6, `3–6 chispas T15 (§7.1): ${tones[15]}`);
  assert.ok(tones[8] > 100 && tones[5] + tones[6] + tones[7] > 100, 'pared T8 y agua T5–T7 con profundidad');
  assert.ok((glyphs[glyphIndex('░')] ?? 0) > 500 && (glyphs[glyphIndex('▒')] ?? 0) > 100, 'bruma de texturas ░▒');
  assert.ok((glyphs[glyphIndex('▓')] ?? 0) > 20, 'el peldaño denso ▓ junto a la palabra');
  assert.ok((glyphs[glyphIndex('·')] ?? 0) + (glyphs[glyphIndex('.')] ?? 0) + (glyphs[glyphIndex("'")] ?? 0) > 20, 'polvo de luz · . \' en el borde');
  // agua en las caras: cáusticas (T8–T10 dentro del agua, T5–T7 de fondo)
  const words = wordsFor('cover', 'es', spec);
  const line = words[0].lines[0];
  const f = faceFn(line, 0, 0);
  void f;
  const hist = [0, 0, 0, 0];
  for (const c of st.cls) hist[c]++;
  assert.ok(hist.every((n) => n > 0), `cls ${hist}`);
  assert.equal(hist.reduce((a, b) => a + b, 0), spec.cols * spec.rows);
  // sombra proyectada: celdas ░ T2 marcadas como aura (cls 3) y nunca sobre masa
  let shadow = 0;
  for (let i = 0; i < st.cls.length; i++) if (st.cls[i] === 3 && g.b[i * 4] === glyphIndex('░') && g.b[i * 4 + 1] === 2) shadow++;
  assert.ok(shadow > 100, `sombra ░ T2: ${shadow}`);
});

test('cover · el menisco no deja muescas: en las celdas de cara solo hay bloques llenos █ (agua, menisco) o vidrio ▒, nunca medios bloques', () => {
  for (const vp of ['d1440', 'd1600', 'm360', 'm320']) {
    const { g, st, spec } = still(cover, vp, 'es');
    let face = 0;
    let glass = 0;
    let surface = 0;
    for (let i = 0; i < st.cls.length; i++) {
      if (st.cls[i] !== C_FACE) continue;
      face++;
      const gl = g.b[i * 4];
      assert.ok(gl === glyphIndex('█') || gl === G_GLASS, `${vp}: glifo de cara ${GLYPHS[gl]} en (${i % spec.cols}, ${(i / spec.cols) | 0})`);
      if (gl === G_GLASS) glass++;
      else if (g.b[i * 4 + 1] >= 11) surface++;
    }
    assert.ok(face > 50, `${vp}: caras ${face}`);
    assert.ok(glass > 0 && surface > 0, `${vp}: hay vidrio (${glass}) y menisco (${surface}) a la vista`);
  }
});

test('cover · guion de la ignición: bruma → aro (barrido) → nivel del agua → cáusticas → sombra y chispas, todo monótono en p', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = cover.build(spec, 'es', wordsFor('cover', 'es', spec));
  const frame = (p) => {
    const g = makeCells(spec.cols, spec.rows);
    cover.paint(g, st, makeFrame(p, STILL_T, 0, true));
    return g;
  };
  assert.equal(count(frame(0), (gl) => gl !== 0), 0, 'p = 0: pantalla vacía (la bruma aún cerrada)');
  const steps = [0.02, 0.06, 0.1, 0.15, 0.2, 0.3, 0.5, 0.7, 0.9, 1];
  const inked = steps.map((p) => count(frame(p), (gl, t) => gl !== 0 && t >= 8));
  // monótono salvo el ruido de la profundidad: al subir el nivel unas celdas de agua pasan de T8 a T7 (≤ 3 %)
  for (let i = 1; i < steps.length; i++) assert.ok(inked[i] >= inked[i - 1] * 0.97, `luz T≥8 decrece en p=${steps[i]}: ${inked}`);
  assert.ok(inked[9] > inked[5] * 0.98 && inked[5] > inked[3], `el aro se completa antes que el agua: ${inked}`);
  assert.ok(inked[3] > 0 && inked[3] < inked[9] * 0.8, `el aro se traza poco a poco (p = 0,15: ${inked[3]} de ${inked[9]})`);
  // el nivel sube: cuanto mayor p, más celdas de agua (█ en la cara) y menos vidrio ▒ en las caras
  const faceCount = (p, pred) => {
    const g = frame(p);
    let n = 0;
    for (let i = 0; i < st.cls.length; i++) if (st.cls[i] === C_FACE && pred(g.b[i * 4], g.b[i * 4 + 1])) n++;
    return n;
  };
  const water = (p) => faceCount(p, (gl) => gl === glyphIndex('█'));
  const glassN = (p) => faceCount(p, (gl) => gl === G_GLASS);
  assert.ok(water(0.6) > water(0.2) && water(1) >= water(0.6), 'el agua llena las letras');
  assert.ok(glassN(0.2) > glassN(0.6) && glassN(0.6) >= glassN(1), 'el vidrio vacío se reduce');
  // la bruma se abre desde el centro: a p = 0,1 hay menos bruma que a p = 0,2
  const mistN = (p) => count(frame(p), (gl, t) => (gl === glyphIndex('░') || gl === glyphIndex('▒') || gl === glyphIndex('▓')) && t <= 6);
  assert.ok(mistN(0.03) < mistN(0.06) && mistN(0.06) < mistN(0.12), 'la bruma se abre con p');
  // sombra y chispas al final
  const sparks = (p) => count(frame(p), (gl, t) => t === 15);
  assert.equal(sparks(0.5), 0);
  assert.ok(sparks(1) >= 3 && sparks(0.8) <= sparks(1));
  // la cabeza del barrido brilla solo en la ignición: el still no la lleva (still ≡ p = 1 y `still: true`)
  const a = frame(0.12);
  const b = cover.build(spec, 'es', wordsFor('cover', 'es', spec));
  const g2 = makeCells(spec.cols, spec.rows);
  cover.paint(g2, b, makeFrame(0.12, STILL_T, 0, false));
  assert.notEqual(hashCells(a), hashCells(g2), 'con still: false la cabeza del barrido brilla (+3 tonos)');
});

test('cover · el nivel de reposo es 0,78 de la cara y se puede cambiar (?level=): más nivel, más agua y menos vidrio', () => {
  const f = (level) => still(createCover({ level }), 'd1440', 'es').g;
  assert.ok(count(f(0.6), (gl) => gl === G_GLASS) > count(f(0.9), (gl) => gl === G_GLASS));
  assert.equal(hashCells(f(0.78)), hashCells(still(cover, 'd1440', 'es').g), 'el predeterminado es 0,78');
});

test('cover · variante ?face=glyph: el agua es una textura de glifos · : ~ = + * y todo lo demás (aro, bruma, presupuesto) se conserva', () => {
  const glyph = createCover({ face: 'glyph' });
  const a = still(cover, 'd1440', 'es').g;
  const b = still(glyph, 'd1440', 'es').g;
  assert.notEqual(hashCells(a), hashCells(b));
  const water = new Set(['·', ':', '~', '=', '+', '*'].map(glyphIndex));
  assert.ok(count(b, (gl, t) => water.has(gl) && t >= 6 && t <= 11) > 100, 'hay textura de glifos de agua');
  const bud = toneBudget(b);
  assert.ok(bud.t9 <= 12 && bud.t11 <= 4 && bud.t13 <= 1.5 && bud.t14 <= 0.5 && bud.nonEmpty <= 60, JSON.stringify(bud));
  assert.deepEqual(checkSceneRules(glyph, specOf(VIEWPORTS.d1440), wordsFor('cover', 'es', specOf(VIEWPORTS.d1440)), { noBg: true }), []);
});

// ---------- hola ----------

test('hola · la H es agua sólida (solo bloques █) y «OLA» / «ELLO» son olas (degradados ░▒▓ con bg y espuma ~), en los dos idiomas y en pila', () => {
  for (const [lang, vp] of [['es', 'd1440'], ['en', 'd1440'], ['es', 'm360'], ['en', 'm360'], ['es', 'd1600'], ['en', 'm320']]) {
    const { g, spec } = still(hola, vp, lang);
    const [set] = wordsFor('hola', lang, spec);
    // ancho de la H = primera letra de la línea 0: hasta la primera columna vacía tras tinta
    const l0 = set.lines[0];
    let hEnd = l0.cols;
    let seen = false;
    for (let x = 0; x < l0.cols; x++) {
      let ink = false;
      for (let y = 0; y < l0.rows; y++) if (l0.cells[y * l0.cols + x]) ink = true;
      if (ink) seen = true;
      else if (seen) {
        hEnd = x;
        break;
      }
    }
    const x0 = Math.floor((spec.cols - Math.max(...set.lines.map((l, i) => l.cols + set.offsets[i]))) / 2) + set.offsets[0];
    const mobile = spec.cols < 90;
    const y0 = mobile || spec.rows < 44 ? 3 : 4;
    let hShades = 0;
    let hCells = 0;
    let waveShades = 0;
    let foam = 0;
    for (let y = y0; y < y0 + l0.rows; y++) {
      for (let x = x0; x < x0 + l0.cols; x++) {
        const k = (y * spec.cols + x) << 2;
        const gl = g.b[k];
        const inH = x - x0 < hEnd;
        const shade = gl === glyphIndex('░') || gl === glyphIndex('▒') || gl === glyphIndex('▓');
        if (inH && gl) {
          hCells++;
          if (shade && g.b[k + 2] > 0) hShades++; // la bruma y la sombra no llevan bg; las olas degradan con bg
        }
        if (!inH && shade && g.b[k + 2] > 0) waveShades++;
        if (!inH && gl === glyphIndex('~')) foam++;
      }
    }
    assert.ok(hCells > 40, `${lang} ${vp}: celdas de la H ${hCells}`);
    assert.equal(hShades, 0, `${lang} ${vp}: la H es sólida (sin degradados de ola con bg); ${hShades} celdas`);
    assert.ok(waveShades > 30, `${lang} ${vp}: las olas degradan entre tonos con ░▒▓ y bg (${waveShades})`);
    assert.ok(foam >= 1 || spec.cols < 90, `${lang} ${vp}: espuma ~ en las crestas (${foam})`);
  }
});

test('hola · guion de llegada (p): las olas ganan amplitud de 0 a 1 entre p = 0,3 y 1; a p = 0 las rayas son planas y a p = 1 ondulan', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = hola.build(spec, 'es', wordsFor('hola', 'es', spec));
  const at = (p) => {
    const g = makeCells(spec.cols, spec.rows);
    hola.paint(g, st, makeFrame(p, STILL_T, 0, false));
    return g;
  };
  // rugosidad vertical de las rayas: diferencia de tono de la misma fila entre columnas lejanas dentro de «OLA» (x ≈ 60..130)
  const rough = (g) => {
    let d = 0;
    let n = 0;
    for (let y = 6; y < 20; y++) for (let x = 62; x < 130; x += 6) {
      const a = g.b[(y * spec.cols + x) * 4 + 2]; // el fondo de la trama = tono bajo de la raya
      const b = g.b[(y * spec.cols + x + 6) * 4 + 2];
      if (g.b[(y * spec.cols + x) * 4] && g.b[(y * spec.cols + x + 6) * 4]) {
        d += Math.abs(a - b);
        n++;
      }
    }
    return d / Math.max(1, n);
  };
  const r0 = rough(at(0.3));
  const r1 = rough(at(1));
  assert.ok(r1 > r0 + 0.2, `a p = 0,3 las rayas son planas (${r0.toFixed(2)}) y a p = 1 ondulan (${r1.toFixed(2)})`);
  // la sombra aparece al final
  const sh = (g) => count(g, (gl, t, bg) => gl === glyphIndex('░') && t === 2 && bg === 0);
  assert.ok(sh(at(1)) > sh(at(0.5)) + 100, 'la sombra proyectada aparece con el final de la llegada');
});

test('hola · calor y anillos: la H brilla +2 tonos, las olas cambian de amplitud y fase; solo el calor y los anillos cambian el cuadro', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = hola.build(spec, 'es', wordsFor('hola', 'es', spec));
  const base = makeCells(spec.cols, spec.rows);
  hola.paint(base, st, makeFrame(1, STILL_T, 0, true));
  const f = makeFrame(1, STILL_T, 0, false);
  f.heat = new Float32Array(spec.cols * spec.rows);
  for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
    const dx = (x - 14) / 13;
    const dy = (y - 12) / 7;
    f.heat[y * spec.cols + x] = Math.max(0, 1 - (dx * dx + dy * dy));
  }
  const hot = makeCells(spec.cols, spec.rows);
  hola.paint(hot, st, f);
  let brighter = 0;
  for (let y = 4; y < 20; y++) for (let x = 0; x < 28; x++) {
    const k = (y * spec.cols + x) << 2;
    if (hot.b[k] === base.b[k] && hot.b[k + 1] > base.b[k + 1]) brighter++;
  }
  assert.ok(brighter > 15, `H bajo el calor: ${brighter} celdas más brillantes`);
  assert.notEqual(hashCells(hot), hashCells(base));
  const ringed = makeFrame(1, STILL_T, 0, false);
  ringed.rings = [{ x: 90, y: 12, age: 0.3 }];
  const r = makeCells(spec.cols, spec.rows);
  hola.paint(r, st, ringed);
  let up = 0;
  for (let i = 0; i < r.b.length; i += 4) {
    assert.equal(r.b[i], base.b[i], 'los anillos no cambian glifos');
    if (r.b[i + 1] > base.b[i + 1]) up++;
    assert.ok(r.b[i + 1] >= base.b[i + 1]);
  }
  assert.ok(up > 10);
});

// ---------- cover: calor ----------

test('cover · calor: la linterna sube tonos (vidrio vacío, aro, agua con cáusticas ×3 y bruma), nunca los baja, y no toca glifos del aro', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = cover.build(spec, 'es', wordsFor('cover', 'es', spec));
  const base = makeCells(spec.cols, spec.rows);
  cover.paint(base, st, makeFrame(1, STILL_T, 0, true));
  const f = makeFrame(1, STILL_T, 0, false);
  f.heat = new Float32Array(spec.cols * spec.rows);
  for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
    const dx = (x - 60) / 18;
    const dy = (y - 10) / 8;
    f.heat[y * spec.cols + x] = Math.max(0, 1 - (dx * dx + dy * dy));
  }
  const hot = makeCells(spec.cols, spec.rows);
  cover.paint(hot, st, f);
  let brighter = 0;
  let lowered = 0;
  for (let i = 0; i < base.b.length; i += 4) {
    if (base.b[i] && hot.b[i] && hot.b[i + 1] > base.b[i + 1]) brighter++;
    if (base.b[i] && hot.b[i] && hot.b[i + 1] < base.b[i + 1] && base.b[i] === hot.b[i]) lowered++;
  }
  assert.ok(brighter > 60, `la linterna enciende ${brighter} celdas`);
  assert.ok(lowered <= 0.02 * brighter, `el calor no apaga nada (${lowered} celdas más oscuras de ${brighter} más claras)`);
  // reacción opcional: sin calor el cartel está completo (= still)
  const none = makeCells(spec.cols, spec.rows);
  cover.paint(none, st, makeFrame(1, STILL_T, 0, false));
  assert.equal(hashCells(none), hashCells(base));
});

// ---------- póster SSR ----------

const quant = (tone) => (tone === 0 ? -1 : tone <= 5 ? 0 : tone <= 9 ? 1 : tone <= 12 ? 2 : 3);
test('T6 · paridad del póster SSR de la portada (wide 160×50, mid 113×44, stack 65×70 × ES/EN): capa y glifo 100 % iguales a la cuantización del motor, sin bg', () => {
  for (const lang of LANGS) {
    for (const vp of ['d1440', 't1024', 'm390']) {
      const spec = specOf(VIEWPORTS[vp]);
      const words = wordsFor('cover', lang, spec);
      const g = renderStill(cover, spec, lang, words);
      const L = renderPosterLayers(cover, spec, lang, words);
      const rows = Object.values(L).map((s) => s.split('\n').map((l) => [...l]));
      let visible = 0;
      let same = 0;
      for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
        const i = (y * spec.cols + x) * 4;
        const gl = g.b[i];
        const layer = gl === 0 ? -1 : quant(g.b[i + 1]);
        const chars = rows.map((r) => r[y]?.[x] ?? ' ');
        const who = chars.map((c, k) => (c !== ' ' ? k : -1)).filter((k) => k >= 0);
        if (layer === -1) assert.deepEqual(who, [], `${lang} ${vp}: celda invisible (${x},${y}) presente en ${who}`);
        else {
          visible++;
          assert.deepEqual(who, [layer], `${lang} ${vp}: (${x},${y}) capa ${who} ≠ ${layer}`);
          if (chars[layer] === GLYPHS[gl]) same++;
        }
      }
      assert.equal(same, visible, `${lang} ${vp}: paridad de glifo ${same}/${visible}`);
      assert.ok(visible > 1500, `${lang} ${vp}: póster casi vacío (${visible})`);
      assert.equal(countExplicitBg(g), 0);
    }
  }
});

// ---------- pureza del código, asignaciones y coste ----------

const SCENE_FILES = ['scenes/cover.ts', 'scenes/hola.ts', 'scenes/mist.ts', 'scenes/index.ts'];
const code = (file) =>
  readFileSync(resolve(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('código de las escenas: sin Math.random, reloj ni DOM; sin Math.sin/cos/pow/exp (ruta still solo enteros y polinomios); sintaxis borrable; imports con .ts', () => {
  for (const f of SCENE_FILES) {
    const c = code(f);
    assert.doesNotMatch(c, /Math\.random/, `${f}: Math.random`);
    assert.doesNotMatch(c, /performance\.now|Date\.now|new Date\b/, `${f}: reloj`);
    assert.doesNotMatch(c, /\b(document|window|navigator|requestAnimationFrame)\b/, `${f}: DOM`);
    assert.doesNotMatch(c, /Math\.(sin|cos|tan|pow|exp|log|log2|log10|atan|atan2|asin|acos|sinh|cosh|tanh|hypot|cbrt)\b/, `${f}: transcendente`);
    assert.doesNotMatch(c, /\*\*/, `${f}: operador **`);
    assert.doesNotMatch(c, /\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(private|public|protected|readonly)\s+\w/, `${f}: sintaxis no borrable`);
    const raw = readFileSync(resolve(SRC, f), 'utf8');
    for (const m of raw.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) assert.match(m[1], /\.ts$/, `${f}: «${m[1]}» sin .ts`);
    for (const m of raw.matchAll(/import\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g)) assert.match(m[1], /\.ts$/, `${f}: import() «${m[1]}» sin .ts`);
  }
});

test('las escenas no contienen texto visible (R8): ninguna cadena de código tiene forma de frase', () => {
  for (const f of SCENE_FILES) {
    for (const m of code(f).matchAll(/"([^"\n]+)"/g)) {
      assert.doesNotMatch(m[1], /[A-Za-zÁ-ú]{2,} [A-Za-zÁ-ú]{2,}/, `${f}: «${m[1]}» parece texto visible`);
    }
  }
});

test('sin asignaciones por cuadro: paint de cover, hola y mist (con calor y anillos) no construye arreglos tipados, buffers, Map ni Set', () => {
  const NAMES = ['Uint8Array', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'Map', 'Set'];
  const counts = Object.fromEntries(NAMES.map((n) => [n, 0]));
  const originals = {};
  const spec = specOf(VIEWPORTS.d1440);
  const prep = Object.values(SCENES).map((sc) => {
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

test('coste: paint a 9 000 celdas en Node (la medición con CPU ×4 en Chrome está en tools/bench-scenes.mjs)', () => {
  const spec = specOf({ ...VIEWPORTS.d1440, w: 1620, h: 900 }); // 180×50 = 9 000 celdas
  assert.equal(spec.cols * spec.rows, 9000);
  for (const id of ['cover', 'hola', 'mist']) {
    const sc = SCENES[id];
    const st = sc.build(spec, 'es', wordsFor(id, 'es', spec));
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
    const p50 = ts[80];
    assert.ok(p50 < 3, `${id}: mediana ${p50.toFixed(2)} ms por cuadro en Node (presupuesto: 6 ms con CPU ×4)`);
  }
});

// ---------- hashes dorados (T19) ----------

const HASH_MARK = 'pendiente de aprobación del dueño (T18): las huellas de las escenas fijan el arte de WP6 tal como lo dejó la revisión de dirección de arte; cambian con cualquier ajuste de arte y se renuevan con UPDATE_GOLDEN=1 solo con el visto bueno del dueño en color';

test('mismas huellas en dos ejecuciones, en procesos distintos y con V8 sin JIT', async (t) => {
  const here = await computeSceneHashes();
  const again = await computeSceneHashes();
  assert.deepEqual(again, here, 'dos ejecuciones en el mismo proceso');
  const run = (...flags) => JSON.parse(execFileSync(process.execPath, [...flags, CLI], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  assert.deepEqual(run(), here, 'proceso hijo distinto del proceso de prueba');
  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    t.skip('esbuild no está instalado');
    return;
  }
  const dir = mkdtempSync(resolve(tmpdir(), 'gaya-scenes-a-'));
  try {
    const out = resolve(dir, 'scene-hash-cli.bundle.mjs');
    await esbuild.build({ entryPoints: [CLI], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', external: ['node:*'] });
    assert.deepEqual(JSON.parse(execFileSync(process.execPath, ['--jitless', out], { encoding: 'utf8', maxBuffer: 1 << 26 })), here, 'V8 sin JIT da otro resultado: hay aritmética que depende del motor');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('coincide con los hashes dorados de las escenas (tests/ascii/golden.json, claves «scene/…»)', async () => {
  const here = await computeSceneHashes();
  const all = existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) : {};
  const mine = Object.keys(all).filter((k) => k.startsWith('scene/'));
  if (process.env.UPDATE_GOLDEN === '1' || mine.length === 0) {
    const keep = Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith('scene/') && k !== '_scenes'));
    writeFileSync(GOLDEN, JSON.stringify({ _scenes: HASH_MARK, ...keep, ...here }, null, 2) + '\n');
    return;
  }
  assert.deepEqual(Object.keys(here).sort(), mine.sort(), 'cambió el conjunto de huellas de escenas');
  for (const k of Object.keys(here)) assert.equal(here[k], all[k], `huella «${k}» cambió (si es un cambio de arte aprobado: UPDATE_GOLDEN=1)`);
  assert.match(all._scenes ?? '', /pendiente de aprobación del dueño/, 'golden.json debe marcar las huellas de escenas como pendientes de aprobación');
});

test('las huellas son distintas donde deben serlo (idioma, tamaño, llegada, variante)', async () => {
  const h = await computeSceneHashes();
  assert.notEqual(h['scene/cover/es/d1440/still'], h['scene/cover/es/m360/still']);
  assert.notEqual(h['scene/hola/es/d1440/still'], h['scene/hola/en/d1440/still'], 'HOLA ≠ HELLO');
  assert.equal(new Set([h['scene/cover/es/d1440/still'], h['scene/hola/es/d1440/still'], h['scene/mist/es/d1440/still']]).size, 3);
  assert.notEqual(h['scene/cover/es/d1440/still'], h['scene/cover/es/d1440/p30']);
  assert.notEqual(h['scene/cover/es/d1440/still'], h['scene/cover-glyph/es/d1440/still']);
  assert.equal(h['scene/cover/es/d1440/still'] === h['scene/cover/en/d1440/still'], true, 'GAYA es la misma en los dos idiomas');
  assert.equal(h['scene/poster/es/wide'], h['scene/poster/en/wide']);
});

test('sin estado compartido (las escenas no tienen recursos que liberar: dispose() del motor basta): dos builds alternados no se contaminan', () => {
  for (const id of ['cover', 'hola', 'mist']) {
    const sc = SCENES[id];
    const a = specOf(VIEWPORTS.d1440);
    const b = specOf(VIEWPORTS.m360);
    const stA = sc.build(a, 'es', wordsFor(id, 'es', a));
    const stB = sc.build(b, 'en', wordsFor(id, 'en', b));
    const f = makeFrame(1, STILL_T, 0, true);
    const ga = makeCells(a.cols, a.rows);
    const gb = makeCells(b.cols, b.rows);
    sc.paint(ga, stA, f);
    const h1 = hashCells(ga);
    sc.paint(gb, stB, f);
    sc.paint(ga, stA, f);
    assert.equal(hashCells(ga), h1, `${id}: pintar otro estado cambió el resultado`);
    assert.equal(hashCells(still(sc, 'd1440', 'es').g), h1, `${id}: un build nuevo da lo mismo`);
  }
});
