import { decodeMessage, formatTimestamp } from './wallet.js';

export const DEFAULT_MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';

export function mirrorBaseUrl() {
  try {
    const config = useRuntimeConfig();
    return (config.public?.mirrorNodeUrl || DEFAULT_MIRROR_NODE_URL).replace(/\/$/, '');
  } catch {
    return DEFAULT_MIRROR_NODE_URL;
  }
}

// Lee los últimos mensajes directamente del Hedera public mirror node.
export async function fetchMirrorMessages(topicId, limit = 30, baseUrl = mirrorBaseUrl()) {
  const url = `${baseUrl}/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mirror node respondió ${res.status}`);
  const data = await res.json();
  return (data.messages || [])
    .map((m) => ({
      id: m.sequence_number,
      timestamp: formatTimestamp(m.consensus_timestamp),
      accountId: m.payer_account_id,
      message: decodeMessage(m.message),
    }))
    .reverse(); // orden ascendente: el último mensaje abajo
}

export function mirrorMessagesUrl(topicId, limit = 30, baseUrl = mirrorBaseUrl()) {
  return `${baseUrl}/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;
}
