// Palabras de cuadrantes de EJEMPLO para las pruebas de WP4. No son las de WP3: son los especímenes del rasterizador que el
// Anexo B de docs/ascii/DIRECTION.md imprime (copiados tal cual en specimens.json), así que las pruebas y los hashes dorados
// no dependen de que otro paquete termine ni de que cambie sus datos.
import SPECIMENS from './specimens.json' with { type: 'json' };

export { SPECIMENS };

const QUAD_CHARS = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];
const QMASK = new Map(QUAD_CHARS.map((c, i) => [c, i]));

/** Líneas de arte de cuadrantes → Word (las líneas más cortas se rellenan con aire). */
export function wordFromLines(lines, accentRows = 0) {
  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => [...l].length));
  const cells = new Uint8Array(cols * rows);
  lines.forEach((l, y) => {
    [...l].forEach((ch, x) => {
      if (!QMASK.has(ch)) throw new Error(`carácter que no es de cuadrantes en el espécimen: ${JSON.stringify(ch)}`);
      cells[y * cols + x] = QMASK.get(ch);
    });
  });
  return { cols, rows, accentRows, cells };
}

/** Texto de una Word (la inversa de wordFromLines, con espacios finales recortados). */
export function wordToText(w) {
  const out = [];
  for (let y = 0; y < w.rows; y++) {
    let s = '';
    for (let x = 0; x < w.cols; x++) s += QUAD_CHARS[w.cells[y * w.cols + x]];
    out.push(s.trimEnd());
  }
  return out.join('\n');
}

const sub = (w, sx, sy) => (sx < 0 || sy < 0 || sx >= w.cols * 2 || sy >= w.rows * 2 ? 0 : (w.cells[(sy >> 1) * w.cols + (sx >> 1)] >> (((sy & 1) << 1) | (sx & 1))) & 1);

/** Reescala una palabra a cols × rows celdas (bilineal sobre subpíxeles + umbral 0,5): para tener una «L» desde la «M». */
export function resample(w, cols, rows) {
  const sw = w.cols * 2;
  const sh = w.rows * 2;
  const dw = cols * 2;
  const dh = rows * 2;
  const cells = new Uint8Array(cols * rows);
  for (let j = 0; j < dh; j++) {
    const v = ((j + 0.5) * sh) / dh - 0.5;
    const y0 = Math.floor(v);
    const fy = v - y0;
    for (let i = 0; i < dw; i++) {
      const u = ((i + 0.5) * sw) / dw - 0.5;
      const x0 = Math.floor(u);
      const fx = u - x0;
      const a = sub(w, x0, y0);
      const b = sub(w, x0 + 1, y0);
      const c = sub(w, x0, y0 + 1);
      const d = sub(w, x0 + 1, y0 + 1);
      const val = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      if (val > 0.5) cells[(j >> 1) * cols + (i >> 1)] |= 1 << (((j & 1) << 1) | (i & 1));
    }
  }
  return { cols, rows, accentRows: 0, cells };
}

export const GAYA_M = wordFromLines(SPECIMENS.gayaM);
/** GAYA «L» (16 × 121) obtenida de la «M» del espécimen. */
export const GAYA_L = resample(GAYA_M, 121, 16);
export const GAYA_STACK = { variant: 'S', lines: [wordFromLines(SPECIMENS.gayaS.ga), wordFromLines(SPECIMENS.gayaS.ya)], offsets: [0, 3] };
export const GAYA_L_SET = { variant: 'L', lines: [GAYA_L], offsets: [0] };
export const GAYA_M_SET = { variant: 'M', lines: [GAYA_M], offsets: [0] };
export const TU_M = wordFromLines([...SPECIMENS.tuM.accent, ...SPECIMENS.tuM.body], SPECIMENS.tuM.accent.length);
export const ON_S = wordFromLines(SPECIMENS.onS);
/** ON «L»: el espécimen S (12 × 50) reescalado a 22 × 90 (la variante L de §5.3). */
export const ON_L = resample(ON_S, 90, 22);
export const ON_L_SET = { variant: 'L', lines: [ON_L], offsets: [0] };
export const ON_S_SET = { variant: 'S', lines: [ON_S], offsets: [0] };
export const TU_M_SET = { variant: 'M', lines: [TU_M], offsets: [0] };
export const HOLA_PROC = wordFromLines(SPECIMENS.holaProc);
export const LISTO_PROC = wordFromLines(SPECIMENS.listoProc);
