# Mapa de consultas — Derecho de familia en Costa Rica

Fecha: 7 de noviembre de 2026. Rama: `seo/geo-enterprise-2026`. Estado del sitio: no indexable (meta robots y `X-Robots-Tag` con `noindex`; política en `src/config/indexacion.mjs`), contenido con `revisionProfesional: pendiente`.

## Alcance y limitaciones

- **No hay acceso a herramientas de volumen ni de dificultad** (Ahrefs, Semrush, Google Keyword Planner, Search Console con datos). Este documento **no incluye volúmenes de búsqueda, dificultad numérica, CPC ni tráfico estimado**. Ninguna cifra de esa clase debe agregarse sin fuente.
- El mapa es **cualitativo**: se construyó a partir de la terminología de las normas costarricenses que el sitio ya cita, de las formas coloquiales con que la gente nombra esos temas («visitas», «custodia», «pensión») y del contenido existente.
- La **prioridad** combina tres criterios cualitativos: relación con un área de servicio, urgencia para quien busca (plazos, notificaciones, apremio) y cobertura actual del sitio. No refleja demanda medida.
- Cuando exista Search Console (ver `monitoring-plan.md`), las consultas reales sustituyen las hipótesis de esta tabla. La columna «Estado» debe actualizarse entonces.

## Terminología de referencia

Se usa el término de la norma y se acepta el coloquial como variante de búsqueda, no como término principal del texto (regla de `docs/auditoria-evelyn/guia-editorial.md`):

| Término normativo | Variantes con que se busca |
|---|---|
| Pensión alimentaria, obligación alimentaria | pensión, cuota alimentaria, «poner una pensión» |
| Guarda, crianza y educación; responsabilidad parental | custodia, tenencia, patria potestad |
| Régimen de interrelación familiar | régimen de visitas, visitas |
| Bienes gananciales | gananciales, «división de bienes» |
| Unión de hecho | unión libre, convivencia, «juntados» |
| Código de Familia (Ley N.º 5476) | ley de familia |
| Código Procesal de Familia (Ley N.º 9747, rige desde el 1 de octubre de 2024) | nuevo código procesal de familia, «la nueva ley de familia» |
| Medidas de protección (Ley N.º 7586) | orden de alejamiento, «medidas» |
| Apremio corporal | «cárcel por pensión», orden de captura por pensión |

Sin modificadores geográficos de provincia o cantón mientras no se confirme una oficina con atención presencial (ver `local-seo.md`). Costa Rica figura como jurisdicción, no como cobertura presencial.

## Leyenda

- **Intención:** informativa, comercial (evalúa opciones o profesionales), transaccional (quiere contratar o agendar), navegacional (busca un sitio concreto), urgente (plazo, notificación o riesgo en curso).
- **Fase:** descubrimiento (entiende su situación), consideración (compara vías), decisión (busca quién le asesore), acción inmediata.
- **Canibalización:** riesgo de que dos URL del sitio compitan por la misma consulta. Alta = títulos o estructura casi equivalentes.
- **Estado:** cubierta; cubierta, ajustar (existe pero hay que reenfocar); hueco (brief en `content-strategy.md`); no atender (fuera de alcance o requiere decisión de la responsable).

## Tabla de consultas

