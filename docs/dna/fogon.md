# DNA · Fogón — restaurante

**Tipo** R (reservas y pedidos) · **Modo** oscuro · **Idiomas** es · **Ola** 0 (insignia)

## Idea
Cocina dominicana al fuego, de noche. La página se lee como una cena: tramos fotográficos a sangre y, al pedir, una **comanda** que se imprime en pantalla como el ticket de la cocina.

## Público y escena
Alguien en el celular a las 8 p. m. decidiendo dónde cenar o qué pedir. Quiere ver comida, ver precios y armar el pedido sin registrarse.

## Estructura (orden)
1. **Hero fotográfico** a sangre: foto de brasa/parrilla, nombre en grande, una línea, CTA «Ver menú» (`data-cta="primary"`) y estado «Abierto ahora».
2. **Dos tramos fotográficos** («Fuego» y «Mar») a ancho completo con una frase cada uno; revelado por `clip-path`.
3. **Menú** con filtro (Todo · Entradas · Parrilla · Del mar · Postres · Bebidas). Filas de lista con nombre, descripción corta, precio en RD$ y botón «+» con stepper. En escritorio, la **comanda** queda fija a la derecha; en móvil es una hoja inferior que asoma con contador.
4. **Horario y ubicación** (Zona Colonial, «Cómo llegar»), con «Abierto ahora» en vivo.
5. Pie de una frase (Ft «Statement»).

**Menú:** barra fina fija — logo a la izquierda, «Pedir» a la derecha (contador de líneas). Sin enlaces largos.

## Paleta (references.json)
`surface` carbón cálido oklch(0.17 0.012 45) · `surface2` oklch(0.22 0.014 45) · `ink` hueso cálido oklch(0.94 0.012 80) · `muted` oklch(0.76 0.02 70) · `accent` brasa oklch(0.66 0.19 38) con texto `onAccent` oscuro. El acento solo en CTA, precio activo y la línea de la comanda (≤ 5 %).

## Tipografía
- Titulares: **Anybody** (`npm run fonts -- anybody:wdth`), peso 700–800, `font-stretch` 110–125 %, mayúsculas solo en el nombre; ≤ 6 rem.
- Texto: **Literata** (`literata:wght`), 400–500, 17–18 px.
- Precios y comanda: Anybody con `font-variant-numeric: tabular-nums`.

## Forma
Radios 0–6 px, filetes finos de 1 px en `ink` al 14 %, sin sombras (la profundidad es tono). Las fotos, rectas.

## Movimiento (firma: la comanda que se imprime)
Al añadir un plato, la línea entra en la comanda con `translateY` + máscara (como papel saliendo) y el total cambia con un conteo corto. Revelados de fotos por `clip-path: inset()` con expo-out. **Reducido:** las líneas aparecen con un fundido de 120 ms, sin desplazamiento.

## Interacción firma — pedido a la mesa
- Datos: ~16 platos ficticios (yuca frita con chimichurri, mofongo de cerdo, chuleta ahumada, pescado al carbón con tostones, pollo al fogón, costillas glaseadas de guayaba, ensalada de aguacate y lechosa, flan de coco, «morir soñando»…), precios RD$ 250–1,290.
- Comanda: líneas con stepper, subtotal, **ITBIS 18 %**, **propina legal 10 %** y total. Modo «Para comer aquí» / «Para llevar» (radiogroup).
- Estados: vacío (comanda con icono y sin texto instructivo), con líneas, máximo por plato (9), «Enviar pedido» deshabilitado si está vacía, éxito: hoja «Pedido #4821 · listo en 25 min» con resumen (todo ficticio).
- Teclado: filtros como `tablist`/botones `aria-pressed`; steppers con `-`/`+`; hoja con foco atrapado y Esc; total con `aria-live="polite"`.

## Imágenes (paquete `fogon`, lo prepara el orquestador)
Brasa y parrilla en llamas, plato de carne/pescado cenital, manos sirviendo, detalle de mesa en penumbra, interior cálido. Tratamiento: contraste medio-alto, sombras cálidas, sin filtros de «foto de stock luminosa». Hero ≤ 120 KB.

## Copy
Voz: cálida, con humo. ES: «Cocinamos con fuego.» · «Ver menú» · «Pedir». Sin «los mejores de la ciudad».

## Cuidado con
Rejilla de tarjetas de platos con foto igual (usa lista tipográfica), menús con iconos de cubiertos como decoración, degradados de «llama», textos de ayuda bajo el stepper.
