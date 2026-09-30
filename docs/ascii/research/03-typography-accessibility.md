# 03 · Tipografía y maquetación en modo texto, y accesibilidad

> Investigación cerrada el 30-sep-2026 para la nueva web «toda en arte ASCII» de Gaya Digital.
> Alcance: fuente monoespaciada, celdas y marcos de caja, rótulos gigantes (figlet y alternativas), accesibilidad, legibilidad, SEO.
>
> **Cómo leer las etiquetas de evidencia**
> - **[medido]**: comprobado por mí leyendo los woff2 reales de `node_modules` (fontkitten / `@capsizecss/unpack`) o renderizando en **Chrome 154 estable, Windows 11** (Playwright, canal `chrome`, fuentes embebidas como `data:`). Reproducible con el código del final.
> - **[documentado]**: dicho por la fuente citada (URL en cada punto y en §5).
> - **[no verificado]**: hipótesis razonada. No se pudo probar aquí (no hay WebKit ni Firefox de Playwright instalados; no se ejecutaron builds).
>
> No se ha tocado ningún archivo del proyecto salvo este documento. El código de §2 son propuestas originales; lo marcado «probado» se ejecutó de verdad.

---

## 0. Resumen ejecutivo

1. **Una sola familia para toda la página: Geist Mono Variable** (OFL-1.1, ya instalada en `@fontsource-variable/geist-mono`). Pesos 100–900, avance constante **0,600 em**, **sin ligaduras**, y es de las tres únicas mono de fontsource que sirven caja y bloques (subconjunto `symbols2`, 5,8 KB). Con `latin` son **28,9 KB** en total.
2. **JetBrains Mono, IBM Plex Mono, Space Mono, Martian Mono, Source Code Pro, Noto Sans Mono, DM/Red Hat/Sometype/Fragment/Azeret Mono NO traen `┌─┐█▀▄`** en sus paquetes de fontsource (Google Fonts las recorta). El navegador cae a una fuente del sistema con otro avance y el arte se descuadra. Solo Geist Mono, Fira Code y Cascadia Code las sirven.
3. **`line-height: 1.3` (la altura «natural» de Geist Mono) produce costuras visibles** en Chrome: hasta una línea negra completa entre filas de `█` (14, 17 y 24 px a DPR 2) y roturas en `│` (14 y 17 px). **La receta medida que las elimina en 72 de 72 combinaciones** (DPR 1–3, 9–24 px; también tamaños fraccionarios) es
   `line-height: calc(round(down, 1.3em, 1px) - 1px)`.
4. **Bug real en el proyecto**: el fallback métrico automático de Astro para Geist Mono sale con `size-adjust: 85.986 %` (Courier New encogido un 14 %). Causa: lee el primer subconjunto (cyrillic-ext), donde faltan las letras latinas. Con el subconjunto `latin` daría ≈ 100 %. Lo mismo le pasa a Bricolage Grotesque (132,57 % en vez de 111,04 %). Arreglo en §2.2.
5. **Geist Mono no tiene**: Braille, flechas `← →`, geométricas `■ ● ▲ ◆`, `✓`, `≈ ≠ ≤ ≥`. Sí tiene todo el Latin-1 (español completo), `» « · • … – — ↑ ↓ −` y los 160 glifos de caja + bloques (incluye cuadrantes `▘▝▖▗▚▞▙▛▜▟` y esquinas redondeadas `╭╮╰╯`). Alta resolución sin Braille: **medios bloques y cuadrantes**.
6. **El arte decorativo va en un atributo `data-art` y se pinta con `::before { content: attr(data-art) }`** [probado]. No entra en el DOM (nada que leer, copiar, traducir ni indexar) y **axe/Lighthouse no lo evalúan**. Con texto real en el DOM y tono bajo, axe da `color-contrast` como violación **aunque tenga `aria-hidden`** [medido]. Un titular lleva `<span class="sr-only">` con el texto y el arte con `aria-hidden`.
7. **Rótulo gigante: no usar ANSI Shadow de figlet para la marca** (86 columnas para «GAYA DIGITAL», autor desconocido, licencia sin aclarar, lo usa todo el mundo). Para la marca: **generador propio texto → contorno vectorial → bloques Unicode** [probado, código en §2.6]. Figlet solo para rótulos pequeños y con fuentes de licencia clara (Pagga WTFPL, Linguaholic MIT).
8. **Mono para todo, con reglas**: párrafos ≤ 62 ch, ≤ 5 líneas, interlínea 1,65, peso 400; contenido largo se trocea en listas. La evidencia dice que la mono no es más lenta en frases sueltas pero que para texto corrido la proporcional es mejor; una web de marketing con bloques cortos lo tolera.
9. **Arte con tono ≥ 3:1 sobre `--surface` (L OKLCH ≥ 0,48) cuando es figura, y L ≤ 0,50 cuando queda detrás de texto** (calculado con los tokens Cobalto).
10. **Cero peticiones externas**: ninguna de estas técnicas necesita red; el cálculo de fuentes y figlet ocurre en build.

---

## 1. Hallazgos

### 1.1 Método

- Abrí con `fontkitten` (dependencia de Astro, ya en `node_modules`) los woff2 de `@fontsource-variable/{geist-mono,jetbrains-mono,martian-mono}` y, en memoria (sin guardar), los de `cascadia-code` y `fira-code` desde jsDelivr, leyendo `cmap`, avances, `hhea`/`OS/2`, `GSUB` y cajas de glifo.
- Descargué `unicode.json` de 25 paquetes de fontsource (texto) para ver qué subconjuntos sirven de verdad.
- Rendericé con Chrome 154 (canal `chrome` de Playwright) páginas con Geist Mono embebida como `data:` (Chrome bloquea fuentes `file://` por CORS; con `file://` el test cayó en Consolas sin avisar: `document.fonts.check` devolvía `true`. **Trampa de QA**: comprobar `document.fonts` por estado `loaded` y medir el avance).
- Analicé píxeles de capturas (sharp) para medir costuras (§1.4).
- Leí las cabeceras de licencia de los 332 `.flf` de figlet.js y crucé sus glifos con el `cmap` de Geist Mono.

### 1.2 Qué mono sirven caja y bloques de verdad [medido]

`unicode.json` de fontsource 5.3.0 y woff2 reales:

| Paquete (fontsource 5.3.0) | Subconjuntos servidos que importan | Caja 2500–257F | Bloques 2580–259F | Braille | Ligaduras `calt` | Avance | Alto natural | Peso woff2 |
|---|---|---|---|---|---|---|---|---|
| **Geist Mono Variable** (100–900) | `latin`, `latin-ext`, **`symbols2`**, cyr, cyr-ext, vi | **128/128** | **32/32** | no | **no** (GSUB: ccmp, dnom, frac, locl, numr) | **0,600** | 1,300 | latin 23,1 KB · symbols2 5,8 KB |
| Fira Code Variable (300–700) | … **`symbols2`** | 128/128 | 32/32 | no | sí | 0,600 | 1,312 | latin 36,3 · symbols2 4,1 |
| Cascadia Code Variable (200–700) | … **`symbols2`**, **`braille`** | 128/128 | 32/32 | **256/256** | sí | 0,586 | 1,162 (pero `█` mide 1,321) | latin 48,6 · symbols2 10,7 · braille 8,1 |
| JetBrains Mono Variable (100–800) | latin, latin-ext, cyr, greek, vi | **0** | **0** | 0 | sí | 0,600 | 1,320 | latin 40,4 |
| Martian Mono Variable (wght 100–800, wdth 75–112,5) | latin, latin-ext, cyr | **0** | **0** | 0 | sí | 0,700 (wght) · 0,750 (wdth) | 1,200 | latin 23,6 · 38,5 |
| IBM Plex Mono, Space Mono, Source Code Pro (est. y variable), Noto Sans Mono, DM Mono, Red Hat Mono, Sometype Mono, Fragment Mono, Azeret Mono, VT323, Share Tech Mono, Major Mono Display | latin, latin-ext, (cyr/greek/vi) | **0** | **0** | 0 | (varía) | ~0,6 | — | — |
| Commit Mono, Iosevka, Unifont, DejaVu Sans Mono (fontsource) | sin `unicode.json` (no son de Google Fonts) | no analizado por subconjunto | | | | | | Iosevka: 53 MB de paquete |

