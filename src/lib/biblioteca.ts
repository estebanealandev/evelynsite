// Normas fundamentales del derecho de familia costarricense. Resúmenes editoriales: el texto de cada norma se consulta en SINALEVI.
// Las reformas provienen de las notas de la copia oficial y cada afirmación consta en docs/auditoria-evelyn/matriz/biblioteca.json.
export type NormaBiblioteca = {
  ref: 'CF' | 'CPF' | 'L9747' | 'CNA' | 'LCVD' | 'L8968' | 'R37554' | 'CDJ';
  para: string;
  regula: string[];
  reformas: string[];
  servicios: string[];
};

export const biblioteca: NormaBiblioteca[] = [
  {
    ref: 'CF',
    para: 'Es la norma de fondo: define qué derechos y deberes nacen de las relaciones familiares. Conviene leerla para saber qué puede pedirse, antes de ver cómo se tramita.',
    regula: [
      'Matrimonio, divorcio y separación judicial',
      'Régimen patrimonial y bienes gananciales',
      'Filiación y adopción',
      'Atributos de la responsabilidad parental, y guarda, crianza y educación',
      'Alimentos',
      'Unión de hecho'
    ],
    reformas: [
      'Ley N.º 10650, del 26 de febrero de 2025: reformó el artículo 48, sobre causales de divorcio y convenio por mutuo consentimiento.',
      'Ley N.º 10634, del 29 de enero de 2025 (Ley contra la Violencia Vicaria): adicionó incisos a los artículos 158 bis y 159.',
      'Ley N.º 10603, del 15 de noviembre de 2024: reformó los artículos 143 y 159, sobre relaciones impropias.',
      'Ley N.º 10223, del 5 de mayo de 2022: reformó el artículo 245, sobre la unión de hecho.',
      'Ley N.º 10228, del 5 de mayo de 2022: interpretó el artículo 245. Para los alimentos entre personas convivientes, la unión se constata en el juzgado de pensiones alimentarias.',
      'Ley N.º 10192, del 28 de abril de 2022: adicionó un capítulo sobre cuidados y corrió la numeración de artículos posteriores.'
    ],
    servicios: ['divorcios', 'pensiones-alimentarias', 'guarda-crianza', 'interrelacion-familiar', 'bienes-gananciales', 'union-de-hecho', 'filiacion-paternidad', 'acuerdos-familiares']
  },
  {
    ref: 'CPF',
    para: 'Es la norma de trámite: indica qué proceso corresponde, cómo se contesta, qué plazos corren y cómo se ejecuta lo resuelto. Es la referencia cuando ya hay una demanda o una notificación.',
    regula: [
      'Principios procesales y conciliación',
      'Competencia, partes y patrocinio letrado',
      'Notificaciones, plazos y medidas cautelares',
      'Proceso resolutivo familiar',
      'Procesos de protección cautelar y de petición unilateral',
      'Pensiones alimentarias',
      'Divorcio, separación judicial y cese de la unión de hecho por mutuo consentimiento',
      'Ejecución de resoluciones'
    ],
    reformas: [
      'Ley N.º 10558, del 23 de octubre de 2024: reformó numerosos artículos, entre ellos el 9, el 87, el 223 y el 226, y derogó el artículo 286.',
      'Ley N.º 10315, del 27 de setiembre de 2022: fijó que el Código rige en su integridad a partir del 1 de octubre de 2024.'
    ],
    servicios: ['divorcios', 'pensiones-alimentarias', 'guarda-crianza', 'interrelacion-familiar', 'bienes-gananciales', 'union-de-hecho', 'filiacion-paternidad', 'acuerdos-familiares', 'proteccion-familiar']
  },
  {
    ref: 'L9747',
    para: 'Es la ley que aprobó el Código Procesal de Familia. Sirve para comprobar qué normas anteriores se reformaron o derogaron y qué ocurre con los procesos que ya estaban en trámite.',
    regula: [
      'Reformas a otras leyes, incluido el Código de Familia',
      'Derogatorias, entre ellas la de la Ley N.º 7654, de Pensiones Alimentarias',
      'Reglas transitorias para procesos pendientes y resoluciones ya dictadas'
    ],
    reformas: [
      'Ley N.º 10315, del 27 de setiembre de 2022: reformó el párrafo sobre la vigencia del Código, fijada en el 1 de octubre de 2024.'
    ],
    servicios: ['pensiones-alimentarias', 'divorcios']
  },
  {
    ref: 'CNA',
    para: 'Es el marco mínimo de protección de los derechos de las personas menores de edad. Se consulta cuando una decisión les afecta, porque ordena considerar su interés superior.',
    regula: [
      'Interés superior de la persona menor de edad',
      'Derecho a la prestación alimentaria y gastos extraordinarios',
      'Medidas de protección',
      'Permisos de salida del país'
    ],
    reformas: [
      'Ley N.º 10603, del 15 de noviembre de 2024: reformó el artículo 130 e incluyó las relaciones impropias entre las causas de medidas de protección.',
      'Ley N.º 10558, del 23 de octubre de 2024: reformó el artículo 16, sobre control de salidas del país.',
      'Ley N.º 9747: derogó, entre otros, el artículo 40, sobre la demanda de alimentos.'
    ],
    servicios: ['guarda-crianza', 'interrelacion-familiar', 'pensiones-alimentarias', 'proteccion-familiar']
  },
  {
    ref: 'LCVD',
    para: 'Regula las medidas de protección ante violencia doméstica y violencia vicaria. Pueden solicitarse con independencia de cualquier otro proceso, penal o de familia.',
    regula: [
      'Definición de violencia doméstica y de sus formas',
      'Medidas de protección y su duración',
      'Quién puede solicitarlas y cómo se tramitan',
      'Comparecencia, apelación y seguimiento de las medidas'
    ],
    reformas: [
      'Ley N.º 10634, del 29 de enero de 2025 (Ley contra la Violencia Vicaria): reformó, entre otros, los artículos 2 y 3, e incorporó la violencia vicaria.',
      'Ley N.º 9747: reformó, entre otros, el inciso l) del artículo 3, sobre la obligación alimentaria provisional.'
    ],
    servicios: ['proteccion-familiar']
  },
  {
    ref: 'L8968',
    para: 'Reconoce el derecho a la autodeterminación informativa y fija reglas para quien recopila datos personales. Rige, por ejemplo, la información y el consentimiento que pide un formulario.',
    regula: [
      'Consentimiento informado',
      'Calidad y conservación de los datos',
      'Derechos de acceso, rectificación y supresión',
      'Datos sensibles',
      'Seguridad y confidencialidad',
      'Transferencia de datos y Prodhab'
    ],
    reformas: [],
    servicios: []
  },
  {
    ref: 'R37554',
    para: 'Es el reglamento de la Ley N.º 8968. Detalla cómo se otorga y revoca el consentimiento, cómo se atienden las solicitudes y qué se entiende por transferencia.',
    regula: [
      'Requisitos y revocación del consentimiento',
      'Trámite de las solicitudes de las personas titulares',
      'Tratamiento, encargados y medidas de seguridad',
      'Transferencia de datos personales'
    ],
    reformas: [
      'Decreto Ejecutivo N.º 40008, del 19 de julio de 2016: reformó, entre otros, los artículos 2, 3, 5, 11 y 40.'
    ],
    servicios: []
  },
  {
    ref: 'CDJ',
    para: 'Reúne los deberes de las personas inscritas en el Colegio de Abogados. Sirve para saber qué puede esperarse de una persona abogada en la publicidad, la opinión y el secreto profesional.',
    regula: [
      'Publicidad profesional',
      'Deberes con la clientela',
      'Secreto profesional y sus excepciones',
      'Régimen disciplinario'
    ],
    reformas: [],
    servicios: []
  }
];
