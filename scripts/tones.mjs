#!/usr/bin/env node
// Paleta del arte: 16 tonos T0–T15 derivados de --glow-0..3 (DIRECTION §5.4).
//   T0 = --glow-0 · T5 = --glow-1 · T10 = --glow-2 · T15 = --glow-3; el resto, interpolación lineal en OKLCH
//   (el recorte de croma al salir de sRGB es el de src/lib/color.mjs, el mismo que usa `npm run contrast`).
// Una sola fuente: tokens.css. De aquí salen dos archivos que nadie edita a mano:
//   src/styles/tones.css     --t0 … --t15 para el DOM (hex; el oklch de origen va en un comentario)
//   src/ascii/tones.gen.ts   TONE_HEX / TONE_RGB para el motor (lienzo)
// Uso: node scripts/tones.mjs            regenera los dos archivos
//      node scripts/tones.mjs --check    solo comprueba que están al día (sale con 1 si no; lo usa `npm run contrast`)
//      node scripts/tones.mjs --spec     compara los hex con la tabla de DIRECTION §5.4
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex, oklchToRgb255, parseOklch } from '../src/lib/color.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FILES = {
  tokens: join(ROOT, 'src/styles/tokens.css'),
  css: join(ROOT, 'src/styles/tones.css'),
  ts: join(ROOT, 'src/ascii/tones.gen.ts'),
};
export const TONE_COUNT = 16;

/** Claves de la escala: tono → variable --glow-N de tokens.css. */
const KEY_TONES = [0, 5, 10, 15];

function readGlow(tokensCss, n) {
  const m = new RegExp(`--glow-${n}:\\s*(oklch\\([^)]*\\))`).exec(tokensCss);
  if (!m) throw new Error(`No encuentro --glow-${n} (oklch) en tokens.css`);
  return parseOklch(m[1]);
}

/** Interpolación de matiz por el arco corto (con los matices actuales coincide con la lineal). */
function lerpHue(a, b, f) {
  let d = b - a;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  return (((a + d * f) % 360) + 360) % 360;
}

/** @param {string} tokensCss contenido de tokens.css */
export function computeTones(tokensCss) {
  const K = KEY_TONES.map((_, n) => readGlow(tokensCss, n));
  const oklch = [];
  for (let i = 0; i < TONE_COUNT; i++) {
    const k = Math.min(K.length - 2, Math.floor(i / 5));
    const f = (i - k * 5) / 5;
    const a = K[k];
    const b = K[k + 1];
    const L = a.L + (b.L - a.L) * f;
    const C = a.C + (b.C - a.C) * f;
    const h = lerpHue(a.h, b.h, f);
    oklch.push(`oklch(${L.toFixed(4)} ${C.toFixed(4)} ${h.toFixed(3)})`);
  }
  return { oklch, hex: oklch.map(oklchToHex), rgb: oklch.map(oklchToRgb255) };
}

// El CSS lleva el HEX, no oklch(): los tonos T10–T15 quedan fuera de sRGB y cada navegador los recorta a su manera
// (Chrome recorta canales; color.mjs reduce el croma), de modo que con oklch() el DOM y el lienzo no pintarían lo mismo.
export function renderCss({ oklch, hex }) {
  const lines = oklch.map((c, i) => `  --t${i}: ${hex[i]}; /* ${c} */`);
  return [
    '/* GENERADO por scripts/tones.mjs (npm run tones) desde --glow-0..3 de tokens.css. No editar a mano.',
    '   Hex calculado con el recorte de croma de src/lib/color.mjs: es el mismo valor que usa el lienzo (tones.gen.ts).',
    '   T0 fondo · T1 placa · T2 vidrio vacío · T3 sombra · T4 bruma · T5 agua profunda · T6 tope bajo texto',
    '   T7 marco de placa · T8 cara · T9 cara brillante · T10 agua viva · T11 aro · T12 borde interior',
    '   T13 luz de borde · T14 espuma y menisco · T15 chispa */',
    ':root {',
    ...lines,
    '}',
    '',
  ].join('\n');
}

