import { useCallback, useState } from 'react'

const STORAGE_KEY = 'carhub.wishlist'

function readWishlist() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) return { ids: [], available: true }
    const ids = JSON.parse(stored)
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
      return { ids: [], available: false }
    }
    return { ids: [...new Set(ids)], available: true }
  } catch {
    return { ids: [], available: false }
  }
}

export default function useWishlist() {
  const [wishlist, setWishlist] = useState(readWishlist)

  const toggleWishlist = useCallback((id) => {
    setWishlist((current) => {
      const ids = current.ids.includes(id)
        ? current.ids.filter((savedId) => savedId !== id)
        : [...current.ids, id]
      let available = current.available
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
      } catch {
        available = false
      }
      return { ids, available }
    })
  }, [])

  return {
    wishlistIds: wishlist.ids,
    storageAvailable: wishlist.available,
    toggleWishlist,
  }
}
