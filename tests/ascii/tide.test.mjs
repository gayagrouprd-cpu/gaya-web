// La marea (§6.4): las cinco zonas por celda contra la fórmula, los extremos exactos, la determinación, la memoria de tono y el
// reloj POR TIEMPO (una marea detenida a mitad termina sola; una interrupción encola una sola pendiente). El agua de la marea es TEXTO
// (estilo Duotono): la banda es la rampa `. : ; = +` sobre un fondo de agua y la espuma, `*` y `~` (tope T12).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  front, compose, tau, tideParams, tideYb, arrivalP, Tide, FRONT_AMPLITUDE, TIDE_ADVANCE_MS, TIDE_RETREAT_MS, TIDE_LEAD,
} from '../../src/ascii/tide.ts';
import { agua, waterTile } from '../../src/ascii/kit.ts';
import { Grid, hashCells, put, fill } from '../../src/ascii/grid.ts';
import { glyphIndex, glyphChar } from '../../src/ascii/glyphs.ts';
import { h2 } from '../../src/ascii/noise.ts';
import { TONE_LUM } from './fixtures/tones.mjs';
import { GLYPH_INK } from '../../src/ascii/scenes/ink.ts';
import { RAMP_CHARS } from '../../src/ascii/scenes/ramp.ts';

const COLS = 96;
const ROWS = 44;
const TP = tideParams(false);
const A = TP.band + TP.reach;

/** Cartel sintético: cada celda lleva el glifo de su escena y un tono propio; cls mezcla aire, cara, borde y atmósfera. */
function poster(glyph, tone, seed) {
  const g = new Grid(COLS, ROWS);
  const cls = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const r = h2(x, y, seed);
    const c = r < 0.25 ? 0 : r < 0.5 ? 1 : r < 0.75 ? 2 : 3;
    cls[y * COLS + x] = c;
    put(g, x, y, glyph, tone + (c === 2 ? 1 : 0), c === 1 ? 2 : -1);
  }
  return { g, cls };
}
const OUT = poster(glyphIndex('A'), 9, 1);
const INC = poster(glyphIndex('B'), 10, 2);
const cell = (g, i) => [g.b[i * 4], g.b[i * 4 + 1], g.b[i * 4 + 2], g.b[i * 4 + 3]];

const run = (yb, o = {}) => {
  const out = new Grid(COLS, ROWS);
  compose(out, OUT.g, INC.g, OUT.cls, INC.cls, yb, { band: TP.band, reach: TP.reach, t: 21.7, ...o });
  return out;
};

test('front: línea media + ondulación acotada (±7,7 < 8), determinista y sin Math.sin', () => {
  let max = 0;
  for (let x = -50; x < 400; x++) {
    const f = front(x, 100);
    assert.equal(f, front(x, 100));
    max = Math.max(max, Math.abs(f - 100));
  }
  assert.ok(max <= FRONT_AMPLITUDE && max > 2, `ondulación ${max}`);
  assert.ok(Math.abs(front(33, 10) - front(33, 0) - 10) < 1e-9, 'el frente solo se desplaza con yb');
  assert.notEqual(front(10, 0), front(40, 0), 'no es una recta');
});

