// Capturas del lienzo REAL (motor en vivo, Chrome real) para revisarlas a la vista: ignición, reposo y marea a mitad de camino,
// a 1440×900 y a 390×844, y el reposo a dpr fraccionario REAL (Windows 125 % / 150 %: celdas de 11×23 y 14×27 px SIN reescalar el lienzo).
// Salen en reports/ascii/wp5/. Las de la marea usan el reloj falso de Playwright (determinista).
import { OUT, check, finish, info, launchRealDsf, open, ready, shotCanvas, sleep, state } from './lib.mjs';

// reposo a dpr fraccionario (el arte debe verse nítido: 1 píxel del lienzo = 1 píxel de la pantalla)
for (const dpr of [1.25, 1.5]) {
  const rb = await launchRealDsf(dpr); // dpr REAL del navegador (zoom-for-dsf), no emulado
  const s = await open({ browser: rb, realDsf: true, wait: 'commit' });
  await ready(s.page);
  await s.page.waitForFunction(() => window.__field.sleeping === true, null, { timeout: 12000 });
  await shotCanvas(s.page, `${OUT}/win${Math.round(dpr * 100)}-rest-cover.png`);
  const st = await state(s.page);
  info(`dpr ${dpr}: ${st.cols}×${st.rows} celda ${JSON.stringify(st.cell)}`);
  check(`dpr ${dpr}: consola limpia`, s.logs.length === 0, s.logs.join(' | '));
  await s.close();
  await rb.close();
}

const VIEWS = [
  { name: 'desk', w: 1440, h: 900, dpr: 2, mobile: false },
  { name: 'mob', w: 390, h: 844, dpr: 3, mobile: true },
];

for (const v of VIEWS) {
  const s = await open({ w: v.w, h: v.h, dpr: v.dpr, mobile: v.mobile, wait: 'commit' });
  await ready(s.page);
  // ignición: se captura cuando p cruza 0,35 y 0,75 (la latencia de la captura añade unas décimas)
  for (const p of [0.12, 0.35, 0.75]) {
    await s.page.waitForFunction((x) => window.__field && window.__field.p >= x, p, { timeout: 8000 });
    await shotCanvas(s.page, `${OUT}/${v.name}-ignition-${Math.round(p * 100)}.png`);
  }
  await s.page.waitForFunction(() => window.__field.sleeping === true, null, { timeout: 8000 });
  await shotCanvas(s.page, `${OUT}/${v.name}-rest-cover.png`);
  await s.page.screenshot({ path: `${OUT}/${v.name}-rest-cover-text.png` });
  const st = await state(s.page);
  info(`${v.name}: ${st.cols}×${st.rows} celda ${JSON.stringify(st.cell)} ${st.variant} tier ${st.tier}`);

  // marea cover → hola con el reloj falso: 0,25 / 0,5 / 0,75 / final
  await s.page.clock.install();
  await s.page.clock.pauseAt(new Date(Date.now() + 1000));
  await s.page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(v.h * 0.78));
  await sleep(150); // el navegador despacha el evento `scroll` en tiempo real; hay que dejarlo llegar antes de avanzar el reloj falso
  await s.page.clock.runFor(40);
  let t = 0;
  for (const u of [0.25, 0.5, 0.75]) {
    const target = Math.round(u * 1400);
    await s.page.clock.runFor(target - t);
    t = target;
    const td = (await state(s.page)).tide;
    check(`${v.name}: marea a u ≈ ${u}`, td.active && Math.abs(td.u - u) < 0.1, `u=${td.u.toFixed(2)}`);
    await shotCanvas(s.page, `${OUT}/${v.name}-tide-${Math.round(u * 100)}.png`);
  }
  await s.page.clock.runFor(2600);
  await shotCanvas(s.page, `${OUT}/${v.name}-rest-hola.png`);
  await s.page.screenshot({ path: `${OUT}/${v.name}-rest-hola-text.png` });
  check(`${v.name}: consola limpia`, s.logs.length === 0, s.logs.join(' | '));
  await s.close();
}
await sleep(10);
finish('capturas del motor');
