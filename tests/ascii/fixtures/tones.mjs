// Los 16 tonos Cobalto de DIRECTION §5.4 copiados aquí para las pruebas y el pintor de PNG de WP4 (no dependen de WP1).
export const TONE_HEX = ['#02051b', '#040c34', '#07134f', '#0b1b6c', '#0f238a', '#122caa', '#143fbf', '#1753d4', '#1c66ea', '#2179ff', '#4390ff', '#52a7ff', '#6bbdff', '#88d0ff', '#abe2ff', '#d1f1ff'];

const lin = (v) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
/** Luminancia relativa WCAG de cada tono (0..1). */
export const TONE_LUM = TONE_HEX.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
});

/** Cobertura media de tinta de un glifo (0..1) para estimar la luminancia media de una celda. */
export const GLYPH_COVERAGE = { '█': 1, '▓': 0.75, '▒': 0.5, '░': 0.25, '·': 0.06, ':': 0.1, '*': 0.22, '~': 0.15, ' ': 0 };

/** Contraste WCAG entre dos luminancias relativas. */
export const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
