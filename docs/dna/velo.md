# DNA · Velo — eventos y fotografía

**Tipo** C (portafolio) · **Modo** oscuro monocromo · **Idiomas** es · **Ola** 3 (segunda oleada)

## Idea
Un portafolio que se recorre como una tira de negativos: **cinta horizontal** con `scroll-snap`, un foco de luz que sigue al puntero sobre cada foto y un lightbox con transición. Casi negro; el color lo ponen las fotos.

## Público y escena
Una novia, una familia preparando unos XV o una empresa. Miran fotos, comparan estilo y piden fecha.

## Estructura (orden)
1. **Apertura:** nombre a gran tamaño y una línea; CTA «Pedir fecha» (`data-cta="primary"`).
2. **La cinta:** 12 fotos en una tira horizontal (vertical en móvil), con filtro (Todo · Bodas · Quinceañeras · Corporativo · Familias) y título de la serie.
3. **Lightbox** (`dialog`): foto ampliada con transición desde su posición (View Transitions con respaldo), anterior/siguiente.
4. **Cómo trabajamos:** secuencia ordinal breve (Charla · Día del evento · Entrega).
5. **Pedir fecha** (formulario corto con calendario de disponibilidad de ejemplo) y contacto simulado.

**Menú:** barra mínima superpuesta (logo · «Pedir fecha»). Pie de una línea.

## Paleta (references.json)
`surface` casi negro oklch(0.15 0.005 260) · `surface2` oklch(0.20 0.006 260) · `ink` oklch(0.93 0.005 260) · `muted` oklch(0.72 0.008 260) · sin acento cromático (el acento es la propia tinta clara).

## Tipografía
- Titulares: **Geologica** (`geologica:wght`) peso **200**, ≤ 6 rem, `letter-spacing` 0.
- Texto: **Source Serif 4** (`source-serif-4:opsz`) 400.
- Pies de foto y etiquetas: Geologica 400 a 13–14 px.

## Forma
Esquinas rectas; sin bordes ni sombras; las fotos separadas por espacio.

## Movimiento (firma: foco de luz sobre la foto)
Una máscara radial que sigue al puntero descubre la foto sobre un velo oscuro (solo puntero fino; en táctil, un toque «enciende» la foto). Transición del lightbox por FLIP/View Transitions con respaldo. **Reducido:** sin foco; fotos a plena luz.

## Interacción firma — cinta + lightbox
- 12 fotos de eventos (detalles, sin retratos identificables), con `alt` descriptivo.
- Filtro con `aria-pressed`; la cinta con `scroll-snap`, flechas del teclado y botones ◀ ▶ ocultos en táctil.
- Lightbox: Esc cierra, flechas navegan, foco atrapado y devuelto a la miniatura; swipe en táctil.
- «Pedir fecha» → hoja de éxito con la fecha elegida (ficticia).

## Imágenes (paquete `velo`)
Detalles de boda y fiesta (manos, anillos, ramos, mesas, copas, luces), en **un solo grado de color** coherente. Cero retratos de rostros reconocibles.

## Copy
Íntimo y conciso. ES: «Lo que se siente, en imagen.» · «Pedir fecha».

## Cuidado con
Serif cursiva de boda, tono crema, marcos dorados, textos de ayuda bajo la cinta, foco de luz en móvil (usa el toque).
