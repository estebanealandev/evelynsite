// Lógica común de los endpoints de formularios.
import { permitido } from './rate-limit';
import { CorreoNoDisponible } from './mailer';
import { variable } from '#plataforma';
import type { Errores } from './validation';
import { CAMPO, esFalloDelServicio, esHostLocal, esSecretoDePrueba, turnstileActivo, verificarTurnstile, type Motivo } from './turnstile';

const env = (k: string, d = '') => process.env[k] ?? d;

// scripts/servidor.mjs ya sustituye X-Forwarded-For por la dirección de confianza; en Cloudflare, Astro la toma de CF-Connecting-IP.
export function ipCliente(_request: Request, clientAddress: string | undefined) {
  const ip = clientAddress ?? 'desconocida';
  // Cada dispositivo IPv6 puede tener muchas direcciones: se agrupan por red (/64).
  return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip;
}

const ventana = () => (Number(env('RATE_LIMIT_WINDOW_MINUTES', '10')) || 10) * 60_000;
const maximo = () => Number(env('RATE_LIMIT_MAX', '5')) || 5;
export const limiteEnvios = (ip: string) => !permitido(`envio:${ip}`, maximo(), ventana());
export const limitePeticiones = (ip: string) => !permitido(`peticion:${ip}`, maximo() * 6, ventana());

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

export async function comprobarTurnstile(campos: Record<string, unknown>, url: URL, ip: string | undefined) {
  if (!turnstileActivo(variable('TURNSTILE_MODE'), url)) return { ok: true } as const;
  const secreto = variable('TURNSTILE_SECRET_KEY');
  // Solo las claves de prueba oficiales, y en una máquina local, pueden apuntar a un Siteverify simulado.
  const destino = esSecretoDePrueba(secreto) && esHostLocal(url.hostname) ? variable('TURNSTILE_VERIFY_URL') || undefined : undefined;
  const r = await verificarTurnstile({ token: campos[CAMPO], secreto, hostEsperado: url.hostname, ip, url: destino });
  // Solo el motivo: nunca el token, la IP ni los datos del formulario.
  if (!r.ok) console.warn('[formulario] turnstile', r.motivo);
  return r;
}

export const respuestas = {
  exito: (quiereJson: boolean, d: Destinos, mensaje: string) => (quiereJson ? json({ ok: true, mensaje }, 200) : ir(d.exito)),
  invalido: (quiereJson: boolean, d: Destinos, errores: Errores) =>
    quiereJson ? json({ ok: false, mensaje: 'Revise los campos señalados.', errores }, 422) : ir(d.error),
  limite: (quiereJson: boolean, d: Destinos) =>
    quiereJson ? json({ ok: false, mensaje: 'Ha enviado varias solicitudes en poco tiempo. Intente de nuevo más tarde.' }, 429) : ir(d.error),
  descartado: (quiereJson: boolean, d: Destinos) =>
    quiereJson ? json({ ok: false, mensaje: 'La solicitud no se envió. Espere unos segundos e intente de nuevo.' }, 422) : ir(d.error),
  // B (token ausente o inválido): 403. C (Turnstile no disponible o mal configurado): 503.
  verificacion: (quiereJson: boolean, d: Destinos, motivo: Motivo) => {
    const caido = esFalloDelServicio(motivo);
    const mensaje = caido
      ? 'No fue posible completar la verificación de seguridad y la solicitud no se ha enviado. Intente de nuevo más tarde.'
      : 'No se pudo confirmar la verificación de seguridad y la solicitud no se ha enviado. Espere a que termine la verificación e intente de nuevo.';
    return quiereJson ? json({ ok: false, mensaje, verificacion: true }, caido ? 503 : 403) : ir(d.error);
  },
  metodo: () =>
    new Response(JSON.stringify({ ok: false, mensaje: 'Método no permitido.' }), {
      status: 405,
      headers: { allow: 'POST', 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
    }),
  // A/E: el envío no está configurado. 503 sin revelar qué falta.
  cerrado: (quiereJson: boolean, d: Destinos) => {
    console.warn('[formulario] envio_no_disponible');
    const mensaje = 'El envío en línea no está disponible en este momento y su solicitud no se ha enviado. Intente de nuevo más tarde.';
    return quiereJson ? json({ ok: false, mensaje, cerrado: true }, 503) : ir(d.error);
  },
  // G: el proveedor de correo no aceptó el mensaje. 502: el fallo es de un servicio externo.
  fallo: (quiereJson: boolean, d: Destinos, e: unknown) => {
    if (e instanceof CorreoNoDisponible) return respuestas.cerrado(quiereJson, d);
    // Solo se registra el tipo de fallo: nunca datos de la persona.
    console.error('[formulario] error_envio');
    const mensaje = 'Hubo un error al enviar su solicitud y no se ha enviado. Intente de nuevo en unos minutos.';
    return quiereJson ? json({ ok: false, mensaje }, 502) : ir(d.error);
  }
};
