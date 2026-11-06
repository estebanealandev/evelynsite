# Hallazgos del lote D

Alcance: portada, sobre Evelyn, aviso jurídico, política de privacidad, páginas de contacto y confirmación, `src/lib/institucional.ts`, `src/lib/biblioteca.ts` y tres fichas.

## 1. Correcciones jurídicas

| Antes | Después | Respaldo |
|---|---|---|
| «La información que comparte un cliente queda amparada por el secreto profesional» | Secreto sobre confidencias hechas con ocasión del ejercicio, con permanencia y excepciones | CDJ 41, 42, 43 |
| «Protegemos lo que más importa», «enfoque humano, estratégico y comprometido», «Asesoría jurídica personalizada» | Especialidad, áreas y forma de trabajo, en impersonal | CDJ 29, 30, 32, 33 |
| «Agende una consulta confidencial», «de forma reservada» | «Solicite una consulta». No se promete reserva de un envío por correo | CDJ 41; L8968 art. 10 |
| Sin aviso sobre plazos | Enviar el formulario no detiene los plazos de un proceso | CPF 73; conclusión por ausencia de norma contraria |
| «Las normas citadas son de dominio público»; textos e imágenes «originales» | Retirado: derecho de autor fuera del catálogo y autoría sin confirmar | Sin respaldo |
| Aviso sin mención de revisión | Se indica que no consta revisión profesional mientras haya contenido `pendiente` | Guía editorial, «Experiencia y autoridad» |
| Política: suscripción y «huella (hash)» temporal | Sin suscripción. Huella SHA-256 en memoria, con hora de intentos, perdida al reiniciar | `src/lib/rate-limit.ts` |
| Política: plazo de cinco días sin matices | Se añaden cómputo e interrupción, excepciones de supresión, revocación, deber de secreto y proveedores | L8968 5, 6, 7, 11, 13, 14; R37554 7, 8, 15, 17, 18, 26, 40 |
| «vigente desde octubre de 2024» | «rige desde el 1 de octubre de 2024», con reformas 10558 y 10650 | L9747 nota de vigencia; CF 48; CPF 9 |

## 2. Dudas para una persona abogada

1. **CDJ art. 30, párrafo segundo.** Dice que la publicidad «se limitará a indicar aspectos como» nombre, servicios, especialidad y datos de contacto. Falta criterio sobre si los artículos, fichas y la explicación de la forma de trabajo cuentan como publicidad. Aquí se trataron como información, sin autoelogio.
2. **Deberes atribuidos al servicio.** Portada y Sobre Evelyn citan deberes del CDJ, que rige a personas autorizadas e inscritas (art. 1). La colegiatura no está confirmada. Debe confirmarse antes de publicar.
3. **Secreto profesional y formulario.** No se afirmó que el mensaje del formulario quede cubierto por CDJ art. 41. Conviene definirlo: el artículo habla de confidencias del cliente, del adversario y de terceros con ocasión del ejercicio.
4. **Base de datos.** La política trata el buzón como base de datos. L8968 art. 2 y R37554 art. 2 c) excluyen las de fines internos o personales. Se eligió la lectura más protectora; falta decidir si procede inscripción ante Prodhab.
5. **Cómputo de días.** CPF arts. 271 y 291 dicen «cinco días» sin «hábiles»; art. 223 sí los indica. La ficha copia cada norma y pide confirmar con la resolución.
6. **CF art. 49.** El plazo de un año se presenta sin decir cómo opera en causales continuas como la separación de hecho. La ficha lo marca como asunto que requiere análisis.
7. **Convenio firmado.** «Puede ser difícil de cambiar en lo patrimonial» es una formulación prudente derivada de CPF art. 293.

## 3. Puntos pendientes fuera de este lote

- **Dirección del responsable (L8968 art. 5.1.h).** La ley exige informar identidad y dirección, y `site.privacy` no tiene campo de dirección. El control de `PUBLIC_SITE_READY` tampoco la exige. Hay que añadirlo antes de publicar.
- **Datos no configurados en la política.** Se pidió conservar que se ocultan, pero la lógica existente muestra «Dato por completar antes de la publicación» y bloquea la compilación indexable. Se conservó sin cambios.
- **Cambio de lógica en el aviso.** El aviso no decía nada sobre `revisionProfesional`. Se añadió una comprobación mínima con `getCollection`, para que el texto no quede falso cuando se apruebe el contenido. Es el único cambio que excede el texto visible.
- **TLS.** La política afirma TLS exigido. `mailer.ts` lo desactiva con `SMTP_ALLOW_PLAINTEXT=true`: esa variable no debe activarse en producción, o la política será inexacta.
- **`Cta.astro`.** Su título por defecto, «Cada situación familiar merece una orientación clara y respetuosa», aparece en portada y es genérico.
- **Enlaces nuevos.** Portada y Sobre Evelyn no enlazan a `/orientacion` ni a `/biblioteca-juridica`, porque añadirlos cambia estructura.
- **Mensaje del API.** `src/pages/api/consulta.ts` sigue diciendo «Recibimos su solicitud», en primera persona. Una prueba de `tests/sitio.spec.ts` espera ese texto.

## 4. Duplicados o retiradas

- Se retiró «Biblioteca» como nombre del blog y de la sección de portada, para no confundirlo con `/biblioteca-juridica`.
- Las secciones «Tres reglas de trabajo» y «Criterios» de Sobre Evelyn se solapan en parte con `valores` y `proceso` de portada. Pueden fusionarse en el rediseño.
- `src/pages/suscripcion-recibida.astro` no se editó porque se eliminará. Aún contiene «Recibimos su suscripción».

## 5. Normas fuera de catálogo

- **Ley N.º 8687, Notificaciones Judiciales:** CPF art. 84 remite a ella y R37554 art. 17 también. La ficha solo menciona la remisión; ampliar exige leerla.
- **Ley N.º 7727, resolución alterna de conflictos:** citada por CPF arts. 9 y 260. No se describe su contenido.
- **Ley de derechos de autor:** haría falta para reponer una cláusula de propiedad intelectual.
- **Código Notarial:** haría falta para detallar el otorgamiento del convenio de divorcio.
