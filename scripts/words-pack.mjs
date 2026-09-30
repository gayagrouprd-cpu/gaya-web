#!/usr/bin/env node
// Empaquetador de palabras (DIRECTION §5.3 y Anexo C.2): lee los `.txt` de arte de cuadrantes
// (src/ascii/data/words/<lang>/<ID>.<variante>.txt, FUENTE DE VERDAD, editables a mano),
// los comprime a RLE de 1 byte por corrida y escribe un módulo por idioma y por palabra
// (src/ascii/data/words.gen.<lang>.<id>.ts). Corre en Node puro; no toca el navegador.
//
// Formato de un `.txt` (WYSIWYG: lo que se ve en el editor es lo que se dibuja):
//   · solo espacio y los cuadrantes ` ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█`, un rectángulo de ancho constante por fila;
//   · una palabra en línea es un bloque; una PILA (móvil) son varios bloques separados por una línea `---`;
//   · el desplazamiento de cada línea de la pila se lee de los espacios a la izquierda del bloque
//     (se resta el mínimo); las columnas vacías de los bordes de cada bloque se recortan;
//   · el acento (TÚ) son las filas de tinta por encima de la última banda de tinta contigua
//     (acento + la fila vacía que lo separa del cuerpo): `accentRows` sale de la forma, no de un dato aparte.
//
// Uso:
//   node scripts/words-pack.mjs              empaqueta y escribe los módulos generados + tabla de pesos
//   node scripts/words-pack.mjs --check      no escribe: falla si algún módulo generado no está al día
//   node scripts/words-pack.mjs --normalize  reescribe los .txt en forma canónica (rectángulo, separadores, salto final)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants as zc } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORDS_DIR = join(ROOT, 'src/ascii/data/words');
export const DATA_DIR = join(ROOT, 'src/ascii/data');

/** bit0=▘ bit1=▝ bit2=▖ bit3=▗ (igual que `Word.cells` de types.ts y `QUAD_GLYPH` de glyphs.ts). */
export const QUAD = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];
const QUAD_INDEX = new Map(QUAD.map((c, i) => [c, i]));
export const SEPARATOR = '---';

export const LANGS = ['es', 'en'];
export const WORD_IDS = {
  es: ['GAYA', 'HOLA', 'WEB', 'LISTO', 'ECO', 'ON', 'VER', 'TU'],
  en: ['GAYA', 'HELLO', 'WEB', 'READY', 'ECHO', 'ON', 'SEE', 'YOU'],
};
/** Orden canónico de variantes (también el del flujo único que se mide). */
export const VARIANTS = ['L', 'M', 'S', 'XS', 'mini', 'proc'];
/** `proc` solo existe para las palabras del hilo del Proceso (ES HOLA·LISTO, EN HELLO·READY). */
export const PROC_IDS = { es: ['HOLA', 'LISTO'], en: ['HELLO', 'READY'] };
export const variantsOf = (lang, id) => VARIANTS.filter((v) => v !== 'proc' || PROC_IDS[lang].includes(id));

/**
 * Tabla A.1 del Anexo A (Bricolage 800, cuadrantes 2×2, celda 1:2) [M]: ancho en columnas de la palabra
 * (máximo de las líneas, sin desplazamiento) y filas de la mayúscula (sin acento). XS y proc: solo filas salvo donde el Anexo dice más.
 *   L/M: { rows, cols } · S: { rows, cols, stack|line } · XS: { rows } · mini: { cols } (6 filas) · proc: { cols } (8 filas)
 */
export const A1 = {
  GAYA: { L: [16, 121], M: [11, 84], S: [12, 49], XS: [10, null], mini: 46 },
  HOLA: { L: [16, 122], M: [11, 84], S: [13, 51], XS: [11, null], mini: 46, proc: 61 },
  WEB: { L: [18, 124], M: [12, 83], S: [10, 48], XS: [9, null], mini: 42 },
  LISTO: { L: [16, 124], M: [11, 85], S: [13, 52], XS: [11, null], mini: 47, proc: 62 },
  ECO: { L: [22, 124], M: [15, 84], S: [14, 50], XS: [12, null], mini: 34 },
  ON: { L: [22, 90], M: [16, 66], S: [12, 50], XS: [14, null], mini: 25 },
  VER: { L: [21, 125], M: [14, 84], S: [13, 50], XS: [11, null], mini: 36 },
  TU: { L: [17, 63], M: [13, 48], S: [14, 52], XS: [14, null], mini: 22 },
  HELLO: { L: [14, 122], M: [10, 88], S: [9, 49], XS: [8, null], mini: 53 },
  READY: { L: [12, 120], M: [8, 80], S: [8, 48], XS: [7, null], mini: 60 },
  ECHO: { L: [16, 124], M: [11, 85], S: [13, 51], XS: [11, null], mini: 47 },
  SEE: { L: [22, 119], M: [16, 87], S: [14, 50], XS: [12, null], mini: 33 },
  YOU: { L: [21, 124], M: [14, 83], S: [13, 50], XS: [11, null], mini: 36 },
};
/** Acento de TÚ en filas (A.1): L +7, M +5, S línea +6. */
export const A1_ACCENT = { L: 7, M: 5, S: 6 };

