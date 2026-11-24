import axios from 'axios'
import { getImageFileError, getImageFilesError } from '../lib/image-upload.js'

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
  const images = Array.isArray(value?.images)
    && value.images.length > 0
    ? value.images
    : typeof value?.imageUrl === 'string' ? [value.imageUrl] : []
  const imageUrl = typeof value?.imageUrl === 'string' ? value.imageUrl : images[0]
  const validImages = images.length > 0 && images.every(isHttpsUrl)
  const isValid = value
    && typeof value.id === 'string'
    && typeof value.brand === 'string'
    && typeof value.model === 'string'
    && Number.isInteger(value.year)
    && typeof value.transmission === 'string'
    && Number.isInteger(value.mileage)
    && typeof value.price === 'string'
    && /^\d+$/.test(value.price)
    && (!Object.hasOwn(value, 'images') || Array.isArray(value.images))
    && validImages
    && isHttpsUrl(imageUrl)
    && typeof value.sellerName === 'string'
    && typeof value.sellerPhone === 'string'
    && (typeof value.location === 'string' || value.location === null)
    && (typeof value.description === 'string' || value.description === null)

  if (!isValid) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data mobil dari server tidak sesuai kontrak API.')
  }
  return { ...value, imageUrl, images }
}

function parseSubmission(value) {
  const images = Array.isArray(value?.images)
    && value.images.length > 0
    ? value.images
    : typeof value?.imageUrl === 'string' ? [value.imageUrl] : []
  const validImageUrl = value?.imageUrl === undefined
    || value.imageUrl === null
    || isHttpsUrl(value.imageUrl)
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
    && validImageUrl
    && (!Object.hasOwn(value, 'images') || Array.isArray(value.images))
    && images.every(isHttpsUrl)
    && (value.reviewedAt === undefined || value.reviewedAt === null || isValidDate(value.reviewedAt))

  if (!isValid) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data pengajuan dari server tidak sesuai kontrak API.')
  }
  return { ...value, imageUrl: value.imageUrl ?? images[0] ?? null, images }
}

