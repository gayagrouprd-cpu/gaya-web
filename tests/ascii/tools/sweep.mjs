// Barrido de visores: renderiza el `still` de CADA escena registrada (src/ascii/scenes/index.ts) en ≥ 500 combinaciones de visor × idioma (≈ 290 visores × 2 idiomas por
// escena, con la rejilla que calcularía el motor: celda de §5.2 por ancho, presupuesto de celdas y dpr del tier) y mide el presupuesto de tono LITERAL y EFECTIVO de §5.4
// y las celdas no vacías; FALLA (exit 1) si algún fotograma pasa de los topes. Lo conecta `npm run check:ascii` (WP11).
//
//   node tests/ascii/tools/sweep.mjs                     todas las escenas registradas
//   node tests/ascii/tools/sweep.mjs --scene cover,hola  solo esas
//   node tests/ascii/tools/sweep.mjs --caps spec         topes de §5.4 (12 · 4 · 1,5 · 0,5) en vez de los de la adopción (11 · 3,5 · 1,5 · 0,4)
//   node tests/ascii/tools/sweep.mjs --quick             uno de cada cuatro visores (para iterar)
//   node tests/ascii/tools/sweep.mjs --json out.json     además guarda todas las medidas
//   import { sweep } from './sweep.mjs'                  `await sweep({ scenes, caps, quick })` → { rows, failures }; `scenes` = ids registrados u objetos `Scene` (una escena nueva aún sin registrar)
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadWords, getWords, sceneWord } from '../../../src/ascii/words.ts';
import { STILL_T, makeCells, makeFrame } from '../../../src/ascii/scenes/common.ts';
import { REGISTERED, loadScene } from '../../../src/ascii/scenes/index.ts';
import { DUO_CAPS, TONE_CAPS, effectiveBudget, toneBudget } from '../fixtures/scene-rules.mjs';

/** Topes del presupuesto de tono (% del área): los de §5.4 y los más estrictos de la adopción del estilo Duotono (los que miden las pruebas de escenas). */
export const CAPS = { spec: TONE_CAPS, strict: DUO_CAPS };
/** Celdas no vacías máximas: la portada 60 %, el resto 55 %, la bruma 30 %. */
export const MAX_NONEMPTY = { cover: 60, mist: 30 };
const TIERS = { high: { cells: 9000, dpr: 2 }, mid: { cells: 6500, dpr: 2 }, low: { cells: 4800, dpr: 1.5 }, min: { cells: 2400, dpr: 1 } };
export const WIDTHS = [320, 360, 375, 390, 412, 430, 480, 540, 600, 700, 768, 820, 900, 1024, 1100, 1180, 1280, 1366, 1440, 1536, 1600, 1680, 1800, 1920, 2200, 2560];
export const HEIGHTS = [568, 640, 667, 720, 780, 800, 844, 900, 932, 1024, 1080, 1200];

/** La cuenta de `layout()` de engine.ts: celda del CSS (6×12 · 9×18 desde 900 px · 12×25 desde 1600 px), dpr del tier y celda agrandada de 1 px en 1 px hasta que quepa en el presupuesto. */
export function sweepSpec(w, h, tier, dprDevice = 2) {
  let nw = w >= 1600 ? 12 : w >= 900 ? 9 : 6;
  let nh = w >= 1600 ? 25 : w >= 900 ? 18 : 12;
  const T = TIERS[tier];
  const dpr = Math.min(dprDevice, T.dpr);
  let cw, ch, cols, rows;
  for (;;) {
    cw = Math.round(nw * dpr);
    ch = Math.round(nh * dpr);
    cols = Math.floor((w * dpr) / cw + 1e-6);
    rows = Math.floor((h * dpr) / ch + 1e-6);
    if (cols * rows <= T.cells || nw >= 40) break;
    nw++;
    nh = 2 * nw;
  }
  return { cols, rows, cw, ch, cssCw: cw / dpr, cssCh: ch / dpr, dpr };
}

const MIN_COLS = 52; // con menos, el motor oculta el lienzo (engine.ts)

/** Los visores del barrido: ancho × alto con el tier que elegiría el motor (puntero grueso → low; escritorio → high y mid). */
export function sweepViewports(quick = false) {
  const out = [];
  let n = 0;
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      if (h > w * 3 || (w > 900 && h < 640)) continue; // proporciones que no existen
      if (quick && n++ % 4 !== 0) continue;
      const tier = w < 900 ? 'low' : (w + h) % 2 ? 'mid' : 'high';
      const spec = sweepSpec(w, h, tier, w < 900 ? 3 : 2);
      if (spec.cols >= MIN_COLS && spec.rows >= 8) out.push({ w, h, tier, spec });
    }
  }
  return out;
}

