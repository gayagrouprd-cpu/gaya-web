// Arte en DOM (WP10b): reglas, palabras mini y proc, composición partida del hilo en móvil, escape de data-art y póster SSR
// (alfabeto, tamaño y peso con la escena `cover` real). Corre en Node sin DOM: `node --test tests/ascii/dom-art.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { loadWords, getWords, wordMini, wordProc, WORD_IDS } from '../../src/ascii/words.ts';
import { renderPosterLayersDuo } from '../../src/ascii/ssr.ts';
import { cover } from '../../src/ascii/scenes/index.ts';
import { RULE_COLS, RULE_PERIOD, POSTER_VARIANTS, railText, ruleText, wordArt, emptyColumns, splitWord, stackArt, stackSize, escapeAttr, forbiddenGlyphs, posterSpec } from '../../src/ascii/dom-art.ts';

await loadWords('es');
await loadWords('en');
const LANGS = ['es', 'en'];
const ink = (w) => w.cells.reduce((n, c) => n + (c === 0 ? 0 : 1), 0);
const THREAD = { es: ['HOLA', 'LISTO'], en: ['HELLO', 'READY'] };
/** Columnas útiles a 320 px de ancho con celda de 6 px y 16 px de margen por lado: (320 − 32) / 6. */
const COLS_320 = 48;

test('regla: «─» con «┼» en las columnas 1, 9, 17…, una sola línea y solo glifos permitidos', () => {
  const r = ruleText();
  assert.equal([...r].length, RULE_COLS);
  assert.ok(!r.includes('\n'));
  [...r].forEach((c, i) => assert.equal(c, i % RULE_PERIOD === 1 ? '┼' : '─', `columna ${i}`));
  assert.equal(ruleText(12), '─┼───────┼──');
  assert.deepEqual(forbiddenGlyphs(r), []);
});

test('riel: una fila por línea con el glifo dado', () => {
  assert.equal(railText(3, '┃'), '┃\n┃\n┃');
  assert.equal(railText(1), '│');
  assert.deepEqual(forbiddenGlyphs(railText(24, '┃') + railText(24, '│') + '┼──╋━━'), []);
});

