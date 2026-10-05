// Variante B · «El agua hecha del nombre»: renderiza las escenas de src/ascii/scenes/variants/b/ a PNG con el pintor real (Chrome + Geist Mono 500,
// bloques por código, paleta de 16 tonos) y las compara con la base sólida (scenes/cover.ts y hola.ts). Uso:
//   node tests/ascii/tools/render-variant-b.mjs --scene cover,hola --vp d1440,m360,d1920 --lang es,en [--tag -r1] [--out reports/ascii/art-b]
//   ... --opts '{"cover":{"wall":"letter"},"hola":{"seam":0.5}}'     opciones de createCoverB / createHolaB
//   ... --base                        pinta también la base sólida (sufijo -base)
//   ... --sheet                       hoja de comparación base ↔ B (cover y hola) por visor
//   ... --crop 20,2,60,18 --dpr 3     recorte en celdas (x,y,w,h) y escala de píxel para ver los glifos de cerca
//   ... --arrival --ps 0.1,0.3,0.6    ignición/llegada a esos p
//   ... --heat                        calor del puntero y anillos
//   ... --tide [--from cover --to hola] --ks 76,52,28 [--tide-shared]   marea (composeB; con --tide-shared, la compose de la base)
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPainter } from './paint.mjs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { toneBudget } from '../fixtures/scene-rules.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover as coverBase } from '../../../src/ascii/scenes/cover.ts';
import { hola as holaBase } from '../../../src/ascii/scenes/hola.ts';
import { createCoverB } from '../../../src/ascii/scenes/variants/b/cover.ts';
import { createHolaB } from '../../../src/ascii/scenes/variants/b/hola.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';
import { composeB } from '../../../src/ascii/scenes/variants/b/tide.ts';

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 || args[i + 1]?.startsWith('--') ? d : args[i + 1];
};
const OUT = resolve(arg('out', 'reports/ascii/art-b'));
const TAG = arg('tag', '');
const LANGS = arg('lang', 'es').split(',');
const VPS = arg('vp', 'd1440,m360').split(',');
const SCENES = arg('scene', 'cover').split(',');
const T = Number(arg('t', STILL_T));
const DPR = arg('dpr', null);
const OPTS = JSON.parse(arg('opts', '{}'));
const CROP = arg('crop', null)?.split(',').map(Number);
mkdirSync(OUT, { recursive: true });

const painter = await createPainter();
const opts = (vp, dpr) => ({ cssCw: vp.cssCw, cssCh: vp.cssCh, dpr: DPR ? Number(DPR) : dpr ?? vp.dpr, gap: 14 });

const SCENE_B = { cover: createCoverB(OPTS.cover ?? {}), hola: createHolaB(OPTS.hola ?? {}) };
const SCENE_BASE = { cover: coverBase, hola: holaBase };
const pick = (id, base) => (base ? SCENE_BASE[id] : SCENE_B[id]);

