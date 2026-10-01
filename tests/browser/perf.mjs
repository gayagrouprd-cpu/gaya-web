// T12 · rendimiento del motor con el PROXY de CPU ×4 y ×6 (Emulation.setCPUThrottlingRate) sobre el arnés empaquetado.
// ⚠ NO sustituye la puerta del Samsung A07 FÍSICO (T12 es bloqueante de M1): este informe la declara ABIERTA.
//   costP50 ≤ 6 ms · costP95 ≤ 12 ms (CPU por cuadro: escena + composición + pozos + subida) · el tier no baja ·
//   ninguna tarea > 50 ms tras el horneado · 1.er fotograma < 600 ms tras `load` · sleeping === true a los 2 s.
import { check, finish, info, launchBrowser, open, ready, sleep, state } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const RUN = `
window.__run = (opts) => new Promise((resolve) => {
  const { v, ms } = opts; const t0 = performance.now(); const y0 = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  const step = (now) => {
    const el = (now - t0) / 1000; let y = y0 + v * el; if (y > max) { y = max; }
    scrollTo({ top: y, behavior: 'instant' });
    if (now - t0 > ms || y >= max) return resolve(true);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});`;

const h = await serveHarness();
const browser = await launchBrowser();
const pct = (a, q) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * q))] : 0);

for (const rate of [4, 6]) {
  info(`──── CPU ×${rate} ────`);
  // ---------- arranque + reposo + ignición ----------
  const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900, cpu: rate, init: RUN });
  await ready(s.page, { timeout: 40000 });
  const nav = await s.page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { load: n.loadEventEnd, dcl: n.domContentLoadedEventEnd }; });
  let st = await state(s.page);
  const dFirst = st.firstFrameAt - nav.load;
  check(`×${rate}: primer fotograma < 600 ms tras load`, dFirst < 600, `${dFirst.toFixed(0)} ms (load ${nav.load.toFixed(0)}, primer fotograma ${st.firstFrameAt.toFixed(0)})`);
  await sleep(1500 * (rate / 4) + 2500); // ignición (2,6 s en tiempo real) y reposo
  st = await state(s.page);
  check(`×${rate}: ignición y reposo: costP50 ≤ 6 ms y costP95 ≤ 12 ms`, st.costP50 <= 6 && st.costP95 <= 12, `p50 ${st.costP50.toFixed(2)} · p95 ${st.costP95.toFixed(2)} ms en ${st.frames} cuadros`);
  check(`×${rate}: reposo: sleeping === true y 0 rAF`, st.sleeping === true && (await s.page.evaluate(() => window.__raf.live.size)) === 0, `sleeping=${st.sleeping}`);

  // ---------- scroll continuo 10 s a 420 px/s (una marea por cartel cruzado; a más de ≈ 450 px/s la marea espera a que el scroll afloje) ----------
  await s.page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(2500);
  const before = await state(s.page);
  await s.page.evaluate(() => window.__run({ v: 420, ms: 10000 }));
  st = await state(s.page);
  check(`×${rate}: scroll continuo 10 s: costP50 ≤ 6 ms y costP95 ≤ 12 ms`, st.costP50 <= 6 && st.costP95 <= 12, `p50 ${st.costP50.toFixed(2)} · p95 ${st.costP95.toFixed(2)} ms (${st.frames - before.frames} cuadros)`);
  check(`×${rate}: scroll continuo: el tier no baja (${before.tier})`, st.tier === before.tier, `${before.tier} → ${st.tier}`);
  await sleep(2600);
  check(`×${rate}: tras el scroll: sleeping === true a los 2 s`, (await state(s.page)).sleeping === true);

  // ---------- fling ----------
  await s.page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(3000);
  await s.page.evaluate(() => window.__run({ v: 2400, ms: 4000 }));
  await sleep(1800);
  st = await state(s.page);
  check(`×${rate}: fling de 2 400 px/s: costes dentro de presupuesto y tier sin bajar`, st.costP50 <= 6 && st.costP95 <= 12 && st.tier === before.tier, `p50 ${st.costP50.toFixed(2)} · p95 ${st.costP95.toFixed(2)} · tier ${st.tier}`);

  // ---------- tareas largas ----------
  const long = await s.page.evaluate(() => ({ ff: window.__field.firstFrameAt, long: window.__long }));
  const after = long.long.filter((e) => e.start >= long.ff);
  const pre = long.long.filter((e) => e.start < long.ff);
  check(`×${rate}: ninguna tarea > 50 ms tras el horneado (primer fotograma)`, after.length === 0, after.length ? after.map((e) => `${e.dur.toFixed(0)} ms @${e.start.toFixed(0)}`).join(', ') : `0 (antes del primer fotograma: ${pre.map((e) => e.dur.toFixed(0) + ' ms').join(', ') || 'ninguna'})`);
  check(`×${rate}: consola limpia`, s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}
await browser.close();
await h.close();
info('Puerta T12 sobre el Samsung A07 físico: ABIERTA (solo proxy CPU ×4/×6 de un PC con GPU de sobremesa).');
finish('T12 · rendimiento (proxy de CPU)');
