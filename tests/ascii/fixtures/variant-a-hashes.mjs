// Huellas de regresión de la Variante A · Duotono ANSI (hash de glifo + fg + bg del fotograma `still`, algunos de llegada y de calor, la marea de
// la variante y el póster colapsado). No se guardan en golden.json (archivo compartido): scenes-variant-a.test.mjs las compara entre ejecuciones,
// procesos y V8 con y sin JIT.
import { createHash } from 'node:crypto';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './scene-env.mjs';
import { STILL_T, makeCells, makeFrame, toText, toTones } from '../../../src/ascii/scenes/common.ts';
import { toLayers } from '../../../src/ascii/grid.ts';
import { coverA } from '../../../src/ascii/scenes/variants/a/cover.ts';
import { holaA } from '../../../src/ascii/scenes/variants/a/hola.ts';
import { composeA } from '../../../src/ascii/scenes/variants/a/tide-a.ts';
import { posterCollapse } from '../../../src/ascii/scenes/variants/a/poster-a.ts';
import { tideParams } from '../../../src/ascii/tide.ts';

const SEP = String.fromCharCode(0);
const sha = (...parts) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex').slice(0, 32);
};
export const gridSha = (g) => sha(toText(g), SEP, toTones(g, 1), SEP, toTones(g, 2));
const SCENES = { cover: coverA, hola: holaA };
export const HASH_VIEWPORTS = ['d1440', 'd1600', 't1024', 'm360', 'm320'];

function paint(scene, vp, lang, frame) {
  const spec = specOf(VIEWPORTS[vp]);
  const st = scene.build(spec, lang, wordsFor(scene.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, frame);
  return { g, st, spec };
}

export async function computeVariantHashes() {
  const out = {};
  for (const lang of ['es', 'en']) await ensureWords(lang);
  for (const lang of ['es', 'en']) for (const id of ['cover', 'hola']) for (const vp of HASH_VIEWPORTS) out[`a/${id}/${lang}/${vp}/still`] = gridSha(paint(SCENES[id], vp, lang, makeFrame(1, STILL_T, 0, true)).g);
  out['a/cover/es/d1440/p30'] = gridSha(paint(coverA, 'd1440', 'es', makeFrame(0.3, 3.3, 0, false)).g);
  out['a/cover/es/m360/p60'] = gridSha(paint(coverA, 'm360', 'es', makeFrame(0.6, 5.1, 0.3, false)).g);
  out['a/hola/es/d1440/p50'] = gridSha(paint(holaA, 'd1440', 'es', makeFrame(0.5, 3.3, 0, false)).g);
  // marea de la variante cover → hola con el frente al 52 %
  for (const vp of ['d1440', 'm390']) {
    const a = paint(coverA, vp, 'es', makeFrame(1, STILL_T, 0, true));
    const b = paint(holaA, vp, 'es', makeFrame(1, STILL_T, 0, true));
    const tp = tideParams(VIEWPORTS[vp].cssCw < 9);
    const o = makeCells(a.spec.cols, a.spec.rows);
    composeA(o, a.g, b.g, a.st.cls, b.st.cls, a.spec.rows * 0.52, { band: tp.band, reach: tp.reach, t: STILL_T });
    out[`a/tide/${vp}`] = gridSha(o);
  }
  // póster colapsado de la portada: wide, mid y stack
  for (const lang of ['es', 'en']) {
    for (const [name, vp] of [['wide', 'd1440'], ['mid', 't1024'], ['stack', 'm390']]) {
      const { g } = paint(coverA, vp, lang, makeFrame(1, STILL_T, 0, true));
      posterCollapse(g);
      const L = toLayers(g);
      out[`a/poster/${lang}/${name}`] = sha(L.dim, '\u0001', L.mid, '\u0001', L.hot, '\u0001', L.spark);
    }
  }
  return out;
}
