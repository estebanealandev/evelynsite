# Informe final

**Fecha:** 6 de noviembre de 2026. **Rama:** `rediseno/completo` (también `auditoria/plan-maestro`). **`main` no se tocó y no se publicó nada.**

## 1. Resumen ejecutivo

Se auditó y reescribió todo el contenido jurídico contra la última versión oficial de cada norma, se rediseñó la tipografía y se endureció el sitio para quien lo consulta en una situación de riesgo. La matriz tiene 1061 afirmaciones (891 publicadas, 170 retiradas o corregidas), y un programa comprueba que cada texto y cada cita existan literalmente.

**El sitio no está listo para publicarse.** Ninguna persona abogada ha revisado el contenido y faltan datos que solo puede dar Evelyn Elizondo: su colegiatura, los temas que atiende, sus datos de contacto y el responsable de los datos. Sigue con `noindex`.

Claves de este informe: **VERIFICADO** se comprobó con evidencia; **PENDIENTE** está hecho sin validar del todo; **BLOQUEADO** depende de un tercero; **NO REALIZADO** no se hizo.

## 2. Estado inicial y final

| Punto | Inicial (`5ade437`) | Final |
|---|---|---|
| Afirmaciones con respaldo comprobable | Sin registro | 891 publicadas, 0 errores |
| Pruebas en Chrome, una pasada | 205 superadas, 7 omitidas | 301 superadas, 47 omitidas, 0 fallidas, en dos pasadas |
| Firefox y WebKit | Sin probar | Ver sección 12 |
| Scripts en línea (CSP) | `unsafe-inline` | Bloqueados, salvo uno autorizado por huella |
| Cabeceras de seguridad | Solo meta | Enviadas por el servidor en todas las respuestas |
| Salida rápida | 2 páginas | Todas salvo la portada |
| Vigilancia de normas | No había | Script y temporizador listos, sin instalar |

## 3. Contenido revisado

Ver [inventario-contenido.md](inventario-contenido.md): 9 servicios, 15 artículos, 3 fichas nuevas, biblioteca nueva, portada, sobre Evelyn, aviso jurídico, privacidad, contacto, consulta y orientador. Por lote: [A](hallazgos/lote-a.md), [B](hallazgos/lote-b.md), [C](hallazgos/lote-c.md), [D](hallazgos/lote-d.md).

## 4. Principales correcciones jurídicas

| Tema | Corrección | Base |
|---|---|---|
| Violencia | Quien acaba de separarse ya no lee «depende» o «requiere análisis» antes de pedir medidas. La página no propone una consulta | LCVD 1, 2, 8 y 9; hallazgos 1 y 2 |
| Violencia | Las medidas se *ordenan* de inmediato, pero deben notificarse y ejecutarse. Ninguna garantiza por sí sola la seguridad | LCVD 10 |
| Violencia | Para personas menores de edad, las medidas «deberán» solicitarse, no «pueden» | LCVD 7 |
| Conciliación | Se prohíbe al constatarse relaciones desiguales de poder. La justicia restaurativa «podrá» abordarse si cumple criterios. Nada obliga a negociar | CPF 9 y 196, Ley 10558 |
| Divorcio | No siempre hay dos audiencias: puede haber sentencia sin audiencia inicial o audiencia única. El poder para el convenio debe contener las cláusulas exactas | CPF 55, 225, 226 y 232 |
| Pensiones | Todo se apoya en el régimen actual. La Ley 7654 solo aparece como derogada | L9747 art. 4; CPF 257 y ss. |
| Guarda | Se incorporan las Leyes 10603 y 10634, incluido el doble inciso d) del art. 159 | CF 143, 158 bis y 159 |
| Filiación | Las notas de SINALEVI cambian los plazos de impugnación del reconocimiento | CF 86 y notas |
| Interrelación | Se retira «el contacto no depende del pago de la pensión», sin artículo expreso | CNA 35; CF 151 y 152 |
| Deberes profesionales | No se da por hecho que obliguen a Evelyn ni se ofrece secreto profesional, porque no consta su colegiatura | CDJ 1 |

