import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMileage, formatPrice, whatsappUrl } from './format.js'

test('formats backend string prices and mileage for Indonesian readers', () => {
  assert.match(formatPrice('180000000'), /180\.000\.000/)
  assert.equal(formatMileage(25000), '25.000 km')
})

test('normalizes local Indonesian numbers and encodes WhatsApp messages', () => {
  const url = new URL(whatsappUrl('0812 3456 7890', 'Halo, saya tertarik!'))

  assert.equal(url.hostname, 'wa.me')
  assert.equal(url.pathname, '/6281234567890')
  assert.equal(url.searchParams.get('text'), 'Halo, saya tertarik!')
})

test('rejects invalid seller phone numbers before building a contact link', () => {
  assert.throws(() => whatsappUrl('not-a-phone', 'Halo'), TypeError)
})
