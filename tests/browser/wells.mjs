// Pozos de lectura (DIRECTION §5.8, T7 del lado del motor): con el texto transparente se captura el lienzo y se mide, bajo cada
// rectángulo `[data-well]`, el píxel MÁS CLARO; el contraste de ese píxel con la tinta (--ink / --muted) debe ser ≥ 4,5:1.
// 12 posiciones de scroll en reposo y una pasada a 2 400 px/s (reloj falso: cada cuadro de 33 ms avanza 80 px, determinista).
import sharp from 'sharp';
import { check, finish, info, launchBrowser, open, ready, sleep } from './lib.mjs';

const browser = await launchBrowser();
const INK = [0xed, 0xf2, 0xf8];
const MUTED = [0xa4, 0xb6, 0xce];
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** Captura con el texto transparente y mide el píxel más claro bajo cada pozo visible. */
async function measure(page) {
  const rects = await page.evaluate(() =>
    [...document.querySelectorAll('[data-well]')].map((el) => {
      const b = el.getBoundingClientRect();
      // `bottom` y no «y + alto»: un pozo medio fuera por arriba (y recortado a 0) no debe medir píxeles por debajo de su borde real
      return { kind: el.dataset.well, x: Math.max(0, Math.floor(b.left)), y: Math.max(0, Math.floor(b.top)), w: Math.ceil(b.width), h: Math.max(0, Math.ceil(b.bottom) - Math.max(0, Math.floor(b.top))), vis: b.bottom > 0 && b.top < innerHeight };
    }),
  );
  const buf = await page.screenshot();
  const img = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = img.info.width;
  const out = [];
  for (const r of rects) {
    if (!r.vis || r.w === 0) continue;
    let best = null;
    let bestL = -1;
    const x1 = Math.min(W, r.x + r.w);
    const y1 = Math.min(img.info.height, r.y + r.h);
    for (let y = r.y; y < y1; y++) {
      for (let x = r.x; x < x1; x++) {
        const i = (y * W + x) * 3;
        const px = [img.data[i], img.data[i + 1], img.data[i + 2]];
        const l = lum(px);
        if (l > bestL) {
          bestL = l;
          best = px;
        }
      }
    }
    if (best) out.push({ kind: r.kind, c: contrast(r.kind === 'muted' ? MUTED : INK, best), px: best });
  }
  return out;
}

const s = await open({ browser, w: 1440, h: 900, init: `window.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='main#contenido *{color:transparent!important;border-color:transparent!important;box-shadow:none!important;outline:none!important}.btn,.art,.thread,svg,header.nav,.skip{visibility:hidden!important}';document.head.append(st)})` });
await ready(s.page);
await sleep(3000);
const max = await s.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

// ---------- 12 posiciones en reposo ----------
let worst = 99;
let worstAt = '';
for (let k = 0; k < 12; k++) {
  const y = Math.round((max * k) / 11);
  await s.page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
  await sleep(2600); // marea (1,4 s) + 1,6 s de sueño: el último cuadro lleva los pozos de esta posición
  const r = await measure(s.page);
  const m = r.length ? Math.min(...r.map((x) => x.c)) : 99;
  if (m < worst) (worst = m), (worstAt = `scroll ${y}`);
  check(`reposo, scroll ${y}: contraste ≥ 4,5:1 bajo ${r.length} pozo(s)`, m >= 4.5, `mínimo ${m.toFixed(2)}:1`);
}
info(`peor contraste en reposo: ${worst.toFixed(2)}:1 (${worstAt})`);

// ---------- pasada a 2 400 px/s con el reloj falso ----------
await s.page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await sleep(2600);
await s.page.clock.install();
await s.page.clock.pauseAt(new Date(Date.now() + 1000));
let fl = 99;
let frames = 0;
for (let i = 1; i <= 60; i++) {
  await s.page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.min(max, i * 80));
  await sleep(20); // deja llegar el evento `scroll` (tiempo real) antes de avanzar el reloj falso
  await s.page.clock.runFor(34);
  if (i % 3 === 0) {
    const r = await measure(s.page);
    frames++;
    const m = r.length ? Math.min(...r.map((x) => x.c)) : 99;
    fl = Math.min(fl, m);
  }
}
check(`fling de 2 400 px/s (${frames} cuadros medidos): contraste ≥ 4,5:1 en todos los pozos`, fl >= 4.5, `mínimo ${fl.toFixed(2)}:1`);
check('consola limpia', s.logs.length === 0, s.logs.join(' | '));
await s.close();
await browser.close();
finish('pozos de lectura (T7 del motor)');
