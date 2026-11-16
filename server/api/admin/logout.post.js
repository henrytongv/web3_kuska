import { destroyAdminSession } from '../../utils/session.js';

export default defineEventHandler((event) => {
  destroyAdminSession(event);
  return { ok: true };
});
