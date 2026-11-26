import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import ImageGallery from './ImageGallery.jsx'
import { formatMileage, formatPrice } from '../lib/format.js'

export default function AdminCarDetailsDialog({ car, archived, onClose }) {
  const dialogRef = useRef(null)
  const ignoredCloseEvents = useRef(0)
  const titleId = useId()

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

  return (
    <dialog
      className="admin-car-details-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
    >
      <header className="admin-gallery-dialog-header admin-car-details-header">
        <div>
          <p className="eyebrow">{archived ? 'ARSIP MOBIL' : 'DETAIL KATALOG'}</p>
          <h2 id={titleId}>{car.brand} {car.model}</h2>
        </div>
        <button
          className="button button-quiet admin-gallery-close"
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={`Tutup detail ${car.brand} ${car.model}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="admin-car-details-content">
        <ImageGallery
          images={car.images?.length ? car.images : [car.imageUrl]}
          alt={`Foto ${car.brand} ${car.model}`}
          label={`Foto ${car.brand} ${car.model}`}
          className="admin-car-details-gallery"
        />
        <p className="admin-car-details-price">{formatPrice(car.price)}</p>
        <dl className="admin-car-details-specs">
          <div><dt>Tahun</dt><dd>{car.year}</dd></div>
          <div><dt>Jarak tempuh</dt><dd>{formatMileage(car.mileage)}</dd></div>
          <div><dt>Transmisi</dt><dd>{car.transmission}</dd></div>
          <div><dt>Bahan bakar</dt><dd>{car.fuelType || 'Belum tersedia'}</dd></div>
          <div><dt>Lokasi</dt><dd>{car.location || 'Belum tersedia'}</dd></div>
          <div><dt>Penjual</dt><dd>{car.sellerName}</dd></div>
          <div><dt>WhatsApp</dt><dd>{car.sellerPhone}</dd></div>
          {car.createdAt && (
            <div>
              <dt>Ditambahkan</dt>
              <dd><time dateTime={car.createdAt}>{new Date(car.createdAt).toLocaleString('id-ID')}</time></dd>
            </div>
          )}
        </dl>
        <section className="admin-car-details-description">
          <h3>Deskripsi</h3>
          <p>{car.description || 'Belum ada deskripsi.'}</p>
        </section>
      </div>
    </dialog>
  )
}
