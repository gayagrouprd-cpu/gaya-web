# 06 · Movimiento, interacción y arquitectura de página larga (ASCII)

Fecha: 2026-09-30 · Proyecto: `gaya-web` (Astro 7 estático) · Tema: cómo se mueve, cómo responde y cómo se arma una página larga
que se sienta **una sola obra continua** hecha de texto.

Convención de fiabilidad: **[V]** leído en la fuente primaria en esta sesión · **[S]** dato de un resumen o buscador (secundario, sin abrir la
fuente primaria) · **[M]** medido por mí en este repo o con un script · **[C]** criterio propio (razonado, no verificado en fuente).

---

## 0. Resumen ejecutivo

Arquitectura recomendada, «**Un campo, muchas escenas**»:

```
 z  capa                                    qué es                                    JS
 ─  ──────────────────────────────────────  ────────────────────────────────────────  ─────────────
 3  nav real (pill) + espina de progreso    <nav> con enlaces reales; espina = CSS     CSS + 1 IO
 2  contenido (main > section#id)           TEXTO REAL semántico (h1/h2/p/ul/a)        ninguno
 1  pozos de lectura (data-well)            zonas donde el campo baja de tono          lo lee el motor
 0  CAMPO ASCII (position:fixed, 100lvh)    UN canvas + <pre> póster SSR (solo hero)   motor ~10 KB gz
```

- **Un único canvas fijo** detrás de todo. Las escenas son **funciones puras por celda** `(c, r, tiempo, scroll) → luminosidad`. La
  «costura» entre escenas coincide con el borde real de cada `<section>`: el arte y el texto se transforman en la misma línea.
- **El campo se calcula en CPU, por celda** (≈ 3–9 mil celdas, no millones de píxeles), se sube como una **textura de celdas** y una
  pasada WebGL la dibuja con un atlas de glifos. Respaldo Canvas 2D por tonos. Las mismas funciones corren en Node al construir
  y generan el **póster estático** del HTML: lo que ve quien pide movimiento reducido es exactamente un fotograma de la versión viva.
- **Sin GSAP. Sin Lenis en la v1.** CSS `animation-timeline` solo para la capa DOM (revelados, espina), con degradación limpia en
  Firefox; el campo y el scroll-spy usan JS ligero (scroll pasivo + `IntersectionObserver`).
- **Reposo real:** el bucle rAF se duerme ~1,6 s después de la última entrada (scroll, puntero, foco). 0 % de CPU en reposo, tope
  de 30 fps con acumulador (correcto en pantallas de 60/90/120 Hz), un solo canvas (memoria acotada), pausa en pestaña oculta.
- **Contraste por construcción:** el texto va sobre «pozos de lectura» donde el campo nunca supera un tono verificado (≥ 4,5:1).
- **Accesibilidad:** el ASCII es decoración (`aria-hidden`, `data-nosnippet`); el contenido está en HTML real. Nada de movimiento
  autónomo > 5 s (evita el criterio 2.2.2 sin botón de pausa); `prefers-reduced-motion` y `saveData` → cuadro fijo por escena.

---

## 1. Lo que ya existe en el repo (medido, [M])

| Hecho | Implicación |
|---|---|
| `gsap@3.15.0` y `lenis@1.3.26` están en `package.json` pero **ningún archivo de `src/`, `scripts/` ni los `.md` los importa o menciona** (grep). | No hay deuda: se pueden quitar de las dependencias. |
| Presupuesto de `scripts/budgets.mjs`: **JS de primera carga de la portada ≤ 60 KB gzip** (`homeJsGz`). | GSAP núcleo (28,3 KB gz) + ScrollTrigger (18,0 KB gz) = **46,3 KB = 77 %** del presupuesto. Descartado. |
| Tamaños medidos en `node_modules` (gzip -9): `lenis.min.js` 5,4 KB · `gsap.min.js` 28,3 KB · `ScrollTrigger.min.js` 18,0 KB · `ScrambleTextPlugin.min.js` 4,0 KB · `SplitText.min.js` 3,7 KB. | Lenis cabe; el resto no compensa. |
| `src/scripts/hero.ts` ya implementa: niveles por dispositivo, control adaptativo que solo baja, «reposo sin bucle continuo», `?still`, respaldo estático por `reduced`/`saveData`, `__hero` de depuración, ripples y «energía» ligada al scroll. | Se reutilizan los **patrones** (no el shader). El motor nuevo hereda `?still`, tiers y sueño. |
| `base.css` ya tiene `@view-transition { navigation: auto }` y desactiva animaciones de VT con `prefers-reduced-motion`. `Base.astro` **no** usa `<ClientRouter/>`. | Es MPA nativa con transiciones nativas: el campo se recrea por página (~decenas de ms). |
| CSP de producción: `script-src 'self'` (sin inline), `img-src 'self' data:`. `assetsInlineLimit: 0`. | Nada de scripts inline ni workers `blob:`; todo el JS va como archivo del mismo origen. |
| `Nav.astro` enlaza `${home}#servicios`, `#proceso`, `#contacto` **también en `/en/`** y `READY.services/process/contact = false`. | Falta localizar los ids (`#services`…) y activar los flags al construir las secciones. |
| `astro.config.mjs`: fuente mono = **Geist Mono Variable con `subsets: ['latin']`**. En `@fontsource-variable/geist-mono/wght.css` los caracteres de dibujo de cajas y bloques (`U+2500–259F`) están en el subset **`symbols2`** (5,8 KB) [M]. | Si el atlas usa `─│┌┐░▒▓█` **hay que añadir `symbols2`** o caerán a una fuente del sistema con otro ancho. `latin` pesa 23,1 KB [M]. |
| `--font-mono` hoy **no se usa** en ningún CSS y `<Font cssVariable="--font-mono" />` no lleva `preload`. | En un sitio ASCII la mono está sobre el pliegue: precargar solo `latin` (y `symbols2` si el póster usa cajas). |
| Navegadores en República Dominicana (StatCounter, ago-2026): Chrome 74,5 % · Safari 10,3 % · Edge 6,5 % · **Firefox 5,7 %** · Opera 0,9 % · Brave 0,9 %. Móvil: Android 57,3 % · iOS 42,7 % [V]. | Firefox (sin `animation-timeline` estable) es ≈ 1 de cada 17 visitas: degradación obligatoria, no opcional. |
| Muestra de tamaños de un «plato» ASCII (ruido fbm, rampa de 10 niveles), sin comprimir / gzip-9 / brotli-11: **48×64 = 3,05 / 0,79 / 0,75 KB · 160×50 = 7,84 / 1,60 / 1,49 KB · 200×60 = 11,77 / 2,38 / 2,21 KB** [M]. | Un póster SSR de hero cuesta ≈ 2–3 KB comprimido: es barato. Arte con más estructura se comprime distinto: re-medir con arte real. |

---

## 2. Hallazgos con URLs

### 2.1 Soporte de CSS scroll-driven animations y View Transitions

- **`animation-timeline`**: Chrome/Edge **115**, Safari **26**, Firefox «preview» (sin versión estable) según `mdn/browser-compat-data` [V]
  — https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/animation-timeline.json
- Un buscador afirmaba «Firefox 132+ / Safari 18+»: **contradice el JSON de MDN → descartado**. Firefox 152 (jun-2026) seguiría con la flag
  `layout.css.scroll-driven-animations.enabled` en estable y Safari 26.4 añadió animaciones en hilo aparte [S] —
  https://webkit.org/blog/17818/announcing-interop-2026/ · https://hacks.mozilla.org/2026/02/launching-interop-2026/ (este último, [V], lista
  scroll-driven animations, View Transitions entre documentos y scroll snap como áreas de Interop 2026, sin dar estado de Firefox).
- **Detección**: `@supports (animation-timeline: scroll())` (Chrome for Developers [V]) — https://developer.chrome.com/docs/css-ui/scroll-driven-animations
  · MDN — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- **Rango `contain`/`cover`/`entry`/`exit`**; `animation-duration: auto`; `animation-timeline` debe ir **después** del shorthand `animation`; corre en el
  compositor (Chrome [V]) · WebKit [V] añade envolver en `@media not (prefers-reduced-motion)` y que los efectos grandes son más riesgosos que una
  barra de progreso — https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
- **Trampas de uso** (Josh Comeau [V]): con `animation-range: contain` los keyframes iniciales no se aplican hasta que empieza el rango → usar
  `animation-fill-mode: backwards/both`; `timeline-scope` para timelines con nombre entre no-ancestros; polyfill que «no cubre timelines enlazados»;
  gate con `prefers-reduced-motion: no-preference` — https://www.joshwcomeau.com/animation/scroll-driven-animations/
- **Demos y depurador** (13 patrones, extensión de DevTools): https://scroll-driven-animations.style/ [V]
- **`@view-transition` entre documentos**: Chrome/Edge/Samsung/WebView **126**, Safari/iOS **18.2**, Firefox **no** [V] —
  https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/at-rules/view-transition.json · uso: nombres únicos, `pageswap`/`pagereveal`,
  quitar `view-transition-name` tras el snapshot por bfcache, `blocking="render"` [V] —
  https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using
- **Astro**: `<ClientRouter/>` convierte el sitio en SPA con `transition:persist`; las transiciones nativas «siguen siendo MPA»; los scripts de módulo se
  ejecutan **una sola vez** y se ignoran en navegaciones siguientes [V] — https://docs.astro.build/en/guides/view-transitions/
- **`scrollend`**: Baseline 2025 (dic-2025); **no se dispara si la posición no cambió**; en táctil/trackpad no termina hasta soltar [V] —
  https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event
