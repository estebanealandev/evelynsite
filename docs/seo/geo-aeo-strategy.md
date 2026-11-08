# Estrategia para búsqueda generativa y motores de respuesta (GEO/AEO)

Fecha: 7 de noviembre de 2026. Alcance: cómo debe estar escrito y servido el contenido para que buscadores con respuestas generadas (Google con AI Overviews o AI Mode, Bing y Copilot, ChatGPT search, Perplexity y similares) puedan entenderlo y citarlo con exactitud. **No se promete aparición ni citas**: ningún proveedor ofrece un mecanismo para garantizarlas, y su comportamiento cambia sin aviso.

## 1. Principios

1. **Contenido en el HTML inicial.** El texto, las preguntas frecuentes y las fuentes deben estar en la respuesta del servidor, sin depender de JavaScript. El sitio es estático (`output: 'static'`), así que esto ya se cumple.
2. **Respuesta breve primero.** Cada página empieza por la respuesta en una o dos frases y después desarrolla condiciones y excepciones (regla «primero la respuesta» de la guía editorial).
3. **Jurisdicción explícita.** Cada respuesta dice que se refiere a Costa Rica y nombra la norma (ley y número). Un motor que mezcla fuentes de varios países necesita esa señal en el propio párrafo, no solo en el título.
4. **Fuentes visibles.** Enlaces a la copia oficial (SINALEVI/SCIJ) junto a la afirmación o al pie, con el nombre completo de la norma.
5. **Fechas de revisión.** Fecha en que se contrastó la normativa, visible y en los datos estructurados (`dateModified`).
6. **Autoría verificada solo cuando esté aprobada.** Persona, credencial y perfil se declaran únicamente con `PUBLIC_AUTHOR_VERIFIED=true` y datos confirmados por la profesional; mientras tanto, el autor es la organización.
7. **Una pregunta, una URL.** Las canibalizaciones (ver `content-strategy.md`) también confunden a los sistemas que eligen qué fragmento citar.

## 2. Qué ya hace el sitio

| Elemento | Dónde | Estado |
|---|---|---|
| Sección «En breve» al inicio de cada servicio | `src/pages/servicios/[slug].astro`, `#en-breve` | Implementado |
| Sección «¿Qué dice la ley?» con ítems título/resumen/detalle | mismo archivo, `#que-dice-la-ley` | Implementado; buen formato para extracción |
| Preguntas frecuentes en `<details>`/`<summary>` | servicios, `#preguntas` | Implementado; el contenido plegado está en el HTML y es legible por rastreadores |
| Fuentes normativas con enlace a SINALEVI y fecha de consulta | servicios, artículos y fichas | Implementado; la fecha visible es `site.legalVerifiedAt` (global) |
| Índice de contenidos con anclas | servicios y artículos | Implementado |
| Grafo de datos estructurados único | `src/lib/seo/grafo.ts`, usado por `Base.astro` | El servicio profesional solo se declara con `PUBLIC_PROFILE_APPROVED=true` (`LegalService` con oficina, `Service` sin ella), con `areaServed: Costa Rica` |
| `BreadcrumbList` | grafo | Implementado |
| `Article` con `dateModified` desde `actualizado`; autor `Person` solo con `PUBLIC_AUTHOR_VERIFIED=true`; `reviewedBy`/`lastReviewed` solo con revisor y fecha | `src/pages/blog/[slug].astro`, grafo | Implementado |
| `lang="es-CR"`, `og:locale es_CR`, `inLanguage: es-CR` | `Base.astro`, artículos | Implementado |
| Artículos que abren con la respuesta | p. ej. `divorcio-mutuo-consentimiento-costa-rica` («Firmar el convenio de divorcio no disuelve el matrimonio…») | Mayoritario; revisar caso por caso |
| Biblioteca jurídica con cada norma, su fuente y sus reformas | `/biblioteca-juridica`, `src/lib/biblioteca.ts` | Implementado |

No hay `FAQPage` en los datos estructurados. Se recomienda **no añadirlo** con fines de resultados enriquecidos: Google los restringió en 2023 a sitios gubernamentales y de salud con autoridad reconocida. El contenido ya es accesible en HTML.

## 3. Mejoras propuestas (no aplicadas)

