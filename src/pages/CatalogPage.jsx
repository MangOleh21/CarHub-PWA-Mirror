import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCars } from '../services/api.js'
import CarCard from '../components/CarCard.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx'

const PAGE_SIZE = 12

export default function CatalogPage({ navigate, wishlistIds, toggleWishlist }) {
  const [draft, setDraft] = useState({
    search: '',
    brand: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [filters, setFilters] = useState({ ...draft })
  const [page, setPage] = useState(1)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })

  useEffect(() => {
    let active = true
    getCars({ ...filters, page, pageSize: PAGE_SIZE })
      .then((data) => { if (active) setResponse({ key: requestKey, result: data, error: null }) })
      .catch((cause) => { if (active) setResponse({ key: requestKey, result: null, error: cause.message }) })
    return () => { active = false }
  }, [filters, page, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    setFilters({
      ...draft,
      search: draft.search.trim(),
      brand: draft.brand.trim(),
    })
    setRequestKey((key) => key + 1)
  }

  function clearFilters() {
    const emptyFilters = {
      search: '',
      brand: '',
      transmission: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
    setDraft(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  const hasFilters = Boolean(
    filters.search || filters.brand || filters.transmission || filters.minPrice || filters.maxPrice
    || filters.minYear || filters.maxYear || filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc',
  )

  return (
    <main className="page-content catalog-page">
      <section className="catalog-intro">
        <p className="eyebrow">KURASI CARHUB · INDONESIA</p>
        <h1>Temukan mobil<br /><em>yang tepat.</em></h1>
        <p className="intro-copy">Pilihan mobil bekas terkurasi, spesifikasi jelas, dan penjual yang dapat Anda hubungi langsung.</p>
      </section>

      <form className="search-panel" onSubmit={applyFilters}>
        <label className="search-field">
          <span className="sr-only">Cari merk atau model</span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            maxLength={100}
            placeholder="Cari merk atau model"
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
        <div className="catalog-filters">
          <label className="catalog-filter-field">
            <span>Transmisi</span>
            <select
              value={draft.transmission}
              onChange={(event) => setDraft((current) => ({ ...current, transmission: event.target.value }))}
            >
              <option value="">Semua</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </label>
          <label className="catalog-filter-field">
            <span>Harga minimum</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Rp"
              value={draft.minPrice}
              onChange={(event) => setDraft((current) => ({ ...current, minPrice: event.target.value }))}
            />
          </label>
          <label className="catalog-filter-field">
            <span>Harga maksimum</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Rp"
              value={draft.maxPrice}
              onChange={(event) => setDraft((current) => ({ ...current, maxPrice: event.target.value }))}
            />
          </label>
          <label className="catalog-filter-field">
            <span>Tahun minimum</span>
            <input
              type="number"
              min="1886"
              max="2100"
              inputMode="numeric"
              placeholder="Tahun"
              value={draft.minYear}
              onChange={(event) => setDraft((current) => ({ ...current, minYear: event.target.value }))}
            />
          </label>
          <label className="catalog-filter-field">
            <span>Tahun maksimum</span>
            <input
              type="number"
              min="1886"
              max="2100"
              inputMode="numeric"
              placeholder="Tahun"
              value={draft.maxYear}
              onChange={(event) => setDraft((current) => ({ ...current, maxYear: event.target.value }))}
            />
          </label>
          <label className="catalog-filter-field">
            <span>Urutkan</span>
            <select
              value={`${draft.sortBy}:${draft.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':')
                setDraft((current) => ({ ...current, sortBy, sortOrder }))
              }}
            >
              <option value="createdAt:desc">Terbaru</option>
              <option value="price:asc">Harga terendah</option>
              <option value="price:desc">Harga tertinggi</option>
              <option value="year:desc">Tahun terbaru</option>
              <option value="year:asc">Tahun terlama</option>
            </select>
          </label>
        </div>
      </form>

      <section className="catalog-results" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KATALOG AKTIF</p>
            <h2 id="catalog-heading">Pilihan terbaru</h2>
          </div>
          {result && <p className="result-count">{result.pagination.totalItems} mobil</p>}
        </div>

        {loading && <LoadingState label="Memuat katalog mobil" />}
        {!loading && error && <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />}
        {!loading && !error && result?.data.length === 0 && (
          <EmptyState
            title="Belum ada mobil yang cocok"
            message="Ubah kata pencarian atau filter untuk melihat pilihan lain."
            action={hasFilters && (
              <button className="button button-outline" type="button" onClick={clearFilters}>Hapus filter</button>
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
