# DNA · Clara — clínica dental

**Tipo** P (presencia + solicitud de cita) · **Modo** claro · **Idiomas** es · **Ola** 1

## Idea
Calma clínica, precisión suiza. Una pila fija de secciones que se «apilan» al bajar, y un **diagrama de la sonrisa** donde tocas una zona y aparecen los tratamientos que le corresponden.

## Público y escena
Una persona con una molestia o que quiere blanquearse los dientes, en el celular, buscando confianza y un turno sin llamar.

## Estructura (orden)
1. **Apertura sin foto grande:** titular tipográfico a la izquierda; a la derecha el **diagrama de la sonrisa** ya interactivo (es el hero). CTA «Pedir cita» (`data-cta="primary"`) y «Abierto ahora» (con línea de urgencias).
2. **Pila fija** (`position: sticky`): cada bloque (Tratamientos · Primera visita · Clínica · Contacto) se apila sobre el anterior con un ligero escalado del que queda debajo (progresivo con scroll-driven animations; sin ellas, secuencia normal).
3. **Tratamientos:** lista limpia con nombre y una línea (Limpieza y profilaxis · Ortodoncia · Blanqueamiento · Implantes · Odontopediatría · Urgencias). Se sincroniza con el diagrama.
4. **Primera visita:** secuencia ordinal de 3 pasos (Evaluación · Plan · Tratamiento).
5. **Clínica:** dos fotos de interior luminoso; dirección por zona («Piantini») y horario.
6. **Solicitud de cita** (formulario corto) y pie sencillo.

**Menú:** barra superior mínima (logo · Tratamientos · Contacto · «Pedir cita»). Pie de una línea.

## Paleta (references.json)
`surface` blanco frío oklch(0.985 0.004 240) · `surface2` oklch(0.955 0.008 240) · `ink` grafito oklch(0.25 0.015 250) · `muted` oklch(0.45 0.015 250) · `accent` albaricoque oklch(0.78 0.11 60) como **relleno** con texto grafito (≤ 5 %: CTA, zona seleccionada del diagrama).

## Tipografía
- Titulares: **Petrona** (`petrona:wght`) 300–500, romana, ≤ 5 rem.
- Texto y UI: **Mona Sans** (`mona-sans:wght`) 400–600.
- Nada de mayúsculas largas.

## Forma
Radios 10–14 px en paneles, píldora en CTA; bordes de 1 px grafito al 10 %; sin sombras.

## Movimiento (firma: solo opacidad)
Transiciones de 200–280 ms solo de `opacity` (y el escalado sutil de la pila). Cambio de tratamiento = fundido cruzado. **Reducido:** sin escalado; fundidos de 100 ms.

## Interacción firma — diagrama de la sonrisa
- SVG propio de la arcada superior e inferior, dividido en 6 zonas (incisivos, caninos, premolares, molares superiores/inferiores…). Con **`tabindex` móvil (roving)** y flechas; Enter/Espacio seleccionan; `aria-pressed`.
- Al elegir una zona, el panel muestra los tratamientos relacionados (2–3) con un botón «Pedir cita para esto» que rellena el motivo.
- Formulario de cita: nombre, teléfono, motivo (preseleccionado), día preferido (chips de los próximos 5 días hábiles) → hoja de éxito («Cita solicitada · te escribimos hoy», ficticia).
- Estados: sin zona elegida (el panel muestra los seis tratamientos), zona elegida, envío, éxito, error de campo (mensaje real).
- **Sin antes/después.** Sin fotos de pacientes.

## Imágenes (paquete `clara`)
Dos fotos de interior de clínica luminosa y limpia (sin personas identificables ni pacientes). El resto es el diagrama en SVG limpio y geométrico (no dibujo a mano).

## Copy
Tranquilo y claro. ES: «Tu sonrisa, sin prisa.» · «Pedir cita». Sin promesas médicas ni cifras.

## Cuidado con
Tarjetas de servicio con iconos, azul turquesa «dental» de plantilla, fotos de sonrisas de stock, texto de ayuda bajo el diagrama.
