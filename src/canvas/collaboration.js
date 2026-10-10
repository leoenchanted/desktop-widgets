import Peer from 'peerjs';
import { CHUNK_SIZE, decryptCanvasMessage, encryptCanvasMessage, importCanvasKey } from './secureChannel';

const ROOM_PREFIX = 'desktop-canvas-';
const CONNECT_TIMEOUT = 12000;
const SNAPSHOT_TIMEOUT = 15000;
const SIGNAL_TIMEOUT = 12000;
const MAX_ATTEMPTS = 5;
const STUN_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

async function connectionConfig(room) {
  try {
    const response = await fetch('/api/canvas-turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room }),
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (response.ok) {
      const result = await response.json();
      const servers = result.iceServers?.filter(server => server && (typeof server.urls === 'string' || Array.isArray(server.urls)));
      if (servers?.length) return { iceServers: [...STUN_SERVERS, ...servers], hasRelay: servers.some(server => server.username && server.credential) };
    }
  } catch {
    // A missing TURN service still allows direct connections through STUN.
  }
  return { iceServers: STUN_SERVERS, hasRelay: false };
}

export async function createCanvasSession({ invite, host, getSnapshot, onMessage, onStatus }) {
  if (!crypto.subtle) throw new Error('实时共享需要 HTTPS 或 localhost 的安全环境');
  const key = await importCanvasKey(invite.key);
  const { iceServers, hasRelay } = await connectionConfig(invite.room);
  const peer = new Peer(host ? `${ROOM_PREFIX}${invite.room}` : undefined, { config: { iceServers } });
  const connections = new Set();
  const fragments = new Map();
  let closed = false;
  let peerOpen = false;
  let guestConnection = null;
  let guestTimer = null;
  let retryTimer = null;
  let signalTimer = null;
  let reconnectTimer = null;
  let attempts = 0;

  const liveConnections = () => Array.from(connections).filter(connection => connection.open).length;
  const clearGuestTimer = () => { if (guestTimer) clearTimeout(guestTimer); guestTimer = null; };

  const connectGuest = () => {
    if (closed || host || !peerOpen || guestConnection) return;
    const connection = peer.connect(`${ROOM_PREFIX}${invite.room}`, { reliable: true });
    guestConnection = connection;
    bind(connection);
    guestTimer = setTimeout(() => failGuest(connection), CONNECT_TIMEOUT);
  };

  const failGuest = (connection) => {
    if (closed || host || connection !== guestConnection) return;
    guestConnection = null;
    clearGuestTimer();
    connections.delete(connection);
    connection.close();
    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      onStatus('error', 0, new Error(hasRelay ? '无法建立共享连接，请确认发起者仍在线，然后重试' : '当前网络无法直连，站点尚未配置共享中继'));
      return;
    }
    onStatus('reconnecting', 0, new Error(hasRelay
      ? `正在重新连接（${attempts}/${MAX_ATTEMPTS}）`
      : `当前网络未配置中继，正在重试直连（${attempts}/${MAX_ATTEMPTS}）`));
    retryTimer = setTimeout(() => { retryTimer = null; connectGuest(); }, Math.min(1500 * attempts, 6000));
  };

  const sendTo = async (connection, payload) => {
    if (!connection.open || closed) return;
    const cipher = await encryptCanvasMessage(key, payload);
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

  function bind(connection) {
    let firstSnapshot = true;
    connections.add(connection);
    connection.on('open', () => {
      if (host) {
        onStatus('hosting', liveConnections());
        sendTo(connection, { type: 'snapshot', elements: getSnapshot() }).catch(error => onStatus('error', liveConnections(), error));
      } else {
        clearGuestTimer();
        guestTimer = setTimeout(() => failGuest(connection), SNAPSHOT_TIMEOUT);
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
        const message = await decryptCanvasMessage(key, existing.parts.join(''));
        if (message?.type === 'snapshot' && Array.isArray(message.elements)) {
          onMessage(message);
          if (host) await broadcast({ type: 'snapshot', elements: getSnapshot() }, connection);
          else {
            clearGuestTimer();
            attempts = 0;
            onStatus('connected', 1);
            if (firstSnapshot) {
              firstSnapshot = false;
              await sendTo(connection, { type: 'snapshot', elements: getSnapshot() });
            }
          }
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
      if (host) onStatus('hosting', liveConnections());
      else failGuest(connection);
    });
    connection.on('error', error => {
      if (host) onStatus('error', liveConnections(), error);
      else failGuest(connection);
    });
  }

  peer.on('open', () => {
    peerOpen = true;
    if (signalTimer) clearTimeout(signalTimer);
    if (host) onStatus('hosting', 0);
    else connectGuest();
  });
  peer.on('connection', connection => {
    if (host) bind(connection);
    else connection.close();
  });
  peer.on('error', error => {
    if (!host && error.type === 'peer-unavailable') {
      if (guestConnection) failGuest(guestConnection);
      return;
    }
    onStatus('error', liveConnections(), error);
  });
  peer.on('disconnected', () => {
    if (closed) return;
    peerOpen = false;
    onStatus('disconnected', liveConnections(), new Error('共享服务器连接中断'));
    reconnectTimer = setTimeout(() => { if (!closed && peer.disconnected) peer.reconnect(); }, 1500);
  });
  signalTimer = setTimeout(() => { if (!closed && !peerOpen) onStatus('error', 0, new Error('无法连接共享服务器，请检查网络后重试')); }, SIGNAL_TIMEOUT);

  return {
    send: payload => broadcast(payload),
    close: () => {
      closed = true;
      clearGuestTimer();
      if (retryTimer) clearTimeout(retryTimer);
      if (signalTimer) clearTimeout(signalTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      fragments.forEach(entry => clearTimeout(entry.timer));
      fragments.clear();
      connections.forEach(conn => conn.close());
      peer.destroy();
    },
  };
}
