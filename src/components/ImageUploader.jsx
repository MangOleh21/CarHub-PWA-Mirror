import { CloudUpload, X } from 'lucide-react'
import { useState } from 'react'
import ImagePreview from './ImagePreview.jsx'

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUploader({
  id,
  selection,
  imageUrl,
  alt,
  error,
  disabled,
  uploading,
  inputRef,
  onSelectFile,
  onRemove,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const file = selection?.file
  const previewUrl = selection?.previewUrl || imageUrl

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
    const droppedFile = event.dataTransfer?.files?.[0]
    if (droppedFile) onSelectFile(droppedFile)
  }

  return (
    <div className="form-field image-file-field" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`}>
        Unggah foto
        <small>JPG, PNG, atau WebP · Maks. 5 MB</small>
      </span>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={disabled}
        onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
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
        <p>atau pilih dari perangkat</p>
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
      {previewUrl && (
        <div className="image-upload-file">
          <ImagePreview src={previewUrl} alt={alt} />
          <div className="image-upload-file-info" aria-live="polite">
            <strong title={file?.name ?? 'Pratinjau foto'}>{file?.name ?? 'Pratinjau foto'}</strong>
            <small>{file ? `${formatFileSize(file.size)} · ${uploading ? 'Mengunggah foto…' : 'Siap diunggah'}` : 'Foto dari URL atau listing saat ini'}</small>
            {uploading && <progress className="image-upload-progress" aria-label="Mengunggah foto" />}
          </div>
          {file && (
            <button
              className="image-upload-remove"
              type="button"
              aria-label={`Hapus foto ${file.name}`}
              disabled={disabled}
              onClick={onRemove}
            >
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
