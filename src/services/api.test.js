import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  ApiError,
  archiveCar,
  createAdminCustomer,
  createSubmission,
  deleteAdminCustomer,
  getAdminCars,
  getAdminCustomers,
  getAdminDashboardSummary,
  getAdminUsers,
  getCars,
  getCarBrands,
  getMyListings,
  getUserSession,
  loginUser,
  logoutUser,
  permanentlyDeleteArchivedCar,
  registerUser,
  reviewSubmission,
  restoreCar,
  updateAdminCustomer,
  updateMyProfile,
  uploadImageFile,
  uploadImageFiles,
} from './api.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('getCars sends search, range, sorting filters and includes cookies in the API request', async () => {
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
        color: 'Putih',
        bodyType: 'MPV',
        mileage: 25000,
        price: '180000000',
        imageUrl: 'https://images.example.test/car.jpg',
        images: [
          'https://images.example.test/car.jpg',
          'https://images.example.test/car-side.jpg',
        ],
        sellerName: 'Ayu',
        sellerPhone: '+6281234567890',
        location: 'Bandung',
        description: null,
        createdAt: '2026-01-15T10:30:00.000Z',
      }],
      pagination: { page: 2, pageSize: 10, totalItems: 1, totalPages: 1 },
    }), { status: 200 })
  }

  const result = await getCars({
    search: 'Avanza & X',
    brand: 'Toyota',
    transmission: 'Automatic',
    fuelType: 'Bensin',
    color: 'Putih',
    bodyType: ['MPV', 'SUV'],
    minPrice: 100000000,
    maxPrice: 200000000,
    minYear: 2018,
    maxYear: 2022,
    sortBy: 'price',
    sortOrder: 'asc',
    page: 2,
    pageSize: 10,
  })

  assert.equal(
    requestUrl,
    'http://localhost:5000/api/cars?search=Avanza+%26+X&brand=Toyota&transmission=Automatic&fuelType=Bensin&color=Putih&minPrice=100000000&maxPrice=200000000&minYear=2018&maxYear=2022&sortBy=price&sortOrder=asc&bodyType=MPV&bodyType=SUV&page=2&pageSize=10',
  )
  assert.equal(requestOptions.credentials, 'include')
  assert.equal(result.data[0].id, '42')
  assert.equal(result.data[0].color, 'Putih')
  assert.equal(result.data[0].bodyType, 'MPV')
  assert.deepEqual(result.data[0].images, [
    'https://images.example.test/car.jpg',
    'https://images.example.test/car-side.jpg',
  ])
  assert.equal(result.pagination.page, 2)
})

test('getCarBrands returns the current brand options from the catalog API', async () => {
  let requestUrl
  globalThis.fetch = async (url) => {
    requestUrl = url instanceof Request ? url.url : url
    return new Response(JSON.stringify({
      success: true,
      data: ['Honda', 'Toyota'],
    }), { status: 200 })
  }

  assert.deepEqual(await getCarBrands(), ['Honda', 'Toyota'])
  assert.equal(requestUrl, 'http://localhost:5000/api/cars/brands')
})

test('getAdminCars requests the selected active or archived catalog', async () => {
  let requestUrl
  globalThis.fetch = async (url) => {
    requestUrl = url instanceof Request ? url.url : url
    return new Response(JSON.stringify({
      success: true,
      data: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    }), { status: 200 })
  }

  await getAdminCars({ archiveStatus: 'archived' })

  assert.equal(
    requestUrl,
    'http://localhost:5000/api/admin/cars?archiveStatus=archived&page=1&pageSize=20',
  )
})

test('archive and restore use the admin soft-delete endpoints', async () => {
  const requests = []
  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    requests.push({ url: request.url, method: request.method })
    return new Response(null, { status: 204 })
  }

  await archiveCar('42')
  await restoreCar('42')

  assert.deepEqual(requests, [
    { url: 'http://localhost:5000/api/admin/cars/42', method: 'DELETE' },
    { url: 'http://localhost:5000/api/admin/cars/42/restore', method: 'PATCH' },
  ])
})

test('permanently deletes a car through the dedicated archive endpoint', async () => {
  let requestUrl
  let requestMethod
  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    requestUrl = request.url
    requestMethod = request.method
    return new Response(null, { status: 204 })
  }

  await permanentlyDeleteArchivedCar('42')

  assert.equal(requestUrl, 'http://localhost:5000/api/admin/cars/42/permanent')
  assert.equal(requestMethod, 'DELETE')
})

test('getCars normalizes legacy single-image responses into a one-photo gallery', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    data: [{
      id: '42',
      brand: 'Toyota',
      model: 'Avanza',
      year: 2020,
      transmission: 'Automatic',
      mileage: 25000,
      price: '180000000',
      imageUrl: 'https://images.example.test/car.jpg',
      sellerName: 'Ayu',
      sellerPhone: '+6281234567890',
      location: null,
      description: null,
    }],
    pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
  }), { status: 200 })

  const result = await getCars()

  assert.deepEqual(result.data[0].images, ['https://images.example.test/car.jpg'])
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
          reviewedAt: '2026-11-24T00:00:00.000Z',
        },
        car: { id: '42' },
      },
    }), { status: 200 })
  }

  const result = await reviewSubmission('105', 'approved', {})

  assert.equal(requestUrl, 'http://localhost:5000/api/admin/submissions/105/approved')
  assert.equal(result.submission.status, 'approved')
  assert.equal(result.submission.reviewedAt, '2026-11-24T00:00:00.000Z')
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