- **Unidades `svh/lvh/dvh`**: `lvh` es estable frente a la barra de direcciones; Chrome 108, Firefox 101, Safari 15.4 [V] —
  https://web.dev/blog/viewport-units
- **OffscreenCanvas**: Chrome 69, Firefox 105, Safari 16.4 (2D) y **17 (WebGL/WebGL2)** [V] —
  https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OffscreenCanvas.json · beneficio: la animación no se detiene si el hilo principal
  se satura [S] — https://web.dev/articles/offscreen-canvas

### 2.2 Referencias de sitios y técnicas en modo texto

| Referencia | Qué se aprende | Licencia / estado |
|---|---|---|
| **aino.agency** — Awwwards **SOTD 20-may-2026**, nota 7,24; dev jury: animaciones 8,80, WPO 8,80 y **accesibilidad 7,00 (lo más bajo)**. «ASCII, 2D physics, real-time morphing — all at 30kb JS», rejilla de caracteres única para animación, columnas de texto, 3D y juegos, versión «modo texto» donde cada imagen y vídeo se muestra en la misma rejilla; rechazan scroll-reveals suaves, transiciones lentas y degradados a favor de cargadores pixelados y transiciones rápidas [V] — https://www.awwwards.com/sites/aino-agency · https://designeverywhere.co/work/aino | Aprender: **una sola rejilla como lenguaje**, JS chico, transiciones secas. Superar: su accesibilidad fue el punto débil. No copiar. |
| **Google · ML Fairness for Marketers** (Grow) — ASCII disparado por scroll con GSAP + Vue + WebGL [V] — https://www.awwwards.com/inspiration/ascii-scroll-triggered-animation-machine-learning-fairness (sitio: https://www.thinkwithgoogle.com/feature/ml-fairness-for-marketers/) | Precedente de **ASCII ligado a scroll dentro de una narrativa larga**. | Solo idea. |
| **ASCII Street View** (Teehan+Lax, SOTD 2012) — panoramas convertidos a ASCII en tiempo real con WebGL, dos colores [V] — https://www.awwwards.com/sites/ascii-street-view | Precedente histórico: paleta mínima + una sola pantalla continua. | Solo idea. |
| **`niccolofanton/morphing-ascii-shader`** — atlas SDF, **memoria por celda** (ping-pong a resolución de rejilla, suavizado exponencial, `rate` 2,25 por defecto), **morph SDF entre glifos** (interpolar dos campos de distancia y umbralizar), bordes Sobel [V] — https://github.com/niccolofanton/morphing-ascii-shader | Copiamos la **idea** de memoria por celda (en CPU, `Float32Array`) y dejamos el morph SDF como fase 2. | MIT |
| **AsciiMorph** (Tim Holman, 2016) — morph entre «cuadros» ASCII en el DOM; exige monoespaciada y misma rejilla [V] — https://github.com/tholman/ascii-morph | Confirma que el DOM sirve para piezas pequeñas; para pantalla completa no. | MIT |
| **textmode.js** — WebGL2, instancing agresivo, atlas de glifos reutilizables, capas con blend, fuente CC0 por defecto [V] — https://github.com/humanbydefinition/textmode.js/ | Arquitectura de referencia (rejilla + atlas + capas). No la adoptamos: tamaño no publicado y no encaja con textura de celdas propia. | MIT |
| **p5js-ascii-renderer** — fragmento GLSL que muestrea brillo y busca en un atlas generado desde la fuente [V] — https://github.com/humanbydefinition/p5js-ascii-renderer | Confirma el patrón «atlas + shader de búsqueda». | MIT |
| **ASCII Dissolve (Remocn)** — «la escena saliente se difumina bajo una rejilla de glifos y la entrante se resuelve celda a celda»; rampa `" .:-=+*#%@"`, tamaño de celda 22 [V] — https://remocn.dev/docs/transitions/ascii-dissolve | Nuestro **seam** (costura) usa la misma idea: banda de rampa que se «resuelve». | Licencia no indicada: solo idea. |
| **Pretext** (Cheng Lou) — medición y layout de texto sin DOM, MIT; demo «Variable Typographic ASCII» elige glifos por brillo **y ancho** [V] — https://github.com/chenglou/pretext · https://chenglou.me/pretext/variable-typographic-ascii/ | No hace falta con monoespaciada. Reservar si algún día se hacen placas con fuente proporcional. | MIT |
| **OffscreenCanvas · «WebGL ASCII»** — atlas «como un sprite sheet, uniforme, ordenado de claro a denso»; cita que Aino usa «HTML puro actualizado en cada cuadro» por problemas de capas y sincronía con scroll [V] — https://offscreencanvas.com/issues/webgl-ascii/ | Justifica **canvas fijo** frente a DOM por cuadro. | — |
| Codrops: «Beyond the Luminance Ramp» (2026-09-04), «Efecto» (2026-01-04), «ASCII Shader using OGL» (2024-11-13) | **No leídas: 403.** Aparecen en buscador; no se citan como aprendizaje. | — |

### 2.3 Texto que se revela, «decodifica» o escribe

- El scramble «canónico» de Justin Windle usa el juego `!<>-_\/[]{}—=+*^?#`: es **exactamente el disfraz de terminal/hacker** que el dueño
  no quiere [S] — https://codepen.io/soulwire/pen/mEMPrK (licencia no visible → no copiar código).
- `scrambleText` de Motion es **exclusivo de Motion+ (de pago)** [V] — https://motion.dev/docs/scramble-text → descartado.
- El `ScrambleTextPlugin` de GSAP es gratis en licencia estándar (todos los plugins, uso comercial; prohíbe usarlo en herramientas que compitan con
  el constructor visual de animaciones de Webflow) [V] — https://gsap.com/standard-license/ ; pesa 4,0 KB **más** los 28,3 KB del núcleo [M].
- Buenas prácticas de scramble (resultado de buscador [S]): dejar el texto final real en el DOM, mostrar el scramble como capa visual y respetar
  `prefers-reduced-motion`; monoespaciada evita saltos de ancho.
- **Máquina de escribir CSS** con `steps()` y ancho en `ch`: exige monoespaciada; ajustar `steps()` a la longitud; el cursor desborda con varias
  líneas [V] — https://css-tricks.com/snippets/css/typewriter-effect/

### 2.4 Rendimiento, batería y memoria

- **rAF**: el `timestamp` es el fin del cuadro anterior; se **pausa en pestañas ocultas**; la frecuencia iguala la del monitor (60/75/120/144 Hz)
  → usar tiempo, no «pasos por cuadro» [V] — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- **Tope de fps** con acumulador y módulo (`then = now - (delta % interval)`), MIT [V] — https://gist.github.com/addyosmani/5434533
- **Samsung Galaxy A07**: MediaTek Helio G99 (6 nm), pantalla 6,7″ HD+ **90 Hz**, 4/6/8 GB según mercado [S] —
  https://www.business-standard.com/technology/tech-news/samsung-galaxy-a07-mediatek-helio-g99-5000mah-battery-unveiled-specs-125082600527_1.html
  → a 90 Hz un tope de 30 fps es «cada 3.er cuadro».
- **Límite de contextos WebGL**: «los navegadores suelen limitar a 8–16» [V] — https://github.com/greggman/virtual-webgl ; el «16 en Chrome/Safari» de buscadores
  no pude verificarlo (la página del issue de Chromium exige sesión).
- **Memoria de canvas en iOS**: límite de **384 MB** (`getContext()` devuelve `null` al superarlo; un iPhone SE reportó «poco más de 200 MB»; la
  memoria no siempre se libera al recargar) [V] — https://bugs.webkit.org/show_bug.cgi?id=195325
- **`content-visibility: auto`** + `contain-intrinsic-size: auto …`: ahorro de render (ejemplo 232→30 ms), el árbol de accesibilidad se mantiene,
  find-in-page y anclas funcionan [V] — https://web.dev/articles/content-visibility
- **CSS de animación barata**: solo `transform` y `opacity` se quedan en el compositor; `will-change` con mesura [V] — https://web.dev/articles/animations-guide
- **`IntersectionObserver`** evita scroll + `getBoundingClientRect` en el hilo principal; callbacks asíncronos [V] —
  https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **LCP**: candidatos = `img`, `svg image`, `video` (póster), `background-image` y **elementos de bloque con texto**; **canvas no aparece**; el
  texto en fuente web no cuenta como pintado durante el periodo de bloqueo [V] — https://web.dev/articles/lcp
- **Fuentes en Astro**: fallbacks optimizados automáticos a partir del último fallback (`monospace`), `optimizedFallbacks:false` los desactiva;
  `preload` «con mesura» [V] — https://docs.astro.build/en/guides/fonts/

### 2.5 Lenis, GSAP y scroll

