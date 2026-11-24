import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppLink from '../components/AppLink.jsx'
import CarCard from '../components/CarCard.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx'
import { getCars } from '../services/api.js'

const FEATURED_CAR_LIMIT = 4

function LandingVisual({ car }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = car?.images?.[0] || car?.imageUrl

  return (
    <figure className="landing-visual">
      {imageUrl && !imageFailed ? (
        <img
          className="landing-visual-image"
          src={imageUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="landing-visual-fallback" aria-hidden="true">
          <span>CARHUB / KATALOG</span>
          <strong>Mobil bekas,<br /><em>lebih jelas.</em></strong>
        </div>
      )}
      <figcaption className="landing-visual-caption">
        <div>
          <p className="eyebrow">{car ? 'SOROTAN KATALOG' : 'CARHUB · MOBIL BEKAS'}</p>
          <span>{car ? 'Foto dari listing terbaru' : 'Pilihan mobil untuk langkah berikutnya'}</span>
        </div>
      </figcaption>
    </figure>
  )
}

export default function LandingPage({ navigate, wishlistIds, toggleWishlist }) {
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, cars: [], error: null })

  useEffect(() => {
    let active = true
    getCars({ page: 1, pageSize: FEATURED_CAR_LIMIT, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(({ data }) => {
        if (active) setResponse({ key: requestKey, cars: data, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, cars: [], error: cause.message })
      })
    return () => { active = false }
  }, [requestKey])

  const loading = response.key !== requestKey
  const cars = response.key === requestKey ? response.cars : []
  const error = response.key === requestKey ? response.error : null

  return (
    <main className="page-content landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="eyebrow">MARKETPLACE MOBIL BEKAS · INDONESIA</p>
          <h1 id="landing-title">Temukan mobil<br /><em>yang tepat.</em></h1>
          <p>
            Lihat pilihan mobil, pelajari detailnya, lalu hubungi penjual secara langsung.
            Semua tanpa perlu membuat akun pembeli.
          </p>
          <div className="landing-actions">
            <AppLink className="button button-primary" to="/catalog" navigate={navigate}>
              Jelajahi katalog <ArrowRight size={17} aria-hidden="true" />
            </AppLink>
            <AppLink className="button button-outline" to="/sell" navigate={navigate}>Jual mobil</AppLink>
          </div>
        </div>
        <LandingVisual key={cars[0]?.id || 'empty'} car={cars[0] || null} />
      </section>

      <section className="landing-proof" aria-label="Tentang pengalaman CarHub">
        <article>
          <p className="eyebrow">01 / INFORMASI</p>
          <h2>Detail sebelum menghubungi</h2>
          <p>Pelajari foto dan spesifikasi yang dicantumkan pada setiap listing.</p>
        </article>
        <article>
          <p className="eyebrow">02 / FAVORIT</p>
          <h2>Simpan pilihan Anda</h2>
          <p>Tandai mobil untuk dilihat kembali di daftar Favorit pada perangkat ini.</p>
        </article>
        <article>
          <p className="eyebrow">03 / KONTAK</p>
          <h2>Terhubung langsung</h2>
          <p>Tanyakan ketersediaan mobil kepada penjual melalui WhatsApp.</p>
        </article>
      </section>

      <section className="landing-section" aria-labelledby="latest-cars-heading">
        <div className="section-heading landing-section-heading">
          <div>
            <p className="eyebrow">BARU DI CARHUB</p>
            <h2 id="latest-cars-heading">Pilihan terbaru</h2>
          </div>
          <AppLink className="text-link" to="/catalog" navigate={navigate}>
            Lihat katalog <ArrowUpRight size={16} aria-hidden="true" />
          </AppLink>
        </div>
        {loading && <LoadingState label="Memuat pilihan terbaru" />}
        {!loading && error && (
          <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />
        )}
        {!loading && !error && cars.length === 0 && (
          <EmptyState
            title="Belum ada mobil di katalog"
            message="Kunjungi lagi nanti atau kirim pengajuan jika Anda ingin menjual mobil."
            action={(
              <AppLink className="button button-outline" to="/sell" navigate={navigate}>
                Ajukan mobil
              </AppLink>
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
                isSaved={wishlistIds.includes(car.id)}
                onToggleSaved={toggleWishlist}
              />
            ))}
          </div>
        )}
      </section>

      <section className="landing-section landing-how" aria-labelledby="how-it-works-heading">
        <div className="section-heading landing-section-heading">
          <div>
            <p className="eyebrow">LANGKAH SEDERHANA</p>
            <h2 id="how-it-works-heading">Mulai dari sini</h2>
          </div>
        </div>
        <div className="landing-steps">
          <article>
            <span>01</span>
            <h3>Jelajahi</h3>
            <p>Gunakan pencarian dan filter untuk menemukan mobil yang sesuai.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Simpan</h3>
            <p>Kumpulkan beberapa pilihan di daftar Favorit Anda.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Hubungi</h3>
            <p>Lanjutkan percakapan dengan penjual melalui WhatsApp.</p>
          </article>
        </div>
      </section>

      <section className="landing-sell" aria-labelledby="sell-car-heading">
        <div>
          <p className="eyebrow">UNTUK PENJUAL</p>
          <h2 id="sell-car-heading">Punya mobil untuk dijual?</h2>
          <p>Kirim informasi dan foto mobil Anda untuk ditinjau sebelum ditampilkan di katalog.</p>
        </div>
        <AppLink className="button button-primary" to="/sell" navigate={navigate}>
          Mulai pengajuan <ArrowRight size={17} aria-hidden="true" />
        </AppLink>
      </section>
    </main>
  )
}
