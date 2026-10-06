# gaya-web

Sitio de **Gaya Digital** (https://gaya.com.do): portada «Cartel» (ocho carteles de luz hechos con celdas de texto y una marea que los cambia),
galería de ejemplos y las webs de ejemplo. Astro 7 estático, español e inglés, sin frameworks de interfaz y sin peticiones a terceros.
Dirección de arte y reglas: `docs/ascii/DIRECTION.md` (es la ley). Hace falta **Node 24** (las pruebas importan `.ts` directamente).

## Empezar

```bash
npm install
npm run dev          # http://127.0.0.1:4321 (Astro 7 admite un solo servidor de desarrollo por proyecto)
npm run build        # genera dist/
npm run pages        # sirve dist/ como GitHub Pages (http://127.0.0.1:4173)
npm test             # node --test: núcleo, escenas, palabras, póster SSR, contenido
```

## Estructura

| Ruta | Qué es |
|---|---|
| `src/ascii/` | Motor del arte: rejilla, kit, marea, pozos, render WebGL2 y Canvas 2D, escenas y palabras. Corre en el navegador y en Node |
| `src/ascii/data/words/` | Palabras de los carteles como arte de cuadrantes (`.txt` editables a mano; `npm run words:pack` las compila) |
| `src/components/` · `src/pages/` | La página (`/` y `/en/`), la galería y el visor |
| `src/styles/` | Tokens, los 16 tonos T0–T15 (`tones.css`, generado), tipografía mixta y estilos de la página |
| `src/data/` · `src/i18n/copy.ts` | Servicios, datos locales con fuente y caducidad, emblemas, y todo el texto visible (ES/EN) |
| `brand.json` | Nombre, contacto, redes, mensajes de WhatsApp y banderas de lo que el dueño ha confirmado |
| `public/ref/<slug>/` | Cada web de ejemplo (HTML/CSS/JS propios) |
| `tests/ascii/` · `tests/content/` | Pruebas de Node (`node --test`) |
| `tests/browser/` | Pruebas del motor en Chrome real; necesitan el laboratorio de `astro dev` (`/lab/field/`) |
| `docs/ascii/` | `DIRECTION.md`, conceptos, investigación e informes de cada paquete (`reports/`) |
| `scripts/` | Puertas de calidad, capturas, fotos y fuentes |

## Calidad

Un solo comando corre todas las pruebas automatizables de `DIRECTION.md` §13 (T1–T22) con resumen, código de salida y un registro por puerta en `reports/ascii/wp11/`:

```bash
npm run build
npm run check:ascii              # completo, con Lighthouse (T1: WebGL2, ?nogl y sin JS × ES/EN × móvil/escritorio, mediana de 3)
npm run check:ascii -- --fast    # lo mismo sin Lighthouse
npm run check:ascii -- --list    # las puertas y a qué prueba sirve cada una
npm run check:ascii -- --only a11y,budgets --skip perf     # unas pocas
npm run check:ascii -- --build   # construye antes (por omisión usa el dist/ que haya y avisa si está viejo)
```

Quedan a mano (no se pueden automatizar): T15 prueba de los 5 segundos, T16 navegadores y WebViews, T18 aprobación del dueño en color, el PEAT de T21 y la puerta de T12 en el **Samsung A07 físico** (abierta: aquí solo hay proxy de CPU ×4/×6).

Cada puerta se puede correr sola:

```bash
npm run budgets                  # HTML, CSS, fuentes, JS del arte y primera carga, medidos sobre dist/ (T2)
npm run ascii:stills             # área de tinta por tono y hash por escena × idioma × variante (T5, T19, T22); --update anota la línea base
npm run ascii:a11y               # axe, forced-colors, contraste alto, impresión, Tab, objetivos, zoom (T4, T11, T13, T14)
npm run ascii:perf               # T12 con CPU ×4 y ×6 sobre la página viva
npm run ascii:meta               # canonical, hreflang, og:image, JSON-LD, sitemap (T20)
npm run lighthouse:routes        # T1; --base https://gaya.com.do cuando el HTTPS esté emitido
npm run guard                    # cero peticiones a terceros + consola limpia en todas las páginas (--matrix: todos los modos del arte)
npm run check:home               # estructura, accesibilidad y portada en 15 tamaños (también home-nojs, home-media, home-states en scripts/)
npm run check:typo               # tipografía mixta a 7 anchos
npm run check:base               # fuentes, costuras, botones, placa, forced-colors, contraste alto, impresión, CLS
npm run contrast                 # pares texto/fondo de las paletas (≥ 4,5:1) y coherencia de los tonos
npm run tones                    # regenera tones.css y tones.gen.ts desde tokens.css (--check, --spec)
npm run lint:content             # copia, honestidad, paridad ES/EN (--self-test: el caso rojo debe fallar)
npm run ascii:lint               # solo el alfabeto de glifos permitido
npm run ascii:sweep              # el still de cada escena en cientos de visores
npm run test:browser             # pruebas del motor en Chrome real (necesita FIELD_URL; check:ascii lo levanta solo)
```

## Capturas y revisión

```bash
npm run tour -- --url http://127.0.0.1:4321/ [--mobile] [--lang en]   # una captura por sección, con el motor ya asentado
npm run shot -- --url http://127.0.0.1:4321/ --out reports/shots/home.png [--w 1440 --h 900] [--still] [--reduced] [--nogl]
npm run og                       # imágenes para compartir (public/og*.jpg): logo, titular y semitono en azul marino y naranja; --out DIR para probar sin pisarlas
```

Las URL con `?still&poster=<id>` muestran el fotograma fijo de un cartel (`cover`, `hola`, `mist`…) sin pozos, para revisarlo a cualquier ancho.

## Referencias

```bash
npm run ref:check <slug>         # puerta de calidad de una referencia (CONTRACT.md)
npm run fonts -- <paquete>:<ejes>  # prepara fuentes para una referencia
npm run photo -- --slug <slug> --name hero --id <pexels-id> --ar 16:9   # foto optimizada + crédito
npm run posters -- --slug <slug> # capturas (escritorio, móvil, tira, imagen para compartir)
```

| Ruta | Qué es |
|---|---|
| `src/data/references.json` | Fuente única de las referencias (páginas, capturas, pruebas, mensajes) |
| `public/ref-shared/` | `frame.js`, `hours.js` y fuentes de las referencias |
| `docs/dna/` | Ficha de dirección de arte de cada referencia |
| `CONTRACT.md` | Contrato que cumple cada referencia |

## Publicación

GitHub Pages con dominio propio. El código de trabajo vive en la rama `astro`; la rama `v1` conserva la web anterior. El despliegue se hace con GitHub Actions (`.github/workflows/deploy.yml`, solo a mano mientras el dueño no apruebe publicar).

Fotos: licencia libre (Pexels / Unsplash), ver `CREDITS.md`. Fuentes: Bricolage Grotesque y Geist Mono (OFL-1.1), autoalojadas.
