import { getConfig } from '../../utils/config.js';
import { safeEqual, createAdminSession } from '../../utils/session.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const cfg = getConfig();

  if (!cfg.adminPassword || !safeEqual(body?.password, cfg.adminPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Contraseña incorrecta' });
  }

  createAdminSession(event);
  return { ok: true };
});
