#!/usr/bin/env node
// Rasterizador de palabras (DIRECTION §5.3 y Anexo C.1): Chrome real + Bricolage Grotesque 800 → arte de cuadrantes.
// Escribe src/ascii/data/words/<lang>/<ID>.<variante>.txt (fuente de verdad: se retoca a mano) y NO pisa un .txt
// existente salvo con --force. Después: `node scripts/words-pack.mjs` los compila a RLE.
//
//   node scripts/words.mjs                          genera lo que falte (todas las palabras, ES y EN)
//   node scripts/words.mjs --force --word GAYA      regenera (y pisa) las variantes de GAYA
//   node scripts/words.mjs --lang en --variant L,M  solo esas variantes
//   node scripts/words.mjs --no-clean              sin alisar los dientes de un subpíxel (por defecto se alisan)
//   node scripts/words.mjs --dry                    no escribe nada: imprime la tabla de anchos contra la A.1
//   node scripts/words.mjs --sheet [--zoom 2]       una hoja PNG por palabra (todas sus variantes, a partir de los .txt) en reports/ascii/WP3/
//   node scripts/words.mjs --contact                hoja de contactos: todas las palabras por variante, a tamaño real de celda
//
// Tras rasterizar se alisan los «dientes» de un subpíxel (bordes que sobresalen o se hunden en una o dos filas entre
// vecinas iguales) y se escuadran los extremos de brazos y astas (cleanCells); --no-clean los deja como salen.
// RETOQUES A MANO que hoy viven solo en los .txt (un --force los pisaría): es/TU.M (asta de la T y fondo de la U) y
// es/TU.mini (el acento se redibujó como ▄█▀ con una fila vacía sobre la U).
//
// Unidad: 1 unidad = ancho de celda (la celda es 1:2); cada cuadrante es un subpíxel de 0,5 × 1 unidad.
// La altura de la mayúscula SIN acento fija la escala (todas las líneas de una pila comparten la escala de la palabra
// entera y la misma línea base); el acento añade filas por encima.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';
import {
  ROOT, LANGS, WORD_IDS, A1, variantsOf, wordFile, readWordFile, formatWordText, parseWordText,
} from './words-pack.mjs';

