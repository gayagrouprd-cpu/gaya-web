# Instrumento · gaya.com.do como banco de instrumentos en modo texto

> Concepto de dirección creativa «El instrumento» para la página de inicio ES/EN de Gaya Digital.
> Fecha: 30-sep-2026 · Estado: propuesta para decidir · Autor: director creativo independiente (una de tres direcciones).
> Todas las piezas de arte de este documento están **generadas y comprobadas con código** (ancho constante por línea, solo glifos que Geist Mono trae) y las capturas de control se hicieron en Chrome con Geist Mono real. Los valores numéricos que aparecen dentro del arte (86 KB, 21:40, 34 días…) son **de maqueta**; en producción salen de las lecturas descritas en §6.5.
> Etiquetas de fiabilidad: **[V]** leído en fuente primaria en esta sesión · **[M]** medido/ejecutado por mí · **[C]** criterio propio · **[R0x]** heredado de los informes `docs/ascii/research/0x`.

---

## 0. Ficha de una pantalla

**Idea.** La página es un banco de instrumentos y **el primero que se lee es ella misma**. Cada cifra en pantalla es una lectura con procedencia; cada instrumento hace un trabajo (medir, contar, avisar, cambiar de mano) y por eso es legible de un vistazo. La información **es** el arte: reglas, medidores, trazas, lámparas, un interruptor, una placa de características, una carta de La Española, un faro.

**Lema de trabajo.** *Todo lo que se ve es un glifo; todo lo que se lee es texto real; ninguna cifra sin procedencia; el cero se dibuja vacío.*

**Por qué es arte y no disfraz** (prueba en cinco preguntas, §1.4): (1) cada glifo tiene una razón funcional; (2) sin JS ni movimiento la página sigue siendo hermosa (el póster es el mismo dibujo); (3) el contenido se lee sin el arte; (4) nada imita una terminal (ni prompt, ni cursor decorativo, ni verde, ni logs inventados); (5) otra agencia podría tomarla de referencia porque la regla que la gobierna es transferible: **procedencia + retícula**.

**Momento firma.** Al abrir, la página se **autoprueba** (≤ 2,6 s): las agujas barren su escala y se asientan; `peso` y `solicitudes` quedan con su valor real y **`cookies` y `terceros` quedan vacíos en 0**. Más abajo, en Soporte, **se va la luz de la página y la página sigue encendida**: el campo se apaga, el texto no, una lámpara pasa a «respaldo», el electrocardiograma no se detiene y a los pocos segundos vuelve todo. Es una broma que solo entiende quien vive en Santo Domingo, y por eso se cuenta.

**Cifras de control.**

| | |
|---|---|
| Altura de página | 9–10 pantallas (hoy 1) |
| Secciones | 9 (portada, quiénes somos, servicios con 4 fichas, referencias, proceso, contacto y cierre) |
| Instrumentos | 12: lecturas · cronómetro · carta · trazador · cuenta · piloto · sonar · tablero · muestrario · cinta · faro · regla de profundidad |
| Tipografía | 1 familia: **Geist Mono Variable** (OFL-1.1) |
| Retícula | celda 9×18 px (escritorio) / 6×12 px (móvil), enteros de píxel |
| Paleta | Cobalto, 16 tonos derivados de `--glow-0..3`; texto `--ink`/`--muted` |
| JS de ASCII | **≤ 28,5 KB gz** (18,5 de primera carga + 10 de escenas con `import()`) dentro del techo de 60 KB [C] |
| Terceros | 0 (CSP `default-src 'self'` intacta) |

**Decisiones que necesito del dueño** (detalle en §8): (1) ¿lecturas públicas «peso / solicitudes / cookies / terceros» sí o no?; (2) ¿el apagón como momento firma?; (3) ¿cuenta regresiva del e-CF (caduca el 15-nov)?; (4) ¿solo Geist Mono (sin Bricolage)?; (5) ¿mostrar la hora del visitante junto a la de Santo Domingo?; (6) las líneas `[CONFIRMAR]` de `04` que bloquean producción.

---

## 1. Concepto y reglas de oficio

### 1.1 Qué es un instrumento aquí

Un instrumento es una superficie con **una lectura** o **una función**, dibujada con una gramática fija y legible sin instrucciones. Cada lectura tiene **una de tres procedencias** y nada más:

| Código | Procedencia | Ejemplo en la página | Regla |
|---|---|---|---|
| **M** | Medida **ahora** en el navegador de quien mira | peso, solicitudes, cookies, terceros, hora, zona horaria del visitante | Si no se puede medir, se muestra el valor del build con la insignia `del build`; nunca un valor inventado |
| **C** | **Calculada** desde un hecho fechado con fuente | día y noche de Santo Domingo (NOAA), días que faltan para el e-CF | Cada hecho vive en `facts.ts` con `verified` y `recheck` (`04 §5.2`); pasado `recheck` +30 d, la build falla |
| **P** | **Publicada** por el dueño | «24–48 h» de propuesta, número de WhatsApp | Solo si `brand.json` la marca confirmada (`04 D13`) |

Corolario de honestidad: **el cero se dibuja vacío** (una pista limpia, sin barra): «terceros 0» es un medidor sin relleno. Y ninguna ilustración lleva cifras, ejes ni nombres de clientes (`05 §2.3`).

### 1.2 Software de información, no de interacción (Magic Ink)

