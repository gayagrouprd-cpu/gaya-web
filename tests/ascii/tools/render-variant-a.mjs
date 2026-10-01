// Renderiza la Variante A · Duotono ANSI (src/ascii/scenes/variants/a) a PNG con el pintor real de celdas (tests/ascii/tools/paint.mjs) y la
// paleta de 16 tonos, para MIRAR el arte (revisión de dirección de arte). Uso:
//   node tests/ascii/tools/render-variant-a.mjs --scene cover,hola --vp d1440,m360,d1920 --lang es,en [--out reports/ascii/art-a] [--tag -r1]
//        [--crop x0,y0,x1,y1]   recorte en CELDAS (para ver los caracteres de cerca)
//        [--base]               pinta también la base sólida (scenes/*.ts) con el sufijo -base
//        [--sheet]              hoja de comparación por escena: base (arriba) y variante (abajo), apiladas; --rows N = filas de celdas que se recortan (34)
//        [--poster 1|2]         póster SSR sin JS: 1 = solo capas de glifos sobre T0 (renderPosterLayers tal cual) · 2 = + capas de fondo
//        [--tide]               marea cover → hola con la marea de la variante (tide-a.ts); --tide-shared usa la de tide.ts (--ks 76,52,28 · --from cover --to hola)
//        [--arrival]            fotogramas de la ignición (--ps 0.05,0.15,0.3,0.5,0.7,0.85)
//        [--heat]               calor del puntero y anillos
//        [--wells]              con los pozos del texto de la portada (h1, lead, botones) como los pone el motor: f.cap + applyCap
//        [--p 1] [--t 21.7] [--dpr N]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { createPainter } from './paint.mjs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { toneBudget } from '../fixtures/scene-rules.mjs';
import { effectiveBudget } from '../fixtures/scene-rules-duo.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { loadScene } from '../../../src/ascii/scenes/index.ts';
import { LOADERS_A } from '../../../src/ascii/scenes/variants/a/index.ts';
import { LAYER_OF_TONE, POSTER_TONES } from '../../../src/ascii/ssr.ts';
import { posterCollapse } from '../../../src/ascii/scenes/variants/a/poster-a.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';
import { composeA } from '../../../src/ascii/scenes/variants/a/tide-a.ts';

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 || args[i + 1]?.startsWith('--') ? d : args[i + 1];
};
const OUT = resolve(arg('out', 'reports/ascii/art-a'));
const TAG = arg('tag', '');
const LANGS = arg('lang', 'es').split(',');
const VPS = arg('vp', 'd1440,m360').split(',');
const SCENES = arg('scene', 'cover').split(',');
const T = Number(arg('t', STILL_T));
const DPR = arg('dpr', null);
const CROP = arg('crop', null)?.split(',').map(Number);
mkdirSync(OUT, { recursive: true });

const painter = await createPainter();
const opts = (vp, gap = 14) => ({ cssCw: vp.cssCw, cssCh: vp.cssCh, dpr: DPR ? Number(DPR) : vp.cssCw < 9 ? 2 : vp.dpr, gap });
const A = (id) => LOADERS_A[id]();
const BASE = (id) => loadScene(id);

