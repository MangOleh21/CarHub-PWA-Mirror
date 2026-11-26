import { useEffect, useId, useRef, useState } from 'react'
import {
  Archive,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import AppLink from '../../components/AppLink.jsx'
import AdminCarDetailsDialog from '../../components/AdminCarDetailsDialog.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import ImageGallery from '../../components/ImageGallery.jsx'
import { formatMileage, formatPrice } from '../../lib/format.js'
import {
  archiveCar,
  getAdminCars,
  permanentlyDeleteArchivedCar,
  restoreCar,
} from '../../services/api.js'

function AdminCarCard({
  car,
  navigate,
  archived,
  updating,
  onArchiveChange,
  onPermanentlyDelete,
  onViewGallery,
  onViewDetails,
}) {
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
        {archived && <span className="admin-archived-badge">Diarsipkan</span>}
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
          <button
            className="button button-quiet"
            type="button"
            onClick={() => onViewDetails(car)}
            aria-label={`Lihat detail ${car.brand} ${car.model}`}
          ><Eye size={16} aria-hidden="true" /> Detail</button>
          <AppLink
            className="button button-quiet"
            to={`/admin/cars/${car.id}/edit`}
            navigate={navigate}
            aria-label={`Edit ${car.brand} ${car.model}`}
          ><Pencil size={16} aria-hidden="true" /> Edit</AppLink>
          <button
            className="button button-quiet"
            type="button"
            disabled={updating}
            onClick={() => onArchiveChange(car)}
            aria-label={`${archived ? 'Pulihkan' : 'Arsipkan'} ${car.brand} ${car.model}`}
          >
            {archived
              ? <><RotateCcw size={16} aria-hidden="true" /> {updating ? 'Memulihkan…' : 'Pulihkan'}</>
              : <><Archive size={16} aria-hidden="true" /> {updating ? 'Mengarsipkan…' : 'Arsipkan'}</>}
          </button>
          {archived && (
            <button
              className="button button-quiet"
              type="button"
              disabled={updating}
              onClick={() => onPermanentlyDelete(car)}
              aria-label={`Hapus permanen ${car.brand} ${car.model}`}
            >
              <Trash2 size={16} aria-hidden="true" />
              {updating ? 'Menghapus…' : 'Hapus permanen'}
            </button>
          )}
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
  const [archiveStatus, setArchiveStatus] = useState('active')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })
  const [actionError, setActionError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [galleryCar, setGalleryCar] = useState(null)
  const [detailCar, setDetailCar] = useState(null)

  useEffect(() => {
    let active = true
    getAdminCars({ archiveStatus, page, pageSize })
      .then((result) => { if (active) setResponse({ key: requestKey, result, error: null }) })
      .catch((error) => { if (active) setResponse({ key: requestKey, result: null, error: error.message }) })
    return () => { active = false }
  }, [archiveStatus, page, pageSize, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  async function updateArchive(car) {
    const restoring = archiveStatus === 'archived'
    setUpdatingId(car.id)
    setActionError(null)
    setActionMessage(null)
    try {
      if (restoring) await restoreCar(car.id)
      else await archiveCar(car.id)
      setActionMessage(restoring
        ? `${car.brand} ${car.model} dipulihkan ke katalog aktif.`
        : `${car.brand} ${car.model} dipindahkan ke arsip.`)
      setRequestKey((key) => key + 1)
      onDataChange()
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function permanentlyDelete(car) {
    const name = `${car.brand} ${car.model}`
    if (!window.confirm(
      `Hapus permanen ${name}? Data katalog tidak dapat dipulihkan. Foto di object storage tetap tersimpan.`,
    )) return

    setUpdatingId(car.id)
    setActionError(null)
    setActionMessage(null)
    try {
      await permanentlyDeleteArchivedCar(car.id)
      setActionMessage(`${name} dihapus permanen. Foto tetap tersimpan di object storage.`)
      setRequestKey((key) => key + 1)
      onDataChange()
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setUpdatingId(null)
    }
  }

  function selectArchiveStatus(status) {
    setArchiveStatus(status)
    setPage(1)
    setActionMessage(null)
    setRequestKey((key) => key + 1)
  }

  function changePage(nextPage) {
    setPage(nextPage)
    setRequestKey((key) => key + 1)
  }

  function changePageSize(nextPageSize) {
    setPageSize(nextPageSize)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">{archiveStatus === 'active' ? 'DATA PUBLIK' : 'DATA TERSIMPAN'}</p>
          <h2>{archiveStatus === 'active' ? 'Katalog aktif' : 'Arsip mobil'}</h2>
        </div>
        {archiveStatus === 'active' && (
          <AppLink className="button button-primary" to="/admin/cars/new" navigate={navigate}>
            <Plus size={17} aria-hidden="true" /> Tambah mobil
          </AppLink>
        )}
      </div>
      <nav className="admin-tabs admin-car-archive-tabs" aria-label="Status katalog mobil">
        <button
          className={`admin-tab${archiveStatus === 'active' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={archiveStatus === 'active'}
          onClick={() => selectArchiveStatus('active')}
        >Katalog aktif</button>
        <button
          className={`admin-tab${archiveStatus === 'archived' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={archiveStatus === 'archived'}
          onClick={() => selectArchiveStatus('archived')}
        >Arsip</button>
      </nav>
      {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
      {actionMessage && <p className="notice notice-success" role="status">{actionMessage}</p>}
      {loading && <LoadingState label="Memuat katalog admin" />}
      {!loading && error && <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />}
      {!loading && !error && result?.data.length === 0 && (
        <EmptyState
          title={archiveStatus === 'active' ? 'Katalog masih kosong' : 'Belum ada mobil di arsip'}
          message={archiveStatus === 'active'
            ? 'Tambahkan listing pertama agar tersedia di katalog publik.'
            : 'Mobil yang Anda arsipkan akan muncul di sini dan dapat dipulihkan.'}
        />
      )}
      {!loading && !error && result?.data.length > 0 && (
        <>
          <div className="admin-list">
            {result.data.map((car) => (
              <AdminCarCard
                key={car.id}
                car={car}
                navigate={navigate}
                archived={archiveStatus === 'archived'}
                updating={updatingId === car.id}
                onArchiveChange={updateArchive}
                onPermanentlyDelete={permanentlyDelete}
                onViewGallery={setGalleryCar}
                onViewDetails={setDetailCar}
              />
            ))}
          </div>
          {result.data.length > 0 && (
            <AdminPagination
              currentPage={page}
              pageSize={pageSize}
              totalPages={result.pagination.totalPages}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              label="Navigasi halaman katalog mobil"
            />
          )}
          {galleryCar && (
            <AdminCarGalleryDialog car={galleryCar} onClose={() => setGalleryCar(null)} />
          )}
          {detailCar && (
            <AdminCarDetailsDialog
              car={detailCar}
              archived={archiveStatus === 'archived'}
              onClose={() => setDetailCar(null)}
            />
          )}
        </>
      )}
    </section>
  )
}
