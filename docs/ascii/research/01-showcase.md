# 01 · Showcase: sitios reales con estética ASCII / modo texto

Fecha: 2026-09-30 · Proyecto: `gaya-web` (Astro 7 estático) · Tema: los mejores ejemplos reales de web hechas con ASCII, modo texto, TUI, glifos y cajas; qué los hace **arte** y no *gimmick*, cómo resuelven legibilidad, móvil, color, tipografía, movimiento, scroll y navegación, y qué se puede robar (como idea) para un sitio de servicios que debe convertir a WhatsApp.

Convención de fiabilidad (la misma del informe 06): **[V]** abierto y leído en la fuente primaria en esta sesión (navegador real, HTML/JS descargado o página leída) · **[S]** dato de un resumen, ficha de galería o buscador (fuente primaria no abierta) · **[M]** medido por mí ahora (Lighthouse, microbenchmark, `fontTools`, `curl`, scripts en Node) · **[C]** criterio propio, razonado y no verificado en fuente.

---

## 0. Resumen ejecutivo

1. **Ningún sitio «todo ASCII y todo contenido» gana como arte. Los que sí lo son hacen lo mismo**: el ASCII es la *materia* de **una** superficie dominante (un campo, un emblema, un logo), casi siempre **atenuado**, con **tipografía sólida real encima** (Unseen, Dragonfly, bierman.io), o el sitio entero es texto pero con un **concepto** que lo justifica (Aino: «texto como medio»; Year of the Horse: Muybridge). Donde hay información que convertir (servicios, precios, contacto) se usa **sintaxis de texto sobria** (corchetes, filas con regla, tablas mono), no arte. [V][C]
2. **Rendimiento: de los 7 sitios con arte ASCII animado que medí, ninguno cumple a la vez LCP < 2,5 s y Lighthouse móvil ≥ 90** (los mejores: Aino 85 / 4,2 s y Ghostty 81 / 3,9 s; los peores: Dragonfly 37 / 15,7 s, eloyb.design 37 / 17,0 s, Unseen 56 / 8,2 s con 130 MB de vídeo). El único ≥ 90 (joemihavel.com, 97) **no tiene arte ASCII animado**, solo sintaxis de corchetes. [M] → **Cumplir el presupuesto de Gaya ya es ganar a todos los referentes.** La receta: póster ASCII generado **en el build** como texto del HTML (LCP inmediato, sin JS), motor vivo después.
3. **Accesibilidad: nadie lo resuelve bien.** Aino vuelca ~4 000 caracteres de ruido en el DOM sin `aria-hidden` y su navegación se **mezcla con el arte** («ABOUT9APLAY…»); Ghostty sí marca el arte `aria-hidden="true"`. WCAG trata el ASCII como **contenido no textual** (fallo F72 sin alternativa) y el criterio 2.2.2 exige pausa si algo se mueve solo más de 5 s. [V]
4. **Móvil: dos de los sitios más admirados ponen una puerta** («tap to enter» en bierman.io, «tap to continue» en Aino). Para un negocio que convierte por WhatsApp desde el enlace de Instagram, es la peor decisión posible. [V]
5. **Hechos verificados en este repo que cambian el diseño** [M]: (a) Geist Mono solo trae cajas y bloques (`U+2500–259F`) en el subset `symbols2` (5,7 KB) y `astro.config.mjs` carga solo `latin`; (b) faltan `← → ■ □ ● ○ ◆ ◇` y todo el braille: caen a una fuente del sistema con otro ancho; (c) la rampa folclórica ` .:-=+*#%@` **nunca supera 26 % de tinta** (medido con las curvas de la fuente), por eso los campos ASCII se ven lavados: hay que añadir `▒▓█`; (d) con los tokens Cobalto, el texto `--ink` solo mantiene ≥ 4,5:1 sobre un glifo de luminosidad OKLCH **L ≤ 0,50** (5,49:1), y `--muted` sobre L ≤ 0,40 (4,61:1); el tono eléctrico `--glow-2` (L 0,66) da 2,82:1 con `--ink`: **no puede haber texto encima**.
6. **Concepto propuesto para Gaya** [C]: «**el agua hecha del nombre**». El campo Marea Cobalto (filamentos de luz, como el shader actual) usa como alfabeto las letras de la marca (`y a A G`) más puntuación fina y bloques solo en los puntos calientes. Unseen hace exactamente esto con «UNSEEN» y es lo que separa su campo de una textura genérica. Código completo y probado en §5.4.
7. Al final (§8) hay **34 decisiones cerradas**. Las más importantes: póster SSR como LCP; ASCII decorativo `aria-hidden`; contenido siempre HTML real; dos voces tipográficas (Bricolage para titulares, Geist Mono para todo lo ASCII/UI); `symbols2` obligatorio; UI de texto con corchetes y filas con regla; WhatsApp en las cuatro esquinas fijas / barra inferior; cero puertas, cero loaders, cero terceros.

---

## 1. Cómo se investigó y qué tan firme es cada dato

Herramientas: búsqueda web, lectura de páginas, **navegador real** (DOM, fuentes, canvas, capturas de escritorio y móvil 375 px), descarga del HTML/JS de varios sitios, **Lighthouse 13.5** (perfil móvil por defecto: 4× de CPU, 4G lenta, una sola pasada por sitio, ejecutado desde este PC), `fontTools` sobre los `.woff2` que ya están en `node_modules/@fontsource-variable`, y microbenchmarks propios. Todo lo demás está citado.

| Fuente | Estado |
|---|---|
| ghostty.org, aino.agency, 2025.unseen.co, dragonfly.com, bierman.io, eloyb.design, lunar-horse.webflow.io, aviusrecordings.webflow.io, joemihavel.com, kostyafarber.com, reline.ch (+ aniso1208.vercel.app), nextjs-ascii-hero.vercel.app | Abiertos en navegador real, con DOM inspeccionado [V]; 10 con Lighthouse [M] |
| Casos de estudio Awwwards (Dragonfly/Studio Freight, Orage), fichas Awwwards (Aino, Unseen, Kostya, eloyb, ASCII Street View, Evervault, Reline, More Than Equal, ML Fairness) | Leídos [V] (las fichas describen; no prueban el rendimiento) |
| Codrops (*shape-aware ASCII*, *Efecto*, *OGL*) | `WebFetch` directo dio **403**; leídos a través del proxy de lectura `r.jina.ai` [V]. Sin licencia explícita para el código de demo: **no se copia código, solo ideas** |
| Alex Harri «ASCII characters are not pixels» | Leído completo [V] |
| Evervault, Tempo, pen.dev, hyve.systems, Grid Health, Avita, Orage (tienda) | Abiertos: **la portada actual no usa arte ASCII** (falsos positivos de listas «ascii»); se descartan como referencia, se anotan en §2.19 |
| ASCII Street View (Teehan+Lax, 2012) | Solo ficha Awwwards [S] |

Límites honestos: una pasada de Lighthouse por sitio (varianza real de ±5–8 puntos); microbenchmark en escritorio de 12 hilos (se usa solo para **ratios**; el proxy móvil es el 4× de Lighthouse); no se probó en un Android físico.

---

## 2. Hallazgos por sitio

### 2.1 Ghostty · https://ghostty.org/ [V][M]
- **Qué es:** portada de un emulador de terminal. Un fantasma («Ghostty») en ASCII, animado a ~24 fps, dentro de una ventana de terminal.
- **Por qué es arte (y no *gimmick*):** el ASCII **es el producto**: un terminal enseñando su mascota en texto. Cero disonancia entre forma y mensaje. Dos tonos (gris del cuerpo, azul del contorno) y un solo movimiento.
- **Cómo está hecho (medido):** DOM puro. `<code>` con **41 filas × ~140 columnas** (5 750 caracteres por cuadro), **JetBrains Mono a 6 px**, cada fila un `<div>`; unos ~2 200 mutaciones `childList` por segundo (reescribe fila a fila); el azul del contorno son ~72 `<span class="b">`. Contenedor `aria-hidden="true"` [V]. Los **235 cuadros** (`home/animation_frames/frame_001…235`) viajan **dentro del HTML**: 1 927 893 B sin comprimir, **119 934 B gzip, 89 244 B brotli** (≈ 380 B por cuadro con brotli) [M].
- **Legibilidad:** el arte vive en una caja y el contenido (frase, «Download», «Documentation») debajo, en tipografía sólida. Nunca compiten.
- **Móvil (375 px):** la ventana escala (fuente diminuta), las dos CTA quedan bajo el arte. Sin puerta. [V]
- **Medido:** Lighthouse móvil **81**, LCP **3,9 s** (el elemento es un `<p>`: el HTML de 1,9 MB y una fuente de 285 KB retrasan el render), TBT 113 ms, CLS 0, a11y 95. [M]
- **Robar:** (1) arte ASCII en **una** caja con el contenido fuera; (2) arte `aria-hidden`; (3) filas como unidad de actualización; (4) dos tonos por filas/spans, no por carácter.
- **Evitar:** el disfraz (los tres puntos de ventana de macOS, el marco de terminal) y **frames dentro del HTML**: una versión procedural o con delta cuesta ~0 KB.

### 2.2 Aino · https://aino.agency/ · Awwwards SOTD 20-may-2026, 7,24/10 [V][M]
- **Qué es:** agencia escandinava de comercio electrónico. La ficha dice que reconstruyeron el sitio «para explorar qué se puede hacer con texto como medio»: ASCII, física 2D, transformación en tiempo real, en ~30 KB de JS. [V]
- **Por qué es arte:** la portada es **una sola forma matemática** hecha de la rampa `ONNA98643I?!<>/=+:-.` que **se transforma con el scroll** (reloj de arena → triángulo → rombo). Forma, ritmo y restricción son el mensaje: «somos técnicos y precisos». Dos colores (`#f5f5f0`, `#181818`).
- **Cómo está hecho (medido):** ASCII **en el DOM como texto** (texto directo dentro de `<main>`, ~4 000 caracteres, 25 líneas, tipografía monoespaciada propia), sin contenedor `aria-hidden`; el JS total transferido es **≈ 43 KB** (Resource Timing) [M].
- **Ajustes visibles:** el botón `SETTINGS` abre un panel con **MOOD** (DARK/LIGHT) e **IMG** (IMAGE / TEXT / PIXEL): el visitante elige **cómo se dibujan las imágenes de los proyectos**, incluida «como texto». Solo radios con etiqueta, cero instrucciones. [V]
- **Navegación:** los enlaces (`WORK`, `SERVICES`, `ABOUT`, `PLAY`, `SETTINGS`, `CONTACT`) están **dentro de la misma cuadrícula** que el arte; al pasar el arte por debajo, los textos se pegan («SERVICES480NNNN084I!>»). Es bonito y **es un fallo de legibilidad**. Los proyectos son una lista con códigos («A002 SANDISK», «a001 nudie jeans»).
- **Móvil:** aparece una pantalla «**TAP TO CONTINUE**» sobre un rombo ASCII más estrecho; el arte se reconfigura a ~60 columnas. [V]
- **Medido:** Lighthouse móvil **85**, LCP **4,2 s**, TBT 0, CLS 0, a11y 100 (Lighthouse no puntúa el ruido del arte), 3,4 MB totales (una imagen de 2,2 MB). [M]
- **Robar:** (1) **transformación por scroll de una sola forma** (SDF entre formas-llave, §5.7); (2) restricción de presupuesto como estética; (3) **conmutador de «cómo se dibuja»** para la galería de referencias; (4) códigos tipo catálogo para listas reales.
- **Evitar:** ASCII sin `aria-hidden`; navegación *dentro* del arte; la puerta móvil.

