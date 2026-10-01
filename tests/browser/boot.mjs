// T3 + T10 · arranque, estados (live / still / off), ?nogl, movimiento reducido, ahorro de datos, parámetros de URL.
// Consola sin errores ni avisos y 0 peticiones a otro origen en todos los escenarios; 0 rAF vivos y `sleeping` en los estados fijos.
import { pathToFileURL } from 'node:url';
import { ROOT, check, finish, info, launchBrowser, open, rafLive, ready, sleep, state, untilSleeping } from './lib.mjs';

const browser = await launchBrowser();

/** Abre un escenario, espera al estado final y comprueba lo común (consola, red). */
async function run(name, path, opts, settleMs = 3500) {
  const s = await open({ path, browser, ...opts });
  const st = await ready(s.page);
  await sleep(settleMs);
  const fin = await state(s.page);
  check(`${name}: consola sin errores ni avisos`, s.logs.length === 0, s.logs.join(' | '));
  check(`${name}: 0 peticiones a otro origen`, s.external.length === 0, s.external.join(' '));
  return { s, st, fin };
}

// ---------- live ----------
for (const [lang, path] of [['es', '/lab/field/'], ['en', '/lab/field-en/']]) {
  const { s, fin } = await run(`live ${lang}`, path, {});
  check(`live ${lang}: data-field=live, WebGL2, un solo lienzo`, fin.field === 'live' && fin.mode === 'live' && fin.renderer === 'gl' && fin.canvases === 1, `${fin.field}/${fin.renderer}/${fin.canvases}`);
  check(`live ${lang}: fuente Geist Mono cargada (length > 0)`, fin.fontOk === true);
  check(`live ${lang}: dibujó cuadros y luego duerme (0 rAF)`, fin.frames > 10 && fin.sleeping === true && (await rafLive(s.page)) === 0, `frames=${fin.frames} raf=${await rafLive(s.page)}`);
  const lang2 = await s.page.evaluate(() => document.documentElement.lang);
  check(`live ${lang}: el idioma de la página llega al motor`, lang2 === lang, lang2);
  await s.close();
}

// ---------- still: ?still, ?nogl, reducido, ahorro de datos ----------
const stills = [
  ['?still', '/lab/field/?still', {}, 'gl'],
  ['?nogl (2D fijo)', '/lab/field/?nogl', {}, '2d'],
  ['reduced-motion', '/lab/field/', { reduced: true }, 'gl'],
  ['saveData', '/lab/field/', { saveData: true }, 'gl'],
  ['reduced-motion + ?nogl', '/lab/field/?nogl', { reduced: true }, '2d'],
];
for (const [name0, path0, opts, renderer] of stills.flatMap((x) => [x, [`${x[0]} (en)`, x[1].replace('/lab/field/', '/lab/field-en/'), x[2], x[3]]])) {
  const name = name0;
  const path = path0;
  const { s, fin } = await run(name, path, opts, 2500);
  check(`${name}: modo still con ${renderer}`, fin.field === 'still' && fin.mode === 'still' && fin.renderer === renderer, `${fin.field}/${fin.mode}/${fin.renderer}`);
  const total = await s.page.evaluate(() => window.__raf.total);
  await sleep(1500);
  const total2 = await s.page.evaluate(() => window.__raf.total);
  check(`${name}: 0 rAF vivos tras el primer fotograma y sleeping === true`, (await rafLive(s.page)) === 0 && fin.sleeping === true && total2 === total, `live=${await rafLive(s.page)} total ${total}→${total2}`);
  check(`${name}: sin bucle (frames === 0)`, fin.frames === 0);
  await s.close();
}

