# Auditoría de identidad

**Fecha:** 4 de noviembre de 2026.

## Logotipo y versiones

| Requisito | Estado | Archivo |
|---|---|---|
| Horizontal | Hecho | `evelyn-elizondo-horizontal.svg` |
| Vertical | Hecho | `evelyn-elizondo-vertical.svg` |
| Monograma independiente | Hecho | `evelyn-elizondo-monogram.svg` |
| Monocromática | Hecho | `evelyn-elizondo-mono.svg`, `-mono-white.svg`, `-monogram-mono.svg` |
| Fondo oscuro | Hecho | `evelyn-elizondo-dark.svg`, `-vertical-dark.svg` |
| Fondo claro | Hecho | `evelyn-elizondo-light.svg` |
| Favicon | Hecho | `favicon.svg`, `favicon.ico` |
| Icono móvil | Hecho | `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| Navbar | Hecho | `evelyn-elizondo-navbar.svg` |
| Footer | Hecho | `evelyn-elizondo-footer.svg` |
| PNG y WebP | Hecho | Horizontal, vertical, monograma y oscura |

**Vectorial:** todos los SVG contienen trazos `<path>`, sin imágenes incrustadas. Los textos se convirtieron a curvas con Cormorant Garamond (OFL).

**Concepto:** dos E enfrentadas con brazos alternos. No usa mazos, balanzas ni monogramas del sitio de referencia. Tampoco tiene elementos en común con la ligadura del logotipo original.

**No verificado:** no se hizo búsqueda de marcas ni de anterioridades. El registro es decisión de la persona titular.

## Colores

Se aplicó la paleta sugerida mediante tokens en `:root`. Ajustes:

| Token añadido | HEX | Motivo |
|---|---|---|
| `--color-accent-text` | `#7A6232` | Texto dorado con contraste suficiente sobre claro |
| `--color-accent-soft` | `#E8DFCC` | Rectángulo detrás de imágenes |
| Rojo de error | `#A12D2D` | Mensajes de formulario. Está en el CSS, fuera de los tokens |
| Superposiciones | Tokens `--overlay-*`, `--shadow-on-image` | Transparencias |

Algunas superposiciones y un degradado de las tarjetas siguen con valores RGB directos en el CSS, derivados del navy.

## Tipografía

| Rol | Original | Sustituta | Licencia |
|---|---|---|---|
| Titulares | Freight Big Pro | Cormorant Garamond | OFL |
| Texto | Lato | Inter | OFL |
| Interfaz | SS Pro | Manrope | OFL |

Se alojan en `public/assets/fonts`. No hay solicitudes a Google Fonts ni a Adobe. Solo se incluye el subconjunto latino.

## Imágenes

Todas son originales y generadas por `scripts/generate-art.mjs` con un renderizador 3D propio. **No aparece ninguna persona** ni se usan fotografías de terceros.

| Recurso original | Reemplazo |
|---|---|
| Fotos de la abogada y del equipo | Arquitectura, luz y objetos; monograma en "Sobre Evelyn" |
| Fotos de stock | 20 composiciones y 15 miniaturas |
| Insignias de premios | Marquesina de principios |
| Logos de medios | Marquesina de normativa costarricense |
| Google Maps | `mapa-costa-rica.svg`, a partir de Natural Earth (dominio público) mediante `world-atlas` |
| Video | Diálogo de texto, sin simular reproducción |

**Limitación honesta:** son imágenes de estética fotográfica, pero sintéticas. Una marca personal se beneficiaría de fotografía real de Evelyn Elizondo cuando exista.

## Elementos corporativos

Cubiertos: textos, navegación, formularios, pie, títulos, descripciones, Open Graph, Twitter Cards, datos estructurados, favicon, manifiesto, textos alternativos, acuses de correo y `package.json`.

Las redes sociales del original se eliminaron del pie porque no hay perfiles confirmados.

## Revisión de menciones antiguas

Comando: `npm run audit:identity`. Se analizan `src`, `public`, `dist`, `tests`, la configuración y el README.

**Resultado: 216 archivos de texto revisados y 0 coincidencias** para Emily, Rubenstein, ERL, Los Ángeles, Beverly Hills, California, Wilshire, Squarespace, Typekit, Freight Big, Hoffbeck, Google Fonts, Google Analytics, reCAPTCHA, Vimeo y datos de contacto anteriores.

Las menciones restantes están solo en `docs/`, como trazabilidad interna.

**Limitación:** la búsqueda es de texto. Las imágenes y fuentes binarias no se analizan, pero todas se generaron en este proyecto o proceden de paquetes de fuentes abiertas.

**Referencia a *community property*:** el texto aparece en `bienes-gananciales.md` y `*prenuptial agreement*` en `acuerdos-familiares.md`, solo para advertir que esas figuras extranjeras no aplican.

## Favicon y metadatos

- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` y `manifest.webmanifest` están enlazados en `src/layouts/Base.astro`.
- `og-default.jpg` de 1200 × 630.
- `lang="es-CR"` y `og:locale=es_CR`.
- Títulos y descripciones únicos en las páginas principales, comprobado por pruebas automáticas.
- `LegalService` solo con nombre, descripción, URL, logotipo, país e idioma. Sin dirección ni teléfono mientras no se configuren.
