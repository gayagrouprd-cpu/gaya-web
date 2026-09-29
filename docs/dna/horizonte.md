# DNA · Horizonte — inmobiliaria

**Tipo** C (catálogo) · **Modo** claro · **Idiomas** es, **en** (completo) · **Ola** 3 (segunda oleada)

## Idea
Sin hero: la página **empieza en el mapa**. Un mapa esquemático estilo metro de las zonas, una lista sincronizada y filtros que responden al instante. Pensada para compradores locales y de la diáspora.

## Público y escena
Alguien que compra o alquila, en el celular o la laptop, comparando zonas, cuartos y precio, a veces desde el extranjero.

## Estructura (orden)
1. **Banco de trabajo:** izquierda filtros (Zona · Cuartos · Precio · Moneda USD/RD$), centro **mapa esquemático** de zonas con pines, derecha **lista** de propiedades. Sin hero de marketing; el nombre y un CTA discreto en la barra (`data-cta="primary"`: «Hablar con un asesor»).
2. **Hoja de detalle** (`clip-path` desde el pin/fila): foto, datos, «Pedir visita».
3. **Zonas** (lista corta de las zonas del mapa con una frase).
4. **Contacto** y pie sencillo.

**Menú:** barra fina con logo, selector de idioma y de moneda.

## Paleta (references.json)
`surface` neutro frío oklch(0.965 0.006 235) · `surface2` oklch(0.93 0.008 235) · `ink` oklch(0.22 0.02 245) · `muted` oklch(0.42 0.02 243) · `accent` pines verde azulado oklch(0.52 0.09 195) con texto `onAccent` claro (≤ 5 %: pines, seleccionado).

## Tipografía
- **Funnel Display** (`funnel-display:wght`) para titulares y precios (600–700, ≤ 3,5 rem: es una web de trabajo).
- **Funnel Sans** (`funnel-sans:wght`) para todo lo demás.

## Forma
Radios 10–12 px en hojas y controles; líneas de mapa de 3 px; pines en círculo con número; sombras de 1 px como mucho.

## Movimiento (firma: sincronía pin ↔ lista)
Al pasar/enfocar una propiedad, su pin crece y se resalta; al pulsar un pin, la lista se desplaza a su fila. La hoja de detalle se abre con `clip-path` desde el pin. **Reducido:** resaltes sin escalado, hoja con fundido.

## Interacción firma — buscador con mapa
- 10–12 propiedades ficticias en 6 zonas (Piantini · Naco · Bella Vista · Punta Cana · Santiago · Sosúa); precios en USD y RD$ (tasa de ejemplo fija, marcada como demo).
- Filtros: zona (chips), cuartos (stepper 1–5), precio (rango con dos manejadores accesibles); el recuento se anuncia con `aria-live`.
- Mapa: SVG esquemático (líneas y estaciones, no un mapa real), pines con teclado (roving tabindex), tooltip con nombre y precio.
- «Pedir visita» → hoja de éxito (ficticia). Sin resultados: estado vacío con icono.
- **Inglés completo** con `?lang=en`.

## Imágenes (paquete `horizonte`)
Casas y apartamentos caribeños (fachadas, salones, terrazas, piscinas), una por propiedad, luminosas y coherentes. Sin personas.

## Copy
Claro y útil. ES: «Encuentra tu zona.» · «Hablar con un asesor». EN: «Find your area.» Sin cifras de ventas.

## Cuidado con
Hero de foto con buscador flotante genérico, tarjetas de propiedad idénticas con corazón, mapa de Google (prohibido: es esquemático), precios «desde $» sin fuente.
