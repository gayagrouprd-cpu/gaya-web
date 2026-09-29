// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

/**
 * En desarrollo, Vite no resuelve el índice de carpetas dentro de public/ (/ref/<slug>/ daría 404),
 * mientras que GitHub Pages sí. Este plugin imita a Pages: "/ref/x" → 301 a "/ref/x/" y "/ref/x/" → index.html.
 */
function refDirectoryIndex() {
  return {
    name: 'gaya-ref-directory-index',
    apply: /** @type {'serve'} */ ('serve'),
    configureServer(/** @type {import('vite').ViteDevServer} */ server) {
      server.middlewares.use((req, res, next) => {
        const u = new URL(req.url ?? '/', 'http://localhost');
        const m = /^\/ref\/([^/]+)\/?$/.exec(u.pathname);
        if (!m) return next();
        if (!u.pathname.endsWith('/')) {
          res.statusCode = 301;
          res.setHeader('Location', `${u.pathname}/${u.search}`);
          return res.end();
        }
        req.url = `/ref/${m[1]}/index.html${u.search}`;
        next();
      });
    },
  };
}

// Sitio estático para GitHub Pages con dominio propio (gaya.com.do): sin `base`.
export default defineConfig({
  site: 'https://gaya.com.do',
  trailingSlash: 'always',
  compressHTML: true,
  prefetch: false,
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  // Fuentes propias, servidas desde este origen (sin Google Fonts): salen de los paquetes @fontsource-variable.
  fonts: [
    {
      provider: fontProviders.npm({ remote: false }),
      name: 'Bricolage Grotesque Variable',
      cssVariable: '--font-display',
      weights: ['200 800'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
      options: { package: '@fontsource-variable/bricolage-grotesque', file: 'wght.css' },
    },
    {
      provider: fontProviders.npm({ remote: false }),
      name: 'Geist Mono Variable',
      cssVariable: '--font-mono',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
      options: { package: '@fontsource-variable/geist-mono', file: 'wght.css' },
    },
  ],
  vite: {
    plugins: [refDirectoryIndex()],
    build: {
      // Los scripts pequeños no se incrustan en el HTML: la CSP (script-src 'self') no permite scripts en línea.
      assetsInlineLimit: 0,
    },
  },
});
