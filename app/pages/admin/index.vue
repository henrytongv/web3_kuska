<template>
  <div class="page">
    <div class="card">
      <h1>{{ $t('adminMenuTitle') }}</h1>
      <p class="muted">{{ $t('currentTopicLabel') }}: <strong>{{ topicId || $t('noCurrentTopic') }}</strong></p>
      <ul class="menu-list">
        <li>
          <button class="btn" type="button" :disabled="creating" @click="createTopic">
            {{ creating ? $t('creatingTopic') : $t('createTopicBtn') }}
          </button>
        </li>
        <li>
          <NuxtLink class="btn secondary" to="/admin/chat">{{ $t('adminChatBtn') }}</NuxtLink>
        </li>
        <li>
          <button class="btn danger" type="button" @click="logout">
            {{ $t('adminLogoutBtn') }}
          </button>
        </li>
      </ul>
      <div v-if="msg" class="success">{{ msg }}</div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' });

const { t } = useI18n();
const topicId = ref(null);
const creating = ref(false);
const msg = ref('');
const error = ref('');

async function refreshTopic() {
  try {
    const res = await $fetch('/api/topic/current');
    topicId.value = res?.topicId || null;
  } catch {
    topicId.value = null;
  }
}

async function createTopic() {
  if (!window.confirm(t('createTopicConfirm'))) return;
  creating.value = true;
  msg.value = '';
  error.value = '';
  try {
    const res = await $fetch('/api/admin/topic', { method: 'POST' });
    topicId.value = res?.topicId || null;
    msg.value = t('topicCreated');
  } catch {
    error.value = t('genericError');
  } finally {
    creating.value = false;
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
  await navigateTo('/admin/login');
}

onMounted(refreshTopic);
</script>
