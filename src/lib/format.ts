// Utilidades de presentación.
export function fechaLarga(d: Date | string) {
  const date = typeof d === 'string' ? new Date(`${d}T12:00:00Z`) : d;
  return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Permite marcar énfasis editorial en itálica con *texto* dentro de títulos.
export function em(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
