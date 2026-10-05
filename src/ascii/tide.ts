// La marea: la costura entre carteles (DIRECTION §6.4, §6.5). Una línea de agua ondulada que sube (avance) o baja (retroceso)
// por la pantalla, deshace el cartel que sale y cristaliza el que llega.
//
//   · `front` y `compose` son PURAS: mismo (yb, t, celdas) ⇒ mismo cuadro. Las reglas por celda son las cinco zonas de §6.4.
//   · `Tide` es el reloj: corre POR TIEMPO, no por dedo (R12). El scroll solo la dispara; una vez disparada, termina sola a los
//     1,4 s (avance) o 1,0 s (retroceso) aunque el scroll se detenga a mitad. Política de interrupciones: se termina la marea en
//     curso y se encola UNA pendiente; las intermedias se descartan.
//
// El agua de la marea es TEXTO, como el resto del estilo Duotono: la banda es movimiento de la rampa de caracteres (`. : ; = +`) sobre un fondo de agua y la espuma
// (`*` y `~`, con su propio fondo de agua) no pasa de T12. Aquí no hay póster SSR, pero todo usa enteros, el ruido de noise.ts y `sinp`, así que el hash dorado de la
// marea no depende del motor.
import type { Cells } from "./types.ts";
import { glyphIndex } from "./glyphs.ts";
import { agua, bn, clamp01, easeInOut, waterTile } from "./kit.ts";
import { fbm, h2, sinp } from "./noise.ts";
import { DUO_RAMP } from "./scenes/ramp.ts";

/** Semiamplitud máxima de la ondulación del frente: |front(x, yb) − yb| ≤ 7,7 < 8. */
export const FRONT_AMPLITUDE = 8;
/** Duración del frente: avance 1,4 s, retroceso 1,0 s (ms). */
export const TIDE_ADVANCE_MS = 1400;
export const TIDE_RETREAT_MS = 1000;
/** El entrante empieza su guion a los 0,35·T del frente. */
export const TIDE_LEAD = 0.35;

export interface TideParams {
  /** Semiancho de la banda de agua, en filas. */
  band: number;
  /** Alcance de deshacer y formar, en filas. */
  reach: number;
}
export const tideParams = (mobile: boolean): TideParams => (mobile ? { band: 3, reach: 9 } : { band: 4, reach: 12 });

/** Fila del frente en la columna x cuando la línea media está en la fila `yb` (±7 filas de ondulación). */
export function front(x: number, yb: number): number {
  return yb + 14 * (fbm(x * 0.05, 3.7, 3, 9) - 0.47) + 1.1 * sinp(x * 0.12);
}

export interface TideOpts {
  band: number;
  reach: number;
  /** Fase del agua (s), la misma `t` del Frame. */
  t: number;
  /** 1 = avance (el saliente arriba del frente, el entrante debajo); −1 = retroceso (al revés). */
  dir?: 1 | -1;
  /** Memoria de tono de la banda (1 byte por celda, tono·16; 0 = vacía). El motor la pone a cero al empezar cada marea. */
  mem?: Uint8Array | null;
  /** Coeficiente de la memoria exponencial 1 − e^(−12·dt) (0..1); con `mem` suaviza el tono de la banda (WCAG 2.3.1). */
  k?: number;
  /** Tesela de agua; por defecto la compartida del kit. */
  tile?: Uint8Array | null;
  /** Escala de la espuma (1 = `*` 10 % y `~` 40 % en ±1 fila del frente; 0 = sin espuma). */
  foam?: number;
}

/** Glifos de la marea: la rampa de caracteres del estilo Duotono (`. : ; = +`) y la espuma (`*` y `~`, que son de la espuma y las olas). */
const G_STAR = DUO_RAMP[5 * 4]; // `*`
const G_TILDE = glyphIndex("~");
/** Tope de tono de la banda de agua: T12 (la espuma de `*` T14 del primer diseño era «terminal»: ver docs/ascii/reports/WP6c.md). */
const BAND_MAX = 12;

// Cachés por tamaño (se rehacen al cambiar cols·rows, NUNCA por cuadro): el umbral τ de cada celda y el frente por columna.
let TAU: Uint8Array = new Uint8Array(0);
let TAU_COLS = 0;
let TAU_ROWS = 0;
let FR: Float64Array = new Float64Array(0);

