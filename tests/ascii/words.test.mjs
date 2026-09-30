// Pruebas de WP3 · Palabras (DIRECTION §5.3, Anexo A.1/A.2, Anexo C.1/C.2, §12.4 y §13).
//   node --test tests/ascii/words.test.mjs
// Corren en Node puro (sin Chrome): comprueban los .txt, el empaquetado, los módulos generados, words.ts y el lint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as pack from '../../scripts/words-pack.mjs';
import { lintText } from '../../scripts/ascii-lint.mjs';
import * as W from '../../src/ascii/words.ts';
import { QUAD_GLYPH, glyphChar } from '../../src/ascii/glyphs.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const { LANGS, WORD_IDS, VARIANTS, A1, A1_ACCENT } = pack;

// ── PRNG determinista para los casos aleatorios ──
const prng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

// ───────────────────────── 0. Antes de cargar nada ─────────────────────────
// (va primero: el registro de palabras es global al proceso)
test('getWords lanza un error claro si la palabra no está cargada', () => {
  assert.throws(() => W.getWords('GAYA', 'es', 160), /no está cargada.*loadWords/);
  assert.equal(W.isLoaded('GAYA', 'es'), false);
});

await W.loadWords('es');
await W.loadWords('en');

// ───────────────────────── 1. RLE (Anexo C.2) ─────────────────────────
test('RLE: ida y vuelta con casos límite (corridas de 1, 16, 17, 32, 33; vacío; todo igual; alternado)', () => {
  const cases = [
    [], [0], [15], Array(16).fill(3), Array(17).fill(3), Array(32).fill(0), Array(33).fill(15),
    Array.from({ length: 64 }, (_, i) => i % 16), Array.from({ length: 50 }, (_, i) => (i % 2 ? 0 : 15)),
  ];
  for (const c of cases) assert.deepEqual([...pack.unrle(pack.rle(Uint8Array.from(c)), c.length)], c);
});

test('RLE: ida y vuelta con 300 cuadrículas aleatorias (con muchas corridas largas)', () => {
  const rnd = prng(7);
  for (let k = 0; k < 300; k++) {
    const n = 1 + Math.floor(rnd() * 400);
    const cells = new Uint8Array(n);
    for (let i = 0; i < n; ) {
      const v = Math.floor(rnd() * 16), run = 1 + Math.floor(rnd() * (rnd() < 0.3 ? 40 : 4));
      for (let j = 0; j < run && i < n; j++) cells[i++] = v;
    }
    const enc = pack.rle(cells);
    assert.ok(enc.every((b) => (b & 15) < 16));
    assert.deepEqual(pack.unrle(enc, n), cells);
  }
});

test('RLE: cada corrida cabe en un byte (máximo 16 repeticiones)', () => {
  assert.equal(pack.rle(new Uint8Array(16)).length, 1);
  assert.equal(pack.rle(new Uint8Array(17)).length, 2);
  assert.equal(pack.rle(new Uint8Array(33)).length, 3);
});

// ───────────────────────── 2. Blindaje ASCII del RLE ─────────────────────────
test('blindaje: los 256 valores de byte van y vuelven (packer en Node ↔ decodificador de words.ts)', () => {
  for (let v = 0; v < 256; v++) {
    const n = (v & 15) + 1;
    const cells = W.decodeRle(pack.armor([v]), n);
    assert.deepEqual([...cells], Array(n).fill(v >> 4), `byte ${v}`);
  }
});

test('blindaje: solo ASCII imprimible sin comillas dobles ni barra invertida; 1 carácter por byte habitual', () => {
  const rnd = prng(3);
  const cells = Uint8Array.from({ length: 4000 }, () => Math.floor(rnd() * 16));
  const a = pack.armor(pack.rle(cells));
  assert.match(a, /^[\x21\x23-\x5b\x5d-\x7e]*$/);
  assert.deepEqual(W.decodeRle(a, cells.length), cells);
  assert.equal(pack.ARMOR_ALPHABET.length, 92);
});

