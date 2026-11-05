import type { APIRoute } from 'astro';
import { esSpam, validarConsulta } from '../../lib/validation';
import { acuse, enviar } from '../../lib/mailer';
import { ipCliente, leerCampos, limiteExcedido, respuestas } from '../../lib/form-endpoint';

export const prerender = false;

const destinos = { exito: '/consulta-recibida', error: '/consulta-no-enviada' };
const OK = 'Recibimos su solicitud. Enviarla no constituye, por sí solo, una relación profesional.';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { campos, quiereJson } = await leerCampos(request);
  if (!campos) return respuestas.invalido(quiereJson, destinos, {});
  if (limiteExcedido(ipCliente(request, clientAddress), 'consulta')) return respuestas.limite(quiereJson, destinos);
  // Ante spam se responde igual que ante un envío correcto, sin procesar nada.
  if (esSpam(campos)) return respuestas.exito(quiereJson, destinos, OK);

  const { datos, errores, valido } = validarConsulta(campos);
  if (!valido) return respuestas.invalido(quiereJson, destinos, errores);

  try {
    await enviar({
      asunto: `Nueva consulta: ${datos.tipo}`,
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
  // El acuse es secundario: su fallo no invalida una solicitud ya recibida.
  await acuse(
    datos.correo,
    'Recibimos su solicitud | Evelyn Elizondo',
    'Recibimos su solicitud de consulta.\n\nEste mensaje es automático y no constituye una relación profesional ni asesoría jurídica.\n\nEvelyn Elizondo\nDerecho de Familia | Costa Rica'
  ).catch(() => console.error('[formulario] error_acuse'));

  return respuestas.exito(quiereJson, destinos, OK);
};
