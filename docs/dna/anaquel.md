# DNA · Anaquel — biblioteca / centro cultural

**Tipo** P (presencia) · **Modo** claro · **Idiomas** es · **Ola** 2

## Idea
Una biblioteca cuyo menú es **una estantería**: lomos verticales de colores (anchos y altos distintos) que se sacan al enfocarlos y abren su sección como una página. Es información básica (horarios, salas, eventos, carné) tratada con cariño, no como un directorio municipal.

## Público y escena
Un vecino, un estudiante o una mamá con niños que quiere saber «¿está abierto?», qué hay esta semana y cómo hacerse socio.

## Estructura (orden)
1. **La estantería (hero):** fila de 7–8 lomos con etiqueta vertical (Horarios · Salas · Eventos · Catálogo · Carné · Cómo llegar · Contacto). Sobre ella, el nombre y el estado **«Abierto ahora / Cerrado · abre a las…»** (con `GAYA_HOURS`).
2. **Horarios:** tabla de la semana con **hoy resaltado**.
3. **Salas:** Sala infantil · Hemeroteca · Sala de estudio · Rincón digital (lista con descripción corta, sin fotos de niños).
4. **Eventos:** agenda de las próximas 3–4 semanas (fechas relativas a «hoy»), filtro por tipo (Lectura · Taller · Infantil).
5. **Catálogo:** buscador que filtra al escribir ~24 títulos inventados (título, autor inventado, sala, «disponible/prestado»).
6. **Carné y cómo llegar:** requisitos en 3 pasos y ubicación («Ciudad Colonial»).

**Menú:** la estantería es el menú (en `nav`, cada lomo es un enlace ancla con etiqueta accesible). En móvil, los lomos se apilan en dos filas. Pie sencillo.

## Paleta (references.json)
`surface` papel frío oklch(0.975 0.005 250) · `surface2` oklch(0.945 0.008 250) · `ink` oklch(0.22 0.03 260) · `muted` oklch(0.42 0.025 258). Lomos (paleta completa, son contenido): azul tinta oklch(0.42 0.13 262), tomate oklch(0.62 0.19 30), mostaza oklch(0.80 0.15 90), verde bosque oklch(0.42 0.09 155). El texto sobre cada lomo cumple 4,5:1 (claro u oscuro según el lomo).

## Tipografía
- Titulares y texto: **Literata** (`literata:opsz`), romana, 400–700; titulares ≤ 4,5 rem.
- Etiquetas y UI: **Familjen Grotesk** (`familjen-grotesk:wght`) 500–700.

## Forma
Radios 2–4 px en lomos; filetes de 1 px; sin sombras (los lomos tienen un canto de 2 px más oscuro, no un degradado).

## Movimiento (firma: sacar un libro)
Al enfocar/pasar, el lomo sube 14 px y gira 2° (transform, 240 ms expo-out); al activarlo, «se abre» su página con `clip-path`. **Reducido:** el lomo solo cambia de tono y la página aparece con un fundido.

## Interacción firma — abierto ahora + agenda + buscador
- «Abierto ahora» calculado en vivo con horario de ejemplo (lun–vie 8:00–18:00, sáb 9:00–14:00, dom cerrado); en `?still`, miércoles 10:30 → «Abierto · cierra a las 6:00 p. m.».
- Agenda con fechas relativas; filtro con `aria-pressed`; cada evento con hora y sala.
- Buscador (`input type=search`) con filtrado instantáneo y resaltado; estado «sin resultados» con icono y sin frases de ayuda; teclado completo.

## Imágenes (paquete `anaquel`)
Una o dos fotos de interior de biblioteca (estantes, sala de lectura) en tono natural; sin personas identificables ni menores. Los lomos son CSS.

## Copy
Amable y práctico. ES: «Tu biblioteca, abierta.» · «Ver horarios». Sin cifras de volúmenes ni usuarios.

## Cuidado con
Fondo crema/papel de pergamino, serif italic «bibliotecario», tarjetas de servicios iguales, icono de libro abierto como decoración.
