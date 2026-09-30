# 04 · Contenido de servicios para Gaya Digital (agencia digital caribeña)

Investigación y verificación: **30-sep-2026**. Todo dato marcado como «vigente» se leyó en fuente ese día. Alcance: qué ofrecen y cómo explican bien sus servicios las agencias pequeñas de RD, LATAM y el Caribe; qué necesita de verdad un negocio dominicano; y el contenido final (ES/EN) de las 4 fichas de servicio, el bloque «Quiénes somos» y el orden de conversión.

**Cómo leer las etiquetas de confianza** (van en cada dato):

| Grado | Significa |
|---|---|
| **A** | Fuente oficial o primaria leída (PDF/HTML). En PDFs leí el texto crudo (`pdftotext`); en HTML solo el resumen que devolvió el lector web, así que los 10 datos críticos (sección 7) se revisan a mano antes de publicar. |
| **B** | La fuente oficial no cargó o no se leyó, pero ≥ 2 medios/consultoras independientes la citan y coinciden. |
| **C** | Una sola fuente secundaria o afirmación de un proveedor. **No se publica en la web**; solo sirve para calibrar. |
| **X** | Contradictorio entre fuentes o sin verificar. Prohibido publicarlo. |
| **[CONFIRMAR]** | No es un hecho del mundo sino una capacidad, compromiso o decisión de Giancarlo. Nada con esta marca sale a producción hasta que él la apruebe. |

---

## 0. Resumen ejecutivo

1. **Las agencias dominicanas leídas (Byar, TAKUM, Gmedia, Novum) venden capacidades («diseño, SEO, redes»), casi nunca entregables, plazos ni precio.** Cuando prueban algo, es con cifras sin contexto (`100+ proyectos`, `ROI 200-500%`, `80% más reservas`) o con contadores puestos en `0+` que ni cargan (TAKUM). Gaya no puede ni debe copiar eso. Lo que sí puede: **enumerar exactamente qué recibes, en cuánto tiempo se ve una propuesta y qué necesitamos de ti.**
2. **Hueco local real:** Byar, TAKUM, Novum y Gmedia no mencionan e-CF, DGII ni AZUL en lo leído; solo Support IT (Odoo con cumplimiento DGII) y plataformas como Alegra o Vendabo lo hacen. Un estudio que dice cosas verificables y fechadas sobre cómo funcionan aquí la facturación electrónica, los pagos, WhatsApp y los apagones se distingue sin inventar un solo cliente.
3. **Urgencia verdadera y fechada:** el plazo de e-CF para pequeños, micro y no clasificados vence el **15-nov-2026** (prórroga automática, Aviso 06-26 del 6-may-2026); grandes locales y medianos emiten **solo e-CF desde el 1-nov-2026**; Meta empieza a **cobrar los mensajes de servicio de la API de WhatsApp el 1-oct-2026**. Son tres fechas que caducan en semanas: cada dato lleva «Verificado 30 sep 2026» y una fecha de re-verificación.
4. **Gaya no es proveedor de facturación electrónica ni emisor** (es marca personal sin RNC; el Facturador Gratuito exige RNC + Alta NCF + certificado digital). Puede *conectar* la web/tienda con el proveedor certificado del cliente. Nunca prometer «cumplimiento DGII».
5. **Trampa interna del dueño (no va al sitio):** las empresas dominicanas piden comprobante fiscal para deducir gastos (el e-CF tipo 31 existe para eso). Una marca personal sin RNC no puede emitirlo. Antes de vender a empresas, Giancarlo debe resolver RNC + e-CF propio (ver D26).
6. **Orden recomendado en la página** (no en las bios): 1 Web y apps → 2 Automatización e IA → 3 Marketing y redes → 4 Soporte e infraestructura IT. Razón: primacía (NN/g), la galería de 14 referencias es la prueba de lo primero, y WhatsApp (el canal de conversión) es el hilo entre 1 y 2. Se mide **sin analítica**: cada botón abre WhatsApp con el servicio ya escrito y el dueño etiqueta el chat.
7. **Precio:** NN/g documenta que el precio es la necesidad #1 de información y que esconderlo se lee como evasivo. Gaya aún no tiene tarifas: no se inventan; el sitio promete lo que ya existe en `brand.json` (**propuesta por escrito en 24-48 h**, [CONFIRMAR]) y el dueño decide si publica «desde» después de 3 proyectos.
8. **IA con límites verificables:** Meta restringe en su API los asistentes de IA de uso general; permite bots con función de negocio (soporte, citas, pedidos). Y la política de mensajería exige camino de escalamiento a una persona. La ficha de Automatización e IA se redacta sobre esas dos reglas.
9. **Datos que NO usar** aunque suenen bien: DataReportal (TikTok «99,6% de mayores de 18»: es alcance publicitario, no personas), `60-75% menos consultas` (blogs de proveedores), comisiones de pasarelas (rangos de un blog de plataforma), «1,000 mensajes de WhatsApp gratis» (solo en terceros). Lo que sí se verificó y puede usarse: RD no está en la lista de países de Stripe, y PayPal sí retira a bancos locales (un blog dice lo contrario).
10. **Entregables de este informe listos para pegar:** copy final ES/EN de 4 servicios con presupuesto de columnas ya medido (todo cabe en un marco de 56/52 columnas), 12 «datos locales» de ≤ 100 columnas con fuente, bloque Quiénes somos, esquemas TS + lint + constructor de enlace WhatsApp + JSON-LD (todos probados en Node 24.19), y 4 bocetos ASCII originales de «cómo se ve el resultado».

---

## 1. Hallazgos

### 1.1 Lectura de agencias y estudios (RD, LATAM, Caribe)

Leí la página real de cada una el 30-sep-2026 (dos no cargaron: buggin.dev por `ECONNREFUSED`, agenciaweb.lat por bloqueo; se descartan).

| Estudio | Servicios y cómo los explica | Qué tomar | Qué evitar |
|---|---|---|---|
| **Byar Marketing** (RD) <https://byarmarketing.com/> | Ads Meta/Google, web no-code, redes, contenido, branding, SEO, eventos, automatización WhatsApp/Facebook. Una línea por servicio, sin entregables ni precio. Proceso de 3 pasos (llamada, planeación, resultados). Prueba: «100+ proyectos, 40+ clientes, 8+ años», logos, 8 testimonios en video. | Proceso corto de 3 pasos. | Vende automatización de WhatsApp y **no muestra WhatsApp como canal**. Cifras sin contexto. |
| **TAKUM** (RD) <https://takum.io/> | 8 categorías (web, branding, marketing, SEO, pauta, redes, email, CRM-ERP), 2-3 subservicios con página. Orden: hero → estadísticas → logos → servicios → integraciones → proceso de 4 fases → portafolio → verticales → diferenciales → testimonios → CTA. CTA «Agenda tu consulta estratégica» + WhatsApp. IA: una línea. | Ordenar la confianza antes del CTA; proceso de 4 fases. | Contadores en `+0`/`0+`, logos que no cargan, «100% satisfacción». |
| **Gmedia** (RD) <https://gmedia.do/> | 7 categorías, sin paquetes. FAQ publica **«RD$10,000-50,000 al mes»** como rango de mercado y «3 a 6 meses» para ver resultados. WhatsApp como canal principal. «16 años, 150+ proyectos, #1». | Un rango de precio y un plazo realista en el FAQ. | El «#1». |
| **Novum Solutions** (RD) <https://novumsolutions.com.do/> | 6 verticales (SEO local, web, CRM, WhatsApp API, publicidad, auditoría gratis) bajo «Digitalízate RD», **ordenados por madurez del cliente** (visibilidad → web → leads → escala). WhatsApp «Empezar conversación» como CTA; diagnóstico gratis en 48 h. | Ordenar por madurez; diagnóstico como puerta. | No dice nada de e-CF, DGII ni AZUL (hueco). |
| **Support IT** (RD) <https://www.supportit.com.do/> | Soporte gestionado con SLA, Odoo con cumplimiento DGII, CRM+IA, contabilidad, ciberseguridad, M365, web. **Planes RD$15,000-170,200/mes** según tamaño y tiempo de respuesta (<8 h a <1 h). Diagnóstico de 30 min, sin permanencia, garantía de 30 días, «damos la cara» (equipo en RD). | SLA por escrito, mes a mes, precio visible, cara local. | Tono de miedo (ransomware, caídas) y urgencia artificial («cupos limitados»). |
| **Perxist** (RD) <https://perxist.com/servicios/chatbot-whatsapp/> | Chatbots con IA sobre la API oficial de Meta, traspaso humano, CRM; casos: retail, clínicas, seguros. Sin precio ni plazos. «60-70% de consultas resueltas» sin fuente. | «API oficial» y «traspaso humano» como diferenciales. | La estadística. |
| **Appketing** (RD) <https://appketing.com/chatbots-whatsapp/> | Proceso de 6 pasos (preguntas frecuentes → flujo → plataforma → integración → pruebas → monitoreo). Casos con cifras: «+80% reservas en 3 meses», «ROI 200-500%». | Los 6 pasos. | **Todas** las cifras (sin fuente ni contexto). |
| **Intelia** (RD) <https://www.inteliard.com/blog/como-activar-whatsapp-api-republica-dominicana> (31-mar-2026) | Explica la activación de la API en RD: prefijos +1 809/829/849, coexistencia, planes RD$26,995 (Esencial) y RD$53,995 (con IA) [precios del proveedor, grado C]. | Explicar requisitos concretos del número. | Presenta como requisitos de Meta cosas que son del proveedor (p. ej. «≥ 7 días de uso»). |
| **PANCA Studio** (CO) <https://panca.studio/> | 4 categorías con entregables; proceso de 4 etapas **con plazos** (diagnóstico 1-2 días, diseño 1-3 semanas); rangos de precio (COP 500 K-3 M+); CTA WhatsApp «Hablemos»; encuadre «tu cliente busca antes de comprar». | Plazos por etapa, rangos, encuadre por necesidad. | Frases hechas («tráfico que convierte»). |
| **undertk** (MX) <https://www.undertk.studio/desarrollo-sitios-web> | «Problema primero», sin paquetes ni precios (y lo dice); FAQ con **calificador negativo** («si la prioridad es solo salir rápido…»); casos con resultado cuantificado. | FAQ honesto que filtra; empezar por el problema del negocio. | Sin «qué incluye» ni plazos: el dueño pequeño no sabe qué compra. |
| **Phoenix Caribbean** (BVI) <https://phoenixcaribbean.com/services> | 7 servicios numerados (web, gestión, SEO/GEO, marketing, consultoría, ciberseguridad, IA); público concreto (hoteles pequeños, villas, operadores marinos, prácticas profesionales, ONG); plazos (web 4-12 semanas, SEO 3-6 meses); **explica por qué no publica precios** y recomienda «la opción más barata aunque no seamos nosotros». | Especificidad regional y de público; explicar el precio; honestidad como marca. | Descripciones genéricas y cero casos en la página. |

### 1.2 Diez patrones que salen de ahí (y cómo los usa Gaya)

1. **Nombrar el resultado, no la herramienta** (undertk, PANCA). → Cada promesa es una frase de ≤ 56 columnas que dice qué pasa en el negocio del cliente.
2. **Enumerar entregables** (hueco: Byar, Phoenix, undertk no lo hacen). → 7 «Incluye» por servicio.
3. **Plazo por etapa** (PANCA, Phoenix). → Solo se publica el que ya existe: propuesta en 24-48 h (`brand.json › commitments.proposalHours`, [CONFIRMAR]). El resto de plazos queda como constante vacía hasta medirlo en proyectos reales.
4. **Precio visible o al menos explicado** (NN/G; Support IT, Gmedia, Intelia lo publican). → Sin inventar: «propuesta por escrito con alcance y precio» + decisión D9.
5. **WhatsApp como CTA principal** (PANCA, Novum, Gmedia, TAKUM). → Ya es la regla del proyecto. Byar es el contraejemplo.
6. **Dato local fechado como diferenciador** (hueco en las 4 agencias). → 12 «datos locales» con «Verificado 30 sep 2026».
7. **IA explicada con reglas, no con cifras** (Perxist tiene traspaso humano; Appketing miente con números). → Reglas + traspaso + registro.
8. **Filtro honesto** (undertk, Phoenix). → Campo `outOfScope` por servicio (no siempre visible; ver 2.6).
9. **Orden por madurez del cliente** (Novum) y por primacía (NN/g). → Sección 4.
10. **No vender con miedo** (Support IT). → El copy de IT nombra el resultado («que no te frenen»), no el desastre.

