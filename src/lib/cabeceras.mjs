// Cabeceras de seguridad comunes. Las usan el servidor Node, el Worker de Cloudflare y el archivo _headers.
// `frame-ancestors` y similares no funcionan en la etiqueta meta de cada página: tienen que ir aquí.
export const cabecerasSeguridad = {
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  // `same-origin` conserva la cabecera Origin en el envío del formulario sin JavaScript.
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

export const HSTS = 'max-age=31536000; includeSubDomains';

// Las páginas no se guardan en la caché del navegador: en un equipo compartido, una página en caché o el botón
// Atrás no deben mostrar lo que se leyó o escribió. Los recursos con nombre versionado sí se guardan.
export const esRecurso = ruta => /^\/(_astro|assets)\//.test(ruta) || /\.[a-z0-9]+(\?|$)/i.test(ruta);
