const ROOM_PATTERN = /^[a-f0-9]{32}$/i;
const TURN_CREDENTIAL_URL = 'https://rtc.live.cloudflare.com/v1/turn/keys';

function json(data, status) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const allowedOrigin = process.env.CANVAS_TURN_ALLOWED_ORIGIN || 'https://desktop.leoenchanted.top';
  if (request.headers.get('origin') !== allowedOrigin) return json({ error: 'Forbidden' }, 403);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request' }, 400); }
  if (!ROOM_PATTERN.test(body?.room || '')) return json({ error: 'Invalid room' }, 400);

  const keyId = process.env.CANVAS_TURN_KEY_ID;
  const apiToken = process.env.CANVAS_TURN_API_TOKEN;
  if (!keyId || !apiToken) return json({ error: 'TURN is not configured' }, 503);

  try {
    const response = await fetch(`${TURN_CREDENTIAL_URL}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: 3600 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error('Canvas TURN credential request failed', response.status);
      return json({ error: 'TURN is unavailable' }, 502);
    }
    const result = await response.json();
    const iceServers = result.iceServers?.filter(server => server?.username && server?.credential && (typeof server.urls === 'string' || Array.isArray(server.urls)));
    if (!iceServers?.length) return json({ error: 'TURN response is invalid' }, 502);
    return json({ iceServers }, 200);
  } catch (error) {
    console.error('Canvas TURN credential request failed', error);
    return json({ error: 'TURN is unavailable' }, 502);
  }
}
