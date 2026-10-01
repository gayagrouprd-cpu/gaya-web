// Motor del lienzo ASCII (DIRECTION §6.1–6.2, 6.4–6.6, 6.10–6.13). Un único lienzo fijo, un único contexto; las escenas son
// funciones puras de (p, t, e, calor, anillos) y la marea es la costura entre carteles.
//
//   · Estados: `live` (bucle a ≤ 30 fps SOLO mientras hay ignición, marea, llegada, calor, anillos o scroll; duerme a los 1,6 s),
//     `still` (un dibujo por cambio de cartel, sin bucle) y `off` (lienzo oculto).
//   · Todo se mide UNA vez (posters, pozos, celda) y se cachea en coordenadas de documento; el bucle no lee el DOM.
//   · Cada cambio de geometría crea un lienzo NUEVO con su renderizador, dibuja su primer fotograma y lo intercambia por el
//     anterior en la misma tarea: sin parpadeo, sin fugas de contexto y un único camino para arranque, resize, tier y contexto
//     restaurado.
import type { Cells, Frame, GridSpec, Lang, Ring, Scene, SceneId, SceneState, WordSet } from './types.ts';
import { STILL_T } from './types.ts';
import { copyCells, hashCells, makeCells } from './grid.ts';
import { clamp01, waterTile } from './kit.ts';
import type { Tide } from './tide.ts';
import type { CellRect } from './wells.ts';
import { applyCap, buildCap, makeCap, pxToCellRect } from './wells.ts';
import { buildAtlas } from './atlas.ts';
import type { Atlas } from './atlas.ts';
import { createGL } from './render-gl.ts';
import type { Renderer } from './render-gl.ts';
import { TONE_RGB } from './tones.gen.ts';
import { getWords, loadWords, sceneWord } from './words.ts';
// El registro (con `cover`) se importa en ESTÁTICO: así el empaquetador junta motor, kit, palabras y `cover` en UN solo trozo de
// primera carga (una petición y un gzip con diccionario compartido, en vez de una cascada de cinco archivos). El resto de las
// escenas sigue bajo demanda dentro del registro.
import { loadScene as registryScene } from './scenes/index.ts';

export interface WellRect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ink' | 'muted';
}
export interface FieldOptions {
  canvas: HTMLCanvasElement;
  lang: Lang;
  posters: { id: SceneId; el: HTMLElement }[];
  wells: () => WellRect[];
  params: URLSearchParams;
  /** Registro de escenas (por defecto, el de `scenes/index.ts`). Las pruebas pueden inyectar el suyo. */
  loadScene?: (id: SceneId) => Promise<Scene>;
}
export interface Field {
  readonly mode: 'live' | 'still' | 'off';
  dispose(): void;
  poke(): void;
}

type TierName = 'high' | 'mid' | 'low' | 'min';
const TIERS: Record<TierName, { cells: number; fps: number; dpr: number }> = {
  high: { cells: 9000, fps: 30, dpr: 2 },
  mid: { cells: 6500, fps: 30, dpr: 2 },
  low: { cells: 4800, fps: 30, dpr: 1.5 },
  min: { cells: 2400, fps: 20, dpr: 1 },
};
/** Marea «de reposo» mientras tide.ts (≈ 1,5 KB gz) no ha llegado: solo guarda el cartel actual. Nada de esto se necesita en el primer fotograma. */
const stubTide = (cur: number): Tide => {
  const state = { active: false, arriving: false, from: cur, to: cur, dir: 1, u: 1, e: 1, yb: 0, p: 1, cur, queued: false };
  return {
    cur, from: cur, to: cur, active: false, pending: -1, t0: 0, state,
    snap(i: number) { this.cur = this.from = this.to = state.cur = i; },
    request() {},
    update: () => state,
  } as unknown as Tide;
};
const NB = { band: 4, reach: 12 };
/** Cede el hilo principal entre fases del horneado. */
const tick0 = (): Promise<void> => new Promise((res) => setTimeout(res, 0));
const NEXT: Record<TierName, TierName | null> = { high: 'mid', mid: 'low', low: 'min', min: null };
const SLEEP_MS = 1600; // sueño real sin entrada
const MIN_COLS = 52; // con menos, ni la variante XS cabe: el lienzo se oculta
const IDLE_V = 30; // px/s: por debajo, el scroll está quieto
const TIDE_S = 2; // s: la marea no arranca si el scroll cruzaría otro cartel en menos de esto (1,4 s de marea + margen de rachas): nunca se apilan

/** Precarga las palabras del primer cartel (la llama el arranque en `DOMContentLoaded`, con el motor ya descargado). */
export function warmup(lang: Lang, id: SceneId): Promise<void> {
  const w = sceneWord(id, lang);
  return w ? loadWords(lang, [w]) : Promise.resolve();
}

interface Slot {
  scene: Scene | null;
  st: SceneState | null;
  g: number; // generación de geometría para la que se construyó `st`
  variant: string;
  busy: Promise<void> | null;
  failed: boolean;
  err?: unknown;
}