Bret Victor sostiene que en el software de información lo primero es un gráfico que ya conoce su contexto y que la interacción es la fuente de contexto menos deseable, para cuando el entorno y la historia no bastan: **entorno → historia → interacción** [V: https://worrydream.com/MagicInk/]. Se aplica tal cual:

1. **Entorno** (cero clics): hora de Santo Domingo, día/noche, zona horaria del visitante, idioma, `prefers-reduced-motion`, `saveData`, ancho de pantalla, lo que la propia página pesó y pidió.
2. **Historia** (cero clics): cuántos días llevan del plazo del e-CF; qué preferencia `imagen | texto` eligió el visitante (localStorage, con `try/catch`).
3. **Interacción** (última): lupa del puntero, foco, `[ ES | EN ]`, `[ imagen | texto ]`, `[ Copiar correo ]`, WhatsApp.

Esto cumple por construcción la regla del dueño («la interfaz se explica sola»): no hay una sola frase que diga cómo usar nada; los instrumentos se entienden porque **muestran** su estado.

### 1.3 Lo que aprendí (con URLs verificadas hoy)

| Fuente | Lo que enseña | Cómo lo uso |
|---|---|---|
| Oxide × Pentagram, https://www.pentagram.com/work/oxide [V] | Un sistema de marca a partir de TUI/ASCII con **caracteres extendidos** para «ilustraciones en tiempo real» y patrones de rejilla que llegan hasta el metal | Confirma que el arte de caracteres puede ser sistema, no efecto. **Diferencia**: ellos, paleta saturada sobre negro con el verde como marca y un aire de terminal retro; yo, Cobalto, instrumentos y procedencia |
| Ratatui, widgets, https://ratatui.rs/showcase/widgets/ [V: lista Gauge, LineGauge, Sparkline, Table y Scrollbar]; `Gauge`, https://docs.rs/ratatui/latest/ratatui/widgets/struct.Gauge.html [V: `use_unicode` dibuja con bloques Unicode, «8 extra fractional parts per cell»]; `symbols/bar.rs`, https://raw.githubusercontent.com/ratatui/ratatui/main/ratatui-core/src/symbols/bar.rs [V: `▁▂▃▄▅▆▇█`] | Los widgets de información de una TUI moderna ya son instrumentos: el medidor rellena por octavos de celda y la barra usa los ocho niveles verticales. Qué widget usa qué juego de glifos fuera de estos dos casos es [C] | Mi vocabulario de instrumentos (§1.6) usa esos glifos (octavos horizontales `▏▎▍▌▋▊▉█` y verticales `▁▂▃▄▅▆▇█`), todos presentes en Geist Mono con `symbols2` |
| Tufte, sparkline, https://en.wikipedia.org/wiki/Sparkline [V] | «Gráficos pequeños, de alta resolución, embebidos entre palabras»; deben medir más o menos lo que el texto que los rodea | Las lecturas son del tamaño de una línea de texto; el ECG del Tablero es un sparkline |
| Teenage Engineering, ficha en https://design.withfudge.com/share/teenage.engineering-design [S] | Especificaciones en cuadrícula con líneas de 1 px, radio 0, cero sombras: el contraste viene del material, no del adorno | Radio 0 en todo; reglas de 1 px; ninguna sombra ni degradado |
| Magic Ink, https://worrydream.com/MagicInk/ [V] | Ver §1.2 | Columna vertebral de la interacción |
| MDN `PerformanceResourceTiming.transferSize`, `LargestContentfulPaint`, `LayoutShift` [V] | `transferSize` es 0 con caché o entre orígenes sin `Timing-Allow-Origin`; `encodedBodySize` sí existe; CLS suma `value` sin `hadRecentInput` | Diseño de las lecturas (§6.5) y su respaldo del build |
| NOAA GML, «General Solar Position Calculations», https://gml.noaa.gov/grad/solcalc/solareqns.PDF [V: coeficientes de `eqtime`, `decl`, ángulo horario con 90,833° y `sunrise = 720 − 4·(lon + ha) − eqtime`, idénticos a mi código]; la página https://gml.noaa.gov/grad/solcalc/calcdetails.html [V] solo indica que la calculadora se basa en Meeus, sin fórmulas | Posición solar y salida/puesta por fórmulas cerradas, sin red | Banda día/noche del cronómetro (§6.6). Comprobado: mi implementación da 06:29/18:30 el 30-sep-2026; https://www.sunrise-and-sunset.com/en/sun/dominican-republic/santo-domingo/2026/september da 06:31/18:28 (≤ 2 min) |
| Wikipedia «Santo Domingo» [V] | 18°27′45″ N 69°56′10″ O, UTC−4, fundada en 1496 | Coordenadas de la carta y de la esquina; **no** se publica dirección |
| Informes `01–06` de esta serie | Concepto «el agua hecha del nombre», un campo fijo, escenas puras, contraste por pozos, Geist Mono único, copy y hechos | Base; las desviaciones están en §6.11 |

`[S]` = ficha de un agregador de diseño (no la web primaria). Solo Oxide, Ratatui (showcase, `Gauge` y `bar.rs`), Magic Ink, MDN, NOAA (el PDF de fórmulas; la página `calcdetails` solo cita a Meeus) y Wikipedia se leyeron en primaria; Oxide, Ratatui, Magic Ink y NOAA se volvieron a abrir el 30-sep-2026 al cerrar este documento.

### 1.4 Antídoto contra la terminal de hacker

| No hacemos | Hacemos en su lugar |
|---|---|
| Prompt `$`, `>_`, cursor parpadeante decorativo | Cursor solo dentro del Trazador (es un lápiz de plotter que dibuja) |
| Verde fósforo, Matrix, katakana | Cobalto: azul eléctrico sobre azul noche; sin verde en ninguna parte |
| Ventana de terminal falsa, tres puntos de macOS, CRT, scanlines | Placas, reglas y marcos de instrumento; ninguna ventana |
| Logs y «estado del sistema» inventados | Lecturas reales (M/C/P) con insignia `en vivo` o `del build` |
| Texto que se «hackea» al azar (scramble) | Sin scramble; los medidores **barren** su escala (autotest) y las trazas se dibujan |
| Fuente bitmap retro | Geist Mono (limpia, contemporánea, OFL-1.1) |

**Prueba del disfraz** (para revisar cada pieza antes de aprobarla): ① ¿el glifo tiene función? ② ¿sobrevive en estático? ③ ¿se entiende el contenido sin el arte? ④ ¿ilustra un proceso real o mide algo real? ⑤ ¿alguien lo tomaría de referencia? Si una falla, se rehace.

### 1.5 «Toda la página es ASCII»: cobertura

| Superficie | Materia | Dónde vive |
|---|---|---|
| Fondo | Campo Marea en ` ·:=*yaAG▒▓█` (y, a, A, G = la marca) | Canvas fijo |
| Logotipo | «GAYA» en cuadrantes, trazo de plotter | DOM `data-art` (+ póster) |
| Títulos de sección | Fuente de píxel propia 5×7 en medios bloques, 4 filas | DOM `data-art`, `<h2>` real en `sr-only` |
| Marcos, reglas, marcas de registro, botones | `┌─┐ ╭╮╰╯ ╔═╗ ├┼┤ ▌▐` | DOM `data-art` y CSS |
| Medidores, trazas, lámparas, interruptor | Octavos `▏▎▍▌▋▊▉█`, `▁▂▃▄▅▆▇█`, `[█] [▒] [·]` | Ventanas de escena |
| Ilustración de cada servicio | Plano, chat, sonar, tablero | Ventanas de escena (canvas) |
| Miniaturas de referencias | Vector de forma horneado en el build | DOM `data-art` |
| Cierre | Faro y cruz de luz | Ventana de escena + campo |
| Texto real (h1–h3, p, li, a, dl) | **Geist Mono** en pantalla: sigue siendo carácter, no imagen | DOM |

Excepciones honestas: las **fotos reales** solo existen en el visor `/referencias/<slug>/` y en el «revelado» opcional de una fila del Muestrario (§4.4); son el trabajo que se vende.

### 1.6 Vocabulario de instrumentos (8 primitivas, todas con glifos de Geist Mono)

| Primitiva | Glifos | Usos |
|---|---|---|
| **Regla** | `┼ ┬ ┴ ├ ┤ ╷ ╵ ─ │ ━ ┫` | Retícula visible en el logotipo, regla de profundidad, cinta del Proceso, cronómetro |
| **Medidor** | `█` + octavos `▏▎▍▌▋▊▉` sobre pista `·` y muesca `╷` | Lecturas de la portada, cuenta del e-CF, batería |
| **Traza** | `▁▂▃▄▅▆▇█`, `─ ┴ ┬ │ ╷ ╵` | ECG del Tablero, barras del Sonar |
| **Lámpara** | `[█]` encendida · `[▒]` en revisión · `[·]` apagada | Tablero, lámpara de «publicado» |
| **Interruptor** | `AUTO ▐██▌░░░░ PERSONA` | Traspaso a una persona |
| **Marco** | `┌┐└┘` estándar · `╭╮╰╯` lectura · `╔╗╚╝` placa · `┏┓┗┛` acción principal | Todo |
| **Retícula/cruz** | `┼ ╷ ╵ ─` | Cruz de Santo Domingo, marcas de registro, mira de la lupa |
| **Ondas** | `) ) )`, `\ / ─` por tangente | Sonar, onda del toque, anillo de la lupa |

Glifos **prohibidos** (caen a otra fuente, `03`): `← → ■ □ ● ○ ◆ ▲ ▶ ✓ ★ ≈ ≠ ≤ ≥`, braille, emoji. Flechas: `»`, `->`, `↑ ↓`.

---

## 2. Sistema visual

### 2.1 Tipografía (exacta)

**Una sola familia: Geist Mono Variable** (`@fontsource-variable/geist-mono` 5.3.0, OFL-1.1, avance 0,600 em, sin ligaduras). Se cargan `latin` (23,1 KB) y `symbols2` (5,8 KB), precargados; se sirven con el proveedor `local` de dos variantes con `latin` primero para arreglar el fallback métrico (85,986 % → ≈100 %) `[R03 §2.2]`. `font-display: swap`. Se añade Geist Mono a `CREDITS.md`. **Bricolage Grotesque sale de esta página** (−68,6 KB y una familia menos).

| Rol | Tamaño | Peso | Interlínea | Notas |
|---|---:|---:|---:|---|
| `h1` (titular) | `clamp(2.5rem, 1.4rem + 3.4vw, 3.875rem)` = 40–62 px | 800 | 1,02 | `letter-spacing: -0.02em` **solo** aquí; medida 12–14 ch; palabra de acento en `--accent-text` |
| `h2` | arte (fuente 5×7, §2.2) + `sr-only` con tildes | — | — | Nunca texto solo |
| `h3` (servicio) | 29 px | 700 | 1,1 | Texto real, seleccionable |
| Lead | 22 px | 400 | 1,45 | `--lead`, ≤ 34 ch |
| Cuerpo | `clamp(16px, 15px + .25vw, 18px)` | 400 | 1,65 | ≤ 62 ch, párrafos ≤ 5 líneas, sin justificar |
| Valores de lectura | 22 px | 700 | 1 | Numerales tabulares (en mono son iguales) |
| Etiquetas de instrumento | 13 px | 500 | 1,3 | minúscula, `--muted`; sin mayúsculas ni tracking |
| Arte (celda) | 10 / 15 / 20 px | 400 (300 desde 14 px en líneas) | `--ch` | ver §2.2 |

Escala de texto: **13 · 17 · 22 · 29 · 40–62** (razón ≈ 1,3). Los tamaños del arte son aparte y **siempre múltiplos de 5 px** (10, 15, 20).

### 2.2 Retícula (la «rejilla es el instrumento»)

Toda pieza de arte vive en una **celda de píxeles enteros con proporción 1:2**:

```css
:root { --fs-art: 10px; }
@media (min-width: 48rem)  { :root { --fs-art: 15px; } }
@media (min-width: 120rem) { :root { --fs-art: 20px; } }
:root {
  --cw: calc(0.6 * var(--fs-art));                              /* avance de Geist Mono: 6 · 9 · 12 px */
  --ch: calc(round(down, 1.3 * var(--fs-art), 1px) - 1px);      /* paso de arte de 03: 12 · 18 · 25 px */
}
.art { font: 400 var(--fs-art)/var(--ch) var(--font-mono); font-variant-ligatures: none; font-kerning: none;
       letter-spacing: 0; white-space: pre; user-select: none; text-rendering: optimizeSpeed; padding-block: .05em; overflow: clip; }
.art::before { content: attr(data-art); }                       /* el arte no está en el DOM ni en el árbol de accesibilidad */
```

| Retícula | Celda | Columnas útiles | Uso |
|---|---|---|---|
| **L10** | 6×12 | 57–59 (móvil de 375–390 px) | móvil |
| **L15** | 9×18 | 78 (768 px) · 104 (1024) · 135 (76 rem) · 160 (lienzo a 1440) | escritorio |
| **L20** | 12×25 | 160 (lienzo a 1920) | pantallas ≥ 120 rem, o cuando el tier baja de presupuesto |

`round(down, 1.3em, 1px) − 1px` es la receta medida como robusta a cualquier DPR en `03 §1.4`. Con L10, L15 y L20 el paso queda en 12, 18 y 25 px. Las celdas del canvas (§6.1) usan **la misma celda**, así marcos DOM y arte del canvas comparten retícula.

**Ritmo vertical.** Todo espaciado entre bloques es múltiplo de `--ch` (1 fila = la unidad). Las secciones llevan 4–6 filas de relleno; entre elementos, 1–2. El texto real no se alinea a filas (interlínea 1,65), pero **las cajas** sí: cada marco mide un número entero de filas y columnas (`round(down, 100%, 1ch)` de `03`).

**Títulos de sección: fuente de píxel propia «Retícula 5×7»**, dibujada a mano (26 letras + dígitos, sin licencia ajena), renderizada en **medios bloques** (píxel ≈ 0,6 em × 0,65 em: casi cuadrado), 4 filas de alto, 6 columnas por letra. El texto del arte no lleva tildes (`QUIENES SOMOS`) y el `<h2>` real (con tildes) va en `sr-only`. En móvil se parte por palabras.

```text
▄▀▀▀▄ █   █ ▀▀█▀▀ █▀▀▀▀ █▄  █ █▀▀▀▀ ▄▀▀▀▀    ▄▀▀▀▀ ▄▀▀▀▄ █▄ ▄█ ▄▀▀▀▄ ▄▀▀▀▀
█   █ █   █   █   █▄▄▄  █ ▀▄█ █▄▄▄  ▀▄▄▄     ▀▄▄▄  █   █ █ █ █ █   █ ▀▄▄▄
█ ▀▄▀ █   █   █   █     █   █ █         █        █ █   █ █   █ █   █     █
 ▀▀ ▀  ▀▀▀  ▀▀▀▀▀ ▀▀▀▀▀ ▀   ▀ ▀▀▀▀▀ ▀▀▀▀     ▀▀▀▀   ▀▀▀  ▀   ▀  ▀▀▀  ▀▀▀▀
```
```text
▄▀▀▀▀ █▀▀▀▀ █▀▀▀▄ █   █ ▀▀█▀▀ ▄▀▀▀▀ ▀▀█▀▀ ▄▀▀▀▄ ▄▀▀▀▀
▀▄▄▄  █▄▄▄  █▄▄▄▀ █   █   █   █       █   █   █ ▀▄▄▄
    █ █     █ ▀▄  ▀▄ ▄▀   █   █       █   █   █     █
▀▀▀▀  ▀▀▀▀▀ ▀   ▀   ▀   ▀▀▀▀▀  ▀▀▀▀ ▀▀▀▀▀  ▀▀▀  ▀▀▀▀
```
```text
█▀▀▀▄ █▀▀▀▀ █▀▀▀▀ █▀▀▀▀ █▀▀▀▄ █▀▀▀▀ █▄  █ ▄▀▀▀▀ ▀▀█▀▀ ▄▀▀▀▄ ▄▀▀▀▀
█▄▄▄▀ █▄▄▄  █▄▄▄  █▄▄▄  █▄▄▄▀ █▄▄▄  █ ▀▄█ █       █   █▄▄▄█ ▀▄▄▄
█ ▀▄  █     █     █     █ ▀▄  █     █   █ █       █   █   █     █
▀   ▀ ▀▀▀▀▀ ▀     ▀▀▀▀▀ ▀   ▀ ▀▀▀▀▀ ▀   ▀  ▀▀▀▀ ▀▀▀▀▀ ▀   ▀ ▀▀▀▀
```
```text
█▀▀▀▄ █▀▀▀▄ ▄▀▀▀▄ ▄▀▀▀▀ █▀▀▀▀ ▄▀▀▀▀ ▄▀▀▀▄
█▄▄▄▀ █▄▄▄▀ █   █ █     █▄▄▄  ▀▄▄▄  █   █
█     █ ▀▄  █   █ █     █         █ █   █
▀     ▀   ▀  ▀▀▀   ▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀   ▀▀▀
```
```text
▄▀▀▀▀ ▄▀▀▀▄ █▄  █ ▀▀█▀▀ ▄▀▀▀▄ ▄▀▀▀▀ ▀▀█▀▀ ▄▀▀▀▄
█     █   █ █ ▀▄█   █   █▄▄▄█ █       █   █   █
█     █   █ █   █   █   █   █ █       █   █   █
 ▀▀▀▀  ▀▀▀  ▀   ▀   ▀   ▀   ▀  ▀▀▀▀   ▀    ▀▀▀
```

Anchos en escritorio **[M]** (5×7, a 15 px = 9 px por columna): `QUIENES SOMOS` 74 columnas = 666 px · `REFERENCIAS` 65 = 585 px · `SERVICIOS` 53 = 477 px · `CONTACTO` 47 = 423 px · `PROCESO` 41 = 369 px (EN: `WHO WE ARE` 53 · `REFERENCES` 59 · `SERVICES` 47 · `PROCESS` 41 · `CONTACT` 41).

**Móvil: variante estrecha 4×7** (ancho variable; `I` y `T` de 3 columnas, `M` y `W` de 5). Con 5×7 a 10 px `REFERENCIAS` mide 390 px y no cabe en 343; con la estrecha mide **53 columnas = 318 px** y cabe. `QUIENES SOMOS` se parte por palabras (33 y 25 columnas); `SERVICIOS` 42, `CONTACTO` 37, `PROCESO` 34 (EN: `WHO WE ARE` 47, `REFERENCES` 49, `SERVICES` 38, `PROCESS` 34, `CONTACT` 32). Las 17 letras que hacen falta para los diez títulos son A C E F H I M N O P Q R S T U V W.

```text
█▀▀▄ █▀▀▀ █▀▀▀ █▀▀▀ █▀▀▄ █▀▀▀ █▄ █ ▄▀▀▀ ▀█▀ ▄▀▀▄ ▄▀▀▀
█▄▄▀ █▄▄  █▄▄  █▄▄  █▄▄▀ █▄▄  █▀▄█ █     █  █▄▄█ ▀▄▄ 
█ ▀▄ █    █    █    █ ▀▄ █    █ ▀█ █     █  █  █    █
▀  ▀ ▀▀▀▀ ▀    ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀  ▀  ▀▀▀ ▀▀▀ ▀  ▀ ▀▀▀ 
```
```text
▄▀▀▄ █  █ ▀█▀ █▀▀▀ █▄ █ █▀▀▀ ▄▀▀▀
█  █ █  █  █  █▄▄  █▀▄█ █▄▄  ▀▄▄ 
█ ▀█ █  █  █  █    █ ▀█ █       █
 ▀▀▀  ▀▀  ▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀▀▀ 
                                 
▄▀▀▀ ▄▀▀▄ █▄ ▄█ ▄▀▀▄ ▄▀▀▀        
▀▄▄  █  █ █ █ █ █  █ ▀▄▄         
   █ █  █ █   █ █  █    █        
▀▀▀   ▀▀  ▀   ▀  ▀▀  ▀▀▀         
```

**Logotipo «GAYA»: trazo de plotter.** Cuatro letras construidas con **segmentos y arcos** (no una fuente): G = arco de 308° + barra; A = dos diagonales + travesaño; Y = dos diagonales + fuste. Se rasteriza a **cuadrantes** `▘▝▖▗▀▄▌▐▚▞▛▜▙▟█`, con luz de borde (la celda con vacío encima va un tono más claro). Sin licencia, reproducible (`scripts/wordmark.mjs`), y es la firma del concepto: **la letra es un trazo, no un relleno**, así que el mismo trazado se puede animar con la cabeza del plotter.

```text
      ▄▟██████████▄▄                   ▗███▖              ███▄                 ▟███              ▟██▙
   ▗▟███▛▀▀▀▀▀▀▀▀████▄                ▗█████▖             ▝▜███▄             ▄███▀              ▟████▙
  ▟███▀           ▝▜███              ▗███▀███▖              ▝▜██▙▖         ▄███▛▘              ▟██▛▜██▙
 ▟██▛               ▝▀▘             ▗███▘ ▝███▖               ▝▜██▙▖     ▗███▛▘               ▗██▛  ▜██▙
▐██▛                               ▗███▘   ▝███▖                ▀███▙▖ ▗▟██▛▘                ▗███    ▜██▙
▟██▌        ▄▄▄▄▄▄▄▄▄▄▄▄▄         ▗███▘     ▝███▖                 ▀███████▀                 ▗███▘     ▜██▙
▜██▌       ▝█████████████▘       ▗███▘       ▝███▖                  ▀███▀                  ▗███▘       ▜██▙
▐██▙                 ▗███       ▗███▙▄▄▄▄▄▄▄▄▄▟███▖                  ███                  ▗███▙▄▄▄▄▄▄▄▄▄███▙
 ▜██▙               ▗███▘       ▟██████████████████▖                 ███                 ▗██████████████████▙
  ▜███▄           ▗▟███▘       ▟██▛             ▝███▖                ███                ▗███▘             ▜██▙
   ▝▜███▙▄▄▄▄▄▄▄▄████▀        ▟██▛               ▝███▖               ███               ▗███▘               ▜██▙
      ▀▜██████████▀▀         ▟██▛                 ▝███               ███              ▗███▘                 ▜██▙
```

Variantes: **112×12** (≥ 1100 px, 1008 px de ancho a 15 px) · **84×9** (768–1100 px, 756 px) · **54×7 condensada (lw 0,8)** (móvil a 10 px = 324 px). El lockup «DIGITAL» **no** se dibuja en grande (en una línea pide 370 columnas): va como `<span>` de texto «Digital» junto a la marca de la esquina superior.

```text
 ▗▟██████▙▖       ▗██▖      ██▄      ▄██      ▗██▖
▗██▀    ▀██      ▗████▖      ▜█▙▖  ▗▟█▛      ▗████▖
██▘              ▟█▘▝█▙       ▝██▄▄██▘       ▟█▘▝█▙
██   ▟██████    ▟█▛  ▜█▙        ▜██▛        ▟█▛  ▜█▙
██▖   ▀▀▀▜██   ▗██▄▄▄▄██▖        ██        ▗██▄▄▄▄██▖
▝██▄    ▄██▘  ▗██▀▀▀▀▀▀██▖       ██       ▗██▀▀▀▀▀▀██▖
 ▝▜██████▛▘   ██▘      ▝██       ██       ██▘      ▝██
```

### 2.3 Paleta Cobalto: 16 tonos y su papel

Los 16 tonos salen de interpolar en OKLCH `--glow-0..3` (`05 §2.1`; hex idénticos a `oklchToHex`). Contrastes calculados con `src/lib/color.mjs` **[M]**:

| Tono | Hex | L (OKLab) | `--ink` sobre él | `--muted` sobre él | Él sobre `--surface` | Papel |
|---|---|---:|---:|---:|---:|---|
| T0 | `#02051b` | 0,129 | 17,9 | 9,8 | 1,00 | **Papel** (`--surface`) |
| T1 | `#040c34` | 0,181 | 16,9 | 9,2 | 1,06 | **Placa** (fondo bajo el texto; ≈ `--surface-2` `#070f2c`) |
| T2 | `#07134f` | 0,229 | 15,4 | 8,4 | 1,17 | Susurro (campo dentro de pozos) |
| T3 | `#0b1b6c` | 0,280 | 13,5 | 7,3 | 1,33 | Tope del campo en pozos |
| T4 | `#0f238a` | 0,329 | 11,5 | 6,2 | 1,56 | Campo tenue, reglas base |
| T5 | `#122caa` | 0,381 | 9,5 | **5,2** | 1,89 | **Límite bajo `--muted`** |
| T6 | `#143fbf` | 0,435 | 7,5 | 4,1 | 2,40 | Campo activo, trazo |
| T7 | `#1753d4` | 0,492 | **5,8** | 3,2 | **3,10** | **Límite bajo `--ink`**; marco (≥ 3:1) |
| T8 | `#1c66ea` | 0,549 | 4,5 | 2,5 | 3,98 | Cuerpo de figura (**nunca bajo texto**) |
| T9 | `#2479fd` | 0,604 | 3,6 | 1,9 | 5,03 | Vivo secundario, muesca |
| T10 | `#4490fe` | 0,661 | 2,8 | 1,5 | 6,41 | Barras, agujas |
| T11 | `#54a7fd` | 0,715 | 2,2 | 1,2 | 8,00 | Relleno de medidor |
| T12 | `#6bbdfe` | 0,772 | 1,8 | 1,0 | 9,94 | Valor gráfico, luz de borde |
| T13–T14 | `#8bd0fd` `#ace2fe` | 0,83–0,89 | 1,2–1,5 | — | 12–14 | Halos |
| T15 | `#d1f1ff` | 0,939 | 1,05 | — | 17,05 | **Chispa** (≤ 2 % de celdas) |

Texto real: `--ink` `#edf2f8` (17,9:1 sobre papel; 16,8:1 sobre `--surface-2`), `--muted` `#a4b6ce` (9,8:1), `--accent-text` `#95c9ff` (11,6:1), botón principal `--accent` `#487bff` con `--on-accent` (5,34:1). **Un solo acento**, ≤ 5 % del área. **Sin degradado en texto** (`DESIGN.md` lo prohíbe): el logotipo se ilumina por **filas de tono** (borde claro / cuerpo), no con `background-clip`.

Reglas de tono: **bajo `--ink`, glifo ≤ T7 · bajo `--muted`, ≤ T5 · T8–T15 jamás bajo texto**. Presupuesto del campo **[M]** (160×50, `t = 21,7`): 55,9 % de celdas no vacías, de las cuales el 61 % son `·` o `:` (T3–T4); `▒▓█` 0,16 % (techo 1,5 %); chispa (T15) ≤ 0,5 %; dentro de los pozos solo `·` y `:` en T2–T3. Pares nuevos para `tokens.json` y `npm run contrast`: `ink/T7 ≥ 5,5`, `muted/T5 ≥ 5`, `ink/surface2 ≥ 16`, `accentText/surface2 ≥ 10`, `T7/surface ≥ 3` (marco).

### 2.4 Legibilidad del texto real

1. **Pozos de lectura** (`data-well`): rectángulo del bloque de texto + 2 celdas de fundido; el motor topa el campo a T3 y solo `·:` (contraste por construcción, `06 §4.4`, `02 §2.6`: sin tope el peor píxel da 3,3:1).
2. **Placas**: bajo cada bloque largo, celdas de fondo T1 dibujadas por el propio canvas; en sin-JS, `--surface-2` plano.
3. **Medida y ritmo**: 62 ch máximo, párrafos ≤ 5 líneas, listas cuando hay ≥ 3 elementos; sin justificar; `text-wrap: pretty` en párrafos y `balance` en titulares.
4. **Enlaces** en `--accent-text` con subrayado de 1 px (no solo color); foco `outline: 3px solid var(--accent-text)` con 3 px de separación, esquinas rectas.
5. **Zoom y reflow** (1.4.4, 1.4.10, 1.4.12): las ventanas de escena se re-miden con `ResizeObserver`; no recortan texto real; a 320 px el mínimo es L10 con 48 columnas (288 px).
6. `forced-colors: active`: se oculta el canvas y el arte pasa a `CanvasText`; los botones ganan borde real de 1 px. `prefers-contrast: more`: arte en `--ink` y peso +100. `print`: fondo blanco, arte negro a 7 pt, sin canvas.

### 2.5 Leyes de movimiento (7)

1. **Encendido único** ≤ 2,6 s al cargar (`hero.ts`: `INTRO_SECONDS 2.6`). Después, **nada se mueve solo** (evita 2.2.2 sin botón, `06 D10`): las trazas (ECG, sonar, barras) avanzan con el scroll, no con el reloj; el único texto que cambia solo es el minuto del cronómetro.
2. **El scroll es el reloj**: cada escena es una función pura de `u` (progreso de su sección); avanzar y retroceder es gratis y reversible (modo «scrub» de `05 §3.7`).
3. **Sueño real**: el bucle se duerme a 1,6 s sin entrada; tope de 30 fps con acumulador; pausa con pestaña oculta o menú abierto.
4. **Curvas expo-out**, nunca rebote (`DESIGN.md`); las agujas no sobrepasan.
5. **Un solo cambio brusco por escena** (el apagón, el traspaso, el destello de «publicado»): nunca oscilaciones; ≤ 2 Hz en cualquier área (2.3.1).
6. **`prefers-reduced-motion` y `saveData`**: un cuadro por escena en su estado final (`scene.settle`), agujas ya asentadas, sin lupa, sin estela, sin revelados.
7. **`?still` y `?still&scene=<id>`** congelan el motor para capturas y regresión visual.

### 2.6 Navegación

**Cuatro esquinas fijas** (`01 #23`, patrón Dragonfly) más una **regla de profundidad** en el borde derecho:

| Esquina | Contenido | Estado |
|---|---|---|
| Arriba-izquierda | `GAYA DIGITAL` (enlace a inicio) | 15 px, 700 |
| Arriba-derecha | `Nosotros · Servicios · Referencias · Proceso · Contacto` | escritorio; en móvil `[ Menú ]` (pantalla completa) |
| Abajo-izquierda | `[ ES \| EN ]` + `SD 21:40` (lectura M) | el idioma activo en `--ink`, el otro en `--muted` |
| Abajo-derecha | `▌ WhatsApp ▐` | siempre visible; foco ≥ 44 px |

**Regla de profundidad** (escritorio ≥ 68 rem): columna de 16 celdas con una marca por sección (`┫` mayor, `┤` menor) y un marcador `██` que baja con el scroll. Cada marca es un **enlace real** dentro de `<nav aria-label>`; la sección activa lleva `aria-current="location"` (scroll-spy con `IntersectionObserver`, `rootMargin: -45% 0 -50% 0`, sin `history`).

```text
      inicio ━┫ 
              │ 
              │ 
              ┤ 
              │ 
    nosotros ━┫ 
              ┤ 
              │ 
              │ 
              ┤ 
   servicios ━┫ 
              │ 
              █ 
              █ 
              │ 
              ┤ 
              │ 
              │ 
              ┤ 
              │ 
              │ 
              ┤ 
 referencias ━┫ 
              │ 
              ┤ 
              │ 
              │ 
     proceso ━┫ 
              │ 
              │ 
              ┤ 
              │ 
              │ 
    contacto ━┫ 
              │ 
              │ 
```

**Móvil**: barra inferior fija, con el botón de WhatsApp dominante; **se oculta mientras el CTA de la portada está a la vista** (un IO) para no duplicar la acción en la primera pantalla.

```text
──────────────────────────────────────────────────────────
 [ Menú ]  ████████▍·····│·····│·····│···   ▌ WhatsApp ▐  
```

**Ids por idioma**: `#inicio/#home`, `#nosotros/#about`, `#servicios/#services`, `#web/#web`, `#automatizacion/#automation`, `#marketing/#marketing`, `#soporte/#it`, `#referencias/#references`, `#proceso/#process`, `#contacto/#contact`; `READY.services/process/contact = true` al construirlas; `scroll-padding-top` para las esquinas; `scroll-behavior: smooth` solo con `no-preference`.

**Transición entre páginas** (`@view-transition` nativo, `06 D9`): la regla y las esquinas llevan `view-transition-name` con grupos sin animación; el campo cruza en 240 ms.

**Costura entre secciones**: es una **regla** de una fila de `─┼┴` (retícula visible) en el borde real de cada `<section>`, con una banda de 4 filas de «pliegue de luz» que sigue el scroll (`06 §4.3`). La costura es el corte de plano de un dibujo técnico.

---

## 3. Arquitectura de la página

| # | Sección (`id` ES / EN) | Alto | Instrumento (nombre interno; **no se rotula en pantalla**) | Modo del campo | Lectura o función | Interacción |
|---|---|---:|---|---|---|---|
| 1 | Portada (`inicio` / `home`) | 100 svh | **Marea y lecturas** | Marea viva + lupa | peso · solicitudes · cookies · terceros (M) | lupa, toque, foco |
| 2 | Quiénes somos (`nosotros` / `about`) | 130 svh | **Placa y carta** | Marea baja, lenta | hora SD (M), día/noche (C), zona del visitante (M) | — |
| 3 | Servicios (`servicios` / `services`) | 70 svh + 4 × 110 svh | **Índice** (4 filas) + 4 fichas | cambia por ficha | ver 3a–3d | `[ WhatsApp ]` por servicio |
| 3a | Web y apps (`web`) | 110 svh | **Trazador** + **Cuenta** | retícula que aparece | días al 15-nov (C) | — |
| 3b | Automatización e IA (`automatizacion` / `automation`) | 110 svh | **Piloto** | filamentos que se enderezan | estado AUTO/PERSONA | — |
| 3c | Marketing y redes (`marketing`) | 110 svh | **Sonar** | anillos concéntricos | (sin cifras) | — |
| 3d | Soporte e IT (`soporte` / `it`) | 120 svh | **Tablero** | ortogonal, con apagón | lámparas + ECG | — |
| 4 | Referencias (`referencias` / `references`) | 100 svh | **Muestrario** | calmo | `n referencias` (M sobre datos) | `[ imagen \| texto ]`, `[ Abrir ]` |
| 5 | Proceso (`proceso` / `process`) | 80 svh | **Cinta** | una sola línea | «24–48 h» (P) | — |
| 6 | Contacto y cierre (`contacto` / `contact`) | 110 svh | **Faro** | el más brillante de la página | — | copiar correo, WhatsApp |

Total ≈ 9,7 pantallas. Regla de ritmo: alternar bloques densos de texto con **tramos de aire** de solo arte (≤ 70 svh cada uno, ≤ 25 % del total; `06 §3.3`). Sin numeración de secciones ni rótulos sobre cada sección (`PRODUCT.md`); el **Proceso** es la única secuencia realmente ordinal y por eso lleva `01–04`.

Plano de la portada de escritorio (1440×900 = 160×50 celdas, a escala 1:1,6):

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GAYA DIGITAL                            Referencias  Servicios  Proceso  Contacto     [ ES | EN ]  │
│                                                                                                    │
│    ┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼                       │
│    ┌──────────────────────────────────────────────────────────────────────┐                        │
│    │                                                                      │                      █ │
│    │                                                                      │                      │ │
│    │  GAYA  ·  trazo de plotter, cuadrantes, 112×12 celdas                │                      │ │
│    │                                                                      │                      │ │
│    │                                                                      │                      ┤ │
│    │                                                                      │                      │ │
│    └──────────────────────────────────────────────────────────────────────┘                      │ │
│    ┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼                     │ │
│                                                                                                  │ │
│   ┌──────────────────────────────────────┐              ╭─ esta página ───────────── en vivo ╮   ┤ │
│   │ pozo de lectura (campo hasta T3)     │              │                                    │   │ │
│   │                                      │              │  peso        ██████·········       │   │ │
│   │  Tu negocio,                         │              │                                    │   │ │
│   │  imposible de                        │              │  solicitudes ██████·········       │   │ │
│   │  ignorar                             │              │                                    │   │ │
│   │                                      │              │  cookies     ···············       │   ┤ │
│   │                                      │              │                                    │   │ │
│   │  Web, apps, marketing, soporte IT e IA.             │  terceros    ···············       │   │ │
│   │  Desde Santo Domingo para el mundo.  │              │                                    │   │ │
│   │                                      │              ╰────────────────────────────────────╯   │ │
│   │                                      │                                                       │ │
│   │  ▌ Escribir por WhatsApp ▐  [ Ver referencias ]                                              ┤ │
│   │                                      │                                                       │ │
│   └──────────────────────────────────────┘      campo Marea (fijo, 100lvh)                       │ │
│                                                 lente = lupa de cuadrantes                         │
│                                                                                                    │
│ SD 21:40                                                                          [ WhatsApp ]     │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Sección por sección

Convención de cada ficha: **Instrumento** (nombre interno) · **Arte** (qué se dibuja, técnica, movimiento, móvil, movimiento reducido) · **Contenido** (texto real y orden en el DOM) · **Interacción** · **Lecturas** (procedencia). Todo lo dibujado es `aria-hidden`; todo lo que se lee es HTML real.

> **Nota sobre las maquetas de este documento.** Para que se vea la composición, el texto (etiquetas, valores, rótulos de la cinta, filas de la placa) aparece *dentro* del arte. En producción **el arte dibuja solo marcos, pistas y figuras** y el texto es DOM real superpuesto (capa `.frame` de `03 §2.4`); así se copia, se busca, se traduce y se lee con lector de pantalla. Las únicas frases que viven dentro del arte son las del chat del Piloto (ilustración `aria-hidden`, sin cifras, con su equivalente en «Resultado»). Los números de las maquetas son de ejemplo.

### 4.1 Portada · «Marea y lecturas»

**Arte.**

- **Qué se dibuja.** ① El **campo Marea**: filamentos de luz en ` ·:=*yaAG▒▓█` (la marca, «y a A G», es el alfabeto del agua). ② El **logotipo GAYA** en cuadrantes (112×12 celdas), encuadrado por una regla superior y otra inferior con **marcas de registro** (`┼` cada 32 celdas, `┬┴` cada 8): la retícula se hace visible. ③ El marco de **lecturas** `╭─ esta página ── en vivo ─╮` con cuatro pistas. ④ Una regla de página inferior con `┼┴` cada 8 celdas.
- **Técnica.** *Póster SSR*: `<pre aria-hidden="true" data-nosnippet>` generado en el build con la misma `marea()` (§6.3) a `t = 21,7` (el `STILL_TIME` de `hero.ts`) + logotipo + reglas + marco (≈ 3,3 KB brotli, §6.4); el LCP es el `h1`. *Motor vivo* tras `load`/idle: un canvas fijo (§6.1). *Lupa*: círculo de 9 celdas visuales; dentro se muestrea el campo a 2×2 por celda y se dibuja con cuadrantes (doble resolución) +3 tonos; el borde se dibuja con los glifos de anillo del Sonar (§4.3c).
- **Movimiento.** Encendido único de 2,6 s, tres pistas: **0–0,9 s** ignición del campo desde el punto de reposo de la lente (x 0,74 · y 0,60, como `REST` de `hero.ts`) hacia afuera con `ignite = smoothstep(0, 1, intro·1,75 − r·0,85)`; **0,4–1,6 s** las reglas y marcas de registro se trazan con cabeza `┼` y cola; **1,2–2,4 s** **autotest**: cada aguja sube al fondo de escala (expo-out 0,5 s) y baja a su valor real (0,6 s), escalonadas 0,15 s; `cookies` y `terceros` suben a ~40 % y vuelven a 0. Luego **reposo: 0 fps**. Puntero (ratón): la lupa sigue con resorte `k = 1 − e^(−dt·4)` (9 al arrastrar), vuelve al reposo a los 1,8 s y **rodea el texto** (`repel` de `hero.ts`); estela gaussiana de τ 0,45 s. Toque: onda `) ) )` de 1,2 s (≤ 3). Scroll: `t += dt·(0,1 + 0,85·energía)`.
- **Móvil.** L10; logotipo 54×7 condensado; tier `low` (4 800 celdas; 65×70 = 4 550); **sin lupa de puntero**, con onda al toque; lecturas en dos líneas (etiqueta y valor arriba, pista de ancho completo debajo); la barra inferior aparece cuando el CTA sale de la pantalla.
- **Movimiento reducido / `saveData`.** Se queda el póster; agujas en su valor final; sin lupa ni estela ni ignición.

```text
╭─ esta página ──────────────────────────────────── en vivo ─╮
│                                                            │
│                              ╷                             │
│  peso         86 KB   █████████▊························   │
│                                                            │
│                                              ╷             │
│  solicitudes      9   ██████████▎·······················   │
│                                                            │
│                                              ╷             │
│  cookies          0   ··································   │
│                                                            │
│                                              ╷             │
│  terceros         0   ··································   │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
```text
╭─ esta página ───────────────────────────────── en vivo ─╮
│                                                         │
│  peso       ╷                                    86 KB  │
│  ███████████████▎·····································  │
│                                                         │
│  solicitudes                        ╷                9  │
│  ███████████████▉·····································  │
│                                                         │
│  cookies                            ╷                0  │
│  ·····················································  │
│                                                         │
│  terceros                           ╷                0  │
│  ·····················································  │
│                                                         │
│                                                         │
╰─────────────────────────────────────────────────────────╯
```

**Contenido (orden en el DOM).** `header` (marca + navegación) → `h1` con el copy vigente («Tu negocio, imposible de ignorar» / «Your business, impossible to ignore»; la palabra de acento sigue siendo *imposible*/*impossible*) → lead vigente («Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo.») → acciones: `Escribir por WhatsApp` (primaria, `data-cta="primary"`, mensaje genérico de `brand.json`) y `[ Ver referencias ]` (solo si `READY.refs`) → `dl.lecturas` (peso, solicitudes, cookies, terceros). El `h1` **no se anima ni se oculta al cargar** (se retira `@keyframes rise` de `Hero.astro`; `06 D23`). Sin `HeroCards`: las tarjetas flotantes salen; el Muestrario (§4.4) las sustituye.
**Interacción.** Lupa, onda, foco (pulso en el campo). Cero texto instructivo.
**Lecturas.** Tabla en §6.5. Además, en las esquinas: `SD 21:40` (M) y `18,46° N · 69,94° O` (C, Wikipedia).

### 4.2 Quiénes somos · «Placa y carta»

**Arte.**

- **Qué se dibuja.** La **placa de características** (doble marco `╔═╗`, cuatro tornillos `+`) con siete filas `clave · valor`; bajo una regla `╟──╢`, el **cronómetro**: cinta de 24 h a 2 celdas por hora (`▓` noche, `░` día), regla `┼─┬` con `0 6 12 18 24`, flecha `↓` en la hora actual. Junto a ella, la **carta**: La Española en cuadrantes, marco graduado (`┬┴├┤` cada 8 columnas y 4 filas) y una cruz `┼` en Santo Domingo.
- **Técnica.** Placa y carta como `data-art` estático (SSR). El cronómetro se escribe en el cliente (una cadena de 48 caracteres, reescrita 1 vez por minuto). La silueta se **hornea en el build desde Natural Earth 1:10m (dominio público)**; la de este documento es aproximada y está hecha a mano.
- **Movimiento (scrub).** Al entrar, la cruz se traza (cabeza + cola, 0,5 s) y la banda se llena hasta la hora actual; nada más se anima. Campo: «marea baja» (lenta, poca densidad; `06 §3.3`).
- **Móvil.** Placa a ancho completo con `dl` apilado (clave arriba, valor abajo); cronómetro a ancho completo (48 × 6 = 288 px); carta de 44 columnas.
- **Reducido.** Cruz y banda ya dibujadas.

```text
╔════════════════════════════════════════════════════════════════╗
║ +                                                            + ║
║    marca       Gaya Digital                                    ║
║    director    Giancarlo González                              ║
║    origen      Santo Domingo, República Dominicana             ║
║    idiomas     Español · English                               ║
║    canal       WhatsApp +1 849-925-4426                        ║
║    propuesta   por escrito en 24–48 h                          ║
║    accesos     tuyos desde el día uno                          ║
║                                                                ║
╟────────────────────────────────────────────────────────────────╢
║                                                                ║
║    Santo Domingo · UTC−4                            21:40      ║
║                                               ↓                ║
║    ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓            ║
║    ┼───┬───┬───┼───┬───┬───┼───┬───┬───┼───┬───┬───┼           ║
║    0           6           12          18         24           ║
║                                                                ║
║ +                                                            + ║
╚════════════════════════════════════════════════════════════════╝
```
```text
┌───────┬───────┬───────┬───────┬───────┬───────┬───────┬────────┐
│                                                                │
│                                                                │
│             ▗▄▄▟██▙▄▄▄▖   ▗▄▄▄▟█████▄▄                         │
├              ▀▀▀███████████████████████████▄▄▖                 ┤
│                   ▀███████████████████████████▙▖               │
│                    █████████████████████████████▀▀▀▀▘          │
│                    ▜█████████████████████████████▄▄▄▄          │
├                    ▝███████████████████████████████████▄▖      ┤
│      ▄▄▄▄            ▜███████████████████████╵████████████▙▄   │
│    ▟█████████▄▄▄▄▄▄▟██████████████████████──▀┼▀──▀▀▀▀▀▀▜▀▀▀    │
│       ▝▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜███████████▛▀▀▀▀▀▀▀▀▘  ╷                 │
├                         ▀▀▀▜████▛                              ┤
│                             ▜██▛        Santo Domingo          │
│                              ▝▀                                │
│                                                                │
│                                                                │
└───────┴───────┴───────┴───────┴───────┴───────┴───────┴────────┘
```

**Contenido.** `h2` (arte `QUIENES SOMOS` + `sr-only`) → `dl` con las siete filas de `04 §3`: **marca** Gaya Digital · **director** Giancarlo González · **origen** Santo Domingo, República Dominicana · trabajo remoto · **idiomas** Español · English · **canal** WhatsApp +1 849-925-4426 · **propuesta** por escrito en 24–48 h `[CONFIRMAR]` · **accesos** tuyos desde el día uno `[CONFIRMAR]` → cronómetro (`Santo Domingo · UTC−4` + hora + `tú 10:40` **solo** si la zona del visitante difiere) → carta. Prohibido: años, clientes, «expertos», fotos de stock (`04 §3`). El nombre de Giancarlo visible sostiene el `founder` del JSON-LD.
**Interacción.** Ninguna (es una placa). El número de WhatsApp es un enlace.
**Lecturas.** Hora (M, `Intl.DateTimeFormat` con `America/Santo_Domingo`; UTC−4 sin horario de verano, `R04 F36`) · banda día/noche (C, NOAA/Meeus; **no se imprimen** amanecer y atardecer para no aparentar precisión: el error medido es ≤ 2 min) · `tú` (M, `Intl.DateTimeFormat().resolvedOptions().timeZone`; se calcula y se muestra en el cliente, **no se envía a ningún sitio**) · coordenadas (C). La franja de horario hábil **no se dibuja** mientras `brand.json` no publique `hours`.

### 4.3 Servicios · índice y cuatro fichas

Encabezado: `h2` (arte `SERVICIOS`). Orden fijo (`04 D1`): Web y apps → Automatización e IA → Marketing y redes → Soporte e IT.

**Índice** (cuatro filas con regla, sin tarjetas iguales): emblema de 9×3 celdas, nombre, promesa (≤ 56 columnas) y `[ WhatsApp ]` con el servicio ya escrito (`waService`, `04 §5.4`). Semántica: `ul` de cuatro `li`; el nombre enlaza a su ficha; el emblema es `aria-hidden`.

```text
──────────────────────────────────────────────────────────────────────────────────────────────
┌──┬────┐  Desarrollo web y apps                                                  
├──┴─▒▒▒┤  Tu web, rápida y lista para vender por WhatsApp.          [ WhatsApp ]
└───────┘  
──────────────────────────────────────────────────────────────────────────────────────────────
╭─╮   ╭─╮  Automatización e IA                                                    
│@│─»─│*│  Que WhatsApp responda, agende y avise por ti.             [ WhatsApp ]
╰─╯   ╰─╯  
──────────────────────────────────────────────────────────────────────────────────────────────
▗▄  ) ) )  Marketing digital y redes                                              
█▐▙ ) ) )  Que te encuentren, te escriban y te compren.              [ WhatsApp ]
▝▀  ) ) )  
──────────────────────────────────────────────────────────────────────────────────────────────
   ╷       Soporte e infraestructura IT                                           
