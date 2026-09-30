# 02 · Renderizar imagen viva como ASCII en el navegador (GPU)

Gaya Digital · investigación técnica · 30-sep-2026 · tema: convertir el shader de luz líquida de la portada en arte ASCII a 60 fps, con la lente del puntero incluida.

**Cómo leer este informe.** Cada dato lleva su origen: **[medido]** = laboratorio propio de esta investigación, **[fuente]** = leído en la URL citada, **[regla]** = documentación o estándar conocido que no se reprodujo aquí, **[sin medir]** = hipótesis que hay que validar en dispositivo. Todo el código de la sección 4 (4.1 y 4.2) y el kernel WGSL de 6.6 se ejecutaron de verdad (los fragmentos de adaptación de `readLook` y de Canvas 2D 6.5 están derivados de código ejecutado pero no corrieron tal cual): WebGL2 en Chrome 154 (Windows 11, GPU NVIDIA RTX 5070 Ti vía ANGLE/D3D11) y en SwiftShader (rasterizador por software, útil como proxy de una GPU limitada por relleno). **No se probó en Android real, Safari ni Firefox.** Ese es el mayor riesgo abierto (sección 8).

---

## 0. Resumen ejecutivo

**Qué se construye.** Una canalización WebGL2 de cuatro pasadas que sustituye las pasadas A/B de `hero.ts` y mantiene todo lo demás (entrada, reposo sin bucle, niveles, póster):

```
 tiempo, scroll, ondas ──▶ P0 CAMPO ───────▶ P1 SOMBREADO ─────▶ P2 CELDA ──────────▶ P3 SELLO ────▶ pantalla
                           (2·cols × 4·rows)  (2·cols × 4·rows)   (cols × rows)         (W × H px reales)
                           altura, 16 bits    color + luma        glifo + color         atlas 1:1 con texelFetch
                           RGBA8              RGBA8               RGBA8, ping-pong      halo, fleco cromático,
                                                                  (memoria temporal)    tope de tinta tras el texto
```

