/**
 * Server-side Viz2D API client
 * This module keeps the visualizerId secret on the server
 */

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Viz2DJob {
  id: string
  status: JobStatus
  inputUrl: string
  outputUrl: string | null
  failReason: string | null
  createdAt: string
  updatedAt: string
}

function getConfig() {
  const apiUrl = process.env.VIZ2D_API_URL
  const visualizerId = process.env.VIZ2D_VISUALIZER_ID

  if (!apiUrl) {
    throw new Error('VIZ2D_API_URL environment variable is required')
  }
  if (!visualizerId) {
    throw new Error('VIZ2D_VISUALIZER_ID environment variable is required')
  }

  return { apiUrl, visualizerId }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Viz2D API request failed: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      // Response wasn't JSON, use default message
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

/**
 * Get a short-lived job token for creating jobs
 * The visualizerId is kept secret on the server
 */
export async function getJobToken(): Promise<string> {
  const { apiUrl, visualizerId } = getConfig()

  const response = await fetch(`${apiUrl}/v1/visualizers/${visualizerId}/job-token`)
  const token = await handleResponse<string>(response)
  return token
}

/**
 * Create a new processing job with the Viz2D API
 */
export async function createViz2dJob(token: string, inputUrl: string): Promise<Viz2DJob> {
  const { apiUrl } = getConfig()

  const response = await fetch(`${apiUrl}/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, inputUrl }),
  })

  return handleResponse<Viz2DJob>(response)
}

/**
 * Get job status by ID
 */
export async function getViz2dJobById(jobId: string): Promise<Viz2DJob> {
  const { apiUrl } = getConfig()

  const response = await fetch(`${apiUrl}/v1/jobs/${jobId}`)
  return handleResponse<Viz2DJob>(response)
}

/**
 * Download the output file from Viz2D API
 */
export async function downloadViz2dOutput(outputUrl: string): Promise<Buffer> {
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Failed to download Viz2D output: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
