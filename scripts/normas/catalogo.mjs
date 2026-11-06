// Normas que sustentan el contenido del sitio. `id` es el identificador de la norma en SINALEVI.
export const catalogo = {
  CF: { id: 970, titulo: 'Código de Familia', norma: 'Ley 5476' },
  CPF: { id: 90569, titulo: 'Código Procesal de Familia', norma: 'Ley 9747' },
  L9747: { id: 90576, titulo: 'Ley que aprueba el Código Procesal de Familia', norma: 'Ley 9747' },
  CNA: { id: 43077, titulo: 'Código de la Niñez y la Adolescencia', norma: 'Ley 7739' },
  LCVD: { id: 27926, titulo: 'Ley contra la Violencia Doméstica', norma: 'Ley 7586' },
  L8968: { id: 70975, titulo: 'Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales', norma: 'Ley 8968' },
  R37554: { id: 74352, titulo: 'Reglamento a la Ley 8968', norma: 'Decreto Ejecutivo 37554' },
  CDJ: { id: 54060, titulo: 'Código de Deberes Jurídicos, Morales y Éticos del Profesional en Derecho', norma: 'Reglamento 47' }
};
export const urlNorma = id => `https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=${id}&param2=&param3=1&param4=`;
export const DIR_NORMAS = 'docs/auditoria-evelyn/normas';
