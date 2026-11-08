// Prueba el camino real de envío: formulario -> API -> nodemailer -> servidor SMTP local.
import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import { SMTPServer } from 'smtp-server';

test('envía por SMTP y neutraliza la inyección de cabeceras', async ({ request }, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const recibidos: { to: string[]; data: string }[] = [];
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, session, cb) {
      let data = '';
      stream.on('data', c => (data += c));
      stream.on('end', () => {
        recibidos.push({ to: session.envelope.rcptTo.map(r => r.address), data });
        cb();
      });
    }
  });
  await new Promise<void>(r => smtp.listen(2526, '127.0.0.1', () => r()));
  const srv = spawn('node', ['scripts/servidor.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '4327', MAIL_MODE: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_ALLOW_PLAINTEXT: 'true', SMTP_PORT: '2526', MAIL_TO: 'destino@example.test', MAIL_FROM: 'sitio@example.test' },
    stdio: 'ignore'
  });
  try {
    await expect.poll(async () => (await request.get('http://127.0.0.1:4327/').catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
    const res = await request.post('http://127.0.0.1:4327/api/consulta', {
      headers: { accept: 'application/json', origin: 'http://127.0.0.1:4327' },
      form: {
        nombre: 'Ana\r\nBcc: intruso@example.test',
        correo: 'persona@example.test',
        tipo: 'Divorcio',
        mensaje: 'Mensaje de prueba <script>alert(1)</script> con longitud suficiente.',
        consentimiento: 'on'
      }
    });
    expect(res.status()).toBe(200);
    await expect.poll(() => recibidos.length).toBe(1);
    expect(recibidos[0].to).toEqual(['destino@example.test']);
    const correo = recibidos[0].data;
    expect(correo).toContain('Reply-To: persona@example.test');
    expect(correo).not.toMatch(/^Bcc:/im);
    expect(correo).not.toContain('<script>');
  } finally {
    srv.kill();
    await new Promise<void>(r => smtp.close(() => r()));
  }
});

// Prueba 10 (estado G): el proveedor rechaza el mensaje. Error honesto (502), nunca éxito.
test('si el servidor de correo rechaza el mensaje, responde 502 y no finge éxito', async ({ request }, info) => {
  test.skip(info.project.name !== 'escritorio', 'basta una ejecución');
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, _session, cb) {
      stream.resume();
      stream.on('end', () => cb(Object.assign(new Error('Buzón no disponible'), { responseCode: 550 })));
    }
  });
  await new Promise<void>(r => smtp.listen(2527, '127.0.0.1', () => r()));
  const srv = spawn('node', ['scripts/servidor.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '4336', MAIL_MODE: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_ALLOW_PLAINTEXT: 'true', SMTP_PORT: '2527', MAIL_TO: 'destino@example.test', MAIL_FROM: 'sitio@example.test' },
    stdio: 'ignore'
  });
  try {
    await expect.poll(async () => (await request.get('http://127.0.0.1:4336/').catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
    const form = { nombre: 'Persona de Prueba', correo: 'persona@example.test', tipo: 'Divorcio', mensaje: 'Mensaje de prueba con longitud suficiente.', consentimiento: 'on' };
    const res = await request.post('http://127.0.0.1:4336/api/consulta', { headers: { accept: 'application/json', origin: 'http://127.0.0.1:4336' }, form });
    expect(res.status()).toBe(502);
    const j = await res.json();
    expect(j.ok).toBe(false);
    expect(j.mensaje).toContain('no se ha enviado');
    // Sin JavaScript: a la página de error, nunca a la de confirmación.
    const sinJs = await request.post('http://127.0.0.1:4336/api/consulta', { headers: { origin: 'http://127.0.0.1:4336' }, form, maxRedirects: 0 });
    expect(sinJs.status()).toBe(303);
    expect(sinJs.headers().location).toBe('/consulta-no-enviada');
  } finally {
    srv.kill();
    await new Promise<void>(r => smtp.close(() => r()));
  }
});
