// Escenas oficiales (cover · hola · mist) en el estilo Duotono: checklist de hecho por escena de DIRECTION §12.7, reglas de escena de §6.3 (vía checkSceneRules, con `bg`),
// presupuesto de tono de §5.4 literal Y efectivo con los topes de la adopción, las correcciones de arte de los jueces (cara con glifos, sin papel pintado, luz frente a la base
// de bloques, sombra de una celda, olas de HOLA), la marea de caracteres, el póster SSR colapsado, la rampa medida, pozos de lectura, pureza del código, asignaciones por
// cuadro, coste y huellas doradas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './fixtures/scene-env.mjs';
import { checkSceneRules, checkToneBudget, effectiveBudget, toneBudget } from './fixtures/scene-rules.mjs';
import { artMetrics, belowWord, chebyshev, firstLetterCols, strokeMask, waveMetrics } from './fixtures/art-metrics.mjs';
import { computeSceneHashes } from './fixtures/scene-hashes.mjs';
import { TONE_LUM, contrast } from './fixtures/tones.mjs';
import {
  ALLOWED_ART_CHARS, GLYPHS, STILL_T, countExplicitBg, getGlyph, glyphIndex, hashCells, layoutLines, makeCells, makeFrame,
} from '../../src/ascii/scenes/common.ts';
import { toLayers } from '../../src/ascii/grid.ts';
import { renderPosterLayers, renderPosterLayersDuo, posterCollapse, renderStill } from '../../src/ascii/ssr.ts';
import { REGISTERED, getScene, hasScene, loadScene } from '../../src/ascii/scenes/index.ts';
import { cover, createCover } from '../../src/ascii/scenes/cover.ts';
import { hola } from '../../src/ascii/scenes/hola.ts';
import { mistScene } from '../../src/ascii/scenes/mist.ts';
import { DUO_RAMP, LEVELS, RAMP_CHARS } from '../../src/ascii/scenes/ramp.ts';
import { INK_PERMILLE } from '../../src/ascii/scenes/ink.gen.ts';
import { GLYPH_INK, LEVEL_INK, inkOf } from '../../src/ascii/scenes/ink.ts';
import { bakeShadow } from '../../src/ascii/scenes/duo.ts';
import { compose, tideParams, tideYb } from '../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../src/ascii/wells.ts';
import { getWords } from '../../src/ascii/words.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../src/ascii');
const GOLDEN = resolve(HERE, 'golden.json');
const CLI = resolve(HERE, 'fixtures/scene-hash-cli.mjs');
const BASE_LIGHT = JSON.parse(readFileSync(resolve(HERE, 'fixtures/base-solid-light.json'), 'utf8'));

await ensureWords('es');
await ensureWords('en');

const SCENES = { cover, hola, mist: mistScene };
const ALL_VPS = ['d1440', 'd1600', 'd1920', 't1024', 'm360', 'm390', 'm320'];
const LANGS = ['es', 'en'];
/** Topes de la adopción del estilo Duotono (más estrictos que los de §5.4 para T≥9, T≥11 y T≥14): literal Y efectivo. */
const CAPS = { t9: 11, t11: 3.5, t13: 1.5, t14: 0.4 };
const CAP_NONEMPTY = { cover: 60, hola: 55, mist: 30 };

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
/** Líneas colocadas por la escena (la misma cuenta que `build`). */
const placed = (id, spec, lang) => {
  const mobile = spec.cols < 90;
  return layoutLines(spec, wordsFor(id, lang, spec)[0], mobile || spec.rows < 44 ? 3 : 4, mobile ? 2 : 1);
};
/** Máscara de celdas de la H de HOLA (columnas de la primera letra de la línea 0): no cuentan para la cara ni las carreras planas. */
function hMask(spec, lang) {
  const ls = placed('hola', spec, lang);
  const skip = new Uint8Array(spec.cols * spec.rows);
  const w = ls[0].word;
  const hc = firstLetterCols(w);
  for (let y = 0; y < w.rows; y++) for (let x = 0; x < hc; x++) skip[(ls[0].y0 + y) * spec.cols + ls[0].x0 + x] = 1;
  return { skip, hc, ls };
}

// ---------- la rampa medida ----------

test('rampa: diez peldaños, cuatro glifos cada uno, todos permitidos y de fuente; la tinta MEDIDA crece peldaño a peldaño; `~` y `^` no están (son de las olas y la espuma)', () => {
  assert.equal(RAMP_CHARS.length, LEVELS);
  assert.equal(DUO_RAMP.length, LEVELS * 4);
  for (let l = 0; l < LEVELS; l++) {
    assert.equal(RAMP_CHARS[l].length, 4, `peldaño ${l}`);
    for (const c of RAMP_CHARS[l]) {
      assert.ok(ALLOWED_ART_CHARS.has(c), `«${c}» fuera de ALLOWED_ART_CHARS`);
      assert.ok(glyphIndex(c) >= 0 && glyphIndex(c) <= 96, `«${c}» no es un glifo de fuente`);
      assert.ok(c === ' ' || INK_PERMILLE.some(([k]) => k === c), `«${c}» sin tinta medida`);
      assert.ok(c !== '~' && c !== '^', `«${c}» está reservado al menisco, las crestas y la espuma`);
    }
  }
  for (let l = 2; l < LEVELS; l++) assert.ok(LEVEL_INK[l] > LEVEL_INK[l - 1] + 15, `la tinta no sube en el peldaño ${l}: ${LEVEL_INK[l - 1]} → ${LEVEL_INK[l]}`);
  assert.equal(LEVEL_INK[0], 0);
  const gaps = LEVEL_INK.slice(1).map((v, i) => v - LEVEL_INK[i]);
  assert.ok(Math.max(...gaps) < 65, `hueco de tinta máximo ${Math.max(...gaps) / 10} puntos (la rampa de 10 clásica tiene 12,6)`);
  assert.ok(inkOf('@') > inkOf('#') && inkOf('#') > inkOf('*') && inkOf('*') > inkOf('+') && inkOf('+') > inkOf('=') && inkOf('=') > inkOf(':') && inkOf(':') > inkOf('.'), 'orden medido de los símbolos de la rampa');
  assert.ok(GLYPH_INK[glyphIndex('█')] === 1 && GLYPH_INK[glyphIndex('▘')] === 0.25 && GLYPH_INK[glyphIndex('░')] === 0.25, 'cobertura geométrica de bloques y sombras');
});

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

