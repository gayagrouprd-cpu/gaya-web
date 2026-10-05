// Renderizador Canvas 2D de FOTOGRAMAS FIJOS (DIRECTION §6.10). No hay bucle vivo por CPU: se dibuja el fotograma entero una vez por cambio de cartel (movimiento reducido,
// `?nogl`, WebGL por software), PARTIDO EN TROZOS POR TIEMPO: se pintan filas hasta gastar ≈ 4,5 ms de reloj de pared y se cede el hilo (así ninguna tarea pasa de 50 ms ni con CPU ×6, ni en
// frío con las baldosas por hornear). Con un hilo rápido el fotograma cabe en un solo trozo.
//   · bloques, cuadrantes, octavos y cajas rectas: `fillRect` con los MISMOS rectángulos que el atlas (atlas.ts) ⇒ idéntico al GL;
//   · `░ ▒ ▓`: `createPattern` anclado al origen del lienzo ⇒ la misma trama por píxel absoluto que el shader;
//   · ASCII, diagonales y redondeadas: UNA copia del atlas teñida por tono (máscara × tono, `source-in`; 15 como mucho, hornead­as bajo demanda o en inactividad con `warm()`):
//     cada glifo es un `drawImage` de su baldosa sin más operaciones (la versión anterior horneaba una baldosa por pareja glifo·tono: cientos de operaciones en frío).
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

/**
 * Milisegundos de reloj de pared que dura como mucho un trozo (más la última fila): 4,5 ms ⇒ con CPU ×4 cada tarea queda en ≤ 6 ms y con CPU ×6 en ≈ 9 ms (muy por debajo de 50 ms,
 * también en frío, con los tonos por hornear). Con un hilo normal el fotograma entero cabe en un solo trozo (≈ 1,5 ms).
 */
export const CHUNK_MS = 4.5;

/** Renderizador 2D con las medidas del último dibujo: duración de cada trozo (ms) y cuántas baldosas teñidas hay hechas. */
export interface Renderer2D extends Renderer {
  /** Duración (ms) de cada tarea del último `draw`; sirve a las pruebas del peor trozo en frío. */
  readonly chunks: readonly number[];
  /** Hornea en inactividad los tonos que faltan (llamar una vez; cede el hilo entre tono y tono). */
  warm(): void;
}

/** `ctx` ya obtenido del lienzo (2D). `pal` = RGB de los 16 tonos. */
export function createR2D(ctx: CanvasRenderingContext2D, atlas: Atlas, cols: number, rows: number, pal: readonly (readonly number[])[]): Renderer2D {
  const { cw, ch, t, kind, rects } = atlas;
  const css = pal.map((c) => `rgb(${c[0]},${c[1]},${c[2]})`);
  ctx.imageSmoothingEnabled = false;
  const tinted: (Cv | null)[] = new Array(16).fill(null);
  const pats = new Map<number, CanvasPattern>();
  const snap = new Uint8Array(cols * rows * 4);
  const snapU = new Uint32Array(snap.buffer);
  const chunks: number[] = [];
  // posición (x, y) de la baldosa de cada glifo en el atlas
  const gx = new Int32Array(kind.length);
  const gy = new Int32Array(kind.length);
  for (let i = 0; i < kind.length; i++) {
    gx[i] = (i % ATLAS_COLS) * cw;
    gy[i] = Math.floor(i / ATLAS_COLS) * ch;
  }
  let token = 0;
  let warmId = 0;

  /** Copia del atlas teñida con el tono `fg` (blanco sobre transparente × color): una sola vez por tono. */
  const tint = (fg: number): Cv => {
    let c = tinted[fg];
    if (c) return c;
    c = mk(atlas.canvas.width, atlas.canvas.height);
    const x = c.getContext('2d') as Ctx;
    x.drawImage(atlas.canvas as CanvasImageSource, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = css[fg];
    x.fillRect(0, 0, c.width, c.height);
    tinted[fg] = c;
    return c;
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

  // asignar `fillStyle` obliga al navegador a interpretar la cadena de color: solo se hace cuando cambia el tono
  let cur = -1;
  const fillTone = (tn: number): void => {
    if (tn !== cur) {
      cur = tn;
      ctx.fillStyle = css[tn];
    }
  };

  /** ¿La fila `y` no tiene glifo ni fondo (T0 liso)? La mitad inferior de los carteles lo está: se limpia de una vez en lugar de recorrer sus celdas. */
  const emptyRow = (y: number): boolean => {
    for (let i = y * cols, e = i + cols; i < e; i++) if ((snapU[i] & 0x00ffffff) !== 0) return false;
    return true;
  };

  /** Pinta la fila `y` de la copia `b` del fotograma. */
  const drawRow = (b: Uint8Array, y: number): void => {
    const py = y * ch;
    const row = y * cols * 4;
    fillTone(0);
    ctx.fillRect(0, py, cols * cw, ch);
    // fondos: corridas del mismo tono (T0 ya está)
    for (let x = 0, e = 0; x < cols; x = e) {
      const bg = b[row + x * 4 + 2];
      for (e = x + 1; e < cols && b[row + e * 4 + 2] === bg; e++);
      if (bg !== 0) {
        fillTone(bg);
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
        fillTone(fg);
        ctx.fillRect(px, py, (e - x) * cw, ch);
        x = e - 1;
      } else if (k === K_RECTS) {
        const r = rects[gl]!;
        fillTone(fg);
        for (let n = 0; n < r.length; n += 4) ctx.fillRect(px + r[n], py + r[n + 1], r[n + 2], r[n + 3]);
      } else if (k === K_SHADE) {
        cur = -1; // el patrón sustituye al color
        ctx.fillStyle = pattern(shadeLevel(gl), fg);
        ctx.fillRect(px, py, cw, ch);
      } else if (k === K_MASK) {
        ctx.drawImage((tinted[fg] ?? tint(fg)) as CanvasImageSource, gx[gl], gy[gl], cw, ch, px, py, cw, ch);
      }
    }
  };

  return {
    kind: '2d',
    chunks,
    draw(g) {
      snap.set(g.b); // el fotograma no cambia entre los trozos aunque el motor siga pintando
      const my = ++token;
      chunks.length = 0;
      return new Promise<void>((done) => {
        let y = 0;
        const step = (): void => {
          if (my !== token) return done(); // llegó otro fotograma: este se abandona
          const t0 = performance.now();
          do {
            if (emptyRow(y)) {
              // una carrera de filas vacías = un solo `fillRect`
              let e = y + 1;
              while (e < rows && emptyRow(e)) e++;
              fillTone(0);
              ctx.fillRect(0, y * ch, cols * cw, (e - y) * ch);
              y = e;
            } else drawRow(snap, y++);
          } while (y < rows && performance.now() - t0 < CHUNK_MS);
          chunks.push(performance.now() - t0);
          if (y >= rows) return done();
          setTimeout(step, 0);
        };
        step();
      });
    },
    warm() {
      clearTimeout(warmId);
      let k = 1;
      const next = (): void => {
        while (k < 16 && tinted[k]) k++;
        if (k >= 16) return;
        tint(k++);
        warmId = window.setTimeout(next, 0);
      };
      warmId = window.setTimeout(next, 0);
    },
    destroy() {
      token++;
      clearTimeout(warmId);
    },
  };
}
