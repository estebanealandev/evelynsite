# Fuentes oficiales para SEO, GEO e infraestructura

**Fecha de consulta de todas las fuentes: 2026-11-07.** Se leyeron con WebFetch. Lo que sigue está parafraseado; las citas textuales tienen menos de 15 palabras (como máximo una por fuente). Cuando una página no muestra su fecha de actualización, se indica «sin fecha visible». Si algo no se pudo confirmar en la página, aparece como **no confirmado**: no se completó con memoria ni con fuentes de terceros.

Clasificaciones usadas:

- **Requisito oficial**: la documentación lo exige o describe un comportamiento obligatorio o determinista.
- **Recomendación documentada**: la documentación lo aconseja, pero no lo exige.
- **Hipótesis**: inferencia nuestra a partir de la documentación, que no está escrita tal cual.
- **Sin evidencia**: la fuente no lo dice o no se pudo confirmar.

Contexto del proyecto: sitio Astro estático en Cloudflare Workers con Static Assets (`wrangler.jsonc` con `html_handling: "drop-trailing-slash"`), dominio `https://evelynelizondo.com`, contenido de derecho de familia (YMYL) en es-CR y `noindex` mantenido por ahora.

---

## 1. Google: robots meta tag y X-Robots-Tag

- **URL:** https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag (sin fecha visible)
- **Qué dice:**
  - Si robots.txt bloquea una URL, Googlebot no la rastrea y no llega a leer la meta robots ni el encabezado `X-Robots-Tag`. Un `noindex` en una página bloqueada no tiene efecto, y para que se respete la página no puede estar en `Disallow`. → **Requisito oficial.**
  - Cuando hay reglas en conflicto se aplica la más restrictiva. El ejemplo de la página: `max-snippet:50` junto con `nosnippet` termina en `nosnippet`. Si cada rastreador recibe reglas distintas, Google combina las restrictivas. → **Requisito oficial** (comportamiento descrito).
  - Toda regla de la meta robots puede enviarse también como `X-Robots-Tag`. El encabezado sirve para HTML y es la vía recomendada para archivos que no son HTML (PDF, imágenes, video). → **Requisito oficial** (que se admite) y **recomendación documentada** (para archivos que no son HTML).
  - `nosnippet` impide que el contenido se use como entrada directa de AI Overviews y AI Mode. `max-snippet` limita cuánto contenido se usa. → **Requisito oficial** (comportamiento descrito).
  - Que la página diga literalmente «meta frente a header» al hablar de conflictos: **sin evidencia**. La regla se describe para reglas en conflicto en general. Que un `X-Robots-Tag: noindex` y una meta `index` terminen en `noindex` es **hipótesis** fuerte, coherente con «se aplica la más restrictiva».
- **Decisión que respalda:** mientras el sitio siga en `noindex`, robots.txt **no** debe bloquear las páginas (nada de `Disallow: /`); si las bloquea, Google nunca ve el `noindex` y puede indexar la URL sin contenido. Al abrir la indexación hay que quitar el `noindex` tanto de la meta como del encabezado: basta que quede en uno de los dos para que la página siga fuera del índice.

## 2. Google: funciones de IA (AI Overviews, AI Mode) y guía de optimización para IA

- **URL A:** https://developers.google.com/search/docs/appearance/ai-features (sin fecha visible)
  - **Qué dice:** no hay requisitos adicionales para aparecer en AI Overviews o AI Mode. No hacen falta llms.txt, archivos especiales ni marcado schema.org específico. La página tiene que estar indexada y poder mostrarse en Search con fragmento. Para controlar lo que se muestra existen el robots.txt de Googlebot, `nosnippet`, `data-nosnippet`, `max-snippet` y `noindex`. Google-Extended limita el entrenamiento y la fundamentación (*grounding*) en otros sistemas de Google, no en Search. Cita: «no additional requirements to appear in AI Overviews or AI Mode».
  - **Clasificación:** **requisito oficial** (la indexación y la elegibilidad para fragmento son la condición) y **recomendación documentada** (que no se necesita nada especial).
