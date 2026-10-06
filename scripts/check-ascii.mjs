#!/usr/bin/env node
// Puertas de calidad del arte ASCII (DIRECTION §11, §12.2 fila WP11 y §13): UN comando que corre todas las pruebas automatizables de T1–T22,
// guarda el registro de cada puerta y termina con un resumen legible y un código de salida (0 = todo en verde; 1 = alguna puerta falló).
//
//   npm run check:ascii               completo: incluye Lighthouse (T1: tres rutas × ES/EN × móvil y escritorio, mediana de 3)
//   npm run check:ascii -- --fast     sin Lighthouse (ni el de page-check ni el de tests/browser): lo mismo, en una fracción del tiempo
//
// Opciones:  --build            ejecuta «npm run build» antes de empezar (por omisión se usa el dist/ que haya; avisa si está viejo)
//            --strict-dist      un dist/ más viejo que src/ es un fallo, no un aviso
//            --only a,b  --skip a,b   elige puertas por id (ver --list)
//            --list             lista las puertas y a qué prueba de §13 sirven
//            --bail             para en la primera que falle (por omisión corre todas)
//            --verbose          imprime también el registro de cada puerta mientras corre
//            --out DIR          dónde dejar los registros y el resumen (por omisión reports/ascii/wp11)
//            --lab-port N       puerto del servidor de laboratorio (por omisión 4352)
//
// Qué NO se puede automatizar y queda a mano (se imprime siempre, con su estado): T15 prueba de los 5 segundos, T16 navegadores y WebViews,
// T18 aprobación del dueño en color, T21 PEAT (la parte de diseño sí corre), y la puerta de T12 en el Samsung A07 físico (ABIERTA).
//
// Dónde corre cada cosa: lo que mira la página construida usa dist/ servido como GitHub Pages (scripts/serve-pages.mjs: gzip, caché de
// 600 s, rutas con mayúsculas). Las pruebas de tests/browser necesitan el laboratorio de desarrollo (`/lab/field/`, solo `astro dev`): como
// Astro 7 admite UN servidor de desarrollo por proyecto y puede haber otro en marcha, se levanta uno propio sobre una COPIA temporal del
// proyecto (así tampoco le afectan los cambios que otros hagan en src/ mientras corre).
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { BUDGET } from './budgets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const FAST = !!arg('fast', false);
const BAIL = !!arg('bail', false);
const VERBOSE = !!arg('verbose', false);
const STRICT_DIST = !!arg('strict-dist', false);
const BUILD = !!arg('build', false);
const ONLY = arg('only', null) ? String(arg('only')).split(',') : null;
const SKIP = arg('skip', null) ? String(arg('skip')).split(',') : [];
const OUT = resolve(ROOT, String(arg('out', 'reports/ascii/wp11')));
const LAB_PORT = Number(arg('lab-port', 4352));
const NODE = process.execPath;
const script = (name, ...a) => [join('scripts', name), ...a];

