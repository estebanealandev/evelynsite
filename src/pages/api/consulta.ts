import type { APIRoute } from 'astro';
import { esSpam, validarConsulta } from '../../lib/validation';
import { acuse, enviar } from '../../lib/mailer';
import { ipCliente, leerCampos, limiteExcedido, respuestas } from '../../lib/form-endpoint';

export const prerender = false;

const destinos = { exito: '/consulta-recibida', error: '/consulta-no-enviada' };
const OK = 'Solicitud recibida. Enviarla no crea, por sí solo, una relación profesional.';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // El límite va primero para no gastar recursos leyendo peticiones de quien ya lo superó.
  const quiereJsonAntes = (request.headers.get('accept') ?? '').includes('application/json');
  if (limiteExcedido(ipCliente(request, clientAddress), 'consulta')) return respuestas.limite(quiereJsonAntes, destinos);
  const { campos, quiereJson } = await leerCampos(request);
  if (!campos) return respuestas.invalido(quiereJson, destinos, {});
  // Ante spam se responde igual que ante un envío correcto, sin procesar nada.
  if (esSpam(campos)) return respuestas.exito(quiereJson, destinos, OK);

  const { datos, errores, valido } = validarConsulta(campos);
  if (!valido) return respuestas.invalido(quiereJson, destinos, errores);

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
  // El acuse es secundario: su fallo no invalida una solicitud ya recibida.
  await acuse(
    datos.correo,
    'Solicitud recibida',
    'Su solicitud fue recibida.\n\nEste mensaje es automático y no constituye una relación profesional ni asesoría jurídica.\n\nEvelyn Elizondo'
  ).catch(() => console.error('[formulario] error_acuse'));

  return respuestas.exito(quiereJson, destinos, OK);
};