test('getAdminUsers returns allowlisted account data from the owner endpoint', async () => {
  let requestUrl
  globalThis.fetch = async (url) => {
    requestUrl = url instanceof Request ? url.url : url
    return new Response(JSON.stringify({
      success: true,
      data: [{
        id: '2',
        email: 'admin@example.test',
        role: 'admin',
        isActive: true,
        createdAt: '2026-11-20T00:00:00.000Z',
        passwordHash: 'must-not-reach-the-ui',
      }],
    }), { status: 200 })
  }

  const admins = await getAdminUsers()

  assert.equal(requestUrl, 'http://localhost:5000/api/admin/users')
  assert.deepEqual(admins, [{
    id: '2',
    email: 'admin@example.test',
    role: 'admin',
    isActive: true,
    createdAt: '2026-11-20T00:00:00.000Z',
  }])
})

test('uploadImageFiles uploads multiple files sequentially and preserves gallery order', async () => {
  const calls = []
  const uploadUrl = 'https://api.cloudinary.com/v1_1/carhub-demo/image/upload'
  const files = ['first.png', 'second.png'].map((name) => new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
    name,
    { type: 'image/png' },
  ))
  let uploadIndex = 0

  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    if (request.url === uploadUrl) {
      const currentIndex = uploadIndex++
      calls.push(`cloudinary:${currentIndex}`)
      return new Response(JSON.stringify({
        secure_url: `https://res.cloudinary.com/carhub-demo/image/upload/v123/carhub/cars/${currentIndex}.png`,
        public_id: `upload-${currentIndex}`,
        format: 'png',
      }), { status: 200 })
    }

    calls.push(`signature:${uploadIndex}`)
    return new Response(JSON.stringify({
      success: true,
      data: {
        uploadUrl,
        uploadFields: {
          api_key: 'public-key',
          asset_folder: 'carhub/cars',
          allowed_formats: 'jpg,png,webp',
          overwrite: false,
          public_id: `upload-${uploadIndex}`,
          signature: `signed-${uploadIndex}`,
          timestamp: 123,
          upload_preset: 'carhub-signed',
        },
      },
    }), { status: 200 })
  }

  const images = await uploadImageFiles(files, 'cars')

  assert.deepEqual(calls, ['signature:0', 'cloudinary:0', 'signature:1', 'cloudinary:1'])
  assert.deepEqual(images, [
    'https://res.cloudinary.com/carhub-demo/image/upload/v123/carhub/cars/0.png',
    'https://res.cloudinary.com/carhub-demo/image/upload/v123/carhub/cars/1.png',
  ])
})