### 1.3 Evidencia de UX que respalda las decisiones

- **Precio:** para NN/g es la necesidad #1 de información en B2B; sin precio, los participantes «van a los sitios de la competencia»; si no puedes dar el exacto, muestra casos representativos, y evita calculadoras (complejas y propensas a error). <https://www.nngroup.com/articles/show-price/> [A]
- **About Us:** 3 rondas, 70+ usuarios, 100 sitios, 85 guías. Lo que restó: fotos de stock, muros de texto, información crítica escondida, navegación compleja. Lo que suma: imágenes auténticas, varios canales de contacto visibles, lenguaje llano; y los usuarios **contrastan lo que dice la empresa con reseñas de terceros**. Sugieren: eslogan → resumen de 1-2 párrafos → subpáginas. <https://www.nngroup.com/articles/about-us-information-on-websites/> [A]
- **Credibilidad (4 factores):** calidad de diseño, divulgación por adelantado (contacto, precios, políticas), contenido completo, correcto y **vigente**, y conexión con el resto de la web («la gente confía más en testimonios de sitios externos que en los del propio sitio»). <https://www.nngroup.com/articles/trustworthy-design/> [A]
- **Primacía:** «pon lo importante primero». <https://www.nngroup.com/videos/primacy-effect/> [A]

Implicación para Gaya: sin reseñas ni clientes publicables, los factores que sí controla son **divulgación (contacto, compromisos), vigencia (datos con fecha) y conexión (perfiles reales enlazados)**. Reseñas de Google solo cuando existan.

### 1.4 Lo que necesita de verdad un negocio en República Dominicana (hechos verificados)

Los IDs `Fxx` remiten al registro de la sección 7 (URL, fecha, grado, cuándo re-verificar).

#### a) Facturación electrónica (DGII)

- **Base legal:** Ley 32-23 (promulgada 16-may-2023). Art. 37: plazos máximos de 12 meses (grandes nacionales), 24 (grandes locales y medianos) y 36 (pequeños, micro y no clasificados) desde la vigencia; Art. 38: período de voluntariedad. Art. 26-27: infracciones y sanción vía Art. 257 del Código Tributario. [F03, F04; A]
- **Vigente hoy:** Aviso 06-26 (6-may-2026): prórroga automática de 6 meses **solo** para pequeños, micro y no clasificados → **15-nov-2026**. Medianos no incluidos. [F01; B]
- **Grandes locales y medianos:** emisión **exclusiva** de e-CF tipo «E» desde el **1-nov-2026**; las secuencias «B» dejan de valer el 31-oct-2026 salvo contingencia declarada (Reglamento 587-24, Art. 55). Comunicado de la DGII de finales de agosto de 2026 (El Faro RD lo fecha el 27-ago; 7días lo publicó el 26-ago). La DGII dice haber autorizado **190** proveedores de servicios. [F02, F10; B]
- **Tres vías para ser emisor:** Facturador Gratuito, proveedor de servicios certificado, o software propio certificado por la DGII. [F07; A]
- **Facturador Gratuito (FAQ DGII):** gratis; exige RNC, Alta NCF, clave de Oficina Virtual y certificado digital; **solo pesos dominicanos**; **no** admite impuestos adicionales ni propina legal; **no se puede interconectar** con otro sistema; conserva los e-CF hasta 2 años mientras el Código Tributario (Art. 50) pide conservar 10. [F05, F06; A]
- **Certificación con software propio o de proveedor** (documento DGII): solicitud → portal de certificación → pruebas de datos (set en Excel, XML) → aprobaciones comerciales → simulación → representación impresa en PDF ≤ 10 MB → pruebas de comunicación (URLs de recepción, aprobación y autenticación) → declaración jurada firmada → habilitación. [F07; A]
- **Tipos de e-CF:** 31 crédito fiscal, 32 consumo, 33 nota de débito, 34 nota de crédito, 41 compras, 43 gastos menores, 44 regímenes especiales, 45 gubernamental, **46 exportaciones, 47 pagos al exterior**; e-NCF = `E` + 2 dígitos de tipo + 10 dígitos. (Una fuente secundaria los invierte: usar la de la DGII.) [F08; A]
- **Consumo < RD$250,000:** se reporta con el Resumen (RFCE); el emisor conserva el comprobante completo y entrega la representación impresa. [F09; A]
- **Certificado digital:** de persona física para procedimientos tributarios, emitido por una entidad autorizada por INDOTEL. La DGII cita Viafirma, Novofirma y Digifirma; una fuente secundaria reporta la autorización de Novofirma vencida el 3-abr-2025 [C]. Precio RD$2,360/año en Viafirma [C, proveedor]. [F11]
- **Sanción por incumplir:** multa de 5 a 30 salarios mínimos (Art. 257 Código Tributario, remitido por el Art. 27). Las cifras de otras fuentes (0,25% de ingresos, «5 a 50») no coinciden: **no publicar montos**. [F04; B]
- **Incentivo fiscal (Arts. 39-41):** crédito de RD$25,000 (micro/no clasificados), RD$75,000 (pequeños), RD$200,000 (medianos), RD$300,000 (grandes MIPYMES), para quienes fueron autorizados en el período de voluntariedad; excluye a los beneficiarios del Facturador Gratuito. Si sigue aplicando tras la prórroga no está confirmado: **no prometerlo**. [F12; A texto, aplicabilidad sin confirmar]

*Implicación:* el sitio puede decir con fecha lo que hay que hacer y el papel de Gaya («conectar tu tienda o sistema con tu proveedor de facturación electrónica» [CONFIRMAR capacidad]). No dice «cumplimos DGII», no calcula multas, no habla de créditos.

#### b) Dominios `.do` (NIC.DO)

- Zonas: `.do` (cualquier sector o persona), `.com.do` (entidades comerciales), `.org.do`, `.net.do`, `.web.do`, `.art.do`, `.sld.do`, `.edu.do`; `.gob.do` y `.mil.do` solo gobierno/militares y gratis. [F13; A]
- Política de NIC.DO: primero llegado, primero servido; contactos administrativo, técnico y de pago con datos exactos y actualizados (aparecen en WHOIS); registro de **1 a 10 años**; vencido: **30 días suspendido** + **15 en rescate** (con costo adicional) antes de quedar libre; transferencia con código de autorización y renovación de 1 año. No exige documentos de RNC/cédula en la política leída. [F13; A]
- Precios en `midominio.do` (revendedor oficial de NIC.DO; página sin fecha, en DOP): `.do` **RD$2,000**/año, `.com.do` **RD$800**/año; renovación al mismo precio; restauración RD$3,000 / RD$1,200. [F13; A- por no tener fecha: no publicar precios, solo úsalos al cotizar]

*Implicación:* «Dominio y correo del negocio configurados» es un entregable real; el alta y la renovación las paga y las posee el cliente. La regla de vencimiento es un dato útil y verificable para la ficha web.

#### c) WhatsApp, el canal principal

- **Modelo de precio:** por mensaje desde el **1-jul-2025**; categorías marketing, utilidad y autenticación; **RD está en la región «Rest of Latin America»** (indicativos +1 809/829/849). Ventana de servicio de **24 h** desde el último mensaje del cliente; ventana de punto de entrada gratuito de **72 h** cuando el cliente escribe desde un anuncio Click-to-WhatsApp o un botón de llamada a la acción. [F14, F15; A]
- **Cambio del 1-oct-2026 (mañana respecto a esta investigación):** los mensajes de servicio (respuestas libres dentro de la ventana de 24 h) y las plantillas de utilidad enviadas dentro de esa ventana pasan a cobrarse en la API, al mismo precio por mercado que utilidad/autenticación. [F16; A, doc de Meta]. Los medios (SendPulse, Techweez, MEF) añaden que cada número de negocio tiene **1,000 mensajes de servicio gratis al mes**, que la app Business gratuita no cambia y que los bots también cuentan; **eso no aparece en la página de Meta que leí** [F17; C]. → Se dice en la web solo lo A.
- **Agente propio de Meta:** cobro por tokens desde el 1-ago-2026 (US$2.00 por millón; ~4-5 centavos por mensaje típico). [F35; A]
- **App Business vs API:** la app trae perfil, catálogo, saludo, ausencia, respuestas rápidas, etiquetas y listas [F21; B]; la API (plataforma) es lo que permite bots, CRM, varios agentes. **Coexistencia** (app + API en el mismo número): exige app ≥ 2.24.17, alta vía Solution Partner/Tech Provider, tope de **20 mensajes por segundo**, desactiva mensajes temporales, de una vez, ubicación en vivo y listas de difusión, no sincroniza grupos; tras el alta hay 24 h para sincronizar y solo se importan los últimos 6 meses. [F18; A]
- **Política de mensajería:** opt-in explícito antes de escribir; responder sin plantilla solo dentro de las 24 h; fuera de ella, plantillas aprobadas; **obligatorio ofrecer camino de escalamiento** a una persona (chat, teléfono, correo…); automatización permitida dentro de la ventana con ese escalamiento. [F19; A]
- **IA:** los Términos de Meta para WhatsApp Business Platform (secc. 4.7) restringen a los «proveedores de IA» cuando la IA es la funcionalidad principal; la prensa técnica lo resume como «asistentes de uso general prohibidos, bots de soporte/citas/pedidos permitidos». Fecha: 15-ene-2026 según prensa; la versión de los términos que leí muestra una fecha de vigencia posterior (23-sep-2026): **la fecha exacta es X, la regla es B**. [F20]
- **Enlace de contacto:** `https://wa.me/<número>?text=<mensaje codificado>`; número en formato internacional sin `+`, ceros ni guiones (Gaya: `18499254426`). Ya lo usa el sitio (`brand.contact.whatsapp.e164`). [Help Center `faq.whatsapp.com/5913398998672934`, no pude renderizar la página: verificar al implementar]

#### d) Pagos en línea

- **AZUL** (Servicios Digitales Popular / Banco Popular): **Link de Pagos** (enlaces ilimitados que se comparten por mensajería, redes, correo o SMS; sirve para vender sin web; hace falta cuenta afiliada) [F22; B, artículo de Impulsa Popular sin fecha]. Que además ofrezca botón de pagos con API (3D Secure, tokenización), botón de PayPal y afiliación desde el celular salió de resultados de búsqueda de Banco Popular/AZUL que no abrí: [C] hasta confirmarlo en azul.com.do.
- **CardNET:** «Enlace de Pago» con factura personalizada, infraestructura PCI, multi-afiliado, español/inglés (página de CardNET leída) [F23; A]. Plugins WooCommerce/PrestaShop y la exigencia de «empresa constituida en RD» vienen de terceros: [C, verificar con CardNET antes de decírselo a un cliente].
- **PayPal en RD:** retiro a cuenta bancaria local por socios locales, en USD o moneda local (anuncio del 22-ene-2024); transferencia estándar «hasta 7 días hábiles» en RD (ayuda de PayPal DO). [F24; A]. Un blog de plataforma dice lo contrario («retiros directos a bancos dominicanos no disponibles»): **contradicho por PayPal, no usar**.
- **Stripe:** Rep. Dominicana no aparece en su lista global de países; ofrecen Atlas (sociedad en EE. UU.) como alternativa. [F25; A]

#### e) Google

