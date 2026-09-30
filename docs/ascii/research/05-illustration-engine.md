# 05 · Ilustración ASCII procedural que se lee como arte: motor de rejilla, generadores y cinco escenas

Fecha: 2026-09-30 · Proyecto: `gaya-web` (Astro 7 estático, Node 24) · Tema: cómo se dibuja **ilustración de oficio** (no ruido) con caracteres, con qué motor mínimo, con qué generadores procedurales y con qué presupuesto de CPU, más cinco escenas concretas (web/apps, marketing, soporte IT, automatización e IA, Santo Domingo).

Convención de fiabilidad (igual que en `06`): **[V]** leído en la fuente primaria en esta sesión · **[S]** dato de un buscador o resumen (sin abrir la fuente primaria) · **[M]** medido por mí, con scripts, en esta sesión · **[C]** criterio propio (razonado, no verificado en fuente).

**Todo el código del Anexo B se escribió y ejecutó aquí** (Node 24 y Chrome 154 con Playwright: capturas de las cinco escenas, prueba de paridad WebGL2↔Canvas 2D, prueba del planificador con desplazamiento, con `prefers-reduced-motion` y con la CPU frenada ×4). No se tocó ningún archivo del proyecto salvo este documento. Máquina de medición: Windows 11, Chrome 154, RTX 5070 Ti, 12 hilos, **compartida y ocupada** (≈110 procesos `chrome.exe` de otros trabajos en paralelo): las cifras son **órdenes de magnitud repetidos**, no microbenchmarks de laboratorio. El Samsung A07 **no se pudo medir**; se usa como proxy la CPU frenada ×4 de Chrome (ver §3.8).

---

## 0. Resumen ejecutivo

**Qué hace que ASCII «se lea como ilustración» (y no como ruido)** — cinco reglas, todas aplicadas en las escenas del Anexo B:

1. **Forma antes que textura.** Los caracteres no son píxeles [V: Alex Harri]. Siluetas por cobertura (cuadrantes `▘▝▖▗▀▄▌▐█`, resolución ×2), contornos con glifos direccionales (`/ \ | _ ¯ -`, cajas `╭╮╰╯`), y **dither solo en degradados anchos**, nunca en bordes.
2. **Valores en planos** con luz de borde: escena nocturna = silueta oscura (negativo) contra un resplandor cobalto (positivo); interfaz = línea clara sobre panel oscuro. Un solo foco por escena; **≥ 40 % de celdas vacías**.
3. **Rampa de densidad medida con la fuente real, no supuesta** [M]: la clásica `" .:-=+*#%@"` no es monótona en Geist Mono (`:` 6 % > `-` 5 %) y su error de linealidad (RMS) es 0,124; ` .:=*xX#%@` da 0,032. Y **la tinta ASCII máxima es 37 %** (`M`, `W`): para masas sólidas hacen falta bloques (`░▒▓█` = 25/50/75/100 %) o el tono.
4. **Dither de ruido azul anclado a la celda** (estable en el tiempo) [V: Ditherpunk, Obra Dinn]. Medido a 22 % de umbral: Bayer 8×8 sale en **rayas horizontales** en celdas 1:2, R2 e IGN en **retículas diagonales**, el ruido azul (vacío-y-racimo, 64×64, 42 ms de cálculo) en reparto uniforme. Bayer solo para medios tonos «retro» deliberados.
5. **Bajo fps con carácter y animación por capas, no por celdas.** Movimiento «de a dos» (12 fps, como el cine de animación [S]), acto en tres tiempos (anticipación → acción → asentamiento), **ciclado de paleta** (Mark Ferrari [S/V]) para el brillo del agua, las estrellas y la cruz de luz: **cero celdas tocadas**.

**Hallazgo de rendimiento que cambia el diseño [M]** (7 200 celdas = 120×60, hilo principal por cuadro completo): en Canvas 2D **el coste es por llamada, no por píxel**: ≈ 2,1–2,6 µs por celda en escritorio y **8–14 µs con la CPU ×4**, sea `fillText` o `drawImage` desde un atlas. **El atlas con `drawImage` por celda NO le gana a `fillText`** (1,7–2,1 µs frente a 2,4–2,6 µs por celda; en raster por software `fillText` gana 2×). Lo que gana: (a) **diff por celda** (solo se dibuja lo que cambió), (b) **una cadena por fila** (0,76 ms por 60 filas), y sobre todo (c) **WebGL2 con una textura de celdas: 0,03–0,05 ms de hilo principal por cuadro** (0,15 ms con CPU ×4). Un repintado completo de 7 200 celdas cuesta **70–100 ms con la CPU ×4** (proxy de un Android modesto) en Canvas 2D: imposible a 15–24 fps; con WebGL2, 0,15 ms.

**Arquitectura resultante** (Anexo B, ≈ 1 900 líneas, **motor + 5 escenas = 19,1 KB gzip / 16,8 KB brotli** [M]):

- **`Grid`**: celda de 4 bytes `[glifo, tono fg, tono bg, banderas]` en un `ArrayBuffer` con vista `Uint32Array` (comparar/copiar/llenar celdas de una vez), **capas con transparencia** (`overlay`), bandas (`blit`), primitivas (`put text box stroke arc poly ellipse sprite shade`). Sin DOM: corre igual en Node (pruebas, SSR) y en el navegador.
- **Glifos**: ASCII + `· ¯` de Geist Mono; **bloques, cuadrantes, octavos y trazos de caja se dibujan por código** (rectángulos de píxeles enteros) al construir el atlas: encajan sin costuras entre filas, no dependen de que cargue `symbols2` ni de la fuente de respaldo.
- **Render**: **WebGL2 primario** (1 textura RGBA8UI de celdas + atlas de máscaras + paleta de 32 entradas, 1 draw, `texelFetch`); **Canvas 2D de respaldo** con baldosas opacas horneadas bajo demanda y **diff por celda** (130–250 baldosas distintas por escena = 0,3–0,5 MB a DPR 2); los dos producen **píxeles idénticos** (diferencia media 0,000–0,004/255 en 4 escenas; 0,23/255 en `sd` solo por la paleta congelada).
- **Escenas**: funciones deterministas de `t` (`frame(grid, t) → 0|1`, con caché de capas y firma de reposo). Sirven igual con reloj propio (acto de 4–8 s), con **desplazamiento** (`t = settle·progreso`) o con `prefers-reduced-motion` (`t = settle`). Coste en reposo: **0 subidas de celdas** en `web`/`mkt`/`sd` (`sd` solo sube 128 bytes de paleta), 0,17–0,48 ms por cuadro con la CPU ×4 en `sd`/`ai`.
- **Planificador** (`mountStage`): solo anima lo visible, construye con margen del 60 %, libera el contexto WebGL a los 4 s de alejarse (nunca > 2 vivos; límite de Chrome: 16 [S]), tiers de fps que solo bajan, `prefers-reduced-motion` → cuadro final sin bucle, pausa, `fontsReady`.

**Santo Domingo** (cierre): Obelisco, Catedral Primada, Alcázar de Colón, puente Juan Bosch, Faro a Colón (con su cruz de luz) y Malecón, **generados con polígonos, trazos y cajas** (nada calcado de fotos), con datos verificados (§1.6) y fuentes visuales con licencia (§1.6). **Solo el Faro se verificó visualmente** (una foto CC BY-SA 4.0 que la herramienta de lectura dejó en caché al pedir su descripción); el resto se construyó desde descripciones textuales y **debe compararse con las fotos citadas antes de aprobar** (no se descargaron más imágenes por política).

**Riesgos abiertos:** (1) A07 real sin medir; (2) el presupuesto de `06` (≤ 12 KB gz de motor, ≤ 6 KB de escenas) se excede en escenas (12,1 KB): cargarlas con `import()` al llegar; (3) tres decisiones chocan con `06` y se resuelven en §0.2; (4) la tabla de ruido azul añade 4 KB (o 1,4 KB con 32×32).

### 0.2 Encaje con `02`, `03` y `06` (acuerdos y desviaciones)

| Tema | Ellos | Este informe | Resolución |
|---|---|---|---|
| Render principal | `02`/`06`: textura de celdas + atlas + un quad WebGL2; Canvas 2D solo póster/respaldo | Igual (mi `render-gl.mjs` es el P3 de `02`); **medido**: Canvas 2D full-frame = 70–100 ms/cuadro con CPU ×4 | **Acuerdo.** Mis 3 números añadidos: atlas+`drawImage` ≈ `fillText`; cadena por fila ≈ 60 µs con CPU ×4; diff por celda decide el respaldo |
| Fuente | `03`: Geist Mono única; `latin` + `symbols2`; sin Braille; prohibidos `→ ✓ ■ ● ▲ ▶ ≈` | Igual: ASCII + `· ¯` de `latin`; **cajas/bloques procedurales en el canvas** | **Acuerdo.** `symbols2` solo hace falta para arte en DOM. `03 §1.4` (costuras entre filas con glifos de fuente) es justo la razón de dibujar bloques por código |
| Rampa | `02`: rampa de 17 glifos ordenada por tinta medida; nunca la clásica | Igual (medí 0,124 vs 0,032 de RMS); rampa ASCII de 10 pasos ` .:=*xX#%@` + bloques | **Acuerdo.** Mi script `buildAtlas().cov` da la cobertura para ordenar la de `02` |
| Un canvas o varios | `06`: **un único canvas fijo**, escenas por bandas de scroll, nunca un canvas por sección | Mi `mountStage` monta un canvas por escena (con liberación); **`Grid.blit` permite bandas** (probado: dos escenas apiladas y desplazadas 22 filas en un solo canvas, una sola subida) | **Adoptar `06`**: las 5 escenas son «pintores» (`frame(grid,t)`) que escriben en su `Grid` y se copian a la banda del campo fijo. `mountStage` queda como modo autónomo/plan B (`/referencias/`, pruebas) |
| Movimiento autónomo | `06 #17`: **ninguno** tras el encendido (≤ 2,6 s); solo scroll/puntero/foco | Mis actos duran 4,4–8,4 s y hay bucles en reposo (latido, pulsos, brillo del agua) | **Adoptar `06`**: `t = settle · ease(progreso de sección)` (la escena es pura en `t`: se «escrubea»); los bucles en reposo (paleta, latidos) solo avanzan con `fase += dt·(0,1+0,85·energía)` y se duermen a los 1,6 s. El reloj propio del prototipo queda como alternativa con botón de pausa (2.2.2) |
| Tiers / fps | `06`: tiers por celdas (9 000/6 500/4 200/2 400), tope 30 fps, sueño 1,6 s | Mis tiers de fps (24/15/12/8) sobre el coste medio | **Adoptar los de `06`** para el bucle; mantener de mi código la **firma de reposo** (`frame()` devuelve 0) y el «solo paleta» |
| Respaldo Canvas 2D | `06`: pasadas por tono con `fillText` por fila | Diff por baldosas; **una pasada por tono y fila = T×60 llamadas de ~62 µs con CPU ×4** (≈ 30 ms con T=8) | **Mío para escenas de ilustración** (pocas celdas cambian); el de `06` sirve para campos densos. Regla: si cambian > 900 celdas por cuadro, bajar a 8 fps |
| Póster | `06`: `<pre>` SSR del hero (`renderPlate`) | `toHTML(grid)` da `<pre>` con corridas coloreadas: **0,4–2,5 KB gz** por escena; AVIF q50 a 1920×1280: 4–27 KB [M] | Para las 5 escenas (bajo el pliegue) **no hace falta póster**: reservar la caja con `aspect-ratio`; `<pre>` solo si se quiere sin JS |
| Ruido | `06`: hash/ruido enteros, sin `Math.sin/pow` para paridad póster↔runtime | Mis escenas usan `Math.sin/cos/exp` (paridad de imagen, no de glifo) | Aceptable: no hay póster SSR de estas escenas. Si se quisiera paridad exacta, sustituir por polinomios |

---

## 1. Hallazgos con URLs

### 1.1 Oficio: qué enseñan las fuentes sobre arte con caracteres

| Fuente | Qué se aprendió | Uso aquí |
|---|---|---|
| Alex Harri, «ASCII characters are not pixels» <https://alexharri.com/blog/ascii-rendering> [V] | Cada glifo se mide como vector de forma 6D (2×3 círculos); se elige el glifo más parecido a las 6 muestras de la celda; contraste global (potencia) y **direccional** (9 círculos externos); caché con clave de 30 bits (5 bits por componente) poblada sobre la marcha; en CPU 147 456 muestras por cuadro hundieron un iPhone → 6 pasadas en GPU | La lección de fondo: **la forma cuenta**. Para arte de líneas (trazos con `/ \ | _ ¯ -`) sí; para campos suaves colapsa en `\| : !` (medido en `02 §2.3`) |
| `oddurs/rummy` <https://github.com/oddurs/rummy> [V] (MIT) | Escenas 3D→ASCII en WebGL2: muestreo 2×3 por celda (≈ 6 % del sombreado a resolución completa), TAA para fijos, paleta con dither ordenado; 0,98–1,73 ms de GPU a 1080p | Confirma «una muestra por celda» y paleta con dither |
| `textmode.js` <https://github.com/humanbydefinition/textmode.js/> [V] (MIT; UrsaFont CC0) | WebGL2 instanciado, **capas** con Grid propio, atlas de fuente; ruido determinista; exporta TXT/SVG | Mi `Grid` + `overlay`/`blit` es el mismo modelo, mínimo y sin dependencias |
| VS Code, «Integrated Terminal Performance Improvements» <https://code.visualstudio.com/blogs/2017/10/03/terminal-renderer> [V] | DOM→canvas: capas de texto/selección/enlaces/cursor; **regiones sucias**; atlas `ImageBitmap`; 5–45× más rápido que el DOM | Diff por celda y capas |
| VS Code, Terminal Appearance <https://code.visualstudio.com/docs/terminal/appearance> [V] | `terminal.integrated.customGlyphs`: caja, bloques, **Braille**, Powerline se dibujan «pixel-perfect», rellenan la celda y **no exigen que la fuente los tenga** | **Decisión: bloques y cajas procedurales** |
| xterm.js #6074 <https://github.com/xtermjs/xterm.js/issues/6074> [V] | La clave del atlas incluía el color de fondo → una baldosa por (glifo × fondo) y crecimiento sin límite con fondos variables | Baldosas acotadas: 130–250 por escena [M]; los fondos son pocos tonos |
| coder/ghostty-web #163 <https://github.com/coder/ghostty-web/issues/163> [V] | Caché de glifos en canvas fuera de pantalla con `drawImage` **perdió** (0,91–0,98× de lo directo); los `fillRect` procedurales llegan a 2,4 M glifos/s | Coincide con mi medida: el atlas no ahorra llamadas |
| MDN, «Optimizing canvas» <https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas> [V] | Coordenadas enteras, prerenderizar, no escalar en `drawImage`, capas, agrupar llamadas, evitar `shadowBlur`, `alpha:false` | Aplicado; **ojo** `alpha:false` activa antialias LCD en texto (`02 §9 #2`) |
| MDN, «WebGL best practices» <https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices> [V] | `texStorage`+`texSubImage`, no `getError`/`readPixels` en bucle, `antialias:false`, evitar `alpha:false`, `WEBGL_lose_context` | `render-gl.mjs` lo cumple |
| Paul Bourke, «Character representation of grey scale images» <https://paulbourke.net/dataformats/asciiart/> [V] | Rampas de 70 y 10 niveles; muestrear la mitad en vertical; «la densidad varía entre tipografías» | Mi medición lo confirma con números (§1.5) |
| a1k0n, «Donut math» <https://www.a1k0n.net/2011/07/20/donut-math.html> [V] · vgel, «SDF en 46 líneas de Python» <https://vgel.me/posts/donut/> [V] | Rampa `.,-~:;=!*#$@`, z-buffer con 1/z; raymarching de un toro: 30 pasos, normal por 6 muestras (ε 0,001) | `sdfRender` (§4): 0,49 ms a 44×22 |
| Tyler Hobbs, «Flow Fields» <https://www.tylerxhobbs.com/words/flow-fields> [V] | Rejilla de ángulos ≈ 0,5 % del ancho, paso 0,1–0,5 %, curvas largas vs cortas («pelo»), separación mínima, **distorsiones no continuas** además de Perlin | `flowField` (§4) |
| Fabien Sanglard, «How DOOM fire was done» <https://fabiensanglard.net/doom_fire_psx/> [V] | Autómata: matriz de 0–36, fuente abajo, propagación hacia arriba con decaimiento aleatorio y viento | `fireStep` (§4) |
| 16colo.rs <https://16colo.rs/> [S] · Joan Stark (Wikipedia) <https://en.wikipedia.org/wiki/Joan_Stark> [S] | Tradición ANSI/ASCII: `░▒▓█` para degradar, línea y espacio negativo | Justifica el «ASCII extendido (CP437)» como lenguaje |
| drububu, dithering en pixel art <https://drububu.com/tutorial/pixel-art-and-dithering.html> [V] · Lospec <https://lospec.com/pixel-art-tutorials/tags/dithering> [S] | El dither de **ruido** es el menos molesto; se hace casi siempre a mano en formas irregulares; se ve como grano con paletas muy pequeñas | Regla: dither solo en degradados anchos; costuras estrechas sobre mesetas planas |
| Mark Ferrari, GDC «8 Bit & 8 Bitish Graphics» <https://www.gdcvault.com/play/1023586/8-Bit-8-Bitish-Graphics> [S] · Canvas Cycle <http://www.effectgames.com/demos/canvascycle/> [V] · <https://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html> [V] | **Ciclado de paleta**: animar rotando entradas de la paleta indexada, sin tocar píxeles; solo se refrescan los píxeles que apuntan a colores animados; «BlendShift» interpola | Agua, estrellas, cruz de luz: **0 celdas** por cuadro |
| «Frame Rate in Animation» <https://nicholasjean.medium.com/frame-rate-in-animation-why-less-is-more-1fe11b328193> [S] · Spider-Verse (Screen Rant / Sessions) [S] | «De a dos» = 12 fps con cada cuadro repetido; mezclar «de a uno» y «de a dos» según el personaje; movimiento entrecortado con intención | Actos a 12 fps efectivos; brillos por paleta a la cadencia del bucle |

### 1.2 Dither y ruido: fuentes y medición

| Fuente | Dato |
|---|---|
| Wikipedia, ordered dithering <https://en.wikipedia.org/wiki/Ordered_dithering> [V] | Bayer por recursión `M₂ₙ = 1/(2n)² [4Mₙ, 4Mₙ+2Jₙ; 4Mₙ+3Jₙ, 4Mₙ+Jₙ]`; `c' = paleta(c + r·(M − ½))`, `r ≈ 255/N`; menos parpadeo que la difusión de error → apto para animación |
| Surma, «Ditherpunk» <https://surma.dev/things/ditherpunk/> [V] | Dither en espacio **lineal**; Bayer estándar sale más claro que el original (invertir `1−M`); ruido azul por vacío-y-racimo; ordenado = determinista/paralelo/estable, difusión de error = secuencial e inestable en movimiento |
| Lucas Pope, devlog de Obra Dinn <https://dukope.com/devlogs/obra-dinn/tig-32/> [V] | Dos patrones: Bayer 8×8 (tonos suaves) y **ruido azul 128×128** (menos ordenado); el dither debe anclarse al espacio para no «nadar»; supermuestreo ×2 evita moiré |
| Demofox, vacío-y-racimo <https://blog.demofox.org/2019/06/25/generating-blue-noise-textures-with-void-and-cluster/> [V] | Tres fases (patrón inicial ~10 % de unos relajado; quitar racimos → rangos; rellenar vacíos hasta 50 %; el resto por racimos de ceros); σ 1,9 mejor que 1,5; toroidal → teselable |
| Christoph Peters, Free blue noise textures <https://momentsingraphics.de/BlueNoise.html> [V] | **CC0**, 16²–1024², 8/16 bits; «usar los de 64² y variar cada cuadro» (para 3D con TAA; no para dither de celdas) |
| Roberts, R2 <https://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/> [S] · Jimenez, IGN <https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/> [S] | Umbral 2D sin tabla: `fract(0.7548776662·x + 0.5698402910·y)` y `fract(52.9829189·fract(0.06711056·x + 0.00583715·y))` |

**Medición propia [M]** (umbral 22 %, 64 columnas × 12 filas, ceros y unos como `.`/`#`; generado con `engine/bluenoise.mjs` y `engine/util.mjs`):

```text
blue noise 22%                                                    bayer 22%
..#.#.#....#...........#..#...............#...#..#.....#....#...  #.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.
....#....#....#..##......#..#..#...#.#.#....#.......#..#..#....#  ................................................................
..#.......#..#.......##..#....#..#....#...#....#..#..#....#..#..  #.#...#.#.#...#.#.#...#.#.#...#.#.#...#.#.#...#.#.#...#.#.#...#.#.
#...#.##.......#...#.......#.......#.......#...#.#....#........#  ................................................................
r2 22%                                                            ign 22%
..#...#...#...#...#...#...#...#...#...#...#...#............#...#...#  #.#......#.#......#.#......#.#......#.#......#.#......#.#......#
#...#...#...#...#...#...#...#........#...#...#...#...#...#...#..  .....#.#......#.#......#.#....#.#......#.#......#.#......#.#......#.#....
```

Bayer: filas enteras vacías (rayas horizontales; con celdas 1:2 se ve como líneas de barrido). R2/IGN: retícula diagonal repetitiva. Ruido azul: reparto uniforme sin estructura. Generar el ruido azul de 64×64 tarda **42 ms en un PC** (≈ 200 ms en el A07 estimando ×5): se genera en compilación y se incrusta (4 096 bytes; 32×32 = 1 024 bytes si el patrón repetido no molesta).

### 1.3 Rendimiento de Canvas 2D frente a WebGL2 — medición propia [M]

Método: página de prueba (`bench2.html`, Anexo B.16) con una cuadrícula de 120×60 = 7 200 celdas; cada caso se ejecuta en **una página nueva** (evita que Chrome cambie el modo de raster), 15 cuadros de calentamiento + 90 medidos; se registra el **tiempo de hilo principal por cuadro completo** y el tiempo «de punta a punta» (6 repeticiones por `requestAnimationFrame`). Variantes: GPU real (D3D11) y raster por software (`--disable-gpu`); CPU sin freno y con `Emulation.setCPUThrottlingRate` ×4 (el 4× de Lighthouse móvil). Celda 8×16 css; DPR 1 y 2.

Milisegundos de hilo principal **por cuadro completo de 7 200 celdas** (µs por celda entre paréntesis), DPR 1:

| Caso | GPU, CPU ×1 | GPU, CPU ×4 | Software, ×1 | Software, ×4 |
|---|---|---|---|---|
| `fillRect` × N | 1,6 (0,2) | 6,5 (0,9) | 2,2 (0,3) | 9,1 (1,3) |
| `fillText` 1 carácter × N (color por celda) | 17,3 (2,4) | 68–100 (9,5–14) | 7,2 (1,0) | 45–53 (6–7) |
| **`fillText` una cadena por fila** (1 color, 60 llamadas) | **0,76 (0,1)** | **3,75 (0,5)** | 0,59 | 2,8 |
| `drawImage` atlas `ImageBitmap`, suavizado apagado | 12,4 (1,7) | 57–74 (8–10) | 13,3 (1,9) | 74–78 (10–11) |
| `drawImage` atlas `Canvas` | 15,3 (2,1) | 60–84 (8–12) | 14,3 (2,0) | 85 (12) |
| `drawImage` baldosas sueltas (una por celda) | 34,7 (4,8) | 66 (9,2) | 9,9 (1,4) | 53 (7,4) |
| `drawImage` con `globalCompositeOperation='copy'` | 31,5 (4,4) | 62 (8,6) | **341 (47)** | (colgó > 120 s) |
| DOM `<pre>` `textContent` (1 color; solo capa de layout) | 0,77 | 1,8 | 0,38 | 2,1 |
| DOM `<pre>` con `<i>` por corrida de color | 20,4 (2,8) | 41 (5,8) | 8,4 | 63 |
| **WebGL2, textura de celdas (1 draw)** | **0,05** (extremo a extremo 0,60) | **0,15** (0,51) | 0,03 (4,8) | 0,21 (6,3) |

DPR 2: mismos órdenes (`fillText` 26,5 ms; `drawImage` 14,2; WebGL2 0,03 ms; con CPU ×4 `fillText` 62–100 ms, WebGL2 0,14 ms). Lecturas:

- **El coste es por llamada** (`fillText` y `drawImage` cuestan lo mismo, ≈ 2 µs desde un PC; ×4–5 en un móvil). Un atlas solo ahorra si **reduce llamadas**; `drawImage` de sub-rectángulo por celda no las reduce.
- **Cadenas por fila**: 25× más baratas por celda que por carácter **si la fila tiene pocos colores**; con un color por celda se degrada a 1 llamada por celda. El respaldo por «pasadas de tono» de `06` cuesta T × 60 llamadas de ≈ 62 µs con CPU ×4: **≈ 30 ms con T = 8** (frente a 1,2–2,6 ms del diff por baldosas en las escenas reales).
- `globalCompositeOperation='copy'` **es una trampa** (2–25× peor y, en software, hasta colgar la pestaña).
- El `getImageData` síncrono en el bucle (mi primera versión de la prueba) llevó el `drawImage` de 13 a **640 ms** por cuadro: Chrome pasa el canvas a raster por CPU y relee el atlas de la GPU. Nunca leer píxeles del canvas de la escena.
- **WebGL2 con raster por software** (SwiftShader) cuesta **4,8 ms (1×) y 20 ms (DPR 2)** de punta a punta en un PC rápido: si `WEBGL_debug_renderer_info` dice `SwiftShader`/`llvmpipe`, usar el respaldo o nada.
- Un alfa `false` en el contexto 2D activa antialias LCD (`02`), y MDN desaconseja `alpha:false` en WebGL: mi `render-gl.mjs` usa el contexto por defecto.

**Escenas reales, por cuadro** [M] (`stats.mjs`, `stagerun.mjs`, `steady.mjs`; 24 fps de objetivo; celdas cambiadas = diff contra el cuadro subido anterior; CPU de `frame()` en Node, sin freno, **caliente**, incluye `clear`; el primer cuadro hornea las capas):

| Escena (120×40 = 4 800 celdas) | Acto (s) | Celdas cambiadas por cuadro @12 fps: acto prom/máx | En reposo prom/máx | CPU Node por cuadro: acto / reposo | Chrome WebGL2 (hilo principal, ×1 / ×4) | Chrome Canvas 2D respaldo (×4) |
|---|---|---|---|---|---|---|
| `web` | 6,6 | 90 / 517 | 0 / 1 (cursor) | 0,10 / 0,002 ms | 0,15 / 0,56 ms | 1,2 ms |
| `mkt` | 5,4 | 278 / 1 011 | 2 / 213 | 0,24 / 0,002 ms | 0,29–0,36 / 1,34 ms | 2,6 ms |
| `it` | 8,4 | 175 / 492 | 155 / 195 (latido) | 0,045 / 0,029 ms | 0,12–0,14 / 0,50 ms | 1,8 ms |
| `ai` | 6,0 | 212 / 466 | 61 / 122 | 0,105 / 0,020 ms | 0,16–0,19 / 0,77 ms | 2,0 ms |
| `sd` | 4,4 | 177 / 4 800 (1.er cuadro) | **0 / 0** (solo paleta) | 0,034 / 0,0006 ms | 0,66–0,83 / 3,0 ms (incluye el horneado) | 4,0 ms |

En reposo con CPU ×4: `sd` **0,17 ms/cuadro** (97 de 144 cuadros suben solo los 128 bytes de la paleta), `ai` 0,48 ms. Horneado de capas (una vez por tamaño): caliente 0,2–3,2 ms; **el primer uso de `sd` cuesta 60 ms en Node, de los cuales 42 ms son la generación del ruido azul** → incrustar la tabla.

### 1.4 Póster y HTML estático: tamaños [M]

`toHTML(grid)` (una `<pre aria-hidden>` con `<i class="tN bM">` por corrida) del cuadro final: **web 13,9 KB / 0,8 KB gz · mkt 18,6 / 1,5 · it 11,0 / 0,6 · ai 9,1 / 1,0 · sd 25,3 / 2,5** (120×40); móvil 56×44: 0,4–1,6 KB gz. Póster de imagen del mismo cuadro a 1920×1280 (DPR 2): **AVIF q50: 5 / 27 / 4 / 15 / 22 KB**; WebP q60: 14 / 40 / 13 / 30 / 33 KB; PNG de 64 colores: 20 / 41 / 13 / 36 / 37 KB; a 960×640 AVIF: 4 / 13 / 4 / 11 / 11 KB. `web.dev/articles/lcp` [V]: **el `<canvas>` no es candidato a LCP** (sí `<img>`, póster de `<video>`, `background-image` y bloques de texto).

### 1.5 Fuente y glifos: cobertura y tinta medidas [M]

**Cobertura de glifos** (lectura de la tabla `cmap` de los `.woff2` de `@fontsource-variable`, sin fontTools; mismo método que `02` Apéndice A):

| Archivo | Glifos | ASCII 20–7E | Caja 2500–257F | Bloques 2580–259F | Braille | Formas 25A0–25FF |
|---|---|---|---|---|---|---|
| `geist-mono-latin-wght-normal.woff2` (23 128 B) | 225 | 95/95 | 0 | 0 | 0 | 0 |
| `geist-mono-symbols2-wght-normal.woff2` (5 812 B) | 165 | 2 | **128/128** | **32/32** | 0 | 0 |
| `jetbrains-mono-latin` / `latin-ext` | 229 / 190 | 95 / 2 | 0 | 0 | 0 | 0 |
| `martian-mono-latin` | 224 | 95 | 0 | 0 | 0 | 0 |

Geist Mono (OFL-1.1, `package.json` del paquete) trae ASCII en `latin` y cajas/bloques en `symbols2`; **no tiene `■ ● ▲ ◆ ◐`, Braille ni sextantes**. Métricas: avance **0,600 em** exacto; ascendente 1,01 em, descendente 0,30 em (`Consolas`, el respaldo de `monospace` en Windows, avanza 0,5498 em; Courier New 0,6001).

**Tinta por glifo** (Geist Mono 500 rasterizado a 16×32 px): ASCII entre **0 % (espacio) y 37 % (`M`, `W`)**; `.` 3, `:` 6, `-` 5, `~` 9, `=` 13, `*` 15, `x` 19, `X` 25, `#` 28, `%` 30, `$`/`@` 36; bloques: `░` 25, `▒` 50, `▓` 75, `█` 100.

| Rampa | Cobertura (%) | Monótona | RMS de linealidad |
|---|---|---|---|
| Clásica `" .:-=+*#%@"` | 0,3,6,**5**,13,13,15,28,30,36 | **no** | **0,124** |
| ` .:=*xX#%@` (elegida, 10 pasos) | 0,3,6,13,15,19,25,28,30,36 | sí | **0,032** |
| ` .:~=*xX#%@` (11 pasos) | 0,3,6,9,13,15,19,25,28,30,36 | sí | 0,052 |
| Voraz por tinta, K = 10: ` ¯~"L[ZHBW` | 0,4,9,12,17,21,25,29,33,37 | sí | 0,007 (pero mezcla letras) |

### 1.6 Referencias de Santo Domingo (datos verificados y fuentes visuales)