- README de Lenis (repo local `node_modules/lenis/README.md` [M] y GitHub [V] — https://github.com/darkroomengineering/lenis): corre sobre **scroll nativo**;
  `autoRaf` `false` por defecto; `syncTouch` `false` (táctil = nativo); `respectReducedMotion` **`true`** por defecto (desactiva el suavizado, pero
  «Lenis sigue corriendo»); **sin soporte de CSS scroll-snap** (existe `lenis/snap`); tope de 60 fps en Safari y 30 en modo bajo consumo; MIT.
- Verificado en el código de la 1.3.26 [M]: usa `wrapper.scrollTo(...)`, **no aplica transforms** → la posición de scroll real es la verdadera y
  `animation-timeline`/`IntersectionObserver` siguen funcionando. Un resumen de buscador decía lo contrario («posición falsa + transform»):
  **descartado por falso** para esta versión.
- Auditoría real de un sitio que lo usaba sin gate de `prefers-reduced-motion` ni pausa por visibilidad (issue #1998 de un repo personal) [V] —
  https://github.com/davidsneighbour/kollitsch.dev/issues/1998 (ilustra el riesgo; no es fuente de Lenis).
- `scroll-snap-type: mandatory` con secciones más altas que el visor deja contenido inalcanzable y perjudica teclado/zoom; usar `proximity` [V] —
  https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type

### 2.6 Accesibilidad

- **WCAG 2.2.2 Pausar, detener, ocultar (A)**: movimiento que empieza solo, dura **> 5 s** y va **en paralelo con otro contenido** necesita mecanismo;
  la precarga esencial está exenta [V] — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- **WCAG 2.3.1 Tres destellos**: > 3 por segundo en un área ≥ ~341×256 px (≈ 87 296 px², 25 % del campo de 10°) con cambios de luminancia relativa ≥ 10 %
  (oscuro < 0,80) [V] — https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- **F72**: el ASCII art es contenido no textual: si transmite algo necesita alternativa cerca; si es decorativo se oculta a la tecnología asistiva [V] —
  https://www.w3.org/WAI/WCAG22/Techniques/failures/F72 (F71 trata de otra cosa: caracteres parecidos de otros alfabetos).
- **ARIA 1.2**: `paragraph` y `generic` **no admiten nombre** (`aria-label`/`aria-labelledby` prohibidos); `heading` sí [V] — https://www.w3.org/TR/wai-aria-1.2/#paragraph
- **`content: "x" / ""`** (texto alternativo del contenido generado) — el contenido generado no está en el DOM y algunos lectores no lo anuncian;
  la sintaxis con `/` sí expone el alternativo [V] — https://developer.mozilla.org/en-US/docs/Web/CSS/content
- **`prefers-reduced-motion`: reducir ≠ eliminar**; quitar lo decorativo (parallax, entradas), mantener lo funcional; escuchar el evento `change` [V] —
  https://web.dev/articles/prefers-reduced-motion
- **`touch-action`** se intersecta con los ancestros hasta el contenedor que hace scroll; al empezar el paneo del navegador llega **`pointercancel`** [V] —
  https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

### 2.7 SEO

- Google **no admite fragmentos (`#`) para cambiar contenido**; canonical = la URL sin fragmento [V] —
  https://developers.google.com/search/docs/crawling-indexing/url-structure ; los enlaces «Ir a» salen a veces de encabezados con `id` y enlaces internos a
  ellos [S] — https://searchengineland.com/google-jump-to-links-within-search-snippets-26603
- **`data-nosnippet`**: solo `span`, `div`, `section`; HTML válido; **incluirlo al insertar el nodo**, no modificarlo después con JS [V] —
  https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- **schema.org `ProfessionalService`** (subtipo de `LocalBusiness`) admite `areaServed`, `hasOfferCatalog`, `makesOffer`, `knowsLanguage`, `founder`, `sameAs`,
  `address`, `email`, `telephone` [V] — https://schema.org/ProfessionalService

---

## 3. Arquitectura recomendada (detalle)

### 3.1 Comparación de alternativas

| Opción | Veredicto | Motivo |
|---|---|---|
| **A. Un canvas fijo + escenas por scroll** | **ELEGIDA** | Un contexto, memoria constante, sin CLS (posición fija), la costura sigue el DOM real, el póster SSR sirve de LCP y de versión estática. |
| B. Un canvas por sección | Descartada | N contextos WebGL (límite 8–16 [V]) y N× memoria (iOS 384 MB [V]); sincronía de scroll por canvas; arranque y pausa por canvas. |
| C. Un canvas «pegado» (`sticky`) por sección alta | Descartada | Paneles `sticky` de `100svh` con `overflow` recortan texto con zoom/reflow (WCAG 1.4.10) [C]; el canvas fijo ya «ancla» sin `sticky`. |
| D. `<pre>` por cuadro (estilo Aino) | Solo piezas pequeñas | Layout + pintura de miles de nodos por cuadro; Aino lo usa con escenas pequeñas y acepta problemas de capas [V]. Sirve para póster estático. |
| E. Shader por píxel a pantalla completa | Descartada | Se muestrea **una vez por celda**; calcular por píxel desperdicia ~99 % del trabajo y rompe la paridad SSR. |
| F. `<ClientRouter/>` + `transition:persist` para persistir el canvas | Descartada | Convierte la MPA en SPA (re-init de scripts, visor con iframes, anuncios de ruta); el crossfade nativo de VT basta. |
| G. GSAP ScrollTrigger (pins, scrub) | Descartada | 46,3 KB gz = 77 % del presupuesto; sticky/`view()` + 60 líneas de JS lo sustituyen. |
| H. `scroll-snap: mandatory` en la portada | Descartada | Trampa de teclado/zoom [V]; pelea con secciones largas de texto. |

### 3.2 Estructura de archivos (nombres orientativos)

```
src/ascii/
  glyphs.ts        LISTA ÚNICA de glifos + rampa + tonos (la usan SSR y runtime)
  noise.ts         hash/ruido/fbm deterministas (Math.imul; sin Math.sin/pow)
  scenes/*.ts      una escena por archivo (función pura por celda)
  grid.ts          medir celda, elegir rejilla por presupuesto de celdas
  engine.ts        estado, tick, sueño, tiers, entradas, costura, pozos
  render-gl.ts     textura de celdas + atlas → 1 quad
  render-2d.ts     respaldo: pasadas por tono con fillText por fila
  plate.ts         renderPlate(escena, cols, rows) → string (Node, para SSR)
  text.ts          decodeMono(), revelados
  nav.ts           scroll-spy con IntersectionObserver
src/components/AsciiField.astro    póster SSR + canvas + <script> del motor
src/components/sections/*.astro    section#id[data-scene] con texto real
```

Asignación de peso (gzip) **dentro** del techo de 60 KB de primera carga: motor + render ≤ 12 KB · escenas ≤ 6 KB · texto + nav ≤ 2 KB ·
**total ASCII ≤ 20 KB gz**; el resto del presupuesto queda para el menú, el visor y lo existente. `npm run budgets` es la puerta.

### 3.3 Ritmo de la página (propuesta de estructura; el guion final lo cierran los informes de arte y contenido)

| Capítulo (`id` ES / EN) | Altura mínima | Escena (propuesta) | Movimiento del campo |
|---|---|---|---|
| Portada (`inicio` / `home`) | 100svh | Marca «Gaya» que se condensa desde el ruido | Encendido ≤ 2,6 s (como el hero actual), estela del puntero, luego reposo |
| Quiénes somos (`nosotros` / `about`) | 120–150svh | Marea baja: campo lento, poca densidad | Flujo con paralaje de scroll |
| Web y apps (`web` / `web`) | 100svh | Marcos de ventana que se construyen fila a fila | Progreso de sección = filas dibujadas |
| Marketing y redes (`marketing`) | 100svh | Ondas concéntricas de emisión | Anillos desde el foco; energía = velocidad de scroll |
| Soporte e infraestructura IT (`soporte` / `it`) | 100svh | Retícula de nodos con «paquetes» por las líneas | Paquetes avanzan con el progreso |
| Automatización e IA (`ia` / `ai`) | 100svh | Malla que converge a un patrón | Convergencia = progreso |
| Proceso (`proceso` / `process`) | 120svh | Un trazo que recorre la pantalla | Longitud del trazo = progreso |
| Contacto (`contacto` / `contact`) | 100svh | Vuelve al campo de la portada (bucle visual) | Encendido corto, estela |

Regla de ritmo: alternar secciones densas de texto con **tramos de aire** (solo arte, `aria-hidden`, ≤ 70svh cada uno, ≤ 25 % del total). Página ≈ 9–10
alturas de pantalla (hoy es 1). Sin numeración de secciones ni rótulos sobre cada sección (reglas de `PRODUCT.md`).

---

## 4. Técnicas con detalle

### 4.1 Contrato de escena isomórfica (misma función en Node y navegador)

```ts
// src/ascii/noise.ts — determinista entre motores: solo enteros y aritmética simple
export function h2(x: number, y: number, s = 0): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x: number, y: number, s = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, oct: number, s = 0): number {
  let v = 0, a = 0.5;
  for (let i = 0; i < oct; i++) { v += a * vnoise(x, y, s + i); x = x * 2.03 + 17.1; y = y * 2.03 - 9.3; a *= 0.5; }
  return v; // ≈ 0..0.94
}
```

```ts
// src/ascii/scene.ts
export interface FieldInput {
  cols: number; rows: number;
  t: number;            // segundos de escena (con ?still → scene.still)
  scrollCells: number;  // scrollY / altoCelda: flujo con paralaje
  u: number;            // progreso 0..1 de la sección dentro del visor
  energy: number;       // 0..1 (velocidad de scroll + estela)
  oct: number;          // octavas según tier
}
export interface Scene {
  id: string;
  still: number;        // segundo representativo (póster, ?still, movimiento reducido)
  /** Luminosidad 0..1 de la celda (c, r). Puro: sin DOM, sin Math.random, sin asignaciones. */
  luma(c: number, r: number, f: FieldInput): number;
}

// Ejemplo: «marea baja»
export const marea: Scene = {
  id: 'marea', still: 21.7,
  luma(c, r, f) {
    const y = r + f.scrollCells * 0.35;
    const q = fbm(c * 0.045 + f.t * 0.02, y * 0.09, f.oct);
    const h = fbm(c * 0.05 + q * 1.7, y * 0.10 - f.t * 0.015, f.oct, 7);
    return Math.min(1, Math.max(0, (h - 0.18) / 0.62));
  },
};
```

Reglas: **prohibido `Math.sin/cos/pow/exp` dentro de `luma`** si se quiere paridad exacta póster↔runtime (los motores difieren en el último bit y
un glifo puede cambiar de nivel); aritmética entera y polinomios sí. Un solo módulo `glyphs.ts` define `RAMP = ' .:-=+*#%@'` (ASCII imprimible,
está en el subset `latin`) y la función `toneOf(luma)`; las cajas y bloques (`─│┌┐░▒▓█`) son opcionales y exigen `symbols2`.

```ts
// src/ascii/plate.ts — corre en Astro (frontmatter) y en pruebas de Node
export function renderPlate(scene: Scene, cols: number, rows: number, oct = 3): string {
  const f: FieldInput = { cols, rows, t: scene.still, scrollCells: 0, u: 0, energy: 0, oct };
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) line += RAMP[Math.min(RAMP.length - 1, (scene.luma(c, r, f) * RAMP.length) | 0)];
    out.push(line.trimEnd());
  }
  return out.join('\n');
}
```

### 4.2 Motor: ciclo de vida, tope de fps, sueño y adaptación

```ts
// src/ascii/engine.ts (esqueleto)
const TIERS = {                       // presupuesto en CELDAS, no en píxeles
  high: { maxCells: 9000, fps: 30, oct: 3, dpr: 2   },
  mid:  { maxCells: 6500, fps: 30, oct: 3, dpr: 2   },
  low:  { maxCells: 4200, fps: 30, oct: 2, dpr: 1.5 },
  min:  { maxCells: 2400, fps: 20, oct: 2, dpr: 1   },
} as const;
const NEXT = { high: 'mid', mid: 'low', low: 'min', min: null } as const;
const SLEEP_AFTER_MS = 1600;

let raf = 0, last = 0, awakeUntil = 0, energy = 0, lastY = scrollY;
const cost: number[] = [];            // anillo de ~45 muestras (ms de CPU por cuadro)

const canRun = () => mode === 'live' && !document.hidden && !menuOpen;

export function wake(ms = SLEEP_AFTER_MS) {
  awakeUntil = Math.max(awakeUntil, performance.now() + ms);
  if (!raf && canRun()) raf = requestAnimationFrame(tick);
}

function tick(now: number) {
  raf = 0;
  const interval = 1000 / tier.fps;
  const dt = now - last;
  if (dt < interval - 2) { raf = requestAnimationFrame(tick); return; } // 90 Hz → dibuja 1 de cada 3
  last = now - (dt % interval);                                          // sin deriva (idea del gist MIT)
  const dts = Math.min(dt, 50) / 1000;

  const t0 = performance.now();
  const y = scrollY;
  const v = Math.abs(y - lastY) / Math.max(dts, 1e-3); lastY = y;
  energy = Math.max(energy * Math.exp(-dts / 0.9), Math.min(1, v / 2400));  // energía por velocidad de scroll
  time += dts * (0.1 + energy * 0.85);

  decayHeat(dts);            // estela del puntero
  stampPointer();            // aplica el último punto (los eventos solo guardan, no dibujan)
  computeCells(y);           // escenas + costura + pozos + memoria por celda
  render();                  // sube textura de celdas + 1 draw (o pasadas 2D)
  frame++;

  cost.push(performance.now() - t0); if (cost.length > 45) cost.shift();
  adapt();

  if (performance.now() < awakeUntil || energy > 0.01 || heatSum > 0.5) raf = requestAnimationFrame(tick);
  else dbg.sleeping = true;   // el último cuadro queda dibujado; ya no hay bucle
}

function adapt() {            // solo baja de nivel (como hero.ts); mediana de las últimas 45 muestras
  if (cost.length < 45 || !NEXT[tierName]) return;
  const med = [...cost].sort((a, b) => a - b)[22];
  if (med > 0.45 * (1000 / tier.fps)) { setTier(NEXT[tierName]!); cost.length = 0; }
}
```

Fuentes de despertar (todas pasivas): `scroll`, `pointermove` (no táctil), `pointerdown`, `focusin`, `resize` (solo cambios de ancho), `visibilitychange`,
`pageshow` con `persisted` (bfcache: redibujar) y el cambio de `prefers-reduced-motion`. Pestaña oculta → cancelar rAF (el navegador ya lo pausa, pero se cancela para
no arrastrar `dt`). `scrollend` puede adelantar el sueño, pero **no es fiable como único disparador** (no se emite si no hay cambio de posición; en táctil espera a soltar): el
temporizador de 1,6 s es el contrato.

Modos: `live` (movimiento), `still` (movimiento reducido o `saveData`: **un cuadro por escena**, sin bucle) y `poster` (solo el `<pre>` SSR, sin canvas: `?poster`, sin WebGL ni 2D,
o tier agotado). `?still` (ya usado en el repo) congela `time = scene.still` y desactiva entradas, para capturas y regresión visual.

### 4.3 Modelo de scroll: offsets en caché, escena por fila, costura

Nada de `getBoundingClientRect` dentro del bucle. Se mide al cargar, al cambiar de **ancho**, al cargar las fuentes y cuando un `ResizeObserver` avisa de que cambió una sección; se guardan
**coordenadas de documento** (`rect.top + scrollY`).

```ts
type Band = { top: number; bottom: number; scene: Scene };  // en px de documento
let bands: Band[] = [];
function measure() {
  const y = scrollY;
  bands = [...document.querySelectorAll<HTMLElement>('main > section[data-scene]')].map((s) => {
    const r = s.getBoundingClientRect();
    return { top: r.top + y, bottom: r.bottom + y, scene: SCENES[s.dataset.scene!] };
  });
  wells = [...document.querySelectorAll<HTMLElement>('[data-well]')].map((e) => {
    const r = e.getBoundingClientRect(); return { x0: r.left, x1: r.right, top: r.top + y, bottom: r.bottom + y };
  });
}
```

Cada fila tiene su escena según su posición en el **documento** (`docY = scrollY + (r + 0.5) * alto`), de modo que el arte cambia **en la misma línea** donde el texto cambia de
sección. Cerca del borde (banda de `W = 4` filas) se mezcla con la escena vecina:

```ts
for (let r = 0; r < rows; r++) {
  const docY = y + (r + 0.5) * ch;
  const k = bandAt(docY);                        // búsqueda binaria sobre bands[]
  const dUp = (docY - bands[k].top) / ch;        // filas desde el borde superior de su sección
  const dDn = (bands[k].bottom - docY) / ch;     // filas hasta el borde inferior
  let nb = -1, s = 1;                            // s: peso de la escena propia (0.5 en el borde → 1 fuera de la banda)
  if (k > 0 && dUp < W)                { nb = k - 1; s = 0.5 + dUp / (2 * W); }
  else if (k < bands.length - 1 && dDn < W) { nb = k + 1; s = 0.5 + dDn / (2 * W); }
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    let L = bands[k].scene.luma(c, r, f);
    let glow = 0;
    if (nb >= 0) {
      const Lb = bands[nb].scene.luma(c, r, f);
      L = Lb + (L - Lb) * s;                     // mezcla lineal de luminosidad
      const g = 1 - Math.abs(2 * s - 1);         // 1 en el borde, 0 fuera de la banda
      glow = g * g * (0.35 + 0.35 * h2(c, r, 3));// «pliegue de luz»: sube densidad y tono en la costura
      L = Math.min(1, L + glow * 0.6);
    }
    // pozos de lectura y estela se aplican aquí (ver 4.4 y 4.5)
    mem[i] += (L - mem[i]) * memRate;            // memoria por celda: inercia, menos parpadeo
    glyph[i] = rampIndex(mem[i], c, r, glow);    // con histéresis: solo cambia si |Δnivel| ≥ 1
    tone[i]  = glow > 0.35 ? 3 : toneOf(mem[i]);
  }
}
```

Coste: una evaluación de `luma` por celda (dos solo en la banda). Con 9 000 celdas y 3 octavas son ≈ 27 000 evaluaciones de ruido de valor por cuadro; a 30 fps el tope
[C] es del orden de pocos ms en un Cortex-A76: **se valida en el A07** (4.11) antes de aceptar los tiers. Con 90 Hz el motor no calcula 60 cuadros «de más».

`memRate = 1 - exp(-dts * 6)` durante el scroll y `-dts * 2.25` en reposo (el valor por defecto de `morphing-ascii-shader` [V]). La costura, además de
transformar, **explica el capítulo sin texto**: el pliegue de luz aparece exactamente donde empieza otra sección.

### 4.4 Pozos de lectura: contraste por construcción

El texto real va **encima** del canvas. En vez de esperar que el campo sea discreto, cada bloque de lectura (`[data-well]`) declara una zona donde el campo se limita:

```ts
// dentro del bucle de celdas, tras calcular L
for (const w of wellsVisible) {                       // wells ya trasladados a coordenadas de visor
  if (px < w.x0 || px > w.x1 || py < w.top || py > w.bottom) continue;
  const edge = Math.min(px - w.x0, w.x1 - px, py - w.top, w.bottom - py) / (2 * cw);  // 0 en el borde
  const k = smooth01(edge);                            // 0 en el borde exterior → 1 dentro: 2 celdas de fundido
  L = L * (1 - k) + Math.min(L, WELL_MAX) * k;         // WELL_MAX ≈ 0.28 → solo tonos 0 y 1
}
```

- `WELL_MAX` se elige para que el tono más claro permitido dentro del pozo (tono 1) mantenga **≥ 4,5:1** con `--ink`/`--lead` (y ≥ 3:1 en texto grande); se añade el par al
  `tokens.json` y `npm run contrast` lo comprueba. Contraste garantizado **por construcción**, no por inspección.
- Los pozos usan `rect - scrollY` del caché; nunca se leen del DOM en el bucle. Con zoom del navegador cambia `innerWidth`: se re-mide.
- El borde del pozo puede dibujarse con caracteres de caja (`┌─┐`) como marco de arte; el texto no depende de ello.
- En `still`/`poster`, el póster SSR aplica los mismos pozos (posiciones fijas del layout base).

### 4.5 Puntero, táctil y teclado (sin texto instructivo: el campo responde y eso se entiende)

| Entrada | Respuesta | Nota técnica |
|---|---|---|
| Ratón / lápiz (`pointermove`) | **Estela**: se estampa un núcleo gaussiano (radio ≈ 7 celdas de ancho, corregido por proporción de celda) en `heat[]`; decae con τ ≈ 0,45 s; suma luminosidad y sube el tono | Los eventos solo guardan `(x, y)`; se estampa una vez por tick (a 120 Hz llegan más eventos que cuadros) |
| Táctil, arrastre | **Manda el scroll**: con `touch-action` por defecto/`pan-y` el navegador toma el gesto y llega `pointercancel` [V]; la respuesta táctil principal es la **energía por velocidad de scroll** | No fijar `touch-action: none` (se intersecta con ancestros y mata el scroll) |
| Táctil, toque | **Onda**: anillo que se expande ≈ 1,2 s desde el punto | `pointerdown` pasivo, sin `preventDefault`; ≤ 3 ondas vivas |
| Teclado / foco | `focusin` en `a, button` estampa una **pulsación** en el centro del elemento; `:hover` de ratón hace lo mismo | Igualdad de trato: quien navega con Tab ve la misma reacción |
| Reposo | Nada se mueve solo. Encendido inicial ≤ 2,6 s (esencial: precarga). | Evita 2.2.2 sin botón de pausa |

```ts
function stamp(cx: number, cy: number, s: number) {       // cx, cy en celdas
  const R = 7, R2 = R * R, ar = ch / cw;                   // ar ≈ 2: la celda es más alta que ancha
  const rr = Math.ceil(R / ar);
  const c0 = Math.max(0, Math.floor(cx - R)), c1 = Math.min(cols - 1, Math.ceil(cx + R));
  const r0 = Math.max(0, Math.floor(cy - rr)), r1 = Math.min(rows - 1, Math.ceil(cy + rr));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const dx = c - cx, dy = (r - cy) * ar, d2 = dx * dx + dy * dy;
    if (d2 > R2) continue;
    const w = 1 - d2 / R2, i = r * cols + c;
    heat[i] = Math.max(heat[i], w * w * s);               // máximo, no suma: evita saturar
  }
}
function decayHeat(dts: number) {
  const k = Math.exp(-dts / 0.45); heatSum = 0;
  for (let i = 0; i < heat.length; i++) { heat[i] *= k; heatSum += heat[i]; }
}
```

Un botón de **movimiento activado/desactivado** (icono, `aria-pressed`, `aria-label` corto, sin texto visible) es opcional para la fase 2; el estado se guardaría en `localStorage` con
`try/catch` (solo comodidad del visitante).

### 4.6 Texto: qué se anima, qué no, y cómo sin romper accesibilidad

**Regla madre:** el texto real está siempre en el HTML final y legible sin JS; toda animación es una capa que puede fallar sin ocultar nada (*fail-open*).

1. **Titulares en la tipografía de display (h1/h2, Bricolage)** — **no se sustituyen glifos** (los anchos proporcionales cambiarían el salto de línea). Se revelan por palabra con el patrón
   que ya usa el hero (`.w` con `--i`): `opacity` + `translate`, solo con `animation-timeline: view()` donde exista; en el resto, visibles.
2. **El `h1` de portada (candidato a LCP) nunca se oculta ni se anima al cargar**: la sorpresa la da el campo. Ocultar texto con `color: transparent` retrasa o falsea el LCP [C].
3. **Microetiquetas en mono** (chips de servicio, etiquetas de la espina, reloj de Santo Domingo si se incluye — dato real vía `Intl.DateTimeFormat` con
   `timeZone: 'America/Santo_Domingo'`): **decodificación por capa superpuesta**. Como la mono tiene avance fijo, la capa no altera el layout.

```ts
// src/ascii/text.ts — el texto real NO se toca; la capa es aria-hidden y se destruye pase lo que pase
const DEC_RAMP = ' .:-=+*#';                                    // NO el juego «hacker» !<>-_\/[]{}
export function decodeMono(el: HTMLElement, ms = 520, stagger = 26) {
  if (reduced || mode !== 'live') return;
  const final = el.textContent ?? '';
  const ov = document.createElement('span');
  ov.className = 'dec'; ov.setAttribute('aria-hidden', 'true');
  el.append(ov); el.classList.add('is-dec');                    // CSS: .is-dec{position:relative;color:transparent} .dec{position:absolute;inset:0;color:var(--accent-text)}
  const t0 = performance.now();
  const done = () => { ov.remove(); el.classList.remove('is-dec'); clearTimeout(guard); };
  const guard = setTimeout(done, ms + final.length * stagger + 400);   // guardia: si algo falla, el texto vuelve
  (function step(now: number) {
    const t = now - t0; let s = '', open = false;
    for (let i = 0; i < final.length; i++) {
      const p = (t - i * stagger) / ms;                          // progreso de la letra i
      if (final[i] === ' ' || p >= 1) s += final[i];
      else { open = true; s += p <= 0 ? ' ' : DEC_RAMP[Math.min(DEC_RAMP.length - 1, (p * DEC_RAMP.length) | 0)]; }
    }
    ov.textContent = s;
    if (open) requestAnimationFrame(step); else done();
  })(t0);
}
```

   - La letra **atraviesa la rampa de densidad** (` .:-=+*#`) y solo al final aparece el carácter real: se «resuelve desde la luz», coherente con el campo; no es scramble aleatorio.
   - Máximo ≈ 0,5–0,9 s por elemento, disparado **una sola vez** por `IntersectionObserver` con `threshold: 0.6`; nunca en botones de acción (WhatsApp) ni en enlaces de navegación principal.
   - Espera a `document.fonts.ready` (si no, el ancho de la mono es el del fallback).
4. **Párrafos**: no se anima carácter a carácter. `aria-label` está **prohibido** en `p`/`generic` [V]; solo se revelan por bloque (opacidad + translate) o no se revelan.
5. **Máquina de escribir CSS**, solo en etiquetas de **una línea** en mono; sin `width` (provoca layout): recorte con `clip-path` y `steps()`:

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .type {                                   /* --n = nº de caracteres, se escribe en el HTML al construir */
      animation: type linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 55%;
      animation-timing-function: steps(var(--n));
    }
    @keyframes type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
  }
}
```

6. **Revelado de bloques** y espina con scroll-driven CSS, con degradación **a nada** (contenido visible) en navegadores sin soporte. No se usa clase `.js` para esconder contenido (la CSP prohíbe scripts inline y un
   script externo bloqueante añade una petición; además ocultar «por si acaso» rompe el contrato de contenido visible por defecto):

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .rise { animation: rise linear both; animation-timeline: view(); animation-range: entry 5% entry 55%; }
    @keyframes rise { from { opacity: 0; transform: translateY(1.25rem); } to { opacity: 1; transform: none; } }
  }
}
```

   `both` cubre el `backwards` que necesitan los rangos [V]. Solo `opacity`/`transform` (compositor) [V].