- **URL B:** https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (existe; título «Optimizing your website for generative AI features on Google Search»; sin fecha visible)
  - **Qué dice:**
    - Google Search no usa llms.txt, archivos de texto para IA ni versiones Markdown de las páginas. Crearlos no ayuda ni perjudica, y pueden mantenerse para otros servicios.
    - No hay marcado especial para la IA, aunque los datos estructurados siguen sirviendo para los resultados enriquecidos.
    - No hace falta trocear el contenido ni existe una longitud ideal.
    - Rige el SEO estándar: contenido rastreable, original y útil.
    - Menciona Google Business Profile para datos de negocios locales y el informe de rendimiento de IA generativa en Search Console.
    - Pide cautela con los servicios «AEO/GEO» que dicen tener datos internos de Google.
  - **Clasificación:** **recomendación documentada.**
- **Google-Extended**, en https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers (sin fecha visible):
  - Es solo un token de robots.txt, sin agente de usuario HTTP propio. Controla el entrenamiento de Gemini y la fundamentación en Gemini Apps y Vertex AI.
  - Cita: «does not impact a site's inclusion in Google Search».
  - Google anuncia que admitirá la señal AIPREF (`user-agent: __usage_ai-training`) a principios de 2027.
  - Que AI Overviews no quede afectado se deduce de la página A, porque la página B de Google-Extended no lo menciona.
  - **Clasificación:** **requisito oficial.**
- **Decisión que respalda:** `llms.txt` es opcional y no aporta nada para Google; si se publica, es para otros agentes (**hipótesis** de utilidad, **sin evidencia** de beneficio en Google). Bloquear `Google-Extended` no saca al sitio de Search ni de AI Overviews. Para limitar el uso del contenido en AI Overviews está `nosnippet` o `data-nosnippet`, con el costo de perder también el fragmento normal.

## 3. Google: sitemaps y `lastmod`

- **URL:** https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap (sin fecha visible)
- **Qué dice:**
  - Google usa `lastmod` solo si es exacto de forma consistente y verificable. Debe reflejar cambios significativos (contenido principal, datos estructurados, enlaces) y no cosas como el año del copyright.
  - Google ignora `priority` y `changefreq`.
  - Límites: 50 MB sin comprimir y 50 000 URL por archivo; si se pasan, se usa un índice de sitemaps.
  - Las URL deben ser absolutas.
  - Se envía desde Search Console (informe o API) o con una línea `Sitemap:` en robots.txt. El envío es solo una pista.
  - Sobre el endpoint *ping*, la página no dice nada: **sin evidencia** en esta fuente.
- **Clasificación:** **requisito oficial** (URL absolutas y límites), **recomendación documentada** (exactitud de `lastmod`) y **requisito oficial** (`priority` y `changefreq` se ignoran).
- **Decisión que respalda:** generar `lastmod` desde la fecha real de modificación del contenido, no desde la fecha de compilación. Si no hay fecha fiable, omitirlo. Quitar `priority` y `changefreq` o dejarlos sabiendo que Google no los usa. Declarar el sitemap en robots.txt cuando se abra la indexación.

## 4. Google: datos estructurados (FAQPage, Breadcrumb, Article, Organization, LocalBusiness)

### 4a. FAQPage

- **URL:** https://developers.google.com/search/docs/appearance/structured-data/faqpage. **No carga la página de FAQPage:** muestra el registro de cambios «Latest documentation updates» de Search Central.
- **Qué dice el registro:**
  - El 8 de mayo de 2026 se añadió un aviso de retirada: la función deja de aparecer en Search desde el 7 de mayo de 2026.
  - El 15 de junio de 2026 se eliminó la documentación. Cita: «The FAQ rich result feature is no longer shown in Google Search results».
  - No quedan propiedades requeridas publicadas.
- **Clasificación:** **requisito oficial** (el resultado enriquecido FAQ ya no existe).
- **Decisión que respalda:** no agregar `FAQPage` buscando resultados enriquecidos en Google, porque no aporta nada visible. Que siga sirviendo como señal semántica para otros motores o para LLM es **hipótesis sin evidencia** oficial. Las preguntas frecuentes en HTML visible siguen siendo contenido útil normal.

### 4b. BreadcrumbList

- **URL:** https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (sin fecha visible)
- **Qué dice:**
  - `itemListElement` es requerido, con al menos dos `ListItem`.
  - Cada `ListItem` requiere `position` (1 es el inicio), `name` e `item` (URL).
  - El último elemento no necesita `item`; si falta, Google usa la URL de la página.
  - No hay propiedades recomendadas.
- **Clasificación:** **requisito oficial.**
- **Decisión que respalda:** marcar migas solo en páginas con al menos dos niveles. El último elemento puede ir sin `item`, y las URL de `item` deben coincidir con las canónicas sin barra final.

