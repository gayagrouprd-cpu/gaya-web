# CARTEL · nueve carteles de una palabra y una marea que los cambia

Concepto de portada y página completa para gaya.com.do, como obra de arte ASCII y como sitio que informa y convierte.
Director creativo independiente, ángulo «El cartel». Fecha: 2026-09-30. Estado: especificación cerrada para construir (falta la validación en un Samsung A07 real, igual que en los informes 02, 05 y 06).

**Etiquetas de fiabilidad** (las mismas de los informes 01 a 06): **[V]** leído en la fuente en esta sesión · **[M]** medido por mí ahora, con código propio en Node 24 (carpeta temporal; no se tocó el proyecto) · **[C]** criterio propio, razonado y no verificado en fuente.

**Lo que este documento es y no es.** Es la dirección de arte, el guion de cada sección, el sistema visual, el plan técnico y las decisiones. No es código de producción. Todo lo que aparece dibujado en las figuras se generó de verdad (Apéndice A): son **especímenes a escala reducida (50 a 120 columnas)**; en producción la rejilla de escritorio mide 142 a 160 columnas. Las figuras muestran glifos; el color va en los tonos de §4.

**Índice.** 0 Resumen ejecutivo · 1 Lo aprendido · 2 El concepto en diez reglas · 3 Tipografía, celda y escala · 4 Cobalto: tonos, rótulo y legibilidad · 5 La página: orden, relojes, marea y navegación · 6 Los nueve carteles · 7 El momento firma · 8 Plan técnico · 9 Presupuestos, degradación y calidad · 10 Contenido · 11 Por qué es arte · 12 Riesgos, pendientes y decisiones cerradas · 13 Hitos · 14 Fuentes · Apéndice A (pruebas y código).

---

## 0. Resumen ejecutivo

**La tesis.** Un cartel dice una sola cosa, con una sola palabra enorme y mucho aire. La web de Gaya es una **serie de nueve carteles**. Cada cartel es **una palabra hecha de bloques Unicode** (cuadrantes `▘▝▖▗▚▞▛▜▙▟█`, el doble de resolución que los semibloques del ANSI clásico) y cada palabra está hecha de **un material que es el servicio**: la marca es agua, la conversación son olas, la web se construye, la automatización ordena el caos, el marketing es un eco, el soporte es un neón que se apaga y vuelve, las referencias son ventanas, el proceso es un hilo. La palabra es la imagen; el texto real (HTML semántico, tipografía sólida) es la leyenda del cartel.

**El gesto.** «Quieto como un cartel, líquido cuando lo tocas.» En reposo cada cartel es una pieza fija y limpia. El puntero, el dedo, el teclado y el scroll la derriten en agua (el material de la marca) y la vuelven a formar. Entre cartel y cartel **sube una marea**: una línea de agua ondulada, pegada al borde real de cada sección, que deshace la palabra que sale y cristaliza la que llega.

| # | Cartel | Palabra ES / EN | Material | Qué demuestra |
|---|---|---|---|---|
| 0 | Portada | GAYA | agua (letra de vidrio con agua dentro) | la marca, y el campo de luz líquida que ya existía |
| 1 | Quiénes somos | HOLA / HELLO | olas (H sólida, «OLA» de olas: «hola» contiene «ola») | la conversación: WhatsApp primero |
| 2 | Desarrollo web y apps | WEB | obra (plano, obra, publicado) | se construye y se publica |
| 3 | Automatización e IA | LISTO / READY | agujas que se alinean | el caos se ordena y aprende |
| 4 | Marketing y redes | ECO / ECHO | isolíneas del propio contorno | el alcance sale de tu nombre |
| 5 | Soporte e infraestructura IT | ON | neón que se apaga y vuelve | plan para los apagones, respaldo |
| 6 | Referencias | VER / SEE | letras-ventana sobre miniaturas ASCII reales | las webs de ejemplo |
| 7 | Proceso | HOLA · LISTO | un hilo entre las dos palabras | de «hola» a «listo» en cuatro estaciones |
| 8 | Contacto y cierre | GAYA | reflejo en el agua | hablemos |

**El momento firma** (guion cuadro a cuadro en §7): al primer scroll, la palabra **GAYA se deshace en agua** y de esa agua **cristaliza HOLA**, la primera palabra de cada mensaje de WhatsApp. Quien lo ve lo cuenta así: «la web dice Gaya, se derrite y te dice hola». Dos momentos menores lo acompañan: el apagón del cartel ON (el dedo es la linterna) y el reflejo del cierre.

**Lo que cumple** (todo medido o derivado de medidas, §8 y §9):

- **Toda la página es ASCII**: fondos, palabras, cortes entre secciones, hilo, esquinas de interfaz y etiquetas entre corchetes. Lo único que no es arte es lo que no puede serlo: el texto real (h1, h2, párrafos, listas, enlaces).
- **Una sola familia tipográfica, Geist Mono Variable**, de 13 px (microdatos) a 96 px (h1) y en las palabras gigantes (18 filas de 18 px = 324 px de letra). Sin fuente de titulares: **se retiran 68,6 KB de Bricolage** de la portada.
- **Peso de la portada**: póster SSR de la portada 1,46 KB con brotli (ancho, 160×50) y 0,77 KB (móvil apilado, 56×60); las **once** palabras (ES y EN), solo en su variante ancha de 18 filas, son 2,2 KB con gzip [M]; JS de primera carga ≤ 12 KB gz; fuentes 28,9 KB; cero peticiones a terceros.
- **Cero movimiento autónomo** tras el encendido de 2,6 s: el campo se mueve solo por scroll, puntero, foco y toque, y duerme a los 1,6 s. Con `prefers-reduced-motion` cada cartel es un fotograma del motor, hermoso por construcción.
- **Honestidad**: ninguna cifra, cliente, testimonio ni logo de Gaya. Los únicos números son datos locales con fuente y fecha (informe 04), la hora de Santo Domingo y sus coordenadas.

**Lo que decide el dueño** (§12): confirmar capacidades y compromisos marcados [CONFIRMAR] en el informe 04; aprobar las palabras de los carteles; y elegir entre «solo mono» (recomendado) o «mono con Bricolage en h1/h2» si la mono le parece fría.

---

## 1. Lo aprendido y lo que decidí con ello

Además de los seis informes previos (leídos completos, §14), investigué las tradiciones que el ángulo «cartel» invoca. Solo cito lo que abrí y leí.

