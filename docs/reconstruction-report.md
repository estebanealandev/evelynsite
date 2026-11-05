# Informe de reconstrucción

**Fecha:** 4 de noviembre de 2026. **Documento interno.**

## 1. Resultado

Se construyó un sitio navegable y autónomo en Astro 7, con formularios reales y contenido jurídico costarricense original.

**No está listo para publicarse todavía.** Faltan la revisión jurídica profesional, los datos reales y la configuración de correo. El sitio mantiene `noindex` hasta activar `PUBLIC_SITE_READY=true`.

## 2. Decisión sobre recursos del sitio de referencia

La sección 3 del encargo pide recuperar recursos "cuyo uso esté autorizado". **No consta ninguna autorización** para el código, las fotografías, los logotipos o las fuentes con licencia del sitio de referencia, así que no se descargó ni reutilizó ninguno de ellos. Solo se conservan capturas y métricas como referencia interna, fuera de `public/`.

Además, la reproducción cercana de un diseño ajeno puede plantear cuestiones de propiedad intelectual o competencia. Esta implementación conserva retícula, jerarquía y ritmo, pero tiene código, textos, imágenes, tipografías, colores y marca distintos. Conviene que una persona abogada valore el grado de similitud.

## 3. Páginas

**Descubiertas:** 265 URL en el sitemap (12 páginas, 87 artículos, 9 categorías, 157 etiquetas). Ver [site-inventory.md](site-inventory.md).

**Construidas:**

| Tipo | Cantidad | Rutas |
|---|---:|---|
| Principales | 8 | `/`, `/servicios`, `/sobre-evelyn`, `/blog`, `/contacto`, `/agendar-consulta`, `/politica-de-privacidad`, `/aviso-juridico` |
| Áreas de servicio | 9 | `/servicios/*` |
| Artículos | 15 | `/blog/*` |
| Categorías | 9 | `/blog/categoria/*` |
| Etiquetas | 40 | `/blog/etiqueta/*` |
| Estados | 4 | `/consulta-recibida`, `/consulta-no-enviada`, `/suscripcion-recibida`, `404` |
| Técnicas | 4 | `sitemap.xml`, `robots.txt`, `/api/consulta`, `/api/suscripcion` |

**Exclusiones:** el duplicado `/schedule-a-consultation-1` y los 87 artículos originales, sustituidos por 15 temas costarricenses.

## 4. Recursos

| Categoría | Cantidad | Origen |
|---|---:|---|
| Archivos descargados del original para publicar | 0 | Decisión de la sección 2 |
| Capturas y métricas de referencia | 42 capturas | Solo en `docs/reference/` |
| Imágenes originales | 35, cada una con una variante `-sm` | `scripts/generate-art.mjs` |
| Mapa vectorial | 1 | Natural Earth, dominio público |
| Archivos de marca | 24 y 4 iconos | `scripts/generate-brand.mjs` |
| Fuentes | 7 archivos | OFL, desde paquetes Fontsource |

## 5. Componentes

**Diseño:** `Base`, `Header` (submenú, menú móvil), `Footer`.

**Secciones:** `Principles`, `Process`, `PostsSection`, `Cta`, `ArchiveList`.

**Interfaz:** `Cut` (cortes diagonales), `Marquee`, `Carousel`, `Crumbs`, `PostCard`.

**Formularios:** `ConsultaForm` y suscripción en el pie.

**Plantillas:** portada, servicio, artículo, categoría, etiqueta y páginas legales.

## 6. Animaciones e interacciones