### 4c. Article

- **URL:** https://developers.google.com/search/docs/appearance/structured-data/article (sin fecha visible)
- **Qué dice:**
  - No hay propiedades requeridas.
  - Recomendadas: `author` (`Person` u `Organization`, nunca `Thing`), `author.name` (solo el nombre, sin cargos ni «Lic.», que van en `jobTitle` u `honorificPrefix`), `author.url` o `sameAs`, `datePublished`, `dateModified`, `headline` e `image` (16x9, 4x3 y 1x1, al menos 50 000 píxeles).
  - Las fechas van en ISO 8601 con zona horaria; sin zona, Google usa la de Googlebot.
- **Clasificación:** **recomendación documentada.**
- **Decisión que respalda:** en artículos, usar `author` de tipo `Person` con `name: "Evelyn Elizondo"` (sin «Licda.») y `url` apuntando a la página «Sobre mí». Escribir las fechas con zona horaria de Costa Rica (`-06:00`) y hacer que `dateModified` refleje cambios reales.

### 4d. Organization

- **URL:** https://developers.google.com/search/docs/appearance/structured-data/organization (sin fecha visible)
- **Qué dice:**
  - No hay propiedades requeridas.
  - Recomendadas: `name`, `alternateName`, `url`, `logo`, `sameAs`, `address`, `contactPoint`, `telephone`, `email` y `description`, entre otras.
  - Se coloca en la página de inicio o en la página «acerca de», no en todas.
  - Si el sitio es de un negocio local, se usa el subtipo más específico de `LocalBusiness` y se cumplen además los campos de LocalBusiness.
- **Clasificación:** **recomendación documentada.**

### 4e. LocalBusiness

- **URL:** https://developers.google.com/search/docs/appearance/structured-data/local-business (sin fecha visible)
- **Qué dice:**
  - **`name` y `address` son requeridos.** `address` se define como la ubicación física del negocio.
  - Recomendadas: `geo`, `telephone`, `url`, `openingHoursSpecification` y `priceRange`, entre otras.
  - La página no menciona `areaServed` ni negocios de área de servicio sin dirección pública: **sin evidencia**.
  - Tampoco menciona `LegalService` ni `Attorney`. Solo dice que se use el subtipo más específico posible y remite a schema.org.
- **Clasificación:** **requisito oficial** (`address` es obligatorio para LocalBusiness en Google).
- **Decisión que respalda:** si no hay una oficina física que pueda publicarse, **no usar `LocalBusiness`/`LegalService`** (quedaría sin una propiedad requerida o con una dirección falsa). Usar `Organization` o `Person` (más `ProfessionalService` sin pretender elegibilidad local; esto es **hipótesis**) con `areaServed`. Para la presencia local, el canal oficial es Google Business Profile (sección 6).

## 5. Google: contenido útil y E-E-A-T, JavaScript SEO y canonical

### 5a. Contenido útil y E-E-A-T

- **URL:** https://developers.google.com/search/docs/fundamentals/creating-helpful-content (sin fecha visible)
- **Qué dice:**
  - El contenido debe estar pensado para personas, mostrar experiencia de primera mano y no limitarse a resumir lo que otros dicen.
  - E-E-A-T no es un factor de ranking en sí, pero Google usa señales que lo reflejan, y la confianza es lo más importante. Cita: «E-E-A-T itself isn't a specific ranking factor».
  - Los temas YMYL (salud, finanzas, seguridad) reciben más peso de E-E-A-T.
  - Quién, cómo y por qué:
    - Quién: firmas con enlace a la información del autor, sin perfiles inventados.
    - Cómo: explicar cómo se produjo el contenido, incluido el uso de IA.
    - Por qué: ayudar a las personas, no atraer tráfico.
- **Clasificación:** **recomendación documentada.** Las prácticas de spam con IA están en las políticas de spam, que no se consultaron aquí.
- **Decisión que respalda:**
  - Firmar cada artículo con autora real y enlace a una biografía verificable (colegiatura en el Colegio de Abogados y Abogadas de Costa Rica, si se publica).
  - Mostrar las fechas de publicación y de revisión.
  - Si se usa IA en la redacción, explicarlo.
  - No inventar credenciales ni fotos.

### 5b. JavaScript SEO

