# Guía editorial

Se aplica a todo el texto público del sitio. Si una regla choca con la precisión jurídica, gana la precisión.

## Voz y tono
- **Trato:** «usted». Sin tuteo ni voseo.
- **Persona:** impersonal o tercera persona. No usar «brindamos», «nuestro equipo» ni «le acompañamos»: no consta que haya un equipo. Si hace falta nombrar a quien presta el servicio, se escribe «Evelyn Elizondo».
- **Registro:** sobrio, concreto y sin adornos. Primero la respuesta, después la explicación y al final las excepciones.
- **Autoelogio:** ninguno. El artículo 30 del Código de Deberes pide moderación y evitar el autoelogio. La autoridad se demuestra explicando bien, no afirmándola.
- **Promesas:** ninguna sobre resultados, plazos o costos.

## Frases prohibidas
«Te acompañamos en cada paso», «cada familia es única», «soluciones legales a tu medida», «nuestro compromiso es tu tranquilidad», «protegemos lo que más importa», «atención integral y personalizada», «soluciones integrales», «velar por tus derechos», «estamos aquí para», «cada caso es distinto» (o «cada caso es único») como cierre vacío, «más que un trámite», «no está solo/a».

También se evita:
- introducciones que anuncian lo que viene sin decir nada;
- preguntas frecuentes que repiten un párrafo de la misma página;
- párrafos escritos para alcanzar una extensión;
- recursos repetidos de texto generado: tríos de adjetivos, «no es X, sino Y», «en definitiva», «en resumen», «es importante destacar», cierres motivacionales y metáforas sobre caminos o procesos difíciles.

**Inaceptable:** «Le acompañamos durante su divorcio con empatía y profesionalismo».

**Aceptable:** «Un divorcio obliga a decidir sobre bienes, alimentos y el cuidado de los hijos. Lo que se firme en un convenio puede ser difícil de reabrir después, salvo lo relativo a personas menores de edad».

## Terminología
Se usa el término de la norma vigente y, si ayuda, se aclara el coloquial una vez.
- «Persona menor de edad», sin perjuicio de «hijas e hijos» en lenguaje corriente.
- «Atributos de la responsabilidad parental» donde el Código de Familia reformado lo diga. «Patria potestad» solo como aclaración.
- «Guarda, crianza y educación», «interrelación familiar» (no «visitas», salvo aclaración).
- «Autoridad judicial» o «persona juzgadora». «Proceso resolutivo familiar» y otros nombres procesales tal como figuran en el Código Procesal de Familia.
- «Ley N.º 10650», «artículo 48 del Código de Familia». Nunca «la ley dice» sin indicar cuál.

## Reglas jurídicas
1. Toda afirmación jurídica material se comprueba leyendo el artículo en la copia oficial (`docs/auditoria-evelyn/normas/`) y se registra en la matriz.
2. Distinguir: derecho vigente, norma con vigencia futura, derecho histórico, jurisprudencia, criterio administrativo y proyecto de ley. Un proyecto nunca se presenta como ley. El expediente 23.982 es proyecto mientras no conste su publicación como ley.
3. Se cita jurisprudencia solo si el texto se leyó o si aparece en una nota oficial de SINALEVI, y se dice de dónde sale. Nunca se inventa número ni fecha.
4. Si algo no se puede verificar, se retira o se redacta como lo que es: una duda que requiere análisis. No se formula de manera categórica.
5. Se incluyen condiciones y excepciones. Se evitan «siempre», «nunca» y «automáticamente» salvo que la norma lo diga.
6. La Ley 7654 está derogada: no se presenta como régimen actual. Solo se menciona como antecedente.
7. Las cifras, plazos y números de artículo se copian de la fuente, no de memoria.

## Asuntos sensibles
- **Violencia:** nunca se recomienda confrontar, negociar o conciliar. El artículo 9 del Código Procesal de Familia prohíbe la conciliación ante relaciones desiguales de poder. No se promete que una medida garantice seguridad. Se indica el 9-1-1 para peligro inmediato y se aclara que el sitio no atiende emergencias.
- **Personas menores de edad:** no se pide información sobre ellas en formularios. No se sugiere que el pago de alimentos y el contacto se condicionen entre sí.
- **Dinero:** no se aconseja ocultar bienes o ingresos, ni incumplir para presionar.
- **Modelo de familia:** no presuponer matrimonio heterosexual, familia nuclear ni un género para quien consulta o para quien agrede.

## Estructura y extensión
- Servicios: se adapta al tema y omite lo que no aporta. Interesa más cubrir el problema que alcanzar una longitud.
- Artículos: responden una pregunta real que el servicio no desarrolla a fondo, con 500 a 1200 palabras orientativas. Si un artículo repite su servicio, se reenfoca o se retira.
- Títulos descriptivos, con la palabra que usa quien busca.
- Metadescripción: una frase útil, sin promesas, de hasta 170 caracteres.

## Experiencia y autoridad
Solo datos confirmados por Evelyn Elizondo. No se publican colegiatura, títulos, años de experiencia, casos, premios, testimonios ni membresías sin confirmación. Tampoco se dice que el contenido fue revisado por Evelyn o por una persona abogada mientras `revisionProfesional` sea `pendiente`.

## Actualización
- Semanal: `npm run normas:vigilar` compara versiones y artículos con la copia guardada.
- Mensual: jurisprudencia relevante.
- Trimestral: lectura editorial de lo publicado.
- Si un cambio afecta una afirmación y su efecto no es claro, la afirmación se retira hasta aclararlo.