function paintScene(sc, vp, lang, frame) {
  const spec = specOf(vp);
  const st = sc.build(spec, lang, wordsFor(sc.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  sc.paint(g, st, frame);
  return { g, st, spec };
}

/** Póster SSR: lo que ve quien no tiene JS. Modo 1 = capas de glifos (4 tonos fijos) sobre T0, sin bg (renderPosterLayers). Modo 2 = además capas de fondo. */
function posterOf(g, mode) {
  if (mode === 3) {
    // modo 3 = póster «colapsado»: el fondo claro con poca tinta se convierte en bloque, así el póster tiene 4 capas como siempre
    const c = makeCells(g.cols, g.rows);
    c.b.set(g.b);
    posterCollapse(c);
    return posterOf(c, 0);
  }
  const out = makeCells(g.cols, g.rows);
  const bgQ = [0, 2, 2, 2, 4, 5, 5, 5, 8, 8, 8, 8, 8, 8, 8, 8];
  for (let i = 0; i < g.b.length; i += 4) {
    const gl = g.b[i];
    const L = LAYER_OF_TONE[g.b[i + 1] & 15];
    const bg = mode === 2 ? bgQ[g.b[i + 2] & 15] : 0;
    if (gl === 0 || L === 255) {
      if (bg) {
        out.b[i + 2] = bg;
        out.b[i + 3] = 3;
      }
      continue;
    }
    out.b[i] = gl;
    out.b[i + 1] = POSTER_TONES[L];
    out.b[i + 2] = bg;
    out.b[i + 3] = bg ? 3 : 1;
  }
  return out;
}

async function save(file, grids, vp) {
  const o = opts(vp);
  let buf = await painter.paint(Array.isArray(grids) ? grids : [grids], o);
  if (CROP) {
    const cw = Math.round(vp.cssCw * o.dpr);
    const ch = Math.round(vp.cssCh * o.dpr);
    buf = await sharp(buf).extract({ left: CROP[0] * cw, top: CROP[1] * ch, width: (CROP[2] - CROP[0]) * cw, height: (CROP[3] - CROP[1]) * ch }).png().toBuffer();
  }
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, buf);
  return file;
}
const budgetLine = (g, spec) => {
  const b = toneBudget(g);
  const e = effectiveBudget(g);
  return `${spec.cols}×${spec.rows}  T≥9 ${b.t9.toFixed(1)}  T≥11 ${b.t11.toFixed(2)}  T≥13 ${b.t13.toFixed(2)}  T≥14 ${b.t14.toFixed(2)}  no vacías ${b.nonEmpty.toFixed(1)} %  | efectivo: T≥9 ${e.t9.toFixed(1)}  T≥11 ${e.t11.toFixed(2)}  T≥13 ${e.t13.toFixed(2)}  T≥14 ${e.t14.toFixed(2)}  luz media ${e.mean.toFixed(4)}`;
};

for (const lang of LANGS) {
  await ensureWords(lang);
  for (const vpName of VPS) {
    const vp = VIEWPORTS[vpName];
    if (!vp) throw new Error(`visor desconocido: ${vpName}`);
    if (has('tide')) {
      const from = arg('from', 'cover');
      const to = arg('to', 'hola');
      const [a, b] = await Promise.all([A(from), A(to)]);
      const SA = paintScene(a, vp, lang, makeFrame(1, STILL_T, 0, true));
      const SB = paintScene(b, vp, lang, makeFrame(1, STILL_T, 0, true));
      const tp = tideParams(vp.cssCw < 9);
      const ks = arg('ks', '76,52,28').split(',').map(Number);
      const files = [];
      for (const k of ks) {
        const out = makeCells(SA.spec.cols, SA.spec.rows);
        (has('tide-shared') ? compose : composeA)(out, SA.g, SB.g, SA.st.cls, SB.st.cls, SA.spec.rows * (k / 100), { band: tp.band, reach: tp.reach, t: STILL_T });
        files.push(await save(resolve(OUT, `tide${has('tide-shared') ? '-shared' : ''}-${from}-${to}-${lang}-${vpName}-${k}${TAG}.png`), out, vp));
      }
      console.log(files.join(' '));
      continue;
    }
    if (has('sheet')) {
      const top = (g) => ({ cols: g.cols, rows: Math.min(g.rows, Number(arg('rows', 34))), b: g.b.subarray(0, g.cols * Math.min(g.rows, Number(arg('rows', 34))) * 4) });
      for (const id of ['cover', 'hola']) {
        const [a, b] = [await BASE(id), await A(id)];
        const grids = [top(paintScene(a, vp, lang, makeFrame(1, STILL_T, 0, true)).g), top(paintScene(b, vp, lang, makeFrame(1, STILL_T, 0, true)).g)];
        console.log(await save(resolve(OUT, `hoja-${id}-${lang}-${vpName}${TAG}.png`), grids, vp));
      }
      continue;
    }
    for (const id of SCENES) {
      const sc = await A(id);
      if (has('arrival')) {
        const ps = arg('ps', '0.05,0.15,0.3,0.5,0.7,0.85').split(',').map(Number);
        const files = [];
        for (const p of ps) files.push(await save(resolve(OUT, `arrival-${id}-${lang}-${vpName}-p${p}${TAG}.png`), paintScene(sc, vp, lang, makeFrame(p, T, 0, false)).g, vp));
        console.log(files.join(' '));
        continue;
      }
      const p = Number(arg('p', 1));
      const f = makeFrame(p, T, 0, p === 1 && T === STILL_T);
      if (has('heat')) {
        const spec = specOf(vp);
        f.heat = new Float32Array(spec.cols * spec.rows);
        const hx = Number(arg('hx', spec.cols * 0.36));
        const hy = Number(arg('hy', spec.rows * 0.22));
        for (let y = 0; y < spec.rows; y++) for (let x = 0; x < spec.cols; x++) {
          const dx = (x - hx) / 13;
          const dy = (y - hy) / 6.5;
          const w = 1 - (dx * dx + dy * dy);
          f.heat[y * spec.cols + x] = w > 0 ? w * w : 0;
        }
        f.rings = [{ x: spec.cols * 0.72, y: spec.rows * 0.26, age: 0.35 }];
        f.e = 0.2;
      }
      if (has('wells')) {
        const spec = specOf(vp);
        const rects = [{ x: 8, y: 26, w: 92, h: 11, kind: 'ink' }, { x: 8, y: 37, w: 70, h: 4, kind: 'muted' }, { x: 8, y: 42, w: 50, h: 4, kind: 'ink' }];
        f.cap = buildCap(makeCap(spec.cols, spec.rows), spec.cols, spec.rows, rects, {});
      }
      const { g, spec } = paintScene(sc, vp, lang, f);
      if (has('wells')) applyCap(g, f.cap);
      const stem = `${id}-${lang}-${vpName}${has('heat') ? '-heat' : ''}${p !== 1 ? `-p${p}` : ''}${TAG}`;
      if (has('poster')) {
        const mode = Number(arg('poster', 1));
        const file = await save(resolve(OUT, `poster${mode}-${stem}.png`), posterOf(g, mode), vp);
        console.log(file, budgetLine(posterOf(g, mode), spec));
        continue;
      }
      console.log(await save(resolve(OUT, `${stem}.png`), g, vp), budgetLine(g, spec));
      if (has('base')) {
        const bs = await BASE(id);
        const bf = paintScene(bs, vp, lang, f);
        console.log(await save(resolve(OUT, `${stem}-base.png`), bf.g, vp), budgetLine(bf.g, bf.spec));
      }
    }
  }
}
await painter.close();