- **URL:** https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics (sin fecha visible)
- **Qué dice:**
  - El proceso es rastreo, cola de renderizado (Chromium) e indexación del HTML renderizado.
  - Recomienda SSR o prerenderizado, porque no todos los bots ejecutan JavaScript.
  - Un `noindex` en el HTML original puede hacer que Google no renderice, así que quitarlo con JavaScript puede no funcionar.
  - Se puede fijar el canonical con JavaScript, pero es preferible en HTML y con un único `rel=canonical`.
  - Recomienda usar códigos HTTP significativos (404 reales).
- **Clasificación:** **recomendación documentada.** Que Google se salte el renderizado con `noindex` es un comportamiento posible (la página dice «puede»).
- **Decisión que respalda:** la salida estática de Astro (contenido, meta y JSON-LD en el HTML inicial) es la opción correcta. El `noindex` y el canonical se controlan en el HTML generado, nunca con JavaScript del cliente. Las páginas inexistentes deben devolver un 404 real.

### 5c. Canonical y duplicados

- **URL:** https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls (sin fecha visible)
- **Qué dice:**
  - Las redirecciones son una señal fuerte (permanentes y solo al retirar un duplicado). `rel=canonical`, en HTML o en encabezado, también es fuerte. Incluir la URL en el sitemap es una señal débil.
  - Prácticas:
    - URL absolutas.
    - Canonical apuntando a sí misma.
    - Coherencia entre canonical, sitemap y enlaces internos.
    - Un solo método.
    - No usar robots.txt ni `noindex` para canonicalizar.
    - Preferir HTTPS con HSTS.
  - No usa las palabras «pista» ni «directiva» (la llama señal fuerte) y no menciona la barra final: **sin evidencia**.
- **Clasificación:** **recomendación documentada.**
- **Decisión que respalda:** canonical absoluto sin barra final (coherente con `drop-trailing-slash`), los mismos URL en el sitemap y en los enlaces internos, y `www` redirigido de forma permanente al dominio raíz. Ver la nota sobre los 307 en la sección 9.

## 6. Google Business Profile: pautas de representación

- **URL:** https://support.google.com/business/answer/3038177?hl=en (sin fecha visible, «©2026 Google»)
- **Qué dice:**
  - **Elegibilidad:** el negocio necesita una ubicación física que los clientes puedan visitar o tiene que desplazarse hasta los clientes.
  - **Profesionales individuales** (médicos, abogados, agentes):
    - Tienen perfil propio si atienden al público y se les puede contactar en persona en la ubicación verificada durante el horario indicado. Cita: «can be contacted directly at the verified location during stated hours».
    - El personal de apoyo no crea perfil.
    - Si hay varios profesionales en un lugar, hay un perfil de la organización y uno por profesional, este último solo con su nombre.
    - Si es la única profesional de una marca en ese lugar, se comparte un solo perfil llamado «[marca]: [profesional]».
    - No se crean perfiles separados por especialidad.
  - **Negocios de área de servicio:** un perfil para la oficina central con área de servicio, y se oculta la dirección si no se recibe a clientes allí (ejemplo: alguien que trabaja desde casa).
  - **Prohibido:** oficinas virtuales, buzones, apartados postales y direcciones de correo alquiladas donde no se opera. Un coworking solo vale con rótulo visible, atención a clientes en horario y personal propio.
  - **Nombre:** el del mundo real, sin palabras clave, eslóganes, teléfonos ni URL.
- **Clasificación:** **requisito oficial** (son las políticas de GBP).
- **Decisión que respalda:**
  - Sin una oficina real con atención presencial en horario, no se puede registrar una dirección en GBP, y una dirección virtual o un apartado está prohibido.
  - Si la licenciada atiende en un despacho propio o compartido con rótulo y horario, puede tener un perfil individual.
  - Si solo atiende de forma remota o en otros lugares, que un despacho jurídico califique como negocio de área de servicio (el requisito es «desplazarse hasta el cliente») es **hipótesis**: hay que confirmarlo con la operación real antes de crear el perfil.
  - Para el sitio, la consecuencia coincide con la sección 4e: no publicar una dirección que no cumpla estas pautas.

## 7. Bing Webmaster Tools e IndexNow