/**
 * Umbral por celda 0..255: τ = 0,55·bn + 0,45·fbm (normalizados), anclado a la CELDA (no al tiempo) para que la marea no
 * «nade». Exportado para que las pruebas comprueben las reglas de deshacer y formar contra el mismo umbral.
 */
export function tau(cols: number, rows: number): Uint8Array {
  if (TAU_COLS !== cols || TAU_ROWS !== rows) {
    TAU = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = 0.55 * bn(x, y) + 0.45 * (fbm(x * 0.09, y * 0.18, 2, 5) / 0.75);
        TAU[y * cols + x] = v >= 1 ? 255 : Math.round(v * 255);
      }
    }
    TAU_COLS = cols;
    TAU_ROWS = rows;
  }
  return TAU;
}

/** Escribe una celda de la marea directamente en el búfer (la marea escribe bytes, no llama a `put`): glifo, primer plano, fondo explícito. */
function wr(ob: Uint8Array, j: number, gl: number, fg: number, bg: number): void {
  ob[j] = gl;
  ob[j + 1] = fg > BAND_MAX ? BAND_MAX : fg;
  ob[j + 2] = bg > 15 ? 15 : bg < 0 ? 0 : bg;
  ob[j + 3] = bg > 0 ? 3 : 1;
}

/**
 * Compone un cuadro de marea en `out` (no puede ser el mismo objeto que `outgoing` ni `incoming`). `dist = (y − front) · dir`:
 *   dist < −band−reach        el saliente tal cual (el `still` cacheado)
 *   −band−reach ≤ dist < −band  el saliente SE DESHACE: primero el interior, al final el aro → agua de caracteres `; " + =` sobre fondo de agua T4–T7
 *   |dist| ≤ band              banda de agua: densidad de la rampa (`. : ; = +`) según la cresta del agua, fondo T2–T8, espuma `~` y `*` (fondo T8) a ±1 fila
 *   band < dist ≤ band+reach   el entrante CRISTALIZA: primero el aro, después la cara (lo que falta es agua que se retira: `. : ; =` en tonos bajos)
 *   dist > band+reach          el entrante en su `paint(p)`
 * `clsOut`/`clsIn` son los `SceneState.cls` de cada escena (0 aire · 1 cara · 2 borde · 3 sombra/aura): solo cara y borde se
 * deshacen; el aire y la atmósfera (bruma, aura, sombra) del entrante aparecen sin retraso y los del saliente se quedan
 * hasta que los cubre la banda.
 */