───┴┬────  Correo, redes y equipos que no te frenan.                 [ WhatsApp ]
    ╵      
──────────────────────────────────────────────────────────────────────────────────────────────
```

**Ficha (estructura común).** Escritorio en dos columnas (texto de 62 ch | ventana de instrumento de 62–70 celdas); móvil apilado en este orden: `h3` → ventana → promesa → *Incluye* → `dl` → datos locales → CTA. Orden en el DOM: `h3` (texto real 29 px/700) → promesa (≤ 56 col) → ventana (`aria-hidden`) → `ul.incluye` (5–7) → `dl` (*Para quién*, *Necesitamos*, *Resultado*; `dt` ≤ 14 col) → `ul.datos` (3 hechos: texto + `Verificado 30 sep 2026` + fuente como enlace corto) → CTA `Escribir por WhatsApp` + enlace de correo. Mensaje: `Hola Gaya Digital, me interesa «{servicio}». Quiero una propuesta.` **Copy final ES/EN de cada ficha: `04 §2.1–2.4` (no se duplica aquí).** Lo `[CONFIRMAR]` de `04` (apps nativas, pasarela + e-CF, API de WhatsApp, agente de IA con datos, edición de video, Google Ads, SLA, soporte remoto) **bloquea la build de producción** (`04 D11`).

#### 4.3a Desarrollo web y apps · «Trazador» (+ «Cuenta»)

- **Qué se dibuja.** Un **plano de página**, no una ventana de navegador (`DESIGN.md` prohíbe marcos falsos): contorno; barra superior con marca y tres enlaces; regla; titular en dos barras; cota `├──┤`; bajada; botón `╭╮`; imagen (cielo tramado, sol `@`, montañas en cuadrantes); tres módulos; destello de «publicado» y lámpara `─[█]─`. Un **lápiz de plotter** (`┼`, T15) recorre el perímetro y los trazos; el relleno llega por disolución con ruido azul anclado a la celda (`05 §3.4`).
- **Técnica.** Escena pura `trazador(u)`, horneada por tamaño; tonos T4–T12; sin texto ni cifras dentro.
- **Movimiento (scrub, `u` = progreso de la ficha).** 0–0,25 contorno · 0,22–0,45 barra superior, titular y cota · 0,42–0,62 botón e imagen · 0,58–0,78 módulos · 0,80–0,95 el destello cruza el plano · 0,96 lámpara. Campo de la banda: la **retícula** aparece (`┼` tenue cada 8 celdas) mientras el lápiz dibuja.
- **Móvil.** Variante 46×22 (dos módulos). **Reducido.** `u = 1`.
- **Datos locales (`04 §2.1`).** F13 (un dominio `.do` vencido queda 30 días suspendido y 15 en rescate) · F01 (e-CF, alimenta la Cuenta) · F32 (quien compra en línea busca precio con impuestos, envío, garantía y cambios). **Mensaje**: `waService(lang, 'Desarrollo web y apps')`. **Interacción**: solo el CTA y su foco.

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ██████                           ▄▄▄▄▄  ▄▄▄▄▄  ▄▄▄▄▄      │
│                                                            │
│────────────────────────────────────────────────────────────│
│  ├───                                                      │
│                                       ┌─────────────────┐  │
│  ██████████████████████████████████   │░░░░░░░░░░░░░░░░░│  │
│                                       │░░░░░░░░░░░░░░░░░│  │
│  ██████████████████████████           │░░░░░░░░░░░░░░░  │  │
│                                       │                 │  │
│                                       │                 │  │
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁┼      │                 │  │
│                                       │                 │  │
│                                       └─────────────────┘  │
│  ╭────────────────╮                                        │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                                        │
│  ╰────────────────╯                                        │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
```text
┌───────────────────────────────────────────────────────────▒│
│                                                           ▒╎
│  ██████                           ▄▄▄▄▄  ▄▄▄▄▄  ▄▄▄▄▄     ▒│
│                                                           ▒╎
│───────────────────────────────────────────────────────────▒│
│  ├─────────────────────────────────┤                      ▒╎
│                                       ┌─────────────────┐ ▒│
│  ██████████████████████████████████   │░░░░░░░░░░░░░░░░░│ ▒╎
│                                       │░░░░░░░░░░░░░@░░░│ ▒│
│  ██████████████████████████           │░░░░░░░░░░░░░░░░░│ ▒╎
│                                       │░░░░░░▗▟███▙▖░░░░│ ▒│
│                                       │░░▗▟█▙▖░░░░░░░░░░│ ▒╎
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁┼      │▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│ ▒│
│                                       │▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│ ▒╎
│                                       └─────────────────┘ ▒│
│  ╭────────────────╮                                       ▒╎
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                                       ▒│
│  ╰────────────────╯                                       ▒╎
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ▒│
│  │               │  │               │  │               │  ▒╎
│  │ ▄▄▄▄▄▄▄▄▄     │  │ ▄▄▄▄▄▄▄▄▄     │  │ ▄▄▄▄▄▄▄▄▄     │  ▒│
│  │ ▁▁▁▁▁▁▁▁▁▁▁▁  │  │ ▁▁▁▁▁▁▁▁▁▁▁▁  │  │ ▁▁▁▁▁▁▁▁▁▁▁▁  │  ▒╎
│  └───────────────┘  └───────────────┘  └───────────────┘  ▒│
└──────────────────────────────────────────────────[█]──────▒╎
```

- **Segunda lectura, «Cuenta» (dato local F01, grado B).** Cinta de 46 celdas (un día por celda entre el 30-sep y el 15-nov-2026): `█` días pasados, `·` restantes, `↓` hoy, marcas en 1-oct y 1-nov, valor `faltan N días` (`<output data-src="C">`). Se calcula en el cliente con `Date` y la fecha ISO de `facts.ts` (ejemplo del arte: 12-oct, 34 días). **Caduca**: tras el 15-nov la cinta se sustituye por el hecho vigente; el lint de `04 §5.3` falla a los 30 días del `recheck`. Si el dueño no quiere hechos fiscales, sale (`04 D15`).

```text
e-CF · pequeños, micro y no clasificados          verificado 30 sep 2026
                    ↓                                                   
