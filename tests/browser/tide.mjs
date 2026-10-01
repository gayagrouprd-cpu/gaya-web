// T9 · Fling y marea (CA-2, MA-4): la marea corre POR TIEMPO. Un fling de 2 400 px/s y un scroll lento de 300 px/s por toda la
// página dan mareas de 1,4 s ± 0,1; nunca queda el frente detenido a mitad; el último cartel llega pronto tras parar.
import { check, finish, info, open, ready, sleep, state } from './lib.mjs';

/** Corre un scroll a velocidad constante y muestrea el motor en cada cuadro del navegador. */
const SCROLL_RUN = `
window.__run = (opts) => new Promise((resolve) => {
  const { v, y0, y1, tail, stopWhen } = opts;
  const S = [];
  const t0 = performance.now();
  scrollTo({ top: y0, behavior: 'instant' });
  let stopT = null;
  const dir = Math.sign(y1 - y0);
  const step = (now) => {
    const f = window.__field;
    const el = (now - t0) / 1000;
    let y = y0 + dir * v * el;
    let done = Math.abs(y - y0) >= Math.abs(y1 - y0);
    if (stopWhen === 'tide' && f.tide.active && stopT === null) done = true; // para el scroll en cuanto empieza la marea
    if (done) y = stopWhen === 'tide' ? scrollY : y1;
    if (stopT === null) scrollTo({ top: y, behavior: 'instant' });
    if (done && stopT === null) stopT = now;
    S.push([now, scrollY, f.tide.active ? 1 : 0, f.tide.u, f.tide.from, f.tide.to, f.cur, f.target, f.p, f.frames]);
    if (stopT !== null && now - stopT > tail) return resolve({ S, stopT });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
`;

/** Tramos de marea: muestras consecutivas con active = 1 y el mismo par (from, to). */
function tides(S) {
  const out = [];
  let cur = null;
  for (let i = 0; i < S.length; i++) {
    const [t, , act, , from, to] = S[i];
    if (act && cur && cur.from === from && cur.to === to) {
      cur.end = t;
      cur.n++;
    } else {
      if (cur) cur.closedAt = t;
      cur = act ? { from, to, start: t, end: t, n: 1 } : null;
      if (cur) out.push(cur);
    }
  }
  // la duración es desde el primer cuadro activo hasta el primer cuadro que ya no lo es (±1 cuadro de muestreo)
  for (const d of out) d.ms = (d.closedAt ?? d.end) - d.start;
  return out;
}

// ---------- gestos REALES del compositor (CDP Input.synthesizeScrollGesture, rueda) a velocidades intermedias ----------
// Con `scrollTo` por rAF la velocidad es constante y exacta; con gestos reales hay aceleración, inercia y rachas. Lo que importa (T9):
// la marea dura 1,4 s ± 0,1 siempre y el último cartel llega ≤ 1,6 s tras parar, a CUALQUIER velocidad (incluidas las que antes apilaban mareas).
const REC = `
window.__rec = (() => {
  const S = [];
  let on = true;
  const step = (now) => { const f = window.__field; S.push([now, scrollY, f.tide.active ? 1 : 0, f.tide.from, f.tide.to, f.cur, f.target]); if (on) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  return { stop: () => { on = false; return S; } };
})();
`;
/** Vuelve al primer cartel, registra el motor en cada cuadro mientras corre `act` y analiza mareas y llegada. */
async function record(page, act, tail = 4500) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(3000); // vuelve al primer cartel, marea incluida, y duerme
  await page.evaluate(REC);
  await act();
  await sleep(tail);
  const S = await page.evaluate(() => window.__rec.stop());
  // el instante en que el scroll dejó de moverse (último cambio de scrollY)
  let stopI = 0;
  for (let i = 1; i < S.length; i++) if (Math.abs(S[i][1] - S[i - 1][1]) > 0.5) stopI = i;
  const stopT = S[stopI][0];
  const moved = S[stopI][1] - S[0][1];
  const ts = [];
  let cur = null;
  for (const r of S) {
    if (r[2] && cur && cur.from === r[3] && cur.to === r[4]) cur.end = r[0];
    else {
      if (cur) cur.closed = r[0];
      cur = r[2] ? { from: r[3], to: r[4], start: r[0], end: r[0] } : null;
      if (cur) ts.push(cur);
    }
  }
  for (const d of ts) d.ms = (d.closed ?? d.end) - d.start;
  const fin = S.at(-1);
  const arrive = S.find((r) => r[0] >= stopT && !r[2] && r[5] === r[6] && r[6] === fin[6]);
  return { ts, moved, arrive: arrive ? arrive[0] - stopT : null, fin, target: fin[6] };
}
const gesture = (page, cdp, { v, dist, x = 720, y = 450 }) => record(page, () => cdp.send('Input.synthesizeScrollGesture', { x, y, yDistance: -dist, speed: v, gestureSourceType: 'mouse' }));

