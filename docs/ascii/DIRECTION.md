# DIRECCIÓN FINAL · gaya.com.do · Inicio en arte ASCII

**«CARTEL» · ocho carteles hechos de luz y una marea que los cambia**

Fecha: 2026-09-30 · Autoría: dirección de arte y arquitectura técnica principal · Proyecto: `gaya-web` (Astro 7 estático, Node 24) · **Estado: especificación cerrada para construir**, con dos puertas bloqueantes que no se pueden cerrar desde un documento: el **Samsung A07 real** (§6.12) y el **visto bueno del dueño en color** (§14.1).

Este documento **consolida y sustituye** a los tres conceptos (`concepts/cartel.md`, `mundo.md`, `instrumento.md`) y se apoya en los seis informes (`research/01`–`06`, citados como R01–R06). Donde este documento contradice a cualquiera de ellos, **manda este**. No repite lo que ya está bien resuelto en R01–R06: lo cita y fija solo lo que cambia o lo que faltaba.

**Etiquetas de fiabilidad.** **[V]** leído hoy en la fuente primaria · **[M]** medido o ejecutado hoy por mí (Node 24.19, Chrome 154 con Playwright del proyecto, Geist Mono y Bricolage reales; los scripts viven en el scratchpad de la sesión y **no persisten**: §2.5 dice cómo repetirlos) · **[C]** criterio propio, razonado y no verificado · **[R0x]** heredado de un informe · **[J]** observación de los jueces. Nada marcado [M] se midió en un Samsung A07.

---

## 0. Resumen para decidir en dos minutos

**La idea en una frase.** La web es una **serie de ocho carteles** hechos de bloques Unicode y luz cobalto. Cada cartel es **una palabra** (`GAYA · HOLA · WEB · LISTO · ECO · ON · VER · TÚ`) cuya materia **es lo que el servicio hace**: un rótulo de vidrio que se llena de agua, olas, una obra que se levanta por pisos, celdas que se ensamblan, un eco, un neón que sigue encendido, letras que se encienden al mirarlas, y al final **tu palabra** sobre la ciudad. Entre un cartel y el siguiente **sube una marea** que deshace el que sale y cristaliza el que llega. Todo lo que se lee (titulares, promesas, listas, botones) es **texto real** en tipografía legible; todo lo que se ve es arte.

**Por qué esta y no las otras dos.** Cartel fue la mejor base por tres razones que los jueces confirman: (1) el arte vive **a pantalla fija**, así que nunca necesita alinearse con el texto que se desplaza (el problema de sincronía que hunde a Mundo e Instrumento); (2) la palabra-material es una unidad de oficio que **se entiende sin leer** y se comprime a ~5 KB por idioma; (3) el estado estático **es un fotograma del mismo motor**, no una imagen aparte. Le faltaban cosas que se injertan de Mundo (el lugar, el cierre «tu lugar» y los emblemas) y de Instrumento (la placa, la procedencia de los datos, el índice), y se corrigen los fallos que los jueces le señalaron (§15).

**Lo que se demostró en esta pasada, con el arte a la vista** (§2): se renderizaron en Chrome, en color, la portada a 1440×900 y a 360×800 (la vista del A07), las seis escenas de servicio y tres fotogramas de la marea. Hallazgos que cambian la dirección: el look correcto es **«rótulo luminoso»** (caras sólidas de 16 tonos con cáusticas, aro de luz, sombra proyectada, halo), no un campo de letras; los campos de glifos de línea se leen como **placa de circuito** y los de letras como **texto que cae**, así que quedan **descartados** (clichés que el dueño pidió evitar).

### Los cuatro momentos que la gente contará

| # | Momento | Qué pasa | Cómo se dispara | Duración |
|---|---|---|---|---:|
| 1 | **Ignición** (portada) | Sobre un fondo oscuro aparece el `h1` y, al segundo, **GAYA se llena de agua** desde abajo mientras una bruma de luz se abre alrededor | Carga (tras `load` + inactividad) | ≤ 2,6 s |
| 2 | **«Gaya se derrite y te dice hola»** (firma) | Al primer scroll, una línea de agua sube por la pantalla, GAYA se deshace en ella y del agua **cristaliza HOLA** (la H sólida; «OLA», hecha de olas) | El borde de «Quiénes somos» cruza el 75 % del alto; **corre por tiempo, no por dedo** | 1,4 s |
| 3 | **ON** (soporte) | Se va la luz del ambiente: la bruma se apaga y **el neón ON sigue encendido**, con su piloto. Vuelve la luz | Llegada del cartel | 2,2 s |
| 4 | **TÚ** (cierre) | El último cartel es **tu palabra**, de vidrio como GAYA, sobre el horizonte de Santo Domingo; se llena de luz y se encienden las ventanas de la ciudad | Llegada del cartel (no depende del ratón) | 2,0 s |

Los cuatro son **bidireccionales** (al subir de nuevo se reproducen al revés, más cortos) y con `prefers-reduced-motion` son **corte seco** sobre fotogramas bellos.

### Cifras de control

| | |
|---|---|
| Altura de la página | ≈ 15 pantallas en escritorio (hoy 1); ≈ 22 en móvil |
| Secciones | 10 (inicio, nosotros, servicios + 4 fichas, ejemplos, proceso, contacto) |
| Escenas de arte | 8 carteles + 1 bruma + 2 piezas en DOM (índice y proceso) |
| Tipografía | **2 familias**: Bricolage Grotesque Variable (todo el texto real) y Geist Mono Variable (arte, etiquetas, datos) |
| Rejilla | celda 6×12 (< 900 px) · 9×18 (900–1599) · 12×25 (≥ 1600), enteros de píxel |
| JS del arte | ≤ 18 KB gz en la primera carga, ≤ 40 KB gz en total (techo del sitio: 60 KB) |
| Fuentes | ≈ 70 KB (3 archivos) |
| Red de terceros | 0 (CSP `default-src 'self'`) |
| Rendimiento objetivo | Lighthouse móvil ≥ 90, LCP < 2,5 s, CLS 0, TBT < 200 ms, 30 fps en A07 |

### Lo que necesito del dueño (las cinco que bloquean; las doce están en §14.2)

1. **Visto bueno en color** de la portada y los carteles (capturas del §2; repetibles).
2. **Nombre:** «Gaya Digital» o «Gaya Group» (afecta el pie, los mensajes de WhatsApp y el JSON-LD).
3. **Lenguaje de la palabra «TÚ»** como cierre y **el horizonte de Santo Domingo** bajo ella (con Puente Juan Bosch, torres y campanario; **sin Faro a Colón ni Obelisco**).
4. **«Referencias» → «Ejemplos»** en toda la copia visible (las URL no cambian).
5. **Qué capacidades confirma** (§8.1): mientras no confirme ninguna, la web sale con la versión honesta «piloto», que ya está escrita.

---

## 1. Veredicto de dirección

### 1.1 La elección y los injertos

| Concepto | Media de los jueces | Arte | Ingeniería | Negocio | Lo que se queda | Lo que se descarta |
|---|---:|---:|---:|---:|---|---|
| **Cartel** | **6,7** | 7 | 6,5 | 6,5 | La **base**: palabra-material, marea como costura, estático = fotograma del motor, arte a pantalla fija, pozos, `still` | Tipografía solo-mono, corchetes y árbol en la interfaz, espina, guion ligado a `d` (se reemplaza por guion **por tiempo**) |
| Mundo | 6,5 | 7 | 6 | 6,5 | El lugar (Santo Domingo) como **cierre**; el «falta tu lugar» → **TÚ**; los 14 emblemas de sector; la idea de *Powers of Ten* como costura de luz (sin usarla) | Cámara única, plano/circuito, islas, cable como progreso, Faro, Obelisco, lupa de topónimos, lettering 5×5 |
| Instrumento | 6,4 | 6,5 | 6,5 | 6,3 | La **placa** de «Quiénes somos», el **Índice** de servicios, la **procedencia** de los datos (fuente + caducidad), `<output>` fuera | Lecturas en vivo (peso/cookies/terceros), cronómetro, medidores, Sonar/Trazador/Piloto/Tablero, fuente de píxel propia, logo de plotter |

**Injertos exactos** (qué entra, de dónde, dónde aterriza):

1. **TÚ como cierre y el horizonte de Santo Domingo** (Mundo S10/S11): el último cartel es la palabra del visitante, hecha del mismo material que GAYA (un **marco de apertura y cierre**), sobre un horizonte con Puente Juan Bosch, torres y un campanario, y su reflejo. Es el clímax que el juez de arte pidió y el ancla local que pidió el de negocio. → §7.9.
2. **Emblemas de sector** (Mundo A.4, 14 dibujos de 11×5 celdas): llenan las filas de **Ejemplos** y sustituyen a las miniaturas ASCII de capturas (que el juez de negocio y el de arte descartaron por ilegibles). → §7.7.
3. **Placa y Procedencia** (Instrumento): «Quiénes somos» es una placa de datos con filas `clave · valor`; cada dato local lleva **fuente** y **caducidad** en los datos, y **se retira solo**. → §8.3, §8.9.
4. **Índice de servicios** (Instrumento 4.3): los cuatro servicios en un solo vistazo (nombre · promesa · enlace · WhatsApp), con las cuatro palabras en miniatura. → §4.3.
5. **Lo aprendido de la crítica a Instrumento**: nada de jerga de sistema, no `<output>`/regiones vivas, no retículas de 144 px a mano: `--ch` literal por breakpoint.

### 1.2 Lo que se descarta a propósito (para que no vuelva por la puerta de atrás)

Campos de **glifos de línea** (`╲╱│─`) como papel pintado (placa de circuito, [M] §2.1); campos de **letras** (`yaAG…`) en rachas (se leen como texto que cae); **trama de puntos** uniforme (PRODUCT.md); texto con degradado; vidrio esmerilado; cursivas; numeración visible de secciones; pantallas de carga o «tap to enter»; scroll horizontal; `position: sticky` a 100svh; Lenis y GSAP; iframes; vídeo o 3D para hacer ASCII; `← → ■ ● ◆ ▲ ✓`, Braille y emoji dentro de rejillas; corchetes `[ ]` y marcadores de árbol `├─ └─` **en la interfaz** (solo caben dentro del arte); el **Faro a Colón** y el **Obelisco** (§2.4: el Faro no se enciende; el Obelisco conmemora «Ciudad Trujillo»); la lupa braille; el cálculo de estrellas reales; la cuenta regresiva de la factura electrónica.

---

## 2. Evidencia de esta pasada

Los tres jueces repitieron lo mismo: «el WAOOO está afirmado, no demostrado; no hay una sola captura en color». Aquí está lo que se hizo para cerrarlo.

### 2.1 Prototipo en color [M]

Se construyó un rasterizador de palabras (Chrome + Bricolage Grotesque 800, cuadrantes 2×2 por celda 1:2; Anexo C.1) y un pintor de celdas en canvas 2D con la paleta de 16 tonos derivada de `--glow-0..3` (mismos hex que R05 §2.1: `#02051b … #d1f1ff`). Se renderizó y **se miró** cada pieza a 1440×900 (celda 9×18, 160×50) y a 360×800 (celda 6×12, 60×66, la vista del A07):

| Prueba | Resultado |
|---|---|
| **Campo de líneas tangentes** (`╲╱│─` siguiendo las isolíneas del agua) | Se lee como **placa de circuito**. Descartado (MA-7: el juez ya había nombrado ese cliché). |
| **Campo de letras** (`y a A G` por densidad) y letras dentro de las caras | Se lee como **texto cayendo** o ruido; resta nitidez al rótulo. Descartado. |
| **Cara sólida luminosa** (tono 7–12 por cáusticas), aro de luz arriba-izquierda (T13–T14), sombra `░` (+2,+1), halo y **bruma de `░▒▓` y puntos** | **Es el look.** Lee como rótulo luminoso de píxeles, inequívoco a 1440 y a 360. Sin terminal, sin verde, sin ventana. |
| **Agua dentro del vidrio** (nivel con menisco `~`, vidrio oscuro arriba, agua luminosa abajo) | Funciona como **ignición**: el nivel sube de 0 a 0,85 en 2,6 s. En reposo se ve como un recipiente de luz. |
| HOLA (H sólida + «OLA» a rayas de ola con cresta `~`) | Legible, distinta de GAYA, sin glifos de ruido. |
| WEB (plano → obra → publicado) | La obra por **disolución aleatoria** se ve sucia; se especifica **por pisos de abajo arriba** (§7.3). |
| LISTO (celdas que vuelan de un desorden a su sitio) | Bien a mitad de ensamblaje; el final lleva **rayado `╱` dentro de las letras**, no como campo. |
| ECO (cara sólida + anillos) | Anillos de un solo trazo finos no se ven; se especifican **bandas de tono** y `▒` en el primero (§7.5). |
| ON (neón: tubo doble + halo + piloto) | Excelente: cartel distinto de los demás **sin cambiar de lenguaje**. |
| TÚ + horizonte (torres, campanario, Puente Juan Bosch, reflejo) | La silueta funciona; la palabra y el puente **chocan**: se separan en filas (§7.9). |
| Marea, tres fotogramas (frente a 76 %, 52 %, 28 %) | Se lee como **agua que lava** el cartel; la espuma `*~` da el toque ASCII. Mitad de transición = sucio si se detiene (es transitoria: **no se deja reposar**, §6.4). |
| Móvil 360×800: pila `GA / YA` de 12 filas + `h1` + lead + botón | **Todo cabe sin scroll**; las letras miden ≈ 300 px de alto. Es el «wao» móvil que faltaba (CN-7). |

**La lección de oficio**: el ASCII está en la **materia de la superficie** (glifos de bloque para masas, cuadrantes para bordes, `░▒▓` para niebla, puntos `·:` como polvo, `*~` como espuma), no en adornos de letras.

### 2.2 Medidas [M]

| Medida | Valor |
|---|---|
| **Anchos de palabra** (Bricolage 800, cuadrantes) | Tabla completa en el Anexo A.1. `GAYA` 16 filas = 121 cols; 11 filas = 84; pila `GA/YA` 12 filas = 49 cols por línea |
| **Datos de todas las palabras** (ES): variantes L, M, S, XS y mini, RLE de 1 byte por corrida | 8,99 KB sin comprimir · **5,04 KB gzip** · 4,42 KB brotli. EN: 8,99 · **5,21 KB gz**. Solo L: 1,69 KB gz (ES) · 1,76 KB (EN). Troceado por cartel: ≈ +10 % |
| **Póster SSR de la portada**, 4 capas de tono (dim/mid/hot/spark), sin `bg` | **160×50: 2,05 KB gz** (1,87 KB br) · **65×70 (pila): 1,59 KB gz** (1,47 KB br) |
| **Presupuesto de tono de la portada** (área de tinta sobre el área de pantalla) | T≥9: **8,7 %** · T≥11: 2,7 % · T≥13: 1,2 % · celdas no vacías 54,5 % (la portada es la excepción de densidad) |
| **LCP y `::before`** | Chrome 154 **sí cuenta** el texto generado por `::before` como candidato de LCP (el elemento es el anfitrión). Por eso el póster SSR **no** se pinta en la ruta con JS (§6.9) |

### 2.3 Verificado hoy [V]

| Hecho | Fuente |
|---|---|
| El **Faro a Colón no está iluminado**: «se apagó para siempre», en remodelación, con anuncio de luces donadas; y aun encendido la cruz era un resplandor difuso | BBC Mundo vía Acento, https://acento.com.do/bbc-news-mundo/el-faro-sin-luz-que-honra-a-cristobal-colon-y-las-maldiciones-atribuidas-a-sus-restos-en-republica-dominicana-9254107.html |
| Instagram usa **WKWebView en iOS** y una implementación propia sobre **Chrome Custom Tabs en Android** | https://u2l.ai/blog/instagram-in-app-browser |
| **WebGL2** está en Android WebView, WKWebView y Safari iOS ≥ 15; no hay dato de WhatsApp/TikTok | https://caniwebview.com/features/web-feature-webgl2/ |
| **2.5.3 Label in Name**: el nombre accesible debe contener el texto visible del rótulo | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html |
| **2.4.11 Focus Not Obscured**: los elementos fijos no pueden ocultar el foco; `scroll-padding` lo resuelve | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html |
| `failIfMajorPerformanceCaveat` hace fallar la creación del contexto si solo hay raster por software | https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext |
| **Popover API**: Baseline 2025 | https://developer.mozilla.org/en-US/docs/Web/API/Popover_API |
| **GitHub Pages sirve `gzip`** (no brotli) con `Cache-Control: max-age=600`; **`https://gaya.com.do` falla hoy** con error de certificado (`SEC_E_WRONG_PRINCIPAL`), `http://` responde | `curl` del 30-sep-2026 |

**Consecuencia del último punto:** `navigator.clipboard` exige contexto seguro; el botón «copiar correo» necesita respaldo con `document.execCommand('copy')` hasta que el HTTPS esté emitido (§8.7).

### 2.4 Por qué no Faro

El juez de negocio señaló que «la ignición de la portada enciende un monumento que en la realidad está apagado» (MN-3, IN-9). Se verificó [V]: es cierto. Se retira la cruz de luz y todo el concepto del Faro. La **lente** de la portada actual pasa a ser el **calor del puntero** (un brillo local que sigue al dedo o al ratón).

### 2.5 Lo que NO se verificó (honestidad)

Rendimiento en el **Samsung A07** y en iPhone; Safari y Firefox; los navegadores integrados de **TikTok y WhatsApp**; el Lighthouse de la página nueva (no existe); el análisis de destellos (PEAT); la fidelidad de las siluetas del horizonte de Santo Domingo (solo el Faro se había contrastado en R05, y ya no está); que a los dominicanos no técnicos les baste el par palabra→servicio sin la etiqueta (por eso cada cartel lleva su `h3` visible). **Para repetir las pruebas de color:** el rasterizador está en el Anexo C.1 y el pintor es una función de ~120 líneas sobre `Grid` (§6.3); el primer entregable del hito M1 es reproducir las capturas con el código de producción y compararlas con las de esta pasada.

---

## 3. Reglas de la obra

Veinte reglas. Las marcadas ★ son del dueño o de PRODUCT.md y **no se negocian**.

| # | Regla |
|---|---|
| R1 ★ | **La interfaz se explica sola.** Cero texto instructivo, cero «cómo funciona», cero subtítulos que narren un control. Solo contenido, etiquetas de campo, insignias de estado y mensajes de error reales. |
| R2 ★ | **Honestidad.** Sin clientes, testimonios, cifras, años, premios, logos ni «estado en vivo» inventados. Las cifras que existen son datos locales con fuente (§8.9), el plazo de `brand.json` **si el dueño lo confirma**, la hora de Santo Domingo y el número de ejemplos real. |
| R3 ★ | **Nunca se menciona que la web la hizo una IA.** «Automatización e IA» solo aparece como servicio. |
| R4 ★ | **Cero terceros** en producción (CSP `default-src 'self'`; fuentes y librerías autoalojadas). |
| R5 ★ | **WhatsApp es el canal de conversión**: visible en cada pantalla, prellenado con el servicio o el ejemplo. |
| R6 ★ | **Sin cliché de terminal/hacker**: sin prompt, cursor decorativo, CRT, verde, ventana falsa, scramble, corchetes ni árboles en la interfaz. |
| R7 ★ | **Paleta Cobalto**: 16 tonos derivados de `--glow-0..3`; acento `--accent` ≤ 5 % del área. |
| R8 | **El arte es decoración.** `aria-hidden`, `translate="no"`, `user-select: none`; nunca contiene información ni texto que no esté también en el DOM. |
| R9 | **Lo que se lee es texto real** en Bricolage Grotesque; lo que se ve es arte. Dos voces, una regla de reparto. |
| R10 | **Cada pantalla tiene un acontecimiento**: un cartel que llega, una marea, una placa que sube, un hilo que se enciende. No hay valles. |
| R11 | **Nada se mueve solo** salvo la ignición (≤ 2,6 s). Todo lo demás lo dispara el scroll, el puntero, el foco o el toque, **dura ≤ 2,4 s** y duerme a los 1,6 s. Nada > 5 s (2.2.2). |
| R12 | **Los guiones corren por tiempo; el scroll los dispara, no los conduce.** Así el momento firma es igual con un dedo lento o con un fling (CA-2). |
| R13 | **El estado final de cada cartel es el más bello y está a brillo pleno al llegar.** Lo que se ve en vivo y lo que se ve en estático coinciden (CA-1). |
| R14 | **Toda lectura larga vive sobre una placa opaca**; toda lectura corta sobre arte, bajo un pozo con contraste calculado (§5.8). Nunca texto sobre tono > T6. |
| R15 | **Móvil primero.** Cada cartel tiene su composición móvil *diseñada*, no reducida (§5.3); 360×800 es la vista de referencia. |
| R16 | **Toda versión estática es hermosa por construcción**: es un fotograma del motor. Sin WebGL2, con movimiento reducido o con ahorro de datos: **fotograma fijo**, nunca un bucle lento (MI-4, CI-5). |
| R17 | **Una sola unidad de medida**: la celda. Marcos DOM y arte del lienzo comparten la retícula (`--cw`, `--ch`, enteros de píxel). |
| R18 | **El contenido publicado se sostiene solo**: sin `[CONFIRMAR]` bloqueante (hay versión honesta v1 y flags para v2), y los datos con fecha **se retiran solos** al caducar. |
| R19 | **Lo nuevo entra por fotograma estático primero**: cada escena se entrega como *still*, después como llegada, después como interacción. |
| R20 | **Cada hito deja la web publicable.** |

---

## 4. La página: estructura definitiva

### 4.1 Mapa de secciones

Una URL por idioma (`/` y `/en/`), ids localizados. Alturas en `svh` de escritorio; en móvil las placas crecen con el texto (§4.6).

| # | Sección | `id` ES / EN | Escena de fondo | Alto | Texto real, en orden | Placa |
|--:|---|---|---|---:|---|:--:|
| 0 | **Portada** | `inicio` / `home` | `cover` · **GAYA** | 100 | `h1` · lead (los 4 servicios en una frase) · WhatsApp · Ver ejemplos | no |
| 1 | **Quiénes somos** | `nosotros` / `about` | `hola` · **HOLA / HELLO** | 100 + 70 | `h2` · frase de marca · **placa** de 6–8 filas `clave · valor` · firma | sí |
| 2 | **Servicios** (índice) | `servicios` / `services` | `mist` (bruma) | 90 | `h2` · lista de 4 filas: palabra mini · nombre · promesa · «Ver» · WhatsApp | no |
| 2a | Desarrollo web y apps | `web` / `web` | `web` · **WEB** | 100 + 90 | `h3` · promesa · WhatsApp · **placa**: Incluye · (Para quién / Necesitamos / Resultado) · 1 dato con fuente | sí |
| 2b | Automatización e IA | `automatizacion` / `automation` | `listo` · **LISTO / READY** | 100 + 90 | ídem | sí |
| 2c | Marketing digital y redes | `marketing` / `marketing` | `eco` · **ECO / ECHO** | 100 + 90 | ídem | sí |
| 2d | Soporte e infraestructura IT | `soporte` / `it` | `on` · **ON** | 100 + 90 | ídem | sí |
| 3 | **Ejemplos** | `ejemplos` / `samples` | `ver` · **VER / SEE** | 130 | `h2` · sello «Datos ficticios» · filas de ejemplos (emblema · nombre · rubro · Ver · Quiero una así) · «Ver los *n* ejemplos» | sí |
| 4 | **Proceso** | `proceso` / `process` | `mist` | 110 | `h2` · `ol` de 4 pasos sobre el hilo (DOM) | no |
| 5 | **Contacto** | `contacto` / `contact` | `tu` · **TÚ / YOU** + horizonte | 100 + 60 | `h2` «Hablemos» · WhatsApp · correo · teléfono · redes · firma · pie | sí |

**Total: 1 520 svh ≈ 15,2 pantallas** (IN-9 corrigió la cifra de Instrumento de 9,7 a 10,4 pantallas; aquí se cuenta completa). Las 4 fichas de servicio **no comparten plantilla**: alternan el lado del texto, el ritmo y el guion de la llegada (§7) (CA-6, IN-2).

**Orden de servicios** (R04 D1): Web → Automatización → Marketing → Soporte. **Ejemplos va después de los servicios** (MN-1) pero su acceso está **siempre a un toque**: botón secundario de la portada, enlace del menú y fila del Índice (§4.3).

**Posición del Índice.** Tras «Quiénes somos» el visitante ha visto, sin scroll de más, la portada (que ya nombra los 4 servicios en el lead) y la placa; el Índice le da los 4 a la vez en la pantalla 2,3 (CN-1, MN-1). El primer cartel de servicio (WEB) llega en la pantalla 3,3.

### 4.2 Capas

| z | Capa | Qué es | JS |
|--:|---|---|---|
| 0 | **Lienzo** | Un único `<canvas class="field">`, `position: fixed; inset: 0; height: 100lvh`, `aria-hidden`, `pointer-events: none` | motor |
| 1 | **Contenido** | `main`: texto real y **placas opacas** (las placas tapan el lienzo) | ninguno |
| 1 | **Arte en DOM** | `span.art[data-art]`: palabras del Índice, hilo del Proceso, reglas, emblemas | ninguno (CSS) |
| 40 | **Cromo** | Menú en píldora (escritorio) o barra inferior (móvil), conmutador de idioma | `popover` + 1 `IntersectionObserver` |

**Regla de reparto** (la que cierra la duda de sincronía, MI-1, II-1, IA-1): *lo que cambia por fotograma y no necesita alinearse con el texto va al lienzo fijo; lo que debe alinearse con el texto va al DOM*. Por eso:

- el lienzo **nunca dibuja** reglas, marcos, hilos, emblemas ni palabras del Índice;
- **ningún cartel necesita registro píxel a píxel con el texto**: las palabras viven en la mitad superior de la pantalla y el texto corto (`h3`, promesa, botón) en la inferior, y las lecturas largas están en placas opacas que **tapan** al cartel (efecto cortina);
- la única intersección arte↔texto corto es el `h1` y el lead de la portada y el `h3` + promesa de cada cartel: ahí actúan los **pozos** (§5.8), con prueba automática de píxeles (§13, T7).

**Sin `position: sticky`**: el lienzo fijo hace de anclaje. Sin `scroll-snap`.

### 4.3 El Índice de servicios (`#servicios`)