Revisión adversarial jurídica: 47 hallazgos (3 críticos, 6 altos, 24 medios, 14 bajos). Se aplicaron 40, 4 en parte, 1 requiere abogada, y los 2 que un lote dejó pendientes se aplicaron después. Detalle y notas por página en [revision-adversarial-juridica.md](revision-adversarial-juridica.md).

## 5. Fuentes oficiales

Copia guardada en [normas/](normas/), con versión y huellas por artículo en `normas/registro.json`:

| Norma | Versión |
|---|---|
| Código de Familia, Ley 5476 | 43 de 43 |
| Código Procesal de Familia, Ley 9747 | 4 de 4 |
| Ley 9747, aprobación | 3 de 3 |
| Código de la Niñez y la Adolescencia, Ley 7739 | 23 de 23 |
| Ley contra la Violencia Doméstica, Ley 7586 | 7 de 7 |
| Ley 8968 | 1 de 1 |
| Decreto 37554 | 3 de 3 |
| Código de Deberes | 8 de 8 |

Más 63 fuentes externas, de ellas 5 no verificables, en [fuentes-verificadas.json](fuentes-verificadas.json) e [investigacion-complementaria.md](investigacion-complementaria.md).

## 6. Reformas relevantes

| Norma | Efecto | Estado en el sitio |
|---|---|---|
| Ley 10650 (26/02/2025) | Art. 48 CF | Incorporada. No se describe qué cambió: solo se halló en prensa |
| Ley 10558 (23/10/2024) | Reforma el CPF | Incorporada |
| Ley 10603 (15/11/2024) | Relaciones impropias | Incorporada |
| Ley 10634 (29/01/2025) | Violencia vicaria | Incorporada |
| Leyes 10223, 10228 y 10192 | Unión de hecho | Incorporadas |
| Ley 7654 | Derogada | Solo como antecedente |
| Leyes 10894 y 9404 | Acoso escolar | No aplican: fuera del contenido |
| **Expediente 23.982** | Proyecto. Consta primer debate el 21/04/2026. No consta segundo debate, número de ley ni publicación | **No se presenta como ley ni se menciona al público. Hay que volver a comprobarlo antes de publicar: cambiaría arts. 37 y 48 CF** |

## 7. Contenido creado, enriquecido o retirado

- **Creado:** `/biblioteca-juridica`, `/orientacion` y 3 fichas, recursos institucionales, nota de seguridad al navegar y guía editorial.
- **Enriquecido:** todos los servicios y artículos. Cada artículo tiene ahora un ángulo propio.
- **Retirado:** suscripción por correo, acuse automático, marcado `FAQPage`, frases prohibidas, autoelogio, secreto profesional como garantía y afirmaciones sin respaldo.

## 8. Mejoras visuales

- Encabezados interiores claros: el azul oscuro queda para la portada y el pie.
- Escala tipográfica más contenida, con columna de lectura de 68 caracteres.
- **Árbol:** un solo árbol con raíces, en vez de uno grande con dos jóvenes, que se leían como progenitor e hijos. El concepto *Crecer* se mantiene. **Cambia algo que tú elegiste:** si prefieres la composición anterior, se revierte en `src/scripts/arboles/bosque.ts`.
- Marca regenerada con la nueva fuente. La imagen estática del árbol tiene fondo transparente, sin el rectángulo que se notaba.
- Comparaciones antes y después (izquierda y derecha) en [capturas/](capturas/).

## 9. Tipografía y licencias

Newsreader e IBM Plex Sans, alojadas localmente, ambas con **SIL OFL 1.1** (licencias en `public/assets/fonts/`). No hay licencias de Tiempos, Söhne o Lyon en el repositorio y no se compró nada. Todas requieren licencia web aparte; Lyon es de Commercial Type, no de Klim. Newsreader pesa 124 KB porque conserva el tamaño óptico.

## 10. Seguridad y privacidad

Revisión adversarial técnica: 1 crítico, 8 altos, 25 medios, 17 bajos, en [revision-adversarial-tecnica.md](revision-adversarial-tecnica.md).