export async function mountField(o: FieldOptions): Promise<Field | null> {
  const doc = document;
  const root = doc.documentElement;
  const P = o.params;
  const lang = o.lang;
  const posters = o.posters;
  const loadScene = o.loadScene ?? registryScene;
  const mReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mMore = matchMedia('(prefers-contrast: more)');
  const mForced = matchMedia('(forced-colors: active)');
  const mPrint = matchMedia('print');
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const setField = (v: string): void => {
    root.dataset.field = v;
  };
  if ((P.has('poster') && !P.get('poster')) || posters.length === 0) {
    setField('ssr');
    return null;
  }

  // ---------- estado ----------
  let disposed = false;
  let mode: 'live' | 'still' | 'off' = 'off';
  let cv = o.canvas;
  let r: Renderer | null = null;
  let is2d = P.has('nogl');
  let atlas: Atlas | null = null;
  let atlasKey = '';
  let spec: GridSpec = { cols: 0, rows: 0, cw: 0, ch: 0, cssCw: 9, cssCh: 18, dpr: 1 };
  let fontOk = false;
  let family = '';
  let gen = 0; // generación de la geometría: invalida lo asíncrono en vuelo
  let lossCount = 0;
  let ctxLost = false;
  let menuOpen = false;
  let building = false;
  let lvh = 0;
  const tp = P.get('tier') as TierName | null;
  let tierName: TierName = tp && tp in TIERS ? tp : matchMedia('(pointer: coarse)').matches ? 'low' : ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0) >= 8 && navigator.hardwareConcurrency >= 8 ? 'high' : 'mid';
  const fpsOverride = Number(P.get('fps')) || 0;
  const forcedId: SceneId | null = P.has('still') && P.get('poster') ? (P.get('poster') as SceneId) : null;
  const forcedP = Number.isFinite(Number(P.get('p') ?? 1)) ? clamp01(Number(P.get('p') ?? 1)) : 1;

  let gRaw: Cells = makeCells(1, 1); // escena compuesta, SIN pozos (lo que congela la marea)
  let gMain: Cells = gRaw; // lo que se sube: gRaw con los topes de los pozos
  let gIn: Cells = gRaw;
  let gOut: Cells = gRaw;
  let mem = new Uint8Array(0);
  let heat = new Float32Array(0);
  let cap = makeCap(1, 1);
  const rings: Ring[] = [];
  const fr: Frame = { p: 1, t: STILL_T, e: 0, heat: null, rings, cap: null, still: false };
  const capOpts = { v: 0, dt: 1 / 30, ch: 18, energy: 0, more: false };
  const tideOpts = { band: 4, reach: 12, t: 0, dir: 1 as 1 | -1, mem, k: 1 };

  let tops: number[] = [];
  let gateV = 1400; // px/s: por encima, el dedo cruza carteles más rápido que una marea (ver `measure`)
  let baseRects: CellRect[] = [];
  let cellRects: CellRect[] = [];
  let sy = window.scrollY;
  let lastSy = sy;
  let energy = 0;
  let time = STILL_T - 0.26; // la ignición (2,6 s a 0,1/s) termina exactamente en STILL_T: lo vivo y lo fijo coinciden
  let heatSum = 0;
  let hx = 0;
  let hy = 0;
  let hDirty = false;
  let TM: typeof import('./tide.ts') | null = null; // la marea se carga tras el primer fotograma (en modo fijo, nunca)
  let tideBusy = false;
  let tide: Tide = stubTide(0);
  let wantIdx = 0;
  let catchUp = false; // el cartel cambió con una marea en vuelo: al terminar hay que alcanzar `wantIdx`
  let seenT0 = -1;
  let outIdx = 0;
  let curP = 1;
  let igniting = false;
  let ignT0 = -1;
  let raf = 0;
  let stillRaf = 0;
  let lastT = 0;
  let awake = 0;
  let sleeping = true;
  let sleptAt = 0;
  let lastPre = -1e9;
  let frames = 0;
  let firstFrameAt = 0;
  let warm = 0;
  let costN = 0;
  const cost = new Float32Array(240);
  const recent = new Float32Array(45);
  const timers = { still: 0, measure: 0, resize: 0 };
  const offs: (() => void)[] = [];
  const on = (t: EventTarget, type: string, fn: EventListener, opt?: AddEventListenerOptions): void => {
    t.addEventListener(type, fn, opt);
    offs.push(() => t.removeEventListener(type, fn, opt));
  };

  // ---------- escenas ----------
  const slots = new Map<SceneId, Slot>();
  const slotOf = (id: SceneId): Slot => {
    let s = slots.get(id);
    if (!s) slots.set(id, (s = { scene: null, st: null, g: -1, variant: '', busy: null, failed: false }));
    return s;
  };
  const idAt = (i: number): SceneId => posters[Math.max(0, Math.min(posters.length - 1, i))].id;
  const ready = (id: SceneId): boolean => {
    const s = slotOf(id);
    return s.g === gen && s.st !== null;
  };

  /** Carga (import dinámico) y construye una escena para la geometría actual; las que aún no existen caen a `mist` (plan M1). */
  const prepare = (id: SceneId): Promise<void> => {
    const s = slotOf(id);
    if (ready(id)) return Promise.resolve();
    return (s.busy ??= (async () => {
      const my = gen;
      try {
        if (!s.scene) s.scene = await loadScene(id).catch(() => loadScene('mist'));
        const wid = sceneWord(s.scene.id === id ? id : 'mist', lang);
        let sets: WordSet[] = [];
        if (wid) {
          await loadWords(lang, [wid]);
          // las columnas FINALES (tras el tier) eligen la variante; `maxRows` deja sitio al texto
          sets = [getWords(wid, lang, spec.cols, Math.max(12, Math.floor(spec.rows * 0.6)))];
          s.variant = sets[0].variant;
        }
        if (my === gen && !disposed) {
          s.st = s.scene.build(spec, lang, sets);
          s.g = my;
        }
      } catch (e) {
        s.failed = true; // `ensure` lo vuelve fallo del motor; las llamadas sin espera no dejan promesas rechazadas
        s.err = e;
      }
    })().finally(() => {
      s.busy = null;
      redraw();
    }));
  };
  /** Espera hasta que la escena esté construida para la geometría ACTUAL (puede haber cambiado mientras cargaba). */
  const ensure = async (id: SceneId): Promise<void> => {
    while (!disposed && !ready(id)) {
      await prepare(id);
      if (slotOf(id).failed) throw slotOf(id).err ?? new Error(`escena ${id}`);
    }
  };

  // ---------- geometría ----------
  const probe = doc.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
  doc.body.append(probe);

  /**
   * Celda del CSS (`--cw`/`--ch`), presupuesto de celdas del tier y dpr efectivo. Los tiers solo AGRANDAN la celda de 1 px en 1 px.
   * La celda de dispositivo es ENTERA (`round(--cw · dpr)`) y el lienzo se dibuja a su tamaño real en píxeles de dispositivo: su caja CSS
   * es `cols · cw / dpr`, no `cols · --cw`. Con dpr entero (1, 2, 3) es lo mismo; con dpr fraccionario (Windows a 125 % / 150 %) evita
   * que el navegador reescale el lienzo ≈ 0,96× con filtro bilineal (juntas de 13/14 px, moiré en la bruma): el arte queda nítido.
   * El arte no se alinea con el texto (fondo fijo a pantalla), así que la celda efectiva puede diferir del texto en un 4 %.
   */
  const layout = (): GridSpec => {
    const cs = getComputedStyle(root);
    let nw = parseFloat(cs.getPropertyValue('--cw')) || 9;
    let nh = parseFloat(cs.getPropertyValue('--ch')) || 18;
    const W = root.clientWidth;
    lvh = probe.offsetHeight || window.innerHeight;
    const T = TIERS[tierName];
    const dpr = Math.min(window.devicePixelRatio || 1, T.dpr);
    let cw: number, ch: number, cols: number, rows: number;
    for (;;) {
      cw = Math.round(nw * dpr);
      ch = Math.round(nh * dpr);
      cols = Math.floor((W * dpr) / cw + 1e-6);
      rows = Math.floor((lvh * dpr) / ch + 1e-6);
      if (cols * rows <= T.cells || nw >= 40) break;
      nw++;
      nh = 2 * nw;
    }
    return { cols, rows, cw, ch, cssCw: cw / dpr, cssCh: ch / dpr, dpr };
  };
  const sameSpec = (a: GridSpec, b: GridSpec): boolean => a.cols === b.cols && a.rows === b.rows && a.cw === b.cw && a.ch === b.ch && a.cssCw === b.cssCw && a.cssCh === b.cssCh && a.dpr === b.dpr;

  /** Posters y pozos en coordenadas de documento (una vez por cambio; nunca en el bucle). */
  const measure = (): void => {
    sy = window.scrollY;
    tops = posters.map((p) => p.el.getBoundingClientRect().top + sy);
    // Umbral de «el scroll va demasiado rápido para una marea»: si cruza un cartel más de una vez por cada 1,6 s, las mareas se apilarían
    // y el último cartel llegaría tarde tras parar (T9: ≤ 1,6 s). Por encima de la velocidad umbral la marea espera a que el scroll
    // afloje; por debajo (lectura) arranca al cruzar la línea, como siempre.
    let gap = 1e9;
    for (let i = 1; i < tops.length; i++) gap = Math.min(gap, tops[i] - tops[i - 1]);
    gateV = Math.max(200, Math.min(1400, gap / TIDE_S));
    baseRects = o.wells().map((w) => pxToCellRect(w, 0, spec.cssCw, spec.cssCh));
    cellRects = baseRects.map((b) => ({ ...b }));
  };
  const scheduleMeasure = (): void => {
    clearTimeout(timers.measure);
    timers.measure = window.setTimeout(() => {
      if (disposed || mode === 'off') return;
      measure();
      redraw();
    }, 100);
  };

  // ---------- pozos, objetivo y marea ----------
  const buildCaps = (v: number): void => {
    for (let i = 0; i < baseRects.length; i++) cellRects[i].y = baseRects[i].y - sy / spec.cssCh;
    capOpts.v = v;
    capOpts.ch = spec.cssCh;
    capOpts.energy = energy;
    capOpts.more = mMore.matches;
    buildCap(cap, spec.cols, spec.rows, cellRects, capOpts);
  };
  /** Qué cartel toca a esta posición: la línea de cambio es el 75 % del visor (85 % para volver atrás). */
  const evalWant = (): number => {
    const line = sy + 0.75 * lvh;
    let t = 0;
    for (let i = 0; i < tops.length; i++) if (tops[i] <= line) t = i;
    if (t < wantIdx && tops[wantIdx] <= sy + 0.85 * lvh) t = wantIdx;
    return t;
  };
  const prefetch = (): void => {
    lastPre = sy;
    for (let i = 0; i < tops.length; i++) if (tops[i] - sy < 2.5 * lvh && tops[i] - sy > -lvh) void prepare(idAt(i));
  };

  const loadTide = (): void => {
    if (TM || tideBusy) return;
    tideBusy = true;
    void import('./tide.ts').then((m) => {
      TM = m;
      if (!disposed) tide = new m.Tide(tide.cur);
      redraw();
    }, () => (tideBusy = false));
  };

  // ---------- pintar ----------
  const paintSlot = (id: SceneId, g: Cells, p: number): void => {
    const s = slotOf(id);
    fr.p = curP = p;
    fr.t = time;
    fr.e = energy;
    fr.heat = heatSum > 0.05 ? heat : null;
    fr.cap = forcedId ? null : cap;
    (s.scene as Scene).paint(g, s.st as SceneState, fr);
  };
  const present = (): void | Promise<void> => {
    copyCells(gMain, gRaw);
    if (!forcedId) applyCap(gMain, cap);
    if (!firstFrameAt) firstFrameAt = performance.now();
    return (r as Renderer).draw(gMain);
  };

  /** Calor del puntero (se estampa una vez por cuadro y decae con τ = 0,45 s) y anillos. */
  const stepInputs = (dts: number): void => {
    if (heatSum > 0 || hDirty) {
      const k = Math.exp(-dts / 0.45);
      heatSum = 0;
      for (let i = 0; i < heat.length; i++) heatSum += heat[i] *= k;
      if (hDirty) {
        hDirty = false;
        const R = 7;
        const ar = spec.cssCh / spec.cssCw; // la celda es 1:2: el radio se corrige por la proporción
        for (let y = Math.max(0, Math.floor(hy - R / ar)); y <= Math.min(spec.rows - 1, Math.ceil(hy + R / ar)); y++) {
          for (let x = Math.max(0, Math.floor(hx - R)); x <= Math.min(spec.cols - 1, Math.ceil(hx + R)); x++) {
            const d2 = (x - hx) * (x - hx) + (y - hy) * (y - hy) * ar * ar;
            if (d2 < R * R) {
              const w = 1 - d2 / (R * R);
              const i = y * spec.cols + x;
              if (w * w > heat[i]) {
                heatSum += w * w - heat[i];
                heat[i] = w * w;
              }
            }
          }
        }
      }
      if (heatSum < 0.05) {
        heat.fill(0);
        heatSum = 0;
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].age += dts) > 1.2) rings.splice(i, 1); // §6.6: 1,2 s
  };

  /** Un cuadro vivo: entradas, pozos, marea, escena, composición. */
  const frame = (now: number, dts: number): void => {
    sy = window.scrollY; // la posición de ESTE cuadro (el evento `scroll` puede ir un cuadro por detrás)
    const v = (sy - lastSy) / dts;
    lastSy = sy;
    energy = Math.max(energy * Math.exp(-dts / 0.9), Math.min(1, Math.abs(v) / 2400));
    time += dts * (0.1 + 0.85 * energy);
    stepInputs(dts);
    buildCaps(v);
    // El objetivo lo da el scroll; la marea corre por tiempo. Con el scroll rápido, el arranque espera a que afloje.
    // Nunca se apila una segunda marea (§6.4: «se termina la marea en curso»): si el cartel cambia con una en vuelo, al terminar se
    // ALCANZA el objetivo: con el scroll ya quieto, de un corte seco con la llegada del cartel (el último cartel llega ≤ 1,6 s tras
    // parar, T9: otra marea de 1,4 s lo retrasaría hasta 2,8 s); con el scroll aún en marcha, con una marea normal.
    const want = (wantIdx = evalWant());
    if (tide.active) catchUp = want !== tide.to;
    else if (want === tide.cur) catchUp = false;
    else if (Math.abs(v) <= gateV) {
      if (!TM) loadTide();
      else if (!ready(idAt(want))) void prepare(idAt(want));
      else if (idAt(want) === idAt(tide.cur)) tide.snap(want);
      else if (catchUp && Math.abs(v) < IDLE_V) {
        tide.snap(want);
        catchUp = false;
        igniting = true;
        ignT0 = -1;
        time = STILL_T - 0.1 * ((slotOf(idAt(want)).scene as Scene).arrival.ms / 1000); // la llegada termina en el fotograma fijo (CA-1)
      } else {
        catchUp = false;
        tide.request(want, now, (slotOf(idAt(want)).scene as Scene).arrival.ms);
      }
    }
    const { band, reach } = TM ? TM.tideParams(spec.cssCh <= 12.5) : NB;
    const s = tide.update(now, spec.rows, band, reach);
    if (s.active) {
      if (tide.t0 !== seenT0) {
        // empieza una marea: el saliente es lo que se ve AHORA (antes de los pozos), congelado
        seenT0 = tide.t0;
        outIdx = s.from;
        copyCells(gOut, gRaw);
        mem.fill(0);
        igniting = false;
      }
      const incId = idAt(s.to);
      paintSlot(incId, gIn, s.p);
      tideOpts.band = band;
      tideOpts.reach = reach;
      tideOpts.t = time;
      tideOpts.dir = s.dir;
      tideOpts.mem = mem;
      tideOpts.k = 1 - Math.exp(-12 * dts);
      (TM as typeof import('./tide.ts')).compose(gRaw, gOut, gIn, (slotOf(idAt(outIdx)).st as SceneState).cls, (slotOf(incId).st as SceneState).cls, s.yb, tideOpts);
    } else {
      const id = idAt(tide.cur);
      let p = s.p;
      if (igniting) {
        if (ignT0 < 0) ignT0 = now;
        p = clamp01((now - ignT0) / ((slotOf(id).scene as Scene).arrival.ms || 2600));
        if (p >= 1) {
          igniting = false;
          time = STILL_T; // el último cuadro de la ignición ES el fotograma fijo (CA-1)
        }
      }
      paintSlot(id, gRaw, p);
    }
    void present();
  };

  /** El fotograma fijo del cartel objetivo (p = 1, t = STILL_T, sin energía ni calor), o el `poster`/`p` pedidos. */
  const stillDraw = (): void | Promise<void> => {
    const id = forcedId ?? idAt(wantIdx);
    if (!r || !ready(id)) {
      void prepare(id);
      return;
    }
    sy = window.scrollY;
    energy = 0;
    rings.length = 0;
    heatSum = 0;
    buildCaps(0);
    time = STILL_T;
    fr.still = true;
    paintSlot(id, gRaw, forcedId ? forcedP : 1);
    fr.still = false;
    sleeping = true;
    return present();
  };
  const scheduleStill = (): void => {
    if (!stillRaf && mode === 'still') {
      stillRaf = requestAnimationFrame(() => {
        stillRaf = 0;
        if (!building && !ctxLost && !disposed) void stillDraw(); // durante una reconstrucción dibuja ella misma al terminar
      });
    }
  };
  function redraw(): void {
    if (disposed) return;
    if (mode === 'still') scheduleStill();
    else if (mode === 'live') wake();
  }

  // ---------- bucle ----------
  const canRun = (): boolean => mode === 'live' && !building && !doc.hidden && !menuOpen && !ctxLost && !mPrint.matches && r !== null && !disposed;
  function wake(ms: number = SLEEP_MS): void {
    if (mode !== 'live') return;
    const now = performance.now();
    awake = Math.max(awake, now + ms);
    if (!raf && canRun()) {
      if (sleeping && sleptAt) energy *= Math.exp(-(now - sleptAt) / 900); // la energía decayó mientras dormía
      sleeping = false;
      raf = requestAnimationFrame(tick);
    }
  }
  const stopLoop = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  function tick(now: number): void {
    raf = 0;
    if (!canRun()) return;
    const interval = 1000 / (fpsOverride || TIERS[tierName].fps);
    const dt = lastT ? now - lastT : interval;
    if (lastT && dt < interval - 2) {
      raf = requestAnimationFrame(tick); // 90 Hz ⇒ dibuja 1 de cada 3
      return;
    }
    // acumulador sin deriva: avanza en múltiplos exactos del intervalo (con 2 ms de tolerancia) y se re-sincroniza tras una pausa
    lastT = lastT ? lastT + Math.max(1, Math.floor((dt + 2) / interval)) * interval : now;
    if (now - lastT > interval) lastT = now;
    const t0 = performance.now();
    if (!ready(idAt(tide.cur))) void prepare(idAt(tide.cur));
    else {
      try {
        frame(now, Math.min(dt, 50) / 1000);
      } catch (e) {
        return fail(e);
      }
      const c = performance.now() - t0;
      frames++;
      if (warm > 0) warm--;
      else {
        cost[costN % cost.length] = c;
        recent[costN++ % recent.length] = c;
        // control adaptativo: mediana de 45 cuadros > 0,45 × intervalo ⇒ baja un tier (nunca sube)
        if (costN >= 45 && costN % 15 === 0 && Array.from(recent).sort((a, b) => a - b)[22] > 0.45 * interval) return NEXT[tierName] ? setTier(NEXT[tierName] as TierName) : fail(); // tier agotado: queda el texto (y el póster)
      }
    }
    if (performance.now() < awake || tide.active || tide.state.arriving || catchUp || igniting || rings.length > 0 || heatSum > 0.5) raf = requestAnimationFrame(tick);
    else if (energy > 0.01 || heatSum > 0) {
      // antes de dormir, un último cuadro LIMPIO (sin calor ni energía residuales): el reposo es siempre el mismo fotograma
      energy = 0;
      heat.fill(0);
      heatSum = 0;
      hDirty = false;
      raf = requestAnimationFrame(tick);
    } else {
      sleeping = true; // reposo real: el último cuadro queda dibujado y no hay bucle
      sleptAt = performance.now();
      lastT = 0;
    }
  }

  // ---------- superficie: lienzo + renderizador ----------
  /**
   * Dimensiona un lienzo SIN contexto para la geometría actual: el de `Field.astro` la primera vez que se le pide un contexto (un lienzo
   * con contexto, o con el contexto perdido por un `dispose()` anterior, no puede cambiar de tipo ni revivir) y uno nuevo las demás.
   * La marca va en el propio elemento (no en el módulo) para que también valga entre instancias del módulo (recarga en caliente).
   */
  const makeSurface = (): HTMLCanvasElement => {
    let c = o.canvas as HTMLCanvasElement & { __fieldCtx?: boolean };
    if (c.__fieldCtx) {
      c = doc.createElement('canvas');
      c.className = o.canvas.className;
      c.setAttribute('aria-hidden', 'true');
      c.translate = false;
    }
    c.__fieldCtx = true; // todo lienzo que el motor toca queda marcado: nadie lo vuelve a tomar como «limpio»
    c.width = spec.cols * spec.cw;
    c.height = spec.rows * spec.ch;
    // por CSSOM: la CSP de estilos no lo bloquea. Caja = cols·cw/dpr: con el dpr real del navegador (zoom-for-dsf) Chrome la redondea al
    // píxel de dispositivo más cercano, que es exactamente el tamaño del lienzo: 1 píxel del lienzo = 1 píxel de la pantalla.
    c.style.width = `${spec.cols * spec.cssCw}px`;
    c.style.height = `${spec.rows * spec.cssCh}px`;
    // si el navegador debe ampliar el lienzo por un factor entero (tier low en pantallas ×3), que los bloques sigan nítidos
    const k = (window.devicePixelRatio || 1) / spec.dpr;
    if (k > 1.5 && Number.isInteger(+k.toFixed(3))) c.style.imageRendering = 'pixelated';
    return c;
  };
  const dropSurface = (c: HTMLCanvasElement): void => {
    c.removeEventListener('webglcontextlost', onLost);
    c.removeEventListener('webglcontextrestored', onRestored);
  };

  /**
   * (Re)construye todo para la geometría actual: buffers, atlas, escena del cartel visible y un lienzo nuevo con su renderizador.
   * El primer fotograma se dibuja en el lienzo nuevo ANTES de intercambiarlo con el viejo.
   */
  const rebuild = async (first: boolean): Promise<void> => {
    building = true; // mientras tanto nadie dibuja: buffers nuevos con el renderizador viejo darían una subida de tamaño erróneo
    stopLoop();
    const my = ++gen;
    try {
      await build(first, my);
    } finally {
      if (my === gen) building = false;
    }
  };
  const build = async (first: boolean, my: number): Promise<void> => {
    const next = layout();
    const changed = !sameSpec(next, spec);
    spec = next;
    if (mForced.matches || spec.cols < MIN_COLS || spec.rows < 8) return goOff();
    if (first || changed) {
      gRaw = makeCells(spec.cols, spec.rows);
      gMain = makeCells(spec.cols, spec.rows);
      gIn = makeCells(spec.cols, spec.rows);
      gOut = makeCells(spec.cols, spec.rows);
      mem = new Uint8Array(spec.cols * spec.rows);
      heat = new Float32Array(spec.cols * spec.rows);
      cap = makeCap(spec.cols, spec.rows);
      heatSum = 0;
    }
    measure();
    wantIdx = forcedId ? 0 : evalWant();
    tide = TM ? new TM.Tide(wantIdx) : stubTide(wantIdx); // un cambio de geometría corta cualquier marea en curso
    seenT0 = -1;
    outIdx = wantIdx;
    const key = `${spec.cw}x${spec.ch}@${spec.dpr}`;
    if (key !== atlasKey || !atlas) {
      await tick0(); // tareas cortas: el horneado no se suma al resto (ninguna > 50 ms con CPU estrangulada)
      if (my !== gen || disposed) return;
      atlas = buildAtlas(spec.cw, spec.ch, spec.dpr, family);
      atlasKey = key;
      waterTile();
      await tick0();
    }
    await ensure(forcedId ?? idAt(wantIdx));
    await tick0();
    if (my !== gen || disposed) return;
    let surface = makeSurface();
    let nr: Renderer | null = null;
    if (!is2d) {
      try {
        nr = await createGL(surface, atlas as Atlas, spec.cols, spec.rows, TONE_RGB);
      } catch {
        nr = null;
      }
    }
    if (!nr) {
      is2d = true; // sin WebGL2 rápido: fotogramas fijos por CPU, nunca un bucle
      let ctx = surface.getContext('2d', { alpha: false });
      if (!ctx) ctx = (surface = makeSurface()).getContext('2d', { alpha: false }); // el intento GL dejó el lienzo sin poder ser 2D
      if (!ctx) return fail();
      nr = (await import('./render-2d.ts')).createR2D(ctx, atlas as Atlas, spec.cols, spec.rows, TONE_RGB);
    }
    await tick0();
    if (my !== gen || disposed) {
      nr.destroy();
      return;
    }
    const oldR = r;
    const oldCv = cv;
    r = nr;
    ctxLost = false;
    setMode();
    // el primer fotograma se dibuja antes del intercambio; en vivo arranca en p = 0 y la ignición la hace el bucle
    if (mode === 'live') {
      igniting = first && !forcedId;
      ignT0 = -1;
      buildCaps(0);
      paintSlot(idAt(tide.cur), gRaw, igniting ? 0 : 1);
      await present();
    } else await stillDraw();
    if (my !== gen || disposed) {
      nr.destroy();
      r = oldR;
      return;
    }
    surface.addEventListener('webglcontextlost', onLost);
    surface.addEventListener('webglcontextrestored', onRestored);
    if (oldCv !== surface) {
      if (oldCv.isConnected) oldCv.replaceWith(surface);
      else doc.body.prepend(surface);
      dropSurface(oldCv);
      oldCv.width = 0;
    }
    cv = surface;
    if (oldR !== nr) oldR?.destroy();
    setField(mode);
    warm = 12;
    costN = 0;
    sleeping = true;
    sleptAt = 0;
    lastT = 0;
    wake();
    prefetch();
    if (mode === 'live') loadTide();
  };

  const goOff = (): void => {
    mode = 'off';
    stopLoop();
    setField('off');
  };
  /** El motor se rinde: queda el texto (y el póster SSR). En desarrollo se dice por qué; en producción, silencio. */
  function fail(e?: unknown): void {
    if (import.meta.env.DEV && e) console.error('[field] el motor pasa a ssr:', e);
    mode = 'off';
    stopLoop();
    setField('ssr');
  }
  /** live / still según preferencias, ahorro de datos, `?still` y el renderizador disponible. */
  const setMode = (): void => {
    const was = mode;
    mode = mReduce.matches || conn?.saveData || P.has('still') || is2d ? 'still' : 'live';
    if (mode === 'still') {
      stopLoop();
      igniting = false;
      if (was === 'live') tide.snap(wantIdx);
    }
  };
  function setTier(t: TierName): void {
    tierName = t;
    void rebuild(false).catch(fail);
  }

  // ---------- contexto ----------
  function onLost(e: Event): void {
    if (e.target !== cv || disposed) return;
    e.preventDefault(); // sin esto no se restaura
    ctxLost = true;
    stopLoop();
    lossCount++;
  }
  function onRestored(e: Event): void {
    if (e.target !== cv || disposed) return;
    if (lossCount >= 2) is2d = true; // dos pérdidas: modo fijo por CPU
    void rebuild(false).catch(fail);
  }

  // ---------- entradas ----------
  const onScroll = (): void => {
    sy = window.scrollY;
    if (mode === 'live') {
      wake();
      if (Math.abs(sy - lastPre) > 0.4 * lvh) prefetch();
    } else if (mode === 'still') {
      const w = evalWant();
      if (w !== wantIdx) {
        wantIdx = w;
        tide.snap(w);
        void prepare(idAt(w)); // al terminar, `redraw` pinta el cartel nuevo
        scheduleStill();
      }
      clearTimeout(timers.still);
      timers.still = window.setTimeout(scheduleStill, 120); // en reposo, los pozos se ajustan a la posición final
    }
  };
  const onMove = (e: Event): void => {
    const pe = e as PointerEvent;
    if (mode !== 'live' || pe.pointerType === 'touch') return;
    hx = pe.clientX / spec.cssCw;
    hy = pe.clientY / spec.cssCh;
    hDirty = true;
    wake();
  };
  const addRing = (x: number, y: number): void => {
    const g = rings.length >= 3 ? (rings.shift() as Ring) : { x: 0, y: 0, age: 0 };
    g.x = x;
    g.y = y;
    g.age = 0;
    rings.push(g);
    wake();
  };
  const onDown = (e: Event): void => {
    const pe = e as PointerEvent;
    if (mode !== 'live' || (pe.target as Element | null)?.closest?.('a,button,summary,input,select,textarea')) return;
    addRing(pe.clientX / spec.cssCw, pe.clientY / spec.cssCh);
  };
  const onFocus = (e: Event): void => {
    const el = e.target as Element;
    if (mode !== 'live' || !el.matches?.('a,button') || !el.matches(':focus-visible')) return;
    const b = el.getBoundingClientRect();
    addRing((b.left + b.width / 2) / spec.cssCw, (b.top + b.height / 2) / spec.cssCh);
  };
  const onResize = (): void => {
    clearTimeout(timers.resize);
    timers.resize = window.setTimeout(() => {
      if (disposed) return;
      if (mode !== 'off' && sameSpec(layout(), spec)) scheduleMeasure();
      else void rebuild(false).catch(fail);
    }, 150);
  };
  const onVis = (): void => {
    if (doc.hidden) stopLoop();
    else redraw();
  };
  const onPageShow = (e: Event): void => {
    if ((e as PageTransitionEvent).persisted) {
      measure();
      redraw();
    }
  };
  const onMode = (): void => {
    if (disposed) return;
    const was = mode;
    if (mForced.matches) return goOff();
    if (was === 'off') return void rebuild(false).catch(fail);
    setMode();
    setField(mode);
    if (mode === 'still') scheduleStill();
    else wake();
  };
  // menú abierto: el popover nativo (evento `toggle`) o `html[data-menu="open"]` (lo pone nav.ts también sin popover nativo)
  const onToggle = (): void => {
    menuOpen = root.dataset.menu === 'open';
    try {
      menuOpen ||= doc.querySelector('[popover]:popover-open') !== null;
    } catch {
      /* sin :popover-open: solo cuenta data-menu */
    }
    if (!menuOpen) wake();
  };

  // ---------- arranque ----------
  try {
    // nunca `document.fonts.check()`: da true aunque la familia no exista
    fontOk = (await doc.fonts.load('500 16px "Geist Mono Variable"', '·:yaAG~*o')).length > 0;
  } catch {
    fontOk = false;
  }
  family = getComputedStyle(root).getPropertyValue('--font-mono').trim() || '"Geist Mono Variable", ui-monospace, monospace';
  try {
    await rebuild(true);
  } catch {
    fail();
  }
  if (disposed || root.dataset.field === 'ssr') {
    probe.remove();
    return null;
  }

  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'pointermove', onMove, { passive: true });
  on(window, 'pointerdown', onDown, { passive: true });
  on(doc, 'focusin', onFocus);
  on(window, 'resize', onResize);
  on(doc, 'visibilitychange', onVis);
  on(window, 'pageshow', onPageShow);
  on(doc, 'toggle', onToggle, { capture: true });
  for (const m of [mReduce, mMore, mForced, mPrint, conn as unknown as EventTarget]) if (m?.addEventListener) on(m, 'change', onMode); // `conn` = Network Information (saveData) si existe
  on(doc.fonts, 'loadingdone', scheduleMeasure);
  let roFirst = true;
  const ro = new ResizeObserver(() => (roFirst ? (roFirst = false) : scheduleMeasure()));
  ro.observe(doc.body);
  const mo = new MutationObserver(onToggle);
  mo.observe(root, { attributes: true, attributeFilter: ['data-menu'] });
  offs.push(() => ro.disconnect(), () => mo.disconnect());

  const pct = (q: number): number => {
    const a = Array.from(cost.subarray(0, Math.min(costN, cost.length))).sort((x, y) => x - y);
    return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * q))] : 0;
  };
  const w = window as unknown as { __field?: unknown };
  const dbg = {
    get mode() { return mode; },
    get tier() { return tierName; },
    get cols() { return spec.cols; },
    get rows() { return spec.rows; },
    get cell() { return { cw: spec.cw, ch: spec.ch, cssCw: spec.cssCw, cssCh: spec.cssCh, dpr: spec.dpr }; },
    get variant() { return slotOf(idAt(tide.cur)).variant; },
    get frames() { return frames; },
    get sleeping() { return sleeping; },
    get costP50() { return pct(0.5); },
    get costP95() { return pct(0.95); },
    get poster() { return idAt(tide.cur); },
    get cur() { return tide.cur; },
    get target() { return wantIdx; },
    get p() { return curP; },
    get tide() { return { active: tide.active, u: tide.state.u, from: tide.from, to: tide.to, pending: catchUp ? wantIdx : -1 }; },
    get renderer() { return r?.kind ?? 'none'; },
    get fontOk() { return fontOk; },
    get firstFrameAt() { return firstFrameAt; },
    get ctxLost() { return ctxLost; },
    hash: (): string => hashCells(gMain),
  };
  w.__field = dbg;

  return {
    get mode() {
      return mode;
    },
    poke() {
      if (mode === 'live') wake();
      else redraw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gen++;
      stopLoop();
      cancelAnimationFrame(stillRaf);
      clearTimeout(timers.still);
      clearTimeout(timers.measure);
      clearTimeout(timers.resize);
      for (const f of offs) f();
      dropSurface(cv);
      r?.destroy();
      r = null;
      cv.width = 0;
      probe.remove();
      if (w.__field === dbg) delete w.__field;
      delete root.dataset.field;
    },
  };
}
