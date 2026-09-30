// Verifica los pares texto/fondo de las paletas (referencias y sitio) y que las fuentes únicas del sitio estén al día.
//  - Referencias: pares definidos en src/data/references.json
//  - Sitio: pares de src/styles/tokens.json; además de sus colores, cada variante recibe los 16 tonos del arte
//    (t0…t15, leídos de src/styles/tones.css) y `lead`, así que un par puede nombrarlos (p. ej. ink sobre t6)
//  - Coherencia: tones.css y tones.gen.ts coinciden con lo que saldría hoy de tokens.css (npm run tones), y tokens.json
//    es espejo de tokens.css (colores y --lead)
// Uso: node scripts/contrast.mjs [--verbose]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { contrast, contrastRgb255, oklchToHex, oklchToRgb255, parseOklch } from '../src/lib/color.mjs';
import { checkTones, readTonesCss } from './tones.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
let failures = 0;
let checked = 0;
let coherence = 0;

// Un color puede venir como oklch(…) (tokens) o como #rrggbb (los tonos del arte: hex, igual en DOM y lienzo).
const isHex = (s) => /^#[0-9a-f]{6}$/i.test(s);
const rgbOf = (s) => (isHex(s) ? [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) : oklchToRgb255(s));
const hexOf = (s) => (isHex(s) ? s.toLowerCase() : oklchToHex(s));
const ratioOf = (a, b) => (isHex(a) || isHex(b) ? contrastRgb255(rgbOf(a), rgbOf(b)) : contrast(a, b));

function report(scope, fgName, bgName, fg, bg, min) {
  const ratio = ratioOf(fg, bg);
  const ok = ratio >= min;
  checked++;
  if (!ok) failures++;
  if (!ok || verbose) {
    console.log(
      `${ok ? 'ok  ' : 'FALLA'}  ${scope.padEnd(11)} ${fgName}/${bgName}`.padEnd(40) +
        ` ${ratio.toFixed(2)} (mín ${min})  ${hexOf(fg)} sobre ${hexOf(bg)}`,
    );
  }
}

function check(ok, message) {
  coherence++;
  if (!ok) {
    failures++;
    console.log(`FALLA  ${message}`);
  } else if (verbose) console.log(`ok     ${message}`);
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
  const tones = existsSync(join(ROOT, 'src/styles/tones.css')) ? readTonesCss() : {};
  for (const [variant, colors] of Object.entries(site.variants ?? {})) {
    const palette = { ...colors, ...tones };
    for (const p of site.pairs ?? []) {
      if (!p.fg) continue; // entradas {"_": "comentario"}
      const fg = palette[p.fg];
      const bg = palette[p.bg];
      if (!fg || !bg) {
        check(false, `sitio:${variant} ${p.fg}/${p.bg}: falta el color «${!fg ? p.fg : p.bg}» (¿tokens.json o tones.css?)`);
        continue;
      }
      report(`sitio:${variant}`, p.fg, p.bg, fg, bg, p.min ?? 4.5);
    }
  }

  // 3) Fuentes únicas: los tonos se regeneran con `npm run tones`; tokens.json refleja a tokens.css.
  for (const problem of checkTones()) check(false, problem);
  check(true, 'tones.css y tones.gen.ts al día con tokens.css');

  const css = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');
  const cssVar = (name) => new RegExp(`--${name}:\\s*(oklch\\([^)]*\\))`).exec(css)?.[1];
  const close = (a, b) => {
    const x = parseOklch(a);
    const y = parseOklch(b);
    return Math.abs(x.L - y.L) < 0.0006 && Math.abs(x.C - y.C) < 0.0006 && Math.abs(x.h - y.h) < 0.06;
  };
  const MIRROR = { surface: 'surface', surface2: 'surface-2', ink: 'ink', muted: 'muted', accent: 'accent', onAccent: 'on-accent', accentText: 'accent-text' };
  for (const [variant, colors] of Object.entries(site.variants ?? {})) {
    for (const [key, cssName] of Object.entries(MIRROR)) {
      if (!colors[key]) continue;
      const fromCss = cssVar(cssName);
      check(Boolean(fromCss) && close(colors[key], fromCss), `sitio:${variant} ${key} en tokens.json = --${cssName} de tokens.css`);
    }
    // --lead = color-mix(in oklch, var(--ink) N%, var(--muted)): se calcula aquí y se compara con el literal de tokens.json
    const mix = /--lead:\s*color-mix\(in oklch,\s*var\(--ink\)\s*(\d+)%,\s*var\(--muted\)\)/.exec(css);
    if (colors.lead) {
      if (!mix) check(false, `sitio:${variant} --lead ya no es color-mix(ink N%, muted): actualiza este script y tokens.json`);
      else {
        const f = Number(mix[1]) / 100;
        const a = parseOklch(colors.ink);
        const b = parseOklch(colors.muted);
        const mixed = `oklch(${a.L * f + b.L * (1 - f)} ${a.C * f + b.C * (1 - f)} ${a.h * f + b.h * (1 - f)})`;
        check(close(colors.lead, mixed), `sitio:${variant} lead en tokens.json = color-mix(ink ${mix[1]}%, muted) de tokens.css`);
      }
    }
  }
}

console.log(`\n${checked} pares comprobados, ${coherence} comprobaciones de coherencia, ${failures} con fallo.`);
process.exit(failures ? 1 : 0);