Notas:
- **IBM Plex Mono sí tiene U+2500–259F desde v2.3, pero Google/fontsource no lo sirve**: issue fontsource #1387 y PR google/fonts #11057 (`symbols2` en METADATA) siguen **abiertos a 28-sep-2026** [documentado]. Un caso real: la documentación de Node.js se rompía en Android por esto.
- **JetBrains Mono aguas arriba parece tener caja** (el autor de «The Monospace Web» la elige por eso y dice que aguanta interlineado 120 % [documentado]; no verifiqué el TTF oficial). Pero **el paquete de fontsource no la trae**; comprobado en los woff2 y en `unicode.json`. Quien use `@fontsource/jetbrains-mono` verá caja de otra fuente.
- **Departure Mono** (OFL, no está en fontsource): v1.500 tiene 1 186 glifos con caja y parte de los bloques; es pixel puro, **solo se ve nítida en múltiplos de 11 px** y es un solo peso [documentado]. No sirve para un sistema con `ch`/pasos fraccionarios ni para párrafos.
- **Commit Mono**: OFL, variable, dice incluir caja, bloques, Braille, flechas y geométricas; recomienda peso 400 en modo oscuro y 450 en claro; sus ligaduras van en `calt` [documentado]. Habría que autoalojar el woff2 aparte del ecosistema fontsource y verificar el `cmap` real. Candidata de reserva si algún día hace falta Braille+geométricas en una sola familia.
- Ninguna fuente Google/fontsource trae Braille salvo Cascadia (aparte, con su propio avance 0,586 → no se puede mezclar con Geist en la misma fila).

### 1.3 Geist Mono en detalle [medido]

**Métricas (unidades por 1000):** `unitsPerEm` 1000 · ascent 1005 · descent −295 · lineGap 0 → **alto de contenido 1,300 em** · avance **600** en todas las letras (y en Chrome medí 0,600 em en los 9 pesos 100–900, así que `1ch = 0,6em` siempre) · `capHeight` 710 · `xHeight` 530 · `xAvgCharWidth` 600 en `latin`.

**Geometría de la caja (peso 400):**

| Glifo | y mín … y máx | x mín … x máx | Comentario |
|---|---|---|---|
| `─` U+2500 | 268 … 352 (grosor 84) | −5 … 605 | sobrepasa 5 uds. por cada lado: conecta en horizontal siempre |
| `│` U+2502 | −345 … 965 (1310) | 258 … 342 | sobrepasa 5 uds. arriba y abajo de 1300: conecta en vertical **si el paso ≤ 1,30 em** |
| `═` `║` | 184…436 · −345…965 | | doble línea |
| `█` U+2588 | −340 … 960 (1300) | 0 … 600 | exactamente 1,30 em; **desplazado 45 uds. hacia abajo respecto de la caja de línea** (−295…1005): la primera fila tiene un hueco de 0,045 em arriba y la última rebasa 0,045 em por abajo → `overflow: clip` sin `padding-block: .05em` recorta la última fila |
| `▀` / `▄` | 310…960 / −340…310 | 0 … 600 | mitades a 310, justo debajo de la mitad de la caja |
| `░ ▒ ▓` | ▓: −394…1041 | ▓: −54…581 | rebasan la celda (son patrones), no son sólidos |

**Grosor de las líneas de caja según peso** [medido en Chrome, a 100 px de cuerpo]:

| wght | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `│` (em) | 0,037 | 0,055 | 0,072 | 0,090 | 0,097 | 0,110 | 0,117 | 0,130 | 0,137 |
| `─` (em) | 0,036 | 0,056 | 0,067 | 0,087 | 0,099 | 0,107 | 0,116 | 0,120 | 0,136 |

Regla que se deriva: **grosor ≥ 1 px CSS** → peso mínimo según el tamaño de la celda:

| Cuerpo del arte | 9 px | 10 px | 12 px | 14 px | 16 px | 20 px | ≥ 24 px |
|---|---|---|---|---|---|---|---|
| wght mínimo para trazo ≥ 1 px | 600 | 500 | 400 | 300 | 250 | 200 | 100–150 |

**Inventario de glifos utilizables fuera de ASCII** (leído del `cmap`):
- **Latin-1 completo** (95/96): `¡ ¿ « » · × ÷ ± ° ª º § ¶ © ® ¼ ½ ¾ á é í ó ú ñ ü Á É Í Ó Ú Ñ Ü` … español e inglés cubiertos sin `latin-ext`.
- Puntuación: `– — ‘ ’ “ ” „ ‚ • … ′ ″ ‹ › ⁄ € ™ −`, flechas `↑ ↓` (solo esas).
- **Caja y bloques: 160/160** (`╭╮╰╯`, dobles, gruesas, discontinuas, diagonales `╱╲╳`, `▀▄█▌▐`, `░▒▓`, octavos `▁▂▃▅▆▇▏▎▍▋▊▉`, cuadrantes `▖▗▘▙▚▛▜▝▞▟`).
- **No están**: `→ ←` (U+2190/2192), `■ □ ▪ ▫ ● ○ ▲ ▶ ◆` (geométricas U+25A0–25FF), `✓ ✗ ★`, `≈ ≠ ≤ ≥ ∞`, Braille U+2800–28FF. **Cualquiera de ellos cae a una fuente del sistema con otro avance.** Para flechas usar `->`/`>`/`»`, o dibujarlas con caja (`──▶` no; `───»` sí).

**Ligaduras**: Geist Mono no tiene `calt`/`liga`; JetBrains, Martian, Fira y Cascadia sí (`calt`). En arte ASCII las secuencias `->`, `=>`, `|-`, `\\`, `//`, `<=`, `::`, `##`, `/*` se convertirían en ligadura y rompen el dibujo. Aun así se fuerza `font-variant-ligatures: none` para blindar futuros cambios de fuente.

### 1.4 Costuras entre filas: el hallazgo que decide el CSS [medido]

Prueba: `pre` de 24×10 `█` (blanco sobre negro), y de `│`/`─`, con Geist Mono real, capturado a distintos DPR; se mide el hueco (0–255) entre filas y entre columnas en el interior del bloque. Ruido de base: 8–24/255 (3–9 %), invisible.

| `line-height` | Resultado |
|---|---|
| **`1.3`** (sin unidad) | Costuras visibles en casi todo tamaño no múltiplo de 10: 34–163/255 a DPR 1–2; **255/255 (línea negra completa) con 14 y 17 px a DPR 2, 2,625 y 3, y con 24 px a DPR 2**. Solo 10 y 20 px salen limpios (salvo 20 px a DPR 1,75 y 2,625). `│` con roturas totales en 14 y 17 px (DPR 2, 2,625). |
| `floor(1.3·fs)` px | Casi todo ≤ 21/255, pero **falla a DPR fraccionario**: 20 px a DPR 2,625 → 93/255; 20 px a DPR 1,75 → 43. `│` roto 16–29/255 en algunos. |
| `ceil(1.3·fs)` px | Igual o peor que 1.3. |
| `floor(1.3·fs·dpr)/dpr` (alinear a píxel físico) | **No mejora, a veces peor** (255/255 a 17 px, DPR 2,625). |
| **`floor(1.3·fs) − 1` px** | **Entre filas ≤ 21/255 en 72/72 combinaciones** (DPR 1, 1,5, 1,75, 2, 2,625, 3 × 9…24 px; entre columnas ≤ 36/255) y también con tamaños fraccionarios (8,385 / 9,7 / 11,37 / 13,61 / 15,2 / 19,83 px: ≤ 32/255 en el peor caso, 8,4 px a DPR 2). `│`: 0–10/255 siempre. |

**Explicación**: cada fila de un glifo antialiásado que termina en frontera fraccionaria se compone con la fila vecina dejando un hueco (1 − (1−a)(1−b) < 1). Solidificarlo exige que las filas **se solapen ≥ 1 px físico**; por eso el paso entero **y** 1 px por debajo de la altura del glifo es el único robusto a cualquier DPR.
`─` (horizontal) **nunca tuvo costura** (sobrepaso de 5 uds. por lado).
Quedan **micro-costuras verticales entre `█` contiguos** (~9 %) cuando el avance es fraccionario (8,4 px). `-webkit-text-stroke: .3px currentColor` las baja a ≤ 5/255 (0,5 px → ≤ 3/255); **aplicar solo al arte sólido (wordmark)**, porque engorda las líneas de caja.

Comprobado también en Chrome 154: `font-size` de 3–9 px se respeta sin mínimo (celda = 0,6·fs); los mínimos de fuente de Chrome/Firefox son ajustes del usuario (locale CJK usa mínimos altos) → **riesgo [no verificado]** de arte descuadrado en esos usuarios. Referencia: Chromium 36429 (minimum font size).
Otro dato medido: cuando la fuente no carga, Windows cae a **Consolas (avance 0,5498 em)**, un 8 % más estrecha: `monospace` a secas en Windows **no** es 0,6 em. Courier New sí (1229/2048 = 0,6001).

