import { isAdminServer } from '../utils/auth.js';

export default defineNuxtRouteMiddleware(async (to) => {
  const ok = await isAdminServer();
  if (!ok) return navigateTo('/admin/login');
});
