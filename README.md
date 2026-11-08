# Evelyn Elizondo | Derecho de Familia | Costa Rica

Sitio corporativo en [Astro](https://astro.build) con páginas estáticas, un Worker de Cloudflare para el formulario y todos los recursos alojados localmente.

> **Antes de publicar:** complete la lista de [pendientes de publicación](#pendientes-de-publicación). Hasta entonces el sitio se compila siempre con `noindex` (meta robots y `X-Robots-Tag`). La indexación solo se habilita con el procedimiento de [docs/seo/indexation-release-checklist.md](docs/seo/indexation-release-checklist.md).

## Requisitos

- Node.js 22.9 o superior.
- Google Chrome, solo para las pruebas y para regenerar las imágenes.

## Instalación y desarrollo

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

Queda disponible en http://localhost:4321. Para probar formularios sin correo real, use `MAIL_MODE=outbox`: los mensajes se guardan en `var/outbox/`.

## Producción

Las variables `PUBLIC_*` se incorporan **al compilar**: después de cambiarlas, hay que volver a ejecutar `npm run build`. Las demás se leen al iniciar el servidor.

```bash
npm run build
```

```bash
NODE_ENV=production HOST=0.0.0.0 PORT=4321 npm start
```

## Variables de entorno

Consulte [.env.example](.env.example).

| Variable | Función |
|---|---|
| `PUBLIC_SITE_URL` | Dominio definitivo. Canonical, sitemap, Open Graph y validación del origen de formularios |
| `SEO_INDEXING_ENABLED` | `true` pide indexar. Solo funciona con `SITE_ENV=production`, el dominio real y todos los requisitos de `src/config/lanzamiento.json` aprobados; si falta algo, la compilación falla. `PUBLIC_SITE_READY` ya no se fija a mano: se deriva de esta política |
| `SITE_ENV` | `development` (por defecto), `preview`, `staging` o `production`. Solo `production` puede indexar |
| `PUBLIC_PROFILE_APPROVED` | `true` declara el servicio profesional en los datos estructurados (ver docs/seo/structured-data.md) |
| `PUBLIC_CONTACT_*` | Teléfono, correo, dirección y horario. Si están vacíos, no se muestran |
| `PUBLIC_DATA_CONTROLLER*`, `PUBLIC_PRIVACY_*` | Datos de la política de privacidad |
| `MAIL_MODE` | `smtp`, `outbox` o `disabled` |
| `MAIL_TO`, `MAIL_FROM`, `SMTP_*` | Configuración de correo |
| `TRUST_PROXY` | Activar solo detrás de un proxy de confianza |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MINUTES` | Límite de solicitudes |
| `PUBLIC_TURNSTILE_SITE_KEY` | Clave pública del widget Turnstile (al compilar). Sin ella no se dibuja el widget |
| `TURNSTILE_SECRET_KEY` | **Secreto** del servidor para verificar el token (en Workers, `wrangler secret put`). Sin él, el formulario responde 503 |
| `TURNSTILE_MODE` | Solo `off` para pruebas o desarrollo. Únicamente surte efecto en `localhost` o `127.0.0.1` |

## Formularios

Hay un endpoint: `/api/consulta`.

- **Proveedor:** cualquiera con SMTP, como el correo del dominio o un servicio transaccional. Las claves se guardan solo en variables del servidor.
- **Protección:** validación en navegador y servidor, saneamiento, campo trampa, tiempo mínimo, límite por IP (huella hash en memoria), verificación de origen y **Cloudflare Turnstile** verificado en el servidor (host, acción, antigüedad y un solo uso). Los métodos distintos de POST reciben 405. Ver [docs/security/turnstile-implementation.md](docs/security/turnstile-implementation.md).
- **Sin configurar:** con `MAIL_MODE=disabled` responde 503 y avisa que la solicitud no se envió.
- **Registros:** nunca contienen datos de la persona. Solo aparecen eventos como `[formulario] envio_no_disponible` o `error_envio`.
- **Sin JavaScript:** el envío nativo redirige a `/consulta-recibida` o `/consulta-no-enviada`.

### Activar el envío real

1. Configure `MAIL_MODE=smtp`, `MAIL_TO`, `MAIL_FROM` y `SMTP_*`.
2. Reinicie el servidor.
3. Envíe una consulta de prueba y confirme que llega.

El límite de solicitudes vive en memoria: si despliega varias instancias, cada una cuenta por separado.

## Despliegue

El sitio está en **Cloudflare Workers**, en `https://evelynelizondo.com`. Las páginas son recursos estáticos y solo `/api/consulta` ejecuta el Worker.

```bash
npm run deploy
```

Compila con `DESTINO=cloudflare` y publica con Wrangler, con la sesión de `npx wrangler login`. La configuración está en `wrangler.jsonc`.

| Pieza | Dónde |
|---|---|
| Cabeceras de seguridad y caché | `src/lib/cabeceras.mjs`. Se escriben en `_headers` al compilar y el middleware las añade a las respuestas del Worker |
| Código que depende del entorno | `#plataforma`: `src/lib/plataforma.ts` en Node y `plataforma-cloudflare.ts` en Workers |
| Límite de envíos | El de memoria más el binding `LIMITE_CONSULTAS`, compartido por ubicación |
| Correo | Binding `EMAIL` del Email Service de Cloudflare, con `MAIL_MODE=cloudflare` |
| Registros | `npx wrangler tail evelyn-elizondo`. No se registra cada petición; solo los eventos del formulario, sin datos personales |

Para probar la compilación de Workers en local, con el runtime de Cloudflare:

```bash
npm run build:cf
```

```bash
npm run test:cf
```

### Activar el correo del formulario

1. En el panel de Cloudflare, activar Email Routing en el dominio y verificar la dirección de destino. El envío a una dirección verificada no tiene coste.
2. En `wrangler.jsonc`, poner `MAIL_MODE` en `cloudflare` y añadir `MAIL_TO` y `MAIL_FROM` (una dirección del dominio) en `vars`.
3. `npm run deploy` y enviar una consulta de prueba.

### Otro alojamiento

El servidor Node sigue disponible: `npm run build` y `npm start` detrás de un proxy con HTTPS, con `TRUST_PROXY=true`.


### SEO y verificación

| Comando | Para qué |
|---|---|
| `npm run seo:verificar` | Compila, audita y ejecuta las pruebas SEO y de indexación |
| `npm run seo:auditar` / `seo:inventario` | Auditoría de `dist/`; la segunda escribe `docs/seo/inventario-rutas.md` |
| `npm run seo:lanzamiento` | Requisitos de lanzamiento pendientes |
| `npm run seo:dnssec` | Cadena DNSSEC del dominio (solo lectura) |
| `npm run seo:produccion` | Revisa el sitio publicado: redirecciones, robots, canonical (solo lectura) |
| `npm run seo:imagenes` | Regenera las imágenes sociales 1200 × 630 de `public/assets/og/` |

`npm run deploy` comprueba que la compilación sea coherente con la política de indexación antes de subirla. Documentación en [docs/seo/](docs/seo/).

### Seguridad

| Comando | Para qué |
|---|---|
| `npm run seguridad:produccion` | Revisa el sitio publicado: cabeceras, CSP, métodos del formulario, rutas sensibles, lectura pública sin desafíos, HTTPS y TLS (solo lectura) |
| `npm run seguridad:produccion -- --esperar-waf` | Además, exige que las reglas WAF estén aplicadas (403 en el borde) |
| `npm run formulario:preparar [-- --remoto]` | Dice qué falta para activar el formulario: registro de `src/config/formulario.json`, clave pública, correo y, con `--remoto`, el secreto del Worker (solo lectura; no despliega) |
| `npm run test:turnstile` | Compila `dist-turnstile/` con la clave pública de prueba y prueba el widget real contra el Siteverify real (necesita red) |

`npm run deploy` también se detiene si `dist/` contiene archivos sensibles (ocultos, *source maps*, copias, claves), si la CSP de Turnstile no coincide con el widget o si la política de privacidad y el aviso de cierre no coinciden con él. Una compilación de producción con la clave de Turnstile falla si los requisitos de `src/config/formulario.json` no están aprobados. Activar el formulario: [docs/security/turnstile-implementation.md](docs/security/turnstile-implementation.md#activación-controlada). Las reglas de Cloudflare preparadas están en [ops/cloudflare/seguridad/](ops/cloudflare/seguridad/) y la documentación en [docs/security/](docs/security/).
## Actualizar contenido

| Contenido | Ubicación |
|---|---|
| Áreas de servicio | `src/content/servicios/*.md` |
| Artículos | `src/content/articulos/*.md` |
| Fuentes normativas | `src/lib/sources.ts` |
| Textos institucionales | `src/lib/institucional.ts` |
| Navegación y datos generales | `src/config/site.ts` |
| Colores y tipografía | `:root` en `src/styles/global.css` |
| Marca | `scripts/instalar-marca.mjs`, desde `design/branding-evelyn` |
| Imágenes | `scripts/generate-art.mjs` |

Para añadir una fotografía real, por ejemplo el retrato, guárdela en `public/assets/images/` con una versión `-sm` y sustituya el panel `.monogram-panel` de `src/pages/sobre-evelyn.astro`.

Al cambiar una norma, actualice `legalVerifiedAt` en `src/config/site.ts`.

## Escena del árbol

La portada carga la escena 3D de forma diferida, con three.js alojado localmente. No se carga con movimiento reducido, ahorro de datos, poca memoria o sin WebGL: en esos casos se muestra una imagen del árbol.

- **Regenerar la imagen de reserva:** con el servidor en marcha, `BASE=http://127.0.0.1:4321 npm run poster`, y luego volver a compilar.

## Pruebas

| Comando | Qué hace |
|---|---|
| `npm run build` y luego `npm test` | Rutas, dependencias, formularios, SMTP, API, interacciones y accesibilidad |
| `npm run audit:identity` | Busca referencias residuales de la identidad anterior |
| `npm run check` | Tipos de TypeScript |
| `npm run test:visual` | Compara con las métricas de referencia. Requiere el servidor en marcha y `BASE=http://127.0.0.1:4321` |
| `npm run capture -- <fase>` | Guarda capturas y métricas de una fase del rediseño. Requiere el servidor en marcha |

## Pendientes de publicación

La lista completa está en [docs/legal-compliance-audit.md](docs/legal-compliance-audit.md). Lo imprescindible:

1. Revisión de todos los textos por una persona profesional en derecho de Costa Rica.
2. Confirmación de servicios, datos profesionales y fotografía de Evelyn Elizondo.
3. Datos de contacto y de privacidad, correo SMTP y dominio.
4. Con todo lo anterior, seguir [docs/seo/indexation-release-checklist.md](docs/seo/indexation-release-checklist.md).

## Documentación

- [Inventario del sitio](docs/site-inventory.md)
- [Informe de reconstrucción](docs/reconstruction-report.md)
- [Auditoría jurídica](docs/legal-compliance-audit.md)
- [Auditoría de identidad](docs/branding-audit.md)
- [Plan de UX y diseño](docs/plan-ux-diseno.md)
- [Comparación estructural](docs/reference/structure-comparison.md)
- [Guía de marca](public/assets/brand/brand-guidelines.md)
- [Seguridad en Cloudflare Free](docs/security/implementation-report.md)

`docs/reference/` contiene capturas del sitio de referencia solo para auditoría interna. No debe publicarse.

## Auditoría y normas

El estado completo está en [docs/auditoria-evelyn/informe-final.md](docs/auditoria-evelyn/informe-final.md).

```bash
npm run normas:verificar    # comprueba la matriz contra la copia oficial
npm run normas:vigilar      # compara con SINALEVI y señala las afirmaciones afectadas
npm run normas:descargar    # actualiza la copia, solo si llegan todas las normas
npm run test:navegadores    # Firefox, WebKit e iPhone emulado
```

`npm start` usa `scripts/servidor.mjs`, que añade las cabeceras de seguridad. Detrás de un proxy, usar `HOST=127.0.0.1` y `TRUST_PROXY=true`. Schibsted Grotesk se guarda como subconjunto en `public/assets/fonts`.