### Divorcio

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| divorcio costa rica | comercial | consideración | Divorcio | `/servicios/divorcios` | Alta | Alta: `/blog/diferencias-divorcio-consensuado-contencioso`, `/blog/divorcio-mutuo-consentimiento-costa-rica`, `/orientacion/alternativas-para-divorciarse`, `/blog/categoria/divorcio` | Pilar. Su `metaTitulo` («mutuo consentimiento y causales») invade los dos satélites | Cubierta, ajustar |
| cómo divorciarse en costa rica | informativa | descubrimiento | Divorcio | `/servicios/divorcios` | Alta | Media: ficha de alternativas | La ficha debe orientarse a «qué reunir», no a explicar vías | Cubierta, ajustar |
| requisitos para divorciarse en costa rica | informativa | consideración | Divorcio | `/servicios/divorcios` | Alta | Media: ficha de alternativas | | Cubierta |
| divorcio por mutuo consentimiento | informativa | consideración | Divorcio | `/blog/divorcio-mutuo-consentimiento-costa-rica` | Alta | Alta con el servicio | Satélite: del convenio a la aprobación | Cubierta, ajustar |
| divorcio en el registro civil | informativa | consideración | Divorcio | `/blog/divorcio-mutuo-consentimiento-costa-rica` | Media | Media | Reforma del artículo 48 por la Ley N.º 10650: confirmar alcance vigente antes de reforzar | Cubierta |
| convenio de divorcio | informativa | decisión | Divorcio | `/blog/divorcio-mutuo-consentimiento-costa-rica` | Media | Media con `/servicios/acuerdos-familiares` | | Cubierta |
| mi esposo no quiere firmar el divorcio / divorcio contencioso | informativa | descubrimiento | Divorcio | `/blog/diferencias-divorcio-consensuado-contencioso` | Alta | Media con el servicio (FAQ «¿Necesito el consentimiento…?») | Satélite: «si su cónyuge no firma» | Cubierta, ajustar |
| causales de divorcio costa rica | informativa | descubrimiento | Divorcio | `/servicios/divorcios` | Media | Alta: el satélite contencioso también las desarrolla | El satélite debe resumirlas y enlazar al pilar | Cubierta, ajustar |
| separación judicial | informativa | consideración | Divorcio | `/servicios/divorcios` | Baja | Baja | Ya hay FAQ en el servicio | Cubierta |
| pensión para la excónyuge / alimentos después del divorcio | informativa | consideración | Divorcio / Alimentos | `/servicios/divorcios` | Media | Media con `/servicios/pensiones-alimentarias` | Fijar una sola página dueña de la consulta | Cubierta |
| divorcio con cónyuge en el extranjero / validez de divorcio extranjero | informativa | consideración | Divorcio | Nueva: `/blog/divorcio-con-conyuge-en-el-extranjero` | Media | Baja | Brief B5 | Hueco |
| abogada de divorcios costa rica | transaccional | decisión | Divorcio | `/servicios/divorcios` → `/agendar-consulta` | Alta | Baja | Depende de datos profesionales confirmados; sin superlativos | Cubierta |
| cuánto cuesta un divorcio en costa rica | comercial | consideración | Divorcio | Ninguna | — | — | No se publican honorarios ni rangos sin decisión de la responsable | No atender |

