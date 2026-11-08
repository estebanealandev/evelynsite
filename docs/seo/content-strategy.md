# Estrategia de contenido — arquitectura pilar-clúster

Fecha: 7 de noviembre de 2026. Complementa `keyword-research.md`. Las reglas de redacción son las de `docs/auditoria-evelyn/guia-editorial.md`; este documento no las sustituye.

## 1. Inventario actual

| Colección | Ruta | Piezas | Función |
|---|---|---|---|
| `servicios` | `/servicios/[slug]` | 9 | Pilares por área |
| `articulos` | `/blog/[slug]` | 15 | Satélites: una pregunta concreta por artículo |
| `fichas` | `/orientacion/[slug]` | 3 | Preparación por situación: qué reunir y qué suele ser relevante |
| Páginas fijas | `/biblioteca-juridica`, `/sobre-evelyn`, `/contacto`, `/agendar-consulta`, `/aviso-juridico`, `/politica-de-privacidad` | — | Referencia normativa, confianza y conversión |
| Archivos | `/blog/categoria/[slug]` (indexables), `/blog/etiqueta/[slug]` (`noindex`) | 9 categorías | Navegación |

### Clústeres actuales

| Pilar (servicio) | Satélites que lo declaran en `servicios:` | Ficha relacionada |
|---|---|---|
| `divorcios` | `diferencias-divorcio-consensuado-contencioso`, `divorcio-mutuo-consentimiento-costa-rica`, `derechos-hijos-menores-durante-divorcio`, `como-se-regulan-bienes-gananciales`, `aspectos-antes-de-iniciar-proceso-familia`, `cambios-codigo-procesal-familia` | `alternativas-para-divorciarse` |
| `pensiones-alimentarias` | `como-se-establece-pension-alimentaria`, `aumento-rebajo-pension-alimentaria`, `procedimientos-filiacion-paternidad`, `aspectos-antes-de-iniciar-proceso-familia`, `cambios-codigo-procesal-familia` | `revisar-una-pension-alimentaria` |
| `guarda-crianza` | `guarda-crianza-responsabilidad-parental`, `derechos-hijos-menores-durante-divorcio`, `regimen-interrelacion-familiar`, `divorcio-mutuo-consentimiento-costa-rica`, `aspectos-antes-de-iniciar-proceso-familia` | — |
| `interrelacion-familiar` | `regimen-interrelacion-familiar`, `guarda-crianza-responsabilidad-parental`, `derechos-hijos-menores-durante-divorcio` | — |
| `bienes-gananciales` | `como-se-regulan-bienes-gananciales`, `familias-con-patrimonio-empresarial`, `union-de-hecho-efectos-legales` | — |
| `union-de-hecho` | `union-de-hecho-efectos-legales` | — |
| `filiacion-paternidad` | `procedimientos-filiacion-paternidad` | — |
| `acuerdos-familiares` | `acuerdos-familiares-solucion-conflictos`, `familias-con-patrimonio-empresarial` | — |
| `proteccion-familiar` | `proteccion-juridica-violencia-domestica` | — |
| (sin pilar) «Procesos de familia» | `cambios-codigo-procesal-familia`, `aspectos-antes-de-iniciar-proceso-familia`, `acuerdos-familiares-solucion-conflictos` | `recibi-una-notificacion-judicial` |

### Cómo se enlaza hoy (lógica de plantillas)

- **Servicio → servicio** (`src/pages/servicios/[slug].astro`): bloque «Temas relacionados» con los ids del campo `relacionados`. Funciona bien y es curado.
- **Servicio → artículos**: «Para seguir leyendo» toma los artículos cuyo `servicios` incluye el servicio y **completa con los demás, en orden alfabético de archivo, hasta tres** (`[...articulos, ...otros].slice(0, 3)`). Consecuencias, comprobadas en el build de `dist/`:
  - `/servicios/divorcios` muestra `aspectos-antes…`, `cambios-codigo…` y `como-se-regulan-bienes…`; **no enlaza a sus dos satélites propios** (`diferencias-divorcio…`, `divorcio-mutuo…`).
  - `/servicios/pensiones-alimentarias` **no enlaza** a `como-se-establece-pension-alimentaria`.
  - `/servicios/guarda-crianza` **no enlaza** a `guarda-crianza-responsabilidad-parental`.
  - En `proteccion-familiar`, `union-de-hecho` y `filiacion-paternidad`, el relleno alfabético inserta `acuerdos-familiares-solucion-conflictos` (conciliación) sin relación temática; en la página de violencia doméstica esa sugerencia no es adecuada.
