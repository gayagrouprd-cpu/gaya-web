// Renderiza la escena de prueba (y la marea entre dos escenas de prueba) a PNG con el pintor de Chrome, para MIRAR el arte.
// Uso: node tests/ascii/tools/render.mjs [--out reports/ascii/WP4] [--only still|mobile|arrival|tide|all] [--dpr 2]
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTestScene } from '../fixtures/scene.ts';
import { GAYA_L_SET, GAYA_STACK, ON_L_SET, ON_S_SET } from '../fixtures/words.mjs';
import { createPainter } from './paint.mjs';
import { STILL_T, makeCells, makeFrame, specDesktop, specMobile } from '../../../src/ascii/scenes/common.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? d : process.argv[i + 1];
};
const OUT = resolve(arg('out', 'reports/ascii/WP4'));
const ONLY = arg('only', 'all');
const DPR = Number(arg('dpr', 2));
mkdirSync(OUT, { recursive: true });

const painter = await createPainter();
const want = (k) => ONLY === 'all' || ONLY === k;

function render(scene, spec, set, frame) {
  const st = scene.build(spec, 'es', [set]);
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, frame);
  return { g, st };
}

const desk = specDesktop();
const mob = specMobile();
const cover = createTestScene({ id: 'cover', base: 8, glass: true });
const on = createTestScene({ id: 'on', base: 9, glass: false, yTop: 12, ms: 1900 });

if (want('still')) {
  const { g } = render(cover, desk, GAYA_L_SET, makeFrame(1, STILL_T, 0, true));
  console.log(await painter.save(resolve(OUT, 'still-desktop-1440x900.png'), g, { cssCw: 9, dpr: DPR }));
}
if (want('mobile')) {
  const { g } = render(cover, mob, GAYA_STACK, makeFrame(1, STILL_T, 0, true));
  console.log(await painter.save(resolve(OUT, 'still-mobile-360x800.png'), g, { cssCw: 6, dpr: DPR }));
}
if (want('arrival')) {
  const frames = [0.1, 0.3, 0.55, 0.8].map((p) => render(cover, desk, GAYA_L_SET, makeFrame(p, STILL_T, 0, false)).g);
  console.log(await painter.save(resolve(OUT, 'arrival-p10-30-55-80.png'), frames, { cssCw: 9, dpr: 1, gap: 14 }));
}
if (want('tide')) {
  // el frente a 76 %, 52 % y 28 % de la altura (los tres fotogramas de la marea que se vieron en color, §2.1)
  const a = render(cover, desk, GAYA_L_SET, makeFrame(1, STILL_T, 0, true));
  const b = render(on, desk, ON_L_SET, makeFrame(1, STILL_T, 0, true));
  const tp = tideParams(false);
  const shots = [0.76, 0.52, 0.28].map((k) => {
    const out = makeCells(desk.cols, desk.rows);
    compose(out, a.g, b.g, a.st.cls, b.st.cls, desk.rows * k, { band: tp.band, reach: tp.reach, t: STILL_T });
    return out;
  });
  console.log(await painter.save(resolve(OUT, 'tide-desktop-76-52-28.png'), shots, { cssCw: 9, dpr: 1, gap: 14 }));
  const am = render(cover, mob, GAYA_STACK, makeFrame(1, STILL_T, 0, true));
  const bm = render(createTestScene({ id: 'on', base: 9, glass: false, yTop: 12, ms: 1900 }), mob, ON_S_SET, makeFrame(1, STILL_T, 0, true));
  const tm = tideParams(true);
  const mshots = [0.7, 0.45].map((k) => {
    const out = makeCells(mob.cols, mob.rows);
    compose(out, am.g, bm.g, am.st.cls, bm.st.cls, mob.rows * k, { band: tm.band, reach: tm.reach, t: STILL_T });
    return out;
  });
  console.log(await painter.save(resolve(OUT, 'tide-mobile-70-45.png'), mshots, { cssCw: 6, dpr: 1, gap: 14 }));
}
await painter.close();