1. **Resumen visible en artículos.** El campo `resumen` de `articulos` no se muestra en la página del artículo (el `PageHero` recibe solo el título). Mostrarlo como entrada bajo el H1 da a cada artículo su «respuesta breve».
2. **Fecha de revisión por pieza visible.** El esquema ya tiene `actualizado` y `revisadoEl`, y `dateModified` usa `actualizado`. Falta: (a) rellenar esos campos en el frontmatter (hoy ninguna pieza los tiene); (b) mostrar en el pie de fuentes la fecha de la pieza en lugar de `site.legalVerifiedAt`, para que lo visible y lo declarado coincidan.
3. **Jurisdicción en la primera frase.** Revisar que la primera frase de cada «En breve» y de cada artículo mencione Costa Rica o la norma costarricense.
4. **Enlace por pregunta frecuente.** Permitir que una FAQ remita a su satélite (ver `content-strategy.md`, sección 1).
5. **Anclas estables para FAQ.** Dar `id` a cada `<details>` para poder enlazar a una respuesta concreta.
6. **Autoría.** Cuando se confirme, una página de perfil con nombre profesional, credencial verificable (p. ej. número de carné, solo si la profesional autoriza publicarlo) y enlace `sameAs` al registro oficial que lo acredite. Hasta entonces, nada.
7. **Indexación por pieza.** Ya condicionada a `revisionProfesional: aprobada` en el árbol de trabajo (ver `content-strategy.md`, sección 6). Comprobarla en cada lanzamiento: un motor que cita una pieza no revisada amplifica el riesgo.

## 4. Política de rastreadores

### Estado actual (no se cambia nada)
Según `src/lib/seo/robots.mjs` en el árbol de trabajo:
- **Antes del lanzamiento:** `User-agent: *` con `Allow: /` y `Disallow: /api/`, para que los buscadores puedan leer el `noindex` (meta robots y `X-Robots-Tag`); `OAI-SearchBot` y `PerplexityBot` con `Disallow: /`; sin `Sitemap`.
- **Después:** todo permitido salvo `/api/`, con `Sitemap`.
- **Entrenamiento:** constante `ENTRENAMIENTO = 'bloquear'` para `GPTBot`, `Google-Extended`, `Applebot-Extended`, `ClaudeBot`, `CCBot`, `meta-externalagent` y `Bytespider`. Es un valor provisional que conserva el bloqueo mientras la responsable no decida; no es la decisión.
- Cloudflare ofrece en la zona controles propios sobre rastreadores de IA (bloqueo de bots de IA, robots.txt gestionado, señales de contenido). **Antes del lanzamiento, comprobar en el panel qué está activo**, porque un robots.txt gestionado puede añadir directivas al que genera el sitio. No modificar nada sin decisión de la responsable.

### Búsqueda y entrenamiento son decisiones independientes

| Agente / token | Proveedor | Uso declarado | Propuesta |
|---|---|---|---|
| Googlebot | Google | Búsqueda, incluidas las respuestas generadas en Search | Permitido (lee el `noindex` antes del lanzamiento) |
| Google-Extended (token, no rastreador) | Google | Uso para entrenamiento y fundamentación de Gemini fuera de Search; no afecta a Search | Decisión de la responsable (hoy bloqueado de forma provisional) |
| Bingbot | Microsoft | Búsqueda de Bing y respuestas de Copilot | Permitido (igual que Googlebot) |
| OAI-SearchBot | OpenAI | Resultados de búsqueda de ChatGPT | Permitir al lanzar si se quiere aparecer en ChatGPT search |
| GPTBot | OpenAI | Entrenamiento de modelos | Decisión de la responsable (hoy bloqueado de forma provisional) |
| ChatGPT-User | OpenAI | Visitas iniciadas por una persona usuaria | Verificar en la documentación vigente cómo trata robots.txt |
| PerplexityBot / Perplexity-User | Perplexity | Índice de búsqueda / visitas iniciadas por usuarios | Igual que OAI-SearchBot / ChatGPT-User |
| Claude-SearchBot / ClaudeBot / Claude-User | Anthropic | Búsqueda / entrenamiento / visitas iniciadas por usuarios | Igual criterio: búsqueda separada de entrenamiento |
| Applebot / Applebot-Extended (token) | Apple | Búsqueda en productos de Apple / uso para entrenamiento | Igual criterio |
| CCBot | Common Crawl | Corpus abierto reutilizado por terceros, también para entrenamiento | Decisión de la responsable |

- **Permitir búsqueda no obliga a permitir entrenamiento**, y bloquear entrenamiento no excluye de la búsqueda en los proveedores que separan agentes.
- **La decisión sobre entrenamiento corresponde a la responsable del sitio.** El equipo técnico solo la ejecuta y la documenta.
- Los nombres y el alcance de cada agente se verifican en la documentación oficial del proveedor el día en que se tome la decisión; esta tabla no sustituye esa verificación.
- Las reglas son de cumplimiento voluntario. Si se quiere un bloqueo efectivo, se hace además con reglas de la zona en Cloudflare.