const FONT = join(ROOT, 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2');

/** Texto visible de cada palabra (TÚ con su tilde). */
export const WORD_TEXT = { GAYA: 'GAYA', HOLA: 'HOLA', WEB: 'WEB', LISTO: 'LISTO', ECO: 'ECO', ON: 'ON', VER: 'VER', TU: 'TÚ',
  HELLO: 'HELLO', READY: 'READY', ECHO: 'ECHO', SEE: 'SEE', YOU: 'YOU' };

/**
 * Filas de la mayúscula por variante (Anexo A.1). S y XS: número = una línea; { rows, split } = pila de líneas.
 * Las filas de S y XS son las mayores con las que la línea más ancha cabe en 52 / 44 columnas.
 */
export const PLAN = {
  GAYA: { L: 16, M: 11, S: { rows: 12, split: ['GA', 'YA'] }, XS: { rows: 10, split: ['GA', 'YA'] } },
  HOLA: { L: 16, M: 11, S: { rows: 13, split: ['HO', 'LA'] }, XS: { rows: 11, split: ['HO', 'LA'] } },
  WEB: { L: 18, M: 12, S: { rows: 10, split: ['WE', 'B'] }, XS: { rows: 9, split: ['WE', 'B'] } },
  LISTO: { L: 16, M: 11, S: { rows: 13, split: ['LIS', 'TO'] }, XS: { rows: 11, split: ['LIS', 'TO'] } },
  ECO: { L: 22, M: 15, S: { rows: 14, split: ['EC', 'O'] }, XS: { rows: 12, split: ['EC', 'O'] } },
  ON: { L: 22, M: 16, S: 12, XS: { rows: 14, split: ['O', 'N'] } },
  VER: { L: 21, M: 14, S: { rows: 13, split: ['VE', 'R'] }, XS: { rows: 11, split: ['VE', 'R'] } },
  TU: { L: 17, M: 13, S: 14, XS: { rows: 14, split: ['T', 'Ú'] } },
  HELLO: { L: 14, M: 10, S: { rows: 9, split: ['HEL', 'LO'] }, XS: { rows: 8, split: ['HEL', 'LO'] } },
  READY: { L: 12, M: 8, S: { rows: 8, split: ['REA', 'DY'] }, XS: { rows: 7, split: ['REA', 'DY'] } },
  ECHO: { L: 16, M: 11, S: { rows: 13, split: ['EC', 'HO'] }, XS: { rows: 11, split: ['EC', 'HO'] } },
  SEE: { L: 22, M: 16, S: { rows: 14, split: ['SE', 'E'] }, XS: { rows: 12, split: ['SE', 'E'] } },
  YOU: { L: 21, M: 14, S: { rows: 13, split: ['YO', 'U'] }, XS: { rows: 11, split: ['YO', 'U'] } },
};
const MINI_ROWS = 6;
const PROC_ROWS = 8;
const GAYA_STAGGER = 3; // §5.3: la 2.ª línea de GA / YA va desplazada 3 columnas a la derecha
const LIMIT = { S: 52, XS: 44 };

/** Especificación de una variante: { rows, lines: [texto...] } (varias líneas = pila). */
export function specOf(id, variant) {
  const text = WORD_TEXT[id];
  if (variant === 'mini') return { rows: MINI_ROWS, lines: [text] };
  if (variant === 'proc') return { rows: PROC_ROWS, lines: [text] };
  const p = PLAN[id][variant];
  return typeof p === 'number' ? { rows: p, lines: [text] } : { rows: p.rows, lines: p.split };
}

// ───────────────────────── Rasterizador (Chrome) ─────────────────────────

export async function rasterizer() {
  const b64 = readFileSync(FONT).toString('base64');
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(
    `<style>@font-face{font-family:B;src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:200 800}</style><canvas id=c width=4000 height=900></canvas>`,
  );
  await page.evaluate(() => document.fonts.load('800 100px B', 'GAYAÚ'));
  /** Rasteriza una línea. `capText` (la palabra entera) fija la escala y la línea base; `text` es lo que se dibuja. */
  const raster = (text, capText, rows) =>
    page.evaluate(
      ({ text, capText, rows }) => {
        const W = 4000, H = 900;
        const strip = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
        const ctx = document.getElementById('c').getContext('2d', { willReadFrequently: true });
        ctx.textRendering = 'geometricPrecision';
        const draw = (t) => { ctx.clearRect(0, 0, W, H); ctx.font = '800 400px B'; ctx.fillStyle = '#fff'; ctx.fillText(t, 100, 600); };
        const bbox = () => {
          const d = ctx.getImageData(0, 0, W, H).data;
          let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          return { x0, y0, x1, y1 };
        };
        draw(strip(capText));
        const b0 = bbox();
        const s = (b0.y1 - b0.y0 + 1) / (2 * rows); // px por unidad: la mayúscula mide 2·rows unidades
        draw(text);
        const b = bbox();
        const cols = Math.ceil((b.x1 - b.x0 + 1) / s);
        const rowsTot = rows + Math.max(0, Math.ceil((b0.y0 - b.y0) / s / 2)); // filas extra del acento
        const d = ctx.getImageData(0, 0, W, H).data;
        const ytop = b0.y1 + 1 - 2 * rowsTot * s;
        const cov = (sx, sy) => {
          const x0 = b.x0 + sx * (s / 2), y0 = ytop + sy * s;
          let n = 0, a = 0;
          for (let y = Math.floor(y0); y < Math.ceil(y0 + s); y++) for (let x = Math.floor(x0); x < Math.ceil(x0 + s / 2); x++) { n++; a += d[(y * W + x) * 4 + 3]; }
          return n ? a / n / 255 : 0;
        };
        const cells = [];
        for (let cy = 0; cy < rowsTot; cy++)
          for (let cx = 0; cx < cols; cx++)
            cells.push((cov(cx * 2, cy * 2) > 0.5 ? 1 : 0) | (cov(cx * 2 + 1, cy * 2) > 0.5 ? 2 : 0) | (cov(cx * 2, cy * 2 + 1) > 0.5 ? 4 : 0) | (cov(cx * 2 + 1, cy * 2 + 1) > 0.5 ? 8 : 0));
        return { cols, rows: rowsTot, cells };
      },
      { text, capText, rows },
    );
  return { raster, close: () => browser.close() };
}

// ── Limpieza de grumos ──
// Los cuadrantes son subpíxeles de 0,5 × 1 unidad. Al binarizar, un borde que cae cerca de la mitad de un subpíxel deja
// dientes de UN subpíxel (un borde que sobresale o se hunde en una sola fila o columna entre dos vecinas iguales).
// Se alisan: un diente es la arista de una corrida que difiere 1 de sus dos vecinas, que coinciden entre sí.
const cellsToBits = (cells, cols, rows) => {
  const W = cols * 2, H = rows * 2, bits = new Uint8Array(W * H);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const m = cells[y * cols + x];
    for (let q = 0; q < 4; q++) if (m & (1 << q)) bits[(y * 2 + (q >> 1)) * W + x * 2 + (q & 1)] = 1;
  }
  return { bits, W, H };
};
const bitsToCells = ({ bits, W, H }) => {
  const cols = W / 2, rows = H / 2, cells = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let m = 0;
    for (let q = 0; q < 4; q++) if (bits[(y * 2 + (q >> 1)) * W + x * 2 + (q & 1)]) m |= 1 << q;
    cells[y * cols + x] = m;
  }
  return cells;
};
const runsOf = (bits, W, y) => {
  const out = [];
  for (let x = 0; x < W; x++) if (bits[y * W + x]) { let e = x; while (e + 1 < W && bits[y * W + e + 1]) e++; out.push([x, e]); x = e; }
  return out;
};
const only = (runs, a, b) => { const hit = runs.filter((r) => r[0] <= b && r[1] >= a); return hit.length === 1 ? hit[0] : null; };
// Un diente: k filas (1 o 2) seguidas cuyo borde (izquierdo o derecho) vale A, entre vecinas que valen E = A ± 1.
// Con k = 2 se exige además que las dos vecinas siguientes también valgan E (un hombro recto a cada lado), para no
// aplanar el extremo de una curva pequeña.
function rowPass(bits, W, H) {
  let changed = 0;
  const rr = Array.from({ length: H }, (_, y) => runsOf(bits, W, y));
  const edit = [];
  for (let y = 1; y < H - 1; y++) for (const r0 of rr[y]) for (const side of [0, 1]) {
    for (const k of [1, 2]) {
      if (y + k >= H) continue;
      // cadena de k filas con el mismo borde A
      const chain = [r0];
      for (let i = 1; i < k; i++) { const n = only(rr[y + i], chain[i - 1][0], chain[i - 1][1]); if (!n || n[side] !== r0[side]) { chain.length = 0; break; } chain.push(n); }
      if (!chain.length) continue;
      const up = only(rr[y - 1], chain[0][0], chain[0][1]);
      const dn = only(rr[y + k], chain[k - 1][0], chain[k - 1][1]);
      if (!up || !dn || up[side] !== dn[side] || Math.abs(up[side] - r0[side]) !== 1) continue;
      if (k === 2) {
        const up2 = y >= 2 ? only(rr[y - 2], up[0], up[1]) : null;
        const dn2 = y + 3 < H ? only(rr[y + 3], dn[0], dn[1]) : null;
        if (!up2 || !dn2 || up2[side] !== up[side] || dn2[side] !== up[side]) continue;
      }
      for (let i = 0; i < k; i++) edit.push([y + i, chain[i], side, up[side]]);
      break;
    }
  }
  // Esquina achaflanada: el último tramo de un trazo recto (extremo de un brazo de E, T, L…) queda 1 subpíxel más corto
  // que las dos filas anteriores, que coinciden; se escuadra. Solo si el trazo termina ahí (la fila siguiente no ocupa ese hueco).
  const empty = (runs, x0, x1) => !runs.some((r) => r[0] <= x1 && r[1] >= x0);
  for (let y = 0; y < H; y++) for (const r of rr[y]) for (const side of [0, 1]) for (const dir of [-1, 1]) {
    const y1 = y + dir, y2 = y + 2 * dir, yo = y - dir;
    if (y2 < 0 || y2 >= H || yo < 0 || yo >= H) continue;
    const n1 = only(rr[y1], r[0], r[1]);
    const n2 = n1 ? only(rr[y2], n1[0], n1[1]) : null;
    if (!n1 || !n2 || n1[side] !== n2[side]) continue;
    const e = n1[side];
    if (Math.abs(e - r[side]) !== 1 || (side === 0 ? e > r[0] : e < r[1])) continue; // solo alargar
    const x0 = Math.min(e, r[side]), x1 = Math.max(e, r[side]);
    if (!empty(rr[yo], x0, x1)) continue;
    edit.push([y, r, side, e]);
  }
  const done = new Set();
  for (const [y, r, side, e] of edit) {
    const key = y + ':' + r[0] + ':' + side;
    if (done.has(key)) continue;
    done.add(key);
    const na = side === 0 ? e : r[0], nb = side === 1 ? e : r[1];
    if (na > nb) continue;
    for (let x = Math.min(r[0], na); x <= Math.max(r[1], nb); x++) bits[y * W + x] = x >= na && x <= nb ? 1 : 0;
    changed++;
  }
  return changed;
}
const transpose = (bits, W, H) => { const t = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) t[x * H + y] = bits[y * W + x]; return t; };
export function cleanCells(cells, cols, rows) {
  const g = cellsToBits(cells, cols, rows);
  let { bits } = g;
  for (let pass = 0; pass < 4; pass++) {
    let n = rowPass(bits, g.W, g.H);
    let t = transpose(bits, g.W, g.H);
    n += rowPass(t, g.H, g.W);
    bits = transpose(t, g.H, g.W);
    if (!n) break;
  }
  return bitsToCells({ bits, W: g.W, H: g.H });
}

