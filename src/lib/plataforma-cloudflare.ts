// Lo que depende del entorno de ejecución, versión Cloudflare Workers.
// astro.config.mjs la usa en lugar de plataforma.ts al compilar con DESTINO=cloudflare.
import { env } from 'cloudflare:workers';
import { CorreoNoDisponible, type Mensaje } from './correo-comun';

const texto = (k: string) => (typeof env[k] === 'string' ? (env[k] as string) : '');

export async function transportar(modo: string, m: Mensaje & { para: string }) {
  // Email Service de Cloudflare: el envío a una dirección de destino verificada no tiene coste.
  if (modo === 'cloudflare') {
    const correo = env.EMAIL as { send(m: object): Promise<unknown> } | undefined;
    if (!correo || !m.para || !texto('MAIL_FROM')) throw new CorreoNoDisponible('Faltan EMAIL, MAIL_TO o MAIL_FROM');
    try {
      await correo.send({ to: m.para, from: texto('MAIL_FROM'), replyTo: m.responderA, subject: m.asunto, text: m.texto });
    } catch (e) {
      // Solo el código del error: nunca la dirección ni el contenido.
      console.error('[formulario] cloudflare_email', (e as { code?: string }).code ?? 'sin_codigo');
      throw e;
    }
    return;
  }
  throw new CorreoNoDisponible('Envío de correo deshabilitado');
}

// El límite en memoria solo vale para un aislamiento del Worker. Este lo comparte cada ubicación de Cloudflare.
export async function limiteBorde(clave: string) {
  const limitador = env.LIMITE_CONSULTAS as { limit(o: { key: string }): Promise<{ success: boolean }> } | undefined;
  // Las pruebas locales envían muchas solicitudes seguidas desde la misma dirección.
  if (!limitador || texto('RATE_LIMIT_EDGE') === 'off') return false;
  const huella = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clave));
  const { success } = await limitador.limit({ key: btoa(String.fromCharCode(...new Uint8Array(huella))) });
  return !success;
}
