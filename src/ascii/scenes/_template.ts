// PLANTILLA de escena del estilo Duotono (docs/ascii/KIT.md): la escena mínima que cumple el contrato `Scene` y pasa `checkSceneRules` y el presupuesto de tono.
// Cópiala a `scenes/<id>.ts`, cambia el `id`, la composición y el guion, registra la escena con UNA línea en `scenes/index.ts` (`LOADERS`) y copia su prueba:
// tests/ascii/fixtures/scene-template.test.mjs. No se importa en producción.
//
// La receta, de atrás adelante (cada paso es una función del kit; los números son los que dejan el presupuesto de §5.4 en verde con una palabra de GAYA):
//   1 · bruma   `mistDuo`   texto `. : ; + =` en racimos, T3–T6, que sale de la palabra y deja limpia la mitad de abajo (el sitio del texto)
//   2 · aura    `bakeAura`  fondo T6–T7 pegado al trazo (T8 en cover y hola), con un glifo suelto en 1 de cada 4 celdas
//   3 · sombra  `bakeShadow` una celda en diagonal, T1–T2
//   4 · aro     `paintRing` piel de cuadrantes (T10–T11) y pared `█` que `putWall` convierte en masa con caracteres grabados
//   5 · cara    `putDuo`    agua: cada celda lleva un glifo de la rampa; fondo T3–T6 y glifo `inkTone` (≤ T8; T10 en los peldaños ≥ 7 de las cáusticas)
// Reglas: `build` puro (corre en Node); `paint` solo enteros y polinomios, escribe TODA la pantalla, sin asignaciones; ningún texto visible (R8); sin Math.random.
import type { Cells, FaceInfo, Frame, GridSpec, Lang, Scene, SceneId, SceneState, WordSet } from "./common.ts";
import {
  C_EDGE, C_FACE, G_FULL, agua, applyRings, bn, clear, easeOutCubic, faceFn, hu, layoutLines, makeState, makeCells, paintRing, put, smooth, stampCls, waterTile,
} from "./common.ts";
import type { RingTones } from "./common.ts";
import { accentDensity, bakeAura, bakeShadow, clusterField, distField, enclosedCells, glowFromDist, inkTone, mistDuo, putDuo, putWall } from "./duo.ts";
import type { AuraCells, ShadowCells } from "./duo.ts";

interface Inner {
  spec: GridSpec;
  face: Int32Array; // x | y << 16 de cada celda de cara
  faceBias: Int8Array; // +1 con luz de borde (arriba/izquierda), −1 con el borde expuesto abajo/derecha
  ringPos: Int32Array;
  ringGl: Uint8Array;
  ringTn: Uint8Array;
  shadow: ShadowCells;
  aura: AuraCells;
  glow: Uint8Array;
  dens: Uint8Array;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k2: number;
  acc: number;
}
const INNER = new WeakMap<SceneState, Inner>();

/**
 * Tonos del aro de la plantilla: los CONSERVADORES (los de la base de bloques: luz de borde T10, pared T8, bisel T10/T7), que dejan el presupuesto de §5.4 en verde con cualquier
 * palabra y en cualquier visor. `cover` y `hola` los suben un peldaño (luz de borde T11, pared T9) cuando la palabra cubre ≤ 14 % de una rejilla de ≥ 6 000 celdas (`accentDensity`).
 */
const RING: RingTones = { edge: 8, skin: 9, light: 10, lit: 10, dark: 7 };