### 1.5 Bug del fallback métrico de Astro [medido]

Estado actual (`dist/index.html`): `"Geist Mono Variable-… fallback: Courier New"` con `size-adjust: 85.986%; ascent-override: 116.8795%; descent-override: 34.3079%`.

Causa reproducida: `astro/dist/assets/fonts/infra/capsize-font-metrics-resolver.js` calcula `sizeAdjust = (xWidthAvg_fuente/upm) / (xWidthAvg_fallback/upm)` con el `xWidthAvg` del **primer archivo** de la familia. Con `@capsizecss/unpack` sobre cada subconjunto de Geist:

| Subconjunto | xWidthAvg | ratio vs Courier New (0,6001) |
|---|---|---|
| cyrillic-ext, cyrillic, latin-ext, symbols2, vietnamese | **516** | **0,85986** (el que sale) |
| **latin** | **600** | **0,99984** (el correcto) |

Efecto: durante el `swap`, el texto y el arte en fallback ocupan un **14 % menos** de ancho, y al llegar la fuente todo se reordena (CLS) y el arte de columnas fijas se desalinea. Con el fallback bien calculado (100 %), `line-height` explícito y `font-display: swap`, el cambio de fuente **no mueve el layout** (solo cambia el trazo de los glifos).
Mismo fallo en Bricolage Grotesque: emitido 132,57 % (subconjunto latin-ext, xWidthAvg 591), correcto 111,04 % (latin, 495; ascent 83,76 %, descent 24,32 %).

Además el proveedor `npm` de Astro **ignora `subsets: ['latin']`**: en `dist/` salen los seis `@font-face` de Geist (cada archivo solo se baja si la página usa su rango) y `preload` es todo-o-nada (la portada precarga hoy los 3 archivos de Bricolage = 68,6 KB). Con `preload` sobre Geist se precargarían los 6 (71 KB).

### 1.6 Braille, cuadrantes y resolución [medido / documentado]