function paintScene(sc, vp, lang, frame) {
  const spec = specOf(vp);
  const st = sc.build(spec, lang, wordsFor(sc.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  sc.paint(g, st, frame);
  return { g, st, spec };
}
function crop(g, x0, y0, w, h) {
  const out = makeCells(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x;
    const sy = y0 + y;
    if (sx < 0 || sy < 0 || sx >= g.cols || sy >= g.rows) continue;
    out.b.set(g.b.subarray((sy * g.cols + sx) * 4, (sy * g.cols + sx) * 4 + 4), (y * w + x) * 4);
  }
  return out;
}
const view = (g) => (CROP ? crop(g, ...CROP) : g);
const fmt = (b) => `T≥9 ${b.t9.toFixed(1)}  T≥11 ${b.t11.toFixed(1)}  T≥13 ${b.t13.toFixed(2)}  T≥14 ${b.t14.toFixed(2)}  no vacías ${b.nonEmpty.toFixed(1)} %`;

for (const lang of LANGS) {
  await ensureWords(lang);
  for (const vpName of VPS) {
    const vp = VIEWPORTS[vpName];
    if (!vp) throw new Error(`visor desconocido: ${vpName}`);
    const mobile = vp.cssCw < 9;
    const dprOf = (v) => (v.cssCw < 9 ? 2 : 1);

    if (has('sheet')) {
      // hoja: base y B, cover y hola, recortadas a la zona de la palabra
      const rowsCrop = mobile ? 44 : 30;
      const grids = [];
      for (const id of ['cover', 'hola']) for (const base of [true, false]) {
        const { g } = paintScene(pick(id, base), vp, lang, makeFrame(1, T, 0, true));
        grids.push(crop(g, 0, 0, g.cols, rowsCrop));
      }
      const file = resolve(OUT, `sheet-${lang}-${vpName}${TAG}.png`);
      if (mobile) {
        // móvil: dos columnas (base | B) por escena para que la imagen no sea larguísima: se guardan por pares
        await painter.save(resolve(OUT, `sheet-cover-${lang}-${vpName}${TAG}.png`), [grids[0], grids[1]], opts(vp, 1));
        await painter.save(resolve(OUT, `sheet-hola-${lang}-${vpName}${TAG}.png`), [grids[2], grids[3]], opts(vp, 1));
        console.log(resolve(OUT, `sheet-cover-${lang}-${vpName}${TAG}.png`), resolve(OUT, `sheet-hola-${lang}-${vpName}${TAG}.png`));
      } else {
        await painter.save(file, grids, opts(vp, 1));
        console.log(file);
      }
      continue;
    }

    if (has('tide')) {
      const from = arg('from', 'cover');
      const to = arg('to', 'hola');
      const A = paintScene(pick(from, false), vp, lang, makeFrame(1, STILL_T, 0, true));
      const B = paintScene(pick(to, false), vp, lang, makeFrame(1, STILL_T, 0, true));
      const tp = tideParams(mobile);
      const ks = arg('ks', '76,52,28').split(',').map(Number);
      const files = [];
      for (const k of ks) {
        const out = makeCells(A.spec.cols, A.spec.rows);
        const f = has('tide-shared') ? compose : composeB;
        f(out, A.g, B.g, A.st.cls, B.st.cls, A.spec.rows * (k / 100), { band: tp.band, reach: tp.reach, t: STILL_T });
        const file = resolve(OUT, `tide-${from}-${to}-${lang}-${vpName}-${k}${TAG}.png`);
        await painter.save(file, view(out), opts(vp, dprOf(vp)));
        files.push(file);
      }
      console.log(files.join(' '));
      continue;
    }

    for (const id of SCENES) {
      const sc = pick(id, has('base-only'));
      if (has('arrival')) {
        const ps = arg('ps', '0.05,0.15,0.3,0.5,0.7,0.85').split(',').map(Number);
        const files = [];
        for (const p of ps) {
          const file = resolve(OUT, `arrival-${id}-${lang}-${vpName}-p${p}${TAG}.png`);
          await painter.save(file, view(paintScene(sc, vp, lang, makeFrame(p, T, 0, false)).g), opts(vp, dprOf(vp)));
          files.push(file);
        }
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
      const sets = has('base') ? [true, false] : [has('base-only')];
      for (const base of sets) {
        const { g, spec } = paintScene(pick(id, base), vp, lang, f);
        const name = `${id}-${lang}-${vpName}${base ? '-base' : ''}${has('heat') ? '-heat' : ''}${p !== 1 ? `-p${p}` : ''}${CROP ? '-crop' : ''}${TAG}.png`;
        const file = resolve(OUT, name);
        await painter.save(file, view(g), opts(vp));
        console.log(file, `${spec.cols}×${spec.rows}  ${fmt(toneBudget(g))}${base ? '  (base)' : ''}`);
      }
    }
  }
}
await painter.close();
