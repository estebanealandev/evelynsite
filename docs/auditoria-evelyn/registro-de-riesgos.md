# Registro de riesgos

| Riesgo | Gravedad | Mitigación | Estado |
|---|---|---|---|
| Citar una versión histórica de una norma | Crítica | La descarga exige la última versión. El registro guarda versión y huella | Mitigado |
| Afirmación jurídica incorrecta | Crítica | Matriz verificada contra el texto oficial y revisión adversarial. **Falta revisión de una persona abogada** | Mitigado en parte |
| Orientador tomado como diagnóstico | Crítica | Señala un tema y aclara que no concluye | Mitigado |
| Falsa seguridad con la salida rápida | Crítica | Explica lo que no hace: no borra historial ni protege ante programas espía | Mitigado. Falta validar con especialistas |
| Datos sensibles en el formulario | Alta | Minimización, aviso, sin archivos, sin registro de contenido y TLS | Mitigado |
| Publicidad profesional contra el art. 30 del Código de Deberes | Alta | Texto sin autoelogio. Falta criterio del Colegio | Mitigado en parte |
| Servicios anunciados sin confirmar | Alta | El sitio lo presenta como información. Falta confirmación de Evelyn | **Bloqueado por dato externo** |
| Identidad profesional no comprobada | Alta | No se publica ningún dato. La autoría solo se declara si se activa | **Bloqueado por dato externo** |
| Contenido redactado con IA sin revisión profesional | Alta | `revisionProfesional: pendiente`; se mantiene `noindex` | **Bloqueado por dato externo** |
| Reformas posteriores a la copia | Media | `npm run normas:vigilar` compara y señala las afirmaciones afectadas. Falta programarlo | Preparado |
| SINALEVI cambia su página y rompe la descarga | Media | La descarga falla con error y no se toma como «sin cambios» | Mitigado |
| Compatibilidad en Safari real | Media | Probado con WebKit de Playwright, que no equivale a Safari en un dispositivo | Pendiente |
| Rendimiento con la fuente Newsreader, de 124 KB | Media | Subconjunto y medición en el presupuesto de LCP | Medido en Fase 6 |
| Carga intermitente de la portada en WebKit (1 de 5 repeticiones) | Media | Sin causa demostrada; puede ser WebGL por software | **Probar en Safari real** |
| Proyecto 23.982 aprobado después de la consulta | Alta | No se menciona. La vigilancia detectaría el cambio en el Código de Familia | Volver a comprobar antes de publicar |
| Línea 1147 del PANI sin lectura directa de la fuente | Media | Publicada sin horario; el sitio oficial bloqueó la lectura automática | Confirmar a mano |

