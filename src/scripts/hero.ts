// Portada: luz líquida en WebGL guiada por la interacción.
//  - Dos pasadas: (A) calcula la altura del líquido en una textura (16 bits empaquetados en RGBA8, sirve en todo WebGL)
//    y (B) la ilumina con la lente de vidrio. El ruido pesado se compila una sola vez → arranque rápido.
//  - Entrada cinematográfica (la luz se enciende desde la lente), luego responde al puntero, al scroll y a los toques,
//    y se queda quieta en reposo (sin bucle continuo: ahorra batería).
//  - Niveles de calidad por dispositivo + control adaptativo por fps (solo baja de nivel, nunca sube).
//  - Respaldo: sin WebGL, ahorro de datos, movimiento reducido o contexto perdido → imagen fija.
//  - `?still`: dibuja un único fotograma representativo (capturas y pósters).
import { toLinearSrgb } from '../lib/color.mjs';

type Tier = 'high' | 'mid' | 'low' | 'min';
// Presupuesto de píxeles por nivel (el tamaño real sale de aquí, no de una escala fija: un teléfono de 390×844
// se dibuja casi a resolución CSS y un monitor grande se reduce). Solo 60 o 30 fps de tope: los valores
// intermedios saltan fotogramas. Bajo `min` solo queda la imagen fija.
const TIERS: Record<Tier, { maxPixels: number; oct: number; fps: number }> = {
  high: { maxPixels: 1_700_000, oct: 5, fps: 60 },
  mid: { maxPixels: 900_000, oct: 4, fps: 60 },
  low: { maxPixels: 420_000, oct: 3, fps: 30 },
  min: { maxPixels: 170_000, oct: 2, fps: 30 },
};
const NEXT_TIER: Record<Tier, Tier | null> = { high: 'mid', mid: 'low', low: 'min', min: null };
const REST = { x: 0.74, y: 0.6 }; // posición de reposo de la lente (0–1, y hacia arriba)
const STILL_TIME = 21.7;
const INTRO_SECONDS = 2.6;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif`;

// ── Pasada A: altura del líquido → textura (h empaquetada en R,G) ──
const fragA = (oct: number) => `${PRECISION}
#define OCT ${oct}
uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;
uniform float uZoom;
uniform vec4  uRip0;
uniform vec4  uRip1;
uniform vec4  uRip2;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < OCT; i++){ v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; }
  return v;
}
float rip(vec2 p, vec4 r){
  if (r.w <= 0.0) return 0.0;
  float d = length(p - r.xy);
  return sin(d * 38.0 - r.z * 8.0) * exp(-r.z * 1.7) * exp(-d * 3.2) * r.w;
}
void main(){
  vec2 pp = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 p = pp * uZoom;             // en vertical se aleja el campo para mantener la misma densidad de detalle
  p.y += uScroll * 0.35;
  float t = uTime;
  vec2 q = vec2(fbm(p * 1.05 + vec2(0.0, t * 0.05)), fbm(p * 1.05 + vec2(5.2, 1.3) - vec2(t * 0.04, 0.0)));
  float h = fbm(p * 0.9 + 1.7 * q + vec2(t * 0.02, -t * 0.03));
  h += 0.06 * (rip(pp, uRip0) + rip(pp, uRip1) + rip(pp, uRip2));
  float v = clamp((h + 0.25) / 1.5, 0.0, 1.0);
  float s = v * 255.0;
  float hi = floor(s);
  gl_FragColor = vec4(hi / 255.0, fract(s), 0.0, 1.0);
}`;

// ── Pasada B: iluminación + lente de vidrio ──
const fragB = `${PRECISION}
uniform sampler2D uField;
uniform vec2  uRes;
uniform vec2  uLens;
uniform float uLensR;
uniform float uIntro;
uniform float uZoom;
uniform vec4  uSafe;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uC3;
uniform vec3  uLook; // x: brillo, y: dispersión prismática