test('blindaje: una cadena corrupta o que no suma las celdas lanza en vez de devolver basura', () => {
  const ok = pack.armor(pack.rle(new Uint8Array(20)));
  assert.doesNotThrow(() => W.decodeRle(ok, 20));
  assert.throws(() => W.decodeRle(ok, 21), /esperaban 21/);
  assert.throws(() => W.decodeRle(ok, 19), /más de 19/);
  assert.throws(() => W.decodeRle('"', 1), /no válido/);
  assert.throws(() => W.decodeRle('\\', 1), /no válido/);
  assert.throws(() => W.decodeRle('é', 1), /no válido/);
  assert.throws(() => W.decodeRle(pack.ARMOR_ALPHABET[88] + pack.ARMOR_ALPHABET[1], 1), /truncado/);
});

// ───────────────────────── 3. Los .txt ─────────────────────────
const files = pack.listWordFiles();
const parsed = new Map(files.map((f) => [`${f.lang}/${f.id}.${f.variant}`, pack.readWordFile(f.file)]));

test('están todas las variantes (L, M, S, XS, mini; proc solo en HOLA·LISTO y HELLO·READY) y no sobra ninguna', () => {
  const want = new Set();
  for (const lang of LANGS) for (const id of WORD_IDS[lang]) for (const v of pack.variantsOf(lang, id)) want.add(`${lang}/${id}.${v}`);
  assert.deepEqual([...parsed.keys()].sort(), [...want].sort());
  assert.equal(want.size, 2 * (8 * 5 + 2));
});

test('cada línea de cada variante tiene tinta en su primera y su última columna y ninguna celda fuera de 0..15', () => {
  for (const [name, w] of parsed)
    for (const l of w.lines) {
      assert.ok(l.cells.every((c) => c >= 0 && c <= 15), name);
      for (const x of [0, l.cols - 1]) {
        let ink = false;
        for (let y = 0; y < l.rows; y++) if (l.cells[y * l.cols + x]) ink = true;
        assert.ok(ink, `${name}: columna ${x} vacía`);
      }
    }
});

test('forma canónica: reescribir un .txt no lo cambia (rectángulo, separadores, salto final)', () => {
  for (const f of files) {
    const text = readFileSync(f.file, 'utf8');
    assert.equal(pack.formatWordText(pack.parseWordText(text, f.file)), text, f.file);
  }
});

test('GAYA, WEB y ON son idénticas en es y en (los dos idiomas las comparten)', () => {
  for (const id of ['GAYA', 'WEB', 'ON'])
    for (const v of pack.variantsOf('es', id)) {
      const a = join(ROOT,`src/ascii/data/words/es/${id}.${v}.txt`), b = join(ROOT, `src/ascii/data/words/en/${id}.${v}.txt`);
      assert.equal(readFileSync(a, 'utf8'), readFileSync(b, 'utf8'), `${id}.${v}`);
    }
});

test('el parser lee pilas (bloques con «---»), desplazamientos y filas de acento de la forma', () => {
  const t = '  ▄▄\n  ██\n---\n▄▄  \n██  \n';
  const p = pack.parseWordText(t);
  assert.equal(p.lines.length, 2);
  assert.deepEqual(p.offsets, [2, 0]);
  assert.deepEqual(p.lines.map((l) => [l.cols, l.rows]), [[2, 2], [2, 2]]);
  assert.equal(pack.formatWordText(p), '  ▄▄\n  ██\n--- \n▄▄  \n██  \n');
  const accent = pack.parseWordText('  █ \n    \n████\n████\n');
  assert.equal(accent.lines[0].accentRows, 2);
  assert.equal(pack.parseWordText('██\n██\n').lines[0].accentRows, 0);
  assert.throws(() => pack.parseWordText('██ x\n'), /no es un cuadrante/);
  assert.throws(() => pack.parseWordText('   \n   \n'), /no tiene tinta/);
});

// ───────────────────────── 4. Módulos generados ─────────────────────────
test('los módulos generados están al día: coinciden byte a byte con lo que produce words-pack desde los .txt', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const want = pack.moduleText(lang, id, pack.loadWord(lang, id));
      assert.equal(readFileSync(pack.moduleFile(lang, id), 'utf8'), want, `${lang} ${id}: ejecuta node scripts/words-pack.mjs`);
    }
});

