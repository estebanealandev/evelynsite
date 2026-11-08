# Formulario de consulta: Turnstile, estados y activación controlada

## Estado (2026-11-08)

**El formulario NO está operativo y no envía consultas reales.** Está preparado para activarse de forma controlada.

- **En producción (versión `c52105c5`, desplegada el 2026-11-08 con autorización):**
  - el servidor exige Turnstile;
  - no hay widget ni clave secreta y el correo está desactivado (`MAIL_MODE=disabled`);
  - todo envío recibe un 503 honesto. Nunca se simula un envío correcto;
  - la página del formulario advierte antes de llenarlo que no se enviará nada;
  - la política de privacidad describe Cloudflare y Email Service. Sigue siendo un **borrador pendiente de revisión jurídica**.
- Todo lo marcado como *rama* en este documento está desplegado en esa versión, salvo la activación, que sigue pendiente.
- **Para activarlo** hacen falta los 8 requisitos de [«Activación controlada»](#activación-controlada). Activar el formulario **no retira `noindex`**: la indexación sigue su propio proceso ([`src/config/lanzamiento.json`](../../src/config/lanzamiento.json)).

## Auditoría y cambios

| Función | Implementación previa | Problema | Acción | Riesgo | Estado final |
|---|---|---|---|---|---|
| Clave secreta de prueba | Se saltaban las comprobaciones de host y acción con cualquier clave `1x…AA` | Puesta por error en producción, **aprobaría cualquier token** (la de prueba solo acepta el token ficticio público) | Una clave secreta de prueba fuera de `localhost`, `127.0.0.1` o `[::1]` da `clave_de_prueba` y 503, sin consultar a Cloudflare. `TURNSTILE_VERIFY_URL` solo se admite en local | **Alto** | Rama, con prueba |
| Clave pública de prueba | No se controlaba | Podía publicarse un widget de prueba | La compilación de producción falla con una clave pública de prueba, y lo comprueban también el verificador de compilación y el de producción | Medio | Rama, con prueba |
| `internal-error` de Siteverify | Se trataba como rechazo: 403 | Se culpaba a la persona de una caída de Cloudflare | Un reintento con la misma `idempotency_key` y luego 503 `no_disponible` | Medio | Rama, con prueba |
| `missing-input-response` y `bad-request` | 403 `rechazado` | Sin distinguir | `falta` e `invalido` (403) | Bajo | Rama |
| Respuestas inesperadas (JSON no objeto, campos con otro tipo) | Parcial | Podían colarse tipos raros | Validación de tipos de cada campo | Bajo | Rama, con prueba |
| Correo no configurado | Se consultaba Siteverify y luego daba 503 | Gastaba una verificación sin poder enviar | `correoListo()` antes de Turnstile: 503 `cerrado` sin llamar a Cloudflare | Bajo | Rama, con prueba |
| Error del proveedor de correo | 503 con el mismo mensaje que «no configurado» | No distinguía los casos | **502** con su propio mensaje honesto | Bajo | Rama, con prueba |
| Mensaje de éxito | «Solicitud recibida» | Sugería que Evelyn ya la recibió, cuando solo el proveedor la aceptó | «Su solicitud se envió», y la página de confirmación pasa a «Solicitud enviada» | Bajo (veracidad) | Rama |
| Formulario cerrado | Sin aviso: se llenaba y recibía 503 | Invitaba a llenar un formulario que no envía | En producción sin widget, aviso antes del formulario. Los verificadores exigen que esté | Medio (UX y confianza) | Rama, con prueba |
| Momento de carga de Turnstile | Al llegar al paso 3 | Turnstile trata IP y señales del navegador **antes** del consentimiento | Se carga al marcar la autorización, y el texto de la autorización lo menciona | Medio (privacidad) | Rama, con prueba |
| Política de privacidad | Decía SMTP y «no carga recursos de terceros» | En producción el correo va por Cloudflare Email Service; no mencionaba a Cloudflare como alojamiento ni a Turnstile | Texto según la plataforma, con una sección de Turnstile que solo aparece con el widget. Pendiente de revisión jurídica | Medio (cumplimiento) | Rama, borrador |
| Estados de carga y errores | `aria-busy` y botón desactivado | Sin texto de progreso. Un 403 del WAF daba un mensaje genérico | «Enviando…», mensaje para el 403 del borde y *callbacks* de caducidad, tiempo agotado y navegador no compatible | Bajo | Rama, con prueba |
| `/consulta-no-enviada` | Motivos genéricos | No mencionaba la verificación sin JavaScript | Añade ese motivo cuando hay widget, y el de envío no habilitado cuando está cerrado. Nunca afirma un envío | Bajo | Rama |
| Ya correcto, sin cambios | Validación, tamaño, Content-Type, archivos, campo trampa, tiempo de llenado, límites, 405, `checkOrigin`, WAF 1–3 y rate limiting del borde, cabeceras, TLS | — | Se conservan | — | Activo |

## Arquitectura y orden de comprobaciones (`src/pages/api/consulta.ts`)

1. **Borde de Cloudflare:**
   - WAF 1 y 2 (sondeos);
   - WAF 3: solo POST del mismo origen a `/api/consulta`; el resto, 403;
   - rate limiting: 5 cada 10 s por IP, 429 `error code: 1015`.
2. **Worker:**
   - otros métodos: 405 con `Allow: POST` (defensa en profundidad; desde fuera se ve el 403 del WAF);
   - límite en memoria y binding `LIMITE_CONSULTAS`: 429;
   - Content-Type, tamaño de 20 000 bytes como máximo, sin archivos: 422;
   - campo trampa y tiempo de llenado: 422 «no se envió»;
   - validación de campos: 422 con errores por campo;
   - límite de envíos válidos: 429;
   - **correo configurado** (`correoListo()`): si no lo está, 503 `cerrado`;
   - **Turnstile** (Siteverify): 403 o 503;
   - **envío**: 200 solo cuando el proveedor acepta el mensaje; 502 si lo rechaza.

## Estados del formulario

| Estado | Condición | HTTP (JSON) | Sin JavaScript | Mensaje | ¿Envía? |
|---|---|---|---|---|---|
| **A.** No configurado | Falta proveedor, `MAIL_TO` o `MAIL_FROM`; en producción sin widget, la página lo advierte antes | 503 `cerrado: true` | 303 → `/consulta-no-enviada` | «El envío en línea no está disponible en este momento y su solicitud no se ha enviado…» | No |
| **B.** Token ausente o inválido | `falta`, `invalido`, `rechazado`, `caducado` (incluye reutilizado), `host`, `accion` | **403** `verificacion: true` | 303 | «No se pudo confirmar la verificación de seguridad y la solicitud no se ha enviado…» | No |
| **C.** Turnstile no disponible | Siteverify caído, lento o con `internal-error` tras un reintento; secreto ausente o inválido; clave de prueba en el dominio real | **503** `verificacion: true` | 303 | «No fue posible completar la verificación de seguridad…» | No |
| **D.** Demasiadas solicitudes | Worker: límite en memoria, binding o envíos. Borde: rate limiting | Worker: 429 JSON. Borde: 429 texto `1015` | 303 / página 1015 | «Ha enviado varias solicitudes en poco tiempo…» (también para el 429 del borde) | No |
| **E.** Verificado, sin correo | Igual que A: se detecta **antes** de Turnstile, sin gastar el token | 503 `cerrado` | 303 | Igual que A, sin revelar qué falta | No |
| **F.** Aceptado por el proveedor | `EMAIL.send()` (o SMTP) resolvió | 200 `ok: true` | 303 → `/consulta-recibida` | «Su solicitud se envió…». No afirma que haya llegado ni que se haya leído | Sí |
| **G.** Error del proveedor | El envío lanzó un error | **502** | 303 | «Hubo un error al enviar su solicitud y no se ha enviado…» | No |

Registros: solo el tipo de evento (`[formulario] turnstile <motivo>`, `envio_no_disponible`, `error_envio`, `cloudflare_email <código>`). Nunca datos, correos, IP ni tokens.

## Turnstile

### Widget (`ConsultaForm.astro` y `public/assets/js/site.js`)

| Decisión | Motivo |
|---|---|
| Solo en `/agendar-consulta` | El contenido jurídico se lee sin desafíos. Ninguna otra página carga ni admite Cloudflare en su CSP, y la compilación falla si alguna lo hace |
| **Carga al marcar la autorización** (o al enviar, si ya está marcada) | Turnstile trata la IP y señales del navegador: no empieza antes del consentimiento. Además no compite con el LCP |
| Script oficial `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` | Cloudflare exige cargarlo desde esa URL, sin copiarlo, cachearlo ni pasarlo por un proxy |
| Modo **Managed** (se elige al crear el widget) | Cloudflare decide si hace falta interacción. Casi siempre no la hay |
| `size: flexible`, `theme: light`, `language: es` | Ocupa el ancho del formulario en móvil (335 px a 375 px de ancho). El sitio no tiene modo oscuro. Interfaz y etiquetas de accesibilidad en español |
| 65 px reservados | Sin desplazamiento de diseño: CLS < 0,1, medido en la prueba del widget |
| `refresh-expired: auto` y `refresh-timeout: auto`, con *callbacks* de caducidad, tiempo agotado, error y navegador no compatible | Recuperación sin perder lo escrito y mensajes claros en español |
| `action: "consulta"` | El servidor rechaza tokens de otra acción |
| Reinicio del widget tras cualquier error | El token es de un solo uso |
| Sin JavaScript | Un `<noscript>` lo explica. El servidor rechaza el envío sin token: no hay forma de saltarse la verificación |

### Verificación en el servidor (`src/lib/turnstile.ts`)

`verificarTurnstile` envía `secret`, `response`, `remoteip` e `idempotency_key` a Siteverify, con 5 s de tiempo máximo por intento. **Exige:**

- secreto configurado;
- que no sea una clave de prueba fuera de local;
- token textual de 2048 caracteres o menos;
- `success === true`;
- `hostname` igual al host de la petición;
- `action === "consulta"`;
- `challenge_ts` de menos de 300 s.

**Ante un fallo pasajero** (red, 5xx o `internal-error`) reintenta una vez con la misma clave de idempotencia. Cualquier otro resultado se rechaza.

### Claves y entornos

| Entorno | Clave pública | Clave secreta | Dónde |
|---|---|---|---|
| Desarrollo | `1x00000000000000000000AA` (o ninguna) | `1x0000000000000000000000000000000AA`, o `TURNSTILE_MODE=off` | `.env` o `.dev.vars` locales (ignorados por git) y `.claude/launch.json` |
| Pruebas automatizadas | Ninguna, o la de prueba en `dist-turnstile/` | Las de prueba, con Siteverify simulado o real | `playwright.config.ts`, `tests/*` |
| Staging (si se crea) | Widget propio o el de producción con el hostname de staging añadido | Su propio secreto | Nunca claves de prueba: el servidor las rechaza fuera de local |
| Producción | Widget real, modo Managed, solo `evelynelizondo.com` (sin `localhost`) | `TURNSTILE_SECRET_KEY` como **secreto** del Worker | La clave pública en el entorno de `npm run deploy`. La secreta, nunca en `vars`, en el repositorio, en la documentación ni en el navegador |

Nombres: se mantiene la convención existente, `PUBLIC_TURNSTILE_SITE_KEY` (Astro solo expone al cliente las variables `PUBLIC_`) y `TURNSTILE_SECRET_KEY`.

**Límite de las claves de prueba:** devuelven `example.com` y ninguna acción, así que **no prueban** las comprobaciones de host y acción. Esas solo se prueban con el widget real (ver más abajo). Las pruebas unitarias las cubren con Siteverify simulado.

## Content Security Policy

**Política efectiva** en `/agendar-consulta`: el navegador aplica a la vez las dos políticas siguientes (su intersección). No se contradicen.

| Origen | Directivas | Por qué ahí |
|---|---|---|
| Cabecera HTTP (`src/lib/cabeceras.mjs`, `_headers` y Worker) | `frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'` | `frame-ancestors` **no funciona en una meta**. Las demás se repiten por defensa en profundidad |
| Meta por página (`Base.astro`, primer elemento del `<head>`) | `default-src 'self'; script-src 'self' 'sha256-…' [+ challenges]; frame-src 'self' [+ challenges]; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'` | El hash del único script en línea se calcula al compilar. Permite **ampliar solo la página del formulario** |

- **Turnstile:** `https://challenges.cloudflare.com` solo en `script-src` y `frame-src`, como indica Cloudflare, y **solo en la página del formulario y solo si hay widget**. No hace falta `connect-src`: no se usa *pre-clearance*.
- **Sin `unsafe-eval`.** Sin `unsafe-inline` en scripts: el único script en línea va por hash.
- **`style-src 'unsafe-inline'` se mantiene**, como riesgo aceptado: hay 417 atributos `style=` en el sitio. Quitarlo exige reescribir esos estilos. El riesgo de inyectar estilos es mucho menor que el de scripts, y los scripts siguen cerrados.
- **Mover la CSP completa a cabeceras:** se evaluó. Con `_headers` habría que quitar la regla general en la ruta del formulario (`! Content-Security-Policy`) y mantener 91 hashes por página en un archivo de máximo 100 reglas. No hay ventaja comprobable: lo que solo funciona en cabecera ya está en ella. Si se quisieran informes de violaciones (`report-to`), habría que hacerlo así.
- **Comprobado con la prueba del widget:**
  - el script de `example.com` inyectado en la página del formulario se bloquea;
  - no hay ninguna violación al cargar Turnstile;
  - las otras páginas no admiten Cloudflare.

## Coherencia con la política de privacidad

La misma compilación decide el widget, la CSP, el aviso de cierre y el texto de la política:

- Con `PUBLIC_TURNSTILE_SITE_KEY`, la política publica la sección `#seguridad-del-formulario` y deja de afirmar que «no carga recursos de terceros».
- Sin ella, no menciona Turnstile como activo.
- La compilación para Cloudflare describe Cloudflare (alojamiento, seguridad y Email Service). La de Node describe SMTP.
- `verificar-lanzamiento --compilacion` y `seguridad:produccion` **fallan** si la política, el widget, la CSP y el aviso no coinciden.
- En producción, la compilación **falla** si se usa la clave pública sin `politicaPrivacidad` aprobada en [`src/config/formulario.json`](../../src/config/formulario.json).

El borrador y los puntos que debe validar una persona abogada están en [privacy-policy-review.md](privacy-policy-review.md).

## Pruebas

| N.º | Prueba | Dónde | Resultado |
|---|---|---|---|
| 1 | Sin clave secreta de Turnstile | `turnstile.spec.ts`, servidor 4334 | 503, buzón vacío, sin llamada a Siteverify |
| 2 | Sin token | `turnstile.spec.ts` | 403, sin llamada a Siteverify |
| 3 | Token inválido | `turnstile.spec.ts` (unidad y endpoint) | 403, nada enviado |
| 4 | Token caducado | Unidad (`challenge_ts` de más de 300 s) y endpoint (`timeout-or-duplicate`) | 403 |
| 5 | Token reutilizado | Endpoint (`timeout-or-duplicate`) | 403, nada enviado |
| 6 | Error de Siteverify | Endpoint (502 e `internal-error`), unidad (red, tiempo agotado, reintento) | 503, nada enviado |
| 7 | Token válido de prueba | Endpoint, y widget real con Siteverify real (`test:turnstile`) | La verificación pasa y el envío continúa |
| 8 | Token válido, sin correo | `turnstile.spec.ts`, servidor 4335 | 503 `cerrado`, sin llamada a Siteverify y sin confirmación |
| 9 | Proveedor simulado que acepta | Buzón local, SMTP local (`forms-smtp.spec.ts`), Email Service de `wrangler dev` (`test:cf`) | 200 solo en pruebas. El token no viaja en el mensaje |
| 10 | Proveedor simulado que falla | `forms-smtp.spec.ts` (SMTP 550) | 502, y sin JavaScript 303 a la página de error |
| 11 | CSP | `turnstile-widget.spec.ts`, `verificar-lanzamiento`, `seguridad:produccion` | Turnstile carga sin violaciones. Otros orígenes, bloqueados. Restrictiva en el resto |
| 12 | Navegación pública | `turnstile-widget.spec.ts`, `sitio.spec.ts`, `seguridad:produccion` | Ninguna petición a Cloudflare ni desafío fuera del formulario |
| 13 | SEO | `seo.spec.ts`, `indexacion.spec.ts`, `seo:produccion` | `noindex` intacto |
| 14 | Rendimiento | `turnstile-widget.spec.ts` | Cero peticiones a Cloudflare antes del consentimiento. CLS < 0,1 al aparecer el widget. El resto del sitio no cambia |
| 15 | Métodos HTTP | `seguridad.spec.ts` (405) y `seguridad:produccion --esperar-waf` (403 del borde) | Cada capa mantiene su control |
| 16 | Sin JavaScript | Endpoint y widget real | 303 a `/consulta-no-enviada`, nada enviado, ningún bypass |

Comandos:

```bash
npx playwright test
```

```bash
npm run build:cf && npm run test:cf
```

```bash
npm run test:turnstile
```

`npm run test:turnstile` compila `dist-turnstile/` con la clave pública de prueba y usa el Siteverify real: necesita red. Con la clave de prueba, Cloudflare **no dejó cookies**. Hay que repetir esa comprobación con el widget real.

### Prueba con claves reales (entorno autorizado)

Las claves de prueba no validan host ni acción. Antes de declarar el formulario operativo:

1. Con el widget de producción ya creado, desplegar la nueva versión **al 0 %** (ver la activación, paso 6).
2. Abrir `https://evelynelizondo.com/agendar-consulta` con la cabecera `Cloudflare-Workers-Version-Overrides: evelyn-elizondo="<id>"`, desde una extensión de cabeceras o desde Playwright.
3. Hacer un envío real controlado:
   - debe responder 200;
   - el mensaje debe llegar al buzón;
   - el registro no debe mostrar `turnstile host` ni `turnstile accion`.
4. Hacer un segundo envío reutilizando el mismo token, por ejemplo repitiendo la petición desde DevTools: debe dar 403.
5. Revisar las cookies y el almacenamiento de `challenges.cloudflare.com`, y ajustar la política si hace falta.

**Pendiente de confirmar:** que la cabecera de *override* también sirve los **recursos estáticos** de la versión al 0 %. Si no los sirve, la página llegaría sin el widget.

## Activación controlada

**Requisitos** (todos a la vez). Los marcados como *registro* se anotan en [`src/config/formulario.json`](../../src/config/formulario.json) con responsable, fecha y evidencia. Lo hace una persona: nadie los marca por ella.

1. **Correo real de Evelyn**, verificado como destino en Cloudflare Email Routing y Email Service. *Registro:* `correoDestino`.
2. **Widget Turnstile de producción**, en modo Managed, con hostname `evelynelizondo.com` y sin `localhost`. *Registro:* `widgetProduccion`. Antes, resolver el token `lawyi-staging-setup` ([account-security.md](account-security.md)).
3. **Clave pública** del widget.
4. **Clave secreta** guardada como secreto del Worker.
5. **Proveedor de correo:**
   - `MAIL_MODE=cloudflare`, `MAIL_TO` y `MAIL_FROM` en `wrangler.jsonc`;
   - el binding `send_email` restringido con `destination_address`;
   - revisar la vista previa de mensajes de Email Service (se conserva unos 7 días) y desactivarla si no hace falta.
6. **Política de privacidad aprobada** y coherente. *Registro:* `politicaPrivacidad`.
7. **Pruebas completas** en verde.
8. **Autorización expresa de despliegue.**

**Procedimiento.** Cada paso con escritura en Cloudflare exige autorización expresa.

1. **Comprobación previa (solo lectura):** `PUBLIC_TURNSTILE_SITE_KEY=<pública> npm run formulario:preparar -- --remoto` debe terminar en «Listo».
2. **Secreto sin tocar el tráfico:**

   ```bash
   npx wrangler versions secret put TURNSTILE_SECRET_KEY --message "Turnstile: secreto de producción"
   ```

   - Crea una versión **sin desplegarla**.
   - **No usar `wrangler secret put`:** crea **y despliega** una versión al instante.
   - El valor se pega en el aviso interactivo: nunca en la línea de comandos, el historial ni un archivo.
3. **Compilación y verificaciones:**

   ```bash
   PUBLIC_TURNSTILE_SITE_KEY=<pública> npm run build:cf
   ```

   Después: `node scripts/seo/verificar-lanzamiento.mjs --compilacion`, `npm run test:cf`, `npx playwright test` y `npm run test:turnstile`.
4. **Subir la versión sin desplegar:** `npx wrangler versions upload --message "Formulario: Turnstile y correo"`. Anotar el `Version ID`.
5. **Comprobar que la versión subida conserva el secreto:** `npx wrangler versions secret list --latest-version` (solo nombres). Debe aparecer `TURNSTILE_SECRET_KEY`. Si no, repetir el paso 2 y subir de nuevo.
6. **Despliegue al 0 %** (con autorización): `npx wrangler versions deploy <actual>@100% <nueva>@0%`. Hacer la prueba con claves reales de la sección anterior, usando la cabecera de *override*.
7. **Promover** (con autorización): `npx wrangler versions deploy <nueva>@100%`.
8. **Verificar:**
   - `npm run seguridad:produccion -- --esperar-waf`: widget, CSP, sin aviso de cierre, política coherente y WAF;
   - `npm run seo:produccion`: `noindex` sigue;
   - un **envío real controlado** con datos de prueba de la propia responsable, nunca de clientes.
9. **Registrar:** `envioRealVerificado` en `formulario.json` y el resultado en [implementation-report.md](implementation-report.md). Solo entonces el formulario se declara operativo.

## Reversión

| Situación | Acción | Efecto |
|---|---|---|
| Falla la versión nueva | `npx wrangler rollback <versión anterior>` o `npx wrangler versions deploy <anterior>@100%` | Vuelve al formulario cerrado, con 503 honesto |
| Problema solo con el widget | Compilar sin `PUBLIC_TURNSTILE_SITE_KEY` y desplegar | Sin widget. La página muestra el aviso de cierre y el servidor sigue exigiendo el token (cerrado, nunca abierto) |
| Secreto comprometido | Turnstile → Rotate secret, y `wrangler versions secret put` con despliegue autorizado | Los tokens con el secreto anterior dejan de valer |
| Quitar el secreto | `npx wrangler versions secret delete TURNSTILE_SECRET_KEY` y desplegar | 503: cerrado, nunca abierto |
| Caída de Turnstile | Ninguna: el formulario responde 503 «Intente más tarde» | [incident-response.md](incident-response.md) §9. No hay interruptor de producción que lo apague, a propósito |

Versión actual: `c52105c5` (formulario cerrado, con aviso). Anterior estable: `d9386dca` (formulario cerrado, sin aviso). La anterior a esta rama es `5d023ca4`.