test('§6.3 · reglas de escena en los 7 visores y los 2 idiomas: determinista, toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos (con bg)', () => {
  for (const id of ['cover', 'hola', 'mist']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const spec = specOf(VIEWPORTS[vp]);
        const bad = checkSceneRules(SCENES[id], spec, wordsFor(id, lang, spec), { noBg: false, lang });
        assert.deepEqual(bad, [], `${id} ${lang} ${vp}: ${bad.join(' | ')}`);
      }
    }
  }
});

test('las tres escenas usan `bg` (el estilo Duotono: glifo claro sobre fondo más oscuro); la portada ya no es «sin bg»: su póster pasa por posterCollapse', () => {
  for (const id of ['cover', 'hola', 'mist']) assert.ok(countExplicitBg(still(SCENES[id], 'd1440', 'es').g) > 0, id);
});

// ---------- §5.4: presupuesto de tono ----------

test('§5.4 · presupuesto de tono LITERAL y EFECTIVO del still: T≥9 ≤ 11 · T≥11 ≤ 3,5 · T≥13 ≤ 1,5 · T≥14 ≤ 0,4 % · no vacías ≤ 60 / 55 / 30 % en los 7 visores × 2 idiomas', () => {
  const rows = [];
  for (const id of ['cover', 'hola', 'mist']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, spec } = still(SCENES[id], vp, lang);
        const tag = `${id} ${lang} ${vp} ${spec.cols}×${spec.rows}`;
        const l = toneBudget(g);
        const e = effectiveBudget(g);
        rows.push(`${tag}: literal T9 ${l.t9.toFixed(1)} T11 ${l.t11.toFixed(2)} T13 ${l.t13.toFixed(2)} T14 ${l.t14.toFixed(2)} · efectivo T9 ${e.t9.toFixed(1)} T11 ${e.t11.toFixed(2)} no vacías ${l.nonEmpty.toFixed(1)}`);
        assert.deepEqual(checkToneBudget(g, { caps: CAPS, maxNonEmpty: CAP_NONEMPTY[id] }), [], tag);
      }
    }
  }
  if (process.env.SCENES_VERBOSE) console.log(rows.join('\n'));
});

test('§5.4 · el primer plano de las paredes y de las caras no pasa de T8 salvo los peldaños ≥ 7 de las cáusticas (T10) y la luz de borde: lo mide el tono de cada glifo de ramp en la cara', () => {
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const { g, st } = still(cover, vp, lang);
      for (let i = 0; i < st.cls.length; i++) {
        if (st.cls[i] !== 1) continue;
        const gl = g.b[i * 4];
        const ch = GLYPHS[gl];
        if (gl === 0 || gl > 96 || ch === '~' || g.b[i * 4 + 2] === 8 && ch === '=' || ch === '/') continue; // el menisco (`~ =` sobre T8) y el reflejo `/` no son agua
        const lv = LEVEL_INK.findIndex((v) => v > inkOf(ch) * 0.999 && v < inkOf(ch) * 1.001);
        const heavy = inkOf(ch) >= 180; // x X # % @ (peldaños ≥ 6)
        const cap = heavy ? 10 : 9;
        assert.ok(g.b[i * 4 + 1] <= cap, `${lang} ${vp} (${i % g.cols},${(i / g.cols) | 0}): «${ch}» T${g.b[i * 4 + 1]} (peldaño ${lv})`);
      }
    }
  }
});

test('§5.4 · el primer plano de los caracteres de pared nunca pasa de T8 (la luz de la pared vive en su fondo): en todas las celdas llenas del aro (cls 2) con carácter de la rampa', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, st, spec } = still(SCENES[id], vp, lang);
        const ls = placed(id, spec, lang);
        let walls = 0;
        for (const l of ls) {
          for (let y = 0; y < l.word.rows; y++) for (let x = 0; x < l.word.cols; x++) {
            if (l.word.cells[y * l.word.cols + x] !== 15) continue;
            const i = (l.y0 + y) * spec.cols + l.x0 + x;
            if (st.cls[i] !== 2 || (id === 'hola' && !hMask(spec, lang).skip[i])) continue; // en «OLA» la pared son las olas (la cresta lleva su propia luz)
            const gl = g.b[i * 4];
            if (gl === 0 || gl > 96) continue;
            walls++;
            assert.ok(g.b[i * 4 + 1] <= 8, `${id} ${lang} ${vp}: pared con «${GLYPHS[gl]}» T${g.b[i * 4 + 1]} en (${i % spec.cols},${(i / spec.cols) | 0})`);
          }
        }
        if (id === 'cover') assert.ok(walls > 30, `${vp}: solo ${walls} celdas de pared con carácter`);
      }
    }
  }
});