- El ruido caro (`fbm`) se evalúa en 8 «zonas» por celda de texto, no por píxel. La pasada de campo cuesta **≈ 8× menos** que la de hoy a igualdad de octavas (0,0056 ms frente a 0,0444 ms, nivel *mid*, RTX) [medido].
- El glifo de cada celda sale de una **rampa de 17 glifos ordenada por tinta real** de Geist Mono (no la clásica de memoria) más **trazos de contorno** (`- | / \`) donde el gradiente es fuerte, con **histéresis** temporal. Las inversiones A→B→A bajan del 17–20 % de los cambios al 0,9 % [medido].
- La **lente** se ve en ASCII de tres maneras a la vez: campo refractado con dispersión R/G/B (P1), **lupa de puntos braille 2×4** dentro del disco con color propio por punto (P2/P3), y **fleco cromático por píxel** en los trazos de los glifos que rodean el orbe (P3). Braille no existe en Geist Mono: los puntos son procedurales.
- Nitidez: cada celda es un número **entero** de píxeles de dispositivo y el atlas se dibuja a ese tamaño; el sello lee el atlas con `texelFetch` (1 texel = 1 píxel). Sin filtros, sin mipmaps, sin `textureGrad`.
- Reposo: 0 fotogramas por segundo cuando nada se mueve (prueba de integración) [medido].

**Cuatro hallazgos que cambian decisiones:**
1. La búsqueda de «vector de forma» de Alex Harri, tal cual, **colapsa en campos suaves**: el 65,5 % de las celdas caen en `|`, `:` y `!` (solo 30 glifos distintos). Sirve para arte de líneas, no para luz líquida. Se recomienda el modo híbrido [medido].
2. **Sin tope de tinta detrás del texto se incumple WCAG AA**: el peor píxel de fondo llega a luminancia 0,232 → contraste 3,31:1 con `--ink`. Con tope 0,45 dentro de la caja del texto: ≥ 5,04:1 incluso con `--muted` en la prueba analítica; en la portada de prueba compuesta, 8,5:1 (`--ink`) y 7,8:1 (`--lead`) en escritorio y 6,6:1 / 6,1:1 en móvil [medido].
3. El coste **se desplaza del ruido al sello por píxel (P3)**: es el 50–95 % del fotograma. La palanca es `stampPx` (píxeles del lienzo por nivel), no las octavas. Lupa, fleco y tope de tinta juntos cuestan ≤ 3 % (SwiftShader, dentro del ruido) y ≤ 13 % (RTX) [medido].
4. Geist Mono cubre ASCII, Block Elements (32/32) y Box Drawing (128/128), pero **0/256 Braille**, 0 Geometric Shapes, 0 sextantes, 0 octantes [medido, lectura directa de `cmap`]. Nada de Braille «de fuente»: caería a una fuente del sistema distinta en cada dispositivo.

**Lo que falta.** Medir en un Samsung A07 real (Helio G99, Mali-G57 MC2). Los tiempos absolutos de este informe son de una RTX 5070 Ti y **no valen para el A07**; valen las razones entre pasadas, contra la portada actual y los recuentos de lecturas de textura.

---

## 1. Hallazgos con URLs

### 1.1 Técnicas de referencia

| Fuente | Qué hace (dato verificado) | Lo que tomamos | Lo que descartamos | Licencia |
|---|---|---|---|---|
| Alex Harri, «ASCII characters are not pixels» — https://alexharri.com/blog/ascii-rendering | Cada carácter tiene una **forma**: vector 6D con seis círculos de muestreo escalonados (3 izquierda, 3 derecha); se normaliza por dimensión (cada componente ÷ su máximo sobre todos los glifos); búsqueda por distancia euclídea. Contraste global (exponente 1–2) y **direccional** con 9–12 círculos externos. Fuerza bruta ≈ 1 ms por 1 000 búsquedas; k-d tree ≈ 10× más rápido; caché por cuantización a 5 bits por componente (32⁶ = 1 048 576 claves). GPU en 6 pasadas (la cifra de 60 fps en móvil viene de un resumen secundario). [fuente] | Normalización por dimensión; contraste direccional con tomas externas; la idea de que el glifo es forma, no solo tinta | Círculos solapados (usamos una partición exacta 2×4); k-d tree y caché (innecesarios con ≤ 95 glifos en GPU); 6 pasadas | Texto/código del autor: no se copió nada; se reimplementó el concepto |
| Codrops, «Beyond the Luminance Ramp» (4-sep-2026) — https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/ (403 al leerlo entero; datos vía réplica https://blog.aimactgrow.com/past-the-luminance-ramp-a-form-conscious-ascii-renderer-in-three-js/) | Atlas en canvas 2D; 6 muestras internas + 10 externas por celda; búsqueda lineal de 95 glifos (~570 operaciones por celda); 3 pasadas (escena → celda → sello) con el índice en el alfa; tope ≈ 4 600 celdas; 60 fps con caída a 30; `IntersectionObserver`; `textureGrad` para evitar costuras de mip; fuente `min(cellH·0,92; cellW/0,58)`. [fuente, secundaria] | Arquitectura escena → celda → sello; índice en alfa; tope de celdas; normalización por ranura | `textureGrad` (Arm: mucho más lento que `texture`); atlas con sangrado de 8 px | Ideas: no se copió código |
| Codrops, «Efecto» (4-ene-2026) — https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/ (403; solo resumen del buscador) | Glifos **procedurales** en GLSL sobre rejilla 5×7; difusión de error (Floyd–Steinberg, Atkinson); paleta | Que los glifos pueden ser matemática, no fuente (lo usamos para Braille) | Difusión de error: secuencial, no apta para fragment shaders | — |
| Maxime Heckel, «Post-Processing Shaders as a Creative Medium» — https://blog.maximeheckel.com/posts/post-processing-as-a-creative-medium/ | Atlas de glifos en canvas 2D con `NearestFilter`; `índice = floor(luma·(n−1))`; `cellUV = fract(uv/size)`; Bayer 8×8 dentro de la celda; advierte de desajustes de métricas de fuente y de aspecto | El patrón atlas + índice; la advertencia sobre métricas | — | Ideas |
| Maxime Heckel, «The Art of Dithering and Retro Shading for the Web» — https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/ | Bayer 2×2/4×4 en GLSL; ruido azul por textura; la difusión de error «no es apta para GPU»; usa coordenadas de pantalla: con movimiento eso puede dar «shimmer» (inferencia nuestra; el artículo no lo trata) | Bayer 4×4 para los puntos braille; **anclar el dither a la celda**, no a la pantalla ni al tiempo | Ruido azul por textura (una textura más, sin ganancia visible aquí) | Ideas |
| Codrops, «Creating an ASCII Shader Using OGL» — https://tympanus.net/codrops/2024/11/13/creating-an-ascii-shader-using-ogl/ ; repo https://github.com/andrico1234/codrops-ascii-ogl | Atlas por canvas + luminancia → índice; ruido Perlin como fuente | Confirma el patrón mínimo | — | MIT (repo) |
| three.js `AsciiEffect` — https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/AsciiEffect.js ; docs https://threejs.org/docs/pages/AsciiEffect.html | **CPU**: `drawImage` + `getImageData` cada fotograma; luma `0,3R+0,59G+0,11B`; rampa ` .:-=+*#%@`; resolución 0,15 por defecto; cada carácter con estilos en línea | Nada: sirve de contraejemplo de coste | Lectura de píxeles por CPU en cada fotograma | MIT (basado en jsascii, MIT) |
| `morphing-ascii-shader` — https://github.com/niccolofanton/morphing-ascii-shader | Atlas en tiempo de ejecución, Sobel con glifos direccionales, **memoria por celda** con ping-pong (suavizado exponencial), morph por SDF | Memoria por celda (ping-pong); Sobel para contornos | Morph SDF (atlas SDF + mezcla: coste y complejidad sin necesidad) | MIT |
| `textmode.js` — https://github.com/humanbydefinition/textmode.js ; docs https://code.textmode.art/ | WebGL2 con **instanciado + MRT**; GLSL ES 3.00 personalizable; convierte imagen/vídeo/texturas a glifo+color | Comprobar la alternativa instanciada | **Medimos el sello instanciado: 1,4–1,6× más lento** que el de pantalla completa en RTX (sección 2.5) | MIT |
| `p5.asciify` / `p5js-ascii-renderer` — https://github.com/humanbydefinition/p5.asciify ; https://github.com/humanbydefinition/p5js-ascii-renderer | GLSL ES 1.00 (compatible WebGL1 y 2); una sola pasada; el atlas falla con fuentes que se solapan; `p5.asciify` está archivado (sucesor: `textmode.js`) | Aviso: las fuentes con trazos que exceden la celda dan artefactos | Compatibilidad WebGL1 (perdemos ≈ 3,6 % y ganamos `texelFetch` y enteros) | MIT |
| Acerola, «I Tried Turning Games Into Text» — https://www.youtube.com/watch?v=gg40RWiaHRY (resumen vía https://daily.dev/posts/i-tried-turning-games-into-text-vdtkjtcrs) | Luminancia → carácter; **contornos** con Sobel sobre DoG: el ángulo del gradiente se reduce a 4 glifos (barra, contrabarra, barra vertical y guion bajo); un compute shader con **votación local por tile** da coherencia | Contorno = gradiente cuantizado a 4 direcciones | Votación por tile (usamos umbral con histéresis, más barato) | Vídeo: solo ideas |
| Shadertoy «Ascii Art» (movAX13h, 2013) — https://www.shadertoy.com/view/lssGDj (copia con atribución: https://github.com/Traderain/BitHack/blob/master/GLSL_ASCII_art.glsl) | Glifos 5×5 empaquetados en un `float` y decodificados por bits; rampa de 0–16 píxeles encendidos | La idea de glifo como máscara de bits (nuestros puntos braille son un bitmask de 8) | No se copió código: Shadertoy publica por defecto bajo CC BY-NC-SA 3.0 salvo indicación del autor [regla] | Ver nota |
| Paul Bourke, rampas de gris — http://paulbourke.net/dataformats/asciiart/ | Rampa de 70 niveles (empieza por «$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft…» y acaba en «…;:,^'. ») y de 10 niveles « .:-=+*#%@» | Referencia para comparar | **La rampa de 70 está desordenada en Geist Mono** (33 de 68 pares contiguos al revés) y la de 10 tiene huecos de tinta de 11,9 puntos [medido] | — |
| Braille, Unicode — https://en.wikipedia.org/wiki/Braille_Patterns ; https://www.unicode.org/charts/PDF/U2800.pdf ; https://github.com/asciimoo/drawille | Celda 2×4; puntos 1-2-3-7 (columna izquierda) y 4-5-6-8 (derecha); valores 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80 sobre U+2800 | Usamos un bitmask de 8 bits; **bit k = zona k (fila·2 + columna)**, orden propio del pipeline (no el de Unicode) porque no emitimos texto | El texto Unicode real | — |
| Bloques, cuartos, sextantes, octantes — https://en.wikipedia.org/wiki/Block_Elements ; https://github.com/microsoft/cascadia-code/issues/711 | Block Elements (U+2580–259F) incluye cuartos; sextantes (U+1FB00) y octantes (U+1CD00) casi no tienen soporte de fuentes mono | Confirma: procedural | — | — |
| Ruido de gradiente intercalado (Jimenez) — https://blog.demofox.org/2022/01/01/interleaved-gradient-noise-a-different-kind-of-low-discrepancy-sequence/ ; https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/ | `fract(52,9829189 · fract(0,06711056·x + 0,00583715·y))`, barato y estable | Ruido de 3 % para romper bandas de tono, anclado a la zona | Variante con desplazamiento temporal (reintroduce parpadeo) | — |
| Parpadeo de glifos: https://github.com/oddurs/rummy/pull/5 ; https://github.com/andmckay01/auto-ascii | El «boil» (alternancia `.`/`'`) viene de jitter sub-celda; métrica: celdas que cambian y vuelven en 3 fotogramas (1–4 % → 0,03–0,24 %); histéresis por celda | Métrica de inversiones A→B→A; histéresis | Jitter de muestreo | — |
| Arm, guía de buenas prácticas de GPU — https://developer.arm.com/documentation/101897 (contenido no recuperable aquí; datos vía réplica https://github.com/azhirnov/cpu-gpu-arch/blob/main/gpu/ARM-Mali_Guide.md) | Muestreadores `mediump` (los `highp` pueden ir a la mitad de velocidad); `textureGrad` mucho más lento; trilineal = 2×; formatos FP32 = 2×; no parametrizar flujo con uniformes; el indexado dinámico impide optimizaciones; ~128 bytes de uniformes se promueven a registros [fuente, secundaria] | `texelFetch`, sin mips, sin filtros; literales desenrollados en vez de arrays; RGBA8 | Formatos flotantes | — |
| `devicePixelContentBoxSize` — https://web.dev/articles/device-pixel-content-box ; https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/devicePixelContentBoxSize | Tamaño exacto en píxeles físicos; solo Chrome/Edge; en Safari/Firefox hay que usar `rect·devicePixelRatio` | Estrategia de tamaño (sección 7) | — | — |
| Fuentes en canvas — https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load ; https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textRendering | Dibujar antes de cargar la fuente usa una de respaldo; `textRendering` (`geometricPrecision`, etc.) | `document.fonts.load` y comprobar que devuelve FontFace cargadas antes del atlas (`check()` no sirve: sección 9, trampa 1) | — | — |

### 1.2 Plataforma y hardware

- **WebGL2**: 96,44 % de soporte global [fuente: https://caniuse.com/webgl2, 30-sep-2026]. Sin WebGL2 → póster estático (sección 10).
- **WebGPU**: Chrome/Edge desde 2023; Chrome 121 en Android 12+ con GPU Qualcomm/ARM; Firefox 141 (Windows, jul-2025; Android «previsto para 2026»); Safari 26. Cobertura móvil ≈ 70 % a mediados de 2026 según una fuente secundaria [fuente: https://web.dev/blog/webgpu-supported-major-browsers ; https://github.com/gpuweb/gpuweb/wiki/Implementation-Status ; https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/].
- **Samsung Galaxy A07**: MediaTek Helio G99, **Mali-G57 MC2 a 1 000 MHz**, CPU 2×A76 + 6×A55 [fuente: https://www.gsmarena.com/samsung_galaxy_a07-14066.php].
- **LCP**: el `<canvas>` **no es candidato** (lo son `img`, imagen SVG, `poster` de vídeo, `background-image: url()` y bloques de texto); el umbral bueno es 2,5 s [fuente: https://web.dev/articles/lcp]. La portada ASCII no afecta al LCP mientras el LCP sea el `h1` o el póster de fondo.
- **`precision`**: en fragment shaders GLSL ES 3.00 `float` no tiene precisión por defecto, `int` es `mediump` y `sampler2D` es `lowp` (§4.5.3 de la especificación, https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf; el PDF no era legible por máquina aquí: [regla]). Hay que declararlo: ver trampa 6.

### 1.3 Lo que no se pudo leer

Los dos artículos de Codrops de 2026 devolvieron 403; los datos de uno vienen de una réplica y los del otro del resumen del buscador. La guía de Arm no se pudo recuperar (página dinámica); se usó una réplica que cita sus reglas. El PDF de la especificación GLSL ES no era legible. Ningún dato de esas tres fuentes se usa como cifra crítica: las cifras críticas son propias.

---

## 2. Mediciones propias (laboratorio)

**Entorno.** Chrome 154.0.8037.59, Windows 11, `playwright-core` 1.63 (ya está en `devDependencies`) lanzado desde fuera del proyecto con `headless`. GPU: NVIDIA RTX 5070 Ti (ANGLE/D3D11), consultas de tiempo `EXT_disjoint_timer_query_webgl2` disponibles. Proxy de GPU débil: SwiftShader (`--use-angle=swiftshader`). Fuente: `@fontsource-variable/geist-mono` 5.3.0 (subsets `latin` 23 KB y `symbols2` 5,8 KB). Los scripts del laboratorio no están en el repositorio (el encargo prohibía tocar el proyecto); el código que importa está en la sección 4 y en los apéndices.

### 2.1 Cobertura de glifos de la fuente [medido, lectura directa de la tabla `cmap` de los `.woff2`]

| Rango | Geist Mono | JetBrains Mono (latin) | Martian Mono (latin) |
|---|---|---|---|
| ASCII 32–126 | 95/95 | 95/95 | 95/95 |
| Block Elements U+2580–259F (░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟) | **32/32** | 0 | 0 |
| Box Drawing U+2500–257F | **128/128** | 0 | 0 |
| **Braille U+2800–28FF** | **0/256** | 0 | 0 |
| Geometric Shapes U+25A0–25FF | 0/96 | 0 | 0 |
| Sextantes U+1FB00–1FB3B / octantes U+1CD00–1CDE5 | 0 / 0 | 0 / 0 | 0 / 0 |

En Geist Mono los bloques y las cajas viven en el subset `symbols2` (`unicode-range: U+2500-259F`, 5,8 KB). El lector de `cmap` está en el apéndice A.

### 2.2 Rampas de densidad por área de tinta real [medido]

Se rasteriza cada glifo con el motor del navegador (Geist Mono 500, celda 24×48, alfa como cobertura) y se mide la fracción del área de la celda que queda con tinta.

**ASCII ordenado por tinta ascendente** (Geist Mono, peso 500; en % del área de la celda):

```
' '0  .2,6  ,4,5  `4,6  :5,3  -5,5  '6,0  _6,2  ;7,2  ~7,9  ^9,6  !10,3  "11,4  =12,4  +12,9  /13,2  \13,2  >13,7  <13,7
|13,9  *14,7  (14,7  )14,7  L16,6  v16,8  r17,0  t17,4  x17,5  ?17,5  7 17,6  J17,6  }17,7  {17,7  i17,8  T17,9  f18,1  z18,1
l18,2  Y18,5  c18,6  j18,6  [19,1  ]19,1  u19,1  1 19,5  n19,7  y19,9  s20,6  o21,1  F21,2  I21,5  a22,6  k22,8  e22,9  V22,9
h23,0  P24,0  X24,1  4 24,1  C24,2  Z24,3  w25,0  3 25,0  U25,2  A25,3  d25,9  b25,9  2 26,0  E26,0  q26,1  p26,1  #26,6  K26,7
m27,0  5 27,2  D27,8  S27,9  H28,1  O28,2  %28,7  G29,1  R29,2  g29,2  6 30,1  9 30,1  8 30,5  B31,3  Q31,6  N31,6  &32,0  0 32,6
$33,9  @34,5  W35,3  M36,1
```

Como cadena (solo caracteres, mismo orden): `` .,`:-'_;~^!"=+/\><|*()Lvrtx?7J}{iTfzlYcj[]u1nysoFIaekVhPX4CZw3UAdb2Eqp#Km5DSHO%GRg698BQN&0$@WM `` (recalcular siempre en tiempo de ejecución: el orden depende de fuente, peso y tamaño).

Hechos:
- **Techo de tinta ASCII: 36,1 % (`M`)**. Un bloque `█` tiene 100 %. Con ASCII el tono máximo solo puede ser «denso», nunca «relleno»: el brillo lo aporta el color de tinta y el halo, no el glifo.
- **La rampa de Bourke de 70 niveles está desordenada** en Geist Mono 500: 33 de 68 pares contiguos van al revés. La de 10 (` .:-=+*#%@`) tiene tintas 0 · 2,6 · 5,3 · 5,5 · 12,4 · 12,9 · 14,7 · 26,6 · 28,7 · 34,5: `:` y `-` casi iguales (0,2 puntos) y un salto de 11,9 puntos entre `*` y `#`.
- **El orden es estable entre pesos y tamaños**: correlación de Spearman ≥ 0,983 sobre los 95 glifos entre pesos 300–700 y celdas de 6 a 24 px.
- Para la **rampa de Gaya (17 niveles)** ` .,:;~^=+*o#%&$@M` la tinta es 0 · 2,6 · 4,5 · 5,3 · 7,2 · 7,9 · 9,6 · 12,4 · 12,9 · 14,7 · 21,1 · 26,6 · 28,7 · 32,0 · 33,9 · 34,5 · 36,1 (hueco máximo 6,4 puntos entre `*` y `o`). La peor inversión de orden medida entre pesos 400–600 y celdas de 6×12 a 24×48 es de **2,1 puntos** (típica < 1) frente a un paso medio de 2,3: invisible.
- Una selección automática de N=17 con `pickRamp` (apéndice B) desde un conjunto de símbolos + `o x s v I M` da ` .,;^">v{sI#%&$@M`, hueco máximo 5,0 pero con letras (`v s I`): se descartó por ruido visual. La rampa de mano está validada a ojo.
- Construir el juego de glifos (medida + atlas) cuesta **0,7 ms** con 21 glifos y **2,4 ms** con 95 en escritorio; el atlas de 21 glifos con celdas de 13×26 mide 208×52 px [medido].

### 2.3 Vector de forma frente a rampa: el hallazgo que cambia el diseño [medido]

Se implementó la búsqueda de Harri con partición exacta 2×4 (8 dimensiones, normalización por dimensión, contraste direccional y global; las 6 pasadas de Harri se reducen a una) con los 95 glifos ASCII y el campo de luz líquida:
- **30 glifos distintos** usados; `|` 25,8 %, `:` 23,7 %, `!` 16,0 % (65,5 % entre los tres), luego `Q 7,6 %`, `$ 7,4 %`.
- El modo híbrido (rampa de 17 + trazos) usa 20 glifos con reparto sano: `,` 16,5 %, `o` 12,3 %, `*` 11,5 %, `:` 8,8 %, `^` 7,9 %.

Causa: en zonas suaves las 8 componentes son casi iguales y el vecino más cercano en 8D es el glifo más «uniforme» (barras verticales y puntos). El método brilla con líneas y bordes duros, no con niebla. **Decisión: híbrido por defecto; `shape` queda documentado para arte de líneas o pósters.**

### 2.4 Estabilidad temporal [medido]

Prueba: 180 fotogramas a 60 fps con el campo a energía 1 (velocidad de tiempo ≈ 0,66 u/s), 1440×900. Las primeras filas (hybrid y shape) con celdas de 8×16 px (≈ 10 000 celdas); las del módulo final con celdas de 7×14 px (13 120). Métricas: % de celdas que cambian de glifo por fotograma; y qué parte de esos cambios son **inversiones A→B→A** en 3 fotogramas (parpadeo).

| Configuración | Cambios/celda/fotograma | Inversiones A→B→A |
|---|---|---|
| hybrid, sin histéresis, sin ruido | 1,607 % | 17,0 % |
| hybrid, histéresis 0,02, ruido 0,03 | 0,780 % | 0,8 % |
| hybrid, histéresis 0,04, ruido 0,03 | 0,645 % | 0,9 % |
| hybrid, histéresis 0,06, ruido 0,03 | 0,496 % | 1,2 % |
| shape 95, sin histéresis | 2,778 % | 31,0 % |
| shape 95, histéresis 0,01 / 0,03 | 0,751 % / 0,556 % | 0,2 % / 0,0 % |
| braille, umbral fijo, sin histéresis | 1,581–1,660 % | 26,8–28,7 % |
| **módulo final, hybrid + lupa, histéresis 0,04** | **0,632 %** | **0,9 %** (sin histéresis: 1,730 % y 19,8 %) |
| **módulo final, braille global, histéresis por punto 0,04** | **0,460 %** | **0,0 %** (sin histéresis: 1,660 % y 28,7 %) |
| hybrid + lente en movimiento, histéresis 0,04 / 0 | 6,289 % / 10,006 % | 0,6 % / 3,4 % |

Con la lente en movimiento, el 6 % de celdas que cambia es movimiento real de la imagen dentro del disco, no parpadeo.

### 2.5 Coste (GPU y proxy por software) [medido]

Tiempos por fotograma, mediana de 150 fotogramas, consultas de tiempo por pasada. **Los valores absolutos de la RTX son diminutos y no extrapolan al A07; comparad razones.**

**RTX 5070 Ti (ms)** — módulo final, modo `hybrid` + lupa:

| Caso | P0 campo | P1 sombreado | P2 celda | P3 sello | Total |
|---|---|---|---|---|---|
| Móvil 780×1520 @2 (1,19 Mpx), 3 480 celdas | 0,0020 | 0,0029 | 0,0025 | 0,0126 | **0,0201** |
| Escritorio 1440×900 @1 (1,30 Mpx), 13 120 celdas | 0,0056 | 0,0048 | 0,0031 | 0,0136 | **0,0271** |
| Escritorio 2880×1800 @2 (5,18 Mpx), 10 080 celdas | 0,0045 | 0,0042 | 0,0028 | 0,0474 | **0,0589** |

**Portada actual (`hero.ts`, pasadas A + B)**, mismos shaders copiados sin cambios:

| Caso | A campo | B luz | Total |
|---|---|---|---|
| Escritorio CSS 1440×900, *high* (1,30 Mpx, oct 5) | 0,0765 | 0,0233 | 0,0998 |
| Escritorio CSS 1440×900, *mid* (0,90 Mpx, oct 4) | 0,0444 | 0,0168 | 0,0612 |
| Móvil CSS 390×844 (0,33 Mpx), *mid* (oct 4) | 0,0176 | 0,0077 | 0,0253 |
| Móvil CSS 390×844 (0,33 Mpx), *low* (oct 3) | 0,0138 | 0,0076 | 0,0215 |

Razones (RTX): la pasada de campo nueva cuesta ≈ 8× menos que la de hoy a igualdad de octavas (0,0056 frente a 0,0444, *mid*) y 8,8× menos en móvil (0,0020 frente a 0,0176); el total de escritorio es 2,3× menor que *mid* y 3,7× menor que *high*; el total móvil es 1,07–1,26× menor **con 3,6× más píxeles** (1,19 Mpx frente a 0,33 Mpx).

**SwiftShader (ms; renderizador por software limitado por relleno)**, mismo módulo:

| Caso | P3 sello | Total | Portada actual equivalente |
|---|---|---|---|
| Móvil 780×1520 @2 (1,19 Mpx) | 46–54 | 49–58 | *low* 27,0 (0,33 Mpx) |
| Móvil `dprEff` 1,5 (0,67 Mpx) | 30–32 | 34–35 | ídem |
| Escritorio 1440×900 (1,30 Mpx), 13k celdas | 54–62 | 65–74 | *mid* 78,6 · *high* 112,8 |
| Escritorio 2880×1800 (5,18 Mpx) | 224–252 | 235–262 | — |

Lectura: **P3 es el 85–95 % del fotograma** en un renderizador limitado por relleno y su coste es lineal en píxeles (≈ 40–49 ns/px en SwiftShader; 9–11 ps/px en la RTX). A resolución nativa en móvil la nueva canalización cuesta ≈ 2× la actual; con el presupuesto de píxeles de la tabla de niveles (sección 3) queda ≈ 1,1–1,3×. **Esto es lo que hay que medir en el A07.** Con el mismo criterio, el coste de la portada actual por píxel de su pasada B en SwiftShader es ≈ 60 ns/px frente a ≈ 42 ns/px de P3.

**Interruptores de P3** (móvil 780×1520 @2, SwiftShader / RTX): base 46,3 / 0,0126 ms; sin fleco 45,4 / 0,0114; sin lupa 47,4 / 0,0119; sin tope de tinta 46,4 / 0,0126; sin nada 47,1 / 0,0112; sin nada y halo 0 44,2 / 0,0112. **Ninguno es palanca** (≤ 3 % / ≤ 13 %); el coste base es la lectura de celda + atlas + halo por píxel.

**Otras comparaciones:**
- **Sello instanciado** (un quad por celda con glifo, vértices de celdas vacías fuera del clip, halo en pasada aparte, mezcla aditiva): RTX 0,0253 frente a 0,0174 (móvil), 0,0361 frente a 0,0220 (escritorio), 0,0651 frente a 0,0464 (2880×1800): **1,4–1,6× más lento**; SwiftShader entre 0,7× y 1,8× según el caso, y pierde el fleco por píxel. **Descartado.**
- **Eliminar la división entera** (`p / uCellPx` → `floor((p + ½) · 1/cw)` y atlas de 16 columnas con `& 15` / `>> 4`): P3 baja de 0,0140 a 0,0097 ms (−31 %) en RTX [medido].
- **Búsqueda de 95 glifos** (móvil, P2, RTX): literales desenrollados 0,0044 ms, bucle con textura RGBA32F 0,0096 ms (2,2× más lento); pero el desenrollado tarda más en compilar (445 ms frente a 141 ms en ANGLE/D3D11). El modo `hybrid` (17 literales) tarda 0,0024–0,0031 ms.
- **Compilación** (las 4 pasadas en paralelo, ANGLE/D3D11): `hybrid` 126–337 ms; `shape` de 95 glifos 260–445 ms; la primera compilación con caché fría de `shape` de 95 glifos tardó 1,5 s. `KHR_parallel_shader_compile` está disponible.
- **Tamaño del código**: módulo 34,8 KB / 12,2 KB gzip **sin minificar y con comentarios**; integración 12,0 KB / 4,4 KB gzip; `hero.ts` actual 21,6 KB / 7,7 KB gzip. Minificado, el conjunto rondaría 10–11 KB gzip (estimación); sin minificar añade ≈ 9 KB gzip a `hero.ts`.
- **Portada integrada** (prueba con `initAsciiHero` en una página simulada): primer fotograma 217–244 ms en escritorio (incluye compilación), 23–113 ms en móvil emulado (con caché de shaders); tras mover el puntero y esperar 6 s, **0 fotogramas dibujados** en el último segundo. El escalado de niveles high → mid → low → min → póster recorre los cuatro saltos sin errores de consola.

### 2.6 Contraste detrás del texto [medido]

Luminancias relativas de los tokens: `--ink` 0,886 · `--lead` ≈ 0,805 · `--muted` 0,458. Para 4,5:1 el fondo debe tener luminancia ≤ 0,158 (`ink`), 0,140 (`lead`), 0,063 (`muted`).

**Prueba analítica** (caja de 576×315 px, 1440×900, peor píxel):

| Tope de tinta dentro de la caja | Luminancia máx. | Contraste `ink` | `lead` | `muted` |
|---|---|---|---|---|
| 1,00 (sin tope) | 0,232 | **3,31** | **3,03** | **1,80** |
| 0,60 | 0,084 | 6,98 | 6,38 | 3,79 |
| **0,45** | **0,051** | **9,29** | **8,49** | **5,04** |
| 0,35 | 0,033 | 11,30 | 10,33 | 6,13 |
| 0,30 | 0,026 | 12,31 | 11,26 | 6,68 |

**Prueba compuesta** (página simulada con h1, párrafo y botón reales encima; se oculta el texto y se mide el fondo por bloque, tope 0,45): escritorio h1 0,060 · p 0,029 · botón 0,018 → `ink` 8,51:1, `lead` 7,78:1, `muted` 4,61:1; móvil h1 0,091 · p 0,040 · botón 0,030 → `ink` 6,64:1, `lead` 6,07:1, `muted` 3,60:1. Caja analítica y mapa por celda dan el mismo resultado. **`--muted` no debe ir sobre el campo en móvil con tope 0,45**; con 0,35 sí (sección 5.6).

### 2.7 Canvas 2D (fallback CPU) [medido]

Milisegundos por fotograma en Chrome de escritorio (mediana de 40; **sin** contar el cálculo del campo):

| Estrategia | 180×56 (10 080 celdas) | 60×58 (3 480 celdas) |
|---|---|---|
| `fillText` por celda | 10,6 | 4,0 |
| `drawImage` por celda desde un atlas | 35,6 | 19,8 |
| `fillText` por fila y cubo de color (cadenas con espacios) | 8,7 | 3,9 |

Un Android modesto es de 4 a 6 veces más lento en una sola hebra [sin medir]: 10 k celdas ≈ 40–60 ms/fotograma. **Canvas 2D solo sirve como ruta de 15 fps con ≤ 3 500 celdas, o para generar pósters**; no para la portada viva (sección 6.5).

### 2.8 WebGPU [medido]

El kernel WGSL de la pasada de celda (`hybrid`, un hilo por celda) del apéndice de la sección 6.6 **compila sin mensajes y se ejecuta** en Chrome 154 con `--enable-unsafe-webgpu`: en Dawn sobre NVIDIA Blackwell y en SwiftShader, con datos sintéticos de 40×30 celdas, y devuelve los índices esperados (bordes 5–8 y rampa 10–23). No se adopta: no hay nada en esta canalización que necesite cómputo, P2 es ≈ 12 % del fotograma y la cobertura móvil de WebGPU (~70 %) es menor que la de WebGL2 (96,44 %).

### 2.9 Otras pruebas [medido]

- **Antialias LCD en canvas 2D**: con `getContext('2d', { alpha: false })`, **561 de 561** píxeles de borde salen con fleco de color (subpíxel); con el contexto por defecto, 0 de 912.
- **`devicePixelContentBoxSize`** con emulación de DPR de Playwright devolvió tamaños en píxeles CSS (411×373), no físicos: **no se pudo validar en emulación**; comprobar en móvil real. `Math.round(css·dpr)` da 1 079 y `Math.floor` 1 078 con DPR 2,625 y ancho CSS 411: el error de ±1 px es real.
- **Aspecto obtenido** (pantallas capturadas en escritorio 1440×900 y móvil 390×844@2): campo de glifos azules con zonas de luz líquida, trazos `/ \ | -` siguiendo los contornos de la luz, ondas del toque como arcos concéntricos de glifos, un orbe de cristal hecho de puntos braille con franjas cian/magenta/verde y borde circular limpio, y una ventana oscura y tranquila (tope de tinta) donde va el texto real. El nivel `min` (celdas grandes, sin lupa) degrada con elegancia a glifos gordos con un orbe de `MMM`.

---

## 3. Arquitectura recomendada

### 3.1 Resoluciones y fórmulas

- **Celda**: `cw` × `ch` píxeles de dispositivo, enteros, `ch = 2·cw`. `cw = round(fsCss · 0,6 · dprEff)` (el avance de Geist Mono es 0,6 em [medido]); `fsCss` = 10 px (móvil) … 13 px (escritorio ancho). La rejilla se centra con origen entero (`ox`, `oy`). `cols = ⌊W / cw⌋`, `rows = ⌊H / ch⌋`; si `cols·rows` supera el tope del nivel, `cw` crece de 1 en 1.
- **Zona**: 2 columnas × 4 filas por celda. Con `ch = 2·cw` las zonas son cuadradas (`cw/2` px). Las texturas de campo y de sombreado miden `2·cols × 4·rows`.
- **Atlas**: 16 columnas; celda del atlas = celda del lienzo; `índice → (i & 15, i >> 4)`. El texel del atlas para el píxel local `(lx, ly)` de la celda es `(col·cw + lx, fila·ch + (ch − 1 − ly))`: 1 texel = 1 píxel.
- **Texturas** (todas RGBA8, sin extensiones): campo (NEAREST), sombreado (NEAREST), celdas ×2 en ping-pong (LINEAR: solo para el halo; el resto es `texelFetch`), atlas (NEAREST), y opcionalmente el mapa de tope (R8, LINEAR).
- **Codificación de la celda**: `rgb` = color medio de las 8 zonas (con memoria EMA), `a` = índice de glifo (0–255) o bitmask braille. `gl.disable(gl.DITHER)`.

### 3.2 Recuento de lecturas de textura por fotograma (ejemplo A07, nivel *low*)

Hero de 360×740 CSS, `stampPx` 0,6 M → `dprEff` 1,5 → lienzo 540×1110, `fsCss` 10 → `cw` 9, `ch` 18 → 60×61 = 3 660 celdas, 29 280 zonas.

| Pasada | Píxeles | Lecturas por píxel | Lecturas totales | Ruido (evaluaciones `noise`) |
|---|---|---|---|---|
| P0 campo | 29 280 | 0 | 0 | 29 280 × 9 (oct 3) = 264 k |
| P1 sombreado | 29 280 | 12 (+24 dentro de la lente, ≈ 1 800 zonas) | ≈ 350 k + ≈ 42 k | — |
| P2 celda | 3 660 | 33 (24 de ventana + 8 de color + 1 previa) | 121 k | — |
| P3 sello | ≈ 600 k | 3 (celda, atlas, halo) (+6 en la corona de la lente) | ≈ 1,8 M + ≈ 0,3 M | — |
| **Total** | | | **≈ 2,6 M** | **264 k** |

Portada actual en el caso equivalente (*low*, 390×844 CSS = 329 k px): pasada B ≈ 12 lecturas por píxel → ≈ 4 M, más ≈ 0,46 M en la lente; ruido 329 k × 9 = 2,96 M evaluaciones. **Ruido 11× menor, lecturas ≈ 40 % menores, con un lienzo 1,8× más denso.** [cálculo analítico sobre las pasadas medidas]

### 3.3 Niveles (propuestos; hay que validarlos en dispositivo)

| Nivel | Celdas máx. | Octavas | fps tope | `stampPx` (lienzo) | Lupa braille |
|---|---|---|---|---|---|
| high | 16 000 | 5 | 60 | 6,0 M | sí |
| mid | 9 000 | 4 | 60 | 2,4 M | sí |
| low | 4 800 | 3 | 30 | 0,6 M | sí |
| min | 2 400 | 2 | 30 | 0,3 M | no (interruptor en ejecución) |

**Criterio:** `low` y `min` reproducen aproximadamente el coste de los niveles de hoy en un renderizador limitado por relleno (SwiftShader: la portada actual en *low* ≈ 27 ms equivale a P3 con ≈ 0,5–0,6 Mpx); `high` y `mid` dan más resolución porque solo se eligen en escritorio y móviles de gama alta (en la RTX, 5,2 Mpx cuestan 0,059 ms; GPU integradas [sin medir]). `dprEff = min(devicePixelRatio, √(stampPx / píxelesCSSdelHero))`. El control adaptativo de `hero.ts` se conserva (mediana de 40 fotogramas > 1,5× el presupuesto → baja de nivel; nunca sube). Al bajar solo se recompila **P0** (`setOctaves`), la lupa se apaga con un uniforme y se rehace el atlas (celdas mayores).

---

## 4. Código

El módulo 4.1 y el bloque `initAsciiHero` de 4.2 son originales y se ejecutaron tal cual en el laboratorio (`readLook()` es solo un fragmento de adaptación). Los nombres de archivo son propuestas: `src/scripts/hero-ascii.js` (o `.ts` con tipos mínimos) y `initAsciiHero` como sustituto de `initHero`.

### 4.1 `hero-ascii.js`: canalización completa

```js
// hero-ascii.js — «luz líquida → arte ASCII» en WebGL2 (GLSL ES 3.00). Código original de Gaya Digital.
//
//   P0 campo     ZX·cols × ZY·rows   altura del líquido (16 bits en RGBA8)          = pasada A de hero.ts, evaluada por zona
//   P1 sombreado ZX·cols × ZY·rows   iluminación + lente + dispersión → rgb, a=luma  = pasada B de hero.ts, a resolución de zona
//   P2 celda     cols × rows         8 zonas + su entorno → glifo (a) y color (rgb)   ← nuevo
//   P3 sello     lienzo (px reales)  atlas 1:1 con texelFetch + halo + fleco cromático + tope de tinta tras el texto   ← nuevo
// El ruido caro se evalúa en ~8 zonas por celda (no por píxel); el único trabajo por píxel es P3: 3 lecturas y poca aritmética.

export const ZX = 2, ZY = 4, NZ = ZX * ZY;

// ═════════════════════════ 1. Glifos: medida, atlas y vectores de forma ═════════════════════════
/**
 * Rasteriza cada glifo con el motor real del navegador, mide su tinta (fracción del área de la celda) y su forma 2×4,
 * y dibuja el atlas al tamaño de celda del dispositivo. Devuelve los glifos ordenados por tinta (0 = el vacío).
 * Requiere que la fuente esté cargada: await document.fonts.load('500 16px "Geist Mono Variable"', chars)
 */
export function buildGlyphSet({ family, weight = 500, chars, cw, ch, expectAdvance = 0.6 }) {
  const uniq = [...new Set([' ', ...chars])];
  const ctxFor = (w, h, fs) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });     // NUNCA { alpha:false }: activa el antialias LCD (fleco de color)
    x.font = `${weight} ${fs}px ${family}`;
    x.textBaseline = 'alphabetic';
    x.fontKerning = 'none';
    return { c, x };
  };
  const advance = ctxFor(8, 8, 100).x.measureText('M').width / 100;    // 0,6 em en Geist Mono
  if (Math.abs(advance - expectAdvance) > 0.02) throw new Error(`La fuente no está cargada (avance ${advance.toFixed(3)} em)`);   // red de seguridad; no detecta a Courier New (también 0,6): ver document.fonts.load
  const baseline = (x, h, fs) => {                                       // centra la caja de contenido de la fuente en la celda (como line-height)
    const m = x.measureText('M');
    const A = m.fontBoundingBoxAscent ?? fs * 0.95, D = m.fontBoundingBoxDescent ?? fs * 0.3;
    return Math.round((h - (A + D)) / 2 + A);
  };
  // 1) Medida a 24×48 px, independiente del tamaño real de celda
  const MW = 24, MH = 48, mfs = MW / advance;
  const m = ctxFor(MW, MH, mfs);
  const mBase = baseline(m.x, MH, mfs);
  const raw = uniq.map((g) => {
    m.x.clearRect(0, 0, MW, MH);
    m.x.fillStyle = '#fff';
    m.x.fillText(g, 0, mBase);
    const d = m.x.getImageData(0, 0, MW, MH).data;
    const z = new Float32Array(NZ), n = new Float32Array(NZ);
    let tot = 0;
    for (let y = 0; y < MH; y++)
      for (let x = 0; x < MW; x++) {
        const a = d[(y * MW + x) * 4 + 3] / 255;
        tot += a;
        const zx = Math.min(ZX - 1, ((x * ZX) / MW) | 0);
        const zy = ZY - 1 - Math.min(ZY - 1, ((y * ZY) / MH) | 0);   // fila 0 = abajo (convención GL)
        z[zy * ZX + zx] += a; n[zy * ZX + zx]++;
      }
    for (let i = 0; i < NZ; i++) z[i] /= n[i];
    return { g, ink: tot / (MW * MH), z };
  }).sort((a, b) => a.ink - b.ink);
  // 2) Normalización por dimensión (Harri): cada zona se estira a [0,1] sobre el vocabulario
  const mx = new Float32Array(NZ).fill(1e-6);
  for (const r of raw) for (let i = 0; i < NZ; i++) mx[i] = Math.max(mx[i], r.z[i]);
  const G = raw.length;
  const shapes = new Float32Array(G * NZ);
  raw.forEach((r, gi) => { for (let i = 0; i < NZ; i++) shapes[gi * NZ + i] = r.z[i] / mx[i]; });
  // 3) Atlas: 16 columnas (índice → (i & 15, i >> 4)), una celda del atlas = una celda del lienzo
  const AC = 16, AR = Math.ceil(G / AC), fs = cw / advance;
  const at = ctxFor(AC * cw, AR * ch, fs);
  at.x.fillStyle = '#fff';
  const base = baseline(at.x, ch, fs);
  raw.forEach((r, gi) => at.x.fillText(r.g, (gi & 15) * cw, (gi >> 4) * ch + base));
  return { chars: raw.map((r) => r.g).join(''), ink: raw.map((r) => r.ink), shapes, G, atlas: at.c, AC, AR, advance };
}

/** Rejilla: celdas de tamaño ENTERO en px de dispositivo (cw × 2cw), centrada en el lienzo, con tope de celdas. */
export function planGrid({ W, H, dpr, fsCss, maxCells, advance = 0.6, ratio = 2 }) {
  let cw = Math.max(4, Math.round(fsCss * advance * dpr));
  for (;;) {
    const ch = Math.round(cw * ratio);
    const cols = Math.floor(W / cw), rows = Math.floor(H / ch);
    if (cols * rows <= maxCells || cw > 64) return { cw, ch, cols, rows, ox: (W - cols * cw) >> 1, oy: (H - rows * ch) >> 1 };
    cw++;
  }
}

// ═════════════════════════ 2. Shaders ═════════════════════════
const VERT = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;   // triángulo sin buffers

// P0 — campo de altura: la pasada A de hero.ts; solo cambia dónde se evalúa (centro de cada zona)
const fragField = (oct) => `#version 300 es
precision highp float;
#define OCT ${oct}
uniform vec2  uCanvas;   // px del lienzo
uniform vec4  uZone;     // xy: origen de la rejilla (px) · zw: tamaño de una zona (px)
uniform float uTime, uScroll, uZoom;
uniform vec4  uRip0, uRip1, uRip2;
out vec4 o;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
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
  vec2 frag = uZone.xy + gl_FragCoord.xy * uZone.zw;      // gl_FragCoord ya es el centro del texel (i + ½)
  vec2 pp = (frag - 0.5 * uCanvas) / uCanvas.y;
  vec2 p = pp * uZoom;
  p.y += uScroll * 0.35;
  float t = uTime;
  vec2 q = vec2(fbm(p * 1.05 + vec2(0.0, t * 0.05)), fbm(p * 1.05 + vec2(5.2, 1.3) - vec2(t * 0.04, 0.0)));
  float h = fbm(p * 0.9 + 1.7 * q + vec2(t * 0.02, -t * 0.03));
  h += 0.06 * (rip(pp, uRip0) + rip(pp, uRip1) + rip(pp, uRip2));
  float s = clamp((h + 0.25) / 1.5, 0.0, 1.0) * 255.0;
  float hi = floor(s);
  o = vec4(hi / 255.0, fract(s), 0.0, 1.0);
}`;

// P1 — iluminación + lente con dispersión prismática (pasada B de hero.ts) a resolución de zona. Salida: rgb gamma, a = luma.
const fragShade = `#version 300 es
precision highp float;
precision highp sampler2D;   // la altura son 16 bits en 2 canales: leída en fp16 (lowp/mediump) perdería casi 8 bits
uniform sampler2D uField;
uniform vec2  uCanvas;
uniform vec4  uZone;
uniform ivec2 uZoneRes;
uniform vec2  uLens;      // 0–1, y hacia arriba (como hero.ts)
uniform float uLensR;     // en alturas de lienzo
uniform float uIntro, uZoom;
uniform vec4  uSafe;
uniform vec3  uC0, uC1, uC2, uC3;
uniform vec3  uLook;      // x brillo · y dispersión
out vec4 o;
float T(ivec2 i){ vec4 c = texelFetch(uField, clamp(i, ivec2(0), uZoneRes - 1), 0); return (c.x + c.y / 255.0) * 1.5 - 0.25; }
float H(vec2 z){                                              // bilineal a mano (altura en 2 canales); z = índice de zona continuo
  ivec2 i = ivec2(floor(z)); vec2 w = z - vec2(i);
  return mix(mix(T(i), T(i + ivec2(1, 0)), w.x), mix(T(i + ivec2(0, 1)), T(i + ivec2(1, 1)), w.x), w.y);
}
vec2 toZone(vec2 p){ return ((p * uCanvas.y + 0.5 * uCanvas) - uZone.xy) / uZone.zw - 0.5; }
vec3 shade(vec2 p, vec2 lc, float boost){
  vec2 z = toZone(p);
  vec2 ep = uZone.zw / uCanvas.y;                             // una zona, en unidades de p
  float h = H(z), hx = H(z + vec2(1.0, 0.0)), hy = H(z + vec2(0.0, 1.0));
  vec3 n = normalize(vec3((h - hx) / ep.x * 0.42 * uZoom, (h - hy) / ep.y * 0.42 * uZoom, 1.0));
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
  vec2 frag = uZone.xy + gl_FragCoord.xy * uZone.zw;
  vec2 p = (frag - 0.5 * uCanvas) / uCanvas.y;
  vec2 lc = (uLens - 0.5) * vec2(uCanvas.x / uCanvas.y, 1.0);
  vec2 d = p - lc;
  float r = length(d);
  float ignite = smoothstep(0.0, 1.0, uIntro * 1.75 - r * 0.85);
  float R = uLensR;
  float px = uZone.w / uCanvas.y;                             // borde de la lente suavizado en 1 zona → cobertura parcial → glifos de borde
  float inLens = 1.0 - smoothstep(R - px, R + px, r);
  vec3 col = shade(p, lc, 1.0);
  col *= mix(0.07, 1.0, exp(-r * 2.1 * uZoom));
  if (inLens > 0.0) {
    float k = 1.0 - min(r / R, 1.0);
    vec2 dir = d / max(r, 1e-4);
    vec2 pr = p - dir * (R * 0.6) * k * k;
    float disp = 0.02 * uLook.y;
    vec3 c = vec3(shade(pr + dir * disp, lc, 1.3).r, shade(pr, lc, 1.3).g, shade(pr - dir * disp, lc, 1.3).b);   // dispersión: R/G/B se refractan distinto
    col = mix(col, c, inLens);
    float rim = smoothstep(R * 0.9, R, r) * inLens;
    col += uC3 * rim * 0.6 + uC2 * rim * 0.3;
  }
  vec2 sq = (frag / uCanvas - uSafe.xy) / uSafe.zw;
  float safe = 1.0 - smoothstep(0.5, 1.0, length(sq));
  col = mix(col, uC0 * 0.85, safe * 0.9);
  col *= ignite;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= (1.0 - exp(-lum * 1.5)) / max(lum, 1e-4);
  col = pow(col, vec3(1.0 / 2.2));
  o = vec4(col, dot(col, vec3(0.2126, 0.7152, 0.0722)));
}`;

const f4 = (v) => { const s = v.toFixed(4); return s.includes('.') ? s : s + '.0'; };

/**
 * P2 — celda. Modos:
 *   hybrid   rampa de tono (glifos ordenados por tinta medida) + trazos - | / \ donde el gradiente es fuerte   ← recomendado
 *   shape    vector de forma 2×4 más cercano entre los G glifos (Harri), literales desenrollados; solo para contenido de líneas
 *   braille  bitmask 2×4: los puntos los dibuja P3
 * loupe: dentro de la lente las celdas pasan a braille (detalle fino) — misma regla evaluada en P2 y en P3.
 */
function fragCell(set, mode, rampChars, loupe, dither) {
  const { G, shapes, ink, chars } = set;
  const idx = (c) => chars.indexOf(c);
  const R = [];
  for (let g = 0; g < G; g++) if (rampChars ? rampChars.includes(chars[g]) : !'-|/\\'.includes(chars[g])) R.push(g);
  const inkMax = Math.max(...R.map((g) => ink[g]));
  const rampSearch = R.map((g) => `d = abs(${f4(ink[g] / inkMax)} - t); if (d < bd) { bd = d; bi = ${g}; } if (pg == ${g}) dp = d;`).join('\n  ');
  let shapeSearch = '';
  for (let g = 0; g < G && mode === 'shape'; g++) {
    const a = [0, 1, 2, 3].map((i) => f4(shapes[g * NZ + i])).join(',');
    const b = [4, 5, 6, 7].map((i) => f4(shapes[g * NZ + i])).join(',');
    shapeSearch += `a = v0 - vec4(${a}); b = v1 - vec4(${b}); d = dot(a, a) + dot(b, b); if (d < bd) { bd = d; bi = ${g}; } if (pg == ${g}) dp = d;\n  `;
  }
  const brailleBits = (tonePow) => `int bits = 0;
    for (int k = 0; k < 8; k++) {
      float th = thr(vec2(z0 + ivec2(k & 1, k >> 1)) + uStab.w) + (((pg >> k) & 1) == 1 ? -uStab.x : uStab.x);   // histéresis por punto
      if (${tonePow} > th) bits |= 1 << k;
    }
    bi = bits;`;
  const pick = {
    shape: `${shapeSearch}
  if (dp <= bd + uStab.x) bi = pg;`,
    braille: brailleBits('v[k]'),
    hybrid: `${loupe ? `if (loupeCell) {
    ${brailleBits('pow(v[k], uLoupe.z)')}
  } else {` : '{'}
  ${rampSearch}
  if (dp <= bd + uStab.x) bi = pg;                                          // histéresis: solo cambia si el nuevo gana por margen
  bool wasEdge = pg == ${idx('-')} || pg == ${idx('|')} || pg == ${idx('/')} || pg == ${idx('\\')};
  float edgeThr = wasEdge ? uEdge.x * uEdge.y : uEdge.x;                     // histéresis del umbral de contorno
  if (gm > edgeThr) {
    float ax = abs(gx), ay = abs(gy);
    if (ay > ax * 2.4) bi = ${idx('-')};                                    // gradiente vertical → contorno horizontal
    else if (ax > ay * 2.4) bi = ${idx('|')};
    else bi = gx * gy > 0.0 ? ${idx('\\')} : ${idx('/')};                    // y hacia arriba: mismo signo → contorno «\»
  }
  }`,
  }[mode];
  return `#version 300 es
precision highp float; precision highp int;
precision mediump sampler2D;
uniform sampler2D uZone;   // (ZX·cols × ZY·rows): rgb color, a luma
uniform sampler2D uPrev;   // celdas del fotograma anterior (rgb color, a índice de glifo / bitmask)
uniform ivec2 uGrid, uCellPx, uOrigin;
uniform vec4  uTone;       // x gamma · y ganancia · z exponente direccional · w exponente global
uniform vec4  uStab;       // x histéresis · y k del color (1 = sin memoria) · z ruido (amplitud) · w semilla
uniform vec2  uEdge;       // x umbral de gradiente · y factor de histéresis (0,7)
uniform vec4  uLens;       // xy centro (px del lienzo, y arriba) · z radio (px)
uniform vec4  uLoupe;      // x 1 = lupa activa · y radio de clasificación (px) · z exponente de tono de los puntos
out vec4 o;
const ivec2 Z = ivec2(${ZX}, ${ZY});
float tone(float l){ return clamp(pow(max(l, 0.0), uTone.x) * uTone.y, 0.0, 1.0); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }           // Jimenez: ruido estable
float bayer4(vec2 p){ ivec2 q = ivec2(p) & 3; int a = q.x ^ q.y; return (float(((a & 1) << 3) | ((q.y & 1) << 2) | (((a >> 1) & 1) << 1) | ((q.y >> 1) & 1)) + 0.5) / 16.0; }
float thr(vec2 p){ return ${dither === 'ign' ? 'ign(p)' : 'bayer4(p)'}; }
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 zmax = uGrid * Z - 1;
  ivec2 z0 = c * Z;
  vec2 dl = vec2(uOrigin + c * uCellPx) + 0.5 * vec2(uCellPx) - uLens.xy;
  bool loupeCell = uLoupe.x > 0.5 && dot(dl, dl) < uLoupe.y * uLoupe.y;
  float w[24];                                                               // ventana 4×6 de tonos: la celda (2×4) y su anillo
  for (int y = 0; y < 6; y++)
    for (int x = 0; x < 4; x++) w[y * 4 + x] = tone(texelFetch(uZone, clamp(z0 + ivec2(x - 1, y - 1), ivec2(0), zmax), 0).a);
  vec3 col = vec3(0.0);
  float v[${NZ}];
  for (int k = 0; k < ${NZ}; k++){
    int i = k & 1, j = k >> 1;
    col += texelFetch(uZone, z0 + ivec2(i, j), 0).rgb;
    float a = w[(j + 1) * 4 + i + 1];
    int xo = i == 0 ? 0 : 3;
    float m = w[(j + 1) * 4 + xo];                                           // tomas externas: al otro lado del borde de la celda
    if (j == 0) m = max(m, max(w[i + 1], w[xo]));
    if (j == ${ZY - 1}) m = max(m, max(w[20 + i + 1], w[20 + xo]));
    float mm = max(a, m);
    a = mm > 1e-4 ? pow(a / mm, uTone.z) * mm : 0.0;                         // contraste direccional
    v[k] = clamp(a + (ign(vec2(z0 + ivec2(i, j)) + uStab.w) - 0.5) * uStab.z, 0.0, 1.0);   // ruido estable: rompe las bandas de tono
  }
  col *= ${f4(1 / NZ)};
  float mx = 0.0;
  for (int k = 0; k < ${NZ}; k++) mx = max(mx, v[k]);
  for (int k = 0; k < ${NZ}; k++) v[k] = mx > 1e-4 ? pow(v[k] / mx, uTone.w) * mx : 0.0;   // contraste global
  vec4 v0 = vec4(v[0], v[1], v[2], v[3]);
  vec4 v1 = vec4(v[4], v[5], v[6], v[7]);
  float gx = 0.0, gy = 0.0;                                                  // gradiente (Sobel grueso): ambos ejes a la misma escala física
  for (int y = 1; y < 5; y++) gx += 0.5 * (w[y * 4 + 2] + w[y * 4 + 3]) - 0.5 * (w[y * 4] + w[y * 4 + 1]);
  for (int x = 1; x < 3; x++) gy += 0.5 * (w[16 + x] + w[20 + x]) - 0.5 * (w[x] + w[4 + x]);
  gx *= 0.25; gy *= 0.25;
  float gm = length(vec2(gx, gy));
  vec4 pv = texelFetch(uPrev, c, 0);
  int pg = int(pv.a * 255.0 + 0.5);
  float t = (v[0] + v[1] + v[2] + v[3] + v[4] + v[5] + v[6] + v[7]) * ${f4(1 / NZ)};
  float bd = 1e9; float dp = 1e9; float d; vec4 a; vec4 b; int bi = 0;
  ${pick}
  col = mix(pv.rgb, col, uStab.y);                                           // color con memoria (EMA)
  o = vec4(col, float(bi) / 255.0);
}`;
}

// P3 — sello a resolución de dispositivo: un texel del atlas = un píxel del lienzo
const fragStamp = (mode, useMask) => `#version 300 es
precision highp float; precision highp int;
#define MODE_${mode.toUpperCase()}
${useMask ? '#define USE_MASK' : ''}
precision mediump sampler2D;
uniform sampler2D uCell;    // RGBA8, filtro LINEAR (solo lo usa el halo; el resto es texelFetch)
uniform sampler2D uAtlas;   // NEAREST
uniform sampler2D uZone;    // color por zona (puntos de la lupa)
uniform sampler2D uMask;    // (solo con USE_MASK) R8 cols×rows, LINEAR: 0 = detrás del texto, 1 = libre
uniform ivec2 uGrid, uCellPx, uOrigin;
uniform vec2  uInvCell;
uniform vec3  uBg;
uniform vec4  uInk;         // x ganancia de tinta · y halo · z fleco máx (px) · w suelo de tinta
uniform vec4  uLens;        // xy centro (px, y arriba) · z radio (px) · w 1 = fleco activo
uniform vec4  uLoupe;       // x 1 = lupa activa · y radio de clasificación (px)
uniform vec4  uBox;         // caja del texto: xy centro (px, y arriba) · zw semitamaño (px)
uniform vec3  uBoxK;        // x borde suave (px) · y tope de tinta dentro (0–1) · z radio de esquina (px)
out vec4 o;
vec3 inkOf(vec3 c){
  float m = max(max(c.r, c.g), c.b);
  vec3 hue = c / max(m, 1e-3);
  return hue * mix(uInk.w, 1.0, smoothstep(0.10, 0.85, m)) * uInk.x;      // matiz a brillo casi pleno: el TONO lo pone la forma del glifo
}
float brailleDot(ivec2 l, int bits){                                      // puntos redondos procedurales (Braille no está en Geist Mono)
  vec2 f = (vec2(l) + 0.5) / (vec2(uCellPx) / vec2(2.0, 4.0));
  ivec2 zi = ivec2(floor(f));
  if (((bits >> (zi.y * 2 + zi.x)) & 1) == 0) return 0.0;
  return 1.0 - smoothstep(0.30, 0.42, length(fract(f) - 0.5));
}
bool loupeCell(ivec2 c){ vec2 dl = vec2(uOrigin + c * uCellPx) + 0.5 * vec2(uCellPx) - uLens.xy; return uLoupe.x > 0.5 && dot(dl, dl) < uLoupe.y * uLoupe.y; }
vec3 glyphAt(ivec2 p){                                                    // tinta que aporta la celda que cubre el píxel p (px relativos a la rejilla)
  if (p.x < 0 || p.y < 0) return vec3(0.0);
  ivec2 c = ivec2(floor((vec2(p) + 0.5) * uInvCell));                     // sin división entera
  if (c.x >= uGrid.x || c.y >= uGrid.y) return vec3(0.0);
  ivec2 l = p - c * uCellPx;
  vec4 t = texelFetch(uCell, c, 0);
  int g = int(t.a * 255.0 + 0.5);
  if (g == 0) return vec3(0.0);
  if (loupeCell(c)) {                                                     // lupa: color propio de cada punto (zona) y recorte exacto al círculo
    vec2 f = (vec2(l) + 0.5) / (vec2(uCellPx) / vec2(2.0, 4.0));
    ivec2 zi = ivec2(floor(f));
    float inside = 1.0 - smoothstep(uLens.z - 1.0, uLens.z + 1.0, length(vec2(p + uOrigin) + 0.5 - uLens.xy));
    return inkOf(texelFetch(uZone, c * ivec2(2, 4) + zi, 0).rgb) * brailleDot(l, g) * inside;
  }
#ifdef MODE_BRAILLE
  return inkOf(t.rgb) * brailleDot(l, g);
#else
  ivec2 a = ivec2(g & 15, g >> 4) * uCellPx + ivec2(l.x, uCellPx.y - 1 - l.y);   // atlas de 16 columnas; y del atlas crece hacia abajo
  return inkOf(t.rgb) * texelFetch(uAtlas, a, 0).a;
#endif
}
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy) - uOrigin;
  vec3 ink;
  vec2 dv = gl_FragCoord.xy - uLens.xy;
  float r2 = dot(dv, dv), rOut = 1.12 * uLens.z;
  float w = 0.0, r = 0.0;
  if (uLens.w > 0.5 && r2 < rOut * rOut) {                                 // solo cerca de la lente se calcula el fleco
    r = sqrt(r2);
    w = smoothstep(0.35 * uLens.z, uLens.z, r) * (1.0 - smoothstep(uLens.z, rOut, r));
  }
  if (w > 0.001) {                                                        // fleco cromático por píxel: R hacia fuera, B hacia dentro
    ivec2 s = ivec2(round(dv / max(r, 1e-3) * uInk.z * w));
    ink = vec3(glyphAt(p + s).r, glyphAt(p).g, glyphAt(p - s).b);
  } else ink = glyphAt(p);
  vec3 halo = texture(uCell, (vec2(p) + 0.5) / vec2(uCellPx) / vec2(uGrid)).rgb;
#ifdef USE_MASK
  float k = mix(uBoxK.y, 1.0, texture(uMask, (vec2(p) + 0.5) / vec2(uCellPx) / vec2(uGrid)).r);   // mapa por celda: el filtro lineal da el borde suave
#else
  vec2 bd = abs(gl_FragCoord.xy - uBox.xy) - uBox.zw;
  float k = 1.0;                                                          // tras el texto: tinta topada (solo se evalúa cerca de la caja)
  if (uBoxK.y < 0.999 && max(bd.x, bd.y) < uBoxK.x) k = mix(uBoxK.y, 1.0, smoothstep(0.0, uBoxK.x, sdBox(gl_FragCoord.xy - uBox.xy, uBox.zw, uBoxK.z)));
#endif
  o = vec4(uBg + (halo * uInk.y + ink) * k, 1.0);
}`;

// ═════════════════════════ 3. Utilidades WebGL ═════════════════════════
function compile(gl, fragSrc, parallel) {
  return new Promise((resolve) => {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const vs = mk(gl.VERTEX_SHADER, VERT), fs = mk(gl.FRAGMENT_SHADER, fragSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    const done = () => {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('Shader:', gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(p)); return resolve(null); }
      const u = {};
      for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
      resolve({ p, u });
    };
    const poll = () => (parallel && !gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR) ? requestAnimationFrame(poll) : done());
    poll();
  });
}
function target(gl, w, h, filter) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, filter], [gl.TEXTURE_MAG_FILTER, filter], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fbo, w, h };
}

// ═════════════════════════ 4. Canalización ═════════════════════════
export class AsciiPipeline {
  /** @param {WebGL2RenderingContext} gl */
  constructor(gl, { set, oct = 4, mode = 'hybrid', rampChars = null, loupe = false, dither = 'bayer', mask = false }) {
    Object.assign(this, { gl, set, oct, mode, rampChars, loupe, mask, loupeOn: loupe, dither, frame: 0, onPass: null });   // loupe: código compilado · loupeOn: interruptor en ejecución
  }
  async compile() {
    const gl = this.gl, par = gl.getExtension('KHR_parallel_shader_compile'), t0 = performance.now();
    const [f, s, c, st] = await Promise.all([
      compile(gl, fragField(this.oct), par), compile(gl, fragShade, par),
      compile(gl, fragCell(this.set, this.mode, this.rampChars, this.loupe, this.dither), par), compile(gl, fragStamp(this.mode, this.mask), par),
    ]);
    if (!f || !s || !c || !st) return false;
    Object.assign(this, { ready: true, pField: f, pShade: s, pCell: c, pStamp: st, compileMs: Math.round(performance.now() - t0), vao: gl.createVertexArray() });
    this.uploadAtlas();
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.DITHER);                       // el alfa transporta un índice: el dither de hardware lo corrompería
    return true;
  }
  /** Solo P0 (cambio de nivel de calidad: menos octavas) */
  async setOctaves(oct) {
    const gl = this.gl, f = await compile(gl, fragField(oct), gl.getExtension('KHR_parallel_shader_compile'));
    if (!f) return false;
    gl.deleteProgram(this.pField.p); this.pField = f; this.oct = oct;
    return true;
  }
  uploadAtlas(set = this.set) {
    const gl = this.gl;
    this.set = set;
    if (!this.atlasTex) this.atlasTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, set.atlas);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  }
  /** layout = planGrid(...) + { W, H }. Reserva texturas y reinicia la memoria temporal. */
  resize(layout) {
    const gl = this.gl;
    this.L = layout;
    for (const t of ['field', 'zone', 'cellA', 'cellB']) if (this[t]) { gl.deleteTexture(this[t].tex); gl.deleteFramebuffer(this[t].fbo); }
    if (this.mask) {
      if (this.maskTex) gl.deleteTexture(this.maskTex);
      this.maskTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, layout.cols, layout.rows);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      this.setMask([]);
    }
    const zw = layout.cols * ZX, zh = layout.rows * ZY;
    this.field = target(gl, zw, zh, gl.NEAREST);
    this.zone = target(gl, zw, zh, gl.NEAREST);
    this.cellA = target(gl, layout.cols, layout.rows, gl.LINEAR);
    this.cellB = target(gl, layout.cols, layout.rows, gl.LINEAR);
    for (const t of [this.cellA, this.cellB]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.frame = 0;
  }
  /**
   * s = { time, scroll, zoom, ripples:[[x,y,t,amp]…3], lens:[x,y 0–1 y↑], lensR, intro, safe:[4], glow:[4×vec3 lineal], look:[gloss,prism],
   *       tone:[gamma,gain,dirExp,globExp], edge:[umbral,hist], stab:[hist,kColor,ruido,semilla], ink:[gain,halo,fringePx,floor], bg:[3 sRGB],
   *       box:{cx,cy,hx,hy,feather,cap,radius}, fringe:0|1 }
   */
  draw(s) {
    const gl = this.gl, L = this.L, cw = L.cw, ch = L.ch, zw = L.cols * ZX, zh = L.rows * ZY;
    const step = [cw / ZX, ch / ZY], hook = (n, e) => this.onPass && this.onPass(n, e);
    gl.bindVertexArray(this.vao);
    // P0 campo
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.field.fbo); gl.viewport(0, 0, zw, zh);
    gl.useProgram(this.pField.p); let u = this.pField.u;
    gl.uniform2f(u.uCanvas, L.W, L.H); gl.uniform4f(u.uZone, L.ox, L.oy, step[0], step[1]);
    gl.uniform1f(u.uTime, s.time); gl.uniform1f(u.uScroll, s.scroll); gl.uniform1f(u.uZoom, s.zoom);
    for (let i = 0; i < 3; i++) { const r = s.ripples[i] || [0, 0, 0, 0]; gl.uniform4f(u[`uRip${i}`], r[0], r[1], r[2], r[3]); }
    hook('P0', 0); gl.drawArrays(gl.TRIANGLES, 0, 3); hook('P0', 1);
    // P1 sombreado
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.zone.fbo);
    gl.useProgram(this.pShade.p); u = this.pShade.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.field.tex); gl.uniform1i(u.uField, 0);
    gl.uniform2f(u.uCanvas, L.W, L.H); gl.uniform4f(u.uZone, L.ox, L.oy, step[0], step[1]); gl.uniform2i(u.uZoneRes, zw, zh);
    gl.uniform2f(u.uLens, s.lens[0], s.lens[1]); gl.uniform1f(u.uLensR, s.lensR);
    gl.uniform1f(u.uIntro, s.intro); gl.uniform1f(u.uZoom, s.zoom); gl.uniform4fv(u.uSafe, s.safe);
    for (let i = 0; i < 4; i++) gl.uniform3fv(u[`uC${i}`], s.glow[i]);
    gl.uniform3f(u.uLook, s.look[0], s.look[1], 0);
    hook('P1', 0); gl.drawArrays(gl.TRIANGLES, 0, 3); hook('P1', 1);
    // P2 celda (ping-pong: lee las celdas del fotograma anterior)
    const cur = this.frame & 1 ? this.cellB : this.cellA, prev = this.frame & 1 ? this.cellA : this.cellB;
    gl.bindFramebuffer(gl.FRAMEBUFFER, cur.fbo); gl.viewport(0, 0, L.cols, L.rows);
    gl.useProgram(this.pCell.p); u = this.pCell.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.zone.tex); gl.uniform1i(u.uZone, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, prev.tex); gl.uniform1i(u.uPrev, 1);
    gl.uniform2i(u.uGrid, L.cols, L.rows); gl.uniform2i(u.uCellPx, cw, ch); gl.uniform2i(u.uOrigin, L.ox, L.oy);
    gl.uniform4fv(u.uTone, s.tone);
    const first = this.frame === 0;                                     // primer fotograma (y ?still): sin memoria ni histéresis → determinista
    gl.uniform4f(u.uStab, first ? 0 : s.stab[0], first ? 1 : s.stab[1], s.stab[2], s.stab[3] || 0);
    gl.uniform2f(u.uEdge, s.edge[0], s.edge[1]);
    const lensPx = [s.lens[0] * L.W, s.lens[1] * L.H, s.lensR * L.H];
    const classifyR = lensPx[2] + 0.5 * Math.min(cw, ch);
    gl.uniform4f(u.uLens, lensPx[0], lensPx[1], lensPx[2], 0);
    gl.uniform4f(u.uLoupe, this.loupe && this.loupeOn ? 1 : 0, classifyR, s.loupeTone ?? 1.5, 0);
    hook('P2', 0); gl.drawArrays(gl.TRIANGLES, 0, 3); hook('P2', 1);
    this._stamp(cur, s, this.loupe && this.loupeOn);
    this.frame++; this._cur = cur;
  }
  /**
   * Mapa de tope de tinta por celda (R8): 0 detrás de los bloques de texto, 1 libre. rects = [{x0,y0,x1,y1}] en px del lienzo, y hacia ARRIBA.
   * margin: celdas de holgura · blur: pasadas de suavizado [1 2 1] (el filtro lineal de P3 añade una celda más de borde).
   */
  setMask(rects, { margin = 1, blur = 1 } = {}) {
    const gl = this.gl, { cols, rows, cw, ch, ox, oy } = this.L;
    let a = new Uint8Array(cols * rows).fill(255);
    for (const r of rects) {
      const c0 = Math.max(0, Math.floor((r.x0 - ox) / cw) - margin), c1 = Math.min(cols - 1, Math.floor((r.x1 - ox) / cw) + margin);
      const r0 = Math.max(0, Math.floor((r.y0 - oy) / ch) - margin), r1 = Math.min(rows - 1, Math.floor((r.y1 - oy) / ch) + margin);
      for (let y = r0; y <= r1; y++) a.fill(0, y * cols + c0, y * cols + c1 + 1);
    }
    for (let p = 0; p < blur; p++) {                                                  // [1 2 1] separable
      const b = new Uint8Array(a.length);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) b[y * cols + x] = (a[y * cols + Math.max(0, x - 1)] + 2 * a[y * cols + x] + a[y * cols + Math.min(cols - 1, x + 1)]) >> 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) a[y * cols + x] = (b[Math.max(0, y - 1) * cols + x] + 2 * b[y * cols + x] + b[Math.min(rows - 1, y + 1) * cols + x]) >> 2;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);                                            // filas de cols bytes: sin relleno a 4
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED, gl.UNSIGNED_BYTE, a);
  }
  /** P3: sella las celdas de la textura `cur` (rgb color, a índice o bitmask). */
  _stamp(cur, s, withLoupe) {
    const gl = this.gl, L = this.L, cw = L.cw, ch = L.ch, hook = (n, e) => this.onPass && this.onPass(n, e);
    const lensPx = [s.lens[0] * L.W, s.lens[1] * L.H, s.lensR * L.H];
    const classifyR = lensPx[2] + 0.5 * Math.min(cw, ch);
    let u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, L.W, L.H);
    gl.useProgram(this.pStamp.p); u = this.pStamp.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cur.tex); gl.uniform1i(u.uCell, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.atlasTex); gl.uniform1i(u.uAtlas, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.zone.tex); gl.uniform1i(u.uZone, 2);
    if (this.mask) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.maskTex); gl.uniform1i(u.uMask, 3); }
    gl.uniform2i(u.uGrid, L.cols, L.rows); gl.uniform2i(u.uCellPx, cw, ch); gl.uniform2i(u.uOrigin, L.ox, L.oy); gl.uniform2f(u.uInvCell, 1 / cw, 1 / ch);
    gl.uniform3fv(u.uBg, s.bg); gl.uniform4fv(u.uInk, s.ink);
    gl.uniform4f(u.uLens, lensPx[0], lensPx[1], lensPx[2], s.fringe ? 1 : 0);
    gl.uniform4f(u.uLoupe, withLoupe ? 1 : 0, classifyR, 0, 0);
    const bx = s.box || { cx: 0, cy: 0, hx: 0, hy: 0, feather: 1, cap: 1, radius: 0 };
    gl.uniform4f(u.uBox, bx.cx, bx.cy, bx.hx, bx.hy); gl.uniform3f(u.uBoxK, Math.max(bx.feather, 1e-3), bx.cap, bx.radius);
    hook('P3', 0); gl.drawArrays(gl.TRIANGLES, 0, 3); hook('P3', 1);
  }
  /**
   * Modo «solo sello»: las celdas las calcula otro motor (p. ej. las escenas por CPU de 06-motion-architecture).
   * bytes = Uint8Array(cols·rows·4), RGBA: rgb = color, a = índice de glifo del atlas; fila 0 = ABAJO (convención GL). Sin lupa braille (no hay zonas).
   */
  drawCells(bytes, s) {
    const gl = this.gl, L = this.L;
    gl.bindTexture(gl.TEXTURE_2D, this.cellA.tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, L.cols, L.rows, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.bindVertexArray(this.vao);
    this._stamp(this.cellA, s, false);
    this._cur = this.cellA;
  }
  /** Depuración/pósters: celdas del último fotograma (a = índice de glifo o bitmask; rgb = color) */
  readCells() {
    const gl = this.gl, L = this.L, out = new Uint8Array(L.cols * L.rows * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._cur.fbo); gl.readPixels(0, 0, L.cols, L.rows, gl.RGBA, gl.UNSIGNED_BYTE, out); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return out;
  }
  dispose() {
    const gl = this.gl;
    for (const t of ['field', 'zone', 'cellA', 'cellB']) if (this[t]) { gl.deleteTexture(this[t].tex); gl.deleteFramebuffer(this[t].fbo); }
    for (const p of [this.pField, this.pShade, this.pCell, this.pStamp]) p && gl.deleteProgram(p.p);
    if (this.maskTex) gl.deleteTexture(this.maskTex);
    gl.deleteTexture(this.atlasTex); gl.deleteVertexArray(this.vao);
  }
}
```