No es una cuadrícula de tarjetas: es un **índice editorial de 4 filas con regla**, cada fila con una **palabra mini** (6 filas de alto) distinta en ancho, lo que rompe la plantilla (PRODUCT.md: «agencia con cuatro tarjetas iguales»).

```text
  Servicios

  ─┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼
  ▜██▌  ▗████   ▟██▘ █████████▌ ▐████████▄
  ▝██▙  ▟█▛██▖  ██▛  ███        ▐██▌   ▜██▌         Desarrollo web y apps
   ███  ██▘▐█▙ ▐██▌  ███▄▄▄▄▄▖  ▐██▙▄▄▄▟█▀▘         Tu web, rápida y lista para vender por WhatsApp.
   ▐██▌▐█▛ ▝██ ▟██   ███▀▀▀▀▀▘  ▐██▛▀▀▀▀█▙▄
    ██▙██▌  ▜█▙██▌   ███        ▐██▌   ▗███         Ver detalle ↓        WhatsApp
    ▐████   ▐████    █████████▌ ▐████████▛▘
  ─┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼
  ██▙      ██▙  ▗▄█████▙▖  █████████▌ ▗▄█████▙▖
  ███      ███  ██▛   ▀██▘ ▀▀▀███▀▀▀ ▗██▛▘ ▝▀██▙    Automatización e IA
  ███      ███  ▜███▄▄▄▖      ███    ███     ▜██    Que WhatsApp responda, agende y avise por ti.
  ███      ███    ▀▀▀▜███▄    ███    ███     ▟██
  ███▄▄▄▄▖ ███  ██▙   ▗██▛    ███    ▝██▙▖  ▄██▛    Ver detalle ↓        WhatsApp
  ███████▌ ██▛  ▝▀██████▀     ███     ▝▀█████▛▘
  ─┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼
  █████████   ▄▟████▙▄    ▄▟████▙▄
  ███        ▟██▀  ▀██▌  ███▀  ▀██▙                 Marketing digital y redes
  ███▄▄▄▄▄▖ ▐██▌        ▐██▌    ▐██▌                Que te encuentren, te escriban y te compren.
  ███▀▀▀▀▀▘ ▐██▌    ▗▄▖ ▐██▌    ▐██▌
  ███       ▝███▄  ▗▟█▛ ▝███▖  ▄██▛                 Ver detalle ↓        WhatsApp
  █████████   ▀▜█████▀    ▀▜████▛▀
  ─┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼
   ▗▄█████▄▖   ████▖    ██▌
  ▗██▛▘ ▝▜██▙  █████▄   ██▌                         Soporte e infraestructura IT
  ███     ███  ██▙▝██▙  ██▌                         Correo, redes y equipos que no te frenan.
  ███     ███  ███  ▜██▖██▌
  ▝██▙▖  ▄██▛  ███   ▜████▌                         Ver detalle ↓        WhatsApp
   ▝▀█████▀▘   ███    ▝███▌
  ─┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼
```

Cada fila es **un enlace principal** (nombre + palabra como fondo decorativo) al `#web`…`#soporte`, más un segundo enlace de WhatsApp con el servicio ya escrito (`aria-label` = «Escríbenos por WhatsApp sobre *{servicio}*», que **contiene** el texto visible, 2.5.3; en escritorio el botón lleva la etiqueta visible «WhatsApp»). Las palabras mini ES/EN salen de los mismos datos de palabras (variante `mini`, 6 filas; Anexo A.1) y son `aria-hidden`: **el nombre del servicio es siempre texto** (CN-1).

### 4.4 Composición por pantalla

**Escritorio 1440×900 (160×50 celdas).** La palabra ocupa las filas 4–20; el texto, la mitad inferior-izquierda; el lienzo entero es bruma alrededor de la palabra.

```text
┌ chrome (píldora fija) ─────────────────────────────────────────────────────────────────────────┐
│ ▞ Gaya Digital                       Nosotros  Servicios  Ejemplos  Proceso  Contacto   ES  (w) │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
filas 4–20   ░▒  PALABRA  (121×16 celdas, 76 % del ancho, luz cobalto, bruma alrededor)  ▒░
fila 21–24   (aire)
fila 26–36   h1 en Bricolage 800, 88 px                    ← pozo «ink» (tope T6)
fila 37–40   lead en Bricolage 400, 24 px                  ← pozo «muted» (tope T4)
fila 42–45   [ Escríbenos por WhatsApp ]   Ver ejemplos    ← botones reales sobre pozo
```

**Pantalla de detalle (ficha de servicio).** La placa sube desde abajo y **tapa** al cartel:

```text
  ░░▒▒  (resto visible del cartel, fijo)  ▒▒░░
  ┌─────────────────────────────────────────────────────────────┐  ← placa opaca (--t1), borde T6,
  │ Incluye                        │ Para quién                 │    sombra proyectada (+2,+1) T2
  │  · Diseño propio, primero el…  │ Negocios con o sin local…  │
  │  · Sitio en español, en inglés │ Necesitamos                │
  │  · …                           │ Logo y colores (o los …    │
  │                                │ Resultado                  │
  │  Fuente: NIC.DO                │ Una URL en vivo, medida…   │
  └─────────────────────────────────────────────────────────────┘
```

**Móvil 360×800 (60×66 celdas)** — ver la captura [M] de §2.1. Orden vertical: palabra en pila (filas 3–31), `h1` (filas 35–44), lead (45–51), botón (53–57); barra inferior fija con WhatsApp.

### 4.5 Cromo y navegación

| Elemento | Escritorio (≥ 900 px) | Móvil (< 900 px) |
|---|---|---|
| **Marca** | `▞ Gaya Digital` en texto (Bricolage 700) + cuadrante `▞` (Geist Mono, `aria-hidden`) como logo provisional; se sustituye editando **un solo archivo** (`Logo.astro`) cuando llegue el logo del diseñador | igual |
| **Menú** | Píldora superior (la actual) con 5 enlaces: *Nosotros · Servicios · Ejemplos · Proceso · Contacto*; `aria-current="location"` en el activo (scroll-spy con `IntersectionObserver`, `rootMargin: -45% 0 -50% 0`, sin tocar el historial) | Botón de menú con icono + `aria-label` que abre un `popover` de pantalla completa con los 5 destinos **y los 4 servicios como subenlaces** (MN-1) |
| **Idioma** | Enlace `ES` / `EN` en la píldora (`hreflang`) | Barra inferior, a la izquierda |
| **WhatsApp** | Botón circular de icono en la píldora (`aria-label` «Escríbenos por WhatsApp») + botón primario en cada pantalla | **Barra inferior fija de 56 px** con WhatsApp dominante (≥ 44 px); se oculta mientras el botón de la portada está a la vista (1 IO) |
| **Pantallas** | `scroll-padding-top` = alto de la píldora + 1 fila; `scroll-padding-bottom` = alto de la barra + 1 fila (2.4.11, CI-4); medidos de las alturas reales, no constantes | ídem |

Sin espina, sin minimapa, sin cronómetro, sin lecturas (MN-11, CN-2, IN-1). El cromo es **interfaz real** (relleno, borde, icono), no corchetes (R6).

### 4.6 Longitud en móvil

Cada cartel ocupa **una pantalla** (100 svh); las placas crecen con el texto: Quiénes somos ≈ 80 svh, cada ficha ≈ 110–140 svh (con «Para quién / Necesitamos / Resultado» **plegado** en `<details>` con la etiqueta «Más detalles», cerrado por defecto en móvil: MN-10), Ejemplos ≈ 120 svh, Proceso ≈ 100 svh, Contacto ≈ 80 svh. **Total móvil ≈ 22 pantallas.** El acceso es por menú/enlaces; no hay barra de progreso decorativa.

### 4.7 Rutas y archivos de página

