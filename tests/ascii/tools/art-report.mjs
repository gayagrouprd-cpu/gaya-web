// Informe numérico de las correcciones de arte (WP6c) de cover, hola y mist en los 7 visores de referencia × 2 idiomas: luz frente a la base de bloques sólidos,
// presupuesto de tono literal y efectivo, y las medidas de arte (cara con glifo, carreras planas, densidad por distancia, mitad inferior).
//   node tests/ascii/tools/art-report.mjs [--scene cover,hola,mist] [--vp d1440,m360] [--lang es,en] [--all]
import { readFileSync } from 'node:fs';
import { VIEWPORTS, ensureWords, specOf, wordsFor } from '../fixtures/scene-env.mjs';
import { checkToneBudget, effectiveBudget, toneBudget } from '../fixtures/scene-rules.mjs';
import { artMetrics } from '../fixtures/art-metrics.mjs';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { loadScene } from '../../../src/ascii/scenes/index.ts';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const BASE = JSON.parse(readFileSync(new URL('../fixtures/base-solid-light.json', import.meta.url), 'utf8'));
const SCENES = arg('scene', 'cover,hola,mist').split(',');
const VPS = arg('vp', Object.keys(VIEWPORTS).join(',')).split(',');
const LANGS = arg('lang', 'es,en').split(',');
const pct = (v, d = 1) => v.toFixed(d).padStart(5);
let bad = 0;
for (const id of SCENES) {
  const sc = await loadScene(id);
  console.log(`\n── ${id} ──   luz/base · literal T≥9 T≥11 T≥13 T≥14 · efectivo T≥9 T≥11 T≥13 T≥14 · vacías | cara% · planas · r1 · r8 · fuera · mitad inf.`);
  for (const lang of LANGS) {
    await ensureWords(lang);
    for (const vp of VPS) {
      const spec = specOf(VIEWPORTS[vp]);
      const st = sc.build(spec, lang, wordsFor(id, lang, spec));
      const g = makeCells(spec.cols, spec.rows);
      sc.paint(g, st, makeFrame(1, STILL_T, 0, true));
      const l = toneBudget(g);
      const e = effectiveBudget(g);
      const base = BASE[`${id}/${lang}/${vp}`];
      const ratio = base ? e.mean / base.mean : NaN; // la base de bloques solo existe para cover, hola y mist
      const issues = checkToneBudget(g, { caps: { t9: 11, t11: 3.5, t13: 1.5, t14: 0.4 }, maxNonEmpty: id === 'cover' ? 60 : 55 });
      if (base && ratio < 0.95 && id !== 'mist') issues.push(`luz ${(100 * ratio).toFixed(1)} % de la base`);
      let m = '';
      if (id !== 'mist') {
        const a = artMetrics(g, st);
        m = ` | ${(100 * a.faceGlyphRatio).toFixed(0).padStart(3)} ${String(a.flatRuns).padStart(3)} ${(100 * a.d1).toFixed(0).padStart(3)} ${(100 * a.d8).toFixed(0).padStart(3)} ${(100 * a.outsideHalo).toFixed(0).padStart(3)} ${(100 * a.lowerHalf).toFixed(1).padStart(4)}`;
      } else {
        let n = 0;
        for (let i = 0; i < g.b.length; i += 4) if (g.b[i]) n++;
        m = ` | glifos ${(100 * n / (spec.cols * spec.rows)).toFixed(1)} %`;
      }
      if (issues.length) bad++;
      console.log(`${lang} ${vp.padEnd(6)} ${String(spec.cols).padStart(3)}×${String(spec.rows).padEnd(3)} ${Number.isNaN(ratio) ? '   n/a' : (100 * ratio).toFixed(1).padStart(6)} % |${pct(l.t9)}${pct(l.t11, 2)}${pct(l.t13, 2)}${pct(l.t14, 2)} |${pct(e.t9)}${pct(e.t11, 2)}${pct(e.t13, 2)}${pct(e.t14, 2)} |${pct(l.nonEmpty)}${m}${issues.length ? '   ⚠ ' + issues.join('; ') : ''}`);
    }
  }
}
console.log(bad ? `\n${bad} fila(s) con avisos` : '\ntodo dentro de los topes');