### 4.7 Espina de navegación, anclas y scroll-spy

- **Menú real**: el `<nav>` existente (pill) con enlaces a `#nosotros`, `#servicios`… **ids localizados** por idioma (`/en/`: `#about`, `#services`, `#process`, `#contact`) y los `READY.*` en `true`.
- **Espina ASCII** (decorativa, `aria-hidden`): columna fija de glifos `│` con un marcador `◆`/`█` que baja con el scroll. Solo CSS, compositor:

```css
.spine { position: fixed; inset-block: var(--space-8); inset-inline-end: var(--space-4); }
.spine__mark {
  animation: spine linear both;
  animation-timeline: scroll(root block);          /* después del shorthand `animation` */
}
@keyframes spine { from { translate: 0 0; } to { translate: 0 calc(100lvh - var(--space-8) * 2 - 1lh); } }
@media (prefers-reduced-motion: reduce) { .spine__mark { animation: none; } }
```

- **Scroll-spy** con `IntersectionObserver` (sin listeners de scroll): banda fina en el centro del visor; actualiza `aria-current="location"`; **no** toca el historial.

```ts
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) setCurrent((e.target as HTMLElement).id);
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
```

- **Anclas**: `html { scroll-padding-top: 5.5rem; }` (nav fija); `scroll-behavior: smooth` **solo** dentro de `@media (prefers-reduced-motion: no-preference)`; cada `section` con `aria-labelledby` apuntando a su `h2`.
- **Bordes ASCII en la UI** con pseudoelementos: usar la sintaxis alternativa para que no se lean como «corchete izquierdo»: `a::before { content: "[ " / ""; }` [V]. Objetivos táctiles ≥ 44 px se mantienen.