test('ida y vuelta completa: lo que decodifica words.ts es exactamente lo que dicen los .txt (todas las variantes)', () => {
  let n = 0;
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang])
      for (const v of pack.variantsOf(lang, id)) {
        const set = W.wordVariant(id, lang, v), src = parsed.get(`${lang}/${id}.${v}`);
        assert.equal(set.variant, v);
        assert.deepEqual(set.offsets, src.offsets, `${lang} ${id} ${v} offsets`);
        assert.equal(set.lines.length, src.lines.length);
        set.lines.forEach((l, i) => {
          const s = src.lines[i];
          assert.deepEqual([l.cols, l.rows, l.accentRows], [s.cols, s.rows, s.accentRows], `${lang} ${id} ${v} línea ${i}`);
          assert.deepEqual(l.cells, s.cells, `${lang} ${id} ${v} línea ${i}`);
          assert.equal(l.cells.length, l.cols * l.rows);
          n++;
        });
      }
  assert.ok(n > 100);
});

test('los módulos generados solo usan sintaxis borrable (se pueden importar tal cual en Node y en Vite)', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const text = readFileSync(pack.moduleFile(lang, id), 'utf8');
      assert.match(text, /^import type \{ WordData \} from '\.\.\/words\.ts';$/m);
      // sin mirar dentro de las cadenas de datos
      assert.doesNotMatch(text.replace(/"[^"]*"/g, '""'), /\b(enum|namespace|declare|constructor)\b|@\w+\(/);
    }
});

// ───────────────────────── 5. Tabla A.1 ─────────────────────────
const bodyRows = (l) => l.rows - l.accentRows;
const maxCols = (set) => Math.max(...set.lines.map((l) => l.cols));

test('Tabla A.1 · filas exactas y anchos ±2 columnas en L, M, S, mini y proc (todas las palabras e idiomas)', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const a = A1[id];
      for (const v of ['L', 'M', 'S']) {
        const set = W.wordVariant(id, lang, v);
        for (const l of set.lines) assert.equal(bodyRows(l), a[v][0], `${lang} ${id} ${v}: filas`);
        assert.ok(Math.abs(maxCols(set) - a[v][1]) <= 2, `${lang} ${id} ${v}: ${maxCols(set)} columnas (A.1: ${a[v][1]})`);
      }
      const mini = W.wordMini(id, lang);
      assert.equal(bodyRows(mini), 6, `${lang} ${id} mini`);
      assert.ok(Math.abs(mini.cols - a.mini) <= 2, `${lang} ${id} mini: ${mini.cols} (A.1: ${a.mini})`);
    }
  for (const [lang, id] of [['es', 'HOLA'], ['es', 'LISTO'], ['en', 'HELLO'], ['en', 'READY']]) {
    const p = W.wordProc(id, lang);
    assert.equal(p.rows, 8);
    if (A1[id].proc) assert.ok(Math.abs(p.cols - A1[id].proc) <= 2, `${id} proc: ${p.cols} (A.1: ${A1[id].proc})`);
  }
});

test('Tabla A.1 · XS: las filas de A.1 y nunca más de 44 columnas; S nunca más de 52; M, 88; L, 128', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const xs = W.wordVariant(id, lang, 'XS');
      for (const l of xs.lines) assert.equal(bodyRows(l), A1[id].XS[0], `${lang} ${id} XS filas`);
      const w = W.variantCols(id, lang);
      assert.ok(w.XS <= 44, `${lang} ${id} XS ${w.XS}`);
      assert.ok(w.S <= 52, `${lang} ${id} S ${w.S}`);
      assert.ok(w.M <= 88, `${lang} ${id} M ${w.M}`);
      assert.ok(w.L <= 128, `${lang} ${id} L ${w.L}`);
      // en TÚ la línea S (52) es más ancha que M (48): pickVariant elige por ancho, no por etiqueta
      assert.ok(w.XS < w.S && w.M < w.L && w.S < w.L, `${lang} ${id}: anchos incoherentes (${JSON.stringify(w)})`);
    }
});

