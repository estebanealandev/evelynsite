# Auditoría jurídica

**Fecha de verificación de fuentes:** 4 de noviembre de 2026.

> **Esta auditoría no es un dictamen jurídico.** Las fuentes se contrastaron con los textos oficiales, pero el contenido fue redactado con asistencia de IA y **ninguna persona abogada lo ha revisado todavía**. Debe revisarlo una persona profesional en derecho de Costa Rica antes de publicarse. Cada archivo de contenido incluye el campo `revisionProfesional: pendiente`.

## 1. Asuntos que requieren decisión antes de publicar

### 1.1 Publicidad profesional: riesgo principal

El **artículo 30 del Código de Deberes Jurídicos, Morales y Éticos** permite anunciar servicios de forma digna, moral y con moderación, "evitando el auto elogio". Añade que la publicidad "se limitará a indicar aspectos como" nombre, servicios, dirección, grado académico, especialidad, horario y medios de contacto. El artículo 29 exige procurar clientela por medios dignos.

Una lectura estricta podría objetar parte del lenguaje promocional del encargo. Se conservó porque lo pidió el proyecto, pero debe validarse:

| Texto | Página | Duda |
|---|---|---|
| "Protegemos lo que más importa." | Portada | Promocional; podría sugerir un resultado |
| "enfoque humano, estratégico y comprometido" | Portada | Posible autoelogio |
| "Asesoría legal con criterio, sensibilidad y compromiso." | Sobre Evelyn | Posible autoelogio |
| "Asesoría jurídica personalizada", "Estrategia y claridad" | Portada | Descripción de cualidades |
| "La asesoría adecuada puede marcar una diferencia" | Portada | Podría sugerir ventaja |
| Lenguaje de "firma boutique" | Solo en el encargo; **no se publicó** | Superioridad no comprobada |

Además, ninguna versión consultada permite saber si existen criterios del Colegio sobre publicidad en sitios web. Se debe confirmar con el Colegio. El Código se consultó en SINALEVI, porque el sitio del Colegio presentó un certificado TLS no válido y no se forzó la conexión. **Debe confirmarse que no haya reformas posteriores no recogidas.**

### 1.2 Oferta real de servicios

Las nueve áreas son informativas. Falta confirmar cuáles ofrece Evelyn Elizondo. El Aviso jurídico y la página de áreas lo aclaran, pero conviene eliminar o ajustar lo que no se atienda.

### 1.3 Voz en plural

El encargo usa "brindamos" y "nuestros servicios", lo que sugiere un equipo. Si Evelyn ejerce sola, debe valorarse cambiar a singular para no inducir a error.

### 1.4 Datos profesionales sin confirmar

No se publicó ninguno de estos datos: colegiatura, títulos, universidad, años de experiencia, firmas anteriores, premios, membresías, publicaciones, testimonios, casos, teléfono, correo, dirección, horario, redes sociales ni perfil de Google Business. Tampoco se confirmó que Evelyn Elizondo esté habilitada para ejercer ni que sea abogada.

**La fotografía** debe ser auténtica y autorizada. Hoy la página muestra un monograma.

### 1.5 Funciones añadidas en el rediseño

| Función | Qué revisar |
|---|---|
| Orientador "¿Por dónde empiezo?" (`src/lib/orientador.ts`) | Que las preguntas y su destino no parezcan una calificación jurídica del caso. No guarda ni envía respuestas |
| Salida rápida en las páginas de violencia | Conviene validarla con especialistas. Abre un sitio neutro y reemplaza la página en el historial, pero no borra todo el historial, y así se avisa |
| Formulario por pasos | El contenido legal y el consentimiento no cambian; solo su presentación |
| Respuesta primero en páginas de servicio | Se reordenó el mismo texto. Falta confirmar que el orden no altera el sentido |
| Árbol con dos árboles jóvenes | Es una metáfora visual. Conviene confirmar que no sugiera un tipo único de familia |

Los títulos nuevos "El buen consejo busca resolver, no agravar" y "Para leer con calma" no se han revisado. Las secciones de la página "Sobre Evelyn" se reorganizaron sin añadir datos personales.

## 2. Hallazgos que corrigen supuestos habituales

| Tema | Hallazgo verificado | Fuente |
|---|---|---|
| Ley de Pensiones | **Derogada en su totalidad** | Ley 9747, art. 4 |
| Vigencia del Código Procesal | Rige en su integridad desde el 1 de octubre de 2024 | Ley 9747, transitorio III, reformado por Ley 10315 |
| Divorcio | Art. 48 reformado por Ley 10650 (26/02/2025); hay 8 causales, incluida la incompatibilidad de caracteres | Código de Familia |
| Mutuo consentimiento | Va al Registro Civil si no hay hijos menores comunes ni bienes en el convenio | Art. 48 |
| Unión de hecho | **Numeración actual: arts. 245 a 248**, no 242 a 245 (Ley 10192) | Código de Familia |
| Requisito de unión | "Dos personas" con aptitud legal, por Ley 10223 | Art. 245 |
| Capitulaciones en unión | Reconocidas por Sala Constitucional, res. 13920-2023, según nota de SINALEVI | Arts. 37, 41, 245 |
| Fondo de pensiones | Art. 286 del Código Procesal derogado por Ley 10558 | Código Procesal |
| Prenupcial | La figura local son las capitulaciones matrimoniales | Arts. 37 y 39 |
| Conciliación | Prohibida ante relaciones desiguales de poder | Código Procesal, art. 9 |

