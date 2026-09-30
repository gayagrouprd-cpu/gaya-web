// Palabras de cuadrantes: decodifica el RLE de los módulos generados (scripts/words-pack.mjs) y elige la variante que
// cabe en la rejilla (docs/ascii/DIRECTION.md §5.3, §9 y §12.4). Puro y sin DOM: corre en Vite/Astro y en Node 24
// (solo sintaxis borrable, imports con extensión). Los datos son un módulo por idioma y por palabra y se cargan
// con `await loadWords(lang, ids)`; después `getWords`, `wordMini` y `wordProc` son síncronas.
import type { Lang, SceneId, Variant, Word, WordId, WordSet } from './types.ts';

export type { WordId } from './types.ts';

// ───────────────────────── Formato de los datos generados ─────────────────────────

/** [columnas, filas (con las de acento), filas de acento, RLE blindado en ASCII]. */
export type WordLineData = [cols: number, rows: number, accentRows: number, rle: string];
/** [desplazamiento en columnas de cada línea de la pila, líneas]. */
export type WordVariantData = [offsets: number[], lines: WordLineData[]];
export interface WordData {
  id: WordId;
  lang: Lang;
  variants: Partial<Record<Variant, WordVariantData>>;
}

// ───────────────────────── Palabras por idioma ─────────────────────────

export const WORD_IDS: Readonly<Record<Lang, readonly WordId[]>> = {
  es: ['GAYA', 'HOLA', 'WEB', 'LISTO', 'ECO', 'ON', 'VER', 'TU'],
  en: ['GAYA', 'HELLO', 'WEB', 'READY', 'ECHO', 'ON', 'SEE', 'YOU'],
};

/** Cada palabra española y su equivalente inglesa (lo que pasa de un idioma a otro sin cambiar de cartel). */
const EQUIVALENT: readonly (readonly [WordId, WordId])[] = [
  ['GAYA', 'GAYA'],
  ['HOLA', 'HELLO'],
  ['WEB', 'WEB'],
  ['LISTO', 'READY'],
  ['ECO', 'ECHO'],
  ['ON', 'ON'],
  ['VER', 'SEE'],
  ['TU', 'YOU'],
];

/** La palabra del idioma que corresponde a `id` (p. ej. `LISTO` en `en` es `READY`); lanza si `id` no existe. */
export function wordIdFor(id: WordId, lang: Lang): WordId {
  const pair = EQUIVALENT.find((p) => p[0] === id || p[1] === id);
  if (!pair) throw new Error(`words: «${id}» no es una palabra conocida`);
  return pair[lang === 'es' ? 0 : 1];
}

/** Palabra del cartel (`SceneId`) en el idioma dado; `null` para `mist`, que no lleva palabra. */
export function sceneWord(scene: SceneId, lang: Lang): WordId | null {
  const w: Record<SceneId, WordId | null> = {
    cover: 'GAYA', hola: 'HOLA', mist: null, web: 'WEB', listo: 'LISTO', eco: 'ECO', on: 'ON', ver: 'VER', tu: 'TU',
  };
  const id = w[scene];
  return id ? wordIdFor(id, lang) : null;
}

// ───────────────────────── Blindaje ASCII del RLE ─────────────────────────
// Espejo de `armor()` en scripts/words-pack.mjs (la prueba recorre los 256 valores en los dos sentidos).
// Cada byte del RLE, (cuadrante << 4) | (repeticiones − 1), viaja como UN carácter ASCII; los 168 valores raros
// con el escape A[88] + A[v >> 4] + A[v & 15]. Motivo y tabla de códigos: words-pack.mjs.

const ALPHABET: string = (() => {
  let s = '';
  for (let c = 0x21; c <= 0x7e; c++) if (c !== 0x22 && c !== 0x5c) s += String.fromCharCode(c);
  return s;
})();
const RUN_Q = [0, 15, 3, 12];
const ONE_Q = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
const ESC = 256;
const BYTE_OF = new Int16Array(128).fill(-1); // carácter → byte del RLE (o ESC); -1 = no válido
const INDEX_OF = new Int16Array(128).fill(-1); // carácter → posición en el alfabeto
for (let i = 0; i < ALPHABET.length; i++) {
  const c = ALPHABET.charCodeAt(i);
  INDEX_OF[c] = i;
  BYTE_OF[c] = i < 64 ? (RUN_Q[i >> 4] << 4) | (i & 15) : i < 88 ? (ONE_Q[(i - 64) >> 1] << 4) | ((i - 64) & 1) : i === 88 ? ESC : -1;
}