| Hallazgo | Corrección | Estado |
|---|---|---|
| **Crítico:** con el reloj adelantado se mostraba «Solicitud recibida» sin enviar | Mide el tiempo sin usar el reloj. Nunca responde éxito si no envió | VERIFICADO |
| `X-Forwarded-For` evadía el límite | El servidor fija la IP de confianza | VERIFICADO |
| Salida rápida en 2 páginas | Todas salvo la portada, al inicio del orden de foco | VERIFICADO |
| Lo escrito volvía con Atrás | `no-store` en páginas y limpieza al salir | Cabecera VERIFICADA; limpieza PENDIENTE de probar en cada navegador |
| Sin JS, sin validación ni aviso | Valida el navegador. La página de error explica las causas | PENDIENTE: lo escrito puede perderse tras un error del servidor |
| Foco tras el menú móvil | Contenido inerte con el menú abierto | Implementado, sin prueba automática propia |
| Secretos incrustados al compilar | Solo se leen al ejecutar | VERIFICADO en el código compilado |
| Canonical en `localhost` | `astro.config` carga `.env` y exige dominio real | Por lectura: **no se compiló en modo publicación** |
| Vigilancia ciega ante fallos | La copia no se destruye y lo no comprobado se informa | VERIFICADO con un fallo simulado |

También: cuerpo limitado de verdad, sin archivos ni JSON, TLS obligatorio, asunto del correo sin tema, huella de IP con clave en memoria y política de privacidad contrastada con el código.

**Sin corregir (medios y bajos):** reescritura completa de la página de violencia, que sigue siendo larga en móvil; «Salir rápido» tapa algo de texto mientras se desplaza; respuesta 405 en la API; canal alternativo si el formulario falla, que requiere datos de contacto; imágenes del blog que aún parecen de banco.

## 11. Accesibilidad

**VERIFICADO con axe:** sin infracciones graves en las plantillas probadas. **Revisado por lectura y árbol de accesibilidad:** foco del orientador, pasos del formulario, tamaño de objetivos, enlaces al 9-1-1 sin partir. **NO REALIZADO:** lector de pantalla real y revisión manual completa. El objetivo WCAG 2.2 AA no se puede declarar cumplido sin ellos.

## 12. Pruebas

| Control | Resultado |
|---|---|
| `astro check` | 0 errores, 0 avisos, 100 sugerencias |
| Linter | No hay ninguno configurado: no se ejecutó |
| Matriz jurídica | 1061 afirmaciones, 0 errores, 0 avisos |
| Chrome, escritorio y móvil, 2 pasadas | 301 superadas, 47 omitidas, 0 fallidas en cada una |
| Firefox, WebKit y iPhone emulado | 447 superadas, 74 omitidas, **1 fallida** |
| `npm audit` | 0 vulnerabilidades |
| Auditoría de identidad | Sin referencias residuales |

**El fallo:** en WebKit, `/` agotó los 45 s de carga en 1 de 5 repeticiones de una prueba. Con menos trabajos en paralelo, las 162 pruebas de WebKit pasaron. Puede ser la emulación de WebGL sin tarjeta gráfica, pero no está demostrado: **hay que probar la portada en un Safari real**.

Las pruebas omitidas no aplican a ese perfil o solo corren en uno. WebKit se ejecutó con bibliotecas del sistema copiadas a la caché de Playwright, sin instalar nada en el sistema. Para repetirlo en otro equipo: `sudo npx playwright install-deps`.

## 13. Rendimiento

Simulación con 4G lenta y CPU cuatro veces más lenta, en Chrome. No es un teléfono real.

| Página | LCP | CLS | Peso |
|---|---|---|---|
| Portada, 390 px | 1,41 s | 0,067 | 878 KB |
| Portada, 1440 px | 1,11 s | 0,005 | 837 KB |
| Protección familiar, 390 px | 1,10 s | 0,004 | 363 KB |
| Artículo, 390 px | 1,75 s | 0,003 | 217 KB |
| Divorcios, 390 px | 1,24 s (dos mediciones) | 0,025 | 391 KB |

