// Verificación de Cloudflare Turnstile en el servidor (Siteverify).
// El navegador solo obtiene el token: aceptarlo sin esta verificación equivaldría a no tener protección.
// Sin dependencias del framework ni del entorno, para que la prueben los tests unitarios.
// Referencia: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Debe coincidir con data-action del widget (ConsultaForm.astro). Máximo 32 caracteres: letras, números, _ y -.
export const ACCION = 'consulta';
// Los tokens caducan a los 300 s y tienen como máximo 2048 caracteres.
export const VIGENCIA_MS = 300_000;
export const LARGO_MAXIMO = 2048;
export const CAMPO = 'cf-turnstile-response';

// Claves secretas de prueba oficiales: 1x… siempre aprueba, 2x… siempre rechaza, 3x… token ya usado.
// Devuelven el hostname example.com y no devuelven action: el host y la acción solo se prueban con claves reales.
export const esSecretoDePrueba = (s: string) => /^[123]x0+AA$/.test(s);
// Claves públicas de prueba: 1x…AA, 2x…AB, 1x…BB, 2x…BB y 3x…FF.
export const esClavePublicaDePrueba = (s: string) => /^[123]x0{20}[A-F]{2}$/.test(s);

const LOCALES = new Set(['localhost', '127.0.0.1', '[::1]']);
export const esHostLocal = (host: string) => LOCALES.has(host);

// Turnstile es obligatorio salvo en una máquina local con TURNSTILE_MODE=off (pruebas y desarrollo).
// Así una variable mal puesta en producción no puede desactivarlo: el dominio real nunca es local.
export const turnstileActivo = (modo: string | undefined, url: URL) => !((modo ?? '').toLowerCase() === 'off' && esHostLocal(url.hostname));

// clave_de_prueba: una clave secreta de prueba fuera de una máquina local. Aprobaría cualquier envío,
// así que se trata como falta de configuración.
export type Motivo = 'falta' | 'invalido' | 'rechazado' | 'caducado' | 'host' | 'accion' | 'no_disponible' | 'sin_configurar' | 'clave_de_prueba';
export type Resultado = { ok: true } | { ok: false; motivo: Motivo };

// Motivos que no son culpa de quien escribe: el servicio no puede verificar (503, no 403).
export const esFalloDelServicio = (m: Motivo) => m === 'no_disponible' || m === 'sin_configurar' || m === 'clave_de_prueba';

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

type Respuesta = { success?: unknown; 'error-codes'?: unknown; hostname?: unknown; action?: unknown; challenge_ts?: unknown };

// Una consulta a Siteverify. null = no hubo respuesta utilizable (red, tiempo agotado, 5xx o cuerpo no JSON).
async function consultar(o: Opciones, cuerpo: URLSearchParams): Promise<Respuesta | null> {
  try {
    const r = await (o.fetchImpl ?? fetch)(o.url ?? SITEVERIFY, {
      method: 'POST',
      body: cuerpo,
      // Una petición colgada no debe retener el Worker ni dejar a la persona esperando.
      signal: AbortSignal.timeout(o.tiempoMaximoMs ?? 5000)
    });
    if (!r.ok) return null;
    const datos = (await r.json()) as unknown;
    return datos && typeof datos === 'object' ? (datos as Respuesta) : null;
  } catch {
    return null;
  }
}

export async function verificarTurnstile(o: Opciones): Promise<Resultado> {
  if (!o.secreto) return { ok: false, motivo: 'sin_configurar' };
  if (esSecretoDePrueba(o.secreto) && !esHostLocal(o.hostEsperado)) return { ok: false, motivo: 'clave_de_prueba' };
  if (typeof o.token !== 'string' || o.token === '') return { ok: false, motivo: 'falta' };
  if (o.token.length > LARGO_MAXIMO) return { ok: false, motivo: 'invalido' };

  const cuerpo = new URLSearchParams({ secret: o.secreto, response: o.token, idempotency_key: crypto.randomUUID() });
  if (o.ip) cuerpo.set('remoteip', o.ip);
  // Un fallo pasajero se reintenta una vez con la misma clave de idempotencia: Cloudflare no cuenta
  // ese reintento como un segundo uso del token.
  let datos = await consultar(o, cuerpo);
  const interno = (d: Respuesta | null) => !d || (Array.isArray(d['error-codes']) && d['error-codes'].includes('internal-error'));
  if (interno(datos)) datos = await consultar(o, cuerpo);
  if (!datos || interno(datos)) return { ok: false, motivo: 'no_disponible' };

  const codigos = Array.isArray(datos['error-codes']) ? (datos['error-codes'] as unknown[]) : [];
  if (datos.success !== true) {
    if (codigos.includes('timeout-or-duplicate')) return { ok: false, motivo: 'caducado' };
    // Un secreto mal configurado no es culpa de quien escribe: se responde como servicio no disponible.
    if (codigos.some(c => c === 'missing-input-secret' || c === 'invalid-input-secret')) return { ok: false, motivo: 'sin_configurar' };
    if (codigos.includes('missing-input-response')) return { ok: false, motivo: 'falta' };
    if (codigos.some(c => c === 'invalid-input-response' || c === 'bad-request')) return { ok: false, motivo: 'invalido' };
    return { ok: false, motivo: 'rechazado' };
  }
  // Solo llega aquí en una máquina local (ver arriba): Cloudflare devuelve example.com y no devuelve action.
  if (esSecretoDePrueba(o.secreto)) return { ok: true };

  // Un token emitido para otro sitio o para otro formulario no vale aquí.
  if (datos.hostname !== o.hostEsperado) return { ok: false, motivo: 'host' };
  if (datos.action !== (o.accion ?? ACCION)) return { ok: false, motivo: 'accion' };
  const emitido = typeof datos.challenge_ts === 'string' ? Date.parse(datos.challenge_ts) : NaN;
  if (!Number.isFinite(emitido) || (o.ahora ?? Date.now()) - emitido > VIGENCIA_MS) return { ok: false, motivo: 'caducado' };
  return { ok: true };
}
