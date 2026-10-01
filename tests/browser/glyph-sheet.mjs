// Hoja de los 147 glifos del atlas (cada uno en tramos de 8 celdas, para ver las costuras) con el renderizador 2D del motor real.
// Sirve para revisar a la vista que bloques, cuadrantes, sombras, cajas, diagonales y redondeadas encajan. Salida: reports/ascii/wp5/glyph-sheet-*.png
import sharp from 'sharp';
import { OUT, open, ready, shotCanvas, sleep, launchBrowser } from './lib.mjs';
const browser = await launchBrowser();
for (const [w, h, dpr, mobile, tag] of [[1440, 900, 2, false, 'dpr2'], [390, 844, 1.5, true, 'mob15']]) {
  const s = await open({ browser, w, h, dpr, mobile });
  await ready(s.page); await sleep(1200);
  await s.page.evaluate(async () => {
    const { mountField } = await import('/src/ascii/engine.ts');
    const { GLYPH_COUNT, GLYPHS } = await import('/src/ascii/glyphs.ts');
    window.__fieldApi.dispose();
    const scene = { id: 'sheet', dawn: 0, arrival: { ms: 1 }, build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
      paint(g) { g.b.fill(0); for (let i = 0; i < g.u.length; i++) g.u[i] = 0;
        // fila k: el glifo k repetido en tramos de 8 celdas (verifica costuras), tonos 12 sobre fondo 2; 6 glifos por fila
        const perRow = Math.max(1, Math.floor(g.cols / 10));
        for (let k = 1; k < GLYPH_COUNT; k++) {
          const row = 1 + Math.floor((k - 1) / perRow) * 3, col = 1 + ((k - 1) % perRow) * 10;
          for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { const j = ((row + y) * g.cols + col + x) * 4; if (row + y >= g.rows) continue; g.b[j] = k; g.b[j + 1] = 12; g.b[j + 2] = 2; g.b[j + 3] = 3; }
        } } };
    await mountField({ canvas: document.querySelector('canvas.field'), lang: 'es', posters: [{ id: 'sheet', el: document.querySelector('main') }], wells: () => [], params: new URLSearchParams('still&poster=sheet&nogl'), loadScene: async () => scene });
  });
  await sleep(900);
  await shotCanvas(s.page, `${OUT}/glyph-sheet-${tag}.png`);
  await s.close();
}
await browser.close();
