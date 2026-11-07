# Auditoría, investigación y evaluación de herramientas

Fecha: 6 de noviembre de 2026.

## 1. branding-mcp

**Veredicto: sirve solo como punto de partida. Sus logotipos se descartan.**

| Aspecto | Hallazgo |
|---|---|
| Estado | Repositorio archivado (solo lectura) el 21 de abril de 2026. No recibirá parches. |
| Licencia | MIT. |
| Paquete evaluado | `@forgespace/branding-mcp@0.56.0`, firma de registro verificada con `npm audit signatures`. |
| Revisión del código | Sin `child_process`, `eval`, `fetch` ni escritura de archivos en `dist`. La única salida posible es el cliente de Anthropic si se define `ANTHROPIC_API_KEY`. |
| Dependencias | `npm audit`: 3 avisos (2 altos, 1 moderado), por `zod` (consumo de memoria con entradas enormes) y `@anthropic-ai/sdk` (permisos de la herramienta de memoria). No hay arreglo sin bajar de versión. Riesgo bajo en este uso local, pero real y sin parche futuro. |
| Ejecución | Instalado fijado, con `--ignore-scripts`, fuera del proyecto. Arrancó con entorno vacío, sin clave y sin red (`unshare -rn`). Respondió 58 herramientas. Se le habló por stdio, sin registrarlo en la configuración de Claude, así que no hizo falta reiniciar la sesión. |
| Inconsistencias | El servidor se identifica como 0.55.3 siendo el paquete 0.56.0. La descripción de GitHub dice 7 herramientas; son 58. |
| Calidad de los logotipos | Un círculo con la inicial y `<text>` vivo en la fuente elegida: dependen de que la fuente esté instalada. Los resultados están en `comparativa/punto-de-partida-mcp/`. |

**Qué se aprovechó.** El generador de identidad para contrastar las paletas de partida. Propuso Playfair Display, Raleway y Lora: se descartaron por ser muy habituales. Sus tonos base coincidieron con los introducidos (ciruela, musgo, rojo), pero los secundarios no servían: colores casi iguales entre sí en la paleta oscura. Se rehicieron a mano y se comprobaron con la validación propia. 

**Validación final con la herramienta** (`validacion-branding-mcp.json`). C obtiene 100/100. A y B obtienen 80/100 con un error: su acento no llega a 4,5:1 sobre blanco ni sobre oscuro. Se dejó así a propósito: ese acento solo se usa en gráficos y texto grande (mínimo 3:1, cumplido), y cada paleta tiene un tono aparte para texto pequeño, que sí cumple 4,5:1. La herramienta no contempla esa distinción. Se informa el resultado tal como salió.

## 2. Alternativas

**LogoLoom (`@mcpware/logoloom@1.0.1`, MIT, activo).** Es la opción más cercana: admite que el diseño lo escribe el asistente y aporta `text_to_path`, `optimize_svg` y `export_brand_kit`. Se instaló aislado y se leyó, pero no se ejecutó, por dos motivos:

- `npm audit` da 2 avisos altos sin arreglo disponible, por `sharp` y sus bibliotecas gráficas.
- `image_to_svg` construye comandos de shell uniendo rutas (`execSync`) y puede descargar paquetes con `npx -y`.

Otras: brandkit (parte de un SVG ya hecho), brandsystem-mcp (extrae marcas existentes) y Zoviz (servicio en la nube, de pago y que recibiría los datos).

**Decisión.** Solo se ejecutó branding-mcp; el resto se descartó por revisión del código, por alcance o por ser un servicio externo. Se usaron directamente los componentes que importan, fijados y sin scripts de instalación: `fontkit` (fuentes variables a trazos), `paper` (booleanas y geometría), `svgo` 4.1.0 (optimización) y Chrome (PNG). `npm audit` en `_fuente/`: 0 vulnerabilidades. El dibujo se hizo a mano por código, en `_fuente/marcas.mjs`.

## 3. Auditoría de la identidad actual

Se conserva intacta en `public/assets/brand/`.

**Lo que funciona:**
- Vectores reales y un sistema de variantes ordenado.
- Ausencia de balanzas, mazos y columnas.
- Contraste alto entre asta y filete, coherente con un tono editorial.
- Nombre en versales, legible en la cabecera.

**Lo que debe mejorar:**
- Los filetes miden 2,9/100 del monograma: a 32 px se empastan y a 16 px desaparecen. Por eso el favicon ya usa otro dibujo.
- Las dos E enfrentadas y desplazadas se leen antes como un plano, una puerta o un corchete que como una firma.
- Navy con oro es la combinación más común del sector. White & Case abandonó justamente el azul marino en su cambio de marca, según Creative Boom.
- El símbolo no conversa con nada del sitio: ni con el árbol ni con el titular.

**Tipografía del sitio:** Newsreader e IBM Plex Sans, ambas OFL. El titular alterna redonda y cursiva, y ese recurso es lo más propio del sitio. La propuesta A nace de ahí.

