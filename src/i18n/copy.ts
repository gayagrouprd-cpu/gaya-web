// Textos del sitio (ES por defecto, EN). Sin frases instructivas: solo etiquetas y contenido.
import type { Lang } from '../routes';

export const copy = {
  es: {
    nav: {
      label: 'Principal',
      refs: 'Referencias',
      services: 'Servicios',
      process: 'Proceso',
      contact: 'Contacto',
      menu: 'Menú',
      close: 'Cerrar',
      whatsapp: 'WhatsApp',
      language: 'Idioma',
    },
    hero: {
      words: ['Tu', 'negocio,', 'imposible', 'de', 'ignorar'],
      accentWord: 2,
      lead: 'Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo.',
      primary: 'Escríbenos por WhatsApp',
      secondary: 'Ver referencias',
    },
    footer: { rights: 'Santo Domingo, República Dominicana' },
    palette: { guayaba: 'Guayaba', cobalto: 'Cobalto', plata: 'Plata' },
  },
  en: {
    nav: {
      label: 'Main',
      refs: 'References',
      services: 'Services',
      process: 'Process',
      contact: 'Contact',
      menu: 'Menu',
      close: 'Close',
      whatsapp: 'WhatsApp',
      language: 'Language',
    },
    hero: {
      words: ['Your', 'business,', 'impossible', 'to', 'ignore'],
      accentWord: 2,
      lead: 'Web, apps, marketing, IT support and AI. From Santo Domingo to the world.',
      primary: 'Message us on WhatsApp',
      secondary: 'See references',
    },
    footer: { rights: 'Santo Domingo, Dominican Republic' },
    palette: { guayaba: 'Guava', cobalto: 'Cobalt', plata: 'Silver' },
  },
} satisfies Record<Lang, unknown>;

export const t = (lang: Lang) => copy[lang];
