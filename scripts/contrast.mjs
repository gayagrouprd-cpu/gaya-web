// Verifica los pares texto/fondo de las paletas (referencias y, cuando exista, el sitio).
// Uso: node scripts/contrast.mjs [--verbose]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { contrast, oklchToHex } from '../src/lib/color.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
let failures = 0;
let checked = 0;

function report(scope, fgName, bgName, fg, bg, min) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  checked++;
  if (!ok) failures++;
  if (!ok || verbose) {
    console.log(
      `${ok ? 'ok  ' : 'FALLA'}  ${scope.padEnd(11)} ${fgName}/${bgName}`.padEnd(40) +
        ` ${ratio.toFixed(2)} (mín ${min})  ${oklchToHex(fg)} sobre ${oklchToHex(bg)}`,
    );
  }
}

// 1) Referencias: pares comunes definidos en references.json
const refs = JSON.parse(readFileSync(join(ROOT, 'src/data/references.json'), 'utf8'));
for (const ref of refs.refs) {
  for (const p of [...refs.pairs, ...(ref.pairs ?? [])]) {
    const fg = ref.palette[p.fg];
    const bg = ref.palette[p.bg];
    if (!fg || !bg) continue;
    report(ref.slug, p.fg, p.bg, fg, bg, p.min ?? 4.5);
  }
}

// 2) Sitio: src/styles/tokens.json (si existe) => { variants: { nombre: { colores } }, pairs: [...] }
const siteFile = join(ROOT, 'src/styles/tokens.json');
if (existsSync(siteFile)) {
  const site = JSON.parse(readFileSync(siteFile, 'utf8'));
  for (const [variant, colors] of Object.entries(site.variants ?? {})) {
    for (const p of site.pairs ?? []) {
      const fg = colors[p.fg];
      const bg = colors[p.bg];
      if (!fg || !bg) continue;
      report(`sitio:${variant}`, p.fg, p.bg, fg, bg, p.min ?? 4.5);
    }
  }
}

console.log(`\n${checked} pares comprobados, ${failures} con fallo.`);
process.exit(failures ? 1 : 0);
