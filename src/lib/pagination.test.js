import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePageInput } from './pagination.js'

test('pagination input accepts a page within the available range', () => {
  assert.equal(normalizePageInput('3', 1, 4), 3)
})

test('pagination input clamps pages above the last page', () => {
  assert.equal(normalizePageInput('8', 2, 4), 4)
})

test('pagination input keeps the current page for invalid values', () => {
  assert.equal(normalizePageInput('', 2, 4), 2)
  assert.equal(normalizePageInput('0', 2, 4), 2)
  assert.equal(normalizePageInput('2.5', 2, 4), 2)
})
