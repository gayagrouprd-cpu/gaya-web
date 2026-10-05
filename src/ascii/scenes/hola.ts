// `hola` · HOLA / HELLO — «hola contiene ola» (DIRECTION §7.2), en el estilo oficial Duotono. La H es el rótulo quieto: agua cobalto de masa sólida con un grano de caracteres
// grabados, aro, aura y sombra; «OLA» (en inglés «ELLO») está hecha de olas dibujadas con caracteres: dentro de las letras, rayas de ola cuya CRESTA es una línea
// continua de `~` (una celda por columna) y cuyo cuerpo baja hacia el seno por `; = + : .` en duotono (glifo sobre un fondo T4–T9 que sigue a la ola, la losa de agua).
// Misma geometría y mismo guion que el diseño original (`arrival.ms` = 900) y mismo contrato `Scene`; usa `bg`.
//
// `paint` solo usa enteros y polinomios (`sinp`, `cosp`, `smooth`): el `still` es idéntico en cualquier motor.
import type { Cells, FaceInfo, Frame, GridSpec, Lang, Scene, SceneState, WordSet } from "./common.ts";
import {
  C_EDGE, C_FACE, RING_TONES, agua, applyRings, bn, clear, cosp, faceFn, glyphIndex, hu, layoutLines, makeCells, makeState, paintRing, put, sinp, smooth, stampCls, waterTile,
  waterTone,
} from "./common.ts";
import type { RingTones } from "./common.ts";
import { accentDensity, bakeAura, bakeShadow, clusterField, distField, enclosedCells, glowFromDist, inkTone, mistDuo, putDuo, putWall } from "./duo.ts";
import type { AuraCells, ShadowCells } from "./duo.ts";

interface Line {
  x0: number;
  y0: number;
  word: WordSet["lines"][number];
  face: FaceInfo;
  /** Columnas de la PRIMERA letra (la H), solo en la línea 0; 0 en las demás. */
  hCols: number;
}
interface Inner {
  spec: GridSpec;
  lines: Line[];
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  shadow: ShadowCells;
  aura: AuraCells;
  glow: Uint8Array;
  dens: Uint8Array;
  fx: Int16Array;
  fy: Int16Array;
  fd: Uint8Array;
  fh: Uint8Array;
  top: number;
  rows: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
  mobile: boolean;
  /** Densidad de acento 0,45..1: menos caracteres en la pared de la H cuando la palabra cubre mucha pantalla. */
  acc: number;
  /** Con aire de sobra (la palabra cubre ≤ 14 % de una rejilla de ≥ 6 000 celdas) la luz de borde, el menisco y la cresta suben un peldaño; si no, §5.4 los baja. */
  hi: boolean;
  /** Fila de la base de la palabra: desde ahí la bruma se apaga hacia abajo (mistDuo `yFade`). */
  yFade: number;
}
const INNER = new WeakMap<SceneState, Inner>();

const G_TILDE = glyphIndex("~");
const G_DASH = glyphIndex("-");
const G_SLASH = glyphIndex("/");
const G_BACK = glyphIndex("\\");
const G_FULL = glyphIndex("█");

/** El aro: igual que el de la portada (luz de borde T11, pared más luminosa que la de la base de bloques). */
const RING_DUO: RingTones = { edge: 9, skin: 10, light: 11, lit: 11, dark: 8 };
/** Con poco aire (la palabra cubre más del 14 % de la pantalla) la luz de borde baja un peldaño: §5.4 mide el primer plano de la piel. */
const RING_DUO_LOW: RingTones = { edge: 9, skin: 9, light: 10, lit: 11, dark: 8 };
/** Pantallas casi llenas de palabra (1600×720: acc < 0,6): la pared vuelve a los tonos de la base de bloques sólidos. */
const RING_DUO_TIGHT: RingTones = { edge: 8, skin: 9, light: 10, lit: 10, dark: 7 };
const AURA_BG = [8, 6] as const;
/** Tono del glifo de la cresta: base · alta · espuma. Con poco aire (la palabra cubre más del 14 % de la pantalla) baja un peldaño: §5.4 mide el primer plano. */
const CREST_HI = [10, 12, 13] as const;
const CREST_LO = [8, 10, 12] as const;

