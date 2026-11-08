# Informe de implementación SEO, GEO y AEO

- **Fecha:** 2026-11-07
- **Rama:** `seo/geo-enterprise-2026`, derivada de `identidad/doble` en `05e689a`. Ese commit sigue igual y sin push.
- **Sin cambios en:** `main`, producción, Cloudflare, DNS, el registrador, Search Console y Bing.
- **Sin acciones externas:** no se envió el sitemap ni se hizo ningún envío a buscadores, y el `noindex` sigue vigente.

## Resumen ejecutivo

El sitio queda preparado técnicamente para indexarse, y **sigue sin poder indexarse** hasta que se cumplan y registren los requisitos de lanzamiento. Lo principal:

1. **La indexación no se activa por accidente.** Una política única (`src/config/indexacion.mjs`) exige cuatro condiciones a la vez:
   - la petición expresa con `SEO_INDEXING_ENABLED=true`;
   - el entorno de producción;
   - el dominio real;
   - ocho requisitos firmados en `src/config/lanzamiento.json`.

   Si falta algo, la compilación falla. El despliegue verifica la coherencia de lo compilado antes de subirlo. Lo cubren las pruebas de `tests/indexacion.spec.ts`.
2. **El `noindex` ya puede leerse.** `robots.txt` dejó de bloquear todo, y `X-Robots-Tag` acompaña a cada respuesta con el mismo valor que la meta robots, derivado del HTML compilado.
3. **El contenido jurídico sin aprobar queda fuera** aunque se autorice el lanzamiento. Cada pieza necesita `revisionProfesional: aprobada` con revisor y fecha, y el esquema rechaza una aprobación sin esos datos.
4. **Un grafo JSON-LD único y veraz:** sin persona, servicio, contacto ni dirección mientras no estén aprobados, y sin `LocalBusiness` ni `LegalService` sin oficina real.
5. **Auditoría reproducible** (`npm run seo:auditar`), con 0 errores críticos en la compilación de producción.

## Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/config/indexacion.mjs` (nuevo) | Política de indexación: entornos, requisitos, validación de aprobaciones y robots por página |
| `src/config/lanzamiento.json` (nuevo) | Registro de requisitos, todos en `pendiente`, con la evidencia conocida (formulario, DNSSEC) |
| `astro.config.mjs` | Resuelve la política, deriva `PUBLIC_SITE_READY`, escribe `dist/robots-compilados.json` y añade `X-Robots-Tag` a `_headers`, con agrupación y límite de 100 reglas |
| `src/lib/seo/robots.mjs` (nuevo), `src/pages/robots.txt.ts` | `robots.txt` por estado: rastreo permitido, `/api/` excluida, búsqueda con IA bloqueada antes del lanzamiento, entrenamiento bloqueado y sitemap solo al lanzar |
| `src/lib/seo/cabeceras-robots.mjs` (nuevo) | Agrupa las páginas excluidas en reglas `/carpeta/*` sin alcanzar páginas indexables |
| `src/middleware.ts`, `scripts/servidor.mjs` | `X-Robots-Tag` en las respuestas del Worker y del servidor Node. Node redirige `/ruta/` → `/ruta` con 301 |
| `src/lib/seo/grafo.ts` (nuevo), `src/layouts/Base.astro` | Grafo `@graph` con `@id` estables, tipos de página, migas, `about` y revisión. Además: title con marca solo si cabe, `og:image:alt` por página, `article:*_time` y JSON escapado |
| `src/config/site.ts` | `perfil.aprobado` (`PUBLIC_PROFILE_APPROVED`) y `entorno` |
| `src/content.config.ts` | `revisadoPor`, `revisadoEl` y `actualizado`. Una aprobación sin revisor rompe la compilación |
| `src/pages/sitemap.xml.ts` | Solo URL elegibles al lanzar y `lastmod` de fechas reales |
| `src/pages/servicios/[slug].astro` | Artículos ordenados por tema principal, sin artículos ajenos en la página de violencia, y enlaces a las guías |
| `src/pages/blog/[slug].astro` | `Article` con fechas reales, imagen social propia y sin autor sin confirmar |
| `src/pages/blog/categoria/[slug].astro`, `ArchiveList.astro` | Las categorías con un solo artículo quedan en `noindex` |
| Las demás plantillas de páginas | Tipo de página (`AboutPage`, `ContactPage`, `CollectionPage`) y revisión |
| `public/assets/og/` (nuevo) | 24 imágenes sociales JPEG de 1200 × 630 (`npm run seo:imagenes`) |
| `scripts/seo/` (nuevo) | `auditar`, `verificar-lanzamiento`, `verificar-dnssec`, `verificar-produccion`, `medir-vitals` e `imagenes-sociales` |
| `ops/cloudflare/regla-barra-final.json` (nuevo) | Regla de zona con 301 para la barra final. Se aplicó con autorización tras el despliegue |
| `package.json` | `build:cf` con `SITE_ENV=production`, `deploy` con verificación previa y scripts `seo:*` |
| `tests/seo.spec.ts`, `tests/indexacion.spec.ts` (nuevos) | Ver [technical-audit.md](technical-audit.md), §4 |
| `tests/sitio.spec.ts`, `tests/contenido.spec.ts` | Adaptadas: `robots.txt` ya no bloquea todo, el grafo es único, el rastreo de enlaces usa todas las rutas y las guías pendientes no están en el sitemap |
| `README.md`, `docs/auditoria-evelyn/decisiones.md` | Variables nuevas, comandos SEO y cinco decisiones registradas |
| `docs/seo/` (nuevo) | Doce documentos (ver abajo) |

