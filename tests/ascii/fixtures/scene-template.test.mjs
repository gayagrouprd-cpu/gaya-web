// PLANTILLA de la prueba de una escena nueva del estilo Duotono (docs/ascii/KIT.md). Cópiala a `tests/ascii/<id>.test.mjs`, cambia las dos líneas de «TU ESCENA» y añade las
// pruebas de TU arte (guion de la llegada, reacción al calor, lo que dibuja). Aquí está lo que toda escena debe cumplir y que no depende de su arte:
//   · contrato `Scene` y reglas de §6.3 (`checkSceneRules`) en 7 visores × 2 idiomas · presupuesto de tono LITERAL y EFECTIVO (topes de la adopción) · celdas no vacías
//   · barrido de 289 visores × 2 idiomas con la rejilla del motor (`sweep`) · contraste bajo los pozos de lectura · pureza del código · sin asignaciones por cuadro · coste
//   · sin `~` ni `^` en la atmósfera, sin carreras planas y con ≥ 60 % de la cara con glifo de la rampa (si la escena tiene palabra con cara)
// Se ejecuta con el resto: `node --test "tests/**/*.test.mjs"` (esta misma prueba valida la plantilla `scenes/_template.ts`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './scene-env.mjs';
import { checkSceneRules, checkToneBudget, effectiveBudget, toneBudget } from './scene-rules.mjs';
import { artMetrics } from './art-metrics.mjs';
import { TONE_LUM, contrast } from './tones.mjs';
import { sweep } from '../tools/sweep.mjs';
import { GLYPHS, STILL_T, makeCells, makeFrame, hashCells } from '../../../src/ascii/scenes/common.ts';
import { GLYPH_INK } from '../../../src/ascii/scenes/ink.ts';
import { createTemplateScene } from '../../../src/ascii/scenes/_template.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';

// ───────────── TU ESCENA ─────────────
const ID = 'web'; // el SceneId de tu escena (types.ts)
const scene = createTemplateScene(ID); // ← `import { miEscena } from '../../src/ascii/scenes/<id>.ts'`
const SOURCE = 'scenes/_template.ts'; // ← el archivo de tu escena (relativo a src/ascii/)
const HAS_WORD = true; // false si no lleva palabra (como `mist`)
const MAX_NONEMPTY = 60; // % de celdas con glifo: 60 la portada · 55 el resto · 30 la bruma
// ───────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../../src/ascii');
const ALL_VPS = ['d1440', 'd1600', 'd1920', 't1024', 'm360', 'm390', 'm320'];
const LANGS = ['es', 'en'];
const CAPS = { t9: 11, t11: 3.5, t13: 1.5, t14: 0.4 };
await ensureWords('es');
await ensureWords('en');

function paint(vp, lang, frame) {
  const spec = specOf(VIEWPORTS[vp]);
  const st = scene.build(spec, lang, wordsFor(ID, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, frame);
  return { g, st, spec };
}
const still = (vp, lang) => paint(vp, lang, makeFrame(1, STILL_T, 0, true));

test(`${ID} · contrato y reglas de §6.3: determinista, escribe toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos`, () => {
  assert.equal(scene.id, ID);
  assert.ok(scene.dawn >= 0 && scene.dawn <= 1);
  assert.ok(scene.arrival.ms >= 600 && scene.arrival.ms <= 2600);
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const spec = specOf(VIEWPORTS[vp]);
      const bad = checkSceneRules(scene, spec, wordsFor(ID, lang, spec), { noBg: false, lang });
      assert.deepEqual(bad, [], `${ID} ${lang} ${vp}: ${bad.join(' | ')}`);
    }
  }
});

test(`${ID} · presupuesto de tono literal Y efectivo (T≥9 ≤ 11 · T≥11 ≤ 3,5 · T≥13 ≤ 1,5 · T≥14 ≤ 0,4 %) y celdas no vacías en los 7 visores × 2 idiomas`, () => {
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const { g } = still(vp, lang);
      assert.deepEqual(checkToneBudget(g, { caps: CAPS, maxNonEmpty: MAX_NONEMPTY }), [], `${ID} ${lang} ${vp}`);
    }
  }
  void toneBudget;
  void effectiveBudget;
});

test(`${ID} · barrido de visores: presupuesto de tono dentro de los topes en ≥ 500 combinaciones de visor × idioma con la rejilla del motor`, async () => {
  const r = await sweep({ scenes: [scene], caps: CAPS, quick: false });
  assert.ok(r.rows.length >= 500, `barrido de ${r.rows.length} combinaciones (mínimo 500)`);
  assert.deepEqual(r.failures, []);
});

test(`${ID} · arte: sin \`~\` ni \`^\` fuera del trazo, sin carreras planas, cara con ≥ 60 % de glifos de la rampa y el sitio del texto (bajo la palabra) limpio`, { skip: !HAS_WORD && 'sin palabra' }, () => {
  for (const lang of LANGS) {
    for (const vp of ALL_VPS) {
      const { g, st, spec } = still(vp, lang);
      const m = artMetrics(g, st);
      assert.ok(m.faceGlyphRatio >= 0.6, `${lang} ${vp}: cara con glifo ${(100 * m.faceGlyphRatio).toFixed(0)} %`);
      assert.equal(m.flatRuns, 0, `${lang} ${vp}: carreras planas ${m.flatAt.join(' ')}`);
      assert.ok(m.outsideHalo <= 0.3 && m.d8 <= 0.15, `${lang} ${vp}: papel pintado (fuera del halo ${m.outsideHalo.toFixed(2)}, a 8 celdas ${m.d8.toFixed(2)})`);
      const tilde = new Set([GLYPHS.indexOf('~'), GLYPHS.indexOf('^')]);
      for (let i = 0; i < st.cls.length; i++) if (st.cls[i] !== 1 && st.cls[i] !== 2) assert.ok(!tilde.has(g.b[i * 4]), `${lang} ${vp}: «${GLYPHS[g.b[i * 4]]}» en la atmósfera`);
    }
  }
});

