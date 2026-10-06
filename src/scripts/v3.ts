// Inicio «cartel editorial» + ASCII: esquinas que cambian de tono con el cartel, barra de avance, revelados al entrar,
// interruptores que se encienden, escenas 3D hechas de caracteres y semitonos de caracteres que reaccionan al puntero.
// Todo es decoración o refuerzo visual: sin JS la página se lee entera. Nada se mueve solo más de unos segundos (WCAG 2.2.2):
// las escenas giran con el scroll y el puntero y se detienen solas.
import { render, type Scene } from '../ascii3d/render';
import { scene, STILL_T } from '../ascii3d/scenes';
import type { ServiceId } from '../data/services';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
root.classList.add('js');

const sections = [...document.querySelectorAll<HTMLElement>('main > .px-sec')];
const progress = document.querySelector<HTMLElement>('.px-progress');
const links = [...document.querySelectorAll<HTMLAnchorElement>('.px-links a')];

// ── Tono de las esquinas, enlace activo y avance ─────────────────────────────────────
let tops: number[] = [];
const measure = () => {
  tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
};
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY;
    const h = innerHeight;
    // La esquina superior manda el tono (lo que hay detrás de la marca y el menú)
    let top = 0;
    let mid = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= y + 36) top = i;
      if (tops[i] <= y + h * 0.5) mid = i;
    }
    const sTop = sections[top];
    if (sTop) document.body.dataset.tone = sTop.dataset.tone ?? 'ink';
    const idMid = sections[mid]?.id;
    for (const a of links) {
      const on = a.hash === `#${idMid}`;
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    const max = Math.max(1, document.documentElement.scrollHeight - h);
    progress?.style.setProperty('--p', String(Math.min(1, y / max)));
    for (const a of arts) if (a.visible) aim(a);
  });
};
measure();
onScroll();
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
  measure();
  onScroll();
});
document.fonts?.ready.then(() => {
  measure();
  onScroll();
});

// ── Revelado al entrar en pantalla ─────────────────────────────────────────────────────────────────────────
const enter = new Map<Element, () => void>();
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      el.classList.add('is-in');
      io.unobserve(el);
      enter.get(el)?.();
    }
  },
  { threshold: 0.18 },
);
for (const s of sections) io.observe(s);

// ── Interruptores que se encienden uno a uno ───────────────────────────────────────────────────────────────
for (const list of document.querySelectorAll<HTMLElement>('[data-px-toggles]')) {
  const items = [...list.children] as HTMLElement[];
  const sec = list.closest('.px-sec');
  const on = () => items.forEach((li, n) => (reduce.matches ? li.classList.add('is-on') : setTimeout(() => li.classList.add('is-on'), 520 + n * 170)));
  if (sec) chain(sec, on);
}

// ── Escenas 3D de los servicios: giran con el scroll y el puntero, y se quedan quietas al soltar ────────────────
type Art = {
  box: HTMLElement;
  a: HTMLElement;
  b: HTMLElement;
  s: Scene;
  dark: boolean;
  cols: number;
  rows: number;
  t: number;
  energy: number;
  spin: number;
  scrollSpin: number;
  hover: number;
  reveal: number;
  visible: boolean;
  raf: number;
  last: number;
};
const arts: Art[] = [];
const SSR_COLS = 76;
const colsFor = (w: number) => (w < 520 ? 58 : SSR_COLS);