### 4.2 Integración con `hero.ts`

`initAsciiHero` conserva de `hero.ts` la lógica de puntero, muelle de la lente, «repeler» el texto, ondas, energía, scroll, `IntersectionObserver`, visibilidad, pérdida de contexto, reposo sin bucle, control adaptativo y `?still`. Lo que sale: `fragA`, `fragB`, `VERT`, `PRECISION`, `build`, `compileAll`, `UNI_A/B`, `resizeField`, el buffer del triángulo y las llamadas de las dos pasadas dentro de `draw()`. Necesita `readLook()` ampliada con el color de fondo en sRGB:

```js
const srgbEncode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
function readLook() {
  return {
    glow: [0, 1, 2, 3].map((i) => toLinearSrgb(cssVar(`--glow-${i}`))),
    gloss: parseFloat(cssVar('--glow-gloss')) || 0.8,
    prism: parseFloat(cssVar('--glow-prism')) || 0.3,
    flow: parseFloat(cssVar('--glow-flow')) || 1,
    bg: toLinearSrgb(cssVar('--surface')).map(srgbEncode),     // el fondo del lienzo = --surface exacto
  };
}
```

```js
// initAsciiHero — sustituye el render de hero.ts (mismas entradas, mismo reposo, mismos niveles), con la canalización ASCII.
// Depende de: buildGlyphSet, planGrid, AsciiPipeline (hero-ascii.js) y de readLook()/toLinearSrgb() de hero.ts (se conservan).
const A_TIERS = {   // presupuestos por nivel: celdas de texto, octavas del campo, fps, píxeles de sello (lienzo real)
  high: { maxCells: 16000, oct: 5, fps: 60, stampPx: 6.0e6, loupe: true },
  mid: { maxCells: 9000, oct: 4, fps: 60, stampPx: 2.4e6, loupe: true },
  low: { maxCells: 4800, oct: 3, fps: 30, stampPx: 0.6e6, loupe: true },
  min: { maxCells: 2400, oct: 2, fps: 30, stampPx: 0.3e6, loupe: false },
};
const A_NEXT = { high: 'mid', mid: 'low', low: 'min', min: null };
const RAMP = ' .,:;~^=+*o#%&$@M';                 // 17 niveles; se ordenan solos por la tinta medida
const EDGE = '-|/\\';
const FAMILY = '"Geist Mono Variable"';
const A_REST = { x: 0.74, y: 0.6 };
const A_STILL_TIME = 21.7;
const A_INTRO = 2.6;

async function initAsciiHero(hero, look, pickTier, { useMask = false } = {}) {
  const canvas = hero.querySelector('.hero__gl');
  const content = hero.querySelector('.hero__content');
  const params = new URLSearchParams(location.search);
  const still = params.has('still');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const usePoster = () => { hero.dataset.hero = 'poster'; };
  if (reduced && !still) return usePoster();
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return usePoster();
  // load() devuelve las FontFace cargadas: vacío = la familia no está declarada; document.fonts.check() daría true igualmente
  const faces = await document.fonts.load(`500 16px ${FAMILY}`, RAMP + EDGE).catch(() => []);
  if (!faces.length || faces.some((f) => f.status !== 'loaded')) return usePoster();

  let tier = pickTier();
  let pipe = null, set = null, layout = null, ready = false, booted = false, raf = 0, last = 0, visible = true;
  const dbg = (window.__hero = { draws: 0, sleeping: false, t0: performance.now(), tier, downgrade: () => downgrade() });
  const state = { time: 0, scroll: 0, energy: 0, introStart: -1, interacting: false, lastMove: 0 };
  const lens = { x: A_REST.x, y: A_REST.y }, target = { x: A_REST.x, y: A_REST.y }, restPos = { x: A_REST.x, y: A_REST.y };
  const ripples = [];
  let box = { x0: 0, x1: 0, y0: 0, y1: 0 }, aspectNow = 1.6, safe = [0.3, 0.3, 0.4, 0.35], scale = 1;
  const frameTimes = [];

  function plan() {                                          // tamaño del lienzo y de la rejilla para el nivel actual (sin tocar la GPU)
    const r = hero.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const dprEff = Math.min(dpr, Math.sqrt(A_TIERS[tier].stampPx / Math.max(1, r.width * r.height)));   // presupuesto de píxeles del sello
    const W = Math.max(64, Math.round(r.width * dprEff)), H = Math.max(64, Math.round(r.height * dprEff));
    const fsCss = Math.round(10 + 3 * Math.min(1, Math.max(0, (r.width - 360) / 1000)));                   // 10 px (móvil) … 13 px (escritorio ancho)
    return { r, W, H, dprEff, g: planGrid({ W, H, dpr: dprEff, fsCss, maxCells: A_TIERS[tier].maxCells, advance: 0.6 }) };
  }
  const glyphs = (g) => buildGlyphSet({ family: FAMILY, weight: 500, chars: RAMP + EDGE, cw: g.cw, ch: g.ch });
  async function build() {                                   // crea y compila la canalización (una sola vez)
    set = glyphs(plan().g);                                  // índices y tintas no dependen del tamaño de celda: solo el atlas
    pipe = new AsciiPipeline(gl, { set, oct: A_TIERS[tier].oct, mode: 'hybrid', rampChars: RAMP + EDGE, loupe: true, dither: 'bayer', mask: useMask });
    pipe.loupeOn = A_TIERS[tier].loupe;
    return pipe.compile();
  }
  function repel(pt) {                                       // igual que hero.ts: la lente rodea el texto
    const R = Math.min(0.17, aspectNow * 0.2) * 1.15;
    const x0 = box.x0 - R / aspectNow, x1 = box.x1 + R / aspectNow, y0 = box.y0 - R, y1 = box.y1 + R;
    if (box.x1 <= box.x0 || pt.x <= x0 || pt.x >= x1 || pt.y <= y0 || pt.y >= y1) return;
    const cost = [(pt.x - x0) * aspectNow, (x1 - pt.x) * aspectNow, pt.y - y0, y1 - pt.y];
    const m = Math.min(...cost);
    if (m === cost[0]) pt.x = x0; else if (m === cost[1]) pt.x = x1; else if (m === cost[2]) pt.y = y0; else pt.y = y1;
    pt.x = Math.min(1, Math.max(0, pt.x)); pt.y = Math.min(1, Math.max(0, pt.y));
  }
  function sizeCanvas() {
    const { r, W, H, dprEff, g } = plan();
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    scale = dprEff;
    if (!layout || g.cw !== layout.cw || g.ch !== layout.ch) {                                              // el atlas solo se rehace si cambia la celda
      set = glyphs(g);
      pipe.uploadAtlas(set);
    }
    layout = { ...g, W, H };
    pipe.resize(layout);
    const c = content.getBoundingClientRect();
    aspectNow = r.width / r.height;
    safe = [(c.left - r.left + c.width / 2) / r.width, 1 - (c.top - r.top + c.height / 2) / r.height, Math.max(0.16, (c.width / 2 / r.width) * 1.3), Math.max(0.16, (c.height / 2 / r.height) * 1.5)];
    box = { x0: (c.left - r.left) / r.width, x1: (c.right - r.left) / r.width, y0: 1 - (c.bottom - r.top) / r.height, y1: 1 - (c.top - r.top) / r.height };
    if (useMask) updateMask();
    restPos.x = A_REST.x; restPos.y = A_REST.y; repel(restPos);
    if (!ready || still) { lens.x = target.x = restPos.x; lens.y = target.y = restPos.y; }
  }
  function updateMask() {                                    // cada bloque de texto real (h1, p, botones…) → rectángulo en px del lienzo (y hacia arriba)
    const r = hero.getBoundingClientRect();
    const rects = [...hero.querySelectorAll('[data-ascii-clear]')].map((el) => {
      const b = el.getBoundingClientRect();
      return { x0: (b.left - r.left) * scale, x1: (b.right - r.left) * scale, y0: layout.H - (b.bottom - r.top) * scale, y1: layout.H - (b.top - r.top) * scale };
    });
    pipe.setMask(rects, { margin: 1, blur: 1 });
  }
  const boxPx = () => {                                      // caja del texto en px del lienzo (y hacia arriba), con margen de una celda y borde de dos
    const cw = layout.cw, W = layout.W, H = layout.H;
    return { cx: ((box.x0 + box.x1) / 2) * W, cy: ((box.y0 + box.y1) / 2) * H, hx: ((box.x1 - box.x0) / 2) * W + cw, hy: ((box.y1 - box.y0) / 2) * H + cw, feather: 2 * cw, cap: 0.45, radius: 1.5 * cw };
  };
  function draw(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (state.introStart < 0) state.introStart = now;
    const intro = still ? 1.4 : Math.min(1.4, (now - state.introStart) / 1000 / (A_INTRO / 1.4));
    if (!still && !state.interacting && now - state.lastMove > 1800) { target.x = restPos.x; target.y = restPos.y; }
    repel(target);
    const k = 1 - Math.exp(-dt * (state.interacting ? 9 : 4));
    lens.x += (target.x - lens.x) * k; lens.y += (target.y - lens.y) * k;
    repel(lens);
    const lensDist = Math.hypot(target.x - lens.x, target.y - lens.y);
    state.energy = Math.max(0, state.energy - dt / 1.3);
    if (!still) state.time += dt * (0.1 + state.energy * 0.85) * look.flow;
    for (let i = ripples.length - 1; i >= 0; i--) if ((now - ripples[i].t0) / 1000 > 3.2) ripples.splice(i, 1);
    const aspect = layout.W / layout.H;
    const zoom = Math.min(2.6, Math.max(1, 0.95 / aspect));
    const cw = layout.cw;
    pipe.draw({
      time: still ? A_STILL_TIME : state.time, scroll: still ? 0 : state.scroll, zoom,
      ripples: ripples.slice(0, 3).map((r) => [(r.x - 0.5) * aspect, r.y - 0.5, (now - r.t0) / 1000, r.amp]),
      lens: [lens.x, lens.y], lensR: Math.min(0.17, aspect * 0.2), intro, safe, glow: look.glow, look: [look.gloss, look.prism],
      tone: [0.9, 1.5, 1.6, 1.3], edge: [0.16, 0.7], stab: [0.04, 1 - Math.exp(-dt * 12), 0.03, 0], ink: [1, 0.35, 0.3 * cw, 0.55],
      bg: look.bg, box: boxPx(), fringe: 1,
    });
    dbg.draws++;
    if (!ready) { ready = true; dbg.firstFrameMs = Math.round(performance.now() - dbg.t0); hero.dataset.hero = 'live'; }
    if (!still && intro >= 0.2) {                              // control adaptativo: solo baja de nivel
      frameTimes.push(dt * 1000);
      if (frameTimes.length >= 40) {
        const med = [...frameTimes].sort((a, b) => a - b)[20]; frameTimes.length = 0;
        if (med > (1000 / A_TIERS[tier].fps) * 1.5) downgrade();
      }
    }
    return { busy: intro < 1.4 || state.energy > 0.012 || lensDist > 0.0008 || ripples.length > 0 || state.interacting };
  }
  async function downgrade() {
    const next = A_NEXT[tier];
    if (!next) { stop(); return usePoster(); }
    tier = next; dbg.tier = tier;
    await pipe.setOctaves(A_TIERS[tier].oct);                // solo se recompila el campo (como hero.ts); la lupa se apaga en ejecución
    pipe.loupeOn = A_TIERS[tier].loupe;
    layout = null; sizeCanvas(); wake();                     // celdas más grandes → atlas nuevo, mismas tintas/índices
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (last && now - last < 1000 / A_TIERS[tier].fps - 2) { raf = requestAnimationFrame(loop); return; }
    const { busy } = draw(now);
    dbg.sleeping = !busy;
    if (busy) raf = requestAnimationFrame(loop); else last = 0;
  }
  const wake = () => { if (booted && !raf && visible && !document.hidden) { dbg.sleeping = false; raf = requestAnimationFrame(loop); } };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const toNorm = (e) => { const r = hero.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)) }; };
  if (!still) {
    hero.addEventListener('pointerdown', (e) => { const p = toNorm(e); state.interacting = true; target.x = p.x; target.y = p.y; state.lastMove = performance.now(); state.energy = Math.min(1, state.energy + 0.6); ripples.push({ x: p.x, y: p.y, t0: performance.now(), amp: 1 }); if (ripples.length > 3) ripples.shift(); wake(); });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' && !state.interacting) return;
      const r = hero.getBoundingClientRect();
      if (e.pointerType === 'mouse' && (e.clientY < r.top || e.clientY > r.bottom)) return;
      const p = toNorm(e); const sp = Math.hypot(p.x - target.x, p.y - target.y);
      target.x = p.x; target.y = p.y; state.lastMove = performance.now(); state.energy = Math.min(1, state.energy + sp * 2.2); wake();
    }, { passive: true });
    const up = () => { state.interacting = false; state.lastMove = performance.now(); wake(); };
    window.addEventListener('pointerup', up, { passive: true }); window.addEventListener('pointercancel', up, { passive: true });
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const dy = Math.abs(window.scrollY - lastScrollY); lastScrollY = window.scrollY;
      state.scroll = Math.min(1, window.scrollY / window.innerHeight); state.energy = Math.min(1, state.energy + Math.min(0.35, dy / 60)); wake();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : wake()));
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? wake() : stop(); }).observe(hero);
  }
  new ResizeObserver(() => { if (!pipe || !pipe.ready) return; sizeCanvas(); still ? draw(performance.now()) : wake(); }).observe(hero);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); usePoster(); });
  try { if (!(await build())) return usePoster(); } catch (e) { console.warn(e); return usePoster(); }
  sizeCanvas();
  booted = true;
  if (still) requestAnimationFrame((t) => { draw(t); window.__heroReady = true; });
  else { ready = false; raf = requestAnimationFrame(loop); }
}
```

