import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import ImageGallery from '../../components/ImageGallery.jsx'
import { formatPrice } from '../../lib/format.js'
import { getAdminSubmissions, reviewSubmission } from '../../services/api.js'

const PAGE_SIZE = 20

function SubmissionCard({ submission, onReview, busy }) {
  const [reviewNote, setReviewNote] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState(null)

  async function review(decision) {
    setError(null)
    if (decision === 'approved' && !submission.location && !location.trim()) {
      setError('Lokasi wajib diisi sebelum pengajuan ini dapat disetujui.')
      return
    }
    if (decision === 'approved' && !submission.images.length && !imageUrl.trim()) {
      setError('URL foto HTTPS wajib diisi sebelum pengajuan ini dapat disetujui.')
      return
    }
    if (decision === 'approved' && imageUrl.trim()) {
      try {
        if (new URL(imageUrl).protocol !== 'https:') throw new TypeError()
      } catch {
        setError('URL foto harus menggunakan HTTPS.')
        return
      }
    }

    const input = {}
    if (reviewNote.trim()) input.reviewNote = reviewNote.trim()
    if (decision === 'approved' && !submission.location && location.trim()) input.location = location.trim()
    if (decision === 'approved' && !submission.images.length && imageUrl.trim()) {
      input.images = [imageUrl.trim()]
    }
    try {
      await onReview(submission.id, decision, input)
    } catch (cause) {
      setError(cause.message)
    }
  }

  return (
    <article className="submission-card">
      <div className="submission-card-header">
        <div>
          <span className="admin-record-id">#{submission.id} · {new Date(submission.createdAt).toLocaleDateString('id-ID')}</span>
          <h3>{submission.brand} {submission.model} <span>({submission.year})</span></h3>
        </div>
        <span className={`status-badge status-${submission.status}`}>{submission.status}</span>
      </div>
      <dl className="submission-details">
        <div><dt>Penjual</dt><dd>{submission.sellerName} · {submission.sellerPhone}</dd></div>
        <div><dt>Harga</dt><dd>{formatPrice(submission.expectedPrice)}</dd></div>
        <div><dt>Detail</dt><dd>{submission.mileage.toLocaleString('id-ID')} km · {submission.transmission}</dd></div>
        <div><dt>Bahan bakar</dt><dd>{submission.fuelType || 'Belum diisi'}</dd></div>
        <div><dt>Lokasi</dt><dd>{submission.location || 'Belum diisi'}</dd></div>
      </dl>
      <ImageGallery
        images={submission.images}
        alt={`Foto ${submission.brand} ${submission.model}`}
        label={`Foto pengajuan ${submission.brand} ${submission.model}`}
        className="submission-gallery"
      />
      {submission.description && <p className="submission-description">{submission.description}</p>}

      {submission.status === 'pending' && (
        <div className="submission-review">
          {(!submission.location || !submission.images.length) && (
            <div className="form-grid">
              {!submission.location && (
                <label className="form-field">
                  <span>Lengkapi lokasi</span>
                  <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={150} />
                </label>
              )}
              {!submission.images.length && (
                <label className="form-field">
                  <span>Lengkapi URL foto HTTPS</span>
                  <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
                </label>
              )}
            </div>
          )}
          <label className="form-field">
            <span>Catatan review <small>Opsional</small></span>
            <textarea rows="2" maxLength={3000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
          </label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="admin-row-actions">
            <button className="button button-success" type="button" disabled={busy} onClick={() => review('approved')}>
              <Check size={16} aria-hidden="true" /> Setujui
            </button>
            <button className="button button-danger-quiet" type="button" disabled={busy} onClick={() => review('rejected')}>
              <X size={16} aria-hidden="true" /> Tolak
            </button>
          </div>
        </div>
      )}
      {submission.reviewedByEmail && (
        <p className="review-note"><strong>Ditinjau oleh:</strong> {submission.reviewedByEmail}</p>
      )}
      {submission.reviewedAt && (
        <p className="review-note">
          <strong>Waktu review:</strong>{' '}
          <time dateTime={submission.reviewedAt}>{new Date(submission.reviewedAt).toLocaleString('id-ID')}</time>
        </p>
      )}
      {submission.reviewNote && <p className="review-note"><strong>Catatan:</strong> {submission.reviewNote}</p>}
    </article>
  )
}

export default function AdminSubmissionsPanel({ onDataChange }) {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let active = true
    getAdminSubmissions({ status, page, pageSize: PAGE_SIZE })
      .then((result) => { if (active) setResponse({ key: requestKey, result, error: null }) })
      .catch((error) => { if (active) setResponse({ key: requestKey, result: null, error: error.message }) })
    return () => { active = false }
  }, [status, page, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  async function review(id, decision, input) {
    setBusyId(id)
    setActionError(null)
    try {
      await reviewSubmission(id, decision, input)
      setRequestKey((key) => key + 1)
      onDataChange()
    } catch (cause) {
      setActionError(cause.message)
      throw cause
    } finally {
      setBusyId(null)
    }
  }

  function changeStatus(event) {
    setStatus(event.target.value)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">ANTREAN KURASI</p>
          <h2>Pengajuan penjual</h2>
        </div>
        <label className="status-filter">
          <span className="sr-only">Filter status pengajuan</span>
          <select value={status} onChange={changeStatus}>
            <option value="pending">Menunggu review</option>
            <option value="all">Semua status</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </label>
      </div>
      {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
      {loading && <LoadingState label="Memuat pengajuan" />}
      {!loading && error && <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />}
      {!loading && !error && result?.data.length === 0 && (
        <EmptyState title="Tidak ada pengajuan" message="Pengajuan sesuai filter ini akan muncul di sini." />
      )}
      {!loading && !error && result?.data.length > 0 && (
        <>
          <div className="submission-list">
            {result.data.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} onReview={review} busy={busyId === submission.id} />
            ))}
          </div>
          {result.pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-outline"
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((current) => current - 1)
                  setRequestKey((key) => key + 1)
                }}
              >Sebelumnya</button>
              <span>Halaman {page} dari {result.pagination.totalPages}</span>
              <button
                className="button button-outline"
                type="button"
                disabled={page >= result.pagination.totalPages}
                onClick={() => {
                  setPage((current) => current + 1)
                  setRequestKey((key) => key + 1)
                }}
              >Berikutnya</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
