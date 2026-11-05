# Plan de UX y diseño: nueva dirección del sitio

**Fecha:** 5 de noviembre de 2026.

| Fase | Estado |
|---|---|
| 0. Red de seguridad | Hecha |
| 1. Limpieza y nueva base visual | Hecha en `rediseno/fase-1`. Pedido de ajuste: hero más audaz y adelantar el 3D |
| 3. three.js | Adelantada a petición: tres prototipos en `/laboratorio`, rama `rediseno/fase-3-prototipos`, pendientes de elección |
| 2 y 4 a 7 | Pendientes de aprobación |

## 1. Lo esencial

Hoy el sitio es sólido, pero se ve como una plantilla legal bien hecha: es largo, repite módulos y casi no se mueve. Se propone convertirlo en una experiencia sobria y memorable, con una idea central: **pasar de la incertidumbre a la claridad**.

- **Una marca viva:** el monograma EE en 3D con three.js, como pieza central de la portada.
- **Menos, pero mejor:** menos módulos, tipografía mucho más grande y más aire.
- **Movimiento con intención:** intenso al entrar y discreto al leer.
- **Una ayuda real:** quien llega angustiado encuentra su respuesta en segundos.

Trabajaremos por fases. Cada fase termina con algo que puedes abrir y probar, y la siguiente no empieza sin tu aprobación.

## 2. Diagnóstico del sitio actual

| Hallazgo | Evidencia | Consecuencia |
|---|---|---|
| Portada larga y densa | 14 módulos y 9710 px a 1440 px | Pierde foco y ritmo |
| Páginas de servicio repetitivas | 13 módulos y 11 119 px; el contenido legal aparece en 4 bloques distintos | Cuesta encontrar una respuesta concreta |
| Herencia de la referencia | Cortes diagonales, rectángulos desfasados y palabras fantasma | Se siente como una plantilla, y además aumenta el parecido con el sitio original |
| Tipografía contenida | H1 de 56,8 px a 1440 px | Poco impacto editorial |
| Movimiento mínimo | Solo fundidos, marquesinas y zoom en tarjetas | Sin momentos memorables |
| Imágenes repetidas | 11 escenas 3D reutilizadas en distintos encuadres | Monotonía visual |
| Pie muy cargado | 12 enlaces en una columna, más boletín y aviso | Cierre pesado |
| **Fallo de accesibilidad** | Las marquesinas solo se pausan con el cursor | Incumple WCAG 2.2.2 para quien usa teclado o pantalla táctil. Se corrige en la Fase 1 |

## 3. Principios

1. **El espectáculo a la entrada, la calma en la lectura.** Este público puede estar viviendo un divorcio o una situación de violencia.
2. **Cada animación debe explicar algo.** Si solo decora, se elimina.
3. **El contenido nunca espera a la animación.** El texto se puede leer desde el primer instante.
4. **Sin JavaScript o WebGL, el sitio sigue completo y se ve bien.**
5. **La marca es la estrella, no la tecnología.** El 3D debe sentirse propio de Evelyn Elizondo, no una demostración.

### Intensidad de movimiento por página

| Página | 3D | Animación | Scroll suave |
|---|---|---|---|
| Portada | Sí, protagonista | Alta | Sí, a validar |
| Sobre Evelyn, áreas | Quizá un acento | Media | Sí, a validar |
| Página de servicio | No | Baja | No |
| Artículos, legales | No | Mínima | No |
| **Protección familiar** | **Nunca** | **Casi nula** | **No** |
| Formularios | No | Solo retroalimentación | No |

## 4. Dirección de arte propuesta: "Del umbral a la luz"

- **Narrativa de color:** la portada inicia en navy profundo y se abre hacia el marfil a medida que se avanza, como una puerta que deja entrar la luz.
- **Tipografía:** Cormorant Garamond a gran escala (hasta unos 130 px en el hero) con itálicas expresivas. Inter para leer. Se elimina Manrope para simplificar.
- **Retícula:** 12 columnas, márgenes amplios y composiciones asimétricas. Filetes finos en lugar de cortes diagonales y rectángulos desfasados.
- **Color:** la paleta actual, con el oro reservado para unos pocos acentos. Menos bandas grises.
- **Imagen:** menos imágenes y más grandes, cada una con un propósito. **La fotografía real de Evelyn sigue siendo la mejora con mayor impacto.**

