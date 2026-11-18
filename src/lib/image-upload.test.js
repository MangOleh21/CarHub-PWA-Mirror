import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getImageFileError, maxImageSizeBytes } from './image-upload.js'

test('image picker accepts supported files at the 5 MB limit', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(getImageFileError({ type, size: maxImageSizeBytes }), null)
  }
})

test('image picker rejects unsupported, empty, and oversized files', () => {
  assert.match(getImageFileError({ type: 'image/svg+xml', size: 1024 }), /JPG, PNG, atau WebP/)
  assert.match(getImageFileError({ type: 'image/jpeg', size: 0 }), /tidak valid/)
  assert.match(getImageFileError({ type: 'image/png', size: maxImageSizeBytes + 1 }), /5 MB/)
})