// ── Datos que hacen falta para armar las puertas ────────────────────────────────────────────────────────────────────────────
const slug = (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'src/data/references.json'), 'utf8')).refs.find((r) => r.status === 'built')?.slug ?? null;
  } catch {
    return null;
  }
})();
/** Pruebas de tests/browser que corre run-all.mjs (se lee su lista para no quedar desfasado; solo las que existen como archivo). */
const browserTests = (() => {
  try {
    const src = readFileSync(join(ROOT, 'tests/browser/run-all.mjs'), 'utf8');
    const names = [...(/const ALL = \[([^\]]*)\]/.exec(src)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
    return names.filter((n) => existsSync(join(ROOT, 'tests/browser', `${n}.mjs`)));
  } catch {
    return [];
  }
})();
const sweepScript = existsSync(join(ROOT, 'scripts/ascii-sweep.mjs'));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const hasSweepNpm = !!pkg.scripts?.['ascii:sweep'];

// ── Puertas ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// id · título · pruebas de §13 a las que sirve · argumentos de node · requisitos · flags: lh (lleva Lighthouse: no corre en --fast)
const G = [];
const gate = (id, title, t, args, o = {}) => G.push({ id, title, t, args, ...o });

// Código y datos (no necesitan dist/)
// node --test, en dos tandas para saber de qué prueba habla un fallo: el arte de las escenas (reglas de §6.3, presupuesto de tono, hashes dorados:
// tests/ascii/scenes*.test.mjs y golden.test.mjs, que cambian con el arte) y todo lo demás (núcleo, palabras, póster SSR, marea, pozos, DOM, contenido).
{
  const files = [];
  for (const d of ['tests/ascii', 'tests/content']) {
    const dir = join(ROOT, d);
    if (existsSync(dir)) for (const n of readdirSync(dir).sort()) if (n.endsWith('.test.mjs')) files.push(`${d}/${n}`);
  }
  const art = files.filter((f) => /tests\/ascii\/(scenes?[-.\w]*|golden)\.test\.mjs$/.test(f));
  const core = files.filter((f) => !art.includes(f));
  gate('unit-core', `node --test (${core.length} archivos): núcleo, palabras, póster SSR, marea, pozos, arte en el DOM, contenido`, ['T6', 'T17', 'T21'], ['--test', ...core]);
  gate('unit-scenes', `node --test (${art.length} archivos): reglas de escena, presupuesto de tono, still ≡ paint(1, STILL_T) y hashes dorados`, ['T5', 'T10', 'T19'], ['--test', ...art]);
}
gate('ascii-lint', 'ascii:lint: solo el alfabeto de glifos permitido (palabras, data-art, emblemas, dist)', ['T4'], script('ascii-lint.mjs'));
gate('lint-content', 'lint:content: copia ES/EN, honestidad, paridad, «Incluye» 4–7, banderas, JSON-LD', ['T17', 'T20'], script('lint-content.mjs'));
gate('lint-content-red', 'lint:content --self-test: el caso verde pasa y el rojo falla con cada defecto', ['T17'], script('lint-content.mjs', '--self-test'));
gate('words-pack', 'words:pack --check: los módulos de palabras están al día con los .txt', ['T19'], script('words-pack.mjs', '--check'));
gate('tones', 'tones --check: tones.css y tones.gen.ts al día con tokens.css', ['T5'], script('tones.mjs', '--check'));
gate('tones-spec', 'tones --spec: los 16 hex coinciden con DIRECTION §5.4', ['T5'], script('tones.mjs', '--spec'));
gate('bluenoise', 'ascii-bluenoise --check: el ruido azul generado es el que saldría hoy', ['T19'], script('ascii-bluenoise.mjs', '--check'));
gate('contrast', 'contrast: pares de tokens (§5.8), paletas de las referencias y coherencia CSS/TS', ['T5'], script('contrast.mjs'));
gate('stills', 'ascii-stills: área de tinta por tono (T5), hash por escena × idioma × variante (T19) y palabra móvil ≥ 280 px (T22)', ['T5', 'T19', 'T22'], script('ascii-stills.mjs'));
// El barrido de escenas (ascii:sweep) lo añade otro paquete: si existe scripts/ascii-sweep.mjs o el script de npm, corre aquí
{
  const sweepNpm = pkg.scripts?.['ascii:sweep'];
  if (sweepScript) gate('sweep', 'ascii:sweep: barrido de las escenas', ['T19'], script('ascii-sweep.mjs'));
  else if (sweepNpm && /^node\s+/.test(sweepNpm)) gate('sweep', 'ascii:sweep: barrido de las escenas (cada escena registrada en cientos de visores: tono y celdas no vacías)', ['T5', 'T19'], sweepNpm.replace(/^node\s+/, '').split(/\s+/));
}

// Lo construido (dist/), sin navegador
gate('budgets', 'budgets: HTML, CSS, fuentes, JS de primera carga del arte, JS total y primera carga (medidos sobre dist/)', ['T2'], script('budgets.mjs'), { dist: true });
gate('meta', 'ascii-meta: canonical, hreflang recíproco, og:image, JSON-LD, sitemap, anclas', ['T20'], script('ascii-meta.mjs'), { dist: true });

// Lo construido, en Chrome real
gate('guard', 'guard: 0 peticiones a otro origen y 0 errores de consola en las 11 páginas', ['T3'], script('guard.mjs'), { dist: true });
gate('guard-matrix', 'guard --matrix: las portadas en normal, ?still, ?nogl, movimiento reducido, saveData y sin JS', ['T3', 'T10'], script('guard.mjs', '--matrix'), { dist: true });
gate('flow', 'flow: portada → ejemplos, la galería vieja redirige, y el visor con teclado y puntero', ['T4'], script('flow-check.mjs'), { dist: true });
for (const [id, p] of [['page-check-es', '/'], ['page-check-en', '/en/']]) {
  gate(id, `page-check ${p}: red, desborde a 7 anchos, axe (3 perfiles), objetivos táctiles${FAST ? '' : ' (Lighthouse lo hace lighthouse-routes)'}`, ['T3', 'T4'], script('page-check.mjs', '--path', p, '--fast'), { dist: true });
}
if (slug) gate('page-check-viewer', `page-check /referencias/${slug}/ (el visor)${FAST ? '' : ' con Lighthouse'}`, ['T1', 'T4'], script('page-check.mjs', '--path', `/referencias/${slug}/`, ...(FAST ? ['--fast'] : [])), { dist: true, lh: true });
if (slug) gate('page-check-viewer-en', `page-check /en/references/${slug}/ (el visor en inglés)${FAST ? '' : ' con Lighthouse'}`, ['T1', 'T4'], script('page-check.mjs', '--path', `/en/references/${slug}/`, ...(FAST ? ['--fast'] : [])), { dist: true, lh: true });
gate('home-check', 'home-check: estructura, 2.5.3, 2.5.8, Tab completo, 360×800, 15 tamaños sin pisar la palabra, paridad ES/EN, axe', ['T4', 'T14', 'T22'], script('home-check.mjs', '--shots', 'reports/ascii/wp11/home'), { dist: true });
gate('home-nojs', 'home-nojs --matrix: la portada sin JavaScript (póster SSR) en 13 tamaños', ['T6', 'T10'], script('home-nojs.mjs', '--matrix', '--out', 'reports/ascii/wp11/nojs/home'), { dist: true });
gate('home-media-es', 'home-media (ES): forced-colors, prefers-contrast: more con topes T4/T2, impresión', ['T7', 'T11'], script('home-media.mjs', '--lang', 'es', '--out', 'reports/ascii/wp11/media/home-es'), { dist: true });
gate('home-media-en', 'home-media (EN): forced-colors, prefers-contrast: more con topes T4/T2, impresión', ['T7', 'T11'], script('home-media.mjs', '--lang', 'en', '--out', 'reports/ascii/wp11/media/home-en'), { dist: true });
gate('home-states', 'home-states: capturas de hover, foco y estados (corre sin errores)', ['T14'], script('home-states.mjs', '--out', 'reports/ascii/wp11/states/home'), { dist: true });
gate('typo-check', 'typo-check --extra: tipografía mixta, titulares sin partir, botones, pozos (7 anchos × 7 páginas)', ['T4'], script('typo-check.mjs', '--extra'), { dist: true });
gate('base-check', 'base-check: fuentes, costuras del arte, botones, placa, forced/contrast/print, CLS', ['T8', 'T11'], script('base-check.mjs'), { dist: true });
gate('wp10b-check', 'wp10b/check: cromo, menú, hilo, póster SSR = renderPosterLayers, animaciones view(), impresión', ['T6', 'T11', 'T14'], script('wp10b/check.mjs'), { dist: true, base: true });
gate('a11y', 'ascii-a11y: axe 0 (3 perfiles), forced-colors, contraste, impresión, Tab, objetivos, zoom 200/400 %, controles negativos', ['T4', 'T11', 'T13', 'T14'], script('ascii-a11y.mjs', '--only', 'axe,forced,contrast,print,tab,zoom,selftest', '--shots', 'reports/ascii/wp11/a11y'), { dist: true });
gate('perf', 'ascii-perf: T12 con CPU ×4 y ×6 sobre la página viva (escritorio y móvil); el A07 físico sigue ABIERTO', ['T2', 'T12'], script('ascii-perf.mjs', '--out', 'reports/ascii/wp11/perf.json'), { dist: true });
gate('wells-real', 'tests/browser/wells.mjs sobre la página real: contraste ≥ 4,5:1 bajo los pozos en 12 scrolls y un fling', ['T7'], ['tests/browser/wells.mjs'], { dist: true, env: 'real' });
gate('lighthouse-routes', 'lighthouse-routes: WebGL2 · ?nogl · sin JS × ES/EN × móvil/escritorio, mediana de 3', ['T1'], script('lighthouse-routes.mjs', '--out', 'reports/ascii/wp11/lighthouse.json'), { dist: true, lh: true, fastSkip: true });

// El motor (tests/browser), una puerta por prueba: así un fallo dice qué prueba de §13 rompe. «lab»: necesita el laboratorio de desarrollo
// (`/lab/field/`); las demás usan el arnés empaquetado o construyen en una copia temporal.
const BT = {
  boot: ['T3 T10', 'arranque, estados live/still/off, ?nogl, movimiento reducido, saveData y parámetros de URL; 0 avisos y 0 peticiones externas', true],
  tide: ['T9', 'marea con rueda y toque reales: 1,4 s ± 0,1 y el último cartel llega en ≤ 1,6 s', true],
  resize: ['T13', 'cambios de ancho: re-medición de la celda, del presupuesto de celdas, de los carteles y de los pozos', true],
  context: ['T10', 'contexto WebGL perdido y restaurado; dispose() sin restos', true],
  inputs: ['T12', 'calor, anillos, energía de scroll y sueño (reloj falso, determinista)', true],
  wells: ['T7', 'contraste ≥ 4,5:1 bajo los pozos del laboratorio, 12 scrolls y un fling', true],
  lifecycle: ['T10 T12', 'pestaña oculta, menú, bfcache, contextos agotados, tier que solo baja, ráfagas de resize', true],
  parity: ['T10', 'el mismo fotograma por WebGL2 y por Canvas 2D', true],
  seams: ['T8', 'costuras de █ y │ a DPR 1–3 × cuerpos de 9–24 px', true],
  a11y: ['T4', 'axe sobre el laboratorio; el lienzo no aporta violaciones', true],
  size: ['T2', 'tamaño del JS del arnés (informativo)', false],
  'size-real': ['T2', 'JS de primera carga del arte en un build real (copia temporal) ≤ asciiFirstJsGz', false],
  perf: ['T12', 'coste por cuadro con CPU ×4 y ×6 sobre el arnés empaquetado', false],
  render2d: ['T10 T12', 'Canvas 2D de fotograma fijo con CPU ×4 y ×6: ninguna tarea > 50 ms', false],
  motion: ['T9', 'WCAG 2.2.2: nada se mueve solo más de 5 s; lo que provoca la persona termina solo', false],
  lighthouse: ['T1', 'Lighthouse del arnés (WebGL2, ?nogl, sin JS)', false],
  shots: ['', 'capturas del motor (sin comprobaciones)', false],
};
for (const name of browserTests) {
  const [t, title, lab] = BT[name] ?? ['', 'prueba del motor', true];
  gate(`bt-${name}`, `tests/browser/${name}: ${title}`, t.split(' ').filter(Boolean), ['tests/browser/run-all.mjs', name], { lab, long: name === 'tide', fastSkip: ['lighthouse', 'shots'].includes(name) });
}

// ── Mapa de T1–T22 ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// [id, qué mide, puertas automáticas, lo que queda a mano]
const TMAP = [
  ['T1', 'Lighthouse móvil, mediana de 3, 3 rutas', ['lighthouse-routes', ...(FAST ? [] : ['page-check-gallery', 'page-check-gallery-en', 'page-check-viewer']), 'bt-lighthouse'], 'repetir sobre https://gaya.com.do cuando el HTTPS esté emitido (--base)'],
  ['T2', 'Presupuestos de peso', ['budgets', 'perf', 'bt-size-real'], null],
  ['T3', 'Red y consola', ['guard', 'guard-matrix', 'bt-boot'], null],
  ['T4', 'axe (wcag2a/aa/22aa)', ['a11y', 'page-check-es', 'page-check-en', 'home-check', 'bt-a11y'], 'NVDA y TalkBack sobre portada, Índice y una ficha'],
  ['T5', 'Contraste por tokens y presupuesto de tono', ['contrast', 'tones', 'tones-spec', 'stills', 'sweep', 'unit-scenes'], null],
  ['T6', 'Paridad del póster SSR', ['unit-core', 'wp10b-check', 'home-nojs'], null],
  ['T7', 'Contraste por píxeles bajo los pozos', ['wells-real', 'bt-wells', 'home-media-es'], null],
  ['T8', 'Costuras', ['base-check', 'bt-seams'], null],
  ['T9', 'Fling y marea; nada se mueve solo > 5 s', ['bt-tide', 'bt-motion'], null],
  ['T10', 'Movimiento reducido, ahorro de datos y degradación', ['guard-matrix', 'bt-boot', 'bt-context', 'bt-lifecycle', 'bt-parity', 'bt-render2d', 'unit-scenes'], null],
  ['T11', 'forced-colors, contraste alto, impresión', ['a11y', 'home-media-es', 'home-media-en', 'base-check', 'wp10b-check'], null],
  ['T12', 'Rendimiento del motor (proxy CPU ×4/×6)', ['perf', 'bt-perf', 'bt-inputs', 'bt-lifecycle', 'bt-render2d'], 'PUERTA ABIERTA: Samsung A07 físico (bloqueante de M1)'],
  ['T13', 'Zoom 200/400 % y espaciado de texto', ['a11y', 'bt-resize'], null],
  ['T14', 'Teclado, foco y objetivos', ['a11y', 'home-check', 'wp10b-check'], null],
  ['T15', 'Prueba de los 5 segundos', [], 'MANUAL: 5 dueños de negocio dominicanos, Instagram en un Android modesto'],
  ['T16', 'Navegadores y WebViews', [], 'MANUAL: iPhone, Safari, Firefox, Instagram, TikTok, WhatsApp, Facebook'],
  ['T17', 'Lint de contenido', ['lint-content', 'lint-content-red', 'unit-core'], null],
  ['T18', 'Revisión visual del dueño', [], 'MANUAL: aprobación escrita por escena (hashes dorados «pendientes de aprobación»)'],
  ['T19', 'Regresión visual (hash por escena × idioma × variante)', ['stills', 'unit-scenes', 'words-pack', 'bluenoise', 'sweep'], null],
  ['T20', 'Datos estructurados y metadatos', ['meta', 'lint-content'], null],
  ['T21', 'Destellos (2.3.1)', ['unit-core'], 'MANUAL: PEAT (Trace Center) sobre la ignición, la marea y ON; en código solo corre la regla de diseño'],
  ['T22', 'Móvil de referencia 360×800', ['home-check', 'stills'], null],
];


// ── Utilidades ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const fmt = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)} min ${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')} s` : `${(ms / 1000).toFixed(1)} s`);
const line = (s = '') => console.log(s);
const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) {
      if (['node_modules', 'dist', '.astro', '.git', '.tmp', 'reports'].includes(n)) continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
};
const killTree = (pid) => {
  try {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    /* ya terminó */
  }
};

