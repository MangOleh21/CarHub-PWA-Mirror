import { useId, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageGallery({ images = [], alt, label, className = '' }) {
  const imageKey = images.join('\n')
  const imageId = useId()
  const [galleryState, setGalleryState] = useState({
    key: imageKey,
    activeIndex: 0,
    failedSrc: null,
  })

  if (images.length === 0) {
    return <div className={`image-gallery image-gallery-empty ${className}`}>Foto belum tersedia</div>
  }

  const currentState = galleryState.key === imageKey
    ? galleryState
    : { key: imageKey, activeIndex: 0, failedSrc: null }
  const currentIndex = Math.min(currentState.activeIndex, images.length - 1)

  function showPrevious() {
    setGalleryState({
      key: imageKey,
      activeIndex: (currentIndex - 1 + images.length) % images.length,
      failedSrc: currentState.failedSrc,
    })
  }

  function showNext() {
    setGalleryState({
      key: imageKey,
      activeIndex: (currentIndex + 1) % images.length,
      failedSrc: currentState.failedSrc,
    })
  }

  return (
    <div className={`image-gallery ${className}`.trim()} role="group" aria-roledescription="carousel" aria-label={label}>
      {currentState.failedSrc === images[currentIndex] ? (
        <div id={imageId} className="car-image-fallback" role="status">Foto tidak dapat dimuat</div>
      ) : (
        <img
          id={imageId}
          src={images[currentIndex]}
          alt={alt}
          onError={() => setGalleryState({
            key: imageKey,
            activeIndex: currentIndex,
            failedSrc: images[currentIndex],
          })}
        />
      )}
      {images.length > 1 && (
        <>
          <button
            className="image-gallery-control image-gallery-previous"
            type="button"
            aria-label="Foto sebelumnya"
            aria-controls={imageId}
            onClick={showPrevious}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            className="image-gallery-control image-gallery-next"
            type="button"
            aria-label="Foto berikutnya"
            aria-controls={imageId}
            onClick={showNext}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <span className="image-gallery-count" aria-live="polite" aria-atomic="true">
            Foto {currentIndex + 1} dari {images.length}
          </span>
        </>
      )}
    </div>
  )
}