## 5. Stack técnico propuesto

Pesos medidos en este proyecto, minificados y comprimidos con gzip:

| Herramienta | Uso | Peso | Licencia | Carga |
|---|---|---:|---|---|
| three.js 0.187 | Escena 3D | 141 KB (escena mínima) | MIT | Diferida y solo en la portada |
| GSAP 3.15 + ScrollTrigger | Coreografía y animación ligada al scroll | 45 KB | Gratuita, permite uso comercial en sitios web | Según la página |
| Lenis 1.3 | Scroll suave | 5 KB | MIT | Opcional, se decide probándolo |
| View Transitions (nativo) | Transiciones entre páginas | Muy bajo | Estándar web | Global |

Todo se aloja localmente, sin CDN. Hoy el sitio carga 5 KB de JS propio, así que el aumento es real y se controla con los límites de la sección 7.

## 6. Fases

Tamaño relativo: **S** pequeño, **M** mediano, **L** grande.

### Fase 0: Red de seguridad (S)

- Inicializar Git para poder volver atrás en cada fase. Requiere tu aprobación.
- Guardar capturas y métricas actuales como línea base.
- Añadir controles de peso y rendimiento a las pruebas automáticas.

**Tú pruebas:** nada visual. **Listo cuando:** las 94 pruebas actuales siguen pasando.

### Fase 1: Limpieza y nueva base visual (M)

Sin animaciones todavía, para juzgar el diseño por sí mismo.

- Nueva escala tipográfica, retícula y espaciado.
- Portada reducida de 14 a unos 7 capítulos: hero, propuesta, áreas, enfoque, proceso, biblioteca y cierre.
- Se eliminan cortes diagonales, palabras fantasma y marquesinas.
- Cabecera y pie más simples.

**Tú pruebas:** portada estática en escritorio y móvil, comparada con la actual. **Decides:** si esta dirección es la correcta antes de construir sobre ella.

### Fase 2: Sistema de movimiento (M)

- Titulares que entran línea por línea y textos que se revelan con suavidad.
- Imágenes que aparecen con una máscara y un parallax sutil.
- Transición del navy al marfil ligada al scroll.
- Transiciones entre páginas y cabecera que se oculta al bajar.
- Microinteracciones en botones, enlaces y tarjetas.
- Interruptor visible para **pausar animaciones**, además de respetar la preferencia del sistema.

**Tú pruebas:** la portada completa y una comparación con y sin scroll suave. **Decides:** si la intensidad es la adecuada y si Lenis se queda.

### Fase 3: three.js, tres prototipos y una decisión (L)

Una página de laboratorio, oculta para buscadores, con tres conceptos funcionando en el navegador:

| Concepto | Idea | Ventaja | Riesgo |
|---|---|---|---|
| **A. Monograma vivo (recomendado)** | Dos E en piedra y latón, separadas en la penumbra. Al hacer scroll se entrelazan y la luz las revela. El cursor mueve la luz | Totalmente propio de la marca y memorable | El más exigente en materiales y luz |
| **B. Luz de ventana** | La sombra de hojas del hero actual cobra vida y se mece con la brisa | Muy sereno y ligero | Menos distintivo |
| **C. Cordillera de líneas** | Relieve inspirado en Costa Rica hecho de líneas que ondulan con el cursor | Fuerte arraigo local | Se parece a un recurso muy visto, con menos relación con el derecho de familia |

Después se integra el concepto elegido, con una imagen estática previa que evita esperas y con versión reducida para móvil.

**Tú pruebas:** los tres conceptos en tu computadora y en tu teléfono. **Decides:** cuál se queda o si se combinan.

### Fase 4: Portada completa (M)

- Une la base, el movimiento y el 3D en una sola historia continua.
- Lista de áreas interactiva: al pasar el cursor, el nombre crece y aparece una imagen.
- Proceso en 4 pasos que avanza al hacer scroll, sin secuestrarlo.

**Tú pruebas:** la portada de principio a fin, en varios dispositivos. **Decides:** aprobar la portada como referencia para el resto del sitio.

### Fase 5: Servicios y lectura, la mejora de UX más importante (L)