- **Artículo → servicio** (`src/pages/blog/[slug].astro`): «Áreas relacionadas» enlaza a todos los ids de `servicios`. Correcto.
- **Artículo → artículos**: «Artículos relacionados» ordena por misma categoría y luego por orden de archivo; «Anterior/Siguiente» sigue el orden alfabético de archivo, sin relación temática.
- **Ficha → servicio** (`src/pages/orientacion/[slug].astro`): «Áreas relacionadas». **Ningún servicio ni artículo enlaza a las fichas**; solo se llega desde `/orientacion` (menú «Guías»).
- **Enlaces dentro del cuerpo**: casi inexistentes. Solo `proteccion-juridica-violencia-domestica` enlaza en el texto a su servicio. Las FAQ de los servicios son texto plano (`r: string`) y no admiten enlaces.

### Cambios recomendados en código (no aplicados)

1. En servicios, listar **todos** los satélites propios (o un campo curado `lecturas:`) y no rellenar con artículos ajenos; si faltan, mostrar menos de tres.
2. Añadir en servicios y artículos un bloque «Guías por situación» con las fichas cuyo `servicios` coincida.
3. Permitir un enlace opcional por FAQ (`enlace: { href, texto }`) para que la respuesta breve remita al satélite.
4. Sustituir «Anterior/Siguiente» por una navegación dentro de la misma categoría, o retirarla.
5. Revisar la indexación de `/blog/categoria/*` (ver sección 2.6).

## 2. Resolución de canibalizaciones

Regla general: **el servicio es la página pilar** (qué es, quién, vías, trámite, efectos, cuándo asesorarse). **El artículo responde una sola pregunta** que el pilar resume en un párrafo y enlaza. **La ficha prepara una consulta** y no explica la norma más allá de lo necesario. Si un artículo repite su servicio, se reenfoca o se retira (regla ya prevista en la guía editorial).

### 2.1 Divorcio
- Pilar `/servicios/divorcios`: cambiar `metaTitulo` a una formulación general (p. ej. «Divorcio en Costa Rica: vías, trámite y efectos») para no disputar «mutuo consentimiento» ni «causales» a los satélites.
- `/blog/divorcio-mutuo-consentimiento-costa-rica`: dueño de «divorcio por mutuo consentimiento», «convenio de divorcio» y «divorcio en el Registro Civil».
- `/blog/diferencias-divorcio-consensuado-contencioso`: dueño de «si mi cónyuge no firma». Reducir la explicación de causales a un resumen con enlace al pilar.
- `/orientacion/alternativas-para-divorciarse`: reorientar `metaTitulo`/`metaDescripcion` a la preparación («qué reunir antes de una consulta de divorcio») y quitar «Vías de divorcio… según el artículo 48» de la descripción.

### 2.2 Bienes gananciales
- El servicio conserva «qué son», «cuándo nace el derecho», vivienda familiar y sociedades (resumen).
- El artículo `como-se-regulan-bienes-gananciales` se reenfoca a **la liquidación paso a paso y el remate**, que el servicio no desarrolla. Nuevo título y slug sugeridos: «Liquidación de gananciales: pasos, avalúo y remate» → `/blog/liquidacion-de-bienes-gananciales` (301 desde el slug actual). La sección «Vivienda y unión de hecho» se reduce a enlaces.

### 2.3 Unión de hecho
- El artículo `union-de-hecho-efectos-legales` replica la estructura del servicio. Opciones, por orden de preferencia: (a) reenfocarlo solo en **el plazo de caducidad para pedir el reconocimiento** (cuándo empieza a contar, qué lo interrumpe, qué pasa si vence: todo a verificar), con slug `/blog/plazo-reconocimiento-union-de-hecho`; (b) fusionarlo en el servicio y redirigir. El servicio retira el plazo de su `metaDescripcion` o lo mantiene como resumen con enlace.

### 2.4 Revisión de pensión
- `/blog/aumento-rebajo-pension-alimentaria`: dueño de «aumento», «rebajo», «exoneración», «aumento automático».
- `/orientacion/revisar-una-pension-alimentaria`: solo preparación.
- FAQ del servicio «¿La cuota aumenta sola?» y «¿Qué pasa si pierdo el trabajo?»: respuesta de dos líneas y enlace al satélite (requiere el cambio 3 de la sección 1).

### 2.5 Slugs
Antes de la indexación, ajustar slugs que nombran el tema en lugar de la pregunta (con 301, porque el dominio ya responde):

