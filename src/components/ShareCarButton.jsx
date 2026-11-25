import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { buildCarShareDetails, shareLink } from '../lib/share.js'

export default function ShareCarButton({ car }) {
  const [feedback, setFeedback] = useState(null)

  async function shareCar() {
    setFeedback(null)
    const details = buildCarShareDetails(car, window.location.origin)
    const share = typeof navigator.share === 'function'
      ? navigator.share.bind(navigator)
      : undefined
    const writeClipboard = typeof navigator.clipboard?.writeText === 'function'
      ? navigator.clipboard.writeText.bind(navigator.clipboard)
      : undefined

    try {
      const result = await shareLink({ ...details, share, writeClipboard })
      if (result === 'shared') setFeedback({ type: 'status', message: 'Mobil berhasil dibagikan.' })
      if (result === 'copied') setFeedback({ type: 'status', message: 'Tautan mobil disalin.' })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Tautan tidak dapat dibagikan atau disalin. Salin alamat halaman secara manual.',
      })
    }
  }

  return (
    <div className="car-share">
      <button className="button button-outline" type="button" onClick={shareCar}>
        <Share2 size={16} aria-hidden="true" /> Bagikan mobil ini
      </button>
      {feedback && (
        <p className="car-share-feedback" role={feedback.type} aria-live="polite">
          {feedback.message}
        </p>
      )}
    </div>
  )
}