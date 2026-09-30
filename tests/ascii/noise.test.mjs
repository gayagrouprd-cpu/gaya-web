// Ruido entero determinista (§6.3): mismos valores en cualquier motor, rangos, continuidad y periodicidad.
import test from 'node:test';
import assert from 'node:assert/strict';
import { h2, hu, vnoise, fbm, pvnoise, pfbm, pgnoise, pgfbm, sinp, cosp } from '../../src/ascii/noise.ts';

test('valores dorados: cualquier cambio del hash o de las curvas rompe la paridad póster↔lienzo', () => {
  assert.equal(hu(123, 456, 7), 2711755181);
  assert.equal(h2(1, 2, 3), 0.3976792402099818);
  assert.equal(h2(-5, 77, 0), 0.0035141492262482643);
  assert.equal(vnoise(1.5, 2.5, 0), 0.5455919322557747);
  assert.equal(fbm(3.3, 4.4, 3, 9), 0.4606440426246652);
  assert.equal(pfbm(0.3, 0.6, 4, 3, 1), 0.4637646976008806);
  assert.equal(pgfbm(0.3, 0.6, 4, 3, 1), -0.44526595068942626);
  assert.equal(sinp(1.234), 0.944159624188312);
});

test('h2: [0, 1) (nunca 1), sin NaN, media ≈ 0,5 y 16 cubos parejos', () => {
  const bins = new Array(16).fill(0);
  let sum = 0;
  const N = 200000;
  for (let i = 0; i < N; i++) {
    const v = h2(i % 640, (i / 640) | 0, 3);
    assert.ok(v >= 0 && v < 1, `h2 fuera de [0,1): ${v}`);
    sum += v;
    bins[(v * 16) | 0]++;
  }
  assert.ok(Math.abs(sum / N - 0.5) < 0.005, `media ${sum / N}`);
  for (const b of bins) assert.ok(Math.abs(b / (N / 16) - 1) < 0.04, `cubo desparejo: ${bins}`);
});

test('h2 y hu: deterministas, sensibles a x, y y la semilla', () => {
  assert.equal(h2(10, 20, 5), h2(10, 20, 5));
  assert.notEqual(h2(10, 20, 5), h2(11, 20, 5));
  assert.notEqual(h2(10, 20, 5), h2(10, 21, 5));
  assert.notEqual(h2(10, 20, 5), h2(10, 20, 6));
  assert.ok(Number.isInteger(hu(1, 2, 3)) && hu(1, 2, 3) >= 0 && hu(1, 2, 3) < 2 ** 32);
});

test('vnoise: 0..1, igual a h2 en los nodos y continuo', () => {
  for (let i = 0; i < 50; i++) assert.equal(vnoise(i, i * 2, 4), h2(i, i * 2, 4));
  let maxJump = 0;
  for (let i = 0; i < 4000; i++) {
    const x = i * 0.0173;
    const a = vnoise(x, 2.3, 1);
    const b = vnoise(x + 0.001, 2.3, 1);
    assert.ok(a >= 0 && a <= 1);
    maxJump = Math.max(maxJump, Math.abs(a - b));
  }
  assert.ok(maxJump < 0.004, `salto ${maxJump}`);
});

test('fbm: acotado por la suma de amplitudes y sin NaN', () => {
  for (let i = 0; i < 5000; i++) {
    const v = fbm(i * 0.37, i * 0.11, 3, 9);
    assert.ok(v >= 0 && v <= 0.875 + 1e-12, `fbm ${v}`);
  }
  assert.ok(Number.isFinite(fbm(1e5, -1e5, 4, 2)));
});

test('ruido periódico de valor: envuelve sin costura', () => {
  for (let i = 0; i < 200; i++) {
    const u = (i * 0.0371) % 1;
    const v = (i * 0.0913) % 1;
    assert.ok(Math.abs(pfbm(u, v, 5, 3, 2) - pfbm(u + 1, v, 5, 3, 2)) < 1e-9);
    assert.ok(Math.abs(pfbm(u, v, 5, 3, 2) - pfbm(u, v - 1, 5, 3, 2)) < 1e-9);
  }
  assert.ok(Math.abs(pvnoise(0.3, 0.4, 7, 7, 1) - pvnoise(7.3, 0.4, 7, 7, 1)) < 1e-12);
});

test('ruido de gradiente periódico: envuelve, acotado y sin ejes privilegiados', () => {
  let maxAbs = 0;
  for (let i = 0; i < 400; i++) {
    const u = (i * 0.0371) % 1;
    const v = (i * 0.0913) % 1;
    assert.ok(Math.abs(pgfbm(u, v, 4, 3, 5) - pgfbm(u + 1, v, 4, 3, 5)) < 1e-9);
    assert.ok(Math.abs(pgfbm(u, v, 4, 3, 5) - pgfbm(u, v + 3, 4, 3, 5)) < 1e-9);
    maxAbs = Math.max(maxAbs, Math.abs(pgnoise(u * 8, v * 8, 8, 8, 1)));
  }
  assert.ok(maxAbs < 0.75, `gradiente fuera de rango ${maxAbs}`);
  // en los nodos enteros el ruido de gradiente vale 0 (propiedad de Perlin)
  assert.equal(pgnoise(3, 4, 8, 8, 1), 0);
});

test('sinp/cosp: error < 0,0011 frente a Math.sin/cos en [-30, 30] y paridad exacta', () => {
  let err = 0;
  for (let x = -30; x <= 30; x += 0.0137) {
    err = Math.max(err, Math.abs(sinp(x) - Math.sin(x)), Math.abs(cosp(x) - Math.cos(x)));
  }
  assert.ok(err < 0.0011, `error ${err}`);
  assert.equal(sinp(0), 0);
  assert.equal(sinp(-1.7), -sinp(1.7));
});
