# DNA · Grano — café y panadería

**Tipo** R (pedidos) · **Modo** «drench» (ocre intenso) · **Idiomas** es · **Ola** 3 (segunda oleada de lanzamiento)

## Idea
Una panadería-café con tacto: superficie de **ocre intenso** (no crema), tinta cacao y un sello cobalto. Catálogo con baldosas que se deslizan y una **tarjeta de sellos** que se estampa de verdad con cada café.

## Público y escena
Alguien a las 7 a. m. camino al trabajo, mirando qué pedir y si la tarjeta de sellos ya le da el café gratis.

## Estructura (orden)
1. **Catálogo de apertura:** franja superior con el nombre, «Abierto ahora» y CTA «Ver pedidos» (`data-cta="primary"`); debajo, baldosas de pan y café de tamaños distintos con foto de detalle.
2. **Menú por momentos** (Desayuno · Café · Panes · Dulces) con filtro; lista con precio en RD$ y «+».
3. **Tarjeta de sellos** (la firma): 8 huecos; cada «Café» pedido estampa uno; al llegar a 8, «El próximo es gratis».
4. **Pedido** (bolsa) inferior con totales (ITBIS 18 %) → confirmación.
5. **Horario y ubicación** («Gazcue»). Pie sencillo.

**Menú:** barra superior con logo y bolsa con contador.

## Paleta (references.json)
`surface` ocre oklch(0.80 0.15 85) (drench) · `surface2` oklch(0.86 0.12 88) · `ink` cacao oklch(0.25 0.05 50) · `muted` oklch(0.36 0.06 55) · `accent` sello cobalto oklch(0.48 0.17 262) con texto `onAccent` claro (≤ 5 %: sello, CTA).

## Tipografía
- Titulares: **Besley** (`besley:wght`) 600–800, romana, ≤ 5,5 rem.
- Texto y UI: **Onest** (`onest:wght`) 400–600.

## Forma
Radios 8–14 px; bordes de 2 px cacao; el sello es un círculo con doble anillo y su propia rotación por sello (±6°).

## Movimiento (firma: el sello)
Estampar: `transform: scale(.94) → 1` en **120 ms** sin rebote, con leve rotación y un anillo de tinta que se asienta (opacity). Las baldosas entran deslizándose (`translateY` corto). **Reducido:** el sello aparece de golpe con un fundido de 80 ms.

## Interacción firma — pedido + tarjeta de sellos
- Menú ficticio (espresso, cortado, café con leche, pan de agua, pan sobao, quesito, pastelito, mallorca, jugo de chinola…).
- La tarjeta guarda los sellos en `sessionStorage` (solo demo; se pierde al cerrar); el 8.º café es gratis y baja el total.
- Estados: bolsa vacía, con líneas, sello nuevo, tarjeta completa, éxito («Pedido listo en 10 min», ficticio).
- Teclado y táctil; total con `aria-live`.

## Imágenes (paquete `grano`)
Primeros planos de pan, café, harina, manos amasando (sin caras). Recorte tipo «detalle»; tono cálido natural.

## Copy
Cercano y con harina en las manos. ES: «Pan y café, recién.» · «Ver pedidos».

## Cuidado con
Fondos crema, letras de pizarra a mano, granos de café como patrón, rejillas iguales de tarjetas de producto.