- **Perfil de Negocio:** solo elegibles los negocios que «hacen contacto en persona con clientes en su horario»; **no** elegibles «marcas, organizaciones, artistas y otros negocios solo en línea», ni direcciones que sean apartados/buzones remotos. Verificación por video. [F26; A]. → Gaya (sin local, sin dirección) **no califica** hoy; para clientes se ofrece «si tu negocio califica».
- **Google Ads (verificación del anunciante en RD):** organización: certificado de registro/constitución, extracto del registro mercantil, licencia o certificado tributario **más** identificación con foto del administrador; persona física: identificación dominicana. [F27; A]
- **Datos estructurados:** `LocalBusiness` **requiere `address`**; `Organization` no tiene propiedades obligatorias. [F39; A]

#### f) Publicidad digital y retención (Ley 30-26)

Promulgada el 18-jun-2026; Hacienda aclaró el 22-jun-2026: la retención de ISR sobre pagos de empresas dominicanas a proveedores no residentes por **licencias de software, regalías, derechos de autor, publicidad digital y almacenamiento en la nube** baja de **27% a 15%**; no grava suscripciones personales. La empresa que paga es el agente de retención. [F28; A, Hacienda]. *Implicación:* quien paga Google/Meta Ads como empresa debe hablarlo con su contador; Gaya no da asesoría fiscal.

#### g) Correo, seguridad y respaldos

- **Correo (Google, guía para remitentes):** todo remitente hacia Gmail debe autenticar con SPF o DKIM; quien envía más de 5,000 correos diarios además necesita DMARC (política puede ser `none`), TLS, tasa de spam < 0,30% y baja con un clic (desde 1-feb-2024). [F29; A]
- **CISA (pymes):** 4 esenciales: capacitar contra phishing, contraseñas de ≥ 16 caracteres con gestor, MFA (preferir resistente a phishing) en correo, archivos y acceso remoto, y actualizaciones. **Respaldos:** regla 3-2-1 (3 copias, 2 tipos de medio, 1 fuera del sitio), automáticos, con copias sin conexión, **probar restauraciones** y poder retroceder **al menos 7 días**. [F30; A]
- **Obligaciones locales de ciberseguridad:** no encontré obligación de reporte de incidentes para empresas privadas; el Decreto 685-22 obliga a instituciones **públicas** a notificar al CSIRT-RD (CNCS) en 24 h. La Policía Nacional tiene DICAT para delitos de alta tecnología (Ley 53-07). [F40; B]

#### h) Datos personales y consumidor

- **Ley 172-13:** el tratamiento y la cesión de datos exigen consentimiento **libre, expreso y consciente** (Art. 8); ocho principios (licitud, calidad, lealtad, finalidad, seguridad, secreto, información, consentimiento); no existe autoridad independiente de protección de datos. [F33; B, resumen RIPD]. *Implicación:* al conectar un agente de IA con datos de clientes de un negocio (y más si el modelo es de un proveedor extranjero), hace falta consentimiento y criterio legal; Gaya no da asesoría legal.
- **Guía INDOTEL + Pro Consumidor (2019, no es disposición oficial):** el comprador revisa nombre, dirección y teléfono del vendedor, precio con cargos de envío e impuestos, garantía, política de cambios y reembolso, política de privacidad y `https`. La guía es Creative Commons (citar, no comercial). [F32; A]
- Marco: Ley 358-05 (Pro Consumidor) y Ley 126-02 (comercio electrónico y firmas digitales) [B].

#### i) Energía: el problema de infraestructura número uno en 2026

- Diario Libre (5-sep-2026): usuarios reportan **2-3 apagones por semana de 8-10 horas**; venta y reparación de inversores/UPS, plantas y estabilizadores «crece»; baterías de inversor ~RD$19,000. Listín Diario (28-may-2026): apagones de **3-5 h habituales y hasta 7 h continuas** en sectores del Gran Santo Domingo; los negocios pierden ventas y clientes; usan plantas a gasolina. [F31; B, prensa]
- *Implicación:* «Wi-Fi ordenado y **plan para los apagones**» es un entregable creíble y local (UPS para módem y router, cargas críticas, copia en la nube, contingencia de e-CF). La DGII prevé registro de contingencia en el menú de facturación electrónica de la Oficina Virtual [A].

#### j) Otros datos verificados

- Rep. Dominicana usa **UTC-4 todo el año, sin horario de verano** (`America/Santo_Domingo`) [F36; B]: útil para clientes internacionales; ya está en `brand.json`.
- DataReportal «Digital 2026» (8-nov-2025): 10.5 M de usuarios de internet (91,0%), 7.89 M de identidades de redes (68,3%) **con la advertencia de que no son personas únicas**; otras cifras por plataforma no son comparables. [F37; A, **no usar en la web**]

### 1.5 Conflictos y datos sin verificar (registro)

| Tema | Conflicto | Decisión |
|---|---|---|
| Quién recibió la prórroga | Diario Libre y Proceso dicen «Mipymes» (incluye medianos); EY, Alegra y 7días: solo pequeños, micro y no clasificados; los medianos vencieron antes. | Usar el alcance estrecho. |
| Calendario oficial | La página del calendario de la DGII que leí aún lista el plazo de 36 meses como 15-may-2026 y no menciona la prórroga; la página de noticias de la DGII no cargó (HTTP 401). | Fuente = Aviso 06-26 vía EY/medios; re-verificar el 1-nov y el 15-nov. |
| Tipos e-CF 46/47 | Una fuente los invierte. | Usar la tabla de la DGII. |
| Multas | 5-30 salarios mínimos (Art. 257) vs. «0,25% de ingresos» vs. «5 a 50». | No publicar montos. |
| PayPal RD | Vendabo: sin retiro directo a bancos locales; PayPal: sí, con socios locales. | Manda PayPal. |
| 1,000 mensajes gratis (WhatsApp) | Lo repiten 3 medios; no está en la página de Meta leída. | Grado C; fuera de la web. |
| Política de IA de WhatsApp | Prensa: vigente 15-ene-2026; términos leídos: fecha posterior. | La regla sí (B); fecha X. |
| Certificado digital | Novofirma «vencida el 3-abr-2025» (secundaria); la FAQ de la DGII aún la cita. | Confirmar en INDOTEL antes de recomendarla. |
| CardNET | «Solo empresas constituidas» (una fuente). | C: preguntar a CardNET. |
| Google Ads y moneda | No pude confirmar si RD factura en USD o DOP. | No afirmar. |
| Cloudflare en Santo Domingo | Un monitor de terceros lista «SDQ»; la página de estado de Cloudflare no lo mostró. | X: no afirmar latencia local. |

---

## 2. Las cuatro fichas de servicio (copy final ES/EN)

### 2.0 Nombres, orden y reglas comunes

| Pos. | id | Nombre ES | Nombre EN | Etiqueta del mensaje |
|---|---|---|---|---|
| 1 | `web` | Desarrollo web y apps | Web and app development | «Desarrollo web y apps» |
| 2 | `automation` | Automatización e IA | Automation and AI | «Automatización e IA» |
| 3 | `marketing` | Marketing digital y redes | Digital marketing and social media | «Marketing digital y redes» |
| 4 | `it` | Soporte e infraestructura IT | IT support and infrastructure | «Soporte e infraestructura IT» |

Los nombres ES coinciden con los del catálogo de WhatsApp Business ya creado el 22-sep (4 servicios «sin precio, a cotizar»).

**Presupuesto de columnas** (fuente monoespaciada, 1 grafema = 1 columna; todo lo de abajo ya está medido): promesa ≤ 56 · cada «Incluye» ≤ 52 · «Para quién» ≤ 140 · «Necesitamos» ≤ 170 · «Resultado» ≤ 190 · dato local ≤ 100. «Incluye»: entre 5 y 7, mismo número en ES y EN.

**Marcado semántico y arte:** el arte ASCII es decorativo (`aria-hidden`); promesa, lista, «Para quién», «Necesitamos», «Resultado» y datos locales viven como `h2`, `p`, `ul`, `dl` (ver 5.6). Los «datos locales» son **contenido con fecha**, no instrucciones: llevan la etiqueta corta «Verificado 30 sep 2026».

### 2.1 Desarrollo web y apps · `web`

| | ES | EN |
|---|---|---|
| **Promesa** | Tu web, rápida y lista para vender por WhatsApp. | Your website: fast, and built to sell on WhatsApp. |
| **Incluye** | 1. Diseño propio, pensado primero para el celular<br>2. Sitio en español, en inglés o en ambos<br>3. Botón de WhatsApp con el mensaje ya escrito<br>4. Dominio y correo del negocio configurados<br>5. SEO técnico y datos estructurados para Google<br>6. Pruebas de velocidad y accesibilidad<br>7. Publicación con HTTPS, respaldo y accesos tuyos | 1. Original design, mobile first<br>2. Site in Spanish, English or both<br>3. WhatsApp button with the message pre-written<br>4. Business domain and email set up<br>5. Technical SEO and structured data for Google<br>6. Speed and accessibility testing<br>7. Launch on HTTPS, backups, and you own the logins |
| **Se suma según el proyecto** | Tienda en línea con pago por tarjeta o enlace · Conexión con tu proveedor de facturación electrónica · App web instalable o app a medida · Panel para editar tu contenido | Online store with card or link payments · Link to your e-invoicing provider · Installable web app or custom app · Panel to edit your content |
| **Para quién** | Negocios con o sin local, marcas personales y profesionales que hoy dependen solo de Instagram o WhatsApp. | Businesses with or without a storefront, personal brands and professionals who today rely only on Instagram or WhatsApp. |
| **Necesitamos** | Logo y colores (o los definimos juntos), textos e imágenes reales, acceso al dominio y una persona que decida por el negocio. | Logo and colors (or we define them together), real copy and images, domain access, and one person who decides for the business. |
| **Resultado** | Una URL en vivo, medida en velocidad y accesibilidad, con un botón que abre WhatsApp con el mensaje escrito. Todos los accesos son tuyos. | A live URL, measured for speed and accessibility, with a button that opens WhatsApp with the message written. Every login is yours. |

**Datos locales** (3, con fuente):

| ID | ES | EN | Fuente · grado |
|---|---|---|---|
| F13 | Si un dominio .do vence, queda suspendido 30 días y 15 más en rescate antes de borrarse. | An expired .do domain is suspended for 30 days, then held 15 more before deletion. | NIC.DO, política de delegación · A |
| F01 | e-CF: el plazo para pequeños, micro y no clasificados vence el 15 nov 2026. | E-invoicing (e-CF): the deadline for small, micro and unclassified taxpayers is 15 Nov 2026. | DGII Aviso 06-26 vía EY/Diario Libre · B |
| F32 | Quien compra en línea busca precio con impuestos, envío, garantía y política de cambios. | Online buyers look for price with taxes, shipping, warranty and a return policy. | Guía INDOTEL/Pro Consumidor · A |

**Capacidad [CONFIRMAR]:** apps nativas (móvil), tienda con pasarela real y conexión con e-CF. Si Giancarlo aún no lo ha hecho de punta a punta, la línea «Se suma…» sale o cambia a «Tienda: consúltanos».
**Fuera de alcance (interno):** emitir comprobantes fiscales; afiliar el comercio a AZUL/CardNET (lo hace el cliente con su RNC); asesoría fiscal o legal; textos legales a medida.
**No prometer:** «posición #1 en Google», «ventas garantizadas», cumplimiento DGII.

### 2.2 Automatización e IA · `automation`

