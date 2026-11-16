import { verifyUserAccount } from '../../../utils/hedera.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id || !/^[\d.]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'accountId inválido' });
  }
  try {
    return await verifyUserAccount(id);
  } catch (e) {
    console.error('[verify] Error consultando mirror node:', e?.message || e);
    throw createError({ statusCode: 502, statusMessage: 'No se pudo verificar la cuenta' });
  }
});
