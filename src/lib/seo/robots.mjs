// robots.txt por estado de indexación. robots.txt controla el rastreo, no la indexación ni la confidencialidad:
// el bloqueo del índice lo hacen la meta robots y X-Robots-Tag, y para leerlas el buscador debe poder rastrear.

// Decisión de la responsable del sitio, independiente de la búsqueda (docs/seo/geo-aeo-strategy.md).
// Mientras no decida otra cosa se conserva lo que ya regía: estos agentes no rastrean.
export const ENTRENAMIENTO = 'bloquear'; // 'bloquear' | 'permitir'

// Agentes que recopilan contenido para entrenar modelos. Bloquearlos no afecta a Google Search, AI Overviews,
// Bing ni la búsqueda de ChatGPT, que usan otros agentes.
export const AGENTES_ENTRENAMIENTO = ['GPTBot', 'Google-Extended', 'Applebot-Extended', 'ClaudeBot', 'CCBot', 'meta-externalagent', 'Bytespider'];

// Buscadores con IA cuyo trato de noindex no está documentado con la misma claridad que el de Google y Bing.
// Antes del lanzamiento no rastrean el contenido jurídico pendiente; después, sí.
export const AGENTES_BUSQUEDA_IA = ['OAI-SearchBot', 'PerplexityBot'];

const grupo = (agentes, reglas) => `${agentes.map(a => `User-agent: ${a}`).join('\n')}\n${reglas.join('\n')}\n`;

export function generarRobots({ indexable, sitemap }) {
  const partes = [];
  if (indexable) {
    partes.push('# evelynelizondo.com: indexación autorizada para las páginas elegibles.\n');
    partes.push(grupo(['*'], ['Allow: /', 'Disallow: /api/']));
  } else {
    partes.push(
      '# evelynelizondo.com: indexación NO autorizada todavía.\n' +
      '# Todas las páginas llevan noindex (meta robots y X-Robots-Tag). Los buscadores pueden rastrear\n' +
      '# justamente para leer esa directiva: un Disallow general la ocultaría.\n'
    );
    partes.push(grupo(['*'], ['Allow: /', 'Disallow: /api/']));
    partes.push(grupo(AGENTES_BUSQUEDA_IA, ['Disallow: /']));
  }
  if (ENTRENAMIENTO === 'bloquear') partes.push(`# Entrenamiento de modelos: bloqueado por decisión pendiente de la responsable del sitio.\n${grupo(AGENTES_ENTRENAMIENTO, ['Disallow: /'])}`);
  if (indexable && sitemap) partes.push(`Sitemap: ${sitemap}\n`);
  return partes.join('\n');
}
