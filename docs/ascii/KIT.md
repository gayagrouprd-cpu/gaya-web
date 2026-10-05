# KIT del estilo Duotono — cómo se hace un cartel de caracteres

Para quien construya `web`, `listo`, `eco`, `on`, `ver` y `tu`. El estilo oficial (adoptado en WP6c, decidido por el dueño: «más ASCII visible») es el de `cover`, `hola` y `mist`.
Una superficie ya no es un bloque `█` de un tono: **cada celda es un glifo de una rampa medida, en un tono de primer plano sobre un fondo de otro tono de la misma familia**.
La anatomía y los números están en DIRECTION §5.4–5.6; la escena mínima, en `src/ascii/scenes/_template.ts`; su prueba, en `tests/ascii/fixtures/scene-template.test.mjs`.

## 1. Exports estables

| Módulo | Export | Qué hace |
|---|---|---|
| `scenes/ramp.ts` | `RAMP_CHARS` · `DUO_RAMP` · `LEVELS` · `rampGlyph(nivel, hash)` | 10 peldaños × 4 glifos ordenados por **tinta medida**; `DUO_RAMP[nivel·4 + (hash & 3)]` es el índice de glifo |
| `scenes/ink.ts` | `inkOf(ch)` · `LEVEL_INK` · `GLYPH_INK[glifo]` | tinta medida (milésimas / fracción de la celda); no entra en el JS del navegador |
| `scenes/duo.ts` | `putDuo(g, x, y, nivel, hash, fg, bg)` | **la celda duotono**: glifo del peldaño `nivel` (0..9) elegido por `hash`, tono `fg` sobre fondo `bg` (explícito). Sin asignaciones |
| | `inkTone(bg, nivel)` | tono del glifo según la **regla de polaridad**: fondo ≤ T6 → carácter claro (`bg + 3 + nivel/2`, tope **T8**); fondo ≥ T7 → carácter oscuro (`bg − 3`, grabado). Nunca confunde carácter y fondo |
| | `putWall(g, x, y, tono, hash, dens)` | pared del aro (celda `█` a 1 del borde): fondo `tono` + carácter `: ; + =` tres tonos más oscuro; 1 de cada 3 celdas por fila lleva SIEMPRE glifo |
| | `distField(cols, rows, lines)` | distancia (anchos de celda, 1:2) de cada celda a la tinta de las líneas (`build`) |
| | `glowFromDist(dist, s)` | luz que emana de la palabra, 0..255 (`1/(1+(d/s)²)`) |
| | `clusterField(cols, rows, semilla, lo, hi, clearBelow)` | racimos 0..255 de la bruma (manchas ≈ 11×6 con hueco T0 entre ellas; se apaga bajo `clearBelow`) |
| | `enclosedCells(cols, rows, lines)` | contrapunzones (A, O, G…): se dejan a T0 para no perder la figura |
| | `bakeShadow(cols, rows, lines)` | sombra de **una celda** en diagonal: `{ pos, rt }` |
| | `bakeAura(dist, cols, rows, shadow, r1, r2, skip)` | aura pegada al trazo: `{ pos, tier, rt }` (capa 0 ≤ r1, capa 1 ≤ r2) |
| | `mistDuo(g, spec, opts, t, tl)` | la bruma de caracteres (por cuadro; sin asignaciones; con pozos, calor, `wash`, `starAt`, `yFade`) |
| | `accentDensity(inkCells, cols, rows)` | 0,45..1: baja los tonos cuando la palabra cubre > 14 % de la pantalla |
| `tide.ts` | `compose(...)` | la marea YA es de texto (banda `. : ; = +`, espuma `*` `~`, tope T12): las escenas nuevas no hacen nada |
| `ssr.ts` | `posterCollapse(g)` · `renderPosterLayersDuo(escena, spec, lang, words)` | póster sin JS de una escena con `bg` (solo la portada) |
| `tests/ascii/fixtures/scene-rules.mjs` | `checkSceneRules` · `toneBudget` · `effectiveBudget` · `checkToneBudget` · `TONE_CAPS` (§5.4) · `DUO_CAPS` (los de la adopción) | reglas de §6.3 y presupuesto de tono **literal y efectivo** |
| `tests/ascii/fixtures/art-metrics.mjs` | `artMetrics` · `belowWord` · `waveMetrics` · `chebyshev` | carreras planas, cara con glifo, densidad por distancia, texto limpio |
| `tests/ascii/tools/` | `render-scenes.mjs` · `art-report.mjs` · `sweep.mjs` (`npm run ascii:sweep`) | PNG con el pintor real · tabla de luz y medidas · barrido de ≈ 580 visores × idiomas |

