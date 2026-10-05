// Variante A · Duotono ANSI (src/ascii/scenes/variants/a): cover y hola con CARACTERES VISIBLES (glifo claro sobre fondo más oscuro). Comprueba la rampa
// medida, las reglas de escena de §6.3 (vía checkSceneRules, con `bg` permitido), el presupuesto de tono de §5.4 con la medida literal Y con la efectiva
// (luminancia media), los pozos de lectura (tope de tono bajo el texto y calma de caracteres), la marea de la variante, el póster colapsado, la
// pureza del código y el determinismo (procesos hijos y V8 sin JIT).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './fixtures/scene-env.mjs';
import { checkSceneRules, toneBudget } from './fixtures/scene-rules.mjs';
import { effectiveBudget } from './fixtures/scene-rules-duo.mjs';
import { computeVariantHashes } from './fixtures/variant-a-hashes.mjs';
import { TONE_LUM, contrast } from './fixtures/tones.mjs';
import { ALLOWED_ART_CHARS, GLYPHS, STILL_T, countExplicitBg, glyphIndex, hashCells, makeCells, makeFrame } from '../../src/ascii/scenes/common.ts';
import { toLayers } from '../../src/ascii/grid.ts';
import { cover } from '../../src/ascii/scenes/cover.ts';
import { hola } from '../../src/ascii/scenes/hola.ts';
import { coverA, createCoverA } from '../../src/ascii/scenes/variants/a/cover.ts';
import { holaA } from '../../src/ascii/scenes/variants/a/hola.ts';
import { LOADERS_A } from '../../src/ascii/scenes/variants/a/index.ts';
import { LEVELS, LEVEL_INK, RAMP, RAMP_CHARS, inkOf } from '../../src/ascii/scenes/variants/a/ramp.ts';
import { INK_PERMILLE } from '../../src/ascii/scenes/variants/a/ramp.gen.ts';
import { composeA } from '../../src/ascii/scenes/variants/a/tide-a.ts';
import { posterCollapse } from '../../src/ascii/scenes/variants/a/poster-a.ts';
import { compose, tideParams, tideYb } from '../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../src/ascii/wells.ts';
import { renderPosterLayers } from '../../src/ascii/ssr.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../src/ascii');
const CLI = resolve(HERE, 'fixtures/variant-a-hash-cli.mjs');
await ensureWords('es');
await ensureWords('en');

const SCENES = { cover: coverA, hola: holaA };
const BASE = { cover, hola };
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

// ---------- la rampa medida ----------

test('rampa: diez peldaños, cuatro glifos cada uno, todos permitidos y de fuente; la tinta MEDIDA crece peldaño a peldaño', () => {
  assert.equal(RAMP_CHARS.length, LEVELS);
  assert.equal(RAMP.length, LEVELS * 4);
  for (let l = 0; l < LEVELS; l++) {
    assert.equal(RAMP_CHARS[l].length, 4, `peldaño ${l}`);
    for (const c of RAMP_CHARS[l]) {
      assert.ok(ALLOWED_ART_CHARS.has(c), `«${c}» fuera de ALLOWED_ART_CHARS`);
      assert.ok(glyphIndex(c) >= 0 && glyphIndex(c) <= 96, `«${c}» no es un glifo de fuente`);
      assert.ok(c === ' ' || INK_PERMILLE.some(([k]) => k === c), `«${c}» sin tinta medida`);
    }
  }
  for (let l = 2; l < LEVELS; l++) assert.ok(LEVEL_INK[l] > LEVEL_INK[l - 1] + 15, `la tinta no sube en el peldaño ${l}: ${LEVEL_INK[l - 1]} → ${LEVEL_INK[l]}`);
  assert.equal(LEVEL_INK[0], 0);
  const gaps = LEVEL_INK.slice(1).map((v, i) => v - LEVEL_INK[i]);
  assert.ok(Math.max(...gaps) < 65, `hueco de tinta máximo ${Math.max(...gaps) / 10} puntos (la rampa de 10 clásica tiene 12,6)`);
  assert.ok(inkOf('@') > inkOf('#') && inkOf('#') > inkOf('*') && inkOf('*') > inkOf('+') && inkOf('+') > inkOf('=') && inkOf('=') > inkOf(':') && inkOf(':') > inkOf('.'), 'orden medido de los símbolos de la rampa');
});

// ---------- registro ----------

