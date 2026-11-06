// Envío de correo. Nunca registra datos personales ni el contenido de los mensajes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k] ?? '';

export type Mensaje = { asunto: string; texto: string; responderA?: string; para?: string };

export class CorreoNoDisponible extends Error {}

export function modoCorreo() {
  return (env('MAIL_MODE') || 'disabled').toLowerCase();
}

export async function enviar(m: Mensaje) {
  const modo = modoCorreo();
  const para = m.para ?? env('MAIL_TO');

  if (modo === 'outbox') {
    // Guardar consultas en disco solo se admite en desarrollo y pruebas.
    if (process.env.NODE_ENV === 'production' || env('PUBLIC_SITE_READY') === 'true') throw new CorreoNoDisponible('outbox no se permite en producción');
    const dir = path.resolve('var/outbox');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${Date.now()}-${randomUUID()}.json`), JSON.stringify({ ...m, para }, null, 2), { mode: 0o600 });
    return;
  }

  if (modo === 'smtp') {
    if (!env('SMTP_HOST') || !para || !env('MAIL_FROM')) throw new CorreoNoDisponible('Faltan SMTP_HOST, MAIL_TO o MAIL_FROM');
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
    await tx.sendMail({ from: env('MAIL_FROM'), to: para, replyTo: m.responderA, subject: m.asunto, text: m.texto });
    return;
  }

  throw new CorreoNoDisponible('Envío de correo deshabilitado');
}

export async function acuse(correo: string, asunto: string, texto: string) {
  if (env('MAIL_SEND_ACK') !== 'true') return;
  await enviar({ para: correo, asunto, texto });
}
