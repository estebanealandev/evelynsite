// Lo que depende del entorno de ejecución, versión Node (servidor propio y pruebas).
// La compilación para Cloudflare sustituye este módulo por plataforma-cloudflare.ts.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { CorreoNoDisponible, type Mensaje } from './correo-comun';

// Solo se leen al ejecutar. Un acceso dinámico a import.meta.env dejaría las claves incrustadas en la compilación.
const env = (k: string) => process.env[k] ?? '';

export const variable = env;

// Si el envío puede intentarse: sin esto, el formulario no debe pedir la verificación ni prometer nada.
export function correoConfigurado(modo: string, para: string) {
  if (modo === 'outbox') return process.env.NODE_ENV !== 'production' && env('PUBLIC_SITE_READY') !== 'true';
  if (modo === 'smtp') return Boolean(env('SMTP_HOST') && para && env('MAIL_FROM'));
  return false;
}

export async function transportar(modo: string, m: Mensaje & { para: string }) {
  if (modo === 'outbox') {
    // Guardar consultas en disco solo se admite en desarrollo y pruebas.
    if (process.env.NODE_ENV === 'production' || env('PUBLIC_SITE_READY') === 'true') throw new CorreoNoDisponible('outbox no se permite en producción');
    // OUTBOX_DIR separa el buzón de cada servidor de pruebas; siempre dentro de var/.
    const dir = path.resolve('var', path.basename(env('OUTBOX_DIR') || 'outbox'));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${Date.now()}-${randomUUID()}.json`), JSON.stringify(m, null, 2), { mode: 0o600 });
    return;
  }

  if (modo === 'smtp') {
    if (!env('SMTP_HOST') || !m.para || !env('MAIL_FROM')) throw new CorreoNoDisponible('Faltan SMTP_HOST, MAIL_TO o MAIL_FROM');
    const tx = nodemailer.createTransport({
      host: env('SMTP_HOST'),
      port: Number(env('SMTP_PORT') || 587),
      secure: env('SMTP_SECURE') === 'true',
      // Una consulta puede contener datos sensibles: sin cifrado no se envía.
      requireTLS: env('SMTP_SECURE') !== 'true' && (env('SMTP_ALLOW_PLAINTEXT') !== 'true' || env('PUBLIC_SITE_READY') === 'true'),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined
    });
    await tx.sendMail({ from: env('MAIL_FROM'), to: m.para, replyTo: m.responderA, subject: m.asunto, text: m.texto });
    return;
  }

  throw new CorreoNoDisponible('Envío de correo deshabilitado');
}

// En Node basta el límite en memoria de rate-limit.ts.
export async function limiteBorde(_clave: string) {
  return false;
}