export function compose(out: Cells, outgoing: Cells, incoming: Cells, clsOut: Uint8Array, clsIn: Uint8Array, yb: number, o: TideOpts): void {
  const cols = out.cols;
  const rows = out.rows;
  const band = o.band;
  const reach = o.reach;
  const A = band + reach;
  const t = o.t;
  const tile = o.tile ?? waterTile();
  const sgn = o.dir === -1 ? -1 : 1;
  const mem = o.mem ?? null;
  const k256 = o.k === undefined ? 256 : Math.round(clamp01(o.k) * 256);
  const foam = o.foam === undefined ? 1 : o.foam;
  const t2 = t * 2; // la espuma elige su glifo como mucho 2 veces por segundo por celda (2.3.1), cada celda en SU instante (ver abajo)
  const tauMap = tau(cols, rows);
  if (FR.length < cols) FR = new Float64Array(cols);
  for (let x = 0; x < cols; x++) FR[x] = front(x, yb);
  const ou = out.u;
  const gu = outgoing.u;
  const iu = incoming.u;
  const ob = out.b;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dist = (y - FR[x]) * sgn;
      if (dist < -A) {
        ou[i] = gu[i];
        if (mem !== null) mem[i] = 0;
        continue;
      }
      if (dist > A) {
        ou[i] = iu[i];
        if (mem !== null) mem[i] = 0;
        continue;
      }
      const j = i << 2;
      if (dist < -band) {
        // el saliente se deshace
        if (mem !== null) mem[i] = 0;
        const c = clsOut[i];
        if (c === 1 || c === 2) {
          const p = (dist + A) / reach;
          if (p * (c === 2 ? 0.75 : 1.1) * 255 > tauMap[i]) {
            const cres = agua(tile, x, y, t);
            let tn = 5 + ((cres * 1.5 + p * 1.8) | 0);
            if (tn > 8) tn = 8;
            const lv = cres > 0.6 ? 4 : 3;
            wr(ob, j, DUO_RAMP[(lv << 2) | (((x * 7 + y * 3) >> 1) & 3)], tn + 2, tn - 1);
            continue;
          }
        }
        ou[i] = gu[i];
        continue;
      }
      if (dist <= band) {
        // banda de agua
        const ad = dist < 0 ? -dist : dist;
        const cres = agua(tile, x, y, t);
        let d = cres * 0.8 + 0.35 * (1 - ad / band);
        d = d > 1 ? 1 : d < 0 ? 0 : d;
        if (foam > 0 && ad <= 1) {
          // fase propia de la celda: el «tic» de cada celda cae en un instante distinto, así la espuma centellea celda a celda y nunca
          // como un pulso síncrono de toda la línea (con un tic común cada medio segundo se veía un parpadeo global de ~2 Hz)
          const r = h2(x, y, 40 + ((t2 + h2(x, y, 39)) | 0)) / foam;
          if (r < 0.1) {
            wr(ob, j, G_STAR, ad <= 0.5 ? 12 : 11, 8);
            if (mem !== null) mem[i] = 0;
            continue;
          }
          if (r < 0.5) {
            wr(ob, j, G_TILDE, ad <= 0.5 ? 12 : 11, 8);
            if (mem !== null) mem[i] = 0;
            continue;
          }
        }
        let tn16 = (4 + Math.round(6 * d)) << 4;
        if (mem !== null) {
          const m = mem[i];
          tn16 = m === 0 ? tn16 : m + (((tn16 - m) * k256) >> 8);
          mem[i] = tn16;
        }
        const tn = (tn16 + 8) >> 4; // 4..10: la luz de la celda
        const lv = 1 + ((d * 3.99) | 0); // `. : ; = +` según la cresta del agua (sin `x X *`: eso es espuma)
        wr(ob, j, DUO_RAMP[(lv << 2) | (((x * 5 + y * 11) >> 1) & 3)], tn + 2, tn - 2);
        continue;
      }
      // el entrante cristaliza (dist en (band, A])
      if (mem !== null) mem[i] = 0;
      const c = clsIn[i];
      if (c === 0) {
        ou[i] = iu[i];
        continue;
      }
      const p = (dist - band) / reach;
      if (p * (c === 1 ? 0.9 : 1.3) * 255 >= tauMap[i]) {
        ou[i] = iu[i];
        continue;
      }
      // lo que todavía no cristalizó es agua que se retira
      const w = (1 - p) * (0.35 + 0.65 * agua(tile, x, y, t));
      const wi = w < 0.2 ? 0 : w < 0.4 ? 1 : w < 0.6 ? 2 : 3;
      wr(ob, j, DUO_RAMP[((1 + wi) << 2) | (((x * 3 + y * 13) >> 1) & 3)], 3 + wi, wi > 1 ? wi - 1 : 0);
    }
  }
}

// ---------- el reloj de la marea ----------

export interface TideState {
  /** El frente está en pantalla (hay que componer `from` → `to` con `yb`). */
  active: boolean;
  /** La escena entrante sigue con su guion (p < 1) después o durante el frente. */
  arriving: boolean;
  from: number;
  to: number;
  dir: 1 | -1;
  /** Tiempo normalizado del frente 0..1 y su curva de entrada y salida. */
  u: number;
  e: number;
  /** Fila media del frente (para `compose`). */
  yb: number;
  /** p del cartel entrante (0..1); 1 cuando todo terminó. */
  p: number;
  /** Cartel mostrado (destino de la última marea terminada, o el de origen si aún no ha llegado ninguna). */
  cur: number;
  /** Hay una marea en cola. */
  queued: boolean;
}

/** p del entrante: arranca a los 0,35·T y dura `arrivalMs`; al retroceder el cartel reaparece de 0,5 a 1 en la mitad de tiempo. */
export function arrivalP(elapsedS: number, durS: number, arrivalMs: number, dir: 1 | -1): number {
  const t = elapsedS - TIDE_LEAD * durS;
  if (dir === 1) return clamp01(t / (arrivalMs / 1000));
  return 0.5 + 0.5 * clamp01(t / (arrivalMs / 2000));
}