function paint(a: Art) {
  const f = render(a.s, { cols: a.cols, rows: a.rows, dark: a.dark }, a.t, a.spin, a.reveal);
  a.a.textContent = f.a;
  a.b.textContent = f.b;
}
function fit(a: Art) {
  const cols = colsFor(a.box.clientWidth);
  if (cols === a.cols) return;
  a.cols = cols;
  a.rows = Math.round(cols / 2);
  a.box.style.setProperty('--cols', String(cols));
  paint(a);
}
/** Giro según dónde está la escena en la pantalla: el scroll la hace girar. */
function aim(a: Art) {
  const r = a.box.getBoundingClientRect();
  const p = (innerHeight - r.top) / (innerHeight + r.height);
  const next = (Math.min(1, Math.max(0, p)) - 0.5) * 1.1;
  if (Math.abs(next - a.scrollSpin) > 0.002) {
    a.scrollSpin = next;
    a.energy = Math.max(a.energy, 0.55);
    wakeArt(a);
  }
}
function wakeArt(a: Art) {
  if (!a.raf && !reduce.matches) a.raf = requestAnimationFrame((n) => tickArt(a, n));
}
function tickArt(a: Art, now: number) {
  a.raf = 0;
  if (!a.visible) {
    a.last = 0;
    return;
  }
  if (a.last && now - a.last < 33) {
    a.raf = requestAnimationFrame((n) => tickArt(a, n));
    return;
  }
  const dt = a.last ? Math.min(0.05, (now - a.last) / 1000) : 0.016;
  a.last = now;
  a.t += dt * a.energy;
  a.energy *= Math.exp(-dt / 1.25);
  const target = a.scrollSpin + a.hover;
  a.spin += (target - a.spin) * Math.min(1, dt * 4.5);
  if (a.reveal < 1) a.reveal = Math.min(1, a.reveal + dt / 0.95);
  paint(a);
  if (a.energy > 0.015 || Math.abs(target - a.spin) > 0.003 || a.reveal < 1) a.raf = requestAnimationFrame((n) => tickArt(a, n));
  else a.last = 0;
}

const artIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const a = arts.find((v) => v.box === e.target);
    if (!a) continue;
    a.visible = e.isIntersecting;
    if (a.visible) aim(a);
  }
});
for (const box of document.querySelectorAll<HTMLElement>('[data-px-3d]')) {
  const pa = box.querySelector<HTMLElement>('pre.a');
  const pb = box.querySelector<HTMLElement>('pre.b');
  if (!pa || !pb) continue;
  const a: Art = {
    box,
    a: pa,
    b: pb,
    s: scene(box.getAttribute('data-px-3d') as ServiceId),
    dark: box.hasAttribute('data-dark'),
    cols: SSR_COLS,
    rows: SSR_COLS / 2,
    t: STILL_T,
    energy: 0,
    spin: 0,
    scrollSpin: 0,
    hover: 0,
    reveal: 1,
    visible: false,
    raf: 0,
    last: 0,
  };
  arts.push(a);
  fit(a);
  artIO.observe(box);
  new ResizeObserver(() => fit(a)).observe(box);
  const sec = box.closest('.px-sec');
  if (!sec || reduce.matches) continue;
  // Al entrar por primera vez: se dibuja celda a celda y arranca
  chain(sec, () => {
    a.reveal = 0;
    a.energy = 1;
    wakeArt(a);
  });
  if (matchMedia('(pointer: fine)').matches) {
    sec.addEventListener(
      'pointermove',
      (e) => {
        const r = box.getBoundingClientRect();
        a.hover = ((e as PointerEvent).clientX - r.left - r.width / 2) / Math.max(1, r.width) * 1.2;
        a.energy = 1;
        wakeArt(a);
      },
      { passive: true },
    );
    sec.addEventListener('pointerleave', () => {
      a.hover = 0;
      wakeArt(a);
    });
  }
}

function chain(sec: Element, fn: () => void) {
  const prev = enter.get(sec);
  enter.set(sec, () => {
    prev?.();
    fn();
  });
}

// ── Semitono ASCII: un degradado hecho de caracteres que nace en la esquina y responde al puntero ─────────────
// Rampa de «puntos»: de la mota al círculo lleno, como la trama de semitono de la referencia pero hecha de caracteres
const RAMP = ' .·:oO0@';
type Tone = {
  box: HTMLElement;
  sec: HTMLElement;
  cv: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  cw: number;
  chh: number;
  dpr: number;
  clear: Uint8Array;
  fade: Float32Array;
  t0: number;
  px: number;
  py: number;
  heat: number;
  raf: number;
  color: string;
  last: number;
};
const tones: Tone[] = [];