### 2.3 Unseen Studio 2025 Wrapped · https://2025.unseen.co/ · SOTD 24-mar-2026, 7,44/10 (fecha y nota: buscador [S]) [V][M]
- **Qué es:** resumen anual de un estudio de marca, movimiento y digital, en horizontal; dos colores (`#010101` y oro `#E4B504`). [V]
- **Por qué es arte:** un **campo ASCII oscuro y casi apagado** (WebGL, simulación líquida) sobre el que aparece una palabra gigante condensada en oro. Mirando de cerca, el alfabeto del campo son **las letras del nombre** (`U N S E`, incluso se lee «UNSEEN» en una fila, más `C`, `2` y puntuación fina `- + · '`): el estudio *se hace a sí mismo con su nombre*. El contraste (campo gris muy bajo vs. palabra saturada) es lo que hace que la palabra se lea de un vistazo.
- **Tipografía:** condensada gruesa (Bootzy Condensed) para el titular, **DM Mono** para todo lo funcional, Neue Montreal y una serif de acento. La UI es **sintaxis de corchetes**: `[U_S_25]`, `[X] [IG] [LI]`, `[START A PROJECT WITH US]`, `[SCROLL]`, `Open [+]`, etiquetas `[MOTION] [JAN_25]`. [V]
- **Estructura DOM:** `h1` reales («Year In Review»), la palabra «TWENTY» partida en letras sueltas para el texto vertical; texto real, arte en canvas (1 canvas). [V]
- **Móvil:** «TWENTY TWENTY FIVE» apilado en dorado sobre el campo tenue; los corchetes se mantienen; funciona. [V]
- **Medido:** Lighthouse móvil **56**, a11y **84**, LCP **8,2 s**, TBT 397 ms, **≈ 130 MB** de transferencia (clips `.mp4` de 7–10 MB cada uno). [M]
- **Robar:** (1) campo **atenuado** + palabra sólida saturada; (2) **alfabeto = nombre de la marca**; (3) corchetes como sintaxis universal de etiqueta/CTA; (4) dos colores.
- **Evitar:** vídeo pesado, horizontal-scroll (rompe teclado y lectores), cualquier cosa que coloque la carga por encima del contenido.

### 2.4 Dragonfly + Aniso (Studio Freight) · https://dragonfly.com/ · https://www.awwwards.com/case-study-dragonfly-by-studio-freight.html [V][M]
- **Qué es:** fondo de capital de riesgo (antes dragonfly.xyz). Una libélula ASCII, tenue, detrás de un **wordmark gigante naranja** («DRAGONFLY», grotesca de ancho completo) sobre negro; una D, una F (espejada), una L y una Y en las **cuatro esquinas** del viewport y un menú compacto (`>|<`, `MENU`). Tipografías NON Natural Grotesk y NON Natural Mono. [V]
- **Cómo se hizo (caso de estudio):** el equipo construyó **Aniso** (MIT, ver 2.5): generador en WebGL con tres pasadas (pixelar → escala de grises → mapear a caracteres) que acepta `.glb`, `.jpg` y `.mp4`. Reto: **varios canvas** hundían el rendimiento; solución: **un solo canvas** para toda la página, cada sección renderiza su textura **solo cuando es visible**, post-proceso propio y `tunnel-rat` para desarrollar por componentes. Un huevo de pascua permite arrastrar cualquier imagen al fondo y procesarla. [V]
- **Medido:** Lighthouse móvil **37**, LCP **15,7 s**, TBT 1 363 ms (tres modelos `.glb` de 350–470 KB + analítica). [M]
- **Robar:** (1) **un canvas, muchas secciones, render solo si visible**; (2) las **cuatro esquinas** como marco de UI (para Gaya: marca, menú, idioma, WhatsApp); (3) wordmark sólido y enorme sobre arte tenue.
- **Evitar:** modelos 3D para conseguir ASCII (un campo procedural cuesta 0 KB).

### 2.5 Reline (+ Aniso como iframe) · https://www.reline.ch/ · https://aniso1208.vercel.app/ · https://github.com/darkroomengineering/aniso [V]
- **Qué es:** estudio Webflow de Zúrich. Casi todo el sitio es limpio (Aeonik, blanco, negro); **el ASCII es un solo acento**: el bloque final «Let's collaborate!», un `<iframe>` a una app de Aniso en Vercel con un remolino hecho con muy pocos glifos (`0 R Y f / - .`), monocromo, blanco sobre violeta. [V]
- **Lección:** un **alfabeto de ~7 glifos** en **un solo tono** sobre un fondo saturado es más potente que una rampa de 70. Y usar ASCII como **cierre de conversión** (junto al CTA «Buche ein Gespräch», «reserva una llamada») es una idea reutilizable.
- **Aniso** es MIT, Next.js + WebGL, con «granularidad», **límite de caracteres**, selector manual de glifos y color sobrepuesto. [V]
- **Evitar:** el **iframe de terceros** (imposible con la CSP de Gaya).

### 2.6 bierman.io · https://bierman.io/ [V][M]
- **Qué es:** portafolio de un ingeniero front-end. Titular «matt / bierman» de **180 px** (Nohemi, negro pesadísimo) en dos esquinas, y **debajo** un logo 3D girando renderizado como ASCII (una «m» de `& @ : -`) sobre una trama de puntos. Mono: Source Code Pro. [V]
- **Cómo está hecho (código leído):** `three` + `AsciiEffect` (MIT, adaptado de jsascii): renderiza la escena, **lee los píxeles**, calcula brillo (`0,3R+0,59G+0,11B`), lo mapea a ` .:-=+*#%@` y **reescribe el `innerHTML` de una tabla de una celda** (`display:block; overflow:hidden`) cada cuadro; fuente de **11,1 px** y `letter-spacing -0.6px`. Capa `position: fixed`. [V]
- **Peso (medido):** `three.module.min.js` **708 KB descomprimidos (169 KB transferidos según Lighthouse)**, `GLTFLoader` 50 KB, `logo.glb` 204 KB, `script.js` 58 KB → **≈ 1 MB de código y modelo por analizar solo para el héroe**, ≈ 0,4 MB en red. **Pantalla de carga con porcentaje** («0 %») que bloquea la portada y, en móvil, «**tap to enter**». [M]
- **Medido:** Lighthouse móvil **69**, LCP **7,2 s** (el elemento LCP **es la celda ASCII**: 3,6 s de retraso de render hasta que carga el modelo), TBT 154 ms. [M]
- **Robar:** el **contraste de escala** (titular de 180 px sólido + trama ASCII detrás) es puro efecto; la idea de una **capa fija** que el scroll deja atrás.
- **Evitar:** three.js para un logo, loader con %, puerta móvil y la **trama de puntos** uniforme (choca con la regla «sin fondos de puntos» de PRODUCT.md).

### 2.7 eloyb.design · https://www.eloyb.design/ · Awwwards Honorable Mention 4-jul-2025 [V][M]
- **Qué es:** portafolio «glitch/brutalista/maximalista» (Webflow + GSAP). Verde lima `#D8FB81` sobre carbón `#2B2C27`. Titular enorme en grotesca **con eco** (cada línea duplicada y recortada) sobre **medios tonos 1-bit** (imágenes tramadas). [V]
- **Modo texto real:** **toda la interfaz de metadatos** está en la fuente de píxeles **Px437 PhoenixVGA 8×16** (IBM VGA), `line-height 16 px`, con **bloques `▒▒▒▒` como marcadores** que se resuelven en texto (visibles mientras carga); «COPY EMAIL» flanqueado de relleno `##########`; datos como `function() randomfacts array: [maximalist, little monster…]`, coordenadas y zona horaria. [V]
- **Lección:** la fuente bitmap funciona **solo para microtipografía** y la grotesca hace el titular: dos voces. El *placeholder* `▒` que se «decodifica» es un buen patrón de entrada si el texto real ya está en el DOM.
- **Medido:** Lighthouse móvil **37**, a11y 80, LCP **17,0 s**, 3,9 MB, y peticiones a GTM, jsDelivr, unpkg y CloudFront. [M]
- **Licencia:** la familia Px437 del *Ultimate Oldschool PC Font Pack* es **CC BY-SA 4.0** (compartir igual sobre derivados). [V]
- **Robar:** los `▒` como marcadores de estado/carga y la barra `####` en un botón de copiar.
- **Evitar:** fuente bitmap en un sitio de servicios (disfraz retro), y todos los terceros.

### 2.8 Year of the Horse (Rigo Cruz) · https://lunar-horse.webflow.io/ [V][M]
- **Qué es:** exploración generativa. Un **caballo galopando** dibujado con caracteres en un canvas (735×333), con un contador «Next Cycle · 128d 11h 49m» y la frase «Cycles measured in time, reconstructed through motion». Inspirado en los estudios de **Muybridge**. Neue Haas Grotesk sobre gris cálido, una sola tinta. [V]
- **Por qué es arte:** el **concepto** (el ciclo del calendario lunar reconstruido con el movimiento fotográfico más famoso de la historia) decide la forma. Mucho aire; el ASCII ocupa el centro y **la UI casi no existe**.
- **Medido:** Lighthouse móvil **69**, LCP **8,6 s**, TBT 30 ms (usa Google Fonts, cdnjs y jsDelivr). [M]
- **Robar:** el criterio de **«movimiento con razón»**: cada animación ASCII de Gaya debe *ilustrar un proceso real* (un paquete que viaja por una red, un formulario que se completa), no decorar.