// ───────────────────────── RLE (Anexo C.2) ─────────────────────────

/** 1 byte por corrida: (cuadrante << 4) | (repeticiones − 1), hasta 16 repeticiones. */
export const rle = (cells) => {
  const out = [];
  for (let i = 0, j; i < cells.length; i = j) {
    j = i;
    while (j < cells.length && cells[j] === cells[i] && j - i < 16) j++;
    out.push((cells[i] << 4) | (j - i - 1));
  }
  return Uint8Array.from(out);
};
export const unrle = (b, n) => {
  const out = new Uint8Array(n);
  let k = 0;
  for (const v of b) for (let r = 0; r <= (v & 15); r++) out[k++] = v >> 4;
  return out;
};

// ───────────────────────── Lectura y escritura de los .txt ─────────────────────────

/** Errores de formato con el nombre del archivo y la línea (los usa también el lint). */
export class WordFormatError extends Error {}

/**
 * Analiza el texto de un `.txt`. Devuelve { lines: [{cols, rows, accentRows, cells}], offsets, width, height }
 * con las columnas vacías de los bordes de cada bloque ya recortadas.
 */
export function parseWordText(text, name = '(texto)') {
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  while (raw.length && raw[raw.length - 1] === '') raw.pop();
  const blocks = [[]];
  raw.forEach((row, i) => {
    if (row.trimEnd() === SEPARATOR) blocks.push([]);
    else blocks[blocks.length - 1].push({ row, n: i + 1 });
  });
  const width = Math.max(0, ...raw.filter((r) => r.trimEnd() !== SEPARATOR).map((r) => [...r].length));
  const parsed = blocks.map((rowsOf, b) => {
    if (!rowsOf.length) throw new WordFormatError(`${name}: el bloque ${b + 1} está vacío`);
    const rows = rowsOf.map(({ row, n }) => {
      const chars = [...row];
      while (chars.length < width) chars.push(' ');
      return chars.map((ch, x) => {
        const q = QUAD_INDEX.get(ch);
        if (q === undefined) throw new WordFormatError(`${name}:${n}:${x + 1}: «${ch}» (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) no es un cuadrante`);
        return q;
      });
    });
    let minL = width, maxR = -1;
    rows.forEach((r) => r.forEach((q, x) => { if (q) { if (x < minL) minL = x; if (x > maxR) maxR = x; } }));
    if (maxR < 0) throw new WordFormatError(`${name}: el bloque ${b + 1} no tiene tinta`);
    const cols = maxR - minL + 1;
    const cells = new Uint8Array(cols * rows.length);
    rows.forEach((r, y) => r.slice(minL, maxR + 1).forEach((q, x) => { cells[y * cols + x] = q; }));
    return { cols, rows: rows.length, accentRows: accentRowsOf(cells, cols, rows.length), cells, minL };
  });
  const base = Math.min(...parsed.map((p) => p.minL));
  return {
    lines: parsed.map(({ cols, rows, accentRows, cells }) => ({ cols, rows, accentRows, cells })),
    offsets: parsed.map((p) => p.minL - base),
    width,
    height: Math.max(...parsed.map((p) => p.rows)),
  };
}

/** Filas por encima de la última banda de tinta contigua (acento + fila vacía que lo separa del cuerpo). */
export function accentRowsOf(cells, cols, rows) {
  const ink = (y) => { for (let x = 0; x < cols; x++) if (cells[y * cols + x]) return true; return false; };
  let last = rows - 1;
  while (last >= 0 && !ink(last)) last--;
  if (last < 0) return 0;
  let first = last;
  while (first > 0 && ink(first - 1)) first--;
  return first;
}

export const readWordFile = (file) => parseWordText(readFileSync(file, 'utf8'), file);