- **URL A:** https://www.indexnow.org/documentation (sin fecha visible)
  - **Qué dice sobre la clave:**
    - Tiene de 8 a 128 caracteres. La página menciona hexadecimales y también enumera a-z, A-Z, 0-9 y guiones.
    - **Opción 1, recomendada:** el archivo `/{clave}.txt` en la raíz, en UTF-8, con la clave como contenido.
    - **Opción 2:** el archivo en otra ruta del mismo host, indicada con `keyLocation`. En ese caso la ruta limita qué URL cubre (una clave en `/catalog/` solo vale para `/catalog/...`).
  - **Qué dice sobre los envíos:**
    - Una URL se envía con `GET https://<buscador>/indexnow?url=...&key=...`.
    - En lote se envía con `POST` JSON (`host`, `key`, `keyLocation`, `urlList`), hasta **10 000 URL por POST**.
    - Se notifican las URL **añadidas, actualizadas o eliminadas**.
    - Respuestas: 200 OK, 202 recibido con clave pendiente de validar, 400 formato, 403 clave inválida, 422 URL de otro host, 429 demasiadas peticiones.
    - Los buscadores participantes comparten entre sí las URL recibidas.
    - No hay un límite de frecuencia numérico, solo el aviso de no enviar en exceso (de ahí el 429).
  - **Clasificación:** **requisito oficial** (formato de la clave y del envío) y **recomendación documentada** (archivo en la raíz y automatización).
- **URL B:** https://www.bing.com/indexnow/getstarted (sin fecha visible)
  - **Qué dice:**
    - Los pasos son generar la clave, alojarla, enviar y verificar la recepción en Bing Webmaster Tools.
    - El ejemplo usa `api.indexnow.org/IndexNow`.
    - Pide enviar solo URL cambiadas desde que se empezó a usar IndexNow, no URL antiguas.
    - Los envíos cuentan para la cuota de rastreo, y no se garantiza rastreo ni indexación.
    - Menciona que CDN como Cloudflare ya lo integran.
    - No aparecen el límite de 10 000 ni cuotas diarias: **sin evidencia** en esta página.
  - **Clasificación:** **recomendación documentada.**
- **Decisión que respalda:**
  - Publicar `public/{clave}.txt` en la raíz, que es estático y sirve el Worker a través de los recursos.
  - Tras cada despliegue, enviar por POST solo las URL que cambiaron o se borraron.
  - **No enviar nada mientras el sitio siga en `noindex`** (**hipótesis** de prudencia: notificar páginas `noindex` no aporta).
  - Verificar en Bing Webmaster Tools.
  - Que la clave no es secreta se deduce de que es pública por diseño (**hipótesis**).

## 8. Rastreadores de OpenAI

- **URL:** https://developers.openai.com/api/docs/bots (cargó; sin fecha visible)
- **Qué dice:**
  - **OAI-SearchBot:** sirve para aparecer en la búsqueda de ChatGPT y respeta robots.txt. Si se bloquea, el sitio no aparece en las respuestas de búsqueda, aunque puede salir como enlace de navegación. IP: `https://openai.com/searchbot.json`.
  - **GPTBot:** rastrea para entrenar modelos y respeta robots.txt. IP: `https://openai.com/gptbot.json`.
  - **ChatGPT-User:** hace acciones iniciadas por usuarios (visitar una página para responder, GPT Actions) y no rastrea de forma automática. Como lo inicia una persona, robots.txt puede no aplicarse, y no determina la inclusión en la búsqueda. IP: `https://openai.com/chatgpt-user.json`.
  - **OAI-AdsBot:** valida páginas de anuncios. La página no dice si respeta robots.txt. IP: `https://openai.com/adsbot.json`.
  - Las reglas de cada bot son independientes: se puede permitir OAI-SearchBot y bloquear GPTBot. Los cambios en robots.txt tardan unas 24 horas en reflejarse en la búsqueda.
- **Clasificación:** **requisito oficial** (comportamiento declarado por OpenAI).
- **Decisión que respalda:** si se quiere visibilidad en ChatGPT sin ceder contenido para entrenamiento, usar `User-agent: OAI-SearchBot` con `Allow: /` y `User-agent: GPTBot` con `Disallow: /`. ChatGPT-User no se controla de forma fiable con robots.txt. Si se filtra por IP en Cloudflare, usar los JSON publicados en lugar de listas copiadas a mano.

## 9. Cloudflare Workers Static Assets: `_headers`, `_redirects`, `html_handling` y enrutamiento

### 9a. `_headers`