| Actual | Propuesto |
|---|---|
| `guarda-crianza-responsabilidad-parental` | `patria-potestad-responsabilidad-parental-terminos` |
| `regimen-interrelacion-familiar` | `incumplimiento-regimen-interrelacion-familiar` |
| `procedimientos-filiacion-paternidad` | `plazos-investigar-impugnar-paternidad` |
| `acuerdos-familiares-solucion-conflictos` | `conciliacion-procesos-de-familia` |
| `como-se-regulan-bienes-gananciales` | `liquidacion-de-bienes-gananciales` |

### 2.6 Categorías
Los servicios ya cumplen la función de hub. Propuesta: `noindex, follow` y fuera del sitemap para `/blog/categoria/*` mientras la categoría tenga menos de tres artículos; o para todas, como ya ocurre con las etiquetas. Excepción posible: `procesos-de-familia`, que no tiene servicio, si se le añade una entrada propia.

## 3. Huecos de contenido

Criterios: consulta plausible en Costa Rica, relación con un área existente, no cubierta por ninguna pieza actual (comprobado por búsqueda de términos en `src/content/`), y riesgo jurídico gestionable con fuentes oficiales.

Cubiertos y, por tanto, **excluidos del backlog**: apremio corporal y retención, aguinaldo y salario escolar, custodia compartida, interrelación supervisada, afectación de vivienda familiar, alimentos entre cónyuges, separación judicial, hijos mayores de edad que estudian, asistencia legal gratuita (en `aspectos-antes…`), plazos de filiación, conciliación.

Fuera de alcance hasta que la responsable decida: adopción, sucesiones, honorarios y costos, páginas por localidad.

## 4. Backlog de briefs

Campos comunes a todos los briefs:
- **Responsable de revisión:** Evelyn Elizondo o profesional en derecho designada — pendiente.
- **Estado:** borrador de brief, no redactado.
- **Regla de exactitud:** ningún número de artículo, plazo o cifra se escribe de memoria. Donde el brief dice «verificar», se lee la norma en SCIJ (SINALEVI), se registra en `docs/auditoria-evelyn/matriz-juridica.json` y se cita con su fuente.
- **Longitud de títulos:** los meta title de abajo tienen 60 caracteres o menos. `Base.astro` añade « | Evelyn Elizondo» solo si el total no supera 65 caracteres.
- **Plantilla:** `articulos` salvo indicación; `fichas` para las guías F; las piezas D requieren una plantilla nueva.

### B1. Permiso de salida del país de una persona menor de edad
- **Keyword principal:** permiso de salida del país menor de edad · **Intención:** urgente · **Público:** madre, padre o persona a cargo que necesita viajar con una persona menor de edad sin la autorización de la otra parte, o que quiere impedir una salida.
- **Preguntas:** ¿quién debe autorizar la salida? ¿qué hacer si la otra parte se niega o no se le localiza? ¿qué autoridad lo resuelve y por qué vía? ¿cómo se pide un impedimento de salida?
- **URL:** `/blog/permiso-salida-del-pais-persona-menor-de-edad` · **H1:** ¿Qué hacer si la otra parte no autoriza la salida del país de una persona menor de edad?
- **H2:** Quién autoriza la salida · Si la otra parte se niega o no aparece · Cómo se pide la autorización judicial · Cómo se solicita un impedimento de salida · Qué documentos suelen pedirse
- **Enlaces internos:** `/servicios/guarda-crianza` (pilar), `/servicios/interrelacion-familiar`, B2, `/orientacion/recibi-una-notificacion-judicial`.
- **Fuentes:** Código de la Niñez y la Adolescencia en SCIJ (verificar el artículo sobre control de salidas del país; la biblioteca del sitio registra una reforma por la Ley N.º 10558); Código Procesal de Familia (verificar el proceso aplicable); Dirección General de Migración y Extranjería y PANI (requisitos administrativos vigentes); Poder Judicial (juzgado competente).
- **Riesgos:** confundir requisitos migratorios administrativos con la autorización judicial; requisitos que cambian por directriz; casos con medidas de protección vigentes.
- **CTA:** Agendar una consulta (si no hay riesgo); remisión a recursos de ayuda si hay violencia.
- **Meta title:** Permiso de salida del país de menores en Costa Rica
- **Description:** Qué hacer si la otra parte no autoriza la salida del país de una persona menor de edad en Costa Rica: vía judicial, impedimento de salida y documentos.