test('mist: densidad ≤ 30 % de celdas con glifo también con energía de scroll y a cualquier fase del agua (en vivo no hay still que la mida)', () => {
  for (const vp of ['d1440', 'd1600', 'd1920', 'm360']) {
    for (const [t, e] of [[STILL_T, 0], [3.3, 1], [40, 1], [12, 0.5], [77.7, 1]]) {
      const { g, spec } = paint(mistScene, vp, 'es', makeFrame(1, t, e, false));
      const n = (100 * count(g, (gl) => gl !== 0)) / (spec.cols * spec.rows);
      assert.ok(n <= 30, `mist ${vp} t=${t} e=${e}: ${n.toFixed(1)} %`);
      assert.ok(n >= 10, `mist ${vp}: demasiado vacía (${n.toFixed(1)} %)`);
    }
  }
});

// ---------- correcciones de arte de los jueces ----------

test('(c) luz: la luz media efectiva de cover y hola queda a menos de 5 % por debajo de la base de bloques sólidos (fixtures/base-solid-light.json) en los 7 visores × 2 idiomas', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const base = BASE_LIGHT[`${id}/${lang}/${vp}`];
        const e = effectiveBudget(still(SCENES[id], vp, lang).g);
        assert.ok(e.mean >= 0.95 * base.mean, `${id} ${lang} ${vp}: luz ${e.mean.toFixed(4)} = ${((100 * e.mean) / base.mean).toFixed(1)} % de la base (${base.mean})`);
      }
    }
  }
});

test('(a) la cara de GAYA: ≥ 60 % de las celdas llevan un glifo de la rampa y ninguna carrera horizontal de 3 o más celdas del trazo con el mismo fondo y sin glifo', () => {
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const { g, st } = still(cover, vp, lang);
      const m = artMetrics(g, st);
      assert.ok(m.faceCells > 50, `${vp}: ${m.faceCells} celdas de cara`);
      assert.ok(m.faceGlyphRatio >= 0.6, `${lang} ${vp}: cara con glifo de rampa ${(100 * m.faceGlyphRatio).toFixed(0)} %`);
      assert.equal(m.flatRuns, 0, `${lang} ${vp}: ${m.flatRuns} carreras planas (${m.flatAt.join(' ')})`);
    }
  }
});

test('(b) sin papel pintado: a una celda del trazo ≤ 45 % de celdas con glifo y a ocho ≤ 15 %; fuera del halo ≤ 30 %; bajo la palabra y su halo, limpio (≤ 1 %); sin `~` ni `^` en la bruma', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, st, spec } = still(SCENES[id], vp, lang);
        const m = artMetrics(g, st);
        const tag = `${id} ${lang} ${vp}`;
        assert.ok(m.d1 <= 0.45, `${tag}: a 1 celda del trazo ${(100 * m.d1).toFixed(0)} % con glifo`);
        assert.ok(m.d8 <= 0.15, `${tag}: a 8 celdas ${(100 * m.d8).toFixed(0)} %`);
        assert.ok(m.outsideHalo <= 0.3, `${tag}: fuera del halo ${(100 * m.outsideHalo).toFixed(0)} %`);
        const below = belowWord(g, st);
        assert.ok(below.ratio <= 0.01, `${tag}: bajo la palabra ${(100 * below.ratio).toFixed(2)} % (${below.rows} filas)`);
        // `~` y `^` solo en el menisco, la cresta y la espuma: es decir, dentro del trazo; nunca en la atmósfera (bruma, aura, sombra)
        const tilde = new Set([glyphIndex('~'), glyphIndex('^')]);
        for (let i = 0; i < st.cls.length; i++) if (st.cls[i] !== 1 && st.cls[i] !== 2) assert.ok(!tilde.has(g.b[i * 4]), `${tag}: «${GLYPHS[g.b[i * 4]]}» fuera del trazo en (${i % spec.cols},${(i / spec.cols) | 0})`);
      }
    }
  }
  for (const vp of ALL_VPS) {
    const { g } = still(mistScene, vp, 'es');
    for (let i = 0; i < g.b.length; i += 4) assert.ok(g.b[i] !== glyphIndex('~') && g.b[i] !== glyphIndex('^'), `mist ${vp}: «${GLYPHS[g.b[i]]}»`);
  }
});

test('(e) sombra proyectada: desplazamiento de UNA celda en diagonal, tono T1–T2 (ni un negro T0 ni una escalera de bloques), solo sobre celdas vacías', () => {
  for (const id of ['cover', 'hola']) {
    for (const vp of ALL_VPS) {
      const { g, st, spec } = still(SCENES[id], vp, 'es');
      const mask = strokeMask(st.cls);
      const lines = placed(id, spec, 'es');
      const sh = bakeShadow(spec.cols, spec.rows, lines);
      assert.ok(sh.pos.length > 30, `${id} ${vp}: ${sh.pos.length} celdas de sombra`);
      for (let n = 0; n < sh.pos.length; n++) {
        const x = sh.pos[n] & 0xffff;
        const y = sh.pos[n] >> 16;
        const i = y * spec.cols + x;
        assert.equal(mask[i], 0, `${id} ${vp}: sombra sobre el trazo en (${x},${y})`);
        assert.ok(mask[(y - 1) * spec.cols + x - 1] === 1, `${id} ${vp}: la sombra de (${x},${y}) no sale de una celda con tinta a (−1, −1)`);
        assert.ok(g.b[i * 4 + 1] <= 2 && g.b[i * 4 + 2] >= 1 && g.b[i * 4 + 2] <= 2, `${id} ${vp}: tono de sombra ${g.b[i * 4 + 1]}/${g.b[i * 4 + 2]} en (${x},${y})`);
      }
    }
  }
});

