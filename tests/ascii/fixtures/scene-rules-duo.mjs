// Presupuesto de tono EFECTIVO para escenas con `bg` (Variante A · Duotono ANSI). `toneBudget` (scene-rules.mjs) mide solo el primer plano de las
// celdas con glifo; una celda `█` T9 cuenta entera, pero una celda `.` T9 sobre T5 (3 % de tinta) cuenta igual que ella y un espacio sobre T8 no cuenta.
// Aquí cada celda se evalúa por su LUMINANCIA MEDIA (fondo y primer plano ponderados por la tinta real del glifo) y se convierte al tono T0–T15 cuya
// luminancia es la más cercana: así se compara la luz que ve el ojo, no el tono del primer plano. Sirve para comparar base y variante con la
// misma vara y para que la variante no gane luz de más usando el fondo.
import { GLYPHS } from '../../../src/ascii/glyphs.ts';
import { TONE_LUM } from './tones.mjs';
import { INK_PERMILLE } from '../../../src/ascii/scenes/variants/a/ramp.gen.ts';

const INK = new Map(INK_PERMILLE);
const Q = { '▘': 0.25, '▝': 0.25, '▖': 0.25, '▗': 0.25, '▀': 0.5, '▄': 0.5, '▌': 0.5, '▐': 0.5, '▚': 0.5, '▞': 0.5, '▙': 0.75, '▛': 0.75, '▜': 0.75, '▟': 0.75, '█': 1, '░': 0.25, '▒': 0.5, '▓': 0.75 };
const inkOfGlyph = (gl) => {
  if (gl === 0) return 0;
  const c = GLYPHS[gl];
  if (Q[c] !== undefined) return Q[c];
  const v = INK.get(c);
  if (v !== undefined) return v / 1000;
  const code = c.charCodeAt(0);
  if (code >= 0x2581 && code <= 0x2587) return (code - 0x2580) / 8;
  if (code >= 0x2589 && code <= 0x258f) return (0x2590 - code) / 8;
  return 0.15; // cajas y trazos
};
/** Tono entero cuya luminancia es la más cercana a `lum`. */
const toneOfLum = (lum) => {
  let best = 0;
  for (let t = 1; t < 16; t++) if (Math.abs(TONE_LUM[t] - lum) < Math.abs(TONE_LUM[best] - lum)) best = t;
  return best;
};

/** Como `toneBudget` pero con el tono EFECTIVO de cada celda (luminancia media). Una celda cuenta si tiene glifo o fondo distinto de T0. */
export function effectiveBudget(g) {
  const n = g.cols * g.rows;
  const out = { lit: 0, t9: 0, t11: 0, t13: 0, t14: 0, mean: 0 };
  for (let i = 0; i < g.b.length; i += 4) {
    const gl = g.b[i];
    const bg = g.b[i + 2];
    if (!gl && !bg) continue;
    const ink = inkOfGlyph(gl);
    const lum = (1 - ink) * TONE_LUM[bg] + ink * TONE_LUM[g.b[i + 1]];
    out.mean += lum;
    const t = toneOfLum(lum);
    if (t >= 1) out.lit++;
    if (t >= 9) out.t9++;
    if (t >= 11) out.t11++;
    if (t >= 13) out.t13++;
    if (t >= 14) out.t14++;
  }
  for (const k of ['lit', 't9', 't11', 't13', 't14']) out[k] = (100 * out[k]) / n;
  out.mean = out.mean / n;
  return out;
}
