# Lista de autorización de indexación

El sitio está publicado en https://evelynelizondo.com con `noindex`. Esta lista indica qué debe cumplirse para indexarlo y cómo se hace. **Nada de esto se ejecuta automáticamente.**

## Cómo funciona la protección

La política está en `src/config/indexacion.mjs`. Una compilación es indexable solo si se cumplen las cuatro condiciones a la vez:

1. `SEO_INDEXING_ENABLED=true`. Se pasa de forma explícita, no está en ningún archivo del repositorio.
2. `SITE_ENV=production`. `npm run build:cf` ya lo fija.
3. `PUBLIC_SITE_URL=https://evelynelizondo.com`.
4. Cada requisito de `src/config/lanzamiento.json` en `"aprobado"`, con responsable, una fecha que no sea futura y evidencia, además de `autorizacion.autorizadoPor` y su fecha.

Si se pide indexar y falta algo, **la compilación falla** y muestra la lista de lo que falta. Sin la petición, el resultado es siempre `noindex`: ni una instalación limpia, ni un despliegue nuevo, ni la variable antigua `PUBLIC_SITE_READY` pueden indexar el sitio. Si se usa `PUBLIC_SITE_READY` sola, también falla. `npm run deploy` verifica además la coherencia de `dist/` antes de subir nada.

Aun con el lanzamiento autorizado, cada pieza jurídica (área, artículo o guía) sigue con `noindex, follow` y fuera del sitemap mientras su frontmatter no diga `revisionProfesional: aprobada`, con `revisadoPor` y `revisadoEl`. El esquema de contenido rechaza una aprobación sin esos dos campos. Las confirmaciones del formulario, la 404, las etiquetas y las categorías con un solo artículo no se indexan nunca.

## Requisitos

| Clave en `lanzamiento.json` | Qué hay que confirmar | Evidencia esperada | Estado al 2026-11-07 |
|---|---|---|---|
| `aprobacionEvelyn` | Evelyn aprobó por escrito el sitio, sus textos y su publicación | Correo o acta con fecha | Pendiente |
| `revisionJuridica` | Una profesional en derecho revisó el contenido jurídico | Nombre, fecha y alcance de la revisión. Además, `revisionProfesional: aprobada` en cada pieza revisada | Pendiente |
| `datosProfesionales` | Condición profesional, número de colegiatura y credenciales, o la decisión de no publicarlos | Consulta en el directorio del Colegio de Abogados y Abogadas | Pendiente |
| `datosContacto` | Teléfono, correo, dirección y horario reales, o la decisión de omitirlos | Confirmación de Evelyn | Pendiente |
| `formulario` | Envío a una dirección real verificada, probado de punta a punta | Ver «Activar el correo» en el README. Sin inventar `MAIL_TO` | Pendiente: falta la dirección |
| `privacidad` | Política de privacidad completa (Ley N.º 8968) y aprobada | Variables `PUBLIC_DATA_CONTROLLER*` y `PUBLIC_PRIVACY_*` completas | Pendiente |
| `dnssec` | DS publicado en `.com` y cadena validada | `npm run seo:dnssec` en verde y captura de DNSViz | Pendiente: el DS aún no aparece en el padre |
| `pruebasSeo` | Auditoría y pruebas en verde sobre la compilación de producción | Salida de los comandos de abajo | Pendiente: se registra en el momento del lanzamiento |

DNSSEC y el formulario son condiciones operativas y de confianza del proyecto, **no factores de posicionamiento**.

## Procedimiento de lanzamiento (Fase C)

Solo con la autorización expresa de quien dirige el proyecto y de Evelyn:

1. Completar los datos reales en las variables de entorno: contacto, privacidad, autoría (`PUBLIC_AUTHOR_*`) y, si corresponde, `PUBLIC_PROFILE_APPROVED=true`. Revisar en [structured-data.md](structured-data.md) qué declara cada uno.
2. Marcar `revisionProfesional: aprobada` (con `revisadoPor` y `revisadoEl`) en las piezas revisadas, y actualizar su `fecha` a la fecha real de publicación.
3. Completar `src/config/lanzamiento.json` con la evidencia de cada requisito.
4. Ejecutar `npm run seo:lanzamiento`: no debe quedar ningún ✘.
5. Ejecutar `npm run seo:dnssec`: debe estar en verde.
6. Compilar con `SEO_INDEXING_ENABLED=true npm run build:cf`, ejecutar `npm run seo:auditar` y `npm run test:cf`, y revisar `dist/client/robots.txt`, que ahora anuncia el sitemap, y `dist/client/_headers`, con `X-Robots-Tag` solo en las páginas excluidas.
7. Hacer un commit revisable con el registro y el contenido aprobado.
8. Desplegar con `SEO_INDEXING_ENABLED=true npm run deploy`. Antes, confirmar que ninguna Cache Rule de la zona guarda HTML (hoy no hay ninguna; ver [cloudflare-seo.md](cloudflare-seo.md)).
9. Ejecutar `npm run seo:produccion`: la meta y la cabecera deben coincidir, y las páginas elegibles deben tener `index, follow`.

## Después del lanzamiento (Fase D)

Ver [monitoring-plan.md](monitoring-plan.md):

1. Verificar la propiedad en Search Console y Bing Webmaster Tools. La verificación DNS se puede preparar antes.
2. Enviar el sitemap.
3. Inspeccionar las URL prioritarias.
4. Decidir sobre IndexNow.
5. Iniciar el monitoreo de Core Web Vitals y la evaluación GEO.

## Cómo volver atrás

Compilar y desplegar sin `SEO_INDEXING_ENABLED` vuelve a poner `noindex` y `X-Robots-Tag` en todo. Para retirar URL ya indexadas con urgencia, se usa además la herramienta de retirada de Search Console.