| Monumento | Datos que sí se usan (fuente) | Fuente visual con licencia | Cómo se dibuja |
|---|---|---|---|
| **Faro a Colón** | Planta en cruz latina, hormigón armado; obra 1986–1992, inaugurado el 6-oct-1992; ≈ 200 m de largo × 36,5 m de alto (es.wikipedia) / 210 × 59 m (en.wikipedia); **157 haces de luz** que proyectan una cruz visible hasta ≈ 64 km; diseño ganador (455 propuestas, 1931) de J. L. Gleave, adaptado por T. Carbonell. <https://en.wikipedia.org/wiki/Columbus_Lighthouse> [V] · <https://es.wikipedia.org/wiki/Faro_a_Col%C3%B3n> [V] | `File:Santo_Domingo_-_Faro_a_Colon.JPG`, Martin Falbisoner, **CC BY-SA 4.0** <https://commons.wikimedia.org/wiki/File:Santo_Domingo_-_Faro_a_Colon.JPG> [V, **vista la imagen**] | Vista frontal: **trapecio escalonado** simétrico (≈ 1,6:1 ancho:alto), losa central vertical más alta, alas que bajan en 2 escalones con muro inclinado, **rendija oscura central** y escalinata; encima, la **cruz de luz** (vertical + brazo al 30 %, brazo ≈ 0,62 del vertical) |
| **Alcázar de Colón** | Construido 1511–1514 por Diego Colón; sillería de coral; gótico-mudéjar con arcadas renacentistas (galerías de arcos); de 55 estancias quedan 22; Plaza de España, sobre el Ozama. <https://en.wikipedia.org/wiki/Alc%C3%A1zar_de_Col%C3%B3n> [V] · <https://es.wikipedia.org/wiki/Alc%C3%A1zar_de_Col%C3%B3n> [V] (la fuente no da nº de arcos ni de plantas) | `File:Plaza_España_CCSD_RD_03_2017_2085.jpg`, Mariordo, **CC BY-SA 4.0** <https://commons.wikimedia.org/wiki/File:Plaza_Espa%C3%B1a_CCSD_RD_03_2017_2085.jpg> [V, ficha; imagen **no vista**] | Bloque con parapeto almenado y **dos plantas de arcos** `╭──╮` con interior tenue y ventanas encendidas al azar [C] |
| **Catedral Primada de América** | Obra iniciada 1512, consagrada 1541; **tres portadas** (dos góticas, la mayor gótico-plateresca); **campanario sobre la base de una torre inconclusa** (obra detenida en 1547); nave con cubierta a dos aguas y bóvedas laterales que asoman como cúpulas; sillería de coral dorada. <https://en.wikipedia.org/wiki/Catedral_Primada_de_Am%C3%A9rica> [V] · <https://es.wikipedia.org/wiki/Catedral_primada_de_Am%C3%A9rica> [V] | `File:Catedral_Primada_SD_01_2018_7934.jpg`, Mariordo, **CC BY-SA 4.0** (fachada oeste) <https://commons.wikimedia.org/wiki/File:Catedral_Primada_SD_01_2018_7934.jpg> [V, ficha; imagen **no vista**] | Frontón bajo a dos aguas, portal mayor con arco y luz, campanario truncado con vano, contrafuertes, cruz en el remate [C] |
| **Puente Juan Bosch** | Atirantado de hormigón; inaugurado el **19-dic-2001**; 647,10 m totales; vano principal 180 m; **torres de 63 m, cada una de dos fustes unidos por un travesaño («H»)**; tirantes cada 10 m; tablero de 33,5 m de ancho y hasta 35 m sobre el río; proyectado para superponerse visualmente al puente Duarte. <https://cfcsl.com/portfolio-items/puente-juan-bosch-sobre-el-rio-ozama-santo-domingo-republica-dominicana-2002/> [V] · <https://www.ecured.cu/Puente_Juan_Bosch> [V] | `File:Puente_Juan_Bosch_en_diciembre_2001.jpg`, Henryhidalgo, **CC BY-SA 4.0** <https://commons.wikimedia.org/wiki/File:Puente_Juan_Bosch_en_diciembre_2001.jpg> [V, ficha; imagen **no vista**] | Tablero recto + dos torres en «H» con abanico de tirantes (3 por lado) en la silueta media |
| **Obelisco (Macho)** | 40 m, diseñado en 1936 por Alfredo González Sánchez, construido por Rafael García Bonnelly, inaugurado el 11-ene-1937 (conmemora el cambio de nombre a «Ciudad Trujillo»); desde 1996 lleva murales de pintores dominicanos, con homenaje a las hermanas Mirabal. <https://elnacional.com.do/obeliscos-macho-y-hembra/> [V] | `File:Obelisco_Santo_Domingo.jpg`, «Mercedes.. Life as I Pictured», **CC BY 2.0** <https://commons.wikimedia.org/wiki/File:Obelisco_Santo_Domingo.jpg> [V, ficha; imagen **no vista**] | Fuste que se afina + pirámide + zócalo escalonado; **solo forma, sin texto ni murales** (contexto político: decisión del dueño, §8 #24) |
| **Obelisco Hembra** (opcional) | 20 m, inaugurado el 29-feb-1944 (Monumento a la Independencia Financiera), cortado por el centro en dos mitades iguales. Mismo artículo de El Nacional [V] | — | No usado |
| **Malecón** | Avenida George Washington frente al Caribe (donde están los obeliscos). | — | Muro con luz de borde + farolas + palmeras en primer plano; mar en degradado con brillo por ciclado |

**Trampa:** la ficha de es.wikipedia «Obelisco de Santo Domingo» es la **Guglia di San Domenico de Nápoles**, no el de la avenida George Washington [V]. **Política de descargas:** no se descargó ninguna imagen; la herramienta de lectura guardó por sí sola una miniatura del Faro al intentar describirla (CC BY-SA 4.0, Martin Falbisoner), que sí se miró.

### 1.7 Normas y plataforma

- **WCAG 2.2.2 Pausar, detener, ocultar** (A) [V] <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>: movimiento que empieza solo, dura > 5 s y va junto a otro contenido necesita mecanismo de pausa (o parar en 5 s). **2.3.1 Tres destellos** (A) [V] <https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html>: ≤ 3 destellos por segundo o por debajo del umbral (área de referencia 341×256 px a 1024×768). En las escenas: el parpadeo más rápido es el del rack averiado a 2 Hz durante 0,5 s en un área menor.
- **WebGL2**: en todos los navegadores mayores desde Safari 15 (2021) [V] <https://www.khronos.org/blog/webgl-2-achieves-pervasive-support-from-all-major-web-browsers>; `02` cifra 96,44 %. Límite de ≈ 16 contextos activos por pestaña en Chrome [S] <https://issues.chromium.org/issues/40939743>.
- **Samsung Galaxy A07**: Helio G99 (2×A76 2,2 GHz + 6×A55 2,0 GHz, 6 nm), pantalla 6,7″ HD+ 90 Hz [S] <https://www.gsmarena.com/samsung_galaxy_a07-14066.php>. cpu-monkey [S] <https://www.cpu-monkey.com/en/compare_cpu-mediatek_helio_g99-vs-qualcomm_snapdragon_8_gen_3>: el Snapdragon 8 Gen 3 (≈ 2 290 en Geekbench 6 monohilo) va un 217 % por delante del G99 → **G99 ≈ 720 puntos [derivado]**, frente a ≈ 3 000 de un PC actual [C]: un ×4 de CPU es un proxy razonable (Lighthouse usa 4×).
- **Unicode**: Block Elements U+2580–259F completo (medios bloques 2580/2584/258C/2590, octavos 2581–2588, sombras 2591–2593, cuadrantes 2596–259F) [V] <https://en.wikipedia.org/wiki/Block_Elements>; Box Drawing U+2500–257F (128) [V] <https://en.wikipedia.org/wiki/Box-drawing_characters>.


---

## 2. Reglas de oficio para Gaya Digital (aplican a cualquier escena)

### 2.1 Sistema de tonos: 16 pasos Cobalto + 16 animados

Los 16 tonos salen de interpolar en OKLCH los cuatro tokens `--glow-0..3` (T0 = `--glow-0` = fondo `--surface`, T5 = `--glow-1`, T10 ≈ `--glow-2`, T15 = `--glow-3`), con recorte de croma como el de `src/lib/color.mjs` (**mismos hex que el proyecto**: `oklchToHex('oklch(0.13 0.05 268)')` = `#02051b`, `--glow-1` = `#122caa`, `--glow-3` = `#d1f1ff` [M]). Generador: Anexo B.3.

| Tono | Hex | Contraste con T0 | Papel |
|---|---|---|---|
| 0 | `#02051b` | 1,00 | Fondo; silueta de primer plano |
| 1–3 | `#040c34` `#07134f` `#0b1b6c` | 1,06 · 1,17 · 1,33 | Siluetas de planos cercano/medio/lejano; paneles (bg) |
| 4–6 | `#0f238a` `#122caa` `#143fbf` | 1,56 · 1,89 · 2,40 | Cuerpo del resplandor; contornos tenues; texto de «esqueleto» |
| 7–9 | `#1753d4` `#1c66ea` `#2479fd` | 3,10 · 3,98 · 5,03 | Luz de borde, contorno principal, barras |
| 10–12 | `#4490fe` `#54a7fd` `#6bbdfe` | 6,41 · 8,00 · 9,94 | Elementos vivos (nodos, pulsos), titulares de esqueleto |
| 13–15 | `#8bd0fd` `#ace2fe` `#d1f1ff` | 12,05 · 14,48 · 17,05 | Luces, cabeza del trazo, chispas (**≤ 5 % del área**) |

Índices animados (la paleta de la textura tiene 32 entradas; el resto no se toca): **16–23** agua (mini-rampa T4→T10 con una cresta que recorre el ciclo, 0,16 ciclos/s), **24–29** estrellas (cada índice con su fase y velocidad: 0,14–0,48 Hz), **30** núcleo de la cruz de luz (0,18 Hz), **31** lámparas (0,10 Hz). Todos por debajo de 2 Hz (`06 #30`).

### 2.2 Cuatro familias de glifos, máximo dos por plano

1. **Línea**: `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ╭ ╮ ╰ ╯ ═ ║ ╔ ╗ ╚ ╝ ╱ ╲ ╳` y `/ \ | _ ¯ -`. Contornos, cables, marcos, arcos.
2. **Masa**: `█ ▀ ▄ ▌ ▐` y cuadrantes `▘ ▝ ▖ ▗ ▚ ▞ ▙ ▛ ▜ ▟`, octavos `▁ ▂ ▃ ▅ ▆ ▇`. Siluetas (resolución ×2), gráficas (resolución ×8 en vertical), paneles.
3. **Textura**: `░ ▒ ▓` y la rampa ` .:=*xX#%@`. Solo degradados y superficies.
4. **Detalle**: `+ * o @ · ' . :` (estrellas, nodos, personas, luces).

Prohibidos (caen a la fuente del sistema; `03 #11`): `→ ← ✓ ■ ● ◆ ▲ ▶ ★ ≈ ≠ ≤ ≥` y Braille. Flechas: `>`; nodos: `( )`, `o`, `@`.

### 2.3 Valores, planos y negativo/positivo

- **Planos con contraste decreciente hacia el fondo** (perspectiva atmosférica): en `sd`, ciudad baja y Faro T2, puente y catedral T1, obelisco y palmeras T0–T1, siempre contra un resplandor que sube de T0 (cénit) a T8,6 (horizonte). La silueta oscura sobre el resplandor da contraste 3,9–8:1 sin gastar tono.
- **Escenas nocturnas**: negativo (silueta) sobre positivo (luz). **Interfaces y esquemas** (`web`, `it`, `ai`, `mkt`): positivo (línea clara) sobre paneles oscuros con **volumen** (sombra proyectada offset (+3,+1) en tono 1, panel en tono 2, marcos en 8).
- **Luz de borde**: una fila de `▀` en tono 6–7 sobre el borde superior de las siluetas (muro del malecón, parapeto del Alcázar), o una columna `▌` (obelisco). Barato y da el «cuerpo».
- **Un foco por escena** (siempre lo más brillante y lo único en T15/paleta 30): cruz de luz (`sd`), pulso y latido (`it`), camino encendido (`ai`), última barra (`mkt`), bloque en obra con cabeza de trazo (`web`).
- **≥ 40 % de celdas vacías o de fondo plano**; el detalle se concentra en el foco.
- **Sin texto en las ilustraciones**: no hay etiquetas, cifras ni leyendas (regla del dueño y honestidad: la gráfica de `mkt` y el ECG de `it` no llevan ejes ni números).

### 2.4 Degradados: meseta + costura estrecha, con ruido azul

`skyBand` (Anexo B.10) decide **por celda**: en tonos oscuros (pasos pequeños entre tonos) usa **medios bloques `▄` con fg/bg de dos tonos** (resolución vertical ×2, sin dither; no hay ruido en los tonos < 3); en tonos claros (pasos grandes) usa **costuras dither** `░▒▓█` con `fg = tono k+1`, `bg = tono k`, cobertura `smooth(0,5−seam, 0,5+seam, f) + (bn(x,y)−0,5)·0,4`, con `seam ≈ 0,26–0,3` (mesetas planas y costuras de 1–3 celdas), y `warp` (ruido fbm de baja frecuencia, 0,2–0,9 tonos) para que las bandas no sean líneas de barrido. Con `seam` = 0,5 (degradado continuo) todo el cielo se vuelve granulado [M: se vio en las capturas].

### 2.5 Animación con carácter, a bajo fps

- **Acto en tres tiempos** (todas las escenas): *anticipación* (el cursor `▌` salta al bloque, la cabeza del contorno abre el trazo, el rack parpadea antes de caer), *acción* (curvas `easeOutExpo`, sin rebote ni elástico: `DESIGN.md`), *asentamiento* (destello de «publicado», flash de reparación de 0,35 s, la última barra chispea). Entre elementos, escalonar 0,15–0,35 s.
- **De a dos**: mover lo principal a **12 fps efectivos** (cada cuadro se mantiene 2 ticks de 24; en el prototipo basta cuantizar `t = Math.floor(t·12)/12` antes de `frame()`, o poner 12 en `fpsTiers[0]`; **no está activado**) y dejar a 24 fps solo lo que es continuo (paleta). Si el dispositivo baja de nivel (24→15→12→8 fps), el arte sigue leyéndose porque cada estado es una imagen completa.
- **Contornos progresivos**: se dibuja el perímetro celda a celda con **cabeza brillante y estela** (`outline()` en `web.mjs`); rellenos por **disolución** (`bn(x,y)·0,55 + barrido·0,45 < p`).
- **Movimiento dentro del trazo**: los pulsos **no dibujan glifos nuevos**: suben el tono de las celdas ya dibujadas del cable (`g.tone(x,y,15/13/11/9)`), así el cable «se enciende».
- **Estado estático (movimiento reducido, `?still`, cuadro de bandas)**: `t = settle` **sin bucles de reposo** (`cachedScene` hornea el estado final; `idle` solo añade cursor, latido o pulsos).
- **Destellos** (2.3.1): ninguna oscilación global > 2 Hz; el parpadeo de la avería es de 2 Hz durante 0,5 s en un área < 341×256 px.

---

## 3. Motor de rejilla de caracteres

### 3.1 `Grid`: la celda de 4 bytes

```text
ArrayBuffer(cols·rows·4)
  Uint8Array  b : [ glifo(0..144), tono fg(0..31), tono bg(0..31), banderas ] × N
  Uint32Array u : la misma memoria → comparar, copiar y llenar celdas con UNA operación
banderas: bit0 = «tocada» (la capa escribió esta celda), bit1 = «fondo explícito»
```

- `clear(bg)` = `u.fill(bg << 16)`; `copyFrom(o)` = `u.set(o.u)`; **`blit(src, dx, dy)`** copia filas por memoria con recorte (bandas de un campo único); **`overlay(src)`** copia solo las celdas tocadas y **hereda el fondo de abajo** si la capa no lo fijó (así una silueta de cuadrantes sobre un cielo en degradado no deja esquinas).
- `put(x, y, glifo|char, fg, bg = -1)`: `bg = -1` **no toca el fondo** (semántica de «transparente»). «Alfa» = tono: los 16 tonos crecen monótonos en luminosidad desde el fondo, así que `tono·alfa` ≈ mezcla contra el fondo (y el glifo se aclara a la vez con la rampa).
- **Un glifo por byte** (145 glifos < 256): la textura de celdas es `RGBA8UI` sin conversiones. Índice ASCII = código − 32.
- **Todo lo demás** (capas horneadas, sombras, paneles) es aritmética de bytes: sin objetos por celda, sin asignaciones por cuadro.

Primitivas (Anexo B.4; coordenadas de celda en flotante donde se indica; la celda es 1:2, `ASPECT = 2`):

| Método | Qué hace | Nota |
|---|---|---|
| `put`, `tone`, `bgTone`, `bgAt`, `fill`, `fillBg` | celdas | `tone()` cambia solo el color (se usa para los pulsos) |
| `text`, `textC` | cadenas (los espacios son transparentes) | |
| `box(x,y,w,h,'single'\|'round'\|'double'\|'ascii')` | marcos con caja | `round` = `╭╮╰╯` |
| `strokeCells(pts,{dotted,shallow,steep})` → `[x,y,glifo][]` · `stroke` · `line` · `arc` | rasteriza polilíneas | **glifo por dirección visual y por posición vertical dentro de la celda**: `¯ - _` en trazos suaves, `/ \` en diagonales, `|` en verticales; con `dotted`: `' . :`. Devuelve las celdas **en orden de recorrido** (sirve para animar pulsos) |
| `poly(pts, fg, {mode:'blocks'\|'ink', ramp, inner})` · `rectFill` · `ellipse` | relleno por **cobertura** | `blocks`: 2×2 muestras por celda → `QUAD[máscara]` (`▘▝▖▗▀▄▌▐█…`); `ink`: 3×3 muestras → glifo de la rampa; `inner(x,y)` da textura al interior |
| `sprite(x,y,art[], fg, {tones,dither})` | arte en cadenas + capa de tonos hex | para detalles dibujados a mano |
| `shade(v,x,y,ramp,thr)` | glifo de la rampa con dither entre pasos vecinos | `thr` por defecto Bayer; en producción `bn(x,y)` |
| `overlay`, `blit`, `copyFrom` | capas y bandas | |
| `toText`, `toHTML` | pruebas / HTML estático | `toHTML` = `<pre aria-hidden>` con corridas `<i class="tN bM">` |

**Algoritmo de `strokeCells`** (original): por cada segmento se muestrea cada 1/6 de celda; cada muestra suma su altura interna `fy` a la celda que cae; al final, `fy` medio decide `¯` (< 0,34), `-` (< 0,68) o `_` si la pendiente en celdas es ≤ 0,35 (visual ≤ ≈ 35°), `/` o `\` según el signo si está entre 0,35 y 1,7, `|` si ≥ 1,7. El orden de inserción del `Map` conserva el orden de recorrido.

**Algoritmo de `poly`** (original): para cada fila de celda y cada sub-fila (2 o 3), se cortan las aristas con el centro de la sub-fila (regla par-impar), se ordenan las intersecciones y se marcan las sub-columnas cuyo centro cae dentro de cada tramo; en `blocks` cada sub-muestra pone un bit (`TL=1, TR=2, BL=4, BR=8`) y el glifo es `QUAD[máscara]`, en `ink` el conteo elige la rampa. `put(..., bg = -1)` deja pasar el fondo.

### 3.2 Glifos: texto por fuente, bloques por código (`buildAtlas`)

- **Atlas de máscaras** (blanco sobre transparente) en un `OffscreenCanvas` de 16 columnas: **145 glifos → 256×320 px = 320 KB a DPR 2** (80 KB a DPR 1) [M]. `willReadFrequently` porque se lee una vez para medir la tinta.
- **ASCII y `· ¯`**: `fillText` con `size = cw / 0,6` (Geist Mono avanza 0,600 em: la celda encaja exacta) y línea base centrada con `fontBoundingBoxAscent/Descent` (1,01 / 0,30 em [M]). Con una fuente de respaldo de otro avance el glifo queda un poco más estrecho **pero no se desalinea**: cada glifo vive en su baldosa (a diferencia de una cadena por fila, que deriva).
- **Bloques, cuadrantes, octavos, sombras**: **rectángulos de píxeles enteros** (`░ ▒ ▓` con puntos de `round(dpr)` px en patrones 25/50/75 %). **Cajas**: líneas de `round(dpr)` px por el centro de la celda, se extienden hasta el borde (empalman con la celda vecina sin costura), esquinas redondas con `arc`, diagonales `╱╲╳` con trazo.
- Motivo (medido en `03 §1.4` con glifos de fuente en DOM): las filas de glifos antialiásados que terminan en fronteras fraccionarias dejan costuras de hasta 255/255; con celdas de **enteros de píxel de dispositivo** y rectángulos, **no hay costuras por construcción**. VS Code y xterm.js hacen lo mismo para caja, bloques, Braille y Powerline [V].
- **Celda**: 8×16 css en escritorio, **7×14 en < 520 px** (≥ 50 columnas en un móvil de 360–390 px); a DPR 2 → 16×32 y 14×28. **DPR máximo 2** (aunque el dispositivo diga 3): el lienzo se estira por CSS, la nitidez baja apenas y el coste no se triplica.
- Medido con 46 columnas (móvil): las cinco escenas mantienen la composición (diseños `compact` para `cols < 80/84`); a 40 columnas se recortan los extremos.

### 3.3 Rampas: medir, ordenar, verificar

```js
// cobertura de tinta de cada glifo (ya calculada por buildAtlas: atlas.cov[glifo] en 0..1)
// K objetivos equiespaciados en [0, máx]; para cada uno, el glifo sin repetir más cercano
function ramp(K, pool) { const max = Math.max(...pool.map(x => x.v)), used = new Set(), out = [];
  for (let k = 0; k < K; k++) { const t = k / (K - 1) * max; let best = null;
    for (const it of pool) if (!used.has(it.c) && (!best || Math.abs(it.v - t) < Math.abs(best.v - t))) best = it;
    used.add(best.c); out.push(best); } return out; }
// error de linealidad: RMS de (cobertura/máx − k/(K−1))  → 0 = pasos iguales
```

Resultado [M] en §1.5: clásica 0,124 (no monótona); **` .:=*xX#%@` 0,032** (curada, símbolos); voraz 0,007 (mezcla letras, no elegante). Regla: **recalcular en compilación** (`scripts/ascii-ramp.mjs`) cada vez que cambie fuente, peso (500) o tamaño de celda, y **fallar el build si la rampa no es monótona**. Comparar con la de 17 glifos de `02`.

### 3.4 Dither: ruido azul anclado a la celda

- `bn(x, y)`: tabla de 64×64 (rango 0..255) por **vacío y racimo** (`engine/bluenoise.mjs`, ~30 líneas, σ = 1,9, toroidal); **se genera en compilación** y se incrusta como cadena base64 de 4 KB (32×32: 1 KB).
- Se indexa por **posición de celda del Grid** (no por tiempo ni por píxel de pantalla): estable en el tiempo, sin «nadar» (Obra Dinn [V]). Con bandas desplazadas (`blit`) el dither se mueve con el contenido: es lo esperable en una ilustración; si se quisiera anclar al viewport, indexar por celda del maestro.
- Bayer 8×8 (`bayer(x,y)`) se conserva para **tramas retro deliberadas** y la disolución de `web` cuando se quiere ver el patrón; R2 e IGN, descartados (retícula diagonal).
- Regla del oficio: **nunca dither sobre bordes ni líneas**; solo en degradados anchos (cielo, mar, halo, disolución).

### 3.5 Capas, caché y reposo (`cachedScene`)

`frame(g, t)` es **puro en `t`** (mismo `t` → mismo cuadro; sin `Math.random`, semilla fija) y devuelve `1` (el Grid cambió → subir) o `0` (idéntico al anterior → no subir). Es el contrato `update(t)` + `render` fusionado en una sola función: no hay estado entre cuadros salvo cachés que solo aceleran. Patrón:

- **Horneado por tamaño** (`bakeLayers`): las capas caras y estáticas se calculan una vez (`sd`: cielo+estrellas `back`, monumentos+palmeras `fore` en un Grid transparente, mar `sea`); por cuadro: `g.copyFrom(back)` → lo dinámico (la cruz que crece) → `g.overlay(fore)` → `g.u.set(sea…)`. **Coste de `sd` por cuadro del acto: 2,0 ms (todo inmediato) → 0,034 ms** (Node, caliente) al cachear capas y usar el ruido azul incrustado; el primer cuadro hornea (3,2 ms caliente; 60 ms si además genera el ruido azul); en reposo 0,0006 ms.
- **Reposo**: pasado `settle`, `draw(baked, settle)` se hornea una vez y cada tick solo se copia memoria; `idle(g, t)` pinta lo poco que sigue vivo y devuelve una **firma numérica**; si la firma no cambió, `frame()` devuelve 0 y **ni se sube la textura**.
- **Paleta** (`scene.palette(t, base)`): el planificador la sube aparte (128 bytes) → **animación sin tocar celdas**.

### 3.6 Renderizadores (`render-gl.mjs`, `render-canvas.mjs`)

**WebGL2 (primario)** — un triángulo que cubre el lienzo; el fragmento hace:

```glsl
ivec2 pix = ivec2(int(gl_FragCoord.x), uSize.y - 1 - int(gl_FragCoord.y));
ivec2 cell = pix / uCell, loc = pix - cell * uCell;
uvec4 c = texelFetch(uCells, cell, 0);                       // glifo, fg, bg, banderas
float m = texelFetch(uAtlas, ivec2(c.r % 16, c.r / 16) * uCell + loc, 0).a;
o = vec4(mix(texelFetch(uPal, ivec2(c.b,0),0).rgb, texelFetch(uPal, ivec2(c.g,0),0).rgb, m), 1.);
```

Sin mipmaps, `NEAREST`, `antialias:false`, contexto por defecto (no `alpha:false`), `gl.disable(gl.DITHER)`, `texStorage2D` + `texSubImage2D` (`RGBA_INTEGER`/`UNSIGNED_BYTE`), `webglcontextlost` con `preventDefault`, `WEBGL_lose_context` al destruir. Subida por cuadro: `cols·rows·4` bytes (18,75 KB a 120×40). Máximo 255 glifos.

**Canvas 2D (respaldo)** — baldosas **opacas** (glifo × fg × bg, con el fondo horneado) creadas bajo demanda en un lienzo de 32 columnas de baldosas (`source-in` para teñir la máscara); por cuadro se recorre el `Uint32Array` (máscara `& 0x00ffffff`: las banderas no cuentan) y **solo se repintan las celdas que cambiaron**: `fillRect` si el glifo es espacio (10× más barato), si no `drawImage` de la baldosa (`imageSmoothingEnabled = false`, sin `globalCompositeOperation`). **130–250 baldosas distintas por escena** [M] = 0,26–0,50 MB a DPR 2. Sin ciclado de paleta (paleta de 32 entradas **congelada** en `settle`). **Regla**: si cambian > ≈ 900 celdas por cuadro (≈ 6 ms con la CPU ×4), bajar a 8 fps; el `mkt` en el acto llega a 1 011 celdas en su cuadro máximo.

**Paridad** (`cmp.mjs`, 1920×1280, DPR 2): diferencia media por canal **0,000 (web), 0,003 (mkt), 0,000 (it), 0,004 (ai), 0,234 (sd: la paleta animada se congela)** sobre 255; canales con |Δ| > 24: 0,000 % salvo `sd` 0,39 %. El respaldo produce la misma imagen.

### 3.7 Planificador (`mountStage`) y modos de reloj

- **Solo anima lo visible** (`IntersectionObserver` sin margen, umbral 1 %); **construye con margen del 60 %** (`warm`) y **libera el contexto a los 4 s de alejarse** (`WEBGL_lose_context`): con 5 escenas nunca hay más de 2 contextos vivos [M: `built/released` en la prueba] (Chrome pierde el más antiguo pasados ≈ 16 [S]).
- **`prefers-reduced-motion`** (también en vivo con `change`): `t = settle + 0,01`, **1 cuadro, sin bucle** (`data-stage="still"`); [M] con `reducedMotion:'reduce'`: 1–3 cuadros por escena en 3,5 s.
- **Bucle**: `requestAnimationFrame` con acumulador (sin deriva), tiers de fps que **solo bajan** (24→15→12→8; en `pointer:coarse` arranca en 15) cuando la EMA de nuestro coste supera 6 ms durante 20 cuadros; agotados → `data-stage="poster"` (canvas oculto).
- **Pausa** (`setPaused`), `visibilitychange`, redimensionado con *debounce* de 150 ms (reconstruye solo si cambian columnas/filas), `webglcontextrestored` → reconstruye, `fontsReady` (Promise): **comprobar con `document.fonts.load(...)` y `length > 0`** (`check()` devuelve `true` aunque la familia no exista, `02 §9 #1`).
- **Modo «scrub» (recomendado, `06 #17`)**: no hay bucle; un manejador de scroll (`passive`) calcula `u` = progreso de la sección y llama `stage.renderAt(scene.settle · easeOut(u))` (con `requestAnimationFrame`); como `frame()` es puro en `t`, avanzar y retroceder es gratis. La paleta avanza con `fase += dt·(0,1+0,85·energía)` y se duerme a los 1,6 s (bucle de `06 §4.2`).
- **Bandas de un campo único (`06`)**: cada escena escribe en su `Grid(cols, filasBanda)` y `master.blit(grid, 0, filaBanda − scrollCeldas)`; una sola subida y un solo `drawArrays`. Probado con `web` + `sd` desplazadas 22 celdas.

### 3.8 Presupuesto de CPU para las 5 escenas (una página, solo la visible anima)

Supuestos: una escena visible a la vez (el resto en sueño o sin construir), celda 8×16 (o 7×14), 12–24 fps, **CPU ×4 como proxy del A07** [M/C].

| Concepto | Con WebGL2 | Con Canvas 2D (respaldo) |
|---|---|---|
| Hilo principal por cuadro (acto), promedio de las 5, CPU ×4 | **0,5–1,3 ms** (`sd` 3,0 con el horneado de 1 vez) | **1,2–4,0 ms** |
| Hilo principal en reposo, CPU ×4 | `sd` **0,17 ms**, `ai` 0,48 ms | ≤ 1 ms (diff pequeño; sin paleta) |
| Ciclo de trabajo a 15 fps (móvil) | 0,75–2 % | 2–6 % |
| Techo por cuadro (regla) | **≤ 6 ms** (≈ 9 % a 15 fps) | igual + **≤ 900 celdas cambiadas** |
| Horneado de capas (una vez por tamaño y escena) | 0,2–3,2 ms en un PC → **≤ 16 ms** en el A07 (×5) si el ruido azul viene incrustado; 60 ms si se genera al vuelo | igual |
| Memoria | atlas 320 KB + celdas 19 KB + paleta | baldosas 0,26–0,50 MB |
| Peso de JS | núcleo 7,8 KB gz + ruido azul 4,4 KB (1,4 con 32×32); escenas 1,7–2,7 KB gz + `common` 1,1 KB (**cargar con `import()` al llegar**) | igual |
| GPU | 1 triángulo, 3 lecturas por píxel: irrelevante en Mali-G57; **con raster por software 5–20 ms** → detectar `SwiftShader`/`llvmpipe` y usar el respaldo | raster de Chrome |

**Validación pendiente y bloqueante**: medir en un A07 real (`chrome://inspect`) `window.stages[id].stats` (`cpuMs/frames`, `tier`) durante 10 s por escena, como pide `02 §8`; criterio: mediana ≤ 6 ms por cuadro, `tier` sin bajar, ningún cuadro > 50 ms tras el horneado.

---

## 4. Catálogo de generadores procedurales (Anexo B.9, `engine/gen.mjs`)

Costes: **Node 24, un hilo, caliente, escritorio** [M] (×4–5 en un A07). Todos escriben en un `Grid` y son deterministas.

| Generador | Idea | Coste medido | Dónde encaja en Gaya |
|---|---|---|---|
| `sdfRender(g,x0,y0,w,h,sdf,{rotY,rotX,light})` | Raymarching de una SDF por celda (`v` escalado por `h·ASPECT/w`), normal por 4 muestras (tetraedro), luz difusa + rim, glifo con `shade` y tono | **0,49 ms** a 44×22; **0,17 ms** a 28×14 | «Gema»/núcleo del hero o de la escena IA (opcional); 28×14 cabe en cualquier tier |
| `isoBox`, `isoCity` | Proyección 2:1 (`col = cx + (x−y)·2`, `fila = cy + (x+y)·0,5 − z`), caras por `poly` con 3 tonos, orden painter `x+y` creciente | **0,53 ms** (5×5 torres) | Alternativa de `web` (planos que se apilan) o «ciudad» de fondo |
| `textPoints`, `makeMorph`, `drawMorph` | Texto → puntos (fuente 5×5 propia, 2 columnas por «píxel» para que sea ≈ cuadrado); emparejar por orden en x + ruido; partículas con retardo y arco; glifo `. : * +` en tránsito y `█` al asentar | **0,013 ms** (170 partículas) | **Wordmark** `GAYA` ↔ nombre de servicio; sin «lluvia de katakana» (cliché) |
| `Particles` | Pool en arrays tipados, sin asignaciones; glifo y tono por vida restante | **0,005 ms** (300) | Chispas de «publicado»/«reparado», estallido del nodo de salida |
| `fireStep`/`fireDraw` | Autómata tipo DOOM: 0–36, fuente abajo, propagación con decaimiento `(rnd&1)·cool` y viento | **0,03–0,055 ms** (120×40) | «Llama fría» Cobalto opcional; no usada |
| `lifeStep` | Vida de Conway toroidal | **0,09 ms** (120×40) | Fondo lento de IA (opcional) |
| `flowField` | Curvas que siguen un ángulo por ruido de valor, con ocupación mínima entre curvas (Hobbs) | **0,31 ms** (120 curvas) | Viento/mar/textura de fondo **horneada** (cuesta una vez) |
| `plasma` | Suma de senos → tono + glifo con ruido azul | **0,30 ms** (120×40) | Evitar como protagonista (parece demo); útil en intros |
| Trazo progresivo (`outline`) | Perímetro celda a celda + cabeza brillante | incluido en `web` | Construcción de interfaces |
| Grafo con pulsos | `strokeCells` una vez; pulso = subir tono de las celdas del cable | `ai`/`it` 0,02–0,04 ms en reposo | Redes, flujos |
| Gráficas que crecen | Octavos `▁…█` (resolución ×8) + línea de tendencia punteada | `mkt` | Alcance sin cifras |
| Ciudad baja procedural | Bloques de 3–8 columnas × 1–3 alturas con hash entero + luces | ≈ 0,1 ms | Horizonte de `sd` |

*Figura — SDF/raymarching: toro 44x22 celdas (glifos; generado con `engine/gen.mjs`).*

```text
                    @%%##%%%%%#
                 @%#Xxx*xX%%%%#Xx
               @%Xx*=...:=%%%#XX*
              @#Xx=..    %%%##Xx==
             %%#x*.=   @@%##Xxx=.
            %@%%%%  @@%%##XXx*:.
            #%%%%%%%%##XXxx*=:.
             XX####XXxxx*=:..
              **xx***=::..:
                  =::=
```

*Figura — Morfado GAYA -> DIGITAL (p = 0, .35, .7, 1) (glifos; generado con `engine/gen.mjs`).*

```text
p=0


        ██████      ██████    ██      ██    ██████
      ██          ██      ██    ██  ██    ██      ██
      ██  ██████  ██████████      ██      ██████████
      ██      ██  ██      ██      ██      ██      ██
        ██████    ██      ██      ██      ██      ██


p=0.35


          *
       +.:* :      +*.* : +   :.   +  *+     :.+:+  *:*
      ++  **      :+. :. ..:*    *  +: *  :. ++ +:*+     :
    * **    :+.*  :+ .+*.. ..     .. :    *. *+ .+ .:*
     : .:     +:  *.:     ++               *    *  * * :
      * +.. * :   +       :*      +  +     :.  *  .*  +*
            :                                  +

p=0.7


     :        .                              *              +
  █+ *++*   *. **:..+   +   :  +  .:*+:*  :* . :█++*  .  █.    +
   *     .█     :*  * :+::  :   +  ++  +  :  :       *     :::
  :.      .+   **     ++  :: :█*     █       * * *+ █ +.█  +:* █
   +:+   : :  +: .  * +*      *.    :          :     █      :*.
  █+: * █ + █+  :█*.    .+.:::  :: : :.  +  +  █  * :       .██*.: + *.:
               +     *             .                         :

p=1


  ████████  ██████████  ██████  ████████████████████  ██████  ██
  ██      ██    ██    ██            ██        ██    ██      ████
  ██      ██    ██    ██  ██████    ██        ██    ████████████
  ██      ██    ██    ██      ██    ██        ██    ██      ████
  ████████  ██████████  ██████  ██████████    ██    ██      ████████████
```

