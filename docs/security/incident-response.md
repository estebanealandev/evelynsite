# Monitorización y respuesta a incidentes

**Principio:** ningún procedimiento automatiza acciones destructivas. Cada medida se aplica a mano, se verifica y tiene su reversión ([rollback-plan.md](rollback-plan.md)).

## Monitorización (gratuita)

| Qué | Dónde | Frecuencia | Señal de alarma |
|---|---|---|---|
| Security Events (datos muestreados en Free) | Security → Events | Semanal; diaria la primera semana tras activar reglas | Bloqueos en páginas de contenido, en recursos (`/_astro`, `/assets`) o de bots verificados |
| Security Analytics | Security → Analytics | Mensual | Picos de tráfico mitigado o automatizado |
| Workers: errores, CPU, invocaciones | Workers → `evelyn-elizondo` → Metrics / Logs | Semanal | Errores 500 o 1102 (CPU), invocaciones cerca de 100 000 al día |
| Registros del formulario | Workers Logs: `[formulario] turnstile …`, `envio_no_disponible`, `error_envio` | Tras cada despliegue y semanal | Aumento de `turnstile rechazado` o `no_disponible` |
| Verificación activa | `npm run seguridad:produccion`, `npm run seo:produccion`, `npm run seo:dnssec` | Tras cada despliegue o cambio de zona, y mensual | Cualquier ✖ |
| Auditoría de la cuenta | Manage Account → Audit Logs | Mensual | Cambios que nadie reconoce |
| Search Console y Bing (tras el lanzamiento) | Estadísticas de rastreo | Semanal el primer mes | Respuestas 403, 429, de desafío o 5xx |

Los registros nunca guardan cuerpos de formularios, correos, IP ni tokens. Hay que mantenerlo así.

## Playbooks

### 1. Aumento de spam en el formulario

1. Confirmar que todas las capas están activas: Turnstile (widget y secreto), la regla WAF 3 y el rate limiting.
2. Revisar en Security Events si el spam pasa por `/api/consulta` con `Origin` correcto, lo que indicaría un navegador automatizado.
3. Medidas escalonadas:
   1. Bajar el rate limiting a 3 cada 10 s.
   2. Cambiar el widget a modo *Non-interactive* o *Managed*, con más exigencia, en el panel de Turnstile.
   3. Activar la regla reservada 4, el desafío gestionado en `/agendar-consulta` con `not cf.client.bot` ([waf-rules.md](waf-rules.md)).
4. Retirar la regla 4 cuando pase la ola.
5. **Escalar** si el spam supera estas capas: desactivar temporalmente el formulario (`MAIL_MODE=disabled`, que responde 503 de forma honesta).

### 2. Ataque DDoS

1. La protección L3 a L7 actúa sola. Comprobar en Security → Events / DDoS que se está mitigando.
2. Si el sitio se degrada, sin hacer nada en el Worker (las páginas son estáticas y Static Assets no consume cupo):
   - Activar **Under Attack Mode** *temporalmente*. Si el ataque se centra en una ruta, mejor una regla de configuración limitada a esa ruta: Security Level → I'm Under Attack.
   - Esto afecta a los rastreadores y a la monitorización. Retirarlo en cuanto pase, en horas, no en días.
3. Si el ataque apunta a `/api/consulta`, también ayuda bajar el rate limiting.
4. **Reversión:** Security Level vuelve a `medium`. Ejecutar `npm run seguridad:produccion`.

### 3. Falso positivo del WAF

1. Localizar el evento en Security Events: regla, ruta, método e IP.
2. Si es una regla propia, **desactivar solo esa regla** (`"enabled": false`) y corregir su expresión. Nunca desactivar el ruleset entero.
3. Si es el Free Managed Ruleset, crear una excepción limitada a la ruta y la regla concretas. **Nunca una excepción global.**
4. Repetir `seguridad:produccion` y `seo:produccion`.

### 4. Googlebot u otro buscador bloqueado

1. Search Console → Estadísticas de rastreo: confirmar las respuestas 403 o 429 y las URL afectadas.
2. Security Events filtrado por «Verified bot» o por el agente de usuario.
3. Causas posibles, por orden:
   - una regla nueva sin `not cf.client.bot`;
   - Bot Fight Mode activado (desactivarlo: no admite excepciones);
   - Under Attack Mode olvidado;
   - el rate limiting en páginas, que no debería existir.
4. Corregir, ejecutar `seo:produccion` y pedir un nuevo rastreo de una URL de prueba en Search Console.

