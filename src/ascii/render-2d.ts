// Renderizador Canvas 2D de FOTOGRAMAS FIJOS (DIRECTION §6.10). No hay bucle vivo por CPU: se dibuja el fotograma entero una vez por
// cambio de cartel, partido en dos cuadros por filas para que ninguna tarea pase de 50 ms con la CPU estrangulada.
//   · bloques, cuadrantes, octavos y cajas rectas: `fillRect` con los MISMOS rectángulos que el atlas (atlas.ts) ⇒ idéntico al GL;
//   · `░ ▒ ▓`: `createPattern` anclado al origen del lienzo ⇒ la misma trama por píxel absoluto que el shader;
//   · ASCII, diagonales y redondeadas: baldosas teñidas (máscara del atlas × tono, `source-in`), horneadas bajo demanda y cacheadas.
// Nunca `getImageData`, nunca `globalCompositeOperation = 'copy'`, nunca `fillText` en el lienzo principal (R05 §7).
import type { Cells } from './types.ts';
import type { Atlas } from './atlas.ts';
import { ATLAS_COLS, K_MASK, K_RECTS, K_SHADE, shadeLevel } from './atlas.ts';
import { G_FULL } from './glyphs.ts';
import type { Renderer } from './render-gl.ts';

type Ctx = CanvasRenderingContext2D;
type Cv = HTMLCanvasElement;
const mk = (w: number, h: number): Cv => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const TW = 32; // baldosas por fila de la hoja

/** `ctx` ya obtenido del lienzo (2D). `pal` = RGB de los 16 tonos. */
export function createR2D(ctx: CanvasRenderingContext2D, atlas: Atlas, cols: number, rows: number, pal: readonly (readonly number[])[]): Renderer {
  const { cw, ch, t, kind, rects } = atlas;
  const css = pal.map((c) => `rgb(${c[0]},${c[1]},${c[2]})`);
  ctx.imageSmoothingEnabled = false;
  let sheetRows = 8;
  let sheet = mk(TW * cw, sheetRows * ch);
  let sx = sheet.getContext('2d') as Ctx;
  const tmp = mk(cw, ch);
  const tx = tmp.getContext('2d') as Ctx;
  const ids = new Map<number, number>();
  const pats = new Map<number, CanvasPattern>();
  const snap = new Uint8Array(cols * rows * 4);
  let token = 0;

  const tile = (gl: number, fg: number): number => {
    const key = gl | (fg << 8);
    let id = ids.get(key);
    if (id !== undefined) return id;
    id = ids.size;
    ids.set(key, id);
    if (id >= TW * sheetRows) {
      const old = sheet;
      sheetRows *= 2;
      sheet = mk(TW * cw, sheetRows * ch);
      sx = sheet.getContext('2d') as Ctx;
      sx.drawImage(old as CanvasImageSource, 0, 0);
    }
    tx.globalCompositeOperation = 'source-over';
    tx.clearRect(0, 0, cw, ch);
    tx.drawImage(atlas.canvas as CanvasImageSource, (gl % ATLAS_COLS) * cw, Math.floor(gl / ATLAS_COLS) * ch, cw, ch, 0, 0, cw, ch);
    tx.globalCompositeOperation = 'source-in';
    tx.fillStyle = css[fg];
    tx.fillRect(0, 0, cw, ch);
    sx.drawImage(tmp as CanvasImageSource, (id % TW) * cw, Math.floor(id / TW) * ch);
    return id;
  };

  // trama de una sombra (nivel 1..3) en un tono: baldosa de 2t × 2t con puntos de t px
  const pattern = (level: number, fg: number): CanvasPattern => {
    const key = level * 16 + fg;
    let p = pats.get(key);
    if (!p) {
      const c = mk(2 * t, 2 * t);
      const x = c.getContext('2d') as Ctx;
      x.fillStyle = css[fg];
      for (let q = 0; q < 4; q++) {
        const a = q & 1;
        const b = q >> 1;
        if (level === 1 ? a + b === 0 : level === 2 ? a === b : a + b < 2) x.fillRect(a * t, b * t, t, t);
      }
      pats.set(key, (p = ctx.createPattern(c as CanvasImageSource, 'repeat')!));
    }
    return p;
  };

  const drawRows = (b: Uint8Array, y0: number, y1: number): void => {
    ctx.fillStyle = css[0];
    ctx.fillRect(0, y0 * ch, cols * cw, (y1 - y0) * ch);
    for (let y = y0; y < y1; y++) {
      const py = y * ch;
      const row = y * cols * 4;
      // fondos: corridas del mismo tono (casi siempre T0, que ya está)
      for (let x = 0, e = 0; x < cols; x = e) {
        const bg = b[row + x * 4 + 2];
        for (e = x + 1; e < cols && b[row + e * 4 + 2] === bg; e++);
        if (bg !== 0) {
          ctx.fillStyle = css[bg];
          ctx.fillRect(x * cw, py, (e - x) * cw, ch);
        }
      }
      for (let x = 0; x < cols; x++) {
        const i = row + x * 4;
        const gl = b[i];
        if (gl === 0) continue;
        const fg = b[i + 1] & 15;
        const px = x * cw;
        const k = kind[gl];
        if (gl === G_FULL) {
          let e = x + 1;
          while (e < cols && b[row + e * 4] === gl && (b[row + e * 4 + 1] & 15) === fg) e++;
          ctx.fillStyle = css[fg];
          ctx.fillRect(px, py, (e - x) * cw, ch);
          x = e - 1;
        } else if (k === K_RECTS) {
          const r = rects[gl]!;
          ctx.fillStyle = css[fg];
          for (let n = 0; n < r.length; n += 4) ctx.fillRect(px + r[n], py + r[n + 1], r[n + 2], r[n + 3]);
        } else if (k === K_SHADE) {
          ctx.fillStyle = pattern(shadeLevel(gl), fg);
          ctx.fillRect(px, py, cw, ch);
        } else if (k === K_MASK) {
          const id = tile(gl, fg);
          ctx.drawImage(sheet as CanvasImageSource, (id % TW) * cw, Math.floor(id / TW) * ch, cw, ch, px, py, cw, ch);
        }
      }
    }
  };

  return {
    kind: '2d',
    draw(g) {
      snap.set(g.b); // el fotograma no cambia entre los dos cuadros aunque el motor siga pintando
      const my = ++token;
      const mid = rows > 16 ? rows >> 1 : rows;
      drawRows(snap, 0, mid);
      if (mid >= rows) return;
      return new Promise<void>((done) =>
        requestAnimationFrame(() => {
          if (my === token) drawRows(snap, mid, rows);
          done();
        }),
      );
    },
    destroy() {
      token++;
    },
  };
}