test('escapeAttr: & < " se escapan y el resto pasa tal cual (ida y vuelta sin pérdida)', () => {
  const s = `a&b <c> "d" 'e' █░·\nx`;
  const e = escapeAttr(s);
  assert.ok(!/[<"]/.test(e.replace(/&(amp|lt|quot);/g, '')));
  const back = e.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  assert.equal(back, s);
  assert.equal(escapeAttr('&amp;'), '&amp;amp;', 'no hay doble interpretación: se escapa siempre');
});

test('palabras mini y proc (ES y EN): alfabeto permitido, 6 u 8 filas, sin texto al final de línea', () => {
  for (const lang of LANGS) {
    for (const id of WORD_IDS[lang]) {
      const m = wordMini(id, lang);
      const art = wordArt(m);
      assert.deepEqual(forbiddenGlyphs(art), [], `${lang}/${id} mini`);
      assert.equal(art.split('\n').length, m.rows, `${lang}/${id} mini: filas`);
      assert.ok(m.rows === 6 || (id === 'TU' && m.rows === 8), `${lang}/${id} mini: ${m.rows} filas`);
      assert.ok(!/ \n|\s$/.test(art), `${lang}/${id} mini: sin espacios finales`);
    }
    for (const id of THREAD[lang]) {
      const p = wordProc(id, lang);
      assert.equal(p.rows, 8, `${lang}/${id} proc`);
      assert.deepEqual(forbiddenGlyphs(wordArt(p)), []);
    }
  }
});

test('splitWord: corta por columnas vacías, conserva toda la tinta y no deja trozos vacíos', () => {
  for (const lang of LANGS) {
    for (const id of WORD_IDS[lang]) {
      const w = wordMini(id, lang);
      for (const parts of [2, 3]) {
        const out = splitWord(w, parts);
        assert.ok(out.length >= 1 && out.length <= parts, `${lang}/${id}/${parts}`);
        assert.equal(out.reduce((n, p) => n + ink(p), 0), ink(w), `${lang}/${id}/${parts}: tinta conservada`);
        for (const p of out) {
          assert.equal(p.rows, w.rows);
          assert.ok(p.cols > 0 && p.cols < w.cols || out.length === 1);
          // ni la primera ni la última columna de un trozo están vacías (se recortan)
          if (out.length > 1) {
            const e = emptyColumns(p);
            assert.ok(!e.includes(0) && !e.includes(p.cols - 1), `${lang}/${id}: bordes recortados`);
          }
        }
      }
    }
  }
  // READY · HELLO: la pila `REA / DY` y `HE / LLO` mide 13 filas (6 + 1 + 6)
  const ready = splitWord(wordMini('READY', 'en'), 2);
  assert.equal(ready.length, 2);
  assert.deepEqual(stackSize(ready, 1).rows, 13);
  assert.equal(stackArt(ready, 1).split('\n').length, 13);
});

test('hilo del Proceso a 320 px: cada palabra cabe en proc, en mini o en la pila partida (nunca más de 48 columnas en la última)', () => {
  for (const lang of LANGS) {
    for (const id of THREAD[lang]) {
      const proc = wordProc(id, lang);
      const mini = wordMini(id, lang);
      assert.ok(mini.cols < proc.cols, `${lang}/${id}: los umbrales del CSS van de mini a proc (${mini.cols} < ${proc.cols})`);
      const parts = splitWord(mini, 2);
      assert.equal(parts.length, 2, `${lang}/${id}: se puede partir`);
      const w = stackSize(parts, 1).cols;
      assert.ok(w + 2 <= COLS_320, `${lang}/${id}: la pila partida mide ${w} + 2 de sombra ≤ ${COLS_320} columnas`);
    }
  }
});

test('póster SSR: tres variantes en orden (133 · 96 · 0), tamaños de §6.9 y rejilla entera', () => {
  assert.deepEqual(POSTER_VARIANTS.map((v) => [v.key, v.cols, v.rows, v.minCols]), [['wide', 160, 50, 133], ['mid', 113, 44, 96], ['stack', 65, 70, 0]]);
  for (const v of POSTER_VARIANTS) {
    assert.ok(v.cols >= v.minCols);
    const s = posterSpec(v);
    assert.equal(s.cols, v.cols);
    assert.equal(s.rows, v.rows);
    assert.equal(s.cssCw * 2, s.cssCh === 18 ? 18 : 12, 'celda 1:2 (9×18 o 6×12)');
    assert.ok(Number.isInteger(s.cw) && Number.isInteger(s.ch));
  }
});

test('póster SSR con la escena cover real (estilo Duotono, colapsado): alfabeto permitido, dentro de la rejilla y ≤ 5,5 KB gz las tres variantes', () => {
  for (const lang of LANGS) {
    let html = '';
    for (const v of POSTER_VARIANTS) {
      const spec = posterSpec(v);
      const L = renderPosterLayersDuo(cover, spec, lang, [getWords('GAYA', lang, v.cols, v.rows)]);
      for (const [name, s] of Object.entries(L)) {
        assert.deepEqual(forbiddenGlyphs(s), [], `${lang}/${v.key}/${name}`);
        const lines = s.split('\n');
        assert.ok(lines.length <= spec.rows);
        for (const l of lines) assert.ok([...l].length <= spec.cols && !/\s$/.test(l));
        html += `<span class="art poster-ssr__l poster-ssr__l--${name}" aria-hidden="true" translate="no" data-art="${escapeAttr(s)}"></span>`;
      }
    }
    const gz = gzipSync(Buffer.from(html), { level: 9 }).length;
    assert.ok(gz <= 5.5 * 1024, `${lang}: el póster pesa ${gz} B gz (presupuesto 5,5 KB)`);
  }
});

test('dom-art.css: las animaciones con view() son longhands y el minificador de producción no las pliega en el atajo `animation:`', async (t) => {
  // Chrome rechaza `animation: … view()` (su atajo no admite la línea de tiempo) y lightningcss, que minifica el CSS del build,
  // funde `animation` + `animation-timeline` en ese atajo: en `astro dev` funcionaba y en el dist no (revisión de WP10b).
  const css = readFileSync(new URL('../../src/styles/dom-art.css', import.meta.url), 'utf8');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(/animation-timeline\s*:\s*view\(/.test(code), 'el CSS usa animation-timeline: view()');
  assert.ok(!/(^|[;{\s])animation\s*:[^;}]*view\(/.test(code), 'ningún atajo `animation:` lleva view()');
  let lightningcss;
  try {
    lightningcss = await import('lightningcss');
  } catch {
    t.skip('lightningcss no está instalado');
    return;
  }
  const min = lightningcss.transform({ filename: 'dom-art.css', code: Buffer.from(code), minify: true }).code.toString();
  assert.ok(/animation-timeline:view\(/.test(min), 'tras minificar sigue habiendo animation-timeline: view()');
  assert.deepEqual(min.match(/animation:[^;}]*view\(/g) ?? [], [], 'tras minificar ningún atajo `animation:` lleva view()');
});
