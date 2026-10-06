# DESIGN — sistema visual de gaya.com.do

> Dirección **«Carteles»**: ocho carteles hechos de bloques Unicode y luz cobalto, con una marea que los cambia. Especificación cerrada en `docs/ascii/DIRECTION.md` (donde contradice a los informes, manda ese documento). Esta hoja resume lo que el código y los diseñadores necesitan a mano.

## Principios
1. **Carteles.** La página es una serie de ocho carteles, cada uno una palabra cuya materia es lo que el servicio hace (vidrio con agua, olas, obra, celdas que se ensamblan, anillos, neón, barrido de luz, y al final tu palabra). Entre uno y el siguiente sube una **marea**. Todo lo que se lee es texto real; todo lo que se ve es arte.
2. **La interfaz se explica sola.** Sin texto instructivo. Etiquetas, iconos, layout y estado.
3. **Tipografía mixta** (decisión del dueño, 30-sep-2026). Lo que rotula —titulares, botones, navegación, etiquetas, la marca— en Geist Mono, como el arte; lo que se lee de corrido —párrafos, lead, listas, textos de placa— en Bricolage Grotesque.
4. **Oscuro con intención.** Superficie casi negra tintada hacia el azul marino de la marca (#14213D), luz y acento en su naranja (#FCA311); el color vive en la luz, no en los rellenos. Una sola familia de color, acento ≤ 5 % del área.
5. **Movimiento con sentido.** Nada se mueve solo salvo la ignición (≤ 2,6 s); la marea corre por tiempo, el scroll solo la dispara; todo duerme a los 1,6 s. Con `prefers-reduced-motion`: fotograma fijo hermoso.

## Tokens
Definidos en `src/styles/tokens.css` y espejados en `src/styles/tokens.json` (`npm run contrast`). Los 16 tonos **T0–T15** salen de `--glow-0..3` (`npm run tones` regenera `tones.css` y `src/ascii/tones.gen.ts`; no se editan a mano): T0 fondo · T1 placa · T7 marco de placa (3,1:1) · T6 tope bajo texto · T9 cara del cartel · T13–T15 luz. Texto: `--ink`, `--lead`, `--muted`, `--accent-text`; acento `--accent`.
- **Celda** (una sola unidad de medida): 6×12 px por debajo de 900 px, 9×18 hasta 1599, 12×25 desde 1600 (`--cw`, `--ch`, enteros). El lienzo y el arte en DOM comparten la retícula, y el texto se coloca en **filas** de esa retícula.
- Espacio de 4 pt, radios ≤ 16 px (los rótulos, 2 px), z-index semántico (lienzo 0 · contenido 1 · cromo 40).

## Tipografía
**Mixta** (decisión del dueño, 30-sep-2026): **Geist Mono Variable** (`--font-head`) para lo que rotula —`h1`–`h4` y títulos de sección y de ficha, botones y controles tipo botón, enlaces de navegación, la marca «Gaya Digital», etiquetas e insignias— y para el arte; **Bricolage Grotesque Variable** (`--font-body`) para lo que se lee de corrido —párrafos, lead, promesas, listas «Incluye», valores y textos de placa—. Autoalojadas, 70 KB; el reparto se cambia en `src/styles/fonts.css`.
- **Titulares en mono**: peso 800 (h1–h3) y 700 (nombres de servicio en filas), `letter-spacing` −0,03 em (h1) · −0,025 em (h2) · −0,02 em (h3), `word-spacing` −0,1 em, interlineado 1,04–1,1, romana, `text-wrap: balance`. Geist Mono avanza 0,6 em por carácter, así que el cuerpo sale de las columnas que la línea más larga debe alojar: `h1` `clamp(2.125rem, 10.6vw, 3.5rem)` en tres líneas hasta 600 px (el español `12.4vw`), `clamp(2.75rem, 7.6vw, 5.5rem)` en dos líneas desde 600 px; `h2` `clamp(2rem, 1rem + 3.4vw, 3.5rem)`; `h3` `clamp(1.625rem, 1rem + 2.4vw, 2.75rem)`. La palabra de acento del `h1` sigue en `--accent-text`.
- **Botones y navegación en mono**: 600–700, 14–16 px, `letter-spacing` −0,01 em, una sola línea, ≥ 44 px de alto (48 en los rótulos de la portada).
- **Cuerpo en Bricolage**: 1–1,125 rem a 1,55–1,6 de interlínea y ≤ 38 rem de medida.
- **Galería, visor y 404** (`data-ui="classic"`): no tienen párrafos, así que usan una sola familia (todo mono, incluido el rubro bajo cada ejemplo): un archivo de fuente en vez de dos, y un LCP de imagen que no espera por el segundo.
- Etiquetas de campo en mono 13–14 px, `--muted`, minúscula, sin corchetes. Nada de texto con degradado.

## Gramática de la página: «cara + sombra proyectada»
- **Rótulos (botones):** cara sólida con sombra en bloque; primario en `--accent`, secundario con línea. Al pasar el puntero se acercan a su sombra. Objetivo ≥ 48 px (≥ 44 en los móviles). Foco: 3 px `--accent-text`.
- **Placa:** superficie opaca (`--t1`, marco T7, sombra T2) para toda lectura larga; tapa al cartel como una cortina. Sin altura fija.
- **Pozo** (`data-well="ink|muted"`): el texto corto sobre arte; el motor limita el tono del arte bajo su rectángulo (T6 · T4).
- **Escenario:** la mitad de pantalla que se lee sobre el cartel; el texto empieza en una fila de la retícula y nunca cae sobre la palabra. En la portada el texto va anclado al fondo de la pantalla, con un **suelo** (`--floor`, en filas de la retícula) bajo la palabra, su aro y su sombra: en pantallas bajas la portada crece en vez de pisar la palabra (y el titular baja hasta ~50 px en portátiles de 650–900 px de alto). `scripts/home-check.mjs` lo comprueba en quince tamaños de pantalla.
- **Índice de servicios:** cuatro filas con regla, cada una con su palabra mini (6 filas), nombre, promesa, «Ver detalle» y WhatsApp. No es una cuadrícula de tarjetas.
- **Fichas de servicio:** no comparten plantilla; alternan el lado del texto y de la placa y el reparto interno. En móvil, «Más detalles» va plegado.
- **Ejemplos:** filas con emblema de sector, nombre, rubro, «Ver ejemplo» y «Quiero una así»; sello «Datos ficticios» junto al título y bajo cada emblema.
- **Proceso:** el hilo de HOLA a LISTO, arte en DOM con el `ol` real.
- **Menú:** píldora fija en escritorio; en móvil, barra inferior con WhatsApp dominante y un `popover` con los destinos. Logo horizontal del kit (`Logo.astro`); en la portada, a una tinta sobre el naranja.

## Movimiento
Ignición de GAYA, marea entre carteles, llegada de cada escena, calor del puntero y anillos de toque: todo opcional, por tiempo y ≤ 2,4 s. La marea corre aunque el dedo se detenga. Reposo sin bucle. El estado estático es un fotograma del mismo motor (nunca una imagen aparte).

## Fuera
Cuadrículas de tarjetas idénticas, rótulos sobre cada sección, numeración visible de secciones, fondos de puntos, texto con degradado, vidrio esmerilado decorativo, marcos falsos de navegador o teléfono, cursivas en titulares, campos de glifos de línea o de letras, corchetes y árboles en la interfaz, verde de terminal, Faro a Colón y Obelisco.