- **URL:** https://developers.cloudflare.com/workers/static-assets/headers/ (actualizada el 22 de septiembre de 2026)
- **Qué dice:**
  - Las reglas de `_headers` **no se aplican a las respuestas generadas por el código del Worker**, aunque la URL coincida. Cita: «are not applied to responses generated by your Worker code».
  - Con `run_worker_first`, probablemente haya que poner los encabezados en el Worker.
  - Límites: 100 reglas y 2000 caracteres por línea.
  - Sintaxis: un `*` por URL (`:splat`), marcadores `:nombre`, `! Encabezado` para quitar un encabezado. Los encabezados repetidos se unen con coma.
  - Las redirecciones se aplican antes que los encabezados.
  - Cloudflare añade por defecto `Content-Type`, `Cache-Control: public, max-age=0, must-revalidate`, `ETag` y `CF-Cache-Status`.
  - El archivo va en el directorio de recursos estáticos (`public/` en frameworks).
  - **Sin evidencia** en la página sobre `env.ASSETS.fetch` y sobre las respuestas 404 de `not_found_handling`.
- **Clasificación:** **requisito oficial.**

### 9b. `_redirects`

- **URL:** https://developers.cloudflare.com/workers/static-assets/redirects/ (actualizada el 25 de agosto de 2026)
- **Qué dice:**
  - Precedencia:
    - Las redirecciones van antes que los encabezados y se siguen aunque también coincida un recurso.
    - **No se aplican a peticiones atendidas por el código del Worker.**
    - Las Bulk Redirects de la zona se ejecutan antes que el Worker.
    - Dentro del archivo gana la primera regla que coincide, y las reglas estáticas deben ir antes que las dinámicas.
  - Límites: 2000 estáticas más 100 dinámicas, y 1000 caracteres por línea.
  - Códigos: 301, 302 (por defecto), 303, 307 y 308. El 200 hace de proxy solo para rutas relativas del mismo sitio, y conviene un `Link` canonical.
  - No admite redirecciones entre dominios, por país, idioma o cookie, ni coincidencia por parámetros de consulta.
- **Clasificación:** **requisito oficial.**

### 9c. `html_handling`

- **URL:** https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/ (actualizada el 23 de abril de 2026)
- **Qué dice:**
  - Con `drop-trailing-slash`, todas las páginas HTML, incluidos los `index.html` de carpeta, se sirven sin barra final.
  - `/ruta/`, `/ruta.html` y `/ruta/index.html` redirigen a `/ruta`.
  - **Todas estas redirecciones son 307** (temporales).
  - `auto-trailing-slash` es el valor por defecto, y `none` desactiva el manejo.
- **Clasificación:** **requisito oficial** (comportamiento).

### 9d. Enrutamiento del Worker

- **URL:** https://developers.cloudflare.com/workers/static-assets/routing/worker-script/ (actualizada el 12 de octubre de 2026)
- **Qué dice:** por defecto se intenta servir primero un recurso estático, y el Worker solo se ejecuta si no hay coincidencia. `run_worker_first` (`true` o una lista de rutas) cambia ese orden.
- **Clasificación:** **requisito oficial.**

### Decisión que respalda (sección 9 completa)

- Las páginas estáticas sí reciben `_headers` (`X-Robots-Tag`, CSP, HSTS y demás).
- El endpoint del formulario y cualquier otra respuesta del Worker **no** los reciben: hay que poner en código `X-Robots-Tag: noindex` y los encabezados de seguridad en esas respuestas.
- Que una 404 generada por el Worker o por `not_found_handling` reciba `_headers` está **sin evidencia**: hay que comprobarlo con `curl -I`.
- Las redirecciones de `html_handling` son 307. Google prefiere redirecciones permanentes para canonicalizar (5c). Que un canonical coherente y unos enlaces internos sin barra compensen el 307 es **hipótesis** razonable.
- Para tener un 301 o 308 explícito, `_redirects` no admite la regla genérica de «quitar la barra final» por dominio: sería una regla dinámica, y su interacción con `html_handling` está **sin evidencia**. Probar antes de adoptarla.
- La redirección de `www` al dominio raíz debe quedarse en la regla de zona (Bulk o Single Redirect), porque `_redirects` no hace redirecciones entre dominios.

## 10. Cloudflare DNSSEC

