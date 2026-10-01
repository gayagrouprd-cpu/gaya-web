# DESIGN — sistema visual de gaya.com.do

> Dirección **«Carteles»**: ocho carteles hechos de bloques Unicode y luz cobalto, con una marea que los cambia. Especificación cerrada en `docs/ascii/DIRECTION.md` (donde contradice a los informes, manda ese documento). Esta hoja resume lo que el código y los diseñadores necesitan a mano.

## Principios
1. **Carteles.** La página es una serie de ocho carteles, cada uno una palabra cuya materia es lo que el servicio hace (vidrio con agua, olas, obra, celdas que se ensamblan, anillos, neón, barrido de luz, y al final tu palabra). Entre uno y el siguiente sube una **marea**. Todo lo que se lee es texto real; todo lo que se ve es arte.
2. **La interfaz se explica sola.** Sin texto instructivo. Etiquetas, iconos, layout y estado.
3. **Dos voces.** Lo que se lee, en Bricolage Grotesque; lo que se mira y lo que rotula, en Geist Mono y celdas.
4. **Oscuro con intención.** Superficie casi negra tintada hacia el cobalto; el color vive en la luz, no en los rellenos. Una sola familia de color, acento ≤ 5 % del área.
5. **Movimiento con sentido.** Nada se mueve solo salvo la ignición (≤ 2,6 s); la marea corre por tiempo, el scroll solo la dispara; todo duerme a los 1,6 s. Con `prefers-reduced-motion`: fotograma fijo hermoso.

## Tokens
Definidos en `src/styles/tokens.css` y espejados en `src/styles/tokens.json` (`npm run contrast`). Los 16 tonos **T0–T15** salen de `--glow-0..3` (`npm run tones` regenera `tones.css` y `src/ascii/tones.gen.ts`; no se editan a mano): T0 fondo · T1 placa · T7 marco de placa (3,1:1) · T6 tope bajo texto · T9 cara del cartel · T13–T15 luz. Texto: `--ink`, `--lead`, `--muted`, `--accent-text`; acento `--accent`.
- **Celda** (una sola unidad de medida): 6×12 px por debajo de 900 px, 9×18 hasta 1599, 12×25 desde 1600 (`--cw`, `--ch`, enteros). El lienzo y el arte en DOM comparten la retícula, y el texto se coloca en **filas** de esa retícula.
- Espacio de 4 pt, radios ≤ 16 px (los rótulos, 2 px), z-index semántico (lienzo 0 · contenido 1 · cromo 40).

## Tipografía
**Bricolage Grotesque Variable** (todo el texto real) y **Geist Mono Variable** (arte, etiquetas de campo, fuente del dato), autoalojadas, 70 KB. `h1` `clamp(2.5rem, 1.15rem + 5.6vw, 5.5rem)`, `h2` hasta 3,75 rem, `h3` hasta 3,25 rem, cuerpo 1–1,125 rem a 1,55–1,6 de interlínea y ≤ 38 rem de medida, peso 800 en titulares, `letter-spacing` ≥ −0,04 em, romana, `text-wrap: balance`. Etiquetas de campo en mono 13–14 px, `--muted`, minúscula, sin corchetes. Nada de texto con degradado.

## Gramática de la página: «cara + sombra proyectada»
- **Rótulos (botones):** cara sólida con sombra en bloque; primario en `--accent`, secundario con línea. Al pasar el puntero se acercan a su sombra. Objetivo ≥ 48 px (≥ 44 en los móviles). Foco: 3 px `--accent-text`.
- **Placa:** superficie opaca (`--t1`, marco T7, sombra T2) para toda lectura larga; tapa al cartel como una cortina. Sin altura fija.
- **Pozo** (`data-well="ink|muted"`): el texto corto sobre arte; el motor limita el tono del arte bajo su rectángulo (T6 · T4).
- **Escenario:** la mitad de pantalla que se lee sobre el cartel; el texto empieza en una fila de la retícula y nunca cae sobre la palabra. En la portada el texto va anclado al fondo de la pantalla, con un **suelo** (`--floor`, en filas de la retícula) bajo la palabra, su aro y su sombra: en pantallas bajas la portada crece en vez de pisar la palabra (y el titular baja hasta ~50 px en portátiles de 650–900 px de alto). `scripts/home-check.mjs` lo comprueba en quince tamaños de pantalla.
- **Índice de servicios:** cuatro filas con regla, cada una con su palabra mini (6 filas), nombre, promesa, «Ver detalle» y WhatsApp. No es una cuadrícula de tarjetas.
- **Fichas de servicio:** no comparten plantilla; alternan el lado del texto y de la placa y el reparto interno. En móvil, «Más detalles» va plegado.
- **Ejemplos:** filas con emblema de sector, nombre, rubro, «Ver ejemplo» y «Quiero una así»; sello «Datos ficticios» junto al título y bajo cada emblema.
- **Proceso:** el hilo de HOLA a LISTO, arte en DOM con el `ol` real.
- **Menú:** píldora fija en escritorio; en móvil, barra inferior con WhatsApp dominante y un `popover` con los destinos. Logo provisional `▞ Gaya Digital`.

## Movimiento
Ignición de GAYA, marea entre carteles, llegada de cada escena, calor del puntero y anillos de toque: todo opcional, por tiempo y ≤ 2,4 s. La marea corre aunque el dedo se detenga. Reposo sin bucle. El estado estático es un fotograma del mismo motor (nunca una imagen aparte).

## Fuera
Cuadrículas de tarjetas idénticas, rótulos sobre cada sección, numeración visible de secciones, fondos de puntos, texto con degradado, vidrio esmerilado decorativo, marcos falsos de navegador o teléfono, cursivas en titulares, campos de glifos de línea o de letras, corchetes y árboles en la interfaz, verde de terminal, Faro a Colón y Obelisco.
