# Pruebas de seguridad

Ejecutadas el 2026-11-08 sobre la rama `security/cloudflare-free-hardening`.

- **En local:** pruebas automatizadas.
- **Contra producción:** solo lectura, sin carga ni escaneo intrusivo. La única excepción fue una petición con la firma de Log4Shell para verificar el ruleset administrado.

## Suites automatizadas

| Suite | Entorno | Resultado |
|---|---|---|
| `npx playwright test` (escritorio y móvil) | Servidor Node con la compilación de Node | **419 pasadas, 61 omitidas y 0 fallidas**. Las omitidas solo aplican al otro modo o a un proyecto |
| `npm run test:cf` | `wrangler dev` con la compilación de Workers (`build:cf`) | **410 pasadas, 64 omitidas y 0 fallidas** |
| `npx astro check` | — | 0 errores y 0 avisos |
| `npm audit` (también `--omit=dev`) | — | 0 vulnerabilidades |
| `node scripts/seo/verificar-lanzamiento.mjs --compilacion` | `build:cf` | Compilación coherente: production, no indexable, sin archivos sensibles y CSP coherente con Turnstile |
| Control negativo del verificador | `build:cf` con `.env` y `x.js.map` plantados | Bloquea el despliegue: «archivos que no deben publicarse: .env, _astro/x.js.map» |

### Pruebas nuevas o ampliadas

| Prueba | Qué verifica |
|---|---|
| `tests/turnstile.spec.ts` (unidad, 7) | Siteverify: secreto, token, IP, host, acción, antigüedad, códigos de error, `success` estricto, tiempo máximo y caída |
| `tests/turnstile.spec.ts` (endpoint Node, 6) | Sin token da 403. Uno inválido no gasta el token. Uno aprobado da 200. Reutilizado o rechazado da 403. Caída da 503. Sin JavaScript, 303 a la página de error |
| `tests/turnstile.spec.ts` (modo) | `TURNSTILE_MODE=off` solo en hosts locales |
| `tests/seguridad.spec.ts` (405) | GET, HEAD, PUT, DELETE, PATCH y OPTIONS en `/api/consulta` reciben 405 con `Allow: POST`, `no-store` y `X-Robots-Tag` |

### Pruebas previas que siguen vigentes

| Archivo | Cubre |
|---|---|
| `tests/seguridad.spec.ts` | Cabeceras; CSP sin scripts en línea; ningún recurso de terceros; fuentes locales; cuerpo grande; adjuntos; JSON rechazado; correos inválidos; IP falsificada en `X-Forwarded-For`; errores que no repiten datos |
| `tests/sitio.spec.ts` | Envío real; sin JavaScript; inyección de cabeceras y HTML; campo trampa; tiempo de llenado; errores de consola |
| `tests/forms-smtp.spec.ts` | SMTP real: neutraliza `Bcc:` inyectado |
| `tests/forms-disabled.spec.ts` | Sin correo, 503 y nunca un éxito simulado |
| `tests/limite.spec.ts` | Límite de envíos por IP |
| `tests/seo.spec.ts`, `tests/indexacion.spec.ts` | `noindex` en la meta y en la cabecera; `robots.txt`; sitemap; redirecciones |

## Prueba de integración de Turnstile (local, red real)

- **Montaje:**
  - compilación con la clave pública de prueba `1x00000000000000000000AA`;
  - servidor Node con la clave secreta de prueba `1x0000000000000000000000000000000AA`, sin URL simulada, es decir, contra el **Siteverify real**;
  - navegador del panel de la aplicación, a 375 px.
- **Pasos y resultado:**
  1. En los pasos 1 y 2 no se carga nada de `challenges.cloudflare.com`.
  2. Al llegar al paso 3: `script` presente, `window.turnstile` disponible, token `XXXX.DUMMY.TOKEN.XXXX` y contenedor de 73 px de alto, con 65 px reservados.
  3. Al enviar: «Solicitud recibida…». El mensaje del buzón local no contiene el token.
  4. Consola: **sin violaciones de CSP**. El único error, `AbortError: Transition was skipped`, viene de una transición de vista que interrumpió la navegación automatizada; no tiene relación con la seguridad.

## Comprobación de la configuración de Workers en local

`wrangler dev`, sin `--local-upstream`, presenta el host de la ruta (`evelynelizondo.com`) en `request.url`. Con `TURNSTILE_MODE=off`, el formulario respondió **503 «verificación no disponible»**: el apagado local **no** funciona con el host de producción. Con `--local-upstream 127.0.0.1:4341` respondió 200. La configuración de pruebas usa ahora `--local-upstream`.

## Producción (solo lectura), 2026-11-08, versión `5d023ca4`, anterior a esta rama

`npm run seguridad:produccion`:

