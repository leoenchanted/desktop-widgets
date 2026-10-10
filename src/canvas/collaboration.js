import Peer from 'peerjs';

const ROOM_PREFIX = 'desktop-canvas-';
const CHUNK_SIZE = 12000;

function unhex(value) {
  return Uint8Array.from(value.match(/.{2}/g), pair => parseInt(pair, 16));
}

async function importKey(secret) {
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

async function encrypt(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  return `${encode(iv)}.${encode(ciphertext)}`;
}

async function decrypt(key, value) {
  const [iv, ciphertext] = value.split('.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, key, decode(ciphertext));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function createCanvasSession({ invite, host, getSnapshot, onMessage, onStatus }) {
  if (!crypto.subtle) throw new Error('实时共享需要 HTTPS 或 localhost 的安全环境');
  const key = await importKey(invite.key);
  const peer = new Peer(host ? `${ROOM_PREFIX}${invite.room}` : undefined);
  const connections = new Set();
  const fragments = new Map();
  let closed = false;

  const sendTo = async (connection, payload) => {
    if (!connection.open || closed) return;
    const cipher = await encrypt(key, payload);
    const id = crypto.randomUUID();
    const count = Math.ceil(cipher.length / CHUNK_SIZE);
    for (let index = 0; index < count; index += 1) {
      if (!connection.open || closed) break;
      connection.send({ id, index, count, part: cipher.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE) });
    }
  };

  const broadcast = async (payload, except = null) => {
    await Promise.all(Array.from(connections).filter(conn => conn !== except).map(conn => sendTo(conn, payload)));
  };

  const bind = (connection) => {
    connections.add(connection);
    connection.on('open', () => {
      if (host) {
        onStatus('hosting', connections.size);
        sendTo(connection, { type: 'snapshot', elements: getSnapshot() });
      } else {
        onStatus('connected', 1);
      }
    });
    connection.on('data', async (chunk) => {
      if (!chunk || typeof chunk.id !== 'string' || chunk.count > 5000 || chunk.count < 1 || chunk.index >= chunk.count || typeof chunk.part !== 'string') return;
      const keyForChunk = `${connection.peer}:${chunk.id}`;
      const existing = fragments.get(keyForChunk) || { parts: Array(chunk.count), count: 0, timer: null };
      if (!existing.parts[chunk.index]) {
        existing.parts[chunk.index] = chunk.part;
        existing.count += 1;
      }
      if (!existing.timer) existing.timer = setTimeout(() => fragments.delete(keyForChunk), 30000);
      fragments.set(keyForChunk, existing);
      if (existing.count !== chunk.count) return;
      clearTimeout(existing.timer);
      fragments.delete(keyForChunk);
      try {
        const message = await decrypt(key, existing.parts.join(''));
        if (message?.type === 'snapshot' && !host && Array.isArray(message.elements)) {
          onMessage(message);
        } else if (message?.type === 'element' && message.element?.id) {
          onMessage(message);
          if (host) await broadcast(message, connection);
        }
      } catch (error) {
        onStatus('decrypt-error', connections.size, error);
      }
    });
    connection.on('close', () => {
      connections.delete(connection);
      onStatus(host ? 'hosting' : 'disconnected', connections.size);
    });
    connection.on('error', error => onStatus('error', connections.size, error));
  };

  peer.on('open', () => {
    if (host) onStatus('hosting', 0);
    else bind(peer.connect(`${ROOM_PREFIX}${invite.room}`, { reliable: true }));
  });
  peer.on('connection', connection => {
    if (host) bind(connection);
    else connection.close();
  });
  peer.on('error', error => onStatus('error', connections.size, error));
  peer.on('disconnected', () => { if (!connections.size) onStatus('disconnected', 0); });

  return {
    send: payload => broadcast(payload),
    close: () => {
      closed = true;
      fragments.forEach(entry => clearTimeout(entry.timer));
      fragments.clear();
      connections.forEach(conn => conn.close());
      peer.destroy();
    },
  };
}
