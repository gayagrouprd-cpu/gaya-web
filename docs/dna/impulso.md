# DNA · Impulso — gimnasio

**Tipo** R (reservas/planes) · **Modo** «drench» (superficie lima) · **Idiomas** es · **Ola** 3 (segunda oleada de lanzamiento)

## Idea
**El horario es la página.** Una rejilla semanal gigante como protagonista, cifras que se voltean como en un tablero de estación y una superficie lima con tinta casi negra. Energía sin brillos ni neón.

## Público y escena
Alguien decidiendo si se apunta: quiere ver qué clases hay hoy, a qué hora y cuánto cuesta ir X veces por semana.

## Estructura (orden)
1. **La rejilla (hero):** título enorme + semana (lun–dom) × franjas (6 a. m.–9 p. m.) con clases coloreadas; CTA «Elegir mi plan» (`data-cta="primary"`) y «Abierto ahora».
2. **Hoja de clase:** al elegir una casilla, panel con nombre, horario, coach (monograma), nivel y «Reservar plaza».
3. **Dial de visitas por semana (1–7)** → sugiere plan y precio.
4. **Planes** (Mensual · Trimestral · Anual): tres columnas de distinta jerarquía (no idénticas).
5. **Ubicación y horario** («Los Prados»). Pie de una línea.

**Menú:** barra fina con logo y «Elegir plan».

## Paleta (references.json)
`surface` lima oklch(0.90 0.20 125) (drench) · `surface2` oklch(0.85 0.19 125) · `ink` oklch(0.17 0.02 130) · `muted` oklch(0.28 0.05 130) · `accent`/alerta rojo oklch(0.55 0.21 27) **solo** para «lleno» y errores, con texto `onAccent` claro.

## Tipografía
- Titulares y horas: **Archivo** (`archivo:wdth`) `font-stretch` 62–75 %, peso 800–900, mayúsculas, ≤ 6 rem.
- Cifras y etiquetas: **Martian Mono** (`martian-mono:wght`) solo dígitos y horas.
- Texto: Archivo 400–600 a ancho normal.

## Forma
Esquinas rectas (0–4 px); bordes gruesos de 3 px tinta; sin sombras, sin brillos.

## Movimiento (firma: dígitos que se voltean, cortes secos)
Al cambiar de día o de plan, las cifras se voltean (`rotateX`/clip, 180 ms) y los paneles cambian con corte seco. **Reducido:** las cifras cambian sin volteo.

## Interacción firma — semana → clase → plan
- 14–18 clases ficticias (Cross · Spinning · Yoga · Boxeo · Funcional · Zumba · Movilidad). Filtro por tipo con `aria-pressed`; casillas como botones con nombre accesible («Lunes 7:00 a. m., Spinning, quedan 3 plazas»).
- «Reservar plaza» → hoja de éxito; casillas llenas deshabilitadas (rojo).
- Dial (`input type=range` 1–7, con etiqueta visible «veces por semana») → el plan sugerido se resalta y el precio (RD$ de ejemplo) cambia.
- Estados: sin selección (panel de clase vacío con icono), selección, lleno, éxito.

## Imágenes (paquete `impulso`)
Pocas y contundentes: manos en barra, cuerda, saco, sombras del gimnasio; **recortes en duotono** (`#0c1108 → #c0f447`) o B/N de alto contraste. Sin rostros identificables.

## Copy
Corto y firme. ES: «Tu semana, en movimiento.» · «Elegir mi plan». Sin «resultados garantizados».

## Cuidado con
Neón sobre negro, brillos, degradados, fotos de «fitness» de stock, contadores de socios/inscritos inventados.
