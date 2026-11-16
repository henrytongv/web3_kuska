// Prueba de extremo a extremo contra la API de la app en local.
// Uso: node scripts/e2e-api.mjs   (requiere `npm run dev` corriendo)
// No imprime llaves privadas ni contraseñas.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const cookieJar = [];

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieJar.length ? { cookie: cookieJar.join('; ') } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(';');
    const name = pair.split('=')[0];
    const idx = cookieJar.findIndex((k) => k.startsWith(`${name}=`));
    if (idx >= 0) cookieJar.splice(idx, 1);
    if (!c.includes('Max-Age=0')) cookieJar.push(pair);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const step = (name, ok, extra = '') =>
  console.log(`${ok ? 'OK ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

// 1. Login admin
let r = await api('/api/admin/login', {
  method: 'POST',
  body: { password: env.ADMIN_SCREEN_PASSWORD },
});
step('admin login', r.status === 200 && r.data.ok === true, `status ${r.status}`);

// 2. Check sesión
r = await api('/api/admin/check');
step('admin check', r.data.ok === true);

// 3. Crear tópico
r = await api('/api/admin/topic', { method: 'POST' });
step('crear tópico', r.status === 200 && !!r.data.topicId, r.data.topicId || `status ${r.status}`);
const topicId = r.data.topicId;

// 4. Tópico actual
r = await api('/api/topic/current');
step('topic/current', r.data.topicId === topicId, r.data.topicId || 'null');

// 5. Crear cuenta de usuario
r = await api('/api/account', {
  method: 'POST',
  body: { password: env.NEW_ACCOUNT_PASSWORD },
});
step('crear cuenta', r.status === 200 && !!r.data.accountId, r.data.accountId || `status ${r.status} ${r.data.statusMessage || ''}`);
const account = r.data;

// 6. Verificar cuenta (polling cada 3 s, máx 120 s para la prueba)
let verified = false;
for (let i = 0; i < 40 && !verified; i++) {
  await new Promise((res) => setTimeout(res, 3000));
  r = await api(`/api/account/${account.accountId}/verify`);
  verified = r.data.exists && r.data.hasMinBalance;
}
step('verificar cuenta', verified, verified ? '' : JSON.stringify(r.data));

// 7. Enviar mensaje
r = await api('/api/topic/messages', {
  method: 'POST',
  body: {
    accountId: account.accountId,
    privateKeyDer: account.privateKeyDer,
    message: 'Hola desde la app Web3 Kuska (e2e)',
  },
});
step('enviar mensaje', r.status === 200 && r.data.ok === true, `status ${r.status} ${r.data.statusMessage || ''}`);

// 8. Leer desde el mirror node directamente
await new Promise((res) => setTimeout(res, 3000));
const mirror = 'https://testnet.mirrornode.hedera.com';
const msgs = await fetch(
  `${mirror}/api/v1/topics/${topicId}/messages?order=desc&limit=5`,
).then((x) => x.json());
const last = msgs.messages?.[0];
const decoded = last ? Buffer.from(last.message, 'base64').toString('utf8') : '';
step(
  'mirror node muestra mensaje',
  last?.payer_account_id === account.accountId && decoded.includes('Web3 Kuska'),
  last ? `payer=${last.payer_account_id} msg="${decoded}"` : 'sin mensajes',
);

// 9. Logout admin
r = await api('/api/admin/logout', { method: 'POST' });
r = await api('/api/admin/check');
step('logout admin', r.data.ok === false);

console.log('FIN');
process.exit(0);
