import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImages } from '@/hooks/useImages'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useJob } from '@/hooks/useJob'
import { downloadViz2dAsFile } from '@/lib/api/jobs-api'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Loader2,
  Play,
  Check,
  X,
  Trash2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import type { Image } from '@/lib/api/images-api'

export default function GalleryPage() {
  const navigate = useNavigate()
  const { images, loading, error, refresh, remove, hasMore, loadMore } = useImages()
  const { upload, uploading, progress, error: uploadError } = useImageUpload()
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const { job, startJob, loading: jobLoading, error: jobError } = useJob()

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        await upload(file)
        await refresh()
      } catch {
        // Error is already captured in uploadError
      }
    },
    [upload, refresh]
  )

  const handleProcess = useCallback(
    async (image: Image) => {
      setSelectedImage(image)
      try {
        await startJob(image.id)
      } catch {
        // Error is captured in jobError
      }
    },
    [startJob]
  )

  const handleOpenVisualizer = useCallback(
    async (image: Image) => {
      // Get the latest viz2d file for this image
      const viz2dFile = image.viz2dFiles?.[0]
      if (!viz2dFile) return

      try {
        // Download and convert to File
        const file = await downloadViz2dAsFile(viz2dFile.id)

        // Navigate to visualizer with the file in state
        navigate('/', { state: { file } })
      } catch (err) {
        console.error('Failed to open visualizer:', err)
      }
    },
    [navigate]
  )

  const handleDelete = useCallback(
    async (image: Image) => {
      if (!confirm(`Delete "${image.originalName}"?`)) return
      try {
        await remove(image.id)
      } catch {
        // Error is captured in hook
      }
    },
    [remove]
  )

  const getImageStatus = (image: Image) => {
    const latestJob = image.jobs?.[0]
    if (!latestJob) return 'ready'
    return latestJob.status.toLowerCase()
  }

  const canProcess = (image: Image) => {
    const latestJob = image.jobs?.[0]
    return !latestJob || latestJob.status === 'FAILED'
  }

  const hasViz2d = (image: Image) => {
    return (image.viz2dFiles?.length ?? 0) > 0
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Image Gallery</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <label>
              <Button asChild variant="default" size="sm" disabled={uploading}>
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {progress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </header>

      {/* Error messages */}
      {(error || uploadError || jobError) && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-200">
            {error || uploadError || jobError}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {images.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-zinc-500 mb-4">No images uploaded yet</div>
            <label>
              <Button asChild variant="outline">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload your first image
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        ) : (
          <>
            {/* Image grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => {
                const status = getImageStatus(image)
                const isSelected = selectedImage?.id === image.id
                const isProcessing = isSelected && (job?.status === 'PENDING' || job?.status === 'PROCESSING')

                return (
                  <div
                    key={image.id}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    {/* Image preview */}
                    <div className="aspect-video bg-zinc-800 relative">
                      <img
                        src={image.gcsUrl}
                        alt={image.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        {status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-900/80 text-yellow-200 text-xs rounded">
                            Pending
                          </span>
                        )}
                        {status === 'processing' && (
                          <span className="px-2 py-1 bg-blue-900/80 text-blue-200 text-xs rounded flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        )}
                        {status === 'completed' && (
                          <span className="px-2 py-1 bg-green-900/80 text-green-200 text-xs rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                        {status === 'failed' && (
                          <span className="px-2 py-1 bg-red-900/80 text-red-200 text-xs rounded flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info and actions */}
                    <div className="p-3">
                      <div className="text-sm font-medium truncate mb-2" title={image.originalName}>
                        {image.originalName}
                      </div>
                      <div className="text-xs text-zinc-500 mb-3">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2">
                        {hasViz2d(image) ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => handleOpenVisualizer(image)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                        ) : canProcess(image) ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => handleProcess(image)}
                            disabled={isProcessing || jobLoading}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Processing
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Process
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" className="flex-1" disabled>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(image)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-6">
                <Button variant="outline" onClick={loadMore} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
