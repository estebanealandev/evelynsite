# Datos estructurados

Lo implementa `src/lib/seo/grafo.ts`, que llama `src/layouts/Base.astro`. Cada página tiene **un único** bloque JSON-LD con `@graph`. Las entidades usan `@id` estables y se citan entre sí por referencia, así ninguna entidad se declara dos veces con datos distintos.

## Identificadores

| Entidad | `@id` | Cuándo aparece |
|---|---|---|
| Sitio | `https://evelynelizondo.com/#website` | Siempre |
| Profesional (`Person`) | `https://evelynelizondo.com/#profesional` | Solo con `PUBLIC_AUTHOR_VERIFIED=true` |
| Servicio (`Service` o `LegalService`) | `https://evelynelizondo.com/#servicio-juridico` | Solo con `PUBLIC_PROFILE_APPROVED=true` |
| Página | `<canonical>#webpage` | Siempre |
| Migas | `<canonical>#breadcrumb` | Páginas con migas |
| Artículo | `<canonical>#article` | Artículos del blog |

## Tipos por página

| Página | Tipo del nodo de página | Nodos adicionales |
|---|---|---|
| Portada, áreas, guías, aviso, privacidad | `WebPage` (áreas y artículos con `about`) | `BreadcrumbList` (excepto en la portada) |
| `/sobre-evelyn` | `AboutPage` | `BreadcrumbList` |
| `/contacto`, `/agendar-consulta` | `ContactPage` | `BreadcrumbList` |
| `/blog`, `/servicios`, `/orientacion`, `/biblioteca-juridica`, categorías y etiquetas | `CollectionPage` | `BreadcrumbList` |
| `/blog/<artículo>` | `WebPage` | `Article` (`mainEntityOfPage` → página) y `BreadcrumbList` |

## Qué se declara y qué no

- **Hoy, sin aprobación**, el grafo contiene solo `WebSite`, el nodo de página, `BreadcrumbList` y, en los artículos, `Article` **sin autor**. Cuando un tipo no tiene datos confirmados, se omiten sus propiedades: no se rellenan con supuestos.
- **`Person`** solo se declara con la autoría confirmada. Admite `hasCredential` si `PUBLIC_AUTHOR_CREDENTIAL` existe y `sameAs` si `PUBLIC_AUTHOR_PROFILE_URL` existe, que debe ser un perfil real como el del directorio del Colegio. Con autoría confirmada, la persona es `author` y `publisher` de los artículos.
- **Servicio profesional.** Google define `LocalBusiness` y su subtipo `LegalService` por una ubicación física, y exige `address` ([sources.md](sources.md), §4). Por eso:
  - con `PUBLIC_CONTACT_ADDRESS`, una oficina real con atención presencial, se declara `LegalService` con dirección, logotipo y `founder`;
  - sin dirección se declara `Service` (`serviceType: Asesoría en derecho de familia`, `areaServed: Costa Rica`, `provider` → persona). Así no se inventa un establecimiento ni una sociedad: la actividad es la de una profesional.
- **Revisión.** `reviewedBy` y `lastReviewed` aparecen en el nodo de página solo cuando el frontmatter registra `revisadoPor` y `revisadoEl`.
- **Fechas.** `datePublished` es `fecha`, y `dateModified` es `actualizado` (actualización sustantiva) o, si falta, la fecha de publicación. Ya no se usa la fecha global de consulta de normas, que no indica un cambio del texto.
- **No se declaran nunca** `aggregateRating`, `review`, `award`, `sameAs` sin un perfil verificado, direcciones virtuales ni `FAQPage`. Google dejó de mostrar el resultado enriquecido de preguntas frecuentes en mayo de 2026 ([sources.md](sources.md), §4). Las preguntas frecuentes visibles se conservan porque son útiles para quien lee.
- El JSON se escapa (`<` → `<`) para que un texto no pueda cerrar el `<script>`.

## Validación

- **Automática:** `npm run seo:auditar` (JSON válido, un solo grafo, `@id` únicos, referencias resueltas, propiedades prohibidas, `WebPage.url` = canonical) y `tests/seo.spec.ts` (sin datos sin confirmar, tipos por página, migas, artículo sin autor e imagen existente).
- **Manual, pendiente:** el Rich Results Test de Google y validator.schema.org necesitan una URL accesible o el HTML pegado. Se pueden hacer con el HTML de `dist/client/` antes del lanzamiento. Esta rama no las ejecutó: no hay acceso a esas herramientas desde el entorno de trabajo. Un esquema válido no garantiza resultados enriquecidos.
