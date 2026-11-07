// Contenido editorial de cada propuesta: concepto, paleta, tipografía, medidas y evaluación.
export const DATOS = {
  a: {
    nombre: 'Nexo', sub: 'Monograma editorial de lujo',
    idea: 'Una E recta y una E cursiva, apoyadas sin tocarse.',
    concepto: [
      'La redonda es la norma: vertical, estable, de asta gruesa. La cursiva es la mano: la persona que escribe, firma y se inclina. Las dos comparten altura y filete. Se acercan por la base y se abren hacia arriba.',
      'Esa distancia es la idea: dos personas vinculadas que siguen siendo dos. Ningún brazo toca a la otra letra, y la inclinación de 12° da movimiento sin perder autoridad.',
      'Conversa con el titular del sitio, que ya alterna redonda y cursiva en «Derecho de familia en <em>Costa Rica</em>».',
    ],
    paleta: [['Ciruela tinta', '#2A1826', 'Texto, fondos institucionales, monograma'], ['Latón', '#94774B', 'E cursiva y acentos sobre claro'], ['Latón claro', '#BFA374', 'E cursiva y acentos sobre oscuro'], ['Latón de texto', '#7A5F36', 'Lema y texto pequeño sobre claro'], ['Hueso', '#F1ECE3', 'Fondos de sección, texto sobre oscuro'], ['Papel', '#FAF7F2', 'Papelería'], ['Malva gris', '#6B6068', 'Texto secundario']],
    fuentes: [['Bodoni Moda', 'Titulares y logotipo. Versales espaciadas; cursiva para el lema.', 'BodoniModa.ttf', 'BodoniModa-OFL.txt', 'Copyright 2020 The Bodoni Moda Project Authors', "'G-A'", 'EVELYN ELIZONDO'], ['Instrument Sans', 'Texto corrido, navegación y datos de contacto.', 'InstrumentSans.ttf', 'InstrumentSans-OFL.txt', 'Copyright 2022 The Instrument Sans Project Authors', "'G-B'", 'Divorcio, alimentos, guarda y crianza']],
    fuenteTit: 'BodoniModa.ttf', fuenteCur: 'BodoniModa-Italic.ttf', fuenteTxt: 'InstrumentSans.ttf',
    min: [['Horizontal con lema', '270 px / 72 mm de ancho', 'logos/svg/principal-horizontal-claro.svg', 'width:270px'], ['Nombre sin lema (cabecera)', '170 px / 45 mm de ancho', 'aplicaciones/cabecera-claro.svg', 'width:170px'], ['Compacta con lema', '170 px / 45 mm de ancho', 'logos/svg/compacta-vertical-claro.svg', 'width:170px'], ['Isotipo', '48 px / 13 mm de alto', 'logos/svg/isotipo-claro.svg', 'height:48px'], ['Isotipo reducido', '16–48 px: filetes más gruesos, sin remates', 'logos/svg/isotipo-reducido-claro.svg', 'height:16px']],
    proteccion: 'El aire mínimo equivale a un cuarto de la altura del monograma, en los cuatro lados.',
    patron: 'Astas inclinadas a 12°, en la inclinación exacta de la cursiva y alternando los dos pesos del monograma.',
    riesgos: ['Mientras el sitio siga en navy, el latón de este símbolo repite el par azul y oro del sector: el cambio de marca solo se completa al cambiar la paleta.', 'Bodoni tiene filetes delicados: en impresión de baja calidad use siempre la versión de cabecera, más firme. En titulares web debe fijarse un tamaño óptico bajo (opsz 20): con el automático, los filetes casi desaparecen.', 'El monograma EE admite muchas soluciones parecidas en el mercado. Se debe comprobar en una búsqueda de marcas por clase 45.'],
  },
  b: {
    nombre: 'Hebras', sub: 'Raíces, vínculos y crecimiento',
    idea: 'Tres líneas paralelas pasan de un centro a otro sin cruzarse nunca.',
    concepto: [
      'Dos sistemas de anillos de crecimiento, como los de un tronco cortado, quedan unidos por tres hebras. En botánica, la inosculación es el fenómeno por el que dos ramas o troncos crecen juntos y se unen.',
      'Las tres hebras cambian de posición sin cruzarse: la que es exterior en la copa llega a ser interior en la raíz, y al revés. Esa es la lectura sobre la transformación de una familia, sin decir cómo debe terminar.',
      'Sube en diagonal, con un lazo mayor arriba y otro menor abajo, igual que la copa ancha y la base del árbol del sitio. La regla es geométrica: solo arcos de circunferencia, sin árboles, manos, corazones ni siluetas.',
    ],
    paleta: [['Musgo', '#1D3128', 'Texto, fondos institucionales, hebras exteriores'], ['Arcilla', '#B5623D', 'Hebra central y acentos sobre claro'], ['Arcilla clara', '#D98A64', 'Hebra central y acentos sobre oscuro'], ['Arcilla de texto', '#8A4628', 'Lema y texto pequeño sobre claro'], ['Lino', '#F3EEE4', 'Fondos de sección, texto sobre oscuro'], ['Papel', '#FAF7F0', 'Papelería'], ['Salvia gris', '#5F6A62', 'Texto secundario']],
    fuentes: [['Tenor Sans', 'Titulares y logotipo. Humanista con contraste, en alta y baja. Una sola variante: sin cursiva ni negrita.', 'TenorSans.ttf', 'TenorSans-OFL.txt', 'Copyright (c) 2011, Denis Masharov. Nombre reservado: «Tenor», «Tenor Sans»', "'G-A'", 'Evelyn Elizondo'], ['Hanken Grotesk', 'Texto corrido, lema, navegación y datos.', 'HankenGrotesk.ttf', 'HankenGrotesk-OFL.txt', 'Copyright 2021 The Hanken Grotesk Project Authors', "'G-B'", 'Divorcio, alimentos, guarda y crianza']],
    fuenteTit: 'TenorSans.ttf', fuenteCur: 'TenorSans.ttf', fuenteTxt: 'HankenGrotesk.ttf',
    min: [['Horizontal con lema', '270 px / 72 mm de ancho', 'logos/svg/principal-horizontal-claro.svg', 'width:270px'], ['Nombre sin lema (cabecera)', '150 px / 40 mm de ancho', 'aplicaciones/cabecera-claro.svg', 'width:150px'], ['Compacta con lema', '150 px / 40 mm de ancho', 'logos/svg/compacta-vertical-claro.svg', 'width:150px'], ['Isotipo de 3 hebras', '40 px / 11 mm de alto', 'logos/svg/isotipo-claro.svg', 'height:40px'], ['Isotipo reducido', '20–40 px: 2 hebras. A 16 px, el favicon usa 1 hebra', 'logos/svg/isotipo-reducido-claro.svg', 'height:20px']],
    proteccion: 'El aire mínimo equivale a un cuarto de la altura del símbolo, en los cuatro lados.',
    patron: 'Repetición del lazo como guarda de papel, siempre con poco contraste sobre el fondo.',
    riesgos: ['Tres hebras se empastan por debajo de 40 px; ahí se usa el dibujo de dos, y a 16 px el de una.', 'No remite a la E. Según quien lo mire, puede leerse como una S, un 8 o un ampersand, y en una pestaña del navegador como una cadena o un icono de enlace: esa lectura es incómoda en este campo y hay que probarla.', 'Un lazo continuo puede sugerir permanencia. Para quien sale de una relación violenta esa lectura no es neutra: conviene probarlo con personas ajenas al proyecto.', 'La búsqueda encontró una marca registrada en EE. UU. por una firma de abogados de Nueva York (Outten &amp; Golden LLP, n.º de serie 99079591, clases 41 y 45), descrita como figuras en ocho entrelazadas. Su dibujo es un ampersand de un solo trazo con cruces, y este son tres líneas paralelas que no se cruzan: las formas difieren, pero comparten la idea del lazo y el sector. Es otra jurisdicción y esto no es un dictamen: una persona especialista debe compararlas antes de adoptar esta propuesta.'],
  },
  c: {
    nombre: 'Rúbrica', sub: 'Identidad tipográfica de autor',
    idea: 'El nombre firmado: la Y baja y su trazo subraya el apellido.',
    concepto: [
      'Según el Diccionario de la lengua española, rúbrica es el rasgo que suele ponerse en la firma después del nombre, y la palabra viene del latín <em>rubrīca</em>, derivado de <em>ruber</em>, «rojo». Por eso aquí la Y de Evelyn pierde su remate, baja y corre en rojo bajo el apellido.',
      'La letra es Ibarra Real Nova, reconstrucción de los tipos de Gerónimo Gil para el Quijote de la Real Academia, impreso por Joaquín Ibarra en 1780. Da a la marca una raíz en la historia del libro en español.',
      'La versión compacta usa una observación del propio nombre: EVELYN y ELIZONDO empiezan por E. Las dos palabras se alinean en esa inicial, y la rúbrica ocupa el hueco que deja la palabra más corta.',
    ],
    paleta: [['Negro de imprenta', '#1B1916', 'Nombre, texto, fondos institucionales'], ['Rúbrica', '#B5301C', 'Trazo de la rúbrica, marco y acentos sobre claro'], ['Rúbrica clara', '#E2583F', 'Trazo de la rúbrica sobre oscuro'], ['Papel', '#F7F3EA', 'Fondos de sección, texto sobre oscuro'], ['Papel de carta', '#FBF8F1', 'Papelería'], ['Plomo', '#68635B', 'Texto secundario']],
    fuentes: [['Ibarra Real Nova', 'Titulares, logotipo y lema en cursiva.', 'IbarraRealNova.ttf', 'IbarraRealNova-OFL.txt', 'Copyright 2007 The Ibarra Real Nova Project Authors', "'G-A'", 'Evelyn Elizondo'], ['Source Serif 4', 'Texto corrido y navegación. Una serif pensada para leer en pantalla.', 'SourceSerif4.ttf', 'SourceSerif4-OFL.txt', 'Copyright 2014 The Source Serif 4 Project Authors', "'G-B'", 'Divorcio, alimentos, guarda y crianza']],
    fuenteTit: 'IbarraRealNova.ttf', fuenteCur: 'IbarraRealNova-Italic.ttf', fuenteTxt: 'SourceSerif4.ttf',
    min: [['Horizontal con lema', '270 px / 72 mm de ancho', 'logos/svg/principal-horizontal-claro.svg', 'width:270px'], ['Nombre sin lema (cabecera)', '180 px / 48 mm de ancho', 'aplicaciones/cabecera-claro.svg', 'width:180px'], ['Compacta con lema', '170 px / 45 mm de ancho', 'logos/svg/compacta-vertical-claro.svg', 'width:170px'], ['Isotipo con rúbrica', '32 px / 9 mm de alto', 'logos/svg/isotipo-claro.svg', 'height:32px'], ['Isotipo reducido', '20–32 px: más peso. A 16 px, el favicon va sin rúbrica', 'logos/svg/isotipo-reducido-claro.svg', 'height:20px']],
    proteccion: 'El aire mínimo equivale a la altura de la E inicial, en los cuatro lados.',
    patron: 'Guarda de libro: la E capitular en retícula alterna, como las guardas de una edición antigua.',
    riesgos: ['La marca es el nombre: por debajo de 180 px, la rúbrica se vuelve demasiado fina. A 16 px el favicon es solo una E.', 'Se probó una versión en la que una sola E alojaba VELYN y LIZONDO. Se retiró: se leía «IVELYN / ILIZONDO». No debe recuperarse como logotipo.', 'El rojo no sirve para fondos de texto largo. También puede evocar urgencia: debe usarse como trazo, no como superficie, salvo en piezas puntuales.'],
  },
};
// Puntuación de 1 a 5. Es un juicio razonado del autor de las propuestas, no una prueba con personas.
export const CRITERIOS = [
  ['Originalidad', { a: [4, 'La idea redonda + cursiva es propia, aunque el campo de los monogramas EE está muy poblado. Sin comparación exhaustiva.'], b: [3, 'Sin comparación exhaustiva; existe una marca con una idea cercana en clase 45 (serie 99079591).'], c: [4, 'El gesto de la Y y la alineación en la E nacen de este nombre.'] }],
  ['Legibilidad', { a: [4, 'EE se lee desde 16 px con el dibujo reducido. Los filetes del nombre piden tamaño.'], b: [5, 'Nombre en alta y baja, lo más legible de las tres. Solo mide el nombre: el símbolo no contiene letras.'], c: [4, 'Se lee bien en línea y en bloque. La versalita pide tamaño.'] }],
  ['Memorabilidad', { a: [4, 'La inclinación es reconocible. Memoria sin probar.'], b: [4, 'Fácil de describir como lazo. Memoria sin probar.'], c: [4, 'La línea roja es fácil de describir. Memoria sin probar.'] }],
  ['Coherencia con Derecho de Familia', { a: [4, 'Dos que se acercan sin confundirse; sobrio ante temas duros.'], b: [3, 'Habla de transformación, pero el lazo o la cadena pueden leerse como atadura o permanencia.'], c: [4, 'La firma remite a documentos y acuerdos; es menos cálida.'] }],
  ['Sofisticación', { a: [4, 'Editorial y contenida; con el nuevo dibujo gana claridad y se acerca al art déco.'], b: [4, 'Moderna y serena. Corre más riesgo de parecer de bienestar.'], c: [5, 'Oficio tipográfico visible.'] }],
  ['Tamaños pequeños', { a: [4, 'El dibujo reducido se lee como EE a 16 px. Por debajo de 48 px hay que usarlo.'], b: [3, 'Necesita tres dibujos: 3, 2 y 1 hebras.'], c: [3, 'A 16 px solo queda una E, sin rúbrica. El nombre pide 180 px.'] }],
  ['Integración con el sitio', { a: [4, 'Repite el juego redonda y cursiva del titular. Sobre navy, repite también el par azul y oro.'], b: [4, 'Dialoga con el árbol, pero su mejor versión pide cambiar la paleta.'], c: [4, 'Convive bien; Newsreader e Ibarra son dos serif muy cercanas.'] }],
  ['Viabilidad técnica y licencias', { a: [5, 'OFL; logotipo en trazos.'], b: [5, 'OFL; símbolo sin fuente alguna, solo arcos.'], c: [5, 'OFL; logotipo en trazos.'] }],
];
