// Turnstile: la verificación en el servidor (Siteverify) y su uso en el endpoint del formulario.
// No llama a Cloudflare: Siteverify se simula. La integración real con las claves de prueba se documenta
// en docs/security/turnstile-implementation.md.
import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { verificarTurnstile, esSecretoDePrueba, esClavePublicaDePrueba, turnstileActivo, LARGO_MAXIMO } from '../src/lib/turnstile';
import { comprobarActivacion, pendientesFormulario, REQUISITOS_COMPILACION } from '../src/config/formulario.mjs';

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
// Responde en orden cada cuerpo de la lista (el último se repite) y anota cada llamada.
const secuencia = (...cuerpos: (object | number)[]) => {
  const llamadas: URLSearchParams[] = [];
  const f = (async (_u: string, init: RequestInit) => {
    llamadas.push(init.body as URLSearchParams);
    const c = cuerpos[Math.min(llamadas.length - 1, cuerpos.length - 1)];
    if (typeof c === 'number') return new Response('', { status: c });
    return new Response(JSON.stringify(c), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { f, llamadas };
};

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
    expect(await caso(['missing-input-response'])).toEqual({ ok: false, motivo: 'falta' });
    expect(await caso(['bad-request'])).toEqual({ ok: false, motivo: 'invalido' });
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

  test('internal-error y fallos de red: un solo reintento con la misma clave de idempotencia', async () => {
    const recuperado = secuencia({ success: false, 'error-codes': ['internal-error'] }, valida);
    expect(await verificarTurnstile({ ...base, fetchImpl: recuperado.f })).toEqual({ ok: true });
    expect(recuperado.llamadas).toHaveLength(2);
    const clave = recuperado.llamadas[0].get('idempotency_key');
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);
    expect(recuperado.llamadas[1].get('idempotency_key')).toBe(clave);
    // Dos fallos seguidos: no disponible (503), nunca un rechazo atribuido a la persona.
    const caido = secuencia({ success: false, 'error-codes': ['internal-error'] });
    expect(await verificarTurnstile({ ...base, fetchImpl: caido.f })).toEqual({ ok: false, motivo: 'no_disponible' });
    expect(caido.llamadas).toHaveLength(2);
    const red = secuencia(503, valida);
    expect(await verificarTurnstile({ ...base, fetchImpl: red.f })).toEqual({ ok: true });
    // Un rechazo definitivo no se reintenta.
    const rechazo = secuencia({ success: false, 'error-codes': ['invalid-input-response'] });
    await verificarTurnstile({ ...base, fetchImpl: rechazo.f });
    expect(rechazo.llamadas).toHaveLength(1);
  });

  test('respuestas inesperadas de Siteverify no se aceptan', async () => {
    for (const cuerpo of [null, 'texto', [], { success: 1 }, { ...valida, hostname: undefined }, { ...valida, challenge_ts: 12345 }])
      expect((await verificarTurnstile({ ...base, fetchImpl: falso(cuerpo as object).f })).ok).toBe(false);
  });

  test('las claves de prueba oficiales se reconocen y las reales no', async () => {
    expect(esSecretoDePrueba(PRUEBA_OK)).toBe(true);
    expect(esSecretoDePrueba('2x0000000000000000000000000000000AA')).toBe(true);
    expect(esSecretoDePrueba(SECRETO_REAL)).toBe(false);
    for (const k of ['1x00000000000000000000AA', '2x00000000000000000000AB', '1x00000000000000000000BB', '2x00000000000000000000BB', '3x00000000000000000000FF'])
      expect(esClavePublicaDePrueba(k)).toBe(true);
    expect(esClavePublicaDePrueba('0x4AAAAAAAAAAAAAAAAAAAAA')).toBe(false);
    // En una máquina local, Cloudflare devuelve example.com con la clave de prueba: no se exige el host del sitio.
    expect(await verificarTurnstile({ ...base, hostEsperado: '127.0.0.1', secreto: PRUEBA_OK, fetchImpl: falso({ success: true, hostname: 'example.com' }).f })).toEqual({ ok: true });
  });

  test('una clave secreta de prueba en el dominio real se rechaza sin consultar a Cloudflare', async () => {
    const { f, llamadas } = falso({ success: true, hostname: 'example.com' });
    for (const host of ['evelynelizondo.com', 'staging.evelynelizondo.com', 'localhost.evelynelizondo.com'])
      expect(await verificarTurnstile({ ...base, hostEsperado: host, secreto: PRUEBA_OK, token: 'XXXX.DUMMY.TOKEN.XXXX', fetchImpl: f })).toEqual({ ok: false, motivo: 'clave_de_prueba' });
    expect(llamadas).toHaveLength(0);
  });
});