### Pensiones alimentarias

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| pensión alimentaria costa rica | informativa | descubrimiento | Pensiones | `/servicios/pensiones-alimentarias` | Alta | Alta con `/blog/como-se-establece-pension-alimentaria` | Pilar | Cubierta |
| cómo poner una pensión alimentaria | informativa | acción inmediata | Pensiones | `/blog/como-se-establece-pension-alimentaria` | Alta | Alta: el servicio anuncia «fijación» en su meta | Satélite paso a paso; hoy no aparece en «Para seguir leyendo» del servicio | Cubierta, ajustar |
| qué necesito para pedir pensión alimentaria | informativa | acción inmediata | Pensiones | Nueva: `/orientacion/solicitar-una-pension-alimentaria` | Alta | Media con el artículo anterior | Brief F1, lista de preparación | Hueco |
| aumento de pensión alimentaria / rebajo de pensión | informativa | consideración | Pensiones | `/blog/aumento-rebajo-pension-alimentaria` | Alta | Alta con `/orientacion/revisar-una-pension-alimentaria` y con FAQ del servicio | Artículo = qué procede; ficha = qué reunir | Cubierta, ajustar |
| exoneración de pensión alimentaria | informativa | consideración | Pensiones | `/blog/aumento-rebajo-pension-alimentaria` | Media | Media | | Cubierta |
| aumento automático de la pensión | informativa | descubrimiento | Pensiones | `/blog/aumento-rebajo-pension-alimentaria` | Media | Alta: FAQ «¿La cuota aumenta sola?» del servicio y la ficha | Respuesta breve en el servicio, desarrollo en el satélite | Cubierta, ajustar |
| aguinaldo pensión alimentaria / salario escolar | informativa | acción inmediata | Pensiones | `/servicios/pensiones-alimentarias` | Media (estacional: diciembre y enero) | Media con `/blog/como-se-establece-pension-alimentaria` | Considerar un ancla propia en el servicio | Cubierta |
| qué pasa si no pago la pensión / apremio corporal | urgente | acción inmediata | Pensiones | `/servicios/pensiones-alimentarias` | Alta | Baja | | Cubierta |
| me llegó una orden de apremio | urgente | acción inmediata | Pensiones | `/servicios/pensiones-alimentarias` y `/orientacion/recibi-una-notificacion-judicial` | Alta | Baja | La ficha no enlaza hoy al servicio desde el cuerpo, solo desde «Áreas relacionadas» | Cubierta |
| pensión hijos mayores de edad que estudian | informativa | consideración | Pensiones | `/servicios/pensiones-alimentarias` | Media | Baja | | Cubierta |
| pensión alimentaria trabajador independiente / sin salario fijo | informativa | consideración | Pensiones | Nueva: `/blog/pension-alimentaria-ingresos-variables` | Media | Media con `/blog/como-se-establece-pension-alimentaria` | Brief B7 | Hueco |
| pensión alimentaria para padres adultos mayores | informativa | descubrimiento | Pensiones | Nueva: `/blog/pension-alimentaria-para-padres` | Media | Baja | Brief B4 | Hueco |
| impedimento de salida del país por deuda de pensión | urgente | acción inmediata | Pensiones | Nueva: `/blog/deuda-alimentaria-salida-del-pais` | Media | Baja | Brief B3, condicionado a verificación normativa | Hueco |
| si no paga la pensión puede ver a su hijo | informativa | descubrimiento | Pensiones / Interrelación | Nueva: `/blog/pension-alimentaria-e-interrelacion-familiar` | Alta | Baja | Brief B8 | Hueco |
| abogada pensión alimentaria | transaccional | decisión | Pensiones | `/servicios/pensiones-alimentarias` → `/agendar-consulta` | Alta | Baja | | Cubierta |
| abogado gratis pensión alimentaria / defensa pública | informativa | consideración | Procesos | `/blog/aspectos-antes-de-iniciar-proceso-familia` | Media | Baja | Responder con honestidad; no ocultar la asistencia pública | Cubierta |
| consultar pensión en línea / depositar pensión | navegacional | acción inmediata | Pensiones | Ninguna | — | — | Intención hacia servicios del Poder Judicial; a lo sumo, enlace oficial dentro del servicio | No atender |

### Guarda, crianza y educación

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| guarda crianza y educación | informativa | descubrimiento | Guarda | `/servicios/guarda-crianza` | Alta | Media con `/blog/guarda-crianza-responsabilidad-parental` (mismo slug que el tema) | El artículo es un glosario de términos; renombrar su slug antes de indexar | Cubierta, ajustar |
| custodia de hijos costa rica / custodia compartida | informativa | consideración | Guarda | `/servicios/guarda-crianza` | Alta | Media | | Cubierta |
| patria potestad / responsabilidad parental | informativa | descubrimiento | Guarda | `/blog/guarda-crianza-responsabilidad-parental` | Media | Media | Hoy no aparece en «Para seguir leyendo» del servicio de guarda | Cubierta, ajustar |
| opinión de los hijos en el divorcio | informativa | consideración | Guarda | `/blog/derechos-hijos-menores-durante-divorcio` | Media | Baja | | Cubierta |
| cambiar la custodia / modificar guarda | informativa | consideración | Guarda | Nueva: `/orientacion/modificar-guarda-o-interrelacion` | Media | Media con el servicio | Brief F3 | Hueco |
| permiso de salida del país de un menor sin permiso del padre o la madre | urgente | acción inmediata | Guarda | Nueva: `/blog/permiso-salida-del-pais-persona-menor-de-edad` | Alta | Baja | Brief B1 | Hueco |
| mudarse con los hijos a otro país / sustracción internacional | urgente | consideración | Guarda | Nueva: `/blog/cambio-de-residencia-con-hijos` | Media | Media con B1 | Brief B2 | Hueco |

