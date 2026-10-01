// T4 (lado del motor) · axe (wcag2a, wcag2aa, wcag22aa) sobre el laboratorio con el motor montado, en escritorio, móvil y movimiento
// reducido: el lienzo decorativo no debe aportar NINGUNA violación. (Las del propio documento de laboratorio, que no es una página
// del sitio, se listan aparte como informativas.) Y el lienzo no es enfocable, no captura el puntero y no se selecciona.
import AxeBuilder from '@axe-core/playwright';
import { check, finish, info, launchBrowser, open, ready, sleep } from './lib.mjs';

const browser = await launchBrowser();
for (const [name, opts] of [
  ['escritorio', { w: 1440, h: 900 }],
  ['móvil', { w: 390, h: 844, dpr: 3, mobile: true }],
  ['movimiento reducido', { w: 1440, h: 900, reduced: true }],
]) {
  const s = await open({ browser, ...opts });
  await ready(s.page);
  await sleep(3000);
  const r = await new AxeBuilder({ page: s.page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  const onCanvas = r.violations.filter((v) => v.nodes.some((n) => /canvas/.test(n.target.join(' ') + n.html)));
  check(`axe (${name}): el lienzo no aporta violaciones`, onCanvas.length === 0, onCanvas.map((v) => v.id).join(', '));
  info(`axe (${name}): violaciones del documento de laboratorio: ${r.violations.map((v) => v.id).join(', ') || 'ninguna'}`);
  const props = await s.page.evaluate(() => {
    const c = document.querySelector('canvas.field');
    const cs = getComputedStyle(c);
    c.focus();
    return { aria: c.getAttribute('aria-hidden'), translate: c.translate, tab: c.tabIndex, pe: cs.pointerEvents, us: cs.userSelect, pos: cs.position, focused: document.activeElement === c, role: c.getAttribute('role') };
  });
  check(`lienzo (${name}): aria-hidden, translate=no, sin foco, pointer-events none, user-select none, position fixed`, props.aria === 'true' && props.translate === false && props.tab === -1 && props.pe === 'none' && props.us === 'none' && props.pos === 'fixed' && !props.focused && props.role === null, JSON.stringify(props));
  await s.close();
}
await browser.close();
finish('accesibilidad del lienzo');