test('registro: LOADERS_A tiene la forma de scenes/index.ts y las escenas cumplen id, dawn y llegada de la base', async () => {
  assert.equal(await LOADERS_A.cover(), coverA);
  assert.equal(await LOADERS_A.hola(), holaA);
  for (const id of ['cover', 'hola']) {
    const a = SCENES[id];
    const b = BASE[id];
    assert.equal(a.id, id);
    assert.equal(a.dawn, b.dawn);
    assert.deepEqual(a.arrival, b.arrival);
    assert.equal(typeof a.build, 'function');
    assert.equal(typeof a.paint, 'function');
  }
});

// ---------- §6.3: reglas de escena ----------

test('§6.3 · reglas de escena en los 7 visores y los 2 idiomas: determinista, toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos (con bg)', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const spec = specOf(VIEWPORTS[vp]);
        const bad = checkSceneRules(SCENES[id], spec, wordsFor(id, lang, spec), { noBg: false, lang });
        assert.deepEqual(bad, [], `${id} ${lang} ${vp}: ${bad.join(' | ')}`);
      }
    }
  }
});

test('cover A SÍ usa `bg` (cambia el contrato de la portada: sin póster por capas de glifos sin pérdida); hola A también; la base de cover no', () => {
  assert.ok(countExplicitBg(still(coverA, 'd1440', 'es').g) > 0);
  assert.ok(countExplicitBg(still(holaA, 'd1440', 'es').g) > 0);
  assert.equal(countExplicitBg(still(cover, 'd1440', 'es').g), 0);
});

test('la H de HOLA es sólida (bloques) y «OLA» de caracteres: en la A no queda ni un glifo de bloque en las celdas de ola salvo el aro', () => {
  const { g, spec } = still(holaA, 'd1440', 'es');
  const full = glyphIndex('█');
  let hSolid = 0;
  let waveChars = 0;
  for (let y = 0; y < spec.rows; y++) {
    for (let x = 0; x < spec.cols; x++) {
      const i = (y * spec.cols + x) << 2;
      if (g.b[i] === full) hSolid++;
      else if (g.b[i] >= 1 && g.b[i] <= 96 && g.b[i + 2] >= 4) waveChars++;
    }
  }
  assert.ok(hSolid > 150, `H sólida: ${hSolid} bloques`);
  assert.ok(waveChars > 300, `ola de caracteres sobre fondo: ${waveChars} celdas`);
});

// ---------- §5.4: presupuesto de tono ----------

