// Lógica común de los endpoints de formularios.
import { permitido } from './rate-limit';
import { CorreoNoDisponible } from './mailer';
import type { Errores } from './validation';

const env = (k: string, d = '') => process.env[k] ?? d;

export function ipCliente(request: Request, clientAddress: string | undefined) {
  if (env('TRUST_PROXY') === 'true') {
    const f = request.headers.get('x-forwarded-for');
    if (f) return f.split(',')[0].trim();
  }
  return clientAddress ?? 'desconocida';
}

export function limiteExcedido(ip: string, ambito: string) {
  const max = Number(env('RATE_LIMIT_MAX', '5')) || 5;
  const min = Number(env('RATE_LIMIT_WINDOW_MINUTES', '10')) || 10;
  return !permitido(`${ambito}:${ip}`, max, min * 60_000);
}

export async function leerCampos(request: Request) {
  const tipo = request.headers.get('content-type') ?? '';
  const quiereJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (Number(request.headers.get('content-length') ?? 0) > 20_000) return { campos: null, quiereJson };
  if (tipo.includes('application/json')) {
    const campos = await request.json().catch(() => null);
    return { campos, quiereJson };
  }
  const form = await request.formData().catch(() => null);
  return { campos: form ? Object.fromEntries(form.entries()) : null, quiereJson };
}

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
  });

const ir = (destino: string) => new Response(null, { status: 303, headers: { location: destino, 'cache-control': 'no-store' } });

export type Destinos = { exito: string; error: string };

export const respuestas = {
  exito: (quiereJson: boolean, d: Destinos, mensaje: string) => (quiereJson ? json({ ok: true, mensaje }, 200) : ir(d.exito)),
  invalido: (quiereJson: boolean, d: Destinos, errores: Errores) =>
    quiereJson ? json({ ok: false, mensaje: 'Revise los campos señalados.', errores }, 422) : ir(d.error),
  limite: (quiereJson: boolean, d: Destinos) =>
    quiereJson ? json({ ok: false, mensaje: 'Ha enviado varias solicitudes en poco tiempo. Intente de nuevo más tarde.' }, 429) : ir(d.error),
  fallo: (quiereJson: boolean, d: Destinos, e: unknown) => {
    // Solo se registra el tipo de fallo: nunca datos de la persona.
    console.error('[formulario]', e instanceof CorreoNoDisponible ? 'envio_no_disponible' : 'error_envio');
    const mensaje =
      'En este momento no fue posible procesar su solicitud y no se ha enviado. Por favor, intente de nuevo más tarde.';
    return quiereJson ? json({ ok: false, mensaje }, 503) : ir(d.error);
  }
};