/** Fila media del frente para un tiempo normalizado u: el frente entra y sale por completo de la pantalla en los extremos. */
export function tideYb(u: number, rows: number, band: number, reach: number, dir: 1 | -1): number {
  const M = band + reach + FRONT_AMPLITUDE;
  const e = easeInOut(u);
  return dir === 1 ? rows + M + (-(rows + 2 * M)) * e : -M + (rows + 2 * M) * e;
}

/**
 * Reloj y cola de mareas. Puro en (ms): nada de reloj interno. El motor llama `request(target, ahora, arrivalMs)` cuando el
 * cartel objetivo cambia y `update(ahora, rows, band, reach)` en cada cuadro.
 */
export class Tide {
  cur: number;
  pending: number = -1;
  pendingArrival: number = 1400;
  active: boolean = false;
  from: number = 0;
  to: number = 0;
  dir: 1 | -1 = 1;
  t0: number = 0;
  dur: number = 0;
  arrival: number = 1400;
  settled: boolean = true;
  lastT0: number = 0;
  lastDur: number = 0;
  lastDir: 1 | -1 = 1;
  lastArrival: number = 1400;
  state: TideState = { active: false, arriving: false, from: 0, to: 0, dir: 1, u: 1, e: 1, yb: 0, p: 1, cur: 0, queued: false };

  constructor(start: number = 0) {
    this.cur = start;
    this.from = start;
    this.to = start;
  }

  /** Corte seco (movimiento reducido, `still`): el cartel pasa a ser `target` sin frente ni guion. */
  snap(target: number): void {
    this.cur = target;
    this.from = target;
    this.to = target;
    this.active = false;
    this.pending = -1;
    this.settled = true;
  }

  private begin(target: number, now: number, arrivalMs: number): void {
    this.from = this.cur;
    this.to = target;
    this.dir = target > this.cur ? 1 : -1;
    this.t0 = now;
    this.dur = this.dir === 1 ? TIDE_ADVANCE_MS : TIDE_RETREAT_MS;
    this.arrival = arrivalMs;
    this.active = true;
    this.settled = false;
  }

  /**
   * El cartel objetivo cambió. Sin marea en curso arranca una; con una en curso se conserva hasta el final (≤ 1,4 s) y se
   * encola UNA pendiente (la última pedida): las intermedias se descartan.
   */
  request(target: number, now: number, arrivalMs: number = 1400): void {
    if (!this.active) {
      if (target !== this.cur) this.begin(target, now, arrivalMs);
      return;
    }
    if (target === this.to) this.pending = -1;
    else {
      this.pending = target;
      this.pendingArrival = arrivalMs;
    }
  }

  /** Avanza el reloj a `now` (ms). Devuelve el MISMO objeto de estado en cada llamada (sin asignaciones por cuadro). */
  update(now: number, rows: number, band: number, reach: number): TideState {
    // cierra todas las mareas cuyo final ya pasó; la pendiente arranca EXACTAMENTE cuando terminó la anterior
    while (this.active && now >= this.t0 + this.dur) {
      const end = this.t0 + this.dur;
      this.lastT0 = this.t0;
      this.lastDur = this.dur;
      this.lastDir = this.dir;
      this.lastArrival = this.arrival;
      this.cur = this.to;
      this.active = false;
      if (this.pending >= 0 && this.pending !== this.cur) {
        const target = this.pending;
        this.pending = -1;
        this.begin(target, end, this.pendingArrival);
      } else this.pending = -1;
    }
    const s = this.state;
    s.cur = this.cur;
    s.queued = this.pending >= 0;
    if (this.active) {
      const elapsed = (now - this.t0) / 1000;
      const u = clamp01((now - this.t0) / this.dur);
      s.active = true;
      s.from = this.from;
      s.to = this.to;
      s.dir = this.dir;
      s.u = u;
      s.e = easeInOut(u);
      s.yb = tideYb(u, rows, band, reach, this.dir);
      s.p = arrivalP(elapsed, this.dur / 1000, this.arrival, this.dir);
      s.arriving = true;
    } else {
      s.active = false;
      s.from = this.cur;
      s.to = this.cur;
      s.u = 1;
      s.e = 1;
      s.yb = 0;
      s.dir = this.lastDir;
      if (this.settled) s.p = 1;
      else {
        s.p = arrivalP((now - this.lastT0) / 1000, this.lastDur / 1000, this.lastArrival, this.lastDir);
        if (s.p >= 1) this.settled = true;
      }
      s.arriving = s.p < 1;
    }
    return s;
  }
}
