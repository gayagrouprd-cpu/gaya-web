// Las reglas de una escena de DIRECTION §6.3 y §12.7 como funciones: las usan la escena de prueba de WP4, las escenas reales (cover, hola, mist) y las que
// construyan los demás paquetes (plantilla en src/ascii/scenes/_template.ts) desde sus propias pruebas:
//   import { checkSceneRules, toneBudget, effectiveBudget, checkToneBudget } from '../../tests/ascii/fixtures/scene-rules.mjs'
//   · `toneBudget`      presupuesto LITERAL de §5.4: tono del primer plano de cada celda con glifo (la medida de la base de bloques)
//   · `effectiveBudget` presupuesto EFECTIVO: luminancia media de cada celda (fondo y glifo ponderados por la tinta medida) convertida al tono T0–T15 más cercano
//   · `checkToneBudget` ambos contra los topes de §5.4 (con un margen opcional) → lista de incumplimientos
//   · `checkSceneRules` determinismo, pureza del fotograma, `still` ≡ `paint(p = 1, STILL_T)`, tonos y glifos válidos
import { createHash } from 'node:crypto';
import { GLYPH_COUNT, STILL_T, countExplicitBg, hashCells, makeCells, makeFrame, toText, toTones } from '../../../src/ascii/scenes/common.ts';
import { GLYPH_INK } from '../../../src/ascii/scenes/ink.ts';
import { TONE_LUM } from './tones.mjs';

const sha = (g) => createHash('sha256').update(toText(g)).update(toTones(g, 1)).update(toTones(g, 2)).digest('hex');

/** Mide el presupuesto de tono de §5.4 sobre una rejilla: % del área por umbral y celdas no vacías (medida LITERAL: solo el primer plano de las celdas con glifo). */
export function toneBudget(g) {
  const n = g.cols * g.rows;
  const out = { nonEmpty: 0, t9: 0, t11: 0, t13: 0, t14: 0 };
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    out.nonEmpty++;
    const t = g.b[i + 1];
    if (t >= 9) out.t9++;
    if (t >= 11) out.t11++;
    if (t >= 13) out.t13++;
    if (t >= 14) out.t14++;
  }
  for (const k of Object.keys(out)) out[k] = (100 * out[k]) / n;
  return out;
}

/** Tono entero cuya luminancia es la más cercana a `lum`. */
const toneOfLum = (lum) => {
  let best = 0;
  for (let t = 1; t < 16; t++) if (Math.abs(TONE_LUM[t] - lum) < Math.abs(TONE_LUM[best] - lum)) best = t;
  return best;
};

/**
 * Presupuesto de tono EFECTIVO. `toneBudget` mide solo el primer plano de las celdas con glifo: una celda `█` T9 cuenta entera, pero una `.` T9 sobre T5 (3 % de
 * tinta) cuenta igual que ella y un espacio sobre T8 no cuenta. Aquí cada celda se evalúa por su LUMINANCIA MEDIA (fondo y primer plano ponderados por la tinta real
 * del glifo, `GLYPH_INK`) y se convierte al tono cuya luminancia es la más cercana: se compara la luz que ve el ojo. `mean` es la luminancia media de la pantalla
 * (la «luz» con la que se compara contra la base de bloques sólidos, tests/ascii/fixtures/base-solid-light.json). Una celda cuenta si tiene glifo o fondo ≠ T0.
 */
export function effectiveBudget(g) {
  const n = g.cols * g.rows;
  const out = { lit: 0, t9: 0, t11: 0, t13: 0, t14: 0, mean: 0 };
  for (let i = 0; i < g.b.length; i += 4) {
    const gl = g.b[i];
    const bg = g.b[i + 2];
    if (!gl && !bg) continue;
    const ink = GLYPH_INK[gl] ?? 0.15;
    const lum = (1 - ink) * TONE_LUM[bg] + ink * TONE_LUM[g.b[i + 1]];
    out.mean += lum;
    const t = toneOfLum(lum);
    if (t >= 1) out.lit++;
    if (t >= 9) out.t9++;
    if (t >= 11) out.t11++;
    if (t >= 13) out.t13++;
    if (t >= 14) out.t14++;
  }
  for (const k of ['lit', 't9', 't11', 't13', 't14']) out[k] = (100 * out[k]) / n;
  out.mean = out.mean / n;
  return out;
}

/** Topes de §5.4 (en % del área). */
export const TONE_CAPS = { t9: 12, t11: 4, t13: 1.5, t14: 0.5 };
/** Topes de la adopción del estilo Duotono (más estrictos en T≥9, T≥11 y T≥14): los que miden las pruebas de escenas y el barrido. */
export const DUO_CAPS = { t9: 11, t11: 3.5, t13: 1.5, t14: 0.4 };

