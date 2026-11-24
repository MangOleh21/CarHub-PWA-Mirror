import { ArrowUpDown, Filter, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCars } from '../services/api.js'
import CarCard from '../components/CarCard.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'year_desc', label: 'Tahun Terbaru' },
  { value: 'mileage_asc', label: 'Jarak Tempuh Terendah' },
]

export default function CatalogPage({ navigate, wishlistIds, toggleWishlist }) {
  const [draft, setDraft] = useState({
    search: '',
    brand: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  })
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })

  useEffect(() => {
    let active = true
    const query = {
      search: filters.search || undefined,
      brand: filters.brand || undefined,
      transmission: filters.transmission || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      sort: filters.sort || 'newest',
      page,
      pageSize: PAGE_SIZE,
    }

    getCars(query)
      .then((data) => { if (active) setResponse({ key: requestKey, result: data, error: null }) })
      .catch((cause) => { if (active) setResponse({ key: requestKey, result: null, error: cause.message }) })
    return () => { active = false }
  }, [filters, page, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  function applyFilters(event) {
    if (event) event.preventDefault()
    setPage(1)
    setFilters({ ...draft })
    setRequestKey((key) => key + 1)
  }

  function handleSortChange(event) {
    const newSort = event.target.value
    setDraft((curr) => ({ ...curr, sort: newSort }))
    setFilters((curr) => ({ ...curr, sort: newSort }))
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  function clearFilters() {
    const reset = {
      search: '',
      brand: '',
      transmission: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
    }
    setDraft(reset)
    setFilters(reset)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.brand || filters.transmission || filters.minPrice || filters.maxPrice || filters.sort !== 'newest',
  )

  return (
    <main className="page-content catalog-page">
      <section className="catalog-intro">
        <p className="eyebrow">KURASI CARHUB · INDONESIA</p>
        <h1>Temukan mobil<br /><em>yang tepat.</em></h1>
        <p className="intro-copy">Pilihan mobil bekas terkurasi, spesifikasi jelas, dan penjual yang dapat Anda hubungi langsung.</p>
      </section>

      <form className="search-panel" onSubmit={applyFilters}>
        <div className="search-main-row">
          <label className="search-field">
            <span className="sr-only">Cari merk atau model</span>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              maxLength={100}
              placeholder="Cari merk atau model (e.g. Civic, Avanza)"
              value={draft.search}
              onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
          <label className="search-field brand-field">
            <span className="sr-only">Filter merk</span>
            <input
              type="search"
              maxLength={100}
              placeholder="Semua merk"
              value={draft.brand}
              onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}
            />
          </label>
          <button className="button button-primary search-submit" type="submit">Cari</button>
        </div>

        <div className="search-secondary-row">
          <div className="sort-group">
            <label htmlFor="catalog-sort" className="sort-label">
              <ArrowUpDown size={15} aria-hidden="true" /> Urutkan:
            </label>
            <select
              id="catalog-sort"
              className="catalog-select"
              value={draft.sort}
              onChange={handleSortChange}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="catalog-trans" className="sort-label">
              Transmisi:
            </label>
            <select
              id="catalog-trans"
              className="catalog-select"
              value={draft.transmission}
              onChange={(event) => {
                const val = event.target.value
                setDraft((curr) => ({ ...curr, transmission: val }))
                setFilters((curr) => ({ ...curr, transmission: val }))
                setPage(1)
                setRequestKey((k) => k + 1)
              }}
            >
              <option value="">Semua Transmisi</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <button
            className={`button button-outline filter-toggle-btn${showAdvanced ? ' is-active' : ''}`}
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            <Filter size={15} aria-hidden="true" /> Filter Harga
          </button>

          {hasActiveFilters && (
            <button className="button button-quiet clear-filters-btn" type="button" onClick={clearFilters}>
              <X size={15} aria-hidden="true" /> Reset
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="search-price-row">
            <label className="price-filter-field">
              <span>Harga minimum (Rp)</span>
              <input
                type="number"
                min="0"
                step="5000000"
                placeholder="0"
                value={draft.minPrice}
                onChange={(event) => setDraft((curr) => ({ ...curr, minPrice: event.target.value }))}
              />
            </label>
            <span className="price-separator">—</span>
            <label className="price-filter-field">
              <span>Harga maksimum (Rp)</span>
              <input
                type="number"
                min="0"
                step="5000000"
                placeholder="Tanpa batas"
                value={draft.maxPrice}
                onChange={(event) => setDraft((curr) => ({ ...curr, maxPrice: event.target.value }))}
              />
            </label>
            <button className="button button-primary price-apply-btn" type="submit">
              Terapkan
            </button>
          </div>
        )}
      </form>

      <section className="catalog-results" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KATALOG AKTIF</p>
            <h2 id="catalog-heading">Pilihan mobil</h2>
          </div>
          {result && <p className="result-count">{result.pagination.totalItems} unit ditemukan</p>}
        </div>

        {loading && <LoadingState label="Memuat katalog mobil…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />}
        {!loading && !error && result?.data.length === 0 && (
          <EmptyState
            title="Belum ada mobil yang cocok"
            message="Ubah kata pencarian, rentang harga, atau filter transmisi untuk melihat unit lain."
            action={hasActiveFilters && (
              <button className="button button-outline" type="button" onClick={clearFilters}>Hapus semua filter</button>
            )}
          />
        )}
        {!loading && !error && result?.data.length > 0 && (
          <>
            <div className="car-grid">
              {result.data.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  navigate={navigate}
                  isSaved={wishlistIds.includes(car.id)}
                  onToggleSaved={toggleWishlist}
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
                >Berikutnya</button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
