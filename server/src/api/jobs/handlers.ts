import { Request, Response, NextFunction } from 'express'
import * as jobService from '../../services/job.service.js'

/**
 * POST /api/v1/jobs
 * Create a new Viz2D processing job
 */
export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.body

    if (!imageId) {
      res.status(400).json({ error: 'imageId is required' })
      return
    }

    const job = await jobService.createJob({ imageId })
    res.status(201).json(job)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/jobs/:id
 * Get job by ID
 */
export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const job = await jobService.getJobById(id)
    res.json(job)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/jobs/:id/sync
 * Manually sync job status with Viz2D API
 */
export async function syncJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const job = await jobService.syncJobStatus(id)
    res.json(job)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/jobs/:id/stream
 * SSE endpoint for real-time job updates
 */
export async function streamJobUpdates(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    // Verify job exists
    const job = await jobService.getJobById(id)

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
    res.flushHeaders()

    // Send initial state
    res.write(`data: ${JSON.stringify(job)}\n\n`)

    // If already terminal, close immediately
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      res.end()
      return
    }

    // Poll and send updates
    const pollInterval = setInterval(async () => {
      try {
        const updatedJob = await jobService.getJobById(id)
        res.write(`data: ${JSON.stringify(updatedJob)}\n\n`)

        if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
          clearInterval(pollInterval)
          res.end()
        }
      } catch (error) {
        console.error('[SSE] Error polling job:', error)
        clearInterval(pollInterval)
        res.end()
      }
    }, 2000) // Poll every 2 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval)
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/jobs/image/:imageId
 * List jobs for an image
 */
export async function listJobsForImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params
    const jobs = await jobService.listJobsForImage(imageId)
    res.json(jobs)
  } catch (error) {
    next(error)
  }
}
