// Las páginas noindex de una misma carpeta (p. ej. todas las etiquetas del blog) se agrupan en una regla /carpeta/*
// cuando ninguna página de esa carpeta es indexable; así no se agota el límite de reglas.
export const agruparExcluidas = robots => {
  const excluida = v => v?.includes('noindex');
  const carpetas = new Map();
  for (const [ruta, v] of Object.entries(robots)) {
    const c = ruta.slice(0, ruta.lastIndexOf('/'));
    if (c) carpetas.set(c, [...(carpetas.get(c) ?? []), v]);
  }
  // `/carpeta/*` también alcanza las subcarpetas: se exige que TODO lo que cuelga de ella esté excluido igual.
  const bajo = c => Object.entries(robots).filter(([r]) => r.startsWith(`${c}/`)).map(([, v]) => v);
  const completas = [...carpetas.keys()].filter(c => { const vs = bajo(c); return vs.length > 1 && vs.every(v => excluida(v) && v === vs[0]); });
  const reglas = completas.filter(c => !completas.some(o => o !== c && c.startsWith(`${o}/`))).map(c => [`${c}/*`, bajo(c)[0]]);
  const comodines = reglas.map(([r]) => r.slice(0, -1));
  const cubierta = ruta => comodines.some(prefijo => ruta.startsWith(prefijo));
  for (const [ruta, v] of Object.entries(robots)) if (excluida(v) && !cubierta(ruta)) reglas.push([ruta, v]);
  return reglas;
};
