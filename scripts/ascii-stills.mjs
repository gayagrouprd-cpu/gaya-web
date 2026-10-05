#!/usr/bin/env node
// T5 (presupuesto de tono) y T19 (regresión visual) de DIRECTION §13 sobre los fotogramas fijos (`still`: p = 1, t = STILL_T) de cada
// cartel REGISTRADO, en cada idioma, en cinco rejillas de referencia y en cada variante de arte que haya en src/ascii/scenes/variants/*.
// Corre en Node puro (sin navegador): pinta con las escenas reales de src/ascii y mide la rejilla de celdas.
//
//  T5   Área de tinta por tono sobre el área de la pantalla (celdas con glifo, tono de primer plano):
//         T≥9 ≤ 12 %  ·  T≥11 ≤ 4 %  ·  T≥13 ≤ 1,5 %  ·  T≥14 ≤ 0,5 %  ·  no vacías ≤ 60 % (portada; hola 55 %, bruma 35 %)
//       Además se imprime el histograma por tono (T0–T15) y, si se puede cargar, la medida EFECTIVA por luminancia (informativa: ve el
//       fondo `bg` y el peso real del glifo, que la literal ignora; sirve para comparar arte de bloques con arte de caracteres).
//  T19  Hash de toText() + toTones(fg) + toTones(bg) por escena × idioma × rejilla × variante. Debe coincidir con la línea base:
//         · variante «base» (el registro de scenes/index.ts): con tests/ascii/golden.json (claves `scene/<id>/<lang>/<vp>/still`), que ya
//           mantiene el equipo de arte con UPDATE_GOLDEN=1 y el visto bueno del dueño (mismo cálculo que fixtures/scene-hashes.mjs);
//         · el resto (variantes, y cartel nuevo sin golden): scripts/stills.approved.json, que este script escribe SOLO con --update.
//       Un cambio de arte hace fallar la puerta hasta que alguien con el visto bueno corra `--update` (y, para la base, UPDATE_GOLDEN=1).
//  T22  Móvil 360×800: la palabra de la portada en pila mide ≥ 280 px de alto (filas con cara o borde × celda de 12 px).
//
// Uso: node scripts/ascii-stills.mjs [--update] [--variants base,a] [--lang es,en] [--table] [--list]
//   --update  anota en scripts/stills.approved.json los hashes que no cubre el golden (variantes y carteles nuevos). No toca tests/.
//   --table   imprime una fila por still (tono, hash y fuente de la línea base)
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STILL_T, makeCells, makeFrame, specForViewport, toText, toTones } from '../src/ascii/scenes/common.ts';
import { TONE_RGB } from '../src/ascii/tones.gen.ts';
import { ensureWordsFor } from './lib/words-env.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENES_DIR = join(ROOT, 'src/ascii/scenes');
const GOLDEN = join(ROOT, 'tests/ascii/golden.json');
const APPROVED = join(ROOT, 'scripts/stills.approved.json');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const update = !!arg('update', false);
const table = !!arg('table', false);
const wantVariants = arg('variants', null) ? String(arg('variants')).split(',') : null;
const LANGS = String(arg('lang', 'es,en')).split(',');

/** Rejillas de los hashes (las mismas que tests/ascii/fixtures/scene-env.mjs): celda CSS de §5.2 y dpr de la imagen de revisión. */
const VIEWPORTS = {
  d1440: { name: '1440×900', w: 1440, h: 900, cssCw: 9, cssCh: 18, dpr: 2 },
  d1600: { name: '1600×900', w: 1600, h: 900, cssCw: 12, cssCh: 25, dpr: 1 },
  t1024: { name: '1024×768', w: 1024, h: 768, cssCw: 9, cssCh: 18, dpr: 2 },
  m360: { name: '360×800', w: 360, h: 800, cssCw: 6, cssCh: 12, dpr: 2 },
  m320: { name: '320×568', w: 320, h: 568, cssCw: 6, cssCh: 12, dpr: 2 },
};
/** Topes de T5 (§13): % del área de la pantalla. «lit» = celdas no vacías, tope según el cartel. */
const CAPS = { t9: 12, t11: 4, t13: 1.5, t14: 0.5 };
const LIT_CAP = { cover: 60, hola: 55, mist: 35 };
const LIT_DEFAULT = 55;

const SEP = String.fromCharCode(0);
const sha = (...parts) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex').slice(0, 32);
};
/** Mismo cálculo que tests/ascii/fixtures/scene-hashes.mjs › gridSha (por eso coincide con golden.json). */
const gridSha = (g) => sha(toText(g), SEP, toTones(g, 1), SEP, toTones(g, 2));