30 sep  ████████████·································· 15 nov           
         ╵                              ╵                               
         1 oct                          1 nov                           
faltan 34 días                                                          
```

#### 4.3b Automatización e IA · «Piloto»

- **Qué se dibuja.** Un **chat** de seis turnos (`cliente` / `bot`, sin nombres ni marcas) y un **interruptor** `AUTO ▐██▌░░░░ PERSONA` con lámpara `[█]` que dice quién atiende. La conversación acaba en una duda que el bot no resuelve («¿Aceptan transferencia?») y el interruptor **pasa a PERSONA** («Te paso con una persona.»): el traspaso humano que exige la política de mensajería de Meta (`R04 F19`).
- **Técnica.** Escena pura `piloto(u)`. El chat es arte `aria-hidden` con frases genéricas, sin cifras; su equivalente real está en «Resultado» (`04 §2.2`).
- **Movimiento (scrub).** Un turno por sexto de `u`; cada mensaje se escribe celda a celda **solo en el arte**; al final el interruptor cambia de lado en 0,3 s y la lámpara se apaga y se enciende del otro lado: **una vez**. Campo de la banda: los filamentos **se enderezan** en líneas de flujo horneadas (`05 §4`, `flowField`) que convergen en una sola ruta.
- **Móvil.** Chat e interruptor apilados (44 columnas). **Reducido.** Estado final (PERSONA).
- **Lectura.** El estado del interruptor es categórico; esta ficha no lleva cifras.
- **Datos locales (`04 §2.2`).** F16 (desde el 1-oct-2026 Meta cobra por mensaje de servicio en la API) · F20 (sin asistentes de IA de uso general; sí bots de soporte, citas y pedidos) · F18 (la app Business y la API pueden compartir número). **Mensaje**: `waService(lang, 'Automatización e IA')`. **Interacción**: solo el CTA.

```text
╭─ chat ───────────────────────────────╮   ╭─ traspaso ───────────────╮
│                                      │   │                          │
│  cliente  ¿Tienen cita mañana?       │   │                          │
│                                      │   │  AUTO  ▐██▌░░░░  PERSONA │
│  bot      Sí. ¿10:00 o 15:00?        │   │                          │
│                                      │   │                          │
│  cliente  10:00                      │   │  [█] atiende el bot      │
│                                      │   │                          │
│  bot      Listo, cita agendada.      │   ╰──────────────────────────╯
│                                      │                               
│  cliente  ¿Aceptan transferencia?    │                               
│                                      │                               
│  bot      …                          │                               
│                                      │                               
╰──────────────────────────────────────╯                               
```
```text
╭─ chat ───────────────────────────────╮   ╭─ traspaso ───────────────╮
│                                      │   │                          │
│  cliente  ¿Tienen cita mañana?       │   │                          │
│                                      │   │  AUTO  ░░░░▐██▌  PERSONA │
│  bot      Sí. ¿10:00 o 15:00?        │   │                          │
│                                      │   │                          │
│  cliente  10:00                      │   │  [█] atiende una persona │
│                                      │   │                          │
│  bot      Listo, cita agendada.      │   ╰──────────────────────────╯
│                                      │                               
│  cliente  ¿Aceptan transferencia?    │                               
│                                      │                               
│  bot      Te paso con una persona.   │                               
│                                      │                               
╰──────────────────────────────────────╯                               
```

#### 4.3c Marketing digital y redes · «Sonar»

- **Qué se dibuja.** Un emisor en cuadrantes que lanza **anillos** `) ) )`; **ecos** `·` → `o`/`@` que se encienden cuando el anillo los alcanza; una **red** punteada que une los ecos encendidos; abajo, **barras de octavos** con volumen (columna izquierda +1 tono, derecha −1). Sin cifras ni ejes (`05 §2.3`).
- **Técnica.** `sonar(u)`: un anillo cruza una celda si su radio cae entre la distancia mínima y la máxima de las cuatro esquinas de la celda (medida en espacio visual, alto = 2) ⇒ arcos sin huecos; glifo por ángulo de posición: `)` hasta 24°, `\` `/` entre 24° y 62°, `─` cerca del cénit; tono T13 → T4 según el radio. **Los mismos anillos sirven a la onda del toque y a la lupa de la portada.**
- **Movimiento (scrub).** Radio = 4 + `u`·54 celdas; las barras crecen entre `u` 0,15 y 0,85. Campo de la banda: anillos concéntricos tenues.
- **Móvil.** 46×27 (dos anillos, ocho ecos, diez barras). **Reducido.** `u = 1` con tres arcos fijos.
- **Datos locales (`04 §2.3`).** F15 (desde un anuncio o botón, 72 h de mensajes sin cargo) · F28 (Ley 30-26: retención de 15 %, antes 27 %) · F27 (Google Ads pide registro e identificación con foto). **Mensaje**: `waService(lang, 'Marketing digital y redes')`. **Interacción**: solo el CTA.

```text
                             \\\              \)             )
        ─────                  \\          o   )             )
            ──\\                \\             ))             
               \\\\     o        ))         ·   ))            
                  \\              ))      ·      )     o      
                   \\   ··         @         ·   )            
               o    ))             ))    ·       ))     ·     
                     ))·  ·         ·             )   ·       
    ▗▄          ·     )           · )    ·     o  )      ·    
   █▌▐▙               )·   o        ) ·           )   ·       
    ▝▀           ·    )  ·       ·  )   ·       · )           
                     ))·            )             )  ·    o   
                    )·          ·  ))  ·o        )·           
                   @/  ·           )             )   ·        
                  //            · ))  ··         )            
               ////   ·          ))             ))  @         
            ──//            ·  o//    ·        ))             
        ─────         o · ·    //              )             )
                             ///     @        /)             )
                           ///               //             ))
                                                              
                                                    ▄▄  ▆▆    
                                        ▂▂  ▅▅  ██▌ ██▌ ██▌   
                            ▁▁  ▄▄  ▇▇  ██▌ ██▌ ██▌ ██▌ ██▌   
                ▂▂  ▄▄  ▆▆  ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌   
    ▅▅  ▇▇  ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌ ██▌   
  ──────────────────────────────────────────────────────────  
