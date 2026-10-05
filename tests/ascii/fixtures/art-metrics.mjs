// Medidas de ARTE de un fotograma (las correcciones de los jueces de la adopción del estilo Duotono, WP6c): lo que hace falta para decir con números si una
// escena «se lee como texto y no como papel pintado». Todas parten del mapa `cls` de la escena (1 cara · 2 borde · 3 sombra/aura): el TRAZO es cara + borde.
//   faceGlyphRatio    fracción de celdas de CARA con un glifo de la rampa (no espacio, no bloque)               ≥ 0,60
//   flatRuns          carreras horizontales de ≥ 3 celdas del trazo con el mismo fondo y sin glifo visible      = 0
//   density(r)        fracción de celdas con glifo a r celdas (Chebyshev) del trazo                            r = 1 ≤ 0,45 · r = 8 ≤ 0,15
//   outsideHalo       fracción de celdas con glifo a más de HALO celdas del trazo                              ≤ 0,30
//   lowerHalf         fracción de celdas con glifo en la mitad inferior de la pantalla                         (informativa)
//   belowWord         fracción de celdas con glifo bajo la palabra y su halo (`belowWord`)                       ≤ 0,01
//   waveMetrics       el cuerpo y la cresta de «OLA» (`waveMetrics`)                                              cuerpo ≥ 0,50 con glifo · cresta continua
// `skip` (opcional) = máscara de celdas que no cuentan (la H sólida de HOLA para la cara y las carreras planas).
import { GLYPHS } from '../../../src/ascii/glyphs.ts';
import { DUO_RAMP } from '../../../src/ascii/scenes/ramp.ts';

export const HALO = 3;
const G_FULL = GLYPHS.indexOf('█');
const RAMP_SET = new Set([...DUO_RAMP].filter((g) => g !== 0));
/** ¿La celda lleva un carácter que se lee (ni espacio ni bloque macizo)? */
export const visibleGlyph = (gl) => gl !== 0 && gl !== G_FULL;

/** Distancia de Chebyshev (8 vecinas, coste 1) de cada celda a la celda con `mask` ≠ 0 más cercana; 0 en la propia máscara. */
export function chebyshev(mask, cols, rows) {
  const INF = 30000;
  const d = new Int16Array(cols * rows).fill(INF);
  for (let i = 0; i < d.length; i++) if (mask[i]) d[i] = 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= cols || y >= rows ? INF : d[y * cols + x]);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const m = Math.min(at(x - 1, y), at(x - 1, y - 1), at(x, y - 1), at(x + 1, y - 1)) + 1;
      if (m < d[i]) d[i] = m;
    }
  }
  for (let y = rows - 1; y >= 0; y--) {
    for (let x = cols - 1; x >= 0; x--) {
      const i = y * cols + x;
      const m = Math.min(at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1)) + 1;
      if (m < d[i]) d[i] = m;
    }
  }
  return d;
}

/** Máscara del trazo (cara + borde) desde `SceneState.cls`. */
export const strokeMask = (cls) => Uint8Array.from(cls, (c) => (c === 1 || c === 2 ? 1 : 0));

/** Todas las medidas de un fotograma `g` de una escena con palabra (`st.cls` es el estado de `build`). */
export function artMetrics(g, st, { cols = g.cols, rows = g.rows, skip = null } = {}) {
  const b = g.b;
  const cls = st.cls;
  const mask = strokeMask(cls);
  const stroke = mask.reduce((a, v) => a + v, 0);
  const out = { stroke };
  // cara
  let face = 0;
  let faceGl = 0;
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] !== 1 || (skip && skip[i])) continue;
    face++;
    if (RAMP_SET.has(b[i * 4])) faceGl++;
  }
  out.faceCells = face;
  out.faceGlyphRatio = face ? faceGl / face : 1;
  // carreras planas dentro del trazo
  let flat = 0;
  const flatAt = [];
  for (let y = 0; y < rows; y++) {
    let run = 0;
    let bg = -1;
    for (let x = 0; x <= cols; x++) {
      const i = y * cols + x;
      const inside = x < cols && mask[i] === 1 && !(skip && skip[i]) && !visibleGlyph(b[i * 4]);
      if (inside && (run === 0 || b[i * 4 + 2] === bg)) {
        run++;
        bg = b[i * 4 + 2];
        if (run === 3) {
          flat++;
          if (flatAt.length < 6) flatAt.push(`${x - 2},${y}`);
        }
      } else {
        run = inside ? 1 : 0;
        bg = inside ? b[i * 4 + 2] : -1;
      }
    }
  }
  out.flatRuns = flat;
  out.flatAt = flatAt;
  // densidad de glifos por distancia al trazo
  const cheb = chebyshev(mask, cols, rows);
  const tot = new Float64Array(64);
  const gly = new Float64Array(64);
  let farTot = 0;
  let farGly = 0;
  for (let i = 0; i < cheb.length; i++) {
    const r = cheb[i];
    if (r === 0) continue;
    const has = b[i * 4] !== 0 ? 1 : 0;
    if (r < 64) {
      tot[r]++;
      gly[r] += has;
    }
    if (r > HALO) {
      farTot++;
      farGly += has;
    }
  }
  out.density = (r) => (tot[r] ? gly[r] / tot[r] : 0);
  out.d1 = out.density(1);
  out.d8 = out.density(8);
  out.outsideHalo = farTot ? farGly / farTot : 0;
  // mitad inferior
  let low = 0;
  let lowN = 0;
  for (let y = rows >> 1; y < rows; y++) for (let x = 0; x < cols; x++) {
    lowN++;
    if (b[(y * cols + x) * 4] !== 0) low++;
  }
  out.lowerHalf = lowN ? low / lowN : 0;
  let all = 0;
  for (let i = 0; i < b.length; i += 4) if (b[i] !== 0) all++;
  out.nonEmpty = all / (cols * rows);
  return out;
}

