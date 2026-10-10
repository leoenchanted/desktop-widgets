import { CHUNK_SIZE, decryptCanvasMessage, encryptCanvasMessage, importCanvasKey } from './secureChannel';

const RELAY_URL = import.meta.env.VITE_CANVAS_RELAY_URL?.trim();

export const hasCanvasRelay = Boolean(RELAY_URL);

function socketUrl(room, host) {
  const url = new URL(RELAY_URL);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (!['wss:', 'ws:'].includes(url.protocol)) throw new Error('共享中继地址必须使用 HTTPS 或 WSS');
  url.pathname = `${url.pathname.replace(/\/$/, '')}/room/${room}`;
  url.search = `?role=${host ? 'host' : 'guest'}`;
  url.hash = '';
  return url.toString();
}

export async function createRelayCanvasSession({ invite, host, getSnapshot, onMessage, onStatus }) {
  if (!crypto.subtle) throw new Error('实时共享需要 HTTPS 或 localhost 的安全环境');
  const key = await importCanvasKey(invite.key);
  const endpoint = socketUrl(invite.room, host);
  const fragments = new Map();
  let socket;
  let closed = false;
  let retryTimer;
  let waitTimer;
  let retries = 0;
  let firstSnapshot = true;

  const clearWait = () => { if (waitTimer) clearTimeout(waitTimer); waitTimer = null; };
  const send = async payload => {
    const cipher = await encryptCanvasMessage(key, payload);
    if (closed || socket?.readyState !== WebSocket.OPEN) return;
    const id = crypto.randomUUID();
    const count = Math.ceil(cipher.length / CHUNK_SIZE);
    for (let index = 0; index < count; index += 1) {
      if (closed || socket.readyState !== WebSocket.OPEN) break;
      socket.send(JSON.stringify({ type: 'data', id, index, count, part: cipher.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE) }));
    }
  };

  const receiveData = async frame => {
    if (typeof frame.from !== 'string' || typeof frame.id !== 'string' || !Number.isInteger(frame.count)
      || !Number.isInteger(frame.index) || frame.count < 1 || frame.count > 5000
      || frame.index < 0 || frame.index >= frame.count || typeof frame.part !== 'string') return;
    const id = `${frame.from}:${frame.id}`;
    const item = fragments.get(id) || { parts: Array(frame.count), count: 0, timer: null };
    if (item.parts.length !== frame.count) return;
    if (!item.parts[frame.index]) { item.parts[frame.index] = frame.part; item.count += 1; }
    if (!item.timer) item.timer = setTimeout(() => fragments.delete(id), 30000);
    fragments.set(id, item);
    if (item.count !== frame.count) return;
    clearTimeout(item.timer);
    fragments.delete(id);

    try {
      const message = await decryptCanvasMessage(key, item.parts.join(''));
      if (message?.type === 'snapshot' && Array.isArray(message.elements)) {
        onMessage(message);
        if (host) await send({ type: 'snapshot', elements: getSnapshot() });
        else {
          clearWait();
          onStatus('connected', 1);
          if (firstSnapshot) {
            firstSnapshot = false;
            await send({ type: 'snapshot', elements: getSnapshot() });
          }
        }
      } else if (message?.type === 'element' && message.element?.id) {
        onMessage(message);
        if (host) await send(message);
      }
    } catch (error) {
      if (!closed) onStatus('decrypt-error', 0, error);
    }
  };

  const connect = () => {
    if (closed) return;
    firstSnapshot = true;
    socket = new WebSocket(endpoint);
    socket.addEventListener('open', () => {
      retries = 0;
      onStatus('connecting', 0);
      if (!host) {
        clearWait();
        waitTimer = setTimeout(() => onStatus('error', 0, new Error('发起者暂未回应，请确认对方仍在原共享画布中')), 15000);
      }
    });
    socket.addEventListener('message', event => {
      let frame;
      try { frame = JSON.parse(event.data); } catch { return; }
      if (frame.type === 'room-state') {
        if (host) onStatus('hosting', frame.peers || 0);
        else if (!frame.hostOnline) onStatus('reconnecting', 0, new Error('发起者当前不在线，正在等待其返回原共享画布'));
      } else if (frame.type === 'guest-joined' && host) {
        send({ type: 'snapshot', elements: getSnapshot() }).catch(error => onStatus('error', 0, error));
      } else if (frame.type === 'host-online' && !host) {
        onStatus('connecting', 0, new Error('发起者已上线，正在同步画布…'));
        clearWait();
        waitTimer = setTimeout(() => onStatus('error', 0, new Error('发起者暂未回应，请确认对方仍在原共享画布中')), 15000);
      } else if (frame.type === 'host-offline' && !host) {
        clearWait();
        onStatus('reconnecting', 0, new Error('发起者已离线，画布内容仍保存在本机'));
      } else if (frame.type === 'data') {
        receiveData(frame);
      }
    });
    socket.addEventListener('close', () => {
      clearWait();
      if (closed) return;
      retries += 1;
      onStatus('reconnecting', 0, new Error('共享中继暂时断开，正在自动重连…'));
      retryTimer = setTimeout(connect, Math.min(1000 * 2 ** Math.min(retries, 4), 10000));
    });
    socket.addEventListener('error', () => {
      if (!closed) onStatus('reconnecting', 0, new Error('无法连接共享中继，正在重试…'));
    });
  };

  connect();
  return {
    send,
    close: () => {
      closed = true;
      clearWait();
      if (retryTimer) clearTimeout(retryTimer);
      fragments.forEach(item => clearTimeout(item.timer));
      fragments.clear();
      socket?.close();
    },
  };
}
