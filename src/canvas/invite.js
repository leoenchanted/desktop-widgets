function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createInvite() {
  return { room: hex(crypto.getRandomValues(new Uint8Array(16))), key: hex(crypto.getRandomValues(new Uint8Array(32))) };
}

export function readInvite() {
  const match = /^#canvas=([a-f0-9]{32})\.([a-f0-9]{64})$/i.exec(window.location.hash);
  return match ? { room: match[1], key: match[2] } : null;
}

export function inviteUrl({ room, key }) {
  return `${window.location.origin}${window.location.pathname}${window.location.search}#canvas=${room}.${key}`;
}
