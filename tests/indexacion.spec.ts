// Política de indexación: pruebas de la lógica pura, sin servidor.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { REQUISITOS, requisitosPendientes, resolverIndexacion, robotsDePagina } from '../src/config/indexacion.mjs';
import { AGENTES_ENTRENAMIENTO, generarRobots } from '../src/lib/seo/robots.mjs';

const registroReal = JSON.parse(readFileSync(new URL('../src/config/lanzamiento.json', import.meta.url), 'utf8'));
const hoy = new Date('2026-11-07T12:00:00Z');
const aprobado = {
  autorizacion: { autorizadoPor: 'Persona de prueba', fecha: '2026-11-01' },
  requisitos: Object.fromEntries(Object.keys(REQUISITOS).map(k => [k, { estado: 'aprobado', responsable: 'Prueba', fecha: '2026-11-01', evidencia: 'Acta de prueba' }]))
};
const produccion = { SITE_ENV: 'production', PUBLIC_SITE_URL: 'https://evelynelizondo.com', SEO_INDEXING_ENABLED: 'true' };

test.describe('política de indexación', () => {
  test('sin variables, nunca indexa', () => {
    expect(resolverIndexacion({}, aprobado, hoy)).toMatchObject({ entorno: 'development', indexable: false });
  });

  test('producción sin la petición expresa no indexa, aunque todo esté aprobado', () => {
    expect(resolverIndexacion({ ...produccion, SEO_INDEXING_ENABLED: undefined }, aprobado, hoy).indexable).toBe(false);
  });

  test('el registro del repositorio no autoriza el lanzamiento', () => {
    expect(requisitosPendientes(registroReal, hoy).length).toBeGreaterThan(0);
    expect(() => resolverIndexacion(produccion, registroReal, hoy)).toThrow(/requisitos de lanzamiento/);
  });

  for (const entorno of ['development', 'preview', 'staging']) {
    test(`${entorno} no puede indexar ni con la bandera`, () => {
      expect(() => resolverIndexacion({ ...produccion, SITE_ENV: entorno }, aprobado, hoy)).toThrow(/solo production/);
    });
  }

  test('otro dominio no puede indexar', () => {
    expect(() => resolverIndexacion({ ...produccion, PUBLIC_SITE_URL: 'https://evelyn-elizondo.workers.dev' }, aprobado, hoy)).toThrow(/PUBLIC_SITE_URL/);
  });

  test('un requisito aprobado sin evidencia, o con fecha futura, no cuenta', () => {
    const sinEvidencia = structuredClone(aprobado);
    sinEvidencia.requisitos.dnssec.evidencia = '';
    expect(() => resolverIndexacion(produccion, sinEvidencia, hoy)).toThrow(/dnssec/);
    const futura = structuredClone(aprobado);
    futura.requisitos.revisionJuridica.fecha = '2027-01-01';
    expect(() => resolverIndexacion(produccion, futura, hoy)).toThrow(/revisionJuridica/);
  });

  test('la bandera anterior ya no activa nada por sí sola', () => {
    expect(() => resolverIndexacion({ PUBLIC_SITE_READY: 'true' }, aprobado, hoy)).toThrow(/PUBLIC_SITE_READY/);
  });

  test('valores ambiguos de la bandera se rechazan', () => {
    expect(() => resolverIndexacion({ ...produccion, SEO_INDEXING_ENABLED: '1' }, aprobado, hoy)).toThrow(/solo admite/);
  });

  test('con todo cumplido, producción indexa', () => {
    expect(resolverIndexacion(produccion, aprobado, hoy).indexable).toBe(true);
  });

  test('robots por página', () => {
    expect(robotsDePagina({ indexable: false })).toBe('noindex, nofollow');
    expect(robotsDePagina({ indexable: true, excluida: true })).toBe('noindex, follow');
    expect(robotsDePagina({ indexable: true, revision: 'pendiente' })).toBe('noindex, follow');
    expect(robotsDePagina({ indexable: true, revision: 'aprobada' })).toMatch(/^index, follow/);
  });
});

test.describe('robots.txt', () => {
  // Un grupo son las líneas User-agent seguidas de sus reglas; los grupos se separan con una línea en blanco.
  const grupos = (txt: string) => txt.split(/\n\s*\n/).map(g => g.split('\n').filter(l => !l.startsWith('#')).join('\n')).filter(g => g.startsWith('User-agent'));
  test('antes del lanzamiento deja leer el noindex y no anuncia el sitemap', () => {
    const txt = generarRobots({ indexable: false, sitemap: 'https://evelynelizondo.com/sitemap.xml' });
    const general = grupos(txt).find(g => g.startsWith('User-agent: *'))!;
    expect(general).toContain('Allow: /');
    expect(general).not.toMatch(/^Disallow: \/$/m);
    expect(txt).not.toContain('Sitemap:');
    expect(grupos(txt).find(g => g.includes('OAI-SearchBot'))).toMatch(/^Disallow: \/$/m);
  });

  test('después del lanzamiento anuncia el sitemap y permite la búsqueda con IA', () => {
    const txt = generarRobots({ indexable: true, sitemap: 'https://evelynelizondo.com/sitemap.xml' });
    expect(txt).toContain('Sitemap: https://evelynelizondo.com/sitemap.xml');
    expect(txt).not.toContain('OAI-SearchBot');
  });

  test('el entrenamiento sigue bloqueado mientras no se decida lo contrario', () => {
    for (const indexable of [false, true]) {
      const g = grupos(generarRobots({ indexable, sitemap: '' })).find(g => g.includes('User-agent: GPTBot'))!;
      for (const a of AGENTES_ENTRENAMIENTO) expect(g).toContain(`User-agent: ${a}`);
      expect(g).toMatch(/^Disallow: \/$/m);
    }
  });
});

test.describe('X-Robots-Tag tras el lanzamiento', () => {
  test('las reglas agrupadas nunca alcanzan una página indexable', async () => {
    const { agruparExcluidas } = await import('../src/lib/seo/cabeceras-robots.mjs');
    const robots: Record<string, string> = {
      '/': 'index, follow', '/blog': 'index, follow', '/blog/categoria/divorcio': 'index, follow',
      '/blog/a': 'noindex, follow', '/blog/b': 'noindex, follow', '/blog/etiqueta/x': 'noindex, follow', '/blog/etiqueta/y': 'noindex, follow',
      '/servicios': 'index, follow', '/servicios/a': 'noindex, follow', '/servicios/b': 'noindex, follow', '/404': 'noindex, follow'
    };
    const reglas = agruparExcluidas(robots) as [string, string][];
    expect(reglas.map(r => r[0])).toEqual(expect.arrayContaining(['/servicios/*', '/blog/etiqueta/*', '/blog/a', '/blog/b', '/404']));
    expect(reglas.map(r => r[0])).not.toContain('/blog/*');
    for (const [regla, valor] of reglas)
      for (const [ruta, v] of Object.entries(robots)) {
        const alcanza = regla.endsWith('*') ? ruta.startsWith(regla.slice(0, -1)) : ruta === regla;
        if (alcanza) expect(v, `${regla} → ${ruta}`).toBe(valor);
      }
  });
});
