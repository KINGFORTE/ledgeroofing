const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function safeText(value, maxLength = 500) {
  let cleaned = '';
  for (const character of String(value ?? '')) {
    const code = character.charCodeAt(0);
    cleaned += code < 32 || code === 127 ? ' ' : character;
  }
  return cleaned.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function requireUuid(value, label = 'id') {
  if (!isUuid(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
  return value;
}
