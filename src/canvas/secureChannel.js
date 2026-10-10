export const CHUNK_SIZE = 12000;

function unhex(value) {
  return Uint8Array.from(value.match(/.{2}/g), pair => parseInt(pair, 16));
}

export function importCanvasKey(secret) {
  return crypto.subtle.importKey('raw', unhex(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function encode(bytes) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function decode(value) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export async function encryptCanvasMessage(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  return `${encode(iv)}.${encode(ciphertext)}`;
}

export async function decryptCanvasMessage(key, value) {
  const [iv, ciphertext] = value.split('.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, key, decode(ciphertext));
  return JSON.parse(new TextDecoder().decode(bytes));
}
