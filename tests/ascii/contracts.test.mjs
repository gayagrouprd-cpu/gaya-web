// Contratos de WP4: cada export de DIRECTION §12.4 y §6.3 existe con la aridad correcta, y los archivos cumplen las reglas de
// pureza y de sintaxis «borrable» (corren en Node 24 sin paso de compilación y en Vite).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as kit from '../../src/ascii/kit.ts';
import * as noise from '../../src/ascii/noise.ts';
import * as grid from '../../src/ascii/grid.ts';
import * as wells from '../../src/ascii/wells.ts';
import * as tide from '../../src/ascii/tide.ts';
import * as ssr from '../../src/ascii/ssr.ts';
import * as common from '../../src/ascii/scenes/common.ts';
import * as glyphs from '../../src/ascii/glyphs.ts';
import * as types from '../../src/ascii/types.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(ROOT, 'src/ascii');

test('§12.4 · kit.ts: firmas exactas', () => {
  const sig = { bakeWaterTile: 0, agua: 4, mist: 5, faceFn: 3, halo: 4, shadow: 4, edt: 3, bn: 2 };
  for (const [name, arity] of Object.entries(sig)) {
    assert.equal(typeof kit[name], 'function', `kit.${name} debe ser una función`);
    assert.equal(kit[name].length, arity, `kit.${name} tiene aridad ${kit[name].length}, el contrato dice ${arity}`);
  }
});

test('§12.4 · tide.ts y ssr.ts: firmas exactas', () => {
  assert.equal(typeof tide.front, 'function');
  assert.equal(tide.front.length, 2);
  assert.equal(typeof tide.compose, 'function');
  assert.equal(tide.compose.length, 7);
  assert.equal(typeof ssr.renderPosterLayers, 'function');
  assert.equal(ssr.renderPosterLayers.length, 4);
});

test('§6.3 · noise.ts: h2, vnoise, fbm enteros y deterministas', () => {
  assert.equal(noise.h2.length, 2);
  assert.equal(noise.vnoise.length, 2);
  assert.equal(noise.fbm.length, 3);
  for (const f of ['hu', 'pvnoise', 'pfbm', 'pgnoise', 'pgfbm', 'sinp', 'cosp']) assert.equal(typeof noise[f], 'function', f);
});

test('§6.3 · grid.ts: Grid de 4 bytes por celda con vista Uint32 y las operaciones de la lista', () => {
  const g = new grid.Grid(7, 5);
  assert.equal(g.b.length, 7 * 5 * 4);
  assert.equal(g.u.length, 7 * 5);
  assert.equal(g.u.buffer, g.b.buffer, 'b y u comparten el mismo ArrayBuffer');
  for (const m of ['put', 'tone', 'fill', 'text', 'blit', 'overlay', 'copyFrom', 'toText', 'toLayers', 'clear', 'get', 'bgTone', 'fillBg', 'box', 'line', 'poly', 'hash']) {
    assert.equal(typeof g[m], 'function', `Grid.${m}`);
  }
  for (const f of ['put', 'fill', 'text', 'blit', 'overlay', 'toText', 'toLayers', 'makeCells', 'clear']) assert.equal(typeof grid[f], 'function', `grid.${f}`);
});

test('§12.4 · wells.ts: máscara de topes', () => {
  for (const f of ['buildCap', 'applyCap', 'makeCap', 'inflateRows', 'globalCapFor', 'pxToCellRect']) assert.equal(typeof wells[f], 'function', f);
  assert.equal(wells.buildCap.length, 4);
  assert.equal(wells.WELL_CAPS.ink, 6);
  assert.equal(wells.WELL_CAPS.muted, 4);
  assert.equal(wells.CAP_FLOOR, 1);
});

test('common.ts reexporta el kit, el ruido, la rejilla y los glifos', () => {
  for (const mod of [kit, noise, grid, glyphs]) {
    for (const k of Object.keys(mod)) assert.ok(k in common, `scenes/common.ts no reexporta ${k}`);
  }
  assert.equal(common.STILL_T, 21.7);
});

test('WP0 intacto: glyphs.ts y types.ts', () => {
  assert.equal(types.STILL_T, 21.7);
  assert.equal(types.TONES, 16);
  assert.equal(glyphs.GLYPH_COUNT, 147);
  assert.ok(glyphs.GLYPH_COUNT < 256, 'un glifo por byte');
  assert.equal(glyphs.glyphIndex('█'), 101);
  assert.equal(glyphs.glyphIndex('~'), 94);
  assert.equal(glyphs.glyphChar(97), '▀');
  assert.equal(glyphs.QUAD_GLYPH.length, 16);
});

// ---------- reglas de archivo ----------

const MINE = ['noise.ts', 'grid.ts', 'kit.ts', 'wells.ts', 'tide.ts', 'ssr.ts', 'scenes/common.ts'];
/** Quita comentarios y cadenas para que las reglas no salten por lo que dice un comentario. */
const code = (file) =>
  readFileSync(resolve(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('sintaxis borrable: sin enum, namespace, parámetros con modificador ni decoradores', () => {
  for (const f of MINE) {
    const c = code(f);
    assert.doesNotMatch(c, /\benum\s+\w+/, `${f}: enum`);
    assert.doesNotMatch(c, /\bnamespace\s+\w+/, `${f}: namespace`);
    assert.doesNotMatch(c, /constructor\s*\([^)]*\b(private|public|protected|readonly)\s+\w/, `${f}: parameter properties`);
    assert.doesNotMatch(c, /^\s*@\w+/m, `${f}: decorador`);
    assert.doesNotMatch(c, /\bimport\s+\w+\s*=\s*require/, `${f}: import = require`);
  }
});

test('imports relativos con extensión .ts explícita', () => {
  for (const f of MINE) {
    const c = readFileSync(resolve(SRC, f), 'utf8');
    for (const m of c.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) assert.match(m[1], /\.ts$/, `${f}: «${m[1]}» sin .ts`);
  }
});

test('pureza: sin Math.random, sin reloj, sin DOM en ningún archivo del núcleo', () => {
  for (const f of MINE) {
    const c = code(f);
    assert.doesNotMatch(c, /Math\.random/, `${f}: Math.random`);
    assert.doesNotMatch(c, /performance\.now|Date\.now|new Date\b/, `${f}: reloj`);
    assert.doesNotMatch(c, /\b(document|window|navigator|requestAnimationFrame)\b/, `${f}: DOM`);
  }
});

test('ruta still: nada de Math.sin/cos/pow/exp/log/tan en el núcleo (solo enteros y polinomios)', () => {
  for (const f of MINE) {
    const c = code(f);
    assert.doesNotMatch(c, /Math\.(sin|cos|tan|pow|exp|log|log2|log10|atan|atan2|asin|acos|sinh|cosh|tanh|hypot|cbrt)\b/, `${f}: transcendente`);
    assert.doesNotMatch(c, /\*\*/, `${f}: operador ** (es pow)`);
  }
});

test('todos los .ts de src/ascii/ (míos y ajenos) cargan en Node sin paso de compilación', async () => {
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(resolve(d, e.name));
      else if (e.name.endsWith('.ts')) files.push(resolve(d, e.name));
    }
  };
  walk(SRC);
  assert.ok(files.length >= 9);
  for (const f of MINE.map((m) => resolve(SRC, m))) await import(pathToUrl(f));
});

const pathToUrl = (p) => new URL(`file:///${p.replace(/\\/g, '/')}`).href;