## 5. llms.txt

**No se crea.** Google ha indicado que no lo usa y no lo necesita para Search ni para sus funciones de IA, y no hay evidencia pública de que mejore la aparición o la exactitud de citas en otros sistemas. El sitio ya expone su estructura con HTML semántico, sitemap y datos estructurados. Se revisará si algún proveedor relevante documenta su uso.

## 6. Monitoreo GEO después del lanzamiento

### Condiciones
- Empieza cuando el sitio sea indexable y haya pasado un plazo razonable de rastreo (orientativo: cuatro a ocho semanas). Antes puede hacerse una **línea base** de qué fuentes citan hoy los motores para estas consultas, sin esperar aparición del dominio.
- **Manual.** No se automatizan consultas en plataformas cuyas condiciones de uso lo prohíben (raspado de resultados, cuentas automatizadas). Si una plataforma ofrece una API con condiciones que lo permitan, se evalúa aparte.
- Mensual, misma persona o mismo protocolo: navegador sin sesión o con sesión indicada en el registro, región Costa Rica, idioma español.
- Los resultados generados varían entre ejecuciones. Una aparición aislada no es una tendencia; se registran hechos, no se extrapolan.

### Consultas representativas (15)

| # | Consulta | Página que debería responder |
|---|---|---|
| 1 | ¿Cómo me divorcio en Costa Rica si mi cónyuge no quiere firmar? | `/blog/diferencias-divorcio-consensuado-contencioso` |
| 2 | ¿Cuánto tarda un divorcio por mutuo consentimiento en Costa Rica? | `/servicios/divorcios` |
| 3 | ¿Cómo se pone una pensión alimentaria en Costa Rica? | `/blog/como-se-establece-pension-alimentaria` |
| 4 | ¿Qué pasa si no pago la pensión alimentaria en Costa Rica? | `/servicios/pensiones-alimentarias` |
| 5 | ¿La pensión alimentaria aumenta sola en Costa Rica? | `/blog/aumento-rebajo-pension-alimentaria` |
| 6 | ¿Qué significa guarda, crianza y educación en Costa Rica? | `/servicios/guarda-crianza` |
| 7 | ¿La custodia compartida es obligatoria en Costa Rica? | `/servicios/guarda-crianza` |
| 8 | ¿Qué hago si no se cumple el régimen de interrelación familiar? | `/blog/regimen-interrelacion-familiar` |
| 9 | ¿Qué bienes no son gananciales en Costa Rica? | `/servicios/bienes-gananciales` |
| 10 | ¿Cuánto tiempo hay para pedir el reconocimiento de una unión de hecho en Costa Rica? | `/blog/union-de-hecho-efectos-legales` |
| 11 | ¿Hasta cuándo se puede impugnar la paternidad en Costa Rica? | `/blog/procedimientos-filiacion-paternidad` |
| 12 | ¿Cómo pido medidas de protección por violencia doméstica en Costa Rica? | `/servicios/proteccion-familiar` |
| 13 | ¿Qué cambió con el Código Procesal de Familia? | `/blog/cambios-codigo-procesal-familia` |
| 14 | ¿Se puede conciliar en un proceso de familia en Costa Rica? | `/blog/acuerdos-familiares-solucion-conflictos` |
| 15 | Evelyn Elizondo abogada de familia | `/` y `/sobre-evelyn` |

Si se cambian slugs (ver `content-strategy.md`, 2.5), se actualiza esta columna.

### Plantilla de registro

Una fila por consulta, plataforma y fecha. Se guarda en una hoja de cálculo o CSV fuera del repositorio público si contiene capturas.

| Campo | Contenido |
|---|---|
| Plataforma | Google (AI Overview / AI Mode), Bing Copilot, ChatGPT search, Perplexity, otra |
| Fecha | AAAA-MM-DD |
| Región | País e idioma configurados; con o sin sesión |
| Consulta | Texto exacto |
| Fuentes citadas | Dominios citados, en orden |
| Aparición del dominio | Sí / No |
| URL | URL del sitio citada, si aparece |
| Exactitud | Correcta / imprecisa / incorrecta / no aplica, respecto de lo que dice la página y la norma |
| Observaciones | Afirmaciones erróneas atribuidas al sitio, mezcla con derecho de otro país, datos desactualizados |

Una respuesta que atribuya al sitio una afirmación jurídica incorrecta se comunica a la responsable de revisión; si el origen está en el texto del sitio, la pieza vuelve a `revisionProfesional: pendiente`.
