# Variante B · El agua hecha del nombre — informe

Estado: **entregada** como paquete autosuficiente en `src/ascii/scenes/variants/b/` (no se tocó ningún archivo compartido ni git). `node --test "tests/ascii/**/*.test.mjs"` **208/208 verdes** (20 nuevas en `tests/ascii/scenes-b.test.mjs`) y `npm run ascii:lint` verde. Abiertas: visto bueno del dueño en color, **Samsung A07 físico**, Safari/Firefox y PEAT (no medidos aquí).

## Qué hay
| Archivo | Contenido |
|---|---|
| `variants/b/ramp.ts` | La rampa del nombre ` ·:=*yaAG▒▓█` con la **tinta medida** (Geist Mono 500), `rampStep` (meseta + costura estrecha con ruido azul), `lightToU`, `B_RING` |
| `variants/b/fabric.ts` | `mistB`: bruma de **puntuación real** (`· . ' : ; - = + *`) + aura de bg; mismo reparto de luz que `kit.mist` |
| `variants/b/cover.ts` · `hola.ts` | `coverB` / `createCoverB(opts)` y `holaB` / `createHolaB(opts)`: contrato `Scene` completo, `still ≡ paint(p=1, STILL_T)` |
| `variants/b/tide.ts` | `composeB`: la marea con banda de letras (misma firma y mismas 5 zonas que `compose`) |
| `variants/b/index.ts` | Entrada única y las dos líneas del registro (ver «Cómo enchufarla») |
| `tests/ascii/tools/` | `ink-b` (mide la tinta) · `render-variant-b` (PNG con el pintor real: estáticos, llegada, calor, marea, hoja, recorte) · `measure-b` (presupuesto + pozos) · `bench-variant-b` (Chrome CPU ×1/4/6) · `prod-check-b` (compara con atlas y render-2d de producción) · `wells-view-b` |
| `reports/ascii/art-b/` | Imágenes finales (`cover|hola-{es,en}-{d1440,m360,d1920}.png`, `*-heat`, `*-sinbg`, `arrival-*`, `tide-*`, `sheet-*`, `wells-*`, `prod/`), `rounds/` (16 rondas), `ink.json`, `measure.json`, `bench.json` |

## La rampa, recalculada con la tinta medida
Tinta = fracción de la celda cubierta (9×18@2; el orden no cambia en 6×12@2, 9×18@1, 12×25@1 y 6×12@1, lo vigila una prueba):
`·` 2,9 · `:` 5,7 · `=` 12,3 · `*` 15,0 · **`y` 20,7 · `a` 23,2 · `A` 26,1 · `G` 29,8** · `▒` 50 · `▓` 75 · `█` 100 %. Estrictamente creciente; huecos de 2,5–3,7 puntos en la banda de letras. El salto `G → ▒` (20 puntos) es de la fuente (la tinta ASCII máxima es 30–37 %): por eso los bloques solo viven en el aro. `≈` está prohibido (cae a otra fuente): las olas son `~ o O 0`.
**Reparto** (lo comprueban las pruebas): dentro del cartel (cover 1440): `y` 282 · `*` 178 · `a` 117 · `A` 93 · `G` 79 (mayúsculas = 30 % de las letras, solo en cintas de luz y borde iluminado); **fuera del cartel no hay una sola letra** (bruma, polvo y sombra son `: · + = . ' ; - *` y `░`).

## Cómo está hecho
- **Cover**: piel de cuadrantes (aro, `B_RING` más oscuro que el de la base) + pared del trazo en letras (`A G` en el lado de la luz, `y a` en el de la sombra) + agua = luz `v` = suelo + inflado del trazo + cáusticas de gran escala (`cs` 0,3) + cinta diagonal − profundidad + grano, traducida a la rampa; el nivel (0,78) y la ignición de 2,6 s son los de la base; menisco = fila de `G A`. La tela pasa de puntuación a letras al subir el agua.
- **Hola**: H sólida (bloques, `waterTone` 4) y «OLA»/«ELLO» en olas de la misma sierra de la base: cresta `~` (T12), espuma `o O 0` bajo ella, cuerpo en la rampa del nombre; la losa de bg sigue la ola, así las rayas se leen también de lejos.
- **Marea** (`composeB`): el saliente se deshace en letras `* y a A`, la banda es la rampa sobre una losa con espuma `~ o O 0`, el entrante llega como puntuación `· : = *`.
- **DESVIACIÓN declarada (decisión de B, a ver por el dueño): usa `bg`** en tonos bajos: losa de agua T3–T6 bajo las letras y aura T1–T2 bajo la bruma (nada pasa de T6; no cuenta para el presupuesto, que mide primer plano). Sin él (`createCoverB({ bg: 0, bgGlow: 0 })`, imágenes `*-sinbg.png`) la tela es ASCII más puro pero **GAYA ya no se lee de un vistazo** (`*-sinbg.png`, r04). El modo sin bg cumple la regla de `cover` con póster SSR y está probado; con bg el póster de 4 capas ignora el fondo y se ve la tela de letras sobre negro, no el cartel entero.

