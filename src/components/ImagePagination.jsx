import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function ImagePagination({ images = [], alt = 'Foto kendaraan', label = null }) {
  const imageList = Array.isArray(images) && images.length > 0 ? images : []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedImages, setFailedImages] = useState({})

  if (imageList.length === 0) {
    return (
      <div className="detail-image-wrap">
        <div className="car-image-fallback" aria-hidden="true">CarHub</div>
        {label && <span className="detail-image-label">{label}</span>}
      </div>
    )
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), imageList.length - 1)
  const currentUrl = imageList[safeIndex]
  const isFailed = Boolean(failedImages[currentUrl])

  function prevImage(e) {
    e?.preventDefault()
    e?.stopPropagation()
    setCurrentIndex((current) => (current === 0 ? imageList.length - 1 : current - 1))
  }

  function nextImage(e) {
    e?.preventDefault()
    e?.stopPropagation()
    setCurrentIndex((current) => (current === imageList.length - 1 ? 0 : current + 1))
  }

  function selectImage(index, e) {
    e?.preventDefault()
    e?.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div className="image-pagination-container">
      <div className="detail-image-wrap">
        {!isFailed ? (
          <img
            src={currentUrl}
            alt={`${alt} (Foto ${safeIndex + 1} dari ${imageList.length})`}
            onError={() => setFailedImages((prev) => ({ ...prev, [currentUrl]: true }))}
          />
        ) : (
          <div className="car-image-fallback" aria-hidden="true">CarHub</div>
        )}

        {label && <span className="detail-image-label">{label}</span>}

        {imageList.length > 1 && (
          <>
            <span className="image-pagination-badge" aria-live="polite">
              {safeIndex + 1} / {imageList.length}
            </span>
            <button
              className="image-nav-button image-nav-prev"
              type="button"
              onClick={prevImage}
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              className="image-nav-button image-nav-next"
              type="button"
              onClick={nextImage}
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {imageList.length > 1 && (
        <div className="image-thumbnail-strip" role="tablist" aria-label="Pilih foto kendaraan">
          {imageList.map((url, index) => (
            <button
              key={`${url}-${index}`}
              className={`image-thumbnail-btn${index === safeIndex ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={index === safeIndex}
              aria-label={`Lihat foto ${index + 1}`}
              onClick={(e) => selectImage(index, e)}
            >
              <img src={url} alt="" aria-hidden="true" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