### Interrelación familiar

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| régimen de visitas costa rica | informativa | descubrimiento | Interrelación | `/servicios/interrelacion-familiar` | Alta | Media con `/blog/regimen-interrelacion-familiar` | Usar «visitas» una vez como aclaración | Cubierta |
| régimen de interrelación familiar | informativa | descubrimiento | Interrelación | `/servicios/interrelacion-familiar` | Alta | Media: el slug del artículo es el nombre del tema, el contenido es el incumplimiento | Renombrar slug del artículo antes de indexar | Cubierta, ajustar |
| no me deja ver a mi hijo / incumplimiento de visitas | urgente | acción inmediata | Interrelación | `/blog/regimen-interrelacion-familiar` | Alta | Baja | | Cubierta |
| visitas de abuelos | informativa | descubrimiento | Interrelación | `/servicios/interrelacion-familiar` | Baja | Baja | | Cubierta |

### Bienes gananciales y acuerdos

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| bienes gananciales costa rica | informativa | descubrimiento | Gananciales | `/servicios/bienes-gananciales` | Alta | Alta con `/blog/como-se-regulan-bienes-gananciales` (títulos casi idénticos) | Ver resolución en `content-strategy.md` | Cubierta, ajustar |
| qué bienes no son gananciales / liquidación de gananciales | informativa | consideración | Gananciales | `/blog/como-se-regulan-bienes-gananciales` | Media | Alta | | Cubierta, ajustar |
| afectación de vivienda familiar | informativa | consideración | Gananciales | `/servicios/bienes-gananciales` | Media | Baja | | Cubierta |
| empresa o sociedad en el divorcio | informativa | consideración | Gananciales | `/blog/familias-con-patrimonio-empresarial` | Media | Baja | | Cubierta |
| capitulaciones matrimoniales / acuerdo prenupcial | informativa | consideración | Acuerdos | `/servicios/acuerdos-familiares` | Media | Media: secciones «Capitulaciones» en el servicio de gananciales y en ambas páginas de unión de hecho | Dueña: acuerdos familiares | Cubierta |
| conciliación en procesos de familia | informativa | consideración | Procesos | `/blog/acuerdos-familiares-solucion-conflictos` | Media | Media con `/servicios/acuerdos-familiares` (su meta anuncia «casos en que se prohíbe conciliar») | Slug no coincide con el tema (conciliación) | Cubierta, ajustar |

### Unión de hecho y filiación

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| unión de hecho costa rica requisitos | informativa | descubrimiento | Unión de hecho | `/servicios/union-de-hecho` | Alta | Alta con `/blog/union-de-hecho-efectos-legales` (estructura casi idéntica) | Ver resolución en `content-strategy.md` | Cubierta, ajustar |
| plazo para reconocer la unión de hecho | urgente | acción inmediata | Unión de hecho | `/blog/union-de-hecho-efectos-legales` | Alta | Alta: el servicio anuncia el plazo en su meta | Plazo de caducidad: consulta con riesgo real | Cubierta, ajustar |
| me separé y no estábamos casados | informativa | descubrimiento | Unión de hecho | Nueva: `/orientacion/separarse-sin-haberse-casado` | Media | Media con el servicio | Brief F2 | Hueco |
| prueba de ADN paternidad costa rica | informativa | consideración | Filiación | `/servicios/filiacion-paternidad` | Media | Baja | | Cubierta |
| reconocer a un hijo / declaración de paternidad | informativa | acción inmediata | Filiación | `/servicios/filiacion-paternidad` y nueva `/orientacion/reconocimiento-de-paternidad` | Media | Media | Brief F4 | Hueco |
| plazo para impugnar la paternidad | urgente | consideración | Filiación | `/blog/procedimientos-filiacion-paternidad` | Media | Media: el servicio también anuncia plazos | Slug genérico frente a contenido sobre plazos | Cubierta, ajustar |

