const API_BASE_URL = import.meta.env.VITE_VIZ2D_API_URL || 'https://api.viz2d.com'

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
      error.message = errorData.message || error.message
      error.code = errorData.code
    } catch {
      // Response wasn't JSON, use default message
    }
    throw error
  }
  return response.json()
}

/**
 * Get a short-lived job token for a visualizer
 */
export async function getJobToken(visualizerId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/v1/visualizers/${visualizerId}/job-token`)
  const token = await handleResponse<string>(response)
  return token
}

/**
 * Create a new processing job
 */
export async function createJob(token: string, inputUrl: string): Promise<Viz2DJob> {
  const response = await fetch(`${API_BASE_URL}/v1/jobs`, {
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
export async function getJobById(jobId: string): Promise<Viz2DJob> {
  const response = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}`)
  return handleResponse<Viz2DJob>(response)
}

/**
 * Poll job status until it reaches a terminal state (COMPLETED or FAILED)
 * @param jobId - The job ID to poll
 * @param onStatusChange - Optional callback for status updates
 * @param pollInterval - Interval between polls in ms (default: 3000)
 * @param maxAttempts - Maximum polling attempts (default: 100)
 */
export async function waitForJob(
  jobId: string,
  onStatusChange?: (job: Viz2DJob) => void,
  pollInterval = 3000,
  maxAttempts = 100
): Promise<Viz2DJob> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const job = await getJobById(jobId)

    if (onStatusChange) {
      onStatusChange(job)
    }

    if (job.status === 'COMPLETED') {
      return job
    }

    if (job.status === 'FAILED') {
      const error: ApiError = new Error(job.failReason || 'Job failed')
      error.code = 'JOB_FAILED'
      throw error
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
    attempts++
  }

  const error: ApiError = new Error('Job polling timeout - exceeded maximum attempts')
  error.code = 'POLLING_TIMEOUT'
  throw error
}

/**
 * Run the complete workflow: get token → create job → poll until complete
 */
export async function runFullWorkflow(
  visualizerId: string,
  inputUrl: string,
  onStatusChange?: (status: string, job?: Viz2DJob) => void
): Promise<Viz2DJob> {
  onStatusChange?.('Getting job token...')
  const token = await getJobToken(visualizerId)

  onStatusChange?.('Creating job...')
  const job = await createJob(token, inputUrl)

  onStatusChange?.('Polling job status...', job)
  const completedJob = await waitForJob(job.id, (updatedJob) => {
    onStatusChange?.(`Job status: ${updatedJob.status}`, updatedJob)
  })

  onStatusChange?.('Job completed!', completedJob)
  return completedJob
}

/**
 * Download a file from URL and trigger browser download
 */
export async function downloadOutput(outputUrl: string, filename?: string): Promise<void> {
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || outputUrl.split('/').pop() || 'output'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
