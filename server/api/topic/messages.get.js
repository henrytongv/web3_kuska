import { getQuery } from 'h3';
import { getConfig } from '../../utils/config.js';
import { getCurrentTopic } from '../../utils/db.js';

// Proxy de conveniencia hacia el Mirror Node. El frontend puede también
// consultar el mirror directamente (ver /api/topic/messages del cliente).
export default defineEventHandler(async (event) => {
  const { topicId, limit = 30 } = getQuery(event);
  const target = topicId || (await getCurrentTopic());
  if (!target) return { messages: [] };

  const base = getConfig().mirrorNodeUrl.replace(/\/$/, '');
  const url = `${base}/api/v1/topics/${target}/messages?order=desc&limit=${Math.min(Number(limit) || 30, 100)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Mirror node no disponible' });
  }
  return res.json();
});
