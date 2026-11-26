import { MapPin, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppLink from './AppLink.jsx'
import CarCard from './CarCard.jsx'
import { EmptyState, ErrorState, LoadingState } from './Feedback.jsx'
import PaginationControls from './PaginationControls.jsx'
import { formatMileage, formatPrice } from '../lib/format.js'
import { getMyListings } from '../services/api.js'

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Tayang' },
  { value: 'pending', label: 'Menunggu review' },
  { value: 'rejected', label: 'Ditolak' },
]

function getStatusLabel(status) {
  if (status === 'active') return 'Tayang'
  if (status === 'pending') return 'Menunggu review'
  if (status === 'rejected') return 'Ditolak'
  return status
}

function SubmissionListingCard({ item }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="my-listing-card">
      {item.imageUrl && !imageFailed ? (
        <img
          className="my-listing-thumb"
          src={item.imageUrl}
          alt={`${item.brand} ${item.model}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="my-listing-thumb car-image-fallback" aria-hidden="true">CarHub</div>
      )}
      <div className="my-listing-card-top">
        <div>
          <p className="eyebrow">PENGAJUAN #{item.id} · {item.year}</p>
          <h3>{item.brand} {item.model}</h3>
        </div>
        <span className={`status-badge status-${item.status}`}>{getStatusLabel(item.status)}</span>
      </div>
      <p className="car-meta">
        <span>{formatMileage(item.mileage)}</span>
        <span>{item.transmission}</span>
        {item.bodyType && <span>{item.bodyType}</span>}
        {item.color && <span>{item.color}</span>}
        <span><MapPin size={14} aria-hidden="true" /> {item.location || 'Lokasi belum tersedia'}</span>
      </p>
      <p className="car-price">{formatPrice(item.price)}</p>
      {item.reviewNote && (
        <p className="my-listing-review-note">
          <strong>Catatan admin:</strong> {item.reviewNote}
        </p>
      )}
    </article>
  )
}

export default function MyListingsSection({
  navigate,
  wishlistIds,
  toggleWishlist,
  showHeading = true,
}) {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })

  useEffect(() => {
    let active = true
    getMyListings({ status, page, pageSize })
      .then((result) => {
        if (active) setResponse({ key: requestKey, result, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, result: null, error: cause.message })
      })
    return () => { active = false }
  }, [status, page, pageSize, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  function selectStatus(nextStatus) {
    setStatus(nextStatus)
    setPage(1)
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
    <section className="my-listings-section" aria-label="Daftar mobil saya">
      {showHeading && (
        <div className="my-listings-header">
          <div>
            <p className="eyebrow">KATALOG PENJUAL</p>
            <h2 id="my-listings-heading">Mobil Saya</h2>
          </div>
          <AppLink className="button button-primary" to="/sell" navigate={navigate}>
            <Plus size={16} aria-hidden="true" /> Jual mobil
          </AppLink>
        </div>
      )}

      <nav className="admin-tabs" aria-label="Filter status mobil saya">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`admin-tab${status === tab.value ? ' is-active' : ''}`}
            type="button"
            aria-pressed={status === tab.value}
            onClick={() => selectStatus(tab.value)}
          >{tab.label}</button>
        ))}
      </nav>

      {loading && <LoadingState label="Memuat daftar mobil Anda" />}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />
      )}
      {!loading && !error && result?.data.length === 0 && (
        <EmptyState
          title="Belum ada mobil pada status ini"
          message="Ajukan mobil bekas Anda untuk mulai tampil di katalog CarHub."
          action={(
            <AppLink className="button button-primary" to="/sell" navigate={navigate}>
              Ajukan jual mobil
            </AppLink>
          )}
        />
      )}
      {!loading && !error && result?.data.length > 0 && (
        <>
          <div className="car-grid">
            {result.data.map((item) => (
              item.kind === 'car' ? (
                <div key={`car-${item.id}`} className="my-active-car-wrap">
                  <span className="status-badge my-listing-status-active">Tayang</span>
                  <CarCard
                    car={item}
                    navigate={navigate}
                    isSaved={wishlistIds.includes(item.id)}
                    onToggleSaved={toggleWishlist}
                  />
                </div>
              ) : (
                <SubmissionListingCard key={`submission-${item.id}`} item={item} />
              )
            ))}
          </div>
          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalPages={result.pagination.totalPages}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            label="Navigasi halaman mobil saya"
          />
        </>
      )}
    </section>
  )
}
