# Inventario de funciones de seguridad (Cloudflare Free y cuotas asociadas)

**Fecha:** 2026-11-08.

- La disponibilidad sale de la documentación vigente de developers.cloudflare.com (ver Fuentes).
- El estado sale de la auditoría ([cloudflare-initial-audit.md](cloudflare-initial-audit.md)).
- No se confunde el plan de la zona (Free Website) con las cuotas propias de Workers Free, Turnstile Free o Zero Trust Free.

Decisiones posibles: **Activar**, **Mantener activa**, **Mantener desactivada**, **Pendiente** (de prueba, datos o autorización).

| Función | Disponibilidad en Free | Límites | Estado actual | Decisión | Detalle |
|---|---|---|---|---|---|
| DDoS L3/L4 | Sí, siempre activo | Sin configuración en Free | Activo | Mantener activa | — |
| DDoS HTTP L7 | Sí, siempre activo | Una anulación global (sensibilidad o acción), sin expresión | Activo, sin anulaciones | Mantener activa, sin anular | [incident-response.md](incident-response.md) §2 |
| Free Managed Ruleset | Sí, desplegado por defecto | Único ruleset administrado en Free | **Activo y verificado** (la firma de Log4Shell recibe 403) | Mantener activa | [waf-rules.md](waf-rules.md) |
| Reglas WAF personalizadas | Sí | 5 reglas, sin regex ni Log | 0 | **Activar 3** (pendiente de autorización) | [waf-rules.md](waf-rules.md) |
| Rate limiting | Sí | 1 regla, ruta y bot verificado, IP, 10 s y 10 s | 0 | **Activar 1** (pendiente de autorización) | [rate-limiting.md](rate-limiting.md) |
| Binding de rate limiting en Workers | Sí | Periodo de 10 o 60 s, por ubicación | Activo (10 por minuto) | Mantener activa | [rate-limiting.md](rate-limiting.md) |
| Bot Fight Mode | Sí | No admite excepciones | Desactivado | Mantener desactivada | [bot-protection.md](bot-protection.md) |
| Super Bot Fight Mode | **No** (Pro o superior) | — | — | No disponible | — |
| Bot Management, puntuación de bot y WAF Attack Score | **No** | — | — | No disponible | — |
| Browser Integrity Check | Sí | — | Activo | Mantener activa | [bot-protection.md](bot-protection.md) |
| Security Level | Sí | — | `medium` | Mantener activa | — |
| Políticas de IA (Search, Agent, Training) | Sí | — | Ninguna bloquea | Mantener; Training pendiente de decisión | [ai-crawlers-policy.md](ai-crawlers-policy.md) |
| `robots.txt` gestionado | Sí | — | Desactivado | Mantener desactivada | [ai-crawlers-policy.md](ai-crawlers-policy.md) |
| AI Labyrinth | Sí | — | Desactivado | Mantener desactivada | [bot-protection.md](bot-protection.md) |
| Security Events | Sí, muestreado | Retención y filtros limitados | Sin datos | Pendiente (monitorizar) | [incident-response.md](incident-response.md) |
| Security Analytics | Sí, de zona | — | Sin datos | Pendiente (monitorizar) | Ídem |
| Turnstile | Sí (cuota propia) | 20 widgets y 10 hostnames por widget, sin límite de verificaciones | Sin widget | **Activar** (código listo, falta autorización) | [turnstile-implementation.md](turnstile-implementation.md) |
| Universal SSL | Sí | — | Activo, válido hasta el 2027-02-06 | Mantener activa | [tls-dnssec.md](tls-dnssec.md) |
| TLS 1.3 | Sí | — | Activo | Mantener activa | Ídem |
| TLS mínimo 1.2 | Sí | — | Activo y verificado | Mantener activa | Ídem |
| Always Use HTTPS | Sí | — | Activo | Mantener activa | Ídem |
| HSTS | Sí | — | La emite el sitio (1 año, `includeSubDomains`) | Mantener, sin `preload` | Ídem |
| HSTS de zona | Sí | — | Desactivado | Mantener desactivada (evita duplicar) | Ídem |
| DNSSEC | Sí | — | Firmado; **sin DS en `.com`** | Pendiente (registrador) | Ídem |
| CAA | Sí (DNS) | — | Ninguno | **Activar** (pendiente de permiso de DNS) | Ídem |
| Authenticated Origin Pulls | Sí | — | — | No aplicable (no hay origen) | Ídem |
| IP Access Rules | Sí | — | Ninguna | Mantener desactivada (sin IP identificadas) | [bot-protection.md](bot-protection.md) |
| User Agent Blocking | Sí | — | Ninguna | Mantener desactivada (no recomendado) | Ídem |
| Zone Lockdown | Según el plan | — | Ninguna | No aplicable (no hay rutas privadas) | Ídem |
| Hotlink Protection | Sí | — | Desactivado | Mantener desactivada (afecta a las imágenes en buscadores y redes) | [seo-geo-security-compatibility.md](seo-geo-security-compatibility.md) |
| Email Address Obfuscation | Sí | — | Desactivado | Mantener desactivada: el sitio no publica correos, e inyectaría un script de `/cdn-cgi/` que la CSP bloquea | — |
| Replace insecure JS libraries | Sí | — | Activo | Mantener: sin efecto, porque el sitio no usa bibliotecas de CDN | — |
| Automatic HTTPS Rewrites | Sí | — | Activo | Mantener (sin efecto) | — |
| 0-RTT | Sí | — | Desactivado | Mantener desactivada: evita repetir el POST | — |
| Under Attack Mode | Sí | — | Desactivado | Solo en un incidente | [incident-response.md](incident-response.md) |
| Browser Cache TTL | Sí | — | 14400 s | Cambiar a «Respetar cabeceras» (pendiente de autorización) | `ops/cloudflare/seguridad/ajustes-zona.json` |
| Normalización de URL | Sí | — | Ruleset de normalización activo | Mantener activa: las reglas WAF dependen de ella | — |
| Validación HTTP automática | Sí, de plataforma | — | Activa | No se duplica | — |
| `security.txt` | Archivo del sitio | — | No existe | Pendiente de datos (contacto real) | — |
| Cloudflare Access (Zero Trust Free) | Plan Zero Trust Free | Por hostname o ruta | — | No aplicable (no hay área privada) | [workers-security.md](workers-security.md) |
| Workers Free | Cuota propia | 100 000 peticiones al día, 10 ms de CPU, 50 subpeticiones, 128 MB | Activo | Se respeta: las reglas WAF reducen las invocaciones | Ídem |
| 2FA de la cuenta | Gratis | — | **Desactivado** | Activar (acción personal) | [account-security.md](account-security.md) |

