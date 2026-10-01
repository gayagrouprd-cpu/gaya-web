// Desglose del JS del arte por archivo fuente (esbuild metafile): qué pesa cada módulo en cada trozo. Uso: node tests/browser/size-breakdown.mjs
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { ROOT } from './lib.mjs';

const r = await build({
  entryPoints: [resolve(ROOT, 'src/scripts/field-boot.ts')],
  outdir: 'out',
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: 'es2022',
  platform: 'browser',
  metafile: true,
  write: false,
  logLevel: 'silent',
  define: { 'import.meta.env.DEV': 'false' },
});
for (const [out, o] of Object.entries(r.metafile.outputs)) {
  if (/words\.gen|hola|mist|render-2d/.test(out)) continue;
  console.log(`\n${out.split('/').pop()}  ${o.bytes} B min`);
  const inputs = Object.entries(o.inputs).sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput).slice(0, 16);
  for (const [i, v] of inputs) console.log('   ', String(v.bytesInOutput).padStart(6), i.replace('src/', ''));
}
