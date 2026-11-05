# Inventario del sitio de referencia

**Documento técnico interno. No se publica.** Es el único tipo de archivo donde se conserva el nombre del sitio de referencia, por trazabilidad.

- **URL analizada:** https://www.emilyrubensteinlaw.com/
- **Fecha del reconocimiento:** 4 de noviembre de 2026
- **Método:** `robots.txt`, `sitemap.xml`, HTML público y Playwright (Chrome) a 1440, 768 y 375 px. Se hizo scroll completo para activar contenido diferido y se extrajeron métricas con `getComputedStyle` y `getBoundingClientRect`.
- **Límites respetados:** no se consultaron las rutas excluidas por `robots.txt` (`/search`, `/api/`, `/config`, `?format=json`, etc.) y no se eludió ningún control de acceso.

## 1. Plataforma y dependencias detectadas

| Elemento | Hallazgo |
|---|---|
| Plataforma | Squarespace 7.1 (cabecera `server: Squarespace`, bloques `sqs-block-*`) |
| Tipografías | Adobe Fonts/Typekit: `freight-big-pro` (titulares, peso 300) y `ss-pro` (botones, navegación). Google Fonts: Lato (cuerpo, peso 300) |
| Animaciones globales | `tweak-global-animations-enabled: false`. El original **no** usa revelado al hacer scroll |
| Hosts remotos | `squarespace-cdn`, `assets.squarespace.com`, `static1.squarespace.com`, `use.typekit.net`, `googletagmanager`, `google-analytics`, `maps.googleapis.com`, `google.com/recaptcha`, `player.vimeo.com` |
| Video | Bloque con botón de reproducción y lightbox (Plyr) |
| Formularios | Boletín por correo en el pie. Consulta mediante enlaces a agenda externa. reCAPTCHA Enterprise invisible |

## 2. Rutas descubiertas

El sitemap lista 265 URL: 12 páginas, 87 artículos, 9 categorías y 157 etiquetas.

| Ruta original | Función |
|---|---|
| `/` y `/home` | Portada |
| `/about` | Presentación de la firma y su equipo |
| `/divorce` | Servicio: divorcio |
| `/child-custody-support` | Servicio: custodia y manutención |
| `/prenuptial-agreements` | Servicio: acuerdos prenupciales |
| `/contact` | Contacto |
| `/schedule-a-consultation` | Agendar consulta (tres modalidades) |
| `/schedule-a-consultation-1` | Duplicado de la anterior |
| `/blog` | Biblioteca de recursos |
| `/blog/category/*` | 9 categorías |
| `/blog/tag/*` | 157 etiquetas |
| `/blog/<slug>` | 87 artículos |
| `/privacy-policy`, `/terms-conditions` | Páginas legales |
| `/404-page-not-found` | Error 404 |

**Navegación principal:** tres servicios, About, Blog, Contact y botón de consulta. Teléfono en una franja superior.
**Pie:** logotipo, navegación, redes, dirección, boletín, descargo y barra legal.

## 3. Sistema visual medido (1440 px)

| Elemento | Valor |
|---|---|
| Cabecera | Posición absoluta, 123 px de altura incluida la franja superior de 30 px |
| H1 / H2 / H3 | 52,8 / 41,6 / 28,8 px, serif peso 300 |
| Párrafo | 18,4–19,2 px, interlineado 1,8, sans peso 300 |
| Botón | 12,5 px mayúsculas, relleno 12,5 × 25 px, sin radio, opacidad en hover (0,1 s lineal) |
| Palabras fantasma | Serif gigante de 172–444 px con opacidad muy baja, detrás de los titulares |
| Diagonales | Secciones con borde inferior o superior poligonal asimétrico |
| Línea vertical | Filete de 1 px y unos 100 px que conecta secciones |
| Imagen desplazada | Foto sobre un rectángulo de color con desfase |

## 4. Secciones por página

**Portada (10 506 px).** Hero con imagen y panel azul translúcido (751) · franja de tres valores con diagonal (198) · imagen desplazada y texto (635) · marquesina de insignias (215) · banda de video y palabra fantasma, servicios, tres tarjetas verticales (1625) · "Who we work with" en tres columnas (405) · enfoque con "Read more" y palabra fantasma (981) · testimonios en carrusel (781) · proceso de tres pasos con imagen (1677) · marquesina de medios (215) · mapa y zonas con palabra fantasma (670) · tres artículos (919) · CTA con imagen azul y diagonal (594) · pie (798).

**Servicio (`/divorce`, 9729 px).** Hero con retrato y panel gris (829) · problema y lista con imagen desplazada (774) · cita en banda azul con flechas (585) · acordeones "Read more" (1333) · imagen y lista a dos columnas sobre gris (697) · proceso (1419) · imagen, panel blanco y lista (1187) · marquesina (215) · artículos (821) · CTA · pie.

**About (7942 px).** Hero azul centrado (594) · tres cifras (296) · imagen y lista con "Read more" (912) · marquesina (215) · perfiles del equipo (2029) · marquesina · testimonios (836) · imágenes (569) · artículos (820) · CTA · pie.

