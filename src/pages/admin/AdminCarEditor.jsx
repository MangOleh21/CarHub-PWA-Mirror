import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AppLink from '../../components/AppLink.jsx'
import { ErrorState, LoadingState } from '../../components/Feedback.jsx'
import ImageUploader from '../../components/ImageUploader.jsx'
import { useImageFileSelection } from '../../hooks/useImageFileSelection.js'
import {
  BODY_TYPE_OPTIONS,
  COLOR_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from '../../lib/car-options.js'
import { maxImageCount } from '../../lib/image-upload.js'
import { createCar, getAdminCar, getAdminSession, updateCar, uploadImageFiles } from '../../services/api.js'

const EMPTY_CAR = {
  brand: '',
  model: '',
  year: '',
  transmission: 'Manual',
  fuelType: 'Bensin',
  color: '',
  bodyType: '',
  mileage: '',
  price: '',
  images: [],
  imageUrl: '',
  sellerName: '',
  sellerPhone: '',
  location: '',
  description: '',
}

function carToForm(car) {
  return {
    ...car,
    fuelType: car.fuelType || 'Bensin',
    color: car.color || '',
    bodyType: car.bodyType || '',
    imageUrl: '',
    year: String(car.year),
    mileage: String(car.mileage),
    price: car.price,
    description: car.description || '',
  }
}

function validateCar(form, selectedImageCount, hasImageError) {
  const errors = {}
  for (const field of ['brand', 'model', 'year', 'color', 'bodyType', 'mileage', 'price', 'sellerName', 'sellerPhone', 'location']) {
    if (!String(form[field]).trim()) errors[field] = 'Bagian ini wajib diisi.'
  }
  const imageCount = form.images.length + selectedImageCount + (form.imageUrl.trim() ? 1 : 0)
  if (imageCount === 0 && !hasImageError) {
    errors.imageUrl = 'Pilih foto atau masukkan URL HTTPS.'
  }
  if (imageCount > maxImageCount) errors.imageUrl = `Jumlah foto maksimal ${maxImageCount} foto.`
  if (form.year && (!Number.isInteger(Number(form.year)) || Number(form.year) < 1886 || Number(form.year) > 2100)) {
    errors.year = 'Tahun harus berada pada rentang 1886–2100.'
  }
  if (form.mileage && (!Number.isSafeInteger(Number(form.mileage)) || Number(form.mileage) < 0
    || Number(form.mileage) > 2147483647)) {
    errors.mileage = 'Jarak tempuh harus berupa angka bulat yang valid.'
  }
  if (form.price && (!Number.isSafeInteger(Number(form.price)) || Number(form.price) <= 0)) {
    errors.price = 'Harga harus berupa angka positif.'
  }
  if (form.sellerPhone && !/^\+?\d[\d\s()-]{7,19}$/.test(form.sellerPhone.trim())) {
    errors.sellerPhone = 'Gunakan nomor telepon yang valid.'
  }
  if (form.imageUrl) {
    try {
      if (new URL(form.imageUrl).protocol !== 'https:') errors.imageUrl = 'Tautan foto harus menggunakan HTTPS.'
    } catch {
      errors.imageUrl = 'Masukkan URL foto yang valid.'
    }
  }
  if (form.description.length > 3000) errors.description = 'Deskripsi maksimal 3.000 karakter.'
  return errors
}

function EditorField({ name, label, value, onChange, error, ...props }) {
  const id = `car-${name}`
  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </label>
  )
}

