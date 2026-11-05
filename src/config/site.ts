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
  indexable: env.PUBLIC_SITE_READY === 'true',
  contact: {
    phone: clean(env.PUBLIC_CONTACT_PHONE),
    email: clean(env.PUBLIC_CONTACT_EMAIL),
    address: clean(env.PUBLIC_CONTACT_ADDRESS),
    hours: clean(env.PUBLIC_CONTACT_HOURS)
  },
  privacy: {
    controller: clean(env.PUBLIC_DATA_CONTROLLER),
    controllerId: clean(env.PUBLIC_DATA_CONTROLLER_ID),
    email: clean(env.PUBLIC_PRIVACY_EMAIL),
    providers: clean(env.PUBLIC_PRIVACY_PROVIDERS),
    retention: clean(env.PUBLIC_PRIVACY_RETENTION),
    transfers: clean(env.PUBLIC_PRIVACY_TRANSFERS)
  },
  // Fecha en que se contrastaron las fuentes normativas oficiales.
  legalVerifiedAt: '2026-11-04'
};

export const secondaryNav = [
  { label: 'Sobre Evelyn', href: '/sobre-evelyn' },
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
