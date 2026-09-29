#!/usr/bin/env node
// Prepara las fuentes de las referencias: copia los woff2 (latin + latin-ext) de @fontsource-variable
// a public/ref-shared/fonts/<paquete>/ y genera public/ref-shared/fonts/<paquete>.css con sus @font-face.
// Las referencias enlazan ese CSS con una ruta relativa: ../../ref-shared/fonts/<paquete>.css
//
// Uso: node scripts/fonts.mjs <paquete>[:<ejes>] ...
//   ejes = wght (por defecto) | wdth | opsz | standard | full   (según los archivos que tenga el paquete)
//   p. ej.  node scripts/fonts.mjs bricolage-grotesque:wdth literata:wght jetbrains-mono
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'ref-shared', 'fonts');

// Rangos unicode estándar de Google Fonts / Fontsource
const RANGES = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function prepareFont(pkg, axes = 'wght') {
  const dir = join(ROOT, 'node_modules', '@fontsource-variable', pkg);
  if (!existsSync(dir)) throw new Error(`Falta @fontsource-variable/${pkg}. Instálalo con: npm i -D @fontsource-variable/${pkg}`);
  const files = readdirSync(join(dir, 'files'));
  const dest = join(OUT, pkg);

  const faces = [];
  for (const subset of ['latin', 'latin-ext']) {
    for (const style of ['normal', 'italic']) {
      const re = new RegExp(`^${esc(pkg)}-${esc(subset)}-${axes}-${style}\\.woff2$`);
      const pick = files.find((f) => re.test(f));
      if (pick) faces.push({ subset, style, file: pick });
    }
  }
  if (!faces.some((f) => f.subset === 'latin')) {
    const available = [...new Set(files.filter((f) => /-latin-[a-z]+-(normal|italic)\.woff2$/.test(f)).map((f) => f.match(/-latin-([a-z]+)-/)[1]))];
    throw new Error(`${pkg}: no existe el eje "${axes}". Disponibles: ${available.join(', ')}`);
  }
  mkdirSync(dest, { recursive: true });
  for (const f of faces) copyFileSync(join(dir, 'files', f.file), join(dest, f.file));

  // Rango de pesos/anchos que declara el propio paquete para ese eje
  const cssFile = existsSync(join(dir, `${axes}.css`)) ? `${axes}.css` : 'index.css';
  const css = readFileSync(join(dir, cssFile), 'utf8');
  const latinBlock = css.split('/*').find((b) => new RegExp(`^ ${esc(pkg)}-latin-${axes}-normal `).test(b)) ?? css;
  const weight = /font-weight:\s*([\d\s]+);/.exec(latinBlock)?.[1]?.trim() ?? '100 900';
  const stretch = /font-stretch:\s*([\d.%\s]+);/.exec(latinBlock)?.[1]?.trim();
  const familyName = /font-family:\s*'([^']+)'/.exec(css)?.[1] ?? pkg;

  const rules = faces.map(
    (f) =>
      `@font-face{font-family:'${familyName}';font-style:${f.style};font-display:swap;font-weight:${weight};${stretch ? `font-stretch:${stretch};` : ''}src:url(./${pkg}/${f.file}) format('woff2');unicode-range:${RANGES[f.subset]}}`,
  );
  writeFileSync(join(OUT, `${pkg}.css`), rules.join('\n') + '\n');
  const bytes = faces.reduce((a, f) => a + readFileSync(join(dest, f.file)).length, 0);
  return { family: familyName, files: faces.length, weight, stretch, kb: bytes / 1024 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const specs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!specs.length) {
    console.error('Indica al menos un paquete, p. ej.: node scripts/fonts.mjs bricolage-grotesque:wdth');
    process.exit(1);
  }
  for (const spec of specs) {
    const [pkg, axes] = spec.split(':');
    const r = prepareFont(pkg, axes ?? 'wght');
    console.log(`ok  ${spec.padEnd(28)} '${r.family}'  ${r.files} archivos  ${r.kb.toFixed(0)} KB  peso ${r.weight}${r.stretch ? '  ancho ' + r.stretch : ''}`);
  }
}
