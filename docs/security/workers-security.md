# Seguridad del Worker

**Arquitectura:**

- Las páginas son estáticas y se sirven desde Workers Static Assets **sin ejecutar el Worker**.
- El código solo corre para `/api/consulta` y para las rutas que no existen (la página 404).
- No hay sesiones, cookies, CORS, panel administrativo ni peticiones salientes construidas a partir de datos del usuario.

## Superficie expuesta

| Ruta | Métodos | Control |
|---|---|---|
| Páginas y recursos | GET, HEAD | Static Assets |
| `/api/consulta` | **POST**. El resto recibe 405 con `Allow: POST` | Ver debajo |
| Cualquier otra ruta | — | 404 del Worker con `noindex` y `no-store` |

## Cambios de esta rama

| Cambio | Archivo | Riesgo que mitiga |
|---|---|---|
| Turnstile obligatorio, verificado con Siteverify (host, acción, antigüedad y un solo uso) | `src/lib/turnstile.ts`, `src/lib/form-endpoint.ts`, `src/pages/api/consulta.ts` | Spam automatizado y repetición de envíos |
| 405 con `Allow: POST` para cualquier otro método (`export const ALL`) | `src/pages/api/consulta.ts` | Respuestas ambiguas (antes, 404 con la página completa) |
| Variables leídas desde los bindings en Workers (`variable()`) | `src/lib/plataforma*.ts` | En `wrangler dev`, `process.env` no reflejaba las `--var` |
| `Permissions-Policy` con `browsing-topics=()` en lugar de `interest-cohort` (obsoleta) | `src/lib/cabeceras.mjs` | Evita una directiva que ningún navegador reconoce |
| Comprobación previa al despliegue: nada sensible en `dist/` y CSP coherente con Turnstile | `scripts/seo/verificar-lanzamiento.mjs` | Publicar por error `.env`, *source maps* o copias |

## Validación y salida

- **Tipos y longitudes:** nombre 120, correo 200, teléfono 25, tipo de una lista cerrada, mensaje de 20 a 1200 caracteres.
- **Saneamiento:**
  - se eliminan los caracteres de control y los bidireccionales;
  - se eliminan las etiquetas HTML;
  - el correo no admite comas ni `;`, para que no se convierta en varios destinatarios;
  - los saltos de línea se neutralizan en los campos de una línea, contra la inyección de cabeceras de correo (probado con SMTP real en `tests/forms-smtp.spec.ts`).
- **Tamaño:** se leen como máximo 20 000 bytes en *streaming*, sin confiar en `Content-Length`. Si llega un archivo, se rechaza la petición.
- **Content-Type:** solo `application/x-www-form-urlencoded` y `multipart/form-data`. JSON se rechaza.
- **Salida:** el correo sale en texto plano. Las respuestas JSON llevan mensajes fijos y **no** repiten lo enviado (`tests/seguridad.spec.ts`).
- **SSRF:** no aplica. La única petición saliente es a Siteverify, con una URL fija. Solo con las claves de prueba se puede usar una URL simulada.

## Errores y registros

- **Nunca se responde con éxito si no se envió:**
  - correo desactivado: 503;
  - Turnstile sin configurar o caído: 503;
  - Turnstile rechazado: 403.
- Los registros solo anotan el tipo de fallo (`envio_no_disponible`, `turnstile caducado`). Nunca guardan cuerpos, correos, IP ni tokens.
- Observabilidad: los registros del código están activos y los de invocación están **desactivados** (`invocation_logs: false`), para no guardar las URL de cada petición.

## CORS, cookies y sesiones

- **CORS:** no se emite `Access-Control-Allow-Origin`. El formulario es del mismo origen y no necesita CORS. Un `OPTIONS` recibe 405 (en el borde, el 403 de la regla WAF 3).
- **CSRF:** `security.checkOrigin` de Astro compara `Origin` con el origen de la petición. Además, la regla WAF 3 y Turnstile, ligado a la acción y al host.
- **Cookies y sesiones:** no hay. El sitio no instala cookies propias, y Turnstile no requiere sesión. **No se implementan sesiones.**

## Secretos

| Elemento | Estado |
|---|---|
| `TURNSTILE_SECRET_KEY` | Secreto de Workers (`wrangler secret put`), nunca en `vars`. **Pendiente de autorización:** crear el secreto despliega una versión |
| `MAIL_TO`, `MAIL_FROM` | Pendientes del correo real. No se inventan |
| `vars` actuales | Sin credenciales |
| `.gitignore` | `.env`, `.env.*`, `.dev.vars*`, `.wrangler/` y `var/` |
| Historial de git | Sin coincidencias de claves privadas, tokens de Cloudflare o AWS, `SMTP_PASS` ni secretos de Turnstile ([security-tests.md](security-tests.md)) |

## Límites de Workers Free

| Límite | Uso del sitio |
|---|---|
| 100 000 peticiones al día | Solo las cuentan `/api/consulta` y las rutas inexistentes, porque Static Assets es gratis e ilimitado. **Las reglas WAF 1 a 3 cortan los sondeos antes del Worker**, que hoy son la principal fuente de invocaciones |
| 10 ms de CPU por petición | Validación y formulario: poco trabajo de CPU. La espera a Siteverify es de red y no cuenta como CPU |
| 50 subpeticiones | 1 por envío válido (Siteverify) y 0 en el resto |
| 128 MB de memoria | Mapa del límite en memoria con un máximo de 20 000 entradas |
| Error 1027 (cupo diario agotado) | Las páginas siguen sirviéndose desde Static Assets. Solo el formulario y la 404 fallarían hasta las 00:00 UTC ([incident-response.md](incident-response.md) §8) |

No se instaló ninguna biblioteca: Turnstile se verifica con `fetch` y `URLSearchParams` nativos.

## Acceso administrativo y Zero Trust

El sitio **no tiene** panel, CMS ni rutas de administración, y no se crea ninguno. Por eso Cloudflare Access es **NO APLICABLE**:

- **Nunca** debe ir delante del sitio público.
- Si en el futuro hay un *staging* o una herramienta de revisión jurídica, se protegerá con Access (plan Zero Trust Free) por hostname o ruta, además del `noindex`.
