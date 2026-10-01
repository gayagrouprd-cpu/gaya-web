// T8 (lado del motor) · costuras: bloques y cajas se dibujan por código con rectángulos de píxeles enteros, así que entre celdas no
// hay huecos a ningún dpr. Con AMBOS renderizadores (WebGL2 y Canvas 2D) se rellena el lienzo de `█` (debe ser un color uniforme) y de
// `│` / `─` (la línea debe ser continua por toda la pantalla), y se mide el peor hueco en la captura real; umbral de T8: ≤ 40/255.
// Además una MALLA ALTERNA de cuadrantes (▗ ▖ / ▝ ▘): cada 2×2 celdas forman un cuadrado que CRUZA las juntas en horizontal y en vertical;
// la captura debe ser un tablero exacto (barras de cw × ch píxeles, sin ningún píxel fuera de su sitio) incluso con celdas de ancho impar.
// Incluye dpr fraccionario (la caja CSS del lienzo es cols·cw/dpr: 1:1 con la pantalla) y celdas de ancho impar (A07: 9 px a dpr 1,5).
// El dpr fraccionario de ESCRITORIO (Windows al 125 %/150 %/175 %) se prueba con un Chrome de dpr REAL (--force-device-scale-factor, zoom-for-dsf):
// el dpr emulado por CDP ajusta las cajas a px CSS enteros y falsearía la medida (deriva de medio píxel que en una pantalla real no existe).
import sharp from 'sharp';
import { TMP, check, finish, launchBrowser, launchRealDsf, open, ready, shotCanvas, sleep } from './lib.mjs';

const browser = await launchBrowser();
const real = new Map(); // dpr fraccionario de escritorio → Chrome de dpr real
const VIEWS = [
  { w: 1440, h: 900, dpr: 1 },
  { w: 1440, h: 900, dpr: 1.25, real: true },
  { w: 1440, h: 900, dpr: 1.5, real: true },
  { w: 1440, h: 900, dpr: 1.75, real: true },
  { w: 1440, h: 900, dpr: 2 },
  { w: 1440, h: 900, dpr: 2.625 },
  { w: 390, h: 844, dpr: 1.5, mobile: true },
  { w: 390, h: 844, dpr: 3, mobile: true },
];

async function shot(v, kind, nogl) {
  if (v.real && !real.has(v.dpr)) real.set(v.dpr, await launchRealDsf(v.dpr, v.w, v.h));
  const s = await open({ ...v, browser: v.real ? real.get(v.dpr) : browser, realDsf: !!v.real });
  await ready(s.page);
  await sleep(1200);
  await s.page.evaluate(async ({ kind, nogl }) => {
    const { mountField } = await import('/src/ascii/engine.ts');
    const { glyphIndex } = await import('/src/ascii/glyphs.ts');
    window.__fieldApi.dispose();
    const glyph = glyphIndex({ full: '█', v: '│', h: '─', cross: '┼' }[kind] ?? '█');
    // malla: ▗ (x par, y par) · ▖ (x impar, y par) · ▝ (x par, y impar) · ▘ (x impar, y impar)
    const quad = [glyphIndex('▗'), glyphIndex('▖'), glyphIndex('▝'), glyphIndex('▘')];
    const scene = {
      id: 'seam',
      dawn: 0,
      arrival: { ms: 1 },
      build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
      paint(g) {
        for (let y = 0; y < g.rows; y++) {
          for (let x = 0; x < g.cols; x++) {
            const i = y * g.cols + x;
            g.b[i * 4] = kind === 'mesh' ? quad[(x & 1) + 2 * (y & 1)] : glyph;
            g.b[i * 4 + 1] = 9;
            g.b[i * 4 + 2] = 0;
            g.b[i * 4 + 3] = 1;
          }
        }
      },
    };
    await mountField({ canvas: document.querySelector('canvas.field'), lang: 'es', posters: [{ id: 'seam', el: document.querySelector('main') }], wells: () => [], params: new URLSearchParams('still&poster=seam' + (nogl ? '&nogl' : '')), loadScene: async () => scene });
  }, { kind, nogl });
  await sleep(900);
  const file = `${TMP}/seams-${kind}-${nogl ? '2d' : 'gl'}-${v.w}x${v.h}-dpr${v.dpr}.png`;
  await shotCanvas(s.page, file);
  const st = await s.page.evaluate(() => ({ cols: window.__field.cols, rows: window.__field.rows, cell: window.__field.cell, renderer: window.__field.renderer, iw: innerWidth, dpr: devicePixelRatio }));
  await s.close();
  return { file, st };
}