| Grupo | Resultado |
|---|---|
| Cabeceras | HSTS (1 año, `includeSubDomains`, sin `preload`), CSP `frame-ancestors`, `nosniff`, XFO, Referrer, Permissions, `no-store` en HTML. CSP sin `'unsafe-inline'` en scripts. Portada sin terceros: ✔ |
| Formulario | Turnstile no configurado y CSP sin terceros: ✔. **`GET /api/consulta` da 404: ✖ esperado, el 405 llega con esta rama.** POST de otro origen da 403 (Astro): ✔ |
| Recursos que no deben existir | `/.env`, `/.git/config`, `/wp-login.php`, `/xmlrpc.php`, `/backup.sql` y `/config.yml` dan 404 del Worker (antes de aplicar las reglas WAF). `/.well-known/` no se bloquea: ✔ |
| Lectura pública | HEAD `/`, `robots.txt`, sitemap, una página, la imagen OG, el manifest, CSS, JS y la fuente dan 200 sin desafío. El UA de Googlebot no se bloquea: ✔ |
| HTTPS y TLS | `http → https` con 301. TLS 1.0 y 1.1 rechazados (`ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION`). TLS 1.2 y 1.3 aceptados. Certificado vigente 90 días: ✔ |

Comprobaciones manuales:

| Prueba | Resultado |
|---|---|
| `openssl s_client -tls1 / -tls1_1` (con `SECLEVEL=0`) | Alerta 70 `protocol version` |
| `openssl s_client -tls1_2 / -tls1_3` | ECDHE-ECDSA-CHACHA20-POLY1305 y TLS_AES_256_GCM_SHA384 |
| Firma de Log4Shell en el `User-Agent` (GET `/`) | **403 «Attention Required! \| Cloudflare»**: Free Managed Ruleset activo. Sin la firma: 200 |
| Petición sin `User-Agent` | 200 (Browser Integrity Check no la desafió) |
| `dig CAA` | Sin registros |
| `npm run seo:dnssec` | DNSKEY 2371 y 34505; **sin DS en `.com`; AD falso** |
| `www` | 301 a la raíz |

## Producción tras aplicar las reglas WAF y el rate limiting (2026-11-08, 15:10 UTC)

| Prueba | Resultado |
|---|---|
| `seguridad:produccion -- --esperar-waf` | **Sin problemas.** Los 6 sondeos, `GET /api/consulta` y el POST de otro origen reciben 403 del borde. `/.well-known/` libre. Toda la lectura pública en 200 sin desafío, incluido el UA de Googlebot. TLS sin cambios |
| POST del mismo origen con datos vacíos | Pasa el borde: 422 JSON del Worker |
| 8 POST seguidos del mismo origen con datos vacíos (sin envío de correo) | 5 × 422 del Worker y luego 3 × 429 `error code: 1015` del borde con `Retry-After: 10`. A los 12 s, 422 |
| `seo:produccion` | **Sin problemas:** redirecciones 301 y `noindex` en las 17 páginas comprobadas |
| `tests/sitio.spec.ts` (Node y Workers) | 150 pasadas, 4 omitidas y 0 fallidas, con la prueba nueva del 429 en texto plano |

## Validación de reglas contra la API (`--validate-only`)

| Cuerpo | Resultado |
|---|---|
| `waf-reglas-personalizadas.json` (3 reglas) | Aceptado, sin guardar |
| `rate-limit-formulario.json` | Aceptado, sin guardar |
| Control: regla con `matches` | Rechazada: `not entitled … Business plan or WAF Advanced plan` |
| Control: expresión inválida | Rechazada: `unknown identifier` |
| Control: rate limiting con `http.request.method` | **Aceptado** por la validación, aunque la documentación dice que Free no admite el método. La regla preparada no depende de ello: solo usa la ruta |
| Estado después de validar | Las fases `http_request_firewall_custom` y `http_ratelimit` siguen sin entrypoint |

## Secretos

- `git log --all -p` revisado en busca de claves privadas PEM, `AKIA…`, secretos reales de Turnstile (`0x4AAAA…`), `ghp_`, `xox`, `sk-` y asignaciones de `SMTP_PASS`, `API_TOKEN`, `CLOUDFLARE_API_TOKEN` o `TURNSTILE_SECRET_KEY`: **sin coincidencias**. Las claves de prueba oficiales de Turnstile, que son públicas, se excluyen.
- `git ls-files` no tiene `.env`, `.dev.vars`, `.pem` ni `.key` versionados.

## No probado (y por qué)

| Prueba | Motivo |
|---|---|
| Carga, DDoS, fuerza bruta y escaneo intrusivo | Prohibidos contra producción, y sin un entorno de pruebas autorizado equivalente |
| Turnstile con el widget real | Requiere crear el widget (autorización) |
| Lighthouse o Core Web Vitals después del cambio | Las páginas públicas no cambian: el único JavaScript nuevo se ejecuta en el formulario y Turnstile se carga tras la interacción. Medir el formulario cuando el widget real esté activo |
| Vista previa social y Search Console | Sin lanzamiento ni verificación de propiedad (prohibido antes de la aprobación) |
| Firefox y WebKit | `npm run test:navegadores` existe y no se ejecutó en esta pasada |
