import assert from 'node:assert/strict'
import test from 'node:test'
import { getSafeRedirectTarget, getUserAuthErrorMessage } from './user-auth.js'

test('getUserAuthErrorMessage maps user auth errors to safe Indonesian messages', () => {
  assert.match(getUserAuthErrorMessage({ code: 'INVALID_CREDENTIALS' }, 'login'), /Email atau kata sandi/)
  assert.match(getUserAuthErrorMessage({ code: 'EMAIL_ALREADY_REGISTERED' }, 'register'), /sudah terdaftar/)
  assert.match(getUserAuthErrorMessage({ code: 'RATE_LIMITED' }, 'login'), /Terlalu banyak/)
  assert.match(getUserAuthErrorMessage({ code: 'NETWORK_ERROR' }, 'login'), /koneksi/)
  assert.match(getUserAuthErrorMessage({}, 'register'), /Pendaftaran/)
})

test('getSafeRedirectTarget allows safe in-app routes and rejects external or admin redirects', () => {
  assert.equal(getSafeRedirectTarget('?next=/sell'), '/sell')
  assert.equal(getSafeRedirectTarget('?next=/profile'), '/profile')
  assert.equal(getSafeRedirectTarget('?next=/about'), '/about')
  assert.equal(getSafeRedirectTarget('?next=https://evil.example'), '/profile')
  assert.equal(getSafeRedirectTarget('?next=//evil.example'), '/profile')
  assert.equal(getSafeRedirectTarget('?next=/admin'), '/profile')
  assert.equal(getSafeRedirectTarget(''), '/profile')
})