// pozos de lectura: el motor topa fg y bg a T6 (ink) y T4 (muted) y el contraste del peor píxel con el texto debe ser ≥ 4,5:1
const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const hexLum = (h) => {
  const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
test(`${ID} · pozos de lectura (§5.8): bajo el texto el tono no pasa de T6 / T4 y el contraste del peor píxel es ≥ 7 (ink) y ≥ 6 (muted)`, () => {
  const INK = hexLum('#edf2f8');
  const MUTED = hexLum('#a4b6ce');
  for (const vp of ['d1440', 'm360']) {
    const spec = specOf(VIEWPORTS[vp]);
    const rects = vp === 'm360' ? [{ x: 4, y: 36, w: 52, h: 14, kind: 'ink' }, { x: 4, y: 51, w: 46, h: 6, kind: 'muted' }] : [{ x: 8, y: 26, w: 92, h: 11, kind: 'ink' }, { x: 8, y: 37, w: 70, h: 4, kind: 'muted' }];
    const st = scene.build(spec, 'es', wordsFor(ID, 'es', spec));
    const cap = buildCap(makeCap(spec.cols, spec.rows), spec.cols, spec.rows, rects, {});
    const g = makeCells(spec.cols, spec.rows);
    const f = makeFrame(1, STILL_T, 0, true);
    f.cap = cap;
    scene.paint(g, st, f);
    applyCap(g, cap);
    for (const r of rects) {
      const c = r.kind === 'ink' ? 6 : 4;
      let worst = Infinity;
      for (let y = Math.max(0, Math.floor(r.y)); y < Math.min(spec.rows, Math.ceil(r.y + r.h)); y++) {
        for (let x = Math.floor(r.x); x < Math.min(spec.cols, Math.ceil(r.x + r.w)); x++) {
          const i = (y * spec.cols + x) << 2;
          assert.ok(g.b[i + 1] <= c && g.b[i + 2] <= c, `${vp} (${x},${y}): T${g.b[i + 1]}/T${g.b[i + 2]} > T${c}`);
          worst = Math.min(worst, contrast(r.kind === 'ink' ? INK : MUTED, Math.max(TONE_LUM[g.b[i + 1]], TONE_LUM[g.b[i + 2]])));
        }
      }
      assert.ok(worst >= (r.kind === 'ink' ? 7 : 6), `${vp} ${r.kind}: contraste ${worst.toFixed(2)}`);
    }
  }
});

const code = (file) =>
  readFileSync(resolve(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test(`${ID} · código: sin Math.random, reloj ni DOM; sin Math.sin/cos/pow/exp; sintaxis borrable; imports con .ts; sin texto visible (R8)`, () => {
  const c = code(SOURCE);
  assert.doesNotMatch(c, /Math\.random/);
  assert.doesNotMatch(c, /performance\.now|Date\.now|new Date\b/);
  assert.doesNotMatch(c, /\b(document|window|navigator|requestAnimationFrame)\b/);
  assert.doesNotMatch(c, /Math\.(sin|cos|tan|pow|exp|log|log2|log10|atan|atan2|asin|acos|sinh|cosh|tanh|hypot|cbrt)\b/);
  assert.doesNotMatch(c, /\*\*/);
  assert.doesNotMatch(c, /\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(private|public|protected|readonly)\s+\w/);
  const raw = readFileSync(resolve(SRC, SOURCE), 'utf8');
  for (const m of raw.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) assert.match(m[1], /\.ts$/, `«${m[1]}» sin .ts`);
  for (const m of c.matchAll(/"([^"\n]+)"/g)) assert.doesNotMatch(m[1], /[A-Za-zÁ-ú]{2,} [A-Za-zÁ-ú]{2,}/, `«${m[1]}» parece texto visible`);
});

test(`${ID} · sin asignaciones por cuadro (con calor, anillos y pozos) y coste de paint a 9 000 celdas < 3 ms de mediana en Node`, () => {
  const NAMES = ['Uint8Array', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'Map', 'Set'];
  const counts = Object.fromEntries(NAMES.map((n) => [n, 0]));
  const spec = specOf({ ...VIEWPORTS.d1440, w: 1620, h: 900 });
  const st = scene.build(spec, 'es', wordsFor(ID, 'es', spec));
  const g = makeCells(spec.cols, spec.rows);
  const f = makeFrame(1, STILL_T, 0.3);
  f.heat = new Float32Array(spec.cols * spec.rows).fill(0.3);
  f.rings = [{ x: 40, y: 12, age: 0.3 }];
  f.cap = new Uint8Array(spec.cols * spec.rows).fill(15);
  const frame = (n) => {
    f.t = STILL_T + n * 0.033;
    f.p = 0.2 + 0.8 * ((n % 42) / 41);
    scene.paint(g, st, f);
  };
  for (let i = 0; i < 4; i++) frame(i);
  const originals = {};
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
  const ts = [];
  f.p = 1;
  for (let i = 0; i < 160; i++) {
    f.t = STILL_T + i * 0.033;
    const t0 = process.hrtime.bigint();
    scene.paint(g, st, f);
    ts.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  ts.sort((a, b) => a - b);
  assert.ok(ts[80] < 3, `mediana ${ts[80].toFixed(2)} ms por cuadro (presupuesto: 6 ms con CPU ×4)`);
  assert.ok(hashCells(still('d1440', 'es').g).length > 0 && GLYPH_INK.length === GLYPHS.length);
});
