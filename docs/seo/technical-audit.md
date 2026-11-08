# Auditoría técnica SEO

Fecha: 2026-11-07. Rama: `seo/geo-enterprise-2026`, a partir de `identidad/doble` en `05e689a`. Ese commit sigue sin push, y `main` no se tocó.

El inventario completo de rutas, con su title, robots, schema, profundidad, enlaces entrantes y estado previsto, está en [inventario-rutas.md](inventario-rutas.md). Lo genera `npm run seo:inventario`.

## 1. Estado del proyecto

| Aspecto | Estado verificado |
|---|---|
| Framework | Astro 7.4.5, `output: 'static'`, con `@astrojs/cloudflare` 14 para Workers y `@astrojs/node` para las pruebas |
| Renderización | Todo prerenderizado (SSG). El único código del Worker es `/api/consulta`. Títulos, textos, enlaces, metadatos y JSON-LD están en el HTML inicial |
| JavaScript | `site.js` hace mejora progresiva. El árbol 3D de la portada (three.js, 526 KB) se carga aparte con `import()` y no bloquea el contenido |
| Despliegue | Worker `evelyn-elizondo` con Static Assets y dominio propio `evelynelizondo.com`. Sin workers.dev y sin URL de vista previa |
| Contenido | 9 áreas, 15 artículos y 3 guías, todos con `revisionProfesional: pendiente` |
| Formulario | `MAIL_MODE=disabled`: responde 503 honesto. Sin destinatario real |
| Analítica | Ninguna. La CSP y la política de privacidad lo declaran así |
| Rutas compiladas | 91 HTML, de las cuales 52 son etiquetas del blog |

## 2. Hallazgos iniciales (producción, 2026-11-07, antes de esta rama)

Se verificaron con `curl` y con `npm run seo:produccion` sobre el sitio publicado.

| # | Gravedad | Hallazgo | Evidencia | Estado en esta rama |
|---|---|---|---|---|
| C1 | Crítico | `robots.txt` con `Disallow: /` para todos. Google no puede leer el `noindex` y una URL enlazada desde fuera puede quedar indexada sin contenido | `curl https://evelynelizondo.com/robots.txt` | Corregido: `Allow: /` para buscadores y `Disallow: /api/` |
| C2 | Crítico | Ninguna respuesta lleva `X-Robots-Tag`. El `noindex` depende solo del HTML, y las imágenes y el sitemap no lo tienen | `curl -I` en `/` y en recursos | Corregido: `X-Robots-Tag: noindex, nofollow` en `_headers` (`/*`), en el middleware y en el servidor Node |
| C3 | Crítico | La indexación dependía de una sola variable (`PUBLIC_SITE_READY=true`), sin requisitos documentados | `src/config/site.ts` | Corregido: política centralizada con requisitos firmados (ver [indexation-release-checklist.md](indexation-release-checklist.md)) |
| I1 | Importante | El sitemap listaba 46 URL, contenido jurídico sin aprobar incluido, sin `lastmod` | `sitemap.xml.ts` | Corregido: solo URL elegibles al lanzar, con `lastmod` cuando hay una fecha real |
| I2 | Importante | JSON-LD en bloques sueltos. Declaraba `LegalService`, un establecimiento, sin dirección, con datos profesionales sin confirmar | `Base.astro` | Corregido: un grafo `@graph` con `@id` estables, y servicio y persona solo con aprobación |
| I3 | Importante | `Article.dateModified` usaba la fecha de consulta de las normas, no la de actualización del texto | `blog/[slug].astro` | Corregido: `actualizado` en el frontmatter o la fecha de publicación |
| I4 | Importante | `/servicios/` responde 307 (temporal) hacia `/servicios` | `html_handling: drop-trailing-slash` | Corregido: 301 en Node y regla de zona 301 en Cloudflare, aplicada el 2026-11-07 con autorización |
| I5 | Importante | Las áreas enlazaban sus 3 primeros artículos en orden alfabético: «Divorcios» no enlazaba sus dos artículos de divorcio | `servicios/[slug].astro` | Corregido: prioridad al tema principal y a la categoría |
| I6 | Importante | Solo se llegaba a las guías desde `/orientacion` | Rastreo interno | Corregido: «Guías por situación» en cada área relacionada |
| I7 | Importante | El registro DS de DNSSEC no está en `.com` | `npm run seo:dnssec` | Pendiente del registrador. No se modificó nada |
| M1 | Menor | Imagen social en WebP (1400 × 600) en los artículos, y la genérica en las áreas | `og:image` | Corregido: JPEG de 1200 × 630 por área y por artículo (`npm run seo:imagenes`) |
| M2 | Menor | Titles de 72 a 86 caracteres por el sufijo de marca | Auditoría | Corregido: la marca se añade solo si el título cabe en 65 |
| M3 | Menor | Categorías con un único artículo, indexables y en el sitemap: duplican el artículo | Inventario | Corregido: `noindex` y fuera del sitemap mientras tengan menos de 2 |
| M4 | Menor | `/Servicios` (con mayúscula) devuelve 404 | `curl` | Se acepta: ningún enlace usa mayúsculas. Regla opcional documentada |
| M5 | Menor | 5 descripciones de 166 a 170 caracteres | Auditoría | Aviso. Se recortan en la revisión editorial |
| O1 | Opcional | Hay 5 slugs de artículo que nombran el tema y no la pregunta | [content-strategy.md](content-strategy.md) | Recomendación. Si se cambian, que sea antes de indexar y con 301 |