if (arg('list', false)) {
  for (const g of G) line(`${g.id.padEnd(22)} ${g.t.join(' ').padEnd(24)} ${g.lh ? '[Lighthouse] ' : ''}${g.title}`);
  process.exit(0);
}

mkdirSync(join(OUT, 'logs'), { recursive: true });
const t0 = Date.now();
const startedAt = new Date();
line(`check:ascii ${FAST ? '--fast (sin Lighthouse)' : '(completo, con Lighthouse)'} · Node ${process.versions.node} · ${startedAt.toISOString().slice(0, 19).replace('T', ' ')}`);
if (Number(process.versions.node.split('.')[0]) < 24) {
  line(`FALLA: hace falta Node >= 24 (hay ${process.versions.node}): las pruebas importan .ts directamente.`);
  process.exit(1);
}

// ── Prerrequisitos ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const notes = [];
const dist = join(ROOT, 'dist');
if (BUILD) {
  line('\n▶ npm run build');
  const r = spawnSync(NODE, [join(ROOT, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
  writeFileSync(join(OUT, 'logs', 'build.log'), (r.stdout ?? '') + (r.stderr ?? ''));
  if (r.status !== 0) {
    line(`FALLA: el build no terminó (registro en ${join(OUT, 'logs', 'build.log')})`);
    process.exit(1);
  }
}
const needDist = G.some((g) => g.dist && (!ONLY || ONLY.includes(g.id)) && !SKIP.includes(g.id));
let distOk = existsSync(join(dist, 'index.html'));
if (needDist && !distOk) notes.push('FALLA: no hay dist/index.html. Ejecuta «npm run build» (o usa --build).');
if (needDist && distOk) {
  const built = statSync(join(dist, 'index.html')).mtimeMs;
  const newer = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'public')), ...['astro.config.mjs', 'brand.json', 'package.json'].map((f) => join(ROOT, f))].filter((f) => existsSync(f) && statSync(f).mtimeMs > built);
  if (newer.length) {
    const msg = `dist/ es más viejo que ${newer.length} archivo(s) de src/ o public/ (p. ej. ${newer.slice(0, 3).map((f) => f.slice(ROOT.length + 1)).join(', ')}): ejecuta «npm run build» o usa --build; lo que se mide es el build anterior`;
    if (STRICT_DIST) {
      notes.push('FALLA: ' + msg);
      distOk = false;
    } else notes.push('AVISO: ' + msg);
  }
}
for (const n of notes) line(n);

