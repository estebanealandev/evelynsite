# Reglas WAF personalizadas (plan Free)

**Estado: ACTIVAS Y VERIFICADAS** desde el 2026-11-08, 15:10 UTC (ruleset `a7eac2de4f62405c978e90a8c40d30f9`, versión 1), aplicadas con autorización. Antes de aplicarlas la fase no tenía entrypoint, así que no había estado previo que guardar.

- La definición está en [`ops/cloudflare/seguridad/waf-reglas-personalizadas.json`](../../ops/cloudflare/seguridad/waf-reglas-personalizadas.json).
- El 2026-11-08 se validó contra la API de la zona con `--validate-only` (`dry_run=true`): la API aceptó el ruleset completo sin guardarlo. Después de validar, la fase seguía sin entrypoint.
- Controles negativos de la misma validación:
  - Una regla con `matches` recibe `not entitled: the use of operator Matches is not allowed, a Business plan or a WAF Advanced plan is required`. La validación sí comprueba lo que permite el plan.
  - Una expresión mal escrita recibe `unknown identifier`.

## Presupuesto

El plan Free admite **5 reglas**. Las acciones disponibles son Block, Managed Challenge, Non-Interactive Challenge, Interactive Challenge y Skip; Log es solo de Enterprise. No hay regex, que empieza en Business ([sources](cloudflare-free-inventory.md#fuentes)).

Se usan **3 reglas** y se reservan 2. Cada una responde a una amenaza observada en la auditoría:

| # | Regla | Amenaza que resuelve | Por qué en el borde |
|---|---|---|---|
| 1 | Archivos ocultos, copias y configuraciones | Robots que buscan `/.env`, `/.git/config` y copias de seguridad | Hoy cada sondeo **invoca al Worker**, gasta cupo Free (100 000 al día) y recibe una página 404 de 10 KB |
| 2 | Tecnologías que el sitio no usa | Sondeos de WordPress, PHP, CGI, Exchange y paneles de equipos de red | Lo mismo: ruido que solo consume recursos |
| 3 | Solo GET/HEAD, y POST del mismo origen al formulario | Spam directo a `/api/consulta` sin pasar por la página, métodos inesperados y cualquier otra ruta bajo `/api/` | Corta el spam más barato antes del Worker y antes de Siteverify |
| 4 | *Reservada* | Desafío temporal del formulario durante una ola de spam ([incident-response.md](incident-response.md) §1) | Se activa solo en un incidente |
| 5 | *Reservada* | Patrones reales que aparezcan en Security Events | Sin datos todavía: la zona se activó el 2026-11-08 |

**No se crea una regla `Skip` para bots verificados.** Ninguna de estas reglas desafía ni bloquea GET o HEAD a contenido público. Una excepción `cf.client.bot` no protegería nada y podría abrirles las rutas que sí se bloquean. Si en el futuro se añade un desafío sobre contenido público (regla 4), esa regla misma llevará `and not cf.client.bot`.

**Orden y fase.** Las tres van en `http_request_firewall_custom` y se evalúan después de `ddos_l7` y antes del rate limiting y del Free Managed Ruleset. La redirección `www` (`http_request_dynamic_redirect`) se ejecuta antes, así que las reglas solo ven `evelynelizondo.com`. Al ser bloqueos excluyentes, el orden entre ellas no cambia el resultado.

**Campos y operadores usados:**

- `http.request.uri.path` (normalizado por Cloudflare: decodifica `%2e` y resuelve `..`);
- `http.request.method` y `http.request.headers`;
- `lower()`, `starts_with()`, `ends_with()`, `any()`, `contains`, `eq` e `in`.

Ninguno exige un plan de pago (validado por la API).

---

## Regla 1: Bloquear archivos ocultos, copias y configuraciones

- **Acción:** Block. **Orden:** 1. **Fase:** `http_request_firewall_custom`.
- **Expresión validada** (abreviada; la exacta está en el JSON):

```text
(http.request.uri.path contains "/." and not starts_with(http.request.uri.path, "/.well-known/"))
or ends_with(lower(http.request.uri.path), ".env")
or ends_with(lower(http.request.uri.path), ".bak")   … y lo mismo para:
   .backup .old .orig .save .swp .sql .sqlite .db .log .ini .conf .cfg .yml .yaml
   .toml .lock .pem .key .crt .p12 .pfx .zip .tar .gz .tgz .7z .rar
```

- **Exclusiones:** `/.well-known/` queda libre en toda su extensión, para validaciones de dominio, un futuro `security.txt` y `change-password`.
- **Rutas reales comprobadas:**
  - `scripts/seo/verificar-lanzamiento.mjs` falla si la compilación publica un archivo oculto, un *source map*, `.env`, `.bak`, `.sql`, `.pem`, `.key`, `.log`, YAML, TOML o INI. Se probó plantando `dist/client/.env` y `x.js.map`.
  - Ninguna URL del sitio contiene `/.` ni termina en esas extensiones.
  - `.json`, `.txt`, `.xml`, `.md` y `.webmanifest` **no** están en la lista porque el sitio los publica.
- **El WAF no sustituye a la compilación:** el control principal es que nada sensible llegue a `dist/`.
- **Impacto en SEO:** ninguno. Ninguna URL indexable coincide. `robots.txt`, `sitemap.xml`, CSS, JS, imágenes, fuentes y `og:image` no se ven afectados.
- **Falsos positivos:** improbables. El caso a vigilar sería un archivo `.zip` o `.gz` legítimo en el futuro; si se publica uno, hay que quitar esa extensión de la regla.
- **Pruebas** (tras activarla):
  - `npm run seguridad:produccion -- --esperar-waf` comprueba que `/.env`, `/.git/config`, `/backup.sql` y `/config.yml` reciben un 403 del borde y que `/.well-known/security.txt` **no** se bloquea.
  - `npm run seo:produccion` comprueba que las páginas y los recursos siguen respondiendo 200.
- **Reversión:** desactivar la regla (`"enabled": false`) o volver a publicar el ruleset sin ella ([rollback-plan.md](rollback-plan.md)).

## Regla 2: Bloquear sondeos de tecnologías que el sitio no usa

- **Acción:** Block. **Orden:** 2.
- **Expresión validada:**

```text
ends_with(lower(path), ".php" | ".php5" | ".phtml" | ".asp" | ".aspx" | ".jsp" | ".cgi" | ".pl")
or lower(path) contains ".php/"
or starts_with(lower(path), "/wp-" | "/wordpress" | "/xmlrpc" | "/phpmyadmin" | "/pma/" | "/cgi-bin/"
   | "/vendor/" | "/administrator/" | "/actuator" | "/owa/" | "/autodiscover/" | "/boaform/" | "/hnap1")
or lower(path) contains "/wp-admin" | "/wp-content/" | "/wp-includes/"
```

  En el JSON cada alternativa se escribe como una llamada separada, porque el lenguaje no admite `|`.
- **Stack real:** Astro estático más un Worker. No hay PHP, WordPress, CGI, Java, ASP.NET, Exchange ni `vendor/` publicado.
- **No usa el User-Agent:** identifica por la ruta pedida, no por quién dice ser el cliente.
- **Impacto en SEO:** ninguno. Ninguna ruta del sitio empieza ni termina así: lo comprueba el inventario de 91 rutas en `docs/seo/inventario-rutas.md`.
- **Falsos positivos:** ninguno con el stack actual. Si algún día se publica algo bajo `/vendor/` o `/administrator/`, hay que retirar ese prefijo.
- **Pruebas:** `/wp-login.php` y `/xmlrpc.php` deben recibir un 403 del borde (`seguridad:produccion -- --esperar-waf`), y `/servicios/divorcios` debe seguir en 200.
- **Reversión:** como en la regla 1.

## Regla 3: Solo GET y HEAD, salvo POST del mismo origen al formulario

- **Acción:** Block. **Orden:** 3.
- **Expresión validada:**

```text
(starts_with(lower(http.request.uri.path), "/api/") or not http.request.method in {"GET" "HEAD"})
and not (http.request.uri.path eq "/api/consulta"
         and http.request.method eq "POST"
         and any(http.request.headers["origin"][*] eq "https://evelynelizondo.com"))
```

- **Qué deja pasar:**
  - GET y HEAD a cualquier página o recurso, incluidos los rastreadores;
  - POST a `/api/consulta` con `Origin: https://evelynelizondo.com`, que los navegadores envían siempre en un POST, con o sin JavaScript.
- **Qué bloquea:**
  - cualquier otro método (PUT, DELETE, PATCH, OPTIONS, TRACE…);
  - cualquier GET o HEAD a `/api/*`;
  - un POST sin `Origin` o de otro origen. Es la forma más común del spam por script, que no carga la página.
- **CORS:** el formulario es del mismo origen y no hay preflight, así que bloquear `OPTIONS` no rompe nada.
- **Defensa en profundidad:** el Worker aplica las mismas restricciones por su cuenta. Responde 405 con `Allow: POST`, `checkOrigin` de Astro da 403 a un origen ajeno, y además están la validación, Turnstile y los límites. Si la regla se desactiva, el comportamiento sigue siendo seguro.
- **Impacto en SEO:** ninguno. `/api/` está excluida en `robots.txt`, los buscadores solo usan GET y HEAD, y HEAD sigue permitido en todo el sitio.
- **Falsos positivos:** un navegador muy antiguo que no envíe `Origin` en el POST. Ya hoy lo rechaza `checkOrigin`, así que no cambia nada.
- **Pruebas:**
  - `seguridad:produccion -- --esperar-waf`: `GET /api/consulta` y el POST de otro origen reciben un 403 del borde.
  - Manual: enviar el formulario real desde `/agendar-consulta` (con el correo activo).
- **Reversión:** como en la regla 1.

## Regla 4 (reservada): desafío temporal del formulario

Solo para un incidente de spam que Turnstile y el rate limiting no contengan. Plantilla:

```json
{ "description": "4. TEMPORAL: desafío en la página del formulario",
  "expression": "(http.request.uri.path eq \"/agendar-consulta\" and not cf.client.bot)",
  "action": "managed_challenge", "enabled": true }
```

- Afecta solo a la página del formulario, que no es una página de contenido jurídico, y nunca a `/api/consulta`: un desafío rompería el `fetch` JSON del formulario.
- Se retira al terminar el incidente.

## Regla 5 (reservada)

Para patrones que aparezcan en Security Events con evidencia: ruta, método, frecuencia y origen. Por defecto **no** se bloquean países, ASN ni proveedores de nube.

## Aplicar (con autorización)

```bash
cf rulesets entrypoint update http_request_firewall_custom -z 3c656474ab87b43af43563a939e20f23 --validate-only --body "$(jq 'del(."$comentario")' ops/cloudflare/seguridad/waf-reglas-personalizadas.json)"
```

```bash
cf rulesets entrypoint update http_request_firewall_custom -z 3c656474ab87b43af43563a939e20f23 --body "$(jq 'del(."$comentario")' ops/cloudflare/seguridad/waf-reglas-personalizadas.json)"
```

```bash
npm run seguridad:produccion -- --esperar-waf
```

```bash
npm run seo:produccion
```

Después, revisar Security → Events durante 24 a 72 horas en busca de bloqueos inesperados ([incident-response.md](incident-response.md) §3).

## Verificación tras aplicarlas (2026-11-08)

| Comprobación | Resultado |
|---|---|
| `seguridad:produccion -- --esperar-waf` | `/.env`, `/.git/config`, `/wp-login.php`, `/xmlrpc.php`, `/backup.sql` y `/config.yml` reciben 403 del borde. `GET /api/consulta` y el POST de otro origen, 403 del borde. `/.well-known/` no se bloquea. Toda la lectura pública (HEAD `/`, `robots.txt`, sitemap, páginas, imágenes, CSS, JS, fuentes y el UA de Googlebot) da 200 sin desafío. **Sin problemas** |
| POST a `/api/consulta` con `Origin: https://evelynelizondo.com` | Pasa el borde y llega al Worker: 422 JSON de validación (datos vacíos, sin envío) |
| `seo:produccion` | Redirecciones 301 y `noindex` en todas las páginas: **sin problemas** |
| `www` | 301 a la raíz |