export function createTemplateScene(id: SceneId = "web"): Scene {
  return {
    id,
    dawn: 0, // 0..1: cuánto agranda y sube la bruma (§5.4): portada 0 · nosotros 0,15 · servicios 0,3 · ejemplos 0,5 · contacto 1
    arrival: { ms: 1400 }, // 600–1900 ms (la portada, 2600)
    build(spec: GridSpec, _lang: Lang, words: WordSet[]): SceneState {
      const st = makeState(spec);
      const mobile = spec.cols < 90;
      // composición: la palabra centrada arriba (filas 4–20 en 160×50); la pila móvil deja 2 filas entre líneas
      const lines = layoutLines(spec, words[0], mobile || spec.rows < 44 ? 3 : 4, mobile ? 2 : 1).map((p) => ({ ...p, face: faceFn(p.word, p.x0, p.y0) as FaceInfo }));
      let inkCells = 0;
      let minY = 1e9;
      let maxY = -1;
      for (const l of lines) {
        for (let i = 0; i < l.word.cells.length; i++) if (l.word.cells[i] !== 0) inkCells++;
        minY = Math.min(minY, l.y0);
        maxY = Math.max(maxY, l.y0 + l.word.rows);
        stampCls(st.cls, spec.cols, spec.rows, l.face); // `cls` (cara · borde) es lo que la marea deshace y forma
      }
      const acc = accentDensity(inkCells, spec.cols, spec.rows);
      // cara: lista plana de celdas con su sesgo de luz
      const face: number[] = [];
      const faceBias: number[] = [];
      const ring = makeCells(spec.cols, spec.rows);
      for (const l of lines) {
        paintRing(ring, l.word, l.x0, l.y0, l.face, RING, 0.25 * acc, 1);
        for (let y = 0; y < l.word.rows; y++) {
          for (let x = 0; x < l.word.cols; x++) {
            if (l.face.cls[y * l.word.cols + x] !== C_FACE) continue;
            const edge = (xx: number, yy: number): boolean => xx >= 0 && yy >= 0 && xx < l.word.cols && yy < l.word.rows && l.face.cls[yy * l.word.cols + xx] === C_EDGE;
            const lit = edge(x - 1, y) || edge(x, y - 1) || edge(x - 1, y - 1);
            const dark = edge(x + 1, y) || edge(x, y + 1) || edge(x + 1, y + 1);
            face.push(l.x0 + x + ((l.y0 + y) << 16));
            faceBias.push((lit ? 1 : 0) - (dark ? 1 : 0));
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
      // atmósfera horneada: distancia al trazo → luz, sombra y aura (marcadas cls 3 para la marea), racimos de la bruma
      const dist = distField(spec.cols, spec.rows, lines);
      const shadow = bakeShadow(spec.cols, spec.rows, lines);
      const enclosed = enclosedCells(spec.cols, spec.rows, lines);
      const aura = bakeAura(dist, spec.cols, spec.rows, shadow, 1.01, mobile ? 1.01 : 2.01, enclosed);
      for (const cells of [shadow.pos, aura.pos]) {
        for (let n = 0; n < cells.length; n++) {
          const i = (cells[n] >> 16) * spec.cols + (cells[n] & 0xffff);
          if (st.cls[i] === 0) st.cls[i] = 3;
        }
      }
      const k = mobile ? Math.max(0.62, Math.min(0.9, (spec.cols * spec.rows) / 4200)) : Math.max(0.62, Math.min(1, (spec.cols * spec.rows) / 8000));
      const dens = clusterField(spec.cols, spec.rows, 41, 0.12, 0.42, Math.min(maxY + 5, (spec.rows >> 1) - 2));
      for (let i = 0; i < dens.length; i++) if (enclosed[i] === 1) dens[i] = 0; // los contrapunzones quedan oscuros (figura y fondo)
      INNER.set(st, {
        spec,
        face: Int32Array.from(face),
        faceBias: Int8Array.from(faceBias),
        ringPos: Int32Array.from(ringPos),
        ringGl: Uint8Array.from(ringGl),
        ringTn: Uint8Array.from(ringTn),
        shadow,
        aura,
        glow: glowFromDist(dist, 3.6),
        dens,
        cx: spec.cols / 2,
        cy: (minY + maxY) / 2 + 1,
        rx: Math.min(spec.cols * 0.5, 74) * k,
        ry: Math.min(spec.rows * (mobile ? 0.32 : 0.4), mobile ? 18 : 15.5) * k,
        k2: k * k,
        acc,
      });
      return st;
    },
    paint(g: Cells, s: SceneState, f: Frame): void {
      const I = INNER.get(s) as Inner;
      const { p, t } = f; // p: llegada 0..1 por TIEMPO (1 = estado final = still) · t: fase del agua (s)
      const tl = waterTile();
      clear(g, 0); // `paint` escribe TODA la pantalla: nunca depende de lo que hubiera
      // 1 · bruma (se abre con p; `f.cap` son los pozos de lectura: la bruma se topa bajo el texto)
      const open = smooth(0, 0.15, p);
      if (open > 0) mistDuo(g, I.spec, { cx: I.cx, cy: I.cy, rx: I.rx * (0.15 + 0.85 * open), ry: I.ry * (0.15 + 0.85 * open), gain: 1.6 * open, cap: 6, wells: f.cap, field: I.glow, fieldGain: 0.7 * open * I.k2, dens: I.dens, heat: f.heat }, t, tl);
      // 2 · aura (fondo T8 pegado al trazo, T6 en la capa siguiente) y 3 · sombra (T1–T2), aparecen con el aro
      const a = smooth(0.05, 0.45, p) * 256;
      for (let n = 0; n < I.aura.pos.length; n++) {
        if (I.aura.rt[n] >= a) continue;
        const x = I.aura.pos[n] & 0xffff;
        const y = I.aura.pos[n] >> 16;
        const hh = hu(x, y, 34);
        const bg = I.aura.tier[n] === 0 ? 7 : 6;
        if ((hh & 255) < 70) putDuo(g, x, y, 1 + ((hh >>> 8) & 1), hh >>> 12, 8, bg);
        else put(g, x, y, 0, bg, bg);
      }
      if (p >= 0.7) {
        const b = smooth(0.7, 0.95, p) * 256;
        for (let n = 0; n < I.shadow.pos.length; n++) if (I.shadow.rt[n] < b) put(g, I.shadow.pos[n] & 0xffff, I.shadow.pos[n] >> 16, 0, 1, 1);
      }
      // 4 · aro: piel de cuadrantes tal cual y pared de bloque con caracteres (`putWall`)
      if (p >= 0.05) {
        for (let n = 0; n < I.ringPos.length; n++) {
          const x = I.ringPos[n] & 0xffff;
          const y = I.ringPos[n] >> 16;
          if (I.ringGl[n] === G_FULL) putWall(g, x, y, I.ringTn[n], hu(x, y, 23), I.acc);
          else put(g, x, y, I.ringGl[n], I.ringTn[n]);
        }
      }
      // 5 · cara: agua de caracteres; el nivel sube con p y las cáusticas (`agua`) son los peldaños altos de la rampa
      const rise = easeOutCubic((p - 0.1) / 0.8);
      const caustic = smooth(0.3, 0.8, p);
      for (let q = 0; q < I.face.length; q++) {
        const x = I.face[q] & 0xffff;
        const y = I.face[q] >> 16;
        const hh = hu(x, y, 17);
        const c = caustic * agua(tl, x, y, t);
        const v = 0.3 + 0.7 * rise * (0.4 + 0.66 * c) + 0.1 * I.faceBias[q];
        let lv = (v * 10) | 0;
        lv = lv < 2 ? 2 : lv > 9 ? 9 : lv;
        let bg = (3.6 + 2 * c * rise + 0.4 * I.faceBias[q] + bn(x, y) - 0.5 + 0.5) | 0; // dos tonos repartidos con ruido azul: sin facetas planas
        bg = bg < 2 ? 2 : bg > 7 ? 7 : bg;
        const fg = lv >= 7 && bg <= 6 && I.acc >= 0.6 ? (bg + 4 > 10 ? 10 : bg + 4) : inkTone(bg, lv); // con la palabra ocupando media pantalla las cáusticas no pasan de T8 (§5.4)
        putDuo(g, x, y, lv, hh, fg, bg);
      }
      applyRings(g, f.rings, 2); // toque y foco: los anillos suben el tono de las celdas con glifo
    },
  };
}

export const templateScene: Scene = createTemplateScene();
export default templateScene;
