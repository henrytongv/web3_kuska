<template>
  <div class="page">
    <div class="card">
      <h1>{{ $t('chatTitle') }} — {{ $t('adminMenuTitle') }}</h1>
      <p class="muted">{{ $t('topicLabel') }}: <strong>{{ topicId || $t('noCurrentTopic') }}</strong></p>
      <ChatBox v-if="topicId" :topic-id="topicId" :mask-messages="true" />
      <p v-else class="muted">{{ $t('noTopic') }}</p>
      <div style="margin-top:16px">
        <NuxtLink class="btn secondary" to="/admin">{{ $t('backBtn') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' });

const topicId = ref(null);

onMounted(async () => {
  try {
    const res = await $fetch('/api/topic/current');
    topicId.value = res?.topicId || null;
  } catch {
    topicId.value = null;
  }
});
</script>
