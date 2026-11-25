import { Filter, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCarBrands, getCars } from '../services/api.js'
import CarCard from '../components/CarCard.jsx'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineDataNotice,
  OfflineFallbackPrompt,
} from '../components/Feedback.jsx'
import { canUseOfflineFallback, getOfflineCarBrands, getOfflineCars } from '../services/offline-cars.js'

const PAGE_SIZE = 12

export default function CatalogPage({ navigate, search: locationSearch, wishlistIds, toggleWishlist }) {
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
  const offlineMode = new URLSearchParams(locationSearch).get('offline') === '1'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [brandsRequestKey, setBrandsRequestKey] = useState(0)
  const [brandsResponse, setBrandsResponse] = useState({ key: -1, brands: [], error: null })

  useEffect(() => {
    let active = true
    const options = { ...filters, page, pageSize: PAGE_SIZE }
    const request = offlineMode ? Promise.resolve(getOfflineCars(options)) : getCars(options)
    request
      .then((data) => { if (active) setResponse({ key: requestKey, result: data, error: null }) })
      .catch((cause) => { if (active) setResponse({ key: requestKey, result: null, error: cause }) })
    return () => { active = false }
  }, [filters, offlineMode, page, requestKey])

  useEffect(() => {
    let active = true
    if (offlineMode) return () => { active = false }

    getCarBrands()
      .then((brands) => {
        if (active) setBrandsResponse({ key: brandsRequestKey, brands, error: null })
      })
      .catch((cause) => {
        if (active) setBrandsResponse({ key: brandsRequestKey, brands: [], error: cause.message })
      })
    return () => { active = false }
  }, [brandsRequestKey, offlineMode])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const error = response.key === requestKey ? response.error : null
  const brandsLoading = !offlineMode && brandsResponse.key !== brandsRequestKey
  const brands = offlineMode
    ? getOfflineCarBrands()
    : brandsResponse.key === brandsRequestKey ? brandsResponse.brands : []
  const brandsError = offlineMode
    ? null
    : brandsResponse.key === brandsRequestKey ? brandsResponse.error : null
  const activeFilterCount = [
    filters.brand,
    filters.transmission,
    filters.minPrice,
    filters.maxPrice,
    filters.minYear,
    filters.maxYear,
  ].filter(Boolean).length + Number(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc')

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

  function useOfflineCatalog() {
    setPage(1)
    setRequestKey((key) => key + 1)
    navigate('/catalog?offline=1')
  }

  function reconnect() {
    setPage(1)
    setRequestKey((key) => key + 1)
    navigate('/catalog')
  }

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
        <button
          className="button button-outline catalog-filter-toggle"
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="catalog-filter-options"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Filter size={16} aria-hidden="true" />
          Filter
          {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
        <button className="button button-primary search-submit" type="submit">Cari</button>
        <div
          className="catalog-filters"
          id="catalog-filter-options"
          hidden={!filtersOpen}
        >
          <fieldset className="catalog-brand-filter">
            <legend>Merek</legend>
            {brandsLoading && <p role="status">Memuat daftar merek...</p>}
            {!brandsLoading && brandsError && (
              <div className="catalog-brand-error" role="alert">
                <span>Daftar merek gagal dimuat: {brandsError}</span>
                <button
                  className="catalog-retry-button"
                  type="button"
                  onClick={() => setBrandsRequestKey((key) => key + 1)}
                >Coba lagi</button>
              </div>
            )}
            {!brandsLoading && !brandsError && brands.length === 0 && (
              <p>Belum ada merek di katalog.</p>
            )}
            {!brandsLoading && !brandsError && brands.length > 0 && (
              <div className="catalog-brand-options" role="group" aria-label="Pilih satu merek">
                <button
                  className="catalog-brand-option"
                  type="button"
                  aria-pressed={!draft.brand}
                  onClick={() => setDraft((current) => ({ ...current, brand: '' }))}
                >Semua merek</button>
                {brands.map((brand) => (
                  <button
                    className="catalog-brand-option"
                    key={brand}
                    type="button"
                    aria-pressed={draft.brand === brand}
                    onClick={() => setDraft((current) => ({ ...current, brand }))}
                  >{brand}</button>
                ))}
              </div>
            )}
          </fieldset>
          <label className="catalog-filter-field">
            <span>Transmisi</span>
            <select
              value={draft.transmission}
              onChange={(event) => setDraft((current) => ({ ...current, transmission: event.target.value }))}
            >
              <option value="">Semua</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
              <option value="CVT">CVT</option>
              <option value="DCT">DCT</option>
              <option value="AMT">AMT</option>
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
        {offlineMode && <OfflineDataNotice onReconnect={reconnect} />}
        <div className="section-heading">
          <div>
            <p className="eyebrow">KATALOG AKTIF</p>
            <h2 id="catalog-heading">Pilihan terbaru</h2>
          </div>
          {result && <p className="result-count">{result.pagination.totalItems} mobil</p>}
        </div>

        {loading && <LoadingState label="Memuat katalog mobil" />}
        {!loading && error && (
          <>
            <ErrorState
              message={error.message}
              onRetry={() => setRequestKey((key) => key + 1)}
            />
            {canUseOfflineFallback(error) && (
              <OfflineFallbackPrompt onUseOffline={useOfflineCatalog} />
            )}
          </>
        )}
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
