// Entradas (DIRECTION §6.6): calor del puntero, anillos de toque y de foco, energía de scroll y sueño. Se monta el motor real con una
// escena SONDA que solo registra lo que el motor le pasa en cada `paint` (heat, rings, cap, e, p, t); así se prueba el motor, no una escena.
// DETERMINISTA: el reloj de la página es el falso de Playwright (`clock: true`). Tras montar el motor y dejarlo dormir se PAUSA y cada
// paso avanza el tiempo con `clock.runFor(ms)` (rAF a 16 ms, `performance.now` coherente): los tiempos son del motor, no del reloj de
// pared, así que no dependen de la carga de la máquina (con 30+ procesos de Chrome a la vez los sleeps reales dejaban de valer).
import { check, finish, info, launchBrowser, open, rafLive, ready, sleep, state } from './lib.mjs';

const browser = await launchBrowser();

const PROBE = `
window.__mountProbe = async (qs) => {
  const { mountField } = await import('/src/ascii/engine.ts');
  window.__fieldApi.dispose();
  const log = { frames: 0, heatMax: 0, heatNull: 0, rings: 0, ringMax: 0, e: 0, capSeen: false, lastP: 0, tSeen: new Set(), ringPos: null };
  const scene = {
    id: 'cover', dawn: 0, arrival: { ms: 600 },
    build: (spec) => ({ cls: new Uint8Array(spec.cols * spec.rows) }),
    paint(g, s, f) {
      g.u.fill(0); log.frames++; log.lastP = f.p; log.e = f.e; log.capSeen = f.cap !== null;
      if (f.heat) { let m = 0; for (let i = 0; i < f.heat.length; i++) if (f.heat[i] > m) { m = f.heat[i]; log.hotCell = i; } log.heatMax = m; } else { log.heatMax = 0; log.heatNull++; }
      log.rings = f.rings.length; log.ringMax = Math.max(log.ringMax, f.rings.length); if (f.rings[0]) log.ringPos = [f.rings[0].x, f.rings[0].y, f.rings[0].age];
    },
  };
  const posters = [...document.querySelectorAll('main [data-poster]')].map((el) => ({ id: el.dataset.poster, el }));
  const wells = () => [...document.querySelectorAll('[data-well]')].map((el) => { const b = el.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, kind: el.dataset.well }; });
  window.__probe = log;
  window.__f2 = await mountField({ canvas: document.querySelector('canvas.field'), lang: 'es', posters, wells, params: new URLSearchParams(qs || ''), loadScene: async () => scene });
  return true;
};`;

/** Monta la sonda y (con reloj falso) deja el tiempo PAUSADO con el motor dormido. */
async function probe(opts, qs = '') {
  const s = await open({ browser, init: PROBE, ...opts });
  await ready(s.page);
  await sleep(1200);
  await s.page.evaluate((qs) => window.__mountProbe(qs), qs);
  await sleep(3200); // ignición de 0,6 s y sueño (con el reloj falso fluye a ritmo real)
  if (opts.clock) await s.page.clock.pauseAt(new Date(Date.now() + 1000));
  return s;
}
/** Avanza el reloj de la página `ms` (tiempo del motor) y deja llegar los eventos pendientes. */
const tick = async (page, ms) => page.clock.runFor(ms);
const L = (page) => page.evaluate(() => ({ ...window.__probe, tSeen: undefined }));