| | ES | EN |
|---|---|---|
| **Promesa** | Que WhatsApp responda, agende y avise por ti. | Let WhatsApp answer, book and notify for you. |
| **Incluye** | 1. Mapa de tareas repetidas: qué sí y qué no<br>2. Respuestas y menú automáticos en WhatsApp<br>3. Bot de citas, pedidos o cotizaciones<br>4. Traspaso a una persona en cualquier momento<br>5. Conexión con Sheets, correo, calendario o CRM<br>6. Agente de IA con reglas y datos de tu negocio<br>7. Registro de conversaciones y ajustes mensuales | 1. Map of repeated tasks: what to automate, what not<br>2. Automatic WhatsApp replies and menu<br>3. Bot for bookings, orders or quotes<br>4. Handoff to a person at any moment<br>5. Links to Sheets, email, calendar or CRM<br>6. AI agent with your business rules and data<br>7. Conversation log and monthly tuning |
| **Para quién** | Negocios que reciben los mismos mensajes todos los días: precios, horarios, citas y pedidos. | Businesses that get the same messages every day: prices, hours, bookings and orders. |
| **Necesitamos** | Las 10 preguntas que más te hacen, horarios y precios, acceso a tu WhatsApp Business y a tus herramientas, y quién atiende cuando el bot pasa la conversación. | The 10 questions you get most, hours and prices, access to your WhatsApp Business and tools, and who answers when the bot hands over. |
| **Resultado** | Un flujo probado con tus casos reales: el cliente escribe, recibe respuesta o agenda, y tú ves cada conversación. Si el bot no sabe, te la pasa. | A flow tested with your real cases: the customer writes, gets an answer or books, and you see every conversation. If the bot does not know, it hands over. |

**Datos locales:**

| ID | ES | EN | Fuente · grado |
|---|---|---|---|
| F16 | Desde el 1 oct 2026 Meta cobra por mensaje de servicio en la API de WhatsApp. | From 1 Oct 2026 Meta charges per service message on the WhatsApp API. | Meta for Developers, «non-template messages» · A |
| F20 | Meta no permite asistentes de IA de uso general en su API; sí bots de soporte, citas y pedidos. | Meta bans general-purpose AI assistants on its API; support, booking and order bots are allowed. | Meta, Términos para WhatsApp Business Platform §4.7 + prensa · B |
| F18 | La app Business y la API pueden compartir número (coexistencia), dentro de los límites de Meta. | The Business app and the API can share one number (coexistence), within Meta's limits. | Meta for Developers, onboarding de usuarios de la app · A |

**Diseño honesto del servicio (lo que respalda el copy):**
- *App Business primero:* para bajo volumen, saludo, ausencia, respuestas rápidas y etiquetas (gratis) bastan; la API se justifica con bots, CRM y varios agentes. Decirlo al cliente ahorra dinero y construye confianza (Phoenix: «recomendaremos la opción más barata»).
- *Reglas de la plataforma como diseño:* opt-in explícito, ventana de 24 h, plantillas aprobadas fuera de ella, camino de escalamiento a persona (política de mensajería) [A].
- *Costo de mensajes:* con el cambio del 1-oct los flujos deben diseñarse pensando en cuántos mensajes de servicio generan. Un bot que responde con 6 mensajes donde 2 bastan cuesta 3 veces más [inferencia sobre A].
- *Licencia de n8n:* la licencia (Sustainable Use License) permite uso **interno del negocio**; construir flujos para clientes es habitual, pero **alojar de forma permanente los flujos o credenciales de tus clientes en tu propia instancia** requiere licencia comercial. Diseño: n8n en la cuenta/servidor del cliente, o código propio desplegado en su infraestructura. [F34; A el texto de la licencia, C el matiz de consultoría: sale de guías de terceros y de un foro, no de n8n; escribir a n8n antes de escalar]

**Capacidad [CONFIRMAR]:** API de WhatsApp (Cloud API) en producción, agente de IA con reglas y datos del cliente, integraciones. Si aún no hay un flujo real terminado, la primera versión se vende como «piloto con un caso» y no como catálogo.
**Fuera de alcance (interno):** asistentes de IA de uso general en WhatsApp (los bloquea Meta), envíos masivos sin opt-in, decisiones legales sobre datos (Ley 172-13).
**No prometer:** «% de consultas resueltas», «ahorra X horas», «ROI».

### 2.3 Marketing digital y redes · `marketing`

| | ES | EN |
|---|---|---|
| **Promesa** | Que te encuentren, te escriban y te compren. | Get found, get messaged, get paid. |
| **Incluye** | 1. Diagnóstico de tus perfiles y tu competencia<br>2. Perfiles listos: bio, enlaces y WhatsApp<br>3. Perfil de Google, si tu negocio califica<br>4. Calendario mensual de contenido<br>5. Diseño de piezas y edición de Reels<br>6. Anuncios en Meta y Google hacia WhatsApp<br>7. Reporte mensual: qué pasó y qué sigue | 1. Audit of your profiles and competitors<br>2. Profiles ready: bio, links and WhatsApp<br>3. Google profile, if your business qualifies<br>4. Monthly content calendar<br>5. Post design and Reels editing<br>6. Meta and Google ads that lead to WhatsApp<br>7. Monthly report: what happened, what is next |
| **Se suma según el proyecto** | Respuesta a comentarios y mensajes · Producción de foto y video | Community replies and messages · Photo and video production |
| **Para quién** | Negocios que ya venden pero casi no se ven, o que publican sin un plan. | Businesses that already sell but are barely seen, or that post without a plan. |
| **Necesitamos** | Acceso de administrador a tus perfiles, fotos y videos reales, presupuesto de anuncios y una persona que apruebe el contenido. | Admin access to your profiles, real photos and videos, an ad budget, and one person who approves content. |
| **Resultado** | Un calendario aprobado antes de publicar, perfiles ordenados, anuncios activos hacia WhatsApp y un reporte mensual con lo que Meta y Google miden. | A calendar approved before anything goes live, tidy profiles, ads running toward WhatsApp, and a monthly report with what Meta and Google measure. |

**Datos locales:**

| ID | ES | EN | Fuente · grado |
|---|---|---|---|
| F15 | Si el cliente escribe desde un anuncio o botón a WhatsApp, Meta da 72 h de mensajes sin cargo. | When a customer messages from an ad or button, Meta gives 72 hours of charge-free messages. | Meta for Developers, precios de WhatsApp · A |
| F28 | Ley 30-26: las empresas retienen 15% (antes 27%) al pagar publicidad digital al exterior. | Law 30-26: companies withhold 15% (was 27%) when paying for digital ads abroad. | Ministerio de Hacienda y Economía, 22-jun-2026 · A |
| F27 | Google Ads pide a las empresas su registro y una identificación con foto del administrador. | Google Ads asks companies for registration documents and a photo ID of the account admin. | Ayuda de políticas de Google Ads (RD) · A |

**Notas de diseño:**
- «Perfil de Google, si tu negocio califica»: Google exige contacto en persona en horario declarado; los negocios solo en línea no son elegibles [F26]. Nunca sugerir una dirección falsa (riesgo de suspensión).
- Reporte: solo métricas que la plataforma entrega (alcance, mensajes iniciados, costo por mensaje). Sin promesas de «ventas».
- Presupuesto de anuncios lo paga el cliente desde su cuenta (Gaya no intermedia pagos ni retenciones).

**Capacidad [CONFIRMAR]:** edición de Reels/video, campañas en Google Ads, community management. Lo no probado pasa a «Se suma» o sale.
**Fuera de alcance (interno):** asesoría fiscal sobre retenciones; compra de seguidores, reseñas o «engagement» (violan políticas de plataforma).
**No prometer:** «duplica tus ventas», «ROI», «posicionamiento garantizado», «tráfico que convierte».

### 2.4 Soporte e infraestructura IT · `it`

| | ES | EN |
|---|---|---|
| **Promesa** | Correo, redes y equipos que no te frenan. | Email, network and devices that keep you moving. |
| **Incluye** | 1. Revisión inicial de equipos, red y cuentas<br>2. Correo con tu dominio: SPF, DKIM y DMARC<br>3. Verificación en dos pasos en tus cuentas<br>4. Respaldos automáticos con copia fuera del sitio<br>5. Wi-Fi ordenado y plan para los apagones<br>6. Soporte remoto por WhatsApp en horario hábil<br>7. Inventario de equipos y accesos documentado | 1. Initial review of devices, network and accounts<br>2. Email on your domain: SPF, DKIM and DMARC<br>3. Two-step verification on your accounts<br>4. Automatic backups with an off-site copy<br>5. Tidy Wi-Fi and a plan for power outages<br>6. Remote support over WhatsApp in business hours<br>7. Documented inventory of devices and logins |
| **Para quién** | Negocios pequeños sin departamento de sistemas y profesionales con equipo propio. | Small businesses with no IT department, and professionals with their own equipment. |
| **Necesitamos** | Lista de equipos y cuentas, acceso de administrador y una persona autorizada para aprobar cambios. | A list of devices and accounts, admin access, and one person authorized to approve changes. |
| **Resultado** | Una hoja: qué tienes, qué está protegido, qué falta y en qué orden se arregla. Y un canal por WhatsApp para reportar fallas. | One page: what you have, what is protected, what is missing and the order to fix it. Plus a WhatsApp channel to report problems. |

**Datos locales:**

| ID | ES | EN | Fuente · grado |
|---|---|---|---|
| F31 | En 2026 la prensa reporta apagones de 3 a 10 horas que frenan a negocios de Santo Domingo. | In 2026 the press reports 3-to-10-hour outages slowing down businesses in Santo Domingo. | Diario Libre 5-sep-2026; Listín Diario 28-may-2026 · B |
| F06 | El Facturador Gratuito de la DGII guarda tus e-CF 2 años; la ley pide conservarlos 10. | DGII's free invoicer keeps your e-CF for 2 years; the law asks you to keep records for 10. | DGII, FAQ del Facturador Gratuito (preg. 20-21) · A |
| F29 | Gmail exige SPF o DKIM a todo remitente; con más de 5,000 correos al día, también DMARC. | Gmail requires SPF or DKIM from every sender; above 5,000 emails a day, DMARC too. | Google, guía para remitentes · A |

**Notas de diseño:**
- Los entregables 2-4 se sostienen en fuentes A (Google para correo; CISA para MFA y regla 3-2-1, incluida la prueba de restauración y retroceder ≥ 7 días).
- «Plan para los apagones» = recomendar UPS/inversor para módem, router y equipo crítico, ordenar qué se apaga primero, copia en la nube y contingencia; **no** vender hardware ni instalación eléctrica salvo cotización aparte [CONFIRMAR].
- El SLA no se publica hasta que Giancarlo lo defina (D12).

**Capacidad [CONFIRMAR]:** soporte remoto con tiempo de respuesta definido; administración de Microsoft 365 o Google Workspace; respaldos gestionados.
**Fuera de alcance (interno):** reparación de hardware, cableado, instalación eléctrica, ciberseguridad ofensiva/forense; asesoría legal sobre incidentes.
**No prometer:** «cero caídas», «100% seguro», «24/7».

### 2.5 Proceso y modelo comercial (contenido de la sección «Proceso»)

Cuatro etiquetas (≤ 40 columnas), sin frases instructivas:

| # | ES | EN |
|---|---|---|
| 1 | Hablamos por WhatsApp | We talk on WhatsApp |
| 2 | Propuesta por escrito | Written proposal |
| 3 | Construimos con avances | We build, with progress updates |
| 4 | Entregamos y acompañamos | We deliver and stay by your side |

Solo un plazo se publica: propuesta en **24-48 h** (`brand.json`, [CONFIRMAR]). Los demás (Phoenix: web 4-12 semanas; PANCA: diseño 1-3 semanas) son de otros estudios: **Gaya los publica cuando los haya medido**.

**Modelo comercial recomendado [CONFIRMAR]:** *precio cerrado por proyecto con alcance por escrito* para Web/Apps y Automatización (paralelo a Phoenix: builds y auditorías a precio fijo); *plan mensual sin permanencia* para Marketing y Soporte IT (paralelo a Support IT: mes a mes). Referencias de mercado para calibrar tarifas (no publicar, grado C): Support IT RD$15,000-170,200/mes; Gmedia «RD$10,000-50,000/mes» de marketing; Intelia RD$26,995 de alta de API de WhatsApp.