### Violencia doméstica y protección

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| medidas de protección violencia doméstica | urgente | acción inmediata | Protección | `/servicios/proteccion-familiar` | Alta | Media con `/blog/proteccion-juridica-violencia-domestica` | Sin CTA comercial; 9-1-1 y recursos visibles | Cubierta |
| qué pasa después de pedir medidas de protección | informativa | consideración | Protección | `/blog/proteccion-juridica-violencia-domestica` | Media | Media | | Cubierta |
| violencia vicaria costa rica | informativa | descubrimiento | Protección | `/servicios/proteccion-familiar` | Media | Media con `/blog/guarda-crianza-responsabilidad-parental` | Fijar una dueña | Cubierta |
| violencia patrimonial | informativa | descubrimiento | Protección | Nueva: `/blog/violencia-patrimonial-en-la-familia` | Media | Media con el servicio | Brief B6 | Hueco |

### Consultas generales y de marca

| Keyword | Intención | Fase | Tema | Página recomendada | Prioridad | Canibalización | Observaciones | Estado |
|---|---|---|---|---|---|---|---|---|
| código procesal de familia / ley 9747 | informativa | descubrimiento | Procesos | `/blog/cambios-codigo-procesal-familia` | Alta | Baja | Actúa como pilar del clúster «Procesos de familia» | Cubierta |
| reformas al código de familia | informativa | descubrimiento | Procesos | Nueva: `/biblioteca-juridica/cambios-normativos` | Media | Media con el artículo anterior | Brief D2 | Hueco |
| términos de derecho de familia / glosario | informativa | descubrimiento | Transversal | Nueva: `/biblioteca-juridica/glosario` | Media | Media con `/blog/guarda-crianza-responsabilidad-parental` | Brief D1 | Hueco |
| me llegó una notificación del juzgado de familia | urgente | acción inmediata | Procesos | `/orientacion/recibi-una-notificacion-judicial` | Alta | Baja | Hoy solo se llega a la ficha desde `/orientacion` | Cubierta, ajustar |
| antes de iniciar un proceso de familia / primera consulta | informativa | consideración | Procesos | `/blog/aspectos-antes-de-iniciar-proceso-familia` | Media | Baja | | Cubierta |
| abogada de familia costa rica | comercial | decisión | Transversal | `/` y `/servicios` | Alta | Baja | Sin superlativos ni afirmaciones de experiencia no confirmadas | Cubierta |
| evelyn elizondo abogada | navegacional | decisión | Marca | `/` y `/sobre-evelyn` | Alta | Baja | Requiere nombre profesional y credenciales confirmados | Cubierta, ajustar |
| abogada de familia en [cantón o provincia] | comercial | decisión | Local | Ninguna | — | — | No se crean páginas por localidad sin oficina confirmada | No atender |

## Canibalizaciones detectadas entre páginas existentes

Resumen; la resolución detallada está en `content-strategy.md`, sección «Resolución de canibalizaciones».

1. **Divorcio (cuatro URL):** servicio, dos artículos y una ficha compiten por «divorcio costa rica» y «tipos de divorcio». El servicio es pilar; los artículos son satélites de una pregunta concreta; la ficha se limita a preparación.
2. **Bienes gananciales:** `metaTitulo` del servicio («qué son y cómo se liquidan») y del artículo («¿Qué bienes son gananciales y cómo se liquidan…?») son casi iguales, y ambos desarrollan exclusiones, liquidación, vivienda y unión de hecho.
3. **Unión de hecho:** el artículo repite la estructura del servicio (plazo, reconocimiento por mutuo consentimiento, efectos patrimoniales, alimentos, capitulaciones).
4. **Revisión de pensión:** el artículo de aumento y rebajo, la ficha de revisión y dos FAQ del servicio responden lo mismo (aumento automático, pérdida de empleo).
5. **Slugs que nombran el tema y no la pregunta:** `/blog/guarda-crianza-responsabilidad-parental`, `/blog/regimen-interrelacion-familiar`, `/blog/procedimientos-filiacion-paternidad`, `/blog/acuerdos-familiares-solucion-conflictos`, `/blog/como-se-regulan-bienes-gananciales`. Antes de indexar, cambiarlos no tiene costo de posicionamiento; conviene hacerlo con redirección 301 porque el dominio ya está publicado.
6. **Archivos de categoría:** `/blog/categoria/*` será indexable tras el lanzamiento y figura en el sitemap. Las categorías con un solo artículo (filiación, protección familiar, interrelación familiar, unión de hecho) son listados delgados que compiten con el servicio homónimo.