// ---------- reacción EN VIVO a prefers-reduced-motion ----------
{
  const s = await open({ browser });
  await ready(s.page);
  await sleep(3200);
  check('reduced en vivo: empieza en live', (await state(s.page)).mode === 'live');
  await s.page.emulateMedia({ reducedMotion: 'reduce' });
  await sleep(600);
  let st = await state(s.page);
  check('reduced en vivo: pasa a still sin recargar', st.mode === 'still' && st.field === 'still' && st.sleeping === true && (await rafLive(s.page)) === 0, `${st.mode}/${st.field}`);
  await s.page.emulateMedia({ reducedMotion: 'no-preference' });
  await sleep(600);
  st = await state(s.page);
  check('reduced en vivo: vuelve a live', st.mode === 'live' && st.field === 'live', `${st.mode}/${st.field}`);
  await sleep(2500);
  check('reduced en vivo: y vuelve a dormir', (await state(s.page)).sleeping === true);
  check('reduced en vivo: consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- off: forced-colors, ?poster, menos de 52 columnas ----------
{
  const s = await open({ browser, forced: true });
  const st = await ready(s.page);
  const disp = await s.page.evaluate(() => getComputedStyle(document.querySelector('canvas.field')).display);
  check('forced-colors: modo off y lienzo oculto', st.field === 'off' && disp === 'none', `${st.field}/${disp}`);
  await s.close();
}
{
  const s = await open({ path: '/lab/field/?poster', browser });
  const st = await ready(s.page);
  check('?poster: solo el póster SSR (data-field=ssr, sin motor)', st.field === 'ssr' && st.exists === false, st.field);
  await s.close();
}
{
  const s = await open({ browser, w: 300, h: 600 });
  const st = await ready(s.page);
  check('< 52 columnas (300 px): el lienzo se oculta (off)', st.field === 'off' && st.mode === 'off', `${st.field}/${st.mode}/${st.cols}`);
  await s.page.setViewportSize({ width: 600, height: 800 });
  await sleep(900);
  const st2 = await state(s.page);
  check('< 52 columnas: al ensanchar vuelve a montarse', st2.field !== 'off' && st2.cols >= 52, `${st2.field}/${st2.cols}`);
  await s.close();
}

// ---------- parámetros ----------
{
  const s = await open({ path: '/lab/field/?tier=low&fps=20', browser });
  await ready(s.page);
  await sleep(1500);
  const st = await state(s.page);
  check('?tier=low: tier low, celdas ≤ 4 800 y dpr ≤ 1,5', st.tier === 'low' && st.cols * st.rows <= 4800 && st.cell.dpr <= 1.5, `${st.tier} ${st.cols}×${st.rows} dpr ${st.cell.dpr}`);
  info(`?tier=low en 1440×900: celda CSS ${st.cell.cssCw}×${st.cell.cssCh}`);
  await s.close();
}
{
  const s = await open({ browser, w: 390, h: 844, dpr: 3, mobile: true });
  await ready(s.page);
  await sleep(3500);
  const st = await state(s.page);
  check('móvil 390×844 @3: tier low, celda 6×12, palabra en pila (variante S)', st.tier === 'low' && st.cell.cssCw === 6 && st.cell.cssCh === 12 && st.variant === 'S' && st.cell.dpr === 1.5, `${st.tier} ${st.cols}×${st.rows} ${JSON.stringify(st.cell)} ${st.variant}`);
  check('móvil: consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}
{
  // `?still&poster=<id>&p=<0..1>`: un cartel a un p (capturas y regresión), determinista
  const hashes = [];
  for (let i = 0; i < 2; i++) {
    const s = await open({ path: '/lab/field/?still&poster=hola&p=0.5', browser });
    await ready(s.page);
    await sleep(300);
    const st = await state(s.page);
    hashes.push(await s.page.evaluate(() => window.__field.hash()));
    if (i === 0) check('?still&poster=hola&p=0.5: dibuja ese cartel a ese p', st.mode === 'still' && Math.abs(st.p - 0.5) < 1e-9 && st.variant !== '', `p=${st.p} variante ${st.variant}`);
    await s.close();
  }
  check('?still&poster=…: el mismo fotograma en dos cargas', hashes[0] === hashes[1], hashes.join(' / '));
}

// ---------- lo vivo y lo fijo coinciden: el reposo tras la ignición es el mismo fotograma que el still ----------
{
  const hs = [];
  for (const path of ['/lab/field/', '/lab/field/?still']) {
    const s = await open({ path, browser, w: 1440, h: 900 });
    await ready(s.page);
    await sleep(4000);
    hs.push(await s.page.evaluate(() => window.__field.hash()));
    await s.close();
  }
  check('CA-1: el reposo vivo tras la ignición = el still (mismo hash, pozos incluidos)', hs[0] === hs[1], hs.join(' / '));
}

// ---------- el still del motor = el fotograma de Node (hash dorado) ----------
{
  const [{ renderStill }, { cover }, words, { gridSpec }, { hashCells }] = await Promise.all([
    import(pathToFileURL(`${ROOT}/src/ascii/ssr.ts`).href),
    import(pathToFileURL(`${ROOT}/src/ascii/scenes/cover.ts`).href),
    import(pathToFileURL(`${ROOT}/src/ascii/words.ts`).href),
    import(pathToFileURL(`${ROOT}/src/ascii/scenes/common.ts`).href),
    import(pathToFileURL(`${ROOT}/src/ascii/grid.ts`).href),
  ]);
  await words.loadWords('es', ['GAYA']);
  for (const [name, w, h, dpr, mobile] of [['escritorio 1440×900', 1440, 900, 2, false], ['móvil 390×844', 390, 844, 3, true]]) {
    const s = await open({ path: '/lab/field/?still&poster=cover', browser, w, h, dpr, mobile });
    await ready(s.page);
    await sleep(400);
    const st = await state(s.page);
    const browserHash = await s.page.evaluate(() => window.__field.hash());
    const spec = gridSpec(st.cols, st.rows, st.cell.cssCw, st.cell.cssCh, st.cell.dpr);
    const set = words.getWords('GAYA', 'es', st.cols, Math.max(12, Math.floor(st.rows * 0.6)));
    const nodeHash = hashCells(renderStill(cover, spec, 'es', [set]));
    check(`still de cover (${name}) = fotograma de Node, bit a bit`, browserHash === nodeHash, `${browserHash} / ${nodeHash} (${st.cols}×${st.rows}, ${st.variant})`);
    await s.close();
  }
}

await browser.close();
finish('T3/T10 · arranque y estados');
void untilSleeping;
