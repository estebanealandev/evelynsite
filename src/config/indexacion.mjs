// Política de indexación: la única parte del código que decide si el sitio puede indexarse.
// La usan astro.config.mjs (compilación), robots.txt, las cabeceras, los scripts de verificación y las pruebas.
//
// Indexar exige TODO a la vez:
//   1. SEO_INDEXING_ENABLED=true en la compilación.
//   2. SITE_ENV=production.
//   3. PUBLIC_SITE_URL igual al dominio de producción.
//   4. Cada requisito de src/config/lanzamiento.json aprobado, con responsable, fecha y evidencia.
// Si se pide indexar y falta algo, la compilación falla. Sin la petición expresa, el resultado es siempre noindex:
// una instalación limpia o un despliegue nuevo no pueden indexar por omisión.

export const DOMINIO_PRODUCCION = 'https://evelynelizondo.com';
export const ENTORNOS = ['development', 'preview', 'staging', 'production'];

// Requisitos de lanzamiento. Son condiciones legales y operativas del proyecto, no factores de posicionamiento:
// DNSSEC, por ejemplo, protege la integridad del DNS y no influye en el ranking.
export const REQUISITOS = {
  aprobacionEvelyn: 'Evelyn Elizondo aprobó por escrito el sitio, sus textos y su publicación',
  revisionJuridica: 'Una profesional en derecho revisó el contenido jurídico publicado',
  datosProfesionales: 'Condición profesional, colegiatura y credenciales confirmadas, o su omisión decidida',
  datosContacto: 'Teléfono, correo, dirección y horarios confirmados, o su omisión decidida',
  formulario: 'El formulario envía a una dirección real verificada y se probó de punta a punta',
  privacidad: 'Política de privacidad completa y aprobada (Ley N.º 8968)',
  dnssec: 'Registro DS publicado en .com y cadena DNSSEC validada',
  pruebasSeo: 'npm run seo:verificar y las pruebas de Playwright pasan sobre la compilación de producción'
};

const fechaValida = (f, hoy) => /^\d{4}-\d{2}-\d{2}$/.test(f ?? '') && !Number.isNaN(Date.parse(f)) && new Date(f) <= hoy;
const texto = v => typeof v === 'string' && v.trim().length > 0;

/** Devuelve la lista de requisitos sin cumplir. Una lista vacía significa lanzamiento autorizado. */
export function requisitosPendientes(registro, hoy = new Date()) {
  const faltan = [];
  const req = registro?.requisitos ?? {};
  for (const [clave, descripcion] of Object.entries(REQUISITOS)) {
    const r = req[clave];
    if (!r || r.estado !== 'aprobado') faltan.push(`${clave}: ${descripcion} (estado: ${r?.estado ?? 'sin registro'})`);
    else if (!texto(r.responsable) || !fechaValida(r.fecha, hoy) || !texto(r.evidencia))
      faltan.push(`${clave}: marcado como aprobado sin responsable, fecha válida o evidencia`);
  }
  if (!texto(registro?.autorizacion?.autorizadoPor) || !fechaValida(registro?.autorizacion?.fecha, hoy))
    faltan.push('autorizacion: falta quién autoriza la indexación y la fecha');
  return faltan;
}

/**
 * Resuelve la política para una compilación.
 * @returns {{ entorno: string, indexable: boolean, motivo: string }}
 */
export function resolverIndexacion(env, registro, hoy = new Date()) {
  const entorno = env.SITE_ENV || 'development';
  if (!ENTORNOS.includes(entorno)) throw new Error(`SITE_ENV="${entorno}" no es válido. Use: ${ENTORNOS.join(', ')}.`);
  const solicitada = env.SEO_INDEXING_ENABLED === 'true';
  if (env.SEO_INDEXING_ENABLED && !['true', 'false'].includes(env.SEO_INDEXING_ENABLED))
    throw new Error('SEO_INDEXING_ENABLED solo admite "true" o "false".');
  // La bandera anterior ya no decide nada por su cuenta: activarla sola sería una activación silenciosa.
  if (env.PUBLIC_SITE_READY === 'true' && !solicitada)
    throw new Error('PUBLIC_SITE_READY ya no habilita la indexación. Siga docs/seo/indexation-release-checklist.md.');
  if (!solicitada) return { entorno, indexable: false, motivo: 'SEO_INDEXING_ENABLED no está activado' };

  const errores = [];
  if (entorno !== 'production') errores.push(`SITE_ENV es "${entorno}"; solo production puede indexarse`);
  let origen = '';
  try { origen = new URL(env.PUBLIC_SITE_URL ?? '').origin; } catch {}
  if (origen !== DOMINIO_PRODUCCION) errores.push(`PUBLIC_SITE_URL es "${env.PUBLIC_SITE_URL ?? ''}"; debe ser ${DOMINIO_PRODUCCION}`);
  errores.push(...requisitosPendientes(registro, hoy));
  if (errores.length)
    throw new Error(`Se pidió indexar el sitio, pero no se cumplen los requisitos de lanzamiento:\n- ${errores.join('\n- ')}`);
  return { entorno, indexable: true, motivo: 'Lanzamiento autorizado y documentado' };
}

/**
 * Valor de robots para una página. `excluida` = la página no se indexa nunca (confirmaciones, 404, etiquetas).
 * @param {{ indexable: boolean, excluida?: boolean, revision?: string }} p
 */
export function robotsDePagina({ indexable, excluida = false, revision }) {
  if (!indexable) return 'noindex, nofollow';
  // Tras el lanzamiento, una página jurídica sin aprobación sigue fuera del índice, pero sus enlaces se siguen.
  if (excluida || revision === 'pendiente') return 'noindex, follow';
  return 'index, follow, max-image-preview:large';
}