/** Desplazamiento de cada línea de una pila. GA / YA lleva la 2.ª línea +3 columnas (§5.3); el resto, centrado. */
export function stackOffsets(id, lines) {
  if (lines.length < 2) return [0];
  if (id === 'GAYA') return [0, GAYA_STAGGER];
  const widest = Math.max(...lines.map((l) => l.cols));
  return lines.map((l) => Math.floor((widest - l.cols) / 2));
}

/** Rasteriza una variante completa: { lines: [{cols, rows, accentRows, cells}], offsets }. */
export async function rasterVariant(r, id, variant) {
  const { rows, lines } = specOf(id, variant);
  const out = [];
  for (const text of lines) {
    const w = await r.raster(text, WORD_TEXT[id], rows);
    const raw = Uint8Array.from(w.cells);
    out.push({ cols: w.cols, rows: w.rows, accentRows: 0, cells: has('--no-clean') ? raw : cleanCells(raw, w.cols, w.rows) });
  }
  // forma canónica: sin columnas vacías en los bordes (el ancho de A.1 sale de `ceil`); los desplazamientos, con los anchos ya recortados
  const trimmed = out.map((l) => parseWordText(formatWordText({ lines: [l], offsets: [0] })).lines[0]);
  const canon = parseWordText(formatWordText({ lines: trimmed, offsets: stackOffsets(id, trimmed) }));
  return { lines: canon.lines, offsets: canon.offsets };
}