Notas de integración:
1. **Marcado**: el bloque de texto lleva `data-ascii-clear` en cada elemento que debe quedar libre de tinta (h1, p, botones). Con `useMask: false` se usa la caja de `.hero__content` (analítica); con `useMask: true`, un mapa R8 por celda (es lo que hace falta cuando la misma capa cubre **toda la página** con varios bloques de texto: recalcular `updateMask()` en `scroll`/`resize`, coste ≈ `cols·rows` bytes por `texSubImage2D`).
2. **CSS**: `.hero__gl { background: var(--surface); }` y `data-hero="live"` hace el fundido de entrada; el póster CSS (`--hero-poster-*`) sigue siendo el primer pintado.
3. **Fuente**: precargar **solo** `geist-mono-latin-wght-normal.woff2` (23 KB) con un `<link rel="preload" as="font" type="font/woff2" crossorigin>` propio: según `03-typography-accessibility.md`, el `preload` del proveedor `npm` de Astro precarga los **seis** subconjuntos de Geist (71 KB). `initAsciiHero` espera `document.fonts.load` y, si no hay FontFace cargada, cae al póster.
4. **CSP**: no añade peticiones; el atlas se dibuja en un canvas 2D local; nada de `eval`, ni blobs, ni workers.
5. **`?still`**: dibuja **un** fotograma determinista (`frame === 0` desactiva memoria e histéresis; tiempo fijo `A_STILL_TIME`) y marca `window.__heroReady`; `scripts/posters.mjs` sigue valiendo para regenerar los pósters.
6. **Estado de depuración**: `window.__hero` conserva `draws`, `sleeping`, `firstFrameMs`, `tier` (más `downgrade()` para pruebas).

