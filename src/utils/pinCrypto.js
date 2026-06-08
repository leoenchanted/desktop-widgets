const ITERATIONS = 150000;
const VERIFIER_TEXT = 'desktop-widgets-pinned-note-verifier-v1';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomBase64(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

export function isValidPin(pin) {
  return /^\d{6}$/.test(pin);
}

async function deriveKey(pin, salt) {
  if (!crypto.subtle) {
    throw new Error('当前浏览器不支持本地加密能力');
  }

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptPinnedText(text, key) {
  const iv = randomBase64(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    encoder.encode(text),
  );

  return {
    iv,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptPinnedText(encrypted, key) {
  if (!encrypted?.iv || !encrypted?.ciphertext) {
    throw new Error('加密内容不完整');
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encrypted.iv) },
    key,
    base64ToBytes(encrypted.ciphertext),
  );

  return decoder.decode(plaintext);
}

export async function createPinnedPassword(pin) {
  if (!isValidPin(pin)) throw new Error('密码必须是 6 位数字');

  const salt = randomBase64(16);
  const key = await deriveKey(pin, salt);
  const verifier = await encryptPinnedText(VERIFIER_TEXT, key);

  return {
    key,
    password: {
      enabled: true,
      version: 1,
      kdf: 'PBKDF2-SHA256',
      iterations: ITERATIONS,
      salt,
      verifier,
    },
  };
}

export async function unlockPinnedPassword(pin, password) {
  if (!isValidPin(pin)) throw new Error('密码必须是 6 位数字');
  if (!password?.salt || !password?.verifier) throw new Error('还没有设置置顶记录密码');

  const key = await deriveKey(pin, password.salt);
  let verifier;
  try {
    verifier = await decryptPinnedText(password.verifier, key);
  } catch {
    throw new Error('密码不正确');
  }
  if (verifier !== VERIFIER_TEXT) {
    throw new Error('密码不正确');
  }

  return key;
}
