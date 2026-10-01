// Huellas de regresión de WP4 (T19): hash de toText() + toTones() de cada pieza del núcleo a fotogramas fijos.
// Las usan golden.test.mjs (en este proceso y en procesos hijos) y tools/bench.mjs.
import { createHash } from 'node:crypto';
import { createTestScene } from './scene.ts';
import { GAYA_L_SET, GAYA_M_SET, GAYA_STACK, ON_L_SET, GAYA_L } from './words.mjs';
import {
  STILL_T, bakeWaterTile, bn, edt, faceFn, gridSpec, makeCells, makeFrame, specDesktop, specMobile, toText, toTones, waterTile,
} from '../../../src/ascii/scenes/common.ts';
import { compose, tideParams } from '../../../src/ascii/tide.ts';
import { buildCap, makeCap } from '../../../src/ascii/wells.ts';
import { renderPosterLayers } from '../../../src/ascii/ssr.ts';

const SEP = String.fromCharCode(0);

export const sha = (...parts) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(typeof p === 'string' ? p : Buffer.from(p.buffer, p.byteOffset, p.byteLength));
  return h.digest('hex').slice(0, 32);
};
export const gridSha = (g) => sha(toText(g), SEP, toTones(g, 1), SEP, toTones(g, 2));

export function computeHashes() {
  const out = {};
  const cover = createTestScene({ id: 'cover', base: 8, glass: true });
  const on = createTestScene({ id: 'on', base: 9, glass: false, yTop: 12, ms: 1900 });
  const desk = specDesktop();
  const mob = specMobile();
  const mid = gridSpec(113, 44, 9, 18, 2);
  const render = (scene, spec, set, frame) => {
    const st = scene.build(spec, 'es', [set]);
    const g = makeCells(spec.cols, spec.rows);
    scene.paint(g, st, frame);
    return { g, st };
  };

  out['still-desktop'] = gridSha(render(cover, desk, GAYA_L_SET, makeFrame(1, STILL_T, 0, true)).g);
  out['still-mobile'] = gridSha(render(cover, mob, GAYA_STACK, makeFrame(1, STILL_T, 0, true)).g);
  out['still-mid'] = gridSha(render(cover, mid, GAYA_M_SET, makeFrame(1, STILL_T, 0, true)).g);
  out['arrival-p30-desktop'] = gridSha(render(cover, desk, GAYA_L_SET, makeFrame(0.3, 3.3, 0, false)).g);
  out['arrival-p55-mobile'] = gridSha(render(cover, mob, GAYA_STACK, makeFrame(0.55, 7.1, 0.4, false)).g);

  const heat = new Float32Array(desk.cols * desk.rows);
  for (let y = 0; y < desk.rows; y++) for (let x = 0; x < desk.cols; x++) {
    const dx = (x - 70) / 14;
    const dy = (y - 9) / 7;
    const w = 1 - (dx * dx + dy * dy);
    heat[y * desk.cols + x] = w > 0 ? w * w : 0;
  }
  const fh = makeFrame(1, STILL_T, 0.2, false);
  fh.heat = heat;
  fh.rings = [{ x: 40, y: 12, age: 0.35 }, { x: 100, y: 14, age: 0.8 }];
  out['heat-rings-desktop'] = gridSha(render(cover, desk, GAYA_L_SET, fh).g);

  const a = render(cover, desk, GAYA_L_SET, makeFrame(1, STILL_T, 0, true));
  const b = render(on, desk, ON_L_SET, makeFrame(1, STILL_T, 0, true));
  out['still-on-desktop'] = gridSha(b.g);
  const tp = tideParams(false);
  // El frente se coloca por su FILA (fracción de la altura), no por u: con la curva de entrada y salida, u = 0,25 y u = 0,75 dejan el frente
  // FUERA de pantalla (el cuadro sale idéntico al still) y esas huellas no fijaban nada. Aquí el frente recorre la pantalla a 76 %, 52 % y
  // 28 % (los tres fotogramas en color de DIRECTION §2.1) y la palabra (filas 6–22) queda bajo el frente, cruzada y por encima.
  const tideAt = (k, dir, from, to) => {
    const o = makeCells(desk.cols, desk.rows);
    compose(o, from.g, to.g, from.st.cls, to.st.cls, desk.rows * k, { band: tp.band, reach: tp.reach, t: STILL_T, dir });
    return gridSha(o);
  };
  out['tide-advance-76'] = tideAt(0.76, 1, a, b);
  out['tide-advance-52'] = tideAt(0.52, 1, a, b);
  out['tide-advance-28'] = tideAt(0.28, 1, a, b);
  out['tide-retreat-52'] = tideAt(0.52, -1, b, a);
  out['still-cover-desktop'] = gridSha(a.g);

  const L = renderPosterLayers(cover, desk, 'es', [GAYA_L_SET]);
  out['poster-wide'] = sha(L.dim, '\u0001', L.mid, '\u0001', L.hot, '\u0001', L.spark);
  const S = renderPosterLayers(cover, gridSpec(65, 70, 6, 12, 2), 'es', [GAYA_STACK]);
  out['poster-stack'] = sha(S.dim, '\u0001', S.mid, '\u0001', S.hot, '\u0001', S.spark);

  out['water-tile'] = sha(bakeWaterTile(9));
  out['water-tile-default'] = sha(waterTile());
  const bnv = new Float64Array(64 * 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) bnv[y * 64 + x] = bn(x, y);
  out['bn-64'] = sha(bnv);
  out['edt-gaya'] = sha(edt(GAYA_L, 130, 24, 4, 4));
  const f = faceFn(GAYA_L, 0, 0);
  out['facefn-gaya'] = sha(f.cls, f.dist);

  const cap = makeCap(desk.cols, desk.rows);
  buildCap(cap, desk.cols, desk.rows, [{ x: 8, y: 26, w: 92, h: 11, kind: 'ink' }, { x: 8, y: 37, w: 70, h: 4, kind: 'muted' }], { v: 1800, dt: 1 / 30, ch: 18, energy: 0.7 });
  out['wells-cap'] = sha(cap);
  return out;
}