test('image upload sends the file directly to Cloudinary with server-signed fields', async () => {
  const requests = []
  const uploadUrl = 'https://api.cloudinary.com/v1_1/carhub-demo/image/upload'
  const imageUrl = 'https://res.cloudinary.com/carhub-demo/image/upload/v123/carhub/submissions/upload.png'
  const uploadFields = {
    api_key: 'public-key',
    asset_folder: 'carhub/submissions',
    allowed_formats: 'jpg,png,webp',
    overwrite: false,
    public_id: 'upload-id',
    signature: 'signed-upload',
    timestamp: 123,
    upload_preset: 'carhub-signed',
  }
  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    if (request.url === uploadUrl) {
      const body = await request.formData()
      requests.push({ url: request.url, options: request, body })
      return new Response(JSON.stringify({
        secure_url: imageUrl,
        public_id: 'upload-id',
        format: 'png',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    requests.push({ url: request.url, options: request, body: await request.json() })
    return new Response(JSON.stringify({
      success: true,
      data: { uploadUrl, uploadFields },
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
  assert.equal(requests[1].url, uploadUrl)
  assert.equal(requests[1].options.method, 'POST')
  assert.equal(requests[1].options.credentials, 'omit')
  assert.equal(requests[1].body.get('file').name, 'photo.png')
  assert.equal(requests[1].body.get('api_key'), 'public-key')
  assert.equal(requests[1].body.get('signature'), 'signed-upload')
  assert.equal(requests[1].body.get('overwrite'), 'false')
  assert.equal(requests[1].body.get('upload_preset'), 'carhub-signed')
})

test('image upload rejects a Cloudinary response URL from another host', async () => {
  const uploadUrl = 'https://api.cloudinary.com/v1_1/carhub-demo/image/upload'
  const uploadFields = {
    api_key: 'public-key',
    asset_folder: 'carhub/submissions',
    allowed_formats: 'jpg,png,webp',
    overwrite: false,
    public_id: 'upload-id',
    signature: 'signed-upload',
    timestamp: 123,
    upload_preset: 'carhub-signed',
  }
  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    if (request.url === uploadUrl) {
      return new Response(JSON.stringify({
        secure_url: 'https://attacker.example/car.png',
        public_id: 'upload-id',
        format: 'png',
      }), { status: 200 })
    }

    return new Response(JSON.stringify({
      success: true,
      data: { uploadUrl, uploadFields },
    }), { status: 200 })
  }
  const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'photo.png', {
    type: 'image/png',
  })

  await assert.rejects(
    uploadImageFile(file, 'submissions'),
    (error) => error instanceof ApiError && error.code === 'INVALID_RESPONSE',
  )
})

test('user auth and profile endpoints parse allowlisted user payloads', async () => {
  const requests = []
  const userPayload = {
    id: '15',
    name: 'Budi',
    email: 'budi@example.test',
    phone: '081234567890',
    location: 'Semarang',
    passwordHash: 'must-be-stripped',
  }

  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    requests.push({ url: request.url, method: request.method })
    if (request.url.endsWith('/auth/logout')) return new Response(null, { status: 204 })
    return new Response(JSON.stringify({
      success: true,
      data: { user: userPayload },
    }), { status: 200 })
  }

  const registered = await registerUser({ email: 'budi@example.test', password: 'password123' })
  const loggedIn = await loginUser({ email: 'budi@example.test', password: 'password123' })
  const session = await getUserSession()
  const updated = await updateMyProfile({
    name: 'Budi',
    phone: '081234567890',
    location: 'Semarang',
    newPassword: 'newpassword123',
  })
  await logoutUser()

  for (const res of [registered, loggedIn, session, updated]) {
    assert.deepEqual(res.user, {
      id: '15',
      name: 'Budi',
      email: 'budi@example.test',
      phone: '081234567890',
      location: 'Semarang',
    })
  }
  assert.deepEqual(requests.map((r) => `${r.method} ${r.url}`), [
    'POST http://localhost:5000/api/auth/register',
    'POST http://localhost:5000/api/auth/login',
    'GET http://localhost:5000/api/auth/session',
    'PATCH http://localhost:5000/api/me',
    'POST http://localhost:5000/api/auth/logout',
  ])
})

test('getMyListings requests user-owned listings with status and pagination', async () => {
  let requestUrl
  globalThis.fetch = async (url) => {
    requestUrl = url instanceof Request ? url.url : url
    return new Response(JSON.stringify({
      success: true,
      data: [{
        kind: 'submission',
        id: '7',
        carId: null,
        submissionId: '7',
        status: 'pending',
        brand: 'Honda',
        model: 'HR-V',
        year: 2022,
        transmission: 'CVT',
        fuelType: 'Bensin',
        color: 'Putih',
        bodyType: 'SUV',
        mileage: 12000,
        price: '310000000',
        imageUrl: 'https://images.example.test/hrv.jpg',
        images: ['https://images.example.test/hrv.jpg'],
        sellerName: 'Budi',
        sellerPhone: '081234567890',
        location: 'Semarang',
        description: null,
        reviewNote: null,
        reviewedAt: null,
        createdAt: '2026-11-26T00:00:00.000Z',
      }],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    }), { status: 200 })
  }

  const result = await getMyListings({ status: 'pending', page: 1, pageSize: 10 })

  assert.equal(requestUrl, 'http://localhost:5000/api/me/listings?status=pending&page=1&pageSize=10')
  assert.equal(result.data[0].kind, 'submission')
  assert.equal(result.data[0].bodyType, 'SUV')
  assert.equal(result.data[0].color, 'Putih')
})

test('admin customer CRUD endpoints manage allowlisted user accounts', async () => {
  const requests = []
  const customer = {
    id: '21',
    name: 'Siti',
    email: 'siti@example.test',
    phone: '081234567890',
    location: 'Bandung',
    isActive: true,
    createdAt: '2026-11-26T00:00:00.000Z',
    passwordHash: 'must-be-stripped',
  }

  globalThis.fetch = async (input, options) => {
    const request = input instanceof Request ? input : new Request(input, options)
    requests.push(`${request.method} ${request.url}`)
    if (request.method === 'DELETE') return new Response(null, { status: 204 })
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: [customer],
        pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      }), { status: 200 })
    }
    return new Response(JSON.stringify({ success: true, data: customer }), { status: 200 })
  }

  const list = await getAdminCustomers({ search: 'siti', status: 'active', page: 1, pageSize: 10 })
  const created = await createAdminCustomer({ name: 'Siti', email: 'siti@example.test', phone: '081234567890', password: 'password123' })
  const updated = await updateAdminCustomer('21', { name: 'Siti', email: 'siti@example.test', phone: '081234567890', isActive: false })
  await deleteAdminCustomer('21')

  assert.equal(list.data[0].passwordHash, undefined)
  assert.equal(created.isActive, true)
  assert.equal(updated.id, '21')
  assert.deepEqual(requests, [
    'GET http://localhost:5000/api/admin/customers?search=siti&status=active&page=1&pageSize=10',
    'POST http://localhost:5000/api/admin/customers',
    'PUT http://localhost:5000/api/admin/customers/21',
    'DELETE http://localhost:5000/api/admin/customers/21',
  ])
})
