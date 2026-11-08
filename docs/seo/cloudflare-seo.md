# Cloudflare: cabeceras, caché, redirecciones, dominio e indexación

Lo leído de la zona `evelynelizondo.com` (ID `3c656474ab87b43af43563a939e20f23`) el 2026-11-07 con la CLI `cf`. Con autorización del usuario, ese día se desplegó esta rama (versión del Worker `5d023ca4`) y se añadió la regla 301 de barra final. No se cambió nada más en la zona.

## Arquitectura

- `wrangler.jsonc`:
  - Worker `evelyn-elizondo`, `compatibility_date` 2026-11-01, `nodejs_compat`;
  - Static Assets con `html_handling: drop-trailing-slash`;
  - dominio propio con `custom_domain: true`, sin `workers.dev` y sin URL de vista previa.
- Los recursos estáticos, es decir todas las páginas, se sirven **sin pasar por el Worker**. El Worker solo ejecuta `/api/consulta` y lo que no corresponde a un archivo, como la 404 generada.
- No hay entornos de preview ni staging publicados. Si se crean, `SITE_ENV=preview|staging` impide indexarlos por diseño. Además conviene protegerlos con Cloudflare Access: el `noindex` evita la indexación, pero no el acceso.

## Cabeceras: dónde se aplica cada una

`_headers` solo actúa sobre las respuestas de Static Assets. No actúa sobre las que genera el código del Worker ([sources.md](sources.md), §9). Por eso hay dos caminos:

| Respuesta | Mecanismo | Cabeceras |
|---|---|---|
| Páginas y recursos | `dist/client/_headers`, generado en `astro.config.mjs` | Seguridad (CSP `frame-ancestors`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP), HSTS, `Cache-Control` y `X-Robots-Tag` |
| Formulario y 404 generada | `src/middleware.ts` | Las mismas cabeceras de seguridad, HSTS en https, `no-store` y siempre `X-Robots-Tag: noindex, nofollow` |
| Servidor Node (otro alojamiento) | `scripts/servidor.mjs` | Las mismas. `X-Robots-Tag` se lee de `dist/robots-compilados.json` |

`X-Robots-Tag` se deriva del HTML compilado. El hook `astro:build:done` lee la meta robots de cada página y escribe `dist/robots-compilados.json`, así la cabecera no puede contradecir la etiqueta:

- **Antes del lanzamiento:** `/*` lleva `X-Robots-Tag: noindex, nofollow`, también en imágenes, `robots.txt` y el sitemap.
- **Después del lanzamiento:** solo las páginas excluidas llevan la cabecera, con su mismo valor. Las carpetas que estén excluidas por completo se agrupan (por ejemplo, `/blog/etiqueta/*`). La agrupación exige que *todo* lo que cuelga de la carpeta esté excluido, porque `/carpeta/*` también alcanza las subcarpetas. Lo prueba `tests/indexacion.spec.ts`.
- La compilación falla si `_headers` supera las 100 reglas que admite Cloudflare. Con todo el contenido pendiente salen 28.

`Content-Type` de las páginas es `text/html` sin `charset` en la cabecera. El HTML declara `<meta charset="utf-8">` como primer elemento, lo cual basta. Se deja así.

## Caché

| Contenido | Política | Motivo |
|---|---|---|
| `/_astro/*` (nombres con hash) | `public, max-age=31536000, immutable` | El nombre cambia con el contenido |
| `/assets/*`, iconos, manifest, `robots.txt`, sitemap | `public, max-age=3600` | Sin hash: una hora limita la persistencia de una versión antigua |
| HTML | `no-store` | Privacidad en equipos compartidos (situaciones familiares delicadas) y que una corrección jurídica o un cambio de `noindex` a `index` llegue en el siguiente despliegue |
| `/api/consulta` | `no-store` | Nunca se guarda una respuesta del formulario |

La zona no tiene Cache Rules (`http_request_cache_settings`: sin entrypoint). Static Assets sirve cada despliegue de forma atómica, así que un cambio de `noindex` a `index` no queda retenido en la caché del borde. Si en el futuro se añade una Cache Rule para HTML, habrá que purgar la caché en cada lanzamiento o retirada.

