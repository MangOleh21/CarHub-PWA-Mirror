import { ArrowRight, Check, CircleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import MultiImageUploader from '../components/MultiImageUploader.jsx'
import { useMultiImageSelection } from '../hooks/useMultiImageSelection.js'
import { createSubmission, uploadImageFile } from '../services/api.js'

const EMPTY_FORM = {
  sellerName: '',
  sellerPhone: '',
  brand: '',
  model: '',
  year: '',
  transmission: 'Manual',
  mileage: '',
  expectedPrice: '',
  location: '',
  imageUrl: '',
  description: '',
}

function validate(form, hasSelectedImages, hasImageError) {
  const errors = {}
  const required = ['sellerName', 'sellerPhone', 'brand', 'model', 'year', 'mileage', 'expectedPrice', 'location']
  required.forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = 'Bagian ini wajib diisi.'
  })
  if (!form.imageUrl.trim() && !hasSelectedImages && !hasImageError) {
    errors.imageUrl = 'Pilih minimal satu foto atau masukkan URL HTTPS.'
  }

  if (form.sellerPhone && !/^\+?\d[\d\s()-]{7,19}$/.test(form.sellerPhone.trim())) {
    errors.sellerPhone = 'Gunakan nomor telepon yang valid.'
  }
  if (form.year && (!Number.isInteger(Number(form.year))
    || Number(form.year) < 1886 || Number(form.year) > new Date().getFullYear() + 1)) {
    errors.year = 'Masukkan tahun kendaraan yang valid.'
  }
  if (form.mileage && (!Number.isSafeInteger(Number(form.mileage)) || Number(form.mileage) < 0
    || Number(form.mileage) > 2147483647)) {
    errors.mileage = 'Jarak tempuh harus berupa angka bulat yang valid.'
  }
  if (form.expectedPrice && (!Number.isSafeInteger(Number(form.expectedPrice))
    || Number(form.expectedPrice) <= 0)) {
    errors.expectedPrice = 'Harga harus berupa angka positif.'
  }
  if (form.imageUrl && !hasSelectedImages) {
    try {
      if (new URL(form.imageUrl).protocol !== 'https:') errors.imageUrl = 'Tautan foto harus menggunakan HTTPS.'
    } catch {
      errors.imageUrl = 'Masukkan URL foto yang valid.'
    }
  }
  if (form.description.length > 3000) errors.description = 'Deskripsi maksimal 3.000 karakter.'
  return errors
}