```

#### 4.3d Soporte e infraestructura IT · «Tablero» y el apagón

- **Qué se dibuja.** Una **hoja de revisión** con cinco lámparas (`correo`, `2 pasos`, `respaldo`, `wifi`, `apagones`; estados `[█] ok`, `[▒] revisar`, `[·] pendiente`) y debajo un **ECG** de trazo fino (línea `─` y espigas `│ ┴ ┬ ╷ ╵`), un sparkline en el sentido de Tufte. En el apagón aparece una **batería** `[██████▌   ]` con la etiqueta `respaldo`.
- **Técnica.** `tablero(u)`; el ECG es la suma de cinco gaussianas (P, Q, R, S, T) muestreada por columna; ni bpm ni uptime.
- **Movimiento (scrub).** 0–0,35 las lámparas pasan a `[█]` en orden · **0,45–0,62 apagón**: `fieldGain` baja a 0,12 con τ 0,4 s (**se apaga el campo, no el texto**), `apagones` → `[·] sin luz · pendiente`, la batería baja, **el ECG no se aplana** (su fase avanza con el scroll) · 0,62–0,80 vuelve el campo (subida ≥ 0,9 s), `apagones` → `[█] plan listo`, la batería se recarga. Un solo ciclo, reversible con el scroll.
- **Seguridad (2.3.1).** Cambia solo la luminancia del fondo de glifos, con rampa continua ≥ 0,4 s y una vez; ninguna oscilación; el contenido real nunca se atenúa.
- **Móvil.** 46×20. **Reducido.** Estado `respaldo` estático, **sin** apagón.
- **Datos locales (`04 §2.4`).** F31 (apagones de 3 a 10 horas frenan a negocios de Santo Domingo) · F06 (el Facturador Gratuito guarda tus e-CF 2 años; la ley pide 10) · F29 (Gmail exige SPF o DKIM; con más de 5 000 correos al día, también DMARC). **Mensaje**: `waService(lang, 'Soporte e infraestructura IT')`. **Interacción**: solo el CTA.

```text
╭─ hoja de revisión ─────────────────────────────────────────╮
│                                                            │
│  [█]  correo     SPF · DKIM · DMARC                    ok  │
│                                                            │
│  [█]  2 pasos    activado                              ok  │
│                                                            │
│  [█]  respaldo   copia fuera del sitio                 ok  │
│                                                            │
│  [▒]  wifi       ordenado                         revisar  │
│                                                            │
│  [█]  apagones   plan listo                            ok  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│        ╷                             ╷                     │
│        │                             │                     │
│        │       ╷╷╷           ╷       │       ╷╷╷           │
│   ─────┴┬──────┴┴┴───────────┴───────┴┬──────┴┴┴────────   │
│         ╵                             ╵                    │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
```text
╭─ hoja de revisión ─────────────────────────────────────────╮
│                                                            │
│  [█]  correo     SPF · DKIM · DMARC                    ok  │
│                                                            │
│  [█]  2 pasos    activado                              ok  │
│                                                            │
│  [█]  respaldo   copia fuera del sitio                 ok  │
│                                                            │
│  [█]  wifi       ordenado                              ok  │
│                                                            │
│  [·]  apagones   sin luz                        pendiente  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│               ╷                    respaldo ╷              │
│               │                    [██████▌   ]            │
│       ╷       │       ╷╷╷           ╷       │       ╷╷╷    │
│   ────┴───────┴┬──────┴┴┴───────────┴───────┴┬──────┴┴┴─   │
│                ╵                             ╵             │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

### 4.4 Referencias · «Muestrario»

- **Qué se dibuja.** Un **libro de muestras**: una fila con regla por referencia construida (`references.json` → `status: 'built'`: hoy 3 de 14, sin relleno inventado), con código (`slug`), nombre, rubro, tipo y una **miniatura ASCII horneada** (50×8 celdas en escritorio, 28×6 en móvil). El conteo es real (`n referencias`, `gallery.count`).
- **Técnica.** Las miniaturas se hornean en el build desde `public/posters/<slug>-…-desktop.webp` con **vector de forma** (bordes limpios, `05`/Alex Harri); la del arte de abajo usa una rampa por densidad y es solo ilustrativa. `[ imagen | texto ]` alterna la miniatura ASCII y el póster real; por defecto **texto**; la elección se guarda en `localStorage` con `try/catch`. Foco o hover en una fila en modo texto **revela** el póster real con un fundido de 200 ms.
- **Movimiento (scrub).** Cada miniatura se «revela» al entrar: la densidad sube de `·` al glifo final (como una placa que se revela), fila a fila con 0,12 de `u` de desfase.
- **Móvil.** Filas apiladas (miniatura arriba, 28×6). **Reducido.** Miniatura final, sin fundido.

```text
 [ imagen | texto ]                                                                 3 referencias       
────────────────────────────────────────────────────────────────────────────────────────────────────────
                                                ::**yy**==:=***::=y*:·:yyyy*:····             ·         
 fogon                                          ▒ay::a███████A*Ayy██a*=::=▒G==::=:·                     
                                                GAaAGAaA▒▓█████▒a▒███▒▒Gy=aGA*:::=:····                 
 Fogón                                          GA*AAG▒A▒▓▒G▓▒AAGGAG▒▒Aaa*:=y**:·:· ·                   
 Restaurante                                    =*:·*GAAaG▒AG▓▒A▒G▒G▒▒▒aay*:===▓ayaAyaG*AAyGaG          
 Reservas y pedidos                             ·:·····::=**yaaAAAGG▒▒▒GAay**==y=**y*yy*y***==          
                                                ··::···  ···               ·  ·yyyyy: ·· ·    ·         
                                                ··············  · ··  ··   ·   ·····                    
 [ Abrir ]                                                                                              