### 4.8 View Transitions: que el campo «persista» entre páginas sin `ClientRouter`

Las páginas `/`, `/referencias/`, `/referencias/<slug>/` montan el **mismo campo** (escena «quieta» en galería y visor). Al navegar, el snapshot viejo y el nuevo son casi idénticos → el cruce nativo parece continuidad.

```css
.nav   { view-transition-name: site-nav; }
.field { view-transition-name: ascii-field; }
::view-transition-group(site-nav),
::view-transition-group(ascii-field) { animation-duration: 0s; }              /* no viajan: se cruzan en su sitio */
::view-transition-old(site-nav) { display: none; }                            /* la nav no parpadea */
::view-transition-old(ascii-field), ::view-transition-new(ascii-field) { animation-duration: 240ms; }
```

- Nombres únicos por página (si se repite, la transición se cancela) [V]. Firefox no tiene VT entre documentos [V]: navegación normal.
- Si algún día se añade `view-transition-name` por JS (`pageswap`/`pagereveal`), **quitarlo tras el snapshot** por bfcache [V].
- Ya existe la desactivación con `prefers-reduced-motion` en `base.css`.

### 4.9 Movimiento reducido y ahorro de datos: matriz completa

| Función | `no-preference` | `reduce` | `saveData` |
|---|---|---|---|
| Campo | Vivo (30 fps, sueño) | **Un cuadro por escena** (`scene.still`), corte seco al cambiar de sección | Igual que `reduce` |
| Encendido inicial | ≤ 2,6 s | Sin animación | Sin animación |
| Costura entre escenas | Banda con pliegue de luz que sigue el scroll | Corte seco en el borde de sección | Ídem |
| Estela / ondas / foco | Sí | No (los estados `:hover/:focus` de color se mantienen) | No |
| Decodificación de etiquetas | Sí (una vez) | Texto final | Texto final |
| Revelados `view()` | Sí | Ninguno (visible) | Ninguno |
| `scroll-behavior: smooth` / Lenis | Sí / no (v1) | Salto directo | Salto directo |
| View Transitions | Crossfade 240 ms | Ninguna (`base.css`) | Igual que `no-preference` |
| Espina | Se desplaza | Fija en su posición inicial | Se desplaza (es CSS) |

