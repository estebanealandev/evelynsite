// Configuración central. Los datos sin confirmar quedan vacíos y la interfaz los oculta.
const env = import.meta.env;
const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export const site = {
  name: 'Evelyn Elizondo',
  descriptor: 'Derecho de Familia',
  country: 'Costa Rica',
  fullName: 'Evelyn Elizondo | Derecho de Familia | Costa Rica',
  description:
    'Información y orientación jurídica en derecho de familia en Costa Rica: divorcios, pensiones alimentarias, guarda y crianza, interrelación familiar, bienes gananciales y unión de hecho.',
  // Lo fija astro.config.mjs a partir de src/config/indexacion.mjs: no se activa a mano.
  indexable: env.PUBLIC_SITE_READY === 'true',
  entorno: (env.PUBLIC_SITE_ENV as string) || 'development',
  // Clave pública del widget Turnstile. Sin ella no se carga nada de Cloudflare y el servidor rechaza los envíos.
  turnstile: clean(env.PUBLIC_TURNSTILE_SITE_KEY),
  contact: {
    phone: clean(env.PUBLIC_CONTACT_PHONE),
    email: clean(env.PUBLIC_CONTACT_EMAIL),
    address: clean(env.PUBLIC_CONTACT_ADDRESS),
    hours: clean(env.PUBLIC_CONTACT_HOURS)
  },
  privacy: {
    controller: clean(env.PUBLIC_DATA_CONTROLLER),
    controllerId: clean(env.PUBLIC_DATA_CONTROLLER_ID),
    address: clean(env.PUBLIC_DATA_CONTROLLER_ADDRESS),
    email: clean(env.PUBLIC_PRIVACY_EMAIL),
    providers: clean(env.PUBLIC_PRIVACY_PROVIDERS),
    retention: clean(env.PUBLIC_PRIVACY_RETENTION),
    transfers: clean(env.PUBLIC_PRIVACY_TRANSFERS)
  },
  // Autoría: solo se muestra y se declara en los datos estructurados si está confirmada.
  autora: {
    verificada: env.PUBLIC_AUTHOR_VERIFIED === 'true',
    nombre: clean(env.PUBLIC_AUTHOR_NAME) ?? 'Evelyn Elizondo',
    credencial: clean(env.PUBLIC_AUTHOR_CREDENTIAL),
    perfil: clean(env.PUBLIC_AUTHOR_PROFILE_URL)
  },
  // Perfil profesional (servicio jurídico, contacto y área de atención) aprobado por Evelyn para declararse
  // en los datos estructurados. Sin aprobación, el grafo no contiene ni LegalService ni datos de contacto.
  perfil: {
    aprobado: env.PUBLIC_PROFILE_APPROVED === 'true'
  },
  // Fecha en que se contrastaron las fuentes normativas oficiales.
  legalVerifiedAt: '2026-11-05'
};

export const secondaryNav = [
  { label: 'Sobre Evelyn', href: '/sobre-evelyn' },
  { label: 'Guías', href: '/orientacion' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' }
];

export const consultaTipos = [
  'Divorcio',
  'Pensión alimentaria',
  'Guarda y crianza',
  'Interrelación familiar',
  'Bienes gananciales',
  'Unión de hecho',
  'Filiación',
  'Otro asunto de familia'
];