| Fuente | Lo que aprendí [V] | Decisión en Cartel |
|---|---|---|
| **Wim Crouwel, «New Alphabet» (1967)**. [Wikipedia](https://en.wikipedia.org/wiki/New_Alphabet), [Eye](https://eyemagazine.com/feature/article/electrifying-the-alphabet) | Alfabeto diseñado para pantallas de tubo de rayos catódicos sobre una rejilla de 5×7 con solo trazos horizontales y verticales; la crítica lo rechazó por ilegible («necesitaba subtítulos»). | Sí: **letras construidas con la rejilla de la máquina** (celdas y cuadrantes). No: letras que hay que descifrar. Las palabras usan formas de letra normales y el `h3` real hace de subtítulo por si acaso. |
| **Josef Albers, «Kombinationsschrift» (h. 1928)**. [Bauhaus Kooperation](https://bauhauskooperation.de/wissen/das-bauhaus/werke/druck-und-reklame/kombinationsschrift) | Un alfabeto entero a partir de círculo, cuarto de círculo y cuadrado; diez elementos estándar; el argumento es la **reducción**. | Las nueve palabras salen de **16 módulos** (los 16 cuadrantes de `▘` a `█`) y cada cartel usa **un solo material** además del rótulo sólido. La reducción es el estilo. |
| **Estilo Suizo / Tipográfico Internacional**. [TGDS](https://www.thegraphicdesignschool.com/design-history/swiss-style-movement/) | Rejilla matemática, sans, texto **alineado a la izquierda sin justificar**, composición asimétrica que hace visible la estructura, Müller-Brockmann y los carteles de la Tonhalle. | Rejilla de 12 columnas para el texto real, columna de lectura a la izquierda, palabras que alternan ancho y alineación (95 %, 78 %, 69 %, 51 %…), ≥ 40 % de aire. |
| **Poesía concreta**: grupo Noigandres (São Paulo, 1952) y Gomringer. [The Art Story](https://www.theartstory.org/movement/concrete-poetry/), [Burlington](https://contemporary.burlington.org.uk/articles/articles/eugen-gomringer) | «Estructura = contenido»: la forma visual de la palabra **es** el significado; «silencio» (1953-54) es la palabra repetida catorce veces alrededor de un vacío; Gomringer nació en Bolivia y se crió hablando español; sus poemas se llaman **constelaciones**. | El principio rector: **la forma de cada palabra es lo que el servicio hace**. Una palabra por cartel, y el vacío es parte del cartel. Precedente latinoamericano y suizo a la vez, justo lo que Gaya es: RD hacia el mundo. |
| **Arte ANSI y TheDraw**. [ANSI art](https://en.wikipedia.org/wiki/ANSI_art), [Block Elements](https://en.wikipedia.org/wiki/Block_Elements) | Los grupos (ACiD, iCE) hacían logos con **letras grandes de bloques**; TheDraw (1986) traía fuentes de ese tipo; el arte ANSI usaba semibloques, sombras y tramados; **los cuadrantes `▖`…`▟` llegaron con Unicode 3.2 (2002)**. | Rótulo de bloques con **cara, luz de borde y sombra proyectada**, como los logos ANSI, pero con **cuadrantes** (2×2 por celda) y no con medios bloques. Es la vertiente «tinta y oficio» del ASCII, no la del terminal. |
| **Knowlton y Harmon, «Studies in Perception I» (1966)**. [Wikipedia](https://en.wikipedia.org/wiki/Ken_Knowlton) | Una fotografía convertida en símbolos tipográficos según la **densidad de halftone**: el carácter es tono. | La rampa de agua `' · : = * y a A G ▒ ▓ █'` (informe 01) es esa idea con el alfabeto de la marca (`y a A G`) como tono. |
| **Rótulos populares** (letreros comerciales pintados a mano). [Rótulo](https://en.wikipedia.org/wiki/Rotulo), registro «Letreros populares dominicanos» de Faustino Pérez en el [catálogo del Centro León](https://mediateca.centroleon.org.do/cgi-bin/koha/opac-imageviewer.pl?biblionumber=18096&imagenumber=11743) | Los rótulos son letreros pintados por artesanos, propios de barrios populares de América Latina; el registro dominicano existe. **No pude leer el libro ni ver imágenes**: no afirmo rasgos de estilo dominicanos. | Uso «rótulo» solo como **categoría** (letrero comercial de letra grande con sombra y, de noche, neón). Es el ancla cultural del look: cara, luz, sombra, y el neón del cartel ON. Pendiente: que el dueño aporte fotos de letreros reales que le gusten. |
| **Felzenszwalb y Huttenlocher, «Distance Transforms of Sampled Functions» (2012)**. [PDF](https://cs.brown.edu/people/pfelzens/papers/dt-final.pdf) | Distancia euclídea exacta en **tiempo lineal**: envolvente inferior de parábolas, columnas y luego filas. | Un solo cálculo de distancia (anisótropo, en la rejilla de celdas) alimenta el eco (isolíneas), el neón (tubo y halo) y el dentro y fuera de la hachura de LISTO; el aro y la sombra de las palabras sólidas usan pruebas de vecindad de una celda. Medido: 0,27 ms para 171×48 celdas en Node [M]. |
| **Santo Domingo**. [Wikipedia](https://en.wikipedia.org/wiki/Santo_Domingo) | 18°27′45″N 69°56′10″W; UTC−4 sin horario de verano. | Microdato del cartel HOLA: «SDQ · 18°28′N 69°56′W · 21:40 UTC−4» (hora local calculada en el cliente con `Intl`, sin API). |
| **web.dev, LCP**. [artículo](https://web.dev/articles/lcp) | Los bloques con nodos de texto son candidatos; el `canvas` no aparece; con fuentes web, el texto no cuenta como pintado durante el periodo de bloqueo. **No dice nada de contenido generado (`::before`)**. | El `h1` es texto real y candidato seguro. El póster SSR va en `data-art` con `::before` (03): si Chrome no lo cuenta, el LCP es el `h1`; si lo cuenta, el póster ya está en el HTML. Diseñado para pasar en ambos casos; **no verificado**, se mide en M1. |

**Qué añade cada informe previo, y dónde me aparto** (todo lo que no aparece aquí se adopta tal cual):

- **01 (showcase)**: adopto el campo Marea con el alfabeto `y a A G`, los pozos de lectura, los corchetes como sintaxis de interfaz, las cuatro esquinas y la barra inferior móvil, y el criterio arte/gimmick (§11). Me aparto en la tipografía: 01 propone Bricolage para titulares; yo, solo mono (03).
- **02 (GPU)**: adopto el P3 (sello con atlas y `texelFetch`) como **API pública** para dibujar celdas y el tope de tinta detrás del texto. **No uso** las pasadas P0 a P2 (campo, sombreado, celda por GPU) porque en Cartel el estado normal de una celda es una palabra sólida y el agua solo se evalúa donde está mojada (0,9 ms de CPU para el campo completo de 8 000 celdas en Node [M]). Sin lupa braille (no hay Braille en Geist Mono): la lente del hero actual se sustituye por el calor del puntero.
- **03 (tipografía)**: adopto Geist Mono única, `latin` + `symbols2`, celdas de 6×12, 9×18 y 12×25 px, `--art-lh`, `data-art` con `::before`, el fallback a 100 %, los pesos mínimos por cuerpo y los glifos permitidos. Me aparto en el generador de palabras: **Bricolage Grotesque como modelo de forma** (no Unbounded ni ANSI Shadow) y con retoque manual permitido.
- **04 (contenido)**: adopto el copy, el orden de servicios (web, automatización, marketing, IT), los datos locales con fecha, el bloque «Quiénes somos», la medición por WhatsApp etiquetado y el JSON-LD `Organization` + `Service` (sin `LocalBusiness`; 06 proponía `ProfessionalService`, que hereda de `LocalBusiness`: gana 04).
- **05 (ilustración)**: adopto `Grid` de 4 bytes, el atlas de bloques por código, WebGL2 de textura de celdas con respaldo 2D por diferencias, el ruido azul 64×64, los tonos T0 a T15 y el ciclado de paleta. Me aparto en las escenas: los cinco «cuadros» de 05 (web, mkt, it, ai, sd) se sustituyen por palabras-material; Santo Domingo (Obelisco, Catedral, Faro) queda **fuera** de la v1 (decisión del dueño, §12).
- **06 (arquitectura)**: adopto todo el esqueleto: un campo fijo, escenas puras por celda, costura en el borde real de cada `section`, pozos, sueño a 1,6 s, tiers 9 000/6 500/4 200/2 400, sin GSAP ni Lenis, MPA con `@view-transition`. Añado dos relojes por cartel (`a` de llegada y `d` de permanencia, §5) y convierto la costura en **marea**.

---

## 2. El concepto en diez reglas

1. **Una palabra por cartel, y la palabra es el material.** Nada de ilustración aparte: la palabra es la ilustración. (Gomringer: estructura = contenido.)
2. **Quieto es el estado normal.** Un cartel no se mueve solo. Todo movimiento nace del scroll, el puntero, el foco o el toque, y termina volviendo a un fotograma estático hermoso.
3. **El agua es la tinta de la marca.** Lo que se derrite se vuelve agua (rampa `' · : = * y a A G'` con el nombre de la marca como alfabeto), y el agua es lo que cristaliza en la palabra siguiente.
4. **Rótulo de bloques: cara, aro, luz y sombra.** Toda palabra sólida tiene una cara, un aro de una celda, luz de borde arriba a la izquierda y sombra proyectada de (+2, +1) celdas (figura de tonos en §4). Es el oficio de los logos ANSI y de los rótulos.
5. **Mucho aire.** ≥ 40 % de las celdas de cada pantalla están vacías. El «susurro» de fondo sigue los filamentos de la marea y ocupa ≤ 8 % de las celdas de aire (medido 7,6 % [M]); no es una trama de puntos.
6. **Contraste dramático de escala en cuatro peldaños**: palabra gigante (324 px de letra), titular (60 a 96 px), cuerpo (17 px), etiqueta (13 a 14 px). Razón entre el primero y el tercero: casi 20 a 1.
7. **El texto real nunca compite con el arte.** Va en pozos de lectura con el tono del campo topado por contraste calculado; las palabras gigantes viven en zonas sin texto.
8. **Cada movimiento ilustra un proceso real** (Year of the Horse, informe 01): una obra que se construye, agujas que se alinean, un eco que se expande, una luz que vuelve. Nada decora.
9. **La interfaz se explica sola.** Sin una línea de texto instructivo. El encendido de 2,6 s enseña la mecánica sin palabras: el agua pasa por la portada y deja las letras.
10. **Nada de disfraz.** Ni ventana de terminal, ni prompt, ni verde Matrix, ni cursor parpadeante decorativo, ni CRT. Los referentes de este cartel son el rótulo, el neón, el plano y el afiche suizo.

**Lo que se descarta a propósito** (para que nadie lo proponga después): tramas de puntos uniformes (PRODUCT.md), texto con degradado, vidrio esmerilado, cursivas, numeración visible de secciones, pantallas de carga o «tap to enter», scroll horizontal, `position: sticky` a 100svh, Lenis, GSAP, iframes, vídeo o 3D para hacer ASCII, y todo símbolo fuera del alfabeto seguro (`→ ← ■ ● ◆ ▲ ✓`, Braille, emoji).


---

## 3. Tipografía, celda y escala

### 3.1 Una sola familia: Geist Mono Variable

Decisión: **Geist Mono Variable (OFL-1.1) es la única familia de toda la página**, del microdato al h1 y a las palabras gigantes (informe 03 §4). Razones:

- Es una de las tres únicas mono de fontsource que sirven cajas y bloques (subset `symbols2`) y **no tiene ligaduras ni `calt`** que rompan la rejilla [03, M].
- Con una familia el peso baja: `latin` 23,1 KB + `symbols2` 5,8 KB = **28,9 KB**, ambos precargados; se retiran los 68,6 KB de Bricolage de la portada (03 §2.2).
- El cartel gana coherencia: la celda de 0,6 em × paso entero es la misma unidad de un microdato de 13 px y de una letra de 324 px. Es la idea de Crouwel llevada al extremo: **una sola retícula de la mínima a la máxima escala**.
- Riesgo declarado (§12): el titular en mono puede leerse «tech». Lo compensan la escala (h1 de 96 px), la composición de cartel y el color Cobalto. **Plan B** si al dueño no le convence: Bricolage 800 solo en h1/h2/h3 (+~30 KB, y corregir su fallback, que sale con `size-adjust` 132,57 % en vez de 111,04 %, 03 §1.5). Las palabras gigantes no cambian: su forma ya viene de Bricolage (§3.4).

Carga (03 §2.2, opción A, verificar en `dist/`): proveedor `local` con dos variantes (`latin` primero, luego `symbols2`), `font-display: swap`, fallback `Gaya Mono Fallback` con `size-adjust: 100%`, `ascent-override: 100.5%`, `descent-override: 29.5%` (nunca terminar la pila en `monospace` a secas: en Windows es Consolas, de 0,55 em). Añadir Geist Mono a `CREDITS.md`.

### 3.2 La escala: cuatro peldaños

| Peldaño | Uso | Tamaño | Peso | Interlínea | Regla |
|---|---|---|---|---|---|
| **Palabra** | arte, 11 a 22 filas | celda 6×12, 9×18 o 12×25 px (§3.3) | 500 | `--art-lh` (paso entero menos 1 px) | `aria-hidden`, `translate="no"`, `user-select: none` |
| **Titular** | h1 y h2 | h1 `clamp(2.75rem, 1rem + 7.4vw, 6rem)` = 44 a 96 px · h2/h3 `clamp(1.75rem, 1rem + 3.4vw, 3.75rem)` = 28 a 60 px | 800 | 1,02 a 1,05 | tope 6 rem (DESIGN.md), `letter-spacing: 0` (nunca negativo en mono, 03), `text-wrap: balance` |
| **Cuerpo** | párrafos, listas, `dd` | `clamp(1rem, .94rem + .25vw, 1.125rem)` = 16 a 18 px (17 px típico) | 400 | 1,65 | ≤ 62 ch, sin justificar, párrafos ≤ 5 líneas, `text-wrap: pretty` |
| **Etiqueta** | corchetes, `dt`, «Incluye», microdatos | 14 px (etiquetas) y 13 px (microdatos) | 500 | 1,4 | color `--muted`; el corchete es `::before/::after` con `content: "[ " / ""` para que no se lea |

La promesa de cada servicio (frase de ≤ 56 columnas, informe 04) va en 500 a `clamp(1.25rem, 1.05rem + 1vw, 1.75rem)`.
En escritorio, cada salto entre los tres primeros peldaños es de al menos 3 a 1 (palabra:h1 = 324/96 = 3,4; h2:cuerpo = 60/17 = 3,5) y la palabra mide 19 veces el cuerpo (324 / 17). La etiqueta no es un peldaño de escala sino de función: es la voz baja de la interfaz. Es lo que pide el contraste dramático del cartel.

### 3.3 La celda

Métricas de 03 (avance 0,600 em; paso de arte `--art-lh: calc(round(down, 1.3em, 1px) - 1px)`, medido sin costuras en 72 de 72 combinaciones de DPR y cuerpo). El tamaño de celda depende del ancho del visor, no del dispositivo:

| Visor | Cuerpo del arte | Celda CSS | Columnas útiles (ancho / celda) | Filas típicas |
|---|---|---|---|---|
| < 640 px | 10 px | 6×12 | 53 (320) · 62 (375) · 65 (390) · 69 (414) | 60 a 76 |
| 640 a 1599 px | 15 px | 9×18 | 71 (640) · 85 (768) · 113 (1024) · 142 (1280) · 160 (1440) | 44 a 56 |
| ≥ 1600 px | 20 px | 12×25 | 133 (1600) · 160 (1920) | 36 a 43 |

- El lienzo usa la misma celda CSS por `min(dpr, 2)` en **píxeles de dispositivo enteros** (`ch = 2·cw`); los tiers de 06 solo agrandan la celda de 1 px en 1 px si se supera el tope de celdas (9 000, 6 500, 4 200, 2 400).
- El póster SSR (DOM) usa los tamaños de la tabla con `font-size: min(calc(100cqi / (cols * 0.6)), 20px)`. Con DPR fraccionario (1,5; 2,625) la celda del lienzo y la del DOM pueden diferir hasta 0,5 px por celda: **el póster SSR y el lienzo no se superponen, se funden** (fundido de 320 ms, tolerancia de registro ≤ 1 celda de ancho, prueba en cinco anchos, §9).
- Reservas sin CLS: `aspect-ratio` y `min-block-size` de la caja; medir la celda tras `document.fonts.load` y comprobar `length > 0` (nunca `document.fonts.check()`, que devuelve `true` sin la fuente, 02 §9).

### 3.4 Las palabras: de dónde salen

Las nueve palabras (once con inglés) se generan **una vez** con `scripts/words.mjs` y se guardan como datos (`words.gen.ts`); en producción no hay fuente ni generador. Proceso probado en Node [M]:

1. **Modelo de forma**: Bricolage Grotesque (OFL; la cara de titulares actual del sitio; sale de `@fontsource-variable/bricolage-grotesque`, se instancia por defecto y se engorda con un trazo de 0,03 em para simular el peso 800; para el peso real, un TTF estático de `@fontsource/bricolage-grotesque`). `fontkitten` extrae los contornos y `sharp` rasteriza a **2 subpíxeles por columna y 2 por fila** con la proporción exacta de la celda (1:2): si la proporción está mal, las letras salen 2 veces más altas (error que cometí en el primer intento y corregí, Apéndice A.2).
2. **Cuadrantes**: cada celda es un número de 0 a 15 (los 16 módulos de Albers); la tabla `[' ','▘','▝','▀','▖','▌','▞','▛','▗','▚','▐','▜','▄','▙','▟','█']` los traduce a glifo.
3. **Ajuste a filas**: `fit(palabra, filas)` busca por bisección las columnas que dan las filas de diseño. Ancho de 18 filas [M]: GAYA 152 columnas, HOLA 145, WEB 125, LISTO 151, ECO 111, ON 82, VER 109; en inglés HELLO 168, READY 170, ECHO 150, SEE 104 (HELLO y READY superan las 150 columnas y se dibujan a 15 o 16 filas).
4. **Codificación**: RLE de 1 byte por corrida (nibble alto = módulo, nibble bajo = recuento − 1, hasta 16 repeticiones), con **ida y vuelta comprobada**: las once palabras anchas suman **3 924 bytes, 2 152 con gzip y 1 914 con brotli** [M] (el esquema de 2 bytes por corrida ocupa 7 104 B, 2 404 gz).
5. **Variantes por ancho de rejilla**: `stack` (< 100 columnas: dos líneas de ≤ 3 letras, 12 filas por línea, o una línea al 100 % del ancho para las palabras de ≤ 3 letras), `mid` (100 a 139) y `wide` (≥ 140). El motor elige la mayor que quepa con 4 columnas de margen.
6. **Retoque manual permitido**: son datos. Antes de aprobar, un diseñador puede corregir celdas (la `G` de GAYA, por ejemplo) y el cambio queda en el repositorio; `words.mjs` no lo pisa (`--keep-edits`).

| Cartel | Palabra `wide` (columnas × filas) | Ancho sobre 160 | Alineación | `stack` (móvil) |
|---|---|---|---|---|
| Portada | GAYA 152×18 | 95 % | centro | GA / YA, 2×12 filas |
| Nosotros | HOLA 125×15 | 78 % | izquierda | HO / LA, 2×12 |
| Web | WEB 125×18 | 78 % | derecha | una línea 52×8 |
| Automatización | LISTO 148×17 | 93 % | centro | LIS / TO, 2×12 |
| Marketing | ECO 111×18 | 69 % | izquierda | una línea 52×9 |
| Soporte IT | ON 82×18 | 51 % | derecha | una línea 40×11 |
| Referencias | VER 109×18 | 68 % | centro | una línea 52×9 |
| Proceso (en el DOM, §6.8) | HOLA 60×8 arriba y LISTO 76×9 abajo, unidos por un hilo vertical | 38 % y 48 % | izquierda | HOLA 44×6 y LISTO 52×7 |
| Contacto | GAYA 138×16 con reflejo | 86 % | centro | GA / YA con reflejo corto |

Valores de partida: se ajustan a ojo en M2 y M3. Las palabras cortas del móvil (WEB, ECO, ON, VER) quedan en 8 a 11 filas (96 a 132 px de letra), más pequeñas en proporción; el experimento «rotar 90° las palabras de 2 y 3 letras» queda como opción de M4 (§12).

---

## 4. Cobalto: tonos, rótulo y legibilidad

### 4.1 La escalera de 16 tonos

Los 16 tonos salen de interpolar en OKLCH los cuatro tokens de `tokens.css` (T0 = `--glow-0` = `--surface`, T5 = `--glow-1`, T10 ≈ `--glow-2`, T15 = `--glow-3`), con recorte de croma como `src/lib/color.mjs`. Recalculados y medidos con las funciones del propio proyecto [M]:

| Tono | Hex | L OKLCH | vs `--surface` | `--ink` sobre el tono | `--lead` sobre el tono | `--muted` sobre el tono |
|---|---|---:|---:|---:|---:|---:|
| T0 | `#02051b` | 0,130 | 1,00 | 17,98 | 16,42 | 9,75 |
| T1 | `#040c34` | 0,180 | 1,06 | 16,92 | 15,45 | 9,18 |
| T2 | `#07134f` | 0,230 | 1,17 | 15,37 | 14,04 | 8,34 |
| T3 | `#0b1b6c` | 0,280 | 1,33 | 13,48 | 12,31 | 7,31 |
| T4 | `#0f238a` | 0,330 | 1,57 | 11,47 | 10,48 | **6,22** |
| T5 | `#122caa` | 0,380 | 1,88 | 9,55 | 8,72 | 5,18 |
| T6 | `#143fbf` | 0,436 | 2,41 | 7,47 | **6,83** | 4,05 |
| T7 | `#1753d4` | 0,492 | 3,09 | **5,82** | 5,31 | 3,16 |
| T8 | `#1c66ea` | 0,548 | 3,96 | 4,54 | 4,15 | 2,47 |
| T9 | `#2179ff` | 0,604 | 5,03 | 3,58 | 3,27 | 1,94 |
| T10 | `#4390ff` | 0,660 | 6,39 | 2,81 | 2,57 | 1,53 |
| T11 | `#52a7ff` | 0,716 | 8,03 | 2,24 | 2,04 | 1,21 |
| T12 | `#6bbdff` | 0,772 | 9,91 | 1,81 | 1,66 | 1,02 |
| T13 | `#88d0ff` | 0,828 | 12,04 | 1,49 | 1,36 | 1,23 |
| T14 | `#abe2ff` | 0,884 | 14,43 | 1,25 | 1,14 | 1,48 |
| T15 | `#d1f1ff` | 0,940 | 17,07 | 1,05 | 1,04 | 1,75 |

(`--ink` = `#edf2f8`, `--lead` = `#e1e9f2`, `--muted` = `#a4b6ce`. Mis hex difieren de la tabla de 05 §2.1 en ≤ 3 unidades por canal desde T9 por el recorte de croma; la fuente de verdad es el generador de 05 B.3 sobre `tokens.css`. Pendiente: añadir los pares de §4.3 a `tokens.json` para que `npm run contrast` los compruebe.)

**Reparto del área** (por pantalla, sobre las celdas no vacías): T0 a T2 para el susurro y la sombra profunda; T3 a T5 para el agua profunda y los pozos; T6 a T8 para el cuerpo eléctrico (caras y agua): ≤ 30 % del área en la portada y ≤ 45 % en los carteles sólidos; **T9 o más: ≤ 6 %**; T11 (aro): ≤ 5 %; T13 a T15 (luz de borde, cresta de la marea, chispas): ≤ 2 %, y T14 y T15 ≤ 0,5 %.

### 4.2 Anatomía de una palabra sólida: cara, aro, luz y sombra

Cada palabra sólida (la H de HOLA, WEB publicada, ECO, el aro de GAYA) se compone así, medida en celdas:

- **cara** T8 (o agua T5 a T9 si la letra es «de agua»),
- **aro** de 1 celda (celdas llenas a ≤ 1 celda del borde) en T11,
- **luz de borde** T13 en las celdas cuyo vecino de arriba o de la izquierda está vacío,
- **sombra proyectada** desplazada (+2, +1) en T3, con glifo `░`.

```text
                                         ······································
             ▗▄▄▄▄▄▄▄▄▄▄▖                ·············DDDDDDDDDDDD·············
             ▟██████████▙░░              ·············DBBBBBBBBBB833···········
            ▐████████████▌░              ············DBB88888888BBD3···········
           ▗██████████████▖░             ···········DBB888BBBB888BBD3··········
           ▟██████▌▐██████▙░░            ···········DB888BB88BB888B833·········
          ▐██████▛░░▜██████▌░            ··········DBB888B833DB888BBD3·········
         ▗███████▘░░▝███████▖░           ·········DBB888BB833DBB888BBD3········
         ▟██████▛░░░ ▜██████▙░░          ·········DB8888B8333·DB8888B833·······
        ▐███████▄▄▄▄▄▄███████▌░          ········DBB8888B8DDDD8B8888BBD3·······
       ▗██████████████████████▖░         ·······DBB88888BBBBBBBB88888BBD3······
       ████████████████████████░░        ·······DB8888BBBBBBBBBBBB8888BB33·····
      ▟███████▀▀▀▀▀▀▀▀▀▀███████▙░        ······DB8888BB8888888888BB8888BD3·····
     ▗███████▛░░░░░░░░░░▜███████▖░       ·····DBBBBBBB83333333333DBBBBBBBD3····
     ▀▀▀▀▀▀▀▀▘░░        ▝▀▀▀▀▀▀▀▀░░      ·····D8888888833········D8888888833···
      ░░░░░░░░░░         ░░░░░░░░░░      ······3333333333·········3333333333···
                                         ······································
                                         ······································
```

Izquierda: glifos. Derecha: mapa de tonos en hexadecimal (`D` = T13, `B` = T11, `8` = T8, `3` = T3, `·` = T0). Es la receta de los logos ANSI y de los rótulos con sombra, con el oficio de 05 §2.3 (luz de borde, planos con contraste decreciente, un foco por escena).

### 4.3 Legibilidad: pozos con contraste por construcción

El texto real está siempre encima del lienzo. Cada bloque de lectura declara un pozo y el motor **topa el tono del campo** dentro de él (06 §4.4). Tabla de topes, derivada de §4.1 con margen [M]:

| Pozo (`data-well`) | Texto encima | Tono máximo | Contraste peor caso |
|---|---|---|---|
| `ink` | titulares y CTA en `--ink` | T7 | 5,82:1 |
| `lead` | párrafos y listas en `--lead` | T6 | 6,83:1 |
| `muted` | etiquetas, `dt`, datos locales en `--muted` | T4 | 6,22:1 |
| `chrome` | esquinas y barra móvil (chip sólido) | T3 | ≥ 7,3:1 |
| `none` | zona reservada al arte (sin texto) | sin tope | (sin texto) |

- El peor caso es la cobertura total del fondo de la celda; con glifos de 15 a 25 % de tinta es mejor, pero WCAG se evalúa sobre el píxel.
- **Nunca** hay texto sobre T8 o más claro. `--glow-2` y `--glow-3` (T10, T15) jamás bajo texto.
- Borde de pozo: 2 celdas de fundido, nunca a cero (queda un susurro que integra el arte con la página, 01 §5.6). El mapa de topes es una textura R8 por celda (02 §4.1 `setMask`) recalculada con `ResizeObserver`, `document.fonts.ready` y cambios de ancho; con zoom del navegador del 200 % y 400 % se re-mide y el mínimo es de 24 columnas.
- **Fantasma en permanencia**: durante `d > 0,1` el arte de todo el cartel baja a un tope de T6 (`ghost(d)`), de modo que el texto largo nunca cruce un contraste brusco. La palabra recupera su brillo cuando llega la marea siguiente.
- Texto en móvil: el tope `lead` es T6 y `muted` T4; el pozo cubre todo el bloque con 1 celda de margen.
- Estados de foco: anillo de 2 px con `--accent-text` (11,34:1 sobre `--surface`, 03 §1.10). Medido contra los tonos que pueden quedar bajo un enlace enfocado: T5 6,18:1 · T6 4,83:1 · T7 3,76:1 [M]; como los pozos topan en T7, el foco siempre supera 3:1 (WCAG 2.2, 1.4.11).

### 4.4 Alfabeto y materiales de glifo

| Familia | Glifos | Uso | Se dibuja |
|---|---|---|---|
| Módulos | `▘▝▖▗▚▞▛▜▙▟▀▄▌▐█` | palabras (aro, cara, luz) | por código, sin costuras (05) |
| Sombras | `░ ▒ ▓` | sombra proyectada, obra, reflejo | por código |
| Agua | `· : = * y a A G` y `▒` como punto caliente | material del cartel de la marca y de la marea | `fillText` (Geist Mono 500) |
| Línea | `─ │ ╱ ╲ ╌` y los gruesos `━ ┃ ╋` | eco, agujas, hilo | por código (**añadir los gruesos al atlas de 05**, que solo trae simple, redondo, doble y ASCII) |

Prohibidos dentro de la rejilla (caen a la fuente del sistema y cambian de ancho, 03 §1.3): `→ ← ✓ ■ ● ◆ ▲ ▶ ★ ≈ ≠ ≤ ≥`, Braille, emoji. Flechas de interfaz: `>` y `»`.

---

## 5. La página: orden, relojes, marea y navegación

### 5.1 Orden y alturas

Una URL por idioma (`/` y `/en/`), ids localizados (06 §4.7 y decisión 16; en `Nav.astro` hoy los enlaces apuntan a `#servicios` también en inglés: hay que localizarlos y activar los `READY.*`).

| Cartel | id ES / EN | Alto mínimo | Contenido real, en orden |
|---|---|---|---|
| Portada | `inicio` / `home` | 100svh | h1, lead, CTA WhatsApp, enlace a referencias, microdato |
| Quiénes somos | `nosotros` / `about` | 130svh | h2, siete líneas, firma, microdato de Santo Domingo |
| Servicios (grupo) | `servicios` / `services` | (sin altura propia) | h2 solo para lectores (`sr-only`) |
| Web y apps | `web` / `web` | 100svh + detalle ≈ 90svh | h3, promesa, CTA, Incluye, dl, datos locales |
| Automatización e IA | `automatizacion` / `automation` | ídem | ídem |
| Marketing y redes | `marketing` / `marketing` | ídem | ídem |
| Soporte e infraestructura IT | `soporte` / `it` | ídem | ídem |
| Referencias | `referencias` / `references` | 110svh | h2, filas de referencias, sello, enlace a la galería |
| Proceso | `proceso` / `process` | 110svh | h2, cuatro estaciones |
| Contacto | `contacto` / `contact` | 100svh | h2, WhatsApp, correo, teléfono, redes, pie |

Total: unas **13 a 15 pantallas** (hoy es una). Ritmo: cada cartel alterna un tramo de **aire** (solo arte, ≤ 70svh, `aria-hidden`) con un tramo de lectura; el aire suma ≤ 25 % del total. Sin numeración visible, sin rótulos sobre cada sección (PRODUCT.md). Semántica: `main > section[id][aria-labelledby]`; un solo h1; h2 por sección; h3 por servicio dentro del grupo `servicios`.

### 5.2 Dos relojes por cartel

Las escenas no reciben coordenadas de documento sino dos relojes normalizados, más energía y calor. Con `V` = alto del visor (`lvh`), `top` y `H` = borde superior y alto de la sección en coordenadas de documento (en caché, 06 §4.3):

```ts
const s0 = (top - scrollY) / V;                          // 1: la sección asoma por abajo · 0: su borde toca el techo
const a  = 1 - clamp(s0, 0, 1);                          // LLEGADA 0→1 mientras sube por el visor (el cartel se forma)
const d  = clamp(-s0 / Math.max(H / V - 1, 0.001), 0, 1);// PERMANENCIA 0→1 desde que toca el techo hasta que su final toca el fondo
```

Casos límite: si `H ≤ V` (sección de una pantalla), `d` se fija a 1 en cuanto el borde superior toca el techo; en la última sección, `d = 1` cuando el documento llega a su fin (su `H` se mide hasta el pie). Por eso los carteles cuyo guion usa `d` tienen sección de al menos 110svh.

`a` gobierna cómo se forma el cartel; `d` gobierna su guion (la obra que se rellena, las agujas que se alinean, el apagón). Como las escenas son **funciones puras de (a, d)**, avanzar y retroceder es gratis y el estado estático de cada cartel es simplemente un par de relojes (`still`). El puntero suma **calor** (§6.0) y el scroll suma **energía**: `energy = max(energy · e^(−dt/0,9), min(1, v/2400))`, con `v` la velocidad de scroll en px/s (06 §4.2).

### 5.3 La marea: la costura entre carteles

La costura de 06 D5 (escena por fila según su posición en el documento, banda con «pliegue de luz») se convierte en **una marea**: una línea de agua ondulada que sube por la pantalla pegada al borde real de la sección siguiente, deshace el cartel que sale y cristaliza el que llega.

```ts
// yb: fila de pantalla del borde superior de la sección k+1;  c: columna;  r: fila
const yb    = (top[k + 1] - scrollY) / ch;
const front = (c: number) => yb + 14 * (fbm(c * 0.05, 3.7, 3, 9) - 0.47) + 1.1 * Math.sin(c * 0.12);   // frente ondulado (±7 filas)
const dist  = r - front(c);          // < 0: arriba, cartel k que sale · > 0: abajo, cartel k+1 que llega
const BAND  = isMobile ? 3 : 4;      // semiancho de la banda de agua, en filas
```

- **Banda** (`|dist| ≤ BAND`): agua pura, densidad `marea(c, r) · (1 − |dist|/BAND)`, tonos T4 a T8, con la cresta en T13 (≤ 0,5 % de las celdas).
- **Arriba del frente** (cartel que sale): las celdas a ≤ 8 filas de la banda se «mojan» con un umbral por celda (`τ = 0,55 · bn + 0,45 · fbm`): **primero se vacía el interior de la letra, después se disuelve el aro** (queda un instante como contorno fantasma).
- **Debajo del frente** (cartel que llega): **primero aparece el aro, después el interior** (nucleación: ruido azul 64×64 anclado a la celda), de modo que HOLA se lee por su contorno antes de llenarse.
- Sin autonomía: el frente solo se mueve con el scroll (su posición es geometría del documento).
- `prefers-reduced-motion`: **corte seco** en el borde de la sección, sin banda.

```text
       ·
                                  ·                                  ·               ··
              ▄▄███████▄▄▖          ▗███████▖      ▐█████▖      ▟█████       ▟██████▙·
           ▗▟█████████████▙▖       ▗██AGA=:██       ▜██*██▖    ▟██A██▘      ▐██=*ya██▙     ··
 ··       ▗█████▛▀▀▀▀▀█████▙       ▟█y████:=█▙       ▜██*██▖  ▟██a██▘··    ▗██:████G██▖     ·
     ·    ██ay█▛   · ·▝█▀▀▀·      ▐██*█▛·██*██▖       ▜██y██▖▐█████▘    ·  ▟█:██▌▝██G██          ·
···   ·  ▗█ay*█▌    ▄▄▄▄▄▄▄▄▖    ▗██a██▘·▝██y██        ▀██A██████▛▘     · ▐██a█▛  ▜█Aa█▙·
· ··     ▝█ay=█▌    ████████▌    ▟█aA█▛   ▜█Ay█▙        ▝██▒▒▒██▛        ▗██GG█▘· ▝█Aa██▖
·         ██ay█▙    ▀▀▀█***█▌   ▐██aa███████Gy██▌        ▝█GG▒█▛·        ██GAA██████***██
          ▝██y██▙▄▖ ▗▄▟███y█▌  ▗██y██████████y*██▖        █AAG█▌        ▟█GG██████████*=█▙
·          ▝███████████▛▐█y█▌  ██**█▛       ██y*█▙        ██AA█▌       ▗██A██▌ ···· ▝██:██▌
·            ▝▀▜█████▀▘ ▝███▌ ▐█████▘    ·  ▝█████▌  ·    ▜████▌       █████▛        ▜█  ██
:··                                    · ·      ·      ·           ·     ··  ··::···:·····
*=:··:=**:·                 ·:::····::=::····     ·     ·     · · ··· ···· :=*y*=:=*aaa*:::··
*=::=*yAA*=::·            ··==*===*yaaaay*y*=::·   ·       ·······   · · ·=aGa▒▒GAaaaAGay**=:··
y*****yA▒▒GAay*=··     ···:=*yaaaaAG▒▒▒▒AyGGy**=:::· ·     ·········  ·:=yA▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒Ay*=:··
**yyyaAA▒▒▒▒▒▒▒Gy=:······:=*aAAAAG▒▒▒▒▒GaaG▒▒Aayyy**=:·  ·:::·     ·:=*yAG▒▒▒GAAG▒▒▒▒▒▒▒▒▒▒GAay*==:=
*===*aAaaaA▒▒▒▒▒▒Ay*===:::=yy***yyay*=****a▒▒GGAAaaay*****ya=:·······:*G▒▒▒▒a*::*AAaay==*yaA▒▒▒▒GAyy
:::·:*ay***yG▒▒▒▒▒Gayyy*=::::::::====:====*aAaaAGG▒GAaaAG▒Ga*=:::::::==a▒▒▒y:·   ·:::····::::=*A▒▒▒▒
     :::::=*aaAAAAayyy**=::·······::······:=*yyyyaG▒▒▒▒GAaaay***yyyyyy***ya*·  █y       ·  ·::·:*aAG
           ··:==========::··  █             ·:::=*yaG▒▒Gy****yA▒▒▒▒▒GGGGAy=·█ ▜█A██▖  ·  ·    ·:::::
                ···::::····:·y█   ██AA█▌·       ·::==*y*:::=yGAy*=::····  A█▌ ▝██·█▙    ·  ·    :=::
              ▐█A       ███a·:█   ██yy█▌      ▐█:A  ·······:*=::··      █a·█   ▜█·██▌       ·     ··
              ▐█A:█▌      █:ay█   ▜█:·█▙   ·  ▟█yy█▛         ···      ██ya:██████aA██▖ · ·  ·    ·
              ▐█aa█▌      █a:a█    █████▙▄  ▄▟█████    █:Ay█▄▄▄▄▄▄▄▖ ▟█a:█████████:A█▙ ···· ·   ·
              ▐█Aa█▌   ·· █yA██     ▜████████████▛     █·:·████████▌▗██·██▘      ██y██▌   ···    ·
  ·· ·        ▐████▘·    ·████▛      ▝▀▀██████▀▀·      ████████████▘▜████▛       ▝█████  ·· ·· ··  ·
       ··           ·                        ··                     ·                      ··      ·
         ··         ·      ···
          ·      ··       ·· ·           ·                                            ··· · ·
               ··· ···          · ····· ·
         ·        ··  ·             · ·                          ·
```

Un fotograma de la marea entre GAYA y HOLA (especímenes a 100 columnas): GAYA arriba con el agua ya comiéndose su base, la banda en el centro, HOLA cristalizando debajo. El frente real se mueve con el scroll durante un visor completo.

### 5.4 Qué está «mojado»: una gramática de tres estados

Cada celda de cartel puede estar **sólida** (palabra con su cara, aro, luz y sombra), **mojada** (la mitad de un fundido) o **agua** (rampa `· : = * y a A G`). Los estados entran por cuatro fuentes que el motor combina con un máximo:

`wet = max(marea, calor, ignición, guion(d))`. La celda pasa a agua si `wet > τ(celda)`, con `τ` = ruido azul más un sesgo de borde (el aro se moja el último al deshacer y se forma el primero al cristalizar). Memoria por celda (`mem[i]` con suavizado, 06 §4.3) e histéresis de glifo: el agua nunca parpadea, y **ninguna oscilación global supera 2 Hz** (WCAG 2.3.1; cambios independientes por celda y suavizado de tono de τ ≈ 250 ms, de modo que ni un scroll de ida y vuelta produzca destellos).

### 5.5 Navegación

**Cuatro esquinas fijas** (01, patrón Dragonfly; en escritorio), cada una un **chip sólido** (`--surface` al 92 %, borde `--line`, sin desenfoque) con texto entre corchetes:

| Esquina | Contenido | Comportamiento |
|---|---|---|
| Arriba izquierda | `▞ Gaya Digital` | vuelve al inicio; el `▞` (cuadrante, `aria-hidden`) sustituye al orbe provisional hasta que el diseñador entregue el logo |
| Arriba derecha | `[ Menú ]` | abre el índice; `aria-expanded`; `Esc` cierra; el foco vuelve al botón |
| Abajo izquierda | `[ ES │ EN ]` | enlace al otro idioma (`hreflang`); el idioma actual en 800 |
| Abajo derecha | `[ WhatsApp ]` con icono | siempre visible; abre `wa.me` con el mensaje del contexto (genérico, o el del servicio o referencia que se está mirando) |

- **Móvil** (< 640 px): esquina superior izquierda y derecha como en escritorio; abajo, una **barra fija** (≥ 44 px, `--surface` sólido, borde superior de 1 px) con `[ ES │ EN ]` pequeño a la izquierda y **WhatsApp dominante** a la derecha (`env(safe-area-inset-bottom)`). Sin `backdrop-filter`.
- **Índice** (`[ Menú ]`): lista a pantalla completa con los cinco destinos (Quiénes somos, Servicios, Referencias, Proceso, Contacto), los cuatro servicios como subenlaces, correo y WhatsApp. El actual lleva `aria-current="location"` (scroll-spy con `IntersectionObserver`, `rootMargin: -45% 0 -50% 0`, sin tocar el historial). Implementación sin JS: elemento `popover`; el resto (foco, `aria-expanded`) con 15 líneas.
- **Espina** (≥ 900 px): a la derecha, nueve marcas `─` (una por cartel), la actual en `━`; cada marca es un enlace con `aria-label` = nombre de la sección; al pasar o enfocar aparece a su izquierda la palabra del cartel en 13 px mono (`GAYA`, `HOLA`, `WEB`, `LISTO`, `ECO`, `ON`, `VER`, `HOLA·LISTO`, `GAYA`). Un cabezal de luz (`▒`) baja por la espina con el scroll con CSS `animation-timeline: scroll()` (compositor; sin soporte, queda fija en su marca). En móvil: un riel de 2 px en el borde derecho.
- Anclas: `scroll-padding-top: 5.5rem`; `scroll-behavior: smooth` solo con `prefers-reduced-motion: no-preference`.
- Transiciones entre páginas: `@view-transition` nativo (06 D8): la marca y las esquinas con `view-transition-name`, cruce de 240 ms; el mismo motor se monta en `/referencias/` con el cartel quieto.


### 5.6 Composición del texto real de un servicio

Es la misma en los cuatro (y, con menos bloques, en los demás carteles). El **cartel** ocupa la primera pantalla y el **detalle** la segunda; el arte, fijo, baja a un tope de T6 cuando empieza el detalle. Rejilla de 12 columnas, márgenes de `--gutter`, texto a la izquierda y sin justificar (estilo suizo, §1).

```text
┌ pantalla 1 · el cartel ────────────────────────────────────────────────────────────────┐
│                                                          ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄          │
│                              WEB, fija, a la derecha     ████████████████████          │
│                              (arte en el lienzo)         ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀          │
│                                                                                        │
│   Desarrollo web y apps                 h3 · mono 800 · 60 px · columnas 1 a 7         │
│   Tu web, rápida y lista para           promesa · mono 500 · 26 px · ≤ 56 columnas     │
│   vender por WhatsApp.                                                                 │
│   [ Escribir por WhatsApp ]             CTA · ≥ 44 px                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌ pantalla 2 · el detalle (el arte a ≤ T6) ──────────────────────────────────────────────┐
│   Incluye                               Para quién                                     │
│   ├─ Diseño propio, primero el celular  Negocios con o sin local, marcas personales…   │
│   ├─ Sitio en español, en inglés…       Necesitamos                                    │
│   ├─ Botón de WhatsApp con el mensaje…  Logo y colores (o los definimos juntos)…       │
│   ├─ … (7 líneas, ≤ 52 columnas)        Resultado                                      │
│   └─ Publicación con HTTPS, respaldo…   Una URL en vivo, medida en velocidad…          │
│   columnas 1 a 6                        columnas 8 a 12                                │
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   3 datos locales · 13 px · «Verificado 30 sep 2026»                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Escritorio de 1440×900; cada bloque de texto es un pozo (`lead`, `ink` o `muted`). En móvil (390×844): una sola columna, el arte arriba y el texto debajo, sin columnas paralelas.

- **«Incluye» como árbol**: `ul[role="list"]` con marcadores `├─` y `└─` en `::before` (`content: "├─ " / ""`, 03 §2.5); es texto de lista real, no arte. Las tres etiquetas de campo (`dt`) van en 14 px `--muted`.
- **Datos locales**: tres líneas de 13 px con el sello «Verificado 30 sep 2026» como insignia de estado; son contenido con fecha, no instrucciones (04 §2.0).
- **Revelado**: cada bloque entra con `animation-timeline: view()` (opacidad y 1,25 rem) solo donde hay soporte; si no, visible.
- **Un solo CTA por servicio**: `[ Escribir por WhatsApp ]`. El correo vive en el cierre.


---

## 6. Los nueve carteles

Cada cartel se describe igual: **qué se dibuja** (y con qué técnica), **cómo se mueve** (relojes `a` y `d`, calor del puntero), **móvil**, **movimiento reducido**, **contenido real** (en el orden en que se lee) e **interacción**. Los ejemplos de código son los ya probados en Node (Apéndice A). Las figuras son especímenes de 50 a 120 columnas (las palabras de producción son más grandes, §3.4) y muestran glifos, no color.

### 6.0 Gramática común

- **`?still&poster=<id>&a=<0..1>&d=<0..1>`** congela el motor en un par de relojes para capturas, regresión visual y revisión de arte (06 §4.2, extendido). Todo cartel tiene un `still` (los pares de §9.3).
- **Calor** (`heat[]`): con ratón o lápiz, un núcleo gaussiano de radio ≈ 7 celdas de ancho (corregido por la proporción de la celda) que se estampa una vez por cuadro con el último punto y decae con τ = 0,45 s; se combina por máximo, no por suma. **Toque**: un anillo de 2 celdas de grosor que se expande 28 celdas/s durante 1,2 s (≤ 3 vivos). **Teclado**: al enfocar un enlace o botón, un pulso desde su centro. Nunca `touch-action: none`.
- **Cada cartel reacciona al calor a su manera** (es la interacción firma de la sección): derrite el aro, hace olas, pinta la obra, alinea agujas, emite ecos, alumbra el neón, muestra la referencia, ondula el agua. Ninguna reacción lleva texto.
- **Tonos por defecto**: ver §4. Las palabras sólidas llevan cara, aro, luz y sombra; las palabras de un material llevan aro T11 y el material dentro.

### 6.1 Portada · GAYA · «letra de vidrio con agua dentro»

**Qué se dibuja.** GAYA en su variante `wide` (152×18 celdas de escritorio, 95 % del ancho, centrada) con un **aro sólido de 1 celda** (T11), luz de borde arriba a la izquierda (T13), sombra de (+2, +1) en T2, y por dentro **agua**: la cresta del ruido `fbm` deformado (`marea(c, r, t)`, filamentos finos) traducida con la rampa `· : = * y a A G` en T5 a T9. Los puntos calientes (`▒`, T10) ocupan ≤ 1,5 % de las celdas. Fuera de las letras, el **susurro**: los mismos filamentos, solo donde `marea > 0,84` y un ruido por celda lo permite (probabilidad 0,7): un 7,6 % de las celdas de aire [M]. Es la traducción a texto del campo de luz líquida que ya existía: mismos filamentos, mismo color, pero contenidos por la palabra. Y el alfabeto interior (`y a A G`) es el nombre de la marca dentro del nombre de la marca (el recurso de Unseen, informe 01).

```text
       ·                                                                                                       ··
                                  ·                                  ·               ··                     ·
                         ·             ·                                             ·                      ·
               ·        ·                                          ··               ··     ··
 ··              ··  ·    ·                                          ··            ·        ·                      ·
     ·             · ·   ···            ·                               ·                        ·                    ·
···   ·       ▗▄▄████████▄▄▖            · ▗▄▄▄▄▄▄▄▄▄▖        ▗▄▄▄▄▄▄▄▖  ·     ▄▄▄▄▄▄▄▄  ·      ▄▄▄▄▄▄▄▄▄▄
· ··       ▗▟█████yaaayy█████▄            ▟██████████▖  ····· ▜███████▖      ▟███████▘        ▟██████████▌
·         ▟███**██████████**███▖         ▐██Gy███*==██       · ▜██y==██▖    ▐██GGG██▘        ▗██==███===██▖
         ▟██yyy██▀     ▝▜██████▌        ▗██GAy█▛██=*y█▙       ··▝██==*██▖  ▗██AGG██▘         ██***█▛██*==█▙
·       ▗██aaa██▘        ██▀▀▀▘         ▟█GA▒██ ▐█:*a██▖         ▝██y**█▙ ▗██GG███▘         ▟█yyy██▘▝██**██▌
·       ▐█Ayy*█▌                       ▐██Ay██▘  ██*aG██   ··· ·  ▝██yy██▙██Ga██▛▘         ▗██=**█▛  ▜█***██▖
        ██Ay**█▌     ███████████▌     ▗██▒AG█▛  ·▝██*aA█▙          ▝██AA███G▒██▛           ██===██   ▝██===█▙
        ▜█y***█▌     ██████yyyy█▌     ██▒AGG█▘    ▜█=*a██▖    · · ··▝██▒▒▒G▒██▛     ···   ▟█====█▌    ▐█===██▙
       ·▐██***██     ▝▀▀▀▜█yyyy█▌    ▟█▒GaGA████████y==y██ ·······   ▝██▒GG▒█▛ ·         ▗██*===████████====██▖      ··
         ▜██AAA██▄      ▄████yy█▌   ▗██▒Aa███████████Ga**█▙········· ·▐█GG▒▒█▌ ··    ··  ██***████████████===██      ·
         ▝▜██▒▒G██████████▛▜█yy█▌   ██Aay██▀▀▀▀▀▀▀▀▀██GAa██▖          ▐█GG▒▒█▌          ▟█Gayy█▛▀▀▀▀▀▀▀▀▜█***y█▙
           ▀█████ayy*████▛ ▐████▌  ▟██████▛         ▝███████▖         ▐██████▌    ·    ▐███████         ▝███████▖     ·
      ·      ▝▀▀██████▀▀   ▝▀▀▀▀▘  ▀▀▀▀▀▀▀▘          ▀▀▀▀▀▀▀▘         ▝▀▀▀▀▀▀▘         ▀▀▀▀▀▀▀▘   ·      ▝▀▀▀▀▀▀▀     ·
     ··     ··                                                                                        ·               ·
                                                                ·      · ·                              ·····       ··
    ·                           ····                                                  ·  ·            ··
      ·                 ··      ·     ·                     ·
   · ··                 ··      ·  ··                      ·                            ·
                       ··     ···                                                   ··            ·
      ·   ···· ··    ···                ·     ·                                       ·
```

*Variante `mid` (108×13) a 120 columnas. El `wide` de producción mide 152×18 sobre una rejilla de 160×50.*

**Cómo se mueve.** Encendido único de ≤ 2,6 s (06 D17): una **cresta de agua** cruza el póster de abajo a la izquierda hacia arriba a la derecha en 1,8 s; tras ella el agua interior fluye (`energy` = 1, decae) y en la cresta brillan chispas T15 (≤ 0,5 % de las celdas). El último fotograma es **idéntico al póster SSR**: no hay salto. Después, reposo: el bucle duerme a los 1,6 s. El calor del puntero **derrite el aro** local (las celdas del aro pasan a glifos de agua mientras `heat > τ`) y **acelera el agua interior** ×3 en su radio; el aro se recompone en ≈ 0,45 s. El toque lanza un anillo. El scroll suma energía al agua y trae la marea de HOLA.

**Móvil.** `stack`: GA / YA, dos líneas de 50×12 celdas sobre una rejilla de 62 a 69 columnas (celda 6×12). El texto va debajo.

```text
       ·
                                  ·
                         ·             ·
          ▗▄▄███████▄▄▖ ·           ▄▄▄▄▄▄▄▄▄
 ··    ▗▄███████████████▄ ·        ▟█████████▌
     ·▗███a████▀▀▜███GA██▙··      ▗██*y███**██▖
···  ▗██aa██▛      ▀██████        ██aa██▀██ay█▙
· ·· ▟█GAA█▛        ▀▀▀          ▟█aAG█▌ ▜█▒A██▌
·    ██aAa█▌    ▗▄▄▄▄▄▄▄▄▄▖     ▗██aa██  ▝██Gy██▖
     █yAGy█▌    ▐█████████▌     ██yyy█▘   ▐█Ay*█▙
·    ██A▒A█▙    ▝████ayyy█▌    ▟█****█▄▄▄▄▟█▒Ay██▌
·    ▐██A▒██▙      ▗███yy█▌   ▗██**██████████GGa██▖  ·
      ▜███A████▄▄▄███▛█yy█▌   ██***█▛▀▀▀▀▀▀▀██AG▒█▙    ·
       ▝▜████*██████▛ ██y█▌  ▟█***██  ··    ▝██AA██▌
       · ▝▀▜█████▛▀▘  ▜███▘  ██████▘      ·  ▀█████▛
         ·                           · ·            ··
          ····                                        ·
    ▄▄▄▄▄▄▄▖ ·     ▄▄▄▄▄▄▄▄        ▄▄▄▄▄▄▄▄▄▖          ·
    ▝███████▖·    ▐██████▛▘       ▐██████████▖         ·
     ▝██AAG██▖   ▗██**██▛        ▗██y*████*a█▙
      ▝███GA█▙  ▗██**██▛         ▟█Aay█▛▜█ya██▌
    ·  ▝▜██a██▙▗██**██▛         ▐██GG██ ▝██AA██▖
      ·  ▜██y████**██▛  ··     ▗██AA██▘  ▜█aay█▙
   · ··   ▜██***yy██▀   ··     ██GGG█▛    █yyy██▌
           ▜█ayaA██▘   ··     ▟█GGa*█▙▄▄▄▄█ay**██▖
      ·   ··█▒▒▒G█▌  ···     ▗██a*:██████████aGA██
          ··█GAAy█▌ ·····    ██=::██▀▀▀▀▀▀▀▀██:::█▙
            ██yy*█▌         ▟█:::██▘    ·   ▜██··██▖
            ▜█████▘         ██████▀     ·    ▜█████▛

                                           ·
                                             ·
                   ·   ·· ·                   ·
  ·· ·              ·    ··                   ···
       ··           ·                        ··
         ··         ·      ···
          ·      ··       ·· ·           ·
               ··· ···          · ····· ·
         ·        ··  ·             · ·
·    ·             ··· · ··          ·
```

**Movimiento reducido, sin JS, `forced-colors`, impresión.** El póster SSR es el cartel (fotograma `still`); sin ignición ni calor. `forced-colors` y `print`: la palabra pasa a `CanvasText` (el póster SSR está en el DOM como `data-art`); el lienzo se oculta.

**Contenido real, en orden** (`section#inicio`, `min-height: 100svh`, pozo `lead` e `ink`, abajo a la izquierda):
1. `h1`: «Tu negocio, imposible de ignorar.» / «Your business, impossible to ignore.» (titular ya decidido).
2. Lead: «Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo.» / «Web, apps, marketing, IT support and AI. From Santo Domingo to the world.»
3. `[ Escríbenos por WhatsApp ]` (primario, `data-cta="primary"`, ≥ 44 px) y `[ Ver referencias ]` (secundario, solo si `READY.refs`).

**Interacción.** Calor y toque como arriba; al enfocar el CTA, pulso de teclado; el CTA no se anima ni se decodifica nunca.

### 6.2 Quiénes somos · HOLA · «hola contiene ola»

**Qué se dibuja.** HOLA `wide` de 125×15, alineada a la izquierda (78 %). La **H es un rótulo sólido** (cara T8, aro T11, luz T13, sombra T3); **OLA son olas**: dentro de las tres letras, líneas de `~` y puntos `·` que ondulan (`y = r + round(A · sin(0,33·c + φ))`, `A` = 1,6; `~` cuando `y mod 3 = 0`, `·` cuando `y mod 3 = 1` y `c` par), en T6 a T9. En español «hola» contiene «ola»: el cartel dice hola y muestra la ola. Es la primera palabra de cada mensaje que llega por WhatsApp, y el sitio entero empuja a esa conversación.

```text
      ▄▄▄▄▄▄▖        ▄▄▄▄▄▄▄          ▄▄▟██████▙▄▄         ▗▄▄▄▄▄▄▖                 ▗▄▄▄▄▄▄▄▄▄
      ██████▌        ███████       ▄▟█████~ · █████▙▖      ▐██████▌                 ██████████▙
      ██████▌        ███████      ▟███~█████████  ███▙     ▐█   ~█▌                ▟█~  ███~~██▖
      ██████▌        ███████     ▟██~~██▛▘    ▀██~  ██▙    ▐█ ~~·█▌               ▗██ ~██▜█ ·~██
      ██████▌        ███████    ▐██ · █▛        ██~~ ██▖   ▐█~·  █▌               ██  ·█▛ ██  ·█▙
      ██████████████████████    ██~~  █         ▐█· ~~█▌   ▐█   ~█▌              ▟█~~~██  ▝██  ██▖
      ██████████████████████    █ · ~~█         ▐█  · █▌   ▐█ ~~·█▌             ▗██ · █▌   ▜█~~ ██
      ██████████████████████    ██  · █         ▐█~~  █▌   ▐█~·  █▌             ██·   █    ▝█ ·  █▙
      ██████▌        ███████    ▐█~~  █▌        ▟█· ~██▘   ▐█   ~█▌            ▟█  ~~~███████  ~~██▖
      ██████▌        ███████     ███~~██▙     ▗▟██  ██▌    ▐█ ~~·█▌           ▗██~~ ███████████ · ██
      ██████▌        ███████     ▝▜██  ██████████ ███▀     ▐█~·  ███████████  ██~ ·██▀▀▀▀▀▀▀▀▜█   ~█▙
      ██████▌        ███████       ▀█████ ·  ~█████▛▘      ▐████████████████ ▟██████▌         ███████▖
      ▀▀▀▀▀▀▘        ▀▀▀▀▀▀▀         ▝▀▀███████▀▀▀         ▝▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ▀▀▀▀▀▀▀          ▝▀▀▀▀▀▀▀
```

*Espécimen a 100 columnas, en el fotograma `still` (`d = 0,35`).*

**Cómo se mueve.** La fase avanza con `φ = 2π·(0,35 + 1,4·d)`: las olas se desplazan **al ritmo del scroll** y se detienen con él. El calor sobre OLA **agranda la amplitud** (`A` 1,6 → 3,2) y acelera la fase ×3 localmente; sobre la H, la cara se derrite en agua y se recompone. Llega por la marea: el aro de la palabra aparece primero, el interior después.

**Inglés.** HELLO: la H sólida y «ELLO» con olas; el chiste bilingüe se pierde, el cartel no.

**Móvil.** HO / LA en dos líneas de 12 filas: H sólida, O y LA con olas.

**Movimiento reducido.** Olas congeladas en `φ = 2π·0,84` (`d = 0,35`). **Sin JS**: no hay lienzo; el cartel es solo el texto.

**Contenido real** (`section#nosotros`, `min-height: 130svh`; texto a la derecha de la H en escritorio, debajo en móvil):
1. `h2`: «Quiénes somos» / «Who we are».
2. Siete líneas (informe 04 §3, `ul`): «Gaya Digital es la marca de Giancarlo González.» · «Santo Domingo, República Dominicana. Trabajo remoto.» · «Español e inglés.» · «WhatsApp primero: ahí empieza todo.» · «Hablas directo con el director, sin intermediarios.» · «Propuesta por escrito en 24–48 horas.» · «Tus accesos y tus archivos son tuyos desde el día uno.» ([CONFIRMAR] los compromisos y el trabajo remoto; el nombre visible legitima el `founder` del JSON-LD).
3. Firma: «Giancarlo González · Director».
4. Microdato (`--muted`, 13 px): `SDQ · 18°28′N 69°56′W · 21:40 UTC−4`. La hora se calcula en el cliente con `Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo' })`; sin JS, se ve `SDQ · 18°28′N 69°56′W · UTC−4`. Sin API, sin clima, sin «disponible ahora».

### 6.3 Web y apps · WEB · «plano, obra, publicado»

**Qué se dibuja.** WEB `wide` de 125×18, a la derecha (78 %). Tres estados de **la misma palabra**, cada uno más lleno que el anterior:
- **plano**: solo el aro de 1 celda (T7) y una retícula `·` cada 4 celdas dentro (T3);
- **obra**: las celdas interiores se rellenan por **disolución con ruido azul** (umbral por celda `τ = 0,6·bn + 0,4·fbm`), con `░ ▒ ▓ █` según la cobertura local `k = relleno·1,25 − τ` (T4 a T8);
- **publicado**: cara sólida, aro T11, luz T13, sombra proyectada de (+2, +1) en T3, y **un destello de publicación**: una línea de luz (T15 → T9 en cuatro celdas de cola) cruza el cartel de arriba abajo entre `d = 0,86` y `0,97`, una sola vez, monótona.

```text
d = 0     plano
     ▗▄▄▄▄▄▄▄      ▗▄▄▄▄▄▄▄▄▖      ▄▄▄▄▄▄▄▖   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
     ▝███████▌     ▟█████████      ███████▘   ████████████████████▌    ███████████████████▄
      ██·   █▙     ██   ·   █▖    ▐█·   █▛    █ ·   ██████████████▌    █·   ·█████████  ·███▖
      ▐█   ·██    ▐█   ·   ·█▙    ▟█   ·█▌    █·   ·█▀▀▀▀▀▀▀▀▀▀▀▀▀▘    █   · █▀▀▀▀▀▀▀██·   █▙
       ██ ·  █▌   ██  ████· ██    ██  ·██     █   · █                  █  ·  █       ▐█   ██▛
       ▐█·   █▌  ▗█  ·█▌▐█   █▌  ▐█  · █▌     █  ·  █▄▄▄▄▄▄▄▄▄▄▄▄      █ ·   █▄▄▄▄▄▄▄██ ███▛▘
       ▝██  ·██  ▟█ ·██  ██ ·██  ▟█ · ██      █ ·   █████████████      █·   ·█████████  █▀▘
        ▜█ ·  █▖ ██· █▛  ▜█·  █▖ ██·  █▛      █·   ·█████████████      █   · ██████████·██▙▄
        ▝█·   █▌▐█·  █▌  ▝█   █▙▗█·  ██▘      █   · █▀▀▀▀▀▀▀▀▀▀▀▘      █  ·  █      ▀▀██ ████▖
         ██  ·████  ██    ██ ·██▟█   █▛       █  ·  █                  █ ·   █        ▐█ ·  █▙
         ▐█ ·   ·   █▌    ▐█·  ███  ·█▌       █ ·   █▄▄▄▄▄▄▄▄▄▄▄▄▄▖    █·   ·█▄▄▄▄▄▄▄▄██·   █▛
          ██   ·   ██▘    ▝██  ·   ·██        █·   ·███████████████    █   · ██████████·  ███▘
          ▜█████████▛      ▜█████████▌        █████████████████████    ████████████████████▀
          ▝▀▀▀▀▀▀▀▀▀▘      ▝▀▀▀▀▀▀▀▀▀         ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

d = 0,5   obra
     ▗▄▄▄▄▄▄▄      ▗▄▄▄▄▄▄▄▄▖      ▄▄▄▄▄▄▄▖   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
     ▝███████▌     ▟█████████      ███████▘   ████████████████████▌    ███████████████████▄
      ██· ░░█▙     ██ ░░░  ▒█▖    ▐█▒ ▒░█▛    █░░░░░██████████████▌    █·░░░·█████████  ▒███▖
      ▐█  ░·██    ▐█░░░░▒ ▒·█▙    ▟█▒░▒▒█▌    █▒░░░·█▀▀▀▀▀▀▀▀▀▀▀▀▀▘    █▒▒░· █▀▀▀▀▀▀▀██·░ ▒█▙
       ██ ·▒ █▌   ██ ░████▒ ██    ██  ░██     █░░ ▒▒█                  █░ ▒▒▒█       ▐█▒░ ██▛
       ▐█·▒░░█▌  ▗█░ ░█▌▐█░ ░█▌  ▐█░▒▒ █▌     █░ ░  █▄▄▄▄▄▄▄▄▄▄▄▄      █▒▒ ▒░█▄▄▄▄▄▄▄██▒███▛▘
       ▝██  ·██  ▟█░░██  ██ ▒██  ▟█░░ ██      █ ░▒ ░█████████████      █▒░░░·█████████▒▒█▀▘
        ▜█░░░░█▖ ██▒ █▛  ▜█░░░█▖ ██·░ █▛      █·░ ▒·█████████████      █░  ▒ ██████████·██▙▄
        ▝█·▒ ░█▌▐█·░ █▌  ▝█░▒░█▙▗█░ ▒██▘      █░ ░· █▀▀▀▀▀▀▀▀▀▀▀▘      █  · ▒█      ▀▀██ ████▖
         ██░▒░████  ██    ██ ▒██▟█░  █▛       █  ░░░█                  █▒▒ ░░█        ▐█ ▒░▒█▙
         ▐█░░▒░ ▒   █▌    ▐█░  ███░░░█▌       █ ░ ░░█▄▄▄▄▄▄▄▄▄▄▄▄▄▖    █░▒▒ ▒█▄▄▄▄▄▄▄▄██░  ▒█▛
          ██  ░░ ░ ██▘    ▝██▒▒░░░░▒██        █▒▒ ▒▒███████████████    █░░░░░██████████▒ ▒███▘
          ▜█████████▛      ▜█████████▌        █████████████████████    ████████████████████▀
          ▝▀▀▀▀▀▀▀▀▀▘      ▝▀▀▀▀▀▀▀▀▀         ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

d = 1     publicado
     ▗▄▄▄▄▄▄▄      ▗▄▄▄▄▄▄▄▄▖      ▄▄▄▄▄▄▄▖   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
     ▝███████▌     ▟█████████      ███████▘   ████████████████████▌    ███████████████████▄
      ██▓▒▓██▙░    ██▓███▓▓██▖░   ▐██▓███▛░░  █▓███▓██████████████▌░   █▓▓▓▓▒█████████▒▓████▖
      ▐█▓▒▓▓██░   ▐██▓█▓█▓█▓█▙░   ▟██████▌░   █████▓█▀▀▀▀▀▀▀▀▀▀▀▀▀▘░   ███▓▓▓█▀▀▀▀▀▀▀██▓█▒██▙░
       ██▒▓█▓█▌░  ██▓██████▓██░   ██▓▓███░░   ███▓███░░                ██▒████░░     ▐███▓██▛░
       ▐█▒█▓▓█▌░ ▗██▓██▌▐██▓██▌░ ▐█▓██▓█▌░░   █▓▓▓▓▓█▄▄▄▄▄▄▄▄▄▄▄▄      ███▒███▄▄▄▄▄▄▄██████▛▘░
       ▝██▒▓▓██░ ▟█▓███░░██▒███░ ▟█▓█▓██░░    █▒██▓▓█████████████      ██▓▓▓▓████████████▀▘░░
        ▜█▓▓▓██▖░███▒█▛░░▜█████▖░██▒█▒█▛░░    █▒█▓█▓█████████████░░    ██▓▓█▓██████████▒██▙▄
        ▝█▓█▓██▌▐█▓▓▒█▌░ ▝█▓█▓█▙▗██▓███▘░     █▓▓█▓▓█▀▀▀▀▀▀▀▀▀▀▀▘░░    █▓▓▓▓██░░░░░░▀▀██▓████▖
         █████████▓▓██░░  ██▓███▟██▓▓█▛░░     █▒▓█▓▓█░░                ███▓███░░      ▐█▓█▓██▙░
         ▐█████▒█▒▒▓█▌░░  ▐█▓▓▓███████▌░      █▓█▓█▓█▄▄▄▄▄▄▄▄▄▄▄▄▄▖    ████▓██▄▄▄▄▄▄▄▄███▒▓██▛░
          ██▓▓██▒█▒██▘░   ▝███████▓███░░      ███▓█████████████████    ███▓█████████████▒████▘░
          ▜█████████▛░░    ▜█████████▌░░      █████████████████████░░  ████████████████████▀░░░
          ▝▀▀▀▀▀▀▀▀▀▘░     ▝▀▀▀▀▀▀▀▀▀░░       ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀░░  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀░░░░
```

**Cómo se mueve.** Al llegar (`a` de 0 a 1) el contorno se dibuja **celda a celda con una cabeza brillante y su estela** (05 `outline()`): el plano se traza. Con `d`: `relleno = smooth(0,12, 0,92, d)` (plano → obra → publicado). El **calor pinta**: donde pasa el puntero, la obra se rellena aunque el scroll no haya llegado (`k += heat · 0,9`), con memoria de 1,6 s. Es la interacción más literal del sitio: la web se construye donde la tocas.

**Móvil.** Una línea de 52×8 con el mismo guion. **Movimiento reducido**: `d = 1` (publicado).

**Contenido real** (`article#web`, dentro de `section#servicios`; texto a la izquierda): `h3` «Desarrollo web y apps» · promesa «Tu web, rápida y lista para vender por WhatsApp.» · `[ Escribir por WhatsApp ]` (mensaje prellenado con el servicio: «Hola Gaya Digital, me interesa «Desarrollo web y apps». Quiero una propuesta.») · **Incluye** (siete líneas) · `dl` Para quién, Necesitamos, Resultado · tres datos locales con «Verificado 30 sep 2026». **Todo el copy es el de 04 §2.1.** La línea «Se suma según el proyecto» solo si el dueño confirma las capacidades ([CONFIRMAR]: tienda con pasarela, conexión con e-CF, apps nativas).

### 6.4 Automatización e IA · LISTO · «el caos se ordena»

**Qué se dibuja.** LISTO `wide` de 148×17, centrada (93 %). Un campo de **agujas** (una por celda, cuatro orientaciones `─ ╲ │ ╱`) que empieza en desorden y **aprende**: dentro de las letras todas terminan alineadas en la hachura `╱` (T7) y el aro se cierra en `█` (T12); el borde parcial de cada letra sale en cuadrante (`▗▄▖▐▌▝▀▘`) cuando `k > 0,5`, para que la palabra emerja del ruido; fuera, las agujas siguen sueltas pero **se apagan** (una de cada 7 celdas al principio, una de cada 27 al final; T3 → T2). El cartel es el contraste entre el orden brillante y el caos casi apagado. Técnica: ángulo por celda con un **retardo propio** (`0,30·hash + 0,25·fbm`) y una función de aprendizaje `k = ease((d − retardo) / 0,55)`; cada aguja pasa del azar a su objetivo. Coste: una comparación por celda, sin partículas.

```text
d = 0,05  caos
                                         ╱│           ╲       ╱   ─   │       ╲╱  ╱│
 ╲         ╱               ╲          ╲   ╲─  │╱            ╲      ╲      │         ─    │╲    ─    ─
    ╱─                  ╱ │  ╱─  ╱ ─   ╱               ╱                        │   │ │╱       ╲     ──
╱─          ╲  ╱      │  ╲   │──  ╱     ╱╲─╱│╲─   ╱╱   ─ ╲ ╱── ─│ ─ ╲  ╱│─╲ ╲╲ ╱  ╱╲─╱╱╲╲╲  ╲     ╲
      ╲─╲│─╲╱─   ╱    │ ────╲╲╱    ──╱╱╲╱│──╲│╱╲╱──     ││╱╱╲─│──│╲│─╲╱╱│╲     ╲─╱╲─╲│─╲││╱──╲╲    ── ╲
  ╱ │╲│╱─╲╱╱│         ─ │─╱│──│   │─╲╲╲╲│─   ─││╲─╲╲ │ │╱╲╲╲│─│╲╲│╱╱╱╱╱╱╱╲ ╲  ╲╱╱│────╲ ╲│─│╲╲─│       ╲
─  ╲  ─│╲─│╲╲     ─╱ ╲  ╱╲│╱│─╱  ╱ ─│─╲│╱ │  ╱  │╱│╱│╱     ╲╱ ──│╲─╱     │  ││───╲│╱   ╲  ╲╲╲╲│╲──    │
╲    │╲╱│╲│╱╱ ╱   │     ─╲╲╲│╲╲   ╱╲╲│─││╱   │  ╱╲│           ╱─╲│╱╱   ╲ ╱│  ──╲╲╲╲─    ╱  │││╲╲─ │
      ╲─│─╱─╱    │      ─╲╱─╲│╱  ╱╱ │╱╱╱│─╱╲╱╲╲─╱╲─│ ─    │   │─╲╲╱╲   ╲   ─╱╱╲││╲╱         │─│─╱─
 ─     ╱│╱╲─╲       │   │──╲│╱╱       │ │╱──│╱│╱─╱╲╲─      ╲  │╲╲│──       ─╱──│╲─╲        ─│╱─╱│─ ─
     │─╱╲│─╱│         ╱ ╲│╱──╲─        │ ╲  │ ─╱╲╲╲╱│         ─╱╱─╲╱ ╱╱  ╱ ╲ ──│╲│╲─  ╱╲ ─  ╲╲─│╱ │  │
      ╱─││─│╲  ─  ─     ╲─│╱╲╱│╱   ╲│╱╲╲│       ─╲╱╱─│    ─  ╱╱─╱╲╲│    ╱     │╱──│─ ─   ─│─││──╲│  ╲─
       │╲╱──╲╱╲─││││╱   │╱╲│╲─   ╱ ╱╱│╲╲│╲   ╲ │╱╲╲╲│╱        ╱╱─││╲           │╱─╲╱╱─ ─│╱╱─╱│──│
 ─     ╲╲││─╱╱│─╱╱╲╱│   ──╲╱│──│   ╲╲─╱╱─╲╱╱│──│╲│─╲       ╱  │─╲╱╲╱   ─│  │ ╲ ─││╱╱│╲─│╲─│╱╱╱─
       ╱││╲╱─╲╱││╱╲╱│╱   ╱─╱─│─         │╱─│╲│─│   ─│  ──   │  ─│╲─╱ │           ── ─╲││╱╲ ╲        │  ╱
 ╱     │ ╲      ─          │          │ │        ╲              ╱   │        │      ╱
      ─╱    ││╱─     ╱─ ─                                   │     ╲   ╱╱─          │      ╲    │─
      │ ╲                       ││  ╲        │    ╱  ──│ │   ╱      │         ╲ ╱      │

d = 0,55  aprende
                                         ╱│                   ╱                    │
 ╲                                         ─                                              ╲
    ╱                   ╱ │   ─  ╱                                                  │                 ─
╱─    ▗▄▄▄▄▄▄  ╱      │ ▄▄▄▄▄▄▖─      ▄▄▓▓█▓██▓▙▄▄     ▗▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖  ╲ ╱ ▗▄▄██████▙▄▄
      ▐█████▓           █▓▓▓▓█▌    ▗▟█▓██▓██▓▓▓▓███▄   ▐▓▓█▓██▓▓██▓███▓▓██▌    ▄█▓█▓█████▓▓███▙▖
  ╱  ╲▐▓╱╱╱╱█           █╱╱╱╱█▌   ▗██▓╱██▛▀▀▀▀███╱▓█▙│ ▝███▓▓█▓╲╱│╱██▓█▓██▌   ▟██╱████▛▜████╱▓▓█▄      ╲
─  ╲  ▐█╱╱╱╱█     ─     █╱│╱╱█▌   ▐▓╱╱╱▓▌    ╱ ▜█████╱     ╲  █╱│╱─█     │   ▟██╱╱█▛▘  ╲  ▜██╱╱▓█▖
╲     ▐█╱╱╱╱█     │     █╱╱╱╱█▌   ▝██╱╱███▙▄▄▄▖▝▀▀            ▓╱╱╱╱▓      │ ▗█▓╱╲╱█▘    ╱  ▜▓╱╱╱█▙
      ▐█╱─╱╱█           █╱╱╱╱▓▌   ╱▝▓████████████▙▄▖          ▓╱╱╱╱█        ▐█╱╱╱╱█        ▐█╱╱─██
 ─    ▐█╱╱╱╱█           █─╱╱╱█▌      ▝▀▜███████╱█▓▓█▙      ╲  █╲╱╱╱█        ▐█╱│╱╱█        ▐█╱╱╱█▓
      ▐▓╱╱╱╱█           █╱╱╱╱█▌      ▄▄▖  ▝▀▀▀███╱╱██▙        █╱╱╱╱█  ╱     ▝▓█╱╱╱█▖  ╱    ▐▓╱╱╱█▛│
      ▐█╱╱─╱█           ▓╱╱╱╱█▌╱  ▟█▓███▖       █╲╱╱██        █╱╱╱╱█         ▜██╱╱█▙▖     ▄██╱─▓█▘   ─
      ▐█╱╱╱╱███▓▓▓███▌  █╱╱╱╱█▌   ▝█▓╱╱██▓▄▄▄▄▟██╱╱▓█▛        █╱╱╱│█         ▝▜▓█╱▓██▓▄▄▄███╱▓▓█▘
      ▐▓╱│╱╱╱╱╱╱╱╱╱╱▓▌  ██╱╱╱█▌    ▝██▓██████████▓▓█▀         ▓▓╱╱▓█         ╲ ▀█▓███▓▓██▓████▛▘
      ▝▓█▓█▓████▓█▓██▘  ▜██▓█▓▘      ▝▀▀▓█▓█████▀▀▘─│   ─   │ ▜█▓██▛ │           ▝▀▀▓█▓██▓▛▀▀       │  ╱
 ╱       ╲      ─                                ╲              ╱   │
      ─     │         ─ ─                                   │         ╱
                                                     ──│                      ╲

d = 1     orden
                                         ╱│                   ╱                    │
 ╲                                         ─                                              ╲
    ╱                     │   ─  ╱                                                  │                 ─
╱     ▗▄▄▄▄▄▄  ╱      │ ▄▄▄▄▄▄▖─      ▄▄███████▙▄▄     ▗▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖  ╲ ╱ ▗▄▄██████▙▄▄
      ▐██████           ██████▌    ▗▟██████████████▄   ▐██████████████████▌    ▄██████████████▙▖
  ╱  ╲▐█╱╱╱╱█           █╱╱╱╱█▌   ▗███╱██▛▀▀▀▀███╱██▙│ ▝███████╱╱╱╱███████▌   ▟██╱████▛▜████╱███▄      ╲
   ╲  ▐█╱╱╱╱█     ─     █╱╱╱╱█▌   ▐█╱╱╱█▌    ╱ ▜█████      ╲  █╱╱╱╱█         ▟██╱╱█▛▘     ▜██╱╱██▖
╲     ▐█╱╱╱╱█     │     █╱╱╱╱█▌   ▝██╱╱███▙▄▄▄▖▝▀▀            █╱╱╱╱█      │ ▗██╱╱╱█▘    ╱  ▜█╱╱╱█▙
      ▐█╱╱╱╱█           █╱╱╱╱█▌    ▝█████████████▙▄▖          █╱╱╱╱█        ▐█╱╱╱╱█        ▐█╱╱╱██
 ─    ▐█╱╱╱╱█           █╱╱╱╱█▌      ▝▀▜███████╱████▙      ╲  █╱╱╱╱█        ▐█╱╱╱╱█        ▐█╱╱╱██
      ▐█╱╱╱╱█           █╱╱╱╱█▌      ▄▄▖  ▝▀▀▀███╱╱██▙        █╱╱╱╱█        ▝██╱╱╱█▖  ╱    ▐█╱╱╱█▛
      ▐█╱╱╱╱█           █╱╱╱╱█▌╱  ▟█████▖       █╱╱╱██        █╱╱╱╱█         ▜██╱╱█▙▖     ▄██╱╱██▘
      ▐█╱╱╱╱█████████▌  █╱╱╱╱█▌   ▝██╱╱███▄▄▄▄▟██╱╱██▛        █╱╱╱╱█         ▝▜██╱████▄▄▄███╱███▘
      ▐█╱╱╱╱╱╱╱╱╱╱╱╱█▌  ██╱╱╱█▌    ▝████████████████▀         ██╱╱██         ╲ ▀██████████████▛▘
      ▝██████████████▘  ▜█████▘      ▝▀▀████████▀▀▘─│   ─   │ ▜████▛ │           ▝▀▀██████▛▀▀       │  ╱
 ╱       ╲      ─                                ╲              ╱
      ─     │                                               │         ╱
                                                     ─ │                      ╲
```

*Espécimen de 96 columnas (12 filas) sobre una rejilla de 104: tres fotogramas del mismo cartel. En producción, LISTO mide 148×17 sobre 160 columnas.*

**Cómo se mueve.** Con `d`: `0,05` caos, `0,55` aprendiendo, `1` orden. El calor **alinea** las agujas cercanas (`k += heat`), formando una mancha de hachura que decae en 1,6 s. Al llegar, el campo entero aparece ya en desorden.
**Sin texto en la ilustración** (ni chat, ni cifras): el arte no dice «bot», dice «orden». La honestidad del servicio (reglas, traspaso a una persona, registro) vive en el texto.

**Móvil.** LIS / TO en dos líneas. **Movimiento reducido**: `d = 1`.

**Contenido real** (`article#automatizacion`): `h3` «Automatización e IA» · promesa «Que WhatsApp responda, agende y avise por ti.» · CTA · Incluye · `dl` · datos locales (F16 cobro por mensaje desde el 1 oct 2026, F20 política de IA de Meta, F18 coexistencia) · **copy de 04 §2.2**. [CONFIRMAR] API de WhatsApp en producción y agente de IA con datos del cliente.

### 6.5 Marketing y redes · ECO · «tu alcance sale de tu nombre»

**Qué se dibuja.** ECO `wide` de 111×18, a la izquierda (69 %), sólida (cara T9, aro T11). A su alrededor, **ecos**: las **isolíneas de la distancia al propio contorno** de la palabra (radio `R_k = (k + u)·4,6 + 1,4` anchos de celda, `k` de 0 a 5, grosor ± 0,62) dibujadas con el glifo de línea **tangente al contorno** (`─ │ ╱ ╲`, elegido por el gradiente de la distancia y la proporción 1:2 de la celda). Es un mapa topográfico del nombre que se expande como un sonido. Técnica: la distancia euclídea exacta sobre la rejilla de celdas (Felzenszwalb, anisótropa 1:2): **0,27 ms para 171×48 celdas** [M]; el eco es solo una consulta por celda. Tonos T10 → T3 según `k`.

```text
             ╲╲     ───                                                         ───       ╱╱
           ╲     ╲╲         ──────────────────  ───────────     ───────────         ──╱     ╱╱
         ╲╲    ╲╲      ───                                   ─                ───      ╱╱     ╱╱
        ╲     ╲     ╲╲                                                            ─╱      ╱     ╱
       ╲    ╲╲    ╲      ───                  ──           ─────           ────      ╱╱    ╱╱    ╱
      ╲╲   ╲╲   ╲╲    ╲╲                                                        ─╱     ╱╱    ╱    ╱╱
      ╲   ╲╲   ╲╲    ╲     ─────────────────────────────────   ─────────────       ╱     ╱    ╱    ╱╱
     │    ╲    ╲   ╲╲    ╲                                   ─                ╱╱    ╱╱    ╱    ╱    ╱
     │   ││   │    ╲    ╲    ────────────────    ─────────       ─────────      ╱╱    ╱    ╱    ╱    ╱
     │   │    │   ││   │    ╲                ╱──           ╱╱ ╲╲           ─╱     ╱    ╱    ╱    ╱   ╱│
     │   │    │   ││   │    │  ████████████▌ ─  ▗▄▟█████▙▄▖ ╱─   ▄▄██████▄▄  ╱╱    ╱    ╱   ╱╱   │    │
     │   │    │   ││   │    │  ████████████▌   ▟███████████▖   ▗████████████▖ ╱╱   ╱╱   │    │   ││   │
     │   │    │   ││   │    │  ████▌          ▟███▛▘   ▐███▀  ▗████▀    ▜████▖ │    │   ││   │    │   │
     │   │    │   ││   │    │  ███████████▌  ▗████▌ ╲╱        ▐████  ╲╱  ████▌ │    │   ││   │    │   │
     │   │    │   ││   │    │  ███████████▌  ▝████▌ ╱─  ▗▄▄▖  ▐████  ─╲  ████▌ │    │   ││   │    │   │
     │   │    │   ││   │    │  ████▌          ▜████▖    ▟███▌ ▝████▖    ▟████▘ │    │   ││   │    │   │
     │   │    │   ││   │    │  ████████████▙  ▝▜███████████▛   ▝████████████▘ ╲╲   ╲╲   │    │   ││   │
     │   │    │   ││   │    │  ████████████▛    ▝▀▜██████▀▘  ─   ▀▜██████▀▀  ╲╲   ╲╲   ╲╲   ╲╲   │    │
     │   │    │   ││   │    ╱                ╲───         ╲╲   ╱╱         ──╲    ╲╲   ╲╲    ╲    ╲   ╲╲
     │   ││   │    ╱    ╱                                                       ╲    ╲╲    ╲    ╲    ╲
     │    ╱    ╱    ╱    ╱╱                                 ╲─╱             ──╲     ╲╲    ╲    ╲    ╲
      ╱    ╱    ╱    ╱      ──────────────────  ───────────     ───────────       ╲╲    ╲╲    ╲    ╲
      ╱╱   ╱╱    ╱     ╱╱                                                      ──      ╲     ╲    ╲
       ╱╱   ╱╱    ╱╱      ────────────────────────────────────────────────────      ╲╲     ╲╲    ╲
        ╱╱    ╱     ╱╱                                                           ──╲     ╲╲    ╲╲
          ╱     ╱       ───                                 ───             ────       ╲╲     ╲
           ╱╱     ╱╱                                                               ───      ╲
             ╱╱      ╱──                                                       ──╲       ╲╲
```

**Cómo se mueve.** `u = 0,3 + 0,7·d`: los anillos salen del contorno y se alejan con el scroll; el anillo `k` nace en el borde de la palabra y muere pasadas 28 celdas. El **toque emite eco literal**: tres anillos circulares (con la corrección de proporción) desde el punto tocado, 1,4 s. Al llegar (`a`), la palabra cristaliza y el primer anillo se despega.

**Móvil.** Una línea de 52×9. **Movimiento reducido**: `u = 0,3` (`d = 0`), tal como en la figura.

**Contenido real** (`article#marketing`): `h3` «Marketing digital y redes» · promesa «Que te encuentren, te escriban y te compren.» · CTA · Incluye · `dl` · datos locales (F15 ventana de 72 h, F28 Ley 30-26, F27 Google Ads) · **copy de 04 §2.3**. [CONFIRMAR] edición de Reels, Google Ads, community management. «Perfil de Google, si tu negocio califica».

### 6.6 Soporte e infraestructura IT · ON · «que la luz vuelva»

**Qué se dibuja.** ON `wide` de 82×18, a la derecha (51 %). Es un **neón**: solo el tubo (la banda del contorno a ≤ 0,95 celdas, T12, glifo `█`) y su **halo** (`▒` a ≤ 1,6 celdas, `░` a ≤ 3,2, T6 y T4); el interior queda oscuro. A la derecha de la N hay un **piloto** de una celda (`·`, T15): el LED de un UPS. El guion es un **apagón y una restauración** (el tema local de 2026, dato F31 del informe 04, sin dramatizarlo con texto): el campo entero baja al 40 %, el tubo queda como fantasma (`▒`, T2, nunca por debajo), y **solo el piloto sigue encendido**; luego la luz **vuelve desde el piloto**, recorriendo el tubo. Es la promesa del servicio («respaldos, plan para los apagones») hecha imagen, sin una palabra.

```text
encendido (d = 0,1)
                     ░░░░░░░░░░░           ░░░░░░░░░░        ░░░░░░░░░
                 ░░░░▒▒▒▒▒▒▒▒▒▒▒░░░      ░░▒▒▒▒▒▒▒▒▒▒░░    ░░▒▒▒▒▒▒▒▒▒░░
               ░░▒▒▒██        ███▒▒░░░  ░░▒█       ██▒░░   ░░▒█     █▒░░
             ░░▒▒██               ██▒░░ ░░▒█         █▒▒░░ ░░▒█     █▒░░
            ░░▒▒█                   █▒░░░░▒█          █▒▒░░░░▒█     █▒░░
           ░░▒▒█      ▒▒▒▒▒▒▒▒█      █▒░░░▒█           █▒▒░░░▒█     █▒░░
           ░░▒█      ▒▒░░   ░▒▒█      ▒▒░░▒█     ██      █▒░░▒█     █▒░░
           ░▒▒█     █▒▒░    ░░▒▒      █▒░░▒█     █▒▒      █▒▒▒█     █▒░░
           ░▒▒      █▒░░     ░▒▒      █▒░░▒█     █▒▒▒      █▒▒█     █▒░░
           ░▒▒      █▒▒░    ░░▒█      █▒░░▒█     █▒░▒▒█      ██     █▒░░
           ░░▒█      █▒░░░ ░░▒▒█      ▒▒░░▒█     █▒░░▒▒▒            █▒░░
            ░▒▒█      █▒▒▒░▒▒▒█      ▒▒░░░▒█     █▒░░░░▒▒           █▒░░
            ░░▒▒█       ████        ▒▒░░░░▒█     █▒░░ ░░▒▒█         █▒░░
              ░▒▒▒█               ▒▒▒░░ ░░▒█     █▒░░   ░▒▒▒        █▒░░
               ░░░▒▒▒▒        █▒▒▒▒░░   ░░▒▒     █▒▒░    ░░▒▒       █▒░░    ·
                  ░░░▒▒▒▒▒▒▒▒▒▒░░░       ░░▒▒▒▒▒▒▒░░      ░░▒▒▒▒▒▒▒▒▒░░

apagón (d = 0,5): solo queda el piloto del UPS
                    ▒▒        ▒▒▒          ▒       ▒▒         ▒     ▒
                 ▒▒               ▒▒       ▒         ▒        ▒     ▒
                ▒                   ▒      ▒          ▒       ▒     ▒
               ▒              ▒      ▒     ▒           ▒      ▒     ▒
              ▒                ▒           ▒     ▒▒      ▒    ▒     ▒
              ▒     ▒                 ▒    ▒     ▒        ▒   ▒     ▒
                    ▒                 ▒    ▒     ▒         ▒  ▒     ▒
                    ▒          ▒      ▒    ▒     ▒    ▒      ▒▒     ▒
              ▒      ▒         ▒           ▒     ▒                  ▒
               ▒      ▒       ▒            ▒     ▒                  ▒
                ▒       ▒▒▒▒               ▒     ▒        ▒         ▒
                  ▒                        ▒     ▒                  ▒
                              ▒                  ▒                  ▒       ·

restaurando (d = 0,75): la luz vuelve desde el piloto
                                           ░░░░░░░░░░        ░░░░░░░░░
                                         ░░▒▒▒▒▒▒▒▒▒▒░░    ░░▒▒▒▒▒▒▒▒▒░░
                    ▒▒        ▒▒▒       ░░▒█       ██▒░░   ░░▒█     █▒░░
                 ▒▒               ▒▒ ░░ ░░▒█         █▒▒░░ ░░▒█     █▒░░
                ▒                   █▒░░░░▒█          █▒▒░░░░▒█     █▒░░
               ▒              ▒      █▒░░░▒█           █▒▒░░░▒█     █▒░░
              ▒                ▒      ▒▒░░▒█     ██      █▒░░▒█     █▒░░
              ▒     ▒                 █▒░░▒█     █▒▒      █▒▒▒█     █▒░░
                    ▒                 █▒░░▒█     █▒▒▒      █▒▒█     █▒░░
                    ▒          ▒      █▒░░▒█     █▒░▒▒█      ██     █▒░░
              ▒      ▒         ▒      ▒▒░░▒█     █▒░░▒▒▒            █▒░░
               ▒      ▒       ▒      ▒▒░░░▒█     █▒░░░░▒▒           █▒░░
                ▒       ▒▒▒▒        ▒▒░░░░▒█     █▒░░ ░░▒▒█         █▒░░
                  ▒               ▒▒▒░░ ░░▒█     █▒░░   ░▒▒▒        █▒░░
                              ▒ ▒▒▒░░   ░░▒▒     █▒▒░    ░░▒▒       █▒░░    ·
                                ░░       ░░▒▒▒▒▒▒▒░░      ░░▒▒▒▒▒▒▒▒▒░░
```

**Cómo se mueve.** Con `d`: `< 0,25` encendido; `0,25 a 0,55` apagón (suavizado de tono de 250 ms: ningún destello); `0,55 a 0,95` restauración con un frente que avanza a `(d − 0,55)/0,40 · 90` celdas desde el piloto. **El puntero es una linterna**: durante el apagón el calor enciende el tubo en su radio (y el dedo en móvil enciende un tramo 1,2 s). Nadie lo lee como un fallo porque (1) el texto real no cambia, (2) el piloto siempre está, (3) la restauración es visible en el mismo cartel.
**Seguridad**: el apagón es monótono y suave (2.3.1); con `prefers-reduced-motion` **no hay apagón**: el cartel es el neón encendido (`d = 0,1`).

**Móvil.** Una línea de 40×11. **Contenido real** (`article#soporte`): `h3` «Soporte e infraestructura IT» · promesa «Correo, redes y equipos que no te frenan.» · CTA · Incluye · `dl` · datos locales (F31 apagones 2026, F06 Facturador Gratuito, F29 SPF/DKIM/DMARC) · **copy de 04 §2.4**. [CONFIRMAR] soporte remoto con tiempo de respuesta, M365/Workspace, respaldos gestionados; sin SLA ni «24/7» publicados.

### 6.7 Referencias · VER · «letras-ventana»

**Qué se dibuja.** VER `wide` de 109×18, centrada (68 %). Las tres letras son **ventanas** sobre miniaturas ASCII de las webs de ejemplo **reales y construidas** (`builtRefs()`: hoy Fogón, Cimiento y Nodo; V, E y R muestran las tres primeras). Aro T11 y, dentro, la miniatura en T3 a T8 (nunca `▒▓█` dentro de una ventana: la rampa llega a `G`). Las miniaturas se hornean en el build a partir de `public/posters/<slug>-<hash>-thumb.webp` (ya existen, 640×400) con la búsqueda por forma de 01 §5.10 (aquí la figura usa una rampa de luminancia solo para mostrar la idea).

```text
    ▗▄▄▄▄▄▄▄▄▖           ▗▄▄▄▄▄▄▄▄▖   ▗▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▖    ▗▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
    ▝█████████           █████████    ▐███████████████████████▌    ▐█████████████████████▙▄
     ▐██::=:*█▌         ▐█:::··██▌    ▐█·············      ··█▌    ▐█GGGGGG████████GGGGG████▄
      ▜█=yy=a██         ██::::·█▛     ▐█yy**y*████████████████▌    ▐█GGGGGG█▀▀▀▀▀▜████GGGGG██▌
      ▝██*==aA█▌       ▐█:::::██▘     ▐█=**=:=█                    ▐█GAaAaA█        ▝█GGGGGG██
       ▜█y*yyy██      ▗██::::██▌      ▐█***y==█                    ▐█GGGGGG█         █GGGGGG██
        ██*=***█▙     ▟█==:::█▛       ▐█::····█▄▄▄▄▄▄▄▄▄▄▄▄▄▖      ▐█GGGGGG█        ▗█GGGGG██▌
        ▝██**yy██▖   ▗██:=::██▘       ▐█······██████████████▌      ▐█GGGGGG█▄▄▄▄▄▄▟███G█████▘
         ▜█yy*ya█▙   ▟█=::=██▌        ▐█······██████████████▌      ▐█GGGGGG█████████GGG█▀▀▘
          ██***=██▖ ▗██:=ya█▛         ▐█:·····█▀▀▀▀▀▀▀▀▀▀▀▀▀▘      ▐█GGGGGG███████GGGGG██▙▄
          ▝██aaya█▙ ██*===██▘         ▐█::····█                    ▐█GGGGGG█▛▀▀▀▜████GGG███▙
           ▜█**y*████:::::█▌          ▐█::····█                    ▐█GGGGGG█       ▀██GGGG██▙
            ██···········██           ▐█::····████████████████▙    ▐█GGGGGG█        ▐█GGGGG██▌
            ▐██·······:·██▘           ▐█::::::=====**=******=██    ▐█GGGGGG█         ██GGGGG██▖
             ▜███████████▛            ▐████████████████████████    ▐████████         ▐████████▙
             ▝▀▀▀▀▀▀▀▀▀▀▀             ▝▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    ▝▀▀▀▀▀▀▀▀          ▀▀▀▀▀▀▀▀▀
```

*Figura generada con las tres miniaturas reales de `public/posters/` (solo leídas; ningún archivo del proyecto se modificó).*

**Cómo se mueve.** Al llegar, las ventanas se abren por disolución. **Señalar una fila de la lista** (ratón, foco de teclado o toque) cambia **las tres letras a la vez a esa referencia**, como una sola imagen vista a través de la palabra (disolución de 320 ms). Causa y efecto a la vista, sin texto.

**Datos.** Las miniaturas viven en un JSON aparte, cargado con `import()` cuando el cartel está a un visor y medio (estimado 1 a 2 KB brotli por miniatura [C], se mide en M4: tres hoy, hasta catorce mañana). Con menos de tres referencias construidas, las letras sin ventana se llenan de agua.

**Móvil.** Una línea de 52×9. **Movimiento reducido**: las tres ventanas estáticas.

**Contenido real** (`section#referencias`, `min-height: 110svh`): `h2` «Referencias» / «References» · filas de lista `ul` (nombre, rubro, icono de tipo; enlace a `/referencias/<slug>/`; `[ Quiero una así ]` con el mensaje de referencia ya escrito, `refWhatsApp`) · sello «Ejemplos · datos ficticios» / «Samples · fictional data» (es la honestidad visible; no se retira) · `[ Ver todas ]` a `/referencias/`. Las tarjetas flotantes de `HeroCards` desaparecen de la portada: su trabajo lo hace este cartel.

### 6.8 Proceso · el hilo · «de hola a listo»

**Este es el único cartel que no usa el lienzo.** Está en el DOM (arte SSR + CSS scroll-driven), de modo que funciona sin JS, con movimiento reducido y con la alineación exacta del texto que se desplaza.

**Qué se dibuja.** Arriba, HOLA (60×8 a 15 px; 44×6 en móvil); abajo, LISTO (76×9; 52×7), con la hachura del cartel de la automatización; entre las dos, un **hilo vertical** de `┃` con **cuatro estaciones** (`╋`). Son las palabras de los carteles 1 y 3: el proceso es ir de una a la otra. Las cuatro etiquetas son HTML real a la derecha de cada estación. Las palabras y el hilo son `data-art` con `::before` (03), `aria-hidden`.

```text

    ███▙     ████     ▄▄█████▙▄     ████          ▗█████▙
    ████     ████   ▗███████████▖   ████          ▟██████▖
    ████     ████  ▗████▘   ▝████▖  ████         ▐███▌████
    █████████████  ▐███▌     ▜███▌  ████        ▗████ ▝███▙
    █████████████  ▐███▌     ▐███▌  ████        ▟███▌  ▜███▖
    ████     ████  ▝████▖   ▗████▘  ████       ▗████████████
    ████     ████   ▝███████████▘   █████████▌ ████▀▀▀▀▀▜███▙
    ███▛     ████     ▀▜█████▛▀     █████████▌▐███▛      ████


     ┃
     ┃
     ╋   Hablamos por WhatsApp
     ┃
     ┃
     ┃
     ┃
     ╋   Propuesta por escrito
     ┃
     ┃
     ┃
     ┃
     ╋   Construimos con avances
     │
     │
     │
     │
     ┼   Entregamos y acompañamos
     │
     │


    ▟████         █████     ▄▄███████▄▄    ██████████████▙    ▗▄▄██████▄▄
    █╱█╱█         █╱█╱█   ▗╱█╱█╱█╱█╱█╱█╱▖  ╱█╱█╱█╱█╱█╱█╱█╱   ▟█╱█╱█╱█╱█╱█╱▙
    ╱█╱█╱         ╱█╱█╱   ╱█╱█╱    ▝▜█╱█╱  ▝▀▀▀▀╱█╱█╱▀▀▀▀▘  ╱█╱█╱▀▘  ▝▜█╱█╱▙
    █╱█╱█         █╱█╱█   ▜╱█╱█╱█▄▄▄▟▀          █╱█╱█      ▐█╱█╱▌      ▜█╱█╱▖
    ╱█╱█╱         ╱█╱█╱    ▝▜█╱█╱█╱█╱█╱▙▖       ╱█╱█╱      ▐╱█╱█▌      ▐╱█╱█▌
    █╱█╱█         █╱█╱█     ▗▄ ▀▀▀▀╱█╱█╱█▖      █╱█╱█      ▐█╱█╱▌      ▟█╱█╱▘
    ╱█╱█╱▄▄▄▄▄▄▖  ╱█╱█╱   ╱█╱█▙▖    ▐█╱█╱▌      ╱█╱█╱       ╱█╱█╱▄    ▟█╱█╱▛
    █╱█╱█╱█╱█╱█╱  █╱█╱█   ▝╱█╱█╱█╱█╱█╱█╱▛       █╱█╱█       ▝▜█╱█╱█╱█╱█╱█╱▀
    ▜███████████  █████     ▀▀███████▛▀▘        ████▛         ▝▀▜██████▀▀
```

*Las etiquetas son texto HTML; en la figura solo muestran la composición. En el fotograma, tres estaciones ya se iluminaron.*

**Cómo se mueve.** Dos capas del hilo: la tenue (`│`, T3) completa y la brillante (`┃`, T9) recortada con `clip-path` animado por `animation-timeline: view()` sobre la lista: **el hilo se enciende hasta la estación que estás leyendo**; cada nodo pasa de `┼` a `╋` (T13) al cruzar el 60 % del visor. Hover o foco en una etiqueta ilumina su nodo. Sin soporte de `animation-timeline` (Firefox estable): todo encendido, sin ocultar nada.

**Contenido real** (`section#proceso`, `ol` de cuatro): «Hablamos por WhatsApp» · «Propuesta por escrito» (con la insignia «24–48 h», [CONFIRMAR]) · «Construimos con avances» · «Entregamos y acompañamos». Los números ordinales son legítimos porque la secuencia es real (PRODUCT.md). Solo se publica un plazo; el resto cuando se hayan medido (04 §2.5).

### 6.9 Contacto · GAYA · «reflejo en el agua»

**Qué se dibuja.** GAYA (138×16, 86 %, centrada) parada sobre una **línea de agua** (`╌─`, T6); debajo, su **reflejo**: las filas de la palabra espejadas y comprimidas (`rs = wl − 1 − floor(dy·1,1)`), con **ondulación** creciente con la profundidad (`desplazamiento = 2,2·sin(0,85·dy + 0,11·c + φ)·min(1, dy/5)`), y un desvanecimiento en tres pasos (`▓▒` → `▒` → `░`, T4 → T1) con descarte por ruido. Cierra la serie: el nombre vuelve, ya no de vidrio y agua sino de pie sobre ella. El CTA se sienta justo entre la palabra y su reflejo.

```text
       ·
                                  ·                                  ·               ··
            ▗▄▄██████▙▄▄ ·          ▟██████▙       ▐█████▙      ▗██████       ▗███████▖
          ▄██████████████▄         ▟██AGA=██▙       ▜██*██▙    ▗██A▒██▘      ▗██*yaG▒██▖   ··
 ··      ▟██A███▀▀▀▀███G██▙       ▗██y████:██▖       ▜██*██▌   ▟█aa██▘·      ▟█::███GA█▙    ·
     ·  ▟██Aa█▘    · ▜███▀▀·      ██**█▌▐█**██        ▜██y██▖ ▟██a██▘   ·   ▐██:██▘██a██▌        ·
···   · ██aa██                   ▟█ya██ ·██ay█▙        ▜██A██▟██A██▘    ·  ▗██Aa█▌ ▐██a██▖
· ··    █Aaa█▌    ▐████████▌    ▗██aA█▌  ▐█▒A██▖        ▜██▒███G██▘        ▟█GG██   ▜█yy█▙
·       ██Aa██    ▐████***█▌    ██aaa█    █GGy██         ▜██G▒▒██▘        ▐██AA█▌   ▐█**██▌
        ▜█yay█▖      ▐█***█▌   ▟█yyyy██████GAy*█▙         ▜█AGG█▘         ██▒AA███████*=:██▖
·       ▝███a██▙▄▄▄▄▟████y█▌  ▗██**██████████Ay██▖        ▐█AAA█         ▟█aG███████████:=█▙
·        ▝▜███████████▘▐█y█▌  ██**██▘    · ▝██Ga██   ·    ▐█▒G▒█        ▗██A██▛       ▐██:██▌
         ·  ▀▀█████▛▀  ▐███▘ ▐█████▘   · ·  ▝█████▘    ·  ▝█████   ·    ▜████▛         ▜█████
                                      ··          ·     ·     · · ··· ·····         ···
╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─╌─
            ▒▒▓  ▓▓▒▒  ▒▓▓▓▒ ▒▓▓▓▓ ▒        ▒▓▓▓▓▓▒       ▒▓▓▓▓         ▒▓▓▓▓▒         ▒▓▓▓▓▓
          ▒▓▓ ▓▓ ▓▓▓▓▓▓▒▒▓▓▓▒  ▓▓▓▓▓▒     ▒ ▓ ▓▓▓        ▒▓▓▓ ▓▓         ▒▓▓▓▓▓▒       ▒▓▓▓▓▒
         ▒▓▓▓▓ ▓▒▒▒▒▒▒▓▓▓▓▓▒  ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          ▒▓▓▓▓▓▓         ▒ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒
            ▒  ▒     ▒  ▒▒▒   ▒ ▒ ▒  ▒ ▒ ▒  ▒▒▒▒             ▒▒ ▒▒▒         ▒▒  ▒ ▒ ▒▒▒  ▒
           ▒▒▒      ▒ ▒▒ ▒     ▒▒▒▒▒▒     ▒  ▒▒▒           ▒ ▒▒   ▒      ▒  ▒▒    ▒▒    ▒
         ▒ ▒▒   ▒ ▒ ▒▒ ▒       ▒▒   ▒▒     ▒  ▒▒▒▒         ▒▒▒▒▒▒         ▒▒▒▒    ▒▒▒ ▒ ▒▒
      ▒▒   ▒                       ▒▒ ▒▒      ▒        ▒  ▒▒ ▒▒▒           ▒▒▒     ▒▒   ▒▒▒
            ░          ░   ░        ░  ░  ░          ░ ░     ░                ░░    ░ ░
          ░░░░     ░      ░         ░  ░░░                            ░        ░ ░░░  ░ ░
               ░░    ░░░           ░░            ░  ░            ░░ ░             ░
```

**Cómo se mueve.** Reposo: el reflejo está quieto. **El calor y el toque ondulan el agua**: la amplitud sube con el calor y un anillo de toque desplaza filas; la fase `φ` avanza con la energía del scroll y se duerme. Sin texto, sin bucle.
**Móvil.** GA / YA con reflejo corto (6 filas). **Movimiento reducido**: `φ = 0,6`.

**Contenido real** (`section#contacto`, 100svh): `h2` «Hablemos» / «Let's talk» · `[ Escribir por WhatsApp ]` grande (26 px; mensaje genérico) · correo `hola@gaya.com.do` con `[ Copiar correo ]` (estado: los caracteres pasan a `████████` 400 ms y luego a «Copiado»; es un estado, no una instrucción) · teléfono `+1 849-925-4426` (`tel:`) · redes como enlaces de texto (Instagram, TikTok, YouTube, X, Facebook: solo las de `brand.json`) · pie: «Santo Domingo, República Dominicana» y la hora local en 13 px. Nada más: sin formulario, sin captcha, sin banner de cookies (no hay nada que consentir).

### 6.10 Tabla de interacciones

| Cartel | Ratón y lápiz | Toque | Teclado (foco) | Scroll |
|---|---|---|---|---|
| GAYA | derrite el aro y acelera el agua | anillo | pulso | trae la marea y agita el agua |
| HOLA | olas más grandes | anillo | pulso | mueve la fase de las olas |
| WEB | pinta la obra | pinta | pulso | plano → obra → publicado |
| LISTO | alinea las agujas | alinea | pulso | caos → orden |
| ECO | calor local | **eco circular** | pulso | los ecos se expanden |
| ON | **linterna** | enciende un tramo | pulso | apagón y restauración |
| VER | señalar una fila cambia la imagen | ídem (toque en la fila) | foco en la fila cambia la imagen | apertura de las ventanas |
| Hilo | hover en etiqueta | ídem | foco en etiqueta | enciende el hilo |
| Reflejo | ondula | anillo | pulso | fase del agua |


---

## 7. El momento firma: «la web dice Gaya, se derrite y te dice hola»

Es el primer scroll. Nadie lo explica y nadie lo necesita: el encendido de la portada ya enseñó la mecánica (el agua pasa y deja las letras). Guion, con `s0` la posición del borde superior de «Quiénes somos» como fracción del visor (1 = asoma por abajo, 0 = toca el techo):

| Momento | Qué pasa en pantalla | Técnica |
|---|---|---|
| 0,0 s | Llega el HTML: el `h1` y el póster SSR de GAYA (un bloque de texto de 1,46 KB br). No hay pantalla de carga, ni puerta, ni porcentaje. | `data-art` + `::before`, fuentes precargadas, fallback al 100 % |
| ≈ 1,0 s | El motor despierta tras `load` + inactividad. Fundido de 320 ms del póster al lienzo, que arranca con **el mismo fotograma**. | prueba de paridad SSR ↔ motor, §9 |
| 1,2 a 3,0 s | **Ignición**: una cresta de agua cruza GAYA de abajo a la izquierda hacia arriba a la derecha; tras ella, las letras se llenan. Termina exactamente en el póster SSR y el bucle duerme. | encendido ≤ 2,6 s (06 D17), sin autonomía posterior |
| cualquier momento | El puntero rompe el aro donde pasa; el dedo lanza un anillo. Las letras vuelven en 0,45 s. | calor `heat[]`, τ = 0,45 s |
| `s0` = 0,85 | Por abajo asoma una **línea de agua ondulada**: la marea. La base de GAYA empieza a mojarse: el interior de las letras se vacía hacia el frente y queda el aro. | frente `front(c)`, umbral por celda, interior antes que aro |
| `s0` = 0,55 | La banda de agua (8 filas) cruza la base de la palabra. Debajo, HOLA **nace por su contorno**: primero el aro, luego el relleno. | nucleación con ruido azul, aro antes que interior |
| `s0` = 0,35 | Del nombre solo queda el contorno fantasma de las letras, sobre agua. Debajo, HOLA ya se lee; la H cristaliza sólida y OLA ondula. | H sólida T8 + olas en OLA |
| `s0` = 0,15 | La banda sale por arriba y el agua se seca a susurro. HOLA está completa, con olas. Entra el texto «Quiénes somos» por abajo a la izquierda. | pozo `lead` (T6) |
| `s0` = 0 | Reposo: HOLA fija, olas a fase `0,35`. Sin bucle. | duerme a los 1,6 s |

**Por qué se cuenta.** Es una frase de un verbo («se derrite») con una imagen limpia («el nombre se vuelve agua y del agua sale hola»); usa el material de la marca (el agua) y la primera palabra de la conversación que Gaya quiere provocar; y funciona con el dedo (móvil) y con el ratón, y se puede grabar en 8 segundos para una historia de Instagram (que es por donde llega el visitante, PRODUCT.md).

**Los dos momentos menores.**
- **El apagón del cartel ON**: el campo baja al 40 %, el neón queda fantasma y solo brilla el piloto del UPS; el dedo es la linterna y la luz vuelve desde el piloto. Es local (apagones de 3 a 10 h reportados en Santo Domingo en 2026, informe 04 F31) y no dice una palabra.
- **El reflejo del cierre**: el nombre, de pie sobre el agua, y el CTA en medio; al tocar, el reflejo ondula.

---

## 8. Plan técnico

### 8.1 Capas

| z | Capa | Qué es | JS |
|---|---|---|---|
| 0 | `.field` | **un solo `<canvas>` fijo** (`position: fixed; inset: 0; height: 100lvh`, `aria-hidden`, `pointer-events: none`) | motor |
| 0 | póster SSR (solo portada) | `div[data-nosnippet][aria-hidden]` con `span.art[data-art]`; se retira tras el fundido | ninguno |
| 1 | pozos | `[data-well]` medidos y en caché; el motor topa el tono bajo ellos | los lee el motor |
| 2 | `main` | **texto real**: h1, h2, h3, párrafos, listas, enlaces | ninguno |
| 2 | cartel de proceso | arte SSR y CSS `animation-timeline: view()` (sin lienzo) | ninguno |
| 40 | esquinas, espina | enlaces y botones reales; chips sólidos | 15 líneas |
| 50 | índice | `popover` | ninguno |

El arte de cada cartel está **fijo en pantalla** (no scrollea con el texto): las escenas reciben relojes `(a, d)` y coordenadas de celda de pantalla, y el motor decide qué escena pinta cada fila según la posición **del documento** de las secciones (06 §4.3). Consecuencia buscada: ningún cartel necesita registro píxel a píxel con el texto, así que el desfase entre el lienzo (≤ 30 fps) y el scroll nativo (60 a 120 Hz) no se percibe como error; es profundidad.

### 8.2 Archivos

```text
src/ascii/                                (todo el arte; cero dependencias de runtime)
  noise.ts      hash / vnoise / fbm enteros (06 §4.1)         bn64.ts   ruido azul 64×64 incrustado (05 B.2)
  glyphs.ts     atlas: ASCII y · ¯ por fuente; módulos, sombras y cajas (simples, dobles, redondas y GRUESAS ━┃╋) por código (05 B.5)
  tones.ts      T0 a T15 + 16 animados, generados desde --glow-* (05 B.3)
  grid.ts       Grid 4 B/celda, blit, overlay (05 B.4)         edt.ts    distancia exacta anisótropa 1:2 (Apéndice A)
  words.gen.ts  palabras RLE por idioma y variante (generado)  words.ts   decodificación y elección de variante
  engine.ts     relojes a/d, marea, calor, pozos, sueño, tiers, `?still` (06 §4.2 y 4.3)
  render-gl.ts  textura de celdas + atlas + paleta, un draw (05 B.6)   render-2d.ts  respaldo con baldosas y diferencias (05 B.7)
  posters/      gaya.ts hola.ts web.ts listo.ts eco.ts on.ts ver.ts cierre.ts     (`import()` al acercarse; una por archivo)
  ssr.ts        renderPoster(id, cols, rows, lang) → string    (corre en Astro y en Node)
src/components/  Field.astro  Chrome.astro (esquinas y barra móvil)  Spine.astro  Menu.astro  Word.astro (span.art)
                 sections/ Portada Nosotros Servicios(x4) Referencias Proceso Contacto .astro
src/data/  services.ts facts.ts (informe 04)   src/lib/  wa.ts jsonld.ts ascii-copy.ts (informe 04)
scripts/  words.mjs  (Bricolage → cuadrantes → words.gen.ts, con --keep-edits)      thumbs.mjs (miniaturas ASCII de las referencias)
          ascii-seams.mjs (03 §2.9)  ascii-parity.mjs (póster SSR = fotograma a `still`)  ascii-stills.mjs (capturas por cartel)  lint-services.ts (04)
```

### 8.3 Datos de las palabras

- **Entrada**: la lista de palabras por idioma y variante (§3.4). **Salida**: `words.gen.ts` con `{ [lang]: { [id]: { stack, mid, wide: { cols, rows, lines?, rle } } } }`.
- **Codificación**: RLE de 1 byte (nibble de módulo + 4 bits de recuento − 1) más base64 (probado con ida y vuelta: 3 924 B RLE, 2 152 B gz para las once anchas [M]). Con las tres variantes por palabra, ≈ 5 KB gz para ES y EN [C]; **cada página carga solo su idioma y solo la variante que usa** (≈ 1,5 KB gz).
- **Uso**: `getWord(id, lang, cols)` devuelve la variante mayor que quepa (`cols − 8`). El SSR (Node) y el motor (navegador) leen **los mismos datos**: la paridad del póster es estructural, no una promesa.

### 8.4 Contrato de escena de cartel

Una escena es una **función pura** de relojes, calor y humedad; sin DOM, sin `Math.random`, sin asignaciones por cuadro (05 y 06):

```ts
export interface Clock { a: number; d: number; energy: number }           // por cartel
export interface Cell  { glyph: number; fg: number; bg: number }         // índices de atlas (0..144) y paleta (0..31)
export interface PosterScene {
  id: 'gaya' | 'hola' | 'web' | 'listo' | 'eco' | 'on' | 'ver' | 'cierre';
  still: Clock;                                                           // par de relojes del fotograma estático hermoso
  build(g: GridInfo, lang: Lang, variant: Variant): PosterState;          // 1 vez por tamaño: máscara, EDT, umbrales, susurro horneado
  cell(x: number, y: number, k: Clock, s: PosterState, wet: number, heat: number, out: Cell): void;
}
```

- `wet` = `max(marea, calor, ignición, guion(d))`, calculado por el motor y consumido por la escena con `τ(celda)` (ruido azul más sesgo de borde).
- **Paridad SSR**: la escena `gaya` usa **solo enteros y polinomios** (06 §4.1: sin `Math.sin/cos/pow/exp` en la ruta del póster); su `cell()` a `still` genera el póster. La marea y las olas sí usan `Math.sin` (no tienen póster). Prueba en CI: `renderPoster('gaya', …)` = fotograma del motor a `still`, celda por celda.
- **Susurro** horneado en `build()` (un `Uint8Array` con el fotograma `still` del agua del aire): el campo ambiente **no se recalcula** en reposo.

### 8.5 Motor

Se adopta el ciclo de 06 §4.2 (bucle con acumulador y tope de 30 fps, sueño a 1,6 s, `adapt()` que solo baja de nivel, `dispose()`), con estas particularidades de Cartel:

```ts
function frame(now) {
  for (const sec of visibleSections) sec.clock = clocks(sec, scrollY, V);          // a, d (§5.2)
  energy = max(energy * exp(-dt / 0.9), min(1, speed / 2400)); decayHeat(dt); stampPointer();
  for (let r = 0; r < rows; r++) {
    const docY = scrollY + (r + 0.5) * ch, k = bandAt(docY);                        // escena por fila según el DOCUMENTO
    for (let c = 0; c < cols; c++) {
      const wet = max(tide(c, r, k), heat[i], ignition(c, r, now), script(k, c, r)); // §5.4
      scene[k].cell(c, r, clock[k], state[k], wet, heat[i], out);
      tone = min(out.fg, wellCap[i]);                                                // pozo
      mem[i] += (tone - mem[i]) * memRate;                                           // memoria: sin parpadeo
      glyph[i] = hysteresis(out.glyph);                                              // solo cambia si |Δ| ≥ 1
    }
  }
  upload(cells); draw();                                                             // 1 subida + 1 draw
}
```

- **Solo se recomputa lo que cambió**: en reposo, 0 trabajo; durante el scroll, las filas de la banda de marea y las del cartel cuyo reloj cambió. El campo completo de agua (8 000 celdas) cuesta **0,90 ms en Node y ≈ 4 ms con la CPU ×4–5 del A07**; la variante de 2 octavas, 0,55 ms [M].
- **Tiers** (06 D19): 9 000 / 6 500 / 4 200 / 2 400 celdas, 30 fps (20 en `min`), DPR 2/2/1,5/1; el control adaptativo baja si la mediana de 45 cuadros supera el 45 % del intervalo. En `low` y `min`: marea de 2 octavas, sin susurro dinámico.
- **Despertar** (todo pasivo): `scroll`, `pointermove` (no táctil), `pointerdown`, `focusin`, `resize` (solo ancho), `visibilitychange`, `pageshow` con `persisted`, cambio de `prefers-reduced-motion`. Pausa con la pestaña oculta o el menú abierto.
- **Medición** (una sola vez y en caché; nunca `getBoundingClientRect` en el bucle): offsets de sección y pozos por `ResizeObserver`, `document.fonts.ready` y cambios de ancho.
- **Depuración**: `window.__field = { tier, cols, rows, frames, sleeping, costP50, costP95, mode, clocks }`.

### 8.6 Render y respaldo

- **Principal**: WebGL2 con una textura `RGBA8UI` de celdas (glifo, fg, bg, banderas), un atlas de máscaras y una paleta de 32 entradas; un solo `draw`, `texelFetch`, contexto por defecto, `antialias: false`, `gl.disable(gl.DITHER)`, `WEBGL_lose_context` al destruir (05 B.6). **Coste medido en 05 §1.3: 0,03 a 0,05 ms de hilo principal por cuadro** de 7 200 celdas (0,15 con CPU ×4).
- **Respaldo**: Canvas 2D con baldosas opacas y diferencias por celda (05 B.7); tope ≈ 900 celdas por cuadro (si no, 8 fps). Si `WEBGL_debug_renderer_info` dice `SwiftShader` o `llvmpipe`, se usa el respaldo o el póster.
- **El «shader»** es solo el sello (05 §3.6): un triángulo que cubre el lienzo y, por píxel, tres lecturas (celda, atlas, paleta). **No hay shader de campo** (el `fbm` por píxel de `hero.ts` se retira: el agua se calcula por celda en CPU y solo donde está mojada).

```glsl
ivec2 pix = ivec2(int(gl_FragCoord.x), uSize.y - 1 - int(gl_FragCoord.y));
ivec2 cell = pix / uCell, loc = pix - cell * uCell;
uvec4 c = texelFetch(uCells, cell, 0);                       // glifo, fg, bg, banderas
float m = texelFetch(uAtlas, ivec2(c.r % 16u, c.r / 16u) * uCell + loc, 0).a;
o = vec4(mix(texelFetch(uPal, ivec2(c.b, 0), 0).rgb, texelFetch(uPal, ivec2(c.g, 0), 0).rgb, m), 1.0);
```

- **Ciclado de paleta** (05 §2.5): el brillo del agua y la cresta de la marea avanzan por los índices 16 a 31 de la paleta **sin tocar celdas** (128 bytes por cuadro).
- **Pérdida de contexto** o tier agotado: se retira el lienzo y queda el póster SSR (portada) o el fondo plano (resto). Nunca una pantalla rota.

### 8.7 Póster SSR

`ssr.ts` genera tres variantes de la portada en el HTML (`wide` de 160×50, `mid` de 113×44, `stack` de 56×60), conmutadas por `@container` (03 §2.3): solo se muestra una; las demás son `display: none` (el contenido de `::before` no se renderiza). Tamaños con brotli-11: **wide 1,46 KB, stack 0,77 KB** [M], `mid` ≈ 1,0 KB [C]. Todo en `div[data-nosnippet][aria-hidden="true"]`, presente en el HTML inicial (Google pide que `data-nosnippet` no se añada luego por JS). Cuando el lienzo toma el relevo, el contenedor se pone `hidden`. El `og:image` sale de la misma escena a `still` renderizada por Playwright en el build (ya existe `scripts/posters.mjs` con Chrome).

### 8.8 Red, CSP y fuentes

`default-src 'self'`; `script-src 'self'` sin scripts en línea ni trabajadores `blob:`; `canvas.style` por CSSOM (`Object.assign(canvas.style, …)`); fuentes y JS del mismo origen; **cero peticiones a terceros** (sin CDN, analítica, iframes, clima, banner de cookies). `document.fonts.load('500 16px …')` y comprobar `length > 0` antes de construir el atlas.

### 8.9 Capa DOM: CSS scroll-driven

`animation-timeline: view()` y `scroll()` solo para: la espina, el hilo del proceso y los revelados de bloques (opacidad y desplazamiento de 1,25 rem), siempre bajo `@supports (animation-timeline: view())` y `@media (prefers-reduced-motion: no-preference)`; sin soporte (Firefox estable, 5,7 % de las visitas en RD): **todo visible**, sin clase `.js` que oculte nada. Ningún titular ni párrafo se anima por carácter (`aria-label` está prohibido en `p`).

### 8.10 Cambios en el repositorio

| Archivo | Cambio |
|---|---|
| `astro.config.mjs` | fuentes: solo Geist Mono (`latin` + `symbols2`, precargadas); Bricolage sale de la portada y queda para `/referencias/` hasta la fase 2 |
| `Base.astro` | cargar fuente por página (no las dos en todas); `body` con `--font-mono` en la portada; `<Field />`; JSON-LD de 04 |
| `tokens.css` / `tokens.json` | `--art-lh`; pares de contraste de pozos (§4.3) para `npm run contrast` |
| `Hero.astro`, `HeroCards.astro`, `src/scripts/hero.ts` | se sustituyen por las secciones de §6; `hero.ts` se retira tras M2 (su lógica de niveles, reposo y `?still` pasa al motor) |
| `Nav.astro`, `Logo.astro` | se sustituyen por `Chrome.astro`; marca provisional `▞ Gaya Digital` |
| `public/hero/*.webp`, `--hero-poster-*` | obsoletos (el póster ya es texto) |
| `package.json` | quitar `gsap` y `lenis` (sin uso, 06 D10); añadir scripts `ascii:*` |
| `src/data/site.ts` | activar `READY.services/process/contact` |
| `src/i18n/copy.ts` | microcopy de §10 |
| `CREDITS.md` | añadir Geist Mono (OFL-1.1, © The Geist Project Authors) |

---

## 9. Presupuestos, degradación y calidad

### 9.1 Presupuestos

| Recurso | Presupuesto | Estimación |
|---|---:|---|
| HTML (brotli) | ≤ 20 KB | ≈ 14 KB: contenido ≈ 8, póster ancho 1,5 + mid 1,0 + apilado 0,8, marcado ≈ 3 |
| CSS (brotli) | ≤ 6 KB | ≈ 4 KB |
| Fuentes | 28,9 KB | `latin` 23,1 + `symbols2` 5,8, precargadas |
| JS de primera carga | ≤ 12 KB gz | núcleo ≈ 8 + ruido azul 1,4 + escena gaya y sus palabras ≈ 2,6 |
| JS diferido | ≤ 14 KB gz | siete escenas (≈ 1,3 KB c/u) + espina y menú ≈ 3 + JSON de miniaturas aparte |
| **Total ASCII** | ≤ 26 KB gz | por encima del objetivo de 20 KB de 06 D31 por haber ocho escenas en vez de cinco; se mantiene el techo de 60 KB de primera carga de `npm run budgets` |
| LCP | < 2,5 s (objetivo 2,0) | `h1` de texto real; póster en el HTML; fuentes precargadas; **no verificado si Chrome cuenta `::before`** |
| CLS | 0 | cajas reservadas, fallback al 100 % |
| TBT | < 200 ms | motor tras `load` + idle; horneado ≤ 16 ms; ninguna tarea > 50 ms |
| Lighthouse móvil | ≥ 90 (mediana de 3) | referentes con arte ASCII animado: mejor 85 (Aino), ninguno cumple (01 §3) |
| CPU por cuadro | ≤ 6 ms con CPU ×4 | campo completo de agua ≈ 4 ms; reposo 0 |
| Memoria | atlas ≈ 320 KB + celdas 36 KB + paleta + máscara R8 | un solo lienzo, un contexto |
| Terceros | 0 | CSP `default-src 'self'` |

### 9.2 Matriz de degradación

| Condición | Lo que ve el visitante |
|---|---|
| Normal | ignición, calor, marea, guiones por scroll |
| `prefers-reduced-motion` o `saveData` | cada cartel es su **fotograma `still`** (§9.3); corte seco en los bordes de sección; sin ignición, calor, marea ni decodificaciones; el hilo del proceso, encendido; se escucha `change` para conmutar en vivo |
| Sin JS | póster SSR de la portada, todo el texto, el hilo del proceso (CSS); sin lienzo |
| Sin WebGL2 | respaldo Canvas 2D; si además hay `SwiftShader`, póster o fondo plano |
| Contexto perdido / tier `min` agotado | se retira el lienzo; póster SSR o fondo plano; el texto ni se entera |
| `forced-colors: active` | lienzo y espina ocultos; el póster SSR y las palabras del hilo en `CanvasText`; bordes reales en botones |
| `print` | fondo blanco, arte negro a 7 pt, sin lienzo |
| Pestaña oculta o menú abierto | bucle pausado |
| Zoom 200 % y 400 % | reflow; la rejilla se recalcula; con < 40 columnas el lienzo se oculta y queda el texto; mínimo de 24 columnas |
| Firefox estable | sin `animation-timeline` (todo visible); sin transiciones entre documentos; el resto igual |

### 9.3 El fotograma estático de cada cartel

Coincide con el estado `still` de la escena (`?still&poster=<id>`):

| Cartel | `still` | Qué se ve |
|---|---|---|
| GAYA (portada) | `a = 1` | la palabra formada, agua congelada en `t = 21,7` (el valor de `STILL_TIME` de `hero.ts`) |
| HOLA | `d = 0,35` | H sólida, olas a `φ = 2π·0,84` |
| WEB | `d = 1` | publicada, con sombra |
| LISTO | `d = 1` | orden completo |
| ECO | `d = 0` | `u = 0,3`: tres o cuatro anillos visibles |
| ON | `d = 0,1` | neón encendido (nunca el apagón) |
| VER | `d = 0` | tres ventanas con las tres primeras referencias |
| Hilo | `d = 1` | todo el hilo encendido |
| GAYA (cierre) | `d = 1` | reflejo quieto en `φ = 0,6` |

### 9.4 Calidad: qué se comprueba antes de aprobar

1. **Arte primero, en estático**: revisar cada cartel con `?still&poster=…` a 320, 375, 414, 768, 1024 y 1440 px antes de mirar ningún movimiento (01 decisión 33).
2. **Paridad** (`ascii-parity`): póster SSR = fotograma del motor a `still`, celda por celda; **registro SSR ↔ lienzo** ≤ 1 celda de ancho en cinco anchos y DPR 1, 1,5, 2 y 2,625.
3. **Costuras** (`ascii-seams`, 03 §2.9): ≤ 40/255 con DPR 1 a 3 y cuerpos de 9 a 24 px; correr también en WebKit y Firefox cuando estén.
4. **Contraste**: `npm run contrast` con los pares de §4.3; axe en escritorio, móvil y movimiento reducido (el arte SSR va en `::before` y axe no lo evalúa); foco visible ≥ 3:1.
5. **Rendimiento**: Lighthouse móvil, mediana de 3, con y sin `?still`; `npm run budgets`; 0 peticiones externas.
6. **Movimiento**: 10 s de scroll continuo a 30 fps sostenidos y `__field.sleeping === true` 2 s después; **analizador de destellos** (PEAT, del Trace Center) sobre la marea, el apagón y la ignición (no verificado aquí); cambios de glifo independientes por celda.
7. **A07 real (bloqueante)**: `chrome://inspect`; criterio: mediana ≤ 6 ms por cuadro, `tier` sin bajar, ninguna tarea > 50 ms tras el horneado, primer fotograma < 600 ms; si falla, la escalera de 02 §8 (bajar celdas, bajar fps, marea de 2 octavas).
8. **Accesibilidad manual**: tabulación completa, zoom 200 % y 400 %, lector de pantalla (no se anuncia ningún arte; los h2 y h3 se recorren bien).
9. **Contenido**: `lint-services` (04): presupuesto de columnas, paridad ES/EN, prohibidos, hechos C/X, `[CONFIRMAR]` bloquea producción, caducidad de datos.


---

## 10. Contenido

### 10.1 De dónde sale cada texto

| Sección | Fuente del texto | Estado |
|---|---|---|
| Portada | `copy.ts` actual (h1, lead, CTA) | vigente |
| Quiénes somos | informe 04 §3 (siete líneas) | los compromisos son [CONFIRMAR] |
| Los cuatro servicios | informe 04 §2.1 a 2.4, tal cual (promesa ≤ 56 columnas, 5 a 7 «Incluye» ≤ 52, Para quién, Necesitamos, Resultado, 3 datos locales) | las capacidades son [CONFIRMAR] y **bloquean la build de producción** hasta aprobarse (04 D11) |
| Referencias | `references.json` y `builtRefs()` (nombre, rubro, tipo); mensajes de `refWhatsApp` | dinámico: solo lo construido |
| Proceso | informe 04 §2.5 (cuatro etiquetas) | «24–48 h» es [CONFIRMAR] |
| Contacto | `brand.json` (WhatsApp, correo, teléfono, redes) | vigente |

Orden de los servicios: **web, automatización, marketing, soporte IT** (04 D1). El lead de la portada y las bios no cambian: es una frase de marca, no un ranking.

### 10.2 Microcopy nuevo (etiquetas y estados; ni una línea instructiva)

| Elemento | ES | EN |
|---|---|---|
| Esquinas | `▞ Gaya Digital` · `[ Menú ]` · `[ ES │ EN ]` · `[ WhatsApp ]` | `▞ Gaya Digital` · `[ Menu ]` · `[ ES │ EN ]` · `[ WhatsApp ]` |
| Índice | Quiénes somos · Servicios · Referencias · Proceso · Contacto · Cerrar | About · Services · References · Process · Contact · Close |
| CTA portada | Escríbenos por WhatsApp · Ver referencias | Message us on WhatsApp · See references |
| CTA servicio y contacto | Escribir por WhatsApp | Message on WhatsApp |
| Campos del servicio | Incluye · Para quién · Necesitamos · Resultado | Includes · For whom · We need · Outcome |
| Sello de los datos locales | Verificado 30 sep 2026 | Verified 30 Sep 2026 |
| Sello de la galería | Ejemplos · datos ficticios | Samples · fictional data |
| Fila de referencia | Quiero una así · Ver todas | I want one like this · See all |
| Título del cierre | Hablemos | Let's talk |
| Correo | Copiar correo; estado tras copiar: Copiado | Copy email; state after copying: Copied |
| Firma | Giancarlo González · Director | Giancarlo González · Director |
| Microdato | `SDQ · 18°28′N 69°56′W · 21:40 UTC−4` | ídem |
| Pie | Santo Domingo, República Dominicana | Santo Domingo, Dominican Republic |
| Palabras de los carteles (etiqueta de la espina) | GAYA · HOLA · WEB · LISTO · ECO · ON · VER · HOLA·LISTO · GAYA | GAYA · HELLO · WEB · READY · ECHO · ON · SEE · HELLO·READY · GAYA |

### 10.3 Los cuatro servicios en una página

Copia literal del informe 04 §2.1 a 2.4 (ES; el inglés y las tablas completas están en 04, que es la fuente de verdad). Cada servicio lleva además **Para quién, Necesitamos, Resultado**, **tres datos locales con fecha** y **un solo botón de WhatsApp con el servicio ya escrito**.

| Servicio (`id`, palabra) | Promesa | Incluye |
|---|---|---|
| **Desarrollo web y apps** (`web`, WEB) | Tu web, rápida y lista para vender por WhatsApp. | Diseño propio, pensado primero para el celular · Sitio en español, en inglés o en ambos · Botón de WhatsApp con el mensaje ya escrito · Dominio y correo del negocio configurados · SEO técnico y datos estructurados para Google · Pruebas de velocidad y accesibilidad · Publicación con HTTPS, respaldo y accesos tuyos |
| **Automatización e IA** (`automatizacion`, LISTO) | Que WhatsApp responda, agende y avise por ti. | Mapa de tareas repetidas: qué sí y qué no · Respuestas y menú automáticos en WhatsApp · Bot de citas, pedidos o cotizaciones · Traspaso a una persona en cualquier momento · Conexión con Sheets, correo, calendario o CRM · Agente de IA con reglas y datos de tu negocio · Registro de conversaciones y ajustes mensuales |
| **Marketing digital y redes** (`marketing`, ECO) | Que te encuentren, te escriban y te compren. | Diagnóstico de tus perfiles y tu competencia · Perfiles listos: bio, enlaces y WhatsApp · Perfil de Google, si tu negocio califica · Calendario mensual de contenido · Diseño de piezas y edición de Reels · Anuncios en Meta y Google hacia WhatsApp · Reporte mensual: qué pasó y qué sigue |
| **Soporte e infraestructura IT** (`soporte`, ON) | Correo, redes y equipos que no te frenan. | Revisión inicial de equipos, red y cuentas · Correo con tu dominio: SPF, DKIM y DMARC · Verificación en dos pasos en tus cuentas · Respaldos automáticos con copia fuera del sitio · Wi-Fi ordenado y plan para los apagones · Soporte remoto por WhatsApp en horario hábil · Inventario de equipos y accesos documentado |

Mensaje de WhatsApp de cada botón: «Hola Gaya Digital, me interesa «{servicio}». Quiero una propuesta.» (`waService`, 04 §5.4). Datos locales: web F13, F01, F32 · automatización F16, F20, F18 · marketing F15, F28, F27 · soporte F31, F06, F29 (04 §7). El inglés usa los mismos hechos con el copy de 04.

### 10.4 Conversión y medición

- **WhatsApp** es la acción principal en las cuatro esquinas, en cada servicio, en cada referencia y en el cierre. El mensaje va **prellenado con el contexto**: genérico en la portada, «Hola Gaya Digital, me interesa «Desarrollo web y apps». Quiero una propuesta.» en un servicio (`waService`, 04 §5.4; añadir `whatsappMessage.service` a `brand.json`), y el mensaje de referencia en cada fila de VER.
- **Medición sin analítica** (04 D21): el nombre del servicio llega escrito en el primer mensaje, el dueño etiqueta el chat en WhatsApp Business (`web`, `automatización`, `marketing`, `it`, `referencia`) y revisa a los 20 chats etiquetados o a los 60 días.
- **Precio**: no se inventan tarifas. Se promete «propuesta por escrito con alcance y precio en 24–48 h» ([CONFIRMAR], 04 D9). Tras tres proyectos, el dueño decide si publica «desde» o casos representativos.

### 10.5 SEO

Una URL por idioma con `hreflang` (ya sale de `routes.ts`); `h1` único, `h2` por sección, `h3` por servicio, todos con `id` (candidatos a «Ir a…» de Google); `<title>` y descripción por idioma; **JSON-LD `Organization` + `Service`** con `alternateName: 'Gaya Group'`, `founder`, `sameAs`, `knowsLanguage`, `areaServed`; **sin `LocalBusiness`** (Google exige `address`), **sin ratings ni reseñas** (04 §5.5). Los datos estructurados solo marcan lo visible. El texto oculto es solo `sr-only` con el mismo contenido visible. `og:image` generado desde el cartel de la portada a `still`.

### 10.6 Lo que la página no dice (y la lint impide)

Ninguna cifra de Gaya (años, clientes, proyectos, satisfacción, ROI), superlativo, «expertos», testimonio, logo, premio; ninguna promesa de cumplimiento DGII ni de resultado; ningún texto instructivo («haz clic», «desliza», «cómo funciona»); ninguna mención de que el sitio lo hizo una IA (el servicio «Automatización e IA» sí se ofrece). Los únicos números son los datos locales con fuente y fecha (04), la hora y las coordenadas de Santo Domingo, y el plazo «24–48 h».

---

## 11. Por qué es arte

**El criterio** (01 decisión 4), aplicado a Cartel:

1. **¿La forma tiene razón de ser?** Sí: cada palabra está hecha del material del servicio (Gomringer: estructura = contenido). Ninguna decoración sin significado.
2. **¿Sobrevive en estático?** Sí: el estático es un fotograma del motor (`still`), no una imagen aparte. La portada, con JS desactivado, es el cartel.
3. **¿El contenido se lee sin el arte?** Sí: el texto real es HTML semántico con pozos calculados; el lienzo es `aria-hidden`.
4. **¿Ilustra un proceso real?** Sí: una obra que se publica, agujas que se ordenan, un eco que sale del nombre, una luz que vuelve tras el apagón, un hilo de cuatro pasos. Es el criterio de Year of the Horse (01 §2.8).
5. **¿Otra persona lo tomaría de referencia?** Tres ideas transferibles y con nombre:
   - **La palabra-material**: una sola palabra por sección cuya forma *es* el mensaje.
   - **La marea como costura**: el borde real de cada sección es una línea de agua que deshace y forma, en vez de un corte o un fundido.
   - **El estático es un fotograma del motor**: la versión sin movimiento, sin JS y sin red es hermosa por construcción, y la prueba de paridad lo garantiza.

**Qué hace distinto respecto de los referentes** (01): Unseen usa el nombre como alfabeto del campo; Cartel usa el nombre **y** hace de cada palabra un material. Aino transforma una forma con el scroll; Cartel transforma **nueve palabras** con la misma marea. Dragonfly pone un wordmark gigante sobre un fondo tenue; Cartel pone **la palabra dentro del arte**, y el texto real en pozos calculados. Ghostty mete 1,9 MB en el HTML; el póster de Cartel pesa 1,46 KB. Ningún referente ASCII con animación cumple LCP < 2,5 s con Lighthouse ≥ 90 (01 §3); Cartel se diseña para cumplir ambos.

**Autocrítica** (lo que puede fallar; ninguna de estas dudas está resuelta por medición):

- Las palabras cortas del móvil (WEB, ECO, ON, VER) quedan pequeñas en proporción; el experimento de rotarlas 90° está reservado a M4.
- El chiste de HOLA/ola solo existe en español.
- La hachura del cartel LISTO puede confundirse con textura si el aro no se lee: el aro de 1 celda se mantiene y se prueba a 320 px.
- La mono como única voz puede sentirse «tech» (plan B en §3.1).
- Todo lo de rendimiento está medido en un PC y con proxies; **el A07 real es bloqueante**.
- Las figuras de este documento muestran glifos, no color; el color se aprueba en pantalla, en estático primero.

---

## 12. Riesgos, pendientes del dueño y decisiones cerradas

### 12.1 Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | El lienzo va a ≤ 30 fps y el texto scrollea a 60 a 120 Hz: desfase visible | el arte es de pantalla fija y ningún cartel necesita registro con el texto; la marea y los guiones se leen como profundidad; se revisa en el A07 |
| R2 | A07 sin medir | criterio de aceptación de §9.4 y escalera de 02 §8 (celdas, fps, octavas); bloquea la aprobación |
| R3 | El titular en mono se lee «tech» | escala de 96 px, composición de cartel, Cobalto; plan B: Bricolage 800 en h1/h2/h3 (+~30 KB y fallback corregido) |
| R4 | Se desconoce si Chrome cuenta `::before` como candidato de LCP | fuentes precargadas, fallback al 100 %, `h1` real; se mide en M1 |
| R5 | Letras de bloques con peso engordado (trazo de 0,03 em) pueden verse toscas | retoque manual de `words.gen.ts` y TTF estático de Bricolage 800 en lugar de engordar |
| R6 | El apagón puede leerse como fallo | texto real intacto, piloto siempre encendido, restauración visible, tono ≥ T2, suavizado de 250 ms; con movimiento reducido no existe |
| R7 | La página es larga (13 a 15 pantallas) | espina, índice y anclas; cada servicio se lee en dos pantallas; fase 2: páginas por servicio y `details` |
| R8 | WCAG 2.3.1 (destellos) | ninguna oscilación global > 2 Hz; cambios independientes por celda; suavizado; PEAT en M5 |
| R9 | Registro SSR ↔ lienzo con DPR fraccionario | se funden (no se superponen); tolerancia de 1 celda; prueba en cinco anchos |
| R10 | Cultural: la referencia a rótulos populares es de categoría, no de estilo | no se afirma ningún rasgo dominicano; el dueño aporta fotos de letreros para calibrar |
| R11 | Contexto político de monumentos (Obelisco, Faro a Colón) | fuera de la v1; la cruz de luz solo si el dueño la pide |
| R12 | Firefox y Safari sin medir (`round()` en CSS es Baseline 2024; `attr()` en `content` estándar) | matriz de §9.2; ascii-seams en WebKit y Firefox |
| R13 | El copy de 04 tiene capacidades sin confirmar | `confirm[]` bloquea producción (04 D11) |

### 12.2 Lo que decide o aporta el dueño

1. Aprobar el concepto y las **palabras** (GAYA, HOLA, WEB, LISTO, ECO, ON, VER), incluido el chiste HOLA/ola. Cambiar una palabra es cambiar datos, no el motor.
2. **Solo mono** (recomendado) o **mono con Bricolage en h1/h2/h3**.
3. Confirmar las capacidades y compromisos [CONFIRMAR] del informe 04 (D11 y D13) y las pendientes de RNC y e-CF (D26).
4. Confirmar el nombre de la marca (Gaya Digital o Gaya Group): la palabra GAYA sirve con ambos.
5. Entregar el **logo** definitivo: sustituye el `▞` de la esquina.
6. Aportar **fotos de letreros y neones dominicanos** que le gusten, para calibrar el rótulo.
7. Decidir si quiere una **cruz de luz** (Faro) o Santo Domingo dibujado como fase 2.
8. Prestar un **Samsung A07** (o equivalente) para la validación bloqueante.

### 12.3 Decisiones cerradas

**Concepto y forma**
1. Serie de **nueve carteles de una palabra hecha de bloques**; la forma de cada palabra es lo que el servicio hace; quieto en reposo, líquido al tocarlo; una marea entre carteles.
2. Palabras: **GAYA · HOLA/HELLO · WEB · LISTO/READY · ECO/ECHO · ON · VER/SEE · HOLA·LISTO · GAYA**.
3. Materiales: agua, olas, obra, agujas, isolíneas, neón, ventanas, hilo, reflejo.
4. **Rótulo de bloques**: cara, aro de 1 celda (T11), luz de borde (T13), sombra proyectada (+2, +1) en T3.
5. Las palabras se generan una vez desde **Bricolage Grotesque 800** (OFL) a cuadrantes 2×2 con la proporción exacta de celda, se guardan como datos RLE y admiten retoque manual; en producción no hay fuente ni generador.
6. Tres variantes por palabra (`stack`, `mid`, `wide`); se elige la mayor que quepa con 4 columnas de margen.
7. Ninguna palabra se recorta por el borde; alternan ancho (51 a 95 %) y alineación.
8. ≥ 40 % de aire por pantalla; el susurro ≤ 8 % de las celdas de aire y siguiendo filamentos (nunca trama uniforme).

**Tipografía y escala**
9. **Geist Mono Variable** única (`latin` + `symbols2`, 28,9 KB, precargadas); Bricolage sale de la portada; plan B documentado (§3.1).
10. Cuatro peldaños: palabra (324 px de letra), h1 `clamp(2,75rem, 1rem + 7,4vw, 6rem)` en 800, h2/h3 `clamp(1,75rem, 1rem + 3,4vw, 3,75rem)` en 800, cuerpo 17 px a 1,65 y ≤ 62 ch, etiqueta 14 px y microdato 13 px.
11. Celdas de 6×12, 9×18 y 12×25 px por visor; lienzo en píxeles de dispositivo enteros con DPR ≤ 2; el póster SSR y el lienzo se funden.
12. Alfabeto: módulos, sombras, agua, línea (trazos gruesos por código); prohibidos `→ ← ✓ ■ ● ◆ ▲`, Braille, emoji.

**Color y legibilidad**
13. Escalera T0 a T15 generada desde `--glow-*`; T≥9 ≤ 6 %, T≥13 ≤ 2 %, T14 y T15 ≤ 0,5 % del área.
14. Pozos: `ink` T7 (5,82:1), `lead` T6 (6,83:1), `muted` T4 (6,22:1), `chrome` T3; nunca texto sobre T8 o más claro; fundido de 2 celdas, nunca a cero.
15. Durante la permanencia el arte baja a un tope de T6 (`ghost(d)`).
16. Un solo suelo (T0) en toda la página: el ritmo lo dan los materiales, no el fondo.

**Arquitectura y movimiento**
17. **Un canvas fijo**; las escenas son funciones puras de `(a, d)`, calor y humedad; el arte es de pantalla fija y ningún cartel necesita registro con el texto.
18. **La marea es la costura**: frente ondulado en el borde real de cada sección; al deshacer, el interior antes que el aro; al formar, el aro antes que el interior.
19. Ignición ≤ 2,6 s con último fotograma idéntico al póster; después, cero movimiento autónomo; bucle a 30 fps con sueño a 1,6 s; tiers 9 000 / 6 500 / 4 200 / 2 400.
20. Calor (τ = 0,45 s), toque (anillo) y foco (pulso); cada cartel tiene su reacción; nunca `touch-action: none`.
21. El **hilo del proceso** está en el DOM (CSS `animation-timeline`), sin lienzo.
22. Sin GSAP ni Lenis; CSS scroll-driven solo para la capa DOM, bajo `@supports` y `no-preference`, con todo visible por defecto.
23. Suavizado de tono de ≈ 250 ms y ninguna oscilación global > 2 Hz.
24. Respaldo escalonado: WebGL2 → Canvas 2D por diferencias → póster SSR o fondo plano.
25. Carga diferida: el motor tras `load` + inactividad; una escena por archivo con `import()`; miniaturas en JSON aparte.

**Navegación**
26. Cuatro esquinas como chips sólidos sin desenfoque y, en móvil, barra inferior con WhatsApp dominante; espina de nueve marcas; índice con `popover`.
27. Ids localizados; un solo `h1`; `servicios` como grupo con `h2` solo para lectores y un `h3` por servicio.
28. Transiciones `@view-transition` nativas; el mismo motor en `/referencias/` con el cartel quieto.

**Contenido y honestidad**
29. Copy del informe 04 sin cambios (orden web, automatización, marketing, IT; 12 datos locales con fecha; D1 a D27 vigentes).
30. Cero cifras, clientes, testimonios o logos de Gaya; los únicos números: datos locales con fuente y fecha, hora y coordenadas de Santo Domingo, y «24–48 h» ([CONFIRMAR]).
31. Nunca se dice que la web la hizo una IA; «Automatización e IA» solo aparece como servicio.
32. Microdato: hora con `Intl` y coordenadas de Wikipedia; sin API, sin clima, sin «disponible ahora».
33. WhatsApp prellenado por servicio y por referencia; medición por etiquetas de chat, sin analítica.
34. JSON-LD `Organization` + `Service` sin `LocalBusiness` (gana 04 sobre 06).
35. El sello «Ejemplos · datos ficticios» se conserva.

**Accesibilidad**
36. Todo el arte: `aria-hidden`, `translate="no"`, `user-select: none`, `pointer-events: none`; póster SSR con `data-nosnippet` y `data-art` con `::before`.
37. `prefers-reduced-motion` y `saveData` = fotogramas `still`; `forced-colors` y `print` ocultan el lienzo.
38. Sin puertas, sin loaders, sin texto instructivo; las marcas de la espina se nombran con la sección.

**Calidad y alcance**
39. Presupuestos de §9.1; Lighthouse móvil ≥ 90 (mediana de 3), LCP < 2,5 s, CLS 0, TBT < 200 ms.
40. Paridad SSR ↔ motor, registro ≤ 1 celda, costuras, contraste, destellos y **A07 real (bloqueante)** antes de aprobar.
41. `?still&poster=<id>&a=&d=`, `window.__field`, `dispose()` obligatorios.
42. Cada cartel se revisa **en estático primero**, a 320, 375, 414, 768, 1024 y 1440 px.
43. **Fuera de la v1**: Santo Domingo dibujado, cruz de luz, FAQ, botón de pausa con brillo ambiente, palabras rotadas, páginas por servicio, migración de la galería a mono.
44. Se retiran `gsap`, `lenis`, `hero.ts`, `HeroCards`, `public/hero/*` y la fuente Bricolage de la portada.

---

## 13. Hitos

| Hito | Contenido | Puerta | Estimación [C] |
|---|---|---|---|
| **M0** | fuentes (`latin` + `symbols2`), celdas, `--art-lh`, tonos; `words.mjs` y las palabras horneadas; póster SSR de la portada; esquinas; **todo el contenido como HTML estático** de la página completa; sin motor | Lighthouse ≥ 90 estático; contraste; costuras; revisión de arte en estático | 1 a 2 días |
| **M1** | motor (grid, atlas, WebGL2 + Canvas 2D, tiers, sueño), escena `gaya` con ignición y calor, prueba de paridad | **A07**, LCP y TBT | 2 a 3 días |
| **M2** | relojes `a`/`d`, marea, pozos, susurro horneado; HOLA y WEB | destellos (PEAT) sobre la marea | 2 días |
| **M3** | LISTO, ECO (EDT), ON (apagón y linterna) | 30 fps en A07 con la CPU ×4 | 2 a 3 días |
| **M4** | VER (miniaturas), hilo del proceso (DOM), cierre con reflejo, espina e índice | peso de miniaturas medido | 2 a 3 días |
| **M5** | reducido, `saveData`, `forced-colors`, `print`, sin JS; QA completa; Safari y Firefox | matriz de §9.2 verde | 2 días |
| **M6** | copy de 04, lint, JSON-LD, `og:image`, revisión con el dueño | `[CONFIRMAR]` resueltos | 1 a 2 días |

Total: **12 a 17 días de trabajo** [C]. Lo primero que se ve (M0) ya es una página larga, informativa y hermosa; el movimiento se añade sin cambiar el contenido.

---

## 14. Fuentes

**Verificadas en esta sesión [V]:**
- Crouwel, New Alphabet: https://en.wikipedia.org/wiki/New_Alphabet · https://eyemagazine.com/feature/article/electrifying-the-alphabet (ficha MoMA vista solo en resultados de búsqueda: https://www.moma.org/collection/works/139322)
- Albers, Kombinationsschrift: https://bauhauskooperation.de/wissen/das-bauhaus/werke/druck-und-reklame/kombinationsschrift
- Estilo Suizo: https://www.thegraphicdesignschool.com/design-history/swiss-style-movement/
- Poesía concreta y Gomringer: https://www.theartstory.org/movement/concrete-poetry/ · https://contemporary.burlington.org.uk/articles/articles/eugen-gomringer
- Block Elements y ANSI art: https://en.wikipedia.org/wiki/Block_Elements · https://en.wikipedia.org/wiki/ANSI_art
- Knowlton y Harmon: https://en.wikipedia.org/wiki/Ken_Knowlton
- Rótulos: https://en.wikipedia.org/wiki/Rotulo · registro «Letreros populares dominicanos»: https://mediateca.centroleon.org.do/cgi-bin/koha/opac-imageviewer.pl?biblionumber=18096&imagenumber=11743
- Distancia euclídea en tiempo lineal (2012): https://cs.brown.edu/people/pfelzens/papers/dt-final.pdf
- Santo Domingo: https://en.wikipedia.org/wiki/Santo_Domingo
- LCP: https://web.dev/articles/lcp

**Informes previos del proyecto (leídos completos, salvo los anexos de código de 02 y 05 leídos parcialmente):** `docs/ascii/research/01-showcase.md` · `02-gpu-ascii.md` · `03-typography-accessibility.md` · `04-services-content.md` · `05-illustration-engine.md` · `06-motion-architecture.md`, y `src/scripts/hero.ts`, `src/styles/tokens.css`, `src/components/Hero.astro`, `PRODUCT.md`, `DESIGN.md`, `CONTRACT.md`, `brand.json`, `references.json`.

**Solo por resultados de búsqueda [S] (no abiertas):** MoMA (New Alphabet), Production Type, Medium sobre Crouwel; fichas de Gomringer en otros sitios; resultados de tendencias de tipografía cinética 2026 (no se usaron para decidir nada). El cupo de búsquedas web de la sesión se agotó antes de poder comprobar si el LCP cuenta el contenido generado con CSS; queda como riesgo R4.

---

## Apéndice A. Pruebas hechas y código de referencia

Todo se ejecutó en Node 24.19 (Windows 11) sobre archivos de una carpeta temporal, leyendo `@fontsource-variable/*`, `fontkitten` y `sharp` del `node_modules` del proyecto **sin modificarlo**; ningún archivo del proyecto se tocó salvo este documento. Las miniaturas de `public/posters/` se **leyeron** (no se copiaron). Los guiones no están en el repositorio: el código que importa está aquí.

### A.1 Medidas

| Medida | Resultado |
|---|---|
| Escalera de 16 tonos y contrastes con `--ink`, `--lead`, `--muted` (con `color.mjs`) | tabla de §4.1 |
| Contraste del anillo de foco `--accent-text` sobre T5, T6, T7 | 6,18 · 4,83 · 3,76 |
| Póster de la portada, SSR, texto UTF-8 | **ancho 160×50: 11 234 B, 1 584 B gz, 1 464 B br** · **apilado 56×60: 4 948 B, 840 B gz, 771 B br** |
| Once palabras (ES y EN), variante ancha, RLE de 1 byte por corrida con ida y vuelta comprobada | 3 924 B; 2 152 B gz; 1 914 B br (con 2 bytes por corrida: 7 104 B; 2 404 B gz) |
| Susurro (celdas de aire no vacías), umbral de la cresta y probabilidad por celda | **7,6 %** con 0,84 y 0,7 · 10,2 % con 0,80 y 0,7 · 13,2 % con 0,76 y 0,7 · 17,0 % con 0,72 y 0,75 |
| Campo completo de agua, 160×50 celdas | 0,90 ms/cuadro (0,113 µs por celda); variante de 2 octavas: 0,55 ms |
| Distancia euclídea exacta, píxeles cuadrados 264×136 | 7,1 ms |
| Distancia euclídea anisótropa en celdas, 171×48 | **0,27 ms** por iteración (caliente) |

### A.2 Error encontrado y corregido

El primer rasterizador calculaba las filas con la proporción `H·escala/subH` y las letras salían **el doble de altas** de lo que su tipografía marca (GAYA con 22 filas para 100 columnas, con las letras estiradas). La fórmula correcta para una celda de proporción `ρ` (alto/ancho = 2) es `filas = H · escala / ρ / 2` (con `escala` en subpíxeles por unidad de fuente). Con la corrección, GAYA a 100 columnas mide 12 a 13 filas. Cualquier generador futuro debe pasar la prueba: *la palabra a escala física debe tener la proporción de la fuente*.

Segundo error, en la figura de LISTO: el aro se decidía con la distancia con signo muestreada en el centro de la celda, y como la muestra cae a 1 subpíxel de un lado y a 2 del otro, el aro aparecía en unos bordes y faltaba en otros, con lo que las letras no se leían. Se sustituyó por la regla de vecindad que usan las demás palabras (`edgeDist(at, c, r, 1) <= 1` sobre los códigos de cuadrante). Norma: **el aro siempre se decide por vecindad de celdas, nunca por una distancia muestreada en el centro**; la distancia queda para las isolíneas del ECO y el tubo del neón, donde se compara con umbrales anchos.

### A.3 Código

**Agua («marea»)** — solo enteros y polinomios, apto para paridad SSR ↔ navegador:

```js
export function h2(x, y, s = 0) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
export function vnoise(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, oct, s = 0) { let v = 0, a = 0.5; for (let i = 0; i < oct; i++) { v += a * vnoise(x, y, s + i); x = x * 2.03 + 17.1; y = y * 2.03 - 9.3; a *= 0.5; } return v; }
export function marea(c, r, t = 0) {                               // 0..1: cresta del ruido deformado = filamentos
  const x = c * 0.055, y = r * 0.11;
  const qx = fbm(x + t * 0.02, y, 3, 1), qy = fbm(x + 5.2, y + 1.3 - t * 0.02, 3, 2);
  const h = fbm(x + 1.9 * qx, y + 1.9 * qy, 3, 3) / 0.94, ridge = 1 - Math.abs(2 * h - 1), r2 = ridge * ridge;
  return r2 * r2 * 0.85 + 0.25 * r2 * h;
}
const RAMP = [' ', '·', ':', '=', '*', 'y', 'a', 'A', 'G', '▒', '▓', '█'];      // 'y a A G' = el nombre; ▒▓█ solo en puntos calientes
```

**Letra de vidrio** (interior de agua con aro sólido, usada en las figuras de GAYA y del reflejo):

```js
// at(c,r) → código de módulo 0..15 de la palabra; 15 = celda llena
if (code === 15) {
  if (edgeDist(at, c, r, 1) <= 1) return '█';                                    // aro de 1 celda (T11)
  const d = 0.18 + 0.95 * marea(c, r, t);                                        // agua por dentro (T5..T9)
  return d > 1.02 ? '▒' : ' ·:=*yaAG'[Math.min(8, Math.max(1, (d * 9) | 0))];
}
if (code > 0) return QUAD[code];                                                 // borde: cuadrante nítido
return marea(c, r, t) > 0.84 && h2(c, r, 4) < 0.7 ? '·' : ' ';                   // aire: susurro ≈ 7,6 %
```

**Distancia euclídea anisótropa en celdas** (Felzenszwalb y Huttenlocher; `h` = separación física entre muestras: 1 en x, 2 en y para celda 1:2):

```js
const INF = 1e20;
function dt1d(f, n, h, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF; const P = (q) => q * h;
  for (let q = 1; q < n; q++) { let s = ((f[q] + P(q) ** 2) - (f[v[k]] + P(v[k]) ** 2)) / (2 * P(q) - 2 * P(v[k]));
    while (s <= z[k]) { k--; s = ((f[q] + P(q) ** 2) - (f[v[k]] + P(v[k]) ** 2)) / (2 * P(q) - 2 * P(v[k])); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < P(q)) k++; const dx = P(q) - P(v[k]); d[q] = dx * dx + f[v[k]]; }
}
export function edtCells(on, w, hh) {                                             // distancia (en anchos de celda) a la celda `on` más cercana
  const n = Math.max(w, hh), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1), g = new Float32Array(w * hh);
  for (let x = 0; x < w; x++) { for (let y = 0; y < hh; y++) f[y] = on[y * w + x] ? 0 : INF; dt1d(f, hh, 2, d, v, z); for (let y = 0; y < hh; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < hh; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; dt1d(f, w, 1, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
  return g;
}
```

**Glifo de línea tangente** (isolíneas del ECO; en una celda 1:2, `╱` y `╲` equivalen a ±63°):

```js
function tangentGlyph(sdfAt, x, y) {                                              // x,y en píxeles cuadrados (2 por columna, 4 por fila)
  const gx = sdfAt(x + 2, y) - sdfAt(x - 2, y), gy = sdfAt(x, y + 2) - sdfAt(x, y - 2);
  const phi = ((Math.atan2(gx, -gy) * 180) / Math.PI + 360) % 180;                // tangente = perpendicular al gradiente
  return phi < 31.5 || phi >= 148.5 ? '─' : phi < 76.5 ? '╱' : phi < 103.5 ? '│' : '╲';
}
```

**Aguja que aprende** (LISTO) y **tubo de neón** (ON):

```js
const NEEDLE = ['─', '╲', '│', '╱'], ease = (x) => 1 - (1 - clamp01(x)) ** 3;
const delay = 0.30 * h2(c, r, 5) + 0.25 * fbm(c * 0.08, r * 0.16, 2, 4), k = ease((d - delay) / 0.55);
const rnd = (h2(c, r, 11) * 4) | 0;
if (code === 0)  return h2(c, r, 17) < 0.15 * (1 - 0.75 * ease(d)) ? NEEDLE[rnd] : ' ';          // fuera: agujas sueltas que se apagan
if (code !== 15) return k > 0.5 ? QUAD[code] : (h2(c, r, 19) < 0.5 ? NEEDLE[rnd] : ' ');      // borde parcial: la silueta emerge
if (edgeDist(at, c, r, 1) <= 1) return k > 0.85 ? '█' : k > 0.35 ? '▓' : NEEDLE[rnd];         // aro de 1 celda: se cierra al final
return NEEDLE[k >= 1 ? 3 : k <= 0 ? rnd : (h2(c, r, 13) < k ? 3 : rnd)];                        // dentro: del azar a la hachura ╱

const tube = Math.abs(dist) < 0.95 && dist < 0.5;                                 // tubo = banda del contorno
const lit  = p < 0.25 ? 1 : p < 0.55 ? 1 - smooth(0.25, 0.45, p) : (distToLed < (p - 0.55) / 0.40 * 90 ? 1 : 0);
```

**Compresión de palabras** (RLE de 1 byte: nibble alto = módulo, nibble bajo = recuento − 1; ida y vuelta comprobada sobre las once palabras):

```js
const rle = (codes) => { const out = []; for (let i = 0; i < codes.length;) { let j = i; while (j < codes.length && codes[j] === codes[i] && j - i < 16) j++; out.push((codes[i] << 4) | (j - i - 1)); i = j; } return out; };
const unrle = (bytes, n) => { const out = new Uint8Array(n); let k = 0; for (const b of bytes) { const v = b >> 4, c = (b & 15) + 1; for (let q = 0; q < c; q++) out[k++] = v; } return out; };
```

**Ajuste de una palabra a un número de filas** (bisección sobre las columnas): rasterizar con `maskCodes(text, { cols })`, que devuelve `{ cols, rows, codes }`; `fit(text, rows)` busca el mayor `cols` tal que `rows_obtenidas ≤ rows` (12 iteraciones entre 20 y 170 columnas).

### A.4 Cómo reproducir

1. `fontkitten` (`create(readFileSync(woff2))`, `glyphForCodePoint(cp).path.toSVG()`, `advanceWidth`, `capHeight`) → SVG con el trazo de engorde → `sharp(svg).greyscale().raw()` → umbral 127 → cuatro subpíxeles por celda → tabla `QUAD`.
2. Los contrastes: `import { contrast, parseOklch } from 'src/lib/color.mjs'` con los tonos interpolados en OKLCH entre `--glow-0`, `--glow-1`, `--glow-2`, `--glow-3`.
3. Tamaños comprimidos: `zlib.gzipSync(txt, { level: 9 })` y `zlib.brotliCompressSync(txt, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } })`.
4. La marea, el eco, el neón, el reflejo y la hachura de LISTO se generaron con las funciones de arriba a 100 a 120 columnas.
