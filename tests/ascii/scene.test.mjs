// La escena de PRUEBA (kit en acción): reglas de escena de §6.3 / §12.7, guion de p, reacciones y el look medido.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestScene } from './fixtures/scene.ts';
import { checkSceneRules, toneBudget } from './fixtures/scene-rules.mjs';
import { GAYA_L_SET, GAYA_M_SET, GAYA_STACK, ON_L_SET } from './fixtures/words.mjs';
import { STILL_T, gridSpec, makeCells, makeFrame, specDesktop, specMobile, hashCells, getTone, getGlyph, glyphIndex } from '../../src/ascii/scenes/common.ts';

const cover = createTestScene({ id: 'cover', base: 8, glass: true });
const onScene = createTestScene({ id: 'on', base: 9, glass: false, yTop: 12, ms: 1900 });
const CASES = [
  ['escritorio 160×50', specDesktop(), GAYA_L_SET],
  ['tablet 113×44', gridSpec(113, 44, 9, 18, 2), GAYA_M_SET],
  ['móvil 60×66 (pila)', specMobile(), GAYA_STACK],
  ['móvil 65×70 (pila)', gridSpec(65, 70, 6, 12, 2), GAYA_STACK],
];

test('reglas de escena (§6.3): determinista, escribe toda la pantalla, still ≡ paint(p=1, STILL_T), tonos y glifos válidos, sin bg', () => {
  for (const [name, spec, set] of CASES) {
    const bad = checkSceneRules(cover, spec, [set], { noBg: true });
    assert.deepEqual(bad, [], `${name}: ${bad.join(' | ')}`);
  }
  assert.deepEqual(checkSceneRules(onScene, specDesktop(), [ON_L_SET]), []);
});

function render(scene, spec, set, f) {
  const st = scene.build(spec, 'es', [set]);
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, f);
  return { g, st };
}
const count = (g, pred) => {
  let n = 0;
  for (let i = 0; i < g.b.length; i += 4) if (pred(g.b[i], g.b[i + 1])) n++;
  return n;
};

test('guion: el vidrio se llena (más celdas luminosas con p) y la bruma se abre', () => {
  const spec = specDesktop();
  const bright = [0.1, 0.3, 0.55, 0.8, 1].map((p) => count(render(cover, spec, GAYA_L_SET, makeFrame(p, STILL_T)).g, (gl, t) => gl && t >= 8));
  for (let i = 1; i < bright.length; i++) assert.ok(bright[i] >= bright[i - 1], `luminosas ${bright}`);
  assert.ok(bright[4] > bright[0] * 1.2, `el aro ya existe desde p = 0,05; el agua suma encima: ${bright}`);
  const empty = render(cover, spec, GAYA_L_SET, makeFrame(0, STILL_T)).g;
  assert.equal(count(empty, (gl) => gl !== 0), 0, 'a p = 0 la pantalla está vacía (la bruma aún cerrada)');
  const mistN = [0.02, 0.08, 0.15].map((p) => count(render(cover, spec, GAYA_L_SET, makeFrame(p, STILL_T)).g, (gl) => gl !== 0));
  assert.ok(mistN[0] < mistN[1] && mistN[1] < mistN[2] || mistN[0] === 0, `bruma ${mistN}`);
});

test('estructura del fotograma final: cara luminosa, aro de luz, sombra, halo y chispas', () => {
  const spec = specDesktop();
  const { g, st } = render(cover, spec, GAYA_L_SET, makeFrame(1, STILL_T, 0, true));
  const tones = new Array(16).fill(0);
  const gl = {};
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    tones[g.b[i + 1]]++;
    gl[g.b[i]] = (gl[g.b[i]] ?? 0) + 1;
  }
  assert.ok(tones[12] + tones[13] + tones[14] > 100, 'aro de luz T12–T14');
  assert.ok(tones[15] >= 1 && tones[15] <= 8, `chispas T15: ${tones[15]}`);
  assert.ok(tones[2] > 20, 'vidrio vacío T2');
  assert.ok(tones[4] > 50, 'sombra ░ T4');
  assert.ok(gl[glyphIndex('█')] > 500, 'caras y aro en bloque');
  assert.ok(gl[glyphIndex('░')] > 50 && gl[glyphIndex('▒')] > 10 && gl[glyphIndex('·')] > 10, 'bruma de ░▒ y puntos');
  assert.ok(gl[glyphIndex('▄')] > 5 || gl[glyphIndex('▅')] > 5, 'menisco');
  // cls para la marea: hay aire, cara, borde y sombra/halo
  const hist = [0, 0, 0, 0];
  for (const c of st.cls) hist[c]++;
  assert.ok(hist.every((n) => n > 0), `cls ${hist}`);
  assert.equal(hist.reduce((a, b) => a + b, 0), spec.cols * spec.rows);
});

