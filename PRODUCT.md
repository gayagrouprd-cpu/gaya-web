# PRODUCT — Gaya Digital (gaya.com.do)

**Registro:** marca (el diseño ES el producto). Sitio de presentación: una serie de ocho carteles hechos de luz, más una galería de ejemplos.

## Quién y para qué
- **Quién visita:** dueños de negocios pequeños y medianos de República Dominicana (sobre todo desde el celular, llegando por el enlace de Instagram, TikTok o WhatsApp) y clientes internacionales. No son técnicos.
- **Qué debe pasar:** en pocos segundos entienden qué hace Gaya Digital (web y apps, automatización e IA, marketing, soporte IT), ven ejemplos de su rubro y escriben por WhatsApp con el servicio o el ejemplo ya escrito.
- **Acción principal:** WhatsApp (mensaje prellenado). Secundaria: correo. Terciaria: ver todos los ejemplos.
- **Escena:** un dueño de negocio, de noche, con un Android modesto, abre el enlace de la bio de Instagram. Debe sentir que descubrió algo que no creía posible en una web, y querer escribir.

## Marca
- **Nombre:** Gaya Digital (decisión del usuario, 29-sep-2026; antes «Gaya Group», que queda como `alternateName` en los datos estructurados). Handle de redes: @gayagrouprd (sin cambiar todavía). Santo Domingo, República Dominicana. Marca personal de Giancarlo González (Director).
- **Servicios:** desarrollo web y apps · automatización e IA · marketing digital y manejo de redes · soporte e infraestructura IT. Orden de la página: ese.
- **Voz:** cercana y directa, sin jerga; español dominicano neutro con «tú», inglés simple. Titulares cortos (≤ 7 palabras). «Wao» es de la casa.
- **Bilingüe:** español por defecto, inglés en `/en/`, con los mismos componentes y paridad de copia.
- **Colores:** paleta Cobalto (luz fría de pantalla bajo el agua): 16 tonos T0–T15 derivados de `--glow-0..3`. **Logo:** horizontal del kit de marca (dos olas naranja #FCA311 y blanco, «gaya» + «digital»), en línea en `Logo.astro`; iconos del kit en `public/` (favicon.svg/.ico, apple-touch-icon, icon-512).

## Reglas (del dueño y del oficio)
- **La interfaz se explica sola.** Cero texto instructivo, cero «cómo funciona», cero subtítulos que narran el control. Etiquetas, iconos, layout y estado.
- **Honestidad:** sin clientes, testimonios, cifras, años, premios ni logos inventados. Los ejemplos son webs de muestra con datos ficticios y llevan sello «Datos ficticios». Los datos locales llevan su fuente y caducan solos. Las capacidades que el dueño no ha confirmado no se publican (`brand.json › confirmed`).
- **No se menciona que la web la hizo una IA.** Ni sección ni crédito. (El servicio «Automatización e IA» sí se ofrece.)
- **Cero terceros:** fuentes propias, sin analítica, sin CDN, sin formularios. CSP `default-src 'self'`; guardia de red en cada página.
- **El arte es decoración.** Todo lo que se lee es texto real; el arte ASCII va en `aria-hidden`, nunca lleva información y se degrada a fotograma fijo.
- **Rendimiento real:** celulares modestos primero (Galaxy A07). Lighthouse móvil ≥ 90, LCP < 2,5 s, CLS 0. Respaldo estático hermoso, `prefers-reduced-motion` respetado.
- **Anti-plantilla:** nada de cuadrícula de tarjetas iguales (las cuatro fichas de servicio no comparten plantilla), rótulos sobre cada sección, fondos de puntos, degradados en texto, cremas/arenas, cursivas en titulares, marcas de terminal (prompt, cursor, corchetes, verde).

## Antirreferencias
La landing SaaS crema-y-violeta, la agencia con cuatro tarjetas iguales y un chat de ejemplo, el «hero + 3 features + CTA» de manual, el mockup de laptop con degradado, el campo de letras que cae y la placa de circuito.

## Sitio
- `/` y `/en/` — ocho carteles (`GAYA · HOLA · WEB · LISTO · ECO · ON · VER · TÚ`; en inglés `GAYA · HELLO · WEB · READY · ECHO · ON · SEE · YOU`) que una marea cambia: portada, quiénes somos, servicios (índice y cuatro fichas), ejemplos, proceso y contacto. Especificación cerrada: `docs/ascii/DIRECTION.md`.
- `/referencias/` y `/en/references/` — galería de **Ejemplos** (la URL conserva «referencias»); `/referencias/<slug>/` — visor con la web de ejemplo en vivo.
- `/ref/<slug>/` — las webs de ejemplo (estáticas, `noindex`).