«Estático hermoso» = el mismo campo, un fotograma pensado (`scene.still`) por escena. **Reducir no es eliminar** [V]: se conservan los cambios funcionales de estado. Escuchar `matchMedia(...).addEventListener('change', …)`
para pasar de `live` a `still` sin recargar [V]. Con `forced-colors: active` el campo se oculta (`display: none`) y queda el texto con los colores del sistema [C].

### 4.10 Batería y CPU: presupuesto y estrategias

- **Sin actividad = sin bucle** (sección 4.2). El único consumo continuo posible es el scroll del propio usuario.
- **Tope de 30 fps** con acumulador: en el A07 (90 Hz [S]) dibuja 1 de cada 3 cuadros; a 60 Hz, 1 de cada 2; en 120 Hz, 1 de cada 4. En Safari con bajo consumo rAF ya baja a 30 fps [V, README de Lenis].
- **Tamaño por celdas, no por dpr×ancho**: `makeGrid()` escala la celda uniformemente hasta `maxCells`; un monitor 4K no multiplica el trabajo:

```ts
export function makeGrid(vw: number, vh: number, base: { cw: number; ch: number }, maxCells: number) {
  const k = Math.max(1, Math.sqrt((vw * vh) / (base.cw * base.ch * maxCells)));
  const cw = base.cw * k, ch = base.ch * k;
  return { cols: Math.ceil(vw / cw), rows: Math.ceil(vh / ch), cw, ch };
}
```

