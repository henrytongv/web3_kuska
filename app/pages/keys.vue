<template>
  <div class="page">
    <div class="card">
      <h1>{{ $t('keysTitle') }}</h1>
      <div class="warning-box">{{ $t('keysWarning') }}</div>
      <p>{{ $t('keysText') }}</p>
      <template v-if="wallet">
        <h3>{{ $t('accountLabel') }}</h3>
        <p class="account-id">{{ wallet.accountId }}</p>
        <h3>{{ $t('privateKeyLabel') }}</h3>
        <p><code style="word-break:break-all">{{ wallet.privateKeyDer }}</code></p>
        <button class="btn secondary" type="button" @click="copy(wallet.privateKeyDer)">
          {{ copied === 'private' ? $t('copied') : $t('copyBtn') }}
        </button>
        <h3>{{ $t('publicKeyLabel') }}</h3>
        <p><code style="word-break:break-all">{{ wallet.publicKeyDer }}</code></p>
        <button class="btn secondary" type="button" @click="copy(wallet.publicKeyDer)">
          {{ copied === 'public' ? $t('copied') : $t('copyBtn') }}
        </button>
      </template>
      <p v-else class="muted">{{ $t('loginRequired') }}</p>
      <div style="margin-top:16px">
        <NuxtLink class="btn secondary" to="/">{{ $t('backBtn') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { loadWallet } from '../utils/wallet.js';

const wallet = ref(null);
const copied = ref('');

onMounted(() => {
  wallet.value = loadWallet();
  if (!wallet.value?.accountId) navigateTo('/');
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = text === wallet.value.privateKeyDer ? 'private' : 'public';
    setTimeout(() => (copied.value = ''), 2000);
  } catch {
    // portapapeles no disponible
  }
}
</script>