## Rondas (mirar → criticar → corregir; imágenes en `reports/ascii/art-b/rounds/`)
1. **r01** copia de la base con tela de letras negra y bruma `* = +`: filas de `****` (tabla/terminal), caras vacías, rótulos sueltos «AGA/YAG» en el menisco → bruma y caras rehechas.
2. **r02** pared de letras sin losa + menisco que escribía G A Y A: el nombre deja de leerse y parece terminal → **rechazado** el menisco-texto.
3. **r03a/b** pared de tramas `▓` o de letras: con tramas la silueta manda pero la tela son 2 celdas de ancho; con letras se pierde el contorno → pared de letras con bisel y piel de cuadrantes.
4. **r04** densidad uniforme (suelo 0,46–0,62) y bruma solo de puntuación tenue: GAYA se lee; quedan rachas `AAAA` y una retícula regular de `;` (ruido azul) → grano + ruido blanco en la bruma.
5. **r05** cáusticas a gran escala (`cs` 0,3): las mayúsculas pasan a cintas de luz diagonales y las caras dejan de ser ruido.
6. **r06/r07** aura de bg T1–T2 bajo la bruma y losa T5 bajo las letras: la silueta se sostiene y el cartel «emana».
7. **Medición** (`measure-b`): hola llegaba a T≥9 17 % y cover a T≥11 5,2 % (133×36) → `B_RING` T7–T10, `~` T12, letras ≤ T10,5: todo dentro de tope con margen.
8. **r08–r10 rechazados**: bloques `▒▓` en el núcleo de las cintas (mosaico), letras `y a` asomando en la bruma (erratas), tonos más claros (rompen T≥11 a 133×36).
9. **r11/r12** aura T2 solo pegada a las letras y T1 fuera + bg T6 en el núcleo de la cresta: el cartel destaca sin competir.
10. **r13/r14/r15** hola: «OLA» sin losa se perdía; con losa que sigue la ola las rayas se leen; HELLO en móvil legible (`HE / LO`).
11. Último ajuste: sobre `G` se mezclan `A` y `G` (suelo suave en vez de tope): se acabaron las rachas `GGGGGG` en las barras.

## Presupuesto de tono del `still` (T≥9 · T≥11 · T≥13 · T≥14 en % del área; topes 12 · 4 · 1,5 · 0,5; no vacías ≤ 60/55)
| visor | cover B (base) | hola B (base) |
|---|---|---|
| 1440×900 160×50 | 5,3 · 1,4 · 0,06 · 0,06 · 48 % (4,7 · 1,6 · 0,06) | 5,8 · 1,4 · 0 · 0 · 43 % (5,6 · 1,2 · 0,10) |
| 1600×900 133×36 | 9,1 · 2,5 · 0,10 (7,9 · 2,9) | 9,6 · 2,6 · 0 (9,4 · 2,6 · 0,31) |
| 1920×1080 160×43 | 6,1 · 1,6 · 0,07 (5,5 · 1,9) | 6,6 · 1,9 · 0 (6,5 · 1,7) |
| 360×800 60×66 | 6,6 · 1,7 · 0,08 (6,7 · 2,4) | 7,8 · 1,9 · 0 (6,9 · 1,7) |
| 320×568 53×47 | 6,6 · 2,8 · 0,12 (7,9 · 2,5) | 10,2 · 3,1 · 0 (8,9 · 2,8 · 0,40) |
(ES y EN, 7 visores: todos ≤ tope; peor caso hola 320×568 T≥9 10,2 % y cover 133×36 T≥11 2,5 %.) Celdas con bg: 17–37 % de la pantalla (siempre ≤ T6).

