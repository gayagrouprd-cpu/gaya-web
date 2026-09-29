// Galería: filtro por tipo, favoritas y transición hacia el visor.
import { getFavs, isFav, onFavs, readContactData, setLastRef, toggleFav, whatsappFor } from './favs';

export function initGallery() {
  const grid = document.getElementById('gal-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll<HTMLElement>('.card')];
  const count = document.getElementById('gal-count');
  const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const label = (n: number) => (lang === 'en' ? `${n} ${n === 1 ? 'reference' : 'references'}` : `${n} ${n === 1 ? 'referencia' : 'referencias'}`);

  // Filtro
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter ?? 'all';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      let n = 0;
      cards.forEach((card) => {
        const show = f === 'all' || card.dataset.type === f;
        card.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = label(n);
    }),
  );

  // Favoritas + bandeja
  const tray = document.getElementById('tray');
  const trayN = document.getElementById('tray-n');
  const trayCta = document.getElementById('tray-cta') as HTMLAnchorElement | null;
  const data = readContactData();
  const paint = () => {
    const favs = getFavs();
    document.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((b) => {
      const on = favs.includes(b.dataset.fav ?? '');
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? b.dataset.labelOn : b.dataset.labelOff) ?? '');
    });
    if (tray && trayN && trayCta && data) {
      tray.hidden = favs.length === 0;
      trayN.textContent = String(favs.length);
      trayCta.href = whatsappFor(data, favs);
    }
  };
  document.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((b) => b.addEventListener('click', () => toggleFav(b.dataset.fav ?? '')));
  onFavs(paint);
  paint();
  void isFav;

  // Transición: solo la captura pulsada se «funde» hacia el visor (View Transitions entre documentos)
  grid.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-ref-link]');
    if (a) {
      const slug = a.closest<HTMLElement>('.card')?.dataset.slug;
      if (slug) {
        setLastRef(slug);
        try {
          sessionStorage.setItem('gaya-vt', slug);
        } catch {
          /* ignorar */
        }
      }
    }
  });
  window.addEventListener('pageswap', ((e: Event & { viewTransition?: unknown }) => {
    if (!e.viewTransition) return;
    let slug: string | null = null;
    try {
      slug = sessionStorage.getItem('gaya-vt');
    } catch {
      /* ignorar */
    }
    const win = slug ? grid.querySelector<HTMLElement>(`.card[data-slug="${slug}"] .card__window`) : null;
    if (win) win.style.viewTransitionName = 'ref-stage';
  }) as EventListener);
}
