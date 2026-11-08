# Cabeceras de seguridad y CSP

## Dónde se aplica cada cabecera

`_headers` solo afecta a las respuestas de Static Assets, no a las que genera el código del Worker. Por eso hay dos caminos, ambos probados:

| Respuesta | Mecanismo | Prueba |
|---|---|---|
| Páginas y recursos estáticos | `dist/client/_headers`, generado en `astro.config.mjs` a partir de `src/lib/cabeceras.mjs` | `tests/seguridad.spec.ts` (en Node y en `wrangler dev`) y `npm run seguridad:produccion` |
| `/api/consulta`, 405 y 404 | `src/middleware.ts`, con las mismas cabeceras | `tests/seguridad.spec.ts` (405 con `x-robots-tag` y `no-store`) |
| 403 de `checkOrigin` de Astro | Astro, antes del middleware: `text/plain` fijo, sin cabeceras propias | Aceptado: contenido constante y sin HTML. Con la regla WAF 3 activa, ese 403 lo da el borde |

## Política

| Cabecera | Valor | Notas |
|---|---|---|
| `Content-Security-Policy` (cabecera) | `frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'` | Las directivas que no funcionan en `<meta>` |
| `Content-Security-Policy` (`<meta>` por página) | `default-src 'self'; script-src 'self' 'sha256-…'; frame-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'` | En `/agendar-consulta`, y solo si hay widget, `script-src` y `frame-src` añaden `https://challenges.cloudflare.com` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Sin `preload` ([tls-dnssec.md](tls-dnssec.md) §4) |
| `X-Content-Type-Options` | `nosniff` | — |
| `X-Frame-Options` | `DENY` | Por compatibilidad con navegadores antiguos; `frame-ancestors` ya lo cubre |
| `Referrer-Policy` | `same-origin` | No envía la URL a sitios externos y conserva `Origin` en el POST |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` | `interest-cohort` (FLoC) se sustituyó por `browsing-topics` |
| `Cross-Origin-Opener-Policy` | `same-origin` | — |
| `Cache-Control` | HTML: `no-store`. `/_astro/*`: un año e `immutable`. `/assets/*`: 1 h. API: `no-store` | — |
| `X-Robots-Tag` | `noindex, nofollow` en todo hasta el lanzamiento | La gestiona la política de indexación |

### Por qué la CSP completa va en `<meta>` y no en la cabecera

- La CSP cambia por página: la del formulario admite Turnstile y las demás no.
- `_headers` **une con coma** las cabeceras de varias reglas que coinciden. Dos CSP unidas se aplican las dos a la vez, como intersección. Con `/*` y `/agendar-consulta` en la cabecera, la de `/*` bloquearía Turnstile.
- La división actual (cabecera para `frame-ancestors`, `base-uri`, `object-src` y `form-action`; `<meta>` para el resto) da el mismo resultado sin ese problema.

### Sobre `'unsafe-inline'` en `style-src`

Las plantillas usan atributos `style` y Astro inserta estilos con ámbito. Quitarlo exigiría reescribir el marcado, y el riesgo de inyectar CSS es bajo cuando los scripts en línea están prohibidos. Se mantiene. Los scripts en línea **no** se admiten: solo el script inicial, por su hash SHA-256.

### Evaluado y no adoptado

| Opción | Motivo |
|---|---|
| `Content-Security-Policy-Report-Only` con un punto de recepción de informes | Exigiría un endpoint que reciba informes, lo que suma superficie y consumo del cupo, o un tercero. La consigna prohíbe enviar informes a proveedores no autorizados. En su lugar, cada ejecución de las pruebas recorre las páginas en Chrome y **falla si hay violaciones de CSP en la consola** (`tests/seguridad.spec.ts`, `tests/sitio.spec.ts`). Además, la integración de Turnstile se comprobó sin violaciones |
| `require-trusted-types-for 'script'` | El árbol 3D (three.js) y Astro manipulan el DOM. Habría que auditarlos antes. Riesgo de romper la portada |
| `Cross-Origin-Resource-Policy: same-origin` en imágenes | Impediría que Google Imágenes o las redes sociales muestren las imágenes del sitio dentro de su propia página. Contradice la estrategia SEO |
| `Cross-Origin-Embedder-Policy` | No hace falta: no se usa `SharedArrayBuffer`. Y bloquearía el iframe de Turnstile |
| CSP con *nonce* | El sitio es estático: un *nonce* por respuesta exigiría ejecutar el Worker en cada página, con más CPU, más cupo y peor TTFB. El hash cumple la misma función |

## Pruebas realizadas

- `tests/seguridad.spec.ts`:
  - cabeceras en `/` y en `/servicios/proteccion-familiar`;
  - que la CSP no admite `'unsafe-inline'` en scripts y que el script inicial corre sin violaciones;
  - que no se carga ningún recurso de terceros en `/` ni en `/agendar-consulta` (sin clave de Turnstile en la compilación de pruebas);
  - que el 405 lleva `no-store` y `X-Robots-Tag`.
- `npm run seguridad:produccion` (2026-11-08, versión `5d023ca4`, anterior a esta rama): todas las cabeceras están presentes en producción; la única diferencia es el 405, que llega con esta rama.
- Integración local de Turnstile: sin violaciones de CSP ([turnstile-implementation.md](turnstile-implementation.md)).
