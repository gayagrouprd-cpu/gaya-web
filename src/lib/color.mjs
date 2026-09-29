// Conversión OKLCH → sRGB y contraste WCAG. Módulo compartido por el sitio y por los scripts.
// Al salir de la gama sRGB reduce el croma (como hace CSS Color 4), no recorta canales.

const RE = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.]+%?)?\s*\)/i;

/** @param {string} str  p. ej. "oklch(0.66 0.19 38)" */
export function parseOklch(str) {
  const m = RE.exec(String(str));
  if (!m) throw new Error(`No es un color oklch(): ${str}`);
  let L = parseFloat(m[1]);
  if (m[2] === '%') L /= 100;
  return { L, C: parseFloat(m[3]), h: parseFloat(m[4]) };
}

function oklchToLinear({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inGamut = (rgb) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

/** RGB lineal (0–1) dentro de sRGB; reduce el croma si el color queda fuera de gama. */
export function toLinearSrgb(str) {
  const c = parseOklch(str);
  const rgb = oklchToLinear(c);
  if (inGamut(rgb)) return rgb.map(clamp01);
  let lo = 0;
  let hi = c.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ ...c, C: mid }))) lo = mid;
    else hi = mid;
  }
  return oklchToLinear({ ...c, C: lo }).map(clamp01);
}

const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** @returns {[number, number, number]} canales 0–255 */
export function oklchToRgb255(str) {
  return /** @type {[number, number, number]} */ (toLinearSrgb(str).map((v) => Math.round(clamp01(encode(v)) * 255)));
}

export function oklchToHex(str) {
  return '#' + oklchToRgb255(str).map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function luminance(str) {
  const [r, g, b] = toLinearSrgb(str);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos colores oklch(). */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Contraste entre dos colores dados como [r,g,b] 0–255 (para medir píxeles reales de un frame). */
export function contrastRgb255(a, b) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