/** Columnas (exclusivas) de la primera letra: hasta la primera columna vacía tras la tinta. */
function firstLetterCols(w: WordSet["lines"][number]): number {
  let seen = false;
  for (let x = 0; x < w.cols; x++) {
    let ink = false;
    for (let y = 0; y < w.rows && !ink; y++) ink = w.cells[y * w.cols + x] !== 0;
    if (ink) seen = true;
    else if (seen) return x;
  }
  return w.cols;
}

// ---- las olas ----
const WAVE_PERIOD = 3.6;
const WAVE_AMP = 2.0;
const WAVE_K = 0.125;
const RIPPLE_K = 0.47;

/** Mitad del grosor de la cresta en periodos: 0,5 fila ⇒ la cresta ocupa UNA celda por columna (línea continua, no puntos sueltos). */
const CREST = 0.5 / WAVE_PERIOD;

/**
 * Luz de una raya de ola: −1 en la cresta (una celda por columna), y 4,5..9,5 en el cuerpo (curva de sierra: cae hacia el seno, justo antes de la siguiente cresta).
 */
function waveLight(psi: number): number {
  let u = psi / WAVE_PERIOD;
  u -= Math.floor(u);
  if (u < CREST || u > 1 - CREST) return -1;
  const v = 1 - (u - CREST) / (1 - 2 * CREST);
  return 4.5 + 5 * v * v;
}