- **Una estructura por pregunta:** respuesta breve al inicio, luego "¿Qué dice la ley?", "¿Cómo es el trámite?", preguntas frecuentes y fuentes. Sin repeticiones.
- **Índice lateral fijo** y barra de progreso en textos largos.
- **Orientador "¿Por dónde empiezo?":** dos o tres preguntas que llevan al área correcta. No da asesoría ni guarda respuestas. Requiere revisión jurídica.
- **"Salida rápida" en protección familiar:** botón y tecla Esc que llevan de inmediato a un sitio neutro. Es una ayuda de seguridad; se explica que no borra todo el historial.

**Tú pruebas:** encuentra una respuesta concreta, por ejemplo "¿cuánto tiempo tengo para reconocer una unión de hecho?". **Decides:** si esta estructura se aplica a las 9 áreas.

### Fase 6: Blog, formulario y navegación (M)

- Blog editorial con un artículo destacado, filtros y búsqueda local.
- Formulario de consulta paso a paso, una pregunta por pantalla, sin perder la versión sin JavaScript.
- Menú a pantalla completa con imagen por área.
- Sobre Evelyn, contacto y 404 alineados con el nuevo lenguaje.

**Tú pruebas:** completar y enviar una consulta, buscar un artículo y navegar en móvil.

### Fase 7: Pulido y preparación final (M)

- Rendimiento en un dispositivo modesto y ajuste fino de animaciones.
- Pruebas en Safari y Firefox, además de Chrome, y con lector de pantalla.
- Actualización de documentación e informes.
- Lista de preparación para premios.

**Tú pruebas:** recorrido completo en tus dispositivos reales. **Decides:** si queda aprobado para la revisión jurídica final.

## 7. Límites que deben cumplirse en cada fase

| Métrica | Actual | Límite |
|---|---|---|
| LCP, medido en local con red limitada | 1,1 a 1,3 s | 2,5 s o menos |
| CLS | 0 | 0,1 o menos |
| INP | Sin medir | 200 ms o menos |
| JS antes de la interacción, sin three.js | 5 KB sin comprimir | 60 KB gzip o menos |
| three.js en páginas sin 3D | 0 | 0 |
| Fluidez de la escena 3D | No aplica | 60 fps en escritorio, 30 o más en móvil de gama media |
| Pruebas automatizadas | 94 superadas | Sin regresiones |
| Accesibilidad con axe | 0 graves | 0 graves |

**Casos que siempre deben funcionar:** sin WebGL, sin JavaScript, con movimiento reducido, con ahorro de datos y en equipos modestos. En todos, se muestra una imagen estática o una versión reducida.

## 8. Lo que no haremos

- Pantallas de carga largas, cursores personalizados ni sonido.
- Secuestrar el scroll o impedir saltar al contenido.
- Texto que dependa de la animación para poder leerse.
- 3D en páginas de lectura o en páginas sensibles.
- Imágenes con personas que puedan confundirse con Evelyn.

## 9. Decisiones y riesgos

1. **Abandona la fidelidad a la referencia.** El encargo original pedía conservar su estructura, y este plan se aleja de ella a propósito. Además reduce el riesgo por parecido visual que señala la auditoría. Los informes se actualizarán.
2. **Un premio no se puede garantizar.** Awwwards pondera [Diseño 40 %, Usabilidad 30 %, Creatividad 20 % y Contenido 10 %](https://awwwards.com/about-evaluation), y evalúa sitios publicados. El objetivo es alcanzar ese nivel de calidad.
3. **El sitio no se puede postular todavía.** Antes debe estar publicado, y para eso faltan la revisión jurídica, los datos reales y el correo.
4. **Publicidad profesional.** El artículo 30 del Código de Deberes pide moderación y evitar el autoelogio. Un diseño llamativo no lo incumple por sí mismo, pero mostrar insignias de premios en el sitio debería consultarse antes. Los textos nuevos siguen la misma regla.
5. **La fotografía real es el factor externo más importante.** Las imágenes generadas sirven, pero un retrato auténtico daría más cercanía.
6. **El orientador y la salida rápida** deben validarse con una persona abogada y, de ser posible, con especialistas en violencia.
7. **Más complejidad significa más mantenimiento.** three.js y GSAP añaden dependencias que habrá que actualizar.

## 10. Siguiente paso

Aprobar las **Fases 0 y 1**. En cuanto la portada limpia esté lista, la revisas y decides si seguimos. Las demás fases se aprueban una a una.
