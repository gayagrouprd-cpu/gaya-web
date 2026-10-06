// Qué secciones y rutas existen ya. Los enlaces solo aparecen cuando su destino existe (nada de enlaces muertos).
import brand from '../../brand.json';
import { anyBuilt, builtRefs } from '../lib/refs';

export const READY = {
  refs: anyBuilt(), // #ejemplos y los visores /referencias/<slug>/ (aparecen en cuanto hay referencias construidas)
  services: true, // #servicios y las cuatro fichas (Index y ServiceArticle)
  process: true, // #proceso (Process)
  contact: true, // #contacto (Contact)
};

// ── Datos de contacto (el texto de las etiquetas vive en src/i18n/copy.ts) ───────────────────────────────────

/** Redes en el orden de §8.8: Instagram · TikTok · YouTube · X · Facebook. La etiqueta accesible sale de `t(lang).contact.social`. */
export const SOCIALS = [
  { key: 'instagram', href: brand.social.instagram },
  { key: 'tiktok', href: brand.social.tiktok },
  { key: 'youtube', href: brand.social.youtube },
  { key: 'x', href: brand.social.x },
  { key: 'facebook', href: brand.social.facebook },
] as const;

/** Correo y teléfono tal como se muestran y se enlazan (`mailto:` y `tel:`). */
export const CONTACT = {
  email: brand.contact.email,
  mailto: `mailto:${brand.contact.email}`,
  phone: brand.contact.whatsapp.display,
  tel: `tel:${brand.contact.phone.replace(/[^+\d]/g, '')}`,
} as const;

/** Número real de ejemplos publicados: el del enlace «Ver los n ejemplos» (nunca se finge una lista mayor). */
export const samplesCount = (): number => builtRefs().length;
