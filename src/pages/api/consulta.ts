import type { APIRoute } from 'astro';
import { esSpam, validarConsulta } from '../../lib/validation';
import { enviar } from '../../lib/mailer';
import { ipCliente, leerCampos, limiteEnvios, limitePeticiones, respuestas } from '../../lib/form-endpoint';

export const prerender = false;

const destinos = { exito: '/consulta-recibida', error: '/consulta-no-enviada' };
const OK = 'Solicitud recibida. Enviarla no crea, por sí solo, una relación profesional ni detiene los plazos de un proceso.';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const quiereJson = (request.headers.get('accept') ?? '').includes('application/json');
  const ip = ipCliente(request, clientAddress);
  // Un tope amplio protege al servidor; los errores de validación no agotan el cupo de envíos.
  if (limitePeticiones(ip)) return respuestas.limite(quiereJson, destinos);
  const { campos } = await leerCampos(request);
  if (!campos) return respuestas.invalido(quiereJson, destinos, {});
  // Nunca se responde con éxito si no se envió: una persona real podría caer aquí y creer que su solicitud llegó.
  if (esSpam(campos)) return respuestas.descartado(quiereJson, destinos);

  const { datos, errores, valido } = validarConsulta(campos);
  if (!valido) return respuestas.invalido(quiereJson, destinos, errores);
  if (limiteEnvios(ip)) return respuestas.limite(quiereJson, destinos);

  try {
    await enviar({
      // El asunto no revela el tema: las notificaciones del correo pueden verse en una pantalla ajena.
      asunto: 'Nueva solicitud desde el sitio',
      responderA: datos.correo,
      texto: [
        `Nombre: ${datos.nombre}`,
        `Correo: ${datos.correo}`,
        `Teléfono: ${datos.telefono || 'No indicado'}`,
        `Tipo de consulta: ${datos.tipo}`,
        'Consentimiento para el tratamiento de datos: otorgado en el formulario',
        '',
        datos.mensaje
      ].join('\n')
    });
  } catch (e) {
    return respuestas.fallo(quiereJson, destinos, e);
  }
  return respuestas.exito(quiereJson, destinos, OK);
};