### B2. Cambio de residencia con hijas o hijos y restitución internacional
- **Keyword principal:** mudarse con los hijos a otro país · **Intención:** urgente / informativa · **Público:** progenitor que planea trasladarse o que teme un traslado sin acuerdo.
- **Preguntas:** ¿se puede cambiar de residencia sin acuerdo? ¿qué pasa con el régimen de interrelación? ¿qué es la restitución internacional y ante quién se pide?
- **URL:** `/blog/cambio-de-residencia-con-hijos` · **H1:** Cambiar de residencia con hijas o hijos: qué decide la autoridad y qué pasa si el traslado es al extranjero
- **H2:** Traslado dentro de Costa Rica · Traslado al extranjero · Efecto en la interrelación y los alimentos · Si el traslado ocurrió sin autorización · Autoridad central y plazos
- **Enlaces internos:** `/servicios/guarda-crianza`, `/servicios/interrelacion-familiar`, B1, `/blog/derechos-hijos-menores-durante-divorcio`.
- **Fuentes:** Código de Familia y Código Procesal de Familia en SCIJ; verificar en SCIJ la ley aprobatoria del Convenio de La Haya sobre aspectos civiles de la sustracción internacional de menores y su vigencia para Costa Rica; verificar qué entidad actúa como autoridad central (PANI u otra) en su sitio oficial.
- **Riesgos:** afirmar plazos del Convenio sin leer el texto aprobado; generalizar a países que no son parte; tratar como asesoría un caso de sustracción en curso.
- **CTA:** Agendar una consulta.
- **Meta title:** Mudarse con los hijos a otro lugar o país: Costa Rica
- **Description:** Qué considera la autoridad cuando una madre o un padre quiere cambiar de residencia con sus hijos y qué prevé la restitución internacional en Costa Rica.

### B3. Deuda alimentaria y salida del país
- **Keyword principal:** impedimento de salida por pensión alimentaria · **Intención:** urgente · **Público:** persona obligada al pago que necesita viajar; persona acreedora que teme la salida del deudor.
- **Condición previa:** confirmar en el Código Procesal de Familia vigente si existe y cómo opera una restricción de salida vinculada a deuda alimentaria. **Si no hay base normativa verificable, el brief se descarta.**
- **Preguntas:** ¿puede impedirse la salida del país por deber pensión? ¿quién lo pide? ¿cómo se levanta? ¿qué garantía puede exigirse?
- **URL:** `/blog/deuda-alimentaria-salida-del-pais` · **H1:** ¿Puede impedirse la salida del país por una deuda de pensión alimentaria?
- **H2:** Qué prevé la norma · Quién puede pedirlo · Cómo se levanta · Relación con el apremio corporal
- **Enlaces internos:** `/servicios/pensiones-alimentarias` (sección de apremio), `/orientacion/revisar-una-pension-alimentaria`, B1.
- **Fuentes:** Código Procesal de Familia en SCIJ (verificar disposiciones sobre garantías y restricciones al deudor); Poder Judicial; Dirección General de Migración y Extranjería.
- **Riesgos:** confundir restricciones de salida de personas menores (B1) con las del deudor; afirmar automatismos.
- **CTA:** Agendar una consulta.
- **Meta title:** ¿Puede impedirse salir del país por deber pensión?
- **Description:** Qué prevé el Código Procesal de Familia sobre la salida del país de la persona que debe pensión alimentaria en Costa Rica, quién lo pide y cómo se levanta.

### B4. Alimentos para padres y madres
- **Keyword principal:** pensión alimentaria para padres · **Intención:** informativa · **Público:** persona adulta mayor sin recursos o familiares que se preguntan si están obligados.
- **Preguntas:** ¿las hijas y los hijos adultos deben alimentos a sus padres? ¿en qué orden responden los parientes? ¿cómo se reclama? ¿qué otras protecciones existen para personas adultas mayores?
- **URL:** `/blog/pension-alimentaria-para-padres` · **H1:** ¿Deben las hijas y los hijos adultos pagar pensión alimentaria a sus padres?
- **H2:** Quiénes deben alimentos · El orden entre parientes · Cómo se fija y reclama · Otras normas de protección
- **Enlaces internos:** `/servicios/pensiones-alimentarias`, `/blog/como-se-establece-pension-alimentaria`, `/servicios/proteccion-familiar`.
- **Fuentes:** Código de Familia en SCIJ (verificar el artículo que enumera a las personas obligadas, que el servicio de pensiones ya cita, y el orden de prelación); verificar en SCIJ la Ley Integral para la Persona Adulta Mayor y su relación con alimentos; Poder Judicial.
- **Riesgos:** confundir el deber alimentario con otras obligaciones de cuidado; afirmar porcentajes.
- **CTA:** Agendar una consulta.
- **Meta title:** Pensión alimentaria para padres en Costa Rica
- **Description:** Cuándo las hijas y los hijos adultos deben alimentos a sus padres en Costa Rica, en qué orden responden los parientes y cómo se reclama la cuota.

