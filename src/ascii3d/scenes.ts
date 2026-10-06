// Las cuatro escenas 3D de los servicios, dibujadas con caracteres por render.ts.
// web: portátil y celular con una web que se desplaza · automation: engranajes que engranan y un chat que escribe solo
// marketing: perfil en un celular con corazones que suben · it: rack de servidores con luces y un router con wifi.
import type { Look, Scene } from './render.ts';
import type { ServiceId } from '../data/services.ts';

// ── Utilidades de campos de distancia ───────────────────────────────────────────────────────────────────────
const { abs, max, min, sqrt, sin, cos, atan2, floor, PI } = Math;
const len2 = (x: number, y: number) => sqrt(x * x + y * y);
const len3 = (x: number, y: number, z: number) => sqrt(x * x + y * y + z * z);
const fract = (x: number) => x - floor(x);
/** Caja redondeada centrada en el origen (semi-lados bx, by, bz; radio r). */
function box(x: number, y: number, z: number, bx: number, by: number, bz: number, r: number) {
  const qx = abs(x) - bx + r,
    qy = abs(y) - by + r,
    qz = abs(z) - bz + r;
  return len3(max(qx, 0), max(qy, 0), max(qz, 0)) + min(max(qx, max(qy, qz)), 0) - r;
}
function box2(x: number, y: number, bx: number, by: number, r: number) {
  const qx = abs(x) - bx + r,
    qy = abs(y) - by + r;
  return len2(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r;
}
/** Extruye una figura 2D (distancia d2) a lo largo de z con semi-grosor h. */
function extrude(d2: number, z: number, h: number) {
  const wy = abs(z) - h;
  return min(max(d2, wy), 0) + len2(max(d2, 0), max(wy, 0));
}
/** Corazón 2D de iq (alto ≈ 1, base en y = 0). */
function heart2(x: number, y: number) {
  x = abs(x);
  if (y + x > 1) return len2(x - 0.25, y - 0.75) - Math.SQRT2 / 4;
  const a = x * x + (y - 1) * (y - 1);
  const m = 0.5 * max(x + y, 0);
  const b = (x - m) * (x - m) + (y - m) * (y - m);
  return sqrt(min(a, b)) * Math.sign(x - y);
}
/** Engranaje en el plano xy: disco de radio R con n dientes de alto h, agujero central y ventanas. */
function gear(x: number, y: number, z: number, R: number, n: number, h: number, th: number, rot: number, windows: number) {
  const r = len2(x, y);
  const a = atan2(y, x) - rot;
  const sec = (2 * PI) / n;
  const aa = fract(a / sec + 0.5) * sec - sec / 2;
  const tx = r * cos(aa) - R - h * 0.35,
    ty = r * sin(aa);
  let d = min(r - R, box2(tx, ty, h * 0.85, R * sec * 0.24, 0.025));
  d = max(d, 0.13 * R + 0.05 - r); // agujero del eje
  if (windows > 0) {
    const ws = (2 * PI) / windows;
    const wa = fract(a / ws + 0.5) * ws - ws / 2;
    d = max(d, -(len2(r * cos(wa) - R * 0.56, r * sin(wa)) - R * 0.2));
  }
  return extrude(d, z, th) - 0.012;
}

/** Glifo de patrón: devuelve una cara de color principal o de acento. */
const P = (c: string): Look => ({ c, layer: 0 });
const A = (c: string): Look => ({ c, layer: 1 });
const BLANK = P(' ');

// ── Desarrollo web: portátil + celular, con una web que se desplaza en las dos pantallas ─────────────────────────
function webScene(): Scene {
  const BODY = 1,
    LID = 2,
    PHONE = 3;
  let cy = 1,
    sy = 0,
    bob = 0,
    scroll = 0;
  const TH = 0.27; // inclinación de la tapa hacia atrás
  const ct = cos(TH),
    st = sin(TH);
  const PA = -0.42; // el celular mira un poco hacia el centro
  const cpa = cos(PA),
    spa = sin(PA);
  const toG = (x: number, y: number, z: number): [number, number, number] => {
    const yy = y - bob;
    return [cy * x - sy * z, yy, sy * x + cy * z];
  };
  const toLid = (gx: number, gy: number, gz: number): [number, number, number] => {
    const wy = gy - 0.04,
      wz = gz + 0.55;
    return [gx, wy * ct - wz * st, wy * st + wz * ct];
  };
  const toPhone = (gx: number, gy: number, gz: number): [number, number, number] => {
    const x = gx - 1.22,
      y = gy - 0.5,
      z = gz - 0.78;
    return [cpa * x - spa * z, y, spa * x + cpa * z];
  };
  /** Una web de ejemplo en coordenadas de página (u de 0 a 1; v hacia abajo, se repite cada 1.7). */
  function page(u: number, v: number, wide: boolean): Look | null {
    const pv = fract((v + scroll) / 1.7) * 1.7;
    const L = 0.07;
    if (wide) {
      if (pv > 0.06 && pv < 0.2 && u > L && u < 0.6) return P('#');
      if (pv > 0.24 && pv < 0.34 && u > L && u < 0.44) return P('#');
      if ((pv > 0.42 && pv < 0.45) || (pv > 0.5 && pv < 0.53)) return u > L && u < (pv < 0.47 ? 0.55 : 0.48) ? P('-') : BLANK;
      if (pv > 0.6 && pv < 0.72 && u > L && u < 0.3) return A('=');
      if (pv > 0.06 && pv < 0.72 && u > 0.66 && u < 0.94) return P(fract(u * 9 + pv * 4) < 0.5 ? '/' : '%');
      if (pv > 0.86 && pv < 1.26) {
        const k = floor((u - L) / 0.29);
        const cu = (u - L) - k * 0.29;
        if (k >= 0 && k < 3 && cu < 0.25) return P(pv < 0.9 || pv > 1.22 || cu < 0.02 || cu > 0.23 ? '+' : ':');
      }
      if (pv > 1.36 && pv < 1.39 && u > L && u < 0.8) return P('-');
      if (pv > 1.45 && pv < 1.48 && u > L && u < 0.62) return P('-');
      return BLANK;
    }
    if (pv > 0.06 && pv < 0.3 && u > 0.1 && u < 0.9) return P('#');
    if (pv > 0.36 && pv < 0.8 && u > 0.1 && u < 0.9) return P(fract(u * 5 + pv * 3) < 0.5 ? '/' : '%');
    if (pv > 0.9 && pv < 1.04 && u > 0.1 && u < 0.9) return A('=');
    if (pv > 1.16 && pv < 1.2 && u > 0.1 && u < 0.84) return P('-');
    if (pv > 1.28 && pv < 1.32 && u > 0.1 && u < 0.7) return P('-');
    return BLANK;
  }
  return {
    eye: [0.35, 1.75, 4.6],
    at: [0.34, 0.5, 0.05],
    fov: 0.262,
    light: [-0.6, 1.0, 0.75],
    bound: [0.3, 0.55, 0.05, 2.05],
    ground: { y: -0.045, cx: 0.3, cz: 0.1, r: 2.3 },
    m: 0,
    pose(t, spin) {
      const yaw = -0.36 + 0.34 * sin(t * 0.33) + spin;
      cy = cos(yaw);
      sy = sin(yaw);
      bob = 0.025 * sin(t * 0.9);
      scroll = t * 0.07;
    },
    map(x, y, z) {
      const [gx, gy, gz] = toG(x, y, z);
      let d = box(gx, gy, gz - 0.15, 1.06, 0.04, 0.7, 0.035);
      this.m = BODY;
      const [lx, ly, lz] = toLid(gx, gy, gz);
      const dl = box(lx, ly - 0.7, lz, 1.06, 0.7, 0.032, 0.03);
      if (dl < d) {
        d = dl;
        this.m = LID;
      }
      const [qx, qy, qz] = toPhone(gx, gy, gz);
      const dp = box(qx, qy, qz, 0.29, 0.56, 0.036, 0.07);
      if (dp < d) {
        d = dp;
        this.m = PHONE;
      }
      return d;
    },
    face(m, x, y, z) {
      const [gx, gy, gz] = toG(x, y, z);
      if (m === LID) {
        const [lx, ly, lz] = toLid(gx, gy, gz);
        if (lz < 0.02 || abs(lx) > 0.97 || ly < 0.1 || ly > 1.3) return null;
        const u = (lx + 0.97) / 1.94,
          v = (1.3 - ly) / 1.2;
        if (v < 0.1) return u > 0.05 && u < 0.17 ? P('#') : u > 0.62 && u < 0.95 && fract(u * 30) < 0.6 ? P('-') : BLANK;
        return page(u, v - 0.1, true);
      }
      if (m === PHONE) {
        const [qx, qy, qz] = toPhone(gx, gy, gz);
        if (qz < 0.02 || abs(qx) > 0.23 || abs(qy) > 0.48) return null;
        return page((qx + 0.23) / 0.46, (0.48 - qy) / 0.96, false);
      }
      if (m === BODY && gy > 0.03 && gz < 0.2 && gz > -0.45 && abs(gx) < 0.88) {
        // teclado: filas de teclas
        const kx = fract(gx * 6.2),
          kz = fract(gz * 5.2);
        return kx < 0.78 && kz < 0.7 ? P(':') : P('.');
      }
      return null;
    },
    accent: () => false,
  };
}

// ── Automatización: dos engranajes que engranan y un chat que escribe solo ─────────────────────────────────────────
function automationScene(): Scene {
  const GEAR = 1,
    GEAR2 = 2,
    BUBBLE = 3;
  const RA = 0.92,
    RB = 0.56,
    H = 0.2,
    NA = 9,
    NB = 6;
  const AX = -0.55,
    AY = -0.2;
  const ALPHA = -0.38; // dirección de A hacia B
  const DIST = RA + RB + H * 1.05;
  const BX = AX + DIST * cos(ALPHA),
    BY = AY + DIST * sin(ALPHA);
  let cy = 1,
    sy = 0,
    rotA = 0,
    rotB = 0,
    t0 = 0;
  const toG = (x: number, y: number, z: number): [number, number, number] => [cy * x - sy * z, y, sy * x + cy * z];
  const toBubble = (gx: number, gy: number, gz: number): [number, number, number] => [gx - 0.62, gy - 0.98, gz - 0.34];
  return {
    eye: [0.1, 0.55, 4.8],
    at: [0.12, 0.12, 0],
    fov: 0.36,
    light: [-0.5, 0.9, 0.9],
    bound: [0.1, 0.1, 0, 2.0],
    m: 0,
    pose(t, spin) {
      const yaw = -0.18 + 0.2 * sin(t * 0.29) + spin;
      cy = cos(yaw);
      sy = sin(yaw);
      rotA = t * 0.5;
      const sA = (2 * PI) / NA,
        sB = (2 * PI) / NB;
      rotB = ALPHA + PI - sB * (0.5 - (ALPHA - rotA) / sA);
      t0 = t;
    },
    map(x, y, z) {
      const [gx, gy, gz] = toG(x, y, z);
      let d = gear(gx - AX, gy - AY, gz, RA, NA, H, 0.15, rotA, 3);
      this.m = GEAR;
      const d2 = gear(gx - BX, gy - BY, gz, RB, NB, H, 0.15, rotB, 0);
      if (d2 < d) {
        d = d2;
        this.m = GEAR2;
      }
      // chat: globo con cola
      const [cx, cyy, cz] = toBubble(gx, gy, gz);
      let db = box(cx, cyy, cz, 0.7, 0.32, 0.1, 0.16);
      const tx = cx + 0.4,
        ty = cyy + 0.34;
      db = min(db, box((tx + ty) * 0.7071, (ty - tx) * 0.7071, cz, 0.11, 0.11, 0.09, 0.03));
      if (db < d) {
        d = db;
        this.m = BUBBLE;
      }
      return d;
    },
    face(m, x, y, z) {
      if (m !== BUBBLE) return null;
      const [cx, cyy, cz] = toBubble(...toG(x, y, z));
      if (cz < 0.08 || abs(cx) > 0.56 || abs(cyy) > 0.22) return null;
      // tres puntos que saltan: «escribiendo…»
      for (let k = 0; k < 3; k++) {
        const jump = 0.09 * max(0, sin(t0 * 5.2 - k * 0.95));
        if (len2((cx + 0.3 - k * 0.3) * 0.9, cyy - jump + 0.02) < 0.085) return A('@');
      }
      return BLANK;
    },
    accent: (m) => m === GEAR2,
  };
}

// ── Marketing: perfil en un celular y corazones que suben ───────────────────────────────────────────────────────
function marketingScene(): Scene {
  const PHONE = 1,
    HEART = 2;
  let cy = 1,
    sy = 0;
  const TX = 0.16;
  const ctx = cos(TX),
    stx = sin(TX);
  const hearts: Array<{ x: number; y: number; z: number; s: number; c: number; sn: number }> = [0, 1, 2].map(() => ({ x: 0, y: 0, z: 0, s: 0, c: 1, sn: 0 }));
  const toPhone = (x: number, y: number, z: number): [number, number, number] => {
    const px = x + 0.42,
      py = y - 0.02;
    const rx = cy * px - sy * z,
      rz = sy * px + cy * z;
    return [rx, py * ctx - rz * stx, py * stx + rz * ctx];
  };
  const POSTS = '%#+=:%+#%';
  return {
    eye: [0.05, 0.35, 4.7],
    at: [0.1, 0.1, 0],
    fov: 0.33,
    light: [-0.55, 0.85, 0.95],
    bound: [0.1, 0.15, 0, 2.0],
    m: 0,
    pose(t, spin) {
      const yaw = 0.34 + 0.3 * sin(t * 0.31) + spin;
      cy = cos(yaw);
      sy = sin(yaw);
      hearts.forEach((h, k) => {
        const ph = fract(t * 0.16 + k / 3);
        h.x = 0.72 + 0.2 * sin(ph * 5.5 + k * 2.1);
        h.y = -0.75 + ph * 2.0;
        h.z = 0.3 + 0.1 * k;
        h.s = (k === 0 ? 0.62 : 0.42) * Math.pow(sin(PI * ph), 0.55);
        const a = 0.55 * sin(t * 1.3 + k * 2);
        h.c = cos(a);
        h.sn = sin(a);
      });
    },
    map(x, y, z) {
      const [px, py, pz] = toPhone(x, y, z);
      let d = box(px, py, pz, 0.52, 1.04, 0.05, 0.14);
      this.m = PHONE;
      for (const h of hearts) {
        if (h.s < 0.02) continue;
        let hx = x - h.x,
          hy = y - h.y,
          hz = z - h.z;
        const rx = h.c * hx - h.sn * hz;
        hz = h.sn * hx + h.c * hz;
        hx = rx;
        const s = h.s;
        const dh = (extrude(heart2(hx / s, hy / s + 0.5), hz / s, 0.05) - 0.14) * s;
        if (dh < d) {
          d = dh;
          this.m = HEART;
        }
      }
      return d;
    },
    face(m, x, y, z) {
      if (m !== PHONE) return null;
      const [px, py, pz] = toPhone(x, y, z);
      if (pz < 0.045 || abs(px) > 0.42 || abs(py) > 0.92) return null;
      // cabecera: foto de perfil, nombre y cifras
      if (len2(px + 0.27, (py - 0.76) * 0.8) < 0.13) return A('@');
      if (py > 0.73 && py < 0.83 && px > -0.08 && px < 0.34) return P('#');
      if (py > 0.6 && py < 0.66 && px > -0.08 && px < 0.38) return P(fract(px * 8) < 0.7 ? '-' : ' ');
      // cuadrícula de publicaciones 3×3
      if (py < 0.5 && py > -0.6) {
        const cxk = floor((px + 0.45) / 0.3),
          cyk = floor((0.5 - py) / 0.366);
        const lx = px + 0.45 - cxk * 0.3,
          ly = 0.5 - py - cyk * 0.366;
        if (lx < 0.03 || ly < 0.04 || cxk > 2 || cyk > 2) return BLANK;
        const k = cyk * 3 + cxk;
        return k === 4 ? A('#') : P(POSTS[k]);
      }
      if (py < -0.7 && py > -0.88 && abs(px) < 0.36) return A('=');
      return BLANK;
    },
    accent: (m) => m === HEART,
  };
}

// ── Soporte IT: rack de servidores con luces y un router con wifi ─────────────────────────────────────────────────
function itScene(): Scene {
  const RACK = 1,
    ROUTER = 2,
    WIFI = 3,
    ANT = 4;
  let cy = 1,
    sy = 0,
    t0 = 0;
  const toG = (x: number, y: number, z: number): [number, number, number] => [cy * x - sy * z, y, sy * x + cy * z];
  // posición del router en el mundo (las ondas miran siempre a la cámara)
  let wx = 0,
    wz = 0;
  return {
    eye: [0.25, 0.8, 4.8],
    at: [0.2, -0.05, 0],
    fov: 0.345,
    light: [-0.55, 0.95, 0.8],
    bound: [0.12, -0.05, 0, 2.0],
    ground: { y: -1.1, cx: 0.1, cz: 0, r: 2.1 },
    m: 0,
    pose(t, spin) {
      const yaw = 0.52 + 0.24 * sin(t * 0.27) + spin;
      cy = cos(yaw);
      sy = sin(yaw);
      t0 = t;
      // router en (0.95, -0.98, 0.45) del grupo → mundo (las ondas salen de ahí)
      wx = cy * 0.95 + sy * 0.45;
      wz = -sy * 0.95 + cy * 0.45;
    },
    map(x, y, z) {
      const [gx, gy, gz] = toG(x, y, z);
      let d = box(gx + 0.42, gy, gz, 0.58, 1.08, 0.46, 0.04);
      this.m = RACK;
      const rx = gx - 0.95,
        ry = gy + 0.98,
        rz = gz - 0.45;
      const dr = box(rx, ry, rz, 0.44, 0.11, 0.3, 0.05);
      if (dr < d) {
        d = dr;
        this.m = ROUTER;
      }
      // antenas
      for (const sx of [-0.3, 0.3]) {
        const da = max(len2(rx - sx, rz + 0.2) - 0.035, abs(ry - 0.34) - 0.24);
        if (da < d) {
          d = da;
          this.m = ANT;
        }
      }
      // ondas de wifi: tres arcos en el plano de la cámara, encima del router
      const ox = x - wx,
        oy = y + 0.5,
        oz = z - wz;
      if (oy > 0 && abs(ox) < oy * 1.1) {
        const rr = len2(ox, oy);
        for (let k = 0; k < 3; k++) {
          const dw = extrude(abs(rr - (0.32 + k * 0.26)) - 0.055, oz, 0.05);
          if (dw < d) {
            d = dw;
            this.m = WIFI;
          }
        }
      }
      return d;
    },
    face(m, x, y, z) {
      const [gx, gy, gz] = toG(x, y, z);
      if (m === RACK && gz > 0.44) {
        const lx = gx + 0.42;
        if (abs(lx) > 0.52 || abs(gy) > 1.02) return null;
        const u = floor((1.02 - gy) / 0.51); // 4 unidades
        const ly = 1.02 - gy - u * 0.51;
        if (ly < 0.05) return P('=');
        if (lx < -0.34) {
          const blink = fract(sin(u * 12.9 + floor(t0 * 2.6 + u) * 78.2) * 437.5) > 0.35;
          return ly > 0.12 && ly < 0.22 ? (blink ? A('*') : P('.')) : ly > 0.3 && ly < 0.4 ? A('o') : BLANK;
        }
        if (lx > -0.24 && ly > 0.12 && ly < 0.42) return fract(lx * 7) < 0.15 ? P('|') : P(fract(ly * 10) < 0.5 ? ':' : '.');
        return BLANK;
      }
      if (m === ROUTER && gz > 0.73 && abs(gx - 0.95) < 0.36) {
        const k = floor((gx - 0.95 + 0.36) / 0.12);
        return k % 2 === 0 && abs(gy + 0.98) < 0.05 ? A('o') : null;
      }
      return null;
    },
    accent: (m) => m === WIFI,
  };
}

const MAKERS: Record<ServiceId, () => Scene> = { web: webScene, automation: automationScene, marketing: marketingScene, it: itScene };
export const scene = (id: ServiceId): Scene => MAKERS[id]();
/** Instante del primer cuadro (el que se ve sin JS y con movimiento reducido). */
export const STILL_T = 2.2;
