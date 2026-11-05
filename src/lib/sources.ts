// Fuentes normativas oficiales consultadas en el Sistema Costarricense de Información Jurídica (SINALEVI).
const url = (id: number) => `https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=${id}&param2=&param3=1&param4=`;

export const fuentes = {
  CF: { nombre: 'Código de Familia, Ley N.º 5476', url: url(970) },
  CPF: { nombre: 'Código Procesal de Familia, Ley N.º 9747', url: url(90569) },
  L9747: { nombre: 'Ley N.º 9747, disposiciones de aprobación del Código Procesal de Familia', url: url(90576) },
  CNA: { nombre: 'Código de la Niñez y la Adolescencia, Ley N.º 7739', url: url(43077) },
  LCVD: { nombre: 'Ley contra la Violencia Doméstica, Ley N.º 7586', url: url(27926) },
  L8968: { nombre: 'Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales, Ley N.º 8968', url: url(70975) },
  R37554: { nombre: 'Reglamento a la Ley N.º 8968, Decreto Ejecutivo N.º 37554', url: url(74352) },
  CDJ: { nombre: 'Código de Deberes Jurídicos, Morales y Éticos del Profesional en Derecho', url: url(54060) }
} as const;

export type FuenteKey = keyof typeof fuentes;