### B5. Divorcio con un cónyuge en el extranjero o dictado fuera
- **Keyword principal:** divorcio con cónyuge en el extranjero · **Intención:** informativa / comercial · **Público:** costarricenses en el exterior, personas extranjeras casadas en Costa Rica, divorciados fuera que necesitan efectos aquí.
- **Preguntas:** ¿puede tramitarse el divorcio si un cónyuge vive fuera? ¿cómo se notifica? ¿un divorcio dictado en otro país vale en Costa Rica? ¿cómo se inscribe?
- **URL:** `/blog/divorcio-con-conyuge-en-el-extranjero` · **H1:** Divorcio con un cónyuge en el extranjero: notificación, poder y reconocimiento de sentencias
- **H2:** Si un cónyuge vive fuera · Comparecer por medio de poder · Divorcio dictado en otro país · Inscripción en el Registro Civil
- **Enlaces internos:** `/servicios/divorcios`, `/blog/divorcio-mutuo-consentimiento-costa-rica`, `/orientacion/alternativas-para-divorciarse`.
- **Fuentes:** Código Procesal de Familia y Código de Familia en SCIJ; verificar en SCIJ la norma procesal y el órgano competente para el reconocimiento de sentencias extranjeras (exequátur); Poder Judicial; Tribunal Supremo de Elecciones (Registro Civil) para inscripción; requisitos de apostilla.
- **Riesgos:** atribuir competencia a un órgano sin verificar; requisitos consulares que varían; derecho extranjero aplicable.
- **CTA:** Agendar una consulta (la consulta virtual solo se menciona si se confirma esa modalidad).
- **Meta title:** Divorcio con un cónyuge en el extranjero: Costa Rica
- **Description:** Cómo se tramita en Costa Rica un divorcio si un cónyuge vive fuera y qué se necesita para que un divorcio dictado en otro país surta efectos aquí.

### B6. Violencia patrimonial en la familia
- **Keyword principal:** violencia patrimonial · **Intención:** informativa / urgente · **Público:** persona que sufre control económico, retención de documentos o daño a bienes por parte de un familiar o pareja.
- **Preguntas:** ¿qué se entiende por violencia patrimonial? ¿qué medidas de protección se relacionan con bienes y documentos? ¿qué relación tiene con los gananciales o los alimentos?
- **URL:** `/blog/violencia-patrimonial-en-la-familia` · **H1:** Violencia patrimonial: qué es y qué medidas prevé la Ley contra la Violencia Doméstica
- **H2:** Qué define la ley · Ejemplos descritos en la norma · Medidas relacionadas con bienes y documentos · Relación con otros procesos de familia
- **Enlaces internos:** `/servicios/proteccion-familiar` (pilar), `/blog/proteccion-juridica-violencia-domestica`, `/servicios/bienes-gananciales`. Incluir los componentes `SeguridadNavegacion` y `RecursosAyuda` y la salida rápida.
- **Fuentes:** Ley contra la Violencia Doméstica en SCIJ (verificar la definición y las medidas de contenido patrimonial); Poder Judicial; INAMU para recursos de ayuda (verificar datos vigentes).
- **Riesgos:** sugerir negociar o conciliar (prohibido por la guía editorial); prometer que una medida garantiza seguridad; ejemplos que no estén en la norma.
- **CTA:** Sin CTA comercial. 9-1-1 para peligro inmediato y recursos de ayuda, igual que el servicio de protección.
- **Meta title:** Violencia patrimonial en la familia: Costa Rica
- **Description:** Qué entiende la Ley contra la Violencia Doméstica de Costa Rica por violencia patrimonial y qué medidas se relacionan con bienes y documentos.

### B7. Pensión alimentaria con ingresos variables o trabajo independiente
- **Keyword principal:** pensión alimentaria trabajador independiente · **Intención:** informativa · **Público:** ambas partes cuando quien paga no tiene salario fijo.
- **Preguntas:** ¿cómo se prueban ingresos sin planilla? ¿qué medios de prueba se admiten? ¿qué pasa si los ingresos bajan o suben? ¿cómo se ejecuta sin retención salarial?
- **URL:** `/blog/pension-alimentaria-ingresos-variables` · **H1:** Pensión alimentaria cuando quien paga no tiene salario fijo
- **H2:** Cómo se acreditan los ingresos · Prueba que suele aportarse · Si los ingresos cambian · Cobro sin retención salarial
- **Enlaces internos:** `/blog/como-se-establece-pension-alimentaria` (no repetir el procedimiento: enlazarlo), `/blog/aumento-rebajo-pension-alimentaria`, `/servicios/pensiones-alimentarias`, F1.
- **Fuentes:** Código Procesal de Familia en SCIJ (verificar reglas de prueba de ingresos en el proceso alimentario); Código de Familia; Poder Judicial.
- **Riesgos:** canibalizar «cómo se decide el monto» del artículo existente; sugerir ocultar ingresos (prohibido); afirmar presunciones no verificadas.
- **CTA:** Agendar una consulta.
- **Meta title:** Pensión alimentaria sin salario fijo en Costa Rica
- **Description:** Cómo se acreditan los ingresos en un proceso de pensión alimentaria en Costa Rica cuando quien paga trabaja por cuenta propia o tiene ingresos variables.

