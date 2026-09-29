# DNA · Nodo — app / SaaS

**Tipo** A (app) · **Modo** claro · **Idiomas** es, en (completo) · **Ola** 0 (insignia)

## Idea
La demostración de que hacemos **apps**, no solo páginas. La web es directamente el producto: un panel interactivo completo (gestión de pedidos y clientes para pequeños negocios) que se abre en pantalla sin preámbulo de marketing.

## Público y escena
Un dueño o un socio técnico que quiere ver cómo se sentiría una herramienta hecha a su medida. Debe poder «jugar» con ella en 20 segundos.

## Estructura (orden)
**Banco de trabajo** (app shell): barra superior (nombre «Nodo», selector de rango, búsqueda, ⌘K, idioma) · riel izquierdo con 3 vistas (Resumen · Clientes · Pedidos) · lienzo principal. No hay hero de marketing; el primer pliegue *es* el panel.

- **Resumen:** 4 indicadores, gráfica de línea (ingresos) y de barras (pedidos por canal), lista de actividad.
- **Clientes:** tabla ordenable, con búsqueda y filtro por estado; al elegir una fila se abre un panel lateral (drill-in).
- **Pedidos:** lista por estado con cambio de estado (Nuevo → Preparando → Listo → Entregado).

**Menú/pie:** el propio riel; sin pie. CTA de contacto discreto en la barra (`data-cta="primary"`: «Quiero una app así»), abre hoja de éxito simulada.

## Paleta (references.json)
`surface` papel grafito oklch(0.955 0.006 260) · `surface2` (paneles) oklch(0.99 0.003 260) · `ink` oklch(0.22 0.02 265) · `muted` oklch(0.45 0.02 265) · `accent` cobalto oklch(0.52 0.19 262) con texto `onAccent` claro. Datos en la propia gama (cobalto + neutros); un tono de aviso solo si hace falta.

## Tipografía
- **Hubot Sans** (`hubot-sans:wdth`) para títulos y UI (ancho 100–110 %, peso 500–700); ≤ 4 rem en cifras grandes.
- **JetBrains Mono** (`jetbrains-mono:wght`) para cifras pequeñas, ids y atajos; `tabular-nums` en todo número.

## Forma
Radios 8–12 px en paneles, 6 px en controles; bordes de 1 px `ink` al 12 %; sin sombras grandes (una sombra de 1–2 px como máximo en el panel lateral).

## Movimiento (firma: cifras y curvas que se interpolan)
Los números cuentan hasta su valor (200–400 ms) y las gráficas **transforman el trazo** al cambiar de rango. Las filas ordenadas se reubican con FLIP. **Reducido:** cambios instantáneos con un fundido de 100 ms.

## Interacción firma — el panel completo
- Datos sembrados con un generador determinista (mismo resultado siempre) y etiquetados como de ejemplo; nada de cifras de marketing.
- Rango 7 d / 30 d / 90 d (radiogroup) → gráficas y KPIs se actualizan. Tooltip de gráfica con cruz (puntero y flechas).
- Tabla: ordenar por columna (`aria-sort`), buscar (filtra al escribir), filtro por estado, selección de fila → panel lateral con historial.
- **Paleta de comandos ⌘K / Ctrl+K:** cambiar de vista, cambiar rango, buscar cliente, cambiar idioma; navegación con flechas, Enter, Esc; `combobox` accesible.
- Atajos: `g r` Resumen, `g c` Clientes, `g p` Pedidos, `/` búsqueda (no se listan en pantalla; viven en la paleta).
- Estados: vacío (búsqueda sin resultados), cargando (esqueleto 250 ms al cambiar de rango), error simulado (botón «Reintentar» en un panel), éxito (toast breve al cambiar un pedido).
- **Inglés completo** con `?lang=en` (y selector visible).

## Imágenes
Ninguna foto. La interfaz es la imagen. Iconos: trazo simple propio en SVG (sin librerías).

## Copy
Producto real, corto y útil. ES: «Nodo» · «Resumen» · «Clientes» · «Pedidos». Sin promesas.

## Cuidado con
Datos que parezcan estadísticas reales del cliente, gráficas decorativas sin interacción, «dashboard de plantilla» con tarjetas de KPI idénticas (varía el tamaño y el peso), texto de ayuda sobre los atajos.
