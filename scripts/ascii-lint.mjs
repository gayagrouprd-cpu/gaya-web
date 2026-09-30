#!/usr/bin/env node
// Lint de glifos del arte ASCII (DIRECTION §5.6 y Anexo C.3): dentro de una rejilla solo cabe el alfabeto de
// `ALLOWED_ART_CHARS` (src/ascii/glyphs.ts); lo demás cae a otra fuente y cambia de ancho. Rechaza, con archivo,
// línea y columna, cualquier carácter fuera de ese alfabeto en:
//   · los `.txt` de palabras (src/ascii/data/words/**), además solo cuadrantes, ancho constante y todas las variantes;
//   · `data-art="…"` en el HTML construido (dist/**/*.html) y en las plantillas (src/**/*.astro, *.html);
//   · los emblemas (src/data/emblems.ts): toda cadena que contenga cajas o bloques se trata como arte.
// Lo amplía después WP11 (`npm run ascii:lint`): exporta `lintText` y `lintFiles` para sumar fuentes.
//
//   node scripts/ascii-lint.mjs                 revisa todas las fuentes; sale con 1 si hay hallazgos
//   node scripts/ascii-lint.mjs a.txt b.html    revisa solo esos archivos (el tipo sale de la extensión)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_ART_CHARS } from '../src/ascii/glyphs.ts';
import { QUAD, SEPARATOR, LANGS, WORD_IDS, PROC_IDS, VARIANTS, WORDS_DIR, parseWordText, WordFormatError } from './words-pack.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUAD_SET = new Set(QUAD);
const PROHIBITED = new Set([...'←→■□▪▫●○◆◇▲▶★≈≠≤≥✓✗']);
const hex = (ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
const isBraille = (ch) => ch.codePointAt(0) >= 0x2800 && ch.codePointAt(0) <= 0x28ff;
const isPictographic = (ch) => /\p{Extended_Pictographic}/u.test(ch);
const isArtish = (ch) => { const c = ch.codePointAt(0); return (c >= 0x2500 && c <= 0x259f) || PROHIBITED.has(ch) || isBraille(ch) || isPictographic(ch); };

/** Motivo por el que un carácter no puede estar en una rejilla (o null si está permitido). */
export function whyNot(ch) {
  if (ALLOWED_ART_CHARS.has(ch)) return null;
  if (PROHIBITED.has(ch) || isBraille(ch) || isPictographic(ch)) return 'glifo prohibido en rejillas (cae a otra fuente y cambia de ancho)';
  return 'fuera del alfabeto de arte (ASCII, · ¯, cajas, bloques y « » ¿ ¡ × ± ° § – — …)';
}

/** Recorre `text` y devuelve los hallazgos { line, col, ch, why } de los caracteres no permitidos. */
function scan(text, line0 = 1, col0 = 1, extra = null) {
  const out = [];
  let line = line0, col = col0;
  for (const ch of text) {
    if (ch === '\n') { line++; col = 1; continue; }
    if (ch !== '\r') {
      const why = extra?.(ch) ?? whyNot(ch);
      if (why) out.push({ line, col, ch, why });
    }
    col++;
  }
  return out;
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodeEntities = (s) =>
  s.replace(/&(#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi, (m, _a, hx, dec, name) => (hx ? String.fromCodePoint(parseInt(hx, 16)) : dec ? String.fromCodePoint(+dec) : (entities[name.toLowerCase()] ?? m)));

/** `.txt` de palabras: alfabeto, cuadrantes, ancho constante y forma. */
function lintWordTxt(text, name) {
  const out = scan(text, 1, 1, (ch) => {
    if (ch === ' ' || QUAD_SET.has(ch) || ch === '-') return null;
    return whyNot(ch) ?? 'solo se admiten espacio, cuadrantes ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█ y la línea «---» entre líneas de una pila';
  });
  const rows = text.replace(/\r\n?/g, '\n').split('\n');
  while (rows.length && rows[rows.length - 1] === '') rows.pop();
  const width = Math.max(0, ...rows.map((r) => [...r].length));
  rows.forEach((r, i) => {
    const len = [...r].length;
    if (len !== width) out.push({ line: i + 1, col: len + 1, ch: '', why: `ancho no constante (${len} en vez de ${width}): rellena con espacios (node scripts/words-pack.mjs --normalize)` });
    if (/^-+\s*$/.test(r) && r.trimEnd() !== SEPARATOR) out.push({ line: i + 1, col: 1, ch: '', why: `el separador de líneas es exactamente «${SEPARATOR}»` });
    else if (r.includes('-') && r.trimEnd() !== SEPARATOR) out.push({ line: i + 1, col: r.indexOf('-') + 1, ch: '-', why: 'el guion solo vale como separador «---» en una línea aparte' });
  });
  if (!out.length) {
    try { parseWordText(text, name); } catch (e) { if (e instanceof WordFormatError) out.push({ line: 1, col: 1, ch: '', why: e.message }); else throw e; }
  }
  return out;
}

/** HTML / Astro: el valor de cada `data-art="…"` literal. */
function lintDataArt(text) {
  const out = [];
  const re = /\bdata-art\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[1] ?? m[2];
    if (/^\s*\{/.test(raw)) continue; // expresión de Astro, no un literal
    const start = m.index + m[0].indexOf(raw);
    const before = text.slice(0, start);
    const line = before.split('\n').length;
    const col = start - before.lastIndexOf('\n');
    // los hallazgos se anotan sobre el texto ya decodificado pero con la posición del valor
    const dec = decodeEntities(raw);
    for (const f of scan(dec, line, col)) out.push(f);
  }
  return out;
}

/** Cadenas de un .ts/.js (sin comentarios). Devuelve { text, line, col }. */
function* stringLiterals(src) {
  let i = 0, line = 1, col = 1;
  const adv = (c) => { if (c === '\n') { line++; col = 1; } else col++; };
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { adv(src[i]); i++; } continue; }
    if (c === '/' && d === '*') { i += 2; col += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { adv(src[i]); i++; } i += 2; col += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c, l0 = line, c0 = col + 1;
      i++; col++;
      let buf = '';
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') { buf += src[i]; adv(src[i]); i++; }
        buf += src[i]; adv(src[i]); i++;
      }
      i++; col++;
      yield { text: buf, line: l0, col: c0 };
      continue;
    }
    adv(c); i++;
  }
}

/** Emblemas: toda cadena con cajas, bloques o glifos prohibidos es arte y debe respetar el alfabeto. */
function lintEmblems(text) {
  const out = [];
  for (const s of stringLiterals(text)) if ([...s.text].some(isArtish)) out.push(...scan(s.text, s.line, s.col));
  return out;
}

const kindOf = (file) => {
  const ext = extname(file).toLowerCase();
  if (ext === '.txt') return 'word';
  if (ext === '.html' || ext === '.astro') return 'data-art';
  if (ext === '.ts' || ext === '.js' || ext === '.mjs') return 'emblems';
  return null;
};

export function lintText(kind, text, name = '(texto)') {
  if (kind === 'word') return lintWordTxt(text, name);
  if (kind === 'data-art') return lintDataArt(text);
  if (kind === 'emblems') return lintEmblems(text);
  throw new Error(`tipo de fuente desconocido: ${kind}`);
}

export function lintFiles(files) {
  const findings = [];
  for (const file of files) {
    const kind = kindOf(file);
    if (!kind) continue;
    for (const f of lintText(kind, readFileSync(file, 'utf8'), file)) findings.push({ file, ...f });
  }
  return findings;
}

const walk = (dir, pred, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(p, pred, out); }
    else if (pred(p)) out.push(p);
  }
  return out;
};