/** Un roce táctil REAL (CDP Input.dispatchTouchEvent): `step` px cada `dt` ms durante `n` movimientos y se suelta (la inercia la pone el compositor). */
async function flick(cdp, { x = 195, y0 = 760, step, n, dt = 16 }) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  let y = y0;
  for (let i = 0; i < n; i++) {
    y -= step;
    await sleep(dt);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function touchSection() {
  const s3 = await open({ w: 390, h: 844, dpr: 3, mobile: true, instrument: true });
  await ready(s3.page);
  await sleep(3000);
  // nombre, roces (n × step px cada 16 ms), pausa entre roces (ms)
  const CASES = [
    ['arrastre lento (≈ 500 px/s, sin inercia)', { step: 8, n: 60 }, 1, 0],
    ['roce medio (≈ 1 250 px/s, con inercia)', { step: 20, n: 10 }, 1, 0],
    ['roce fuerte (≈ 3 750 px/s, con inercia)', { step: 60, n: 8 }, 1, 0],
    ['cinco roces fuertes seguidos (cada 700 ms)', { step: 50, n: 8 }, 5, 700],
    ['ocho roces medios seguidos (cada 500 ms)', { step: 25, n: 10 }, 8, 500],
  ];
  for (const [name, f, reps, gap] of CASES) {
    const g = await record(s3.page, async () => {
      for (let i = 0; i < reps; i++) {
        await flick(s3.cdp, f);
        if (gap) await sleep(gap);
      }
    }, 5500);
    const durs = g.ts.map((d) => d.ms.toFixed(0)).join('/');
    info(`toque · ${name}: ${g.moved.toFixed(0)} px, ${g.ts.length} marea(s) [${durs}] · último cartel ${g.fin[5]}/${g.fin[6]} llega ${g.arrive === null ? 'NUNCA' : g.arrive.toFixed(0) + ' ms'} tras parar`);
    check(`toque · ${name}: hubo scroll real`, g.moved > 300, `${g.moved.toFixed(0)} px`);
    check(`toque · ${name}: cada marea dura 1,4 s ± 0,1 y el último cartel llega a su objetivo`, g.ts.length > 0 && g.ts.every((d) => Math.abs(d.ms - 1400) <= 100) && g.fin[5] === g.fin[6], durs);
    check(`toque · ${name}: el último cartel llega ≤ 1,6 s tras parar`, g.arrive !== null && g.arrive <= 1600, g.arrive === null ? 'nunca' : `${g.arrive.toFixed(0)} ms`);
  }
  check('toque: consola limpia', s3.logs.length === 0, s3.logs.join(' | '));
  await s3.close();
}

async function wheelSection() {
  const s2 = await open({ w: 1440, h: 900, instrument: true });
  await ready(s2.page);
  await sleep(3000);
  // la llegada tras parar depende de la FASE en que se para (con una marea recién empezada es el peor caso): se barren varias distancias
  const speeds = (process.env.T9_SPEEDS ?? '250,450,500,600,900,1300,1800,2400,3600').split(',').map(Number);
  for (const v of speeds) {
    const dists = process.env.T9_DIST ? process.env.T9_DIST.split(',').map(Number) : v >= 450 && v <= 1300 ? [3300, 3900, 4400, 4900, 5500] : [4400];
    let worst = 0;
    let bad = '';
    let badTide = '';
    let moved = 0;
    for (const dist of dists) {
      const g = await gesture(s2.page, s2.cdp, { v, dist });
      const durs = g.ts.map((d) => d.ms.toFixed(0)).join('/');
      moved = Math.max(moved, g.moved);
      info(`rueda ${v} px/s, ${dist} px (${g.moved.toFixed(0)} reales): ${g.ts.length} marea(s) [${durs}] · último cartel ${g.fin[5]}/${g.fin[6]} llega ${g.arrive === null ? 'NUNCA' : g.arrive.toFixed(0) + ' ms'} tras parar`);
      const a = g.arrive === null ? 1e9 : g.arrive;
      if (a > worst) worst = a;
      if (!(g.ts.length > 0 && g.ts.every((d) => Math.abs(d.ms - 1400) <= 100) && g.fin[5] === g.fin[6])) badTide += ` ${dist}px:[${durs}]`;
      if (a > 1600) bad += ` ${dist}px:${a.toFixed(0)}ms`;
    }
    check(`rueda ${v} px/s: hubo scroll real`, moved > 3000, `${moved.toFixed(0)} px`);
    check(`rueda ${v} px/s (${dists.length} fase${dists.length > 1 ? 's' : ''}): cada marea dura 1,4 s ± 0,1 y el último cartel llega a su objetivo`, badTide === '', badTide);
    check(`rueda ${v} px/s (${dists.length} fase${dists.length > 1 ? 's' : ''}): el último cartel llega ≤ 1,6 s tras parar (peor caso ${worst.toFixed(0)} ms)`, bad === '', bad);
  }
  check('rueda: consola limpia', s2.logs.length === 0, s2.logs.join(' | '));
  await s2.close();
}

if (process.env.T9_ONLY) {
  // depuración: solo los gestos reales («wheel», «touch» o «wheel,touch»)
  for (const k of process.env.T9_ONLY.split(',')) await (k === 'touch' ? touchSection() : wheelSection());
  finish('T9 · solo gestos reales');
  process.exit(process.exitCode ?? 0);
}

const s = await open({ w: 1440, h: 900, init: SCROLL_RUN });
const st0 = await ready(s.page);
check('motor vivo con WebGL2', st0.mode === 'live' && st0.renderer === 'gl', `${st0.mode}/${st0.renderer}`);
await sleep(3000); // termina la ignición y duerme
const max = await s.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
info(`altura de página ${max + 900} px`);

// ---------- fling de 2 400 px/s por toda la página ----------
const fl = await s.page.evaluate((o) => window.__run(o), { v: 2400, y0: 0, y1: max, tail: 4000 });
const dFl = tides(fl.S);
info(`fling: ${dFl.length} marea(s): ` + dFl.map((d) => `${d.from}→${d.to} ${d.ms.toFixed(0)} ms`).join(' · '));
check('fling: hay al menos una marea', dFl.length >= 1);
check('fling: cada marea dura 1,4 s ± 0,1', dFl.length > 0 && dFl.every((d) => Math.abs(d.ms - 1400) <= 100), dFl.map((d) => d.ms.toFixed(0)).join('/'));
const last = fl.S.at(-1);
check('fling: al final no hay marea a medias', last[2] === 0 && last[6] === last[7], `active=${last[2]} cur=${last[6]} target=${last[7]}`);
// tiempo desde que el scroll se detuvo hasta que la marea hacia el último cartel terminó (y hasta p = 1)
const afterStop = fl.S.filter((r) => r[0] >= fl.stopT);
const tDone = afterStop.find((r) => r[2] === 0 && r[6] === r[7] && r[7] === afterStop.at(-1)[7]);
const tP1 = afterStop.find((r) => r[2] === 0 && r[6] === r[7] && r[8] >= 1);
info(`fling: marea terminada ${tDone ? (tDone[0] - fl.stopT).toFixed(0) : '—'} ms tras parar · llegada completa (p = 1) ${tP1 ? (tP1[0] - fl.stopT).toFixed(0) : '—'} ms`);
check('fling: el último cartel llega (marea terminada) en ≤ 1,6 s tras parar', !!tDone && tDone[0] - fl.stopT <= 1600, tDone ? `${(tDone[0] - fl.stopT).toFixed(0)} ms` : 'nunca');

// ---------- vuelta al inicio (retroceso 1,0 s) ----------
const back = await s.page.evaluate((o) => window.__run(o), { v: 2400, y0: max, y1: 0, tail: 3000 });
const dBack = tides(back.S);
info(`retroceso: ${dBack.length} marea(s): ` + dBack.map((d) => `${d.from}→${d.to} ${d.ms.toFixed(0)} ms`).join(' · '));
check('retroceso: mareas de 1,0 s ± 0,1', dBack.length > 0 && dBack.every((d) => Math.abs(d.ms - 1000) <= 100), dBack.map((d) => d.ms.toFixed(0)).join('/'));
check('retroceso: termina en el primer cartel', back.S.at(-1)[6] === 0 && back.S.at(-1)[2] === 0);

// ---------- scroll lento de 300 px/s ----------
const sl = await s.page.evaluate((o) => window.__run(o), { v: 300, y0: 0, y1: 4200, tail: 3000 });
const dSl = tides(sl.S);
info(`lento: ${dSl.length} marea(s): ` + dSl.map((d) => `${d.from}→${d.to} ${d.ms.toFixed(0)} ms`).join(' · '));
check('lento: cada marea dura 1,4 s ± 0,1', dSl.length > 0 && dSl.every((d) => Math.abs(d.ms - 1400) <= 100), dSl.map((d) => d.ms.toFixed(0)).join('/'));
check('lento: nunca avanza más de un cartel por marea', dSl.every((d) => d.to - d.from === 1), dSl.map((d) => `${d.from}→${d.to}`).join(' '));

// ---------- el scroll se detiene con el frente en pantalla: la marea termina igualmente ----------
await s.page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await sleep(2500);
const mid = await s.page.evaluate((o) => window.__run(o), { v: 300, y0: 0, y1: 4200, tail: 2500, stopWhen: 'tide' });
const dMid = tides(mid.S);
info(`detenido a mitad: ${dMid.map((d) => `${d.from}→${d.to} ${d.ms.toFixed(0)} ms`).join(' · ')}`);
check('detenido a mitad: la marea termina sola en 1,4 s ± 0,1', dMid.length === 1 && Math.abs(dMid[0].ms - 1400) <= 100, dMid.map((d) => d.ms.toFixed(0)).join('/'));

await sleep(1500);
const fin = await state(s.page);
check('reposo al final: duerme y 0 rAF propios', fin.sleeping === true);
check('sin errores ni avisos de consola', s.logs.length === 0, s.logs.join(' | '));
await s.close();

await wheelSection();
await touchSection();
finish('T9 · fling y marea');
