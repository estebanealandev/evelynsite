// Contenido jurídico: matriz, vigencia, frases prohibidas y páginas nuevas.
import { expect, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { getRutas } from './rutas-contenido';

test('la matriz jurídica está completa y sus citas coinciden con la norma oficial', ({}, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const r = spawnSync(process.execPath, ['scripts/normas/verificar.mjs'], { encoding: 'utf8' });
  expect(r.stdout.split('\n').filter(l => l.startsWith('ERROR')).join('\n')).toBe('');
  expect(r.status).toBe(0);
});

test('cada norma guardada es la última versión', ({}, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const reg = JSON.parse(readFileSync('docs/auditoria-evelyn/normas/registro.json', 'utf8'));
  for (const [clave, n] of Object.entries<any>(reg.normas)) {
    const [a, b] = n.version.split(' de ');
    expect(a, clave).toBe(b);
  }
});

const PROHIBIDO = /acompañamos en cada paso|cada familia es única|soluciones (legales )?a (tu|su) medida|protegemos lo que más importa|atención integral|soluciones integrales|estamos aquí para|nuestro equipo|brindamos|le acompañamos/i;

test.describe('texto publicado', () => {
  test.skip(({ isMobile }) => isMobile, 'el texto es el mismo en móvil');
  for (const ruta of getRutas()) {
    test(`${ruta}: sin frases prohibidas y sin la Ley 7654 como vigente`, async ({ request }) => {
      const html = await (await request.get(ruta)).text();
      const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      expect(texto).not.toMatch(PROHIBIDO);
      for (const m of texto.matchAll(/.{0,160}(?:Ley N?\.?º? ?7654|Ley de Pensiones Alimentarias).{0,160}/g)) expect(m[0], m[0]).toMatch(/derog/i);
      expect(texto).not.toMatch(/proyecto.{0,40}23\.?982.{0,60}(está vigente|ya es ley)/i);
    });
  }
});

test.describe('páginas nuevas', () => {
  test('la biblioteca enlaza a la fuente oficial de cada norma', async ({ page }) => {
    await page.goto('/biblioteca-juridica');
    const enlaces = page.getByRole('link', { name: 'Texto oficial en SINALEVI' });
    expect(await enlaces.count()).toBeGreaterThanOrEqual(6);
    for (const h of await enlaces.evaluateAll(a => a.map(e => (e as HTMLAnchorElement).href))) expect(h).toMatch(/^https:\/\/sinalevi\.go\.cr\//);
  });

  test('el sitemap deja fuera las guías sin aprobación y estas aclaran sus límites', async ({ page, request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    // Las guías están pendientes de revisión profesional: no entran al sitemap hasta su aprobación.
    expect(xml).not.toContain('/orientacion/recibi-una-notificacion-judicial');
    expect(xml).toContain('/biblioteca-juridica');
    expect(xml).not.toContain('/blog/etiqueta/');
    await page.goto('/orientacion/recibi-una-notificacion-judicial');
    await expect(page.locator('.notice')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Qué conviene reunir' })).toBeVisible();
  });

  test('las páginas de etiqueta no se indexan', async ({ request }) => {
    const xml = await (await request.get('/blog')).text();
    const m = xml.match(/\/blog\/etiqueta\/[a-z0-9-]+/);
    if (m) expect(await (await request.get(m[0])).text()).toMatch(/name="robots" content="noindex/);
  });
});