*Figura — Campo de flujo 70x22 (glifos; generado con `engine/gen.mjs`).*

```text
                      \\\          |/              \\\         |
                        \|         \\                \\\       |   |
                         |          \-_                \\__ __/   /|
                         |            ¯\\\               \\¯¯    //
                         |           _--                  \\¯---¯
 -------¯¯¯¯¯--\         |          //                    |\\\
 ----__         |        |       _  |\                   // \\¯-
      ¯\\       ||       ||      ¯¯-\\         ¯¯-__ ---¯// \\\-__
        \\\      |        \         \|             ¯¯----¯    \| ¯¯\\
  ______  \\     |\        -__      |/       ____ -_          //    /
 ¯¯    ¯\\ \\     \\        ¯-____//        _---¯¯-_¯--__   --¯     /
          \\      ||                     ///¯      ¯¯-_ ¯¯-_\
    //     |      /||                   //        ¯-_\\\\   \|     |
   |/       |    //||                                \\ \|  | ___-/
   || /--\\ |   // /|\     |                          \\||/--¯¯
    |//   \     /  /|\\   //  \\     \\                ||//
    ||             || \¯-//    \\      \\_             ||/ _----__
    |\             |\\  _/      \--__    ¯¯--_______    |\/      ¯
     \\            \\¯¯¯¯   \\___---¯¯¯/_---¯¯¯¯¯¯¯¯¯¯¯--\\
      \\\                             //                  \\-__
```

*Figura — Fuego DOOM 50x14 (40 iteraciones) (glifos; generado con `engine/gen.mjs`).*

```text
   . ...: ..   x. .:: .: . .  :. .::  :. .:  .: :*
: .:.   :. :    :Xx*:::x  .: .  . .:.:. .x. * * .
*. x .xx..:*.  xX::x*:x:*x:.. *::::.: :.**X*.. .:.
  x:.:x ::x::.:.x:xX.:Xxx: .:. *x*.:***x***Xx*: .:
*x:*x*Xx:x*x:x:xxxX#:*x.XX* ***::X*x:::*xx*.*x*.:*
:::**xXX*x::.:::*X*X*x* x:x *****x:##xx*#**X.Xx:xX
:x****#*X*x*:*x**:X**#x:x*X*:*xxx*xX*:*#xxXxXxxXXX
xxXxXxx:*xXx#x%%X#xxxxxxX*xX*x*xXx*##*x%XX#X#xX#X#
##x#*XX*xX*#X%%#%X#XxXx%X**xX*xX#XxXxXXxX######%xX
X%#XX%###%X#x%X##x#x##@xX#XxX%XXX#%%X#%XXXX%@#Xx%x
%X%@####%@#XXXX%%@XX%X@X%%%%X%##X%%XXXXX@%#%%##X#X
%%@###%@@%%@%#@%%#@%#@@@%#%@@@%@#%@%%%%@@@##%%#%%%
@%%@%%@@%%@@@%%@%@@%%@@%@%%%@@%@@%@%@@@@@%%%%%%@@%
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
```

Notas de diseño de cada uno (por qué así):

- **SDF/raymarching**: `steps = 26`, `t > 6` corta; sin `Math.pow` dentro del lazo; el «alfa» sale de la **normal**, no de una textura. Girar el punto (rotación inversa) en lugar de girar el objeto evita recalcular la SDF. Rampa `RAMP` + `bn(x,y)`.
- **Morph**: el emparejamiento por orden de x evita que las partículas se crucen en un remolino; el `arc` (± 5 filas) da la curva «de pluma»; **no** interpolar glifos (parpadea): mover partículas y dejar que el glifo dependa de si están en tránsito o asentadas.
- **Flujo**: rejilla de ángulos ≈ 0,5 % del ancho, paso 0,9 celdas, `occ[]` evita que las curvas se solapen (regla de Hobbs de «separación mínima»); el ángulo usa `y·ASPECT` para que el campo se vea isótropo.
- **Fuego**: enfriamiento medio `cool/2` por fila → la llama muere a `36·2/cool` filas; `cool = 72/filas` para ocupar la altura.


---

## 5. Las cinco escenas

Todas: `make({cols, rows, seed}) → { frame(grid, t) → 0|1, settle, palette? }`; dos diseños (`cols ≥ 84` escritorio ≈ 120×40; `cols < 84` móvil ≈ 56×44, probado hasta 46 columnas); sin texto; `t = settle` es el cuadro estático (movimiento reducido). Código completo en el Anexo B.11–B.15. Capturas de referencia generadas con `preview.html` (Chrome, DPR 2); los cuadros en texto de abajo son los **glifos** del mismo cuadro (el color va en los tonos).

### 5.1 Web/apps — «Se construye» (`web.mjs`)

**Concepto**: una ventana de navegador y una pantalla de app que se levantan bloque a bloque. **Composición**: ventana 60 % del ancho (x centrado), teléfono 20–26 columnas a su derecha y 3 filas más abajo; en móvil solo el teléfono (36 columnas). **Guion** (escritorio, `settle = 6,6 s`; el teléfono entra 0,6 s después): 0–0,9 contorno de la ventana (**cabeza T15 + estela**), 0,3–1,3 sombra (bg 1) y panel (bg 2) por disolución, 0,7 barra de título (`o o o` T6–T8, barra `▁`), 1,1 logotipo `█` T11 + 3 enlaces `▄` T6, 1,5–2,45 titular de 2 líneas `█` T12 (el **cursor `▌` T15 salta** al final de cada barra), 2,05 bajada `▁` T6, 2,7 botón `╭╮` con relleno `▒`/`▄`, 1,9–3,0 imagen (cielo bg 3→7 por filas, sol `@` T15 con rayos, montañas por `poly`, marco T7), 3,0 + 0,32·k tres tarjetas; `settle−1,1…−0,2` **destello de «publicado»**: una línea de luz (T15,13,11,9) cruza toda la escena. **Materiales**: contornos T8 (redondos `╭╮╰╯`), paneles bg 2–3, sombra bg 1 offset (+3,+1), texto de esqueleto `█▄▁`. **Reposo**: cursor `▌` que parpadea a 0,8 Hz. **Coste**: acto 0,10 ms, reposo 0,002 ms; máx. 517 celdas por cuadro.

### 5.2 Marketing — «Alcance» (`mkt.mjs`)

**Concepto**: un megáfono emite anillos; cada persona alcanzada se enciende y se une a la red; abajo, barras que crecen y una línea de tendencia. **Guion** (`settle = 5,4 s`): megáfono 0–0,7 (cuñas por `poly`: cuerpo T8, bocina T11, mango T6, borde luminoso `▐` T14), **anillos** cada 0,42 s con radio `r = (t−0,5−0,42k)·34` celdas visuales (arcos de ±0,8 rad, `arc` con `ASPECT`; continuos hasta 20 celdas de radio, punteados después (el primero, hasta 40); tono T14→T4 con el radio), **personas** por dardos (36; móvil 20; distancia mínima 9/8 visual), alcanzadas en `tr = 0,55 + dist/34` (destello `O` T15 0,28 s → `o` T10; cada 9.ª es «hub» `(@)`), **red** que crece (cada persona se une a la más cercana ya alcanzada a ≤ 19 celdas visuales, si no a la fuente; trazo punteado T5, animado 0,45 s), **barras** (`n = ⌊ancho/4⌋`, 3 columnas + hueco; alturas `0,12+0,86·((i+1)/n)^1,5` con ±8 % de ruido; `t0 = 1,0+0,14·i`, 0,9 s con `easeOutExpo`; **octavos `▁…█`** para el remate, columna izquierda +1 tono y derecha −1: pseudo-3D), tendencia punteada T12 sobre los topes. **Resplandor de la fuente** con dos tonos y `bn(x,y)` (radio 34). **Estático**: `t = settle` añade **tres arcos fijos** (radios 18/36/54). **Sin cifras ni ejes.** **Coste**: acto 0,24 ms (máx. 1 011 celdas), reposo 0,002 ms + el destello de la última barra (1 Hz).

### 5.3 Soporte IT — «Latido y reparación» (`it.mjs`)

**Concepto**: hub y racks unidos por cables; por los cables viajan pulsos; **un rack cae, se repara y el latido vuelve más fuerte**. **Composición**: hub doble (`╔═╗`) arriba centrado, 3 racks (2 en móvil) de 17×13, enlaces ortogonales con esquinas de caja (`ortho()`), ECG a lo ancho abajo (7–8 filas). **Guion** (`settle = 8,4 s`): 0–0,6 hub, 0,4+0,2·i enlaces, 0,7+0,25·i racks, **1,4 pulsos** (15 celdas/s, cola de 4 tonos T15/13/11/9; ida y vuelta), **3,0 fallo** (el rack 2 parpadea 2 Hz durante 0,5 s), 3,5–7,0 **caído**: contorno T3, LED apagados, estática `░` que cambia cada 1/9 s, cable mudo, **ECG**: arritmia 3,4–4,3 y línea plana hasta 6,8; 5,4–7,0 **reparación**: un barrido `═` T15 baja por el rack y deja detrás el aspecto normal; 7,0 **flash** de 0,35 s (+5 tonos) y el ECG vuelve con la primera onda a 1,3× amplitud. **ECG**: `ecgValue(u)` = suma de 5 gaussianas (P, Q, R, S, T); traza fina con **cabeza brillante** a la derecha (tono 3→14 según la edad), relleno tenue debajo y tramos verticales entre columnas (octavos `▁…█`). **Sin cifras (bpm, uptime).** **Reposo**: ECG que se desplaza, LED, pulsos (0,029 ms). **Coste**: acto 0,045 ms; máx. 492 celdas.

*Figura — escena `it`, 120×40, t = 3.9 s, filas 0–23 (solo glifos; el color va en los tonos).*

```text
                                               ╔════════════════════════╗
                                               ║                      ▌ ║
                                               ║  ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄   ║
                                               ║                        ║
                                               ╚═══│════════ ════════│══╝
                                                   │        ·        │
                           ┌───────────────────────┘                 └─────────────────────┐
                           │                                ·                              │
                           │                               ·                               │
                   ┌───────┬───────┐               ┌───────┬───────┐               ┌───────┬───────┐
                   │               │               │               │               │               │
                   │ ▌ ▄▄▄▄▄▄▄▄::: │               │     ░ ░ ░ ::: │               │ ▌ ▄▄▄▄▄▄▄▄::: │
                   │ · ▁▁▁▁▁▁▁▁    │               │               │               │ · ▁▁▁▁▁▁▁▁    │
                   │ ▌ ▄▄▄▄▄▄▄▄::: │               │        ░  ::: │               │ ▌ ▄▄▄▄▄▄▄▄::: │
                   │ · ▁▁▁▁▁▁▁▁    │               │               │               │ · ▁▁▁▁▁▁▁▁    │
                   │ ▌ ▄▄▄▄▄▄▄▄::: │               │    ░      ::: │               │ ▌ ▄▄▄▄▄▄▄▄::: │
                   │ · ▁▁▁▁▁▁▁▁    │               │               │               │ · ▁▁▁▁▁▁▁▁    │
                   │ ▌ ▄▄▄▄▄▄▄▄::: │               │       ░   ::: │               │ ▌ ▄▄▄▄▄▄▄▄::: │
                   │ · ▁▁▁▁▁▁▁▁    │               │               │               │ · ▁▁▁▁▁▁▁▁    │
                   │ ▌ ▄▄▄▄▄▄▄▄::: │               │           ::: │               │ ▌ ▄▄▄▄▄▄▄▄::: │
                   │ · ▁▁▁▁▁▁▁▁    │               │               │               │ · ▁▁▁▁▁▁▁▁    │
```

### 5.4 Automatización e IA — «Aprende» (`ai.mjs`)

**Concepto**: red por capas cuyas conexiones empiezan desordenadas y con el entrenamiento **se apaga lo inútil y queda un camino limpio**; señales que encienden nodos; curva de error que baja; abajo, un flujo `[@] ──> (*) ──> [+]` con una ficha `o` que circula. **Composición**: red a la izquierda (60 %), curva de error a la derecha (26 %), flujo abajo; en móvil red arriba, curva en medio, flujo abajo. **Modelo**: capas `[3,5,5,2]` (`[3,4,4,2]`); aristas rasterizadas **una vez** con `strokeCells` (cada celda guarda dos glifos: continuo y punteado; un mapa celda→aristas); peso `w(t) = lerp(w0, wT, easeInOut(p)) + (1−p)·0,16·sin(…)` con `p` = progreso lineal entre 0,8 s y 5,4 s; **objetivo `wT`**: un camino (`[1,2,3,0]`) a 0,98, un segundo (`[2,0,4,1]`) a 0,55, el resto 0,1; **tono de celda = 1 + 10·w** (la arista dominante manda), glifo continuo si `w ≥ 0,4`, punteado si no. **Señales**: 14 pulsos (nacen en `1,3 + 0,62·k` en una entrada al azar determinista; en cada capa eligen arista con probabilidad ∝ `w^2,2`; 15 celdas/s; el nodo de llegada se activa `exp(−2,6·dt)`; el nodo pasa `.-.`/`( )`/`'-'` de T5 a T15 y su centro de `' '` a `.`/`o`/`@`). **Curva**: `0,06 + 0,9·e^(−4,4u) + 0,035·sin(46u)·e^(−2,4u)`, cabeza `*`. **Reposo**: nuevos pulsos siguen el circuito aprendido (rutas recalculadas con los pesos finales). Opcional: núcleo `sdfRender` de 28×14 (0,17 ms). **Coste**: acto 0,105 ms, reposo 0,02 ms; máx. 466 celdas.

*Figura — escena `ai`, 120×40, t = 99 s, filas 3–28 (solo glifos; el color va en los tonos).*

```text
                                                                                  │
                                                                                  │ \
                                                                                  │ \\
                        ...//.-.\................//.-....                         │  \
               .....'''''/// ( )\\\'..       ../// ( )\\''...                     │  \\
        .-....''       ////  '-' \\\\\'....''////  '-' \\   '''..                 │   \\\
        ( )\\''''... /////        \\\\\\'''/////         \\      ''...            │     \\
        '-' \\\\\\ ///'//.       ..\\'\\\\/////..         \\  ........//.-.       │      \\\
             \\\\///  // ''//.-.\\..\\.//\\\//...//.-.'''''''''   ../// (o)       │        ¯¯-\
              \\//\\\//.''// ( )\\\\'\\/\//\\\'/// ( ) \\   \\...'////  '-'       │           \\--_
             ///\...//\\//   '-'  \///\\/////\\\/  '-'  \\\..'' /////             │               ¯¯¯¯-------_____
            //.'''\//\ //\\\     /...'/\\//////\\\     ...\\\ //////              │
        .-.------------------.-.-__..//.\\/.//......-...    ///\//                └───────────────────────────────
        ( ) \\'..///// \//// ( ) \¯¯--_//\\...'''/ ( ) ''..//\\\/\\
        '-'  \\\/'//..///\   '-'  ////¯¯--__\///\  '-'  ///'../\\\\\
              /////////'...\    //...''///\¯¯--__\     //    ''..\\\\
             ///////  \\ .....-.'''.////.///\\..¯¯-.-./....//   ''..\\
            ////// ....'''   ( ) ''///////\\\\\''  ( )    '''''....''.\
           ///...''' \\\\\   '-'  //////...''\\\   '-'   //        '___-.-.
        .-./....       \\\\      ////..''''..\\\\      ///    ___--¯¯   (o)
        ( )    '''''.....\\\    ///.''       ''..\    //___--¯¯         '-'
        '-'             '''''.-...................\.-.-¯¯
                             ( )                   ( )
                             '-'                   '-'
```

### 5.5 Santo Domingo — «Horizonte» (`sd.mjs`, pieza de cierre)

**Concepto**: postal nocturna cobalto. **Silueta oscura contra un resplandor** que sube del cénit (T0,4) al horizonte (T8,6). **Composición** (`hy = 0,72·filas` = costa; móvil 0,68): de izquierda a derecha (oeste→este): palmera de primer plano y **Obelisco** (`cx = 0,10·cols`, 0,5·filas de alto, base 5 / cabeza 2,4 celdas, pirámide de 11 %, zócalo escalonado, luz de borde `▌` T7), **Catedral** (`x0 = 0,17·cols`, 0,30·cols × 0,30·filas; polígono `(u,v)`: alas `v = 0,4`, frontón bajo con ápice en `u = 0,43, v = 0,86`, campanario truncado en `u = 0,73–0,90` con remate a `v = 1,0`; portal mayor de 17 % de ancho y 42 % de alto con arco `╭╮` doble y luz interior en bg 3, rosetón `o`, contrafuertes `│` T5, cruz `+`), **Alcázar** (0,22·cols × 0,17·filas, parapeto almenado `▄` con línea de luz `▀` T7, **dos plantas de arcos** `╭──╮` de 4 de ancho cada 5, interior bg 2 y ventanas `▄` T13 al azar), **puente Juan Bosch** (torres en «H» a `0,655` y `0,90·cols`, tablero a `hy−4`, torres hasta `hy − 0,34·filas`, 3 tirantes por lado cada 6 celdas; **omitido en móvil**), **Faro a Colón** (`cx = 0,775·cols`, 24 columnas de ancho y 0,31× de alto en escritorio, 15 en móvil; polígono escalonado con losa central `u ∈ [0,284, 0,72]`, alas `v = 0,82/0,77`, rendija central en bg 1, paneles `▁`) y su **cruz de luz** (vertical de 0,66·`hy` filas: núcleo `█` (índice de paleta 30), flancos `▒` T10, halo en el fondo hasta ±7 celdas; brazo a un 30 % desde la punta, de longitud total `0,62·largo·ASPECT` celdas, en `▄`), **malecón** (muro `▀` T6 sobre T0, farolas `·` cada 11 columnas), **palmeras** (tronco por `poly` + 9 frondas por curva con grosor decreciente y normal calculada en espacio visual), **mar** (`skyBand` 6,6→0,3, ondas oscuras `- ~ _` T1 por ruido de valor, **destellos que ciclan** con la paleta 16–23, reflejos `:` de las luces principales). **Ciudad baja procedural** entre monumentos (bloques de 3–8 columnas × 1–3 alturas). **Guion** (`settle = 4,4 s`): 0–2,6 revelado de izquierda a derecha con disolución (`bn·0,35 + x/cols·0,65 < 1,05·p`), 1,0–3,6 la **cruz crece** (primero el vertical, al 50 % se abre el brazo), la paleta cicla siempre. **Estático**: `t = settle` (cruz completa; estrellas y agua congeladas en la fase de `settle`). **Coste**: acto 0,034 ms (caché de `back`/`fore`/`sea`); reposo **0 subidas de celdas** (solo 128 bytes de paleta: 0,17 ms por cuadro con CPU ×4); el primer horneado cuesta 3,2 ms caliente (60 ms si genera el ruido azul).

*Figura — escena `sd`, 120×40, t = 99 s, filas 8–32 (solo glifos; el color va en los tonos).*

```text
  ·              ·                                                                          ▒█▒
▗▄▙▄▄▄▄▟▄▖ ▗^                            .                           *           ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▗▄▙▄▄▄▄▟▄▖
██▝▗██▖▄▄▄▄▄▄▄▖                                                                             ▒█▒     ▗▄█████▝▗██▖▄▄▄▄▄▄▄▖
▀▀▝▝▀███████▄▖▙▄▄  .   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄                                 +              ▒█▒   ▄█▀▘█▛▀▀▀▝▝▀███████▄▖▙
   ▗█▘ +  ▝▀▜█▙▖█▙▖ ·                                                                       ▒█▒ ▗▛▘▀▘█▛▀▘    ▝█▖   ▝▀▜█▙
   ▐█     ▐▌█▌▀▜▙▖▜▙▖                                                                       ▒█▗▟▛▘▟▛▀         █▌       ▀
   █▛     ▐▌█▌  ▝▜▙ ▀▄            ·                                                +        ▒▄▀ ▟▛▘           ▜█
   █▌▄▄▄  ▐▌█▌    ▝▜▖▝▜▖▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄           +                 /▌  ▐\         ▗▛▘▗▛▘        /▌  ▐▐█▄▄▄▄▄▄▄▄
██▐█▌▓███▓▐▌█▌██████▝▙▓██▓████████▓█▓████████████+██████▓▓██▓█████▓██▓███▓///▌██▐\\\█▓▓██▓█.▒▟▘███▓█▓██///▌██▐▐█▌███████
  ▟█      ▐▌█▌                                  ▗▙░  ░░░ ░   ░   ░ ░    ////▐████▌\\\\      ▒█▒      ////▐████▌█▙\\  ░░░
▓▓██▓▒▓▓▒▓▟▌█▙▓▓▓▓▒▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▒+▓▒▓▒▓▓▒▓▓▓▓▗███▖▓▓▓▓█▓████▓███▓▓█▓/////█▐▌█▓▐▌▓\\\\\▓█▓▓▒█▒▓▓▓▓/////▓▐▌▓▓▐▌██\\\\▓▓▒
███████▓███▌████▓███▓█▓█████▓██▓▗▄███▄▖████▓█▓▐█████▖▓██████ ░      /////// ▐▌  ▐▌ \\\\\\\██▒█▒  ///////█▐▌▓█▐▌██\\\\\\█
 ▐█▌ ░ ░  █▌██               ▗▄████████▙▄ ░░ ░▐█████▌░▒░ ░ ▒▒░▒▒ ░/////░ /░░▐▌ ░▐▌░░\ ░\\\\\▒█▒///// ░/░░▐▌░░▐▌▐█▌░░\\\\
█▐█▌██▓████▌███████▓███████▄▟██████o██████▙▄██▐██▄██▌█▓███▄█▄█▄█▄/▄█▄/▄█▄█▄█▄▌▄█▄▌▄▓█\██\\█\\///█//█▓/███▐▌██▐▌▐█▌\█▓\\█
 ▐█▌      █▌██           ▐███████████████████ ▐█████▌░░░ ░▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ \\ █\\///\\//▌ //   ▐▌  ▐▌▐█▌\\ ░\\
███▌▓█▓█▓▓▌███▓█▓███▓██▓█│█████╭──────╮██████│███▀██▌█▓▓▓██╭──╮█╭──╮█╭──╮█╭──╮█╭──╮█▄▄\▄█///\█//\\▙▄/▄▖██▐▌██▐▌▐███\██▓▓
░██▌      ▌███      █████│█████│╭────╮│██████│██████████░ █│▄█│█│█▄│█│▄█│█│██│█│▄█│███\///▁▁\//▁▁\\//██  ▐▌  ▐▌▐██ \\░ ░
███▌█████▗▌███▖██████████│█████││████││██████│█████████████╰──╯█╰──╯█╰──╯█╰──╯█╰──╯████/█████/█████/█████▐▌██▐▌▐████\███
░██▌    ▗▄▌▄▄▄▄▖    █████│█████││█┼██││██████│█████████████╭──╮█╭──╮█╭──╮█╭──╮█╭──╮█████▁▁▁▁███▁▁▁▁██████▐▌██▐▌▐██░░░
███▌███▗████████▖█████▄█▄│█████││████││██████│███████▄█▄███│██│█│██│█│██│█│██│█│██│█████▁▁▁▁███▁▁▁▁█████▖▐▌██▐▌▐███▓▓███
▐██▌·█▗████████·▙████████│·████╰╰────·╯██████│██·██████████·──╯█╰──╯█╰·─╯█╰──╯█╰─·╯█████████·██████████·▙▐▌██▐▌▐██▌█████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
████████▓███▓█████  ██▓███▓███▓████▓██▓██▓███▓███▓████████▓█████████████▓███▓█████████▓███▓███▓████   ▓██▓███▓███▓██ ███
░              :      : :-----       ███ ----   :░  ░:░ ░░░:   ░░     : ---------:      ----:            --      ░: ░░░
```

**Advertencia de fidelidad**: esta escena es una **interpretación** (proporciones y detalles de la Catedral, el Alcázar y el puente se derivaron de las descripciones de §1.6, no de fotos). El Faro sí se contrastó con la foto de Falbisoner. **Antes de aprobar**: abrir las fichas de Commons de §1.6 y corregir siluetas (nº de arcos del Alcázar, frontón y campanario de la Catedral, forma del zócalo del Obelisco).

---

## 6. Integración en `gaya-web`

### 6.1 Archivos (compatibles con `06 §3.2`)

```
src/ascii/                       (los .mjs del Anexo B pasan a .ts con tipos; cero dependencias)
  util.ts  bn64.ts  tones.ts  grid.ts  atlas.ts  render-gl.ts  render-canvas.ts  stage.ts  gen.ts
  scenes/  common.ts  web.ts  mkt.ts  it.ts  ai.ts  sd.ts       ← cargar cada una con import() al llegar
scripts/ascii-bn.mjs             genera la tabla de ruido azul 64×64 (base64) → src/ascii/bn64.ts
scripts/ascii-ramp.mjs           mide la tinta de la fuente y falla si la rampa no es monótona
scripts/ascii-stills.mjs         Playwright: renderiza cada escena a t = settle (?still&scene=) para capturas/regresión
```

### 6.2 Marcado (decoración; el contenido real va en HTML semántico, `03`/`06`)

```html
<!-- con el campo fijo de 06: la banda es una sección vacía; el motor pinta sus filas -->
<section class="air" data-scene="sd" aria-hidden="true"></section>

<!-- modo autónomo (plan B / /referencias/): un anfitrión con proporción y fondo reservados -->
<div class="ascii-host" data-scene="sd" aria-hidden="true"></div>
```

```css
.ascii-host { aspect-ratio: 3 / 1; min-block-size: 16rem; background: var(--surface); contain: strict; } /* sin CLS; el canvas se inserta dentro */
@media (forced-colors: active), print { .ascii-host, .air { display: none } }
```

### 6.3 Movimiento (WCAG 2.2.2) y botón opcional

- **Recomendado (`06 #17`)**: sin movimiento autónomo tras el encendido: **modo «scrub»** (§3.7): el progreso de la sección mueve `t`; en reposo no hay bucle. Cumple 2.2.2 sin botón.
- **Alternativa con reloj propio** (prototipo `mountStage`): actos de 4,4–8,4 s + bucles en reposo → **exige** un botón de pausa (2.2.2). Botón **solo icono** (`<button aria-pressed aria-label="…">` con el par «pausa/reanudar» del sitio), estado en `localStorage` (con `try/catch`), y **`prefers-reduced-motion: reduce` = pausado**. Sin texto instructivo (regla del dueño).
- **Destellos** (2.3.1): ver §2.5.

### 6.4 Red y CSP

Cero peticiones nuevas: el atlas se construye en un `OffscreenCanvas` local; `font-src 'self'`; sin trabajadores; **`canvas.style` se asigna por CSSOM** (`Object.assign(canvas.style, …)`), que `style-src` sin `'unsafe-inline'` no bloquea (atributos `style` en el HTML sí); nada inline. La fuente: `document.fonts.load('500 16px "Geist Mono Variable"')` **y comprobar `length > 0`** antes de construir el atlas.

### 6.5 Pruebas

1. **Golden por escena y diseño**: `sha1(grid.toText() + grid.toTones())` de `frame(g, settle)` (mismo Node → mismo hash; las funciones `Math.sin/cos/exp` de V8 no cambian entre ejecuciones del mismo motor); avisa de cambios involuntarios.
2. **Paridad GL↔2D**: `cmp.mjs` (diferencia media < 0,01/255 excepto `sd` con paleta viva).
3. **Planificador**: `stagerun.mjs` (solo anima lo visible, pausa, `reducedMotion`, CPU ×4) y `steady.mjs` (reposo).
4. **Rampa monótona** y **cobertura de fuente** en compilación (`ascii-ramp.mjs`); **`npm run budgets`** con el peso real.
5. **A07 real** (§3.8): bloqueante antes de fijar `fpsTiers` definitivos.

---

## 7. Trampas (con evidencia)