### 4.3 Cómo se ve la lente en ASCII, capa por capa

1. **P1 (campo refractado con dispersión).** Igual que `hero.ts`: dentro del disco, `pr = p − dir·(0,6·R)·k²` (k = 1 − r/R) y el color sale de **tres** evaluaciones de `shade()` desplazadas ±`0,02·prisma` en la dirección radial: el canal R se refracta un poco hacia fuera, el B hacia dentro. El borde se suaviza en **una zona** (`smoothstep(R − px, R + px)`), no en un píxel: así las celdas del borde reciben cobertura parcial y salen glifos de borde en vez de una escalera. El brillo del aro se suma en P1.
2. **P2 (dispersión por celda).** El color de cada celda es la media de sus 8 zonas: la dispersión se ve como un cambio de matiz de una celda de ancho (cian/magenta) en el aro. Las celdas cuyo **centro** cae dentro de `R + ½ celda` pasan a **lupa**: 8 puntos braille por celda, umbral de Bayer 4×4 sobre `pow(v, 1,5)` con histéresis por punto (±`uStab.x`).
3. **P3 (dispersión por punto y por píxel).** Los puntos de la lupa toman el color **de su propia zona** (`texelFetch(uZone)`): dispersión ocho veces más fina que por celda. El disco se recorta con un círculo exacto (`smoothstep(R−1, R+1)`) → borde limpio. Además, en la corona `0,35R … 1,12R` se calculan tres lecturas del sello: R en `p + s`, G en `p`, B en `p − s`, con `s = radial · 0,3·cw · w` (w sube de 0,35R a R y cae hasta 1,12R): **fleco cromático real en los trazos** de los glifos que rodean el orbe.
4. La misma regla `dot(dl, dl) < R²` se evalúa en P2 y en P3 con las mismas entradas (`uLens`, `uLoupe`, centro de celda en píxeles) para decidir si el `a` de una celda es índice de glifo o bitmask, sin canal extra. Es determinista en una misma GPU.