export async function sweep({ scenes = REGISTERED, caps = 'strict', quick = false, log = () => {} } = {}) {
  const C = typeof caps === 'string' ? CAPS[caps] : caps;
  await loadWords('es');
  await loadWords('en');
  const vps = sweepViewports(quick);
  const rows = [];
  const failures = [];
  const worst = {};
  for (const sc of scenes) {
    const scene = typeof sc === 'string' ? await loadScene(sc) : sc;
    const id = scene.id;
    const wid = (lang) => sceneWord(scene.id, lang);
    const cap = MAX_NONEMPTY[id] ?? 55;
    worst[id] = { combos: 0, literal: { t9: 0, t11: 0, t13: 0, t14: 0, nonEmpty: 0 }, effective: { t9: 0, t11: 0, t13: 0, t14: 0 }, at: {} };
    for (const lang of ['es', 'en']) {
      for (const vp of vps) {
        const { spec } = vp;
        const tag = `${id} ${lang} ${vp.w}×${vp.h} ${vp.tier} (${spec.cols}×${spec.rows})`;
        let l;
        let e;
        try {
          const w = wid(lang);
          const words = w ? [getWords(w, lang, spec.cols, Math.max(12, Math.floor(spec.rows * 0.6)))] : [];
          const st = scene.build(spec, lang, words);
          const g = makeCells(spec.cols, spec.rows);
          scene.paint(g, st, makeFrame(1, STILL_T, 0, true));
          l = toneBudget(g);
          e = effectiveBudget(g);
        } catch (err) {
          failures.push(`${tag}: ${err?.message ?? err}`);
          continue;
        }
        worst[id].combos++;
        const row = { scene: id, lang, w: vp.w, h: vp.h, tier: vp.tier, cols: spec.cols, rows: spec.rows, literal: l, effective: e };
        rows.push(row);
        for (const k of ['t9', 't11', 't13', 't14']) {
          if (l[k] > worst[id].literal[k]) ((worst[id].literal[k] = l[k]), (worst[id].at[`l${k}`] = tag));
          if (e[k] > worst[id].effective[k]) ((worst[id].effective[k] = e[k]), (worst[id].at[`e${k}`] = tag));
          if (l[k] > C[k]) failures.push(`${tag}: literal T≥${k.slice(1)} ${l[k].toFixed(2)} % > ${C[k]} %`);
          if (e[k] > C[k]) failures.push(`${tag}: efectivo T≥${k.slice(1)} ${e[k].toFixed(2)} % > ${C[k]} %`);
        }
        if (l.nonEmpty > worst[id].literal.nonEmpty) ((worst[id].literal.nonEmpty = l.nonEmpty), (worst[id].at.nonEmpty = tag));
        if (l.nonEmpty > cap) failures.push(`${tag}: no vacías ${l.nonEmpty.toFixed(1)} % > ${cap} %`);
      }
    }
    log(id, worst[id]);
  }
  return { rows, failures, worst, caps: C, viewports: vps.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const arg = (n, d) => {
    const i = args.indexOf(`--${n}`);
    return i < 0 || args[i + 1]?.startsWith('--') ? d : args[i + 1];
  };
  const scenes = arg('scene', null)?.split(',') ?? REGISTERED;
  const quick = args.includes('--quick');
  const t0 = Date.now();
  const r = await sweep({ scenes, caps: arg('caps', 'strict'), quick });
  const pct = (v, d = 2) => v.toFixed(d).padStart(5);
  console.log(`barrido: ${r.viewports} visores × 2 idiomas × ${scenes.length} escenas = ${r.rows.length} fotogramas en ${((Date.now() - t0) / 1000).toFixed(1)} s · topes T≥9 ${r.caps.t9} · T≥11 ${r.caps.t11} · T≥13 ${r.caps.t13} · T≥14 ${r.caps.t14} %`);
  console.log('peor caso por escena (literal | efectivo): T≥9  T≥11  T≥13  T≥14 · no vacías');
  for (const [id, w] of Object.entries(r.worst)) {
    console.log(`  ${id.padEnd(6)} ${String(w.combos).padStart(4)} fotogramas  literal ${pct(w.literal.t9, 1)} ${pct(w.literal.t11)} ${pct(w.literal.t13)} ${pct(w.literal.t14)} · efectivo ${pct(w.effective.t9, 1)} ${pct(w.effective.t11)} ${pct(w.effective.t13)} ${pct(w.effective.t14)} · no vacías ${pct(w.literal.nonEmpty, 1)} %`);
  }
  const jf = arg('json', null);
  if (jf) writeFileSync(jf, JSON.stringify({ caps: r.caps, worst: r.worst, rows: r.rows }));
  if (r.failures.length) {
    console.error(`\n${r.failures.length} incumplimiento(s):`);
    for (const f of r.failures.slice(0, 40)) console.error('  ' + f);
    if (r.failures.length > 40) console.error(`  … y ${r.failures.length - 40} más`);
    process.exit(1);
  }
  console.log('\nbarrido verde: presupuesto de tono dentro de los topes en todos los visores');
}