### 2.6 Cómo se usan los campos `outOfScope`, `confirm` y `notes`

`outOfScope` no se muestra por defecto (regla del dueño: cero texto que explique). Sirve para (a) no prometer de más en la conversación de WhatsApp, (b) poblar un FAQ **solo si** el dueño quiere el efecto «filtro honesto» de undertk/Phoenix, y (c) ser la fuente para las respuestas rápidas del catálogo. `confirm` bloquea la publicación (ver lint, 5.3).

---

## 3. «Quiénes somos» (bloque honesto)

**Qué se puede afirmar (todo verificable con `brand.json` y la ficha del dueño):** marca personal de Giancarlo González (Director); Santo Domingo, República Dominicana; trabajo remoto; español e inglés; WhatsApp como primer canal; propuesta por escrito en 24-48 h [CONFIRMAR]; los accesos y archivos son del cliente [CONFIRMAR].

| | ES (≤ 56 columnas por línea) | EN |
|---|---|---|
| Título | Quiénes somos | Who we are |
| 1 | Gaya Digital es la marca de Giancarlo González. | Gaya Digital is the brand of Giancarlo González. |
| 2 | Santo Domingo, República Dominicana. Trabajo remoto. | Santo Domingo, Dominican Republic. Remote work. |
| 3 | Español e inglés. | Spanish and English. |
| 4 | WhatsApp primero: ahí empieza todo. | WhatsApp first: that is where every project starts. |
| 5 | Hablas directo con el director, sin intermediarios. | You talk straight to the director, no middlemen. |
| 6 | Propuesta por escrito en 24–48 horas. | A written proposal within 24–48 hours. |
| 7 | Tus accesos y tus archivos son tuyos desde el día uno. | Your logins and your files are yours from day one. |

**Marcado:** `h2` + `ul` de 7 elementos (o `dl` con Santo Domingo/idiomas/canal); el arte ASCII es decorativo. El nombre de Giancarlo debe estar visible en la página para que el JSON-LD `founder` sea legítimo (Google: no marcar lo que el lector no ve).

**Prohibido en este bloque:** años de experiencia, número de clientes o proyectos, «somos líderes», «equipo de expertos/especialistas» (plural que Gaya no puede sostener), fotos de stock (NN/g las penaliza), testimonios, logos, premios, «agencia con presencia en…», ninguna mención de que el sitio lo hizo una IA.
**Sello de la galería:** las 14 referencias son «ejemplos con datos ficticios» (ya existe como sello). Ese sello **es** la honestidad visible: no se retira al añadir servicios.
**Compromisos por confirmar:** tiempo de respuesta por WhatsApp (recomendado: «en un día hábil»; el catálogo y el mensaje de ausencia ya dicen «solo con cita»), horario, y la línea de «accesos tuyos».

---

## 4. Orden de servicios y conversión

**Orden recomendado en la página:** 1 `web` → 2 `automation` → 3 `marketing` → 4 `it`. La lista de la bio y el lead del hero («Web, apps, marketing, soporte IT e IA») **no cambia**: es una frase de marca, no un ranking.

| Pos. | Por qué |
|---|---|
| 1 Web y apps | Primacía (NN/g). Es lo que la galería de 14 referencias demuestra en vivo; el sitio mismo, medido, es la prueba. La fecha del 15-nov de e-CF da un motivo real para una tienda bien hecha. |
| 2 Automatización e IA | Es el hilo natural: «una web que vende por WhatsApp» → «WhatsApp que atiende». Diferenciador (pocas agencias lo explican con reglas verificables) y responde al cambio de precios de Meta del 1-oct. |
| 3 Marketing y redes | Servicio conocido y de compra más fácil, pero el más saturado (todas las agencias leídas lo ofrecen con las mismas frases). Va tercero para que el visitante ya haya visto lo diferencial. |
| 4 Soporte e infraestructura IT | Recurrente y de retención; cierra la lista (efecto de recencia) y enlaza con el contacto. Nombra el resultado, no el miedo. |

**Es una hipótesis, no un dato:** Gaya no tiene analítica (regla del proyecto: cero terceros). Se mide **sin analítica**:
1. Cada botón de servicio abre WhatsApp con «Hola Gaya Digital, me interesa «{servicio}». Quiero una propuesta.» (código en 5.4). El servicio llega escrito en el primer mensaje.
2. El dueño etiqueta cada chat nuevo con una **etiqueta** de la app Business (las etiquetas existen en la app [B]): `web`, `automatización`, `marketing`, `it`, `referencia`.
3. Regla de revisión sugerida: al llegar a 20 conversaciones etiquetadas o a los 60 días, lo que ocurra primero, comparar cuál servicio abre más chats y cuál cierra más; si `marketing` supera a `automation`, se intercambian las posiciones 2 y 3.
4. La ruta «referencia» (galería → «Quiero una así») ya construye su propio mensaje con la referencia; sigue igual.

**Ruta de conversión por bloque:** cada ficha termina en un solo botón «Escribir por WhatsApp» (etiqueta ya existente en `copy.ts`), con correo como segundo enlace. Cero explicación bajo el botón.

---

## 5. Técnicas (código y pseudocódigo original, probado)

Todo lo de esta sección se ejecutó en Node 24.19 con `node archivo.ts` (type stripping: solo sintaxis borrable, sin `enum`). El proyecto ya declara `"type": "module"` y `engines >= 22.12`; para `.ts` directo se recomienda Node ≥ 22.18.

### 5.1 Modelo de datos bilingüe (`src/data/services.ts`)

```ts
export type Lang = 'es' | 'en';
type L<T> = Record<Lang, T>;

export interface Service {
  id: 'web' | 'automation' | 'marketing' | 'it';
  order: 1 | 2 | 3 | 4;
  name: L<string>;                 // igual al catálogo de WhatsApp
  promise: L<string>;              // ≤ 56 col
  includes: L<string[]>;           // 5-7 elementos, ≤ 52 col c/u, mismo n en ES y EN
  addons?: L<string[]>;            // «se suma según el proyecto»
  audience: L<string>;             // ≤ 140
  needs: L<string>;                // ≤ 170
  result: L<string>;               // ≤ 190
  facts: string[];                 // 2-3 ids de facts.ts
  outOfScope: L<string[]>;         // interno; no se pinta por defecto
  confirm: string[];               // capacidades/compromisos sin aprobar → la lint FALLA si no está vacío en producción
  waTag: string;                   // etiqueta de chat
}
```

*Ejemplo (Automatización e IA):*

```ts
export const automation = {
  id: 'automation', order: 2,
  name: { es: 'Automatización e IA', en: 'Automation and AI' },
  promise: { es: 'Que WhatsApp responda, agende y avise por ti.', en: 'Let WhatsApp answer, book and notify for you.' },
  includes: {
    es: ['Mapa de tareas repetidas: qué sí y qué no', 'Respuestas y menú automáticos en WhatsApp', 'Bot de citas, pedidos o cotizaciones',
         'Traspaso a una persona en cualquier momento', 'Conexión con Sheets, correo, calendario o CRM',
         'Agente de IA con reglas y datos de tu negocio', 'Registro de conversaciones y ajustes mensuales'],
    en: ['Map of repeated tasks: what to automate, what not', 'Automatic WhatsApp replies and menu', 'Bot for bookings, orders or quotes',
         'Handoff to a person at any moment', 'Links to Sheets, email, calendar or CRM',
         'AI agent with your business rules and data', 'Conversation log and monthly tuning'],
  },
  audience: { /* ver 2.2 */ }, needs: { /* … */ }, result: { /* … */ },
  facts: ['F16', 'F20', 'F18'],
  outOfScope: { es: ['Asistentes de IA de uso general', 'Envíos masivos sin consentimiento'], en: ['General-purpose AI assistants', 'Bulk sends without opt-in'] },
  confirm: ['API de WhatsApp en producción', 'Agente de IA con datos del cliente'],
  waTag: 'automation',
} as const;
```

### 5.2 Registro de hechos con caducidad (`src/data/facts.ts`)

```ts
export type Grade = 'A' | 'B' | 'C' | 'X';
export interface Fact {
  es: string; en: string;          // ≤ 100 col
  src: string;                     // URL exacta
  verified: string;                // ISO, p. ej. '2026-09-30'
  recheck: string;                 // ISO: cuándo caduca
  grade: Grade;                    // C y X no se publican
}
export const facts = {
  F01: { es: 'e-CF: el plazo para pequeños, micro y no clasificados vence el 15 nov 2026.',
         en: 'E-invoicing (e-CF): the deadline for small, micro and unclassified taxpayers is 15 Nov 2026.',
         src: 'https://www.ey.com/es_ce/technical/tax/tax-alerts/republica-dominicana-dgii-otorga-prorroga-de-seis-meses-a-contribuyentes-identificados-como-pequenos-micros-y-no-clasificados-para-la-implementacion-de-fe',
         verified: '2026-09-30', recheck: '2026-11-15', grade: 'B' },
  // … F06, F13, F15, F16, F18, F20, F27, F28, F29, F31, F32 (textos en 2.1-2.4)
} as const satisfies Record<string, Fact>;
```

Reglas de render: se muestra el texto + la etiqueta corta «Verificado 30 sep 2026» (estado, no instrucción). Si `hoy > recheck` el dato se marca en la lint como aviso; si pasan **30 días**, la build falla (ver 5.3). Fechas de re-verificación conocidas: **1-oct-2026** (WhatsApp), **1-nov-2026** y **15-nov-2026** (e-CF), y al menos cada 90 días el resto.

### 5.3 Lint de copy (`scripts/lint-services.ts`, probada con caso verde y rojo)

```ts
// node scripts/lint-services.ts   → falla el build si el copy rompe presupuesto, paridad ES/EN, honestidad o frescura
import { services } from '../src/data/services.ts';
import { facts } from '../src/data/facts.ts';

const LANGS = ['es', 'en'] as const;
const BUDGET = { promise: 56, includes: 52, audience: 140, needs: 170, result: 190 } as const;
const norm = (s: string) => s.normalize('NFC');
const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
const len = (s: string) => [...seg.segment(norm(s))].length;

// Honestidad: nada de cifras, años, clientes, superlativos ni autoría de IA. Ampliar, nunca reducir.
const BANNED: [RegExp, string][] = [
  [/\d+\s?(\+|años|anos|years|clientes|clients|proyectos|projects)/i, 'cifra o trayectoria de Gaya'],
  [/(^|\s)#\s?1(\s|$)|n[uú]mero uno|l[ií]der(es)?\b|\bthe best\b|el mejor|la mejor/i, 'superlativo'],
  [/\bexpert(o|a|os|as)\b|especialistas?|\bexperts?\b/i, 'plural de "equipo de expertos" que Gaya no puede sostener'],
  [/garantiz|guarante|duplic|triplic|\broi\b|\b100\s?%/i, 'promesa de resultado'],
  [/(hecho|creado|dise[ñn]ado|built|made|created)\s+(con|por|by|with)\s+(ia|ai|claude|chatgpt|gpt)\b/i, 'autoría de IA'],
  [/haz clic|click here|c[oó]mo (usar|funciona)|how (it works|to use)|paso a paso/i, 'texto instructivo (regla del dueño)'],
];

const today = new Date();
const errors: string[] = [], warns: string[] = [];
const err = (m: string) => errors.push(m);

for (const s of services) {
  for (const l of LANGS) {
    const check = (field: keyof typeof BUDGET, text: string, key = `${s.id}.${field}.${l}`) => {
      if (!text?.trim()) return err(`${key}: vacío`);
      if (len(text) > BUDGET[field]) err(`${key}: ${len(text)} > ${BUDGET[field]} columnas`);
      for (const [re, why] of BANNED) if (re.test(text)) err(`${key}: ${why} → «${text}»`);
    };
    check('promise', s.promise[l]); check('audience', s.audience[l]);
    check('needs', s.needs[l]);     check('result', s.result[l]);
    const inc = s.includes[l];
    if (inc.length < 5 || inc.length > 7) err(`${s.id}.includes.${l}: ${inc.length} elementos (5-7)`);
    inc.forEach((t, i) => check('includes', t, `${s.id}.includes.${l}[${i}]`));
  }
  if (s.includes.es.length !== s.includes.en.length) err(`${s.id}.includes: ES/EN con distinto número`);
  if (s.facts.length < 2 || s.facts.length > 3) err(`${s.id}.facts: ${s.facts.length} (2-3)`);
  if (process.env.NODE_ENV === 'production' && s.confirm?.length) err(`${s.id}: [CONFIRMAR] pendiente → ${s.confirm.join('; ')}`);
  for (const id of s.facts) {
    const f = (facts as Record<string, { recheck: string; grade: string }>)[id];
    if (!f) { err(`${s.id}.facts: ${id} no existe en facts.ts`); continue; }
    if (f.grade === 'C' || f.grade === 'X') err(`${s.id}.facts: ${id} es ${f.grade}: no se publica`);
    const late = (today.getTime() - new Date(f.recheck).getTime()) / 864e5;
    if (late > 30) err(`${id}: re-verificación vencida hace ${Math.floor(late)} d (${f.recheck})`);
    else if (late > 0) warns.push(`${id}: toca re-verificar (${f.recheck})`);
  }
}
warns.forEach((w) => console.warn('aviso  ', w));
if (errors.length) { errors.forEach((e) => console.error('ERROR  ', e)); process.exitCode = 1; }
else console.log(`services OK · ${services.length} fichas · ${LANGS.length} idiomas`);
```