────────────────────────────────────────────────────────────────────────────────────────────────────────
                                                ▓▒GGGG▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒GGG▒▒▒▒▒▒▒▒▓▓████████      
 cimiento                                        ·*====**==:*=====·*=      ·:===··     :▓█a▒███Ga*      
                                                ·=AAaayAaAyGaAAAGAayy==******yay*aa*=  =██   ·==·       
 Cimiento                                       ·:*******=:===::··:··:::==:··          =██              
 Constructora                                   ·=yyyyyyy:··::::······:= =y:*Aay:*==·  =▓█              
 Presencia                                      ······::::·::==:::···:=y·A█:y██▓=y*=:  =▓█              
                                                 ·····:::· ··::······::==*y=yAAAyay**  :██::::·:··      
                                                ***=****yy**yyyyyyyyyyyyayaaaaaAAAGGG**y██▒▓▓▓▒▒▒▒      
 [ Abrir ]                                                                                              
────────────────────────────────────────────────────────────────────────────────────────────────────────
                                                Gy:=▒GGaA·**y=A▒▒▒▒GGGGGGGaaaayAayyAAGaaAay·     =      
 nodo                                           y*··aA·aa·   ===:·=GGGGGGGGAAGGAAAGAA=y▒▒▒▒▒▓▓▒a▓A      
                                                aaaaaayaA█A  :    ·████████████████GA ·G▓██▓GAa·▓a      
 Nodo                                           aaaaaaAaa▒▒█▒yy▒yG▓GG▓GaAaG▓Gy▓aa▓▒G▒G=:A▒██████▓a      
 App / SaaS                                     aaaaaaaaa▒GGaGGaGaAGGAaAAGAGAAGAGAGGa yaaGG▒GG▓▓▓a      
 App                                            aAaaaaaaa▒AA▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▒▓GA▒Aa▒GGy*aAGGG▒▒▒▒▓a      
                                                A*AAAGAaa▓a·yG█y========::=A█▒AG▒G▓G▒a·:·*yy▓▒GG▓a      
                                                      ·aa▓G==a█y========aG▒▓██▓▓█▓▓G▓A=:·=::G▓▒▒▓a      
 [ Abrir ]                                                                                              
────────────────────────────────────────────────────────────────────────────────────────────────────────
```

**Contenido.** `h2` (arte `REFERENCIAS`) → `ul` de filas (`a` a `/referencias/<slug>/`; nombre, rubro, tipo desde `references.json`; insignia `ejemplo` en cada fila, porque son webs con datos ficticios) → `[ Ver todas ]` a `/referencias/`. **Interacción.** El conmutador (`aria-pressed`) y el foco. **Lecturas.** El conteo (M sobre datos del build).

### 4.5 Proceso · «Cinta»

- **Qué se dibuja.** Cuatro estaciones unidas por `───»`, una regla de cinta debajo y un tramo resaltado `┣████┫` entre la 01 y la 02 con `├── 24–48 h ──┤`: el único plazo publicado (`04 §2.5`). En móvil, una **cinta vertical** (la regla de profundidad, con el tramo resaltado entre 01 y 02).
- **Técnica.** `data-art` estático + un marcador que avanza por CSS `animation-timeline: view()` bajo `@supports` (la capa DOM; `06 D8`); sin soporte, la cinta queda completa.
- **Movimiento.** Las estaciones se encienden en orden según el scroll (un cuarto de `u` cada una); el marcador `▌` recorre la regla. **Reducido.** Todo encendido.

```text
┌──────────────┐             ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ 01           │             │ 02           │             │ 03           │             │ 04           │
│ Hablamos por │───»         │ Propuesta    │───»         │ Construimos  │───»         │ Entregamos y │
│ WhatsApp     │             │ por escrito  │             │ con avances  │             │ acompañamos  │
└──────────────┘             └──────────────┘             └──────────────┘             └──────────────┘

├───────── 24–48 h ──────────┤
┣████████████████████████████┫────────────────────────────┼────────────────────────────┼───────────────
```
```text
[█]  01  Hablamos por WhatsApp   
 │                               
 ┃                               
 ┃                               
 │                               
 │                               
[█]  02  Propuesta por escrito   
 │                               
 ┃  24–48 h                      
 ┃                               
 │                               
 │                               
[█]  03  Construimos con avances 
 │                               
 ┃                               
 ┃                               
 │                               
 │                               
[█]  04  Entregamos y acompañamos
```

**Contenido.** `h2` (arte `PROCESO`) → `ol` de cuatro `li` (`04 §2.5`: *Hablamos por WhatsApp · Propuesta por escrito · Construimos con avances · Entregamos y acompañamos*; EN: *We talk on WhatsApp · Written proposal · We build, with progress updates · We deliver and stay by your side*). El «24–48 h» se dibuja **solo** si `brand.json › commitments.proposalHours` está confirmado (**P**); si no, la cinta no lleva plazo. Los demás plazos **no se publican** hasta medirlos. **Interacción.** Ninguna (las estaciones no son enlaces). 

### 4.6 Contacto y cierre · «Faro»

- **Qué se dibuja.** Una pirámide escalonada en cuadrantes (el Faro a Colón visto de frente: 157 haces de luz, cruz visible a ~64 km, `05 §1.6`) y su **cruz de luz**: vertical de `█` con flancos `▒`, brazo horizontal al 30 % de la altura con núcleo `█`, flancos `▒` y halo `░`; línea de horizonte `▀`; reflejo en el mar. Es el único lugar donde el campo alcanza T13–T15 en una zona amplia, porque no hay texto debajo. **No** se dibuja el Obelisco ni los monumentos del informe `05`: un solo foco por escena.
- **Técnica.** Escena `faro(u)`; el núcleo de la cruz y el reflejo usan **ciclado de paleta** (0 celdas tocadas por fotograma, `05 §2.5`). Interpretación esquemática: **antes de aprobarla se compara con la foto CC BY-SA 4.0 de Commons** que cita `05 §1.6`.
- **Movimiento (scrub).** La cruz **crece** con el scroll: el vertical primero (`u` 0–0,5), luego el brazo (0,5–0,8) y el halo (0,8–1). Al enfocar o pasar sobre `Escribir por WhatsApp`, el brazo sube 2 tonos en 240 ms (nunca parpadea).
- **Móvil.** 56×22, Faro de 15 columnas. **Reducido.** Cruz completa y estática.

```text
                                              ░▒█▒░
                                               ▒█▒
                                              ░▒█▒░
                                               ▒█▒
                                              ░▒█▒░
                               ░░░░░░░░░░░░░░░░▒█▒░░░░░░░░░░░░░░░░
                      ░░░░░▒▒▒▒▒▒▒▒████████████▒█▒████████████▒▒▒▒▒▒▒▒░░░░░
                               ░░░░░░░░░░░░░░░░▒█▒░░░░░░░░░░░░░░░░
                                              ░▒█▒░
                                               ▒█▒
                                              ░▒█▒░                                  ·  ···· · ·
                                               ▒█▒                                  ·······  ··
                                              ░▒█▒░                               ·······:······
                                               ▒█▒                      ·       ·  ····:::······
                     ·                        ░▒█▒░                            ·····  ·::::::·
                                               ▒█▒                     :          ·::::::::::·
                                              ░▒█▒░                 ···             ·::::::::
                                              ████
                                          ▐██████████▌
                                      ▗▄▄▄▟██████████▙▄▄▄▖
                                  ▗▄▄▄▟██████████████████▙▄▄▄▖
                               ██████████████████████████████████
                               ██████████████▒██▒██▒█████████████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
```

**Contenido.** `h2` (arte `CONTACTO`) → botón principal `Escribir por WhatsApp` con el número visible `+1 849-925-4426` → correo `hola@gaya.com.do` con `[ Copiar correo ]` (estado: relleno `████` de 400 ms y la insignia `Copiado`; sin texto de ayuda; `try/catch` del portapapeles) → redes (`brand.json › social`: Instagram, Facebook, X, TikTok, YouTube; solo las que existan) → `Santo Domingo, República Dominicana` (`copy.ts › footer`). Cierra el **logotipo GAYA** a 84×9 en T4–T6 (papel de pie). **Lecturas.** Ninguna nueva.

---

## 5. El momento firma

**Cuándo.** Dos golpes: uno al abrir y otro en el centro de la página.

```text
          0 s                 1 s                 2 s         2,6                           
          ┼─────────┬─────────┼─────────┬─────────┼─────────┬─┤                             
campo     ██████████████████··································   ignición desde la lente    
reglas    ········████████████████████████····················   marcas de registro y marcos
agujas    ························████████████████████████····   autotest de las lecturas   
                                                                                            
después   reposo: 0 fps hasta que haya entrada                                              
```

1. **«La página se lee a sí misma» (0–2,6 s).** Nadie pidió que se probara. Las agujas barren su escala y se asientan; `peso` queda con su valor y **`terceros` y `cookies` se quedan vacíos en cero**. Lo que la gente cuenta: *«esa web se midió delante de mí y no carga nada de nadie»*. Es la promesa de la ficha de Web y apps («medida en velocidad y accesibilidad», `04 §2.1`) demostrada sin una sola frase.
2. **«Se va la luz y la página sigue encendida» (Soporte).** El campo se apaga, el texto sigue legible, una lámpara pasa a `respaldo`, el ECG no se aplana y el campo vuelve. Solo quien vive en Santo Domingo lo entiende del todo (apagones de 3–10 h en 2026, `R04 F31`, grado B): por eso se cuenta. La prueba contra el error de lectura («¿se rompió?») es que **nada legible cambia** y hay una lámpara que dice `respaldo`.

Por qué funciona y por qué es honesto: los dos golpes son **el servicio hecho visible**, no un truco. Ninguno usa una cifra que no sea medida, calculada o publicada.


---

## 6. Plan técnico

### 6.1 Capas y motor

```
 z  capa                                     qué es                                              JS
 ─  ───────────────────────────────────────  ──────────────────────────────────────────────────  ───────────────
 3  UI fija: esquinas + regla de profundidad  <nav> real, foco propio, scroll-spy con IntersectionObserver  ~1 KB
 2  texto real                                 h1–h3, p, ul, dl, a, output (Geist Mono)            ninguno
 1  arte estático en el DOM                    span.art[data-art]::before: logotipo, títulos, marcos, reglas, miniaturas   ninguno
 0  CANVAS FIJO (100lvh, aria-hidden)          campo Marea + pozos + ventanas de escena            motor ~12 KB gz
```

- **Un solo canvas y un solo contexto** (`06 D1`): WebGL2 con textura de celdas `RGBA8UI` + atlas de máscaras + paleta de 32 entradas, 1 draw, `texelFetch` (`05 §3.6`); respaldo Canvas 2D con baldosas y diff por celda (tope ≈ 900 celdas/cuadro, si no 8 fps); si `WEBGL_debug_renderer_info` dice `SwiftShader`/`llvmpipe`, respaldo o póster. **Se descarta el pipeline GPU de cuatro pasadas de `02`** para esta página (motivos en §6.11).
- **Regla de reparto**: *lo que cambia por fotograma va al canvas; lo que cambia por evento va al DOM.* Las escenas de servicio (Trazador, Piloto, Sonar, Tablero, Faro) y el campo cambian por fotograma; las lecturas (números y pistas), el cronómetro y la cuenta cambian por evento y se escriben como `data-art`/`<output>`.
- **Celda del canvas = celda del DOM** (§2.2): 6×12 (L10), 9×18 (L15), 12×25 (L20) en píxeles de dispositivo enteros; `DPR ≤ 2`. Tiers por **celdas** (`06 D11`, con el `low` de `02`): `high` 9 000 · `mid` 6 500 · `low` 4 800 · `min` 2 400; fps 30 (min 20); el control adaptativo **solo baja** (mediana de 40 cuadros > 1,5 × presupuesto ⇒ baja un nivel, como `hero.ts`); al bajar de L10 a L15 el arte del canvas sube de retícula y los marcos DOM se quedan (interiores autocontenidos).
- **1440×900 ⇒ 160×50 = 8 000 celdas** (`high`). 1280×720 ⇒ 5 680 (`mid`). 1920×1080 a L15 serían 12 800 ⇒ el motor pasa a **L20** (160×43 = 6 900). Móvil 390×844 a L10 ⇒ 65×70 = 4 550 (`low`).
- **Bucle**: `rAF` con acumulador y tope de 30 fps, sueño a 1,6 s sin entrada, pausa con `document.hidden`/menú abierto/contexto perdido, `dispose()` obligatorio (HMR y pruebas), `window.__field = { tier, cols, rows, lattice, frames, sleeping, costP50, costP95, mode }` (heredero de `__hero`).

### 6.2 Ventanas de escena (los instrumentos dentro del canvas)

Cada instrumento animado es un **hueco transparente** dentro de un marco DOM; el motor pinta su interior en el canvas fijo, alineado a la celda más próxima (error ≤ 0,5 celda, que el margen de 1 celda de la escena absorbe):

```html
<div class="win" data-scene="piloto" data-w="71" data-h="15" style="width:calc(var(--cw)*71);height:calc(var(--ch)*15)">
  <span class="art" aria-hidden="true" translate="no" data-art="╭─ chat ─…"></span>  <!-- marco estático (SSR, sin JS, impresión) -->
</div>
```

```ts
export interface Scene {
  id: string; w: number; h: number;              // celdas; el diseño móvil es otra Scene con otro w/h
  settle: number;                                 // u del estado estático (1)
  frame(g: Grid, u: number, env: { energy: number; phase: number }): 0 | 1;   // PURA en u; 0 = no cambió, no se sube
}
// progreso de la ventana en el visor: 0 cuando su borde superior entra al 85 % de la altura; 1 cuando su borde inferior llega al 35 %
const u = clamp((0.85 * vh - top) / (0.5 * vh + height), 0, 1);
```

`Grid` de 4 bytes por celda y `blit` de `05 §3.1`; capas horneadas por tamaño y firma de reposo (`cachedScene`); las escenas se cargan con `import()` al llegar al 60 % de margen y se sueltan al alejarse. Respaldo sin canvas (`?dom`): la misma escena a `settle` como `data-art` en tres pilas de tono. Las ventanas se **miden una vez** y se cachean en coordenadas de documento (`ResizeObserver`, cambio de ancho, `document.fonts.ready`); nunca `getBoundingClientRect` dentro del bucle.

### 6.3 Campo Marea: del shader de `hero.ts` a una función por celda

| De `hero.ts` | Qué pasa |
|---|---|
| Deformación del dominio `q = fbm(p·1,05 + …)` y altura `h = fbm(p·0,9 + 1,7·q + …)` | **Se conserva la estructura** (dos `fbm`, uno deforma al otro) en `marea()`, ahora por celda y con ruido entero |
| Iluminación (normal, difusa, especular) | Se sustituye por **crestas**: `ridge = 1 − abs(2h − 1)` elevado a 9 ⇒ filamentos de luz (cáusticas) |
| Lente de vidrio con dispersión R/G/B | **Lupa de cuadrantes** (abajo): doble resolución, +3 tonos, anillo; la dispersión cromática se descarta (Cobalto es un solo tono) |
| `REST (0,74; 0,60)`, `STILL_TIME 21,7`, `INTRO_SECONDS 2,6`, resorte `k = 1−e^(−dt·4)` (9 al arrastrar), retorno a 1,8 s, `repel`, `energy`, ondas, `?still`, `?tier=`, `pickTier`, control adaptativo que solo baja, IO de visibilidad, reposo sin bucle, `readLook` de `--glow-*` | **Se conservan tal cual** (portados de `hero.ts` a `src/ascii/engine.ts`) |
| Póster `webp` (`--hero-poster-*`) y grano `noise.png` | Se **retiran**: el póster es el `<pre>` del build y el grano es texto |
| `webglcontextlost` → póster | Igual, más `dispose()` |

```ts
// src/ascii/scenes/marea.ts — pura y determinista: solo + − × ÷ y enteros (paridad exacta póster ↔ motor, 06 §4.1)
const h2 = (x: number, y: number, s = 0): number => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const vnoise = (x: number, y: number, s = 0): number => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const fbm = (x: number, y: number, oct: number, s = 0): number => { // normalizado a 0..1 (06 lo deja en 0..0,94)
  let v = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { v += a * vnoise(x, y, s + i); n += a; x = x * 2.03 + 17.1; y = y * 2.03 - 9.3; a *= 0.5; }
  return v / n;
};