- Cascadia sirve Braille (256/256) pero con avance 0,586 em: mezclar sus puntos con Geist en una fila desalinea 2,3 % por columna (2,8 caracteres de error en 120 columnas). Los puntos ocupan solo 0,79 em de una celda de 1,3 em: **necesitan `line-height` ≈ 0,85 em**, incompatible con los bloques en la misma región. Diri (issue #450) y xterm (PR de jaunt) dibujan caja/Braille por procedimiento porque «los puntos de Braille son inconsistentes entre fuentes» y las costuras son de fuente/celda.
- **Decisión**: sin Braille en v1. Resolución con **medios bloques** (`▀▄█`, píxel de 0,60 × 0,65 em → relación 0,92, casi cuadrado) y **cuadrantes** (`▘▝▖▗▚▞▙▛▜▟` + `▀▄▌▐█`, subpíxel de 0,30 × 0,65 em). Un carácter «de letra» tiene proporción 0,6 : 1,3 = 0,46 → al convertir imágenes a ASCII hay que compensar ×2,17 en vertical.

### 1.7 Figlet [medido]

- figlet 1.12.0, **MIT**, `type: module`, 18,9 MB desempaquetado (fuentes), 332 fuentes `.flf`. Import Node: `import figlet from 'figlet'` (condición `node` → `node-figlet.mjs`, lee `fonts/` con fs); también `figlet/fonts/<Nombre>` para importar la fuente como módulo y `figlet.parseFont(nombre, datos)`. Opciones: `font`, `horizontalLayout` (`default|full|fitted|controlled smushing|universal smushing`), `verticalLayout`, `width`, `whitespaceBreak`.
- **Cobertura frente a Geist Mono** (cruce de los 332 `.flf` con el `cmap`): 218 son ASCII puro (seguras con cualquier fuente), **24 usan caja/bloques y están 100 % cubiertas por Geist Mono** (ANSI Regular, ANSI Shadow, Bloody, Calvin S, Delta Corps Priest 1, DOS Rebel, Rebel, Electronic, Pagga, miniwi, RubiFont, Shaded Blocky, Stforek, The Edge, THIS, Terrace, Tmplr, Stronger Than All, Babyface Leet, BlurVision ASCII, Linguaholic Mini Block/Neon/Rounded/Shadow 3D) y 90 usan algo que Geist no tiene (p. ej. `■` U+25A0 en 18 fuentes, `∏ ∑ √ ∞ ∫`, Latin Ext-A en ANSI Compact, `▪` en Elite). Ignorar `U+FFFD` y `U+7F`: son artefactos de codificación de los `.flf`.
- **Licencias** (cabeceras): ANSI Shadow, ANSI Regular, Calvin S, Elite, The Edge, THIS: «Font Author: ?», conversiones de TheDraw (roysac.com) sin licencia; Delta Corps Priest 1: «CoSMiC cHiLD», sin licencia; Standard/Slant/Big/Small/Block/Lean/Shadow: Glenn Chappell et al., «permiso para modificar si se pone el nombre del modificador»; **Pagga: WTFPL v2** (Sam Hocevar); **Linguaholic Mini Block/Neon/Rounded/Shadow 3D: MIT 2026, «originales, no derivadas»**; ANSI Compact: MIT (Loic Cressot). El *resultado* de renderizar un texto no es la fuente, pero **para una marca que quiere ser referencia no conviene apoyarse en fuentes de origen dudoso ni en el rótulo que usa medio internet**.
- **Anchos medidos** (mini-renderizador «fitted», sin smushing): ANSI Shadow «GAYA» = **34 col × 7 filas**, «GAYA DIGITAL» = **86 × 7**; Delta Corps Priest 1 «GAYA» = 48 × 9, «GAYA DIGITAL» = 122 × 9; Calvin S «GAYA DIGITAL» = 31 × 3; Pagga = 46 × 3, «Servicios» = 36 × 3; Linguaholic Neon/Rounded «Servicios» = 71 × 8; ANSI Compact «Servicios» = 48 × 6.
  Consecuencia: 86 columnas en 343 px útiles de un móvil de 375 px dan `font-size` = 343/(86·0,6) = **6,6 px**, ilegible como arte. En móvil el rótulo tiene que **apilarse** («GAYA» 34 col → 16,8 px; «DIGITAL» ≈ 48 col → 11,9 px) o ser otra variante.
- Ojo: la mayoría de `.flf` **no traen `ñ á é`** (o los dejan en blanco); el texto del arte debe pasarse por `normalize('NFD').replace(/\p{M}/gu, '')` y el texto real accesible conserva las tildes.

### 1.8 Accesibilidad y normas [documentado + medido]

- **WCAG 1.1.1**: el arte ASCII exige alternativa de texto (técnica **H86**, fallo **F72** por «ASCII art sin alternativa»), y la decoración pura debe poder ignorarse por la tecnología asistiva. → wordmark y rótulos: texto real + arte `aria-hidden`.
- `aria-hidden` **gana** a `aria-label` en el mismo elemento: no combinarlos. `role="img"` + `aria-label` solo para arte con significado sin texto equivalente al lado.
- **WCAG 1.4.5 (texto como imagen)**: los logotipos son «esenciales». El arte hecho con caracteres de fuente cumple además con la técnica «CSS para presentación».
- **WCAG 1.4.3**: la decoración pura no tiene requisito de contraste. Pero **axe (y por tanto el audit `color-contrast` de Lighthouse) NO respeta `aria-hidden`** [medido]:

  | Marcado del arte de tono bajo (≈2,2:1) | axe (wcag2a/aa/22aa) |
  |---|---|
  | texto en el DOM + `aria-hidden` | **violación `color-contrast`** |
  | texto en el DOM, tono alto (≥4,5:1) | sin violación |
  | texto en DOM con `opacity: .35` sobre tono alto | **violación** |
  | texto con `background-clip:text` + relleno transparente | «por revisar» (no falla) |
  | `<svg><text>` | «por revisar» |
  | **`::before { content: attr(data-art) }`** | **sin violación, sin incompletas** |

  Medido además: `innerText` de la página con arte en `data-art` solo contiene el texto real («Gaya Digital … Texto real»): el arte no se lee, copia, ni traduce.
- **WCAG 1.4.10 Reflow** (320 px sin scroll en dos dimensiones): las excepciones cubren mapas/diagramas necesarios; **el arte decorativo no está exceptuado**, así que debe reescalar/reordenar en vez de desbordar. Contenido real (texto, listas) siempre fluye. **1.4.12 Espaciado de texto** (interlínea 1,5, párrafo 2, letra 0,12, palabra 0,16 em): aplica a texto real; el arte decorativo queda fuera de alcance, pero no debe tapar ni recortar el texto real cuando el usuario lo aplique (los marcos se miden con `ResizeObserver`).
- **`text-size-adjust`**: `html` ya trae `-webkit-text-size-adjust: 100%` (mantener; `none` sería mala idea para baja visión). Con `viewport` correcto, el font boosting de Chrome Android no se activa en `pre`.
- **`forced-colors`**: fuerza `color`, `background`, `border`, y pone `text-shadow`, `box-shadow` y `background-image` no-URL en `none`; MDN recomienda solo retoques. Comprobado: **un arte con degradado `background-clip:text` + relleno transparente sigue visible** en Chrome 154 con `forcedColors: 'active'` (se pinta en `CanvasText`); aun así se añade el override por robustez.
- **CSS `content: "x" / ""`** (texto alternativo de contenido generado): sirve para omitir decoración en lectores; el soporte de exposición a AT es desigual (Roselli, Soueidan) → no nombrar controles con esto. Para decoración de botones/listas usar `aria-hidden` en un `<span>` o pseudo con la doble declaración `content:"x"; content:"x" / "";`.
- **SEO**: Mueller (feb-2019): texto oculto para lectores de pantalla «no es un problema». El `<h1>` con `sr-only` se indexa. Google lo trata como texto de la página; no ocultar texto *solo* para buscadores. Añadir `<title>`, meta description, JSON-LD y `og:image` renderizado.
- **`content-visibility: auto`** (Chrome 85, Firefox 125, Safari 18; sept-2025 en los tres motores) mantiene el contenido en el árbol de accesibilidad; útil para secciones de arte largas bajo el pliegue con `contain-intrinsic-size: auto <alto>`.

### 1.9 Legibilidad y fatiga [documentado]

- Butterick: «en texto de cuerpo no hay buenas razones para usar mono»; menos palabras por línea.
- Eye-tracking (Jarosch, Schlesewsky, Füssel, Kretzschmar 2019, n = 32, 112 frases): la mono **aumenta el número de fijaciones y baja su duración; el tiempo total de lectura no cambia**. Sesgo: frases sueltas, no texto largo.
- Rello y Baeza-Yates (TACCESS 2016): en disléxicos, sans, **monoespaciada** y romana mejoran el rendimiento frente a serif, proporcional e itálica.
- **Polaridad oscura**: NN/g resume que el modo claro rinde mejor «la mayoría de las veces» para visión normal y que la ventaja crece a medida que baja el tamaño de fuente (estudio de polaridad, Applied Ergonomics 2016; Piepenbrock et al. 2013 en la misma línea); para lectura larga recomienda *ofrecer* modo oscuro, no imponerlo. La explicación divulgada (pupila dilatada, halación en astigmatismo; Level Access, AstigmatismoFit) **no está en NN/g** y es de fuente secundaria. Commit Mono recomienda peso 400 en oscuro y 450 en claro para compensar. Consecuencia para Gaya (portada oscura por decisión de marca): texto ≥ 16 px, contraste alto, párrafos cortos.
- Conclusión práctica: **cuerpo ≥ 16–17 px, peso 400, interlínea 1,65, medida ≤ 62 ch, sin justificado, párrafos cortos** y el arte lejos del texto corrido.

### 1.10 Contraste de los tonos Cobalto para arte [calculado]

Sobre `--surface` (oklch .13 .05 268), sRGB con recorte de gamut:

| Token | Contraste | | L OKLCH necesaria (croma .14, matiz 262) | |
|---|---|---|---|---|
| `--ink` .96 | 17,98:1 | | 1,5:1 | L ≥ 0,315 |
| `--lead` | 14,99:1 | | **3:1** | **L ≥ 0,480** |
| `--muted` | 9,75:1 | | 4,5:1 | L ≥ 0,575 |
| `--accent-text` | 11,34:1 | | 7:1 | L ≥ 0,685 |
| `--accent` | 4,98:1 | | | |
| `--glow-1` | **1,88:1** (solo textura) | | **Techo para arte detrás de texto** (≥ 4,5:1 contra `--ink`) | **L ≤ 0,54** (contra `--lead`: L ≤ 0,50) |
| `--glow-2` | 6,04:1 | | | |
| `--glow-3` | 17,05:1 | | | |
| `--line` (.16 alfa) | ≈ 2,19:1 | | | |

---

## 2. Técnicas

### 2.1 El sistema de celda (CSS base)

Archivo propuesto `src/styles/ascii.css`. El `body` del proyecto hereda `line-height: 1.55`, `text-rendering: optimizeLegibility` y `h1–h3 { letter-spacing: -0.02em }`; **el arte debe re-declarar todo esto**, porque `letter-spacing` heredado descuadra columnas y `line-height` 1,55 abre huecos entre filas.

```css
:root {
  /* Geist Mono: avance 0,6 em (1ch), █ = 1,30 em. Paso de arte medido como robusto a cualquier DPR (§1.4) */
  --art-lh: calc(round(down, 1.3em, 1px) - 1px);
}

.art, .frame {
  font-family: var(--font-mono);
  font-weight: 400;
  font-variant-ligatures: none;
  font-feature-settings: "calt" 0, "liga" 0;
  font-kerning: none;
  font-synthesis: none;
  letter-spacing: 0;
  word-spacing: 0;
  text-indent: 0;
  text-transform: none;
  text-rendering: optimizeSpeed;
  -webkit-text-size-adjust: 100%;
  white-space: pre;
  line-height: var(--art-lh);
  user-select: none;
  pointer-events: none;
}
.art { display: block; overflow: clip; padding-block: .05em; }   /* .05em: el █ rebasa 0,045 em por abajo */
.art::before, .frame::before { content: attr(data-art); }        /* arte fuera del DOM (§1.8) */
.art--solid { -webkit-text-stroke: .3px currentColor; }           /* solo bloques sólidos */

.sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
```
Regla añadida: **usar `<span class="art">` con `display:block`, no `<pre>`, dentro de `h1–h6`** (el modelo de contenido de un encabezado es solo «phrasing»; `<pre>` es «flow» y no valida).

Texto real (todo en Geist Mono):
```css
.prose { font: 400 var(--text-m)/1.65 var(--font-mono); max-width: 62ch; text-wrap: pretty; hyphens: manual; }
```
`ch` = 0,6 em exacto; `max-width: 62ch` = 62 caracteres por línea (dentro de 45–75 del contrato).

### 2.2 Cargar la fuente sin el bug de fallback

Opción A (preferida, **basada en el código fuente de Astro; comprobar en `dist/`**): proveedor `local` con solo 2 archivos y `latin` el primero (así el resolvedor de métricas lee el archivo correcto y solo existen 2 `@font-face`):

```js
// astro.config.mjs → fonts[]
{
  provider: fontProviders.local(),
  name: 'Geist Mono',
  cssVariable: '--font-mono',
  fallbacks: ['ui-monospace', 'monospace'],
  options: {
    variants: [
      { src: ['./node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'],
        weight: '100 900', style: 'normal',
        unicodeRange: ['U+0000-00FF','U+0131','U+0152-0153','U+02BB-02BC','U+02C6','U+02DA','U+02DC','U+2000-206F','U+20AC','U+2122','U+2191','U+2193','U+2212','U+2215','U+FEFF','U+FFFD'] },
      { src: ['./node_modules/@fontsource-variable/geist-mono/files/geist-mono-symbols2-wght-normal.woff2'],
        weight: '100 900', style: 'normal',
        unicodeRange: ['U+23B8-23BD','U+2500-259F'] },
    ],
  },
}
```
y en `Base.astro`: `<Font cssVariable="--font-mono" preload />` (con 2 archivos, precarga los dos: 28,9 KB).
Después de compilar: en `dist/index.html` el `@font-face` «… fallback: Courier New» debe salir con `size-adjust` ausente o ≈ 100 %. Si no, opción B.

Opción B (manual, no depende de cómo lea Astro): `optimizedFallbacks: false` en la entrada actual y fallback propio en CSS:

```css
@font-face {
  font-family: "Gaya Mono Fallback";
  src: local("Courier New"), local("Liberation Mono"), local("Cousine"), local("Menlo"),
       local("DejaVu Sans Mono"), local("Noto Sans Mono"), local("Roboto Mono"), local("Droid Sans Mono");
  size-adjust: 100%;              /* todas avanzan ≈0,6 em: Courier New 0,6001, Menlo/DejaVu 0,602 (de memoria) */
  ascent-override: 100.5%;        /* 1005/1000 */
  descent-override: 29.5%;        /* 295/1000 */
  line-gap-override: 0%;
}
```
y `fallbacks: ['Gaya Mono Fallback', 'ui-monospace', 'monospace']`. **Nunca terminar la pila solo en `monospace` en Windows** (Consolas = 0,55 em).

Otras reglas de carga:
- `font-display: swap` con el fallback de 100 % (CLS ≈ 0). No usar `block`: retrasaría el LCP.
- **El nombre de familia lleva un sufijo con hash** (`Geist Mono Variable-120283ad8c091a43`): en JS nunca escribir el nombre; leer `getComputedStyle(el).fontFamily` (§2.4).
- Si se conserva Bricolage en otras páginas: arreglar igual (111,04 %, ascent 83,76 %, descent 24,32 %, gap 0 %). **Recomendación de alcance**: en la portada y el chrome del sitio nuevo retirar `--font-display` (−68,6 KB y una familia); la coherencia «todo ASCII» lo pide.
- Licencia OFL: añadir Geist Mono (© 2024 The Geist Project Authors) a `CREDITS.md`; no aparece hoy.

### 2.3 Arte que escala solo (sin JS): `cqi` + variantes por contenedor

```html
<div class="art-fit">
  <span class="art art--fit art--n" style="--cols:38"  aria-hidden="true" translate="no" data-art="…"></span>
  <span class="art art--fit art--m" style="--cols:72"  aria-hidden="true" translate="no" data-art="…"></span>
  <span class="art art--fit art--w" style="--cols:132" aria-hidden="true" translate="no" data-art="…"></span>
</div>
```
```css
.art-fit { container-type: inline-size; }
.art--fit { font-size: min(calc(100cqi / (var(--cols) * 0.6)), 22px); }
.art--m, .art--w { display: none; }
/* umbral = columnas de la variante pequeña × 0,6 × cuerpo objetivo (≈20 px): 38×.6×20 ≈ 456 px; 72×.6×20 ≈ 864 px */
@container (min-width: 28rem) { .art--n { display: none } .art--m { display: block } }
@container (min-width: 54rem) { .art--m { display: none } .art--w { display: block } }
```
Verificado en Chrome 154: `round(down, 100%, 1ch)` da 478,797 px = 57 × 8,4; `calc(100cqi/1ch)` y `calc(100cqi/(96*0.6))` válidos (aritmética tipada, Chrome ≥ 140); `lh` y `cqi` soportados. `round()` es Baseline 2024.

Tabla para diseñar variantes (cuerpo mínimo 9 px, `cols = ancho/(0,6·9)`):

| Ancho útil | 288 (320 px) | 343 (375) | 382 (414) | 720 (768) | 976 (1024) | 1200 (tope) |
|---|---|---|---|---|---|---|
| Columnas máximas a 9 px | 53 | 63 | 70 | 133 | 180 | 222 |
| Cuerpo al usar 38 col | 12,6 px | 15,0 | 16,8 | — | — | — |

Cuerpo mínimo de **arte**: 9 px (trazo `─` a 0,09 em = 0,8 px en 400 → subir a 500–600, §1.3). Texto real: ≥ 16 px (contrato).
Sin JS, **no hay CLS**: el arte va en el HTML.

### 2.4 Marcos de cualquier ancho

Tres niveles, de más a menos estático:

1. **Reglas** (`hr`): cadena larga recortada, exacta con `round`:
   ```html
   <span class="rule art" aria-hidden="true" data-art="────…(320 caracteres, generados en build)"></span>
   ```
   ```css
   .rule { width: round(down, 100%, 1ch); white-space: nowrap; overflow: hidden; height: 1lh; }
   ```
2. **Marcos de arte fijo** (recuadros de la portada): generados en build con la función `frame()` de abajo y variantes por contenedor (§2.3). Coste en HTML: un marco de 120×30 = 3,6 KB sin comprimir, ~200 B gzip.
3. **Marcos alrededor de contenido de alto desconocido**: capa superpuesta generada en el cliente (código probado en Chrome, redimensiona en vivo, alto múltiplo exacto de la fila):

```ts
// src/scripts/ascii-grid.ts  (probado: cols·8,4 px = ancho del host; alto = filas·17 px; 0 errores)
type Style = 'light' | 'heavy' | 'double' | 'round';
const SET: Record<Style, { tl: string; tr: string; bl: string; br: string; h: string; v: string }> = {
  light:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  heavy:  { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  round:  { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
};

export function frame(cols: number, rows: number, style: Style = 'light', label = ''): string {
  const s = SET[style];
  cols = Math.max(cols, 2); rows = Math.max(rows, 2);
  const inner = cols - 2;
  let top = s.h.repeat(inner);
  if (label && inner >= label.length + 4) {
    const tag = ` ${label} `;
    top = s.h + tag + s.h.repeat(inner - 1 - tag.length);
  }
  const mid = s.v + ' '.repeat(inner) + s.v;
  return [s.tl + top + s.tr, ...Array(rows - 2).fill(mid), s.bl + s.h.repeat(inner) + s.br].join('\n');
}

async function fontsReady(el: HTMLElement) {
  const family = getComputedStyle(el).fontFamily;                 // trae el sufijo con hash de Astro
  await document.fonts.load(`400 16px ${family}`, '0M┌─┐█▀▄');      // fuerza latin + symbols2
}

function cell(layer: HTMLElement) {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(50);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:0';
  layer.append(probe);
  const w = probe.getBoundingClientRect().width / 50;
  probe.remove();
  return { w, h: parseFloat(getComputedStyle(layer).lineHeight) };   // paso entero por --art-lh
}

function draw(host: HTMLElement) {
  let layer = host.querySelector<HTMLElement>(':scope > .frame');
  if (!layer) {
    layer = document.createElement('span');
    layer.className = 'frame';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('translate', 'no');
    host.prepend(layer);
  }
  const { w, h } = cell(layer);
  host.style.minHeight = '';                                      // alto natural
  const box = host.getBoundingClientRect();
  const cols = Math.max(2, Math.round(box.width / w));
  const rows = Math.max(3, Math.ceil(box.height / h));
  host.style.minHeight = `${rows * h}px`;                         // alto = filas enteras
  const art = frame(cols, rows, (host.dataset.frame as Style) || 'light', host.dataset.label ?? '');
  if (layer.dataset.art !== art) layer.dataset.art = art;         // se pinta con ::before
}

export function mountFrames(root: ParentNode = document) {
  const hosts = [...root.querySelectorAll<HTMLElement>('[data-frame]')];
  if (!hosts.length) return;
  const pending = new Set<HTMLElement>();
  let queued = false;
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => pending.add(e.target as HTMLElement));
    if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; pending.forEach(draw); pending.clear(); }); }
  });
  fontsReady(hosts[0]).then(() => hosts.forEach((h) => ro.observe(h)));
}
```
CSS mínima del marco (con `box-sizing: border-box`; el reset global del proyecto ya lo pone):
```css
.box   { position: relative; width: round(down, 100%, 1ch); padding: var(--art-lh) 2ch; }
.frame { position: absolute; inset: 0; overflow: clip; color: var(--accent-text); }   /* hereda .art/.frame de §2.1 */
.box > :not(.frame) { position: relative; }   /* el texto real queda por encima; no se mezcla con los caracteres del marco */
```
Sin JS el `.box` queda con un `outline: 1px solid var(--line); outline-offset: -1px` como reserva (`.box:not(:has(> .frame))`); se usa `outline` y no `border` para que no cambie el layout cuando llega la capa.
Por qué **capa superpuesta y no bordes dentro del texto**: el texto real nunca se entrelaza con `│`, así que copiar, buscar y leer con lector de pantalla no arrastran caracteres de caja.
Matiz: `frame()` con etiqueta incrustada en el borde superior (`┌─ Servicios ───┐`) es solo arte: el `<h2>` real va dentro del `.box`.

Bordes de caja **como caracteres vs bordes CSS**: los caracteres son literalmente «arte ASCII» y heredan peso/tono; los bordes CSS son exactos pero se ven «de web». Decisión: caracteres (capa `.frame`) para lo visible; borde CSS solo como reserva sin JS y en `forced-colors` para controles (§2.8).

### 2.5 Listas, árboles y datos

```css
.tree { list-style: none; padding: 0; margin: 0; }              /* HTML: <ul class="tree" role="list"> */
.tree li::before { content: "├─ "; content: "├─ " / ""; white-space: pre; color: var(--accent-text); }
.tree li:last-child::before { content: "└─ "; content: "└─ " / ""; }
.tree li { padding-left: 3ch; text-indent: -3ch; }
```
- **`role="list"` es obligatorio**: WebKit/VoiceOver quitan la semántica de lista con `list-style: none`.
- La doble declaración `content` protege a los navegadores sin sintaxis de texto alternativo.
- Tablas y datos: `<table>`/`<dl>` reales, cifras con `font-variant-numeric: tabular-nums` (en mono es redundante pero inocuo). Medida: nunca rejillas de ancho fijo en `pre` para contenido real.

### 2.6 Rótulos gigantes

**Nivel 1 · marca («GAYA», «GAYA DIGITAL») — generador propio, texto → contorno → bloques** [probado]. Usa una fuente OFL con carácter (aquí Unbounded del propio proyecto, solo como demostración de la técnica), convierte cada glifo en trazado SVG (`fontkitten`), lo rasteriza (`sharp`, ya en `devDependencies`) y lo traduce a medios bloques o cuadrantes con la proporción exacta de celda (0,6 × 1,3 em).

```js
// scripts/wordmark.mjs — uso: node scripts/wordmark.mjs <fuente.woff2> "GAYA" 72 quad|half
import { readFileSync } from 'node:fs';
import { create } from 'fontkitten';          // hoy solo es dependencia transitiva de Astro: declararla en devDependencies
import sharp from 'sharp';

const [, , fontPath, text = 'GAYA', colsArg = '60', mode = 'half'] = process.argv;
const CELL_W = 0.6, CELL_H = 1.3;
const QUAD = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];

const font = create(readFileSync(fontPath));   // getVariation() falla con woff2 variable: usar la instancia por defecto o un TTF estático
let x = 0; const paths = [];
for (const ch of text) {
  const g = font.glyphForCodePoint(ch.codePointAt(0));
  paths.push(`<path transform="translate(${x},0) scale(1,-1)" d="${g.path.toSVG()}"/>`);
  x += g.advanceWidth;
}
const H = font.capHeight;                       // se recorta a mayúsculas: sin espolones por sobrepaso en G, O, S
const cols = +colsArg, sx = mode === 'quad' ? 2 : 1, sy = 2;
const pxW = cols * sx, unit = x / pxW;
const subH = (CELL_H / sy) / (CELL_W / sx);     // proporción del subpíxel: el rótulo no se deforma
const pxH = Math.ceil(H / (unit * subH) / sy) * sy;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="0 ${-H} ${x} ${H}" preserveAspectRatio="none"><rect x="0" y="${-H}" width="${x}" height="${H}" fill="#000"/><g fill="#fff">${paths.join('')}</g></svg>`;
const { data, info } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
const on = (px, py) => px < info.width && py < info.height && data[py * info.width + px] > 127;
const out = [];
for (let y = 0; y < info.height; y += sy) {
  let s = '';
  for (let c = 0; c < cols; c++) {
    if (mode === 'quad') s += QUAD[(on(c*2,y)?1:0) | (on(c*2+1,y)?2:0) | (on(c*2,y+1)?4:0) | (on(c*2+1,y+1)?8:0)];
    else { const t = on(c, y), b = on(c, y + 1); s += t && b ? '█' : t ? '▀' : b ? '▄' : ' '; }
  }
  out.push(s.trimEnd());
}
console.log(out.join('\n').replace(/^\n+|\n+$/g, ''));
```
Resultado real («GAYA», Unbounded, 44 columnas, cuadrantes, 5 filas; con 100–140 columnas «GAYA» sale de 10–14 filas, tamaño de portada; «GAYA DIGITAL» en una línea necesita ~300 columnas para 12 filas, por eso en móvil se apila):
```
  ▄█▛▀▀█▙▖     ▗██▖    ▀█▖    ▟█▘    ▟██
▗█▛     ▝█▌   ▗█▘▝█▖    ▝█▙ ▗█▛     ▟▛ ▜▙
▐█    ▄▄▄▄▖  ▗█▘  ▐█▖     ▜██▘     ▟█   ▜▙
▝█▙     ▗█▌ ▗████████▖     █▌     ▟███████▙
  ▀█▙▄▄█▀▐▌ ▟▛      ▜▙     █▌    ▗█▘     ▝█▌
```
Renderizado en Chrome con Geist Mono (`--art-lh`, `.art--solid`, DPR 2): letras macizas sin costuras y sin espolones; los cuadrantes suavizan los diagonales frente a medios bloques. Sin recortar a `capHeight`, las curvas de G, O y S dejaban un «espolón» de una fila en los extremos (medido en la captura).
Aplicación: HTML estático generado en build en 3 variantes (`GAYA` apilado sobre `DIGITAL` en móvil; una línea en escritorio), `data-art`, `.art--solid`, color por degradado (§2.8).
Alternativa sin fuente: dibujar a mano la retícula de 5 letras (G A Y D I T L) como constantes; para 7 letras es una tarde y da un rótulo **ownable y sin licencia dudosa**.

**Nivel 2 · rótulos de sección (H2)** con figlet en build (Astro frontmatter; nada llega al cliente):
```astro
---
// src/components/AsciiHeading.astro
import figlet from 'figlet';
const { as: Tag = 'h2', text, font = 'Pagga', class: cls = '' } = Astro.props;
const ascii = text.normalize('NFD').replace(/\p{M}/gu, '');        // sin tildes: los .flf no las traen
const art = figlet.textSync(ascii, { font, horizontalLayout: 'default' });
---
<Tag class={`ah ${cls}`}>
  <span class="sr-only">{text}</span>
  <span class="art" aria-hidden="true" translate="no" data-art={art}></span>
</Tag>
```
Fuentes permitidas (Geist Mono las cubre 100 % y la licencia es clara): **Pagga** (3 filas, «Servicios» = 36 col, WTFPL), **Linguaholic Mini Block** (4 filas, 31 col), **Linguaholic Rounded/Neon/Shadow 3D** (8 filas, 71 col; hechas de caja: quedan como dibujo de líneas, MIT). Standard/Slant/Big/Small/Block/Lean son ASCII puro y de licencia permisiva pero parecen 1995. Prohibidas para la marca: ANSI Shadow, Calvin S, Delta Corps Priest, Bloody, Elite, The Edge, THIS (origen/licencia sin aclarar).
Si `figlet` no encuentra `fonts/` dentro del bundle SSR de Vite: `import font from 'figlet/fonts/Pagga'; figlet.parseFont('Pagga', font)`.
Móvil: 36 col (Pagga) → 15,9 px; 71 col (Neon) → 8,0 px (ilegible): usar Pagga o dos líneas.

**Nivel 3 · titulares que siguen siendo texto real** (donde el arte no aporta): Geist Mono a 700–800, `font-size: clamp(2rem, 1rem + 5cqi, 5rem)`, `letter-spacing: 0` (el `-0.02em` global de `h1–h3` se anula en mono), `text-wrap: balance`. Es lo único que aparece en Ctrl+F, selección y traducción; conviene para los `h3`. Regla: **nunca usar `text-transform` ni `letter-spacing` negativo en mono**.

**Patrón accesible de titular** (h1 de la marca): `<h1><span class="sr-only">Gaya Digital</span><span class="art art--solid" aria-hidden data-art="…"></span></h1>` + `<title>` + `og:image` renderizado. El nombre accesible del `h1` sale del `sr-only` (los descendientes `aria-hidden` no cuentan).

### 2.7 Color del arte, alto contraste, impresión, animación

```css
.art--ink { background-image: linear-gradient(180deg, var(--glow-3), var(--glow-2) 55%, var(--glow-1));
            -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
@media (forced-colors: active) {
  .art, .frame { color: CanvasText; -webkit-text-fill-color: CanvasText; background: none; }
  canvas[data-decor] { display: none; }
  .btn { border: 1px solid ButtonText; }        /* el marco ASCII de un botón es decoración: asegurar borde real */
}
@media (prefers-contrast: more) { .art, .frame { color: var(--ink); font-weight: 500; } }
@media print {
  :root { color-scheme: light; }
  html, body { background: #fff; color: #000; }
  .art, .frame { color: #000; -webkit-text-fill-color: #000; background: none; font-size: 7pt; }
  canvas, [data-anim] { display: none; }
  a[href^="http"]::after { content: " (" attr(href) ")"; }
}
@media (prefers-reduced-motion: reduce) { /* el arte animado muestra el fotograma final generado en build; sin transiciones */ }
```
- Degradado por `background-clip:text` en **un solo elemento**, no un `span` por carácter: una capa de pintura, DOM mínimo. Con el arte en `::before` basta la regla en el host `.art`: **verificado** que el degradado pinta el texto del pseudo-elemento (blanco arriba → azul abajo) y que axe no da violación.
- Color con **tonos opacos** (nada de alfa) en `█ ▀ ▄`: el solape de 1 px del paso `−1px` duplicaría el alfa y marcaría bandas. Para atenuar, mezclar con `color-mix(in oklch, …, var(--surface))`.
- El arte detrás de texto real: L ≤ 0,50 (§1.10) y idealmente sobre panel plano `--surface`.
- Impresión: **[no verificado]**; el CSS es propuesta.

### 2.8 Rendimiento del texto grande

- **Cadena estática de arte en el HTML/atributo**; el JS solo anima una región pequeña. Actualizar `dataset.art` cambia el contenido de `::before` y fuerza layout+pintura de todo el bloque: mantener las regiones animadas ≤ ~4 000 caracteres (100×40) y aisladas con `contain: strict` + tamaño fijo (`height: calc(rows * var(--art-lh))`).
- `content-visibility: auto; contain-intrinsic-size: auto <alto>` en secciones de arte bajo el pliegue (Baseline 2025).
- `text-rendering: optimizeSpeed` en arte (el `optimizeLegibility` del `body` activa kerning y ligaduras innecesarios y encarece el texto grande).
- Animar posición de arte con `transform` fracciona los píxeles y hace parpadear las costuras: trasladar en pasos enteros o animar el contenido, no la capa. **[no verificado]**
- Weights variables: animar `font-weight` re-rasteriza los glifos por fotograma; en mono no cambia el avance (medido), pero es costoso en regiones grandes → fijar peso por elemento, no por fotograma.

### 2.9 QA automático: prueba de costuras y de fuentes

Propuesta `scripts/seams.mjs` (`npm run seams`): el mismo método de §1.4, con Chrome del sistema (como `scripts/lib/browser.mjs`). Fuente embebida como `data:` (no `file://`).

```js
// núcleo del análisis (probado): pre 24×10 de █ o │; mide el hueco entre filas
const png = await page.screenshot({ clip: { x: 8, y: 8, width: Math.ceil(w), height: Math.ceil(h) } });
const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
const cw = cellW * dpr, ch = lineH * dpr;                       // salta 2 celdas de borde
let min = 255;
for (let x = (info.width >> 1) - 3; x <= (info.width >> 1) + 3; x++)
  for (let y = Math.floor(ch * 2); y < Math.floor(info.height - ch * 2); y++) min = Math.min(min, data[y * info.width + x]);
const seam = 255 - min;                                          // límite aceptado: ≤ 40
```
Casos a recorrer: DPR {1, 1,5, 2, 2,625, 3} × cuerpos {9, 10, 12, 14, 16, 18, 20, 24} × {`█`, `│`}; comprobar además `document.fonts` (`status === 'loaded'`) y `cellW === 0,6·fs`. Pendiente: correrlo en WebKit y Firefox (no instalados aquí).
Axe: los tonos de arte **como `::before`** no se evalúan; si algún arte queda como texto en DOM, excluir `[data-decor]` en `AxeBuilder.exclude()` **y** no depender de Lighthouse (que no permite exclusiones).

---

## 3. Trampas (resumen, con evidencia)

1. **Paquetes fontsource/Google sin `symbols2`**: JetBrains, Plex, Martian, Space, Source Code Pro… → caja de otra fuente, avance distinto, arte roto. Verificar siempre con `unicode.json` y el `cmap`.
2. **`line-height: 1.3` (o 1.55 heredado del `body`)** → costuras/huecos; hasta 255/255 a DPR 2. Usar el paso entero −1 px.
3. **`letter-spacing` heredado** (`h1–h3` del proyecto: −0.02em) y `text-rendering: optimizeLegibility` → columnas descuadradas; re-declarar en `.art`.
4. **Ligaduras** en Fira/JetBrains/Cascadia/Martian (`calt`): Geist no las tiene; aun así desactivarlas.
5. **Fallback métrico automático de Astro mal calculado** (85,986 % en Geist, 132,57 % en Bricolage) → CLS y arte desalineado durante el `swap`.
6. **`monospace` a secas en Windows = Consolas (0,55 em)** → 8 % más estrecho.
7. **Glifos ausentes en Geist** (`→ ← ✓ ■ ● ◆ ▲ ★ ≈ ≤`, Braille) → fuente del sistema con otro avance en mitad de la fila.
8. **`aria-hidden` no exime del audit `color-contrast` de axe/Lighthouse**; el arte tenue va como `::before` con `attr()`.
9. **`<pre>` dentro de `h1`** no valida (usar `span` con `display:block; white-space:pre`).
10. **`list-style: none` sin `role="list"`** pierde la semántica en Safari/VoiceOver.
11. **`overflow: clip` sobre `█`** recorta la última fila (el glifo rebasa 0,045 em): `padding-block: .05em`.
12. **Fuentes `file://` en pruebas**: Chrome las bloquea por CORS y cae al sistema sin avisar; usar `data:` y comprobar `document.fonts.status`.
13. **El nombre de familia de Astro lleva sufijo con hash**: no escribir «Geist Mono Variable» en JS ni en `font:` de canvas; leer `getComputedStyle`.
14. **`text-stroke` en marcos**: engorda las líneas de caja; solo en `.art--solid`.
15. **Colores con alfa en bloques**: el solape de 1 px crea bandas más claras.
16. **Figlet**: la mayoría de `.flf` no traen `ñ á é`; 90 de 332 usan glifos que Geist no tiene; ANSI Shadow ocupa 86 columnas (6,6 px en móvil).
17. **`preload` de Astro es todo-o-nada** y su proveedor `npm` ignora `subsets`; con 6 subconjuntos de Geist precargaría 71 KB.
18. **Traductor del navegador** envuelve nodos de texto en `<font>` y rompe `pre`; `translate="no"` en el arte (y con `::before` ya no le llega).
19. **Escala ×2,17 en vertical** al pasar imágenes a caracteres (celda 0,46).
20. **Zoom solo-texto y ajustes de fuente mínima** del usuario pueden descuadrar arte en `font-size` pequeño **[no verificado]**; el contenido real nunca depende del arte.

---

## 4. DECISIONES CERRADAS para Gaya Digital

**Fuente**
1. **Geist Mono Variable (OFL-1.1) es la única familia de la página**, arte y texto. Descartadas: JetBrains, Plex, Martian, Space, Source Code Pro, Noto, DM… (sin caja en fontsource); Fira Code (ligaduras, 40 KB); Cascadia (avance 0,586, `█` 1,32 em, ligaduras, 67 KB); Departure/Commit/Iosevka (fuera de fontsource, mezclarían métricas).
2. Se cargan **solo `latin` + `symbols2`** (28,9 KB, precargados). Sin `cyrillic`, `vietnamese` ni `latin-ext` (español e inglés caben en Latin-1).
3. Configuración con proveedor `local` de 2 variantes (opción A de §2.2) o, si el fallback sale mal en `dist/`, opción B (`optimizedFallbacks:false` + `@font-face` propio a 100 %). **Se corrige también el fallback de Bricolage o se retira `--font-display` de la portada nueva** (recomendado retirar).
4. `font-display: swap`, fallback 100 %, sin `block`.
5. Añadir Geist Mono (© 2024 The Geist Project Authors, OFL-1.1) a `CREDITS.md`.

**Celda y maquetación**
6. Celda = **0,6 em × paso de arte**; **paso de arte = `calc(round(down, 1.3em, 1px) - 1px)`** (variable `--art-lh`). Nunca `line-height: 1.3` ni el 1,55 del `body` en arte.
7. **Arte decorativo = `data-art` + `::before{content:attr(data-art)}`**, dentro de un `span.art[aria-hidden][translate=no]` con `white-space:pre`, `user-select:none`, `letter-spacing:0`, `font-variant-ligatures:none`, `font-kerning:none`, `text-rendering:optimizeSpeed`, `padding-block:.05em`.
8. **Arte que escala**: contenedor `container-type:inline-size`, `font-size: min(calc(100cqi / (var(--cols) * 0.6)), 22px)` y **3 variantes** (38 / 72 / 132 columnas) conmutadas con `@container` (umbrales = columnas × 0,6 × 20 px: 28 rem y 54 rem). Cuerpo mínimo de arte 9 px; texto real ≥ 16 px.
9. **Marcos**: reglas y recuadros fijos generados en build; recuadros con contenido de alto libre = capa `.frame` con `frame()` + `ResizeObserver` (código de §2.4, probado). `round(down, 100%, 1ch)` en el ancho de cada caja. Borde CSS 1 px solo como reserva sin JS y en `forced-colors`.
10. **Pesos**: texto 400; titulares mono 700–800; arte de línea ≥ 300 con cuerpo ≥ 14 px (tabla §1.3); nunca menos de 300 en arte visible. Sólidos con `-webkit-text-stroke:.3px`.
11. **Glifos permitidos**: ASCII, Latin-1, `– — “ ” • … » « · ↑ ↓`, y caja/bloques completos. **Prohibidos** (caen a fallback): `→ ← ✓ ■ ● ◆ ▲ ▶ ★ ≈ ≠ ≤ ≥` y Braille. Flechas: `->`, `>`, `»`.
12. **Sin Braille en v1.** Alta resolución con medios bloques y cuadrantes.

**Rótulos**
13. **Marca «GAYA» / «GAYA DIGITAL»: wordmark propio** generado con `scripts/wordmark.mjs` (o dibujado a mano) en cuadrantes, 3 variantes (apilado en móvil), con `.art--solid`. **No ANSI Shadow** (86 col, origen dudoso, cliché).
14. **Rótulos de sección**: figlet en build solo con **Pagga** (WTFPL) o **Linguaholic Mini Block / Rounded / Neon** (MIT); sin tildes en el arte y texto real accesible con tildes. En móvil, Pagga o 2 líneas.
15. Subtítulos y H3: **texto real** Geist Mono 700–800 (buscables/seleccionables).

**Accesibilidad**
16. **Todo titular con arte**: `<h#><span class="sr-only">Texto real</span><span class="art" aria-hidden … data-art></span></h#>`. Un único `h1`. Nunca `role="img"` + `aria-hidden` juntos.
17. **Decoración no interactiva fuera del DOM** (`::before`); botones/listas: `<span aria-hidden>` o `content` con alternativa vacía y doble declaración. **`ul` con marcador de caja lleva `role="list"`**.
18. `forced-colors`: arte en `CanvasText`, canvas decorativos ocultos, borde real en botones. `prefers-contrast: more`: arte en `--ink`, peso +100. `print`: fondo blanco, arte negro a 7 pt, sin animaciones, URLs de enlaces visibles.
19. **Tonos de arte**: figura ≥ 3:1 (L OKLCH ≥ 0,48); detrás de texto L ≤ 0,50 y siempre sobre panel plano; tonos opacos, sin alfa; degradado por `background-clip:text` en el elemento (no por carácter).
20. Cuerpo: **17 px** (`clamp(16px, 15px + .25vw, 18px)`), interlínea 1,65, **medida 62 ch**, peso 400, sin justificar, párrafos ≤ 5 líneas; todo texto largo se trocea en listas o `dl`.
21. `html { -webkit-text-size-adjust: 100% }` se mantiene (no `none`).
22. SEO: `title`, `description`, JSON-LD y `og:image` renderizado del wordmark; `hidden text` solo `sr-only` con el mismo contenido visible como arte.

**Calidad**
23. Añadir `npm run seams` (§2.9) con límite ≤ 40/255 a DPR {1, 1,5, 2, 2,625, 3} y cuerpos {9…24}, y correrlo en WebKit y Firefox cuando estén disponibles. Comprobar `dist/` tras cambiar la carga de fuentes: sin `size-adjust: 85.986%`.
24. Regla de repositorio: el arte de tono bajo **no** va como texto en el DOM (fallaría `color-contrast`); si algún arte lo necesita, `[data-decor]` se excluye en axe.

---

## 5. Fuentes

- Geist (Vercel), licencia y repo: https://github.com/vercel/geist-font · metadatos fontsource: `node_modules/@fontsource-variable/geist-mono/metadata.json` (OFL-1.1, © 2024 The Geist Project Authors)
- fontsource, unicode.json por paquete: `https://cdn.jsdelivr.net/npm/@fontsource/<id>/unicode.json` (ej. https://cdn.jsdelivr.net/npm/@fontsource-variable/cascadia-code/unicode.json)
- IBM Plex Mono sin caja en fontsource: https://github.com/fontsource/fontsource/issues/1387 · https://github.com/google/fonts/pull/11057
- The Monospace Web (MIT; `ch`, `lh`, `round()`): https://owickstrom.github.io/the-monospace-web/ · https://wickstrom.tech/2024-09-26-how-i-built-the-monospace-web.html · https://github.com/owickstrom/the-monospace-web
- Caja en la web y subconjuntos que la quitan: https://velvetcache.org/2024/02/12/box-drawing-on-the-web/
- Costuras/fuentes de terminal: https://github.com/cristicretu/diri/issues/450 · https://github.com/moukrea/jaunt/pull/131 · https://github.com/tamirelazar/tSlime-Screensaver/issues/4
- Departure Mono: https://github.com/rektdeckard/departure-mono/releases/tag/v1.500 · https://departuremono.com/assets/README.md
- Commit Mono: https://commitmono.com/ · JetBrains Mono: https://github.com/JetBrains/JetBrainsMono
- Figlet: https://github.com/patorjk/figlet.js · https://www.npmjs.com/package/figlet · fuentes `.flf`: https://github.com/patorjk/figlet.js/tree/main/fonts (cabeceras de licencia)
- Astro Fonts API: https://docs.astro.build/en/reference/experimental-flags/fonts/ · resolvedor de métricas: `node_modules/astro/dist/assets/fonts/infra/capsize-font-metrics-resolver.js`; capsize: https://github.com/seek-oss/capsize
- CSS: aritmética tipada https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_values_and_units/Using_CSS_typed_arithmetic · `round()` https://web.dev/blog/css-stepped-value-functions · `text-size-adjust` https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-size-adjust · `forced-colors` https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors · `content` https://developer.mozilla.org/en-US/docs/Web/CSS/content · `content-visibility` https://web.dev/articles/content-visibility
- Texto alternativo en contenido generado: https://adrianroselli.com/2020/10/alternative-text-for-css-generated-content.html · https://www.sarasoueidan.com/blog/alt-text-for-css-generated-content/
- WCAG 2.2: Non-text content (H86, F72) https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html · Reflow https://www.w3.org/WAI/WCAG22/Understanding/reflow.html · Images of text https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html · Text spacing https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- Texto oculto y SEO: https://www.searchenginejournal.com/google-using-hidden-text-for-screen-readers-will-not-hurt-rankings/294605/
- Tamaño mínimo de fuente en Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=36429
- Lectura y polaridad: Jarosch et al. 2019 https://zenodo.org/records/18912221 · Butterick https://practicaltypography.com/monospaced-fonts.html · NN/g https://www.nngroup.com/articles/dark-mode/ · Polaridad, iluminación y tamaño (Applied Ergonomics 2016) https://www.sciencedirect.com/science/article/abs/pii/S0003687016302459 · Rello y Baeza-Yates (TACCESS 2016) https://www.superarladislexia.org/pdf/2016-Luz%20Rello-Fonts-taccess.pdf · Halación y astigmatismo (secundaria) https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/

---

## Apéndice A · Reproducir las mediciones

Todos los scripts son temporales (no están en el repo). Resumen del método para reproducirlos:

1. **Cobertura y métricas**: `import { create } from 'fontkitten'` (en `node_modules`), `create(readFileSync(woff2))` → `characterSet`, `glyphForCodePoint(cp).bbox / advanceWidth`, `ascent/descent`, `GSUB.featureList`. Comparar con `unicode.json`.
2. **Fallback de Astro**: `import { fromBuffer } from '@capsizecss/unpack'` sobre cada woff2; el ratio `xWidthAvg/upm ÷ (1229/2048)` es el `size-adjust`.
3. **Costuras** (§2.9): Playwright `chromium.launch({ channel: 'chrome' })`, página con `@font-face` en `data:font/woff2;base64,…`, `pre` con `font-size`, `line-height` y `deviceScaleFactor` variables, captura recortada y análisis con `sharp`. Estados de fuente: `[...document.fonts].map(f => f.status)`.
4. **axe**: `@axe-core/playwright` con `withTags(['wcag2a','wcag2aa','wcag22aa'])` sobre páginas mínimas con cada variante de marcado.
5. **Marcos**: transpilar `ascii-grid.ts` con `esbuild` (en `node_modules/.bin`), inyectarlo en una página con la fuente embebida y comprobar `cols·8,4 = ancho` y `alto = filas·17` al redimensionar.
6. **Figlet**: leer los `.flf` de `raw.githubusercontent.com/patorjk/figlet.js/main/fonts/` en memoria, extraer los puntos de código > 126 y cruzarlos con la unión de `characterSet` de los 6 subconjuntos de Geist.

Entorno de las mediciones: Chrome 154.0.8037.59 estable, Windows 11 (DirectWrite), Node 24.19, `@fontsource-variable/*` 5.3.0, figlet.js `main` (30-sep-2026). Safari, Firefox y Android **no medidos**.