/**
 * Comprueba el presupuesto de tono literal Y efectivo de `g` contra `caps` (por omisión `DUO_CAPS`, los de la adopción; `TONE_CAPS` son los de §5.4) y `maxNonEmpty` (60 % en la portada, 55 % en el resto).
 * Devuelve la lista de incumplimientos (vacía = dentro de presupuesto).
 */
export function checkToneBudget(g, { caps = DUO_CAPS, maxNonEmpty = 55 } = {}) {
  const bad = [];
  const l = toneBudget(g);
  const e = effectiveBudget(g);
  for (const k of ['t9', 't11', 't13', 't14']) {
    if (l[k] > caps[k]) bad.push(`literal T≥${k.slice(1)} ${l[k].toFixed(2)} % > ${caps[k]} %`);
    if (e[k] > caps[k]) bad.push(`efectivo T≥${k.slice(1)} ${e[k].toFixed(2)} % > ${caps[k]} %`);
  }
  if (l.nonEmpty > maxNonEmpty) bad.push(`no vacías ${l.nonEmpty.toFixed(1)} % > ${maxNonEmpty} %`);
  return bad;
}

/**
 * Comprueba las reglas de escena sobre (scene, spec, words). Devuelve una lista de incumplimientos (vacía = todo bien).
 * Reglas: build puro y repetible · paint determinista · paint escribe TODA la pantalla (no depende de lo que hubiera) ·
 * still ≡ paint(p = 1, t = STILL_T) · tonos 0..15 y glifos de la lista única · sin NaN · `cover` sin bg · cls con la longitud de la rejilla.
 */
export function checkSceneRules(scene, spec, words, { noBg = false, lang = 'es' } = {}) {
  const bad = [];
  const cells = spec.cols * spec.rows;
  const st1 = scene.build(spec, lang, words);
  const st2 = scene.build(spec, lang, words);
  if (!(st1.cls instanceof Uint8Array) || st1.cls.length !== cells) bad.push('SceneState.cls no es un Uint8Array de cols·rows');
  else {
    if (Buffer.compare(Buffer.from(st1.cls), Buffer.from(st2.cls)) !== 0) bad.push('build no es repetible (cls distinto)');
    for (const c of st1.cls) if (c > 3) { bad.push(`cls fuera de 0..3: ${c}`); break; }
  }
  const frames = [];
  for (const p of [0, 0.15, 0.5, 0.85, 1]) for (const t of [0, 3.3, STILL_T]) frames.push(makeFrame(p, t, p * 0.5, false));
  frames.push(makeFrame(1, STILL_T, 0, true));
  const heat = new Float32Array(cells);
  for (let i = 0; i < cells; i++) heat[i] = ((i * 2654435761) >>> 24) / 255;
  const fh = makeFrame(1, STILL_T, 0.3, false);
  fh.heat = heat;
  fh.rings = [{ x: spec.cols / 2, y: spec.rows / 3, age: 0.4 }, { x: 3, y: 3, age: 1.0 }];
  frames.push(fh);
  for (const f of frames) {
    const tag = `p=${f.p} t=${f.t} e=${f.e}${f.heat ? ' +calor' : ''}`;
    const a = makeCells(spec.cols, spec.rows);
    scene.paint(a, st1, f);
    const b = makeCells(spec.cols, spec.rows);
    scene.paint(b, st2, f);
    const dirty = makeCells(spec.cols, spec.rows);
    for (let i = 0; i < dirty.b.length; i++) dirty.b[i] = ((i * 40503) >>> 3) & 255;
    scene.paint(dirty, st1, f);
    if (sha(a) !== sha(b)) bad.push(`${tag}: paint no es determinista entre dos build`);
    if (sha(a) !== sha(dirty)) bad.push(`${tag}: paint depende del contenido previo (no escribe toda la pantalla)`);
    for (let i = 0; i < a.b.length; i += 4) {
      if (a.b[i] >= GLYPH_COUNT) { bad.push(`${tag}: glifo ${a.b[i]} fuera de la lista`); break; }
      if (a.b[i + 1] > 15 || a.b[i + 2] > 15) { bad.push(`${tag}: tono > 15`); break; }
    }
    if (noBg && countExplicitBg(a) > 0) bad.push(`${tag}: usa bg y esta escena tiene póster SSR`);
  }
  const still = makeCells(spec.cols, spec.rows);
  scene.paint(still, st1, makeFrame(1, STILL_T, 0, true));
  const manual = makeCells(spec.cols, spec.rows);
  scene.paint(manual, st1, { p: 1, t: STILL_T, e: 0, heat: null, rings: [], cap: null, still: false });
  if (hashCells(still) !== hashCells(manual)) bad.push('still ≠ paint(p = 1, t = STILL_T)');
  if (!(scene.dawn >= 0 && scene.dawn <= 1)) bad.push('dawn fuera de 0..1');
  if (!(scene.arrival.ms >= 600 && scene.arrival.ms <= 2600)) bad.push(`arrival.ms ${scene.arrival.ms} fuera de 600–2600`);
  return bad;
}
