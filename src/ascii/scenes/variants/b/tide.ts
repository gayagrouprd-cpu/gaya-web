// Variante B · la marea escrita con el nombre. Copia adaptada de `tide.ts › compose` (mismas cinco zonas de §6.4, mismo umbral τ anclado a la celda,
// mismo frente): lo que cambia es la MATERIA del agua. En vez de la banda de tramas `░▒▓` y de la espuma `* ~`, la banda es de la rampa del nombre
// (` · : = * y a A G`) sobre una losa de agua; lo que se deshace pasa a letras `* y a` y lo que cristaliza llega como puntuación `· : =`; la espuma de
// la cresta es `~` y `o O 0` (las olas de HOLA). Todo con enteros, el ruido de noise.ts y `sinp`: el cuadro es puro en (yb, t, celdas).
//
// Compone en `out` (distinto de `outgoing` e `incoming`). `clsOut`/`clsIn` son los `SceneState.cls` (0 aire · 1 cara · 2 borde · 3 sombra/halo).
import type { Cells } from "../../common.ts";
import { agua, bn, clamp01, h2, waterTile } from "../../common.ts";
import { front, tau } from "../../../tide.ts";
import type { TideOpts } from "../../../tide.ts";
import { G_A_UP, G_ZERO, G_o, G_O, G_TILDE, RAMP_GL, S_G, rampStep, G_DOT, G_COLON, G_EQ, G_STAR, G_a, G_y } from "./ramp.ts";

const WET: readonly number[] = [G_DOT, G_COLON, G_EQ, G_STAR];
/** Glifo de la letra de agua en que se deshace una celda del cartel que sale (por luz creciente). */
const MELT: readonly number[] = [G_STAR, G_y, G_a, G_A_UP];

let FR: Float64Array = new Float64Array(0);

export function composeB(out: Cells, outgoing: Cells, incoming: Cells, clsOut: Uint8Array, clsIn: Uint8Array, yb: number, o: TideOpts): void {
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
  const t2 = t * 2;
  const tauMap = tau(cols, rows);
  if (FR.length < cols) FR = new Float64Array(cols); // caché por tamaño: nunca se asigna por cuadro
  const fr = FR;
  for (let x = 0; x < cols; x++) fr[x] = front(x, yb);
  const ou = out.u;
  const gu = outgoing.u;
  const iu = incoming.u;
  const ob = out.b;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dist = (y - fr[x]) * sgn;
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
        // el saliente se deshace: primero el interior, al final el aro; la celda pasa a una letra de agua que se apaga hacia el frente
        if (mem !== null) mem[i] = 0;
        const c = clsOut[i];
        if (c === 1 || c === 2) {
          const p = (dist + A) / reach;
          if (p * (c === 2 ? 0.75 : 1.1) * 255 > tauMap[i]) {
            const cres = agua(tile, x, y, t);
            let tn = 5 + ((cres * 1.5 + p * 1.8) | 0);
            if (tn > 8) tn = 8;
            ob[j] = MELT[((cres * 2.2 + p * 1.6) | 0) & 3];
            ob[j + 1] = tn;
            ob[j + 2] = 3;
            ob[j + 3] = 3;
            continue;
          }
        }
        ou[i] = gu[i];
        continue;
      }
      if (dist <= band) {
        // banda de agua: la rampa del nombre por luz, sobre una losa que sube con ella
        const ad = dist < 0 ? -dist : dist;
        const cres = agua(tile, x, y, t);
        let d = cres * 0.8 + 0.35 * (1 - ad / band);
        d = d > 1 ? 1 : d < 0 ? 0 : d;
        if (foam > 0 && ad <= 1) {
          // espuma de la cresta: `~` y `o O 0`, cada celda cambia en SU instante (WCAG 2.3.1)
          const r = h2(x, y, 40 + ((t2 + h2(x, y, 39)) | 0)) / foam;
          if (r < 0.45) {
            ob[j] = G_TILDE;
            ob[j + 1] = ad <= 0.5 ? 13 : 12;
            ob[j + 2] = 5;
            ob[j + 3] = 3;
            if (mem !== null) mem[i] = 0;
            continue;
          }
          if (r < 0.7) {
            const q = (h2(x, y, 43) * 8) | 0;
            ob[j] = q < 2 ? G_ZERO : q < 5 ? G_O : G_o;
            ob[j + 1] = ad <= 0.5 ? 13 : 12;
            ob[j + 2] = 5;
            ob[j + 3] = 3;
            if (mem !== null) mem[i] = 0;
            continue;
          }
        }
        let tn16 = (5 + Math.round(6 * d)) << 4;
        if (mem !== null) {
          const m = mem[i];
          tn16 = m === 0 ? tn16 : m + (((tn16 - m) * k256) >> 8);
          mem[i] = tn16;
        }
        const step = rampStep(0.5 + d * (S_G - 1.5), bn(x, y), 0.8);
        ob[j] = RAMP_GL[step];
        ob[j + 1] = (tn16 + 8) >> 4;
        ob[j + 2] = d > 0.66 ? 5 : d > 0.33 ? 4 : 3;
        ob[j + 3] = 3;
        continue;
      }
      // el entrante cristaliza: lo que aún no llegó es agua que se retira, hecha de puntuación (· : = *)
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
      const w = (1 - p) * (0.35 + 0.65 * agua(tile, x, y, t));
      const wi = w < 0.2 ? 0 : w < 0.4 ? 1 : w < 0.6 ? 2 : 3;
      ob[j] = WET[wi];
      ob[j + 1] = 3 + wi;
      ob[j + 2] = wi >= 2 ? 3 : 2;
      ob[j + 3] = 3;
    }
  }
}

