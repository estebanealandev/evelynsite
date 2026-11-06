// Preguntas del orientador. Señalan un tema de lectura: no evalúan el caso ni concluyen qué vía corresponde.
// Nada de lo que se elige se guarda ni se envía.
export type Opcion = {
  texto: string;
  siguiente?: string;
  // Área de /servicios que se propone leer.
  resultado?: string;
  // Guía de /orientacion que se propone leer.
  ficha?: string;
  // Lleva al listado completo cuando la situación no encaja en las opciones.
  listado?: boolean;
  // Para situaciones de riesgo: muestra el aviso, la salida rápida y no invita a pedir una consulta.
  riesgo?: boolean;
};
export type Pregunta = { pregunta: string; opciones: Opcion[] };

export const inicio = 'inicio';

export const AVISO_RIESGO = 'Si hay peligro ahora, llame al 9-1-1. Este sitio no atiende emergencias.';

export const preguntas: Record<string, Pregunta> = {
  inicio: {
    pregunta: '¿Sobre qué busca información?',
    opciones: [
      { texto: 'Temo por mi seguridad o la de alguien de mi familia', resultado: 'proteccion-familiar', riesgo: true },
      { texto: 'Recibí una notificación judicial', ficha: 'recibi-una-notificacion-judicial' },
      { texto: 'Separación o divorcio', resultado: 'divorcios', ficha: 'alternativas-para-divorciarse' },
      { texto: 'Hijas o hijos', siguiente: 'hijos' },
      { texto: 'Dinero o bienes', siguiente: 'dinero' },
      { texto: 'Convivencia sin matrimonio', resultado: 'union-de-hecho' },
      { texto: 'Otra situación, o no lo tengo claro', listado: true }
    ]
  },
  hijos: {
    pregunta: '¿Qué tema le interesa?',
    opciones: [
      { texto: 'Con quién viven o quién decide sobre su crianza', resultado: 'guarda-crianza' },
      { texto: 'El contacto con su familia', resultado: 'interrelacion-familiar' },
      { texto: 'La pensión alimentaria', resultado: 'pensiones-alimentarias', ficha: 'revisar-una-pension-alimentaria' },
      { texto: 'Reconocer o aclarar una filiación', resultado: 'filiacion-paternidad' }
    ]
  },
  dinero: {
    pregunta: '¿A qué se refiere?',
    opciones: [
      { texto: 'Pedir, pagar o cambiar una pensión alimentaria', resultado: 'pensiones-alimentarias', ficha: 'revisar-una-pension-alimentaria' },
      { texto: 'Los bienes de un matrimonio o una unión que termina', resultado: 'bienes-gananciales' },
      { texto: 'Ordenar los bienes antes o durante el matrimonio', resultado: 'acuerdos-familiares' }
    ]
  }
};
