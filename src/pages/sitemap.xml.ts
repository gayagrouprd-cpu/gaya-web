import type { APIRoute } from 'astro';
import references from '../data/references.json';
import { alternates, indexableRoutes, url, type RouteKey, type RouteParams } from '../routes';

// Solo se listan las páginas que existen: la portada y el visor de cada referencia construida. /referencias/ y /en/references/
// no entran: solo redirigen a la sección de ejemplos de la portada.
const builtSlugs = references.refs.filter((r) => r.status === 'built').map((r) => r.slug);

export const GET: APIRoute = () => {
  const routes = indexableRoutes(builtSlugs);
  const urlset = routes
    .flatMap(({ key, params }: { key: RouteKey; params: RouteParams }) =>
      (['es', 'en'] as const).map((lang) => {
        const links = alternates(key, params)
          .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
          .join('\n');
        return `  <url>\n    <loc>${url(lang, key, params)}</loc>\n${links}\n  </url>`;
      }),
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlset}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
