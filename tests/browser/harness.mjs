// Arnés «de producción» del motor: empaqueta src/scripts/field-boot.ts con esbuild (minificado, con división de código como el
// build de Astro) y lo sirve con un HTML equivalente al laboratorio. Sirve para dos medidas que el servidor de desarrollo no da:
//   · JS de primera carga del arte (gzip) = los .js que se piden antes del primer fotograma;
//   · arranque: primer fotograma tras `load` con CPU estrangulada, sin la sobrecarga de cientos de módulos sueltos de Vite.
// No toca dist/: todo va a un directorio temporal.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { build } from 'esbuild';
import { ROOT } from './lib.mjs';

export const PORT = Number(process.env.HARNESS_PORT ?? 4343);
const DIR = join(tmpdir(), 'gaya-field-harness');

const FONT = resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');
const FONT_SYM = resolve(ROOT, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-symbols2-wght-normal.woff2');

const CSS = `
:root{--cw:6px;--ch:12px;--t0:#02051b;--font-mono:"Geist Mono Variable","Gaya Mono Fallback",ui-monospace,monospace;--ink:#edf2f8;--muted:#a4b6ce}
@media (min-width:56.25rem){:root{--cw:9px;--ch:18px}}
@media (min-width:100rem){:root{--cw:12px;--ch:25px}}
@font-face{font-family:"Geist Mono Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/mono.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Gaya Mono Fallback";src:local("Courier New"),local("Liberation Mono");size-adjust:100%;ascent-override:100.5%;descent-override:29.5%;line-gap-override:0%}
body{margin:0;background:var(--t0);color:var(--ink);font:400 18px/1.4 system-ui,sans-serif}
canvas.field{position:fixed;inset:0 auto auto 0;width:100%;height:100lvh;z-index:0;display:block;pointer-events:none;background:var(--t0);opacity:0;transition:opacity 240ms linear}
html[data-field=live] canvas.field,html[data-field=still] canvas.field{opacity:1}
html[data-field=off] canvas.field,html[data-field=ssr] canvas.field{display:none}
main{position:relative;z-index:1}
.poster{min-height:100svh;display:flex;align-items:flex-end;padding:0 6vw 10vh;box-sizing:border-box}
.poster h2{margin:0;font:800 3rem/1.04 system-ui,sans-serif}.poster p{margin:0 0 12px;color:var(--muted)}
`;

const IDS = ['cover', 'hola', 'mist', 'web', 'listo', 'eco', 'on', 'ver', 'mist', 'tu'];
const HTML = (lang, js = true) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>harness</title><link rel="icon" href="data:,">
<link rel="preload" href="/fonts/mono.woff2" as="font" type="font/woff2" crossorigin fetchpriority="low"><link rel="stylesheet" href="/style.css"></head><body>
<canvas class="field" aria-hidden="true"></canvas>
<main id="contenido">${IDS.map((id, i) => `<section class="poster" data-poster="${id}" id="p${i}"><div><h2 data-well="ink">${id}</h2><p data-well="muted">${i}</p><a href="#p${i}">${id}</a></div></section>`).join('')}</main>
${js ? '<script type="module" src="/assets/field-boot.js"></script>' : ''}</body></html>`;

let built = null;

/** Empaqueta y escribe el arnés; devuelve los tamaños de cada pieza. */
export async function buildHarness() {
  rmSync(join(DIR, 'assets'), { recursive: true, force: true }); // sin trozos viejos de compilaciones anteriores
  mkdirSync(join(DIR, 'assets'), { recursive: true });
  mkdirSync(join(DIR, 'fonts'), { recursive: true });
  const r = await build({
    entryPoints: [resolve(ROOT, 'src/scripts/field-boot.ts')],
    outdir: join(DIR, 'assets'),
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    target: 'es2022',
    platform: 'browser',
    metafile: true,
    logLevel: 'silent',
    define: { 'import.meta.env.DEV': 'false' },
    chunkNames: '[name]-[hash]',
  });
  writeFileSync(join(DIR, 'style.css'), CSS);
  writeFileSync(join(DIR, 'index.html'), HTML('es'));
  writeFileSync(join(DIR, 'en.html'), HTML('en'));
  writeFileSync(join(DIR, 'nojs.html'), HTML('es', false)); // la ruta «sin JS» de Lighthouse (no admite scriptEnabled=false)
  writeFileSync(join(DIR, 'fonts/mono.woff2'), readFileSync(FONT));
  writeFileSync(join(DIR, 'fonts/symbols.woff2'), readFileSync(existsSync(FONT_SYM) ? FONT_SYM : FONT));
  const files = {};
  for (const f of readdirSync(join(DIR, 'assets'))) {
    const buf = readFileSync(join(DIR, 'assets', f));
    files[f] = { bytes: buf.length, gz9: gzipSync(buf, { level: 9 }).length, gz6: gzipSync(buf, { level: 6 }).length };
  }
  built = { files, meta: r.metafile };
  return built;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };

/** Levanta el servidor estático del arnés. Devuelve { base, close, sizes }. */
export async function serveHarness() {
  const sizes = built ?? (await buildHarness());
  const srv = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let p = u.pathname === '/' ? '/index.html' : u.pathname === '/en/' ? '/en.html' : u.pathname === '/nojs' ? '/nojs.html' : u.pathname;
    const f = join(DIR, p);
    if (!f.startsWith(DIR) || !existsSync(f) || !statSync(f).isFile()) {
      res.statusCode = 404;
      return res.end('no');
    }
    res.setHeader('Content-Type', MIME[extname(f)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(readFileSync(f));
  });
  await new Promise((ok) => srv.listen(PORT, '127.0.0.1', ok));
  return { base: `http://127.0.0.1:${PORT}`, close: () => new Promise((ok) => srv.close(ok)), sizes };
}

if (process.argv[1] && process.argv[1].endsWith('harness.mjs')) {
  const b = await buildHarness();
  let total = 0;
  for (const [f, s] of Object.entries(b.files)) {
    total += s.gz9;
    console.log(f.padEnd(40), String(s.bytes).padStart(7), 'B', String(s.gz9).padStart(6), 'B gz-9');
  }
  console.log('total gz-9 (todos los chunks, incluidas las palabras y escenas diferidas):', total, 'B');
}