export function renderTs({ hex, rgb }) {
  return [
    '// GENERADO por scripts/tones.mjs (npm run tones) desde --glow-0..3 de tokens.css. No editar a mano.',
    '// T0 (fondo) … T15 (chispa). Los mismos valores que --t0 … --t15 de src/styles/tones.css.',
    'export const TONE_HEX = [',
    ...hex.map((h, i) => `  '${h}', // T${i}`),
    '] as const;',
    '',
    '/** Canales 0–255 de cada tono, redondeados igual que TONE_HEX. */',
    'export const TONE_RGB = [',
    ...rgb.map((c, i) => `  [${c.join(', ')}], // T${i}`),
    '] as const;',
    '',
  ].join('\n');
}

const norm = (s) => s.replace(/\r\n/g, '\n');

/** Compara lo escrito en disco con lo que saldría hoy de tokens.css. Devuelve la lista de problemas. */
export function checkTones() {
  const problems = [];
  const fresh = computeTones(readFileSync(FILES.tokens, 'utf8'));
  for (const [kind, file, render] of [
    ['tones.css', FILES.css, renderCss],
    ['tones.gen.ts', FILES.ts, renderTs],
  ]) {
    if (!existsSync(file)) {
      problems.push(`${kind} no existe (npm run tones)`);
      continue;
    }
    if (norm(readFileSync(file, 'utf8')) !== render(fresh)) problems.push(`${kind} no coincide con tokens.css (npm run tones)`);
  }
  return problems;
}

/** Lee --t0…--t15 tal como están escritos en tones.css (hex), para los pares de contraste. */
export function readTonesCss() {
  const css = readFileSync(FILES.css, 'utf8');
  const out = {};
  for (let i = 0; i < TONE_COUNT; i++) {
    const m = new RegExp(`--t${i}:\\s*(#[0-9a-f]{6})\\b`, 'i').exec(css);
    if (!m) throw new Error(`Falta --t${i} (hex) en tones.css`);
    out[`t${i}`] = m[1].toLowerCase();
  }
  return out;
}

/** Los 16 hex de la tabla de §5.4 de docs/ascii/DIRECTION.md, en orden (o null si el documento no está). */
export function specHexes() {
  const doc = join(ROOT, 'docs/ascii/DIRECTION.md');
  if (!existsSync(doc)) return null;
  const text = readFileSync(doc, 'utf8');
  const start = text.indexOf('### 5.4');
  const end = text.indexOf('**Presupuesto de tono**', start);
  if (start < 0 || end < 0) return null;
  return [...text.slice(start, end).matchAll(/`(#[0-9a-f]{6})`/gi)].map((m) => m[1].toLowerCase());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.includes('--spec')) {
    // Compara los hex que salen hoy con la tabla de DIRECTION §5.4 (sirve para saber si un cambio de --glow-* se aparta de ella).
    const want = specHexes();
    const got = computeTones(readFileSync(FILES.tokens, 'utf8')).hex;
    if (!want || want.length !== TONE_COUNT) {
      console.log(`No pude leer los ${TONE_COUNT} hex de DIRECTION §5.4 (encontré ${want?.length ?? 0}).`);
      process.exit(2);
    }
    const bad = got.map((h, i) => (h === want[i] ? null : `T${i}: sale ${h}, la tabla dice ${want[i]}`)).filter(Boolean);
    bad.forEach((b) => console.log(`FALLA  ${b}`));
    console.log(bad.length ? `\n${bad.length} tono(s) distinto(s) de §5.4.` : `Los ${TONE_COUNT} tonos coinciden con la tabla de DIRECTION §5.4.`);
    process.exit(bad.length ? 1 : 0);
  }
  if (process.argv.includes('--check')) {
    const problems = checkTones();
    for (const p of problems) console.log(`FALLA  ${p}`);
    console.log(problems.length ? `\n${problems.length} problema(s).` : 'tones.css y tones.gen.ts están al día.');
    process.exit(problems.length ? 1 : 0);
  }
  const tones = computeTones(readFileSync(FILES.tokens, 'utf8'));
  writeFileSync(FILES.css, renderCss(tones));
  writeFileSync(FILES.ts, renderTs(tones));
  console.log('Tonos del arte (T0–T15):');
  tones.hex.forEach((h, i) => console.log(`  T${String(i).padEnd(2)} ${h}  ${tones.oklch[i]}`));
  console.log('\nEscritos: src/styles/tones.css · src/ascii/tones.gen.ts');
}
