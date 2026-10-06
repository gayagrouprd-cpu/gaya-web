// Dibujo 3D con caracteres: cada celda de la rejilla lanza un rayo contra una escena de campos de distancia y el
// resultado se escribe con caracteres reales (sombreado por rampa, contornos «| / \ _» y sombra en el suelo).
// Es puro cálculo, sin DOM: el servidor pinta con él el primer cuadro (visible sin JS) y el navegador lo anima.

export type Layer = 0 | 1;
/** Carácter fijo de una cara (pantallas, luces) y su capa: 0 = color principal, 1 = acento. */
export interface Look {
  c: string;
  layer: Layer;
}

export interface Scene {
  /** Cámara: posición, punto al que mira y tangente del medio ángulo vertical. */
  eye: [number, number, number];
  at: [number, number, number];
  fov: number;
  /** Dirección hacia la luz (no hace falta normalizarla). */
  light: [number, number, number];
  /** Esfera que envuelve todo (cx, cy, cz, r): los rayos que no la tocan salen sin calcular nada. */
  bound: [number, number, number, number];
  /** Suelo opcional donde caen las sombras (altura y radio alrededor de cx, cz). */
  ground?: { y: number; cx: number; cz: number; r: number };
  /** Coloca la escena en el instante t (segundos) con el giro extra del usuario (radianes). */
  pose(t: number, spin: number): void;
  /** Distancia con signo a la escena; deja el material más cercano en `m`. */
  map(x: number, y: number, z: number): number;
  m: number;
  /** Patrón de una cara: devuelve un carácter fijo o null para sombrear normal. */
  face?(m: number, x: number, y: number, z: number, t: number): Look | null;
  /** Materiales que van en la capa de acento. */
  accent(m: number): boolean;
}

export interface Grid {
  cols: number;
  rows: number;
  /** Caracteres claros sobre fondo oscuro (la rampa se invierte). */
  dark: boolean;
}

/** Alto ÷ ancho de una celda: interlineado 1.08 ÷ avance 0.6 de JetBrains Mono (mantener igual que en v3.css). */
export const CELL = 1.08 / 0.6;
const RAMP = ' .:-=+*#%@';

export interface Frame {
  a: string;
  b: string;
}

// Memorias de trabajo, reutilizadas entre cuadros
let cap = 0;
let HIT = new Uint8Array(0); // 0 nada · 1 objeto · 2 cara con patrón
let DEP = new Float32Array(0);
let CH = new Uint16Array(0);
let LY = new Uint8Array(0);
let N0 = new Float32Array(0);
let N1 = new Float32Array(0);
let N2 = new Float32Array(0);

