import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Image as ImageIcon, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import AppLink from '../../components/AppLink.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import ImageGallery from '../../components/ImageGallery.jsx'
import { formatMileage, formatPrice } from '../../lib/format.js'
import { deleteCar, getAdminCars } from '../../services/api.js'

const PAGE_SIZE = 20

function AdminCarCard({ car, navigate, deleting, onDelete, onViewGallery }) {
  const [imageFailed, setImageFailed] = useState(false)
  const images = car.images?.length ? car.images : [car.imageUrl]

  return (
    <article className="car-card admin-car-card">
      <div className="car-image-wrap admin-car-image-wrap">
        {imageFailed ? (
          <div className="car-image-fallback" aria-hidden="true">CarHub</div>
        ) : (
          <img
            className="car-image"
            src={images[0]}
            alt={`Foto ${car.brand} ${car.model}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="car-year">{car.year} · {car.transmission}</span>
        <button
          className="admin-car-gallery-trigger"
          type="button"
          onClick={() => onViewGallery(car)}
          aria-label={`Lihat ${images.length} foto ${car.brand} ${car.model}`}
        >
          <ImageIcon size={16} aria-hidden="true" />
          <span className="admin-car-gallery-label">Lihat {images.length} foto</span>
        </button>
      </div>
      <div className="car-card-content">
        <h2>{car.brand} {car.model}</h2>
        <p className="car-meta">
          <span>{formatMileage(car.mileage)}</span>
          <span><MapPin size={14} aria-hidden="true" /> {car.location || 'Lokasi belum tersedia'}</span>
        </p>
        <p className="car-price">{formatPrice(car.price)}</p>
        <div className="admin-row-actions">
          <AppLink
            className="button button-quiet"
            to={`/admin/cars/${car.id}/edit`}
            navigate={navigate}
            aria-label={`Edit ${car.brand} ${car.model}`}
          ><Pencil size={16} aria-hidden="true" /> Edit</AppLink>
          <button
            className="button button-danger-quiet"
            type="button"
            disabled={deleting}
            onClick={() => onDelete(car)}
            aria-label={`Hapus ${car.brand} ${car.model}`}
          >
            <Trash2 size={16} aria-hidden="true" /> {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>
    </article>
  )
}

function AdminCarGalleryDialog({ car, onClose }) {
  const dialogRef = useRef(null)
  const ignoredCloseEvents = useRef(0)
  const titleId = useId()
  const images = car.images?.length ? car.images : [car.imageUrl]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    dialog.showModal()
    return () => {
      if (dialog.open) {
        ignoredCloseEvents.current += 1
        dialog.close()
      }
    }
  }, [])

  function handleClose() {
    if (ignoredCloseEvents.current > 0) {
      ignoredCloseEvents.current -= 1
      return
    }
    onClose()
  }

  function handleCancel(event) {
    event.preventDefault()
    dialogRef.current?.close()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialogRef.current?.close()
    }
  }

  return (
    <dialog
      className="admin-gallery-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
    >
      <header className="admin-gallery-dialog-header">
        <div>
          <p className="eyebrow">GALERI FOTO · {images.length} FOTO</p>
          <h2 id={titleId}>{car.brand} {car.model}</h2>
        </div>
        <button
          className="button button-quiet admin-gallery-close"
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={`Tutup galeri ${car.brand} ${car.model}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <ImageGallery
        images={images}
        alt={`Foto ${car.brand} ${car.model}`}
        label={`Foto ${car.brand} ${car.model}`}
        className="admin-gallery-viewer"
      />
    </dialog>
  )
}

export default function AdminCarsPanel({ navigate, onDataChange }) {
  const [page, setPage] = useState(1)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })
  const [actionError, setActionError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [galleryCar, setGalleryCar] = useState(null)

  useEffect(() => {
    let active = true
    getAdminCars({ page, pageSize: PAGE_SIZE })
      .then((result) => { if (active) setResponse({ key: requestKey, result, error: null }) })
      .catch((error) => { if (active) setResponse({ key: requestKey, result: null, error: error.message }) })
    return () => { active = false }
  }, [page, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  async function removeCar(car) {
    const confirmed = window.confirm(
      `Hapus ${car.brand} ${car.model} secara permanen? Tindakan ini tidak dapat dibatalkan.`,
    )
    if (!confirmed) return

    setDeletingId(car.id)
    setActionError(null)
    try {
      await deleteCar(car.id)
      setRequestKey((key) => key + 1)
      onDataChange()
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">DATA PUBLIK</p>
          <h2>Katalog aktif</h2>
        </div>
        <AppLink className="button button-primary" to="/admin/cars/new" navigate={navigate}>
          <Plus size={17} aria-hidden="true" /> Tambah mobil
        </AppLink>
      </div>
      {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
      {loading && <LoadingState label="Memuat katalog admin" />}
      {!loading && error && <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />}
      {!loading && !error && result?.data.length === 0 && (
        <EmptyState title="Katalog masih kosong" message="Tambahkan listing pertama agar tersedia di katalog publik." />
      )}
      {!loading && !error && result?.data.length > 0 && (
        <>
          <div className="admin-list">
            {result.data.map((car) => (
              <AdminCarCard
                key={car.id}
                car={car}
                navigate={navigate}
                deleting={deletingId === car.id}
                onDelete={removeCar}
                onViewGallery={setGalleryCar}
              />
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
              >Berikutnya <ArrowRight size={15} aria-hidden="true" /></button>
            </div>
          )}
          {galleryCar && (
            <AdminCarGalleryDialog car={galleryCar} onClose={() => setGalleryCar(null)} />
          )}
        </>
      )}
    </section>
  )
}
