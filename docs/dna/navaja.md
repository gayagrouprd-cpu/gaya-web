# DNA · Navaja — barbería

**Tipo** R (reservas) · **Modo** oscuro · **Idiomas** es · **Ola** 1

## Idea
Barbería de barrio con carácter: titulares condensados enormes, bandas de latín a ancho completo y una reserva en cuatro pasos que se siente como sacar turno en el mostrador.

## Público y escena
Un hombre joven en el celular, saliendo del trabajo, que quiere un turno hoy sin escribirle a nadie.

## Estructura (orden)
1. **Pantalla partida:** a la izquierda, pila tipográfica **fija** (nombre, una línea, CTA «Reservar» con `data-cta="primary"`, «Abierto ahora»); a la derecha, fotografías que se desplazan. En móvil se apilan.
2. **Marquesina de servicios** ligada al scroll (el desplazamiento del texto depende de la posición de scroll; sin bucle infinito), con cortes secos.
3. **Bandas de servicio** a ancho completo (una por servicio: Corte clásico · Degradado · Barba y toalla caliente · Corte + barba · Perfilado · Corte infantil) sobre superficie de latón alternada; precio en RD$.
4. **Equipo:** tres barberos como **monogramas** (sin retratos).
5. **Reserva** (hoja de 4 pasos), ubicación y horario.
6. Pie: firma + horario.

**Menú:** barra mínima fija (logo · «Reservar»).

## Paleta (references.json)
`surface` grafito frío oklch(0.20 0.012 250) · `surface2` oklch(0.25 0.014 250) · `ink` oklch(0.93 0.008 240) · `muted` oklch(0.74 0.015 245) · `accent` latón oklch(0.74 0.11 85) como **superficie de bandas** con texto `onAccent` grafito (el latón es el «drench» de las bandas; el resto sigue oscuro).

## Tipografía
- Titulares y bandas: **Sofia Sans Extra Condensed** (`sofia-sans-extra-condensed:wght`) 700–900, mayúsculas, ≤ 6 rem, interlineado ≥ 1.0.
- Texto: **Karla** (`karla:wght`) 400–600.

## Forma
Esquinas rectas (0–2 px), filetes de 2 px en `ink` al 20 %. Sin sombras ni brillos. Cortes duros entre bandas.

## Movimiento (firma: marquesina ligada al scroll con cortes secos)
Desplazamiento horizontal proporcional al scroll (transform), sin easing suave: cortes secos al cambiar de banda. **Reducido:** las bandas quedan estáticas.

## Interacción firma — reserva en 4 pasos
Hoja (dialog) o sección con pasos: **1** barbero (3 monogramas + «Cualquiera») · **2** servicio (chips con precio) · **3** día (próximos 7 días) · **4** hora (rejilla de tramos de 30 min, algunos deshabilitados por «ocupado»). Resumen fijo; «Confirmar» → ticket de confirmación (código ficticio, hora, servicio) dentro de la página.
- Estados: paso incompleto (siguiente deshabilitado), tramo ocupado, cambio de barbero que invalida la hora (aviso real), éxito.
- Teclado: `radiogroup` por paso, flechas para moverse en la rejilla de horas, Esc cierra, foco atrapado.
- Fechas relativas a «hoy» (con `GAYA_HOURS.today()`, fija en `?still`).

## Imágenes (paquete `navaja`)
Herramientas (navaja, brocha, tijeras), espejos, sillón de barbero, detalle de toalla caliente. **Escala de grises con virado a latón** (duotono `#12171b → #cba553`). Sin retratos identificables; imágenes nítidas (descartar las granuladas u oscuras).

## Copy
Seco y con orgullo de oficio. ES: «Corte hecho a navaja.» · «Reservar».

## Cuidado con
Poste de barbero con rayas repetidas como fondo, tipografía «western», efectos de vidrio, rejilla de tarjetas para servicios.
