// Textos del estilo «cartel editorial» (decisión del dueño del 5-oct-2026: el estilo de su presentación + arte ASCII).
// Titulares en mayúsculas con una palabra o frase de acento en cursiva. El resto del contenido sale de copy.ts y services.ts.
// Sin texto instructivo; sin cifras, clientes ni testimonios inventados.
import type { Lang } from '../ascii/types.ts';
import type { ServiceId } from '../data/services.ts';

/** Un titular: líneas en mayúsculas y, opcionalmente, un acento en cursiva (va en su propia línea, después de `lines`). */
export interface Headline {
  lines: string[];
  em?: string;
  /** El acento va ANTES de la última línea (p. ej. «TU NEGOCIO, / imposible / DE IGNORAR.»). */
  emBefore?: number;
}

export interface V3Copy {
  hero: { kicker: string; title: Headline };
  about: { kicker: string; title: Headline };
  services: { kicker: string; title: Headline };
  service: Record<ServiceId, Headline>;
  samples: { kicker: string; title: Headline };
  process: { kicker: string; steps: Array<{ big: string; em: string }> };
  contact: { kicker: string; title: Headline };
  chrome: { place: string };
}

const es: V3Copy = {
  hero: {
    kicker: 'Web · Apps · Marketing · Soporte IT · IA',
    title: { lines: ['Tu negocio,', 'de ignorar.'], em: 'imposible', emBefore: 1 },
  },
  about: { kicker: 'Quiénes somos', title: { lines: ['Hola.'], em: 'somos Gaya Digital' } },
  services: { kicker: 'Lo que hacemos', title: { lines: ['Servicios'], em: 'todo en un mismo lugar' } },
  service: {
    web: { lines: ['Tu web,'], em: 'lista para vender' },
    automation: { lines: ['WhatsApp'], em: 'responde por ti' },
    marketing: { lines: ['Que te', 'encuentren'], em: 'y te escriban' },
    it: { lines: ['Todo', 'funciona'], em: 'sin frenarte' },
  },
  samples: { kicker: 'Ejemplos · datos ficticios', title: { lines: ['Mira'], em: 'lo que podemos hacer' } },
  process: {
    kicker: 'Proceso',
    steps: [
      { big: 'Hablamos', em: 'por WhatsApp' },
      { big: 'Propuesta', em: 'por escrito' },
      { big: 'Construimos', em: 'con avances' },
      { big: 'Entregamos', em: 'y acompañamos' },
    ],
  },
  contact: { kicker: 'Contacto', title: { lines: ['Hablemos.'], em: 'tu negocio, imposible de ignorar' } },
  chrome: { place: 'Santo Domingo' },
};

const en: V3Copy = {
  hero: {
    kicker: 'Web · Apps · Marketing · IT support · AI',
    title: { lines: ['Your business,', 'to ignore.'], em: 'impossible', emBefore: 1 },
  },
  about: { kicker: 'Who we are', title: { lines: ['Hello.'], em: 'we are Gaya Digital' } },
  services: { kicker: 'What we do', title: { lines: ['Services'], em: 'all in one place' } },
  service: {
    web: { lines: ['Your site,'], em: 'ready to sell' },
    automation: { lines: ['WhatsApp'], em: 'answers for you' },
    marketing: { lines: ['Get', 'found'], em: 'and get messaged' },
    it: { lines: ['It just', 'works'], em: 'and keeps you moving' },
  },
  samples: { kicker: 'Samples · fictional data', title: { lines: ['Look'], em: 'at what we can build' } },
  process: {
    kicker: 'Process',
    steps: [
      { big: 'We talk', em: 'on WhatsApp' },
      { big: 'Proposal', em: 'in writing' },
      { big: 'We build', em: 'with progress updates' },
      { big: 'We deliver', em: 'and stay by your side' },
    ],
  },
  contact: { kicker: 'Contact', title: { lines: ["Let's talk."], em: 'your business, impossible to ignore' } },
  chrome: { place: 'Santo Domingo' },
};

export const v3: Record<Lang, V3Copy> = { es, en };