1. **«El atlas con `drawImage` es más rápido que `fillText`»**: **falso en Canvas 2D** [M]: ≈ 2 µs por llamada en ambos (GPU), y con raster por software `drawImage` es 2× peor. Gana el diff, la cadena por fila o WebGL2. (ghostty-web midió 0,91–0,98× [V].)
2. **`globalCompositeOperation = 'copy'`** por celda: 2–25× más lento, y con raster por software colgó la pestaña [M].
3. **`getImageData` síncrono** en el bucle o para medir: Chrome pasa el canvas a CPU y relee el atlas de la GPU: 13 → 640 ms por cuadro [M]. Medir el `readPixels` de 1 píxel solo en pruebas.
4. **Clave de baldosa con el fondo** → crecimiento sin límite (xterm.js #6074 [V]); aquí los fondos son ≤ 8 tonos (130–250 baldosas por escena [M]). Mantener acotados fg y bg.
5. **Cadenas por fila derivan** si el avance de la fuente no es la celda: Geist Mono 0,600 em exacto, `Consolas` 0,5498 (8 % menos) [M]; **por eso baldosas por glifo**.
6. **Fuente sin cargar → atlas con la de respaldo en silencio**: `document.fonts.check()` da `true` aunque no exista (`02 §9 #1`); usar `load()` y `length > 0`.
7. **Cajas y bloques de fuente en el DOM dejan costuras** entre filas (hasta 255/255, `03 §1.4`): en el canvas, rectángulos de píxeles enteros; en DOM, la regla `line-height` de `03`.
8. **La rampa clásica no es monótona** en Geist Mono (`:` 6 > `-` 5; RMS 0,124) [M]; y **la tinta ASCII máxima es 37 %**: sin bloques o tono no hay masas ni brillo.
9. **Bayer en celdas 1:2 da rayas** y R2/IGN retículas [M]: ruido azul para degradados; dither **nunca** en bordes.
10. **Dither con tiempo** (ruido animado) o por píxel de pantalla al desplazar → «nada» (Obra Dinn [V]); indexar por celda del Grid.
11. **`alpha:false` en el 2D activa antialias LCD** (`02`); en WebGL, MDN lo desaconseja: contexto por defecto.
12. **`gl.DITHER` activo por defecto**: `gl.disable(gl.DITHER)` (`02 §9 #4`). Texturas `RGBA8UI` con `texStorage2D`; `usampler2D` y `precision highp`.
13. **Límite de ≈ 16 contextos WebGL por pestaña** [S]: construir con margen del 60 %, liberar a los 4 s (`WEBGL_lose_context`), o usar el campo fijo de `06`.
14. **WebGL2 con raster por software (SwiftShader/llvmpipe)** = 5–20 ms por cuadro de punta a punta [M]: detectar `WEBGL_debug_renderer_info` y caer al respaldo/nada.
15. **Arranque en frío**: generar el ruido azul (42 ms) o el horneado de `sd` (3 ms caliente) en el primer cuadro provoca tareas largas en el A07 (×5): **incrustar la tabla**, hornear en `requestIdleCallback` y mantener oculto el contenedor (o el fondo plano reservado) hasta el primer cuadro.
16. **`<canvas>` no cuenta para LCP** [V]: el LCP debe ser el `h1`/texto (o el `<pre>` de `06`); no diseñar el LCP en torno a estas escenas.
17. **DPR fraccionario**: el lienzo mide `cols·cw` píxeles enteros; el CSS `cols·cw/dpr` puede ser fraccionario; **no reescalar con CSS** salvo el tope DPR 2. Celda en píxeles enteros (8×16 → 16×32).
18. **Paleta ≥ 16 no existe en el respaldo 2D**: congelar una paleta de 32 entradas en `settle` (hecho en `mountStage`).
19. **Escenas que dependen de estado oculto** rompen el «scrub»: todo debe ser función de `t` (las cachés solo aceleran, no cambian el resultado).
20. **Contenido en el arte**: el ASCII decorativo lleva `aria-hidden`; nunca meter texto real ni cifras (regla del dueño); el arte de tono bajo **no** va como texto DOM (falla `color-contrast`, `03 #24`).
21. **No confundir «Obelisco de Santo Domingo»** (es.wikipedia, Nápoles) con el del Malecón [V].
22. **Política de descargas**: para ver referencias no se descargaron imágenes; la herramienta de lectura guardó una miniatura del Faro por su cuenta (CC BY-SA 4.0). No incluir fotos en el repositorio; solo enlaces.
23. **Presupuesto de peso**: motor 12,3 KB gz (con ruido azul de 64×64) ≈ el techo de 12 KB de `06`; escenas 12,1 KB gz > 6 KB: **partir por `import()`** y comprobar `npm run budgets`.
24. **Cuentas de fps en pantallas de 90/120 Hz** (el A07 es de 90 Hz): usar el acumulador con módulo (`06 §4.2`), no `setInterval`.

---

## 8. DECISIONES CERRADAS para Gaya Digital

**Lenguaje visual**
1. **«ASCII extendido»** = ASCII + `· ¯` + bloques/cuadrantes/octavos + caja/redondeadas; nada más (nada de `→ ✓ ■ ● ▲ ▶`, ni Braille).
2. **16 tonos Cobalto derivados de `--glow-0..3`** (hex de §2.1) + **16 índices animados** (16–23 agua, 24–29 estrellas, 30 cruz, 31 lámparas); paleta de la textura de 32 entradas. Acento (T13–T15) ≤ 5 % del área.
3. **Reglas de oficio**: glifo-primero, silueta por cobertura con luz de borde, un foco por escena, ≥ 40 % de vacío, dos familias de glifos por plano, sin dither en bordes, sin texto/cifras/ejes en las ilustraciones.
4. **Rampa `" .:=*xX#%@"`** (monótona, RMS 0,032) **regenerada y verificada en compilación**; jamás la clásica.
5. **Dither: ruido azul 64×64 precalculado (4 KB incrustado; 32×32 si no molesta el patrón)**, anclado a la celda; Bayer solo para trama retro deliberada; R2/IGN descartados. Degradados: **medios bloques en tonos oscuros + costura `░▒▓█` estrecha en tonos claros**, con `warp`.

**Motor**
6. **`Grid` de 4 bytes por celda** (`[glifo, fg, bg, banderas]`, vista `Uint32Array`), sin objetos por celda; **capas con transparencia (`overlay`), bandas (`blit`) y `cachedScene`** (horneado + firma de reposo).
7. **Glifos**: ASCII y `· ¯` con `fillText` (Geist Mono 500, `size = cw/0,6`); **bloques, cuadrantes, octavos, sombras y cajas por código** (rectángulos de píxeles enteros). No se exige `symbols2` para el canvas (sí para arte en DOM, `03`).
8. **Celda**: 8×16 css (escritorio), 7×14 (< 520 px), en píxeles de dispositivo enteros; **DPR ≤ 2**; atlas de 16 columnas.
9. **Render primario: WebGL2 de textura de celdas** (1 draw, `texelFetch`, `RGBA8UI`, paleta 32×1, contexto por defecto, `antialias:false`, `gl.disable(DITHER)`, `lose_context`). **Respaldo: Canvas 2D con baldosas opacas y diff por celda** (`fillRect` para espacios; nada de `copy`; tope ≈ 900 celdas por cuadro, si no 8 fps). **Póster/nada** si no hay ninguno o `SwiftShader`/`llvmpipe`.
10. **No usar** `drawImage` de atlas por celda ni pasadas de tono por fila como ruta principal en Canvas 2D (medido: ≈ `fillText`, T×60 llamadas de ≈ 62 µs con CPU ×4).
11. **Escenas = funciones puras de `t`** (`frame(grid,t) → 0|1`, capas horneadas por tamaño, `palette(t)` aparte), deterministas (semilla fija, sin `Math.random`).
12. **Ciclado de paleta** para agua, estrellas, cruz y lámparas: cero celdas por cuadro; fase = tiempo de sueño + energía (`06`).
13. **Planificador**: solo lo visible; construir al 60 % de margen; liberar contexto a los 4 s; ≤ 2 contextos vivos; `prefers-reduced-motion` → `t = settle`, un cuadro; comprobar la fuente con `load()` y `length > 0`; tiers que solo bajan.
14. **Sin dependencias**; JS: núcleo ≈ 8 KB gz (+4,4 KB del ruido azul), escenas 1,7–2,7 KB gz + `common` 1,1 KB, **cargadas con `import()`**; total ≈ 19 KB gz / 17 KB br.

**Integración y movimiento**
15. **Las 5 escenas se pintan en bandas del campo único fijo de `06`** (`Grid.blit`); `mountStage` queda como modo autónomo/plan B.
16. **Modo «scrub»** por defecto (`t = settle·easeOut(progreso)`); sin movimiento autónomo tras el encendido; reposo con sueño de 1,6 s. Si algún día se activa el reloj propio: **botón de pausa solo icono** y `reduced-motion` = pausado.
17. **Presupuesto**: ≤ 6 ms por cuadro con la CPU ×4 (≈ 9 % a 15 fps); horneado ≤ 16 ms en el A07; ninguna tarea > 50 ms; **validar en A07 real** (bloqueante).
18. **Fps**: 24 escritorio, 15 táctil (arranque), niveles 24/15/12/8; movimiento «de a dos» (12 fps efectivos) para lo principal.

**Escenas**
19. **`web` «Se construye»**: ventana + app, contornos con cabeza y estela, disolución, cursor guía, destello de «publicado». **`mkt` «Alcance»**: megáfono, anillos, personas y red, barras con octavos y tendencia, **sin cifras**. **`it` «Latido y reparación»**: hub, racks, pulsos que iluminan el cable, avería/reparación, ECG con octavos, **sin bpm ni uptime**. **`ai` «Aprende»**: red que converge a un camino limpio, señales, curva de error, flujo `[@]→(*)→[+]`. **`sd` «Horizonte»**: cierre.
20. **Duración de los actos** (si hay reloj): 4,4–8,4 s; recortar `it` a ≤ 5,5 s. Con «scrub» la duración es la altura de la sección.
21. **Estado estático de cada escena = `frame(g, settle)`** (sin `idle`), usado para movimiento reducido, `?still` y bandas quietas.
22. **Diseños**: `cols ≥ 84` (≈ 120×40) y `cols < 84` (≈ 56×44); válido hasta 46 columnas; `sd` móvil sin puente ni obelisco.
23. **Santo Domingo**: Obelisco, Catedral, Alcázar, puente Juan Bosch, Faro a Colón con cruz de luz, Malecón, palmeras, mar; **silueta oscura sobre resplandor**, ciudad baja procedural, generado con primitivas (no calcado de fotos); referencias de §1.6 (CC BY-SA/CC BY) solo como enlaces.
24. **Obelisco**: solo forma, sin murales ni texto (conmemora el cambio de nombre a «Ciudad Trujillo»; murales de las hermanas Mirabal desde 1996): **decisión del dueño** si lo incluye o lo sustituye por otro elemento.
25. **Antes de aprobar `sd`**: comparar con las fichas de Commons (solo el Faro se verificó visualmente).

**Calidad**
26. Pruebas: golden de `toText()+toTones()` por escena/diseño, paridad GL↔2D (< 0,01/255), `stagerun`/`steady`, rampa monótona, `npm run budgets`; medir en A07.
27. `dispose()` obligatorio; sin scripts inline ni trabajadores `blob:`; `canvas.style` por CSSOM; el arte es `aria-hidden`; `forced-colors` y `print` lo ocultan.
28. **Generadores del catálogo**: adoptar `Particles`, `textPoints/makeMorph/drawMorph` (wordmark), `flowField` (horneado) y `sdfRender` (28×14, opcional); dejar `fire`, `life`, `plasma`, `isoCity` como reserva.

---

## Anexo A · Cómo reproducir las mediciones

Todo se hizo en una carpeta temporal de la sesión (`scratchpad/illus/`, **no persiste**; lo útil está en el Anexo B) con la copia de Playwright y `esbuild`/`sharp` del propio `node_modules` del proyecto (solo lectura), sin tocar el proyecto:

| Medida | Guion | Notas |
|---|---|---|
| Tiempo de Canvas 2D / DOM / WebGL2 por método | `runbench2.mjs gpu3\|soft <freno> <dpr>` + `bench2.html` (**B.16**) | una página nueva por caso; `Emulation.setCPUThrottlingRate`; `--disable-gpu --disable-gpu-compositing` para el software |
| Escenas: celdas cambiadas por cuadro y CPU (frío/caliente) | `stats.mjs` (**B.20**), `warm.mjs` (**B.20b**) | Node 24; `stats` simula 12 fps y cuenta celdas cambiadas |
| Reposo con CPU ×4 | `steady.mjs` (**B.20c**) | 6 s de reposo de `sd` y `ai` con `Emulation.setCPUThrottlingRate` |
| Planificador en Chrome | `stagerun.mjs [throttle=4] [r=canvas] [reduced=1]` (**B.18b**) + `stage-test.html` (**B.18**) | 5 anfitriones de 640 px; solo anima lo visible, pausa, movimiento reducido |
| Paridad GL↔2D | `cmp.mjs` (**B.19c**) | capturas a DPR 2 y diferencia con `sharp` |
| Cobertura de fuente / tinta / rampas | `cmap.mjs` (**B.17**), `cov.mjs` (**B.20d**, usa `atlas.cov`) | mismo método que `02` Apéndice A/B |
| Peso de JS (min/gzip/brotli) | `sizes.mjs` (**B.20e**) | `esbuild` con `minify`; núcleo, cada escena y todo |
| Ruido azul y umbrales | `engine/bluenoise.mjs` (**B.2**) | 42 ms para 64×64 |
| Baldosas distintas, HTML estático, pósteres, horneado | **no incluidos** (10–20 líneas cada uno): contar `(glifo, fg, bg)` distintos en 12 fps durante `settle+10` s; `toHTML()` + gzip/brotli; `sharp(...).avif({quality:50})`; `make()` + dos `frame()` medidos | resultados en §1.3–1.4 |

Caveats: máquina compartida y cargada; una sola GPU (RTX 5070 Ti, D3D11/ANGLE); el «software» es SwiftShader; **el A07 no se midió**; las cifras «×4» son CPU frenada en Chrome, no un dispositivo.


---

## Anexo B · Código completo (probado)

Todo es original (MIT, sin código de terceros; las fuentes de §1 aportan **ideas y fórmulas**: Bayer, R2 y IGN son fórmulas publicadas, el vacío-y-racimo se reimplementó desde la descripción). `.mjs` sin dependencias; pasar a `.ts` con tipos al integrar. Los `import` relativos asumen las carpetas `engine/` y `scenes/`.

- **B.1** `engine/util.mjs` — Matemática, PRNG determinista, ruido de valor/fbm, umbrales de dither (Bayer 8×8, R2, IGN, ruido azul `bn`).
- **B.2** `engine/bluenoise.mjs` — Ruido azul por vacío y racimo (Ulichney). En producción: ejecutar en compilación e incrustar la tabla.
- **B.3** `engine/tones.mjs` — Rampa Cobalto de 16 tonos desde los tokens OKLCH (mismos hex que `src/lib/color.mjs`).
- **B.4** `engine/grid.mjs` — `Grid` de 4 bytes por celda, capas (`overlay`, `blit`), primitivas, `strokeCells`, `poly`, `shade`, `toText`, `toHTML`.
- **B.5** `engine/atlas.mjs` — Atlas de máscaras: ASCII con `fillText`; bloques, cuadrantes, octavos, sombras y cajas por código. Devuelve la tinta medida (`cov`).
- **B.6** `engine/render-gl.mjs` — Render WebGL2 de textura de celdas + atlas + paleta de 32 entradas (1 draw).
- **B.7** `engine/render-canvas.mjs` — Respaldo Canvas 2D: baldosas opacas bajo demanda + diff por celda.
- **B.8** `engine/stage.mjs` — Planificador: visibilidad, margen de construcción, liberación de contexto, movimiento reducido, tiers de fps, pausa, `fontsReady`, `renderAt(t)` para «scrub».
- **B.9** `engine/gen.mjs` — Generadores: SDF/raymarching, isométrico, morfado de texto, partículas, fuego, Vida, campo de flujo, plasma.
- **B.10** `scenes/common.mjs` — Paleta animada (índices 16–31), `skyBand` (degradado híbrido), estrellas, `cachedScene`.
- **B.11** `scenes/web.mjs` — Escena «Se construye».
- **B.12** `scenes/mkt.mjs` — Escena «Alcance».
- **B.13** `scenes/it.mjs` — Escena «Latido y reparación».
- **B.14** `scenes/ai.mjs` — Escena «Aprende».
- **B.15** `scenes/sd.mjs` — Escena «Horizonte» (Santo Domingo).
- **B.16** `bench2.html` — Banco de pruebas de Canvas 2D / DOM / WebGL2 (un caso por página; `?only=…&dpr=&cols=&rows=`).
- **B.16b** `runbench2.mjs` — Ejecutor (Playwright + CPU ×N, GPU o software).
- **B.17** `cmap.mjs` — Lectura de la tabla `cmap` de un `.woff2` (cobertura de glifos sin fontTools).
- **B.18** `stage-test.html` — Página de prueba del planificador (5 anfitriones).
- **B.18b** `stagerun.mjs` — Ejecutor: solo anima lo visible, pausa, `reducedMotion`, CPU ×N.
- **B.19** `preview.html` — Vista de una escena a un `t` (capturas y `cov`).
- **B.19b** `shot.mjs` — Captura con Playwright (`scene= t= cols= rows= dpr= sf= r=gl|canvas`).
- **B.19c** `cmp.mjs` — Paridad WebGL2↔Canvas 2D (diferencia media por canal con `sharp`).
- **B.20** `stats.mjs` — Celdas cambiadas por cuadro y CPU por escena (Node).
- **B.20b** `warm.mjs` — CPU por cuadro en caliente (acto y reposo).
- **B.20c** `steady.mjs` — Reposo de `sd` y `ai` con la CPU ×4 en Chrome.
- **B.20d** `cov.mjs` — Tinta por glifo y rampas (Playwright + `atlas.cov`).
- **B.20e** `sizes.mjs` — Peso mínimo/gzip/brotli del núcleo y de cada escena.

### B.1 · `engine/util.mjs`

```js
// util.mjs — utilidades matemáticas y de ruido. Código original (MIT).
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const fract = (x) => x - Math.floor(x);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// PRNG determinista (mulberry32). Misma semilla => mismo cuadro en servidor (SSR) y en cliente.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// hash entero 2D -> [0,1)
export function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ruido de valor 2D suave (barato) y fbm de 3 octavas
export function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export const fbm = (x, y, s = 0) => 0.5 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.03, y * 2.03, s + 7) + 0.2 * vnoise(x * 4.11, y * 4.11, s + 13);

import { blueNoise } from './bluenoise.mjs';
// ---------- umbrales de dithering (ordenado): estables en el tiempo, se indexan por celda ----------
// Bayer 8x8 por recursión: M(2n) = [[4M,4M+2],[4M+3,4M+1]]
export const BAYER8 = (() => {
  let m = [[0]];
  for (let n = 1; n < 8; n *= 2) {
    const s = m.length, out = Array.from({ length: s * 2 }, () => new Array(s * 2));
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = 4 * m[y][x];
      out[y][x] = v; out[y][x + s] = v + 2; out[y + s][x] = v + 3; out[y + s][x + s] = v + 1;
    }
    m = out;
  }
  const f = new Float32Array(64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) f[y * 8 + x] = (m[y][x] + 0.5) / 64;
  return f;
})();
export const bayer = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];
// R2 (Roberts 2018): umbral 2D de baja discrepancia, sin tabla
export const r2 = (x, y) => fract(0.7548776662466927 * x + 0.5698402909980532 * y + 0.5);
// Interleaved Gradient Noise (Jimenez 2014)
export const ign = (x, y) => fract(52.9829189 * fract(0.06711056 * x + 0.00583715 * y));

// Ruido azul 64x64 (vacío y racimo). En producción la tabla se genera en compilación y se incrusta (4 KB); aquí se calcula perezosamente (~40 ms en un PC).
let _bn = null;
export const bn = (x, y) => (_bn || (_bn = blueNoise(64)))[((y & 63) << 6) | (x & 63)] / 256 + 1 / 512;
```

### B.2 · `engine/bluenoise.mjs`

```js
// bluenoise.mjs — ruido azul por «vacío y racimo» (Ulichney 1993). Código original; se ejecuta UNA vez en compilación y se guarda la tabla.
// Devuelve un Uint8Array N*N con rangos 0..N*N-1; umbral = (rango + 0.5) / (N*N). Toroidal: teselable.
const rng = (s) => { let a = s >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export function blueNoise(N = 64, sigma = 1.9, seed = 1) {
  const n = N * N, R = Math.ceil(sigma * 4);
  const K = []; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) K.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))]);
  const E = new Float64Array(n), on = new Uint8Array(n);
  const splat = (i, s) => { const x = i % N, y = (i / N) | 0; for (const [dx, dy, w] of K) E[((y + dy + N) % N) * N + ((x + dx + N) % N)] += s * w; };
  const argmax = (want) => { let b = -1, bv = -Infinity; for (let i = 0; i < n; i++) if (on[i] === want && E[i] > bv) { bv = E[i]; b = i; } return b; };
  const argmin = (want) => { let b = -1, bv = Infinity; for (let i = 0; i < n; i++) if (on[i] === want && E[i] < bv) { bv = E[i]; b = i; } return b; };
  const r = rng(seed);
  // patrón inicial ~10 % de unos, relajado hasta que racimo más apretado == vacío más grande
  for (let k = 0; k < Math.floor(n * 0.1); k++) { let i; do { i = Math.floor(r() * n); } while (on[i]); on[i] = 1; splat(i, 1); }
  for (let it = 0; it < n; it++) { const c = argmax(1); on[c] = 0; splat(c, -1); const v = argmin(0); on[v] = 1; splat(v, 1); if (v === c) break; }
  const rank = new Uint16Array(n), proto = on.slice(), E0 = E.slice();
  let ones = proto.reduce((s, x) => s + x, 0);
  // fase 1: quitar racimos -> rangos ones-1..0
  for (let k = ones; k > 0; k--) { const c = argmax(1); on[c] = 0; splat(c, -1); rank[c] = k - 1; }
  // fase 2: desde el prototipo, rellenar vacíos hasta la mitad
  on.set(proto); E.set(E0); let cnt = ones;
  while (cnt < n / 2) { const v = argmin(0); rank[v] = cnt; on[v] = 1; splat(v, 1); cnt++; }
  // fase 3: el resto, buscando el racimo más apretado de CEROS (= máximo de energía entre los ceros)
  while (cnt < n) { const c = argmax(0); rank[c] = cnt; on[c] = 1; splat(c, 1); cnt++; }
  return Uint8Array.from(rank, (v) => Math.min(255, Math.floor((v * 256) / n)));
}
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('bluenoise.mjs')) {
  const t = performance.now(); const b = blueNoise(64); console.log('64x64 en', (performance.now() - t).toFixed(0), 'ms'); 
  const hist = new Array(8).fill(0); for (const v of b) hist[v >> 5]++; console.log('histograma (debe ser plano):', hist.join(' '));
}
```

### B.3 · `engine/tones.mjs`

```js
// tones.mjs — rampa de tonos «Cobalto» (16 pasos) derivada de los tokens --glow-0..3 (OKLCH). Código original.
const lin2srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export function oklch2rgb(L, C, hDeg) {
  // OKLCH -> OKLab -> sRGB lineal (matrices de Björn Ottosson, dominio público) con recorte de croma
  const h = (hDeg * Math.PI) / 180;
  const conv = (c) => {
    const a = c * Math.cos(h), b = c * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
  };
  let c = C, rgb = conv(c);
  const inGamut = (v) => v.every((x) => x >= -0.0005 && x <= 1.0005);
  while (!inGamut(rgb) && c > 0) { c -= 0.004; rgb = conv(Math.max(c, 0)); }
  return rgb.map((x) => Math.round(255 * lin2srgb(Math.min(1, Math.max(0, x)))));
}
// paradas: bg, cuerpo, luz, chispa  (tokens.css)
const STOPS = [
  { t: 0, L: 0.13, C: 0.05, h: 268 },
  { t: 5, L: 0.38, C: 0.2, h: 266 },
  { t: 10, L: 0.66, C: 0.22, h: 258 },
  { t: 15, L: 0.94, C: 0.05, h: 225 },
];
export function buildTones(n = 16) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let a = STOPS[0], b = STOPS[1];
    for (let k = 0; k < STOPS.length - 1; k++) if (i >= STOPS[k].t) { a = STOPS[k]; b = STOPS[k + 1]; }
    const u = (i - a.t) / (b.t - a.t);
    // interpolación en OKLCH (matiz por el camino corto)
    let dh = b.h - a.h;
    out.push(oklch2rgb(a.L + (b.L - a.L) * u, a.C + (b.C - a.C) * u, a.h + dh * u));
  }
  return out;
}
export const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
export const relLum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const contrast = (a, b) => { const x = relLum(a) + 0.05, y = relLum(b) + 0.05; return x > y ? x / y : y / x; };
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('tones.mjs')) {
  const t = buildTones(16);
  t.forEach((c, i) => console.log(String(i).padStart(2), hex(c), 'contraste vs T0 =', contrast(c, t[0]).toFixed(2)));
}
```

### B.4 · `engine/grid.mjs`

```js
// grid.mjs — rejilla de caracteres + primitivas. Código original (MIT). Sin DOM: corre en Node (SSR/pruebas) y en el navegador.
import { clamp, bayer } from './util.mjs';

// Juego de glifos «ASCII extendido» (estilo CP437): ASCII imprimible + bloques y trazos de caja.
// Índice ASCII = código - 32 (rápido). Debe caber en 8 bits (< 256).
export const CHARSET =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  '·¯' +
  '▀▄▌▐█░▒▓▁▂▃▅▆▇▖▗▘▝▚▞▙▛▜▟' +
  '─│┌┐└┘├┤┬┴┼╭╮╰╯═║╔╗╚╝╱╲╳';
export const GLYPHS = CHARSET.length;
const LUT = new Uint8Array(0x2600);
for (let i = 0; i < CHARSET.length; i++) LUT[CHARSET.charCodeAt(i)] = i;
export const gi = (c) => LUT[c.charCodeAt(0)] || (c === ' ' ? 0 : LUT[63]); // desconocido -> '?'
export const ch = (i) => CHARSET[i];

// Cuadrantes 2x2 (bits: TL=1, TR=2, BL=4, BR=8)
export const QUAD = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'].map(gi);
export const EIGHTHS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'].map(gi); // alto en octavos (0..8)

// Rampas de densidad (de menor a mayor tinta). Se generan midiendo la fuente real (informe §3.3): la clásica no es monótona.
export const RAMP = ' .:=*xX#%@'.split('').map(gi);       // 10 pasos, ASCII puro, monótona y casi lineal en Geist Mono 500 (RMS 0,032; la clásica " .:-=+*#%@" da 0,124)
export const RAMP_FINE = ' .·:;-=+*xX#%@'.split('').map(gi);

export const ASPECT = 2; // alto/ancho de la celda (8x16 css)

export class Grid {
  constructor(cols, rows) { this.resize(cols, rows); }
  resize(cols, rows) {
    this.cols = cols; this.rows = rows; this.n = cols * rows;
    const buf = new ArrayBuffer(this.n * 4);
    this.b = new Uint8Array(buf);   // [glifo, tono fg, tono bg, banderas] por celda
    this.u = new Uint32Array(buf);  // misma memoria: comparar/copiar/llenar celdas de una vez
    this.cov = new Uint8Array(this.n); this.msk = new Uint8Array(this.n); // auxiliares de relleno
  }
  clear(bg = 0) { this.u.fill(bg << 16); }
  copyFrom(o) { this.u.set(o.u); }
  // copia 'src' dentro de este Grid desde (dx, dy), recortando: copia de filas por memoria. Sirve para «bandas» de un campo único (campo fijo + escenas por scroll)
  blit(src, dx = 0, dy = 0) {
    const x0 = Math.max(0, dx), x1 = Math.min(this.cols, dx + src.cols);
    if (x1 <= x0) return;
    for (let y = 0; y < src.rows; y++) {
      const ty = y + dy; if (ty < 0 || ty >= this.rows) continue;
      this.u.set(src.u.subarray(y * src.cols + (x0 - dx), y * src.cols + (x1 - dx)), ty * this.cols + x0);
    }
  }
  // capas con transparencia: copia solo las celdas que la capa 'src' tocó; si su fondo no era explícito, hereda el de abajo
  overlay(src) {
    const s = src.b, d = this.b;
    for (let i = 0; i < s.length; i += 4) {
      const f = s[i + 3];
      if (!(f & 1)) continue;
      d[i] = s[i]; d[i + 1] = s[i + 1]; if (f & 2) d[i + 2] = s[i + 2]; d[i + 3] |= f;
    }
  }

  // --- celdas ---
  put(x, y, c, fg = 9, bg = -1) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    const i = (y * this.cols + x) << 2, b = this.b;
    b[i] = typeof c === 'number' ? c : gi(c); b[i + 1] = fg;
    if (bg >= 0) { b[i + 2] = bg; b[i + 3] |= 3; } else b[i + 3] |= 1; // banderas: bit0 = celda tocada, bit1 = fondo explícito
  }
  get(x, y) { const i = (y * this.cols + x) << 2; return { c: this.b[i], fg: this.b[i + 1], bg: this.b[i + 2] }; }
  bgAt(x, y) { if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0; return this.b[((y * this.cols + x) << 2) + 2]; }
  tone(x, y, fg) { if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return; this.b[((y * this.cols + x) << 2) + 1] = fg; }
  bgTone(x, y, bg) { if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return; const i = (y * this.cols + x) << 2; this.b[i + 2] = bg; this.b[i + 3] |= 3; }
  fill(x, y, w, h, c = ' ', fg = 9, bg = -1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c, fg, bg); }
  fillBg(x, y, w, h, bg) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.bgTone(x + i, y + j, bg); }

  // --- texto ---
  text(x, y, s, fg = 9, bg = -1) { for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.put(x + i, y, s[i], fg, bg); }
  textC(cx, y, s, fg = 9, bg = -1) { this.text(Math.round(cx - s.length / 2), y, s, fg, bg); }

  // --- cajas ---
  box(x, y, w, h, style = 'single', fg = 9, bg = -1) {
    const S = { single: '┌┐└┘─│', round: '╭╮╰╯─│', double: '╔╗╚╝═║', ascii: '++++-|' }[style];
    const [tl, tr, bl, br, hh, vv] = S;
    for (let i = 1; i < w - 1; i++) { this.put(x + i, y, hh, fg, bg); this.put(x + i, y + h - 1, hh, fg, bg); }
    for (let j = 1; j < h - 1; j++) { this.put(x, y + j, vv, fg, bg); this.put(x + w - 1, y + j, vv, fg, bg); }
    this.put(x, y, tl, fg, bg); this.put(x + w - 1, y, tr, fg, bg); this.put(x, y + h - 1, bl, fg, bg); this.put(x + w - 1, y + h - 1, br, fg, bg);
  }

  // --- trazos: rasteriza polilíneas en coordenadas de celda (flotantes). Devuelve las celdas cubiertas en orden de recorrido [x, y, glifo]
  // (sirve para dibujar Y para animar pulsos que viajan por el trazo). El glifo sale de la dirección visual (la celda es 1:2) y de la
  // posición vertical media del trazo dentro de la celda: ¯ arriba, - en medio, _ abajo; / \ en diagonales; | en verticales.
  strokeCells(pts, o = {}) {
    const { dotted = false, shallow = 0.35, steep = 1.7 } = o;
    const seen = new Map();
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      const dx = bx - ax, dy = by - ay;
      const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) * 6));
      const slope = Math.abs(dx) < 1e-6 ? 1e9 : Math.abs(dy / dx);
      const sign = (dx >= 0) === (dy >= 0) ? 1 : -1; // + => baja hacia la derecha => barra invertida
      for (let k = 0; k <= n; k++) {
        const x = ax + (dx * k) / n, y = ay + (dy * k) / n;
        const cx = Math.floor(x), cy = Math.floor(y), key = cy * 4096 + cx;
        const e = seen.get(key);
        if (e) { e.sy += y - cy; e.n++; } else seen.set(key, { cx, cy, sy: y - cy, n: 1, slope, sign });
      }
    }
    const out = [];
    for (const e of seen.values()) {
      const fy = e.sy / e.n;
      let c;
      if (e.slope <= shallow) c = dotted ? (fy < 0.5 ? "'" : '.') : fy < 0.34 ? '¯' : fy < 0.68 ? '-' : '_';
      else if (e.slope >= steep) c = dotted ? ':' : '|';
      else c = e.sign > 0 ? '\\' : '/';
      out.push([e.cx, e.cy, c]);
    }
    return out;
  }
  stroke(pts, fg = 9, o = {}) { const bg = o.bg ?? -1; for (const [x, y, c] of this.strokeCells(pts, o)) this.put(x, y, c, fg, bg); }
  line(x0, y0, x1, y1, fg, o) { this.stroke([[x0, y0], [x1, y1]], fg, o); }
  arc(cx, cy, r, a0, a1, fg, o) { // r en columnas; el eje y se estira por ASPECT para verse circular
    const pts = [], n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r * 1.5));
    for (let k = 0; k <= n; k++) { const a = a0 + ((a1 - a0) * k) / n; pts.push([cx + Math.cos(a) * r, cy + (Math.sin(a) * r) / ASPECT]); }
    this.stroke(pts, fg, o);
  }

  // --- relleno de polígonos con cobertura por celda ---
  // mode 'blocks': cuadrantes ▘▝▖▗▀▄▌▐█ (resolución x2); mode 'ink': rampa de densidad; interior opcional con textura.
  poly(pts, fg = 6, o = {}) {
    const { mode = 'blocks', ramp = RAMP, inner = null } = o;
    const SW = mode === 'blocks' ? 2 : 3, SH = mode === 'blocks' ? 2 : 3;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(this.cols - 1, Math.ceil(maxX)), y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(this.rows - 1, Math.ceil(maxY));
    const { cov, msk, cols } = this;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { cov[y * cols + x] = 0; msk[y * cols + x] = 0; }
    const m = pts.length;
    for (let y = y0; y <= y1; y++) {
      for (let sy = 0; sy < SH; sy++) {
        const yy = y + (sy + 0.5) / SH, xs = [];
        for (let i = 0; i < m; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % m];
          if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const a = Math.max(xs[k], x0), b = Math.min(xs[k + 1], x1 + 1);
          const s0 = Math.ceil(a * SW - 0.5), s1 = Math.ceil(b * SW - 0.5);
          for (let sx = s0; sx < s1; sx++) {
            const cx = Math.floor(sx / SW), i = y * cols + cx;
            cov[i]++;
            if (mode === 'blocks') msk[i] |= 1 << ((sy ? 2 : 0) + (sx - cx * SW ? 1 : 0));
          }
        }
      }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * cols + x, c = cov[i];
      if (!c) continue;
      // bg = -1: el fondo de la celda NO se toca (hereda lo que hay debajo, también al componer capas con overlay)
      if (mode === 'blocks') {
        const mk = msk[i];
        if (mk === 15 && inner) { const g = inner(x, y); this.put(x, y, g[0], g[1] ?? fg); }
        else this.put(x, y, QUAD[mk], fg);
      } else {
        const f = c / (SW * SH);
        if (f >= 0.999 && inner) { const g = inner(x, y); this.put(x, y, g[0], g[1] ?? fg); }
        else this.put(x, y, ramp[Math.min(ramp.length - 1, Math.round(f * (ramp.length - 1)))], fg);
      }
    }
  }
  rectFill(x, y, w, h, fg, o) { this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fg, o); }
  ellipse(cx, cy, rx, ry, fg, o) { const p = []; for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } this.poly(p, fg, o); }

  // --- sprites: arte en cadenas (' ' = transparente) + capa de tonos opcional (dígitos hex por celda) ---
  sprite(x, y, art, fg = 9, o = {}) {
    const { tones = null, bg = -1, solid = false, dither = 1, seed = 0 } = o;
    for (let j = 0; j < art.length; j++) {
      const row = art[j];
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === ' ' && !solid) continue;
        if (dither < 1 && bayer(x + i, y + j) > dither) continue;
        let t = fg;
        if (tones && tones[j] && tones[j][i] && tones[j][i] !== ' ') t = parseInt(tones[j][i], 16);
        this.put(x + i, y + j, c, t, bg);
      }
    }
  }

  // --- sombreado: valor 0..1 -> (glifo de rampa) con dither ordenado entre pasos vecinos ---
  shade(v, x, y, ramp = RAMP, thr = bayer(x, y)) {
    const p = clamp(v) * (ramp.length - 1), k = Math.floor(p), f = p - k;
    return ramp[Math.min(ramp.length - 1, k + (f > thr ? 1 : 0))];
  }
  // par de tonos con bloques ░▒▓: mezcla suave entre dos tonos (a=fondo, b=frente) con cobertura v
  blend2(x, y, v, ta, tb) {
    const idx = v < 0.125 ? 0 : v < 0.375 ? 1 : v < 0.625 ? 2 : v < 0.875 ? 3 : 4;
    const glyph = [gi(' '), gi('░'), gi('▒'), gi('▓'), gi('█')][idx];
    this.put(x, y, glyph, tb, ta);
  }

  // --- salida de texto (pruebas, SSR): glifos y, opcionalmente, mapa de tonos en hex ---
  toText() {
    const out = [];
    for (let y = 0; y < this.rows; y++) { let s = ''; for (let x = 0; x < this.cols; x++) s += CHARSET[this.b[(y * this.cols + x) << 2]]; out.push(s.replace(/\s+$/, '')); }
    return out.join('\n');
  }
  toTones(which = 1) {
    const out = [];
    for (let y = 0; y < this.rows; y++) { let s = ''; for (let x = 0; x < this.cols; x++) s += this.b[((y * this.cols + x) << 2) + which].toString(16); out.push(s); }
    return out.join('\n');
  }
}

// HTML estático (SSR / sin JS): una <pre> con corridas <i class="a b"> de igual (fg, bg). Solo para piezas pequeñas o de prueba.
// Los tonos van como clases (.t0..t31 = color, .b0..b31 = fondo) que define el CSS a partir de los tokens.
export function toHTML(g) {
  const esc = (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c);
  const rows = [];
  for (let y = 0; y < g.rows; y++) {
    let line = '', x = 0;
    while (x < g.cols) {
      const o = (y * g.cols + x) << 2, gl = g.b[o], fg = gl ? g.b[o + 1] : 0, bg = g.b[o + 2];
      let e = x + 1, s = esc(CHARSET[gl]);
      while (e < g.cols) {
        const p = (y * g.cols + e) << 2, gl2 = g.b[p], fg2 = gl2 ? g.b[p + 1] : 0;
        if (g.b[p + 2] !== bg || (gl2 && fg2 !== fg && gl)) break;
        if (!gl && gl2) break;
        s += esc(CHARSET[gl2]); e++;
      }
      line += bg || fg ? `<i class="${fg ? 't' + fg : ''}${bg ? ' b' + bg : ''}">${s}</i>` : s;
      x = e;
    }
    rows.push(line);
  }
  return `<pre aria-hidden="true">${rows.join('\n')}</pre>`;
}
```

### B.5 · `engine/atlas.mjs`

```js
// atlas.mjs — atlas de máscaras de glifos (blanco sobre transparente), precalculado UNA vez.
// ASCII: fillText de la fuente. Bloques, cuadrantes, octavos y trazos de caja: dibujados por código (rects) -> encajan sin costuras
// entre celdas y no dependen de que la fuente cargue ni de las métricas de la fuente de reserva (idea de los «custom glyphs» de VS Code/xterm.js).
import { CHARSET, GLYPHS } from './grid.mjs';

export const ATLAS_COLS = 16;

export function buildAtlas({ cw, ch, dpr = 1, family = 'monospace', weight = 500 }) {
  const rows = Math.ceil(GLYPHS / ATLAS_COLS);
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(cw * ATLAS_COLS, ch * rows) : Object.assign(document.createElement('canvas'), { width: cw * ATLAS_COLS, height: ch * rows });
  const x = canvas.getContext('2d', { willReadFrequently: true });
  const size = cw / 0.6; // Geist Mono: avance = 0,6 em -> la celda encaja exacta
  x.font = `${weight} ${size}px ${family}`;
  x.textBaseline = 'alphabetic';
  const m = x.measureText('M');
  const asc = m.fontBoundingBoxAscent ?? size * 0.95, desc = m.fontBoundingBoxDescent ?? size * 0.3;
  const base = Math.round((ch - (asc + desc)) / 2 + asc);
  x.fillStyle = '#fff';
  const t = Math.max(1, Math.round(dpr)); // grosor de trazo ligero
  const cov = new Float32Array(GLYPHS);
  const R = (gx, gy, a, b, w, h) => x.fillRect(gx + Math.round(a), gy + Math.round(b), Math.max(0, Math.round(a + w) - Math.round(a)), Math.max(0, Math.round(b + h) - Math.round(b)));
  for (let i = 0; i < GLYPHS; i++) {
    const c = CHARSET[i], code = c.charCodeAt(0);
    const gx = (i % ATLAS_COLS) * cw, gy = Math.floor(i / ATLAS_COLS) * ch;
    x.save(); x.beginPath(); x.rect(gx, gy, cw, ch); x.clip();
    const mx = Math.floor((cw - t) / 2), my = Math.floor((ch - t) / 2);
    if (code >= 0x2580 && code <= 0x259f) {
      if (c === '▀') R(gx, gy, 0, 0, cw, ch / 2);
      else if (c === '▄') R(gx, gy, 0, ch / 2, cw, ch / 2);
      else if (c === '█') R(gx, gy, 0, 0, cw, ch);
      else if (c === '▌') R(gx, gy, 0, 0, cw / 2, ch);
      else if (c === '▐') R(gx, gy, cw / 2, 0, cw / 2, ch);
      else if ('▁▂▃▅▆▇'.includes(c)) { const n = code - 0x2580; R(gx, gy, 0, ch - (ch * n) / 8, cw, (ch * n) / 8); }
      else if ('░▒▓'.includes(c)) {
        const lvl = code - 0x2590; // 1,2,3
        for (let py = 0; py < ch; py += t) for (let px = 0; px < cw; px += t) {
          const ix = (px / t) | 0, iy = (py / t) | 0;
          const on = lvl === 2 ? (ix + iy) % 2 === 0 : lvl === 1 ? ix % 2 === 0 && iy % 2 === 0 : !(ix % 2 === 1 && iy % 2 === 1);
          if (on) x.fillRect(gx + px, gy + py, t, t);
        }
      } else { // cuadrantes
        const q = { '▖': [0, 1], '▗': [1, 1], '▘': [0, 0], '▝': [1, 0] };
        const set = { '▚': [[0, 0], [1, 1]], '▞': [[1, 0], [0, 1]], '▙': [[0, 0], [0, 1], [1, 1]], '▛': [[0, 0], [1, 0], [0, 1]], '▜': [[0, 0], [1, 0], [1, 1]], '▟': [[1, 0], [0, 1], [1, 1]] };
        const cells = q[c] ? [q[c]] : set[c] || [];
        for (const [qx, qy] of cells) R(gx, gy, (qx * cw) / 2, (qy * ch) / 2, cw / 2, ch / 2);
      }
    } else if (code >= 0x2500 && code <= 0x257f) {
      const dbl = '═║╔╗╚╝'.includes(c);
      const g = dbl ? t * 2 : 0; // separación de líneas dobles
      const H = (x0, x1) => { if (dbl) { R(gx, gy, x0, my - g, x1 - x0, t); R(gx, gy, x0, my + g, x1 - x0, t); } else R(gx, gy, x0, my, x1 - x0, t); };
      const V = (y0, y1) => { if (dbl) { R(gx, gy, mx - g, y0, t, y1 - y0); R(gx, gy, mx + g, y0, t, y1 - y0); } else R(gx, gy, mx, y0, t, y1 - y0); };
      const L = mx + t, Rr = mx, U = my + t, D = my; // puntos de unión
      if (c === '─' || c === '═') H(0, cw);
      else if (c === '│' || c === '║') V(0, ch);
      else if (c === '┌' || c === '╔') { H(Rr, cw); V(D, ch); }
      else if (c === '┐' || c === '╗') { H(0, L); V(D, ch); }
      else if (c === '└' || c === '╚') { H(Rr, cw); V(0, U); }
      else if (c === '┘' || c === '╝') { H(0, L); V(0, U); }
      else if (c === '├') { V(0, ch); H(Rr, cw); }
      else if (c === '┤') { V(0, ch); H(0, L); }
      else if (c === '┬') { H(0, cw); V(D, ch); }
      else if (c === '┴') { H(0, cw); V(0, U); }
      else if (c === '┼') { H(0, cw); V(0, ch); }
      else if ('╭╮╰╯'.includes(c)) { // esquinas redondeadas: cuarto de círculo con radio = mitad de celda
        const r = Math.min(cw, ch) / 2 - t / 2;
        x.lineWidth = t; x.strokeStyle = '#fff'; x.beginPath();
        const cx = gx + mx + t / 2, cy = gy + my + t / 2;
        if (c === '╭') { x.moveTo(gx + cw, cy); x.lineTo(cx + r, cy); x.arc(cx + r, cy + r, r, -Math.PI / 2, Math.PI, true); x.lineTo(cx, gy + ch); }
        if (c === '╮') { x.moveTo(gx, cy); x.lineTo(cx - r, cy); x.arc(cx - r, cy + r, r, -Math.PI / 2, 0, false); x.lineTo(cx, gy + ch); }
        if (c === '╰') { x.moveTo(gx + cw, cy); x.lineTo(cx + r, cy); x.arc(cx + r, cy - r, r, Math.PI / 2, Math.PI, false); x.lineTo(cx, gy); }
        if (c === '╯') { x.moveTo(gx, cy); x.lineTo(cx - r, cy); x.arc(cx - r, cy - r, r, Math.PI / 2, 0, true); x.lineTo(cx, gy); }
        x.stroke();
      } else if ('╱╲╳'.includes(c)) {
        x.lineWidth = t; x.strokeStyle = '#fff'; x.beginPath();
        if (c !== '╲') { x.moveTo(gx + cw, gy); x.lineTo(gx, gy + ch); }
        if (c !== '╱') { x.moveTo(gx, gy); x.lineTo(gx + cw, gy + ch); }
        x.stroke();
      }
    } else if (c !== ' ') {
      x.fillText(c, gx, gy + base);
    }
    x.restore();
  }
  // cobertura medida (0..1) de cada glifo: sirve para ordenar rampas de densidad con la fuente real
  const img = x.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < GLYPHS; i++) {
    const gx = (i % ATLAS_COLS) * cw, gy = Math.floor(i / ATLAS_COLS) * ch;
    let s = 0;
    for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) s += img[((gy + yy) * canvas.width + gx + xx) * 4 + 3];
    cov[i] = s / 255 / (cw * ch);
  }
  return { canvas, cols: ATLAS_COLS, rows, cw, ch, cov };
}
```

### B.6 · `engine/render-gl.mjs`

```js
// render-gl.mjs — renderizador WebGL2 «textura de celdas»: 1 textura RGBA8UI (glifo, tono fg, tono bg, banderas) + atlas de máscaras
// + textura de paleta. UN draw call por cuadro; el coste de CPU es subir cols*rows*4 bytes. La paleta se puede rotar (ciclado de paleta).
import { ATLAS_COLS } from './atlas.mjs';

const VS = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
void main(){ gl_Position = vec4(P[gl_VertexID], 0., 1.); }`;

const FS = `#version 300 es
precision highp float; precision highp int;
uniform highp usampler2D uCells; uniform sampler2D uAtlas; uniform sampler2D uPal;
uniform ivec2 uCell; uniform ivec2 uSize; uniform int uAtlasCols;
out vec4 o;
void main(){
  ivec2 pix = ivec2(int(gl_FragCoord.x), uSize.y - 1 - int(gl_FragCoord.y));
  ivec2 cell = pix / uCell;
  ivec2 loc = pix - cell * uCell;
  uvec4 c = texelFetch(uCells, cell, 0);
  int g = int(c.r);
  ivec2 tile = ivec2(g % uAtlasCols, g / uAtlasCols);
  float m = texelFetch(uAtlas, tile * uCell + loc, 0).a;
  vec3 fg = texelFetch(uPal, ivec2(int(c.g), 0), 0).rgb;
  vec3 bg = texelFetch(uPal, ivec2(int(c.b), 0), 0).rgb;
  o = vec4(mix(bg, fg, m), 1.);
}`;

export function createGLRenderer(canvas, { atlas, palette, cols, rows }) {
  const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return null;
  const { cw, ch } = atlas;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  gl.disable(gl.DITHER);   // el dither por defecto del contexto puede alterar colores planos en algunos drivers móviles
  const tex = (unit) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return t;
  };
  const tCells = tex(0);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8UI, cols, rows);
  const tAtlas = tex(1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
  const tPal = tex(2);
  const palBytes = new Uint8Array(32 * 4);
  const setPalette = (p) => { for (let i = 0; i < 32; i++) { const c = p[i] || p[p.length - 1]; palBytes[i * 4] = c[0]; palBytes[i * 4 + 1] = c[1]; palBytes[i * 4 + 2] = c[2]; palBytes[i * 4 + 3] = 255; } };
  setPalette(palette);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 32, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, palBytes);
  const U = (n) => gl.getUniformLocation(pr, n);
  gl.uniform1i(U('uCells'), 0); gl.uniform1i(U('uAtlas'), 1); gl.uniform1i(U('uPal'), 2);
  gl.uniform2i(U('uCell'), cw, ch); gl.uniform2i(U('uSize'), cols * cw, rows * ch); gl.uniform1i(U('uAtlasCols'), ATLAS_COLS);
  gl.viewport(0, 0, cols * cw, rows * ch);
  let lost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
  return {
    kind: 'webgl2',
    get lost() { return lost; },
    // pal: (opcional) paleta ya rotada para el ciclado de paleta: array de [r,g,b]
    draw(grid, pal, skipCells = false) {
      if (lost) return;
      if (!skipCells) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tCells); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, grid.b); }
      if (pal) { setPalette(pal); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tPal); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 32, 1, gl.RGBA, gl.UNSIGNED_BYTE, palBytes); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
