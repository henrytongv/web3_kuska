<template>
  <div class="page">
    <div class="card" style="max-width:420px">
      <h1>{{ $t('adminLoginTitle') }}</h1>
      <form @submit.prevent="login">
        <label for="adminPwd">{{ $t('passwordLabel') }}</label>
        <input
          id="adminPwd"
          v-model="password"
          type="password"
          :placeholder="$t('adminPasswordPlaceholder')"
          autocomplete="off"
        />
        <button class="btn" type="submit" :disabled="loading || !password">
          {{ loading ? '...' : $t('loginBtn') }}
        </button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin-guest' });

const { t } = useI18n();
const password = ref('');
const loading = ref(false);
const error = ref('');

async function login() {
  if (!password.value || loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value },
    });
    await navigateTo('/admin');
  } catch (e) {
    error.value = e?.statusCode === 401 ? t('wrongPassword') : t('genericError');
  } finally {
    loading.value = false;
  }
}
</script>