/** densidad 0..1 de la celda (c, r) a tiempo t; la celda es 1:2, por eso la escala vertical es el doble */
export function marea(c: number, r: number, t: number): number {
  const x = c * 0.05, y = r * 0.1;
  const q = fbm(x + t * 0.02, y, 3, 3);                              // deformación del dominio (el `q` de hero.ts)
  const h = fbm(x * 1.5 + 1.9 * q, y * 1.5 - t * 0.015, 4, 11);      // altura del líquido (el `h` de hero.ts)
  const ridge = 1 - Math.abs(2 * h - 1);                             // 1 en las crestas ⇒ filamentos de luz
  const r2 = ridge * ridge, r4 = r2 * r2, r8 = r4 * r4;              // ridge^9 sin Math.pow
  const act = fbm(x * 0.55 - q * 0.8, y * 0.55 + 4, 2, 21);          // zonas de actividad: el campo respira
  const d = r8 * ridge * (0.15 + 1.9 * act * act * act);
  return d > 1 ? 1 : d;
}

/** umbral → [glifo, tono]; el alfabeto del agua es la marca: y a A G */
export const NIVELES: ReadonlyArray<readonly [number, string, number]> = [
  [0.05, '·', 3], [0.13, ':', 4], [0.22, '=', 5], [0.33, '*', 6], [0.45, 'y', 7],
  [0.58, 'a', 8], [0.72, 'A', 9], [0.86, 'G', 10], [0.96, '▒', 12],
];
export function glifo(d: number, enPozo: boolean): [string, number] | null {
  let out: [string, number] | null = null;
  for (const [th, ch, tn] of NIVELES) if (d >= th) out = [ch, tn];
  if (!out) return null;
  if (enPozo) return out[0] === '·' || out[0] === ':' ? [out[0], Math.min(out[1], 3)] : ['·', 2];   // dentro de un pozo: solo susurro
  return out;
}
```

Verificación **[M]** (Node 24): `marea.ts` reproduce **las 8 000 celdas** del prototipo con diferencia 0; a 160×50 y `t = 21,7`, el 55,9 % de las celdas no está vacío y de ellas el 61 % son `·` o `:` (T3–T4); `▒▓█` ocupan 0,16 %; la chispa (T15) se reserva para la lupa y la cruz del Faro. Los umbrales se afinan mirando la pantalla, no los números: en la captura de control a 1440×900 con estos valores el campo abierto se ve **tenue** frente a los pozos, así que el primer ajuste previsto es +1 tono y ×1,2 de densidad **fuera** de los pozos, sin tocar los pozos.

```ts
// Lupa a nivel de celda [C, no ejecutada]: doble resolución con cuadrantes dentro del círculo
function lupa(g: Grid, t: number, cx: number, cy: number, R: number) {          // R en celdas visuales (alto de celda = 2)
  for (let r = Math.floor(cy - R / 2); r <= Math.ceil(cy + R / 2); r++)
    for (let c = Math.floor(cx - R); c <= Math.ceil(cx + R); c++) {
      const d = Math.hypot(c + 0.5 - cx, (r + 0.5 - cy) * 2);
      if (d > R) continue;
      let m = 0;
      for (let q = 0; q < 4; q++) if (marea(c + (q & 1) * 0.5 + 0.25, (r + (q >> 1) * 0.5 + 0.25), t) > 0.22 - 0.1 * (1 - d / R)) m |= 1 << q;
      g.put(c, r, QUAD[m], d > R - 1.2 ? 12 : d < R * 0.4 ? 11 : 10);            // borde = anillo (T12)
    }
}
```

Cuesta ~250 celdas × 4 muestras de `marea` por cuadro (≈ 3 000 evaluaciones de ruido). **A validar en el A07**, con el resto de la escala de presupuestos.

### 6.4 Póster SSR, sin JS y respaldos

- **Póster de la portada**: `<div aria-hidden="true" data-nosnippet><pre>…</pre></div>` con tres capas de tono (dim, mid, hot) para el campo + logotipo + reglas + marco de lecturas, en dos variantes (`@media`: ancha 160×50, alta 65×70). **Medido [M]: campo 160×50 en pila de 3 tonos = 23,2 KB crudo → 3,0 KB gzip / 2,8 KB brotli; logotipo 112×12 = 0,27 KB brotli; póster completo ≈ 3,3 KB brotli.** Presupuesto: **≤ 4 KB brotli por variante** (más que los 2 KB de `06` porque lleva tres tonos; si el LCP lo exige, una sola capa cuesta 2,1 KB). El `h1` es el LCP: texto real, sin `color: transparent`.
- **Paridad** en CI: `renderPlate()` en Node = cuadro del motor en `t = 21,7` (mismo glifo y tono por celda).
- **Arte estático** (títulos, marcos, placa, carta, índice, cinta, lecturas, regla): **12,1 KB crudo → 1,3 KB brotli** [M].

| Estado | Qué ve la persona |
|---|---|
| Sin JS / JS lento | Todo el contenido, el póster, los marcos y el arte estático; lecturas con valores del build e insignia `del build` |
| `prefers-reduced-motion` o `saveData` | Póster + un cuadro por escena en `settle`; agujas asentadas; sin lupa, estela, ignición ni apagón; se escucha `change` para conmutar en vivo |
| `?still`, `?still&scene=<id>` | Motor congelado en `settle` (capturas y regresión) |
| `forced-colors` / `print` | Sin canvas; arte en `CanvasText` / negro sobre blanco a 7 pt |
| Sin WebGL2 o `SwiftShader` | Canvas 2D con diff (8 fps si > 900 celdas) o póster |
| Fuente aún sin cargar | Fallback métrico ≈ 100 % (sin salto); el atlas espera `document.fonts.load()` **y comprueba `length > 0`** (`check()` miente) |

### 6.5 Lecturas: procedencia, código y respaldo

| Lectura | Origen | Cómo se mide o calcula | Respaldo | Notas |
|---|---|---|---|---|
| peso | **M** | Σ `encodedBodySize` de la navegación y de los recursos del mismo origen | `data-kb` del build + insignia `del build` | No `transferSize` (vale 0 con caché o entre orígenes, MDN) |
| solicitudes | **M** | `performance.getEntriesByType('resource').length + 1` | build | |
| cookies | **M** | `document.cookie` | 0 | La página no escribe cookies |
| terceros | **M** | recursos http(s) con origen ≠ `location.origin` | 0 | Extensiones o traductores del navegador pueden sumar: **se muestra el valor real** |
| carga (LCP) | **M** | `PerformanceObserver` `largest-contentful-paint` con `buffered` | — | **Apagada por defecto** (depende del dispositivo); decisión del dueño |
| hora SD | **M** | `Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit' })` | — | UTC−4 sin horario de verano |
| tú | **M** | `Intl.DateTimeFormat().resolvedOptions().timeZone` | no se muestra si coincide | No sale del navegador |
| banda día/noche | **C** | `sunTimes()` (abajo) | sin banda | ± 2 min |
| días al e-CF | **C** | fecha ISO de `facts.ts` (F01) y `Date` | texto del hecho | caduca el 15-nov-2026 |
| n referencias | **M** sobre datos | `references.json` filtrado por `status: 'built'` | — | |
| plazo «24–48 h» | **P** | `brand.json › commitments.proposalHours` | no se dibuja | `[CONFIRMAR]` |

```ts
// src/scripts/lecturas.ts — lecturas M (medidas ahora). Sin red, sin cookies, sin terceros.
export interface Lecturas { kb: number | null; solicitudes: number; terceros: number; cookies: number; }
export function leerPagina(): Lecturas {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceResourceTiming | undefined;
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const propio = location.origin;
  const mismo = res.filter((r) => new URL(r.name).origin === propio);
  const terceros = res.filter((r) => { const u = new URL(r.name); return /^https?:$/.test(u.protocol) && u.origin !== propio; });
  // encodedBodySize existe aunque haya caché (transferSize vale 0 con caché: MDN); con 0 se usa el valor del build
  const bytes = (nav?.encodedBodySize ?? 0) + mismo.reduce((a, r) => a + (r.encodedBodySize || 0), 0);
  return {
    kb: bytes > 10_240 ? Math.round(bytes / 1024) : null,
    solicitudes: res.length + 1,
    terceros: terceros.length,
    cookies: document.cookie ? document.cookie.split(';').length : 0,
  };
}
```

Regla de lint (`scripts/lint-lecturas.ts`, antes de cada build): en el HTML construido, **ningún dígito dentro de un `aria-hidden` con `.art`** salvo en elementos con `data-scale` (rótulos de escala como `0 6 12 18 24`); todo `<output>` lleva `data-src="M|C|P"`; el arte de las ilustraciones (`.win`) no contiene cifras. La insignia `en vivo` solo aparece cuando la lectura se hizo en el cliente en esa sesión.

### 6.6 Cronómetro (banda día/noche) — probado

```ts
// src/lib/sun.ts — amanecer y atardecer sin red. Fórmulas de NOAA GML «General Solar Position Calculations»
// (https://gml.noaa.gov/grad/solcalc/solareqns.PDF; dominio público de una agencia federal de EE. UU.). γ con la hora fijada en 12:00.
const R = Math.PI / 180;
/** minutos locales desde las 00:00; lat y lon en grados (este +); tz en horas (Santo Domingo = −4, sin horario de verano) */
export function sunTimes(y: number, m: number, d: number, lat: number, lon: number, tz: number) {
  const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const g = ((2 * Math.PI) / (leap ? 366 : 365)) * (n - 1);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const c = Math.cos(90.833 * R) / (Math.cos(lat * R) * Math.cos(dec)) - Math.tan(lat * R) * Math.tan(dec);
  if (c > 1 || c < -1) return null;                                  // sol polar: no ocurre a 18° N
  const ha = Math.acos(c) / R;
  return { rise: 720 - 4 * (lon + ha) - eqt + tz * 60, set: 720 - 4 * (lon - ha) - eqt + tz * 60 };
}
/** banda de 24 h a 2 celdas por hora: '░' día, '▓' noche */
export function banda(y: number, m: number, d: number): string {
  const s = sunTimes(y, m, d, 18.4625, -69.9361, -4);            // Santo Domingo (Wikipedia: 18°27′45″ N 69°56′10″ O)
  let out = '';
  for (let i = 0; i < 48; i++) { const min = (i + 0.5) * 30; out += s && min >= s.rise && min < s.set ? '░' : '▓'; }
  return out;
}
```

**[M]** Para el 30-sep-2026 da **06:29 y 18:30**; https://www.sunrise-and-sunset.com/en/sun/dominican-republic/santo-domingo/2026/september da 06:31 y 18:28 (≤ 2 min). Con 2 celdas por hora cada celda son 30 min, así que el error no se ve; por eso **no se imprimen** amanecer y atardecer. Salida: `▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓`. Tres detalles: (1) la hora sale de `Intl`, no de `Date` local; (2) el marcador `↓` se reposiciona cada minuto con `setTimeout` alineado al minuto, y solo mientras la placa es visible; (3) sin JS la banda es la del build (día y hora de la construcción) con insignia `del build`.

### 6.7 Presupuestos

| Concepto | Presupuesto | Fuente |
|---|---|---|
| Fuentes (`latin` + `symbols2`, precargadas) | 28,9 KB | `R03` [M] |
| Póster hero (por variante) | ≤ 4 KB brotli (medido 3,3) | §6.4 [M] |
| Arte estático total | ~1,3 KB brotli | §6.4 [M] |
| JS de ASCII (primera carga) | motor + render ≤ 12 · campo + lupa ≤ 2 · lecturas + cronómetro + nav ≤ 4,5 ⇒ **≤ 18,5 KB gz**; escenas (5) con `import()` ≤ 10 ⇒ **≤ 28,5 KB gz** en total; techo duro 40 KB | `06 D31`, `05 §3.8` [C] |
| JS total de la portada | ≤ 60 KB gz (`npm run budgets`) | repo |
| LCP | < 2,5 s (objetivo 2,0), CLS 0, TBT < 200 ms, Lighthouse móvil ≥ 90 (mediana de 3) | `R01`, `R06` |
| CPU por cuadro (CPU ×4) | ≤ 6 ms por escena visible; ninguna tarea > 50 ms; horneado ≤ 16 ms en el A07 | `05 §3.8` |
| Reposo | 0 fps tras 1,6 s | `06 D18` |
| Peticiones a terceros | 0 | CSP |

**Validación en un Samsung A07 real (Helio G99, Mali-G57 MC2) = bloqueante** antes de fijar tiers y celdas máximas (`02 §8`, `05 §3.8`, `06 §4.14`). Los tiempos de los informes salen de una RTX 5070 Ti y de CPU frenada ×4; el A07 no se ha medido.

### 6.8 Accesibilidad (WCAG 2.2 AA)