| Comportamiento | Estado | Implementación |
|---|---|---|
| Marquesinas | Reproducido | CSS; pausa al pasar el cursor |
| Carruseles con flechas | Reproducido | Scroll-snap y JS |
| Acordeones "Leer más" | Reproducido | `<details>` nativo |
| Menú móvil a pantalla completa | Reproducido, con la misma curva y duración | CSS y JS |
| Hamburguesa a cierre | Reproducido | CSS |
| Opacidad de botones (0,1 s) | Reproducido | CSS |
| Subrayado de página activa | Reproducido | CSS |
| Zoom suave de imágenes en tarjetas | Añadido | CSS |
| Revelado suave al hacer scroll | **Añadido**: el original tiene las animaciones globales desactivadas, pero el encargo las pide | IntersectionObserver |
| Lightbox de video | **Adaptado** a un diálogo de texto, porque no existe video | `<dialog>` |
| Reducción de movimiento | Implementado | `prefers-reduced-motion` |

## 7. Pruebas ejecutadas

Última ejecución: 4 de noviembre de 2026.

| Prueba | Resultado |
|---|---|
| Playwright (escritorio 1440 px y móvil 390 px, Chrome) | **94 superadas, 0 fallidas**; 4 omitidas por corresponder solo al otro perfil |
| TypeScript (`astro check`) | 0 errores |
| Identidad (`audit:identity`) | 216 archivos, 0 coincidencias |
| Scroll horizontal en 375, 390, 430, 768, 1024, 1100, 1280, 1440 y 1920 px, 12 rutas | Sin desbordes |
| Solicitudes externas en las páginas principales | 0 |
| Errores de consola y recursos rotos en las páginas principales | 0 |
| Enlaces internos de todas las rutas del sitemap | Todos responden 200 |
| Accesibilidad con axe (WCAG 2.2 A y AA), 9 páginas | 0 violaciones graves o críticas. Se excluyen las palabras gigantes decorativas |
| SMTP real contra servidor local | Mensaje recibido; inyección de cabeceras neutralizada |
| Sin proveedor de correo | Responde 503 y no simula éxito |
| Rendimiento local con red y CPU limitadas | LCP de 1,1 a 1,3 s; CLS 0; de 127 a 170 KB en carga inicial |

**Qué no cubren estas pruebas:**

- Accesibilidad automática no equivale a cumplimiento: falta una revisión manual con lectores de pantalla reales.
- El rendimiento se midió en local, sin la latencia ni la infraestructura de producción. No es un dato de campo.
- Solo se usó Chrome. Faltan Safari y Firefox.
- No se probó un proveedor SMTP real ni el despliegue en producción.
- El límite de solicitudes no se probó en una prueba específica de agotamiento.

## 8. Fidelidad medida

**No se declara el 99,9 %.** Ese porcentaje no se midió y no se puede afirmar. Tampoco sería significativo con píxeles, porque imágenes, textos y tipografías cambian de forma deliberada. Lo que sí se midió está en [reference/structure-comparison.md](reference/structure-comparison.md):

- **Desviación media absoluta del alto de página:** 24,3 %. **Mayor desviación:** 57 %.
- **Tipografía:** H1 de 56,8 px frente a 52,8 px a 1440 px. El aumento compensa las proporciones de Cormorant Garamond.
- **Cabecera:** 118 px frente a 123 px, sumando la franja superior.
- **Pie:** 823 px frente a 798 px.

Altura de página a 1440 px:

| Página | Referencia | Implementación | Diferencia | Motivo |
|---|---:|---:|---:|---|
| Portada | 10 506 | 9710 | -8 % | Sin insignias de gran altura y sin textos de testimonios |
| Sobre | 7942 | 5166 | -35 % | **Sin perfiles de equipo** |
| Divorcio | 9729 | 11 119 | +14 % | Se añaden preguntas frecuentes, fuentes y explicación jurídica pedidas en el encargo |
| Guarda | 8459 | 10 912 | +29 % | Igual |
| Acuerdos | 7857 | 10 142 | +29 % | Igual |
| Contacto | 1710 | 1608 | -6 % | |
| Agendar | 3743 | 4094 | +9 % | Formulario real en la página |
| Blog | 9808 | 4769 | -51 % | **15 artículos en lugar de 87**, con menos secciones |
| Artículo | 5775 | 4967 | -14 % | Depende del texto |
| Privacidad | 5451 | 3318 | -39 % | Política adaptada al funcionamiento real |
| Aviso | 4016 | 2726 | -32 % | Texto más breve |
| 404 | 2159 | 2243 | +4 % | |

