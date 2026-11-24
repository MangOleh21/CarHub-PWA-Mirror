import { useEffect, useRef, useState } from 'react'
import { getImageFilesError } from '../lib/image-upload.js'

export function useImageFileSelection() {
  const [selections, setSelections] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const selectionsRef = useRef([])

  useEffect(() => {
    return () => {
      selectionsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
    }
  }, [])

  function selectFiles(files, existingCount = 0) {
    const incomingFiles = Array.from(files ?? [])
    if (incomingFiles.length === 0) return

    const currentSelections = selectionsRef.current
    const validationError = getImageFilesError(
      [...currentSelections.map(({ file }) => file), ...incomingFiles],
      existingCount,
    )
    if (validationError) {
      setError(validationError)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const nextSelections = [
      ...currentSelections,
      ...incomingFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]
    selectionsRef.current = nextSelections
    setSelections(nextSelections)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeSelection(index) {
    const currentSelections = selectionsRef.current
    const removed = currentSelections[index]
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    const nextSelections = currentSelections.filter((_, position) => position !== index)
    selectionsRef.current = nextSelections
    setSelections(nextSelections)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function clearSelections() {
    selectionsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
    selectionsRef.current = []
    setSelections([])
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function clearError() {
    setError(null)
  }

  return {
    selections,
    error,
    inputRef,
    selectFiles,
    removeSelection,
    clearSelections,
    clearError,
  }
}
