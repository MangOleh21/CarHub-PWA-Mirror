import assert from 'node:assert/strict'
import test from 'node:test'
import { getPageItems, normalizePageInput } from './pagination.js'

test('client-side pagination returns the requested slice and page count', () => {
  const result = getPageItems([1, 2, 3, 4, 5, 6, 7], 2, 3)

  assert.deepEqual(result, { items: [4, 5, 6], page: 2, totalPages: 3 })
})

test('client-side pagination clamps a page after the list shrinks', () => {
  const result = getPageItems([1, 2, 3], 3, 2)

  assert.deepEqual(result, { items: [3], page: 2, totalPages: 2 })
})

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