// ───────────────────────── CLI ─────────────────────────

const arg = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const has = (name) => process.argv.includes(name);
const list = (v, all) => (v ? v.split(',') : all);

async function generate() {
  const force = has('--force'), dry = has('--dry');
  const langs = list(arg('--lang'), LANGS);
  const onlyWords = arg('--word') ? arg('--word').split(',') : null;
  const onlyVariants = arg('--variant') ? arg('--variant').split(',') : null;
  const r = await rasterizer();
  const rows = [];
  try {
    for (const lang of langs) {
      for (const id of WORD_IDS[lang]) {
        if (onlyWords && !onlyWords.includes(id)) continue;
        for (const v of variantsOf(lang, id)) {
          if (onlyVariants && !onlyVariants.includes(v)) continue;
          const file = wordFile(lang, id, v);
          const exists = existsSync(file);
          const res = await rasterVariant(r, id, v);
          const width = Math.max(...res.lines.map((l, i) => l.cols + res.offsets[i]));
          const widest = Math.max(...res.lines.map((l) => l.cols));
          let note = '';
          if (!dry) {
            if (exists && !force) note = 'conserva el .txt existente';
            else { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, formatWordText(res)); note = exists ? 'PISADO (--force)' : 'creado'; }
          }
          rows.push({ lang, id, v, rows: res.lines[0].rows, widest, width, lines: res.lines.length, extra: res.lines.map((l) => l.rows).join('+'), note });
        }
      }
    }
  } finally {
    await r.close();
  }
  printTable(rows);
}

