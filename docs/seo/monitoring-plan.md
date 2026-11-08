# Plan de medición y monitoreo

Fecha: 7 de noviembre de 2026. Dominio: `evelynelizondo.com` (Worker de Cloudflare). El sitio no es indexable. **No hay datos históricos**: ninguna cifra de este documento es una medición; los objetivos numéricos se fijarán después de la línea base.

## 1. Google Search Console

### Preparable antes de indexar
- Crear una **propiedad de dominio** (`evelynelizondo.com`), que cubre `www` y `https`.
- Verificación por **registro DNS TXT** en la zona de Cloudflare. El valor lo da Search Console. El registro se añade desde el panel de Cloudflare o con la CLI `cf`; la configuración de Wrangler del proyecto no gestiona registros DNS.
- Cambiar DNS requiere autorización previa del usuario (criterio vigente del despliegue). El registro TXT no afecta al sitio, al correo ni a SPF/DMARC.
- La cuenta propietaria debe ser de la responsable del sitio o quedar transferida a ella; el equipo técnico, como usuario delegado.
- Antes del lanzamiento, robots.txt permite rastrear y todas las páginas llevan `noindex` (meta y `X-Robots-Tag`): Search Console las mostrará como excluidas por `noindex`. Es lo esperado.

### Solo después de la autorización de lanzamiento
- **No** enviar el sitemap ni usar «Solicitar indexación» antes de que la responsable autorice el lanzamiento (`SEO_INDEXING_ENABLED=true` con `src/config/lanzamiento.json` completo) y las piezas estén aprobadas.
- Tras el lanzamiento: enviar `https://evelynelizondo.com/sitemap.xml`; revisar con la inspección de URL una página de cada plantilla (servicio, artículo, ficha); comprobar `robots.txt`, `canonical` y meta robots.

## 2. Bing Webmaster Tools

- Opción preferida: **importar la propiedad desde Search Console** cuando esta esté verificada.
- Alternativa: verificación por registro DNS (el asistente indica tipo y valor), con la misma autorización previa.
- Mismas reglas: sin envío de sitemap ni solicitudes de rastreo antes del lanzamiento.
- Bing alimenta también respuestas de Copilot; su informe de rendimiento es la única fuente de primera mano disponible para ese entorno.

## 3. IndexNow

- **Hoy desactivado.** El código no tiene integración IndexNow.
- Cloudflare puede emitir avisos IndexNow por su cuenta mediante **Crawler Hints** en la zona. Comprobar que esté desactivado hasta el lanzamiento; activarlo, si se decide, solo después.
- Si se activa: avisos solo ante **eventos reales** (publicación de una pieza aprobada, cambio sustantivo, retirada). No reenviar URL sin cambios ni en lote periódico.

## 4. Analítica respetuosa con la privacidad

### Lo que declara hoy la política de privacidad
`src/pages/politica-de-privacidad.astro` dice que el sitio **no utiliza herramientas de analítica, publicidad ni seguimiento**, que **no carga recursos de terceros** para mostrar sus páginas y que **no instala cookies propias**. También advierte que el alojamiento o el proxy pueden llevar registros de acceso con IP y página visitada. Cualquier medición debe ser coherente con ese texto o ir precedida de su modificación.

### Fase 1 (compatible con la política actual)
- **Search Console y Bing Webmaster Tools:** datos de búsqueda, sin código en el sitio.
- **Analítica de la zona y del Worker en Cloudflare:** métricas agregadas de peticiones del lado del servidor, sin script ni cookies en el navegador. Corresponde a los registros que la política ya menciona. No da comportamiento por página con precisión, pero sirve para tendencias de tráfico.

