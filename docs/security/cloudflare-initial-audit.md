# Auditoría inicial de Cloudflare y del proyecto

- **Fecha:** 2026-11-08, entre las 06:30 y las 07:10 UTC.
- **Método:** solo lectura, con la CLI `cf` y la sesión OAuth de Wrangler. Además, peticiones `curl` y `openssl` contra el sitio publicado, sin cargas de ataque ni volumen. La única excepción fue una petición con la firma pública de Log4Shell en el `User-Agent`, para comprobar si el ruleset administrado está activo.
- **Alcance:** zona `evelynelizondo.com` (`3c656474ab87b43af43563a939e20f23`), Worker `evelyn-elizondo` y la rama `security/cloudflare-free-hardening`.
- **Rama:** se creó a partir de `seo/geo-enterprise-2026` (`54a797e`), no de `identidad/doble`. Esa rama es la que está desplegada desde el 2026-11-07: partir de `05e689a` habría perdido el `noindex` por cabecera y la regla de barra final. No se cambió nada en la zona durante la auditoría.

## 1. Plan y cuenta

| Elemento | Estado observado | Evidencia |
|---|---|---|
| Plan de la zona | **Free Website**, `status: active`, configuración `full` | `cf zones get` |
| Nameservers | `liz.ns.cloudflare.com`, `venkat.ns.cloudflare.com` | `dig NS` |
| Registrador | Cloudflare Registrar, según la compra del 2026-11-07 (memoria del proyecto). La CLI no lo expone | — |
| Workers | Plan Free: 100 000 peticiones al día y 10 ms de CPU. Static Assets sin límite | Documentación ([cloudflare-free-inventory.md](cloudflare-free-inventory.md)) |
| 2FA del usuario | **Desactivado** (`two_factor_authentication_enabled: false`) | `cf user get` |
| Tokens de API | 5 activos y ninguno caduca. 2 tienen alcance de cuenta (`account.*`) con permisos de escritura sobre Access y Turnstile. Uno nunca se usó | `cf user tokens list`, ver [account-security.md](account-security.md) |
| Miembros de la cuenta | No se pudieron leer: la sesión no tiene permiso | `cf accounts members list` → error |

## 2. DNS

| Registro | Valor | Proxy | Función |
|---|---|---|---|
| `evelynelizondo.com` AAAA | `100::` | Sí | Dominio propio del Worker. Lo crea Workers y no responde fuera de Cloudflare |
| `www` AAAA | `100::` | Sí | Solo para la redirección 301 a la raíz |
| `evelynelizondo.com` TXT | `v=spf1 -all` | — | El dominio no envía correo |
| `_dmarc` TXT | `v=DMARC1; p=reject; adkim=s; aspf=s` | — | Rechaza el correo falsificado |
| MX | Ninguno | — | El dominio no recibe correo |
| CAA | Ninguno | — | Cualquier autoridad podría emitir. Ver [tls-dnssec.md](tls-dnssec.md) |

No hay registros huérfanos, CNAME hacia servicios de terceros, subdominios sin uso ni TXT que revelen infraestructura. **Riesgo de toma de subdominio: ninguno.** No existe ningún CNAME externo.

## 3. Hostnames por los que se llega al Worker

| Hostname | Estado | Evidencia |
|---|---|---|
| `evelynelizondo.com` | Dominio propio del Worker | `cf workers get` → `references.domains` |
| `www.evelynelizondo.com` | Redirección 301 de zona antes del Worker | `curl -I` |
| `*.workers.dev` | **Desactivado** (`subdomain.enabled: false`, `workers_dev: false`) | `cf workers get`, `wrangler.jsonc` |
| URL de vista previa | Desactivadas (`preview_urls: false`) | `wrangler.jsonc` |
| Otros | Ninguno | — |

Por tanto, no hay ningún hostname secundario que salte los controles de la zona ni que duplique contenido.

## 4. Ajustes de seguridad de la zona

