import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ||= 'postgres://unused:unused@127.0.0.1:5432/unused';
process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-for-jwt-signing-123456';

const { hashToken, signSession, getUserFromToken } = await import('../src/auth.js');
const { isUuid, isEmail, normalizeEmail, safeText, requireUuid } = await import('../src/validation.js');

test('UUID validation rejects manipulated identifiers', () => {
  assert.equal(isUuid('450e9a27-1f25-416e-9924-556704367426'), true);
  assert.equal(isUuid('450e9a27-1f25-416e-9924-556704367426; DROP TABLE staff_users'), false);
  assert.equal(isUuid('../../etc/passwd'), false);
  assert.throws(() => requireUuid('bad'), /Invalid id/);
});

test('email and text helpers normalize untrusted input', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
  assert.equal(isEmail('user@example.com'), true);
  assert.equal(isEmail('not-an-email'), false);
  assert.equal(safeText('hello\n<script>alert(1)</script>', 20), 'hello <script>alert(');
});

test('tokens are hashed, not stored in plain text', () => {
  const token = 'a-very-sensitive-refresh-token';
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), hashToken('another-token'));
});

test('JWTs are signed with issuer, audience and jti and reject tampering', () => {
  const token = signSession({ id: '450e9a27-1f25-416e-9924-556704367426', role: 'staff', session_version: 3 });
  const payload = getUserFromToken(token);
  assert.equal(payload.sub, '450e9a27-1f25-416e-9924-556704367426');
  assert.equal(payload.role, 'staff');
  assert.equal(payload.ver, 3);
  assert.equal(payload.iss, 'ledge-roofing-api');
  assert.equal(payload.aud, 'ledge-roofing-dashboard');
  assert.ok(payload.jti);
  assert.throws(() => getUserFromToken(`${token}x`), /invalid signature|jwt malformed/);
});