function Field({ name, label, value, onChange, error, ...props }) {
  const id = `submission-${name}`
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

export default function SellPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [contactConsent, setContactConsent] = useState(false)
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

  useEffect(() => {
    if (errorCount) errorSummary.current?.focus()
  }, [errorCount])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)
    const hasPhotos = imageSelections.length > 0
    const validationErrors = validate(form, hasPhotos, Boolean(imageError))
    if (!contactConsent) validationErrors.contactConsent = 'Persetujuan ini diperlukan untuk mengirim pengajuan.'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length || imageError) return

    setSubmitting(true)
    try {
      const uploadedUrls = []
      for (const item of imageSelections) {
        const url = await uploadImageFile(item.file, 'submissions')
        uploadedUrls.push(url)
      }
      const primaryUrl = uploadedUrls[0] || form.imageUrl.trim()
      const allImages = [
        ...uploadedUrls,
        ...(form.imageUrl.trim() && !uploadedUrls.includes(form.imageUrl.trim()) ? [form.imageUrl.trim()] : []),
      ]

      const result = await createSubmission({
        ...form,
        sellerName: form.sellerName.trim(),
        sellerPhone: form.sellerPhone.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        mileage: Number(form.mileage),
        expectedPrice: Number(form.expectedPrice),
        location: form.location.trim(),
        imageUrl: primaryUrl,
        images: allImages,
        description: form.description.trim() || undefined,
      })
      setMessage({ type: 'success', id: result.id })
      setForm(EMPTY_FORM)
      clearFiles()
      setErrors({})
      setContactConsent(false)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-content sell-page">
      <section className="sell-intro">
        <p className="eyebrow">PENGAJUAN KURASI MOBIL</p>
        <h1>Jual mobil Anda<br /><em>di CarHub.</em></h1>
        <p className="intro-copy">Kirimkan data mobil Anda. Tim CarHub akan memeriksa kelengkapan sebelum mobil tayang ke katalog publik.</p>
      </section>

      {message?.type === 'success' && (
        <section className="notice notice-success submission-success" aria-live="polite">
          <Check size={20} aria-hidden="true" />
          <div>
            <strong>Pengajuan berhasil dikirim</strong>
            <p>ID pengajuan Anda: <code>#{message.id}</code>. Tim CarHub akan segera meninjau detail dan foto mobil Anda.</p>
          </div>
        </section>
      )}

      {message?.type === 'error' && (
        <section className="notice notice-error" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <p>{message.text}</p>
        </section>
      )}

      <form className="seller-form" onSubmit={submit} noValidate>
        {Boolean(errorCount) && (
          <div className="notice notice-error" ref={errorSummary} tabIndex={-1} role="alert" aria-atomic="true">
            <strong>Periksa kembali formulir Anda</strong>
            <p>Terdapat {errorCount} bagian yang memerlukan perhatian sebelum pengajuan dapat dikirim.</p>
          </div>
        )}

        <fieldset className="form-section">
          <legend>Data kontak penjual</legend>
          <div className="form-grid">
            <Field
              name="sellerName"
              label="Nama lengkap"
              maxLength={150}
              required
              value={form.sellerName}
              onChange={updateField}
              error={errors.sellerName}
            />
            <Field
              name="sellerPhone"
              label="Nomor WhatsApp"
              type="tel"
              placeholder="Contoh: 08123456789"
              required
              value={form.sellerPhone}
              onChange={updateField}
              error={errors.sellerPhone}
            />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Spesifikasi kendaraan</legend>
          <div className="form-grid">
            <Field
              name="brand"
              label="Merk mobil"
              placeholder="Contoh: Honda"
              maxLength={100}
              required
              value={form.brand}
              onChange={updateField}
              error={errors.brand}
            />
            <Field
              name="model"
              label="Model mobil"
              placeholder="Contoh: CR-V Turbo"
              maxLength={100}
              required
              value={form.model}
              onChange={updateField}
              error={errors.model}
            />
            <Field
              name="year"
              label="Tahun pembuatan"
              type="number"
              min={1886}
              max={new Date().getFullYear() + 1}
              required
              value={form.year}
              onChange={updateField}
              error={errors.year}
            />
            <label className="form-field" htmlFor="submission-transmission">
              <span>Transmisi</span>
              <select
                id="submission-transmission"
                name="transmission"
                value={form.transmission}
                onChange={updateField}
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </label>
            <Field
              name="mileage"
              label="Jarak tempuh (km)"
              type="number"
              min={0}
              required
              value={form.mileage}
              onChange={updateField}
              error={errors.mileage}
            />
            <Field
              name="expectedPrice"
              label="Ekspektasi harga (Rp)"
              type="number"
              min={1}
              required
              value={form.expectedPrice}
              onChange={updateField}
              error={errors.expectedPrice}
            />
          </div>
          <Field
            name="location"
            label="Lokasi kendaraan"
            placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
            maxLength={150}
            required
            value={form.location}
            onChange={updateField}
            error={errors.location}
          />
        </fieldset>

        <fieldset className="form-section">
          <legend>Foto dan catatan kendaraan</legend>
          <div className="form-stack">
            <MultiImageUploader
              id="submission-image-files"
              selections={imageSelections}
              error={imageError}
              disabled={submitting}
              uploading={submitting && imageSelections.length > 0}
              inputRef={imageInputRef}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
            />
            <Field
              name="imageUrl"
              label="URL foto HTTPS alternatif (opsional jika sudah unggah foto)"
              type="url"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={updateField}
              error={errors.imageUrl}
            />
            <label className="form-field" htmlFor="submission-description">
              <span>Deskripsi <small>Opsional</small></span>
              <textarea
                id="submission-description"
                name="description"
                rows="4"
                maxLength={3000}
                value={form.description}
                onChange={updateField}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'submission-description-error' : undefined}
              />
              {errors.description && <small className="field-error" id="submission-description-error">{errors.description}</small>}
            </label>
          </div>
        </fieldset>
        <label className="consent-field">
          <input
            type="checkbox"
            checked={contactConsent}
            aria-invalid={Boolean(errors.contactConsent)}
            aria-describedby={errors.contactConsent ? 'contact-consent-error' : undefined}
            onChange={(event) => {
              setContactConsent(event.target.checked)
              if (event.target.checked) {
                setErrors((current) => {
                  const next = { ...current }
                  delete next.contactConsent
                  return next
                })
              }
            }}
          />
          <span>Saya setuju data kontak dan spesifikasi mobil ini diverifikasi oleh tim kurator CarHub.</span>
        </label>
        {errors.contactConsent && (
          <small className="field-error consent-error" id="contact-consent-error" role="alert">
            {errors.contactConsent}
          </small>
        )}
        <button className="button button-primary submit-button" type="submit" disabled={submitting}>
          {submitting ? 'Mengirim pengajuan…' : <>Kirim pengajuan <ArrowRight size={17} aria-hidden="true" /></>}
        </button>
      </form>
    </main>
  )
}