```

### B.7 · `engine/render-canvas.mjs`

```js
// render-canvas.mjs — respaldo Canvas 2D: baldosas opacas (glifo x fg x bg) horneadas bajo demanda + diff por celda (Uint32).
// Solo dibuja las celdas que cambiaron. Las celdas vacías (' ') con fondo se pintan con fillRect (10x más barato que drawImage).
const hexOf = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

export function createCanvasRenderer(canvas, { atlas, palette, cols, rows }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const { cw, ch } = atlas;
  const hex = palette.map(hexOf);
  const mk = (w, h) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }));
  const TW = 32; // baldosas por fila
  let tileRows = 8, tiles = mk(TW * cw, tileRows * ch), tctx = tiles.getContext('2d');
  const tmp = mk(cw, ch), xctx = tmp.getContext('2d');
  const index = new Map(); let next = 0;
  const bake = (g, fg, bg) => {
    const key = g | (fg << 8) | (bg << 16);
    let id = index.get(key);
    if (id !== undefined) return id;
    id = next++; index.set(key, id);
    if (Math.floor(id / TW) >= tileRows) { // crece duplicando (raro: el conjunto de baldosas de una escena es acotado)
      const old = tiles; tileRows *= 2; tiles = mk(TW * cw, tileRows * ch); tctx = tiles.getContext('2d'); tctx.drawImage(old, 0, 0);
    }
    const tx = (id % TW) * cw, ty = Math.floor(id / TW) * ch;
    tctx.fillStyle = hex[bg]; tctx.fillRect(tx, ty, cw, ch);
    xctx.globalCompositeOperation = 'copy';
    xctx.drawImage(atlas.canvas, (g % atlas.cols) * cw, Math.floor(g / atlas.cols) * ch, cw, ch, 0, 0, cw, ch);
    xctx.globalCompositeOperation = 'source-in'; xctx.fillStyle = hex[fg]; xctx.fillRect(0, 0, cw, ch);
    tctx.drawImage(tmp, tx, ty);
    return id;
  };
  const prev = new Uint32Array(cols * rows).fill(0xffffffff);
  return {
    kind: 'canvas2d',
    get lost() { return false; },
    // devuelve cuántas celdas se repintaron (el planificador la usa para adaptar la calidad)
    draw(grid) {
      const u = grid.u, b = grid.b; let n = 0;
      for (let i = 0; i < u.length; i++) {
        const v = u[i] & 0x00ffffff;                 // ignora las banderas (capas): solo cuenta lo que se ve
        if (v === prev[i]) continue;
        prev[i] = v; n++;
        const o = i << 2, g = b[o], fg = b[o + 1], bg = b[o + 2];
        const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
        if (g === 0) { ctx.fillStyle = hex[bg]; ctx.fillRect(x, y, cw, ch); continue; }
        const id = bake(g, fg, bg);
        ctx.drawImage(tiles, (id % TW) * cw, Math.floor(id / TW) * ch, cw, ch, x, y, cw, ch);
      }
      return n;
    },
    destroy() {},
  };
}
```

### B.8 · `engine/stage.mjs`

```js
// stage.mjs — planificador de una escena en un <div>: solo anima lo visible, respeta prefers-reduced-motion, se adapta al coste real.
// Una instancia por escena; las 5 escenas de la página comparten atlas por (celda, dpr) y solo UNA anima a la vez (la que está en pantalla).
import { Grid } from './grid.mjs';
import { buildAtlas } from './atlas.mjs';
import { createGLRenderer } from './render-gl.mjs';
import { createCanvasRenderer } from './render-canvas.mjs';

const atlasCache = new Map();
const getAtlas = (key, make) => { let a = atlasCache.get(key); if (!a) atlasCache.set(key, (a = make())); return a; };

export function mountStage(host, sceneModule, o = {}) {
  const { palette, family = 'monospace', dprCap = 2, fpsTiers = [24, 15, 12, 8], budgetMs = 6, forceCanvas = false, seed = 7 } = o;
  const cellFor = (w) => (w < 520 ? { w: 7, h: 14 } : { w: 8, h: 16 });        // móvil: celda menor para conservar >= 50 columnas
  let cell = cellFor(host.clientWidth);
  const stats = { built: 0, released: 0, frames: 0, uploads: 0, paletteOnly: 0, skipped: 0, cpuMs: 0, tier: 0, kind: '', fell: false, resizes: 0 };
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, r, g, scene, atlas, cols = 0, rows = 0, dpr = 1, cw = 0, ch = 0;
  let visible = false, paused = !!o.paused, raf = 0, last = 0, simT = 0, wall0 = 0, tier = matchMedia('(pointer: coarse)').matches ? 1 : 0, ema = 0, over = 0, destroyed = false, drawn = false;

  const layout = () => {
    cell = cellFor(host.clientWidth);
    dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    cw = Math.round(cell.w * dpr); ch = Math.round(cell.h * dpr);         // celda entera en píxeles de dispositivo => nitidez y unión exacta
    const W = host.clientWidth, H = host.clientHeight || Math.round(W * 0.34);
    const nc = Math.max(40, Math.floor(W / cell.w)), nr = Math.max(28, Math.floor(H / cell.h));
    return [nc, nr];
  };
  const build = () => {
    const [nc, nr] = layout();
    cols = nc; rows = nr;
    canvas?.remove();
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true'); canvas.tabIndex = -1;
    canvas.width = cols * cw; canvas.height = rows * ch;
    Object.assign(canvas.style, { display: 'block', width: `${(cols * cw) / dpr}px`, height: `${(rows * ch) / dpr}px`, margin: 'auto' }); // CSSOM: no lo bloquea style-src
    host.appendChild(canvas);
    canvas.addEventListener('webglcontextrestored', () => { build(); sync(); });
    atlas = getAtlas(`${cw}x${ch}@${dpr}`, () => buildAtlas({ cw, ch, dpr, family, weight: 500 }));
    scene = sceneModule.make({ cols, rows, seed });
    const pal32 = scene.palette ? scene.palette(scene.settle, palette) : palette;   // 32 entradas: 16 base + 16 animadas (en Canvas 2D quedan congeladas)
    r = (!forceCanvas && createGLRenderer(canvas, { atlas, palette: pal32, cols, rows })) || createCanvasRenderer(canvas, { atlas, palette: pal32, cols, rows });
    stats.kind = r ? r.kind : 'none';
    g = new Grid(cols, rows);
    drawn = false;
  };
  const renderAt = (t) => {
    const a = performance.now();
    const ret = scene.frame(g, t);
    const pal = scene.palette && r.kind === 'webgl2' ? scene.palette(t, palette) : undefined; // ciclado de paleta solo en WebGL
    if (ret) { r.draw(g, pal); stats.uploads++; }
    else if (pal) { r.draw(g, pal, true); stats.paletteOnly++; }        // solo se sube la paleta (128 bytes)
    else stats.skipped++;
    drawn = true; stats.frames++;
    const ms = performance.now() - a; stats.cpuMs += ms;
    return ms;
  };
  const running = () => canvas && visible && !paused && !mq.matches && document.visibilityState === 'visible' && !destroyed && r && !r.lost;
  const loop = (now) => {
    raf = 0;
    if (!running()) return;
    const iv = 1000 / fpsTiers[tier];
    if (now - last >= iv - 1) {
      last = now;
      simT = (now - wall0) / 1000;
      const ms = renderAt(simT);
      ema = ema ? ema * 0.9 + ms * 0.1 : ms;
      // adaptación: si el coste medio de nuestro trabajo pasa el presupuesto durante ~20 cuadros, baja de nivel de fps; sin más niveles -> póster
      if (ema > budgetMs) { if (++over > 20) { over = 0; if (tier < fpsTiers.length - 1) { tier++; stats.tier = tier; } else { stats.fell = true; host.dataset.stage = 'poster'; canvas.style.visibility = 'hidden'; return; } } } else over = Math.max(0, over - 1);
    }
    raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    if (!canvas) return;
    if (running()) { if (!raf) { wall0 = performance.now() - simT * 1000; last = 0; raf = requestAnimationFrame(loop); } }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!drawn && r && (visible || mq.matches)) renderAt(mq.matches ? scene.settle + 0.01 : 0);       // primer cuadro / cuadro final en reposo
    else if (mq.matches && r) renderAt(scene.settle + 0.01);                                         // movimiento reducido: estado final, sin bucle
    host.dataset.stage = mq.matches ? 'still' : running() ? 'run' : 'idle';
  };

  // dos observadores: 'warm' (60 % de margen) construye el renderizador y hornea capas ANTES de llegar; 'io' (0 margen) decide si se anima.
  // Al alejarse >4 s se libera el contexto WebGL: nunca hay más de ~2 vivos aunque la página tenga 5 escenas (límite de Chrome: 16).
  let relT = 0;
  const release = () => { if (!canvas) return; r?.destroy(); canvas.remove(); canvas = r = g = scene = null; drawn = false; stats.released++; };
  // fontsReady: promesa de comprobar la fuente con document.fonts.load(...) y length > 0 (check() da true aunque la familia no exista)
  let fontOk = o.fontsReady ? null : true, wantBuild = false;
  o.fontsReady?.then((ok) => { fontOk = !!ok; if (!canvas && wantBuild) { ensure(); sync(); } });
  const ensure = () => { clearTimeout(relT); wantBuild = true; if (fontOk === null) return; if (!fontOk) { host.dataset.stage = 'poster'; return; } if (!canvas) { build(); stats.built++; } };
  const warm = new IntersectionObserver((es) => { const w = es[es.length - 1].isIntersecting; if (w) { ensure(); sync(); } else { relT = setTimeout(release, 4000); } }, { rootMargin: '60% 0px', threshold: 0 });
  warm.observe(host);
  const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '0px', threshold: 0.01 });
  io.observe(host);
  let rt = 0;
  const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!canvas) return; const [nc, nr] = layout(); if (nc !== cols || nr !== rows) { stats.resizes++; build(); sync(); } }, 150); });
  ro.observe(host);
  const onVis = () => sync(), onMq = () => sync();
  document.addEventListener('visibilitychange', onVis); mq.addEventListener('change', onMq);
  return {
    stats, get cols() { return cols; }, get rows() { return rows; },
    setPaused(p) { paused = !!p; sync(); },
    get paused() { return paused; },
    destroy() { destroyed = true; warm.disconnect(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); mq.removeEventListener('change', onMq); cancelAnimationFrame(raf); clearTimeout(relT); r?.destroy(); canvas?.remove(); },
    renderAt: (t) => { ensure(); return renderAt(t); },
  };
}
```

### B.9 · `engine/gen.mjs`

```js
// gen.mjs — generadores procedurales para escenas (código original, MIT). Todos escriben en un Grid; ninguno toca el DOM.
import { ASPECT, RAMP, gi } from './grid.mjs';
import { clamp, lerp, hash2, vnoise, bn, easeInOut, rng } from './util.mjs';

// ---------- 1) SDF + raymarching a ASCII ----------
// sdf(p:[x,y,z]) -> distancia con signo. Cámara en z=-cam mirando a +z; la celda es 1:2, así que v se escala por h*ASPECT/w.
export const sdTorus = (p, R = 0.62, r = 0.26) => Math.hypot(Math.hypot(p[0], p[2]) - R, p[1]) - r;
export function sdfRender(g, x0, y0, w, h, sdf, { rotY = 0, rotX = 0, cam = 2.6, light = [-0.5, 0.75, -0.55], steps = 26, tone = 6, toneSpan = 8, ramp = RAMP } = {}) {
  const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
  const f = (px, py, pz) => { // rotación inversa del punto (equivale a girar el objeto)
    const x1 = cy * px - sy * pz, z1 = sy * px + cy * pz;
    const y2 = cx * py - sx * z1, z2 = sx * py + cx * z1;
    return sdf([x1, y2, z2]);
  };
  const L = light, ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const e = 0.003, sc = (h * ASPECT) / w;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = ((i + 0.5) / w) * 2 - 1, v = -(((j + 0.5) / h) * 2 - 1) * sc;
    const dl = Math.hypot(u, v, 1.5), dx = u / dl, dy = v / dl, dz = 1.5 / dl;
    let t = 0, hit = false, px = 0, py = 0, pz = -cam;
    for (let s = 0; s < steps; s++) {
      px = dx * t; py = dy * t; pz = -cam + dz * t;
      const d = f(px, py, pz);
      if (d < 0.004) { hit = true; break; }
      t += d; if (t > 6) break;
    }
    if (!hit) continue;
    // normal por gradiente (tetraedro: 4 muestras)
    const a = f(px + e, py - e, pz - e), b = f(px - e, py - e, pz + e), c = f(px - e, py + e, pz - e), d4 = f(px + e, py + e, pz + e);
    let nx = a - b - c + d4, ny = -a - b + c + d4, nz = -a + b - c + d4; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const diff = clamp(nx * L[0] + ny * L[1] + nz * L[2]), rim = Math.pow(1 - clamp(-(nx * dx + ny * dy + nz * dz)), 3);
    const val = clamp(0.1 + 0.78 * diff + 0.32 * rim);
    g.put(x0 + i, y0 + j, g.shade(val, x0 + i, y0 + j, ramp, bn(x0 + i, y0 + j)), Math.round(tone + val * toneSpan));
  }
}

// ---------- 2) proyección isométrica 2:1 (dimétrica de pixel-art): 2 columnas = 1 fila de celda-visual ----------
export const iso = (cx, cy, x, y, z) => [cx + (x - y) * 2, cy + (x + y) * 0.5 - z];
export function isoBox(g, cx, cy, x, y, w, d, hgt, tones = [10, 7, 4], z0 = 0) {
  const P = (px, py, pz) => iso(cx, cy, px, py, pz);
  const top = [P(x, y, z0 + hgt), P(x + w, y, z0 + hgt), P(x + w, y + d, z0 + hgt), P(x, y + d, z0 + hgt)];
  const right = [P(x + w, y, z0 + hgt), P(x + w, y + d, z0 + hgt), P(x + w, y + d, z0), P(x + w, y, z0)];
  const left = [P(x, y + d, z0 + hgt), P(x + w, y + d, z0 + hgt), P(x + w, y + d, z0), P(x, y + d, z0)];
  g.poly(left, tones[2], { mode: 'blocks' }); g.poly(right, tones[1], { mode: 'blocks' }); g.poly(top, tones[0], { mode: 'blocks' });
  const edge = (a, b) => g.line(a[0], a[1], b[0], b[1], Math.min(15, tones[0] + 3));
  edge(top[3], top[2]); edge(top[2], top[1]); edge(top[3], left[3]); edge(top[2], left[2]); edge(top[1], right[3]);
}
// «ciudad» procedural: cuadrícula n×n de torres con alturas por ruido; se pinta de atrás hacia delante (x+y creciente)
export function isoCity(g, cx, cy, n = 5, seed = 3) {
  const order = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) order.push([x, y]);
  order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of order) {
    const hgt = 2 + Math.round(9 * Math.pow(vnoise(x * 0.9, y * 0.9, seed), 1.4) + 6 * (x === 2 && y === 2));
    isoBox(g, cx, cy, x * 3.2, y * 3.2, 2.4, 2.4, hgt, [11 - ((x + y) % 3), 7, 4]);
  }
}

// ---------- 3) texto que se descompone y recompone (partículas con destino) ----------
const FONT = { // 5x5, original
  G: ['.###.', '#....', '#.###', '#...#', '.###.'], A: ['.###.', '#...#', '#####', '#...#', '#...#'], Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  I: ['#####', '..#..', '..#..', '..#..', '#####'], D: ['####.', '#...#', '#...#', '#...#', '####.'], L: ['#....', '#....', '#....', '#....', '#####'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], E: ['#####', '#....', '####.', '#....', '#####'], B: ['####.', '#...#', '####.', '#...#', '####.'],
};
export function textPoints(word, x0, y0, gapX = 1) {
  const pts = []; let x = x0;
  for (const ch of word) { const gl = FONT[ch]; if (!gl) { x += 6; continue; } gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') { pts.push([x + i * 2, y0 + j]); pts.push([x + i * 2 + 1, y0 + j]); } })); x += 5 * 2 + gapX * 2; }
  return pts; // cada «píxel» ocupa 2 columnas para que sea ~cuadrado en una celda 1:2
}
export function makeMorph(A, B, seed = 5) {
  const r = rng(seed), n = Math.max(A.length, B.length);
  const pad = (P) => { const q = P.slice(); while (q.length < n) q.push(P[Math.floor(r() * P.length)]); return q.sort((a, b) => a[0] + (r() - 0.5) * 6 - (b[0] + (r() - 0.5) * 6)); };
  const a = pad(A), b = pad(B);
  return { n, a, b, delay: Float32Array.from({ length: n }, () => r() * 0.35), arc: Float32Array.from({ length: n }, () => (r() - 0.5) * 10) };
}
export function drawMorph(g, m, p, tone = 12) { // p 0..1
  const TR = ['.', ':', '*', '+'];
  for (let i = 0; i < m.n; i++) {
    const q = easeInOut(clamp((p - m.delay[i]) / 0.65));
    const x = lerp(m.a[i][0], m.b[i][0], q), y = lerp(m.a[i][1], m.b[i][1], q) + Math.sin(q * Math.PI) * m.arc[i] * 0.5;
    const moving = q > 0 && q < 1;
    g.put(Math.round(x), Math.round(y), moving ? TR[(i + Math.floor(q * 9)) & 3] : q >= 1 ? '█' : '█', moving ? Math.min(15, tone + 3) : tone);
  }
}

// ---------- 4) partículas en un pool de arrays tipados (sin asignaciones por cuadro) ----------
export class Particles {
  constructor(max = 256) { this.max = max; this.x = new Float32Array(max); this.y = new Float32Array(max); this.vx = new Float32Array(max); this.vy = new Float32Array(max); this.life = new Float32Array(max); this.ttl = new Float32Array(max); this.n = 0; }
  emit(x, y, vx, vy, ttl) { const i = this.n < this.max ? this.n++ : 0; this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy; this.life[i] = ttl; this.ttl[i] = ttl; }
  update(dt, gy = 14) {
    for (let i = 0; i < this.n; i++) { if (this.life[i] <= 0) continue; this.vy[i] += gy * dt; this.x[i] += this.vx[i] * dt; this.y[i] += (this.vy[i] * dt) / ASPECT; this.life[i] -= dt; }
  }
  draw(g, tone = 14) {
    const GL = ['.', ':', '+', '*', '@'];
    for (let i = 0; i < this.n; i++) { const l = this.life[i]; if (l <= 0) continue; const f = l / this.ttl[i]; g.put(Math.round(this.x[i]), Math.round(this.y[i]), GL[Math.min(4, Math.floor(f * 5))], Math.max(3, Math.round(tone * f + 2))); }
  }
}

// ---------- 5) autómatas: fuego tipo DOOM (36 niveles) y Vida de Conway ----------
export function fireStep(heat, cols, rows, frame, cool = Math.max(1, Math.round(72 / rows))) {   // cool: enfriamiento medio = cool/2 por fila -> la llama muere a ~36/(cool/2) filas
  for (let x = 0; x < cols; x++) heat[(rows - 1) * cols + x] = 36;               // fila fuente
  for (let y = 1; y < rows; y++) for (let x = 0; x < cols; x++) {
    const src = heat[y * cols + x], rnd = Math.floor(hash2(x, y, frame) * 4);
    const dx = x - rnd + 1; if (dx < 0 || dx >= cols) continue;
    heat[(y - 1) * cols + dx] = Math.max(0, src - (rnd & 1) * cool);
  }
}
export function fireDraw(g, heat, tone0 = 2) { const R = [' ', '.', ':', '*', 'x', 'X', '#', '%', '@']; for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) { const h = heat[y * g.cols + x]; if (h) g.put(x, y, R[Math.min(8, Math.ceil(h / 4.5))], Math.min(15, tone0 + Math.round(h * 0.36))); } }
export function lifeStep(a, b, cols, rows) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += a[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
    b[y * cols + x] = n === 3 || (n === 2 && a[y * cols + x]) ? 1 : 0;
  }
}

// ---------- 6) campo de flujo (Hobbs): curvas siguiendo un ángulo por ruido, con separación mínima por ocupación ----------
export function flowField(g, x0, y0, w, h, { seed = 4, curves = 90, len = 34, scale = 0.06, tone = 8 } = {}) {
  const occ = new Uint8Array(g.cols * g.rows), r = rng(seed);
  const ang = (x, y) => vnoise(x * scale, y * scale * ASPECT, seed) * Math.PI * 4;   // aspecto: el campo se ve isótropo
  for (let c = 0; c < curves; c++) {
    let x = x0 + r() * w, y = y0 + r() * h; const pts = [[x, y]]; let ok = true;
    for (let k = 0; k < len; k++) {
      const a = ang(x, y); x += Math.cos(a) * 0.9; y += (Math.sin(a) * 0.9) / ASPECT;
      if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h || occ[Math.floor(y) * g.cols + Math.floor(x)]) { ok = k > 8; break; }
      pts.push([x, y]);
    }
    if (!ok || pts.length < 6) continue;
    for (const [px, py] of pts) occ[Math.floor(py) * g.cols + Math.floor(px)] = 1;
    g.stroke(pts, Math.round(tone + r() * 5));
  }
}

// ---------- 7) plasma de bajo coste: suma de senos -> tono + glifo con ruido azul ----------
export function plasma(g, t, x0 = 0, y0 = 0, w = g.cols, h = g.rows, ramp = RAMP) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 0.5 + 0.25 * Math.sin(x * 0.13 + t) + 0.25 * Math.sin((y * ASPECT) * 0.11 - t * 0.8) * Math.cos((x + y * 2) * 0.05 + t * 0.4);
    g.put(x0 + x, y0 + y, g.shade(v, x0 + x, y0 + y, ramp, bn(x0 + x, y0 + y)), Math.round(3 + v * 9));
  }
}
```

### B.10 · `scenes/common.mjs`

```js
// common.mjs — piezas compartidas por las escenas: paleta animada (ciclado), cielo con bandas + dither, estrellas.
import { bayer, bn, hash2, clamp, lerp, smooth, easeOutExpo, fbm } from '../engine/util.mjs';
import { gi, Grid } from '../engine/grid.mjs';

export const BLK = { sp: gi(' '), l: gi('░'), m: gi('▒'), d: gi('▓'), f: gi('█') };
export const cyc = { water: 16, star: 24, beam: 30, lamp: 31 }; // índices de paleta reservados para animar sin tocar celdas

