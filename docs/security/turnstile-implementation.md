# Cloudflare Turnstile en el formulario de consulta

**Estado: IMPLEMENTADO y desplegado sin widget** (2026-11-08, versión `d9386dca`). El servidor ya exige el token: sin secreto, el formulario responde 503 «No fue posible completar la verificación de seguridad…», sin éxito simulado. Para activarlo hacen falta, con autorización, la política de privacidad revisada y:

1. Crear el widget.
2. Fijar la clave pública al compilar.
3. Guardar la clave secreta como secreto del Worker y volver a desplegar.

El envío de correo sigue desactivado (`MAIL_MODE=disabled`) hasta tener la dirección real de Evelyn. **Nunca se simula un envío correcto.**

## Diseño

| Decisión | Motivo |
|---|---|
| Solo en `/agendar-consulta` | El contenido jurídico se lee sin desafíos y no se carga nada de Cloudflare en el resto del sitio |
| El script se carga al llegar al paso 3 del formulario (o al enfocarlo, si no tuviera pasos) | No compite con el LCP, no se descarga si la persona no llega a enviar y el token se emite cerca del envío (vale 300 s, y caduca y se renueva solo con `refresh-expired: auto`) |
| Renderizado explícito (`?render=explicit` y `turnstile.render`) | Control del momento y de los callbacks |
| `size: flexible`, `min-height: 65px` reservado | Sin desplazamiento de diseño al aparecer el widget |
| `action: "consulta"` | El servidor rechaza tokens emitidos para otra acción |
| `language: es` | La interfaz del widget en español |
| Se reinicia el widget tras cualquier error | El token es de un solo uso: hace falta uno nuevo para el siguiente intento |
| Sin JavaScript | Un `<noscript>` lo explica. El servidor rechaza el envío y redirige a `/consulta-no-enviada`. No hay éxito falso |
| Turnstile se verifica **después** de validar los campos | Un error de escritura no gasta el token ni una llamada a Siteverify |

## Verificación en el servidor (`src/lib/turnstile.ts`)

`verificarTurnstile` envía `secret`, `response` y `remoteip` a `https://challenges.cloudflare.com/turnstile/v0/siteverify`, con un tiempo máximo de 5 s, y exige todo lo siguiente:

| Comprobación | Si falla |
|---|---|
| Secreto configurado | 503 `sin_configurar`: nunca se acepta sin verificar |
| Token presente, textual y de 2048 caracteres o menos | 403 `falta` o `invalido`, sin llamar a Cloudflare |
| `success === true` (estricto) | 403 `rechazado` |
| `error-codes` con `timeout-or-duplicate` | 403 `caducado`: token caducado o **reutilizado** |
| `invalid-input-secret` o `missing-input-secret` | 503 `sin_configurar` (error de configuración, registrado) |
| `hostname` igual al host de la petición (`evelynelizondo.com`) | 403 `host` |
| `action === "consulta"` | 403 `accion` |
| `challenge_ts` de menos de 300 s | 403 `caducado` |
| Siteverify inalcanzable, lento, distinto de 200 o con JSON inválido | 503 `no_disponible` |

Con las **claves secretas de prueba oficiales** (`1x…AA`, `2x…AA`, `3x…AA`), Cloudflare devuelve otro hostname y ninguna acción, así que esas dos comprobaciones no se aplican. Solo con esas claves se admite `TURNSTILE_VERIFY_URL`, un Siteverify simulado para las pruebas: con una clave real, la URL de verificación no se puede desviar.

El registro solo anota el motivo (`[formulario] turnstile caducado`), nunca el token, la IP ni los datos.

### Apagado solo en local

`TURNSTILE_MODE=off` solo surte efecto cuando el host de la petición es `localhost`, `127.0.0.1` o `[::1]`. En el dominio real es imposible apagarlo con una variable. Se comprobó en `wrangler dev`: sin `--local-upstream`, el Worker ve `evelynelizondo.com` como host y **mantiene Turnstile obligatorio aunque se pase `TURNSTILE_MODE=off`**.

## Variables

