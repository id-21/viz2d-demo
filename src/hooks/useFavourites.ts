import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'viz2d-texture-favourites'

interface UseFavouritesReturn {
  favourites: Set<number>
  isFavourite: (id: number) => boolean
  toggleFavourite: (id: number) => void
  favouriteCount: number
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return new Set(Array.isArray(parsed) ? parsed : [])
      }
    } catch (e) {
      console.warn('Failed to parse favourites from localStorage:', e)
    }
    return new Set()
  })

  // Persist to localStorage whenever favourites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favourites]))
    } catch (e) {
      console.warn('Failed to save favourites to localStorage:', e)
    }
  }, [favourites])

  const isFavourite = useCallback(
    (id: number) => favourites.has(id),
    [favourites]
  )

  const toggleFavourite = useCallback((id: number) => {
    setFavourites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return {
    favourites,
    isFavourite,
    toggleFavourite,
    favouriteCount: favourites.size,
  }
}