- **Un solo canvas** con `alpha: false`, `antialias: false`; DPR limitado por tier (2 / 1,5 / 1). Memoria orientativa [C]: 720×1600 a DPR 1,75 ≈ 4,6 MB por búfer; ×2–3 con doble búfer ≈ 10–14 MB; atlas 512² ≈ 1 MB; textura de celdas < 64 KB. Ocho canvases serían ≈ 8× y ocho contextos.
- **No redimensionar el canvas por la barra de direcciones**: capa `position: fixed; height: 100lvh` y recalcular solo cuando cambian ancho, dpr o tier [V unidades]. Reasignar `canvas.width/height` en iOS es costoso y hay reportes de fugas al redimensionar un WebGL en pantalla [S] (https://www2.webkit.org/show_bug.cgi?id=219780).
- **Pausas**: `document.hidden`, menú móvil de pantalla completa abierto, `webglcontextlost` (`preventDefault()` y restaurar; si falla, `render-2d`), y `pageshow`/`persisted`.
- **Arranque**: la inicialización pesada (atlas, primer cálculo) tras `load` con `requestIdleCallback` si existe y `setTimeout` si no; el póster SSR ya pintó el LCP. Esperar `document.fonts.load('400 16px "Geist Mono Variable"')` antes de hornear el atlas.
- **Worker + OffscreenCanvas**: fase 2, **solo si** en el A07 el p95 de CPU por cuadro supera ≈ 8 ms o el TBT de Lighthouse falla; soporte Chrome 69 / Firefox 105 / Safari 16.4 (2D) y 17 (WebGL) [V]. La CSP exige el worker como archivo del mismo origen (`blob:` queda bloqueado por `script-src 'self'`) [C].
- **`content-visibility: auto`**: no en la v1. Con ≈ 8 secciones de poco texto el ahorro es pequeño y complica el caché de offsets (tamaños estimados hasta que se pintan) [C]; reabrir si Lighthouse muestra coste de render.

Medir siempre con un objeto de depuración análogo a `__hero`: `window.__field = { tier, cols, rows, frames, sleeping, costP50, costP95, mode }`.

### 4.11 Rejilla: alinear DOM y canvas sin deriva

```ts
export function measureCell(fontPx: number, family: string, lineHeightRatio = 1.9) {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `400 ${fontPx}px ${family}`;
  const cw = c.measureText('M'.repeat(100)).width / 100;     // avance REAL, fraccionario
  return { cw, ch: Math.round(fontPx * lineHeightRatio) };   // alto entero en px: nada de líneas borrosas a dpr 1
}
```

- Cada celda se dibuja en `x = c * cw` (no acumulando avances) → sin deriva en 200 columnas.
- CSS del DOM en mono: `font-variant-ligatures: none; font-kerning: none; letter-spacing: 0; line-height: var(--cell-h);` y `--cell-w/--cell-h` publicados en `:root` tras medir.
- Pozos, espina y bordes usan `calc(var(--cell-h) * n)` y múltiplos de `--cell-w` (alineados a la rejilla del campo).
- Atlas: una sola lista de glifos (`glyphs.ts`), celdas con **1 px de relleno** para que el filtrado lineal no sangre entre glifos, horneado con `fillText` centrado tras cargar la fuente.

Boceto del fragmento (solo el principio; el detalle es del informe de render):

```glsl
uniform sampler2D uCells, uAtlas; uniform vec2 uGrid, uAtlasCells; uniform vec3 uBg, uT0, uT1, uT2, uT3;
varying vec2 vUv;                                   // 0..1, y hacia abajo
void main(){
  vec2 g = vUv * uGrid, cell = floor(g), f = fract(g);
  vec4 d = texture2D(uCells, (cell + 0.5) / uGrid);
  float gi = floor(d.r * 255.0 + 0.5), ti = floor(d.g * 255.0 + 0.5);
  vec2 ac = vec2(mod(gi, uAtlasCells.x), floor(gi / uAtlasCells.x));
  float a = texture2D(uAtlas, (ac + clamp(f, 0.03, 0.97)) / uAtlasCells).r;
  vec3 col = ti < 0.5 ? uT0 : ti < 1.5 ? uT1 : ti < 2.5 ? uT2 : uT3;   // sin indexar uniform[] con variable (WebGL1)
  gl_FragColor = vec4(mix(uBg, col, a), 1.0);                          // uBg = --surface
}
```

Respaldo Canvas 2D: **una pasada por tono** (4 tonos × N filas de `fillText` con una cadena por fila y espacios donde no toca) en vez de una llamada por celda; con ≈ 65 filas son ≈ 260 llamadas por cuadro en móvil. Un benchmark ajeno mostró que **cachear glifos y usar `drawImage` no gana** a dibujar directo en Canvas 2D (0,91–0,98×; 10 000 glifos en ≈ 4,2 ms en Chromium/M-series) [V] — https://github.com/coder/ghostty-web/issues/163 — aplicable solo a ese caso; **medir en el A07**.

### 4.12 SEO y anclas en una sola página larga

- URL única por idioma (`/`, `/en/`). Google no indexa fragmentos como contenido [V]: la profundidad SEO viene de **texto real bajo `h2` con `id`** y de enlaces internos a esos ids (a veces salen como «Ir a…» [S]).
- Fase 2 recomendada: **cuatro páginas de servicio** (`/servicios/desarrollo-web/` …) reutilizando el mismo campo con otro `data-scene`; en la portada, las anclas siguen como resumen.
- El ASCII decorativo va **fuera del texto indexable**: `<div data-nosnippet aria-hidden="true"><pre>…</pre></div>` presente en el HTML inicial (Google pide no añadir el atributo luego por JS [V]); en modo vivo el `<pre>` se retira (`hidden`) cuando el canvas
  toma el relevo, lo que además lo saca de la búsqueda en página [C].
- JSON-LD (Base.astro ya acepta `jsonLd`): `ProfessionalService` con `name`, `url`, `email`, `telephone`, `areaServed`, `knowsLanguage: ['es','en']`, `founder` (Person), `sameAs` (redes de `brand.json`) y `makesOffer` con cuatro `Service`.
  Sin `aggregateRating`, sin `review`, sin dirección postal exacta (solo `addressLocality: 'Santo Domingo'`, `addressCountry: 'DO'`): coherente con la regla de honestidad. Un `<title>` y `description` distintos por idioma ya existen.
- `hreflang` y `x-default` ya salen de `routes.ts`; los ids de sección deben coincidir con el idioma de la página.

### 4.13 ¿Lenis + GSAP? Análisis y veredicto

| Criterio | GSAP + ScrollTrigger | Lenis |
|---|---|---|
| Peso (gzip, medido) | 28,3 + 18,0 = **46,3 KB** (77 % del techo de 60 KB) | **5,4 KB** |
| Qué aporta aquí | Pins, `scrub`, `snap`: sustituibles por campo fijo + `view()`/`scroll()` + 60 líneas | Inercia de rueda en escritorio |
| Riesgos | Presupuesto, hilo principal, licencia estándar (permitida) | Bucle rAF propio (aun con movimiento reducido «sigue corriendo» [V]), sin snap nativo [V], CSS `html.lenis`, conflicto con nuestro sueño del motor |
| Móvil (≈ toda la audiencia objetivo) | — | `syncTouch` es `false`: **no hace nada** en táctil [V] |
| Beneficio real | Bajo | Marginal: Chrome/Firefox en escritorio ya suavizan la rueda [C]; el efecto «pesado» es cuestión de gusto |
| Compatibilidad con `animation-timeline` | — | Compatible: usa `scrollTo` nativo, sin transforms [M] |

**Veredicto:** GSAP **no**. Lenis **no en la v1**. Motivo: el mayor valor del proyecto está en el móvil (donde Lenis no actúa), el campo ya se suaviza por sí mismo (memoria por celda) y un bucle adicional contradice el diseño de «cero CPU en reposo».
Criterio de reapertura: si tras ver la v1 en escritorio el dueño pide «más peso» al scroll, hacer un **spike de ≤ 2 h** con Lenis detrás de `?lenis`, solo con `(hover: hover) and (pointer: fine)` y `no-preference`, sin `autoRaf` (conducido desde nuestro `tick` mientras `lenis.isScrolling`), sin snap, y comparar INP/TBT con la v1. Mientras tanto, **quitar `gsap` y `lenis` de `package.json`** (sin uso).

### 4.14 Protocolo de medición y pruebas (A07 como vara)

1. **Dispositivo real** (o equivalente) con Chrome remoto (`chrome://inspect`): Performance con la vista del A07; comprobar 30 fps sostenidos durante 10 s de scroll continuo y `__field.sleeping === true` 2 s después de soltar.
2. **Lighthouse móvil** (13.5 ya en devDependencies): rendimiento ≥ 90, LCP < 2,5 s, CLS = 0, TBT bajo; ejecutar con y sin `?still`.
3. **Playwright** (1.63 en devDependencies): `emulateMedia({ reducedMotion: 'reduce' })` → no hay rAF vivo y hay un cuadro por escena; `Emulation.setCPUThrottlingRate` a 4× y 6× como proxy; capturas por escena con `?still&scene=<id>`; axe (`@axe-core/playwright`) en escritorio, móvil y movimiento reducido.
4. **Red**: `npm run guard`/`ref:check` equivalentes: **0 peticiones externas** (CSP `default-src 'self'`).
5. **Accesibilidad manual**: Tab por toda la página (foco visible ≥ 3:1), zoom 200 % y 400 % (reflow sin pérdida, campo con ≥ 24 columnas), lector de pantalla (el ASCII no se anuncia; los `h2` se recorren bien).
6. **Destellos**: comprobar la costura y el encendido con una herramienta de análisis de destellos (p. ej. PEAT del Trace Center) — no verificada aquí [C]; regla de diseño: cambios de glifo independientes por celda, sin oscilación global de luminancia > 2 Hz.
7. **Presupuesto**: `npm run budgets` con el motor (≤ 20 KB gz) dentro del techo de 60 KB; anotar cada release.

---

## 5. Trampas (lista de control)

1. **Firefox (5,7 % en RD)** no tiene `animation-timeline` estable ni VT entre documentos: nada esencial puede depender de ellos.
2. `animation-timeline` debe ir **después** del shorthand `animation`, con `animation-duration: auto` implícita; sin `fill-mode: both` los rangos dejan el estado inicial equivocado.
3. `timeline-scope` para usar un timeline con nombre fuera de su subárbol; los rangos usan la caja **sin transformar**.
4. rAF a 90/120 Hz: usar `timestamp`, tope con acumulador; en Safari bajo consumo baja a 30 fps.
5. `scrollend` **no** se emite sin cambio de posición y en táctil espera a soltar: el temporizador de sueño es la fuente de verdad.
6. La barra de direcciones móvil dispara `resize`: usar `100lvh` y reaccionar solo a cambios de **ancho/dpr**; reasignar `canvas.width` es caro y en iOS puede fugar memoria.
7. **Memoria de canvas en iOS** (≈ 200–384 MB y no siempre se libera): un solo canvas, sin recrearlo por sección, y `canvas.width = 0` al destruir.
8. Contexto WebGL perdido / bfcache: manejar `webglcontextlost`/`restored` y `pageshow(persisted)`.
9. **Atlas antes de la fuente** = glifos del sistema; y con `subsets: ['latin']` los `─│░▒▓█` **no** están (`symbols2`): añadirlo o restringir el juego de glifos a ASCII imprimible.
10. Ligaduras y kerning de la mono desalinean la rejilla: `font-variant-ligatures: none; font-kerning: none`.
11. Avance fraccionario: medirlo con `measureText` y posicionar por `c * cw`.
12. **LCP**: el canvas no es candidato [V]; el `h1` (o el `<pre>` póster) lo es. No ocultar el `h1`; no dejar el póster con `color: transparent`.
13. `aria-label` prohibido en `p`/`generic` [V]; `aria-hidden` jamás sobre elementos enfocables.
14. Contenido generado (`::before`) puede anunciarse como «corchete…»: usar `content: "x" / ""` [V].
15. `<pre>` decorativo contamina Ctrl+F y los fragmentos: `data-nosnippet` (solo `div/span/section`, en el HTML inicial) y retirarlo en modo vivo.
16. **Paneles `sticky` a `100svh`** recortan texto con zoom/landscape corto: el campo fijo evita el `sticky`.
17. `scroll-snap: mandatory` con secciones altas = contenido inalcanzable y trampa de teclado [V].
18. En táctil, al empezar el scroll llega `pointercancel`: la energía debe salir de la **velocidad de scroll**, no de `pointermove`.
19. `touch-action` se intersecta con los ancestros; `none` en un contenedor mata el scroll.
20. `pointermove` a 120 Hz+ satura: guardar el punto y estampar una vez por tick.
21. `getBoundingClientRect` en el bucle = layout forzado: caché + `ResizeObserver`; re-medir al cargar fuentes y al cambiar de ancho.
22. **Contraste sobre arte vivo**: sin pozos, el texto cruza zonas claras y falla 1.4.3; el pozo lo impide por construcción.
23. **Destellos**: > 3/s en ≥ 341×256 px con ≥ 10 % de luminancia (2.3.1) [V]; jitter de glifos independiente por celda y encendidos monótonos.
24. **2.2.2**: movimiento automático > 5 s junto a otro contenido exige pausa; nuestro campo no se mueve solo tras el encendido.
25. VT: nombres únicos; quitar los añadidos por JS tras el snapshot (bfcache) [V]; no hay VT en Firefox.
26. Astro: los scripts de módulo corren una vez; con `<ClientRouter/>` habría que limpiar y re-inicializar (`astro:page-load`) — otra razón para seguir en MPA nativa.
27. **CSP** `script-src 'self'`: sin scripts inline ni `new Worker(blob:)`; workers como archivo propio. Vite en dev inyecta código: la meta CSP ya solo se aplica en producción.
28. Paridad SSR↔runtime: prohibido `Math.sin/cos/pow/exp` dentro de `luma`; probarla en CI comparando `renderPlate` con el cuadro del motor a `still`.
29. HMR de Vite puede duplicar bucles: exponer `dispose()` (cancelar rAF, quitar listeners, `loseContext`).
30. Zoom del navegador cambia `innerWidth`: piso mínimo de columnas y re-medición de pozos; probar 200 % y 400 %.
31. Impresión: `@media print { .field { display: none } }` y conservar el póster estático.
32. `forced-colors: active`: ocultar el campo; el texto ya es semántico.
33. Lenis: aun con `respectReducedMotion` **sigue corriendo** [V]; `html.lenis` exige CSS; sin snap nativo. GSAP: licencia permitida pero fuera de presupuesto.
34. Nunca hoyos de contenido: el texto real existe en HTML aunque el JS falle (el póster y las secciones se ven sin scripts).
35. Honestidad: ninguna escena ni etiqueta inventa cifras, clientes o «estados en vivo» falsos; el reloj de Santo Domingo, si se usa, es la hora real.

---

## 6. Dependencias con los otros informes de esta serie

Lo que este informe **necesita** que otros cierren (interfaces): (1) lista final de escenas, motivos y `still` de cada una (arte); (2) juego de glifos y rampa definitivos, con o sin cajas/bloques (render/tipografía);
(3) cuatro tonos Cobalto del campo + par de contraste del pozo (color); (4) copia y `id`s de sección por idioma (contenido); (5) tamaño y peso de la mono (tipografía). Lo que este informe **entrega**: contrato `Scene`/`FieldInput`,
motor con sueño y tiers, modelo de costura, pozos, reglas de accesibilidad y presupuesto de 20 KB gz.

---

## 7. DECISIONES CERRADAS para Gaya Digital

**Arquitectura**
1. **Un único canvas fijo** (`position: fixed; height: 100lvh; inset: 0`, `aria-hidden`) como capa 0 de toda la página; nunca un canvas por sección.
2. Las **escenas son funciones puras por celda** (`Scene.luma`) en `src/ascii/scenes/`, sin DOM ni `Math.random`, deterministas (ruido por enteros).
3. **El campo se calcula en CPU por celda** y se dibuja con **textura de celdas + atlas + un quad WebGL**; respaldo Canvas 2D por **pasadas de tono con `fillText` por fila**.
4. **Póster SSR**: el hero se genera en Astro con `renderPlate()` (dos variantes: ancha y alta), dentro de `<div data-nosnippet aria-hidden="true"><pre>`; es el LCP/versión sin JS y el fotograma de movimiento reducido.
5. **La costura entre escenas sigue el borde real de cada `<section>`** (escena por fila según posición en el documento; banda de 4 filas con «pliegue de luz»).
6. **Sin `position: sticky` para pinear; sin `scroll-snap`** en la portada (el campo fijo hace de anclaje). `scroll-snap` solo se mantiene en la baraja de `/referencias/`.
7. **Pozos de lectura** (`[data-well]`) limitan el tono del campo bajo el texto; su par de contraste entra en `tokens.json` y en `npm run contrast`.
8. **MPA nativa con `@view-transition`** (sin `<ClientRouter/>`); `site-nav` y `ascii-field` con `view-transition-name`, grupos sin animación y crossfade de 240 ms.
9. El mismo motor se monta en `/referencias/` y en el visor con escena «quieta» para que el cruce entre páginas parezca continuidad.

**Librerías**
10. **No se usa GSAP** (46,3 KB gz = 77 % del techo de 60 KB) ni sus plugins de texto. **No se usa Lenis en la v1**; reabrir solo con el spike descrito en 4.13. **Quitar `gsap` y `lenis` de `package.json`.**
11. Sin dependencias nuevas de runtime. Pretext, textmode.js y morphing-ascii-shader quedan como **referencia**, no como dependencia.
12. Prohibido scrambleText de Motion+ (de pago) y copiar el TextScramble de CodePen (licencia no visible y juego de caracteres «hacker»).

**Scroll y CSS scroll-driven**
13. `animation-timeline: view()/scroll()` **solo para la capa DOM** (revelados por bloque, espina, máquina de escribir de una línea), siempre bajo `@supports (animation-timeline: view())` y `@media (prefers-reduced-motion: no-preference)`; sin soporte → contenido visible, sin clase `.js` que oculte nada.
14. El campo y el scroll-spy usan **JS mínimo**: `scroll` pasivo que solo «despierta» + lectura de `scrollY` dentro del `tick`; scroll-spy con `IntersectionObserver` (`rootMargin: -45% 0 -50% 0`), `aria-current="location"`, sin `history`.
15. Offsets de sección y pozos en **caché** (coordenadas de documento), re-medidos por `ResizeObserver`, cambio de ancho y `document.fonts.ready`; jamás lecturas de layout en el bucle.
16. `scroll-padding-top` para la nav fija; `scroll-behavior: smooth` solo con `no-preference`. Ids localizados (`#nosotros/#about`, `#servicios/#services`, `#proceso/#process`, `#contacto/#contact`) y `READY.*` a `true` al construirse.

**Movimiento e interacción**
17. **Cero movimiento autónomo tras el encendido** (≤ 2,6 s): el campo solo se mueve por scroll, puntero, foco o toque (evita 2.2.2 sin botón de pausa).
18. **Sueño real**: bucle rAF con tope de **30 fps** (acumulador con módulo, tolerancia 2 ms), se duerme 1,6 s tras la última entrada; pausa con `document.hidden`, menú móvil abierto o contexto perdido.
19. **Tiers por celdas**: high 9 000 · mid 6 500 · low 4 200 · min 2 400 celdas (min a 20 fps); DPR 2 / 2 / 1,5 / 1; el control adaptativo solo baja (mediana de 45 cuadros > 45 % del intervalo).
20. **Entradas**: ratón/lápiz = estela gaussiana en `heat[]` (τ 0,45 s); táctil = energía por **velocidad de scroll** y onda al tocar; teclado = pulsación al enfocar; sin `touch-action: none`.
21. **Memoria por celda** (`mem[i]` con suavizado exponencial) e histéresis de glifo para evitar parpadeo.
22. **Decodificación de texto** solo en microetiquetas mono, con **capa superpuesta `aria-hidden` y guardia temporal** (fail-open), pasando por la **rampa de densidad** ` .:-=+*#`, una vez, ≤ 0,9 s. Nunca en `h1`, párrafos, botones de acción ni navegación principal.
23. Titulares de display se revelan **por palabra** con opacidad + translate; el **`h1` de portada no se anima ni se oculta al cargar**.
24. **Ninguna animación por carácter en párrafos** (`aria-label` prohibido en `p`).
25. Sin texto instructivo de ningún tipo: no hay «desliza», «mueve el cursor» ni leyendas; controles con icono + `aria-label`. El botón de movimiento on/off es **opcional, fase 2**.

**Movimiento reducido, datos y accesibilidad**
26. `prefers-reduced-motion: reduce` **y** `saveData` → modo `still`: **un cuadro por escena** (`scene.still`), corte seco al cambiar de sección, sin estela, sin decodificación, sin revelados; escucha del evento `change` para conmutar en vivo.
27. `forced-colors: active` y `print` ocultan el campo; el contenido real permanece.
28. **El ASCII es decoración**: `aria-hidden="true"`, `data-nosnippet` (en el HTML inicial), sin alternativa textual (F72 no aplica a decoración); el contenido real existe como HTML semántico (`h1`, `h2` por sección, `h3` por servicio, listas, enlaces).
29. Bordes ASCII en la UI con `content: "…" / ""`; objetivos táctiles ≥ 44 px; foco visible ≥ 3:1.
30. Reglas de destellos: cambios de glifo **independientes por celda**, encendidos monótonos, sin oscilación global > 2 Hz; verificar con analizador de destellos.

**Rendimiento y peso**
31. Presupuesto ASCII **≤ 20 KB gz** (motor + render ≤ 12, escenas ≤ 6, texto/nav ≤ 2) dentro del techo de 60 KB; LCP < 2,5 s con el `h1`/póster como candidato; CLS 0; Lighthouse móvil ≥ 90.
32. Fuente mono: añadir `symbols2` **solo si** el juego de glifos usa cajas/bloques; `preload` de `latin` de Geist Mono; fallback de `monospace` optimizado por Astro (ya configurado).
33. Inicialización tras `load` (`requestIdleCallback` con respaldo `setTimeout`), atlas horneado tras `document.fonts.load`. Sin `content-visibility` en la v1. Worker/OffscreenCanvas solo si el A07 lo exige (p95 > 8 ms).
34. Rejilla medida con `measureText` (avance fraccionario), celdas dibujadas en `c * cw`, `font-variant-ligatures: none; font-kerning: none`, alto de celda entero.

**SEO**
35. Una URL por idioma con `h2` + `id` por sección y enlaces internos (candidatos a «Ir a…»); **fase 2: cuatro páginas de servicio** reutilizando el campo.
36. JSON-LD `ProfessionalService` con `makesOffer` (4 servicios), `knowsLanguage`, `founder`, `sameAs`, `areaServed`; **sin ratings, reseñas ni dirección exacta**.

**Calidad**
37. `?still` (y `?still&scene=<id>`) congelan el motor para capturas; `window.__field` expone `tier/cols/rows/frames/sleeping/costP50/costP95/mode`.
38. Prueba de paridad en CI: `renderPlate(scene)` = cuadro del motor a `scene.still` (mismo glifo por celda).
39. `dispose()` obligatorio (cancelar rAF, quitar listeners, `WEBGL_lose_context`) para HMR y pruebas.
40. Cero peticiones a terceros; CSP intacta; ningún script inline ni worker `blob:`.

---

## 8. Fuentes consultadas

Leídas y usadas ([V]): MDN scroll-driven animations · Chrome for Developers scroll-driven animations · WebKit «A guide to Scroll-driven Animations» · Josh Comeau · scroll-driven-animations.style · BCD `animation-timeline`, `@view-transition`,
`OffscreenCanvas` · MDN View Transition API · Mozilla Hacks Interop 2026 · Astro view transitions y fonts · MDN `scrollend`, rAF, IntersectionObserver, `content`, `touch-action`, `scroll-snap-type` · web.dev (LCP, viewport-units, content-visibility,
animations-guide, prefers-reduced-motion, offscreen-canvas [S]) · W3C WCAG 2.2 (2.2.2, 2.3.1, F72, F71) · ARIA 1.2 · Google Search Central (URL structure, robots meta / `data-nosnippet`, snippet) · schema.org ProfessionalService · StatCounter RD (navegadores y SO móvil, ago-2026) ·
Awwwards (aino.agency, ML Fairness, ASCII Street View) · designeverywhere.co (Aino) · GitHub: niccolofanton/morphing-ascii-shader, tholman/ascii-morph, humanbydefinition/textmode.js y p5js-ascii-renderer, chenglou/pretext, greggman/virtual-webgl,
darkroomengineering/lenis, Addy Osmani (gist rAF, MIT), coder/ghostty-web #163, WebKit bug 195325 · offscreencanvas.com · gsap.com/standard-license · motion.dev/docs/scramble-text · CSS-Tricks typewriter · OpenReplay (guía CSS del ASCII, sin datos de rendimiento).

Solo por resumen de buscador ([S], no confirmadas en la fuente): Firefox 152 con la flag, Safari 26.4 con animaciones en hilo aparte, especificaciones del Galaxy A07, «16 contextos WebGL» de Chrome, fuga al redimensionar WebGL en iOS (WebKit 219780),
«Ir a» de Google por encabezados con id.

No accesibles: Codrops (403) · three.js `multiple-scenes` (404) · issue de Chromium 40939743 (requiere sesión) · post de Lenis+scroll-snap de raoulcoutard.com (410) · benchmark `text-glyph-renderer-bench` (sin cifras en la página).

Medido por mí: tamaños de `node_modules` (gzip -9), lectura del código de Lenis 1.3.26 (`scrollTo` nativo, `respectReducedMotion: true`, `autoRaf: false`), estructura del repo, tamaños de subsets de Geist Mono y de platos ASCII de muestra (script en el directorio temporal de la sesión).