Las escenas importan el kit con `import { … } from "./common.ts"` y `from "./duo.ts"`. `RAMP` de `grid.ts` es otra cosa (la rampa clásica): usa `DUO_RAMP`.

## 2. De una cara de bloques a Duotono

La base de bloques pintaba `put(g, x, y, G_FULL, tono)`. Aquí cada celda lleva **nivel** (qué densidad de carácter: 0 vacío … 9 `@`), **fg** y **bg**:

| Lo que era | Duotono (nivel · fg · bg) |
|---|---|
| cara `█` T5–T8 | bg = el tono repartido entre dos con ruido azul (`bg = (tono + bn(x, y) − 0,5 + 0,5) \| 0`); nivel 2–6 según la luz; fg = `inkTone(bg, nivel)` (≤ T8) |
| cáustica `█` T9–T10 | nivel 7–9 (`X # % @`) con fg hasta T10 sobre bg ≤ T6: es el único sitio donde el carácter pasa de T8 |
| masa sólida (pared, H de HOLA) | `█`/espacio con bg = tono de la base y un carácter más oscuro encima (`putWall`); la luz se queda en el fondo |
| vidrio vacío `▒` T2–T5 | bg T3, nivel 1–2 (`. :`) fg T6 en **todas** las celdas (con espacios saldrían carreras planas) |
| agua que se retira / se deshace | nivel 1–4 sobre fondo de agua T4–T7 (lo hace `compose`) |

Reglas que mide la prueba: ≥ 60 % de la cara con glifo de la rampa; ninguna carrera horizontal de ≥ 3 celdas del trazo con el mismo fondo y sin glifo (en una pared se asegura con la retícula `x + 2y ≡ 0 mod 3`); el fondo de una cara cambia de tono con **ruido azul**, nunca por zonas rectas.

## 3. Recetas (glifos y tonos)

**Aro** (`paintRing` del kit con los tonos `{ edge: 9, skin: 10, light: 11, lit: 11, dark: 8 }`; con poco aire `{ edge: 9, skin: 9, light: 10, lit: 10, dark: 8 }`, y a los de la base `{ 8, 9, 10, 10, 7 }` si la palabra cubre > 40 %). La piel de cuadrantes es limpia (silueta); la pared `█` pasa por `putWall`. Destellos: `paintRing(…, glint = 0,4·acc, ganancia 2 (1 con poco aire))`.

**Sombra**: `bakeShadow` (1 celda en diagonal) → fondo **T1**, glifo `:` **T2** en 1 de cada 3 celdas. Nunca T0 ni más de T2.

**Halo → aura**: `bakeAura` (1 ancho de celda = capa 0, 2 = capa 1; sin contrapunzones, y solo capa 0 en móvil): fondo **T8** (T7 con poco aire) y T6, con `. :` T8 en 1 de cada 4. La luz que ya no da el bloque.

**Bruma** (halo lejano): `mistDuo` con `field = glowFromDist(dist, 3.6)` y `dens = clusterField(…, 0,12, 0,42, base + 5)`; peldaños `. : ; + =` (+ `*` raro) en T3–T6 sobre fondo T0–T2; ≤ 30 % de las celdas con glifo fuera del halo y ≤ 15 % a 8 celdas.

**Reflejo** (TÚ, VER): la silueta espejada es texto atenuado: nivel 2–3 (`: ;`) **T4 → T3** sobre fondo **T1** en las primeras 4 filas, `.` T3 en las siguientes, ondulada con `desp = 2,2·sinp(0,9·dy + 0,11·x)·min(1, dy/5)`, con `~` T4 dispersos (el `~` es de las olas: aquí vale). Sin `░▒▓`.

**Neón** (ON): el tubo es masa → fondo **T11–T13** con carácter grabado T8 (nivel 2); el piloto, un `▄` T15; el halo, `: ;` T6 sobre fondo T3 (≤ 1,6 celdas) y `.` T4 sobre T2 (≤ 3). El tubo no baja de T11 y no parpadea.

