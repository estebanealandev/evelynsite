# TLS, certificados, HTTPS, HSTS, DNSSEC, CAA y correo

Verificado el 2026-11-08 con `openssl`, `curl`, `cf` y `npm run seguridad:produccion` / `npm run seo:dnssec`.

## 1. Certificados (Universal SSL y el del dominio del Worker)

| Comprobación | Resultado |
|---|---|
| Certificado presentado | Google Trust Services (CN WE1), SAN `evelynelizondo.com` y `*.evelynelizondo.com` |
| Cubre `www` | Sí, por el comodín |
| Vigencia | Hasta el 2027-02-06 (90 días). Ambos paquetes se renuevan solos |
| Paquetes | Universal (Let's Encrypt, ECDSA) y avanzado gratuito del dominio del Worker (Google, RSA y ECDSA) |
| Cadena | Válida: `openssl s_client` y `fetch` de Node la aceptan sin errores |

**Estado: ACTIVO Y VERIFICADO.**

## 2. Versiones de TLS

| Versión | Resultado | Estado |
|---|---|---|
| TLS 1.0 | Rechazada: alerta 70 `protocol_version` | ✔ |
| TLS 1.1 | Rechazada: alerta 70 | ✔ |
| TLS 1.2 | Aceptada (ECDHE-ECDSA-CHACHA20-POLY1305) | ✔ (mínimo) |
| TLS 1.3 | Aceptada (TLS_AES_256_GCM_SHA384) | ✔ |

- `min_tls_version` está en 1.2 y `tls_1_3` en `on`. **ACTIVO Y VERIFICADO.**
- TLS 1.2 como mínimo cubre a todos los navegadores con soporte vigente. Subir a 1.3 dejaría fuera clientes antiguos sin una ganancia real.

## 3. HTTPS y redirecciones

| Caso | Resultado |
|---|---|
| `http://evelynelizondo.com/servicios` | 301 a `https://evelynelizondo.com/servicios`, en un salto (Always Use HTTPS) |
| `https://www…/` | 301 a `https://evelynelizondo.com/` (regla de zona) |
| Contenido mixto | Ninguno. La CSP solo admite `'self'` y el sitio no referencia `http://`. Lo comprueba `seo:auditar` (recursos externos) |
| Canónicos | Todos en `https://evelynelizondo.com/...` |

Hay un único caso de dos saltos: `http://www…`. Primero pasa a HTTPS y luego a la raíz, y los dos son 301. Es aceptable.

## 4. HSTS

| Aspecto | Estado |
|---|---|
| Cabecera | `Strict-Transport-Security: max-age=31536000; includeSubDomains`, sin `preload` |
| Dónde | La emite el sitio: `_headers` para los recursos y el middleware para el Worker. El HSTS de zona (`security_header`) está desactivado, así se evita duplicarla |
| Desde | 2026-11-07, primer despliegue |

### Evaluación de `includeSubDomains`

La misión pedía activar HSTS de forma progresiva. Pero **la cabecera ya se publicó** con un año de vigencia el 2026-11-07, y los navegadores que visitaron el sitio la guardaron por ese plazo. Bajar ahora `max-age` no les afecta. Por eso se auditaron los subdominios en lugar de cambiarla:

- El DNS solo tiene `www`, con proxy y servido por HTTPS con el certificado comodín.
- No hay MX, *mail*, *autodiscover* ni CNAME de terceros.
- Ningún subdominio necesita HTTP.

**Conclusión: la configuración actual es segura y se mantiene.**

Riesgo futuro: cualquier subdominio que se cree, por ejemplo para un proveedor de correo o de seguimiento, **tiene que servir HTTPS**. Se anotó en el procedimiento de cambios de DNS ([incident-response.md](incident-response.md) §5).

### `preload`

**NO RECOMENDADO** por ahora:

- Sería prácticamente irreversible durante meses.
- El dominio tiene un día.
- No aporta mucho a un sitio que ya redirige con 301 y emite HSTS desde la primera visita.

Para valorarlo más adelante: 6 meses estables con HSTS, inventario de subdominios cerrado y la decisión expresa del propietario.

### Reversión

Emitir `max-age=0` en `src/lib/cabeceras.mjs` y desplegar. Los navegadores que vuelvan a visitar el sitio borrarán la política. **Mientras HSTS esté vigente**: no pasar los registros a «solo DNS», no pausar Cloudflare y no mover los nameservers sin un certificado válido en destino.

## 5. Modo SSL hacia el origen

El sitio es un **Worker con dominio propio**: Cloudflare trata al Worker como el origen y no hay ningún servidor detrás. Por eso:

- `ssl: strict` (Full strict) no controla ninguna conexión real. Se deja así porque es el valor seguro si algún día aparece un origen.
- **Flexible: no.**
- **Authenticated Origin Pulls: NO APLICABLE**, porque no hay origen que autentique a Cloudflare.

## 6. DNSSEC

| Paso | Estado al 2026-11-08 07:00 UTC |
|---|---|
| Firma de la zona en Cloudflare | Activada (2026-11-08 02:20 UTC). `status: pending` |
| DNSKEY | 2371 (KSK, algoritmo 13) y 34505 |
| DS que espera Cloudflare | `2371 13 2 28E70B136E6AD8DA3C694BA93452671046EE1C8EFC0F9E7F4D53500232FB179A` |
| DS publicado en `.com` | **No** (1.1.1.1 y 8.8.8.8) |
| Validación (bit AD) | Falso |
| SERVFAIL | Ninguno: el dominio resuelve con normalidad |

**Estado: PENDIENTE DE DATOS** (de la publicación del DS). No se declara completado.

- Con Cloudflare Registrar, el DS se publica de forma automática, normalmente en horas.
- Si a las 24 h no aparece: Panel → DNS → Settings → DNSSEC, comprobar que no pide ninguna acción y abrir un caso de soporte.
- **No se cambió nada en el registrador ni en los nameservers.**

Para verificarlo, repetir hasta que salga en verde:

```bash
npm run seo:dnssec
```

Después, contrastar con <https://dnsviz.net/d/evelynelizondo.com/dnssec/> y anotar la evidencia en `src/config/lanzamiento.json` → `dnssec`.

Reversión, solo ante un error de validación (SERVFAIL generalizado): desactivar DNSSEC en Cloudflare, que retira el DS en el registrador, y esperar al TTL del DS. No hacerlo al revés: un DS sin firma rompe la resolución.

## 7. CAA

| Aspecto | Evaluación |
|---|---|
| Estado actual | Sin registros CAA: cualquier autoridad puede emitir |
| Beneficio | Limita qué autoridades pueden emitir certificados para el dominio, frente a errores o abusos de otras |
| Autoridades necesarias | Let's Encrypt, Google Trust Services, SSL.com y Sectigo (respaldo). Cloudflare **añade las suyas automáticamente** cuando existe algún CAA y se usa Universal SSL |
| Riesgo | Un CAA mal formado o incompleto impediría renovar certificados. Por eso se incluyen las cuatro, en `issue` y en `issuewild` |
| `iodef` | No, porque no hay un correo real autorizado |

**Estado: PREPARADO PARA ACTIVACIÓN** ([`ops/cloudflare/seguridad/dns-caa.json`](../../ops/cloudflare/seguridad/dns-caa.json)). Es un cambio de DNS y requiere permiso expreso.

- **Comprobación tras aplicarlo:** `dig CAA evelynelizondo.com` (deben aparecer también los que añade Cloudflare), y `cf ssl certificate-packs list` tras la próxima renovación.
- **Reversión:** borrar los registros CAA.

## 8. Correo del dominio

| Registro | Estado | Evaluación |
|---|---|---|
| SPF | `v=spf1 -all` | Correcto para un dominio que no envía |
| DMARC | `p=reject; adkim=s; aspf=s` | Correcto: nadie puede suplantar el dominio con éxito |
| DKIM | Ninguno | Correcto sin proveedor |
| MX | Ninguno | El dominio no recibe correo |
| MX nulo (RFC 7505) | Preparado y opcional ([`dns-mx-nulo.json`](../../ops/cloudflare/seguridad/dns-mx-nulo.json)) | Declara de forma explícita que no se acepta correo. Hay que retirarlo antes de activar Email Routing |

Cuando haya un proveedor real, por ejemplo Email Routing para el formulario:

1. Sustituir el SPF por el que indique el proveedor.
2. Añadir DKIM.
3. Mantener DMARC en `reject` solo después de comprobar con informes (`rua` hacia una dirección real) que todo el correo legítimo pasa. Si hace falta, empezar en `p=none` con `rua` durante dos semanas.

No se publicó ningún registro ficticio. La protección del correo no se mezcla con la activación del formulario.
