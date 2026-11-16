// Prueba de extremo a extremo contra Hedera Testnet.
// Uso: node scripts/test-hedera.mjs
// Crea una cuenta ECDSA de 3 HBAR, un tópico HCS y envía un mensaje firmado
// por el usuario (pagador) y por el operador (submitKey).
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

const {
  Client,
  PrivateKey,
  PublicKey,
  AccountId,
  TransactionId,
  Hbar,
  AccountCreateTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
} = await import('@hiero-ledger/sdk');

function parsePrivateKey(raw) {
  const s = String(raw).trim();
  if (PrivateKey.isDerKey(s)) return PrivateKey.fromStringDer(s);
  try { return PrivateKey.fromStringECDSA(s); } catch {}
  try { return PrivateKey.fromStringED25519(s); } catch {}
  try { return PrivateKey.fromString(s); } catch {}
  throw new Error('No se pudo interpretar OPERATOR_KEY');
}

const operatorId = AccountId.fromString(env.OPERATOR_ID);
const operatorKey = parsePrivateKey(env.OPERATOR_KEY);
console.log('Operator key type:', operatorKey.type);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
console.log('Client listo para testnet');

// 1. Crear cuenta de usuario con llave ECDSA y 3 HBAR
const userKey = await PrivateKey.generateECDSA();
const createTx = new AccountCreateTransaction()
  .setKey(userKey.publicKey)
  .setInitialBalance(Hbar.from(3))
  .setAccountMemo('Web3 Kuska demo account');
const createResp = await createTx.execute(client);
const createReceipt = await createResp.getReceipt(client);
const userAccountId = createReceipt.accountId;
console.log('Cuenta creada:', userAccountId.toString());
console.log('Priv DER hex (primeros 30):', userKey.toStringDer().slice(0, 30));
console.log('Pub DER hex (primeros 30):', userKey.publicKey.toStringDer().slice(0, 30));

// 2. Verificar en Mirror Node REST
const mirror = 'https://testnet.mirrornode.hedera.com';
const acc = await fetch(`${mirror}/api/v1/accounts/${userAccountId}`).then((r) => r.json());
console.log('Saldo en mirror:', acc.balance?.balance, 'tinybars =', Number(acc.balance?.balance) / 1e8, 'HBAR');

// 3. Crear tópico: público (lectura), submitKey = operador, sin adminKey
const topicTx = new TopicCreateTransaction()
  .setTopicMemo('Web3 Kuska topic')
  .setSubmitKey(operatorKey.publicKey);
const topicResp = await topicTx.execute(client);
const topicReceipt = await topicResp.getReceipt(client);
const topicId = topicReceipt.topicId;
console.log('Tópico creado:', topicId.toString());

// 4. Enviar mensaje: pagador = usuario, firmas = usuario + operador
const msg = 'Hola desde Web3 Kuska ' + new Date().toISOString();
const submitTx = new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(msg)
  .setTransactionId(TransactionId.generate(userAccountId))
  .setTransactionValidDuration(120);
await submitTx.freezeWith(client);
await submitTx.sign(userKey);
await submitTx.sign(operatorKey);
const msgResp = await submitTx.execute(client);
const msgReceipt = await msgResp.getReceipt(client);
console.log('Mensaje enviado, status:', msgReceipt.status?.toString?.() ?? msgReceipt.status);

// 5. Leer últimos mensajes del tópico por Mirror Node REST
await new Promise((r) => setTimeout(r, 3000));
const msgs = await fetch(
  `${mirror}/api/v1/topics/${topicId}/messages?order=desc&limit=5`,
).then((r) => r.json());
for (const m of msgs.messages ?? []) {
  console.log(
    'msg seq', m.sequence_number,
    '| payer', m.payer_account_id,
    '| topic', m.topic_id,
    '| data', Buffer.from(m.message, 'base64').toString('utf8'),
  );
}
console.log('FIN OK');
process.exit(0);