## Redirecciones

| Caso | Dónde | Estado |
|---|---|---|
| `http → https` | Always Use HTTPS (zona) | 301 ✔ |
| `www → raíz` | Regla dinámica de zona «www a dominio principal», que conserva ruta y parámetros | 301 ✔. `_redirects` no admite redirecciones entre dominios, así que debe seguir en la zona |
| `/home → /` | `redirects` de Astro | 301 ✔ |
| `/ruta/ → /ruta` | Regla dinámica de zona «Quitar la barra final con 301», que se evalúa antes que el 307 de `html_handling` | 301 ✔, conserva los parámetros. En Node, 301 desde `servidor.mjs` |
| Mayúsculas (`/Servicios`) | — | 404. Ningún enlace las usa |

**Regla aplicada el 2026-11-07** (ruleset `http_request_dynamic_redirect`, versión 2). Se añadió junto a la regla `www`, que se conservó tal cual; la definición está en `ops/cloudflare/regla-barra-final.json`. El único caso con dos saltos es `www` más la barra final (`https://www…/blog/` → `/blog/` → `/blog`), y los dos son 301. Para volver atrás, actualizar el ruleset solo con la regla `www`.

## Rastreadores y seguridad

Configuración leída:

- Desde el 2026-11-08 hay 3 reglas WAF personalizadas y 1 de límite de peticiones (solo en `/api/consulta`). Ninguna toca la lectura pública: `seo:produccion` y `seguridad:produccion -- --esperar-waf` lo comprobaron ([docs/security/waf-rules.md](../security/waf-rules.md)).
- Security Level está en `medium` y Browser Integrity Check activo.
- Las políticas de crawlers de IA están en «Allow», como eligió el usuario al comprar el dominio.
- `robots.txt` no lo gestiona Cloudflare.
- Bot Fight Mode está desactivado (`cf bot-management get`, 2026-11-08). La decisión de mantenerlo así está en [docs/security/bot-protection.md](../security/bot-protection.md).

Antes de autorizar la indexación:

- Bot Fight Mode no admite excepciones ([sources.md](sources.md), §11). Si está activo y bloquea a Googlebot o Bingbot, la solución es desactivarlo en esta zona, no relajar la seguridad global.
- Para cualquier regla futura, eximir a los bots verificados con `cf.client.bot` (o `cf.verified_bot_category`), no por User-Agent, que se puede falsificar.
- El Rate Limiting del formulario (binding `LIMITE_CONSULTAS`, 10 por minuto por IP) solo afecta a `/api/consulta`, que está excluida en `robots.txt`.
- Tras el lanzamiento, revisar en Search Console → Estadísticas de rastreo que no haya respuestas 403 ni de desafío.

La política de `robots.txt` (búsqueda frente a entrenamiento) está en [geo-aeo-strategy.md](geo-aeo-strategy.md). La genera `src/lib/seo/robots.mjs`.

## DNSSEC

Estado al 2026-11-07, verificado con `npm run seo:dnssec` en 1.1.1.1 y 8.8.8.8:

- La zona está firmada: hay DNSKEY con las etiquetas 34505 y 2371.
- **No hay DS en `.com`** y la bandera AD es falsa. La cadena de confianza todavía no existe.
- El DS que Cloudflare muestra (`2371 13 2 …`) coincide con la clave 2371. El script lo comprueba cuando el DS aparezca.

Procedimiento:

1. Ver el estado en el panel (DNS → Settings → DNSSEC).
2. Como el registrador es Cloudflare Registrar, el DS se publica solo, normalmente en horas; si pasa más de un día, abrir un caso.
3. Ejecutar `npm run seo:dnssec` hasta que salga en verde, sin `SERVFAIL`.
4. Contrastar con https://dnsviz.net/d/evelynelizondo.com/dnssec/.
5. Anotar la evidencia en `lanzamiento.json` → `dnssec`.

No se modificó nada en el registrador.

## Correo

El SPF sigue en `v=spf1 -all` y DMARC en `p=reject`. Al activar Email Routing o Email Service para el formulario, hay que sustituir el SPF por el que indique Cloudflare. Ver el README, «Activar el correo del formulario».
