# Contrato de una referencia (web de ejemplo de Gaya Group)

Se pega completo en el encargo de cada constructor. Una referencia es una **mini-web estática de ejemplo** que un negocio real
podría tener. No es una web de cliente, no vende nada de verdad y no menciona quién la hizo salvo el sello «Sitio de ejemplo · Gaya Group»
que pone `frame.js`. Los objetivos: que impresione, que sea utilizable y que no parezca plantilla.

> **Regla de oro de Giancarlo (aplica a todo lo que se construye para él):** si una pantalla necesita una línea de texto bajo un control
> para explicar qué hace o cómo se usa, el diseño falló. Nada de textos de ayuda, «cómo funciona», subtítulos que narran el control
> ni avisos obvios. La interfaz se entiende por etiquetas precisas, iconos, layout y estado visible. Sí valen: el contenido real,
> etiquetas cortas de campo, mensajes de error reales y pequeñas insignias de estado.

## 0. Cómo trabajar (orden obligatorio)

1. Lee tu ficha `docs/dna/<slug>.md`: es cerrada (estructura, paleta, tipografía, movimiento, interacción, imágenes). No la reinterpretes; si algo te bloquea, dilo en el informe final.
2. **Dibuja primero la interacción firma** (estados, teclado, táctil) y luego la página que la rodea.
3. Construye, mira las capturas que genera `npm run ref:check <slug>` (están en `reports/ref/<slug>/`, **léelas una por una**) y corrige.
4. Antes de terminar, autocrítica en 6 ejes de 1 a 5: Filosofía, Jerarquía, Ejecución, Especificidad, Contención, Variedad. Cualquier eje < 4 → otra pasada.
5. Informe final (corto): archivos, pesos, qué interacción hace qué, desviaciones de la ficha, avisos que quedaron y por qué.

## 1. Entrega

Carpeta `public/ref/<slug>/` (solo aquí; no toques nada fuera de ella):

```
index.html      un solo HTML
style.css       un solo CSS
main.js         un solo JS (sin módulos, sin librerías, sin GSAP)
img/            solo las imágenes de tu paquete (AVIF/WebP ya optimizados)
```

Encabezado obligatorio (respeta el orden; la meta CSP va primero):

```html
<!doctype html>
<html lang="es" data-langs="es">                       <!-- "es,en" si la ficha exige inglés -->
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Nombre · rubro</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="../../ref-shared/fonts/<paquete>.css">   <!-- una por familia -->
<link rel="stylesheet" href="style.css">
<script src="../../ref-shared/frame.js"></script>      <!-- idioma, ?still, sello, marco seguro -->
<script src="../../ref-shared/hours.js"></script>      <!-- solo si usas horarios / «Abierto ahora» -->
<script src="main.js" defer></script>
</head>
```

Las fuentes las prepara el orquestador con `npm run fonts -- <paquete>:<ejes>`; tú solo enlazas el CSS y usas el `font-family` que declara (p. ej. `'Bricolage Grotesque Variable'`). Siempre con pila de respaldo (`system-ui`, `Georgia`…).

## 2. Red y peso

- **Cero peticiones externas.** Nada de CDN, fuentes de Google, mapas ni analítica. La CSP lo impone y `ref:check` lo comprueba.
- HTML + CSS + JS ≤ **60 KB gzip** en total. Primera vista ≤ **350 KB**. Imagen principal (`hero`) ≤ **120 KB**.
- Imágenes con `width` y `height`, `<picture>` AVIF → WebP, `loading="lazy"` bajo el pliegue, `fetchpriority="high"` solo en la imagen principal.
- Sin librerías. Vanilla JS, CSS moderno (`@property`, `clip-path`, `container queries`, `:has()`, `dvh`, `color-mix`, `linear()`), siempre con respaldo razonable.

## 3. Color y tipografía

- Colores **solo OKLCH** en variables `:root` (`--surface`, `--ink`, `--accent`… los de tu ficha). Neutros con croma ≥ 0,005. **Nada de negro ni blanco puros**, ni `#000`/`#fff`, ni `black`/`white`.
- El «drench» (color de superficie) vive en `--surface`. El acento ocupa ≤ 5 % de la pantalla.
- Cada texto sobre cada fondo ≥ 4,5:1 (≥ 3:1 en texto grande ≥ 24 px). Las parejas de tu paleta ya están verificadas en `references.json`; si añades un color, compruébalo con `npm run contrast`.
- ≤ **3 familias** tipográficas, las de tu ficha. Titulares en romana (nada de cursivas), ≤ 6 rem, `letter-spacing` ≥ -0,04em. Prosa 45–75 ch. Cuerpo ≥ 16 px.
- `text-wrap: balance` en titulares, `text-wrap: pretty` en párrafos largos.

## 4. Estructura y layout

- La macroestructura, el menú y el pie son los de tu ficha. HTML semántico: `header`, `nav`, `main`, secciones con encabezado, `footer`; un único `h1`; enlace «saltar al contenido» (`.skip`); `id="contenido"` en `main`.
- `html, body { overflow-x: clip }`; rejillas con `minmax(0, 1fr)`; `dvh` para alturas de pantalla; botones y CTAs en una sola línea.
- Marca el CTA principal con `data-cta="primary"`: debe verse completo, junto con el `h1`, en una pantalla de 1280×800.
- Verifica a 320, 375, 414, 768, 1024, 1440 px: sin scroll horizontal, sin texto cortado, sin solapes.
- **Prohibido:** rótulo en mayúsculas sobre cada sección, numeración de secciones (salvo secuencias realmente ordinales), rejillas de tarjetas idénticas como layout principal, radios > 16 px (excepto píldoras y máscaras de imagen), fondos de puntos o cuadrícula, texto con degradado, vidrio esmerilado, brillos decorativos, marcos falsos de navegador o teléfono, ilustraciones «dibujadas a mano» hechas con SVG tosco.

