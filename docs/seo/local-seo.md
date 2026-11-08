# SEO local y datos de contacto (NAP)

Fecha: 7 de noviembre de 2026. Ningún dato de contacto, dirección, horario ni credencial de la profesional está confirmado. Este documento define **cómo** se gestionarán cuando lo estén; no contiene ninguno.

## 1. Regla de base

**Costa Rica es la jurisdicción, no la cobertura presencial.** El sitio explica derecho costarricense. Cuando el perfil se apruebe, el grafo declarará `areaServed: Costa Rica` en el nodo de servicio (`Service`, o `LegalService` solo si hay oficina); hoy no lo declara. Eso no equivale a decir que se atiende en persona en todo el país, ni en un cantón concreto. Mientras no se confirme dónde y cómo se atiende:
- no se publican direcciones, mapas ni referencias a provincias o cantones como lugar de atención;
- no se crean páginas por localidad («abogada de familia en Heredia», etc.); sin oficina, serían páginas puerta;
- no se menciona atención virtual ni a domicilio salvo confirmación expresa.

## 2. Modelo de datos centralizado

Hoy todos los datos viven en `src/config/site.ts` y se leen de variables de entorno públicas. **Todas están vacías** y la interfaz oculta lo que no tiene valor.

| Grupo | Variable | Uso actual |
|---|---|---|
| Contacto | `PUBLIC_CONTACT_PHONE` | `site.contact.phone`; `telephone` en el grafo si el perfil está aprobado |
| Contacto | `PUBLIC_CONTACT_EMAIL` | `site.contact.email`; `email` en el grafo si el perfil está aprobado |
| Contacto | `PUBLIC_CONTACT_ADDRESS` | `site.contact.address`; `PostalAddress` en el grafo solo con perfil aprobado |
| Contacto | `PUBLIC_CONTACT_HOURS` | `site.contact.hours` |
| Privacidad | `PUBLIC_DATA_CONTROLLER`, `PUBLIC_DATA_CONTROLLER_ID`, `PUBLIC_DATA_CONTROLLER_ADDRESS`, `PUBLIC_PRIVACY_EMAIL`, `PUBLIC_PRIVACY_PROVIDERS`, `PUBLIC_PRIVACY_RETENTION`, `PUBLIC_PRIVACY_TRANSFERS` | `politica-de-privacidad.astro`; la compilación indexable falla si faltan |
| Autoría | `PUBLIC_AUTHOR_VERIFIED`, `PUBLIC_AUTHOR_NAME`, `PUBLIC_AUTHOR_CREDENTIAL`, `PUBLIC_AUTHOR_PROFILE_URL` | Autor `Person` en `Article` solo si `VERIFIED=true` |
| Perfil | `PUBLIC_PROFILE_APPROVED` | Sin `true`, el grafo (`src/lib/seo/grafo.ts`) no declara servicio profesional ni datos de contacto; con `true`, `LegalService` si hay dirección y `Service` si no |

### Reglas del modelo
1. **Una sola fuente.** Ningún componente escribe a mano un teléfono, correo o dirección; todo sale de `site`. Así el NAP es idéntico en pie de página, contacto, datos estructurados y perfiles externos.
2. **Formato canónico** (definirlo una vez y copiarlo igual en todos los perfiles): nombre profesional exacto; teléfono en formato internacional (`+506` seguido del número); dirección con la estructura costarricense (provincia, cantón, distrito y señas), solo si hay atención presencial.
3. **Dirección en datos estructurados** (`address` / `PostalAddress`) solo si hay oficina con atención presencial confirmada. Para un área de servicio sin oficina abierta al público, se mantiene `areaServed` sin dirección.
4. **Datos de privacidad y de contacto pueden diferir** (la responsable de la base de datos puede tener otra dirección de notificaciones). No se mezclan.

### Campos que faltan en el modelo (propuesta)
- `PUBLIC_CONTACT_MODALIDAD`: presencial, virtual o ambas. Condiciona la dirección, el perfil de Google y el texto de contacto.
- `PUBLIC_CONTACT_SERVICE_AREA`: zonas de atención presencial, si las hay.
- Credencial: número de carné del Colegio de Abogados y Abogadas, **solo si la profesional autoriza publicarlo**; condición de notaria pública solo si lo ejerce y lo confirma.

