import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  ApiError,
  createSubmission,
  getAdminDashboardSummary,
  getCars,
  reviewSubmission,
  uploadImageFile,
} from './api.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('getCars sends filters and includes cookies in the API request', async () => {
  let requestUrl
  let requestOptions

  globalThis.fetch = async (url, options) => {
    requestUrl = url instanceof Request ? url.url : url
    requestOptions = url instanceof Request ? url : options
    return new Response(JSON.stringify({
      success: true,
      data: [{
        id: '42',
        brand: 'Toyota',
        model: 'Avanza',
        year: 2020,
        transmission: 'Automatic',
        fuelType: 'Bensin',
        mileage: 25000,
        price: '180000000',
        imageUrl: 'https://images.example.test/car.jpg',
        sellerName: 'Ayu',
        sellerPhone: '+6281234567890',
        location: 'Bandung',
        description: null,
        createdAt: '2026-01-15T10:30:00.000Z',
      }],
      pagination: { page: 2, pageSize: 10, totalItems: 1, totalPages: 1 },
    }), { status: 200 })
  }

  const result = await getCars({ search: 'Avanza & X', brand: 'Toyota', page: 2, pageSize: 10 })

  assert.equal(requestUrl, 'http://localhost:5000/api/cars?search=Avanza+%26+X&brand=Toyota&page=2&pageSize=10')
  assert.equal(requestOptions.credentials, 'include')
  assert.equal(result.data[0].id, '42')
  assert.equal(result.pagination.page, 2)
})

test('getCars preserves structured API errors for the UI', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: 'VALIDATION_ERROR', message: 'Invalid query' },
  }), { status: 422 })

  await assert.rejects(getCars(), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 422)
    assert.equal(error.code, 'VALIDATION_ERROR')
    assert.equal(error.message, 'Invalid query')
    return true
  })
})

test('getCars rejects malformed success envelopes instead of treating them as empty data', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })

  await assert.rejects(getCars(), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, 'INVALID_RESPONSE')
    return true
  })
})

test('reviewSubmission accepts the compact review result documented by the backend', async () => {
  let requestUrl
  globalThis.fetch = async (url) => {
    requestUrl = url instanceof Request ? url.url : url
    return new Response(JSON.stringify({
      success: true,
      data: {
        submission: {
          id: '105',
          status: 'approved',
          reviewedByEmail: 'admin@example.test',
          reviewNote: null,
        },
        car: { id: '42' },
      },
    }), { status: 200 })
  }

  const result = await reviewSubmission('105', 'approved', {})

  assert.equal(requestUrl, 'http://localhost:5000/api/admin/submissions/105/approved')
  assert.equal(result.submission.status, 'approved')
  assert.equal(result.car.id, '42')
})

test('createSubmission validates the pending-review receipt returned by the backend', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    data: { id: '105', status: 'pending', createdAt: '2026-01-15T10:30:00.000Z' },
  }), { status: 201 })

  const receipt = await createSubmission({ brand: 'Toyota' })

  assert.equal(receipt.id, '105')
  assert.equal(receipt.status, 'pending')
})

test('admin dashboard summary uses pagination totals instead of loading full datasets', async () => {
  const requestedUrls = []
  globalThis.fetch = async (url) => {
    const requestUrl = url instanceof Request ? url.url : url
    requestedUrls.push(requestUrl)
    const isCarsRequest = requestUrl.includes('/admin/cars?')
    return new Response(JSON.stringify({
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 1,
        totalItems: isCarsRequest ? 12 : 4,
        totalPages: isCarsRequest ? 12 : 4,
      },
    }), { status: 200 })
  }

  const summary = await getAdminDashboardSummary()

  assert.deepEqual(summary, { carListings: 12, pendingSubmissions: 4 })
  assert.equal(requestedUrls.length, 2)
  assert.ok(requestedUrls.every((url) => url.includes('pageSize=1')))
  assert.ok(requestedUrls.some((url) => url.includes('status=pending')))
})

test('admin dashboard summary propagates API failures for visible error handling', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: 'INTERNAL_ERROR', message: 'Unavailable' },
  }), { status: 503 })

  await assert.rejects(
    getAdminDashboardSummary(),
    (error) => error.status === 503 && error.code === 'INTERNAL_ERROR',
  )
})

test('image upload requests a scoped URL and sends file bytes without API credentials', async () => {
  const requests = []
  const presignedUrl = 'https://store.public.blob.vercel-storage.com/submissions/upload.png?signature=temporary'
  const imageUrl = 'https://store.public.blob.vercel-storage.com/submissions/upload.png'
  globalThis.fetch = async (input, options) => {
    const requestUrl = input instanceof Request ? input.url : input
    const requestOptions = input instanceof Request ? input : options
    if (requestUrl === presignedUrl) {
      requests.push({ url: requestUrl, options: requestOptions })
      return new Response(null, { status: 201 })
    }

    const request = input instanceof Request ? input : new Request(input, options)
    requests.push({ url: requestUrl, options: requestOptions, body: await request.json() })
    return new Response(JSON.stringify({
      success: true,
      data: { uploadUrl: presignedUrl, imageUrl },
    }), { status: 200 })
  }
  const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'photo.png', {
    type: 'image/png',
  })

  const uploadedUrl = await uploadImageFile(file, 'submissions')

  assert.equal(uploadedUrl, imageUrl)
  assert.equal(requests[0].url, 'http://localhost:5000/api/uploads/submissions')
  assert.deepEqual(requests[0].body, { contentType: 'image/png', size: file.size })
  assert.equal(requests[0].options.credentials, 'include')
  assert.equal(requests[1].url, presignedUrl)
  assert.equal(requests[1].options.method, 'PUT')
  assert.equal(requests[1].options.credentials, 'omit')
  assert.equal(requests[1].options.body, file)
})