/** Línea de texto con las medidas más importantes (para los informes de las herramientas). */
export const metricsLine = (m) =>
  `cara ${(100 * m.faceGlyphRatio).toFixed(0)} % glifo · carreras planas ${m.flatRuns}${m.flatAt.length ? ` (${m.flatAt.join(' ')})` : ''} · r1 ${(100 * m.d1).toFixed(0)} % · r8 ${(100 * m.d8).toFixed(0)} % · fuera del halo ${(100 * m.outsideHalo).toFixed(0)} % · mitad inferior ${(100 * m.lowerHalf).toFixed(1)} %`;

/** Fracción de celdas con glifo en las filas bajo la palabra y su halo (desde `maxStrokeY + 9`): el sitio del texto, que debe quedar limpio. */
export function belowWord(g, st) {
  const { cols, rows } = g;
  let maxY = -1;
  for (let i = 0; i < st.cls.length; i++) if (st.cls[i] === 1 || st.cls[i] === 2) maxY = Math.max(maxY, (i / cols) | 0);
  let n = 0;
  let k = 0;
  for (let y = maxY + 9; y < rows; y++) for (let x = 0; x < cols; x++) {
    n++;
    if (g.b[(y * cols + x) * 4] !== 0) k++;
  }
  return { rows: Math.max(0, rows - (maxY + 9)), ratio: n ? k / n : 0 };
}

/** Columnas (exclusivas) de la primera letra de una palabra de cuadrantes: hasta la primera columna vacía tras la tinta (la H de HOLA). */
export function firstLetterCols(w) {
  let seen = false;
  for (let x = 0; x < w.cols; x++) {
    let ink = false;
    for (let y = 0; y < w.rows && !ink; y++) ink = w.cells[y * w.cols + x] !== 0;
    if (ink) seen = true;
    else if (seen) return x;
  }
  return w.cols;
}

/**
 * «OLA» de HOLA: el cuerpo (celdas llenas de las letras que no son la H) y su cresta. Devuelve la fracción de celdas del cuerpo con glifo de la rampa y con la
 * cresta, y la continuidad de la cresta: de cada 100 pares de columnas contiguas con cresta, cuántos tienen una cresta a ≤ 2 filas de la de la columna vecina.
 * `lines` = las líneas colocadas ({ word, x0, y0 }) de `layoutLines`, `hCols` = columnas de la H en la línea 0.
 */
export function waveMetrics(g, lines, hCols) {
  const { cols, rows } = g;
  const crest = new Set(['~', '-', '/', String.fromCharCode(92)].map((c) => GLYPHS.indexOf(c)));
  let body = 0;
  let ramp = 0;
  let crestN = 0;
  const colCrest = new Map();
  lines.forEach((l, li) => {
    for (let y = 0; y < l.word.rows; y++) {
      for (let x = 0; x < l.word.cols; x++) {
        if (li === 0 && x < hCols) continue;
        if (l.word.cells[y * l.word.cols + x] !== 15) continue;
        const sx = l.x0 + x;
        const sy = l.y0 + y;
        if (sx >= cols || sy >= rows) continue;
        const gl = g.b[(sy * cols + sx) * 4];
        body++;
        if (RAMP_SET.has(gl)) ramp++;
        if (crest.has(gl)) {
          crestN++;
          const k = `${li}:${sx}`;
          if (!colCrest.has(k)) colCrest.set(k, []);
          colCrest.get(k).push(sy);
        }
      }
    }
  });
  let pairs = 0;
  let linked = 0;
  for (const [k, ys] of colCrest) {
    const [li, sx] = k.split(':').map(Number);
    const nb = colCrest.get(`${li}:${sx + 1}`);
    if (!nb) continue;
    pairs++;
    if (ys.some((y) => nb.some((y2) => Math.abs(y - y2) <= 2))) linked++;
  }
  return { body, rampRatio: body ? ramp / body : 1, crestRatio: body ? crestN / body : 0, crestLinked: pairs ? linked / pairs : 1, pairs };
}
