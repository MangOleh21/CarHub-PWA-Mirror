import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCarShareDetails, shareLink } from './share.js'

test('builds a share URL for the selected car detail', () => {
  const details = buildCarShareDetails(
    { id: 'car/42', brand: 'Honda', model: 'Civic', year: 2022 },
    'https://carhub.example',
  )

  assert.deepEqual(details, {
    title: 'Honda Civic 2022 | CarHub',
    text: 'Lihat Honda Civic tahun 2022 di CarHub.',
    url: 'https://carhub.example/cars/car%2F42',
  })
})

test('shares a car detail URL and its title with the native share sheet', async () => {
  let sharedData
  const details = {
    title: 'Honda Civic 2022 | CarHub',
    text: 'Lihat Honda Civic tahun 2022 di CarHub.',
    url: 'https://carhub.example/cars/42',
  }

  const result = await shareLink({
    ...details,
    share: async (data) => { sharedData = data },
    writeClipboard: async () => assert.fail('Native sharing should be preferred'),
  })

  assert.equal(result, 'shared')
  assert.deepEqual(sharedData, details)
})

test('copies the car detail URL when native sharing is unavailable', async () => {
  let copiedUrl

  const result = await shareLink({
    title: 'Honda Civic 2022 | CarHub',
    text: 'Lihat Honda Civic tahun 2022 di CarHub.',
    url: 'https://carhub.example/cars/42',
    writeClipboard: async (url) => { copiedUrl = url },
  })

  assert.equal(result, 'copied')
  assert.equal(copiedUrl, 'https://carhub.example/cars/42')
})

test('does not copy when a user cancels the native share sheet', async () => {
  let clipboardUsed = false
  const cancel = Object.assign(new Error('Share cancelled'), { name: 'AbortError' })

  const result = await shareLink({
    title: 'Honda Civic 2022 | CarHub',
    text: 'Lihat Honda Civic tahun 2022 di CarHub.',
    url: 'https://carhub.example/cars/42',
    share: async () => { throw cancel },
    writeClipboard: async () => { clipboardUsed = true },
  })

  assert.equal(result, 'cancelled')
  assert.equal(clipboardUsed, false)
})

test('surfaces clipboard failures instead of reporting a successful share', async () => {
  await assert.rejects(
    shareLink({
      title: 'Honda Civic 2022 | CarHub',
      text: 'Lihat Honda Civic tahun 2022 di CarHub.',
      url: 'https://carhub.example/cars/42',
      writeClipboard: async () => { throw new Error('Clipboard unavailable') },
    }),
    /Clipboard unavailable/,
  )
})
