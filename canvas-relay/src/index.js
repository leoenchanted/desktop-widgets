import { DurableObject } from 'cloudflare:workers';

const ROOM_PATH = /^\/room\/([a-f0-9]{32})$/i;
const DEFAULT_ORIGIN = 'https://desktop.leoenchanted.top';
const MAX_FRAME_SIZE = 20000;

function send(socket, data) {
  try { socket.send(JSON.stringify(data)); } catch { /* The socket is closing. */ }
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok');
    const match = ROOM_PATH.exec(url.pathname);
    if (!match) return new Response('Not found', { status: 404 });
    if (request.headers.get('Origin') !== (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket required', { status: 426 });
    }
    if (!['host', 'guest'].includes(url.searchParams.get('role'))) {
      return new Response('Invalid role', { status: 400 });
    }
    return env.ROOMS.getByName(match[1].toLowerCase()).fetch(request);
  },
};

export class CanvasRoom extends DurableObject {
  sockets() {
    return this.ctx.getWebSockets();
  }

  host() {
    return this.sockets().find(socket => socket.readyState === WebSocket.OPEN && socket.deserializeAttachment()?.role === 'host');
  }

  guests() {
    return this.sockets().filter(socket => socket.readyState === WebSocket.OPEN && socket.deserializeAttachment()?.role === 'guest');
  }

  fetch(request) {
    const role = new URL(request.url).searchParams.get('role');
    if (role === 'host' && this.host()) return new Response('Room host is already online', { status: 409 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id: crypto.randomUUID(), role });

    if (role === 'host') {
      send(server, { type: 'room-state', peers: this.guests().length, hostOnline: true });
      for (const guest of this.guests()) send(guest, { type: 'host-online' });
      if (this.guests().length) send(server, { type: 'guest-joined' });
    } else {
      const host = this.host();
      send(server, { type: 'room-state', peers: this.guests().length, hostOnline: Boolean(host) });
      if (host) {
        send(host, { type: 'guest-joined' });
        send(host, { type: 'room-state', peers: this.guests().length, hostOnline: true });
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_FRAME_SIZE) {
      socket.close(1009, 'Frame too large');
      return;
    }
    let frame;
    try { frame = JSON.parse(raw); } catch { return; }
    if (frame?.type !== 'data' || typeof frame.id !== 'string' || !Number.isInteger(frame.index)
      || !Number.isInteger(frame.count) || frame.count < 1 || frame.count > 5000
      || frame.index < 0 || frame.index >= frame.count || typeof frame.part !== 'string') return;

    const sender = socket.deserializeAttachment();
    if (!sender) return;
    const envelope = { type: 'data', from: sender.id, id: frame.id, index: frame.index, count: frame.count, part: frame.part };
    if (sender.role === 'host') {
      for (const guest of this.guests()) send(guest, envelope);
    } else {
      const host = this.host();
      if (host) send(host, envelope);
    }
  }

  webSocketClose(socket) {
    const role = socket.deserializeAttachment()?.role;
    if (role === 'host') {
      for (const guest of this.guests()) send(guest, { type: 'host-offline' });
    } else if (role === 'guest') {
      const host = this.host();
      if (host) send(host, { type: 'room-state', peers: this.guests().filter(guest => guest !== socket).length, hostOnline: true });
    }
  }

  webSocketError(socket) {
    this.webSocketClose(socket);
  }
}