**Idea no adoptada:** un glifo distinto por canal (tres índices por celda, tres lecturas del atlas con colores R/G/B puros). Exige MRT o tres texturas de celda; el fleco por píxel ya da el efecto.

### 4.4 Encaje con los otros informes (`03-typography-accessibility.md`, `06-motion-architecture.md`)

- **P3 es un motor de sellado reutilizable.** `pipe.drawCells(bytes, estado)` sube una textura de celdas calculada por otro motor (RGBA: rgb = color, a = índice de glifo; fila 0 abajo) y ejecuta solo P3 (halo, fleco, tope de tinta, atlas 1:1). Se probó con un campo de senos calculado en CPU (120×33 celdas) y sella bien [medido]. Así conviven **las escenas por celda en CPU** de `06` (funciones puras que también corren en Node para el póster SSR) y **el campo de luz líquida en GPU** de la portada: el uno alimenta a P3 con `drawCells`, el otro con P0–P2. Para la luz líquida la GPU es el camino: el campo pide ≈ 15 evaluaciones de `noise` por celda (3 `fbm` × 5 octavas), unas 135 000 por fotograma con 9 000 celdas: en JS son varios ms en escritorio y decenas en un Android modesto [sin medir]; en GPU, P0 cuesta 0,0056 ms con 13 120 celdas (RTX) [medido].
- **Divergencia declarada con `06` (WebGL1):** este informe exige **WebGL2** (96,44 % de soporte) a cambio de `texelFetch`, enteros y sin relleno de atlas: el boceto de `06` usa `texture2D` con filtro y `clamp(f, 0.03, 0.97)` para no sangrar entre glifos; con `texelFetch` NEAREST no hay sangrado ni relleno. Los dispositivos sin WebGL2 reciben el póster.
- **Paridad del póster SSR.** El campo de GPU no corre en Node. El póster `<pre>` del hero se genera en el build con el mismo Chrome de Playwright que ya usa `scripts/posters.mjs`: cargar `?still`, esperar `__heroReady` y llamar `readCells()` (glifo + color por celda, determinista: fotograma 0, tiempo fijo) [sin medir el tamaño real; `06` mide 1,5–2,4 KB comprimidos para platos de 160×50 y 200×60 con rampa de 10 niveles]. Si en cambio el hero usa una escena CPU, el póster sale de Node como propone `06`.
- **Alinear el DOM con el lienzo.** La celda del lienzo son enteros de **píxeles de dispositivo**; para superponer el `<pre>` SSR o los marcos de `03` hay que publicar `--cell-w: cw/dprEff px` y `--cell-h: ch/dprEff px` (fraccionarios en CSS) desde `sizeCanvas()` y dar al DOM `font-size: cw/(0,6·dprEff)` px, `line-height: var(--cell-h)`, `font-variant-ligatures: none`, `font-kerning: none`. La fuente de la verdad es el lienzo, no un `fs` CSS fraccionario. La receta de interlineado contra costuras de `03` es para texto DOM y **no aplica al canvas** (el atlas dibuja cada glifo en su propia celda).
- **Pozos de lectura.** `data-ascii-clear` (aquí) equivale a `data-well` de `06`: mapa R8 por celda con filtro lineal = borde suave de una celda; con `blur: 1` y `margin: 1`, unas 3 celdas de transición.
- **Bloques y caja de Geist Mono** (`symbols2`, 5,8 KB) siguen siendo opcionales para el canvas y **obligatorios** para el DOM ASCII de `03`; el canvas de este informe no los necesita.

