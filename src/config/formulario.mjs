// Requisitos para abrir el formulario de consulta a envíos reales.
// La usan astro.config.mjs (la compilación falla si se activa Turnstile sin cumplirlos) y
// scripts/seguridad/preparar-formulario.mjs (comprobación previa a la activación).
//
// Activar el formulario y lanzar el sitio son procesos distintos: esto no toca la indexación.

// Se exigen al compilar con la clave pública de Turnstile: sin ellos no se publica un widget.
export const REQUISITOS_COMPILACION = {
  correoDestino: 'Dirección real de Evelyn confirmada y verificada como destino del Email Service',
  widgetProduccion: 'Widget Turnstile de producción (modo Managed, hostname evelynelizondo.com, sin localhost) creado',
  politicaPrivacidad: 'Texto de la política de privacidad con Cloudflare y Turnstile revisado y aprobado jurídicamente'
};

// Se cumple después de desplegar. Hasta entonces el formulario no se declara operativo.
export const REQUISITO_FINAL = {
  envioRealVerificado: 'Un envío real controlado llegó al buzón de destino después del despliegue'
};

const fechaValida = (f, hoy) => /^\d{4}-\d{2}-\d{2}$/.test(f ?? '') && !Number.isNaN(Date.parse(f)) && new Date(f) <= hoy;
const texto = v => typeof v === 'string' && v.trim().length > 0;

/** Requisitos sin cumplir de `definiciones`. Una lista vacía significa cumplidos. */
export function pendientesFormulario(registro, definiciones = REQUISITOS_COMPILACION, hoy = new Date()) {
  const faltan = [];
  const req = registro?.requisitos ?? {};
  for (const [clave, descripcion] of Object.entries(definiciones)) {
    const r = req[clave];
    if (!r || r.estado !== 'aprobado') faltan.push(`${clave}: ${descripcion} (estado: ${r?.estado ?? 'sin registro'})`);
    else if (!texto(r.responsable) || !fechaValida(r.fecha, hoy) || !texto(r.evidencia))
      faltan.push(`${clave}: marcado como aprobado sin responsable, fecha válida o evidencia`);
  }
  return faltan;
}

// Claves públicas de prueba de Turnstile (1x…AA, 2x…AB, 1x…BB, 2x…BB, 3x…FF). Nunca en producción.
export const esClavePublicaDePrueba = s => /^[123]x0{20}[A-F]{2}$/.test(s ?? '');

/**
 * Comprueba la clave pública de una compilación. Lanza un error si no se puede publicar.
 * Sin clave no hay widget: el formulario queda cerrado y la página lo advierte.
 */
export function comprobarActivacion({ entorno, clave }, registro, hoy = new Date()) {
  if (!clave || entorno !== 'production') return { activo: Boolean(clave), motivo: clave ? `entorno ${entorno}` : 'sin clave pública' };
  if (esClavePublicaDePrueba(clave)) throw new Error('PUBLIC_TURNSTILE_SITE_KEY es una clave de prueba: no se admite en una compilación de producción.');
  const faltan = pendientesFormulario(registro, REQUISITOS_COMPILACION, hoy);
  if (faltan.length)
    throw new Error(`Se compiló para producción con la clave de Turnstile, pero el formulario no puede activarse:\n- ${faltan.join('\n- ')}`);
  return { activo: true, motivo: 'requisitos de activación cumplidos' };
}