La revisión visual fue manual, sección por sección, en portada, servicio, sobre, blog, agenda, contacto, artículo y 404. A 375 px se revisaron portada y servicio; a 768 px, la portada. Las demás combinaciones de página y ancho solo tienen comprobación automática de desbordes y métricas.

## 9. Diferencias respecto de la referencia

| Diferencia | Motivo |
|---|---|
| Imágenes sintéticas sin personas | Ninguna fotografía autorizada disponible |
| Retrato sustituido por monograma | No se puede presentar a otra persona como Evelyn Elizondo |
| Sin cifras, testimonios, premios ni medios | Prohibido inventarlos |
| Tres páginas de servicio pasan a nueve | Encargo y diferencias del derecho costarricense |
| Más enlaces en el pie y un submenú | Hay más áreas |
| Hero con dos botones | Encargo |
| Proceso de 4 pasos en lugar de 3 | Encargo |
| Mapa estático de Costa Rica | Sin sede confirmada ni servicios remotos |
| Sin agenda externa ni modalidades de pago | Sin datos reales; se usa un formulario |
| Marfil y gris piedra en lugar de los tonos originales | Nueva paleta |
| Menú hamburguesa hasta 1279 px | Las etiquetas en español son más largas |
| Teléfono superior sustituido por "Costa Rica" | Sin teléfono confirmado; aparece al configurarlo |

## 10. Problemas detectados y resueltos

| Problema | Solución |
|---|---|
| Texto oficial del Código Procesal separado de la ley de aprobación | Se localizó la norma 90569 mediante las referencias de SINALEVI |
| Certificado TLS no válido en el sitio del Colegio | No se forzó; se consultó el Código en SINALEVI |
| Validación de origen rechazaba solicitudes sin `Sec-Fetch-Site` | Se configuró `security.allowedDomains` |
| Desborde móvil de 9 px y rejillas que no se apilaban | Estilos en línea sustituidos por clases |
| Hero sobre la franja de valores a 768 y 1280 px | Panel anclado a la base de la imagen |
| Navegación desbordada de 1100 a 1340 px | Nuevo punto de ruptura y ajustes |
| Títulos con poco contraste en tarjetas | Degradado y brillo ajustados |
| Imágenes de artículo poco nítidas | Render a 1400 px y variantes livianas |
| Política de privacidad con afirmaciones imprecisas | Corregida para reflejar lo implementado |

## 11. Recursos pendientes o imposibles de recuperar

**No recuperados, por falta de autorización:** fotografías, logotipos, video, insignias, testimonios, Freight Big, SS Pro y código de Squarespace.

**A cargo del responsable del proyecto:**

- Fotografía profesional auténtica y autorizada.
- Datos de contacto, responsable de datos y proveedores.
- Dominio, alojamiento con HTTPS y cuenta SMTP.
- Confirmación de datos profesionales y servicios.

## 12. Dependencias remotas restantes

**Para mostrar el sitio: ninguna.** Comprobado por pruebas sobre las páginas principales.

Solo hay enlaces salientes, que el navegador no carga por sí mismo, hacia SINALEVI como fuente normativa. El envío de correo dependerá del proveedor SMTP que se configure. No hay analítica, rastreadores ni dependencias del sitio de referencia.

## 13. Recomendaciones

1. Revisar el contenido y resolver los puntos de la [auditoría jurídica](legal-compliance-audit.md), empezando por el artículo 30 del Código de Deberes.
2. Verificar el estado del expediente 23.982 antes de publicar el contenido de divorcios.
3. Sustituir parte de las imágenes por fotografía real cuando exista.
4. Probar en Safari y Firefox y con lectores de pantalla.
5. Medir Core Web Vitals en producción.
6. Definir un calendario de revisión normativa.
7. Si el volumen de suscripciones crece, usar una herramienta de listas con baja automática.
