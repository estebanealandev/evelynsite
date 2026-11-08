# Rate limiting

## Capas

| Capa | Dónde | Alcance | Estado |
|---|---|---|---|
| 1. Regla de rate limiting de zona | Borde, fase `http_ratelimit`, antes del Worker | `/api/consulta`: 5 peticiones cada 10 s por IP y centro de datos, con bloqueo de 10 s | **ACTIVA Y VERIFICADA** (2026-11-08) |
| 2. Binding `LIMITE_CONSULTAS` de Workers | Worker, en cada ubicación de Cloudflare | 10 peticiones por minuto por huella de IP | **ACTIVO** (desplegado el 2026-11-07) |
| 3. Límite en memoria | Worker, en cada aislamiento | 30 peticiones y 5 envíos válidos cada 10 min por IP (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MINUTES`) | **ACTIVO** |
| 4. Turnstile | Worker más Siteverify | Un token de un solo uso por envío | **IMPLEMENTADO LOCALMENTE** |

Ninguna capa es exacta:

- La regla de zona cuenta en cada centro de datos y con unos segundos de retraso.
- El binding es aproximado y se aplica por ubicación (documentación de Workers).
- El límite en memoria solo dura lo que vive el aislamiento.

**No se usa el límite en memoria como si fuera global.** Es un freno adicional y barato. El control fiable contra la automatización es Turnstile: cada envío necesita un desafío resuelto y el token solo se acepta una vez.

No se añadió estado compartido (Durable Objects o KV) porque aportaría poco con estas capas y sumaría una dependencia y escrituras al cupo Free.

## Regla de zona (plan Free)

La definición está en [`ops/cloudflare/seguridad/rate-limit-formulario.json`](../../ops/cloudflare/seguridad/rate-limit-formulario.json). El 2026-11-08 se validó con `--validate-only` y, con autorización, se aplicó a las 15:11 UTC (ruleset `fcdec1f34d3b419caee25e071699cd69`, versión 1). La fase no tenía entrypoint antes.

| Parámetro | Valor | Motivo |
|---|---|---|
| Expresión | `http.request.uri.path eq "/api/consulta"` | En Free, la expresión solo admite la ruta y el bot verificado. **No admite el método** |
| Características | `ip.src`, `cf.colo.id` | En Free solo se cuenta por IP. `cf.colo.id` es obligatorio |
| Periodo | 10 s | Único valor posible en Free |
| Peticiones por periodo | 5 | Ver la justificación debajo |
| Mitigación | 10 s | Único valor posible en Free |
| Acción | Block | Un desafío rompería el `fetch` JSON del formulario |

### Por qué 5 cada 10 segundos

- **Una persona** envía una vez. La validación del navegador evita los viajes inútiles al servidor y, tras un error, se reintenta en segundos, no en ráfaga. Cinco envíos en 10 s desde la misma IP no corresponden a un uso humano.
- **NAT, redes móviles, oficinas o VPN:** que varias personas de la misma IP envíen el formulario en la misma ventana de 10 s es muy improbable en un despacho de una sola profesional. Si ocurre, el bloqueo dura 10 s y el mensaje del formulario dice que se intente más tarde. No se pierde nada en silencio.
- **Pruebas** contra producción: no se hacen pruebas de carga. Las pruebas automatizadas corren en local.
- **Calibración:** cuando haya datos en Security Events, revisar cuántas peticiones a `/api/consulta` llegan a la regla. Si aparecen bloqueos de personas reales, se sube a 8 o 10.

El valor no se presenta como óptimo universal: es un punto de partida prudente.

### Método HTTP

Free no permite filtrar el rate limiting por método. Eso no hace falta, por tres razones:

1. La regla WAF 3 ya bloquea cualquier petición a `/api/*` que no sea un POST del mismo origen.
2. El Worker responde 405 a los demás métodos.
3. Las peticiones que bloquea el WAF no llegan al rate limiting, que se evalúa después.

Así, lo que cuenta la regla son, en la práctica, POST de envío.

### Lo que ve la persona usuaria

- **Con JavaScript:** el 429 del borde llega sin JSON. El formulario muestra «Ha enviado varias solicitudes en poco tiempo. Su solicitud no se ha enviado; espere unos segundos e intente de nuevo.» Este mensaje está en esta rama y llega a producción con el despliegue; hasta entonces se muestra el genérico «No fue posible procesar su solicitud y no se ha enviado.», que también es honesto.
- **Sin JavaScript:** el navegador muestra la página de error 1015 de Cloudflare durante 10 s. Es poco probable (hacen falta 6 envíos en 10 s) y no simula ningún éxito.

### Impacto en SEO

Ninguno. La regla solo afecta a `/api/consulta`, que está excluida en `robots.txt` y que ningún buscador necesita. No limita el rastreo de páginas.

### Aplicar, probar y revertir

```bash
cf rulesets entrypoint update http_ratelimit -z 3c656474ab87b43af43563a939e20f23 --body "$(jq 'del(."$comentario")' ops/cloudflare/seguridad/rate-limit-formulario.json)"
```

- **Prueba:** no se hace una prueba de carga contra producción. En local, `tests/limite.spec.ts` prueba el límite del Worker y `tests/sitio.spec.ts` el mensaje del formulario ante un 429 del borde.
- **Verificación del 2026-11-08** (8 POST seguidos del mismo origen con datos vacíos, que el Worker rechaza sin enviar nada):
  - los 5 primeros: 422 JSON del Worker;
  - del 6.º al 8.º: **429** `text/plain`, cuerpo `error code: 1015`, `Retry-After: 10`, `server: cloudflare`. Es la respuesta del borde, no la del Worker (que responde en JSON);
  - 12 s después: 422 otra vez. La portada siguió en 200 durante la prueba.
- **Reversión:** `cf rulesets entrypoint update http_ratelimit -z 3c656474ab87b43af43563a939e20f23 --body '{"rules":[]}'`, o desactivarla en el panel.

## Defensa en profundidad del formulario

| Control | Implementación | Prueba |
|---|---|---|
| Método | Solo POST; los demás reciben 405 con `Allow: POST` | `tests/seguridad.spec.ts` |
| Origen | `checkOrigin` de Astro más la regla WAF 3 | `tests/sitio.spec.ts` |
| Content-Type | Solo `application/x-www-form-urlencoded` y `multipart/form-data` | `tests/seguridad.spec.ts` (JSON rechazado) |
| Tamaño | Cuerpo de 20 000 bytes como máximo, leído en *streaming*. No se confía en `Content-Length` | `tests/seguridad.spec.ts` |
| Archivos | Si llega uno, se rechaza la petición entera | `tests/seguridad.spec.ts` |
| Validación | Longitudes, tipos, correo sin separadores múltiples, sin caracteres de control ni etiquetas | `tests/sitio.spec.ts` |
| Campo trampa y tiempo de llenado | Mínimo 3 s, medido en el navegador | `tests/sitio.spec.ts` |
| Turnstile | Siteverify con host, acción y antigüedad. Un solo uso | `tests/turnstile.spec.ts` |
| Repetición | El token se rechaza en el segundo uso (`timeout-or-duplicate`) | `tests/turnstile.spec.ts` |
| Errores | Mensajes genéricos y nunca un éxito simulado (503 si no se puede enviar) | `tests/forms-disabled.spec.ts` |
| Registros | Solo el tipo de fallo (`turnstile caducado`, `envio_no_disponible`), nunca datos ni tokens | Revisión de código |
| Caché | `Cache-Control: no-store` en todas las respuestas | `tests/seguridad.spec.ts` |
