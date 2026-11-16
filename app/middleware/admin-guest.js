import { isAdminServer } from '../utils/auth.js';

export default defineNuxtRouteMiddleware(async () => {
  const ok = await isAdminServer();
  if (ok) return navigateTo('/admin');
});