**Proyecto de ley 23.982** ("autonomía de la voluntad en los procesos de divorcio y en la unión de hecho", art. 48 ter). No aparece en la versión vigente consultada (versión 43 de 43). Se encontró un dictamen de redacción final de 2026, pero no se confirmó su estado. **Debe verificarse antes de publicar**, porque podría cambiar el contenido sobre divorcio.

## 3. Fuentes consultadas

Todas se consultaron el 4 de noviembre de 2026 en SINALEVI (Sistema Costarricense de Información Jurídica, Procuraduría General de la República).

| Norma | Versión consultada | ID |
|---|---|---|
| Código de Familia, Ley 5476 | 43 de 43 | 970 |
| Código Procesal de Familia, Ley 9747 | 4 de 4 | 90569 |
| Ley 9747 (aprobación, derogatorias, transitorios) | 3 de 3 | 90576 |
| Código de la Niñez y la Adolescencia, Ley 7739 | 23 de 23 | 43077 |
| Ley contra la Violencia Doméstica, Ley 7586 | 7 de 7 | 27926 |
| Ley 8968, Protección de Datos | Última disponible | 70975 |
| Reglamento a la Ley 8968, Decreto 37554 | Última disponible | 74352 |
| Código de Deberes del Colegio de Abogados y Abogadas | Última disponible | 54060 |

**Referencias secundarias**, usadas solo para orientarse y nunca como fuente de una norma: prensa y sitios de terceros sobre la derogación de la Ley 7654, y una copia comercial del Código Procesal. También una búsqueda de páginas del INAMU y del PANI para los recursos de emergencia.

**No consultado:** jurisprudencia directa de la Sala Constitucional ni de tribunales. Las referencias a resoluciones provienen de las notas oficiales de SINALEVI. El sitio no cita ninguna sentencia cuyo texto no aparezca en esas notas.

## 4. Revisión por contenido

Estado de todas las páginas: **fuentes contrastadas; revisión profesional pendiente.**

| Contenido | Normas principales | Puntos a revisar con especial cuidado |
|---|---|---|
| Divorcios | CF 41, 48-63; CPF 222, 230, 233, 289-293 | Alcance del plazo de un año del art. 49; "no establece tiempo mínimo de matrimonio" |
| Pensiones alimentarias | CF 164-174, 248; CPF 56, 197, 257-287; CNA 37-38 | Vigencia de disposiciones tras Ley 10558; apremio |
| Guarda y crianza | CF 56, 140-155; CNA 5, 29, 30, 35; CPF 222, 290, 316-319 | Distinción terminológica; "opiniones consideradas" según edad |
| Interrelación | CF 141, 151, 152; CNA 35; CPF 316-319; LCVD 3 | **"El contacto no depende del pago de la pensión":** afirmación general sin artículo expreso |
| Gananciales | CF 37, 40-47, 245; CPF 140, 222, 320-322 | Empresas: análisis general, sin regla ni jurisprudencia específica; efectos de capitulaciones |
| Unión de hecho | CF 43, 92, 152, 245-248; CPF 222, 289-293 | Efectos sucesorios no desarrollados; parejas del mismo sexo; vía procesal |
| Filiación | CF 69-77, 84-86, 89-99, 141; CPF 222 | Plazos afectados por varias resoluciones constitucionales; arts. 73 y 86 |
| Acuerdos | CF 37-41, 48, 60, 141, 167; CPF 9, 193-197 | Alcance de las capitulaciones sobre temas no patrimoniales |
| Protección familiar | LCVD 1-14; CPF 9, 196 | Definición del art. 2 ("pariente colateral"); violencia vicaria; otras leyes penales no desarrolladas |
| 15 artículos | Según cada archivo, con sus fuentes | Mismos puntos, y la cita al Código de Deberes |
| Política de privacidad | Ley 8968 y reglamento | Base de datos, posible inscripción ante Prodhab, plazos y datos del responsable |
| Aviso jurídico | CDJ 30 | Compatibilidad con la normativa profesional |

**Recursos de emergencia:** el 9-1-1 y la línea 1147 del PANI proceden de páginas institucionales. No se publicó el horario de la 1147 ni un teléfono de la Delegación de la Mujer, porque las fuentes eran antiguas. **Conviene confirmarlos** y valorar añadir recursos del INAMU.

**Verificación no completa:** los artículos se leyeron para las materias citadas, no se comparó cada oración con cada reforma histórica. El Reglamento 37554 se obtuvo pero no se analizó a fondo. La política de privacidad se apoya sobre todo en la Ley 8968.

## 5. Avisos implementados

- Aviso de pie: fines informativos, sin relación profesional automática y resultados dependientes del caso.
- Aviso jurídico completo.
- Nota de fuentes y fecha en cada servicio y artículo.
- Consentimiento y advertencia sobre datos sensibles en el formulario.
- Aviso de emergencias en formulario, contacto, guarda, interrelación y protección familiar.

## 6. Riesgos de contenido

| Riesgo | Mitigación actual | Acción pendiente |
|---|---|---|
| Lenguaje promocional | Sin superlativos ni comparaciones; sin promesas | Validar con persona abogada (1.1) |
| Cambio normativo | Fecha visible y enlaces oficiales | Definir revisiones periódicas |
| Consultas sensibles por web | Advertencia y campos mínimos | Definir procedimiento interno y conservación |
| Riesgo para víctimas de violencia | Recursos de emergencia y aviso | Revisar con especialista |
| Fecha de publicación de artículos | Fecha real de creación | Ajustar al publicar |
| Propiedad de la marca | Diseño original | Búsqueda de antecedentes |
| Inspiración en un sitio ajeno | No se copió código, texto ni imágenes | Valorar el grado de similitud visual |
