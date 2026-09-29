# DNA · Isla — turismo y excursiones

**Tipo** R (reservas) · **Modo** oscuro · **Idiomas** **en** (primero), es · **Ola** 1

## Idea
Un día en el Caribe que va del mediodía al atardecer mientras avanzas: una **cinta horizontal del día** cuya luz cambia con el scroll, y un armador de rutas de tres días para el visitante internacional.

## Público y escena
Turista (o dominicano de la diáspora) planificando su viaje desde el celular o la laptop. Prefiere inglés.

## Estructura (orden)
1. **Apertura fotográfica** a sangre (playa de Punta Cana o cayo de aguas turquesa), nombre, línea y CTA «Build my trip» / «Armar mi viaje» (`data-cta="primary"`).
2. **Cinta del día** (scroll horizontal nativo con `scroll-snap`; vertical en móvil): 5 excursiones, cada una una foto de un momento del día (mañana → mediodía → tarde → atardecer → noche). El grado de color cambia con el progreso (CSS `animation-timeline: scroll(inline)` con respaldo por JS ligero).
3. **Armador de ruta** (la interacción firma).
4. **Cómo llegar y cuándo ir:** lista corta (temporadas, ballenas ene–mar en Samaná).
5. Pie: una frase y contacto.

**Menú:** barra transparente sobre la foto (logo · Trips · Plan · «Build my trip»); se vuelve sólida al bajar.

## Paleta (references.json)
`surface` verde mar casi negro oklch(0.18 0.03 175) · `surface2` oklch(0.23 0.035 175) · `ink` oklch(0.94 0.012 170) · `muted` oklch(0.78 0.03 172) · `accent` coral oklch(0.72 0.15 30) (≤ 5 %: CTA y selección) con texto `onAccent` oscuro. Las fotos aportan el color; sin degradados añadidos.

## Tipografía
- Titulares: **Epilogue** (`epilogue:wght`) 200–300, romana, ≤ 6 rem, `letter-spacing` 0 a -0,02em.
- Texto: **Ysabeau** (`ysabeau:wght`) 400–500.

## Forma
Radios 0–10 px, máscaras de foto rectas; sin sombras; filetes de 1 px al 16 %.

## Movimiento (firma: profundidad de una sola capa + grado del día)
Una sola capa de profundidad (foto que se desplaza ligeramente respecto al texto) y el cambio de luz de la cinta. **Reducido:** sin desplazamiento; cinta con cambios de grado estáticos por tarjeta.

## Interacción firma — armador de ruta
- 8 excursiones reales de RD a modo de ejemplo (Isla Saona · Samaná y ballenas (ene–mar) · Los Haitises · Zona Colonial a pie · Catamarán en Punta Cana · Cayo Arena · Salto El Limón · Río Yásica), con duración y precio en **USD** ficticio.
- Añadir a «Mi ruta» → tres días con espacios (mañana/tarde); reordenar con botones ▲▼ y quitar; total en USD; aviso real si dos excursiones chocan en el mismo tramo.
- «Send plan» → hoja de éxito con el resumen del plan (todo ficticio).
- Estados: ruta vacía (icono y sin texto instructivo), tramo ocupado, éxito. Teclado completo; el total con `aria-live`.
- **Inglés primero**, español con `?lang=es`.

## Imágenes (paquete `isla`)
Playas y cayos del Caribe dominicano (Punta Cana, Bayahibe/Saona, Samaná, Los Haitises), velero/catamarán, atardecer; verificadas a la vista. Una sola fotografía decisiva por excursión.

## Copy
Ligero y luminoso. EN: «Your island day.» · «Build my trip». ES: «Tu día en la isla.» · «Armar mi viaje».

## Cuidado con
Clichés de palmeras con clipart, degradados naranja→morado de «atardecer», tarjetas de tour idénticas, texto instructivo bajo la ruta.