**Contacto (1710 px).** Panel gris y título sobre imagen · texto y dirección · CTA · pie.

**Agendar (3743 px).** Hero con imagen desplazada · "Take the first step" · tres tarjetas · "Let's talk" con palabra fantasma · franja "Need helpful resources?" · pie.

**Blog (9808 px).** Hero azul con accesos por tema · "Popular reads" con palabra gigante · secciones por categoría, en cuadrículas de cuatro con fondos alternos.

**Artículo.** Categoría y fecha · H1 centrado · imagen ancha · cuerpo con H2 · botón CTA.

**404.** Imagen desplazada y texto · carrusel de artículos · pie.

**Legales.** Texto largo en una columna.

## 5. Interacciones observadas

- Menú móvil a pantalla completa con fundido (`opacity .4s`, `visibility .6s`, `cubic-bezier(.4,0,.2,1)`).
- Hamburguesa que se transforma en cierre.
- Marquesinas continuas (`logo-anim`).
- Carruseles con flechas (citas, testimonios, artículos del 404).
- Acordeones "Read more +".
- Lightbox de video.
- Hover por opacidad en botones.
- Subrayado de la página activa en la navegación.

## 6. Estrategia de reconstrucción

Se reconstruye la **composición** (retícula, proporciones, ritmo, jerarquía e interacciones) con código nuevo.

**No se descargan ni reutilizan** el HTML, CSS y JS de Squarespace, las fotografías, los logotipos, los testimonios, las insignias ni las fuentes de Adobe, porque no consta autorización de uso. Solo se conservan capturas como referencia interna en `docs/reference/`, fuera de `public/`.

| Recurso original | Sustitución |
|---|---|
| Fotografías | Imágenes originales generadas por código (`scripts/generate-art.mjs`) |
| Retrato profesional | Panel con monograma, hasta contar con una fotografía auténtica y autorizada |
| Freight Big / ss-pro / Lato | Cormorant Garamond, Manrope e Inter (licencia OFL, alojadas localmente) |
| Insignias y logos de medios | Marquesinas de principios y de normativa costarricense |
| Testimonios | Carrusel de principios de atención |
| Cifras de experiencia | Tres compromisos sin datos numéricos |
| Video | Banda con botón que abre un diálogo con texto, sin simular un video |
| Google Maps | Mapa vectorial de Costa Rica sin servicios remotos |
| reCAPTCHA | Campo trampa, control de tiempo y límite de solicitudes en el servidor |

## 7. Mapa de equivalencias

| Original | Equivalente | Nota |
|---|---|---|
| `/` | `/` | |
| `/home` | `/` | Alias, se redirige |
| `/about` | `/sobre-evelyn` | Sin biografía hasta confirmar datos |
| `/divorce` | `/servicios/divorcios` | Código de Familia, art. 48 y siguientes |
| `/child-custody-support` | `/servicios/guarda-crianza`, `/servicios/interrelacion-familiar`, `/servicios/pensiones-alimentarias` | Se separan porque en Costa Rica son institutos distintos |
| `/prenuptial-agreements` | `/servicios/acuerdos-familiares` | Capitulaciones matrimoniales, no *prenups* |
| — | `/servicios/bienes-gananciales`, `/servicios/union-de-hecho`, `/servicios/filiacion-paternidad`, `/servicios/proteccion-familiar` | Nuevas, solicitadas en el encargo |
| — | `/servicios` | Índice necesario por haber 9 áreas |
| `/contact` | `/contacto` | Sin datos de contacto hasta confirmarlos |
| `/schedule-a-consultation` | `/agendar-consulta` | Formulario real; sin precios ni duraciones inventadas |
| `/schedule-a-consultation-1` | `/agendar-consulta` | **Excluida:** duplicado |
| `/blog` | `/blog` | |
| `/blog/category/*` | `/blog/categoria/*` | Categorías adaptadas |
| `/blog/tag/*` | `/blog/etiqueta/*` | Etiquetas adaptadas |
| `/blog/<slug>` | `/blog/<slug>` | 15 artículos originales |
| `/privacy-policy` | `/politica-de-privacidad` | Ley 8968 |
| `/terms-conditions` | `/aviso-juridico` | |
| `/404-page-not-found` | `/404` | |

## 8. Exclusiones de contenido

Los 87 artículos originales **no** se traducen ni se adaptan uno a uno. Se excluyen por no tener equivalente correcto o por ser contenido protegido:

- **Derecho de California:** *community property*, *date of separation*, *Family Code*, *private judge*, *ATRO*.
- **Noticias propias de la firma:** premios, apariciones en medios, eventos.
- **Casos de celebridades y noticias de coyuntura.**
- ***Spousal support* como categoría:** se aborda dentro de divorcios y pensiones, según el Código de Familia.
- **157 etiquetas:** muchas son variantes geográficas o duplicados por mayúsculas.

Se sustituyen por los 15 temas costarricenses definidos en el encargo.
