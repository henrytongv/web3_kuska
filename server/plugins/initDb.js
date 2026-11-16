import { initDb } from '../utils/db.js';

export default defineNitroPlugin(async () => {
  try {
    await initDb();
    console.log('[web3-kuska] Base de datos lista (tabla topics)');
  } catch (e) {
    console.error('[web3-kuska] No se pudo inicializar la base de datos:', e?.message || e);
  }
});
