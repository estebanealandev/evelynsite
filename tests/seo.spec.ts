// SEO técnico sobre la compilación servida: indexación, cabeceras, canonical, sitemap y JSON-LD.
import { expect, test } from '@playwright/test';
import { principales } from './routes';

const meta = (html: string, n: string) => html.match(new RegExp(`<meta name="${n}" content="([^"]+)"`))?.[1];
const canonical = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const grafo = (html: string) => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  expect(bloques).toHaveLength(1);
  return bloques[0]['@graph'] as any[];
};
const excluidas = ['/consulta-recibida', '/consulta-no-enviada', '/blog/etiqueta/gananciales'];
const pendientes = ['/servicios/divorcios', '/blog/divorcio-mutuo-consentimiento-costa-rica', '/orientacion/alternativas-para-divorciarse'];

test.describe('indexación bloqueada antes del lanzamiento', () => {
  for (const ruta of new Set([...principales, ...excluidas, ...pendientes])) {
    test(`${ruta}: noindex en la meta y en X-Robots-Tag, sin contradicción`, async ({ request }) => {
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      const etiqueta = meta(html, 'robots');
      expect(etiqueta).toMatch(/noindex/);
      expect(res.headers()['x-robots-tag']).toBe(etiqueta);
      // Canonical absoluto y autorreferencial.
      const c = canonical(html)!;
      expect(c).toMatch(/^https?:\/\//);
      expect(new URL(c).pathname).toBe(ruta);
    });
  }

  test('la 404 y las respuestas generadas también llevan noindex', async ({ request }) => {
    const r404 = await request.get('/esta-ruta-no-existe');
    expect(r404.status()).toBe(404);
    expect(meta(await r404.text(), 'robots')).toMatch(/noindex/);
    expect(r404.headers()['x-robots-tag']).toMatch(/noindex/);
  });

  test('los recursos estáticos llevan X-Robots-Tag', async ({ request }) => {
    for (const r of ['/assets/brand/og-default.jpg', '/robots.txt', '/sitemap.xml']) {
      const res = await request.get(r);
      expect(res.status(), r).toBe(200);
      expect(res.headers()['x-robots-tag'], r).toMatch(/noindex/);
    }
  });

  test('robots.txt deja rastrear para leer el noindex y no anuncia el sitemap', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text();
    const general = txt.split(/\n\s*\n/).find(g => g.startsWith('User-agent: *'))!;
    expect(general).toContain('Allow: /');
    expect(general).not.toMatch(/^Disallow: \/$/m);
    expect(txt).not.toContain('Sitemap:');
  });
});

test.describe('sitemap', () => {
  test('solo URL canónicas, existentes y elegibles', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    expect(locs.length).toBeGreaterThan(8);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) {
      const ruta = new URL(loc).pathname;
      expect(ruta === '/' || !ruta.endsWith('/'), loc).toBe(true);
      expect(excluidas.concat(pendientes)).not.toContain(ruta);
      expect(ruta).not.toMatch(/^\/blog\/etiqueta\//);
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status(), loc).toBe(200);
      expect(canonical(await res.text()), loc).toBe(loc);
    }
    const hoy = new Date().toISOString().slice(0, 10);
    for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) expect(m[1] <= hoy).toBe(true);
  });
});

test.describe('datos estructurados', () => {
  test('grafo único con referencias resueltas y sin datos sin confirmar', async ({ request }) => {
    for (const ruta of ['/', '/servicios/divorcios', '/blog/divorcio-mutuo-consentimiento-costa-rica', '/sobre-evelyn', '/contacto', '/blog']) {
      const html = await (await request.get(ruta)).text();
      const nodos = grafo(html);
      const ids = nodos.map(n => n['@id']);
      expect(new Set(ids).size, ruta).toBe(ids.length);
      for (const ref of JSON.stringify(nodos).matchAll(/\{"@id":"([^"]+)"\}/g)) expect(ids, `${ruta} → ${ref[1]}`).toContain(ref[1]);
      const texto = JSON.stringify(nodos);
      for (const prohibido of ['aggregateRating', '"review"', '"award"', 'FAQPage', 'telephone', 'address', 'sameAs'])
        expect(texto, `${ruta}: ${prohibido}`).not.toContain(prohibido);
      // Sin perfil aprobado no se declara un servicio jurídico ni una persona.
      expect(nodos.some(n => ['LegalService', 'Service', 'Person'].includes(n['@type'])), ruta).toBe(false);
      const pagina = nodos.find(n => n['@id'].endsWith('#webpage'));
      expect(pagina.url).toBe(canonical(html));
      expect(pagina.inLanguage).toBe('es-CR');
    }
  });

  test('cada tipo de página declara el tipo que le corresponde', async ({ request }) => {
    const tipos: Record<string, string> = { '/sobre-evelyn': 'AboutPage', '/contacto': 'ContactPage', '/blog': 'CollectionPage', '/servicios/divorcios': 'WebPage' };
    for (const [ruta, tipo] of Object.entries(tipos)) {
      const nodos = grafo(await (await request.get(ruta)).text());
      expect(nodos.find(n => n['@id'].endsWith('#webpage'))['@type'], ruta).toBe(tipo);
    }
  });

  test('el artículo no declara autoría sin confirmar y su imagen existe', async ({ request }) => {
    const html = await (await request.get('/blog/divorcio-mutuo-consentimiento-costa-rica')).text();
    const articulo = grafo(html).find(n => n['@type'] === 'Article');
    expect(articulo.author).toBeUndefined();
    expect(articulo.dateModified >= articulo.datePublished).toBe(true);
    const imagen = await request.get(new URL(articulo.image).pathname);
    expect(imagen.status()).toBe(200);
    expect(imagen.headers()['content-type']).toContain('image/jpeg');
    expect(html).toContain('<meta property="article:published_time"');
  });

  test('las migas terminan en la página actual', async ({ request }) => {
    const html = await (await request.get('/servicios/divorcios')).text();
    const migas = grafo(html).find(n => n['@type'] === 'BreadcrumbList');
    expect(migas.itemListElement.at(-1).item).toBe(canonical(html));
    expect(migas.itemListElement[0].name).toBe('Inicio');
  });
});

test.describe('canonicalización', () => {
  test('parámetros de seguimiento no cambian el canonical', async ({ request }) => {
    const html = await (await request.get('/servicios/divorcios?utm_source=prueba&gclid=1')).text();
    expect(new URL(canonical(html)!).search).toBe('');
  });

  test('/home redirige de forma permanente a la portada', async ({ request }) => {
    const res = await request.get('/home', { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(new URL(res.headers().location, 'http://x').pathname).toBe('/');
  });

  test('la barra final redirige a la URL canónica', async ({ request }) => {
    const res = await request.get('/servicios/?a=1', { maxRedirects: 0 });
    // Node responde 301. Workers Static Assets responde 307 (html_handling), hasta aplicar la regla de zona
    // propuesta en ops/cloudflare/regla-barra-final.json.
    expect([301, 307, 308]).toContain(res.status());
    expect(res.headers().location).toMatch(/^(https?:\/\/[^/]+)?\/servicios(\?a=1)?$/);
    const final = await request.get('/servicios/');
    expect(final.status()).toBe(200);
    expect(new URL(final.url()).pathname).toBe('/servicios');
  });

  test('Open Graph completo en HTML inicial', async ({ request }) => {
    const html = await (await request.get('/servicios/pensiones-alimentarias')).text();
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:locale'])
      expect(html, p).toMatch(new RegExp(`<meta property="${p}" content="[^"]+"`));
    expect(html).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
  });
});
