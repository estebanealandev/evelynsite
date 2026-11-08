# Informe de implementación de seguridad (Cloudflare Free)

- **Fecha:** 2026-11-08
- **Rama:** `security/cloudflare-free-hardening`, creada desde `seo/geo-enterprise-2026` (`54a797e`, la versión desplegada).
- **Sin push ni merge.** `main` intacta.
- **Producción sin cambios:** ni despliegue, ni reglas, ni DNS, ni ajustes de zona o de cuenta.
- **`noindex` vigente.** No se envió ningún sitemap.
- **Coste:** ninguno.

## Resumen ejecutivo

1. **La base de Cloudflare Free ya es sólida y está verificada:**
   - Free Managed Ruleset activo (bloquea la firma de Log4Shell);
   - DDoS siempre activo;
   - TLS 1.2 como mínimo y 1.3 activo, con 1.0 y 1.1 rechazados;
   - HTTPS con 301 y HSTS;
   - sin `workers.dev` ni URL de vista previa;
   - ningún hostname secundario;
   - DNS limpio, sin riesgo de toma de subdominios;
   - SPF `-all` y DMARC `reject`.
2. **Los riesgos más graves no son técnicos, son de la cuenta:**
   - **la cuenta no tiene 2FA**;
   - hay **tokens de API sin caducidad**, uno de ellos sin uso, con escritura sobre Access en todas las cuentas.

   Ambas cosas las tiene que hacer el propietario ([account-security.md](account-security.md)).
3. **El formulario, único punto de escritura, tiene ahora defensa en profundidad:**
   - Turnstile con verificación Siteverify estricta en el servidor (host, acción, antigüedad y un solo uso), que no se puede apagar en el dominio real;
   - 405 para otros métodos.
   - En el borde quedan preparadas una regla WAF de método y origen y una de rate limiting.
4. **El cupo gratuito se usa con criterio:**
   - 3 de las 5 reglas WAF, cada una ligada a una amenaza observada: los sondeos que hoy consumen invocaciones del Worker y el spam directo a la API;
   - la única regla de rate limiting, en el formulario;
   - 2 reglas reservadas para incidentes y patrones reales.
5. **Compatibilidad SEO y GEO:** ningún control toca la lectura pública. Bot Fight Mode, AI Labyrinth, Hotlink Protection y los bloqueos de IA en el borde **se dejan desactivados** con su justificación.
6. **Pendientes que no dependen del código:**
   - la publicación del DS de DNSSEC;
   - el widget y el secreto de Turnstile;
   - el correo real;
   - la decisión sobre el entrenamiento de IA;
   - la actualización de la política de privacidad para Turnstile.

## Cambios en el repositorio

| Archivo | Cambio |
|---|---|
| `src/lib/turnstile.ts` (nuevo) | Verificación Siteverify, test keys oficiales, modo local |
| `src/lib/form-endpoint.ts` | `comprobarTurnstile`, respuestas `verificacion` (403/503) y `metodo` (405) |
| `src/pages/api/consulta.ts` | Turnstile tras validar; `ALL` → 405 `Allow: POST` |
| `src/lib/plataforma.ts`, `src/lib/plataforma-cloudflare.ts` | `variable()`: lee vars y secretos desde los bindings en Workers |
| `src/components/forms/ConsultaForm.astro` | Contenedor del widget en el paso 3, aviso y `<noscript>` |
| `src/layouts/Base.astro`, `src/pages/agendar-consulta.astro` | CSP: `challenges.cloudflare.com` solo en el formulario y solo con widget |
| `src/config/site.ts` | `turnstile` (clave pública) |
| `src/styles/global.css` | Espacio reservado del widget (65 px) |
| `public/assets/js/site.js` | Carga diferida de Turnstile, token obligatorio antes de enviar y reinicio tras un error |
| `src/lib/cabeceras.mjs` | `Permissions-Policy`: `browsing-topics=()` |
| `scripts/seo/verificar-lanzamiento.mjs` | Bloquea el despliegue si hay archivos sensibles o la CSP de Turnstile no es coherente |
| `scripts/seguridad/verificar-produccion.mjs` (nuevo), `package.json` | `npm run seguridad:produccion [-- --esperar-waf]` |
| `wrangler.jsonc` | Documenta que el secreto va con `wrangler secret put`, nunca en `vars` |
| `playwright.config.ts` | `TURNSTILE_MODE=off` en los servidores de prueba locales y `--local-upstream` en `wrangler dev` |
| `tests/turnstile.spec.ts` (nuevo), `tests/seguridad.spec.ts` | 14 pruebas de Turnstile y el 405 con 6 métodos |
| `ops/cloudflare/seguridad/` (nuevo) | Reglas WAF, rate limiting, CAA, MX nulo y ajustes de zona, **preparados y validados** |
| `docs/security/` (nuevo) | 16 documentos |

