// Paridad GL ↔ 2D: el mismo fotograma por WebGL2 y por Canvas 2D (fotograma fijo) debe dar la misma imagen:
// diferencia media por canal < 0,01 / 255 (R05 §3.6 midió 0,000–0,004 con esta técnica). El umbral de 0,01 se aplica a fotogramas REALES
// (escenas del motor); el «cuadro de glifos» (100 % de las celdas con glifos de fuente suavizados, el peor caso posible) solo
// exige máx ≤ 2/255 y media < 0,1/255 (redondeo de 8 bits de la mezcla). Se prueba con un «cuadro de glifos»
// que recorre los 147 glifos en todos los tonos y fondos (incluidas las sombras y las celdas de ancho impar) y con las escenas reales,
// a dpr 1, 1,5 y 2 y en móvil. Las capturas del lienzo se comparan en Node (sharp).
import sharp from 'sharp';
import { TMP, check, finish, info, launchBrowser, open, ready, shotCanvas, sleep } from './lib.mjs';

const browser = await launchBrowser();

async function diff(a, b, name) {
  const A = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return { error: `tamaños distintos ${A.info.width}×${A.info.height} vs ${B.info.width}×${B.info.height}` };
  let sum = 0;
  let max = 0;
  let over = 0;
  const n = A.data.length;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(A.data[i] - B.data[i]);
    sum += d;
    if (d > max) max = d;
    if (d > 2) over++;
  }
  void name;
  return { mean: sum / n, max, over: over / n, w: A.info.width, h: A.info.height };
}

/** Monta el «cuadro de glifos» con el motor real (escena inyectada) y devuelve la captura del lienzo. */
async function chartShot(opts, nogl) {
  const s = await open({ browser, ...opts });
  await ready(s.page);
  await sleep(1500);
  await s.page.evaluate(async (nogl) => {
    const { mountField } = await import('/src/ascii/engine.ts');
    const { GLYPH_COUNT } = await import('/src/ascii/glyphs.ts');
    window.__fieldApi.dispose();
    const scene = {
      id: 'chart',
      dawn: 0,
      arrival: { ms: 1 },
      build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
      paint(g) {
        for (let y = 0; y < g.rows; y++) {
          for (let x = 0; x < g.cols; x++) {
            const i = (y * g.cols + x) * 4;
            const glyph = (x * 7 + y * 13 + ((x * y) >> 3)) % GLYPH_COUNT;
            g.b[i] = glyph;
            g.b[i + 1] = (x + y * 3 + (glyph >> 4)) & 15;
            g.b[i + 2] = ((y >> 2) + (x >> 4)) & 3 ? 0 : (x + y) % 5;
            g.b[i + 3] = 1;
          }
        }
      },
    };
    const posters = [{ id: 'chart', el: document.querySelector('main') }];
    window.__f2 = await mountField({ canvas: document.querySelector('canvas.field'), lang: 'es', posters, wells: () => [], params: new URLSearchParams('still&poster=chart' + (nogl ? '&nogl' : '')), loadScene: async () => scene });
  }, nogl);
  await sleep(900);
  const file = `${TMP}/parity-chart-${nogl ? '2d' : 'gl'}-${opts.w}x${opts.h}-dpr${opts.dpr}.png`;
  await shotCanvas(s.page, file);
  const r = await s.page.evaluate(() => window.__field.renderer);
  const logs = s.logs.slice();
  await s.close();
  return { file, renderer: r, logs };
}

async function sceneShot(opts, poster, nogl) {
  const q = `?still&poster=${poster}${nogl ? '&nogl' : ''}`;
  const s = await open({ browser, path: `/lab/field/${q}`, ...opts });
  await ready(s.page);
  await sleep(900);
  const file = `${TMP}/parity-${poster.replace(/[^a-z0-9]/gi, '_')}-${nogl ? '2d' : 'gl'}-${opts.w}x${opts.h}-dpr${opts.dpr}.png`;
  await shotCanvas(s.page, file);
  const r = await s.page.evaluate(() => window.__field.renderer);
  await s.close();
  return { file, renderer: r };
}

const VIEWS = [
  { w: 1440, h: 900, dpr: 1 },
  { w: 1440, h: 900, dpr: 2 },
  { w: 1440, h: 900, dpr: 1.5 },
  { w: 1440, h: 900, dpr: 1.25 },
  { w: 390, h: 844, dpr: 1.5, mobile: true },
  { w: 390, h: 844, dpr: 3, mobile: true },
];
for (const v of VIEWS) {
  const tag = `${v.w}×${v.h} @${v.dpr}`;
  const gl = await chartShot(v, false);
  const d2 = await chartShot(v, true);
  check(`${tag}: cuadro de glifos: GL y 2D son los renderizadores pedidos`, gl.renderer === 'gl' && d2.renderer === '2d', `${gl.renderer}/${d2.renderer}`);
  const r = await diff(gl.file, d2.file);
  // peor caso: el 100 % de las celdas lleva glifos de fuente suavizados; la diferencia es solo el redondeo de 8 bits de la mezcla (máx. 1–2/255)
  check(`${tag}: cuadro de glifos (peor caso): |Δ| máx ≤ 2/255 y media < 0,1/255`, r.mean !== undefined && r.max <= 2 && r.mean < 0.1, r.error ?? `media ${r.mean.toFixed(5)}/255 · máx ${r.max} · píxeles con |Δ| > 2: ${(r.over * 100).toFixed(4)} %`);
  check(`${tag}: cuadro de glifos: consola limpia`, gl.logs.length === 0, gl.logs.join(' | '));
}
for (const v of VIEWS.slice(1, 5)) {
  for (const poster of ['cover&p=1', 'hola&p=0.5', 'mist&p=1']) {
    const a = await sceneShot(v, poster, false);
    const b = await sceneShot(v, poster, true);
    const r = await diff(a.file, b.file);
    check(`${v.w}×${v.h} @${v.dpr}: escena ${poster}: GL ↔ 2D media < 0,01/255`, r.mean !== undefined && r.mean < 0.01, r.error ?? `media ${r.mean.toFixed(5)} · máx ${r.max} · |Δ|>2: ${(r.over * 100).toFixed(4)} %`);
  }
}
await browser.close();
info(`capturas intermedias en ${TMP}`);
finish('paridad GL ↔ 2D');
