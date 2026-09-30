# MUNDO · «El mapa»

**Concepto para gaya.com.do: la página entera es una carta que se dibuja mientras la lees.** Cielo, ciudad, plano, mar y cuatro islas en una sola pieza de texto, con una sola cámara.

Fecha: 2026-09-30 · Autor: director creativo independiente (ángulo «El mapa») · Proyecto: `gaya-web` (Astro 7 estático, Node 24) · Estado: especificación cerrada para construir.

**Cómo leer las etiquetas de fiabilidad** (las mismas de los informes 01–06): **[V]** leído en la fuente primaria en esta sesión · **[M]** medido o probado por mí en este PC (Node 24.19, código en los anexos) · **[S]** dato de un resumen o buscador, fuente primaria no abierta · **[C]** criterio propio, razonado y no verificado. Nada de lo marcado [M] se midió en el Samsung A07 real: el A07 sigue pendiente y bloqueante (§8.9).

Este documento parte de los seis informes de `docs/ascii/research/` (01 showcase, 02 GPU, 03 tipografía y accesibilidad, 04 contenido de servicios, 05 motor de ilustración, 06 movimiento y arquitectura) y del código actual (`src/scripts/hero.ts`, `tokens.css`, `Hero.astro`). Cita esos informes por número; no los repite.

---

## 0. Resumen para decidir en dos minutos

**Logline.** Bajas por un cielo cobalto de luz líquida hasta la ciudad de Santo Domingo; la cámara baja la mirada y la ciudad se abre como un plano; las calles se encienden como un circuito y la luz sale por el Malecón hacia el mar, donde cuatro islas son los cuatro servicios; al final la carta está completa menos un lugar, el tuyo.

**La idea en una frase.** *Poner tu negocio en el mapa*, tomado al pie de la letra: la web es un mapa, el scroll es una cámara que baja, y cada servicio es un lugar con su propio oficio cartográfico.

**Por qué es esta idea y no otra.**

