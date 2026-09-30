// Ruido DETERMINISTA del motor ASCII (DIRECTION §6.3, R06 §4.1). Corre igual en Node y en el navegador.
//
// Regla de pureza: solo enteros (Math.imul, xor, desplazamientos) y aritmética + − × ÷ de doble precisión, que IEEE-754
// define bit a bit. Nada de Math.sin/cos/pow/exp/random aquí: así el póster SSR (Node) y el lienzo (Chrome, Safari,
// Firefox) producen el mismo glifo en la misma celda. `sinp`/`cosp` son polinomios para cuando una escena necesita un seno
// en la ruta del fotograma `still`.

const TAU = 6.283185307179586;

/** Hash entero 2D → uint32. Mismo (x, y, s) ⇒ mismo valor en cualquier motor. */
export function hu(x: number, y: number, s: number = 0): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Hash entero 2D → [0, 1) (nunca 1: se puede usar como índice `(h2(...) * n) | 0`). */
export function h2(x: number, y: number, s: number = 0): number {
  return hu(x, y, s) / 4294967296;
}

/** Ruido de valor 2D, suavizado con la curva cúbica de Hermite; 0..1. */
export function vnoise(x: number, y: number, s: number = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s);
  const b = h2(xi + 1, yi, s);
  const c = h2(xi, yi + 1, s);
  const d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** fbm de `oct` octavas (amplitud 0,5 · 0,25 · …); con 3 octavas el máximo teórico es 0,875 y la media 0,4375. */
export function fbm(x: number, y: number, oct: number, s: number = 0): number {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x, y, s + i);
    x = x * 2.03 + 17.1;
    y = y * 2.03 - 9.3;
    a *= 0.5;
  }
  return v;
}

// ---------- ruido PERIÓDICO (para la tesela de agua, §6.8) ----------

/** Ruido de valor cuya malla envuelve cada `px`×`py` nodos (enteros): f(x + px, y) = f(x, y). */
export function pvnoise(x: number, y: number, px: number, py: number, s: number = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px;
  const y0 = ((yi % py) + py) % py;
  const x1 = x0 + 1 === px ? 0 : x0 + 1;
  const y1 = y0 + 1 === py ? 0 : y0 + 1;
  const a = h2(x0, y0, s);
  const b = h2(x1, y0, s);
  const c = h2(x0, y1, s);
  const d = h2(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/**
 * fbm periódico en el dominio unidad: f(u + 1, v) = f(u, v) = f(u, v + 1). `freq` = nodos por periodo en la octava 0;
 * cada octava duplica la frecuencia (exacto, por eso envuelve sin costura). Máximo teórico 0,875 con 3 octavas.
 */
export function pfbm(u: number, v: number, freq: number, oct: number, s: number = 0): number {
  let val = 0;
  let a = 0.5;
  let f = freq;
  for (let i = 0; i < oct; i++) {
    val += a * pvnoise(u * f, v * f, f, f, s + i);
    f *= 2;
    a *= 0.5;
  }
  return val;
}

// ---------- ruido de GRADIENTE periódico (filamentos sin alineación con los ejes) ----------

// 16 direcciones unitarias (cos, sin de k·22,5°) escritas como constantes: sin trigonometría en tiempo de ejecución.
const GX = [1, 0.9238795325112867, 0.7071067811865476, 0.3826834323650898, 0, -0.3826834323650898, -0.7071067811865476, -0.9238795325112867, -1, -0.9238795325112867, -0.7071067811865476, -0.3826834323650898, 0, 0.3826834323650898, 0.7071067811865476, 0.9238795325112867];
const GY = [0, 0.3826834323650898, 0.7071067811865476, 0.9238795325112867, 1, 0.9238795325112867, 0.7071067811865476, 0.3826834323650898, 0, -0.3826834323650898, -0.7071067811865476, -0.9238795325112867, -1, -0.9238795325112867, -0.7071067811865476, -0.3826834323650898];

/**
 * Ruido de gradiente (tipo Perlin) 2D con curva quíntica y malla que envuelve cada px×py nodos; ≈ −0,7..0,7. A diferencia del
 * ruido de valor no deja rectas alineadas con los ejes, que en una rejilla de celdas se leen como circuito.
 */
export function pgnoise(x: number, y: number, px: number, py: number, s: number = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const x0 = ((xi % px) + px) % px;
  const y0 = ((yi % py) + py) % py;
  const x1 = x0 + 1 === px ? 0 : x0 + 1;
  const y1 = y0 + 1 === py ? 0 : y0 + 1;
  const a = hu(x0, y0, s) & 15;
  const b = hu(x1, y0, s) & 15;
  const c = hu(x0, y1, s) & 15;
  const d = hu(x1, y1, s) & 15;
  const n00 = GX[a] * xf + GY[a] * yf;
  const n10 = GX[b] * (xf - 1) + GY[b] * yf;
  const n01 = GX[c] * xf + GY[c] * (yf - 1);
  const n11 = GX[d] * (xf - 1) + GY[d] * (yf - 1);
  const top = n00 + (n10 - n00) * u;
  const bot = n01 + (n11 - n01) * u;
  return top + (bot - top) * v;
}

/** fbm de gradiente periódico en el dominio unidad (como `pfbm`), con signo; las octavas duplican la frecuencia. */
export function pgfbm(u: number, v: number, freq: number, oct: number, s: number = 0): number {
  let val = 0;
  let a = 1;
  let f = freq;
  for (let i = 0; i < oct; i++) {
    val += a * pgnoise(u * f, v * f, f, f, s + i);
    f *= 2;
    a *= 0.5;
  }
  return val;
}

// ---------- seno y coseno POLINÓMICOS (sin Math.sin/cos) ----------

/** Seno por aproximación parabólica con corrección (error máximo ≈ 0,001). Determinista: solo + − × y |x|. */
export function sinp(x: number): number {
  x = x - TAU * Math.floor(x / TAU + 0.5); // → [−π, π]
  let y = 1.2732395447351628 * x - 0.4052847345693511 * x * Math.abs(x);
  y = 0.225 * (y * Math.abs(y) - y) + y;
  return y;
}

export function cosp(x: number): number {
  return sinp(x + 1.5707963267948966);
}