test('Tabla A.1 · composición móvil de §5.3: pilas y líneas por palabra', () => {
  const stack = { GAYA: 2, HOLA: 2, WEB: 2, LISTO: 2, ECO: 2, ON: 1, VER: 2, TU: 1, HELLO: 2, READY: 2, ECHO: 2, SEE: 2, YOU: 2 };
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      assert.equal(W.wordVariant(id, lang, 'S').lines.length, stack[id], `${lang} ${id} S`);
      assert.equal(W.wordVariant(id, lang, 'L').lines.length, 1);
      assert.equal(W.wordVariant(id, lang, 'M').lines.length, 1);
    }
  // XS de ON y de TÚ: la línea no cabe en 44 columnas, van en pila
  assert.equal(W.wordVariant('ON', 'es', 'XS').lines.length, 2);
  assert.equal(W.wordVariant('TU', 'es', 'XS').lines.length, 2);
  // GAYA: la 2.ª línea va desplazada 3 columnas (§5.3)
  assert.deepEqual(W.wordVariant('GAYA', 'es', 'S').offsets, [0, 3]);
  const gaya = W.wordVariant('GAYA', 'es', 'S');
  assert.ok(gaya.lines[0].cols >= 47 && gaya.lines[0].cols <= 51, 'GA ≈ 49 columnas');
});

// ───────────────────────── 6. Acentos (TÚ) ─────────────────────────
const inkRow = (l, y) => { for (let x = 0; x < l.cols; x++) if (l.cells[y * l.cols + x]) return true; return false; };

test('TÚ: el acento cuenta en accentRows (L +7, M +5, S +6 según A.1), hay una fila vacía entre acento y cuerpo y el acento tiene tinta', () => {
  for (const v of ['L', 'M', 'S', 'XS', 'mini']) {
    const set = W.wordVariant('TU', 'es', v);
    const u = set.lines[set.lines.length - 1]; // la Ú (en la pila XS es la 2.ª línea)
    assert.ok(u.accentRows >= 2, `TU ${v}: accentRows ${u.accentRows}`);
    assert.equal(inkRow(u, u.accentRows - 1), false, `TU ${v}: falta la fila vacía bajo el acento`);
    assert.equal(inkRow(u, u.accentRows), true, `TU ${v}: el cuerpo no empieza donde dice accentRows`);
    let ink = 0;
    for (let y = 0; y < u.accentRows - 1; y++) if (inkRow(u, y)) ink++;
    assert.ok(ink >= 1, `TU ${v}: el acento no tiene tinta`);
    if (A1_ACCENT[v]) assert.ok(Math.abs(u.accentRows - A1_ACCENT[v]) <= 1, `TU ${v}: acento ${u.accentRows} (A.1: +${A1_ACCENT[v]})`);
  }
  // la T de la pila XS no lleva acento
  assert.equal(W.wordVariant('TU', 'es', 'XS').lines[0].accentRows, 0);
  // filas de la mayúscula sin acento: las de A.1
  assert.equal(W.wordVariant('TU', 'es', 'L').lines[0].rows, 17 + W.wordVariant('TU', 'es', 'L').lines[0].accentRows);
});

test('ninguna otra palabra lleva acento (accentRows = 0 y ninguna fila vacía a mitad de letra)', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      if (id === 'TU') continue;
      for (const v of pack.variantsOf(lang, id))
        for (const l of W.wordVariant(id, lang, v).lines) {
          assert.equal(l.accentRows, 0, `${lang} ${id} ${v}`);
          for (let y = 0; y < l.rows; y++) assert.ok(inkRow(l, y), `${lang} ${id} ${v}: fila ${y} vacía`);
        }
    }
});

// ───────────────────────── 7. Peso (A.2) ─────────────────────────
test('peso: ≤ 5,3 KB gzip por idioma (flujo único L+M+S+XS+mini, como mide A.2)', async (t) => {
  for (const lang of LANGS) {
    const loaded = {}, texts = {};
    for (const id of WORD_IDS[lang]) { loaded[id] = pack.loadWord(lang, id); texts[id] = pack.moduleText(lang, id, loaded[id]); }
    const w = await pack.weights(lang, loaded, texts);
    t.diagnostic(`${lang}: A.2 ${w.a2Raw} B → ${w.a2Gz} gz · con proc ${w.allGz} gz · módulos minificados ${w.modulesGz} gz (${w.modulesRaw} B)`);
    assert.ok(w.a2Gz <= 5300, `${lang}: ${w.a2Gz} B gzip > 5300`);
  }
});