test('presupuesto de tono medido (§5.4): se publica; aquí solo se exige que la portada no sea más densa que el 60 % de celdas', () => {
  for (const [name, spec, set] of CASES) {
    const b = toneBudget(render(cover, spec, set, makeFrame(1, STILL_T, 0, true)).g);
    assert.ok(b.nonEmpty <= 62, `${name}: no vacías ${b.nonEmpty.toFixed(1)} %`);
    assert.ok(b.t9 < 20 && b.t11 < 15 && b.t13 < 8, `${name}: ${JSON.stringify(b)}`);
  }
});

test('calor: enciende el vidrio vacío por encima del nivel, y solo él; los anillos suben tonos sin cambiar glifos', () => {
  const spec = specDesktop();
  const base = render(cover, spec, GAYA_L_SET, makeFrame(1, STILL_T, 0, true));
  const f = makeFrame(1, STILL_T, 0, false);
  f.heat = new Float32Array(spec.cols * spec.rows);
  for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
    const dx = (x - 40) / 30;
    const dy = (y - 8) / 6;
    f.heat[y * spec.cols + x] = Math.max(0, 1 - (dx * dx + dy * dy));
  }
  const hot = render(cover, spec, GAYA_L_SET, f);
  let changed = 0;
  for (let i = 0; i < base.g.b.length; i += 4) {
    assert.equal(hot.g.b[i], base.g.b[i], 'el calor no cambia glifos');
    if (hot.g.b[i + 1] !== base.g.b[i + 1]) {
      changed++;
      assert.ok(hot.g.b[i + 1] > base.g.b[i + 1], 'solo sube');
    }
  }
  assert.ok(changed > 10, `calor: ${changed} celdas`);
  const r = makeFrame(1, STILL_T, 0, false);
  r.rings = [{ x: 60, y: 10, age: 0.3 }];
  const ringed = render(cover, spec, GAYA_L_SET, r);
  let up = 0;
  for (let i = 0; i < base.g.b.length; i += 4) {
    assert.equal(ringed.g.b[i], base.g.b[i]);
    if (ringed.g.b[i + 1] > base.g.b[i + 1]) up++;
    assert.ok(ringed.g.b[i + 1] >= base.g.b[i + 1]);
  }
  assert.ok(up > 10);
});

test('cada tamaño es propio: build por rejilla e idioma, sin estado compartido entre escenas de una misma fábrica', () => {
  const a = render(cover, specDesktop(), GAYA_L_SET, makeFrame(1, STILL_T));
  const m = render(cover, specMobile(), GAYA_STACK, makeFrame(1, STILL_T));
  const a2 = render(cover, specDesktop(), GAYA_L_SET, makeFrame(1, STILL_T));
  assert.equal(hashCells(a.g), hashCells(a2.g));
  assert.notEqual(m.g.cols, a.g.cols);
  const other = createTestScene({ id: 'cover', base: 9 });
  const o = render(other, specDesktop(), GAYA_L_SET, makeFrame(1, STILL_T));
  assert.notEqual(hashCells(o.g), hashCells(a.g));
  assert.equal(hashCells(render(cover, specDesktop(), GAYA_L_SET, makeFrame(1, STILL_T)).g), hashCells(a.g), 'la otra fábrica no contaminó esta');
  assert.ok(getTone(a.g, 0, 0) >= 0 && getGlyph(a.g, 0, 0) >= 0);
});
