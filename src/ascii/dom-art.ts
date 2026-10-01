// Arte en DOM (docs/ascii/DIRECTION.md §5.10): convierte palabras y reglas en las cadenas de `data-art` que pintan los
// componentes Rule, WordMini, ProcessThread y PosterSsr. Puro y sin DOM: corre durante el build de Astro y directamente en
// Node 24 (solo sintaxis borrable, imports con extensión). Todo el arte sale de aquí como TEXTO; el CSS lo pinta con
// `::before { content: attr(data-art) }` (ascii.css), así que axe y Lighthouse no lo evalúan (R03 §1.8) y nunca entra al árbol
// de accesibilidad.
import type { GridSpec, Word } from './types.ts';
import { ALLOWED_ART_CHARS } from './glyphs.ts';
import { wordToText } from './words.ts';

// ───────────────────────── Reglas ─────────────────────────

/** Cada cuántas celdas lleva la regla su cruce «┼» (§5.10). */
export const RULE_PERIOD = 8;
/** Columnas de una regla: sobra para el ancho máximo de contenido a la celda más pequeña (6 px → 3 840 px de pantalla). El CSS recorta. */
export const RULE_COLS = 240;

/** «─┼───────┼───────┼…»: `┼` en las columnas 1, 9, 17… (el ejemplo de §4.3). */
export function ruleText(cols: number = RULE_COLS, period: number = RULE_PERIOD): string {
  let s = '';
  for (let i = 0; i < cols; i++) s += i % period === 1 ? '┼' : '─';
  return s;
}

/** Riel vertical de `rows` filas con el glifo dado (`│` fino para el hilo apagado, `┃` grueso para el encendido). */
export function railText(rows: number, glyph: '│' | '┃' = '│'): string {
  return Array.from({ length: rows }, () => glyph).join('\n');
}

// ───────────────────────── Palabras ─────────────────────────

/** El arte de una palabra de cuadrantes como texto (una fila por línea, sin espacios a la derecha): el `data-art` del DOM. */
export const wordArt = (w: Word): string => wordToText(w);

/** Columnas de la palabra sin ninguna tinta (separan las letras): candidatas de corte. */
export function emptyColumns(w: Word): number[] {
  const out: number[] = [];
  for (let x = 0; x < w.cols; x++) {
    let ink = false;
    for (let y = 0; y < w.rows && !ink; y++) ink = w.cells[y * w.cols + x] !== 0;
    if (!ink) out.push(x);
  }
  return out;
}

/** Recorta las columnas [x0, x1) de una palabra y le quita las columnas vacías de los bordes. */
function slice(w: Word, x0: number, x1: number): Word {
  let a = x0;
  let b = x1;
  const empty = new Set(emptyColumns(w));
  while (a < b && empty.has(a)) a++;
  while (b > a && empty.has(b - 1)) b--;
  const cols = b - a;
  const cells = new Uint8Array(cols * w.rows);
  for (let y = 0; y < w.rows; y++) for (let x = 0; x < cols; x++) cells[y * cols + x] = w.cells[y * w.cols + a + x];
  return { cols, rows: w.rows, accentRows: w.accentRows, cells };
}

/**
 * Parte una palabra de una sola línea en `parts` trozos de ancho parecido, cortando por las columnas vacías entre letras
 * (nunca por el medio de una letra). Es la «composición propia» del hilo del Proceso en móvil: `HELLO` → `HEL / LO`.
 * Si no hay columna vacía que sirva, devuelve la palabra entera.
 */
export function splitWord(w: Word, parts: number = 2): Word[] {
  if (parts < 2) return [w];
  const gaps = emptyColumns(w).filter((x) => x > 0 && x < w.cols - 1);
  if (gaps.length < parts - 1) return [w];
  const cuts: number[] = [];
  for (let k = 1; k < parts; k++) {
    const ideal = (w.cols * k) / parts;
    let best = gaps[0];
    for (const g of gaps) if (Math.abs(g - ideal) < Math.abs(best - ideal)) best = g;
    if (!cuts.includes(best)) cuts.push(best);
  }
  cuts.sort((p, q) => p - q);
  const out: Word[] = [];
  let from = 0;
  for (const c of cuts) {
    out.push(slice(w, from, c));
    from = c + 1;
  }
  out.push(slice(w, from, w.cols));
  return out.filter((p) => p.cols > 0);
}

/** Varias palabras una bajo otra (alineadas a la izquierda, `gap` filas vacías entre ellas) como un solo `data-art`. */
export function stackArt(words: readonly Word[], gap: number = 1): string {
  const blank = '\n'.repeat(gap + 1);
  return words.map(wordArt).join(blank);
}

/** Ancho en columnas y filas del arte de `stackArt`. */
export function stackSize(words: readonly Word[], gap: number = 1): { cols: number; rows: number } {
  return {
    cols: words.reduce((m, w) => Math.max(m, w.cols), 0),
    rows: words.reduce((a, w) => a + w.rows, 0) + gap * (words.length - 1),
  };
}

// ───────────────────────── Texto y alfabeto ─────────────────────────

/** Escapa lo que rompería un atributo entre comillas dobles: `&`, `<` y `"` (glifos ASCII válidos del póster). */
export const escapeAttr = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Caracteres de `s` fuera del alfabeto de arte de §5.6 (vacío = correcto). Es la misma lista que usa `npm run ascii:lint`. */
export function forbiddenGlyphs(s: string): string[] {
  const bad = new Set<string>();
  for (const ch of s) if (!ALLOWED_ART_CHARS.has(ch)) bad.add(ch);
  return [...bad];
}

// ───────────────────────── Póster SSR de la portada (§6.9) ─────────────────────────

/** Las tres variantes del póster. `minCols`: columnas mínimas del contenedor (en `ch`) desde las que se muestra. */
export interface PosterVariant {
  key: 'wide' | 'mid' | 'stack';
  cols: number;
  rows: number;
  cssCw: number;
  cssCh: number;
  minCols: number;
}

/** De la mayor a la menor. Medidas de §2.2 y §6.9: 160×50 (escritorio), 113×44 (tablet) y 65×70 (móvil, pila `GA / YA`). */
export const POSTER_VARIANTS: readonly PosterVariant[] = [
  { key: 'wide', cols: 160, rows: 50, cssCw: 9, cssCh: 18, minCols: 133 },
  { key: 'mid', cols: 113, rows: 44, cssCw: 9, cssCh: 18, minCols: 96 },
  { key: 'stack', cols: 65, rows: 70, cssCw: 6, cssCh: 12, minCols: 0 },
];

/** GridSpec con el que se pinta cada variante (DPR 2, celda de dispositivo entera: la misma cuenta que `gridSpec` de scenes/common.ts). */
export function posterSpec(v: PosterVariant): GridSpec {
  const cw = Math.round(v.cssCw * 2);
  return { cols: v.cols, rows: v.rows, cw, ch: 2 * cw, cssCw: v.cssCw, cssCh: v.cssCh, dpr: 2 };
}