**Hachura** (LISTO): `╱` (caja diagonal, ya está en el alfabeto) en **T8 sobre fondo T5**; el aro, igual que el de la portada; el pulso de tono recorre las letras con +2 (tope T10).

**Anillos de eco** (ECO): bandas por distancia exacta (`distField`): anillo 0 = nivel 4 (`+ =`) **T8 sobre T5**; los demás, fondo **T3 → T2** con `:` T4 → T3; el toque emite anillos de `applyRings` (suben el tono de las celdas con glifo).

**Silueta de ciudad** (TÚ): torres = fondo **T2** con `. '` T4 (nivel 1–2); luz de borde `▀` T6; ventanas `▄` T12 por hash (≤ 0,5 % de la pantalla: cuenta para T≥11); campanario `┼` T10; farolas `.` T10; puente con cajas y tirantes `.` T6; línea de agua `─╌` T8. Con el aire que deja la palabra, las ventanas se apagan antes de pasar del 3,5 % de T≥11.

**Plano / obra / publicado** (WEB): plano = aro T7 y retícula `.` T3 cada 4×3 celdas; obra = andamio `─ │` T6 y grúa `+` T13 con estela; la cara al subir pasa por la receta de agua (fondo T3–T6, fg ≤ T8); publicado = receta de cover y el destello de publicación (una línea de bg T10 → T6 con cola de 5 celdas) una sola vez.

## 4. Presupuesto de tono (DIRECTION §5.4)

Los topes los mide la prueba **dos veces** (literal = tono del primer plano de cada celda con glifo; efectivo = luminancia media de la celda convertida a T0–T15): **T≥9 ≤ 11 % · T≥11 ≤ 3,5 % · T≥13 ≤ 1,5 % · T≥14 ≤ 0,4 %**, celdas con glifo ≤ 60 % (portada) / 55 % / 30 % (bruma), y la luz media de una escena con palabra ≥ 95 % de la de la base de bloques. Cómo se cumple:
- el **primer plano** de caras y paredes no pasa de T8 (T10 en las cáusticas ≥ 7); la luz va al **fondo** (pared T9–T11, aura T6–T8) porque el fondo no cuenta en la medida literal y sí en la efectiva (que tiene holgura: el literal es el que aprieta);
- los tonos altos (luz de borde, menisco, espuma, chispas) se reparten con `accentDensity`: con poco aire (palabra > 14 % de la pantalla, o rejilla < 6 000 celdas) bajan un peldaño;
- `npm run ascii:sweep` recorre 289 visores × 2 idiomas con la rejilla que calcularía el motor y falla por encima de los topes. Una escena nueva se mide con `sweep({ scenes: [escena] })` antes de registrarla.

## 5. Contrato de una escena (resumen)

`build(spec, lang, words)` puro, una vez por tamaño; `paint(g, st, f)` puro en `(p, t, e, heat, rings)`, **escribe toda la pantalla** (`clear(g, 0)`), sin asignaciones, solo enteros y polinomios (`smooth`, `easeOutCubic`, `sinp`): nada de `Math.sin/cos/pow/exp`, reloj ni `Math.random`. `still` ≡ `paint(p = 1, t = STILL_T)`. `SceneState.cls` (1 cara · 2 borde · 3 sombra y aura) es lo que la marea deshace y forma. `f.cap` son los pozos de lectura: pásalo a `mistDuo` (`wells`) y deja el sitio del texto limpio (la bruma se apaga bajo la base de la palabra). Ningún texto en la imagen (R8). El motor llama a `paint` con `f.heat`/`f.rings` solo mientras la persona interactúa y duerme a los 1,6 s (WCAG 2.2.2: `node tests/browser/motion.mjs`).

## 6. Cómo mirarlo

```
node tests/ascii/tools/render-scenes.mjs --scene web --vp d1440,m360 --lang es,en --metrics --crop 0,0,160,34 --out reports/ascii/<paquete>
node tests/ascii/tools/art-report.mjs --scene web        # luz frente a la base, presupuesto y medidas en los 7 visores
node tests/ascii/tools/sweep.mjs --scene web             # el barrido completo
node --test tests/ascii/<id>.test.mjs                    # la prueba copiada de la plantilla
```