### B8. Pensión alimentaria e interrelación familiar
- **Keyword principal:** si no paga la pensión puede ver a su hijo · **Intención:** informativa · **Público:** progenitores en conflicto por pagos y contacto.
- **Preguntas:** ¿se puede negar el contacto porque no se paga la pensión? ¿se puede dejar de pagar porque se impide el contacto? ¿qué vía corresponde a cada incumplimiento?
- **URL:** `/blog/pension-alimentaria-e-interrelacion-familiar` · **H1:** ¿Se puede condicionar la pensión alimentaria al contacto con los hijos?
- **H2:** Dos obligaciones distintas · Si no se paga la pensión · Si se impide el contacto · Qué hacer con cada incumplimiento
- **Enlaces internos:** `/servicios/pensiones-alimentarias`, `/servicios/interrelacion-familiar`, `/blog/regimen-interrelacion-familiar`.
- **Fuentes:** Código de la Niñez y la Adolescencia, Código de Familia y Código Procesal de Familia en SCIJ (verificar las normas que tratan alimentos e interrelación como derechos de la persona menor de edad); jurisprudencia solo si se lee la resolución (Poder Judicial, Nexus).
- **Riesgos:** la guía editorial prohíbe sugerir que pago y contacto se condicionan; casos con violencia, donde el contacto puede suspenderse por otras razones.
- **CTA:** Agendar una consulta.
- **Meta title:** ¿Puede condicionarse la pensión a las visitas?
- **Description:** Por qué la pensión alimentaria y el régimen de interrelación familiar son obligaciones distintas en Costa Rica y qué hacer si una de las dos se incumple.

### F1. Solicitar una pensión alimentaria por primera vez (ficha)
- **Keyword principal:** qué necesito para pedir pensión alimentaria · **Intención:** acción inmediata · **Público:** persona que va a presentar la demanda.
- **Preguntas:** ¿qué documentos reunir? ¿qué información sobre gastos e ingresos ayuda? ¿qué no hace falta saber de antemano?
- **URL:** `/orientacion/solicitar-una-pension-alimentaria` · **H1:** Solicitar una pensión alimentaria
- **Estructura (plantilla de fichas):** Qué conviene reunir · Qué suele ser relevante · Límites
- **Enlaces internos:** `/blog/como-se-establece-pension-alimentaria` (procedimiento), `/servicios/pensiones-alimentarias`, B7.
- **Fuentes:** Código Procesal de Familia y Código de Familia en SCIJ (verificar requisitos de la demanda alimentaria); Poder Judicial (formularios o guías oficiales, si existen).
- **Riesgos:** duplicar el artículo de procedimiento; pedir nombres de personas menores en formularios (la guía lo prohíbe).
- **CTA:** Agendar una consulta.
- **Meta title:** Solicitar una pensión alimentaria: qué reunir
- **Description:** Qué documentos e información conviene reunir antes de pedir una pensión alimentaria en Costa Rica: gastos, ingresos, vínculo y resoluciones previas.

### F2. Separarse sin haberse casado (ficha)
- **Keyword principal:** me separé y no estábamos casados · **Intención:** informativa · **Público:** convivientes que terminan la relación.
- **Preguntas:** ¿qué hay que decidir (bienes, hijos, alimentos)? ¿qué fechas conviene documentar? ¿qué plazo puede estar corriendo?
- **URL:** `/orientacion/separarse-sin-haberse-casado` · **H1:** Separarse sin haberse casado
- **Estructura:** Qué conviene reunir · Qué suele ser relevante · Límites
- **Enlaces internos:** `/servicios/union-de-hecho`, el satélite de plazo de unión de hecho (ver 2.3), `/servicios/guarda-crianza`, `/servicios/pensiones-alimentarias`.
- **Fuentes:** Código de Familia en SCIJ (verificar requisitos y plazo de la unión de hecho); Código Procesal de Familia.
- **Riesgos:** un plazo de caducidad mal explicado puede hacer perder un derecho; no presuponer pareja heterosexual (guía editorial).
- **CTA:** Agendar una consulta.
- **Meta title:** Separarse sin haberse casado en Costa Rica
- **Description:** Qué reunir al terminar una convivencia sin matrimonio en Costa Rica: fechas, bienes, hijos y el plazo para pedir el reconocimiento de la unión de hecho.