for (const v of VIEWS) {
  for (const nogl of [true, false]) {
    const tag = `${v.w}×${v.h} @${v.dpr}${v.real ? ' (dpr real)' : ''} ${nogl ? '2D' : 'GL'}`;
    // █: color uniforme en toda la zona del lienzo
    const a = await shot(v, 'full', nogl);
    check(`${tag}: renderizador pedido`, a.st.renderer === (nogl ? '2d' : 'gl'), a.st.renderer);
    const img = await sharp(a.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = img.info.width;
    const H = img.info.height;
    const cssW = a.st.cols * a.st.cell.cssCw;
    const cssH = a.st.rows * a.st.cell.cssCh;
    const k = W / a.st.iw; // px de captura por px CSS
    const x1 = Math.floor(cssW * k) - 2;
    const y1 = Math.min(H, Math.floor(cssH * k)) - 2;
    const at = (x, y, c) => img.data[(y * W + x) * 3 + c];
    const ref = [0, 1, 2].map((c) => at(Math.floor(x1 / 2), Math.floor(y1 / 2), c));
    let worst = 0;
    for (let y = 2; y < y1; y++) for (let x = 2; x < x1; x++) for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(at(x, y, c) - ref[c]));
    check(`${tag}: rejilla de █ = color uniforme (hueco máx ${worst}/255 ≤ 40)`, worst <= 40, `celda ${JSON.stringify(a.st.cell)}`);

    // │ y ─: continuidad de la línea a lo largo de toda la pantalla
    for (const [kind, name] of [['v', '│'], ['h', '─']]) {
      const b = await shot(v, kind, nogl);
      const im = await sharp(b.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const Wb = im.info.width;
      const k2 = Wb / b.st.iw;
      const cw = b.st.cell.cssCw * k2;
      const ch = b.st.cell.cssCh * k2;
      const maxX = Math.floor(b.st.cols * b.st.cell.cssCw * k2) - 2;
      const maxY = Math.floor(b.st.rows * b.st.cell.cssCh * k2) - 2;
      // columna/fila de la línea en la celda 5: el píxel más brillante del tramo de esa celda
      const lum = (x, y) => im.data[(y * Wb + x) * 3 + 2];
      let worstGap = 0;
      if (kind === 'v') {
        const x0 = Math.floor(5 * cw);
        let line = x0;
        for (let x = x0; x < x0 + cw; x++) if (lum(x, 3) > lum(line, 3)) line = x;
        const top = lum(line, 3);
        for (let y = 2; y < maxY; y++) worstGap = Math.max(worstGap, top - lum(line, y));
      } else {
        const y0 = Math.floor(5 * ch);
        let line = y0;
        for (let y = y0; y < y0 + ch; y++) if (lum(3, y) > lum(3, line)) line = y;
        const left = lum(3, line);
        for (let x = 2; x < maxX; x++) worstGap = Math.max(worstGap, left - lum(x, line));
      }
      check(`${tag}: línea ${name} continua entre celdas (hueco máx ${worstGap}/255 ≤ 40)`, worstGap <= 40);
    }

    // malla alterna de cuadrantes: tablero exacto de barras cw × ch (solo con pantalla 1:1, donde un píxel del lienzo es un píxel de captura)
    const m = await shot(v, 'mesh', nogl);
    if (m.st.cell.dpr === m.st.dpr) {
      const im = await sharp(m.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const Wm = im.info.width;
      const { cw, ch } = m.st.cell;
      const hw = (cw + 1) >> 1;
      const hh = (ch + 1) >> 1;
      const px = (x, y) => im.data[(y * Wm + x) * 3 + 2];
      const bright = px(2 * cw + hw + (cw >> 1), 4 * ch + hh + (ch >> 1)); // dentro de una barra
      const dark = px(3 * cw + hw + (cw >> 1), 4 * ch + hh + (ch >> 1)); // en un hueco
      const mid = (bright + dark) / 2;
      // barrido horizontal a ambos lados de la junta de filas 4|5 y vertical por el centro de una barra
      let bad = 0;
      let off = 0;
      for (const yy of [5 * ch - 1, 5 * ch]) {
        for (let x = 0; x < m.st.cols * cw; x++) {
          const want = x >= hw && (x - hw) % (2 * cw) < cw;
          const p = px(x, yy);
          if (p > mid !== want) bad++;
          off = Math.max(off, Math.abs(p - (want ? bright : dark)));
        }
      }
      const xc = 2 * cw + hw + (cw >> 1);
      for (let y = 0; y < m.st.rows * ch; y++) {
        const want = y >= hh && (y - hh) % (2 * ch) < ch;
        const p = px(xc, y);
        if (p > mid !== want) bad++;
        off = Math.max(off, Math.abs(p - (want ? bright : dark)));
      }
      check(`${tag}: malla de cuadrantes = tablero exacto (celda ${cw}×${ch} px, ${bad} píxeles fuera de sitio, desvío máx ${off}/255 ≤ 40)`, bad === 0 && off <= 40);
    }
  }
}
await browser.close();
for (const b of real.values()) await b.close();
finish('costuras (T8, lado del motor)');