`/` y `/en/` (nuevas secciones); `/referencias/`, `/referencias/<slug>/`, `/ref/<slug>/` **no cambian de URL**; sus títulos visibles pasan a «Ejemplos» si el dueño aprueba (§14.2 #4). En `/referencias/` y el visor **no se monta el lienzo** en la v1: conservan su diseño actual con Bricolage + Geist Mono y el menú nuevo.

---

## 5. Sistema visual

### 5.1 Tipografía (exacta)

**Dos voces.** *Lo que se lee* en **Bricolage Grotesque Variable** (OFL-1.1, eje `wght` 200–800, archivo `latin` de 41 KB); *lo que se ve y lo que rotula* en **Geist Mono Variable** (OFL-1.1, `latin` 23,1 KB + `symbols2` 5,8 KB). Motivo: los tres conceptos usaron solo mono y **los tres jueces de negocio lo objetaron** («herramienta de desarrolladores», CA-4, CN-2, MN-11); R03 §1.9 documenta que la mono no ayuda en texto corrido; y la marca ya tiene Bricolage (DESIGN.md). Es **el plan B de Cartel convertido en plan A**. Con una variable CSS (`--font-body`) el dueño puede cambiar el cuerpo a mono en un solo sitio si «quiere más ASCII».

| Rol | Familia | Tamaño | Peso | Interlínea | Notas |
|---|---|---|---:|---:|---|
| `h1` | Bricolage | `clamp(2.5rem, 1.15rem + 5.6vw, 5.5rem)` | 800 | 0,98–1,02 | `letter-spacing: -0.025em` (≥ −0,04em), `text-wrap: balance`, máx. 12 ch por línea en móvil; palabra de acento en `--accent-text` |
| `h2` | Bricolage | `clamp(2rem, 1.2rem + 3.2vw, 3.75rem)` | 800 | 1,04 | visible, **texto real** |
| `h3` (servicio) | Bricolage | `clamp(1.75rem, 1.1rem + 2.6vw, 3.25rem)` | 800 | 1,06 | visible, texto real |
| Promesa / lead | Bricolage | `clamp(1.25rem, 1.05rem + 1vw, 1.75rem)` | 600 / 400 | 1,3 | lead ≤ 34 rem |
| Cuerpo | Bricolage | `clamp(1rem, .95rem + .25vw, 1.125rem)` | 400 | 1,6 | ≤ 38 rem, sin justificar, `text-wrap: pretty`, párrafos ≤ 5 líneas |
| Etiquetas de campo (`dt`), fuente de dato, rótulos de placa | **Geist Mono** | 13–14 px | 500 | 1,4 | `--muted`; minúscula; **sin** corchetes |
| Arte | Geist Mono | 10 / 15 / 20 px | 400–500 | `--ch` | ver §5.2 |

Regla de reparto (R9): *si una persona tiene que leerlo, Bricolage; si se mira, Geist Mono y celdas*.

**Carga.** `@font-face` propios en `src/styles/fonts.css` con `url()` **relativas a `node_modules`** (Vite las copia con hash) y solo los archivos `latin` y `symbols2`: se sustituye el proveedor `npm` de Astro Fonts, que (a) ignora `subsets`, (b) precarga todo o nada y (c) calcula mal el respaldo métrico (R03 §1.5: 85,986 % para Geist y 132,57 % para Bricolage). Respaldos explícitos:

```css
@font-face { font-family: "Gaya Sans Fallback"; src: local("Arial"), local("Helvetica Neue"), local("Roboto");
  size-adjust: 111.04%; ascent-override: 83.76%; descent-override: 24.32%; line-gap-override: 0%; } /* R03 §1.5 — verificar con capsize en dist/ */
@font-face { font-family: "Gaya Mono Fallback"; src: local("Courier New"), local("Liberation Mono"), local("Cousine"), local("Menlo"), local("DejaVu Sans Mono");
  size-adjust: 100%; ascent-override: 100.5%; descent-override: 29.5%; line-gap-override: 0%; }        /* R03 §2.2 opción B */
:root { --font-display: "Bricolage Grotesque Variable", "Gaya Sans Fallback", system-ui, sans-serif;
        --font-mono:    "Geist Mono Variable", "Gaya Mono Fallback", ui-monospace, monospace;
        --font-body: var(--font-display); }
```
`font-display: swap` en ambas. **Nunca** terminar la pila mono en `monospace` a secas (en Windows es Consolas, 0,55 em). Precarga en `Base.astro`: Bricolage `latin` (prioridad alta), Geist Mono `latin` y `symbols2` con `fetchpriority="low"`. Se añade Geist Mono a `CREDITS.md` (© 2024 The Geist Project Authors, OFL-1.1).

### 5.2 Celda y retícula

```css
:root { --fs-art: 10px; --cw: 6px;  --ch: 12px; }                               /* < 900 px   */
@media (min-width: 56.25rem) { :root { --fs-art: 15px; --cw: 9px;  --ch: 18px; } } /* 900–1599 px */
@media (min-width: 100rem)   { :root { --fs-art: 20px; --cw: 12px; --ch: 25px; } } /* ≥ 1600 px   */
.art { font: 400 var(--fs-art)/var(--ch) var(--font-mono); font-variant-ligatures: none; font-kerning: none;
       letter-spacing: 0; white-space: pre; user-select: none; text-rendering: optimizeSpeed; padding-block: .05em; overflow: clip; }
.art::before { content: attr(data-art); }      /* el arte no entra al DOM: axe/Lighthouse no lo evalúan (R03 §1.8) */
```
`--ch` va en **literales** por breakpoint (la receta `round(down, 1.3em, 1px) − 1px` de R03 §1.4 da exactamente 12/18/25 px para 10/15/20 px; `round()` queda solo como mejora con `@supports`, II-9). El lienzo usa **la misma celda** en píxeles de dispositivo enteros (`cw = round(--cw · min(dpr, tierDpr))`, `ch = 2·cw`) y los *tiers* solo la **agrandan** de 1 px en 1 px si el presupuesto de celdas se excede (R06 D19).

### 5.3 Las palabras

**Fuente de verdad: texto.** Cada variante de cada palabra es un archivo de **arte de cuadrantes** (`src/ascii/data/words/<lang>/<ID>.<variante>.txt`), editable a mano; `scripts/words-pack.mjs` lo compila a RLE (`words.gen.ts`). Así un diseñador **retoca celdas** (p. ej. la `G`) y el cambio queda en el repositorio; `scripts/words.mjs` (Playwright + Bricolage 800, Anexo C.1) **no pisa** un `.txt` existente salvo con `--force`.

**Conjunto final de palabras.**

| Cartel | ES | EN | Material | Qué demuestra |
|---|---|---|---|---|
| Portada | **GAYA** | GAYA | vidrio con agua | la marca; «el agua hecha del nombre» |
| Quiénes somos | **HOLA** | HELLO | H sólida + olas | «hola» contiene «ola»; WhatsApp primero |
| Web y apps | **WEB** | WEB | obra | se construye y se publica |
| Automatización e IA | **LISTO** | READY | celdas que se ensamblan | el desorden se ordena; «listo» |
| Marketing y redes | **ECO** | ECHO | anillos | el alcance sale de tu nombre |
| Soporte e IT | **ON** | ON | neón | sigue encendido aunque se vaya la luz |
| Ejemplos | **VER** | SEE | letras que se encienden | las webs de ejemplo |
| Contacto | **TÚ** | YOU | vidrio con agua (bis) | el último cartel es tuyo |

Cada cartel lleva además su **`h3`/`h2` visible con el nombre real del servicio** (CN-1, CA-7, CI-9): la palabra es imagen, el título es nombre; nunca se depende de que `ECO` se entienda solo.

**Variantes por ancho de rejilla** (se elige la mayor que quepa **con 4 columnas de margen por lado**; MI-5, CI-6):

| Variante | Columnas máx. | Filas máx. | Se elige si `cols ≥` | Uso |
|---|---:|---:|---:|---|
| **L** | 128 | 22 (TÚ: 24 con acento) | 133–136 según la palabra | escritorio |
| **M** | 88 | 16 | 96 | tablet y escritorio estrecho |
| **S** (pila o línea) | 52 | 14 | 60 | móvil 360–430 px |
| **XS** (pila) | 44 | 14 | 52 | móvil 320–352 px |
| **mini** | (≈ 22–60) | 6 | — | Índice (DOM) |
| **proc** | (≈ 60) | 8 | — | hilo del Proceso (DOM: HOLA y LISTO) |

**Tabla de variante efectiva por viewport** [M, cuentas exactas; palabra ancha típica de 121–125 cols]:

| Viewport | Celda | Cols × filas | Celdas | Variante |
|---|---|---:|---:|---|
| 320×568 | 6×12 | 53×47 | 2 491 | XS |
| **360×800 (A07)** | 6×12 | 60×66 | 3 960 | **S** |
| 375×812 · 390×844 · 412×915 · 414×896 | 6×12 | 62–69 × 67–76 | 4 154–5 168 | S |
| 600×960 · 640×960 | 6×12 | 100–106 × 80 | 8 000–8 480 | M |
| 768×1024 | 6×12 | 128×85 (10 880 → el *tier* agranda a 7×14: 109×73) | ≤ 9 000 | M |
| 820×1180 · 899×1000 | 6×12 | 136–149 | > 9 000 → 7×14 | L |
| 900×900 · 1024×768 · 1152×864 | 9×18 | 100–128 × 42–50 | 4 746–6 144 | M |
| **1280×720 · 1366×768** | 9×18 | 142–151 × 40–42 | 5 680–6 342 | **L** (cierra el hueco de CI-6) |
| **1440×900** · 1536×864 · 1599×900 | 9×18 | 160–177 × 48–50 | 8 000–8 850 | L |
| 1600×900 | 12×25 | 133×36 | 4 788 | L |
| 1920×1080 | 12×25 | 160×43 | 6 880 | L |
| 2560×1440 | 12×25 | 213×57 (12 141 → el *tier* agranda a 15×30: 170×48) | ≤ 9 000 | L |

La selección usa **las columnas del motor después del *tier*** (no el ancho de ventana). Sin variante XS/S que quepa (< 52 cols, p. ej. zoom 400 %), **el lienzo se oculta** y queda la página de texto (§11.2).

**Composición móvil de cada cartel** (S, celdas 6×12, 52 cols útiles; medido [M], Anexo A.1):

| Cartel | Disposición | Filas (por línea) | Cols máx. |
|---|---|---:|---:|
| GAYA | pila `GA / YA`, la 2.ª línea desplazada 3 cols a la derecha | 12 + 12 | 49 |
| HOLA · HELLO | pila `HO / LA` · `HEL / LO` | 13 + 13 · 9 + 9 | 51 · 49 |
| WEB | pila `WE / B` | 10 + 10 | 48 |
| LISTO · READY | pila `LIS / TO` · `REA / DY` | 13 + 13 · 8 + 8 | 52 · 48 |
| ECO · ECHO | pila `EC / O` · `EC / HO` | 14 + 14 · 13 + 13 | 50 · 51 |
| ON | **línea** (la pila sale estrecha, 28 cols) | 12 | 50 |
| VER · SEE | pila `VE / R` · `SE / E` | 13 + 13 · 14 + 14 | 50 |
| TÚ · YOU | **línea** · pila `YO / U` | 14 (+ acento 6) · 13 + 13 | 52 · 50 |

Esto responde a «palabras cortas pequeñas en móvil» (CA-5): ninguna mide menos de ≈ 140 px de alto de letra en 360 px y las pilas llegan a ≈ 300 px.

### 5.4 Tonos T0–T15

Se generan con `scripts/tones.mjs`: interpolación en OKLCH entre las claves `--glow-0 → T0`, `--glow-1 → T5`, `--glow-2 → T10`, `--glow-3 → T15`, con el recorte de croma de `src/lib/color.mjs`. El script escribe `src/styles/tones.css` (`--t0 … --t15`) y `src/ascii/tones.gen.ts`; **una sola fuente**, y `npm run contrast` comprueba que el CSS y el TS coinciden.

| Tono | Hex [M] | Papel |
|---:|---|---|
| T0 | `#02051b` | Fondo (`--surface`) |
| T1 · T2 · T3 | `#040c34` · `#07134f` · `#0b1b6c` | Placa · susurro / vidrio vacío · sombra proyectada |
| T4 · T5 · T6 | `#0f238a` · `#122caa` · `#143fbf` | Bruma · agua profunda · **tope bajo texto** |
| T7 · T8 · T9 | `#1753d4` · `#1c66ea` · `#2179ff` | Marco de placa · cara del cartel · cara brillante |
| T10 · T11 · T12 | `#4390ff` · `#52a7ff` · `#6bbdff` | Agua viva · aro · borde interior |
| T13 · T14 · T15 | `#88d0ff` · `#abe2ff` · `#d1f1ff` | Luz de borde · espuma y menisco · chispa |

**Presupuesto de tono** (área de tinta sobre el área de pantalla; se verifica en CI sobre el fotograma `still`): T≥9 ≤ **12 %** · T≥11 ≤ **4 %** · T≥13 ≤ **1,5 %** · T≥14 ≤ **0,5 %** · celdas no vacías ≤ **60 %** en la portada y ≤ **55 %** en el resto (CA-3: reconcilia el 46 % ≥ T11 del concepto con lo medido: **8,7 / 2,7 / 1,2 %**). Acento (`--accent`) ≤ 5 % del área.

**Deriva cromática «noche → amanecer»** (MA-8): el arco de la página no es plano. Cada cartel lleva un parámetro `dawn` ∈ [0, 1] que **solo agranda el radio y sube un tono el tope de la bruma y el halo**, sin tocar el fondo ni la paleta: portada 0 · nosotros 0,15 · servicios 0,3 · ejemplos 0,5 · contacto 1 (el cierre es el más luminoso). Es deriva **dentro** del Cobalto.

### 5.5 Anatomía del cartel (la receta que se vio en color)

Para cada celda de una palabra con máscara de cuadrantes `m` (0–15):

1. **Cara.** Celda llena (`m = 15`) a ≥ 2 celdas del borde: glifo `█`, tono `= base + round(1,5·agua + 1,2·profundidad)`; `base` 8 (cartel de agua) o 9 (ECO, VER).
2. **Aro.** Celda parcial (`m ≠ 15`): el cuadrante de `m` en **T12**, y **T14** si tiene vacío arriba o a la izquierda (luz). Celdas llenas a 1 celda del borde: `█` en T12 con bisel (T13 arriba/izquierda, T9 abajo/derecha).
3. **Sombra proyectada** (+2 col, +1 fila): celdas vacías cuyo `(x−2, y−1)` es sólido: `░` en T4 (nunca sobre otra palabra).
4. **Halo**: celdas vacías a ≤ 4 celdas de la palabra: tono de fondo T3 (≤ 1), T2 (≤ 2), T1 (≤ 4), solo con **bruma de glifos `░▒▓·:` en fg** (sin `bg`, para que el póster SSR sea fiel, §6.9).
5. **Bruma**: `d = (0,15 + 0,85·cresta) · exp(−(dx² + dy²)·1,6)` con `cresta = (1 − |2h − 1|)³` del agua; glifo `·` (d < 0,16), `:` (< 0,24), `░` (< 0,34), `▒` (< 0,5), `▓`; tono T3–T6; 15 % de los puntos se omiten por hash. **Viñeta** hacia las esquinas.
6. **Agua** (cartel de vidrio: GAYA, TÚ): nivel `L` (fracción llena, 0→0,85 en la ignición); **arriba del nivel**, vidrio vacío (T2, aro visible); **en el menisco**, fila `~`/`=` en T14; **abajo**, cara luminosa T7–T12 con cáusticas.
7. **Espuma**: solo en la marea y en el menisco: `*` y `~` en T12–T14 (≤ 0,5 % de las celdas).

### 5.6 Alfabeto de glifos

Permitido: ASCII imprimible; `· ¯`; cajas `U+2500–257F` y bloques `U+2580–259F` (**en el lienzo se dibujan por código**, sin `symbols2` ni costuras; en DOM salen de `symbols2`); `« » ¿ ¡ × ± ° §`; `– — …`. **Prohibido** dentro de rejillas (caen a otra fuente y cambian de ancho): `← → ■ □ ● ○ ◆ ◇ ▲ ▶ ★ ≈ ≠ ≤ ≥ ✓`, Braille, emoji (R03 §1.3). Lo comprueba `npm run ascii:lint` sobre `data-art`, los `.txt` de palabras y los emblemas (Anexo C.4).

### 5.7 Composición vertical de referencia (escritorio, 50 filas)

| Cartel | Palabra (filas) | Texto corto | Notas |
|---|---|---|---|
| GAYA | 4–20 (16) | h1 26–36 · lead 37–40 · botones 42–45 | texto abajo-izquierda |
| HOLA | 4–20 (16) | h2 + frase 28–40 | la placa sube a 120 svh |
| WEB · LISTO | 4–22 (18 · 16) | h3 + promesa + botón 28–44, **lado alterno** | WEB: texto izquierda; LISTO: derecha |
| ECO | 3–25 (22) | texto bajo la palabra, columna izquierda | anillos de 28 celdas alrededor |
| ON | 4–26 (22), palabra **al 50 %** del ancho | texto a la derecha | la más estrecha: equilibra el ritmo |
| VER | 4–25 (21) | h2 + sello | las filas de ejemplos son placa |
| TÚ | 2–26 (24 con acento) | botón central 28–31 | horizonte filas 33–40, reflejo 41–49 |

### 5.8 Legibilidad: placas y pozos

**Regla R14.** Lectura larga → **placa opaca** (contraste independiente del JS y de la sincronía: `--t1` bajo `--ink` = 16,9:1). Lectura corta sobre arte → **pozo**.

| Pozo (`data-well`) | Texto encima | Tono máx. del arte | Contraste mínimo |
|---|---|---:|---:|
| `ink` | `h1`, `h3`, promesa, botones (`--ink`/`--lead`) | **T6** | 7,47 / 6,83 |
| `muted` | lead, etiquetas, fuente de dato (`--muted`) | **T4** | 6,22 |

- **Fundido** de 2 celdas en el borde y **nunca a cero** (queda T1: integra el arte con la página, R01 §5.6).
- **Margen proporcional a la velocidad** (CI-3): el pozo se ensancha `min(8, ceil(|v|·dt / ch))` filas **en el sentido del movimiento**; y mientras `energy > 0,5` el tope global del arte baja suavemente hasta T8. Así, aunque el lienzo vaya 1–2 cuadros por detrás de un fling, el texto nunca cruza tonos claros.
- Los pares entran en `tokens.json` y en `npm run contrast`: `(ink, T6) ≥ 7`, `(lead, T6) ≥ 6,5`, `(muted, T4) ≥ 6`, `(ink, T1) ≥ 16`, `(accent-text, T5) ≥ 6`, `(T7, surface) ≥ 3` (marco de placa).
- Con `prefers-contrast: more`: topes T4/T2 y arte en `--ink`.

### 5.9 «Rótulos»: botones, enlaces, placas

La gramática de la página es la del cartel: **cara + sombra proyectada**. Todo objeto interactivo es un pequeño rótulo con sombra en bloque, **sin corchetes**.

```css
.btn { min-height: 48px; padding: 0 1.5rem; border-radius: 2px; font: 600 1.0625rem/1 var(--font-display); text-decoration: none;
       box-shadow: calc(var(--cw) * 1.5) calc(var(--ch) * .5) 0 var(--t3); transition: transform .12s, box-shadow .12s; }
.btn--primary { background: var(--accent); color: var(--on-accent); }        /* 5,34:1 */
.btn--ghost   { border: 1px solid color-mix(in oklch, var(--ink) 40%, transparent); color: var(--ink); }
@media (hover:hover) { .btn:hover { transform: translate(calc(var(--cw) * .75), calc(var(--ch) * .25));
                                    box-shadow: calc(var(--cw) * .75) calc(var(--ch) * .25) 0 var(--t3); } }
.btn:focus-visible { outline: 3px solid var(--accent-text); outline-offset: 3px; }  /* ≥ 3:1 (1.4.11) */
.plate { background: var(--t1); border: 1px solid var(--t6); color: var(--ink);
         box-shadow: calc(var(--cw) * 2) var(--ch) 0 var(--t2); padding: calc(var(--ch) * 2) calc(var(--cw) * 4); }
```
Objetivos ≥ 24×24 CSS px siempre (2.5.8) y ≥ 44 px en los primarios móviles; `Copiar correo` es un botón **con etiqueta** («Copiar» / «Copiado» con `role="status"`, CI-4, MN-10), no un icono mudo ni `████`. Enlaces en texto: `--accent-text` con subrayado de 1 px.

### 5.10 Arte en DOM

Todo `span.art[aria-hidden][translate="no"][data-art]`, generado en el build por `src/ascii/dom-art.ts`:

- **Reglas** (`─` con `┼` cada 8 celdas): una fila de alto, ancho `round(down, 100%, 1ch)`, color T5. Separan secciones y filas del Índice.
- **Palabras mini** del Índice: 6 filas, una capa (T9) con sombra `text-shadow` (+2,+1) T3; **no** llevan bisel de 3 tonos (en DOM cuestan spans).
- **Hilo del Proceso**: `HOLA` (proc, 8 filas) arriba, riel `│` en T3 (completo) y `┃` en T9 **recortado** por `clip-path` animado con `animation-timeline: view()` bajo `@supports` y `no-preference`; cuatro estaciones `┼` → `╋`; `LISTO` (proc) abajo. Sin soporte (Firefox): todo encendido y visible.
- **Emblemas de sector**: 14 dibujos de 11×5 celdas (borrador de Mundo A.4; **necesitan pulido de diseñador**) con el aro de la fila; al enfocar, pasan a T13.
- **Sin JS, `forced-colors`, impresión**: el arte pasa a `CanvasText` (`forced-colors`) o negro a 7 pt (impresión); el lienzo se oculta.

### 5.11 Color de texto y estados

`--ink` `#edf2f8` (17,9:1 sobre T0), `--lead`, `--muted` `#a4b6ce` (9,8:1), `--accent-text` `#95c9ff` (11,6:1). **Nada de texto con degradado** (DESIGN.md). Estados: foco `outline 3px --accent-text`; hover solo con `@media (hover:hover)`; `disabled` a 45 % de opacidad; «Copiado» con `role="status"`.

---

## 6. El motor

### 6.1 Decisión de arquitectura

**Un único lienzo fijo, escenas puras, la marea como costura.** Es la arquitectura de R06 (un campo, muchas escenas) con los cambios que los jueces exigieron:

| Tema | R05/R06/Cartel decían | Se decide | Por qué |
|---|---|---|---|
| Sincronía escena↔texto | Fondo fijo con pozos en todo el texto; Mundo añadía `transform` sub-fila (MI-1, II-1) | **Fondo fijo a pantalla; ningún cartel se alinea con el texto.** Las lecturas largas van en **placas opacas** en el DOM; los pozos solo cubren texto corto | El `transform` por JS no da «la suavidad del scroll nativo» (MI-1); con placas el contraste deja de depender del JS |
| Guion de cada cartel | Función de `d` (permanencia en scroll) | **Función de `p` por tiempo**, disparada por el scroll (R12) | El momento firma no puede depender de la velocidad del dedo (CA-2) |
| Clímax | Se pintaba bajo `ghost(d)` a T6 | El estado final está a **brillo pleno al llegar**; la placa lo tapa después (R13) | CA-1 |
| Renderizadores | WebGL2 + Canvas 2D por baldosas a 8 fps | **WebGL2 de textura de celdas** para vivo; **Canvas 2D solo para fotogramas fijos** (un dibujo por cambio de cartel, sin bucle) | MI-4, CI-5: el bucle 2D estimado en el A07 no cabe |
| Contextos | Un canvas fijo (Cartel) o uno por escena (R05) | **Un solo contexto**, nunca más (MI-1) | Memoria constante, sin límites de contextos |
| Póster | `::before` siempre presente | **`display:none` con JS; visible solo sin JS o si el motor falla** (§6.9) | Chrome cuenta `::before` para LCP [M]; y en vivo no hay póster |

**Alternativas descartadas** (resumen): canvas por sección (contextos y memoria, R06 §3.1), `sticky` (recorta con zoom/reflow), `ClientRouter` (convierte la MPA en SPA), pipeline GPU de 4 pasadas de R02 (§6.7), Lenis/GSAP (R06 §4.13).

### 6.2 Estados, arranque y paso de un cartel al siguiente

**Arranque** (todo tras `load`, sin bloquear el LCP que es el `h1`):

1. `DOMContentLoaded` → `requestIdleCallback(boot, { timeout: 1200 })` (respaldo `setTimeout`).
2. `boot()`: detectar capacidades (§6.10); `import('./engine')` (≈ 11 KB gz) y la escena `cover` con sus palabras (≈ 4 KB gz).
3. `await document.fonts.load('500 16px "Geist Mono Variable"', '·:yaAG~*o')` y **comprobar `length > 0`** (nunca `document.fonts.check()`, R02 §9 #1).
4. Hornear atlas (≤ 16 ms en A07, R05 §3.8), tesela de agua (3–4 ms), `build()` de la escena `cover`.
5. Primer fotograma con `p = 0`; fundido del lienzo a opacidad 1 (240 ms); **ignición** (`p`: 0 → 1 en 2,6 s).
6. Duermo a los 1,6 s sin entrada.

**Estados del motor**

| Estado | Cuándo | Qué hace |
|---|---|---|
| `off` | `forced-colors`, impresión, JS ausente, < 52 columnas útiles, fallo de contexto *y* de 2D | Lienzo oculto; póster SSR si procede (§6.9) |
| `still` | `prefers-reduced-motion`, `saveData`, sin WebGL2, `?still` | Un dibujo por cambio de cartel (corte seco), sin bucle |
| `live` | resto | Bucle a ≤ 30 fps mientras haya ignición, marea, llegada, calor, anillos o energía; duerme a los 1,6 s |

**Qué cartel corresponde a cada posición** (se mide una vez y se cachea en coordenadas de documento; `ResizeObserver`, `document.fonts.ready` y cambios de ancho re-miden; **nunca** `getBoundingClientRect` en el bucle):

```ts
// posters = [...document.querySelectorAll('main [data-poster]')] en orden de documento
const line = scrollY + 0.75 * V;                    // V = alto del visor en lvh
let target = 0;
for (let i = 0; i < tops.length; i++) if (tops[i] <= line) target = i;
// histéresis: para VOLVER al cartel k−1 hay que superar el 85 % (no el 75 %)
if (target < cur && tops[cur] <= scrollY + 0.85 * V) target = cur;
```

La **línea de cambio** es el 75 % del visor: cuando el borde superior del cartel siguiente la cruza, empieza la marea. A velocidad de lectura, el texto de la sección nueva ya asoma por abajo y al terminar la marea (1,4 s) su título está a la vista.

### 6.3 Modelo de celdas y contratos (WP0 los congela)

`Grid` de 4 bytes por celda (R05 §3.1): `[glifo, tono fg, tono bg, banderas]` en un `ArrayBuffer` con vista `Uint32Array`. **Un glifo por byte** (≤ 145 glifos): ASCII 32–126 y `· ¯`, bloques y cuadrantes, sombras `░▒▓`, cajas simples y gruesas (`─│┼╱╲` y `━┃╋`). **Los bloques, cuadrantes, sombras y cajas se dibujan por código** (rectángulos de píxeles enteros; sin costuras ni `symbols2`); solo ASCII y `· ¯` salen de la fuente (Geist Mono 500, `size = cw / 0,6`).

```ts
// src/ascii/types.ts — CONTRATOS. Cambiarlos exige acuerdo de todos los paquetes (§12).
export type Lang = 'es' | 'en';
export type SceneId = 'cover' | 'hola' | 'mist' | 'web' | 'listo' | 'eco' | 'on' | 'ver' | 'tu';
export type Variant = 'L' | 'M' | 'S' | 'XS' | 'mini' | 'proc';

export interface GridSpec {
  cols: number; rows: number;       // celdas del motor, tras el tier
  cw: number;  ch: number;          // px de dispositivo, enteros, ch = 2·cw
  cssCw: number; cssCh: number;     // px CSS de la celda (6×12 · 9×18 · 12×25, o agrandada por el tier)
  dpr: number;                      // dpr efectivo (≤ 2; ≤ 1,5 en tier low)
}
export interface Word { cols: number; rows: number; accentRows: number; cells: Uint8Array } // 0..15: bit0=▘ bit1=▝ bit2=▖ bit3=▗
export interface WordSet { variant: Variant; lines: Word[]; offsets: number[] }              // pila: varias líneas (+ desplazamiento en cols)
export interface Cells { cols: number; rows: number; b: Uint8Array; u: Uint32Array }        // [glifo, fg, bg, flags] × N
export interface Ring { x: number; y: number; age: number }                                  // celdas, segundos
export interface Frame {
  p: number;                        // llegada 0..1 POR TIEMPO; 1 = estado final (= still)
  t: number;                        // fase del agua (s); avanza con la energía y se duerme
  e: number;                        // energía de scroll 0..1
  heat: Float32Array | null;        // calor del puntero por celda (cols·rows) o null
  rings: Ring[];                    // anillos de toque/foco vivos (≤ 3)
  cap: Uint8Array | null;           // tope de tono por celda (pozos); el MOTOR lo aplica después de pintar
  still: boolean;
}
export interface SceneState { cls: Uint8Array }   // por celda: 0 aire · 1 cara · 2 borde · 3 sombra/halo (lo usa la marea para deshacer y formar)
export interface Scene {
  id: SceneId;
  dawn: number;                                   // 0..1 (§5.4)
  arrival: { ms: number };                        // duración del guion de llegada
  build(spec: GridSpec, lang: Lang, words: WordSet[]): SceneState;   // 1 vez por tamaño e idioma; puro; corre en Node
  paint(g: Cells, s: SceneState, f: Frame): void; // PURA en (p, t, e, heat, rings): sin DOM, sin Math.random; escribe TODA la pantalla
}
```

**Reglas de una escena** (las comprueban las pruebas de §13): (1) `paint` es **determinista**; (2) **solo enteros y polinomios** en la ruta del fotograma `still` (prohibido `Math.sin/cos/pow/exp` ahí: R06 §4.1; las olas y la marea sí pueden usarlas porque no tienen póster; la gaussiana de la bruma `exp(−r²·1,6)` de §5.5 es una **tabla entera `GAUSS[256]`** de `kit.ts`, no una llamada a `Math.exp`); (3) la escena `cover` **no usa `bg`** (tiene póster SSR: pinta solo en fg; donde hace falta «vidrio», `█` en T1–T2); las demás escenas pueden usarlo; (4) sin asignaciones por cuadro; (5) `still` ≡ `paint(…, p = 1, t = STILL_T, e = 0, heat = null)` con `STILL_T = 21,7` (el de `hero.ts`).

**`src/ascii/kit.ts`** (WP4) entrega las piezas comunes para que las cuatro manos de escenas no se pisen: `mist()`, `halo()`, `shadow()`, `faceFn()` (cara + aro + bisel), `waterLevel()`, `bevel()`, `ring()`, `edt()` (distancia exacta anisótropa 1:2), `bn(x, y)` (ruido azul 32×32 + *jitter* de hash), `h2/vnoise/fbm` enteros y `tile()` (§6.8).

### 6.4 La marea: la costura entre carteles

**Geometría.** Coordenadas de pantalla (celdas). El frente es una línea ondulada que **sube** (avance) o **baja** (retroceso) por la pantalla:

```ts
const front = (x: number, yb: number) =>            // yb: fila del frente (de rows+BAND a −BAND)
  yb + 14 * (fbm(x * 0.05, 3.7, 3, 9) - 0.47) + 1.1 * Math.sin(x * 0.12);   // ±7 filas de ondulación
const dist = y - front(x, yb);                      // < 0 arriba del frente · > 0 debajo
const BAND = isMobile ? 3 : 4;                      // semiancho de la banda de agua, en filas
```

**Reglas por celda** (las dos primeras se vieron en color, §2.1):

| Zona | Qué se pinta |
|---|---|
| `dist < −BAND − REACH` | el cartel saliente **tal cual** (`still` cacheado) |
| `−BAND − REACH ≤ dist < −BAND` | el saliente **se deshace**: `p = 1 − (−BAND − dist)/REACH`; `τ = 0,55·bn + 0,45·fbm`; la celda pasa a agua (`▒`, T5–T8) si `p·(borde ? 0,75 : 1,1) > τ` → **primero se vacía el interior, al final el aro** |
| `|dist| ≤ BAND` | **banda de agua**: `d = cresta·0,8 + 0,35·(1 − |dist|/BAND)`; glifo `░ ▒ ▓` por `d`; tono T4–T10; espuma `*` (45 %) y `~` (30 %) en T12–T14 a ±1 fila |
| `BAND < dist ≤ BAND + REACH` | el entrante **cristaliza**: `p = (dist − BAND)/REACH`; se muestra la celda si `p·(borde ? 1,3 : 0,9) ≥ τ` → **primero el aro, después la cara** |
| `dist > BAND + REACH` | el cartel entrante en su `paint(p)` |

`REACH` = 12 filas (escritorio) · 9 (móvil). El frente recorre la pantalla en **`T = 1,4 s`** (avance) o **1,0 s** (retroceso) con `ease-in-out`; el `p` del entrante arranca a los `0,35·T` y dura `arrival.ms`. **Por tiempo, no por dedo** (R12): un fling de 2 400 px/s dispara la marea igual que un arrastre lento y **termina sola**.

**Política de interrupciones.** Si el objetivo cambia a mitad de marea, **se termina la marea en curso** (≤ 1,4 s) y se encola **una** pendiente; las intermedias se descartan (con un fling de 3 carteles solo se ve el primero y el último). No se deja **nunca** una marea detenida a mitad: si el scroll se detiene con el frente en pantalla, la marea **termina igualmente** (porque corre por tiempo). Esto resuelve «mitad de transición = sucio» (§2.1) y el mínimo garantizado (MA-4).

**Destellos (2.3.1).** Ninguna oscilación global > 2 Hz: los cambios de glifo son independientes por celda; la banda de agua se suaviza con la memoria exponencial `k = 1 − e^(−12·dt)` del tono; ninguna celda cambia de tono más de 3 veces por segundo; el área de espuma < 341×256 px. Verificación con PEAT en M1 (no hecha aún).

### 6.5 Llegada de cada cartel

Cada escena define su guion en función de **`p` ∈ [0, 1]** (por tiempo). Reglas comunes: (a) `p = 1` es el estado final a **brillo pleno**; (b) el guion cabe en `arrival.ms` (600–1 900 ms) **contando desde que el frente pasa por el cartel**; (c) total de una transición (marea + llegada) **≤ 2,4 s**; la ignición de la portada, **≤ 2,6 s**; (d) al volver atrás, el cartel que reaparece usa `p` de 0,5 a 1 en la mitad de tiempo. El detalle de cada guion está en §7.

### 6.6 Calor, toque, energía y foco

| Entrada | Respuesta | Técnica |
|---|---|---|
| Ratón / lápiz | **Calor**: brillo local que sigue al puntero (la «lente» de hoy, sin vidrio) | núcleo gaussiano de radio ≈ 7 celdas de ancho (corregido por la proporción), `heat[i] = max(heat[i], w²)`; decae con τ = 0,45 s; se estampa **una vez por cuadro** con el último punto |
| Toque | **Anillo** que se expande 28 celdas/s durante 1,2 s (≤ 3 vivos) | `pointerdown` pasivo, sin `preventDefault`; **nunca** `touch-action: none` |
| Teclado | Al enfocar `a` o `button`, un **anillo** desde el centro del elemento | `focusin` |
| Scroll | **Energía** `e = max(e·e^(−dt/0,9), min(1, v/2400))`; acelera el agua (`t += dt·(0,1 + 0,85·e)`) y dispara la marea | velocidad de scroll, no `pointermove` (en táctil llega `pointercancel`) |
| Reposo | Nada se mueve solo | duerme a los 1,6 s |

Cada cartel **reacciona al calor a su manera** (§7); ninguna reacción lleva texto y todas son **opcionales** (sin calor el cartel está completo).

### 6.7 «Pasada ASCII del shader de portada»: qué pasa con `hero.ts`

**Decisión.** El shader de luz líquida de dos pasadas (`fragA` altura + `fragB` iluminación y lente) **se retira**. Su *estructura* (dos `fbm` anidados con deformación de dominio) sobrevive como la función `agua()` **por celda en CPU**; la GPU solo hace el **sello** (atlas de glifos, una lectura por celda y una por glifo, un `drawArrays`). Es lo contrario de la canalización de 4 pasadas de R02, y por estas medidas:

| Criterio | R02 (GPU, P0–P3) | Decisión (CPU por celda + sello GPU) |
|---|---|---|
| Medido | Solo en RTX 5070 Ti y SwiftShader; «el A07 no se midió»; P3 es el 85–95 % del cuadro en un renderizador limitado por relleno | Escena en CPU: **0,09–0,10 ms por 4 480 celdas** con tesela (Mundo §8.5 [M]) ≈ 0,5 ms con CPU ×4; sello WebGL2 **0,05 ms** (0,15 con CPU ×4) (R05 §1.3 [M]) |
| Paridad con el póster SSR | Imposible (la GPU no corre en Node) | **Estructural**: la misma `paint()` corre en Node |
| Bandas/escenas por cartel | No encaja (campo continuo) | Es el modelo natural: una `paint()` por cartel |
| Riesgo en Mali-G57 | `texelFetch` y fleco por píxel sin medir | Lo de GPU se reduce a 3 lecturas por píxel; `low`/`min` bajan el DPR |

**Qué se conserva de `hero.ts`:** `INTRO_SECONDS = 2,6`; `STILL_TIME = 21,7` (→ `STILL_T`); `?still` y `?tier=`; el **control adaptativo que solo baja**; el **reposo sin bucle continuo**; el objeto de depuración (`__hero` → `__field`); el respaldo por `reduced`/`saveData`. **Qué se retira:** `fragA`, `fragB`, `uLens`, la dispersión R/G/B, el grano `noise.png`, `hero-poster-*.webp`, `HeroCards.astro`. La **lente** pasa a ser **calor** (§6.6). Las variables `--glow-gloss/prism/flow` dejan de leerse y se eliminan de `tokens.css`; `--glow-0..3` **se conservan** (son la fuente de los tonos).

### 6.8 El agua: tesela periódica

Para no evaluar ~15 llamadas de ruido por celda y por cuadro, el agua se **hornea una vez** en una **tesela periódica de 64×64** (`Uint8Array`, cresta `(1 − |2h − 1|)⁴` de un `fbm` de 3–4 octavas con deformación de dominio, toda en **aritmética entera y `+ − ×`**: determinista entre motores) y se lee con **dos muestras bilineales** a escalas y velocidades distintas, combinadas (Mundo §8.5: 3–4 ms el horneado). El tiempo desplaza la lectura (`t·0,02`), nunca recalcula ruido.

```ts
// src/ascii/kit.ts (extracto de referencia)
export const TILE = 64;
export function bakeWaterTile(seed = 9): Uint8Array {           // ~3–4 ms; se incrusta como resultado de build o se hornea al arrancar
  const t = new Uint8Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const u = x / TILE, v = y / TILE;
    const q1 = pfbm(u * 5 + 0.0, v * 5, seed + 3), q2 = pfbm(u * 5 + 5, v * 5 + 1, seed + 4);   // pfbm: fbm PERIÓDICO (la malla envuelve a 64)
    const h = pfbm(u * 4 + 1.7 * q1, v * 4 + 1.7 * q2, seed + 9);
    const r = 1 - Math.abs(2 * h - 1);
    t[y * TILE + x] = Math.round(255 * r * r * r * r);
  }
  return t;
}
export const agua = (tile: Uint8Array, c: number, r: number, t: number, asp = 2): number =>   // 0..1
  (sample(tile, c * 0.031 + t * 0.020, r * asp * 0.031) * 0.62 + sample(tile, c * 0.053 - t * 0.014, r * asp * 0.053 + 7.3) * 0.62) / 255;  // `sample`: bilineal con envoltura
```
**Criterio de aceptación:** la captura de producción a `STILL_T` **no tiene que ser idéntica** al prototipo (el agua del prototipo usó `fbm` sin tesela); tiene que **conservar su carácter** (filamentos finos, vetas largas, sin repetición visible a simple vista en una pantalla) y **aprobarla el dueño** (§14.1).

### 6.9 Póster SSR y arranque (LCP)

**Hecho medido [M]:** Chrome 154 cuenta el texto generado por `::before` como candidato de LCP (el elemento es el anfitrión). Por eso:

- **Con JS** (ruta normal): el HTML trae el `h1`, el lead y los botones (texto real: **eso es el LCP**); el póster SSR está en el HTML pero con `display: none` y **no se pinta**. El lienzo aparece tras `load` + inactividad y arranca la ignición. Antes de eso hay un fondo T0 con el texto: es un arranque limpio, no una pantalla rota.
- **Sin JS** (`<noscript><style>`), **o si el motor falla o no puede arrancar** (`data-field="ssr"` puesto por el motor): se **muestra** el póster de la portada (la variante que corresponda por `@container`), como `div[data-nosnippet][aria-hidden][translate="no"]` con **4 capas de tono** (`dim`, `mid`, `hot`, `spark`, cada una un `span.art[data-art]` con la misma rejilla y color `var(--tN)`; **sin `bg`**). Es el fotograma `still` cuantizado a 4 tonos: **no es idéntico celda por celda al del motor de 16 tonos** (CI-2) y no se promete que lo sea; la prueba de paridad (§13, T6) comprueba que **capa y glifo** coinciden con el cuantizado del motor.
- **Tres variantes** del póster (`wide` 160×50, `mid` 113×44, `stack` 65×70) conmutadas por `@container (min-width: Nch)` con **N = columnas** (133 · 96 · 60): los umbrales van en **celdas** (`ch` del propio contenedor), no en píxeles de ventana (MI-5); el zoom de solo texto y la escala de fuente de Android **se prueban** en T13, porque pueden descuadrar el arte si el navegador impone un tamaño mínimo de fuente (R03 §1.4, [no verificado]); medidas [M]: **`wide` 2,05 KB gz**, **`stack` 1,59 KB gz**, `mid` ≈ 1,8 KB [C]. Total ≈ 5,5 KB gz de HTML por idioma.
- **Sin JS, el resto de la página**: textos, placas, hilo, reglas y emblemas (arte en DOM) **sí están**; los carteles de WEB…TÚ **no** (CI-7: «solo la portada tiene arte sin JS», dicho con honestidad).
- **Movimiento reducido con JS**: el motor arranca en `still` y dibuja los carteles (2D o WebGL) **sin póster SSR**.
- `og:image`: `scripts/og.mjs` renderiza la portada a `STILL_T` con Playwright y el motor real (1200×630), sin mencionar cómo se hizo.

### 6.10 Renderizadores y capacidades

**Detección** (CI-7, MI-4): no se usa la cadena del renderizador como criterio principal.

```ts
const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
// null ⇒ sin WebGL2 o solo raster por software ⇒ modo still con Canvas 2D (no hay ruta viva por CPU)
// Segunda barrera: WEBGL_debug_renderer_info ~ /SwiftShader|llvmpipe|Software/i ⇒ still
```
- **Vivo (WebGL2)**: textura de celdas `RGBA8UI` + atlas de máscaras + paleta de 16 entradas; 1 `drawArrays`; `texelFetch`; contexto **por defecto** (no `alpha:false`); `gl.disable(gl.DITHER)`; `WEBGL_lose_context` al destruir; `webglcontextlost` con `preventDefault()`, `webglcontextrestored` reconstruye; si falla dos veces → `still`.
- **Fotograma fijo (Canvas 2D)**: `fillRect` para bloques y cuadrantes; `fillText` por celda para glifos de fuente; con diff respecto al fotograma anterior no hace falta (se dibuja entero una vez por cambio de cartel). Coste esperado 70–100 ms con CPU ×4 (R05 §1.3) → se divide en **dos cuadros** por filas para no pasar de 50 ms por tarea. Nunca `getImageData`, nunca `globalCompositeOperation='copy'` (R05 §7 #2–3).
- **Ningún otro respaldo**: el Canvas 2D de 8 fps de R05 **se elimina** (MI-4, CI-5).
- **Lighthouse en tres rutas** (puerta de M1): WebGL2, `?nogl` (2D fijo) y sin JS (`--disable-javascript`), las tres ≥ 90.

### 6.11 Tiers, fps, sueño

| Tier | Celdas máx. | fps | DPR | Uso inicial |
|---|---:|---:|---:|---|
| `high` | 9 000 | 30 | 2 | escritorio con ≥ 8 GB y ≥ 8 núcleos |
| `mid` | 6 500 | 30 | 2 | resto de escritorio; móvil de gama alta |
| `low` | **4 800** | 30 | 1,5 | **arranque de todo puntero grueso** (A07: 60×66 = 3 960 celdas) |
| `min` | 2 400 | 20 | 1 | tras bajar de `low` |

Acumulador con módulo y tolerancia de 2 ms (correcto en 60/90/120 Hz: en el A07, 90 Hz ⇒ un cuadro de cada tres). **30 fps por defecto**; `?fps=45` es un experimento de F1 (decisión tras medir; CI-8). Control adaptativo: mediana de 45 cuadros (CPU por cuadro, `paint` + composición + subida) `> 0,45 × intervalo` ⇒ **baja** un tier y reinicia la muestra; **nunca sube**. Sueño: 1,6 s sin entrada ni guion activo ⇒ se cancela el `rAF` (queda el último cuadro). Pausa con `document.hidden`, menú abierto y contexto perdido; `pageshow` con `persisted` redibuja; `dispose()` obligatorio (HMR y pruebas).

### 6.12 Rendimiento: presupuesto, protocolo y puerta del A07

**Presupuesto por cuadro** (CPU ×4 como proxy; **medir en el A07**): `paint` + composición + pozos + subida ≤ **6 ms** (mediana) y ≤ **12 ms** (p95); horneado (atlas + tesela + `build`) ≤ **16 ms**; ninguna tarea > **50 ms** tras el horneado; primer fotograma **< 600 ms** tras `load`. Estimación [C] del coste medio por cuadro, sin medir: tesela 0,4 ms · caras y aro ~0,6 ms · composición de la marea 0,6 ms · pozos 0,1 ms · subida + sello 0,15 ms ⇒ **≈ 2 ms** (CPU ×4), con mucho margen; **si no se cumple, la escalera es** (R02 §8, en este orden): bajar `maxCells` → bajar `dpr` → `fps` a 24 → quitar la banda de espuma → marea de 2 octavas.

**Protocolo** (CI-8, II-2, MI-2): (1) Chrome remoto (`chrome://inspect`) en un **A07 físico**; (2) `window.__field` con `costP50`, `costP95`, `tier`, `frames`, `sleeping`; (3) secuencias: portada en reposo 10 s · ignición · scroll continuo 10 s · cada marea · fling de 2 400 px/s; (4) pasa si: mediana ≤ 6 ms, `tier` sin bajar, ninguna tarea > 50 ms, `sleeping === true` a los 2 s; (5) repetir en un **iPhone** y en los navegadores integrados de Instagram, TikTok y WhatsApp. **Hasta tener un A07 real**, se usa CPU ×4 y ×6 de DevTools como proxy y **se declara en el informe de cada hito** que la puerta está abierta.

### 6.13 Depuración y parámetros de URL

`window.__field = { mode, tier, cols, rows, cell, variant, frames, sleeping, costP50, costP95, poster, cur, target, p, tide }`. Parámetros: `?still` (congela en `STILL_T`); `?still&poster=<id>&p=<0..1>` (un cartel a un `p`, para capturas y regresión); `?tier=low`; `?fps=45`; `?nogl` (simula sin WebGL2); `?poster` (solo póster SSR).

### 6.14 Archivos del motor

```
src/ascii/
  types.ts           contratos (§6.3)                                           WP0
  glyphs.ts          lista única de glifos (índice ↔ carácter) y su tipo         WP4
  tones.gen.ts       T0–T15 (generado por scripts/tones.mjs)                    WP1
  noise.ts           h2 / vnoise / fbm enteros                                  WP4
  kit.ts             mist, halo, shadow, faceFn, bevel, ring, edt, bn, tile     WP4
  grid.ts            Cells (4 B/celda), put/tone/blit/overlay/toText/toLayers   WP4
  wells.ts           máscara de topes desde rectángulos, inflado por velocidad   WP4
  tide.ts            front(), reglas de deshacer y formar, cola de transiciones  WP4
  words.ts           decode(RLE) + pickVariant(cols, id, lang) + pilas           WP3
  data/words/…       <lang>/<ID>.<variante>.txt  →  words.gen.<lang>.<id>.ts    WP3
  ssr.ts             renderPosterLayers(scene, spec, lang) → 4 cadenas           WP4
  dom-art.ts         reglas, palabras mini, hilo, emblemas → data-art (build)    WP10
  atlas.ts           atlas de máscaras (texto por fuente, bloques por código)    WP5
  render-gl.ts       textura de celdas + atlas + paleta, 1 draw                  WP5
  render-2d.ts       fotograma fijo en Canvas 2D (2 cuadros)                     WP5
  engine.ts          arranque, estados, relojes, marea, calor, sueño, tiers      WP5
  scenes/common.ts   reexporta kit + utilidades de escena                        WP4
  scenes/{cover,hola,mist}.ts  WP6 · {web,listo}.ts WP7 · {eco,on}.ts WP8 · {ver,tu}.ts WP9
```

---

## 7. Las escenas: una idea concreta por cartel

**Reglas comunes.** Todas cumplen el contrato de §6.3 y las reglas R10–R16. Cada escena se entrega en tres capas (R19): **(1) `still`** (fotograma final, revisión de arte a 320, 375, 414, 768, 1024 y 1440 px), **(2) llegada** (`p` por tiempo) y **(3) interacción** (calor, anillos). Toda escena nombra: *lo que dibuja, su guion, su reacción, su composición móvil, su estático y su coste*. Las imágenes del §2.1 son las de referencia de estilo; donde el prototipo no llegó (LISTO final, VER, reflejo de TÚ) se dice.

### 7.1 `cover` · GAYA — «el agua hecha del nombre»

- **Dibuja.** La palabra `GAYA` (L/M/S/XS) con la anatomía de §5.5 y **vidrio con agua**: aro de luz, sombra `░`, **nivel de agua** (en reposo 0,85, menisco `~` T14), cáusticas T7–T12, halo y **bruma** `░▒▓·:` que emana de la palabra con viñeta hacia las esquinas. Sin `bg` (tiene póster SSR).
- **Guion** (`p`: 0→1 en **2,6 s** desde el arranque del motor): `0–0,15` bruma que se abre desde el centro (radio 0→100 %); `0,05–0,25` aro de luz (solo celdas parciales); `0,10–0,85` **el nivel sube de 0 a 0,85** (`easeOutExpo`); `0,30–0,80` cáusticas (su contraste 0→1); `0,75–1` sombra, halo completo y 3–6 chispas T15. Después, **reposo**: 0 fps.
- **Reacción.** *Calor*: el puntero ilumina el vidrio vacío (celdas por encima del nivel dentro del radio suben a T6–T9, «linterna») y acelera las cáusticas ×3 en su radio; se recompone en 0,45 s. *Toque*: anillo que recorre la palabra.
- **Móvil.** `GA / YA` de 12 filas, la 2.ª línea desplazada 3 columnas; bruma viñeteada; texto abajo (§4.4). Verificado [M] a 360×800.
- **Estático.** `p = 1`, `t = 21,7`. Es también el `og:image` y el póster SSR (cuantizado a 4 tonos).
- **Coste.** Caras ≈ 1 500–2 000 celdas (L) + bruma en todas las celdas (2 lecturas de tesela). Con CPU ×4 ≈ 2 ms (estimado [C]).
- **Texto encima.** `h1` y botones bajo pozo `ink` (T6), lead bajo pozo `muted` (T4).

### 7.2 `hola` · HOLA / HELLO — «hola contiene ola» (**momento firma**)

- **Dibuja.** `HOLA`: la **H sólida** (cara T8 con cáusticas, aro, sombra) y **«OLA» hecha de olas**: dentro de las tres letras, **rayas de ola** `s = sin(0,34·x + 0,55·y + φ)` → tonos T10 (`s > 0,55`), T8 (`> 0,05`), T6 (`> −0,45`), T5; cresta `~` T14 donde `s > 0,86` (vista [M]). En inglés: **H sólida y «ELLO»** con olas.
- **Guion.** La llegada es la **marea** (§6.4) y la palabra **nace por su contorno**: primero el aro, luego la cara; después la H cristaliza y «OLA» gana amplitud (0→1) entre `p = 0,3` y `1` (`arrival.ms` = 900). **El guion es el momento firma completo (1,4 s):**

| t | En pantalla |
|---:|---|
| 0 | GAYA en reposo; el borde de «Quiénes somos» cruza el 75 % del visor |
| 0,0–0,4 s | Por abajo asoma la **línea de agua ondulada**; la base de GAYA empieza a mojarse: el interior se vacía hacia el frente y queda el aro |
| 0,4–0,9 s | La banda de agua (8 filas) cruza la palabra; **debajo, HOLA nace por su contorno**; espuma `*~` |
| 0,9–1,4 s | Del nombre solo queda un aro fantasma que se disuelve; la H cristaliza sólida; «OLA» ondula |
| después | Reposo; fase de las olas `t` avanza solo con energía de scroll y duerme a los 1,6 s |

- **Reacción.** *Calor* sobre «OLA»: la amplitud sube ×2 y la fase ×3 en su radio; sobre la H, la cara brilla +2 tonos. *Toque*: anillo.
- **Móvil.** `HO / LA` (`HEL / LO`), H sólida en la primera línea.
- **Estático.** `p = 1`, fase de olas en `t = 21,7`.
- **CA-2 resuelto:** dura 1,4 s **independientemente** de la velocidad del dedo; se prueba en un fling de 2 400 px/s (§13, T9). **CN-8 resuelto:** el texto **nunca** va sobre «OLA»: el `h2` y la frase de marca van **debajo** de la palabra (filas 28–40) y la placa sube después.

### 7.3 `web` · WEB — «plano, obra, publicado»

- **Dibuja.** Tres estados de **la misma palabra**:
  1. **Plano** (`p < 0,30`): solo el **aro** (T7), que se traza **celda a celda con una cabeza brillante (T15) y su estela**, y una retícula de puntos `·` T3 cada 4×3 celdas dentro;
  2. **Obra** (`0,30–0,85`): se **levanta por pisos de abajo arriba** —no por disolución aleatoria, que se vio sucia—: cada letra (W, E, B) sube con retardos 0 / 0,12 / 0,24; en el piso actual hay **andamio** (`─` cada 5 filas T6, `│` cada 9 columnas) y una **línea de grúa** (T14) en el borde del relleno; cara T5→T8 según avance;
  3. **Publicado** (`0,85–1`): cara sólida T8–T12, aro, luz, sombra, y un **destello de publicación**: una línea de luz T15→T9 con cola de 5 celdas cruza el cartel de izquierda a derecha **una sola vez**, monótona.
- `arrival.ms` = 1 600. **Reacción**: el **calor pinta la obra** (rellena celdas en su radio aunque el nivel no haya llegado; memoria de 1,6 s): «la web se construye donde la tocas».
- **Móvil.** `WE / B` de 10 filas. **Estático.** Publicado.
- **Honestidad.** Enseña un sitio que se construye y se publica; no afirma resultados ni cifras.

### 7.4 `listo` · LISTO / READY — «el desorden se ordena»

- **Dibuja.** Cada celda de cara y aro parte de un **desplazamiento aleatorio** (±35 columnas, ±17 filas, por hash) y **vuela a su sitio** con retardo `0,35·hash + 0,25·(x/cols)` y `ease` (`k = smooth(clamp((p − retardo)/0,5))`): la palabra se **ensambla** desde el polvo de su propio material (T7–T8), sin campo de líneas alrededor (se vio como circuito). Al asentarse, la cara se llena de **rayado `╱`** T9 sobre T6 (hachura) y el aro se cierra en T12.
- **Guion.** `arrival.ms` = 1 500: a `p = 0,5` ≈ mitad de celdas en su sitio (vista [M]); `0,9–1` un **pulso de tono** (+2) recorre las letras una vez; sin parpadeos.
- **Reacción.** El calor **asienta** las celdas cercanas al puntero (`k → 1`): «alinea».
- **Móvil.** `LIS / TO` (`REA / DY`). **Estático.** Ensamblado, hachura.
- **Sin texto en la imagen** (ni chat, ni cifras): el arte no dice «bot», dice «orden». La honestidad del servicio (reglas, traspaso a una persona) vive en el texto.

### 7.5 `eco` · ECO / ECHO — «tu alcance sale de tu nombre»

- **Dibuja.** `ECO` sólido (cara T9 con cáusticas, aro, sombra) y **ecos**: **bandas de tono concéntricas** según la **distancia euclídea exacta a la palabra** (anisótropa 1:2; `edt()` del kit, 0,27 ms para 171×48 celdas según cartel.md §4, medido en Node); radios `R_k = (k + u)·4,6 + 1,4` anchos de celda, grosor 0,62, `k = 0…5`; el anillo 0 en `▒` T8, los demás en fondo T3→T2 con `:` T4→T3. Los anillos de una sola línea fina **no se ven** (prueba [M]): por eso son bandas.
- **Guion.** `u = 0,3 + 0,7·ease(p)`: nacen en el borde y **se alejan**; `arrival.ms` = 1 400. El estático es `u = 0,65` (3–4 anillos visibles).
- **Reacción.** El **toque emite eco literal**: 3 anillos circulares (corrección 1:2) desde el punto, 1,4 s. El calor engrosa los anillos cercanos.
- **Móvil.** `EC / O` (`EC / HO`), anillos hasta 18 celdas. **Estático.** `u = 0,65`.

### 7.6 `on` · ON — «sigue encendido» (continuidad, no apagón)

- **Dibuja.** Un **neón**: solo el tubo (celdas parciales y llenas a ≤ 1 celda del borde, `█` T12–T14), su **halo** (`▒` a ≤ 1,6 celdas T7 sobre T2; `░` a ≤ 3 T5; `·` a ≤ 4 T4) y el **piloto** (una celda `▄` T15 a la derecha de la N, `░` T8 al lado); interior oscuro T1 (vista [M]: lee como rótulo inequívoco y es el cartel más distinto **sin cambiar de lenguaje**).
- **Guion** (`arrival.ms` = 1 900): `0–0,25` neón encendido; `0,25–0,55` **se apaga el ambiente** (la bruma y el susurro; factor `amb` 1→0 suavizado a 250 ms; **ningún texto cambia**); `0,55–0,75` a oscuras queda **solo el neón y su piloto** (el tubo **nunca** baja de T12); `0,75–1` **el ambiente vuelve desde el piloto** hacia afuera (frente circular de 90 celdas). El neón no parpadea: lo que se va y vuelve es la luz de **alrededor**.
- **Reacción.** *Linterna*: durante el apagón, el calor devuelve la bruma localmente (radio 7); en táctil, un toque enciende un tramo 1,2 s.
- **Por qué no se lee como error** (IN-7, CN-3): el texto real no cambia; el neón y el piloto están siempre; la luz vuelve en el mismo cartel; con movimiento reducido **no hay apagón** (es el neón encendido). **No** se cita el dato de apagones de la prensa ni se dramatiza: la ficha de Soporte lleva el dato de **respaldo** (regla 3-2-1 de CISA).
- **Móvil.** **Línea** de 12 filas ×50 cols (la pila sale estrecha). **Estático.** Neón encendido.

### 7.7 `ver` · VER / SEE — «lo que se ve se elige»

- **Dibuja.** Las tres letras como **vidrio oscuro** (T2 con aro T9) que se **encienden con un barrido de luz** de izquierda a derecha (1,2 s): cara T5→T9 y aro T13 al paso. Bruma con `dawn` 0,5.
- **Las filas de ejemplos** (DOM, sobre placa): emblema de 11×5 celdas · nombre · rubro · `Ver ejemplo` · `Quiero una así` (WhatsApp con el mensaje **del ejemplo** ya escrito). Al **enfocar o pasar** una fila, su emblema pasa a T13 y se lanza un **anillo** sobre la letra más cercana: causa y efecto a la vista, sin texto (CN-4).
- **Se sustituyen** las miniaturas ASCII de capturas reales (R01 §5.13): salieron abstractas y una, vacía (mundo.md §1.3 [M]). La captura real se ve en el visor `/referencias/<slug>/`.
- **Datos.** Solo ejemplos **construidos** (`builtRefs()`); el número del enlace final es el real (hoy 3). Sello **«Datos ficticios»** como etiqueta junto al `h2` (MN-7) y en cada emblema.
- **Móvil.** `VE / R`. **Estático.** Letras encendidas.

### 7.8 Proceso (DOM, sin lienzo) — «de hola a listo»

Es la única pieza **sin lienzo** (alineación exacta con el texto): el **hilo** de §5.10 entre `HOLA` (proc) y `LISTO` (proc). Las 4 estaciones son HTML real (`ol`): *Hablamos por WhatsApp · Propuesta por escrito · Construimos con avances · Entregamos y acompañamos*. **Sin JS o sin `animation-timeline`**: hilo completo y encendido. Hover/foco en una etiqueta ilumina su nodo. La insignia «24–48 h» solo aparece si `brand.confirmed.proposalHours` es `true`.

### 7.9 `tu` · TÚ / YOU — «el último cartel es el tuyo» (**cierre**)

- **Dibuja** (desktop 160×50; MA-2, MA-5, MN-3): `TÚ` en vidrio con agua como GAYA (**marco de apertura y cierre**), **nivel al 100 %** (el clímax); debajo, entre la palabra y la ciudad, el **botón** (DOM); **horizonte de Santo Domingo** y su **reflejo**:

| Filas | Contenido |
|---:|---|
| 0–24 | `TÚ` (L: 17 filas + acento 7) centrada |
| 25–28 | botón «Escríbenos por WhatsApp» (DOM, pozo `ink`) |
| 30–41 | **silueta** de 12 filas: torres modernas de tamaños y alturas distintos (`█` T2, luz de borde `▀` T6, ventanas `▄` T12 por hash, 22 % al final), **campanario con cruz** (`┼` T10), **Puente Juan Bosch** (dos pilonos en H T3 con tirantes `·` T6), muro del Malecón (`▀` T6) con farolas `·` T10 |
| 42 | línea de agua (`─╌` T8) |
| 43–49 | **reflejo**: la silueta espejada, atenuada (`▒` < 4 filas, `░` < 8, `·`) y **ondulada** (`desp = 2,2·sin(0,9·dy + 0,11·x)·min(1, dy/5)`), con descarte por ruido 30 % y `~` dispersos T4 |

- **Guion** (`arrival.ms` = 1 600): `0–0,6` **el agua sube** en TÚ hasta el 100 %; `0,3–0,9` **las ventanas de la ciudad se encienden una a una** (orden por hash); `0,5–1` el reflejo ondula y se asienta; chispas T15 ≤ 0,5 %. **El clímax no depende del ratón** (MA-5): ocurre al llegar.
- **Reacción.** **Al enfocar, pasar o tocar el botón de WhatsApp**, un anillo de luz recorre `TÚ` (+2 tonos, 0,6 s): une el botón con el cartel sin explicarlo. El calor ondula el reflejo.
- **Móvil (60×66).** `TÚ` en línea (14 filas + 6 del acento) filas 2–22; botón 26–30; silueta de 8 filas (3 torres + puente simplificado) 34–41; horizonte 42; reflejo 43–52; la placa de contacto viene después.
- **Estático.** Lleno al 100 %, ventanas encendidas, reflejo quieto.
- **Sensibilidad y fidelidad** (MA-2, MA-8, MN-3): **sin Faro a Colón ni Obelisco**; la silueta **no lleva nombres ni texto**; solo el puente (pilonos en H, R05 §1.6 [V]) y un campanario genérico con cruz son reconocibles; las torres son genéricas (no se nombra Piantini ni Naco). **Requiere visto bueno del dueño** (§14.2 #3) y, **si no lo da, el cartel se entrega sin silueta**: `TÚ` + línea de agua + su reflejo (igual de bello, cero riesgo de fidelidad). La silueta es la pieza de menor prioridad del plan (M4, P1).

### 7.10 `mist` · bruma

Fondo de las secciones sin palabra (Índice, Proceso): la bruma de `cover` con `dawn` propio y densidad ≤ 35 %, sin palabra; **se dibuja en vivo** (no tiene estático propio) y respira con la energía de scroll.

### 7.11 El ritmo completo: un acontecimiento por pantalla (R10)

| Pantalla | Lo que ocurre |
|---:|---|
| 1 | **Ignición** de GAYA (el agua sube) |
| 2 | **Marea**: GAYA → HOLA; la placa de «Quiénes somos» empieza a subir |
| 3 | La **placa** tapa a HOLA (efecto cortina); la H brilla al pasar el puntero |
| 4 | **Índice**: las reglas `─┼─` se trazan con `view()`; las palabras mini entran |
| 5 | **Marea** → WEB; el plano se traza, la obra sube, se publica |
| 6 | Placa de la ficha sobre WEB; dato con fuente |
| 7 | **Marea** → LISTO: las celdas vuelan a su sitio |
| 8 | Placa de la ficha de Automatización |
| 9 | **Marea** → ECO: los anillos salen de la palabra |
| 10 | Placa de la ficha de Marketing |
| 11 | **Marea** → ON: se apaga el ambiente, el neón sigue |
| 12 | Placa de la ficha de Soporte |
| 13 | **Marea** → VER: el barrido enciende las letras; filas de ejemplos |
| 14 | **Hilo** del proceso: se enciende hasta la estación que lees |
| 15 | **Marea** → TÚ: el agua sube, la ciudad se enciende |

---

## 8. Contenido definitivo (ES y EN)

Todo el texto de la página, en su forma final. La fuente de verdad es `src/data/services.ts`, `src/data/facts.ts`, `src/data/site.ts` y `src/i18n/copy.ts` (§12, WP2). **Voz**: «tú» en español neutro dominicano, inglés simple; titulares cortos; cero cifras propias, cero superlativos, cero «expertos»; nada instructivo (R1, R2).

### 8.1 Dos versiones del copy: v1 honesta y v2 con capacidades confirmadas

El informe R04 marcó varias capacidades como `[CONFIRMAR]` y propuso bloquear la build de producción hasta que el dueño las aprobara. Los jueces lo corrigieron (MN-5, IN-5, CN-8): **el bloqueo se cambia por banderas**. La **v1 sale sin que el dueño confirme nada**; cada línea de la **v2** está detrás de una bandera en `brand.json › confirmed` (todas `false` por defecto) y aparece sola al pasarla a `true`.

| Bandera (`brand.json › confirmed`) | Desbloquea |
|---|---|
| `proposalHours` | «Propuesta por escrito, en 24–48 horas» (placa, hilo) |
| `pricingModel` | «Propuesta por escrito con alcance y precio» y «mensual, sin permanencia» en Marketing y Soporte (señal comercial honesta, IN-10; ver R04 D10) |
| `accessOwned` | «Tus accesos y tus archivos son tuyos desde el día uno» (placa y ficha Web) |
| `store` · `nativeApps` · `cms` | Web: tienda en línea · app web instalable o a medida · panel para editar contenido |
| `whatsappApi` · `aiAgent` | Automatización: conexión con hojas de cálculo, correo y calendario · asistente de IA con las reglas y los datos de tu negocio |
| `ads` · `video` · `googleProfile` | Marketing: anuncios hacia WhatsApp · edición de Reels · perfil de Google si tu negocio califica |
| `remoteSupport` · `managedBackups` · `inventory` | Soporte: soporte por WhatsApp en horario hábil · respaldos vigilados con restauración probada · inventario documentado |

El lint (`scripts/lint-content.mjs`, §12 WP2) acepta **4 a 7** líneas de «Incluye» y **falla** si una línea v2 se publica sin su bandera. Ningún servicio menciona precios, plazos ni SLA.

### 8.2 Portada (`#inicio` / `#home`)

| | ES | EN |
|---|---|---|
| `<title>` | Gaya Digital · Tecnología para tu negocio | Gaya Digital · Tech for your business |
| `h1` | Tu negocio, imposible de ignorar | Your business, impossible to ignore |
| Lead | Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo. | Web, apps, marketing, IT support and AI. From Santo Domingo to the world. |
| Botón primario | Escríbenos por WhatsApp | Message us on WhatsApp |
| Botón secundario | Ver ejemplos → `/referencias/` | See samples → `/en/references/` |

El lead **nombra los cuatro servicios en una frase** y se sube a `clamp(1.125rem, 1rem + .8vw, 1.5rem)` (CN-6). En 360×800, `h1` + lead + botón caben **sin scroll** [M].

### 8.3 Quiénes somos (`#nosotros` / `#about`) — la placa

`h2`: **Quiénes somos** / **Who we are**. Una **placa** (`dl`) con filas `clave · valor`; las claves en Geist Mono 13 px `--muted`, los valores en Bricolage. **v1**:

| ES | | EN | |
|---|---|---|---|
| Marca | Gaya Digital | Brand | Gaya Digital |
| Director | Giancarlo González | Director | Giancarlo González |
| Desde | Santo Domingo, República Dominicana · trabajo remoto | Based in | Santo Domingo, Dominican Republic · remote work |
| Idiomas | Español · English | Languages | Español · English |
| Canal | WhatsApp primero: ahí empieza todo | Channel | WhatsApp first: that is where every project starts |
| Trato | Directo con el director, sin intermediarios | How we work | Straight with the director, no middlemen |

**v2** (con bandera): *Propuesta* — «Por escrito, en 24–48 horas» / *Proposal* — «In writing, within 24–48 hours» (`proposalHours`); *Accesos* — «Tus accesos y tus archivos son tuyos desde el día uno» / *Access* — «Your logins and files are yours from day one» (`accessOwned`).

Pie de la placa: **firma** «Giancarlo González · Director» y, como micro-dato, `Santo Domingo · 21:40` calculado en el cliente con `Intl.DateTimeFormat(lang === 'es' ? 'es-DO' : 'en-US', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit', hour12: false })` (UTC−4 todo el año; **sin API**; «Santo Domingo», no «SD»: IN-6; sin coordenadas ni UTC: CN-2).

**Presencia humana (CN-8, IN-5).** La placa lleva el **nombre y el rol** de Giancarlo; es lo único que se puede afirmar hoy sin inventar. Si el dueño aporta una **foto**, se convierte a un retrato de cuadrantes con el mismo rasterizador (§14.2 #9); **sin foto, no hay retrato** (no se fabrica una persona). **Prohibido** en este bloque: años, clientes, proyectos, «expertos», «equipo» en plural, fotos de stock, testimonios, logos.

### 8.4 Servicios: Índice (`#servicios` / `#services`)

`h2`: **Servicios** / **Services**. Cuatro filas (§4.3): nombre · promesa · «Ver detalle ↓» (`Ver detalle` / `See details`) · WhatsApp. Nombres (los del catálogo de WhatsApp Business) y promesas de §8.5.

### 8.5 Las cuatro fichas (v1)

Estructura **de cada ficha** (DOM, §4.4): `h3` · promesa · botón · **placa** con **Incluye** (lista), **Para quién / Necesitamos / Resultado** (`dl`, **plegado en `<details>` «Más detalles» en móvil**) y **un dato local** con su **fuente** (enlace). Etiquetas de campo ES/EN: *Incluye · Para quién · Necesitamos · Resultado* / *Includes · For whom · We need · Outcome*.

#### Desarrollo web y apps · `web` · palabra WEB

| | ES | EN |
|---|---|---|
| `h3` | Desarrollo web y apps | Web and app development |
| Promesa | Tu web, rápida y lista para vender por WhatsApp. | Your website: fast, and built to sell on WhatsApp. |
| Incluye (6) | Diseño propio, pensado primero para el celular · Sitio en español, en inglés o en ambos · Botón de WhatsApp con el mensaje ya escrito · Dominio y correo del negocio configurados · Pruebas de velocidad y accesibilidad · Publicación segura con HTTPS | Original design, mobile first · Site in Spanish, English or both · WhatsApp button with the message pre-written · Business domain and email set up · Speed and accessibility testing · Secure launch on HTTPS |
| Para quién | Negocios con o sin local, marcas personales y profesionales que hoy dependen solo de Instagram o WhatsApp. | Businesses with or without a storefront, personal brands and professionals who today rely only on Instagram or WhatsApp. |
| Necesitamos | Logo y colores (o los definimos juntos), textos e imágenes reales, acceso al dominio y una persona que decida por el negocio. | Logo and colors (or we define them together), real copy and images, domain access, and one person who decides for the business. |
| Resultado | Una URL en vivo, medida en velocidad y accesibilidad, con un botón que abre WhatsApp con el mensaje escrito. | A live URL, measured for speed and accessibility, with a button that opens WhatsApp with the message written. |
| Dato (F13) | Si un dominio .do vence, queda suspendido 30 días y 15 más en rescate antes de borrarse. | An expired .do domain is suspended for 30 days, then held 15 more before deletion. |

#### Automatización e IA · `automatizacion` · palabra LISTO

| | ES | EN |
|---|---|---|
| `h3` | Automatización e IA | Automation and AI |
| Promesa | Que WhatsApp responda, agende y avise por ti. | Let WhatsApp answer, book and notify for you. |
| Incluye (5) | Mapa de tareas repetidas: qué sí y qué no · Respuestas y menú automáticos en WhatsApp · Un piloto con un caso tuyo: citas, pedidos o preguntas frecuentes · Traspaso a una persona en cualquier momento · Ajustes durante el primer mes | Map of repeated tasks: what to automate and what not · Automatic WhatsApp replies and menu · A pilot with one of your cases: bookings, orders or FAQs · Handoff to a person at any moment · Adjustments during the first month |
| Para quién | Negocios que reciben los mismos mensajes todos los días: precios, horarios, citas y pedidos. | Businesses that get the same messages every day: prices, hours, bookings and orders. |
| Necesitamos | Las 10 preguntas que más te hacen, horarios y precios, acceso a tu WhatsApp Business y a tus herramientas, y quién atiende cuando el bot pasa la conversación. | The 10 questions you get most, hours and prices, access to your WhatsApp Business and tools, and who answers when the bot hands over. |
| Resultado | Un primer flujo probado con un caso real tuyo: el cliente escribe, recibe respuesta o agenda, y tú ves cada conversación. Si el bot no sabe, te la pasa. | A first flow tested with one of your real cases: the customer writes, gets an answer or books, and you see every conversation. If the bot does not know, it hands over. |
| Dato (F19) | WhatsApp exige ofrecer siempre un camino para hablar con una persona. | WhatsApp requires offering customers a way to reach a person at all times. |

#### Marketing digital y redes · `marketing` · palabra ECO

| | ES | EN |
|---|---|---|
| `h3` | Marketing digital y redes | Digital marketing and social media |
| Promesa | Que te encuentren, te escriban y te compren. | Get found, get messaged, get paid. |
| Incluye (5) | Revisión de tus perfiles y de tu competencia · Perfiles ordenados: bio, enlaces y WhatsApp · Calendario mensual de contenido, aprobado por ti · Diseño de piezas para publicaciones e historias · Reporte mensual: qué pasó y qué sigue | Review of your profiles and competitors · Tidy profiles: bio, links and WhatsApp · Monthly content calendar, approved by you · Design of posts and stories · Monthly report: what happened, what is next |
| Para quién | Negocios que ya venden pero casi no se ven, o que publican sin un plan. | Businesses that already sell but are barely seen, or that post without a plan. |
| Necesitamos | Acceso de administrador a tus perfiles, fotos y videos reales y una persona que apruebe el contenido. | Admin access to your profiles, real photos and videos, and one person who approves content. |
| Resultado | Un calendario aprobado antes de publicar, perfiles ordenados y un reporte mensual con lo que miden las plataformas. | A calendar approved before anything goes live, tidy profiles, and a monthly report with what the platforms measure. |
| Dato (F15) | Si tu cliente te escribe desde un anuncio o botón a WhatsApp, Meta da 72 h de mensajes sin cargo. | When a customer messages from an ad or button, Meta gives 72 hours of charge-free messages. |

#### Soporte e infraestructura IT · `soporte` · palabra ON

| | ES | EN |
|---|---|---|
| `h3` | Soporte e infraestructura IT | IT support and infrastructure |
| Promesa | Correo, redes y equipos que no te frenan. | Email, network and devices that keep you moving. |
| Incluye (5) | Revisión inicial de equipos, red y cuentas · Correo con tu dominio, bien configurado · Verificación en dos pasos en tus cuentas · Respaldos automáticos con copia fuera del sitio · Wi-Fi ordenado y un plan para cuando se va la luz | Initial review of devices, network and accounts · Email on your own domain, set up properly · Two-step verification on your accounts · Automatic backups with an off-site copy · Tidy Wi-Fi and a plan for when the power goes out |
| Para quién | Negocios pequeños sin departamento de sistemas y profesionales con equipo propio. | Small businesses with no IT department, and professionals with their own equipment. |
| Necesitamos | Lista de equipos y cuentas, acceso de administrador y una persona autorizada para aprobar cambios. | A list of devices and accounts, admin access, and one person authorized to approve changes. |
| Resultado | Una hoja: qué tienes, qué está protegido, qué falta y en qué orden se arregla. | One page: what you have, what is protected, what is missing and the order to fix it. |
| Dato (F30) | Regla de respaldo 3-2-1: tres copias, en dos medios, una fuera del sitio. | The 3-2-1 backup rule: three copies, on two media, one off-site. |

**Qué cambió respecto de R04 y por qué** (CN-5, MN-5, IN-4, CN-3): se quitan **SPF/DKIM/DMARC**, **datos estructurados**, **coexistencia**, **CRM** y **API** de las líneas visibles (se traducen a beneficio); se cae todo lo fiscal (**e-CF/DGII, Ley 30-26, Facturador Gratuito**), la **Ley 172-13**, las **multas**, los precios de dominios y pasarelas y el dato de **apagones de la prensa**; «Incluye» baja a **5–6**; Automatización se vende como **«piloto con un caso»**; Soporte no promete soporte remoto ni respaldos gestionados hasta que el dueño los confirme. **Nunca** se prometen «posición #1», «ventas garantizadas», «ROI», «cero caídas», «100 % seguro», «24/7» ni cumplimiento de la DGII.

### 8.6 Ejemplos (`#ejemplos` / `#samples`)

| | ES | EN |
|---|---|---|
| `h2` | Ejemplos | Samples |
| Sello (etiqueta junto al `h2` y en cada emblema) | Datos ficticios | Fictional data |
| Fila | *Nombre* · *Rubro · Tipo* · [Ver ejemplo] · [Quiero una así] | *Name* · *Sector · Type* · [View sample] · [I want one like this] |
| Enlace final | Ver los *n* ejemplos → `/referencias/` | See all *n* samples → `/en/references/` |

*n* es el número real de ejemplos publicados (`builtRefs().length`: hoy 3: Fogón, Cimiento, Nodo); **no** se publican filas de ejemplos «planeados» ni se finge que existen (MN-7). «Quiero una así» abre WhatsApp con `refWhatsApp()` (el mensaje del ejemplo ya escrito).

### 8.7 Proceso (`#proceso` / `#process`)

| ES | EN |
|---|---|
| Hablamos por WhatsApp | We talk on WhatsApp |
| Propuesta por escrito (con la insignia «24–48 h» solo si `proposalHours`) | Written proposal (badge «24–48 h» only if `proposalHours`) |
| Construimos con avances | We build, with progress updates |
| Entregamos y acompañamos | We deliver and stay by your side |

### 8.8 Contacto (`#contacto` / `#contact`)

| | ES | EN |
|---|---|---|
| `h2` | Hablemos | Let's talk |
| Botón primario | Escríbenos por WhatsApp | Message us on WhatsApp |
| Correo | hola@gaya.com.do · botón **Copiar** → estado **Copiado** (`role="status"`) | hola@gaya.com.do · **Copy** → **Copied** |
| Teléfono | +1 849-925-4426 (`tel:`) | +1 849-925-4426 |
| Redes | Instagram · TikTok · YouTube · X · Facebook (iconos con `aria-label`, las de `brand.json`) | same |
| Firma | Giancarlo González · Director | Giancarlo González · Director |
| Pie | Santo Domingo, República Dominicana · 21:40 | Santo Domingo, Dominican Republic · 21:40 |

Titular **«Hablemos»**: neutro, no evoca un mapa ni una ficha local (MN-8); la palabra `TÚ` hace el resto. **Sin** formulario, captcha, banner de cookies (no hay nada que consentir) ni `████` decorativo. **Copiar**: `navigator.clipboard.writeText` con **respaldo `document.execCommand('copy')`** porque el HTTPS del dominio **no está emitido hoy** (§2.3); el estado «Copiado» es una insignia de estado, no una instrucción (R1). Nombre de marca visible: **Gaya Digital** (decisión del 29-sep); si el dueño elige «Gaya Group» (§14.2 #2), se cambia `brand.json › name` y el `alternateName` del JSON-LD.

### 8.9 Datos locales: procedencia y caducidad

Un dato por servicio, **sin tema fiscal**, en `src/data/facts.ts` con `src`, `verified`, `expires` y `grade` (R04 §5.2, recortado). La placa muestra el texto y **«Fuente: {nombre}»** como enlace; **no** muestra «Verificado…» (MN-4); la fecha vive en los datos.

| ID | Dato (ES) | Fuente | Grado | Verificado | Caduca |
|---|---|---|:-:|---|---|
| F13 | Si un dominio .do vence, queda suspendido 30 días y 15 más en rescate antes de borrarse. | NIC.DO, política de delegación · https://www.nic.do/en/policies/domain-names-delegation-policies-for-cctld-do/ | A | 2026-09-30 | 2027-03-29 |
| F19 | WhatsApp exige ofrecer siempre un camino para hablar con una persona. | WhatsApp Business, política de mensajería · https://whatsappbusiness.com/es-la/policy/ | A | 2026-09-30 | 2027-03-29 |
| F15 | Si tu cliente te escribe desde un anuncio o botón a WhatsApp, Meta da 72 h de mensajes sin cargo. | Meta for Developers, precios de WhatsApp · https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing | A | 2026-09-30 | 2026-12-29 |
| F30 | Regla de respaldo 3-2-1: tres copias, en dos medios, una fuera del sitio. | CISA, respaldo de datos · https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data | A | 2026-09-30 | 2027-03-29 |

**Se retira solo.** `getFacts(now)` filtra por `expires`: pasada la fecha, el dato **desaparece del HTML** sin romper el build ni el despliegue (MN-4, II-7: el lint de frescura es **aviso** programado, nunca bloqueo). Las fechas de re-verificación de cada dato tienen **dueño**: Giancarlo (revisión cada 90 días, recordatorio en `CONTRACT.md`). Grados **C** y **X** no se publican nunca. **Quedan fuera** F01/F02 (e-CF), F06, F16 (cobro por mensaje de servicio), F18, F20, F27, F28, F29 y F31 del informe R04.

### 8.10 Mensajes de WhatsApp y `brand.json`

```json
"whatsappMessage": {
  "generic":   { "es": "Hola Gaya Digital, quiero información.",                     "en": "Hi Gaya Digital, I would like some information." },
  "service":   { "es": "Hola Gaya Digital, me interesa «{service}». Quiero una propuesta.", "en": "Hi Gaya Digital, I'm interested in «{service}». I'd like a proposal." },
  "reference": { "es": "…(ya existe)…", "en": "…(ya existe)…" },
  "references":{ "es": "…(ya existe)…", "en": "…(ya existe)…" }
},
"confirmed": { "proposalHours": false, "pricingModel": false, "accessOwned": false, "store": false, "nativeApps": false, "cms": false,
               "whatsappApi": false, "aiAgent": false, "ads": false, "video": false, "googleProfile": false,
               "remoteSupport": false, "managedBackups": false, "inventory": false }
```
`waService(lang, serviceName, ref?)` (R04 §5.4) construye `https://wa.me/18499254426?text=…`. **Medición sin analítica** (R04 D21): el nombre del servicio llega escrito en el primer mensaje y el dueño lo etiqueta en WhatsApp Business (`web`, `automatización`, `marketing`, `it`, `referencia`); revisión a los 20 chats etiquetados o a los 60 días.

### 8.11 Microcopy de interfaz

| Elemento | ES | EN |
|---|---|---|
| Menú | Nosotros · Servicios · Ejemplos · Proceso · Contacto | About · Services · Samples · Process · Contact |
| Botón de menú (móvil) | (icono, `aria-label` «Menú») | (icon, `aria-label` «Menu») |
| Cerrar | Cerrar | Close |
| Saltar | Ir al contenido | Skip to content |
| Idioma | `EN` (`aria-label` «English») | `ES` (`aria-label` «Español») |
| WhatsApp (icono) | `aria-label` «Escríbenos por WhatsApp» | «Message us on WhatsApp» |
| Fila del Índice | Ver detalle · WhatsApp | See details · WhatsApp |
| Plegable (móvil) | Más detalles | More details |
| Correo | Copiar · Copiado | Copy · Copied |
| Sello | Datos ficticios | Fictional data |
| Fuente del dato | Fuente: *nombre* | Source: *name* |

### 8.12 Meta, JSON-LD y SEO

Un `<title>` y una descripción por idioma (ya existen). **JSON-LD** `Organization` + `Service` ×4 (R04 §5.5): `name`, `alternateName: "Gaya Group"`, `url`, `email`, `telephone`, `sameAs` (las redes de `brand.json`), `knowsLanguage: ["es","en"]`, `areaServed` (`DO` y `Worldwide`), `founder` (Giancarlo González, **visible en la placa** y en el cierre: Google pide marcar solo lo visible); **sin `LocalBusiness`** (exige `address`), **sin ratings ni reseñas**; nunca se menciona cómo se hizo el sitio. `h1` único; `h2` por sección; `h3` por servicio; todos con `id` (candidatos a «Ir a…»). **Palabras clave locales** en los `h3` y en los textos de la placa («… para tu negocio en Santo Domingo» solo donde sea verdad y no suene a relleno): por ejemplo la descripción de la página y el `Service.description`, no los titulares (CN-6). `og:image`: la portada a `STILL_T` (§6.9), una por idioma.

### 8.13 Lo que la página no dice (y el lint impide)

Cifras o trayectoria propias (`/\d+\s?(\+|años|years|clientes|clients|proyectos|projects)/i`), superlativos («#1», «líder», «el mejor»), plurales sin sustento («expertos», «especialistas», «nuestro equipo»), promesas («garantizamos», «duplica», «ROI», «100 %»), autoría de IA («hecho con IA», «built with AI»), texto instructivo («haz clic», «desliza», «cómo funciona», «paso a paso»), y cualquier carácter prohibido en `data-art`. Las mismas reglas de R04 §5.3 con la lista ampliada; se ejecutan antes de cada `astro build`.

---

## 9. Plan bilingüe

| Tema | Decisión |
|---|---|
| **Páginas** | `/` (ES) y `/en/` (EN), generadas por los **mismos componentes** con `lang`; rutas y `hreflang` siguen saliendo de `routes.ts` (con `x-default` = ES) |
| **Ids de sección** | Localizados (§4.1). `Nav.astro` deja de apuntar a `#servicios` desde `/en/` |
| **Palabras** | Un conjunto por idioma: ES `GAYA · HOLA · WEB · LISTO · ECO · ON · VER · TÚ`; EN `GAYA · HELLO · WEB · READY · ECHO · ON · SEE · YOU`. Datos separados por idioma y por cartel (`words.gen.<lang>.<id>.ts`), **cada página carga solo los suyos** (≈ 5 KB gz en total por idioma [M]) |
| **Anchos distintos** | `HELLO` (122 cols L) y `READY` (120) son más anchas que `HOLA`/`LISTO` en filas: la variante se elige **por columnas** (§5.3), no por idioma; las pilas EN (`HEL/LO`, `REA/DY`, `EC/HO`, `SE/E`, `YO/U`) están medidas (Anexo A.1) |
| **Chiste HOLA/ola** | Solo existe en español; en inglés `HELLO` = H sólida + «ELLO» con olas: el cartel funciona igual (cartel.md §6.2) |
| **Copia** | Un único módulo por idioma en `services.ts` con **paridad** (mismo número de líneas, mismas banderas); el lint lo comprueba |
| **Datos locales** | Mismo hecho, texto por idioma; ninguno es fiscal, así que **no hay filtrado por idioma** (IN-4) |
| **Formato** | Hora con `Intl` (`es-DO` / `en-US`); teléfono `+1 849-925-4426` en ambos; sin fechas en el texto visible |
| **Conmutador** | Enlace a la misma ruta del otro idioma; **P2**: conserva el ancla de la sección actual |
| **Revisión del inglés** | Lo escribe y aprueba el dueño (o una persona de confianza); los textos EN de §8 son **propuestas** [C] excepto los heredados de R04 |
| **SEO EN** | `title`, `description`, `og:image` (`og-en.jpg`), JSON-LD con `description` y `jobTitle` en inglés |

---

## 10. Accesibilidad (WCAG 2.2 AA) y SEO

El arte es **decoración** (R8); lo que se lee es **semántica real**. La matriz dice cómo se cumple cada criterio y **qué prueba lo demuestra** (§13).

| Criterio | Cómo se cumple | Prueba |
|---|---|---|
| **1.1.1 / F72** Contenido no textual | Lienzo y arte en DOM: `aria-hidden="true"`, `translate="no"`, sin alternativa (decoración pura, R03 §1.8). Ningún arte porta información que no esté en texto | T4 |
| **1.3.1** Info y relaciones | Un `h1`; `h2` por sección; `h3` por servicio; `ul`/`ol`/`dl` reales; `nav` con `aria-label`; `main`; los marcadores decorativos de lista son `::before` con `content: "…" / ""` | T4 |
| **1.4.3 / 1.4.11** Contraste | Texto corto bajo **pozo** (≤ T6/T4); texto largo sobre **placa opaca** (`--ink` sobre T1 = 16,9:1); foco `outline: 3px --accent-text`; marco de placa T7 ≥ 3:1 | T5, T7 |
| **1.4.4 / 1.4.10 / 1.4.12** Zoom, reflow, espaciado | A 200 % y 400 % el lienzo **re-mide** y conserva ≥ 52 columnas o **se oculta** (queda la página de texto); el texto reflowa; las placas no tienen altura fija; el arte decorativo no recorta texto con el espaciado aplicado | T13 |
| **2.1.1 / 2.1.2** Teclado | Todo es enlace o botón nativo; el menú móvil es `popover`; sin trampas; `Esc` cierra el menú | T14 |
| **2.2.2** Pausar, detener, ocultar | Nada se mueve solo > 2,6 s; ninguna animación > 2,4 s salvo la ignición (2,6 s); todo se duerme a los 1,6 s; **sin botón de pausa necesario** | T9 |
| **2.3.1** Tres destellos | Cambios de glifo independientes por celda; sin oscilación global > 2 Hz; suavizado de tono (τ ≈ 80 ms); banda de espuma < 341×256 px | T21 (PEAT en M1) |
| **2.3.3** Animación por interacción | `prefers-reduced-motion: reduce` ⇒ modo `still` (corte seco, sin marea, calor, anillos ni llegada); se escucha el evento `change` | T10 |
| **2.4.1** Bloques | Enlace «Ir al contenido» (`.skip`, ya existe) | T4 |
| **2.4.7 / 2.4.11** Foco visible y **no oculto** | `:focus-visible` inmediato; `scroll-padding-top/bottom` **calculados de las alturas reales** de la píldora y de la barra inferior (variables CSS medidas con `ResizeObserver`), para que el cromo fijo no tape el foco | T14 |
| **2.5.3** Label in Name | El nombre accesible de cada control **contiene** su texto visible; los botones solo-icono llevan `aria-label` y **no** tienen etiqueta visible distinta; las palabras del arte no son etiquetas | T4 |
| **2.5.8** Tamaño del objetivo | ≥ 24×24 CSS px en todo; ≥ 44 px en los botones primarios y en la barra móvil | T14 |
| **3.1.1 / 3.1.2** Idioma | `<html lang>` por página; textos en otro idioma (nombres propios) no requieren cambio | T4 |
| **4.1.2 / 4.1.3** Nombre, rol, valor; mensajes de estado | `role="status"` **solo** en «Copiado»; **sin regiones vivas** ni `<output>` en ninguna otra parte (II-5); el reloj de Santo Domingo no se anuncia (es texto estático actualizado una vez) | T4 |
| **`forced-colors`** | Lienzo oculto; arte DOM en `CanvasText`; bordes reales de 1 px en botones y placas | T11 |
| **`prefers-contrast: more`** | Topes T4/T2; arte en `--ink`; sombras desactivadas | T11 |
| **Impresión** | Lienzo oculto; fondo blanco; arte DOM en negro a 7 pt; placas sin sombra; URLs visibles en enlaces externos | T11 |
| **Lector de pantalla** | Se oyen `h1`, lead, enlaces, luego cada `h2`/`h3` con su ficha; el arte no se anuncia. **Comprobar con NVDA y TalkBack** que el reloj y «Copiado» no se anuncian de más | manual |

**SEO** (R06 §4.12 + §8.12): una URL por idioma; `h2`/`h3` con `id` y enlaces internos; `data-nosnippet` en el póster SSR (en el HTML inicial); **texto oculto solo `sr-only` con el mismo contenido visible**; JSON-LD sin `LocalBusiness`; `og:image` de la portada; sitemap ya generado (`sitemap.xml.ts`); `hreflang` recíproco. **Fase 2**: cuatro páginas de servicio que reutilicen el motor.

---

## 11. Presupuestos y degradación

### 11.1 Presupuestos (CI-1: con los números medidos de R05 y de esta pasada)

| Recurso | Presupuesto | Estimación | Notas |
|---|---:|---|---|
| **HTML** (gzip) | ≤ 34 KB | ≈ 30 KB: contenido ≈ 14 · póster SSR (3 variantes) ≈ 5,5 · arte DOM (reglas, palabras mini, hilo, emblemas) ≈ 6 · marcado ≈ 4 | GitHub Pages sirve **gzip**, no brotli (§2.3) |
| **CSS** (gzip) | ≤ 10 KB | ≈ 8 KB | sin `@import` externos |
| **Fuentes** | ≤ 72 KB | Bricolage `latin` 41,3 + Geist Mono `latin` 23,1 + `symbols2` 5,8 = **70,2 KB** | hoy se precargan 68,6 KB solo de Bricolage |
| **JS de primera carga del arte** | ≤ **18,5 KB gz** | motor (kit, grid, atlas, render-gl, tide, wells, tones) ≈ 12 · escena `cover` + sus palabras ≈ 4,5 · arranque, menú, scroll-spy ≈ 2 | R05 midió el núcleo en 7,8 KB + ruido azul 4,4 KB (32×32: 1,4 KB) + wells/tide/heat ≈ 2,5 KB |
| **JS diferido** | ≤ 21 KB gz | 7 escenas ≈ 2,2 KB c/u (R05: 1,7–2,7) ≈ 15 · palabras restantes ≈ 4 · render-2d fijo ≈ 1,5 · emblemas ≈ 0,7 | `import()` al faltar ≤ 1,5 pantallas |
| **JS total del arte** | ≤ **40 KB gz** | | techo del sitio: 60 KB (`budgets.mjs › homeJsGz`) |
| **Transferencia de la primera carga** (HTML + CSS + JS + fuentes) | ≤ **140 KB** | ≈ 126 KB | medida con `npm run budgets` ampliado |
| Imágenes en la home | **0** | | desaparecen `hero/*.webp`, `noise.png` y las miniaturas de `HeroCards` |
| Terceros | **0** | | CSP intacta |
| **LCP** | < 2,5 s (objetivo 2,0) | `h1` real + Bricolage | el póster **no** se pinta con JS (§6.9) |
| **CLS** | 0 | | cajas reservadas; respaldos métricos al 100 % |
| **TBT** | < 200 ms | | motor tras `load` + inactividad; ninguna tarea > 50 ms |
| **Lighthouse móvil** | ≥ 90 (mediana de 3) | | ningún referente ASCII lo cumple (R01 §3): ya es ganar |
| **Memoria** | atlas ≈ 320 KB (DPR 2) + celdas ≈ 19–36 KB + tesela 4 KB + pozos | | un solo contexto |

**Puertas en `scripts/budgets.mjs`** (WP11): nuevas claves `asciiFirstJsGz` (18,5 KB), `asciiJsGz` (40 KB), `htmlGz` (34 KB), `cssGz` (10 KB), `fontsBytes` (72 KB), `firstLoadBytes` (140 KB); `homeJsGz` se conserva en 60 KB.

### 11.2 Matriz de degradación (MI-4, CI-7, CN-7)

| Condición | Lo que ve el visitante |
|---|---|
| **Normal** (WebGL2, sin preferencias) | Ignición, marea, llegadas, calor |
| `prefers-reduced-motion` o `saveData` | **Fotogramas fijos** `still` de cada cartel, **corte seco** al cambiar; sin ignición, marea, calor ni anillos; el hilo del proceso, encendido. Se escucha `change` |
| **Sin WebGL2** o solo raster por software (`failIfMajorPerformanceCaveat`) | **Modo `still` con Canvas 2D** (un dibujo por cambio de cartel, 2 cuadros); nunca un bucle lento |
| Contexto perdido dos veces / tier agotado | Se oculta el lienzo; queda el fondo T0 y **toda la página de texto**; el póster SSR de la portada se muestra (`data-field="ssr"`) |
| **Sin JS** | Póster SSR de la portada + texto + placas + reglas + hilo + emblemas; **sin** carteles WEB…TÚ |
| **WebView sin WebGL ni `animation-timeline`** (navegadores integrados) | Modo `still` (2D) o texto solo; el hilo sale completo y encendido |
| `forced-colors: active` | Lienzo y póster ocultos; arte DOM en `CanvasText`; bordes reales |
| Impresión | Fondo blanco, arte negro a 7 pt, sin lienzo |
| Pestaña oculta o menú abierto | Bucle en pausa |
| Zoom 200 % / 400 % | Reflow; el lienzo re-mide; con < 52 columnas útiles **se oculta** y queda el texto |
| **Firefox estable** (≈ 5,7 % en RD) | Sin `animation-timeline` (todo visible y encendido); sin `@view-transition` entre documentos; el resto igual |
| Ahorro de batería / `low` | Tier `low`/`min` (celdas más grandes, `dpr` ≤ 1,5) |

**Pruebas de las tres rutas de Lighthouse** (puerta de M1): WebGL2 · `?nogl` · sin JS; las tres ≥ 90.

### 11.3 Limitaciones del hosting que se asumen (CI-10)

**GitHub Pages**: CSP **solo por `<meta>`** (no hay cabeceras propias); caché fija `max-age=600`; **gzip** (no brotli); `https://gaya.com.do` **sin certificado emitido hoy** (§2.3: `http://` responde). Consecuencias: presupuestos en gzip; `navigator.clipboard` con respaldo; cuando el HTTPS esté emitido se activa «Enforce HTTPS» y se re-ejecuta el Lighthouse. **El despliegue sigue siendo manual** (`workflow_dispatch`) hasta que el dueño apruebe publicar (`deploy.yml`).

---

## 12. Plan de construcción

### 12.1 Principios (MN-6, MI-7, CI-5, II-3)

1. **Cada hito deja la web publicable.** El orden no es «motor primero»: es **página completa y hermosa en estático primero** (M0), motor después, escenas en paralelo.
2. **Contratos antes que código** (WP0): `types.ts` y las firmas de cada módulo se congelan el día 1; cambiarlos exige acuerdo de **todos** los paquetes afectados.
3. **Propiedad exclusiva de archivos.** Cada paquete crea sus archivos y **no toca** los de otro; las modificaciones a archivos compartidos (`package.json`, `tokens.css`, `Base.astro`) las hace **solo su propietario** (tabla de §12.6).
4. **Toda escena nace como `still`** (R19) y se aprueba **en estático primero**, a 320, 375, 414, 768, 1024 y 1440 px, antes de mirar el movimiento.
5. **Sin dependencias nuevas de ejecución.** `devDependencies` nuevas: ninguna obligatoria (el rasterizador de palabras usa el Playwright que ya está; se **declara** lo que se use de forma transitiva: `@capsizecss/unpack` solo para verificar el respaldo métrico). Se **quitan** `gsap` y `lenis` (CI-10, R06 D10).
6. **`dispose()` obligatorio** en motor y escenas (HMR y pruebas); nada de scripts en línea ni `Worker` de `blob:` (CSP).

### 12.2 Paquetes de trabajo

Estimaciones en **días-persona**, una persona por paquete salvo indicación [C]; incluyen pruebas.

| WP | Nombre | Crea (archivos exclusivos) | Consume | Entrega / criterio | Días |
|---|---|---|---|---|---:|
| **WP0** | Contratos y andamiaje | `src/ascii/types.ts`, `src/ascii/glyphs.ts` (lista única de glifos), **stubs** con firma y `throw` de todos los módulos de §6.14 | §6.3 | Todos los demás paquetes compilan contra los stubs; `npm run build` verde | 1 |
| **WP1** | Base visual | `src/styles/{fonts,tones,ascii}.css`, `scripts/tones.mjs`, `src/ascii/tones.gen.ts`, `CREDITS.md` (Geist Mono) ; **modifica**: `astro.config.mjs` (fuera Astro Fonts), `src/layouts/Base.astro` (precargas manuales, sin `<Font>`), `src/styles/{tokens,base}.css`, `src/styles/tokens.json`, `package.json` (quita `gsap`/`lenis`, añade scripts) | §5.1–5.2, 5.4, 5.8–5.9 | `dist/` **sin** `size-adjust: 85.986%`; fuentes = 70,2 KB; hex de §5.4 regenerables (`npm run tones`); `npm run contrast` con los pares nuevos; `.btn` y `.plate` de §5.9; CLS 0 | 4 |
| **WP2** | Contenido e i18n | `src/data/{services,facts,emblems}.ts`, `src/lib/{wa,jsonld}.ts`, `scripts/lint-content.mjs` ; **modifica**: `brand.json` (§8.10), `src/data/site.ts` (`READY.*` a `true`), `src/i18n/copy.ts` | §8, §9 | Copia ES/EN completa de §8 con **paridad**; banderas `confirmed`; `getFacts(now)` filtra por `expires`; lint verde con el caso rojo probado (R04 §5.3); 14 emblemas (borrador) | 4 |
| **WP3** | Palabras | `scripts/{words,words-pack}.mjs`, `src/ascii/data/words/**/*.txt`, `src/ascii/words.ts`, `src/ascii/data/words.gen.<lang>.<id>.ts` (generados) | §5.3, Anexo C.1 | Reproduce la **Tabla A.1**; RLE con ida y vuelta comprobada; ≤ 5,3 KB gz por idioma; acentos (TÚ) correctos; `npm run ascii:lint` sin glifos prohibidos | 3 |
| **WP4** | Núcleo ASCII puro | `src/ascii/{noise,grid,kit,wells,tide,ssr}.ts`, `src/ascii/scenes/common.ts`, `tests/ascii/*.test.mjs` | §6.3–6.4, 6.8 | Todo corre **en Node** sin DOM; `paint` determinista (hash estable); `renderPosterLayers` sin `bg`; micro-benchmark a 6 500 y 9 000 celdas publicado | 7 [2 personas] |
| **WP5** | Render y motor | `src/ascii/{atlas,render-gl,render-2d,engine}.ts`, `src/scripts/field-boot.ts`, `src/components/Field.astro` | §6.2, 6.5–6.6, 6.10–6.13 | `mountField()` con los estados de §6.2; detección de §6.10; tiers y sueño; `__field`; `dispose()`; **arranque < 600 ms tras `load`** en CPU ×4; Lighthouse 3 rutas ≥ 90 (con la escena `cover` de WP6) | 8 (incluye portar R05: «M-1» de MI-7, 5–8 d) |
| **WP6** | Escenas A | `src/ascii/scenes/{cover,hola,mist}.ts` (+ `still` dorados) | WP3, WP4 | `cover` (ignición) y `hola` **idénticas al prototipo en carácter** (aprobación del dueño); integración de la marea cover→hola con WP5 | 6 |
| **WP7** | Escenas B | `src/ascii/scenes/{web,listo}.ts` | WP3, WP4 | `still` + llegada + calor de cada una | 5 |
| **WP8** | Escenas C | `src/ascii/scenes/{eco,on}.ts` | WP3, WP4 | ídem; `on` **sin apagón** con `reduced-motion` | 5 |
| **WP9** | Escenas D | `src/ascii/scenes/{ver,tu}.ts`, `src/ascii/scenes/horizon.ts` | WP3, WP4, WP2 (emblemas) | `ver` + `tu`; **`horizon` es opcional y va último** (P1): sin visto bueno, `tu` sale sin silueta | 6 |
| **WP10** | Página Astro | `src/components/{Chrome,PosterSsr,PosterSection,Plate,ServiceIndex,ServiceArticle,Examples,Process,Contact,Facts,WordMini,Rule}.astro`, `src/pages/{index,en/index}.astro`, `src/ascii/dom-art.ts`, `src/scripts/{nav,copy-mail,details-mobile}.ts` ; **modifica**: `Nav.astro`, `Logo.astro` ; **retira** tras M1: `Hero.astro`, `HeroCards.astro`, `src/scripts/hero.ts`, `public/hero/*`, `public/noise.png` | WP1, WP2, WP3 (mini/proc), WP4 (`ssr.ts`) | Página ES y EN completas en **estático** (M0): secciones de §4.1, contenido de §8, placas, Índice, hilo, menú con `popover`, barra móvil; `scroll-padding` medido; axe verde | 9 [2 personas: 10a estructura y contenido · 10b cromo y arte DOM] |
| **WP11** | QA y puertas | `scripts/{ascii-parity,ascii-seams,ascii-contrast-px,ascii-perf,ascii-a11y,ascii-stills,ascii-lint,lighthouse-routes}.mjs` ; **modifica**: `scripts/{budgets,guard,og}.mjs` ; **retira**: `scripts/hero-*.mjs` | §11, §13 | Todas las pruebas de §13 automatizables corren en `npm run check:ascii`; presupuestos de §11.1 como puertas | 5 + 1 por hito |

**Total ≈ 63–70 días-persona** [C] (incluye portar el motor, el contenido bilingüe completo y la QA). Con 4–5 personas en paralelo: **≈ 5–6 semanas de calendario**. Es 2–3 veces lo que estimaban los conceptos (12–17 y 23–30 días; MI-7, CI-5): la diferencia es el motor portado, la página estática completa y la QA.

### 12.3 Orden y paralelismo

```text
WP0 ─┬─ WP1 (base visual) ───────────────┐
     ├─ WP2 (contenido) ─────────────────┤
     ├─ WP3 (palabras) ──────┬───────────┼─ WP10a/b (página estática) ──▶  M0  publicable
     └─ WP4 (núcleo) ────────┴─ WP6 (cover+hola+mist, still) ┘
                                   │
            WP4 ─ WP5 (motor) ─────┴──────────────────────────────────▶  M1  motor + portada + HOLA + marea
                                   │
                  WP7 (web, listo) ┼─▶ M2      WP8 (eco, on) ┼─▶ M3      WP9 (ver, tu, horizonte) ┼─▶ M4
                                   │
                                   └─ WP11 (QA, A07, in-app, reducido, print, forced) ─────────────▶  M5
```

| Hito | Contenido | Puerta (todas medibles, §13) | Publicable porque… |
|---|---|---|---|
| **M0** | WP1 + WP2 + WP3 (mini/proc) + WP10 + póster SSR de la portada (still de WP6) | Lighthouse ≥ 90 (estático, sin motor); axe; contraste; costuras; presupuestos; **prueba de los 5 segundos sobre la página estática** (§13, T15); copia ES/EN revisada | Todo el contenido y la portada con póster están; los carteles de WEB…TÚ no se ven sin motor, y **la página vende igual** (MN-11) |
| **M1** | WP4 final + WP5 + WP6 | **A07** (§6.12), iPhone, Instagram, TikTok, WhatsApp; PEAT sobre la marea; Lighthouse 3 rutas; `cover` y `hola` aprobadas en color por el dueño | Las escenas pendientes muestran `mist`; la página ya tiene la ignición y el momento firma |
| **M2** | WP7 | `still` y llegada de WEB y LISTO; A07 sin caída de tier | Cada cartel nuevo **se suma** sin cambiar el contenido |
| **M3** | WP8 | ECO y ON (con y sin movimiento) | ídem |
| **M4** | WP9 | VER y TÚ; horizonte si el dueño lo aprueba | ídem |
| **M5** | WP11 completo + pendientes | Matriz de §11.2 verde en Chrome, Safari y Firefox; `og:image`; banderas v2 que el dueño confirme; aprobación final | Cierre |

**Orden de recorte si falta tiempo** (de lo primero a lo último que se quita): horizonte de `tu` → calor de cada cartel → anillos de toque → `view()` del hilo → llegada de `ver`/`eco` (quedan en `still`) → marea (queda corte seco) → llegada de `web`/`listo`. **Nunca se recorta**: póster SSR, placas y pozos, estados de movimiento reducido, botones de WhatsApp, `still` de cada cartel.

### 12.4 Contratos de interfaz que todos respetan

```ts
// src/ascii/words.ts  (WP3)
export type WordId = 'GAYA'|'HOLA'|'WEB'|'LISTO'|'ECO'|'ON'|'VER'|'TU' /* ES */ | 'HELLO'|'READY'|'ECHO'|'SEE'|'YOU' /* EN */;
export function getWords(id: WordId, lang: Lang, cols: number, maxRows?: number): WordSet;   // elige L/M/S/XS (§5.3) y devuelve líneas (pila) con sus desplazamientos
export function wordMini(id: WordId, lang: Lang): Word;                                        // 6 filas (Índice, DOM)
export function wordProc(id: 'HOLA'|'LISTO', lang: Lang): Word;                                // 8 filas (Proceso, DOM)
export const pickVariant: (cols: number, wordCols: Record<Variant, number>) => Variant;        // cols ≥ palabra + 8

// src/ascii/kit.ts  (WP4) — las cuatro manos de escenas solo usan esto
export function bakeWaterTile(seed?: number): Uint8Array;
export function agua(tile: Uint8Array, c: number, r: number, t: number): number;               // 0..1
export function mist(g: Cells, spec: GridSpec, o: { cx: number; cy: number; rx: number; ry: number; gain: number; cap: number; wells?: Uint8Array | null }, t: number, tile: Uint8Array): void;
export function faceFn(w: Word, x0: number, y0: number): { cls: Uint8Array; dist: Int16Array };  // clasificación cara/borde y distancia al borde
export function halo(g: Cells, w: Word, x0: number, y0: number, radius?: number): void;
export function shadow(g: Cells, w: Word, x0: number, y0: number): void;
export function edt(w: Word, cols: number, rows: number): Float32Array;                         // distancia euclídea anisótropa 1:2
export const bn: (x: number, y: number) => number;                                               // ruido azul 32×32 + jitter, 0..1

// src/ascii/tide.ts  (WP4) — lo usa el motor (WP5), no las escenas
export function front(x: number, yb: number): number;
export function compose(out: Cells, outgoing: Cells, incoming: Cells, clsOut: Uint8Array, clsIn: Uint8Array, yb: number, o: { band: number; reach: number; t: number }): void;

// src/ascii/ssr.ts  (WP4)
export function renderPosterLayers(scene: Scene, spec: GridSpec, lang: Lang, words: WordSet[]): { dim: string; mid: string; hot: string; spark: string };

// src/ascii/engine.ts  (WP5)
export interface WellRect { x: number; y: number; w: number; h: number; kind: 'ink' | 'muted' }   // px de documento
export interface FieldOptions { canvas: HTMLCanvasElement; lang: Lang; posters: { id: SceneId; el: HTMLElement }[]; wells: () => WellRect[]; params: URLSearchParams }
export interface Field { readonly mode: 'live' | 'still' | 'off'; dispose(): void; poke(): void }
export function mountField(o: FieldOptions): Promise<Field | null>;
```

**Contrato del DOM** (WP10 lo produce, WP5 lo lee): `main [data-poster="<SceneId>"]` en orden de documento (una por cartel; `mist` para Índice y Proceso) · `[data-well="ink|muted"]` en los bloques de texto corto sobre arte · `span.art[data-art][aria-hidden][translate="no"]` para todo el arte DOM · `.plate` para toda lectura larga · `[data-cta]` en el botón primario de la portada · `html[data-field="live|still|off|ssr"]` lo pone el motor · `canvas.field` único, fijo, sin atributos de estilo (se asigna por CSSOM).

### 12.5 Reglas de colaboración

Una rama por paquete; `types.ts` solo se cambia con revisión de todos los propietarios; los **hashes dorados** de `still` (`tests/golden/*.json`) se actualizan **solo con la aprobación de arte del dueño** (la primera vez, con las capturas de §2.1 como referencia); ninguna escena puede usar `Math.random` ni el reloj (`performance.now`) dentro de `paint`; los comentarios de código explican el *porqué*; todo texto visible sale de `copy.ts`/`services.ts` (nada escrito en componentes).

### 12.6 Archivos que cambian (propietario único)

| Archivo | Cambio | WP |
|---|---|---|
| `astro.config.mjs` | quitar `fonts: [...]` de Astro Fonts; `assetsInlineLimit: 0` se conserva | 1 |
| `src/layouts/Base.astro` | quitar `<Font …>`; `<link rel="preload">` de Bricolage `latin` y Geist Mono `latin` + `symbols2` (`fetchpriority="low"`); `<Field />` solo en la home; JSON-LD de WP2 | 1 |
| `src/styles/tokens.css` | + `--t0…--t15` (importados de `tones.css`), `--fs-art/--cw/--ch`, `--font-body`; − `--glow-gloss/prism/flow`, `--hero-poster-*`; `--glow-0..3` se conservan | 1 |
| `src/styles/base.css` | `body` en `var(--font-body)`; `.btn`, `.plate`, `.art` de §5.9/§5.2; `@media (forced-colors)`, `@media print`, `@media (prefers-contrast: more)` | 1 |
| `src/styles/tokens.json` | pares nuevos de §5.8 | 1 |
| `package.json` | − `gsap`, − `lenis`; + scripts `tones`, `words`, `words:pack`, `ascii:lint`, `check:ascii`, `lint:content` | 1 |
| `brand.json`, `src/data/site.ts`, `src/i18n/copy.ts` | §8.10, `READY.*` a `true`, copia nueva | 2 |
| `src/components/Nav.astro` | píldora con 5 enlaces localizados, `popover` móvil, barra inferior, `aria-current` | 10 |
| `src/components/Logo.astro` | `▞ Gaya Digital` provisional (sigue siendo **un solo archivo**) | 10 |
| `Hero.astro`, `HeroCards.astro`, `src/scripts/hero.ts`, `public/hero/*`, `public/noise.png` | **retirar** tras M1 | 10 |
| `scripts/budgets.mjs`, `guard.mjs`, `og.mjs` | puertas de §11.1; `og` desde el motor real; `hero-*.mjs` se retiran | 11 |
| `DESIGN.md`, `PRODUCT.md` | actualizar a la nueva dirección (principio 1 «Luz + webs» → «Carteles»; «portada cinemática») | 10 |
| `CREDITS.md` | + Geist Mono (© 2024 The Geist Project Authors, OFL-1.1) | 1 |

### 12.7 Checklist de hecho por escena (la usan WP6–WP9)

1. `build()` y `paint()` puros; `still` ≡ `paint(p=1, t=STILL_T)`; hash dorado aprobado por el dueño.
2. Composición **móvil diseñada** (§5.3) verificada a 360×800 y 320×568.
3. `arrival.ms` dentro de §6.5; marea con el cartel anterior y el siguiente revisada a 1440 y 390.
4. Reacción (calor/anillo) **opcional**: sin ella el cartel está completo.
5. Reglas de tono (§5.4) y de glifos (§5.6): `npm run ascii:lint` sin hallazgos; presupuesto de tono medido.
6. Coste por cuadro medido a 6 500 y 9 000 celdas en Node y con CPU ×4; `dispose()` probado.
7. Sin texto ni cifras en la imagen; sin `Math.random`.

---

## 13. Pruebas de aceptación (medibles)

Se ejecutan con `npm run check:ascii` (WP11) salvo las marcadas *manual*. «**Puerta**» = bloquea el hito indicado. Umbral siempre **numérico**; donde no lo hay, no es una prueba de aceptación.

| # | Prueba | Método | Umbral | Puerta |
|---|---|---|---|---|
| **T1** | **Lighthouse móvil**, mediana de 3, `/` y `/en/`, **tres rutas**: WebGL2 · `?nogl` · sin JS | Lighthouse 13.5 (perfil móvil por defecto) sobre `astro preview` **y**, cuando el HTTPS esté emitido, sobre `https://gaya.com.do` | Rendimiento **≥ 90** · Accesibilidad **≥ 95** · Buenas prácticas **≥ 95** · SEO **≥ 95** · LCP **< 2,5 s** (objetivo 2,0) · CLS **0** · TBT **< 200 ms** | M0 (sin motor), M1 (3 rutas) |
| **T2** | **Presupuestos** | `npm run budgets` ampliado (§11.1) | HTML ≤ 34 KB gz · CSS ≤ 10 KB gz · fuentes ≤ 72 KB · JS primera carga del arte ≤ 18,5 KB gz · JS total del arte ≤ 40 KB gz · 1.ª carga ≤ 140 KB | todos |
| **T3** | **Red y consola** | Playwright: 0 peticiones a otro origen; 0 errores y 0 *warnings* de consola en `live`, `still`, `?nogl`, `reduced-motion`, `saveData`, ES y EN | **0** | todos |
| **T4** | **axe** (wcag2a, wcag2aa, wcag22aa) | `@axe-core/playwright`, escritorio, móvil y movimiento reducido | **0** violaciones | todos |
| **T5** | **Contraste por tokens y presupuesto de tono** | `npm run contrast` con los pares de §5.8; `ascii-stills` mide el área de tinta por tono sobre cada `still` | pares ≥ 7 / 6,5 / 6 / 16 / 6 / 3 · **T≥9 ≤ 12 %, T≥11 ≤ 4 %, T≥13 ≤ 1,5 %, T≥14 ≤ 0,5 %** · no vacías ≤ 60 % (portada) | M1 |
| **T6** | **Paridad del póster SSR** | `renderPosterLayers` (Node) vs cuantización a 4 tonos del fotograma del motor en `STILL_T`, por variante `wide/mid/stack` y por idioma | **100 %** de celdas con la misma capa y el mismo glifo | M0 |
| **T7** | **Contraste por píxeles bajo los pozos** (CI-3) | Playwright: se oculta el texto (`color: transparent`), se captura y se mide el fondo de cada rectángulo `[data-well]` en **12 posiciones de scroll** y en **una pasada a 2 400 px/s**; contraste con `--ink`/`--lead`/`--muted` | **≥ 4,5:1** en todas | M1 |
| **T8** | **Costuras** (R03 §2.9) | `ascii-seams`: `█` y `│` a DPR {1, 1,5, 2, 2,625, 3} × cuerpos {9, 10, 12, 14, 15, 16, 18, 20, 24} px | hueco **≤ 40/255** | M0 |
| **T9** | **Fling y marea** (CA-2, MA-4) | Playwright: scroll de 2 400 px/s por toda la página; y un scroll lento (300 px/s) por la misma | la marea dura **1,4 s ± 0,1** en ambos; estado `arrived` del último cartel en **≤ 1,6 s** tras parar; 0 errores; nunca se queda el frente detenido | M1 |
| **T10** | **Movimiento reducido y ahorro de datos** | `emulateMedia({ reducedMotion: 'reduce' })` y `saveData` | **0** `requestAnimationFrame` vivos tras el primer `still`; `__field.sleeping === true`; `still` de cada cartel = hash dorado | M1 |
| **T11** | **`forced-colors`, `prefers-contrast: more`, impresión** | Playwright con `forcedColors: 'active'`, `contrast: 'more'`, `emulateMedia({ media: 'print' })` | lienzo oculto; texto íntegro; 0 violaciones axe; captura sin arte negro sobre negro | M5 |
| **T12** | **Rendimiento del motor** (§6.12) | Chrome con CPU ×4 y ×6 **y en el A07 físico**; `__field` durante portada en reposo 10 s, ignición, scroll continuo 10 s, cada marea y un fling | `costP50 ≤ 6 ms` · `costP95 ≤ 12 ms` · `tier` no baja · ninguna tarea > **50 ms** tras el horneado · 1.er fotograma **< 600 ms** tras `load` · `sleeping === true` a los 2 s | **M1 (bloqueante)** |
| **T13** | **Zoom y espaciado de texto** | Zoom 200 % y 400 %; `text-spacing` de WCAG 1.4.12 inyectado | sin scroll horizontal, sin texto recortado; ≥ 52 columnas o lienzo oculto | M5 |
| **T14** | **Teclado, foco y objetivos** | Tab completo con la barra inferior visible; en cada foco, `elementFromPoint` en su centro; medidas de los objetivos | el foco **no queda oculto** (2.4.11); objetivos ≥ **24×24** (≥ 44 en primarios móviles); `outline` ≥ **3:1** | M0 |
| **T15** | **Prueba de los 5 segundos** (manual) | **5 dueños de negocio dominicanos no técnicos**, en el navegador de Instagram de un Android modesto: 5 s de la portada; después, **3 preguntas**: «¿qué hace Gaya?», «¿dónde escribirías?», «¿qué servicio crees que es *LISTO*?» | **≥ 4/5** nombran ≥ 3 de los 4 servicios; **5/5** señalan WhatsApp; se anota cuántos asocian la palabra sola con su servicio (informativo) | M0 (página estática) y M2 |
| **T16** | **Navegadores y WebViews** (manual) | iPhone (Safari), Safari macOS, Firefox, **Instagram** (iOS y Android), **TikTok**, **WhatsApp**, Facebook | página utilizable; si falta WebGL2 → modo `still`; se documenta cada resultado | **M1** |
| **T17** | **Lint de contenido** | `scripts/lint-content.mjs` con el caso verde y un caso rojo (cifras, superlativos, IA, instructivo) | verde / el rojo falla con `exit 1`; **4–7** «Incluye»; paridad ES/EN; bandera sin su línea o línea v2 sin bandera = error | todos |
| **T18** | **Revisión visual del dueño** (manual) | `?still&poster=<id>` a 320, 375, 414, 768, 1024 y 1440 px; cada escena **en estático primero** | aprobación escrita por escena | M1–M4 |
| **T19** | **Regresión visual** | hash de `toText() + toTones()` de cada escena × idioma × variante a `STILL_T` | sin cambios no aprobados | todos |
| **T20** | **Datos estructurados y metadatos** | validador de schema.org; `hreflang` recíproco; `canonical`; `og:image` existe y no menciona la herramienta | sin errores | M5 |
| **T21** | **Destellos** (2.3.1) | PEAT (Trace Center) sobre la ignición, la marea y ON; y regla de diseño comprobada en código | sin fallos; **ninguna oscilación global > 2 Hz** | M1 |
| **T22** | **Móvil de referencia 360×800** | A07 real o emulación 360×800 @ dpr 2 | `h1` + lead + botón primario **visibles sin scroll**; la palabra en pila mide ≥ 280 px de alto; barra inferior ≥ 44 px | M0 |

**Mapa de pruebas de accesibilidad** (§10): semántica/idioma/nombres → T4; contraste → T5, T7; zoom/reflow → T13; teclado, foco y objetivos → T14; 2.2.2 → T9; 2.3.1 → T21; 2.3.3 → T10; `forced-colors`/contraste/impresión → T11. **Manual**: NVDA (Windows) y TalkBack (Android) sobre la portada, el Índice y una ficha.

---

## 14. Decisiones abiertas y riesgos

### 14.1 Las dos puertas que un documento no cierra

1. **Samsung A07 físico** (T12, bloqueante de M1). Hasta tenerlo, se usa CPU ×4/×6 como proxy y **cada informe de hito declara la puerta abierta**. **Pedir al dueño (o conseguir) un A07 o equivalente** (Helio G99).
2. **Visto bueno del dueño en color** (T18): las capturas de §2.1 son la referencia; las de producción las repiten con el código real. Sin ese visto bueno **no se construyen WP7–WP9**.

### 14.2 Decisiones que solo el dueño puede tomar (cada una con su valor por defecto)

| # | Decisión | Por defecto | Si dice que no |
|--:|---|---|---|
| 1 | **Aprobar el lenguaje visual** (rótulo luminoso de píxeles, Cobalto) mirando las capturas | Aprobado | se ajusta tamaño de celda / tono; ver riesgo K2 |
| 2 | **Nombre**: Gaya Digital o Gaya Group | **Gaya Digital** | cambia `brand.json › name`, pie, mensajes y `alternateName` |
| 3 | **Cierre `TÚ` con horizonte de Santo Domingo** (puente, torres, campanario) | Sí, **sin Faro ni Obelisco** | `TÚ` + línea de agua + reflejo, sin silueta |
| 4 | **«Referencias» → «Ejemplos»** en toda la copia visible | Sí (URL intactas) | se conserva «Referencias» en nav, h2 y botones |
| 5 | **Capacidades que confirma** (banderas de §8.1) | **Ninguna** → versión «piloto» | se activan una a una |
| 6 | **Plazo «24–48 horas»** de la propuesta | No se publica | bandera `proposalHours` |
| 7 | **Tipografía del cuerpo**: Bricolage (por defecto) o Geist Mono | Bricolage | `--font-body` a mono en un sitio |
| 8 | **CTA único**: «Escríbenos por WhatsApp» / «Escribir por WhatsApp» | «Escríbenos…» | una cadena |
| 9 | **Foto de Giancarlo** para un retrato de cuadrantes en la placa | Sin foto | solo nombre y rol |
| 10 | **Emblemas de los 14 rubros**: aprobar los borradores o encargarlos a un diseñador | Borradores | se sustituyen archivos de `emblems.ts` |
| 11 | **Hora de Santo Domingo** en la placa y el pie | Sí | se quita una línea |
| 12 | **Datos locales** (los 4 de §8.9) y **quién los revisa cada 90 días** | Sí; **Giancarlo** | se quitan filas de `facts.ts` |

Además, sin bloquear: entrega del **logo** definitivo (se sustituye `Logo.astro`), revisión del **inglés**, y las fotos o referencias de letreros que el dueño quiera para calibrar el rótulo (cartel.md §12.2).

### 14.3 Riesgos (K1–K14; las reglas R1–R20 son las de §3)

| # | Riesgo | Mitigación |
|---|---|---|
| **K1** | A07 sin medir; la marea a 30 fps se ve a saltos | Puerta T12; escalera de §6.12 (celdas → dpr → 24 fps → sin espuma → 2 octavas); último recurso: corte seco con fundido de 240 ms |
| **K2** | El dueño percibe el look como **retro / píxel** | Se le enseñan las capturas **antes** de construir (decisión 1); palancas: celda más pequeña (más columnas), **anti-aliasing por tono en el borde** (P2: 2 bits de cobertura por celda, +≈ 40 % de datos), más bruma y menos bisel |
| **K3** | `LISTO`, `ECO`, `ON` no se entienden sin explicación | Cada cartel lleva su `h3` visible y el Índice los nombra; prueba T15; cambiar una palabra es cambiar datos, no el motor |
| **K4** | Fidelidad y sensibilidad del horizonte | Decisión 3; silueta sin nombres ni texto; fallback sin silueta; última prioridad |
| **K5** | Navegadores integrados sin WebGL2 o con WebGL lento | Detección con `failIfMajorPerformanceCaveat`; modo `still` 2D; prueba T16 **antes** de M2 |
| **K6** | Destellos o brillo excesivo en la marea | Suavizado de tono, cambios independientes por celda, PEAT (T21) |
| **K7** | Página larga (15 pantallas; 22 en móvil) | Menú con los 4 servicios, Índice, placas plegables; fase 2: páginas por servicio |
| **K8** | Inglés sin revisar | Decisión del dueño; paridad en el lint |
| **K9** | **HTTPS sin emitir**: Lighthouse «Buenas prácticas» penaliza `http://` y `navigator.clipboard` no existe | Las puertas de Lighthouse corren en `astro preview` (localhost) y se **repiten** sobre `https://gaya.com.do` cuando esté emitido; respaldo `execCommand` |
| **K10** | Plan de 63–70 días | Orden de recorte de §12.3; cada hito publicable |
| **K11** | Emblemas en borrador | Decisión 10; solo se muestran los de ejemplos **construidos** |
| **K12** | Las palabras se generan con Bricolage 800 y el dueño quiere otra voz | Son **datos** (`.txt`): se regeneran con otra fuente OFL o se retocan a mano |
| **K13** | Copia v1 «demasiado prudente» | Las banderas (§8.1) la amplían sin tocar código |
| **K14** | Sensibilidad histórica (Colón) | Fuera de la v1: Faro, Obelisco, Alcázar, Catedral nombrada |

---

## 15. Trazabilidad: cada «debe arreglarse» de los jueces y dónde se resuelve

Código = concepto (**M**undo · **I**nstrumento · **C**artel) + juez (**A**rte · **I**ngeniería · **N**egocio) + número en el orden del tablero. **«Retirado»** significa que el elemento criticado ya no existe en la dirección final; se dice por qué. 80 puntos, ninguno sin resolución.

### Mundo · Arte

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| MA-1 | Prototipo real en color (3 capturas + vídeo 14°→90°→circuito a 390 y 1440); decidir cámara A/B con eso | Se construyó y **se miró** el prototipo en color (1440×900, 360×800, 6 escenas, 3 fotogramas de marea). La cámara A/B y el despliegue **se retiran** con el concepto | 1.2, 2.1 |
| MA-2 | Mundo que sea Santo Domingo y no una parrilla; siluetas con perfil | Retirado el plano. Santo Domingo vive **solo en el horizonte de cierre**: torres de alturas distintas, campanario, Puente Juan Bosch; fidelidad bajo visto bueno y con fallback | 7.9, 14.2 #3 |
| MA-3 | Encuadre móvil; Faro y cruz visibles en 390 px | Sin Faro. Cada cartel tiene **composición móvil diseñada** (pilas), verificada a 360×800 | 5.3, 2.1 |
| MA-4 | Mínimo garantizado del despliegue; amortiguación ≥ 600 ms; fotogramas intermedios con lectura propia | Sin despliegue continuo: la **marea corre por tiempo** (1,4 s), termina sola, nunca queda a medias, y no se deja reposar un fotograma «sucio» | 6.4 |
| MA-5 | Clímax sin hover; estático que conserve «falta tu lugar»; cielo de vuelta a P1 | El clímax (`TÚ`) ocurre **al llegar**, por tiempo; el cierre es obligatorio y circular (bookend con GAYA) | 7.9 |
| MA-6 | Romper valles de φ = 90° fijo; islas ≥ 40 filas; vida ambiental | Sin plano ni islas: **un acontecimiento por pantalla**; las fichas alternan lado, ritmo y guion | 7.11, 4.1 |
| MA-7 | Clichés: circuito de chips, titular de contacto, lettering de píxeles 5×5, cielo de rampa ASCII | Campo de líneas y campo de letras **descartados con prueba visual**; titular «Hablemos»; palabras de Bricolage (no 5×5); bruma de bloques, no rampa | 1.2, 2.1, 5.3, 5.5, 8.8 |
| MA-8 | Visto bueno del Faro y alternativa; deriva de tono noche→amanecer | Faro **verificado apagado** y retirado; deriva `dawn` dentro del Cobalto | 2.3, 2.4, 5.4 |
| MA-9 | Corregir sobreafirmaciones («especificación cerrada», «ningún referente lo hace») | Todo dato lleva [V]/[M]/[C]; §2.5 lista lo **no verificado**; lo abierto está en §14 | 2.5, 14 |

### Mundo · Ingeniería

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| MI-1 | Rehacer la arquitectura de scroll (escenario fijo / tira con scroll nativo); sin `transform` por evento; fijar nº de contextos | **Un** lienzo fijo a pantalla; las lecturas largas en **placas opacas**; el lienzo no dibuja nada que deba alinearse con el texto; un solo contexto | 4.2, 6.1 |
| MI-2 | Medir en A07 antes de cámara B/despliegue; capturas en color; S3 a 2 cuadros si falla | Puerta **T12 en M1**; no hay cámara B ni despliegue; capturas de color hechas; escalera de optimización explícita | 6.12, 2.1 |
| MI-3 | S3 de 200–250 svh o sticky con scrub; velocidad máxima de scrub | Sin scrub: los guiones **corren por tiempo** y el scroll solo los dispara; sin `sticky` | 6.4, R12 |
| MI-4 | Sustituir Canvas 2D de 8 fps por Still; `failIfMajorPerformanceCaveat`; Lighthouse en 3 rutas | Modo `still` (Canvas 2D, un dibujo por cambio); detección por `failIfMajorPerformanceCaveat`; T1 en tres rutas | 6.10, 11.2, T1 |
| MI-5 | Póster por clase de rejilla; fundido 360–1920; 360×800 como referencia; umbrales en `em/ch` | 3 variantes SSR conmutadas por `@container` **en `ch`** (celdas); tabla por viewport; 360×800 referencia | 5.3, 6.9 |
| MI-6 | Zoom de solo texto al 200 %; h2 real; `scroll-padding-bottom`; cromo; minimapa | T13; h2/h3 **texto real visible**; `scroll-padding` medido de alturas reales; **sin minimapa ni espina** | 4.5, 5.1, 10, T13 |
| MI-7 | Re-estimar: M-1 (portar motor 5–8 d), duplicar M2/M3; v1 mínima publicable | 63–70 días-persona con el motor portado; **M0 publicable** antes del motor | 12.2, 12.3 |
| MI-8 | Reducir acoplamiento lienzo–DOM; misma topología en ES/EN y 360–1440; cerrar contradicciones | El lienzo no dibuja hilo ni pozos de datos; contratos únicos; una sola cifra por cosa (póster medido) | 4.2, 12.4, 2.2 |
| MI-9 | Decidir Faro/cruz y `[CONFIRMAR]` con el dueño antes de M4 | Faro retirado; `[CONFIRMAR]` → **banderas** con versión honesta ya escrita; decisiones en §14.2 | 2.4, 8.1, 14.2 |

### Mundo · Negocio

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| MN-1 | Vista conjunta de los 4 servicios; Servicios sobre Referencias; menú con Quiénes somos y 4 servicios (móvil) | **Índice** de 4 filas tras «Quiénes somos»; Servicios antes de Ejemplos; menú móvil con los 4 como subenlaces | 4.3, 4.1, 4.5 |
| MN-2 | Tildes en el lettering (QUIÉNES, AUTOMATIZACIÓN E IA) | Sin lettering de títulos: son **texto real**. Las palabras con tilde (`TÚ`) salen de la fuente con su acento | 5.1, 5.3, Anexo B |
| MN-3 | Ignición del Faro: verificar, quitar premisa, haz genérico; skyline moderno | Verificado [V] y **retirado**; horizonte con puente y torres modernas | 2.3, 2.4, 7.9 |
| MN-4 | Datos locales: ≤ 1 por servicio, sin fiscal, sin «Verificado …» visible | 1 por servicio, nada fiscal, sin sello de fecha, **retiro automático** | 8.9 |
| MN-5 | Copy reducido sin `[CONFIRMAR]`; lint 4–7 | **v1 honesta** + banderas v2; lint acepta 4–7 | 8.1, 8.5 |
| MN-6 | Orden de construcción con hitos publicables | M0 = página completa sin motor | 12.3 |
| MN-7 | Sello «datos ficticios» junto al h2; número real; no publicar con < 3 | Etiqueta junto al `h2` y en cada emblema; `n` real (hoy 3) | 8.6, 7.7 |
| MN-8 | Titular del contacto sin evocar Google Maps | «**Hablemos**» | 8.8 |
| MN-9 | Resolver el nombre (D2) antes del lettering y `Logo.astro` | Decisión #2 del dueño (por defecto Gaya Digital); `alternateName` en JSON-LD | 14.2 #2, 8.12 |
| MN-10 | Plegar ledgers en móvil; quitar `████` y copiar solo-icono | `<details>` «Más detalles» en móvil; botón **Copiar → Copiado** con etiqueta y `role="status"` | 4.6, 8.8, 5.9 |
| MN-11 | Rebajar el registro de terminal; A07 antes de S3; que el estático siga vendiendo | Botones reales sin corchetes ni árbol; A07 puerta de M1; **T15 sobre la página estática** en M0 | 5.9, 6.12, 12.3 |

### Instrumento · Arte

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| IA-1 | Resolver la sincronía escena↔scroll; medir jitter en A07 a 90 Hz | Arte a pantalla fija + placas; acumulador con módulo correcto a 90 Hz; T12 | 6.1, 6.11 |
| IA-2 | Dar sentido a las lecturas (escala, autotest teatral, medir peso) | **Retiradas**: no hay lecturas de peso/solicitudes/cookies/terceros | 1.2 |
| IA-3 | Demostrar el WAOOO en color; subir el brillo del campo | Prototipo en color visto; bruma con presupuesto de tono medido | 2.1, 5.4 |
| IA-4 | Salirse del look TUI; logo de plotter como apertura; h1 en mono 800 vs display | Sin instrumentos, lámparas ni corchetes; `h1` en Bricolage 800; el logo de plotter **no se adopta** (el logo lo hará un diseñador, PRODUCT.md) | 1.1, 5.1, 5.9 |
| IA-5 | Momento firma 2 legible sin conocer Santo Domingo; cruz del Faro | La firma es GAYA→HOLA (universal); ON es **continuidad**, no apagón local; sin Faro | 7.2, 7.6 |
| IA-6 | Inconsistencias (póster 3 tonos vs 16; regla de 144 px; 15 px; foco; JS; altura) | Póster de 4 tonos **declarado no idéntico**; `--ch` literal; foco 2.4.11; presupuesto §11.1; altura 15,2 pantallas | 6.9, 5.2, 10, 11.1, 4.1 |
| IA-7 | Reforzar Quiénes somos con texto real | **Placa** con filas reales y firma | 8.3 |

### Instrumento · Ingeniería

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| II-1 | Rehacer la sincronía; placas opacas; documentar frente a R06 D1 | Placas opacas para lecturas largas; un contexto; la decisión está documentada en la tabla de §6.1 | 6.1 |
| II-2 | Validación en A07 en F1 como puerta; scroll continuo; presupuesto completo | T12 en M1; protocolo con scroll continuo; presupuesto completo | 6.12, 11.1 |
| II-3 | Recortar y calendarizar; sacar e-CF, miniaturas por vector de forma, `[imagen\|texto]` | Plan en WP y hitos; **fuera** e-CF, miniaturas ASCII de capturas y el conmutador | 12.2, 12.3, 1.2 |
| II-4 | Arte paramétrico por ancho (320…1920); marcos móvil ≤ 54 col | Variantes XS/S/M/L por columnas; pilas ≤ 52 cols | 5.3 |
| II-5 | `<output>` → `span`; quitar el argumento de axe; probar NVDA/TalkBack | Sin `<output>` ni regiones vivas (solo «Copiado» con `role="status"`); prueba manual con NVDA/TalkBack | 10 |
| II-6 | Escala y semántica de los medidores | Retirados los medidores | 1.2 |
| II-7 | Lint de frescura como aviso; cuenta del e-CF fuera; ≤ 3–4 hechos; cerrar `[CONFIRMAR]` | **4 hechos no fiscales** con retiro automático; lint = aviso; banderas | 8.9, 8.1 |
| II-8 | Respaldos completos (sin JS, print, forced-colors); paridad de tonos; campo sin WebGL2 → póster | Honestidad sobre «sin JS = solo la portada»; `still` 2D; paridad a 4 tonos declarada y probada (T6) | 6.9, 11.2, T6 |
| II-9 | `--ch` con literales; corregir cifras | `--ch` 12/18/25 px literales; cifras recalculadas (15,2 pantallas) | 5.2, 4.1 |

### Instrumento · Negocio

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| IN-1 | Portada para el no técnico; fuera `solicitudes/cookies/terceros`; propuesta 24–48 h | Lecturas retiradas; la portada **nombra los 4 servicios** y el WhatsApp; el plazo solo con bandera | 1.2, 8.2, 8.1 |
| IN-2 | Choque con antirreferencias (4 fichas iguales, chat de ejemplo); reconciliar «sin rótulos» con títulos gigantes; bajar los puntos | Fichas **alternan** lado, ritmo y guion; **sin chat** (LISTO no muestra conversación); las palabras son arte y los títulos, texto; sin fondo de puntos (bruma de bloques) | 4.1, 7.4, 5.1, 5.5 |
| IN-3 | Vía de conversión por referencia: «Quiero una así» prellenado; captura real; «Ejemplos»; sin contador con 3; no 100 svh para 3 filas | «Quiero una así» con mensaje del ejemplo; emblemas en lugar de miniaturas; el enlace lleva el `n` real; la sección se dimensiona por su contenido | 8.6, 7.7 |
| IN-4 | Fiscal fuera; datos por idioma; fechar y caducar con build | Sin fiscal; mismo hecho en ambos idiomas; `expires` filtra en el build | 8.9 |
| IN-5 | Decidir `[CONFIRMAR]` antes; placa que sobreviva; «Hablas directo»; presencia humana honesta | Banderas; placa v1 sin lo no confirmado; fila «Trato: directo con el director»; nombre y rol (retrato solo con foto) | 8.1, 8.3 |
| IN-6 | Claves i18n faltantes; «SD 21:40» → «Santo Domingo»; nav de 5 enlaces; CTA único distinguible; verbo por servicio | Tabla de microcopy; «Santo Domingo · 21:40»; 5 enlaces; `.btn--primary` frente a `.btn--ghost`; «Escríbenos por WhatsApp» | 8.11, 8.3, 5.9, 14.2 #8 |
| IN-7 | Imágenes que sugieren garantías (ECG, barras, chat); apagón leído como error | Sin ECG, barras ni chat; ON = continuidad con texto intacto y piloto siempre encendido | 7.4, 7.6 |
| IN-8 | Probar la firma en IG/TikTok Android; diseñar el «wao» móvil; no usar `terceros` | **T16 antes de M2**; el wao móvil es la **pila de ≈ 300 px** (visto [M]); no hay lecturas de terceros | T16, 2.1 |
| IN-9 | Recortar alcance; Faro o cierre neutro; 9,7 → 10,4; nombre de marca | Orden de recorte; Faro retirado; altura recalculada; decisión #2 | 12.3, 2.4, 4.1, 14.2 |
| IN-10 | Señal comercial honesta sobre precio y modalidad, solo si se confirma | Banderas `pricingModel` y `proposalHours`; nunca se inventan tarifas | 8.1 |

### Cartel · Arte

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| CA-1 | Reordenar el guion contra el «fantasma»: estado final a brillo pleno al llegar; `still` = vivo; nada de clímax bajo texto a T6 | Regla R13; **placas que tapan** en vez de fantasma; el estado final es el `still` | R13, 4.2, 6.1 |
| CA-2 | Firma independiente del dedo: 1,2–1,6 s; probar un fling de 2 000 px/s; reducido = corte seco | Marea por tiempo (1,4 s); **T9**; reducido = corte seco | 6.4, T9, 11.2 |
| CA-3 | Aprobar el arte **en color y en vivo** antes del motor; reconciliar el presupuesto de tonos | Hecho (§2.1); presupuesto de tono medido y fijado | 2.1, 5.4 |
| CA-4 | Decidir la tipografía (grotesca legible; mono para arte); o quitar corchetes y árbol | **Dos voces**: Bricolage para lo que se lee, Geist Mono para lo que se ve; sin corchetes ni árbol en la interfaz | 5.1, R6 |
| CA-5 | Móvil primero para palabras cortas (pila/rotación); cerrar 1280/1366 | Pilas `XX / X` y líneas por cartel, medidas; 1280 y 1366 = variante **L** | 5.3 |
| CA-6 | Romper la plantilla de las 4 fichas; cierre con clímax; VER con webs de verdad o sustituir | Fichas alternan; `TÚ` como clímax; **VER** sin miniaturas: emblemas y barrido de luz | 4.1, 7.9, 7.7 |
| CA-7 | Etiquetas con el nombre real; `scroll-padding-bottom`; mapa de pozos que se desplaza | `h3` visible y Índice con nombres; sin espina; `scroll-padding` medido; pozos inflados por velocidad | 4.3, 4.5, 5.8 |

### Cartel · Ingeniería

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| CI-1 | Rehacer §9.1 con los números medidos de R05; medir la build real en M1 | Presupuestos reconstruidos con R05 y con lo medido hoy; se re-mide en M1 | 11.1 |
| CI-2 | Póster SSR vs lienzo: spans por corridas o degradado; quitar «idéntico/celda por celda» | 4 capas de tono, **no idéntico** (dicho); no se pinta con JS; LCP medido | 6.9 |
| CI-3 | Pozos↔registro: margen ∝ velocidad + prueba de píxeles a 2 400 px/s | Inflado por velocidad y tope global; **T7** | 5.8, T7 |
| CI-4 | 2.4.11, 2.5.8, `role="status"`, `@view-transition` con reducido | `scroll-padding` medido, objetivos 24/44, «Copiado» con `role="status"`; `@view-transition` ya se anula con reduced-motion en `base.css` | 10, 4.5 |
| CI-5 | Recortar la v1 y el plazo; un renderizador WebGL2; A07 antes de M2 | WebGL2 + 2D fijo; 8 escenas **por paquetes**, publicable por hito; A07 en M1 | 6.10, 12.2, 12.3 |
| CI-6 | Reglas de variante unificadas; tabla por viewport; tratamiento móvil de las palabras cortas | **§5.3** (tabla medida) | 5.3 |
| CI-7 | Corregir afirmaciones falsas; sin JS / forced / print; `failIfMajorPerformanceCaveat` | «Sin JS = solo la portada» dicho con honestidad; detección por capacidades; matriz | 6.9, 6.10, 11.2 |
| CI-8 | Medir el pipeline completo; tier móvil ≤ 4.200; 30 vs 45 fps | Presupuesto y protocolo; tier `low` 4.800 (A07: 3.960); 30 fps con `?fps=45` como experimento | 6.11, 6.12 |
| CI-9 | Mockup estático sin corchetes; pares palabra→servicio; `h3` no muleta | Capturas sin corchetes (§2.1); **T15** mide la asociación; `h3` visible siempre | 2.1, 5.3, T15 |
| CI-10 | Declarar devDependencies de `words.mjs`; quitar gsap/lenis; dueño de los datos; limitaciones de Pages | No hace falta `fontkitten` (se usa Chrome); fuera gsap/lenis; dueño = Giancarlo cada 90 días; limitaciones de Pages | 12.1, 8.9, 11.3 |

### Cartel · Negocio

| Cód. | Lo que pidió el juez | Resolución | § |
|---|---|---|---|
| CN-1 | Vista de los 4 servicios; nombre visible en espina/índice/carteles; 2.5.3 | Índice; `h3` visible; nombres accesibles que contienen el texto visible | 4.3, 10 |
| CN-2 | Quitar modismos de terminal; botones reales; sans legible; «Santo Domingo, RD» + hora llana | Dos voces; botones-rótulo sin corchetes; «Santo Domingo · 21:40» | 5.1, 5.9, 8.3 |
| CN-3 | Rehacer ON sin dramatizar; F31 fuera; metáfora de continuidad | **ON**: se apaga el ambiente, **el neón sigue**; sin dato de apagones | 7.6, 8.5 |
| CN-4 | «Referencias» → «Ejemplos»; sello en el cartel; embudo en las 2 primeras pantallas | Decisión #4; sello junto al `h2`; «Ver ejemplos» en la portada y el menú; «Quiero una así» prellenado. **No se finge** una lista de 14: solo los construidos | 8.6, 8.2, 14.2 #4 |
| CN-5 | Copy sin jerga; datos locales útiles; retiro por fecha | Fuera SPF/DKIM/DMARC, CRM, API…; 1 dato útil por servicio; `expires` | 8.5, 8.9 |
| CN-6 | Primera pantalla dice qué hace Gaya; CTA sin scroll a 390×844; palabras clave locales; prueba de 5 segundos | Lead con los 4 servicios; **T22**; keywords en descripciones; **T15** | 8.2, 8.12, T22, T15 |
| CN-7 | Móvil primero; A07 e in-app como puerta de M1; definir WEB/ECO/ON/VER en móvil; fallback si no hay WebGL2 | §5.3 (composiciones); T12 y T16 en M1; `still` 2D | 5.3, 12.3, 11.2 |
| CN-8 | Contradicción HOLA (texto sobre OLA); presencia humana y ancla local; qué copy sale sin confirmar | Texto **debajo** de la palabra; nombre y rol (retrato solo con foto); horizonte de SD; v1 honesta | 7.2, 8.3, 7.9, 8.1 |

---

## 16. Decisiones cerradas (resumen numerado)

**Concepto**
1. **Cartel** como base, con injertos de Mundo (cierre «tu lugar» = `TÚ`, horizonte de Santo Domingo, emblemas) e Instrumento (placa, Índice, procedencia de datos).
2. **Ocho carteles:** `GAYA · HOLA · WEB · LISTO · ECO · ON · VER · TÚ` (EN: `GAYA · HELLO · WEB · READY · ECHO · ON · SEE · YOU`). La palabra es imagen; el título es nombre.
3. Materiales: vidrio con agua, olas, obra, celdas que se ensamblan, anillos, neón, barrido de luz, vidrio con agua (bis).
4. **La marea** es la costura entre carteles; corre **por tiempo** (1,4 s avance, 1,0 s retroceso), disparada por el scroll.
5. **Momento firma:** GAYA se deshace en agua y de ella cristaliza HOLA.
6. **Cierre `TÚ`**: clímax por llegada, no por hover; horizonte de Santo Domingo **opcional** (fallback sin silueta).
7. **Fuera:** Faro a Colón, Obelisco, lecturas en vivo, cámara única, islas, lupa, cálculo estelar, e-CF.

**Tipografía y retícula**
8. **Dos voces**: Bricolage Grotesque Variable (todo lo que se lee) + Geist Mono Variable (arte, etiquetas, datos). `--font-body` permite cambiar el cuerpo.
9. Fuentes autoalojadas por `@font-face` propios (`latin` + `symbols2`), **70,2 KB**, respaldos métricos explícitos; fuera Astro Fonts.
10. `h1`, `h2`, `h3` y todo el texto son **texto real visible**; no hay lettering de títulos.
11. Celda **6×12 · 9×18 · 12×25** por viewport (< 900 · 900–1599 · ≥ 1600), `--ch` literal; el lienzo usa la misma celda en píxeles enteros, `dpr` ≤ 2.
12. Palabras: cuadrantes 2×2 rasterizados con **Chrome + Bricolage 800**, guardadas como **`.txt`** (fuente de verdad, retocables) y compiladas a RLE.
13. Variantes **L / M / S / XS / mini / proc**; se elige por **columnas del motor** con 4 columnas de margen; composiciones móviles en pila o línea medidas.

**Color**
14. Tonos **T0–T15** generados de `--glow-0..3` (`scripts/tones.mjs`); una sola fuente CSS+TS.
15. Presupuesto de tono: T≥9 ≤ 12 %, T≥11 ≤ 4 %, T≥13 ≤ 1,5 %, T≥14 ≤ 0,5 %; acento ≤ 5 %.
16. Texto corto bajo pozo (`ink` ≤ T6, `muted` ≤ T4); texto largo sobre **placa opaca**; deriva `dawn` dentro del Cobalto.
17. Look: **rótulo luminoso** (caras sólidas, aro de luz, sombra proyectada, halo, bruma de `░▒▓·:`, espuma `*~`); **descartados** el campo de líneas (circuito) y el de letras.

**Motor**
18. **Un único lienzo fijo**, un contexto WebGL2; las lecturas largas en el DOM.
19. Escenas = funciones **puras** de `(p, t, e, heat, rings)`; `still` = fotograma del motor a `STILL_T = 21,7`.
20. **Celdas en CPU + sello en GPU**; se retira el shader de `hero.ts`; la lente pasa a ser **calor**.
21. Agua por **tesela periódica 64×64** con lectura bilineal; aritmética entera en la ruta del `still`.
22. Tiers `high 9 000 · mid 6 500 · low 4 800 · min 2 400`; 30 fps; sueño a 1,6 s; el control adaptativo **solo baja**.
23. Modo `still` con **Canvas 2D** (un dibujo por cambio de cartel) para reducido, `saveData` y sin WebGL2; **no hay bucle 2D**.
24. Detección con `getContext('webgl2', { failIfMajorPerformanceCaveat: true })`.
25. **Póster SSR solo de la portada**, 4 capas de tono, `display:none` con JS (Chrome cuenta `::before` para LCP); sin JS o fallo del motor se muestra.
26. La escena `cover` **no usa `bg`**.

**Página**
27. Orden: Portada · Quiénes somos · Servicios (Índice + 4 fichas) · Ejemplos · Proceso · Contacto; ≈ 15 pantallas (22 en móvil).
28. **Índice** de 4 filas con palabra mini, nombre, promesa, enlace y WhatsApp; ninguna plantilla de tarjetas.
29. **Placas opacas** con cara + sombra proyectada para toda lectura larga; botones-rótulo con sombra en bloque, sin corchetes.
30. Menú en píldora (escritorio) / `popover` + barra inferior (móvil); **sin espina ni minimapa**; `scroll-padding` medido.
31. «Para quién / Necesitamos / Resultado» **plegado** en móvil con la etiqueta «Más detalles».

**Contenido**
32. **v1 honesta** (sin confirmaciones) y **v2 por banderas** `brand.json › confirmed`; lint de 4–7 «Incluye».
33. **Cuatro datos locales** no fiscales (F13, F19, F15, F30) con fuente y `expires`; **se retiran solos**.
34. **«Ejemplos»** en vez de «Referencias» (URL intactas) — sujeto a decisión #4.
35. Titular del contacto **«Hablemos»**; CTA único **«Escríbenos por WhatsApp»**; mensaje prellenado por servicio y por ejemplo.
36. JSON-LD `Organization` + `Service` (sin `LocalBusiness`); `alternateName: Gaya Group`.

**Calidad y operación**
37. **T1–T22** (§13); **A07 físico** es puerta de M1; cada hito deja la web publicable.
38. Se retiran `gsap`, `lenis`, `hero.ts`, `HeroCards`, `public/hero/*`, `noise.png`.
39. **GitHub Pages**: gzip, `max-age=600`, CSP por `<meta>`, HTTPS sin emitir; copiar correo con respaldo; Lighthouse en localhost y repetido sobre HTTPS cuando exista.

---

## 17. Fuentes

**Verificadas hoy [V]** (30-sep-2026): Faro a Colón apagado — https://acento.com.do/bbc-news-mundo/el-faro-sin-luz-que-honra-a-cristobal-colon-y-las-maldiciones-atribuidas-a-sus-restos-en-republica-dominicana-9254107.html · Instagram: WKWebView (iOS) y Custom Tabs (Android) — https://u2l.ai/blog/instagram-in-app-browser · WebGL2 en WebViews — https://caniwebview.com/features/web-feature-webgl2/ · WCAG 2.5.3 — https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html · WCAG 2.4.11 — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html · `failIfMajorPerformanceCaveat` — https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext · Popover API — https://developer.mozilla.org/en-US/docs/Web/API/Popover_API · cabeceras de `http://gaya.com.do` y certificado de `https://gaya.com.do` (`curl`).

**Medidas propias [M]** (Node 24.19, Chrome 154, Playwright 1.63 del proyecto, fuentes de `node_modules/@fontsource-variable`): anchos y pesos de palabras (Anexo A), tamaños de póster SSR (§2.2), presupuesto de tono (§2.2), LCP con `::before` (§2.2), capturas en color (§2.1).

**Informes y conceptos de esta serie:** `docs/ascii/research/01-showcase.md` · `02-gpu-ascii.md` · `03-typography-accessibility.md` · `04-services-content.md` · `05-illustration-engine.md` · `06-motion-architecture.md` · `docs/ascii/concepts/cartel.md` · `mundo.md` · `instrumento.md`. Repositorio: `PRODUCT.md`, `DESIGN.md`, `CONTRACT.md`, `brand.json`, `astro.config.mjs`, `src/layouts/Base.astro`, `src/scripts/hero.ts`, `src/components/{Hero,Nav}.astro`, `src/i18n/copy.ts`, `src/data/{references.json,site.ts}`, `src/lib/{color.mjs,refs.ts}`, `scripts/{budgets,guard,shot}.mjs`, `.github/workflows/deploy.yml`.

**Fuentes de datos locales (R04 §7)**: NIC.DO https://www.nic.do/en/policies/domain-names-delegation-policies-for-cctld-do/ · WhatsApp Business https://whatsappbusiness.com/es-la/policy/ · Meta https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing · CISA https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data. Fuentes y técnicas que sustentan R01–R06 (Alex Harri, Codrops, WCAG 2.2, MDN, web.dev, Astro, etc.) están citadas en cada informe; este documento no las repite.

**Licencias:** Geist Mono y Bricolage Grotesque, OFL-1.1 (© 2024 The Geist Project Authors; © 2022 The Bricolage Grotesque Project Authors). Todo el código de los anexos es original de esta dirección; los emblemas (Mundo A.4) son originales de esa propuesta.

---

## Anexo A · Tablas medidas

### A.1 Anchos de palabra por variante (Bricolage 800, cuadrantes 2×2, celda 1:2) [M]

Cada celda es «filas × columnas». **S** y **XS** son pilas de líneas (todas con las mismas filas) salvo donde se indica «línea». Las filas de **TÚ** son las de la mayúscula; el acento añade 5–7 filas.

| Palabra | L (≤ 128 cols) | M (≤ 88) | S pila (≤ 52) | XS pila (≤ 44) | mini (6 filas) |
|---|---|---|---|---|---|
| GAYA | 16 × 121 | 11 × 84 | `GA / YA` 12 f (49 c) | 10 f | 46 c |
| HOLA | 16 × 122 | 11 × 84 | `HO / LA` 13 f (51 c) | 11 f | 46 c |
| WEB | 18 × 124 | 12 × 83 | `WE / B` 10 f (48 c) | 9 f | 42 c |
| LISTO | 16 × 124 | 11 × 85 | `LIS / TO` 13 f (52 c) | 11 f | 47 c |
| ECO | 22 × 124 | 15 × 84 | `EC / O` 14 f (50 c) | 12 f | 34 c |
| ON | 22 × 90 | 16 × 66 | **línea** 12 f × 50 c (pila `O / N` 14 f, 28 c) | 14 f | 25 c |
| VER | 21 × 125 | 14 × 84 | `VE / R` 13 f (50 c) | 11 f | 36 c |
| TÚ | 17 × 63 (+7 acento) | 13 × 48 (+5) | **línea** 14 f × 52 c (+6) · pila `T / Ú` 14 f, 26 c | 14 f | 22 c |
| HELLO | 14 × 122 | 10 × 88 | `HEL / LO` 9 f (49 c) | 8 f | 53 c |
| READY | 12 × 120 | 8 × 80 | `REA / DY` 8 f (48 c) | 7 f | 60 c |
| ECHO | 16 × 124 | 11 × 85 | `EC / HO` 13 f (51 c) | 11 f | 47 c |
| SEE | 22 × 119 | 16 × 87 | `SE / E` 14 f (50 c) | 12 f | 33 c |
| YOU | 21 × 124 | 14 × 83 | `YO / U` 13 f (50 c) | 11 f | 36 c |
| HOLA (proc) | 8 f × 61 c | | | | |
| LISTO (proc) | 8 f × 62 c | | | | |

### A.2 Peso de los datos de palabras (RLE de 1 byte por corrida: nibble de cuadrante + nibble de repetición − 1) [M]

| Idioma | L | M | S | XS | mini | **Todo (un solo flujo)** |
|---|---|---|---|---|---|---|
| ES | 2 825 B → 1 691 gz | 1 860 → 1 155 | 1 841 → 1 095 | 1 605 → 1 020 | 854 → 501 | **8 985 B → 5 040 gz · 4 423 br** |
| EN | 2 851 → 1 758 | 1 896 → 1 192 | 1 735 → 1 117 | 1 553 → 1 003 | 952 → 545 | **8 987 → 5 210 gz · 4 607 br** |

El troceo **por cartel** (para cargarlas con `import()`) cuesta ≈ +10 % de gzip respecto del flujo único.

### A.3 Póster SSR de la portada, 4 capas de tono, sin `bg` [M]

| Variante | Celdas no vacías | dim | mid | hot | spark | **Total gz** | br |
|---|---:|---:|---:|---:|---:|---:|---:|
| `wide` 160×50 (GAYA 16 f) | 4 736 / 8 000 | 1 168 | 385 | 278 | 301 | **2 045** | 1 871 |
| `stack` 65×70 (`GA / YA` 12 f) | 2 598 / 4 550 | 973 | 268 | 214 | 242 | **1 592** | 1 467 |

---

## Anexo B · Especímenes (glifos reales, salida del rasterizador) [M]

`GAYA` a 11 filas (M, 84 columnas):

```text
    ▗▄▄███████▙▄▖            ▗███████▙     █████▙        ▟█████     ▟███████
  ▗▟██████████████▄          █████████▖    ▝█████▙      ▟█████     ▐████████▙
 ▟█████▀▘   ▝▀█████▌        ▟████▀█████     ▝█████▌    ▟████▛     ▗████▛▜████▌
▐█████▘       ▝█▀▀▀        ▗████▛ ▝████▙     ▝█████▖  ▐████▛      ▟████▘ ▜████
█████▌                     █████   ▜████▖      ▜████▖▗████▛      ▐████▌  ▝████▙
█████▌     ▐████████▖     ▟████▌   ▝█████       ▜████████▛      ▗█████    ▜████▌
█████▌     ▐████████▌    ▗████▛     ▐████▙       ▜██████▛       █████▘    ▝█████▖
▐█████         █████▌    █████████████████▖       ▜████▛       ▐████████████████▙
 ▜█████▄     ▄▟▛▐███▌   ▟██████████████████       ▐████▌      ▗██████████████████▌
  ▜███████████▛  ███▌  ▗█████▘        ▜████▙      ▐████▌      █████▛        ▝█████▖
    ▀▀██████▀▀   ███▘  █████▘         ▝█████▖     ▐████▌     ▐████▛          ▜████▙
```

Pila móvil `GA / YA` a 12 filas (S, 49 y 47 columnas):

```text
     ▗▄▄███████▙▄▄              ▗▄▄▄▄▄▄▄▄
   ▄███████████████▙▖          ▗█████████▙
 ▗██████▛▀▀▀▀▀▜██████▖         ▟████▛█████▖
▗█████▛▘       ▝███▛▀▘        ▟████▛ ▝█████
▟█████▘                      ▗█████▘  ▜████▙
██████      ▗▄▄▄▄▄▄▄▄▄       █████▛   ▝█████▖
██████      ▐█████████      ▟█████     ▐█████
██████▖     ▝▀▀▀▜█████     ▗█████▙▄▄▄▄▄▄█████▙
▝█████▙         ▟█████     ███████████████████▌
 ▜██████▄▄▖  ▄▄▟█▘▐███    ▟█████▀▀▀▀▀▀▀▀▀▜█████▖
  ▝█████████████▘ ▐███   ▗█████▛         ▝█████▙
    ▝▀▜██████▀▀   ▐███   █████▛           ▜█████▌

▀██████▖        ▟██████▘     █████████▖
 ▝██████▖      ▐██████▘     ▟██████████
  ▝██████▖    ▗██████▘     ▗█████▀█████▙
   ▝██████   ▗█████▛       █████▛ ▝█████▖
    ▝█████▙  █████▛       ▟█████   ▜█████
     ▝█████▙▟████▛       ▗█████▌    █████▙
      ▝█████████▛        ██████     ▐█████▖
        ▜██████▛        ▟█████▌      ██████
         ██████        ▗███████████████████▙
         ██████        █████████████████████▌
         ██████       ▟█████▌         ▝██████▖
         ██████      ▗██████           ▐█████▙
```

`TÚ` a 12 filas + 5 del acento (M, 44 columnas) y `ON` a 12 filas (S línea, 50 columnas):

```text
                                 ▗▄▄▄▄▖
                                ▗████▛▘
                               ▗████▛
                               ████▘

███████████████████▌  ▐█████          ██████
███████████████████▌  ▐█████          ██████
▀▀▀▀▀▀▀█████▛▀▀▀▀▀▀▘  ▐█████          ██████
       █████▌         ▐█████          ██████
       █████▌         ▐█████          ██████
       █████▌         ▐█████          ██████
       █████▌         ▐█████          ██████
       █████▌         ▐█████▌         ██████
       █████▌         ▝█████▙        ▗█████▛
       █████▌          ▜██████▙▄▄▄▄▄███████▘
       █████▌           ▝████████████████▀
       █████▌             ▝▀▀████████▛▀▀

     ▄▄▟███████▄▄▖        ▐██████▙         ▗█████
  ▗▟██████████████▙▖      ▐████████▖       ▐█████
 ▗██████▀▀▀▀▀▀██████▙     ▐█████████▄      ▐█████
▗█████▛        ▜█████▌    ▐████▛█████▙     ▐█████
▟█████          ██████    ▐████▌▝▜████▙▖   ▝█████
██████          ▐█████▖   ▐████▌  ▜█████▖   █████
██████          ▐█████▘   ▐████▌   ▝█████▙  █████
▜█████          ▟█████    ▐████▌    ▝█████▙ █████
▝█████▙        ▗█████▌    ▐████▌      ▜██████████
 ▝██████▄▄  ▗▄▟█████▛     ▐████▌       ▀█████████
  ▝▜██████████████▛▘      ▐████▌        ▝████████
     ▀▀████████▀▀         ▐████▌          ▜██████
```

Palabras de proceso (`proc`, 8 filas): `HOLA` (61 columnas) y `LISTO` (62):

```text
███▌      ███▙     ▄▄██████▄▄     ███▌            ██████
███▌      ████   ▗████▀▀▀▜███▙▖   ███▌           ▟██████▙
███▌      ████  ▗███▛     ▝████   ███▌          ▗███▘▝███▖
██████████████  ▐███▌      ▐███▖  ███▌          ███▛  ▜███
████▀▀▀▀▀▀████  ▐███▌      ▐███▘  ███▌         ▟███▘   ███▙
███▌      ████  ▝███▙     ▗████   ███▌        ▗████████████▖
███▌      ████   ▝████▄▄▄▄███▛▘   ████▄▄▄▄▄▄  ████▀▀▀▀▀▀████
███▌      ███▛     ▀▜██████▀▘     ██████████ ▟███▘      ▝███▌

███▌        ███▌    ▄▟██████▄▄   ████████████▙   ▗▄██████▙▄
███▌        ███▌  ▗███▛▀▀▀▀███▙  ▀▀▀▀▜███▛▀▀▀▀  ▟███▛▀▀▀████▖
███▌        ███▌  ▐███▄     ▀▀▀      ▐███▌     ▟███▘     ▜███▖
███▌        ███▌   ▜██████▄▄▄▖       ▐███▌     ███▛      ▝███▌
███▌        ███▌     ▝▀▀▜██████▖     ▐███▌     ███▙      ▗███▌
███▌        ███▌  ▗▄▄▙     ▝████     ▐███▌     ▜███▖     ▟███▘
████▄▄▄▄▄▄  ███▌  ▝███▙▄▄▄▄▟███▌     ▐███▌      ▜███▙▄▄▄████▘
██████████  ███▌   ▝▀▜██████▛▀▘      ▐███▘       ▝▀██████▛▀
```

---

## Anexo C · Código de referencia

### C.1 `scripts/words.mjs` (WP3): rasterizador de palabras

Probado en esta pasada. Usa el Playwright que ya está en el proyecto y la fuente de `node_modules`; **no** necesita `fontkitten` ni TTF estático (CI-10). `1 unidad = ancho de celda`; la altura de la mayúscula (**sin acento**) fija la escala; el acento añade filas.

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const FONT = 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2';
const QUAD = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']; // bit0=TL bit1=TR bit2=BL bit3=BR

export async function rasterizer() {
  const b64 = readFileSync(FONT).toString('base64');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.setContent(`<style>@font-face{font-family:B;src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:200 800}</style><canvas id=c width=4000 height=900></canvas>`);
  await page.evaluate(() => document.fonts.load('800 100px B', 'GAYAÚ'));
  const raster = (text, rows) => page.evaluate(({ text, rows }) => {
    const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ctx = document.getElementById('c').getContext('2d', { willReadFrequently: true });
    const draw = (t) => { ctx.clearRect(0, 0, 4000, 900); ctx.font = '800 400px B'; ctx.fillStyle = '#fff'; ctx.fillText(t, 100, 600); };
    const bbox = () => { const d = ctx.getImageData(0, 0, 4000, 900).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < 900; y++) for (let x = 0; x < 4000; x++) if (d[(y * 4000 + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return { x0, y0, x1, y1 }; };
    draw(strip(text)); const b0 = bbox();
    const s = (b0.y1 - b0.y0 + 1) / (2 * rows);            // px por unidad (la mayúscula mide 2·rows unidades)
    draw(text); const b = bbox();
    const cols = Math.ceil((b.x1 - b.x0 + 1) / s);
    const rowsTot = rows + Math.max(0, Math.ceil((b0.y0 - b.y0) / s / 2));                 // filas extra del acento
    const d = ctx.getImageData(0, 0, 4000, 900).data, ytop = b.y1 + 1 - 2 * rowsTot * s;
    const cov = (sx, sy) => { const x0 = b.x0 + sx * (s / 2), y0 = ytop + sy * s; let n = 0, a = 0;   // subpíxel de 0,5 × 1 unidad
      for (let y = Math.floor(y0); y < Math.ceil(y0 + s); y++) for (let x = Math.floor(x0); x < Math.ceil(x0 + s / 2); x++) { n++; a += d[(y * 4000 + x) * 4 + 3]; }
      return n ? a / n / 255 : 0; };
    const cells = [];
    for (let cy = 0; cy < rowsTot; cy++) for (let cx = 0; cx < cols; cx++)
      cells.push((cov(cx * 2, cy * 2) > .5 ? 1 : 0) | (cov(cx * 2 + 1, cy * 2) > .5 ? 2 : 0) | (cov(cx * 2, cy * 2 + 1) > .5 ? 4 : 0) | (cov(cx * 2 + 1, cy * 2 + 1) > .5 ? 8 : 0));
    return { cols, rows: rowsTot, cells };
  }, { text, rows });
  return { raster, close: () => browser.close() };
}
export const toText = (w) => Array.from({ length: w.rows }, (_, y) => Array.from({ length: w.cols }, (_, x) => QUAD[w.cells[y * w.cols + x]]).join('').trimEnd()).join('\n');
// No pisar una variante retocada a mano:  if (existsSync(file) && !process.argv.includes('--force')) continue;
```

### C.2 RLE (WP3)

```js
// 1 byte por corrida: (cuadrante << 4) | (repeticiones − 1), hasta 16 repeticiones
export const rle = (cells) => { const out = []; for (let i = 0, j; i < cells.length; i = j) { j = i; while (j < cells.length && cells[j] === cells[i] && j - i < 16) j++; out.push((cells[i] << 4) | (j - i - 1)); } return Uint8Array.from(out); };
export const unrle = (b, n) => { const out = new Uint8Array(n); let k = 0; for (const v of b) for (let r = 0; r <= (v & 15); r++) out[k++] = v >> 4; return out; };
```

### C.3 Lint de glifos (WP11, `npm run ascii:lint`)

```js
const PROHIBIDOS = /[←→■□▪▫●○◆◇▲▶★≈≠≤≥✓✗\u2800-\u28FF]|\p{Extended_Pictographic}/u;   // caen a otra fuente con otro ancho (R03 §1.3)
// se aplica a: data-art del HTML construido, src/ascii/data/words/**/*.txt y emblems.ts; además, ancho constante por línea y solo cuadrantes en los .txt de palabras
```

### C.4 `scripts/tones.mjs` (WP1)

Es lo que se ejecutó en esta pasada, con las funciones que el proyecto ya tiene en `src/lib/color.mjs` (las claves T0, T5, T10 y T15 son `--glow-0..3`; el resto, interpolación lineal en OKLCH):

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { parseOklch, oklchToHex } from '../src/lib/color.mjs';

const NL = String.fromCharCode(10);
const css = readFileSync('src/styles/tokens.css', 'utf8');
const glow = (n) => parseOklch(css.match(new RegExp('--glow-' + n + ':\\s*(oklch\\([^)]*\\))'))[1]);
const K = [glow(0), glow(1), glow(2), glow(3)];                       // T0, T5, T10, T15
const tone = (i) => {
  const k = Math.min(2, Math.floor(i / 5)), f = (i - k * 5) / 5, a = K[k], b = K[k + 1];
  return 'oklch(' + [a.L + (b.L - a.L) * f, a.C + (b.C - a.C) * f, a.h + (b.h - a.h) * f].map((v, j) => v.toFixed(j === 2 ? 3 : 4)).join(' ') + ')';
};
const T = Array.from({ length: 16 }, (_, i) => tone(i));
writeFileSync('src/styles/tones.css', ':root {' + NL + T.map((c, i) => '  --t' + i + ': ' + c + ';').join(NL) + NL + '}' + NL);
writeFileSync('src/ascii/tones.gen.ts', 'export const TONE_HEX = ' + JSON.stringify(T.map(oklchToHex)) + ' as const;' + NL);
// `npm run contrast` comprueba que tones.css y tones.gen.ts coinciden y que los pares de §5.8 se cumplen.
```

### C.5 Cómo reproducir las capturas de §2.1 (parámetros)

Los scripts de la pasada (`words.mjs`, `fit.mjs`, `render2.mjs`, `render3.mjs`, `melt.mjs`, `ssr-size.mjs`, `tonebudget.mjs`, `lcp.mjs`, `allwords.mjs`) **no persisten**; WP6 los reimplementa con el código de producción. Parámetros usados, para que la comparación sea justa:

| Captura | Rejilla | Palabra(s) | Parámetros |
|---|---|---|---|
| Portada escritorio | 1440×900, celda 9×18 (160×50) | `GAYA` 16 f en (19, 6) | nivel de agua 0,85; ganancia de campo 1,0; bruma centrada en (80, 14) con radios (88, 20); `t = 21,7`; pozo de texto en celdas (8,30)–(100,46) |
| Portada móvil A07 | 360×800 @2, celda 6×12 (60×66) | `GA` 12 f en (5, 5) · `YA` 12 f en (8, 19) | nivel 0,85; bruma (30, 18) con radios (34, 22); pozo (2,35)–(58,64) |
| HOLA · WEB · LISTO · ECO · ON · TÚ | 1440×900, 160×50 | `HOLA` 16 en (19, 8) · `WEB` 18 en (18, 6) · `LISTO` 16 en (18, 8) · `ECO` 22 en (18, 14) · `ON` 22 en (35, 12) · `TÚ` 16 (+6) en (60, 3) | fases: HOLA `p = 0,35` · WEB `p = 0,55` · LISTO `p = 0,5` · ECO `u = 0,3` · ON sin apagón · TÚ nivel 0,85 |
| Marea | 160×50 | `GAYA` 18 (saliente) y `HOLA` 18 (entrante) en (12, 8) | frente a filas 38, 26 y 14; `BAND = 3`; `REACH = 12` |