const FONT_PX = 17;
const LINE_PX = 21;

async function setupTones() {
  try {
    await document.fonts.load(`700 ${FONT_PX}px "JetBrains V"`);
  } catch {
    /* sigue con la mono de respaldo */
  }
  for (const box of document.querySelectorAll<HTMLElement>('[data-px-tone]')) {
    const sec = box.closest<HTMLElement>('.px-sec');
    if (!sec) continue;
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    if (!g) continue;
    box.append(cv);
    box.classList.add('is-live');
    const t: Tone = { box, sec, cv, g, cols: 0, rows: 0, cw: 8.4, chh: LINE_PX, dpr: 1, clear: new Uint8Array(0), fade: new Float32Array(0), t0: -1, px: -1e4, py: -1e4, heat: 0, raf: 0, color: '#000', last: 0 };
    tones.push(t);
    size(t);
    const start = () => {
      t.t0 = performance.now();
      wake(t);
    };
    // La fuente puede llegar después de que el cartel entró en pantalla (la portada siempre)
    if (sec.classList.contains('is-in')) start();
    else chain(sec, start);
    sec.addEventListener(
      'pointermove',
      (e) => {
        const r = box.getBoundingClientRect();
        t.px = e.clientX - r.left;
        t.py = e.clientY - r.top;
        t.heat = 1;
        wake(t);
      },
      { passive: true },
    );
    sec.addEventListener('pointerleave', () => wake(t), { passive: true });
  }
  new ResizeObserver(() => tones.forEach((t) => (size(t), draw(t, performance.now())))).observe(document.body);
}

function size(t: Tone) {
  const r = t.box.getBoundingClientRect();
  t.dpr = Math.min(2, devicePixelRatio || 1);
  t.cv.width = Math.round(r.width * t.dpr);
  t.cv.height = Math.round(r.height * t.dpr);
  t.cv.style.width = `${r.width}px`;
  t.cv.style.height = `${r.height}px`;
  t.g.setTransform(t.dpr, 0, 0, t.dpr, 0, 0);
  t.g.font = `700 ${FONT_PX}px "JetBrains V", ui-monospace, monospace`;
  t.g.textBaseline = 'top';
  t.cw = t.g.measureText('M').width || 8.4;
  t.cols = Math.ceil(r.width / t.cw);
  t.rows = Math.ceil(r.height / t.chh);
  t.color = getComputedStyle(t.box).color;
  // Celdas bajo el texto del cartel: el semitono las respeta (pozo de lectura)
  t.clear = new Uint8Array(t.cols * t.rows);
  // Se mide el texto de verdad (cajas de línea) y las piezas con fondo o raya, no los bloques enteros:
  // así el semitono rodea las letras y no deja franjas vacías a lo ancho
  const rects: DOMRect[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(t.sec, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim() || n.parentElement?.closest('[aria-hidden="true"]:not(.px-mega *):not(.px-h2 *)')) continue;
    range.selectNodeContents(n);
    rects.push(...range.getClientRects());
  }
  for (const b of t.sec.querySelectorAll('.px-btn, .px-row, .px-social a, .px-dot, .px-steps li, .px-footer')) rects.push(b.getBoundingClientRect());
  for (const e of rects) {
    if (!e.width) continue;
    const x0 = Math.floor((e.left - r.left) / t.cw) - 1;
    const x1 = Math.ceil((e.right - r.left) / t.cw) + 1;
    const y0 = Math.floor((e.top - r.top) / t.chh) - 1;
    const y1 = Math.ceil((e.bottom - r.top) / t.chh);
    for (let y = Math.max(0, y0); y < Math.min(t.rows, y1); y++) for (let x = Math.max(0, x0); x < Math.min(t.cols, x1); x++) t.clear[y * t.cols + x] = 1;
  }
  t.fade = fadeField(t.clear, t.cols, t.rows);
}

