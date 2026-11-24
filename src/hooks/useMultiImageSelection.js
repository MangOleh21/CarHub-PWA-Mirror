import { useEffect, useRef, useState } from 'react'
import { getImageFileError } from '../lib/image-upload.js'

export function useMultiImageSelection() {
  const [selections, setSelections] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    return () => {
      selections.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [selections])

  function addFiles(files) {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    const newItems = []
    let firstError = null

    for (const file of fileArray) {
      const err = getImageFileError(file)
      if (err) {
        if (!firstError) firstError = `${file.name}: ${err}`
        continue
      }
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (firstError) {
      setError(firstError)
    } else {
      setError(null)
    }

    if (newItems.length > 0) {
      setSelections((current) => [...current, ...newItems].slice(0, 10))
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  function removeFile(id) {
    setSelections((current) => {
      const target = current.find((item) => item.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return current.filter((item) => item.id !== id)
    })
    setError(null)
  }

  function clearFiles() {
    selections.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setSelections([])
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return { selections, error, inputRef, addFiles, removeFile, clearFiles }
}
