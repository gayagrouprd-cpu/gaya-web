#!/usr/bin/env node
// Ruido azul toroidal 32×32 por «vacío y racimo» (Ulichney 1993), generado en COMPILACIÓN e incrustado
// en src/ascii/bluenoise.gen.ts como base64 (1 KB de datos). Código original (R05 Anexo B.2, reimplementado).
//
// Uso:  node scripts/ascii-bluenoise.mjs            → escribe src/ascii/bluenoise.gen.ts
//       node scripts/ascii-bluenoise.mjs --check     → comprueba que el archivo generado es el que saldría hoy
//
// Determinista: PRNG mulberry32 con semilla fija y aritmética de doble precisión con + − × y exp() solo para
// construir el núcleo gaussiano (se ejecuta en Node, una vez; el resultado se congela en el archivo generado).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const N = 32;
const SIGMA = 1.9;
const SEED = 1;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/ascii/bluenoise.gen.ts');

const rng = (s) => {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Devuelve un Uint8Array N*N con el rango de cada celda escalado a 0..255 (umbral = (v + jitter) / 256). */
export function blueNoise(n1 = N, sigma = SIGMA, seed = SEED) {
  const n = n1 * n1;
  const R = Math.ceil(sigma * 4);
  const K = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) K.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))]);
  const E = new Float64Array(n);
  const on = new Uint8Array(n);
  const splat = (i, s) => {
    const x = i % n1;
    const y = (i / n1) | 0;
    for (const [dx, dy, w] of K) E[((y + dy + n1 * 4) % n1) * n1 + ((x + dx + n1 * 4) % n1)] += s * w;
  };
  const argmax = (want) => {
    let b = -1;
    let bv = -Infinity;
    for (let i = 0; i < n; i++) if (on[i] === want && E[i] > bv) { bv = E[i]; b = i; }
    return b;
  };
  const argmin = (want) => {
    let b = -1;
    let bv = Infinity;
    for (let i = 0; i < n; i++) if (on[i] === want && E[i] < bv) { bv = E[i]; b = i; }
    return b;
  };
  const r = rng(seed);
  // patrón inicial ≈ 10 % de unos, relajado hasta que el racimo más apretado coincide con el vacío más grande
  for (let k = 0; k < Math.floor(n * 0.1); k++) {
    let i;
    do { i = Math.floor(r() * n); } while (on[i]);
    on[i] = 1;
    splat(i, 1);
  }
  for (let it = 0; it < n; it++) {
    const c = argmax(1);
    on[c] = 0;
    splat(c, -1);
    const v = argmin(0);
    on[v] = 1;
    splat(v, 1);
    if (v === c) break;
  }
  const rank = new Uint16Array(n);
  const proto = on.slice();
  const E0 = E.slice();
  const ones = proto.reduce((s, x) => s + x, 0);
  // fase 1: quitar racimos → rangos ones-1..0
  for (let k = ones; k > 0; k--) {
    const c = argmax(1);
    on[c] = 0;
    splat(c, -1);
    rank[c] = k - 1;
  }
  // fase 2: desde el prototipo, rellenar vacíos hasta la mitad
  on.set(proto);
  E.set(E0);
  let cnt = ones;
  while (cnt < n / 2) {
    const v = argmin(0);
    rank[v] = cnt;
    on[v] = 1;
    splat(v, 1);
    cnt++;
  }
  // fase 3: el resto, buscando el racimo más apretado de CEROS
  while (cnt < n) {
    const c = argmax(0);
    rank[c] = cnt;
    on[c] = 1;
    splat(c, 1);
    cnt++;
  }
  return Uint8Array.from(rank, (v) => Math.min(255, Math.floor((v * 256) / n)));
}

export function render() {
  const t = blueNoise();
  const b64 = Buffer.from(t).toString('base64');
  return (
    '// GENERADO por scripts/ascii-bluenoise.mjs (vacío y racimo, toroidal, semilla fija). No editar a mano.\n' +
    '// Cada byte es el rango de la celda escalado a 0..255; bn() le suma un jitter de hash de 1/256 (kit.ts).\n' +
    `export const BLUENOISE_N = ${N};\n` +
    `export const BLUENOISE_B64 =\n  "${b64}";\n`
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = performance.now();
  const text = render();
  if (process.argv.includes('--check')) {
    const cur = readFileSync(OUT, 'utf8');
    if (cur !== text) {
      console.error('bluenoise.gen.ts no coincide con lo que generaría este script');
      process.exit(1);
    }
    console.log('bluenoise.gen.ts al día');
  } else {
    writeFileSync(OUT, text);
    const b = blueNoise();
    const hist = new Array(8).fill(0);
    for (const v of b) hist[v >> 5]++;
    console.log(`${N}x${N} en ${(performance.now() - t0).toFixed(0)} ms → ${OUT}`);
    console.log('histograma (debe ser plano):', hist.join(' '));
  }
}
