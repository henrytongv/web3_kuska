// Verifica la sesión del administrador llamando al backend
// (la cookie es httpOnly, así que el cliente no puede leerla).
export async function isAdminServer() {
  try {
    const res = await $fetch('/api/admin/check');
    return Boolean(res?.ok);
  } catch {
    return false;
  }
}