// ───────────────────────── 8. Lint de glifos ─────────────────────────
test('ascii-lint: verde sobre el repositorio (criterio e)', () => {
  const r = spawnSync(process.execPath, ['scripts/ascii-lint.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /verde/);
});

test('ascii-lint: rechaza glifos fuera de ALLOWED_ART_CHARS en .txt, data-art y emblemas', () => {
  const txt = (s) => lintText('word', s, 't.txt');
  assert.equal(txt('██ ██\n██ ██\n').length, 0);
  assert.ok(txt('██ → ██\n').some((f) => f.ch === '→'));
  assert.ok(txt('██ ● █\n').some((f) => f.ch === '●'));
  assert.ok(txt('██ é █\n').some((f) => f.ch === 'é'));
  assert.ok(txt('██ a █\n').some((f) => /cuadrante/.test(f.why)), 'una letra ASCII no es un cuadrante');
  assert.ok(txt('██ ██\n██ █\n').some((f) => /ancho no constante/.test(f.why)));
  assert.ok(txt('⣿⣿ ██\n').some((f) => f.ch === '⣿'), 'Braille');
  assert.ok(txt('██ ✓ ██\n').some((f) => f.ch === '✓'));
  assert.ok(lintText('data-art', '<span data-art="ab\n█▀ ✓ █">x</span>').some((f) => f.ch === '✓' && f.line === 2));
  assert.equal(lintText('data-art', '<span data-art="█▀▄ ─┼─ ░▒▓ · ¯">x</span>').length, 0);
  assert.equal(lintText('data-art', '<span data-art={art}></span>').length, 0);
  assert.ok(lintText('emblems', "export const E = ['████ ●'];").some((f) => f.ch === '●'));
  assert.equal(lintText('emblems', "export const E = ['████', 'Panadería']; // → ✓ en un comentario").length, 0, 'el texto y los comentarios no son arte');
  // todos los glifos de los cuadrantes de glyphs.ts pasan
  for (const g of QUAD_GLYPH) assert.equal(lintText('data-art', `<i data-art="${glyphChar(g)}"></i>`).length, 0);
});

// ───────────────────────── 9. Elección de variante (§5.3) ─────────────────────────
const TYPICAL = ['GAYA', 'HOLA', 'WEB', 'LISTO', 'ECO', 'VER', 'GAYA', 'HELLO', 'ECHO', 'YOU']; // palabras anchas típicas: L de 121–125 columnas

test('pickVariant: respeta «4 columnas de margen por lado» (cols ≥ ancho + 8) y elige siempre la mayor que cabe', () => {
  assert.equal(W.MARGIN_COLS, 4);
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const w = W.variantCols(id, lang);
      for (let cols = 30; cols <= 220; cols++) {
        const v = W.pickVariant(cols, w);
        // la más ancha que cabe (en TÚ, S mide 52 y M 48)
        const fits = ['L', 'M', 'S', 'XS'].filter((x) => cols >= w[x] + 8).sort((a, b) => w[b] - w[a]);
        if (fits.length) assert.equal(v, fits[0], `${lang} ${id} @${cols}`);
        else assert.equal(v, 'XS', `${lang} ${id} @${cols} (ninguna cabe → XS)`);
        if (v !== 'XS' || fits.length) assert.ok(cols >= w[v] + 8, `${lang} ${id} @${cols}: ${v} sin margen`);
      }
      // los umbrales de la tabla: L 133–136 (para las típicas), M ≤ 96, S ≤ 60, XS ≤ 52
      assert.ok(w.M + 8 <= 96 && w.S + 8 <= 60 && w.XS + 8 <= 52, `${lang} ${id} umbrales ${JSON.stringify(w)}`);
      assert.ok(w.L + 8 <= 136, `${lang} ${id} L ${w.L + 8}`);
    }
  // el borde exacto, con números redondos
  const w = { L: 100, M: 80, S: 50, XS: 40, mini: 0, proc: 0 };
  assert.equal(W.pickVariant(108, w), 'L');
  assert.equal(W.pickVariant(107, w), 'M');
  assert.equal(W.pickVariant(88, w), 'M');
  assert.equal(W.pickVariant(87, w), 'S');
  assert.equal(W.pickVariant(58, w), 'S');
  assert.equal(W.pickVariant(57, w), 'XS');
  assert.equal(W.pickVariant(48, w), 'XS');
  assert.equal(W.pickVariant(3, w), 'XS');
});

test('pickVariant: tabla «variante efectiva por viewport» de §5.3 (columnas del motor tras el tier)', () => {
  const viewport = [
    [53, 'XS', '320×568'], [60, 'S', '360×800 (A07)'], [62, 'S', '375×812'], [65, 'S', '390×844'], [68, 'S', '412×915'], [69, 'S', '414×896'],
    [100, 'M', '600×960 · 900×900'], [106, 'M', '640×960'], [109, 'M', '768×1024 (tier 7×14)'], [113, 'M', '1024×768'], [128, 'M', '1152×864'],
    [133, 'L', '1600×900'], [142, 'L', '1280×720'], [151, 'L', '1366×768'], [160, 'L', '1440×900 · 1920×1080'], [177, 'L', '1599×900'],
  ];
  for (const lang of LANGS)
    for (const id of TYPICAL.filter((i) => WORD_IDS[lang].includes(i))) {
      const w = W.variantCols(id, lang);
      for (const [cols, want, label] of viewport) assert.equal(W.pickVariant(cols, w), want, `${lang} ${id} ${label} (${cols} cols)`);
    }
  // y toda palabra cabe en algo a partir de 52 columnas y usa L en 1280×720 (cierra el hueco de CI-6)
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      assert.ok(W.wordFits(id, lang, 52), `${lang} ${id} @52`);
      assert.equal(W.getWords(id, lang, 142).variant, 'L', `${lang} ${id} 1280×720`);
      assert.equal(W.getWords(id, lang, 60).variant, 'S', `${lang} ${id} 360×800`);
      assert.ok(!W.wordFits(id, lang, 25), `${lang} ${id} @25 no cabe`);
    }
});