const abs = Math.abs;
const hash = (i: number, j: number) => {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

export function render(s: Scene, g: Grid, t: number, spin: number, reveal = 1): Frame {
  s.pose(t, spin);
  const { cols, rows, dark } = g;
  const n = cols * rows;
  if (n > cap) {
    cap = n;
    HIT = new Uint8Array(n);
    DEP = new Float32Array(n);
    CH = new Uint16Array(n);
    LY = new Uint8Array(n);
    N0 = new Float32Array(n);
    N1 = new Float32Array(n);
    N2 = new Float32Array(n);
  }
  // Base de la cámara
  const [ex, ey, ez] = s.eye;
  let fx = s.at[0] - ex,
    fy = s.at[1] - ey,
    fz = s.at[2] - ez;
  let k = 1 / Math.hypot(fx, fy, fz);
  fx *= k;
  fy *= k;
  fz *= k;
  // derecha = adelante × arriba(0,1,0)
  let rx = -fz,
    rz = fx;
  k = 1 / Math.hypot(rx, rz);
  rx *= k;
  rz *= k;
  const ry = 0;
  // arriba = derecha × adelante
  const ux = ry * fz - rz * fy,
    uy = rz * fx - rx * fz,
    uz = rx * fy - ry * fx;
  let lx = s.light[0],
    ly = s.light[1],
    lz = s.light[2];
  k = 1 / Math.hypot(lx, ly, lz);
  lx *= k;
  ly *= k;
  lz *= k;
  const tanV = s.fov;
  const tanH = tanV / ((rows * CELL) / cols);
  const [bx, by, bz, br] = s.bound;
  const map = s.map.bind(s);
  const E = 0.0016;

  for (let j = 0; j < rows; j++) {
    const v = (1 - ((j + 0.5) / rows) * 2) * tanV;
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      HIT[idx] = 0;
      CH[idx] = 32;
      LY[idx] = 0;
      DEP[idx] = 1e9;
      const u = (((i + 0.5) / cols) * 2 - 1) * tanH;
      let dx = fx + rx * u + ux * v,
        dy = fy + ry * u + uy * v,
        dz = fz + rz * u + uz * v;
      k = 1 / Math.hypot(dx, dy, dz);
      dx *= k;
      dy *= k;
      dz *= k;
      // ¿toca la esfera envolvente?
      const ox = ex - bx,
        oy = ey - by,
        oz = ez - bz;
      const b = ox * dx + oy * dy + oz * dz;
      const h = b * b - (ox * ox + oy * oy + oz * oz - br * br);
      let hit = false;
      let px = 0,
        py = 0,
        pz = 0,
        mat = 0,
        tt = 0;
      if (h > 0) {
        const sq = Math.sqrt(h);
        tt = Math.max(-b - sq, 0.01);
        const tFar = -b + sq;
        for (let st = 0; st < 80 && tt < tFar; st++) {
          px = ex + dx * tt;
          py = ey + dy * tt;
          pz = ez + dz * tt;
          const d = map(px, py, pz);
          if (d < 0.0009 * tt) {
            hit = true;
            mat = s.m;
            break;
          }
          tt += d * 0.86;
        }
      }
      if (hit) {
        DEP[idx] = tt;
        const look = s.face ? s.face(mat, px, py, pz, t) : null;
        if (look) {
          HIT[idx] = 2;
          CH[idx] = look.c.charCodeAt(0);
          LY[idx] = look.layer;
          continue;
        }
        HIT[idx] = 1;
        // Normal por el tetraedro de iq
        const a1 = map(px + E, py - E, pz - E),
          a2 = map(px - E, py - E, pz + E),
          a3 = map(px - E, py + E, pz - E),
          a4 = map(px + E, py + E, pz + E);
        let nx = a1 - a2 - a3 + a4,
          ny = -a1 - a2 + a3 + a4,
          nz = -a1 + a2 - a3 + a4;
        k = 1 / (Math.hypot(nx, ny, nz) || 1);
        nx *= k;
        ny *= k;
        nz *= k;
        N0[idx] = nx;
        N1[idx] = ny;
        N2[idx] = nz;
        // Luz: difusa + cielo + brillo + oclusión corta
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        const sky = 0.5 + 0.5 * ny;
        let hx = lx - dx,
          hy = ly - dy,
          hz = lz - dz;
        k = 1 / Math.hypot(hx, hy, hz);
        const spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) * k), 28);
        const ao = Math.min(1, Math.max(0, 0.35 + (map(px + nx * 0.09, py + ny * 0.09, pz + nz * 0.09) / 0.09) * 0.65));
        const lum = Math.min(1, (0.06 + 0.78 * diff + 0.14 * sky) * ao + 0.4 * spec);
        // Contraste alto: caras iluminadas casi limpias, caras en sombra densas (lectura de «grabado»)
        const dens = dark ? 0.1 + 0.9 * Math.pow(lum, 1.15) : 0.12 + 0.88 * Math.pow(1 - lum, 1.45);
        CH[idx] = RAMP.charCodeAt(1 + Math.min(RAMP.length - 2, Math.floor(dens * (RAMP.length - 1))));
        LY[idx] = s.accent(mat) ? 1 : 0;
      } else if (s.ground && dy < 0) {
        // Sombra suave en el suelo
        const gr = s.ground;
        const tp = (gr.y - ey) / dy;
        const qx = ex + dx * tp,
          qz = ez + dz * tp;
        const rr = Math.hypot(qx - gr.cx, qz - gr.cz) / gr.r;
        if (rr < 1) {
          let res = 1;
          let st = 0.04;
          for (let q = 0; q < 26 && st < 3.2; q++) {
            const hh = map(qx + lx * st, gr.y + ly * st, qz + lz * st);
            if (hh < 0.001) {
              res = 0;
              break;
            }
            res = Math.min(res, (7 * hh) / st);
            st += Math.min(Math.max(hh, 0.04), 0.3);
          }
          const sh = (1 - Math.max(0, res)) * (1 - rr * rr);
          if (sh > 0.5) CH[idx] = 58; // :
          else if (sh > 0.22) CH[idx] = 46; // .
        }
      }
    }
  }

  // Contornos: donde el objeto se acaba (al lado hay vacío o algo mucho más lejos)
  const near = (q: number, d: number) => HIT[q] !== 0 && DEP[q] < d + 0.35;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      if (HIT[idx] !== 1) continue;
      const d = DEP[idx];
      const c = (ii: number, jj: number) => (ii < 0 || jj < 0 || ii >= cols || jj >= rows ? 0 : near(jj * cols + ii, d) ? 1 : 0);
      const L = c(i - 1, j),
        R = c(i + 1, j),
        U = c(i, j - 1),
        D = c(i, j + 1);
      if (L && R && U && D) {
        crease(i, j, idx);
        continue;
      }
      const UL = c(i - 1, j - 1),
        UR = c(i + 1, j - 1),
        DL = c(i - 1, j + 1),
        DR = c(i + 1, j + 1);
      // Gradiente de Sobel de la ocupación, hacia fuera del objeto: gx > 0 = vacío a la derecha; gy > 0 = vacío arriba
      const gx = UL + 2 * L + DL - (UR + 2 * R + DR);
      const gy = DL + 2 * D + DR - (UL + 2 * U + UR);
      const ax = Math.abs(gx),
        ay = Math.abs(gy);
      if (ax === 0 && ay === 0) continue;
      if (ax > 2.2 * ay) CH[idx] = 124; // |
      else if (ay > 2.2 * ax) {
        if (gy > 0) {
          // borde de arriba: la raya va en la celda vacía de encima, como en el ASCII clásico
          const up = idx - cols;
          if (j > 0 && HIT[up] === 0) {
            CH[up] = 95;
            LY[up] = LY[idx];
          }
        } else CH[idx] = 95; // _
      } else CH[idx] = gx * gy > 0 ? 92 : 47; // \ arriba-derecha y abajo-izquierda; / en las otras
    }
  }

  /** Arista entre dos caras del mismo objeto: la normal cambia de golpe entre vecinas. */
  function crease(i: number, j: number, idx: number) {
    const d = DEP[idx];
    let worst = 1;
    const nb = [idx - 1, idx + 1, idx - cols, idx + cols];
    for (const q of nb) {
      if (HIT[q] !== 1 || abs(DEP[q] - d) > 0.35) continue;
      const dot = N0[idx] * N0[q] + N1[idx] * N1[q] + N2[idx] * N2[q];
      if (dot < worst) worst = dot;
    }
    if (worst > 0.72) return;
    // Sobel de la componente de la normal que más cambia
    let bx = 0,
      by = 0,
      bm = -1;
    for (const N of [N0, N1, N2]) {
      const g = (ii: number, jj: number) => {
        const q = jj * cols + ii;
        return HIT[q] === 1 ? N[q] : N[idx];
      };
      const gx = g(i - 1, j - 1) + 2 * g(i - 1, j) + g(i - 1, j + 1) - g(i + 1, j - 1) - 2 * g(i + 1, j) - g(i + 1, j + 1);
      const gy = g(i - 1, j + 1) + 2 * g(i, j + 1) + g(i + 1, j + 1) - g(i - 1, j - 1) - 2 * g(i, j - 1) - g(i + 1, j - 1);
      const m = gx * gx + gy * gy;
      if (m > bm) {
        bm = m;
        bx = gx;
        by = gy;
      }
    }
    const ax = abs(bx),
      ay = abs(by);
    if (ax > 2.2 * ay) CH[idx] = 124;
    else if (ay > 2.2 * ax) CH[idx] = 95;
    else CH[idx] = bx * by > 0 ? 92 : 47;
  }

  // Aparición: las celdas se encienden con ruido, de izquierda a derecha
  let a = '',
    bb = '';
  for (let j = 0; j < rows; j++) {
    let ra = '',
      rb = '';
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      let ch = CH[idx];
      if (reveal < 1 && ch !== 32) {
        const thr = 0.72 * hash(i, j) + 0.28 * (i / cols);
        if (reveal < thr) ch = 32;
        else if (reveal < thr + 0.07) ch = RAMP.charCodeAt(1 + Math.floor(hash(i + t * 13, j) * (RAMP.length - 1)));
      }
      const cs = String.fromCharCode(ch);
      if (LY[idx] === 1) {
        ra += ' ';
        rb += cs;
      } else {
        ra += cs;
        rb += ' ';
      }
    }
    a += ra + (j < rows - 1 ? '\n' : '');
    bb += rb + (j < rows - 1 ? '\n' : '');
  }
  return { a, b: bb };
}