const mix = (a, b, t) => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];

// paleta de 32 entradas: 0..15 base + 16..31 animadas en función de t (ciclado de paleta: cero celdas tocadas)
export function animatedPalette(t, base) {
  const p = base.slice(0, 16);
  for (let k = 0; k < 8; k++) {            // 16..23: agua — cresta que recorre el ciclo
    const u = (((k / 8 + t * 0.16) % 1) + 1) % 1;
    const w = 0.5 + 0.5 * Math.cos(u * Math.PI * 2);
    p[16 + k] = mix(base[4], base[10], Math.pow(w, 1.8));
  }
  for (let k = 0; k < 6; k++) {            // 24..29: estrellas — fase y velocidad propias
    const w = 0.5 + 0.5 * Math.sin(t * (0.9 + k * 0.37) + k * 2.1);
    p[24 + k] = mix(base[4], base[13], 0.2 + 0.8 * w * w);
  }
  p[30] = mix(base[11], base[15], 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.15)));   // 30: núcleo de la cruz de luz
  p[31] = mix(base[11], base[15], 0.5 + 0.5 * Math.sin(t * 0.6 + 1.3));            // 31: lámparas
  return p;
}

// Cielo/mar: rampa vertical entre dos tonos de fondo con costuras dither; 'warp' curva las bandas con ruido para evitar el efecto de líneas de barrido.
export function skyBand(g, y0, y1, toneTop, toneBot, { x0 = 0, x1 = g.cols, curve = 1.6, seam = 0.3, warp = 0.5, seed = 1, fx = 0.05, fy = 0.24, flatBelow = 3 } = {}) {
  // Híbrido: en los tonos oscuros (poca diferencia entre pasos) usa medios bloques ▀▄ (resolución vertical x2, sin ruido);
  // en los tonos claros (pasos grandes) usa costuras con dither ░▒▓ entre dos tonos.
  const span = Math.max(1, y1 - y0), lo = Math.min(toneTop, toneBot), hi = Math.max(toneTop, toneBot);
  const Lat = (x, y, yy) => clamp(lerp(toneTop, toneBot, Math.pow((yy - y0) / span, curve)) + (warp ? (fbm(x * fx, yy * fy, seed) - 0.5) * warp : 0), lo, hi);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const Lm = Lat(x, y, y + 0.5), km = Math.floor(Lm);
      if (km < flatBelow && Math.floor(Lat(x, y, y + 1)) < flatBelow) {
        const a = Math.round(Lat(x, y, y + 0.25)), b = Math.round(Lat(x, y, y + 0.75));
        if (a === b) g.put(x, y, 0, a, a); else g.put(x, y, '▄', b, a);
        continue;
      }
      const k = km, f = Lm - k;
      const s = smooth(0.5 - seam, 0.5 + seam, f);
      const c = clamp(s + (bn(x, y) - 0.5) * 0.4, 0, 1);
      const q = c < 0.125 ? 0 : c < 0.375 ? 1 : c < 0.625 ? 2 : c < 0.875 ? 3 : 4;
      g.put(x, y, [BLK.sp, BLK.l, BLK.m, BLK.d, BLK.f][q], Math.min(15, k + 1), k);
    }
  }
}

export function stars(g, y0, y1, { density = 0.012, seed = 3, x0 = 0, x1 = g.cols } = {}) {
  const GL = ['.', '.', '·', '+', '*'];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (hash2(x, y, seed) > density) continue;
    g.put(x, y, GL[Math.floor(hash2(x, y, seed + 9) * GL.length) % GL.length], cyc.star + Math.floor(hash2(x, y, seed + 21) * 6));
  }
}
export { easeOutExpo };


// Escena con caché: 'draw(g, t)' dibuja el cuadro completo (modo inmediato). Tras 'settle' el cuadro es estable: se hornea UNA vez y
// después cada tick solo copia memoria. 'idle(g, t)' (opcional) pinta lo poco que sigue vivo en reposo y devuelve una FIRMA numérica
// de ese estado; si la firma no cambió, frame() devuelve 0 («idéntico al anterior») y el planificador ni sube la textura.
export function cachedScene(cols, rows, { settle, draw, idle = null, palette = null }) {
  let baked = null, steady = false, lastSig = -1;
  return {
    cols, rows, settle, palette,
    frame(g, t) {
      if (t >= settle) {
        if (!baked) { baked = new Grid(cols, rows); baked.clear(0); draw(baked, settle); }
        g.copyFrom(baked);
        const sig = idle ? idle(g, t) : 0;
        if (steady && sig === lastSig) return 0;
        steady = true; lastSig = sig; return 1;
      }
      steady = false; lastSig = -1; g.clear(0); draw(g, t); return 1;
    },
  };
}
```

### B.11 · `scenes/web.mjs`

```js
// web.mjs — «Se construye»: una interfaz (ventana web + pantalla de app) que se levanta bloque a bloque.
// Técnica: contornos que se dibujan siguiendo el perímetro (cabeza brillante + estela), rellenos por disolución ordenada (Bayer + barrido),
// barras de texto que crecen, cursor que salta al bloque en obra. Al terminar, el cuadro se hornea y solo queda el cursor parpadeando.
import { bayer, clamp, easeOutExpo, lerp } from '../engine/util.mjs';
import { cachedScene } from './common.mjs';

const prog = (t, t0, dur) => clamp((t - t0) / dur);

// celdas del perímetro de un rectángulo redondeado, en sentido horario desde la esquina superior izquierda
function perimeter(x, y, w, h) {
  const c = [[x, y, '╭']];
  for (let i = 1; i < w - 1; i++) c.push([x + i, y, '─']);
  c.push([x + w - 1, y, '╮']);
  for (let j = 1; j < h - 1; j++) c.push([x + w - 1, y + j, '│']);
  c.push([x + w - 1, y + h - 1, '╯']);
  for (let i = w - 2; i >= 1; i--) c.push([x + i, y + h - 1, '─']);
  c.push([x, y + h - 1, '╰']);
  for (let j = h - 2; j >= 1; j--) c.push([x, y + j, '│']);
  return c;
}
// dibuja el contorno hasta el progreso p; la cabeza es un destello y deja estela que se apaga hacia 'tone'
function outline(g, x, y, w, h, p, tone) {
  const cells = perimeter(x, y, w, h), n = Math.floor(p * cells.length);
  for (let i = 0; i < n; i++) {
    const d = n - 1 - i, tt = p >= 1 ? tone : d < 1 ? 15 : d < 3 ? Math.min(14, tone + 5) : d < 6 ? Math.min(13, tone + 2) : tone;
    g.put(cells[i][0], cells[i][1], cells[i][2], tt);
  }
  return n ? cells[Math.max(0, n - 1)] : null;
}
// relleno por disolución ordenada: aparece la celda si su umbral (Bayer mezclado con un barrido) es menor que p
const shown = (x, y, x0, w, p) => bayer(x, y) * 0.55 + ((x - x0) / Math.max(1, w)) * 0.45 < p * 1.02;
// panel de fondo (tono de bg) que aparece por disolución; pasar 'p' del contorno para que el volumen «se llene» al cerrarse
function panel(g, x, y, w, h, p, bg, x0 = x, w0 = w) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (shown(x + i, y + j, x0, w0, p)) g.bgTone(x + i, y + j, bg); }
function bar(g, x, y, w, p, glyph, tone) { const n = Math.round(w * p); for (let i = 0; i < n; i++) g.put(x + i, y, glyph, i === n - 1 && p < 1 ? 15 : tone); return n; }

function buildBrowser(g, t, X, Y, W, H, T0, cursor) {
  // ventana
  const pf = easeOutExpo(prog(t, T0, 0.9));
  panel(g, X + 3, Y + 1, W, H, prog(t, T0 + 0.3, 1.0), 1);       // sombra proyectada
  panel(g, X + 1, Y + 1, W - 2, H - 2, prog(t, T0 + 0.3, 1.0), 2);
  panel(g, X + 1, Y + 1, W - 2, 2, prog(t, T0 + 0.7, 0.5), 3);    // barra de título
  const head = outline(g, X, Y, W, H, pf, 8);
  if (head && pf < 1) cursor.at = head;
  // barra de título: tres puntos, candado, barra de dirección
  const pt = prog(t, T0 + 0.7, 0.5);
  if (pt > 0) {
    [6, 7, 8].forEach((tone, i) => shown(X + 2 + i * 2, Y + 1, X, W, pt) && g.put(X + 2 + i * 2, Y + 1, 'o', tone));
    bar(g, X + 10, Y + 1, W - 22, easeOutExpo(pt), '▁', 5);
    for (let i = 1; i < W - 1; i++) shown(X + i, Y + 2, X, W, pt) && g.put(X + i, Y + 2, '─', 4);
  }
  // navegación: logotipo y tres enlaces
  const pn = prog(t, T0 + 1.1, 0.6);
  if (pn > 0) {
    bar(g, X + 3, Y + 4, 6, easeOutExpo(pn), '█', 11);
    for (let k = 0; k < 3; k++) bar(g, X + W - 26 + k * 8, Y + 4, 5, easeOutExpo(clamp(pn * 1.3 - k * 0.15)), '▄', 6);
  }
  // titular (2 líneas), bajada (3 líneas) y botón
  const colW = Math.floor((W - 8) * 0.52);
  const ph1 = prog(t, T0 + 1.5, 0.7), ph2 = prog(t, T0 + 1.75, 0.7);
  const hy = Y + 7;
  const e1 = bar(g, X + 3, hy, Math.floor(colW * 0.9), easeOutExpo(ph1), '█', 12);
  const e2 = bar(g, X + 3, hy + 2, Math.floor(colW * 0.55), easeOutExpo(ph2), '█', 12);
  if (ph1 > 0 && ph1 < 1) cursor.at = [X + 3 + e1, hy];
  else if (ph2 > 0 && ph2 < 1) cursor.at = [X + 3 + e2, hy + 2];
  for (let k = 0; k < 3; k++) {
    const pk = easeOutExpo(prog(t, T0 + 2.05 + k * 0.15, 0.55));
    bar(g, X + 3, hy + 5 + k, Math.floor(colW * [0.85, 0.7, 0.45][k]), pk, '▁', 6);
  }
  const pb = prog(t, T0 + 2.7, 0.55);
  if (pb > 0) {
    const bx = X + 3, by = hy + 9, bw = 14, bh = 3;
    outline(g, bx, by, bw, bh, easeOutExpo(pb), 10);
    if (pb > 0.5) for (let i = 1; i < bw - 1; i++) shown(bx + i, by + 1, bx, bw, (pb - 0.5) * 2) && g.put(bx + i, by + 1, i > 3 && i < bw - 4 ? '▄' : '▒', i > 3 && i < bw - 4 ? 12 : 6);
  }
  // imagen: cielo en degradado (fondo), sol, montañas en bloques, marco
  const ix = X + 3 + colW + 3, iw = W - (ix - X) - 3, ih = 14, iy = Y + 6, pi = prog(t, T0 + 1.9, 1.1);
  if (pi > 0) {
    for (let j = 1; j < ih - 1; j++) for (let i = 1; i < iw - 1; i++) if (shown(ix + i, iy + j, ix, iw, pi)) g.bgTone(ix + i, iy + j, Math.round(lerp(3, 7, Math.pow(j / (ih - 2), 1.4))));
    if (pi > 0.5) {
      const q = clamp((pi - 0.5) * 2), sx = ix + Math.floor(iw * 0.68), sy = iy + 4;
      g.put(sx, sy, '@', 15, g.bgAt(sx, sy)); for (const [dx, dy, c] of [[-2, 0, '-'], [2, 0, '-'], [0, -1, '.'], [0, 1, "'"], [-1, -1, '\\'], [1, -1, '/'], [-1, 1, '/'], [1, 1, '\\']]) if (q > 0.4) g.put(sx + dx, sy + dy, c, 13);
      const m = [[0, ih - 2], [0.18, ih - 6], [0.32, ih - 4], [0.5, ih - 8], [0.7, ih - 4], [0.85, ih - 6], [1, ih - 3], [1, ih - 2]];
      if (q > 0.2) g.poly(m.map(([u, v]) => [ix + 1 + u * (iw - 2), iy + v]), 1, { mode: 'blocks' });
    }
    outline(g, ix, iy, iw, ih, easeOutExpo(Math.min(1, pi * 1.6)), 7);
  }
  // tres tarjetas
  const cy = Y + 6 + ih + 2, cwd = Math.floor((W - 8 - 4) / 3), chh = Math.min(7, Y + H - 2 - cy - 1);
  for (let k = 0; k < 3; k++) {
    const pc = prog(t, T0 + 3.0 + k * 0.32, 0.7);
    if (pc <= 0 || chh < 4) continue;
    const cx = X + 3 + k * (cwd + 2);
    panel(g, cx + 1, cy + 1, cwd - 2, chh - 2, pc, 3);
    outline(g, cx, cy, cwd, chh, easeOutExpo(Math.min(1, pc * 1.5)), 8);
    if (pc > 0.5) {
      const q = (pc - 0.5) * 2;
      g.box(cx + 2, cy + 1, 5, 3, 'round', 11);
      bar(g, cx + 2, cy + 5, cwd - 6, easeOutExpo(q), '▄', 12);
      if (chh > 7) bar(g, cx + 2, cy + 6, Math.floor((cwd - 6) * 0.6), easeOutExpo(q), '▁', 6);
    }
    if (pc > 0 && pc < 1) cursor.at = [cx + cwd, cy];
  }
}

function buildPhone(g, t, X, Y, W, H, T0) {
  const pf = easeOutExpo(prog(t, T0, 1.0));
  panel(g, X + 3, Y + 1, W, H, prog(t, T0 + 0.3, 1.0), 1);
  panel(g, X + 1, Y + 1, W - 2, H - 2, prog(t, T0 + 0.3, 1.0), 2);
  outline(g, X, Y, W, H, pf, 8);
  const p1 = prog(t, T0 + 0.8, 0.5);
  if (p1 > 0) { bar(g, X + Math.floor(W / 2) - 3, Y + 1, 6, p1, '¯', 5); bar(g, X + 3, Y + 3, W - 6, easeOutExpo(p1), '▄', 11); }
  const ph = prog(t, T0 + 1.2, 0.9);
  if (ph > 0) {
    const iw = W - 6, ih = 9, ix = X + 3, iy = Y + 5;
    for (let j = 1; j < ih - 1; j++) for (let i = 1; i < iw - 1; i++) if (shown(ix + i, iy + j, ix, iw, ph)) g.bgTone(ix + i, iy + j, Math.round(lerp(3, 7, Math.pow(j / (ih - 2), 1.4))));
    if (ph > 0.6) { g.put(ix + iw - 6, iy + 3, '@', 15, g.bgAt(ix + iw - 6, iy + 3)); g.poly([[ix + 1, iy + ih - 2], [ix + iw * 0.3, iy + ih - 5], [ix + iw * 0.55, iy + ih - 3], [ix + iw * 0.8, iy + ih - 6], [ix + iw - 1, iy + ih - 2]], 1, { mode: 'blocks' }); }
    outline(g, ix, iy, iw, ih, easeOutExpo(Math.min(1, ph * 1.5)), 7);
  }
  const rows = Math.max(2, Math.floor((H - 5 - 9 - 6) / 3));
  for (let k = 0; k < rows; k++) {
    const pr = prog(t, T0 + 2.0 + k * 0.28, 0.5), ry = Y + 5 + 9 + 2 + k * 3;
    if (pr <= 0 || ry + 1 >= Y + H - 4) continue;
    g.put(X + 3, ry, 'o', k === 0 ? 12 : 9); g.put(X + 3, ry + 1, '\'', 6);
    bar(g, X + 6, ry, W - 10, easeOutExpo(pr), '▄', 11);
    bar(g, X + 6, ry + 1, Math.floor((W - 10) * 0.6), easeOutExpo(pr), '▁', 6);
  }
  const pn = prog(t, T0 + 3.0, 0.5);
  if (pn > 0) { for (let i = 1; i < W - 1; i++) shown(X + i, Y + H - 4, X, W, pn) && g.put(X + i, Y + H - 4, '─', 4); for (let k = 0; k < 4; k++) shown(X + 4 + k * Math.floor((W - 8) / 3), Y + H - 2, X, W, pn) && g.put(X + 4 + k * Math.floor((W - 8) / 3), Y + H - 2, k === 0 ? 'o' : '·', k === 0 ? 13 : 7); }
}

export default {
  id: 'web',
  make({ cols, rows, seed = 7 }) {
    const compact = cols < 84;
    const settle = compact ? 5.2 : 6.6;
    const layout = compact
      ? { phone: [Math.round((cols - Math.min(cols - 6, 36)) / 2), 2, Math.min(cols - 6, 36), rows - 5] }
      : (() => { const bw = Math.round(cols * 0.6), pw = Math.max(20, Math.min(26, Math.round(cols * 0.2))); const x0 = Math.round((cols - (bw + 6 + pw)) / 2); return { browser: [x0, 2, bw, rows - 5], phone: [x0 + bw + 6, 5, pw, rows - 10] }; })();
    const cursor = { at: null };
    const draw = (g, t) => {
      cursor.at = null;
      if (layout.browser) buildBrowser(g, t, ...layout.browser, 0, cursor);
      if (layout.phone) buildPhone(g, t, ...layout.phone, compact ? 0 : 0.6);
      if (cursor.at && t < settle && (Math.floor(t * 4) % 2 === 0)) g.put(cursor.at[0], cursor.at[1], '▌', 15);
      // destello de «publicado»: una línea de luz cruza la escena al final
      const ps = prog(t, settle - 1.1, 0.9);
      if (ps > 0 && ps < 1) { const sx = Math.round(ps * (g.cols + 6)) - 3; for (let y = 0; y < g.rows; y++) for (let d = 0; d < 4; d++) { const x = sx - d; if (x < 0 || x >= g.cols) continue; const c = g.get(x, y); if (c.c) g.tone(x, y, Math.min(15, Math.max(c.fg, [15, 13, 11, 9][d]))); } }
    };
    const idle = (g, t) => {
      const st = Math.floor(t * 1.6) % 2;
      const at = layout.browser ? [layout.browser[0] + 3 + Math.floor((layout.browser[2] - 8) * 0.52 * 0.55), layout.browser[1] + 9] : [layout.phone[0] + layout.phone[2] - 5, layout.phone[1] + 3];
      if (st === 0) g.put(at[0], at[1], '▌', 14);
      return st;
    };
    return cachedScene(cols, rows, { settle, draw, idle });
  },
};
```

### B.12 · `scenes/mkt.mjs`

```js
// mkt.mjs — «Alcance»: un megáfono emite anillos de señal; cada persona alcanzada se enciende y se une a la red; abajo, barras que crecen.
// Técnicas: arcos por distancia visual (la celda es 1:2), puntos por muestreo de discos (dardos), grafo que crece (padre = vecino más cercano ya alcanzado),
// barras con octavos de bloque (▁▂▃▄▅▆▇█ = resolución x8 en vertical) y línea de tendencia que las sigue.
import { ASPECT, EIGHTHS } from '../engine/grid.mjs';
import { clamp, easeOutExpo, lerp, hash2, rng, bayer } from '../engine/util.mjs';
import { cachedScene } from './common.mjs';

const prog = (t, t0, d) => clamp((t - t0) / d);
const vdist = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * ASPECT);

export default {
  id: 'mkt',
  make({ cols, rows, seed = 7 }) {
    const compact = cols < 84;
    const S = compact ? [Math.round(cols * 0.16), Math.round(rows * 0.36)] : [Math.round(cols * 0.13), Math.round(rows * 0.44)];
    const AR = compact ? { x0: cols * 0.34, x1: cols * 0.95, y0: 2, y1: rows * 0.62 } : { x0: cols * 0.3, x1: cols * 0.96, y0: 2, y1: rows * 0.6 };
    const CR = compact ? { x0: 3, x1: cols - 3, y0: Math.round(rows * 0.68), y1: rows - 3 } : { x0: Math.round(cols * 0.32), x1: Math.round(cols * 0.95), y0: Math.round(rows * 0.68), y1: rows - 3 };
    const V = 34; // celdas visuales por segundo
    // --- audiencia: muestreo de discos por dardos con distancia mínima
    const R = rng(seed), people = [], want = compact ? 20 : 36, dmin = compact ? 8 : 9;
    for (let tries = 0; tries < 900 && people.length < want; tries++) {
      const x = lerp(AR.x0, AR.x1, R()), y = lerp(AR.y0, AR.y1, R());
      if (people.every((p) => vdist(p.x, p.y, x, y) > dmin) && vdist(S[0], S[1], x, y) > 14) people.push({ x: Math.round(x), y: Math.round(y) });
    }
    people.forEach((p) => { p.tr = 0.55 + vdist(S[0] + 6, S[1], p.x, p.y) / V; });
    people.sort((a, b) => a.tr - b.tr);
    people.forEach((p, i) => { // padre: vecino más cercano entre los ya alcanzados (o la fuente)
      let best = { x: S[0] + 7, y: S[1] }, bd = 19;
      for (let k = 0; k < i; k++) { const d = vdist(p.x, p.y, people[k].x, people[k].y); if (d < bd) { bd = d; best = people[k]; } }
      p.par = best; p.hub = i % 9 === 4;
    });
    const Rmax = Math.max(...people.map((p) => vdist(S[0] + 6, S[1], p.x, p.y))) + 8;
    // --- barras
    const n = Math.max(6, Math.floor((CR.x1 - CR.x0 + 1) / 4)), maxRows = CR.y1 - CR.y0, H8 = maxRows * 8;
    const bars = Array.from({ length: n }, (_, i) => ({ x: CR.x0 + i * 4, h: Math.round(H8 * (0.12 + 0.86 * Math.pow((i + 1) / n, 1.5) * (0.92 + 0.16 * hash2(i, 3, seed)))), t0: 1.0 + i * (compact ? 0.16 : 0.14) }));
    const settle = 5.4;

    const draw = (g, t) => {
      // resplandor de la fuente: dos tonos de fondo mezclados con ░▒▓ y umbral Bayer (sin escalones)
      const Rg = 34;
      for (let y = 0; y < CR.y0; y++) for (let x = 0; x < cols; x++) {
        const d = vdist(S[0] + 4, S[1], x, y) / Rg; if (d >= 1) continue;
        const v = 3.2 * (1 - d) * (1 - d), k = Math.floor(v), f = v - k;
        const c = clamp(f + (bayer(x, y) - 0.5) * 0.45), q = c < 0.125 ? 0 : c < 0.375 ? 1 : c < 0.625 ? 2 : c < 0.875 ? 3 : 4;
        if (v > 0.15) g.put(x, y, [0, '░', '▒', '▓', '█'][q], k + 1, k);
      }
      // megáfono
      const [sx, sy] = S, pm = easeOutExpo(prog(t, 0, 0.7));
      if (pm > 0.05) {
        g.poly([[sx - 5, sy - 1.6], [sx + 0.5, sy - 1.6], [sx + 0.5, sy + 1.6], [sx - 5, sy + 1.6]], 8, { mode: 'blocks' });
        g.poly([[sx + 0.5, sy - 1], [sx + 7, sy - 3.4], [sx + 7, sy + 3.4], [sx + 0.5, sy + 1]], 11, { mode: 'blocks' });
        g.poly([[sx - 3.5, sy + 1.6], [sx - 1, sy + 1.6], [sx - 1.5, sy + 4.4], [sx - 3.2, sy + 4.4]], 6, { mode: 'blocks' });
        for (let y = -3; y <= 2; y++) g.put(sx + 7, sy + y, '▐', 14);        // borde luminoso de la boca
        g.put(sx + 2, sy - 2, '▀', 14); g.put(sx + 3, sy - 2, '▀', 13);
      }
      // anillos de señal: arcos que se abren desde la boca del megáfono
      for (let k = 0; k < 6; k++) {
        const r = (t - 0.5 - k * 0.42) * V;
        if (r < 3 || r > Rmax) continue;
        const f = r / Rmax;
        g.arc(sx + 6, sy, r, -0.8, 0.8, Math.round(lerp(14, 4, f)), { dotted: k > 0 && r > 20 || r > 40 });
      }
      if (t >= settle) for (const [r, tone] of [[18, 13], [36, 9], [54, 6]]) g.arc(sx + 6, sy, r, -0.95, 0.95, tone, { dotted: r > 30 });
      // personas + red
      for (const p of people) {
        const dt = t - p.tr;
        if (dt < 0) { g.put(p.x, p.y, '.', 3); continue; }
        const lp = clamp(dt / 0.45), par = p.par;
        g.stroke([[par.x + 0.5, par.y + 0.5], [par.x + 0.5 + (p.x - par.x) * lp, par.y + 0.5 + (p.y - par.y) * lp]], p.hub ? 6 : 5, { dotted: true });
      }
      for (const p of people) {
        const dt = t - p.tr;
        if (dt < 0) continue;
        const flash = dt < 0.28;
        g.put(p.x, p.y, flash ? 'O' : p.hub ? '@' : 'o', flash ? 15 : p.hub ? 13 : 10);
        if (p.hub && !flash) { g.put(p.x - 1, p.y, '(', 8); g.put(p.x + 1, p.y, ')', 8); }
      }
      // gráfica de barras (octavos)
      for (let x = CR.x0; x < CR.x1; x++) g.put(x, CR.y1, '─', 4);
      const tops = [];
      bars.forEach((b, i) => {
        const p = easeOutExpo(prog(t, b.t0, 0.9)), h8 = Math.round(b.h * p);
        tops.push([b.x + 1.5, CR.y1 - b.h / 8, p]);
        if (h8 <= 0) return;
        const full = Math.floor(h8 / 8), rem = h8 % 8;
        for (let c = 0; c < 3; c++) {
          const tone0 = c === 0 ? 1 : c === 1 ? 0 : -1;
          for (let k = 0; k < full; k++) g.put(b.x + c, CR.y1 - 1 - k, '█', clamp(Math.round(lerp(6, 12, k / maxRows)) + tone0, 3, 14));
          if (rem) g.put(b.x + c, CR.y1 - 1 - full, EIGHTHS[rem], clamp(13 + tone0, 3, 15));
          else if (full) g.tone(b.x + c, CR.y1 - full, clamp(14 + tone0, 3, 15));
        }
        if (p < 1 && p > 0) g.put(b.x + 1, CR.y1 - 2 - full, '.', 15);
      });
      // línea de tendencia sobre los topes
      const done = tops.filter((q) => q[2] > 0.98);
      if (done.length > 1) {
        const lp = prog(t, bars[n - 1].t0 + 0.4, 1.0), upto = Math.max(1, Math.round((done.length - 1) * (done.length === n ? easeOutExpo(lp) : 1)));
        g.stroke(done.slice(0, upto + 1).map((q) => [q[0], q[1] - 1.4]), 12, { dotted: true });
      }
    };
    const idle = (g, t) => { const s = Math.floor(t * 2) % 2; const q = bars[n - 1]; if (s) g.put(q.x + 1, CR.y1 - Math.ceil(q.h / 8) - 1, '*', 15); return s; };
    return cachedScene(cols, rows, { settle, draw, idle });
  },
};
```

### B.13 · `scenes/it.mjs`

```js
// it.mjs — «Latido»: un hub y tres racks unidos por enlaces; por los cables viajan pulsos (se iluminan las propias celdas del trazo).
// Un rack falla (parpadeo, estática, enlace mudo, el electrocardiograma se aplana), un barrido lo repara y el latido vuelve más fuerte.
// Técnicas: rutas ortogonales con esquinas de caja, pulso = subida de tono sobre el trazo existente (sin glifos nuevos), ECG con octavos de bloque.
import { EIGHTHS } from '../engine/grid.mjs';
import { clamp, easeOutExpo, lerp, hash2 } from '../engine/util.mjs';
import { cachedScene } from './common.mjs';

const prog = (t, t0, d) => clamp((t - t0) / d);

// ruta ortogonal por puntos (x,y) enteros -> celdas [x,y,glifo] con esquinas ┌┐└┘
function ortho(pts) {
  const out = [];
  const dir = (a, b) => (b[0] > a[0] ? 'E' : b[0] < a[0] ? 'W' : b[1] > a[1] ? 'S' : 'N');
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], d = dir(a, b);
    const steps = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    for (let k = i === 0 ? 0 : 1; k <= steps; k++) {
      const x = a[0] + (d === 'E' ? k : d === 'W' ? -k : 0), y = a[1] + (d === 'S' ? k : d === 'N' ? -k : 0);
      let c = d === 'E' || d === 'W' ? '─' : '│';
      if (k === steps && i < pts.length - 2) {
        const n = dir(b, pts[i + 2]);
        c = { SE: '└', SW: '┘', NE: '┌', NW: '┐', ES: '┐', EN: '┘', WS: '┌', WN: '└' }[d + n] || c;
        if ((d === 'S' && n === 'E') || (d === 'S' && n === 'W')) c = d + n === 'SE' ? '└' : '┘';
        if ((d === 'E' && n === 'S')) c = '┐'; if ((d === 'W' && n === 'S')) c = '┌';
      }
      out.push([x, y, c]);
    }
  }
  return out;
}

function ecgValue(u) { // onda PQRST normalizada, u en [0,1) -> valor en [-0.25, 1]
  const gs = (m, s, a) => a * Math.exp(-((u - m) * (u - m)) / (2 * s * s));
  return gs(0.16, 0.035, 0.14) + gs(0.32, 0.012, -0.12) + gs(0.355, 0.014, 1.0) + gs(0.395, 0.014, -0.24) + gs(0.63, 0.05, 0.3);
}

