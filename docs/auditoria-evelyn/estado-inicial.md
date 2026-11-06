# Estado inicial

Comprobado el 5 de noviembre de 2026, antes de modificar nada.

| Punto | Resultado |
|---|---|
| Rama de partida | `rediseno/completo`, commit `5ade437`, sin cambios locales |
| `main` | `60b2b1b`, sin tocar |
| Etiqueta de respaldo | `base-antes-rediseno` (sin eñe; el nombre del encargo llevaba eñe) |
| Otras ramas | `rediseno/fase-1`, `rediseno/fase-3-arboles`, `rediseno/fase-3-prototipos` |
| Remoto Git | **Ninguno**: no hay GitHub ni otro destino, por lo que no se hizo push ni se abrió PR |
| Procesos y tareas activas | Ninguno. Sin otros worktrees |
| Rama de trabajo | `auditoria/plan-maestro`, creada desde `5ade437` |
| Node y npm | 24.22.2 y 11.19.1 |
| Dependencias | `npm audit --omit=dev`: 0 vulnerabilidades |
| Secretos | Ninguno versionado. `.env` ignorado por Git; `var/outbox` ignorado |
| Tipos | `astro check`: 0 errores, 0 avisos, 79 sugerencias |
| Pruebas | Una pasada en Chrome: **205 superadas, 7 omitidas, 0 fallidas** |
| Linter | No hay ninguno configurado |
| Publicación | Sin publicar. `PUBLIC_SITE_READY=false`, con `noindex` y `robots.txt` bloqueando |

## Arquitectura
Astro 7 con `output: 'static'` y adaptador Node; los formularios (`/api/consulta`, `/api/suscripcion`) son las únicas rutas dinámicas. El contenido sale de colecciones Markdown (9 servicios y 15 artículos) y se compila al construir. El árbol usa three.js con carga diferida y un Web Worker.

## Fuentes
Las normas se leyeron en SINALEVI abriendo la página en un navegador, porque se genera con JavaScript. La descarga exige que la página diga «última versión» y que el número de versión coincida con el total. Si no, falla en lugar de guardar una versión histórica.

| Norma | Versión |
|---|---|
| Código de Familia | 43 de 43 |
| Código Procesal de Familia | 4 de 4 |
| Ley 9747, aprobación del Código Procesal | 3 de 3 |
| Código de la Niñez y la Adolescencia | 23 de 23 |
| Ley contra la Violencia Doméstica | 7 de 7 |
| Ley 8968 | 1 de 1 |
| Reglamento a la Ley 8968 | 3 de 3 |
| Código de Deberes | 8 de 8 |
