# Evelyn Elizondo | Derecho de Familia | Costa Rica

Sitio corporativo en [Astro](https://astro.build) con páginas estáticas, un servidor Node para los formularios y todos los recursos alojados localmente.

> **Antes de publicar:** complete la lista de [pendientes de publicación](#pendientes-de-publicación). Hasta entonces, `PUBLIC_SITE_READY=false` mantiene el sitio con `noindex` y `robots.txt` bloqueado.

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
| `PUBLIC_SITE_READY` | `true` habilita la indexación. Exige completar los datos de privacidad o la compilación falla |
| `PUBLIC_CONTACT_*` | Teléfono, correo, dirección y horario. Si están vacíos, no se muestran |
| `PUBLIC_DATA_CONTROLLER*`, `PUBLIC_PRIVACY_*` | Datos de la política de privacidad |
| `MAIL_MODE` | `smtp`, `outbox` o `disabled` |
| `MAIL_TO`, `MAIL_FROM`, `SMTP_*` | Configuración de correo |
| `MAIL_SEND_ACK` | Acuse de recibo automático, sin repetir el contenido |
| `TRUST_PROXY` | Activar solo detrás de un proxy de confianza |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MINUTES` | Límite de solicitudes |

## Formularios

Hay dos endpoints: `/api/consulta` y `/api/suscripcion`.

- **Proveedor:** cualquiera con SMTP, como el correo del dominio o un servicio transaccional. Las claves se guardan solo en variables del servidor.
- **Protección:** validación en navegador y servidor, saneamiento, campo trampa, tiempo mínimo, límite por IP (huella hash en memoria) y verificación de origen.
- **Sin configurar:** con `MAIL_MODE=disabled` responde 503 y avisa que la solicitud no se envió.
- **Registros:** nunca contienen datos de la persona. Solo aparecen eventos como `[formulario] envio_no_disponible` o `error_envio`.
- **Sin JavaScript:** el envío nativo redirige a `/consulta-recibida` o `/consulta-no-enviada`.

### Activar el envío real

1. Configure `MAIL_MODE=smtp`, `MAIL_TO`, `MAIL_FROM` y `SMTP_*`.
2. Reinicie el servidor.
3. Envíe una consulta de prueba y confirme que llega.

El límite de solicitudes vive en memoria: si despliega varias instancias, cada una cuenta por separado.

## Despliegue

Cualquier alojamiento con Node funciona. Ejemplo: un VPS con `npm start` bajo systemd o PM2, detrás de Nginx o Caddy con HTTPS.

1. Defina `PUBLIC_SITE_URL` antes de compilar y `TRUST_PROXY=true` si usa proxy.
2. Configure HTTPS. La política de privacidad lo menciona como requisito de producción.
3. En el proxy, añada `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y, como refuerzo, la CSP incluida en `src/layouts/Base.astro`.
4. Revise los registros con `journalctl -u <servicio>` o `pm2 logs`.

## Actualizar contenido

| Contenido | Ubicación |
|---|---|
| Áreas de servicio | `src/content/servicios/*.md` |
| Artículos | `src/content/articulos/*.md` |
| Fuentes normativas | `src/lib/sources.ts` |
| Textos institucionales | `src/lib/institucional.ts` |
| Navegación y datos generales | `src/config/site.ts` |
| Colores y tipografía | `:root` en `src/styles/global.css` |
| Marca | `scripts/generate-brand.mjs` |
| Imágenes | `scripts/generate-art.mjs` |

Para añadir una fotografía real, por ejemplo el retrato, guárdela en `public/assets/images/` con una versión `-sm` y sustituya el panel `.monogram-panel` de `src/pages/sobre-evelyn.astro`.

Al cambiar una norma, actualice `legalVerifiedAt` en `src/config/site.ts`.

## Pruebas

| Comando | Qué hace |
|---|---|
| `npm run build` y luego `npm test` | Rutas, dependencias, formularios, SMTP, API, interacciones y accesibilidad |
| `npm run audit:identity` | Busca referencias residuales de la identidad anterior |
| `npm run check` | Tipos de TypeScript |
| `npm run test:visual` | Compara con las métricas de referencia. Requiere el servidor en marcha y `BASE=http://127.0.0.1:4321` |

## Pendientes de publicación

La lista completa está en [docs/legal-compliance-audit.md](docs/legal-compliance-audit.md). Lo imprescindible:

1. Revisión de todos los textos por una persona profesional en derecho de Costa Rica.
2. Confirmación de servicios, datos profesionales y fotografía de Evelyn Elizondo.
3. Datos de contacto y de privacidad, correo SMTP y dominio.
4. Con todo lo anterior, `PUBLIC_SITE_READY=true` y nueva compilación.

## Documentación

- [Inventario del sitio](docs/site-inventory.md)
- [Informe de reconstrucción](docs/reconstruction-report.md)
- [Auditoría jurídica](docs/legal-compliance-audit.md)
- [Auditoría de identidad](docs/branding-audit.md)
- [Comparación estructural](docs/reference/structure-comparison.md)
- [Guía de marca](public/assets/brand/brand-guidelines.md)

`docs/reference/` contiene capturas del sitio de referencia solo para auditoría interna. No debe publicarse.