test('compose: las cinco zonas por celda siguen §6.4 al pie de la letra (avance y retroceso)', () => {
  const tl = waterTile();
  const tauMap = tau(COLS, ROWS);
  const t = 21.7;
  for (const dir of [1, -1]) {
    const seen = { out: 0, dissolve: 0, band: 0, crystal: 0, inc: 0 };
    for (const yb of [ROWS + 12, ROWS + 4, ROWS * 0.85, ROWS * 0.7, ROWS * 0.5, ROWS * 0.25, 4, -6, -14]) {
      const out = run(yb, { dir });
      const zones = { out: 0, dissolve: 0, band: 0, crystal: 0, inc: 0 };
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        const dist = (y - front(x, yb)) * dir;
        const got = cell(out.b.length ? out : out, i);
        if (dist < -A) {
          zones.out++;
          assert.deepEqual(got, cell(OUT.g, i), `saliente (${x},${y})`);
        } else if (dist < -TP.band) {
          zones.dissolve++;
          const c = OUT.cls[i];
          const p = (dist + A) / TP.reach;
          if ((c === 1 || c === 2) && p * (c === 2 ? 0.75 : 1.1) * 255 > tauMap[i]) {
            assert.ok([...RAMP_CHARS[3], ...RAMP_CHARS[4]].includes(glyphChar(got[0])), `se deshace en agua de caracteres (${x},${y}): ${glyphChar(got[0])}`);
            assert.ok(got[1] >= 7 && got[1] <= 10, `tono del carácter ${got[1]}`);
            assert.ok(got[2] >= 4 && got[2] <= 7, `fondo de agua ${got[2]}`);
          } else assert.deepEqual(got, cell(OUT.g, i), `el aire y lo que aún no se deshace se quedan (${x},${y})`);
        } else if (dist <= TP.band) {
          zones.band++;
          const ad = Math.abs(dist);
          let d = agua(tl, x, y, t) * 0.8 + 0.35 * (1 - ad / TP.band);
          d = Math.min(1, Math.max(0, d));
          const r = h2(x, y, 40 + ((t * 2 + h2(x, y, 39)) | 0)); // cada celda con su propia fase (no un tic común)
          const ch = glyphChar(got[0]);
          if (ad <= 1 && r < 0.1) {
            assert.equal(ch, '*');
            assert.ok(got[1] === 11 || got[1] === 12);
            assert.equal(got[2], 8, 'la espuma lleva su propio fondo de agua');
          } else if (ad <= 1 && r < 0.5) {
            assert.equal(ch, '~');
            assert.ok(got[1] === 11 || got[1] === 12);
            assert.equal(got[2], 8);
          } else {
            const lv = 1 + ((d * 3.99) | 0);
            assert.ok(RAMP_CHARS[lv].includes(ch), `glifo de banda (${x},${y}): «${ch}» no es del peldaño ${lv}`);
            const tn = 4 + Math.round(6 * d);
            assert.equal(got[1], Math.min(12, tn + 2), `tono de banda (${x},${y})`);
            assert.equal(got[2], tn - 2, `fondo de banda (${x},${y})`);
            assert.ok(!['x', 'X', '#', '%', '@', '*', '~', '^'].includes(ch), 'la banda no lleva x X * (son de la espuma)');
          }
          assert.ok(got[1] <= 12, 'tono máximo de la banda T12');
        } else if (dist <= A) {
          zones.crystal++;
          const c = INC.cls[i];
          const p = (dist - TP.band) / TP.reach;
          if (c === 0 || p * (c === 1 ? 0.9 : 1.3) * 255 >= tauMap[i]) assert.deepEqual(got, cell(INC.g, i), `el entrante cristaliza (${x},${y})`);
          else {
            assert.ok([...RAMP_CHARS[1], ...RAMP_CHARS[2], ...RAMP_CHARS[3], ...RAMP_CHARS[4]].includes(glyphChar(got[0])), `agua que se retira: ${glyphChar(got[0])}`);
            assert.ok(got[1] >= 3 && got[1] <= 6);
          }
        } else {
          zones.inc++;
          assert.deepEqual(got, cell(INC.g, i), `entrante (${x},${y})`);
        }
      }
      for (const z of Object.keys(zones)) seen[z] += zones[z];
    }
    for (const [z, n] of Object.entries(seen)) assert.ok(n > 0, `la zona «${z}» nunca apareció en el barrido (dir ${dir})`);
  }
});

test('primero el interior, al final el aro (deshacer) y primero el aro, después la cara (formar)', () => {
  const tauMap = tau(COLS, ROWS);
  // estadística sobre las celdas: para el mismo p, la fracción convertida en agua es mayor en la cara que en el borde
  let faceWet = 0;
  let faceN = 0;
  let edgeWet = 0;
  let edgeN = 0;
  let edgeShown = 0;
  let edgeInN = 0;
  let faceShown = 0;
  let faceInN = 0;
  const out = run(ROWS * 0.5);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    const dist = y - front(x, ROWS * 0.5);
    if (dist >= -A && dist < -TP.band && (dist + A) / TP.reach > 0.3 && (dist + A) / TP.reach < 0.9) {
      const wet = out.b[i * 4] !== OUT.g.b[i * 4]; // el saliente es «A»: lo que cambia de glifo se ha vuelto agua
      if (OUT.cls[i] === 1) { faceN++; if (wet) faceWet++; }
      if (OUT.cls[i] === 2) { edgeN++; if (wet) edgeWet++; }
    }
    if (dist > TP.band && dist <= A && (dist - TP.band) / TP.reach > 0.25 && (dist - TP.band) / TP.reach < 0.8) {
      const shown = out.b[i * 4] === INC.g.b[i * 4];
      if (INC.cls[i] === 2) { edgeInN++; if (shown) edgeShown++; }
      if (INC.cls[i] === 1) { faceInN++; if (shown) faceShown++; }
    }
  }
  assert.ok(faceWet / faceN > edgeWet / edgeN + 0.1, `deshacer: cara ${faceWet / faceN} vs aro ${edgeWet / edgeN}`);
  assert.ok(edgeShown / edgeInN > faceShown / faceInN + 0.1, `formar: aro ${edgeShown / edgeInN} vs cara ${faceShown / faceInN}`);
  assert.ok(tauMap.length === COLS * ROWS);
});

