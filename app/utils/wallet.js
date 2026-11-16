// Utilidades del lado del cliente para la "billetera" demostrativa
// guardada en localStorage.

export const WALLET_KEY = 'wk_account';
export const PENDING_KEY = 'wk_pending';
export const MAX_MESSAGE_BYTES = 1024;

export function loadWallet() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWallet(wallet) {
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function clearWallet() {
  window.localStorage.removeItem(WALLET_KEY);
  window.localStorage.removeItem(PENDING_KEY);
}

export function loadPending() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePending(pending) {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function clearPending() {
  window.localStorage.removeItem(PENDING_KEY);
}

export function utf8Length(text) {
  return new TextEncoder().encode(text).length;
}

// Decodifica el campo `message` del Mirror Node (base64 -> UTF-8).
export function decodeMessage(base64) {
  try {
    const bin = atob(base64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

export function formatTimestamp(ts) {
  // consensus_timestamp viene como "1699999999.000000001"
  const seconds = Number(String(ts).split('.')[0]);
  if (!Number.isFinite(seconds)) return String(ts);
  return new Date(seconds * 1000).toLocaleString();
}