Resultado medido: con el copy de este informe imprime `services OK · 4 fichas · 2 idiomas`; con «Somos líderes: +10 años y 40 clientes, garantizamos ROI, hecho con IA…» falla por longitud, cifra, superlativo, promesa y autoría de IA (`exit=1`). Se integra como `"lint:services": "node scripts/lint-services.ts"` y en la cadena previa a `astro build`.

### 5.4 Enlace de WhatsApp con el servicio ya escrito (`src/lib/wa.ts`)

```ts
import brand from '../../brand.json' with { type: 'json' };
export type Lang = 'es' | 'en';

const MSG: Record<Lang, string> = {
  es: 'Hola Gaya Digital, me interesa «{service}». Quiero una propuesta.',
  en: "Hi Gaya Digital, I'm interested in «{service}». I'd like a proposal.",
};

/** El nombre del servicio ES la etiqueta de medición: llega en el primer mensaje y el dueño lo etiqueta en WhatsApp Business. */
export const waService = (lang: Lang, serviceName: string, ref?: { name: string; url: string }) => {
  let text = MSG[lang].replace('{service}', serviceName);
  if (ref) text += lang === 'es' ? ` Referencia: «${ref.name}» ${ref.url}` : ` Reference: «${ref.name}» ${ref.url}`;
  return `https://wa.me/${brand.contact.whatsapp.e164}?text=${encodeURIComponent(text)}`;
};
// waService('es','Automatización e IA')
// → https://wa.me/18499254426?text=Hola%20Gaya%20Digital%2C%20me%20interesa%20%C2%ABAutomatizaci%C3%B3n%20e%20IA%C2%BB.%20Quiero%20una%20propuesta.
```

Integración: añadir a `brand.json › whatsappMessage` la clave `service` con esas dos cadenas (mismo estilo de comillas « » que ya usa `reference`), y que `waService` lea de ahí en lugar de la constante. Sin datos personales en la URL.

### 5.5 JSON-LD sin `LocalBusiness` (`src/lib/jsonld.ts`)

```ts
import brand from '../../brand.json' with { type: 'json' };
import { services } from '../data/services.ts';
type Lang = 'es' | 'en';

/** Organization + Service. NO LocalBusiness: Google exige `address` y Gaya no publica dirección. */
export const jsonLd = (lang: Lang, names: Record<string, string>) => {
  const org = `${brand.site}/#org`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': org, name: brand.name,
        alternateName: 'Gaya Group',                       // reconcilia el nombre viejo de las redes con el nuevo
        url: brand.site, email: brand.contact.email, telephone: brand.contact.phone,
        sameAs: Object.values(brand.social), knowsLanguage: ['es', 'en'],
        areaServed: [{ '@type': 'Country', name: 'Dominican Republic' }, 'Worldwide'],
        founder: { '@type': 'Person', name: brand.founder.name, jobTitle: brand.founder.role[lang] } },
      ...services.map((s) => ({ '@type': 'Service', '@id': `${brand.site}/#svc-${s.id}`, name: names[s.id],
        description: s.promise[lang], provider: { '@id': org }, areaServed: 'DO', availableLanguage: ['es', 'en'] })),
    ],
  };
};
```

Reglas (Google Search Central): marcar solo lo visible; sin reseñas ni ratings inventados; `Organization` sin propiedades obligatorias; `LocalBusiness` requiere `name` y `address`. `sameAs` solo con perfiles existentes. `Service` no genera resultado enriquecido; es para máquinas.

### 5.6 HTML semántico de una ficha (arte decorativo)

```html
<section id="svc-automation" aria-labelledby="svc-automation-h">
  <pre class="ascii" aria-hidden="true">…boceto ASCII…</pre>
  <h2 id="svc-automation-h">Automatización e IA</h2>
  <p class="promise">Que WhatsApp responda, agende y avise por ti.</p>
  <ul class="includes"> <li>Mapa de tareas repetidas: qué sí y qué no</li> … </ul>
  <dl>
    <dt>Para quién</dt>     <dd>Negocios que reciben los mismos mensajes todos los días…</dd>
    <dt>Necesitamos</dt>    <dd>Las 10 preguntas que más te hacen…</dd>
    <dt>Resultado</dt>      <dd>Un flujo probado con tus casos reales…</dd>
  </dl>
  <ul class="facts">
    <li>Desde el 1 oct 2026 Meta cobra por mensaje de servicio en la API de WhatsApp. <small>Verificado 30 sep 2026</small></li> …
  </ul>
  <a class="btn" href="https://wa.me/18499254426?text=…">Escribir por WhatsApp</a>
</section>
```

`Para quién`, `Necesitamos` y `Resultado` son **etiquetas de campo** (permitidas: «concisas»), no instrucciones. Cada `dt` ≤ 14 columnas.

### 5.7 Medir texto contra columnas de un marco ASCII (`src/lib/ascii-copy.ts`)

```ts
const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
export const cols = (s: string) => [...seg.segment(s.normalize('NFC'))].length; // monoespaciada: 1 grafema = 1 columna

export function wrap(text: string, width: number): { lines: string[]; overflow: string[] } {
  const lines: string[] = [], overflow: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cols(w) > width) overflow.push(w);        // palabra que no cabe: ensanchar el marco, nunca cortar la palabra
    const next = cur ? `${cur} ${w}` : w;
    if (cols(next) <= width) cur = next; else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return { lines, overflow };
}

