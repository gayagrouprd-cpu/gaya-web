// Rutas del sitio. El i18n integrado de Astro no traduce segmentos de ruta
// (/referencias/ vs /en/references/), así que las rutas viven aquí y de aquí salen
// los enlaces, el conmutador de idioma, hreflang y el sitemap.
import brand from '../brand.json';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';
export const SITE: string = brand.site;

export type RouteKey = 'home' | 'refs' | 'ref';

const PATTERNS: Record<RouteKey, Record<Lang, string>> = {
  home: { es: '/', en: '/en/' },
  refs: { es: '/referencias/', en: '/en/references/' },
  ref: { es: '/referencias/:slug/', en: '/en/references/:slug/' },
};

export type RouteParams = { slug?: string };

export function path(lang: Lang, key: RouteKey, params: RouteParams = {}): string {
  return PATTERNS[key][lang].replace(':slug', params.slug ?? '');
}

export function url(lang: Lang, key: RouteKey, params: RouteParams = {}): string {
  return SITE + path(lang, key, params);
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

/** Alternativas para <link rel="alternate" hreflang> (recíprocas, con x-default = español). */
export function alternates(key: RouteKey, params: RouteParams = {}) {
  return [
    { hreflang: 'es', href: url('es', key, params) },
    { hreflang: 'en', href: url('en', key, params) },
    { hreflang: 'x-default', href: url('es', key, params) },
  ];
}

/** Todas las URLs indexables (para el sitemap). Las webs de ejemplo (/ref/**) no se indexan. */
export function indexableRoutes(slugs: string[]): Array<{ key: RouteKey; params: RouteParams }> {
  return [
    { key: 'home', params: {} },
    { key: 'refs', params: {} },
    ...slugs.map((slug) => ({ key: 'ref' as RouteKey, params: { slug } })),
  ];
}

export function langFromPath(pathname: string): Lang {
  return pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'es';
}
