import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminLoginErrorMessage } from './admin-login.js'

test('login errors explain invalid credentials without exposing backend details', () => {
  assert.equal(
    getAdminLoginErrorMessage({ code: 'INVALID_CREDENTIALS', message: 'Sensitive backend detail' }),
    'Email atau kata sandi tidak sesuai.',
  )
})

test('login rate limits and connection failures have actionable messages', () => {
  assert.match(getAdminLoginErrorMessage({ code: 'RATE_LIMITED' }), /Tunggu 15 menit/)
  assert.match(getAdminLoginErrorMessage({ code: 'NETWORK_ERROR' }), /Periksa koneksi internet/)
})

test('unknown login failures use a safe generic message', () => {
  assert.equal(
    getAdminLoginErrorMessage({ code: 'INTERNAL_ERROR', message: 'Database password leaked' }),
    'Login sedang tidak dapat diproses. Coba lagi beberapa saat lagi.',
  )
})
