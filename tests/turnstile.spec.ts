// Turnstile: la verificación en el servidor (Siteverify) y su uso en el endpoint del formulario.
// No llama a Cloudflare: Siteverify se simula. La integración real con las claves de prueba se documenta
// en docs/security/turnstile-implementation.md.
import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { verificarTurnstile, esSecretoDePrueba, turnstileActivo, LARGO_MAXIMO } from '../src/lib/turnstile';

const SECRETO_REAL = '0x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // Formato de una clave real; no existe.
const PRUEBA_OK = '1x0000000000000000000000000000000AA';
const ahora = Date.parse('2026-11-08T12:00:00Z');

const falso = (cuerpo: object, status = 200) => {
  const llamadas: URLSearchParams[] = [];
  const f = (async (_u: string, init: RequestInit) => {
    llamadas.push(init.body as URLSearchParams);
    return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { f, llamadas };
};
const valida = { success: true, hostname: 'evelynelizondo.com', action: 'consulta', challenge_ts: '2026-11-08T11:59:00Z', 'error-codes': [] };
const base = { secreto: SECRETO_REAL, hostEsperado: 'evelynelizondo.com', ahora, token: 'token-de-prueba' };

test.describe('verificarTurnstile (unidad)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'basta una ejecución'));

  test('acepta un token válido y envía secreto, token e IP a Siteverify', async () => {
    const { f, llamadas } = falso(valida);
    expect(await verificarTurnstile({ ...base, ip: '203.0.113.7', fetchImpl: f })).toEqual({ ok: true });
    expect(llamadas[0].get('secret')).toBe(SECRETO_REAL);
    expect(llamadas[0].get('response')).toBe('token-de-prueba');
    expect(llamadas[0].get('remoteip')).toBe('203.0.113.7');
  });

  test('sin secreto no acepta nada', async () => {
    expect(await verificarTurnstile({ ...base, secreto: '' })).toEqual({ ok: false, motivo: 'sin_configurar' });
  });

  test('token ausente, vacío, no textual o demasiado largo: no consulta a Cloudflare', async () => {
    const { f, llamadas } = falso(valida);
    for (const token of [undefined, '', 42, ['a']]) expect((await verificarTurnstile({ ...base, token, fetchImpl: f })).ok).toBe(false);
    expect(await verificarTurnstile({ ...base, token: 'x'.repeat(LARGO_MAXIMO + 1), fetchImpl: f })).toEqual({ ok: false, motivo: 'invalido' });
    expect(llamadas).toHaveLength(0);
  });

  test('rechaza un token de otro sitio, de otra acción o demasiado antiguo', async () => {
    expect(await verificarTurnstile({ ...base, fetchImpl: falso({ ...valida, hostname: 'otro.example' }).f })).toEqual({ ok: false, motivo: 'host' });
    expect(await verificarTurnstile({ ...base, fetchImpl: falso({ ...valida, action: 'login' }).f })).toEqual({ ok: false, motivo: 'accion' });
    expect(await verificarTurnstile({ ...base, fetchImpl: falso({ ...valida, challenge_ts: '2026-11-08T11:50:00Z' }).f })).toEqual({ ok: false, motivo: 'caducado' });
    expect(await verificarTurnstile({ ...base, fetchImpl: falso({ ...valida, challenge_ts: undefined }).f })).toEqual({ ok: false, motivo: 'caducado' });
  });

  test('traduce los códigos de error de Siteverify', async () => {
    const caso = async (codigos: string[]) => verificarTurnstile({ ...base, fetchImpl: falso({ success: false, 'error-codes': codigos }).f });
    expect(await caso(['timeout-or-duplicate'])).toEqual({ ok: false, motivo: 'caducado' });
    expect(await caso(['invalid-input-secret'])).toEqual({ ok: false, motivo: 'sin_configurar' });
    expect(await caso(['invalid-input-response'])).toEqual({ ok: false, motivo: 'invalido' });
    expect(await caso([])).toEqual({ ok: false, motivo: 'rechazado' });
    // success debe ser exactamente true.
    expect(await verificarTurnstile({ ...base, fetchImpl: falso({ ...valida, success: 'true' }).f })).toEqual({ ok: false, motivo: 'rechazado' });
  });

  test('si Siteverify falla o no responde, no se acepta el envío', async () => {
    expect(await verificarTurnstile({ ...base, fetchImpl: falso(valida, 500).f })).toEqual({ ok: false, motivo: 'no_disponible' });
    const roto = (async () => { throw new TypeError('red'); }) as unknown as typeof fetch;
    expect(await verificarTurnstile({ ...base, fetchImpl: roto })).toEqual({ ok: false, motivo: 'no_disponible' });
    const lento = ((_u: string, init: RequestInit) =>
      new Promise((_, mal) => init.signal?.addEventListener('abort', () => mal(new DOMException('abort', 'AbortError'))))) as unknown as typeof fetch;
    expect(await verificarTurnstile({ ...base, fetchImpl: lento, tiempoMaximoMs: 50 })).toEqual({ ok: false, motivo: 'no_disponible' });
  });

  test('las claves de prueba oficiales se reconocen y las reales no', async () => {
    expect(esSecretoDePrueba(PRUEBA_OK)).toBe(true);
    expect(esSecretoDePrueba('2x0000000000000000000000000000000AA')).toBe(true);
    expect(esSecretoDePrueba(SECRETO_REAL)).toBe(false);
    // Con clave de prueba, Cloudflare devuelve otro hostname: no se exige el del sitio.
    expect(await verificarTurnstile({ ...base, secreto: PRUEBA_OK, fetchImpl: falso({ success: true, hostname: 'example.com' }).f })).toEqual({ ok: true });
  });
});

test.describe('endpoint con Turnstile obligatorio (servidor Node)', () => {

  const formulario = { nombre: 'Persona de Prueba', correo: 'p@example.test', tipo: 'Divorcio', mensaje: 'Mensaje suficientemente largo para la prueba.', consentimiento: 'on' };
  let respuesta: { status: number; cuerpo: object } = { status: 200, cuerpo: { success: true } };
  const recibidos: string[] = [];
  const simulado = http.createServer((req, res) => {
    let datos = '';
    req.on('data', c => (datos += c));
    req.on('end', () => {
      recibidos.push(new URLSearchParams(datos).get('response') ?? '');
      res.writeHead(respuesta.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(respuesta.cuerpo));
    });
  });
  let srv: ReturnType<typeof spawn>;
  const origen = 'http://127.0.0.1:4328';

  test.describe.configure({ mode: 'serial' });
  test.beforeAll(async ({ request }, info) => {
    test.skip(info.project.name !== 'escritorio' || process.env.SERVIDOR === 'cloudflare', 'una ejecución, en Node');
    await new Promise<void>(r => simulado.listen(4329, '127.0.0.1', () => r()));
    srv = spawn('node', ['scripts/servidor.mjs'], {
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: '4328',
        MAIL_MODE: 'outbox',
        MAIL_TO: 'pruebas@example.test',
        RATE_LIMIT_MAX: '500',
        TURNSTILE_MODE: 'required',
        TURNSTILE_SECRET_KEY: PRUEBA_OK,
        TURNSTILE_VERIFY_URL: 'http://127.0.0.1:4329/siteverify'
      },
      stdio: 'ignore'
    });
    await expect.poll(async () => (await request.get(`${origen}/`).catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
  });
  test.afterAll(() => {
    srv?.kill();
    if (simulado.listening) simulado.close();
  });

  const enviar = (request: import('@playwright/test').APIRequestContext, extra: Record<string, string> = {}) =>
    request.post(`${origen}/api/consulta`, { headers: { accept: 'application/json', origin: origen }, form: { ...formulario, ...extra } });

  test('sin token no se envía y no se consulta a Cloudflare', async ({ request }) => {
    const antes = recibidos.length;
    const res = await enviar(request);
    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({ ok: false, verificacion: true });
    expect(recibidos.length).toBe(antes);
  });

  test('un formulario inválido no gasta el token', async ({ request }) => {
    const antes = recibidos.length;
    const res = await enviar(request, { correo: 'mal', 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(422);
    expect(recibidos.length).toBe(antes);
  });

  test('con un token aprobado por Siteverify se envía', async ({ request }) => {
    respuesta = { status: 200, cuerpo: { success: true, hostname: 'example.com', 'error-codes': [] } };
    const res = await enviar(request, { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(200);
    expect(recibidos.at(-1)).toBe('XXXX.DUMMY.TOKEN.XXXX');
  });

  test('un token reutilizado o rechazado no se envía', async ({ request }) => {
    respuesta = { status: 200, cuerpo: { success: false, 'error-codes': ['timeout-or-duplicate'] } };
    expect((await enviar(request, { 'cf-turnstile-response': 'usado' })).status()).toBe(403);
    respuesta = { status: 200, cuerpo: { success: false, 'error-codes': ['invalid-input-response'] } };
    expect((await enviar(request, { 'cf-turnstile-response': 'falso' })).status()).toBe(403);
  });

  test('si Siteverify falla, responde 503 y no finge éxito', async ({ request }) => {
    respuesta = { status: 502, cuerpo: {} };
    const res = await enviar(request, { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(503);
    expect((await res.json()).ok).toBe(false);
  });

  test('sin JavaScript también se rechaza, con redirección a la página de error', async ({ request }) => {
    const res = await request.post(`${origen}/api/consulta`, { headers: { origin: origen }, form: formulario, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers().location).toBe('/consulta-no-enviada');
  });
});

test.describe('modo de Turnstile', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'basta una ejecución'));

  test('TURNSTILE_MODE=off solo tiene efecto en una dirección local', () => {
    expect(turnstileActivo('off', new URL('http://127.0.0.1:4325/api/consulta'))).toBe(false);
    expect(turnstileActivo('OFF', new URL('http://localhost:4321/api/consulta'))).toBe(false);
    expect(turnstileActivo('off', new URL('https://evelynelizondo.com/api/consulta'))).toBe(true);
    expect(turnstileActivo('off', new URL('https://localhost.evelynelizondo.com/api/consulta'))).toBe(true);
    expect(turnstileActivo(undefined, new URL('http://127.0.0.1:4325/api/consulta'))).toBe(true);
    expect(turnstileActivo('required', new URL('http://127.0.0.1:4325/api/consulta'))).toBe(true);
  });
});