- **URL A:** https://developers.cloudflare.com/dns/dnssec/ (actualizada el 24 de junio de 2026)
  - **Qué dice:**
    - Se activa en DNS > Settings > Enable DNSSEC, y luego se crea el registro DS en el registrador. Cloudflare prefiere el algoritmo 13 (ECDSA P-256 SHA-256).
    - Con Cloudflare Registrar (y para `.ch` y `.cz`), el DS se publica solo mediante CDS/CDNSKEY y tarda de uno a dos días.
    - Al migrar con DNSSEC activo, hay que quitar el DS y esperar su TTL antes de cambiar de servidores de nombres; si no, los resolutores devuelven SERVFAIL.
    - Los TTL del DS suelen ser de 24 a 48 horas.
- **URL B:** https://developers.cloudflare.com/dns/dnssec/dnssec-states/ (actualizada el 16 de abril de 2026)
  - **Qué dice sobre los estados:**
    - `pending`: activado en Cloudflare sin DS en el registrador.
    - `active`: activado y con DS presente.
    - `pending-disabled`: desactivado en Cloudflare, pero el DS sigue en el registrador.
    - `disabled`: desactivado y sin DS.
    - *Deleted*: nunca se activó o se borró; el API muestra `disabled` con `modified_on: null`.
  - **Sin evidencia:** cuánto dura `pending` y qué dispara exactamente el paso a `active`. Que se active al detectar el DS es **hipótesis** coherente con las definiciones.
- **URL C:** https://developers.cloudflare.com/dns/dnssec/troubleshooting/ (actualizada el 16 de abril de 2026)
  - **Qué dice sobre la verificación:**
    - `dig +short DS evelynelizondo.com` muestra el DS en el padre, y `dig DS evelynelizondo.com +trace` indica qué servidor (el del TLD) lo devuelve.
    - `dig DNSKEY evelynelizondo.com +short` muestra las claves (256 es la ZSK y 257 la KSK).
    - `dig evelynelizondo.com +dnssec` incluye RRSIG. Sin `+short`, la bandera `ad` indica respuesta autenticada.
    - Si `dig ... +dnssec +cd` responde bien pero una consulta normal da SERVFAIL, DNSSEC está mal configurado.
    - DNSViz es una herramienta pública, ajena a Cloudflare, para ver la cadena de confianza.
    - El error típico es un DS desajustado tras cambiar de proveedor.
- **Clasificación:** **requisito oficial** (procedimiento) y **recomendación documentada** (herramientas).
- **Decisión que respalda:** para comprobar el despliegue, ver que el DS publicado en `.com` coincide con el que muestra Cloudflare, que el estado del API es `active`, que aparece la bandera `ad` y que DNSViz no marca errores.

## 11. Cloudflare: Verified Bots, Bot Fight Mode y AI Crawl Control

- **Verified Bots.** https://developers.cloudflare.com/bots/concepts/bot/verified-bots/ (actualizada el 2 de noviembre de 2026)
  - **Qué dice:**
    - Son bots que se identifican de forma honesta (Web Bot Auth, lista de IP publicada con agente de usuario estable, o DNS inverso) y no abusan: respetan robots.txt y llevan un ritmo razonable.
    - Cloudflare los valida con Web Bot Auth o por IP.
    - Las categorías heredadas (Search Engine Crawler, AI Search, AI Crawler, etc.) siguen usándose en reglas WAF personalizadas, y AI Search se trata ahora como comportamiento Search.
    - El listado está en Cloudflare Radar (radar.cloudflare.com/verified-bots).
    - Los nombres de campo `cf.client.bot` y `cf.bot_management.verified_bot` **no aparecen en esta página: sin evidencia** aquí.
  - **Clasificación:** **requisito oficial** (definición).
- **Bot Fight Mode.** https://developers.cloudflare.com/bots/get-started/bot-fight-mode/ (actualizada el 3 de agosto de 2026)
  - **Qué dice:**
    - Es gratuito, cubre todo el dominio y lanza desafíos costosos.
    - **No se puede omitir con reglas WAF ni con Page Rules** (Skip, Bypass y Allow no tienen efecto). Las reglas de IP Access sí lo evitan. Cita: «Cannot be customized, adjusted, or reconfigured via WAF custom rules».
    - Puede desafiar tráfico de API o de apps.
    - Activa JS Detections, lo que obliga a permitir `/cdn-cgi/challenge-platform/` en la CSP (los nonces vía `<meta>` no sirven).
    - La página **no dice** si deja pasar a los bots verificados: **sin evidencia**.
  - **Clasificación:** **requisito oficial.**