### F3. Modificar la guarda o el régimen de interrelación (ficha)
- **Keyword principal:** cambiar la custodia · **Intención:** consideración · **Público:** progenitor o familiar con una resolución o convenio previo.
- **Preguntas:** ¿qué cambio de circunstancias suele examinarse? ¿qué prueba reunir? ¿qué hacer si hay riesgo inmediato?
- **URL:** `/orientacion/modificar-guarda-o-interrelacion` · **H1:** Modificar la guarda o el régimen de interrelación
- **Estructura:** Qué conviene reunir · Qué suele ser relevante · Límites
- **Enlaces internos:** `/servicios/guarda-crianza`, `/servicios/interrelacion-familiar`, `/blog/regimen-interrelacion-familiar`, `/blog/derechos-hijos-menores-durante-divorcio`.
- **Fuentes:** Código de Familia, Código de la Niñez y la Adolescencia y Código Procesal de Familia en SCIJ (verificar la vía de modificación y las medidas provisionales).
- **Riesgos:** sugerir que la opinión de la persona menor decide por sí sola; casos de violencia (remitir a protección).
- **CTA:** Agendar una consulta.
- **Meta title:** Modificar la guarda o la interrelación: qué reunir
- **Description:** Qué información reunir para pedir que se modifique la guarda, crianza y educación o el régimen de interrelación familiar en Costa Rica.

### F4. Reconocimiento de paternidad (ficha)
- **Keyword principal:** reconocer a un hijo · **Intención:** acción inmediata · **Público:** madre, padre o persona hija que busca el reconocimiento o la declaración de paternidad.
- **Preguntas:** ¿qué datos y documentos reunir? ¿cuándo corresponde la vía administrativa y cuándo la judicial? ¿qué plazos revisar?
- **URL:** `/orientacion/reconocimiento-de-paternidad` · **H1:** Reconocimiento de paternidad
- **Estructura:** Qué conviene reunir · Qué suele ser relevante · Límites
- **Enlaces internos:** `/servicios/filiacion-paternidad`, `/blog/procedimientos-filiacion-paternidad`, `/servicios/pensiones-alimentarias`.
- **Fuentes:** Código de Familia en SCIJ; verificar en SCIJ la Ley de Paternidad Responsable y su vigencia tras el Código Procesal de Familia; Tribunal Supremo de Elecciones (Registro Civil) para el trámite administrativo.
- **Riesgos:** confundir el procedimiento administrativo con el judicial; plazos con notas de la Sala Constitucional (el artículo existente las trata: enlazar, no repetir).
- **CTA:** Agendar una consulta.
- **Meta title:** Reconocimiento de paternidad en Costa Rica: qué reunir
- **Description:** Qué datos y documentos conviene reunir para el reconocimiento o la declaración de paternidad en Costa Rica, y qué revisar sobre vías y plazos.

### D1. Glosario de derecho de familia costarricense
- **Keyword principal:** términos de derecho de familia · **Intención:** informativa · **Público:** cualquier lector; también motores de respuesta que buscan definiciones con jurisdicción.
- **Preguntas:** ¿qué significa cada término procesal y sustantivo? ¿cuál es el término vigente y cuál el antiguo?
- **URL:** `/biblioteca-juridica/glosario` · **H1:** Glosario de derecho de familia en Costa Rica
- **Estructura:** entradas A–Z; cada una con definición de una o dos frases, norma de origen con enlace a SCIJ, término coloquial equivalente y enlace a la página que lo desarrolla.
- **Enlaces internos:** cada servicio y artículo; para términos de responsabilidad parental, enlazar a `/blog/guarda-crianza-responsabilidad-parental` sin duplicar sus definiciones.
- **Fuentes:** las normas de `src/lib/sources.ts`, leídas en SCIJ.
- **Riesgos:** definiciones que simplifiquen en exceso; términos derogados presentados como vigentes.
- **CTA:** ninguno; enlaces a las áreas.
- **Meta title:** Glosario de derecho de familia en Costa Rica
- **Description:** Definiciones breves de los términos del Código de Familia y del Código Procesal de Familia de Costa Rica, con la norma de origen y el término coloquial.
- **Nota técnica:** requiere una plantilla o colección nueva (`glosario`) y un id por entrada para anclas.