## Coste por cuadro (Chrome 154 real, ms p50/p95, `bench-variant-b`; presupuesto ≤ 6 / ≤ 12)
| CPU · celdas | reposo cover · hola | calor + anillos | ignición | cuadro de marea |
|---|---|---|---|---|
| ×4 · 9 000 | 1,4/1,9 · 1,4/1,8 | 1,3/1,8 · 1,3/1,8 | 1,2/1,7 | 2,9/3,6 |
| ×6 · 9 000 | 2,2/2,7 · 2,2/2,6 | 2,1/2,6 · 2,2/2,6 | 2,0/2,5 | 4,6/5,6 |
Igual que la base dentro del ruido (base ×4: 1,2 · 1,4 · 1,1 · 2,8). Horneado `build` 1–4 ms. Sin asignaciones por cuadro (prueba con constructores interceptados).

## Contraste bajo los pozos (§5.8, criterio de WP6)
Con el tope del h1/lead/botones puesto: **0 celdas por encima de T6 (`ink`) o T4 (`muted`) antes de `applyCap`** en 1440, 1920, 1024, 360, 390 y 320, y 0 después en todos (`wells-view-b`, `wells-*.png`). A 1600×900 (133×36) mis rectángulos de prueba solapan la palabra y hay 224 celdas de primer plano que el motor recortaría (la base: 228): es artefacto del rectángulo, no de B.
**Producción**: `prod-check-b` pinta el `still` con `atlas.ts` + `render-2d.ts` reales y lo compara con el PNG del pintor de pruebas: 98,7–99,4 % de los píxeles iguales (Δ canal ≤ 24/255).

## Contra la base sólida (hoja `sheet-*`, honesto)
**Por debajo**: solidez y brillo. Los glifos ASCII llegan a ≈ 30 % de tinta y el presupuesto de T≥9/T≥11 impide compensarlo con tono, así que B pesa menos y su silueta necesita el bg; sin él GAYA no se lee de un vistazo. A 1024 px (variante M, trazos de 4 celdas) la tela casi no tiene cara. El «pozo de luz» de la portada es más tenue; en 1440 la base sigue siendo la que más «golpea» a primera vista.
**Por encima**: carácter. Los caracteres se ven (`y a A G`, `· : = + *`, `~ o O 0`), la bruma es polvo de verdad, las mayúsculas dibujan cintas de luz, la marea es una ola hecha del nombre y el cartel pasa la prueba «ni terminal ni Matrix»: ninguna letra sale del cartel. Más cerca del arte ANSI que del pixel-art. El mejor resultado es 1920×1080 (celda 12×25) y móvil con pila.

## Cómo enchufarla y reproducir
`scenes/index.ts`: `import { coverB as cover, createCoverB as createCover } from "./variants/b/index.ts"` y `hola: () => import("./variants/b/hola.ts").then((m) => m.holaB)`; el motor llama `composeB` donde llamaba `compose`.
```
node tests/ascii/tools/ink-b.mjs                                   # tinta por glifo (ink.json)
node tests/ascii/tools/render-variant-b.mjs --scene cover,hola --vp d1440,m360,d1920 --lang es,en
node tests/ascii/tools/render-variant-b.mjs --tide --vp d1440,m390 | --heat | --arrival --ps 0.2,0.5 | --sheet | --crop 14,1,62,22 --dpr 2 | --opts '{"cover":{"bg":0,"bgGlow":0}}'
node tests/ascii/tools/measure-b.mjs · bench-variant-b.mjs · prod-check-b.mjs · wells-view-b.mjs
node --test tests/ascii/scenes-b.test.mjs
```

## Avisos
- Sin hashes dorados de B (no se tocó `golden.json`); el póster SSR con bg pierde la losa (ver arriba); el nivel de reposo 0,78 es el de la base.
- No verificado: A07 físico, Safari, Firefox, PEAT sobre la marea, ni la página viva (se usó el pintor y el renderizador de producción en PNG).
- READY/LISTO y el resto de carteles no están en este paquete (solo cover y hola).
