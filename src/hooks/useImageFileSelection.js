import { useEffect, useRef, useState } from 'react'
import { getImageFileError } from '../lib/image-upload.js'

export function useImageFileSelection() {
  const [selection, setSelection] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const previewUrl = selection?.previewUrl
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [selection?.previewUrl])

  function selectFile(file) {
    const validationError = file ? getImageFileError(file) : null
    if (validationError) {
      setSelection(null)
      setError(validationError)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (!file) {
      setSelection(null)
      setError(null)
      return
    }

    setSelection({ file, previewUrl: URL.createObjectURL(file) })
    setError(null)
  }

  function clearSelection() {
    setSelection(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return { selection, error, inputRef, selectFile, clearSelection }
}