Comprobaciones sin hallazgos:

- `http→https` y `www→raíz` responden 301 y conservan la ruta y los parámetros.
- `/home` responde 301.
- Los parámetros `utm_*` no alteran el canonical.
- Las URL de la 404 y de la API devuelven 404.
- No hay recursos externos ni textos residuales de la plantilla original (California, Emily Rubenstein).
- No hay errores de consola: los cubre `tests/sitio.spec.ts`.

## 3. Auditoría final (compilación de esta rama)

Resultado de `npm run seo:auditar` sobre `npm run build:cf`:

- 91 páginas y 0 errores críticos.
- 15 URL en el sitemap: las 10 institucionales y las 5 categorías con 2 artículos o más. Las 27 piezas jurídicas entrarán cuando se aprueben.
- Todas las páginas llevan `noindex, nofollow` en la meta y en `X-Robots-Tag`, con el mismo valor.
- Canonical absoluto y autorreferencial en todas. Un único grafo JSON-LD por página, sin `@id` duplicados ni referencias rotas.
- Avisos que siguen: 3 descripciones de más de 165 caracteres, el chunk de three.js (carga diferida) y la 404 sin enlaces entrantes, que es lo esperado.

## 4. Comprobaciones automatizadas añadidas

| Comando | Qué verifica |
|---|---|
| `npm run seo:auditar` | Titles y descriptions duplicados, H1, canonical, robots, coincidencia entre meta y directiva compilada, `og:image` existente, JSON-LD (grafo único, `@id`, referencias, propiedades prohibidas), enlaces y recursos rotos, recursos externos, huérfanas, textos residuales, sitemap (canónicas, excluidas, contenido pendiente, `lastmod` futuro) y peso de los recursos |
| `tests/seo.spec.ts` | Contra el servidor (Node o `wrangler dev`): meta igual a `X-Robots-Tag` en cada ruta, 404 y recursos con `noindex`, `robots.txt`, sitemap, grafo, tipos de página, migas, canonical con parámetros, redirecciones y Open Graph |
| `tests/indexacion.spec.ts` | La política: sin bandera nunca se indexa; staging, preview o development no indexan; otro dominio tampoco; aprobaciones sin evidencia o con fecha futura se rechazan. También el `robots.txt` antes y después del lanzamiento y que la agrupación de `_headers` nunca alcance una página indexable |
| `npm run seo:lanzamiento` | Estado de cada requisito de lanzamiento |
| `npm run deploy` | Ahora compila, verifica la coherencia de `dist/` con la política, audita y solo entonces despliega |
| `npm run seo:produccion` | Solo lectura sobre el sitio publicado: redirecciones, meta y cabecera, canonical, `robots.txt` y sitemap |
| `npm run seo:dnssec` | DS en el padre, coincidencia con DNSKEY y bandera AD en 1.1.1.1 y 8.8.8.8 |

El repositorio no tiene CI ni remoto. Estos comandos están listos para un flujo de CI cuando exista. No se añadió ninguno para no imponer una plataforma.