| Ajuste | Valor | Comentario |
|---|---|---|
| SSL/TLS (`ssl`) | `strict` | El origen es el Worker. Ver [tls-dnssec.md](tls-dnssec.md) §5 |
| TLS mínimo | `1.2` | Comprobado: TLS 1.0 y 1.1 reciben la alerta 70 (`protocol_version`) |
| TLS 1.3 | `on` | Comprobado |
| Always Use HTTPS | `on` | `http → https` con 301, un solo salto |
| Automatic HTTPS Rewrites | `on` | Sin efecto: no hay recursos `http://` |
| HSTS de zona (`security_header`) | Desactivado | Lo emite el sitio: `max-age=31536000; includeSubDomains`, sin `preload` |
| Security Level | `medium` | Valor predeterminado |
| Browser Integrity Check | `on` | Una petición sin `User-Agent` recibió 200, sin desafío |
| Challenge Passage | 1800 s | — |
| Email Obfuscation | `off` | Lo desactivó el usuario el 2026-11-07. El sitio no publica correos |
| Hotlink Protection | `off` | — |
| 0-RTT | `off` | Correcto: evita la repetición de POST en la reanudación TLS |
| HTTP/3, ECH, IPv6 | `on` | — |
| Always Online | `off` | — |
| Replace insecure JS libraries | `on` | Sin efecto: el sitio no carga bibliotecas de CDN públicos |
| Privacy Pass | `on` | — |
| Browser Cache TTL | 14400 | Con «Respetar cabeceras» (0) no se podría pisar una política futura. Ver el inventario |
| Cache Level | `aggressive` | Predeterminado. No hay Cache Rules |
| WAF anterior (`waf`) | `off` | Es el producto antiguo. El WAF actual va por rulesets |

## 5. Rulesets (Ruleset Engine)

| Fase | Estado |
|---|---|
| `http_request_firewall_custom` (reglas WAF) | **Sin entrypoint**: 0 reglas |
| `http_ratelimit` | **Sin entrypoint**: 0 reglas |
| `http_request_firewall_managed` | Sin entrypoint propio. El ruleset administrado «Cloudflare Managed Free Ruleset» (`77454fe2…`) existe en la zona |
| `ddos_l7` | Sin anulaciones. El ruleset «DDoS L7» (`4d21379b…`) actúa siempre |
| `http_request_dynamic_redirect` | 2 reglas: `www → raíz` y la barra final, ambas 301 |
| Transform, cabeceras de respuesta, configuración, caché, errores personalizados | Sin entrypoint |

**El Free Managed Ruleset está activo aunque la zona no tenga entrypoint:** la documentación dice que se despliega por defecto en Free. Se comprobó con una petición GET a `/` con la firma de Log4Shell (`${jndi:ldap://127.0.0.1/a}`) en el `User-Agent`: respondió **403** con la página «Attention Required! | Cloudflare». La misma petición sin la firma devolvió 200.

## 6. Bots e IA

`cf bot-management get`:

| Ajuste | Valor |
|---|---|
| Bot Fight Mode (`fight_mode`) | **Desactivado** |
| JavaScript Detections (`enable_js`) | Desactivado |
| Políticas de IA: Search, Agent (`ai_user`) y Training | `disabled`, es decir, ninguna bloquea en el borde |
| AI Labyrinth (`crawler_protection`) | Desactivado |
| `robots.txt` gestionado por Cloudflare | No (`is_robots_txt_managed: false`). Se sirve el del sitio |

El `robots.txt` servido coincide con el del repositorio:

- permite el rastreo general y excluye `/api/`;
- bloquea `OAI-SearchBot` y `PerplexityBot` hasta el lanzamiento;
- bloquea siete agentes de entrenamiento.

## 7. Certificados

| Paquete | CA | Hosts | Vence |
|---|---|---|---|
| Universal | Let's Encrypt (ECDSA) | `evelynelizondo.com`, `*.evelynelizondo.com` | 2027-02-06 |
| Avanzado, del dominio del Worker | Google Trust Services (RSA y ECDSA) | Los mismos | 2027-02-06 |

El certificado presentado es el de Google Trust Services (CN WE1) y cubre `www` con el comodín. Los dos se renuevan solos.

## 8. DNSSEC

- Cloudflare: `status: pending` y DS `2371 13 2 28E70B13…179A`.
- `npm run seo:dnssec`, en 1.1.1.1 y 8.8.8.8: hay DNSKEY 2371 y 34505, **no hay DS en `.com`** y AD es falso.

**La cadena de confianza no existe todavía.** Ver [tls-dnssec.md](tls-dnssec.md).

## 9. Cabeceras servidas (antes de esta rama)

