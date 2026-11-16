<template>
  <div>
    <div class="chat-toolbar">
      <label class="mask-toggle" v-if="maskMessages">
        <input type="checkbox" v-model="mask" />
        {{ $t('maskLabel') }}
      </label>
      <div class="toolbar-buttons">
        <button class="btn secondary" type="button" @click="openMirror">
          {{ $t('refreshBtn') }}
        </button>
        <button class="btn secondary" type="button" @click="openHashscan">
          {{ $t('hashscanTopicBtn') }}
        </button>
      </div>
    </div>

    <div class="chat-scroll">
      <table class="chat-grid">
        <thead>
          <tr>
            <th>{{ $t('colId') }}</th>
            <th>{{ $t('colDate') }}</th>
            <th>{{ $t('colAccount') }}</th>
            <th>{{ $t('colMessage') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!messages.length">
            <td colspan="4" class="muted">{{ $t('noMessages') }}</td>
          </tr>
          <tr v-for="m in messages" :key="m.id">
            <td>{{ m.id }}</td>
            <td>{{ m.timestamp }}</td>
            <td>{{ m.accountId }}</td>
            <td>{{ displayMessage(m.message) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="canSend" class="chat-input-row">
      <input
        v-model="draft"
        type="text"
        :placeholder="$t('messagePlaceholder')"
        :disabled="sending"
        @keyup.enter="send"
      />
      <button class="btn" type="button" :disabled="sending || !draft.trim()" @click="send">
        {{ sending ? $t('sending') : $t('sendBtn') }}
      </button>
    </div>
    <div v-if="canSend" class="muted">{{ $t('charsLeft', { n: bytesLeft }) }}</div>
    <div v-if="sendError" class="error">{{ sendError }}</div>
    <div v-if="sendOk" class="success">{{ $t('messageSent') }}</div>
  </div>
</template>

<script setup>
import { fetchMirrorMessages, mirrorMessagesUrl } from '../utils/mirror.js';
import { utf8Length, MAX_MESSAGE_BYTES } from '../utils/wallet.js';

const props = defineProps({
  topicId: { type: String, required: true },
  maskMessages: { type: Boolean, default: false },
  accountId: { type: String, default: '' },
  privateKeyDer: { type: String, default: '' },
});

const { t } = useI18n();
const messages = ref([]);
const draft = ref('');
const sending = ref(false);
const sendError = ref('');
const sendOk = ref(false);
const mask = ref(true); // filtro activado por defecto en la vista admin
let timer = null;

const canSend = computed(() => Boolean(props.accountId && props.privateKeyDer));
const bytesLeft = computed(() => MAX_MESSAGE_BYTES - utf8Length(draft.value));

function displayMessage(text) {
  if (props.maskMessages && mask.value) return text.slice(0, 3);
  return text;
}

async function refresh() {
  try {
    messages.value = await fetchMirrorMessages(props.topicId, 30);
  } catch {
    // silencioso: el polling reintenta en 4 s
  }
}

function openMirror() {
  window.open(mirrorMessagesUrl(props.topicId, 30), '_blank');
}

function openHashscan() {
  window.open(`https://hashscan.io/testnet/topic/${props.topicId}/messages`, '_blank');
}

async function send() {
  const text = draft.value.trim();
  if (!text || sending.value) return;
  if (utf8Length(text) > MAX_MESSAGE_BYTES) {
    sendError.value = t('sendError');
    return;
  }
  sending.value = true;
  sendError.value = '';
  sendOk.value = false;
  try {
    await $fetch('/api/topic/messages', {
      method: 'POST',
      body: {
        accountId: props.accountId,
        privateKeyDer: props.privateKeyDer,
        message: text,
      },
    });
    draft.value = '';
    sendOk.value = true;
    setTimeout(() => (sendOk.value = false), 3000);
    await refresh();
  } catch {
    sendError.value = t('sendError');
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 4000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

watch(() => props.topicId, refresh);
</script>

<style scoped>
.chat-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.toolbar-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mask-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
  font-size: 0.9rem;
}
.mask-toggle input { width: auto; margin: 0; }
</style>
