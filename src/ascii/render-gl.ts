// Renderizador WebGL2 «textura de celdas» (DIRECTION §6.10, R05 §3.6): una textura RGBA8UI con [glifo, tono fg, tono bg, banderas]
// de cada celda, el atlas de máscaras y la paleta de 16 tonos; UN `drawArrays` por cuadro. El coste de CPU es subir cols·rows·4
// bytes. Sin mipmaps ni filtrado: `texelFetch` exacto, así que no hay costuras ni sangrado entre baldosas.
import type { Cells } from './types.ts';
import type { Atlas } from './atlas.ts';
import { ATLAS_COLS } from './atlas.ts';
import { glyphIndex } from './glyphs.ts';

export interface Renderer {
  readonly kind: 'gl' | '2d';
  /** Dibuja el fotograma (el renderizador 2D lo hace en dos cuadros y devuelve la promesa del segundo; el GL, ahora). */
  draw(g: Cells): void | Promise<void>;
  destroy(): void;
}

const VS = `#version 300 es
void main(){ vec2 p = vec2(gl_VertexID == 1 ? 3. : -1., gl_VertexID == 2 ? 3. : -1.); gl_Position = vec4(p, 0., 1.); }`;

// Las sombras `░ ▒ ▓` (glifos consecutivos) salen de la coordenada absoluta del píxel: la trama continúa entre celdas.
const FS = `#version 300 es
precision highp float; precision highp int;
uniform highp usampler2D uCells; uniform sampler2D uAtlas; uniform vec3 uPal[16];
uniform ivec4 uG; uniform int uShade;
out vec4 o;
void main(){
  ivec2 pix = ivec2(int(gl_FragCoord.x), uG.z - 1 - int(gl_FragCoord.y));
  ivec2 cell = pix / uG.xy;
  uvec4 c = texelFetch(uCells, cell, 0);
  int g = int(c.r), s = g - uShade;
  float m;
  if (s >= 0 && s < 3) {
    ivec2 q = (pix / uG.w) & 1;
    m = (s == 0 ? (q.x + q.y == 0) : (s == 1 ? (q.x == q.y) : (q.x + q.y < 2))) ? 1. : 0.;
  } else m = texelFetch(uAtlas, ivec2(g & ${ATLAS_COLS - 1}, g >> 4) * uG.xy + (pix - cell * uG.xy), 0).a;
  o = vec4(mix(uPal[int(c.b & 15u)], uPal[int(c.g & 15u)], m), 1.);
}`;

/** Crea el renderizador GL sobre `canvas` (ya dimensionado a cols·cw × rows·ch). Devuelve null si no hay WebGL2 rápido. */
export async function createGL(canvas: HTMLCanvasElement, atlas: Atlas, cols: number, rows: number, pal: readonly (readonly number[])[]): Promise<Renderer | null> {
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  // Firefox da RENDERER sin enmascarar y avisa de que WEBGL_debug_renderer_info está obsoleta (un aviso de consola): ahí se lee RENDERER
  const dbg = /Firefox\//.test(navigator.userAgent) ? null : gl.getExtension('WEBGL_debug_renderer_info');
  // segunda barrera: solo raster por software (5–20 ms por cuadro) ⇒ que lo trate el modo fijo
  if (/SwiftShader|llvmpipe|Software/i.test(String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  const sh = (type: number, src: string): WebGLShader => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const pr = gl.createProgram()!;
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  const par = gl.getExtension('KHR_parallel_shader_compile');
  // la compilación en paralelo no puede colgar el arranque: como mucho 0,5 s y se sale si el contexto se pierde a medias
  if (par) for (const t0 = performance.now(); !gl.getProgramParameter(pr, par.COMPLETION_STATUS_KHR) && !gl.isContextLost() && performance.now() - t0 < 500; ) await new Promise((r) => setTimeout(r, 4));
  if (gl.isContextLost() || !gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) || 'link');
  gl.useProgram(pr);
  gl.disable(gl.DITHER);
  const tex = (unit: number): void => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST);
    for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
  };
  tex(0);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8UI, cols, rows);
  tex(1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
  const u = (n: string): WebGLUniformLocation | null => gl.getUniformLocation(pr, n);
  gl.uniform1i(u('uCells'), 0);
  gl.uniform1i(u('uAtlas'), 1);
  gl.uniform4i(u('uG'), atlas.cw, atlas.ch, rows * atlas.ch, atlas.t);
  gl.uniform1i(u('uShade'), glyphIndex('░'));
  gl.uniform3fv(u('uPal'), Float32Array.from(pal.flatMap((c) => [c[0] / 255, c[1] / 255, c[2] / 255])));
  gl.viewport(0, 0, cols * atlas.cw, rows * atlas.ch);
  return {
    kind: 'gl',
    draw(g) {
      gl.activeTexture(gl.TEXTURE0); // la unidad 1 (atlas) quedó activa tras el horneado
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, g.b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