No se suprimió ni se debilitó ninguna prueba. Las tres aserciones que cambiaron comprobaban el comportamiento anterior, que ahora es incorrecto: `Disallow: /`, `LegalService` sin aprobación y las guías pendientes en el sitemap. Su sustituto es más estricto.

## Pruebas y resultados

| Verificación | Resultado |
|---|---|
| `astro check` | 0 errores, 0 avisos |
| Playwright, servidor Node (escritorio y móvil) | 403 pasadas, 47 omitidas (las que solo aplican a otro modo), 0 fallidas |
| Playwright, `wrangler dev` con la compilación de Workers (`npm run test:cf`) | 400 pasadas, 44 omitidas, 0 fallidas |
| `npm run seo:auditar` sobre `build:cf` | 91 páginas, 0 críticos, 15 URL en el sitemap |
| `verificar-lanzamiento --compilacion` | Compilación coherente: production, no indexable, `_headers` con `X-Robots-Tag` |
| Petición de indexar sin requisitos | La compilación falla con la lista de los 9 pendientes |
| `SITE_ENV=staging` con la bandera | La compilación falla: «solo production puede indexarse» |
| `revisionProfesional: aprobada` sin revisor | La compilación falla (`InvalidContentEntryDataError`) |
| `npm run seo:dnssec` | DS ausente en `.com` y AD=false: **DNSSEC no validado todavía** |
| `npm run seo:produccion` (versión publicada, `05e689a`) | Se reproducen los hallazgos C1, C2 e I4. Se corrigen al desplegar esta rama |
| `medir-vitals` (producción, móvil limitado) | LCP 0,7-1,3 s y CLS ≤ 0,066 en laboratorio (ver [core-web-vitals.md](core-web-vitals.md)) |

## Despliegue (2026-11-07, autorizado por el usuario)

- Se ejecutó `npm run deploy`: verificación, auditoría y despliegue. Versión del Worker: `5d023ca4-775d-48bc-9f7b-fca10334fe65`.
- Se añadió la regla de zona 301 de barra final (ruleset de redirecciones, versión 2), conservando la regla `www`.
- `npm run seo:produccion` da «Sin problemas»:
  - `noindex, nofollow` en la meta y en `X-Robots-Tag` en todas las páginas comprobadas;
  - `robots.txt` deja rastrear y no anuncia el sitemap;
  - `http`, `www`, `/home` y la barra final responden con 301.
- Sigue sin push, y `main` no se tocó.

## Qué **no** se hizo, y por qué

| Acción | Motivo |
|---|---|
| Quitar `noindex`, enviar el sitemap, usar IndexNow o verificar en GSC o Bing | Están prohibidos hasta el lanzamiento autorizado |
| Activar el correo del formulario | Falta la dirección real de Evelyn |
| Validar con el Rich Results Test y validator.schema.org | No hay acceso desde este entorno. Queda como paso manual, con las validaciones automáticas en su lugar |
| Datos de volumen y dificultad de palabras clave | Sin acceso a herramientas. El mapa es cualitativo y lo declara así |
| Crear `llms.txt` | No lo exige Google y no hay evidencia de que aporte algo ([geo-aeo-strategy.md](geo-aeo-strategy.md)) |
| Analítica | La política de privacidad declara que no hay. Activarla exige cambiar antes esa política y la CSP |
| Redactar artículos nuevos | Los briefs están en [content-strategy.md](content-strategy.md). La redacción necesita fuentes verificadas y revisión profesional |
| Leer Bot Fight Mode | La CLI no lo expone. Hay que comprobarlo en el panel antes del lanzamiento |

## Pendientes que bloquean el lanzamiento

Ver [indexation-release-checklist.md](indexation-release-checklist.md):

- la aprobación de Evelyn;
- la revisión jurídica de las 27 piezas;
- los datos profesionales y de contacto;
- la dirección real para el formulario y su prueba;
- la política de privacidad completa;
- el DS de DNSSEC publicado y validado;
- las pruebas SEO sobre la compilación final.

## Documentación

| Documento | Contenido |
|---|---|
| [technical-audit.md](technical-audit.md) | Auditoría inicial y final |
| [inventario-rutas.md](inventario-rutas.md) | Las 91 rutas con su estado (generado) |
| [keyword-research.md](keyword-research.md) | Mapa cualitativo de intención y canibalizaciones |
| [content-strategy.md](content-strategy.md) | Pilar-clúster, 14 briefs y flujo editorial |
| [geo-aeo-strategy.md](geo-aeo-strategy.md) | Búsqueda generativa, política de crawlers y monitoreo GEO |
| [structured-data.md](structured-data.md) | Grafo, tipos y reglas de veracidad |
| [local-seo.md](local-seo.md) | Datos NAP, Google Business Profile y citaciones |
| [core-web-vitals.md](core-web-vitals.md) | Medición de laboratorio y riesgos |
| [cloudflare-seo.md](cloudflare-seo.md) | Cabeceras, caché, redirecciones, bots y DNSSEC |
| [indexation-release-checklist.md](indexation-release-checklist.md) | Requisitos y procedimiento de lanzamiento |
| [monitoring-plan.md](monitoring-plan.md) | Search Console, Bing, IndexNow y KPI |
| [sources.md](sources.md) | Fuentes oficiales consultadas el 2026-11-07 |
