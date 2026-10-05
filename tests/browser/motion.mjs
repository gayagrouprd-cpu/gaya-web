// WCAG 2.2.2 (Pausar, detener, ocultar) · el arte NUNCA se mueve solo más de 5 s. Sobre el arnés empaquetado (el mismo motor y las escenas oficiales de producción):
//   · SOLO (sin tocar nada): la ignición dura 2,6 s y después el motor duerme: sin cuadros, sin rAF vivos y el lienzo idéntico píxel a píxel de los 6 s a los 12 s (no hay bucles de reposo);
//   · lo que provoca la persona (scroll, puntero, toque, foco) termina SOLO: tras parar el estímulo el arte se detiene en ≤ 5 s (marea 1,4 s + llegada + sueño de 1,6 s);
//   · con movimiento reducido o ahorro de datos no hay ni un cuadro animado.
// Mide con relojes de pared: con la máquina cargada repetir antes de dar por roto el motor.
import sharp from 'sharp';
import { TMP, check, finish, info, launchBrowser, open, ready, shotCanvas, sleep, state } from './lib.mjs';
import { serveHarness } from './harness.mjs';

const h = await serveHarness();
const browser = await launchBrowser();
const frames = (page) => page.evaluate(() => ({ f: window.__field?.frames ?? -1, sleeping: window.__field?.sleeping ?? null, raf: window.__raf.live.size, now: performance.now() }));

/** Muestrea cada 80 ms durante `ms` y devuelve el instante (relativo al inicio de la muestra) del último cuadro dibujado y si terminó dormido. */
async function watch(page, ms) {
  const t0 = (await frames(page)).now;
  let last = (await frames(page)).f;
  let lastAt = 0;
  let end = null;
  while (true) {
    await sleep(80);
    end = await frames(page);
    if (end.f !== last) {
      last = end.f;
      lastAt = end.now - t0;
    }
    if (end.now - t0 >= ms) break;
  }
  return { lastAt, end };
}

// ---------- SOLO: ignición y reposo ----------
{
  const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900 });
  await ready(s.page, { timeout: 30000 });
  const first = await frames(s.page);
  const { lastAt } = await watch(s.page, 7000);
  check('solo: la ignición termina y el motor duerme (último cuadro ≤ 3,2 s tras el primer fotograma: 2,6 s de ignición)', lastAt <= 3200, `último cuadro a los ${(lastAt / 1000).toFixed(2)} s del primer fotograma (cuadros ${first.f} → …)`);
  info(`ignición medida: ${(lastAt / 1000).toFixed(2)} s (límite WCAG 5 s; diseño 2,6 s)`);
  const a = `${TMP}/motion-a.png`;
  await shotCanvas(s.page, a);
  const f1 = await frames(s.page);
  await sleep(5000);
  const b = `${TMP}/motion-b.png`;
  await shotCanvas(s.page, b);
  const f2 = await frames(s.page);
  const A = await sharp(a).removeAlpha().raw().toBuffer();
  const B = await sharp(b).removeAlpha().raw().toBuffer();
  let diff = 0;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) diff++;
  check('solo: de los 7 s a los 12 s no se dibuja ni un cuadro y el lienzo es idéntico píxel a píxel', f1.f === f2.f && diff === 0 && f2.sleeping === true && f2.raf === 0, `cuadros ${f1.f} → ${f2.f}, píxeles distintos ${diff}, sleeping=${f2.sleeping}, rAF vivos ${f2.raf}`);
  check('solo: consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- lo que provoca la persona termina solo ----------
{
  const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900 });
  await ready(s.page, { timeout: 30000 });
  await watch(s.page, 3600);
  const max = await s.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const worst = [];
  // bajar cartel a cartel con la rueda y parar: el arte debe detenerse en ≤ 5 s tras el último estímulo
  for (const [name, y] of [['hola', 900], ['servicios', 1800], ['web', 3600], ['eco', 5400], ['final', max], ['volver a portada', 0]]) {
    const cur = await s.page.evaluate(() => scrollY);
    const steps = Math.max(1, Math.ceil(Math.abs(y - cur) / 300));
    for (let i = 0; i < steps; i++) {
      await s.page.mouse.wheel(0, (y - cur) / steps);
      await sleep(60);
    }
    const { lastAt } = await watch(s.page, 5600);
    const end = await frames(s.page);
    worst.push([name, lastAt]);
    check(`scroll hasta «${name}»: tras parar, el arte se detiene en ≤ 5 s y duerme (0 rAF)`, lastAt <= 5000 && end.sleeping === true && end.raf === 0, `último cuadro a los ${(lastAt / 1000).toFixed(2)} s · sleeping=${end.sleeping} · rAF ${end.raf}`);
  }
  info(`peor caso tras scroll: ${(Math.max(...worst.map((w) => w[1])) / 1000).toFixed(2)} s`);
  // puntero (calor) y toque (anillo)
  await s.page.mouse.move(400, 300);
  for (let i = 0; i < 12; i++) {
    await s.page.mouse.move(400 + i * 40, 300 + (i % 3) * 30);
    await sleep(40);
  }
  let r = await watch(s.page, 4200);
  check('puntero: el calor decae y el motor duerme ≤ 5 s después del último movimiento', r.lastAt <= 4000 && r.end.sleeping === true && r.end.raf === 0, `último cuadro a los ${(r.lastAt / 1000).toFixed(2)} s`);
  await s.page.mouse.click(700, 400);
  r = await watch(s.page, 3200);
  check('toque: el anillo dura 1,2 s y el motor duerme ≤ 5 s después', r.lastAt <= 3000 && r.end.sleeping === true && r.end.raf === 0, `último cuadro a los ${(r.lastAt / 1000).toFixed(2)} s`);
  check('consola limpia', s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}

// ---------- movimiento reducido y ahorro de datos ----------
for (const [name, opts] of [['prefers-reduced-motion', { reduced: true }], ['saveData', { saveData: true }]]) {
  const s = await open({ browser, base: h.base, path: '/', w: 1440, h: 900, ...opts });
  await ready(s.page, { timeout: 30000 });
  const { lastAt, end } = await watch(s.page, 3000);
  const st = await state(s.page);
  check(`${name}: fotograma fijo, ningún cuadro animado ni rAF vivo`, st.mode === 'still' && end.f === 0 && lastAt === 0 && end.raf === 0, `modo ${st.mode} · cuadros ${end.f} · rAF ${end.raf}`);
  await s.close();
}
await browser.close();
await h.close();
finish('WCAG 2.2.2 · el arte no se mueve solo más de 5 s');
