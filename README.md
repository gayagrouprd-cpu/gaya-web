# gaya-web

Sitio de **Gaya Group** (https://gaya.com.do): portada, galería de referencias y las webs de ejemplo.
Astro estático, sin frameworks de interfaz, sin peticiones a terceros.

## Empezar

```bash
npm install
npm run dev          # http://127.0.0.1:4321
npm run build        # genera dist/
npm run pages        # sirve dist/ como GitHub Pages (http://127.0.0.1:4173)
```

## Estructura

| Ruta | Qué es |
|---|---|
| `brand.json` | Nombre, contacto, redes y mensajes de WhatsApp |
| `src/data/references.json` | Fuente única de las referencias (páginas, capturas, pruebas, mensajes) |
| `src/routes.ts` | Rutas ES/EN, `hreflang`, sitemap |
| `src/styles/` | Tokens (OKLCH) y estilos globales |
| `public/ref/<slug>/` | Cada web de ejemplo (HTML/CSS/JS propios) |
| `public/ref-shared/` | `frame.js`, `hours.js` y fuentes de las referencias |
| `docs/dna/` | Ficha de dirección de arte de cada referencia |
| `CONTRACT.md` | Contrato que cumple cada referencia |
| `scripts/` | Herramientas de calidad, capturas, fotos y fuentes |

## Calidad

```bash
npm run contrast                 # pares texto/fondo de las paletas (≥ 4,5:1)
npm run guard                    # cero peticiones a terceros + consola limpia en todas las páginas
npm run budgets                  # pesos (gzip)
npm run fonts -- <paquete>:<ejes>  # prepara fuentes para una referencia
npm run photo -- --slug <slug> --name hero --id <pexels-id> --ar 16:9   # foto optimizada + crédito
npm run posters -- --slug <slug> # capturas (escritorio, móvil, tira, imagen para compartir)
npm run ref:check <slug>         # puerta de calidad de una referencia
```

## Publicación

GitHub Pages con dominio propio. El código de trabajo vive en la rama `astro`; la rama `v1` conserva la web anterior. El despliegue se hace con GitHub Actions (`.github/workflows/deploy.yml`).

Fotos: licencia libre (Pexels / Unsplash), ver `CREDITS.md`.
