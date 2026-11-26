import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canUseOfflineFallback,
  getOfflineCar,
  getOfflineCarBrands,
  getOfflineCars,
} from './offline-cars.js'

test('offline catalog supports the catalog filters, sorting, and pagination', () => {
  const result = getOfflineCars({
    search: 'honda',
    minYear: 2020,
    sortBy: 'year',
    sortOrder: 'desc',
    page: 1,
    pageSize: 1,
  })

  assert.equal(result.data.length, 1)
  assert.equal(result.data[0].brand, 'Honda')
  assert.equal(result.data[0].isOfflineSample, true)
  assert.deepEqual(result.pagination, {
    page: 1,
    pageSize: 1,
    totalItems: 1,
    totalPages: 1,
  })
})

test('offline catalog exposes local brands and sample details by id', () => {
  assert.ok(getOfflineCarBrands().includes('Mitsubishi'))
  assert.equal(getOfflineCar('offline-honda-brio').model, 'Brio RS')
  assert.equal(getOfflineCar('not-a-sample'), null)
})

test('offline catalog supports bodyType multi-select, color, and fuelType filters', () => {
  const result = getOfflineCars({
    bodyType: ['SUV', 'MPV'],
    fuelType: 'Diesel',
    color: 'Hitam',
  })

  assert.equal(result.data.length, 1)
  assert.equal(result.data[0].id, 'offline-mitsubishi-pajero')
})

test('offline fallback is offered for connection and server failures, not validation errors', () => {
  assert.equal(canUseOfflineFallback({ status: 0 }), true)
  assert.equal(canUseOfflineFallback({ status: 503 }), true)
  assert.equal(canUseOfflineFallback({ status: 422 }), false)
})
