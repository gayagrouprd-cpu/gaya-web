// Enlaces de WhatsApp con el mensaje ya escrito (R5: WhatsApp es el canal de conversión; DIRECTION §8.10).
// Las plantillas viven en brand.json › whatsappMessage (las mismas que usa src/lib/refs.ts), el número en brand.json.
// Medición sin analítica (R04 D21): el nombre del servicio llega escrito en el primer mensaje y el dueño etiqueta el chat.
// Sin datos personales en la URL.
//
// Este módulo corre igual en Vite/Astro y directamente en Node 24. Por eso no importa refs.ts ni routes.ts (leen JSON sin
// atributos de importación): `waSample`/`waSamples` construyen el mismo mensaje que `refWhatsApp` de refs.ts; quien pinta
// «Quiero una así» puede usar cualquiera de los dos (tests/content comprueba que son idénticos).
import brand from '../../brand.json' with { type: 'json' };
import type { Lang } from '../ascii/types.ts';
import { getService, type ServiceId } from '../data/services.ts';

export const WA_NUMBER: string = brand.contact.whatsapp.e164;

/** `https://wa.me/<número>?text=<mensaje codificado>`; número internacional sin `+`, ceros ni guiones. */
export const waUrl = (text: string): string => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

/** Mensaje general: botón primario de la portada, del menú y del contacto. */
export const waGeneric = (lang: Lang): string => waUrl(brand.whatsappMessage.generic[lang]);

export interface WaExample {
  name: string;
  /** Dirección absoluta de la web de ejemplo. */
  url: string;
}

const EXAMPLE_LABEL: Record<Lang, string> = { es: 'Ejemplo', en: 'Sample' };

/** Un servicio con el mensaje escrito: «Hola Gaya Digital, me interesa «{servicio}». Quiero una propuesta.» */
export function waService(lang: Lang, serviceName: string, example?: WaExample): string {
  let text = brand.whatsappMessage.service[lang].replace('{service}', serviceName);
  if (example) text += ` ${EXAMPLE_LABEL[lang]}: «${example.name}» ${example.url}`;
  return waUrl(text);
}

/** Lo mismo por id de servicio (el nombre sale de src/data/services.ts). */
export const waServiceOf = (lang: Lang, id: ServiceId, example?: WaExample): string => waService(lang, getService(id).name[lang], example);

/** Etiqueta con la que el dueño marca el chat en WhatsApp Business (`web`, `automatización`, `marketing`, `it`). */
export const waTagOf = (id: ServiceId): string => getService(id).waTag;

export interface WaSample {
  name: string;
  /** Rubro en el idioma de la página (se escribe en minúscula dentro del mensaje). */
  sector: string;
  /** Dirección absoluta de la web de ejemplo (`url(lang, 'ref', { slug })` de routes.ts). */
  url: string;
}

/** «Quiero una así» de un ejemplo: el mensaje del ejemplo ya escrito (igual que refWhatsApp de refs.ts con un solo ejemplo). */
export function waSample(lang: Lang, sample: WaSample): string {
  const text = brand.whatsappMessage.reference[lang]
    .replace('{name}', sample.name)
    .replace('{sector}', sample.sector.toLowerCase())
    .replace('{url}', sample.url);
  return waUrl(text);
}

/** Varios ejemplos en un solo mensaje (la bandeja de favoritas). */
export function waSamples(lang: Lang, samples: WaSample[]): string {
  if (samples.length === 1) return waSample(lang, samples[0]);
  const list = samples.map((s) => `«${s.name}» (${s.sector.toLowerCase()}) ${s.url}`).join(' · ');
  return waUrl(brand.whatsappMessage.references[lang].replace('{list}', list));
}
