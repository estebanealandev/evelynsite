// Límite de envíos real: un servidor propio con un cupo muy bajo.
import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';

test('el límite no se evade con X-Forwarded-For y no aparenta éxito si no hay correo', async ({ request }, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const base = 'http://127.0.0.1:4331';
  const srv = spawn('node', ['scripts/servidor.mjs'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '4331', MAIL_MODE: 'disabled', RATE_LIMIT_MAX: '2' }, stdio: 'ignore' });
  try {
    await expect.poll(async () => (await request.get(`${base}/`).catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
    const form = { nombre: 'Persona de Prueba', correo: 'p@example.test', tipo: 'Divorcio', mensaje: 'Mensaje suficientemente largo para la prueba.', consentimiento: 'on' };
    const estados: number[] = [];
    for (const ip of ['203.0.113.1', '203.0.113.2', '203.0.113.3']) {
      const r = await request.post(`${base}/api/consulta`, { headers: { accept: 'application/json', origin: base, 'x-forwarded-for': ip }, form });
      estados.push(r.status());
      if (r.status() === 200) throw new Error('Sin correo configurado no puede responder con éxito');
    }
    // Sin SMTP cada envío falla con 503; el tercero ya supera el cupo aunque cambie la cabecera.
    expect(estados).toEqual([503, 503, 429]);
  } finally {
    srv.kill();
  }
});
