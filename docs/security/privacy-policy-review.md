# Política de privacidad: cambios técnicos y revisión jurídica pendiente

**Estado: BORRADOR PARA REVISIÓN JURÍDICA.** Nada de este documento ni del texto de la política está aprobado. La aprobación la registra una persona responsable en [`src/config/formulario.json`](../../src/config/formulario.json) (`politicaPrivacidad`). Sin ella, la compilación de producción no admite el widget de Turnstile.

## Qué cambió en el texto (rama `security/cloudflare-free-hardening`)

Archivo: [`src/pages/politica-de-privacidad.astro`](../../src/pages/politica-de-privacidad.astro). El texto depende de la compilación, para describir siempre lo que realmente se publica.

| Parte | Compilación para Cloudflare (producción) | Con el widget Turnstile |
|---|---|---|
| Dirección IP | Añade el limitador de Cloudflare (hash SHA-256 de la IP) y el límite por IP en la red de Cloudflare | Añade que el servidor envía el código de verificación y la IP a Cloudflare |
| Destinatarios | Cloudflare Email Service en lugar de «SMTP con TLS exigido», **que no era exacto en producción**. Menciona el registro de envíos y la vista previa de unos 7 días | — |
| Alojamiento y seguridad | Nueva sección: Cloudflare trata IP, página, User-Agent y hora; los eventos de seguridad se conservan 31 días; enlaces al DPA y a la política de Cloudflare | — |
| Navegador | Sin cambios | Ya no afirma que «no carga recursos de terceros». Dice que Turnstile puede usar cookies o almacenamiento técnicos |
| Seguridad del formulario | — | Nueva sección `#seguridad-del-formulario`: qué trata Turnstile, para qué, el doble rol de Cloudflare, el token de un solo uso y que sin JavaScript no se envía |
| Transferencias | Tratamiento en la red mundial de Cloudflare, principalmente en EE. UU. y el EEE | — |
| Consentimiento (formulario) | — | La casilla menciona la verificación de Cloudflare, y Turnstile **solo se carga al marcarla** |

## Marco normativo verificado (consulta del 2026-11-08)

- **Ley N.º 8968**, vigente y sin reformas:
  - Sinalevi la muestra en la versión 1 de 1;
  - Prodhab declara que «no ha sufrido ninguna reforma»;
  - el expediente 23.097, la nueva ley, **no es ley**: está archivado tras su vencimiento cuatrienal.
- **Reglamento:** Decreto Ejecutivo 37554-JP, con las reformas 40008-JP (2016) y 41582 (2019), en la versión 3 de 3 en Sinalevi.
- **Prodhab** no tiene guías sobre cookies ni CAPTCHA.

Fuentes:

- [Ley 8968 en Sinalevi](https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=70975&param2=85989&param3=1&param4=)
- [Reglamento en Sinalevi](https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=74352&param2=115361&param3=1)
- [Normativa de Prodhab](https://www.prodhab.go.cr/acercade/normativa/)
- [Sistema de Información Legislativa](https://consultassil3.asamblea.go.cr/frmConsultaProyectos.aspx)

**Datos de Cloudflare** que respaldan el texto:

- [Anexo de privacidad de Turnstile](https://www.cloudflare.com/turnstile-privacy-policy/) (18-06-2025):
  - trata IP, huella TLS, User-Agent, clave del sitio y origen;
  - es encargada para la detección y responsable para mejorar el producto.
- [Documentación de Turnstile](https://developers.cloudflare.com/turnstile/): no accede a las entradas del formulario.
- [DPA de clientes](https://www.cloudflare.com/cloudflare-customer-dpa/) v6.4 (03-04-2026).
- [Política de privacidad de Cloudflare](https://www.cloudflare.com/privacypolicy/): almacena principalmente en EE. UU. y el EEE.
- [Security Events](https://developers.cloudflare.com/waf/analytics/security-events/): 31 días.
- [Registro de Email Service](https://developers.cloudflare.com/email-service/observability/logs/): vista previa de unos 7 días.

## Lo que debe decidir o validar una persona abogada

1. **Base del tratamiento de Turnstile y del proxy de Cloudflare.**
   - La Ley 8968 no prevé el «interés legítimo»; el consentimiento expreso tiene excepciones tasadas (art. 5.2).
   - Técnicamente:
     - Turnstile se carga **después** de marcar la autorización;
     - la autorización lo menciona;
     - el proxy de Cloudflare trata la IP en **cualquier** visita, antes de cualquier consentimiento.
   - Hay que validar si eso basta y cómo informarlo.
2. **Doble rol de Cloudflare en Turnstile.** En lo que actúa como responsable (mejora del producto), ¿es una transferencia del art. 14, que requeriría autorización expresa y contrato (reglamento, art. 43)?
3. **Aplicabilidad del DPA** de Cloudflare a datos de personas en Costa Rica: el acuerdo Self-Serve lo incorpora expresamente para datos de la UE y de la CCPA.
4. **Inscripción de la base ante Prodhab.**
   - La ley la exige para bases con fines de distribución, difusión o comercialización (art. 21).
   - Para una base de solicitudes de consulta parece no aplicar, pero hace falta un dictamen.
   - No se afirma ni que esté inscrita ni que esté exenta.
5. **Plazo de conservación** de los mensajes: como máximo 10 años (art. 6), compatible con las obligaciones del ejercicio profesional.
6. **Identidad, cédula y dirección del responsable y contacto de privacidad.** Hoy aparecen como «Dato por completar».
7. **Procedimiento ante brechas:** aviso en 5 días hábiles (reglamento, arts. 38 y 39). No consta en la política.
8. **Cookies de Turnstile:**
   - con la clave de prueba no dejó ninguna;
   - Cloudflare documenta `cf_clearance`, `cf_chl_*` y `__cf_bm` como estrictamente necesarias cuando se usan;
   - hay que comprobarlo con el widget real y ajustar el texto.

## No se afirma (y no debe afirmarse sin verificación)

- Que Turnstile no trata datos personales, o que no usa cookies.
- Que los datos no salen de Costa Rica.
- Que Cloudflare no conserva registros.
- Que la base está inscrita o exenta.
- Que la política está aprobada.

## Recomendaciones técnicas relacionadas (sin aplicar)

- **Vista previa de Email Service:** desactivarla, si el panel lo permite para el binding, antes de activar el correo. Reduce copias del mensaje fuera del buzón.
- **Limitador del Worker:** usa hoy un hash SHA-256 de la IP **sin clave**. Una IPv4 se puede recuperar por fuerza bruta.
  - Opción: usar un HMAC con un secreto del Worker.
  - Requiere desplegar y otro secreto.
  - Mientras tanto, la política no dice que el resumen sea irreversible.