## 3. Qué falta confirmar (con la profesional)

| Dato | Necesario para | Estado |
|---|---|---|
| Nombre profesional exacto (como figura en el Colegio) | Sitio, perfiles, autoría | Sin confirmar |
| Número de carné y autorización para publicarlo | Autoría, citaciones | Sin confirmar |
| Teléfono y correo de atención | Contacto, perfiles | Sin confirmar |
| Modalidad de atención (presencial, virtual, ambas) | Elegibilidad de perfil local | Sin confirmar |
| Dirección de oficina y si recibe público en horario fijo | Perfil de Google, `address` | Sin confirmar |
| Horario de atención | Perfil, contacto | Sin confirmar |
| Ejercicio del notariado | Categorías, citaciones | Sin confirmar |
| Perfiles profesionales existentes (p. ej. LinkedIn) | `sameAs` | Sin confirmar |

## 4. Google Business Profile (condicionado a elegibilidad)

No se crea, reclama ni edita ningún perfil sin autorización expresa de la profesional, y la cuenta debe ser suya.

### Elegibilidad (contrastar con las directrices vigentes de Google el día de la solicitud)
- **Profesional individual:** las directrices permiten un perfil para una persona profesional que atiende al público. Si en el futuro ejerce dentro de un despacho, hay reglas específicas sobre perfiles de despacho y de profesionales.
- **Oficina con atención presencial:** si recibe clientela en una dirección propia durante el horario publicado, puede tener perfil con dirección visible.
- **Área de servicio:** si atiende en persona pero no en una oficina abierta al público, se configura como negocio de área de servicio, con la dirección oculta.
- **Solo atención virtual:** sin contacto presencial, el negocio **no es elegible**.
- **Prohibido:** direcciones virtuales, apartados, oficinas compartidas sin personal ni señalización durante el horario, o direcciones de terceros. Usarlas puede llevar a la suspensión del perfil.
- **Nombre:** el nombre real de la profesional o de su despacho, sin añadir palabras clave («Divorcios Costa Rica»).

### Categorías candidatas (confirmar nombre exacto en la interfaz en español)
- Principal: abogado especializado en derecho de familia (equivalente a *Family law attorney*).
- Secundarias posibles: abogado; abogado especializado en divorcios.
- Notaría: solo si ejerce el notariado y lo confirma.

### Contenido del perfil
- Descripción sobria, sin autoelogio ni promesas (artículo 30 del Código de Deberes, ya citado en el sitio).
- Enlace a la página de inicio o a `/contacto`, sin parámetros de seguimiento con datos personales.
- Reseñas: no se solicitan con incentivos ni se responden revelando datos del caso; responder sin confirmar que la persona fue clienta, por secreto profesional.

## 5. Citaciones legítimas a investigar

No se afirma ninguna membresía. Cada fuente se investiga, se confirma con la profesional y solo entonces se usa.

| Fuente | Qué investigar | Uso posible |
|---|---|---|
| Colegio de Abogados y Abogadas de Costa Rica | Si existe consulta pública de personas agremiadas y qué datos muestra | Enlace `sameAs` o mención de la credencial, si la profesional lo autoriza |
| Dirección Nacional de Notariado | Consulta pública de notarios habilitados | Solo si ejerce el notariado |
| Bing Places | Importación desde Google Business Profile | Coherencia de NAP en Bing y Copilot |
| Apple Business Connect | Ficha en Mapas de Apple | Igual que Bing Places |
| Perfiles profesionales propios | LinkedIn u otros que ya tenga | `sameAs`, coherencia de nombre |
| Directorios jurídicos o generales de Costa Rica | Cuáles existen, si son editoriales o de pago, su reputación | Solo los que tengan criterio editorial; se evitan directorios masivos o de intercambio de enlaces |

## 6. Coherencia del NAP

Cuando haya datos confirmados: lista de todos los lugares donde figura el NAP (sitio, perfil de Google, Bing Places, Apple, directorios), con fecha de última comprobación. Cualquier cambio se hace primero en las variables de `site.ts` y luego en cada perfil, el mismo día.