test('getWords: devuelve la variante elegida con sus líneas y desplazamientos; maxRows baja de variante', () => {
  const l = W.getWords('GAYA', 'es', 160, 50);
  assert.equal(l.variant, 'L');
  assert.equal(l.lines.length, 1);
  assert.equal(l.lines[0].rows, 16);
  assert.equal(W.getWords('GAYA', 'es', 160, 12).variant, 'M'); // L mide 16 filas; M, 11
  assert.equal(W.getWords('GAYA', 'es', 60).variant, 'S');
  const s = W.getWords('GAYA', 'es', 60, 66);
  assert.equal(s.lines.length, 2);
  assert.equal(W.stackRows(s), 12 + W.STACK_GAP_ROWS + 12);
  assert.equal(W.getWords('GAYA', 'es', 60, 25).variant, 'XS'); // S mide 26 con su hueco; XS, 22
  assert.ok(W.wordFits('GAYA', 'es', 60, 66));
  assert.ok(!W.wordFits('GAYA', 'es', 60, 5));
  // el bloque de una pila incluye los desplazamientos
  assert.equal(W.blockCols(s), Math.max(s.lines[0].cols, s.lines[1].cols + s.offsets[1]));
  // TÚ: acento incluido en las filas
  const tu = W.getWords('TU', 'es', 160, 50);
  assert.equal(tu.lines[0].rows, 24);
  assert.equal(tu.lines[0].accentRows, 7);
});

test('getWords devuelve copias seguras: mutar los desplazamientos no afecta a la siguiente llamada', () => {
  const a = W.getWords('GAYA', 'es', 60);
  a.offsets[1] = 99;
  assert.deepEqual(W.getWords('GAYA', 'es', 60).offsets, [0, 3]);
  assert.deepEqual(W.getWords('HOLA', 'es', 160), W.getWords('HOLA', 'es', 160));
});