export default {
  id: 'it',
  make({ cols, rows, seed = 7 }) {
    const compact = cols < 84;
    const nR = compact ? 2 : 3;
    const hubW = compact ? 20 : 26, hubX = Math.round((cols - hubW) / 2), hubY = 2;
    const rackW = compact ? 15 : 17, rackH = 13, rackY = 11;
    const gap = Math.floor((cols - 8 - nR * rackW) / (nR + 1));
    const racks = Array.from({ length: nR }, (_, i) => ({ x: 4 + gap + i * (rackW + gap), y: rackY, w: rackW, h: rackH }));
    const ecgY1 = rows - 3, ecgH = Math.min(7, rows - rackY - rackH - 3), ecgX0 = 4, ecgX1 = cols - 4;
    // enlaces hub -> racks
    const ports = racks.map((_, i) => hubX + 4 + Math.round((i * (hubW - 8)) / Math.max(1, nR - 1)));
    const links = racks.map((r, i) => {
      const px = ports[i], cx = r.x + Math.floor(r.w / 2), my = hubY + 6 + (i % 2);
      return ortho([[px, hubY + 4], [px, my], [cx, my], [cx, r.y]]);
    });
    const fail = 1, F0 = 3.0, R0 = 5.4, R1 = 7.0, settle = 8.4;
    const isDown = (t) => t >= F0 + 0.5 && t < R1;

    const drawRack = (g, r, t, idx, alive) => {
      const restored = t >= R1 && idx === fail;
      const tone = alive ? 8 : 3;
      const sweepY = idx === fail && t >= R0 && t < R1 ? r.y + Math.round(prog(t, R0, R1 - R0) * (r.h - 1)) : -99;
      g.box(r.x, r.y, r.w, r.h, 'single', tone);
      g.fillBg(r.x + 1, r.y + 1, r.w - 2, r.h - 2, alive ? 2 : 1);
      g.put(r.x + Math.floor(r.w / 2), r.y, '┬', alive ? 12 : 3);
      for (let s = 0; s < 5; s++) {
        const y = r.y + 2 + s * 2;
        const upTo = idx === fail && t >= R0 && t < R1;
        const ok = alive || (upTo && y < sweepY);
        // LED + barra + orificios de ventilación
        const blink = 0.5 + 0.5 * Math.sin(t * 5 + hash2(idx, s, seed) * 6.28);
        g.put(r.x + 2, y, ok ? '▌' : ' ', ok ? (blink > 0.6 ? 14 : 10) : 2);
        for (let k = 0; k < r.w - 9; k++) g.put(r.x + 4 + k, y, ok ? '▄' : (hash2(k, s, Math.floor(t * 9)) > 0.72 ? '░' : ' '), ok ? 7 : 3);
        for (let k = 0; k < 3; k++) g.put(r.x + r.w - 5 + k, y, ':', ok ? 6 : 2);
        g.put(r.x + 2, y + 1, ok ? '·' : ' ', 5);
        for (let k = 0; k < r.w - 9; k++) g.put(r.x + 4 + k, y + 1, ok ? '▁' : ' ', 4);
      }
      if (sweepY > -99) for (let x = r.x + 1; x < r.x + r.w - 1; x++) g.put(x, sweepY, '═', 15);
      if (restored && t < R1 + 0.35) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { const c = g.get(x, y); if (c.c) g.tone(x, y, Math.min(15, c.fg + 5)); }
    };

    const draw = (g, t) => {
      // hub
      const px = Math.round(prog(t, 0, 0.6) * 100) / 100;
      if (px > 0) {
        g.box(hubX, hubY, hubW, 5, 'double', 10);
        g.fillBg(hubX + 1, hubY + 1, hubW - 2, 3, 2);
        for (let k = 0; k < hubW - 6; k += 2) g.put(hubX + 3 + k, hubY + 2, '▄', 6 + ((k / 2) % 3));
        ports.forEach((p) => g.put(p, hubY + 4, '╤', 13));
        g.put(hubX + hubW - 3, hubY + 1, '▌', 13);
      }
      // enlaces (apagado el del rack caído mientras esté abajo)
      links.forEach((cells, i) => {
        const p = prog(t, 0.4 + i * 0.2, 0.7), n = Math.floor(cells.length * easeOutExpo(p));
        const off = i === fail && isDown(t) && t < R0 + 0.6;
        for (let k = 0; k < n; k++) g.put(cells[k][0], cells[k][1], off ? (k % 2 ? '·' : ' ') : cells[k][2], off ? 3 : 6);
      });
      racks.forEach((r, i) => { const p = prog(t, 0.7 + i * 0.25, 0.6); if (p > 0) drawRack(g, r, t, i, !(i === fail && isDown(t)) && !(i === fail && t >= F0 && t < F0 + 0.5 && Math.floor(t * 4) % 2)); });
      // pulsos por los cables
      links.forEach((cells, i) => {
        if (t < 1.4 || t >= settle) return;
        const off = i === fail && t >= F0 && t < R1;
        const L = cells.length, per = L + 16, s = (((t - 1.4) * 15 + i * 9) % per);
        for (const [dir, ph] of [[1, 0], [-1, per / 2]]) {
          const pos = dir > 0 ? s : ((s + ph) % per);
          const head = dir > 0 ? Math.floor(pos) : L - 1 - Math.floor((pos + 0) % per);
          for (let d = 0; d < 4; d++) {
            const k = head - d * dir; if (k < 0 || k >= L) continue;
            if (off && k > L * 0.55) continue;
            g.tone(cells[k][0], cells[k][1], [15, 13, 11, 9][d]);
          }
        }
      });
      // electrocardiograma (en reposo lo pinta idle)
      if (t < settle) ecg(g, t);
    };

    // ECG: traza fina con cabeza brillante a la derecha (lo viejo se apaga hacia la izquierda), relleno tenue debajo y tramos verticales
    // entre columnas para que el pico R se vea continuo. Altura en octavos de bloque.
    const ecg = (g, t) => {
      const W = ecgX1 - ecgX0, period = 30, maxH8 = ecgH * 8;
      let prevH = null;
      for (let x = 0; x < W; x++) {
        const tt = t - (W - 1 - x) / 22;
        let amp = 1, flat = false;
        if (tt >= F0 + 0.4 && tt < R1 - 0.2) { amp = tt < F0 + 1.3 ? 0.45 * Math.abs(Math.sin(tt * 37)) : 0; flat = amp === 0; }
        else if (tt >= R1 - 0.2 && tt < R1 + 1.4) amp = 1.3;
        const u = ((tt * 22) % period + period) % period / period;
        const v = flat ? 0 : ecgValue(u) * amp;
        const h8 = clamp(Math.round((0.16 + 0.78 * clamp((v + 0.25) / 1.3)) * maxH8), 1, maxH8);
        const px = ecgX0 + x, age = x / W, cap = clamp(Math.round(lerp(3, 14, Math.pow(age, 1.6))), 3, 15);
        const lo = prevH === null ? h8 : Math.min(h8, prevH), hi = prevH === null ? h8 : Math.max(h8, prevH);
        prevH = h8;
        const fullTop = Math.floor(h8 / 8);
        for (let k = 0; k < fullTop; k++) g.put(px, ecgY1 - k, '█', 1 + (age > 0.6 ? 1 : 0));                 // relleno tenue
        // tramo vertical entre esta columna y la anterior (línea continua)
        for (let k = Math.floor(lo / 8); k <= Math.floor(hi / 8); k++) { if (k === fullTop) continue; g.put(px, ecgY1 - k, '█', cap); }
        g.put(px, ecgY1 - fullTop, EIGHTHS[Math.max(1, h8 % 8)] , cap + (x > W - 3 ? 1 : 0) > 15 ? 15 : cap + (x > W - 3 ? 1 : 0));
      }
      for (let x = ecgX0; x < ecgX1; x++) g.put(x, ecgY1 + 1, '─', 3);
      g.put(ecgX1 - 1, ecgY1 - 0, ' ', 0);
    };
    const idle = (g, t) => { ecg(g, t); racks.forEach((r, i) => drawRack(g, r, t, i, true)); links.forEach((cells, i) => { const L = cells.length, per = L + 16, s = ((t * 15 + i * 9) % per); for (let d = 0; d < 4; d++) { const k = Math.floor(s) - d; if (k >= 0 && k < L) g.tone(cells[k][0], cells[k][1], [15, 13, 11, 9][d]); } }); return Math.floor(t * 12); };
    return cachedScene(cols, rows, { settle, draw, idle });
  },
};
```

### B.14 · `scenes/ai.mjs`

```js
// ai.mjs — «Aprende»: una red de nodos por capas. Las conexiones empiezan grises y desordenadas; con el entrenamiento se apagan las inútiles y
// queda encendido un circuito limpio. Por las aristas viajan señales (pulsos) que encienden los nodos; una curva de error baja hasta calmarse;
// abajo, un flujo de automatización (disparo -> proceso -> hecho) por el que circula una ficha.
// Técnicas: aristas rasterizadas una vez (celdas con dos glifos: continuo y punteado), tono por peso, pulsos deterministas por índice, curva progresiva.
import { Grid } from '../engine/grid.mjs';
import { clamp, easeInOut, lerp, hash2, rng } from '../engine/util.mjs';
import { cachedScene } from './common.mjs';

const prog = (t, t0, d) => clamp((t - t0) / d);

export default {
  id: 'ai',
  make({ cols, rows, seed = 7 }) {
    const compact = cols < 84;
    const layers = compact ? [3, 4, 4, 2] : [3, 5, 5, 2];
    const NW = { x0: compact ? 5 : Math.round(cols * 0.07), x1: compact ? cols - 6 : Math.round(cols * 0.6), y0: 3, y1: compact ? Math.round(rows * 0.5) : rows - 11 };
    const LOSS = compact ? { x0: 6, x1: cols - 6, y0: Math.round(rows * 0.56), y1: Math.round(rows * 0.56) + 9 } : { x0: Math.round(cols * 0.68), x1: Math.round(cols * 0.94), y0: 4, y1: 16 };
    const FLOW_Y = rows - 5;
    const LEARN0 = 0.8, LEARN = 4.6, settle = 6.0;
    // nodos
    const nodes = [];
    layers.forEach((n, l) => { for (let i = 0; i < n; i++) nodes.push({ l, i, x: Math.round(lerp(NW.x0, NW.x1, l / (layers.length - 1))), y: Math.round(lerp(NW.y0 + 2, NW.y1 - 2, (i + 0.5) / n)) }); });
    const nodeAt = (l, i) => nodes.find((q) => q.l === l && q.i === i);
    // aristas
    const edges = [];
    for (let l = 0; l < layers.length - 1; l++) for (let i = 0; i < layers[l]; i++) for (let j = 0; j < layers[l + 1]; j++) {
      const a = nodeAt(l, i), b = nodeAt(l + 1, j);
      const pts = [[a.x + 3, a.y + 0.5], [b.x - 0.5, b.y + 0.5]];
      edges.push({ a, b, l, i, j, w0: 0.25 + 0.6 * hash2(i, j + l * 9, seed), wT: 0.1, pts });
    }
    // circuito objetivo: UN camino limpio de una entrada a una salida queda encendido; un segundo, más tenue; el resto se apaga
    const path1 = [1, 2, 3, 0], path2 = [2, 0, 4, 1]; // índices de nodo por capa (se acotan a cada capa)
    const mark = (pth, w) => { for (let l = 0; l < layers.length - 1; l++) { const i = Math.min(pth[l], layers[l] - 1), j = Math.min(pth[l + 1], layers[l + 1] - 1); const e = edges.find((q) => q.l === l && q.i === i && q.j === j); if (e && e.wT < w) e.wT = w; } };
    mark(path2, 0.55); mark(path1, 0.98);
    const wOf = (e, t) => { const p = easeInOut(prog(t, LEARN0, LEARN)); return clamp(lerp(e.w0, e.wT, p) + (1 - p) * 0.16 * Math.sin(t * 6 + e.i * 1.7 + e.j * 2.3 + e.l)); };
    // celdas de cada arista (glifos continuo y punteado); mapa celda->aristas
    const cellMap = new Map();
    const G0 = new Grid(cols, rows);
    edges.forEach((e, k) => {
      const s = G0.strokeCells(e.pts), d = G0.strokeCells(e.pts, { dotted: true });
      e.cells = s.map(([x, y, c], n) => ({ x, y, c, d: d[Math.min(n, d.length - 1)][2], k }));
      for (const c of e.cells) { const key = c.y * 4096 + c.x; (cellMap.get(key) || cellMap.set(key, []).get(key)).push({ k, c }); }
    });
    // nodos: anillo 3x3
    const drawNode = (g, nd, a) => {
      const tone = clamp(Math.round(5 + a * 10), 5, 15), ring = ['.-.', '( )', "'-'"];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (ring[j][i] !== ' ') g.put(nd.x + i, nd.y + j, ring[j][i], tone);
      g.put(nd.x + 1, nd.y + 1, a < 0.15 ? ' ' : a < 0.4 ? '.' : a < 0.7 ? 'o' : '@', tone);
    };
    // señales: la k-ésima nace en t = 1.3 + 0.62 k en una entrada; en cada capa elige la siguiente arista con probabilidad ~ peso
    const pulses = [];
    const nP = 14;
    const routeOf = (k, t0 = 1.3 + 0.62 * k, tw = t0) => {      // tw: instante con el que se leen los pesos (en reposo, los finales)
      const r = rng(seed * 131 + k * 17);
      let cur = nodeAt(0, Math.floor(r() * layers[0])); const path = [];
      for (let l = 0; l < layers.length - 1; l++) {
        const outs = edges.filter((e) => e.l === l && e.i === cur.i); let tot = 0; const ws = outs.map((e) => { const w = Math.pow(wOf(e, Math.min(tw + l * 0.9, settle)), 2.2); tot += w; return w; });
        let x = r() * tot, pick = 0; for (; pick < outs.length - 1; pick++) { x -= ws[pick]; if (x <= 0) break; }
        path.push(outs[pick]); cur = outs[pick].b;
      }
      return { t0, path };
    };
    for (let k = 0; k < nP; k++) pulses.push(routeOf(k));
    const SPEED = 15;
    const pulseDraw = (g, t, acts) => {
      for (const p of pulses) {
        let s = (t - p.t0) * SPEED; if (s < 0) continue;
        for (let m = 0; m < p.path.length; m++) {
          const e = p.path[m], L = e.cells.length;
          if (s >= 0 && s < L + 3) for (let d = 0; d < 4; d++) { const c = e.cells[Math.floor(s) - d]; if (c) g.tone(c.x, c.y, [15, 13, 11, 9][d]); }
          if (s >= L) { const dt = (s - L) / SPEED; acts.set(e.b, Math.max(acts.get(e.b) || 0, Math.exp(-dt * 2.6))); }
          s -= L + 2;
        }
      }
    };
    // curva de pérdida
    const lossAt = (u) => 0.06 + 0.9 * Math.exp(-4.4 * u) + 0.035 * Math.sin(u * 46) * Math.exp(-2.4 * u);
    const drawLoss = (g, t) => {
      const { x0, x1, y0, y1 } = LOSS, pl = prog(t, LEARN0, LEARN);
      if (t < 0.3) return;
      for (let y = y0; y <= y1; y++) g.put(x0, y, y === y1 ? '└' : '│', 4);
      for (let x = x0 + 1; x <= x1; x++) g.put(x, y1, '─', 4);
      const pts = [], N = x1 - x0 - 2, upto = Math.round(N * pl);
      for (let i = 0; i <= upto; i++) pts.push([x0 + 2 + i, lerp(y1 - 1, y0 + 1, lossAt(i / N)) + 0.5]);
      if (pts.length > 1) g.stroke(pts, 11);
      if (pl > 0 && pl < 1 && pts.length) g.put(pts[pts.length - 1][0], Math.floor(pts[pts.length - 1][1]), '*', 15);
    };
    // flujo de automatización: [disparo] -> [proceso] -> [hecho]
    const FL = [['[@]', 'disparo'], ['(*)', 'proceso'], ['[+]', 'hecho']];
    const flowX0 = compact ? 8 : Math.round(cols * 0.16), flowX1 = compact ? cols - 8 : Math.round(cols * 0.84);
    const boxes = FL.map((_, k) => Math.round(lerp(flowX0, flowX1 - 7, k / 2)));
    const drawFlow = (g, t, tok) => {
      const pf = prog(t, 2.2, 1.6);
      boxes.forEach((bx, k) => {
        const on = pf > k / 3 + 0.05; if (!on) return;
        g.box(bx, FLOW_Y - 1, 7, 3, 'round', 9);
        g.text(bx + 2, FLOW_Y, FL[k][0], 13);
        g.fillBg(bx + 1, FLOW_Y, 5, 1, 2);
        if (k < 2) for (let x = bx + 7; x < boxes[k + 1]; x++) g.put(x, FLOW_Y, x === boxes[k + 1] - 1 ? '>' : '─', 6);
      });
      // ficha que circula
      if (tok !== null) { const x = Math.round(lerp(boxes[0] + 7, boxes[2], tok)); g.put(x, FLOW_Y, 'o', 15); g.tone(x - 1, FLOW_Y, 12); }
    };

    const draw = (g, t) => {
      // aristas por celda: tono según el mayor peso que pasa por ella
      for (const [key, arr] of cellMap) {
        let best = 0, bk = arr[0];
        for (const q of arr) { const w = wOf(edges[q.k], t); if (w >= best) { best = w; bk = q; } }
        const appear = prog(t, 0.2 + (edges[bk.k].l * 0.25), 0.6);
        if (appear < 1 && hash2(bk.c.x, bk.c.y, seed) > appear) continue;
        g.put(bk.c.x, bk.c.y, best >= 0.4 ? bk.c.c : bk.c.d, clamp(Math.round(1 + best * 10), 2, 11));
      }
      const acts = new Map();
      if (t < settle) pulseDraw(g, t, acts);
      nodes.forEach((nd) => { const pa = prog(t, 0.1 + nd.l * 0.2, 0.5); if (pa > 0) drawNode(g, nd, Math.max(acts.get(nd) || 0, nd.l === layers.length - 1 && t >= settle ? 0.9 : 0)); });
      drawLoss(g, t);
      drawFlow(g, t, t < settle ? (t > 3.0 ? ((t - 3.0) % 2.4) / 2.4 : null) : null);
    };
    // en reposo: señales nuevas que siguen el circuito ya aprendido (pesos finales), en bucle
    let rest = null;
    const idle = (g, t) => {
      rest = rest || Array.from({ length: 8 }, (_, k) => routeOf(100 + k, k * 0.62, settle));
      const acts = new Map(), period = rest.length * 0.62, tt = (((t - settle) % period) + period) % period;
      for (const p of rest) {
        let s = ((tt - p.t0 + period) % period) * SPEED;
        for (let m = 0; m < p.path.length; m++) {
          const e = p.path[m], L = e.cells.length;
          if (s < L + 3) for (let d = 0; d < 4; d++) { const c = e.cells[Math.floor(s) - d]; if (c) g.tone(c.x, c.y, [15, 13, 11, 9][d]); }
          if (s >= L) acts.set(e.b, Math.max(acts.get(e.b) || 0, Math.exp(-((s - L) / SPEED) * 2.6)));
          s -= L + 2;
        }
      }
      nodes.forEach((nd) => drawNode(g, nd, Math.max(acts.get(nd) || 0, nd.l === layers.length - 1 ? 0.55 : 0)));
      drawFlow(g, t, ((t - settle) % 2.4) / 2.4);
      return Math.floor(t * 12);
    };
    return cachedScene(cols, rows, { settle, draw, idle });
  },
};
```

### B.15 · `scenes/sd.mjs`

```js
// sd.mjs — «Santo Domingo»: horizonte nocturno. Silueta oscura contra un cielo cobalto: Obelisco, Catedral Primada, Alcázar de Colón,
// puente Juan Bosch, Faro a Colón (su cruz de luz) y el Malecón. Todo se genera con primitivas (polígonos por cobertura, trazos, cajas).
import { ASPECT, Grid } from '../engine/grid.mjs';
import { bn, hash2, clamp, lerp, easeOutExpo, vnoise } from '../engine/util.mjs';
import { skyBand, stars, animatedPalette, cyc, BLK, cachedScene } from './common.mjs';

const lampAt = (lamps, x, y) => lamps.push([x, y]);

function obelisco(g, cx, base, h, tone) {
  const wb = 5, wt = 2.4, top = base - h, py = top + Math.max(2, h * 0.11);
  g.poly([[cx - wb / 2, base], [cx - wt / 2, py], [cx, top], [cx + wt / 2, py], [cx + wb / 2, base]], tone, { mode: 'blocks' });
  g.poly([[cx - 4.5, base - 1], [cx - 3.2, base - 2.6], [cx + 3.2, base - 2.6], [cx + 4.5, base - 1], [cx + 5.5, base], [cx - 5.5, base]], tone, { mode: 'blocks' });
  // cara iluminada (izquierda): hilo de luz y punta
  for (let y = Math.ceil(py); y < base - 2; y++) g.put(Math.round(cx - lerp(wt, wb, (y - py) / (base - py)) / 2 + 0.5), y, '▌', 7, tone);
  g.put(Math.round(cx), Math.round(top), '^', 11, -1);
}

function catedral(g, x0, base, w, h, tone, lit, lamps) {
  const P = (u, v) => [x0 + u * w, base - v * h];
  g.poly([P(0, 0), P(0, 0.4), P(0.15, 0.4), P(0.15, 0.56), P(0.43, 0.86), P(0.7, 0.56), P(0.7, 0.5), P(0.73, 0.5), P(0.73, 0.78), P(0.815, 1.0), P(0.9, 0.78), P(0.9, 0.4), P(1, 0.4), P(1, 0)], tone, { mode: 'blocks' });
  // contrafuertes escalonados (luz tenue)
  for (const u of [0.15, 0.7]) for (let y = Math.round(base - h * 0.5); y < base; y++) g.put(Math.round(x0 + u * w), y, '│', 5, tone);
  // portal mayor con arco, dintel y luz interior
  const px = x0 + 0.43 * w, pw = Math.max(6, Math.round(w * 0.17)) | 0, ph = Math.max(5, Math.round(h * 0.42));
  const x1 = Math.round(px - pw / 2), y1 = base - ph;
  g.box(x1 - 1, y1 - 1, pw + 2, ph + 1, 'round', 6, tone);
  g.box(x1, y1, pw, ph, 'round', lit, tone);
  g.fillBg(x1 + 1, y1 + 1, pw - 2, ph - 1, 3);
  g.text(Math.round(px) - 1, y1 + 2, '┼', lit - 2);
  lampAt(lamps, Math.round(px), base);
  // rosetón sobre el portal y ventanas de los brazos
  g.put(Math.round(px), Math.round(base - h * 0.64), 'o', lit, tone);
  for (const u of [0.05, 0.1, 0.93, 0.97]) { g.put(Math.round(x0 + u * w), Math.round(base - h * 0.2), '▄', lit - 1, tone); lampAt(lamps, Math.round(x0 + u * w), base); }
  // campanario: vano con luz y cruz
  const tx = Math.round(x0 + 0.815 * w);
  g.put(tx, Math.round(base - h * 0.68), '▄', lit, tone); g.put(tx, Math.round(base - h * 0.5), '▀', lit - 2, tone);
  g.put(Math.round(x0 + 0.43 * w), Math.round(base - h * 0.86) - 1, '+', 11, -1);
  g.put(tx, Math.round(base - h) - 1, '+', 11, -1);
}

function alcazar(g, x0, base, w, h, tone, lit, lamps) {
  g.poly([[x0, base], [x0, base - h], [x0 + w, base - h], [x0 + w, base]], tone, { mode: 'blocks' });
  for (let x = Math.ceil(x0); x < x0 + w; x += 2) g.put(x, Math.round(base - h) - 1, '▄', tone, -1);
  for (let x = Math.ceil(x0); x < x0 + w; x++) g.put(x, Math.round(base - h), '▀', 7, tone);
  const aw = 4, pitch = 5, n = Math.floor((w - 1) / pitch);
  const off = Math.round(x0 + (w - (n * pitch - 1)) / 2);
  const ah = Math.max(3, Math.floor(h * 0.4));
  const floors = [Math.round(base - h + 1), Math.round(base - h * 0.5)];
  for (const fy of floors) for (let i = 0; i < n; i++) {
    const ax = off + i * pitch;
    g.box(ax, fy, aw, ah, 'round', 6, tone);
    g.fillBg(ax + 1, fy + 1, aw - 2, ah - 1, 2);
    if (hash2(i, fy, 5) > 0.55) { g.put(ax + 1 + (i % 2), fy + ah - 2, '▄', lit, 2); if (fy > base - h * 0.6) lampAt(lamps, ax + 1 + (i % 2), base); }
  }
}

function puente(g, cx1, cx2, deckY, topY, seaY, tone) {
  const x0 = -2, x1 = g.cols + 2;
  g.poly([[x0, deckY], [x1, deckY], [x1, deckY + 0.8], [x0, deckY + 0.8]], tone, { mode: 'blocks' });
  for (const tx of [cx1, cx2]) {
    for (const dx of [-2, 2]) g.poly([[tx + dx - 0.6, seaY], [tx + dx - 0.6, topY], [tx + dx + 0.6, topY], [tx + dx + 0.6, seaY]], tone, { mode: 'blocks' });
    g.poly([[tx - 2, topY + 2.2], [tx + 2, topY + 2.2], [tx + 2, topY + 3.2], [tx - 2, topY + 3.2]], tone, { mode: 'blocks' });
    for (let k = 1; k <= 3; k++) {
      const dx = k * 6;
      g.line(tx - 2.6, topY + 0.8, tx - 2.6 - dx, deckY, tone);
      g.line(tx + 2.6, topY + 0.8, tx + 2.6 + dx, deckY, tone);
    }
  }
}

function faro(g, cx, base, w, h, tone) {
  const P = (u, v) => [cx - w / 2 + u * w, base - v * h];
  g.poly([P(0, 0), P(0.1, 0.77), P(0.18, 0.82), P(0.284, 0.82), P(0.284, 1), P(0.72, 1), P(0.72, 0.82), P(0.82, 0.82), P(0.9, 0.77), P(1, 0)], tone, { mode: 'blocks' });
  const sx = Math.round(cx - w * 0.05), sw = Math.max(2, Math.round(w * 0.1));
  g.fillBg(sx, Math.round(base - h * 0.92), sw, Math.round(h * 0.8), 1);
  for (let r = 0; r < 3; r++) for (const sgn of [-1, 1]) {
    const y = Math.round(base - h * (0.25 + r * 0.22)), a = Math.round(cx + sgn * w * 0.1), b = Math.round(cx + sgn * w * 0.22);
    for (let x = Math.min(a, b); x <= Math.max(a, b); x++) g.put(x, y, '▁', 5, tone);
  }
}

function cruz(g, cx, yBase, len, prog) {
  const cxr = Math.round(cx), vlen = Math.round(len * clamp(prog / 0.6));
  const armY = Math.round(yBase - len + len * 0.3), armHalf = Math.round(len * 0.31 * ASPECT);
  const halo = (x, y, r, k) => { for (let dx = -r; dx <= r; dx++) { const gl = (1 - Math.abs(dx) / (r + 1)); g.bgTone(x + dx, y, Math.max(g.bgAt(x + dx, y), Math.min(7, Math.round(g.bgAt(x + dx, y) + gl * k)))); } };
  for (let k = 0; k < vlen; k++) {
    const y = yBase - 1 - k; if (y < 0) break;
    halo(cxr, y, 7, 1.6);
    g.put(cxr - 1, y, '▒', 10); g.put(cxr + 1, y, '▒', 10);
    g.put(cxr, y, '█', cyc.beam);
  }
  if (prog > 0.5) {
    const half = Math.round(armHalf * clamp((prog - 0.5) / 0.5));
    for (let dx = -half; dx <= half; dx++) {
      const f = 1 - Math.abs(dx) / (armHalf + 1);
      g.put(cxr + dx, armY, '▄', f > 0.2 ? cyc.beam : 11, g.bgAt(cxr + dx, armY));
    }
  }
}

function frond(g, x, y, a, L, tone) {
  // hoja arqueada como polígono con grosor decreciente (normal calculada en espacio visual: la celda es 1:2)
  const N = 12, c = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const X = Math.sin(a) * L * u * 1.8, Y = (-Math.cos(a) * 0.95 * u + 1.35 * u * u * (0.3 + 0.7 * Math.abs(Math.sin(a)))) * L * 0.5;
    c.push([x + X, y + Y]);
  }
  const A = [], B = [];
  for (let k = 0; k <= N; k++) {
    const p = c[Math.max(0, k - 1)], q = c[Math.min(N, k + 1)];
    const tx = q[0] - p[0], ty = (q[1] - p[1]) * ASPECT, m = Math.hypot(tx, ty) || 1;
    const h = lerp(1.7, 0.35, k / N) * (0.9 + 0.1 * (k % 2)); // pequeñas muescas: aspecto de pluma
    const nx = -ty / m * h, ny = (tx / m * h) / ASPECT;
    A.push([c[k][0] + nx, c[k][1] + ny]); B.push([c[k][0] - nx, c[k][1] - ny]);
  }
  g.poly([...A, ...B.reverse()], tone, { mode: 'blocks' });
}
function palma(g, x, base, h, lean, tone) {
  const L = [], R = [];
  for (let k = 0; k <= h; k++) { const u = k / h, cx = x + lean * u * u, w = lerp(1.3, 0.7, u); L.push([cx - w, base - k]); R.push([cx + w, base - k]); }
  g.poly([...L, ...R.reverse()], tone, { mode: 'blocks' });
  const tx = x + lean, ty = base - h, S = Math.max(8, h * 0.62);
  for (const [a, k] of [[-1.5, 0.85], [-1.15, 1], [-0.75, 1], [-0.3, 0.8], [0.3, 0.8], [0.75, 1], [1.15, 1], [1.5, 0.85], [0, 0.55]]) frond(g, tx, ty, a, S * k, tone);
}

export default {
  id: 'sd',
  make({ cols, rows, seed = 7 }) {
    const compact = cols < 80;
    const hy = Math.round(rows * (compact ? 0.68 : 0.72));            // línea de costa / horizonte
    const sc = Math.max(0.55, Math.min(1.3, cols / 120));
    let back = null, sea = null, fore = null, foreLamps = [];                                      // capas que no cambian: se calculan UNA vez por tamaño (el ruido fbm es lo caro)
    const front = (g, t, lamps) => {                                  // monumentos, cruz y palmeras: barato, se repinta en la intro
      for (let x = 0; x < cols;) {                                    // ciudad baja procedural: bloques de 3..8 columnas, 1..3 filas
        const w = 3 + Math.floor(hash2(x, 3, seed) * 6), h = 1 + Math.floor(hash2(x, 4, seed) * 3);
        g.poly([[x, hy], [x, hy - h], [x + w, hy - h], [x + w, hy]], 2, { mode: 'blocks' });
        if (hash2(x, 9, seed) > 0.6) g.put(x + 1 + Math.floor(hash2(x, 8, seed) * (w - 2)), hy - 1, '▄', cyc.lamp, 2);
        x += w + Math.floor(hash2(x, 5, seed) * 2);
      }
      const fx = Math.round(cols * (compact ? 0.76 : 0.775));
      const fw = Math.round((compact ? 15 : 24) * Math.min(1, sc + 0.15)), fh = Math.max(4, Math.round(fw * 0.31));
      faro(g, fx, hy, fw, fh, 2);
      lampAt(lamps, fx, hy);
      if (!compact) puente(g, Math.round(cols * 0.655), Math.round(cols * 0.9), hy - 4, hy - Math.round(rows * 0.34), hy, 1);
      const cw = Math.round(cols * (compact ? 0.5 : 0.3)), ch = Math.round(rows * (compact ? 0.24 : 0.3));
      const cx0 = Math.round(cols * (compact ? 0.1 : 0.17));
      catedral(g, cx0, hy, cw, ch, 1, 13, lamps);
      alcazar(g, cx0 + cw + 2, hy, Math.round(cols * (compact ? 0.3 : 0.22)), Math.round(rows * (compact ? 0.13 : 0.17)), 1, 13, lamps);
      if (!compact) obelisco(g, Math.round(cols * 0.1), hy, Math.round(rows * 0.5), 1);
      g.poly([[0, hy], [cols, hy], [cols, hy + 1.2], [0, hy + 1.2]], 0, { mode: 'blocks' });   // muro del malecón
      for (let x = 0; x < cols; x++) g.put(x, hy, '▀', 6, 0);
      for (let x = 4; x < cols; x += 11) { g.put(x, hy - 1, '·', cyc.lamp); lampAt(lamps, x, hy); }
      palma(g, compact ? 1 : 2, hy, Math.round(rows * (compact ? 0.3 : 0.46)), 3, 0);
      palma(g, cols - (compact ? 4 : 7), hy, Math.round(rows * (compact ? 0.26 : 0.44)), -3, 0);
    };
    const bakeLayers = () => {
      back = new Grid(cols, rows); back.clear(0);
      skyBand(back, 0, hy, 0.4, 8.6, { curve: 2.1, seam: 0.26, warp: 0.22, seed, fx: 0.03, fy: 0.16 });
      stars(back, 0, Math.round(hy * 0.6), { density: 0.011, seed });
      fore = new Grid(cols, rows); fore.clear(0); const lamps = foreLamps; front(fore, 99, lamps);   // capa frontal transparente: se pinta UNA vez
      sea = new Grid(cols, rows); sea.clear(0);
      // mar: reflejo del resplandor (arriba claro, abajo oscuro) + ondas oscuras + destellos que ciclan con la paleta
      skyBand(sea, hy + 1, rows, 6.6, 0.3, { curve: 0.75, seam: 0.3, warp: 0.35, seed: seed + 5, fy: 0.5, fx: 0.08 });
      for (let y = hy + 2; y < rows; y++) {
        const j = y - hy, d = j / (rows - hy);
        for (let x = 0; x < cols; x++) {
          const n = vnoise(x * (0.14 - d * 0.07) + j * 2.3, j * 0.9, seed + 2);
          if (n > 0.72 - d * 0.1) sea.put(x, y, d < 0.3 ? '-' : d < 0.7 ? '~' : '_', 1);
          else if (n < 0.13) sea.put(x, y, d < 0.5 ? '-' : '~', cyc.water + (((x >> 1) + j * 3) & 7));
        }
      }
      for (const [lx] of lamps) for (let y = hy + 2; y < Math.min(rows, hy + 2 + Math.round((rows - hy) * 0.7)); y++) {
        const d = (y - hy) / (rows - hy);
        if (hash2(lx, y, seed + 31) < 0.5 - d * 0.5) sea.put(lx, y, ':', cyc.lamp);
      }
    };
    const draw = (g, t) => {
      if (!back) bakeLayers();
      g.copyFrom(back);                                                                   // cielo + estrellas: una copia de memoria
      const fx = Math.round(cols * (compact ? 0.76 : 0.775)), fw = Math.round((compact ? 15 : 24) * Math.min(1, sc + 0.15)), fh = Math.max(4, Math.round(fw * 0.31));
      cruz(g, fx, hy - fh, Math.round(hy * 0.66), clamp((t - 1.0) / 2.6));               // la cruz crece DETRÁS de los monumentos (solo esto es dinámico)
      g.overlay(fore);                                                                    // monumentos y palmeras: memoria, no geometría
      g.u.set(sea.u.subarray((hy + 1) * cols), (hy + 1) * cols);                          // mar: otra copia
      const p = easeOutExpo(clamp(t / 2.6));                                              // revelado inicial: barrido izq->der con dither
      if (p < 0.999) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (bn(x, y) * 0.35 + (x / cols) * 0.65 > p * 1.05) g.put(x, y, 0, 0, 0);
    };
    return cachedScene(cols, rows, { settle: 4.4, draw, palette: (t, base) => animatedPalette(t, base) });
  },
};
```

### B.16 · `bench2.html`

```html
<!doctype html>
<meta charset="utf-8">
<title>bench2 canvas grid</title>
<style>
@font-face{font-family:GM;src:url('file:///C:/Users/PC/dev/gaya-web/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');font-weight:100 900}
body{background:#0b1030;color:#cfe;font:12px Consolas,monospace;margin:0;padding:0}
#out{white-space:pre-wrap;position:absolute;left:0;top:0;width:0;height:0;overflow:hidden}
canvas{display:block}
#dom{font:13.333px GM,monospace;line-height:16px;letter-spacing:0;white-space:pre;color:#8fb0ff;margin:0}
</style>
<pre id="out"></pre>
<div id="host"></div>
<script>
const q = new URLSearchParams(location.search);
const COLS = +(q.get('cols') || 120), ROWS = +(q.get('rows') || 60), D = +(q.get('dpr') || 1);
const only = (q.get('only') || '').split('|').filter(Boolean);
const N = COLS * ROWS;
const cw = 8 * D, ch = 16 * D, W = COLS * cw, H = ROWS * ch;
const out = document.getElementById('out');
const res = [];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const raf = () => new Promise(r => requestAnimationFrame(r));
const BG = '#0a0f2a';
const LV = ['#1a2a6c', '#22379a', '#2b49c8', '#3a63f0', '#5b86ff', '#8fb0ff', '#c4d8ff', '#f0f6ff'];
const RAMP = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'.split('');
const G = RAMP.length, NL = LV.length;
const FS = cw / 0.6;
const FONT = () => `${FS}px ${document.fonts.check('12px GM') ? 'GM' : 'monospace'}`;

// campo de celdas (plasma) -> glifo + nivel
const gch = new Uint8Array(N), glv = new Uint8Array(N);
function field(t) {
  let i = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) {
    const v = 0.5 + 0.25 * Math.sin(x * 0.11 + t) + 0.25 * Math.sin(y * 0.19 - t * 0.7) * Math.cos(x * 0.05 + y * 0.07 + t * 0.3);
    const vv = Math.min(0.999, Math.max(0, v));
    gch[i] = (vv * G) | 0;
    glv[i] = ((vv * NL * 0.999 + ((x * 7 + y * 13) % 3) * 0.3) | 0) % NL;
  }
}

