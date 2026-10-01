// Comportamiento del cromo (DIRECTION §4.5 y §10). Todo es mejora: sin este script los enlaces son enlaces y el menú es un
// popover nativo. Lo que hace:
//   1. Scroll-spy: `aria-current="location"` en el destino de la sección que cruza la franja del 45–50 % de la pantalla
//      (un solo IntersectionObserver, rootMargin «-45% 0 -50% 0»), sin tocar el historial.
//   2. El enlace de idioma conserva la sección que se está leyendo (la equivalente del otro idioma).
//   3. La barra inferior se oculta mientras el botón primario de la portada ([data-cta]) está a la vista (y mientras el menú está abierto).
//   4. Mide la píldora y la barra reales (ResizeObserver) y las publica como --chrome-top / --chrome-bottom: son el
//      `scroll-padding` de la página (2.4.11, el cromo fijo no tapa el foco ni las anclas).
//   5. Menú: cierra el popover al elegir un destino y lleva el foco a la sección; `html[data-menu="open"]` mientras está
//      abierto (el motor se pausa); al abrir el foco va a «Cerrar» y el resto de la página queda `inert` (el foco no puede
//      caer detrás del menú opaco); respaldo sin popover nativo.

const DESKTOP = '(min-width: 56.25rem)';

const all = <T extends Element>(sel: string, root: ParentNode = document): T[] => [...root.querySelectorAll<T>(sel)];

/** Altura de la celda del arte (--ch) en px: «1 fila» de aire bajo y sobre el cromo. */
function cellHeight(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch'));
  return Number.isFinite(v) && v > 0 ? v : 18;
}

function measure(nav: HTMLElement): void {
  const root = document.documentElement;
  const pill = nav.querySelector<HTMLElement>('.nav__pill');
  const bar = document.querySelector<HTMLElement>('[data-bar]');
  const apply = (): void => {
    const row = cellHeight();
    if (pill) root.style.setProperty('--chrome-top', `${Math.ceil(pill.getBoundingClientRect().bottom + row)}px`);
    // offsetHeight es la altura de diseño (con la zona segura): no cambia mientras la barra está oculta por transform; en escritorio es 0.
    root.style.setProperty('--chrome-bottom', `${Math.ceil((bar ? bar.offsetHeight : 0) + row)}px`);
  };
  apply();
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(apply);
    if (pill) ro.observe(pill);
    if (bar) ro.observe(bar);
  }
  // --ch cambia con el ancho (6 · 9 · 12 px de celda) sin que cambie el tamaño de la píldora
  window.addEventListener('resize', apply, { passive: true });
}

function spy(nav: HTMLElement): void {
  const links = all<HTMLAnchorElement>('[data-spy]');
  let anchors: Record<string, string> = {};
  try {
    anchors = JSON.parse(nav.dataset.anchors ?? '{}');
  } catch {
    anchors = {};
  }
  // Secciones a vigilar: las de los destinos del menú y todas las que tienen equivalente en el otro idioma.
  const ids = new Set<string>(Object.keys(anchors));
  for (const a of links) for (const id of (a.dataset.spy ?? '').split(' ')) if (id) ids.add(id);
  const sections = [...ids].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
  if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;
  sections.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  const langLinks = all<HTMLAnchorElement>('[data-lang-switch]');
  const base = new Map(langLinks.map((a) => [a, a.getAttribute('href') ?? '']));
  const live = new Set<Element>();
  let current: string | null | undefined;

  const show = (id: string | null): void => {
    if (id === current) return;
    current = id;
    for (const a of links) {
      if (id !== null && (a.dataset.spy ?? '').split(' ').includes(id)) a.setAttribute('aria-current', 'location');
      else if (a.getAttribute('aria-current') === 'location') a.removeAttribute('aria-current');
    }
    const other = id === null ? '' : (anchors[id] ?? '');
    for (const a of langLinks) a.setAttribute('href', (base.get(a) ?? '') + (other ? `#${other}` : ''));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) live.add(e.target);
        else live.delete(e.target);
      }
      // Si varias secciones cruzan la franja a la vez (anidadas o en el borde), manda la última en orden de documento.
      let cur: HTMLElement | null = null;
      for (const s of sections) if (live.has(s)) cur = s;
      show(cur ? cur.id : null);
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );
  for (const s of sections) io.observe(s);
}

/** La barra inferior: oculta (e `inert`) mientras el botón de la portada se ve y mientras el menú de pantalla completa está abierto.
 *  Devuelve el aviso «el menú se abrió/cerró»: así el menú no le quita a la barra un `inert` que le toca por el botón de la portada. */
