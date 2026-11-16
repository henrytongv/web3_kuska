<template>
  <div class="page">
    <div v-if="!ready" class="card muted">{{ $t('loginRequired') }}</div>

    <template v-else>
      <div class="card">
        <h1>{{ $t('chatTitle') }}</h1>
        <p class="muted">{{ $t('topicLabel') }}: <strong>{{ topicId }}</strong></p>
        <ChatBox
          v-if="topicId"
          :topic-id="topicId"
          :account-id="wallet.accountId"
          :private-key-der="wallet.privateKeyDer"
        />
        <p v-else class="muted">{{ $t('noTopic') }}</p>
      </div>
      <NuxtLink class="btn secondary" to="/">{{ $t('backBtn') }}</NuxtLink>
    </template>
  </div>
</template>

<script setup>
import { loadWallet } from '../utils/wallet.js';

const { t } = useI18n();
const wallet = ref(null);
const topicId = ref(null);
const ready = ref(false);

onMounted(async () => {
  wallet.value = loadWallet();
  if (!wallet.value?.accountId) {
    await navigateTo('/');
    return;
  }
  ready.value = true;
  try {
    const res = await $fetch('/api/topic/current');
    topicId.value = res?.topicId || null;
  } catch {
    topicId.value = null;
  }
});
</script>