function mkAtlasCanvas() {
  const c = document.createElement('canvas'); c.width = G * cw; c.height = NL * ch;
  const x = c.getContext('2d'); x.textBaseline = 'top'; x.font = FONT();
  for (let l = 0; l < NL; l++) for (let g = 0; g < G; g++) {
    x.fillStyle = BG; x.fillRect(g * cw, l * ch, cw, ch);
    x.fillStyle = LV[l]; x.fillText(RAMP[g], g * cw, l * ch + (ch - FS) / 2);
  }
  return c;
}
function mkMaskAtlas() { // solo máscara (blanco sobre transparente) para WebGL
  const c = document.createElement('canvas'); c.width = G * cw; c.height = ch;
  const x = c.getContext('2d'); x.textBaseline = 'top'; x.font = FONT(); x.fillStyle = '#fff';
  for (let g = 0; g < G; g++) x.fillText(RAMP[g], g * cw, (ch - FS) / 2);
  return c;
}

async function main() {
  try { await document.fonts.load('13px GM'); } catch (e) {}
  const host = document.getElementById('host');
  const cnv = document.createElement('canvas'); cnv.width = W; cnv.height = H;
  cnv.style.cssText = `width:${W / D}px;height:${H / D}px`;
  host.appendChild(cnv);
  const ctx = cnv.getContext('2d', { alpha: false });
  const atlasC = mkAtlasCanvas();
  const atlasB = await createImageBitmap(atlasC);
  // tiles sueltos (un ImageBitmap por tile)
  let tiles = null;
  if (only.includes('drawImage-tile-suelto')) {
    tiles = [];
    for (let l = 0; l < NL; l++) for (let g = 0; g < G; g++) tiles[l * G + g] = await createImageBitmap(atlasC, g * cw, l * ch, cw, ch);
  }

  const cases = {
    'fillRect x N': () => { let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) { ctx.fillStyle = LV[glv[i]]; ctx.fillRect(x * cw, y * ch, cw, ch); } },
    'fillRect x N (mismo color)': () => { ctx.fillStyle = LV[3]; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.fillRect(x * cw, y * ch, cw, ch); },
    'fillText 1 car, mismo color': () => { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.font = FONT(); ctx.fillStyle = LV[5]; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.fillText(RAMP[gch[i]], x * cw, y * ch); },
    'fillText 1 car, color por celda': () => { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.font = FONT(); let i = 0, last = -1; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) { const l = glv[i]; if (l !== last) { ctx.fillStyle = LV[l]; last = l; } ctx.fillText(RAMP[gch[i]], x * cw, y * ch); } },
    'fillText fila entera (1 cadena por fila, 1 color)': () => { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.font = FONT(); ctx.fillStyle = LV[5]; let i = 0; for (let y = 0; y < ROWS; y++) { let s = ''; for (let x = 0; x < COLS; x++, i++) s += RAMP[gch[i]]; ctx.fillText(s, 0, y * ch); } },
    'drawImage atlas-ImageBitmap subrect (suavizado ON)': () => { ctx.imageSmoothingEnabled = true; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.drawImage(atlasB, gch[i] * cw, glv[i] * ch, cw, ch, x * cw, y * ch, cw, ch); },
    'drawImage atlas-ImageBitmap subrect (suavizado OFF)': () => { ctx.imageSmoothingEnabled = false; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.drawImage(atlasB, gch[i] * cw, glv[i] * ch, cw, ch, x * cw, y * ch, cw, ch); },
    'drawImage atlas-ImageBitmap subrect (OFF + copy)': () => { ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'copy'; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.drawImage(atlasB, gch[i] * cw, glv[i] * ch, cw, ch, x * cw, y * ch, cw, ch); ctx.globalCompositeOperation = 'source-over'; },
    'drawImage atlas-Canvas subrect (OFF)': () => { ctx.imageSmoothingEnabled = false; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.drawImage(atlasC, gch[i] * cw, glv[i] * ch, cw, ch, x * cw, y * ch, cw, ch); },
    'drawImage-tile-suelto': () => { ctx.imageSmoothingEnabled = false; let i = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) ctx.drawImage(tiles[glv[i] * G + gch[i]], x * cw, y * ch); },
    'DOM <pre> textContent (7200 car, 1 color)': (() => { const pre = document.createElement('pre'); pre.id = 'dom'; host.appendChild(pre); return () => { let s = '', i = 0; for (let y = 0; y < ROWS; y++) { for (let x = 0; x < COLS; x++, i++) s += RAMP[gch[i]]; s += '\n'; } pre.textContent = s; void pre.offsetHeight; }; })(),
    'DOM <pre> con <span> por corrida de color': (() => { const pre = document.createElement('pre'); pre.id = 'dom2'; pre.style.cssText = 'font:13.333px GM,monospace;line-height:16px;white-space:pre;color:#8fb0ff;margin:0'; host.appendChild(pre); return () => { let s = '', i = 0; for (let y = 0; y < ROWS; y++) { let x = 0; while (x < COLS) { const l = glv[i + x]; let e = x + 1, t = RAMP[gch[i + x]]; while (e < COLS && glv[i + e] === l) { t += RAMP[gch[i + e]]; e++; } s += '<i class=c' + l + '>' + (t.replace(/&/g, '&amp;').replace(/</g, '&lt;')) + '</i>'; x = e; } s += '\n'; i += COLS; } pre.innerHTML = s; void pre.offsetHeight; }; })(),
  };

  // WebGL2 con textura de datos: se crea en canvas aparte
  let glCase = null;
  if (only.includes('WebGL2 textura de celdas (1 draw)')) {
    const gc = document.createElement('canvas'); gc.width = W; gc.height = H; gc.style.cssText = `width:${W / D}px;height:${H / D}px`;
    host.appendChild(gc);
    const gl = gc.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' });
    const vs = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
    const fs = `#version 300 es
precision highp float; precision highp int;
uniform highp usampler2D uCells; uniform sampler2D uAtlas; uniform sampler2D uPal;
uniform vec2 uCell; uniform float uH; out vec4 o;
void main(){
  vec2 pix = vec2(gl_FragCoord.x, uH - gl_FragCoord.y);
  ivec2 cell = ivec2(floor(pix / uCell));
  ivec2 loc = ivec2(pix - vec2(cell) * uCell);
  uvec4 c = texelFetch(uCells, cell, 0);
  float m = texelFetch(uAtlas, ivec2(int(c.r) * int(uCell.x) + loc.x, loc.y), 0).a;
  vec3 fg = texelFetch(uPal, ivec2(int(c.g), 0), 0).rgb;
  vec3 bg = texelFetch(uPal, ivec2(int(c.b), 0), 0).rgb;
  o = vec4(mix(bg, fg, m), 1.);
}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mk = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const tCells = mk(0); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, COLS, ROWS, 0, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, null);
    const tAtlas = mk(1); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); const mask = mkMaskAtlas(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    const tPal = mk(2); const pal = new Uint8Array(16 * 4); const cols = [BG, ...LV]; cols.forEach((h, i) => { pal[i * 4] = parseInt(h.slice(1, 3), 16); pal[i * 4 + 1] = parseInt(h.slice(3, 5), 16); pal[i * 4 + 2] = parseInt(h.slice(5, 7), 16); pal[i * 4 + 3] = 255; });
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 16, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pal);
    gl.uniform1i(gl.getUniformLocation(pr, 'uCells'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'uAtlas'), 1); gl.uniform1i(gl.getUniformLocation(pr, 'uPal'), 2);
    gl.uniform2f(gl.getUniformLocation(pr, 'uCell'), cw, ch); gl.uniform1f(gl.getUniformLocation(pr, 'uH'), H);
    gl.viewport(0, 0, W, H);
    const cellBuf = new Uint8Array(N * 4);
    glCase = () => {
      for (let i = 0, j = 0; i < N; i++, j += 4) { cellBuf[j] = gch[i]; cellBuf[j + 1] = glv[i] + 1; cellBuf[j + 2] = 0; cellBuf[j + 3] = 0; }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tCells);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, cellBuf);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    cases['WebGL2 textura de celdas (1 draw)'] = glCase;
    window.__gl = { gl, gc };
  }

  const names = only.length ? only : Object.keys(cases);
  for (const name of names) {
    const fn = cases[name]; if (!fn) continue;
    const frames = 90;
    let tot = 0;
    for (let f = -15; f < frames; f++) {
      field(f * 0.08);
      const a = performance.now(); fn(); const b = performance.now();
      if (f >= 0) tot += b - a;
      if (f % 8 === 0) await raf();
    }
    const R = 6; let el = 0, n = 0; await raf();
    for (let f = 0; f < 24; f++) {
      field(f * 0.08);
      const a = performance.now(); for (let r = 0; r < R; r++) fn(); await raf(); el += performance.now() - a; n += R;
    }
    res.push({ name, main: tot / frames, e2e: el / n });
    await sleep(20);
  }
  out.textContent = JSON.stringify({ COLS, ROWS, D, N, W, H, res });
  window.__done = true;
}
main().catch(e => { out.textContent = 'ERR ' + e.message + '\n' + e.stack; window.__done = true; });
</script>
```

### B.16b · `runbench2.mjs`

```js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = await import(pathToFileURL('C:/Users/PC/dev/gaya-web/node_modules/playwright/index.mjs').href);
const mode = process.argv[2] || 'gpu3';
const throttle = Number(process.argv[3] || 1);
const dpr = Number(process.argv[4] || 1);
const cols = Number(process.argv[5] || 120), rows = Number(process.argv[6] || 60);
const args = { gpu3: [], soft: ['--disable-gpu', '--disable-gpu-compositing'] }[mode];
const CASES = [
  'fillRect x N',
  'fillText 1 car, mismo color',
  'fillText 1 car, color por celda',
  'fillText fila entera (1 cadena por fila, 1 color)',
  'drawImage atlas-ImageBitmap subrect (suavizado ON)',
  'drawImage atlas-ImageBitmap subrect (suavizado OFF)',
  'drawImage atlas-ImageBitmap subrect (OFF + copy)',
  'drawImage atlas-Canvas subrect (OFF)',
  'drawImage-tile-suelto',
  'DOM <pre> textContent (7200 car, 1 color)',
  'DOM <pre> con <span> por corrida de color',
  'WebGL2 textura de celdas (1 draw)',
];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args });
const rowsOut = [];
for (const name of CASES) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (throttle > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
  const qs = `?only=${encodeURIComponent(name)}&dpr=${dpr}&cols=${cols}&rows=${rows}`;
  await page.goto(pathToFileURL(path.resolve('bench2.html')).href + qs);
  try {
    await page.waitForFunction('window.__done===true', null, { timeout: 120000 });
    const txt = await page.evaluate(() => document.getElementById('out').textContent);
    if (txt.startsWith('ERR')) rowsOut.push({ name, err: txt.split('\n')[0] });
    else { const j = JSON.parse(txt); rowsOut.push({ name, main: j.res[0]?.main, e2e: j.res[0]?.e2e, N: j.N }); }
  } catch (e) { rowsOut.push({ name, err: String(e.message).split('\n')[0] }); }
  await ctx.close();
}
await browser.close();
console.log(`### ${mode} throttle=${throttle}x dpr=${dpr} grid=${cols}x${rows}`);
for (const r of rowsOut) console.log((r.err ? 'ERR ' + r.err : `main ${r.main.toFixed(2).padStart(7)} ms | e2e ${r.e2e.toFixed(2).padStart(7)} ms | ${(r.main * 1000 / r.N).toFixed(2)} us/celda(main)`) + '  ' + r.name);
```

### B.17 · `cmap.mjs`

```js
import fs from 'node:fs';
import zlib from 'node:zlib';
const TAGS = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];
export function coverage(file){
  const b = fs.readFileSync(file);
  if (b.toString('latin1',0,4)!=='wOF2') throw new Error('not woff2');
  const numTables = b.readUInt16BE(12);
  const totalCompressed = b.readUInt32BE(20);
  let p = 48;
  const rb128 = () => { let v=0; for(let i=0;i<5;i++){const c=b[p++]; v=(v<<7)|(c&0x7f); if(!(c&0x80)) return v>>>0;} throw new Error('b128'); };
  const tables=[];
  for(let i=0;i<numTables;i++){
    const flags=b[p++]; let tag; const idx=flags&0x3f;
    if(idx===63){tag=b.toString('latin1',p,p+4);p+=4;} else tag=TAGS[idx];
    const ver=(flags>>6)&3; const orig=rb128();
    let len=orig;
    const transformed = (tag==='glyf'||tag==='loca') ? ver===0 : ver!==0;
    if(transformed) len=rb128();
    tables.push({tag,orig,len});
  }
  const data = zlib.brotliDecompressSync(b.subarray(p,p+totalCompressed));
  let off=0; const map={};
  for(const t of tables){ map[t.tag]=data.subarray(off,off+t.len); off+=t.len; }
  const cm = map['cmap']; const set=new Set();
  const n = cm.readUInt16BE(2);
  for(let i=0;i<n;i++){
    const pid=cm.readUInt16BE(4+i*8), eid=cm.readUInt16BE(6+i*8), o=cm.readUInt32BE(8+i*8);
    const fmt=cm.readUInt16BE(o);
    if(fmt===4){
      const segX2=cm.readUInt16BE(o+6); const seg=segX2/2;
      const endO=o+14, startO=endO+segX2+2, deltaO=startO+segX2, rangeO=deltaO+segX2;
      for(let s=0;s<seg;s++){
        const end=cm.readUInt16BE(endO+s*2), start=cm.readUInt16BE(startO+s*2);
        const ro=cm.readUInt16BE(rangeO+s*2), dl=cm.readInt16BE(deltaO+s*2);
        for(let c=start;c<=end&&c!==0xffff;c++){
          let g;
          if(ro===0) g=(c+dl)&0xffff; else { const gp=rangeO+s*2+ro+(c-start)*2; g=cm.readUInt16BE(gp); if(g) g=(g+dl)&0xffff; }
          if(g) set.add(c);
        }
      }
    } else if(fmt===12){
      const ng=cm.readUInt32BE(o+12);
      for(let g=0;g<ng;g++){ const s=cm.readUInt32BE(o+16+g*12), e=cm.readUInt32BE(o+20+g*12), gid=cm.readUInt32BE(o+24+g*12); if(gid) for(let c=s;c<=e;c++) set.add(c); }
    }
  }
  return set;
}
if (process.argv[1].endsWith('cmap.mjs')) {
  const root='C:/Users/PC/dev/gaya-web/node_modules/@fontsource-variable/';
  const files = process.argv.slice(2);
  const want = {
    'ASCII 20-7E': [0x20,0x7e],
    'Box drawing 2500-257F': [0x2500,0x257f],
    'Block elements 2580-259F': [0x2580,0x259f],
    'Braille 2800-28FF': [0x2800,0x28ff],
    'Geometric shapes 25A0-25FF': [0x25a0,0x25ff],
    'Sextants 1FB00-1FB3B': [0x1fb00,0x1fb3b],
  };
  for(const f of files){
    const set=coverage(root+f);
    console.log('==',f,'glyphs:',set.size);
    for(const [k,[a,z]] of Object.entries(want)){ let c=0; for(let u=a;u<=z;u++) if(set.has(u)) c++; console.log('  ',k,c+'/'+(z-a+1)); }
    const specific = '░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟╱╲╳─│┌┐└┘├┤┬┴┼■□▪·•●○◆◇▲△▼▽◐◑'.split('').filter(ch=>!set.has(ch.codePointAt(0)));
    console.log('   missing among curated:', specific.join('')||'none');
  }
}
```

### B.18 · `stage-test.html`

```html
<!doctype html>
<meta charset="utf-8"><title>stage test</title>
<style>
@font-face{font-family:GM;src:url('file:///C:/Users/PC/dev/gaya-web/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');font-weight:100 900}
html,body{margin:0;background:#02051b;color:#8fb0ff;font:14px monospace}
section{height:700px;width:960px;margin:0 auto 60px}
</style>
<div id="root"></div>
<script src="dist/gx.js"></script>
<script>
(async () => {
  try { await document.fonts.load('500 13px GM'); } catch (e) {}
  const q = new URLSearchParams(location.search);
  const ids = ['web', 'mkt', 'it', 'ai', 'sd'];
  window.stages = {};
  for (const id of ids) {
    const s = document.createElement('section'); s.id = id; s.style.height = '640px';
    document.getElementById('root').appendChild(s);
    window.stages[id] = GX.mountStage(s, GX.scenes[id], { palette: GX.PALETTE, family: 'GM, monospace', forceCanvas: q.get('r') === 'canvas', paused: q.get('paused') === '1' });
  }
  window.__ready = true;
})();
</script>
```

### B.18b · `stagerun.mjs`

```js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = await import(pathToFileURL('C:/Users/PC/dev/gaya-web/node_modules/playwright/index.mjs').href);
const a = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, '').split('=')));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [] });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2, reducedMotion: a.reduced ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
if (a.throttle) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +a.throttle }); }
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console.error', m.text()); });
await page.goto(pathToFileURL(path.resolve('stage-test.html')).href + `?r=${a.r || 'gl'}&paused=${a.paused || 0}`);
await page.waitForFunction('window.__ready===true');
const snap = () => page.evaluate(() => Object.fromEntries(Object.entries(window.stages).map(([k, v]) => [k, { ...v.stats, state: document.getElementById(k).dataset.stage, cols: v.cols, rows: v.rows }])));
const show = (label, s) => { console.log('--', label); for (const [k, v] of Object.entries(s)) console.log(k.padEnd(4), (v.state||'cold').padEnd(6), `built=${v.built} rel=${v.released} frames=${v.frames} uploads=${v.uploads} palOnly=${v.paletteOnly} skipped=${v.skipped} cpu=${v.cpuMs.toFixed(1)}ms avg=${(v.cpuMs / Math.max(1, v.frames)).toFixed(2)}ms tier=${v.tier} kind=${v.kind} ${v.cols}x${v.rows}`); };
await page.waitForTimeout(3000);
show('t=3s, arriba (solo la 1a escena visible)', await snap());
for (const id of ['mkt', 'it', 'ai', 'sd']) { await page.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await page.waitForTimeout(3500); }
show('tras recorrer las 5 escenas (3,5 s cada una)', await snap());
await page.evaluate(() => Object.values(window.stages)[4].setPaused(true));
const before = (await snap()).sd.frames; await page.waitForTimeout(1500); const after = (await snap()).sd.frames;
console.log('pausa: cuadros de sd antes/después de 1,5 s en pausa =', before, after);
if (a.shot) await page.screenshot({ path: 'out/stage-page.png' });
await browser.close();
```

### B.19 · `preview.html`

```html
<!doctype html>
<meta charset="utf-8">
<title>preview</title>
<style>
@font-face{font-family:GM;src:url('file:///C:/Users/PC/dev/gaya-web/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2');font-weight:100 900}
html,body{margin:0;background:#02051b}
canvas{display:block}
</style>
<div id="host"></div>
<script src="dist/gx.js"></script>
<script>
(async () => {
  const q = new URLSearchParams(location.search);
  const scene = q.get('scene') || 'sd';
  const t = parseFloat(q.get('t') || '99');
  const cols = +(q.get('cols') || 120), rows = +(q.get('rows') || 40);
  const dpr = +(q.get('dpr') || 2);
  const kind = q.get('r') || 'gl';
  try { await document.fonts.load('500 13px GM'); } catch (e) {}
  const cwCss = 8, chCss = 16;
  const cw = cwCss * dpr, ch = chCss * dpr;
  const atlas = GX.buildAtlas({ cw, ch, dpr, family: 'GM, monospace', weight: 500 });
  const pal0 = GX.PALETTE;
  const cv = document.createElement('canvas');
  cv.width = cols * cw; cv.height = rows * ch;
  cv.style.width = (cols * cw / dpr) + 'px'; cv.style.height = (rows * ch / dpr) + 'px';
  document.getElementById('host').appendChild(cv);
  const sc = GX.scenes[scene].make({ cols, rows, seed: 7 });
  const pal = sc.palette ? sc.palette(sc.settle, pal0) : pal0;
  const r = kind === 'gl' ? GX.createGLRenderer(cv, { atlas, palette: pal, cols, rows }) : GX.createCanvasRenderer(cv, { atlas, palette: pal, cols, rows });
  const g = new GX.Grid(cols, rows);
  const ts = q.get('ts') ? q.get('ts').split(',').map(Number) : [t];
  window.__frames = [];
  window.__cov = Array.from(atlas.cov);
  for (const tt of ts) {
    g.clear(0);
    sc.frame(g, tt);
    const cyc = sc.palette ? sc.palette(tt, pal0) : undefined;
    r.draw(g, cyc);
  }
  window.__text = g.toText();
  window.__renderer = r.kind;
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); window.__ready = true; });
</script>
```

### B.19b · `shot.mjs`

```js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = await import(pathToFileURL('C:/Users/PC/dev/gaya-web/node_modules/playwright/index.mjs').href);
const a = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, '').split('=')));
const scene = a.scene || 'sd', cols = +(a.cols || 120), rows = +(a.rows || 40), dpr = +(a.dpr || 2), r = a.r || 'gl';
const ts = a.ts || a.t || '99';
fs.mkdirSync('out', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [] });
const ctx = await browser.newContext({ viewport: { width: Math.ceil(cols * 8 + 20), height: Math.ceil(rows * 16 + 20) }, deviceScaleFactor: +(a.sf || 1) });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console.error', m.text()); });
const url = pathToFileURL(path.resolve('preview.html')).href + `?scene=${scene}&ts=${ts}&cols=${cols}&rows=${rows}&dpr=${dpr}&r=${r}`;
await page.goto(url);
await page.waitForFunction('window.__ready===true', null, { timeout: 60000 });
const err = await page.evaluate(() => window.__err);
if (err) { console.error('ERR', err); }
const el = await page.$('canvas');
const out = a.out || `out/${scene}-${cols}x${rows}-${r}-${String(ts).split(',').pop()}.png`;
if (a.clip) { const [cx, cy, cw, ch] = a.clip.split(',').map(Number); const bb = await el.boundingBox(); await page.screenshot({ path: out, clip: { x: bb.x + cx, y: bb.y + cy, width: cw, height: ch } }); } else await el.screenshot({ path: out });
if (a.text) console.log(await page.evaluate(() => window.__text));
console.log('renderer:', await page.evaluate(() => window.__renderer), '->', out);
await browser.close();
```

### B.19c · `cmp.mjs`

```js
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire('C:/Users/PC/dev/gaya-web/package.json');
const sharp = require('sharp');
for (const scene of ['web', 'mkt', 'it', 'ai', 'sd']) {
  const outs = {};
  for (const r of ['gl', 'canvas']) { const out = `out/cmp-${scene}-${r}.png`; execFileSync('node', ['shot.mjs', `scene=${scene}`, 't=99', `r=${r}`, 'dpr=2', 'sf=2', `out=${out}`], { stdio: 'pipe' }); outs[r] = out; }
  const a = await sharp(outs.gl).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(outs.canvas).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, bad = 0, n = a.data.length;
  for (let i = 0; i < n; i++) { const d = Math.abs(a.data[i] - b.data[i]); sum += d; if (d > 24) bad++; }
  console.log(scene.padEnd(4), `${a.info.width}x${a.info.height}`, 'diff medio por canal =', (sum / n).toFixed(3), '/255 | canales con |d|>24:', (100 * bad / n).toFixed(3) + '%');
}
```

### B.20 · `stats.mjs`

```js
import { Grid } from './engine/grid.mjs';
import { scenes } from './scenes/index.mjs';
const FPS = 12;
const sizes = { desktop: [120, 40], mobile: [56, 44] };
const rows = [];
for (const [sz, [cols, rws]] of Object.entries(sizes)) for (const id of Object.keys(scenes)) {
  const sc = scenes[id].make({ cols, rows: rws, seed: 7 });
  const g = new Grid(cols, rws), prev = new Uint32Array(cols * rws);
  const intro = [], steady = [], cpu = { intro: [], steady: [] };
  let skipped = 0, total = 0, paletteFrames = 0;
  const T = sc.settle + 8;
  for (let k = 0; k * (1 / FPS) < T; k++) {
    const t = k / FPS;
    g.clear(0);
    const a = performance.now();
    const ret = sc.frame(g, t);
    const ms = performance.now() - a;
    total++;
    const phase = t < sc.settle ? 'intro' : 'steady';
    cpu[phase].push(ms);
    if (ret === 0) { skipped++; (phase === 'intro' ? intro : steady).push(0); continue; }
    let n = 0; for (let i = 0; i < g.u.length; i++) if (g.u[i] !== prev[i]) { n++; prev[i] = g.u[i]; }
    (phase === 'intro' ? intro : steady).push(n);
  }
  const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0, mx = (a) => a.length ? Math.max(...a) : 0;
  rows.push({ sz, id, cells: cols * rws, settle: sc.settle, introAvg: avg(intro), introMax: mx(intro), steadyAvg: avg(steady), steadyMax: mx(steady), cpuIntro: avg(cpu.intro), cpuIntroMax: mx(cpu.intro), cpuSteady: avg(cpu.steady), cpuSteadyMax: mx(cpu.steady), skipped, total, pal: !!sc.palette });
}
console.log('tamano  escena  celdas  settle | celdas cambiadas/cuadro @12fps: intro(prom/max)  reposo(prom/max) | CPU Node ms: intro(prom/max) reposo(prom/max) | cuadros omitidos');
for (const r of rows) console.log(`${r.sz.padEnd(8)}${r.id.padEnd(6)} ${String(r.cells).padStart(5)}  ${r.settle.toFixed(1)}s | ${r.introAvg.toFixed(0).padStart(5)}/${String(r.introMax).padStart(5)}      ${r.steadyAvg.toFixed(0).padStart(5)}/${String(r.steadyMax).padStart(5)}   | ${r.cpuIntro.toFixed(2)}/${r.cpuIntroMax.toFixed(2)}  ${r.cpuSteady.toFixed(3)}/${r.cpuSteadyMax.toFixed(2)} | ${r.skipped}/${r.total}${r.pal ? '  (paleta animada)' : ''}`);
```

### B.20b · `warm.mjs`

```js
import { Grid } from './engine/grid.mjs';
import { scenes } from './scenes/index.mjs';
import { bn } from './engine/util.mjs';
bn(0, 0); // calienta la tabla de ruido azul (en producción viene incrustada)
for (const [cols, rows] of [[120, 40], [56, 44]]) for (const id of Object.keys(scenes)) {
  const sc = scenes[id].make({ cols, rows, seed: 7 }), g = new Grid(cols, rows);
  for (let k = 0; k < 30; k++) { g.clear(0); sc.frame(g, 0.05 + k / 12); }        // calentamiento (JIT + horneado de capas)
  const N = 200; let a = performance.now();
  for (let k = 0; k < N; k++) { g.clear(0); sc.frame(g, (k % (sc.settle * 12 - 1)) / 12); }   // acto repetido
  const act = (performance.now() - a) / N;
  a = performance.now();
  for (let k = 0; k < N; k++) { g.clear(0); sc.frame(g, sc.settle + 1 + k / 12); }
  const rest = (performance.now() - a) / N;
  console.log(`${cols}x${rows} ${id.padEnd(4)} acto ${act.toFixed(3)} ms | reposo ${rest.toFixed(4)} ms  (caliente, Node, un hilo)`);
}
```

### B.20c · `steady.mjs`

```js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = await import(pathToFileURL('C:/Users/PC/dev/gaya-web/node_modules/playwright/index.mjs').href);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto(pathToFileURL(path.resolve('stage-test.html')).href);
await page.waitForFunction('window.__ready===true');
for (const id of ['sd', 'ai']) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
  await page.waitForTimeout(2500);
  const a = await page.evaluate((id) => ({ ...window.stages[id].stats }), id);
  await page.waitForTimeout(6000);
  const b = await page.evaluate((id) => ({ ...window.stages[id].stats }), id);
  const d = (k) => b[k] - a[k];
  console.log(id, 'en 6 s de reposo (CPU x4): cuadros', d('frames'), 'subidas de celdas', d('uploads'), 'solo paleta', d('paletteOnly'), 'omitidos', d('skipped'), '| CPU medio/cuadro', ((b.cpuMs - a.cpuMs) / Math.max(1, d('frames'))).toFixed(3), 'ms');
}
await browser.close();
```

### B.20d · `cov.mjs`

```js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = await import(pathToFileURL('C:/Users/PC/dev/gaya-web/node_modules/playwright/index.mjs').href);
const { CHARSET } = await import('./engine/grid.mjs');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
await page.goto(pathToFileURL(path.resolve('preview.html')).href + '?scene=web&ts=99&cols=60&rows=20&dpr=2');
await page.waitForFunction('window.__ready===true');
const cov = await page.evaluate(() => window.__cov);
await browser.close();
const items = [...CHARSET].map((c, i) => ({ c, v: cov[i] })).filter((x) => x.c.charCodeAt(0) < 0x2500 || '░▒▓█'.includes(x.c));
items.sort((a, b) => a.v - b.v);
console.log('ASCII (cobertura de tinta, Geist Mono 500 @ 16x32):');
console.log(items.filter((x) => x.c.charCodeAt(0) < 0x2500).map((x) => `${x.c}${(x.v * 100).toFixed(0)}`).join(' '));
const maxA = Math.max(...items.filter((x) => x.c.charCodeAt(0) < 0x2500).map((x) => x.v));
console.log('máx ASCII =', (maxA * 100).toFixed(1) + '%', ' | bloques: ░', (cov[[...CHARSET].indexOf('░')] * 100).toFixed(0), '▒', (cov[[...CHARSET].indexOf('▒')] * 100).toFixed(0), '▓', (cov[[...CHARSET].indexOf('▓')] * 100).toFixed(0), '█', (cov[[...CHARSET].indexOf('█')] * 100).toFixed(0));
function ramp(K, pool) { // para K objetivos equiespaciados en [0, max], elige el glifo más cercano (sin repetir)
  const max = Math.max(...pool.map((x) => x.v)), out = [], used = new Set();
  for (let k = 0; k < K; k++) { const target = (k / (K - 1)) * max; let best = null; for (const it of pool) if (!used.has(it.c) && (!best || Math.abs(it.v - target) < Math.abs(best.v - target))) best = it; used.add(best.c); out.push(best); }
  return out;
}
const pool = items.filter((x) => x.c.charCodeAt(0) < 0x2500);
for (const K of [8, 10, 12]) { const r = ramp(K, pool); console.log(`rampa K=${K}: "${r.map((x) => x.c).join('')}"  cobertura: ${r.map((x) => (x.v * 100).toFixed(0)).join(',')}`); }
// comparación con rampa clásica de Paul Bourke de 10 niveles
const classic = ' .:-=+*#%@'.split('').map((c) => ({ c, v: cov[[...CHARSET].indexOf(c)] }));
console.log('clásica " .:-=+*#%@": ' + classic.map((x) => (x.v * 100).toFixed(0)).join(','));
// error de linealidad (RMS) de cada rampa respecto a pasos iguales
const rms = (r) => { const m = Math.max(...r.map((x) => x.v)); return Math.sqrt(r.reduce((s, x, k) => s + (x.v / m - k / (r.length - 1)) ** 2, 0) / r.length); };
console.log('RMS linealidad: clásica =', rms(classic).toFixed(3), ' medida K=10 =', rms(ramp(10, pool)).toFixed(3));
console.log('--- rampas curadas (solo símbolos, sin letras raras) ---');
for (const r of [' .:~=*xX#%@', ' .:-~=*xX#%@', ' .:~+*xX#%@', ' .:=*xX#%@', ' .,:~=*xX#%@$', ' .:~=+*xXH#%@']) {
  const it = r.split('').map((c) => ({ c, v: cov[[...CHARSET].indexOf(c)] }));
  const mono = it.every((x, k) => k === 0 || x.v >= it[k - 1].v - 1e-9);
  console.log(`"${r}" n=${r.length} monótona=${mono} RMS=${rms(it).toFixed(3)} cobertura=${it.map((x) => (x.v * 100).toFixed(0)).join(',')}`);
}
```

### B.20e · `sizes.mjs`

```js
import { createRequire } from 'node:module';
import zlib from 'node:zlib';
import fs from 'node:fs';
const require = createRequire('C:/Users/PC/dev/gaya-web/package.json');
const esbuild = require('esbuild');
fs.mkdirSync('dist/min', { recursive: true });
fs.writeFileSync('dist/min/core.mjs', "export { mountStage } from '../../engine/stage.mjs'; export { Grid } from '../../engine/grid.mjs';");
const one = async (entry, external = []) => {
  const r = await esbuild.build({ entryPoints: [entry], bundle: true, minify: true, format: 'esm', write: false, target: 'es2020', external, legalComments: 'none' });
  const code = r.outputFiles[0].contents;
  return { raw: code.length, gz: zlib.gzipSync(code, { level: 9 }).length, br: zlib.brotliCompressSync(code).length };
};
const rows = [];
rows.push(['núcleo (Grid+primitivas+atlas+GL+Canvas2D+stage+util+ruido azul en runtime)', await one('dist/min/core.mjs')]);
for (const id of ['web', 'mkt', 'it', 'ai', 'sd']) rows.push([`escena ${id} (sin motor)`, await one(`scenes/${id}.mjs`, ['../engine/*', './common.mjs'])]);
rows.push(['common.mjs (paleta animada, cielo, caché)', await one('scenes/common.mjs', ['../engine/*'])]);
rows.push(['TODO junto (núcleo + 5 escenas)', await one('engine/index.mjs')]);
for (const [n, s] of rows) console.log(n.padEnd(78), `${(s.raw / 1024).toFixed(1)} KB min | ${(s.gz / 1024).toFixed(1)} KB gz | ${(s.br / 1024).toFixed(1)} KB br`);
```

