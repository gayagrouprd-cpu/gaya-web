// Ciclo de vida: pestaña oculta, menú abierto (popover), pageshow/bfcache, fallo total de contextos (→ póster SSR), ?fps,
// control adaptativo (solo BAJA de tier; con el tier agotado → ssr) y ráfagas de resize sin carreras.
import { BASE, check, finish, info, launchBrowser, open, rafLive, ready, sleep, state } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const browser = await launchBrowser();

// ---------- pestaña oculta ----------
{
  const s = await open({ browser });
  await ready(s.page);
  await sleep(3200);
  await s.page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const f0 = (await state(s.page)).frames;
  await s.page.evaluate(() => { scrollBy({ top: 300, behavior: 'instant' }); });
  await sleep(700);
  let st = await state(s.page);
  check('pestaña oculta: no hay bucle aunque haya scroll (0 rAF, 0 cuadros nuevos)', (await rafLive(s.page)) === 0 && st.frames === f0, `frames ${f0} → ${st.frames}`);
  await s.page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(800);
  st = await state(s.page);
  check('pestaña visible de nuevo: retoma y vuelve a dormir', st.frames > f0, `frames ${f0} → ${st.frames}`);
  await sleep(2400);
  check('… y duerme', (await state(s.page)).sleeping === true);

  // menú abierto (popover): el bucle se pausa mientras esté abierto
  await s.page.evaluate(() => { const d = document.createElement('div'); d.id = 'menu'; d.setAttribute('popover', 'manual'); d.textContent = 'x'; document.body.append(d); d.showPopover(); });
  await sleep(200);
  const f1 = (await state(s.page)).frames;
  await s.page.evaluate(() => scrollBy({ top: 300, behavior: 'instant' }));
  await sleep(600);
  st = await state(s.page);
  check('menú abierto: sin bucle mientras el popover está abierto', st.frames === f1 && (await rafLive(s.page)) === 0, `frames ${f1} → ${st.frames}`);
  await s.page.evaluate(() => document.getElementById('menu').hidePopover());
  await sleep(700);
  st = await state(s.page);
  check('menú cerrado: retoma', st.frames > f1);

  // `html[data-menu="open"]` (lo pone nav.ts con o sin popover nativo): mismo efecto, y reacciona SIN evento `toggle` (MutationObserver)
  await s.page.evaluate(() => { document.documentElement.dataset.menu = 'open'; });
  await sleep(200);
  const f1b = (await state(s.page)).frames;
  await s.page.evaluate(() => scrollBy({ top: 300, behavior: 'instant' }));
  await sleep(600);
  st = await state(s.page);
  check('html[data-menu=open]: sin bucle mientras el menú está abierto', st.frames === f1b && (await rafLive(s.page)) === 0, `frames ${f1b} → ${st.frames}`);
  await s.page.evaluate(() => { delete document.documentElement.dataset.menu; });
  await sleep(700);
  st = await state(s.page);
  check('html[data-menu] retirado: retoma', st.frames > f1b, `frames ${f1b} → ${st.frames}`);

  // pageshow con persisted (bfcache): redibuja sin romperse
  const f2 = (await state(s.page)).frames;
  await sleep(2200);
  await s.page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await sleep(500);
  st = await state(s.page);
  check('pageshow persisted: redibuja (despierta y vuelve a dormir)', st.frames > f2, `frames ${f2} → ${st.frames}`);
  check('ciclo de vida: consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- sin ningún contexto (ni WebGL2 ni 2D) → póster SSR ----------
{
  const s = await open({ browser, init: `HTMLCanvasElement.prototype.getContext = function () { return null; };` });
  const st = await ready(s.page);
  check('sin contextos: data-field=ssr, sin motor (se muestra el póster)', st.field === 'ssr' && st.exists === false, `${st.field}`);
  check('sin contextos: consola sin errores', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- ?fps ----------
{
  const counts = {};
  for (const q of ['', '?fps=15']) {
    const s = await open({ browser, path: `/lab/field/${q}` });
    await ready(s.page);
    await sleep(3400);
    counts[q || 'defecto'] = (await state(s.page)).frames;
    await s.close();
  }
  info(`cuadros durante la ignición (2,6 s): ${JSON.stringify(counts)}`);
  check('30 fps por defecto (≈ 78 cuadros en 2,6 s de ignición) y ?fps=15 la mitad', counts.defecto >= 70 && counts.defecto <= 90 && counts['?fps=15'] >= 34 && counts['?fps=15'] <= 46, JSON.stringify(counts));
}

// ---------- control adaptativo: solo baja ----------
{
  const h = await serveHarness();
  const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900, cpu: 60 });
  await ready(s.page, { timeout: 60000 });
  const tiers = [];
  // con el scroll continuo el bucle no duerme: el coste medio por cuadro supera 0,45 × 33 ms y el tier baja paso a paso
  await s.page.evaluate(() => { window.__go = true; const step = () => { if (window.__go) { scrollBy({ top: 3, behavior: 'instant' }); if (scrollY > 8000) scrollTo({ top: 0, behavior: 'instant' }); requestAnimationFrame(step); } }; requestAnimationFrame(step); });
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const st = await state(s.page);
    if (!st.exists) { tiers.push('ssr'); break; }
    if (tiers.at(-1) !== st.tier) tiers.push(st.tier);
    if (st.field === 'ssr') { tiers.push('ssr'); break; }
  }
  await s.page.evaluate(() => { window.__go = false; });
  info(`tiers vistos con CPU ×60: ${tiers.join(' → ')}`);
  const order = ['high', 'mid', 'low', 'min', 'ssr'];
  const idx = tiers.map((t) => order.indexOf(t));
  check('adaptativo: baja de tier con la CPU ×60 (más de uno)', tiers.length >= 2, tiers.join(' → '));
  check('adaptativo: solo baja (monótono) y se queda en ssr si se agota', idx.every((v, i) => i === 0 || v > idx[i - 1]) && idx.every((v) => v >= 0), tiers.join(' → '));
  check('adaptativo: consola sin errores', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
  await h.close();
}

// ---------- ráfaga de resize ----------
{
  const s = await open({ browser });
  await ready(s.page);
  await sleep(3000);
  for (const [w, h] of [[1300, 800], [900, 700], [600, 900], [390, 844], [820, 1180], [1000, 700], [1440, 900]]) {
    await s.page.setViewportSize({ width: w, height: h });
    await sleep(30);
  }
  await sleep(1800);
  const st = await state(s.page);
  const ci = await s.page.evaluate(() => { const c = document.querySelector('canvas.field'); return { n: document.querySelectorAll('canvas.field').length, w: c.getBoundingClientRect().width, bw: c.width }; });
  check('ráfaga de 7 resizes: el estado final es el de 1440×900 (160×50), un lienzo, sin errores', st.cols === 160 && st.rows === 50 && ci.n === 1 && ci.bw === 1440 && st.field === 'live' && s.logs.length === 0, `${st.cols}×${st.rows} ${JSON.stringify(ci)} ${s.logs.join(' | ')}`);
  await sleep(2500);
  check('tras la ráfaga el motor vuelve a dormir', (await state(s.page)).sleeping === true);
  await s.close();
}

// ---------- solo raster por software (SwiftShader): el motor lo descarta y dibuja fijo con Canvas 2D ----------
{
  const soft = await launchBrowser({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-gl=angle'] });
  const s = await open({ browser: soft });
  const st = await ready(s.page);
  const gpu = await s.page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); if (!g) return 'sin WebGL2'; const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
  info(`renderizador de esta sesión: ${gpu}`);
  check('SwiftShader/llvmpipe: sin WebGL2 rápido → fotograma fijo con Canvas 2D (nunca bucle)', st.renderer === '2d' && st.mode === 'still' && st.field === 'still' && /swiftshader|sin WebGL2/i.test(gpu), `${st.renderer}/${st.mode} · ${gpu}`);
  await sleep(1500);
  check('SwiftShader: 0 rAF vivos y consola limpia', (await rafLive(s.page)) === 0 && s.logs.length === 0, s.logs.join(' | '));
  await s.close();
  await soft.close();
}

await browser.close();
void BASE;
finish('ciclo de vida, adaptación y carreras');
