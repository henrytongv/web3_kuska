import { requireAdmin } from '../../utils/session.js';
import { createTopic } from '../../utils/hedera.js';
import { setCurrentTopic } from '../../utils/db.js';

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  let topicId;
  try {
    topicId = await createTopic();
  } catch (e) {
    console.error('[admin/topic] Error creando tópico:', e?.message || e);
    throw createError({ statusCode: 502, statusMessage: 'No se pudo crear el tópico' });
  }

  await setCurrentTopic(topicId);
  return { ok: true, topicId };
});