| Regla | Cómo |
|---|---|
| Todo el arte es decoración | `aria-hidden="true"`, `translate="no"`, `user-select: none`, `pointer-events: none`, `data-nosnippet` en el HTML inicial; el arte de tono bajo va en `::before{content:attr(data-art)}` (axe no lo evalúa) |
| Titulares | `h1` real (LCP, sin animar); `h2` = arte + `<span class="sr-only">` con el mismo texto y tildes; `h3` de servicio, texto real |
| Listas con marcador de caja | `role="list"` en el `ul` |
| Lecturas | `<dl>` con `<output>`; sin `aria-live` (ninguna anuncia por sí sola); la insignia `en vivo` es texto |
| Movimiento | Encendido ≤ 2,6 s, después solo por entrada (2.2.2 sin botón); apagón, traspaso y destello, una vez y sin oscilación (2.3.1); reduced-motion respetado en vivo |
| Foco | `outline: 3px solid var(--accent-text)`, separación 3 px, esquinas rectas; objetivos ≥ 44 px; Tab recorre esquinas, regla y CTA; foco en un enlace ⇒ pulso del campo |
| Contraste | Pozos + tope de tono (§2.3); pares nuevos en `tokens.json` y `npm run contrast` |
| Reflow y zoom | 320 px sin scroll horizontal; ventanas re-medidas; ninguna caja recorta texto real (1.4.10, 1.4.12) |
| Idioma | `lang` y `hreflang` ya existen; ids localizados; `translate="no"` en el arte |
| SEO | `h1` → `h2` por sección → `h3` por servicio, con `id` y enlaces internos; JSON-LD `Organization` + `Service` de `04 §5.5` (sin `LocalBusiness`, sin valoraciones); `data-nosnippet` en el arte; `title` y `description` por idioma; `og:image` regenerado con el logotipo (`scripts/og.mjs`) |

### 6.9 Calidad y pruebas

`npm run seams` (`03 §2.9`, costuras a DPR 1/1,5/2/2,625/3 y cuerpos 9–24, límite 40/255) · `npm run contrast` con los pares nuevos · `npm run budgets` · `lint-lecturas` · paridad póster ↔ motor · capturas `?still&scene=<id>` en 320, 375, 414, 768, 1024 y 1440 px, en `prefers-reduced-motion` y en `forced-colors` · axe (escritorio, móvil, movimiento reducido) · Lighthouse móvil (mediana de 3) con y sin `?still` · 0 peticiones externas (`guard`) · lector de pantalla (los `h2` se recorren, el arte no se anuncia) · prueba manual de **apagón** (nada legible cambia) · **A07 real**.

### 6.10 Archivos y fases

**Nuevos**: `src/ascii/{noise,glyphs,grid,atlas,render-gl,render-canvas,engine,stage,plate}.ts` · `src/ascii/scenes/{marea,trazador,piloto,sonar,tablero,faro}.ts` · `src/lib/sun.ts` · `src/scripts/{lecturas,cronometro,nav}.ts` · `scripts/{wordmark,titulo,thumbs,carta,lint-lecturas,ascii-ramp}.mjs` · `src/components/{Portada,Placa,Indice,Ficha,Muestrario,Cinta,Faro,Esquinas}.astro` · `src/data/{services,facts}.ts` (de `04`).
**Cambian**: `Nav.astro` (esquinas + regla), `Base.astro` (una sola familia, `symbols2`, precarga), `astro.config.mjs` (proveedor `local` de dos variantes), `tokens.css` (`--fs-art`, `--cw`, `--ch`, 16 tonos), `tokens.json` (pares nuevos), `copy.ts` (§7), `site.ts` (`READY.*` a `true`), `brand.json` (`whatsappMessage.service`, `hours` opcional).
**Salen**: `Hero.astro`, `HeroCards.astro`, `hero.ts` (su lógica migra al motor), `public/hero/*.webp`, `noise.png`, `gsap` y `lenis` de `package.json`, Bricolage Grotesque de esta página.

| Fase | Entrega | Puerta |
|---|---|---|
| F0 | Fuentes locales, retícula CSS, póster de la portada, logotipo y títulos, esquinas | LCP < 2,5 s, CLS 0, `seams` verde, sin JS se ve completa |
| F1 | Motor + campo + lupa + encendido + reposo | 30 fps con CPU ×4, 0 fps en reposo, paridad póster |
| F2 | Lecturas, placa, cronómetro, carta | `lint-lecturas` verde; valores del build vs vivo |
| F3 | Ventanas: Trazador, Piloto, Sonar, Tablero (+ apagón) | ≤ 6 ms/cuadro con CPU ×4; reduced-motion; axe |
| F4 | Índice, Muestrario, Cinta, Faro, cierre | Lighthouse ≥ 90; revisión visual a seis anchos |
| F5 | A07 real, afinado de umbrales y tiers, `og:image` del logotipo | Aprobación del dueño |

### 6.11 Desviaciones respecto de los informes (y por qué)

| Informe | Decía | Aquí | Motivo |
|---|---|---|---|
| `01`/`03` | Dos voces (Bricolage + Geist Mono) o una sola | **Una sola, Geist Mono** | «Toda la página ASCII»; una familia menos y −68 KB |
| `02` | Pipeline GPU de 4 pasadas con lente de dispersión | **Campo por celda en CPU** + lupa de cuadrantes; sin dispersión | Paridad póster ↔ motor, bandas de escena, ventanas; el pipeline se midió solo en RTX |
| `03` | Rótulos de sección con figlet (Pagga/Linguaholic) | **Fuente de píxel propia 5×7** en medios bloques | Sin dependencia ni licencia ajena; coherente con el trazo del logotipo |
| `05` | Escena Web = ventana de navegador + teléfono; Santo Domingo con 5 monumentos | **Plano de página**; **solo el Faro** | `DESIGN.md` prohíbe marcos falsos de navegador y teléfono; un foco por escena y sin la carga política del Obelisco |
| `05` | Celda 8×16 (7×14 móvil) | **9×18 (6×12 móvil)** | Coincide con el paso de arte del DOM (12/18/25 px) |
| `06` | Bandas de ancho completo | **Ventanas** dentro de marcos DOM (bandas solo para el campo) | Los instrumentos son cajas con marco y texto real superpuesto |
| `06` | Póster ≤ 2 KB | **≤ 4 KB** por variante | Tres tonos; medido 3,3 KB |
| `06`/`01` | Botón de movimiento como fase 2 | **No**: nada se mueve solo tras 2,6 s | 2.2.2 sin botón |

---

## 7. Etiquetas ES/EN (todo lo nuevo; nada instructivo)

| Clave | ES | EN |
|---|---|---|
| `lecturas.titulo` | esta página | this page |
| `lecturas.vivo` / `lecturas.build` | en vivo / del build | live / from build |
| `lecturas.peso` / `.solicitudes` / `.cookies` / `.terceros` | peso / solicitudes / cookies / terceros | weight / requests / cookies / third parties |
| `hora.lugar` / `hora.tu` | Santo Domingo · UTC−4 / tú | Santo Domingo · UTC−4 / you |
| `cuenta.faltan(n)` | faltan {n} días | {n} days left |
| `nav.about` … | Nosotros · Servicios · Referencias · Proceso · Contacto | About · Services · References · Process · Contact |
| `nav.menu` | [ Menú ] | [ Menu ] |
| `ledger.wa` | [ WhatsApp ] | [ WhatsApp ] |
| `piloto.auto` / `.persona` / `.atiende` | AUTO / PERSONA / atiende el bot · atiende una persona | AUTO / PERSON / the bot is on · a person is on |
| `piloto.chat` (arte, `aria-hidden`) | cliente · bot · «¿Tienen cita mañana?» … «Te paso con una persona.» | customer · bot · “Is tomorrow open?” … “I'll pass you to a person.” |
| `tablero.titulo` | hoja de revisión | review sheet |
| `tablero.items` | correo · 2 pasos · respaldo · wifi · apagones | email · 2-step · backup · wifi · outages |
| `tablero.estado` | ok · revisar · pendiente · sin luz · plan listo · respaldo | ok · check · pending · no power · plan ready · backup |
| `muestrario.toggle` | [ imagen \| texto ] | [ image \| text ] |
| `muestrario.abrir` | [ Abrir ] | [ Open ] |
| `muestrario.ejemplo` | ejemplo | sample |
| `muestrario.todas` | [ Ver todas ] | [ See all ] |
| `proceso.pasos` | `04 §2.5` | `04 §2.5` |
| `contacto.copiar` / `.copiado` | [ Copiar correo ] / Copiado | [ Copy email ] / Copied |
| CTA | «Escribir por WhatsApp» | «Message us on WhatsApp» (vigente en `copy.ts`) |

Micro-decisión: el CTA vigente en `copy.ts` es «Escríbenos por WhatsApp»; los informes y las maquetas usan «Escribir por WhatsApp». Se elige **una** y se usa en portada, fichas y cierre.

---

## 8. Riesgos y decisiones abiertas

**Riesgos.**

1. **Mono en todo puede sentirse denso o monótono.** Mitigación: contraste de escala (titular 40–62 px 800 frente a etiquetas de 13 px), bloques sólidos de logotipo y títulos, aire (≥ 40 % de vacío por escena) y un solo acento. Se valida con el dueño en la maqueta de F0 antes de construir el resto.
2. **Las lecturas pueden exponer un valor incómodo** (una extensión suma un tercero; la caché altera el peso; un teléfono lento). Mitigación: solo se publican medidas que no dependen del dispositivo (peso, solicitudes, cookies, terceros); se muestra el valor real, sin colores de semáforo; respaldo `del build`; la lectura de carga está apagada.
3. **El apagón puede leerse como un error.** Mitigación: solo cambia el fondo, el texto nunca se atenúa, hay una lámpara `respaldo`, ocurre una vez y por scroll; en reduced-motion no ocurre.
4. **Rendimiento sin validar en el A07.** El campo por celda y la lupa están estimados con CPU ×4 (`05`), no medidos en dispositivo. Bloqueante en F5.
5. **La cuenta del e-CF envejece** (caduca el 15-nov-2026) y toca un tema fiscal: sin asesoría, solo hecho y fecha (`04 D20`); el lint la retira.
6. **Silueta de La Española** hecha a mano en este documento: aprobar solo la horneada desde Natural Earth. **El Faro** es esquemático: compararlo con la foto CC BY-SA de Commons (`05 §1.6`).
7. **Geometría del logotipo**: G, A e Y son distancias a segmentos; hay que revisar kerning óptico y la abertura de la G a cada tamaño (112×12, 84×9, 54×7) antes de fijarlo; el diseñador del logo definitivo (pendiente del dueño) puede sustituirlo editando un solo archivo.
8. **Navegadores sin medir**: costuras de bloques en Safari y Firefox (`03`); `animation-timeline` no existe en Firefox (5,7 % en RD): la capa DOM degrada a contenido visible.
9. **`[CONFIRMAR]` de `04`** bloquea la build de producción: apps nativas, tienda con pasarela y e-CF, API de WhatsApp, agente de IA con datos, edición de video, Google Ads, SLA y soporte remoto.
10. **Nombre de marca** (Gaya Digital / Gaya Group) sin unificar: afecta JSON-LD y la placa.

**Decisiones para el dueño.**

| # | Decisión | Recomendación |
|---|---|---|
| 1 | Lecturas públicas `peso / solicitudes / cookies / terceros` | Sí; sin carga (LCP) |
| 2 | Apagón como momento firma | Sí, con la prueba manual de §6.9 |
| 3 | Cuenta regresiva del e-CF | Sí mientras esté vigente; se retira con el lint |
| 4 | Solo Geist Mono | Sí |
| 5 | Reloj del visitante junto al de Santo Domingo | Sí, solo si su zona difiere |
| 6 | CTA único («Escríbenos» / «Escribir») | «Escribir por WhatsApp» |
| 7 | Franja de horario hábil en el cronómetro | Solo cuando el dueño publique `hours` |
| 8 | Referencias en el Muestrario | Solo las construidas; conteo real |
| 9 | Fase 2 | Cuatro páginas de servicio que reutilicen el motor (`06 D35`) |

---

## 9. Fuentes

**Leídas hoy [V]:** Oxide × Pentagram https://www.pentagram.com/work/oxide · Ratatui, widgets https://ratatui.rs/showcase/widgets/ · Sparkline https://en.wikipedia.org/wiki/Sparkline · Magic Ink https://worrydream.com/MagicInk/ · MDN `LargestContentfulPaint` https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint · `PerformanceResourceTiming.transferSize` https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize · `LayoutShift` https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift · NOAA GML, General Solar Position Calculations https://gml.noaa.gov/grad/solcalc/solareqns.PDF (coeficientes) y https://gml.noaa.gov/grad/solcalc/calcdetails.html (solo cita a Meeus) · Ratatui `Gauge` https://docs.rs/ratatui/latest/ratatui/widgets/struct.Gauge.html y `symbols/bar.rs` https://raw.githubusercontent.com/ratatui/ratatui/main/ratatui-core/src/symbols/bar.rs · Wikipedia «Santo Domingo» https://en.wikipedia.org/wiki/Santo_Domingo · Amanecer/atardecer de Santo Domingo, sept. 2026 https://www.sunrise-and-sunset.com/en/sun/dominican-republic/santo-domingo/2026/september.
**Por ficha de terceros [S]:** Teenage Engineering https://design.withfudge.com/share/teenage.engineering-design · Widgets de btop++ (gráficos con braille o bloques) https://github.com/aristocratos/btop.
**No verificadas [C]:** el barrido de agujas al encender como práctica de tableros (no se encontró fuente); la lupa de cuadrantes (pseudocódigo sin ejecutar); las estimaciones de peso de JS.
**Informes de la serie:** `docs/ascii/research/01-showcase.md` · `02-gpu-ascii.md` · `03-typography-accessibility.md` · `04-services-content.md` · `05-illustration-engine.md` · `06-motion-architecture.md`. Repo: `src/scripts/hero.ts`, `src/styles/tokens.css`, `src/components/Hero.astro`, `PRODUCT.md`, `DESIGN.md`, `CONTRACT.md`, `brand.json`, `src/data/references.json`.
**Mediciones propias [M]:** contrastes de los 16 tonos con `src/lib/color.mjs`; tamaños de póster y arte con brotli 11/gzip 9; `marea.ts`, `sun.ts` y las piezas de arte ejecutados en Node 24.19; capturas en Chrome (Playwright del proyecto, Geist Mono real embebida como `data:`) a 1440×900 y 390×844. No se modificó ningún archivo del proyecto salvo este documento.
