// Ejecuta todas las pruebas de navegador del motor en serie (cada una es un script independiente con su propio informe).
// Requiere el laboratorio en marcha:  npx astro dev --host 127.0.0.1 --port 4333   (FIELD_URL cambia el origen).
// Uso: node tests/browser/run-all.mjs [nombre …]   (p. ej. «tide boot»)
// Las pruebas de tiempo real (boot, tide, lifecycle, perf, lighthouse) miden relojes de pared: con la máquina cargada por otros procesos
// (decenas de Chrome a la vez) un cuadro tardío puede dar un falso rojo; repetir el script sólo antes de dar por roto el motor. `inputs` y
// `wells` usan el reloj falso de Playwright y no dependen de la carga. `size-real` construye Astro en una copia temporal (≈ 10 s).
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ALL = ['boot', 'tide', 'resize', 'context', 'inputs', 'wells', 'lifecycle', 'parity', 'seams', 'a11y', 'size', 'size-real', 'perf', 'render2d', 'motion', 'lighthouse', 'shots'];
const pick = process.argv.slice(2);
const list = pick.length ? pick : ALL;
const results = [];
for (const name of list) {
  console.log(`\n══════ ${name} ══════`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [resolve(HERE, `${name}.mjs`)], { stdio: 'inherit' });
  results.push([name, r.status === 0, ((Date.now() - t0) / 1000).toFixed(0)]);
}
console.log('\n══════ resumen ══════');
for (const [n, ok, s] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n.padEnd(12)} ${s} s`);
process.exitCode = results.every((r) => r[1]) ? 0 : 1;
