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
  const srv = spawn('node', ['./dist/server/entry.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '4327', MAIL_MODE: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2526', MAIL_TO: 'destino@example.test', MAIL_FROM: 'sitio@example.test' },
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
