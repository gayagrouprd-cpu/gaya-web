# DNA · Cimiento — constructora

**Tipo** P (presencia) · **Modo** claro · **Idiomas** es · **Ola** 0 (insignia)

## Idea
Una constructora que se lee como un plano bien impreso: información clara, proyectos como **tabla** (no tarjetas), un antes/después que se arrastra y la tarjeta de contacto que se guarda en el teléfono. Es la web de «presencia» que casi cualquier negocio necesita, hecha con oficio.

## Público y escena
Un propietario en Santo Domingo o Santiago que quiere remodelar o construir. Compara dos o tres constructoras desde el celular; busca confianza, proyectos y cómo contactar.

## Estructura (orden)
1. **Hero:** fotografía de estructura/obra en escala de grises (ancho completo, sin texto encima de zonas claras), titular en 2 líneas, CTA «Solicitar presupuesto» (`data-cta="primary"`) y «Abierto ahora» de oficina.
2. **Servicios** como **lista índice** (no tarjetas): Obra nueva · Remodelación · Estructuras de hormigón · Proyecto y supervisión. Cada fila se abre para mostrar una línea de alcance.
3. **Proyectos** como **tabla** con filtro (Todos · Residencial · Comercial · Remodelación): columnas nombre, tipo, zona, año, superficie. Al enfocar/pasar una fila se revela su foto (`clip-path`). Dos remodelaciones con **antes/después arrastrable**.
4. **Cómo trabajamos:** secuencia ordinal real de 4 pasos (Visita · Presupuesto · Obra · Entrega).
5. **Contacto:** horario con «Abierto ahora», zona («Naco, Santo Domingo»), WhatsApp / llamar / correo (acciones simuladas) y **«Guardar contacto»** (genera un `.vcf` en el navegador con datos ficticios).
6. Pie: firma sencilla + horario.

**Menú:** barra superior con logo y enlaces cortos; **índice lateral fijo** en escritorio con scrollspy (Servicios · Proyectos · Proceso · Contacto). En móvil, botón de menú a pantalla completa.

## Paleta (references.json)
`surface` hormigón claro oklch(0.93 0.006 250) · `surface2` oklch(0.89 0.008 250) · `ink` grafito oklch(0.22 0.012 255) · `muted` oklch(0.42 0.015 255) · `accent` naranja de seguridad oklch(0.70 0.18 52) (≤ 5 %: CTA, marcador del índice, asa del antes/después) con texto `onAccent` oscuro.

## Tipografía
- Titulares: **Schibsted Grotesk** (`schibsted-grotesk:wght`) 700–800; ≤ 6 rem; mayúsculas solo en etiquetas de tabla.
- Datos y especificaciones: **JetBrains Mono** (`jetbrains-mono:wght`) para año, superficie y zona; `tabular-nums`.
- Texto: Schibsted Grotesk 400–500.

## Forma
Radios 0–4 px; filetes de 1–2 px en grafito al 20 %; esquinas rectas (obra). Sin sombras; separación con líneas y espacio.

## Movimiento (firma: revelado de foto por `clip-path` desde la fila)
La foto de cada proyecto se descubre con `clip-path: inset()` (expo-out, 500 ms). El antes/después se controla con el puntero y las flechas. **Reducido:** la foto aparece sin desplazamiento (fundido) y el antes/después sigue funcionando (es control directo).

## Interacción firma — proyectos + antes/después + vCard
- 6–8 proyectos ficticios (residencial en Arroyo Hondo, local comercial en Bella Vista, remodelación de villa en Cacicazgos, nave en Santiago…). Filtro con `aria-pressed`; la tabla es `<table>` real con encabezados y orden por columna (botón en el `th`, `aria-sort`).
- Antes/después: `input[type=range]` accesible (etiqueta «Antes / Después»), arrastre con puntero, flechas ± 5 %, Home/End.
- «Guardar contacto»: descarga `Cimiento.vcf` (Blob) y el botón cambia a «Guardado» (estado de éxito).
- Solicitud de presupuesto: formulario corto (nombre, teléfono, tipo de obra) → hoja de éxito en la página.

## Imágenes (paquete `cimiento`)
Estructuras de hormigón, andamios, vigas, fachada en obra, plano sobre mesa; sin rostros identificables. Tratamiento: **escala de grises** con contraste medio (el naranja es lo único cálido). Para el antes/después, dos versiones del mismo encuadre (una tratada «obra gris», otra «terminada»).

## Copy
Sobrio y concreto. ES: «Construimos lo que se queda.» · «Solicitar presupuesto». Sin cifras de proyectos realizados ni años de experiencia.

## Cuidado con
Tarjetas de servicio con icono; rejilla de proyectos con foto; casco amarillo y clichés; relleno de «calidad y compromiso».
