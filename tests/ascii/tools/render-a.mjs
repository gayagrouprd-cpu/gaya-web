// Renderiza las escenas REALES (cover, hola, mist…) a PNG con el pintor de celdas de Chrome y la paleta de tones.gen.ts para
// MIRAR el arte (revisión de dirección de arte). Uso:
//   node tests/ascii/tools/render-a.mjs --scene cover --vp d1440,m360 --lang es [--p 1] [--t 21.7] [--tag -r1] [--out reports/ascii/WP6]
//   node tests/ascii/tools/render-a.mjs --tide --vp d1440,m390 [--lang es] [--ks 76,52,28] [--from cover --to hola]   (marea entre dos escenas con el frente a esos % de la altura)
//   node tests/ascii/tools/render-a.mjs --scene cover --arrival --vp d1440          (fotogramas de la ignición p = 0,1 … 0,8)
//   node tests/ascii/tools/render-a.mjs --scene cover --heat --vp d1440             (calor del puntero y anillos)
// `--face glyph` pide la variante de caras con textura de glifos si la escena la tiene; `--budget` imprime el presupuesto de tono.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPainter } from './paint.mjs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { toneBudget } from '../fixtures/scene-rules.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { loadScene } from '../../../src/ascii/scenes/index.ts';
import { createCover } from '../../../src/ascii/scenes/cover.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 || args[i + 1]?.startsWith('--') ? d : args[i + 1];
};
const OUT = resolve(arg('out', 'reports/ascii/WP6'));
const TAG = arg('tag', '');
const LANGS = arg('lang', 'es').split(',');
const VPS = arg('vp', 'd1440,m360').split(',');
const SCENES = arg('scene', 'cover').split(',');
const T = Number(arg('t', STILL_T));
const DPR = arg('dpr', null);
const FACE = arg('face', null);
const LEVEL = arg('level', null);
mkdirSync(OUT, { recursive: true });

const painter = await createPainter();
const opts = (vp, dpr) => ({ cssCw: vp.cssCw, cssCh: vp.cssCh, dpr: DPR ? Number(DPR) : dpr ?? vp.dpr, gap: 14 });

async function scene(id) {
  if ((FACE || LEVEL) && id === 'cover') return createCover({ face: FACE ?? 'solid', level: LEVEL ? Number(LEVEL) : undefined });
  return loadScene(id);
}

function paintScene(sc, vp, lang, frame) {
  const spec = specOf(vp);
  const st = sc.build(spec, lang, wordsFor(sc.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  sc.paint(g, st, frame);
  return { g, st, spec };
}

for (const lang of LANGS) {
  await ensureWords(lang);
  for (const vpName of VPS) {
    const vp = VIEWPORTS[vpName];
    if (!vp) throw new Error(`visor desconocido: ${vpName}`);
    if (has('tide')) {
      const from = arg('from', 'cover');
      const to = arg('to', 'hola');
      const a = await scene(from);
      const b = await scene(to);
      const A = paintScene(a, vp, lang, makeFrame(1, STILL_T, 0, true));
      const B = paintScene(b, vp, lang, makeFrame(1, STILL_T, 0, true));
      const mobile = vp.cssCw < 9;
      const tp = tideParams(mobile);
      const ks = arg('ks', '76,52,28').split(',').map(Number);
      const shots = ks.map((k) => k / 100).map((k) => {
        const out = makeCells(A.spec.cols, A.spec.rows);
        compose(out, A.g, B.g, A.st.cls, B.st.cls, A.spec.rows * k, { band: tp.band, reach: tp.reach, t: STILL_T });
        return out;
      });
      const files = [];
      for (let i = 0; i < shots.length; i++) {
        const file = resolve(OUT, `tide-${from}-${to}-${lang}-${vpName}-${ks[i]}${TAG}.png`);
        await painter.save(file, shots[i], opts(vp, vp.cssCw < 9 ? 2 : 1));
        files.push(file);
      }
      console.log(files.join(' '));
      continue;
    }
    for (const id of SCENES) {
      const sc = await scene(id);
      if (has('arrival')) {
        const ps = arg('ps', '0.05,0.15,0.3,0.5,0.7,0.85').split(',').map(Number);
        const files = [];
        for (const p of ps) {
          const file = resolve(OUT, `arrival-${id}-${lang}-${vpName}-p${p}${TAG}.png`);
          await painter.save(file, paintScene(sc, vp, lang, makeFrame(p, T, 0, false)).g, opts(vp, vp.cssCw < 9 ? 2 : 1));
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
      const { g, spec } = paintScene(sc, vp, lang, f);
      const name = `${id}-${lang}-${vpName}${has('heat') ? '-heat' : ''}${p !== 1 ? `-p${p}` : ''}${TAG}.png`;
      const file = resolve(OUT, name);
      await painter.save(file, g, opts(vp));
      const b = toneBudget(g);
      console.log(file, has('budget') || true ? `${spec.cols}×${spec.rows}  T≥9 ${b.t9.toFixed(1)}  T≥11 ${b.t11.toFixed(1)}  T≥13 ${b.t13.toFixed(2)}  T≥14 ${b.t14.toFixed(2)}  no vacías ${b.nonEmpty.toFixed(1)} %` : '');
    }
  }
}
await painter.close();