Una medición aislada de Divorcios dio 2,65 s; no se repitió en las siguientes. INP y JavaScript comprimido siguen dentro del límite según las pruebas.

## 14. Commits y ramas

`c1758a7`, `61dc289`, `7c90b4d`, `613663f`, `9e2adb1` y el commit de este informe. La etiqueta `antes-plan-maestro` marca `5ade437`. `base-antes-rediseno` y `main` siguen intactas. El repositorio no tiene remoto: no hubo push ni PR.

## 15. Limitaciones de verificación

- **Ninguna persona abogada revisó nada.** Un programa confirma que una cita existe, no que la interpretación sea correcta.
- Las citas de `fuenteExterna` no se comprueban automáticamente.
- Jurisprudencia: se leyeron la 13920-2023, 151-2002, 1752-2002 y 6813-2008 en Nexus. Las demás de las notas de SINALEVI no se contrastaron. El texto leído de la 13920-2023 no contiene «mismo sexo», aunque la nota de SINALEVI sí lo dice; el sitio lo atribuye a la nota.
- La línea 1147 del PANI sigue publicada en dos páginas. `pani.go.cr` bloqueó la lectura automática y no se eludió. **Hay que confirmarla.**
- Teléfono y horario de la Delegación de la Mujer y WhatsApp del INAMU: sin fuente oficial reciente, no se publicaron.
- **No probado:** teléfonos reales, Safari real, lector de pantalla, SMTP de producción, compilación en modo publicación.
- La copia de SINALEVI dice «elaciones impropias» en el art. 143 CF; se publicó «relaciones». Conviene cotejarlo con La Gaceta.
- `.env.example` no se pudo editar al final por los permisos de esta sesión: aún cita `MAIL_SEND_ACK`, que ya no hace nada. Hay que borrar esa línea.
- El contenido no se puede actualizar sin reconstruir el sitio. Se compila al construir; una corrección es editar, compilar y reiniciar, y se revierte con Git. No se cambió esa arquitectura.
- Las puntuaciones por página de la revisión jurídica son anteriores a las correcciones y son el juicio de un revisor, no una medición.

## 16. Bloqueos externos

| Bloqueo | Quién | Afecta a |
|---|---|---|
| Revisión profesional, incluidas 17 dudas concretas | Persona abogada | Todo el contenido |
| Colegiatura y habilitación | Evelyn y Colegio | Publicación: sin esto no conviene publicar |
| Temas atendidos y forma real de trabajo | Evelyn | «Cómo se trabaja», áreas y etapas |
| Contacto y fotografía autorizada | Evelyn | Contacto y perfil |
| Responsable, dirección, proveedores, conservación y transferencias | Evelyn | Política de privacidad. La compilación indexable falla sin ellos |
| Inscripción ante Prodhab | Persona abogada | Ni la norma ni la agencia resuelven el caso de una profesional independiente |
| Criterio sobre publicidad, arts. 29 y 30 CDJ | Colegio | Portada y llamados a consulta |
| Dominio y SMTP | Propietario | Publicación y formulario |
| Validación de seguridad con especialistas en violencia | Especialistas | Salida rápida y recursos |

## 17. Preparación para producción

**No está listo.** Técnicamente queda preparado para activarse cuando existan los datos, pero publicarlo hoy pondría en línea contenido legal sin revisión de una persona abogada y de una profesional cuya habilitación no consta.

## 18. Riesgos residuales

Ver [registro-de-riesgos.md](registro-de-riesgos.md). Los mayores: un error de interpretación que un programa no detecta; que una persona en riesgo confíe de más en la salida rápida; que el proyecto 23.982 se apruebe y cambie el divorcio; y que nadie instale la vigilancia programada.

## 19. Lo que requiere información externa

Las 17 dudas para una persona abogada están al final de [revision-adversarial-juridica.md](revision-adversarial-juridica.md). Además: los datos de la sección 16.

## 20. Para activar la vigilancia

`npm run normas:vigilar` funciona ya. Para que corra cada semana hay que elegir dónde, porque el repositorio no tiene remoto. Las unidades están en `ops/` y no se instalaron para no cambiar la configuración del equipo sin que lo decidas.
