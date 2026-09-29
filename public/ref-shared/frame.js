/*
 * Base común de las webs de ejemplo (public/ref/<slug>/). Se incluye con:
 *   <script src="../../ref-shared/frame.js"></script>
 * Qué hace:
 *  - Lee ?lang= y ?still y lo expone en window.GAYA = { lang, langs, still, embedded }.
 *  - Fija <html lang> según el idioma pedido (solo entre los declarados en <html data-langs="es,en">).
 *  - Modo ?still: marca <html data-still> y congela animaciones/transiciones (para las capturas).
 *  - Sello discreto «Sitio de ejemplo · Gaya Group».
 *  - Dentro del visor: reenvía Escape y flechas (solo si no las usa la propia web) y evita que un
 *    enlace navegue el marco (los externos se abren en pestaña nueva, los internos a otra ruta se bloquean).
 */
(function () {
  'use strict';
  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);
  var langs = (doc.getAttribute('data-langs') || 'es').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var wanted = (params.get('lang') || '').toLowerCase();
  var lang = langs.indexOf(wanted) > -1 ? wanted : langs[0];
  var still = params.has('still');
  var embedded = window.parent !== window;

  doc.setAttribute('lang', lang);
  window.GAYA = { lang: lang, langs: langs, still: still, embedded: embedded };

  // Base de comportamiento dentro del marco
  var base = document.createElement('style');
  base.textContent = 'html{overscroll-behavior:contain}' + (still ? '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}' : '');
  document.head.appendChild(base);
  if (still) doc.setAttribute('data-still', '');

  // Sello «ejemplo»
  var label = lang === 'en' ? 'Sample site · Gaya Group' : 'Sitio de ejemplo · Gaya Group';
  function badge() {
    var b = document.createElement('aside');
    b.setAttribute('data-gaya-badge', '');
    b.setAttribute('aria-label', lang === 'en' ? 'Notice' : 'Aviso');
    b.textContent = label;
    b.style.cssText =
      'position:fixed;left:12px;bottom:calc(12px + var(--gaya-badge-lift,0px));z-index:2147483000;padding:6px 10px;' +
      'border-radius:999px;font:600 11px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em;' +
      'background:oklch(0.18 0.01 260/.82);color:oklch(0.96 0.005 260);pointer-events:none;white-space:nowrap';
    document.body.appendChild(b);
  }
  if (document.body) badge();
  else document.addEventListener('DOMContentLoaded', badge);

  // Reenvío de teclas al visor (solo si la propia web no las ha consumido)
  if (embedded) {
    window.addEventListener('keydown', function (e) {
      if (e.defaultPrevented) return;
      var t = e.target;
      var typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (typing) return;
      var k = e.key;
      if (k === 'Escape' || ((k === 'ArrowLeft' || k === 'ArrowRight') && (document.activeElement === document.body || !document.activeElement))) {
        window.parent.postMessage({ gaya: 'key', key: k }, location.origin);
      }
    });
  }

  // Ningún enlace debe navegar el marco ni anidar Gaya dentro de sí mismo
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (_) { return; }
    var samePage = u.origin === location.origin && u.pathname === location.pathname;
    if (samePage) return; // #ancla o misma página
    e.preventDefault();
    if (u.origin !== location.origin && /^https?:$/.test(u.protocol)) window.open(u.href, '_blank', 'noopener');
  }, true);
})();
