import { AccountId } from '@hiero-ledger/sdk';
import { getCurrentTopic } from '../../utils/db.js';
import { submitTopicMessage, parsePrivateKey } from '../../utils/hedera.js';

const MAX_MESSAGE_BYTES = 1024;

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const { accountId, privateKeyDer, message } = body || {};

  if (!accountId || typeof accountId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'accountId requerido' });
  }
  if (!privateKeyDer || typeof privateKeyDer !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'privateKeyDer requerido' });
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Mensaje vacío' });
  }
  if (Buffer.byteLength(message, 'utf8') > MAX_MESSAGE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'El mensaje supera 1024 bytes' });
  }

  // Validar formatos antes de tocar Hedera.
  try {
    AccountId.fromString(accountId);
    parsePrivateKey(privateKeyDer);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Datos de cuenta inválidos' });
  }

  const topicId = await getCurrentTopic();
  if (!topicId) {
    throw createError({ statusCode: 409, statusMessage: 'No hay tópico configurado' });
  }

  try {
    await submitTopicMessage({ topicId, accountId, privateKeyDer, message });
    return { ok: true };
  } catch (e) {
    // No registrar llaves privadas ni mensajes en los logs.
    console.error('[topic/messages] Error enviando mensaje:', e?.message || e);
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el mensaje' });
  }
});