export const box = (title: string, body: string[], width: number) => {
  const pad = (s: string) => s + ' '.repeat(Math.max(0, width - cols(s)));
  const bar = '+' + '-'.repeat(width + 2) + '+';
  return [bar, `| ${pad(title.toUpperCase())} |`, bar, ...body.map((l) => `| ${pad(l)} |`), bar].join('\n');
};
```

Salida real de `box('Necesitamos', wrap(needs.es, 44).lines, 44)`:

```
+----------------------------------------------+
| NECESITAMOS                                  |
+----------------------------------------------+
| Logo y colores (o los definimos juntos),     |
| textos e imágenes reales, acceso al dominio  |
| y una persona que decida por el negocio.     |
+----------------------------------------------+
```

Reglas para el arte: (1) normalizar a NFC antes de medir (`ñ`, `á` precompuestas); (2) el marco decorativo puede usar solo ASCII y el texto real vivir en el DOM: no depender de que la fuente mono tenga tildes dentro de las cajas de arte; (3) medir a 320 px: el ancho útil de un móvil pequeño en una mono de 12-13 px son unas 38-42 columnas, por eso las cajas de arte de servicios se dibujan a **38-52** y el texto largo va fuera de ellas; (4) `overflow` distinto de vacío = el diseño ensancha, no el copy se recorta.

### 5.8 Bocetos ASCII originales de «cómo se ve el resultado»

Son composiciones de referencia (la barra llena, los «OK» y el chat ilustran la entrega; **no son datos ni resultados de clientes**; en el sitio se rotulan como ejemplo).

Web y apps: una URL en vivo con el botón de WhatsApp y las dos pruebas medidas.

```
+--------------------------------------+
| o o o  tunegocio.com.do              |
+--------------------------------------+
|                                      |
|   TU NEGOCIO                         |
|   ~~~~~~~~~~                         |
|                                      |
|   [ Escribir por WhatsApp ]          |
|                                      |
+--------------------------------------+
   velocidad   [##########]
   accesible   [##########]
```

Automatización e IA: la conversación completa y la salida a una persona.

```
+----------------------------------------------+
|                                              |
| cliente > Hola, hay cita manana?             |
| bot     > Si. A las 10:00 o a las 15:00?     |
| cliente > 10:00                              |
| bot     > Listo. Cita agendada.              |
|           |                                  |
|           +-- dudas? --> [ una persona ]     |
|                                              |
+----------------------------------------------+
```

Marketing y redes: el calendario aprobado antes de publicar.

```
+----------------------------------------------------+
|                                                    |
|     L       M       X       J       V       S      |
|  [post ] [reel ] [     ] [story] [post ] [     ]   |
|                                                    |
|  aprobado  ==>  publicado  ==>  medido             |
|                                                    |
+----------------------------------------------------+
```

Soporte e infraestructura IT: la «hoja» de una página con estados.

```
+----------------------------------------+
|                                        |
|  correo ................ OK            |
|  respaldo .............. OK   ayer     |
|  2 pasos ............... OK            |
|  wifi .................. REVISAR       |
|  plan de apagones ...... PENDIENTE     |
|                                        |
+----------------------------------------+
```

Ideas de movimiento para el equipo de arte (contenido, no obligatorio): el chat se «escribe» línea a línea solo cuando la caja entra en pantalla y queda estático con `prefers-reduced-motion`; el calendario rellena una celda por vez; las barras de la web «se cargan» una vez; en IT, `REVISAR` y `PENDIENTE` pasan a `OK` al terminar (una vez). Cero bucles infinitos.

### 5.9 Reglas de voz del copy

1. Sujeto: «Gaya Digital» o segunda persona («tú»); «nosotros» solo con verbos de proceso («construimos», «entregamos»), nunca con adjetivos de estatus.
2. Frases ≤ 56 columnas en promesa, ≤ 52 en listas. Un verbo en cada línea de «Incluye» cuando se pueda.
3. Cero cifras propias, cero superlativos, cero «expertos». Los números solo aparecen dentro de **datos locales** con fuente y fecha.
4. Español dominicano neutro («tú»); inglés simple. «Wao» es de la casa pero no va en fichas ni en datos.
5. Términos técnicos solo si son el nombre de lo entregado (SPF, DKIM, DMARC, HTTPS, e-CF) y siempre junto al resultado.
6. Lo que no es contenido no se escribe: nada de «haz clic», «desliza», «cómo funciona», «consejos».

---

## 6. Trampas

1. **Cifras de Gaya:** años, clientes, proyectos, «100% satisfacción», ROI. Las agencias leídas las usan y una (TAKUM) muestra contadores en `0+`. Gaya no tiene nada publicable: la lint las bloquea.
2. **Prometer cumplimiento DGII o emitir comprobantes.** Gaya no es proveedor certificado ni emisor (sin RNC). Solo «conectar con tu proveedor» [CONFIRMAR].
3. **La página oficial del calendario de la DGII está desactualizada** (sigue con 15-may-2026 para pequeños, micro y no clasificados). La fuente correcta es el Aviso 06-26; re-verificar el 1-nov y el 15-nov.
4. **Datos con fecha sin fecha:** «Meta cobra…» sin decir desde cuándo envejece mal. Cada dato lleva su fecha de verificación y su `recheck`.
5. **Confundir «implementación» con «emisión exclusiva»:** para grandes locales y medianos el hito es el 1-nov (solo tipo E; B inválido tras 31-oct salvo contingencia); para pequeños, micro y no clasificados el hito es el 15-nov (implementación). No mezclar.
6. **Tipos 46 y 47 invertidos** en fuentes secundarias (46 = exportaciones, 47 = pagos al exterior).
7. **Contradicciones que hay que resolver a favor de la fuente primaria:** PayPal sí permite retiro a bancos locales; multas (5-30 salarios mínimos, no «0,25%»); Novofirma en duda; «1,000 mensajes gratis» de WhatsApp solo en terceros.
8. **Perfil de Google para negocios solo en línea:** no elegibles; una dirección inventada arriesga la suspensión. Gaya tampoco califica.
9. **TikTok Business exige dirección y verificación** (dato de la ficha del dueño): no prometer «cuenta de empresa» sin esa decisión.
10. **Ads como «resultado»:** ninguna cifra de ventas; el reporte es lo que miden Meta y Google.
11. **Bots de IA de uso general** en WhatsApp: prohibidos por Meta; el servicio se define como bot con función de negocio, con reglas y traspaso humano.
12. **Costo por mensaje tras el 1-oct:** un flujo verboso se encarece; diseñar con pocos mensajes. Y no decir «1,000 gratis» (grado C).
13. **Licencia de n8n:** alojar los flujos/credenciales de varios clientes en una sola instancia propia exige licencia comercial. Instancia del cliente o código propio.
14. **Datos personales y modelos extranjeros:** Ley 172-13 exige consentimiento libre, expreso y consciente; no hay autoridad independiente (menos guía). Sin asesoría legal: recomendar consultar.
15. **Retenciones de la Ley 30-26:** es asunto del contador de la empresa; la web no da asesoría fiscal.
16. **CISA y RD:** las guías de CISA son de EE. UU.; las obligaciones locales de reporte (CNCS) son para el sector público. No presentar CISA como norma dominicana.
17. **DataReportal:** el 99,6% de TikTok en mayores de 18 es alcance publicitario; no citar.
18. **SLA y «24/7»:** no publicarlos sin definirlos; el soporte remoto es «en horario hábil».
19. **JSON-LD `LocalBusiness`:** exige `address`; Gaya no publica dirección. Usar `Organization` + `Service`.
20. **Nombre de marca:** el sitio dice «Gaya Digital»; las redes dicen «Gaya Group». `alternateName` en JSON-LD y decisión pendiente del dueño (ficha maestra).
21. **Ancho de columnas:** palabras largas en español (electrónica, automatización, configurados) rompen marcos de 38 columnas; medir con `wrap().overflow`.
22. **Regla del dueño (cero texto instructivo):** un dato local es contenido, no ayuda; pero si un bloque «Verificado» se vuelve una explicación de qué hacer, sobra. Etiquetas y estados solamente.
23. **No mencionar que el sitio lo hizo una IA**, ni en JSON-LD, meta, créditos ni copy; el servicio «Automatización e IA» sí se ofrece.
24. **Marca personal sin RNC (interna):** una empresa dominicana que compra necesita comprobante para deducir el gasto; Gaya no puede emitirlo sin RNC. Resolver antes de cerrar ventas B2B.

---

## 7. Registro de hechos verificados y fuentes (30-sep-2026)

Grado · **Re-verificar** (fecha o evento). URLs exactas; las marcadas «(búsqueda)» las vi en resultados de búsqueda y no las abrí.

| ID | Hecho | Fuente | Grado | Re-verificar |
|---|---|---|---|---|
| F01 | Prórroga automática 6 meses (Aviso 06-26, 6-may-2026): pequeños, micro y no clasificados → 15-nov-2026 | EY <https://www.ey.com/es_ce/technical/tax/tax-alerts/republica-dominicana-dgii-otorga-prorroga-de-seis-meses-a-contribuyentes-identificados-como-pequenos-micros-y-no-clasificados-para-la-implementacion-de-fe> · Diario Libre <https://www.diariolibre.com/economia/negocios/2026/05/06/dgii-da-prorroga-para-implementacion-de-facturacion-electronica/3524934> · DGII (no cargó, 401) <https://dgii.gov.do/noticias/Paginas/DGII-otorga-prorroga-seis-meses-Peque%C3%B1os-Micros-y-no-clasificados.aspx> | B | 15-nov-2026 |
| F02 | Grandes locales y medianos: e-CF tipo E exclusivo desde 1-nov-2026; serie B inválida tras 31-oct (Reglamento 587-24 Art. 55) | El Faro RD (comunicado DGII, 26-27 ago 2026) <https://www.elfarord.com/2026/08/dgii-informa-la-emision-exclusiva-de.html> · 7días <https://7dias.com.do/2026/08/26/dgii-advierte-a-los-grandes-y-medianos-contribuyentes-que-a-partir-de-noviembre-tendran-que-emitir-solo-facturas-electronicas/> · Alegra <https://blog.alegra.com/republica-dominicana/fechas-limite-facturacion-electronica-dgii/> | B | 1-nov-2026 |
| F03 | Ley 32-23: plazos 12/24/36 meses (Art. 37), voluntariedad (Art. 38), infracciones (Art. 26), sanciones (Art. 27) | Ley 32-23 (PDF DGII) <https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf> | A | 12 meses |
| F04 | Sanción: multa de 5 a 30 salarios mínimos (Art. 257 Código Tributario, vía Art. 27) | Ley 32-23 (Art. 27, leído) + monto por siemprealdia (búsqueda) <https://siemprealdia.co/republica-dominicana/impuestos/sanciones-por-incumplimiento-en-la-facturacion-electronica/> y EY (F01) | A / B (monto) | 6 meses |
| F05 | Facturador Gratuito: gratis; RNC + Alta NCF + OFV + certificado; solo DOP; sin impuestos adicionales ni propina; sin interconexión | DGII FAQ <https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas-Frecuentes-Facturador-Gratuito.pdf> | A | 90 d |
| F06 | El FG conserva e-CF hasta 2 años; conservar 10 años (Art. 50 Código Tributario) | Misma FAQ, preg. 20-21 | A | 90 d |
| F07 | Tres vías (FG, proveedor, propio) y proceso de certificación por etapas | DGII landing <https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx> · DGII proceso <https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Documentaciones%20Proceso%20de%20Certificaci%C3%B3n%20FE/Proceso%20de%20Certificacion%20para%20ser%20Emisor%20Electronico.pdf> | A | 90 d |
| F08 | Tipos e-CF 31-34, 41, 43-47 (46 exportaciones, 47 pagos al exterior); e-NCF = E + 2 + 10 dígitos | DGII <https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/TipoyEstructurae-CF.aspx> | A | 12 meses |
| F09 | Consumo < RD$250,000: se reporta con RFCE; el emisor conserva el completo | Ayuda DGII CA4419 <https://ayuda.dgii.gov.do/conversations/facturacin-electrnica/ca4419-cmo-se-deben-reportar-las-facturas-de-consumo-electrnicas-inferiores-a-rd250000/5f63558d8cd858ce872b533c> | A | 12 meses |
| F10 | DGII: 190 proveedores de servicios de facturación electrónica autorizados | Comunicado DGII de finales de ago-2026 (El Faro RD, ver F02) | B | 1-nov-2026 |
| F11 | Certificado digital de persona física para trámites tributarios, entidad autorizada por INDOTEL (Viafirma, Novofirma, Digifirma; Novofirma en duda) | DGII FAQ (F05) · Alegra <https://blog.alegra.com/republica-dominicana/certificado-digital-facturacion/> | A (requisito) / C (precio, estado de Novofirma) | Confirmar en INDOTEL |
| F12 | Incentivo fiscal Arts. 39-41: RD$25,000 / 75,000 / 200,000 / 300,000 (2,000,000 grandes nacionales); excluye beneficiarios del FG | Ley 32-23 (F03) | A (texto) | Aplicabilidad tras prórroga: sin confirmar |
| F13 | NIC.DO: zonas, política (1-10 años, 30 d suspendido + 15 d rescate, WHOIS exacto); precios `.do` RD$2,000, `.com.do` RD$800 (sin fecha) | <https://www.nic.do/en/domains/our-do-domains/> · <https://www.nic.do/en/policies/domain-names-delegation-policies-for-cctld-do/> · <https://www.nic.do/en/help/faqs/> · <https://midominio.do/domain-registration/domain-registration-price.php> | A | 90 d |
| F14 | WhatsApp: precio por mensaje desde 1-jul-2025; RD = «Rest of Latin America» | Meta <https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing> | A | 90 d |
| F15 | Ventana de servicio 24 h; ventana de punto de entrada gratuito 72 h (anuncio Click-to-WhatsApp/botón) | Misma página de Meta | A | 90 d |
| F16 | Desde 1-oct-2026 se cobran mensajes de servicio y plantillas de utilidad dentro de la ventana en la API | Meta <https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages> | A | 1-oct-2026 |
| F17 | 1,000 mensajes de servicio gratis por número al mes; la app Business no cambia | SendPulse <https://sendpulse.com/blog/whatsapp-service-message-pricing> · Techweez <https://techweez.com/2026/09/28/whatsapp-business-pricing-october-2026/> | C | 1-oct-2026 |
| F18 | Coexistencia: app ≥ 2.24.17, 20 mensajes/s, funciones limitadas, 24 h de sincronía, 6 meses de historial, vía partner | Meta <https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/> | A | 90 d |
| F19 | Política de mensajería: opt-in, ventana 24 h, plantillas, escalamiento a persona obligatorio | <https://whatsappbusiness.com/es-la/policy/> | A | 90 d |
| F20 | IA: restricción a «proveedores de IA» cuando la IA es la funcionalidad principal; bots de negocio permitidos | Meta Términos §4.7 <https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform> · respond.io <https://respond.io/blog/whatsapp-general-purpose-chatbots-ban> | B (regla) / X (fecha) | 1-oct-2026 |
| F21 | App Business: saludo, ausencia, respuestas rápidas, etiquetas y listas, catálogo, perfil | WhatsApp for Business, recursos (búsqueda) <https://whatsappbusiness.com/products/business-app-features/> | B | 12 meses |
| F22 | AZUL: Link de Pagos (ilimitados; mensajería, redes, correo, SMS). Botón con API, 3DS, botón PayPal y afiliación móvil: solo búsqueda | Impulsa Popular <https://impulsapopular.com/marketing/ventas/link-de-pagos-azul-vende-en-linea-sin-tener-pagina-web/> | B (Link) / C (resto) | 90 d; confirmar en azul.com.do |
| F23 | CardNET: Enlace de Pago (factura personalizada, PCI, multi-afiliado). Exigencia de empresa constituida y plugins: terceros | CardNET <https://www.cardnet.com.do/soluciones/online/enlace-de-pago> | A (enlace) / C (requisito) | Preguntar a CardNET |
| F24 | PayPal RD: retiro a banco local por socios locales (ene-2024); hasta 7 días hábiles | <https://newsroom.latam.paypal-corp.com/nuevas-opciones-de-retiro-en-Latinoamerica> · <https://www.paypal.com/do/cshelp/article/%C2%BFc%C3%B3mo-hago-para-retirar-dinero-y-transferirlo-a-mi-cuenta-bancaria-help394> | A | 90 d |
| F25 | Stripe: RD no está en su lista de países; Atlas como alternativa | <https://stripe.com/global> | A | 90 d |
| F26 | Perfil de Negocio: contacto en persona; solo en línea no elegible; sin buzones | <https://support.google.com/business/answer/13763036?hl=en> · verificación por video <https://support.google.com/business/answer/14271705?hl=en> | A | 90 d |
| F27 | Google Ads (RD): verificación con documentos de registro + identificación con foto | <https://support.google.com/adspolicy/answer/9872280?hl=es-419&co=GENIE.CountryCode%3DDO> | A | 90 d |
| F28 | Ley 30-26: retención 27% → 15% (publicidad digital, software, nube, regalías) a proveedores no residentes | Hacienda (22-jun-2026) <https://www.hacienda.gob.do/ley-30-26-no-dispone-impuestos-por-suscripciones-de-ciudadanos-a-plataformas-digitales-reduce-de-27-a-15-la-retencion-a-empresas-que-contratan-servicios-tecnologicos-en-el-exterior/> · Alegra <https://blog.alegra.com/republica-dominicana/retencion-google-ads/> | A | 90 d |
| F29 | Gmail: SPF o DKIM para todo remitente; DMARC y baja con un clic > 5,000/día (desde 1-feb-2024) | <https://support.google.com/a/answer/81126?hl=en> | A | 12 meses |
| F30 | CISA: 4 esenciales; MFA; 3-2-1; probar restauración; retroceso ≥ 7 días | <https://www.cisa.gov/resources-tools/resources/four-cybersecurity-essentials-businesses> · <https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data> | A | 12 meses |
| F31 | Apagones 2026 en Santo Domingo (3-10 h) y su efecto en pequeños negocios | Diario Libre <https://www.diariolibre.com/economia/energia/2026/09/05/el-negocio-que-crece-con-los-apagones-en-republica-dominicana/3649668> · Listín <https://listindiario.com/la-republica/20260528/apagones-frenan-actividad-pequenos-negocios-gsd_907463.html> | B | 90 d |
| F32 | El comprador revisa vendedor, precio con impuestos y envío, garantía, cambios, privacidad, https | Guía INDOTEL/Pro Consumidor (2019) <https://proconsumidor.gob.do/wp-content/uploads/2019/11/guia-comercio-electronico-impresion.pdf> | A | 12 meses |
| F33 | Ley 172-13: consentimiento libre, expreso y consciente; sin autoridad independiente | RIPD <https://www.redipd.org/documentos/la-legislacion-dominicana-sobre-proteccion-de-datos-personales-principios-consentimiento> | B | 12 meses |
| F34 | Licencia de n8n: uso interno del negocio; consultoría sí; alojar flujos/credenciales de clientes en tu instancia requiere licencia | Texto de licencia <https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md> · foro n8n <https://community.n8n.io/t/clarification-on-license-compliance-for-my-automation-service/220991> (opinión de usuario, no de n8n) | A (texto) / C (matiz) | Escribir a n8n antes de escalar |
| F35 | Agente propio de Meta: US$2.00 por millón de tokens desde 1-ago-2026 | Meta (F16) | A | 90 d |
| F36 | RD: UTC-4 todo el año, sin horario de verano | <https://en.wikipedia.org/wiki/Time_in_the_Dominican_Republic> | B | — |
| F37 | DataReportal 2026: 91,0% de penetración de internet; identidades de redes no son personas únicas | <https://datareportal.com/reports/digital-2026-dominican-republic> | A (existe) / **no usar** | — |
| F38 | NN/g: precio, About Us, credibilidad, primacía | <https://www.nngroup.com/articles/show-price/> · <https://www.nngroup.com/articles/about-us-information-on-websites/> · <https://www.nngroup.com/articles/trustworthy-design/> · <https://www.nngroup.com/videos/primacy-effect/> | A | — |
| F39 | Google: LocalBusiness requiere `name` y `address`; Organization sin obligatorias | <https://developers.google.com/search/docs/appearance/structured-data/local-business> · <https://developers.google.com/search/docs/appearance/structured-data/organization> | A | 12 meses |
| F40 | Decreto 685-22: las instituciones **públicas** notifican incidentes al CSIRT-RD (CNCS) en 24 h; DICAT (Policía Nacional) atiende delitos de alta tecnología | Presidencia (búsqueda) <https://presidencia.gob.do/noticias/gobierno-dispone-instituciones-publicas-notificar-al-centro-de-ciberseguridad-los> · CNCS <https://cncs.gob.do/csirt-rd/> (búsqueda) · guía INDOTEL (F32, DICAT: leído) | B | 12 meses |

**Los 10 a revisar a mano antes de publicar** (los que sostienen frases de la web): F01, F02, F06, F13, F15, F16, F18, F20, F28, F31.

### Fuentes de la lectura de agencias (sección 1.1)

Byar <https://byarmarketing.com/> · TAKUM <https://takum.io/> · Gmedia <https://gmedia.do/> · Novum <https://novumsolutions.com.do/> · Support IT <https://www.supportit.com.do/> · Perxist <https://perxist.com/servicios/chatbot-whatsapp/> · Appketing <https://appketing.com/chatbots-whatsapp/> · Intelia <https://www.inteliard.com/blog/como-activar-whatsapp-api-republica-dominicana> · PANCA <https://panca.studio/> · undertk <https://www.undertk.studio/desarrollo-sitios-web> · Phoenix Caribbean <https://phoenixcaribbean.com/services> · comparativa de pasarelas (con dos afirmaciones contradichas) Vendabo <https://vendabo.com/blog/pasarelas-de-pago-republica-dominicana-ecommerce>.

### Archivos del proyecto que este informe toca (no se modificaron)

`brand.json` (añadir `whatsappMessage.service`), `src/data/site.ts` (`READY.services`), `src/i18n/copy.ts` (etiquetas de campo), y nuevos `src/data/services.ts`, `src/data/facts.ts`, `src/lib/wa.ts`, `src/lib/jsonld.ts`, `src/lib/ascii-copy.ts`, `scripts/lint-services.ts`.

---

## 8. DECISIONES CERRADAS (recomendadas para Gaya Digital)

**Estructura y orden**
- **D1.** Cuatro servicios con los nombres del catálogo de WhatsApp; **orden en la página: Web y apps → Automatización e IA → Marketing y redes → Soporte e infraestructura IT.** El lead del hero y las bios conservan «Web, apps, marketing, soporte IT e IA».
- **D2.** Cada ficha lleva exactamente: promesa (≤ 56), 5-7 «Incluye» (≤ 52), «Para quién», «Necesitamos», «Resultado», 3 datos locales y un solo botón «Escribir por WhatsApp». El copy final es el de 2.1-2.4 (ES y EN).
- **D3.** «Se suma según el proyecto» existe como campo pero solo se publica lo que Giancarlo confirme (D11).

**Datos locales y honestidad**
- **D4.** Solo se publican datos grado **A o B**, con «Verificado 30 sep 2026» y `recheck`. C y X, nunca.
- **D5.** Los 12 datos locales son los de 2.1-2.4 (F01, F06, F13, F15, F16, F18, F20, F27, F28, F29, F31, F32). No se publican precios de dominios, comisiones de pasarelas, multas de la DGII, créditos fiscales ni «1,000 mensajes gratis».
- **D6.** Cero cifras de Gaya (años, clientes, proyectos, satisfacción, ROI), cero superlativos, cero «expertos», cero testimonios, cero logos. La lint lo hace cumplir.
- **D7.** La galería sigue con su sello de «ejemplos con datos ficticios»; es la prueba visible de honestidad.
- **D8.** Nunca se menciona que el sitio lo hizo una IA (ni en JSON-LD, meta ni créditos). «Automatización e IA» solo aparece como servicio.

**Precio, plazos y compromisos**
- **D9.** No se inventan tarifas. Se publica «propuesta por escrito con alcance y precio en 24-48 h» (`brand.json`). Tras 3 proyectos, el dueño decide publicar «desde» o casos representativos (recomendación de NN/g).
- **D10.** Modelo por defecto: precio cerrado por proyecto (Web/Apps, Automatización); plan mensual sin permanencia (Marketing, Soporte IT). [CONFIRMAR]
- **D11.** Todo lo marcado [CONFIRMAR] queda listado en `confirm[]` y **bloquea la build de producción** hasta aprobarse: capacidad de apps nativas, tienda con pasarela y conexión con e-CF; API de WhatsApp y agente de IA con datos del cliente; edición de video y campañas de Google Ads; soporte remoto, SLA y administración de M365/Workspace.
- **D12.** No hay SLA ni «24/7» publicados. «Soporte remoto por WhatsApp en horario hábil» hasta que el dueño defina tiempos.
- **D13.** Compromisos de «Quiénes somos»: propuesta en 24-48 h y «accesos y archivos tuyos» se publican solo tras confirmarse; el tiempo de respuesta por WhatsApp se propone como «en un día hábil».

**Contenido de fondo**
- **D14.** «Quiénes somos» usa el bloque de la sección 3 (7 líneas ES/EN, sin cifras, sin fotos de stock). El nombre de Giancarlo es visible.
- **D15.** Facturación electrónica: Gaya la trata como **integración** («conectamos tu tienda o sistema con tu proveedor de e-CF») y como **dato fechado**, nunca como servicio propio ni promesa de cumplimiento. Si el dueño no puede sostener la integración, la línea sale.
- **D16.** Automatización: **App Business primero**; API solo cuando haya bots, CRM o varios agentes. Bots con función de negocio, con reglas, traspaso humano, registro y opt-in. Sin asistentes de IA de uso general.
- **D17.** Los flujos de automatización se despliegan en la infraestructura del cliente (n8n en su cuenta/servidor o código propio); no se alojan credenciales de varios clientes en una instancia propia de n8n.
- **D18.** Marketing: «Perfil de Google, si tu negocio califica»; nunca dirección falsa; reporte solo con métricas de plataforma; el presupuesto de anuncios y sus retenciones son del cliente y su contador.
- **D19.** IT: entregables 2-4 anclados en Google (SPF/DKIM/DMARC) y CISA (MFA, 3-2-1, restauración probada, retroceso ≥ 7 días); «plan para los apagones» incluye recomendar UPS/inversor y contingencia, no vender hardware.
- **D20.** Sin asesoría fiscal ni legal: donde el tema es fiscal o legal (Ley 30-26, Ley 172-13, e-CF), el copy solo informa el hecho y la fecha.

**Medición y técnica**
- **D21.** Medición **sin analítica**: el botón de cada servicio abre WhatsApp con «Hola Gaya Digital, me interesa «{servicio}». Quiero una propuesta.»; el dueño etiqueta los chats en la app Business; revisión a los 20 chats etiquetados o 60 días.
- **D22.** Datos en `src/data/services.ts` y `src/data/facts.ts`; enlace vía `waService()` (con la clave `whatsappMessage.service` en `brand.json`); JSON-LD `Organization` + `Service` con `alternateName: 'Gaya Group'`; **sin** `LocalBusiness`.
- **D23.** `scripts/lint-services.ts` corre antes de cada build: presupuesto de columnas, 5-7 «Incluye» con paridad ES/EN, lista de prohibidos, hechos C/X, `[CONFIRMAR]` en producción, caducidad de hechos (falla a los 30 días).
- **D24.** Calendario de re-verificación: **1-oct-2026** (cobro de mensajes de servicio y política de IA de WhatsApp), **1-nov-2026** (emisión exclusiva de grandes locales y medianos), **15-nov-2026** (plazo de pequeños, micro y no clasificados), y cada 90 días el resto.
- **D25.** El arte de cada servicio es ASCII decorativo (`aria-hidden`) con los 4 bocetos de 5.8 como punto de partida (ancho 38-52 columnas); el texto real vive siempre en `h2/p/ul/dl`. Con `prefers-reduced-motion`, versión estática.

**Pendientes del dueño (no van al sitio)**
- **D26.** Antes de vender a empresas dominicanas: resolver RNC y emisión de e-CF propia (una empresa necesita comprobante para deducir el gasto). Hasta entonces, las ventas B2B en RD dependen de esa decisión.
- **D27.** Confirmar el nombre de marca (Gaya Digital vs Gaya Group) para unificar redes, firma de Zoho y JSON-LD.