/** Decodifica un RLE blindado a `n` cuadrantes (0..15). Lanza si la cadena está corrupta o no suma `n` celdas. */
export function decodeRle(s: string, n: number): Uint8Array {
  const out = new Uint8Array(n);
  let k = 0;
  const at = (i: number): number => {
    const c = s.charCodeAt(i);
    return c < 128 ? INDEX_OF[c] : -1;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    let v = c < 128 ? BYTE_OF[c] : -1;
    if (v === ESC) {
      const hi = at(i + 1);
      const lo = at(i + 2);
      if (hi < 0 || hi > 15 || lo < 0 || lo > 15) throw new Error(`words: escape de RLE truncado en la posición ${i}`);
      v = (hi << 4) | lo;
      i += 2;
    }
    if (v < 0) throw new Error(`words: carácter no válido en el RLE (posición ${i})`);
    const run = (v & 15) + 1;
    if (k + run > n) throw new Error(`words: el RLE tiene más de ${n} celdas`);
    out.fill(v >> 4, k, k + run);
    k += run;
  }
  if (k !== n) throw new Error(`words: el RLE tiene ${k} celdas y se esperaban ${n}`);
  return out;
}

// ───────────────────────── Carga y registro de los datos ─────────────────────────

type Loader = () => Promise<{ default: WordData }>;
// Una importación dinámica literal por módulo: Vite las trocea (cada página carga solo las de su idioma) y Node las resuelve igual.
const LOADERS: Record<Lang, Partial<Record<WordId, Loader>>> = {
  es: {
    GAYA: () => import('./data/words.gen.es.GAYA.ts'),
    HOLA: () => import('./data/words.gen.es.HOLA.ts'),
    WEB: () => import('./data/words.gen.es.WEB.ts'),
    LISTO: () => import('./data/words.gen.es.LISTO.ts'),
    ECO: () => import('./data/words.gen.es.ECO.ts'),
    ON: () => import('./data/words.gen.es.ON.ts'),
    VER: () => import('./data/words.gen.es.VER.ts'),
    TU: () => import('./data/words.gen.es.TU.ts'),
  },
  en: {
    GAYA: () => import('./data/words.gen.en.GAYA.ts'),
    HELLO: () => import('./data/words.gen.en.HELLO.ts'),
    WEB: () => import('./data/words.gen.en.WEB.ts'),
    READY: () => import('./data/words.gen.en.READY.ts'),
    ECHO: () => import('./data/words.gen.en.ECHO.ts'),
    ON: () => import('./data/words.gen.en.ON.ts'),
    SEE: () => import('./data/words.gen.en.SEE.ts'),
    YOU: () => import('./data/words.gen.en.YOU.ts'),
  },
};

const DATA = new Map<string, WordData>();
const SETS = new Map<string, WordSet>();
const keyOf = (lang: Lang, id: WordId): string => `${lang}:${id}`;

/** Registra datos ya importados (lo hace `loadWords`; también sirve para pruebas o para incrustar una palabra). */
export function registerWord(d: WordData): void {
  const k = keyOf(d.lang, d.id);
  DATA.set(k, d);
  for (const s of [...SETS.keys()]) if (s.startsWith(k + ':')) SETS.delete(s);
}

/** Importa los datos de las palabras (por defecto, todas las del idioma). Hay que esperarla antes de usar `getWords`. */
export async function loadWords(lang: Lang, ids: readonly WordId[] = WORD_IDS[lang]): Promise<void> {
  await Promise.all(
    ids.map(async (raw) => {
      const id = wordIdFor(raw, lang);
      if (DATA.has(keyOf(lang, id))) return;
      const load = LOADERS[lang][id];
      if (!load) throw new Error(`words: no hay datos de «${id}» en ${lang}`);
      registerWord((await load()).default);
    }),
  );
}

export const isLoaded = (id: WordId, lang: Lang): boolean => DATA.has(keyOf(lang, wordIdFor(id, lang)));

function need(lang: Lang, id: WordId): WordData {
  const d = DATA.get(keyOf(lang, id));
  if (!d) throw new Error(`words: «${id}» (${lang}) no está cargada; haz «await loadWords('${lang}', ['${id}'])» antes`);
  return d;
}

/** Variante decodificada (con caché). Los `Word` se comparten: no mutar `cells`. */
function setOf(lang: Lang, id: WordId, v: Variant): WordSet {
  const k = `${keyOf(lang, id)}:${v}`;
  let s = SETS.get(k);
  if (!s) {
    const d = need(lang, id).variants[v];
    if (!d) throw new Error(`words: «${id}» (${lang}) no tiene la variante ${v}`);
    const [offsets, lines] = d;
    s = {
      variant: v,
      offsets,
      lines: lines.map(([cols, rows, accentRows, rle]): Word => ({ cols, rows, accentRows, cells: decodeRle(rle, cols * rows) })),
    };
    SETS.set(k, s);
  }
  return { variant: s.variant, lines: s.lines, offsets: s.offsets.slice() };
}

// ───────────────────────── Elección de variante (§5.3) ─────────────────────────

/** Margen de seguridad a cada lado de la palabra, en columnas (§5.3: «4 columnas de margen por lado»). */
export const MARGIN_COLS = 4;
/** Filas vacías entre las líneas de una pila (la composición móvil de GAYA: 12 + 2 + 12). */
export const STACK_GAP_ROWS = 2;
/** De la mayor a la menor; `mini` y `proc` no se eligen por ancho (son DOM). */
const ORDER: readonly Variant[] = ['L', 'M', 'S', 'XS'];

