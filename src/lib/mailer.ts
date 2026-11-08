// Envío de correo. Nunca registra datos personales ni el contenido de los mensajes.
import { CorreoNoDisponible, type Mensaje } from './correo-comun';
import { correoConfigurado, transportar, variable } from '#plataforma';

export { CorreoNoDisponible, type Mensaje };

export function modoCorreo() {
  return (variable('MAIL_MODE') || 'disabled').toLowerCase();
}

const destino = () => variable('MAIL_TO');

// Falso si falta el proveedor, el destinatario o el remitente: el formulario está cerrado (estado A/E).
export const correoListo = () => correoConfigurado(modoCorreo(), destino());

// Resuelve solo cuando el proveedor acepta el mensaje para su entrega. Eso no confirma que haya llegado
// ni que se haya leído.
export async function enviar(m: Mensaje) {
  await transportar(modoCorreo(), { ...m, para: m.para ?? destino() });
}