function bar(): (menuOpen: boolean) => void {
  const el = document.querySelector<HTMLElement>('[data-bar]');
  if (!el) return () => {};
  const cta = document.querySelector<HTMLElement>('[data-cta]');
  let hidden: boolean | null = null; // null = el observador aún no ha dicho nada (la barra conserva su estado de partida)
  let menuOpen = false;
  const apply = (): void => {
    if (hidden !== null) el.dataset.hidden = String(hidden);
    el.toggleAttribute('inert', hidden === true || menuOpen);
  };
  if (cta && typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(([e]) => {
      hidden = e.isIntersecting;
      apply();
    }).observe(cta);
  }
  return (open) => {
    menuOpen = open;
    apply();
  };
}

function focusSection(hash: string): void {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

const NOT_CONTENT = /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/;

/** Todo lo que no es el propio menú: los hermanos de `el` y los de cada uno de sus ancestros hasta <body>. */
function everythingElse(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let n: HTMLElement = el; n !== document.body && n.parentElement; n = n.parentElement) {
    for (const s of Array.from(n.parentElement.children)) {
      if (s !== n && s instanceof HTMLElement && !NOT_CONTENT.test(s.tagName)) out.push(s);
    }
  }
  return out;
}

function menu(nav: HTMLElement, setBarMenu: (open: boolean) => void): void {
  const pop = nav.querySelector<HTMLElement>('[data-menu-panel]');
  const button = nav.querySelector<HTMLButtonElement>('.nav__menu');
  if (!pop || !button) return;
  const closeButton = pop.querySelector<HTMLButtonElement>('.menu__close');
  const root = document.documentElement;
  const native = 'popover' in HTMLElement.prototype && typeof pop.hidePopover === 'function';

  // Menú abierto = es lo único que existe: el resto de la página (y la píldora que el menú tapa) se apaga con `inert`, así el
  // foco no puede caer en algo que el menú opaco esconde (2.4.11) y el lector de pantalla no lee la página de fondo. Solo se
  // devuelve lo que se apagó aquí. La barra inferior lleva su propio `inert` (por el botón de la portada): la gestiona bar().
  const held: HTMLElement[] = [];
  const hold = (on: boolean): void => {
    if (on && held.length === 0) {
      for (const s of everythingElse(pop)) {
        if (s.hasAttribute('data-bar') || s.hasAttribute('inert')) continue;
        s.setAttribute('inert', '');
        held.push(s);
      }
    } else if (!on) {
      for (const s of held) s.removeAttribute('inert');
      held.length = 0;
    }
    setBarMenu(on);
  };
  const onState = (open: boolean): void => {
    button.setAttribute('aria-expanded', String(open));
    if (open) root.dataset.menu = 'open';
    else delete root.dataset.menu;
    hold(open);
  };
  // Al abrir, el foco va a «Cerrar» (lo que el navegador hace ya con `autofocus`); al cerrar vuelve al botón «Menú» si nadie lo recogió
  const settleFocus = (open: boolean): void => {
    const a = document.activeElement;
    if (open) {
      if (!a || !pop.contains(a)) closeButton?.focus();
    } else if (!a || a === document.body) button.focus();
  };
  const close = (): void => {
    if (native) {
      if (pop.matches(':popover-open')) pop.hidePopover();
    } else if (pop.dataset.open === 'true') {
      pop.dataset.open = 'false';
      onState(false);
      button.focus(); // el foco sigue en «Cerrar» hasta el próximo repintado: se lleva al botón «Menú» sin esperar
    }
  };
  onState(false);

  const opening = (e: Event): boolean => (e as Event & { newState?: string }).newState === 'open';
  if (native) {
    // `beforetoggle` llega ANTES de abrir o cerrar: al cerrar, el botón ya no es inert cuando el navegador le devuelve el foco
    pop.addEventListener('beforetoggle', (e) => onState(opening(e)));
    pop.addEventListener('toggle', (e) => {
      onState(opening(e));
      settleFocus(opening(e));
    });
  } else {
    // Respaldo para navegadores sin la API Popover (WebViews antiguas): el mismo comportamiento con un atributo.
    pop.removeAttribute('popover');
    button.removeAttribute('popovertarget');
    all<HTMLElement>('[popovertarget]', pop).forEach((b) => b.addEventListener('click', close));
    button.addEventListener('click', () => {
      const open = pop.dataset.open !== 'true';
      pop.dataset.open = String(open);
      onState(open);
      settleFocus(open);
    });
    document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }

  pop.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a) return;
    const samePage = a.origin === location.origin && a.pathname === location.pathname;
    close();
    // hidePopover devuelve el foco al botón: lo llevamos a la sección elegida, que es lo que espera quien navega con teclado
    if (samePage && a.hash) requestAnimationFrame(() => focusSection(a.hash));
  });

  // Si la pantalla crece hasta el escritorio con el menú abierto, se cierra (ya no es el menú que toca)
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener('change', (e) => e.matches && close());
}

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  measure(nav);
  spy(nav);
  menu(nav, bar());
}