### 2.9 Avius Recordings · https://aviusrecordings.webflow.io/ [V][M]
- **Qué es:** estudio de grabación. **No hay arte ASCII**, hay **layout de modo texto**: tres columnas con reglas de 1 px («about / ethos / studio hours»), todo en **Suisse Intl Mono**, minúsculas, servicios como lista con abreviaturas (`(p) - production`, `(mi) - mixing`, `(ma) - mastering`…), horarios en tabla, obras como filas (título, siglas, artista, duración). Negro sobre blanco (captura de escritorio). [V]
- **Por qué importa:** es exactamente la **forma de un ledger de servicios**: escaneable, sin tarjetas iguales, sin iconos, con bordes CSS (no glifos de caja).
- **Medido:** a11y 100 pero Lighthouse móvil **56** por TBT de **5,3 s** (reproductor de audio y scripts de Webflow), LCP 2,7 s. [M]
- **Robar:** la **tabla de columnas con reglas** y las **filas** como estructura de «Servicios».

### 2.10 Joel Mihavel · https://joemihavel.com/ [V][M]
- **Qué es:** portafolio de un diseñador de producto. **Sintaxis de corchetes** en el encabezado: `[ JOEL MIHAVEL ]`, `[ Bangalore ] 09:36 AM ☁ 23°C`, `[ HOME ] WORK PLAY`, conmutadores de tema con símbolos. Geist Variable + Averia Serif Libre; blanco. [V]
- **Medido:** Lighthouse móvil **97**, LCP 2,5 s, TBT 9 ms, a11y 92: el **único ≥ 90** del grupo. Consulta `api.open-meteo.com` (tercero) y usa Cloudflare Insights. [M]
- **Robar:** los **corchetes** como sistema de etiquetas y el **microdato vivo local** (hora de la ciudad). Para Gaya, hora de Santo Domingo con `Intl` **sin API** (§7).
- **Evitar:** el clima por API externa.

### 2.11 Kostya Farber · https://www.kostyafarber.com/ · Honorable Mention 7-may-2024 [V]
- **Qué es:** portafolio de ingeniero y diseñador, «inspirado en la forma limpia y funcional de UNIX». Negro + **azul eléctrico `#4c60e6`** (la ficha Awwwards); Söhne, Founders Grotesk, JetBrains Mono. [V]
- **Movimiento:** un **orbe ASCII** sombreado hace de precarga y, al terminar, la pantalla se disuelve en un **tablero de bloques grandes** blancos y negros (transición). Página 404 surrealista. [V]
- **Robar:** azul eléctrico sobre negro **sí funciona** en ASCII (es nuestra paleta); la **transición por bloques** como puente entre páginas.
- **Evitar:** banner de cookies (CookieYes) que tapa el arte, y GTM.

### 2.12 Orage (caso de estudio) · https://www.awwwards.com/case-study-orage.html [V]
- **Qué es:** estudio de VFX y 3D; lenguaje visual «inspirado en visualización de datos, terminales retro y lógica de sistema». Malla WebGL modular donde «las celdas parpadean como paquetes de datos», **carga que simula un arranque de sistema**, **vista de lista tipo terminal** (filas compactas, texto mono) junto a una rejilla visual, menú arrastrable. Stack: WordPress, GSAP, Taxi.js, Lenis, Three.js. Awwwards SOTD 7,42/10 (nota: buscador [S]).
- **Lección:** **dos modos de explorar el mismo contenido** (visual y analítico/lista). Es la misma idea que el conmutador IMG de Aino.
- **Ojo:** el dominio `oragestudio.com` que aparece en buscadores es una **tienda de ropa polaca**; el estudio no se pudo abrir en vivo. Solo el caso de estudio, [S] para el resto.

### 2.13 Alex Harri, «ASCII characters are not pixels» · https://alexharri.com/blog/ascii-rendering [V][M]
- **Es la mejor fuente técnica** (enero 2026): el problema de los renderizadores por luminancia es que **tratan cada celda como un píxel** y ignoran la **forma** del glifo, de ahí los bordes borrosos y dentados.
- **Método:** para cada glifo, un **vector de forma de 6 dimensiones** (seis círculos de muestreo escalonados en una rejilla 2×3, cuánto de cada círculo cubre el glifo, normalizado); para cada celda de la imagen se toman las mismas seis muestras y se busca el **glifo más cercano** entre los 95 imprimibles. Después, **realce de contraste**: global (exponente ~1,4 sobre el vector normalizado) y **direccional** (nueve círculos externos que miran a las celdas vecinas para «escalonar» los bordes).
- **Números:** 95 glifos; 13 000 búsquedas ≈ 14 ms en fuerza bruta vs 0,5 ms con **k-d tree**; **caché por cuantización a 5 bits** (del orden de millones de entradas y varios MB; las cifras del texto no son consistentes entre secciones); en GPU, 6 pasadas; rejillas de 80×40 a 90×50 celdas; funciona en móvil.
- **Lección para Gaya:** para **arte estático horneado en el build** (emblemas de servicio, miniaturas de referencias) la búsqueda por forma es gratis y **da bordes limpios**; para el campo animado, la rampa por densidad basta.
- **Medido:** la página (con demos) obtiene Lighthouse móvil 44, LCP 6,4 s: es un artículo, no un modelo de despliegue. [M]

### 2.14 Codrops 2024–2026: *shape-aware*, *Efecto*, *OGL* [V vía proxy]
- **«Beyond the Luminance Ramp» (4-sep-2026):** shape vector de 6 valores, muestreo asimétrico, **diez tomas externas** para contraste direccional, atlas de glifos **rasterizado en runtime desde la fuente resuelta de la página**, tres pasadas (escena, celdas, post) con el **objetivo de celdas dimensionado en celdas, no en píxeles** (un fragmento por carácter), **tope de ~4 600 celdas** (si se supera, las celdas crecen), `IntersectionObserver` para parar, **tope de 60 fps con 8 ms de holgura**, *reduced motion* que apaga la animación de reposo y conserva el arrastre, color de tinta leído del CSS mediante un canvas de 1 px, trampas: *mip seams* del atlas (se resuelven con `textureGrad`), normalización global que colapsa el vocabulario, geometría plana que no da tono. Sin licencia explícita: **solo ideas**.
- **Efecto «Efecto» (ene-2026):** ASCII generado **proceduralmente en GLSL** en cuadrículas 5×7 («los *shaders* no pueden usar fuentes, así que los caracteres se dibujan como matemática»), 8 estilos, 31 paletas y dithering; advierte que los shaders multipasada **bajan mucho los fps en hardware viejo**.
- **«Creating an ASCII Shader Using OGL» (nov-2024):** glifos como **enteros con el bitmap** de una rejilla 4×5, `mod(pix/8, 2)` para teselar; atribuido a un shader de ShaderToy. Es la técnica más barata: **cero texturas, cero fuentes**.

### 2.15 WebGL ASCII Hero (plantilla) · https://nextjs-ascii-hero.vercel.app/ · https://github.com/egorshest/webgl-ascii-hero (MIT) [V]
- Next.js + React Three Fiber + `postprocessing`, un GLTF post-procesado con GLSL; parámetros `cellSize` (9), `invert`, `color`, `characterSet`, `volumeShading`, `tintColor`, CRT y viñeta. Fuentes Geist/Geist Mono/JetBrains Mono. Es el **patrón de manual** («hero + 3D + scanlines»): útil como contraejemplo del disfraz CRT.

### 2.16 Evervault · https://evervault.com/ [S][V]
- La ficha Awwwards documenta una «animación ASCII 3D» (Three.js + R3F). **La portada actual ya no la usa** (hero con tipografía y botones; banner de cookies). Lección: los grandes productos usan ASCII en **campañas y piezas concretas**, no como el sistema de la marca.

### 2.17 Canon y herramientas
- **textmode.js** (MIT, `humanbydefinition`): WebGL2, instanciado, atlas dinámico de glifos desde fuentes, capas con modos de mezcla, exporta TXT/SVG/GIF/vídeo. Referencia arquitectónica del render por atlas + instancias. https://github.com/humanbydefinition/textmode.js · https://code.textmode.art/ [V]
- **16colo.rs**: archivo de ANSI/ASCII de 1990 en adelante; muestra las obras como **renders PNG**, fondo oscuro, tipografía mono, cuadrícula, decoración mínima. Lección de canon: el arte ANSI clásico se **presenta como imagen** para que sea universal; sirve de precedente para hornear el arte estático. https://16colo.rs/ [V]
- **three.js `AsciiEffect`** (MIT, jsascii): la base de bierman.io; **caro por diseño** (lectura de píxeles + `innerHTML` de la tabla entera cada cuadro; el color con `<span>` por carácter cuesta más). [V]
- **pierce.dev**: pipeline de vídeo a ASCII con `ffmpeg` + ImageMagick: cuadros a 24 fps; **corrección de aspecto** (un carácter de terminal es ~0,44 de ancho/alto); luminancia **CIE 1931**; filtros de color por distancia Manhattan; diez niveles de glifo. https://pierce.dev/notes/making-an-ascii-animation [V]
- **seangeng.com «ASCII text from WebGL»**: WebGL → canvas del tamaño de la rejilla (un píxel por carácter) → lectura → cadena en un `<pre>` con `mix-blend-mode: difference`; efecto de color con `hue-rotate` en el contenedor (coste cero por carácter). https://seangeng.com/writing/ascii-text-from-webgl [V]
- **Show HN «Detailed ASCII Web Animations»** (2021): animación de 300 caracteres de ancho = **2,1 MB de JSON**; su autor admite que solo formas simples serían pequeñas. [V]

### 2.18 Contraejemplos que confirman la tesis: Charm y Ratatui [V]
- **charm.land** («We make the command line glamorous»): mascotas ilustradas, texto de marca cálido, nada de ASCII más allá de una broma de `/dev/null` en el pie.
- **ratatui.rs**: una biblioteca de **TUI** cuya portada **rechaza** la estética TUI/ASCII a favor de un diseño web moderno.
- **Lectura:** las marcas cuyo producto *es* el terminal tampoco hacen la web entera en texto; el texto es el **acento**. Para un sitio de servicios que convierte, el «todo ASCII» debe ser **materia + estructura**, no ausencia de diseño.

