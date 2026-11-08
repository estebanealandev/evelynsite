# Decisiones

Tomadas sin consultar porque el encargo así lo pide. Todas se pueden revertir con Git.

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Rama `auditoria/plan-maestro` desde `5ade437` | Conserva `main`, `rediseno/completo` y la etiqueta intactos hasta validar | Trabajar en la rama de rediseño |
| Guardar copia oficial de las normas en el repositorio | La versión comprobada queda identificable, y las citas se verifican sin red | Depender de la URL, que puede mostrar otra versión |
| Cada afirmación lleva `texto` y `cita` literales, comprobados por programa | Impide citas inventadas y detecta cuándo el contenido se aleja de la matriz | Una matriz descriptiva, que no se puede comprobar |
| Retirar la suscripción por correo | No había boletín, baja ni doble confirmación. Recogía correos para un servicio que no existe | Mantenerla como estaba |
| Límite de 1200 caracteres en el mensaje y nombre sin exigir «completo» | El primer contacto no necesita un relato ni más datos | Dejar 3000 caracteres |
| Asunto del correo sin tema de consulta | Las notificaciones pueden verse en una pantalla ajena | `Nueva consulta: Divorcio` |
| SMTP con TLS obligatorio | Sin cifrado, la consulta no se envía | Aceptar lo que ofrezca el servidor |
| Quitar `unsafe-inline` de `script-src` | Bloquea scripts inyectados. El único script en línea va autorizado por su huella | Dejarlo por comodidad |
| Servidor propio `scripts/servidor.mjs` para las cabeceras | Astro no controla las respuestas estáticas, y `frame-ancestors` no funciona en una etiqueta meta | Dejarlo en manos de un proxy que aún no existe |
| Retirar el marcado `FAQPage` | Google retiró ese resultado enriquecido; las preguntas siguen visibles | Mantener marcado sin efecto |
| `noindex` en páginas de etiqueta y fuera del sitemap | Son listados breves que compiten con el blog y las categorías | Indexarlas |
| Newsreader e IBM Plex Sans | No hay licencias de Tiempos, Söhne ni Lyon en el repositorio y no se compra nada. Ambas tienen licencia OFL | Usar archivos comerciales |
| Encabezado interior claro | Las páginas de lectura larga no necesitan un bloque oscuro; el oscuro queda para la portada y el pie | Mantener navy en todas |
| Árbol grande con dos jóvenes | Decisión del propietario tras comparar en pantalla. La alternativa de un solo árbol con raíces se probó y se descartó; consta en el commit `61dc289` | Árbol único con raíces, propuesto para no sugerir un solo tipo de familia |
| Orientador: «Tema para revisar» y sin consulta en el resultado de riesgo | Señala qué leer. Ante un riesgo, lo prioritario es el aviso y poder salir | «Le puede servir» con invitación a agendar |
| Publicación en `main`: no se hace | Faltan revisión legal, datos reales, SMTP y dominio | Fusionar por tener pruebas en verde |
| Vigilancia programada como temporizador en `ops/`, sin instalar | Instalarlo cambia la configuración del equipo. Requiere decidir dónde corre | Crear tareas persistentes por cuenta propia |
| Salida rápida en todo el sitio salvo la portada | Cualquier página de familia puede leerla alguien bajo control. La revisión técnica lo señaló | Solo en páginas de violencia |
| Retirar el acuse automático | No se puede verificar la dirección y puede revelar la consulta | Dejarlo desactivado |
| `no-store` en todas las páginas | En un equipo compartido, Atrás no debe mostrar lo leído o escrito. Se paga con una recarga de HTML | Caché normal |
| Sin invitación a consultar en la página de violencia | Para pedir medidas no hace falta una consulta | Mantener el llamado |
| No citar la Ley 8589 ni la 9582 | No están en la copia oficial | Citarlas de memoria |
| Identidad A · Doble: hero negro `#1B1A18`, logo crema `#DAD5CC`, nombre en Marcellus, sitio en Schibsted Grotesk | La eligió el responsable del proyecto entre tres propuestas (`design/branding-evelyn/`). Falta la aprobación de Evelyn y la búsqueda de marcas | Navy con oro y Newsreader; propuestas B y C |
| Símbolo de tres cortes con esquinas apenas redondeadas | Lo decidió el responsable del proyecto, que lo considera un diseño genérico. Usa la disposición de cortes del logotipo de El’Element, con otra proporción y otras esquinas; no hay licencia ni revisión legal, y una persona especialista debe compararlos antes de usarlo o registrarlo | Cuatro cortes; variante de dos E separadas |
| Alojamiento en Cloudflare Workers con recursos estáticos | Encargo del responsable del proyecto, con el dominio comprado en Cloudflare. Las páginas no ejecutan código; el formulario corre en el Worker con límite compartido. Se mantienen `noindex` y `Disallow: /` | VPS con Node; Cloudflare Pages, que ya no se recomienda para proyectos nuevos |
| Sin registro automático de cada petición en Workers | Las direcciones y rutas de quien consulta no deben quedar en registros | Activar los registros de invocación |
| Doble destino de compilación (`DESTINO=cloudflare`) | Mantiene el servidor Node para las pruebas de correo SMTP y el buzón local, y prueba la compilación de Workers con `npm run test:cf` | Reescribir todas las pruebas para Workers |
