// La marea de la Variante A · Duotono ANSI (copia adaptada de tide.ts `compose`; OPCIONAL: la marea compartida también sirve con las escenas de la
// variante, pero su banda de agua es de tramas `░▒▓` con la espuma sobre fondo T0, y en medio de escenas de caracteres se ve ajena).
//
// Mismas zonas, mismos umbrales y misma geometría (§6.4): lo único que cambia es la MATERIA de la banda, el deshacer y el formar. El agua de la banda
// es movimiento de la rampa (más densidad de carácter = más luz: `. : ~ = + *`) en duotono sobre un fondo de agua, y la espuma `*` y `~` lleva su
// propio fondo de agua (no una celda negra). Para engancharla al motor: `compose` de tide.ts → `composeA` (misma firma).
import type { Cells } from "../../../types.ts";
import type { TideOpts } from "../../../tide.ts";
import { front, tau } from "../../../tide.ts";
import { agua, clamp01, waterTile } from "../../common.ts";
import { h2 } from "../../common.ts";
import { RAMP } from "./ramp.ts";

const G_STAR = RAMP[5 * 4]; // `*`
const G_TILDE = RAMP[3 * 4]; // `~`

let FR: Float64Array = new Float64Array(0);

/** Escribe una celda duotono directamente en el búfer (la marea escribe bytes, no llama a `put`): glifo, primer plano, fondo explícito. */
function wr(ob: Uint8Array, j: number, gl: number, fg: number, bg: number): void {
  ob[j] = gl;
  ob[j + 1] = fg > 15 ? 15 : fg;
  ob[j + 2] = bg > 15 ? 15 : bg < 0 ? 0 : bg;
  ob[j + 3] = bg > 0 ? 3 : 1;
}

/**
 * Compone un cuadro de marea en `out` (igual que `compose` de tide.ts; no puede ser el mismo objeto que `outgoing` ni `incoming`):
 *   saliente que se deshace → agua de caracteres `~ ; = +` sobre fondo de agua (primero el interior, al final el aro)
 *   banda → densidad de la rampa según la cresta del agua, fondo T2–T7, espuma con fondo T8
 *   entrante que cristaliza → lo que aún no se formó es agua que se retira: `. : ~ =` en tonos bajos
 */
export function composeA(out: Cells, outgoing: Cells, incoming: Cells, clsOut: Uint8Array, clsIn: Uint8Array, yb: number, o: TideOpts): void {
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
            wr(ob, j, RAMP[(lv << 2) | (((x * 7 + y * 3) >> 1) & 3)], tn + 2, tn - 1);
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
          const r = h2(x, y, 40 + ((t2 + h2(x, y, 39)) | 0)) / foam;
          if (r < 0.45) {
            wr(ob, j, G_STAR, ad <= 0.5 ? 14 : 13, 8);
            if (mem !== null) mem[i] = 0;
            continue;
          }
          if (r < 0.75) {
            wr(ob, j, G_TILDE, ad <= 0.5 ? 13 : 12, 8);
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
        const lv = 1 + ((d * 5.99) | 0); // `. : ~ = + *` según la cresta del agua
        wr(ob, j, RAMP[(lv << 2) | (((x * 5 + y * 11) >> 1) & 3)], tn + 2, tn - 2);
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
      wr(ob, j, RAMP[((1 + wi) << 2) | (((x * 3 + y * 13) >> 1) & 3)], 3 + wi, wi > 1 ? wi - 1 : 0);
    }
  }
}
