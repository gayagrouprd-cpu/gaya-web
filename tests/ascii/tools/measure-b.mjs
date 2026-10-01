// Variante B · medidas de una pasada: presupuesto de tono (§5.4) del `still` de cover y hola en 7 visores × 2 idiomas (B frente a la base sólida),
// celdas con bg, mezcla de glifos (puntuación / letras / bloques) y tope de tono bajo los pozos del texto (§5.8, mismo criterio de WP6: después de
// `applyCap` nada pasa de T6 bajo `ink` ni de T4 bajo `muted`; aquí además cuánto arte habría tenido que recortar el motor).
//   node tests/ascii/tools/measure-b.mjs [--json out.json]
import { writeFileSync } from 'node:fs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { toneBudget } from '../fixtures/scene-rules.mjs';
import { GLYPHS, STILL_T, countExplicitBg, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover as coverBase } from '../../../src/ascii/scenes/cover.ts';
import { hola as holaBase } from '../../../src/ascii/scenes/hola.ts';
import { coverB } from '../../../src/ascii/scenes/variants/b/cover.ts';
import { holaB } from '../../../src/ascii/scenes/variants/b/hola.ts';
import { applyCap, buildCap, makeCap } from '../../../src/ascii/wells.ts';

const VPS = ['d1440', 'd1600', 'd1920', 't1024', 'm360', 'm390', 'm320'];
const json = process.argv.indexOf('--json');
const out = { budget: [], wells: [] };

/** Pozos de la portada (DIRECTION §4.4): h1 `ink`, lead `muted`, botones `ink`; en móvil, la columna de texto bajo la pila. */
function wellRects(spec) {
  const mobile = spec.cols < 90;
  if (mobile) {
    const y0 = Math.min(spec.rows - 14, 37);
    return [
      { x: 3, y: y0, w: spec.cols - 6, h: 10, kind: 'ink' },
      { x: 3, y: y0 + 10, w: spec.cols - 12, h: 6, kind: 'muted' },
    ].filter((r) => r.y + r.h <= spec.rows + 4);
  }
  const y0 = Math.min(26, spec.rows - 22);
  return [
    { x: 8, y: y0, w: Math.min(92, spec.cols - 12), h: 11, kind: 'ink' },
    { x: 8, y: y0 + 11, w: Math.min(70, spec.cols - 12), h: 4, kind: 'muted' },
    { x: 8, y: y0 + 16, w: Math.min(50, spec.cols - 12), h: 4, kind: 'ink' },
  ];
}

const SC = [
  ['cover', 'base', coverBase],
  ['cover', 'B', coverB],
  ['hola', 'base', holaBase],
  ['hola', 'B', holaB],
];
const kindsOf = (g) => {
  let punct = 0;
  let letters = 0;
  let blocks = 0;
  let n = 0;
  for (let i = 0; i < g.b.length; i += 4) {
    const gl = g.b[i];
    if (!gl) continue;
    n++;
    const c = GLYPHS[gl];
    if (gl >= 97) blocks++;
    else if (/[A-Za-z0]/.test(c)) letters++;
    else punct++;
  }
  return { punct: (100 * punct) / n, letters: (100 * letters) / n, blocks: (100 * blocks) / n };
};

for (const lang of ['es', 'en']) {
  await ensureWords(lang);
  for (const vpn of VPS) {
    const spec = specOf(VIEWPORTS[vpn]);
    for (const [id, who, sc] of SC) {
      const st = sc.build(spec, lang, wordsFor(id, lang, spec));
      const g = makeCells(spec.cols, spec.rows);
      sc.paint(g, st, makeFrame(1, STILL_T, 0, true));
      const b = toneBudget(g);
      const k = kindsOf(g);
      const bgCells = (100 * countExplicitBg(g)) / (spec.cols * spec.rows);
      out.budget.push({ id, who, lang, vp: vpn, cols: spec.cols, rows: spec.rows, ...b, bgCells, ...k });
      // pozos: pintar con el tope puesto (la bruma lo respeta), contar lo que el motor aún tendría que recortar, aplicar y verificar
      const cap = makeCap(spec.cols, spec.rows);
      buildCap(cap, spec.cols, spec.rows, wellRects(spec), { v: 0, dt: 1 / 30, ch: spec.cssCh, energy: 0 });
      const f = makeFrame(1, STILL_T, 0, true);
      f.cap = cap;
      const g2 = makeCells(spec.cols, spec.rows);
      sc.paint(g2, st, f);
      let over = 0;
      let overBg = 0;
      let maxOver = 0;
      let inWell = 0;
      for (let i = 0, j = 0; i < g2.b.length; i += 4, j++) {
        if (cap[j] >= 15) continue;
        inWell++;
        if (g2.b[i + 1] > cap[j] && g2.b[i]) {
          over++;
          maxOver = Math.max(maxOver, g2.b[i + 1] - cap[j]);
        }
        if (g2.b[i + 2] > cap[j]) overBg++;
      }
      applyCap(g2, cap);
      let bad = 0;
      for (let i = 0, j = 0; i < g2.b.length; i += 4, j++) if (g2.b[i + 1] > cap[j] || g2.b[i + 2] > cap[j]) bad++;
      out.wells.push({ id, who, lang, vp: vpn, inWell, over, overBg, maxOver, bad });
    }
  }
}

const f = (x, d = 1) => x.toFixed(d).padStart(5);
console.log('presupuesto del still (T≥9 · T≥11 · T≥13 · T≥14 · no vacías %) y mezcla de glifos (punt · letras · bloques %) · bg % de la pantalla');
for (const r of out.budget.filter((r) => r.lang === 'es' || r.who === 'B')) {
  console.log(`${r.id.padEnd(5)} ${r.who.padEnd(4)} ${r.lang} ${r.vp.padEnd(5)} ${String(r.cols).padStart(3)}×${String(r.rows).padEnd(3)} ${f(r.t9)} ${f(r.t11)} ${f(r.t13, 2)} ${f(r.t14, 2)} ${f(r.nonEmpty, 0)} | ${f(r.punct, 0)} ${f(r.letters, 0)} ${f(r.blocks, 0)} | bg ${f(r.bgCells, 0)}`);
}
console.log('\npozos (tope ink T6 / muted T4): celdas bajo pozo · arte por encima del tope ANTES de applyCap (con la bruma ya topada) · máximo exceso · fondo por encima · incumplimientos DESPUÉS');
for (const r of out.wells.filter((r) => r.lang === 'es')) console.log(`${r.id.padEnd(5)} ${r.who.padEnd(4)} ${r.vp.padEnd(5)} en pozo ${String(r.inWell).padStart(4)}  recorte fg ${String(r.over).padStart(3)} (máx +${r.maxOver})  bg ${String(r.overBg).padStart(3)}  tras applyCap ${r.bad}`);
if (json > -1) writeFileSync(process.argv[json + 1], JSON.stringify(out, null, 1));
