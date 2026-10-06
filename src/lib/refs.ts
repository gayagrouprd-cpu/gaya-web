// Acceso a las referencias (references.json + posters.json) y a los mensajes de contacto.
import references from '../data/references.json';
import posters from '../data/posters.json';
import brand from '../../brand.json';
import { url as siteUrl, type Lang } from '../routes';

export type RefType = keyof typeof references.types;
export interface Ref {
  slug: string;
  order: number;
  wave: number;
  launch: boolean;
  status: string;
  dev?: boolean;
  name: string;
  type: RefType;
  mode: string;
  icon: string;
  sector: { es: string; en: string };
  langs: string[];
  palette: Record<string, string>;
}
export interface PosterInfo {
  hash: string;
  lang: string;
  sizes: Record<string, { avifKB?: number; webpKB?: number; KB?: number; h?: number }>;
}

export const types = references.types as Record<RefType, { es: string; en: string; icon: string }>;
const all = references.refs as unknown as Ref[];

/** Referencias visibles: construidas y con capturas. Las de prueba (`dev`) solo existen en desarrollo. */
export function builtRefs(): Ref[] {
  const p = posters as unknown as Record<string, PosterInfo>;
  return all
    .filter((r) => r.status === 'built' && p[r.slug] && (!r.dev || import.meta.env.DEV))
    .sort((a, b) => a.order - b.order);
}

export const anyBuilt = () => builtRefs().length > 0;

export function poster(slug: string, kind: 'desktop' | 'mobile' | 'thumb', ext: 'avif' | 'webp' = 'avif'): string {
  const info = (posters as unknown as Record<string, PosterInfo>)[slug];
  return `/posters/${slug}-${info.hash}-${kind}.${ext}`;
}
export const ogPoster = (slug: string) => {
  const info = (posters as unknown as Record<string, PosterInfo>)[slug];
  return `/posters/${slug}-${info.hash}-og.jpg`;
};

export const refWhatsApp = (lang: Lang, refs: Ref[]) => {
  const msg =
    refs.length === 1
      ? brand.whatsappMessage.reference[lang]
          .replace('{name}', refs[0].name)
          .replace('{sector}', refs[0].sector[lang].toLowerCase())
          .replace('{url}', siteUrl(lang, 'ref', { slug: refs[0].slug }))
      : brand.whatsappMessage.references[lang].replace(
          '{list}',
          refs.map((r) => `«${r.name}» (${r.sector[lang].toLowerCase()}) ${siteUrl(lang, 'ref', { slug: r.slug })}`).join(' · '),
        );
  return `https://wa.me/${brand.contact.whatsapp.e164}?text=${encodeURIComponent(msg)}`;
};

export const refMail = (lang: Lang, ref: Ref) => {
  const subject = brand.emailSubject[lang].replace('{name}', ref.name);
  const body = brand.whatsappMessage.reference[lang]
    .replace('{name}', ref.name)
    .replace('{sector}', ref.sector[lang].toLowerCase())
    .replace('{url}', siteUrl(lang, 'ref', { slug: ref.slug }));
  return `mailto:${brand.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