/** Medida de T5: % del área por umbral de tono del primer plano, histograma por tono y celdas no vacías. */
function inkBudget(g) {
  const n = g.cols * g.rows;
  const hist = new Array(16).fill(0);
  let lit = 0;
  for (let i = 0; i < g.b.length; i += 4) {
    if (!g.b[i]) continue;
    lit++;
    hist[g.b[i + 1]]++;
  }
  const at = (t) => (100 * hist.slice(t).reduce((a, b) => a + b, 0)) / n;
  return { cells: n, lit: (100 * lit) / n, t9: at(9), t11: at(11), t13: at(13), t14: at(14), hist: hist.map((v) => (100 * v) / n) };
}

// ── Medida efectiva (informativa): luminancia media por celda, ponderada por la tinta del glifo ───────────────────────────
const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const TONE_LUM = TONE_RGB.map(([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b));
const toneOfLum = (lum) => {
  let best = 0;
  for (let t = 1; t < 16; t++) if (Math.abs(TONE_LUM[t] - lum) < Math.abs(TONE_LUM[best] - lum)) best = t;
  return best;
};
const QUAD_INK = { '▘': 0.25, '▝': 0.25, '▖': 0.25, '▗': 0.25, '▀': 0.5, '▄': 0.5, '▌': 0.5, '▐': 0.5, '▚': 0.5, '▞': 0.5, '▙': 0.75, '▛': 0.75, '▜': 0.75, '▟': 0.75, '█': 1, '░': 0.25, '▒': 0.5, '▓': 0.75 };
let GLYPHS = null;
async function inkOf() {
  const { GLYPHS: gl } = await import('../src/ascii/glyphs.ts');
  GLYPHS = gl;
  // la tinta medida de la rampa de caracteres (si el arte de caracteres vive aquí); si no se puede cargar, 0,15 para los trazos finos
  let ramp = new Map();
  for (const f of ['scenes/variants/a/ramp.gen.ts', 'scenes/ramp.gen.ts', 'ramp.gen.ts']) {
    const p = join(ROOT, 'src/ascii', f);
    if (!existsSync(p)) continue;
    try {
      const m = await import(pathToFileURL(p).href);
      if (m.INK_PERMILLE) {
        ramp = new Map(m.INK_PERMILLE);
        break;
      }
    } catch {
      /* informativa: sin tinta medida se usa la estimación gruesa */
    }
  }
  return (gl) => {
    if (gl === 0) return 0;
    const c = GLYPHS[gl];
    if (QUAD_INK[c] !== undefined) return QUAD_INK[c];
    const v = ramp.get(c);
    if (v !== undefined) return v / 1000;
    const code = c.charCodeAt(0);
    if (code >= 0x2581 && code <= 0x2587) return (code - 0x2580) / 8;
    if (code >= 0x2589 && code <= 0x258f) return (0x2590 - code) / 8;
    return 0.15;
  };
}
function effective(g, inkOfGlyph) {
  const n = g.cols * g.rows;
  const o = { t9: 0, t11: 0 };
  for (let i = 0; i < g.b.length; i += 4) {
    const gl = g.b[i];
    const bg = g.b[i + 2];
    if (!gl && !bg) continue;
    const ink = inkOfGlyph(gl);
    const t = toneOfLum((1 - ink) * TONE_LUM[bg] + ink * TONE_LUM[g.b[i + 1]]);
    if (t >= 9) o.t9++;
    if (t >= 11) o.t11++;
  }
  return { t9: (100 * o.t9) / n, t11: (100 * o.t11) / n };
}

// ── Descubrimiento de escenas ────────────────────────────────────────────────────────────────────────────────────────────
const isScene = (v) => v && typeof v === 'object' && typeof v.id === 'string' && typeof v.build === 'function' && typeof v.paint === 'function';

/** {nombre de variante → { id → Scene }}. «base» = el registro de scenes/index.ts; el resto, cada carpeta de scenes/variants. */
async function discover() {
  const out = {};
  const errors = [];
  try {
    const reg = await import('../src/ascii/scenes/index.ts');
    const scenes = {};
    for (const id of reg.REGISTERED) scenes[id] = reg.getScene(id) ?? (await reg.loadScene(id));
    out.base = scenes;
  } catch (e) {
    errors.push(`base: no se pudo cargar el registro de escenas: ${e?.message ?? e}`);
  }
  const vdir = join(SCENES_DIR, 'variants');
  if (existsSync(vdir)) {
    for (const name of readdirSync(vdir).sort()) {
      const idx = join(vdir, name, 'index.ts');
      if (!statSync(join(vdir, name)).isDirectory() || !existsSync(idx)) continue;
      try {
        const m = await import(pathToFileURL(idx).href);
        const scenes = {};
        for (const v of Object.values(m)) if (isScene(v)) scenes[v.id] = v;
        for (const [k, load] of Object.entries(m)) {
          if (!/^LOADERS/i.test(k) || !load || typeof load !== 'object') continue;
          for (const [id, fn] of Object.entries(load)) if (!scenes[id] && typeof fn === 'function') scenes[id] = await fn();
        }
        out[name] = scenes;
      } catch (e) {
        errors.push(`${name}: no se pudo cargar variants/${name}/index.ts: ${e?.message ?? e}`);
      }
    }
  }
  return { variants: out, errors };
}

// ── Línea base ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const golden = existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) : {};
let approved = existsSync(APPROVED) ? JSON.parse(readFileSync(APPROVED, 'utf8')) : { _nota: '', hashes: {} };
approved.hashes ??= {};

function baselineFor(variant, id, lang, vp) {
  if (variant === 'base') {
    const k = `scene/${id}/${lang}/${vp}/still`;
    if (golden[k]) return { hash: golden[k], source: 'golden.json', key: k };
  }
  const k = `${variant}/${id}/${lang}/${vp}/still`;
  if (approved.hashes[k]) return { hash: approved.hashes[k], source: 'stills.approved.json', key: k };
  return { hash: null, source: null, key: k };
}

const { variants, errors: loadErrors } = await discover();
const names = Object.keys(variants).filter((v) => !wantVariants || wantVariants.includes(v));
if (arg('list', false)) {
  for (const v of names) console.log(`${v}: ${Object.keys(variants[v]).join(', ')}`);
  process.exit(0);
}
for (const l of LANGS) await ensureWordsFor(l);
const inkOfGlyph = await inkOf();

const failures = [];
const rows = [];
let fresh = 0;
let changed = 0;
let compared = 0;
for (const variant of names) {
  for (const [id, scene] of Object.entries(variants[variant])) {
    for (const lang of LANGS) {
      for (const [vp, view] of Object.entries(VIEWPORTS)) {
        const spec = specForViewport(view.w, view.h, view.cssCw, view.cssCh, view.dpr);
        const words = await ensureWordsFor(lang, id, spec);
        const st = scene.build(spec, lang, words);
        const g = makeCells(spec.cols, spec.rows);
        scene.paint(g, st, makeFrame(1, STILL_T, 0, true));
        const budget = inkBudget(g);
        const eff = effective(g, inkOfGlyph);
        const hash = gridSha(g);
        const tag = `${variant}/${id}/${lang}/${vp}`;
        const litCap = LIT_CAP[id] ?? LIT_DEFAULT;
        const over = [];
        if (budget.t9 > CAPS.t9) over.push(`T≥9 ${budget.t9.toFixed(2)} % > ${CAPS.t9}`);
        if (budget.t11 > CAPS.t11) over.push(`T≥11 ${budget.t11.toFixed(2)} % > ${CAPS.t11}`);
        if (budget.t13 > CAPS.t13) over.push(`T≥13 ${budget.t13.toFixed(2)} % > ${CAPS.t13}`);
        if (budget.t14 > CAPS.t14) over.push(`T≥14 ${budget.t14.toFixed(2)} % > ${CAPS.t14}`);
        if (budget.lit > litCap) over.push(`no vacías ${budget.lit.toFixed(1)} % > ${litCap}`);
        for (const o of over) failures.push(`T5 ${tag}: ${o}`);

        const base = baselineFor(variant, id, lang, vp);
        let state;
        if (!base.hash) {
          state = 'nuevo';
          fresh++;
          if (update) approved.hashes[base.key] = hash;
          else failures.push(`T19 ${tag}: sin línea base (cartel o variante nuevos): revísalo y ejecuta «node scripts/ascii-stills.mjs --update»`);
        } else if (base.hash === hash) {
          state = 'igual';
          compared++;
        } else {
          state = 'CAMBIÓ';
          changed++;
          if (update && base.source === 'stills.approved.json') approved.hashes[base.key] = hash;
          else if (update) failures.push(`T19 ${tag}: la base se aprueba en tests/ascii/golden.json (UPDATE_GOLDEN=1), no aquí`);
          else failures.push(`T19 ${tag}: el fotograma cambió (${base.hash.slice(0, 8)} → ${hash.slice(0, 8)}, línea base ${base.source}); si es un cambio de arte aprobado, actualiza la línea base`);
        }
        rows.push({ tag, variant, id, lang, vp, budget, eff, hash, state, source: base.source, over });

        // T22: la palabra en pila de la portada en el móvil de referencia
        if (id === 'cover' && vp === 'm360' && lang === LANGS[0]) {
          let first = -1;
          let last = -1;
          for (let y = 0; y < spec.rows; y++) {
            for (let x = 0; x < spec.cols; x++) {
              const c = st.cls[y * spec.cols + x];
              if (c === 1 || c === 2) {
                if (first < 0) first = y;
                last = y;
                break;
              }
            }
          }
          const px = first < 0 ? 0 : (last - first + 1) * spec.cssCh;
          rows.at(-1).wordPx = px;
          if (px < 280) failures.push(`T22 ${tag}: la palabra mide ${px} px de alto (< 280)`);
        }
      }
    }
  }
}

if (update) {
  approved._nota =
    'Línea base de los fotogramas fijos que NO cubre tests/ascii/golden.json (variantes de arte y carteles nuevos). La escribe `node scripts/ascii-stills.mjs --update` y es una instantánea, NO la aprobación del dueño: la aprobación en color es T18 (manual).';
  approved.actualizado = new Date().toISOString().slice(0, 10);
  const sorted = Object.fromEntries(Object.entries(approved.hashes).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(APPROVED, JSON.stringify({ _nota: approved._nota, actualizado: approved.actualizado, hashes: sorted }, null, 2) + '\n');
}

// ── Informe ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const f = (v, d = 1) => v.toFixed(d);
for (const e of loadErrors) failures.push(e);
console.log(`still de ${rows.length} combinaciones (variante × escena × idioma × rejilla): variantes ${names.join(', ') || 'ninguna'}`);
for (const v of names) console.log(`  ${v}: ${Object.keys(variants[v]).join(', ')}`);
if (table) {
  console.log('\nescena · rejilla                    T≥9   T≥11  T≥13  T≥14  no vacías | efectivo T≥9 · T≥11 | hash      línea base');
  for (const r of rows) {
    console.log(
      `${r.tag.padEnd(28)} ${f(r.budget.t9).padStart(5)} ${f(r.budget.t11, 2).padStart(5)} ${f(r.budget.t13, 2).padStart(5)} ${f(r.budget.t14, 2).padStart(5)} ${f(r.budget.lit, 0).padStart(6)} %  | ${f(r.eff.t9).padStart(5)} ${f(r.eff.t11, 2).padStart(5)}   | ${r.hash.slice(0, 8)} ${r.state}${r.source ? ' (' + r.source + ')' : ''}${r.over.length ? ' ← ' + r.over.join('; ') : ''}`,
    );
  }
}
const worst = (k) => rows.reduce((m, r) => (r.budget[k] > m.v ? { v: r.budget[k], tag: r.tag } : m), { v: 0, tag: '' });
console.log('\npeor caso de T5 (tope):');
for (const [k, label, cap] of [['t9', 'T≥9', CAPS.t9], ['t11', 'T≥11', CAPS.t11], ['t13', 'T≥13', CAPS.t13], ['t14', 'T≥14', CAPS.t14]]) {
  const w = worst(k);
  console.log(`  ${label.padEnd(5)} ${f(w.v, 2).padStart(6)} % (≤ ${cap})  en ${w.tag}`);
}
const w60 = rows.reduce((m, r) => (r.budget.lit > m.v ? { v: r.budget.lit, tag: r.tag } : m), { v: 0, tag: '' });
console.log(`  no vacías ${f(w60.v, 1)} % en ${w60.tag}`);
const word = rows.find((r) => r.wordPx !== undefined);
if (word) console.log(`T22: la palabra de la portada en 360×800 mide ${word.wordPx} px de alto (≥ 280)`);
console.log(`T19: ${compared} iguales a su línea base · ${changed} cambiados · ${fresh} nuevos${update ? ' (anotados con --update)' : ''}`);
const unapprovedOwner = Object.values(golden).length && '_scenes' in golden;
if (unapprovedOwner) console.log('nota: los hashes de la base siguen «pendientes de aprobación del dueño» (golden.json › _scenes, T18 manual)');
if (failures.length) {
  console.log(`\n${failures.length} fallos:`);
  for (const x of failures.slice(0, 60)) console.log(`  FALLA ${x}`);
  if (failures.length > 60) console.log(`  … y ${failures.length - 60} más`);
  process.exit(1);
}
console.log('\nT5, T19 y T22 en verde.');
