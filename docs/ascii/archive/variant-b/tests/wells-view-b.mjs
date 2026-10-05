// Variante B · vista de los pozos: pinta cover o hola de B (y la base) con el tope de tono del texto puesto (applyCap) y dibuja encima los rectángulos del h1 / lead / botones
// como cajas vacías, para MIRAR cómo queda el arte bajo el texto y que el contraste nace del tope y no de la inspección. Uso:
//   node tests/ascii/tools/wells-view-b.mjs [--vp d1440,m360] [--lang es] [--out reports/ascii/art-b]
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPainter } from './paint.mjs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover as coverBase } from '../../../src/ascii/scenes/cover.ts';
import { coverB } from '../../../src/ascii/scenes/variants/b/cover.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const OUT = resolve(arg('out', 'reports/ascii/art-b'));
mkdirSync(OUT, { recursive: true });
const painter = await createPainter();
for (const lang of arg('lang', 'es').split(',')) {
  await ensureWords(lang);
  for (const vpn of arg('vp', 'd1440,m360').split(',')) {
    const vp = VIEWPORTS[vpn];
    const spec = specOf(vp);
    const mobile = spec.cols < 90;
    const rects = mobile
      ? [{ x: 3, y: 37, w: spec.cols - 6, h: 10, kind: 'ink' }, { x: 3, y: 47, w: spec.cols - 12, h: 6, kind: 'muted' }, { x: 3, y: 55, w: spec.cols - 6, h: 4, kind: 'ink' }]
      : [{ x: 8, y: 26, w: 92, h: 11, kind: 'ink' }, { x: 8, y: 37, w: 70, h: 4, kind: 'muted' }, { x: 8, y: 42, w: 50, h: 4, kind: 'ink' }];
    const grids = [];
    for (const sc of [coverBase, coverB]) {
      const cap = makeCap(spec.cols, spec.rows);
      buildCap(cap, spec.cols, spec.rows, rects, { v: 0, dt: 1 / 30, ch: spec.cssCh, energy: 0 });
      const f = makeFrame(1, STILL_T, 0, true);
      f.cap = cap;
      const st = sc.build(spec, lang, wordsFor('cover', lang, spec));
      const g = makeCells(spec.cols, spec.rows);
      sc.paint(g, st, f);
      applyCap(g, cap);
      // el texto: una caja de línea fina (─│┌┐└┘, T13) alrededor de cada pozo, solo para verlo
      for (const r of rects) {
        for (let x = r.x; x < r.x + r.w; x++) for (const y of [r.y, r.y + r.h - 1]) if (y < spec.rows && x < spec.cols) { g.b[(y * spec.cols + x) * 4] = 127; g.b[(y * spec.cols + x) * 4 + 1] = 13; }
      }
      grids.push(g);
    }
    const file = resolve(OUT, `wells-${lang}-${vpn}.png`);
    await painter.save(file, grids, { cssCw: vp.cssCw, cssCh: vp.cssCh, dpr: 1, gap: 10 });
    console.log(file);
  }
}
await painter.close();