## 5. Movimiento

- Solo `transform`, `opacity` (y `clip-path`/`filter` cuando aporten y sean fluidos). Curvas expo-out (`cubic-bezier(.16,1,.3,1)`), nada de rebote ni elástico salvo lo que pida la ficha.
- **Una** primitiva de movimiento firma (la de tu ficha) hecha con excelencia; el resto, discreto.
- Todo el contenido está **visible por defecto** sin JavaScript; las animaciones solo mejoran (una revelación nunca esconde contenido si no dispara).
- `@media (prefers-reduced-motion: reduce)` con alternativa hermosa (fundido corto, estado final estático).
- Movimiento autónomo de más de 5 s: con pausa o ligado al scroll.
- **`?still`**: `frame.js` pone `html[data-still]` y congela CSS. Tus animaciones por JS (rAF, canvas, temporizadores) deben leer `window.GAYA.still` y quedarse en su estado final/representativo.

## 6. Interacción firma

- Una función real del rubro (la de tu ficha), operable con **teclado y táctil**, con sus estados: reposo, hover, foco visible, activo, deshabilitado, cargando (si aplica), error, éxito, vacío.
- La acción final **se confirma dentro de la página** (una hoja o estado de éxito): nunca abre `wa.me`, `tel:`, `mailto:` ni sale a otro sitio. Los formularios llaman a `preventDefault`.
- Foco visible inmediato (≥ 3:1), objetivos táctiles ≥ 44×44 px en puntero grueso, sin funciones solo con hover.
- Widgets personalizados con roles y estados ARIA correctos (`tablist`, `radiogroup`, `dialog`, `aria-pressed`, `aria-expanded`…), anuncios con `aria-live` cuando algo cambia sin foco.

## 7. Contenido y datos

- **Datos ficticios:** teléfonos `809-555-01xx`, correos `@example.com`, barrios (no direcciones exactas), nombres de personas inventados. Sin marcas reales.
- **Sin** estadísticas, valoraciones, testimonios, premios, «+X clientes» ni logos. Los precios y horarios de la demo sí valen como datos de ejemplo.
- Español por defecto. Inglés solo si tu ficha lo pide (`data-langs="es,en"`): todo el texto visible cambia con `?lang=en`. Usa `window.GAYA.lang` (lo fija `frame.js`) y un diccionario `T = { es: {...}, en: {...} }`; el HTML trae el español para que se vea sin JS.
- Voz cercana y directa, específica del rubro. Titulares ≤ 7 palabras. Cero relleno tipo «somos líderes en…».
- **No menciones IA** ni quién construyó la web.

## 8. Imágenes

- Solo las de `img/` (tu paquete, ya recortadas y optimizadas). Si necesitas otra, pídela en el informe; no descargues nada.
- `alt` descriptivo y con voz (decorativas: `alt=""`). Una foto decisiva vale más que cinco tibias.
- Ningún cuadro de color donde debería ir una foto. Si el rubro pide imagen, la usa.

## 9. Accesibilidad

WCAG 2.2 AA: landmarks, un `h1`, orden de tabulación lógico, contraste, `lang`, etiquetas en campos, sin trampas de teclado, `dialog` con foco atrapado y devuelto, canvas/SVG decorativos con `aria-hidden` o etiquetados.

## 10. Marco seguro (van dentro de un iframe del visor)

- `frame.js` ya evita que un enlace navegue el marco y reenvía Esc/flechas. No abras ventanas ni uses `target="_top"`.
- Enlaces solo a anclas (`#seccion`) o a estados internos; nada de `href="/"`.
- Si tienes una barra fija inferior en móvil, sube el sello con `--gaya-badge-lift: 72px` en `:root`.

## 11. Puerta de calidad

`npm run ref:check <slug>` debe terminar en ✓. Exige: peticiones externas 0, errores de consola 0 (con y sin `?still`, y en cada idioma), sin desborde de 320 a 1440, hero/CTA a la vista en 1280×800, objetivos táctiles ≥ 44 px, axe sin errores graves (escritorio, móvil y movimiento reducido), presupuestos de peso, Lighthouse móvil (mediana de 3): rendimiento ≥ 90, accesibilidad ≥ 95, buenas prácticas ≥ 95 (el SEO no aplica: son `noindex`), y **cero hallazgos** del detector de patrones de impeccable. Los avisos se resuelven o se justifican en el informe.

## 12. Imprescindibles del kit de presencia (tipo P)

Quiénes somos · servicios · horario con **«Abierto ahora»** en vivo (usa `GAYA_HOURS`) · ubicación con «Cómo llegar» (estado en página, sin mapas externos) · contacto por WhatsApp / llamada / correo (acciones simuladas) · redes. Es lo que la mayoría de negocios necesita: que se lea claro, que cargue al instante y que dé confianza.