1. **Unidad real, no decoración.** Todo el arte sale de UNA cámara con cabeceo φ (ortográfica en v1, con perspectiva como variante probada; §2.3 y §2.5): el cielo del héroe es el fotograma φ=14° del mismo mundo que, a φ=90°, es el plano de la ciudad. No hay escenas pegadas; hay un mundo mirado desde ángulos distintos. Probado en Node con bocetos generados por el propio código (§4, S3).
2. **Es ASCII por naturaleza.** La cartografía está hecha de rótulos y líneas: rumbos, achurados, retículas, esquemas de red, cotas. Los glifos `- | / \` son literalmente el achurado de un mapa antiguo (§1.1, Bertin y Lehmann). No hay disfraz de terminal ni verde Matrix (regla 8 del encargo).
3. **Local y verificable.** Santo Domingo, el Ozama, el Faro a Colón con su planta en cruz, la Puerta del Conde, la Calle Las Damas: geografía real leída en fuentes (§1.1). La cruz de luz del Faro es el momento de ignición de la portada y la evolución natural de la «lente» de hoy.
4. **La información es el territorio.** «Quiénes somos» es la leyenda del mapa; los servicios son islas; el proceso es el cable con estaciones; el contacto es la carta completa. El texto real (h1, h2, p, ul, dl, a) nunca vive dentro del arte.
5. **Legible por construcción.** Los pozos de lectura son los halos de rotulación de la cartografía (Imhof): el arte baja de tono bajo el texto con contrastes calculados (§7).
6. **Barato.** Primera carga: ≈ 18 KB gz de JS y 28,9 KB de fuentes (hoy: 7,7 KB de JS y 68,6 KB de Bricolage). El resto llega con `import()` cuando falta menos de una pantalla (§8.7).

**El momento que la gente contará** (§5): al bajar, *la ciudad se abre como un plano y sus calles se encienden como un circuito; la luz sale del Malecón por el mar*. Y, antes, la ignición: la cruz de luz del Faro se enciende sobre el cielo líquido.

**Añadido en esta pasada (probado en Node y Chrome, con el código en el Anexo A):** una segunda cámara con **perspectiva** («Mode 7», §2.5) que se decide mirando en M2; un **cielo real** opcional en el que la Polar marca la latitud de la ciudad (§2.6); el peso **real** del póster (0,5–0,9 KB con brotli, §8.6); la tabla de costes de ambas cámaras (§2.5, §8.5) y el cierre S11 como parte obligatoria (el pie; el cielo de vuelta es P2).

**Lo que este concepto cambia respecto a los informes** (detalle en §1.3): una sola familia tipográfica (Geist Mono) también para titulares; lienzo fijo con sobrecarga y `transform` sub-fila (el fondo se desplaza con la suavidad nativa); escenas de servicio nuevas (cuatro islas en vez de ventana de navegador, megáfono, racks y red neuronal); emblemas ASCII de sector para las referencias; retirada de `HeroCards`, del grano `noise.png` y del shader de luz líquida como fuente de imagen (su mirada se conserva como campo por celdas y su lente como lupa).

### La página en una mirada

| # | id ES / EN | Altura | Modo | Cámara (φ, objetivo z0) | Qué se ve | Texto real |
|---|---|---|---|---|---|---|
| S0 | `inicio` / `home` | 100 svh | escenario | 14°, 22 | Cielo líquido, ciudad de noche, cruz de luz del Faro | h1, lead, 2 CTA |
| S1 | `nosotros` / `about` | 110 svh | escenario | 14→18°, 22 | Ciudad; se encienden ventanas | h2, leyenda de 7 líneas |
| S2 | `referencias` / `references` | 120 svh | escenario | 18→24°, 22→18 | Ciudad; la calle de las referencias | h2, hasta 6 referencias, puerta |
| S3 | (aire) | 100 svh | escenario→tira | 24→90°, 18→4 | **El despliegue**: skyline → plano → circuito | nada (arte) |
| S4 | (aire) | 40 svh | tira | 90° | Malecón; el cable entra al mar | nada |
| S5 | `servicios` (web) / `services` | 150 svh | tira | 90° | Isla A «El Local» | h2, ficha del servicio |
| S6 | `automatizacion` / `automation` | 150 svh | tira | 90° | Isla B «El Cruce» | h2, ficha |
| S7 | `marketing` | 150 svh | tira | 90° | Isla C «La Señal» | h2, ficha |
| S8 | `soporte` / `it` | 150 svh | tira | 90° | Isla D «La Planta» | h2, ficha |
| S9 | `proceso` / `process` | 100 svh | tira | 90° | Mar abierto; el cable como esquema tipo metro | h2, 4 estaciones |
| S10 | `contacto` / `contact` | 130 svh | tira | carta | La carta completa; falta tu lugar | h2, CTA, correo, teléfono |
| S11 | (cierre) | 40 svh | tira | 14° (P2) | El cielo vuelve; la cruz se enciende en calma | pie de página |

Suma ≈ 1 340 svh (13,4 pantallas; hoy es una). El «aire» (S3 y S4) es el 10,4 % del total; el mínimo de 06 era ≤ 25 %.

### Por qué esto es arte y no efecto (los cinco criterios de 01 §8.4)

1. *¿Tiene el glifo razón de ser?* Cada glifo cumple un papel cartográfico: `- | / \` achuran, `┼` marca vía, `~` es oleaje, `yaAG` (las letras de la marca) solo aparecen en las crestas calientes del cielo, `(@)` es el pin.
2. *¿Sobrevive en estático?* Sí: cada escena tiene fotograma de reposo (`t = settle`) y el póster SSR del héroe es un fotograma del propio motor.
3. *¿Se lee el contenido sin el arte?* Sí: todo es HTML semántico; el arte es `aria-hidden` (§9).
4. *¿Ilustra un proceso real?* Construir, encaminar, señalar, sostener: cada isla anima el verbo de su servicio, y solo mientras el scroll la lleva (nada se mueve solo).
5. *¿Otra persona lo tomaría de referencia?* La cámara única con cabeceo, el despliegue ciudad→circuito y el cable que hace de barra de progreso son ideas transferibles y no las hace ningún referente medido en 01 §3.

---

## 1. Lo que aprendí (investigación propia + informes 01–06)

Búsquedas y lecturas del 30-sep-2026; cada dato lleva su etiqueta. Los sitios que devolvieron 403/404 al abrirlos se anotan como tales y de ellos solo se usa lo que un buscador citó.

### 1.1 Fuentes nuevas leídas para este concepto

| Fuente | Hallazgo | Qué tomo | Qué descarto |
|---|---|---|---|
| *Powers of Ten* (Eames, 1977) · https://en.wikipedia.org/wiki/Powers_of_Ten_(film) [V] | Zoom continuo por potencias de diez, ida y vuelta, 9 minutos, una sola toma | Estructura «bajar por escalas» sin cortes duros; los cambios de escala como **saltos con costura de luz**, no como cortes | Narración y cifras (Gaya no tiene datos publicables) |
| neal.fun «The Deep Sea» · https://neal.fun/deep-sea/ (403 al abrirlo) · reseña https://flowingdata.com/2019/12/05/scroll-scroll-scroll-through-the-depths-of-the-ocean/ [S] | Scroll = descenso por estratos con datos a cada profundidad | Precedente de «el scroll baja por un mundo»; Gaya lo hace con cámara y con ASCII | Los datos y las fichas de criaturas |
| Variables visuales de Bertin · https://en.wikipedia.org/wiki/Visual_variable [V] | Posición, tamaño, forma, valor, matiz, orientación, textura (grano) | **Sistema de diseño del arte** (tabla en §2.2): cada variable tiene un uso fijo en glifos | — |
| Mapa del metro de Beck (1931) · https://en.wikipedia.org/wiki/Tube_map [V] | Rectas a 0/45/90°, estaciones a paso uniforme, ticks, ignorar la geografía | El **cable submarino** y el **proceso** se dibujan como esquema de Beck | — |
| Rotulación cartográfica (Imhof) · https://en.wikipedia.org/wiki/Typography_(cartography) [V] + guías de ESRI, PSU GEOG 486 y Ordnance Survey (resultados de buscador) [S] | La etiqueta lleva **máscara o halo del color del fondo** para separarla del detalle; conviene que se mezcle, no que grite | Los **pozos de lectura** son halos de rotulación (§7) | — |
| Carta portulana · https://en.wikipedia.org/wiki/Portolan_chart [V] | Red de **rumbos** desde rosas de los vientos; faros y balizas como símbolos; topónimos perpendiculares a la costa | Rumbos radiales en «La Señal»; rosa **sin letras**; topónimos solo en la lupa | Monstruos y ornamento figurativo |
| Achurado (Lehmann, 1799) · https://en.wikipedia.org/wiki/Hachure_map [V] | Trazos cortos siguen la **máxima pendiente**; grosor y densidad = inclinación; el llano queda en blanco | **Relieve de las islas por gradiente** con `- | / \` (probado, §4 S5–S8) | — |
| Diagrama unifilar · https://en.wikipedia.org/wiki/One-line_diagram [V] | Símbolos estándar (barra, interruptor, transformador, fuente), trazos ortogonales | Lenguaje de «La Planta» | — |
| Orden de Strahler · https://en.wikipedia.org/wiki/Strahler_number [V] | Al juntarse dos cauces del mismo orden sube el orden; el trazo engorda aguas abajo | Carriles de barcos que convergen en «La Señal» | — |
| Santo Domingo · https://en.wikipedia.org/wiki/Santo_Domingo [V] | 18°27′45″N 69°56′10″W; UTC−4; el Ozama parte la ciudad; la Zona Colonial está al oeste | Geografía y sitio del mundo | — |
| Calle Las Damas · https://es.wikipedia.org/wiki/Calle_Las_Damas [V] · Calle El Conde · https://es.wikipedia.org/wiki/Calle_El_Conde [V] · Puerta del Conde · https://en.wikipedia.org/wiki/Puerta_del_Conde [V] | Las Damas va de la Fortaleza Ozama a las cercanías del Alcázar y es «la primera vía» de la ciudad; El Conde corre este–oeste desde la Puerta del Conde y es peatonal; la Puerta es un arco (1543) | Topónimos reales para la lupa; la Puerta como símbolo de «Ver todas las referencias» | Fechas y frases históricas (no van en la web) |
| Faro a Colón · https://en.wikipedia.org/wiki/Columbus_Lighthouse [V] | Planta en cruz de 210 × 59 m; 157 haces de luz; en 18°28′43″N 69°52′05″W (orilla este, Santo Domingo Este) | La **cruz de luz** de la portada y su **planta en cruz** vista desde arriba en el plano | Cualquier cifra en el texto de la web |
| Puente Juan Bosch · https://es.wikipedia.org/wiki/Puente_Juan_Bosch [V] | Atirantado junto al Puente Duarte, cerca de la desembocadura; une el Distrito Nacional con Santo Domingo Este | Fondo del desplegable (torres en «H») | — |
| LCP · https://web.dev/articles/lcp [V] | Candidatos: `img`, imagen SVG, póster de `video`, `background-image` con `url()` y bloques con nodos de texto. **No aparecen** el texto generado por `::before` ni el `canvas` | El LCP debe ser **texto real** (h1 y póster `<pre>`); el lettering en `::before` no cuenta (§8.6) | — |
| `@marianmeres/cityscape` (MIT) · https://jsr.io/@marianmeres/cityscape [V] | Núcleo puro y determinista que emite órdenes de dibujo; tres renderizadores (Canvas2D, ASCII, pixel-art) | Refuerza «escena pura + renderizadores intercambiables» (idea, no código) | Su ambientación sonora |
| Faro «solo se enciende en ocasiones especiales» · Caravan y Atlas Obscura (resultados de buscador) [S]; **no** figura en Wikipedia | Afirmación de turismo, sin confirmar | No se usa en ningún texto. Solo explica que la ignición sea un evento y no un adorno | — |
| Ciudad Colonial de Santo Domingo (UNESCO) · https://whc.unesco.org/en/list/526/ (403 al abrirla; texto vía buscador) [S] | Inscrita en 1990; 106 ha; el trazado en damero de Ovando se conserva casi intacto y sirvió de modelo urbano a las Américas; incluye Alcázar de Colón, Puerta del Conde, Fortaleza Ozama, Monasterio de San Francisco y la Catedral | El **damero** de manzanas del mundo (§2.3) es una cita fiel, no un adorno | Cualquier frase histórica en la web |
| Ciudad Colonial (Wikipedia) · https://en.wikipedia.org/wiki/Ciudad_Colonial_(Santo_Domingo) [V] | Está en la orilla **oeste** del Ozama (se fundó en 1502 al mudarse desde la orilla este); 1,06 km² amurallados; Calle Las Damas, «la vía pavimentada más antigua de las Américas»; El Conde peatonal y comercial; la Puerta del Conde en el límite oeste | Ciudad al oeste del río y Faro al este (mundo de §2.3); topónimos de la lupa | Fechas y superlativos |
| Fortaleza Ozama (Wikipedia) · https://en.wikipedia.org/wiki/Fortaleza_Ozama [V] | 1502–1508; Torre del Homenaje de 18 m; guarda la entrada del puerto; 18°28′24″ N 69°52′54″ O | La torre de la Fortaleza (`torre`) en el skyline | Datos históricos |
| Río Ozama (Wikipedia) · https://en.wikipedia.org/wiki/Ozama_River [V] | 148 km; desemboca en el Caribe en 18°28′ N 69°53′ O; parte la ciudad en una mitad este y otra oeste | Río de 6 unidades (x 82–88) y mar al sur del mundo | Contaminación y tributarios |
| Mode 7 (Wikipedia) · https://en.wikipedia.org/wiki/Mode_7 [V] y Tonc «Mode 7 part 2» · https://www.coranac.com/tonc/text/mode7ex.htm [V] | Transformación afín por línea de barrido: un plano de suelo cambia altura por profundidad; con cabeceo θ el horizonte cae en y = D·tanθ y el factor λ de cada línea sale de la altura de la cámara | **Cámara B** (§2.5): suelo por rayo inverso + cajas proyectadas | El código de terceros (Tonc lo distribuye su autor, J Vijn): solo ideas y fórmulas |
| Mapbox: «Fly to a location based on scroll position» · https://docs.mapbox.com/mapbox-gl-js/example/scroll-fly-to/ y plantilla `mapbox/storytelling` · https://github.com/mapbox/storytelling [S] | Cada capítulo lleva una cámara (centro, zoom, *pitch*, *bearing*) y la página vuela de una a otra con el scroll | Precedente de «cabeceo por capítulo» (§2.3, S3) | El mapa base de teselas (el mundo es propio) |
| WCAG 2.3.3 «Animation from Interactions» · https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html [S] | El paralaje al hacer scroll puede provocar mareo vestibular y debe poder desactivarse | Con `prefers-reduced-motion` el despliegue son **dos cuadros** sin cabeceo ni paralaje (§8.8) | — |
| USNO «Approximate Sidereal Time» · https://aa.usno.navy.mil/faq/docs/GAST.php [S] | GMST(h) = 18,697374558 + 24,06570982441908·D, con D = JD − 2451545,0; error máximo 0,43 s en 2000–2100 | **Cielo real** (§2.6) | — |
| Bright Star Catalogue 5.ª ed., CDS V/50 · http://cdsarc.u-strasbg.fr/viz-bin/cat/V/50 [S] | 9 110 estrellas hasta mag 6,5; VizieR pide reconocimiento (DOI 10.26093/cds/vizier) | Fuente de datos del §2.6 | Términos de uso sin verificar (no cargó el ReadMe) |
| MapSCII · https://github.com/rastapasta/mapscii (MIT) [V, vía buscador] | Renderizador de teselas vectoriales a Braille y ASCII en terminal | Precedente de «un mapa hecho de texto» | Braille (Geist Mono no lo tiene) |
| `kyhsa93/ascii-engine` · https://github.com/kyhsa93/ascii-engine [V] y «ASCII City» · https://www.asciicity.com/ [V] | Un renderizador 3D de software cuyo framebuffer es una rejilla de caracteres (división de perspectiva, buffer de profundidad, salida a `<pre>`; un cubo de 80×23 celdas ≈ 0,17 ms según su README) y una ciudad nocturna de 512×512 celdas lanzada por rayos a glifos | Confirman que la perspectiva en caracteres es viable y barata | Ninguno declara licencia: solo ideas |
| Antecedentes buscados en esta pasada [S] | «Mode 7 ASCII», «ASCII parallax landscape» y «scrollytelling map»: no encontré un sitio de servicios que use un plano en perspectiva de glifos, ligado al scroll, como estructura de la página | — | — |

### 1.2 Qué adopto sin cambio de los informes

- **01**: campo «Marea Cobalto» con rampa `' · : = * y a A G ▒ ▓ █'` (las letras de la marca), corchetes como sintaxis de etiqueta, esquinas fijas y barra inferior móvil, ledger de servicios, cero puertas ni loaders, honestidad de datos.
- **02**: `drawCells` como API pública del sello (P3) por si un motor de celdas externo lo necesita; atlas por `texelFetch`; histéresis 0,04; ruido IGN anclado a la celda; `document.fonts.load` y comprobar que devuelve fuentes (nunca `check()`).
- **03**: Geist Mono con `latin` + `symbols2`; receta `--art-lh = calc(round(down, 1.3em, 1px) - 1px)`; arte decorativo en `data-art` + `::before`; patrón de titular con `sr-only`; fallback métrico corregido; `forced-colors`, `print`, `prefers-contrast`.
- **04**: nombres, orden y copy ES/EN de las cuatro fichas; bloque «Quiénes somos» de 7 líneas; datos locales con «Verificado 30 sep 2026»; enlace de WhatsApp con el servicio ya escrito; nada marcado `[CONFIRMAR]` sale a producción.
- **05**: `Grid` de 4 bytes por celda, `overlay`/`blit`, escenas puras en `t` con `settle`, render WebGL2 de textura de celdas con respaldo Canvas 2D por baldosas y diff, ciclado de paleta (16–31), ruido azul 64×64, planificador que solo anima lo visible.
- **06**: un único canvas fijo detrás de todo, pozos de lectura, sueño de 1,6 s, tiers por celdas (9 000 / 6 500 / 4 200 / 2 400), sin GSAP ni Lenis, `animation-timeline` solo en la capa DOM, `@view-transition` nativo.

### 1.3 Divergencias declaradas (y por qué)

| Tema | Informes | Este concepto | Razón |
|---|---|---|---|
| Familias tipográficas | 01 y 06: Bricolage para titulares + Geist Mono; 03: solo Geist Mono | **Solo Geist Mono**; los titulares son lettering de bloques o Geist Mono 800 | «Toda la página ASCII»; −68,6 KB de fuente; el fallback métrico de Bricolage sale mal (03 §1.5) |
| Escenas de servicio | 05: ventana de navegador + teléfono, megáfono, racks, red neuronal | **Cuatro islas** (El Local, El Cruce, La Señal, La Planta) | `DESIGN.md` prohíbe «marcos falsos de navegador/teléfono»; megáfono y red neuronal son lugares comunes; las islas comparten proyección y lenguaje |
| Campo de imagen | 02: canalización GPU de 4 pasadas | **Celdas por CPU + sello WebGL2** (05/06) | El mundo mezcla cámara de cajas, plano y sprites: es geometría de celdas, no un campo de píxeles. El cielo líquido se calcula con una tesela de 64×64 y dos capas desplazadas: 0,09 ms por cuadro de 4 480 celdas [M, §8.5] |
| Fondo desplazable | 06: canvas fijo que se redibuja al hacer scroll | **Fijo con sobrecarga de 4 filas y `transform` sub-fila** | El fondo se mueve con la suavidad del scroll nativo; se redibuja cada varias filas, no cada cuadro (§8.3) |
| Celda | 05: 7×14 y 8×16 | **Dos rejillas 2:1**: la de texto en CSS (7, 8, 9 px; medido: la receta de 03 da fila = 2·ancho para 6–11 px y falla en 5 y ≥ 12) y la del lienzo, que crece hasta 14 px para cumplir el presupuesto de celdas | En pantallas grandes la celda del lienzo debe crecer; el texto no puede depender de JS |
| Referencias en portada | Producto: baraja; `HeroCards`: 5 capturas flotantes | **Emblemas ASCII de sector**: 14 letreros de 11×5 celdas dibujados a mano (≈ 0,7 KB en total), uno por referencia | Cero imágenes en la portada; la página es ASCII de arriba abajo. Probé miniaturas por umbral local de las capturas reales (32×9 celdas): salen abstractas y una sale vacía (Clara, fondo claro) [M]; un emblema se reconoce de un vistazo |
| Grano de película | `noise.png` sobre el héroe | **Retirado** | El ruido azul por celda ya rompe las bandas; el grano ensucia el texto de las celdas |
| Degradado en texto | 03: `.art--ink` con `background-clip: text` | **No se usa** | `PRODUCT.md`: «sin degradados en texto». El lettering es de color plano; el tono viene de la capa de fondo |
| Obelisco de Santo Domingo | 05: incluido, «decisión del dueño» | **Excluido** por defecto | Conmemora «Ciudad Trujillo»; el skyline no lo necesita (§11, D1) |
| Proyección de la cámara | 05 y 06 no definen una cámara | **A** ortográfica con cabeceo (v1) y **B** con perspectiva (variante probada, §2.5) | A cuesta menos y sus bocetos se leen en texto; B da profundidad y hace del despliegue un vuelo. Se decide mirando las dos en color en M2 |

### 1.4 Lo que no verifiqué

Rendimiento en el A07, Safari y Firefox; las capturas en color de la cámara B (los archivos de esta pasada no persisten); los términos de uso del catálogo estelar; que el Faro esté encendido en algún momento (no se afirma en ningún texto); fidelidad visual de las siluetas de la Catedral, el Alcázar y la Fortaleza (se construyen con cajas, no calcadas; comparar con las fichas de Commons de 05 §1.6 antes de aprobar); que el 45° de los rumbos y el achurado se lean bien en pantallas de baja densidad (los bocetos son de solo glifos, sin tono); el texto EN de las etiquetas `dt` del ledger (propuesto por mí, marcado [C]); la afirmación del Faro «solo en ocasiones especiales».

---

## 2. El concepto: una carta que se dibuja al leerla

### 2.1 El guion en ocho planos

1. **Cielo.** Noche cobalto con luz líquida. El Faro a Colón, en la otra orilla del Ozama, enciende su cruz de luz (la «lente» de hoy vive en la intersección de la cruz). Aquí están el h1 y el WhatsApp.
2. **Costa.** La ciudad vista desde el mar, de noche: Catedral, Alcázar, Fortaleza, manzanas bajas. Se encienden ventanas. *Quiénes somos* es la leyenda del mapa.
3. **Calle.** Las referencias: hasta seis negocios de ejemplo, cada uno con el letrero-emblema de su sector, como casas de una calle; al final, la Puerta del Conde que lleva a la galería.
4. **Despliegue.** La cámara baja la mirada. La ciudad se abre como un plano; el Faro, visto desde arriba, es una cruz.
5. **Circuito.** Las manzanas se vuelven chips y las calles pistas; la luz corre hacia el sur y sale por el Malecón: el cable submarino.
6. **Islas.** Cuatro lugares en el mar, unidos por el cable: **El Local** (construir), **El Cruce** (encaminar), **La Señal** (señalar), **La Planta** (sostener).
7. **Derrotero.** El cable, dibujado como esquema de metro, con cuatro estaciones: el proceso.
8. **Carta.** El zoom final muestra la carta completa. Todo está dibujado menos un lugar: el tuyo. El botón de WhatsApp es la forma de ponerlo.

*Poner tu negocio en el mapa* es una expresión natural en español («ponte en el mapa») y en inglés (*put your business on the map*). Sirve de titular del contacto (§4, S10) y de llave de todo el diseño: el visitante recorre un mapa y termina convirtiéndose en un punto de él.

### 2.2 Reglas de la carta

Diez reglas de oficio que se comprueban en revisión (cada escena debe cumplirlas o se rehace):

1. **Un mundo, una cámara.** Ninguna escena es una imagen pegada: todo lo que se ve es el mundo de §2.3 mirado con un φ determinado.
2. **Norte arriba.** Sin giros de cámara: el plano se mira con el norte arriba y el despliegue es solo cabeceo. El viaje del scroll es siempre hacia el sur (el contenido sube).
3. **Escala en saltos.** Los cambios de escala (plano → islas → carta) se hacen como en *Powers of Ten*: un salto con costura de luz de 4 filas, nunca un cambio brusco sin transición.
4. **Las etiquetas llevan halo.** Todo texto real está sobre un pozo de lectura (Imhof): el arte baja de tono, con el color del fondo, y se funde en dos celdas de borde.
5. **Lejos es tenue, cerca es nítido.** Perspectiva atmosférica: planos lejanos en T1–T3; el primer plano puede llegar a T9–T12; las chispas T13–T15 son ≤ 2 % de las celdas.
6. **Un foco por escena.** La cruz de luz (portada), el pulso (circuito), el pin (Local), el plato (Cruce), el haz (Señal), el bloque con luz (Planta), el pin vacío (carta).
7. **≥ 40 % de celdas vacías.** El vacío es el mar y el cielo; el arte respira.
8. **Nada se mueve solo** tras el encendido de la portada (≤ 2,6 s). Todo lo demás se mueve con el scroll, el puntero o el foco; al soltar, 1,6 s y duerme.
9. **La ruta une todo.** El cable es una sola polilínea continua de arriba abajo que hace de barra de progreso: lo recorrido brilla, lo que falta es punteado.
10. **Sin números ni texto en el dibujo.** Las ilustraciones no llevan cifras, ejes ni leyendas (honestidad). La excepción son los **topónimos reales** (Calle Las Damas, Puerta del Conde…) que aparecen solo dentro de la lupa, y la hora de Santo Domingo en la esquina (calculada con `Intl`, sin API).

**Las variables visuales de Bertin como sistema de diseño del glifo** (fuente en §1.1):

| Variable | Qué significa en el arte de Gaya | Ejemplo concreto |
|---|---|---|
| Posición | Celda de la rejilla; orden norte–sur | El cable siempre baja; las islas alternan derecha e izquierda |
| Tamaño | Bloque entero, medio bloque o cuadrante; grosor del trazo (`.` `:` `=`) | Carriles de barcos: el trazo engorda al juntarse (Strahler) |
| Forma | Familia de glifo: línea, masa, textura, detalle (05 §2.2) | Vagón `▄▄`, pin `(@)`, faro `╭─╮│@│╰─╯` |
| Valor | Tono T0–T15 y densidad de la rampa | Pozos de lectura: tope T6; luz del Faro: T13–T15 |
| Matiz | Una sola familia (Cobalto). El matiz marca estado: `--accent-text` = lo accionable | Acento y botones; nunca en el dibujo de fondo |
| Orientación | Glifos `- \| / \` | Achurado de las islas (máxima pendiente) |
| Textura | Rampa, tramas `░▒▓`, ruido azul | Mar, bruma del horizonte, costuras |

### 2.3 La cámara: una sola pieza de geometría para todo el arte

El mundo son **cajas extruidas** (edificios) sobre un plano (calles, río, mar). La cámara (**cámara A**, la de v1; §2.5 describe la cámara B con perspectiva) es **ortográfica**, con cabeceo φ (de 14° a 90°), una pequeña guiñada ψ que se apaga al llegar al plano y un objetivo z0 (hacia dónde mira). No hay segunda implementación para «skyline» y «plano»: cambia φ.

Mundo: `x` al este, `z` al norte, `h` hacia arriba; unidad = una celda de ancho; una fila = 2 unidades (`ASPECT = 2`).

```formula
ψ = 22°·(1 − φ/90°)                                   # la guiñada enseña la cara este; en el plano vale 0
x' =  (x − 50)·cosψ + (z − z0)·sinψ
z' = −(x − 50)·sinψ + (z − z0)·cosψ
columna = colC + x'
fila    = rowC − ( h·cosφ + z'·sinφ ) / ASPECT         # h pesa cosφ (alzado); z' pesa sinφ (planta)
suelo (h = 0), inversa:  z' = (rowC − fila)·ASPECT / sinφ   →  (x, z)
horizonte:  zFar(φ) = 30 + 65·smoothstep(14°, 60°, φ)       # más allá de zFar es cielo; al mirar abajo el horizonte se aleja
rowC(φ) = H·(0,66 − 0,16·φ/90)                               # el objetivo sube del 66 % al 50 % de la pantalla
```

Orden de pintado: cajas de lejos a cerca por `z'` (algoritmo del pintor). Cada caja pinta tres caras por cobertura 2×2 (cuadrantes `▘▝▖▗▀▄▌▐█`): frente (`█`), este (`▓`, si ψ > 0) y techo (`░` o `▒`). A φ = 14° solo se ve el alzado; a φ = 90° solo los techos (la huella). **El Faro a Colón tiene planta en cruz**: a φ = 90° sus dos cajas dibujan una cruz. La cruz de luz del cielo y la cruz de la planta son la misma cruz.

**Claves de cámara por sección** (las posiciones son bordes de sección medidos del DOM; entre claves, `easeInOut`):

| Posición | φ | z0 | rowC | ψ | zFar | κ (circuito) |
|---|---:|---:|---:|---:|---:|---:|
| Arriba de S0 y de S1 | 14° | 22 | 0,66·H | 19° | 30 | 0 |
| Arriba de S2 | 18° | 22 | 0,65·H | 18° | 33 | 0 |
| Arriba de S3 | 24° | 18 | 0,64·H | 16° | 42 | 0 |
| S3 al 55 % | 62° | 10 | 0,55·H | 7° | 95 | 0 |
| Final de S3 | 90° | 4 | 0,50·H | 0° | 95 | 1 |
| S4 en adelante (tira) | 90° | — | 0,50·H | 0° | — | 1 |

`κ` (0 a 1) transforma el plano en circuito (§4, S3). **El objetivo z0 baja de 22 a 4**: la cámara se desliza hacia el sur mientras se inclina, en la misma dirección en que luego avanza el scroll. No hay inversión de sentido (un diseño alternativo con la calle de las referencias en planta obligaba a volar al norte y volver; se descartó).

Coste medido del compositor de cajas sin optimizar [M, Node 24, un hilo, 160×50 = 8 000 celdas; rango de tres corridas con la máquina más o menos ocupada]: **0,7–0,9 ms a 14°, 1,4–1,9 ms a 40°, 0,7–1,0 ms a 90°** (×4 como proxy de A07: 2,8–3,6 / 5,6–7,6 / 2,8–4,0 ms). El presupuesto de 05 es ≤ 6 ms por cuadro con CPU ×4: hay que cachear el suelo y el cielo por paso de φ (solo el algoritmo del pintor debe correr por cuadro). Objetivo tras optimizar: ≤ 1,2 ms en escritorio. El despliegue solo dura 100 svh de scroll; fuera de esa banda el mundo es estático y se sube una vez.

### 2.4 Modos de mundo y continuidad

- **Escenario** (S0–S3): el mundo está clavado a la pantalla (offset 0); lo que cambia es la cámara, según el scroll. El texto pasa por encima. Es el patrón «gráfico fijo + texto que corre».
- **Tira** (S4–S10): el plano cenital se ancla al documento: `fila de mundo = fila de documento − origen`. El lienzo se desplaza con la sobrecarga de §8.3, así que el fondo se mueve con la suavidad del scroll nativo. El origen se fija para que, al terminar S3, el offset sea 0: no hay salto de posición.
- **Carta** (S10): tres niveles de detalle (LOD) que se cambian con costura de luz (§4, S10).

**Continuidad de velocidad.** Al pasar de escenario a tira el mundo pasa de velocidad 0 a velocidad 1× respecto al scroll; se suaviza con los últimos 25 svh de S3, en los que φ ya es 90° y `κ` está en 1 (la atención está en el circuito).

**La ruta es el cable** (regla 9): una polilínea de segmentos rectos y diagonales de 45° (Beck) que pasa por los anclajes: Malecón → Isla A → B → C → D → horizonte. Base tenue (T5, punteada `·`), tramo recorrido en T9 continuo, cabeza en T13. La posición de la cabeza es función del `scrollY`. Es arte y es barra de progreso a la vez: no hace falta ningún control ni texto que lo explique.

### 2.5 Cámara B: perspectiva («Mode 7»), variante probada

**Qué es.** La misma geometría del §2.3 (cajas, suelo por clase, cielo) vista con **perspectiva real**. El suelo se calcula por **rayo inverso** por subpíxel (la técnica del «Mode 7» de la SNES: un plano con textura que cambia altura por profundidad, [V] https://en.wikipedia.org/wiki/Mode_7; la formulación con cabeceo está en Tonc, [V] https://www.coranac.com/tonc/text/mode7ex.htm; aquí solo se toman ideas y fórmulas, el código es propio) y las cajas se proyectan por sus ocho esquinas y se pintan de lejos a cerca. Es una **función pura** con el mismo mundo y el mismo suelo (`groundClass`) que la cámara A: comparte póster, pruebas de paridad y estado estático, y a φ = 90° cae en **exactamente el mismo plano**.

**Por qué merece la prueba.**

1. A 4–6° el skyline deja de ser un diorama: las calles convergen hacia el horizonte, el Malecón se estrecha al fondo y las cajas cercanas tapan a las lejanas.
2. El despliegue pasa a ser un **vuelo**: el horizonte sube y sale de cuadro, la ciudad se ensancha y, sin corte, aparece el plano.
3. Es el gesto de los mapas narrativos con scroll (en Mapbox cada capítulo lleva su cámara con centro, zoom, *pitch* y *bearing* y la página «vuela» de una a otra, [S] https://docs.mapbox.com/mapbox-gl-js/example/scroll-fly-to/), pero dibujado con caracteres. En las búsquedas de esta pasada no encontré [S] ningún sitio informativo que use un plano en perspectiva hecho de glifos como estructura de página; sí hay motores y demos (`kyhsa93/ascii-engine`, «ASCII City»; §1.1), sin licencia declarada: solo ideas.

**Fórmulas** (Anexo A.7). Cada celda son 2×2 subpíxeles y cada subpíxel mide 4×8 px, de ahí `ASPECT = 2` en vertical:

```formula
punto (X, h, Z) → pantalla    xw = X − Xc ;  zw = Z − Zc ;  y = H − h
                              yc = y·cosφ − zw·sinφ ;   zc = y·sinφ + zw·cosφ          # profundidad a lo largo del eje
                              col = cx + f·xw / zc ;    fila = cy + f·yc / (zc·ASPECT)
suelo (rayo inverso)          vp = (fila − cy)·ASPECT ; dy = vp·cosφ + f·sinφ ; dz = −vp·sinφ + f·cosφ
                              si dy ≤ 0 → cielo ;  k = H/dy ;  (X, Z) = (Xc + k·(col − cx), Zc + k·dz) ;  profundidad = k·f
horizonte                     fila_h = cy − f·tanφ / ASPECT                              # Tonc: y_h = D·tanθ
f = (subpíxeles de ancho / 2) / tan(hfov / 2)        hfov = 90° en escritorio, 74° en móvil
```

**Claves de cámara** (entre claves, `smoothstep`; H y z en unidades del mundo). `vs` exagera la altura de las cajas (licencia de dibujo: a 4° la ciudad real parecería un zócalo) y vale 1 desde φ = 65°:

| φ | H | z de la cámara | fila del objetivo | vs |
|---:|---:|---:|---:|---:|
| 4° | 8 | −26 | 0,72·alto | 1,8 |
| 14° | 14 | −24 | 0,66 | 1,6 |
| 24° | 22 | −22 | 0,62 | 1,4 |
| 40° | 34 | −16 | 0,57 | 1,2 |
| 65° | 50 | −6 | 0,52 | 1,0 |
| 90° | 60 | 4 | 0,50 | 1,0 |

**Cuantización a celdas.** Los cuatro subpíxeles de una celda se reparten entre su tono más claro y el más oscuro y se elige el cuadrante (`▘▝▖▗▀▄▌▐▚▞▙▛▜▟█`); si las cuatro muestras son de la misma cara de una caja, se pone el glifo de cara (`█` frente, `▓` lado, `░` techo). La **niebla** acerca los planos lejanos al tono del resplandor del horizonte (T4). El **agua** lleva una rampa tenue (`- ~ =`); el reflejo lo pone la capa de cielo.

**Medido** [M, Node 24, un hilo, calentado con 30 cuadros, media de 40; mismas funciones y mismo mundo; sin el cielo]:

| Celdas | Cámara A (φ 14° / 40° / 90°) | Cámara B (φ 4° / 40° / 90°) |
|---|---|---|
| 3 300 (55×60, móvil) | 0,3 / 1,0 / 0,4 ms | 0,4 / 0,6 / 0,8 ms |
| 4 800 (120×40) | 0,8 / 1,5 / 0,4 ms | 1,6 / 1,7 / 1,0 ms |
| 8 000 (160×50) | 0,6 / 1,4 / 0,8 ms | 1,3 / 2,1 / 1,7 ms |

Con la CPU ×4 (proxy del A07, sin medir en el A07) la cámara B llega a **4–8,4 ms en escritorio** (4 800 a 8 000 celdas) y 1,6–3,2 ms en móvil, contra el techo de 6 ms por cuadro de 05 §3.8. Por eso, en escritorio, B exige **cachear el suelo** (se recalcula solo cuando φ cambia más de 1°) o **calcularlo a media resolución mientras se mueve** y bajar a 24 fps durante S3; en móvil (55 columnas) cabe sin trucos.

**Lo que se vio** [M, capturas en color de 100–120×30–40 celdas; no se incluyen porque los archivos de esta pasada no persisten]: a φ = 4° un skyline nocturno con ventanas encendidas, el Malecón como línea clara y la cruz del Faro; a 24° las fachadas empiezan a enseñar sus techos; a 40° las calles convergen y la planta en cruz del Faro se vuelve una figura clara; a 65° y 90° coincide con el plano de la cámara A. Problemas vistos y su remedio: (1) escalones grandes en el degradado del cielo (solo hay 16 tonos): dither de ruido azul en las costuras; (2) glifos pesados en el agua si la rampa llega a `M@`: la rampa del agua se corta en `A`; (3) las cajas que cruzan el plano cercano (`zc < 0,6`) desaparecen de golpe: recorte de la cámara al plano cercano; (4) **en un boceto de solo glifos las siluetas oscuras desaparecen** (son tono de fondo): por eso los bocetos de este documento son de la cámara A, cuyas caras son glifos `█▓░`.

**Decisión.** La **cámara A es la de v1** (probada, más barata, bocetos legibles). La **cámara B** entra en M2 **detrás de `?cam=persp`** y se aprueba **mirando las dos en color** a φ = 4°, 24°, 40° y 90°, en 390 px y en 1440 px. Gana B si (a) lee mejor a 390 px, (b) en escritorio no pasa de 2,5 ms tras cachear el suelo y (c) el despliegue cabe en 24 fps con CPU ×4. Si gana, sustituye a A en S0–S3; **el resto del concepto no cambia** (desde φ = 90° es el mismo mundo).

### 2.6 Cielo real (opcional, P2)

**Idea.** Las estrellas del héroe no son ruido: son las **reales sobre Santo Domingo en el instante de la visita**. La cámara mira al norte; la ventana del héroe cubre 110° de acimut (de 305° a 55°) y desde el horizonte hasta unos 55° de altura. **No hay texto que lo diga** (regla del dueño): quien lo comprueba, lo comprueba.

**La Polar marca la latitud.** La estrella Polar (α UMi, δ = +89,26°) está a 0,74° del polo, así que su altura sobre el horizonte norte es la **latitud del lugar ± 0,74°**: en Santo Domingo, **entre 17,7° y 19,2°**. [M: con las fórmulas de abajo salió 19,15° (15-ene), 17,73° (15-jun), 18,35° (15-sep), 19,19° (15-dic), 17,85° (21-mar).] Es la única estrella que va **en el póster**, porque no se mueve, y su altura coincide con la latitud «18°28′» que el pie de la página ya escribe. El guiño es verdadero: *la estrella del norte está tan alta como la ciudad está al norte del ecuador.*

**Cálculo** (Anexo A.8, sin API, ≈ 25 líneas):

```formula
D        = JD − 2451545,0                          JD = ms/86 400 000 + 2 440 587,5
GMST (h) = 18,697374558 + 24,06570982441908·D   (mod 24)      USNO «Approximate Sidereal Time»: error máx. 0,43 s en 2000–2100 [S]
LST (h)  = GMST + λ/15                             λ = −69,9361° (18°27′45″ N 69°56′10″ O, Wikipedia)  →  LST = GMST − 4,66 h
H        = (LST − RA)·15°                          ángulo horario, oeste positivo
sen alt  = sen φ·sen δ + cos φ·cos δ·cos H
az       = atan2(−cos δ·sen H , cos φ·sen δ − sen φ·cos δ·cos H)     acimut desde el norte hacia el este
celda    col = cols/2 + az/gradosPorCol ;  fila = horizonte − alt/(2·gradosPorCol)      (celda 1:2; gradosPorCol = 110/cols)
```

**Datos.** Extracto del Bright Star Catalogue 5.ª ed. (CDS V/50; 9 110 estrellas hasta mag 6,5 [S]) con las de magnitud ≤ 4,0 (≈ 500 en todo el cielo [C, conteo clásico]); 5 bytes por estrella (RA 16 bits, Dec 16 bits, mag 8 bits) ≈ 2,5 KB, ≈ 1,6 KB gzip [C]. El prototipo de esta pasada usa **58 estrellas escritas a mano con posiciones aproximadas**: sirve para probar la proyección, **no para publicar**. **Crédito y licencia:** CDS pide reconocer VizieR («This research has made use of the VizieR catalogue access tool, CDS, Strasbourg, France (DOI: 10.26093/cds/vizier)», [S]) → una línea en `CREDITS.md`; **verificar los términos del ReadMe de V/50 antes de publicar** (no se pudo abrir aquí).

**Comportamiento.** Se calcula una vez al cargar y otra al volver a una pestaña que estuvo oculta más de una hora. Las estrellas se pintan solo donde el campo líquido tiene densidad < 0,08 y fuera de los pozos de lectura; usan la paleta animada 24–29 (centelleo por ciclado: cero celdas tocadas). Con `prefers-reduced-motion` o `saveData` se calculan igual y no centellean. **Coste:** 58 estrellas por cuadro < 0,01 ms [M].

**Lo que hay que saber antes de prometerlo.** El cielo real es **escaso, no espectacular**: en la ventana norte del prototipo hay 3 estrellas de las 58 en septiembre (Alioth, Alkaid y la Polar), 5 en enero y 7 en marzo, junio y diciembre; con el catálogo completo habrá más, sin medir [C]. La densidad visual la sigue poniendo el polvo determinista (≈ 1,5 % de las celdas). Por eso es P2: es un detalle de oficio, no el gancho de la portada.

---

## 3. Sistema visual y tipográfico

### 3.1 Una sola familia: Geist Mono Variable

- **Geist Mono Variable** (OFL-1.1) para todo: texto, UI, lettering y arte. Solo `latin` + `symbols2` (28,9 KB, precargados los dos; 03 §1.2). `symbols2` es obligatorio: sin él las cajas y bloques del lettering caen a otra fuente con otro ancho (03 §1.2).
- Se **retira Bricolage Grotesque de la portada** y de todo el arte: −68,6 KB de precarga y desaparece el fallback métrico mal calculado (132,57 % en vez de 111,04 %; 03 §1.5). Las páginas `/referencias/` pueden conservarla hasta migrarlas (§11, D4).
- Carga: `fontProviders.local()` con dos variantes (`latin` primero, `symbols2` segundo) o, si `dist/` sigue mostrando `size-adjust: 85.986%`, fallback manual «Gaya Mono Fallback» con `size-adjust: 100%`, `ascent-override: 100.5%`, `descent-override: 29.5%` (03 §2.2, opciones A y B). `font-display: swap`. Nunca terminar la pila en `monospace` a secas (en Windows es Consolas, 8 % más estrecha).
- Pesos: **400** texto; **500** etiquetas de UI y corchetes; **700** promesa, nombres, botones; **800** h1. `letter-spacing: 0` siempre (el `-0.02em` global de `h1–h3` se anula: descuadra columnas). `font-variant-ligatures: none; font-kerning: none` en todo el arte.
- Añadir Geist Mono (© 2024 The Geist Project Authors, OFL-1.1) a `CREDITS.md`.

### 3.2 Sistema de celda 2:1 y ritmo de fila

**Hallazgo probado [M]:** la receta de 03 para eliminar costuras, `--art-lh = calc(round(down, 1.3em, 1px) - 1px)`, con `font-size = cw / 0,6` da una fila de **exactamente 2·cw** para anchos de celda de 6 a 11 px. Falla en 5 (9 en vez de 10) y desde 12 (25 en vez de 24). Es decir, la fuente de 11,667 px da una celda de 7×14; la de 13,333 px, 8×16; la de 15 px, 9×18. El código de comprobación está en el Anexo A.1.

Hay **dos rejillas** que comparten la regla 2:1 pero no tienen por qué coincidir:

1. **Rejilla CSS (texto y lettering en DOM)**, por ancho de ventana:

| Ancho de ventana | Celda CSS | Fuente del arte | `--art-lh` | Texto | Interlínea del texto | Ejemplo |
|---|---|---:|---:|---:|---:|---|
| < 520 px | 7×14 | 11,667 px | 14 px | 17 px | 28 px (2 filas) | 390 px → 55 columnas |
| 520–1279 px | 8×16 | 13,333 px | 16 px | 18 px | 32 px (2 filas) | 768 px → 96 columnas |
| ≥ 1280 px | 9×18 | 15 px | 18 px | 19 px | 36 px (2 filas) | 1440 px → 160 columnas |

   La interlínea del texto es `round(1.65em, var(--ch))` (función `round()` de CSS, Baseline 2024; 03 §2.3) con `line-height: 1.7` como respaldo: el texto cae siempre sobre dos filas de la rejilla.

2. **Rejilla del lienzo (JS)**: la celda sube de 7 px de ancho en 7 px, 8 px… (fila siempre 2:1, hasta 14 px) hasta cumplir `columnas × (filas + 8) ≤ maxCeldas(tier)`; en dispositivo son enteros (`round(cw·dpr)`, DPR ≤ 2). Aquí la receta de las 6 a 11 px no importa (el lienzo no usa fuente para los bloques: los dibuja por código, 05 §3.2). Ejemplos [M, cuentas]: 390×844 → 7×14 = 55 × (60 + 8) = 3 740 celdas (cabe en `low`, 4 200); 1440×900 → 9×18 daría 160 × 58 = 9 280 (> 9 000) → **10×20 = 144 × 53 = 7 632**; 1920×1080 → 11×22 daría 174 × 57 = 9 918 → **12×24 = 160 × 53 = 8 480**. El motor publica `--cell-w` y `--cell-h` (fraccionarios en CSS) para los pozos.

**Medida del texto**: ≤ 62 ch en escritorio; en móvil ocupa el ancho útil (≈ 35 ch a 17 px). Párrafos ≤ 6 líneas en móvil. Peso 400. Sin justificar. `text-wrap: pretty`.

### 3.3 Ritmo de escala

Seis escalones, cada uno ≈ ×1,5 a ×2 el anterior, medidos para 390 px y 1440 px:

| Escalón | Qué es | Móvil (390 px) | Escritorio (1440 px) | Color |
|---|---|---|---|---|
| 1 · Celda del mundo | Todo el arte del lienzo, topónimos de la lupa | 7×14 px | 10×20 px | T0–T15 |
| 2 · Texto | Párrafos, listas, botones | 17 px / 28 px | 19 px / 36 px | `--ink`, `--muted` |
| 3 · Promesa | Promesa de cada servicio, nombres de referencia | 21 px, 700 | 26 px, 700 | `--ink` |
| 4 · Lettering | Los h2 de sección en bloques | 3 filas de 14 px = 42 px de alto | 3 filas de 18 px = 54 px | `--accent-text` |
| 5 · h1 | Titular de portada | 36 px, 800 | 80 px, 800 | `--ink` + palabra acento |
| 6 · Escena | Isla, plano, cielo | 40–60 filas = 560–840 px | 40–50 filas = 800–1 000 px | T0–T15 |

El lettering es el escalón que hace de «palabra sólida saturada sobre campo atenuado» (patrón Unseen, 01 §2.3) sin necesidad de una segunda familia.

### 3.4 Paleta Cobalto

Los 16 tonos salen de interpolar en OKLCH `--glow-0..3` (T0 = `--surface`, T5 = `--glow-1`, T10 ≈ `--glow-2`, T15 = `--glow-3`), con el recorte de croma de `src/lib/color.mjs` [M, mismos hex que 05 §2.1 salvo 1–2 dígitos]. Contrastes calculados con `contrast()` del propio repo [M]:

| Tono | Hex | vs `--ink` | vs `--muted` | vs `--accent-text` | Papel |
|---:|---|---:|---:|---:|---|
| T0 | `#02051b` | 17,98 | 9,75 | 11,62 | Fondo, siluetas de primer plano |
| T2 | `#07134f` | 15,37 | 8,34 | 9,94 | Siluetas lejanas, paneles |
| T4 | `#0f238a` | 11,47 | **6,22** | 7,42 | **Tope bajo texto `--muted`** |
| T5 | `#122caa` | 9,55 | 5,18 | **6,18** | **Tope bajo lettering** |
| T6 | `#143fbf` | **7,47** | 4,05 | 4,83 | **Tope bajo texto `--ink`** |
| T7 | `#1753d4` | 5,82 | 3,16 | 3,76 | Contornos, luz de borde |
| T8 | `#1c66ea` | 4,54 | 2,47 | 2,94 | Límite absoluto bajo `--ink` |
| T9 | `#2179ff` | 3,58 | 1,94 | 2,31 | Cable recorrido (5,03:1 contra T0), trazas |
| T10–T12 | `#4390ff` … `#6bbdff` | 2,8 … 1,8 | — | — | Elementos vivos: ventanas, nodos, pulsos |
| T13–T15 | `#88d0ff` … `#d1f1ff` | 1,5 … 1,05 | — | — | Luces y chispas (≤ 2 % de las celdas) |

**Uso por banda:**

| Banda | Fondo y masas | Vivos | Chispas |
|---|---|---|---|
| Cielo | T0→T5; bruma del horizonte T6–T7 con ruido azul | Filamentos T7–T9 (fuera de pozos) | Estrellas (paleta 24–29), núcleo del haz T13–T15 |
| Costa | Siluetas T1–T3 con luz de borde `▀` T7 | Ventanas T10–T12 (≤ 3 %) | Cruz de luz |
| Plano y circuito | T1–T4 | Trazas T7–T9; buses T9 | Pulsos T13–T15 |
| Mar | T0–T3 | Agua por ciclado de paleta (16–23: T4→T9) | Destellos ≤ 1 % |
| Islas | Tierra T2–T4; achurado T5–T7 | Edificios T8–T10; luces T11–T13 | Pin T15 |
| Carta | T1–T5 | Cable T9, cabeza T13 | Pin vacío T15 |

Reglas: acento (`--accent-text`, T10+) ≤ 5 % de la pantalla; `--glow-2` y `--glow-3` jamás bajo texto; el texto lleva `--ink` o `--muted` y **nunca** un tono del arte. Los topes de los pozos son **T6** para `--ink`, **T4** para `--muted` y **T5** para el lettering; con `prefers-contrast: more` los topes bajan a T3, T2 y T3.

### 3.5 Lettering propio «Carta 5×5»

Los h2 de sección son letras de bloques, no una fuente: una tipografía **propia** de 26 mayúsculas en una retícula de 5×5 (Anexo A.3), sin tildes (el texto real conserva las tildes en `sr-only`). Evita el cliché de ANSI Shadow y su licencia dudosa (03 §1.7). Se renderiza en dos modos:

- **`half`**: 1 píxel = 1 celda de ancho × media fila (`▀ ▄ █`). Píxel casi cuadrado. Letra de 5 celdas, paso 6, alto de 3 filas.
- **`quad`**: 1 píxel = media celda × media fila (cuadrantes `▘▝▖▗▚▞▙▛▜▟▀▄▌▐█`). Paso 3 celdas; letras altas y condensadas. Es el modo móvil.

```text
▄▀▀▀▀ ▄▀▀▀▄ ▀▄ ▄▀ ▄▀▀▀▄
█  ▀█ █▀▀▀█   █   █▀▀▀█
 ▀▀▀  ▀   ▀   ▀   ▀   ▀

▞▀▘▞▀▖▚▗▘▞▀▖
▌▝▌▛▀▌ ▌ ▛▀▌
▝▀ ▘ ▘ ▘ ▘ ▘
```

```text
█   █ █▀▀▀▀ █▀▀▀▄   ▀▄ ▄▀   ▄▀▀▀▄ █▀▀▀▄ █▀▀▀▄ ▄▀▀▀▀
█▄▀▄█ █▀▀   █▀▀▀▄     █     █▀▀▀█ █▀▀▀  █▀▀▀   ▀▀▀▄
▀   ▀ ▀▀▀▀▀ ▀▀▀▀      ▀     ▀   ▀ ▀     ▀     ▀▀▀▀

▌ ▌▛▀▘▛▀▖ ▚▗▘ ▞▀▖▛▀▖▛▀▖▞▀▘
▙▚▌▛▘ ▛▀▖  ▌  ▛▀▌▛▀ ▛▀ ▝▀▖
▘ ▘▀▀▘▀▀   ▘  ▘ ▘▘  ▘  ▀▀
```

```text
▀▛▘▙ ▌▛▀▘▛▀▖▞▀▖▛▀▘▞▀▘▀▛▘▛▀▖▌ ▌▞▀▘▀▛▘▌ ▌▛▀▖▞▀▖
 ▌ ▌▚▌▛▘ ▛▜ ▛▀▌▛▘ ▝▀▖ ▌ ▛▜ ▌ ▌▌   ▌ ▌ ▌▛▜ ▛▀▌
▀▀▘▘ ▘▘  ▘ ▘▘ ▘▀▀▘▀▀  ▘ ▘ ▘▝▀ ▝▀▘ ▘ ▝▀ ▘ ▘▘ ▘

█▀▀▀▄ █▀▀▀▄ ▄▀▀▀▄ ▄▀▀▀▀ █▀▀▀▀ ▄▀▀▀▀ ▄▀▀▀▄
█▀▀▀  █▀▀█  █   █ █     █▀▀    ▀▀▀▄ █   █
▀     ▀   ▀  ▀▀▀   ▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀   ▀▀▀
```

Anchos de cada título en columnas de celda (medidos con el generador del Anexo A.3):

```text
título                                 half  quad | palabra más larga (half / quad)
Quiénes somos                           73    37  | 41 / 21
Who we are                              51    26  | 17 / 9
Desarrollo web y apps                  113    57  | 59 / 30
Web and app development                125    63  | 65 / 33
Automatización e IA                    105    53  | 83 / 42
Automation and AI                       93    47  | 59 / 30
Marketing digital y redes              137    69  | 53 / 27
Digital marketing and social media     187    94  | 53 / 27
Soporte e infraestructura IT           155    78  | 89 / 45
IT support and infrastructure          161    81  | 83 / 42
Referencias                             65    33  | 65 / 33
References                              59    30  | 59 / 30
Proceso                                 41    21  | 41 / 21
Process                                 41    21  | 41 / 21
Contacto                                47    24  | 47 / 24
Contact                                 41    21  | 41 / 21
Pon tu negocio en el mapa              129    65  | 41 / 21
Put your business on the map           147    74  | 47 / 24
```

**Reglas de uso** (medidas contra esa tabla):

1. Se elige el modo más grande que cabe: `half` si la palabra más larga cabe en `columnas − 8`; si no, `quad`. En 390 px (55 columnas) caben todas las palabras en `quad` (la más larga es *infraestructura*, 45); en 320 px (45 columnas) no cabe *infraestructura*, así que por debajo de 360 px el h2 se muestra como **texto real** en Geist Mono 800 (sin lettering).
2. El texto se parte en líneas por palabras (codicia). Tres variantes generadas en el build: **XL** (≥ 120 columnas, `half`, líneas ≤ 100), **M** (72–119, `half`, ≤ 66) y **S** (< 72, `quad`, ≤ 46), conmutadas con `@container` (03 §2.3). Coste en HTML: ≈ 3 KB gz para todos los títulos.
3. Patrón accesible (03 §2.6): `<h2 id="…"><span class="sr-only">Desarrollo web y apps</span><span class="art art--solid" aria-hidden="true" translate="no" data-art="…"></span></h2>`. El arte va en `data-art` + `::before` (no entra al DOM: axe/Lighthouse no lo evalúan; 03 §1.8) y **no cuenta para el LCP** (§8.6): el LCP de la portada es texto real.
4. Color plano `--accent-text` (sin degradados: `PRODUCT.md`). `-webkit-text-stroke: .3px currentColor` solo en `.art--solid` para cerrar microcosturas (03 §1.4). Fuente = `cw/0,6` de la rejilla CSS y `line-height: var(--art-lh)`: costuras cero por la receta de 03.
5. Cada lettering lleva un pozo de tope **T5** (§7).

### 3.6 UI de texto

- **Botones con corchetes** (01 §5.11, 03): `[ Escríbenos por WhatsApp ]`. El texto accesible es el del enlace; los corchetes son `::before { content: "[ " / ""; }` y `::after { content: " ]" / ""; }` (con la sintaxis de texto alternativo vacío). Altura ≥ 44 px; foco visible de 2 px en `--accent-text` (≥ 3:1). El botón primario lleva relleno `--accent-text` y texto `--on-accent` (11,62:1); el secundario, solo el corchete.
- **Menú**: la píldora actual se conserva con texto mono; el enlace de la sección visible lleva `aria-current="location"` y corchetes (`[ Servicios ]`). Idioma `[ ES | EN ]`. La marca provisional deja el orbe de CSS y pasa a **`(o) Gaya Digital`** en texto: el `(o)` es la lente en miniatura.
- **Esquinas fijas** (01 §5.11): arriba izquierda marca; arriba derecha menú; abajo izquierda idioma; abajo derecha **WhatsApp** (siempre visible). En móvil, barra inferior fija con WhatsApp dominante (≥ 44 px) y menú a la derecha.
- **Marco de carta (neatline con retícula)**: el lienzo dibuja un marco de una celda en los bordes con marcas `┼` cada 8 filas; en modo **tira** las marcas se desplazan con el mundo, así el visitante siente que viaja sobre un mapa sin ningún texto ni control. En modo escenario las marcas están quietas.
- **Minimapa** (solo ≥ 84 columnas): una columna de 3 celdas en el borde derecho que resume el mundo (cielo `·`, costa `▄`, plano `┼`, mar `~`, islas, carta) con un corchete que marca la posición. Cada tramo es un `<a>` transparente de ≥ 24 px de ancho con `aria-label` (el nombre de la sección); en móvil no existe (la ruta ya hace de progreso).
- **Iconos**: se conservan los SVG de WhatsApp y redes (marcas que deben reconocerse); no se añaden más.

### 3.7 Alfabeto de glifos

- **Permitido**: ASCII imprimible; `· ¯`; cajas `U+2500–257F` y bloques `U+2580–259F` (en el lienzo se dibujan por código; en DOM salen de `symbols2`); `« » ¿ ¡ × ± ° § ′ ″` y `– — …` en textos.
- **Prohibido dentro de rejillas** (caen a otra fuente con otro ancho): `→ ← ■ □ ● ○ ◆ ◇ ▲ ▶ ★ ≈ ≠ ≤ ≥`, Braille y emoji. Las flechas se dibujan con `>`, `»` o cajas.
- **Cuatro familias por plano, máximo dos** (05 §2.2): línea (`─ │ ┼ ╭ ╮ ╰ ╯ ═ ║ ╱ ╲`), masa (`█ ▀ ▄ ▌ ▐` y cuadrantes), textura (`░ ▒ ▓` y la rampa) y detalle (`+ * o @ · ' . :`).
- **Achurado** (nuevo): los glifos `- | / \` se eligen por la **dirección de la pendiente** del terreno, con umbral 0,55 de magnitud (probado; §4 S5–S8).
- **Las letras de la marca** (`y a A G`) solo aparecen en la rampa del cielo, en crestas calientes (≤ 2 % de las celdas): «el agua hecha del nombre» (01 §5.4).
- Un lint del repositorio (`npm run ascii:lint`, §8.9) rechaza cualquier glifo prohibido en `data-art` y en los bocetos; los bocetos de este documento pasan ese lint [M].

---

## 4. Las secciones, una por una

Cada sección lleva: **arte** (qué se dibuja, con qué técnica, cómo se mueve), **contenido** (texto real, en orden), **interacción**, **móvil** y **movimiento reducido**. Los bocetos son **solo glifos** (sin tono: el color y el brillo dan el resto), generados por el código de los anexos y comprobados contra el lint de glifos [M].

### S0 · Portada (`#inicio` / `#home`, 100 svh, escenario, φ = 14°)

**Arte.** Es el fotograma φ = 14° del mundo (§2.3).

| Elemento | Qué se dibuja | Técnica | Tono |
|---|---|---|---|
| Cielo líquido | Cintas horizontales de luz que se deforman, más densas hacia el horizonte; arriba, un tercio casi oscuro con estrellas | Dos capas de una **tesela periódica de 64×64** (cresta de ruido entero, se hornea en 3–4 ms) muestreadas a escalas y velocidades distintas: **0,09–0,10 ms** por cuadro de 4 480 celdas [M, Node] (×4 ≈ 0,4 ms). Rampa `' · : = * y a A G ▒'` (las letras de la marca solo en crestas calientes) | Filamentos T7–T9; fondo T0–T5 |
| Estrellas | ~1,5 % de las celdas (`· +`), cada una con su fase; **la Polar, siempre en el póster**, a la altura de la latitud (§2.6) | Ciclado de paleta 24–29: cero celdas tocadas. Opcional (P2): las demás son las estrellas reales del momento (§2.6) | Paleta 24–29 |
| Bruma | Banda de `░` justo sobre la ciudad | Ruido azul 64×64 anclado a la celda | T6–T7 |
| Ciudad | Silueta de manzanas; Catedral con nave baja y campanario truncado (`+` de cruz); Alcázar con arcadas `╭╮`; Fortaleza con torre; ≤ 3 % de ventanas encendidas | Cajas del §2.3 a φ = 14° con cuadrantes; luz de borde `▀`; ventanas por hash entero | Siluetas T1–T3; luz de borde T7; ventanas T10–T12 |
| Faro y cruz de luz | Faro en la otra orilla (trapecio escalonado, dos cajas en cruz); **haz vertical** hasta el cenit, **brazo horizontal** al ~22 % de la altura | Núcleo `║ █` (paleta 30), flancos `▒`, halo ±7 celdas con ruido azul; brazo de 17 columnas de semi-longitud en 100 columnas (9 en 44) | Núcleo T13–T15; halo T9–T11 |
| Mar y Malecón | Banda de primer plano con oleaje, farolas `·` y una columna de reflejo bajo el Faro | Paleta 16–23 para el agua; 31 para farolas | T3–T9 |
| Lente | Orbe en la intersección de la cruz; sigue al puntero | Hereda `hero.ts`: muelle `k = 1 − e^(−4·dt)` (9 si arrastra), `repel()` para rodear el texto. Dentro del disco (radio ≈ 7 celdas de ancho) se dibuja a **doble resolución vertical** con medios bloques `▀▄` (fg/bg) y un aro de 1 celda en T15/T9 | T9–T15 |

```text
               ·······················        ····················:::::=:::::::=:::░║░····
       ·  ·············:::::::······································::::::::::::···░║░
        ·········::::::::::::==::::::::::==:::::································   ░║░
      ···········:::::::::=:::::··············:::=::::··················           ░║░
      ················:::::==:::····     ·    ····::=:::·····                 ·    ▒║▒
     ·····················::::··:::··············::==::···                         ▒║▒
  ·············        ········::::·········=====::····                            ▒║▒           ·
···········                     ················                   ═════════════════█═══════════════
:::·······                                                                         ▒║▒ ·············
:::····            ·                                                               ▒║▒····:::::===::
:····                              ·                                       +       ▒║▒··:::==*******
···                                          ·                                     ░║░··::===*******
  ·                                                +             ·                 ░║░·:::===*******
·                                                ·▟▙           ·          ·        ░║░::===***yy****
····                                             ▝▀▀▘                            ··░║░:===*********=
::···················                            ████                        ······░║░::::::::::::::
::::····························                 ████    ···························║···············
::·····················:·················      ··████·········:::::::···············║
·················································████····:::::::::::::::······      ║
······  ·      · ·  ·· · ·······················▄████▄▄▄▄▄▄▄▄::=====█████····· ▄▄▄▄▄▄▄▄▄▄
····· · ·· ··   ··· · ···· · ···· ··············█████████████████████████████████████████    ·     ·
··························  ············██████··███████████████████╭█╭█╭█╭█▄▄▟████████████▄▄▖ ·· ···
:::·:···················· ···· ·········████████████████████████████████████████████ █████████· ····
                                        ████████████████████████████████████████████ █████████
  ·    ·    ·    ·    ·    ·-   · - -·  - ·   -·- ~ · -- ·    ·    · -  --       --    -      - -
     -        -      ~ ~      -           -    -      -  -          -     -   -  -:~:- --  -       -
      -  -  -        --   -- --    -     -  -- -           -     --- -  -- -      ·   ·       ---
     -      -    -   ~ -    -  --        - ~   -   -- -  -        --  -        --   :     -  - -
   -       -   -        -   -         -    -   -  -   -- --       ~             - · · · -     -    -
-          - --      -         -          -~ ~   -      - -        ~ -              :
```
*Boceto de portada, 100×30 (escritorio). El pozo de lectura queda a la izquierda, en el cielo más tranquilo; la ciudad y el Faro a la derecha.*

```text
               ·······················        ····················:::::=:::::::=:::░║░····
       ·  ·············:::::::······································::::::::::::···░║░
        ·········::::::::::::==::::::::::==:::::································   ░║░
      ···········:::::::::=:::::··············:::=::::··················           ░║░
      ················:::::==:::····     ·    ····::=:::·····                 ·    ▒║▒
     ·····················::::··:::··············::==::···                         ▒║▒
  ····                                      =====::····                            ▒║▒           ·
······                                      ····                   ═════════════════█═══════════════
:::··· Tu negocio,                                                                 ▒║▒ ·············
:::···                                                                             ▒║▒····:::::===::
:····  imposible                                                           +       ▒║▒··:::==*******
···                                          ·                                     ░║░··::===*******
  ·    de ignorar                                  +             ·                 ░║░·:::===*******
·                                                ·▟▙           ·          ·        ░║░::===***yy****
····                                             ▝▀▀▘                            ··░║░:===*********=
::····                                           ████                        ······░║░::::::::::::::
::::·· Web, apps, marketing, soporte IT e IA.    ████    ···························║···············
::···· Desde Santo Domingo para el mundo.      ··████·········:::::::···············║
······                                      ·····████····:::::::::::::::······      ║
······                                      ····▄████▄▄▄▄▄▄▄▄::=====█████····· ▄▄▄▄▄▄▄▄▄▄
·····  [ Escríbenos por WhatsApp ]          ····█████████████████████████████████████████    ·     ·
······                                      ██··███████████████████╭█╭█╭█╭█▄▄▟████████████▄▄▖ ·· ···
:::·:···················· ···· ·········████████████████████████████████████████████ █████████· ····
                                        ████████████████████████████████████████████ █████████
  ·    ·    ·    ·    ·    ·-   · - -·  - ·   -·- ~ · -- ·    ·    · -  --       --    -      - -
     -        -      ~ ~      -           -    -      -  -          -     -   -  -:~:- --  -       -
      -  -  -        --   -- --    -     -  -- -           -     --- -  -- -      ·   ·       ---
     -      -    -   ~ -    -  --        - ~   -   -- -  -        --  -        --   :     -  - -
   -       -   -        -   -         -    -   -  -   -- --       ~             - · · · -     -    -
-          - --      -         -          -~ ~   -      - -        ~ -              :
```
*El mismo boceto con el texto real dentro del pozo. El h1 real es mucho mayor (80 px = unas cinco filas por línea): aquí solo marca su lugar.*

**Ignición (≤ 2,6 s, la única animación autónoma de la página).** t = 0: el póster SSR (un fotograma tenue del mismo campo) ya está pintado. 0,5–1,4 s: la luz sube desde el horizonte (máscara `smoothstep(0, 1, (t − 0,5)/0,9 − (1 − k))`, k = 0 arriba, 1 en el horizonte). 1,0–2,0 s: el haz sube desde el Faro a 40 filas/s. 1,8–2,4 s: el brazo se extiende a ambos lados. 2,2–2,6 s: aparece la lente (radio 0 → R, `easeOutExpo`) y las chispas. A los 2,6 s el bucle se duerme; desde entonces solo el scroll, el puntero, el foco o el toque lo despiertan.

**Contenido** (texto real, en este orden): `h1` «Tu negocio, imposible de ignorar» (palabra acento «imposible» en `--accent-text`; EN: «Your business, impossible to ignore»), párrafo de apertura («Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo.»), botón primario `[ Escríbenos por WhatsApp ]` y secundario `[ Ver referencias ]` (ambos ya existen en `copy.ts`). Microdato opcional (P2) en la esquina: `Santo Domingo · 21:40`, con `new Intl.DateTimeFormat(lang === 'es' ? 'es-DO' : 'en-US', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit', hour12: false })` (UTC−4 todo el año; sin API).

**LCP.** El h1 (texto real, Geist Mono 800, fallback métrico al 100 %) y el póster `<pre>` son texto; ninguno depende de JS. El lettering y el canvas no cuentan para el LCP (web.dev, §1.1).

**Interacción.** Puntero: la lente sigue con muelle; al mover, la energía sube y el cielo fluye (`tiempo += dt·(0,1 + 0,85·energía)`, como hoy); reposo a los 1,6 s. Toque: destello de lente de 1,6 s en el punto. Teclado: al enfocar un botón, la lente se desliza al hueco libre más cercano de su centro durante 1,2 s. Al bajar, el cabeceo empieza: el haz se acorta con `cos φ`.

**Móvil (55 columnas).** El texto va arriba (≈ 14 filas), el horizonte al 78 % de la altura, el haz vertical a la derecha, el brazo más corto (0,2·W), la ciudad más baja; el botón de WhatsApp también vive en la barra inferior fija.

```text
       ··········   ·········::=:::░║░··
   ····:::::=:::::::::·············░║░
   ········::::··    ·:·:·  ·      ░║░
 ·                                 ░║░
·· Tu negocio,                     ▒║▒ ··:::
                                   ▒║▒ ·::::
   imposible                       ▒║▒·:::::
··                               ═══█═══════
   de ignorar                      ▒║▒
                                   ▒║▒
··                               · ▒║▒
=: Web, apps, marketing,         ·=░║░······
=: soporte IT e IA.              ·:░║░*=::::
:· Desde Santo Domingo           ·=░║░y*====
   para el mundo.                ·:░║░=*ay*y
                                 :·░║░:::===
   [ Escríbenos por WhatsApp ]   ·=*║=::::::
                                 ===║=*yaayy
::::··:::==**==:::········::::::=:::║···::::
yy**yyaAG▒GAA+G▒GAaaaaGa*=::::=ya=:·║·······
aAAAAAG▒▒▒▒G▟▙▒Aayy***yaA▒GAGG*:··  ║ ······
A▒▒▒▒▒GAAaa▝▀▀▘==::············     ║
yy**=::··· ████·······           ···║=****==
*==::··   ▄████▄▄▄▄▄▄▄▄       ···▄▄▄▄▄▄▒y*=:
·:::::··· █████████████████████████████:=*a▒
····:::████████████████╭█╭█╭█╭▗▄███████▙▄:::
·····:=█████████████████████████████ █████:·
       █████████████████████████████ █████
  ·-   ·   -·  - ·    · -  ·-         -    -
-          - --      -         -    :     -~
   - -  ~ ~     --        --        ·- -  --
 ~ ~ ~                              :
~      -   -   -   -   --     -   · ·-· ~
   --   - -   ---   ---       -   :~:-    --
```

**Movimiento reducido / ahorro de datos.** Se queda el póster: el fotograma final de la ignición, con la lente en reposo, sin bucle.

### S1 · Quiénes somos (`#nosotros` / `#about`, 110 svh, escenario, φ 14° → 18°)

**Arte.** El mismo escenario. Al avanzar, **la ciudad se despierta**: el umbral de ventanas encendidas sube del 0,5 % al 3 % (hash entero, sin `Math.random`); el haz se acorta un poco; el campo de cielo fluye más lento. Es el único movimiento; ocurre con el scroll.

**Contenido.** `h2` en lettering «Quiénes somos» (EN «Who we are») y una **leyenda de mapa** de siete líneas: un símbolo de 3–4 celdas + una frase (texto de 04 §3, sin cifras ni clientes). Es una `ul role="list"` cuyo símbolo sale de `li::before { content: attr(data-g) / ""; }` (no se lee):

| Símbolo | Línea (ES) | EN |
|---|---|---|
| `[G]` | Gaya Digital es la marca de Giancarlo González. | Gaya Digital is the brand of Giancarlo González. |
| `(@)` | Santo Domingo, República Dominicana. Trabajo remoto. | Santo Domingo, Dominican Republic. Remote work. |
| `Aa` | Español e inglés. | Spanish and English. |
| `(..)` | WhatsApp primero: ahí empieza todo. | WhatsApp first: that is where every project starts. |
| `[o]` | Hablas directo con el director, sin intermediarios. | You talk straight to the director, no middlemen. |
| `[=]` | Propuesta por escrito en 24–48 horas. | A written proposal within 24–48 hours. |
| `o─┐` | Tus accesos y tus archivos son tuyos desde el día uno. | Your logins and your files are yours from day one. |

(Las líneas 6 y 7 son compromisos `[CONFIRMAR]` de 04 §3: no salen a producción hasta que el dueño las apruebe.)

```text
  ▄▀▀▀▄ █   █ ▀▀█▀▀ █▀▀▀▀ █▄  █ █▀▀▀▀ ▄▀▀▀▀   ▄▀▀▀▀ ▄▀▀▀▄ █▄ ▄█ ▄▀▀▀▄ ▄▀▀▀▀
  █ ▀▄▀ █   █   █   █▀▀   █ ▀▄█ █▀▀    ▀▀▀▄    ▀▀▀▄ █   █ █ ▀ █ █   █  ▀▀▀▄
   ▀▀ ▀  ▀▀▀  ▀▀▀▀▀ ▀▀▀▀▀ ▀   ▀ ▀▀▀▀▀ ▀▀▀▀    ▀▀▀▀   ▀▀▀  ▀   ▀  ▀▀▀  ▀▀▀▀


         │
    [G]  │ Gaya Digital es la marca de Giancarlo González.
         │
    (@)  │ Santo Domingo, República Dominicana. Trabajo remoto.
         │
    Aa   │ Español e inglés.
         │
    (..) │ WhatsApp primero: ahí empieza todo.
         │
    [o]  │ Hablas directo con el director, sin intermediarios.
         │
    [=]  │ Propuesta por escrito en 24–48 horas.
         │
    o─┐  │ Tus accesos y tus archivos son tuyos desde el día uno.
```

**Interacción.** Al pasar o enfocar una línea, su símbolo se enciende (de `--muted` a `--accent-text`, 120 ms). Nada más: la sección se entiende sola.

**Móvil.** Lettering `quad` de una línea (37 columnas); la leyenda a todo el ancho, símbolo y texto en la misma fila hasta 30 caracteres, después la frase baja al renglón siguiente. **Reducido:** idéntico (no hay movimiento propio salvo las ventanas, que quedan en el umbral final).

### S2 · Referencias (`#referencias` / `#references`, 120 svh, escenario, φ 18° → 24°)

**Arte.** El escenario sigue clavado; el cabeceo sube a 24°. **La calle**: en DOM (no en el lienzo, para que vaya pegada al texto), una regla vertical `│` con farolas `┼` cada cuatro filas a la izquierda, y cada referencia es una casa: un **letrero** con el emblema ASCII de su sector.

- **14 emblemas de 11×5 celdas dibujados a mano** (Anexo A.4), uno por `icon` de `references.json`: `utensils`, `hard-hat`, `app-window`, `smile`, `scissors`, `sailboat`, `scale`, `library`, `shopping-bag`, `leaf`, `coffee`, `dumbbell`, `camera`, `building-2`. Pesan ≈ 0,7 KB en total y se entienden sin leer. Se dibujan con cajas y bloques (`symbols2`) y `--art-lh`.
- El letrero es `<span class="art" aria-hidden>` dentro del enlace de la referencia; al pasar o enfocar, el borde `┌─┐` pasa a `╔═╗` y el emblema a `--accent-text`.
- **La puerta**: al final de la calle, un arco de bloques (la Puerta del Conde) sobre el enlace a la galería.

**Contenido.** `h2` lettering «Referencias». **Hasta seis** referencias construidas (`builtRefs()`; primero una por tipo P/R/C/T/A, como hace `HeroCards`): nombre (enlace, 24 px 700), sector · tipo (`--muted`). La lista crece sola cuando se construyan más. Al final: `[ Ver las {n} referencias ]` (n = referencias publicadas, no las 14 previstas) y el sello «Ejemplos con datos ficticios.» (04 §3: es la honestidad visible y no se retira). Cada elemento es **un** enlace a `/referencias/<slug>/`.

```text
  █▀▀▀▄ █▀▀▀▀ █▀▀▀▀ █▀▀▀▀ █▀▀▀▄ █▀▀▀▀ █▄  █ ▄▀▀▀▀ ▀▀█▀▀ ▄▀▀▀▄ ▄▀▀▀▀
  █▀▀█  █▀▀   █▀▀   █▀▀   █▀▀█  █▀▀   █ ▀▄█ █       █   █▀▀▀█  ▀▀▀▄
  ▀   ▀ ▀▀▀▀▀ ▀     ▀▀▀▀▀ ▀   ▀ ▀▀▀▀▀ ▀   ▀  ▀▀▀▀ ▀▀▀▀▀ ▀   ▀ ▀▀▀▀


   │    ┌───────────────┐
   │    │  ╻ ╻ ╻ ╭╮     │
   │    │  ┗┳┻┳┛ ││     │ Fogón
   ┼╞═╡ │    ┃   ││     │ Restaurante · Reservas y pedidos
   │    │    ┃   ││     │
   │    │    ╹   ╹╹     │ · · · ·
   │    └───────────────┘
   ┼    ┌───────────────┐
   │    │   ▄▄███▄▄     │
   │    │  ▟███████▙    │ Cimiento
   │╞═╡ │ ▟█████████▙   │ Constructora · Presencia
   ┼    │ ▀▀▀▀▀▀▀▀▀▀▀   │
   │    │               │ · · · ·
   │    └───────────────┘
   │    ┌───────────────┐
   ┼    │ ╭─────────╮   │
   │    │ │ ▚▚  ▚▚  │   │ Nodo
   │╞═╡ │ │ ▚▚  ▚▚  │   │ App / SaaS · App
   │    │ │  ▚▚▚▚▚▚ │   │
   ┼    │ ╰─────────╯   │ · · · ·
   │    └───────────────┘
   │
   │     ▄▄▄▄▄▄▄▄▄▄▄▄
   ┼     ██▀▀▀▀▀▀▀▀██
   │     ██ ╭────╮ ██     [ Ver las 14 referencias ]
   │     ██ │    │ ██
   │     ▀▀▀▀▀▀▀▀▀▀▀▀     Ejemplos con datos ficticios.
   ┼
```

**Interacción.** Enlace por casa (hover, foco visible ≥ 3:1, objetivo ≥ 44 px de alto). La puerta lleva a `/referencias/`. Sin imágenes en la portada: cero peticiones, y `HeroCards` se retira.

**Móvil.** Una columna; la calle a 2 celdas del borde; el letrero de 13×7 a la izquierda y el texto a su derecha. **Reducido:** igual.

### S3 · El despliegue (aire, 100 svh, escenario → tira, φ 24° → 90°) — el momento firma

Sin texto. La cámara baja la mirada y **la ciudad se abre como un plano**; después **se enciende como un circuito**. Es la misma función del §2.3 con φ y `κ` distintos. Los tres primeros cuadros son el compositor real (`cam.mjs`, Anexo A.2) a 78×20:

```text

 ·                                                       ·                  ║
       *                   ·  ·                               ·    ·        ║
            · *             *·  ·                                           ║*
                                                      ·    *                ║
            ·                            ·                                 ·║
                       ·                                                    ║
                                       ·            ·      ▝▀▀▀▀            ║
      ▄▄▄▄▄                                            ·   ███▐▓     ·      ║
▄▄▄ ▐██▝▀▀▀▀▀▓                                            ▗███▐▓            ║·
▀▀▘▓▐████▗▄▄▄▄▄▄▄▄▄▄▖   ▄▟░▄▄▄▄▖  ▗▄     ▄▄▄▄▄▄▄        ▄▝▀███▐▓▛▘▌         ║
▄▄▄▄▄▄▄▖▐███▀▀▀▀▘▓▀▓▓▗▟▙▄▄▄▄▄▖▗▄░░░▙▄▄▄▄▝▀▀▀▀▀▀▀▓▌▀▓    ██████▐▓▓▓▌        *║
█▀▀▀▀▀▓▌▐███████▓▓█▓▓███████▐▓▐██████▄▟░░░░▗▟░░░░░░░░▄▄▄▄▄▖███▐▓▓▓▌·     ▄▄▄▄▄
█████▐▓▌▐███████▓▓▗▄▙▄▄▄▄▄▖█▐▄▄▄▄██████████████████████▝▘▓▌███▐▛▓▛▘    ▐▀▀▀▀▀▀
 ·▝▀▀▝··▝▀▀▀▀▀▜█▀▘██████▐▛▘▝▀▀▀▀▀▀▀▓▀███████████████████▐▓▌···▀▀·    ~~▐████▗▝
                        ···▝▀▀▀▀▀▀▀··▀▀▜███▀▀▜██████████▐▛▘··          ▝▀▀██▐█
                       ~                          ········    ~    ~        ▐█
                                    ~   ~               ~
 ~                     ~                   ~ ~ ~
                ~ ~       ~                 ~ ~       ~
                                                                         ~
```
*φ = 14°, objetivo z0 = 22: el skyline de la portada (con el haz del Faro a la derecha).*

```text

██▝▀▀▀▘▗░░░░░░░░░▘▀▐░░░░░░░▛▐███▐▌▄▄▄█▐▛ ▟░░░░░░▘  ▟░░░▙▄▄▖  ▄▄▄▄▄▄▄▄ █▀▀▀▀▀▀▀
██████▐▐█▝▀▀▀▀▀▘▘▗▙▄▄▄▄▄▄▄▀▐░░▙▄▄▄▄▄▄▄▝·▐██▀▀▀▀▘▘·▝▀▀▀▀▀▜▘▌ ▝▀▜░░░░░▘ ███████▐
░░░▄▄▖·▐███████▓▌▝▀▜░░░░░▘▗▜░░░░░░░░░░░░▌░░░░▄▖▘··▝▀▀████▛▗░░░░░░▄▖█▓ ███████▐
▀▀▀▜▛▘▄▄▄▄▄████▓·███████▐▓▐███████▝▀▀▀▀▘▌▜░░░▛▌▟▄▄▄▄▄▄▄▙··▝▀▀▄▀▀▀▀▓▜▘·███████▐
░░░▘▘▟░░░░░░░▛█▛·███████▐▓▐████████████▓▌▀▀▀█▝▝▀▀░░░░░▘▘ ·██▐░░░▛▐▓·▗░░░░░▙▖▀▘
▀░▌▌·███████▀▓▀··▀▀▀▀███▐▗▄▄▄▄▄▄▖██████▓▌    ·████████▓▘··▀▗████▓▐▘▄▄▄▖░░░▛▛
██▛··████████▓▄▖░░░░░░▛·▗░░░░░░░▘██▄▄▄▄▄▄▄▖ ·▄▄▄▄█████▓·▐░▗░████▓░░▘░░░░░▘▝
▄▖··▄▄▄▄▄▄▄▀█▟░░░░░░░▛▘·▐████▀▀▘▛·▝▀▜░░░░▛▌·▟░░░░░░░▌█▘·▀▀▀░████▓░▘▌▀▀▀▀▘▛
▌ ·▟░░░░░░▌▗▄▄▄▄▄▄▄▜▛▓·▟░░░░░░░▖·▟░░░▙▄▄▄▖▗░░░░░░▙▖▀▓····▝██████▓▐▓▌████▐~
▌▗░░░░░░▖▀▗░░░░░░░░▘▐▛▝▀▀▀▀▀░░▛▌▝▀░░░░░░▌▌▀▀▀▀░░░░▘█▛··   ██████▛▐▓····~  ~~
▘▀▀▀▜░░░▘·▐████▝▀▀▘▓▝·▐███████▓▘████████▓▄█████▗▄▄▄▄▄▄▖   ▀▀▜▝▀▀▘▐▘    ~   ▗▄▄
·██████▐▛·▐███████▐▛·▟░░░▄▄▄▖▀▘▗▖███████▟░░░░░░░▛░░░░░░░░░░░░▌·····     ~ ▗▒▒▒
··▀▀▀▀▀▝··▐███████▐▘▝▜░░░░░▛▘·▗░░░░░░▛·▗▀▀▀▀▀▀░▛▓▀▀▀▀▀▜░░░░░▘▌        ~   ▐███
        ·········▀▘·▝▀▀▀███▌··▀▀▀▀▀▀▜▘·▐███████▐▓██████████▐▓▘       ~~ ~ ▐███
                         ······▝▀▀▀▀▀ ·▐███████▐▘██████████▐▛  ····
                       ~             ·· ······▝▘··    ▝▀▀▀▀▝       ~~  ~
                                    ~   ~             ··········· ~
 ~                     ~                   ~ ~ ~                 ~ ~~
                ~ ~       ~                 ~ ~       ~
                                                                         ~
```
*φ = 34°, z0 = 16: la ciudad ya enseña sus techos (`░`); el horizonte se aleja; el cielo casi ha salido de cuadro.*

```text

░░ ·▐░░░░░░░▛······▀▀▀▀▘·██████▌██████▌    ··██████▀▀▌·▐░░░▖▐░░▙▖▐░░░░░░▌~
░▌··▝▀░░░░░░▌·▗░▄▄▄▄▄▖ ·▐░░░░░░▛▀▀▀▀▀▜···  ··████████▘·░░░▗░▟░░░▘░▛░░░░░▌~ ~
█▘··████████▌·▐░░░░░░▌··▟░░░░░░▌··▐░░░░░░▌··▐░░▄▄▄▄▄▖··▀▀▀▐░████▌░▌█████~ ~~~
····▝▀▀▀▀▀▀▀▘▗▀▀▀▀▀▀▀▘··▀▀▀▀▀▀▀▌··░░░░░░░▌··░░░░░░░░▘··  ·░░████▌░▛···▝▀~ ~
▌··▐░░░░░▄▖··▐░░░░░░░▌·▗▄▄▖▀▀▀▜ ··██████▀▘··▝▀▀▀▀▀▀▀▘·    ██████▌▀▌   ~~
▘··▐░░░░░░▌··▟░░░░░░░▘·▐░░░░░░░▌·▐░░░░░▙▄▖·▟░░░░▙▄▄▖··    ███▀▀▀██
▖··▀▀▀▀▜░░▘··▀▀▀▀▀▀▀▀▌·░░░░░░░░▌·░░░░░░░░▌·░░░░░░░░▌········ ··▝▀▀    ~  ~~ ▗▄
▘·▐▙▄▄▄▄▄▖··▐░░░░▄▄▄▖··██▝▀▀▀▀▀·▗▀▀▀▀▀▜░▛▘▝▀▀▀▀▜░░▛▘·       ········· ~ ~   ▒▒
▌·▟░░░░░░▘··░░░░░░░░▌···▝▀▀▀▀▀▀·▝███████▐·▐█████▐░░▙▄▄▄▄▄▄▄▄ ··      ~ ~ ~ ▗▒▒
▘·░░░░░░░▘·▗▀▀▀▀░░░▛▌·▟░░░░░▙▖··▄▄▄▄▄·····░░░░▙▄▄▄░░░░░░░░░░░░▘        ~  ~▐██
··██████▐ ·▐███████▐··░░░░░░░ ··░░░░░░░▘·▗░░░░░░░▛░░░░░░░░░░░░▌        ~   ▝▀▀
···········▝▀▀▀▀▀▀▜▝·▝▀▀▀▀▀▜▌··▗░░░░░░▛ ·▝▀▀▀▜░░░▌█▝▀▀▀▀▀▀▀▀▜▌······~   ~
         ··   ·············▀▘··▝▀▀▀▜▀▀▘··▐███████▝███████████▝        ~
                             ···············▀▀▀▀▀▘·       ▝▀▀▘       ~~ ~
                                                ·················
                       ~                                         ··~~  ~
                                    ~   ~               ~               ~
 ~                     ~                   ~ ~ ~
                ~ ~       ~                 ~ ~       ~
                                                                         ~
```
*φ = 58°, z0 = 11: casi plano; los frentes han encogido (`cos φ`), quedan huellas; entra el Ozama (`~`) y la cruz del Faro asoma abajo a la derecha.*

```text
································································  ~   ~
 ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·  ~~~ ~
 ·████████ ·████████ ·████████ ·████████ ·████████ ·████████ ·  ~
 ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·  ~~ ~
 ·         ·         ·         ·         ·         ·         ·    ~   ~
································································ ~   ~    ▒▒▒
 ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·  ~~  ~ ~   ▒▒▒
 ·████████ ·████████ ·████████ ·████████ ·████████ ·████████ ·    ~~  ~   ▒▒▒
 ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·▀▀▀▀▀▀▀▀ ·    ~  ~    ▒▒▒
 ·         ·         ·         ·         ·         ·         ·            ▒▒▒
································································~ ▒▒▒▒▒▒▒▒▒█▒▒
 ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·▄▄▄▄▄▄▄▄ ·  ~ ▒▒▒▒▒▒▒▒▒█▒▒
 ·████████ ·████████ ·████████ ·████████ ·████████ ·████████ ·    ~   ~   ▒▒▒
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀~~~~~~~~
                - -        ~ ~          ~ -             ~       ~           ~
       -         ~       ~       -                          ~       ~       ~
~         ~   ~ -              ~ ~            -~
~                           ~       ~-                              ~
            ~              ~                -
                          ~                          ~~   ~    ~
```
*φ = 90°, κ = 0: el plano. Manzanas (`▄█▀`), calles (`·`), el río a la derecha y la **planta en cruz** del Faro (`▒`, con `█` en el cruce).*

```text
─▓─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼║─  ~   ~
 ▓┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │║ ~~~ ~
 ▓├ ▒▒▒▒ ┤ │├ ░░░░ ┤ │├ ░░░░ ┤ │├ ░░░░ ┤ │├ ▒▒▒▒ ┤ │├ ▒▒▒▒ ┤ │║ ~
 ▓└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │║ ~~ ~
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │         │         │         │║   ~   ~
─┼─────────┼─────────┼─▓───────┼─────────┼─────────┼─────────┼║─ ~   ~    ▒▒▒
 │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌▓┬┬┬┬┬┐ │╔══════╗ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │║ ~~  ~ ~   ▒▒▒
 │├ ░░░░ ┤ │├ ▒▒▒▒ ┤ │├▓▒▒▒▒ ┤ │║ ▓▓▓▓ ║ │├ ░░░░ ┤ │├ ▒▒▒▒ ┤ │║   ~~  ~   ▒▒▒
 │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │└▓┴┴┴┴┴┘ │╚══════╝ │└┴┴┴┴┴┴┘ │└┴┴┴┴┴┴┘ │══════════  ▒▒▒
 │         │         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │         │║           ▒▒▒
═══════════════════════════════════════════▓══════════════════╬─~ ▒▒▒▒▒▒▒▒▒█▒▒
 │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │┌▓┬┬┬┬┬┐ │┌┬┬┬┬┬┬┐ │║ ~ ▒▒▒▒▒▒▒▒▒█▒▒
 │├ ░░░░ ┤ │├ ░░░░ ┤ │├ ▒▒▒▒ ┤ │├ ▒▒▒▒ ┤ │├▓░░░░ ┤ │├ ▒▒▒▒ ┤ │║   ~   ~   ▒▒▒
═══════════════════════════════════════════█═══════════════════~~~~~~~~
                - -        ~ ~          ~ -│            ~       ~           ~
       -         ~       ~       -         ┼                ~       ~       ~
~         ~   ~ -              ~ ~         │  -~
~                           ~       ~-     ┼                        ~
            ~              ~               │-
                          ~                ┼         ~~   ~    ~
```
*φ = 90°, κ = 1: el mismo plano hecho circuito. Manzanas → chips (`┌┬┬┐ ├ ▒ ┤ └┴┴┘`), calles → pistas (`─ │ ┼`), dos buses (`═` Calle El Conde, `║` Calle Las Damas), el chip mayor (`╔═╗`) es la Catedral. Una ruta de luz (`▓`) baja hacia el sur.*

**Guion por progreso `u` de la sección** (medido desde que S3 entra hasta que sale; claves de §2.3):

| u | φ | z0 | κ | Qué ocurre |
|---|---:|---:|---:|---|
| 0,00–0,10 | 24→30° | 18→16 | 0 | El horizonte se aleja (`zFar` crece); las estrellas se apagan (paleta 24–29 → T0); el haz se acorta |
| 0,10–0,45 | 30→62° | 16→10 | 0 | Los frentes encogen (`cos φ`), asoman los techos; entran la costa, el río y las calles como `·` |
| 0,45–0,60 | 62→90° | 10→4 | 0 | Solo huellas; el Faro se vuelve cruz; aparece el marco de carta (neatline) |
| 0,60–0,85 | 90° | 4 | 0→1 | **Circuito**: calles `·` → `─│┼` por orden de distancia al Malecón; manzanas → chips con pines; buses `═ ║` |
| 0,70–1,00 | 90° | 4 | 1 | **Pulsos de luz** T13–T15 recorren las pistas hacia el sur (con cola de 4 tonos); al llegar al Malecón salen al mar |
| 0,75–1,00 | — | — | — | El mundo pasa de velocidad 0 a 1× (tira): sin salto (§2.4) |

**Técnica del circuito.** Cada manzana `i` tiene `κᵢ = clamp(1,3·κ − 0,3·dᵢ)`, con `dᵢ` la distancia normalizada al Malecón: a `κᵢ > 0` se superpone (`overlay`) el chip sobre la huella; a `κᵢ > 0,5` salen los pines. Los pulsos **no dibujan glifos nuevos**: suben el tono de las celdas de la pista (05 §2.5) según un parámetro de recorrido; el glifo no cambia, así que no hay parpadeo ni riesgo de destellos (2.3.1). Coste del cabeceo: §2.3; coste del circuito: solo `overlay` de ≤ 60 chips y ≤ 400 celdas de pulso por cuadro.

**Lupa.** En el plano la lupa revela **topónimos reales** (Calle Las Damas, Calle El Conde, Parque Colón, Fortaleza Ozama, Alcázar de Colón, Catedral Primada, Puerta del Conde, Río Ozama, Malecón) a doble resolución; son decoración `aria-hidden` (no se anuncian) y desaparecen con `prefers-reduced-motion`.

**Cámara B.** Si en M2 gana la perspectiva (§2.5), este mismo guion se ejecuta con las claves de la tabla de §2.5 en vez de φ, z0 y ψ: el orden de los acontecimientos, `κ` y el paso a la tira no cambian. Con B el horizonte sube y sale de cuadro en lugar de alejarse (`zFar` deja de existir).

**Móvil.** ≤ 40 cajas; sin guiñada (ψ = 0, se ahorra una rotación por vértice); manzanas de 6 columnas. **Reducido:** no hay cabeceo: dos cuadros estáticos (φ = 14° arriba y φ = 90° con `κ = 1` abajo) separados por una **costura de luz** de 4 filas (06 §4.3). Es la versión «hermosa por construcción»: el mismo mundo, dos ángulos.

**Presupuesto.** ≈ 1 ms por cuadro tras cachear suelo y cielo (medido sin optimizar: 1,4–1,9 ms a 40°, §2.3); tier `low` a 24 fps durante el despliegue; el control adaptativo baja de nivel si la mediana de 45 cuadros supera el 45 % del intervalo (06 §4.2).

### S4 · La salida (aire, 40 svh, tira)

Sin texto. El Malecón (muro `▀` T6 con luz de borde y farolas `·`) cruza la pantalla; debajo empieza el mar. Los pulsos del circuito salen por aquí y **el cable** nace: polilínea de Beck (rectas y diagonales de 45°) que baja hacia la primera isla, T5 punteada y, hasta donde llegó el scroll, T9 continua con la cabeza en T13. Aparece el marco de carta en movimiento: las marcas `┼` del borde bajan con el scroll. El agua cicla la paleta 16–23 (0,16 ciclos/s, solo mientras hay energía).

### S5–S8 · Las cuatro islas (150 svh cada una, tira, φ = 90°)

**Cuatro lugares, un mismo oficio.** Todas las islas se dibujan en planta, con el mismo terreno y el mismo achurado, y cada una anima **el verbo de su servicio** con lenguaje cartográfico propio. Ninguna lleva texto ni cifras (regla 10). Se alternan a derecha e izquierda del texto en escritorio (nada de rejilla de tarjetas iguales); en móvil, la isla va arriba y el texto debajo.

**Terreno común** (probado, Anexo A.5):

```formula
hgt(x, y) = (1 − r) + 0,8·(fbm(x·.10, y·.20, 3, semilla) − .5) + 0,12·k·(fbm(x·.3, y·.6, 2, semilla+5) − .5)     # r = distancia elíptica al centro
tierra si hgt > 0,10:  gradiente ∇h (eje y a media escala: la celda es 1:2), m = |∇h|·9
  m > 0,55           → glifo por dirección de la pendiente:  - (horizontal)  \  |  /      ← achurado (Lehmann)
  0,30 < m ≤ 0,55    → : o · alternos
  hgt > 0,62, m < 0,5 → ▒ (cumbre)
costa  hgt ∈ (0,02; 0,10]  → ~ - alternos (línea de costa)
mar    hgt ∈ (−0,10; 0,02] → ~ dispersos (anillo de sonda); más lejos, espacio con 1,5 % de ~
```

Las islas con edificios (A, B, D) llevan un **claro plano** (`·`) donde van las construcciones; la isla C conserva el achurado completo. Terreno = celdas del `Grid` horneadas una vez por tamaño (presupuesto de horneado de 05 §3.8: ≤ 16 ms en el A07, sin medir); por cuadro solo cambian los sprites y los tonos.

**Contenido común** (DOM, en este orden, de 04 §2.1–2.4 tal cual; ES y EN): `h2` en lettering (con el nombre exacto del catálogo de WhatsApp) → **promesa** (21–26 px, 700) → **ledger** de cuatro filas con regla: **Incluye** (lista con marcadores de árbol `├─ / └─`, 5–7 líneas), **Para quién**, **Necesitamos**, **Resultado** → **datos locales** (3, con «Verificado 30 sep 2026» en `--muted`) → un solo botón `[ Escribir por WhatsApp ]` (mensaje prellenado con el servicio, `waService()`) y el correo como segundo enlace. Etiquetas `dt` en EN (propuestas por mí, [C]): *Includes*, *Who it's for*, *What we need*, *Outcome*. Orden de servicios de 04 §4 (Web → Automatización → Marketing → Soporte). Las líneas marcadas `[CONFIRMAR]` en 04 (apps nativas, pasarela con e-CF, API de WhatsApp, agente de IA, Google Ads, SLA…) **no salen** hasta que Giancarlo las apruebe.

| id | h2 ES | h2 EN | Promesa ES | Promesa EN |
|---|---|---|---|---|
| `web` (ancla `#servicios`) | Desarrollo web y apps | Web and app development | Tu web, rápida y lista para vender por WhatsApp. | Your website: fast, and built to sell on WhatsApp. |
| `automatizacion` / `automation` | Automatización e IA | Automation and AI | Que WhatsApp responda, agende y avise por ti. | Let WhatsApp answer, book and notify for you. |
| `marketing` | Marketing digital y redes | Digital marketing and social media | Que te encuentren, te escriban y te compren. | Get found, get messaged, get paid. |
| `soporte` / `it` | Soporte e infraestructura IT | IT support and infrastructure | Correo, redes y equipos que no te frenan. | Email, network and devices that keep you moving. |

```text
 █▀▀▀▄ █▀▀▀▀ ▄▀▀▀▀ ▄▀▀▀▄ █▀▀▀▄ █▀▀▀▄ ▄▀▀▀▄ █     █     ▄▀▀▀▄
 █   █ █▀▀    ▀▀▀▄ █▀▀▀█ █▀▀█  █▀▀█  █   █ █     █     █   █
 ▀▀▀▀  ▀▀▀▀▀ ▀▀▀▀  ▀   ▀ ▀   ▀ ▀   ▀  ▀▀▀  ▀▀▀▀▀ ▀▀▀▀▀  ▀▀▀

 ╭─ pozo de lectura, tope T6, máx. 62 ch ──────────────────────────╮  ┌─ zona de arte: isla A ────┐
 │ Tu web, rápida y lista para vender por WhatsApp.                │  │                           │
 │ ─────────────────────────────────────────────────────────────── │  │                           │
 │ Incluye     ├─ Diseño propio, pensado primero para el celular   │  │                           │
 │             ├─ Sitio en español, en inglés o en ambos           │  │ el cable llega por arriba │
 │             ├─ (… siete líneas en total) …                      │  │ y sale por abajo          │
 │             └─ Publicación con HTTPS, respaldo y accesos tuyos  │  │                           │
 │ ─────────────────────────────────────────────────────────────── │  │                           │
 │ Para quién  Negocios con o sin local, marcas personales…        │  │                           │
 │                                                                 │  │   (isla, 28 filas)        │
 │ ─────────────────────────────────────────────────────────────── │  │                           │
 │ Necesitamos Logo y colores (o los definimos juntos)…            │  │                           │
 │                                                                 │  │                           │
 │ ─────────────────────────────────────────────────────────────── │  │ el scroll la construye y  │
 │ Resultado   Una URL en vivo, medida en velocidad…               │  │ termina al 40 % de la     │
 │                                                                 │  │ altura de la pantalla     │
 │ ─────────────────────────────────────────────────────────────── │  │                           │
 │ + Si un dominio .do vence, queda suspendido 30 días…            │  │                           │
 │   Verificado 30 sep 2026                                        │  │                           │
 │                                                                 │  │                           │
 │ [ Escribir por WhatsApp ]      hola@gaya.com.do                 │  │                           │
 ╰─────────────────────────────────────────────────────────────────╯  └───────────────────────────┘
```
*Maquetación de un servicio en escritorio: el pozo de lectura (izquierda) y la zona de arte (derecha). En la isla B y en la D, izquierda y derecha se invierten.*

```text
┌─ móvil 390 px ─────────────────────┐
│ lettering S (quad, 3 filas):       │
│ ▌ ▌▛▀▘▛▀▖ ▚▗▘ ▞▀▖▛▀▖▛▀▖▞▀▘         │
│ ▙▚▌▛▘ ▛▀▖  ▌  ▛▀▌▛▀ ▛▀ ▝▀▖         │
│ ▘ ▘▀▀▘▀▀   ▘  ▘ ▘▘  ▘  ▀▀          │
│                                    │
│ ┌─ zona de arte: isla A ─────────┐ │
│ │                                │ │
│ │                                │ │
│ │                                │ │
│ │   (isla, 9 filas mín.)         │ │
│ │                                │ │
│ │                                │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│ Tu web, rápida y lista             │
│ para vender por WhatsApp.          │
│                                    │
│ Incluye                            │
│ ├─ Diseño propio…                  │
│ └─ (7 líneas)                      │
│                                    │
│ Para quién                         │
│ Negocios con o sin local…          │
│                                    │
│ Necesitamos / Resultado            │
│                                    │
│ + Datos locales (3)                │
│                                    │
│ [ Escribir por WhatsApp ]          │
│                                    │
└────────────────────────────────────┘
```

**Guion de scrub común.** `u` = progreso de la zona de arte: 0 cuando entra por abajo de la pantalla; **1 cuando su centro llega al 40 % de la altura** (el visitante lee el texto con la isla ya terminada). `t = settle · easeOut(u)`; nada avanza solo. Al enfocar o pasar el ratón por el botón de WhatsApp, la isla da un **latido** de 0,8 s (cada una el suyo, abajo): estado visible, sin texto.

#### S5 · Isla A «El Local» — Desarrollo web y apps (verbo: construir)

*Lenguaje: plano de parcela y catastro.* Un pueblo de manzanas bajas; una parcela que se construye y se abre; un pin con la dirección.

```text
      ~
             ~
          ~     ~  ~  ~  ~     ~  ~        ~  ~
               -~ ~········-~-~-~-~-···-~-~-·······-
      ~  ~-~-~···············(@)····················-
         -·····▄▄▄▄▄··▄▄▄▄▄·· ╵ ▄▄··▄▄▄▄▄··▄▄▄▄▄·····-
        ~ -·:··▀▀▀▀▀··▀▀.·:·.▀▀▀▀▀·.·:·.▀··▀▀▀▀▀·····:·~-~ ~
          ~-················╭────╮······················~-~-
       ~ ~·~-··▄▄▄▄▄··▄▄▄▄▄·│▄▄▄▄│··▄▄▄▄▄··▄▄▄▄▄····::-:···~ ~
         -~-~··▀▀▀▀▀··▀▀▀▀▀·╰─▄▄─╯··▀▀▀▀▀··▀▀▀▀▀····~-~-  ~-
         ~  ~~·········.:.:.:.:.:.·················~- ~  ~  ~
              ~▄▄▄▄▄··▄▄▄▄▄··▄▄▄▄▄··▄▄▄▄▄··▄▄▄▄▄····~
              ~▀▀▀▀▀··▀▀▀▀▀··▀▀▀▀▀··▀▀▀▀▀··▀▀▀▀▀- ~  ~
            ~    -···························-         ~
                ~ -~-~-~-~-~-·::·|||||||||\~
                             -·-~
                           ~  ~
```

| u | Qué ocurre |
|---|---|
| 0–0,20 | La costa se dibuja por **cabeza y estela** (perímetro celda a celda, T15 → T6) |
| 0,20–0,50 | Calles y manzanas aparecen por **disolución** (ruido azul contra umbral creciente) |
| 0,50–0,85 | La parcela: **contorno** `╭────╮` (cabeza T15) → **muros** `│▄▄▄▄│` por filas → **puerta** `▄▄` que se enciende (T12) |
| 0,85–1,00 | El **pin** `(@)` cae en tres pasos desde tres filas arriba y suelta tres anillos (`.·:·.` que crecen); el puerto se enciende y el cable pasa de T5 a T9 |

*Latido:* el pin rebota y suelta un anillo. *Sprites:* manzana `▄▄▄▄▄ / ▀▀▀▀▀`, parcela de 3 filas, pin de 2 filas. *Móvil:* 3×3 manzanas. *Reducido:* estado final.

#### S6 · Isla B «El Cruce» — Automatización e IA (verbo: encaminar)

*Lenguaje: cartografía ferroviaria* (la vía se dibuja con ticks `─┼─`, como en los mapas topográficos) y patio de maniobras. Nada de red neuronal ni robots.

```text
       ~
              ~             ~
                                                           ~
           ▄▄   ▄▄-·····-~-~~  ~ ~-····~-~-~-~~
         ───┼───┼───┼───┼╮···-~················-
            -~···········│·····················~-~ ~
           -~············╰───┼┬···▄▄···············-~-~
           ~···╭───╮··········├───┼───┼───┼───┼·········-~-~
            ~-·│╲  │··········│··········▄▄·············~-
          ~ -~·│ o │··········├───┼───┼───┼───┼········~- ~
  ~        -~-·╰───╯··········│····▄▄···········╭─╮··-~-
  ~      ~ ~-~················╰───┼───┼──·······│▄│··~-~-~
          ~-~-~·································╰─╯-~          ~
  ~     ~~-~-~-~·························~-~~  ~  ~
          ~-~-  ~-//||\||-~-~-~-~-~-         ~     ~
          ~  ~  ~ -~-~~  ~  ~  ~  ~  ~
```

| u | Qué ocurre |
|---|---|
| 0–0,15 | La costa |
| 0,15–0,40 | Las vías se tienden desde la entrada (cabeza T15) con sus ticks; se abren en abanico hacia tres destinos |
| 0,40–0,90 | **Cuatro vagones** `▄▄` entran uno a uno; el **plato giratorio** (`╭───╮`, con un puente `╲` que gira entre `│ ╲ ─ ╱`) decide la vía de cada uno. **«Aprende»**: el primer vagón hace dos dudas del plato, el segundo una, los demás ninguna |
| 0,90–1,00 | El último vagón toma el **apartadero** hacia la casa (`╭─╮ │▄│ ╰─╯`): se enciende (T12). Es el «traspaso a una persona» de 04 §2.2 |

*Latido:* el plato gira al apartadero. *Móvil:* dos vías de destino en vez de tres. *Reducido:* estado final (los cuatro vagones ya ubicados).

#### S7 · Isla C «La Señal» — Marketing digital y redes (verbo: señalar)

*Lenguaje: carta portulana* (rumbos desde el faro, símbolo de faro, carriles de navegación). Es la isla más luminosa: sus tonos altos (T11–T14) solo aparecen fuera de pozos.

```text
           .                  ·                  .
             .         .      ·      .         .       : :
   ··          .        .     ·     .        .       ::    ~  .~
 .~. ····<>      .       . ~  ·    .       .      = :~   .···
      .  ····      .          ·          .      ==    ·:·:·
        .  . ···  ~  .    .   ·   .    .    ▒▒=  .··:::
              . ···<>  .   ~- ~      .~  ▒▒ . =·===
                   ····  \\|||||~-     ▓▓.▒<▒▒·          :
                      -·::\\╭─╮|////▓▓ ▓▓▒·· ▒= === ::::
··~ ·· ··· ·· ··· ·· \\\\\::│@│////:▓▓:▓▓▒▒ ▒·· ·· ··· ·· ··· ··
                   ~\\\---::╰─╯----::--
                   ----:·:://||\\\---::· .               ~
              . . ~~/<>·||//|||||\\\\~ ~····<>.
        .  .      ···-~-~-/|||||||\-   .   ····  .  .       ~
      .        ··· .      ~   · ~        .     ···    .
 . .       ····  .       .    ·    .       .      ··<>   . .
       ····<>  .    ~   .     ·     .        .       ····     .
     ··      .         .      ·      .         .         ··
           .                  ·                  .
         .            .       ·       .            .
```

| u | Qué ocurre |
|---|---|
| 0–0,20 | La isla con su achurado completo y el faro `╭─╮│@│╰─╯` |
| 0,20–0,60 | **El haz gira** (ángulo = 2π·0,75·u′) y, a su paso, aparecen los **rumbos** (16, uno de cada cuatro punteado) que quedan en T4; los **cuatro carriles** de barcos se dibujan en orden de llegada del haz |
| 0,60–1,00 | Los barcos `<>` avanzan por sus carriles hacia el puerto; al juntarse, el trazo engorda (`·` → `:` → `=`, orden de Strahler); al llegar, un anillo `( )` sale del puerto |

*Latido:* el haz da media vuelta rápida (0,6 s). *Móvil:* 8 rumbos, 3 carriles. *Reducido:* haz fijo en el ángulo `settle`, barcos ya en el puerto.

#### S8 · Isla D «La Planta» — Soporte e infraestructura IT (verbo: sostener)

*Lenguaje: diagrama unifilar* (línea de alta tensión con postes `+`, subestación `[#]`, bloque con batería). Ilustra el «plan para los apagones» de 04 §2.4 (dato local con fuente de prensa, grado B): el dibujo no afirma cifras ni tiempos.

```text
        ┼                                                  ~
        │                 ~                      ~       [▓]
        ┼                                        ~        ·
        │                           ~-·-~-                ·
        ┼       ~  ~[#]···-~-~-~-~-·········-~-  ~        ·
    ~   ╰+──+──+──+─···─────────────┬···········~-~       ·
         ~  -~·····································~-~~  ~·
           -~··········································-~-·
        ~  ~-~ · · ··· · · ···o·o·o···o·o·o···o·o·o········~
             -~-··························.···.··········:~-
          ~  ~-~-·······················.········.·······:-~
             -o-o·o···o·o·o···o·o·o··.o·o·o···o·o·o.·····-~-
         ~  ~~-·····················.···╭──────╮····.··~ ~
               -························│▐▌▐▌▐▌│····~-
           ~     ~ ··· · · ···o·o·o.··o·│ (o)  │o·o~ .
                 -~···~-~··-~-~-·-~-.-~-╰──────╯    .     ~
         ~         ~  ~  ~  ~  ~  ~  .  ~  ~    ~  .
                                        .        .
                                          .   .
                 ~
```
*Cuadro a mitad de scroll (u ≈ 0,55): el apagón ha apagado dos manzanas de la izquierda; el bloque de la derecha, con su batería y su router `(o)`, conserva su círculo de luz; el islote de arriba a la derecha es la copia fuera del sitio, unido por el cable.*

| u | Qué ocurre |
|---|---|
| 0–0,20 | La isla; la línea de alta tensión baja desde el cable hasta la subestación |
| 0,20–0,40 | Todas las farolas `o` encendidas |
| 0,40–0,70 | **Apagón por zonas**: desde el borde, las farolas pasan a `·` y luego a vacío; el bloque resistente mantiene su círculo y su batería `▐▌▐▌▐▌` baja de T11 a T8 |
| 0,70–1,00 | **Restauración** desde la subestación (onda inversa); la batería se recarga; la bóveda del islote `[▓]` parpadea **una vez** al sincronizar (copia fuera del sitio) |

*Reglas de destellos (2.3.1):* cada farola cambia por su cuenta, ninguna oscilación global; la transición dura ≥ 240 ms por celda; el área que cambia a la vez es < 341×256 px. *Latido:* un mini-apagón de 0,8 s en un solo sector. *Móvil:* 3×3 manzanas y sin islote. *Reducido:* estado final (todo encendido).

### S9 · Proceso (`#proceso` / `#process`, 100 svh, tira)

**Arte.** Mar abierto, tranquilo. El cable sigue siendo el de la ruta, pero aquí **sale del lienzo y pasa al DOM**: la línea del proceso es arte pegado al texto (`ol` con pseudo-elementos), para que las estaciones queden exactas aunque el fondo vaya un cuadro por detrás. Dibujo de **Beck**: rectas a 0° y 90° y una diagonal de 45° (en pantalla, 45° = 2 columnas por fila), estaciones `(o)` a paso uniforme. Las estaciones se ordenan de izquierda a derecha en escritorio y de arriba abajo en móvil.

```text
  (o)───────────────(o)───────────────╲
  Hablamos por     Propuesta por        ╲
  WhatsApp         escrito · 24–48 h      ╲
                                            ╲───────(o)─────────────────(o)
                                                  Construimos         Entregamos
                                                  con avances         y acompañamos
```

```text
   │
  (o)  Hablamos por WhatsApp
   │
   │
   │
   │
  (o)  Propuesta por escrito
   │   24–48 h
   │
   │
   │
  (o)  Construimos con avances
   │
   │
   │
   │
  (o)  Entregamos y acompañamos
   │
   │
   │
```

**Contenido.** `h2` lettering «Proceso» (EN «Process»). Una `ol` de cuatro líneas (04 §2.5): 1 *Hablamos por WhatsApp* · 2 *Propuesta por escrito* con la etiqueta `24–48 h` (`brand.json › commitments.proposalHours`, `[CONFIRMAR]`) · 3 *Construimos con avances* · 4 *Entregamos y acompañamos*. Sin descripciones (regla del dueño); solo un plazo, el que existe.

**Interacción.** Con `animation-timeline: view()` (solo Chrome y Safari 26; sin soporte queda estática), el tramo de línea sobre cada estación pasa de T5 a T9/T13 cuando la estación cruza el centro de la pantalla. En Firefox (≈ 5,7 % de las visitas en RD, 06 §1) el esquema queda completo y quieto. **Móvil:** vertical; **reducido:** completo y quieto.

### S10 · Contacto (`#contacto` / `#contact`, 130 svh, tira → carta)

**Arte: el zoom final.** El visitante ha recorrido el mapa; ahora lo ve entero. Tres niveles de detalle (LOD), cada uno horneado una sola vez y cambiado con una **costura de luz de 4 filas** que sigue el scroll (*Powers of Ten*, §1.1): LOD0 el mar abierto del proceso, a escala real → LOD1 las cuatro islas como siluetas a 1/3 → **LOD2 la carta a 1/12**.

```text
╔═══╤═══════╤═══════╤═══════╤═══════╤═══════╤═══════╤═══════╤══════╗
║       ~  ~      ~         ~~                                     ║
╟  ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄  ~~      ~    ~                 ^     ~ ╢
║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~~         . . .          ~ ╲ │ ╱     ║
║        ~~                 ~~    █    .       .        ──-+-──    ║
║  ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄  ~~  ▒▒█▒▒~.    (@)  .~ ~     ╱ │ ╲     ║
║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~    █    .       .        ~     ~    ║
╟~  ~    ~                 ~~~    █     . . .        ~             ╢
║  ▄▄▄▄▄ ▄▄▄▄▄~▄▄▄▄▄ ▄▄▄▄▄  ~~      ~              ~               ║
║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~       ~                             ║
║   ~             ~                              ~     ~           ║
║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀           ~ ~   ~                    ║
╟             o                                           ~        ╢
║             ·      ~                                       ~     ║
║             ·     ~                      ░░░▒▒▒▒▒░░░             ║
║         ░░▒▄▄▒▒░░                       ···▒▒(@)▒···o░           ║
║      ~░░▒▒▒▀▀▒▒▒▒░░                    · ░░░▒▒▒▒▒░░░·      ~     ║
╟        ░░░▒▒▒▒▒·····o·                ·              ·           ╢
║                      ···░░░▒▒▒▒▒░░░  ·               ·  ~        ║
║ ~                      ····▒─┼─▒····o                ·           ║
║~      ~       ~      ~~ ░░░▒▒▒▒▒░░     ~~            ·     ~   ~ ║
║                                        ~           ░░░▒▒▒░░    ~ ║
╟                            ~                      ░░▒▐▌▐▌▒▒░░    ╢
║          ~                                    ~    ░░░▒▒▒░░      ║
║                                 ~  ~      ~        ~       ~     ║
╚═══╧═══════╧═══════╧═══════╧═══════╧═══════╧═══════╧═══════╧══════╝
```
*LOD2, 68×26: marco con retícula (`╤ ╧ ╟ ╢`), la ciudad con su río y la planta en cruz del Faro, las cuatro islas (símbolos: parcela, vía, faro, batería), el cable con estaciones `o`, una rosa de los vientos **sin letras** y, arriba, el único lugar sin dibujar: un círculo punteado con un pin `(@)`. Es «tu negocio».*

**Contenido.**

| Elemento | ES | EN |
|---|---|---|
| `h2` (lettering) | Pon tu negocio en el mapa | Put your business on the map |
| Botón primario | `[ Escríbenos por WhatsApp ]` (mensaje genérico de `brand.json`) | `[ Message us on WhatsApp ]` |
| Correo | hola@gaya.com.do (con «copiar» solo icono y estado `████` de 400 ms) | igual |
| Teléfono | +1 849-925-4426 | igual |
| Redes | Instagram, TikTok, YouTube, X, Facebook (iconos con `aria-label`) | igual |
| Firma | Giancarlo González, Director (visible: hace legítimo el `founder` del JSON-LD) | igual |
| Pie | Santo Domingo, República Dominicana · 18°28′ N 69°56′ O · hora local | Santo Domingo, Dominican Republic · 18°28′ N 69°56′ W · local time |

Las coordenadas son las de Wikipedia (18°27′45″N 69°56′10″W, redondeadas al minuto); la hora se calcula con `Intl` (sin API). El titular «Pon tu negocio en el mapa» es una propuesta mía [C]: si no gusta, el mecanismo funciona con cualquier h2.

```text
  ▛▀▖▞▀▖▙ ▌ ▀▛▘▌ ▌ ▙ ▌▛▀▘▞▀▘▞▀▖▞▀▘▀▛▘▞▀▖ ▛▀▘▙ ▌ ▛▀▘▌   ▙▗▌▞▀▖▛▀▖▞▀▖
  ▛▀ ▌ ▌▌▚▌  ▌ ▌ ▌ ▌▚▌▛▘ ▌▝▌▌ ▌▌   ▌ ▌ ▌ ▛▘ ▌▚▌ ▛▘ ▌   ▌▘▌▛▀▌▛▀ ▛▀▌
  ▘  ▝▀ ▘ ▘  ▘ ▝▀  ▘ ▘▀▀▘▝▀ ▝▀ ▝▀▘▀▀▘▝▀  ▀▀▘▘ ▘ ▀▀▘▀▀▘ ▘ ▘▘ ▘▘  ▘ ▘

  ╔═══╤═══════╤═══════╤═══════╤═══════╤═══════╤═══════╤═══════╤══════╗
  ║       ~  ~      ~         ~~                                     ║
  ╟  ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄  ~~      ~    ~                 ^     ~ ╢
  ║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~~         . . .          ~ ╲ │ ╱     ║
  ║        ~~                 ~~    █    .       .        ──-+-──    ║
  ║  ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄  ~~  ▒▒█▒▒~.    (@)  .~ ~     ╱ │ ╲     ║
  ║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~    █    .       .        ~     ~    ║
  ╟~  ~    ~                 ~~~    █     . . .        ~             ╢
  ║  ▄▄▄▄▄ ▄▄▄▄▄~▄▄▄▄▄ ▄▄▄▄▄  ~~      ~              ~               ║
  ║  ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀  ~~       ~                             ║
  ║   ~             ~                              ~     ~           ║
  ║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀           ~ ~   ~                    ║
  ╟             o                                           ~        ╢
  ║             ·      ~                                       ~     ║
  ║             ·     ~                      ░░░▒▒▒▒▒░░░             ║
  ║         ░░▒▄▄▒▒░░                       ···▒▒(@)▒···o░           ║
  ║      ~░░▒▒▒▀▀▒▒▒▒░░                    · ░░░▒▒▒▒▒░░░·      ~     ║
  ╟        ░░░▒▒▒▒▒·····o·                ·              ·           ╢
  ║                      ···░░░▒▒▒▒▒░░░  ·               ·  ~        ║
  ║ ~                      ····▒─┼─▒····o                ·           ║
  ║~      ~       ~      ~~ ░░░▒▒▒▒▒░░     ~~            ·     ~   ~ ║
  ║                                        ~           ░░░▒▒▒░░    ~ ║
  ╟                            ~                      ░░▒▐▌▐▌▒▒░░    ╢
  ║          ~                                    ~    ░░░▒▒▒░░      ║
  ║                                 ~  ~      ~        ~       ~     ║
  ╚═══╧═══════╧═══════╧═══════╧═══════╧═══════╧═══════╧═══════╧══════╝

  [ Escríbenos por WhatsApp ]   hola@gaya.com.do    +1 849-925-4426

  Instagram  TikTok  YouTube  X  Facebook

  Giancarlo González, Director
  Santo Domingo, República Dominicana · 18°28′ N 69°56′ O · 21:40
```
*Composición del contacto en escritorio: lettering (real: dos líneas), carta y datos.*

**Interacción.** Al pasar o enfocar `[ Escríbenos por WhatsApp ]`, **el pin cae** en el círculo (tres pasos + tres anillos): es el gesto que une el botón y la carta sin explicar nada. **Móvil:** la carta ocupa el ancho (44 columnas; el marco pierde marcas) y el botón queda en la barra inferior y bajo la carta. **Reducido:** carta estática con el pin ya puesto.

### S11 · Cierre (40 svh; el pie es obligatorio, el cielo de vuelta es P2)

**Arte (P2).** El cielo vuelve: un fotograma del héroe (cámara A a φ = 14°) con la **cruz de luz en calma**: la lente ya no sigue al puntero, reposa en el cruce. La página termina donde empezó, con la misma luz. Sin texto y sin movimiento propio (escenario, un cuadro por posición de scroll).

**Contenido (obligatorio).** Pie de página en texto sobre `--surface`: la marca `(o) Gaya Digital`, `[ ES | EN ]`, los iconos de redes con `aria-label`, la línea `Santo Domingo, República Dominicana` (`copy.ts › footer.rights`) y un enlace de WhatsApp. **Nunca se recorta el pie.** Si el presupuesto no alcanza, el cierre es solo el pie con 2–3 filas de cielo estático (`<pre>` del póster) encima.

---

## 5. El momento firma

**Dos momentos, un mismo gesto de cámara.**

1. **La ignición** (portada, ≤ 2,6 s): sobre un cielo de luz líquida, *la cruz de luz del Faro se enciende* y una lente de cristal queda flotando en su cruce. Es lo primero que se ve y evoluciona la lente de hoy en vez de tirarla.
2. **El despliegue** (S3, al bajar): *la ciudad de Santo Domingo se abre como un plano; el Faro, visto desde arriba, es una cruz; las calles se encienden como un circuito y la luz sale por el Malecón hacia el mar.* Es el momento que se cuenta: «la web abre la ciudad como un mapa y sale la luz por el mar».

**Por qué se recuerda.** Reúne tres cosas que no coinciden en ningún referente medido (01 §3): un cambio de perspectiva físicamente coherente (no un efecto de morfado), un símbolo local reconocible (el Faro y su cruz) y una metáfora de negocio que no necesita explicación (la ciudad se convierte en red y llega hasta ti). Y sucede con el scroll nativo, sin secuestrarlo.

**Cómo se dirige** (esto es lo que hay que cuidar para que aterrice):

- **Perfil de velocidad.** Los primeros 10 % del despliegue casi no cambian nada (el visitante aún está leyendo las referencias); la parte central es rápida; los últimos 25 % son de asentamiento (el mundo pasa a 1×). `easeInOut` con extremos largos.
- **Causa y luego efecto.** Primero se abre (0–0,6 de S3), después se enciende (0,6–1). Con las dos cosas a la vez el ojo no lee ninguna.
- **La cruz une los dos momentos.** El haz se acorta con `cos φ` mientras la planta en cruz del Faro aparece en el plano: el mismo símbolo cambia de escala.
- **Sin ayuda escrita.** Ni «sigue bajando» ni «desliza». El propio contenido cortado (la ciudad continúa bajo el borde) invita a seguir.

**Prueba de las tres capturas** (criterio de aceptación de arte, 01 §8.33): tres capturas fijas a 1200×630 (`?still&scene=hero`, `?still&scene=circuit`, `?still&scene=chart`) deben ser bellas por sí solas. La primera es también la imagen `og.jpg` (se genera con `scripts/og.mjs` desde el póster, sin mencionar cómo se hizo).

---

## 6. Navegación y chrome

```text
┌─ escritorio 1440 px (fijo sobre el lienzo) ──────────────────────────────────────────────────────┐
│ (o) Gaya Digital            [ Referencias ]   Servicios   Proceso   Contacto      [ ES | EN ]    │
│                                                                                                  │
│                                                                                   minimapa    ░  │
│                                                                                               ░  │
│                                                                                               ░  │
│                                                                                              ▐█▌ │
│                                               (contenido y lienzo)                           ▐█▌ │
│                                                                                               ░  │
│                                                                                               ░  │
│                                                                                               ░  │
│                                                                                               ░  │
│                                                                                                  │
│ [ ES | EN ]                                                                 [ WhatsApp ]         │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌─ móvil 390 px ───────────────────────┐
│ (o) Gaya Digital            Menú     │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│           (contenido y lienzo)       │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│ [ ES|EN ]  [ Escribir por WhatsApp ] │
└──────────────────────────────────────┘
```

| Elemento | Escritorio | Móvil | Notas |
|---|---|---|---|
| Marca | `(o) Gaya Digital` arriba a la izquierda; enlace a inicio | igual | El `(o)` es la lente en miniatura; se sustituye editando solo `Logo.astro` cuando llegue el logo del diseñador |
| Menú | Píldora superior: Referencias · Servicios · Proceso · Contacto | Botón «Menú» arriba a la derecha (pantalla completa) | Los enlaces aparecen cuando su destino existe (`READY.*`); el activo lleva `aria-current="location"` y corchetes |
| Idioma | `[ ES \| EN ]` en la esquina inferior izquierda y en la píldora | En la barra inferior | Enlace real a la otra ruta (`hreflang`) |
| WhatsApp | `[ WhatsApp ]` inferior derecha, siempre visible | Barra inferior fija, botón dominante ≥ 44 px | El mensaje cambia según la sección visible (genérico; de servicio en S5–S8) |
| Minimapa | Columna derecha de 3 celdas (solo ≥ 84 columnas) | No existe | Cada tramo es un `<a>` de ≥ 24 px con `aria-label` |
| Marco de carta | Borde de 1 celda con marcas `┼` | Igual, pero de 1 celda a 7 px | `aria-hidden`, dibujado en el lienzo; en tira las marcas bajan con el scroll |
| Enlace de salto | «Ir al contenido» visible al enfocar | igual | Etiqueta de control, no instrucción |

**Anclas y ids** (localizados; el actual `Nav.astro` enlaza `#servicios` también en `/en/`: se corrige): ES `#nosotros`, `#referencias`, `#servicios` (= isla A), `#automatizacion`, `#marketing`, `#soporte`, `#proceso`, `#contacto`; EN `#about`, `#references`, `#services` (= isla A), `#automation`, `#marketing`, `#it`, `#process`, `#contact`. Cada `section` lleva `aria-labelledby` al id de su `h2`. `html { scroll-padding-top: 5.5rem }`; `scroll-behavior: smooth` solo con `prefers-reduced-motion: no-preference`.

**Scroll-spy** con `IntersectionObserver` (`rootMargin: '-45% 0px -50% 0px'`), sin listeners de scroll ni cambios de historial (06 §4.7). **Transiciones entre páginas**: `@view-transition` nativo; `site-nav` y `ascii-field` con `view-transition-name`, sin viaje de grupo y con fundido de 240 ms (06 §4.8); en `/referencias/` el mismo motor se monta con el mar quieto.

**Teclado**: el orden de Tab es el del DOM; el foco de cada enlace o botón lleva un pulso de la lente (una vez, 1,2 s); nunca hay trampa de foco (ni `scroll-snap: mandatory`, ni `touch-action: none`).

---

## 7. Cómo se mantiene legible todo el texto real

**Principio.** El texto real (h1, párrafos, listas, botones, enlaces) está en el DOM, en color de texto (`--ink`, `--muted`, `--accent-text`), y **nunca** sobre un tono del arte por encima de un tope calculado. El arte se subordina al texto con **halos de rotulación** (Imhof, §1.1), no al revés.

**Dónde vive cada cosa.**

| Capa | Qué contiene | Se mueve con | Nota |
|---|---|---|---|
| Lienzo (fondo) | El mundo: cielo, ciudad, plano, mar, islas, cable, marco de carta | Scroll con `transform` sub-fila (§8.3) | Puede ir un cuadro por detrás en un fling: por eso no lleva nada que deba alinearse con el texto |
| Arte pegado al DOM | Lettering, símbolos de la leyenda, marcadores de árbol, reglas, letreros con emblema, la calle, la puerta, la línea del proceso, corchetes | Scroll nativo (compositor) | Alineación exacta con el texto; es `data-art` + `::before` y `aria-hidden` |
| Texto | h1, h2 (sr-only bajo el lettering), párrafos, listas, botones | Scroll nativo | Sobre pozos |
| Cromo | Menú, esquinas, minimapa, barra móvil | Fijo | Sobre pozos propios (T4) |

**Pozos de lectura** (`data-well`, 06 §4.4): cada bloque de lectura publica su rectángulo; el motor lo mide una vez (coordenadas de documento, cacheadas; se re-mide con `ResizeObserver`, `document.fonts.ready` y cambio de ancho) y baja el tono del campo hasta un **tope** dentro de él:

| Tipo | Tope de tono | Contraste mínimo garantizado (peor caso: cobertura total) | Se usa en |
|---|---|---|---|
| `well-ink` | **T6** | 7,47:1 con `--ink` [M] | Párrafos, listas, botones |
| `well-muted` | **T4** | 6,22:1 con `--muted` [M] | Metadatos («Verificado 30 sep 2026»), sectores |
| `well-lettering` | **T5** | 6,18:1 con `--accent-text` [M] | Lettering de los h2 |
| `well-chrome` | **T4** | 6,22:1 con `--muted` | Menú, minimapa, barra móvil |

- **Borde de dos celdas** con fundido `smoothstep`, y **nunca a cero**: queda un susurro T1 que integra el arte con la página (01 §5.6).
- **Halo que se adelanta**: durante un scroll rápido el pozo se ensancha `min(4, |v|·dt/alto_de_fila)` filas en el sentido del movimiento, así el fondo brillante no llega a tocar el texto aunque el lienzo vaya 1–2 cuadros por detrás.
- **Los pares entran en el repositorio**: `tokens.json` gana `(ink, T6)`, `(muted, T4)` y `(accentText, T5)` y `npm run contrast` los comprueba (06 §4.4).
- **El texto nunca lleva un tono del arte**; `--glow-2` y `--glow-3` jamás quedan bajo texto.
- Con `prefers-contrast: more` los topes bajan a T3, T2 y T3; con `forced-colors: active` el lienzo se oculta y quedan el texto y el arte pegado en `CanvasText` (03 §2.7).

**Texto**: ≥ 16 px (17/18/19), interlínea de dos filas de la rejilla, ≤ 62 ch, sin justificar, párrafos ≤ 6 líneas en móvil, peso 400. Zoom al 200 % y 400 %: la rejilla del lienzo conserva ≥ 24 columnas, el contenido reflowa y ningún marco recorta texto (los marcos son pegados y crecen con el contenido, 03 §2.4). Espaciado de texto de WCAG 1.4.12: el texto real no se recorta porque no hay cajas de altura fija.

---

## 8. Plan técnico

### 8.1 Capas

| z | Capa | Qué es | JS |
|---|---|---|---|
| 0 | **Lienzo** | Un único `<canvas>` fijo (`aria-hidden`), con sobrecarga de 4 filas arriba y abajo (§8.3) | motor |
| 0 | **Póster** | `<pre>` SSR del héroe en dos capas de tono (`mid`, `hot`), `data-nosnippet`; se oculta al llegar `data-hero="live"` | ninguno |
| 1 | **Arte pegado al DOM** | Lettering, leyenda, árbol, reglas, letreros, calle, puerta, línea del proceso, corchetes | ninguno (CSS) |
| 2 | **Contenido** | `main > section#id` con texto semántico | ninguno |
| 3 | **Cromo** | Menú, esquinas, barra móvil, minimapa (enlaces reales) | scroll-spy (1 `IntersectionObserver`) |

### 8.2 Archivos

```formula
src/ascii/                          (cero dependencias; .ts con tipos mínimos)
  núcleo (05/06):   noise  bn64  tones  grid  atlas  render-gl  render-2d  stage  engine
  world/:           cam  city  sea  route  wells  lens
  scenes/:          sky  coast  unfold  island-web  island-auto  island-mkt  island-it  chart     ← cada una con import()
  data/:            emblems  font5x5
scripts/
  ascii-poster.mjs    póster SSR del héroe (2 variantes) desde las MISMAS funciones que el motor
  ascii-letters.mjs   lettering de todos los h2 en tres variantes (XL, M, S)
  ascii-ramp.mjs      la rampa debe ser monótona y la fuente debe cubrir los glifos (falla el build)
  ascii-bn.mjs        tabla de ruido azul 64×64 (se incrusta)
  ascii-lint.mjs      glifos prohibidos en data-art (este documento pasa el lint)
  seams.mjs           costuras de filas a DPR 1–3 (03 §2.9)
src/components/       AsciiField  Lettering  Legend  Ledger  Street  Process  Chart        (Hero, Logo y Nav se adaptan)
Se retiran:           HeroCards.astro · /hero/cobalto-*.webp · noise.png · shader de hero.ts · gsap y lenis de package.json (06 D7)
```

### 8.3 Lienzo fijo con sobrecarga y `transform` sub-fila

El problema de todo fondo fijo dibujado por JS es que va un cuadro por detrás del scroll nativo. La solución es dibujar **más de lo que se ve** y dejar que el compositor haga el movimiento fino:

- El `<canvas>` mide `(filas + 8)` filas: 4 de sobrecarga arriba y 4 abajo; `position: fixed; top: calc(-4 * var(--cell-h)); height: calc((filas + 8) * var(--cell-h))`.
- En **tira**, el motor guarda `scrollY₀` (el del último dibujo). En cada evento `scroll` (pasivo) fija `canvas.style.transform = translate3d(0, −snap(scrollY − scrollY₀), 0)` con `snap(v) = round(v·dpr)/dpr` (alineado a píxel de dispositivo: sin desenfoque de los glifos).
- Solo **redibuja** cuando `|scrollY − scrollY₀| ≥ 2 filas` (no cada cuadro): a velocidad de lectura (≈ 200 px/s ÷ 28–32 px por 2 filas) son 5–8 redibujos por segundo; en un fling, como mucho los del tier (30 fps). Hasta 4 filas de retraso, el fondo sigue pegado al texto con la suavidad nativa.
- En **escenario** no hay transform: lo que cambia es la cámara, que se recalcula al pasar de una fila de scroll a la siguiente.
- Riesgo y salida: si en el A07 el fondo se despega de los elementos pegados al DOM en un fling, el plan B es dividir el mundo en lienzos altos `position: absolute` (2–3 vivos, uno por banda) que hacen scroll nativo; cuesta más contextos pero el movimiento es exacto (§11, R1).

### 8.4 Render y respaldos

Lo de 05 tal cual: `Grid` de 4 bytes por celda, render **WebGL2** de textura de celdas (`RGBA8UI`, paleta de 32 × 1, un `drawArrays`, contexto por defecto, `gl.disable(gl.DITHER)`), respaldo **Canvas 2D** con baldosas opacas y diff por celda (tope ≈ 900 celdas por cuadro; si no, 8 fps), y **póster** si no hay ninguno o si `WEBGL_debug_renderer_info` dice `SwiftShader`/`llvmpipe` (5–20 ms por cuadro, 05 §1.3). Los bloques, cuadrantes y cajas del lienzo se dibujan por código (sin costuras ni `symbols2`); el DOM pegado usa `symbols2`. El motor publica `--cell-w`, `--cell-h` y la variable `data-hero` (`idle | live | poster`). **La paleta de 32 entradas** sube aparte (128 bytes): agua (16–23), estrellas (24–29), núcleo de la cruz (30), farolas (31).

### 8.5 Escenas y coste

**Cielo líquido** (probado en Node, `tile.mjs`, Anexo A.6): una tesela periódica de 64×64 de crestas (3 octavas enteras + deformación) se hornea en 3–4 ms; por celda se leen dos veces (bilineal) a escalas y velocidades distintas y se multiplican. Cintas horizontales que se desplazan y se cruzan con el scroll; el movimiento de un instante a otro se ve en estos dos cuadros del mismo tramo (t = 0 s y t = 6 s):

```text
::::··················::::::::::::::::::::·····················
::::::::::::::::::::::::::::::::::::::::::::::··················
===================::::::::::::::::::::::::::::::::::············
**********===========::::::::::::::::::::::::::::::::::::::········
***********========::::::::::::::::::==========:::::::::::::::·······
***********=======:::::::::::::::::=====*=============:::::::::::·········
*********==========::::::::::::::==******=====================::::::::··············
===============================***yyyy***============******===========:::::::·············
====================*****yyyaaaAAAAaayy**==========================******=====:::::::::··········
=========:::::====***yyyyyyyyy*******==========::::::::::·:::::::::=====*************====::::::·····
=======::::::====****y***===::::::::::::::::::::·····················::::::=========********===:::::
:::::::::::====***y**==:::······················                   ········::::::::::::===*****===::
:::::::::====****===::···                                               ··············::::==****===:
···::::::===****==:::···                                                     ···········:::==*****==
```

```text
::::::::::==::::::::::::::::::::······················
::::::::================:::::::::::::::::·············
===========***********==========:::::::::::::::·······
=======***********************======::::::::::::::······
************************yyyyyyy*****=========:::::::·····
*****================*****yyyyyyyyyy*********======:::·····
======:::::::::::::::====***yyyyaaaaayyyyyyyyyy****==::::······
:::::::::::::::::::::::===**yyyyyyyaaaayyyyyyy*******====::::·············
:::::::::··········::::===******=*****yyyyyyyyyyyyy*******====::::::···········
::::::::::::::::::::::===**=====::=======*****yyyyyyyyyyyyyy****====::::::········
:::::::::::::::==============:::::::::::::::========***yyyaaAAAAayyy***====:::::···········
::::::::===============:::::::::::::::············:::::===**yaaAGGG▒▒GGGAayy**===:::::··············
:::::====***==::::::·····················          ······:::==***yyyyyyyaaaaaaayy**===::::::········
:====****==:::·······                                   ·····::::=========****yyyyyy**===:::::······
```

| Pieza | Qué corre por cuadro | Coste |
|---|---|---|
| Cielo (tesela) | 2 lecturas bilineales por celda de cielo | **0,09–0,10 ms** por 4 480 celdas [M, Node]; ×4 ≈ 0,4 ms; horneado 3–4 ms una vez [M] |
| Cajas (cámara A) | Pintor de cajas + suelo + cielo | **0,7–0,9 / 1,4–1,9 / 0,7–1,0 ms** a 14° / 40° / 90° con 8 000 celdas [M, sin optimizar; rango de tres corridas]; ×4 = 2,8–3,6 / 5,6–7,6 / 2,8–4,0 ms; objetivo ≤ 1,2 ms cacheando suelo y cielo por paso de φ |
| Cajas (cámara B, §2.5) | Suelo por rayo inverso + cajas proyectadas | **1,3 / 2,1 / 1,7 ms** a 4° / 40° / 90° con 8 000 celdas (1,6 / 1,7 / 1,0 con 4 800) [M, sin cielo]; ×4 = 5,2 / 8,4 / 6,8 ms; exige cachear el suelo o calcularlo a media resolución mientras se mueve |
| Circuito | `overlay` de ≤ 60 chips + tono de pulsos | ≤ 0,3 ms [C] |
| Islas | Sprites y tonos sobre terreno horneado | 05 midió 0,04–0,5 ms por escena análoga [05 §3.8]; estimo ≤ 0,5 ms [C] |
| Lupa | 90–180 celdas a doble resolución vertical | < 0,05 ms [C] |
| Pozos | Máscara por celda (cacheada) | ≤ 0,1 ms [C] |
| Subida + sello | Textura de celdas + un `drawArrays` | 0,05 ms (×4: 0,15 ms) [05 §1.3, M] |

Suma del peor cuadro (despliegue a 40°) tras optimizar: ≈ 1,7 ms en escritorio; ×4 ≈ 6,8 ms frente al techo de 6 ms de 05 → durante S3 el tier baja a 24 fps y, si hace falta, a `low`. **Todo esto está sin medir en el A07** (§8.9).

### 8.6 Orden de carga y LCP

1. HTML con el **póster SSR** (`<pre>`, texto), el h1, el lead y los botones: es lo que pinta el LCP. Dos variantes de póster (ancha 132×34 y alta 56×46) conmutadas por `@media`; ≤ 3 KB br cada una. **Medido** [M, `poster-size.mjs`, Anexo A.9: fotograma φ = 14° de la cámara A + campo líquido por tesela, con la Polar y sin el resto de estrellas]: **132×34 = 0,84 KB con brotli** (2 capas `mid` + `hot`; 8,7 KB sin comprimir), 100×30 = 0,66 KB, **56×46 = 0,61 KB**, 44×40 = 0,52 KB; con una sola capa 0,77 / 0,60 / 0,53 / 0,44 KB. Con las ventanas y el degradado calculados estimo ≤ 1,5 KB [C]: holgura de 2× sobre el techo.
2. CSS y fuentes (`latin` + `symbols2` precargadas, `font-display: swap`, fallback al 100 %).
3. Tras `load`, en `requestIdleCallback` (respaldo `setTimeout`): `import()` del núcleo y de la escena del héroe; `document.fonts.load('500 16px "Geist Mono Variable"')` con comprobación de `length > 0` (nunca `check()`); horneado de atlas y tesela; primer cuadro; fundido del lienzo sobre el póster en 240 ms; arranca la ignición.
4. Las escenas de S3 en adelante se importan al faltar ≤ 1,5 pantallas (`IntersectionObserver` con margen del 60 %, 05 §3.7); un máximo de 2 contextos vivos.
5. **El lettering y el canvas no cuentan para el LCP** (web.dev); el h1 y el póster son texto. Reserva de cajas: los lettering están en el HTML (cero CLS); el lienzo es `position: fixed`.

### 8.7 Presupuestos

| Pieza | Presupuesto | Cuándo llega |
|---|---|---|
| Núcleo (grid, atlas, render GL + 2D, engine, noise, pozos) | ≤ 12 KB gz | tras `load` |
| Héroe (cielo, cámara, costa, cruz, lente) | ≤ 6 KB gz | con el núcleo |
| Plano, circuito, mar y cable | ≤ 4 KB gz | ≤ 1,5 pantallas antes de S3 |
| Cada isla | ≤ 2,5 KB gz | ≤ 1,5 pantallas antes |
| Carta (LOD) | ≤ 2 KB gz | ≤ 1,5 pantallas antes de S10 |
| **JS de primera carga** | **≈ 18 KB gz** (núcleo + héroe); **≈ 40 KB** el total ASCII | techo de `budgets.mjs`: 60 KB |
| Fuentes | 28,9 KB (2 archivos) | precargadas; hoy 68,6 KB de Bricolage + Geist Mono sin precarga |
| Póster SSR | ≤ 3 KB br por variante | en el HTML |
| Lettering en DOM (todos los h2, 3 variantes) | ≈ 3 KB gz | en el HTML |
| Emblemas | ≈ 0,7 KB | en el HTML (solo los usados) |
| Imágenes en la portada | **0** (hoy: 2 pósters webp, `noise.png` y hasta 5 miniaturas de HeroCards en escritorio) | — |
| Terceros | **0** | CSP `default-src 'self'` intacta |

**Medido en esta pasada** [M, `esbuild --minify`, gzip -9]: cámara A (mundo + pintor de cajas) **2,3 KB gz**; cámara B con el mundo, la tesela de cielo, el kit y las 58 estrellas del prototipo **7,4 KB gz** (las estrellas solas, 1,4 KB): B suma ≈ 3–4 KB sobre A. Si entran B y el cielo real, el total ASCII pasa de ≈ 40 KB a ≈ 44 KB gz y hay que revisar ese techo en `budgets.mjs`; sigue muy por debajo de los 60 KB de primera carga porque solo el núcleo y el héroe se cargan al principio.

**Metas** (01 §8.17): Lighthouse móvil ≥ 90 (mediana de 3), LCP < 2,5 s (objetivo 2,0), CLS 0, TBT < 200 ms; 30 fps sostenidos en el A07 (24 durante el despliegue). El ahorro de 40 KB de fuentes y la ausencia de imágenes en la portada compensan el JS nuevo.

### 8.8 Estados y respaldos

| Condición | Resultado |
|---|---|
| WebGL2 y sin preferencias | Vivo (lienzo + pozos + lupa) |
| Sin WebGL2, contexto perdido | Canvas 2D por baldosas y diff; si > 900 celdas por cuadro, 8 fps |
| SwiftShader o llvmpipe | Respaldo 2D o póster |
| `prefers-reduced-motion`, `saveData` | **Still**: un cuadro por banda con cortes secos; S3 son dos cuadros con costura de luz; sin lupa, pulsos ni latidos; se escucha `change` para cambiar sin recargar |
| `forced-colors: active`, impresión | Lienzo oculto; arte pegado en `CanvasText` (negro a 7 pt al imprimir); el texto intacto |
| `prefers-contrast: more` | Topes T3/T2/T3 y arte pegado en `--ink` |
| Sin JS | Póster + texto + arte pegado (todo legible) |
| Pestaña oculta, menú abierto | Bucle en pausa |
| Ancho < 360 px | h2 en texto real (sin lettering); resto igual |

### 8.9 Pruebas y puertas

- `npm run ascii:lint`: glifos prohibidos (probado sobre los bocetos de este documento: 0) y `data-art` sin texto en el DOM.
- **Golden** por escena y diseño (`sha1(toText() + toTones())` a `settle`); **paridad** póster = cuadro del motor a t0 (en Node); paridad GL↔2D < 0,01/255 (05 §6.5).
- `npm run seams` (03 §2.9): costuras ≤ 40/255 a DPR {1, 1,5, 2, 2,625, 3}; pendiente WebKit y Firefox.
- `npm run contrast` con los pares nuevos (§7); axe en escritorio, móvil y movimiento reducido sin violaciones de `color-contrast` (el arte va en `::before`).
- `npm run budgets` (techo de 60 KB gz de primera carga; ASCII total ≤ 40 KB); `npm run guard` (0 peticiones externas).
- Lighthouse móvil (mediana de 3) con y sin `?still`.
- **A07 real (bloqueante)**: mediana ≤ 6 ms por cuadro durante 10 s de scroll, `__field.sleeping === true` a los 2 s, horneado ≤ 16 ms, ninguna tarea > 50 ms, despliegue a 24 fps sin caída de tier; compararlo con el fondo pegado al texto en un fling (R1).
- Revisión visual a 320, 375, 414, 768, 1024 y 1440 px y con `prefers-reduced-motion`; cada escena se aprueba primero en estático.
- Análisis de destellos (p. ej. PEAT) de la ignición y de La Planta: **no verificado aquí**.

### 8.10 Hitos y recorte

Estimaciones [C], una persona con el motor de 05 ya portado:

| Hito | Contenido | Aceptación |
|---|---|---|
| M0 · 1–2 d | Fuentes (`latin` + `symbols2`, fallback), celda CSS 7/8/9 y `--art-lh`, tokens de pozo, `ascii:lint`; se retiran Bricolage, HeroCards y `noise.png` de la portada | `dist/` sin `size-adjust: 85.986%`; CLS 0 |
| M1 · 3–4 d | Póster SSR, cielo por tesela, cajas a 14°, Faro y cruz, ignición, lente, pozos | Captura 1 a 1200×630; LCP < 2,5 s |
| M2 · 4–5 d | Cámara, escenario → tira, S3 con `κ`, marco de carta | Captura 2; medida en el A07 |
| M3 · 5–6 d | Terreno común, islas A–D, cable | Cada isla bella en estático y en scrub |
| M4 · 3–4 d | Lettering, leyenda, ledger, calle con emblemas, proceso, ids, menú, minimapa, JSON-LD, lint de copy | Contenido ES/EN completo y sin `[CONFIRMAR]` |
| M5 · 2–3 d | Carta (LOD), pin, botón | Captura 3 |
| M6 · 3 d | A07, Lighthouse, axe, seams, movimiento reducido, colores forzados, impresión | Todas las puertas de §8.9 |
| M7 · 2 d | Cierre S11, `og.jpg`, `CREDITS.md` | — |

**Orden de recorte si falta tiempo** (de lo primero a lo último que se quita): el cielo de S11 (el pie sigue); el cielo real (§2.6); LOD1 (saltar del mar a la carta con una sola costura); latidos de los botones; topónimos de la lupa; minimapa; animación de las islas (quedan en estado final con aparición por disolución al entrar). **Nunca se recorta**: póster SSR, pozos de lectura, estados de movimiento reducido, botones de WhatsApp.

---

## 9. Accesibilidad y SEO

- **Todo arte es decoración**: lienzo `aria-hidden`; arte pegado `aria-hidden`, `translate="no"`, `data-art` + `::before` (no entra al DOM); `user-select: none`; póster con `data-nosnippet` en el HTML inicial (06 §4.12). Un titular con arte lleva `sr-only` con el mismo texto que muestra el lettering (03 §2.6).
- **Semántica**: un solo `h1`; `h2` por sección con `id`; `ul role="list"` (los marcadores de árbol y los símbolos de leyenda son `::before` con texto alternativo vacío, 03 §2.5); `dl` para el ledger; `ol` para el proceso; `nav` con `aria-label`; enlace «Ir al contenido».
- **WCAG 2.2 AA**: contraste por construcción (§7); objetivos ≥ 24 px (2.5.8), botones ≥ 44 px; foco visible ≥ 3:1 (1.4.11) y no tapado por el cromo fijo (2.4.11, con `scroll-padding`); ningún movimiento autónomo > 5 s (2.2.2: la ignición dura ≤ 2,6 s); destellos (2.3.1): cambios por celda independientes, ninguna oscilación global, transiciones ≥ 240 ms; reflow a 320 px (1.4.10) y espaciado de texto (1.4.12); movimiento por interacción respeta `prefers-reduced-motion` (2.3.3).
- **Lector de pantalla**: se oye h1, lead, enlaces; después cada h2 con su ficha; el arte no se anuncia.
- **SEO**: `title` y `description` por idioma (existen); JSON-LD `Organization` con `makesOffer` (cuatro `Service`), `alternateName: 'Gaya Group'`, `knowsLanguage`, `founder` (visible en S10), `sameAs` (redes de `brand.json`) y `areaServed`, **sin** ratings, reseñas ni dirección exacta y **sin `LocalBusiness`** (04 D22; 06 D36 proponía `ProfessionalService`, que es subtipo de `LocalBusiness` y exige `address`: se evita); `hreflang` y `x-default` ya salen de `routes.ts`; ids de sección localizados; `og.jpg` renderizado del póster. Fase 2: cuatro páginas de servicio que reutilicen el mismo mundo con otra banda (06 D35).

---

## 10. Reglas del dueño y del encargo: cómo se cumplen

| Regla | Cómo se cumple |
|---|---|
| Interfaz que se explica sola, cero texto instructivo | Ningún «desliza», «cómo funciona» ni leyenda bajo un control. Solo contenido, etiquetas de campo (Incluye, Para quién…), sellos («Ejemplos con datos ficticios», «Verificado 30 sep 2026») y estados. La lente se descubre porque está a la vista (el orbe en la cruz), y el pin cae al enfocar el botón |
| Honestidad (sin clientes, cifras, testimonios ni logos) | Las únicas cifras son las de 04 con fuente y fecha, el plazo `24–48 h` de `brand.json` (`[CONFIRMAR]`), las coordenadas de Wikipedia y la hora local. Ninguna cifra propia de Gaya; las ilustraciones no llevan números |
| Nunca mencionar que la web la hizo una IA | No aparece en texto, meta, JSON-LD ni créditos. «Automatización e IA» solo figura como servicio |
| Cero terceros | Fuentes y motor autoalojados; sin iframes, CDN, analítica, API de hora ni de clima; CSP `default-src 'self'` intacta |
| WhatsApp como canal principal | Esquina fija, barra móvil, botón en cada sección, mensaje prellenado con el servicio (04 D21) |
| Evitar el cliché de terminal | Sin prompt, cursor, CRT, scanlines, verde ni alfabeto «hacker»; glifos al servicio de la cartografía |
| WCAG 2.2 AA y `prefers-reduced-motion` | §7, §8.8, §9 |
| Rendimiento (A07, Lighthouse ≥ 90, LCP < 2,5 s) | §8.3–§8.9; pendiente de medir en el A07 |
| Paleta Cobalto | Dieciséis tonos derivados de los cuatro tokens; ninguno fuera de la familia (§3.4) |
| Bilingüe | Todo el copy ES/EN; ids localizados; lettering por idioma |

---

## 11. Riesgos y decisiones abiertas

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | El fondo fijo va un cuadro por detrás del texto en un fling (Android) | Sobrecarga de 4 filas + `transform` sub-fila; pozos que se adelantan; nada alineable vive en el lienzo; plan B: lienzos altos con scroll nativo (§8.3) |
| R2 | El despliegue de la cámara A cuesta 5,6–7,6 ms con CPU ×4 sin optimizar (§2.3) | Cachear suelo y cielo; 24 fps en S3; bajar de tier; último recurso: dos cuadros con costura |
| R3 | Fidelidad de la Catedral, el Alcázar y la Fortaleza (cajas, no calcadas) | Comparar con las fichas de Commons (05 §1.6) y con el dueño antes de aprobar; son siluetas, no retratos |
| R4 | Lettering `quad` de 21×42 px por letra en 390 px puede leerse justo | Probar con usuarios; por debajo de 360 px, texto real; subir al modo `half` donde quepa |
| R5 | Página larga en móvil (≈ 20 pantallas) | Barra inferior con WhatsApp; el cable hace de progreso; si hace falta, plegar «Para quién / Necesitamos / Resultado» en `details` solo en móvil (D6) |
| R6 | Sensibilidad histórica: el Faro a Colón y el Alcázar evocan a Colón | Se usan como hitos urbanos, sin texto histórico; decisión del dueño (D1) |
| R7 | `animation-timeline` no existe en Firefox (≈ 5,7 % en RD) | Solo la línea del proceso lo usa; sin soporte queda completa y quieta |
| R8 | Hay copy `[CONFIRMAR]` (04 D11) | La build de producción se detiene hasta que el dueño apruebe; las islas se construyen igual |
| R9 | Las dos rejillas (CSS y lienzo) difieren hasta ≈ 5 % a DPR fraccionario [M: celda de 7 px a DPR 1,5 → 11 px de dispositivo = 7,33 px CSS, +4,8 %; celda de 10 px a DPR 1,25, 4,0 %; la de 8 px es exacta a cualquier DPR] | Los pozos se miden del DOM, con borde de dos celdas; nada depende de que coincidan |
| R10 | Todo lo de rendimiento de §8.5 es de escritorio | El A07 es bloqueante (§8.9) |
| R11 | Dos variantes de póster pueden superar los 3 KB br | **Medido: 0,6–0,9 KB** (§8.6); con estrellas y ventanas estimo ≤ 1,5 KB. Riesgo bajo; re-medir en M1 con el póster de producción |
| R12 | La cámara B cuesta 4–8,4 ms con CPU ×4 en escritorio (§2.5) | Cachear el suelo (recalcular al variar φ más de 1°), suelo a media resolución mientras se mueve, 24 fps en S3; si no cabe, se queda la cámara A |
| R13 | El catálogo estelar del §2.6 puede exigir crédito o tener términos propios | Línea en `CREDITS.md`; verificar el ReadMe de CDS V/50 antes de publicar; el cielo real es P2 y se puede quitar sin tocar nada más |
| R14 | La cruz de luz del Faro parece afirmar que el monumento se enciende cada noche | No hay texto que lo afirme; la cruz es el símbolo de la marca (la lente en su cruce) y su ignición es una escena, no un hecho; si el dueño lo prefiere, se sustituye por un haz sin brazo (D1) |

**Decisiones que necesito del dueño** (cada una tiene un valor por defecto):

- **D1. Obelisco**: excluido por defecto (conmemora «Ciudad Trujillo», 05 §1.6). Alternativa: sustituirlo por la Puerta del Conde.
- **D2. Nombre de marca**: Gaya Digital o Gaya Group (04 D27). El concepto usa `(o) Gaya Digital`.
- **D3. Titular del contacto**: «Pon tu negocio en el mapa» / «Put your business on the map» (propuesta mía).
- **D4. Bricolage**: retirarla de la portada (por defecto) y migrar `/referencias/` a Geist Mono, o conservarla allí.
- **D5. Topónimos en la lupa** (Calle Las Damas, Puerta del Conde…): sí por defecto.
- **D6. Ledger completo en móvil** (por defecto) o plegado.
- **D7. Cierre S11**: el pie es obligatorio; el cielo de vuelta, sí si hay tiempo.
- **D8. Hora y coordenadas en la esquina**: sí por defecto (P2).
- **D9. Orden**: Quiénes somos → Referencias → Servicios (respaldado por `PRODUCT.md`: baraja de referencias antes de las escenas de servicios).
- **D10. Líneas `[CONFIRMAR]`** de 04 (apps nativas, pasarela con e-CF, API de WhatsApp, agente de IA, Google Ads, SLA): qué sale y qué no.
- **D11. Cámara**: la A (ortográfica) por defecto; la B (perspectiva) se prueba en M2 detrás de `?cam=persp` y gana o no mirándola (§2.5).
- **D12. Cielo real** (§2.6): no por defecto (P2); la Polar sí va en el póster. Si se quiere el resto, hay que verificar antes los términos del catálogo.

---

## 12. Fuentes

**Nuevas en esta pasada** (detalle y uso en §1.1): https://en.wikipedia.org/wiki/Ciudad_Colonial_(Santo_Domingo) [V] · https://en.wikipedia.org/wiki/Fortaleza_Ozama [V] · https://en.wikipedia.org/wiki/Ozama_River [V] · https://en.wikipedia.org/wiki/Mode_7 [V] · https://www.coranac.com/tonc/text/mode7ex.htm [V] · https://www.asciicity.com/ [V] · https://github.com/kyhsa93/ascii-engine [V] · https://whc.unesco.org/en/list/526/ [S] · https://docs.mapbox.com/mapbox-gl-js/example/scroll-fly-to/ [S] · https://github.com/mapbox/storytelling [S] · https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html [S] · https://aa.usno.navy.mil/faq/docs/GAST.php [S] · http://cdsarc.u-strasbg.fr/viz-bin/cat/V/50 [S] · https://github.com/rastapasta/mapscii [S].

**Leídas para el primer borrador de este concepto [V]:** https://en.wikipedia.org/wiki/Powers_of_Ten_(film) · https://en.wikipedia.org/wiki/Visual_variable · https://en.wikipedia.org/wiki/Tube_map · https://en.wikipedia.org/wiki/Portolan_chart · https://en.wikipedia.org/wiki/Hachure_map · https://en.wikipedia.org/wiki/One-line_diagram · https://en.wikipedia.org/wiki/Strahler_number · https://en.wikipedia.org/wiki/Santo_Domingo · https://es.wikipedia.org/wiki/Calle_Las_Damas · https://es.wikipedia.org/wiki/Calle_El_Conde · https://en.wikipedia.org/wiki/Puerta_del_Conde · https://en.wikipedia.org/wiki/Columbus_Lighthouse · https://es.wikipedia.org/wiki/Puente_Juan_Bosch · https://web.dev/articles/lcp · https://jsr.io/@marianmeres/cityscape (MIT).

**Por resumen de buscador [S]:** https://neal.fun/deep-sea/ (403) y https://flowingdata.com/2019/12/05/scroll-scroll-scroll-through-the-depths-of-the-ocean/ · rotulación cartográfica y halos: https://en.wikipedia.org/wiki/Typography_(cartography), guías de ESRI (https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/mapping/polishing-your-halo), PSU (https://courses.ems.psu.edu/geog486/node/7) y Ordnance Survey (https://docs.os.uk/more-than-maps/geographic-data-visualisation/guide-to-cartography/text-on-maps) · el Faro «solo en ocasiones especiales»: https://www.caravan.com/travel-dominican-republic/columbus-lighthouse y https://www.atlasobscura.com/places/faro-a-colon-columbus-lighthouse (sin confirmar; no se usa).

**No accesibles al abrirlas:** https://neal.fun/deep-sea/ (403) y https://whc.unesco.org/en/list/526/ (403: solo se usa lo que el buscador citó), la ficha «Colonial Zone, Santo Domingo» de Wikipedia (404 con ese título; se leyó «Ciudad Colonial (Santo Domingo)»).

**Informes previos** (`docs/ascii/research/`): 01-showcase · 02-gpu-ascii · 03-typography-accessibility · 04-services-content · 05-illustration-engine · 06-motion-architecture. **Código del repositorio leído:** `src/scripts/hero.ts`, `src/styles/tokens.css`, `src/components/Hero.astro`, `HeroCards.astro`, `Nav.astro`, `Logo.astro`, `src/data/references.json`, `brand.json`, `PRODUCT.md`, `DESIGN.md`, `CONTRACT.md`.

**Licencias.** Todo el código y el arte de este documento es original para Gaya Digital. La fuente es Geist Mono (OFL-1.1, The Geist Project Authors). Ninguna imagen ni código de terceros se copia: los referentes son ideas y técnicas. Datos geográficos: Wikipedia (CC BY-SA) solo como hechos leídos; ningún texto copiado.


---

## Anexo A · Código y pruebas de esta pasada

Todo el código es **original para Gaya Digital** (los referentes de §1.1 aportan ideas y fórmulas, no líneas). Se escribió y se ejecutó en Node 24.19 (Windows 11, Chrome 154 con Playwright para las capturas de comprobación). Los bocetos de texto de este documento se generaron con estos archivos; las capturas en color no se incluyen (los archivos de trabajo no persisten). Nada de esto está medido en el Samsung A07: las cifras son de escritorio y sirven como razón, no como promesa móvil.

| Anexo | Archivo | Qué es | Dónde se usa |
|---|---|---|---|
| A.0 | `kit.mjs` | Ruido entero, `Grid` de glifos, relleno de polígonos por cobertura 2×2 | A.2, A.3, A.5, A.6 |
| A.1 | `scripts/ascii-tones.mjs` | 16 tonos Cobalto, contrastes y prueba de la celda 2:1 | §3.2, §3.4 |
| A.2 | `cam.mjs` | Cámara A (ortográfica con cabeceo) + mundo de cajas + coste | §2.3, S0–S3 |
| A.3 | `letters.mjs` | Tipografía propia «Carta 5×5» y anchos de los títulos | §3.5 |
| A.4 | `emblems.mjs` | 14 emblemas de sector de 11×5 celdas | S2 |
| A.5 | `islands3.mjs` | Terreno con achurado y las cuatro islas | S5–S8 |
| A.6 | `tile.mjs` | Cielo líquido por tesela periódica de 64×64 | S0, §8.5 |
| A.7 | `camP.mjs` (+ `util.mjs`, `grid-tono.mjs`) | Cámara B (perspectiva, «Mode 7») | §2.5 |
| A.8 | `stars.mjs` | Cielo real: tiempo sidéreo, alt/az | §2.6 |
| A.9 | `poster-size.mjs` | Peso del póster con brotli y gzip | §8.6 |

### A.0 · `kit.mjs`

```js
// kit.mjs — utilidades mínimas para bocetos ASCII (original para este documento)
export const h2 = (x, y, s = 0) => { let h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul(s|0, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export const vnoise = (x, y, s = 0) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf); const a=h2(xi,yi,s), b=h2(xi+1,yi,s), c=h2(xi,yi+1,s), d=h2(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; };
export const fbm = (x, y, oct, s = 0) => { let v = 0, a = 0.5; for (let i = 0; i < oct; i++) { v += a * vnoise(x, y, s + i); x = x*2.03+17.1; y = y*2.03-9.3; a *= 0.5; } return v; };
export const clamp = (v, a=0, b=1) => v < a ? a : v > b ? b : v;
export const smooth = (a, b, x) => { const t = clamp((x-a)/(b-a)); return t*t*(3-2*t); };
export const QUAD = [' ','▘','▝','▀','▖','▌','▞','▛','▗','▚','▐','▜','▄','▙','▟','█'];
export class Grid {
  constructor(w, h, fill = ' ') { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => Array(w).fill(fill)); }
  put(x, y, ch) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y][x] = ch; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.c[y][x] : ' '; }
  text(x, y, s) { [...s].forEach((ch, i) => { if (ch !== ' ') this.put(x + i, y, ch); }); }
  textAll(x, y, s) { [...s].forEach((ch, i) => this.put(x + i, y, ch)); }
  toString() { return this.c.map(r => r.join('').replace(/\s+$/, '')).join('\n'); }
}
// relleno de polígono por cobertura 2x2 → cuadrantes; `full` = glifo cuando la celda queda cubierta; `partial` = 'quad' | glifo
export function poly(g, pts, full = '█', partial = 'quad', only = null) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const inside = (px, py) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(g.h - 1, Math.ceil(y1)); y++)
    for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(g.w - 1, Math.ceil(x1)); x++) {
      let m = 0; if (inside(x + .25, y + .25)) m |= 1; if (inside(x + .75, y + .25)) m |= 2; if (inside(x + .25, y + .75)) m |= 4; if (inside(x + .75, y + .75)) m |= 8;
      if (!m) continue;
      if (only && !only(x, y)) continue;
      g.c[y][x] = m === 15 ? full : (partial === 'quad' ? QUAD[m] : partial);
    }
}
export function line(g, x0, y0, x1, y1, ch) { const n = Math.max(Math.abs(x1-x0), Math.abs(y1-y0)) * 2 + 1; for (let i = 0; i <= n; i++) g.put(x0 + (x1-x0)*i/n, y0 + (y1-y0)*i/n, ch); }
```

### A.1 · `scripts/ascii-tones.mjs`

Resultado (contrastes exactos de la tabla de §3.4; la prueba de celda confirma que la receta de 03 da una fila de `2·cw` solo para `cw` de 6 a 11 px):

```js
// A1-tones.mjs — 16 tonos Cobalto (OKLCH entre --glow-0..3), contrastes y comprobación del sistema de celda 2:1.
// Guardar como scripts/ascii-tones.mjs y ejecutar:  node scripts/ascii-tones.mjs
import { parseOklch, oklchToHex, contrast } from '../src/lib/color.mjs';
const G = ['oklch(0.13 0.05 268)', 'oklch(0.38 0.2 266)', 'oklch(0.66 0.22 258)', 'oklch(0.94 0.05 225)'];
const INK = 'oklch(0.96 0.01 250)', MUTED = 'oklch(0.77 0.04 255)', ACCENT_TEXT = 'oklch(0.82 0.13 250)';
const A = G.map(parseOklch), idx = [0, 5, 10, 15], T = [];
for (let k = 0; k < 16; k++) {
  let j = 0; for (let q = 0; q < 3; q++) if (k >= idx[q]) j = q;
  const t = (k - idx[j]) / (idx[j + 1] - idx[j]), a = A[j], b = A[j + 1];
  T.push(`oklch(${(a.L + (b.L - a.L) * t).toFixed(4)} ${(a.C + (b.C - a.C) * t).toFixed(4)} ${(a.h + (b.h - a.h) * t).toFixed(2)})`);
}
console.log('tono  hex      vs ink   vs muted  vs accent-text');
T.forEach((s, k) => console.log(String(k).padStart(2), oklchToHex(s), ...[INK, MUTED, ACCENT_TEXT].map((c) => contrast(c, s).toFixed(2).padStart(8))));
// Sistema de celda 2:1: con font-size = cw / 0,6 la receta de 03 da una fila de 2·cw solo para cw de 6 a 11 px
for (let cw = 5; cw <= 13; cw++) { const f = cw / 0.6, lh = Math.floor(1.3 * f) - 1; console.log(`cw ${cw}  fuente ${f.toFixed(3)}px  fila ${lh}px  ${lh === 2 * cw ? 'OK 2:1' : 'no cumple'}`); }
```

### A.2 · `cam.mjs` (cámara A)

Uso: `node cam.mjs 78 20 14,34,58,90` imprime los cuatro fotogramas y el coste. Los tres primeros bocetos de S3 salen de aquí.

```js
// cam.mjs — cámara ortográfica con cabeceo φ y objetivo z0 (la pieza central del concepto). Original para Gaya.
// Mundo: x al este, z al norte, h altura; unidades = anchos de celda; una fila = ASPECT (2) unidades.
import { Grid, poly, h2, fbm, clamp, smooth } from './kit.mjs';
export const ASPECT = 2;
export function makeWorld(seed = 1) {
  const boxes = [];
  const add = (x0, z0, w, d, h, kind = 'b') => boxes.push({ x0, z0, x1: x0 + w, z1: z0 + d, h, kind });
  for (let i = 0; i < 8; i++) for (let j = 0; j < 9; j++) {
    const x = 6 + i * 10, z = 7 + j * 9;
    if (x > 60 && x < 84 && z < 26) continue; if (i === 4 && j === 3) continue;            // Alcázar · parque Colón
    const hh = 2 + Math.floor(h2(i, j, 4 + seed) ** 1.6 * 8); add(x, z, 7 + Math.floor(h2(i, j, 5) * 2), 5 + Math.floor(h2(i, j, 6) * 2), hh);
  }
  add(36, 33, 13, 6, 9, 'cat'); add(38, 33.5, 4, 4, 17, 'torre'); add(62, 9, 14, 7, 6, 'alc'); add(70, 26, 8, 8, 7, 'for'); add(72, 28, 4, 4, 13, 'torre');
  add(89, 18, 22, 6, 5, 'faro'); add(97, 10, 6, 22, 5, 'faro');
  return { boxes, shoreZ: 2, riverX0: 82, riverX1: 88, zFar: 90 };
}
/** cámara: phiDeg 14→90; z0 (objetivo) 22→45; rowC (fila del objetivo) 0.66H→0.5H; yaw que se apaga al llegar al plano */
const Z0K = [[14, 22], [18, 22], [24, 18], [62, 10], [90, 4]];      // claves de objetivo (§2.3): la cámara se desliza al sur mientras baja la mirada
const z0At = (p) => { for (let i = 0; i < Z0K.length - 1; i++) { const [a, za] = Z0K[i], [b, zb] = Z0K[i + 1]; if (p <= b) return za + (zb - za) * clamp((p - a) / (b - a)); } return Z0K[Z0K.length - 1][1]; };
export const camAt = (phiDeg, H) => { const k = phiDeg / 90; return { phiDeg, z0: z0At(phiDeg), rowC: H * (0.66 - 0.16 * k), yawDeg: 22 * (1 - k) }; };
export function frame(world, W, H, phiDeg, opts = {}) {
  const g = new Grid(W, H), { z0, rowC, yawDeg } = camAt(phiDeg, H);
  const phi = phiDeg * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi), psi = yawDeg * Math.PI / 180, cs = Math.cos(psi), ss = Math.sin(psi), colC = W / 2 - 3;
  const P = (x, z, h) => { const xr = (x - 50) * cs + (z - z0) * ss, zr = -(x - 50) * ss + (z - z0) * cs; return [colC + xr, rowC - (h * cp + zr * sp) / ASPECT]; };
  const inv = (col, row) => { if (sp < 0.04) return null; const zr = (rowC - row) * ASPECT / sp, xr = col - colC; return [xr * cs - zr * ss + 50, xr * ss + zr * cs + z0]; };
  const { boxes, shoreZ, riverX0, riverX1 } = world; const zFar = 30 + 65 * smooth(14, 60, phiDeg);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const w = inv(x + .5, y + .5);
    if (!w || w[1] > zFar) { const n = h2(x, y, 9); g.c[y][x] = n > .988 ? '*' : n > .955 ? '·' : ' '; continue; }
    const [wx, wz] = w;
    if (wz < shoreZ) { g.c[y][x] = (fbm(x * .3, y * .9, 2, 3) > .54 && (x + y) % 2 === 0) ? '~' : ' '; continue; }
    if (wx > riverX0 && wx < riverX1) { g.c[y][x] = h2(x, y, 5) > .7 ? '~' : ' '; continue; }
    const sx = ((wx - 6) % 10 + 10) % 10, sz = ((wz - 7) % 9 + 9) % 9;
    g.c[y][x] = ((sx > 7.6 || sz > 6.6) && wx < riverX0 + 1 && wx > 3 && wz > 4) ? '·' : ' ';
  }
  const [fx, fy] = P(93, 21, 5);
  if (phiDeg < 70) for (let y = 0; y < fy - 1; y++) g.put(fx, y, '║');
  const list = boxes.filter(b => b.z0 < zFar).map(b => ({ b, key: -(-((b.x0 + b.x1) / 2 - 50) * ss + ((b.z0 + b.z1) / 2 - z0) * cs) })).sort((a, c) => a.key - c.key);
  for (const { b } of list) {
    const c = (x, z, h) => P(x, z, h);
    const front = [c(b.x0, b.z0, 0), c(b.x1, b.z0, 0), c(b.x1, b.z0, b.h), c(b.x0, b.z0, b.h)];
    const east = [c(b.x1, b.z0, 0), c(b.x1, b.z1, 0), c(b.x1, b.z1, b.h), c(b.x1, b.z0, b.h)];
    const top = [c(b.x0, b.z0, b.h), c(b.x1, b.z0, b.h), c(b.x1, b.z1, b.h), c(b.x0, b.z1, b.h)];
    if (cp > 0.03) { poly(g, front, '█'); if (ss > 0.02) poly(g, east, '▓'); }
    poly(g, top, b.kind === 'faro' ? '▒' : '░', 'quad');
  }
  return g;
}
if (process.argv[1]?.endsWith('cam.mjs')) {
  const W = +process.argv[2] || 84, H = +process.argv[3] || 22, world = makeWorld();
  for (const p of (process.argv[4] || '14,34,58,90').split(',').map(Number)) { const c = camAt(p, H); console.log(`\n── φ = ${p}°  ·  objetivo z0 = ${c.z0.toFixed(0)}  ·  guiñada ${c.yawDeg.toFixed(0)}° ──`); console.log(frame(world, W, H, p).toString()); }
  // coste (Node, escritorio, sin calentar el JIT más de 30 cuadros): 160×50 = 8 000 celdas
  const big = makeWorld(); for (let i = 0; i < 30; i++) frame(big, 160, 50, 40);
  for (const p of [14, 40, 90]) { const t0 = performance.now(); const N = 60; for (let i = 0; i < N; i++) frame(big, 160, 50, p); console.log(`coste 160×50 φ=${p}°: ${((performance.now() - t0) / N).toFixed(2)} ms/cuadro (Node 24, 1 hilo)`); }
}
```

### A.3 · `letters.mjs` (lettering «Carta 5×5»)

```js
// letters.mjs — tipografía propia «Carta 5×5» (original para Gaya). Mayúsculas sin tildes; el texto real conserva las tildes.
import { QUAD } from './kit.mjs';
const F = {
  A: ['.###.', '#...#', '#####', '#...#', '#...#'], B: ['####.', '#...#', '####.', '#...#', '####.'], C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'], E: ['#####', '#....', '###..', '#....', '#####'], F: ['#####', '#....', '###..', '#....', '#....'],
  G: ['.####', '#....', '#..##', '#...#', '.###.'], H: ['#...#', '#...#', '#####', '#...#', '#...#'], I: ['#####', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '#..#.', '.##..'], K: ['#...#', '#..#.', '###..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'], O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'], Q: ['.###.', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..'], U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'], Z: ['#####', '...#.', '..#.', '.#...', '#####'],
};
F.Z = ['#####', '...#.', '..#..', '.#...', '#####'];
const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
// bitmap de una línea de texto: array de filas de 0/1, con 1 px de espacio entre letras y 3 px entre palabras
export function bitmap(text) {
  const rows = ['', '', '', '', '', ''];
  for (const ch of norm(text)) {
    if (ch === ' ') { for (let r = 0; r < 6; r++) rows[r] += '..'; continue; }
    const g = F[ch]; if (!g) continue;
    for (let r = 0; r < 5; r++) rows[r] += g[r] + '.';
    rows[5] += '......';
  }
  return rows.map((r) => [...r].map((c) => (c === '#' ? 1 : 0)));
}
// «half»: 1 px = 1 celda de ancho × media fila (▀▄█); «quad»: 1 px = media celda × media fila (cuadrantes)
export function render(text, mode = 'half') {
  const b = bitmap(text), H = b.length, W = b[0].length, out = [];
  if (mode === 'half') {
    for (let y = 0; y < H; y += 2) { let s = ''; for (let x = 0; x < W; x++) { const t = b[y][x], u = b[y + 1]?.[x] ?? 0; s += t && u ? '█' : t ? '▀' : u ? '▄' : ' '; } out.push(s.replace(/\s+$/, '')); }
  } else {
    for (let y = 0; y < H; y += 2) { let s = ''; for (let x = 0; x < W; x += 2) { const m = (b[y][x] ? 1 : 0) | (b[y][x + 1] ? 2 : 0) | ((b[y + 1]?.[x]) ? 4 : 0) | ((b[y + 1]?.[x + 1]) ? 8 : 0); s += QUAD[m]; } out.push(s.replace(/\s+$/, '')); }
  }
  return out;
}
export const width = (text, mode) => Math.max(...render(text, mode).map((r) => r.length));
if (process.argv[1]?.endsWith('letters.mjs')) {
  for (const t of ['GAYA', 'Web y apps', 'Proceso', 'Automatización e IA', 'Infraestructura']) {
    console.log(`\n«${t}»  half=${width(t, 'half')} cols · quad=${width(t, 'quad')} cols`); console.log(render(t, 'half').join('\n')); console.log(); console.log(render(t, 'quad').join('\n'));
  }
  const all = ['Quiénes somos', 'Who we are', 'Desarrollo web y apps', 'Web and app development', 'Automatización e IA', 'Automation and AI', 'Marketing digital y redes', 'Digital marketing and social media', 'Soporte e infraestructura IT', 'IT support and infrastructure', 'Referencias', 'References', 'Proceso', 'Process', 'Contacto', 'Contact', 'Pon tu negocio en el mapa', 'Put your business on the map'];
  console.log('\nanchos (cols) por título   half  quad  | palabra más larga half/quad');
  for (const t of all) { const w = t.split(' ').map((p) => [width(p, 'half'), width(p, 'quad')]); console.log(t.padEnd(38), String(width(t, 'half')).padStart(4), String(width(t, 'quad')).padStart(5), ' |', Math.max(...w.map((x) => x[0])), Math.max(...w.map((x) => x[1]))); }
}
```

### A.4 · `emblems.mjs` (14 emblemas de sector)

```js
// emblems.mjs — 14 emblemas de sector (letreros de la calle de las referencias). 11×5 celdas. Originales para Gaya.
export const E = {
  utensils: ['  ╻ ╻ ╻ ╭╮ ', '  ┗┳┻┳┛ ││ ', '    ┃   ││ ', '    ┃   ││ ', '    ╹   ╹╹ '],
  'hard-hat': ['   ▄▄███▄▄  ', '  ▟███████▙ ', ' ▟█████████▙', ' ▀▀▀▀▀▀▀▀▀▀▀', '            '],
  'app-window': [' ╭─────────╮', ' │ ▚▚  ▚▚  │', ' │ ▚▚  ▚▚  │', ' │  ▚▚▚▚▚▚ │', ' ╰─────────╯'],
  smile: ['  ▟█▙ ▟█▙  ', '  ▜████▛   ', '   ▜█▛▜█▛  ', '    █▌ ▐█  ', '    ▀▘ ▝▀  '],
  scissors: ['  ╲     ╱  ', '   ╲   ╱   ', '    ╲ ╱    ', '   ╭─╳─╮   ', '   ╰o╯╰o╯  '],
  sailboat: ['     │╲     ', '     │▒╲    ', '   ──┼▒▒▒╲  ', '   ╲_______╱', '  ~ ~ ~ ~ ~ '],
  scale: ['     ╷      ', '  ───┼───   ', '  ╱╲ │ ╱╲   ', '  ╰╯ │ ╰╯   ', '    ─┴─     '],
  library: [' ▐▌▐▌▐▌▟▌▐▌ ', ' ▐▌▐▌▐▌▐▌▐▌ ', ' ▐▌▐▌▐▌▐▌▐▌ ', ' ▐▌▐▌▐▌▐▌▐▌ ', ' ▀▀▀▀▀▀▀▀▀▀ '],
  'shopping-bag': ['    ╭───╮   ', '  ┌─┴───┴─┐ ', '  │       │ ', '  │       │ ', '  └───────┘ '],
  leaf: ['     ▗▄▄▟▙ ', '   ▗▟████▛ ', '  ▟████▛▘  ', ' ▟███▛▘    ', ' ▀▀▘       '],
  coffee: ['   ) ) )   ', '  ▄▄▄▄▄▄▄╮ ', '  █████▄ │ ', '  ▀▀▀▀▀▀▀╯ ', ' ▔▔▔▔▔▔▔▔▔ '.replace(/▔/g, '_')],
  dumbbell: [' ▗▖      ▗▖ ', ' ▐▌▄▄▄▄▄▄▐▌ ', ' ▐▌▀▀▀▀▀▀▐▌ ', ' ▝▘      ▝▘ ', '            '],
  camera: ['   ╭───╮   ', ' ▄▄█████▄▄ ', ' █  ╭─╮  █ ', ' █  ╰─╯  █ ', ' ▀▀▀▀▀▀▀▀▀ '],
  'building-2': ['  ▄▄▄▄▄▄▄  ', '  █▘▝█▘▝█  ', '  █▖▗█▖▗█  ', '  █▘▝█▘▝█  ', '  ▀▀▀▀▀▀▀  '],
};
if (process.argv[1]?.endsWith('emblems.mjs')) {
  const names = Object.keys(E);
  for (let i = 0; i < names.length; i += 5) {
    const grp = names.slice(i, i + 5);
    console.log(grp.map((n) => n.padEnd(14)).join(''));
    for (let r = 0; r < 5; r++) console.log(grp.map((n) => (E[n][r] ?? '').padEnd(14)).join(''));
    console.log();
  }
  const bad = /[→←■□●○◆◇▲▶★≈≠≤≥✓✗⠀-⣿▔]/u; for (const n of names) for (const r of E[n]) if (bad.test(r) || [...r].length > 12) console.log('REVISAR', n, r, [...r].length);
}
```

### A.5 · `islands3.mjs` (terreno con achurado y cuatro islas)

Uso: `node islands3.mjs` imprime las cuatro islas de S5–S8.

```js
// islands3.mjs — las cuatro islas con achurado (versión que va al documento). Original para Gaya.
import { Grid, h2, fbm, line } from './kit.mjs';
const W = 64, H = 20;
function base(seed, cx, cy, rx, ry, flat = null, mountain = 1) {
  const g = new Grid(W, H);
  const hgt = (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, r = Math.hypot(dx, dy); return (1 - r) + (fbm(x * .10, y * .20, 3, seed) - .5) * .8 + (fbm(x * .3, y * .6, 2, seed + 5) - .5) * .12 * mountain; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = hgt(x, y);
    if (v > 0.10) {
      if (flat && x >= flat[0] && x <= flat[1] && y >= flat[2] && y <= flat[3]) { g.c[y][x] = '·'; continue; }
      const gx = (hgt(x + 1, y) - hgt(x - 1, y)) / 2, gy = (hgt(x, y + 1) - hgt(x, y - 1)) / 2 * 0.5, m = Math.hypot(gx, gy) * 9, ang = Math.atan2(gy, gx);
      let ch = '·';
      if (m > 0.55) { const a = ((ang % Math.PI) + Math.PI) % Math.PI; ch = (a < Math.PI / 8 || a > 7 * Math.PI / 8) ? '-' : a < 3 * Math.PI / 8 ? '\\' : a < 5 * Math.PI / 8 ? '|' : '/'; }
      else if (m > 0.30) ch = h2(x, y, seed) > .5 ? ':' : '·';
      if (v > 0.62 && m < 0.5) ch = '▒';
      g.c[y][x] = ch;
    } else if (v > 0.02) g.c[y][x] = (x + y) % 2 ? '~' : '-';
    else if (v > -0.10) g.c[y][x] = ((x * 2 + y) % 6 === 0) ? '~' : ' ';
    else g.c[y][x] = h2(x, y, seed) > .985 ? '~' : ' ';
  }
  return g;
}
const show = (t, g) => console.log(`\n── ${t} ──\n${g.toString()}`);
const stamp = (g, x, y, rows) => rows.forEach((r, i) => g.textAll(x, y + i, r));
const clear = (g, x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!'~- '.includes(g.c[y][x])) g.c[y][x] = ' '; };
{ const g = base(3, 32, 10, 25, 7, [13, 51, 5, 15]);
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 5; bx++) { const x0 = 15 + bx * 7, y0 = 7 + by * 3; if (by === 1 && bx === 2) continue; stamp(g, x0, y0, ['▄▄▄▄▄', '▀▀▀▀▀']); }
  stamp(g, 28, 9, ['╭────╮', '│▄▄▄▄│', '╰─▄▄─╯']); stamp(g, 29, 6, ['(@)', ' ╵ ']); g.text(24, 8, '.·:·.'); g.text(35, 8, '.·:·.'); g.text(22, 12, '·.:.:.:.:.:.·');
  show('A · Web y apps — «El Local»', g); }
{ const g = base(9, 32, 10, 25, 7, [8, 56, 3, 14]);
  const rail = (x0, y0, x1) => { for (let x = x0; x <= x1; x++) g.put(x, y0, (x - x0) % 4 === 3 ? '┼' : '─'); };
  rail(9, 5, 24); g.put(25, 5, '╮'); g.put(25, 6, '│'); g.put(25, 7, '╰'); rail(26, 7, 29); g.put(30, 7, '┬');
  g.put(30, 8, '├'); rail(31, 8, 46); g.put(30, 9, '│'); g.put(30, 10, '├'); rail(31, 10, 46); g.put(30, 11, '│'); g.put(30, 12, '╰'); rail(31, 12, 40);
  stamp(g, 15, 8, ['╭───╮', '│╲  │', '│ ╲ │', '╰───╯']); g.put(17, 10, 'o');
  g.text(11, 4, '▄▄'); g.text(16, 4, '▄▄'); g.text(34, 7, '▄▄'); g.text(41, 9, '▄▄'); g.text(35, 11, '▄▄');
  stamp(g, 48, 11, ['╭─╮', '│▄│', '╰─╯']); g.text(42, 12, '· · ·'); g.text(47, 12, '·');
  show('B · Automatización e IA — «El Cruce»', g); }
{ const g = base(17, 30, 10, 11, 4, null, 2);
  const cx = 30, cy = 9;
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 8; r < 36; r += 1.4) { const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r / 2; if (g.get(Math.round(x), Math.round(y)) === ' ') g.put(x, y, (k % 4 === 0) ? '·' : (r % 2.8 < 1.4 ? '.' : ' ')); } }
  const lane = (pts, ch) => { for (let i = 0; i < pts.length - 1; i++) line(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ch); };
  lane([[3, 2], [14, 5], [24, 8]], '·'); lane([[5, 17], [16, 14], [25, 11]], '·'); lane([[60, 3], [48, 6], [38, 9]], '·'); lane([[58, 17], [48, 14], [38, 11]], '·');
  lane([[24, 8], [27, 9]], ':'); lane([[25, 11], [27, 10]], ':'); lane([[38, 9], [35, 9]], ':'); lane([[38, 11], [35, 10]], ':');
  for (const [x, y] of [[9, 3], [19, 6], [11, 16], [21, 12], [52, 5], [43, 7], [52, 15], [44, 12]]) g.text(x, y, '<>');
  stamp(g, 28, 8, ['╭─╮', '│@│', '╰─╯']);
  for (let r = 3; r < 20; r++) for (let d = -1; d <= 1; d++) { const x = 32 + r * 1.3, y = 9.5 - r * 0.28 + d * r * 0.17; if (x < W - 1) g.put(x, y, r < 7 ? '▓' : r < 11 ? '▒' : r < 15 ? '=' : ':'); }
  show('C · Marketing digital y redes — «La Señal»', g); }
{ const g = base(23, 32, 10, 25, 7, [8, 56, 3, 16]);
  for (let y = 0; y < 5; y++) g.put(8, y, y % 2 ? '│' : '┼'); g.put(8, 5, '╰'); for (let x = 9; x < 20; x++) g.put(x, 5, x % 3 === 0 ? '+' : '─'); stamp(g, 20, 4, ['[#]']);
  for (let x = 23; x < 36; x++) g.put(x, 5, '─'); g.put(36, 5, '┬');
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 5; bx++) { const x0 = 14 + bx * 8, y0 = 8 + by * 3; const dark = bx < 2 && by !== 1; for (let i = 0; i < 3; i++) g.put(x0 + i * 2, y0, dark ? ' ' : 'o'); }
  stamp(g, 40, 12, ['╭──────╮', '│▐▌▐▌▐▌│', '│ (o)  │', '╰──────╯']);
  for (let a = 0; a < 18; a++) { const t = a / 18 * Math.PI * 2; g.put(44 + Math.cos(t) * 9, 13.5 + Math.sin(t) * 4.2, '.'); }
  stamp(g, 57, 1, ['[▓]']); for (let y = 2; y < 9; y++) g.put(58, y, '·');
  show('D · Soporte e infraestructura IT — «La Planta»', g); }
```

### A.6 · `tile.mjs` (cielo líquido)

Uso: `node tile.mjs` mide el horneado de la tesela y el coste por cuadro, e imprime los dos cuadros `t = 0` y `t = 6 s` de §8.5.

```js
// tile.mjs — «cielo líquido» con una tesela periódica de 64×64 y dos capas desplazadas (truco de agua de dos capas). Original.
import { h2, clamp } from './kit.mjs';
const P = 64;
// ruido de valor periódico (entero, determinista): la retícula envuelve en `per` celdas
const pv = (x, y, per, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(((xi % per) + per) % per, ((yi % per) + per) % per, s), b = h2((((xi + 1) % per) + per) % per, ((yi % per) + per) % per, s), c = h2(((xi % per) + per) % per, (((yi + 1) % per) + per) % per, s), d = h2((((xi + 1) % per) + per) % per, (((yi + 1) % per) + per) % per, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
export function bakeTile(seed = 11) {
  const T = new Uint8Array(P * P);
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
    let n = 0, a = 0.5, per = 4;
    for (let o = 0; o < 3; o++) { n += a * pv(x / P * per, y / P * per, per, seed + o); a *= .5; per *= 2; }
    const q = pv(x / P * 4 + 3.1, y / P * 4 - 1.7, 4, seed + 9);                 // deformación de baja frecuencia
    const m = n + 0.25 * (q - .5);
    const ridge = 1 - Math.abs(2 * m - 1.0);                                    // cresta = filamento
    T[y * P + x] = Math.round(clamp(Math.pow(ridge, 5)) * 255);
  }
  return T;
}
const bil = (T, x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, x0 = xi & 63, y0 = yi & 63, x1 = (xi + 1) & 63, y1 = (yi + 1) & 63;
  const a = T[y0 * P + x0], b = T[y0 * P + x1], c = T[y1 * P + x0], d = T[y1 * P + x1]; return (a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf) / 255; };
/** densidad 0..1 de la celda (c,r) en el instante t: dos capas de la misma tesela a escalas y velocidades distintas */
export function liquid(T, c, r, t, cols) {
  const u = c / cols * 1.0, v = r * 2 / cols;                                   // espacio cuadrado (celda 1:2)
  const a = bil(T, u * 28 + t * 0.5, v * 60 - t * 0.4), b = bil(T, u * 17 - t * 0.3 + 17, v * 38 + t * 0.25 + 5);
  return clamp(a * (0.4 + 0.6 * b) * 1.3);
}
if (process.argv[1]?.endsWith('tile.mjs')) {
  const t0 = performance.now(); const T = bakeTile(); console.log(`hornear tesela 64×64: ${(performance.now() - t0).toFixed(1)} ms (Node 24, 1.ª vez, sin calentar)`);
  const cols = 160, rows = 28, ramp = ' ·:=*yaAG▒';
  for (let i = 0; i < 40; i++) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) liquid(T, c, r, i * .1, cols);
  const t1 = performance.now(); const N = 200; let acc = 0; for (let i = 0; i < N; i++) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) acc += liquid(T, c, r, i * .05, cols);
  console.log(`cielo ${cols}×${rows} = ${cols * rows} celdas: ${((performance.now() - t1) / N).toFixed(3)} ms/cuadro (Node 24, escritorio; ×4 como proxy de A07 = ${(((performance.now() - t1) / N) * 4).toFixed(2)} ms)   [${acc | 0}]`);
  for (const tt of [0, 6]) { console.log(`\n── t = ${tt} s (mismo tramo de cielo, 100×14) ──`); for (let r = 0; r < 14; r++) { let s = ''; for (let c = 0; c < 100; c++) { const d = liquid(T, c, r, tt, 100) * (0.35 + 0.75 * (r / 13)); s += d < .07 ? ' ' : d < .17 ? '·' : d < .30 ? ':' : d < .43 ? '=' : d < .56 ? '*' : d < .68 ? 'y' : d < .78 ? 'a' : d < .86 ? 'A' : d < .93 ? 'G' : '▒'; } console.log(s.replace(/\s+$/, '')); } }
}
```

### A.7 · `camP.mjs` (cámara B, perspectiva)

Depende de `cam.mjs` (el mundo), `tile.mjs` (el cielo), `stars.mjs` (opcional) y de estos dos archivos pequeños:

`util.mjs` (ruido entero y ayudas):

```js
// util.mjs — ruido determinista y ayudas (original; solo enteros para paridad)
export function h2(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct, s = 0) {
  let v = 0, a = 0.5;
  for (let i = 0; i < oct; i++) { v += a * vnoise(x, y, s + i); x = x * 2.03 + 17.1; y = y * 2.03 - 9.3; a *= 0.5; }
  return v;
}
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;
```

`grid-tono.mjs` (celda con glifo y dos tonos):

```js
// grid-tono.mjs — celda con glifo, tono de tinta y tono de fondo (el «Grid» del prototipo; el de 05 §3.1 es su versión de 4 bytes por celda).
export const HEX = ['#02051b','#040c34','#07134f','#0b1b6c','#0f238a','#122caa','#143fbf','#1753d4','#1c66ea','#2179ff','#4390ff','#52a7ff','#6bbdff','#88d0ff','#abe2ff','#d1f1ff'];

export class Grid {
  constructor(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.g = new Array(cols * rows).fill(' ');
    this.fg = new Uint8Array(cols * rows);
    this.bg = new Uint8Array(cols * rows);
    this.set = new Uint8Array(cols * rows);   // 1 = la capa tocó la celda
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows; }
  put(x, y, ch, fg, bg = -1) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inb(x, y)) return;
    const i = y * this.cols + x;
    this.g[i] = ch; this.fg[i] = fg; if (bg >= 0) this.bg[i] = bg; this.set[i] = 1;
  }
  bgAt(x, y, bg) { x = Math.round(x); y = Math.round(y); if (this.inb(x, y)) { const i = y * this.cols + x; this.bg[i] = bg; this.set[i] = 1; } }
  tone(x, y, fg) { x = Math.round(x); y = Math.round(y); if (this.inb(x, y)) this.fg[y * this.cols + x] = fg; }
  get(x, y) { return this.inb(x, y) ? this.g[y * this.cols + x] : ' '; }
  text(x, y, s, fg, bg = -1) { for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.put(x + i, y, s[i], fg, bg); }
  fillBg(x0, y0, w, h, bg) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.bgAt(x, y, bg); }
  toText() { const o = []; for (let y = 0; y < this.rows; y++) o.push(this.g.slice(y * this.cols, (y + 1) * this.cols).join('').replace(/\s+$/, '')); return o.join('\n'); }
  blit(src, dx, dy) { for (let y = 0; y < src.rows; y++) for (let x = 0; x < src.cols; x++) { const j = y * src.cols + x; if (!src.set[j]) continue; const X = x + dx, Y = y + dy; if (!this.inb(X, Y)) continue; const i = Y * this.cols + X; this.g[i] = src.g[j]; this.fg[i] = src.fg[j]; this.bg[i] = src.bg[j]; this.set[i] = 1; } }
}
```

`camP.mjs`:

```js
// camP.mjs — CÁMARA B: perspectiva y cabeceo φ sobre el mundo de cajas de cam.mjs (variante probada del concepto). Original para Gaya.
// Mundo: x al este, z al norte, h hacia arriba; unidad = ancho de una celda; una fila = 2 unidades (ASPECT).
// Pantalla en subpíxeles 2×2 por celda (cuadrantes). El suelo se calcula por rayo inverso («Mode 7»); las cajas por proyección + pintor.
import { Grid } from './grid-tono.mjs';
import { h2, fbm, clamp, mix, smooth } from './util.mjs';
import { makeWorld } from './cam.mjs';
import { bakeTile, liquid } from './tile.mjs';
import { skyAt } from './stars.mjs';

export const ASPECT = 2;
const QUAD = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];
const K = { LAND: 0, SEA: 1, RIVER: 2, STREET: 3, QUAY: 4, LAMP: 5 };
const GT = [0, 1, 1, 4, 8, 11]; // tono de cada clase de suelo
const SKYRAMP = ' ·:=*yaAG'.split('');

export function groundClass(X, Z) {
  if (Z < 2) return K.SEA;
  if (Z < 3.4) return X % 6 < 0.8 ? K.LAMP : K.QUAY; // Malecón
  if (X > 82 && X < 88) return K.RIVER;
  if (X >= 88) { const gx = (X - 90) % 16, gz = Z % 16; return gx < 2 || gz < 2 ? K.STREET : K.LAND; }
  const sx = (((X - 6) % 10) + 10) % 10, sz = (((Z - 7) % 9) + 9) % 9;
  return (sx > 7.6 || sz > 6.6) && X > 3 && Z > 4 ? K.STREET : K.LAND;
}

// claves de cámara (φ en grados → altura H, distancia z de la cámara, fila del objetivo). Entre claves: interpolación suave.
export const KEYS = [
  { phi: 4, H: 8, z: -26, cy: 0.72, vs: 1.8 },
  { phi: 14, H: 14, z: -24, cy: 0.66, vs: 1.6 },
  { phi: 24, H: 22, z: -22, cy: 0.62, vs: 1.4 },
  { phi: 40, H: 34, z: -16, cy: 0.57, vs: 1.2 },
  { phi: 65, H: 50, z: -6, cy: 0.52, vs: 1.0 },
  { phi: 90, H: 60, z: 4, cy: 0.5, vs: 1.0 },
];
export function camAt(phiDeg, { hfov = 90, x = 62 } = {}) {
  let i = 0;
  while (i < KEYS.length - 2 && phiDeg > KEYS[i + 1].phi) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = clamp((phiDeg - a.phi) / (b.phi - a.phi));
  const e = t * t * (3 - 2 * t);
  return { phi: (phiDeg * Math.PI) / 180, H: mix(a.H, b.H, e), z: mix(a.z, b.z, e), cyFrac: mix(a.cy, b.cy, e), vs: mix(a.vs, b.vs, e), hfov, x };
}
function setup(cam, sw, sh) {
  cam.f = sw / 2 / Math.tan((cam.hfov * Math.PI) / 360);
  cam.cx = sw / 2;
  cam.cy = cam.cyFrac * sh;
  cam.sp = Math.sin(cam.phi);
  cam.cp = Math.cos(cam.phi);
}
export function proj(cam, X, h, Z) {
  const xw = X - cam.x, zw = Z - cam.z, y = cam.H - h;
  const yc = y * cam.cp - zw * cam.sp, zc = y * cam.sp + zw * cam.cp;
  if (zc < 0.6) return null;
  return [cam.cx + (cam.f * xw) / zc, cam.cy + (cam.f * yc) / (zc * ASPECT), zc];
}
function fillQuad(fb, pts, fn) {
  if (pts.some((p) => !p)) return;
  let vmin = 1e9, vmax = -1e9;
  for (const p of pts) { vmin = Math.min(vmin, p[1]); vmax = Math.max(vmax, p[1]); }
  const { sw, sh } = fb;
  for (let v = Math.max(0, Math.ceil(vmin)); v <= Math.min(sh - 1, Math.floor(vmax)); v++) {
    let uL = 1e9, uR = -1e9;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= v && b[1] >= v) || (b[1] <= v && a[1] >= v)) {
        if (a[1] === b[1]) { uL = Math.min(uL, a[0], b[0]); uR = Math.max(uR, a[0], b[0]); }
        else { const t = (v - a[1]) / (b[1] - a[1]), u = a[0] + (b[0] - a[0]) * t; uL = Math.min(uL, u); uR = Math.max(uR, u); }
      }
    }
    if (uL > uR) continue;
    for (let u = Math.max(0, Math.ceil(uL)); u <= Math.min(sw - 1, Math.floor(uR)); u++) fn(u, v, (u - uL) / Math.max(1e-6, uR - uL), (v - vmin) / Math.max(1e-6, vmax - vmin));
  }
}

let TILE = null;
export function renderFrame(world, cols, rows, phiDeg, { hfov = 90, t = 21.7, date = null, sky = true, x = 62 } = {}) {
  const cam = camAt(phiDeg, { hfov, x });
  const sw = cols * 2, sh = rows * 2;
  setup(cam, sw, sh);
  const tone = new Uint8Array(sw * sh), cls = new Uint8Array(sw * sh), gxA = new Float32Array(sw * sh), gzA = new Float32Array(sw * sh);
  const fb = { sw, sh, tone, cls };
  const glowT = 4;
  for (let v = 0; v < sh; v++) {
    const vp = (v - cam.cy) * ASPECT;
    for (let u = 0; u < sw; u++) {
      const i = v * sw + u, dy = vp * cam.cp + cam.f * cam.sp;
      if (dy <= 1e-6) { cls[i] = 255; continue; }
      const dz = -vp * cam.sp + cam.f * cam.cp, k = cam.H / dy;
      const X = cam.x + k * (u - cam.cx), Z = cam.z + k * dz, depth = k * cam.f;
      gxA[i] = X; gzA[i] = Z;
      const c = groundClass(X, Z), fog = smooth(50, 330, depth);
      cls[i] = c + 100;
      tone[i] = Math.round(mix(GT[c], Math.max(GT[c], glowT), fog * 0.92));
    }
  }
  const list = world.boxes.map((b) => ({ b, d: Math.hypot((b.x0 + b.x1) / 2 - cam.x, (b.z0 + b.z1) / 2 - cam.z) })).sort((a, c) => c.d - a.d);
  for (const { b, d } of list) {
    const fog = smooth(40, 300, d), base = b.kind === 'faro' ? 3 : 0, bh = b.h * cam.vs;
    const front = [proj(cam, b.x0, 0, b.z0), proj(cam, b.x1, 0, b.z0), proj(cam, b.x1, bh, b.z0), proj(cam, b.x0, bh, b.z0)];
    const top = [proj(cam, b.x0, bh, b.z0), proj(cam, b.x1, bh, b.z0), proj(cam, b.x1, bh, b.z1), proj(cam, b.x0, bh, b.z1)];
    const side = cam.x > b.x1 ? [proj(cam, b.x1, 0, b.z0), proj(cam, b.x1, 0, b.z1), proj(cam, b.x1, bh, b.z1), proj(cam, b.x1, bh, b.z0)]
      : cam.x < b.x0 ? [proj(cam, b.x0, 0, b.z0), proj(cam, b.x0, 0, b.z1), proj(cam, b.x0, bh, b.z1), proj(cam, b.x0, bh, b.z0)] : null;
    if (side) fillQuad(fb, side, (u, v) => { const i = v * sw + u; tone[i] = Math.round(mix(base + 1, glowT, fog * 0.9)); cls[i] = 251; });
    fillQuad(fb, top, (u, v) => { const i = v * sw + u; tone[i] = Math.round(mix(base + 2 + (b.kind === 'faro' ? 3 : 0), glowT, fog * 0.85)); cls[i] = 252; });
    if (cam.cp > 0.03) fillQuad(fb, front, (u, v, s, tv) => {
      const i = v * sw + u; let tn = Math.round(mix(base, glowT, fog * 0.9));
      if (d < 130 && b.kind !== 'faro') {
        const wx = Math.floor(s * (b.x1 - b.x0) * 0.9), wy = Math.floor((1 - tv) * bh * 0.55);
        if (wx % 2 === 0 && wy % 2 === 0 && h2(wx + b.x0 * 7, wy + b.z0 * 3, 41) < 0.22) tn = 8;
      }
      tone[i] = tn; cls[i] = 250;
    });
  }
  // subpíxeles → celdas
  const ground = new Grid(cols, rows);
  const horizonV = cam.cy - (cam.f * Math.tan(cam.phi)) / ASPECT, horizon = Math.round(horizonV / 2);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i0 = r * 2 * sw + c * 2, idx = [i0, i0 + 1, i0 + sw, i0 + sw + 1];
    const ts = idx.map((i) => tone[i]), cs = idx.map((i) => cls[i]);
    if (cs.every((q) => q === 255)) continue;
    const nWater = cs.filter((q) => q === K.SEA + 100 || q === K.RIVER + 100).length;
    if (nWater >= 3) { // agua: oleaje tenue; el reflejo lo pone la capa de cielo/lente
      const X = gxA[idx[3]], Z = gzA[idx[3]], h = fbm(X * 0.07, Z * 0.05, 3, 1);
      ground.bgAt(c, r, Math.max(1, ts[3]));
      const w = h2(Math.floor(X * 0.5), Math.floor(Z * 0.5), 5);
      if (h > 0.55 && w > 0.45) ground.put(c, r, w > 0.8 ? '=' : w > 0.6 ? '~' : '-', 3);
      continue;
    }
    if (cs[0] >= 250 && cs.every((q) => q === cs[0])) { ground.put(c, r, cs[0] === 250 ? '█' : cs[0] === 251 ? '▓' : '░', Math.max(...ts), Math.min(...ts)); continue; }
    let lo = 99, hi = -1; for (const q of ts) { lo = Math.min(lo, q); hi = Math.max(hi, q); }
    if (lo === hi) { ground.bgAt(c, r, lo); continue; }
    const mid = (lo + hi) / 2; let m = 0;
    if (ts[0] > mid) m |= 1; if (ts[1] > mid) m |= 2; if (ts[2] > mid) m |= 4; if (ts[3] > mid) m |= 8;
    ground.put(c, r, QUAD[m], hi, lo);
  }
  const g = new Grid(cols, rows);
  if (sky && horizon > 5) paintSky(g, cam, cols, rows, horizon, date, t);
  g.blit(ground, 0, 0);
  return { grid: g, horizon, cam };
}

function paintSky(g, cam, cols, rows, horizon, date, t) {
  TILE = TILE || bakeTile();
  const beam = proj(cam, 93, 5, 21), top = proj(cam, 93, 140, 21);
  for (let y = 0; y < Math.min(rows, horizon + 1); y++) for (let x = 0; x < cols; x++) {
    const tone = (yy) => clamp(0.1 + 3.9 * Math.pow(clamp(yy / Math.max(1, horizon)), 2.4) * (0.55 + 0.6 * Math.exp(-Math.pow((x - cols * 0.6) / (cols * 0.45), 2))), 0, 15);
    const up = Math.round(tone(y + 0.25)), dn = Math.round(tone(y + 0.75));
    g.bgAt(x, y, up); if (dn !== up) g.put(x, y, '▄', dn, up);
  }
  // luz líquida: cintas hacia el horizonte; silenciosa en el tercio izquierdo (pozo de lectura)
  for (let y = 0; y < horizon - 1; y++) for (let x = 0; x < cols; x++) {
    const f = y / Math.max(1, horizon), quiet = smooth(0.05, 0.5, x / cols);
    let d = liquid(TILE, x, y, t, cols) * (0.2 + 0.9 * f) * (0.25 + 0.75 * quiet) * (1 - 0.55 * smooth(0.86, 1, f));
    d = clamp(d + (h2(x, y, 3) - 0.5) * 0.05);
    const ch = SKYRAMP[Math.min(SKYRAMP.length - 1, (d * SKYRAMP.length) | 0)];
    if (ch !== ' ') g.put(x, y, ch, clamp(Math.round(3 + d * 8 + f), 3, 11));
  }
  if (date) {
    const degPerCol = 110 / cols, degPerRow = degPerCol * 2;
    for (const s of skyAt(date)) {
      const da = ((s.az + 540) % 360) - 180, x = Math.round(cols / 2 + da / degPerCol), y = Math.round(horizon - 0.5 - s.alt / degPerRow);
      if (x < 1 || x >= cols - 1 || y < 0 || y >= horizon - 1) continue;
      g.put(x, y, s.mag < 0.8 ? '*' : s.mag < 1.8 ? '+' : s.mag < 2.6 ? '·' : '.', s.mag < 0.8 ? 15 : 13);
    }
  }
  if (beam && top) { // cruz de luz del Faro: haz vertical y brazo horizontal; la lente en el cruce
    const bx = beam[0] / 2, by = beam[1] / 2, ty = top[1] / 2;
    for (let y = Math.max(0, Math.floor(ty)); y < by; y++) { const k = (y - ty) / Math.max(1, by - ty), tn = clamp(Math.round(6 + 7 * k), 6, 14); g.put(bx - 1, y, '░', Math.max(4, tn - 4)); g.put(bx, y, '║', tn); g.put(bx + 1, y, '░', Math.max(4, tn - 4)); }
    const ay = Math.round(ty + (by - ty) * 0.3), armW = Math.max(6, Math.round((by - ty) * 0.9));
    for (let dx = -armW; dx <= armW; dx++) g.put(bx + dx, ay, dx === 0 ? '█' : '═', clamp(Math.round(5 + 8 * (1 - Math.abs(dx) / (armW + 1))), 5, 14));
    g.put(bx - 2, ay, '(', 14); g.put(bx + 2, ay, ')', 14); g.put(bx, ay - 1, '▄', 15); g.put(bx, ay + 1, '▀', 15);
  }
}
```

### A.8 · `stars.mjs` (cielo real)

```js
// stars.mjs — cielo real sobre Santo Domingo (alt/az). Datos APROXIMADOS de prototipo (RA h, Dec °, mag): en producción salen del catálogo (Yale BSC, CDS V/50).
import { TAU } from './util.mjs';
export const LAT = 18.4625,
  LON = -69.9361; // Santo Domingo, 18°27′45″ N 69°56′10″ O (Wikipedia), en ° N y ° E
export const STARS = [ // prototipo: 58 estrellas aproximadas (nombre, RA en horas, Dec en grados, magnitud). Producción: extracto del BSC V/50.
  ['Sirius', 6.7525, -16.716, -1.46], ['Canopus', 6.3992, -52.696, -0.74], ['Arcturus', 14.261, 19.182, -0.05], ['Vega', 18.6156, 38.784, 0.03],
  ['Capella', 5.2782, 45.998, 0.08], ['Rigel', 5.2423, -8.202, 0.13], ['Polaris', 2.5303, 89.264, 1.98], ['Dubhe', 11.0621, 61.751, 1.79], // … 51 más
];
const D2R = Math.PI / 180;
export function julian(dateUTC) {
  return dateUTC.getTime() / 86400000 + 2440587.5;
}
// tiempo sidéreo medio de Greenwich (horas) — fórmula aproximada del USNO: 18.697374558 + 24.06570982441908·D
export function gmstHours(jd) {
  const D = jd - 2451545.0;
  return (((18.697374558 + 24.06570982441908 * D) % 24) + 24) % 24;
}
export function altAz(raH, decDeg, jd, lat = LAT, lon = LON) {
  const lst = (((gmstHours(jd) + lon / 15) % 24) + 24) % 24; // horas
  const H = (lst - raH) * 15 * D2R; // ángulo horario (rad), oeste positivo
  const d = decDeg * D2R,
    p = lat * D2R;
  const sinAlt = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(sinAlt);
  const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H));
  return { alt: alt / D2R, az: (((az / D2R) % 360) + 360) % 360 };
}
export function skyAt(dateUTC) {
  const jd = julian(dateUTC);
  return STARS.map(([n, ra, dec, mag]) => ({ n, mag, ...altAz(ra, dec, jd) })).filter((s) => s.alt > -2);
}
```

### A.9 · `poster-size.mjs` (peso del póster)

Uso: `node poster-size.mjs`. Resultado en §8.6.

```js
import zlib from 'node:zlib';
import { makeWorld, frame } from './cam.mjs';
import { bakeTile, liquid } from './tile.mjs';
const T = bakeTile(); const world = makeWorld();
const ramp = ' ·:=*yaAG▒';
function poster(W, H, layers) {
  const g = frame(world, W, H, 14);                   // cámara A/B: fotograma φ=14° (glifos)
  const rows = g.c.map((r) => r.slice());
  const horizon = Math.round(H * 0.7);
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) if (rows[y][x] === ' ') {
    const f = y / horizon; const d = liquid(T, x, y, 0.35, W) * (0.3 + 0.8 * f) * (0.25 + 0.75 * Math.min(1, Math.max(0, (x / W - 0.05) / 0.45)));
    const ch = ramp[Math.min(ramp.length - 1, (d * ramp.length) | 0)]; rows[y][x] = ch;
  }
  // la Polar: siempre al norte, a la altura de la latitud (18,5°); celda 1:2 → 110°/cols por columna
  const dpr = 110 / W * 2, py = Math.round(horizon - 0.5 - 18.5 / dpr); if (py >= 0 && rows[py][Math.round(W / 2)] === ' ') rows[py][Math.round(W / 2)] = '+';
  // capa 'hot' = solo los glifos de alta densidad; 'mid' = resto (dos <pre> superpuestos)
  const hotSet = new Set('yaAG▒▓█║═'.split(''));
  const mid = rows.map((r) => r.map((c) => (hotSet.has(c) ? ' ' : c)).join('').replace(/\s+$/, ''));
  const hot = rows.map((r) => r.map((c) => (hotSet.has(c) ? c : ' ')).join('').replace(/\s+$/, ''));
  const one = rows.map((r) => r.join('').replace(/\s+$/, '')).join('\n');
  return { one, mid: mid.join('\n'), hot: hot.join('\n') };
}
for (const [W, H] of [[132, 34], [100, 30], [56, 46], [44, 40]]) {
  const p = poster(W, H);
  const br = (s) => zlib.brotliCompressSync(Buffer.from(s), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  const gz = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
  console.log(`${W}×${H} (${W * H} celdas): 1 capa  ${Buffer.byteLength(p.one)} B → br ${br(p.one)} · gz ${gz(p.one)}   |  2 capas (mid+hot) ${Buffer.byteLength(p.mid) + Buffer.byteLength(p.hot)} B → br ${br(p.mid + '\n' + p.hot)} · gz ${gz(p.mid + '\n' + p.hot)}`);
}
```