/** Distancia (en celdas, la fila pesa el doble porque la celda es 1:2) a la zona de texto, convertida en atenuación 0..1. */
function fadeField(clear: Uint8Array, cols: number, rows: number): Float32Array {
  const INF = 1e6;
  const d = new Float32Array(cols * rows);
  for (let i = 0; i < d.length; i++) d[i] = clear[i] ? 0 : INF;
  // Chaflán de dos pasadas
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) d[i] = Math.min(d[i], d[i - cols] + 2);
      if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - cols - 1] + 2.2);
      if (x < cols - 1 && y > 0) d[i] = Math.min(d[i], d[i - cols + 1] + 2.2);
    }
  for (let y = rows - 1; y >= 0; y--)
    for (let x = cols - 1; x >= 0; x--) {
      const i = y * cols + x;
      if (x < cols - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < rows - 1) d[i] = Math.min(d[i], d[i + cols] + 2);
      if (x < cols - 1 && y < rows - 1) d[i] = Math.min(d[i], d[i + cols + 1] + 2.2);
      if (x > 0 && y < rows - 1) d[i] = Math.min(d[i], d[i + cols - 1] + 2.2);
    }
  const f = new Float32Array(cols * rows);
  for (let i = 0; i < f.length; i++) {
    const k = Math.max(0, Math.min(1, (d[i] - 1.5) / 9));
    f[i] = k * k * (3 - 2 * k);
  }
  return f;
}

function wake(t: Tone) {
  if (!t.raf) t.raf = requestAnimationFrame((now) => tick(t, now));
}

function tick(t: Tone, now: number) {
  t.raf = 0;
  if (now - t.last < 32) {
    t.raf = requestAnimationFrame((n) => tick(t, n));
    return;
  }
  const dt = t.last ? (now - t.last) / 1000 : 0.016;
  t.last = now;
  t.heat = Math.max(0, t.heat - dt / 0.7);
  draw(t, now);
  const revealing = t.t0 >= 0 && now - t.t0 < 1300 && !reduce.matches;
  if (revealing || t.heat > 0.01) t.raf = requestAnimationFrame((n) => tick(t, n));
  else t.last = 0;
}

function draw(t: Tone, now: number) {
  const { g, cols, rows, cw, chh } = t;
  const W = cols * cw;
  const H = rows * chh;
  g.clearRect(0, 0, W + cw, H + chh);
  if (t.t0 < 0) return;
  g.fillStyle = t.color;
  const reveal = reduce.matches ? 1 : Math.min(1, (now - t.t0) / 1100);
  const rx = W * 0.62;
  const ry = H * 0.95;
  const R = 150;
  const n = RAMP.length - 1;
  for (let y = 0; y < rows; y++) {
    let line = '';
    const cy = y * chh + chh / 2;
    const dy = (H - cy) / ry;
    for (let x = 0; x < cols; x++) {
      const fade = t.fade[y * cols + x];
      // Trama de semitono: solo una celda de cada dos, en tablero (como los puntos de una retícula)
      if (fade <= 0.01 || (x + y) % 2) {
        line += ' ';
        continue;
      }
      const cx = x * cw + cw / 2;
      const dx = (W - cx) / rx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let v = 1 - dist; // 1 en la esquina, 0 en el borde de la elipse
      // Barrido de entrada desde la esquina
      v *= Math.max(0, Math.min(1, reveal * 1.9 - dist * 0.9));
      v *= fade;
      // Puntero: una lupa que espesa la trama alrededor
      if (t.heat > 0) {
        const ddx = cx - t.px;
        const ddy = cy - t.py;
        const d2 = (ddx * ddx + ddy * ddy) / (R * R);
        if (d2 < 1) v = Math.min(1, v + (1 - d2) * (1 - d2) * 0.75 * t.heat);
      }
      line += v <= 0.02 ? ' ' : RAMP[Math.min(n, Math.max(1, Math.round(Math.pow(v, 1.15) * n)))];
    }
    if (line.trim()) g.fillText(line, 0, y * chh);
  }
}

if (!matchMedia('(forced-colors: active)').matches) void setupTones();