test('extremos exactos: al empezar es el saliente y al terminar el entrante (avance y retroceso)', () => {
  for (const dir of [1, -1]) {
    const y0 = tideYb(0, ROWS, TP.band, TP.reach, dir);
    const y1 = tideYb(1, ROWS, TP.band, TP.reach, dir);
    assert.equal(hashCells(run(y0, { dir })), hashCells(OUT.g), `dir ${dir} inicio`);
    assert.equal(hashCells(run(y1, { dir })), hashCells(INC.g), `dir ${dir} final`);
  }
  assert.ok(tideYb(0, ROWS, 4, 12, 1) > ROWS + A && tideYb(1, ROWS, 4, 12, 1) < -A);
  assert.ok(tideYb(0, ROWS, 3, 9, -1) < -(3 + 9) && tideYb(1, ROWS, 3, 9, -1) > ROWS + 12);
  // móvil
  const m = tideParams(true);
  assert.deepEqual(m, { band: 3, reach: 9 });
  assert.deepEqual(tideParams(false), { band: 4, reach: 12 });
});

test('compose: determinista, escribe TODAS las celdas (no depende de lo que hubiera en out) y no toca las entradas', () => {
  const hOut = hashCells(OUT.g);
  const hInc = hashCells(INC.g);
  const a = run(18);
  const dirty = new Grid(COLS, ROWS);
  for (let i = 0; i < dirty.b.length; i++) dirty.b[i] = (i * 2654435761) >>> 24;
  compose(dirty, OUT.g, INC.g, OUT.cls, INC.cls, 18, { band: TP.band, reach: TP.reach, t: 21.7 });
  assert.equal(hashCells(dirty), hashCells(a));
  assert.equal(hashCells(run(18)), hashCells(a));
  assert.notEqual(hashCells(run(17)), hashCells(a), 'el frente se mueve');
  assert.notEqual(hashCells(run(18, { t: 30 })), hashCells(a), 'la fase del agua cambia la banda');
  assert.equal(hashCells(OUT.g), hOut);
  assert.equal(hashCells(INC.g), hInc);
});

test('espuma: * y ~ solo a ±1 fila del frente; con foam = 0 no hay', () => {
  const tl = 0;
  void tl;
  const withFoam = run(ROWS * 0.5);
  const noFoam = run(ROWS * 0.5, { foam: 0 });
  let foam = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    const dist = y - front(x, ROWS * 0.5);
    const ch = glyphChar(withFoam.b[i * 4]);
    if ((ch === '*' || ch === '~') && Math.abs(dist) <= TP.band && OUT.g.b[i * 4] !== withFoam.b[i * 4]) {
      assert.ok(Math.abs(dist) <= 1, `espuma fuera de ±1 fila: dist=${dist}`);
      foam++;
    }
    const ch0 = glyphChar(noFoam.b[i * 4]);
    if (Math.abs(dist) <= TP.band) assert.ok(ch0 !== '*' && ch0 !== '~', 'sin espuma');
  }
  assert.ok(foam > 10, `espuma ${foam}`);
});

