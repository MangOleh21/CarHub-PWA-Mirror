import { ArrowRight, Check, CircleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ImageUploader from '../components/ImageUploader.jsx'
import { useImageFileSelection } from '../hooks/useImageFileSelection.js'
import { maxImageCount } from '../lib/image-upload.js'
import { createSubmission, uploadImageFiles } from '../services/api.js'

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
  images: [],
  description: '',
}

function validate(form, selectedImageCount, hasImageError) {
  const errors = {}
  const required = ['sellerName', 'sellerPhone', 'brand', 'model', 'year', 'mileage', 'expectedPrice', 'location']
  required.forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = 'Bagian ini wajib diisi.'
  })
  const imageCount = form.images.length + selectedImageCount + (form.imageUrl.trim() ? 1 : 0)
  if (imageCount === 0 && !hasImageError) {
    errors.imageUrl = 'Pilih foto atau masukkan URL HTTPS.'
  }
  if (imageCount > maxImageCount) errors.imageUrl = `Jumlah foto maksimal ${maxImageCount} foto.`

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
    selectFiles,
    removeSelection,
    clearSelections,
    clearError: clearImageError,
  } = useImageFileSelection()
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
    const validationErrors = validate(form, imageSelections.length, Boolean(imageError))
    if (!contactConsent) validationErrors.contactConsent = 'Persetujuan ini diperlukan untuk mengirim pengajuan.'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length || imageError) return

    setSubmitting(true)
    try {
      const uploadedImages = await uploadImageFiles(
        imageSelections.map(({ file }) => file),
        'submissions',
      )
      const images = [
        ...form.images,
        ...uploadedImages,
        ...(form.imageUrl.trim() ? [form.imageUrl.trim()] : []),
      ]
      setForm((current) => ({ ...current, images, imageUrl: '' }))
      clearSelections()
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
        imageUrl: images[0],
        images,
        description: form.description.trim() || undefined,
      })
      setMessage({ type: 'success', id: result.id })
      setForm(EMPTY_FORM)
      clearSelections()
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
      <section className="page-intro">
        <p className="eyebrow">JUAL MELALUI CARHUB</p>
        <h1>Mobil Anda,<br /><em>berikutnya.</em></h1>
        <p>Kirim detail kendaraan untuk ditinjau tim kurasi. Pengajuan yang disetujui akan tampil di katalog CarHub.</p>
      </section>

      {message?.type === 'success' && (
        <div className="submission-success" role="status">
          <span className="success-icon"><Check size={18} aria-hidden="true" /></span>
          <div>
            <strong>Pengajuan telah diterima.</strong>
            <p>Tim CarHub akan meninjau detail kendaraan Anda. Nomor pengajuan: <span className="mono">#{message.id}</span></p>
          </div>
        </div>
      )}
      {message?.type === 'error' && (
        <div className="notice notice-error" role="alert"><CircleAlert size={18} aria-hidden="true" /> {message.text}</div>
      )}

      <form className="seller-form" onSubmit={submit} noValidate>
        {errorCount > 0 && (
          <div className="notice notice-error form-error-summary" role="alert" tabIndex="-1" ref={errorSummary}>
            Periksa kembali {errorCount} bagian yang ditandai sebelum mengirim.
          </div>
        )}
        <fieldset>
          <legend>Kontak penjual</legend>
          <div className="form-grid">
            <Field name="sellerName" label="Nama lengkap" autoComplete="name" value={form.sellerName} onChange={updateField} error={errors.sellerName} maxLength={150} />
            <Field name="sellerPhone" label="Nomor WhatsApp" type="tel" autoComplete="tel" placeholder="08xx atau +62" value={form.sellerPhone} onChange={updateField} error={errors.sellerPhone} maxLength={25} />
            <Field name="location" label="Kota / lokasi kendaraan" autoComplete="address-level2" placeholder="Contoh: Semarang" value={form.location} onChange={updateField} error={errors.location} maxLength={150} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Detail kendaraan</legend>
          <div className="form-grid">
            <Field name="brand" label="Merk" placeholder="Contoh: Toyota" value={form.brand} onChange={updateField} error={errors.brand} maxLength={100} />
            <Field name="model" label="Model" placeholder="Contoh: Avanza Veloz" value={form.model} onChange={updateField} error={errors.model} maxLength={100} />
            <Field name="year" label="Tahun" type="number" min="1886" max={new Date().getFullYear() + 1} inputMode="numeric" value={form.year} onChange={updateField} error={errors.year} />
            <label className="form-field" htmlFor="submission-transmission">
              <span>Transmisi</span>
              <select id="submission-transmission" name="transmission" value={form.transmission} onChange={updateField}>
                <option>Manual</option>
                <option>Automatic</option>
              </select>
            </label>
            <Field name="mileage" label="Jarak tempuh (km)" type="number" min="0" max="2147483647" inputMode="numeric" value={form.mileage} onChange={updateField} error={errors.mileage} />
            <Field name="expectedPrice" label="Harga yang diharapkan (Rp)" type="number" min="1" step="1" inputMode="numeric" value={form.expectedPrice} onChange={updateField} error={errors.expectedPrice} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Foto & deskripsi</legend>
          <div className="form-grid form-grid-single">
            <ImageUploader
              id="submission-image-file"
              images={form.images}
              selections={imageSelections}
              imageUrl={form.imageUrl}
              alt="Pratinjau foto mobil yang akan diajukan"
              error={imageError}
              disabled={submitting}
              uploading={submitting && imageSelections.length > 0}
              inputRef={imageInputRef}
              onSelectFiles={selectFiles}
              onRemoveImage={(index) => {
                setForm((current) => ({
                  ...current,
                  images: current.images.filter((_, position) => position !== index),
                }))
                clearImageError()
              }}
              onRemoveSelection={removeSelection}
              onClearImageUrl={() => {
                setForm((current) => ({ ...current, imageUrl: '' }))
                clearImageError()
              }}
            />
            <Field
              name="imageUrl"
              label="URL foto HTTPS (alternatif)"
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
                  const remaining = { ...current }
                  delete remaining.contactConsent
                  return remaining
                })
              }
            }}
          />
          <span>
            Saya memahami nomor WhatsApp akan ditampilkan kepada calon pembeli jika listing disetujui.
            {errors.contactConsent && <small className="field-error" id="contact-consent-error">{errors.contactConsent}</small>}
          </span>
        </label>
        <button className="button button-primary submit-button" type="submit" disabled={submitting}>
          {submitting ? 'Mengirim pengajuan…' : <>Kirim untuk ditinjau <ArrowRight size={17} aria-hidden="true" /></>}
        </button>
        <p className="form-footnote">Kontak digunakan untuk menindaklanjuti pengajuan dan menghubungkan Anda dengan calon pembeli jika listing disetujui.</p>
      </form>
    </main>
  )
}
