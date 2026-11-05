# Revisión del rediseño

**Rama:** `rediseno/completo`. Nada se fusionó en `main`, nada se publicó y el sitio sigue con `noindex`.

## 1. Cómo verlo

Si el servidor no está en marcha, ejecute desde la carpeta del proyecto:

```bash
MAIL_MODE=outbox PORT=4321 node ./dist/server/entry.mjs
```

| Qué | Dirección |
|---|---|
| Portada con el árbol que crece | http://localhost:4321/ |
| Orientador | http://localhost:4321/servicios#por-donde-empiezo |
| Página de servicio rediseñada | http://localhost:4321/servicios/divorcios |
| Salida rápida | http://localhost:4321/servicios/proteccion-familiar |
| Formulario por pasos | http://localhost:4321/agendar-consulta |
| Blog con búsqueda | http://localhost:4321/blog |

## 2. Lo que debe decidir

### 2.1 El árbol: decidido

Se eligió **Crecer**: el árbol se dibuja trazo a trazo, después brotan los jóvenes y caen algunas hojas. El scroll lo completa.

`/laboratorio` y los conceptos *Partículas* y *Sombra* se retiraron del sitio. Su código sigue disponible en el historial de git, en el commit `fd38d7a`.

### 2.2 Otras decisiones

1. **Salida rápida:** lleva a `google.com` como sitio neutro. Puede preferir otro. Debe validarse con especialistas.
2. **Orientador:** las preguntas son nuevas. Una persona abogada debe confirmar que no parezcan una calificación jurídica.
3. **Fusionar:** cuando lo apruebe, la rama se puede integrar en `main`.

## 3. Lo que cambió

### Portada

- Hero a pantalla completa, con titular de hasta 200 px y el árbol.
- Al terminar el recorrido, la sección siguiente cubre el hero como un telón.
- Áreas en lista tipográfica; con ratón, una imagen acompaña al cursor.
- Proceso con el título fijo y una línea que avanza con los pasos.

### Movimiento

- Titulares que entran palabra por palabra, textos que se revelan e imágenes con máscara y parallax.
- Transiciones entre páginas y cabecera que se oculta al bajar y vuelve al subir.
- Botón **Pausar animaciones** en el pie, que queda recordado en ese navegador.

### Servicios y lectura

- Cada página se reordenó por preguntas: *En breve*, *¿Qué dice la ley?*, *¿Cómo es el trámite?*, *Preguntas frecuentes*, *Fuentes*.
- Índice lateral fijo, plegable en móvil, y barra de progreso.
- Se eliminaron los carruseles y las imágenes repetidas. Todo el texto legal sigue visible, sin "Leer más".
- **Orientador "¿Por dónde empiezo?"** en `/servicios`: hasta dos preguntas. No guarda ni envía nada.
- **Salida rápida** en las dos páginas sobre violencia: botón o Esc dos veces.

### Blog, formulario y resto

- Blog con artículo destacado, filtros y búsqueda en la misma página.
- Formulario en tres pasos. Sin JavaScript se ve completo y envía igual.
- Encabezados tipográficos en todas las páginas interiores y menú móvil animado.

## 4. Decisiones que tomé por mi cuenta

| Decisión | Motivo |
|---|---|
| **Sin GSAP ni Lenis**, aunque estaban en el plan | CSS y JavaScript nativos bastaron: ahorran unos 50 KB comprimidos y no alteran el scroll |
| **Monograma 3D descartado** | Usted lo pidió. Sigue como logotipo |
| **Fuera de la página de protección familiar:** árbol y animación automática | Quien la lee puede estar en peligro. Sí conserva revelados suaves de texto |
| **Titular reducido** de 190 a 153 px a 1440 px | Para dejar sitio al árbol |
| **Cálculo del árbol en segundo plano** (Web Worker) | Una prueba de respuesta detectó el riesgo de bloquear la página |
| **Principios de atención en rejilla, sin carrusel** | Todo el texto queda a la vista, sin tener que pulsar flechas |

## 5. Pruebas

| Comprobación | Resultado |
|---|---|
| Playwright, dos pasadas, escritorio y móvil | **386 superadas, 0 fallidas**. 14 omitidas por diseño: aplican solo a un perfil |
| TypeScript | 0 errores |
| Identidad anterior | Sin referencias residuales |
| Accesibilidad con axe (WCAG 2.2 A y AA), 9 páginas | 0 violaciones graves o críticas |
| Contraste real del titular sobre el árbol (390, 1440 y 1920 px) | Mínimo medido: 11,48:1 (requisito: 3:1) |
| Sin WebGL, sin JavaScript, sin el script de interacciones y con movimiento reducido | Contenido completo |
| Solicitudes externas en las páginas principales | Ninguna |

**Carga simulada en local** (red lenta y CPU 4× más lenta, versión final). El peso está sin comprimir:

| Página | LCP | CLS | Peso total |
|---|---:|---:|---:|
| Portada, 390 px | 1,44 s | 0,065 | 778 KB |
| Portada, 1440 px | 1,33 s | 0,012 | 778 KB |
| Servicio, 390 px | 1,19 s | 0,008 | 203 KB |
| Artículo, 390 px | 1,23 s | 0 | 179 KB |

**Fluidez con la RTX 4060, sin límite de cuadros:** de 626 a 2333 cuadros por segundo entre las tres escenas originales, medido antes de retirar las otras dos y sin repetir después. Hay mucho margen en este equipo, pero el dato no predice el comportamiento en un teléfono.

### Imagen de reserva corregida

Al fijar *Crecer* apareció un defecto anterior: la imagen que se ve sin 3D, con movimiento reducido y durante la carga incluía el trozo de texto «rta.» del titular. Se regeneró sin texto y una prueba comprueba ahora que no vuelva a ocurrir.

## 6. Lo que no está verificado

- **Teléfono real:** todo el móvil se simuló. Es el mayor riesgo.
- **Safari y Firefox:** no probados. El sitio se probó solo en Chrome.
- **Lector de pantalla:** no probado con uno real.
- **Vista del panel integrado:** a mí no me sirvió para medir fluidez, porque iba a 1 fps sin foco. Es una limitación del panel, comprobada sin escena.
- **Producción:** sigue sin correo real, dominio ni alojamiento.
- **Revisión jurídica:** sigue pendiente. Ver la [auditoría](legal-compliance-audit.md), incluida la sección 1.5 sobre las funciones nuevas.
- **Premios:** nadie puede garantizarlos, y el sitio aún no se puede postular porque no está publicado.
