/**
 * Frontend API client for image operations
 * All calls go through the backend server which handles GCS
 */

export interface Image {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  gcsPath: string
  gcsUrl: string
  thumbnailPath: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
  jobs?: Job[]
  viz2dFiles?: Viz2dFile[]
}

export interface Job {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  imageId: string
  inputGcsUrl: string
  viz2dJobId: string | null
  outputUrl: string | null
  failReason: string | null
  viz2dFileId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  image?: Image
  viz2dFile?: Viz2dFile
}

export interface Viz2dFile {
  id: string
  filename: string
  gcsPath: string
  gcsUrl: string
  fileSize: number
  imageId: string
  createdAt: string
  updatedAt: string
  image?: Image
  job?: Job
}

export interface ApiError extends Error {
  status?: number
  code?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = new Error(`API request failed: ${response.statusText}`)
    error.status = response.status
    try {
      const errorData = await response.json()
      error.message = errorData.error || error.message
      error.code = errorData.code
    } catch {
      // Response wasn't JSON
    }
    throw error
  }
  return response.json()
}

/**
 * Get a signed URL for uploading an image to GCS
 */
export async function getImageUploadUrl(
  filename: string,
  mimeType: string
): Promise<{ imageId: string; uploadUrl: string; gcsPath: string }> {
  const response = await fetch('/api/v1/images/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, mimeType }),
  })
  return handleResponse(response)
}

/**
 * Upload a file directly to GCS using the signed URL
 */
export async function uploadToGcs(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'))
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Confirm an image upload after the file has been uploaded to GCS
 */
export async function confirmImageUpload(imageId: string): Promise<Image> {
  const response = await fetch('/api/v1/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId }),
  })
  return handleResponse(response)
}

/**
 * Upload an image (full workflow: get URL, upload to GCS, confirm)
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Image> {
  // Step 1: Get signed upload URL
  const { imageId, uploadUrl } = await getImageUploadUrl(file.name, file.type)

  // Step 2: Upload directly to GCS
  await uploadToGcs(uploadUrl, file, onProgress)

  // Step 3: Confirm upload
  const image = await confirmImageUpload(imageId)

  return image
}

/**
 * Get an image by ID
 */
export async function getImage(imageId: string): Promise<Image> {
  const response = await fetch(`/api/v1/images/${imageId}`)
  return handleResponse(response)
}

/**
 * List all images
 */
export async function listImages(options?: {
  limit?: number
  offset?: number
}): Promise<{ images: Image[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.offset) params.set('offset', options.offset.toString())

  const url = `/api/v1/images${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)
  return handleResponse(response)
}

/**
 * Delete an image
 */
export async function deleteImage(imageId: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`/api/v1/images/${imageId}`, {
    method: 'DELETE',
  })
  return handleResponse(response)
}
