# Compatibilidad de la seguridad con SEO, GEO y AEO

**Principio:** ningún control se aplica a la lectura pública (GET y HEAD de páginas y recursos). Los controles se concentran en el único punto de escritura (`/api/consulta`) y en rutas que no existen.

## Matriz por control

| Control | ¿Toca la lectura pública? | Bots verificados | Impacto SEO/GEO |
|---|---|---|---|
| WAF 1: archivos ocultos y copias | No: solo rutas con `/.` (salvo `/.well-known/`) o extensiones de copia o configuración que el sitio no publica | Sin efecto | Ninguno |
| WAF 2: tecnologías ajenas | No: solo `.php`, `/wp-…` y similares, que no existen | Sin efecto | Ninguno |
| WAF 3: métodos y API | Solo bloquea métodos distintos de GET/HEAD y `/api/*` | GET y HEAD siempre pasan | Ninguno: `/api/` está fuera de `robots.txt` |
| Rate limiting | Solo `/api/consulta` | Sin efecto | Ninguno |
| Turnstile | Solo en `/agendar-consulta`, y el script se carga al llegar al paso 3 | El HTML y el JSON-LD de esa página se sirven igual | Ninguno: no hay desafío para leer |
| Free Managed Ruleset | Solo peticiones con firmas de explotación | Sin efecto | Ninguno |
| DDoS L7 | Solo ataques volumétricos | — | Ninguno |
| Bot Fight Mode | — | — | **No se activa**: no admite excepciones ([bot-protection.md](bot-protection.md)) |
| AI Labyrinth | — | — | **No se activa**: modifica el HTML |
| Hotlink Protection | — | — | **No se activa**: impediría mostrar las imágenes en Google Imágenes, Facebook o Pinterest |
| Under Attack Mode | — | — | Solo en un incidente, temporal y, si es posible, limitado a rutas ([incident-response.md](incident-response.md) §2) |
| Políticas de IA en el borde | No bloquean | — | Search y Agent en Allow. Training, pendiente de decisión ([ai-crawlers-policy.md](ai-crawlers-policy.md)) |
| Bloqueo por país o ASN | **No se usa** | — | — |
| CORP en imágenes | **No se usa** | — | Mantiene las imágenes visibles en buscadores y redes sociales |
| HSTS | Solo fuerza HTTPS | — | Positivo: una sola versión del sitio |
| `no-store` en HTML | Los buscadores no dependen de la caché del navegador | — | Ninguno. Un cambio de `noindex` a `index` se ve en el siguiente despliegue: Static Assets lo publica de forma atómica y la zona no tiene Cache Rules |

## Comprobado en producción (2026-11-08)

`npm run seguridad:produccion` y `npm run seo:produccion`:

| Recurso | Resultado |
|---|---|
| `HEAD /` | 200 |
| `/robots.txt` | 200, `text/plain`, el del sitio. Cloudflare no antepone nada |
| `/sitemap.xml` | 200 |
| `/servicios/divorcios` | 200 |
| CSS (`/_astro/*.css`), JS (`/assets/js/site.js` y los *chunks*) y la fuente woff2 | 200, sin desafío |
| Imagen Open Graph (`/assets/brand/og-default.jpg`) | 200 |
| `manifest.webmanifest` | 200 |
| UA de Googlebot (solo la cadena) | 200: no se bloquea por la cadena. La verificación real de Googlebot la hace Cloudflare por IP o DNS inverso |
| `noindex` | Presente en la meta y en `X-Robots-Tag`, **como corresponde antes del lanzamiento**. No es un error que corregir |

## Lo que no se puede verificar todavía

- **Search Console y Bing Webmaster Tools:** no están verificados, y no se debe hacer antes del lanzamiento. Después, revisar en Estadísticas de rastreo que no haya respuestas 403 ni de desafío ([incident-response.md](incident-response.md) §4).
- **Vista previa de enlaces sociales:** las reglas no la afectan, porque solo usan GET. Se comprobará al compartir el primer enlace tras el lanzamiento.
- **Security Events:** sin tráfico suficiente.

## Rendimiento

| Cambio | Efecto |
|---|---|
| Reglas WAF y rate limiting | Se evalúan en el borde, sin coste perceptible |
| Turnstile | 0 bytes en todas las páginas salvo el formulario. En el formulario, el script se carga tras la interacción y no afecta al LCP. El espacio reservado (65 px) evita desplazamientos. Se observó una altura estable de 73 px con el widget de prueba |
| 405 y verificaciones | Solo en `/api/consulta` |
| Recursos nuevos en el resto del sitio | Ninguno: el peso de JavaScript solo crece en el código del formulario de `site.js` (unas 40 líneas) |

La medición de laboratorio anterior sigue vigente para las páginas públicas: LCP de 0,7 a 1,3 s y CLS ≤ 0,066 ([docs/seo/core-web-vitals.md](../seo/core-web-vitals.md)). Esta rama no cambia nada en su carga.
