// Comprueba el estado honesto del formulario cuando no hay proveedor de correo configurado.
import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';

test('sin proveedor configurado devuelve 503 y no finge éxito', async ({ request }, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const srv = spawn('node', ['./dist/server/entry.mjs'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '4326', MAIL_MODE: 'disabled' }, stdio: 'ignore' });
  try {
    await expect.poll(async () => (await request.get('http://127.0.0.1:4326/').catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
    const res = await request.post('http://127.0.0.1:4326/api/consulta', {
      headers: { accept: 'application/json', origin: 'http://127.0.0.1:4326' },
      form: { nombre: 'Persona de Prueba', correo: 'p@example.test', tipo: 'Divorcio', mensaje: 'Mensaje suficientemente largo para la prueba.', consentimiento: 'on' }
    });
    expect(res.status()).toBe(503);
    expect((await res.json()).ok).toBe(false);
  } finally {
    srv.kill();
  }
});