### 5. Problema de certificado o HTTPS

1. Hacer `cf ssl certificate-packs list -z 3c656474ab87b43af43563a939e20f23` y comprobar el estado y la caducidad.
2. Si hay CAA, verificar que siguen presentes las autoridades necesarias ([tls-dnssec.md](tls-dnssec.md) §7).
3. **No** pasar a Flexible, **no** desactivar HSTS de forma abrupta y **no** pasar los registros a «solo DNS»: HSTS está vigente.
4. Todo subdominio nuevo debe servir HTTPS antes de publicarse, porque HSTS lleva `includeSubDomains`.

### 6. Error de DNSSEC (SERVFAIL)

1. Ejecutar `npm run seo:dnssec` y revisar dnsviz.net.
2. Si el DS del padre no coincide con la DNSKEY, corregir el DS en el registrador con el valor que da Cloudflare.
3. Último recurso, ante una caída generalizada: desactivar DNSSEC en Cloudflare, que retira el DS, y esperar al TTL. Nunca dejar un DS sin firma.

### 7. Filtración de un secreto

1. **Revocar o rotar de inmediato** en su origen:
   - Turnstile → Rotate secret;
   - el token de Cloudflare;
   - la credencial del proveedor de correo.
2. Actualizarlo con `wrangler secret put …`. Esto despliega.
3. Revisar Audit Logs y Security Events del periodo expuesto.
4. Si el secreto llegó al repositorio: rotarlo es obligatorio. Reescribir el historial no basta y solo se hace con autorización.
5. No reproducir el secreto en informes, tickets ni chats.

### 8. Cupo de Workers Free agotado (error 1027)

- **Efecto:** las páginas siguen funcionando porque son Static Assets. Fallan `/api/consulta` y la 404 hasta las 00:00 UTC.
- **Causa probable:** sondeos a rutas inexistentes. Con las reglas WAF 1 y 2 activas no deberían llegar al Worker.
- **Medidas:**
  - identificar las rutas en Workers Metrics y Security Events;
  - añadir el patrón a la regla 5;
  - como medida temporal, una regla que bloquee la ruta concreta.
- **No contratar** el plan de pago sin autorización.

### 9. Fallo de Turnstile

- **Síntomas:** muchos `[formulario] turnstile no_disponible` o `sin_configurar`. El formulario responde 503 «Intente más tarde»: no hay éxito falso ni envío sin verificar.
- **Diagnóstico:**
  - `sin_configurar`: falta el secreto o está mal. Revisar `npx wrangler versions secret list --latest-version` y la clave del widget.
  - `clave_de_prueba`: en el Worker hay una clave secreta de **prueba**. Se rechaza a propósito, porque aprobaría cualquier envío. Sustituirla por la real con `wrangler versions secret put` y desplegar con autorización.
  - `no_disponible`: Siteverify está caído, lento o dio `internal-error` también en el reintento. Consultar cloudflarestatus.com.
  - `host` o `accion`: el widget no tiene el hostname o la acción configurados.
- **No desactivar Turnstile en producción** para «arreglarlo»: el código no lo permite. Si la caída se prolonga, informar en la página y esperar.

### 10. Regresión de indexación

- **Antes del lanzamiento**, lo esperado es `noindex` en todo. Si `seo:produccion` muestra páginas indexables sin lanzamiento autorizado:
  1. Volver a desplegar la versión anterior: `wrangler rollback` o `npm run deploy` desde la rama correcta.
  2. Revisar `src/config/lanzamiento.json` y las variables.
- **Después del lanzamiento**, si aparece un `noindex` donde no debe:
  - ejecutar `npm run seo:auditar` sobre `dist/` y `seo:produccion`;
  - la zona no tiene Cache Rules para HTML, así que no hace falta purgar la caché.
- Revisar que ninguna regla de seguridad devuelva 403 o desafío en páginas (§4).

## Escalamiento

| Situación | A quién | Cuándo |
|---|---|---|
| Afecta a datos personales (secreto o formulario comprometido) | Responsable del tratamiento (Evelyn) y asesoría legal | Inmediato. Valorar las obligaciones de la Ley 8968 |
| Incidente de plataforma (DNSSEC, certificados, DDoS no mitigado) | Soporte de Cloudflare (casos en el panel) | Si no se resuelve en 1 h |
| Bloqueo de buscadores tras el lanzamiento | Quien mantiene el sitio | El mismo día |
