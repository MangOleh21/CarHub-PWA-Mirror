import axios from 'axios'

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api')
  .replace(/\/+$/, '')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  adapter: 'fetch',
})

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request(path, { method = 'GET', body } = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method,
      ...(body === undefined ? {} : { data: body }),
    })
    return response.status === 204 ? null : response.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (!axios.isAxiosError(error)) throw error
    if (!error.response) {
      throw new ApiError(0, 'NETWORK_ERROR', 'Tidak dapat terhubung ke server CarHub.')
    }

    const apiError = error.response.data?.error
    throw new ApiError(
      error.response.status,
      typeof apiError?.code === 'string' ? apiError.code : 'HTTP_ERROR',
      typeof apiError?.message === 'string' ? apiError.message : 'Permintaan tidak dapat diproses.',
      apiError?.details,
    )
  }
}

function readData(payload) {
  if (payload?.success !== true || !Object.hasOwn(payload, 'data')) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Format respons server tidak sesuai kontrak API.')
  }
  return payload.data
}

function parseCar(value) {
  let validImageUrl = false
  if (typeof value?.imageUrl === 'string') {
    try {
      validImageUrl = new URL(value.imageUrl).protocol === 'https:'
    } catch {
      validImageUrl = false
    }
  }
  const isValid = value
    && typeof value.id === 'string'
    && typeof value.brand === 'string'
    && typeof value.model === 'string'
    && Number.isInteger(value.year)
    && typeof value.transmission === 'string'
    && Number.isInteger(value.mileage)
    && typeof value.price === 'string'
    && /^\d+$/.test(value.price)
    && validImageUrl
    && typeof value.sellerName === 'string'
    && typeof value.sellerPhone === 'string'
    && (typeof value.location === 'string' || value.location === null)
    && (typeof value.description === 'string' || value.description === null)

  if (!isValid) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data mobil dari server tidak sesuai kontrak API.')
  }
  return value
}

function parseSubmission(value) {
  const isValid = value
    && typeof value.id === 'string'
    && typeof value.brand === 'string'
    && typeof value.model === 'string'
    && Number.isInteger(value.year)
    && typeof value.sellerName === 'string'
    && typeof value.sellerPhone === 'string'
    && Number.isInteger(value.mileage)
    && typeof value.expectedPrice === 'string'
    && /^\d+$/.test(value.expectedPrice)
    && ['pending', 'approved', 'rejected'].includes(value.status)
    && (typeof value.location === 'string' || value.location === null)
    && (typeof value.imageUrl === 'string' || value.imageUrl === null)

  if (!isValid) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data pengajuan dari server tidak sesuai kontrak API.')
  }
  return value
}

function parseAdmin(value) {
  if (!value || typeof value.id !== 'string' || typeof value.email !== 'string'
    || !['owner', 'admin'].includes(value.role)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data sesi admin dari server tidak sesuai kontrak API.')
  }
  return value
}

function parseManagedAdmin(value) {
  const admin = parseAdmin(value)
  if (typeof admin.isActive !== 'boolean') {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data akun admin dari server tidak sesuai kontrak API.')
  }
  return admin
}

function parseReviewedSubmission(value) {
  if (!value
    || typeof value.id !== 'string'
    || !['approved', 'rejected'].includes(value.status)
    || typeof value.reviewedByEmail !== 'string'
    || (typeof value.reviewNote !== 'string' && value.reviewNote !== null)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Hasil review dari server tidak sesuai kontrak API.')
  }
  return value
}

function parseSubmissionReceipt(value) {
  if (!value
    || typeof value.id !== 'string'
    || value.status !== 'pending'
    || typeof value.createdAt !== 'string') {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Konfirmasi pengajuan dari server tidak sesuai kontrak API.')
  }
  return value
}

function parsePagination(payload) {
  const pagination = payload?.pagination
  if (!pagination
    || !Number.isInteger(pagination.page)
    || !Number.isInteger(pagination.pageSize)
    || !Number.isInteger(pagination.totalItems)
    || !Number.isInteger(pagination.totalPages)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Informasi halaman dari server tidak valid.')
  }
  return pagination
}

function listQuery({ search, brand, status, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  if (brand?.trim()) params.set('brand', brand.trim())
  if (status) params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return `?${params.toString()}`
}

async function list(path, options, parseItem) {
  const payload = await request(`${path}${listQuery(options)}`)
  const data = readData(payload)
  if (!Array.isArray(data)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Daftar dari server tidak valid.')
  }
  return { data: data.map(parseItem), pagination: parsePagination(payload) }
}

export function getCars(options) {
  return list('/cars', options, parseCar)
}

export async function getCar(id) {
  const payload = await request(`/cars/${encodeURIComponent(id)}`)
  return parseCar(readData(payload))
}

export async function createSubmission(input) {
  return parseSubmissionReceipt(
    readData(await request('/submissions', { method: 'POST', body: input })),
  )
}

export async function loginAdmin(input) {
  const data = readData(await request('/admin/auth/login', { method: 'POST', body: input }))
  return { admin: parseAdmin(data?.admin) }
}

export async function getAdminSession() {
  const data = readData(await request('/admin/auth/session'))
  return { admin: parseAdmin(data?.admin) }
}

export function logoutAdmin() {
  return request('/admin/auth/logout', { method: 'POST', body: {} })
}

export function getAdminCars(options) {
  return list('/admin/cars', options, parseCar)
}

export async function getAdminCar(id) {
  const payload = await request(`/admin/cars/${encodeURIComponent(id)}`)
  return parseCar(readData(payload))
}

export async function createCar(input) {
  return parseCar(readData(await request('/admin/cars', { method: 'POST', body: input })))
}

export async function updateCar(id, input) {
  return parseCar(readData(await request(`/admin/cars/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: input,
  })))
}

export function deleteCar(id) {
  return request(`/admin/cars/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getAdminSubmissions(options = {}) {
  return list('/admin/submissions', { ...options, status: options.status ?? 'pending' }, parseSubmission)
}

export async function reviewSubmission(id, decision, input = {}) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new TypeError('Decision must be approved or rejected.')
  }
  const payload = await request(`/admin/submissions/${encodeURIComponent(id)}/${decision}`, {
    method: 'PATCH',
    body: input,
  })
  const data = readData(payload)
  return {
    submission: parseReviewedSubmission(data?.submission),
    car: data?.car ?? null,
  }
}

export async function createAdminUser(input) {
  const data = readData(await request('/admin/users', { method: 'POST', body: input }))
  return parseManagedAdmin(data?.admin)
}

export async function deactivateAdminUser(id) {
  const data = readData(await request(`/admin/users/${encodeURIComponent(id)}/deactivate`, {
    method: 'PATCH',
    body: {},
  }))
  return parseManagedAdmin(data?.admin)
}
