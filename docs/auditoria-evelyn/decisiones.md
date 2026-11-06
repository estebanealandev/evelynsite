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
| Árbol único con raíces en lugar de árbol grande y dos jóvenes | Tres árboles se leían como progenitor e hijos: una sola forma de familia. Se mantiene el concepto *Crecer* | Conservar la composición anterior |
| Orientador: «Tema para revisar» y sin consulta en el resultado de riesgo | Señala qué leer. Ante un riesgo, lo prioritario es el aviso y poder salir | «Le puede servir» con invitación a agendar |
| Publicación en `main`: no se hace | Faltan revisión legal, datos reales, SMTP y dominio | Fusionar por tener pruebas en verde |
| Vigilancia programada como temporizador en `ops/`, sin instalar | Instalarlo cambia la configuración del equipo. Requiere decidir dónde corre | Crear tareas persistentes por cuenta propia |