test('(f) HOLA: el cuerpo de «OLA» tiene ≥ 50 % de celdas con glifo de la rampa, la cresta `~` es continua (una celda por columna enlazada con la de al lado) y no hay carreras planas en las olas; la H es masa sólida con un grano de caracteres', () => {
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const { g, st, spec } = still(hola, vp, lang);
      const { skip, hc, ls } = hMask(spec, lang);
      const w = waveMetrics(g, ls, hc);
      const tag = `${lang} ${vp}`;
      assert.ok(w.body > 150, `${tag}: cuerpo de ${w.body} celdas`);
      assert.ok(w.rampRatio >= 0.5, `${tag}: ${(100 * w.rampRatio).toFixed(0)} % del cuerpo con glifo de rampa`);
      assert.ok(w.crestRatio >= 0.08, `${tag}: cresta ${(100 * w.crestRatio).toFixed(0)} % del cuerpo`);
      assert.ok(w.crestLinked >= 0.95, `${tag}: cresta continua en el ${(100 * w.crestLinked).toFixed(0)} % de los pares de columnas`);
      const m = artMetrics(g, st, { skip });
      assert.equal(m.flatRuns, 0, `${tag}: ${m.flatRuns} carreras planas en las olas (${m.flatAt.join(' ')})`);
      // la H: masa sólida (bloques `█` con fondo del agua) y un grano de caracteres
      const full = glyphIndex('█');
      let hSolid = 0;
      let hGrain = 0;
      for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
        const i = y * spec.cols + x;
        if (!skip[i] || st.cls[i] !== 1) continue;
        if (g.b[i * 4] === full) hSolid++;
        else if (g.b[i * 4] >= 1 && g.b[i * 4] <= 96) hGrain++;
      }
      assert.ok(hSolid > 4 && hGrain > 3, `${tag}: la H tiene ${hSolid} celdas de masa y ${hGrain} de grano`);
    }
  }
});

test('el aro es la silueta limpia: cada celda parcial de la palabra lleva su cuadrante y las paredes de bloque son masa con caracteres (nunca un cuadrante con carácter)', () => {
  for (const id of ['cover', 'hola']) {
    const { g, st, spec } = still(SCENES[id], 'd1440', 'es');
    const quads = new Set('▘▝▖▗▀▄▌▐▚▞▙▛▜▟'.split('').map(glyphIndex));
    let skin = 0;
    for (const l of placed(id, spec, 'es')) {
      for (let y = 0; y < l.word.rows; y++) for (let x = 0; x < l.word.cols; x++) {
        const m = l.word.cells[y * l.word.cols + x];
        if (m === 0 || m === 15) continue;
        const gl = getGlyph(g, l.x0 + x, l.y0 + y);
        if (st.cls[(l.y0 + y) * spec.cols + l.x0 + x] === 2 && quads.has(gl)) skin++;
      }
    }
    assert.ok(skin > 150, `${id}: ${skin} celdas de piel con cuadrante`);
  }
});

// ---------- composición (§5.3, §4.4) ----------

