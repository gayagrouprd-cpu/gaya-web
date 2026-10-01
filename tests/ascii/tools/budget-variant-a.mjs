// Tabla del presupuesto de tono (§5.4) de la Variante A frente a la base sólida, en 7 visores × 2 idiomas: medida LITERAL (tono del primer plano de las
// celdas con glifo, la de toneBudget) y EFECTIVA (luminancia media por celda). node tests/ascii/tools/budget-variant-a.mjs [--md]
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { toneBudget } from '../fixtures/scene-rules.mjs';
import { effectiveBudget } from '../fixtures/scene-rules-duo.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { cover } from '../../../src/ascii/scenes/cover.ts';
import { hola } from '../../../src/ascii/scenes/hola.ts';
import { coverA } from '../../../src/ascii/scenes/variants/a/cover.ts';
import { holaA } from '../../../src/ascii/scenes/variants/a/hola.ts';

const md = process.argv.includes('--md');
await ensureWords('es');
await ensureWords('en');
const paint = (sc, vp, lang) => {
  const spec = specOf(VIEWPORTS[vp]);
  const st = sc.build(spec, lang, wordsFor(sc.id, lang, spec));
  const g = makeCells(spec.cols, spec.rows);
  sc.paint(g, st, makeFrame(1, STILL_T, 0, true));
  return { g, spec };
};
const f = (v, d = 1) => v.toFixed(d);
if (md) console.log('| escena | idioma | visor | rejilla | base T≥9 · 11 · 13 · 14 · no vacías | A T≥9 · 11 · 13 · 14 · no vacías | A efectivo T≥9 · 11 | luz media A / base |\n|---|---|---|---|---|---|---|---|');
for (const [id, base, a] of [['cover', cover, coverA], ['hola', hola, holaA]]) {
  for (const lang of ['es', 'en']) {
    for (const vp of ['d1440', 'd1600', 'd1920', 't1024', 'm360', 'm390', 'm320']) {
      const B = paint(base, vp, lang);
      const A = paint(a, vp, lang);
      const bb = toneBudget(B.g);
      const ab = toneBudget(A.g);
      const ae = effectiveBudget(A.g);
      const be = effectiveBudget(B.g);
      const cell = `${A.spec.cols}×${A.spec.rows}`;
      const lb = `${f(bb.t9)} · ${f(bb.t11, 2)} · ${f(bb.t13, 2)} · ${f(bb.t14, 2)} · ${f(bb.nonEmpty, 0)}`;
      const la = `${f(ab.t9)} · ${f(ab.t11, 2)} · ${f(ab.t13, 2)} · ${f(ab.t14, 2)} · ${f(ab.nonEmpty, 0)}`;
      if (md) console.log(`| ${id} | ${lang} | ${VIEWPORTS[vp].name} | ${cell} | ${lb} | ${la} | ${f(ae.t9)} · ${f(ae.t11, 2)} | ${f(ae.mean * 1000, 1)} / ${f(be.mean * 1000, 1)} |`);
      else console.log(`${id} ${lang} ${vp.padEnd(5)} ${cell.padEnd(7)} base ${lb.padEnd(30)} A ${la.padEnd(30)} efectivo ${f(ae.t9)}·${f(ae.t11, 2)}  luz ${f(ae.mean * 1000, 1)}/${f(be.mean * 1000, 1)}`);
    }
  }
}
