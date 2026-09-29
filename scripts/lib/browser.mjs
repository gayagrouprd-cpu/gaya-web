// Lanza el Chrome real del sistema (o Edge) con Playwright: sin descargar navegadores aparte.
import { chromium } from 'playwright';

export async function launchBrowser({ headless = true, args = [] } = {}) {
  const errors = [];
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless, args });
    } catch (err) {
      errors.push(`${channel}: ${String(err?.message ?? err).split('\n')[0]}`);
    }
  }
  throw new Error(`No se pudo abrir Chrome ni Edge.\n${errors.join('\n')}`);
}

export function isExternal(url, baseOrigin) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(u.protocol)) return false; // data:, blob:, about:
  return u.origin !== baseOrigin;
}

/** Recorre la página para disparar imágenes perezosas y observadores de scroll. */
export async function scrollThrough(page, { step = 700, pause = 90 } = {}) {
  await page.evaluate(
    async ({ step, pause }) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let y = 0;
      const max = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      while (y < max()) {
        window.scrollTo(0, y);
        y += step;
        await sleep(pause);
      }
      window.scrollTo(0, max());
      await sleep(pause * 3);
      window.scrollTo(0, 0);
    },
    { step, pause },
  );
}
