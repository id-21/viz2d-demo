/**
 * Frontend API client for Viz2D job operations
 * All calls go through the backend server which proxies to Viz2D API
 */

import type { Job, Viz2dFile } from './images-api'

export type { Job, Viz2dFile }

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
 * Create a new Viz2D processing job
 */
export async function createJob(imageId: string): Promise<Job> {
  const response = await fetch('/api/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId }),
  })
  return handleResponse(response)
}

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<Job> {
  const response = await fetch(`/api/v1/jobs/${jobId}`)
  return handleResponse(response)
}

/**
 * Manually sync job status with Viz2D API
 */
export async function syncJob(jobId: string): Promise<Job> {
  const response = await fetch(`/api/v1/jobs/${jobId}/sync`, {
    method: 'POST',
  })
  return handleResponse(response)
}

/**
 * List jobs for an image
 */
export async function listJobsForImage(imageId: string): Promise<Job[]> {
  const response = await fetch(`/api/v1/jobs/image/${imageId}`)
  return handleResponse(response)
}

/**
 * Subscribe to job updates via SSE
 */
export function subscribeToJobUpdates(
  jobId: string,
  onUpdate: (job: Job) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`/api/v1/jobs/${jobId}/stream`)

  eventSource.onmessage = (event) => {
    try {
      const job = JSON.parse(event.data) as Job
      onUpdate(job)

      // Close if terminal state
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        eventSource.close()
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error)
    }
  }

  eventSource.onerror = (event) => {
    console.error('SSE error:', event)
    eventSource.close()
    onError?.(new Error('Connection to job updates lost'))
  }

  // Return cleanup function
  return () => {
    eventSource.close()
  }
}

/**
 * Get viz2d file info
 */
export async function getViz2dFile(viz2dFileId: string): Promise<Viz2dFile> {
  const response = await fetch(`/api/v1/viz2d/${viz2dFileId}`)
  return handleResponse(response)
}

/**
 * Get signed download URL for viz2d file
 */
export async function getViz2dDownloadUrl(
  viz2dFileId: string
): Promise<{ file: Viz2dFile; downloadUrl: string }> {
  const response = await fetch(`/api/v1/viz2d/${viz2dFileId}/download-url`)
  return handleResponse(response)
}

/**
 * List viz2d files for an image
 */
export async function listViz2dFilesForImage(imageId: string): Promise<Viz2dFile[]> {
  const response = await fetch(`/api/v1/viz2d/image/${imageId}`)
  return handleResponse(response)
}

/**
 * Get the latest viz2d file for an image
 */
export async function getLatestViz2dFile(imageId: string): Promise<Viz2dFile | null> {
  const response = await fetch(`/api/v1/viz2d/image/${imageId}/latest`)
  if (response.status === 404) {
    return null
  }
  return handleResponse(response)
}

/**
 * Download a viz2d file and return as Blob
 */
export async function downloadViz2dFile(viz2dFileId: string): Promise<Blob> {
  const { downloadUrl } = await getViz2dDownloadUrl(viz2dFileId)
  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download viz2d file: ${response.statusText}`)
  }
  return response.blob()
}

/**
 * Download a viz2d file and convert to File object for use with visualizer
 */
export async function downloadViz2dAsFile(
  viz2dFileId: string,
  filename?: string
): Promise<File> {
  const { file, downloadUrl } = await getViz2dDownloadUrl(viz2dFileId)
  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download viz2d file: ${response.statusText}`)
  }
  const blob = await response.blob()
  return new File([blob], filename || file.filename, { type: 'application/octet-stream' })
}