---

## 5. Técnicas en detalle (por qué cada decisión)

### 5.1 Zonas 2×4 en lugar de píxeles
Cada celda es la unidad de tono y de forma. Evaluar el campo y la iluminación en 8 zonas por celda (con `ch = 2·cw` las zonas son cuadradas) da suficiente detalle para escoger glifo y descarta el 99 % de las evaluaciones de la portada actual. Los bordes de la lente y las ondas son de escala mayor que una zona, por eso siguen siendo nítidos.

### 5.2 Regla `hybrid`
`t` = media de las 8 zonas tras el contraste; glifo de la rampa cuya **tinta normalizada** (`ink / inkMax`) es la más cercana a `t`; si `gm = |(gx, gy)| > 0,16` (0,16·0,7 si el glifo anterior ya era un trazo) el glifo pasa a `-`, `|`, `/` o `\` según la razón de ejes (2,4) y el signo de `gx·gy` (con y hacia arriba, mismo signo → contorno `\`). El gradiente sale de un Sobel grueso sobre la ventana 4×6 con los dos ejes a la misma escala física.

### 5.3 Ventana 4×6 y contraste
La celda son 2×4 zonas; con el anillo de una zona alrededor la ventana es 4×6 = 24 lecturas. Para cada zona interna, las tomas externas son las zonas del otro lado del borde (horizontal, y arriba/abajo en filas extremas, más diagonales): `v = (v / max(v, ext))^1,6 · max(v, ext)` (contraste direccional, exponente 1,6) y luego `v = (v / máx)^1,3 · máx` (global). Es la idea de Harri con partición exacta en vez de círculos.

### 5.4 Histéresis y memoria
Cada celda recuerda su glifo (textura de celdas en ping-pong). Cambia solo si el candidato gana por un margen (0,04 en unidades de tono); el umbral de trazo tiene su propia histéresis (×0,7); cada punto braille, la suya. El color tiene memoria exponencial con `k = 1 − e^(−12·dt)` (en `?still` y en el primer fotograma `k = 1` y margen 0). El ruido de rotura de bandas (IGN, amplitud 0,03) está anclado a la coordenada de zona, nunca al tiempo.

### 5.5 Tinta, halo y nitidez
`inkOf` normaliza el color al canal máximo (el **matiz** al máximo brillo, con suelo 0,55) y deja el **tono** a la forma del glifo: sin eso, las celdas tenues se pierden. El halo es `texture()` sobre la textura de celdas con filtro LINEAR (bilineal entre colores de celda: un campo continuo detrás de los glifos), sumado al fondo con ganancia 0,35. La mezcla de cobertura se hace en espacio gamma, como en todo el CSS: el texto claro sobre oscuro se ve algo más fino; se compensa con peso 500.

### 5.6 Tope de tinta tras el texto
Dentro de la caja del texto (o donde el mapa por celda valga 0), la tinta y el halo se multiplican por 0,45 (borde de 2 celdas, esquina de 1,5 celdas, margen de 1 celda). Es lo que da ≥ 5,04:1 en la prueba analítica y ≥ 6,07:1 (`lead`) en la portada compuesta de móvil. Para texto en `--muted` sobre el campo en móvil hace falta 0,35, o no ponerlo ahí. Respetar `prefers-contrast: more` con un tope de 0,25 es una mejora barata [sin medir].

### 5.7 Reposo y póster
Sin bucle continuo: el ciclo `requestAnimationFrame` se detiene cuando `intro ≥ 1,4`, la energía es < 0,012, la lente llegó y no hay ondas. `prefers-reduced-motion` y `?still` usan un **único** fotograma o el póster; el ASCII no se inyecta en el DOM (10 000 celdas colapsarían a un lector de pantalla; si se quisiera un póster textual, `readCells()` entrega glifo y color por celda: 3 500–13 000 celdas ≈ 10–40 KB de texto más colores cuantizados [sin medir]): el canvas es decorativo (`aria-hidden="true"`) y todo el contenido real sigue siendo texto semántico.

---

## 6. Variantes

### 6.1 Modo Braille global (`mode: 'braille'`)
Cada celda pasa a 8 puntos: el bitmask (`bit k` = zona `k`) va en `a`; `brailleDot()` dibuja el punto redondo en P3. Es el aspecto de «pantalla de puntos». Histéresis por punto: 0,46 % de cambios por fotograma y 0 % de inversiones (sección 2.4). Umbral: Bayer 4×4 da un degradado limpio y regular; IGN da un patrón más orgánico con estrías diagonales.

### 6.2 Cuartos y bloques (▘▝▖▗▀▄▌▐░▒▓█)
Se probó un modo de cuartos 2×2 procedural (bitmask de 4 bits, rectángulos exactos en P3): aspecto de píxel-art de baja resolución; con umbral IGN aparecen estrías diagonales. Como glifos de fuente, Geist Mono tiene los 32 Block Elements (subset `symbols2`, 5,8 KB extra): añadir `▒▓█` a la rampa (40 %, 80 %, 100 % de tinta) ampliaría el rango de tono por encima del 36 % del ASCII. **No se probó visualmente**; cuesta un archivo de fuente más.

### 6.3 Vector de forma (`mode: 'shape'`)
Los `G` vectores normalizados se hornean como literales GLSL (`a = v0 − vec4(...)`; `d = dot(a,a) + dot(b,b)` por glifo, sin arrays ni acceso dinámico). Útil para arte de líneas o pósters con bordes duros. Con la luz líquida colapsa (sección 2.3).

### 6.4 Lectura de la forma desde textura
Alternativa al desenrollado: textura RGBA32F de `G × 2` texels y un `for` con `texelFetch`. Compila 3× más rápido y ejecuta 2,2× más lento en P2 (medido). Solo interesa con conjuntos de > 100 glifos.

### 6.5 Canvas 2D
Pensado solo para pósters y para la ruta de emergencia de 15 fps:

```js
// Una cadena por (fila, cubo de color): las celdas de otro cubo llevan espacios (fuente monoespaciada → alineación exacta)
ctx.font = `500 ${cw / 0.6}px "Geist Mono Variable"`; ctx.textBaseline = 'alphabetic'; ctx.fontKerning = 'none';
for (let b = 0; b < BUCKETS; b++) {
  ctx.fillStyle = palette[b];
  for (let y = 0; y < rows; y++) {
    let s = '', any = false;
    for (let x = 0; x < cols; x++) { const i = glyphIndex[y * cols + x]; if (i && bucketOf[y * cols + x] === b) { s += RAMP[i]; any = true; } else s += ' '; }
    if (any) ctx.fillText(s, ox, oy + y * ch + base);
  }
}
```
Regla: contexto 2D **con** alfa (por defecto) y `fontKerning = 'none'`. Medido: 8,7 ms/fotograma con 10 k celdas frente a 10,6 ms de `fillText` por celda y 35,6 ms de `drawImage`.

### 6.6 WebGPU (opcional, no adoptado)
Kernel de la pasada de celda `hybrid` en WGSL: compila y se ejecuta (sección 2.8). Los índices de `-`, `|`, `\`, `/` son constantes de ejemplo.

```wgsl
// Pasada de celda (variante "hybrid") como kernel de cómputo WebGPU: un hilo = una celda.
// Entrada: textura de zonas (rgba8unorm, a = luma) de (2·cols × 4·rows). Salida: textura de celdas (rgba8unorm, a = índice de glifo).
struct P {
  grid : vec2<i32>,
  tone : vec4<f32>,      // gamma, ganancia, exp. direccional, exp. global
  stab : vec4<f32>,      // histéresis, k color, ruido, semilla
  edge : vec2<f32>,      // umbral, factor de histéresis
};
@group(0) @binding(0) var zones : texture_2d<f32>;
@group(0) @binding(1) var prevCells : texture_2d<f32>;
@group(0) @binding(2) var outCells : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> p : P;
@group(0) @binding(4) var<storage, read> rampInk : array<f32>;     // tinta normalizada de cada glifo de la rampa (ascendente)
@group(0) @binding(5) var<storage, read> rampIdx : array<u32>;     // índice del glifo en el atlas

fn tone(l : f32) -> f32 { return clamp(pow(max(l, 0.0), p.tone.x) * p.tone.y, 0.0, 1.0); }
fn ign(q : vec2<f32>) -> f32 { return fract(52.9829189 * fract(dot(q, vec2<f32>(0.06711056, 0.00583715)))); }

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let c = vec2<i32>(gid.xy);
  if (c.x >= p.grid.x || c.y >= p.grid.y) { return; }
  let zmax = p.grid * vec2<i32>(2, 4) - vec2<i32>(1, 1);
  let z0 = c * vec2<i32>(2, 4);
  var w : array<f32, 24>;
  for (var y = 0; y < 6; y++) {
    for (var x = 0; x < 4; x++) {
      let q = clamp(z0 + vec2<i32>(x - 1, y - 1), vec2<i32>(0, 0), zmax);
      w[y * 4 + x] = tone(textureLoad(zones, q, 0).a);
    }
  }
  var col = vec3<f32>(0.0);
  var v : array<f32, 8>;
  var mx = 0.0;
  for (var k = 0; k < 8; k++) {
    let i = k & 1;
    let j = k >> 1;
    col += textureLoad(zones, z0 + vec2<i32>(i, j), 0).rgb;
    var a = w[(j + 1) * 4 + i + 1];
    let xo = select(3, 0, i == 0);
    var m = w[(j + 1) * 4 + xo];
    if (j == 0) { m = max(m, max(w[i + 1], w[xo])); }
    if (j == 3) { m = max(m, max(w[20 + i + 1], w[20 + xo])); }
    let mm = max(a, m);
    a = select(0.0, pow(a / mm, p.tone.z) * mm, mm > 1e-4);
    v[k] = clamp(a + (ign(vec2<f32>(z0 + vec2<i32>(i, j)) + p.stab.w) - 0.5) * p.stab.z, 0.0, 1.0);
    mx = max(mx, v[k]);
  }
  col = col * 0.125;
  var t = 0.0;
  for (var k = 0; k < 8; k++) {
    v[k] = select(0.0, pow(v[k] / mx, p.tone.w) * mx, mx > 1e-4);
    t += v[k] * 0.125;
  }
  var gx = 0.0;
  var gy = 0.0;
  for (var y = 1; y < 5; y++) { gx += 0.5 * (w[y * 4 + 2] + w[y * 4 + 3]) - 0.5 * (w[y * 4] + w[y * 4 + 1]); }
  for (var x = 1; x < 3; x++) { gy += 0.5 * (w[16 + x] + w[20 + x]) - 0.5 * (w[x] + w[4 + x]); }
  gx *= 0.25; gy *= 0.25;
  let gm = length(vec2<f32>(gx, gy));
  let pv = textureLoad(prevCells, c, 0);
  let pg = i32(pv.a * 255.0 + 0.5);
  // búsqueda en la rampa: aquí SÍ hay memoria compartida de sobra, un bucle normal en vez de literales desenrollados
  var bd = 1e9; var dp = 1e9; var bi = 0u;
  for (var r = 0u; r < arrayLength(&rampInk); r++) {
    let d = abs(rampInk[r] - t);
    if (d < bd) { bd = d; bi = rampIdx[r]; }
    if (i32(rampIdx[r]) == pg) { dp = d; }
  }
  var outIdx = i32(bi);
  if (dp <= bd + p.stab.x) { outIdx = pg; }
  if (gm > p.edge.x) {
    let ax = abs(gx); let ay = abs(gy);
    // índices de - | \ / en el atlas se pasan como constantes de la canalización (aquí ejemplo)
    if (ay > ax * 2.4) { outIdx = 5; } else if (ax > ay * 2.4) { outIdx = 6; } else { outIdx = select(8, 7, gx * gy > 0.0); }
  }
  col = mix(pv.rgb, col, p.stab.y);
  textureStore(outCells, c, vec4<f32>(col, f32(outIdx) / 255.0));
}
```

---

## 7. Nitidez y `devicePixelRatio`

1. Tamaño del lienzo: `W = round(anchoCSS · dprEff)`. En Chrome/Edge conviene `ResizeObserver` con `{ box: 'device-pixel-content-box' }` y `entry.devicePixelContentBoxSize[0]` (píxeles físicos exactos); en Safari/Firefox, `Math.round(rect.width · devicePixelRatio)` [fuente: web.dev]. El error de ±1 px es inocuo aquí porque la rejilla se centra con origen entero; **lo dañino** es que el navegador reescale el lienzo (bilineal sobre glifos nítidos): mantener el `<canvas>` en `width: 100%; height: 100%` y `dprEff = dpr` cuando el presupuesto lo permite.
2. Cuando `dprEff < dpr` (niveles `low`/`min`), el navegador amplía el lienzo entre 1,05× y 1,5×: los glifos pierden algo de filo. Es el precio de mantener el coste de P3.
3. La fuente del atlas mide `cw / avance` píxeles; el avance se mide con `measureText('M')` a 100 px (0,6 em en Geist Mono) y la línea base se centra con `fontBoundingBoxAscent/Descent` (Chrome 87+, Safari 11.1+, Firefox 116+ [regla]; con respaldo `0,95·fs` / `0,3·fs`).
4. Sin `textureGrad`, sin mipmaps, sin filtrado en el atlas: el `texelFetch` exacto no tiene costuras.

---

## 8. Presupuestos móviles y validación en el Samsung A07

**Lo que hay que medir (nada de esto está medido):**
1. Abrir `?tier=low` (añadir el parámetro a `pickTier` como hoy) con Chrome remoto (`chrome://inspect`). Leer `window.__hero` (`draws`, `firstFrameMs`, `tier`).
2. `EXT_disjoint_timer_query_webgl2` suele estar desactivada en Android: usar como barrera `gl.readPixels(0, 0, 1, 1, ...)` tras `draw()` y `performance.now()` alrededor, 200 fotogramas, mediana. El ayudante de consultas de tiempo por pasada está en el apéndice C por si el dispositivo la expone.
3. Criterios de aceptación: mediana ≤ 16,7 ms (*high*/*mid*) o ≤ 33 ms (*low*/*min*) durante 10 s de arrastre; `firstFrameMs` < 600 ms; compilación < 800 ms; 0 fotogramas en reposo.
4. Escalera de optimización si no llega (por orden de efecto esperado): bajar `stampPx` (coste lineal); bajar `maxCells` (P2 y P1); tope de 30 fps; `loupeOn = false`; después de todo eso, minificar y quitar comentarios. Los interruptores de lupa, fleco y tope no mueven la aguja (sección 2.5).
5. Riesgos específicos de Mali: (a) `precision mediump sampler2D` en P2/P3 es la regla de Arm pero no se probó en Mali; (b) `precision highp sampler2D` en P1 protege los 16 bits de la altura: si se leyera en fp16 se perdería casi la mitad de la precisión y el gradiente saldría con ruido; (c) compilación en el driver de Mali: la primera vez puede pasar de 1 s: mantener el póster CSS visible hasta `data-hero="live"`; (d) comprobar que `KHR_parallel_shader_compile` existe en Chrome Android; si no, la compilación bloquea el hilo principal [sin medir].
6. Lighthouse móvil: el `<canvas>` no cuenta para LCP; el LCP debe seguir siendo el `h1`. El JS de la portada añade ≈ 9 KB gzip sin minificar frente a `hero.ts` actual.

