// Canvas 2D de fotograma fijo (movimiento reducido, `?nogl`, WebGL por software; DIRECTION §6.10) con CPU estrangulada sobre el arnés empaquetado:
//   · en FRÍO (primer dibujo, tonos por hornear) con CPU ×6: ninguna tarea > 50 ms (el dibujo se parte en trozos de ≈ 4,5 ms de reloj de pared) y cada trozo ≤ 12 ms;
//   · en CALIENTE con CPU ×4: cada trozo del dibujo de un cartel nuevo ≤ 6 ms (el fotograma entero cuesta ≈ 1,5 ms a ×1 y se informa su suma).
// El coste por cuadro de la ruta viva (WebGL) lo mide perf.mjs.
import { check, finish, info, launchBrowser, open, ready, sleep, state } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const h = await serveHarness();
const browser = await launchBrowser();
for (const [rate, coldMax, hotMax] of [[4, 8, 6], [6, 12, 12]]) {
  const s = await open({ browser, base: h.base, path: '/?nogl', w: 1440, h: 900, cpu: rate });
  const st0 = await ready(s.page, { timeout: 60000 });
  await sleep(1500);
  const st = await state(s.page);
  const long = await s.page.evaluate(() => window.__long.map((e) => e.dur));
  check(`×${rate}: renderizador 2D de fotograma fijo (sin bucle)`, st0.field === 'still' && st.renderer === '2d' && st.sleeping === true, `${st.field}/${st.renderer}/sleeping=${st.sleeping}`);
  const cold = st.chunks;
  check(`×${rate}: en frío ninguna tarea > 50 ms y cada trozo ≤ ${coldMax} ms`, long.every((d) => d < 50) && cold.length > 0 && Math.max(...cold) <= coldMax, `trozos ${cold.map((c) => c.toFixed(1)).join(' + ')} ms · tareas largas: ${long.length ? long.map((d) => d.toFixed(0)).join(', ') : 'ninguna'}`);
  // en caliente: un cartel nuevo cada vez
  const worst = [];
  const sums = [];
  for (let k = 1; k <= 9; k++) {
    await s.page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), k * 900);
    await sleep(750);
    const c = (await state(s.page)).chunks;
    worst.push(Math.max(...c));
    sums.push(c.reduce((a, b) => a + b, 0));
  }
  sums.sort((a, b) => a - b);
  check(`×${rate}: en caliente cada trozo del dibujo de un cartel ≤ ${hotMax} ms (9 carteles)`, Math.max(...worst) <= hotMax, `peor trozo ${Math.max(...worst).toFixed(1)} ms · fotograma entero p50 ${sums[4].toFixed(1)} ms, máx ${sums[8].toFixed(1)} ms`);
  const long2 = await s.page.evaluate(() => window.__long.map((e) => e.dur));
  check(`×${rate}: ninguna tarea > 50 ms en toda la sesión y consola limpia`, long2.every((d) => d < 50) && s.logs.length === 0, `${long2.length} tareas largas · ${s.logs.join(' | ')}`);
  await s.close();
}
await browser.close();
await h.close();
info('el dibujo en frío con CPU ×6 y en caliente con ×4 se mide sobre el arnés empaquetado (esbuild); el A07 físico sigue pendiente (T12)');
finish('Canvas 2D de fotograma fijo (frío ×6 · caliente ×4)');