/** Forma canónica del archivo: rectángulo de ancho constante, bloques separados por `---`, salto de línea final. */
export function formatWordText({ lines, offsets }) {
  const width = Math.max(...lines.map((l, i) => l.cols + offsets[i]));
  const block = (l, off) => Array.from({ length: l.rows }, (_, y) => {
    let s = ' '.repeat(off);
    for (let x = 0; x < l.cols; x++) s += QUAD[l.cells[y * l.cols + x]];
    return s.padEnd(width, ' ');
  }).join('\n');
  return lines.map((l, i) => block(l, offsets[i])).join('\n' + SEPARATOR.padEnd(width, ' ') + '\n') + '\n';
}

export function listWordFiles() {
  const out = [];
  for (const lang of LANGS) {
    const dir = join(WORDS_DIR, lang);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      const m = /^([A-Z]+)\.(L|M|S|XS|mini|proc)\.txt$/.exec(f);
      if (m) out.push({ lang, id: m[1], variant: m[2], file: join(dir, f) });
    }
  }
  return out;
}

export const wordFile = (lang, id, variant) => join(WORDS_DIR, lang, `${id}.${variant}.txt`);

// ───────────────────────── Módulos generados ─────────────────────────

export const moduleFile = (lang, id) => join(DATA_DIR, `words.gen.${lang}.${id}.ts`);

/** Datos de una palabra (todas sus variantes) listos para serializar. */
export function loadWord(lang, id) {
  const variants = {};
  for (const v of variantsOf(lang, id)) {
    const file = wordFile(lang, id, v);
    if (!existsSync(file)) {
      if (v === 'proc') continue;
      throw new WordFormatError(`falta ${file}`);
    }
    const w = readWordFile(file);
    variants[v] = {
      offsets: w.offsets,
      lines: w.lines.map((l) => ({ cols: l.cols, rows: l.rows, accentRows: l.accentRows, rle: rle(l.cells) })),
    };
  }
  return variants;
}

// ── «Blindaje» ASCII del RLE ──
// Los bytes del RLE comprimen bien con gzip porque su distribución está muy sesgada; en base64 o en hex ese sesgo se
// pierde (el módulo servido pesaba el doble). Se reetiqueta cada byte con UN carácter ASCII imprimible (biyección fija,
// sin tabla de datos): gzip ve la misma distribución y el módulo gzip-ea casi como el binario.
//   alfabeto A = los 92 ASCII de U+0021 a U+007E sin «"» ni «\» (van en una cadena entre comillas dobles)
//   i < 64        → q = [0, 15, 3, 12][i >> 4] (vacío, lleno, ▀, ▄), repeticiones = (i & 15) + 1
//   64 ≤ i < 88   → j = i − 64: q = [1,2,4,5,6,7,8,9,10,11,13,14][j >> 1], repeticiones = (j & 1) + 1
//   A[88] + A[v >> 4] + A[v & 15]  → escape: el byte v tal cual (los 168 valores que no tienen carácter propio)
// Las corridas largas solo se dan en vacío, lleno, ▀ y ▄; el resto de cuadrantes casi nunca se repite en horizontal.
export const ARMOR_ALPHABET = Array.from({ length: 0x7e - 0x21 + 1 }, (_, i) => String.fromCharCode(0x21 + i))
  .filter((c) => c !== '"' && c !== '\\')
  .join('');
const RUN_Q = [0, 15, 3, 12];
const ONE_Q = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
const DIRECT = new Map();
for (let i = 0; i < 64; i++) DIRECT.set((RUN_Q[i >> 4] << 4) | (i & 15), ARMOR_ALPHABET[i]);
for (let j = 0; j < 24; j++) DIRECT.set((ONE_Q[j >> 1] << 4) | (j & 1), ARMOR_ALPHABET[64 + j]);
export const armor = (bytes) => {
  let s = '';
  for (const v of bytes) s += DIRECT.get(v) ?? ARMOR_ALPHABET[88] + ARMOR_ALPHABET[v >> 4] + ARMOR_ALPHABET[v & 15];
  return s;
};

/** Texto del módulo TypeScript generado (determinista; solo sintaxis borrable). */
export function moduleText(lang, id, variants) {
  const body = Object.entries(variants)
    .map(([v, d]) => {
      const lines = d.lines.map((l) => `[${l.cols}, ${l.rows}, ${l.accentRows}, "${armor(l.rle)}"]`).join(', ');
      return `    ${v}: [[${d.offsets.join(', ')}], [${lines}]],`;
    })
    .join('\n');
  return `// GENERADO por scripts/words-pack.mjs desde src/ascii/data/words/${lang}/${id}.*.txt. No editar a mano:
// retoca los .txt (son la fuente de verdad) y ejecuta \`node scripts/words-pack.mjs\`.
// Cada variante: [desplazamientos de las líneas, [[columnas, filas, filas de acento, RLE blindado]]] (formato en words.ts).
import type { WordData } from '../words.ts';

const data: WordData = {
  id: '${id}',
  lang: '${lang}',
  variants: {
${body}
  },
};
export default data;
`;
}