export default function AdminCarEditor({ carId, navigate }) {
  const [loaded, setLoaded] = useState({ status: 'loading', car: null, error: null })
  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    selections: imageSelections,
    error: imageError,
    inputRef: imageInputRef,
    selectFiles,
    removeSelection,
    clearSelections,
    clearError: clearImageError,
  } = useImageFileSelection()
  const errorSummary = useRef(null)
  const errorCount = Object.keys(errors).length + (imageError ? 1 : 0)
  const form = draft ?? (loaded.car ? carToForm(loaded.car) : EMPTY_CAR)
  const selectedFuelType = form.fuelType || 'Bensin'

  useEffect(() => {
    let active = true
    async function load() {
      try {
        await getAdminSession()
        const car = carId ? await getAdminCar(carId) : null
        if (active) setLoaded({ status: 'ready', car, error: null })
      } catch (error) {
        if (!active) return
        if (error.status === 401) navigate('/admin/login')
        else if (error.status === 403) navigate('/profile')
        else setLoaded({ status: 'error', car: null, error: error.message })
      }
    }
    load()
    return () => { active = false }
  }, [carId, navigate])

  useEffect(() => {
    if (errorCount) errorSummary.current?.focus()
  }, [errorCount])

  function updateField(event) {
    const { name, value } = event.target
    setDraft((current) => ({ ...(current ?? form), [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaveError(null)
    const validationErrors = validateCar(form, imageSelections.length, Boolean(imageError))
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length || imageError) return

    setSubmitting(true)
    try {
      const uploadedImages = await uploadImageFiles(
        imageSelections.map(({ file }) => file),
        'cars',
      )
      const images = [
        ...form.images,
        ...uploadedImages,
        ...(form.imageUrl.trim() ? [form.imageUrl.trim()] : []),
      ]
      setDraft((current) => ({ ...(current ?? form), images, imageUrl: '' }))
      clearSelections()
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        transmission: form.transmission,
        fuelType: form.fuelType.trim() || 'Bensin',
        color: form.color,
        bodyType: form.bodyType,
        mileage: Number(form.mileage),
        price: Number(form.price),
        imageUrl: images[0],
        images,
        sellerName: form.sellerName.trim(),
        sellerPhone: form.sellerPhone.trim(),
        location: form.location.trim(),
        description: form.description.trim() || null,
      }
      if (carId) await updateCar(carId, payload)
      else await createCar(payload)
      navigate('/admin')
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loaded.status === 'loading') {
    return <main className="admin-shell"><LoadingState label="Memeriksa akses dan memuat data mobil" /></main>
  }
  if (loaded.status === 'error') {
    return <main className="admin-shell"><ErrorState message={loaded.error} onRetry={() => window.location.reload()} /></main>
  }

  return (
    <div className="admin-shell">
      <header className="admin-editor-header">
        <AppLink className="back-link" to="/admin" navigate={navigate}><ArrowLeft size={17} /> Kembali ke dashboard</AppLink>
      </header>
      <main className="admin-editor-main">
        <div className="admin-title-row">
          <div>
            <p className="eyebrow">KATALOG AKTIF</p>
            <h1>{carId ? 'Edit listing' : 'Tambah mobil'}</h1>
          </div>
        </div>
        {saveError && <p className="notice notice-error" role="alert">{saveError}</p>}
        <form className="seller-form admin-car-form" onSubmit={submit} noValidate>
          {errorCount > 0 && (
            <div className="notice notice-error form-error-summary" role="alert" tabIndex="-1" ref={errorSummary}>
              Periksa kembali {errorCount} bagian yang ditandai sebelum menyimpan.
            </div>
          )}
          <fieldset>
            <legend>Informasi kendaraan</legend>
            <div className="form-grid">
              <EditorField name="brand" label="Merk" value={form.brand} onChange={updateField} error={errors.brand} maxLength={100} />
              <EditorField name="model" label="Model" value={form.model} onChange={updateField} error={errors.model} maxLength={100} />
              <EditorField name="year" label="Tahun" type="number" min="1886" max="2100" value={form.year} onChange={updateField} error={errors.year} />
              <label className="form-field" htmlFor="car-transmission">
                <span>Transmisi</span>
                <select id="car-transmission" name="transmission" value={form.transmission} onChange={updateField}>
                  {TRANSMISSION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="form-field" htmlFor="car-fuel-type">
                <span>Bahan bakar</span>
                <select id="car-fuel-type" name="fuelType" value={selectedFuelType} onChange={updateField}>
                  {FUEL_TYPE_OPTIONS.map((fuelType) => <option key={fuelType} value={fuelType}>{fuelType}</option>)}
                  {!FUEL_TYPE_OPTIONS.includes(selectedFuelType) && <option value={selectedFuelType}>{selectedFuelType}</option>}
                </select>
              </label>
              <label className="form-field" htmlFor="car-body-type">
                <span>Tipe mobil</span>
                <select
                  id="car-body-type"
                  name="bodyType"
                  value={form.bodyType}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.bodyType)}
                  aria-describedby={errors.bodyType ? 'car-bodyType-error' : undefined}
                >
                  <option value="">Pilih tipe mobil</option>
                  {BODY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {errors.bodyType && <small className="field-error" id="car-bodyType-error">{errors.bodyType}</small>}
              </label>
              <label className="form-field" htmlFor="car-color">
                <span>Warna mobil</span>
                <select
                  id="car-color"
                  name="color"
                  value={form.color}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.color)}
                  aria-describedby={errors.color ? 'car-color-error' : undefined}
                >
                  <option value="">Pilih warna</option>
                  {COLOR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {errors.color && <small className="field-error" id="car-color-error">{errors.color}</small>}
              </label>
              <EditorField name="mileage" label="Jarak tempuh (km)" type="number" min="0" max="2147483647" value={form.mileage} onChange={updateField} error={errors.mileage} />
              <EditorField name="price" label="Harga (Rp)" type="number" min="1" step="1" value={form.price} onChange={updateField} error={errors.price} />
            </div>
            <ImageUploader
              id="car-image-file"
              images={form.images}
              selections={imageSelections}
              imageUrl={form.imageUrl}
              alt={`Pratinjau foto ${form.brand} ${form.model}`}
              error={imageError}
              disabled={submitting}
              uploading={submitting && imageSelections.length > 0}
              inputRef={imageInputRef}
              onSelectFiles={selectFiles}
              onRemoveImage={(index) => {
                setDraft((current) => ({
                  ...(current ?? form),
                  images: (current ?? form).images.filter((_, position) => position !== index),
                }))
                clearImageError()
              }}
              onRemoveSelection={removeSelection}
              onClearImageUrl={() => {
                setDraft((current) => ({ ...(current ?? form), imageUrl: '' }))
                clearImageError()
              }}
            />
            <EditorField
              name="imageUrl"
              label="URL foto HTTPS (alternatif)"
              type="url"
              value={form.imageUrl}
              onChange={updateField}
              error={errors.imageUrl}
            />
          </fieldset>
          <fieldset>
            <legend>Informasi penjual</legend>
            <div className="form-grid">
              <EditorField name="sellerName" label="Nama penjual" value={form.sellerName} onChange={updateField} error={errors.sellerName} maxLength={150} />
              <EditorField name="sellerPhone" label="Nomor WhatsApp" type="tel" value={form.sellerPhone} onChange={updateField} error={errors.sellerPhone} />
              <EditorField name="location" label="Lokasi" value={form.location} onChange={updateField} error={errors.location} maxLength={150} />
            </div>
            <label className="form-field" htmlFor="car-description">
              <span>Deskripsi <small>Opsional</small></span>
              <textarea
                id="car-description"
                name="description"
                rows="4"
                maxLength={3000}
                value={form.description}
                onChange={updateField}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'car-description-error' : undefined}
              />
              {errors.description && <small className="field-error" id="car-description-error">{errors.description}</small>}
            </label>
          </fieldset>
          <button className="button button-primary submit-button" type="submit" disabled={submitting}>
            <Save size={17} aria-hidden="true" /> {submitting ? 'Menyimpan…' : 'Simpan listing'}
          </button>
        </form>
      </main>
    </div>
  )
}
