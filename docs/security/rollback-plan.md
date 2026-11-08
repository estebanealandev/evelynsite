# Plan de reversión

Cada cambio, cómo se deshace y cómo se comprueba. Después de cualquier reversión hay que ejecutar las dos comprobaciones:

```bash
npm run seguridad:produccion
```

```bash
npm run seo:produccion
```

## Código (esta rama)

| Cambio | Reversión |
|---|---|
| Rama completa `security/cloudflare-free-hardening` | Desplegada el 2026-11-08 como versión `d9386dca-0ce1-4cda-b27a-7b73698a7419`, sin fusionar ni subir |
| Si falla | `npx wrangler rollback` a la versión anterior (`5d023ca4-775d-48bc-9f7b-fca10334fe65`) o `npm run deploy` desde `seo/geo-enterprise-2026` |
| Turnstile | Compilar sin `PUBLIC_TURNSTILE_SITE_KEY`. Con eso desaparece el widget, pero el servidor sigue exigiendo el token y responde 503: el formulario queda cerrado, nunca abierto. Para eliminar el requisito, revertir el commit |
| 405 en `/api/consulta` | Revertir `export const ALL` en `src/pages/api/consulta.ts` |
| Comprobaciones previas al despliegue | Revertir el bloque «Seguridad» de `scripts/seo/verificar-lanzamiento.mjs` |
| `Permissions-Policy` | Revertir `src/lib/cabeceras.mjs` |
| Segunda fase del formulario (sin desplegar) | `git revert` de su commit. Si se despliega y falla: `npx wrangler rollback d9386dca-0ce1-4cda-b27a-7b73698a7419` |
| Activación del formulario (futura) | [turnstile-implementation.md](turnstile-implementation.md#reversión): vuelve al formulario cerrado, nunca abierto |

## Zona de Cloudflare

Las reglas WAF 1 a 3 y el rate limiting están **aplicados desde el 2026-11-08**. Antes no había entrypoint en ninguna de las dos fases, así que revertir del todo equivale a `--body '{"rules":[]}'`. El resto de la tabla sigue preparado y sin aplicar.

| Cambio | Aplicar | Revertir |
|---|---|---|
| Reglas WAF 1 a 3 | `cf rulesets entrypoint update http_request_firewall_custom -z 3c656474ab87b43af43563a939e20f23 --body …` ([waf-rules.md](waf-rules.md)) | Una regla: el mismo cuerpo con `"enabled": false` en esa regla. Todas: `--body '{"rules":[]}'` |
| Rate limiting | `cf rulesets entrypoint update http_ratelimit …` | `--body '{"rules":[]}'` |
| CAA | Crear los registros de `dns-caa.json` (con permiso de DNS) | Borrar los registros CAA |
| MX nulo (opcional) | `dns-mx-nulo.json` | Borrar el registro (obligatorio antes de activar Email Routing) |
| Browser Cache TTL a 0 | `cf zones settings edit browser_cache_ttl -z 3c656474ab87b43af43563a939e20f23 --body '{"value":0}'` | `--body '{"value":14400}'` |
| Entrenamiento de IA bloqueado en el borde (si se decide) | Panel → AI Crawl Control → Training → Block | Volver a Allow |
| Under Attack Mode (solo en un incidente) | Security Level → I'm Under Attack | Volver a `medium` |
| Bot Fight Mode (si alguna vez se prueba) | Security → Bots → On | Off. No deja nada persistente |
| AI Labyrinth (si alguna vez se prueba) | Security → Bots → On | Off. Los enlaces ya servidos siguen vigentes un tiempo |

Antes de aplicar cualquier ruleset, guardar el estado actual con `cf rulesets entrypoint get <fase> -z 3c656474ab87b43af43563a939e20f23 > copia.json`, como se hizo con la regla de barra final.

## Secretos

| Cambio | Revertir |
|---|---|
| `wrangler secret put TURNSTILE_SECRET_KEY` | `wrangler secret delete TURNSTILE_SECRET_KEY`. Despliega una versión nueva y el formulario queda en 503 |
| Rotación tras una filtración | No tiene vuelta atrás: el secreto anterior queda invalidado |

## Lo que no se puede revertir de inmediato

- **HSTS** (`max-age` de un año, ya publicado): los navegadores lo conservan. Emitir `max-age=0` lo retira solo cuando vuelven a visitar el sitio.
- **HSTS `preload`:** no se activa por este motivo.
- **DNSSEC:** desactivarlo exige que el DS desaparezca del padre antes que las firmas. Hay que seguir el orden de [tls-dnssec.md](tls-dnssec.md) §6.
