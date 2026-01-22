import { useState, useCallback } from 'react'
import { uploadImage, type Image } from '@/lib/api/images-api'

interface UseImageUploadReturn {
  upload: (file: File) => Promise<Image>
  uploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<Image> => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const image = await uploadImage(file, (p) => setProgress(p))
      return image
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  }
}
