// Hashes dorados (T19): el mismo fotograma da el mismo hash en dos ejecuciones, en procesos distintos y con el intérprete de V8
// sin JIT. Para regenerarlos tras un cambio DE ARTE aprobado: UPDATE_GOLDEN=1 node --test "tests/ascii/**/*.test.mjs".
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeHashes } from './fixtures/hashes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = resolve(HERE, 'golden.json');
const CLI = resolve(HERE, 'fixtures/hash-cli.mjs');

const here = computeHashes();

test('mismo hash en dos ejecuciones dentro del proceso', () => {
  assert.deepEqual(computeHashes(), here);
});

test('mismo hash en dos procesos distintos', () => {
  const run = (...flags) => JSON.parse(execFileSync(process.execPath, [...flags, CLI], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  const a = run();
  const b = run();
  assert.deepEqual(a, here, 'proceso hijo 1 distinto del proceso de prueba');
  assert.deepEqual(b, a, 'proceso hijo 2 distinto del proceso hijo 1');
});

// --jitless desactiva WebAssembly y Node lo necesita para quitar los tipos de .ts: se empaqueta antes con esbuild (viene con Vite).
test('mismo hash con V8 sin JIT (intérprete puro: nada de la aritmética depende del compilador)', async (t) => {
  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    t.skip('esbuild no está instalado');
    return;
  }
  const dir = mkdtempSync(resolve(tmpdir(), 'gaya-ascii-'));
  try {
    const out = resolve(dir, 'hash-cli.bundle.mjs');
    await esbuild.build({ entryPoints: [CLI], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', external: ['node:*'] });
    const c = JSON.parse(execFileSync(process.execPath, ['--jitless', out], { encoding: 'utf8', maxBuffer: 1 << 26 }));
    assert.deepEqual(c, here, 'V8 sin JIT da otro resultado: hay aritmética que depende del motor');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// golden.json lo comparten el núcleo (este archivo: claves sin prefijo) y las escenas reales de WP6 (scenes-a.test.mjs: claves «scene/…»);
// las claves que empiezan por «_» son metadatos (estado de aprobación). Cada prueba solo lee y escribe lo suyo.
const readGold = () => (existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) : {});
const isOwn = (k) => !k.startsWith('scene/') && !k.startsWith('_');

test('coincide con los hashes dorados guardados (tests/ascii/golden.json)', () => {
  const all = readGold();
  const own = Object.keys(all).filter(isOwn);
  if (process.env.UPDATE_GOLDEN === '1' || own.length === 0) {
    const keep = Object.fromEntries(Object.entries(all).filter(([k]) => !isOwn(k)));
    writeFileSync(GOLDEN, JSON.stringify({ ...keep, ...here }, null, 2) + '\n');
    return;
  }
  assert.deepEqual(Object.keys(here).sort(), own.sort(), 'cambió el conjunto de huellas');
  for (const k of Object.keys(here)) assert.equal(here[k], all[k], `huella «${k}» cambió (si es un cambio de arte aprobado: UPDATE_GOLDEN=1)`);
});

test('las huellas son distintas entre sí donde deben serlo', () => {
  assert.notEqual(here['still-desktop'], here['still-mobile']);
  // la marea FIJA algo: cada fotograma con el frente en pantalla difiere del cartel saliente y del entrante, y de los demás
  const adv = ['tide-advance-76', 'tide-advance-52', 'tide-advance-28'];
  for (const k of adv) {
    assert.notEqual(here[k], here['still-cover-desktop'], `${k} es idéntico al cartel saliente: el frente no entró en pantalla`);
    assert.notEqual(here[k], here['still-on-desktop'], `${k} es idéntico al cartel entrante`);
  }
  assert.equal(new Set(adv.map((k) => here[k])).size, 3, 'los tres fotogramas de la marea son distintos');
  assert.notEqual(here['tide-advance-52'], here['tide-retreat-52']);
  assert.notEqual(here['still-desktop'], here['arrival-p30-desktop']);
  assert.notEqual(here['still-desktop'], here['heat-rings-desktop']);
  assert.equal(here['water-tile'], here['water-tile-default']);
});
