import { useEffect, useState } from 'react'
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react'
import AppLink from '../../components/AppLink.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import ImageGallery from '../../components/ImageGallery.jsx'
import { formatPrice } from '../../lib/format.js'
import { deleteCar, getAdminCars } from '../../services/api.js'

const PAGE_SIZE = 20

export default function AdminCarsPanel({ navigate, onDataChange }) {
  const [page, setPage] = useState(1)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })
  const [actionError, setActionError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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
              <article className="admin-list-row" key={car.id}>
                <ImageGallery
                  images={car.images}
                  alt={`Foto ${car.brand} ${car.model}`}
                  label={`Foto ${car.brand} ${car.model}`}
                  className="admin-car-gallery"
                />
                <div className="admin-car-info">
                  <span className="admin-record-id">#{car.id} · {car.year}</span>
                  <h3>{car.brand} {car.model}</h3>
                  <p>{car.location || 'Lokasi tidak tersedia'} · {car.transmission}</p>
                </div>
                <strong className="mono admin-car-price">{formatPrice(car.price)}</strong>
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
                    disabled={deletingId === car.id}
                    onClick={() => removeCar(car)}
                    aria-label={`Hapus ${car.brand} ${car.model}`}
                  >
                    <Trash2 size={16} aria-hidden="true" /> {deletingId === car.id ? 'Menghapus…' : 'Hapus'}
                  </button>
                </div>
              </article>
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
        </>
      )}
    </section>
  )
}