const CAP_NONEMPTY = { cover: 60, hola: 55 };
test('§5.4 · presupuesto de tono LITERAL del still (T≥9 ≤ 12 · T≥11 ≤ 4 · T≥13 ≤ 1,5 · T≥14 ≤ 0,5 %; no vacías ≤ 60 / 55 %) en 7 visores × 2 idiomas', () => {
  const rows = [];
  for (const id of ['cover', 'hola']) {
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
  if (process.env.VARIANT_A_VERBOSE === '1') console.log(rows.join('\n'));
});

test('§5.4 · presupuesto EFECTIVO (luminancia media por celda, fondo y glifo ponderados por la tinta medida): dentro de los mismos topes y sin más luz que la base', () => {
  for (const id of ['cover', 'hola']) {
    for (const lang of LANGS) {
      for (const vp of ALL_VPS) {
        const e = effectiveBudget(still(SCENES[id], vp, lang).g);
        const base = effectiveBudget(still(BASE[id], vp, lang).g);
        const tag = `${id} ${lang} ${vp}`;
        assert.ok(e.t9 <= 12 && e.t11 <= 4 && e.t13 <= 1.5 && e.t14 <= 0.5, `${tag}: efectivo T9 ${e.t9} T11 ${e.t11} T13 ${e.t13} T14 ${e.t14}`);
        assert.ok(e.mean <= base.mean * 1.12, `${tag}: la variante tiene más luz que la base (${e.mean.toFixed(4)} vs ${base.mean.toFixed(4)})`);
      }
    }
  }
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
const CAPS = { ink: 6, muted: 4 };

test('§5.8 · bajo los pozos (h1, lead, botones) el motor topa fg y bg a T6 / T4 y el peor píxel (fondo o glifo) deja ≥ 7 (ink) y ≥ 6 (muted) de contraste; el arte pinta calma ahí', () => {
  for (const vp of ['d1440', 'd1920', 'm360']) {
    const spec = specOf(VIEWPORTS[vp]);
    const rects = vp === 'm360' ? [{ x: 4, y: 36, w: 52, h: 14, kind: 'ink' }, { x: 4, y: 51, w: 46, h: 6, kind: 'muted' }] : RECTS;
    for (const id of ['cover', 'hola']) {
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
        const c = CAPS[r.kind];
        for (let y = Math.max(0, Math.floor(r.y)); y < Math.min(spec.rows, Math.ceil(r.y + r.h)); y++) {
          for (let x = Math.floor(r.x); x < Math.min(spec.cols, Math.ceil(r.x + r.w)); x++) {
            const i = (y * spec.cols + x) << 2;
            assert.ok(g.b[i + 1] <= c && g.b[i + 2] <= c, `${id} ${vp} (${x},${y}): tono ${g.b[i + 1]}/${g.b[i + 2]} > T${c}`);
            const worst = Math.max(TONE_LUM[g.b[i + 1]], TONE_LUM[g.b[i + 2]]);
            if (r.kind === 'ink') worstInk = Math.min(worstInk, contrast(INK_LUM, worst));
            else worstMuted = Math.min(worstMuted, contrast(MUTED_LUM, worst));
            // calma: la escena misma (antes del tope del motor) no pone cruces ni almohadillas bajo el texto
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

// ---------- marea de la variante ----------

test('marea A (composeA): fuera del frente deja el saliente y el entrante intactos, deterministas, sin tonos > 15 ni glifos fuera de la lista; la banda es duotono', () => {
  for (const vp of ['d1440', 'm390']) {
    const a = still(coverA, vp, 'es');
    const b = still(holaA, vp, 'es');
    const tp = tideParams(VIEWPORTS[vp].cssCw < 9);
    for (const k of [0.15, 0.28, 0.52, 0.76, 0.95]) {
      const o1 = makeCells(a.spec.cols, a.spec.rows);
      const o2 = makeCells(a.spec.cols, a.spec.rows);
      const opts = { band: tp.band, reach: tp.reach, t: STILL_T };
      composeA(o1, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * k, opts);
      composeA(o2, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * k, opts);
      assert.equal(hashCells(o1), hashCells(o2), `${vp} ${k}: no determinista`);
      let bandCells = 0;
      let duo = 0;
      for (let i = 0; i < o1.b.length; i += 4) {
        assert.ok(o1.b[i] < GLYPHS.length && o1.b[i + 1] <= 15 && o1.b[i + 2] <= 15);
        if (o1.b[i + 3] === 3 && o1.b[i + 2] > 0 && (o1.b[i] < 97 || o1.b[i] > 114)) duo++;
        if (o1.b[i] !== a.g.b[i] || o1.b[i + 1] !== a.g.b[i + 1] || o1.b[i + 2] !== a.g.b[i + 2]) if (o1.b[i] !== b.g.b[i] || o1.b[i + 1] !== b.g.b[i + 1] || o1.b[i + 2] !== b.g.b[i + 2]) bandCells++;
      }
      assert.ok(bandCells > 100 && duo > 100, `${vp} ${k}: banda de ${bandCells} celdas (${duo} duotono)`);
    }
    // frente fuera de pantalla: todo es uno de los dos carteles
    const top = makeCells(a.spec.cols, a.spec.rows);
    composeA(top, a.g, b.g, a.st.cls, b.st.cls, tideYb(0, a.spec.rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t: STILL_T });
    assert.equal(hashCells(top), hashCells(a.g), `${vp}: con el frente abajo del todo se ve el saliente tal cual`);
  }
});

// ---------- póster SSR ----------

test('póster SSR sin JS: la escena con bg no sirve para renderPosterLayers tal cual (las paredes desaparecen); `posterCollapse` lo arregla con las mismas 4 capas y ≤ +1,2 KB gz', () => {
  for (const [vp, maxExtra] of [['d1440', 1200], ['t1024', 700], ['m390', 800]]) {
    const spec = specOf(VIEWPORTS[vp]);
    const words = wordsFor('cover', 'es', spec);
    const baseL = renderPosterLayers(cover, spec, 'es', words);
    const { g } = still(coverA, vp, 'es');
    const naive = toLayers(g);
    posterCollapse(g);
    assert.equal(countExplicitBg(g), 0, 'el colapso deja la rejilla sin bg');
    const L = toLayers(g);
    const mass = (s) => (s.match(/[█▌▐▀▄▙▛▜▟▞▚▖▗▘▝]/g) ?? []).length;
    const massAll = (l) => mass(l.dim) + mass(l.mid) + mass(l.hot) + mass(l.spark);
    assert.ok(massAll(L) > 1.5 * massAll(naive), `${vp}: el colapso no recupera la masa (${massAll(L)} vs ${massAll(naive)} celdas de bloque)`);
    const gz = (l) => gzipSync([l.dim, l.mid, l.hot, l.spark].join('\n'), { level: 9 }).length;
    assert.ok(gz(L) - gz(baseL) <= maxExtra, `${vp}: póster A ${gz(L)} B gz vs base ${gz(baseL)}`);
    for (const k of ['dim', 'mid', 'hot', 'spark']) for (const ch of L[k]) assert.ok(ch === '\n' || ch === ' ' || ALLOWED_ART_CHARS.has(ch), `«${ch}» no permitido en el póster`);
  }
});

// ---------- código ----------

const FILES = ['scenes/variants/a/ramp.ts', 'scenes/variants/a/kit-a.ts', 'scenes/variants/a/cover.ts', 'scenes/variants/a/hola.ts', 'scenes/variants/a/tide-a.ts', 'scenes/variants/a/poster-a.ts', 'scenes/variants/a/index.ts'];
const code = (f) =>
  readFileSync(resolve(SRC, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('código: sin Math.random, reloj ni DOM; sin Math.sin/cos/pow/exp; sintaxis borrable; imports con .ts; sin texto visible', () => {
  for (const f of FILES) {
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

test('sin asignaciones por cuadro: paint de cover A y hola A (con calor, anillos y pozos) y composeA no construyen arreglos tipados, buffers, Map ni Set', () => {
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
    composeA(out, prep[0].g, prep[1].g, prep[0].st.cls, prep[1].st.cls, tideYb((n % 42) / 41, spec.rows, tp.band, tp.reach, 1), { band: tp.band, reach: tp.reach, t: STILL_T + n * 0.033, mem, k: 0.3 });
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

test('coste: paint a 9 000 celdas en Node (la medición con CPU ×4 en Chrome está en tools/bench-variant-a.mjs)', () => {
  const spec = specOf({ ...VIEWPORTS.d1440, w: 1620, h: 900 });
  assert.equal(spec.cols * spec.rows, 9000);
  for (const id of ['cover', 'hola']) {
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

// ---------- determinismo ----------

test('mismas huellas en dos ejecuciones, en procesos distintos y con V8 sin JIT', async (t) => {
  const here = await computeVariantHashes();
  const again = await computeVariantHashes();
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
  const dir = mkdtempSync(resolve(tmpdir(), 'gaya-variant-a-'));
  try {
    const out = resolve(dir, 'variant-a-hash-cli.bundle.mjs');
    await esbuild.build({ entryPoints: [CLI], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', external: ['node:*'] });
    assert.deepEqual(JSON.parse(execFileSync(process.execPath, ['--jitless', out], { encoding: 'utf8', maxBuffer: 1 << 26 })), here, 'V8 sin JIT da otro resultado: hay aritmética que depende del motor');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('las huellas son distintas donde deben serlo (idioma, tamaño, llegada) y la variante no es la base', async () => {
  const h = await computeVariantHashes();
  assert.notEqual(h['a/cover/es/d1440/still'], h['a/cover/es/m360/still']);
  assert.notEqual(h['a/hola/es/d1440/still'], h['a/hola/en/d1440/still'], 'HOLA ≠ HELLO');
  assert.notEqual(h['a/cover/es/d1440/still'], h['a/cover/es/d1440/p30']);
  assert.equal(h['a/cover/es/d1440/still'] === h['a/cover/en/d1440/still'], true, 'GAYA es la misma en los dos idiomas');
  assert.equal(h['a/poster/es/wide'], h['a/poster/en/wide']);
  const base = still(cover, 'd1440', 'es').g;
  assert.notEqual(hashCells(base), hashCells(still(coverA, 'd1440', 'es').g));
  const o = createCoverA({ level: 0.5 });
  assert.notEqual(hashCells(still(o, 'd1440', 'es').g), hashCells(still(coverA, 'd1440', 'es').g), 'level cambia el nivel del agua');
});

test('sin estado compartido: dos builds alternados no se contaminan', () => {
  for (const id of ['cover', 'hola']) {
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
