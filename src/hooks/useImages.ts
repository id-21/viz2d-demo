import { useState, useCallback, useEffect } from 'react'
import { listImages, deleteImage, type Image } from '@/lib/api/images-api'

interface UseImagesReturn {
  images: Image[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  remove: (imageId: string) => Promise<void>
  hasMore: boolean
}

const PAGE_SIZE = 20

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<Image[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = useCallback(async (resetOffset = true) => {
    setLoading(true)
    setError(null)

    try {
      const currentOffset = resetOffset ? 0 : offset
      const result = await listImages({ limit: PAGE_SIZE, offset: currentOffset })

      if (resetOffset) {
        setImages(result.images)
        setOffset(PAGE_SIZE)
      } else {
        setImages((prev) => [...prev, ...result.images])
        setOffset((prev) => prev + PAGE_SIZE)
      }
      setTotal(result.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load images'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [offset])

  // Load images on mount
  useEffect(() => {
    fetchImages(true)
  }, [])

  const refresh = useCallback(async () => {
    await fetchImages(true)
  }, [fetchImages])

  const loadMore = useCallback(async () => {
    if (!loading && images.length < total) {
      await fetchImages(false)
    }
  }, [fetchImages, loading, images.length, total])

  const remove = useCallback(async (imageId: string) => {
    try {
      await deleteImage(imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      setTotal((prev) => prev - 1)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image'
      setError(message)
      throw err
    }
  }, [])

  return {
    images,
    total,
    loading,
    error,
    refresh,
    loadMore,
    remove,
    hasMore: images.length < total,
  }
}
