# Seguridad de la cuenta de Cloudflare

Revisión de solo lectura del 2026-11-08 con la sesión OAuth del usuario. No se cambió ningún ajuste, token ni miembro: **todas las acciones de este documento son personales del propietario.**

## Hallazgos

| # | Prioridad | Hallazgo | Evidencia |
|---|---|---|---|
| A1 | **P0** | **Sin verificación en dos pasos (2FA)** en el usuario que controla la zona, el registrador, el Worker y el DNS | `cf user get` → `two_factor_authentication_enabled: false` |
| A2 | **P0** | Token `lawyi-staging-setup`: activo, **nunca usado**, sin caducidad ni restricción de IP. Tiene *Access: Apps and Policies Write* y *Turnstile Sites Write* sobre **todas las cuentas** (`account.*`), más DNS y SSL Write en otra zona | `cf user tokens list` |
| A3 | P1 | Token `lawyi-recuperacion-build`: *Access: Service Tokens Write* sobre `account.*`, sin caducidad. Último uso el 2026-11-04 | Ídem |
| A4 | P2 | `Edit zone DNS` y `u047-dns-corte-user`: DNS Write en otra zona (`339d…`), sin caducidad. Último uso el 2026-10-20 | Ídem |
| A5 | P2 | `Cloudflare Agent Token - 2026-09-02`: 25 permisos de lectura y ninguno de escritura. Sin caducidad. Último uso el 2026-09-24 | Ídem |
| A6 | — | No se pudo leer la lista de miembros de la cuenta: falta permiso | `cf accounts members list` → error |
| A7 | — | El despliegue usa la sesión OAuth de Wrangler (`wrangler login`), no un token guardado. No hay tokens en el repositorio ni en el historial | `wrangler whoami`, escaneo de git |

**Por qué A2 es crítico para este sitio:** un permiso de escritura sobre Access en todas las cuentas permitiría poner una aplicación de Access delante de `evelynelizondo.com`. Eso dejaría el sitio inaccesible para visitantes y buscadores sin tocar la zona. Además, nunca se ha usado.

## Acciones recomendadas (las hace el propietario)

1. **Activar 2FA** en My Profile → Authentication:
   - preferentemente con una **llave de seguridad** (WebAuthn: YubiKey, Touch ID o Windows Hello), que resiste el *phishing*, y registrar al menos dos;
   - una app TOTP como segundo método;
   - guardar los códigos de recuperación fuera del equipo, en un gestor de contraseñas o en papel.
2. **Revocar `lawyi-staging-setup`** (My Profile → API Tokens) si ya no se necesita. Si hace falta, recrearlo con:
   - alcance limitado a la cuenta o zona concreta;
   - una fecha de caducidad;
   - restricción de IP.
3. Revisar `lawyi-recuperacion-build`, `Edit zone DNS` y `u047-dns-corte-user`. Si aún se usan, añadirles una **fecha de caducidad** y **filtro de IP**; si no, revocarlos.
4. Revisar las **sesiones activas** y los **miembros** de la cuenta: Manage Account → Members. Si hay otra persona administradora, exigir 2FA a todos los miembros desde la configuración de la cuenta.
5. Comprobar que el correo de la cuenta tiene su propio 2FA: es la vía de recuperación.
6. No usar la Global API Key. Si existe una en algún script, sustituirla por un token con el mínimo privilegio.

## Tokens para este proyecto (si alguna vez hacen falta)

| Uso | Permisos mínimos | Alcance |
|---|---|---|
| Auditoría o monitorización de solo lectura | Zone Read, Zone Settings Read, Firewall Services Read, DNS Read, Analytics Read | Solo la zona `evelynelizondo.com` |
| Despliegue desde CI | Workers Scripts Edit, Workers Routes Edit (en la zona) | La cuenta y la zona. Sin DNS ni WAF |
| Cambios de WAF o rate limiting | Zone WAF Edit | Solo la zona, con caducidad corta |

Ningún token de auditoría debe tener permisos de despliegue. Los tokens no se escriben en la terminal compartida, en la documentación ni en los registros: van en el gestor de secretos del CI.

## Registro de auditoría

Manage Account → Audit Logs muestra los cambios de configuración. Revisarlo tras cada intervención y una vez al mes ([incident-response.md](incident-response.md)).