/** Variantes que tiene que haber: todas en cada palabra, `proc` solo en las del hilo del Proceso. */
function missingWordFiles() {
  const out = [];
  for (const lang of LANGS)
    for (const id of WORD_IDS[lang])
      for (const v of VARIANTS) {
        if (v === 'proc' && !PROC_IDS[lang].includes(id)) continue;
        const f = join(WORDS_DIR, lang, `${id}.${v}.txt`);
        if (!existsSync(f)) out.push({ file: f, line: 1, col: 1, ch: '', why: 'falta la variante' });
      }
  return out;
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  let files, findings = [];
  if (args.length) files = args.map((a) => resolve(a));
  else {
    files = [
      ...walk(WORDS_DIR, (p) => p.endsWith('.txt')),
      ...walk(join(ROOT, 'dist'), (p) => p.endsWith('.html')),
      ...walk(join(ROOT, 'src'), (p) => p.endsWith('.astro') || p.endsWith('.html')),
      join(ROOT, 'src/data/emblems.ts'),
    ].filter((f) => existsSync(f) && statSync(f).isFile());
    findings.push(...missingWordFiles());
  }
  findings.push(...lintFiles(files));
  for (const f of findings) {
    const where = `${relative(ROOT, f.file)}:${f.line}:${f.col}`;
    console.error(`${where}  ${f.ch ? `«${f.ch}» ${hex(f.ch)}  ` : ''}${f.why}`);
  }
  const kinds = files.reduce((m, f) => ((m[kindOf(f)] = (m[kindOf(f)] ?? 0) + 1), m), {});
  const resumen = Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(' · ');
  if (findings.length) {
    console.error(`ascii-lint: ${findings.length} hallazgo(s) en ${files.length} archivos (${resumen})`);
    process.exit(1);
  }
  console.log(`ascii-lint: verde (${files.length} archivos: ${resumen})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
