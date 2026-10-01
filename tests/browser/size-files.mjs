// Peso gzip de cada módulo del motor por separado (transformación + minificado, sin empaquetar): para saber dónde recortar.
import { transform } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { ROOT } from './lib.mjs';
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['engine', 'atlas', 'render-gl', 'render-2d', 'tide', 'wells', 'grid', 'kit', 'noise', 'words', 'scenes/cover'].map((f) => `src/ascii/${f}.ts`).concat(['src/scripts/field-boot.ts']);
let total = 0;
for (const f of files) {
  const src = readFileSync(resolve(ROOT, f), 'utf8');
  const out = await transform(src, { loader: 'ts', minify: true, target: 'es2022', define: { 'import.meta.env.DEV': 'false' } });
  const gz = gzipSync(out.code, { level: 9 }).length;
  total += gz;
  console.log(f.padEnd(34), String(out.code.length).padStart(6), 'B min', String(gz).padStart(6), 'B gz-9');
}
console.log('suma'.padEnd(34), ' '.repeat(12), String(total).padStart(6), 'B gz-9');