/** Ancho del bloque de una palabra (máximo de columna final de sus líneas, con los desplazamientos de la pila). */
export const blockCols = (s: WordSet): number => s.lines.reduce((m, l, i) => Math.max(m, l.cols + (s.offsets[i] ?? 0)), 0);
/** Alto del bloque: suma de las líneas más las filas vacías entre ellas. */
export const stackRows = (s: WordSet): number => s.lines.reduce((a, l) => a + l.rows, 0) + STACK_GAP_ROWS * (s.lines.length - 1);

/** Ancho en columnas de cada variante de una palabra (0 si la variante no existe). Es el `wordCols` de `pickVariant`. */
export function variantCols(id: WordId, lang: Lang): Record<Variant, number> {
  const d = need(lang, wordIdFor(id, lang));
  const out: Record<Variant, number> = { L: 0, M: 0, S: 0, XS: 0, mini: 0, proc: 0 };
  for (const v of Object.keys(out) as Variant[]) {
    const e = d.variants[v];
    if (e) out[v] = e[1].reduce((m, l, i) => Math.max(m, l[0] + (e[0][i] ?? 0)), 0);
  }
  return out;
}

/** Las variantes de canvas de mayor a menor ancho. En TÚ la línea S (52) es más ancha que M (48): manda el ancho, no la etiqueta. */
const bySize = (w: Partial<Record<Variant, number>>): Variant[] =>
  ORDER.filter((v) => (w[v] ?? 0) > 0).sort((a, b) => (w[b] ?? 0) - (w[a] ?? 0) || ORDER.indexOf(a) - ORDER.indexOf(b));

/**
 * La mayor de L · M · S · XS que cabe con 4 columnas de margen por lado (`cols ≥ ancho + 8`). Si ni XS cabe,
 * devuelve `XS`: decidir qué hacer (ocultar el lienzo, §11.2) es cosa del llamador (véase `wordFits`).
 */
export const pickVariant = (cols: number, wordCols: Partial<Record<Variant, number>>): Variant => {
  for (const v of bySize(wordCols)) if (cols >= (wordCols[v] ?? 0) + 2 * MARGIN_COLS) return v;
  return 'XS';
};

/**
 * Las líneas de la palabra (una pila en móvil) con sus desplazamientos, en la variante mayor que cabe en `cols`
 * columnas (con margen) y, si se da `maxRows`, en `stackRows ≤ maxRows` filas. `id` puede ser la palabra de cualquier
 * idioma: se toma su equivalente en `lang`.
 */
export function getWords(id: WordId, lang: Lang, cols: number, maxRows?: number): WordSet {
  const wid = wordIdFor(id, lang);
  const widths = variantCols(wid, lang);
  const order = bySize(widths);
  let i = Math.max(0, order.indexOf(pickVariant(cols, widths)));
  if (maxRows !== undefined) while (i < order.length - 1 && stackRows(setOf(lang, wid, order[i])) > maxRows) i++;
  return setOf(lang, wid, order[i]);
}

/** ¿Cabe la palabra elegida por `getWords` con su margen (y en `maxRows`)? Falso ⇒ ni XS cabe (con < 52 columnas, el lienzo se oculta). */
export function wordFits(id: WordId, lang: Lang, cols: number, maxRows?: number): boolean {
  const s = getWords(id, lang, cols, maxRows);
  return cols >= blockCols(s) + 2 * MARGIN_COLS && (maxRows === undefined || stackRows(s) <= maxRows);
}

/** Cualquier variante por nombre (también `mini` y `proc`), sin elegir por ancho: para herramientas, pruebas y arte en DOM. */
export function wordVariant(id: WordId, lang: Lang, variant: Variant): WordSet {
  return setOf(lang, wordIdFor(id, lang), variant);
}

/** Palabra de 6 filas para el Índice de servicios (DOM, build). */
export function wordMini(id: WordId, lang: Lang): Word {
  return setOf(lang, wordIdFor(id, lang), 'mini').lines[0];
}

/** Palabra de 8 filas para el hilo del Proceso (DOM, build): HOLA·LISTO (ES) o HELLO·READY (EN). */
export function wordProc(id: 'HOLA' | 'LISTO' | 'HELLO' | 'READY', lang: Lang): Word {
  return setOf(lang, wordIdFor(id, lang), 'proc').lines[0];
}

/** Glifo de cada cuadrante 0..15 (bit0=▘ bit1=▝ bit2=▖ bit3=▗); es el `QUAD_GLYPH` de glyphs.ts, copiado para no arrastrar ese módulo (la prueba los compara). */
const QUAD_CHARS = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';

/** El arte de una palabra como texto de cuadrantes, una fila por línea y sin espacios sobrantes a la derecha: el `data-art` del DOM. */
export function wordToText(w: Word): string {
  const rows: string[] = [];
  for (let y = 0; y < w.rows; y++) {
    let s = '';
    for (let x = 0; x < w.cols; x++) s += QUAD_CHARS[w.cells[y * w.cols + x]];
    rows.push(s.trimEnd());
  }
  return rows.join('\n');
}