## Matriz final

| Control | Plan Free | Estado inicial | Estado final | Evidencia | Impacto SEO | Acción pendiente |
|---|---|---|---|---|---|---|
| DDoS L3/L4/L7 | Sí | Activo | **ACTIVO Y VERIFICADO** (ruleset presente, sin anulaciones) | `cf rulesets list` | Ninguno | — |
| Free Managed Ruleset | Sí | Activo | **ACTIVO Y VERIFICADO** | Log4Shell da 403 | Ninguno | Revisar eventos |
| Reglas WAF 1 a 3 | Sí (5) | 0 | **PREPARADO PARA ACTIVACIÓN** | `--validate-only` correcto | Ninguno | Autorizar y aplicar |
| Reglas WAF 4 y 5 | Sí | — | Reservadas | — | — | Solo ante un incidente o con evidencia |
| Rate limiting de zona | Sí (1) | 0 | **PREPARADO PARA ACTIVACIÓN** | `--validate-only` correcto | Ninguno | Autorizar y aplicar |
| Binding de rate limiting y límite en memoria | Sí | Activo | **ACTIVO** (desplegado) | `wrangler deploy --dry-run` | Ninguno | — |
| Turnstile (servidor y cliente) | Sí | No existía | **IMPLEMENTADO LOCALMENTE** | 14 pruebas e integración con el Siteverify real | Ninguno | Política de privacidad, widget, secreto y despliegue |
| 405 y control de métodos | — | 404 | **IMPLEMENTADO LOCALMENTE** | `tests/seguridad.spec.ts` | Ninguno | Desplegar |
| Validación, tamaño, Content-Type y repetición | — | Activo | **ACTIVO** más el token de un solo uso (local) | Suites | Ninguno | — |
| CSP y cabeceras | Sí | Activo | **ACTIVO Y VERIFICADO**. CSP de Turnstile **IMPLEMENTADA LOCALMENTE** | `seguridad:produccion` | Ninguno | — |
| Comprobación de archivos sensibles antes del despliegue | — | — | **IMPLEMENTADO LOCALMENTE** | Control negativo | Ninguno | — |
| Bot Fight Mode | Sí | Desactivado | **NO RECOMENDADO** | `cf bot-management get` | Riesgo si se activa | Reevaluar con datos |
| Super Bot Fight Mode, puntuación de bot, Attack Score | No | — | **NO DISPONIBLE EN FREE** | Documentación | — | — |
| Browser Integrity Check | Sí | Activo | **ACTIVO Y VERIFICADO** | Ajuste `on`; sin desafíos a la lectura | Ninguno | — |
| Políticas de IA: Search y Agent | Sí | Allow | Mantener Allow | `cf bot-management get` | Positivo (GEO) | — |
| Política de IA: Training | Sí | Allow en el borde, `Disallow` en `robots.txt` | **PENDIENTE DE DATOS** (decisión de la responsable) | `robots.txt` | Ninguno si no alcanza a Googlebot ni Bingbot | Decidir |
| AI Labyrinth | Sí | Desactivado | **NO RECOMENDADO** | Ídem | Modifica el HTML | — |
| `robots.txt` gestionado | Sí | Desactivado | Mantener desactivado | Ídem | Evita dos fuentes | — |
| Universal SSL y certificados | Sí | Activos | **ACTIVO Y VERIFICADO** (vence el 2027-02-06, se renueva solo) | `openssl`, `cf ssl` | — | — |
| TLS 1.3 y mínimo 1.2 | Sí | Activos | **ACTIVO Y VERIFICADO** | Alerta 70 en 1.0 y 1.1 | — | — |
| Always Use HTTPS | Sí | Activo | **ACTIVO Y VERIFICADO** | 301 | Positivo | — |
| HSTS | Sí | 1 año, `includeSubDomains` | **ACTIVO Y VERIFICADO**. Subdominios auditados | `curl -I`, DNS | Positivo | No usar `preload` todavía |
| Modo SSL hacia el origen y AOP | Sí | `strict` | **NO APLICABLE** (no hay origen) | Arquitectura | — | — |
| DNSSEC | Sí | Firmado, sin DS | **PENDIENTE DE DATOS** (DS del registrador) | `seo:dnssec` | — | Esperar o reclamar |
| CAA | Sí | Ninguno | **PREPARADO PARA ACTIVACIÓN** | `dns-caa.json` | — | Permiso de DNS |
| SPF, DMARC y MX nulo | Sí | SPF `-all`, DMARC `reject` | **ACTIVO**. MX nulo preparado (opcional) | `dig` | — | Al activar el correo |
| Hostnames secundarios y `workers.dev` | — | Desactivados | **ACTIVO Y VERIFICADO** | `cf workers get` | Sin duplicados | — |
| Secretos | Sí | Ninguno | Sin secretos expuestos | Escaneo | — | `TURNSTILE_SECRET_KEY` al activar |
| 2FA de la cuenta | Gratis | **Desactivado** | **PENDIENTE DE DATOS** (acción personal) | `cf user get` | — | **Activar ya** |
| Tokens de API | Gratis | 5 sin caducidad | **PENDIENTE** (acción personal) | `cf user tokens list` | — | Revocar o limitar |
| Hotlink Protection | Sí | Desactivado | **NO RECOMENDADO** | Ajuste | Rompería las imágenes en buscadores y redes | — |
| Email Obfuscation | Sí | Desactivado | **NO APLICABLE** (no hay correos en las páginas) | Ajuste | — | — |
| IP Access, UA Blocking, Zone Lockdown | Sí | Ninguno | **NO APLICABLE** (sin evidencia ni rutas privadas) | — | — | — |
| Cloudflare Access | Zero Trust Free | — | **NO APLICABLE** (sin área privada) | — | Nunca delante del sitio | Si se crea un *staging* |
| Under Attack Mode | Sí | Desactivado | Procedimiento listo | [incident-response.md](incident-response.md) | Temporal | — |
| Browser Cache TTL | Sí | 14400 | **PREPARADO PARA ACTIVACIÓN** («Respetar cabeceras») | `ajustes-zona.json` | Ninguno | Autorizar |
| `security.txt` | — | No existe | **PENDIENTE DE DATOS** (contacto real) | — | — | Definir el contacto |
| Security Events y monitorización | Sí, muestreado | Sin datos | Plan definido | [incident-response.md](incident-response.md) | — | Revisión semanal |