### D2. Registro de cambios normativos
- **Keyword principal:** reformas al código de familia · **Intención:** informativa · **Público:** lectores que encuentran información antigua; profesionales.
- **Preguntas:** ¿qué normas de familia cambiaron, cuándo rigen y qué páginas del sitio se actualizaron?
- **URL:** `/biblioteca-juridica/cambios-normativos` · **H1:** Cambios en las normas de familia de Costa Rica
- **Estructura:** una entrada por reforma: ley y fecha, publicación en La Gaceta, vigencia, artículos afectados, resumen de una frase, páginas del sitio actualizadas y fecha de revisión. Orden cronológico inverso.
- **Enlaces internos:** `/blog/cambios-codigo-procesal-familia` (no duplicar su contenido), `/biblioteca-juridica`, las páginas afectadas.
- **Fuentes:** SCIJ (texto y notas de vigencia), Asamblea Legislativa (expediente y texto aprobado), Imprenta Nacional (La Gaceta), PGR. Los proyectos de ley se excluyen o se marcan como tales.
- **Riesgos:** presentar un proyecto como ley (regla 2 de la guía editorial); fechas de vigencia equivocadas.
- **CTA:** ninguno.
- **Meta title:** Cambios en las normas de familia de Costa Rica
- **Description:** Registro de reformas al Código de Familia, al Código Procesal de Familia y a leyes conexas de Costa Rica: fecha, vigencia y páginas del sitio actualizadas.
- **Nota técnica:** puede alimentarse de `docs/auditoria-evelyn/normas/registro.json` y del resultado de `npm run normas:vigilar`.

## 5. Bloque de diferenciación

Lo que el sitio puede ofrecer y que no depende de afirmar experiencia o resultados:

1. **Glosario con jurisdicción explícita** (D1): término vigente, término antiguo y coloquial, norma de origen.
2. **Guías de preparación de consulta** (fichas actuales y F1–F4): qué reunir, qué suele ser relevante, límites. Reducen el tiempo de la primera consulta y no concluyen nada sobre el caso.
3. **Explicación de cambios normativos** (D2 y `cambios-codigo-procesal-familia`): fecha, vigencia, efecto en procesos en curso y páginas actualizadas.
4. **Fuentes visibles y fechadas** en cada pieza (ya implementado), con la fecha de revisión por pieza propuesta en `geo-aeo-strategy.md`.

## 6. Flujo editorial

| Etapa | Quién | Resultado | Campo |
|---|---|---|---|
| 1. Brief | Equipo editorial | Brief en este documento | — |
| 2. Borrador | Redacción | Archivo `.md` con fuentes y matriz jurídica | `revisionProfesional: pendiente` |
| 3. Revisión jurídica | Evelyn Elizondo o profesional designada | Correcciones; cada afirmación contrastada con SCIJ | `pendiente` |
| 4. Aprobación | Evelyn Elizondo | Aprobación expresa y fechada | `revisionProfesional: aprobada` |
| 5. Publicación | Técnica | Despliegue; la pieza pasa a indexable | — |
| 6. Revisión periódica | Responsable de revisión | Semanal: `npm run normas:vigilar`; trimestral: lectura editorial; ante una reforma: revisión inmediata y vuelta a `pendiente` si cambia el fondo | `aprobada` o `pendiente` |

**Regla de indexación:** `revisionProfesional: aprobada` es lo que habilita la indexación de cada pieza. En el árbol de trabajo actual la regla ya está en código:
- `src/content.config.ts`: `aprobada` exige `revisadoPor` y `revisadoEl`; `actualizado` registra la última actualización sustantiva.
- `src/config/indexacion.mjs` (`robotsDePagina`): tras el lanzamiento, una pieza `pendiente` sale con `noindex, follow`.
- `src/pages/sitemap.xml.ts`: solo incluye servicios, artículos y fichas aprobados.
- El lanzamiento global depende de `SEO_INDEXING_ENABLED=true`, `SITE_ENV=production` y de `src/config/lanzamiento.json` completo; `PUBLIC_SITE_READY` ya no habilita la indexación.

Queda por decidir si los listados (`/blog`, `/servicios`, `/orientacion`, «Para seguir leyendo») muestran piezas no aprobadas una vez lanzado el sitio. Al pasar una pieza a `aprobada`, rellenar `revisadoPor`, `revisadoEl` y `actualizado`.

Mientras una pieza esté `pendiente`, no se afirma en ella que fue revisada por una profesional (regla de la guía editorial).
