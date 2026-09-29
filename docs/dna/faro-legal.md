# DNA · Faro Legal — abogados

**Tipo** P (presencia + consulta) · **Modo** claro · **Idiomas** es · **Ola** 2

## Idea
Autoridad tranquila hecha de tipografía: un **documento largo** sin tarjetas, con líneas que se descubren por máscara, y un **árbol de tres toques** («¿Cuál es tu caso?») que orienta al visitante hacia el área correcta.

## Público y escena
Alguien con un problema legal (un contrato, un despido, un trámite de propiedad) que duda si necesita abogado. Busca claridad y un primer contacto sin compromiso.

## Estructura (orden)
1. **Apertura tipográfica:** afirmación en 3–4 líneas y CTA «Consultar mi caso» (`data-cta="primary"`); sin foto. «Abierto ahora» de oficina.
2. **Documento** de lectura continua con columna estrecha: Quiénes somos · Cómo trabajamos (secuencia ordinal de 3 pasos) · Áreas de práctica (Civil · Laboral · Inmobiliario · Corporativo · Familia).
3. **Índice de áreas** (lista tipográfica; al elegir una se despliega su alcance).
4. **Árbol «¿Cuál es tu caso?»** (interacción firma).
5. **Contacto y sello** (oficina en «Piantini», horario, acciones simuladas).

**Menú:** barra quieta con logo y «Consultar». Pie: una frase legal breve.

## Paleta (references.json)
`surface` papel gris azulado oklch(0.955 0.010 245) · `surface2` oklch(0.925 0.012 245) · `ink` oklch(0.22 0.02 260) · `muted` oklch(0.42 0.02 255) · `accent` sello burdeos oklch(0.42 0.14 20) con texto `onAccent` claro. El burdeos aparece en el **sello** (SVG/CSS), el CTA y el subrayado del área activa.

## Tipografía
- Titulares: **Bodoni Moda** (`bodoni-moda:opsz`) 400–600, romana, ≤ 5,5 rem.
- Texto y UI: **Hanken Grotesk** (`hanken-grotesk:wght`) 400–600.
- Prosa 55–68 ch; interlineado 1,6.

## Forma
Filetes finos de 1 px en `ink` al 22 %; esquinas rectas; sin sombras. El sello es un círculo con doble borde y monograma (SVG limpio).

## Movimiento (firma: revelado de líneas por máscara)
Cada línea de titular sube dentro de su máscara (`clip-path`/`overflow` recortado + `translateY`) con expo-out. **Reducido:** aparece todo con fundido corto.

## Interacción firma — «¿Cuál es tu caso?»
Tres toques: **1** tema (Trabajo · Casa o terreno · Familia · Empresa · Otro) → **2** situación (2–3 opciones por tema) → **3** urgencia (Esta semana · Este mes · Solo consulto). Resultado: **área recomendada**, lista de documentos a reunir (checklist marcable) y «Solicitar consulta» (nombre + teléfono) → hoja de éxito («Recibimos tu caso, te respondemos hoy», ficticio).
- Estados: paso a paso con «Atrás»; sin selección (siguiente deshabilitado); resultado; éxito. `radiogroup` por paso, foco al título del paso.
- Nombre de la firma inventado y **sin apellidos** (evita parecerse a un bufete real).

## Imágenes (paquete `faro-legal`)
Opcional: una foto arquitectónica (columnas, escalera) en escala de grises, o ninguna. La tipografía y el sello llevan la página.

## Copy
Sobrio y humano. ES: «Tu caso, explicado con claridad.» · «Consultar mi caso». Sin «más de X años de experiencia».

## Cuidado con
Balanza de la justicia como icono, tarjetas de áreas con iconos, dorado «de abogado», foto de apretón de manos.