### 2.19 Falsos positivos (aparecen como «ASCII» y no lo son hoy)
pen.dev (ya no), tempo.xyz (hilos elípticos, no texto), hyve.systems (loader con `0 %`, corchetes decorativos), gridhealth.io (Fragment Mono en etiquetas), avita.pm (sin ASCII en la portada). Se anotan para no perder tiempo. El artículo de un jurado sobre los mejores sitios de 2026 (https://www.hontran.dev/blog/best-award-winning-websites-2026 [V]) **no incluye ningún sitio ASCII** y subraya que la belleza debe sostenerse **a 60 fps en móviles medios con redes limitadas**; aun así Awwwards premió a Aino y a Unseen (ambos ASCII) en 2026, así que el género se reconoce cuando hay concepto y ejecución.

---

## 3. Tabla comparativa (medida)

Lighthouse 13.5.0, perfil móvil por defecto (4× CPU, 4G lenta), una pasada por URL, 30-sep-2026. [M]

| Sitio | Motor del arte | Perf | LCP | TBT | Peso | a11y | ¿Puerta o loader? |
|---|---|---:|---:|---:|---:|---:|---|
| joemihavel.com | sin arte animado (corchetes) | **97** | 2,5 s | 9 ms | 1,2 MB | 92 | no |
| aino.agency | DOM de texto, JS propio ≈ 43 KB | 85 | 4,2 s | 0 | 3,4 MB | 100 | «tap to continue» (móvil) |
| ghostty.org | DOM por filas, 235 cuadros inline | 81 | 3,9 s | 113 | 0,6 MB | 95 | no |
| lunar-horse.webflow.io | canvas 2D + GSAP | 69 | 8,6 s | 30 | 1,2 MB | 92 | no |
| bierman.io | three + `AsciiEffect` | 69 | 7,2 s | 154 | 1,4 MB | 100 | loader % + «tap to enter» |
| aviusrecordings.webflow.io | (layout de texto, sin arte) | 56 | 2,7 s | 5 281 ms | 2,7 MB | 100 | no |
| 2025.unseen.co | WebGL + vídeos | 56 | 8,2 s | 397 | **130 MB** | 84 | no |
| alexharri.com (artículo) | demos WebGL | 44 | 6,4 s | 1 152 | 4,0 MB | 78 | no |
| dragonfly.com | WebGL + 3 `.glb` | 37 | 15,7 s | 1 363 | 2,9 MB | 93 | no |
| eloyb.design | Webflow + GSAP + bitmap | 37 | 17,0 s | 908 | 3,9 MB | 80 | loader |

**Lectura:** el arte ASCII se paga casi siempre con **retraso de render del LCP** (el arte o la imagen que lo alimenta es el elemento más grande y no aparece hasta que JS y modelos terminan). Ghostty acorta ese retraso (texto en el HTML) pero paga 1,9 MB de HTML. **Un póster de texto en el HTML de 1–2 KB comprimidos** evita las dos cosas (§5.8).

---

## 4. Patrones ganadores y antipatrones

### Patrones ganadores (P) [C sobre evidencia V/M]
- **P1 · Una superficie, una voz.** Un campo/emblema ASCII dominante, no ASCII en todas partes. (Ghostty, Unseen, Dragonfly, Aino.)
- **P2 · Atenuado bajo lo sólido.** El ASCII de fondo es **gris bajo** y la palabra/titular encima es sólida y saturada (Unseen: campo casi apagado + oro; Dragonfly: libélula tenue + naranja).
- **P3 · Concepto que decide la forma** (arte vs *gimmick*): el producto *es* texto (Ghostty), el alfabeto *es* el nombre (Unseen), el movimiento *es* la historia (Muybridge), la forma *es* matemática que responde al scroll (Aino).
- **P4 · Dos voces tipográficas:** mono para ASCII/UI/datos + una grotesca enorme para el titular (Dragonfly NON Natural Mono/Grotesk; bierman Source Code Pro/Nohemi 180 px; Unseen DM Mono/Bootzy; eloyb VGA/grotesca).
- **P5 · Dos colores y un acento** (Unseen `#010101`+`#E4B504`; Aino `#f5f5f0`+`#181818`; eloyb `#D8FB81`+`#2B2C27`; Kostya negro+`#4c60e6`; Dragonfly negro+naranja).
- **P6 · Sintaxis de corchetes** para etiquetas y CTA (`[START A PROJECT WITH US]`, `[ HOME ]`, `Open [+]`).
- **P7 · Filas con regla / tabla mono** para información real (Avius, lista de Aino, vista de lista de Orage).
- **P8 · Lente conmutable** («IMAGE / TEXT / PIXEL» de Aino; rejilla vs lista de Orage): el mismo contenido en dos modos.
- **P9 · Un canvas, secciones que solo renderizan visibles** (Studio Freight/Dragonfly).
- **P10 · Restricción como estética** (30–43 KB de JS de Aino; 7 glifos de Aniso en Reline; 2 tonos de Ghostty).
- **P11 · ASCII como acento dentro de un sitio normal** (Reline, Evervault, Charm, Ratatui): la conversión no depende del arte.
- **P12 · Marco de esquinas fijas** (Dragonfly): brand/menú/idioma/CTA siempre en el mismo sitio.
- **P13 · Microdatos en mono** con sentido (hora local, coordenadas): dan textura de sistema sin inventar cifras.
- **P14 · Arte estático «como imagen» de calidad** (16colo.rs): el arte clásico se presenta renderizado; hornear en el build es legítimo y accesible.

### Antipatrones (A)
- **A1 · Puerta o loader** («0 %», «tap to enter», «tap to continue»): bierman.io, Aino, hyve.systems, eloyb.
- **A2 · ASCII en el DOM sin `aria-hidden`** (Aino): el lector de pantalla recita ~4 000 caracteres. F72 de WCAG.
- **A3 · Navegación dentro del arte** (Aino): la etiqueta se mezcla con los glifos vecinos y se pierde.
- **A4 · Cuadros dentro del HTML** (Ghostty: 1,93 MB, 235 cuadros): LCP 3,9 s pese a brotli de 89 KB.
- **A5 · Vídeo/3D para conseguir ASCII** (Unseen 130 MB, bierman: three + loaders + GLB ≈ 1 MB descomprimido, Dragonfly 3 GLB): LCP 7–17 s.
- **A6 · Terceros** (Reline: iframe Vercel; eloyb: GTM+jsDelivr+unpkg; Kostya y Evervault: banners de cookies; Joel: API de clima).
- **A7 · Disfraz**: ventana de macOS falsa, prompt, verde Matrix, CRT/scanlines de plantilla, cursor parpadeante decorativo. (Ghostty lo usa con humor porque es un terminal; a Gaya no le corresponde.)
- **A8 · Trama de puntos uniforme** como papel pintado (bierman): choca con la regla «sin fondos de puntos» del proyecto y no comunica.
- **A9 · Texto sobre arte sin control de contraste**, o párrafos largos en mono pequeño.
- **A10 · Ligaduras y *fallback* de fuente** rompiendo la rejilla (JetBrains Mono tiene `calt`; los subsets de Google Fonts/Fontsource **no traen cajas**).
- **A11 · Símbolos fuera de la fuente** (`■ ● → ◆`, emoji, braille) dentro de una rejilla: cambian de ancho por dispositivo.
- **A12 · Movimiento autónomo > 5 s sin pausa** (2.2.2).
- **A13 · Horizontal-scroll para contar una historia** (Unseen): rompe teclado, lectores y expectativas en móvil.
- **A14 · `readPixels` + `innerHTML` completo por cuadro** (`AsciiEffect`): caro; con color por `<span>`, peor.

---

## 5. Técnicas

Todas las funciones de esta sección son **código original** para Gaya, ejecutadas en Node 24 para comprobar que corren (`field.mjs`, `morph.mjs`, `pieces.mjs`); las cifras de coste son de escritorio y sirven como **ratio**, no como promesa móvil.

### 5.1 Elección del motor de dibujo [M]

Microbenchmark, 6 000 celdas (120×50), 240 iteraciones, mediana, **solo tiempo de JS** (sin la rasterización posterior), Chromium de escritorio de 12 hilos:

| Método | ms/cuadro |
|---|---:|
| Generar el campo como cadenas por fila (común a todos) | 0,3 |
| `pre.textContent = filas.join('\n')` (sin forzar layout) | 0,3 |
| Igual, **forzando layout** (`offsetHeight`) | 0,9 |
| Canvas 2D `fillText` **por fila** | 1,0 |
| Canvas 2D `fillText` **por carácter** | 4,3 |
| Canvas 2D `drawImage` desde **atlas**, por carácter | **9,3** |

Escalado (DOM con layout / canvas por fila): 3 200 celdas 0,5 / 0,6 ms · 6 000 → 1,0 / 1,2 · 11 200 → 1,9 / 2,2 · 24 000 → 3,1 / 3,6. Es **lineal, ~0,15–0,2 ms por cada mil celdas**.

Conclusiones [C]: (1) **el atlas con `drawImage` en Canvas 2D es lo peor** (una llamada por celda): solo tiene sentido con WebGL instanciado; (2) **una cadena por fila** (DOM o canvas) es lo más barato en 2D y está **muy por debajo del presupuesto** hasta ~10 mil celdas; (3) con el 4× de Lighthouse y la diferencia entre un núcleo de escritorio y uno de un Android modesto, **6 000 celdas ≈ 5–8 ms de JS**: entra en un cuadro de 33 ms; **24 000 ya no** (≈ 15–25 ms, más el pintado). Coherente con los *tiers* del informe 06 (9 000 / 6 500 / 4 200 / 2 400 celdas).
DOM vs canvas: el DOM da texto nítido a cualquier DPR y cero memoria de GPU; el canvas/WebGL da tono por celda y mezcla. Ghostty (41×140 = 5 750 celdas, DOM por filas, 24 fps) demuestra que el DOM basta para una pieza.

### 5.2 Rejilla y métrica de celda con Geist Mono [M]

Geist Mono: `unitsPerEm 1000`, **avance 600** en todas las letras, cajas y bloques; `ascent 1005`, `descent −295` (línea natural **1,3 em**); altura de mayúscula 710, de x 530. Los glifos de caja y bloque miden **de −345 a 965** (1,31 em): **conectan sin huecos con `line-height: normal` (1,3)** y solapan un poco con `line-height: 1`; los tonos `░▒▓` sobresalen del cuadro (`▓` va de −394 a 1041 en vertical y empieza en −54 en horizontal) y **manchan las filas y columnas vecinas** en interlineados apretados.

```css
/* Capa ASCII: siempre la misma receta */
.ascii {
  font-family: var(--font-mono);          /* Geist Mono Variable (latin + symbols2) */
  font-size: 10px;                        /* 10 → celda 6×13; 15 → 9×20 (redondear alto); 20 → 12×26 */
  line-height: 13px;                      /* entero: sin deriva de subpíxeles entre filas */
  letter-spacing: 0;
  font-weight: 450;
  font-variant-ligatures: none;           /* Geist trae solo ccmp/dnom/frac/locl/numr; JetBrains sí trae calt */
  font-kerning: none;
  font-synthesis: none;
  white-space: pre;
  user-select: none;
  pointer-events: none;
  contain: layout paint style;            /* aísla el reflujo de la capa */
  overflow: hidden;
}
```

```js
// Medición de la rejilla tras cargar la fuente (no antes: el ancho de reserva es otro)
await document.fonts.load('10px "Geist Mono Variable"', '·yaAG█');
const cv = new OffscreenCanvas(1, 1).getContext('2d');
cv.font = '10px "Geist Mono Variable"';
const cellW = cv.measureText('M').width;            // 6,0 con Geist Mono a 10 px
const cellH = 13;                                   // el mismo valor que line-height
const cols = Math.floor(box.width / cellW), rows = Math.floor(box.height / cellH);
```

Reglas: **tamaños de fuente múltiplos de 5 px** (10, 15, 20) para anchos de celda enteros; **nunca 12 px** (7,2 px por celda: el texto se «arrastra»); reservar la caja con `width: calc(cols * 1ch)` y `height: rows * 13px` + `overflow: hidden` para que **no haya CLS** si la fuente aún no llegó.

### 5.3 Alfabeto seguro y rampa de densidad medida [M]

**Cobertura real** (Geist Mono `latin` + `symbols2`, los que ya están en `node_modules`):

- Sí: ASCII imprimible completo; `· • … ↑ ↓ × « » ¿ ¡ ± ° §` (todo el Latin‑1 está en `latin`); **cajas `U+2500–257F` (128/128)**, **bloques `U+2580–259F` (32/32)**, sombras `░▒▓`, cuadrantes `▖▗▘▙▚▛▜▝▞▟`, `╱╲╳`.
- **No**: `← →`, `■ □ ▪ ▫ ◆ ◇ ○ ● ◦`, `∙ ∘`, **braille `U+2800–28FF`**, sextantes, emoji. Con esos, el navegador usa otra fuente: otro ancho, otra altura, otro peso.
- **JetBrains Mono y Martian Mono de Fontsource no traen ni cajas ni bloques** (sus subsets son latin/latin‑ext/cirílico/griego/vietnamita). El proyecto ya carga Geist Mono con `subsets: ['latin']`: hay que añadir **`symbols2`** (5,7 KB) o las cajas caerán a una fuente del sistema.
- Braille para «alta resolución 2×4»: el patrón es real (Efecto, rustille, img2ascii), pero **no está en la fuente del proyecto** y el *fallback* varía por sistema: **descartado**.

**Densidad de tinta** (área del contorno / área de celda 600×1300, peso 400) [M]:

```
·  .019   :  .039   -  .036   =  .088   +  .096   *  .110   x  .124   o  .151
y  .139   a  .167   A  .187   G  .210   #  .211   %  .211   @  .262   $  .282
░  .159   ▒  .358   ▓  .807   █  1.000   ▀▄▌▐  .500   ▙▛▜▟  .750
```

- La rampa clásica ` .:-=+*#%@` llega a **0,26**: un campo «al máximo» sigue vacío en un 74 %. Por eso los campos ASCII de plantilla se ven lavados. **`▒` (0,36) y `▓` (0,81) son el salto que faltaba**; `░` (0,16) es *más claro de lo que parece* (como una `a`).
- **Rampa propuesta** (12 pasos): `' ' · : = * y a A G ▒ ▓ █` → densidades `0, .019, .039, .088, .110, .139, .167, .187, .210, .358, .807, 1`. Las letras **y a A G** ocupan la banda media-alta (0,14–0,21) y **son el nombre**. Bajo texto: solo hasta `G` (0,21); `▒▓█` solo en puntos calientes de la escena.
- Glifos direccionales para bordes (arte estático): `/ \ | - _ ( ) < > ^ v` (0,07–0,10) y `╱ ╲ │ ─ ┼`.

### 5.4 El campo «Marea Cobalto» (procedural, cero bytes de datos)

Cáusticas: dominio ligeramente deformado + tres ondas rotadas; los filamentos son la cresta de la interferencia. Una «lente» sigue al puntero. Sale del mismo espíritu que el shader actual (luz líquida) pero **es texto**. Verificado en Node (la salida se ve como filamentos en `y a A G` con puntos calientes en `▒▓█`).

```js
// field.mjs — original para Gaya. densidad 0..1 por celda
const TAU = Math.PI * 2;
export const RAMP = [' ', '·', ':', '=', '*', 'y', 'a', 'A', 'G', '▒', '▓', '█'];
// aspect = cellH / cellW (≈ 2,17 con Geist Mono a 10 px: 13/6)
export function tide(x, y, t, cols, rows, aspect, px = 0.5, py = 0.5) {
  const u = x / cols, v = (y * aspect) / cols;                    // espacio cuadrado
  const wx = u + 0.06 * Math.sin(TAU * (v * 1.7 + t * 0.05));     // dominio deformado
  const wy = v + 0.06 * Math.sin(TAU * (u * 1.3 - t * 0.04));
  const a = Math.sin(TAU * (wx *  3.1 + wy *  1.2 + t * 0.06));   // tres ondas rotadas
  const b = Math.sin(TAU * (wx * -1.4 + wy *  3.3 - t * 0.05));
  const c = Math.sin(TAU * (wx *  2.2 - wy *  2.6 + t * 0.03));
  const ridge = 1 - Math.abs((a + b + c) / 3);                    // 1 en las crestas
  let d = Math.pow(ridge, 5);                                     // filamentos finos
  const dx = u - px, dy = v - py * (rows * aspect / cols);
  const lens = Math.exp(-(dx * dx + dy * dy) * 18);               // puntero
  d = d * (0.50 + 0.55 * lens) + 0.10 * (0.5 + 0.5 * a) + 0.16 * lens * lens;
  return d < 0 ? 0 : d > 1 ? 1 : d;
}
export function frame(cols, rows, t, aspect = 2.17, px, py) {
  const out = new Array(rows);
  for (let y = 0; y < rows; y++) {
    let s = '';
    for (let x = 0; x < cols; x++)
      s += RAMP[Math.min(RAMP.length - 1, (tide(x, y, t, cols, rows, aspect, px, py) * RAMP.length) | 0)];
    out[y] = s;
  }
  return out;                                                     // array de filas
}
```

La estructura es lo que importa: tres senos con frecuencias no alineadas y una cresta afilada (`pow(ridge, 5)`); los coeficientes se afinan mirando la salida.

Coste medido: **120×50 → ≈ 1 ms por cuadro** en Node/escritorio (`toneStack`). Tamaño del cuadro **como póster**, con brotli-11 [M]: 62×60 = **1,20 KB** · 110×34 = **1,00 KB** · 160×45 = **1,45 KB** · 200×60 = **2,00 KB** (sin comprimir 4,8–15,4 KB porque `· ▒ ▓ █` ocupan 2–3 bytes en UTF‑8). Gzip‑9: 1,07–2,24 KB.

### 5.5 Tono barato: pilas de capas, no un `<span>` por carácter

Ghostty logra dos tonos con ~72 `<span>` por cuadro; bierman/three con color por carácter paga mucho. Alternativa: **tres `<pre>` superpuestos con la misma rejilla**; cada celda vive en **una** capa (las demás llevan un espacio). Cada capa es una cadena por fila: 3 × el coste de 5.1, sin nodos extra ni estilos por carácter. El color es CSS de la capa (`--glow-1`, `--glow-2`, `--glow-3` de `tokens.css`), así el cambio de paleta sigue siendo «editar un solo archivo».

```js
// pieces.mjs (fragmento) — cada celda va a dim, mid o hot según su densidad
export function toneStack(cols, rows, t, { aspect = 2.17, px = .5, py = .5, mask = null } = {}) {
  const dim = [], mid = [], hot = [];
  for (let y = 0; y < rows; y++) {
    let a = '', b = '', c = '';
    for (let x = 0; x < cols; x++) {
      let d = tide(x, y, t, cols, rows, aspect, px, py);
      if (mask) d *= mask[y * cols + x];                          // zona tranquila 0..1
      const g = RAMP[Math.min(RAMP.length - 1, (d * RAMP.length) | 0)];
      if (g === ' ')      { a += ' '; b += ' '; c += ' '; }
      else if (d < 0.42)  { a += g;   b += ' '; c += ' '; }
      else if (d < 0.72)  { a += ' '; b += g;   c += ' '; }
      else                { a += ' '; b += ' '; c += g;   }
    }
    dim.push(a); mid.push(b); hot.push(c);
  }
  return { dim, mid, hot };
}
// escritura por fila: <pre> con un <span style="display:block"> por fila; solo se toca el nodeValue de lo que cambió
const rowsTextNodes = [...pre.querySelectorAll('span')].map(s => s.firstChild);
function paint(rows, prev) { for (let y = 0; y < rows.length; y++) if (rows[y] !== prev[y]) rowsTextNodes[y].nodeValue = rows[y]; }
```

### 5.6 Legibilidad: «pozos de lectura» con contraste calculado [M]

Con los tokens de `tokens.css` (`--surface` = `#02051b`, `--ink` = `#edf2f8`, `--muted` = `#a4b6ce`), calculado con `src/lib/color.mjs`:

| Glifo bajo el texto (OKLCH L, C 0,16, h 262) | `--ink` sobre glifo | `--muted` sobre glifo | glifo sobre `--surface` |
|---:|---:|---:|---:|
| 0,30 | 12,51 | 6,79 | 1,44 |
| 0,40 | 8,49 | **4,61** | 2,12 |
| 0,50 | **5,49** | 2,98 | 3,28 |
| 0,55 | 4,42 ✗ | 2,40 | 4,07 |
| 0,66 (`--glow-2`) | 2,82 ✗ | 1,53 | 6,38 |
| 0,85 | 1,41 ✗ | 1,31 | 12,74 |

Regla de diseño: **bajo `--ink` el glifo nunca supera L 0,50; bajo `--muted`, L 0,40**. El tono eléctrico y el hielo (`--glow-2`, `--glow-3`) viven **fuera** de las zonas de texto. (Es el peor caso: cobertura total del fondo del glifo; con cobertura ~25 % es mejor, pero WCAG se evalúa sobre el píxel.)

Cómo se aplica: **máscara de exclusión** a partir de los rectángulos del DOM (medidos una vez y cacheados, re-medidos con `ResizeObserver`, `document.fonts.ready` y cambio de ancho) que atenúa la densidad en `feather` celdas alrededor del texto y **nunca a cero** (queda un susurro que integra el arte con la página):

```js
export function quietMask(cols, rows, cell, rects, feather = 2) {
  const m = new Float32Array(cols * rows).fill(1);
  for (const r of rects) {                                        // {x,y,w,h} en px de viewport
    const x0 = Math.floor(r.x / cell.w), x1 = Math.ceil((r.x + r.w) / cell.w);
    const y0 = Math.floor(r.y / cell.h), y1 = Math.ceil((r.y + r.h) / cell.h);
    for (let y = Math.max(0, y0 - feather); y < Math.min(rows, y1 + feather); y++)
      for (let x = Math.max(0, x0 - feather); x < Math.min(cols, x1 + feather); x++) {
        const dx = Math.max(x0 - x, 0, x - (x1 - 1)), dy = Math.max(y0 - y, 0, y - (y1 - 1));
        const k = Math.min(1, Math.hypot(dx, dy) / feather);      // 0 dentro → 1 a `feather` celdas
        m[y * cols + x] = Math.min(m[y * cols + x], 0.10 + 0.90 * k);
      }
  }
  return m;
}
```

Alternativa sin JS por celda: una **placa** (`background: color-mix(in oklch, var(--surface) 78%, transparent)`) bajo los bloques de texto largos. Aino no hace ninguna de las dos y por eso su navegación se pierde.

### 5.7 Transformación por scroll: SDF entre formas-llave (idea de Aino, código propio)

Una sola forma que cambia con el scroll se siente **más cara** que tres escenas distintas y cuesta lo mismo que un campo. Cada forma-llave es una distancia con signo; entre dos llaves se mezclan las distancias con `smoothstep`. Verificado en Node (reloj de arena → rombo → círculo → barra).

```js
// morph.mjs
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SHAPES = {                                                  // espacio [-1,1]², negativo = dentro
  circle:    (x, y) => Math.hypot(x, y) - 0.62,
  diamond:   (x, y) => (Math.abs(x) + Math.abs(y)) * 0.72 - 0.62,
  hourglass: (x, y) => Math.max(Math.abs(x) - (0.12 + 0.5 * Math.abs(y)), Math.abs(y) - 0.85),
  bar:       (x, y) => Math.max(Math.abs(x) - 0.85, Math.abs(y) - 0.16),
};
const KEYS = ['hourglass', 'diamond', 'circle', 'bar'];
export const shapeAt = p => {                                     // p = progreso de scroll 0..1
  const f = clamp(p, 0, 0.9999) * (KEYS.length - 1), i = f | 0, k = smooth(0.15, 0.85, f - i);
  return (x, y) => mix(SHAPES[KEYS[i]](x, y), SHAPES[KEYS[i + 1]](x, y), k);
};
// densidad: borde fino + relleno con centelleo → índice de rampa
// edge = 1 - smooth(-0.02, 0.10, d); core = smooth(0, -0.35, d);
// v = clamp(edge*0.55 + core*(0.25 + 0.35*shimmer), 0, 1)
```

Para Gaya, las llaves son **emblemas de servicio** (ventana / megáfono-onda / retícula de red / flujo), no formas abstractas; cada sección del scroll cae sobre una llave.

### 5.8 Póster estático en el build, `reduced-motion` y LCP

Tres hechos medidos: (1) el ASCII cuando **es** el LCP y lo pinta JS llega tarde (bierman: 3,6 s de retraso); (2) meter **cuadros** en el HTML es caro (Ghostty: 1,93 MB); (3) un **fotograma** cuesta **1–2 KB** con brotli. Receta:

- Un módulo `field.mjs` **puro** (sin DOM, sin `Math.random`) corre **en Node al construir** y en el navegador después. El build escribe el fotograma en el HTML: `<div aria-hidden="true" data-nosnippet><pre class="ascii">…</pre></div>` (dos variantes, ancha y alta, con `@media`).
- El `<h1>` es texto real y **es** el LCP; el póster es contenido de texto inmediato.
- `prefers-reduced-motion: reduce`, `saveData`, `forced-colors`, impresión y `?still`: **se queda el póster** (o un cuadro por escena). Un fotograma de la versión viva, no una imagen aparte: la versión estática es **hermosa por construcción**.
- Prueba de paridad en CI: `frame(cols, rows, t0)` del build = cuadro del motor a `t0`.

### 5.9 Calidad adaptativa, pausa y visibilidad (WCAG 2.2.2)

- Tiers por número de celdas y **solo bajan** (control adaptativo con EMA y enfriamiento). Código verificado (`makeQuality` en `pieces.mjs`): degrada si el EMA del trabajo por cuadro supera el 45 % del hueco y solo sube tras ~4 s estables.
- `IntersectionObserver` + `document.hidden`: dormir fuera de pantalla y en pestaña oculta.
- **2.2.2:** el movimiento que se inicia solo y dura más de 5 s **junto a otro contenido** exige pausa/detener/ocultar (la excepción es lo «esencial» y las precargas). Por eso: **encendido ≤ 2,6 s** y después movimiento **solo por interacción** (scroll, puntero, foco). Si alguna pieza supera 5 s de autonomía, se añade un botón **solo con icono** (`aria-pressed`, `aria-label` «Pausar animación»/«Reanudar animación»), sin texto visible: cumple la regla del dueño y el criterio.
- 2.3.3 (AAA, movimiento por interacción): se respeta con `prefers-reduced-motion`.

### 5.10 Arte estático por forma (bordes limpios) en el build

Para emblemas de servicio y miniaturas de las 14 referencias, **no** se usa la rampa: se hornea con **búsqueda por vector de forma** (Alex Harri; idea, no código):

1. Rasterizar cada glifo del alfabeto seguro (Geist Mono en su peso) en un canvas de 60×130 px, y guardar **6 cobertura** (rejilla 2×3 de círculos escalonados).
2. Para cada celda de la imagen fuente (a la resolución de la celda × 4), muestrear los mismos seis círculos, aplicar exponente de contraste (~1,4) tras normalizar, y elegir el glifo de **menor distancia euclídea** (k-d tree o tabla de 5 bits × 6).
3. Cuantizar a los cuatro tonos y escribir la cadena.

**Sin dependencias nuevas:** Playwright ya está en `devDependencies`; sirve de rasterizador de glifos y de imágenes con `page.evaluate` sobre un `OffscreenCanvas`, y el resultado va a un `.txt`/módulo TS.

### 5.11 UI de texto: sintaxis, esquinas, ledger, statusline

- **Corchetes** como sistema: etiquetas `[ Servicios ]`, CTA `[ Escribir por WhatsApp ]`, estado `[ ES | EN ]`, `[ Copiar correo ]`. El texto real es del botón/enlace (accesible); los corchetes son `::before/::after` (`content: "[ " / ""` para que no se lean).
- **Esquinas fijas** (Dragonfly): superior-izquierda marca, superior-derecha menú, inferior-izquierda idioma, inferior-derecha **WhatsApp**; en móvil, una **barra inferior tipo *footer command bar*** (patrón de TUI documentado en `coreyt/monospace-design-tui`: barras de comandos al pie, superficie enfocada, estados no solo por color).
- **Ledger de servicios** (Avius, lista de Aino): filas con regla, sin tarjetas iguales:

```
  Servicio                Alcance en una línea              Acción
 ───────────────────────────────────────────────────────────────────
  Web y apps              (una frase real)                  [ Hablar ]
  Marketing y redes       (una frase real)                  [ Hablar ]
  Soporte e infra IT      (una frase real)                  [ Hablar ]
  Automatización e IA     (una frase real)                  [ Hablar ]
```
  Cada `[ Hablar ]` abre WhatsApp con el mensaje **prellenado con ese servicio**. Las reglas son bordes CSS, no glifos; solo el emblema de cada fila es arte horneado.
- **Dos anchos de rejilla** (`ch`): `--col: 1ch`, contenedor `max-inline-size: 72ch`, texto a 45–75 ch (regla existente del proyecto).

### 5.12 Revelado «decodificar» sin dañar el texto (eloyb)

Los `▒▒▒` que se resuelven en texto son un buen patrón **si el texto real ya está en el DOM**: capa superpuesta `aria-hidden` con la cadena de bloques → glifos de la rampa (` .:-=+*#`) → texto final, **una vez, ≤ 0,9 s**, con guardia temporal (si falla, se ve el texto real). Nunca en `h1`, párrafos, botones de acción ni navegación principal.

### 5.13 Conmutador «cómo se dibuja» (Aino) para las referencias

La galería de 14 referencias puede ofrecer `[ imagen | texto ]`: la vista texto son **miniaturas ASCII horneadas en el build** (5.10; estimación ≈ 1–2 KB brotli por miniatura, **por medir**), la imagen real aparece al enfocar/pasar. Etiquetas y estado; cero instrucciones. Se guarda la elección en `localStorage` con `try/catch`.

### 5.14 Datos: cuadros de vídeo → ASCII, cuándo y cómo

Solo si algún día se hornea vídeo: pipeline de pierce.dev (aspecto 0,44–0,46, luminancia CIE, diez niveles), cuadros clave + **delta por fila** (una fila idéntica a la anterior no se escribe) + RLE de espacios, y brotli. Ghostty prueba que 235 cuadros de ~5,7 k caracteres caben en un HTML de **89 KB con brotli**; aun así **no** va en el HTML: irían en un `.js` diferido tras el LCP. Para Gaya no hace falta: el campo es procedural.

---

## 6. Trampas (lista de control)

1. **Subsets de fuente sin cajas/bloques** (Fontsource/Google Fonts): las cajas caen a otra fuente (velvetcache.org lo documenta con Source Code Pro/Menlo). En Geist Mono, añadir `symbols2` (5,7 KB). [V][M]
2. **Símbolos que la fuente no tiene** (`← → ■ ● ◆`, braille, emoji): cambian de ancho por dispositivo. Solo el alfabeto seguro de 5.3.
3. **Ligaduras** (`calt` en JetBrains Mono): `->`, `==`, `//` se transforman y rompen la rejilla. `font-variant-ligatures: none`.
4. **Celdas no enteras** (12 px → 7,2 px de ancho) y **`line-height` no entero**: el texto «se desliza». Múltiplos de 5 px y alto redondeado.
5. **Glifos de caja con interlineado apretado**: las sombras `░▒▓` sobresalen de la celda (Geist Mono: `▓` de −394 a 1041 en 1000 upm) y manchan las filas vecinas; `line-height` 1,3 para arte de cajas.
6. **Layout shift por la fuente**: reservar la caja (`cols*1ch × rows*lh`, `overflow:hidden`), medir tras `document.fonts.load`, no antes.
7. **`readPixels` síncrono** cada cuadro + `innerHTML` completo (`AsciiEffect`): evitar. Calcular en CPU por celda o mantener todo en GPU.
8. **Un canvas por sección**: la memoria y los contextos se disparan; **un canvas fijo** y secciones que solo influyen mientras son visibles (Studio Freight).
9. **Texto real dentro del arte** (navegación de Aino): nunca. El arte no contiene información.
10. **ASCII sin `aria-hidden`** (o sin `user-select: none`): el lector lo recita y copiar/pegar arrastra ruido.
11. **WCAG 1.1.1 / F72** trata el ASCII como no textual: decorativo con `aria-hidden`; si porta significado (un logo), alternativa textual (`<h1>` real con el texto o `role="img" aria-label`).
12. **2.2.2** (5 s) y **destellos**: cambios de glifo independientes por celda, sin oscilación global > 2 Hz.
13. **Puerta o loader** que impide ver el contenido: bierman.io, Aino móvil. Fuera.
14. **Pantalla de carga con datos ficticios** o contadores falsos: prohibido por la regla de honestidad.
15. **Fuentes bitmap** (Px437, CC BY-SA 4.0): la cláusula de compartir igual y el disfraz retro; no aportan para un sitio de servicios.
16. **Terceros** (iframe de Aniso, GTM, jsDelivr, clima, banner de cookies): la CSP `default-src 'self'` los bloquea; además no hay analítica que consentir.
17. **Video/3D para hacer ASCII**: un campo procedural cuesta 0 KB; un `.glb` ~400 KB y una librería de 700 KB.
18. **GPU ≠ rápido**: shaders multipasada bajan fps en hardware viejo (Efecto lo advierte). Medir con el 4× de Lighthouse y con el A07 real antes de decidir WebGL.
19. **Mono en párrafos largos a < 16 px**: se cansa la lectura; cuerpo ≥ 16 px, ≤ 62 ch, párrafos cortos.
20. **Tabla de puntos uniforme** de fondo: choca con PRODUCT.md («sin fondos de puntos») y no dice nada.
21. **Metadatos de vanidad** (cifras, clientes, «+X proyectos»): prohibido; los microdatos en mono son estructurales (hora, idioma, estado).
22. **`animation-timeline`/CSS moderno sin respaldo** (Firefox es ~1 de cada 17 visitas en RD según el informe 06): siempre degradar a estático.

---

## 7. Qué robaría para un sitio de servicios que convierte a WhatsApp

| Idea | De dónde | Adaptación para Gaya Digital |
|---|---|---|
| Campo tenue + palabra sólida saturada | Unseen, Dragonfly | Campo Marea en `--glow-1` bajo el `h1` en Bricolage 800; solo el cierre usa `--glow-3` |
| Alfabeto = nombre de la marca | Unseen | Rampa `· : = * y a A G ▒ ▓ █` |
| Corchetes como sintaxis de CTA | Unseen, Joel | `[ Escribir por WhatsApp ]`, `[ ES | EN ]`, siempre con texto real accesible |
| Cuatro esquinas fijas | Dragonfly | Marca · menú · idioma · **WhatsApp** (siempre visible) |
| Barra inferior de comandos | TUI (`monospace-design-tui`) | En móvil, barra fija con WhatsApp como acción dominante; icono + etiqueta corta |
| Ledger de servicios | Avius, Aino | 4 filas con regla; cada fila enlaza a WhatsApp **con ese servicio ya escrito** |
| Transformación por scroll de una forma | Aino | Cuatro emblemas (web, marketing, IT, IA) como llaves SDF; la sección que se lee es la llave activa |
| Conmutador IMAGE/TEXT | Aino | `[ imagen | texto ]` en la galería de 14 referencias |
| Índice con códigos de catálogo | Aino, Unseen | Solo para las 14 referencias (slug real); **no** numerar secciones (DESIGN.md lo prohíbe) |
| Cierre con arte + CTA | Reline | Última escena: arte grande de la marea y `[ Escribir por WhatsApp ]` |
| Microdato vivo local | Joel | «Santo Domingo · 21:40» con `Intl.DateTimeFormat` (sin API); nada de clima |
| Marcador `▒` que se decodifica | eloyb | Solo microetiquetas, con capa `aria-hidden` |
| Botón «copiar correo» con barra `####` | eloyb | `hola@gaya.com.do` con relleno de bloques `█` 400 ms (estado visible, sin texto de ayuda) |
| Un canvas, render solo visible | Dragonfly / Studio Freight | Un campo fijo; emblemas estáticos SSR + animación solo en vista |
| Transición por bloques | Kostya | Entre `/` y `/referencias/`, disolución con bloques `█` (coherente con `@view-transition`) |
| Concepto → movimiento con razón | Year of the Horse | Cada animación ilustra un proceso real (paquete que viaja, formulario que se completa) |

---

## 8. DECISIONES CERRADAS para Gaya Digital

**Concepto y dirección**
1. **Concepto: «el agua hecha del nombre».** Campo Marea Cobalto (cáusticas, no papel pintado) cuya rampa incluye `y a A G`; los puntos calientes usan bloques. Es la traducción del shader actual a texto.
2. **ASCII = materia, contenido = HTML real.** Fondos, cortes entre secciones, emblemas de servicio y cromo de UI son ASCII; `h1/h2/p/ul/a` son texto semántico en tipografía sólida. Sin ventana falsa, prompt, verde Matrix, CRT/scanlines, cursor parpadeante decorativo.
3. **Dos voces:** **Bricolage Grotesque** (ya autoalojada) 700–800 para titulares grandes; **Geist Mono** para todo lo ASCII, UI, datos y cuerpo corto (16–17 px, `line-height` 1,65, ≤ 62 ch, párrafos ≤ 4 líneas). Sin fuentes bitmap.
4. **Criterio «arte vs *gimmick*»** para aprobar cada pieza: ¿el glifo/forma tiene razón de ser (concepto)? ¿sobrevive en estático? ¿el contenido se lee sin el arte? ¿ilustra un proceso real? ¿otra persona lo tomaría de referencia? Si falla una, se rehace.

**Color y contraste**
5. **Cuatro tonos de glifo Cobalto:** *dim* (L ≤ 0,40), *mid* (L ≤ 0,50), *hot* `--glow-2` (L 0,66), *spark* `--glow-3` (≤ 2 % de las celdas). Acento ≤ 5 % de la pantalla.
6. **Pozos de lectura:** bajo texto `--ink`, glifo L ≤ 0,50 (5,49:1); bajo `--muted`, L ≤ 0,40 (4,61:1); `--glow-2`/`--glow-3` jamás bajo texto. Los pares entran en `tokens.json` y en `npm run contrast`.
7. **Máscara de exclusión** desde los rectángulos DOM (cacheados; `feather` 2 celdas; nunca a 0) y, en bloques largos, placa translúcida.

**Tipografía técnica y rejilla**
8. **Añadir `symbols2` a Geist Mono** en `astro.config.mjs` (`subsets: ['latin', 'symbols2']`) y precargar `latin`; sin `symbols2` no se usan cajas ni bloques. Comprobar tras el build que el CSS generado contiene `U+2500-259F` (el nombre del subset sale de `metadata.json` de Fontsource). Coincide con el informe 06.
9. **Alfabeto seguro:** ASCII imprimible, `· • … ↑ ↓ × « » ¿ ¡ ± ° §`, cajas `U+2500–257F`, bloques `U+2580–259F`. **Prohibido** dentro de rejillas: `← → ■ □ ● ○ ◆ ◇ ∙`, braille, emoji.
10. **Rampa oficial:** `' ' · : = * y a A G ▒ ▓ █` (densidades medidas en 5.3). Bajo texto solo hasta `G`. Flechas de UI: `->`, `»`, `↑`, `↓`.
11. **Métrica:** fuente en múltiplos de 5 px (10 móvil, 15 escritorio ≥ 1024 px, 20 titulares ASCII), `line-height` entero, celda medida con `measureText` tras `document.fonts.load`, caja reservada sin CLS, `font-variant-ligatures: none; font-kerning: none`.
12. **Estructura en CSS, no en glifos:** reglas de 1 px, bordes y `content: "[ " / ""`; los glifos de caja solo en arte decorativo `aria-hidden` con `line-height` 1,3.

**Rendimiento y arquitectura**
13. **El héroe es un póster de texto generado en el build** dentro del HTML (`<pre>` en `aria-hidden`, 1–2 KB brotli), el `h1` es el LCP, y el motor arranca tras `load`/idle. **Cero loaders, cero puertas** («tap to…»), cero pantallas de carga con %.
14. **Un solo campo vivo fijo** (un canvas o una pila de `<pre>`), emblemas y cortes **estáticos** en el DOM que solo animan mientras son visibles. Nunca un canvas por sección.
15. **Presupuesto:** motor ≤ 20 KB gzip (informe 06), póster ≤ 2 KB por variante, **sin three.js, sin GLB, sin vídeo, sin cuadros dentro del HTML**. Tiers por celdas 9 000 / 6 500 / 4 200 / 2 400; el control adaptativo solo baja.
16. **Motor por defecto:** cadenas por fila (DOM `<pre>` en pila de tres tonos o Canvas 2D `fillText` por fila) hasta ~9 000 celdas; **prohibido** `drawImage` de atlas en Canvas 2D y `fillText` por carácter; WebGL con atlas instanciado solo si la medición en el A07 lo exige (coherente con el informe 06).
17. **Gate de calidad:** Lighthouse móvil ≥ 90 (mediana de 3), LCP < 2,5 s (objetivo 2,0 s), CLS 0, TBT < 200 ms; el estándar de partida es la tabla de §3, donde **ningún referente ASCII lo cumple**.

**Accesibilidad**
18. **Todo ASCII es decoración:** `aria-hidden="true"`, `user-select: none`, `pointer-events: none`, `data-nosnippet`. Un wordmark ASCII lleva `<h1>` con el texto real (visible o `sr-only`) y jamás contiene información.
19. **Movimiento:** encendido autónomo ≤ 2,6 s; después solo por scroll, puntero o foco (evita 2.2.2 sin botón). Si una pieza excede 5 s, botón **solo con icono** (`aria-pressed`, `aria-label`).
20. **`prefers-reduced-motion`, `saveData`, `forced-colors: active` e impresión:** se queda el póster (o un cuadro por escena), sin decodificaciones ni estelas; se escucha el evento `change` para conmutar en vivo.
21. **Sin destellos:** cambios de glifo independientes por celda; ninguna oscilación global > 2 Hz.

**UI de texto y conversión**
22. **Corchetes** como sintaxis de etiqueta/CTA/estado (`[ Escribir por WhatsApp ]`, `[ ES | EN ]`); el texto accesible real está dentro del botón/enlace.
23. **Cuatro esquinas fijas** (marca, menú, idioma, WhatsApp); en móvil, **barra inferior** con WhatsApp como acción dominante (≥ 44 px, foco visible ≥ 3:1).
24. **Servicios como ledger de 4 filas** (nombre, alcance en una línea, emblema ASCII horneado, `[ Hablar ]` con WhatsApp prellenado con el servicio). Nada de rejilla de tarjetas iguales.
25. **Referencias:** índice de texto con `[ imagen | texto ]` (miniaturas ASCII horneadas por forma, medir peso antes de comprometer 14) e imagen real al enfocar; códigos de catálogo solo para referencias.
26. **Transformación por scroll** de una forma-llave por servicio (SDF), con `?still` que la congela en cada llave.
27. **Microdato local honesto:** hora de Santo Domingo con `Intl`, calculada en cliente; **sin API externa**, sin clima, sin «disponible ahora» inventado.

**Contenido y honestidad**
28. **Cero cifras, clientes, testimonios ni años de experiencia**, ni siquiera decorativos. Los datos de UI son estructurales (hora, idioma, estado de copia).
29. **Cero terceros:** sin iframes (nada tipo Aniso alojado), CDN, analítica, clima ni banner de cookies (no hay nada que consentir); fuentes y librerías autoalojadas; CSP intacta.
30. **La web no menciona quién la construyó ni cómo.** («Automatización e IA» aparece solo como servicio.)

**Proceso**
31. **Arte estático horneado con búsqueda por forma** (vector de 6 valores + contraste, sin dependencias nuevas; Playwright como rasterizador) para emblemas y miniaturas; el campo animado usa la rampa por densidad.
32. **Prueba de paridad en CI:** el póster generado en el build es el cuadro del motor a `t0`; `?still` y `?still&scene=<id>` congelan el motor para capturas.
33. **Revisión visual obligatoria a 320, 375, 414, 768, 1024 y 1440 px**, en claro/oscuro del sistema si aplica, y con `prefers-reduced-motion`; cada escena se aprueba **en estático primero**.
34. **Supuesto a confirmar viendo, no preguntando:** «toda la página en ASCII» se cumple como *materia visual de todas las superficies* (fondos, cortes, emblemas, cromo), con el contenido en HTML real. Si el dueño pide más ASCII, se sube por **titulares de sección en bloques ASCII con `<h2>` real debajo**, no reemplazando párrafos por arte.

---

## 9. Coherencia con los otros informes de la serie

- **06 · Movimiento y arquitectura** (`docs/ascii/research/06-motion-architecture.md`): coincide en póster SSR como LCP, un canvas fijo, tiers de 9 000/6 500/4 200/2 400 celdas, cero movimiento autónomo > 2,6 s, `symbols2`, `aria-hidden`, sin GSAP. Esta investigación **añade** la evidencia de los referentes (§3), la rampa medida, el contraste por tono, el patrón de esquinas/ledger/corchetes y el motor por filas.
- **Pendiente de otros informes:** lista final de escenas y emblemas (arte), copia por idioma (contenido), tamaño final de la mono (tipografía), y la decisión de WebGL vs cadenas por fila **después de medir en el A07**.
- Riesgo abierto: mi microbenchmark es de escritorio; el criterio de aceptación real es el A07 físico (o el 4× de Lighthouse) con el campo de producción.

---

## 10. Fuentes (URLs consultadas)

**Sitios abiertos:** https://ghostty.org/ · https://aino.agency/ · https://2025.unseen.co/ · https://dragonfly.com/ · https://www.reline.ch/ · https://aniso1208.vercel.app/ · https://bierman.io/ (+ `script.js`, `styles.css`) · https://www.eloyb.design/ · https://lunar-horse.webflow.io/ · https://aviusrecordings.webflow.io/ · https://joemihavel.com/ · https://www.kostyafarber.com/ · https://nextjs-ascii-hero.vercel.app/ · https://evervault.com/ · https://tempo.xyz/ · https://www.pen.dev/ · https://www.hyve.systems/ · https://www.gridhealth.io/ · https://www.avita.pm/ · https://charm.land/ · https://ratatui.rs/

**Fichas y casos:** https://www.awwwards.com/sites/aino-agency · https://www.awwwards.com/sites/eloyb-design · https://www.awwwards.com/sites/ascii-street-view · https://www.awwwards.com/sites/kostya-farbers-website · https://www.awwwards.com/case-study-dragonfly-by-studio-freight.html · https://www.awwwards.com/case-study-orage.html · https://www.awwwards.com/inspiration/ascii-liquid-sim-effect-unseen-studio-2025-wrapped · https://www.awwwards.com/inspiration/3d-ascii-animation-evervault · https://www.awwwards.com/inspiration/3d-ascii-cta-reline-studio · https://www.awwwards.com/inspiration/navigation-more-than-equal · https://www.awwwards.com/inspiration/ascii-scroll-triggered-animation-machine-learning-fairness · https://www.awwwards.com/inspiration/ascii-loading-animation-kostya-farbers-website · https://webflow.com/made-in-webflow/ascii · https://onepagelove.com/tag/ascii · https://www.hontran.dev/blog/best-award-winning-websites-2026

**Técnica:** https://alexharri.com/blog/ascii-rendering · https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/ · https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/ · https://tympanus.net/codrops/2024/11/13/creating-an-ascii-shader-using-ogl/ (los tres leídos vía `r.jina.ai` por 403 directo) · https://seangeng.com/writing/ascii-text-from-webgl · https://offscreencanvas.com/issues/webgl-ascii/ · https://pierce.dev/notes/making-an-ascii-animation · https://www.a1k0n.net/2011/07/20/donut-math.html · https://github.com/mrdoob/three.js (`examples/jsm/effects/AsciiEffect.js`, MIT vía jsascii) · https://github.com/darkroomengineering/aniso (MIT) · https://github.com/egorshest/webgl-ascii-hero (MIT) · https://github.com/humanbydefinition/textmode.js (MIT) · https://code.textmode.art/ · https://github.com/coreyt/monospace-design-tui · https://velvetcache.org/2024/02/12/box-drawing-on-the-web/ · https://16colo.rs/ · https://int10h.org/oldschool-pc-fonts/ (Px437, CC BY-SA 4.0) · https://news.ycombinator.com/item?id=29726313 · https://news.ycombinator.com/item?id=47731351

**Accesibilidad:** https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html · https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html · https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html (F72: ASCII sin alternativa)

**Medido en el repo / con herramientas:** `node_modules/@fontsource-variable/{geist-mono,jetbrains-mono,martian-mono}` (cobertura, GSUB, contornos con `fontTools`), `src/styles/tokens.css` + `src/lib/color.mjs` (contrastes), Lighthouse 13.5.0 móvil (10 URL), `curl` (tamaños con `Accept-Encoding`), Resource Timing (Aino), microbenchmark de escritorio y scripts `field.mjs`/`morph.mjs`/`pieces.mjs` en Node 24.

---

## Apéndice A · Densidad de tinta de Geist Mono (400) completa

```
.:0.019  ·:0.019  ,:0.031  `:0.033  -:0.036  ::0.039  ':0.041  _:0.044  •:0.047  ;:0.051  …:0.058  ~:0.059  ─:0.066  ^:0.070
!:0.071  ":0.077  =:0.088  /:0.088  \:0.088  |:0.088  +:0.096  (:0.097  ):0.097  <:0.098  >:0.098  ×:0.104  *:0.110  v:0.116
L:0.118  }:0.121  {:0.121  J:0.122  7:0.122  x:0.124  r:0.124  T:0.125  ?:0.125  i:0.126  Y:0.126  j:0.128  z:0.130  [:0.131
]:0.131  t:0.131  c:0.131  l:0.133  u:0.134  n:0.135  f:0.138  ╱:0.139  ╲:0.139  y:0.139  │:0.141  1:0.148  s:0.148  o:0.151
F:0.152  h:0.154  I:0.155  V:0.158  k:0.158  ░:0.159  X:0.165  a:0.167  e:0.167  C:0.171  4:0.172  Z:0.173  P:0.174  U:0.176
3:0.180  w:0.181  p:0.184  q:0.184  K:0.186  A:0.187  b:0.188  d:0.188  E:0.189  2:0.192  m:0.192  5:0.193  H:0.194  ┼:0.198
D:0.200  S:0.200  O:0.202  R:0.207  G:0.210  %:0.211  g:0.211  #:0.211  9:0.218  6:0.218  N:0.222  8:0.222  B:0.229  &:0.234
Q:0.239  0:0.250  ▖▗▘▝:0.250  @:0.262  W:0.262  M:0.263  ╳:0.267  $:0.282  ▒:0.358  ▀▄▌▐▚▞:0.500  ▙▛▜▟:0.750  ▓:0.807  █:1.000
```

## Apéndice B · Cómo reproducir las mediciones

- Cobertura y contornos: `fontTools` (`getBestCmap`, `BoundsPen`, `AreaPen`) sobre `geist-mono-latin-wght-normal.woff2` y `geist-mono-symbols2-wght-normal.woff2`.
- Contraste: `import { contrast, oklchToHex } from 'src/lib/color.mjs'` con los tokens de `tokens.css`.
- Lighthouse: `lighthouse https://<sitio>/ --only-categories=performance,accessibility --chrome-flags="--headless=new"` (perfil móvil por defecto). En Windows termina con un aviso de limpieza de temporales (`EPERM`) *después* de escribir el JSON.
- Póster: `frame(cols, rows, t)` de `field.mjs` → `zlib.brotliCompressSync(..., quality 11)`.