// Servidor estático de dist/ (para las puertas que reciben una URL) y laboratorio de desarrollo (tests/browser)
let pages = null;
let pagesBase = null;
const startPages = async () => {
  if (pages || !existsSync(join(dist, 'index.html'))) return;
  pages = createPagesServer({ dir: dist });
  pagesBase = `http://127.0.0.1:${await listen(pages, 0)}`;
};
let lab = null;
async function startLab() {
  const dir = join(tmpdir(), 'gaya-lab');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of ['astro.config.mjs', 'package.json', 'tsconfig.json', 'brand.json']) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(dir, f));
  const skip = (p) => /[\\/](node_modules|dist|\.astro|\.git|\.tmp)([\\/]|$)/.test(p) || /public[\\/](ref|posters|ref-shared)([\\/]|$)/.test(p);
  cpSync(join(ROOT, 'src'), join(dir, 'src'), { recursive: true, filter: (p) => !skip(p) });
  cpSync(join(ROOT, 'public'), join(dir, 'public'), { recursive: true, filter: (p) => !skip(p) });
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'junction');
  const logFile = createWriteStream(join(OUT, 'logs', 'lab-dev-server.log'));
  const child = spawn(NODE, [join(dir, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(LAB_PORT), '--force'], { cwd: dir, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(logFile);
  child.stderr.pipe(logFile);
  const base = `http://127.0.0.1:${LAB_PORT}`;
  const t = Date.now();
  while (Date.now() - t < 120000) {
    if (child.exitCode !== null) throw new Error(`el servidor de laboratorio salió con código ${child.exitCode} (registro: logs/lab-dev-server.log)`);
    try {
      const r = await fetch(`${base}/lab/field/`);
      if (r.ok) return { base, close: () => killTree(child.pid), dir };
    } catch {
      /* todavía no escucha */
    }
    await new Promise((ok) => setTimeout(ok, 700));
  }
  killTree(child.pid);
  throw new Error('el servidor de laboratorio no respondió en 120 s');
}

// ── Ejecución ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const selected = G.filter((g) => (!ONLY || ONLY.includes(g.id)) && !SKIP.includes(g.id) && !(FAST && g.fastSkip));
const results = [];
const run = (g, extra = {}) =>
  new Promise((ok) => {
    const logPath = join(OUT, 'logs', `${g.id}.log`);
    const log = createWriteStream(logPath);
    const tail = [];
    const push = (chunk) => {
      const s = chunk.toString('utf8');
      log.write(s);
      if (VERBOSE) process.stdout.write(s);
      for (const l of s.split(/\r?\n/)) if (l.trim()) tail.push(l);
      if (tail.length > 400) tail.splice(0, tail.length - 400);
    };
    const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ASCII_FIRST_JS_GZ_KB: String(BUDGET.asciiFirstJsGz / 1024), HARNESS_PORT: '4362', REAL_PORT: '4363', ...extra.env };
    const args = [...g.args, ...(extra.args ?? [])];
    const child = spawn(NODE, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const limit = g.long ? 55 * 60000 : 20 * 60000;
    const timer = setTimeout(() => {
      push(`\n[check-ascii] TIEMPO AGOTADO (${fmt(limit)}): se mata la puerta\n`);
      killTree(child.pid);
    }, limit);
    child.stdout.on('data', push);
    child.stderr.on('data', push);
    const t = Date.now();
    child.on('close', (code) => {
      clearTimeout(timer);
      log.end();
      ok({ code: code ?? 1, ms: Date.now() - t, tail, logPath });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      push(String(e));
      ok({ code: 1, ms: Date.now() - t, tail, logPath });
    });
  });

line(`\n${selected.length} puertas · registros en ${OUT}${sep}logs\n`);
let n = 0;
for (const g of selected) {
  n++;
  const head = `[${String(n).padStart(2)}/${selected.length}] ${g.id.padEnd(21)} ${g.t.join(' ').padEnd(18)}`;
  const rec = { id: g.id, title: g.title, t: g.t, status: 'ok', ms: 0, detail: '', tail: [] };
  results.push(rec);
  if (g.dist && !distOk) {
    Object.assign(rec, { status: 'FALLA', detail: 'sin dist/ utilizable (ver el aviso de arriba)' });
    line(`${head} FALLA  ${rec.detail}`);
    continue;
  }
  const extra = { env: {}, args: [] };
  try {
    if (g.base || g.env === 'real') {
      await startPages();
      if (g.base) extra.args = ['--base', pagesBase];
      if (g.env === 'real') extra.env = { FIELD_URL: pagesBase, FIELD_PATH: '/' };
    }
    if (g.lab) {
      lab ??= await startLab();
      extra.env = { FIELD_URL: lab.base };
    }
  } catch (e) {
    Object.assign(rec, { status: 'FALLA', detail: `no se pudo preparar el entorno: ${e.message}` });
    line(`${head} FALLA  ${rec.detail}`);
    if (BAIL) break;
    continue;
  }
  process.stdout.write(`${head} … `);
  const r = await run(g, extra);
  rec.ms = r.ms;
  rec.tail = r.tail.slice(-40);
  rec.status = r.code === 0 ? 'ok' : 'FALLA';
  // la línea que resume la puerta: si falló, la primera que dice por qué; si pasó, la última que da la cuenta
  const summary = /✓|✗|pasa|verde|fallos?|comprobaciones|ABIERTA|combinaciones|presupuesto|puertas|pruebas|PASS|FAIL|tests \d+|# (pass|fail)|ℹ pass|ℹ fail/i;
  const reason = /^\s*(FALLA|FAIL)\b|✖|✗|AssertionError|Error:/;
  const last = (rec.status === 'ok' ? [...r.tail].reverse().find((l) => summary.test(l)) : r.tail.find((l) => reason.test(l))) ?? r.tail.at(-1) ?? '';
  rec.detail = last.trim().slice(0, 150);
  line(`${rec.status === 'ok' ? 'ok   ' : 'FALLA'} ${fmt(r.ms).padStart(9)}  ${rec.detail}`);
  if (rec.status !== 'ok') {
    const bad = r.tail.filter((l) => /FALLA|FAIL|✖|✗|Error|error:|fallo/i.test(l) && !/^\s*(ok|PASS)/.test(l)).slice(-8);
    for (const b of bad.length ? bad : r.tail.slice(-6)) line(`        ${b.trim().slice(0, 200)}`);
    if (BAIL) break;
  }
}
lab?.close();
pages?.close();

// ── Resumen ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const total = Date.now() - t0;
const failed = results.filter((r) => r.status !== 'ok');
const byId = Object.fromEntries(results.map((r) => [r.id, r]));
line('\n══════════ resumen ══════════');
for (const r of results) line(`${r.status === 'ok' ? 'ok   ' : 'FALLA'}  ${r.id.padEnd(22)} ${fmt(r.ms).padStart(9)}  ${r.t.join(' ')}`);

line('\n══════════ pruebas de DIRECTION §13 (T1–T22) ══════════');
// solo cuentan las puertas que existen y que este modo no deja fuera a propósito (--fast quita Lighthouse)
const defined = new Set(G.filter((g) => !(FAST && g.fastSkip)).map((g) => g.id));
const tRows = TMAP.map(([id, what, all, manual]) => {
  const gates = all.filter((x) => defined.has(x));
  const ran = gates.filter((x) => byId[x]);
  const bad = ran.filter((x) => byId[x].status !== 'ok');
  const missing = gates.filter((x) => !byId[x]);
  let state;
  if (!all.length) state = 'manual';
  else if (bad.length) state = 'FALLA';
  else if (!ran.length) state = 'no corrida';
  else if (missing.length) state = 'parcial';
  else state = manual ? 'ok + a mano' : 'ok';
  return { id, what, gates, ran, bad, missing, manual, state };
});
for (const r of tRows) line(`${r.id.padEnd(4)} ${r.state.padEnd(11)} ${r.what.padEnd(52)} ${r.gates.length ? r.gates.join(', ') : '—'}${r.bad.length ? '  ← FALLA: ' + r.bad.join(', ') : ''}${r.missing.length && r.ran.length ? '  (no corridas: ' + r.missing.join(', ') + ')' : ''}`);
line('\nA mano (no se pueden automatizar):');
for (const r of tRows.filter((x) => x.manual)) line(`  ${r.id}: ${r.manual}`);
if (FAST) line('  T1: esta corrida es --fast (sin Lighthouse): corre «npm run check:ascii» para la puerta completa.');

line(`\nTiempo total ${fmt(total)} · ${results.length - failed.length}/${results.length} puertas en verde${notes.length ? ' · ' + notes.length + ' aviso(s) de entorno' : ''}`);
if (failed.length) {
  line('\nPuertas que fallaron (con el final de su registro):');
  for (const r of failed) {
    line(`\n■ ${r.id} — ${r.title}`);
    for (const l of r.tail.slice(-12)) line(`    ${l.trim().slice(0, 220)}`);
    line(`    registro completo: ${join(OUT, 'logs', r.id + '.log')}`);
  }
}

// resumen en archivo (JSON y Markdown)
const stamp = startedAt.toISOString().slice(0, 19).replace('T', ' ');
writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ fecha: stamp, modo: FAST ? 'fast' : 'completo', node: process.versions.node, totalMs: total, avisos: notes, puertas: results.map(({ tail, ...r }) => r), t: tRows.map(({ id, what, state, gates, bad, manual }) => ({ id, what, state, gates, bad, manual })) }, null, 2));
const md = [
  `# check:ascii · ${FAST ? '--fast' : 'completo'} · ${stamp}`,
  '',
  `Node ${process.versions.node} · ${fmt(total)} · **${results.length - failed.length}/${results.length} puertas en verde**${failed.length ? ` · **fallan: ${failed.map((r) => r.id).join(', ')}**` : ''}`,
  ...(notes.length ? ['', ...notes.map((x) => `> ${x}`)] : []),
  '',
  '| puerta | estado | tiempo | pruebas | qué comprueba |',
  '|---|---|---:|---|---|',
  ...results.map((r) => `| ${r.id} | ${r.status} | ${fmt(r.ms)} | ${r.t.join(' ')} | ${r.title.replace(/\|/g, '/')} |`),
  '',
  '| prueba | estado | qué mide | puertas | a mano |',
  '|---|---|---|---|---|',
  ...tRows.map((r) => `| ${r.id} | ${r.state} | ${r.what} | ${r.gates.join(', ') || '—'} | ${r.manual ?? ''} |`),
  '',
].join('\n');
writeFileSync(join(OUT, 'summary.md'), md);
line(`\nResumen guardado en ${join(OUT, 'summary.md')} y summary.json`);
line(failed.length ? `\n✗ check:ascii: ${failed.length} puerta(s) con fallo` : `\n✓ check:ascii${FAST ? ' --fast' : ''}: todo en verde (a mano: T15, T16, T18, PEAT de T21 y el A07 de T12)`);
process.exit(failed.length ? 1 : 0);