test.describe('activación del formulario (compilación)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'basta una ejecución'));
  const hoy = new Date('2026-11-08');
  const aprobado = { estado: 'aprobado', responsable: 'Persona responsable', fecha: '2026-11-08', evidencia: 'Acta de prueba' };
  const todo = { requisitos: Object.fromEntries(Object.keys(REQUISITOS_COMPILACION).map(k => [k, aprobado])) };
  const registro = JSON.parse(readFileSync('src/config/formulario.json', 'utf8'));

  test('sin clave pública el formulario queda cerrado; fuera de producción no se exige el registro', () => {
    expect(comprobarActivacion({ entorno: 'production', clave: '' }, registro, hoy).activo).toBe(false);
    expect(comprobarActivacion({ entorno: 'development', clave: '1x00000000000000000000AA' }, registro, hoy).activo).toBe(true);
  });

  test('producción rechaza claves de prueba y requisitos sin aprobar', () => {
    expect(() => comprobarActivacion({ entorno: 'production', clave: '1x00000000000000000000AA' }, todo, hoy)).toThrow(/clave de prueba/);
    expect(() => comprobarActivacion({ entorno: 'production', clave: '0x4AAAAAAAAAAAAAAAAAAAAA' }, registro, hoy)).toThrow(/correoDestino[\s\S]*widgetProduccion[\s\S]*politicaPrivacidad/);
    expect(comprobarActivacion({ entorno: 'production', clave: '0x4AAAAAAAAAAAAAAAAAAAAA' }, todo, hoy).activo).toBe(true);
  });

  test('un requisito «aprobado» sin responsable, fecha válida o evidencia no cuenta', () => {
    const roto = { requisitos: { ...todo.requisitos, correoDestino: { ...aprobado, responsable: '' }, widgetProduccion: { ...aprobado, fecha: '2099-01-01' } } };
    expect(pendientesFormulario(roto, REQUISITOS_COMPILACION, hoy)).toHaveLength(2);
  });

  test('el registro del repositorio sigue pendiente: nadie aprobó la activación', () => {
    expect(pendientesFormulario(registro, REQUISITOS_COMPILACION, hoy)).toHaveLength(3);
    expect(registro.requisitos.envioRealVerificado.estado).toBe('pendiente');
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
  const otros: ReturnType<typeof spawn>[] = [];
  const origen = 'http://127.0.0.1:4328';
  // Cada servidor escribe en su propio buzón local: así se cuenta exactamente lo que se "envió".
  const buzon = (n: string) => `var/${n}`;
  const enviados = (n: string) => (existsSync(buzon(n)) ? readdirSync(buzon(n)).length : 0);
  const arrancar = async (request: import('@playwright/test').APIRequestContext, port: string, extra: Record<string, string>) => {
    const p = spawn('node', ['scripts/servidor.mjs'], {
      env: { ...process.env, HOST: '127.0.0.1', PORT: port, MAIL_TO: 'pruebas@example.test', RATE_LIMIT_MAX: '500', TURNSTILE_MODE: 'required', TURNSTILE_VERIFY_URL: 'http://127.0.0.1:4329/siteverify', ...extra },
      stdio: 'ignore'
    });
    await expect.poll(async () => (await request.get(`http://127.0.0.1:${port}/`).catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
    return p;
  };

  test.describe.configure({ mode: 'serial' });
  test.beforeAll(async ({ request }, info) => {
    test.skip(info.project.name !== 'escritorio' || process.env.SERVIDOR === 'cloudflare', 'una ejecución, en Node');
    await new Promise<void>(r => simulado.listen(4329, '127.0.0.1', () => r()));
    for (const n of ['outbox-turnstile', 'outbox-sin-secreto']) rmSync(buzon(n), { recursive: true, force: true });
    srv = await arrancar(request, '4328', { MAIL_MODE: 'outbox', OUTBOX_DIR: 'outbox-turnstile', TURNSTILE_SECRET_KEY: PRUEBA_OK });
    // Prueba 1: correo listo pero sin clave secreta de Turnstile.
    otros.push(await arrancar(request, '4334', { MAIL_MODE: 'outbox', OUTBOX_DIR: 'outbox-sin-secreto', TURNSTILE_SECRET_KEY: '' }));
    // Prueba 8: Turnstile listo pero sin correo configurado.
    otros.push(await arrancar(request, '4335', { MAIL_MODE: 'disabled', TURNSTILE_SECRET_KEY: PRUEBA_OK }));
  });
  test.afterAll(() => {
    srv?.kill();
    otros.forEach(p => p.kill());
    if (simulado.listening) simulado.close();
  });

  const enviarA = (request: import('@playwright/test').APIRequestContext, port: string, extra: Record<string, string> = {}) =>
    request.post(`http://127.0.0.1:${port}/api/consulta`, { headers: { accept: 'application/json', origin: `http://127.0.0.1:${port}` }, form: { ...formulario, ...extra } });

  test('prueba 1: sin clave secreta de Turnstile no se envía nada (503)', async ({ request }) => {
    const antes = recibidos.length;
    const res = await enviarA(request, '4334', { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, verificacion: true });
    expect(enviados('outbox-sin-secreto')).toBe(0);
    expect(recibidos.length).toBe(antes);
  });

  test('prueba 8: token válido pero sin correo configurado no confirma nada (503) y no consulta Siteverify', async ({ request }) => {
    respuesta = { status: 200, cuerpo: { success: true, hostname: 'example.com', 'error-codes': [] } };
    const antes = recibidos.length;
    const res = await enviarA(request, '4335', { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(503);
    const j = await res.json();
    expect(j).toMatchObject({ ok: false, cerrado: true });
    expect(j.mensaje).toContain('no se ha enviado');
    expect(j.mensaje).not.toMatch(/MAIL|SMTP|correo de destino|variable/i);
    expect(recibidos.length).toBe(antes);
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

  test('pruebas 7 y 9: con un token aprobado se envía una vez, y el token no viaja en el mensaje', async ({ request }) => {
    respuesta = { status: 200, cuerpo: { success: true, hostname: 'example.com', 'error-codes': [] } };
    const antes = enviados('outbox-turnstile');
    const res = await enviar(request, { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    // Aceptado para su entrega: no afirma que se haya recibido ni leído.
    expect(j.mensaje).toContain('se envió');
    expect(j.mensaje).not.toMatch(/recibid|leíd/i);
    expect(recibidos.at(-1)).toBe('XXXX.DUMMY.TOKEN.XXXX');
    expect(enviados('outbox-turnstile')).toBe(antes + 1);
    const ultimo = readdirSync(buzon('outbox-turnstile')).sort().at(-1)!;
    expect(readFileSync(`${buzon('outbox-turnstile')}/${ultimo}`, 'utf8')).not.toContain('DUMMY');
  });

  test('pruebas 3, 4 y 5: token inválido, caducado o reutilizado no se envía (403)', async ({ request }) => {
    const antes = enviados('outbox-turnstile');
    for (const codigos of [['invalid-input-response'], ['timeout-or-duplicate'], ['bad-request']]) {
      respuesta = { status: 200, cuerpo: { success: false, 'error-codes': codigos } };
      const res = await enviar(request, { 'cf-turnstile-response': 'otro-token' });
      expect(res.status()).toBe(403);
      expect(await res.json()).toMatchObject({ ok: false, verificacion: true });
    }
    expect(enviados('outbox-turnstile')).toBe(antes);
  });

  test('un token reutilizado o rechazado no se envía', async ({ request }) => {
    respuesta = { status: 200, cuerpo: { success: false, 'error-codes': ['timeout-or-duplicate'] } };
    expect((await enviar(request, { 'cf-turnstile-response': 'usado' })).status()).toBe(403);
    respuesta = { status: 200, cuerpo: { success: false, 'error-codes': ['invalid-input-response'] } };
    expect((await enviar(request, { 'cf-turnstile-response': 'falso' })).status()).toBe(403);
  });

  test('prueba 6: si Siteverify falla o da internal-error, responde 503 y no envía', async ({ request }) => {
    const antes = enviados('outbox-turnstile');
    for (const r of [{ status: 502, cuerpo: {} }, { status: 200, cuerpo: { success: false, 'error-codes': ['internal-error'] } }]) {
      respuesta = r;
      const res = await enviar(request, { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' });
      expect(res.status()).toBe(503);
      expect((await res.json()).ok).toBe(false);
    }
    expect(enviados('outbox-turnstile')).toBe(antes);
  });

  test('prueba 16: sin JavaScript (sin token) no hay bypass: 303 a la página de error y nada enviado', async ({ request }) => {
    const antes = enviados('outbox-turnstile');
    const res = await request.post(`${origen}/api/consulta`, { headers: { origin: origen }, form: formulario, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers().location).toBe('/consulta-no-enviada');
    expect(enviados('outbox-turnstile')).toBe(antes);
    const pagina = await (await request.get(`${origen}/consulta-no-enviada`)).text();
    expect(pagina).toContain('Su solicitud no se envió');
    expect(pagina).not.toMatch(/se envió correctamente|solicitud recibida/i);
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
