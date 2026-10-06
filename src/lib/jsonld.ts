// Datos estructurados: Organization + Service ×4 (DIRECTION §8.12; R04 §5.5).
// SIN LocalBusiness (Google exige `address` y Gaya no publica dirección), SIN ratings ni reseñas, y nunca se menciona
// cómo se hizo el sitio. Solo se marca lo que el visitante ve: la marca, el director (placa y cierre), el correo, el
// teléfono, las redes y los cuatro servicios.
//
// Propiedades revisadas a mano contra schema.org el 30-sep-2026:
//   Organization: name, alternateName, url, description, email, telephone, sameAs, knowsLanguage, areaServed (sin founder: el nombre del dueño no se publica)
//   Service:      name, description, url, provider, areaServed, availableChannel
//   ServiceChannel: serviceUrl, availableLanguage   (`availableLanguage` NO existe en Service: va en el canal)
//   Person: name, jobTitle · Country: name
//
// Corre igual en Vite/Astro y directamente en Node 24.
import brand from '../../brand.json' with { type: 'json' };
import type { Lang } from '../ascii/types.ts';
import { SERVICES } from '../data/services.ts';
import { waServiceOf } from './wa.ts';

/** Nombre anterior de las redes: reconcilia @gayagrouprd con «Gaya Digital». Si el dueño elige «Gaya Group» (§14.2 #2), se invierte con brand.json › name. */
export const ALTERNATE_NAME = 'Gaya Group';

// Espejo de routes.ts › PATTERNS.home (no se importa: routes.ts lee JSON sin atributos y no corre en Node).
// Quien pinta la página puede pasar `pageUrl` = `url(lang, 'home')` de routes.ts y se ignora esto.
const HOME_PATH: Record<Lang, string> = { es: '/', en: '/en/' };

export interface JsonLdOptions {
  /** URL absoluta de la portada en ese idioma (con barra final). */
  pageUrl?: string;
}

export function jsonLd(lang: Lang, o: JsonLdOptions = {}) {
  const pageUrl = o.pageUrl ?? `${brand.site}${HOME_PATH[lang]}`;
  const org = `${brand.site}/#org`;
  const area = [{ '@type': 'Country', name: 'Dominican Republic' }, 'Worldwide'];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: brand.name,
        alternateName: ALTERNATE_NAME,
        url: `${brand.site}/`,
        description: brand.description[lang],
        email: brand.contact.email,
        telephone: brand.contact.phone,
        sameAs: Object.values(brand.social),
        knowsLanguage: ['es', 'en'],
        areaServed: area,
      },
      ...SERVICES.map((s) => ({
        '@type': 'Service',
        '@id': `${pageUrl}#svc-${s.id}`,
        name: s.name[lang],
        description: s.seo[lang],
        url: `${pageUrl}#${s.section[lang]}`,
        provider: { '@id': org },
        areaServed: area,
        availableChannel: { '@type': 'ServiceChannel', serviceUrl: waServiceOf(lang, s.id), availableLanguage: ['es', 'en'] },
      })),
    ],
  };
}

/** JSON listo para `<script type="application/ld+json" set:html={…}>`: `<` escapado para que nada cierre la etiqueta. */
export const jsonLdScript = (lang: Lang, o: JsonLdOptions = {}): string => JSON.stringify(jsonLd(lang, o)).replace(/</g, '\\u003c');