## Lo que necesita autorización (en este orden)

1. **Propietario, en el panel:** activar 2FA y revisar o revocar los tokens. No depende del código.
2. **Aplicar las reglas WAF y el rate limiting en la zona.** Son cambios reversibles y no requieren desplegar ([waf-rules.md](waf-rules.md), [rate-limiting.md](rate-limiting.md)).
3. **Desplegar esta rama** (`npm run deploy`). Trae el 405 y el código de Turnstile; sin widget ni secreto, el formulario sigue en 503, como hoy.
4. **CAA** (cambio de DNS).
5. **Turnstile en producción:**
   - política de privacidad revisada;
   - crear el widget;
   - clave pública en `build:cf`;
   - `wrangler secret put`;
   - desplegar.
6. Browser Cache TTL a «Respetar cabeceras».

## Riesgos que permanecen

| Riesgo | Mitigación disponible |
|---|---|
| Cuenta sin 2FA | Solo la puede resolver el propietario |
| DNSSEC sin cadena de confianza | Depende del registrador |
| El formulario en producción no tiene Turnstile hasta la activación | Hoy no envía nada (503), así que no hay exposición |
| Rate limiting aproximado (por centro de datos y con retraso) | Turnstile de un solo uso es el control fiable |
| Security Events muestreados y sin historial | Revisión semanal más los verificadores activos |
| `style-src 'unsafe-inline'` | Bajo, con los scripts en línea bloqueados |

## Mantenimiento

- **Tras cada despliegue:** `npm run seguridad:produccion` y `npm run seo:produccion`.
- **Mensual:**
  - Security Events;
  - métricas de Workers;
  - Audit Logs;
  - caducidad de los certificados (automática);
  - `npm audit`;
  - `seo:dnssec` hasta que salga en verde.
- **Cada 6 meses:** revisar este inventario contra la documentación de Cloudflare, porque la disponibilidad de funciones cambia.

Documentos: [inventario](cloudflare-free-inventory.md) · [auditoría inicial](cloudflare-initial-audit.md) · [WAF](waf-rules.md) · [rate limiting](rate-limiting.md) · [bots](bot-protection.md) · [IA](ai-crawlers-policy.md) · [TLS y DNSSEC](tls-dnssec.md) · [Turnstile](turnstile-implementation.md) · [Worker](workers-security.md) · [cuenta](account-security.md) · [cabeceras](security-headers.md) · [SEO y GEO](seo-geo-security-compatibility.md) · [pruebas](security-tests.md) · [incidentes](incident-response.md) · [reversión](rollback-plan.md)
