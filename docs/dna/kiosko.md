# DNA · Kiosko — tienda online

**Tipo** T (tienda) · **Modo** claro · **Idiomas** es · **Ola** 2

## Idea
Una tienda de accesorios urbanos con **bento** de colores y botones que se «aprietan» de verdad: catálogo, vista rápida y un carrito con totales y **ITBIS 18 %**. Demuestra que hacemos tiendas online (la real irá en otro hosting).

## Público y escena
Alguien comprando desde el celular una gorra o una mochila; quiere ver, elegir talla/color y cerrar el pedido en pocos toques.

## Estructura (orden)
1. **Bento de apertura** (rejilla asimétrica de 5–6 baldosas de colores con producto/categoría, no de tamaño igual): nombre, CTA «Ver tienda» (`data-cta="primary"`), acceso a carrito con contador.
2. **Catálogo** con filtro de categoría (Todo · Gorras · Mochilas · Medias · Botellas) y orden; 12 productos ficticios de **una sola línea** (streetwear/accesorios) con foto real, nombre, precio RD$ y «Añadir».
3. **Vista rápida** (`dialog`): foto, opciones (color, talla), cantidad, «Añadir al carrito».
4. **Carrito** (cajón lateral; en móvil hoja inferior): líneas con stepper, subtotal, **ITBIS 18 %**, envío («Gratis desde RD$ 3,000» — dato de demo), total.
5. Pie sencillo con contacto y métodos de pago como iconos.

**Menú:** barra fija con logo, categorías y carrito.

## Paleta (references.json)
`surface` casi blanco frío oklch(0.985 0.004 250) · `surface2` oklch(0.95 0.006 250) · `ink` oklch(0.2 0.02 270) · `muted` oklch(0.42 0.02 268). Baldosas: tomate oklch(0.65 0.20 32) (también `accent`), cielo oklch(0.80 0.10 230), sol oklch(0.88 0.15 95), menta oklch(0.85 0.11 165); texto grafito sobre todas.

## Tipografía
- Titulares y precios: **Unbounded** (`unbounded:wght`) 600–800, ≤ 4,5 rem (es ancha: cuida el desborde en móvil).
- Texto y UI: **Figtree** (`figtree:wght`) 400–700.

## Forma
Radios 12–16 px en baldosas (nunca más), 10 px en controles. Bordes de 2 px en grafito y **sombra dura desplazada** de 3 px (sin desenfoque) como estado en reposo; al presionar, la baldosa se «hunde» (traslada 3 px y pierde la sombra).

## Movimiento (firma: pulsación con sombra dura + FLIP)
Estados de pulsación por `transform` (90 ms). Al filtrar, los productos se reordenan con **FLIP**; el cajón del carrito entra con `translateX`. «Añadir» hace volar una miniatura hasta el contador (transform, 500 ms). **Reducido:** sin vuelo; el contador parpadea una vez.

## Interacción firma — compra completa (simulada)
Filtro → vista rápida → carrito → «Pedir»: hoja de éxito con resumen y número de pedido ficticio (`#K-2048`). Stock agotado en un producto (deshabilitado), máximo por línea (9), carrito vacío con icono y sin texto instructivo. Totales con `aria-live`; foco atrapado en `dialog` y cajón.

## Imágenes (paquete `kiosko`)
Fotos reales de producto sobre fondos limpios, todas de la misma familia visual (gorras, mochila, medias, botella, riñonera). Recorte cuadrado y 4:5, fondo neutro; ≤ 120 KB la principal.

## Copy
Directo y simpático. ES: «Lo tuyo, en la calle.» · «Ver tienda» · «Añadir». Precios en RD$. Sin «envío en 24 h» inventado.

## Cuidado con
Cuadrícula uniforme de tarjetas con sombra difusa, gradientes de «e-commerce», iconos de carrito enormes, ratings y reseñas inventadas.
