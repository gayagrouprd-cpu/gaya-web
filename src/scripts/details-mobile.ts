// «Más detalles» de las fichas de servicio (DIRECTION §4.6, MN-10): en móvil, Para quién / Necesitamos / Resultado van plegados
// (el <details> cierra); en escritorio siempre abiertos (el resumen se oculta por CSS). El HTML sale abierto: sin JS se lee todo.
// Mismo punto de corte que la celda del arte (56,25 rem = 900 px, src/styles/tokens.css).

function initDetails(): void {
  const wide = window.matchMedia('(min-width: 56.25rem)');
  const sync = (): void => {
    for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-more]')) d.open = wide.matches;
  };
  sync();
  wide.addEventListener('change', sync);
}

initDetails();