function isHttpsUrl(value) {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isValidDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function parseAdmin(value) {
  if (!value || typeof value.id !== 'string' || typeof value.email !== 'string'
    || !['owner', 'admin'].includes(value.role)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data sesi admin dari server tidak sesuai kontrak API.')
  }
  return { id: value.id, email: value.email, role: value.role }
}

function parseManagedAdmin(value) {
  const admin = parseAdmin(value)
  if (typeof value.isActive !== 'boolean') {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data akun admin dari server tidak sesuai kontrak API.')
  }
  return { ...admin, isActive: value.isActive }
}

function parseAdminAccount(value) {
  const admin = parseManagedAdmin(value)
  if (!isValidDate(value.createdAt)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data akun admin dari server tidak sesuai kontrak API.')
  }
  return { ...admin, createdAt: value.createdAt }
}

function parseReviewedSubmission(value) {
  if (!value
    || typeof value.id !== 'string'
    || !['approved', 'rejected'].includes(value.status)
    || typeof value.reviewedByEmail !== 'string'
    || (typeof value.reviewNote !== 'string' && value.reviewNote !== null)
    || !isValidDate(value.reviewedAt)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Hasil review dari server tidak sesuai kontrak API.')
  }
  return {
    id: value.id,
    status: value.status,
    reviewedByEmail: value.reviewedByEmail,
    reviewNote: value.reviewNote,
    reviewedAt: value.reviewedAt,
  }
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

function listQuery({
  search,
  brand,
  status,
  transmission,
  minPrice,
  maxPrice,
  minYear,
  maxYear,
  sortBy,
  sortOrder,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  if (brand?.trim()) params.set('brand', brand.trim())
  if (status) params.set('status', status)
  for (const [key, value] of Object.entries({
    transmission,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    sortBy,
    sortOrder,
  })) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
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

export async function uploadImageFile(file, kind) {
  const fileError = getImageFileError(file)
  if (fileError) throw new ApiError(422, 'INVALID_IMAGE', fileError)
  if (!['cars', 'submissions'].includes(kind)) {
    throw new TypeError('Image upload kind must be cars or submissions.')
  }

  const path = kind === 'cars' ? '/admin/uploads/cars' : '/uploads/submissions'
  const payload = readData(await request(path, {
    method: 'POST',
    body: { contentType: file.type, size: file.size },
  }))
  let uploadUrl
  try {
    uploadUrl = new URL(payload.uploadUrl)
  } catch {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data upload foto dari server tidak valid.')
  }
  const cloudNameMatch = /^\/v1_1\/([A-Za-z0-9_-]+)\/image\/upload$/.exec(uploadUrl.pathname)
  const fields = payload.uploadFields
  const expectedFolder = `carhub/${kind}`
  if (uploadUrl.protocol !== 'https:'
    || uploadUrl.origin !== 'https://api.cloudinary.com'
    || uploadUrl.search
    || uploadUrl.hash
    || !cloudNameMatch
    || !fields
    || typeof fields.api_key !== 'string'
    || !fields.api_key
    || !Number.isInteger(fields.timestamp)
    || typeof fields.signature !== 'string'
    || !fields.signature
    || typeof fields.public_id !== 'string'
    || !fields.public_id
    || fields.asset_folder !== expectedFolder
    || typeof fields.upload_preset !== 'string'
    || !fields.upload_preset
    || fields.overwrite !== false
    || fields.allowed_formats !== 'jpg,png,webp') {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Data upload foto dari server tidak valid.')
  }

  const uploadForm = new FormData()
  uploadForm.append('file', file)
  for (const field of [
    'api_key',
    'asset_folder',
    'allowed_formats',
    'overwrite',
    'public_id',
    'signature',
    'timestamp',
    'upload_preset',
  ]) {
    uploadForm.append(field, String(fields[field]))
  }

  let response
  try {
    response = await fetch(uploadUrl.href, {
      method: 'POST',
      body: uploadForm,
      credentials: 'omit',
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(0, 'NETWORK_ERROR', 'Koneksi ke penyimpanan foto gagal. Periksa koneksi lalu coba lagi.')
    }
    throw error
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'IMAGE_UPLOAD_FAILED', 'Foto gagal diunggah. Silakan coba lagi.')
  }

  let uploadedAsset
  try {
    uploadedAsset = await response.json()
  } catch {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Respons penyimpanan foto tidak valid.')
  }

  let imageUrl
  try {
    imageUrl = new URL(uploadedAsset.secure_url)
  } catch {
    throw new ApiError(502, 'INVALID_RESPONSE', 'URL foto dari penyimpanan tidak valid.')
  }
  if (uploadedAsset.public_id !== fields.public_id
    || !['jpg', 'png', 'webp'].includes(uploadedAsset.format)
    || imageUrl.protocol !== 'https:'
    || imageUrl.hostname !== 'res.cloudinary.com'
    || !imageUrl.pathname.startsWith(`/${cloudNameMatch[1]}/image/upload/`)
    || imageUrl.search
    || imageUrl.hash) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'URL foto dari penyimpanan tidak valid.')
  }
  return imageUrl.toString()
}

export async function uploadImageFiles(files, kind) {
  const selectedFiles = Array.from(files ?? [])
  const fileError = getImageFilesError(selectedFiles)
  if (fileError) throw new ApiError(422, 'INVALID_IMAGE', fileError)
  const imageUrls = []
  for (const file of selectedFiles) {
    imageUrls.push(await uploadImageFile(file, kind))
  }
  return imageUrls
}

export async function getAdminDashboardSummary() {
  const [cars, submissions] = await Promise.all([
    getAdminCars({ page: 1, pageSize: 1 }),
    getAdminSubmissions({ page: 1, pageSize: 1, status: 'pending' }),
  ])
  return {
    carListings: cars.pagination.totalItems,
    pendingSubmissions: submissions.pagination.totalItems,
  }
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

export async function getAdminUsers() {
  const data = readData(await request('/admin/users'))
  if (!Array.isArray(data)) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Daftar akun admin dari server tidak valid.')
  }
  return data.map(parseAdminAccount)
}

export async function deactivateAdminUser(id) {
  const data = readData(await request(`/admin/users/${encodeURIComponent(id)}/deactivate`, {
    method: 'PATCH',
    body: {},
  }))
  return parseManagedAdmin(data?.admin)
}
