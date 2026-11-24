import { CloudUpload, Image as ImageIcon, X } from 'lucide-react'
import { useState } from 'react'

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function MultiImageUploader({
  id,
  selections = [],
  existingUrls = [],
  onRemoveExistingUrl,
  error,
  disabled,
  uploading,
  inputRef,
  onAddFiles,
  onRemoveFile,
  maxFiles = 10,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const totalCount = selections.length + existingUrls.length

  function handleDragOver(event) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const droppedFiles = event.dataTransfer?.files
    if (droppedFiles && droppedFiles.length > 0) onAddFiles(droppedFiles)
  }

  return (
    <div className="form-field image-file-field" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`}>
        Unggah foto mobil <small>(Dapat memilih beberapa foto · Maks. {maxFiles} foto · JPG, PNG, WebP hingga 5 MB)</small>
      </span>

      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled || totalCount >= maxFiles}
        onChange={(event) => {
          if (event.target.files) onAddFiles(event.target.files)
        }}
      />

      <div
        className={`image-upload-dropzone${isDragging ? ' is-dragging' : ''}${disabled || totalCount >= maxFiles ? ' is-disabled' : ''}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUpload size={24} aria-hidden="true" />
        <strong>{isDragging ? 'Lepaskan foto untuk memilih' : 'Tarik foto ke sini'}</strong>
        <p>atau klik tombol untuk memilih hingga {maxFiles} foto sekaligus</p>
        <button
          className="button button-outline image-select-button"
          type="button"
          disabled={disabled || totalCount >= maxFiles}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon size={16} aria-hidden="true" /> Pilih foto ({totalCount}/{maxFiles})
        </button>
      </div>

      {error && <small className="field-error" id={`${id}-error`} role="alert">{error}</small>}

      {totalCount > 0 && (
        <div className="multi-image-preview-section">
          <p className="preview-heading">
            <strong>Pratinjau foto ({totalCount} foto)</strong>
            {uploading && <span className="uploading-badge">Mengunggah foto…</span>}
          </p>

          <div className="multi-image-grid">
            {existingUrls.map((url, index) => (
              <div className="multi-image-card" key={`existing-${url}-${index}`}>
                <img src={url} alt={`Foto tersimpan ${index + 1}`} loading="lazy" />
                <span className="image-card-badge">Tersimpan</span>
                {onRemoveExistingUrl && (
                  <button
                    className="image-card-remove"
                    type="button"
                    disabled={disabled || uploading}
                    aria-label={`Hapus foto tersimpan ${index + 1}`}
                    onClick={() => onRemoveExistingUrl(index)}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}

            {selections.map((item) => (
              <div className="multi-image-card is-new" key={item.id}>
                <img src={item.previewUrl} alt={item.file.name} />
                <span className="image-card-badge is-new">Baru ({formatFileSize(item.file.size)})</span>
                <button
                  className="image-card-remove"
                  type="button"
                  disabled={disabled || uploading}
                  aria-label={`Hapus foto ${item.file.name}`}
                  onClick={() => onRemoveFile(item.id)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
