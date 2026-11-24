import { ArrowLeft, Fuel, Gauge, Heart, MapPin, MessageCircle, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppLink from '../components/AppLink.jsx'
import { ErrorState, LoadingState } from '../components/Feedback.jsx'
import ImagePagination from '../components/ImagePagination.jsx'
import { formatMileage, formatPrice, whatsappUrl } from '../lib/format.js'
import { getCar } from '../services/api.js'

export default function CarDetailPage({ id, navigate, wishlistIds, toggleWishlist }) {
  const [response, setResponse] = useState({ id: null, car: null, error: null })

  useEffect(() => {
    let active = true
    getCar(id)
      .then((data) => { if (active) setResponse({ id, car: data, error: null }) })
      .catch((cause) => { if (active) setResponse({ id, car: null, error: cause.message }) })
    return () => { active = false }
  }, [id])

  const loading = response.id !== id
  const car = response.id === id ? response.car : null
  const error = response.id === id ? response.error : null

  if (loading) return <main className="page-content"><LoadingState label="Memuat detail mobil" /></main>
  if (error) {
    return (
      <main className="page-content">
        <AppLink className="back-link" to="/" navigate={navigate}><ArrowLeft size={17} /> Kembali ke katalog</AppLink>
        <ErrorState message={error} />
      </main>
    )
  }

  const saved = wishlistIds.includes(car.id)
  const contactLink = buildContactLink(car)
  const carImages = Array.isArray(car.images) && car.images.length > 0
    ? car.images
    : (car.imageUrl ? [car.imageUrl] : [])

  return (
    <main className="page-content detail-page">
      <AppLink className="back-link" to="/" navigate={navigate}><ArrowLeft size={17} /> Kembali ke katalog</AppLink>

      <ImagePagination
        images={carImages}
        alt={`${car.brand} ${car.model}`}
        label={`${car.year} · ${car.transmission}`}
      />

      <section className="detail-heading">
        <div>
          <p className="eyebrow">{car.brand.toUpperCase()} · {car.year}</p>
          <h1>{car.brand} <em>{car.model}</em></h1>
          <p className="detail-location"><MapPin size={16} aria-hidden="true" /> {car.location || 'Lokasi belum tersedia'}</p>
        </div>
        <button
          className={`favorite-button detail-favorite${saved ? ' is-saved' : ''}`}
          type="button"
          aria-label={saved ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          aria-pressed={saved}
          onClick={() => toggleWishlist(car.id)}
        >
          <Heart size={20} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </section>

      <p className="detail-price">{formatPrice(car.price)}</p>

      <section className="spec-grid" aria-label="Spesifikasi kendaraan">
        <div className="spec-item"><span><Gauge size={15} /> Jarak tempuh</span><strong>{formatMileage(car.mileage)}</strong></div>
        <div className="spec-item"><span><Settings2 size={15} /> Transmisi</span><strong>{car.transmission}</strong></div>
        <div className="spec-item"><span><Fuel size={15} /> Bahan bakar</span><strong>{car.fuelType || 'Belum tersedia'}</strong></div>
        <div className="spec-item"><span>Penjual</span><strong>{car.sellerName}</strong></div>
      </section>

      <section className="detail-description">
        <p className="eyebrow">TENTANG MOBIL</p>
        <h2>Catatan penjual</h2>
        <p>{car.description || 'Penjual belum menambahkan deskripsi untuk mobil ini.'}</p>
      </section>

      <section className="seller-strip">
        <div className="seller-avatar" aria-hidden="true">{car.sellerName.slice(0, 1).toUpperCase()}</div>
        <div><p className="eyebrow">DIJUAL OLEH</p><strong>{car.sellerName}</strong></div>
      </section>

      {contactLink ? (
        <a className="button button-whatsapp contact-button" href={contactLink} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={19} aria-hidden="true" /> Hubungi penjual via WhatsApp
        </a>
      ) : (
        <p className="notice notice-error" role="status">Nomor WhatsApp penjual belum dapat digunakan.</p>
      )}
    </main>
  )
}

function buildContactLink(car) {
  try {
    return whatsappUrl(
      car.sellerPhone,
      `Halo ${car.sellerName}, saya tertarik dengan mobil ${car.brand} ${car.model} (${car.year}) yang diiklankan di CarHub seharga ${formatPrice(car.price)}. Apakah unit ini masih tersedia?`,
    )
  } catch {
    return null
  }
}
