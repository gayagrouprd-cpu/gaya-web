// Lista ÚNICA de glifos del motor (índice ↔ carácter). Un glifo por byte (< 256).
//  - ASCII imprimible (32–126) y `· ¯` salen de la fuente (Geist Mono 500).
//  - Bloques, cuadrantes, octavos, sombras y cajas se dibujan POR CÓDIGO (rectángulos de píxeles enteros):
//    sin costuras y sin depender del subset `symbols2` de la fuente.
// Prohibido dentro de rejillas: ← → ■ □ ● ○ ◆ ◇ ▲ ▶ ★ ≈ ≠ ≤ ≥ ✓, Braille y emoji (docs/ascii/DIRECTION.md §5.6).

export type GlyphKind = 'font' | 'block' | 'shade' | 'box';

const ASCII: string[] = [];
for (let c = 32; c <= 126; c++) ASCII.push(String.fromCharCode(c)); // índices 0..94 (índice = código − 32)

/** Orden fijo. Añadir al final, nunca reordenar (los datos de palabras y los hashes dorados dependen de él). */
export const GLYPHS: readonly string[] = [
  ...ASCII, // 0..94
  '·', // 95  U+00B7
  '¯', // 96  U+00AF
  // bloques (por código)
  '▀', '▄', '▌', '▐', '█', // 97..101
  // cuadrantes
  '▘', '▝', '▖', '▗', '▚', '▞', '▙', '▛', '▜', '▟', // 102..111
  // sombras
  '░', '▒', '▓', // 112..114
  // octavos verticales (desde abajo) y horizontales (desde la izquierda)
  '▁', '▂', '▃', '▅', '▆', '▇', // 115..120
  '▏', '▎', '▍', '▋', '▊', '▉', // 121..126
  // cajas finas
  '─', '│', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', // 127..137
  // cajas gruesas
  '━', '┃', '╋', // 138..140
  // diagonales y redondeadas
  '╱', '╲', '╭', '╮', '╰', '╯', // 141..146
];

const INDEX = new Map<string, number>(GLYPHS.map((g, i) => [g, i]));

/** Índice de un carácter; -1 si no está permitido. */
export const glyphIndex = (ch: string): number => INDEX.get(ch) ?? -1;
export const glyphChar = (i: number): string => GLYPHS[i] ?? ' ';
export const GLYPH_COUNT = GLYPHS.length;

export const G_SPACE = 0;
export const G_DOT = glyphIndex('·');
export const G_FULL = glyphIndex('█');

export function glyphKind(i: number): GlyphKind {
  if (i <= 96) return 'font';
  if (i <= 111) return 'block';
  if (i <= 114) return 'shade';
  if (i <= 126) return 'block';
  return 'box';
}

/** Cuadrantes: máscara 0..15 (bit0=▘ arriba-izq, bit1=▝ arriba-der, bit2=▖ abajo-izq, bit3=▗ abajo-der) → índice de glifo. */
export const QUAD_GLYPH: readonly number[] = [
  glyphIndex(' '), // 0
  glyphIndex('▘'), // 1
  glyphIndex('▝'), // 2
  glyphIndex('▀'), // 3
  glyphIndex('▖'), // 4
  glyphIndex('▌'), // 5
  glyphIndex('▞'), // 6
  glyphIndex('▛'), // 7
  glyphIndex('▗'), // 8
  glyphIndex('▚'), // 9
  glyphIndex('▐'), // 10
  glyphIndex('▜'), // 11
  glyphIndex('▄'), // 12
  glyphIndex('▙'), // 13
  glyphIndex('▟'), // 14
  glyphIndex('█'), // 15
];

/** Alfabeto permitido en `data-art` y en los `.txt` de palabras (lo usa `npm run ascii:lint`). */
export const ALLOWED_ART_CHARS = new Set<string>([...GLYPHS, '\n', '–', '—', '…', '«', '»', '¿', '¡', '×', '±', '°', '§']);