export const hola: Scene = {
  id: "hola",
  dawn: 0.15,
  arrival: { ms: 900 },
  build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
    const st = makeState(spec);
    const mobile = spec.cols < 90;
    const yTop = mobile || spec.rows < 44 ? 3 : 4;
    const lines: Line[] = layoutLines(spec, words[0], yTop, mobile ? 2 : 1).map((p, i): Line => ({
      x0: p.x0, y0: p.y0, word: p.word, face: faceFn(p.word, p.x0, p.y0), hCols: i === 0 ? firstLetterCols(p.word) : 0,
    }));
    let minY = 1e9;
    let maxY = -1;
    let inkCells = 0;
    for (const l of lines) for (let i = 0; i < l.word.cells.length; i++) if (l.word.cells[i] !== 0) inkCells++;
    const acc = accentDensity(inkCells, spec.cols, spec.rows);
    const hi = acc >= 0.95 && spec.cols * spec.rows >= 6000;
      const ringT = hi ? RING_DUO : acc < 0.6 ? RING_DUO_TIGHT : RING_DUO_LOW;
    const ring = makeCells(spec.cols, spec.rows);
    const fx: number[] = [];
    const fy: number[] = [];
    const fd: number[] = [];
    const fh: number[] = [];
    for (const l of lines) {
      paintRing(ring, l.word, l.x0, l.y0, l.face, ringT, (hi ? 0.3 : 0.2) * acc, hi ? 2 : 1);
      stampCls(st.cls, spec.cols, spec.rows, l.face);
      minY = Math.min(minY, l.y0);
      maxY = Math.max(maxY, l.y0 + l.word.rows);
      for (let y = 0; y < l.word.rows; y++) {
        for (let x = 0; x < l.word.cols; x++) {
          const i = y * l.word.cols + x;
          // en «OLA» las olas llenan también la pared del aro (celdas llenas contiguas al borde): solo queda la piel (celdas parciales)
          const wall = l.face.cls[i] === C_EDGE && l.word.cells[i] === 15 && x >= l.hCols;
          if (wall) {
            const k = ((l.y0 + y) * spec.cols + (l.x0 + x)) << 2;
            ring.b[k] = 0;
            ring.b[k + 1] = 0;
            ring.b[k + 3] = 0;
          } else if (l.face.cls[i] !== C_FACE) continue;
          fx.push(l.x0 + x);
          fy.push(l.y0 + y);
          fd.push(Math.min(255, l.face.dist[i]));
          fh.push(x < l.hCols ? 1 : 0);
        }
      }
    }
    const ringPos: number[] = [];
    const ringGl: number[] = [];
    const ringTn: number[] = [];
    for (let y = 0; y < spec.rows; y++) {
      for (let x = 0; x < spec.cols; x++) {
        const k = (y * spec.cols + x) << 2;
        if (ring.b[k] === 0) continue;
        ringPos.push(x | (y << 16));
        ringGl.push(ring.b[k]);
        ringTn.push(ring.b[k + 1]);
      }
    }
    const dist = distField(spec.cols, spec.rows, lines);
    const shadow = bakeShadow(spec.cols, spec.rows, lines);
    const enclosed = enclosedCells(spec.cols, spec.rows, lines);
      const aura = bakeAura(dist, spec.cols, spec.rows, shadow, 1.01, mobile ? 1.01 : 2.01, enclosed);
    for (let n = 0; n < shadow.pos.length; n++) {
      const i = (shadow.pos[n] >> 16) * spec.cols + (shadow.pos[n] & 0xffff);
      if (st.cls[i] === 0) st.cls[i] = 3;
    }
    for (let n = 0; n < aura.pos.length; n++) {
      const i = (aura.pos[n] >> 16) * spec.cols + (aura.pos[n] & 0xffff);
      if (st.cls[i] === 0) st.cls[i] = 3;
    }
    const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
    const dens = clusterField(spec.cols, spec.rows, 77, 0.12, 0.42, Math.min(maxY + 5, (spec.rows >> 1) - 2));
    for (let i = 0; i < dens.length; i++) if (enclosed[i] === 1) dens[i] = 0; // los contrapunzones quedan oscuros (figura y fondo)
    INNER.set(st, {
      spec,
      lines,
      ringPos: Int32Array.from(ringPos),
      ringGl: Uint8Array.from(ringGl),
      ringTn: Uint8Array.from(ringTn),
      shadow,
      aura,
      glow: glowFromDist(dist, 3.6),
      dens,
      fx: Int16Array.from(fx),
      fy: Int16Array.from(fy),
      fd: Uint8Array.from(fd),
      fh: Uint8Array.from(fh),
      top: minY,
      rows: maxY - minY,
      cx: spec.cols / 2,
      cy: (minY + maxY) / 2 + 1,
      rx: Math.min(spec.cols * 0.5, 74) * k * 1.06,
      ry: Math.min(spec.rows * (mobile ? 0.34 : 0.42), mobile ? 19 : 15.5) * k * 1.06,
      k2: k * k,
      mobile,
      acc,
      hi,
      yFade: maxY,
    });
    return st;
  },
  paint(g: Cells, s: SceneState, f: Frame): void {
    const I = INNER.get(s) as Inner;
    const { p, t } = f;
    const tl = waterTile();
    const cols = I.spec.cols;
    clear(g, 0);
    // 1 · bruma de caracteres (con el `dawn` de la escena: un poco más ancha y luminosa que la de la portada)
    mistDuo(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx, ry: I.ry, gain: 1.5, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.9 * I.k2, dens: I.dens, heat: f.heat, yFade: I.yFade }, t, tl);
    // 2 · aura (fondo de luz pegado al trazo) y sombra de una celda (al final de la llegada)
    {
      const a = smooth(0.1, 0.5, p) * 256;
      for (let n = 0; n < I.aura.pos.length; n++) {
        if (I.aura.rt[n] >= a) continue;
        const x = I.aura.pos[n] & 0xffff;
        const y = I.aura.pos[n] >> 16;
        const hh = hu(x, y, 34);
        const bg = AURA_BG[I.aura.tier[n]];
        if ((hh & 255) < 70) putDuo(g, x, y, 1 + ((hh >>> 8) & 1), hh >>> 12, 8, bg);
        else put(g, x, y, 0, bg, bg);
      }
    }
    if (p > 0.6) {
      const a = smooth(0.6, 0.95, p) * 256;
      for (let n = 0; n < I.shadow.pos.length; n++) {
        if (I.shadow.rt[n] >= a) continue;
        const x = I.shadow.pos[n] & 0xffff;
        const y = I.shadow.pos[n] >> 16;
        const sh = hu(x, y, 31);
        if ((sh & 255) < 90) putDuo(g, x, y, 2, sh >>> 8, 2, 1);
        else put(g, x, y, 0, 1, 1);
      }
    }
    // 3 · aro de luz: la piel de cuadrantes y la pared de la H (con sus caracteres grabados)
    for (let n = 0; n < I.ringPos.length; n++) {
      const x = I.ringPos[n] & 0xffff;
      const y = I.ringPos[n] >> 16;
      if (I.ringGl[n] === G_FULL) putWall(g, x, y, I.ringTn[n], hu(x, y, 23), I.acc);
      else put(g, x, y, I.ringGl[n], I.ringTn[n]);
    }
    // 4 · caras: la H es agua quieta (masa con un grano de caracteres); «OLA» son olas de caracteres que ganan amplitud con p
    const amp = smooth(0.3, 1, p);
    const caustic = smooth(0.3, 0.8, p);
    const A = (I.mobile ? 1.2 : WAVE_AMP) * amp;
    const phase = t * 0.9;
    const heat = f.heat;
    for (let n = 0; n < I.fx.length; n++) {
      const x = I.fx[n];
      const y = I.fy[n];
      const h = heat === null ? 0 : heat[y * cols + x];
      if (I.fh[n] === 1) {
        // H: agua cobalto con cáusticas (+2 tonos con el calor) y un grano de caracteres: uno de cada tres siempre, el resto con ruido azul
        const c = caustic * agua(tl, x, y, t);
        let tn = waterTone(6, (y - I.top) / I.rows, I.fd[n], c);
        if (h > 0.05) tn += Math.round(2 * h);
        tn = tn > 15 ? 15 : tn < 1 ? 1 : tn;
        const hh = hu(x, y, 43);
        if ((x + 2 * y) % 3 === 0 || bn(x, y) < 0.34) putDuo(g, x, y, 1 + ((hh >>> 4) % 3), hh, inkTone(tn, 1), tn);
        else put(g, x, y, G_FULL, tn);
        continue;
      }
      // «OLA»: rayas de ola que ondulan; el calor agranda la amplitud y mueve la fase localmente
      const a1 = WAVE_K * x + phase + h * 2.5;
      const a2 = RIPPLE_K * x - phase * 1.7 + h * 2.5;
      const psi = y + A * (1 + h) * (sinp(a1) + 0.22 * sinp(a2));
      const w = waveLight(psi);
      const hh = hu(x, y, 41);
      if (w < 0) {
        // cresta: línea de `~` brillante; donde la ola sube o baja deprisa, el trazo se inclina (`/` `\`)
        const sl = A * (1 + h) * (WAVE_K * cosp(a1) + 0.22 * RIPPLE_K * cosp(a2)) * 2;
        let gl = (hh & 3) === 0 ? G_DASH : G_TILDE;
        if (sl > 0.88) gl = G_SLASH;
        else if (sl < -0.88) gl = G_BACK;
        const sp = (hh >>> 8) % 12; // espuma en 1 de cada 12 · cresta alta en 4 de cada 12 · el resto, en el peldaño base (con poco aire la cresta es más oscura: la luz vive en el fondo T9)
        const cf = I.hi ? CREST_HI : CREST_LO;
        put(g, x, y, gl, sp === 0 ? cf[2] : sp < 5 ? cf[1] : cf[0], 9);
        continue;
      }
      // cuerpo de la ola: la losa de agua sigue a la ola (fondo T4..T9 según su luz) y el carácter baja con la luz hacia el seno (`+ =` junto a la cresta, `:` y `.` al fondo)
      let lv = Math.round((w - 4.6) * 1.1);
      lv = lv < 1 ? 1 : lv > 5 ? 5 : lv;
      let bg = Math.round(w - 0.4);
      bg = bg < 4 ? 4 : bg > 9 ? 9 : bg;
      putDuo(g, x, y, lv, hh >>> 2, inkTone(bg, lv), bg);
    }
    applyRings(g, f.rings, 2);
  },
};

export default hola;