// ───────────────────────── 10. Idiomas, equivalencias, mini y proc ─────────────────────────
test('equivalencias es↔en: LISTO↔READY, HOLA↔HELLO, ECO↔ECHO, VER↔SEE, TU↔YOU; sceneWord por cartel', () => {
  assert.equal(W.wordIdFor('LISTO', 'en'), 'READY');
  assert.equal(W.wordIdFor('READY', 'es'), 'LISTO');
  assert.equal(W.wordIdFor('GAYA', 'en'), 'GAYA');
  assert.equal(W.wordIdFor('TU', 'en'), 'YOU');
  assert.throws(() => W.wordIdFor('NOPE', 'es'), /no es una palabra conocida/);
  const scenes = { cover: ['GAYA', 'GAYA'], hola: ['HOLA', 'HELLO'], web: ['WEB', 'WEB'], listo: ['LISTO', 'READY'], eco: ['ECO', 'ECHO'], on: ['ON', 'ON'], ver: ['VER', 'SEE'], tu: ['TU', 'YOU'] };
  for (const [s, [es, en]] of Object.entries(scenes)) { assert.equal(W.sceneWord(s, 'es'), es); assert.equal(W.sceneWord(s, 'en'), en); }
  assert.equal(W.sceneWord('mist', 'es'), null);
  // pedir la palabra española en inglés da la inglesa
  assert.deepEqual(W.getWords('LISTO', 'en', 160), W.getWords('READY', 'en', 160));
  assert.equal(W.getWords('LISTO', 'en', 160).lines[0].cols, W.variantCols('READY', 'en').L);
  for (const lang of LANGS) assert.equal(WORD_IDS[lang].length, 8);
});

test('wordMini (6 filas) y wordProc (8 filas, solo HOLA·LISTO y HELLO·READY)', () => {
  for (const lang of LANGS) for (const id of WORD_IDS[lang]) assert.equal(bodyRows(W.wordMini(id, lang)), 6);
  assert.equal(W.wordMini('TU', 'es').accentRows >= 2, true);
  assert.equal(W.wordMini('ECO', 'es').cols, 34);
  assert.equal(W.wordProc('HOLA', 'es').rows, 8);
  assert.equal(W.wordProc('LISTO', 'es').rows, 8);
  assert.equal(W.wordProc('HOLA', 'en').cols, W.wordProc('HELLO', 'en').cols); // HOLA en inglés es HELLO
  assert.equal(W.wordProc('LISTO', 'en').cols, W.wordProc('READY', 'en').cols);
  assert.notEqual(W.wordProc('HOLA', 'es').cols, W.wordProc('HOLA', 'en').cols);
  assert.throws(() => W.wordProc('GAYA', 'es'), /no tiene la variante proc/);
});

test('wordToText: el arte de una palabra como texto de cuadrantes (data-art) coincide con el .txt y pasa el lint', () => {
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang]) {
      const text = W.wordToText(W.wordMini(id, lang));
      const src = parsed.get(`${lang}/${id}.mini`).lines[0];
      assert.equal(text.split('\n').length, src.rows);
      for (const row of text.split('\n')) assert.equal(row, row.trimEnd());
      assert.equal(lintText('data-art', `<span data-art="${text}"></span>`).length, 0, `${lang} ${id}`);
      // ida y vuelta: el texto vuelve a las mismas celdas
      const back = pack.parseWordText(text + '\n', 'wordToText').lines[0];
      assert.deepEqual(back.cells, src.cells, `${lang} ${id}`);
    }
  assert.equal(W.wordToText({ cols: 2, rows: 2, accentRows: 0, cells: Uint8Array.from([15, 3, 0, 12]) }), '█▀\n ▄');
  // los 16 cuadrantes de words.ts, de words-pack.mjs y de glyphs.ts son el mismo alfabeto en el mismo orden
  const all = W.wordToText({ cols: 16, rows: 1, accentRows: 0, cells: Uint8Array.from({ length: 16 }, (_, i) => i) });
  assert.deepEqual([...all], QUAD_GLYPH.map(glyphChar));
  assert.deepEqual([...all], pack.QUAD);
});

test('contrato de §12.4: las firmas exportadas existen', () => {
  for (const name of ['getWords', 'wordMini', 'wordProc', 'pickVariant']) assert.equal(typeof W[name], 'function', name);
  assert.equal(W.getWords.length >= 3, true);
  assert.equal(W.pickVariant.length, 2);
  assert.equal(W.wordMini.length, 2);
  assert.equal(W.wordProc.length, 2);
  const src = readdirSync(join(ROOT, 'src/ascii/data')).filter((f) => f.startsWith('words.gen.'));
  assert.equal(src.length, 16, 'un módulo por idioma y por palabra');
});
