import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
  TransactionId,
  AccountCreateTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from '@hiero-ledger/sdk';
import { getConfig, requireConfig } from './config.js';

// Interpreta la llave privada del operador desde .env.
// Acepta llaves en formato DER codificado en hexadecimal (recomendado)
// o llaves crudas en hexadecimal.
export function parsePrivateKey(raw) {
  const s = String(raw || '').trim();
  if (!s) throw new Error('Llave privada vacía');
  try {
    if (PrivateKey.isDerKey(s)) return PrivateKey.fromStringDer(s);
  } catch {
    /* continuar con otros formatos */
  }
  try {
    return PrivateKey.fromStringECDSA(s);
  } catch {
    /* continuar */
  }
  try {
    return PrivateKey.fromStringED25519(s);
  } catch {
    /* continuar */
  }
  try {
    return PrivateKey.fromString(s);
  } catch {
    throw new Error('No se pudo interpretar la llave privada');
  }
}

let _operator = null;

export function getOperator() {
  if (_operator) return _operator;
  const cfg = requireConfig();
  const accountId = AccountId.fromString(cfg.operatorId);
  const key = parsePrivateKey(cfg.operatorKey);
  const client =
    cfg.hederaNetwork === 'previewnet'
      ? Client.forPreviewnet()
      : Client.forTestnet();
  client.setOperator(accountId, key);
  _operator = { client, accountId, key };
  return _operator;
}

export function mirrorUrl(path = '') {
  const base = getConfig().mirrorNodeUrl.replace(/\/$/, '');
  return `${base}${path}`;
}

export async function mirrorGet(path) {
  const res = await fetch(mirrorUrl(path));
  if (!res.ok) {
    const err = new Error(`Mirror node respondió ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

// Crea una cuenta nueva con llave ECDSA y le asigna saldo inicial.
export async function createUserAccount() {
  const { client, accountId: operatorId, key: operatorKey } = getOperator();
  const cfg = getConfig();
  const userKey = await PrivateKey.generateECDSA();

  const tx = new AccountCreateTransaction()
    .setKey(userKey.publicKey)
    .setInitialBalance(Hbar.from(cfg.accountInitialHbars))
    .setAccountMemo('Web3 Kuska demo account');
  await tx.freezeWith(client);
  await tx.sign(operatorKey);
  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  const newAccountId = receipt.accountId.toString();

  return {
    accountId: newAccountId,
    // El operador paga la transacción; el pagador del crédito es la nueva cuenta.
    privateKeyDer: userKey.toStringDer(),
    publicKeyDer: userKey.publicKey.toStringDer(),
    operatorId: operatorId.toString(),
  };
}

// Consulta el Mirror Node: la cuenta existe y tiene saldo suficiente.
export async function verifyUserAccount(accountId) {
  try {
    const data = await mirrorGet(`/api/v1/accounts/${accountId}`);
    const tinybars = Number(data?.balance?.balance ?? 0);
    const minTinybars = Math.floor(getConfig().accountMinHbars * 1e8);
    return {
      exists: true,
      balanceTinybars: tinybars,
      hasMinBalance: tinybars >= minTinybars,
    };
  } catch (e) {
    if (e.statusCode === 404) return { exists: false, balanceTinybars: 0, hasMinBalance: false };
    throw e;
  }
}

// Crea un tópico HCS: lectura pública, escritura solo del backend
// (submitKey del operador) y sin adminKey (inmutable).
export async function createTopic() {
  const { client, key: operatorKey } = getOperator();
  const tx = new TopicCreateTransaction()
    .setTopicMemo('Web3 Kuska topic')
    .setSubmitKey(operatorKey.publicKey);
  await tx.freezeWith(client);
  await tx.sign(operatorKey);
  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  return receipt.topicId.toString();
}

// Escribe un mensaje en el tópico. La cuenta del usuario es la pagadora
// (transaction id) y la transacción va firmada por el usuario y por el
// operador (submitKey). Límite: 1024 bytes por mensaje.
export async function submitTopicMessage({ topicId, accountId, privateKeyDer, message }) {
  const { client, key: operatorKey } = getOperator();
  const userKey = parsePrivateKey(privateKeyDer);
  const payerId = AccountId.fromString(accountId);

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .setTransactionId(TransactionId.generate(payerId))
    .setTransactionValidDuration(120);
  await tx.freezeWith(client);
  await tx.sign(userKey);
  await tx.sign(operatorKey);
  const response = await tx.execute(client);
  await response.getReceipt(client);
  return { ok: true };
}
