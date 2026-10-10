import assert from 'node:assert/strict';
import { POST } from '../api/canvas-turn.js';

const origin = 'https://desktop.leoenchanted.top';
const room = 'a'.repeat(32);
const request = (requestOrigin = origin, body = { room }) => new Request(`${origin}/api/canvas-turn`, {
  method: 'POST',
  headers: { origin: requestOrigin, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

assert.equal((await POST(request('https://another.example'))).status, 403);
assert.equal((await POST(request(origin, { room: 'invalid' }))).status, 400);
assert.equal((await POST(request())).status, 503);

const originalFetch = globalThis.fetch;
const previousId = process.env.CANVAS_TURN_KEY_ID;
const previousToken = process.env.CANVAS_TURN_API_TOKEN;
try {
  process.env.CANVAS_TURN_KEY_ID = 'test-key';
  process.env.CANVAS_TURN_API_TOKEN = 'test-token';
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/v1\/turn\/keys\/test-key\/credentials\/generate-ice-servers$/);
    assert.equal(options.headers.authorization, 'Bearer test-token');
    assert.equal(JSON.parse(options.body).ttl, 3600);
    return Response.json({ iceServers: [{ urls: ['turns:turn.cloudflare.com:443?transport=tcp'], username: 'temporary', credential: 'temporary-secret' }] }, { status: 201 });
  };
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).iceServers[0].username, 'temporary');
} finally {
  globalThis.fetch = originalFetch;
  if (previousId === undefined) delete process.env.CANVAS_TURN_KEY_ID;
  else process.env.CANVAS_TURN_KEY_ID = previousId;
  if (previousToken === undefined) delete process.env.CANVAS_TURN_API_TOKEN;
  else process.env.CANVAS_TURN_API_TOKEN = previousToken;
}

console.log('Canvas TURN endpoint tests passed.');
