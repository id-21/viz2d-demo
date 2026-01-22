import * as jobService from '../services/job.service.js'
import * as viz2dFileService from '../services/viz2d-file.service.js'
import * as viz2dClient from '../lib/viz2d-client.js'

const POLL_INTERVAL_MS = 5000 // Poll every 5 seconds
const MAX_POLL_ERRORS = 3 // Max consecutive errors before backing off

let isRunning = false
let pollErrors = 0

/**
 * Process a single job - check status and handle completion
 */
async function processJob(job: Awaited<ReturnType<typeof jobService.getPendingJobs>>[0]) {
  if (!job.viz2dJobId) {
    console.warn(`[JobPoller] Job ${job.id} has no viz2dJobId, skipping`)
    return
  }

  try {
    // Get status from Viz2D API
    const viz2dJob = await viz2dClient.getViz2dJobById(job.viz2dJobId)

    console.log(`[JobPoller] Job ${job.id} status: ${viz2dJob.status}`)

    // Handle different statuses
    switch (viz2dJob.status) {
      case 'COMPLETED':
        await handleJobCompleted(job, viz2dJob)
        break

      case 'FAILED':
        await jobService.failJob(job.id, viz2dJob.failReason || 'Unknown error')
        console.log(`[JobPoller] Job ${job.id} marked as FAILED: ${viz2dJob.failReason}`)
        break

      case 'PROCESSING':
        // Just update the status in our DB
        await jobService.syncJobStatus(job.id)
        break

      case 'PENDING':
        // Still waiting, nothing to do
        break
    }
  } catch (error) {
    console.error(`[JobPoller] Error processing job ${job.id}:`, error)
    // Don't fail the job on network errors - it might recover
  }
}

/**
 * Handle a completed job - download output and upload to GCS
 */
async function handleJobCompleted(
  job: Awaited<ReturnType<typeof jobService.getPendingJobs>>[0],
  viz2dJob: viz2dClient.Viz2DJob
) {
  if (!viz2dJob.outputUrl) {
    await jobService.failJob(job.id, 'Job completed but no output URL provided')
    return
  }

  try {
    console.log(`[JobPoller] Downloading output for job ${job.id}...`)

    // Download the viz2d file from Viz2D API
    const buffer = await viz2dClient.downloadViz2dOutput(viz2dJob.outputUrl)

    console.log(`[JobPoller] Downloaded ${buffer.length} bytes, uploading to GCS...`)

    // Generate filename
    const filename = `${job.image.filename.replace(/\.[^.]+$/, '')}.viz2d`

    // Upload to GCS and create record
    const viz2dFile = await viz2dFileService.createViz2dFile({
      imageId: job.imageId,
      filename,
      buffer,
    })

    console.log(`[JobPoller] Uploaded viz2d file ${viz2dFile.id} to GCS`)

    // Update job with file reference
    await jobService.completeJobWithFile(job.id, viz2dFile.id)

    console.log(`[JobPoller] Job ${job.id} completed successfully`)
  } catch (error) {
    console.error(`[JobPoller] Error handling completed job ${job.id}:`, error)
    await jobService.failJob(job.id, `Failed to process output: ${error}`)
  }
}

/**
 * Run a single poll cycle
 */
async function pollCycle() {
  try {
    const pendingJobs = await jobService.getPendingJobs()

    if (pendingJobs.length > 0) {
      console.log(`[JobPoller] Processing ${pendingJobs.length} pending jobs...`)

      // Process jobs sequentially to avoid rate limits
      for (const job of pendingJobs) {
        await processJob(job)
      }
    }

    // Reset error counter on success
    pollErrors = 0
  } catch (error) {
    pollErrors++
    console.error(`[JobPoller] Poll cycle error (${pollErrors}/${MAX_POLL_ERRORS}):`, error)

    // Back off if too many errors
    if (pollErrors >= MAX_POLL_ERRORS) {
      console.warn('[JobPoller] Too many errors, backing off for 30 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 30000))
      pollErrors = 0
    }
  }
}

/**
 * Start the job poller
 */
export function startJobPoller() {
  if (isRunning) {
    console.warn('[JobPoller] Already running')
    return
  }

  console.log('[JobPoller] Starting background job poller...')
  isRunning = true

  // Run poll cycles continuously
  const runPoller = async () => {
    while (isRunning) {
      await pollCycle()
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }

  runPoller().catch((error) => {
    console.error('[JobPoller] Fatal error:', error)
    isRunning = false
  })
}

/**
 * Stop the job poller
 */
export function stopJobPoller() {
  console.log('[JobPoller] Stopping...')
  isRunning = false
}