**No se propone ninguna mejora de plan como requisito.** Las funciones de pago se registran como no disponibles, y en su lugar se usa la alternativa gratuita: reglas por ruta, Turnstile y el binding de rate limiting.

## Fuentes

Consultadas el 2026-11-08:

- WAF y reglas personalizadas:
  - https://developers.cloudflare.com/waf/custom-rules/ (5 reglas en Free; regex desde Business)
  - https://developers.cloudflare.com/ruleset-engine/rules-language/operators/ y …/functions/ (`matches` exige Business; `lower`, `any`, `starts_with` y `ends_with` sin restricción de plan)
  - https://developers.cloudflare.com/ruleset-engine/rules-language/actions/ (Log solo en Enterprise)
  - https://developers.cloudflare.com/waf/custom-rules/skip/options/ (Bot Fight Mode no se puede saltar)
  - https://developers.cloudflare.com/waf/feature-interoperability/ (orden de las fases)
- Rate limiting:
  - https://developers.cloudflare.com/waf/rate-limiting-rules/ (1 regla; 10 s / 10 s; solo ruta y bot verificado; por IP)
  - https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/
- Managed rules y DDoS:
  - https://developers.cloudflare.com/waf/get-started/ («The Free Managed Ruleset is deployed by default on Free plans»)
  - https://developers.cloudflare.com/waf/managed-rules/
  - https://developers.cloudflare.com/ddos-protection/
  - https://developers.cloudflare.com/ddos-protection/managed-rulesets/http/
- Bots e IA:
  - https://developers.cloudflare.com/bots/get-started/bot-fight-mode/
  - https://developers.cloudflare.com/bots/plans/free/
  - https://developers.cloudflare.com/bots/concepts/bot/verified-bots/
  - https://developers.cloudflare.com/bots/additional-configurations/ai-labyrinth/
  - https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/
  - https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
  - https://developers.cloudflare.com/waf/tools/browser-integrity-check/
- Turnstile:
  - https://developers.cloudflare.com/turnstile/plans/
  - https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
  - https://developers.cloudflare.com/turnstile/troubleshooting/testing/
  - https://developers.cloudflare.com/turnstile/reference/content-security-policy/
  - https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/
- Workers:
  - https://developers.cloudflare.com/workers/platform/limits/
  - https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
  - https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
  - https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
  - https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
  - https://developers.cloudflare.com/workers/configuration/secrets/
- TLS, HSTS y CAA:
  - https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
  - https://developers.cloudflare.com/ssl/reference/certificate-authorities/
  - https://developers.cloudflare.com/ssl/edge-certificates/caa-records/
  - https://developers.cloudflare.com/dns/dnssec/
- Cuenta:
  - https://developers.cloudflare.com/fundamentals/user-profiles/2fa/
  - https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/
  - https://developers.cloudflare.com/fundamentals/api/get-started/keys/
- Under Attack Mode:
  - https://developers.cloudflare.com/fundamentals/reference/under-attack-mode/
- Zero Trust:
  - https://developers.cloudflare.com/cloudflare-one/

**Puntos ambiguos en la documentación** (no se dependió de ellos):

- Si la «Verified Bot» del rate limiting de Free es `cf.client.bot`.
- Si Bot Fight Mode exime de forma explícita a los bots verificados.
- La cifra de usuarios de Zero Trust Free.
- Si el binding de rate limiting está disponible en Free. La documentación no lo dice, pero el despliegue con el binding se aceptó y figura entre los bindings del Worker. No se probó su efecto contra producción.
