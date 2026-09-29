# DESIGN — sistema visual de gaya.com.do

> Estado: **esqueleto de M0**. Los valores marcados «M1» se fijan cuando Giancarlo elige la paleta viendo tres iluminaciones en vivo.

## Principios
1. **Luz + webs.** La portada es un campo de luz líquida (WebGL) guiado por la interacción; encima flotan las webs reales.
2. **La interfaz se explica sola.** Sin texto instructivo. Etiquetas, iconos y estado.
3. **Oscuro con intención** (escena nocturna, celular): superficie casi negra tintada hacia el matiz de marca; el color vive en la luz, no en los rellenos.
4. **Una sola familia de color** por iluminación; acento ≤ 5 % de la pantalla.
5. **Movimiento con sentido:** entrada cinematográfica, respuesta al puntero/scroll, reposo quieto. Curvas expo-out. Nada de rebote.

## Tokens (M1)
Definidos en `src/styles/tokens.css` (OKLCH) y espejados en `src/styles/tokens.json` (pares de contraste verificados por `npm run contrast`).
`--surface`, `--surface-2`, `--ink`, `--muted`, `--accent`, `--on-accent`, `--line` · escala de espacio de 4 pt · radios ≤ 16 px (píldoras aparte) · z-index con escala semántica.
Variantes de paleta (M1): tres «iluminaciones» (no recolores) conmutables con `?paleta=` solo en desarrollo.

## Tipografía (M1)
Candidata: **Bricolage Grotesque** (eje de ancho y de peso, para titulares cinéticos) + **Geist Mono** (datos). Se decide con banco de pruebas.
Titulares ≤ 6 rem, `letter-spacing` ≥ -0,04em, romana, `text-wrap: balance`. Cuerpo ≥ 16 px, 45–75 ch.

## Componentes
- **Menú:** píldora flotante (logo · Referencias · Servicios · Proceso · Contacto · idioma · WhatsApp). En móvil, pantalla completa.
- **Botón:** primario (acento), secundario (línea). Foco visible inmediato, objetivo ≥ 44 px.
- **Tarjeta de referencia:** captura de página completa en tira, se recorre al pasar/enfocar; nombre + icono de tipo. Lista accesible, un solo enlace por tarjeta.
- **Visor:** iframe único vivo con la captura debajo hasta cargar; conmutador PC/tablet/celular (solo ≥ 768 px), «Abrir», anterior/siguiente, «Quiero una así».
- **Favoritas:** bandeja de hasta 3 (icono + contador).

## Movimiento
Entrada de la portada (~1,5 s), luz que responde a mouse/scroll/toque y reposa. Baraja con `scroll-snap` nativo. Transiciones entre páginas con `@view-transition` (solo la captura pulsada). Todo con alternativa `prefers-reduced-motion`.

## Fuera
Cuadrículas de tarjetas idénticas, rótulos sobre cada sección, numeración de secciones, fondos de puntos, texto con degradado, vidrio esmerilado decorativo, marcos falsos de navegador/teléfono, cursivas en titulares.