- **AI Crawl Control.** https://developers.cloudflare.com/ai-crawl-control/ (actualizada el 14 de agosto de 2026) y https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/ (actualizada el 28 de julio de 2026)
  - **Qué dice:**
    - Muestra qué servicios de IA rastrean el sitio.
    - Permite o bloquea cada rastreador desde la pestaña Crawlers; bloquear crea o actualiza una regla WAF de la zona.
    - Cuenta las violaciones de robots.txt y ofrece «Enforce robots.txt».
    - No dice si bloquear OAI-SearchBot o Google afecta la búsqueda (**sin evidencia** en la página; para OpenAI, ver la sección 8).
- **Políticas de acceso.** https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/ (actualizada el 2 de noviembre de 2026; la URL muestra «AI Crawler and Agent access policies»)
  - **Qué dice:**
    - Hay políticas por comportamiento (Search, Agent y Training) con las acciones Block, Block on pages with ads, Allow y Disallow (esta última solo para Training, vía robots.txt).
    - **En dominios nuevos, todo está en Allow por defecto.**
    - Cada política afecta a bots verificados y no verificados con ese comportamiento, así que un Block en Search podría alcanzar a buscadores: **hipótesis**, porque la página no dice cómo clasifica a Googlebot.
- **Managed robots.txt.** https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/ (actualizada el 2 de noviembre de 2026)
  - **Qué dice:**
    - Con Bot Preference Sync y alguna política en Block o Disallow, Cloudflare antepone una Content Signals Policy y añade `Disallow: /` para GPTBot, Google-Extended, ClaudeBot, CCBot y otros.
    - Si el origen devuelve 200 con su propio robots.txt, se antepone el bloque gestionado. Si no hay archivo, se crea uno.
    - Cumplir robots.txt es voluntario.
    - No dice cómo se comporta con un robots.txt servido por Workers: **sin evidencia**.
- **Clasificación de estas fuentes:** **requisito oficial** (comportamiento) y **recomendación documentada** (AI Crawl Control como mecanismo de bloqueo real).
- **Decisión que respalda:**
  - No activar Bot Fight Mode sin probarlo, porque no admite excepciones finas y su efecto sobre los bots verificados no está documentado.
  - Si se bloquea IA, hacerlo por rastreador en AI Crawl Control (por ejemplo, bloquear GPTBot y permitir OAI-SearchBot y los buscadores), nunca con un Block general en Search.
  - Si se activa Managed robots.txt, revisar con `curl https://evelynelizondo.com/robots.txt` el archivo resultante, ya que se mezcla con el nuestro.

## 12. web.dev: Core Web Vitals

- **URL A:** https://web.dev/articles/vitals (actualizada el 31 de octubre de 2024)
- **URL B:** https://web.dev/articles/defining-core-web-vitals-thresholds (actualizada el 7 de mayo de 2025)
- **Qué dice:**

  | Métrica | Bueno | Malo |
  |---|---|---|
  | LCP | ≤ 2,5 s | > 4 s |
  | INP | ≤ 200 ms | > 500 ms |
  | CLS | ≤ 0,1 | > 0,25 |

  - Entre esos dos extremos está «necesita mejorar».
  - Se mide en el **percentil 75** de las cargas, por separado en móvil y en escritorio. El percentil 75 equilibra cubrir la mayoría de las visitas con no depender de valores atípicos.
- **Clasificación:** **recomendación documentada.** Son umbrales oficiales de web.dev; su peso exacto en el ranking no se consultó.
- **Decisión que respalda:** como presupuesto de rendimiento y en las pruebas, usar LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1 en p75 móvil, y validar con datos de campo (CrUX o Search Console) cuando haya tráfico.

---

## Pendientes que no se pudieron confirmar en las fuentes oficiales

- Si `_headers` se aplica a las respuestas de `env.ASSETS.fetch` y a las 404 de `not_found_handling`.
- Cuánto dura el estado `pending` de DNSSEC.
- Si Bot Fight Mode deja pasar a los bots verificados.
- Si el endpoint *ping* de sitemaps sigue vigente (la página de sitemaps no lo menciona).
- Las cuotas diarias de IndexNow y Bing.
- Si OAI-AdsBot respeta robots.txt.
- Los nombres de campo WAF para bots verificados.
- Si un negocio jurídico sin oficina puede ser negocio de área de servicio en GBP.