test('composición: la palabra cabe con margen en todos los visores y deja sitio al texto (filas 26–45 en 160×50)', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const { g, st, spec } = still(SCENES[id], vp, lang);
        let x0 = 1e9;
        let x1 = -1;
        let y0 = 1e9;
        let y1 = -1;
        for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
          const i = y * spec.cols + x;
          if ((st.cls[i] === 1 || st.cls[i] === 2) && g.b[i * 4]) {
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

test('cover · anatomía del fotograma final (§5.5): bruma de caracteres que sale de la palabra, aro de luz, vidrio con agua, menisco de `~` y `=`, cáusticas, sombra, aura y destellos', () => {
  const { g, st } = still(cover, 'd1440', 'es');
  const tones = new Array(16).fill(0);
  const glyphs = {};
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    tones[g.b[i + 1]]++;
    glyphs[g.b[i]] = (glyphs[g.b[i]] ?? 0) + 1;
  }
  const n = (...cs) => cs.reduce((a, c) => a + (glyphs[glyphIndex(c)] ?? 0), 0);
  assert.ok(tones[11] + tones[12] + tones[13] >= 40, `luz de borde y menisco T11–T13: ${tones[11] + tones[12] + tones[13]}`);
  assert.ok(tones[15] >= 3 && tones[15] <= 6, `3–6 chispas T15 (§7.1): ${tones[15]}`);
  assert.ok(n('.', '·', ':', "'", '-') > 300, 'polvo y puntos de la bruma y del agua');
  assert.ok(n('+', '=', ';', '"') > 300, 'texto medio `+ = ; "`');
  assert.ok(n('x', 'X', '#', '%', '@', '*') > 40, 'filamentos de las cáusticas `x * X # % @`');
  assert.ok(n('~') >= 10 && n('/') >= 2, 'menisco de `~` y el reflejo de `/`');
  assert.equal(n('░', '▒', '▓'), 0, 'ya no hay tramas: todo el agua y la bruma son caracteres');
  const hist = [0, 0, 0, 0];
  for (const c of st.cls) hist[c]++;
  assert.ok(hist.every((k) => k > 0), `cls ${hist}`);
  assert.equal(hist.reduce((a, b) => a + b, 0), g.cols * g.rows);
});

test('cover · el menisco es una línea continua y no deja muescas: en cada letra, una fila de `~` y `=` T12–T13 sobre T8, y por encima solo vidrio de puntos', () => {
  for (const vp of ['d1440', 'd1600', 'm360', 'm320']) {
    const { g, st, spec } = still(cover, vp, 'es');
    let surface = 0;
    for (let i = 0; i < st.cls.length; i++) {
      if (st.cls[i] !== 1) continue;
      const gl = g.b[i * 4];
      if (g.b[i * 4 + 1] >= 11 && g.b[i * 4 + 2] === 8) {
        assert.ok(gl === glyphIndex('~') || gl === glyphIndex('='), `${vp}: el menisco lleva «${GLYPHS[gl]}»`);
        surface++;
      }
    }
    assert.ok(surface >= 3, `${vp}: ${surface} celdas de menisco`);
    void spec;
  }
});

test('cover · guion de la ignición: bruma → aro y aura (barrido) → nivel del agua → cáusticas → sombra y chispas, todo monótono en p', () => {
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
  for (let i = 1; i < steps.length; i++) assert.ok(inked[i] >= inked[i - 1] * 0.97, `luz T≥8 decrece en p=${steps[i]}: ${inked}`);
  assert.ok(inked[3] > 0 && inked[3] < inked[9] * 0.8, `el aro se traza poco a poco (p = 0,15: ${inked[3]} de ${inked[9]})`);
  const faceCount = (p, pred) => {
    const g = frame(p);
    let n = 0;
    for (let i = 0; i < st.cls.length; i++) if (st.cls[i] === 1 && pred(g.b[i * 4], g.b[i * 4 + 1], g.b[i * 4 + 2])) n++;
    return n;
  };
  const water = (p) => faceCount(p, (gl, fg, bg) => bg >= 4 && gl !== 0);
  assert.ok(water(0.6) > water(0.2) && water(1) >= water(0.6), 'el agua llena las letras');
  const mistN = (p) => count(frame(p), (gl, t) => gl !== 0 && t <= 6);
  assert.ok(mistN(0.03) < mistN(0.06) && mistN(0.06) < mistN(0.12), 'la bruma se abre con p');
  const sparks = (p) => count(frame(p), (gl, t) => t === 15);
  assert.equal(sparks(0.5), 0);
  assert.ok(sparks(1) >= 3 && sparks(0.8) <= sparks(1));
  const a = frame(0.12);
  const b = cover.build(spec, 'es', wordsFor('cover', 'es', spec));
  const g2 = makeCells(spec.cols, spec.rows);
  cover.paint(g2, b, makeFrame(0.12, STILL_T, 0, false));
  assert.notEqual(hashCells(a), hashCells(g2), 'con still: false la cabeza del barrido brilla (+3 tonos)');
});

test('cover · el nivel de reposo es 0,78 de la cara y se puede cambiar (?level=): más nivel, más agua y menos vidrio', () => {
  const f = (level) => still(createCover({ level }), 'd1440', 'es').g;
  const glass = (g) => count(g, (gl, fg, bg) => bg === 3 && fg === 6);
  assert.ok(glass(f(0.6)) > glass(f(0.9)));
  assert.equal(hashCells(f(0.78)), hashCells(still(cover, 'd1440', 'es').g), 'el predeterminado es 0,78');
});

// ---------- hola ----------

test('hola · guion de llegada (p): las olas ganan amplitud de 0 a 1 entre p = 0,3 y 1; la sombra aparece al final de la llegada', () => {
  const spec = specOf(VIEWPORTS.d1440);
  const st = hola.build(spec, 'es', wordsFor('hola', 'es', spec));
  const at = (p) => {
    const g = makeCells(spec.cols, spec.rows);
    hola.paint(g, st, makeFrame(p, STILL_T, 0, false));
    return g;
  };
  // rugosidad vertical de las rayas: diferencia de fondo de la misma fila entre columnas lejanas dentro de «OLA» (x ≈ 62..130)
  const rough = (g) => {
    let d = 0;
    let n = 0;
    for (let y = 6; y < 20; y++) for (let x = 62; x < 130; x += 6) {
      const a = g.b[(y * spec.cols + x) * 4 + 2];
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
  const sh = (g) => count(g, (gl, t, bg) => t <= 2 && bg >= 1 && bg <= 2 && gl <= 96);
  assert.ok(sh(at(1)) > sh(at(0.5)) + 80, 'la sombra proyectada aparece con el final de la llegada');
});

test('hola · calor y anillos: la H brilla, las olas cambian de amplitud y fase; solo el calor y los anillos cambian el cuadro', () => {
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
  let changed = 0;
  for (let y = 4; y < 20; y++) for (let x = 0; x < 28; x++) {
    const k = (y * spec.cols + x) << 2;
    if (hot.b[k + 1] !== base.b[k + 1] || hot.b[k + 2] !== base.b[k + 2] || hot.b[k] !== base.b[k]) changed++;
  }
  assert.ok(changed > 40, `H bajo el calor: ${changed} celdas cambian`);
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

test('cover · calor: la linterna sube tonos (vidrio vacío, aro, agua con cáusticas ×3 y bruma), casi nunca los baja, y no cambia los glifos del aro', () => {
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
  assert.ok(lowered <= 0.05 * brighter, `el calor casi no apaga nada (${lowered} celdas más oscuras de ${brighter} más claras)`);
  const none = makeCells(spec.cols, spec.rows);
  cover.paint(none, st, makeFrame(1, STILL_T, 0, false));
  assert.equal(hashCells(none), hashCells(base), 'sin calor el cartel está completo (= still)');
});

// ---------- §5.8: pozos de lectura ----------

const hexLum = (h) => {
  const n = parseInt(h.slice(1), 16);
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const INK_LUM = hexLum('#edf2f8');
const MUTED_LUM = hexLum('#a4b6ce');
const RECTS = [
  { x: 8, y: 26, w: 92, h: 11, kind: 'ink' },
  { x: 8, y: 37, w: 70, h: 4, kind: 'muted' },
  { x: 8, y: 42, w: 50, h: 4, kind: 'ink' },
];
const CAPS_WELL = { ink: 6, muted: 4 };

test('§5.8 · bajo los pozos (h1, lead, botones) el motor topa fg y bg a T6 / T4 y el peor píxel (fondo o glifo) deja ≥ 7 (ink) y ≥ 6 (muted) de contraste; la bruma deja solo puntos y dos puntos ahí', () => {
  for (const vp of ['d1440', 'd1920', 'm360']) {
    const spec = specOf(VIEWPORTS[vp]);
    const rects = vp === 'm360' ? [{ x: 4, y: 36, w: 52, h: 14, kind: 'ink' }, { x: 4, y: 51, w: 46, h: 6, kind: 'muted' }] : RECTS;
    for (const id of ['cover', 'hola', 'mist']) {
      const st = SCENES[id].build(spec, 'es', wordsFor(id, 'es', spec));
      const cap = buildCap(makeCap(spec.cols, spec.rows), spec.cols, spec.rows, rects, {});
      const g = makeCells(spec.cols, spec.rows);
      const f = makeFrame(1, STILL_T, 0, true);
      f.cap = cap;
      SCENES[id].paint(g, st, f);
      const calm = makeCells(spec.cols, spec.rows);
      calm.b.set(g.b);
      applyCap(g, cap);
      let worstInk = Infinity;
      let worstMuted = Infinity;
      let busy = 0;
      for (const r of rects) {
        const c = CAPS_WELL[r.kind];
        for (let y = Math.max(0, Math.floor(r.y)); y < Math.min(spec.rows, Math.ceil(r.y + r.h)); y++) {
          for (let x = Math.floor(r.x); x < Math.min(spec.cols, Math.ceil(r.x + r.w)); x++) {
            const i = (y * spec.cols + x) << 2;
            assert.ok(g.b[i + 1] <= c && g.b[i + 2] <= c, `${id} ${vp} (${x},${y}): tono ${g.b[i + 1]}/${g.b[i + 2]} > T${c}`);
            const worst = Math.max(TONE_LUM[g.b[i + 1]], TONE_LUM[g.b[i + 2]]);
            if (r.kind === 'ink') worstInk = Math.min(worstInk, contrast(INK_LUM, worst));
            else worstMuted = Math.min(worstMuted, contrast(MUTED_LUM, worst));
            // calma: la propia escena (antes del tope del motor) no pone cruces ni almohadillas bajo el texto
            const gl = calm.b[i];
            const ink = gl > 0 && gl <= 96 ? inkOf(GLYPHS[gl]) : 0;
            if (ink > (r.kind === 'ink' ? 14 : 8) * 10) busy++;
          }
        }
      }
      assert.ok(worstInk >= 7, `${id} ${vp}: contraste ink ${worstInk.toFixed(2)}`);
      assert.ok(worstMuted >= 6 || worstMuted === Infinity, `${id} ${vp}: contraste muted ${worstMuted.toFixed(2)}`);
      assert.ok(busy === 0, `${id} ${vp}: ${busy} celdas con glifo denso bajo el texto`);
    }
  }
});

// ---------- marea de caracteres ----------

test('marea (compose) con las escenas oficiales: fuera del frente deja el saliente y el entrante intactos, determinista, la banda es duotono sin `x X #` y no pasa de T12', () => {
  for (const vp of ['d1440', 'm390']) {
    const a = still(cover, vp, 'es');
    const b = still(hola, vp, 'es');
    const tp = tideParams(VIEWPORTS[vp].cssCw < 9);
    for (const k of [0.15, 0.28, 0.52, 0.76, 0.95]) {
      const o1 = makeCells(a.spec.cols, a.spec.rows);
      const o2 = makeCells(a.spec.cols, a.spec.rows);
      const opts = { band: tp.band, reach: tp.reach, t: STILL_T };
      compose(o1, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * k, opts);
      compose(o2, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * k, opts);
      assert.equal(hashCells(o1), hashCells(o2), `${vp} ${k}: no determinista`);
      let bandCells = 0;
      let duo = 0;
      for (let i = 0; i < o1.b.length; i += 4) {
        assert.ok(o1.b[i] < GLYPHS.length && o1.b[i + 1] <= 15 && o1.b[i + 2] <= 15);
        const changed = (o1.b[i] !== a.g.b[i] || o1.b[i + 1] !== a.g.b[i + 1] || o1.b[i + 2] !== a.g.b[i + 2]) && (o1.b[i] !== b.g.b[i] || o1.b[i + 1] !== b.g.b[i + 1] || o1.b[i + 2] !== b.g.b[i + 2]);
        if (changed) {
          bandCells++;
          assert.ok(o1.b[i + 1] <= 12, `${vp} ${k}: tono ${o1.b[i + 1]} en la marea (máximo T12)`);
          if (o1.b[i + 3] === 3 && o1.b[i + 2] > 0 && o1.b[i] < 97) duo++;
        }
      }
      assert.ok(bandCells > 100 && duo > 100, `${vp} ${k}: banda de ${bandCells} celdas (${duo} duotono)`);
    }
    const top = makeCells(a.spec.cols, a.spec.rows);
    compose(top, a.g, b.g, a.st.cls, b.st.cls, tideYb(0, a.spec.rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t: STILL_T });
    assert.equal(hashCells(top), hashCells(a.g), `${vp}: con el frente abajo del todo se ve el saliente tal cual`);
  }
});

test('marea: en la banda, `x X * # % @` son de la espuma y ocupan menos del 10 % de las celdas de la banda; la espuma `*` y `~` solo a ±1 fila del frente', () => {
  const a = still(cover, 'd1440', 'es');
  const b = still(hola, 'd1440', 'es');
  const tp = tideParams(false);
  const heavy = new Set('xX#%@'.split('').map(glyphIndex));
  let band = 0;
  let h = 0;
  for (const k of [0.3, 0.5, 0.7]) {
    const o = makeCells(a.spec.cols, a.spec.rows);
    compose(o, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * k, { band: tp.band, reach: tp.reach, t: STILL_T });
    for (let i = 0; i < o.b.length; i += 4) {
      if (o.b[i + 3] !== 3 || o.b[i + 2] === 0) continue;
      band++;
      if (heavy.has(o.b[i])) h++;
    }
  }
  assert.ok(band > 500);
  assert.ok(h / band < 0.1, `${h} de ${band} celdas con x X # % @`);
});

// ---------- póster SSR ----------

const quant = (tone) => (tone === 0 ? -1 : tone <= 5 ? 0 : tone <= 9 ? 1 : tone <= 12 ? 2 : 3);
function collapsed(vp, lang) {
  const spec = specOf(VIEWPORTS[vp]);
  const words = wordsFor('cover', lang, spec);
  const g = renderStill(cover, spec, lang, words);
  const c = makeCells(spec.cols, spec.rows);
  c.b.set(g.b);
  posterCollapse(c);
  return { g, c, spec, words };
}

test('§6.9 · póster SSR sin JS: la escena con bg no sirve para renderPosterLayers tal cual (las paredes desaparecen); `posterCollapse` lo arregla con las mismas 4 capas', () => {
  for (const vp of ['d1440', 't1024', 'm390']) {
    const { g, c, spec, words } = collapsed(vp, 'es');
    const naive = toLayers(g);
    assert.equal(countExplicitBg(c), 0, 'el colapso deja la rejilla sin bg');
    const L = renderPosterLayersDuo(cover, spec, 'es', words);
    assert.deepEqual(L, toLayers(c));
    assert.deepEqual(Object.keys(L), ['dim', 'mid', 'hot', 'spark'], 'mismas 4 capas de siempre');
    const mass = (s) => (s.match(/[█▌▐▀▄▙▛▜▟▞▚▖▗▘▝]/g) ?? []).length;
    const massAll = (l) => mass(l.dim) + mass(l.mid) + mass(l.hot) + mass(l.spark);
    assert.ok(massAll(L) > 1.5 * massAll(naive), `${vp}: el colapso no recupera la masa (${massAll(L)} vs ${massAll(naive)} celdas de bloque)`);
    for (const k of ['dim', 'mid', 'hot', 'spark']) for (const ch of L[k]) assert.ok(ch === '\n' || ch === ' ' || ALLOWED_ART_CHARS.has(ch), `«${ch}» no permitido en el póster`);
    // la versión sin colapso (la que usan las escenas sin bg) sigue existiendo y es otra cosa
    assert.notDeepEqual(renderPosterLayers(cover, spec, 'es', words), L);
  }
});

test('T6 · paridad del póster (wide 160×50, mid 113×44, stack 65×70 × ES/EN): capa y glifo 100 % iguales a la cuantización del motor COLAPSADO, sin bg; el colapso solo mira glifo y fondo de cada celda', () => {
  for (const lang of LANGS) {
    for (const vp of ['d1440', 't1024', 'm390']) {
      const { g, c, spec, words } = collapsed(vp, lang);
      const L = renderPosterLayersDuo(cover, spec, lang, words);
      const rows = Object.values(L).map((s) => s.split('\n').map((l) => [...l]));
      let visible = 0;
      let same = 0;
      for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
        const i = (y * spec.cols + x) * 4;
        const gl = c.b[i];
        const layer = gl === 0 ? -1 : quant(c.b[i + 1]);
        const chars = rows.map((r) => r[y]?.[x] ?? ' ');
        const who = chars.map((ch, k) => (ch !== ' ' ? k : -1)).filter((k) => k >= 0);
        if (layer === -1) assert.deepEqual(who, [], `${lang} ${vp}: celda invisible (${x},${y}) presente en ${who}`);
        else {
          visible++;
          assert.deepEqual(who, [layer], `${lang} ${vp}: (${x},${y}) capa ${who} ≠ ${layer}`);
          if (chars[layer] === GLYPHS[gl]) same++;
        }
        // regla de colapso, celda a celda: fondo claro con poco carácter → bloque del tono del fondo; carácter denso o fondo oscuro → conserva el glifo
        const og = g.b[i];
        const bg = g.b[i + 2];
        if (bg >= 4 && og < 97 && GLYPH_INK[og] < 0.14) assert.equal(gl, glyphIndex('█'), `${lang} ${vp}: (${x},${y}) debía pasar a masa`);
        else if (bg < 4 || og >= 97 || GLYPH_INK[og] >= 0.14) assert.equal(gl, og, `${lang} ${vp}: (${x},${y}) debía conservar su glifo`);
      }
      assert.equal(same, visible, `${lang} ${vp}: paridad de glifo ${same}/${visible}`);
      assert.ok(visible > 800, `${lang} ${vp}: póster casi vacío (${visible})`);
      assert.equal(countExplicitBg(c), 0);
    }
  }
});

test('póster SSR: la capa «wide» de la portada pesa ≤ 3 KB gz y las tres variantes caben en el presupuesto de HTML (≤ 5,5 KB gz las tres, por idioma)', () => {
  for (const lang of LANGS) {
    let all = '';
    const sizes = {};
    for (const [key, vp] of [['wide', 'd1440'], ['mid', 't1024'], ['stack', 'm390']]) {
      const { spec, words } = collapsed(vp, lang);
      const L = renderPosterLayersDuo(cover, spec, lang, words);
      const html = Object.entries(L).map(([n, s]) => `<span class="art poster-ssr__l poster-ssr__l--${n}" aria-hidden="true" translate="no" data-art="${s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}"></span>`).join('');
      all += html;
      sizes[key] = gzipSync(Buffer.from(html), { level: 9 }).length;
    }
    assert.ok(sizes.wide <= 3 * 1024, `${lang}: wide ${sizes.wide} B gz`);
    assert.ok(gzipSync(Buffer.from(all), { level: 9 }).length <= 5.5 * 1024, `${lang}: las tres variantes ${gzipSync(Buffer.from(all), { level: 9 }).length} B gz`);
  }
});

// ---------- pureza del código, asignaciones y coste ----------

const SCENE_FILES = ['scenes/cover.ts', 'scenes/hola.ts', 'scenes/mist.ts', 'scenes/duo.ts', 'scenes/ramp.ts', 'scenes/index.ts', 'scenes/_template.ts'];
const code = (file) =>
  readFileSync(resolve(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('código de las escenas: sin Math.random, reloj ni DOM; sin Math.sin/cos/pow/exp (ruta still solo enteros y polinomios); sintaxis borrable; imports con .ts; sin texto visible', () => {
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
    for (const m of code(f).matchAll(/"([^"\n]+)"/g)) assert.doesNotMatch(m[1], /[A-Za-zÁ-ú]{2,} [A-Za-zÁ-ú]{2,}/, `${f}: «${m[1]}» parece texto visible`);
  }
});

test('sin asignaciones por cuadro: paint de cover, hola y mist (con calor, anillos y pozos) y compose no construyen arreglos tipados, buffers, Map ni Set', () => {
  const NAMES = ['Uint8Array', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'Map', 'Set'];
  const counts = Object.fromEntries(NAMES.map((n) => [n, 0]));
  const originals = {};
  const spec = specOf(VIEWPORTS.d1440);
  const cap = new Uint8Array(spec.cols * spec.rows).fill(15);
  const prep = Object.values(SCENES).map((sc) => {
    const st = sc.build(spec, 'es', wordsFor(sc.id, 'es', spec));
    const g = makeCells(spec.cols, spec.rows);
    const f = makeFrame(1, STILL_T, 0.3);
    f.heat = new Float32Array(spec.cols * spec.rows).fill(0.3);
    f.rings = [{ x: 40, y: 12, age: 0.3 }];
    f.cap = cap;
    return { sc, st, g, f };
  });
  const out = makeCells(spec.cols, spec.rows);
  const mem = new Uint8Array(spec.cols * spec.rows);
  const tp = tideParams(false);
  const frame = (n) => {
    for (const { sc, st, g, f } of prep) {
      f.t = STILL_T + n * 0.033;
      f.p = 0.2 + 0.8 * ((n % 42) / 41);
      sc.paint(g, st, f);
    }
    compose(out, prep[0].g, prep[1].g, prep[0].st.cls, prep[1].st.cls, tideYb((n % 42) / 41, spec.rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t: STILL_T + n * 0.033, mem, k: 0.3 });
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
    assert.ok(ts[80] < 3, `${id}: mediana ${ts[80].toFixed(2)} ms por cuadro en Node (presupuesto: 6 ms con CPU ×4)`);
  }
});

// ---------- hashes dorados (T19) ----------

const HASH_MARK = 'pendiente de aprobación del dueño (T18): las huellas de las escenas fijan el arte oficial (estilo Duotono, WP6c); cambian con cualquier ajuste de arte y se renuevan con UPDATE_GOLDEN=1 solo con el visto bueno del dueño en color';

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
  const dir = mkdtempSync(resolve(tmpdir(), 'gaya-scenes-'));
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

test('las huellas son distintas donde deben serlo (idioma, tamaño, llegada, marea)', async () => {
  const h = await computeSceneHashes();
  assert.notEqual(h['scene/cover/es/d1440/still'], h['scene/cover/es/m360/still']);
  assert.notEqual(h['scene/hola/es/d1440/still'], h['scene/hola/en/d1440/still'], 'HOLA ≠ HELLO');
  assert.equal(new Set([h['scene/cover/es/d1440/still'], h['scene/hola/es/d1440/still'], h['scene/mist/es/d1440/still']]).size, 3);
  assert.notEqual(h['scene/cover/es/d1440/still'], h['scene/cover/es/d1440/p30']);
  assert.equal(h['scene/cover/es/d1440/still'] === h['scene/cover/en/d1440/still'], true, 'GAYA es la misma en los dos idiomas');
  assert.equal(h['scene/poster/es/wide'], h['scene/poster/en/wide']);
  assert.equal(new Set(['76', '52', '28'].map((k) => h[`scene/tide/cover-hola/d1440/${k}`])).size, 3, 'los tres fotogramas de la marea son distintos');
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

void chebyshev;