## 4. Referencias y clichés

Consultadas como orientación y sin reproducir nada: White & Case por Uncommon (tipografía cinética, fuera el azul marino), Maddocks por Truly Deeply (un monograma con origen en una historia propia de la firma) y Brady Law (monograma legible en pequeño).

**Clichés evitados:** balanza, mazo, columna, libro y escudo, y en Derecho de Familia, manos entrelazadas, corazones, siluetas de familia y árboles de catálogo. Navy con oro se evita en las paletas propias, pero A sobre el navy actual del sitio lo repite mientras la paleta no cambie.

**Tópicos del propio campo que también se evitaron:** monograma dentro de un círculo fino (es lo que genera branding-mcp para «elegante») y Playfair Display. El nombre de A usa Bodoni Moda con interletraje manual, sin redibujar sus letras; el monograma sí está dibujado a mano.

## 5. Similitudes

Se hicieron búsquedas web y se revisó una marca concreta. **No es una búsqueda de anterioridades ni autoriza ningún registro.** No se consultó el Registro Nacional de Costa Rica ni el buscador de la USPTO por códigos de diseño.

- **B · Hebras:** Outten & Golden LLP (Nueva York) tiene registrada en EE. UU., n.º de serie 99079591, clases 41 y 45, una marca descrita como figuras en ocho entrelazadas. El dibujo oficial es un ampersand de un solo trazo con cruces; B son tres líneas paralelas sin cruces. Las formas difieren, pero conviene que una persona especialista lo valore.
- **A · Nexo:** no apareció un monograma igual. La búsqueda fue limitada y el campo de las EE es amplio.
- **C · Rúbrica:** el nombre y su trazo son propios del caso. La búsqueda no encontró un equivalente, pero tampoco se hizo una comparación visual exhaustiva.

## 6. Ciclos de crítica

| Ciclo | A · Nexo | B · Hebras | C · Rúbrica |
|---|---|---|---|
| 1. Bocetos | De 7 monogramas queda redonda + cursiva. Se descartan E anidada, escalón, contracambio, uncial y otros. | De 8 símbolos, se descartan árboles literales (B1, B3, B8) y B4 por leerse como F. | De 8 fuentes queda Ibarra Real Nova. Capitular demasiado pesada. |
| 2. Redibujo | Bodoni daba filetes invisibles: se redibuja a mano. El brazo medio parecía una cruz: se corrige. | Las hebras se cruzaban: se rehacen tangentes, con arcos exactos. Se leía como una S: se prueban 18 orientaciones. | La O chocaba con el marco y un brazo engordaba: se redibuja y se justifican los nombres. La cola de la E pesaba: se adelgaza. |
| 3. Aplicación | Nombre débil en la cabecera: más peso y menos tamaño óptico. Datos de tarjeta a 5 pt: se suben a 6,5 pt o más. | Igual en la tarjeta. Banda navy en la simulación de paleta: se corrige. | Igual en la tarjeta y la hoja. |
| 4. Crítica independiente | Se leía «FE» porque el brazo inferior medía la mitad del superior, y a 16 px la segunda E se perdía. Brazos igualados, remates de una sola regla, dibujo reducido con más aire, interletraje manual. | Los extremos chocaban y había una espina en el centro. Lazos con aire uniforme, agujeros redondos, favicon de 1 hebra a 16 px. Se retiró «nada se rompe», que sonaba a promesa. | El marco se leía «IVELYN / ILIZONDO»: **se retiró** y se sustituyó por un bloque con el nombre completo. Junta limpia de la rúbrica, trazo más firme en la cabecera. |

Esa cuarta ronda la hizo un revisor que no participó en el diseño. También corrigió la evaluación: varias notas de 5 no tenían respaldo y se bajaron. Lo que señaló y queda sin resolver: las lecturas de S y de cadena en B, que solo una prueba con personas puede medir.

## 7. Fuentes consultadas

- [Forge-Space/branding-mcp](https://github.com/Forge-Space/branding-mcp) y [mcpware/logoloom](https://github.com/mcpware/logoloom)
- [Creative Boom sobre White & Case](https://www.creativeboom.com/work/this-rebrand-ditches-every-law-firm-cliche-as-white-case-loses-the-navy-blue/), [Truly Deeply sobre Maddocks](https://www.trulydeeply.com.au/2026/08/maddocks-rebrand-140-years-of-modern-spirit-given-form/)
- [Ibarra Real, repositorio](https://github.com/googlefonts/ibarrareal/) y [anuncio en CTAN](https://www.ctan.org/ctan-ann/id/mailman.12.1594586720.19539.ctan-ann@ctan.org)
- [DLE, «rúbrica»](https://dle.rae.es/rubrica)
- [Marca 99079591](https://trademarkregistration.app/Trademark/Details/99079591), con dibujo en [USPTO TSDR](https://tsdr.uspto.gov/statusview/sn99079591)
