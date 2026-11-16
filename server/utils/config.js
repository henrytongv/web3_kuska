import { createError } from 'h3';

// Configuración leída en tiempo de ejecución.
// En desarrollo Nuxt carga el archivo .env; en Railway las variables se
// configuran en el panel del servicio.
export function getConfig() {
  return {
    operatorId: process.env.OPERATOR_ID || '',
    operatorKey: process.env.OPERATOR_KEY || '',
    neonDb: process.env.NEON_DB || '',
    adminPassword: process.env.ADMIN_SCREEN_PASSWORD || '',
    newAccountPassword: process.env.NEW_ACCOUNT_PASSWORD || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    mirrorNodeUrl:
      process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com',
    hederaNetwork: process.env.HEDERA_NETWORK || 'testnet',
    accountInitialHbars: Number(process.env.ACCOUNT_INITIAL_HBARS || 3.1),
    accountMinHbars: Number(process.env.ACCOUNT_MIN_HBARS || 3),
  };
}

export function requireConfig() {
  const c = getConfig();
  const missing = [];
  if (!c.operatorId) missing.push('OPERATOR_ID');
  if (!c.operatorKey) missing.push('OPERATOR_KEY');
  if (!c.neonDb) missing.push('NEON_DB');
  if (!c.sessionSecret) missing.push('SESSION_SECRET');
  if (missing.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `Faltan variables de entorno: ${missing.join(', ')}`,
    });
  }
  return c;
}