/**
 * Flujo único de RLE de un idioma (la medida del Anexo A.2). Orden: por variante y, dentro de cada una, por palabra
 * (las variantes parecidas quedan juntas y gzip las aprovecha). `set`: las variantes del canvas y del Índice que
 * mide A.2 (L, M, S, XS, mini); `proc` (hilo del Proceso, DOM) se mide aparte.
 */
export function languageStream(lang, loaded, set = ['L', 'M', 'S', 'XS', 'mini']) {
  const parts = [];
  for (const v of set) for (const id of WORD_IDS[lang]) for (const l of loaded[id][v]?.lines ?? []) parts.push(l.rle);
  return Buffer.concat(parts);
}
export const gz = (buf) => gzipSync(buf, { level: 9 }).length;
export const br = (buf) => brotliCompressSync(buf, { params: { [zc.BROTLI_PARAM_QUALITY]: 11 } }).length;

/** Lo que sirve el sitio: el módulo minificado y sin tipos (esbuild si está instalado; si no, sin comentarios ni anotaciones). */
export async function servedText(text) {
  try {
    const { transform } = await import('esbuild');
    return (await transform(text, { loader: 'ts', minify: true, format: 'esm' })).code;
  } catch {
    return text.replace(/^\/\/.*$/gm, '').replace(/^import type.*$/m, '').replace(': WordData', '');
  }
}

/** Pesos por idioma: flujo único (A.2), con y sin `proc`, y módulos tal como se sirven (uno por palabra). */
export async function weights(lang, loaded, texts) {
  const a2 = languageStream(lang, loaded);
  const all = languageStream(lang, loaded, VARIANTS);
  const modules = await Promise.all(WORD_IDS[lang].map(async (id) => Buffer.from(await servedText(texts[id]))));
  return {
    a2Raw: a2.length,
    a2Gz: gz(a2),
    a2Br: br(a2),
    allRaw: all.length,
    allGz: gz(all),
    modulesRaw: modules.reduce((a, b) => a + b.length, 0),
    modulesGz: modules.reduce((a, b) => a + gz(b), 0),
    modulesBr: modules.reduce((a, b) => a + br(b), 0),
  };
}

// ───────────────────────── CLI ─────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const normalize = args.includes('--normalize');
  let bad = 0;

  if (normalize) {
    for (const f of listWordFiles()) {
      const before = readFileSync(f.file, 'utf8');
      const after = formatWordText(readWordFile(f.file));
      if (before !== after) { writeFileSync(f.file, after); console.log(`normalizado ${f.file}`); }
    }
  }

  for (const lang of LANGS) {
    const loaded = {}, texts = {};
    for (const id of WORD_IDS[lang]) {
      loaded[id] = loadWord(lang, id);
      texts[id] = moduleText(lang, id, loaded[id]);
      const file = moduleFile(lang, id);
      const cur = existsSync(file) ? readFileSync(file, 'utf8') : null;
      if (cur === texts[id]) continue;
      if (check) { console.error(`DESACTUALIZADO: ${file}`); bad++; continue; }
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, texts[id]);
      console.log(`escrito ${file}`);
    }
    const w = await weights(lang, loaded, texts);
    const kb = (n) => (n / 1000).toFixed(2).replace('.', ',');
    console.log(
      `${lang.toUpperCase()}  flujo único A.2 (L·M·S·XS·mini): ${w.a2Raw} B → ${w.a2Gz} gz (${kb(w.a2Gz)} KB) · ${w.a2Br} br   ` +
        `con proc: ${w.allRaw} B → ${w.allGz} gz (${kb(w.allGz)} KB)\n` +
        `    módulos minificados, tal como se sirven (${WORD_IDS[lang].length}): ${w.modulesRaw} B → ${w.modulesGz} gz (${kb(w.modulesGz)} KB) · ${w.modulesBr} br`,
    );
  }
  // GAYA, WEB y ON se repiten en los dos idiomas: que no diverjan sin querer.
  for (const id of ['GAYA', 'WEB', 'ON'])
    for (const v of VARIANTS) {
      const [a, b] = LANGS.map((l) => wordFile(l, id, v));
      if (existsSync(a) && existsSync(b) && readFileSync(a, 'utf8') !== readFileSync(b, 'utf8')) console.warn(`aviso: ${id}.${v}.txt difiere entre es y en`);
    }
  if (bad) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
