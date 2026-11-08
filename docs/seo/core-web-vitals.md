# Core Web Vitals y rendimiento

## Objetivos

Son los umbrales oficiales, evaluados en datos de campo al percentil 75 ([sources.md](sources.md), §12):

- LCP ≤ 2,5 s
- INP ≤ 200 ms
- CLS ≤ 0,1

El sitio todavía no tiene datos de campo. CrUX necesita tráfico suficiente, y el sitio está en `noindex` y sin visitas, así que **no se puede afirmar el resultado real**. Lo que sigue son mediciones de laboratorio.

## Medición de laboratorio (2026-11-07)

Se usó `node scripts/seo/medir-vitals.mjs` sobre la producción publicada (`05e689a`). Condiciones: Chrome con un Pixel 7 emulado, 150 ms de RTT, 1,6 Mbps de bajada, CPU 4 veces más lenta y sin caché. Cada valor es la mediana de 3 cargas. La red fue la conexión residencial del equipo de trabajo hacia el borde de Cloudflare.

| Ruta | TTFB | LCP | CLS | TBT (aprox.) | Transferido |
|---|---|---|---|---|---|
| `/` | 230 ms | 1112 ms | 0,066 | 530 ms | 275 KB |
| `/servicios/divorcios` | 229 ms | 964 ms | 0 | 114 ms | 79 KB |
| `/blog/divorcio-mutuo-consentimiento-costa-rica` | 227 ms | 1256 ms | 0 | 25 ms | 158 KB |
| `/agendar-consulta` | 225 ms | 716 ms | 0 | 0 ms | 76 KB |

Lectura:

- En laboratorio, LCP y CLS están dentro del objetivo en las cuatro rutas.
- INP no se mide sin interacciones reales. El TBT es su mejor indicio de laboratorio.
- En la portada, el TBT de 530 ms se atribuye, por lo que solo se carga ahí, a la carga diferida de three.js (526 KB; 130 KB con gzip) y a la construcción del árbol 3D. Ocurre después del LCP (el título y el póster ya están pintados), pero un toque durante esa ventana podría responder tarde. Es el único riesgo identificado para INP.
- Una página de Lighthouse no equivale a la experiencia de las personas usuarias. Los valores deben confirmarse con datos de campo tras el lanzamiento.

## Lo que ya hace el sitio

- Contenido y metadatos en el HTML estático, CSS en archivos con hash e inmutables y un único script en línea medido por hash en la CSP.
- Fuente Schibsted Grotesk en WOFF2 local con `preload`. Marcellus solo en el logotipo, como SVG con trazos.
- Imágenes WebP con `srcset` (versiones `-sm` de 700 px), `width` y `height` explícitos, `lazy` fuera de la primera pantalla y `fetchpriority="high"` en la imagen principal de los artículos. La auditoría avisa si falta alguna dimensión, y hoy no falta ninguna.
- La portada carga three.js solo después del contenido y con `import()`. Respeta `prefers-reduced-motion` y el control «pausar movimiento», con calidad adaptativa.
- Sin dependencias externas: lo verifican `tests/sitio.spec.ts` y la auditoría.
- La regresión de CLS en móvil ya la cubría `tests/arbol.spec.ts`.

## Cambios de esta rama

- Imágenes sociales en JPEG de 1200 × 630, unos 25 KB cada una. No afectan a la carga de la página.
- No se tocó la escena 3D. Es parte de la identidad visual y está dentro del objetivo en laboratorio.

## Recomendaciones pendientes

1. **INP en la portada:** si los datos de campo muestran un INP alto, dividir la construcción del árbol en tareas de menos de 50 ms (`scheduler.yield()` o `requestIdleCallback`), o iniciarla con la primera interacción o al entrar en pantalla. Es una hipótesis que hay que medir antes de aplicarla.
2. **Medición de campo** tras el lanzamiento: el informe de Core Web Vitals de Search Console, cuando haya datos. RUM (por ejemplo, Cloudflare Web Analytics) solo si la política de privacidad lo declara (ver [monitoring-plan.md](monitoring-plan.md)).
3. Repetir `medir-vitals.mjs` tras cada cambio visual importante, con las mismas condiciones, para comparar.
