// Contexto WebGL perdido/restaurado (webglcontextlost con preventDefault → webglcontextrestored reconstruye; dos pérdidas → still 2D)
// y dispose() completo: sin listeners, sin rAF, sin lienzo ni sonda, sin estado global.
import { check, finish, info, launchBrowser, open, rafLive, ready, sleep, state } from './lib.mjs';

const browser = await launchBrowser();

// ---------- contexto perdido ----------
{
  const s = await open({ browser });
  await ready(s.page);
  await sleep(3200);
  let st = await state(s.page);
  check('contexto: arranca en live con WebGL2', st.mode === 'live' && st.renderer === 'gl');
  const lose = () => s.page.evaluate(() => { const g = document.querySelector('canvas.field').getContext('webgl2'); window.__ext = g.getExtension('WEBGL_lose_context'); window.__ext.loseContext(); return g.isContextLost(); });
  const restore = () => s.page.evaluate(() => window.__ext.restoreContext());
  check('contexto: se pierde', await lose());
  await sleep(300);
  st = await state(s.page);
  check('contexto perdido: el motor lo sabe y deja de dibujar (0 rAF)', st.ctxLost === true && (await rafLive(s.page)) === 0, `ctxLost=${st.ctxLost}`);
  await restore();
  await sleep(1200);
  st = await state(s.page);
  check('contexto restaurado: se reconstruye en WebGL2 y sigue en live', st.ctxLost === false && st.renderer === 'gl' && st.mode === 'live' && st.canvases === 1 && st.field === 'live', `${st.renderer}/${st.mode}/${st.field}/${st.canvases}`);
  await sleep(2000);
  check('contexto restaurado: vuelve a dormir', (await state(s.page)).sleeping === true);
  // segunda pérdida → modo fijo 2D (nunca un bucle lento)
  await lose();
  await sleep(300);
  await restore();
  await sleep(1500);
  st = await state(s.page);
  check('dos pérdidas: pasa a still con Canvas 2D', st.renderer === '2d' && st.mode === 'still' && st.field === 'still' && st.canvases === 1, `${st.renderer}/${st.mode}/${st.field}`);
  check('dos pérdidas: 0 rAF vivos y durmiendo', (await rafLive(s.page)) === 0 && st.sleeping === true);
  const px = await s.page.evaluate(() => document.querySelector('canvas.field').width);
  check('dos pérdidas: el lienzo 2D tiene tamaño (no quedó en blanco)', px > 0, `${px} px`);
  info(`consola durante las pérdidas: ${s.logs.length ? s.logs.join(' | ') : 'limpia'}`);
  check('contexto: sin errores de página (los avisos de Chrome al perder contexto a propósito se toleran)', !s.logs.some((l) => /^(pageerror|error)/.test(l)), s.logs.join(' | '));
  await s.close();
}

// ---------- dispose() ----------
{
  const s = await open({ browser, init: `window.addEventListener('load', () => { window.__base = window.__listeners(); window.__bodyKids = document.body.children.length; }, { once: true });` });
  await ready(s.page);
  await sleep(3200);
  const before = await state(s.page);
  check('dispose: el motor estaba montado', before.exists && before.mode === 'live');
  const res = await s.page.evaluate(async () => {
    const api = window.__fieldApi;
    api.dispose();
    await new Promise((r) => setTimeout(r, 400));
    const now = window.__listeners();
    const base = window.__base ?? {};
    const extra = {};
    const pw = /playwright|^window:(mouse|pointer|touch|click|auxclick|dblclick|contextmenu)[a-z]*:true$/; // los pone Playwright
    for (const [k, n] of Object.entries(now)) if (n > (base[k] ?? 0) && !pw.test(k)) extra[k] = n - (base[k] ?? 0);
    const c = document.querySelector('canvas.field');
    return {
      extra,
      raf: window.__raf.live.size,
      field: window.__field === undefined,
      attr: document.documentElement.dataset.field ?? null,
      canvasW: c ? c.width : null,
      fixedProbes: [...document.body.children].filter((e) => e.tagName === 'DIV' && getComputedStyle(e).position === 'fixed').length,
      kids: document.body.children.length,
      baseKids: window.__bodyKids,
    };
  });
  check('dispose: 0 listeners de más respecto al estado previo al motor', Object.keys(res.extra).length === 0, JSON.stringify(res.extra));
  check('dispose: 0 rAF vivos', res.raf === 0, String(res.raf));
  check('dispose: sin window.__field ni html[data-field]', res.field && res.attr === null, `${res.field}/${res.attr}`);
  check('dispose: el lienzo libera su memoria (width = 0) y no queda la sonda de lvh', res.canvasW === 0 && res.fixedProbes === 0, `width=${res.canvasW} sondas=${res.fixedProbes}`);
  // tras el dispose, ni el scroll ni el puntero ni el tamaño despiertan nada
  await s.page.evaluate(() => { scrollTo({ top: 1500, behavior: 'instant' }); dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10, pointerType: 'mouse' })); });
  await s.page.setViewportSize({ width: 1000, height: 700 });
  await sleep(600);
  check('dispose: después no hay rAF ni errores', (await rafLive(s.page)) === 0 && s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- varios montajes seguidos no acumulan nada ----------
{
  const s = await open({ browser, path: '/lab/field/', init: `window.addEventListener('load', () => { window.__base = window.__listeners(); }, { once: true });` });
  await ready(s.page);
  await sleep(2500);
  const out = await s.page.evaluate(async () => {
    const { mountField } = await import('/src/ascii/engine.ts');
    const base = window.__base;
    const posters = [...document.querySelectorAll('main [data-poster]')].map((el) => ({ id: el.dataset.poster, el }));
    window.__fieldApi.dispose();
    const counts = [];
    for (let i = 0; i < 4; i++) {
      const f = await mountField({ canvas: document.querySelector('canvas.field'), lang: 'es', posters, wells: () => [], params: new URLSearchParams('') });
      await new Promise((r) => setTimeout(r, 500));
      counts.push({ canvases: document.querySelectorAll('canvas.field').length, l: Object.values(window.__listeners()).reduce((a, n) => a + n, 0) });
      f.dispose();
    }
    const now = window.__listeners();
    const pw = /playwright|^window:(mouse|pointer|touch|click|auxclick|dblclick|contextmenu)[a-z]*:true$/;
    const extra = Object.entries(now).filter(([k, n]) => n > (base[k] ?? 0) && !pw.test(k));
    return { counts, extra, raf: window.__raf.live.size };
  });
  info(`4 montajes: ${out.counts.map((c) => `${c.canvases} lienzo, ${c.l} listeners`).join(' | ')}`);
  check('4 montajes y desmontajes: un solo lienzo cada vez, listeners constantes, 0 rAF al final', out.counts.every((c) => c.canvases === 1 && c.l === out.counts[0].l) && out.extra.length === 0 && out.raf === 0, JSON.stringify(out.extra));
  await s.close();
}

await browser.close();
finish('contexto perdido y dispose');