// ---------- calor del puntero (ratón) ----------
{
  const s = await probe({ w: 1440, h: 900, clock: true });
  let st = await state(s.page);
  check('sonda: el motor está dormido antes de tocar nada', st.sleeping === true && (await rafLive(s.page)) === 0);
  const f0 = (await L(s.page)).frames;
  await s.page.mouse.move(720, 306); // celda (80, 17)
  await sleep(40); // deja llegar el evento al motor (tiempo real)
  await tick(s.page, 150);
  await s.page.mouse.move(724, 310);
  await sleep(40);
  await tick(s.page, 60);
  let l = await L(s.page);
  const c = l.hotCell !== undefined ? [l.hotCell % 160, Math.floor(l.hotCell / 160)] : null;
  check('calor: el puntero despierta el motor y el núcleo cae en su celda', l.frames > f0 && l.heatMax > 0.8 && c && Math.abs(c[0] - 80) <= 1 && Math.abs(c[1] - 17) <= 1, `frames +${l.frames - f0}, máx ${l.heatMax.toFixed(2)} en ${c}`);
  await tick(s.page, 900);
  l = await L(s.page);
  check('calor: decae (τ = 0,45 s): a los 0,9 s ya es < 50 %', l.heatMax < 0.5, `máx ${l.heatMax.toFixed(2)}`);
  await tick(s.page, 2600);
  l = await L(s.page);
  st = await state(s.page);
  check('calor: sin entrada, vuelve a null y el motor duerme (0 rAF) ≤ 2 s después', l.heatMax === 0 && st.sleeping === true && (await rafLive(s.page)) === 0, `heat ${l.heatMax} sleeping ${st.sleeping}`);
  check('los pozos llegan a la escena (cap ≠ null)', l.capSeen === true);
  check('consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- anillos: clic, toque, foco ----------
{
  const s = await probe({ w: 1440, h: 900, clock: true });
  await s.page.mouse.click(400, 500); // fuera de botones: anillo
  await sleep(40);
  await tick(s.page, 250);
  let l = await L(s.page);
  check('anillo: un clic en vacío lanza un anillo en su celda', l.rings === 1 && Math.abs(l.ringPos[0] - 400 / 9) < 1 && Math.abs(l.ringPos[1] - 500 / 18) < 1, JSON.stringify(l.ringPos));
  await tick(s.page, 600);
  l = await L(s.page);
  check('anillo: sigue vivo hacia el final de su vida', l.rings === 1 && l.ringPos[2] > 0.8 && l.ringPos[2] < 1.2, `${l.rings} (edad ${l.ringPos?.[2]?.toFixed(2)})`);
  // de 50 en 50 ms hasta que muera: la última edad vista con vida es la vida del anillo (§6.6: 1,2 s)
  let lastAge = 0;
  for (let i = 0; i < 20 && l.rings > 0; i++) {
    lastAge = l.ringPos[2];
    await tick(s.page, 50);
    l = await L(s.page);
  }
  check('anillo: muere a los 1,2 s (§6.6): última edad vista con vida entre 1,1 y 1,2 s', l.rings === 0 && lastAge > 1.1 && lastAge <= 1.2, `${l.rings} vivos, última edad ${lastAge.toFixed(3)} s`);
  // cinco clics rápidos: como mucho 3 vivos
  for (let i = 0; i < 5; i++) {
    await s.page.mouse.click(200 + i * 60, 400);
    await sleep(40);
    await tick(s.page, 40);
  }
  l = await L(s.page);
  check('anillos: nunca más de 3 vivos', l.ringMax <= 3 && l.ringMax === 3, `máx ${l.ringMax}`);
  await tick(s.page, 1800);
  // clic sobre un botón: sin anillo de puntero (el foco lo hace solo si es de teclado)
  const before = (await L(s.page)).ringMax;
  const btn = await s.page.locator('a.btn').first().boundingBox();
  await s.page.evaluate(() => { window.__probe.ringMax = 0; });
  await s.page.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2);
  await sleep(40);
  await tick(s.page, 250);
  l = await L(s.page);
  check('anillo: un clic con el ratón sobre un botón no duplica (sin :focus-visible)', l.ringMax === 0, `máx ${l.ringMax} (antes ${before})`);
  // teclado: Tab → focusin con :focus-visible → anillo desde el centro del elemento
  await s.page.evaluate(() => { document.activeElement?.blur(); window.__probe.ringMax = 0; window.__probe.rings = 0; });
  await s.page.keyboard.press('Tab');
  await sleep(40);
  await tick(s.page, 250);
  l = await L(s.page);
  const el = await s.page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); return { tag: document.activeElement.tagName, cx: (b.left + b.width / 2) / 9, cy: (b.top + b.height / 2) / 18 }; });
  check('foco: Tab enfoca un enlace/botón y lanza un anillo desde su centro', l.ringMax >= 1 && Math.abs(l.ringPos[0] - el.cx) < 1 && Math.abs(l.ringPos[1] - el.cy) < 1, `${el.tag} centro (${el.cx.toFixed(1)}, ${el.cy.toFixed(1)}) anillo ${JSON.stringify(l.ringPos)}`);
  await s.close();
}

// ---------- toque (móvil) ----------
{
  const s = await probe({ w: 390, h: 844, dpr: 3, mobile: true, clock: true });
  await s.page.touchscreen.tap(195, 500);
  await sleep(40);
  await tick(s.page, 250);
  let l = await L(s.page);
  check('toque: un toque lanza un anillo (pointerdown pasivo) en la celda tocada', l.ringMax >= 1 && Math.abs(l.ringPos[0] - 195 / 6) < 1 && Math.abs(l.ringPos[1] - 500 / 12) < 1, JSON.stringify(l.ringPos));
  check('toque: no hay calor (el puntero táctil no lo produce)', l.heatMax === 0, String(l.heatMax));
  check('toque: el gesto no queda bloqueado (touch-action intacto)', await s.page.evaluate(() => getComputedStyle(document.querySelector('canvas.field')).touchAction === 'auto' && getComputedStyle(document.body).touchAction === 'auto'));
  await s.close();
}

// ---------- energía de scroll ----------
{
  const s = await probe({ w: 1440, h: 900, clock: true });
  // 2 400 px/s con el reloj falso: cada cuadro de 34 ms avanza 80 px
  for (let i = 1; i <= 12; i++) {
    await s.page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), i * 80);
    await sleep(25); // el evento `scroll` llega en tiempo real
    await tick(s.page, 34);
  }
  const l = await L(s.page);
  check('energía: un scroll a 2 400 px/s sube e a ≈ 1 (e = min(1, v/2400))', l.e > 0.8, `e = ${l.e.toFixed(2)}`);
  await tick(s.page, 2600);
  const l2 = await L(s.page);
  const st = await state(s.page);
  check('energía: al parar, el motor duerme a los ≈ 1,6 s (sueño real, 0 rAF)', st.sleeping === true && (await rafLive(s.page)) === 0, `e en el último cuadro ${l2.e.toFixed(2)}`);
  await s.close();
}

// ---------- movimiento reducido: sin calor, anillos ni energía (tiempo real: el modo fijo no tiene bucle) ----------
{
  const s = await probe({ w: 1440, h: 900, reduced: true });
  const f0 = (await L(s.page)).frames;
  await s.page.mouse.move(700, 300);
  await s.page.mouse.click(500, 500);
  await s.page.evaluate(() => scrollBy({ top: 40, behavior: 'instant' }));
  await sleep(600);
  const l = await L(s.page);
  const st = await state(s.page);
  check('reduced-motion: ni calor ni anillos ni bucle (modo fijo)', l.heatMax === 0 && l.ringMax === 0 && st.mode === 'still' && (await rafLive(s.page)) === 0, `heat ${l.heatMax} rings ${l.ringMax} mode ${st.mode}`);
  info(`fotogramas fijos dibujados por los eventos: ${l.frames - f0}`);
  check('reduced-motion: consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

await browser.close();
finish('entradas: calor, anillos, energía y sueño');