En las páginas y los recursos, por `_headers`:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`;
- `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`;
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`;
- `Permissions-Policy` con `interest-cohort`, una directiva obsoleta;
- `Cross-Origin-Opener-Policy: same-origin`;
- `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store` en el HTML y `max-age=3600` en `/assets/*`.

La CSP completa de cada página va en una `<meta>`, con el hash del único script en línea. Las respuestas del Worker llevan las mismas cabeceras desde `src/middleware.ts`.

## 10. Endpoints y respuestas

| Petición | Respuesta | Observación |
|---|---|---|
| `POST /api/consulta` del mismo origen, inválida | 422 JSON con todas las cabeceras | Correcto |
| `POST /api/consulta` con `Origin` ajeno | 403 `text/plain` | Lo devuelve `checkOrigin` de Astro, sin las cabeceras de seguridad (contenido fijo, sin riesgo) |
| `GET /api/consulta` | 404 con la página de error | Debería ser 405: **corregido en esta rama** |
| `OPTIONS` y `PUT` en `/api/consulta` | 404 | Ídem |
| `/.env`, `/.git/config`, `/wp-login.php`, `/xmlrpc.php`, `/server-status` | 404 del Worker | No existen. Cada sondeo **consume una invocación del Worker** (cupo Free de 100 000 al día) |
| `/.well-known/security.txt` | 404 | No existe: falta un contacto real |

Archivos publicados que no son páginas:

- `robots.txt`, `sitemap.xml`, `manifest.webmanifest` y `favicon.*`;
- la licencia de la fuente;
- `assets/brand/brand-colors.json` y `brand-guidelines.md`. Son documentación de marca, no información sensible. Ya se registraron como hallazgo B7 en la auditoría técnica anterior.

No hay archivos ocultos, *source maps*, copias de seguridad ni configuraciones publicadas.

## 11. Secretos y variables

| Elemento | Estado |
|---|---|
| Secretos del Worker | Ninguno (`wrangler secret list` → `[]`) |
| `vars` de Wrangler | `MAIL_MODE=disabled`, `RATE_LIMIT_MAX=5` y `RATE_LIMIT_WINDOW_MINUTES=10`. Ninguna es una credencial |
| `.gitignore` | Excluye `.env`, `.env.*` (salvo `.env.example`), `.dev.vars*`, `.wrangler/` y `var/` |
| Historial de git | Se buscaron claves con `git log -p` y patrones de token de Cloudflare, AWS, claves privadas y `SMTP_PASS`: **sin resultados**. Ver [security-tests.md](security-tests.md) |
| Observabilidad | Registros del código activos y registros de invocación desactivados. El código solo registra el tipo de fallo, sin datos personales |

## 12. Security Events y analítica

La CLI no da acceso a Security Events (GraphQL `firewallEventsAdaptive`). Además, la zona se activó el 2026-11-08 a las 00:59 UTC y apenas tiene tráfico: **no hay datos para calibrar reglas ni para descartar falsos positivos**. Revisarlo en el panel (Security → Events) es parte de la monitorización ([incident-response.md](incident-response.md)).

## 13. Conclusiones (por prioridad)

| Prioridad | Hallazgo | Tratamiento |
|---|---|---|
| P0 | La cuenta de Cloudflare no tiene 2FA | Acción personal del propietario ([account-security.md](account-security.md)) |
| P0 | Tokens de API sin caducidad y con escritura de alcance de cuenta, uno sin uso | Revisar y revocar desde el panel ([account-security.md](account-security.md)) |
| P0 | DNSSEC sin DS en el padre | Esperar o reclamar al registrador ([tls-dnssec.md](tls-dnssec.md)) |
| P1 | Sin reglas WAF propias: los sondeos consumen el cupo del Worker | 3 reglas, aplicadas y verificadas el 2026-11-08 ([waf-rules.md](waf-rules.md)) |
| P1 | Sin rate limiting de zona en el formulario | 1 regla, aplicada y verificada el 2026-11-08 ([rate-limiting.md](rate-limiting.md)) |
| P1 | El formulario no tenía defensa antibots más allá del campo trampa y el tiempo | Turnstile con Siteverify implementado ([turnstile-implementation.md](turnstile-implementation.md)) |
| P1 | `/api/consulta` respondía 404 a otros métodos | 405 con `Allow: POST` |
| P2 | Sin CAA | Registros preparados |
| P3 | Browser Cache TTL a 4 h | Recomendado «Respetar cabeceras» |