---

## 9. Trampas

1. **Fuente sin cargar → atlas con fuente de respaldo, en silencio.** Esperar `document.fonts.load('500 16px "Geist Mono Variable"', chars)` y **comprobar que devuelve FontFace cargadas** (`length > 0` y `status === 'loaded'`); `document.fonts.check()` **devuelve `true` aunque la familia no exista** (medido: `check: true`, `load().length: 0`). `buildGlyphSet` añade una red de seguridad por avance (`|avance − 0,6| > 0,02` lanza error), que no distingue a Courier New (también 0,6 em). Si algo falla: póster. [medido; MDN]
2. **`getContext('2d', { alpha: false })` activa el antialias LCD**: 561/561 píxeles de borde con fleco de color. Usar el contexto por defecto y leer `.a`. [medido]
3. **Braille, formas geométricas, sextantes y octantes no están en Geist Mono**: una fuente del sistema los sustituiría con otra forma y otro ancho en cada dispositivo. Dibujar los puntos con matemática. [medido]
4. **`gl.DITHER` está activo por defecto** y el alfa de la textura de celdas lleva un índice: `gl.disable(gl.DITHER)`. No se reprodujo corrupción en la RTX; es un riesgo de drivers móviles con coste cero de evitar. [regla]
5. **`unpack`**: `UNPACK_PREMULTIPLY_ALPHA_WEBGL = false`, `UNPACK_FLIP_Y_WEBGL = false`, `UNPACK_COLORSPACE_CONVERSION_WEBGL = NONE` al subir el atlas; texturas R8 con filas que no son múltiplo de 4 bytes exigen `UNPACK_ALIGNMENT = 1`.
6. **Precisión por defecto**: en fragment ES 3.00 `sampler2D` es `lowp` y `int` es `mediump`. Declarar `precision highp float; precision highp int;` y, según el dato: `highp sampler2D` para la altura de 16 bits (P1), `mediump sampler2D` para índices y colores de 8 bits (P2/P3). [regla]
7. **`textureGrad` y mipmaps**: costosos en Mali y fuente de costuras. `texelFetch` con NEAREST y sin mips. [fuente: Arm réplica; Codrops réplica]
8. **Divisiones enteras por píxel**: −31 % de P3 al usar `floor((p + ½) · (1/cw))` y un atlas de 16 columnas con `&`/`>>`. [medido]
9. **Índices en RGBA8**: decodificar con `int(a · 255 + 0,5)`, nunca `floor`. Máximo 255 glifos (o bitmask de 8 bits).
10. **Vector de forma en campos suaves**: colapsa en `| : !`. Híbrido. [medido]
11. **Sin histéresis, del 17 % al 31 % de los cambios de glifo son parpadeo A→B→A.** [medido] Anclar el dither a la celda; un ruido con desplazamiento temporal lo reintroduce.
12. **Celdas 2:1 y lente redonda**: con celdas de 8×16 px el disco se ve como un rectángulo redondeado de glifos. La lupa braille (puntos 1:1) resuelve el círculo. [medido, visual]
13. **Contraste**: sin tope de tinta el peor píxel tras el texto da 3,31:1 con `--ink`. [medido]
14. **Compilación**: 95 bloques desenrollados = 445 ms en ANGLE (1,5 s la primera vez). Mantener el conjunto de la rampa pequeño (17–21 glifos), usar `KHR_parallel_shader_compile` y no bloquear el primer pintado. [medido]
15. **Estado temporal al redimensionar**: `resize()` reinicia el ping-pong; el primer fotograma no usa memoria ni histéresis (y hace `?still` determinista).
16. **`readPixels`/`toDataURL` del lienzo WebGL** exigen `preserveDrawingBuffer` o hacerlo en la misma tarea que `draw()`; para pósters usar `?still` y `readCells()`.
17. **Tamaño del lienzo en DPR fraccionario**: `round(css·dpr)` y `floor` difieren en 1 px (2,625 → 1 079 / 1 078). No reescalar el lienzo con CSS. [medido]
18. **El texto sobre el lienzo**: nunca meter el ASCII como texto DOM; `aria-hidden="true"` en el canvas; `prefers-reduced-motion` → póster.
19. **Ondas y campos con mucho detalle**: `rip()` con `sin(d·38)` tiene longitud de onda ≈ 0,165 de la altura; con menos de 8 filas por longitud de onda se alia. Con 55–65 filas está bien.
20. **Puntos braille inconsistentes entre P2 y P3**: si la regla de la lupa no usa exactamente las mismas entradas, una celda del borde puede interpretar un bitmask como índice de glifo. Mantener `uLens`/`uLoupe` idénticos en ambas pasadas.
21. **Comparar colores en gamma**: la luma de P1 es `dot(rgb_gamma, Rec.709)` (no lineal) y el glifo se elige sobre esa luma: es lo que se ve mejor; no «corregirlo» a lineal sin volver a ajustar `tone`.

---

## 10. Decisiones cerradas para Gaya Digital

1. **WebGL2 obligatorio** para la portada ASCII viva (96,44 % de soporte). Sin WebGL2, sin contexto o con `prefers-reduced-motion` / ahorro de datos: **póster estático** (el mismo mecanismo de hoy). Canvas 2D solo genera pósters; no hay ruta viva por CPU.
2. **Canalización de 4 pasadas** (campo, sombreado, celda, sello), todo **RGBA8** y `texelFetch`, sin extensiones obligatorias (`KHR_parallel_shader_compile` opcional). GLSL ES 3.00 con `highp` explícito.
3. **Rejilla**: celda de `cw × 2·cw` píxeles de dispositivo enteros, zonas 2×4, `cw = round(fsCss · 0,6 · dprEff)`, `fsCss` de 10 a 13 px, origen centrado entero.
4. **Fuente**: Geist Mono Variable **peso 500** para el atlas; solo el subset `latin` (ya autoalojado, 23 KB), precargado. Sin glifos fuera de ASCII: braille y cuartos son procedurales; los Block Elements (`symbols2`, 5,8 KB) quedan como opción no probada.
5. **Modo por defecto: `hybrid`** (rampa de 17 glifos + trazos `- | / \`). `shape` solo para arte de líneas o pósters.
6. **Rampa**: ` .,:;~^=+*o#%&$@M`, ordenada en tiempo de ejecución por la tinta medida con el mismo rasterizador; glifos de contorno `- | / \`. Nunca las rampas clásicas.
7. **Trazos**: Sobel grueso sobre ventana 4×6; umbral 0,16 con histéresis ×0,7; razón de ejes 2,4.
8. **Estabilidad**: histéresis 0,04; color EMA `k = 1 − e^(−12·dt)`; ruido IGN 0,03 anclado a la zona; primer fotograma y `?still` sin memoria.
9. **Tono (punto de partida a ajustar en pantalla con Cobalto)**: gamma 0,9, ganancia 1,5, exponente direccional 1,6, global 1,3; tinta: ganancia 1, halo 0,35, suelo 0,55, fleco `0,3·cw`.
10. **Lente**: campo refractado con dispersión R/G/B en P1 (como hoy) + **lupa braille 2×4** dentro del disco (Bayer 4×4, color por punto, recorte de círculo exacto) + **fleco cromático por píxel** en la corona `0,35R … 1,12R` + borde suavizado en una zona.
11. **Tope de tinta tras el texto: 0,45** con margen de 1 celda, borde de 2 y esquina de 1,5; mapa R8 por celda cuando la capa cubra la página entera con varios bloques; 0,35 si se coloca texto `--muted` sobre el campo en móvil.
12. **Niveles**: tabla de la sección 3.3 (celdas 16 000 / 9 000 / 4 800 / 2 400; octavas 5/4/3/2; 60/60/30/30 fps; `stampPx` 6,0 / 2,4 / 0,6 / 0,3 M). Se conservan reposo sin bucle y control adaptativo que solo baja; al bajar solo se recompila P0.
13. **Descartados por medición**: sello instanciado (1,4–1,6× más lento), lectura de formas por textura (2,2× más lenta en P2), cuartos con IGN (estrías), CPU con `getImageData` (three.js `AsciiEffect`), Canvas 2D para la portada viva (40–60 ms estimados en Android modesto), WebGPU por ahora (cobertura menor y nada que necesite cómputo), morph por SDF, difusión de error.
14. **Accesibilidad**: `<canvas aria-hidden="true">`; todo el contenido real es texto semántico en el DOM; `prefers-reduced-motion` → póster; contraste garantizado por el tope de tinta; considerar `prefers-contrast: more` con tope 0,25 y ocultar el lienzo con `forced-colors: active`.
15. **Privacidad y red**: cero peticiones nuevas; el atlas se construye en un canvas 2D local; la CSP `default-src 'self'` se mantiene.
16. **P3 es API pública** (`drawCells`): cualquier motor de celdas (CPU de `06`, GPU de este informe) sella con la misma pasada. El campo de luz líquida se queda en GPU; las escenas de otras secciones pueden ir por CPU. El póster ASCII del hero se genera en build con `?still` + `readCells()`.
17. **Carga de fuente**: `document.fonts.load` con comprobación de FontFace cargadas (nunca `check()`), precarga manual solo del `latin` (23 KB); alineación DOM–lienzo publicando `--cell-w/--cell-h` desde el lienzo.
18. **Validación pendiente y bloqueante**: medir en un Samsung A07 real con el procedimiento de la sección 8 antes de fijar `stampPx` y `maxCells` definitivos.

---

## Apéndice A · Comprobar la cobertura de una fuente (lectura de `cmap` en `.woff2`)

Sirve para no volver a suponer qué glifos trae un paquete de `@fontsource-variable` (probado con Geist Mono, JetBrains Mono y Martian Mono):

```js
import { readFileSync, readdirSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
const KNOWN = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];
export function readCmap(file) {
  const b = readFileSync(file);
  let o = 12; const numTables = b.readUInt16BE(12); const totalCompressed = b.readUInt32BE(20);
  o = 48;
  const rb128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const c = b[o++]; v = (v * 128) + (c & 0x7f); if (!(c & 0x80)) return v; } throw new Error('b128'); };
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = b[o++]; let idx = flags & 0x3f; const ver = flags >> 6;
    let tag; if (idx === 63) { tag = b.toString('latin1', o, o + 4); o += 4; } else tag = KNOWN[idx];
    const orig = rb128(); let len = orig;
    const transformed = (tag === 'glyf' || tag === 'loca') ? ver === 0 : ver !== 0;
    if (transformed) len = rb128();
    dir.push({ tag, orig, len });
  }
  const data = brotliDecompressSync(b.subarray(o, o + totalCompressed));
  let p = 0; const tables = {};
  for (const d of dir) { tables[d.tag] = data.subarray(p, p + d.len); p += d.len; }
  const cm = tables['cmap'];
  const n = cm.readUInt16BE(2); let best = null;
  for (let i = 0; i < n; i++) {
    const pid = cm.readUInt16BE(4 + i * 8), eid = cm.readUInt16BE(6 + i * 8), off = cm.readUInt32BE(8 + i * 8);
    const fmt = cm.readUInt16BE(off);
    if ((fmt === 12) || (fmt === 4 && !best)) best = { off, fmt };
  }
  const set = new Set();
  const off = best.off;
  if (best.fmt === 12) {
    const ng = cm.readUInt32BE(off + 12);
    for (let g = 0; g < ng; g++) { const s = cm.readUInt32BE(off + 16 + g * 12), e = cm.readUInt32BE(off + 20 + g * 12), gid = cm.readUInt32BE(off + 24 + g * 12); for (let c = s; c <= e; c++) if (gid + (c - s) !== 0) set.add(c); }
  } else {
    const segX2 = cm.readUInt16BE(off + 6); const segs = segX2 / 2;
    const endO = off + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
    for (let s = 0; s < segs; s++) {
      const end = cm.readUInt16BE(endO + s * 2), start = cm.readUInt16BE(startO + s * 2), delta = cm.readInt16BE(deltaO + s * 2), ro = cm.readUInt16BE(rangeO + s * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid;
        if (ro === 0) gid = (c + delta) & 0xffff; else { const gi = rangeO + s * 2 + ro + (c - start) * 2; gid = cm.readUInt16BE(gi); if (gid) gid = (gid + delta) & 0xffff; }
        if (gid) set.add(c);
      }
    }
  }
  return set;
}
```

Uso: `const set = readCmap('node_modules/@fontsource-variable/geist-mono/files/geist-mono-symbols2-wght-normal.woff2'); set.has(0x2588)` → `true`.

## Apéndice B · Rampa automática por tinta medida

`inkByChar` es `{ carácter: fracciónDeTinta }` (la medida sale de `buildGlyphSet().ink`). Escoge, entre un conjunto candidato, los `N` glifos más cercanos a `N` valores equiespaciados de tinta:

```js
function pickRamp(inkByChar, pool, N) {
  const cand = [...pool].filter((c) => c in inkByChar).sort((a, b) => inkByChar[a] - inkByChar[b]);
  const max = inkByChar[cand[cand.length - 1]];
  const out = []; const used = new Set();
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * max;
    let best = null, bd = 1e9;
    for (const c of cand) { if (used.has(c)) continue; const d = Math.abs(inkByChar[c] - t); if (d < bd) { bd = d; best = c; } }
    used.add(best); out.push(best);
  }
  return out.sort((a, b) => inkByChar[a] - inkByChar[b]);
}
```

## Apéndice C · Tiempo de GPU por pasada (para el laboratorio y para dispositivos que lo permitan)

`AsciiPipeline.onPass = (nombre, 0|1) => …` da los ganchos de inicio/fin de cada pasada:

```js
function makeGpuTimer(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pend = []; const acc = {};
  return {
    ok: !!ext,
    begin(name) { if (!ext) return; const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); this.cur = { name, q }; },
    end() { if (!ext || !this.cur) return; gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push(this.cur); this.cur = null; },
    async flush() {
      if (!ext) return acc;
      for (let tries = 0; tries < 200 && pend.length; tries++) {
        for (let i = pend.length - 1; i >= 0; i--) {
          const { name, q } = pend[i];
          if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) {
            const dis = gl.getParameter(ext.GPU_DISJOINT_EXT);
            if (!dis) { const ns = gl.getQueryParameter(q, gl.QUERY_RESULT); (acc[name] ||= []).push(ns / 1e6); }
            gl.deleteQuery(q); pend.splice(i, 1);
          }
        }
        if (pend.length) await new Promise((r) => setTimeout(r, 5));
      }
      return acc;
    },
  };
}
// pipe.onPass = (n, fin) => (fin ? t.end() : t.begin(n));  …  const acc = await t.flush();  // ms por pasada
```
