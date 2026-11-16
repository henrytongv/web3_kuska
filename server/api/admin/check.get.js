import { isAdmin } from '../../utils/session.js';

export default defineEventHandler((event) => {
  return { ok: isAdmin(event) };
});
