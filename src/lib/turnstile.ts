// Verificación de Cloudflare Turnstile en el servidor (Siteverify).
// El navegador solo obtiene el token: aceptarlo sin esta verificación equivaldría a no tener protección.
// Sin dependencias del framework ni del entorno, para que la prueben los tests unitarios.

export const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Debe coincidir con data-action del widget (ConsultaForm.astro).
export const ACCION = 'consulta';
// Los tokens caducan a los 300 s y tienen como máximo 2048 caracteres.
export const VIGENCIA_MS = 300_000;
export const LARGO_MAXIMO = 2048;
export const CAMPO = 'cf-turnstile-response';

// Claves secretas de prueba oficiales: 1x… siempre aprueba, 2x… siempre rechaza, 3x… token ya usado.
// Devuelven otro hostname y sin action, por eso esas dos comprobaciones no se les aplican.
export const esSecretoDePrueba = (s: string) => /^[123]x0+AA$/.test(s);

const LOCALES = new Set(['localhost', '127.0.0.1', '[::1]']);

// Turnstile es obligatorio salvo en una máquina local con TURNSTILE_MODE=off (pruebas y desarrollo).
// Así una variable mal puesta en producción no puede desactivarlo: el dominio real nunca es local.
export const turnstileActivo = (modo: string | undefined, url: URL) => !((modo ?? '').toLowerCase() === 'off' && LOCALES.has(url.hostname));

export type Motivo = 'falta' | 'invalido' | 'rechazado' | 'caducado' | 'host' | 'accion' | 'no_disponible' | 'sin_configurar';
export type Resultado = { ok: true } | { ok: false; motivo: Motivo };

type Opciones = {
  token: unknown;
  secreto: string;
  hostEsperado: string;
  ip?: string;
  accion?: string;
  url?: string;
  fetchImpl?: typeof fetch;
  ahora?: number;
  tiempoMaximoMs?: number;
};

type Respuesta = { success?: boolean; 'error-codes'?: string[]; hostname?: string; action?: string; challenge_ts?: string };

export async function verificarTurnstile(o: Opciones): Promise<Resultado> {
  if (!o.secreto) return { ok: false, motivo: 'sin_configurar' };
  if (typeof o.token !== 'string' || o.token === '') return { ok: false, motivo: 'falta' };
  if (o.token.length > LARGO_MAXIMO) return { ok: false, motivo: 'invalido' };

  const cuerpo = new URLSearchParams({ secret: o.secreto, response: o.token });
  if (o.ip) cuerpo.set('remoteip', o.ip);
  let datos: Respuesta;
  try {
    const r = await (o.fetchImpl ?? fetch)(o.url ?? SITEVERIFY, {
      method: 'POST',
      body: cuerpo,
      // Una petición colgada no debe retener el Worker ni dejar a la persona esperando.
      signal: AbortSignal.timeout(o.tiempoMaximoMs ?? 5000)
    });
    if (!r.ok) return { ok: false, motivo: 'no_disponible' };
    datos = (await r.json()) as Respuesta;
  } catch {
    return { ok: false, motivo: 'no_disponible' };
  }

  const codigos = datos['error-codes'] ?? [];
  if (datos.success !== true) {
    if (codigos.includes('timeout-or-duplicate')) return { ok: false, motivo: 'caducado' };
    // Un secreto mal configurado no es culpa de quien escribe: se responde como servicio no disponible.
    if (codigos.some(c => c === 'missing-input-secret' || c === 'invalid-input-secret')) return { ok: false, motivo: 'sin_configurar' };
    if (codigos.includes('invalid-input-response')) return { ok: false, motivo: 'invalido' };
    return { ok: false, motivo: 'rechazado' };
  }
  if (esSecretoDePrueba(o.secreto)) return { ok: true };

  // Un token emitido para otro sitio o para otro formulario no vale aquí.
  if (datos.hostname !== o.hostEsperado) return { ok: false, motivo: 'host' };
  if (datos.action !== (o.accion ?? ACCION)) return { ok: false, motivo: 'accion' };
  const emitido = Date.parse(datos.challenge_ts ?? '');
  if (!Number.isFinite(emitido) || (o.ahora ?? Date.now()) - emitido > VIGENCIA_MS) return { ok: false, motivo: 'caducado' };
  return { ok: true };
}
