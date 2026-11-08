// Envío de correo. Nunca registra datos personales ni el contenido de los mensajes.
import { CorreoNoDisponible, type Mensaje } from './correo-comun';
import { transportar } from '#plataforma';

export { CorreoNoDisponible, type Mensaje };

export function modoCorreo() {
  return (process.env.MAIL_MODE || 'disabled').toLowerCase();
}

export async function enviar(m: Mensaje) {
  await transportar(modoCorreo(), { ...m, para: m.para ?? process.env.MAIL_TO ?? '' });
}
