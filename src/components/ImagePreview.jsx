import { useState } from 'react'

export default function ImagePreview({ src, alt }) {
  const [failedSrc, setFailedSrc] = useState(null)
  if (!src) return null

  return (
    <div className="image-preview">
      {failedSrc === src ? (
        <p role="status">Pratinjau foto tidak dapat dimuat.</p>
      ) : (
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} />
      )}
    </div>
  )
}