function printTable(rows) {
  const exp = (id, v) => {
    const a = A1[id]?.[v];
    if (a === undefined) return '';
    return Array.isArray(a) ? (a[1] ?? '') : a;
  };
  console.log('lang id     var   líneas filas    cols(máx)  A.1   ancho+desp  nota');
  for (const r of rows)
    console.log(`${r.lang}   ${r.id.padEnd(6)} ${r.v.padEnd(5)} ${String(r.lines).padEnd(6)} ${r.extra.padEnd(8)} ${String(r.widest).padEnd(10)} ${String(exp(r.id, r.v)).padEnd(5)} ${String(r.width).padEnd(11)} ${r.note}`);
}

// ───────────────────────── Hojas de contactos (PNG) ─────────────────────────

/** Tamaño de celda real (px CSS) con el que se ve cada variante: escritorio 9×18, móvil 6×12. */
const CELL = { L: [9, 18], M: [9, 18], S: [6, 12], XS: [6, 12], mini: [9, 18], proc: [9, 18] };

/** Dibuja cuadrantes con rectángulos de píxeles enteros en un canvas 2D (como hará el motor: sin costuras). */
async function sheets() {
  const zoom = Number(arg('--zoom') ?? 2);
  const outDir = join(ROOT, 'reports/ascii/WP3');
  mkdirSync(outDir, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.setContent('<canvas id=c></canvas>');
  const langs = list(arg('--lang'), LANGS);
  const onlyWords = arg('--word') ? arg('--word').split(',') : null;
  // tiles: [{label, cw, ch, lines, offsets}] repartidos en `columns` columnas (siempre en la más baja)
  const render = (tiles, title, columns, zoom) =>
    page.evaluate(({ tiles, title, columns, zoom }) => {
      const pad = 16 * zoom, gap = 18 * zoom, lab = 16 * zoom;
      const drawn = tiles.map((it) => {
        const cw = it.cw * zoom, ch = it.ch * zoom;
        const W = Math.max(...it.lines.map((l, i) => (l.cols + it.offsets[i]) * cw));
        const H = it.lines.reduce((a, l) => a + l.rows * ch, 0) + (it.lines.length - 1) * 2 * ch;
        return { ...it, cw, ch, W, H, full: H + lab };
      });
      const cols = Array.from({ length: columns }, () => ({ items: [], h: 0, w: 0 }));
      for (const d of drawn) {
        const c = cols.reduce((a, b) => (b.h < a.h ? b : a));
        c.items.push(d); c.h += d.full + gap; c.w = Math.max(c.w, d.W, 200 * zoom);
      }
      const colGap = pad * 3;
      const W = cols.reduce((a, c) => a + c.w + colGap, pad);
      const H = Math.max(...cols.map((c) => c.h)) + pad * 2 + lab;
      const cv = document.getElementById('c'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      g.fillStyle = '#02051b'; g.fillRect(0, 0, W, H);
      g.font = (12 * zoom) + 'px monospace'; g.textBaseline = 'top';
      g.fillStyle = '#7e93b8'; g.fillText(title, pad, pad);
      let x = pad;
      for (const c of cols) {
        let y = pad + lab * 1.5;
        for (const d of c.items) {
          g.fillStyle = '#7e93b8'; g.fillText(d.label, x, y); y += lab;
          g.fillStyle = '#a9dcff';
          let yy = y;
          d.lines.forEach((l, li) => {
            const x0 = x + d.offsets[li] * d.cw, hw = Math.floor(d.cw / 2), hh = d.ch / 2;
            for (let cy = 0; cy < l.rows; cy++)
              for (let cx = 0; cx < l.cols; cx++) {
                const m = l.cells[cy * l.cols + cx];
                if (!m) continue;
                const px = x0 + cx * d.cw, py = yy + cy * d.ch;
                if (m & 1) g.fillRect(px, py, hw, hh);
                if (m & 2) g.fillRect(px + hw, py, d.cw - hw, hh);
                if (m & 4) g.fillRect(px, py + hh, hw, hh);
                if (m & 8) g.fillRect(px + hw, py + hh, d.cw - hw, hh);
              }
            yy += (l.rows + 2) * d.ch;
          });
          y += d.H + gap;
        }
        x += c.w + colGap;
      }
      return cv.toDataURL('image/png');
    }, { tiles, title, columns, zoom });
  const save = (name, dataUrl) => { const f = join(outDir, name); writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); console.log(f); };
  const tileOf = (lang, id, v, z) => {
    const f = wordFile(lang, id, v);
    if (!existsSync(f)) return null;
    const w = readWordFile(f);
    const [cw, ch] = CELL[v];
    const dims = w.lines.map((l) => l.cols + '×' + l.rows + (l.accentRows ? '(+' + l.accentRows + ')' : '')).join(' / ');
    return { label: lang.toUpperCase() + ' ' + id + ' ' + v + '  ' + dims + '  celda ' + cw + '×' + ch + ' ×' + z, cw, ch, lines: w.lines.map((l) => ({ cols: l.cols, rows: l.rows, cells: Array.from(l.cells) })), offsets: w.offsets };
  };
  try {
    for (const lang of langs) {
      const ids = WORD_IDS[lang].filter((id) => !onlyWords || onlyWords.includes(id));
      if (has('--contact')) {
        // Hoja de contactos: una imagen por familia de variantes, al tamaño real de celda (×zoom = densidad de píxeles del móvil)
        const plan = [
          ['L', ['L'], 2, 1], ['M', ['M'], 3, 1], ['S', ['S'], 4, 2], ['XS', ['XS'], 4, 2], ['DOM', ['mini', 'proc'], 2, 1],
        ];
        for (const [name, vs, columns, z] of plan) {
          const tiles = [];
          for (const v of vs) for (const id of ids) { const t = tileOf(lang, id, v, z); if (t) tiles.push(t); }
          if (tiles.length) save('contact-' + lang + '-' + name + '.png', await render(tiles, lang.toUpperCase() + ' · ' + name, columns, z));
        }
      } else {
        for (const id of ids) {
          const tiles = variantsOf(lang, id).map((v) => tileOf(lang, id, v, zoom)).filter(Boolean);
          if (tiles.length) save(lang + '-' + id + '.png', await render(tiles, lang.toUpperCase() + ' · ' + id, 1, zoom));
        }
      }
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (has('--sheet') || has('--contact')) await sheets();
  else await generate();
}
