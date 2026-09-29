# DNA — Calma · masajes y terapias

**Tipo** P (presencia + solicitud de horario) · **Modo** «drench» (superficie salvia) · **Idiomas** es · **Ola** 3

## Idea
Un centro de masajes que se siente como respirar: superficie verde salvia, dípticos partidos, cambios lentos y un **orbe que respira** como marca. Es el sitio de «información básica» de un negocio de bienestar: servicios, horario, cómo llegar y pedir un horario.

## Público y escena
Alguien con la espalda cargada un jueves por la tarde, mirando desde el celular qué masajes hay, cuánto duran y si están abiertos ahora.

## Estructura (orden)
1. **Diptico de apertura:** a un lado el orbe que respira + nombre + CTA «Pedir horario» (`data-cta="primary"`) + «Abierto ahora»; al otro, una foto de textura (piedras/botánica) con **máscara de arco**.
2. **Servicios con filtro de tiempo** (segmento 30 · 60 · 90 min): lista de masajes (Relajante · Descontracturante · Piedras calientes · Drenaje linfático · Prenatal · Reflexología) que cambia según el tiempo.
3. **Diptico «Cómo es una sesión»:** secuencia ordinal de 3 pasos (Llegada · Sesión · Descanso).
4. **Horario y calendario:** mes accesible con tramos del día (los días cerrados deshabilitados).
5. **Ubicación** («Arroyo Hondo») y contacto simulado. Pie sencillo.

**Menú:** barra suave con logo y «Pedir horario». Pie de una línea.

## Paleta (references.json)
`surface` salvia oklch(0.82 0.045 150) (drench) · `surface2` oklch(0.88 0.035 150) · `ink` verde profundo oklch(0.25 0.04 155) · `muted` oklch(0.36 0.04 155) · `accent` terracota oklch(0.52 0.13 45) con texto `onAccent` claro (≤ 5 %: CTA y día seleccionado).

## Tipografía
- Titulares: **Brygada 1918** (`brygada-1918:wght`) 400–600, romana, ≤ 5 rem.
- Texto y UI: **Public Sans** (`public-sans:wght`) 400–600.

## Forma
Máscaras de arco en fotos, radios 14–16 px en paneles, píldora en segmentos; bordes de 1 px `ink` al 14 %; sin sombras.

## Movimiento (firma: cruces lentos y el orbe)
Fundidos cruzados de 700–900 ms entre estados (lista al cambiar tiempo, foto al cambiar de servicio). **Orbe:** círculo SVG que crece y se contrae en un ciclo de 6 s (transform), con botón de **pausa**. **Reducido/`?still`:** orbe quieto en tamaño medio, sin ciclo.

## Interacción firma — tiempo + calendario
- Segmento de tiempo (`radiogroup`) filtra servicios y actualiza las duraciones/precios de ejemplo (RD$).
- Calendario mensual accesible (`grid`, flechas, Enter): días cerrados deshabilitados; tramos de horas para el día elegido; «Pedir horario» → hoja de éxito («Horario solicitado para el jueves 8 · 4:00 p. m.», ficticio).
- «Abierto ahora» con `GAYA_HOURS` (lun–sáb 9:00–19:00, dom cerrado).

## Imágenes (paquete `calma`)
Piedras, hojas, agua, textiles; tono natural graduado hacia el salvia. Sin personas identificables. Foto en arco ≤ 120 KB.

## Copy
Pausado y humano. ES: «Un respiro para tu cuerpo.» · «Pedir horario». Sin «relajación garantizada».

## Cuidado con
Beige/crema «spa», flores de loto, dorados, tipografía cursiva, fondos con hojas de stock.