test('espuma: cada celda cambia de glifo en SU instante, no como un pulso síncrono de toda la línea (2.3.1)', () => {
  // 90 cuadros a 30 fps (3 s): se cuentan los cambios de glifo de las celdas de espuma cuadro a cuadro
  const STEP = 1 / 30;
  const perFrame = [];
  let prev = run(ROWS * 0.5, { t: 21.7 });
  const foamAt = (g, i) => g.b[i * 4] === glyphIndex('*') || g.b[i * 4] === glyphIndex('~');
  for (let f = 1; f <= 90; f++) {
    const cur = run(ROWS * 0.5, { t: 21.7 + f * STEP });
    let changed = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      if (Math.abs(y - front(x, ROWS * 0.5)) > 1) continue;
      if (foamAt(cur, i) !== foamAt(prev, i) || (foamAt(cur, i) && cur.b[i * 4] !== prev.b[i * 4])) changed++;
    }
    perFrame.push(changed);
    prev = cur;
  }
  const total = perFrame.reduce((a, b) => a + b, 0);
  const max = Math.max(...perFrame);
  assert.ok(total > 60, `la espuma tiene que cambiar (${total})`);
  assert.ok(max <= total * 0.12, `pulso síncrono: ${max} de ${total} cambios caen en un solo cuadro (${perFrame.filter((n) => n > 0).length} cuadros con cambios)`);
  assert.ok(perFrame.filter((n) => n > 0).length >= 60, 'los cambios están repartidos en casi todos los cuadros');
});

test('memoria de tono de la banda (2.3.1): con k = 1 no cambia nada; con k < 1 el tono llega poco a poco; se pone a 0 fuera de la banda', () => {
  const k1 = run(ROWS * 0.5, { mem: new Uint8Array(COLS * ROWS), k: 1 });
  assert.equal(hashCells(k1), hashCells(run(ROWS * 0.5)));
  const mem = new Uint8Array(COLS * ROWS);
  const f1 = run(ROWS * 0.5, { mem, k: 0.3 }); // primera vez: memoria vacía ⇒ salta al objetivo
  const f2 = run(ROWS * 0.5 - 1, { mem, k: 0.3 });
  const direct = run(ROWS * 0.5 - 1);
  let smoothed = 0;
  let bigger = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    const dist = y - front(x, ROWS * 0.5 - 1);
    if (Math.abs(dist) > TP.band) assert.equal(mem[i], 0, 'fuera de la banda la memoria se limpia');
    const inBand = mem[i] !== 0;
    if (inBand) {
      smoothed++;
      const a = f1.b[i * 4 + 1];
      const b = f2.b[i * 4 + 1];
      const d = direct.b[i * 4 + 1];
      if (Math.abs(b - a) <= Math.abs(d - a)) bigger++;
    }
  }
  assert.ok(smoothed > 20);
  assert.ok(bigger / smoothed > 0.9, `la memoria debe acercar el tono sin saltar (${bigger}/${smoothed})`);
});

test('destellos (2.3.1): una marea completa a 30 fps no hace más de 3 inversiones de luminancia cualificadas por segundo en ninguna celda', () => {
  // Luminancia media de la celda = cobertura del glifo · luminancia del tono fg + el resto · luminancia del fondo. Una «inversión
  // cualificada» es un cambio de sentido entre dos carreras monótonas de ≥ 0,1 de luminancia relativa con el estado oscuro < 0,8
  // (definición de destello de WCAG 2.3.1); contarlas como destellos completos es más estricto que la norma (un destello son dos).
  const dt = 1 / 30;
  const k = 1 - Math.exp(-12 * dt);
  const frames = Math.ceil(TIDE_ADVANCE_MS / 1000 / dt) + 1;
  const mem = new Uint8Array(COLS * ROWS);
  const series = Array.from({ length: COLS * ROWS }, () => []);
  const solidOut = poster(glyphIndex('█'), 9, 1);
  const solidInc = poster(glyphIndex('█'), 10, 2);
  for (let f = 0; f < frames; f++) {
    const yb = tideYb(f / (frames - 1), ROWS, TP.band, TP.reach, 1);
    const out = new Grid(COLS, ROWS);
    compose(out, solidOut.g, solidInc.g, solidOut.cls, solidInc.cls, yb, { band: TP.band, reach: TP.reach, t: 21.7 + f * dt * 0.95, mem, k });
    for (let i = 0; i < COLS * ROWS; i++) {
      const c = GLYPH_INK[out.b[i * 4]];
      series[i].push(c * TONE_LUM[out.b[i * 4 + 1]] + (1 - c) * TONE_LUM[out.b[i * 4 + 2]]);
    }
  }
  const worstOf = (s) => {
    const runs = [];
    let start = 0;
    let dir = 0;
    for (let f = 1; f < s.length; f++) {
      const d = Math.sign(s[f] - s[f - 1]);
      if (d === 0) continue;
      if (dir === 0) dir = d;
      if (d !== dir) {
        runs.push({ dir, from: s[start], to: s[f - 1], f0: start });
        start = f - 1;
        dir = d;
      }
    }
    if (dir !== 0) runs.push({ dir, from: s[start], to: s[s.length - 1], f0: start });
    const q = runs.filter((r) => Math.abs(r.to - r.from) >= 0.1 && Math.min(r.from, r.to) < 0.8);
    const ev = [];
    for (let i = 1; i < q.length; i++) if (q[i].dir !== q[i - 1].dir) ev.push(q[i].f0);
    let worst = 0;
    for (let a = 0; a < ev.length; a++) {
      let n = 0;
      for (let b = a; b < ev.length && ev[b] - ev[a] < 30; b++) n++;
      worst = Math.max(worst, n);
    }
    return worst;
  };
  let worst = 0;
  let flashing = 0;
  for (const s of series) {
    const w = worstOf(s);
    worst = Math.max(worst, w);
    if (w > 0) flashing++;
  }
  assert.ok(flashing > 100, 'la marea sí cambia la luminancia');
  assert.ok(worst <= 3, `una celda invierte su luminancia ${worst} veces en 1 s`);
});

