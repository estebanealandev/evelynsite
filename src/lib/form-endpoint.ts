// Lógica común de los endpoints de formularios.
import { permitido } from './rate-limit';
import { CorreoNoDisponible } from './mailer';
import type { Errores } from './validation';

const env = (k: string, d = '') => process.env[k] ?? d;

export function ipCliente(request: Request, clientAddress: string | undefined) {
  if (env('TRUST_PROXY') === 'true') {
    // El último valor lo añade el proxy de confianza; los anteriores los puede inventar quien envía la petición.
    const ultimo = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim();
    if (ultimo) return ultimo;
  }
  return clientAddress ?? 'desconocida';
}

export function limiteExcedido(ip: string, ambito: string) {
  const max = Number(env('RATE_LIMIT_MAX', '5')) || 5;
  const min = Number(env('RATE_LIMIT_WINDOW_MINUTES', '10')) || 10;
  return !permitido(`${ambito}:${ip}`, max, min * 60_000);
}

const LIMITE_CUERPO = 20_000;

// Lee el cuerpo con un límite real: la cabecera content-length puede faltar o ser falsa.
async function cuerpoLimitado(request: Request) {
  if (!request.body) return null;
  const lector = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > LIMITE_CUERPO) {
      await lector.cancel();
      return null;
    }
    partes.push(value);
  }
  return new Blob(partes as BlobPart[]);
}

export async function leerCampos(request: Request) {
  const tipo = request.headers.get('content-type') ?? '';
  const quiereJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)/i.test(tipo)) return { campos: null, quiereJson };
  const cuerpo = await cuerpoLimitado(request).catch(() => null);
  if (!cuerpo) return { campos: null, quiereJson };
  const form = await new Response(cuerpo, { headers: { 'content-type': tipo } }).formData().catch(() => null);
  if (!form) return { campos: null, quiereJson };
  // El formulario no admite archivos: si llega uno, la petición se rechaza completa.
  const entradas = [...form.entries()];
  if (entradas.some(([, v]) => typeof v !== 'string')) return { campos: null, quiereJson };
  return { campos: Object.fromEntries(entradas), quiereJson };
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
      'No fue posible procesar su solicitud y no se ha enviado. Intente de nuevo más tarde.';
    return quiereJson ? json({ ok: false, mensaje }, 503) : ir(d.error);
  }
};
