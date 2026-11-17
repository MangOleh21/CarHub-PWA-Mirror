import { useEffect, useState } from 'react'
import AppLink from '../components/AppLink.jsx'
import CarCard from '../components/CarCard.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx'
import { getCar } from '../services/api.js'

export default function WishlistPage({ navigate, wishlistIds, toggleWishlist }) {
  const [response, setResponse] = useState({ key: '', cars: [], error: null, unavailable: 0 })
  const [retryKey, setRetryKey] = useState(0)
  const requestKey = `${wishlistIds.join(',')}|${retryKey}`

  useEffect(() => {
    let active = true
    if (wishlistIds.length === 0) return () => { active = false }
    Promise.allSettled(wishlistIds.map((id) => getCar(id)))
      .then((results) => {
        if (!active) return
        const availableCars = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
        const failures = results
          .map((result, index) => ({ result, id: wishlistIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
        const missingIds = failures
          .filter(({ result }) => result.reason?.status === 404)
          .map(({ id }) => id)
        missingIds.forEach((id) => toggleWishlist(id))
        setResponse({
          key: requestKey,
          cars: availableCars,
          error: null,
          unavailable: failures.length - missingIds.length,
        })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, cars: [], error: cause.message, unavailable: 0 })
      })

    return () => { active = false }
  }, [wishlistIds, requestKey, toggleWishlist])

  const loading = wishlistIds.length > 0 && response.key !== requestKey
  const cars = response.key === requestKey ? response.cars : []
  const error = response.key === requestKey ? response.error : null
  const unavailable = response.key === requestKey ? response.unavailable : 0

  return (
    <main className="page-content">
      <section className="page-intro">
        <p className="eyebrow">DAFTAR PILIHAN</p>
        <h1>Mobil <em>favorit.</em></h1>
        <p>Mobil yang Anda simpan, tersedia kembali di sini pada perangkat ini.</p>
      </section>
      {loading && <LoadingState label="Memuat mobil favorit" />}
      {!loading && error && <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />}
      {!loading && !error && unavailable > 0 && (
        <div className="notice notice-warning" role="status">
          Sebagian data favorit belum dapat dimuat. Periksa koneksi lalu coba lagi.
          <button className="button button-outline" type="button" onClick={() => setRetryKey((key) => key + 1)}>Coba lagi</button>
        </div>
      )}
      {!loading && !error && cars.length === 0 && (
        <EmptyState
          title={wishlistIds.length ? 'Mobil belum tersedia' : 'Belum ada favorit'}
          message={wishlistIds.length
            ? 'Data mobil tidak dapat dimuat saat ini.'
            : 'Simpan mobil dari katalog untuk membandingkannya nanti.'}
          action={!wishlistIds.length && (
            <AppLink className="button button-primary" to="/" navigate={navigate}>Jelajahi katalog</AppLink>
          )}
        />
      )}
      {!loading && !error && cars.length > 0 && (
        <div className="car-grid">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              navigate={navigate}
              isSaved
              onToggleSaved={toggleWishlist}
            />
          ))}
        </div>
      )}
    </main>
  )
}
