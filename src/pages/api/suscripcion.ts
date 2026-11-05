import type { APIRoute } from 'astro';
import { esSpam, validarSuscripcion } from '../../lib/validation';
import { enviar } from '../../lib/mailer';
import { ipCliente, leerCampos, limiteExcedido, respuestas } from '../../lib/form-endpoint';

export const prerender = false;

const destinos = { exito: '/suscripcion-recibida', error: '/consulta-no-enviada' };
const OK = 'Gracias. Recibimos su solicitud de suscripción.';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { campos, quiereJson } = await leerCampos(request);
  if (!campos) return respuestas.invalido(quiereJson, destinos, {});
  if (limiteExcedido(ipCliente(request, clientAddress), 'suscripcion')) return respuestas.limite(quiereJson, destinos);
  if (esSpam(campos)) return respuestas.exito(quiereJson, destinos, OK);

  const { datos, errores, valido } = validarSuscripcion(campos);
  if (!valido) return respuestas.invalido(quiereJson, destinos, errores);

  try {
    await enviar({
      asunto: 'Nueva suscripción a contenidos informativos',
      responderA: datos.correo,
      texto: `Correo: ${datos.correo}\nConsentimiento: otorgado en el formulario`
    });
  } catch (e) {
    return respuestas.fallo(quiereJson, destinos, e);
  }
  return respuestas.exito(quiereJson, destinos, OK);
};
