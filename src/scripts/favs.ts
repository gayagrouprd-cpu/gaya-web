// Favoritas del visor (hasta 3). En localStorage, con tolerancia a que no esté disponible.
const KEY = 'gaya-favs';
export const MAX_FAVS = 3;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string').slice(0, MAX_FAVS) : [];
  } catch {
    return [];
  }
}
function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sin almacenamiento: las favoritas viven solo en esta visita */
    memory = list;
  }
  window.dispatchEvent(new CustomEvent('gaya:favs', { detail: list }));
}
let memory: string[] | null = null;

export const getFavs = (): string[] => memory ?? read();

/** Alterna una favorita. Devuelve el estado final; si ya hay 3, la más antigua sale. */
export function toggleFav(slug: string): boolean {
  const list = getFavs();
  const i = list.indexOf(slug);
  if (i > -1) list.splice(i, 1);
  else {
    list.push(slug);
    while (list.length > MAX_FAVS) list.shift();
  }
  write(list);
  return i === -1;
}

export function onFavs(cb: (list: string[]) => void) {
  const fn = () => cb(getFavs());
  window.addEventListener('gaya:favs', fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener('gaya:favs', fn);
    window.removeEventListener('storage', fn);
  };
}

export type ContactData = {
  e164: string;
  one: string; // plantilla con {name} {sector} {url}
  many: string; // plantilla con {list}
  refs: Record<string, { name: string; sector: string; url: string }>;
};

/** Enlace de WhatsApp para una o varias referencias. */
export function whatsappFor(data: ContactData, slugs: string[]): string {
  const items = slugs.map((s) => data.refs[s]).filter(Boolean);
  if (!items.length) return `https://wa.me/${data.e164}`;
  const text =
    items.length === 1
      ? data.one.replace('{name}', items[0].name).replace('{sector}', items[0].sector).replace('{url}', items[0].url)
      : data.many.replace('{list}', items.map((r) => `«${r.name}» (${r.sector}) ${r.url}`).join(' · '));
  return `https://wa.me/${data.e164}?text=${encodeURIComponent(text)}`;
}

export function readContactData(): ContactData | null {
  const el = document.getElementById('gaya-contact');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as ContactData;
  } catch {
    return null;
  }
}
