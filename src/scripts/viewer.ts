// Visor: conmutador de tamaño, teclas (también reenviadas desde el iframe), favorita, copiar enlace y CTA.
import { getFavs, onFavs, readContactData, setLastRef, toggleFav, whatsappFor } from './favs';

export function initViewer() {
  const root = document.querySelector<HTMLElement>('.viewer');
  if (!root) return;
  const slug = root.dataset.slug ?? '';
  const frame = root.querySelector<HTMLElement>('.frame');
  const iframe = root.querySelector<HTMLIFrameElement>('.frame__live');
  setLastRef(slug);

  // La captura se muestra hasta que la web en vivo carga
  iframe?.addEventListener('load', () => frame?.classList.add('is-live'));

  // Tamaño (solo emula el ancho del iframe; salta, no se anima)
  const radios = [...root.querySelectorAll<HTMLButtonElement>('[data-device]')];
  const setDevice = (d: string) => {
    if (frame) frame.dataset.device = d;
    radios.forEach((r) => {
      r.setAttribute('aria-checked', String(r.dataset.device === d));
      r.tabIndex = r.dataset.device === d ? 0 : -1;
    });
    try {
      sessionStorage.setItem('gaya-device', d);
    } catch {
      /* ignorar */
    }
  };
  radios.forEach((r, i) => {
    r.addEventListener('click', () => setDevice(r.dataset.device ?? 'desktop'));
    r.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const n = radios[(i + step + radios.length) % radios.length];
      n.focus();
      setDevice(n.dataset.device ?? 'desktop');
    });
  });
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem('gaya-device');
  } catch {
    /* ignorar */
  }
  setDevice(saved && radios.some((r) => r.dataset.device === saved) ? saved : 'desktop');

  // Teclas: Esc vuelve a la galería; ← → cambian de referencia (también reenviadas desde el marco)
  const go = (href?: string) => href && (location.href = href);
  const onKey = (key: string) => {
    if (key === 'Escape') go(root.dataset.gallery);
    else if (key === 'ArrowLeft') go(root.dataset.prev);
    else if (key === 'ArrowRight') go(root.dataset.next);
  };
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !(e.target as HTMLElement)?.closest('[role="radiogroup"]')) onKey(e.key);
  });
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== iframe?.contentWindow) return;
    if (e.data?.gaya === 'key') onKey(String(e.data.key));
  });

  // Favorita + CTA
  const fav = root.querySelector<HTMLButtonElement>('[data-fav]');
  const cta = root.querySelector<HTMLAnchorElement>('#cta');
  const data = readContactData();
  const paint = () => {
    const favs = getFavs();
    const on = favs.includes(slug);
    if (fav) {
      fav.setAttribute('aria-pressed', String(on));
      fav.setAttribute('aria-label', (on ? fav.dataset.labelOn : fav.dataset.labelOff) ?? '');
    }
    // Con favoritas guardadas, el mensaje lista todas (la actual incluida)
    if (cta && data) cta.href = whatsappFor(data, favs.length ? [...new Set([...favs, slug])].slice(-3) : [slug]);
  };
  fav?.addEventListener('click', () => toggleFav(slug));
  onFavs(paint);
  paint();

  // Copiar enlace
  const copy = root.querySelector<HTMLButtonElement>('#copy');
  const status = document.getElementById('copy-status');
  copy?.addEventListener('click', async () => {
    const url = root.dataset.canonical ?? location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copy.classList.add('is-done');
    if (status) status.textContent = copy.dataset.done ?? '';
    setTimeout(() => {
      copy.classList.remove('is-done');
      if (status) status.textContent = '';
    }, 1800);
  });

  // Transición: la ventana del visor recibe el mismo nombre que la tarjeta pulsada
  window.addEventListener('pagereveal', ((e: Event & { viewTransition?: unknown }) => {
    if (!e.viewTransition) return;
    const stage = root.querySelector<HTMLElement>('.frame');
    if (stage) stage.style.viewTransitionName = 'ref-stage';
  }) as EventListener);
}
