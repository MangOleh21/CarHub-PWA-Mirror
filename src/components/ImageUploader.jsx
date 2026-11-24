import { CloudUpload, X } from 'lucide-react'
import { useState } from 'react'
import ImagePreview from './ImagePreview.jsx'
import { maxImageCount } from '../lib/image-upload.js'

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUploader({
  id,
  images = [],
  selections = [],
  imageUrl,
  alt,
  error,
  disabled,
  uploading,
  inputRef,
  onSelectFiles,
  onRemoveImage,
  onRemoveSelection,
  onClearImageUrl,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const savedCount = images.length
  const urlCount = imageUrl && !images.includes(imageUrl) ? 1 : 0
  const totalCount = savedCount + selections.length + urlCount
  const previews = [
    ...images.map((src, index) => ({
      key: `saved-${index}-${src}`,
      src,
      title: `Foto tersimpan ${index + 1}`,
      detail: 'Foto listing',
      onRemove: () => onRemoveImage?.(index),
    })),
    ...selections.map((selection, index) => ({
      key: `selection-${index}-${selection.file.name}`,
      src: selection.previewUrl,
      title: selection.file.name,
      detail: `${formatFileSize(selection.file.size)} · ${uploading ? 'Mengunggah foto…' : 'Siap diunggah'}`,
      onRemove: () => onRemoveSelection?.(index),
      uploading,
    })),
    ...(imageUrl && !images.includes(imageUrl) ? [{
      key: 'url-preview',
      src: imageUrl,
      title: 'Pratinjau dari URL',
      detail: 'Foto dari URL HTTPS',
      onRemove: onClearImageUrl,
    }] : []),
  ]

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
    if (droppedFiles?.length) onSelectFiles(droppedFiles, savedCount + urlCount)
  }

  return (
    <div className="form-field image-file-field" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`}>
        Foto mobil ({totalCount}/{maxImageCount})
        <small>JPG, PNG, atau WebP · Maks. 5 MB per foto · Hingga {maxImageCount} foto</small>
      </span>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled}
        onChange={(event) => {
          onSelectFiles(event.target.files, savedCount + urlCount)
          event.target.value = ''
        }}
      />
      <div
        className={`image-upload-dropzone${isDragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUpload size={24} aria-hidden="true" />
        <strong>{isDragging ? 'Lepaskan foto untuk memilih' : 'Tarik foto ke sini'}</strong>
        <p>atau pilih beberapa foto dari perangkat</p>
        <button
          className="button button-outline image-select-button"
          type="button"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => inputRef.current?.click()}
        >
          Pilih foto
        </button>
      </div>
      {error && <small className="field-error" id={`${id}-error`} role="alert">{error}</small>}
      {previews.length > 0 && (
        <div className="image-upload-files">
          {previews.map((preview, index) => (
            <div className="image-upload-file" key={preview.key}>
              <ImagePreview src={preview.src} alt={`${alt}, foto ${index + 1}`} />
              <div className="image-upload-file-info" aria-live="polite">
                <strong title={preview.title}>{preview.title}</strong>
                <small>{preview.detail}</small>
                {preview.uploading && <progress className="image-upload-progress" aria-label="Mengunggah foto" />}
              </div>
              <button
                className="image-upload-remove"
                type="button"
                aria-label={`Hapus ${preview.title}`}
                disabled={disabled}
                onClick={preview.onRemove}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
