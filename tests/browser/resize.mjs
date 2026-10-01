// Resize y cambios de ancho: re-medición de la celda (--cw/--ch por breakpoint), del presupuesto de celdas por tier, de los
// carteles y de los pozos, y elección de la variante de palabra por COLUMNAS finales (no por ancho de ventana). Y dpr.
import { check, finish, info, launchBrowser, open, ready, sleep, state } from './lib.mjs';

const browser = await launchBrowser();
const BUDGET = { high: 9000, mid: 6500, low: 4800, min: 2400 };

/**
 * La celda que DEBE salir: --cw/--ch del CSS por breakpoint y, si se excede el presupuesto, agrandada de 1 px (ch = 2·cw). La celda de
 * dispositivo es entera (round(--cw · dpr)) y la caja CSS del lienzo es cols·cw/dpr: con dpr fraccionario no hay reescalado.
 */
function expected(w, h, tier, dpr) {
  let nw = w < 900 ? 6 : w < 1600 ? 9 : 12;
  let nh = w < 900 ? 12 : w < 1600 ? 18 : 25;
  const d = Math.min(dpr, { high: 2, mid: 2, low: 1.5, min: 1 }[tier]);
  let cw, ch, cols, rows;
  for (;;) {
    cw = Math.round(nw * d);
    ch = Math.round(nh * d);
    cols = Math.floor((w * d) / cw + 1e-6);
    rows = Math.floor((h * d) / ch + 1e-6);
    if (cols * rows <= BUDGET[tier]) break;
    nw++;
    nh = 2 * nw;
  }
  return { cols, rows, cssCw: cw / d, cssCh: ch / d, cw, ch, dpr: d };
}
const near = (a, b, eps = 0.03) => Math.abs(a - b) <= eps;

async function canvasInfo(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas.field');
    const r = c.getBoundingClientRect();
    return { bw: c.width, bh: c.height, cssW: r.width, cssH: r.height, top: r.top, left: r.left, n: document.querySelectorAll('canvas.field').length };
  });
}

const s = await open({ browser, w: 1440, h: 900 });
let st = await ready(s.page);
await sleep(3000);
const tier = st.tier;
info(`tier inicial: ${tier}`);
const steps = [
  [1440, 900, 'L'],
  [1000, 800, 'M'],
  [390, 844, 'S'],
  [768, 1024, 'M'],
  [1280, 720, 'L'],
  [1600, 900, 'L'],
  [2560, 1440, 'L'],
  [1440, 900, 'L'],
];
let last = null;
for (const [w, h, variant] of steps) {
  await s.page.setViewportSize({ width: w, height: h });
  await sleep(900); // debounce de 150 ms + reconstrucción
  st = await state(s.page);
  const ex = expected(w, h, tier, 1);
  const ci = await canvasInfo(s.page);
  const ok = st.cols === ex.cols && st.rows === ex.rows && near(st.cell.cssCw, ex.cssCw, 1e-9) && near(st.cell.cssCh, ex.cssCh, 1e-9) && st.cell.cw === ex.cw && st.cell.ch === ex.ch;
  check(`${w}×${h}: rejilla ${ex.cols}×${ex.rows} con celda ${ex.cssCw}×${ex.cssCh}`, ok, `obtuve ${st.cols}×${st.rows} ${st.cell.cssCw}×${st.cell.cssCh}`);
  check(`${w}×${h}: variante ${variant} (por columnas finales)`, st.variant === variant, `${st.variant} con ${st.cols} cols`);
  check(`${w}×${h}: lienzo = cols·cw × rows·ch px, caja CSS = cols·cssCw × rows·cssCh, pegado a (0,0)`, ci.bw === st.cols * st.cell.cw && ci.bh === st.rows * st.cell.ch && near(ci.cssW, st.cols * st.cell.cssCw) && near(ci.cssH, st.rows * st.cell.cssCh) && ci.top === 0 && ci.left === 0, JSON.stringify(ci));
  check(`${w}×${h}: un solo lienzo y el motor sigue vivo`, ci.n === 1 && st.field === 'live', `${ci.n} ${st.field}`);
  last = st;
}
info(`variantes vistas: ${steps.map((x) => x[2]).join(' ')}`);

// los carteles y los pozos se re-miden: a 390 px el cartel 4 vuelve a ser el objetivo al llegar a su posición
await s.page.setViewportSize({ width: 390, height: 844 });
await sleep(900);
await s.page.evaluate(() => { const el = document.querySelector('#p4'); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }); });
await sleep(2600);
st = await state(s.page);
check('re-medición: tras cambiar de ancho, el scroll a #p4 lo hace cartel objetivo y actual', st.target === 4 && st.cur === 4, `target=${st.target} cur=${st.cur}`);
check('re-medición: consola limpia tras todos los cambios', s.logs.length === 0, s.logs.join(' | '));
void last;
await s.close();

// ---------- dpr: el lienzo mide round(css·dpr efectivo) y NO se reescala cuando el dpr efectivo es el de la pantalla ----------
for (const dpr of [1, 1.25, 1.5, 1.75, 2, 2.625, 3]) {
  const p = await open({ browser, w: 1440, h: 900, dpr });
  const st2 = await ready(p.page);
  await sleep(600);
  const ex = expected(1440, 900, st2.tier, dpr);
  const ci = await canvasInfo(p.page);
  const css = await p.page.evaluate(() => getComputedStyle(document.querySelector('canvas.field')).imageRendering);
  check(`dpr ${dpr}: celda ${ex.cw}×${ex.ch} px de dispositivo (dpr efectivo ${ex.dpr}), lienzo ${ex.cols * ex.cw}×${ex.rows * ex.ch}`, st2.cell.cw === ex.cw && st2.cell.ch === ex.ch && ci.bw === ex.cols * ex.cw && ci.bh === ex.rows * ex.ch, `obtuve ${JSON.stringify(st2.cell)} ${ci.bw}×${ci.bh} · image-rendering ${css}`);
  if (ex.dpr === dpr) {
    // dpr efectivo = dpr de la pantalla: la caja CSS × dpr cae en píxeles de dispositivo enteros y = píxeles del lienzo (1:1, sin filtro)
    check(`dpr ${dpr}: sin reescalado (caja CSS × dpr = píxeles del lienzo, ${ci.bw}×${ci.bh})`, Math.abs(ci.cssW * dpr - ci.bw) < 0.51 && Math.abs(ci.cssH * dpr - ci.bh) < 0.51, `caja ${ci.cssW}×${ci.cssH} css → ${(ci.cssW * dpr).toFixed(2)}×${(ci.cssH * dpr).toFixed(2)} px`);
  }
  check(`dpr ${dpr}: la rejilla cubre el visor (hueco < 1 celda)`, ci.cssW <= 1440 + 0.03 && 1440 - ci.cssW < st2.cell.cssCw && ci.cssH <= 900 + 0.03 && 900 - ci.cssH < st2.cell.cssCh, `${ci.cssW}×${ci.cssH} de 1440×900`);
  check(`dpr ${dpr}: consola limpia`, p.logs.length === 0, p.logs.join(' | '));
  await p.close();
}

await browser.close();
finish('resize, ancho y dpr');
