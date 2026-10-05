// Huellas de regresión (T19) de las escenas oficiales (cover, hola, mist: estilo Duotono): hash de toText() + toTones() (fg y bg) del fotograma `still` de cada
// escena × idioma × rejilla, más unos fotogramas de llegada, un cuadro de marea y las 4 capas del póster de la portada. Las usa scenes.test.mjs (en este proceso,
// en procesos hijos y con V8 sin JIT) y se guardan en golden.json con el prefijo «scene/».
import { createHash } from 'node:crypto';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from './scene-env.mjs';
import { STILL_T, makeCells, makeFrame, toText, toTones } from '../../../src/ascii/scenes/common.ts';
import { renderPosterLayersDuo } from '../../../src/ascii/ssr.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';
import { cover } from '../../../src/ascii/scenes/cover.ts';
import { hola } from '../../../src/ascii/scenes/hola.ts';
import { mistScene } from '../../../src/ascii/scenes/mist.ts';

const SEP = String.fromCharCode(0);
const sha = (...parts) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex').slice(0, 32);
};
export const gridSha = (g) => sha(toText(g), SEP, toTones(g, 1), SEP, toTones(g, 2));

const SCENES = { cover, hola, mist: mistScene };
/** Rejillas de los hashes: L de escritorio (9×18), L de 1600×900 (12×25), M de tablet, S móvil A07 y XS móvil estrecho. */
export const HASH_VIEWPORTS = ['d1440', 'd1600', 't1024', 'm360', 'm320'];

function paintSt(scene, vp, lang, frame) {
  const spec = specOf(VIEWPORTS[vp]);
  const st = scene.build(spec, lang, wordsFor(scene.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  scene.paint(g, st, frame);
  return { g, st };
}
const paint = (scene, vp, lang, frame) => paintSt(scene, vp, lang, frame).g;

export async function computeSceneHashes() {
  const out = {};
  for (const lang of ['es', 'en']) await ensureWords(lang);
  for (const lang of ['es', 'en']) {
    for (const id of ['cover', 'hola', 'mist']) {
      for (const vp of HASH_VIEWPORTS) out[`scene/${id}/${lang}/${vp}/still`] = gridSha(paint(SCENES[id], vp, lang, makeFrame(1, STILL_T, 0, true)));
    }
  }
  // llegada: la ignición de GAYA a mitad y al 90 %, la llegada de HOLA a mitad, en escritorio y móvil
  out['scene/cover/es/d1440/p30'] = gridSha(paint(cover, 'd1440', 'es', makeFrame(0.3, 3.3, 0, false)));
  out['scene/cover/es/m360/p60'] = gridSha(paint(cover, 'm360', 'es', makeFrame(0.6, 5.1, 0.3, false)));
  out['scene/hola/es/d1440/p50'] = gridSha(paint(hola, 'd1440', 'es', makeFrame(0.5, 3.3, 0, false)));
  out['scene/hola/en/m360/p50'] = gridSha(paint(hola, 'm360', 'en', makeFrame(0.5, 7.1, 0.4, false)));
  out['scene/mist/es/d1440/e1'] = gridSha(paint(mistScene, 'd1440', 'es', makeFrame(1, 12.3, 1, false)));
  // la marea cover → hola con el frente a 76 %, 52 % y 28 % de la altura, en escritorio y móvil (compose de tide.ts con las escenas oficiales)
  for (const [vp, mobile] of [['d1440', false], ['m390', true]]) {
    const spec = specOf(VIEWPORTS[vp]);
    const a = paintSt(cover, vp, 'es', makeFrame(1, STILL_T, 0, true));
    const b = paintSt(hola, vp, 'es', makeFrame(1, STILL_T, 0, true));
    const tp = tideParams(mobile);
    for (const k of [76, 52, 28]) {
      const o = makeCells(spec.cols, spec.rows);
      compose(o, a.g, b.g, a.st.cls, b.st.cls, spec.rows * (k / 100), { band: tp.band, reach: tp.reach, t: STILL_T });
      out[`scene/tide/cover-hola/${vp}/${k}`] = gridSha(o);
    }
  }
  // póster SSR de la portada: wide 160×50, mid 113×44 y stack 65×70, las tres capas de tono en ES y EN
  for (const lang of ['es', 'en']) {
    for (const [name, vp] of [['wide', 'd1440'], ['mid', 't1024'], ['stack', 'm390']]) {
      const spec = specOf(VIEWPORTS[vp]);
      const L = renderPosterLayersDuo(cover, spec, lang, wordsFor('cover', lang, spec));
      out[`scene/poster/${lang}/${name}`] = sha(L.dim, '\u0001', L.mid, '\u0001', L.hot, '\u0001', L.spark);
    }
  }
  return out;
}
