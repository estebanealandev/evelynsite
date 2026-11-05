// Preguntas del orientador. Solo llevan a la información general de cada área; no evalúan el caso.
export type Resultado = { resultado: string; aviso?: string };
export type Opcion = { texto: string; siguiente?: string } & Partial<Resultado>;
export type Pregunta = { pregunta: string; opciones: Opcion[] };

export const inicio = 'inicio';

export const preguntas: Record<string, Pregunta> = {
  inicio: {
    pregunta: '¿Qué le trae hoy?',
    opciones: [
      { texto: 'Temo por mi seguridad o la de alguien de mi familia', resultado: 'proteccion-familiar', aviso: 'Si hay peligro ahora, llame al 9-1-1. Este sitio no atiende emergencias.' },
      { texto: 'Quiero separarme o divorciarme', resultado: 'divorcios' },
      { texto: 'Tengo una duda sobre mis hijas o hijos', siguiente: 'hijos' },
      { texto: 'Se trata de dinero o de bienes', siguiente: 'dinero' },
      { texto: 'Convivimos sin estar casados', resultado: 'union-de-hecho' }
    ]
  },
  hijos: {
    pregunta: '¿Qué le preocupa sobre sus hijas o hijos?',
    opciones: [
      { texto: 'Con quién vivirán o quién decide sobre su crianza', resultado: 'guarda-crianza' },
      { texto: 'El contacto o las visitas con su familia', resultado: 'interrelacion-familiar' },
      { texto: 'La pensión alimentaria', resultado: 'pensiones-alimentarias' },
      { texto: 'Reconocer o aclarar una paternidad', resultado: 'filiacion-paternidad' }
    ]
  },
  dinero: {
    pregunta: '¿A qué se refiere su consulta?',
    opciones: [
      { texto: 'Pedir, pagar o cambiar una pensión alimentaria', resultado: 'pensiones-alimentarias' },
      { texto: 'Los bienes de un matrimonio o una unión que termina', resultado: 'bienes-gananciales' },
      { texto: 'Ordenar los bienes antes o durante el matrimonio', resultado: 'acuerdos-familiares' }
    ]
  }
};