// ---------- el reloj ----------

const step = (tide, ms) => tide.update(ms, ROWS, TP.band, TP.reach);

test('reloj: avance 1,4 s y retroceso 1,0 s, con frente de entrada y salida de pantalla', () => {
  assert.equal(TIDE_ADVANCE_MS, 1400);
  assert.equal(TIDE_RETREAT_MS, 1000);
  const t = new Tide(0);
  t.request(1, 1000, 1400);
  let s = step(t, 1000);
  assert.ok(s.active && s.dir === 1 && s.from === 0 && s.to === 1 && s.u === 0);
  assert.equal(s.yb, tideYb(0, ROWS, TP.band, TP.reach, 1));
  s = step(t, 1000 + 700);
  assert.ok(s.active && Math.abs(s.u - 0.5) < 1e-12 && Math.abs(s.e - 0.5) < 1e-12);
  assert.ok(Math.abs(s.yb - (ROWS / 2)) < 1e-9, 'a mitad de tiempo la línea media está a mitad de pantalla');
  s = step(t, 1000 + 1399);
  assert.ok(s.active && s.u < 1);
  s = step(t, 1000 + 1400);
  assert.ok(!s.active && s.cur === 1);
  // retroceso: 1,0 s
  t.request(0, 5000, 1400);
  s = step(t, 5000);
  assert.ok(s.active && s.dir === -1);
  assert.ok(step(t, 5999).active);
  assert.ok(!step(t, 6000).active && t.cur === 0);
});

test('POR TIEMPO, NO POR DEDO: una marea detenida a mitad (sin más peticiones) termina sola', () => {
  const t = new Tide(0);
  t.request(1, 0, 1400); // un solo gesto de scroll…
  assert.ok(step(t, 0).active);
  assert.ok(step(t, 700).active, 'a mitad'); // …el dedo se detiene aquí: ya no llegan peticiones
  // cuadros irregulares: ninguno depende del scroll, solo del reloj
  let prev = 0;
  for (const ms of [701, 720, 900, 901, 1250, 1399]) {
    const s = step(t, ms);
    assert.ok(s.active && s.u >= prev, 'u monótona');
    prev = s.u;
  }
  const end = step(t, 1400);
  assert.ok(!end.active, 'la marea terminó sola');
  assert.equal(end.cur, 1);
  assert.equal(step(t, 9000).cur, 1);
  // un salto del reloj a muy tarde (pestaña dormida) también la cierra
  const t2 = new Tide(0);
  t2.request(2, 0, 1400);
  assert.equal(step(t2, 60000).cur, 2);
  assert.ok(!step(t2, 60000).active);
});