| Variable | Tipo | Dónde | Valor |
|---|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Pública, al compilar | `build:cf` o `.env` local | La clave del widget. Sin ella no se dibuja el widget y la CSP no admite Cloudflare |
| `TURNSTILE_SECRET_KEY` | **Secreto** del Worker | `wrangler secret put TURNSTILE_SECRET_KEY` | Nunca en `vars`, en el repositorio ni en el navegador |
| `TURNSTILE_MODE` | Var | Solo en pruebas o desarrollo | `off`, efectivo solo en local |
| `TURNSTILE_VERIFY_URL` | Var | Solo en pruebas | Se ignora salvo con una clave de prueba |

Separación de entornos:

- desarrollo y pruebas usan las claves de prueba oficiales;
- producción usa el widget real, limitado al hostname `evelynelizondo.com`;
- si se crea un *staging*, tendrá su propio widget o, en su defecto, el mismo widget con su hostname añadido.

## CSP

Solo la página del formulario añade `https://challenges.cloudflare.com` a `script-src` y `frame-src`, como pide la documentación de Turnstile. No hace falta `connect-src` porque no se usa *pre-clearance*. La portada y el resto del sitio no lo admiten.

- `scripts/seo/verificar-lanzamiento.mjs --compilacion` impide desplegar si:
  - la portada admite Turnstile;
  - el widget y la CSP no coinciden;
  - se intenta un lanzamiento indexable sin widget.
- `npm run seguridad:produccion` hace la misma comprobación sobre el sitio publicado.

## Pruebas

| Prueba | Resultado |
|---|---|
| `tests/turnstile.spec.ts`, unidad (7 casos) | Secreto, IP, token ausente o largo, host, acción, antigüedad, códigos de error, `success` estricto, caída, error 500 y tiempo máximo |
| `tests/turnstile.spec.ts`, endpoint Node con Siteverify simulado (6 casos) | Sin token da 403 sin llamar a Cloudflare. Un formulario inválido no gasta el token. Un token aprobado da 200. Reutilizado o rechazado da 403. Siteverify caído da 503. Sin JavaScript da 303 a la página de error |
| `tests/turnstile.spec.ts`, modo | `off` solo en hosts locales, nunca en `evelynelizondo.com` ni en `localhost.evelynelizondo.com` |
| Integración real, local, 2026-11-08 | Compilación con la clave pública de prueba `1x00000000000000000000AA` y servidor Node con la secreta de prueba, **verificando contra el Siteverify real de Cloudflare**. El script solo se cargó al llegar al paso 3. El widget emitió `XXXX.DUMMY.TOKEN.XXXX` y ocupó su espacio reservado (73 px). No hubo violaciones de CSP en la consola. El envío respondió «Solicitud recibida» y el mensaje del buzón local no contenía el token |

## Activación en producción (requiere autorización)

1. **Política de privacidad.** Hoy dice que el sitio «no carga recursos de terceros para mostrar sus páginas». Con Turnstile, la página del formulario carga un script de Cloudflare, que procesa datos técnicos del navegador para la verificación. La redacción jurídica corresponde a la revisión profesional: no se modificó.
2. Crear el widget en Cloudflare → Turnstile, en modo *Managed*, con el hostname `evelynelizondo.com`. Es gratis: hasta 20 widgets.
3. Añadir `PUBLIC_TURNSTILE_SITE_KEY=<clave pública>` al script `build:cf`. Es pública y puede ir en el repositorio.
4. Guardar `TURNSTILE_SECRET_KEY` con `npx wrangler secret put TURNSTILE_SECRET_KEY`. **Esto crea y despliega una versión nueva del Worker.**
5. `npm run deploy`, después `npm run seguridad:produccion` y un envío real de prueba cuando el correo esté activo.

**Si se despliega esta rama sin los pasos 2 a 4:**

- no se muestra ningún widget;
- el servidor responde 503 con un mensaje claro, porque sin secreto Turnstile está «sin configurar»;
- hoy el formulario ya responde 503 por el correo desactivado, así que no se rompe nada que funcione.

## Reversión

- **Quitar el widget:** compilar sin `PUBLIC_TURNSTILE_SITE_KEY` y desplegar.
- **Quitar el secreto:** `npx wrangler secret delete TURNSTILE_SECRET_KEY`. Despliega una versión nueva, y el formulario queda en 503, nunca abierto.
- **Retirar el requisito en el servidor:** revertir el commit. No hay ningún interruptor de producción que lo apague, a propósito.
- Si el servicio de Turnstile falla durante un incidente, el formulario responde 503 «Intente más tarde» ([incident-response.md](incident-response.md) §9).
