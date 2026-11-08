# Protección contra bots

## Estado observado (2026-11-08)

| Control | Estado | Disponible en Free |
|---|---|---|
| Bot Fight Mode | Desactivado | Sí |
| JavaScript Detections | Desactivado | Sí (Bot Fight Mode lo activa) |
| Super Bot Fight Mode | — | **No** (Pro o superior) |
| Bot Management y `cf.bot_management.score` | — | **No** (Enterprise) |
| `cf.client.bot` (bot verificado) en reglas | Disponible | Sí |
| Browser Integrity Check | Activo | Sí |
| Políticas de rastreadores de IA | Ninguna bloquea | Sí ([ai-crawlers-policy.md](ai-crawlers-policy.md)) |
| AI Labyrinth | Desactivado | Sí |

## Decisiones

### Bot Fight Mode: mantener desactivado (NO RECOMENDADO por ahora)

| Factor | Evaluación |
|---|---|
| Qué hace | Identifica patrones de bots simples (nubes, navegadores sin interfaz) y les aplica desafíos costosos. En Free alcanza **a todo el tráfico** |
| Personalización | **Ninguna.** Las reglas WAF con Skip, Bypass o Allow no lo afectan ([documentación](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/)) |
| Bots verificados | La documentación dice que «históricamente» se excluyen, pero no lo garantiza para Bot Fight Mode. Con el `noindex` vigente no se puede comprobar en Search Console |
| Riesgo | Podría desafiar el `fetch` del formulario o servicios de vista previa de enlaces (WhatsApp, Slack, LinkedIn), que suelen ir desde nubes. Además fuerza JavaScript Detections, que exige que la CSP admita `/cdn-cgi/challenge-platform/` con un *nonce* en la cabecera. La CSP del sitio va en `<meta>` y no usa *nonces* |
| Beneficio esperado | Bajo. El contenido es estático y público, no hay cuentas ni inventario que proteger, y el único punto de escritura ya tiene Turnstile, WAF y límites |
| Datos para decidir | Ninguno todavía: la zona tiene un día |

**Conclusión:** el beneficio no compensa un control que no admite excepciones. La amenaza real (spam en el formulario) ya la cubren mejor controles selectivos.

**Cuándo reevaluarlo:** si Security Events o la analítica de Workers muestran *scraping* abusivo que agote el cupo, o tráfico automatizado contra páginas. Procedimiento de prueba:

1. Activarlo fuera de horario.
2. Ejecutar `npm run seguridad:produccion` y `npm run seo:produccion`.
3. Probar el formulario desde un móvil y la vista previa de un enlace en WhatsApp.
4. Revisar Security Events durante 48 h.

Para revertir, basta con el interruptor, que no deja nada persistente.

### Browser Integrity Check: mantener activo

- Rechaza las cabeceras que suelen usarse en abusos y los `User-Agent` vacíos o anómalos.
- En la prueba, una petición sin `User-Agent` recibió 200: no se observó ningún desafío sobre el contenido servido por el Worker.
- No hay falsos positivos conocidos, y los rastreadores legítimos envían un `User-Agent`.
- Si algún día interfiere, se exime de forma selectiva con una regla Skip de producto `bic` limitada a la ruta afectada. No se desactiva de forma global.

### Security Level: mantener `medium`

Es el valor predeterminado. No hay evidencia de falsos positivos ni de ataques que justifiquen subirlo.

### Bot verificado (`cf.client.bot`)

Es el campo correcto en Free para reconocer a Googlebot, Bingbot y los demás verificados. Cloudflare los verifica por IP o DNS inverso, no por la cadena `User-Agent`. `cf.bot_management.verified_bot` exige Enterprise. Hoy no hace falta ninguna excepción: ninguna regla desafía GET o HEAD ([waf-rules.md](waf-rules.md)).

### Controles que no dependen del User-Agent

El abuso real posible es el spam en el formulario, y se contiene por capas sin identificar al cliente por su cadena:

1. Regla WAF 3: solo POST del mismo origen.
2. Rate limiting de zona y del Worker.
3. Turnstile con Siteverify, de un solo uso.
4. Campo trampa y tiempo mínimo de llenado.
5. Validación estricta.

### AI Labyrinth: mantener desactivado

- Inyecta enlaces invisibles con `nofollow` en el HTML para hacer perder el tiempo a los rastreadores que no respetan las directivas.
- Cloudflare afirma que no afecta al SEO, pero **modifica el HTML** de un sitio jurídico cuyo contenido pasa por revisión profesional.
- No es una mitigación, y los enlaces siguen vigentes un tiempo después de desactivarlo.
- No hay evidencia de rastreadores incumplidores que justifique el cambio.

Para reevaluarlo:

1. Activarlo.
2. Comprobar que el HTML servido sigue validando y que `npm run seo:auditar` sobre el sitio descargado no detecta enlaces nuevos indexables.
3. Desactivarlo si aparece cualquier efecto en la monitorización.

### IP Access Rules, User Agent Blocking y Zone Lockdown

No aplicables sin evidencia:

- **IP Access Rules:** no hay IP identificadas. Además, la documentación indica que su presencia puede afectar a Bot Fight Mode.
- **User Agent Blocking:** es fácil de falsificar y puede bloquear clientes legítimos. No se usa como defensa.
- **Zone Lockdown:** no hay rutas privadas que proteger.