test('interrupciones: se termina la marea en curso y se encola UNA pendiente; las intermedias se descartan', () => {
  const t = new Tide(0);
  t.request(1, 0, 1400);
  step(t, 300);
  t.request(3, 300, 1400); // fling de varios carteles…
  t.request(2, 310, 1400); // …cambia de idea…
  t.request(4, 320, 1000); // …y otra vez: solo queda la última
  let s = step(t, 400);
  assert.ok(s.active && s.to === 1 && s.queued, 'sigue la marea en curso (nunca se corta)');
  s = step(t, 1399);
  assert.ok(s.active && s.to === 1);
  s = step(t, 1400);
  assert.ok(s.active && s.from === 1 && s.to === 4 && s.u === 0, 'la pendiente arranca EXACTAMENTE al terminar la anterior');
  assert.ok(!s.queued);
  s = step(t, 2799);
  assert.ok(s.active && s.to === 4);
  s = step(t, 2800);
  assert.ok(!s.active && s.cur === 4, 'solo se ven el primero y el último: 0→1 y 1→4');
  // si el reloj llega tarde, la cadena se cierra de una vez con los tiempos exactos
  const t3 = new Tide(0);
  t3.request(1, 0, 1400);
  t3.request(2, 100, 1400);
  assert.equal(step(t3, 50000).cur, 2);
  // pedir el destino de la marea en curso cancela la pendiente
  const t4 = new Tide(0);
  t4.request(2, 0, 1400);
  t4.request(5, 100, 1400);
  t4.request(2, 200, 1400);
  assert.ok(!step(t4, 300).queued);
  step(t4, 1400);
  assert.equal(t4.cur, 2);
  assert.ok(!step(t4, 1401).active);
  // pedir el cartel actual sin marea no hace nada
  t4.request(2, 5000, 1400);
  assert.ok(!step(t4, 5000).active);
});

test('retroceso dentro de la cola y dirección según el destino', () => {
  const t = new Tide(3);
  t.request(1, 0, 1400);
  assert.equal(step(t, 0).dir, -1);
  t.request(2, 10, 1400);
  assert.equal(step(t, 1000).from, 1, 'cur pasa a 1 al terminar (1 s)');
  const s = step(t, 1000);
  assert.ok(s.active && s.dir === 1 && s.to === 2, 'la pendiente sube de 1 a 2 (avance, 1,4 s)');
  assert.ok(!step(t, 2400).active);
});

test('p del entrante: arranca a los 0,35·T y dura arrival.ms; al retroceder va de 0,5 a 1 en la mitad de tiempo', () => {
  assert.equal(TIDE_LEAD, 0.35);
  assert.equal(arrivalP(0, 1.4, 1600, 1), 0);
  assert.ok(Math.abs(arrivalP(0.49, 1.4, 1600, 1)) < 1e-9);
  assert.ok(Math.abs(arrivalP(0.49 + 0.8, 1.4, 1600, 1) - 0.5) < 1e-12);
  assert.ok(Math.abs(arrivalP(0.49 + 1.6, 1.4, 1600, 1) - 1) < 1e-9);
  assert.equal(arrivalP(0.49 + 1.7, 1.4, 1600, 1), 1);
  assert.equal(arrivalP(0, 1, 1600, -1), 0.5);
  assert.ok(Math.abs(arrivalP(0.35 + 0.4, 1, 1600, -1) - 0.75) < 1e-12);
  assert.ok(Math.abs(arrivalP(0.35 + 0.8, 1, 1600, -1) - 1) < 1e-9);
  assert.equal(arrivalP(99, 1, 1600, -1), 1);
  // transición total (marea + llegada) ≤ 2,4 s para arrival.ms ≤ 1 900 (§6.5)
  for (const ms of [600, 900, 1400, 1500, 1600, 1900]) assert.ok(TIDE_LEAD * 1.4 + ms / 1000 <= 2.4 + 1e-9, `arrival ${ms}`);
});

test('tras la marea el entrante sigue con su guion hasta p = 1 y luego queda quieto', () => {
  const t = new Tide(0);
  t.request(1, 0, 1900);
  let s = step(t, 1000);
  assert.ok(s.active && s.arriving && s.p > 0);
  s = step(t, 1450);
  assert.ok(!s.active && s.arriving && s.p > 0 && s.p < 1, `p=${s.p}`);
  const p1 = s.p;
  s = step(t, 1800);
  assert.ok(s.arriving && s.p > p1);
  s = step(t, 0.35 * 1400 + 1900 + 1);
  assert.ok(!s.active && !s.arriving && s.p === 1);
  s = step(t, 30000);
  assert.equal(s.p, 1);
});

test('snap (corte seco) y estado reutilizado sin asignaciones por cuadro', () => {
  const t = new Tide(0);
  t.request(2, 0, 1400);
  const a = step(t, 100);
  t.snap(5);
  const b = step(t, 101);
  assert.equal(a, b, 'update devuelve el mismo objeto');
  assert.ok(!b.active && !b.arriving && b.cur === 5 && b.p === 1);
  t.request(5, 200, 1400);
  assert.ok(!step(t, 200).active);
});