float T(vec2 uv){
  vec4 c = texture2D(uField, uv);
  return (c.x + c.y / 255.0) * 1.5 - 0.25;
}
// Bilineal a mano: la altura va empaquetada en dos canales y no se puede filtrar por hardware.
float H(vec2 uv){
  vec2 f = uv * uRes - 0.5;
  vec2 i = floor(f);
  vec2 w = f - i;
  vec2 t = 1.0 / uRes;
  vec2 b = (i + 0.5) * t;
  float a = T(b);
  float c = T(b + vec2(t.x, 0.0));
  float d = T(b + vec2(0.0, t.y));
  float e = T(b + t);
  return mix(mix(a, c, w.x), mix(d, e, w.x), w.y);
}
vec3 shade(vec2 p, vec2 lc, float boost){
  float aspect = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / aspect + 0.5, p.y + 0.5);
  float ep = max(0.004, 2.0 / uRes.y);
  vec2 ex = vec2(ep / aspect, 0.0);
  vec2 ey = vec2(0.0, ep);
  float h = H(uv);
  float hx = H(uv + ex);
  float hy = H(uv + ey);
  vec3 n = normalize(vec3((h - hx) / ep * 0.42 * uZoom, (h - hy) / ep * 0.42 * uZoom, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 Ld = normalize(vec3(-0.5, 0.65, 0.75));
  float dif = max(dot(n, Ld), 0.0);
  float spec = pow(max(dot(n, normalize(Ld + V)), 0.0), mix(28.0, 150.0, uLook.x));
  vec3 toL = vec3(lc, 0.36) - vec3(p, 0.0);
  float att = 1.0 / (1.0 + dot(toL, toL) * 5.0);
  vec3 Lp = normalize(toL);
  float difP = max(dot(n, Lp), 0.0) * att;
  float specP = pow(max(dot(n, normalize(Lp + V)), 0.0), mix(34.0, 210.0, uLook.x)) * att;
  float fres = pow(1.0 - max(n.z, 0.0), 2.0);
  float body = smoothstep(0.30, 0.80, h);
  vec3 col = mix(uC0, uC1, body) * (0.06 + 0.9 * dif * dif * dif);
  col += uC2 * (difP * difP * 2.4 + fres * 0.16);
  col += mix(uC2, uC3, 0.6) * (spec * 0.7 + specP * 2.0);
  col += uC3 * pow(specP, 1.4) * 0.85;
  return col * boost;
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  vec2 lc = (uLens - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec2 d = p - lc;
  float r = length(d);
  float ignite = smoothstep(0.0, 1.0, uIntro * 1.75 - r * 0.85);
  float R = uLensR;
  float px = 1.5 / uRes.y;
  float inLens = 1.0 - smoothstep(R - px, R, r);
  vec3 col = shade(p, lc, 1.0);
  col *= mix(0.07, 1.0, exp(-r * 2.1 * uZoom));
  if (inLens > 0.0) {
    float k = 1.0 - r / R;
    vec2 dir = d / max(r, 1e-4);
    vec2 pr = p - dir * (R * 0.6) * k * k;
    float disp = 0.02 * uLook.y;
    vec3 c = vec3(shade(pr + dir * disp, lc, 1.3).r, shade(pr, lc, 1.3).g, shade(pr - dir * disp, lc, 1.3).b);
    col = mix(col, c, inLens);
    float rim = smoothstep(R * 0.9, R - px, r) * inLens;
    col += uC3 * rim * 0.6 + uC2 * rim * 0.3;
  }
  vec2 sq = (frag / uRes - uSafe.xy) / uSafe.zw;
  float safe = 1.0 - smoothstep(0.5, 1.0, length(sq));
  col = mix(col, uC0 * 0.85, safe * 0.9);
  col *= ignite;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= (1.0 - exp(-lum * 1.5)) / max(lum, 1e-4);
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}`;

function pickTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse) return mem <= 4 || cores <= 6 ? 'low' : 'mid';
  if (mem <= 4 || cores <= 4) return 'mid';
  return 'high';
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function readLook() {
  const glow = [0, 1, 2, 3].map((i) => toLinearSrgb(cssVar(`--glow-${i}`)));
  return {
    glow,
    gloss: parseFloat(cssVar('--glow-gloss')) || 0.8,
    prism: parseFloat(cssVar('--glow-prism')) || 0.3,
    flow: parseFloat(cssVar('--glow-flow')) || 1,
  };
}

// Medidas para depurar y probar (compilación, primer fotograma, reposo). No afectan al render.
type HeroDebug = { tier?: Tier; compileMs?: number; firstFrameMs?: number; draws: number; sleeping: boolean; t0: number };
const dbg: HeroDebug = { draws: 0, sleeping: false, t0: typeof performance !== 'undefined' ? performance.now() : 0 };
if (typeof window !== 'undefined') (window as unknown as { __hero: HeroDebug }).__hero = dbg;

export function initHero(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('.hero__gl');
  const content = hero.querySelector<HTMLElement>('.hero__content');
  if (!canvas || !content) return;
  const params = new URLSearchParams(location.search);
  const still = params.has('still');
  // Iluminación pedida por URL (selector provisional del Hito 1): se aplica antes de leer los colores.
  const pal = params.get('paleta');
  if (pal && ['guayaba', 'cobalto', 'plata'].includes(pal)) document.documentElement.dataset.paleta = pal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

  const usePoster = () => {
    hero.dataset.hero = 'poster';
  };
  if ((reduced || conn?.saveData) && !still) return usePoster();

  const gl = (canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false }) ||
    canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })) as WebGLRenderingContext | null;
  if (!gl) return usePoster();

  const asked = params.get('tier') as Tier;
  let tier: Tier = asked && asked in TIERS ? asked : pickTier();
  let progA: WebGLProgram | null = null;
  let progB: WebGLProgram | null = null;
  const UA: Record<string, WebGLUniformLocation | null> = {};
  const UB: Record<string, WebGLUniformLocation | null> = {};
  const parallel = gl.getExtension('KHR_parallel_shader_compile');

  function build(fragSrc: string, uniforms: string[], into: Record<string, WebGLUniformLocation | null>): Promise<WebGLProgram | null> {
    return new Promise((resolve) => {
      const sh = (type: number, src: string) => {
        const s = gl!.createShader(type)!;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        return s;
      };
      const vs = sh(gl!.VERTEX_SHADER, VERT);
      const fs = sh(gl!.FRAGMENT_SHADER, fragSrc);
      const p = gl!.createProgram()!;
      gl!.attachShader(p, vs);
      gl!.attachShader(p, fs);
      gl!.bindAttribLocation(p, 0, 'a');
      gl!.linkProgram(p);
      const done = () => {
        if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
          console.warn('Shader:', gl!.getShaderInfoLog(fs) || gl!.getProgramInfoLog(p));
          resolve(null);
          return;
        }
        for (const n of uniforms) into[n] = gl!.getUniformLocation(p, n);
        resolve(p);
      };
      const poll = () => {
        if (parallel && !gl!.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR)) requestAnimationFrame(poll);
        else done();
      };
      poll();
    });
  }
  const UNI_A = ['uRes', 'uTime', 'uScroll', 'uZoom', 'uRip0', 'uRip1', 'uRip2'];
  const UNI_B = ['uField', 'uRes', 'uLens', 'uLensR', 'uIntro', 'uZoom', 'uSafe', 'uC0', 'uC1', 'uC2', 'uC3', 'uLook'];

  async function compileAll() {
    const c0 = performance.now();
    const [a, b] = await Promise.all([build(fragA(TIERS[tier].oct), UNI_A, UA), progB ? Promise.resolve(progB) : build(fragB, UNI_B, UB)]);
    if (!a || !b) return false;
    if (progA) gl!.deleteProgram(progA);
    progA = a;
    progB = b;
    dbg.compileMs = Math.round(performance.now() - c0);
    dbg.tier = tier;
    return true;
  }

  // Triángulo a pantalla completa
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Textura de altura (RGBA8, sin filtrar: la altura va empaquetada en 2 canales)
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  function resizeField(w: number, h: number) {
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, w, h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  // Estado
  let look = readLook();
  let from = look;
  let to = look;
  let mixStart = -1;
  const restPos = { x: REST.x, y: REST.y };
  const lens = { x: REST.x, y: REST.y };
  const target = { x: REST.x, y: REST.y };
  let lastMove = 0;
  let interacting = false;
  let energy = 0;
  let time = 0;
  let introStart = -1;
  let scrollY = 0;
  let lastScrollY = window.scrollY;
  let raf = 0;
  let last = 0;
  let visible = true;
  let ready = false;
  const ripples: Array<{ x: number; y: number; t0: number; amp: number }> = [];
  let safe = [0.3, 0.3, 0.4, 0.35];
  // Caja del texto en coordenadas de la portada (0–1, y hacia arriba). La lente la rodea en vez de cruzarla.
  let box = { x0: 0, x1: 0, y0: 0, y1: 0 };
  let aspectNow = 1.6;
  const frameTimes: number[] = [];

  /** Empuja un punto fuera de la caja del texto (ampliada con el radio de la lente) por el borde más cercano. */
  function repel(pt: { x: number; y: number }) {
    const R = Math.min(0.17, aspectNow * 0.2) * 1.15;
    const x0 = box.x0 - R / aspectNow;
    const x1 = box.x1 + R / aspectNow;
    const y0 = box.y0 - R;
    const y1 = box.y1 + R;
    if (box.x1 <= box.x0 || pt.x <= x0 || pt.x >= x1 || pt.y <= y0 || pt.y >= y1) return;
    const cost = [
      (pt.x - x0) * aspectNow, // salir por la izquierda
      (x1 - pt.x) * aspectNow, // por la derecha
      pt.y - y0, // por abajo
      y1 - pt.y, // por arriba
    ];
    const m = Math.min(...cost);
    if (m === cost[0]) pt.x = x0;
    else if (m === cost[1]) pt.x = x1;
    else if (m === cost[2]) pt.y = y0;
    else pt.y = y1;
    pt.x = Math.min(1, Math.max(0, pt.x));
    pt.y = Math.min(1, Math.max(0, pt.y));
  }

  function size() {
    const r = hero.getBoundingClientRect();
    const s = Math.min(1, Math.sqrt(TIERS[tier].maxPixels / Math.max(1, r.width * r.height)));
    const w = Math.max(200, Math.round(r.width * s));
    const h = Math.max(160, Math.round(r.height * s));
    if (canvas!.width !== w || canvas!.height !== h) {
      canvas!.width = w;
      canvas!.height = h;
      resizeField(w, h);
    }
    const c = content!.getBoundingClientRect();
    aspectNow = r.width / r.height;
    safe = [
      (c.left - r.left + c.width / 2) / r.width,
      1 - (c.top - r.top + c.height / 2) / r.height,
      Math.max(0.16, (c.width / 2 / r.width) * 1.3),
      Math.max(0.16, (c.height / 2 / r.height) * 1.5),
    ];
    box = {
      x0: (c.left - r.left) / r.width,
      x1: (c.right - r.left) / r.width,
      y0: 1 - (c.bottom - r.top) / r.height,
      y1: 1 - (c.top - r.top) / r.height,
    };
    // La posición de reposo también debe quedar fuera del texto
    restPos.x = REST.x;
    restPos.y = REST.y;
    repel(restPos);
    if (!ready || still) {
      lens.x = restPos.x;
      lens.y = restPos.y;
      target.x = restPos.x;
      target.y = restPos.y;
    }
  }

  function draw(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    // Intro
    if (introStart < 0) introStart = now;
    const intro = still ? 1.4 : Math.min(1.4, (now - introStart) / 1000 / (INTRO_SECONDS / 1.4));

    // Lente: sigue al objetivo con un muelle; vuelve al reposo si no hay movimiento
    if (!still && !interacting && now - lastMove > 1800) {
      target.x = restPos.x;
      target.y = restPos.y;
    }
    repel(target);
    const k = 1 - Math.exp(-dt * (interacting ? 9 : 4));
    lens.x += (target.x - lens.x) * k;
    lens.y += (target.y - lens.y) * k;
    repel(lens); // la lente resbala por el borde del texto en vez de cruzarlo
    const lensDist = Math.hypot(target.x - lens.x, target.y - lens.y);

    // Energía y tiempo
    energy = Math.max(0, energy - dt / 1.3);
    if (!still) time += dt * (0.1 + energy * 0.85) * look.flow;

    // Mezcla de colores entre iluminaciones
    let col = look;
    let mixing = false;
    if (mixStart >= 0) {
      const m = Math.min(1, (now - mixStart) / 700);
      const e = m * m * (3 - 2 * m);
      col = {
        glow: from.glow.map((c, i) => c.map((v, j) => v + (to.glow[i][j] - v) * e)) as number[][],
        gloss: from.gloss + (to.gloss - from.gloss) * e,
        prism: from.prism + (to.prism - from.prism) * e,
        flow: from.flow + (to.flow - from.flow) * e,
      };
      mixing = m < 1;
      if (!mixing) {
        look = to;
        mixStart = -1;
      }
    }

    // Ondas
    for (let i = ripples.length - 1; i >= 0; i--) if ((now - ripples[i].t0) / 1000 > 3.2) ripples.splice(i, 1);

    const w = canvas!.width;
    const h = canvas!.height;
    const aspect = w / h;
    gl!.viewport(0, 0, w, h);

    // Pasada A → textura de altura
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.useProgram(progA);
    gl!.uniform2f(UA.uRes, w, h);
    gl!.uniform1f(UA.uTime, still ? STILL_TIME : time);
    gl!.uniform1f(UA.uScroll, still ? 0 : scrollY);
    const zoom = Math.min(2.6, Math.max(1, 0.95 / aspect));
    gl!.uniform1f(UA.uZoom, zoom);
    for (let i = 0; i < 3; i++) {
      const r = ripples[i];
      if (r) gl!.uniform4f(UA[`uRip${i}`], (r.x - 0.5) * aspect, r.y - 0.5, (now - r.t0) / 1000, r.amp);
      else gl!.uniform4f(UA[`uRip${i}`], 0, 0, 0, 0);
    }
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // Pasada B → pantalla
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.useProgram(progB);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(UB.uField, 0);
    gl!.uniform2f(UB.uRes, w, h);
    gl!.uniform2f(UB.uLens, lens.x, lens.y);
    gl!.uniform1f(UB.uLensR, Math.min(0.17, aspect * 0.2));
    gl!.uniform1f(UB.uIntro, intro);
    gl!.uniform1f(UB.uZoom, zoom);
    gl!.uniform4f(UB.uSafe, safe[0], safe[1], safe[2], safe[3]);
    gl!.uniform3fv(UB.uC0, col.glow[0]);
    gl!.uniform3fv(UB.uC1, col.glow[1]);
    gl!.uniform3fv(UB.uC2, col.glow[2]);
    gl!.uniform3fv(UB.uC3, col.glow[3]);
    gl!.uniform3f(UB.uLook, col.gloss, col.prism, 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    dbg.draws++;
    if (!ready) {
      ready = true;
      dbg.firstFrameMs = Math.round(performance.now() - dbg.t0);
      hero.dataset.hero = 'live';
    }

    // Control adaptativo: si va lento, baja un nivel (nunca sube)
    if (!still && intro >= 0.2) {
      frameTimes.push(dt * 1000);
      if (frameTimes.length >= 40) {
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const median = sorted[20];
        frameTimes.length = 0;
        const budget = 1000 / TIERS[tier].fps;
        if (median > budget * 1.5) downgrade();
      }
    }
    return { busy: intro < 1.4 || energy > 0.012 || lensDist > 0.0008 || ripples.length > 0 || mixing || interacting };
  }

  async function downgrade() {
    const next = NEXT_TIER[tier];
    if (!next) {
      stop();
      usePoster();
      return;
    }
    tier = next;
    await compileAll();
    size();
    wake();
  }

  function loop(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const minGap = 1000 / TIERS[tier].fps - 2;
    if (last && now - last < minGap) {
      raf = requestAnimationFrame(loop);
      return;
    }
    const { busy } = draw(now);
    dbg.sleeping = !busy;
    if (busy) raf = requestAnimationFrame(loop);
    else last = 0; // reposo: se detiene hasta que algo lo despierte
  }
  function wake() {
    if (!raf && progA && visible && !document.hidden) {
      dbg.sleeping = false;
      raf = requestAnimationFrame(loop);
    }
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Entradas
  const toNorm = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)) };
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' && !interacting) return;
    const p = toNorm(e);
    if (e.pointerType === 'mouse') {
      const r = hero.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
    }
    const sp = Math.hypot(p.x - target.x, p.y - target.y);
    target.x = p.x;
    target.y = p.y;
    lastMove = performance.now();
    energy = Math.min(1, energy + sp * 2.2);
    wake();
  };
  const onDown = (e: PointerEvent) => {
    const p = toNorm(e);
    interacting = true;
    target.x = p.x;
    target.y = p.y;
    lastMove = performance.now();
    energy = Math.min(1, energy + 0.6);
    ripples.push({ x: p.x, y: p.y, t0: performance.now(), amp: 1 });
    if (ripples.length > 3) ripples.shift();
    wake();
  };
  const onUp = () => {
    interacting = false;
    lastMove = performance.now();
    wake();
  };
  const onScroll = () => {
    const dy = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    scrollY = Math.min(1, window.scrollY / window.innerHeight);
    energy = Math.min(1, energy + Math.min(0.35, dy / 60));
    wake();
  };

  if (!still) {
    hero.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : wake()));
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else stop();
    }).observe(hero);
  }
  new ResizeObserver(() => {
    size();
    if (still) {
      if (progA) draw(performance.now());
    } else wake();
  }).observe(hero);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    usePoster();
  });

  // Cambio de iluminación en vivo (selector provisional del hito 1)
  window.addEventListener('gaya:palette', () => {
    from = look;
    to = readLook();
    mixStart = performance.now();
    wake();
  });

  // Arranque
  compileAll().then((ok) => {
    if (!ok) return usePoster();
    size();
    if (still) {
      requestAnimationFrame((t) => {
        draw(t);
        document.documentElement.dataset.heroReady = '';
        (window as unknown as { __heroReady: boolean }).__heroReady = true;
      });
    } else {
      ready = false;
      raf = requestAnimationFrame(loop);
    }
  });
}
