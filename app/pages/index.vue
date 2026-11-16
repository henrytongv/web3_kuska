<template>
  <div>
    <!-- Menú principal -->
    <div v-if="state === 'menu' && wallet" class="card">
      <h1>{{ $t('menuTitle') }}</h1>
      <p class="muted">{{ $t('accountLabel') }}</p>
      <div class="account-id">{{ wallet.accountId }}</div>
      <ul class="menu-list">
        <li>
          <a
            class="btn"
            :href="`https://hashscan.io/testnet/account/${wallet.accountId}`"
            target="_blank"
            rel="noopener"
          >{{ $t('hashscanBtn') }}</a>
        </li>
        <li><NuxtLink class="btn" to="/chat">{{ $t('chatBtn') }}</NuxtLink></li>
        <li><NuxtLink class="btn secondary" to="/keys">{{ $t('keysBtn') }}</NuxtLink></li>
        <li>
          <button class="btn danger" type="button" @click="logout">
            {{ $t('logoutBtn') }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Verificación en curso -->
    <div v-else-if="state === 'creating'" class="card">
      <h1>{{ $t('creatingTitle') }}</h1>
      <p>{{ $t('creatingText') }}</p>
      <p class="muted">{{ $t('waitClock') }} ({{ elapsedLabel }})</p>
      <div v-if="verifyError" class="error">{{ verifyError }}</div>
    </div>

    <!-- Cuenta creada -->
    <div v-else-if="state === 'success' && wallet" class="card">
      <h1>{{ $t('accountCreatedTitle') }}</h1>
      <p class="muted">{{ $t('accountIdLabel') }}</p>
      <div class="account-id">{{ wallet.accountId }}</div>
      <button class="btn" type="button" @click="state = 'menu'">
        {{ $t('goToMenu') }}
      </button>
    </div>

    <!-- Bienvenida / contraseña -->
    <div v-else class="card">
      <h1>{{ appTitle }}</h1>
      <p>{{ $t('welcomeText') }}</p>
      <form @submit.prevent="startCreation">
        <label for="pwd">{{ $t('passwordLabel') }}</label>
        <input
          id="pwd"
          v-model="password"
          type="password"
          :placeholder="$t('passwordPlaceholder')"
          autocomplete="off"
        />
        <button class="btn" type="submit" :disabled="creating || !password">
          {{ creating ? $t('creatingTitle') : $t('createAccountBtn') }}
        </button>
      </form>
      <div v-if="createError" class="error">{{ createError }}</div>
      <div v-if="verifyError" class="error">{{ verifyError }}</div>
    </div>
  </div>
</template>

<script setup>
import {
  loadWallet,
  saveWallet,
  clearWallet,
  loadPending,
  savePending,
  clearPending,
} from '../utils/wallet.js';

const { t } = useI18n();
const appTitle = t('appTitle');

const state = ref('welcome'); // welcome | creating | success | menu
const wallet = ref(null);
const password = ref('');
const creating = ref(false);
const createError = ref('');
const verifyError = ref('');
const elapsedLabel = ref('');

let verifyTimer = null;
let elapsedTimer = null;
let deadline = 0;
let startedAt = 0;

const VERIFY_INTERVAL_MS = 3000;
const VERIFY_TIMEOUT_MS = 7 * 60 * 1000;

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

async function verifyOnce(accountId) {
  const res = await $fetch(`/api/account/${accountId}/verify`);
  return res?.exists && res?.hasMinBalance;
}

function stopTimers() {
  if (verifyTimer) clearInterval(verifyTimer);
  if (elapsedTimer) clearInterval(elapsedTimer);
  verifyTimer = null;
  elapsedTimer = null;
}

async function pollVerification(accountId) {
  try {
    const ok = await verifyOnce(accountId);
    if (ok) {
      const pending = loadPending();
      if (pending) {
        wallet.value = {
          accountId: pending.accountId,
          privateKeyDer: pending.privateKeyDer,
          publicKeyDer: pending.publicKeyDer,
        };
        saveWallet(wallet.value);
        clearPending();
      }
      state.value = 'success';
      stopTimers();
    }
  } catch {
    // reintenta en el próximo ciclo
  }
  if (Date.now() > deadline) {
    stopTimers();
    clearPending();
    state.value = 'welcome';
    verifyError.value = t('verificationTimeout');
  }
}

function startPolling() {
  deadline = startedAt + VERIFY_TIMEOUT_MS;
  pollVerification(loadPending()?.accountId || wallet.value?.accountId);
  verifyTimer = setInterval(() => {
    const pending = loadPending();
    const id = pending?.accountId || wallet.value?.accountId;
    if (id) pollVerification(id);
  }, VERIFY_INTERVAL_MS);
  elapsedTimer = setInterval(() => {
    elapsedLabel.value = formatElapsed(Date.now() - startedAt);
  }, 1000);
}

async function startCreation() {
  if (!password.value || creating.value) return;
  creating.value = true;
  createError.value = '';
  verifyError.value = '';
  try {
    const res = await $fetch('/api/account', {
      method: 'POST',
      body: { password: password.value },
    });
    savePending({
      accountId: res.accountId,
      privateKeyDer: res.privateKeyDer,
      publicKeyDer: res.publicKeyDer,
      createdAt: Date.now(),
    });
    state.value = 'creating';
    startedAt = Date.now();
    startPolling();
  } catch (e) {
    const status = e?.statusCode || e?.response?.status;
    createError.value = status === 401 ? t('wrongPassword') : t('genericError');
  } finally {
    creating.value = false;
  }
}

function resumePending() {
  const pending = loadPending();
  if (!pending?.accountId) return false;
  state.value = 'creating';
  startedAt = pending.createdAt || Date.now();
  // Si ya pasó el tiempo máximo, se verifica una última vez de todas formas.
  startPolling();
  return true;
}

function logout() {
  if (!window.confirm(t('logoutConfirm'))) return;
  clearWallet();
  wallet.value = null;
  state.value = 'welcome';
}

onMounted(() => {
  wallet.value = loadWallet();
  if (wallet.value?.accountId) {
    state.value = 'menu';
  } else if (!resumePending()) {
    state.value = 'welcome';
  }
});

onBeforeUnmount(stopTimers);
</script>
