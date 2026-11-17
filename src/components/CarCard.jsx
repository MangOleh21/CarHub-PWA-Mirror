import { Heart, MapPin } from 'lucide-react'
import { useState } from 'react'
import { formatMileage, formatPrice } from '../lib/format.js'
import AppLink from './AppLink.jsx'

export default function CarCard({ car, navigate, isSaved, onToggleSaved }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article className="car-card">
      <AppLink className="car-card-link" to={`/cars/${car.id}`} navigate={navigate}>
        <div className="car-image-wrap">
          {!imageFailed && (
            <img
              className="car-image"
              src={car.imageUrl}
              alt={`${car.brand} ${car.model}`}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          )}
          {imageFailed && <div className="car-image-fallback" aria-hidden="true">CarHub</div>}
          <span className="car-year">{car.year} · {car.transmission}</span>
        </div>
        <div className="car-card-content">
          <h2>{car.brand} {car.model}</h2>
          <p className="car-meta">
            <span>{formatMileage(car.mileage)}</span>
            <span><MapPin size={14} aria-hidden="true" /> {car.location || 'Lokasi belum tersedia'}</span>
          </p>
          <p className="car-price">{formatPrice(car.price)}</p>
        </div>
      </AppLink>
      <button
        className={`favorite-button${isSaved ? ' is-saved' : ''}`}
        type="button"
        aria-label={isSaved ? `Hapus ${car.brand} ${car.model} dari favorit` : `Simpan ${car.brand} ${car.model} ke favorit`}
        aria-pressed={isSaved}
        onClick={() => onToggleSaved(car.id)}
      >
        <Heart size={19} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </article>
  )
}
