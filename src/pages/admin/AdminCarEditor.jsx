import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AppLink from '../../components/AppLink.jsx'
import { ErrorState, LoadingState } from '../../components/Feedback.jsx'
import MultiImageUploader from '../../components/MultiImageUploader.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'
import { useMultiImageSelection } from '../../hooks/useMultiImageSelection.js'
import { createCar, getAdminCar, getAdminSession, updateCar, uploadImageFile } from '../../services/api.js'

const EMPTY_CAR = {
  brand: '',
  model: '',
  year: '',
  transmission: 'Manual',
  fuelType: 'Bensin',
  mileage: '',
  price: '',
  imageUrl: '',
  sellerName: '',
  sellerPhone: '',
  location: '',
  description: '',
}

function carToForm(car) {
  return {
    ...car,
    year: String(car.year),
    mileage: String(car.mileage),
    price: car.price,
    description: car.description || '',
  }
}

function validateCar(form, hasPhotos, hasImageError) {
  const errors = {}
  for (const field of ['brand', 'model', 'year', 'mileage', 'price', 'sellerName', 'sellerPhone', 'location']) {
    if (!String(form[field]).trim()) errors[field] = 'Bagian ini wajib diisi.'
  }
  if (!form.imageUrl.trim() && !hasPhotos && !hasImageError) {
    errors.imageUrl = 'Pilih minimal satu foto atau masukkan URL HTTPS.'
  }
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
  if (form.imageUrl && !hasPhotos) {
    try {
      if (new URL(form.imageUrl).protocol !== 'https:') errors.imageUrl = 'Tautan foto harus menggunakan HTTPS.'
    } catch {
      errors.imageUrl = 'Masukkan URL foto yang valid.'
    }
  }
  if (form.description && form.description.length > 3000) {
    errors.description = 'Deskripsi maksimal 3.000 karakter.'
  }
  return errors
}

function Field({ name, label, value, onChange, error, ...props }) {
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
  const [existingUrls, setExistingUrls] = useState([])
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    selections: imageSelections,
    error: imageError,
    inputRef: imageInputRef,
    addFiles,
    removeFile,
    clearFiles,
  } = useMultiImageSelection()
  const errorSummary = useRef(null)
  const errorCount = Object.keys(errors).length + (imageError ? 1 : 0)
  const form = draft ?? (loaded.car ? carToForm(loaded.car) : EMPTY_CAR)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        await getAdminSession()
        const car = carId ? await getAdminCar(carId) : null
        if (active) {
          setLoaded({ status: 'ready', car, error: null })
          if (car) {
            const urls = Array.isArray(car.images) && car.images.length > 0
              ? car.images
              : (car.imageUrl ? [car.imageUrl] : [])
            setExistingUrls(urls)
          }
        }
      } catch (error) {
        if (!active) return
        if (error.status === 401) navigate('/admin/login')
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

  function handleRemoveExistingUrl(index) {
    setExistingUrls((current) => current.filter((_, i) => i !== index))
  }

  async function submit(event) {
    event.preventDefault()
    setSaveError(null)
    const hasPhotos = imageSelections.length > 0 || existingUrls.length > 0
    const validationErrors = validateCar(form, hasPhotos, Boolean(imageError))
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length || imageError) return

    setSubmitting(true)
    try {
      const uploadedUrls = []
      for (const item of imageSelections) {
        const url = await uploadImageFile(item.file, 'cars')
        uploadedUrls.push(url)
      }

      const allImages = [
        ...existingUrls,
        ...uploadedUrls,
        ...(form.imageUrl.trim() && !existingUrls.includes(form.imageUrl.trim()) && !uploadedUrls.includes(form.imageUrl.trim())
          ? [form.imageUrl.trim()]
          : []),
      ]
      const primaryUrl = allImages[0] || form.imageUrl.trim()

      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        transmission: form.transmission,
        fuelType: form.fuelType.trim() || 'Bensin',
        mileage: Number(form.mileage),
        price: Number(form.price),
        imageUrl: primaryUrl,
        images: allImages,
        sellerName: form.sellerName.trim(),
        sellerPhone: form.sellerPhone.trim(),
        location: form.location.trim(),
        description: form.description.trim() || null,
      }
      if (carId) await updateCar(carId, payload)
      else await createCar(payload)
      clearFiles()
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
        <AppLink className="back-link" to="/admin" navigate={navigate}>
          <ArrowLeft size={17} aria-hidden="true" /> Kembali ke dashboard
        </AppLink>
        <ThemeToggle />
      </header>
      <main className="admin-editor-main">
        <div className="admin-editor-title">
          <p className="eyebrow">{carId ? 'EDIT KATALOG' : 'UNIT BARU'}</p>
          <h1>{carId ? `Edit ${form.brand} ${form.model}` : 'Tambah mobil ke katalog'}</h1>
        </div>

        {saveError && <p className="notice notice-error" role="alert">{saveError}</p>}
        {Boolean(errorCount) && (
          <div className="notice notice-error" ref={errorSummary} tabIndex={-1} role="alert" aria-atomic="true">
            <strong>Periksa kembali data mobil</strong>
            <p>Terdapat {errorCount} bagian yang memerlukan perbaikan.</p>
          </div>
        )}

        <form className="admin-car-form" onSubmit={submit} noValidate>
          <fieldset className="form-section">
            <legend>Informasi kendaraan</legend>
            <div className="form-grid">
              <Field name="brand" label="Merk" maxLength={100} required value={form.brand} onChange={updateField} error={errors.brand} />
              <Field name="model" label="Model" maxLength={100} required value={form.model} onChange={updateField} error={errors.model} />
              <Field name="year" label="Tahun" type="number" min={1886} max={2100} required value={form.year} onChange={updateField} error={errors.year} />
              <label className="form-field" htmlFor="car-transmission">
                <span>Transmisi</span>
                <select id="car-transmission" name="transmission" value={form.transmission} onChange={updateField}>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </label>
              <Field name="fuelType" label="Bahan bakar" maxLength={50} required value={form.fuelType} onChange={updateField} error={errors.fuelType} />
              <Field name="mileage" label="Jarak tempuh (km)" type="number" min={0} required value={form.mileage} onChange={updateField} error={errors.mileage} />
              <Field name="price" label="Harga (Rp)" type="number" min={1} required value={form.price} onChange={updateField} error={errors.price} />
              <Field name="location" label="Lokasi" maxLength={150} required value={form.location} onChange={updateField} error={errors.location} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Foto kendaraan</legend>
            <div className="form-stack">
              <MultiImageUploader
                id="car-image-files"
                selections={imageSelections}
                existingUrls={existingUrls}
                onRemoveExistingUrl={handleRemoveExistingUrl}
                error={imageError}
                disabled={submitting}
                uploading={submitting && imageSelections.length > 0}
                inputRef={imageInputRef}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
              />
              <Field
                name="imageUrl"
                label="URL foto HTTPS alternatif (opsional)"
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={updateField}
                error={errors.imageUrl}
              />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Kontak penjual & deskripsi</legend>
            <div className="form-grid">
              <Field name="sellerName" label="Nama penjual" maxLength={150} required value={form.sellerName} onChange={updateField} error={errors.sellerName} />
              <Field name="sellerPhone" label="Nomor WhatsApp" type="tel" required value={form.sellerPhone} onChange={updateField} error={errors.sellerPhone} />
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
            <Save size={17} aria-hidden="true" /> {submitting ? 'Menyimpan…' : carId ? 'Perbarui data mobil' : 'Tayangkan ke katalog'}
          </button>
        </form>
      </main>
    </div>
  )
}
