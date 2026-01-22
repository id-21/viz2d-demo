import { Router } from 'express'
import * as handlers from './handlers.js'

const router = Router()

// POST /api/v1/jobs - Create a new job
router.post('/', handlers.createJob)

// GET /api/v1/jobs/image/:imageId - List jobs for an image
router.get('/image/:imageId', handlers.listJobsForImage)

// GET /api/v1/jobs/:id - Get job by ID
router.get('/:id', handlers.getJob)

// POST /api/v1/jobs/:id/sync - Manually sync job status
router.post('/:id/sync', handlers.syncJob)

// GET /api/v1/jobs/:id/stream - SSE for job updates
router.get('/:id/stream', handlers.streamJobUpdates)

export default router
