import { getConfig } from '../utils/config.js';
import { safeEqual } from '../utils/session.js';
import { createUserAccount } from '../utils/hedera.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const cfg = getConfig();

  if (!cfg.newAccountPassword || !safeEqual(body?.password, cfg.newAccountPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Contraseña incorrecta' });
  }

  try {
    const account = await createUserAccount();
    return account;
  } catch (e) {
    console.error('[account] Error creando cuenta:', e?.message || e);
    throw createError({ statusCode: 502, statusMessage: 'No se pudo crear la cuenta' });
  }
});
