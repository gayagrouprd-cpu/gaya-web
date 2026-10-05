// Build REAL de Astro (Vite 8 / Rolldown: el empaquetador de producción) en una copia aislada del proyecto, con una página de sondeo que
// usa <Field />. El arnés de esbuild (harness.mjs) no reproduce la división de trozos de Rolldown: para el presupuesto T2 manda ESTE.
// No toca dist/ ni ningún archivo del proyecto: todo va a un directorio temporal (node_modules por enlace de unión).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { ROOT } from './lib.mjs';

export const REAL_DIR = join(tmpdir(), 'gaya-field-real');
export const REAL_PORT = Number(process.env.REAL_PORT ?? 4344);

const POSTERS = ['cover', 'hola', 'mist', 'web', 'listo', 'eco', 'on', 'ver', 'mist', 'tu'];
const PAGE = (lang) => `---
import Base from '../${lang === 'en' ? '../' : ''}layouts/Base.astro';
import Field from '../${lang === 'en' ? '../' : ''}components/Field.astro';
const posters = ${JSON.stringify(POSTERS)};
---
<Base lang="${lang}" title="probe" noindex preloadMono>
  <Field />
  <main id="contenido">
    {posters.map((id, i) => (
      <section class="poster" data-poster={id} id={\`p\${i}\`} style="min-height:100svh;display:flex;align-items:flex-end;padding:0 6vw 10vh;box-sizing:border-box;position:relative;z-index:1">
        <div><h2 data-well="ink" style="margin:0;color:var(--ink)">{id}</h2><p data-well="muted" style="margin:0;color:var(--muted)">{i}</p><a class="btn btn--primary" data-cta href={\`#p\${i}\`}>{id}</a></div>
      </section>
    ))}
  </main>
</Base>
`;

const skip = (p) => /[\\/](node_modules|dist|\.astro|\.git)([\\/]|$)/.test(p) || /public[\\/](ref|posters|ref-shared)([\\/]|$)/.test(p);

/**
 * Trozo de `vite.build` que junta el motor, el kit, los glifos, las palabras y `cover` en UN solo archivo de primera carga (Rolldown no
 * hace la optimización «ya cargado» de Rollup y deja `kit` aparte porque lo comparten la marea y las escenas diferidas). Propuesta para
 * `astro.config.mjs` (propiedad de WP1): ver docs/ascii/reports/WP5.md.
 */
export const ART_CHUNK = `rolldownOptions: { output: { advancedChunks: { groups: [{ name: 'art', test: /src[\\\\/]ascii[\\\\/](engine|atlas|render-gl|wells|tones\\.gen|kit|grid|noise|bluenoise\\.gen|glyphs|words|scenes[\\\\/](common|index|cover|duo|ramp))\\.ts$/ }] } } },`;

/** Copia el proyecto, pone la página de sondeo (es y en) y ejecuta `astro build`. Devuelve { dir, dist, files: {ruta: {bytes, gz9, gz6}} }. */
export function buildReal({ artChunk = false, patch = null } = {}) {
  rmSync(REAL_DIR, { recursive: true, force: true });
  mkdirSync(REAL_DIR, { recursive: true });
  for (const f of ['astro.config.mjs', 'package.json', 'tsconfig.json', 'brand.json']) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(REAL_DIR, f));
  cpSync(join(ROOT, 'src'), join(REAL_DIR, 'src'), { recursive: true, filter: (p) => !skip(p) });
  cpSync(join(ROOT, 'public'), join(REAL_DIR, 'public'), { recursive: true, filter: (p) => !skip(p) });
  // solo la página de sondeo: las páginas reales de otros paquetes pueden estar a medias
  rmSync(join(REAL_DIR, 'src/pages'), { recursive: true, force: true });
  mkdirSync(join(REAL_DIR, 'src/pages/en'), { recursive: true });
  writeFileSync(join(REAL_DIR, 'src/pages/index.astro'), PAGE('es'));
  writeFileSync(join(REAL_DIR, 'src/pages/en/index.astro'), PAGE('en'));
  if (artChunk) {
    const cfg = readFileSync(join(REAL_DIR, 'astro.config.mjs'), 'utf8');
    if (!cfg.includes('assetsInlineLimit: 0,')) throw new Error('astro.config.mjs cambió: no encuentro dónde insertar el trozo «art»');
    writeFileSync(join(REAL_DIR, 'astro.config.mjs'), cfg.replace('assetsInlineLimit: 0,', `assetsInlineLimit: 0,\n      ${ART_CHUNK}`));
  }
  if (patch) patch(REAL_DIR); // experimentos de tamaño: modificar la COPIA (nunca el proyecto) antes de construir
  symlinkSync(join(ROOT, 'node_modules'), join(REAL_DIR, 'node_modules'), 'junction');
  const r = spawnSync(process.execPath, [join(REAL_DIR, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: REAL_DIR, encoding: 'utf8', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
  if (r.status !== 0) throw new Error(`astro build falló:\n${(r.stdout ?? '') + (r.stderr ?? '')}`);
  const dist = join(REAL_DIR, 'dist');
  const files = {};
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.js')) {
        const buf = readFileSync(p);
        files[p.slice(dist.length + 1).replaceAll('\\', '/')] = { bytes: buf.length, gz9: gzipSync(buf, { level: 9 }).length, gz6: gzipSync(buf, { level: 6 }).length };
      }
    }
  };
  walk(dist);
  return { dir: REAL_DIR, dist, files, log: r.stdout };
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.json': 'application/json' };

/** Sirve un directorio estático (con index.html por carpeta, como GitHub Pages). */
export async function serveDir(dist, port = REAL_PORT) {
  const srv = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = resolve(join(dist, decodeURIComponent(u.pathname)));
    if (!f.startsWith(resolve(dist))) return res.end('no');
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) {
      res.statusCode = 404;
      return res.end('no');
    }
    res.setHeader('Content-Type', MIME[extname(f)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(readFileSync(f));
  });
  await new Promise((ok) => srv.listen(port, '127.0.0.1', ok));
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((ok) => srv.close(ok)) };
}
