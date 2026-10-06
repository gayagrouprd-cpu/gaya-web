// Rutas del sitio. El i18n integrado de Astro no traduce segmentos de ruta
// (/referencias/<slug>/ vs /en/references/<slug>/), así que las rutas viven aquí y de aquí salen
// los enlaces, el conmutador de idioma, hreflang y el sitemap. Los ejemplos se listan en la portada (#ejemplos · #samples);
// /referencias/ y /en/references/ solo redirigen allí (src/pages/referencias/index.astro y su versión inglesa).
import brand from '../brand.json';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';
export const SITE: string = brand.site;

export type RouteKey = 'home' | 'ref';

const PATTERNS: Record<RouteKey, Record<Lang, string>> = {
  home: { es: '/', en: '/en/' },
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
    ...slugs.map((slug) => ({ key: 'ref' as RouteKey, params: { slug } })),
  ];
}

export function langFromPath(pathname: string): Lang {
  return pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'es';
}