### Fase 2 (candidata: Cloudflare Web Analytics)
- No usa cookies ni almacenamiento local según la documentación de Cloudflare; mide páginas vistas y Core Web Vitals de forma agregada.
- **Requisitos antes de activarla:**
  1. Decisión de la responsable.
  2. Actualizar la política de privacidad: la sección «Qué se guarda en su navegador» (deja de ser cierto que no hay analítica ni recursos de terceros) y «Destinatarios y proveedores».
  3. Ajustar la Content-Security-Policy de `Base.astro` (`script-src` y `connect-src` solo permiten `'self'`): el script y el envío de datos de Web Analytics quedarían bloqueados. Alternativa: servir el script desde el propio dominio si Cloudflare lo permite en el modo elegido.
  4. Valorar la exclusión de páginas sensibles (`/servicios/proteccion-familiar` y el artículo de medidas de protección) o, al menos, documentar que se miden.
- No se instalan Google Analytics, píxeles publicitarios ni grabación de sesiones.

### Conversiones
- El formulario está en `MAIL_MODE=disabled`. Cuando se active, la única métrica es el **recuento** de solicitudes recibidas por mes y por tipo de asunto (campo `consultaTipos`), contado por la responsable a partir del buzón. No se registra contenido ni se cruza con datos de navegación.

## 5. KPI

Sin línea base. Se mide durante las primeras **4 a 8 semanas tras la indexación** y después se fijan objetivos.

| KPI | Fuente | Para qué |
|---|---|---|
| Piezas indexadas / piezas aprobadas | Search Console (indexación) | Detectar piezas aprobadas sin indexar y no aprobadas indexadas (esto último no debe ocurrir) |
| Impresiones y clics por clúster (servicio + satélites + ficha) | Search Console, filtro por URL | Ver qué áreas tienen demanda real; sustituir hipótesis de `keyword-research.md` |
| CTR por página y consulta | Search Console | Revisar títulos y descripciones |
| Consultas con dos URL propias alternándose | Search Console (consulta → páginas) | Detectar canibalización real |
| Consultas nuevas sin página dueña | Search Console | Alimentar el backlog de `content-strategy.md` |
| Errores de rastreo, 404 y redirecciones | Search Console, Bing | Salud técnica, sobre todo tras cambios de slug |
| Core Web Vitals | Search Console (si hay datos de CrUX) o Web Analytics en fase 2 | Rendimiento real; un sitio pequeño puede no tener datos de campo |
| Solicitudes de consulta por mes y tipo | Buzón de la responsable | Única conversión |
| Registro GEO (aparición, exactitud) | `geo-aeo-strategy.md`, sección 6 | Exactitud de lo que se atribuye al sitio |

No se reportan posiciones medias como objetivo ni se prometen posiciones.

## 6. Cadencia

| Frecuencia | Tarea |
|---|---|
| Semanal | `npm run normas:vigilar` (ya previsto en la guía editorial). Primer mes tras el lanzamiento: revisión de indexación y errores en Search Console |
| Mensual | Rendimiento por clúster, CTR, canibalización; registro GEO de las 15 consultas; recuento de solicitudes |
| Trimestral | Lectura editorial de lo publicado; actualización de `keyword-research.md` con consultas reales; repriorización del backlog |
| Por evento | Reforma normativa: revisar piezas afectadas y volverlas a `pendiente` si cambia el fondo. Cambio de slug: 301 y comprobación en Search Console. Cambio de NAP: actualizar `site.ts` y perfiles el mismo día |

## 7. Lista previa al lanzamiento (medición)

- [ ] Propiedad de dominio verificada en Search Console (TXT autorizado).
- [ ] Bing Webmaster Tools importado o verificado.
- [ ] Crawler Hints y controles de bots de IA de la zona revisados y documentados.
- [ ] Decisión sobre analítica tomada; política de privacidad y CSP coherentes con ella.
- [ ] Comprobado en la compilación de producción que las piezas `pendiente` salen con `noindex` y fuera del sitemap (lógica ya en `src/config/indexacion.mjs` y `src/pages/sitemap.xml.ts`).
- [ ] Autorización expresa de lanzamiento; solo entonces sitemap e inspección de URL.
